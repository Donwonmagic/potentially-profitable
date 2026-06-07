# Muntin Cost Index — The Insight Layer

*8-specialist synthesis (operator-domain · signal-architecture · behavioral-econ · UX · trust/honesty · privacy/antitrust · growth · measurement). 2026-06-04. The plan for turning a correct wholesale-trend engine into a transcendent, empowering product — executed honestly.*

## The thesis: the number is not the product; the JOIN is

A wholesale price alone is *reference* — useful, but not transcendent. The engine becomes empowering the moment its public **trend** is joined to the operator's **own invoices and menu**:

> *"The market for chicken moved **+6%** this quarter. Your delivered price moved **+11%.** Your vendor took 5 points more than the market explains."*

That is an insight an operator **structurally cannot get anywhere else** — they see their invoices (one vendor, no market frame) and the news (a market, no delivered frame). Only the join produces it. It names money they can claw back *this week*, needs **zero new data**, and is **legally safe** (single-tenant, their own data). Six of eight specialists named this — the **market-vs-vendor spread** — independently. It is the core.

The discipline that makes it honest: **you may compare a % across bases; you may never compare a level across bases.** Rate-of-change is basis-invariant; a wholesale level and a delivered level are different baskets and must never be subtracted. *Spread-of-changes = the moat. Spread-of-levels = the fatal lie.*

## The insight ladder (ranked, with build-gate status)

**Tier 1 — public data + the operator's OWN invoices/menu. No counsel gate. Ship-safe now.**
1. **Market-vs-Vendor Spread** *(the headline)* — public `assess().trend.pct` vs the operator's per-vendor delivered-price % (median-per-period via `cross-vendor.js` + `windowChange`). Both %, never levels. **Screen 4 confounders before it speaks:** pack-size flip (compare on base unit), grade/spec switch (same canonical SKU), promo (period-median + robust-Z), window mismatch (same calendar window). **Gate:** show the spread only when public `confidence ≥ medium` AND `agreement ≥ 0.66` AND ≥3 same-unit vendor periods; else show each side alone, no spread.
2. **Own-invoice anomaly vs market** — `cost-trend.js` `detectDrift` gated by `assess().trend`: a category that rose *while the market was flat* = a vendor/leverage anomaly worth a call; rose *with the market* = expected. Advisory copy, never "your vendor is gouging."
3. **Spike-vs-seasonal flag** — from the per-ingredient weekly history: is the current move inside the trailing same-week-of-year band (revert-able) or a level break? **Needs ≥2yr history to claim seasonality at all** — until then label "insufficient history, treating as structural" (never tell someone to hold through a real hike). Feeds Plate's hold/re-price fork.
4. **Dish-level $/week alert** *(Plate join)* — "Caesar quietly lost $47/week — re-price / re-portion / hold." **Needs a verified BOM**; a wrong recipe yield discredits the whole product, so this waits on trustworthy recipe data.

**Tier 1.5 — zero new data, pure composition. Max PR/SEO.**
5. **"Muntin Restaurant Basket" headline index** — weighted-**median** of per-ingredient % moves, **FROZEN published weights** (versioned; re-weighting to whatever's dense silently lies). Claims *a basis-agnostic rate-of-change for a declared basket* — never a national level, never "what restaurants pay." The recurring quarterly PR asset.

**Tier 2 — one new public source. Explanatory polish.**
6. **Freight lead-lag (EIA diesel / FRED trucking PPI)** — "produce tends to follow diesel by ~3 weeks." Reframes the index as *explainable* ("why everything's up"). Labeled **association with a stated lag, never causation**.

**Tier 3 — COUNSEL-GATED. Inert until cleared.**
7. **Peer percentile** (k-anon delivered pool) — "your delivered price is at the 78th percentile of peers." The *only* honest delivered-**level** comparison that can exist. Requires antitrust counsel + DPA amendment + opt-in consent. **Capture the opt-in consent NOW** (default-off) — consent can't be backfilled, so the corpus can't accrue later if collection isn't live now.

## Presentation (UX) — one component, honest by construction

**The Read Strip** (replaces today's 3-line "Market read" text panel): a horizontal band track (p10→p90 with IQR fill + median tick) + trend caret with signed % + confidence chip (icon+word). **The hero number is the median *inside* the band** — so a single level can never masquerade as "the price." The market-vs-vendor two-line comparison renders *under* the strip on the operator dashboard, with the operator's delivered price as a **diamond on the same track** (over/under market becomes spatial). The dish $/week alert is a separate **event card** (left rust rule, one headline, one driver line, one action). Seven honest states: fresh / stale / last-good / low-confidence (band widens organically) / directional-only (no hero number — caret only) / no-data (empty) / **healthy-no-action (calm, final, no CTA — lets them put the phone down)**. Color always paired with shape + word; freshness is *data-age* not fetch-age; no "live" spinners. Backed by a visually-hidden data table. EN/ES parity is label-swap only.

## Framing (behavioral) — empower, don't lecture

- **Resolve-in-one-breath:** every figure ships with its plain meaning + ONE action. *"Chicken's up — quietly costing ~$74/week. A 50¢ combo bump covers it. [see the invoice line]"* — never a naked "+8%."
- **Blame the price, not the owner** — the ingredient is the grammatical subject ("beef went up," never "your costs are high").
- **Loss to open, hope to close** — lead with the leak, end on the recoverable win; one loss-framed alert at a time.
- **One action as a default they can overrule** — "most operators would nudge 50¢ — your call," never "you should."
- **The calm green state is the trust-builder** — a quiet, final "nothing to do ✓" with no upsell proves we're not engagement-baiting.
- **"Cutting edge" only when true** — "the delivered read a 200-unit chain's analytics team gets, from your own invoices" — say it only once Ledger/Plate feed it, never on public wholesale data.

## Honesty rails (the trust spine) — enforce as gates, not conventions

The cardinal rail: **a wholesale/index number may never render, speak, or alert as the delivered price.** Make honesty a *felt feature* — every number taps to its receipt (`<details class="cite">`: source, basis, observation date, family-collapse). Enforce in `check-all` (extend `check-fabrications.mjs`):
1. **Basis-label lint** — any rendered/audio `$`-level must co-locate its basis word + unit; no string pairs "delivered/your cost/you pay" with a public-source provenance id.
2. **Single-source-range guard** — pin `levelPhrase`'s "single source" branch; `confidenceFor` can't return "high" with `nFamilies < 2`.
3. **Freshness-honesty** — a level-bearing point must carry its observation date; a `stale` obs is absent from level, present in trend.
4. **Banned causal/seasonal phrases** — "because of / caused by / this is seasonal" (without a revert-by date) added to the fabrication regex (audio speaks these in six languages).

## The legal line (privacy/antitrust)

**Safe to ship now (single-tenant or public-domain): insights 1–6.** Showing an operator their own data, or public-domain trends, crosses no competitor's data. **Only #7 (cross-operator pool) is counsel-gated** — it implicates antitrust price-signaling AND a purpose-change against Ledger's "we don't pool" promise. The procompetitive posture (historical/lagged · aggregated k≥10 ranges not points · buyer-side only · non-attributable) breaks the instant any flips (current/forward prices, point prices, seller-side audience, identifiable cells). **Do first:** capture opt-in default-OFF pooling consent at ingestion *now* (versioned, revocable) + amend privacy-policy/DPA before flipping it on. **Mandatory outside counsel** before any cross-operator launch: the exchange design, the policy/DPA language, the "we don't pool" supersession. Never sell any of it to distributors (sell-side = collusion infrastructure).

## Growth — the index as a compounding asset

Highest leverage: **the quarterly "Muntin Restaurant Basket" report** — one dated, citeable URL, fixed methodology page, refreshed each quarter. Press repeats the number ("independent food costs moved +X% this quarter"); AI engines cite the methodology page (clean Dataset/Article JSON-LD + llms.txt). Honest claim: prices "moved," never "cost restaurants." Then: per-ingredient SEO pages ("is my vendor price fair," "ingredient prices going up what to do"); the shareable "made with Muntin" cost card into owner FB groups + bookkeepers; the founder-operator story under it all. **Funnel rule:** fire the Ledger CTA only on an actionable/overpay signal, never on a healthy verdict (that trains distrust). Free answers the one-time question; paid sells *recurrence* + the delivered/dish join.

## Measurement — prove empowerment, not engagement

**North-Star: Insight-to-Action Rate (IAR)** — share of operators who, in a trailing 30 days, took an observable move a surfaced insight named (in-app re-price / re-portion / receipt-drill) **OR explicitly closed the loop as "checked, I'm fine."** Counting reassurance as success protects the calm-green state; false alarms *lower* IAR (dismissed-as-noise ≠ reassured). **Never** target opens/DAU/session-length (they'd corrupt the design toward anxiety-bait — guardrails, not goals). **Instrument first:** a first-party server-side event spine (re-price / re-portion / receipt-open / dismiss-with-reason), an activation timestamp (signup → first insight against *their* data, target <10 min), and a one-tap, rate-limited "did this change a decision?" micro-survey — the only honest way to learn the unobservable phone-call/printed-menu outcome.

## Back to the engine — what this unlocks, and the immediate path

The headline insight (#1) and the PR asset (#5) both run on the engine's **TREND**, which we already produce honestly. So finishing the engine *is* the unlock:
1. **Land the 6 live ingredients** — chicken-breast, whole-chicken verified; produce reliability now fixed (5 terminals, transient retry). Flip verified → vendor → render the Read Strip.
2. **Ship the Basket index (#5)** — pure composition over those ingredients; zero new data; the quarterly PR asset.
3. **Then the market-vs-vendor join (#1)** in Ledger — the transcendent core, using the engine trend + the operator's invoices.
Breadth (dairy/eggs/oils), the freight source (#6), and the LMR beef/pork wholesale come next; the counsel-gated pool (#7) accrues consent now, ships later.
