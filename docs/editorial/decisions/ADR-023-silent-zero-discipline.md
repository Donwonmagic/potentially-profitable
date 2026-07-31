# ADR-023 — Silent-zero discipline: an instrument that returns nothing must say why

**Status:** Accepted
**Date:** 2026-07-31
**Owner:** Don Goldstein (muntin.digital)
**Supersedes:** nothing. **Related:** ADR-011 (events surface), ADR-013 (gov data sources), ADR-015 (open-data explore surfaces), ADR-022 (coverage-regime qualifier)

> **Decision.** Any instrument that can return "nothing" must publish the discriminator between
> *measured zero* and *did not report*. A zero, an empty set, or an unchanged value is never
> shipped bare. Where the discriminator cannot be computed, the absence is disclosed as an
> instrument limit in the data file itself, next to the number — not in prose that a downstream
> consumer will not read.

## Context

On 2026-07-31 this repo hit the same defect four times, by four unrelated routes, in one day.
Each was found by accident. None was found by a gate, because no gate was looking for the shape.

| # | Instrument | What it returned | Why | Detectable from the value? |
|---|---|---|---|---|
| 1 | `jalapeno` recall keyword | 0 recalls, permanently | `[^a-z ]` strip turned "Jalapeño" into the keyword `jalape o`, which matches no product text | **No** |
| 2 | openFDA for beef/pork/chicken | 0 recalls | Meat/poultry are USDA/FSIS jurisdiction, absent from the endpoint entirely | **No** |
| 3 | Seafood price series | Last-good held ~4 months | The refresh no-ops without `AMS_KEY` rather than failing | **No** |
| 4 | 11 USDA AMS Atlanta items | 0 change across 26 reads | One terminal desk; a sticky quote and a dead feed are identical from the value | **No** |

The common shape: **the instrument's output is indistinguishable from the instrument being
broken.** In every case the honest reading and the broken reading produce the same bytes, so a
reader — human or machine — cannot tell them apart, and neither could we.

This matters more here than in most codebases because the site's whole proposition is measured
honesty. A published zero that is really a string bug is not a small error; it is the exact class
of failure the fact gate exists to prevent, arriving through a door the fact gate does not watch.
The fact gate checks whether a number is *sourced*. It does not check whether a *zero is real*.

Finding #1 and #2 came out of the discovery run's adversarial kill panel — which killed all 12
findings it fully examined, and whose actual value turned out to be the code it audited on the way.
Finding #3 came out of `check-all`. Finding #4 came out of asking, after the first three, whether
the panel had more of them. It did.

## The flow

1. An instrument (fetcher, matcher, refresh job, price feed) produces a value or an absence.
2. Absence is written to a data file exactly like a measurement.
3. A builder renders it. A zero renders as a zero; an unchanged series renders as a flat line.
4. A reader — or a later analysis, or an LLM reading `/open` — treats it as a finding about the
   world. Nothing in the pipeline ever asked whether the instrument was working.

Step 4 is where a string bug becomes a published claim about food safety.

## Decision

1. **A zero ships with its denominator and its jurisdiction.** Recall counts now carry a
   `coverageLimits` block naming what the source structurally cannot see (`scripts/fetch-food-recalls.mjs`),
   including an explicit *"counts are not comparable across slugs"* line. Any future count-like
   dataset does the same.
2. **Absence caused by a known instrument limit is disclosed in the DATA FILE**, not only in prose.
   A consumer reads JSON, not our methodology page.
3. **Silence over time is measured, not assumed.** `scripts/audit-panel-independence.mjs` flags any
   series with zero change across ≥12 reads. Known-flat feeds are registered in `SILENT_ALLOW` with
   a dated reason; an unregistered one fails CI. The script also warns when a registered entry
   starts moving again, so the registry cannot outlive its own justification.
4. **A slug count is not an observation count.** The same script reports effective panel breadth by
   collapsing series that share a source, span, and change calendar. Today: **100 tracked slugs,
   70 independent series** — NOAA publishes 14 seafood series on one calendar, and one AMS Atlanta
   desk supplies 16 slugs across three clusters. No statistic may treat slug count as sample size.
5. **Normalization bugs that can zero a match are regression-tested, not reasoned about.** The
   accent-folding fix ships with assertions covering an accented keyword, accented *and*
   un-accented product text, and a no-false-positive probe.

## Walk receipt

Verified in this container by execution, not inspection:

- `node scripts/fetch-food-recalls.mjs --self-test` → 28/28, including the four accent assertions.
- `node scripts/fetch-food-recalls.mjs --retag` → 4 rows changed, all gaining `jalapeno`; matches an
  independent count of rows whose product text mentions jalapeños. One is literally
  `"Supreme Peppers Tri Blend … Supreme Jalapenos Diced"`, previously tagged `["onion"]` only.
- `node scripts/audit-panel-independence.mjs --self-test` → 15/15, including a case proving that
  series with *different values* but a shared change calendar still cluster, and that different
  sources never cluster even when synchronized.
- `node scripts/audit-panel-independence.mjs` → 100 slugs, 70 independent series, 11 silent.
- Independently confirmed the FSIS gap: beef, pork and every chicken slug have **zero**
  product-text mentions across all 718 stored rows; `product_type` is uniformly `"Food"`.

**Honest limits.** No browser or device walk was performed. `--retag` is a *partial* repair by
construction: rows that matched no slug at fetch time were never written to the file and only a
live fetch recovers them — the script says so rather than implying completeness. The AMS Atlanta
silence is *registered, not diagnosed*; whether that desk is sticky or dead needs an operator-side
live fetch, which this container cannot perform. The 12-read threshold is a judgement, not a
derived constant.

## Alternatives rejected

- **Treat each defect as a one-off bug.** Rejected: four instances in one day from four routes is a
  class, and fixing instances leaves the fifth one to be found by a reader instead of a gate.
- **Fail CI on any silent feed.** Rejected: some quotes genuinely do not move. An unconditional
  failure trains people to disable the gate. A dated registry forces the judgement to be *made and
  written down* — the same design as the positioning-drift `ALLOW` list and the `check-all` baseline.
- **Drop the silent slugs from the panel.** Rejected: their flatness may be true and is itself
  information. Removing them would hide the very signal worth watching.
- **Put the coverage caveats only on the methodology page.** Rejected: the datasets are published
  CC0/CC-BY for machine consumption. A caveat a consumer never loads is not a caveat.

## Consequences

- `check-all` gains two entries; the deploy chain now fails on an unregistered silent feed.
- Recall counts can no longer be honestly ranked across slugs, and the data says so. Any surface
  attempting that ranking is now provably wrong rather than arguably wrong.
- The panel's headline count (100) and its statistical breadth (70) are separated, permanently and
  computably. Future analyses that need a sample size have one to use.
- The registry is a standing obligation: 11 entries dated 2026-07-31 that need revisiting once a
  live refresh runs. If that desk resumes, the script says to prune them.
