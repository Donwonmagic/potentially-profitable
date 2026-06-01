# The Window — Provisioning Runbook (Phases 1–4)

**Audience:** Don (owner) — the steps only you can do (secrets, vendor accounts,
DNS, legal). Each phase's *code* is built or buildable behind an OFF flag; this
file is the gate list that lets each flag flip on safely.

> ## ⏸️ RESUME HERE (updated 2026-05-31 — three activations, one deploy)
>
> Three things are fully built + verified and waiting only on you. **Merging to
> main did NOT touch production** — there's no deploy workflow (`.github/workflows/`
> is tests only). A manual **`wrangler deploy`** from your computer is what makes
> all three live, so do them in one sitting and deploy once at the end.
>
> **1. Phase 2.7 — Turnstile bot gate (UI merged in #405).** The composer widget
> now ships on main; only the flag is off. Flip `WINDOW_TURNSTILE_ANON_ENABLED`
> `false`→`true` in `wrangler.jsonc` (line ~230). `TURNSTILE_SECRET_KEY` + sitekey
> already bound (shared with newsletter). Effect: first-time anonymous senders get
> one Cloudflare challenge; signed-in + returning visitors never see it. Fails
> closed. ⚠️ This is a real visitor-facing change on deploy — flip it when you can
> watch one anon send go through.
>
> **2. Phase 2 — Crisis SMS (Twilio).** Account created; trial number
> auto-assigned (so you have SID + Auth Token + a `TWILIO_FROM` number — 3 of 4).
> Remaining:
>   - Verify Don's mobile as a recipient: Console → *Phone Numbers → Manage →
>     Verified Caller IDs* (trial accounts only text verified numbers; likely
>     already done from signup).
>   - Set 4 Worker secrets (Cloudflare → Workers & Pages → `muntin-digital` →
>     Settings → Variables and Secrets, or `wrangler secret put`):
>     `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` (+1…),
>     `WINDOW_CRISIS_SMS_TO` (Don's mobile, +1…).
>   - Test after deploy: send a Window note with a tier-1 crisis keyword; Don's
>     phone should buzz. Code (`src/lib/sms.js`) auto-activates once all 4 secrets
>     exist; silent no-op until then. A2P 10DLC paperwork can wait —
>     trial→verified-number works for the single-recipient crisis alert today.
>   - ⚠️ Don't paste the Auth Token into chat — type it into Cloudflare directly.
>
> **3. Phase 4 — /now/ presence widget.** Fully built + audit-clean. Decision
> made: default tier = **fuzz** (already the code default, no change needed).
> Flip `WINDOW_NOW_ENABLED` `false`→`true` in `wrangler.jsonc` (line ~244), then
> Don posts his first status at `/admin/window/`. Widget stays hidden until he
> posts, so this flip is safe + invisible.
>
> **Then:** one `wrangler deploy` ships the merged Turnstile code + both flag
> flips + picks up the Twilio secrets. Verify each live. (I can PR the two
> `false`→`true` flag edits on request, leaving you just the secrets + deploy.)
>
> Everything else below is reference.

**Plan of record:** `docs/window-redesign-plan.md`. This runbook is the
operational checklist that doc's §2/§7/§8/§11 imply.

**How flags work:** every phase is gated by a `wrangler` env var. Code ships
dark (flag absent/false → behaves as today). You provision, set the secret/var,
`wrangler deploy`, verify, done. Nothing turns on by surprise.

Set a var:    `wrangler secret put NAME`   (secrets — values hidden)
or in `wrangler.jsonc` `vars: { NAME: "true" }` (non-secret flags).

---

## Status legend
- ✅ shipped/live   🟢 code ready, flag OFF   🔨 code still to build   ⛔ blocked on you

---

## Phase 0 — Cron baseline ✅ LIVE
Already enabled (`triggers.crons: ["*/5 * * * *"]`) and running:
- Window batch-flush, watch checks, property rollups, submission sweep.
- **Phase 0 add (merged #402):** `snapshotWindowVitals()` writes
  `window:vitals:<UTC-day>` daily.

**Your only task — confirm it's firing + read the baseline (no code):**
1. Cloudflare dash → Workers & Pages → `muntin-digital` → Settings → Triggers →
   confirm `*/5 * * * *` is listed.
2. Observability/Logs → filter `[cron]` → expect a tick within 5 min; once/day a
   `window.vitals` line.
3. In ~14 days: read `window:vitals:*` KV keys (or Plausible `Window Send`,
   split by `source`/`kind`) for the send-rate baseline.

---

## Phase 8 — Operational backstops
- ✅ **8.1 auto-pause** (merged #402) + frontend (this branch) — *no provisioning.*
  - ⛔ one sub-item: **tier-2 SMS alert to Don** logs a warning today; it needs
    Twilio (see Phase 2). Until then auto-pause still works (disables the
    composer + email lane); Don just isn't texted.
- ✅ **8.2 daily cap** (merged #402) + frontend (this branch) — *no provisioning.*
- 🔨 **8.4 client/prospect SLA** — buildable but needs a **client-identity
  source** (who is a Care-Plan client?). Decide where that signal lives
  (a KV flag set at onboarding? an account field?) and I'll wire 12h/36h.
  Until then it can ship single-tier (everyone = prospect/36h).

**Non-negotiable backstops already in code:** auto-pause, 25/day cap. Still
needed before heavy promotion: admin reply templates + AI-draft-then-Don-reviews
(§8.3) — code-buildable, no provisioning.

---

## Phase 1 — Anonymous-first sends  🟢 code partially present, flag OFF
**Flag:** `WINDOW_ANON_ENABLED` (master), plus keep OFF until 1b lands (plan §2.6).

**What it does:** lets visitors send without signing in (cookie-bound thread),
then claim the thread later via an emailed magic link.

**You provision — EMAIL DELIVERABILITY (the real blocker):**
1. **Resend** — confirm the account + API key exists:
   `wrangler secret put RESEND_API_KEY` (likely already set — verify).
2. **DNS for the sending domain** (muntin.digital) — add at your DNS host:
   - **SPF**: `TXT @  "v=spf1 include:_spf.resend.com ~all"` (merge if one exists).
   - **DKIM**: the CNAME/TXT records Resend's dashboard generates for your domain.
   - **DMARC**: `TXT _dmarc  "v=DMARC1; p=quarantine; rua=mailto:dmarc@muntin.digital"`
     (start `p=none` to monitor, tighten to `quarantine` after a week clean).
   - Verify all three green in Resend's domain panel before flipping the flag —
     magic-link emails to Gmail/Outlook will spam-folder otherwise.
3. **Resend quota partition** — decide a monthly send ceiling for Window magic
   links separate from newsletter, so a spam wave can't burn the whole quota.

**Then:** confirm `mintMagicLinkToken` + KV prefixes `window:thread:anon:*` are
wired (code review), set `WINDOW_ANON_ENABLED=true`, deploy, send a test from a
logged-out browser, claim via the emailed link.

**Spam floor (already in code, verify before launch):** per-IP + per-anon
throttles, 5/day anon cap, PII pre-write gate.

---

## Phase 2 — Crisis SMS + Turnstile  ⛔ vendor onboarding
**Flags:** (SMS has no flag — activates when secrets present) ·
`WINDOW_TURNSTILE_ANON_ENABLED` for the bot gate.

**2a. Twilio (for crisis tier-1 SMS to Don + the 8.1 tier-2 alert):**
1. Create a Twilio account; buy an SMS-capable number.
2. Set secrets:
   - `wrangler secret put TWILIO_ACCOUNT_SID`
   - `wrangler secret put TWILIO_AUTH_TOKEN`
   - `wrangler secret put TWILIO_FROM`        (your Twilio number, E.164)
   - `wrangler secret put WINDOW_CRISIS_SMS_TO`  (Don's mobile, E.164)
3. The dispatch code path exists (`sendCrisisSms`) and is best-effort/rate-limited
   (3/hr); it no-ops cleanly while secrets are absent. Once set, a tier-1 crisis
   keyword (or the 8.1 disabled state) texts Don. Send a test crisis-keyword note.
4. **A2P 10DLC**: US carriers require brand/campaign registration for app-to-person
   SMS. Register in Twilio (can take days) or messages get filtered.

**2b. Turnstile (Cloudflare's CAPTCHA, for first anon POST):**
1. Cloudflare dash → Turnstile → create a widget for muntin.digital → get site key
   + secret.
2. `wrangler secret put TURNSTILE_SECRET_KEY` (shared with magic-link/newsletter —
   may already exist).
3. Add the widget site-key to the composer (small frontend task — I build it).
4. Set `WINDOW_TURNSTILE_ANON_ENABLED=true`. Only the *first* anon POST per device
   is challenged; the cookie trusts subsequent sends.

---

## Phase 3 — Photo + voice attachments  ⛔ infra + LEGAL
**Flags:** `WINDOW_PHOTO_ENABLED`, `WINDOW_VOICE_ENABLED` (voice OFF until legal).

**3a. R2 (object storage for attachments):**
1. Cloudflare dash → R2 → create bucket `muntin-window-attachments`.
2. Uncomment the binding in `wrangler.jsonc` (it's staged, ~L320):
   `"r2_buckets": [{ "binding": "WINDOW_ATTACHMENTS", "bucket_name": "muntin-window-attachments" }]`
3. CORS-deny cross-origin on the bucket (Worker-proxied reads only — plan §2.7).
4. Set `WINDOW_PHOTO_ENABLED=true`. Photo path includes server+client EXIF strip
   (privacy) — verify a test upload strips GPS.

**3b. Workers AI (Whisper transcription for voice):**
1. Cloudflare dash → enable Workers AI; uncomment `"ai": { "binding": "AI" }` in
   `wrangler.jsonc` (~L323).
2. Confirm Whisper quota/pricing fits expected volume.

**3c. ⚠️ LEGAL — voice retention (the hard gate):**
- Voice notes are **biometric-adjacent**. The plan sets BIPA-conservative
  defaults (30-day voice R2 TTL, delete-transcript affordance).
- **Do NOT set `WINDOW_VOICE_ENABLED=true` without written legal sign-off** on:
  a retention policy, a consent line at capture, and a deletion SLA. This is the
  one gate I will not let slip — get the lawyer's email first.

---

## Phase 4 — /now/ presence widget  🟢 code present, flag OFF
**Flag:** `WINDOW_NOW_ENABLED`.
- No vendor/secret. Privacy-tiered (precise / fuzz / private), with a 21:00–06:00
  precise blackout and a cron staleness check (depends on Phase 0 cron — ✅ live).
- **Your task:** decide the default privacy tier (recommend `fuzz`) and confirm
  the blackout window, then set `WINDOW_NOW_ENABLED=true`. Admin sets status via
  the admin panel.

---

## Phase 5+ — Live callbacks (Care-Plan only)  ⛔ deferred by decision
Twilio number-masking for live callbacks. Plan says **defer until Phase 1–3
conversion data exists** — don't build yet.

---

## Cross-repo (Muntin Ledger) — tracked, separate repo
Audit (2026-05-31) found Ledger's contact still POSTs to its **live**
`/v1/hablanos` backend; the `?source=ledger` → Window redirect was **never built**
on the Ledger side. So:
- **Do NOT decommission `/v1/hablanos`** — it's the only working Ledger contact form.
- To migrate: repoint `apps/web/app/(marketing)/_components/HablanosForm.tsx` (+ the
  hero/footer hrefs) at `https://muntin.digital/window?source=ledger` (and
  `/es/window`), THEN retire `apps/api/src/routes/hablanos.ts` + its mount.
- Entity cross-link is already strong on Ledger's side (sameAs + parentOrganization
  + visible footer link). One fix worth doing: the operator name string differs
  ("Donald Goldstein Bushman" in Ledger schema vs "Don Goldstein" in muntin.digital)
  — pin one canonical Person name + shared `@id` across both so AI engines fuse
  the two brands to one human.

---

## The one-glance "what's blocking what"
| Phase | Blocked on (yours) | Flag to flip after |
|---|---|---|
| 1 anon | DNS (SPF/DKIM/DMARC) + Resend quota | `WINDOW_ANON_ENABLED` |
| 2 SMS | Twilio account + A2P 10DLC | (auto on secrets) |
| 2 Turnstile | Cloudflare Turnstile widget | `WINDOW_TURNSTILE_ANON_ENABLED` |
| 3 photo | R2 bucket + binding | `WINDOW_PHOTO_ENABLED` |
| 3 voice | R2 + Workers AI + **legal sign-off** | `WINDOW_VOICE_ENABLED` |
| 4 now | a privacy-tier decision | `WINDOW_NOW_ENABLED` |

Pick any row; tell me when its blocker clears and I'll wire/verify the code and we
flip the flag together.
