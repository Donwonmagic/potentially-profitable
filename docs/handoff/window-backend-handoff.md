# The Window — Backend Handoff

**To:** Backend manager / eng lead
**From:** Design lead (frontend + cross-site routing just shipped)
**Date:** 2026-05-30
**Canonical spec:** [`docs/window-redesign-plan.md`](../window-redesign-plan.md) (v3) — this handoff is the backend-facing index into it, not a replacement.

---

## 1. Context — what just shipped (frontend), what's now on you

The Window's **visual redesign** ("Golden Hour" — light through the pane) and its **cross-site unification** (Muntin Ledger now routes its contact to the Window) just landed on the `claude/muntin-design-audit-WIkpl` branches of **both** repos. That work was **frontend + routing only**. It introduced **one new backend touchpoint** (§2) and surfaced **two cleanup items** (§3). The larger v3 backend program (§4) remains deferred and is yours to scope.

Repos:
- `potentially-profitable` — muntin.digital site **+ the Window Worker** (`src/worker.js`, `src/lib/window*.js`). The Window backend lives here.
- `Muntin-Invoice-Decoder` — the Ledger (Next.js). Its contact now redirects to the Window.

---

## 2. Immediate ask (small, ships the cross-site loop) — the `source` field

The Window composer now submits a new hidden field **`source`** (e.g. `source=ledger`) on `POST /api/window/append`. The client sanitizes it to `[a-z0-9-]`, ≤24 chars. **The backend currently ignores it.**

- **Where to wire it:** `src/lib/window.js` — the append handler reads form fields at ~L163–164 (`form.get('body')`, `form.get('from_lesson')`). Read `form.get('source')` the same way (cap length, allowlist `[a-z0-9-]`), and **thread it through exactly like `from_lesson`**: persist on the message/thread row and surface it to Don in the admin queue + the notification, so he knows a note came from Ledger vs the site.
- **Why it matters:** it's the only thing that makes "one Window for both products" legible to Don. Without it, Ledger inquiries are indistinguishable.
- **Scope:** ~½ day. No schema migration strictly required if you append it to the existing context blob the way `from_lesson` is handled; a first-class `source` column is nicer if you're touching the schema anyway.
- **Optional follow-on:** route/auto-reply could branch on `source==='ledger'` (a Ledger-aware template) — see `src/lib/window-templates.js`. Not required for the loop to work.

---

## 3. Cross-site cleanup (Ledger repo) — your call

The Ledger contact now redirects to the Window; its first-party form was **left intact but unreferenced** (reversible):
- **`/v1/hablanos` backend + `HablanosForm`/`HablanosBody`** are now dead routes (no UI points at them). Decide: keep as a fallback, or schedule deprecation. If deprecating, confirm nothing else (email automations, analytics) depends on `/v1/hablanos` first.
- **Ledger `sitemap.ts`** still lists `/talk-to-us` and `/hablanos` (they now 3xx-redirect to the Window). Consider pruning them from the sitemap so crawlers don't index redirect stubs.
- The redirects are **cross-domain** (`ledger.muntin.digital → muntin.digital/window?source=ledger`). The Window page is same-origin on muntin.digital, so the existing **origin gate / CORS posture is unaffected** — visitors land on the Window directly, not via a cross-origin API call.

---

## 4. Deferred v3 backend program (the real roadmap)

All of the below is **specified in `docs/window-redesign-plan.md`** with rationale, copy, and failure-modes. Phases, flags, and risks are the plan's; this is the index. Everything is gated by **`WINDOW_ENABLED`** (master kill) and per-feature flags (§5).

| Phase | Backend scope | Plan ref | Gating / blockers |
|---|---|---|---|
| **0** | Enable cron: `triggers.crons` in `wrangler.jsonc` is **commented out**; the `scheduled()` handler in `src/worker.js` is **dead code**. Uncomment, confirm budget under `*/5`, observe one cycle. Also: measure 14-day baseline send-rate. | §2.5, §7 | Prerequisite for §8 backstops. Low risk. |
| **1a** | Anonymous-first sends: `md_anon_thread_id` cookie, `window:thread:anon:*` KV, `handleWindowAppend` accepts no-session, per-anonId + per-IP throttles, origin gate. | §2.1, §2.6, §7 | `WINDOW_ANON_ENABLED`. Auth is load-bearing — keep flag OFF until 1b. |
| **1b** | Harden: Cloudflare threat-score gate, **PII pre-write gate** (CC/SSN/password regex, Luhn), `textContent`-only render lint, magic-link claim (`mintMagicLinkToken`, single-use, 15-min TTL, anonId-bound), **DMARC `p=quarantine` + SPF/DKIM** for muntin.digital, **Resend quota partition** (reserve replies). | §2.2, §2.6 | Email-auth posture is a deliverability + anti-phishing must. |
| **2** | Crisis **Twilio SMS** dispatch (Tier-1 keywords → Don's cell), **email-bounce webhook** (Resend→KV→admin flag), **Turnstile** on first anon POST. | §2.6, §3.12, §11.6 | Twilio + Turnstile vendor onboarding; secrets in §5. |
| **3** | Multimodal: **R2 bucket `WINDOW_ATTACHMENTS`** (worker-proxied, CORS-denied), **server-side EXIF strip**, photo (90d TTL); voice (60s, **Whisper transcription**, 30d TTL, delete-transcript affordance). | §2.7–2.9, §6.3 | `WINDOW_PHOTO_ENABLED`, `WINDOW_VOICE_ENABLED`. **Voice needs written legal sign-off (BIPA / biometric retention) before flag-on** — hard gate. Workers AI quota. |
| **4** | `/now` presence: `window:now` KV, three-tier privacy (fuzz default, precise blackout 21:00–06:00), 14-day staleness hide. | §4.4, §11.4 | `WINDOW_NOW_ENABLED`. Additive, low risk. |
| **5+** | Live callbacks (Care-Plan only) via **Twilio masking number**; site-wide pulse propagation. | §4.5, §11.9 | Defer until §9.6 conversion data justifies. |

### Operational backstops (non-negotiable per the plan, §8)
These protect Don from overload and **must accompany the anon flip**, not trail it: auto-pause vital-signs cron (3 tiers), `MAX_NEW_THREADS_PER_DAY` queue cap, client-vs-prospect SLA (12h/36h), admin templates + Don-reviews-every-AI-draft path. Detail in §8.1–8.6.

---

## 5. Secrets & infra checklist (Cloudflare)

Flags already referenced in `src/worker.js` / `src/lib/*` (set as Worker vars/secrets; most default OFF):

- **Flags:** `WINDOW_ENABLED` (+ `WINDOW_ENABLED_OVERRIDE`), `WINDOW_ANON_ENABLED`, `WINDOW_PHOTO_ENABLED`, `WINDOW_VOICE_ENABLED`, `WINDOW_NOW_ENABLED`, `WINDOW_CALLBACK_ENABLED`, `WINDOW_FIELDNOTES_ENABLED`, `WINDOW_AUTOREPLY_ENABLED`.
- **Secrets (`wrangler secret put`):** `WINDOW_CRISIS_SMS_TO` (Don's cell — never in source), `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, `RESEND_API_KEY`. (Turnstile site/secret keys for Phase 2.)
- **Bindings to provision:** KV (window threads/throttles/now/bounce — plan §2.3 says stay in existing `AUTH_SESSIONS` namespace), **R2 `WINDOW_ATTACHMENTS`** (Phase 3), cron `triggers.crons` (Phase 0).
- **DNS/email:** SPF, DKIM, DMARC `p=quarantine` on muntin.digital (Phase 1b).

---

## 6. Open decisions / gates for you to own

1. **Voice biometric legal sign-off** — hard blocker on `WINDOW_VOICE_ENABLED` (BIPA, 30-day retention, delete affordance). Plan §10.
2. **`source` schema** — append-to-context (fast) vs first-class column (cleaner). §2.
3. **Ledger `/v1/hablanos`** — keep as fallback or deprecate. §3.
4. **Anon-flip readiness** — the plan is explicit that 1a+1b+§8 backstops ship *together* before `WINDOW_ANON_ENABLED` flips. Don't flip early.

---

## 7. Key files

- `src/worker.js` — Window routes (`/api/window/{start,append,thread,poll,active,callback,attach}`), `scheduled()` handler (dead until Phase 0), flag reads.
- `src/lib/window.js` — thread/message logic, form-field reads (**add `source` at ~L163**), throttles, IDs (`mintSaveItemId`, `mintMagicLinkToken`).
- `src/lib/window-templates.js` — auto-reply templates (source-aware branch optional).
- `src/lib/window-attachments.js` — attachment plumbing (Phase 3).
- `wrangler.jsonc` — flags, bindings, the commented `triggers.crons`.
- `assets/js/window.js` — client (reads `?source`, posts `source`); for reference only.
- `docs/window-redesign-plan.md` — **the canonical spec.** Start here for any phase.
