# ADR-030 — One price, one cohort, no billing code

**Status:** Proposed — awaiting founder ratification (queue Q-019)
**Date:** 2026-08-07
**Owner:** Don Goldstein
**Supersedes:** ADR-013 (commercial posture: $19/location; enterprise parked post-GA)
**Related:** ADR-024 (the queue), ADR-025 (the storefront is an audit file),
`Muntin-Invoice-Decoder/docs/ux/decisions/ADR-013` (no billing code, product side),
`Muntin-Invoice-Decoder/docs/ux/decisions/ADR-012` (the closed month statement)

> **Decision.** Muntin sells a **signed monthly close** at **$600 per location per
> month**, hand-invoiced, to a first cohort hard-capped at **ten locations** and a
> lifetime ceiling of roughly **forty**. The five currently posted prices — Solo
> $25, Team $60, Accountant $150, accountant seat $30, founding $19/location —
> **all come down**, replaced by "Pricing set at the close of the pilot" until the
> pilot closes. The **2026-11-13 paid GA date and the "three months free" term are
> withdrawn**, not rescheduled. **No billing code is written for the first cohort
> at all** — no Stripe SKU, no checkout surface, no `priceIdForTier` branch, no
> per-location quantity source. An invoice is a PDF and an email. For the first
> cohort the term is **$600 billed monthly**, not $6,000 billed annually; the
> annual-in-peak term is offered at first renewal in May 2027.

## Context

Five prices are posted in public copy. Exactly one coherent thing can be said
about them: nothing.

- `apps/web/lib/pricing-constants.ts` marks the founding rate `billable: false`,
  and its own comment enumerates the four-part gap — no $19 SKU in
  `stripe-tiers.ts`, no fourth branch in `priceIdForTier`, no
  `STRIPE_PRICE_FOUNDING` env field, and `trial_period_days` set nowhere, so the
  "three months free" term was never implemented in any form.
- Solo ($25) and Team ($60) are `per_account` with **no location cap**, so a
  three-location founding member pays $57 against an unlimited-location $25
  tier. The posted 150-invoice Solo cap is enforced nowhere.
- Checkout quantity is `seats` (Solo caps `maxSeats` at 1) rather than a count of
  locations, so the per-location basis of the posted rate has no representation
  in the billing engine.
- `check-pricing-consistency.mjs` prints "NOT BILLABLE TODAY — founding
  ($19/per_location)" on every green run. The registry is honest; the storefront
  is not.

The GA date is worse than unimplemented — it is badly chosen. Three months free
from mid-November puts the first charge in mid-February, against Census MARTS
seasonal medians of 0.913 in January and 0.917 in February: the second-worst
cash month of the restaurant year. A locked launch date with no billing engine
behind it is a promise the company cannot keep, on a date it picked badly.

Against that, the strategy of record is a $600/location/month signed close sold
to roughly forty locations ever. **Forty customers do not need a billing
system.** They need forty invoices a month, which is a spreadsheet and an email
client. Every prior plan budgeted an hour for a "billing rebuild" that the
registry documents as a four-part gap, and then spent the hour elsewhere.

There is also a calendar contradiction the strategy stated and never resolved:
"$6,000 billed annually, in the May-August seasonal peak" cannot be honored by a
Phase 3 that runs 2026-10-16 to 2026-11-06. Either the pilot opens off-peak and
asks an independent for six thousand dollars heading into the January trough —
the exact objection used to kill the November GA — or first revenue slips to May
2027, nine further zero-revenue months. Stated and unreconciled, that decision
gets made by drift.

## Decision

### 1. One price, one basis, one unit

**$600 per location per month.** Quantity is locations. There are no seats, no
invoice quotas, no tiers, no trial, and no enterprise tier — the posted
per-location rate *is* the group offer, which is the one thing ADR-013 got right
and which survives.

The price is anchored to the object being sold: a dated, signed statement of
food cost where the four legs foot on screen. Comparable services floor at ~$350
and deliver a rolling 24-48-hour turnaround with a human in the loop; a fixed
monthly close date is a promise their structure cannot make and one employed
person can.

### 2. The first cohort is billed monthly, by hand

**Cohort one: $600, invoiced monthly, by hand, in arrears after the close is
delivered.** This resolves the calendar contradiction rather than restating it:
$600 in November is not $6,000 in November, so the January-trough objection does
not apply, and no independent is asked to prepay a year for a product with three
customers and no track record.

**The annual term ($6,000, in the May-August peak) is offered at first renewal**,
from May 2027 — to customers who by then have received six or seven signed
closes and can price the risk themselves. Annual-in-peak is a good doctrine
applied to a relationship that exists; it is a bad doctrine applied to a stranger.

### 3. No billing code for the first cohort

No Stripe SKU. No checkout surface. No `priceIdForTier` branch. No
`STRIPE_PRICE_*` field. No `trial_period_days`. No per-location quantity source.
Nothing in the billing engine changes to support this price, because for forty
customers ever the billing engine is not on the critical path and every hour
spent on it is an hour not spent making the number true.

`pricing-constants.ts` collapses to **one entry**: `{ cents: 60000, basis:
"per_location", billable: false, reason: "hand-invoiced by design (ADR-030);
first cohort is ten locations and no checkout surface exists" }`. The gate keeps
printing NOT BILLABLE, and that line is now a **statement of the design**, not a
confession of a gap.

### 4. The 2026-11-13 GA and the three-months-free term are withdrawn

Withdrawn, not rescheduled — no replacement date is set. The pilot opens when
the day-30 and day-60 checkpoints clear (ADR-033), and not on a calendar date
chosen before the product had been run once by its own founder. Every string
carrying that date or that term is removed from both repos; queue Q-011 does the
work and `check-queue --grep-absent "2026-11-13"` proves it.

### 5. Five posted prices come down today

Until the pilot closes, every public pricing surface reads **"Pricing set at the
close of the pilot."** A posted price nobody can be charged is not marketing; it
is a claim, and this company's whole position is that its claims are checkable.

## Consequences

- **Revenue is later and smaller on paper, and real.** Ten locations at $600
  monthly is $6,000/month at cohort completion, against a $288K ARR ceiling at
  forty locations. That is a very good one-person business and is described as
  one, never dressed up as a venture.
- **The billing gap stops being latent debt and becomes a design.** The four-part
  gap in `pricing-constants.ts` is no longer something to fix before launch.
- **Hand-invoicing has a hard ceiling and that is the point.** Forty invoices a
  month is real founder work; when it stops being tolerable, that is the signal
  to build billing — driven by a measured burden rather than by a launch date.
- **`check-pricing-consistency.mjs` needs no new branch**, and the one entry left
  in the registry can be asserted exactly.
- **A cohort-two price is not decided here.** The day-60 and day-90 checkpoints
  (ADR-033) can each falsify $600; `deskMinutesPerClose` is instrumented from
  customer one precisely so the ceiling is measured rather than assumed.

## Alternatives rejected

- **Keep $19/location and ship billing.** Rejected on arithmetic: at $228/year
  per location, every human-touch channel is foreclosed, and this product is sold
  by a conversation with an owner. It is also the price that produced the
  incoherence — $57 for three founding locations against an unlimited-location
  $25 tier.
- **Reschedule GA to a better month.** Rejected: the defect is not the month. A
  GA date is a promise about readiness made by someone who has not run the
  product, and the founder walk (Q-001) has not happened yet.
- **$6,000 annual prepay for cohort one, in the peak.** Rejected on the calendar:
  Phase 3 lands in October-November. Waiting for May 2027 costs nine zero-revenue
  months to preserve a cash-timing doctrine that a monthly term dissolves.
- **Build minimal billing anyway "so it is ready."** Rejected: it was budgeted at
  an hour by four separate plans and delivered by none. Ten customers who cannot
  be charged automatically is not a problem; ten customers who received a number
  that was wrong is a fatal one.
- **Per-invoice or percentage-of-savings pricing.** Rejected and foreclosed:
  variable cost is roughly half a cent per document, so flat-rate is a structural
  advantage competitors paying a model call per document cannot copy — and
  `fair-price-gap.js` already states on the record that wholesale data alone
  cannot prove overpayment, so the product cannot bill on a saving it is unable
  to measure.
