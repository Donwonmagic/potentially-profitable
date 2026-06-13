# Cost Index — Master Plan (confidence, expansion, distribution)

Synthesis of a multi-specialist panel (confidence-engine mechanics; free second-feed
sourcing for proteins/dairy/eggs, produce/fruit, seafood; paid-feed evaluation;
PPI de-correlation; USDA-FBG yield-gap sourcing; comprehensive ingredient universe;
distributor-binding) plus the earlier honesty red-team, UX, pressure, SEO/entity and
strategic-gap reviews. Each section ends with the **honest verdict** and a tag:
`KEYLESS-NOW` · `KEYED-FOUNDER` · `PAID` · `NEEDS-DATA` · `GATED-COUNSEL`.

Goal restated (founder): an honest, sourced, *current*, *actionable* wholesale-price +
yield index, large enough to tie items across distributors — with confidence pushed to
the maximum each ingredient can **honestly** earn.

---

## PART 0 — The dominant fact: it isn't live yet

All of this is on branch `claude/muntin-invoice-decoder-audit-d7upo`; `main` has no
`cost-index.json`, `cost-index-sources.json`, `ingredient-yields.json`, or
`pressure-rules.json`. **The product currently meets its goal on a branch no visitor can
reach, and the daily refresh cron fires on `main` (dataless, keyless) — so "frequently
refreshed" is false in production.** Nothing below matters until:

1. **Merge the branch to main + deploy.** `KEYLESS-NOW`. Highest-leverage single action.
2. **Set `FRED_KEY` / `BLS_KEY` / `AMS_KEY` (+ optional `EIA_KEY` / `LMR_KEY`) as repo
   secrets; confirm one green cron commit.** `KEYED-FOUNDER`. Turns the daily heartbeat on.

Everything else is downstream of these two.

---

## PART I — Confidence: how high can we honestly go?

### The engine's exact ceiling (decoded against the code)

Headline confidence = `min(levelCeil, trendCeil)` (`composite-price.js:228`).

- **levelCeil** is set by `level.nTypes` — the count of **independent dollar-level
  methodologies** (`basis !== 'index'`), grouped by the `type` field. The 8 AMS terminals
  all carry `type:"usda-ams"` → they collapse to **nTypes = 1** by construction
  (`fetch-cost-index-sources.mjs:187`). `nTypes>=2` → high-eligible; `==1` → **medium**;
  `==0` → low. Even with 2 types, `typeDispersion > 0.15` (robust CoV of the per-type
  medians) caps back to medium (`composite-price.js:218`).
- **trendCeil** needs `trend.nTypes>=2` AND `agreement>=0.66` AND `noise<=0.08` for high;
  it drops to medium/low on weaker agreement or noise (`>0.20` noise = low regardless).
- **A BLS/FRED/IMF index never lifts the level** — `compositeLevel` discards
  `basis:'index'` (`composite-price.js:60`). Indices only feed the trend.

**The universal cap:** every one of the 56 live points has exactly **one** independent
dollar-level type. That single fact — not noise, not dispersion (which is 0 everywhere
because there's never a second type to disperse against) — pins the entire index at
`medium`-or-below. **0 ingredients are high-eligible today.**

Current split (`cost-index-health.json`): **23 medium, 27 low, 6 directional, 0 high.**

### What honestly lifts confidence

**Free, no new feed (real corroboration, not inflation) — `KEYLESS-NOW` config + `KEYED-FOUNDER` refetch:**

1. **low → medium for the ~17 single-AMS produce** (bell-pepper, broccoli, cauliflower,
   spinach, asparagus, garlic, carrot, corn-on-the-cob, kale, basil, cilantro,
   button-mushroom, sweet-potato, avocado, lemon, lime, pineapple): they read `low` only
   because their **trend has one type** (`tt=1`). Add a BLS PPI trend leg → `tt=2` → medium.
2. **Give the four fruit (avocado, lemon, lime, pineapple) their missing trend leg** — they
   currently have NO `bls` leg at all (citrus parent `WPU0111`/fruit PPI).
3. **Tighten grade/pack on the jagged-noise produce** (romaine, tomato, jalapeno, iceberg —
   noise 0.21–0.36): narrowing to one grade cuts trend noise below the 0.20/0.08 caps.
4. **Repoint the backtest PROXY** (`calibrate-pressure.mjs`) for russet→`WPU01130603`,
   romaine→`WPU01130215`, tomato→`WPU01130217` off the shared `WPU0113` parent (child cells
   already exist) — removes parent/child self-correlation; individualizes the backtest.
5. **Fix the pork WPS/WPU mismatch** (sources.json `WPS022104` vs proxy `WPU022104`) and
   **promote chicken `WPU022203`** into the trend leg (de-shares poultry from turkey).
6. **Accumulate history** to clear the calibration completeness ceiling (≥8 weekly points).

> These lift `low`→`medium`, never to `high`. That is the honest free ceiling.

**The ONE free path to `high` — `KEYLESS-NOW` adapter + `KEYED-FOUNDER` refetch:**

- **butter + cheddar (and, if extended, NFDM / dry whey)** reach **`high` for free** by adding
  the **CME daily cash spot-call** as a second independent dollar-level type — pulled from the
  **USDA-republished** report **AMS_1601 / AMS_1603** (Dairy Market News), which is
  public-domain + redistributable + daily. The CME spot call is a *live physical auction*,
  genuinely independent of the NDPSR *survey of completed sales*, and the two **agree on
  level** (~$1.61/lb both in mid-2026) so they clear the 15% dispersion gate. Tag it
  `type:"cme-spot"`, `basis:"wholesale"`, $/lb. **This is the single highest-value confidence
  win in the whole plan and it costs nothing.**
  - *Honesty flag:* do NOT use CME dairy **futures** settlement — it settles ON NDPSR (a pure
    echo, confidence inflation).

**Paid `high` (everything else needs a second wholesale dollar feed):**

- **Proteins (beef/pork/poultry/eggs/lamb):** no free independent dollar-level second type
  exists — every free price is USDA-AMS (one methodology). `high` requires **Expana / Urner
  Barry** (four-figure/yr per commodity group) **and a redistribution rider** (UB's license
  forbids republishing the quote — a *dealbreaker* for public display until negotiated).
  `PAID` + legal.
- **CME live-cattle / lean-hogs** are independent but **basis-mismatched** (live-animal $/cwt
  vs cut $/lb) — they trip the dispersion gate, so they corroborate *direction*, not the
  level. Not a clean `high` lever. (CME also ended free EOD futures licenses in 2025.)
- **Produce:** the only free second methodology (AMS shipping-point F.O.B.) is a freight/margin
  **mirror** of terminal arrival — it trips the dispersion gate, and freight-adjusting it
  requires an invented constant the fact-gate forbids. Honest `high` = paid **Expana/Mintec**.
- **Seafood:** **no free delivered-wholesale level exists** for the imported species; the only
  paid one (Urner Barry) is **redistribution-blocked for public display**, so paying wouldn't
  even unlock a publishable number. **Stay trend-only (`basis:index`), hold `medium` on
  direction** via the BLS + IMF (`PSALMUSDM`/`PSHRIUSDM`) + FX + feed + freight stack.

### Honest verdict on confidence

**Free data tops out at a fully-`medium` index** (~96% of ingredients carry a dollar level)
**plus `high` on butter/cheddar (and other NDPSR dairy) via the free USDA-republished CME
spot.** That is the rational target and stopping point for a one-person studio. Beyond that,
`high` is a **targeted, budget-and-legal decision**: Expana/Urner Barry would lift proteins +
eggs + produce but is costly *and* redistribution-gated for a public site. **The marketing
must never claim a `high` the engine didn't earn** — "honest about being thin" (a fully-medium,
public-domain, corroborated-trend index) is itself the differentiator.

---

## PART II — Expansion: how large can we honestly go?

The operator buys **~550–700 distinct SKUs**. Of those, **~220–260 have a real yield story**
(fresh produce/meat/seafood + hard cheese + a few fresh specialty) — **~3× today's ~83 full
reads.** The rest (~330–440) are price-only/directional (dairy/eggs/fat/pantry/baking/
condiments/spices/beverage/bread/frozen/nuts/pastes).

**Honest ceiling: ~230–300 published pages** — ~150–180 *full yield reads* (essentially the
entire fresh-ingredient universe) **plus** ~80–120 *honestly-labeled price-only* pages — and
that back half exists **only if** a price-only page type is added (below). You cannot honestly
reach "hundreds of full reads"; you can reach "hundreds of pages."

### The architectural unlock — `KEYLESS-NOW`

1. **A price-only page type** (`priceOnly:true`, or inferred from `yield===1.0` + a price-only
   category): swaps the AP→EP calculator for a clean price-reference card + provenance drawer.
   Unlocks all of dairy/pantry/fat without faking a yield narrative. **This single editorial
   decision gates whether the ceiling is ~230 or ~390 pages.**
2. **New `CATEGORIES` buckets** — `dairy, cheese, eggs, fat, pantry, baking, beverage, nut,
   specialty` — each with a bilingual guide carrying the honest line *"No trim loss — a price
   reference, not a yield story."*
3. **Surface the `basis` per page** — `wholesale`→LEVEL, `index`/`retail`→"directional /
   trend-only" badge, so pantry (FRED-retail) and oils don't masquerade as wholesale.
4. **A manifest review-queue** (`--list-unverified`) over the 50 staged sources.

### Yield-gap closure — `NEEDS-DATA` (founder-verify the values), then `KEYLESS-NOW`

The FBG specialist returned **sourced, cited** edible-portion yields for the gap list, graded
SOLID / APPROXIMATE / UNSOURCEABLE. Tier-A SOLID, highest-value, clean price paths:
skirt-steak 0.85, brisket 0.75, chuck 0.85, flank 0.90, flat-iron 0.85, top-sirloin 0.85
(LMR 2453); chicken wings/drums/leg-quarters/tenders (National Chicken Report 3646);
tilapia/catfish/cod fillets 0.90 (clean HTS); peach 0.76, plum 0.85, nectarine 0.86, apricot
0.94, cherry 0.92. **Do NOT mass-add to the cited YIELD_TABLE on an agent's say-so** — register
via the honest paths (`yield_key` for CIA-table cuts after founder confirmation; `yield_source:
"usda-fbg"` for FBG-direct fillets/parts/veg), and **mark UNSOURCEABLE** (coconut, fresh
oyster/sardine — the count↔weight frontier) rather than guess.

### Sequenced waves

- **Wave 0 — verify the 47 staged price sources** (`--verify --flip`). `KEYED-FOUNDER`.
  Lights 47 existing pages yield-only→full reads. No new pages/schema. **Highest ROI.**
- **Wave 1 — close FBG yield-gaps** for already-priceable items (skirt/brisket/chuck/flank +
  chicken parts + stone fruit). `NEEDS-DATA` → `KEYLESS-NOW`. ~50–70 new full reads.
- **Wave 2 — fish fillets + remaining seafood** (fillet yield keys; tilapia/catfish/cod).
- **Wave 3 — dairy/cheese/eggs/fat schema + price-only pages** (the de-risked beachhead:
  butter/cheddar/eggs/parmesan/vegetable-oil already verified). `KEYLESS-NOW` (gated on the
  price-only type landing).
- **Wave 4 — pantry/baking/beverage/nut price-only fan-out** (FRED-retail / commodity
  direction). Takes total to ~350–390 pages. `KEYLESS-NOW`.
- **Wave 5 — confidence lift (optional)**: the free dairy CME-spot `high`; the
  count↔weight density feed (USDA FoodData Central) so count-unit produce pages show live EP
  cost; any `PAID` second feed. `NEEDS-DATA` / `PAID`.

---

## PART III — Tie items across distributors

The binding stack is **built and tested** (`stem.js` → `sku-match.js` → `cross-vendor.js` →
`cost-index-lookup.js`) but runs on `MuntinContext.skuHistory`, which is **written only by the
gated Ledger** — so on the public no-fetch storefront it's empty for every visitor. The
vendor-swap chip (`stale-banner.js:319`) is therefore *loaded but dark*.

**The honest line:** the storefront can show **"compare the prices YOU enter — against each
other and against a public benchmark."** The cross-operator **market** tie (k-anon delivered
anchor) requires the gated Ledger H3/H4 and antitrust counsel — `GATED-COUNSEL`, never a
storefront feature. Cost Pulse already states this correctly ("we don't pool data across
operators") — keep it.

**Keyless wins to move the pillar off the floor:**

- **P0 — operator-price-vs-benchmark on the ingredient page** (`KEYLESS-NOW`): one "your price"
  input wired to the already-loaded `wholesaleCents` → "you're ~11% over the public wholesale
  reference (delivered is usually higher)." Works for 100% of visitors, no data store.
- **P1 — session cross-vendor compare in Plate Cost** (`KEYLESS-NOW`): run `cross-vendor.js`
  over same-stem rows the operator typed *this session* (not `skuHistory`) → the existing
  `.pc-vswap-chip` from their own quotes. No pooling.
- **P2 — `data/ingredient-aliases.json` + `check-ingredient-aliases.mjs`** (`KEYLESS-NOW`): the
  canonical alias registry so distributor brand/grade variants (Calrose/Nishiki/Botan → rice)
  collapse to one Cost Index key. **Gate:** every canonical key ∈ (cost-index keys ∩
  YIELD_TABLE yield_keys); every alias stem must `extractStem`-normalize; no invented catalog
  SKUs (sourced `verified:false` until confirmed) — same fact-gate regime as everything else.
- **P3 — honest funnel copy** on the dark vswap/match-health surfaces ("run your invoices
  through the Ledger to compare your real delivered prices") instead of silent dead code.

---

## PART IV — Critical audit (red-team of the combined plan)

1. **Confidence honesty is the #1 risk.** The plan must ship a **fully-medium** index and the
   **free dairy `high`** — and *stop there* on free data. Any UI/marketing that implies `high`
   on proteins/produce/seafood without the paid feed is the exact confidence inflation the
   engine is built to refuse. Audit gate: the calibration check already fails CI on
   overstatement — keep it strict.
2. **The CME-spot dairy `high` win has two preconditions** that must be validated before it's
   claimed: (a) the USDA-republished CME cash close must register as a second *level* `type`
   (not a third trend) — confirm against `composite-price.js`; (b) confirm the USDA
   republication is the source (public-domain), not a direct CME feed (licensed). If either
   fails, dairy stays `medium`.
3. **FBG yields are agent-asserted, not independently verified here.** They must be
   founder-confirmed against the actual FBG/CIA before any value enters the *cited* YIELD_TABLE
   (registering an analog as a CIA key makes the gate vouch for a number CIA didn't publish).
   The `yield_source:"usda-fbg"` path is safer for the FBG-direct ones. UNSOURCEABLE items stay
   out.
4. **Price-only pages are a thin-content / honesty risk** if mis-framed. They are honest only
   with the explicit "no trim story — price reference" framing and a `basis` badge; otherwise
   they read as filler or imply a yield that isn't there. Cap egg variants (~3) and skip
   salt/most spices (doorway risk).
5. **The pressure overlay's 43 starter rules** include ~7 mis-signed-by-geography items
   (pineapple/ginger/mushroom/sweet-potato/corn-on-the-cob with CA/AZ-drought; tuna/lobster
   with freight-only) and a "trivially-proven-steady" loophole in `pressureProven`. HOLD-UNTIL-
   PROVEN protects the *reader* (no unproven arrow ships) but not the *manifest's* credibility —
   re-region or drop those rules and add a non-steady-call floor before they can prove out.
6. **Seafood must stay trend-only.** The just-shipped demotion is correct; do not be tempted
   back to a level by an import-value or ex-vessel number.
7. **"Tie across distributors" must not over-promise.** Storefront = your-own-prices; market =
   gated Ledger. Marketing that blurs them is the trap and (for the market anchor) an antitrust
   exposure.
8. **Everything is branch-only.** Pressure rules "will render" but haven't proven; staged
   sources are dormant; measured spreads/history need a keyed refetch. The breadth number
   "118 yields / 57 sources" overstates the *live* read (56 live, 23 medium). Report live
   numbers, not staged ones.

---

## PART V — The prioritized master roadmap

| # | Move | Tag | Impact |
|---|------|-----|--------|
| 1 | Merge to main + deploy | KEYLESS-NOW | Product exists for users. Unblocks all. |
| 2 | Set FRED/BLS/AMS secrets + green daily cron | KEYED-FOUNDER | "Frequently refreshed" becomes true; lights spreads/history. |
| 3 | Verify the 47 staged sources (`--verify --flip`) | KEYED-FOUNDER | 56→~106 live ingredients. Biggest breadth unlock, already staged. |
| 4 | Free `low→medium` lifts: add BLS trend legs to the 17 single-AMS produce + the 4 fruit; proxy repoints; pork WPS/WPU fix | KEYLESS-NOW + KEYED refetch | Pushes most lows → medium honestly, $0. |
| 5 | **Free `high` for butter+cheddar via USDA-republished CME spot** (new `cme-spot` type) | KEYLESS-NOW adapter + KEYED refetch | The only free `high`; first non-medium reads. |
| 6 | Operator-price-vs-benchmark input on ingredient pages + session cross-vendor + alias registry/gate | KEYLESS-NOW | Moves the distributor pillar off the floor for 100% of visitors. |
| 7 | Price-only page type + dairy/cheese/eggs/fat/pantry categories + basis badge | KEYLESS-NOW | Unlocks the back half of breadth (→ ~350 pages). |
| 8 | Close FBG yield-gaps (founder-verified) — skirt/brisket/chicken-parts/stone-fruit/fillets | NEEDS-DATA → KEYLESS | Completes the fresh universe (~+60 full reads). |
| 9 | Re-region / drop the 7 mis-signed pressure rules + non-steady-call floor | KEYLESS-NOW | Pressure credibility before it proves out. |
| 10 | Count↔weight density (FoodData Central) → live EP cost on count-unit produce | NEEDS-DATA | The most actionable number, restored to ~34 produce pages. |
| 11 | DefinedTerm aliases (`alternateName`/`sameAs`) once a gated alias/QID source exists | NEEDS-DATA | Entity/AEO depth; hold until sourced (wrong QID worse than none). |
| 12 | Paid second feed (Expana/CME) for `high` beyond dairy | PAID + legal | Only if a fully-medium index proves insufficient; redistribution rider required. |

**The one-line strategy:** deploy + keys (1–3) make it *real and current*; the free
`low→medium` lifts and the dairy free-`high` (4–5) push confidence to its honest free maximum;
the price-only type + FBG gaps (7–8) take it to the full honest breadth; the distributor
keyless wins (6) deliver the brand promise within the public boundary; paid feeds (12) are a
deliberate, legally-gated, budget decision — not a prerequisite. **A fully-medium, mostly-
public-domain, honestly-bounded index of ~250–350 ingredients, refreshed daily, is the target
that meets and exceeds the goal without ever inflating a number.**
