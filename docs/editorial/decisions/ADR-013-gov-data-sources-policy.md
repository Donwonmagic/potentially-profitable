# ADR-013 — Government data-sources policy (NASS / Census / EIA): light up only the honest subset

- **Status:** ACCEPTED — the policy is binding; the build sequence is IN PROGRESS (deseasonalization DONE = ADR-014; rest awaits the operator's live fetch)
- **Date:** 2026-07-09
- **Owner:** Cost Index / strategic council
- **Review by:** 2026-10-09
- **Relates to:** ADR-014 (cold-storage deseasonalization); the absolute fact gate; the measured/derived/absent confidence tiers; `tools/_shared/cost-index-fetch.js` (`fetchCensusTrade`/`fetchEia`), `scripts/fetch-cost-index-sources.mjs`, `scripts/fetch-pressure-observations.mjs`, `data/pressure-source-specs.json`, `data/cost-index-drivers.json`, `docs/cost-index-connected-run-runbook.md`.
- **Source:** a 13-expert + 3-adversary panel (ag-economists, trade/energy economists, category specialists, time-series statistician, data engineer, SEO/AEO, chef-buyer, fact-gate auditor, skeptic). Full transcript archived in the session workflow journal.

> Decision: NASS, Census, and EIA are US-government, public-domain, freely REDISTRIBUTABLE
> (unlike IMF/World-Bank/FAO/UN-Comtrade). Use ONLY the honest subset they support: ONE
> calibration-proven NASS lead + diesel now; cold-storage signals ONLY after
> deseasonalization (ADR-014) and per-commodity gating; four Census exotics as
> **derived-tier only** (two after HS-code fixes; two rejected); energy as coincident
> context. **Nothing touches the measured price tier or the Vendor Benchmark reference.**

## Context

All three were built-but-DORMANT — fetchers existed, zero data was ever pulled; the
shipped price history is 100% USDA-AMS/LMR/FRED/BLS/NOAA. The operator can now run a live
fetch (keys + network on their Mac; the container has neither). The question the panel
answered: what to pull, and how to use it WITHOUT breaching the fact gate.

## Decision — per source

### NASS (USDA statistics)
- **NOW (zero code):** **Cattle-on-Feed PLACEMENTS → beef pressure direction** — the single
  calibration-proven NASS edge (beef-tenderloin, n=42, p=0.009, ~13-wk lead). Spec is
  `verified:true` and wired; just `NASS_KEY` + the fetch.
- **BLOCKER, then cold storage:** the NASS branch read raw first→last change — false spring
  signal. Fixed in **ADR-014** (5-yr same-month median anomaly). Cold-storage contributors:
  **pork** scored −1 but labeled *coincident*; **butter** scored −1 weak; **cheese & poultry
  descriptive-only** (structural/export-confounded); **beef excluded**.
- **AVOID:** building a NASS *price* fetcher (feed $/bu) unless the standing "no NASS price
  fetcher" position is relaxed (open question); reading any seasonal stock series raw.

### Census (International Trade imports by HS)
- **NOW → derived tier:** **green coffee HS 090111** and **cocoa HS 180100** (codes stable,
  ~100% imported) → lift `coffee-beans`/`cocoa-beans` from *absent* to **derived**, + driver
  lines (+ a cocoa↔West-Africa-harvest events co-occurrence). Confirm `UNIT_QY1=kg`, flip
  `verified:true` keeping `basis:'index'`.
- **FIX FIRST:** olive-oil `150910`→`150920/150930` and vanilla `090500`→`090510` — both HS
  codes were VACATED (silent zero-rows = looks like "no data", is a mapping bug).
- **REJECT:** saffron (grade-noise fabricates spikes); pine-nuts (HS `080250` is wrong — that
  was pistachios).
- **HARD GUARDRAILS:** an import unit-value is a DERIVED, customs-basis (below-wholesale),
  lagged, grade-mixed proxy — publish `derived`-only with caveats, NEVER measured, NEVER
  mixed into a measured basis, and **NEVER into the Vendor Benchmark reference** (a
  below-wholesale floor manufactures phantom overpayment on every invoice). Never add a
  diesel/freight figure onto a customs value to fake a "wholesale" number.

### EIA (energy)
- **NOW:** **diesel** (weekly retail, verified) → coincident freight ASSOCIATION label in
  Drivers. `EIA_KEY` + populate the existing `eia-diesel` driver labels.
- **NEXT:** demote the per-item diesel PRESSURE contributor to a single index-wide freight
  backdrop (it's inert — signal 0 on 6 of 7 items); commercial electricity as a standalone
  `kind:'energy'` context trend; enrich the `energy-oils` driver with the renewable-diesel→
  soy-oil channel; a read-only diesel context line on Vendor Benchmark's wholesale-vs-delivered
  explanation (never a pass-through number, never touches the gap verdict).
- **AVOID:** crude as an ingredient driver (double-counts diesel); nat-gas→fertilizer→feed→
  protein chains; any energy→single-ingredient pass-through / lead-lag / forecast.

### /open/ publishing guard (all three)
Redistribute the raw public-domain series + HS↔ingredient crosswalk (CC0). **Never
co-publish any IMF/World-Bank/Comtrade-derived series** (`imf-salmon`, `imf-shrimp`, FX,
deep-sea-freight — present in `pressure-source-specs.json`) — those are barred.

## Sequencing (for the operator's live fetch)
1. Zero-code: `NASS_KEY`+`EIA_KEY` → `fetch-pressure-observations.mjs --live` (placements + diesel).
2. Cold-storage deseasonalization (ADR-014 — DONE) → then run pork (coincident), butter, and demote cheese/poultry; run `check-pressure-honesty.mjs`.
3. Census exotics: verify `UNIT_QY1=kg` + flip coffee 090111 / cocoa 180100 (derived); fix olive/vanilla HS then ship; leave saffron/pine-nuts absent.
4. EIA cleanup: electricity standalone; demote per-item diesel to a freight backdrop; VB diesel context line; energy-oils enrichment.
5. Publishing wave on `/open/` (raw Census + crosswalk first, then derived exotics, cold-storage descriptive + "stocks don't invert to price" literacy note, diesel) — with the IMF/Comtrade guard.

## Open questions (founder call)
- Re-validate `cold-storage-pork` calibration after the ADR-014 patch (was computed on the raw path).
- Build a `fetchNass` price feed for corn/soy $/bu, or keep feed drivers on FRED/BLS?
- Vanilla publish-threshold: what mix-noise level = ship-derived vs hold-absent?
- Freight double-count: confirm exactly ONE series carries freight (pressure `eia-diesel` vs the shipped FRED GASDESW republish of the same EIA data).

## Consequences
- No measured-tier or Vendor-Benchmark exposure; every new number stays sourced or derived-with-caveats.
- `coffee-beans`/`cocoa-beans` move absent→derived; beef gains a proven placements lead; diesel becomes an honest freight association; `/open/` gains redistributable US-gov datasets — real "data company" assets.
