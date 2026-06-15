# Cost Index — Seafood Data Sourcing Plan (2026-06-15)

Why this exists: we retired the heterogeneous `WPU0223` "all seafood" PPI as a
dishonest per-item corroborator (see `docs/cost-index-confidence-canon.md`). This
plan sources genuinely better — **free, public, fact-checkable, per-species** —
seafood data so each species earns honest corroboration (≥2 independent source
types) or a real 2nd dollar level. North Star: out-transparent the paid benchmarks
(Urner Barry / Expana) using only redistributable public data.

## What we already use
- **NOAA FOSS import unit value** (customs value ÷ quantity) — single-source per
  species wholesale-ish level (`noaa` source). The level for most finfish/shellfish.
- **IMF via FRED** — `PSALMUSDM` (salmon), `PSHRIUSDM` (shrimp). Tapped out: IMF
  publishes only salmon + shrimp for food fish (PFISHUSD is fish *meal*, industrial).

## Win 1 (shipped, staged) — per-species BLS PPI sub-codes
BLS publishes species-specific PPI children one level below `WPU0223` (current
through Feb 2026). Wired as the species-coherent 2nd trend type, **staged pending a
keyed verify** (same BLS API path as the proven shrimp `WPU02230501`):

| Species | Series | Item |
|---|---|---|
| Halibut | `WPU02230102` | whole-halibut |
| Salmon | `WPU02230103` | (note: file flags it stale; we use IMF PSALMUSDM instead) |
| Tuna | `WPU02230136` | tuna-loin |
| Shrimp | `WPU02230501` | shrimp (already) |
| Crab | `WPU02230502` | whole-crab |
| Lobster | `WPU02230503` | whole-lobster |
| Scallops | `WPU02230506` | scallops |

Also available if we add the species later: Flounder `WPU02230131`, Rockfish
`WPU02230135`, Other Finfish `WPU02230199`. **Do NOT use** discontinued variants:
`WPS022301` (WPS net), `WPU02230599`, `WPU02230603`.
Access: `api.bls.gov/publicAPI/v2/timeseries/data/` (free key, public-domain,
redistributable) — the call we already make; just more series IDs in the array.

## Win 2 (next build) — NOAA FOSS *Landings* $/lb (an independent 2nd NOAA type)
Distinct methodology from import unit value: **US domestic ex-vessel landings**
(pounds + dollar value → implied $/lb at the dock). A genuinely different point in
the chain, so it counts as an independent source type AND a real US dock-level dollar.
- Access: FOSS Landings ORDS API `https://www.st.nmfs.noaa.gov/ords/foss/landings/`
  (JSON), or the Annual Commercial Landings query tool (pounds/value/$-per-lb, 1990+).
- Caveats (label honestly): **annual** cadence is the reliable grain; **confidentiality
  suppression** rolls thin species into "finfishes, unc." — fact-check per-species
  coverage; it's an **ex-vessel dock** price, not wholesale — present as complementary.

## Win 3 (lower priority) — Census/USITC import unit value (a 2nd dollar level)
Customs value+quantity by HS-10 seafood line → import unit value $/kg, a dollar-level
cross-check for tuna/crab/lobster/shrimp. Access: Census International Trade API
`api.census.gov/data/timeseries/intltrade/imports/hs` (free key, public-domain).
**Caveat:** FOSS trade is itself derived from Census — so this is a *level cross-check,
not an independent trend type*. Never pair Census with FOSS as the "two sources."

## International (context only — never a US wholesale level)
- **EUMOFA** (EU first-sale, CC BY 4.0, redistributable) — covers 108 species incl.
  **trout & octopus** (our US dead-ends). EU geography → illustrative-international,
  clearly labeled, never a US price. `eumofa.eu/bulk-download`.
- **Japan Toyosu** (daily auction CSV) — tuna context; official site JP-only →
  too fragile for the fact-gate. Context only.
- **FAO GLOBEFISH** — report/PDF, citation only. **Norway SSB** — redundant with IMF salmon.

## Honest dead-ends (keep absent / expanding, do not fake)
- **Octopus** — no free US per-species price anywhere (EU/JP only). Keep expanding/absent.
- **Trout** — no US per-species PPI; mostly farmed, landings often suppressed. Keep expanding.
- **clams, squid** — no species PPI sub-code (fall into shellfish aggregate = the grab-bag);
  NOAA gives only an index (no level) → directional. No honest corroborator yet.
- **NEFSC/USDA Boston wholesale fish quotes** — the classic terminal feed is effectively
  dead (one survivor may be frozen ~2018). Do not build on it.
- **IMF beyond salmon/shrimp** — does not exist.

## Connected verification needed before trusting the staged codes
Run on a keyed clone (`BLS_KEY`, then the verify path):
1. Confirm each `WPU0223xx` series above returns live data + base period via the BLS API.
2. Probe the FOSS Landings ORDS endpoint for live JSON + field names (`nmfs_name`,
   `pounds`, `dollars`) and per-species confidentiality coverage.
3. Confirm Census `intltrade/imports/hs` seafood HS codes + value/quantity variables.
Then re-vendor → `build-cost-index-seed` → `check-shippable-bar` to materialize the
new ship/expanding split.

## Net
Retiring `WPU0223` cost us nothing real: salmon/shrimp keep IMF coverage, and the
species BLS children re-corroborate tuna, halibut, crab, lobster, scallops honestly
(several gaining a path to a 2nd dollar level via NOAA landings / Census). Only
**octopus and trout** are genuine free-data dead-ends — named and kept honest.
