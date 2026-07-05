# Cost Index — promoting withheld ingredients to a live read

**Goal:** honestly move ingredients from *coverage-in-progress* (no live read) to a
published live read — by earning the confidence bar, never lowering it. An
ingredient ships only when a real wholesale **dollar level** resolves in bounds
and the read is corroborated. This runbook is the "I have the API keys" bridge.

Everything here needs network + keys and **cannot run from the web sandbox**
(the source hosts aren't allowlisted). Run it in a local/worker terminal:

```sh
export FRED_KEY=…   BLS_KEY=…   AMS_KEY=…
```

Units are handled for you: `tools/_shared/cost-index-sources.js` normalizes
`$/cwt → $/lb`, `cents → dollars`, `$/oz`, `$/kg`, etc. automatically, and keeps
pack units (`carton`, `dozen`) native. So a `Dollars Per Cwt` report lands as
`$/lb`, not 100× high. `unitClass(pu)` tells you whether a source is a weight
unit (valid for a `$/lb` ingredient) or a pack unit.

---

## The promotion targets (from the source-mapping audit)

| Ingredient | Blocker today | Path | Reachable? |
|---|---|---|---|
| **pork-belly** | LMR 2498 `$/Cwt`, `verified:false` | verify + flip | ✅ likely |
| **pumpkin** | AMS `carton`, `verified:false`, 1 outlier | verify + flip (unit = carton) | ✅ likely |
| **ground-pork** | LMR `$/cwt` mapped, not fetched | verify + flip | ✅ likely |
| **poblano-pepper** | AMS `carton`, no current point | fetch (verify first) | ✅ likely |
| **striploin** | real `$/cwt` level but **single market family** | add a 2nd LMR market to sources.json, then verify | 🟡 needs mapping |
| **vegetable-oil** | only a PPI **index** (no dollar level) | wire AMS report **3190** (GX_GR117, Crude Soybean Oil, Central IL, cents/lb), then verify | 🟡 needs mapping |
| 15 seafood cuts (salmon, shrimp, crab, lobster, scallops, clams, squid…) | index proxies, ~10 pts, **no free $/lb source mapped** | needs a free wholesale seafood dollar report (may not exist) | 🔴 blocked → stay archive-only |

---

## Step 1 — Confirm the report ids resolve (dry run, no writes)

```sh
# Reports every ingredient×source: resolve/fail + in-bounds, and which are READY.
FRED_KEY=$FRED_KEY BLS_KEY=$BLS_KEY AMS_KEY=$AMS_KEY \
  node scripts/verify-cost-index-sources.mjs
```

For a staged one that doesn't resolve, find the exact report/commodity/unit:

```sh
node scripts/verify-cost-index-sources.mjs --discover "pumpkin"          # find report ids
node scripts/verify-cost-index-sources.mjs --list-commodities 2282       # every commodity term in a report
node scripts/verify-cost-index-sources.mjs --sample 2282 --match pumpkin # see real rows + the price_unit field
# LMR cut reports (pork-belly, striploin): add the section + --lmr
node scripts/verify-cost-index-sources.mjs --list-commodities 2498 "Cutout and Primal Values" --lmr
node scripts/verify-cost-index-sources.mjs --discover-fred "soybean oil" # for the vegetable-oil AMS/FRED level
```

Wire the confirmed `reportId` / `commodity` / `priceUnit` into
`data/cost-index-sources.json` for anything still `STAGED` (striploin's 2nd
market, vegetable-oil's AMS 3190). Keep `priceUnit` exact — the normalizer reads it.

## Step 2 — Flip the READY ones to `verified:true`

```sh
# Rewrites verified:true ONLY for ingredients that resolved in bounds + corroborated.
FRED_KEY=$FRED_KEY BLS_KEY=$BLS_KEY AMS_KEY=$AMS_KEY \
  node scripts/verify-cost-index-sources.mjs --flip
git diff data/cost-index-sources.json     # review exactly what flipped
```

## Step 3 — Fetch the live artifact, then vendor it

```sh
# Fetch composes verified:true sources into a clean artifact (does NOT touch data/).
FRED_KEY=$FRED_KEY BLS_KEY=$BLS_KEY AMS_KEY=$AMS_KEY \
  node scripts/fetch-cost-index-sources.mjs --live --out /tmp/ci-artifact.json

# Vendor the artifact into data/cost-index.json (the source of truth for pages).
node scripts/build-cost-index.mjs --artifact /tmp/ci-artifact.json
# add --dry-run first to preview; never invents points if the fetch came back empty.
```

## Step 4 — Extend the deep history (optional, for the newly-live ones)

```sh
# Deep per-ingredient weekly backfill. Big window = more history.
COST_INDEX_SERIES_DAYS=9200 FRED_KEY=$FRED_KEY BLS_KEY=$BLS_KEY AMS_KEY=$AMS_KEY \
  node scripts/fetch-cost-index-sources.mjs --history-out data/cost-index-history.json --resume
```

## Step 5 — Rebuild every downstream surface + gate

```sh
node scripts/build-cost-index-pages.mjs      # pages, JSON-LD, series downloads, exports
node scripts/build-cost-index-feed.mjs        # feed.json
node scripts/build-cost-lockfloat.mjs         # Cost Pulse lock-or-float
node scripts/build-seasonality.mjs            # seasonal normals
node scripts/build-cost-revisions.mjs         # revisions audit trail
node scripts/build-llms-txt.mjs               # llms.txt
node scripts/check-all.mjs                    # the full gate — must stay green
```

---

## What "READY" means (the bar you're clearing, not lowering)

`verify --flip` only promotes an ingredient when, on live data:

- at least one **LEVEL-bearing** source resolves **in bounds** (a real wholesale
  dollar, `basis` ≠ `index`), **and**
- ≥ 2 independent sources resolve (a corroborated trend), **or** a measured
  cross-market range with ≥ 3 market families.

A single uncorroborated source (today's **striploin**) or an index-only series
(today's **vegetable-oil**) will **not** flip — which is why the seafood
index-proxies stay archive-only until a free dollar source is found. That gate
is the whole reason a Muntin number is trustworthy; this runbook earns past it,
it never removes it.
