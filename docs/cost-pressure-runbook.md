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
| Per-indicator fetch specs | `data/pressure-source-specs.json` | ⏳ 14/21 verified (pending: 4 AMS movement + `drought-id` + national `drought` + `feed-futures`) |
| Source normalizers hardened (begin_code ordering, multi-area drought case-insensitive, withheld cells) | `tools/_shared/pressure-sources.js` | ✅ tested |
| AMS produce MOVEMENT aggregate (national volume + import share + YoY pace) | `tools/_shared/pressure-sources.js` (`movementAggregate`) | ✅ self-tested; specs pending live probe |
| Fetch orchestrator (`--self-test` / `--probe` / `--ams-discover` / `--live`) | `scripts/fetch-pressure-observations.mjs` | ✅ |
| Refresh Action (probe / ams-discover / live, weekly cron) | `.github/workflows/cost-pressure-refresh.yml` | ✅ |
| Scorer build → records | `scripts/build-cost-pressure.mjs` | ✅ |
| Page render (Outlook block) | `scripts/build-cost-index-pages.mjs` | ✅ preview |
| Honesty gate (recompute + no-price) | `scripts/check-pressure-honesty.mjs` | ✅ in check-all |
| Source shape/readiness gate (resolves `ams-move` emits) | `scripts/check-pressure-sources.mjs` | ✅ in check-all |

### How the layer runs now — the GitHub Action
The whole pipeline runs in `.github/workflows/cost-pressure-refresh.yml` (GitHub
runners have egress; keys live as repo **secrets** `EIA_KEY` / `NASS_KEY` / `AMS_KEY`).
Trigger it from **Actions → Cost Pressure refresh → Run workflow** with a `mode`:
- **`probe`** — tries every spec live (ignores `verified`), writes nothing; prints
  rows/change + NASS `short_desc` + AMS `ams keys`/commodities. The verification loop.
- **`ams-discover`** — lists MARS movement/specialty reports + produce commodity names
  + samples a movement report's `Report Details`. How the AMS slugs were found.
- **`live`** — `--self-test` → `--live` → build → render → `sync-includes` → honesty +
  sources gates → **scoped commit** (data/pressure-* + cost-index pages only) → push →
  Cloudflare deploys. The weekly Monday cron runs this.

## Go-live steps

### 1. Get the three free keys (repo secrets)
- **EIA** (diesel/freight): register at <https://www.eia.gov/opendata/> → `EIA_KEY`.
- **USDA NASS** (meat/dairy supply signals): <https://quickstats.nass.usda.gov/api/> → `NASS_KEY`.
- **USDA AMS / My Market News** (produce movement): <https://mymarketnews.ams.usda.gov/> → `AMS_KEY` (Basic-auth username, blank password).
- US Drought Monitor and NWS (`api.weather.gov`) are **keyless**.
- **No paid feed is used anywhere.** All USDA/EIA/keyless public data.

### 2. Verify the 12 outstanding source specs

**Fast path — let `--probe` do the discovery for you** (needs the keys from step 1,
run on a machine with internet egress):
```
EIA_KEY=… NASS_KEY=… node scripts/fetch-pressure-observations.mjs --probe
```
`--probe` tries **every** spec live (ignoring `verified`), writes nothing, and
prints for each: row count, the normalized % change, and — for NASS — the exact
`short_desc`/`unit_desc` the query matched. A `✓` with a sensible `short_desc`
means the skeleton already works: flip `verified:true`. A `⚠ rows=0` or a wrong
`short_desc` means tighten the `query` and re-probe. This collapses 12
param-browser lookups into one command you re-run until everything is `✓`.

The static worksheet (discovery endpoints + what to confirm) is also available:
```
node scripts/check-pressure-sources.mjs      # grouped per-spec go-live worksheet
```
Reference endpoints when a query needs hand-tuning:
- **NASS** (`broiler-placements`, `cattle-on-feed-placements`, `hogs-market-supply`,
  `cold-storage-*`, `crop-condition`, `milk-production`): the Quick Stats parameter
  browser (<https://quickstats.nass.usda.gov>) — tighten the `query` (add `unit_desc`
  when `--probe` reports multiple units).
- **AMS produce movement** (`onion-movement`, `lettuce-movement`, `tomato-movement`,
  `potato-movement` — type `ams-move`): each pools `Report Details` across all active
  Daily Movement city reports (`MOVEMENT_REPORTS` in the fetcher), filters one commodity
  (exact), and emits three indicators — `<x>-shipments` (national weekly volume, field
  `1 lb units`), `<x>-imports` (import share from `import/Export`), `<x>-pace` (trailing
  4wk vs ~52wk-ago). `--probe` prints cities-hit / weeks / the 3 emits. Run `--ams-discover`
  to (re)find report slugs + commodity spellings. The produce **measured anchor is already
  AMS terminal price**, so the overlay must use *volume*, never price (circularity).
- **AMS `feed-futures`**: permanently deferred — `AMS_3046` is a narrative report; CBOT
  futures aren't AMS data. Left as an unwired slot on the meat panels (already 3 signals).

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
The `cost-pressure-refresh` Action runs `mode=live` on a Monday cron (steps 3–4 in
GitHub's runners, then a scoped commit + push → Cloudflare deploys). The anchor
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
