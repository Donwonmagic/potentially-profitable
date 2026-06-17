# Cost Index — Master Source Map & Build Plan (2026-06-15)

Exhaustive per-item hunt for FREE, PUBLIC, REDISTRIBUTABLE, FACT-CHECKABLE,
**independent** price sources, to lift each item's honest confidence. The North
Star: each item stands on its OWN reliability; more independent source TYPES =
higher honest confidence (≥2 corroborates direction; a 2nd independent **dollar
LEVEL** is the only path to honest `high`). Result of a 7-agent research sweep.

## Headline
**Almost nothing is a true dead-end.** We were under-sourced, not at the frontier.
Seven independent families lift nearly every item, and a dozen items can reach a
genuine 2nd dollar level (the path to `high`). Two "absent" items (leg-of-lamb,
lamb-shoulder) are fully rescued; trout/squid/clams rescued; only octopus, branzino
(US-domestic), fresh herbs, and a few minor roots stay honest dead-ends.

## The independence rules (honesty gates — read first)
A source only counts as a NEW independent TYPE if it's a different agency AND
methodology. Confirmed caveats:
- **BLS `WPU` (NSA) and its `WPS` (SA) twin are ONE source**, not two.
- **Census/USITC import unit value = the SAME Census/Customs data as NOAA FOSS
  import.** For SEAFOOD it is NOT independent of FOSS (a level cross-check only).
  For PRODUCE (whose level is USDA-AMS) it IS independent.
- **NASS is USDA**, same parent as AMS, but a genuinely different PROGRAM (survey
  farm-gate prices-received vs AMS market reporting). Count it as independent **with
  care** — prefer it as a corroborating dollar level, flag the shared parent.
- **AMS shipping-point / National-Retail / specialty-crop reports are AMS** — a
  re-skin of the terminal source, NOT independent.
- **BLS, IMF, World Bank, EUMOFA** are unambiguously independent of USDA/NOAA.

## The seven independent families
| Family | Gives | Access | Independent of |
|---|---|---|---|
| **USDA NASS QuickStats** prices-received | farm-gate **$ LEVEL** + stocks | `quickstats.nass.usda.gov/api` (free key) | AMS/LMR/NOAA (diff program) |
| **BLS PPI per-commodity tree** | index **TYPE** | `api.bls.gov/publicAPI/v2` (free key) | USDA, NOAA |
| **Census / UN Comtrade import unit value** | customs **$/kg LEVEL** | `api.census.gov/data/timeseries/intltrade/imports/hs` (free key) | USDA-AMS (produce); NOT NOAA-FOSS (seafood) |
| **NOAA FOSS Landings** | ex-vessel **$/lb LEVEL** + TYPE | `st.nmfs.noaa.gov/ords/foss/landings/` (no key) | NOAA-FOSS import (diff method), AMS |
| **World Bank Pink Sheet + IMF (via FRED)** | world benchmark **$ LEVEL** | FRED API (have) / WB monthly XLSX | all US sources |
| **State ex-vessel reports** | dock **$/lb LEVEL** | PDF/HTML scrape (Maine, Alaska ADFG, CDFW, ODFW) | federal/customs |
| **BLS APU retail** | retail **$ LEVEL** | BLS/FRED API | USDA |

---

## Per-category additions (what to wire, beyond current sources)

### Beef (have: LMR cutout + WPU022101 + APU retail)
- **NASS prices-received** cattle ($/cwt farm-gate) — NEW independent $ level (all beef).
- **IMF `PBEEFUSDM`** + **World Bank "Meat, beef"** — world benchmark $ level.
- **striploin's missing index = `WPU022101`** (the shared beef PPI; no per-cut beef PPI exists — `WPU02210133` discontinued Oct-2024).
- Census HS 0201/0202 import unit value — family-level $ cross-check (weak; US beef mostly domestic).
- **Dead-end:** no per-cut beef PPI anywhere; cut precision lives ONLY in LMR cutout.

### Pork (have: LMR cutout + WPS022104 + APU retail)
- **NASS prices-received** hogs ($/cwt) — NEW $ level (all pork).
- **IMF `PPORKUSDM`** (Global price of Swine) — world $ level (WB Pink Sheet has NO pork).
- **pork-belly's missing retail = `APU0000704111`** ("Bacon, Sliced"); tighten pork-shoulder retail to **`APU0000704411`**.
- Tighten pork PPI to **`WPU02210444`** (all fresh cuts).

### Lamb — RESCUED (was absent; had the wrong report 2650=imported)
- **USDA report `2649` (LM_XL502, Estimated Lamb Carcass Cutout)** — per-cut $ LEVEL: Leg IMPS 233A/234, Shoulder IMPS 207. PRIMARY.
- **USDA report `2648` (LM_XL500, boxed negotiated)** — 2nd independent wholesale $ level.
- **NASS sheep/lamb prices-received** — farm-gate $ level. **IMF `PLAMBUSDM`** — world $ level. **`WPU022103`** — lamb PPI index.
- → both lamb items go absent → 4-5 independent sources.

### Poultry (have: AMS national + WPU0222 + APU)
- **NASS prices-received** broilers/turkeys (¢/lb live) — NEW farm-gate $ level + type (whole-bird proxy; no per-part farm-gate exists).
- **Poultry PPI children** (finer than the WPU0222 aggregate): `WPU02220105` whole chicken, `WPU02220106` chicken parts, `WPU022202` turkey. **No breast/thigh/wing PPI exists** — parts is the floor.
- **chicken-thigh's missing $ level → AMS National Retail Chicken `MMN 2499`** (retail thigh $/lb) + AMS parts negotiated (wholesale thigh ¢/lb already in feed). Lifts thigh from index-only to a dollar level.
- **whole-chicken** is the best NASS fit (live whole bird). **whole-turkey** → NASS turkey + `WPU022202`.

### ground-turkey — partly resolved, capped at MEDIUM (honest)
- **AMS National Retail Turkey `MMN 3375`** — the ONLY free ground-turkey dollar level (retail feature $/lb). + NASS turkey (live-bird proxy) + WPU0222 (index).
- **Cannot honestly reach `high`** on free data: one real ground-turkey $ level; the rest are proxies (NASS=live bird, Census=cuts, BLS=index). The wholesale ground/trim benchmark is paid (Urner Barry) — name-only.

### Dairy & eggs (have: NDPSR + BLS + APU)
- **eggs → NASS eggs price-received ($/dozen)** — gold-standard independent farm-gate level (NASS survey ≠ AMS market-news ≠ BLS index); + AMS Egg Market News `pybshellegg` (Midwest large white wholesale); + `WPU01710703` large-eggs PPI.
- **butter / cheddar** already carry TWO $ levels (NDPSR wholesale + FRED retail). New independent adds: **CME spot cash dairy via AMS `MMN 1601`** (daily exchange-quote $/lb, block+barrel+butter — public-domain AMS republication; correlated with NDPSR by construction, frame as a quote level) + **NASS All-Milk price ($/cwt)** farm-gate input level.

### Oils / pantry — vegetable-oil's missing LEVEL resolved THREE ways
- **FRED `PSOILUSDM`** (IMF Global price of Soybean Oil, $/mt monthly — CONFIRMED live $1,241.44/mt Feb-2026) — one API call, independent dollar level + type.
- **World Bank Pink Sheet** soybean/palm oil ($/mt, monthly XLSX).
- **AMS National Weekly Ag Energy Round-Up `MMN 2805` / `LSWAGENERGY`** (crude soybean oil ¢/lb by region) — domestic wholesale level.

### Seafood — heavily expanded
- **NOAA FOSS Landings (ex-vessel $/lb)** — independent TYPE + dock LEVEL for: lobster, crab, scallops, **squid**, **clams**, salmon, flounder, rockfish (national rollups non-suppressed).
- **More per-species BLS PPI (active):** salmon `WPU02230103`, cod `…132`, pollock `…133`, clams `WPU02230504`, oysters `…505`, mussels `…507`, flounder `WPU02230131`, rockfish `…135`. (Skip squid/octopus/trout/catfish — no PPI.)
- **trout RESCUED:** NASS Trout Production grower price ($/lb). **catfish** bonus: NASS Catfish Processing (monthly producer ¢/lb).
- **squid:** CDFW Market Squid ex-vessel + FOSS landings. **State ex-vessel:** Maine lobster, Alaska ADFG salmon/crab/halibut, NOAA IFQ halibut/sablefish, Oregon Dungeness.
- **Census import** = level cross-check only (same as FOSS — NOT an independent type).

### Produce — the big under-sourced block (mostly USDA-AMS-only today)
- **NASS prices-received ($/cwt farm-gate)** — NEW independent $ level for: potatoes (**monthly $ + cold-storage stock level — strongest**), sweet-potato, bell-pepper, cucumber, pumpkin, carrot, lettuce, broccoli, cauliflower, celery, cabbage, onion, spinach, asparagus, snap beans, sweet corn, garlic, mushrooms (NASS Mushrooms $/lb), apples/citrus/berries (fruit). *Most produce is ANNUAL cadence (slow structural input); potatoes are the monthly exception.*
- **BLS PPI per-commodity (index TYPE):** veg `WPU0113xx` (cabbage 11, celery 13, lettuce 15, onion 16, asparagus 21, broccoli 22, cauliflower 23, spinach 24, greens 25, sweet corn `WPU01130214`, snap beans `…218`, green peppers `…228`, **tomato `WPU01130217`** — note: this is the TOMATO code we correctly retired from 69 items; tomato reclaims it); fruit `WPU0111xx` (grapefruit `…0101`, lemon `…0104`, apple varieties, pear `…0222`, melons `WPU011103`).
- **Census/UN Comtrade import unit value ($/kg LEVEL — the holy grail 2nd level)** for the import-dominated: **avocado HS 080440, lime 080550, banana 0803, pineapple 080430, garlic 070320, asparagus 070920**, plus Mexico-veg (peppers, cucumber, squash). Banana also **IMF `PBANSOPUSDM`** + World Bank.
- **BLS APU retail:** romaine `APU0000FL2101`, broccoli `APU0000712412`, tomatoes (few others).

---

## "Holy grail" — items that can reach an independent 2nd DOLLAR LEVEL (→ honest `high`)
- **Imported fruits** (avocado, lime, banana, pineapple): Comtrade import $/kg + (banana) IMF/WB → genuine 2nd level beside AMS.
- **Lamb** (leg, shoulder): LMR cutout 2649 + boxed 2648 + NASS + IMF — multiple levels.
- **Domestic seafood** (lobster, crab, scallops, squid, clams, salmon): NOAA landings ex-vessel $/lb beside FOSS import.
- **Beef / pork**: NASS farm-gate $ + IMF world $ beside LMR cutout.
- **Potatoes**: NASS monthly $/cwt + cold-storage level beside AMS.
> Decision still open (`docs/cost-index-confidence-canon.md`): whether to let two
> independent dollar levels at DIFFERENT chain points (cutout vs farm-gate vs import)
> earn `high`, or reserve `high` for two at the SAME point. Decide deliberately.

## Honest dead-ends (name them, keep absent/expanding)
- **Fresh culinary herbs** (basil, cilantro, parsley, mint, rosemary, thyme, oregano, tarragon, dill): no BLS PPI, no NASS price. AMS herb report = AMS re-skin. Genuine dead-end.
- **ginger, daikon, rutabaga**: not NASS-surveyed; no BLS leaf. AMS-only.
- **Per-variety chiles** (serrano, poblano, habanero): NASS only carries green/red chile aggregate; no per-variety. Bell pepper is clean.
- **octopus**: US import-proxy only (no domestic landings, no PPI). **branzino**: US-domestic dead-end; HS line is lumped into "other fish" (can't isolate). EUMOFA (EU) illustrative-only for both.
- **Per-color/sub-type lettuce, bok-choy, napa, leek, green-onion**: collapse into aggregate BLS/NASS codes — partial proxies only.
- **NEFSC Boston wholesale fish**: frozen at 2018 (the data.gov "2026" stamp is metadata, not data) — historical only.

## Ranked build plan (leverage × effort)
1. **NASS QuickStats prices-received** — *biggest single lift*: an independent farm-gate $ LEVEL across meat, poultry, dairy, eggs, ~25 produce, aquaculture (trout/catfish/mushroom). One API + free key. **Build first.**
2. **BLS PPI per-commodity tree** — broad independent index TYPE; the SAME BLS API we already call, just more series IDs. Map every item to its leaf. Low effort, high coverage.
3. **Census/Comtrade import unit value** — independent $ LEVEL for import-dominated produce (the holy-grail 2nd level). One API + key. (Seafood: cross-check only.)
4. **NOAA FOSS Landings** — independent ex-vessel $ LEVEL for domestic seafood. ORDS JSON, no key.
5. **World Bank Pink Sheet + IMF** — world $ benchmarks (banana, orange, beef, pork, lamb, shrimp, salmon, oils). FRED API (have).
6. **USDA AMS reports we're missing** — lamb cutout 2649/2648 (rescues lamb); AMS National Retail (poultry/egg/meat feature). MARS API (have).
7. **State ex-vessel** (Maine/Alaska/CDFW/ODFW) — independent dock $ but PDF/scrape (higher effort, lower priority).

## New-pipeline access notes (frontier scout, confirmed)
- **USDA AMS My Market News / MARS API** `https://marsapi.ams.usda.gov/services/v1.2/reports` (free key, HTTP Basic) — one catalog call lists every report's `slug_id`. Unlocks: National Retail Reports (meat/poultry/egg/dairy — the retail leg), **12–15 terminal-market cities** (not just our 8: +Asheville, Columbia, Philadelphia, Raleigh…), Shipping-Point & Movement, **organic** reports, and AMS cash (grain bids, Ag Energy oil, lamb cutout 2649/2648). Dairy/NDPSR is a *separate* API: MPR DataMart `https://mpr.datamart.ams.usda.gov/services/v1.1/reports/2993`.
- **World Bank Pink Sheet (CMO)** — `CMO-Historical-Data-Monthly.xlsx` (CC BY 4.0, no key); re-resolve the rotating URL hash from the landing page each run. Beef, banana, orange, soy/palm oil benchmarks.
- **USDA ERS Fruit & Vegetable Prices** — retail $/lb for 150+ items, BUT a periodic *snapshot* (2013/16/20/22/23), not a live feed. A level reference, not a tracker.
- **CME/CBOT settlement — DO NOT USE.** Its Information License Agreement bars redistribution; DTN/Barchart free tiers inherit the same restriction. Use AMS public-domain cash (NDPSR, grain bids, Ag Energy) instead.
- **International (illustrative only, label non-US):** EUMOFA (EU first-sale, bulk CSV), Eurostat (clean JSON-stat API), StatCan WDS (best-engineered API), FAO FPMA, Japan Toyosu (JP-only). Never blend into a US level.

## Connected verification checklist (do on a keyed clone — every agent was egress-blocked, so these are candidate-verify)
- **NASS** free key → `get_param_values?param=commodity_desc` to confirm which items have `PRICE RECEIVED` + cadence (monthly vs annual).
- **BLS API** → confirm each new `WPU0111xx`/`WPU0113xx`/`WPU0223xx` leaf is live + base period (flag discontinued: `WPU02210133`, `WPU022301`, `WPU02230199`, `WPU02230599`).
- **Census API** key → pull `GEN_VAL_MO`/`GEN_QY1_MO` + `UNIT_QY1` per seafood/produce HS-10; compute $/kg; confirm quantity unit is kg.
- **NOAA FOSS Landings** ORDS host (migration in progress: `st.nmfs.noaa.gov/ords/foss/landings/` vs `apps-st.fisheries.noaa.gov/ods/foss/`) — confirm live host + field casing (`afs_name`, `pounds`, `dollars`) + per-species suppression.
- **AMS MARS** → lamb reports 2649 (cutout) + 2648 (boxed), confirm per-cut rows.
- **IMF/FRED** → `PBEEFUSDM`, `PPORKUSDM`, `PLAMBUSDM`, `PBANSOPUSDM`, `PORANGUSDM` live + units.
- **World Bank Pink Sheet** XLSX row labels (soy/palm oil, banana-US, beef).
