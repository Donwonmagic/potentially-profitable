# Cost Index — confidence go-live plan

*The actionable output of the 3-specialist panel (source coverage · methodology ·
pipeline) plus the engine + gate changes already shipped. This is the worksheet
for the founder's laptop run (verify → flip → fetch → build → check → render).*

Last updated 2026-06-07.

---

## What already shipped (code; no keys needed, in this branch)

1. **Engine — confidence counts independent TYPES, not correlated markets.**
   `tools/_shared/composite-price.js` (+ Ledger `composite-price.ts` mirror,
   + `cost-index-sources.js`/`.ts` threading `type` end-to-end). `confidenceFor()`
   now derives **level-confidence** and **trend-confidence** separately from
   `nTypes` (distinct source TYPE; six USDA-AMS terminals collapse to one
   methodology) and publishes their **min**. `nFamilies` still drives the RANGE.
   New parity vectors both sides; storefront suite 14/14, TS harness green.
2. **Calibration gate aligned.** `scripts/check-cost-index-calibration.mjs` audits
   level/trend types + distinct-week coverage; warn-only (`FAIL_ON_DRIFT`).

**Effect on the next live fetch (before any new sources):** confidence corrects
to the honest floor —
- `onion` high → **low** (single AMS methodology, no independent corroboration),
- `romaine` high → **medium** (1 level type; ams+bls trend),
- `shrimp` low → **directional** (no dollar level, index/trend only).

That is the *honest* baseline. The point of the source work below is to **earn
those back up** by adding a genuine second independent dollar source.

---

## The model (so every wiring choice is principled)

`confidence = min(levelCeiling, trendCeiling)`

- **levelCeiling**: `≥2` independent dollar **types** on the **same basis** → `high`;
  exactly `1` → `medium`; none → `directional`.
- **trendCeiling**: `min(` independence(`≥2` types & agreement) , week-coverage(`≥8`
  wk high / `≥4` medium / `≥2` low) `)`.

Two rules that decide whether a candidate source actually lifts confidence:
- **Same basis or it's trend-only.** `compositeLevel` returns ONE basis bucket
  (delivered ▸ wholesale ▸ retail). A source on a *different* basis (IMF global
  export, farm-gate NASS, retail APU) cannot corroborate a US-wholesale LEVEL —
  label it `basis:index` so it feeds the TREND, never the level.
- **Distinct `type` or it's a correlated echo.** Give a genuine new methodology a
  new `type`; give a republish the *same* `family` as its source so it can't fake
  independence (FRED `APU/WPU/PCU` = BLS; EIA diesel = FRED `GASDESW`).

---

## Per-ingredient plan (verified sources from the coverage panel)

| ingredient | today | add (verified) | basis / type | lifts | wiring |
|---|---|---|---|---|---|
| onion | high→**low** on fetch | AMS National Potato&Onion **slug 2926** or Idaho Falls **2393** (FOB shipping-point) | wholesale / `usda-ams-shippoint` | **level → medium/high** (earns it back) | config + discover fields |
| russet-potato | low | AMS **2393 / 2926** (russet 50-lb sacks verified) | wholesale / `usda-ams-shippoint` | level → medium | config + discover |
| romaine-lettuce | high→**medium** | AMS Salinas-Watsonville romaine FOB shipping-point (discover slug) | wholesale / `usda-ams-shippoint` | level → high | discover slug + config |
| tomato | medium | AMS tomato FOB shipping-point (discover) **or** NASS Vegetables Summary | wholesale / `usda-ams-shippoint` | level → high | discover + config |
| butter | medium | **CME cash butter** via AMS **AMS_1603** | wholesale / `cme-cash` | level → high | config + discover fields |
| cheddar-cheese | medium | **CME cash cheese** (block/barrel) via **AMS_1603** | wholesale / `cme-cash` | level → high | config + discover |
| ribeye, beef-tenderloin | medium | **LMR boxed-beef cutout** as 2nd wholesale level | wholesale / `usda-lmr-cutout` | level → high *(if $/lb in bounds; else index)* | discover-lmr slug + config |
| pork-loin, pork-shoulder | medium | **LMR negotiated-pork cutout** | wholesale / `usda-lmr-cutout` | level → high | discover-lmr + config |
| vegetable-oil | directional | AMS **Crude Soybean Oil, Central IL** (report 3190 / GX_GR117) | wholesale / `usda-ams-grain` | **first dollar level → medium** | discover + config + bounds |
| salmon-fillet, shrimp | low / directional | FRED **PSALMUSDM / PSHRIUSDM** (IMF) | **index** / `imf` (global ≠ US wholesale) | independent TREND type | FRED fan-out (code) + config |
| all proteins/poultry | — | FRED **PBEEFUSDM / PPORKUSDM / PPOULTUSDM** (IMF) | **index** / `imf` | independent TREND type | FRED fan-out (code) + config |

**Traps (do NOT count as independent):** FRED `APU/WPU/PCU` (= BLS, keep as trend
under `family:'bls'`); EIA diesel vs FRED `GASDESW` (same series); NASS for
proteins/dairy (AMS-fed — NASS is only independent for produce/eggs); CME↔NDPSR
(distinct *type*, but they observe the same trades → no agreement bonus).

---

## Config shapes (drop into `data/cost-index-sources.json` as `verified:false`)

**AMS shipping-point (produce level) — e.g. onion:**
```jsonc
"ams": [
  { /* existing terminal fan-out … keep */ },
  { "reportId": "2926", "reducer": "mostlyMid", "priceUnit": "Dollars Per Sack",
    "unit": "sack", "commodity": "onions", "matchFields": ["commodity"],
    "family": "ams-shippoint", "type": "usda-ams-shippoint", "_report": "Natl Potato & Onion FOB" }
]
```
**CME cash dairy via AMS_1603 — e.g. butter:** add an `ams` array element with
`"reportId":"1603"`, `commodity:"butter"`, `reducer:"single"`,
`fields.price` set to the cash-price column (confirm via discover),
`family:"cme-cash"`, `type:"cme"`, `priceUnit:"Dollars Per Lb"`.

**LMR cutout (protein level) — e.g. ribeye:** make `lmr` an array; 2nd element
`reportId` = boxed-beef cutout slug (`--discover-lmr "boxed beef"`),
`reducer:"single"`, `priceUnit:"Dollars Per Cwt"`, `unit:"lb"`,
`family:"lmr-cutout"`, `type:"usda-lmr-cutout"`. **Tag `basis:"index"` instead of
`wholesale` if the cutout $/lb falls outside the ribeye-cut bounds** (corroborate
direction, not level).

**IMF trend (FRED) — needs a small code change first:** the fetcher reads one
`raw.fred` per ingredient. Add a `fredSpecs()` fan-out (mirror `amsSpecs`) so a
`fred` array fetches multiple series, then add
`{ "seriesId":"PBEEFUSDM", "basis":"index", "family":"imf-beef", "type":"imf" }`.

---

## The one engine increment still open (P1 #36 tail — parity work)

Range-widening + level-agreement + stability, all inside the parity-locked
`composite-price` (mirror JS/TS + vectors). Specified by the methodologist:
- **Range-widening:** publish `union(cross-market p25–p75, rolling MAD band)` over
  the last 8 weekly-resampled reads — `band = median ± 0.6745·(1.4826·MAD)`. Gives
  single-source items an honest band instead of `[x,x]`.
- **Level-agreement:** when `nLevelTypes≥2`, cap confidence if independent dollar
  types disagree — `rCoV = 1.4826·MAD / median` (n≥3) or IQR-overlap (n=2).
- **Stability:** Theil–Sen detrend, then residual `rCoV` caps confidence — so a
  smooth spike (romaine) stays high but noisy scatter drops.

These are additive to the shipped type-counting fix and can land as a follow-up
engine commit without re-touching the source wiring.

---

## Go-live sequence (founder, laptop, with keys)

Per source, mirroring `docs/cost-index-runbook.md` §4:
1. `node scripts/verify-cost-index-sources.mjs --discover "<term>"` (AMS) /
   `--discover-lmr "<term>"` / `--discover-fred "<term>"` → get the slug/series id.
2. **curl one report**, confirm the row + price column names; set `fields.price`.
3. Add the config element (shapes above); add a `data/cost-index-bounds.json` entry
   for any new ingredient/unit.
4. `node scripts/verify-cost-index-sources.mjs` → expect `✓ in bounds, fresh`; then `--flip`.
5. `node scripts/fetch-cost-index-sources.mjs --live --out /tmp/ci.json`
6. `node scripts/build-cost-index.mjs --artifact /tmp/ci.json`
7. `node scripts/check-cost-index-sync.mjs --check` and
   `node scripts/check-cost-index-calibration.mjs` (should go clean as types rise).
8. `node scripts/build-cost-index-seed.mjs && node scripts/build-cost-index-pages.mjs && node scripts/check-all.mjs`
9. When the gate is clean on re-vendored data, flip `FAIL_ON_DRIFT=true` in
   `check-cost-index-calibration.mjs` so confidence can never be overstated again.

**Keyless / keys-you-have (do first):** AMS shipping-point (onion/russet/romaine/
tomato), AMS_1603 dairy (butter/cheddar), AMS crude soybean oil (veg-oil), LMR
cutout (proteins). **Needs a code change first:** the FRED fan-out for IMF trend
series. **New key (optional):** NASS (produce/eggs farm survey), EIA (energy).
