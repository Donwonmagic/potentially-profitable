# Menu-Pricing + Cost-Pressure Roadmap — 2026-07-17

Resume-here plan for the menu-pricing corpus (dispatch + field-report study + CC-BY
dataset + engine) and the cost-pressure layer. Produced from two expert-panel
workflows (scholarly audit; pressure-weather expansion) plus a shipped honesty pass.
Ordering is by dependency, not ambition. **Nothing here loosens the fact gate.**

## Inviolable constraints (unchanged)
- Every number verifies against the engine/datasets or is labeled illustrative. Zero inventions.
- Descriptive, **never** forecast. Co-occurrence, **never** cause. Public wholesale is a **reference**, never a delivered/invoice price.
- Never claim peer-review, a controlled experiment, or statistical significance the work lacks. It is a practitioner **field report**.
- Bio: Don Goldstein, FOH at ONE brand (Tacombi), TWO locations. Never "two restaurants."
- Push only to `claude/vendor-benchmark-redesign-yn273q`. Commits end `Co-Authored-By: Claude <noreply@anthropic.com>` (no model id / session line in artifacts).
- Method: ground → build → adversarially verify → apply only survivors. The audits are strong signals, **not** ground truth — verify each against the engine before acting (see "Corrections" below).

---

## The four workflows in this arc

| # | Workflow (runId) | Ask | Status | Output → section |
|---|---|---|---|---|
| 1 | **menu-pricing-visual-panel** (`wf_bb8737cf-47d`) | "strive for greatness… visually impressive… doctorate level" | Done; survivors **applied** | §A0 below |
| 2 | **menu-pricing-scholarly-audit-and-dream** (`wf_c2ebb4cd-660`) | comprehensive citability/rigor audit + dreaming | Done (resumed this session) | §C |
| 3 | **corpus-datasource-dreaming** (`wf_082fb25e-360`) | "the dreaming should also apply to corpus data sources" | Done; **pending integration** | §C2 |
| 4 | **pressure-weather-expansion-dream** (`wf_56f5d741-31d`) | deepen the pressure signal + fuse into the read | Done (resumed this session) | §D |

All four are re-runnable: `Workflow({scriptPath: '<workflows/scripts/<name>.js>', resumeFromRunId: '<runId>'})`.

---

## A0. DONE — the visual / "greatness" panel (workflow 1, survivors applied)

27 agents; synth recovered from journal. Slate of 5 (2 cut-variants deduped, 7 cut):
1. **Served-pound "two haircuts" waterfall** (viz-waterfall) — the cremini reversal centerpiece (cremini 2.47× runs harder than beef-tenderloin 1.57× because it is mostly water). **Applied.**
2. Cohort-depth histogram (viz-bars distribution) — **applied, then superseded** by the hedge/mirror figure (75→94 pairs) during the honesty pass, which is the more honest framing.
3. **Rockets-and-feathers** 10:1 polarity pair (393/39) — **applied**, then re-caveated in the honesty pass (symmetric durations; percent-yardstick note).
4. Unify the four proteins to teal in the opening figure — **applied**.
5. Reconcile "four postures" title over five bars — **applied**.
Cuts (7): waterfall-that-replaces-trim-tax; single-cremini bar; share-of-432 histogram variants; viz-magbar (display:none <520px); rescaling Fig 1's `--w` (its `__num` are literal percents — forbidden).

Net: the dispatch went from 4 figures / 2 viz-kinds to **7 figures / 3 viz-kinds**, and every applied figure was later re-verified against the engine in the honesty pass.

---

## A. DONE — the honesty pass (4 commits, pushed; origin `31573c0f3`)

| Commit | Fix | Surfaces |
|---|---|---|
| `d20285634` | Co-movement 94% reframed as **mostly mechanical** (permutation null: random timing already lands company beside ~91% of moves; observed 94.2% is ~3pts above chance). Hedge/mirror stale count **91/75/16 → 94/78/16** reconciled + thin-evidence caveat (8 verdicts rest on ≤2 shared episodes; engine `thin` flag). 10:1 asymmetry reframed: count partly a percent-yardstick artifact; magnitude gap ~1.5× on a like-for-like (log) scale not ~2.5× raw; durations **symmetric** (up 77d / down 70d) → spike-and-revert, **not** Peltzman "rockets & feathers" (reframed Peltzman as an output-price seller-behavior caution, distinct from the input data). | dispatch EN+ES |
| `eb57769b5` | CC-BY `menu-pricing.json/.csv`: `band_pct` now carries the **measured** band for the 10 wide withholds (30.1–62.4%) instead of nulling all 37; new `withhold_reason` column (`too_volatile` vs `no_series`); note flags citrus `edible_yield_pct` = juice yield. | CC-BY dataset |
| `ec37097c0` | Citrus **juice-yield** qualifier (2.16× is juice extraction, not knife trim). | dispatch + study, EN+ES |
| `31573c0f3` | Study **"fourth layer"** corrected: 24 = the four-dataset *join* (price+yield+month+swap; engine `layer4`), NOT the cooking-loss layer (which covers the **21** priced ingredients with a measured cooked yield). | study + source JSON, EN+ES |

Engine-verified numbers behind the caveats (recompute anytime):
- Big moves: 393 up : 39 down = 10.08:1. Median |pct| up 85 / down 33 (raw 2.58:1); symmetric |log| up 0.615 / down 0.400 = **1.54:1**. Episode duration median: up **77d**, down **70d** (symmetric).
- Co-movement: 407/432 = 94.2%. Nulls: uniform-timing mean 90.9% / p95 92.8%; direction-shuffle mean 92.3% / p95 94.0%. Excess above chance ≈ **3 points**.
- Hedge/mirror: 94 pairs (78 hedge / 16 mirror), 8 `thin` (7 hedge + 1 mirror). k≤1 for 72/94.

---

## B. Corrections to the audits (grounding beat the panel — do NOT redo these)

1. **"Unify the yield spine" is a FALSE alarm — do not overwrite `ingredient-yields.json`.** The audit assumed it was unsourced (5/118 `yield_source`). It is **not**: every value is pinned to a canonical CIA `YIELD_TABLE` via `yield_key` and gated by `check-ingredient-yields.mjs`. The "disagreement" (46/112 slugs vs `ingredient-depth.json`) is **two differently-sourced references** (CIA book yields vs the USDA-FBG depth spine) that **never visibly collide**: depth's `edibleYield` shows only on *unpriced* kitchen profiles, never beside a CIA trim-tax. Overwriting `yields.json` would break its gate and shift flagship numbers (citrus 2.16→2.26) for zero honesty gain. If ever pursued, it's the audit's separate "Yield-Reference Disagreement Benchmark" (meta-science), NOT a data fix.
2. **The container engine is BEHIND the committed built pages** (two-writer gap; the operator's Mac built the live pages). Rebuilding `build-cost-index-pages.mjs` here churns ~131 files that don't map to any single change (ingredient pages *gain* `.ci-profile`; the study *loses* ~365 lines). **Full page rebuilds must happen on the Mac.** In-container, edit built HTML **in place** (surgical, matching committed strings) and update its source JSON so the next Mac rebuild stays consistent — as done for the study citrus/fourth-layer edits.

---

## C. Scholarly audit roadmap (menu-pricing corpus)

**Verdict:** today this is legally-reusable CC-BY grey literature whose one real strength is exact traceability (every headline reconciles to a runnable engine) — but it is **not** scholarly-citable: no DOI, no registry, and the flagship `/cost-index/menu-pricing/` page carries **no Dataset JSON-LD** (verified absent) despite the brief implying otherwise. Genuinely original & defensible: the 77-day median episode-duration statistic, the trim-tax arithmetic identity, and the hedge/mirror instrument (though every verdict is n≤6). Frontier, in order: (1) publication mechanics (DOI + Dataset JSON-LD + versioned frozen snapshot) — multiplies citability with zero new claims; (2) the permutation null for the 94% (DONE this pass); (3) a first-party wholesale→delivered invoice calibration (Mac/operator only).

**Citability (7)** — mechanics track, mostly in-container except the DOI mint:
1. **Dataset JSON-LD on `/cost-index/menu-pricing/`** (verified absent; page has only BreadcrumbList + SpeakableSpecification). Copy-adapt the ingredient price-card markup. **Highest leverage.** Effort S.
2. **Version-stamp + freeze** an immutable snapshot the study pins to (`menu-pricing.json` has no version/asOf). Effort S. *(Note: the CC-BY builder deliberately omits build timestamps to avoid churn — use a static `version` + a data-derived `asOf`, never a build clock.)*
3. **Zenodo/DataCite DOI** on the frozen CC-BY dataset + study snapshot (**Mac/browser step**). Present strictly as a persistent id for a practitioner field report — never implying peer review.
4. `band_pct=0` machine-readable honesty defect — **DONE** (`eb57769b5`).
5. **Structured "Cite this"** (author/year/version/publisher/DOI + BibTeX/RIS) — copy the weekly dispatch's "Cite this edition" template. Effort S.
6. **Reframe as a DATA DESCRIPTOR** (Data-in-Brief / Scientific-Data genre) — grades on provenance/reproducibility/reuse, not significance; converts every thin-n weakness from reject-reason to out-of-scope. Lead with the 432-episode dataset; demote hedge/mirror to an n≤6 appendix. Effort Low (reframe).
7. **Publish the depth spine** (`ingredient-depth.json`, 134 ingredients w/ per-field provenance + hedge) as its own CC-BY dataset w/ Dataset JSON-LD + DOI. Effort M.

**Depth upgrades (9)** — status marked:
1. Permutation null for the 94% — **effectively DONE** (verified; caveat shipped).
2. Retire raw 10:1, re-express on log-symmetric threshold + duration-by-direction — **DONE** (dispatch reframe).
3. "Unify yield spine" — **DROP** (see Corrections #1).
4. Relabel citrus edible→juice yield — **DONE** (dispatch + study + CC-BY note).
5. Correct study "fourth layer = 24" — **DONE** (`31573c0f3`).
6. **Reconcile artifact thresholds + publish a robustness table** (`isLikelyArtifact` flags |pct|>1000% = 8 events; documented `SEA_ARTIFACT_CAP`=175; 168 events exceed +100%). Pending.
7. **Attach dispersion/CIs to thin point estimates** (bootstrap for medians/proportions; beta-binomial credible intervals with a stated Beta(1,1) prior on each hedge k/n; trim-tax categories run n=4). Pending — high rigor value.
8. **Ship a `served_pound` column** (make the dispatch's served-pound table reproducible in the CC-BY file). Pending.
9. **Event-contamination screen** on the seasonal noise gate (the "eggs 80% cheaper in January" window is almost certainly the 2022–25 HPAI spike-and-recovery, not a season). Pending — methodology.

**Fresh directions (9, ranked; each a candidate new surface — "enrich every surface"):**
1. **The relaxation curve** — two hazard regimes behind the 77-day median (empirical survival S(t) + median-residual-life over the 432 durations).
2. **In-season is not safe** — the high-season shock is almost always a spike *up* (flatEvents × inHighSeason × direction; verified in-engine).
3. **2×2 risk atlas** — trim tax vs own-baseline price band over 96 priced ingredients (Pearson r = **−0.106**, verified — the two risks are empirically uncorrelated).
4. **Rockets travel in crowds, feathers travel alone** — sign of a big move predicts systemic vs idiosyncratic (25 lonely empty-cohort episodes, verified).
5. **The Cold-Hold Ledger** — a freeze-and-hold feasibility free tool (funnel-aligned; join pricingCards cheapMonth/savePct with depth freezeMonths/shelfLifeDays/storageMethod; 37 ingredients verified).
6. **Seasonality in bits** — Miller-Madow-corrected mutual information (calendar month → price) as a new CC-BY column replacing the binary gate.
7. **The Co-Movement Atlas** — the cohort graph as a citable weighted network (degree centrality) from `clusters()`.
8. **Culinary-to-Federal price-series crosswalk** — one row per slug → BLS PPI/CPI id, USDA AMS report, NASS commodity (a Rosetta concordance nobody has published).
9. **Ingredient Cold-Chain reference graph** — structure `storageMethod`/`shelfLifeDays`/`freezeMonths` into a machine-readable preservation reference + co-storage incompatibility edges.

**Cut (7):** comfort-swap paradox (premise factually false); republish events as a "network panel" (already shipped as CSVs); menu-as-ecosystem map (already at pair level); first-party invoice/yield-measurement logs (**not cut on merit — the single most valuable upgrades, but operator-only**); the almanac self-diff DOI series (folded into citability); the Yield-Reference Disagreement Benchmark (focus); the cross-source replication moonshot (needs a new pipeline).

---

## C2. Corpus-datasource dreaming roadmap (workflow 3 — pending integration)

**Verdict:** the corpus is spine-solid on pricing/posture + references but structurally thin in two places every unlock targets — (1) the **pressure layer is a shell** (12/82 live; import-dominated produce has zero pressure signal), and (2) no **fused present-state** record per ingredient. Every source below is US public-domain (redistributable) and gated on **seamless integration** — it must feed an existing surface (pressure panel, ingredient page, open-data), never a silo. All are **operator-Mac fetches** (keys + network); the container has neither.

**Ranked new public data sources (11):**
1. **US Census International Trade — monthly imports by HS6 (quantity)** — the missing supply signal for import-dominated produce (avocado/lime/mango/pineapple/banana) that has no pressure term today. Keyless.
2. **The Ingredient State Record** — a derived CC-BY per-slug fused present-state record (**capstone**), enabled by NASA POWER GWETROOT root-zone soil moisture. The "one fused record per ingredient" the corpus lacks.
3. **NOAA CoastWatch ERDDAP SST anomaly (OISST v2.1)** — marine-heatwave signal for seafood/shellfish.
4. **VegScape / NASS Cropland Vegetation Condition (MODIS NDVI)** — near-real-time crop condition (heavier: raster AOI-clip on the Mac).
5. **USGS streamflow + USBR RISE reservoir storage** — Western irrigation water supply.
6. **RCC-ACIS / NOAA nClimGrid growing-degree-days** — season-pace vs normal (keyless JSON).
7. **USDA AMS National Retail Report** — weekly advertised (featured) retail prices, meat + specialty crops.
8. **USDA APHIS HPAI confirmations** (birds affected, live) — same source the pressure roadmap wants for eggs/poultry (§D-deepen-5). Keyless.
9. **USDA ERS Meat Price Spreads** — farm/wholesale/retail + farmer's share (grounds the farm-share framing already cited).
10. **EIA Central Atlantic (PADD 1B) diesel** — DMV-regional freight refinement.
11. **USGS Mississippi/Ohio river gauges** — barge-chokepoint navigation (overlaps §D-deepen backlog).

**Cut (2):** USA-NPN accumulated GDD (redundant with #6); BLS Average Price APU retail "passthrough echo" (redundant third retail source + an honesty landmine — invites a wholesale→retail causal read).

> Overlap note: APHIS HPAI (#8), NASA POWER GWETROOT (#2 enabler), SST (#3), river gauges (#11), degree-days (#6) all also appear in the pressure-weather deepen list (§D). Treat the two roadmaps as **one fetch program** — every source lands as a tier-B/C pressure calibration candidate AND (where relevant) an Ingredient State Record field.

---

## D. Pressure-weather roadmap (cost-pressure layer)

**Verdict:** a well-engineered preview **mock**, not a live signal — status `preview`, asOf 2026-06-08 (~6 wks stale), 12 of 82 panels render, confidence is agreement-arithmetic (`track_record.n=1` everywhere). Frontier splits into deepen (fill biological blind spots + earn the tiers via the idle backtest) and fuse (weave present-tense pressure into the read, on-thesis) — both gated behind three prerequisites: repair the freshness clock, extend the honesty gate to `blog/`, stand up the editions spine.

**Three verified live defects (confirmed against code/data):**
1. **Dead freshness clock** — `tools/_shared/cost-pressure.js:96` computes `freshnessWeeks = asOf − anchorPrintDate` (two frozen build-time dates), so the ~6-wk-stale snapshot shows all 12 panels `freshness_weeks: 0`, `under_review: false`, full confidence. The `weeksPerNotch=3` decay and 8-wk `under_review` floor **never fire**. → **fix chosen as next step (§E).**
2. **Calibration idle** — `calibrate-pressure.mjs` is built (HAC SEs, walk-forward OOS, BH-FDR) but `data/pressure-calibration.json` is **absent**; every weight/tier/lead is hand-asserted. Under the zero-fabrication canon a spurious correlation *is* a fabrication → running the backtest is a fact-gate obligation, not a nicety. **Mac step** (keys + histories).
3. **Honesty gate blind to `blog/`** — `check-pressure-honesty.mjs` `scanDir` covers `cost-index/`, `es/cost-index/`, `tools/`, `es/tools/` only. The fusion target is ungated. (Naive extension would false-positive on ordinary prose using "because"/price patterns → must scope to marked pressure blocks, not all blog text.)

**Deepen (11):** (1) fix clock; (2) run backtest → commit `pressure-calibration.json` (Mac; human applies, never auto-tunes); (3) **NASS weekly corn/soybean condition** (leading feed anchor every protein/dairy panel lacks); (4) per-indicator volatility-scaled deadbands (retire global 0.02); (5) **APHIS HPAI flock-loss** (eggs/poultry can't register their biggest driver today; new event-count transform; keyless); (6) **cattle-cycle replacement-heifer** (beef's first A-tier anchor; all 4 cuts A0); (7) cattle-on-feed placements by weight group (cohort ledger); (8) **NASA POWER GWETROOT** root-zone soil moisture (replaces license-incompatible open-meteo proxy, leads USDM drought); (9) degree-day/frost-degree derivation; (10) NHC tropical-cyclone hazard flag (keyless); (11) NOAA OISST Gulf-of-Maine marine-heatwave. **All ship B/C as calibration candidates; earn A only by clearing the backtest — never hand-set to A.**

**Fuse (7):** (1) extend gate `scanDir` to `blog/`+`es/blog/` (hard prerequisite); (2) fix clock (fusion amplifies its failure — a stale arrow carved into a dated post); (3) per-card **present-pressure aside** in the instrument (12/12 slug match, `data-layer='inferred'`); (4) **posture × pipeline-direction cross-tab** headline figure; (5) two-clock state grid (posture verdict × direction, named corners); (6) lead-horizon / signal-age band (sort by how far through the cited lead, vs wall-clock — NOT a countdown); (7) graceful-absence + coincident guard (88 uncovered ingredients OMIT the line; coincident panels never get a "N-week lead" phrase).

**Citability (8):** fix clock first (a snapshot today ships a FALSE `freshness_weeks=0`); per-asOf **CC0 snapshot with per-row rights class** (fred-feed/imf-salmon/imf-shrimp are reprinted-with-permission, **not** CC0; open-meteo free tier is non-commercial); token→full source+license registry; Dataset JSON-LD + `/cost-index/pressure/` landing (variableMeasured = direction/confidence/score/agreement ONLY, never a price); bind lead-provenance cites; externalize a versioned calibration/validation log + editions spine; a lead-window-gated CC0 backtest ledger (replace the wrong-horizon next-print scoring); stable methodology version + CITATION.cff + Zenodo DOI (reconcile the split `_version` ids first).

**Cut (10):** blanket CC0 (→ per-row rights); open-meteo for commercial use (→ NASA POWER); over-fanning ENSO across the menu; auto-applying calibrated weights (canon forbids silent tuning); "no pressure detected" for the 88 uncovered (degrade by absence); countdown-to-price framing (prediction-by-metaphor); hand-setting new predictors to tier A; H-2A farm-labor (lab backlog); VegScape/Crop-CASMA NDVI (diffuse lead); fusing pressure prose into the dispatch **before** the gate extension is green.

---

## E. Sequenced next steps

**In-container (I can do here):**
1. **Freshness-clock fix** (`tools/_shared/cost-pressure.js`) — **DONE** (commit follows this doc). `assess()` now ages the OLDEST input (`refNow − min(asOf, anchorPrintDate)`) against an optional `opts.now`, defaulting to `asOf` when absent so the builder + honesty gate stay byte-for-byte deterministic; the live Lab (`pressure-lab-ui.js`) passes `Date.now()`. Verified: the frozen 2026-06-08 snapshot now reads 6 weeks stale at today's date and all 12 panels decay moderate/high → **low** (and would hit `under_review` past the 8-wk floor); honesty gate still 12/12 recompute-match; +1 regression test (10/10). *(Note: `check-pressure-freshness` already makes snapshot staleness loud at CI; this fix is the complementary per-panel governor in the rendered surface.)*
2. Scholarly citability §C-1 (**Dataset JSON-LD on the flagship**) + §C-5 (structured Cite-this) — highest-leverage, in-container, in-place HTML edits.
3. Pressure gate scoping (§D-fuse-1) — add `blog/` to `scanDir` **scoped to marked pressure blocks** (design a sentinel), so fusion can't ship an ungated price/"because".
4. A fresh-direction surface when ready (§C-fresh) — the **Cold-Hold Ledger** free tool or the **relaxation-curve / 2×2 risk-atlas** research pages (all verified in-engine).

**Mac / operator-only (hand off) — treat §C2 + §D-deepen as ONE fetch program:**
- Public-API fetches (all US public-domain): NASS weekly corn/soybean condition; APHIS HPAI flock-loss (keyless); NASA POWER GWETROOT + T2M; NASS beef replacement-heifer + cattle-on-feed-by-weight; US Census HS6 imports (keyless); NOAA OISST SST; USGS streamflow + river gauges; RCC-ACIS degree-days; USDA AMS retail report; USDA ERS meat price spreads; EIA PADD-1B diesel. Each lands as a tier-B/C pressure calibration candidate and/or an **Ingredient State Record** field (§C2-2, the CC-BY capstone). The operator offered to run these; I'll hand over exact endpoints + honest leads per source on request.
- Run `calibrate-pressure.mjs` → commit `data/pressure-calibration.json` (human applies edits, `_version` bump).
- **Full page rebuild** (`build-cost-index-pages.mjs`) — the container engine is behind; the Mac owns this.
- Zenodo/DataCite **DOI mint** for the CC-BY dataset + study, and (later) the pressure snapshot.
- First-party wholesale→delivered **invoice calibration** — the one measurement no citation substitutes (moves the instrument from "reference read" to "validated").

**Open decisions for the operator:**
- Version/asOf semantics for `menu-pricing.json` (static version + data-derived asOf vs a churny build clock).
- Whether to publish the Yield-Reference Disagreement (CIA vs USDA-FBG) as honest meta-science or leave it internal.
- Pressure fusion scope: instrument-only (safe) vs into the dated dispatch (needs gate scoping + clock fix green first).

---
*Sources: `tasks/w4vaozisi.output` (scholarly synth), `tasks/wctfqh8o4.output` (pressure synth), and the per-agent journals under `subagents/workflows/`. Both workflow scripts are re-runnable via `Workflow({scriptPath, resumeFromRunId})`.*
