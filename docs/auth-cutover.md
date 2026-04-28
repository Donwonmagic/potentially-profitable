# Sprint 0 cutover runbook — exposing magic-link auth

This runbook walks through turning on the Sprint 0 auth foundation
in production. Sprint 0 (commit `0814b20e`) wired the four
`/api/auth/*` routes and the `/workbench/` 404 gate, but did NOT
provision the production KV namespace or set the cookie-signing
secret. Until those two steps land, the auth routes return `503`
and `/workbench/` 404s for everyone.

The runbook is split into three phases so you can verify each
before committing to the next.

- **Phase A — Provision.** Create the KV namespace, set the
  cookie secret, paste the namespace id into `wrangler.jsonc`.
  Zero user-visible change — auth routes start returning real
  responses but no one knows the routes exist.
- **Phase B — Smoke test.** Send yourself a magic link, click
  it, confirm `/workbench/` greets you. Sign out. Confirm
  `/workbench/` 404s again.
- **Phase C — Expose.** Phase 2 ships the public sign-in page,
  the nav link, and the Workbench UI. After Phase C, real
  operators can sign in.

You can stop after Phase B and the system is in a clean
"plumbed but private" state indefinitely. Phase C is a separate
deploy.

---

## Phase A — Provision (do this once)

### A.1 Create the KV namespace

```bash
wrangler kv:namespace create AUTH_SESSIONS
```

Expected output:

```
🌀 Creating namespace with title "<worker-name>-AUTH_SESSIONS"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
[[kv_namespaces]]
binding = "AUTH_SESSIONS"
id = "abc123def456..."
```

Copy the id (the 32-char hex string).

### A.2 Paste the id into wrangler.jsonc

Open `wrangler.jsonc`, find the `kv_namespaces` block, and replace
the placeholder:

```diff
   "kv_namespaces": [
     { "binding": "AUDIT_SNAPSHOTS", "id": "f661208f47644e32bfe965e46f42f88a" },
-    { "binding": "AUTH_SESSIONS",   "id": "REPLACE_WITH_AUTH_SESSIONS_ID_FROM_WRANGLER" }
+    { "binding": "AUTH_SESSIONS",   "id": "abc123def456..." }
   ]
```

Commit the change to `main`. Don't deploy yet — we still need the secret.

### A.3 Set the cookie-signing secret

```bash
openssl rand -hex 32 | wrangler secret put AUTH_COOKIE_SECRET
```

Expected output:

```
🌀 Creating the secret for the Worker "<worker-name>"
✨ Success! Uploaded secret AUTH_COOKIE_SECRET
```

Confirm via `wrangler secret list`:

```
[
  { "name": "AUTH_COOKIE_SECRET", "type": "secret_text" },
  { "name": "GOOGLE_PLACES_KEY",  "type": "secret_text" },
  { "name": "PSI_API_KEY",        "type": "secret_text" },
  { "name": "RESEND_API_KEY",     "type": "secret_text" }
]
```

**Do not lose or rotate this secret without a coordinated deploy.**
Rotating invalidates every active session immediately. If you must
rotate, see the rotation note at the bottom of this doc.

### A.4 Deploy

```bash
wrangler deploy
```

Expected: a normal Workers Static Assets deploy. The new auth
routes are live but unreachable from any link on the site.

### A.5 Verify the plumbing

```bash
# Should return 401 (no cookie)
curl -i https://muntin.digital/api/auth/me

# Should return 404 (anonymous gate)
curl -i https://muntin.digital/workbench/

# Should return 405 (POST only) — not 503
curl -i https://muntin.digital/api/auth/magic-link
```

If any of these returns `503 service-unavailable`, something is
misconfigured. Check `wrangler kv:namespace list` (id matches
`wrangler.jsonc`) and `wrangler secret list` (`AUTH_COOKIE_SECRET`
present).

---

## Phase B — Smoke test (do this once after Phase A)

### B.1 Send yourself a magic link

```bash
curl -i -X POST https://muntin.digital/api/auth/magic-link \
  -H "content-type: application/json" \
  -H "origin: https://muntin.digital" \
  -d '{"email":"don@muntin.digital","returnTo":"/workbench/","ts":'"$(date +%s)000"',"hp":""}'
```

Expected: `200 {"ok":true}`. Email arrives within 5 seconds.

If the email doesn't arrive within a minute:
- Check Resend dashboard logs for the request id
- Confirm `RESEND_API_KEY` is the production key
- Confirm `FROM_EMAIL` in `wrangler.jsonc` resolves to a Resend-verified domain

### B.2 Click the link

The email contains a single CTA. The link looks like:

```
https://muntin.digital/api/auth/verify?token=ABC123XYZ4&returnTo=%2Fworkbench%2F
```

Click it. The browser should land on `https://muntin.digital/workbench/`
showing **"Hello, don@muntin.digital."**

If you see "Coming soon" instead, the cookie didn't get set —
inspect dev tools network tab for the `Set-Cookie` header on the
`/api/auth/verify` response. It must include all of:

```
md_session=...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000
```

### B.3 Verify KV state

```bash
wrangler kv:key list --binding AUTH_SESSIONS
```

Expected: a `user:<sha256>` row (your account record). The
`magic:<TOKEN>` row should be GONE — it's one-shot consumed on
verify. If it's still there, the delete failed and you have a
replay vulnerability — investigate.

### B.4 Sign out and confirm the gate

In the browser, click the "Sign out" button on `/workbench/`.
You should land on `/`. Re-visit `/workbench/`. You should see
the standard 404 page. The gate is working.

### B.5 Replay the magic link

Click the original email link a second time. You should see the
custom 410 page **"This link no longer works."** with a request
to ask for a new one. This confirms one-shot consumption.

### B.6 Smoke-test in Spanish

```bash
curl -i -X POST https://muntin.digital/api/auth/magic-link \
  -H "content-type: application/json" \
  -H "origin: https://muntin.digital" \
  -d '{"email":"don@muntin.digital","returnTo":"/es/workbench/","ts":'"$(date +%s)000"',"hp":"","locale":"es"}'
```

Expected: email subject is **"Tu enlace de acceso al Taller de Muntin"**.
Click → land on `/es/workbench/` showing **"Hola, don@muntin.digital."**
in Spanish.

If everything passes, the auth foundation is verified in production.
You can stop here and the system is safe to leave indefinitely —
no one can find the auth surface unless they know the routes exist.

---

## Phase C — Expose the auth (Phase 2 of the Workshop roadmap)

Phase 2 ships the public surface that turns the foundation into a
usable feature. This is a separate code change, not a deploy step.

After Phase 2 ships:

- `/sign-in/` and `/es/sign-in/` are public pages with a magic-link
  request form
- The nav shows a small "Sign in" link for anonymous visitors and
  hides it for signed-in operators
- `/workbench/` is a real page that lists the operator's saved
  audits and tools
- One tool (SEO Grader, the proof tool) ships with a "Save to my
  Workbench" button on its result UI

The KV namespace and cookie secret you set up in Phase A continue
to do the right thing — Phase 2 doesn't touch the auth contract.

---

## Rollback

If Phase A or B reveals a problem you can't fix in 15 minutes,
roll back without losing data:

```bash
# Revert the wrangler.jsonc commit (keeps the KV namespace alive
# but unreferenced by the worker)
git revert <COMMIT_SHA_OF_PHASE_A>
git push origin main
wrangler deploy
```

This puts the worker back in the "Sprint 0 plumbed but private"
state where `/api/auth/*` routes return `503 service-unavailable`
and `/workbench/` 404s. The KV namespace and the secret are
preserved — re-doing Phase A is a 30-second operation when you're
ready.

To completely remove the namespace (only after you're sure you
won't roll back into auth):

```bash
wrangler kv:namespace delete --binding AUTH_SESSIONS
wrangler secret delete AUTH_COOKIE_SECRET
```

---

## Key rotation (for the future)

To rotate `AUTH_COOKIE_SECRET` without signing out every active user:

1. Generate the new secret: `openssl rand -hex 32`
2. Set it as `AUTH_COOKIE_SECRET_NEXT` (a sibling secret).
3. Update `src/lib/auth.js` to read both secrets and pass them as
   an array to `verifySession`. The current cookie format already
   supports this — `verifySession` accepts an array.
4. Update `handleAuthVerify` to sign new sessions with the NEXT
   secret.
5. Deploy. Existing sessions verify under the old key; new sessions
   sign under the new key.
6. After 30 days (the session TTL), every active session has been
   re-signed under the new key.
7. `wrangler secret delete AUTH_COOKIE_SECRET` (the old one).
8. Promote `AUTH_COOKIE_SECRET_NEXT` to `AUTH_COOKIE_SECRET` and
   revert the dual-key code.

This is a future-proof contract; no code changes needed for Sprint 0.

---

## Reference

- Auth library: `src/lib/auth.js`
- Worker handlers: `src/worker.js` (search for `handleAuth`)
- Email templates: `src/lib/templates.js` and `templates.es.js` (`magicLinkEmail`)
- Privacy gate script: `scripts/check-workbench-private.mjs`
- Wrangler bindings: `wrangler.jsonc` (`kv_namespaces`, `vars`)
- Smoke-test commands above match the adversarial test suite that
  passes locally via Node SubtleCrypto (see commit `0814b20e`).
