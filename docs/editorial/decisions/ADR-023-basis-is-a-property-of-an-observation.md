# ADR-023 — A basis is a property of an observation, and a gate must be shown to fail

**Status:** Accepted
**Date:** 2026-08-07
**Owner:** Don Goldstein

> **Decision.** Basis is a property of an **observation**, never of a series, a
> file header, or an ingredient. One predicate — `mayRenderAsDollars` in
> `scripts/lib/basis.mjs` — is imported by both the renderer and the gate, so they
> cannot drift. And every honesty gate must ship a **mutation proof**: a mode that
> reintroduces the defect class it claims to catch and asserts the gate goes red.
> A gate that has never been shown to fail is not evidence.

## Context

`cost-index/feed.json` published:

```
ground-beef   reference.priceUsd = 393.06   source = "bls"   basis = "wholesale"   unit = "lb"
```

while `cost-index/index.json` published `$5.51/lb` for the same slug on the same
day. Seventy-one times apart, in two feeds we tell researchers and AI crawlers to
cite. The `$393.06` is the BLS ground-beef **index value**.

The basis was never missing. `data/cost-index.json` labels every one of those
observations correctly:

```
ingredients["ground-beef"].points[1].history[4]
  = { date: "2026-06-01", valueCents: 39306, source: "bls", basis: "index" }
```

Two failures compounded.

**The renderer discarded it.** `mergedSeries()` in
`scripts/build-cost-index-pages.mjs` carried each observation's own basis into the
CSV — which is why `series.csv` printed the self-contradicting row
`2026-06-01,393.06,lb,index,bls,false`, a `price_usd` column and an `index` basis
column on the same line — and then `seriesJson()` dropped the per-observation
basis entirely and stamped the whole file with `points[0].level.basis`, which is
genuinely `"wholesale"` because ground beef really does have a measured
`usda-lmr` wholesale level of `$5.51`.

**The gate agreed with it.** `check-cost-index-basis-leak.mjs` cross-referenced at
the **ingredient** level: *does this slug have a dollar-basis newest level in the
source?* Ground beef does. So one true statement about the ingredient waved
through five false statements about observations. The gate had 22 green self-test
assertions. Every one was true. None was about the thing that was wrong.

That second point is the more important finding, and it generalizes past this bug.

## The flow

`data/cost-index.json` → `mergedSeries()` → `series.json` / `series.csv` →
`build-cost-index-feed.mjs` → `feed.json`. A single predicate at the `mergedSeries`
seam fixes all four surfaces, because everything downstream is built from the
series.

## Decision

1. **`scripts/lib/basis.mjs` is the single source of truth**, imported by the
   renderer and the gate. The pattern is borrowed from
   `check-cost-index-snapshot-freshness.mjs` in the product repo, which parses
   `STALE_AFTER_DAYS` out of the resolver so gate and resolver cannot disagree.

2. **`mayRenderAsDollars(obs, seriesBasis)` is the render predicate.** An
   observation enters a dollar-rendering series only if it passes. It fails closed:
   no basis anywhere is a refusal, not an assumption.

3. **A source registry, grounded in the repo's own documentation.**
   `data/cost-index-sources.json`'s `_doc` already stated the mapping verbatim —
   *"ams=wholesale level, noaa=wholesale (ex-vessel) level, fred=level or index per
   its 'basis', bls=index (trend-only)"*. `SOURCE_CAN_BACK_DOLLARS` encodes it.
   `bls: false` means no BLS observation may render as a dollar under any label,
   with no further evidence needed. An unregistered source key is refused.

4. **Three independent rails, deliberately redundant**, because the leak was
   visible on all three and caught by none:
   - the source registry (`bls` can never back a `$`);
   - the observation's own basis, resolved at `(slug, date, source)`;
   - **regime break** — a ≥20× step between a series' reconstructed backfill median
     and its live-capture median. Ground beef's backfill sits at `$3.86–$4.19/lb`
     and its live points at `$368–$393`: a 94.4× step at that seam is a unit or
     basis change, not a market move. This rail fires with every provenance field
     blank.

5. **Suppressions are printed, never silent.** The builder logs every observation
   it refuses. An observation disappearing from a published series without a stated
   reason is the same class of invisibility as the leak, pointed the other way.

6. **Every honesty gate ships `--mutation-proof`.** It takes the live on-disk data,
   reintroduces each historical defect class, and asserts the gate goes **red** —
   and separately asserts the gate is **green** on the unmutated baseline, because
   "it went red" is meaningless without that.

## Walk receipt

Run in this container on 2026-08-07:

- Before the fix: the rewritten gate reported **12 leaks**, all ground beef, across
  `feed.json`, `series.json` and `series.csv` — hit independently by all three
  rails, with **zero** findings on any other ingredient.
- After the fix: `node scripts/build-cost-index-pages.mjs` printed
  `suppressed 20 observation(s) … source="bls" publishes an index, never a price
  level`; `build-cost-index-feed.mjs` rebuilt; the gate returned green.
- `--self-test` → 23/23. `--mutation-proof` → 7/7 across six leak classes plus the
  baseline.
- **The mutation proof was itself proven falsifiable**: flipping
  `SOURCE_CAN_BACK_DOLLARS.bls` from `false` to `true` dropped it to **5/7** and
  named both newly toothless rails by id. Restoring it returned 7/7.

**A first cut of the magnitude rail was wrong and is recorded here rather than
quietly fixed.** Pooling every observation in a series produced five findings, of
which only ground beef was a basis leak; watermelon, eggplant, short-rib and
serrano-pepper flagged because their 2001–2020 reconstructed backfill disperses
much more widely than their live capture. Two populations were pooled, so the
statistic described neither. Per the repo rule — *when widening a scan explodes the
finding count, fix the cause rather than tolerating the noise* — the rail now
compares the populations to each other, which is both quieter and sharper. The
backfill dispersion is still reported, on its own channel, as the separate
data-quality finding it is.

**The repair exposed a second defect, recorded as HD-08 rather than papered over.**
Suppressing ground beef's five index points left a `series.json` stamped
`asOf: 2026-06-10` whose newest observation is `2024-01-05` — a file that reads
current and is not. Ground beef's entire live history is index-basis; its real
`$5.51` level lives in `points[].level` and never reaches `entry.history`, which is
what `mergedSeries` reads. That is a data-plumbing decision, not something a gate
should invent, so the gate **reports** it on a `staleSeries` channel and the item is
enumerated with an owner in `docs/handoff/honesty-debt/honesty-debt.json`.

**Honest verification limits.** No live fetch runs in this container (no keys, no
network to USDA/BLS), so every result above is against the vendored data on disk.
`check-all` was not run to completion here; the two gates were run directly.

## Alternatives rejected

- **Pin the gate to ground beef.** Fixes one slug and leaves the class open.
- **Trust the series-level `basis` header.** Exactly what failed. The header said
  `wholesale` and was, for the ingredient, true.
- **Drop `bls` from ingestion entirely.** BLS is legitimately useful for *trend* —
  the composite engine already uses it that way, and ground beef's trend is
  correctly computed from it. The defect was rendering a trend source as a level,
  not consuming it.
- **Fix the data and skip the gate.** The data was fixed at 09:00 and would be
  reintroduced by the next fetch that writes an index observation into
  `entry.history`. The predicate at the seam is what makes it non-recurring.

## Consequences

- Adding a new price source now requires an entry in `SOURCE_CAN_BACK_DOLLARS`.
  Forgetting fails closed — the source's observations refuse to render — which is
  the correct direction to fail.
- Ground beef currently publishes a two-point reconstructed series pending HD-08.
  Less coverage, honestly labeled, beats a 71×-wrong number.
- **What this retires:** the ingredient-level basis cross-reference is gone,
  superseded by the observation model. And every future honesty gate in this repo
  is expected to carry a mutation proof; a gate submitted without one should be
  treated as unverified regardless of how many self-test assertions it passes.
