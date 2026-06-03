# Muntin Restaurant Cost Index — live-fetch pipeline (build-ready staging)

**What this is.** The live-fetch layer for the Cost Index, staged because the
web sandbox can't run a Cloudflare Worker or reach the source APIs. The
*deterministic core* (composite engine + adapters + quality gate) is already
built, tested, and shipping in the storefront tools; this stages it as TS plus
the new worker that fetches the public sources and writes the artifact.

Pairs with the Track B staging in `../` (the Plate recost engine consumes the
Cost Index `seasonal` flag once this is live).

## Copy-paste map → `Muntin-Invoice-Decoder` (or a dedicated cron Worker)

| This file | Goes to |
|---|---|
| `src/composite-price.ts` | `apps/api/src/cost-index/composite-price.ts` |
| `src/cost-index-sources.ts` | `apps/api/src/cost-index/sources.ts` |
| `src/observation-quality.ts` | `apps/api/src/cost-index/observation-quality.ts` |
| `src/fetch-sources.ts` | `apps/api/src/cost-index/fetch-sources.ts` |
| `src/orchestrator.ts` | `apps/api/src/scheduled/cost-index.ts` |
| `tests/*.test.ts` | `apps/api/tests/cost-index/` |
| storefront `data/cost-index-sources.json` | copy into the worker (the mapping) |
| storefront `data/cost-index-bounds.json` | copy into the worker (the quality bands) |

## The parity contract (do not break)

`composite-price.ts`, `cost-index-sources.ts`, and `observation-quality.ts` are
faithful ports of:

- `tools/_shared/composite-price.js`
- `tools/_shared/cost-index-sources.js`
- `tools/_shared/observation-quality.js`

The 9 + 8 + 9 vectors in `tests/` are copied verbatim from the storefront
suites. They are the guarantee that the ingredient-yield pages, Bench's
market-trend line, and Plate's seasonal flag all read the *same* composite the
storefront computes. Change the math in one repo → change it in the other in
the same commit.

## Architecture (Pod A/B/C)

```
cron (event.cron: daily | weekly | monthly — matched to each source's cadence)
  └─ orchestrator.runCostIndex(env)
       └─ per ingredient (Promise.allSettled — one source dying ≠ run dies):
            ├─ fetch-sources: fetchAms / fetchBls / fetchFred
            │    • conditional GET (ETag / If-Modified-Since), KV-cached
            │    • retry transient classes only, jittered backoff
            │    • per-source circuit breaker (KV)
            │    • a 200 that fails the normalizer = POISON, never retried
            ├─ observation-quality.screen()  (bounds-aware; reject / down-weight / stale)
            ├─ cost-index-sources.buildCompositeInput()
            └─ composite-price.assess() → one point (level range + blended trend
               + confidence word + provenance + honest label)
       └─ R2: artifact/cost-index.json (+ history/<date>.json rollback)
```

**THE CARDINAL RULE (enforced in `orchestrator.ts`):** a stale / broken /
breaker-open source contributes **nothing** — omitted from `levelObs` /
`sourceSeries`, never carried-forward or fabricated. Confidence then steps
`high→medium→low→directional` on its own and the range widens. A zero-point run
serves the **last-good** artifact with a staleness badge + an alert — never blank.

## "Real-time," done honestly

Sources are daily/weekly/monthly. So "real-time" = freshest-available + a
visible `As of {asOf} · N sources` line (asOf = the *oldest* contributing data
date) + a green/amber/grey freshness badge + the engine's confidence word
verbatim. **Forbidden:** a "live" spinner or "updated 2 min ago" — fetch-age ≠
data-age is a currency lie.

## Verify

```bash
pnpm -C apps/api test cost-index    # 26 verbatim vectors (composite + sources + quality)
pnpm -C apps/api typecheck
```

Worker dry-run (miniflare): inject `fetchImpl` with canned fixtures, run
`runCostIndex`, assert the R2 artifact carries banded provenance and an honest
label; `curl` the public route for `cache-control`.

## Needs the founder / live env (pins, not portable here)

- **API keys** (Worker secrets): USDA AMS Basic-auth key (mymarketnews), BLS
  registration key, FRED key. The fetchers no-op without them.
- **Verify every source id** in `cost-index-sources.json` (all `verified:false`
  today) against each API's discovery endpoint (AMS `/reports`, BLS series
  directory, FRED `/series/search`) and flip `verified:false → true`. The
  orchestrator **skips unverified entries** — nothing renders behind the fact
  gate until a real id is confirmed.
- **NOAA Fisheries** fetcher (annual, CSV) — stubbed out of this batch; add when
  seafood coverage is needed.
- **First-party delivered pool** (the moat) — k≥10, lagged, ranges-only, and
  **antitrust counsel before it powers anything public**. Inert until then; the
  public sources carry the index in the meantime.
- **`check-source-contracts.mjs`** golden-fixture hash gate + the parity/
  freshness gate on the vendored `data/cost-index.json` — wire into CI when the
  artifact ships to the storefront build.
