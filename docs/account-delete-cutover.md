# Phase 3 cutover runbook — exposing /account/ + delete flow

This runbook validates the Phase 3 destructive-action surface end
to end in production. It mirrors the structure of
`docs/auth-cutover.md`: a sequence of small steps you can stop after
at any point, each verifiable in <5 minutes.

> **Critical:** never run this against your real personal Workshop
> account. Use a throwaway email — Gmail's `+alias` form
> (`dongoldstein.accts+delete-test@gmail.com`) is the cleanest because
> the bounce-mail still lands in the same inbox but every alias is a
> distinct sub on our side.

The flow has six observable states. Each step below names the
observable + the wrangler / KV / Resend assertion that proves it.

---

## Phase A — Account-page + ME-extension preflight

The page calls `/api/auth/me`, `/api/workbench/list`, and
`/api/workbench/watch-list` in parallel on load. Confirm the bindings
+ session are healthy before testing the destructive surface.

### A.1 Sign in with the throwaway

```bash
curl -i -X POST https://muntin.digital/api/auth/magic-link \
  -H "content-type: application/json" \
  -H "origin: https://muntin.digital" \
  -d '{"email":"dongoldstein.accts+delete-test@gmail.com","returnTo":"/workbench/","ts":'"$(date +%s)000"',"hp":""}'
```

Expected: `200 {"ok":true}`. Email arrives at the alias inbox in <5s.
Click the link; lands on `/workbench/` greeting the alias.

### A.2 Visit /account/

Navigate to `https://muntin.digital/account/`. Expected fields:

- **Email**: the throwaway alias
- **Account created**: today's date, formatted "Apr 29, 2026"
- **Last seen**: today's date
- **Saved items**: 0 (you haven't saved anything yet)
- **Watched items**: 0

If any field renders `—` instead, /api/auth/me returned an unexpected
shape; check `wrangler tail` for the corresponding GET log line.

### A.3 Confirm 404 gate (logged-out)

In an incognito tab, hit `https://muntin.digital/account/`. Expected:
404. Same posture as `/workbench/`.

```bash
curl -i https://muntin.digital/account/   # expect HTTP/2 404
```

---

## Phase B — Save + watch some items (so the wipe has work to do)

### B.1 Save 3 items from 3 different tools

Sign back in. Visit each:

- `/tools/seo-grader/` — run on any URL → click Save
- `/tools/speed-test/` — run on any URL → click Save
- `/tools/audits/restaurant/` — run a quick audit → click Save

Visit `/workbench/` — confirm 3 rows show up.
Visit `/account/` — confirm "Saved items" reads `3`.

### B.2 Attach a watch

On `/workbench/`, click `+ Watch daily` on the SEO row.
Visit `/account/` — confirm "Watched items" reads `1`.

### B.3 Verify KV state

```bash
wrangler kv:key list --binding AUTH_SESSIONS --prefix "save:" | head
wrangler kv:key list --binding AUTH_SESSIONS --prefix "watch:" | head
wrangler kv:key list --binding AUTH_SESSIONS --prefix "user:" | head
```

Expected: 3 `save:<sub>:<id>` rows, 1 `watch:<sub>:<savedId>` row,
1 `user:<sub>` row — all sharing the same `<sub>` (sha256 of the
alias email).

---

## Phase C — Destructive flow (the actual test)

### C.1 Reject the wrong typed email

On `/account/`, click "Delete my account…". Type a different email
(e.g. `wrong@example.com`). Submit. Expected:

- Inline error: "That email doesn't match the account on this session."
- No POST fired (check `wrangler tail`).

### C.2 Trigger the request flow

Type the correct alias email. Submit. Expected:

- Form hides; success card "Check your inbox" appears.
- `wrangler tail` shows: `POST /api/auth/account-delete-request → 200`.
- `wrangler kv:key list --binding AUTH_SESSIONS --prefix "delete:"` →
  one new `delete:<TOKEN10>` row with TTL ≤ 15 min.
- Resend dashboard shows a new POST `/emails` 200.
- An email arrives at the alias inbox with subject
  **"Confirm: delete your Muntin Workshop account"**.

### C.3 Verify the GET-confirm prefetch defense

Open the email. **Hover** the "Yes, delete my account" button. Note
the URL; it's `https://muntin.digital/api/auth/account-delete-confirm?token=...`.

Open that URL via `curl` (simulates an email-gateway prefetcher):

```bash
curl -sS -o /tmp/confirm.html -w "%{http_code}\n" \
  "https://muntin.digital/api/auth/account-delete-confirm?token=<paste-token-here>"
```

Expected:

- HTTP 200
- The HTML response contains "Confirm deletion" and a `<form method="POST">`
  to the same endpoint.
- **The wipe did NOT happen yet.** Verify:
  - `wrangler kv:key list --binding AUTH_SESSIONS --prefix "save:"` → still 3 rows
  - `wrangler kv:key list --binding AUTH_SESSIONS --prefix "delete:"` → token row STILL present (GET does NOT consume)

This is the prefetcher-defense step. If it fails — if the GET
performs the wipe — open an issue immediately and **do not flip
the cron on**.

### C.4 Click the email button

Now in the browser, click "Yes, delete my account". Expected:

- POST to `/api/auth/account-delete-confirm?token=...`
- Lands on a "Account deleted" success page (HTTP 200).
- `wrangler tail` shows the POST + a sequence of KV deletes.

### C.5 Verify the wipe

```bash
# All three prefixes should be empty for this sub:
wrangler kv:key list --binding AUTH_SESSIONS --prefix "save:" | grep <sub>
wrangler kv:key list --binding AUTH_SESSIONS --prefix "watch:" | grep <sub>
wrangler kv:key list --binding AUTH_SESSIONS --prefix "user:" | grep <sub>
# And the delete: token is consumed:
wrangler kv:key list --binding AUTH_SESSIONS --prefix "delete:" | head
```

Expected: zero rows under `save:<sub>:`, `watch:<sub>:`, `user:<sub>`,
and the `delete:<TOKEN10>` row is gone (consumed on POST).

### C.6 Verify session cookie cleared

Try to revisit `https://muntin.digital/workbench/` in the same tab.
Expected: 404 (the gate works because the cookie was cleared on POST).

Same for `/account/` → 404.

### C.7 Verify clean re-sign-in

Sign in again with the same alias. Expected:

- Magic link arrives.
- Click → lands on `/workbench/` greeting the alias.
- The list is empty (no leftover saves).
- /account/ shows "Account created: today" (a fresh `user:<sub>` row).

---

## Phase D — Replay safety

### D.1 Replay the consumed delete token

Take the same `delete:<TOKEN10>` URL from step C.4 and click it again.
Expected: 410 page with "This link no longer works".

Already-deleted account → KV row `delete:<TOKEN10>` is gone → the
GET handler short-circuits with 410.

### D.2 Old expired token

Wait 15+ minutes after a request. Click the email link. Expected:
410 (TTL expired).

---

## Rollback

The destructive surface is gated by the `delete:<TOKEN10>` row in
KV. To make it inaccessible without a code release:

```bash
# Disable the request side at the form-tier rate limiter (sets the
# limit to 0/IP/hour for that path, returns 429 to all incoming POSTs).
# Phase 3 follow-up: a config var for this would be cleaner than
# editing the form-tier list — file an issue if rollback ever needs
# to fire in anger.
```

Or simpler: revert the route registration in `src/worker.js`:

```bash
git revert <COMMIT_SHA_OF_PHASE_3>
git push origin main
wrangler deploy
```

The `delete:` KV rows TTL-expire on their own in 15 min, so no
manual cleanup is required.

---

## Reference

- Worker handlers: `src/worker.js` — `handleAuthAccountDeleteRequest`,
  `handleAuthAccountDeleteConfirm`
- Email template: `src/lib/templates.js` (+ `templates.es.js`) — `accountDeleteEmail`
- /account/ pages: `account/index.html` + `es/account/index.html`
- Page gate: `src/worker.js` — `workbenchPaths` set (404 for anon)
- Plausible event: `Workbench Account Delete Request` (props: locale)
