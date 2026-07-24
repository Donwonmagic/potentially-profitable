# ADR-019 — Fusing the corpus into the CC-BY reference surfaces (seasonality + events)

**Status:** Accepted (2026-07-24). Seasonality landed first; events sequenced next.
**Supersedes/extends:** ADR-018 (CHAIN presentation architecture — this is its open-data / reference-surface
leg), ADR-017 (the fused Ingredient State Record), ADR-015 (open-data explore surfaces + the CC0/CC-BY
split), ADR-011 (notable price events surface).

## Context

The two standing CC-BY reference surfaces — `/open/seasonality/` (a learning hub: a radial clock, an
amplitude ranking, "how to read the curve") and `/cost-index/events/` (432 detected moves × a 39-event
cited registry, hub + 39 detail pages) — were built **before** the fused corpus landed and read **none**
of it. Seasonality knew *when* each item is cheapest but nothing about *why* the low lands, how imports
shape the curve, or what to buy when it peaks. Events showed a documented event beside a price window but
carried no exposure / severity / seasonal context.

A large coordinated dream-and-audit workflow (4 lenses × 2 surfaces → judge/synthesize → adversarial
audit; the improvement loop) produced a build-ready spec per surface. The audit caught, and the specs
correct, several honesty traps that a naive fusion would have shipped:

- **Import-value ≠ supply-volume.** `import_seasonal_index` is import *value* seasonality; labels like
  "off-season imports backfill the gap" launder a volume/supply-share claim out of a value index. Banned.
- **A percent discount is scale-invariant.** Plate cost = price ÷ yield, so a yield divides both the
  discounted and the baseline price and cancels — a "% off the purchase price" is the *same* % off the
  usable pound. The earlier draft's yield-adjusted saving was dimensionally unsound.
- **Co-movement is not "driving."** A shared cheap month is a shared calendar, never a shared cause.
- **Hardcoded headline numbers drift.** The save-range must be build-derived from the classified
  distribution, never typed.
- **Field-name reality.** `edible_yield_pct` (not `edible_yield`), `import_top_sources` (not `origins`),
  `distinctYears`; `seasonalDigest()` owns `save_pct`/`cheapest_month`/`dearMonth` (ISR's own coverage
  differs and would contradict the page's classified count).

## Coverage ceiling (answered, not hidden)

The surfaces are gated by **deep multi-year price history**, not by a stale build: only **102** ingredients
carry a deep series → seasonality reaches 100 (84 ready, 74 classified), events detection reaches 102 (80
with a notable move). The ISR corpus covers **169**; **~67 newer ingredients** (tomatillo, plantain,
specialty cheeses/seafood, tree fruit, nuts…) have import/yield/reliance *structure* but no price series
deep enough for a 5-yr seasonal normal or a ±26-week event baseline. That gap closes only when the
operator-Mac fetch backfills their history; meanwhile the redesign (a) fuses the full 169-record ISR as
**enrichment** onto the 102 that do have history, and (b) may **honestly surface** the ~67 as
"structure known, price-history pending" rather than silently dropping them.

## Decision

Fuse the corpus into both reference surfaces under the absolute honesty contract, each fused number keeping
its native caveat, every read against the item's own baseline, nothing forecast, degrade by absence.

### Seasonality (`/open/seasonality/`) — landed 2026-07-24

- **`seasonalDigest()` is the sole authority** for the classified set + cheapest/dearest month + amplitude
  (the 74-set). ISR is **enrich-only**.
- **§0 honesty capsule** — a build-derived save range (`{loSave}–{hiSave}%` from the classified
  field-crop `save_pct` p20–p80, never hardcoded), a classification funnel (`84 ready → 74 named →
  57 window`, gate-reconciled), and the CC0/CC-BY license split.
- **§4 "Why the low lands"** (the marquee "why" fusion) — one deterministic, **value-only** mechanism
  label per window item, from `import_seasonal_index` × `import_source_hhi` × `import_reliance_pct`:
  `Import-value counter-phase` (import value elevated in the domestic trough month), `Domestic-season low
  (not import-aligned)` (residual — inferred from phase, never "harvest"), `Domestically sourced (no
  import calendar)`. A representative dual-calendar figure (domestic reference above, import-value index
  below, counter-phase months shaded) + the load-bearing caveat ("nominal import *value*, never volume,
  tonnage, or supply share; HHI is value concentration; reliance is a value proxy").
- **§6 Swap Validator** — for the 31 items whose `hedge_swap` resolves to a classified slug, a verdict
  from circular calendar distance + co-movement: `Real hedge` (swap cheap ~opposite the anchor's cheap
  month), `Partial offset`, `Mirror` (shares the cheap month), `Shared calendar` (shares + co-moves).
  Certifies **calendar offset only** — never a price outcome, never a shared cause, never "driving".

All generated strings carry reviewed EN + ES forms in `scripts/lib/seasonality-fusion.mjs` (unit-tested:
no supply verb, no cause, no forecast). The label/verdict language is the **site voice**; the strong
disclaimers live in dedicated caveat / `<details class="cite">` elements the fusion gate exempts from its
positive-token scan.

### Events (`/cost-index/events/`) — exposure leg landed 2026-07-24

**Landed:** the per-event **"Why these ingredients were exposed"** block on all 39 detail pages (+ ES),
via the reliance-branched generator `scripts/lib/event-exposure.mjs` (37/37 self-test): import-origin
concentration + HHI (a value share) for the 12 import-exposed affected items, a domestic-production-structure
note (NO import-HHI gauge — the audit's binding fix) for the 31 domestic items, and the catchpair (two
different measures, never a supply share) for the 7 seafood items. Additive via `inject-event-exposure.mjs`
(idempotent, sentinel-delimited body + head-CSS, preserving the engine-ahead nav/JSON-LD) + a mirror into
`emitEventPage()`; both `--check` + the lib self-test are wired into `check-all`. The caveat is adaptive —
an all-domestic page does not define import-value HHI. The existing `check-cost-index-events.mjs` confirms
the block asserts no event→price causation and keeps the co-occurrence marker.

**Also landed (2026-07-24):** the hub co-movement **base-rate honesty fix**. `coMovementBaseRate()` in
`scripts/lib/cost-events-analysis.mjs` computes a seeded, deterministic **permutation null** — hold the 432
(date, direction) moves fixed, shuffle which ingredient each belongs to, recompute the shared-week fraction.
Result: observed 94%, null **94%** (93–94% over 500 permutations). So "94% had company" is a density artifact,
not a signal — the hub now says so in its own voice ("had company barely beats chance: the signal is *which*
ingredient co-moved, and why"). Surgical in-place edit of the 2 committed hub files + engine mirror (the hub is
engine-behind); pinned by the `build-events-open-data` self-test (determinism + observed-matches + near-observed).

**Sequenced next** (per the audited events spec): reliance-branched exposure + base-rate done; still to come — a
severity percentile against the 432-move population, a **permutation-null base rate** for co-movement
(shuffle labels over the same move population — the corpus has no all-week series, so an all-week null is
the wrong null), a taxonomy of silence for the 23 flat events, a "which rung moved" note from the
meat-price-chain, and caveat-welded QAPage capsules — all additive via the supply-picture injector pattern
(the events pages are engine-*behind* in nav/JSON-LD, so a full regen would regress 80 files).

## Build mechanics (the engine-behind-pages hazard, resolved per-surface)

- **Seasonality is engine-in-sync** (committed ≈ container engine, only harmless shared CSS behind): edit
  `emitSeasonalityHub()` + the new `seasonalityFusion()`/`seaWhyHtml()`/`seaSwapHtml()` helpers in
  `scripts/build-cost-index-pages.mjs`, then regenerate **only** via
  `CI_ONLY_PATH=open/seasonality node scripts/build-cost-index-pages.mjs`. Never a full regen.
- **Events is engine-behind** in nav (platform-kbd script, logo SVG) + JSON-LD (an extra WebPage node): a
  full regen would regress the committed hub + 39 detail pages. Enrichment must be **additive** (an
  idempotent injector preserving existing markup) + a mirror into `emitEventsHubPage()`/`emitEventPage()`.

## Gates

- **`scripts/check-seasonality-fusion.mjs`** (new, wired into `check-all`, `--self-test` + live) — over the
  built seasonality HTML: a positive supply-verb / `volume` scan on the mechanism labels + tags (exempting
  `.sea-caveat` + `<details class="cite">` + `data-audio-alt`), the scoped causal + forecast scan, the
  required import-value caveat literal, a `driv*`/cause scan on the swap verdicts, the funnel reconciliation
  (`ready ≥ classified ≥ window`), and the absence of the REFUSED forecast-adjacent fields
  (`pressure_dir`/`pressure_conf`, ONI/energy/weather as per-ingredient drivers).
- **`scripts/lib/seasonality-fusion.mjs` self-test** (wired) — pins the label/verdict/caveat language.
- Events extends `scripts/check-cost-index-events.mjs` with the exposure-mode, base-rate, held-or-mirrored,
  and flat-variant guards (sequenced with the events build).

## Consequences

The seasonality hub stops describing a curve it hid and starts explaining *why* the low lands (a second
**value** calendar drawn beside the domestic one, never one causing the other) and *what to buy instead*
when an item peaks — every fusion keeping its caveat, nothing forecast, nothing caused, nothing invented.
The improvement-loop refinements are folded in as they land; the architecture above is fixed.

**Also landed (2026-07-24) — the §3 bankability scatter** ("Big gap isn't the same as a good buy"): plots
every classified item that carries a band (67) by its seasonal saving (x) against **signal-to-noise =
saving ÷ its own band** (y, log scale) — a HEURISTIC ratio, labeled as such. A noise-floor line at 1×
separates bankable (saving beats routine swing — e.g. whole-turkey, 35% saving on a 0.8% band) from swamped
(the season is smaller than the item's own week-to-week noise — e.g. zucchini, 42% saving on a 43% band; 6
fall below). Accessible SVG (position vs the drawn floor is the redundant cue, not color) + a ranked table
as the canonical SR/no-JS layer + the band-width "predictability descriptor, not a forecast" caveat. The
figure lives on the un-article-gated `/open/` surface, so it uses accessible `.sea-scatter` classes rather
than a new `viz-scatter` family; `check-seasonality-fusion` pins the "heuristic ratio" label + the caveat.

**Also landed (2026-07-24) — the menu-pricing field report promoted to a citable CC-BY surface.** With the
seasonality/events surfaces at their deep-history ceiling (102 of 169 ingredients), a NEW citable surface
that needs no corpus is the way to keep growing the open library. The paper (`/cost-index/menu-pricing/study/`)
was already a `ScholarlyArticle` with 36 DOI'd sources; promoting it added: (a) a **dedicated CC-BY evidence
dataset** (`build-study-dataset.mjs` → `study.json` + `.csv`) — the paper's claims × the 36 grounding sources,
each with its finding, the myth it corrects, its confidence, and its DOI, derived from the SAME data +
ordering `emitStudy()` renders from so it can't drift; (b) a **Cite-this block** (APA + BibTeX) + the
`license`/`datePublished`/`isAccessibleForFree` triple in the JSON-LD, built by the shared `studyCiteBlock()`
so the engine and the idempotent `inject-study-cite.mjs` are byte-identical (the study pages are engine-behind);
(c) **registration** in `llms.txt` (EN+ES) as a citable surface. The human `/open/` card is the one remaining
touch (the `/open/` hub is engine-behind — a surgical add). No DOI mint (operator-Mac task).

Remaining seasonality spec depth (Now-Board decision cards, the plate translation, the protein/events
bridges, the FAQ-in-DOM) and the remaining events depth (severity percentile, QAPage capsules) are
sequenced increments under this ADR.
