# Cost Index — historical reference: usage map & build record

How comprehensive weekly price history (per ingredient + per driver) gets used,
and what shipped to deliver it. Synthesized from a 5-specialist panel + an
architecture plan (2026-06-07). Status: ✅ done · ▶︎ in flight · ⛔ needs founder env.

## The arc
A snapshot answers *"what's the price?"* History answers *"what do I do?"* Every
operator-facing read resolves to a verb (HOLD · REPRICE · BUY NOW · WAIT · ASK
YOUR VENDOR) with a confidence word attached, so a thin read never reads as a command.

## 1. Operator usage (free = public reference · Ledger = joined to their invoices)
| Use | Verb | Free / Ledger | Engine |
|---|---|---|---|
| Spike vs. structural (blip or new normal) | HOLD / ACT | Free | `cost-spike.js` (built) |
| Repricing timing (moved enough, long enough) | REPRICE / HOLD | Free signal · Ledger margin | composite trend + confidence |
| Driver early-warning (corn/diesel lead) | PRE-BUY / LOCK | **Free — marquee** | `cost-leadlag.js` |
| Contract-negotiation timing | RENEGOTIATE | Free leverage · Ledger overpay proof | percentile + seasonality |
| Seasonal buying windows | PRE-BUY / SUBSTITUTE | Free | seasonality (needs ≥2yr to *measure*) |
| Substitution · budget · par-levels | SWAP / BUDGET / STOCK | Free signal · Ledger personalization | basket + trend |
| Vendor markup drift (your price vs market) | RE-BID / SWITCH | **Ledger only** | `market-vs-vendor.ts` |

## 2. What's analytically honest at 6–12 months (quant panel)
- **Ship first** (low risk): spike-vs-structural (built), percentile-of-window ("higher than 8 of the last 12 months" — plain counting, no false precision).
- **Then:** driver lead-lag (short lags only, e.g. corn→chicken; carries "association, not cause" + n), basket-over-time, volatility/range-widening (needs ~24wk).
- **Hold:** YoY until ≥53 weeks; seasonal *factors* until ≥2 years (before that it's domain context, not a computed curve).
- **Never:** ML/ARIMA "forecasts," interpolation across gaps, causation claims, false precision. **Gaps stay gaps.**

## 3. Presentation (data-viz + a11y panel)
Progressive disclosure: card keeps its scan (range → direction → "where you sit"),
then opens history, then opens "why" (drivers). Pure hand-built SVG (extends
`sparkSvg`/`bandSvg`), gaps drawn as breaks never bridged, every curve backed by
an sr-only equivalent + ≥80-char audio narration, bilingual, 320px-first, no
animation. Citation rides with the curve; an index series is never shown as dollars.

## 4. Leading-source / SEO (answer-engine panel)
- **Per-ingredient permanent URLs** (`/cost-index/romaine/`, +drivers) beat one hub — AI Overviews cite the URL that answers the specific query. (Not yet built — biggest authority gap; the index currently lives only inside `/tools/cost-pulse/`.)
- **Attribute-rich `Dataset` + `Observation` schema** (numbers + `dateModified` + `citation` to the USDA/BLS/FRED reports) is the citation lever; generic schema gives no lift.
- **Two-track:** evergreen tracker (The Muntin Desk) ⨯ timely dispatch (Don, first-person) on the spike, interlinked; tracker owns the durable answer, dispatch catches the wave + backlinks.
- **SKU precision (important):** romaine $73–80 is the **24-count carton** line; LA *hearts* read ~$56–60 (that's the $60.50 in our data). Any headline must cite the carton SKU per market per report date, or the fact gate is technically satisfied but the claim misleads.

## 5. Ledger moat (product panel)
- **The market curve is free; the operator's own line on top of it is paid.** Every sentence with "your" lives behind auth — the missing second line *is* the ad.
- Killer paid screens the history unlocks: "your vendor vs the market, 12 months", "the gap is widening" (slope on `excessPct`), divergence alerts (existing push rails), negotiation timing, dish-margin forecast (Plate recost).
- Moat = the **join** (public feed × private invoices) + the cited engine + per-operator history that compounds with tenure. Antitrust: negotiation timing phrases against *public* indices + the operator's *own* cadence, never "other buyers are locking"; the first-party pool stays counsel-gated.

## 6. Implementation — what shipped this session
Architecture: history is *fetched already* (for the trend) and was being discarded.
It now flows end-to-end, gated for citeability + bounds but **exempt from the
staleness gate** (old by design), living in a sibling field the current-price gate
never reads — so a stale price can never leak into the live number.

- ✅ **Gate contract** (`check-cost-index-sync.mjs`): `historyIssues()` + `driverIssues()`; self-test 22→33, incl. the regression "stale current point still fails while stale history passes."
- ✅ **Orchestrator** (Ledger `ledger-spec/cost-index/src/orchestrator.ts`): `buildHistory()` surfaces the primary series (non-index priority, longest; index fallback), capped, gaps verbatim; `composeDriver()` + drivers loop. 7 new vitest cases (43/43 staging green). Does not touch the parity-locked trio.
- ✅ **Storefront build** (`build-cost-index.mjs`): vendors history + drivers, carry-forward re-validates history without staleness; leads checked vs the known ingredient universe in build *and* gate.
- ✅ **Seed** (`build-cost-index-seed.mjs` + `data/cost-index-labels.json#drivers`): history→sparkline + `spark_meta` attribution; emits drivers.
- ✅ **Render** (`cost-index-ui.js`): sparkline citation (index-vs-$ honest) + collapsed drivers "why" strip ("tends to move before …, association not cause").

All inert on today's history-less data (forward-compatible), verified with fixtures.

## 7. Still needed (founder env)
- ⛔ **Run the live backfill:** the orchestrator (with FRED/BLS/AMS/EIA keys + egress — both absent in the web sandbox) fetches the multi-date series and emits the artifact; `build-cost-index.mjs --artifact` then vendors real history → the sparklines + drivers + curves light up automatically.
- ⛔ **EIA fetcher** (electricity) — stubbed, like NOAA; a follow-up in `fetch-sources.ts`.
- ▶︎ **Per-ingredient pages + Dataset schema** (the leading-source play) and the romaine dispatch — buildable once real history exists.
