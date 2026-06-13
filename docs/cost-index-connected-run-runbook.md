# Cost Index — Connected-Run Runbook

> The offline work (engine, gates, methodology draft, source triage, staging) is
> done. Finishing the sources — the "do this first" gate on the methodology and on
> S2/S3 — needs a run with **outbound network + API keys**, which the web
> environment does not have (MARS/NASS/FRED return 403; no `*_KEY` env vars). This
> is the ordered, one-pass sequence for a credentialed run (the weekly refresh
> workflow already has the keys as repo secrets; this can also run locally with the
> keys exported). Compiled 2026-06-13.

## 0. Prerequisites

```sh
# Required secrets (the cost-index-refresh workflow already holds these):
#   AMS_KEY  LMR_KEY  FRED_KEY  BLS_KEY  EIA_KEY     (+ NASS key for D4)
node scripts/verify-cost-index-sources.mjs --probe   # confirm every key resolves + endpoints reachable
```

The build → gate → commit loop referenced below (run after each source change):

```sh
node scripts/build-cost-index.mjs --artifact /tmp/ci-artifact.json
node scripts/reconcile-cost-index-trends.mjs
node scripts/build-cost-index-seed.mjs
node scripts/build-cost-index-health.mjs        # <- added to refresh this session
node scripts/build-seasonality.mjs              # <- added to refresh this session
node scripts/build-cost-index-pages.mjs
node scripts/sync-includes.mjs && node scripts/inject-lazy-script-loader.mjs && node scripts/build-sitemap.mjs
node scripts/check-all.mjs                       # must stay green (177+)
```

## 1. Flip the resolved-but-unverified terms (11) — fastest coverage win

Each already has its source term resolved in `data/cost-index-sources.json`; they
only need a live probe to confirm and flip `verified:true`.

```sh
node scripts/verify-cost-index-sources.mjs --flip
```
Targets: striploin (LMR 2453 / IMPS 180), napa-cabbage ("Chinese Cabbage"), daikon,
serrano/poblano/habanero-pepper, red-onion (Onions Dry + RED), red-potato
("ROUND RED"), cantaloupe ("Cantaloup"), whole-turkey (National Turkey Report 3647).
→ Expect ~11 ingredients to move `absent → measured`. Run the loop, commit.

## 2. Re-flip the NOAA-deferred seafood (8) — once NOAA FOSS is back

These are verified sources held only by a transient NOAA outage. Confirm the
endpoint is live, then re-flip.
Targets: whole-halibut, whole-trout, scallops, whole-crab, octopus,
salmon-skin-on-fillet, clams, squid. Run the loop, commit.

## 3. Wire the last two staged specs (final source design)

- **ground-pork** — pork trim 72% in the LMR pork-cutout/FOB family; resolve the
  exact slug/field, stage, `--flip`.
- **lamb cuts** (leg-of-lamb, lamb-shoulder, lamb-loin, rack-of-lamb) — LMR lamb
  family (e.g. LM_XL552); resolve slug, stage, `--flip`.

## 4. D2 — add NDPSR dairy as a new source family

Lifts butter + cheddar from FRED/BLS proxies to mandatory weekly transaction data.
Wire NDPSR (MARS API) into `fetch`/`verify`/the source spec; `--flip`; loop; commit.
Proves the "add a whole source family" pattern (roadmap D2).

## 5. D4 — one driver via NASS QuickStats

Wire a corn or cold-storage series as a labeled "what's moving this" line on protein
cards (needs a NASS key). Correlational, method-linked (roadmap D4 / methodology §10).

**Already staged (activates on the next FRED fetch — no new step):** the
`seafood-import` driver (BLS Import Price Index Fish & Shellfish, `IR01000` via
FRED, index basis) — an aggregate seafood-complex direction feeding the lead-lag
analyzer for the seafood items. Inert until FRED is fetched; just run the loop.

## 6. The retail↔wholesale spread method (methodology §7)

Stage the ERS Food Dollar Series (farm/marketing share) + a BLS APU retail series
(via FRED) for the target ingredient(s). Validate the implied wholesale against our
own observed wholesale↔retail ratio where both exist; publish as `derived` only,
with the lag/volatility caveats. Converts select `absent` items → honest `derived`.

## 7. Then — and only then — the product + methodology finish

- **S2 seasonality education** — author the USDA AMS Seasonal Produce Guide windows
  (the sourcing posture you chose); needs the guide reachable to cite precisely.
- **S3 seasonal render hook** — wires automatically as ingredients cross `ready`
  (≥2yr per month); nothing to do until the history is there.
- **Methodology publication** — fill the §17 source register against the now-final
  surface, then ship `docs/cost-index-methodology.md` as the web-routable page.

## Done-when

`absent` shrinks from 24 to the ~3 genuinely-no-public-source items (branzino,
oyster-mushroom, ground-turkey), every shipped ingredient is `measured` or honest
`derived`, the source register is final, and the methodology page goes public.
