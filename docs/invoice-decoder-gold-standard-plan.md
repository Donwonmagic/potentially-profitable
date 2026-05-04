# Invoice Decoder — Gold-Standard Push (Waves 10-13)

The first nine waves shipped the foundation: universal intake, profile-aware
preprocess, anomaly-collapse, auto-confirm, contract-watch, Privacy Self-Check,
24 vendor templates, device-tier heavy mode. This document plans the next push
— the work that moves the tool from "an excellent free invoice reader" to
"the spine of the operator's weekly empowerment loop."

Synthesized from four parallel domain plans (accuracy frontier, insights
frontier, delight frontier, ecosystem integration) plus the user's explicit
priority: **invoice rows must auto-refresh ingredient prices in Plate Cost,
portion-aware, with the cascade rippling through Margin Math, Cost Pulse, and
Menu Engineering.**

---

## Strategic frame

Three structural truths shape the priority order:

1. **Ecosystem integration is the spine.** Today the Invoice Decoder is a
   destination tool. It needs to become the heart that feeds every other
   tool. Until a saved invoice automatically updates Plate Cost recipes,
   recomputes Menu Engineering quadrants, and shifts Margin Math's
   break-even covers, the operator is still doing manual work the tool
   should be eating.

2. **Accuracy that compounds beats accuracy that's static.** The frontier
   accuracy techniques split cleanly. One-time bumps (per-region OCR, multi-PSM
   ensemble) cap out at +2-3pp and stop. Compounding techniques (per-operator
   confusion matrix, cross-invoice SKU vote, calibration) get *better every
   week the operator uses the tool* — by month three they're delivering lifts
   competitors literally cannot match because they don't have the operator's
   private corpus.

3. **The "share-worthy" delight features are the marketing.** Shareable
   insight cards, voice query mode, the email-the-tool Apple Shortcut — each
   one is a screenshot waiting to happen. The privacy promise is built-in
   credibility; the delight features are the distribution mechanism.

The plan below orders Wave 10 first (ecosystem spine, the user's explicit ask),
Wave 11 second (compounding accuracy), Wave 12 third (operator-gasp insights),
Wave 13 fourth (surprise-and-delight that spreads).

---

## Wave 10 — The Cross-Tool Spine (~13 engineer-days)

The single most valuable wave. Closes the loop the user explicitly asked for.

**Audit-driven correction**: an integration audit (see
`docs/invoice-decoder-gold-standard-audit.md`) surfaced three blockers that
gate Wave 10 from starting. They land first as **Wave 10.0 — Prep (~1.5 days)**:

| # | Item | Files | Days |
|---|------|-------|------|
| 10.0a | **Stem lift to shared scope.** `MID_LEARNINGS.extractStem` + `normalize` are invoice-decoder-private today. Lift into `tools/_shared/stem.js` so Plate Cost can normalize identically (without it, stem matching diverges silently when learnings.js's `DROP_TOKENS` regex evolves). Back-compat re-export from learnings.js | new `tools/_shared/stem.js`, `learnings.js`, `sku-history.js`, `substitution.js`, `margin-impact.js` | 0.5 |
| 10.0b | **Egress-check expansion.** `scripts/check-no-invoice-egress.mjs` only scans server-side files today. Add `tools/_shared/` + `tools/invoice-decoder/` targets and forbid `fetch / sendBeacon / new Image().src= / WebSocket / EventSource` patterns in those modules | `scripts/check-no-invoice-egress.mjs` | 0.5 |
| 10.0c | **Analytics registry pre-registration.** 18 new event names land across waves 10-13 (stale-accept, ghost-update, recipe-ripple, break-even-shift, bucket-move, voice-query, insight-card-shared, what-if, pdf-annotated, bookmarklet-receive, cell-history, theft-flag, reorder-copied, forecast-shown, vendor-switch-roi, run-rate, seasonality, supplier-health). Register all 18 in `tools/_shared/analytics.js` before any wiring; `check-analytics-vocabulary.mjs` blocks the build otherwise | `tools/_shared/analytics.js` | 0.25 |
| 10.0d | **Storage-budget audit.** `dishCostHistory` (60 dishes × 12 entries × ~80B = ~58KB) + projected aggregates approach ~200KB combined MuntinContext payload. Browsers cap localStorage at ~5MB but Workshop quota concerns surface earlier. Compute worst-case, document, gate caps | `tools/_shared/context-bus.js` (new constants) | 0.25 |

| # | Item | Files | Days |
|---|------|-------|------|
| 10.1 | New `tools/_shared/sku-match.js` — `classify(name, candidates)` returns `auto`/`propose`/`manual` tier with Levenshtein + token-set + substring matching. Reuses `_shared/stem.js` (lifted in 10.0a) | new file | 0.5 |
| 10.2 | New `tools/_shared/portion-bridge.js` — `quoteAtPortion({comparable, portion, yieldPercent})` converts an invoice's `{perBaseUnit, baseUnit}` into Plate Cost's `{apPrice, apQty, apUnit}` domain with cross-family safety. Mismatches set `compatible:false` rather than silent "guess the density" math. **Test budget: 6 unit families × 3 yield scenarios × 5 failure modes** (cross-family, yield≤0, yield>1, NaN propagation, density-required-but-missing) | new file | 1.0 |
| 10.3 | **Audit-corrected: don't create a parallel `invoiceLatestPrices` map.** `MID_SKU_HISTORY.skuHistory[stem][0]` already IS the latest observation per stem. Instead expose `MID_SKU_HISTORY.latestByStem()` as a thin sync projection returning `{stem → {perBaseUnit, baseUnit, vendor, ts}}`. Saves ~24KB of duplicated localStorage and one source of drift. Add `MuntinContext.dishCostHistory` (12-deep ring per dish) for the cascade only | `tools/invoice-decoder/sku-history.js`, `tools/_shared/context-bus.js` | 0.5 |
| 10.4 | Push wiring: at save, walk `MuntinContext.dishes`, classify each ingredient against the new prices via `latestByStem()`, queue `recipeStaleQueue` entries when comparable delta > 1%. Walk cost: 60 dishes × 8 ingredients = 480 stem lookups, sync, on save thread (acceptable, document) | `tools/invoice-decoder/invoice-decoder.js` (next to `recordObservations`) | 1.0 |
| 10.5 | Plate Cost stale-banner: on cold load, if `recipeStaleQueue` has entries, render "5 recipes have ingredient prices that changed in your last Sysco invoice. [Review changes]" with accept-all / accept-some / dismiss. Rejection writes `skuMatchLearnings` (renamed from `matchLearnings` to avoid conflation with the existing `invoiceLearnings` category-override store). **Render-order discipline**: stale-banner sync read first, existing pull-CTA async decrypt second | new `tools/plate-cost/stale-banner.js`, `tools/plate-cost/index.html` | 1.5 |
| 10.6 | Plate Cost pull (in-recipe ghost chips): per-row sync read of `MID_SKU_HISTORY.latestByStem()` (NOT a separate `readLatestPrices()`). For bound ingredients with > 1% delta, render "Sysco Apr 28: $4.20/lb (yours: $3.80) [Update]" as a dashed chip. Operator-edit since-last-invoice protected via `apPriceSource: 'manual'\|'invoice:<ts>'` field — auto-update only overwrites when source is older. **Pre-schema-change recipes**: `apPriceSource == undefined` treated as `manual` (defensive default) | `tools/plate-cost/index.html`, `tools/plate-cost/plate-cost.js` | 0.5 |
| 10.7 | Recipe schema gains `boundStem` + `apPriceSource` + `apPricePrev` (one-cycle undo). `validateRecipe` adds soft `unbound-ingredient` warning. **Underscored field convention** (`_boundStem`, etc) so the existing CSV exporter at `plate-cost.js:850-1002` doesn't surface them in operator-facing output | `tools/plate-cost/plate-cost.js` (`validateRecipe`, schema) | 0.75 |
| 10.8 | **Audit-corrected: greenfield wiring, not subscriber extension.** Menu Engineering (`tools/menu-engineering/menu-engineering.js`) does NOT consume MuntinContext today (zero hits in grep). New work: (a) `<script src="/tools/_shared/context-bus.js">` include in `index.html`, (b) cold-load read path of `dishes`, (c) `subscribe()` for cross-tab updates, (d) "first run" prefill, (e) ~80 lines of glue to feed `dishCostHistory` deltas into `menuEngineeringAnalyze`. Quadrant change → thin teal underline + "moved last invoice" tag. Bump from 1.0 → 1.5 days | `tools/menu-engineering/menu-engineering.js`, `index.html` | 1.5 |
| 10.9 | Cascade — Cost Pulse: new "Recipe ripple" strip beneath the trend strip. Top three dishes whose plate cost shifted most this week, sourced from `dishCostHistory`. **Plan-correction**: Cost Pulse is a single index.html with embedded JS today (no `cost-pulse.js`); ~40-line inline addition rather than a new external module | `tools/cost-pulse/index.html` (inline) | 0.75 |
| 10.10 | **Audit-corrected: greenfield wiring, not subscriber extension.** Margin Math (`tools/margin-math/margin-math.js`) does NOT consume MuntinContext today. Same stack as 10.8 (script include, cold-load read, subscribe). New aggregation step: sum `dishCostHistory[*]` deltas weighted by mix → updated `foodCostPct`. Surface "*Break-even shifted from 38 → 41 covers/night because beef rose 12% on last week's Sysco invoice.*" Bump from 0.75 → 1.25 days | `tools/margin-math/margin-math.js`, `index.html` | 1.25 |
| 10.11 | Per-portion contract surveillance: new `tools/_shared/dish-drift.js`. Walks `contractPrices × latestByStem × dishes`; emits per-dish drift signals. Surfaces in `idHandoff` panel and a new "drift" tab in Cost Pulse | new file, `tools/cost-pulse/`, `tools/invoice-decoder/index.html` | 1.0 |
| 10.12 | Yield-percent tracking: Plate Cost gains `actualYieldPercent` per row. New `MuntinContext.yieldLearnings`. `lookupYield` consults it before the canonical `YIELD_TABLE`. Tiny "weighed it? log yield" link beside each row | `tools/plate-cost/plate-cost.js`, `index.html` | 1.0 |
| 10.13 | Vendor-swap simulator: per-row "compare vendors" affordance powered by `MID_SKU_HISTORY.compareAcrossVendors`. **Audit-corrected**: that function is invoice-decoder-private today. Two clean paths: (a) lift to `tools/_shared/cross-vendor.js` (preferred), or (b) load-couple plate-cost to `<script src="/tools/invoice-decoder/sku-history.js">`. Pick (a) | new `tools/_shared/cross-vendor.js`, `tools/plate-cost/vendor-swap.js` | 1.0 |
| 10.14 | Health tab: "29 of 47 ingredients are auto-priced from invoices; 18 still manual." Sparkline of binding rate over last 12 invoices + one-tap "match the rest" tour walking unbound rows by priority (`lineTotal × frequency`) | `tools/plate-cost/`, new health tab | 0.5 |
| 10.15 | **Audit-added: extend `scripts/test-plate-cost.mjs` with MuntinContext stubs.** Plate Cost's tests today cover pure math (zero `MuntinContext`/`invoice` hits in grep). Wave 10.5/10.6/10.7 introduce new integration points that must get `global.window.MuntinContext` fixture cases — 6 new test blocks | `scripts/test-plate-cost.mjs` | 0.5 |

**Privacy preserved**: `invoiceLatestPrices` + `dishCostHistory` are aggregates
(stems + numbers, not row text) — same posture as the existing `invoiceTrend`.
Anything containing row name or vendor description continues through the
AES-GCM-wrapped envelope. New data-promise card line: *"Cross-tool price sync
uses stem keys (e.g. 'ground beef') — never raw vendor descriptions or full
SKU codes."*

**User-visible after Wave 10**: Drop a Sysco invoice. Save. Switch to Plate
Cost. Every recipe that uses items from that invoice has updated costs with
ghost-chip annotations. Switch to Menu Engineering — quadrant repositions
visible. Switch to Margin Math — break-even covers shift, with the dollar
narrative.

---

## Wave 11 — Compounding Accuracy (~14 engineer-days)

Six techniques. Calibration first because it sharpens every downstream layer's
signal. Confusion matrix + cross-invoice vote next because they compound — by
month three the operator's tool is meaningfully smarter than competitors'.

| # | Item | Files | Days |
|---|------|-------|------|
| 11.1 | New `tools/invoice-decoder/calibration.js` — isotonic-regression calibration of Tesseract's confidence to actual correctness, learned from operator overrides. ~80-line module. Multiplies the signal quality of every other layer (anomaly thresholds, adaptive-reread triggers, auto-confirm gates). Cap 500 samples, piecewise-linear lookup | new file, `ocr.js` post-merge call | 2.0 |
| 11.2 | New `tools/invoice-decoder/confusion-matrix.js` — per-operator OCR error map. Every override pair (`rawName, correctedName`) gets Needleman-Wunsch aligned to extract char-level errors. `topConfusions(char, k)` powers a beam-search line-repair candidate list. Cap 64×64. Compounds: at 50 invoices the operator's matrix is ~2× more useful than the global prior | new file, `learnings.js` extension | 2.5 |
| 11.3 | Beam-search line repair in `parse.js`. When the regex falls through, run a small beam (width 8, depth 2 substitutions) over the confusion matrix, scoring `(parses_cleanly ? 1 : 0) + math_consistent + vendor_lexicon_hit`. Already-clean lines bypass the beam — zero cost on PDFs | `parse.js` `parseLine` extension | 2.0 |
| 11.4 | Cross-page + cross-invoice SKU vote: new `tools/invoice-decoder/reconcile.js`. Group rows by stem; vote canonical name using majority + per-character Tesseract confidence. Extend across last 8 invoices from same vendor (already in `MID_SKU_HISTORY`). A SKU seen 7 times correctly + once garbled auto-corrects with confidence ≥ 95. Same trick for vendor identification | new file, `invoice-decoder.js` between parseLines and detectVendor | 3.5 |
| 11.5 | Numeric coherence reconciliation. `suggestMathFix` extension: tax/freight/fee back-fit using vendor templates' `taxPatterns/discountPatterns`; pack-size sanity (case×unit-size = total weight); per-vendor unit-price priors via new `MID_SKU_HISTORY.priceCorridor(stem, vendor) → {p10, median, p90}`; small static category-price-priors table (~150 entries) for stems with no history | `parse.js`, `sku-history.js`, new `category-price-priors.js` | 3.5 |
| 11.6 | Wire the unwired `reconstructColumns` + `recognizeRegion` utilities — but only after the bbox-rich golden corpus exists. **Synthesize from vendor templates**: render 3-5 deterministic invoices per vendor with known column geometry. New build script `scripts/synth-vendor-fixtures.mjs` emits canvas + ground-truth JSON. Validate the column path per-vendor; opt in via vendor template flag (`columnsEnabled: true`); start with Sysco | new script, `vendors/*.json` flag, `parse.js` opt-in | 5.0 |

**Stacked accuracy lift (conservative estimate)**: +10-14pp on rough phone
photos, +3-5pp on PDFs, with the curve continuing linearly per-operator over
the first ~30 invoices. The compounding nature is the moat.

---

## Wave 12 — Owner-Grade Insights (~16 engineer-days)

Eight insights. Ranked by gasp factor — would the operator screenshot it?

| # | Item | Files | Days |
|---|------|-------|------|
| 12.1 | Theft / shrinkage anomaly: liquor + protein category z-score against operator's own median order frequency over rolling 28 days. Flag when |z| ≥ 1.8 AND $ exposure ≥ $200. Frame neutrally ("4 orders this month vs your usual 2.1") — no accusation | new `tools/invoice-decoder/shrinkage-watch.js`, vendor-pulse render | 2.5 |
| 12.2 | Predictive reorder shortlist + one-tap order pad: `cadenceDays = median(diff(ts))` over last 8 weeks; `dueProb = (daysSinceLast - cadenceDays) / std(diff(ts))`. List rows where `dueProb ≥ 0.5`. Sort by urgency × $ weight. Click → clipboard receives `qty × name` lines grouped by vendor | new `tools/invoice-decoder/reorder-forecast.js` | 3.0 |
| 12.3 | Forecast-vs-actual invoice total: per vendor, μ ± σ band from `invoiceTrend`. "Sysco's typical Tuesday: $1,480-$1,650 — this one was $1,798 (+9%). Driven by produce: $612 vs typical $410." Zero new schema | extend `tools/_shared/cost-trend.js` | 1.5 |
| 12.4 | Aggregate vendor-switching ROI: extends per-row cross-vendor chip to category-level. "Switching paper from Sysco → Restaurant Depot saves ~$184/mo across 12 SKUs (47% of paper spend)." Surface only when aggregate gap > $50/mo projected | new `tools/invoice-decoder/vendor-switch-roi.js` | 2.0 |
| 12.5 | Menu-engineering bridge: walk `MuntinContext.dishes`, look up per-stem `medianDelta`, recompute dish food-cost. Surface top 3 dishes affected. "*This invoice nudges your top 3 contribution-margin dishes' weighted food cost +1.3 pp. Caesar moving Star → Puzzle.*" Bridges with Wave 10's cascade | new `tools/invoice-decoder/menu-bridge.js` | 3.5 |
| 12.6 | Daily food-cost run-rate vs Plate Cost: 7-day rolling sum of `parsedSum` ÷ operator-entered weekly revenue → invoiced food-cost %. Compare to weighted dish food-cost from `dishes`. Delta = leak signal. "Menu says 28%, this week's invoices say 31% — ~$420/week leak" | `tools/cost-pulse/run-rate.js`, small chip in invoice-decoder | 2.0 |
| 12.7 | Seasonal pattern detection: `MID_SKU_HISTORY` extension to keep monthly aggregate archive (24 months, ~2KB worst case). Compare current to same-month-last-year. Defuses anomalies that are seasonal-on-cycle; sharpens those that are seasonal AND elevated | extend `sku-history.js`, new `seasonality.js` | 3.0 |
| 12.8 | Supplier health score (0-100): backorder rate (25 pts) + price stability (25 pts) + substitution rate (20 pts) + contract-violation rate (20 pts) + surcharge frequency (10 pts). All from existing parse-classified row kinds | new `tools/invoice-decoder/supplier-health.js`, vendor pulse | 3.0 |

---

## Wave 13 — Surprise-and-Delight (~12 engineer-days)

Eight features ranked by screenshot-and-share probability.

| # | Item | Files | Days |
|---|------|-------|------|
| 13.1 | Shareable insight cards: when contract-watch posts an overage, OffscreenCanvas composes a 1080×1350 PNG ("Sysco overcharged me $37.80 — caught by Muntin Invoice Decoder"). SKU names redacted by default. One tap to download or `navigator.share`. Watermarks every operator's screenshot | new `tools/invoice-decoder/insight-card.js`, `contract-watch.js` hook | 2.0 |
| 13.2 | Voice query mode: `webkitSpeechRecognition` + 12 intent grammar (vendor-spend, category-spend, top-overcharges, sku-trend, vendor-compare, pack-equivalence, last-invoice, contract-status, anomaly-list, total-spend, repeat-last). `SpeechSynthesisUtterance` reads the answer; visual card persists. Mic chip on desktop split-pane + long-press FAB on mobile | new `tools/invoice-decoder/voice-query.js` | 3.0 |
| 13.3 | Annotated PDF export: pdf-lib (~470KB self-hosted, dynamic-import gated). Overlays anomaly badges + contract overcharge stamps + corrections on the original PDF. Operator hands it to bookkeeper or stuffs in compliance folder | new `pdf-annotate.js`, self-hosted `vendor/pdf-lib.min.js` | 2.0 |
| 13.4 | Email-the-tool via Apple Shortcuts / Tasker: shipped as one-tap install links. Recipe: trigger on email-with-PDF → save attachment → open `?intake=share` via existing Web Share Target. The deeplink already exists; we ship the recipe artifacts | `tools/invoice-decoder/recipes/{apple-shortcut.shortcut, tasker-profile.prj.xml}`, settings install affordance | 1.5 |
| 13.5 | Bookmarklet for distributor portals: 3 site adapters (Sysco shop, US Foods, GFS), normalize to `csv-extract.js` shape, write to `sessionStorage`. Tool reads on next load. ≤ 4KB per RFC2397. No CORS, no fetch | new `tools/invoice-decoder/portal-scrapers/{sysco,us-foods,gfs}.js`, build script | 2.5 |
| 13.6 | What-if pricing simulator: drag a category chip onto a vendor chip; surface monthly delta winners/losers per SKU. Cross-vendor data already captured by `pack-pricing.js + sku-history.js` | new `tools/invoice-decoder/whatif.js` | 2.0 |
| 13.7 | Receipt-trail print mode: `@media print` stylesheet + one button. Operator hands clean annotated copy to bookkeeper | `tools/invoice-decoder/index.html` print block | 0.5 |
| 13.8 | OCR replay / per-cell undo: 5-deep ring buffer per row. Hover shows clock icon; click opens "What you typed → what was OCR'd → what we suggested" — each restorable | new `cell-history.js`, edit-handler hooks | 1.0 |

---

## Sequencing summary (audit-revised)

| Wave | Theme | Eng-days | User-visible win |
|------|-------|----------|------------------|
| 10 | Cross-tool spine (incl. 10.0 prep + greenfield Menu Eng / Margin Math wiring) | ~13 | Save invoice → Plate Cost auto-updates → Menu Engineering re-classifies → Margin Math shifts break-even |
| 11 | Compounding accuracy (11.6 sidecar-spec gated) | ~14 | Tool gets meaningfully more accurate every week the operator uses it |
| 12 | Owner-grade insights (share `dish-recompute.js` with 10.8) | ~16 | "Wait, your invoice tool catches THEFT?" |
| 13 | Surprise-and-delight + Privacy Self-Check v2 | ~13 | Shareable cards turn every operator into a referral |

Total: **~56 engineer-days** across **~11 calendar weeks for one engineer**
(audit-revised from initial 53.5, with three blockers addressed in 10.0 prep).
Two engineers in parallel (one on accuracy/parsing, one on cross-tool +
insights + delight) compresses to ~5.5 calendar weeks.

The biggest compound moat is in Wave 11 (per-operator confusion matrix +
cross-invoice vote + calibration). Cloud OCR competitors structurally cannot
match this because they don't have the operator's private corpus.

---

## Cross-cutting deliverables

- **Egress-check expansion** (`scripts/check-no-invoice-egress.mjs`): new
  forbidden patterns covering `voice-query.js`, `insight-card.js`,
  `watch-counter.js`, `pdf-annotate.js`, `portal-scrapers/*.js`,
  `merge-ledger.js`. Block `sendBeacon` and `new Image().src=` exfil tricks
  in any file under `tools/invoice-decoder/`.
- **MuntinContext schema additions** (`tools/_shared/context-bus.js`):
  `invoiceLatestPrices`, `dishCostHistory`, `recipeStaleQueue`,
  `matchLearnings`, `yieldLearnings`. All plaintext aggregates by design;
  the row-text envelope continues to be AES-GCM-wrapped.
- **Test fixtures**: synthetic vendor renderer (Wave 11.6) is the largest new
  fixture artifact. Per-portion bridge needs unit tests covering 6 unit
  families × 3 yield scenarios.
- **Analytics registry**: every new event added to
  `tools/_shared/analytics.js` EVENTS at first use.

---

## Brand commitments preserved

The four claims that make this tool credible all hold across waves 10-13:

1. **Image bytes never leave the device.** No new feature in this plan touches
   the network for invoice content. The bookmarklet runs on the operator's
   already-authenticated portal session; insight cards compose via
   OffscreenCanvas; voice query routes through the platform's speech service
   (audio only, never invoice data) — disclosed in the Privacy Self-Check.
2. **No data pooling, no ML training on cost data.** Confusion matrix and
   calibration learn per-operator only. Stem-keyed cross-tool sync is the
   operator's own data flowing across the operator's own tools.
3. **Verifiable by anyone with DevTools.** Self-Check (Wave 8.7) gains entries
   for every new module. The egress-check invariant blocks regressions at
   build time.
4. **Free. No subscription. No upsell.** Nothing in waves 10-13 introduces a
   paywall.

That's the moat. Everything else is craft.
