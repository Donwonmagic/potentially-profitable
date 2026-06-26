# ADR-010 — Cost Index insight grammar (empowering, evidence-backed, never a forecast)

- **Status:** PROPOSAL (implemented for the hub "What's moving now"; pending ratification + extension)
- **Date:** 2026-06-26
- **Owner:** Strategic council
- **Review by:** 2026-09-26
- **Relates to:** the absolute fact gate (`docs/fact-check.md`, `check-fabrications.mjs`); `check-cost-index-drivers.mjs`; `check-cost-index-editors-note.mjs`; queue item A (Plate emergent-insight catalog, `docs/plans/`); founder directive 2026-06-26 ("simply 'buy'/'re-price' doesn't empower — give market conditions, expected timelines, direct evidence")

> Decision: define the grammar by which the Cost Index turns a measured price
> signal into an **actually actionable** operator insight — magnitude with a
> reference frame, observed persistence, the labelled *why* with its source, a
> single action — and the hard boundary that keeps it honest: it describes what
> **has** happened and what is **measured**, and never predicts what comes next.

## Context

The hub "What's moving now" shipped as thin labels — `Re-price` / `Watch` plus a
one-liner. That tells an operator *that* something moved, not *what it means* or
*what to expect*, so it doesn't build the understanding the product exists to give.
The founder's directive: make the index information empower the user to understand
market conditions and their implications — with expected timelines and direct
evidence.

The tension: "expected timelines" and "what to expect" are exactly the shape of
claim the fact gate exists to stop. A predictive forecast ("romaine drops in two
weeks") is an invention the data can't support and would be spoken aloud in EN+ES.
So the grammar must deliver expectation *without* forecasting.

## Decision — the insight grammar

Every Cost Index insight is composed **only** from gated materials, in this order:

1. **No live cents on the index/hub.** Per the honesty contract, a *price* appears
   ONLY in the per-ingredient **"Market read" cited-data block** (asOf badge +
   provenance drawer + basis disclaimer) — that is the single sanctioned exception
   to "no live cents in evergreen prose." The hub/index stays **price-free**; the
   exact (cited) figure lives one click away via the full read. The weaker-
   confidence trend **%** is likewise never shown. Empowerment on the hub comes
   from the items below, not from raw numbers.
2. **Observed persistence** — `flag.elevatedWeeks`, a *measured* counter ("elevated
   8 weeks"). This is the honest forward signal: how long it has held, never a
   prediction of how long it will. Skipped when the verdict note already says it.
3. **The verdict engine's own note** — `note_en` / `note_es`, the authoritative,
   already-gated reasoning ("up and holding — looks like a real reset, not a blip").
4. **The labelled *why* + its evidence** — a driver **association** from the sourced
   catalog (`data/cost-index-drivers.json`): the `mechanism` text + an Evidence
   `<details>` drawer linking the `source`/`sourceUrl`. Shown **only** when (a) the
   slug is in the driver's `affects[]`, (b) `directionExpected === 'up'`, and (c) the
   measured read is up — honoring the catalog's own rule that a supply-risk backdrop
   never explains an easing print. Always tagged **"(association, not cause)."**
5. **One action + a link to the full read** — `verdict.verb_*`, then the per-slug
   page for the deep evidence (sparkline, usual-range capsule, rank-vs-last-N, cite).

### The boundary (binding)

- **No forecast.** No future tense, no predicted timeline, no "expect prices to."
  Expectation is conveyed only through *measured* persistence + the verdict's
  durability read + the labelled driver — all backward/present-looking.
- **No causation.** Drivers are associations, sourced and labelled, up-read only.
- **No ungated number.** Every digit traces to a `verified:true`, bounded, sourced
  point via the same predicate the per-ingredient page uses.

## Consequences

- The hub now reads as cost *intelligence*, not a ticker — the moat ("modern tools,
  old-fashioned honest") shown, not asserted.
- **Deferred:** the driver catalog carries no Spanish prose, so ES movers get the
  structural enrichment (magnitude + persistence + `note_es` + action) but not the
  English mechanism/evidence drawer. Follow-up: translate `cost-index-drivers.json`
  mechanisms/labels (or add `mechanism_es`) and lift the EN-only guard.
- This grammar is the **first concrete entry of the Plate insight catalog** (queue
  item A): the same inputs→reference-frame→evidence→single-action shape generalizes
  to vendor-vs-market discrimination and the other unity insights.
- **To ratify:** extend the same grammar to the weekly dispatch "what's driving the
  flags" prose and the per-ingredient market-read, then move this ADR to Accepted.
