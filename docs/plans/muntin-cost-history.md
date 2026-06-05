# Muntin Cost Index — What price movements have meant (historical calibration)

*7-specialist historical research synthesis (macro-episode historian · independent-restaurant impact · menu pass-through economist · ingredient-volatility quant · freight/feed lead-lag · data-citeability scout). 2026-06-05. Purpose: ground the engine's thresholds, weights, framing, and content in what price levels/movements have ACTUALLY meant for independent operators.*

## Method (why it's trustworthy)

Decision-driven (every finding maps to a threshold / weight / copy / content piece) and **fact-gated**: every quantitative claim carries a real source, and `[VERIFY]` marks anything not confirmed against a primary source. **NOTHING here enters operator-facing prose or audio until verified against the primary source and registered in `data/sourced-claims.json`.** The figures below are research findings, not yet published claims.

---

## Calibration 1 — The spike-vs-structural flag: breadth × persistence, NOT magnitude

The cleanest finding of the whole effort: **magnitude does not separate a revert-able spike from a structural step-change — breadth and persistence do.** The largest % moves on record all *reverted*; the moves that permanently re-set operators' cost floors were *broad, sustained, and moderate*.
- **Reverted spikes** (default → "hold"): eggs +163.1% farm-level 2022 then −28.3% 2023 (USDA ERS Food Price Outlook); dairy ±40% supply cycles (ERS Amber Waves 2016); 2022 Ukraine cooking-oil/wheat overshoot (FAO Food Price Index Mar 2022, veg-oil +23.2% in one month) — big, *narrow*, *short* (6–18 mo).
- **Structural step-changes** (→ "re-price"): 2022 aggregate food-at-home CPI +13.5% YoY (BLS, largest since 1979) — *broad*, sustained, never reverted; multi-year cattle-herd liquidation (beef, smallest US herd since 1951) — slow secular climb.

**Rule for the flag** `[INFERENCE — backtest before shipping]`: a move reads STRUCTURAL (re-price) when it is **>+10% YoY, sustained ≥2 quarters with no >⅓ retrace, AND correlated across ≥2 ingredient categories.** A large single-ingredient supply shock (eggs/HPAI, dairy cycle) defaults to SPIKE/hold with a *widened confidence band*, not a re-price. **Eggs = a recurring event** (HPAI 2015, 2022, 2024, 2025) — code as an EVENT flag, not seasonal.

## Calibration 2 — The re-price threshold + the foregone-window deadline (the killer insight)

- **Un-acted increases are permanently foregone:** ~5.8% of missed increases recovered within 90 days, ~0% thereafter (Anderson, Jaimovich & Simester, *REStat* 97(4):813–826, 2015) `[VERIFY exact figures — primary PDF was access-blocked]`. → Muntin's core value is **catching the re-price inside the ~90-day window**; the enemy isn't a long lag, it's the closing window.
- **Menu prices are the stickiest in the CPI** — "menu cost" is literally named after restaurants; re-pricing probability is non-linear in shock size (small shocks get eaten). → justifies a **floor**, not a continuous nudge.
- **Restaurants pass through more than groceries but slowly:** food-away-from-home CPI +49.5% vs food-at-home +29.9% (2014–24; BLS CUUR0000SEFV vs CUUR0000SAF11; USDA ERS chartId=109406).
- **Threshold** `[INFERENCE]`: fire the RE-PRICE recommendation at a **≥3–5% plate-cost move** (respects genuine stickiness while beating the foregone window). Below it → hold / re-portion.
- **Framing:** "Costs are up X% since you last priced; holding here isn't neutral — it's a standing margin cut." Passive holding under inflation silently erodes the real price every month (asymmetric "rockets and feathers").

## Calibration 3 — Basket weights: volatility ≠ weight; two seasonal flags

- **Weight on real spend, not drama.** Proteins (chicken/beef/pork) + cooking oil are the largest dollar lines on a typical independent menu `[INFERENCE — pending Muntin buy data]` → anchor ~55–65% of basket weight. **Eggs and leafy produce are the most VOLATILE but a smaller spend share → CAP their weight**; surface their spikiness through the flag, not the basket (or the index thrashes on items that don't dominate a P&L).
- **Beef carries a standing "structural rising" annotation** — smallest US herd since 1951 (USDA ERS Cattle & Beef Outlook); it's a secular story, not month-to-month noise.
- **Split seasonality into two flags:** a CALENDAR flag (romaine/lettuce — Yuma Nov–Mar; tomato — winter import; chicken breast — summer; butter — Q4 baking) and an EVENT flag (eggs/HPAI; leafy greens/E. coli recalls). The biggest moves in eggs & leafy are exogenous shocks, not months.
- **Coverage data reality:** eggs, chicken, beef, butter, cheddar, soybean oil have clean long FRED/BLS PPI monthly series (e.g. eggs WPU017107, broilers WPU014102) — easy + authoritative. **Produce is thin/fragmented** (AMS shipping-point + NASS, per-commodity, no clean index) — budget extra effort.

## Calibration 4 — The "why" explainer: feed-grain beats diesel

- **Diesel/freight is mostly COINCIDENT / common-cause with food, NOT a clean leader** (RSM US: diesel ~0.68 corr with trucking PPI, "coincide" `[VERIFY]`; the 2021–22 spike was a multi-cause shock — diesel + Ukraine + COVID + HPAI, per ERS). → If we add diesel, frame it **"moves alongside, we show the association, not a cause"** — never "diesel leads food by N weeks."
- **Feed-grain (corn/soybean) IS a genuinely leading signal**, with a published biological lag: **~10 weeks for chicken, ~10 months for pork, ~30 months for beef** (USDA ERS, *Grain Prices Impact Entire Livestock Production Cycle*, 2009; reaffirmed 2025). Feed is ~65–70% of broiler/layer cost `[VERIFY exact ERS cite]`. → **For the explanatory "why," a feed-grain series is the stronger, more defensible pick than diesel.** Honest framing: "feed-grain costs have historically led retail protein by ~10 weeks (chicken) to ~30 months (beef) — association with a lag, never a guaranteed cause."

## Calibration 5 — The stakes & framing (what the tool speaks to)

- **The 3–5% margin is the whole reason the tool exists.** Full-service net margin ~3–5%; prime cost 55–65%; food COGS 28–35% (NRA / industry benchmarks). At a 4% margin, **one unhedged ingredient swing can flip a profitable month to a loss.**
- **The stakes are documented and severe:** 2022 — 72% of restaurant owners said they'd close if inflation didn't moderate (Alignable survey, via Restaurant Dive); 110,000+ restaurants/bars permanently lost in 2020 (NRA). Independents take disproportionate damage — no scale, no price-lock contracts, and the owner personally does the menu reprint, so they delay (CNBC, Nov 2022). **Exactly Muntin's thesis.**
- **The honest payoff to promise:** operators who track food/labor *weekly* instead of monthly report ~2–5% of sales in prime-cost savings `[VERIFY — industry-consultant source, not government data; label as industry guidance]`.
- **Content angles (citeable):** "The 4% margin" (a viz-waterfall of a 10% beef spike landing on a 4%-margin P&L); "What chains have that you don't — and how to get it cheaply" (purchasing power, price-lock, analytics — the Index *is* the missing analytics team).

---

## Citeable-claims registry (candidates for `data/sourced-claims.json`, each pending [VERIFY])

| Claim | Source | Status |
|---|---|---|
| Food-at-home CPI +13.5% YoY Aug 2022 (largest since 1979) | BLS TED 2022 | verify URL+date |
| Eggs farm-level +163.1% (2022), −28.3% (2023) | USDA ERS Food Price Outlook | verify chart id |
| FAFH +49.5% vs FAH +29.9% (2014–24) | BLS CUUR0000SEFV / SAF11; ERS chartId=109406 | verify |
| Un-acted increases ~5.8% recovered in 90d, ~0% after | Anderson/Jaimovich/Simester, REStat 97(4):813–826 (2015) | **VERIFY primary PDF** |
| Feed→protein lag: ~10wk chicken / ~10mo pork / ~30mo beef | USDA ERS 2009 (reaffirmed 2025) | verify |
| FSR net margin ~3–5%; prime cost 55–65% | NRA / industry benchmarks | verify primary |
| 110,000+ restaurants lost 2020 | National Restaurant Association | verify release |
| 72% owners feared closure (2022) | Alignable via Restaurant Dive | label as survey, small-n caveat |
| Smallest US cattle herd since 1951 | USDA ERS Cattle & Beef Outlook | verify |

## Verification discipline (binding)

1. Every figure above is a research finding, NOT a published claim, until confirmed against its primary source.
2. `[INFERENCE]` items (the 3–5% threshold, the breadth×persistence rule, basket weights) are internal calibration judgment — label illustrative/internal in any operator-facing copy; they are not facts.
3. Register confirmed facts in `data/sourced-claims.json` with source URL + access date before they appear in prose or six-language audio.
4. The data-citeability scout's source catalog (FRED/BLS/USDA series ids + redistribution status) is appended below once complete — it is the backbone for steps 1–3.

## Sourcing catalog (data-citeability scout)

**Directly citeable — public-domain US-gov, stable IDs → publish freely (register the series id as the source key in `sourced-claims.json`):**
- **CPI menu vs grocery (the backbone pair):** `CUUR0000SEFV` food-away-from-home (the "menu price" anchor) · `CUSR0000SAF11` food-at-home (1952+) · `CUSR0000SAF112` meats/poultry/fish/eggs. Use index series for TREND claims.
- **APU dollar levels (point facts, e.g. "a dozen eggs cost $X"):** `APU0000708111` eggs Grade A Large $/dozen; chicken/ground-beef/etc. follow the `APU0000…` pattern `[VERIFY exact per-item codes]`. APU = level-in-a-month, NOT trend — don't use for change-over-time.
- **PPI wholesale ingredient costs:** `WPU012` farm grains (back to 1926) · `WPS012202` corn · `WPU01830131` soybeans · `WPU029201` soybean meal/feed; beef/pork/poultry/eggs/dairy/oils under WPU0113/WPU0612-style codes `[VERIFY per ingredient]`. (Our engine already maps several of these.)
- **Diesel/freight:** `GASDESW` US diesel, weekly, 1994+ (EIA) · `PCU484121484121` truckload freight PPI. — note Calibration 4: diesel is a *coincident* gauge, framed as association.
- **USDA ERS (analysis-grade, public domain):** Food Price Outlook (CPI since 2003, PPI since 2014) · **★ Meat Price Spreads — farm→wholesale→retail, monthly, back to 1970** (beef/pork/broilers/eggs/dairy). **This is the highest-value dataset to wire/cite first:** it's the only free, redistributable table that ties a commodity shock to the *operator-relevant wholesale* cost and the farm→wholesale→retail gap — i.e. the literal "wholesale isn't what your menu reflects" thesis. Pair it with `CUUR0000SEFV`.
- **USDA AMS:** Egg Markets Overview (`AMS_3725`, weekly PDF — parse needed). HPAI episode framing in ERS Charts of Note.

**Cite-but-don't-reprint (redistribution-LIMITED):** any FRED series tagged IMF / OECD / World Bank — e.g. `PSOYBUSDQ` (global soybeans). Use the link + direction only, never republish the values. (This is why Calibration 3/4 avoid IMF soy-oil series for any public surface.)

**NRA — mixed:** the *State of the Restaurant Industry* report is paywalled + proprietary (attributed quotes only, not bulk data); NRA's free public stats are re-presentations of BLS/BEA/Census — **cite the underlying gov source instead** (cleaner for the gate).

**`[VERIFY]` for this catalog:** exact APU/WPU commodity codes for chicken, ground beef, butter, cooking oils (pattern confirmed, individual ids not pulled); AMS_3725 archive depth for a full historical egg series.

## Immediate engine implications (what to act on)

Concrete, low-effort moves this research justifies — to fold in as we finish the engine:
1. **Reframe the freight explainer (#6) toward FEED-GRAIN, not diesel** — feed-grain is the one *leading* signal (10wk→30mo by species); diesel is coincident. Add corn/soybean (`WPS012202` / `WPU01830131`) as the explanatory "why," diesel as a secondary pressure gauge.
2. **Basket weights (#5 headline index):** weight proteins+oil ~55–65%, **cap eggs & produce**, beef gets a standing "structural" annotation. Freeze + version the weights.
3. **Spike-vs-structural flag:** implement on **breadth × persistence** (>+10% YoY, ≥2 quarters, no >⅓ retrace, ≥2 categories), magnitude only gating the alert; eggs as an EVENT flag.
4. **Re-price threshold = ≥3–5% plate-cost**, sold against the **~90-day foregone window** (the deadline hook) — this is the framing spine for the dish-level alert.
5. **Wire/cite USDA ERS Meat Price Spreads first** — the on-thesis historical backbone for both content and the wholesale-vs-delivered narrative.
