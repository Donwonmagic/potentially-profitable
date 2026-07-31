# ADR-020 — Muntin Ledger launch deferred to 2027; build the data-information company first

- **Status:** Accepted (founder decision 2026-07-30, in session)
- **Date:** 2026-07-30
- **Owner:** Founder (Don Goldstein)
- **Review by:** when a 2027 launch window is chosen, or on evidence the data line is ready to carry a paid product
- **Supersedes:** the 2026-11-13 paid-GA date in **ADR-013** (commercial posture). ADR-013's
  *pricing* decisions — $19/month per location, no enterprise tier — are **NOT** superseded and
  still stand; only its date and its "billing live on launch day" coupling move.
- **Relates to:** `docs/plans/muntin-ledger-launch.md`, `Muntin-Invoice-Decoder/runbooks/launch-plan-2026-11-13.md`,
  `apps/web/lib/launch.ts` (`LAUNCH_DATE_ISO`), `data/sourced-claims.json#ledger_founding_offer_2026`

> Decision: **Muntin Ledger's paid launch moves from 2026-11-13 to 2027.** The company builds a
> reliable data-information business first — the Cost Index and the free operator tools — and the
> Ledger launches on top of an established, trustworthy data line rather than alongside it.

## Context

The 2026-11-13 date was set on 2026-06-09 (`runbooks/launch-plan-2026-11-13.md` §1) with "billing
live on launch day" locked, and ADR-013 (2026-07-09) set the founding rate against it.

The 2026-07-30 two-repo audit found the data line is not yet the reliable thing the product would be
sold on top of:

- 18 of 100 Cost Index feeds had stopped updating (15 of them one upstream), and **nothing reported
  it** — the freshness heartbeat reads the file-wide maximum `asOf`, so one fresh ingredient masked
  every stalled one.
- The vendored market-prior snapshot that the product's inventory valuation depends on had been
  **dead in production for ~12 days**, failing closed, with no gate to notice.
- Two published basket contributors (shrimp, vegetable-oil) are stale enough that the headline
  `basket.asOf` reads 2026-06-01 against a 2026-07-29 review.

Shipping a paid product whose central promise is "it does not guess" on top of a data line with
silent dead feeds would have sold the promise before it was reliably true.

## Decision

1. **The paid launch moves to 2027.** No specific date is set here. A date is a claim; this ADR
   deliberately does not invent one, and no surface should state a launch date until the founder
   sets it and it is registered in `data/sourced-claims.json`.
2. **Priority order is explicit:** the Cost Index and the free tools are the product being built
   now. The Ledger continues in private beta and continues to be developed, but it is not on a
   dated commercial runway.
3. **ADR-013's pricing stands.** $19/month per location, three months free for founding-list
   members, no enterprise tier. What changes is *when* it becomes chargeable, not *what* it is.
4. **The billing build is de-urgentised, not cancelled.** The audit found the founding rate is
   posted publicly but has no SKU, no per-location quantity and no trial in the billing engine
   (`check-pricing-consistency.mjs` prints `NOT BILLABLE TODAY` on every green run). That gap no
   longer sits 15 weeks from a locked launch, so it can be built deliberately rather than under
   deadline — but the standing CI line remains, so it cannot be forgotten.

## Consequences

- **11 shipped strings now state something untrue** — 6 in `apps/web/lib/copy.ts`, 5 in
  `copy.es.ts`, all of the form "Muntin Ledger opens November 13, 2026" / "abre el 13 de noviembre
  de 2026", plus `LAUNCH_DATE_ISO = "2026-11-13"` in `apps/web/lib/launch.ts` which is their declared
  source of truth. These are user-facing and must be reconciled before the next `apps/web` deploy.
  **The storefront is already clean** — `/ledger/` carries "private beta" and "before launch" with
  no date.
- **The pre-launch posture already holds.** `PUBLIC_LAUNCH` defaults to `pre` (pricing hidden,
  waitlist is the public CTA), so no posture flip is needed — only the date claim changes.
- **A structural weakness is now visible:** `LAUNCH_DATE_ISO` is declared "the canonical date … to
  check the strings against", but nothing checks them. Eleven hand-restated copies of a single
  constant, with no gate binding them — the same shape as the `$19` drift this audit found. Any
  reconciliation should add that gate, not just edit the strings.
- **The waitlist keeps its meaning.** Founding members were promised a rate, not a date; the rate is
  unchanged. Anyone told a date, however, was told 2026-11-13, which is why the strings matter.
- `runbooks/launch-plan-2026-11-13.md` and `docs/plans/muntin-ledger-launch.md` are now historical
  for their dates. They are not deleted — the launch *content* (what ships, the claim matrix, the
  funnel topology) remains the plan; only the calendar is void.

## Alternatives rejected

- **Keep 2026-11-13 and fix the data line in parallel.** Rejected: the audit showed the data line's
  failures were invisible, not merely unfinished. Discovering the next one under launch pressure is
  how the "it does not guess" promise gets quietly broken.
- **Set a specific 2027 date now.** Rejected: there is no evidence to date it from yet, and a date
  stated now would be another claim to walk back. The honest posture is "2027, date to be set."
- **Announce the delay publicly.** Not decided here. The strings must stop saying 2026-11-13; whether
  they say "2027", "date to be announced", or drop the date entirely is a separate founder call.
