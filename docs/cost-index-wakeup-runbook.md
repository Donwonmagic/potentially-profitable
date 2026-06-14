# Cost Index — Wake-Up Runbook (light it all up)

> One keyed pass turns everything staged this session into live surface. Built
> 2026-06-14 overnight. Everything below needs your local clone + the `*_KEY`
> secrets exported (this is the connected work the cloud agent can't do).
> Run from the **`potentially-profitable`** clone (NOT the `extract` / invoice repo).

## Step 0 — bank your uncommitted backfill run FIRST
Your last session left an *uncommitted* local run (the flips + the 20-item deep
backfill → 100 measured / 6 absent / 4 seasonal bands). Commit it before pulling, or
it's at risk:
```sh
cd ~/path/to/potentially-profitable
# short-rib still needs a label (the seed skipped it):
#   add to data/cost-index-labels.json "labels": "short-rib": { "en":"Short rib","es":"Costilla corta de res","unit_en":"lb","unit_es":"libra" },
node scripts/build-cost-index-seed.mjs
node scripts/inject-glossary-verified-stamp.mjs
node scripts/inject-glossary-article-schema.mjs
node scripts/check-all.mjs                 # expect green (181/181)
git add -A && git commit -m "Cost Index: bank live vendor + 20-item backfill (4 seasonal bands)"
git push origin claude/muntin-invoice-decoder-audit-d7upo
```

## Step 1 — pull the night's code
```sh
git pull --rebase origin claude/muntin-invoice-decoder-audit-d7upo
```
Brings: the **AMS deep-stitch** (produce backfill unlock), the product/quotability
polish, and the enriched specs. None touch your data files — clean rebase.

## Step 2 — keys
```sh
export AMS_KEY=…  LMR_KEY=…  FRED_KEY=…  BLS_KEY=…  EIA_KEY=…   # + NASS_KEY if wiring D4
```

## Step 3 — the connected lighting-up sequence
```sh
# (a) Land the last stragglers (lamb cut column via --discover if needed; ground-pork/turkey already wired)
node scripts/verify-cost-index-sources.mjs --flip

# (b) DEEP BACKFILL — now stitches AMS produce too (the fix shipped overnight).
#     1100 days ≈ 3y = enough to activate bands; bump to 4500 for fuller depth.
COST_INDEX_SERIES_DAYS=1100 node scripts/fetch-cost-index-sources.mjs --live --history-out data/cost-index-history.json

# (c) Normal vendor (current week) → artifact → vendored index
node scripts/fetch-cost-index-sources.mjs --live --out /tmp/ci-artifact.json
node scripts/build-cost-index.mjs --artifact /tmp/ci-artifact.json
node scripts/reconcile-cost-index-trends.mjs

# (d) Rebuild every derived surface (seasonality now lights up across produce)
node scripts/build-cost-index-seed.mjs
node scripts/build-cost-index-health.mjs
node scripts/build-seasonality.mjs        # expect "N ready" to jump well past 4
node scripts/build-cost-index-pages.mjs
node scripts/build-ingredient-yield-pages.mjs
node scripts/sync-includes.mjs && node scripts/inject-lazy-script-loader.mjs && node scripts/build-sitemap.mjs
node scripts/inject-site-counts.mjs
node scripts/inject-cost-index-dataset-date.mjs        # re-stamp Dataset dateModified after the hub regen (gated)
node scripts/inject-glossary-verified-stamp.mjs && node scripts/inject-glossary-article-schema.mjs

# (e) Gate + bank
node scripts/check-all.mjs                 # → green
git add -A && git commit -m "Cost Index: full backfill + produce seasonal bands live"
git push origin claude/muntin-invoice-decoder-audit-d7upo
```

## Step 4 — make it self-sustaining (so you never hand-vendor again)
In GitHub: **Settings → Secrets and variables → Actions** → add `FRED_KEY`,
`BLS_KEY`, `AMS_KEY`, `LMR_KEY`, `EIA_KEY` (+ `NASS_KEY`). Then the daily
`cost-index-refresh.yml` runs itself; the freshness heartbeats go red if it ever
stalls. Without these the cron self-skips ("No source API keys configured").

## What you'll see when it's done
- **Produce seasonal bands live** — `build-seasonality` jumps from 4 `ready` to dozens
  (every AMS/NOAA item with ≥2yr of stitched history crosses the bar).
- **`absent` collapses to ~3** (branzino, oyster-mushroom, ground-turkey — honestly no public series).
- Daily auto-refresh keeps it all current.

## Then — the next builds (specs are turnkey; see docs/cost-index-audit-2026-06-14.md)
In value order: AMS National Retail (poultry/egg retail leg) → World Bank Pink Sheet
(free dollar levels for coffee/cocoa/banana/shrimp) → GATS import unit-value →
APHIS HPAI (egg/poultry avian-flu signal). Each is spec'd in
`docs/cost-index-adapter-specs.md`; each needs one connected run.
