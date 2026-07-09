# ADR-011 — Notable price events surface (detection × cited co-occurrence registry)

- **Status:** ACCEPTED (shipped on `claude/vendor-benchmark-redesign-yn273q`)
- **Date:** 2026-07-09
- **Owner:** Cost Index / strategic council
- **Review by:** 2026-10-09
- **Relates to:** ADR-010 (insight grammar — the "never a forecast" ceiling); the absolute fact gate; `cost-index/events.json` (the curated registry); `scripts/build-cost-index-events.mjs`, `scripts/build-cost-index-pages.mjs` (`notableEventsBlock`/`eventsTakeaway`/`emitEventsHubPage`), `scripts/check-cost-index-events.mjs`.

> Decision: surface a "notable price events" layer as **two honest halves joined at
> render time** — a deterministic DETECTION engine (the price magnitudes, pure math)
> and the site's existing curated, CITED market-events registry (the documented WHY),
> shown as **co-occurrence, never causation**. The registry — already fact-gated and
> primary-sourced — is the source of truth for the "why"; interim hand-drafted notes
> were retired.

## Context

The Cost Index measured *what* a price is, and the anomaly log flagged outliers, but
the funnel had no "events that moved the market" surface — the deep-history layer the
founder wanted for SEO/AEO and for operator understanding ("is this the market or my
vendor?"). Two failure modes to avoid: (1) a statistical-outlier list that surfaces
economically trivial blips; (2) asserting *causes* the data can't support (fact-gate
violation, spoken aloud in EN+ES).

A first pass hand-drafted verify-gated cause notes. Then discovery: the repo **already
ships** `cost-index/events.json` — 39 documented U.S. food-commodity events (2001-2026),
each mapped to affected ingredient slugs, primary-cited (USDA/CDC/NOAA/CRS), framed
`co-occurrence-not-causation`, published CC-BY on `/open/` + llms.txt — but never
rendered. That registry is strictly better than hand-drafts (already source-verified,
zero operator verification needed).

## Decision

1. **Detection (deterministic).** `build-cost-index-events.mjs` finds, per ingredient,
   the biggest SUSTAINED departures from a centered ±26-week local median (3-week-smoothed,
   ≥20% floor, top-6, merged in time), each with honest computed context: `durationDays`,
   `inHighSeason` (null under 3 distinct years, so a short series never defines its own
   season from the very spike being flagged), and same-direction `cohort`. No cause, no
   forecast, no Pettitt "step". Own `--check` + `--self-test`.
2. **Join to the cited registry as CO-OCCURRENCE.** On each ingredient page, a detected
   move that overlaps a registry event's window shows that documented event with its
   primary sources, tagged "Documented around this time" / "Evento documentado en esas
   fechas" — never a causal connector. Cohort naming is category-aware (butter↔cheddar
   real; produce shows breadth, not arbitrary pairs).
3. **Operator takeaway.** Each section opens with a computed "what this means for your
   kitchen": a volatility verdict (fix vs float the menu price), median recovery-time,
   and the market-vs-vendor read — operating guidance, not a forecast or sourced claim.
4. **Retire the hand-drafted notes** (`data/cost-index-event-notes.json`) — the registry
   supersedes them.
5. **`/cost-index/events/` hub** renders the whole registry as a browsable, cited,
   category-filterable history joined to detection magnitudes, with Dataset JSON-LD.
6. **Honesty gate** `check-cost-index-events.mjs` (wired into check-all): validates the
   registry shape + co-occurrence framing + https citations; asserts the rendered FRAMING
   (drawers + `data-quoted-source` stripped) never asserts causation or speaks a forecast,
   and every co-occurrence block wears its tag. Quoted registry prose/source titles are
   exempt from the marketing banned-words scan (they're citations, not our voice).

## Consequences

- Numbers are honest-by-construction (pure math); causes are pre-verified + cited (no new
  fact-gate exposure); ES shows Spanish framing with the English source behind a disclosure.
- The registry is now a rendered surface, not just an open-data file — its curation
  workflow (adding events) directly improves the pages.
- ES parity holds structurally; deeper ES needs registry translations (tracked, not blocking).
