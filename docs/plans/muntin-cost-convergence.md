# Muntin Cost Convergence — The Frontier Stack

*Frontier ideation, 2026-06-18. The brief: pioneer the first **unified** cost-intelligence
stack for a one-person restaurant by fusing four data layers that have never been
honestly fused for an independent — **market** (Cost Index), **actual** (Invoice Decoder),
**flow** (usage), **outcome** (Ledger/Plate margin). This doc runs the 5-phase divergence
and lands on the single capability to build first. It is a **strategy note**, not a build
spec; every real-stack number carries a file path, and every projected number is flagged
**[illustrative]**. Companion to `muntin-insight-layer.md` (the published roadmap this
deliberately reaches **past**).*

> **Update 2026-06-18 — the flow layer shipped mid-ideation.** Inventory was merged to the
> Invoice Decoder `main` (PR #220 `muntin-inventory-design`, + P1/P3 commits): real counts,
> pars, periods, purchases, reconcile, reorder, and **Tier-2 theoretical-vs-actual variance**
> that recurses sub-recipes. The old plan assumed flow was scoped out and had to be *inferred*
> from invoice cadence. It is now a **real, optional** layer. This doc has been reframed around
> the resulting design law: **every layer is independently useful; inventory is included, never
> required; each capability degrades gracefully when a layer is absent.**

---

## Thesis

> **Muntin owns *the fair-price layer for independent restaurants*** — the only honest,
> private place that tells a one-person operator what they **should** pay (market), what
> they **do** pay (their invoices), and what to do about the gap (the action).

The structural moat is a conflict of interest the giants cannot escape: **US Foods cannot
tell you you're overpaying US Foods; Toast monetizes your payments; QuickBooks has no
wholesale market; MarginEdge owns your data and sells the swamp.** None of them can fuse
an honest public market price with *your* private invoices *without a reason to shade the
answer*. Muntin can — the CI gates fail the build on a lie (`scripts/check-all.mjs`), the
extractor has no LLM in the customer-data path (`scripts/no-llm-ci.sh`), and the data is
never pooled or sold. The product is not the number; it is the **trustable join**.

### The design law: modular, inventory-included-not-required

Power comes from *composition*, not from a monolith the operator must adopt whole. Each
layer earns its keep alone and multiplies in any combination:

- **Market alone** → the public Cost Index read.
- **Market × Actual** (no flow, no recipes) → the **Fair-Price Audit** — already enough to
  catch errors and overcharges the day an invoice is photographed.
- **+ Outcome** (recipes/Plate) → the dollar gap lands on a *plate*.
- **+ Flow** (inventory, when the operator keeps counts) → the gap becomes **true usage**:
  theoretical-vs-actual variance (shrink/waste/theft) and par-aware reorder timing.

The rule that makes this honest and uncopyable: **no capability *requires* the full stack;
each names its inputs and degrades gracefully.** When inventory is present, usage is
*measured* (real counts via `inventory-count-store.ts` / `inventory-variance.ts`); when it
is absent, usage is *inferred* from invoice reorder cadence — flagged as an estimate, never
dressed as a count. A giant sells you the monolith and the lock-in; muntin gives power at
every subset, so the operator who only ever photographs invoices still wins.

### What's already real (the four layers, on the stack today)

| Layer | Status | Real assets (cite these) |
|---|---|---|
| **Market** (Cost Index) | **Live** — 16 ingredients verified, weekly USDA/BLS/FRED/NOAA refresh | `data/cost-index.json`, `data/cost-index-history.json`; honesty rig: `data/cost-confidence-calibration.json` (**proven monotone** — higher labels verify more often), `data/cost-anomaly-log.json` (Hampel + Pettitt), `data/cost-pressure.json` (leading-indicator overlay, **preview**); forecast discipline **h=1 only** (`data/cost-forecast-backtest.json`) |
| **Actual** (Invoice Decoder) | **Spine shipping**, product layer ~8–12 wks to GA | Deterministic extraction (no LLM), canonical line-item schema (`packages/schema/src/invoice.ts`: `description/quantity/unit_price/pack_size/sku/weight`); `@muntin/cost-alerts` already holds `cost-conformal.ts`, `match-line.ts` (line→ingredient), `unit-normalize.ts`, `cost-anomaly.ts`; `services/extract/price_anomaly.py`. **`services/extract/verdict_compute.py` is built but DEAD — no producer writes verdicts.** |
| **Flow** (usage) | **Shipped on Decoder `main`** (PR #220 + P1/P3) — **optional, not required** | Real inventory module: migrations `0046–0050` + `inventory_p1_bundle.sql` (stations/counts/period-snapshots/pars/coverage); stores `inventory-{count,pars,period,purchases,reconcile,reorder,stations,theoretical,variance}.ts` + `routes/inventory.ts`; **mobile offline count queue** (`apps/mobile/src/inventory-queue.ts`); **Tier-2 theoretical-vs-actual variance** recursing sub-recipes (`inventory-variance.ts`, `inventory-theoretical-store.ts`). Counts in **cases/each**; POS auto-fills net sales. **Design law: included, never required** — usage is *measured* when counts exist, *inferred* from reorder cadence (flagged as estimate) when they don't. |
| **Outcome** (Ledger/Plate) | Plate-margin math live; Ledger GA 2026-11-13 | `tools/plate-cost/plate-cost.js`, `tools/_shared/plate-advice.js`, `data/ingredient-yields.json` (AP→EP), `data/ledger-cta.json`; the JOIN philosophy + the insight ladder already specced in `muntin-insight-layer.md` |

**Honesty discipline inherited from `muntin-insight-layer.md` (binding on everything below):**
*you may compare a % across bases; you may never compare a **level** across bases.*
Wholesale-reference and delivered are different baskets (pack, grade, freight).
**Spread-of-changes = the moat. Spread-of-levels = the fatal lie.** This single rule kills
or reshapes several "obvious" ideas below — that it does is the whole point.

**Frontier bar reminder:** `muntin-insight-layer.md` already claims market×actual (the
"market-vs-vendor spread"), the basket index, and the dish-level alert. Restating those is
not frontier. The ideas that earn their place here either (a) **close a loop** the roadmap
treats as one-directional, (b) **compose the now-real flow layer modularly** — measured
usage when counts exist, inferred when they don't — or (c) **discover a publishable truth**
muntin could be first to own.

---

## Phase 1 — Diverge (27, unfiltered)

Lenses: **DD** distant-domain transfer · **INV** inversion · **IC** impossible-constraint ·
**OE** outsider-eyes. Fusion: **m**arket · **a**ctual · **f**low · **o**utcome.
🎲 = low-confidence (≤30%) bet, kept honestly.

| # | Idea (one line) | Lens | Fusion |
|---|---|---|---|
| 1 | **Fair-Price Audit** — the Index as a *prior* that auto-checks every photographed invoice line; off-band lines flagged the instant the photo lands | DD (Kalman) | m×a |
| 2 | …and the **return path**: operator-verified invoice prices feed back to sharpen/widen the Index's bands and catch its blind spots | DD (Kalman) | a→m |
| 3 | **Your-Basket Cost Index** — your menu's own weighted cost-trend line, live, vs the market basket | DD (Bloomberg) | m×o |
| 4 | **Independent-Restaurant Basket Index** — first honest food-inflation index built from *real paid indie invoices*, federated/k-anon | DD (Our-World-in-Data) | a (fed) |
| 5 | **Vendor fairness score** — a "cost bureau" rating of how far a vendor's prices sit from market across anonymized operators 🎲 | DD (credit bureau) | a×m (fed) |
| 6 | **Your-basis tracker** — your delivered price vs the wholesale reference, *as a ratio-of-changes* (naive level-minus-level is the fatal lie — see red-team) | OE (commodities trader) | a×m |
| 7 | **Basket weather forecast** — the pressure overlay aimed at *your* basket weights: "+pressure over 6–9 wks, 40% of it is chicken" | DD (weather service) | m×o |
| 8 | **Buy-now-or-wait** — storables only: seasonal low + easing pressure + your reorder cadence → "buy 3 weeks now, save ~$X" | DD (options desk) | m×f |
| 9 | **The one weekly action memo** — exactly one alert/week: the single highest-dollar move (overpay, buy-now, or margin breach), ranked | IC (one alert) | all |
| 10 | **Shrinkflation/pack-downgrade detector** — same SKU, smaller pack, same price → effective hike the eye misses | OE (forensic accountant) | a×m |
| 11 | **Duplicate/contract-creep catcher** — wire the dead `verdict_compute.py`: double-billed lines, spot price where a contract price was promised | OE (forensic accountant) | a |
| 12 | **Prime-cost breach odds** — "given your basket + market forecast, P(prime cost > 65% next quarter) = …" 🎲 | OE (actuary) | m×o |
| 13 | **Menu reroute** — when a price moves, recommend featuring the dish whose margin just rose, resting the one that cratered | DD (GPS reroute) | m×a×o |
| 14 | **Usage model, modular** — *measured* from inventory counts when present (`inventory-variance.ts`), *inferred* from invoice cadence when absent (flagged estimate) | IC (zero entry) + modular | a×f |
| 15 | **Immune-system watch** — silent until a defined "injury" (off-band line, regime break) fires; responds before month-end damage | DD (immune system) | all |
| 16 | **Shadow VP of purchasing** — the weekly memo a 500-unit chain's buyer would write, for one person | DD (chain procurement) | all |
| 17 | **Negotiation brief** — one page before a vendor call: your fair price, your switching value, your leverage items | OE (chain procurement) | a×m |
| 18 | **"You CAN beat your distributor" proof** — quantify, per line, where switching/renegotiating actually saves $ | INV ("can't beat the distributor") | a×m |
| 19 | **Benchmark without surrender** — peer comparison that never stores identifiable data (k-anon/federated sketches) | INV ("benchmarking needs your data") | a (fed) |
| 20 | **Small-op forecasting** — not a price (we can't), but an honest *direction* on the operator's own basket (h=1) | INV ("small restaurants can't forecast") | m×o |
| 21 | **Pay for the action, not the data** — package every insight as a default move (re-price/switch/buy), data as wrapper | INV ("operators won't pay for data") | all |
| 22 | **No-dashboard delivery** — the operator never opens an app; the intelligence arrives (email/audio) | IC (no dashboard) | all |
| 23 | **Audio cost briefing** — the weekly read spoken aloud via the existing audio pipeline, for the cook who won't open a sheet 🎲 | OE (line cook) | all |
| 24 | **Freight lead-lag wedge** — separate the diesel/freight component of a delivered hike from the commodity component 🎲 | OE (commodities trader) | m×a |
| 25 | **Cross-vendor split-the-order** — given two vendors' real lines + market, the cheapest legal basket split this week | OE (chain procurement) | a×m |
| 26 | **Theoretical-vs-actual variance → shrink/waste/theft** — recipe-implied depletion vs counted usage; the unexplained gap is loss, named in dollars *(now real: `inventory-variance.ts`, sub-recipe recursion)* | OE (forensic accountant) | a×f×o |
| 27 | **Par-aware autonomous reorder** — pars + on-hand (`inventory-pars-store.ts`, `inventory-reorder.ts`) × market pressure → the order qty & timing that front-runs the next hike | DD (chain procurement / options) | m×f |

---

## Phase 2 — Amplify the strongest (the closed loops)

The capabilities that compound across layers — each made stronger by every other layer,
not just co-located with them. Each names its inputs and runs at any subset (the design law).

### A. Fair-Price Audit + the return loop *(ideas 1, 2, 10, 11)* — **the core**
The Cost Index becomes a **price prior**. The instant an invoice is photographed and
`match-line.ts` maps a line to a canonical ingredient, the conformal band from
`cost-conformal.ts` scores it: *in-band* (quiet), *off-band-high* (overcharge or pack
flip), or *implausible* (OCR error — a `$385/lb` romaine line is rejected because the
market band is `$10–15/carton`). This is **sensor fusion**: the market sensor corrects the
OCR sensor, and the OCR sensor — once the operator confirms a real delivered price — feeds
the **return path**, telling the Index where its bands are too tight or its coverage is
blind. Every layer makes the others smarter:
- market → catches Decoder errors **and** real overcharges (lights up the dead `verdict_compute.py` with a prior it never had);
- actual → verified real-world prices sharpen Index bands and surface ingredients the public sources miss;
- flow → tells the audit *how much* an off-band line actually cost (a +$6/case hike on something you buy weekly ≠ monthly) — *measured* from counts when present, *inferred* from cadence when not;
- outcome → routes the dollar figure into plate margin.

This is the loop the roadmap draws as one-way (public→operator); here the operator's
verified data flows **back** into the public engine. **It runs at the m×a subset alone** —
no recipes, no inventory required — and simply gets sharper as the other layers connect.

### B. Your-Basket Index → Independent-Restaurant Basket Index *(ideas 3, 4)*
Single-operator now: weight `cost-index-history.json` % moves by the operator's own menu
mix → *their* live food-inflation line. Federated later: the first honest food-cost index
built from **real paid invoices**, not USDA wholesale or BLS CPI — privacy-preserving
aggregate. The loop: more operators → denser basket → a better public prior for idea A →
better audits → more verified invoices → a better index. **Data-as-moat.**

### C. Your-basis / vendor markup *(ideas 5, 6, 17, 18)*
Track the **delivered-to-wholesale relationship over time** per ingredient per vendor.
Single-tenant now (legal-safe, your own data); federated vendor-fairness later
(counsel-gated). The negotiation superpower: walk in knowing your fair price and switching
value. (Red-team reshapes the math — see C below.)

### D. Basket pressure + buy-now-or-wait *(ideas 7, 8, 20, 24, 27)*
The `cost-pressure.json` overlay aimed at the operator's basket weights → a buy-now-or-wait
call **for storables only**, gated to the one horizon the backtest trusts (h=1). Modular by
sizing: with inventory present it uses **real pars and on-hand** (`inventory-pars-store.ts`,
`inventory-reorder.ts`) for a true order quantity; without it, it falls back to inferred
reorder cadence and speaks in case-multiples, never a false count.

### E. Theoretical-vs-actual variance *(idea 26 — newly unlocked by the inventory merge)*
The fusion the old plan parked years out is now real. Recipe-implied depletion (Plate BOM ×
POS sales-mix) vs counted usage (`inventory-variance.ts`, sub-recipe recursion) → the
**unexplained gap is loss** — over-portioning, waste, or theft — named in dollars and
*priced at the live market*, so a variance that's really a price hike isn't blamed on the
line cook. This is the deepest four-layer fusion (market × actual × flow × outcome) and the
one no free tool can touch. Strictly opt-in: it only speaks when the operator keeps counts.

### F. The one weekly action memo *(ideas 9, 15, 16, 21, 22)*
The delivery mechanism that makes A–E *felt*. One email/week, one ranked action, dollars
attached, default move pre-written. Intelligence comes to them; no dashboard required.
This is the packaging layer the whole stack ships *through* — and it ranks across whatever
subset of layers a given operator has connected.

---

## Phase 3 — Red-team

**A. Fair-Price Audit.** *Built already?* MarginEdge/xtraCHEF alert on price changes vs
*your own history* — but they have **no independent market band** to say whether your
history itself is high, and a conflict if they broker vendor relationships. Toast/QBO have
no wholesale data. US Foods will not tell you you overpaid US Foods. *Mislead risk?* Only
if a band is wrong — mitigated because the calibration is **proven monotone**
(`cost-confidence-calibration.json`) and low-confidence ingredients flag-don't-fabricate.
**Survives cleanest. Ships this quarter on single-tenant data — no federation, no
antitrust.**

**B. Basket Index.** *Built?* No honest indie-restaurant *paid-price* index exists.
*Mislead risk?* A thin federated N lies — gate the public version on k-anon (k≥10 per the
T3 discipline in `muntin-insight-layer.md`). The **single-operator** version ships now and
is honest; the federated public index is a **12-month** play. Survives, split by horizon.

**C. Your-basis / vendor markup.** **This is where the honesty rule bites.** Naive basis =
`delivered_level − wholesale_level` is exactly the **fatal lie** the insight-layer canon
forbids: different baskets (pack, grade, freight), so the subtraction invents a number.
The **honest** version is a *ratio-of-changes* (does your delivered price move *more* than
the market over the same window?) or a unit-normalized basis with the **freight + pack
wedge declared as a known adder** (idea 24), never buried. The federated cross-operator
form is **antitrust-sensitive** → counsel-gated, opt-in default-OFF, k≥10 (already the
posture for peer percentile, `muntin-insight-layer.md` T3). Survives **reshaped and
gated** — and the fact that the honest version is hard is itself the moat.

**D. Buy-now-or-wait.** *Mislead risk is real and expensive:* tell someone to over-buy a
perishable and you've cost them money and trust. Narrowed hard to **storables only** and
**h=1 only** (the backtest shows h≥2 falls below baseline, `cost-forecast-backtest.json`).
Survives, narrowed.

**E. Theoretical-vs-actual variance.** *Built already?* MarginEdge/R365 do this — it's the
heart of their "swamp." So why is muntin's not a me-too? Two reasons they can't match
honestly: (1) muntin prices the variance at an **independent market band**, so it can
separate *"you used more"* from *"you paid more,"* which a vendor-aligned or
your-history-only system structurally cannot; (2) it's **modular and opt-in** — it never
forces the daily-count burden that defines the category, and it degrades to inferred usage.
*Mislead risk:* a wrong recipe yield or a missed count makes the gap lie — gate it behind a
**verified BOM** and label low-count periods "insufficient counts." Survives as the deepest
fusion, explicitly **opt-in, post-MVP** (needs trustworthy recipes + the operator's counts).

**F. Weekly memo.** Not a capability — the delivery surface. Survives as packaging; the
only risk is crying wolf, solved by "exactly one, highest-dollar, or stay silent."

**Killed / parked:** #12 prime-cost-breach odds (cosmetic precision on a number that
depends on too many unmodeled inputs — revisit once Plate has verified BOMs); #5 standalone
vendor *score* (a single grade invites a defamation/accuracy fight a one-person company
shouldn't pick — keep it as private per-operator basis, idea 6, not a public score); #23
audio briefing (nice, not load-bearing — fold into E later).

---

## Phase 4 — Truths + Power (survivors)

Each survivor stated as **(T)** a falsifiable truth muntin could discover & publish first,
**(P)** the one-sentence operator superpower, and the **cheapest real-data test this week**.
All quantities below are **[illustrative]** until the test runs.

**A — Fair-Price Audit.**
- **(T)** "**X%** of independent-restaurant invoice lines sit outside the wholesale market
  band; of those, **Y%** are OCR/extraction errors and **Z%** are genuine off-market
  charges." *(No one has published this — it needs honest market bands joined to real
  invoices.)*
- **(P)** *"Every invoice is audited against the live market the instant you photograph it
  — errors caught, overcharges named, before the month closes."*
- **Test:** run `data/cost-index.json` bands against the Decoder fixture
  (`packages/schema/fixtures/invoice.example.json`) via `match-line.ts` + `cost-conformal.ts`;
  count lines in-band / off-band / implausible. (Fixture is a Sysco invoice with a
  romaine line — a clean first probe.)

**B — Basket Index.**
- **(T)** "Independent restaurants' true *paid* food inflation ran **+A%** over the window
  vs USDA wholesale **+B%**" — the gap between what indies pay and what the wholesale
  proxy implies.
- **(P)** *"Your own menu's live inflation rate, sourced not guessed — the number you take
  to a price-increase conversation."*
- **Test:** weight `data/cost-index-history.json` % moves by a sample recipe's line items
  (canonical IDs) → a single basket trend line; eyeball vs the raw index.

**C — Your-basis / vendor markup.**
- **(T)** "Across same-unit, same-grade lines, vendor delivered prices move **+C points**
  more than the wholesale reference per quarter" — the honest spread-of-changes, freight
  wedge declared.
- **(P)** *"Walk into a vendor negotiation knowing your true fair price and exactly what
  switching would save — per line."*
- **Test:** on the fixture, compute the delivered-vs-wholesale **ratio** per line (not the
  difference), unit-normalized via `unit-normalize.ts`; confirm the level-subtraction
  version diverges (demonstrating *why* the honest method matters).

**D — Buy-now-or-wait.**
- **(T)** "For storable category G, buying at the seasonal trough vs the rolling mean saves
  **+D%**, and the pressure overlay calls the trough direction at h=1 above baseline."
- **(P)** *"One honest nudge a season — buy the cheese now, wait on the oil — sized to what
  you actually use."*
- **Test:** cross `data/cost-pressure.json` (easing/firming) with `data/seasonality.json`
  troughs for butter/cheddar; check against `cost-forecast-backtest.json` h=1 skill.

**E — Theoretical-vs-actual variance.**
- **(T)** "In a typical independent kitchen, **F%** of food-cost is unexplained variance
  (waste/over-portion/theft), and **G points** of what looks like variance is actually
  market price movement — separable only with an independent market band." [illustrative]
- **(P)** *"See, in dollars, the gap between what your recipes should have used and what
  your counts say you used — with price hikes peeled off so the loss isn't pinned on the
  wrong cause."*
- **Test:** on the Decoder fixture + a sample recipe, run `inventory-variance.ts`'s
  theoretical depletion against a mock count; reprice the gap with `cost-index.json` bands
  and show the price-vs-usage split.

**F — Weekly action memo.**
- **(T)** "The single highest-dollar action per operator per week recovers a median of
  **\$E/week**" — the realized value of *one* honest alert.
- **(P)** *"One email. One move. The dollars already counted."*
- **Test:** rank the outputs of A/C/E on the fixture by dollar impact × cadence;
  confirm a single defensible #1 emerges.

---

## Phase 5 — Rank & verdict

Scored qualitatively on **Operator-power × Uncopyability × Truth-discovery × Buildability**
(H/M/L; uncopyability = depends on fused *honest + private* data a giant can't assemble
without conflict).

| Rank | Idea | Power | Uncopyable | Truth | Build | Note |
|---|---|---|---|---|---|---|
| 1 | **A — Fair-Price Audit (+ return loop)** | H | H | H | **H** | ships this quarter at the m×a subset; lights up dead code |
| 2 | **F — Weekly action memo** | H | M | M | H | the surface A–E ship through; ranks across any connected subset |
| 3 | **C — Your-basis (honest, single-tenant)** | H | H | M | M | reshaped by the honesty rule; federated form gated |
| 4 | **E — Theoretical-vs-actual variance** | H | H | H | M | deepest 4-layer fusion, **now real**; opt-in, needs verified BOM + counts |
| 5 | **B — Your-Basket Index** | M | H | H | M | single-op now; federated index is the 12-mo PR asset |
| 6 | **D — Buy-now-or-wait (storables, h=1)** | M | H | M | M | real mislead risk → narrowed; uses real pars when present |
| 7 | **#10 Shrinkflation/pack-downgrade** | H | M | M | H | a clean A sub-feature with its own felt "gotcha" |

### Build FIRST → **A, the Fair-Price Audit (market-prior invoice auto-audit).**
Why it wins on every axis — and why it stays first even now that flow has shipped:
- **Buildable now on real data** — `cost-index.json` bands + `match-line.ts` +
  `cost-conformal.ts` + a real fixture invoice already exist; the test is a script, not a
  product.
- **Lowest-floor in the modular stack** — it runs at the **market × actual** subset alone:
  no recipes, no inventory, no counts. It's the capability the *most* operators can use on
  day one, and every other layer (Plate, inventory variance) only sharpens it. Variance (E)
  is more powerful but gated behind a verified BOM **and** the operator keeping counts — a
  far higher adoption floor, so it follows rather than leads.
- **Felt power this quarter** — single-tenant, so **no federation, no antitrust gate**; the
  operator gets value the day they photograph one invoice.
- **Deeply uncopyable** — every incumbent lacks either the honest market band, the private
  invoice, or the freedom from conflict; muntin has all three.
- **Leverage, not greenfield** — it gives `verdict_compute.py` (built, currently dead) the
  market prior it was missing, and it closes the return loop the roadmap leaves open.
- **Discovers a publishable truth** (Phase 4-A) that seeds the data-moat for B, C, and E.

### Arc
- **Discoverable now (this quarter):** A (Fair-Price Audit) + single-operator basket index
  + single-tenant basis + the weekly memo (F). All on the operator's own data → ship-safe,
  no counsel gate, no inventory required.
- **12-month:** **theoretical-vs-actual variance (E)** for the operators who keep counts
  (opt-in, needs verified BOM + the now-shipped inventory module) and **par-aware reorder
  (D/27)**; *plus* the federated, k-anon **Independent-Restaurant Basket Index** and
  **vendor-markup benchmarks** (opt-in default-OFF, k≥10, antitrust counsel per T3) — the
  *"Our-World-in-Data of restaurant costs"* publishable assets.
- **Moonshot:** the **autonomous procurement co-pilot** — a closed loop across
  market × flow × menu that proposes the order before you feel the hike and reroutes the
  menu when margins move: the 500-unit chain's purchasing department shrunk to one person,
  still honest, still private, still composable at any subset.

### Category thesis (one sentence)
**Muntin becomes *the fair-price layer for independent restaurants*** — the authority on
what an indie *should* pay, fused privately with what they *do* pay, and the action that
closes the gap.

### Confidence flags (the honest 30% bets)
- **Federated B & C** depend on adoption N **and** antitrust counsel — real, but not
  this-quarter, and worthless below k-anon thresholds. 🎲
- **D (buy-now-or-wait)** depends on forecast skill that today only clears **h=1**; widen
  only if the backtest earns it. 🎲
- **E (variance)** is real in plumbing but its *honesty* rides on a **verified BOM** and the
  operator actually keeping counts; a wrong yield or a skipped count turns the loss number
  into a fabrication. Ship it opt-in, behind a recipe-trust gate, never on by default. 🎲
- **The return loop in A** (verified invoices sharpening the public Index) must never let
  one operator's private price leak into a public number — it sharpens *bands and coverage
  priors*, never republishes a delivered level. Privacy review required before it ships.
- **Modularity is a promise, not a default to assume:** each capability must *detect* which
  layers a given operator has connected and state its inputs — never silently infer a count
  where none exists, never present an estimate as measured.
