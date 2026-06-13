# Cost-Index Value Strategy

> The synthesis of a multi-workstream research pass (UB methodology, source
> expansion, primary/partnership data, alt-data legality, operator-outcome
> design, confidence/trust communication) into one strategy: how the cost-index
> becomes a product worth paying for — deeper data, honest signals, and the one
> tool that converts a market move into an operator's decision. Internal
> planning doc; not web-routable. Compiled 2026-06-13.

## 0. The thesis in one line

**Don't out-quote Urner Barry — out-explain it, and arm the buyer.** The index's
value (and its moat) is transparency + actionability on public, fact-checked
data, delivered as the one thing no public feed and no incumbent gives an
independent operator: *what this market move means for **your** plate, and
whether **you're** overpaying.*

## 1. The strategic frame

- UB is an **assessed** benchmark: reporters solicit prices all day; the quote
  becomes the number sellers peg contracts to. That's its dominance **and** its
  legal exposure — UB is a named defendant in a 2025 egg price-fixing class
  action; the dead index in the broiler case (Georgia Dock, unverified
  contributors) was discontinued in 2016. **Verification is the moat; opacity is
  fatal.**
- We are the structural inverse: **mandatory, transaction-verified federal data**
  (USDA LMR exists because assessed benchmarks can be gamed) + public citation +
  an explicit account of what we *don't* have. That is a *trust* play UB cannot
  make.
- Free public data is **near-UB-grade for beef/pork/dairy**, with an honest
  ceiling for eggs/poultry granularity and daily seafood. We **label the limit**
  (the `measured`/`derived`/`absent` tier — already shipped) instead of faking it.

## 2. The convergent recommendation: the buyer-side basis + plate-cost tool

Every workstream points at the same build. An operator-facing surface where they
enter (or connect) their invoice and see:

1. **Yield-adjusted true plate cost** — `EP cost = AP price ÷ yield`. The #1
   outcome lever: a 10% broccoli move is a ~21% plate-cost move at 47% yield.
   Neither yield nor the operator's basis is in any public index. The
   ingredient-yield library already exists — this is a join, not new data.
2. **Basis / "are you overpaying?"** — `% over/under = (your price − wholesale
   benchmark) ÷ benchmark`. Separates a local overcharge from a market-wide move.
3. **Peer benchmark (crowdsourced)** — once operators contribute invoices, "vs.
   peers" — the data flywheel.

This single tool is simultaneously: the **highest operator value**, the
**antitrust-clean** version of UB's "solicit all day," the **crowdsource
flywheel**, and the **wedge incumbents leave open** (BlueCart/MarginEdge/Toast
benchmark menu/profitability, *not* line-item distributor price vs. peers).

## 3. The antitrust guardrail (binding — engineer around it)

UB/Agri Stats are in court because **sellers** feed and read a **fresh, granular**
benchmark that pegs contracts. Stay firmly on the pro-competitive side:

- **Buyer-paid prices only.** Never republish seller offers in seller-readable,
  identifiable, fresh form.
- **Aggregate hard:** publish a cell only with **≥5 sources, none >25%**, at
  range/quartile granularity — never firm-identifiable. (Exceed the *withdrawn*
  1996 safe harbor on purpose.)
- **Lag deliberately** (weekly+). Lagged + aggregated historical data is the
  weakest coordination signal — and the *Broiler* court flagged that lack of
  forward pricing defeats conspiracy inferences.
- **Output 100% public**, symmetric to all (Agri Stats was forced to open data
  to buyers; start there). Terms-of-use: **"not a contract reference price."**
- **Engineering blueprint:** DAT RateView's minimum-N suppression — show a number
  only at **≥3 contributors + ≥7 records**, widen geography/time when thin, strip
  outliers, show the N.
- **One antitrust consult** before accepting *any* seller submissions; the
  buyer-side version is the safe default.

## 4. Data-source roadmap

### Live now (6 families)
USDA AMS Market News, USDA LMR/Datamart, BLS PPI, FRED, EIA, NOAA Fisheries.

### Add next — free, public-domain, redistributable
| Source | Adds | Access |
|---|---|---|
| **NDPSR** (dairy) | Mandatory weekly cheddar/butter/NFDM/whey — transaction-verified | MARS API |
| **NASS QuickStats** | Production, stocks, cold storage, farm prices — driver layer | free key, JSON |
| **AMS egg/poultry suite** | Honest free egg/poultry substitute (`AMS_3725`, shell-egg index `2843`, weekly broiler/turkey `3646`/`3647`) | MARS API |
| **LMR pork-trim / lamb** | Upgrades ground-pork + lamb from `absent`→`measured` | MARS `/reports` slug |
| **BLS Average Price (AP)** | Retail *price levels* for ~70–94 items, national + 4 regions — retail layer | BLS/FRED API |
| **AMS retail feature + terminal (13 cities) + auction + cold storage** | Retail-direction, regional granularity, predictive stocks | MARS API |
| **USDA APHIS HPAI detections** | The dominant egg/poultry pressure signal (4–8wk lead) | free feed |

### Deliberately excluded (legal)
- **CME futures** — can't republish (licensed; even derived index needs DDLA).
- **Restaurant Depot / Costco / Sam's** — login-gated → CFAA risk.
- **Kroger / Walmart APIs** — real prices but ToS forbids index-building.
- **Circana / NielsenIQ** — licensed, costly, non-redistributable.
- **WebstaurantStore** — the *one* openly-published foodservice price source;
  logged-out scraping only, never create an account (contract/ToS is the residual
  risk after *hiQ*/*Bright Data*; prices themselves are facts, not copyrightable).

### Primary data (the UB-style play, done clean)
"Submit-to-see" buyer-paid form + light gamification (GasBuddy/Numbeo model);
recruit via **university Extension first** (highest reply rate, warm-intros food
hubs); offer citation/co-branding, **never cash** (crowds out the volunteer norm).

## 5. Actionability design spec (what actually changes a decision)

An independent operator acts only on a signal that is:
1. **Item-specific & plate-level** ("your ribeye dish is now 38% food cost"),
   not "beef is up nationally."
2. **Persistent ≥2 order cycles** (transient spikes are absorbed/watched).
3. **In the weekly ordering workflow** (where substitution/portion decisions
   execute), not a quarterly artifact.
4. For substitutions: **names an available, familiar cheaper alternative**
   (operators swapped to chicken in 2025 *because it was available*).

Anchor thresholds to operator reality: **35% food-cost** per item triggers
review; **>10%** key-ingredient move or **+3pts** over target for 2 months
triggers repricing. Independents have **no forward contracting** — their lever is
substitution, portion, repricing, and ≤4-week opportunistic buys. Design for that.

## 6. Confidence & trust presentation (when pressure goes live)

- **Pair every verbal label with a numeric range** (NIC anchored tiers; "likely"
  alone means 55–90% to different readers — useless).
- **Show the track record:** rolling hit-rate per tier + a Brier score vs. the
  0.25 baseline; never show a confidence not backed by history. Our pressure
  engine already records hit-rate and holds calls until proven (≥12 calls,
  ≥60%) — this is the *display* contract.
- **Ranges, not point forecasts** (van der Bles: numeric ranges don't erode
  trust; vague text does). Anchor to a **base rate / reference class** before any
  directional call. Let the operator flag/adjust a call (reduces algorithm
  aversion).

## 7. The honest ceiling (say it plainly — it's the trust asset)

- Most ingredients top out at **`medium`** confidence on free data (one wholesale
  level type; `high` needs two independent dollar levels that agree, which free
  data rarely offers and CME blocks). `medium`, sourced and triangulated, is
  strong — and honest.
- Freshness ceiling is **daily** (LMR cutout, terminal produce) to **weekly**
  (NDPSR, poultry/egg) — *not* intraday. "As current as the latest USDA publish"
  is the freshest a free, fully-republishable index can legally be.

## 8. Phased execution roadmap

- **Phase 0 (done today):** `measured/derived/absent` tier + gate; 100%
  triangulation; confidence cap; 83 per-ingredient pressure rules.
- **Phase 1 — activate pressure (next):** go live on the pressure layer
  (`EIA_KEY`+`NASS_KEY` → `calibrate` → `live`) so the 83 rules start earning a
  track record; wire `calibrate` weight suggestions back. **The step that makes
  today's work visible.**
- **Phase 2 — depth:** NDPSR dairy; upgrade ground-pork/lamb to `measured`;
  multi-year **seasonality normals** (median + percentile bands); the D1 visual
  badge once the refresh populates real tiers.
- **Phase 3 — actionability:** **yield-adjusted plate cost** (cost-index ×
  ingredient-yield); driver-attribution panel; HPAI egg signal.
- **Phase 4 — the buyer-side tool:** invoice-in → plate cost + basis ("are you
  overpaying?"); then the crowdsourced peer benchmark under the §3 guardrails
  (antitrust consult before any seller-side data).

## 9. Caveats / verification

Research relied on search-corroboration where primary pages 403'd; re-verify exact
API limits, the egg "spot ~11% / contract >95%" and "UB runs 15–20% above
realized" figures (plaintiff/single-source), CME/Webstaurant/Kroger ToS clauses,
and any legal threshold before publishing as web prose. Antitrust posture here is
research, not legal advice — get counsel before any seller-side solicitation.
