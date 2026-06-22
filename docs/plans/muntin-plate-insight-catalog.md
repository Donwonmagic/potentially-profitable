# Muntin Plate — The Emergent Insight Catalog (the unity-of-data frontier)

*6-specialist synthesis (restaurant-finance / menu-engineering · data-product insight design · determinism & honesty · privacy & antitrust · empowerment / behavioral design · measurement). 2026-06-21. Extends — never re-architects — `muntin-plate.md` (the costing MVP + the weekly hike loop) and `muntin-insight-layer.md` (the Cost-Index ladder). Grounded in a code read of `tools/_shared/*`, `tools/plate-cost/*`, `data/cost-index*`, and the Ledger data model.*

## Context — why this, and what it is NOT

The costing MVP and the hike loop are settled. This document mines the layer above them: the catalog of **emergent insights** — true, actionable things that exist **only because Muntin holds several datasets in one graph**, and that a single-dataset competitor (a spreadsheet, a recipe-costing app, a POS) structurally cannot produce. The moat is the **unity of datasets** no rival holds together: the operator's **invoices** (what they really pay) × **recipes/Plate** (what they sell) × the **Cost Index** (what the market is doing) × **inventory** (what they actually used) × **operator-learned yields** × a **dormant anonymized cohort**.

The vendor-vs-market discrimination is the **seed** — the whole is greater than the sum because binding two-plus datasets says something neither could say alone. This catalog finds the full set at that caliber, reconciles each to **real plumbing** and the MVP/V2/V3 phasing, and labels each insight's **confidence/honesty handling** and **privacy class**.

**This is not** a re-plan of the MVP, not an inventory/PO system (costing ≠ inventory — that's MarginEdge's swamp), not a price predictor, and not an LLM product. The honesty and determinism guarantees below are **the reason an operator trusts an insight enough to act on it** — the precondition for the whole layer, and a sold feature, not a constraint.

### Grounding (code-confirmed, not assumed)

- **Vendor identity is captured per observation** — `line_item_observations.line_item_key_id → line_item_keys.vendor_id` + `canonical_id`. Cross-vendor comparison for the same product is one join.
- **Pack-size is already normalized** — `line_item_observations.cents_per_base` / `base_uom` / `base_qty` (migration 0035). The silent pack-shrink hike is computable today.
- **The vendor-vs-vendor engine already exists** — `tools/_shared/cross-vendor.js`: `compare()` (per-vendor medians, `gapPctVsCheapest`, a ≥3-sample-per-vendor bar, `null` below 2 vendors) + `projectMonthlySaving({name, currentVendor, targetVendor, portionQty, portionUnit, coversPerWeek}) → {savingPerPortion, savingPerWeek, savingPerMonth}`. (A `cross-vendor.js` comment notes the Ledger has a private `compareAcrossVendors` on the same data.)
- **The index is broadly live — 102 verified ingredients** (chicken-breast, ribeye, romaine-lettuce, tomato, onion, butter…), weekly points, ≤26 weeks history. `tools/_shared/composite-price.js assess() → {level, trend:{pct, dir, agreement}, confidence}` with hard basis-honesty rails: a `basis:'index'` reading never contributes a `$` level; level priority is delivered → wholesale → retail; NOAA import values are demoted to index-only.
- **Spike-vs-structural is honest today; a seasonal read is honest only where the history earns it.** `tools/_shared/cost-spike.js classify()` (≥8 wk history) → `structural | spike | emerging | easing | flat | insufficient` with `actionBias` re-price/hold/watch; `tools/_shared/cost-verdict.js verdict()` downgrades a `structural` call to **watch** on thin data. Seasonality runs off `data/seasonality.json`, built by `build-seasonality.mjs` from a real multi-year backfill (`data/cost-index-history.json`, the same wholesale series on the same scale): a calendar month is `established` only with ≥2 distinct years of observations, and an ingredient reads `ready` only at ≥6 established months — **41 of 101 are `ready` today** (e.g. `apple`: 158 weeks across 4 years), 60 are transparently `building`. So a seasonal read ("high for this month") is honest **only for a `ready` ingredient, inside its established p25/p75 band**; for the 60 not-yet-ready ingredients, "hold, it'll revert" must use spike-classifier retrace language ("already pulled back from its peak"), never a seasonal claim ("tomatoes always spike in February").
- **`tools/_shared/plate-advice.js advise()`** is the canonical EN/ES recommendation engine — the re-price/re-portion/absorb fork, charm-rounding to the menu's own convention (`detectConvention`), the seasonal→absorb branch, and a `confidence` echo. It is parity-locked to the Ledger TS port (11 vectors in `plate-advice.test.mjs`).
- **Inventory tables EXIST in the Ledger repo** (migrations 0046–0050: counts, period snapshots, pars with `lead_time_days`, and an `inventory_coverage` table for count-completeness). **Days-of-cover** is not a stored column — it's computed at read time (`apps/api/src/lib/inventory-reorder.ts`) from pars + the `cadence-compute.ts` daily buy-rate. "Inventory" is therefore a **real** dataset — used here only as **read-only joins**, never as a system Plate operates.
- **The dormant cohort is scaffolded** — `org_settings.bench_contribution_opt_in` (default `FALSE`), `region_bucket`, and a k-anonymity fixture (k≥10 orgs, d≥5 vendors, ≤40% single-org dominance, no identifier columns escape). Counsel-gated; consent is captured now, shipped later.

### Canonical worked scenario (the real test vector, used throughout)

**Caesar** — plate **$5.40**, menu **$16.00** (33.75% food cost), **150 covers/week**, owner target **30%**. Romaine moves **$28 → $32/case (+14%)** → **+$0.31/plate → $5.71** (35.7%). `dish-drift.compute` already tags the driver `vendor:'sysco'`; `plate-advice.advise` already returns *"Romaine went up 14% — it's costing you $47/week on Caesar."* The Cost Index for `romaine-lettuce` moved **+6%** over the same window. These figures are an illustrative worked example carried from `muntin-plate.md`, not a sourced market claim.

---

## 1. The decisions (read these first)

### 1a. Ranked shortlist

Scored 1–5 on **V**alue (to the operator) × **M**oat (uniqueness of the join) × **F**easibility on data that already exists. Split into *computable today on existing plumbing* vs *needs new data or a new gate*.

**Bucket A — computable today on existing plumbing**

| # | Insight | Unified inputs | V | M | F | Phase |
|---|---------|----------------|:-:|:-:|:-:|-------|
| **E2** | **Vendor-vs-Vendor — "you already buy it cheaper"** | invoices × invoices (vendor split on a canonical) [× recipes to dish-ize] | 5 | 4 | 5 | **MVP-ext · ship first** |
| **E1** | **Vendor-vs-Market on the dish — "it's the vendor, not the market"** | invoices × index × recipes | 5 | 5 | 4 | **MVP-ext · flagship headline** |
| E3 | Pack-shrink silent hike — "same case price, 50% more per gallon" | invoices (`cents_per_base`) × index | 4 | 4 | 5 | MVP-ext |
| E4 | Silent-bleed leaderboard — $/week, not % | invoices × recipes × covers | 5 | 3 | 4 | MVP-ext (weekly-digest spine) |
| E5 | Cross-dish blast radius — one hike, seven dishes | invoices × recipes (canonical fan-out) | 4 | 4 | 4 | MVP-ext |
| E6 | Menu margin map — "which dishes crossed your line" | invoices × recipes × owner target | 4 | 3 | 4 | MVP-ext |
| E12 | Market-implied dish drift (free teaser, labeled theoretical) | index × recipe-template (pre-invoice) | 3 | 3 | 4 | MVP-ext (storefront/funnel) |

**Bucket B — needs new data or a new gate**

| # | Insight | Unified inputs | V | M | F | Phase |
|---|---------|----------------|:-:|:-:|:-:|-------|
| E9 | "Your kitchen beats the book" — learned-yield truth | yields × recipes × invoices | 3 | 4 | 3 | V2 (learned yields persisted) |
| E7 | Buy-now-or-ride-it-out | invoices × inventory × index | 4 | 4 | 2 | V2 (read-only inventory join) |
| E8 | Theoretical-vs-actual variance (the V3 hero) | recipes × inventory × invoices × POS covers | 5 | 5 | 1 | V3 (needs POS covers) |
| E10 | Peer percentile (delivered level) | invoices × dormant cohort | 4 | 5 | 1 | V3 — **counsel-gated** |
| E11 | Vendor-leverage ratio — "operators like you pay ~8% less" | invoices × dormant cohort | 3 | 5 | 1 | V3 — **counsel-gated** |

**Secondary / ambient (documented, ranked low):** E13 pressure early-warning (direction-only, opt-in, *no push* — fails the "one move" test, so calm-ambient only); E14 menu-resilience stress-test (labeled what-if, V2); E15 per-dish cost-history sparkline × index (V2).

### 1b. Flagship pick: **E1 + E2**, built as a pair

They share one new primitive — a cross-vendor, pack-normalized price series on a `canonical_id` — so building either delivers most of the other. **Ship E2 first** (no recipe or index dependency; the engine already exists), as the "found money" proof that costs nothing to compute. **E1 is the headline** once recipes are bound: it is the seed example realized at *dish* resolution, and it changes the operator's *first move* — claw back from the vendor before re-pricing the menu.

**Before / after on the real scenario:**

> **Before (today's hero loop):** *"Romaine went up 14% — it's costing you $47/week on Caesar. [Re-price to $19] [Re-portion] [Hold]"* → the owner raises the menu price, passes the vendor's excess straight to customers, and leaves money on the table with the vendor.
>
> **After (E1):** *"Romaine's up 14% on your invoice — but the market only moved 6%. About 8 of those points are your vendor, not the market — roughly **$27 of the $47/week**. Before you touch your $16 Caesar, here's the ask for Sysco: 'You're at $32/case; the market moved 6%, you moved 14% — can you do better?' If they won't move, then re-price. [Draft the ask] [Re-price to $19] [Hold]"*

Same data; a strictly better first move. The ~$27/week vendor share earns a phone call; the menu re-price becomes the fallback, not the reflex. The market-explained share (~$20/week) and the vendor share (~$27/week) are labeled a *rough split, your call* — never printed as false precision.

**Exact new plumbing vs. what already exists**

*Reuse (no new build).* MVP plumbing — the recipe tables, `recipe_cost_snapshots`, and the `recostForHike` hook — is built by the Plate MVP per `muntin-plate.md` (§1/§4); E1/E2 add only the four net-new pieces below and otherwise stand on already-shipped engines: `cross-vendor.compare` + `projectMonthlySaving`; `dish-drift.compute` (drivers already carry `vendor`); `portion-bridge.quoteAtPortion` (fail-closed on cross-family units); `plate-advice.advise` (fork + charm-rounding + EN/ES); `composite-price.assess` (trend/confidence/agreement over the 102 live ingredients); `cost-spike.classify` + `cost-verdict.verdict` (spike-vs-structural + thin-data downgrade); and on the Ledger side `line_item_observations` (`cents_per_base`, `vendor_id`, `observed_at`, `currency`, `provisional`), `product_canonical`, and the `price_hike` verdict + the `publishSyncEvent` stream.

*Net-new (small):*
1. **`vendorPriceSeries(orgId, canonicalId)`** — `DISTINCT ON (vendor_id, period)` median `cents_per_base` over the last N calendar periods, `WHERE NOT provisional AND currency` matches `AND` same `base_uom`. Feeds E2 directly and E1's "own delivered %."
2. **The discrimination function — ✅ now built** as `tools/_shared/spread-decompose.js` (`MuntinSpreadDecompose.decompose`; pure/deterministic, 14 passing vectors in `spread-decompose.test.mjs`, parity-locked for the Ledger port). Takes `{ownDeltaPct, marketDeltaPct, marketConfidence, marketAgreement, vendorPeriods, confounders}` → `{attribution:'vendor'|'market'|'mixed'|'inconclusive', spreadPct, marketPoints, vendorPoints, vendorShare, gated, reason, confidence}`. It screens the four confounders (pack flip via `cents_per_base`/`base_uom`; grade/spec via `canonical_id`; promo via period-median + robust-Z; window via the same calendar window) and the data-sufficiency gate (a spread is emitted only when market `confidence ≥ medium` AND `agreement ≥ 0.66` AND ≥3 same-unit vendor periods; otherwise `gated:true` and the caller shows each side alone). It takes only %s, so it is structurally incapable of spread-of-levels. Attribution confidence never exceeds the market read's (the honesty ceiling).
3. **The vendor-ask copy layer — ✅ now built** as `tools/_shared/vendor-ask.js` (`MuntinVendorAsk.build`; pure EN/ES, 7 passing vectors). Turns a decomposition into the owner card: leads with the recoverable `$/week` and a show-your-work vendor script when the move is the vendor's; on a `market` attribution it says so and emits **no** ask (a false alarm lowers IAR); a `gated` decomposition returns `show:false` (caller shows each side alone); it never invents a dollar figure (no dish `$/week` → no money clause). E2's cheaper-vendor numbers reuse `cross-vendor.projectMonthlySaving`.
4. **One branch in `recostForHike`** — when `attribution === 'vendor'`, lead the card with the ask and route the fork. New events: `vendor_ask_opened`, `vendor_switch_logged`, `reprice_after_vendor_declined`, `dismiss_as_expected`.

**Build status (this branch):** **all of Bucket A — every computable-today insight — is built and green here** (**56 vectors**, `node --test`): E1 `spread-decompose.js` (14) + `vendor-ask.js` (7), E2 `vendor-switch.js` (7), E3 `pack-shrink.js` (8), E4 `silent-bleed.js` (6), E5 `blast-radius.js` (4), E6 `margin-map.js` (5), and E12 `market-implied.js` (5); all pure / deterministic / no-LLM, EN + ES, parity-locked for the Ledger port. **The Ledger server paths for the whole of Bucket A are now built too** (branch `claude/gifted-ritchie-6losgu` in `Muntin-Invoice-Decoder`): **E1** is wired end-to-end — the `spread-decompose`/`vendor-ask` ports + `vendorPriceSeries` + the `recostForHike` decomposition branch + `resolveCostIndexTrend` feeding it from the vendored Cost-Index snapshot + the `queue.ts` ingest call site; **E2** has both read paths — `cross-vendor.ts` + `vendor-switch.ts` + the per-recipe (`/v1/recipes/:id/vendor-switch`) and org-wide-digest (`/v1/recipes/vendor-switches`) routes, **plus an invoice-only surface** (`/v1/insights/vendor-switches`, no recipes required, with a gentle add-recipes nudge); **E3** pack-shrink is an invoice-only surface too (`/v1/insights/pack-shrinks`); **E4** silent-bleed is `silent-bleed.ts` + `recentHikeImpacts` + `digestSilentBleed` + `GET /v1/recipes/silent-bleed`; **E5** blast-radius is `blast-radius.ts` + `digestBlastRadius` + `GET /v1/recipes/blast-radius`; **E6** margin-map is `margin-map.ts` + `marginMapForOrg` + `GET /v1/recipes/margin-map`. The modularity layer is in too — `GET /v1/insights/capabilities` (what each connected tool unlocks), the market-estimate fallback in `plate-cost` (a recipe costs even before every line has an invoice), and the recipe-hub preview (`GET /v1/recipes/hub`) shown until the first recipe exists. Verified on real data (E1: 10/24 ingredients clear the honesty gate) and by node parity-checks against the storefront engines. **Beyond Bucket A, three further insights are now wired:** **E7** buy-now-or-ride-it-out (`buy-or-ride.ts` + `trendToVerdict` + `verdicts-store.recentPriceHikes` + `GET /v1/insights/buy-or-ride`, reusing the inventory `reorder` coverage assembly — the Invoices+Inventory tier); **E15** per-dish cost-history (`cost-history.ts` + `recipes-store.costHistory` + `GET /v1/recipes/:id/cost-history`); and **E14** menu-resilience stress-test (`stress-test.ts` + `stress-test-suggest.stressTestForOrg` + `GET /v1/recipes/stress-test`, a labeled what-if). Of the rest: **E8** (theoretical-vs-actual) needs POS sales-mix (V3); **E9** (learned-yield) needs persisted learned yields (V2); **E13** (pressure early-warning) needs a vendored drought/freeze pressure feed; **E10/E11** (cohort) stay counsel-gated. So every insight computable on data that exists today now has a Ledger server path.

---

## 2. The insight catalog

Each entry carries: **inputs · owner one-liner (EN/ES) · trigger & cadence · the single recommended action · confidence & honesty · privacy class · phase.** Every owner-facing line is copy-paste-ready, grade-6 / CEFR-B1, loss-framed, blames the price not the owner, and anchors on the owner's own target margin.

### E1 — Vendor-vs-Market on the dish · *flagship headline*
- **Inputs:** invoices × index × recipes (the full triad — the seed).
- **EN:** "Romaine's up 14% on your invoice — but the market only moved 6%. About 8 of those points are your vendor, not the market — roughly **$27/week** on Caesar. Before you touch your menu, here's the ask for Sysco. **[Draft the ask]**"
- **ES:** "La lechuga subió 14% en tu factura — pero el mercado solo subió 6%. Unos 8 de esos puntos son tu proveedor, no el mercado — como **$27 por semana** en el Caesar. Antes de tocar tu menú, aquí tienes lo que le puedes pedir a Sysco. **[Prepara el mensaje]**"
- **Trigger/cadence:** event-driven, on a `price_hike` verdict for a `canonical_id` bound to ≥1 recipe.
- **Action:** Draft the vendor ask (one tap → a show-your-work line to read to the rep). Fallback: re-price if the vendor won't move.
- **Confidence/honesty:** fire only when both %s pass the four-confounder screen AND index `confidence ≥ medium` / `agreement ≥ 0.66` / ≥3 same-unit periods; else show each side alone, no spread. The vendor/market split is labeled "rough split, your call."
- **Privacy:** per-org (own data + public index). No gate.
- **Phase:** MVP-extension.

### E2 — Vendor-vs-Vendor — "you already buy it cheaper" · *ship first*
- **Inputs:** invoices × invoices (vendor split on a canonical) [× recipes to dish-ize].
- **EN:** "You buy mozzarella from two vendors. **Sysco's been running about 9% more** than US Foods for 6 weeks — same 5-lb pack. Switching just this one item saves about **$18/week** across your pizza and your caprese. **[Make US Foods the default]**"
- **ES:** "Compras mozzarella de dos proveedores. **Sysco ha estado como 9% más caro** que US Foods por 6 semanas — el mismo paquete de 5 lb. Cambiar solo este producto ahorra como **$18 por semana** en tu pizza y tu caprese. **[Pon US Foods de preferido]**"
- **Trigger/cadence:** weekly digest (a *persistent* gap, never a one-off blip).
- **Action:** re-bind the recipe line's price to the cheaper vendor (or just flag it).
- **Confidence/honesty:** `compare()`'s ≥3-sample-per-vendor bar; compared on `cents_per_base` (same pack and grade); period-median to discard promos; framed "based on your last 6 weeks of invoices."
- **Privacy:** per-org (entirely the operator's own data). No gate. **Engine already exists** (`cross-vendor.js`); the **card is built** (`tools/_shared/vendor-switch.js`, 7 vectors). The "9% more" wording uses `gapPctVsCheapest` exactly (how much more the current vendor runs) — never the inverse "9% cheaper," which would overstate.
- **Phase:** MVP-extension. Computable today. **✅ Ledger server path built** — `cross-vendor.ts` + `vendor-switch.ts` (parity ports) + `recipeLinesWithCovers` + `GET /v1/recipes/:id/vendor-switch` (per recipe) & `GET /v1/recipes/vendor-switches` (org-wide digest), `?lang=es`.

### E3 — Pack-shrink silent hike
- **Inputs:** invoices (`cents_per_base` across a pack change) × index (to attribute the cause).
- **EN:** "Your olive oil case looks like the same price — but the pack went from 6×1 gal to **4×1 gal**. You're paying **50% more per gallon**, and the market for oil hasn't moved. That's a pack change, not a price you have to eat. **[Flag for re-quote]**"
- **ES:** "Tu caja de aceite de oliva parece el mismo precio — pero el paquete pasó de 6×1 gal a **4×1 gal**. Estás pagando **50% más por galón**, y el mercado del aceite no se ha movido. Es un cambio de paquete, no un precio que tengas que aceptar. **[Márcalo para re-cotizar]**"
- **Trigger/cadence:** event-driven, when `pack_count`/`pack_weight` changes for a canonical but `cents_per_base` jumps.
- **Action:** flag for re-quote (carries the per-gallon receipt to the vendor).
- **Confidence/honesty:** `cents_per_base` is exact; the "market hasn't moved" clause needs index `confidence ≥ medium` for that ingredient, else state the pack math alone; and it only fires when the **sticker stayed quiet** (a sticker that also moved is an ordinary hike, not a pack trick).
- **Privacy:** per-org. No gate.
- **Phase:** MVP-extension. Pack math computable today. **✅ detector built** (`tools/_shared/pack-shrink.js`, 8 vectors).

### E4 — Silent-bleed leaderboard ($/week, not %)
- **Inputs:** invoices × recipes × `covers_per_week`.
- **EN:** "This week's price moves hit 4 dishes. Ranked by what they cost you per week: **Caesar −$47, Wings −$22, Cobb −$14, Side salad −$3.** Start at the top — fixing Caesar alone recovers more than half of it." *(47/86 ≈ 55% — the engine computes the share and picks an honest band, never a false fraction.)*
- **ES:** "Los cambios de precio de esta semana tocaron 4 platillos. Ordenados por lo que te cuestan por semana: **Caesar −$47, Alitas −$22, Cobb −$14, Ensalada −$3.** Empieza por arriba — arreglar el Caesar recupera más de la mitad."
- **Trigger/cadence:** weekly digest (the rhythm).
- **Action:** tap the top item → its re-price/re-portion/hold fork.
- **Confidence/honesty:** $/week needs `covers_per_week`; if missing, show $/plate and "add covers to see the weekly hit." Never invent covers. The spend-weighting is the point — a 2% hike on the bestseller beats a 20% hike on a rarely-ordered dish.
- **Privacy:** per-org.
- **Phase:** MVP-extension (weekly-digest framing of the hero loop). **✅ ranker built** (`tools/_shared/silent-bleed.js`, 6 vectors). **✅ Ledger server path built** — `silent-bleed.ts` (parity port) + `recipes-store.recentHikeImpacts` (the week's `price_hike` recosts per dish, prior cost via `lag`, covers-weighted) + `digestSilentBleed` + `GET /v1/recipes/silent-bleed?days=7&lang=es`; a dish with no covers is excluded, never zeroed.

### E5 — Cross-dish blast radius
- **Inputs:** invoices × recipes (canonical fan-out).
- **EN:** "Mozzarella is in **7 of your dishes.** This one price move touches all of them — **$61/week** total. One swap or one vendor call fixes seven problems at once. **[See the 7]**"
- **ES:** "La mozzarella está en **7 de tus platillos.** Este solo cambio los toca todos — **$61 por semana** en total. Un cambio o una llamada arregla siete problemas de una vez. **[Ver los 7]**"
- **Trigger/cadence:** event-driven, on a hike for a high-fan-out canonical.
- **Action:** vendor call / substitute evaluation (links to E2 when a cheaper vendor exists).
- **Confidence/honesty:** exact fan-out from `recipe_line_items`; $/week carries E4's covers caveat (no total unless every dish has covers).
- **Privacy:** per-org. **Phase:** MVP-extension. **✅ card built** (`tools/_shared/blast-radius.js`, 4 vectors).

### E6 — Menu margin map — "which dishes crossed your line"
- **Inputs:** invoices × recipes × owner target margin.
- **EN:** "3 dishes just slipped under your 30% goal: **Chicken parm (now 34%), Cobb (32%), Wings (31%).** None are emergencies — but chicken parm's the one to look at first."
- **ES:** "3 platillos quedaron debajo de tu meta de 30%: **Pollo a la parmesana (ahora 34%), Cobb (32%), Alitas (31%).** Ninguno es urgente — pero el pollo a la parmesana es el primero que mirar."
- **Trigger/cadence:** weekly digest + on-demand dashboard rollup.
- **Action:** tap a dish → its fork.
- **Confidence/honesty:** anchored on the owner's target (default 30%, labeled a starting point), never a textbook 28/30/33; theoretical plate cost labeled theoretical.
- **Privacy:** per-org. **Phase:** MVP-extension (full stars/dogs menu-engineering = V2). **✅ rollup built** (`tools/_shared/margin-map.js`, 5 vectors).

### E12 — Market-implied dish drift (free teaser, honestly labeled)
- **Inputs:** index × recipe-template (before the operator connects invoices).
- **EN:** "Heads up: produce prices in your area moved **+9%** this month. A Caesar like the typical one would feel about **+$0.20/plate** — but that's a market estimate, not your real cost. Connect one invoice to see **your** number. **[Connect an invoice →]**"
- **ES:** "Aviso: los precios de verduras en tu zona subieron **+9%** este mes. Un Caesar típico sentiría como **+$0.20/platillo** — pero es un estimado del mercado, no tu costo real. Conecta una factura para ver **tu** número. **[Conecta una factura →]**"
- **Trigger/cadence:** monthly / on the free tool.
- **Action:** Connect one invoice (the funnel CTA — fires only on an actionable signal, never on a healthy verdict).
- **Confidence/honesty:** MUST label "market estimate, not your price." This is the only insight allowed a template instead of the operator's own BOM — *because* it is labeled theoretical.
- **Privacy:** per-org / public. **Phase:** MVP-extension (Track A storefront / demand engine). **✅ teaser built** (`tools/_shared/market-implied.js`, 5 vectors).

### E9 — "Your kitchen beats the book" (operator-learned-yield truth)
- **Inputs:** yields (operator-learned) × recipes × invoices.
- **EN:** "You weighed it: your whole chickens yield **66%, not the textbook 60%.** That alone takes **$0.14 off every chicken dish** — your costs now match your kitchen, not a manual. 4 dishes updated. **[Apply to all]**"
- **ES:** "Lo pesaste: tus pollos enteros rinden **66%, no el 60% del manual.** Eso solo le quita **$0.14 a cada platillo de pollo** — tus costos ahora reflejan tu cocina, no un libro. 4 platillos actualizados. **[Aplicar a todos]**"
- **Trigger/cadence:** event-driven, when `recordYieldObservation` differs materially from the table.
- **Action:** apply the learned yield to every dish using that ingredient.
- **Confidence/honesty:** the clamp already rejects yields >1.05 or <0.05; show the AP→EP receipt. A *trust/accuracy* insight (it raises confidence), not a loss alert.
- **Privacy:** per-org. **Phase:** V2 (needs learned yields persisted per-org).

### E7 — Buy-now-or-ride-it-out · *scoped inventory read-only join*
- **Inputs:** invoices (hike) × inventory (days-of-cover, computed from pars + buy-rate) × index (spike-vs-structural).
- **EN:** "Beef's up 12% this week — but you've got **9 days on hand**, and this jump already pulled back from its peak, so it may not stick. You don't have to buy at the high. We'll re-check Monday. **[Remind me Monday]**" *(Low cover instead: "…and you're nearly out, so you'll buy at the high — here's the dish hit and the move.")*
- **ES:** "La carne subió 12% esta semana — pero tienes **9 días en inventario**, y este salto ya bajó algo desde su punto más alto, así que puede que no se quede. No tienes que comprar caro. Revisamos el lunes. **[Recuérdame el lunes]**"
- **Trigger/cadence:** event-driven on a hike, gated on `inventory_coverage` being present.
- **Action:** "Remind me Monday" (hold) vs. the buy-now re-price fork.
- **Confidence/honesty:** days-of-cover is computed (`inventory-reorder.ts`, from pars + the cadence buy-rate); the "may not stick" claim uses `cost-spike.classify` (retrace-from-peak, ≥8 wk). A *seasonal* read ("high for the season") is allowed only when `seasonality.json` marks that ingredient `ready`; otherwise retrace language only. On thin data `cost-verdict` downgrades to "watch." **Ledger honesty boundary:** the vendored Cost-Index snapshot carries a *single* point per ingredient (a trend, not weekly history), so on the Ledger the verdict is derived from the trend (`trendToVerdict`: market up→`emerging`, flat→`flat`, down→`easing`, weak read→`insufficient`) and **never** fabricates a peak-retrace `spike` or a sustained `structural` call — those (and the "pulled back from its peak" line) light up only once the snapshot vendors recent history. The cover dimension ("you've got N days, you don't have to buy at the high") carries the insight regardless.
- **Scope guardrail:** READS the existing inventory signals (pars + counts → days-of-cover); Plate never asks you to count inventory just for this. Ships only for orgs already on the inventory track.
- **Privacy:** per-org. **Phase:** V2. **✅ wired end-to-end on the Ledger** — `tools/_shared/buy-or-ride.js` (10 vectors) + the parity port `buy-or-ride.ts` + `buy-or-ride-suggest.ts` (`trendToVerdict` + `buildBuyOrRideFromContext` + `digestBuyOrRide`) + `verdicts-store.recentPriceHikes` (recent `price_hike` verdicts JOINed `verdicts→line_item_keys→product_canonical`, bridged to the inventory catalog item) + `GET /v1/insights/buy-or-ride?days=7&location_key=main&lang=es` (which reuses the existing `reorder` coverage assembly — counts on-hand ÷ buy-rate → days-of-cover). Node-validated (39 checks: 10 engine + 17 mapping + 12 route/digest glue). A hike with no cover read is skipped, never guessed.

### E8 — Theoretical-vs-actual variance · *the V3 hero*
- **Inputs:** recipes (theoretical usage) × inventory (actual depletion) × invoices (price) × POS covers.
- **EN:** "Your recipes say last week's covers should've used about **40 lb of chicken.** Your counts say **52 lb** left the walk-in. That **12 lb gap ≈ $58** — could be over-portioning, trim, or waste. Worth watching the line on chicken this week. **[Watch chicken]**"
- **ES:** "Tus recetas dicen que las órdenes de la semana debieron usar **~40 lb de pollo.** Tus conteos dicen que salieron **52 lb.** Esa diferencia de 12 lb **≈ $58** — puede ser porciones grandes, merma o desperdicio. Vale la pena vigilar el pollo esta semana. **[Vigilar pollo]**"
- **Trigger/cadence:** weekly, after a count.
- **Action:** "Watch chicken this week" — a flag, never an accusation.
- **Confidence/honesty:** report a **range**, never a precise theft number; needs POS covers (don't exist yet) + counts (exist). Labeled "theoretical vs. actual gap." This is the legitimate place costing touches inventory — already blessed as the V3 hero in `muntin-plate.md`.
- **Privacy:** per-org. **Phase:** V3 (needs POS sales-mix).

### E10 — Peer percentile (delivered level) · *dormant, counsel-gated*
- **Inputs:** invoices × dormant cohort (k-anon delivered pool).
- **EN (dormant):** "Among taquerias your size in the mid-Atlantic, your delivered chicken price sits around the **75th percentile** — most pay less. (Aggregate, anonymous, opt-in.)"
- **ES:** "Entre taquerías de tu tamaño en la región, tu precio de pollo está cerca del **percentil 75** — la mayoría paga menos. (Agregado, anónimo, voluntario.)"
- **Trigger/cadence:** monthly, opt-in only.
- **Action:** "See your highest-vs-peers products" → routes to E2/E1.
- **Confidence/honesty:** ratios/percentiles only — never prices or recipe contents; k≥10 orgs, d≥5 vendors, ≤40% dominance; buyer-side only.
- **Privacy:** **DORMANT-COHORT, counsel-gated.** Capture opt-in consent NOW (default off, versioned, revocable); ship after antitrust counsel + DPA amendment. **Phase:** V3.

### E11 — Vendor-leverage ratio · *dormant, counsel-gated*
- **Inputs:** invoices × dormant cohort.
- **EN (dormant):** "Operators like you pay about **8% less** for this product class on average. Not a price we can show you — but a number worth taking to your rep."
- **ES:** "Operadores como tú pagan como **8% menos** por este tipo de producto en promedio. No es un precio que podamos mostrarte — pero es un número que vale llevar a tu proveedor."
- **Privacy:** dormant-cohort, counsel-gated (same gates as E10). **Phase:** V3.

### Secondary / ambient (documented, ranked low)
- **E13 Pressure early-warning** — `cost-pressure.assess` (drought / freeze warnings / diesel / feed-grain) × recipes → "A Florida freeze could nudge your tomato dishes in a few weeks; nothing to do yet." Direction-only, opt-in, **calm-ambient, never a push** (it fails the "one move" test, so it must not alert). EN/ES.
- **E14 Menu-resilience stress-test** — recipes × a hypothetical ingredient hike → "If beef jumps 20% like last spring, your ribeye holds at 26% but your short-rib special goes underwater." Labeled **a what-if, not a forecast.** V2. **✅ wired end-to-end** — `tools/_shared/stress-test.js` (6 vectors) + the parity port `stress-test.ts` + `stress-test-suggest.stressTestForOrg` (costs every live dish, measures each dish's exposure to the named ingredient from its costed lines, bumps that share) + `GET /v1/recipes/stress-test?ingredient=beef&hike=20&target=30&lang=es`. Every headline opens "What-if:"; only dishes that actually use the ingredient are scored; nothing crosses → calm green; the line is the owner's own target. Node-validated (16 checks). *(Exposure is measured on top-level costed lines; an ingredient nested inside a sub-recipe shows under that sub-recipe's line — the stress is honest about what it can see.)*
- **E15 Per-dish cost-history × index** — `recipe_cost_snapshots` history → "Your Caesar's cost is up 9% over 6 months, tracking the market." V2. **✅ wired end-to-end** — `tools/_shared/cost-history.js` (8 vectors) + the parity port `cost-history.ts` + `recipes-store.costHistory` (the dish's snapshots oldest→newest, optional `sinceIso` window) + `cost-history-suggest.costHistoryForRecipe` + `GET /v1/recipes/:id/cost-history?months=6&lang=es`. Ambient by design: the % is exact (first vs last), the window label is read from the real date span, the $ levels are the operator's own receipt, a steady dish reads calm with no CTA, and the "market" side-by-side is optional + labeled to a NAMED ingredient (never a claim the whole dish tracks the market). Node-validated (21 checks). Renders via the existing `sparkline.js` from the returned `spark` series.

### What this catalog subsumes from `muntin-insight-layer.md` (extend, not duplicate)

Insight-layer **#1** (the market-vs-vendor spread at *ingredient* level) → **E1** at *dish* resolution, plus the vendor-ask action. **#4** (dish $/week) → the base hero loop that E1/E4/E5 extend. **#5** the basket index and **#6** the freight lead-lag stay in that doc (note: `cost-leadlag` confirms diesel moves *coincident*, not leading — so the freight insight is "moves with," never "predicts"). **#7** the peer pool → E10/E11. The insight-layer doc remains the Cost-Index engine spec; this doc is the Plate data-unity catalog and cross-references it.

---

## 3. Measurement — extend the North-Star, prove empowerment not engagement

North-Star unchanged: **Live Recipes Acted Upon** / the **Insight-to-Action Rate (IAR)** — the share of operators who, in a trailing window, took an observable move a surfaced insight named, **or** explicitly closed the loop as "checked, I'm fine." Each emergent insight adds a first-party, server-side action event:

| Insight | Behavior-change event(s) | "Reassured" close |
|---------|--------------------------|-------------------|
| E1 | `vendor_ask_opened` · `vendor_switch_logged` · `reprice_after_vendor_declined` | `dismiss_as_expected` |
| E2 | `vendor_default_changed` | `dismiss` |
| E3 | `packshrink_flagged` · `requote_opened` | `dismiss` |
| E4 / E6 | `reprice` · `reportion` · `hold` (per dish) | "checked, I'm fine ✓" |
| E5 | `ingredient_action` (call / sub-eval) | `dismiss` |
| E7 | `hold_followed` + a 2-week revert-check (did the hold pay off?) | — |
| E8 | `watch_acknowledged` (no false-precision action) | — |
| E9 | `learned_yield_applied` | — |
| E10 / E11 | `peer_view_opened` (post-consent) | — |

**Honesty rails in measurement:** a false alarm **lowers** IAR (`dismiss_as_noise` ≠ reassured) — this protects the calm-green state and punishes alert spam. Reassurance counts as success. The unobservable outcomes (the actual phone call to the vendor, the printed menu) are read only through an opt-in, rate-limited **"did this change a decision?"** micro-survey — never faked. **Per-insight kill switch:** any insight whose action rate stays below a floor for K weeks is muted or retired — an insight nobody acts on is a failed insight.

---

## 4. DO-NOT-BUILD (named so they're easy to refuse)

1. **Price prediction / forecasting** ("beef will be $X next month"). The index is rate-of-change *history*, not a forecast. (E14's stress-test is allowed because it's a labeled what-if, not a prediction.)
2. **Spread-of-levels** — subtracting a wholesale level from a delivered level. The fatal lie. Only spread-of-**changes** (a % is basis-invariant; a level is not).
3. **Cross-operator delivered-LEVEL comparison without counsel** — Sherman-Act price-signaling. Only the dormant k-anon *ratio* pool (E10/E11), counsel-gated, opt-in, k≥10 / d≥5 / ≤40% dominance, buyer-side only.
4. **Becoming an inventory / PO system** — auto-POs, par optimization, demand forecasting, vendor-late-delivery tracking (no delivery-date data exists anyway). E7 may READ days-of-cover; it must never make Plate manage stock.
5. **"Your costs are too high" / textbook-benchmark shaming.** Violates blame-the-price and anchor-on-the-owner's-own-target.
6. **Theoretical plate cost presented as actual food cost.** Always labeled theoretical; the gap is the V3 hero (E8), not a hidden error.
7. **LLM-generated insight copy or "smart" narratives.** No-LLM is the trust spine; every line is deterministic and receipt-backed.
8. **Seasonality "just hold" claims for an ingredient `seasonality.json` hasn't marked `ready`.** For the 60 not-yet-ready ingredients: "not enough history to call this seasonal — treating as structural." Seasonal language is earned per-ingredient (the 41 `ready` set, inside the established band), never asserted globally; spike-classifier retrace language is always fine.
9. **AP-level price comparisons** (sticker price across pack sizes/grades). Always cost on EP / `cents_per_base`.
10. **Selling or sharing any cohort data to vendors or distributors** — sell-side aggregation is collusion infrastructure.
11. **Firing the upgrade / CTA on a healthy verdict** — it trains distrust. CTA only on an actionable / overpay signal.
12. **(Off-charter) Cashflow / AP-timing nudges bolted onto Plate** — `due_date` / `v_cashflow_60d` are real, but that's the Ledger's AP surface, not Plate's margin layer. Keep Plate about the plate.

---

## 5. Frictionless upload — the precondition for the whole layer

Every emergent insight is gated on recipes being **bound** to invoice lines. Easy upload is therefore not a nicety — it is what populates the data-unity moat. **Keep the settled `muntin-plate.md` onboarding (don't re-architect); add only no-LLM-safe accelerants.**

- **Settled paths (keep):** pick-from-your-own-invoice-lines (the unfair advantage — you tap pre-priced things you already buy, auto-binding `canonical_id` + price via `stem`/`sku-match`); deterministic **paste-to-parse** (`parseTabularText`, EN/ES headers, auto-delimiter, no-LLM); cuisine templates; "cost your 5 best-sellers first"; the UoM helper with explicit confirmation; progressive disclosure + a confidence meter.
- **Additive accelerants (safe to add now):**
  - **One-tap match confirm-pills** — surface `sku-match`'s `auto`/`propose` tiers as confirm chips, so binding a 12-line recipe is 12 taps, not 12 forms.
  - **CSV / POS-menu-export import** — deterministic column mapping through `parseTabularText`'s detector.
  - **Market-template pre-fill (E12 doubles as onboarding)** — the free teaser starts a recipe skeleton the operator only edits.
- **Explicitly deferred:** snap-a-recipe-card → OCR. OCR itself is fine (the invoice-extraction pipeline exists), but free-form-text → structured rows risks the no-LLM rail; only deterministic line-parsing is allowed. Noted as a future scope decision — **not** in this build.

---

## 6. The honesty & determinism spine — why an operator trusts it enough to act

State this up front, as the precondition for the whole layer: **no-LLM, show-your-work, never false precision.**

- **Deterministic & auditable.** Every insight traces to a show-your-work receipt — `2 oz mozzarella × $0.71/oz = $1.42 — your Sysco invoice, May 28`. If an insight can't be computed deterministically and shown, it doesn't ship.
- **Label the theoretical.** Theoretical plate cost is labeled theoretical, never presented as the P&L's actual food cost.
- **Never pass partial as complete.** "3 of 8 ingredients not yet from invoices" — state coverage; never silently zero a missing line.
- **State confidence; widen the band.** On thin data, widen the range rather than print a false-precise point; the hero number is the median *inside* the band, so a single level can never masquerade as "the price."
- **Missing data says so.** "We don't have this yet," never a guess.

A wrong insight that drives a bad pricing decision is the single most fatal risk in the whole product. These gates are how the layer is designed against it — and they are a **sold feature**, not a constraint.

---

## 7. How we'll know it's right (honesty self-audit)

1. **Reconciliation.** Every insight names its inputs, its phase (MVP-ext / V2 / V3), and its privacy class (per-org vs dormant-cohort). Every "computable today" row maps to a real, named function or column (`cross-vendor.compare`, `cents_per_base`, `composite-price.assess`, `recipe_line_items.canonical_id`, …).
2. **Honesty audit.** No insight (a) compares levels across bases, (b) asserts seasonality for an ingredient `seasonality.json` hasn't marked `ready`, (c) predicts a future price, (d) presents theoretical as actual, or (e) shows cross-operator levels without the counsel gate. The DO-NOT-BUILD list mirrors these one-to-one.
3. **EN/ES parity.** Every owner-facing line has both; the Spanish is written, not literally translated; USD in both; dates spelled.
4. **The 5-second ship test, per card.** A tired, non-finance, EN-or-ES operator, on a phone, between tickets, can in 5 seconds name the dish, feel the dollars in $/week, see the one move, trust the math, and act in one tap — or be told they're fine and put the phone down.
5. **The flagship, end-to-end.** Post a romaine hike → E1 decomposes vendor vs market, leads with the ask when the gap is the vendor's, and routes to re-price only as the fallback; `vendor_ask_opened` / `vendor_switch_logged` fire; the receipt opens to the Sysco line.
