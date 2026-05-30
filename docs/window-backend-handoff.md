# Handoff — The Window backend

**From:** Design lead · **Date:** 2026-05-30
**Repos:** `potentially-profitable` (muntin.digital + the Worker), `Muntin-Invoice-Decoder` (Ledger)
**Plan of record:** [`docs/window-redesign-plan.md`](./window-redesign-plan.md) — the v3 plan is the bible for the phased work below.

---

## 1. What just shipped (frontend) — and what it now expects from the backend

The Window got a **visual redesign** (Golden Hour) and was **unified as the contact surface for both sites**. Two frontend changes have backend implications:

**a) Cross-site source tag — `?source=ledger`.** Ledger now routes all contact to
`muntin.digital/window?source=ledger` (and `/es/window?…`). The page's
`assets/js/window.js` sanitizes the param (`[a-z0-9-]`, ≤24 chars) and submits it on a
new **hidden `source` field** with the note (same multipart POST to `/api/window/append`).

> **The form sends `source` today; the backend does not yet read or store it.**
> Right now it is silently dropped. See §2.

**b) Everything else is frontend-only** (CSS, the welcome line, the solid-Pane logo).
No backend dependency.

> **Origins:** Ledger visitors *navigate* cross-domain to muntin.digital and then POST
> **same-origin** to the Worker — so there is **no new CORS surface**. The existing
> `isOriginAllowed` anon gate still applies normally.

---

## 2. P0 — small, ship-now backend task (the cross-site tag)

Capture and use the `source` field so Don knows which property an operator came from:

| Task | Where | Notes |
|---|---|---|
| Read `source` in the append handler | `src/worker.js` (`/api/window/append`, ~L399) + validator in `src/lib/window.js` (~L142–150) | Allowlist it: `ledger \| digital \| blog \| tool \| ''`. Reject/blank anything else. |
| Persist it on the thread (or first message) | thread/msg schema `src/lib/window.js` (~L15–19) | Add `source` to the **thread** record (preferred) so the whole thread is tagged, not just msg 1. Minor schema addition. |
| Surface it in the admin inbox | `admin/window/` + `assets/js/admin-window.js` | A small "from Ledger" chip on the thread row. Optional: route SLA / auto-reply by source. |
| Plausible | — | `Window Send` event already exists; consider adding `props.source`. |

This is the only backend item created by the cross-site work. Everything below is the
**pre-existing deferred roadmap**.

---

## 3. The deferred Window phases (the real backend program)

These were intentionally **not** built — they are flagged, and several need
**secrets + legal sign-off + vendor onboarding**. Full spec in `docs/window-redesign-plan.md`
§2, §7, §8, §11. Summary:

| Phase | Scope | Flag | Blockers the backend owns |
|---|---|---|---|
| **0** | Enable cron; measure 14-day baseline send-rate | — | Uncomment `triggers.crons` in `wrangler.jsonc` (~L305–307); `scheduled()` in `src/worker.js` (~L670–700) is **dead code today**. Confirm budget under `*/5`. |
| **1a/1b** | Anonymous-first sends (cookie-bound thread, magic-link claim), spam/throttle/PII gates, DMARC/SPF/DKIM, Resend quota partition | `WINDOW_ANON_ENABLED` | KV prefixes `window:thread:anon:*`, throttles; magic-link token (`mintMagicLinkToken`); **must stay OFF until 1b lands** (plan §2.6). |
| **2** | Crisis Tier-1 SMS dispatch; email-bounce webhook; Turnstile on first anon POST | — | **Twilio** + **Turnstile** vendor onboarding. |
| **3** | Photo + voice to **R2** (server + client EXIF strip, delete-transcript, BIPA 30d voice retention) | `WINDOW_PHOTO_ENABLED`, `WINDOW_VOICE_ENABLED` | New R2 binding `WINDOW_ATTACHMENTS`; Workers AI (Whisper) quota; **voice OFF until written legal sign-off**. |
| **4** | `/now/` presence widget (three-tier privacy, fuzz default, 21:00–06:00 precise blackout) | `WINDOW_NOW_ENABLED` | KV `window:now`; cron staleness check. |
| **5+** | Live callbacks (Care-Plan only) via **Twilio masking**; wider site propagation | various | Defer until Phase 1–3 conversion data. |

**Operational backstops (non-negotiable, plan §8):** auto-pause vital-signs cron,
`MAX_NEW_THREADS_PER_DAY=25` cap, client-vs-prospect SLA (12h / 36h), admin templates +
AI-draft-then-Don-reviews. These protect Don from his own success — ship requirements,
not nice-to-haves.

---

## 4. Secrets & infra to provision

- **Cloudflare secrets:** `WINDOW_CRISIS_SMS_TO`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
  `TWILIO_FROM`, Resend API key.
- **Bindings:** KV (stay in `AUTH_SESSIONS`, plan §2.3); R2 bucket `WINDOW_ATTACHMENTS`
  (Worker-proxied, CORS-deny cross-origin).
- **Flags (env):** `WINDOW_ENABLED` (master kill, `src/worker.js` ~L5847) + the per-phase
  flags above.
- **Cron:** one `*/5 * * * *` multi-step dispatcher (plan §2.5).

---

## 5. Decision item — Ledger's old contact backend

Ledger's first-party contact form (`HablanosForm` → **`/v1/hablanos`** in the Ledger
Worker) is now **bypassed**: the `/talk-to-us` + `/hablanos` routes redirect to the Window,
and every contact link points at the Window. The components and the `/v1/hablanos` backend
are **left in place but unreferenced** — a reversible routing change.

- **Decision:** decommission `/v1/hablanos` (and prune `/talk-to-us`, `/hablanos` from
  `apps/web/app/sitemap.ts`), or keep it warm as a fallback. Nothing breaks either way; it
  simply no longer receives traffic.

---

## 6. Quick file map

- **Worker + window lib:** `src/worker.js`, `src/lib/window.js`, `src/lib/window-templates.js`,
  `src/lib/window-attachments.js`
- **Endpoints:** `/api/window/{start,append,thread,poll,active,callback,attach}`
- **Admin:** `admin/window/index.html`, `assets/js/admin-window.js`
- **Client:** `assets/js/window.js` (+ `window-state/photos/callback/voice/handoff.js`)
- **CI / a11y:** `.github/workflows/window-a11y.yml`, `scripts/check-window-locale-parity.mjs`
- **Plan of record:** `docs/window-redesign-plan.md`
