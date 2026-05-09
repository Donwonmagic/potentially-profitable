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

## (No other checkpoints currently pending)
