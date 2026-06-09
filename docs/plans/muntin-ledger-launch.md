# Muntin Ledger launch — storefront workstream (GA 2026-11-13)

The storefront side of the Ledger launch plan. The canonical 22-week runbook
(workstreams, claim matrix, legal checklist, T-minus calendar, risk register)
lives in the Ledger repo:
`Muntin-Invoice-Decoder/runbooks/launch-plan-2026-11-13.md`. This doc covers
only what changes in THIS repo.

Strategy (founder-locked): operators land on muntin.digital via SEO and
genuinely useful free tools; the storefront funnels them to
ledger.muntin.digital, the conversion surface (benefits, pricing, sign-up).
Billing is live on launch day with a founding rate for waitlist members.

## Claim discipline (binding here too)

- Real-time language attaches ONLY to the live public Cost Index and the
  operator's own invoices. The opt-in peer pool is k-anonymized and lagged
  four weeks by design — it is "anonymized peer price ranges, opt-in,
  4 weeks lagged," never "real-time peer prices."
- Product name is **Muntin Ledger** (the retired decoder name is blocked by
  `scripts/check-removed-slugs.mjs`).
- Ledger CTAs repeat only what Ledger's own pages state — no invented
  adoption figures, savings claims, or cohort data (`check-fabrications.mjs`
  enforces).

## Workstream (ranked; owners + windows in the canonical runbook)

1. **Extend `data/ledger-cta.json`** from 8 posts to 25–30 cost/margin/vendor
   tagged articles (curate from `data/library-tags.json`;
   `scripts/inject-ledger-cta.mjs` is idempotent and already placed after the
   existing post-end CTA). Target: live by T-30 (Oct 14).
2. **Tool-end "Continue in Ledger" CTAs** on the five highest-intent tools —
   `tools/plate-cost`, `tools/cost-pulse`, `tools/vendor-benchmark`,
   `tools/margin-math`, `tools/menu-engineering` — with the existing
   Plausible event pattern (`Ledger Route Click`) and a `?source=<tool>`
   param the Ledger waitlist/sign-up form records. By T-14.
3. **Cost-index pages**: a "track your real delivered price against this
   read in Ledger" banner across the 16 ingredient pages + hub, injected by
   the page builder (not hand-edited). By T-14.
4. **Tool-state handoff**: plate-cost emits a recipe JSON export that
   Ledger's post-signup onboarding can import ("bring the recipes you just
   costed"). This is the recipes funnel; coordinates with Ledger W1.3.
5. **Email**: wire the existing capture pipeline for launch —
   `TURNSTILE_SECRET_KEY` set, `LIFECYCLE_EMAILS_ENABLED` on, Resend key,
   Plausible Stats token for the KPI snapshot cron. The Ledger-specific
   7-email waitlist drip lives in the Ledger repo
   (`docs/email-drip/ledger/`); the storefront drip stays studio-scoped.
6. **Announcement calendar**:
   - T-7 (Nov 6): blog dispatch announcing the launch (Don's byline,
     founding-rate mention, links from the cost tools it grew out of), wired
     into feed-llm.json / llms-full.txt by the normal build.
   - T-1 (Nov 12): changelog banner.
   - T-0 (Nov 13): nav/CTA destinations flip from waitlist to sign-up.
   - T+7 (Nov 20): "week 1" follow-up dispatch.
7. **Measurement without tracking**: attribution rides URL params only
   (article/tool slug → Ledger `waitlist_signups.source`); no cross-domain
   identifiers, no pixels — both privacy policies hold as written.

## Gates that apply to every item above

`check-all.mjs` — notably `check-fabrications` (also scans .md),
`check-cta-canon` (canonical button text only), `check-banned-words`,
`check-studio-voice-boundary` (Don speaks in first person singular on
marketing surfaces), `check-pricing-consistency` (studio service prices),
locale parity + hreflang stamps for any new EN page's ES mirror, and
`check-removed-slugs` (retired product name).
