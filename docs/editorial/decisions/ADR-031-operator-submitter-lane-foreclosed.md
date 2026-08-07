# ADR-031 — The operator-submitter data lane is foreclosed

**Status:** Proposed — awaiting founder ratification (queue Q-019)
**Date:** 2026-08-07
**Owner:** Don Goldstein
**Related:** ADR-013 (gov data-sources policy), ADR-023 (basis is a property of an
observation), ADR-025 (the storefront is an audit file), ADR-033 (the ninety days)

> **Decision.** The Cost Index will **never accept operator-submitted prices** —
> not as a contribution form, not as a "verify this read" widget, not as an
> invoice-derived crowdsourced tier, not behind a login, not with review. Every
> observation the Index publishes traces to a public, re-fetchable government or
> market source, and that provenance is the property that makes the archive
> unfabricatable by anyone including us. This door is closed **now, while closing
> it is free**, because it costs nothing today and costs everything after the
> first submission arrives.

## Context

The submitter lane is the obvious growth mechanism and it is proposed roughly
once a quarter: operators send in what they actually paid, the Index gets a
"measured, delivered price" tier public data cannot provide, coverage grows with
users rather than with founder-hours, and the network effect writes itself.

Three things make it fatal here, and only the first is obvious.

**1. It converts the one growth mechanism into a permanent, undelegatable
founder moderation queue.** A submitted price cannot be accepted unreviewed —
that is the entire fact gate. It cannot be reviewed by an agent session, because
adjudicating whether a stranger's claimed $4.10/lb is a real delivered price, a
promo, a credit-memo artifact, or a mistake is exactly the judgment the fact
gate exists to keep out of a machine's hands. So every submission is founder
minutes, forever, growing with adoption. In a company measured at ~53 hours of
standing obligation against 13-26 available, a queue whose volume scales with
success is a mechanism whose reward is failure.

**2. It destroys the provenance property that makes the archive worth
anything.** Today every published observation is re-fetchable from a public
source by a stranger with no access to Muntin. That is why the archive cannot be
fabricated — not by an adversary and not by us. Admit one submitted number and
the property becomes conditional: some observations are re-fetchable and some
rest on Muntin's word about a private party's invoice. A dated chain of public
reads is a durable asset. A dated chain of public reads *plus some private
assertions* is a dataset with an asterisk, and the asterisk propagates to every
citation of the whole.

This is the SOFR/LIBOR argument and it is correct. LIBOR was a panel of
self-reported submissions with a review process, and the review process was not
what failed — the submission architecture was. The reform replaced reported
prices with observed transactions. A rate built on self-report cannot be made
trustworthy by moderating it harder.

**3. It creates a confidentiality surface with no consent architecture.** A
submitted vendor price is a third party's negotiated commercial term. Muntin has
no data-processing agreement with the operator's vendors, no consent flow with
the operator's own employer if the submitter is an employee, and no answer to a
vendor asking why its contract prices are published beside its name. The
company's very first mandatory repair this quarter (queue Q-002) exists because
this exact hazard was missed once already.

## Decision

### 1. No operator-submitted price ever enters the Index

Not raw, not aggregated, not "≥5 submissions before publishing," not
directionally, not behind a paywall, not as an internal-only calibration input.
Any future feature request of this shape is answered by this ADR rather than
re-argued.

### 2. Product invoice data is not Index data

Muntin Ledger processes real invoices for paying customers. That data stays
inside the customer's tenant, under RLS, and **never crosses into any public or
internal Index surface** — not as a benchmark, not as a coverage backfill, not
anonymized, not aggregated across customers. The Purchases leg and the Index are
two systems that share a vocabulary and share no rows. A customer's invoices are
theirs; nothing sold to one customer is built out of another's.

### 3. The Index grows by source, not by user

Coverage grows by adding public series (ADR-013's NASS/Census/EIA policy) and by
publishing what is **not** known — `/cost-index/refusals/` and
`/cost-index/freshness/` are built from the 100 pre-written `toHigh` blocker
strings and the 42 written structural gap reasons the system already computes.
Publishing refusals is the cheapest confidence artifact available and the honest
substitute for a coverage mechanism that would cost the archive its integrity.

### 4. The claim is stated publicly

The methodology surface says plainly: *the Index publishes only observations a
stranger can re-fetch from a public source; it does not accept submitted prices,
and it never will.* A permanently foreclosed capability stated in public is a
stronger trust artifact than a capability quietly not built.

## Consequences

- **The Index will never have a delivered-price tier.** That tier is what an
  operator most wants and is the one thing public wholesale data cannot supply.
  The honest answer stays the honest answer: public wholesale levels are never
  delivered price, and the Index says so on every surface.
- **Growth stays founder-independent, which is the only kind this company can
  afford.** The refresh workflow runs whether or not anyone is watching.
- **A real acquisition idea is permanently off the table**, and that is the
  cost being knowingly paid.
- **Future sessions stop re-proposing it.** This ADR is the answer. An
  unrecorded decision gets relitigated by the next session — that is the other
  half of the 26% close rate.

## Alternatives rejected

- **Accept submissions but publish only aggregates (≥5 per ingredient-week).**
  Rejected: aggregation hides provenance, it does not repair it. The published
  number still rests on unverifiable private assertions, and the moderation
  queue is unchanged.
- **Accept submissions into a separate, clearly-labeled tier.** Rejected: the
  label does not travel. Citations, answer engines and screenshots quote the
  number, not the tier, and the archive's value is precisely that every number in
  it has one provenance story.
- **Accept them internally as a calibration input only.** Rejected: a private
  input that moves a public number is the worst version — unfalsifiable from
  outside, and it silently voids the re-fetchability claim.
- **Decide later, when someone actually asks.** Rejected explicitly. The
  decision is free today and expensive the day after the first submission
  arrives, because by then there is a submitter to disappoint and a number to
  either publish or throw away.
