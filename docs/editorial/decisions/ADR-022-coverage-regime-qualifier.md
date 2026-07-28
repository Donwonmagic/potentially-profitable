# ADR-022 — A published average must carry the regime that breaks it

- **Status:** Accepted
- **Date:** 2026-07-28
- **Owner:** Cost-Index / publication thread
- **Review by:** 2027-01-28
- **Relates to:** ADR-010 (citable publication), ADR-011 (notable price events surface),
  ADR-018 (chain presentation architecture — the engine-behind-pages hazard),
  `docs/fact-check.md`, `scripts/check-band-coverage.mjs`.

> Decision: wherever the site publishes a backtested band-coverage rate, it must also
> publish how that rate splits **inside vs outside a detected price episode** — because
> the average is materially better than the rate an operator actually gets in the moment
> they lean on it. Implemented as `scripts/inject-coverage-regime-note.mjs`, gated in
> `check-all.mjs` and re-run by the M/W/F refresh.

## Context

Every ingredient page whose band earns a rate publishes, from
`build-cost-index-pages.mjs` `verifiedNote()`:

> **Verified:** our 80% range caught the next weekly print about 77% of the time
> (74–79%, 1305 reads) · current for its source's cadence.

That number is honest in its own terms. `check-band-coverage.mjs` already exists to keep
it honest, and its header records the principle earned in the 2026-07 statistical-rigor
audit: *"under-coverage is a real, reportable fact, not something to widen away."*

But it is a **lifetime average**, and it hides *when* the misses happen. Measured across
the 67 ingredients that publish a rate (74,208 scored walk-forward reads, 2026-07-28):

| regime | scored reads | coverage |
|---|---:|---:|
| outside a detected price episode | 69,992 | **77.74%** |
| inside a detected price episode | 4,216 | **60.74%** |
| pooled | 74,208 | 76.77% |

The miss rate is **~1.8× higher inside an episode**. A band advertised near an 80% target
ships at ~78% in calm water and ~61% exactly when a price is already moving — which is
the only time an operator consults it. That is the "true on average, misleading in the
case that matters" failure, and it is the same class the fact gate exists to stop; it
simply had not been applied to a *derived* number before.

## Decision 1 — Publish the split beside the average, not instead of it

The average stays. The qualifier lands directly under it, in EN and ES, naming both
rates, the scored-read count, and the miss-rate ratio.

## Decision 2 — Recompute the published band; never borrow a similar one

`data/cost-lockfloat.json` carries a `replay` hit-string per ingredient and is the
obvious thing to reuse. **It is a different band.** `build-cost-lockfloat.mjs` calls
`conformalNext(vals)` at the default **window 26**; the page's sentence calls
`conformalNext(series, { alpha: 0.20, window: 52 })`. A first draft of this work used the
lockfloat replay and would have printed a window-26 measurement underneath a window-52
sentence — a number about one instrument presented as a qualifier of another.

So the injector re-runs the same call, over the same series selection (`bandSeries`: the
deep backfill at ≥ 20 points, else the vendored history), under the same publish gate
(`coverage != null`, not degenerate, `>= 0.75`). The check that the alignment holds is
that the recomputed pooled rate (76.8%) lands on the ~77% the pages themselves print.

**Rule of record: a qualifier must be computed from the same instrument as the claim it
qualifies. "Close enough, same family" is a fabrication with extra steps.**

## Decision 3 — Date each step by its own row, never by assumed spacing

The same draft dated every scored step as `span.from + 7·i`. `seriesCadence()` exists
precisely because part of the panel is **monthly** (beef), so weekly arithmetic
mis-dated every step for those ingredients and mis-assigned them across the episode
boundary. Steps are now dated from the history row they belong to. The warmup offset
(`vals.length − hitSeq.length`, 9 under the current `minResid`) is **derived per slug**,
never assumed.

## Decision 4 — Never put a rate on a page that publishes none

`verifiedNote()` emits the coverage clause **only** when the band genuinely holds; when
it does not, the same `<p class="ci-read__verified">` carries the staleness read alone.
14 EN pages are in that state today. Anchoring on the paragraph would have injected
coverage percentages onto pages that deliberately publish none — strictly worse than the
problem being fixed. The injector therefore requires the **clause**, per locale, and a
page that stops publishing a rate **loses** its qualifier automatically rather than
keeping a stale one. Verified on disk: 134 pages carry the note, 0 scope violations,
EN/ES parity exact at 67 each.

## Decision 5 — The note refuses to publish itself when it stops being true

`guardFailures()` blocks the run — non-zero, no write — when any published rate cannot be
reproduced, when either regime has no scored steps, or when coverage stops being worse
inside episodes. That last one matters: if the relationship ever inverts or flattens, the
correct move is to **rewrite the sentence**, not to keep printing it. The guards are
exported and self-tested rather than trusted.

## Honesty envelope

- An **across-the-panel** figure, labelled as such in both locales. Per-ingredient episode
  counts are far too small to carry a regime rate, so the note explicitly disclaims being
  about the ingredient whose page it sits on.
- Descriptive of the tracked backtest. No forecast, no direction call, no causal claim —
  an episode is a *detected* price move, and the note says coverage is worse during one,
  not that episodes cause misses.

## Consequences

- The most quantitative promise on the site now ships with the condition under which it
  degrades. An operator reading it during a spike is told the band is weaker right then.
- Same engine-behind-pages contract as `inject-provenance-hop.mjs` (ADR-018):
  `build-cost-index-pages.mjs` owns the read card and overwrites it, so the M/W/F refresh
  re-runs this injector and the `--check` in `check-all.mjs` is what fails the deploy if
  it is ever skipped.
- If the panel's regime gap narrows, the number moves on its own; if it inverts, the run
  fails loudly and a human rewrites the claim.

## What would reverse this

- The band being re-fit so coverage is genuinely uniform across regimes — at which point
  the qualifier stops carrying information and should be retired rather than left to
  print a ~1.0× ratio.
- Moving the qualifier into `build-cost-index-pages.mjs` itself, which would remove the
  injector + refresh + `--check` triangle. Reasonable, but only worth doing alongside the
  other read-card injectors, not for this one alone.
