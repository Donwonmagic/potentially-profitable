# Cost Index — experience & information map (10-specialist synthesis, 2026-06-07)

How to make the surface more enjoyable, educational, and trustworthy — and the
content library around it. Synthesized from a 10-person panel: learning design,
data storytelling, information design/dataviz, behavioral/decision science,
delight/engagement, restaurant-operator SME, content/library architecture,
accessibility/ESL, back-end data pipeline, and quant methodology.
Status tags: ✅ now (no backfill) · ⏳ needs the weekly history we're backfilling · ⛔ founder/data work.

## Five meta-findings (where the panel converged)
1. **The back end is ahead of the front end.** Carefully-built, tested logic is sitting *dark*: the per-ingredient `flag` (story-so-far verdict) isn't emitted to the browser; `cost-spike.js` (spike-vs-structural + `actionBias`) isn't loaded by the tool; percentile-of-history is computable from data on hand but unused. Much of "better information" is *connecting what exists*.
2. **The page leads with a dead feature.** Cost Pulse's title/OG/hero still describe the **retired Invoice Decoder** ("track trends across your saved invoices"); a first-time operator lands on an empty invoice dashboard and bounces before reaching the index. Hurts every visitor *now*, independent of the data work.
3. **Fix vocabulary and order, not architecture.** The inclusion machinery already exists (dual text alternatives, glyph+word trend, confidence-softening). The gaps are bare jargon ("directional"), percents with no dollar anchor, and an analyst-first information order.
4. **Honesty is the design system.** Every specialist independently reinforced one rule: **confidence governs precision** — a thin read shows a direction word, never a number — gaps stay gaps, no fake seasonality/forecasts, "association, not cause," and live cents figures live only in dated content/tiles.
5. **The real data win is independent dollar *families* per ingredient, not more ingredients.** Most ingredients are `nFamilies:1` → "range not measurable." Feeding the existing dispersion engine a second wholesale source per item earns real bands + higher confidence.

---

## P0 — Buildable now, no backfill (highest impact)
- **Fix the page identity.** Lead with the Cost Index; demote the retired invoice dashboard to a collapsed "before May 2026" note; rewrite title/OG/hero to what the tool does now. *(operator SME — most urgent)*
- **Emit the `flag` to the browser** (one line in `build-cost-index-seed.mjs`) and render a one-sentence "story so far" + a **buy / hold / wait / lock** verb. *(storytelling, behavioral, operator)*
- **Wire `cost-spike.js` into the tool** — render the verb as a *confidence-calibrated suggestion, never a command* ("many operators would consider re-pricing"); make HOLD first-class; lead with the low-regret action (ASK before REPRICE). *(behavioral)*
- **"Normally $28–34, right now $41 — top of its usual range"** capsule, straight from the band already rendered (no new data). *(storytelling)*
- **Accessibility quick-wins:** confidence words → trust phrases ("directional" → "early hint only — not a firm number"); anchor every percent to a dollar ("up 12% — about $0.80 more a case"); **tap targets ≥24px** (Track/Clear/Copy currently fail AA); pin the plain summary as the true first element; debounce the `aria-live` verdict (~400ms); give the inline sparkline a **text alternative** ("held steady, then rose the last two weeks" — a real WCAG 1.1.1 gap today). *(accessibility)*
- **Teach one concept at the pixel it matters:** per-signal `<details>` learn toggles (why a range / market-vs-vendor / what "medium" means / how fresh), "explain like I run a diner" copy, EN+ES. *(learning)*
- **Verdict-as-lesson** in `renderYou()`: when the operator is above band, branch the explanation on the card's own trend/confidence/`flag` ("market's flat but your invoice jumped → that's a vendor gap, not a market one"). *(learning, behavioral)*

## P1 — Buildable now, lights up with the backfilled history
- **Percentile-of-history as a count** — "higher than 9 of its last 12 weeks" (never a smoothed "85th percentile"); require ≥~12 valid weeks; inherits confidence hedging. *(quant, behavioral, dataviz)*
- **Honest gaps first** — refactor `sparkSvg` to break the line at missing weeks (dotted gap), *before* any multi-week series renders, or the first line will lie. *(dataviz)*
- **Confidence as line weight/dash, freshness as filled-vs-hollow end dot** — non-color channels that survive grayscale. *(dataviz)*
- **Today-in-its-own-range:** fuse the sparkline with a faint p25–p75 band of the ingredient's own window. *(dataviz)*
- **vs last week / vs last year as numbers** ("eggs are double last year") — the figure operators actually repeat. *(operator, dataviz)*
- **Weekly heartbeat:** a dated "This week / since you last looked" line (local-only, no streaks/badges/urgency). *(delight)*
- **Driver "why" with a lag claim** ("diesel turned up ~3 weeks before produce — association, not cause") only when the two series support it. *(storytelling, dataviz)*
- **Confidence calibration as a min-of-gates function** (source independence × agreement × completeness × stability) that *structurally governs precision*, enforced as a CI check like the fabrication gate; **range-widening (rolling IQR/MAD)** feeds it. *(quant)*
- **Annotations as data fields with a cite-or-describe rule:** a causal note ("as Salinas supply tightened") requires a citation; describing the operator's own curve doesn't — keeps the fact-gate structural. *(storytelling)*

## P2 — Back end: "better information" (the pipeline)
- **Independent dollar families per ingredient** (the headline data win): add boxed-beef / negotiated-pork cutout as a 2nd wholesale family (ribeye/pork → measured band + `high` confidence); eggs wholesale (AMS Egg Market News) instead of retail proxy; veg-oil real level (AMS crude soybean oil). *(back-end)*
- **Emit retail AND wholesale bands** — both are already fetched, then one is discarded; the spread is itself a signal. *(back-end)*
- **Coverage gaps operators feel:** ground beef (have steakhouse cuts, not the #1 beef item), mozzarella, **oil by the jug/case not the pound** (a unit error that kills credibility), avocado, coffee, flour. *(operator, back-end)*
- **Category drivers via BLS PPI:** packaging/disposables, freight (truck transport), natural gas — index/trend, honestly labeled. *(operator, back-end)*
- **More produce free** via the existing 8-market AMS fan-out (each new commodity arrives banded). *(back-end)*
- **Trust hardening:** per-source `cadence` field + freshness-anomaly badge; unit-flip *ratio* detection (catches silent ×100 shifts inside the wide band); cross-source divergence flag; poison-pattern logging. *(back-end)*
- **`cost-index-health.json` coverage matrix** (ingredient × has-dollar-level / nFamilies / confidence / freshness) — self-prioritizes the family work and proves honest maintenance. *(back-end)*
- **Backfill depth + seasonality baseline** → enables "it's January-high, not crisis-high." *(back-end, quant)*
- **"Typically seasonal" sourced labels** (`seasonality-notes.json`, cited to USDA) *before* measured seasonality is valid (≥2 years). *(quant)*

## P3 — The content library (graft onto the existing spine)
The `library/ingredient-yields/<slug>/` pages already match the 16 index keys; the interlink files (`cross-surface-map.json`, `tool-knit.json`, glossary anchors, RSS) just need populating. **First ten:** (1) keystone `/library/how-to-read-the-cost-index/`; (2) ~10 vocabulary glossary terms (price-basis, wholesale-vs-menu, composite-price, confidence-level, lead-lag, feed-grain, spike-vs-trend, hold-vs-reprice, market-basket, provenance); (3–4) `corn-to-your-plate` + `diesel-to-your-plate` driver explainers (the differentiator); (5) extend one `ingredient-yields/<slug>` into the "normal price for X" template; (6) vendor-negotiation playbook + sheet; (7) seasonal buying calendar; (8) first monthly recap (Don); (9) first "why is X up now" dispatch; (10) populate the interlink wiring. **Iron rule:** live cents figures live only in dated blog dispatches or transcluded tiles — **never in evergreen prose**, or content contradicts the data as it updates. *(content)*

## Cross-cutting principles (the spine, from every specialist)
- Honesty governs precision; thin data → direction word, no number (CI-enforced).
- Gaps stay gaps; no interpolation, no fabricated seasonal curves, no ML forecasts; "association, not cause."
- Animate the **data shape**, never the **credibility chrome** (confidence/provenance/"as of"); no streaks, badges, or manufactured urgency for a 10pm operator.
- Put the plain-language **advice** lines in Spanish too, not just the labels.
- Build on existing machinery (`<details>` disclosure, `sparkSvg`/`bandSvg`, `L()` i18n, the companion-kit injectors) — extend, don't fork.

## Suggested first build wave (when you're back)
1. Page-identity fix (P0) — stops the bounce, helps every visitor today.
2. Emit `flag` + wire `cost-spike` + render the buy/hold/wait verb as a calibrated suggestion (P0).
3. Accessibility vocabulary/order pass: trust phrases, $-anchored percents, tap targets, summary-first, sparkline text alternative (P0).
4. Honest-gaps sparkline refactor (P1) — prerequisite before the backfilled history renders.
5. Percentile-of-history count + vs-last-year number (P1) — the moment the history lands.
Then P2 family-coverage and P3 content in parallel as cadence allows.
