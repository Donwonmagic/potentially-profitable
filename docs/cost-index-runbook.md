# Cost Index — operator runbook

Every command for taking the Muntin Restaurant Cost Index from placeholder
source IDs to live data on the pages. Run these **locally or in the worker env**
(the source APIs aren't reachable from the web sandbox). Status + roadmap:
[cost-index-status.md](./cost-index-status.md).

---

## 0. Keys (one-time)

The simplest path: just put the keys on the command line. Node reads them from the
environment at runtime, so prefix the command and you're done — no file to create,
nothing to gitignore, nothing to forget:

```bash
FRED_KEY=… BLS_KEY=… AMS_KEY=… node scripts/verify-cost-index-sources.mjs
```

For a whole shell session (so you stop re-typing them), export once:
```bash
export FRED_KEY=… BLS_KEY=… AMS_KEY=…
node scripts/verify-cost-index-sources.mjs      # picks them up
```

Registration links:
- **FRED** — https://fredaccount.stlouisfed.org/apikeys
- **BLS** — https://data.bls.gov/registrationEngine/
- **USDA AMS (MARS)** — https://mymarketnews.ams.usda.gov/ (Settings → Request API Key)
- **EIA** (diesel/freight) — https://www.eia.gov/opendata/register.php
- **USDA LMR Datamart** (beef/pork, likely keyless) — https://mpr.datamart.ams.usda.gov/

> curl gotcha: `AMS_KEY=… curl -u "$AMS_KEY:"` sends an EMPTY key — bash expands
> `$AMS_KEY` before the inline assignment applies. `export AMS_KEY=…` first, then curl.

> Optional: if you'd rather keep the keys in a file, `cp .env.example .env`, paste
> them, and run with the `--env-file=.env` flag instead of exporting. Purely a
> convenience — the inline form above needs no file. `.env` is gitignored; never commit it.

The rest of this runbook assumes you `export`ed the keys (or prefix each command
with `FRED_KEY=… BLS_KEY=… AMS_KEY=…`).

---

## 1. Verify which source IDs resolve

```bash
node scripts/verify-cost-index-sources.mjs
```
Reads each ingredient × source, reports `✓ resolves (latest, in-bounds)` /
`✗ error` / `fetched OK, 0 priced rows matched` (= report resolves but the
adapter can't read it yet → inspect its JSON, step 3). An ingredient is **READY**
when ≥1 level-bearing source is in bounds AND ≥2 sources resolve.

> **AMS fetches are date-windowed** (last 120 days by default) — the produce
> terminal "Report Details" sections carry all history (some ~1.9M rows) and an
> unscoped fetch is huge/slow. Tune or disable: `AMS_WINDOW_DAYS=60 node …` or
> `AMS_WINDOW_DAYS=0` for full history. Every request also has a 25s ceiling
> (`FETCH_TIMEOUT_MS`) so one slow report can't hang the run.
>
> Salmon/shrimp print `noaa only — dormant`: no free public wholesale source, so
> they carry no live point by design (not a bug, not stuck).

Flip the READY ones to `verified:true`:
```bash
node scripts/verify-cost-index-sources.mjs --flip
```

## 2. Find AMS report IDs (when one is ✗ / wrong)

The API wants the **numeric** report id (the `LM_XB403`-style slug 404s):
```bash
node scripts/verify-cost-index-sources.mjs --discover beef
node scripts/verify-cost-index-sources.mjs --discover "boxed"
node scripts/verify-cost-index-sources.mjs --discover --all > /tmp/ams-reports.txt   # full dump to grep
```
Put the numeric `reportId` into `data/cost-index-sources.json` (`ams.reportId`).
`ams` may be an ARRAY of terminal markets (national range) — see the produce
entries. `ams.commodity` filters a multi-commodity report to one ingredient.

## 3. Inspect a report's JSON (to map fields)

```bash
curl -s -u "$AMS_KEY:" "https://marsapi.ams.usda.gov/services/v1.2/reports/2282/Report%20Details" | head -c 3000
```
Shows where rows live (`results`?), the commodity field, and the price fields —
so the adapter's `reducer` (mostlyMid → mostly_low/high or low/high) and
`commodity` match are correct.

## 4. Go live (once sources are verified)

```bash
node scripts/verify-cost-index-sources.mjs --flip          # set verified:true
node scripts/fetch-cost-index-sources.mjs --live --out /tmp/ci.json   # fetch real points
node scripts/build-cost-index.mjs --artifact /tmp/ci.json                  # vendor → data/cost-index.json (fact-gated)
node scripts/check-cost-index-sync.mjs --check                             # gate: verified + sourced + bounded + fresh
node scripts/build-ingredient-yield-pages.mjs && node scripts/inject-lazy-script-loader.mjs   # render onto pages
node scripts/check-all.mjs                                                  # full gate
```
After this, the live range/trend renders on every covered ingredient page.

## 5. Beef & pork (boxed-beef cutout / negotiated pork)

Not in the Market News directory by name — check whether they ride the AMS key
or need the LMR Datamart:
```bash
node scripts/verify-cost-index-sources.mjs --discover beef
curl -s -u "$AMS_KEY:" "https://marsapi.ams.usda.gov/services/v1.2/reports/2461" | head -c 1500   # LM_XB459 boxed beef
```
If `2461` returns rows → same key, just fix the report IDs. If it 404s → it's the
LMR Datamart (https://mpr.datamart.ams.usda.gov/), and we add a fetcher.

---

## Demo (no keys, anytime)
```bash
node scripts/fetch-cost-index-sources.mjs        # runs the engine on canned payloads, prints composite points
```

## What each script does
| Script | Role |
|---|---|
| `verify-cost-index-sources.mjs` | confirm IDs resolve / `--discover` find AMS ids / `--flip` set verified |
| `fetch-cost-index-sources.mjs` | the orchestrator: fetch → screen → compose (`--live`, `--out <file>`) |
| `build-cost-index.mjs` | vendor verified+sourced points → `data/cost-index.json` |
| `check-cost-index-sync.mjs` | the CI gate (fact + freshness + parity) |
| `build-ingredient-yield-pages.mjs` | renders the "Market read" panel from `data/cost-index.json` |
