# Cloudflare Worker forms runbook

This runbook walks through deploying the Sprint 7 Cloudflare Worker
that replaces the three Formspree endpoints (new-project intake,
restaurant website checklist PDF request, and audit-report email)
with a self-hosted Worker + Resend-powered notifications and
auto-responders.

After this runbook, `/api/intake`, `/api/checklist`, and
`/api/audit-report` are live on the same origin as the main site,
the Formspree subscription can be cancelled, and every form
submission triggers both a notification email to you AND a
branded auto-responder to the person who submitted.

- **Phase A — Deploy the Worker.** Set up Resend, verify the
  domain, set secrets, push the Worker. Production forms still
  post to Formspree the entire time; Phase A has zero customer
  impact. Verified via `/api/ping` and a curl POST to
  `/api/intake`.
- **Phase B — HTML cutover.** In a follow-up commit from the
  assistant (NOT in this runbook), the three form `action=` URLs
  flip from `formspree.io/f/...` to `/api/...`. Only do Phase B
  after Phase A is fully verified.

**Prerequisite:** you already own `muntin.digital` DNS in
Cloudflare. This is already true based on the existing Cloudflare
Pages setup.

## Why we're doing this

Three reasons, in order:

1. **Kills the $60/month Formspree subscription.** Formspree's
   paid tier is only needed for branded auto-responders (the
   Business plan at $60/mo). This Worker does the same thing
   for zero marginal cost — Resend's free tier is 3,000 emails
   a month and we will not come close to that.
2. **Auto-responders with personality, not "Dear valued
   customer."** The Worker's templates (see
   `src/lib/templates.js`) are written in the same voice as
   the rest of the site. Three of them, one per form, each with
   notification + auto-responder variants.
3. **Full control over the payload.** The audit-report endpoint
   in particular carries Sprint 6c fields (overall score,
   restaurant readiness, failing checks, unverified checks, user
   corrections, shareable link). Formspree delivered these as a
   flat list; the Worker uses them to assemble a real score-card
   email that reads as a deliverable, not a receipt.

## Phase A — Deploy the Worker

### Step 1 — Sign up for Resend

Go to [resend.com](https://resend.com/) and create an account.
The free tier (3,000 emails/month, 100/day) is plenty.

Once logged in, you'll land on the **Dashboard**.

### Step 2 — Add + verify the muntin.digital domain

In the Resend dashboard:

1. Click **Domains** → **Add Domain**
2. Enter `muntin.digital` (just the apex, not `www`)
3. Resend will show you a list of DNS records to add. There are
   typically **two** records:
    - One `TXT` record for SPF (starts with `v=spf1`)
    - One `TXT` record (or `CNAME` in some regions) for DKIM
      (usually prefixed with `resend._domainkey`)

4. Open a new tab to **Cloudflare → muntin.digital → DNS →
   Records** and add each record Resend gave you:
    - Type: `TXT` (or `CNAME`, whatever Resend asked for)
    - Name: exactly what Resend shows (the short version, e.g.
      `resend._domainkey`, not the full FQDN)
    - Content/target: copy from Resend verbatim
    - Proxy status: **DNS only** (gray cloud, NOT orange)
      — this is important. Proxied records don't work for DNS
      verification
    - TTL: Auto

5. Back in Resend, click **Verify DNS records**. Usually resolves
   within 30 seconds. If it says "Not verified" wait 2 minutes
   and try again (DNS propagation inside Cloudflare is fast but
   not instant).

### Step 3 — Generate an API key

In Resend:

1. **API Keys** → **Create API Key**
2. Name it `muntin-digital-worker` so you remember what it's for
3. Permission: **Sending access** (default)
4. Domain: **muntin.digital** (restrict the key to only this
   domain — principle of least privilege)
5. Copy the key that starts with `re_...` — you will see it
   **exactly once**. Paste it somewhere safe temporarily (1Password
   / Keychain / your password manager); you'll need it in Step 5

### Step 4 — Install or update Wrangler

On your dev machine:

```sh
npm install -g wrangler
# or if you'd rather not go global:
# npx wrangler --version
```

Then authenticate:

```sh
wrangler login
```

This opens a browser window. Log in with the Cloudflare account
that owns `muntin.digital`. Confirm "Allow" on the consent screen.

Verify you're on the right account:

```sh
wrangler whoami
```

Should print your Cloudflare account email and account ID.

### Step 5 — Set the RESEND_API_KEY secret

From the repo root (the directory with `wrangler.jsonc`):

```sh
wrangler secret put RESEND_API_KEY
```

Wrangler will prompt:

```
Enter a secret value:
```

Paste the `re_...` key from Step 3 and press Enter.

This is a one-time step. The secret is stored encrypted on the
Cloudflare side and injected into `env.RESEND_API_KEY` inside the
Worker at request time. **It is never in the repo, never in git
history, never in `wrangler.jsonc`.**

If you ever rotate the Resend key, re-run this command and paste
the new one. No redeploy required.

### Step 6 — Sanity check `wrangler.jsonc`

Open `wrangler.jsonc` and verify the `vars` block matches your
intended email addresses:

```jsonc
"vars": {
  "FROM_EMAIL":   "Don Goldstein <don@muntin.digital>",
  "NOTIFY_EMAIL": "don@muntin.digital"
}
```

- `FROM_EMAIL` — the address that appears in the **From:** header
  of both the notification emails (to you) and the auto-responder
  emails (to the user). Must be on the verified Resend domain.
  Format: `Display Name <email@domain>` or just `email@domain`.
- `NOTIFY_EMAIL` — where form submissions are forwarded. Change
  if you want notifications to land somewhere other than
  `don@muntin.digital`.

If you want different values, edit, commit, and redeploy. These
are not secrets, just config.

### Step 7 — Deploy

```sh
wrangler deploy
```

Wrangler will:

1. Run the build command from `wrangler.jsonc` (tars the repo
   into `dist/` minus `src/` and a few other excludes)
2. Upload `dist/` as static assets
3. Upload `src/worker.js` as the Worker script
4. Bind `env.ASSETS` to the static-asset server
5. Wire up the routes

Output should end with something like:

```
Uploaded muntin-digital (1.34 sec)
Deployed muntin-digital triggers (1.12 sec)
  https://muntin.digital/*
Current Version ID: abc123...
```

### Step 8 — Smoke test: the ping endpoint

```sh
curl https://muntin.digital/api/ping
```

Expected response:

```json
{
  "ok": true,
  "service": "muntin-digital forms api",
  "sprint": "7c",
  "timestamp": "2026-04-15T20:00:00.000Z",
  "routes": ["/api/intake","/api/checklist","/api/audit-report","/api/ping"],
  "configured": {
    "resend": true,
    "from": true,
    "notify": true
  }
}
```

**All three `configured` values must be `true`.** If `resend` is
`false`, the secret wasn't set — re-run Step 5. If `from` or
`notify` is `false`, the `vars` block in `wrangler.jsonc` is
missing or malformed — fix and redeploy.

### Step 9 — Smoke test: a real intake POST

This sends an actual form submission to `/api/intake`. Use YOUR
email address as the `email` field so you can verify both the
notification and the auto-responder land:

```sh
curl -X POST https://muntin.digital/api/intake \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=Smoke Test" \
  -d "email=don@muntin.digital" \
  -d "services=Website" \
  -d "goals=This is the Sprint 7d smoke test. If you see this, the Worker is wired."
```

Expected response:

```json
{ "ok": true, "status": "sent" }
```

Then check your inbox at `don@muntin.digital`. You should see
**two** emails within ~10 seconds:

1. **Notification:** subject `New project inquiry — Smoke Test`,
   from `Don Goldstein <don@muntin.digital>`, with all the form
   fields laid out cleanly. Hit Reply — the Reply-To should be
   `don@muntin.digital` (the user email you passed in).
2. **Auto-responder:** subject `Got your note — reply within 24
   hours`, same From address, the warmer "Hi Don, Don here..."
   copy from the intake template.

If both arrive, the Worker is fully functional. Congratulations,
you can cancel Formspree now.

If only one arrives, check the Worker logs:

```sh
wrangler tail
```

Then repeat the curl command in another terminal. `wrangler tail`
streams `console.error` output from the live Worker so you can see
which side failed and why.

### Step 10 — Repeat the smoke test for the other two endpoints

**Checklist:**

```sh
curl -X POST https://muntin.digital/api/checklist \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=don@muntin.digital" \
  -d "restaurant=Test Restaurant"
```

**Audit report:**

```sh
curl -X POST https://muntin.digital/api/audit-report \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=don@muntin.digital" \
  -d "audited_url=https://tacombi.com" \
  -d "overall_score=72" \
  -d "restaurant_readiness=83" \
  -d "summary=Overall 72/100 · 2 failing · 3 couldn't verify" \
  -d "failing_checks=Menu is a PDF; Phone number missing" \
  -d "unverified_checks=Ordering; Reservations; Schema"
```

Each should return `{ "ok": true, "status": "sent" }` and drop
two emails in your inbox.

## Phase B — HTML form cutover

**This is the part you don't do manually.** Ping Claude/the
assistant with "Phase A is verified, do the HTML cutover" and
the assistant will make one commit that:

1. Changes the three form `action=` URLs:
    - `formspree.io/f/mvzdgddr` → `/api/intake`
    - `formspree.io/f/mqewawro` → `/api/checklist`
    - `formspree.io/f/mlgadaqy` → `/api/audit-report`
2. Updates the existing fetch() handlers in `assets/site.js` and
   `tools/audits/restaurant/index.html` to expect the new response
   shape (`{ok, status}` instead of Formspree's `{ok, next}`)
3. Removes the Formspree paragraph from `privacy.html`
4. Adds a small note to `docs/` that the migration is complete

After the commit lands and Cloudflare redeploys (~30 seconds),
every form on the live site submits to the Worker.

## Troubleshooting

### `/api/ping` returns `configured.resend: false`

The `RESEND_API_KEY` secret isn't set. Run:

```sh
wrangler secret put RESEND_API_KEY
```

Paste the key. Redeploy is NOT required — secrets take effect
immediately.

### Smoke test returns 500 with "We couldn't deliver your message"

The notification email failed. Run `wrangler tail` and repeat
the curl. Most common causes:

- **Domain not verified in Resend.** The first email from a
  freshly-verified domain can take up to 10 minutes to clear
  Resend's anti-spam holds. Wait and retry.
- **FROM_EMAIL isn't on the verified domain.** Resend will 422
  with "The gmail.com domain is not verified" or similar.
  Check `wrangler.jsonc` — the email after the `<` in
  `FROM_EMAIL` must be on `muntin.digital`.
- **API key doesn't have sending access.** Re-generate with
  **Sending access** explicitly selected in Step 3.

### Smoke test returns 200 with "sent-without-confirmation"

The notification went through but the auto-responder failed.
Most common cause: the email you passed as the `email` field
was the same as `NOTIFY_EMAIL`, and Resend blocked the
auto-responder as a duplicate. Not a real problem — just a
smoke-test artifact. Try again with a different email address
for the `email` field.

### Emails land in spam

- Verify SPF and DKIM are both green in Resend's Domains page
- Add a DMARC record to `muntin.digital` DNS:
  ```
  Type: TXT
  Name: _dmarc
  Content: v=DMARC1; p=none; rua=mailto:don@muntin.digital
  Proxy: DNS only
  ```
  `p=none` is the gentlest policy — it tells receivers to
  report issues but not reject anything. Upgrade to `p=quarantine`
  after you've confirmed SPF/DKIM are passing in receipt reports
  for a week

### I want to roll back to Formspree

Formspree endpoints are still on the Formspree dashboard until
you delete them, so rollback is one commit:

1. Revert the Phase B HTML cutover commit
2. Deploy
3. Forms are back on Formspree

Keep the Formspree subscription paid for the first month after
cutover as a safety net. Cancel it once you've seen a week of
clean Worker traffic.

## Architecture at a glance

```
User → https://muntin.digital/api/intake (POST)
    ↓
  Cloudflare edge
    ↓
  Worker (src/worker.js)
    ↓
  handleIntake(request, env)
    ↓ parse → honeypot → validate → build templates
    ↓
  sendPair({ notification, autoReply }, env)
    ↓ Promise.allSettled([
    ↓   sendEmail({ to: don@,     from: don@, replyTo: user@ }),
    ↓   sendEmail({ to: user@,    from: don@, replyTo: don@  })
    ↓ ])
    ↓
  Resend API (https://api.resend.com/emails)
    ↓
  Notification → don@muntin.digital inbox
  Auto-responder → user's inbox
    ↓
  Worker returns { ok: true, status: 'sent' } to the browser
    ↓
  site.js shows the success state
```

## Files touched by Sprint 7

| File | Role |
|---|---|
| `src/worker.js` | Worker entry point, route table, handlers |
| `src/lib/email.js` | Resend HTTP adapter |
| `src/lib/validation.js` | Required-field, email, length, honeypot helpers |
| `src/lib/templates.js` | 6 email templates (3 notifications + 3 auto-responders) |
| `wrangler.jsonc` | `main` + `vars` blocks |
| `docs/cloudflare-worker-forms.md` | This runbook |

## Files that will change in Phase B

| File | Role |
|---|---|
| `index.html` | Intake form `action` |
| `resources/restaurant-website-checklist/index.html` | Checklist form `action` |
| `tools/audits/restaurant/index.html` | Audit-report form `action` + success/error handlers |
| `assets/site.js` | Intake form submit handler (response shape) |
| `privacy.html` | Remove Formspree paragraph |
