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
`MuntinCostIndexLookup`).

**Falsifiable claim to discover & publish:** independent-restaurant plate margins
compress by a measurable amount per quarter from input-price drift that static menus
never track — computable from market data alone.

**What shipped**
- `tools/_shared/plate-market-recost.js` — pure, deterministic compute engine (the
  Index-only sibling of `dish-drift.js`); reuses `MuntinCostIndexLookup` +
  `MuntinPortionBridge`. No DOM, no fetch.
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
