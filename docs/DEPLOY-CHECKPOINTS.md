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

## (No other checkpoints currently pending)
