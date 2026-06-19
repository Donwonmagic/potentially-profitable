# Strategy — The Cost-Intelligence App (composable, operator-owned)

> Reference memo (not web-routable). Output of a divergence→convergence ideation
> on turning muntin from "a place to upload invoices" into **the composable
> cost-intelligence app**: four modules an operator adopts in any combination,
> under an intelligence layer that returns the strongest answer the *active*
> modules allow. Grounded in the real stack; illustrative figures are labeled.

## The four modules + the intelligence layer

- **Cost Index** — the MARKET. Live, sourced wholesale prices and where they head.
- **Invoice Decoder** — your PURCHASES. What you actually pay, line by line, vs the market.
- **Inventory** *(not yet built)* — your STOCK & FLOW.
- **Muntin Ledger** — your OUTCOME. Margin, food cost, the P&L.

Over all of them, the intelligence layer consumes whatever is switched on and
returns the most powerful honest answer with the data available.

## What actually exists today (verified)

| Module | State | Evidence |
|---|---|---|
| **Cost Index** (MARKET) | **LIVE** — 82 sourced ingredients, weekly refresh, machine-readable feed; browser seed `window.MUNTIN_COST_INDEX` | `cost-index/feed.json`, `data/cost-index.json`, `data/cost-index.js`, `scripts/build-cost-index.mjs` |
| — frontier (generated, not yet surfaced) | forward price cones (backtested), cost-pressure directional, seasonality, 12-yr history, confidence calibration | `data/cost-forecast-backtest.json`, `data/cost-pressure.json`, `data/pressure-rules.json`, `data/seasonality.json`, `cost-index/confidence-calibration.json` |
| **Invoice Decoder** (PURCHASES) | separate repo; deterministic OCR, **no LLM in the data path** (CI-gated); core solid, not launch-ready | `Muntin-Invoice-Decoder/services/extract/`, schema 0.3.0 `packages/schema/`; fusion already partly built in `packages/cost-alerts/src/{overpayment-alert,match-line,unit-normalize}.ts` |
| **Inventory** (STOCK) | **does not exist** — only a downloadable paper count-sheet | `sheets/inventory-count-sheet/` |
| **Muntin Ledger** (OUTCOME) | separate product, GA 2026-11-13; rules-based; QBO export; opt-in k-anonymized peer pool | `docs/plans/muntin-ledger-launch.md`, `data/ledger-cta.json` |
| **Glue** | client-side shared bus (no account), recost-ready recipes, yield + unit bridges | `tools/_shared/context-bus.js`, `tools/plate-cost/` (`recipe.json` w/ schema version), `data/ingredient-yields.json`, `tools/_shared/{cost-index-lookup,portion-bridge,stem,dish-drift}.js` |

**Structural insight driving the roadmap:** there are two planes — a
**privacy-by-default client-side tool suite** consuming the *public* `feed.json`,
and **server-side products** (Decoder/Ledger) behind auth. The cheapest frontier
wins live entirely in the client plane: no backend, no account, shippable now.

## The modularity mandate (binding)

- **Composable** — any subset is a coherent product (Cost Index alone has value).
- **Graceful degradation** — a capability works in reduced form or stays dark; it
  never errors, nags, or demands a module the operator didn't choose.
- **Progressive enhancement** — each added module sharpens the others and unlocks new
  capability; value compounds with combination but is never all-or-nothing.
- **Standalone-valuable** — adoption can start anywhere (invoices, prices, stock, or ledger).

## The closed loop (sensor fusion) + degraded modes

- Cost Index = **prior** → catches Decoder OCR errors (implausible price vs band → review).
- Verified Decoder reads = **sensors** → sharpen the local/delivered price the public
  wholesale index can't see; aggregated privately → a better index.
- Better index → better priors → fewer OCR errors + truer fair-price gaps + better forecasts.
- Forecast × inventory flow → buy-now-or-wait. Recipes × live prices → live plate margin
  → Ledger P&L impact. Each turn deepens the system-of-record (the moat).

Degraded modes:
- **Index only:** generic basket forecast, seasonal calendar, **recost recipes vs market**, market alerts.
- **Index + Decoder** (sweet spot): fair-price gap, overpayment $, OCR error-catch, your-price recost, peer benchmark.
- **+ Inventory:** buy-now-or-wait quantities, theoretical-vs-actual variance, shrink.
- **+ Ledger:** P&L impact, margin-at-risk, cash flow.
- **Decoder only:** parse + duplicate/price-hike sentry on your own history; no market verdict.

## Module-capability matrix

| Capability | Index only | Index + Decoder | + Inventory | All four |
|---|---|---|---|---|
| **Live Plate Margin** | vs **market** ✅ | vs **your prices** | on-hand weighted | + P&L roll-up |
| **Fair-Price Gap** | manual line only | **every line** ✅ | — | + switch-savings → P&L |
| **Basket Forecast** | default basket ✅ | **your basket** | + quantities | + margin-at-risk |
| **Buy-Now-or-Wait** | storables hint | storables (your mix) | **qty + timing** ✅ | + cash-flow |
| **Variance / Shrink** | — | — | **theoretical-vs-actual** ✅ | + P&L impact |
| **Leak of the Week** | market leak | + overpay leak | + waste leak | **best ranking** ✅ |
| **Peer Benchmark** | — | percentile ✅ | — | percentile + P&L |
| **OCR Error-Catch** | your outliers | **market-prior catch** ✅ | — | catch |
| **Margin-at-Risk** | menu-level (market) | + your prices | — | **full $ at risk** ✅ |

(✅ = the headline thing that lights up at that combination.)

## Ranked roadmap

1. **Live Plate Margin (market recost)** — 1 module, already-live deps, felt power this quarter. **First.**
2. **Fair-Price Gap** — the killer market×purchases fusion; manual version exists (Vendor Benchmark), full version lands with the Decoder.
3. **Basket Forecast** — surfaces already-backtested frontier data; Index-only.
4. **Leak of the Week** — the delivery wrapper that makes the above *felt* (one email).
5. **Peer Benchmark** — privacy-preserving moat; rides the Ledger peer-pool.
6. **OCR Error-Catch** — cheap accuracy + trust; closes the loop.
7. **Margin-at-Risk / P&L impact** — full-stack payoff once the Ledger is GA.

**Progressive-power arc:** Index → plate margin moves itself + forecast/seasonal →
+Decoder → your-price recost + fair-price gap + error-catch → +Inventory →
buy-now-or-wait + variance → +Ledger → P&L, margin-at-risk, cash-flow.

## Expert grounding (sourced)

The load-bearing assumptions are grounded in industry/expert sources, registered in
`data/sourced-claims.json` (snippet-verified; several full fetches were 403-blocked,
noted per entry). These directly back the shipped capability's defaults and claims:

- **Food-cost target band — `#food_cost_target_band_2026`.** The decades-long
  industry target is **28–35% of food sales**, by service model: quick-service /
  fast-casual ~25–30%, casual ~30–34%, fine dining ~34–40%. Cross-checked across
  Restaurant365, NetSuite, meez, ChowNow. → grounds the engine's `FOOD_COST_TARGETS`
  bands and the 30% full-service default (was a bare magic number).
- **Protein is the highest-cost, most volatile category — `#protein_highest_cost_category_2026`.**
  meez / ChowNow. → why protein lines dominate recost drift and deserve priority.
- **Menus lag supplier costs — `#menu_price_lag_wholesale_2025`.** Full-service menu
  prices rose ~4.4% YoY (mid-2025) while wholesale food costs stayed far above
  pre-pandemic levels (source cites 36%+). Barmetrix. → the gap automatic recost closes.
- **Recost cadence — `#menu_recost_cadence_six_months_2026`.** Experts advise smaller
  price moves ~every six months because "a dish costed six months ago may have drifted
  significantly." GoFoodService / MarketMan. → the value of *automatic* recost over the
  existing manual "quarterly check-in" banner.

Honest caveats: the segment edges are approximate industry ranges, not one authority's
exact figure (kept labeled as a band); the 36%+ wholesale figure is a compilation to
re-check against BLS CPI/PPI before any hard number lands in library prose.

**Falsifiable claim (now grounded):** if expert guidance is to recost only every ~6
months while wholesale moves far faster than menus (the lag above), then independent
plate margins should drift measurably *between* recostings — muntin can quantify that
per-quarter drift from market data alone and publish it first.

## Discovered: quarterly plate-cost drift (derived; muntin-first)

Measured by `scripts/build-cost-plate-drift.mjs` → `data/cost-plate-drift.json`,
**derived-with-stated-method** from the committed Cost Index deep history
(`data/cost-index-history.json`, USDA AMS/LMR etc.). Deterministic; window is the
latest quarter with ≥90% ingredient coverage. *These are derived market figures, not
operator data; they move as the index refreshes. Confidence: medium — directional,
on a dataset with some known placeholder/mis-scaled entries (handled, see caveats).*

**The finding (window 2026-01 → 2026-04, 48 ingredients after collapsing clones):**
- Median ingredient drift **+3.5%**, but the spread is wide (p25/p75 **−6.0% / +17.3%**).
- **~69% of tracked wholesale ingredients moved more than 5%** in the single quarter —
  i.e. a menu priced a quarter ago is already off on roughly two-thirds of its inputs.
- Proteins (16 bridgeable) moved a median **+4.4%**. Extremes were real and clean
  (tomato +235% seasonal; eggs −30%).
- Indexed-component cost of illustrative protein-forward plates drifted **−2.6% to
  +31.6%** (median **+5.5%**) — chicken-breast plates moved most (+32%), shrimp eased.

**This tests the claim and supports it:** plate cost drifts materially within one
quarter from market moves alone — the case for *automatic* recost over a twice-a-year
manual pass.

**Honesty caveats (flag-don't-fabricate):**
- Plate archetypes measure ONLY the indexed protein+fat component (not a full recipe),
  so they carry **no food-cost %** — just component cost and its drift.
- The build excludes mis-scaled levels (e.g. `vegetable-oil` reads ~$290/"lb", a
  non-lb basis mislabeled) via a >$60/lb guard, and avoids deep-history placeholder
  clones (`short-rib`/`beef-tenderloin` are byte-identical to `ribeye`). These are
  Cost Index **data-quality issues to fix upstream**; until then the figures are
  directional. Endpoints use each month's **median** to avoid sub-monthly peaks.
- **Out of scope (follow-up):** publishing this to the public weekly dispatch / a blog
  post — that crosses the article-graphics + audio + locale-parity gates and needs its
  own pass with inline `<details class="cite">` method drawers.

## Critical audit: Cost Index data quality (grounded)

The drift work tripped over real defects, so they're now scanned systematically by
`scripts/build-cost-index-audit.mjs` → `data/cost-index-audit.json` (report-only;
wired into CI as a self-test + sync pair, does not fail on findings). Plausibility
bands and reference levels are grounded in USDA AMS boxed-beef / pork and CME soybean
oil (`data/sourced-claims.json#usda_wholesale_protein_oil_refs_2026`).

**What it found (53 deep-history ingredients):**
- **4 clone clusters (9 ingredients)** — byte-identical series, i.e. placeholder
  seeding: `[beef-tenderloin, ribeye, short-rib]`, `[ground-pork, pork-shoulder]`,
  `[salmon-fillet, salmon-skin-on-fillet]`, `[shrimp-head-on, shrimp-pd]`. Tenderloin
  at ribeye's $12.80 is wrong (USDA wholesale tenderloin ~$16, grass-fed $25–44);
  short-rib should be ~$8–10.5.
- **1 implausible per-lb level** — `vegetable-oil` at ~$350/"lb", **730× the CME
  soybean-oil reference (~$0.48/lb)**: a non-lb basis mislabeled as lb.
- **0 false positives** on legitimate prices — ribeye (1.2× ref) and ground beef
  (1.6× ref) sit inside the 0.5×–2× tolerance and are not flagged.

**Acted on (self-critique of my own artifact):** the plate-drift build now collapses
clone series to one representative (`clonesCollapsed: 5`), so duplicate beef cuts no
longer inflate the distribution — the finding above is the de-duplicated version. The
veg-oil mis-scale was already excluded by the >$60/lb guard.

**Recommended upstream fix (out of scope here):** the Cost Index pipeline should give
`beef-tenderloin` / `short-rib` / `ground-pork` / the salmon & shrimp variants their
own series, and correct `vegetable-oil`'s unit basis. Until then, `data/cost-index-audit.json`
is the standing triage list.

## The category thesis

> **muntin is the Bloomberg terminal of restaurant costs — the honest, composable
> layer that fuses the market, your purchases, your stock, and your margin into one
> truth no distributor or POS can give you without a conflict of interest.**

---

## Pioneered first: Live Plate Margin (market recost) — SHIPPED in this change

**Superpower:** open your menu and instantly see which dishes quietly fell below
target margin since you priced them — and by how much — because the market moved.

**Module contract**
- *Minimum:* Cost Index + a recipe the operator already typed in Plate Cost. No
  Decoder, no account, no backend.
- *Degraded mode:* an ingredient with no firm market level, or sold in a unit that
  can't bridge to the portion (carton/head/sack vs oz), is **excluded and reported
  as unpriced** — never guessed. A fuzzy name match is a *suggestion*, never a
  silently-summed dollar. With no menu price, it still reports the cost drift.
- *Enhancements:* +Decoder swaps the market level for the operator's actual paid
  price per line (`dish-drift.js`); +Inventory weights by on-hand; +Ledger rolls the
  per-dish delta into the P&L.

**Honesty:** the index is a wholesale reference, never the delivered price; the panel
says so every time and only uses medium+ confidence levels (gated by
`MuntinCostIndexLookup`). The "below target" flag uses an expert-grounded food-cost
band (`FOOD_COST_TARGETS`): 30% full-service default, or the service-model midpoint
when named — quick-service ~27.5%, casual 32%, fine-dining 37% — never a bare number.

**Falsifiable claim to discover & publish:** independent-restaurant plate margins
compress by a measurable amount per quarter from input-price drift that static menus
never track — computable from market data alone.

**What shipped**
- `tools/_shared/plate-market-recost.js` — pure, deterministic compute engine (the
  Index-only sibling of `dish-drift.js`); reuses `MuntinCostIndexLookup` +
  `MuntinPortionBridge`. No DOM, no fetch. Exposes expert-grounded `FOOD_COST_TARGETS`
  + `targetFor(serviceModel)` so the margin verdict is sourced, not arbitrary.
- `tools/_shared/plate-market-recost.test.mjs` — `node:test` suite (auto-run by
  `scripts/check-tests.mjs`): recost math, target-margin flag, unpriced/fuzzy
  exclusions, unit-bridge guard, yield normalization, sort, graceful degradation.
- `tools/plate-cost/market-recost-panel.js` — additive, fail-silent menu-wide panel
  (mirrors `cost-index-hint.js`); `textContent` only; renders nothing when no firm
  match exists.
- Wired into `tools/plate-cost/index.html`.

**Verified on real data:** against the live 82-ingredient seed, an 8/12-oz ribeye
recosts from a stale entered price up to current market with the food-cost % shift,
while an unmatched ingredient is reported `unpriced (no-match)` rather than guessed.
(Illustrative run; figures move with the weekly index.)

**Next:** when the Decoder lands, the same panel swaps the market level for the
operator's actual paid price per line — the Index→Index+Decoder step on the arc.
