# Deploy Checkpoints — pending manual flips

> File exists to surface deploys that need a human in the loop. Each
> checkpoint here is something the implementation has staged but
> intentionally left dark or pending external config. **Don should
> read this before any `wrangler deploy` to confirm intent.**

## ⏳ PENDING — Phase 1a anonymous-first send rollout

**Status:** code shipped behind flag; flag is OFF in production.

**Commit:** `1e9df671` ("Window Phase 1a: anonymous-first send foundation")

**What's gated:**
- New KV prefix `window:thread:anon:<anonId>`
- Cookie `md_anon_thread_id` minted on first anon POST (HttpOnly, 90d)
- Per-anonId throttle (5/day) + per-IP-hash throttle
- All four `handleWindow*` handlers branch on `_windowAnonGate(env)`
- `Window Send` Plausible event differentiates `kind: 'anon'` vs `'identified'`

**To enable:**

```bash
# Option A — secret/var via CLI
wrangler secret put WINDOW_ANON_ENABLED
# enter: true
wrangler deploy

# Option B — Cloudflare dashboard
# Workers & Pages → muntin-digital → Settings → Variables
# Add/edit WINDOW_ANON_ENABLED = "true"
# Trigger redeploy.
```

**Pre-flip checklist:**
- [ ] Phase 0 cron has been live for ≥ 7 days with no errors in logs
- [ ] `wrangler tail` shows `Window Send` events firing on existing identified sends
- [ ] Phase 1a step 2 (magic-link claim flow) has shipped — otherwise anon
      visitors are device-bound forever; replies only visible from the same
      browser
- [ ] DMARC `p=quarantine` is set on muntin.digital (manual DNS)
- [ ] Resend quota partition logic has shipped (Phase 1b)

**Rollback:** flip `WINDOW_ANON_ENABLED` back to `"false"` and `wrangler
deploy`. Anon threads in KV survive the flip-off (they just become
unreadable until the flag flips back on).

**Last reminded:** session committed this checkpoint when shipping
`1e9df671`. Ask Claude to revisit when ready to flip.

---

## ⏳ PENDING — Phase 2.5 Twilio SMS dispatch (crisis tier 1)

**Status:** code shipped; secrets not yet provisioned. Until the four
secrets land, `sendCrisisSms` returns `{ skipped: 'sms-not-configured' }`
on every call — feature stays dark.

**Commit:** `<TBD>` (Phase 2.5 — Twilio crisis SMS)

**Required secrets (set via `wrangler secret put`):**

```bash
wrangler secret put WINDOW_CRISIS_SMS_TO       # Don's cell, E.164 (e.g., +19499693876)
wrangler secret put TWILIO_ACCOUNT_SID         # Twilio account SID
wrangler secret put TWILIO_AUTH_TOKEN          # Twilio auth token
wrangler secret put TWILIO_FROM                # Twilio from number, E.164
```

**Behavior:** when a Window message contains a Tier 1 crisis keyword
("kill myself", "end my life", "suicide", ES "suicidio", etc.), the
worker fires an SMS to Don's number with the format
`[Window/urgent] {sender label} — {first 80 chars of message}`.
Rate-limited 3/hour to defeat SMS-DoS.

**Rollback:** delete any of the four secrets via
`wrangler secret delete WINDOW_CRISIS_SMS_TO` — the helper short-circuits
on missing config and SMS dispatch silently no-ops.

**Cost:** Twilio US SMS ≈ $0.0079/msg + ~$1.15/mo for the from-number.
At the 3/hr rate cap, the absolute worst case is 72 messages/day =
~$0.57/day if every hour saw a tier1.

## ⏳ PENDING — Phase 2.6 Resend bounce webhook

**Status:** code shipped; Resend webhook + secret not yet provisioned.
Without `RESEND_WEBHOOK_SECRET`, the endpoint returns 503; without the
Resend dashboard pointing at us, no bounces ever land — the bounce
ledger stays empty and admin replies email through normally.

**Required:**

```bash
# 1. Cloudflare secret
wrangler secret put RESEND_WEBHOOK_SECRET    # value: whsec_... from Resend dashboard

# 2. Resend dashboard webhook
#    URL: https://muntin.digital/api/webhook/resend-bounce
#    Events: email.bounced, email.complained
#    Method: POST (default)
#    Auth: Svix-style signing (Resend's default)
```

**Behavior:** when Resend webhooks a bounce/complaint to us, the
worker verifies the svix-signature header against the secret, hashes
the recipient email, and writes `window:bounce:<emailHash>` with
90-day TTL. The admin reply path skips the outbound email when this
key exists (logs `window.reply.bounce-skipped`); the visitor still
sees Don's reply on next /window/ poll.

**Rollback:** delete the Resend webhook in the dashboard, or
`wrangler secret delete RESEND_WEBHOOK_SECRET` (endpoint then 503's
on every POST). Existing bounce KV rows expire on their 90-day TTL.

## ⏳ PENDING — Phase 2.7 Turnstile gate on anon POST

**Status:** server gate shipped; widget UI in /window/ not yet shipped.
Until `WINDOW_TURNSTILE_ANON_ENABLED` flips on, anon POSTs proceed
without Turnstile (per-IP + per-anonId throttles + threat-score gate
carry the spam floor).

**Pre-flip prerequisites:**

1. `TURNSTILE_SECRET_KEY` already exists site-wide for newsletter +
   magic-link. No new secret needed for the server side.
2. `TURNSTILE_SITE_KEY` exists in env vars for the newsletter widget
   render; the same key works for the Window widget.
3. /window/ composer must add the Turnstile widget element +
   include the script + ensure `cf-turnstile-response` is submitted
   with the form. (Pattern: see `_includes/footer.html` newsletter
   form.) **Not yet shipped — separate commit.**

**To enable (after widget UI lands):**

```bash
wrangler secret put WINDOW_TURNSTILE_ANON_ENABLED   # value: true
wrangler deploy
```

Or via Cloudflare dashboard → Settings → Variables.

**Behavior:** when on, the cookie-minting path (first anon POST per
device) requires a valid Turnstile token. Subsequent POSTs reuse
the cookie and skip Turnstile. Managed mode is invisible 99% of
the time per Cloudflare's own claim.

**Rollback:** flip the flag back to `"false"` and `wrangler deploy`.
Server gate falls back to the existing throttle floor.

## ⏳ PENDING — Phase 3 multimodal R2 + Workers AI provisioning

**Status:** Phase 3.1 data layer shipped (constants + helper lib).
The R2 binding + AI binding ship **commented** in wrangler.jsonc;
all per-modality flags default `"false"`. No multimodal endpoints
exist yet (Phase 3.2/3.3/3.4 land them).

**Pre-flip prerequisites:**

```bash
# 1. Create the R2 bucket
wrangler r2 bucket create muntin-window-attachments

# 2. Enable Workers AI (Cloudflare dashboard → Workers AI →
#    Get started; account-level toggle, not a wrangler command)

# 3. Uncomment the r2_buckets + ai blocks in wrangler.jsonc
#    (search for "Phase 3 (Window redesign)" comment block)

# 4. wrangler deploy
```

**Per-modality flag flips happen later, once the corresponding
endpoint + UI ship:**

- `WINDOW_PHOTO_ENABLED` — flip after Phase 3.2 (photo upload + EXIF
  strip + admin display).
- `WINDOW_VOICE_ENABLED` — flip after Phase 3.3 (voice memo +
  Whisper transcript). Voice has BIPA implications (Illinois /
  Texas / Washington biometric statutes); legal sign-off required
  before flip per plan §10.
- `WINDOW_CALLBACK_ENABLED` — flip after Phase 3.4 (async
  voicenote-pickup callback shim).

**Cost notes (rough order-of-magnitude at 100 sends/day):**
- R2 storage at 30% voice (~500KB avg, 30d retention) + 20% photo
  (~1MB avg, 90d retention) ≈ $0.01/mo storage. Egress free on R2.
- Workers AI Whisper ≈ $0.005/min × 30 voice memos × 1.5 min avg
  ≈ $7/mo at peak.

**Hard limits enforced by code (audit S3 + multimodal review):**
- Per-message attachments: 4 max
- Per-anon lifetime: 12 attachments total
- Per-anon-per-day: 8 MB
- Voice duration: 60s default, 90s hard cap, 5/day, 5 min total/day
- Photo size: 5 MB post-resize, longest edge 2048px
- Voice retention: 30 days (BIPA-conservative)
- Photo retention: 90 days

## (No other checkpoints currently pending)
