# Cost Pressure — runbook (preview → live)

The **Pressure layer** is the inferred "where it's headed" overlay that rides on
top of the measured Cost Index. It is deterministic, sourced, and engineered so
it **cannot publish a price** — only a direction (building / easing / steady)
with confidence. This is the go-live checklist. **Total cost: $0** (two free
API keys; the rest keyless).

## The two layers (never blend them)

- **Measured anchor** — the wholesale price (`data/cost-index.json`). The *only*
  layer allowed to carry a `$`. Rendered in a `data-layer="measured"` block.
- **Pressure overlay** — direction only, from public *leading* indicators
  (`data/cost-pressure.json`). No price field exists on the record. Rendered in a
  `data-layer="inferred"` block. Refreshes weekly; the measured anchor refreshes
  on its own slower clock.

## Architecture (build it dark, then add keys)

| Piece | File | Status |
|---|---|---|
| Deterministic scorer | `tools/_shared/cost-pressure.js` | ✅ live, tested |
| Rule manifest (panels, signs, weights, lags, cites) | `data/pressure-rules.json` | ✅ |
| Source normalizers (raw API → window %) | `tools/_shared/pressure-sources.js` | ✅ tested |
| Per-indicator fetch specs | `data/pressure-source-specs.json` | ⏳ 5/14 verified |
| Fetch orchestrator | `scripts/fetch-pressure-observations.mjs` | ✅ (`--self-test` passes) |
| Scorer build → records | `scripts/build-cost-pressure.mjs` | ✅ |
| Page render (Outlook block) | `scripts/build-cost-index-pages.mjs` | ✅ preview |
| Honesty gate (recompute + no-price) | `scripts/check-pressure-honesty.mjs` | ✅ in check-all |
| Source shape/readiness gate | `scripts/check-pressure-sources.mjs` | ✅ in check-all |

## Go-live steps

### 1. Get the two free keys
- **EIA** (diesel/freight): register at <https://www.eia.gov/opendata/> → `EIA_KEY`.
- **USDA NASS** (supply signals): register at <https://quickstats.nass.usda.gov/api/> → `NASS_KEY`.
- US Drought Monitor and NWS (`api.weather.gov`) are **keyless**.
- **No paid feed is used anywhere.** Futures come *through* free USDA AMS, not CME.

### 2. Verify the 9 outstanding source specs
```
node scripts/check-pressure-sources.mjs      # prints the go-live checklist
```
For each `verified:false` spec in `data/pressure-source-specs.json`, confirm the
exact identifier against the live discovery endpoint, then flip `verified:true`:
- **NASS** (`broiler-placements`, `cattle-on-feed-placements`, `hogs-market-supply`,
  `cold-storage-*`, `crop-condition`): confirm the `short_desc` in the Quick Stats
  parameter browser (<https://quickstats.nass.usda.gov>), tighten the `query`.
- **AMS** (`feed-futures`, `ams-shipments`): confirm the My Market News report slug
  + numeric field (<https://mymarketnews.ams.usda.gov/mymarketnews-api>).

### 3. Prove the wiring, then fetch
```
node scripts/fetch-pressure-observations.mjs --self-test   # no network; must pass
EIA_KEY=… NASS_KEY=… node scripts/fetch-pressure-observations.mjs --live
```
`--live` writes `data/pressure-observations.json` and prints any remaining gaps.

### 4. Score, render, gate
```
node scripts/build-cost-pressure.mjs          # → data/cost-pressure.json (status flips to 'live')
node scripts/build-cost-index-pages.mjs
node scripts/sync-includes.mjs                 # restore canonical nav (always after the page build)
node scripts/check-pressure-honesty.mjs        # recompute-and-compare + no-price/verb scan
npm run check-all                              # full suite
```

### 5. Weekly cadence
Run steps 3–4 weekly (a Cloudflare cron, like the Cost Index fetch). The anchor
refreshes on its own report cadence; the overlay refreshes weekly and shows
`freshness_weeks` since the last measured print. Past the decay floor
(`defaults.decay.floorWeeks`), the overlay auto-suppresses to "under review".

## Honesty rules (enforced by `check-pressure-honesty.mjs`)

1. **No `$` or `/unit` in any `data-layer="inferred"` block** — fail-CI.
2. **No price/value/level key on a pressure record** — the field doesn't exist.
3. **No forecast verbs** (`will`, `predicts`, `forecasts` (ours), `because`,
   `guarantee`) in an inferred block — only hedged verbs survive.
4. **Recompute-and-compare** — the gate re-runs `cost-pressure.js` over the rules
   and fails if the rendered direction/confidence/score ≠ the arithmetic.

## Changing the model
Weights/signs/lags live only in `data/pressure-rules.json`. Any change **requires
a `_version` bump + a changelog line** — a weight tweak is a versioned, dated
event, never silent. The lags are USDA-sourced; the per-week weighting is
Muntin's evidence-tier judgment, labeled illustrative.

## Next (P3)
- **Validation loop:** back-check pressure calls against USDA ERS *Meat Price
  Spreads* (free, monthly) — realized farm→wholesale moves vs what the overlay leaned.
- **Public accuracy log + regime-breaker:** on each measured print, log hit/miss;
  auto-suppress an item to "under review" after a miss streak.
