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

- **Same agency collapses.** A 2nd USDA-AMS source (e.g. FOB shipping-point beside
  the terminals) is the *same* `type` — it widens the cross-market range and feeds
  the agreement/dispersion check, but does **not** add an independent type. Earning
  a higher ceiling needs a *different agency*: CME (`cme`), BLS (`bls`), IMF (`imf`).

---

## What's STAGED in this commit (verified:false, in `data/cost-index-sources.json`)

Each staged source carries an `_status` field with its exact `--discover` command.
Run `node scripts/verify-cost-index-sources.mjs` to see which resolve, fix the
`DISCOVER` slugs, then `--flip`. Simulated outcomes through the real engine:

| ingredient | staged source | type | outcome on confirm |
|---|---|---|---|
| **butter** | CME cash butter (`reportId:"DISCOVER"` → AMS_1603) | `cme` | medium → **high** |
| **cheddar-cheese** | CME cash block cheddar (`DISCOVER`) | `cme` | medium → **high** |
| **onion** | BLS dry-onion PPI + FOB shipping-point `2926` | `bls` + `usda-ams` | low → **medium** |
| **russet-potato** | FOB shipping-point `2926` | `usda-ams` | medium (range tightened) |
| **shrimp** | IMF global shrimp `PSHRIUSDM` | `imf` | directional (corroborated) |
| **salmon-fillet** | IMF global fish/salmon `PSALMUSDM` | `imf` | trend corroborated |

To push **onion/russet/romaine/tomato to high** you need a *non-AMS* dollar level
(NASS farm price is a different basis → trend only; there is no second wholesale
agency for produce), so they top out at medium on free public data — that's the
honest ceiling, not a wiring gap.

---

## Per-ingredient reference (verified sources from the coverage panel)

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

**IMF trend (FRED) — config-only now (fan-out shipped).** The fetcher fans out a
`fred` array of series (`fredSpecs()`), each settling independently. Make `fred`
an array and add the IMF series alongside the existing one:
```jsonc
"fred": [
  { "seriesId": "<existing>", "family": "bls", "type": "bls" },
  { "seriesId": "PBEEFUSDM", "source": "fred-imf-beef", "basis": "index", "family": "imf-beef", "type": "imf" }
]
```
Give each fan-out series a distinct `source` (or the loader derives `fred-<seriesId>`).
Tag the IMF series `type:"imf"` so it counts as an independent trend type; keep
BLS-rehosts under `family:"bls"` so they don't.

---

## Engine overhaul — SHIPPED (P1 #36, parity JS/TS + vectors)

All four increments are in this branch, behaviour-identical across the storefront
`composite-price.js` and the Ledger `composite-price.ts`:
- **Type-counting (keystone):** confidence = `min(level, trend)` on independent
  source TYPES; correlated terminals collapse. (onion-overstatement fix.)
- **Range-widening:** `union(cross-market p25–p75, rolling weekly-MAD band)`,
  `half-width = 0.6745·1.4826·MAD`, de-correlated per family; `rangeBasis` tags
  markets / volatility / point. Single-source items get an honest band.
- **Level-agreement:** `typeDispersion = 1.4826·MAD / median` of per-type medians;
  >15% caps the level at medium (catches a wrong-commodity 2nd source).
- **Stability:** Theil–Sen detrend → residual `rCoV` (`trend.noise`); >20% → low,
  >8% → medium. A smooth spike keeps high; jagged scatter drops.

Effect takes hold on the next live fetch (the orchestrator recomputes confidence).

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
cutout (proteins), and the IMF FRED trend series (fan-out now shipped — config
only). **New key (optional):** NASS (produce/eggs farm survey), EIA (energy).
