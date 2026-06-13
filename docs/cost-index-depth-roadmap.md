# Cost-Index Depth Roadmap

> Synthesis + executable plan for taking the muntin.digital cost-index from a
> measured-price surface toward Urner-Barry-grade **depth, quality, and
> actionability** — using public, fact-checked data. Compiled 2026-06-13 from a
> four-workstream research pass (UB methodology, source expansion, insight
> methods, lean-replication strategy). Internal planning doc; not web-routable.

## 0. Where we are today

- **107 ingredients** staged in `data/cost-index-sources.json`; ~80 vendoring
  live after the current refresh (up from 56), with seafood deferred behind a
  transient NOAA brownout.
- **6 source families:** USDA AMS Market News (terminal produce), USDA LMR /
  Datamart (boxed beef & pork cutout), BLS PPI, FRED, EIA, NOAA Fisheries.
- **Pipeline:** `verify-cost-index-sources.mjs` (live-probe + `--flip`) →
  refresh workflow (live fetch → vendor through fact gates → reconcile → rebuild
  seed + cost-index + ingredient-yield pages → commit) on Linux CI.
- **Discipline:** every number sourced or labeled; `sourced-claims.json` + the
  `check-*.mjs` gates enforce zero-fabrication.

## 1. Strategic frame — out-explain Urner Barry, don't out-quote it

**The finding that drives everything:** UB's strength is structural and so is its
weakness.

- UB is an **assessed/judgment benchmark** — reporters phone market participants
  daily and publish a normalized, peer-reviewed *assessment*, not a raw trade
  feed. That timeliness + granularity is its genuinely proprietary asset.
- That same self-reported, contract-pegged design is why UB is named in a **2025
  antitrust class action** (*Habash v. Urner Barry*, egg price-fixing —
  **allegation, not a finding**; UB disputes it). The structural critique: a thin
  spot market, self-reported by the dominant firms that price off it, sets the
  reference for the whole market.
- **The Georgia Dock lesson** (broiler litigation): the index that actually got
  manipulated had 9 unverified contributors and was **discontinued in 2016**;
  UB/USDA were cited as the *better-verified* alternatives. **Verification is the
  moat; opacity is fatal.**
- Keep the critique fair: the real protein-antitrust target was **Agri Stats** (a
  paid cost/production data exchange), distinct from a price benchmark. We
  compete on transparency; we don't throw stones.

**Positioning:** *"The transparent, public-transaction cost index — every number
sourced, every gap explained."* We are the anti-Georgia-Dock: mandatory,
transaction-verified federal data + public citation + an explicit account of what
we don't have.

**Where public data is strong vs. the honest ceiling:**

- **Near-UB-grade & free:** beef/pork (USDA LMR — mandatory, transaction-verified,
  daily/weekly) and dairy (NDPSR — mandatory weekly).
- **The honest ceiling:** eggs/poultry granularity (LMR does *not* cover poultry
  or shell eggs — exactly where UB stays dominant) and **daily** seafood (public
  data is dock/ex-vessel, monthly). We *label* these limits rather than fake them.

## 2. The spine — a three-tier honesty label

The highest-value / lowest-effort build, and it maps onto our existing
`sourced-claims` discipline. Every card carries one of:

| Tier | Meaning | Treatment |
|---|---|---|
| `measured` | Published USDA/BLS/EIA/NDPSR series, as-is | solid line, source link + report date |
| `derived` | Our estimate from public inputs (seasonal factor, proxy, interpolation) | dashed line + confidence band + "estimate" badge + method link |
| `absent` | No credible public series (suppressed cell / non-public contract market) | greyed "no public data — here's why" + structural reason (USDA 3/70/20 confidentiality rule) |

**This reframes the six "dead-end" ingredients as a feature.** Making `absent` a
first-class, *explained* state is more trustworthy than UB's silent number — and
it's legal: USDA data is **public domain, republishable including derived
values** (courtesy citation requested, not required).

## 3. Source-expansion map (ranked by value ÷ solo-builder effort)

All confirmed free + public-domain unless noted.

| Source | Adds | Access (confirmed) | Verdict |
|---|---|---|---|
| **NDPSR** (Nat'l Dairy Products Sales Report) | Mandatory weekly cheddar/butter/NFDM/whey, transaction-verified | MARS API (free key) | **Do first.** Lifts butter/cheddar to mandatory-grade; opens a dairy complex |
| **NASS QuickStats** | Production, stocks, cold storage, farm prices (~65 commodities) | `quickstats.nass.usda.gov/api`, free key, JSON/CSV, 50k rows | **Driver layer** for attribution |
| **AMS egg/poultry suite** | Honest free substitute for UB egg/poultry quotes: Egg Markets Overview, Daily Shell Egg Index (`2843`), inventory (`1427`), weekly broiler | MARS API by `slug_id` | Closes our biggest *labeled* gap; some egg reports PDF-only post-2023 |
| **LMR pork-trim / lamb families** | pork trim 72%/42%, lamb cuts | MARS `/reports` ToC → slug | **Upgrades ground-pork + lamb from `absent` → `measured`** |
| **CME futures** (LE, HE, DC, ZL) | Forward *lean* (the direction UB now monetizes via forecasts) | Free **delayed**; ⚠️ redistribution licensing | **Defer** — verify CME terms; present illustrative, "market pricing, not a forecast" |
| **ERS** (Meat Price Spreads, Food Price Outlook) | Markup/spread + forecast envelope (prediction-interval posture) | **API DOWN (redesign)** → bulk download | Borrow the posture; use downloads |

**MARS API note:** `https://marsapi.ams.usda.gov/services/v1.2/reports`, HTTP Basic
with key-as-username/blank-password (the auth we already use); root `/reports`
returns the full catalog ToC; registered row limit 100k.

## 4. Actionability ladder (ranked by operator value ÷ effort)

Order reflects the research consensus on value-to-effort for a solo builder:

1. **Yield-adjusted true plate cost** — `EP cost = AP price ÷ yield`. LOW effort
   (one formula, one input), and it converts a wholesale tick into the number an
   operator actually pays. A low-yield item *amplifies* the move: at 40% yield a
   $1/lb commodity rise lands as ~$2.50/lb on the plate. Ties cost-index to the
   ingredient-yield library we already rebuild. **Ship first.** (Yields are
   ranges — label illustrative, let the operator override.)
2. **Basis / benchmarking** — "you're paying X% over the wholesale benchmark, and
   N points wider than your own 6-month norm." LOW effort over data we already
   have + one invoice field. Turns the index into a supplier-accountability tool.
3. **Seasonality normals** — "is this high *for June*?" Start with **multi-year
   median + percentile bands** (robust at 2–3yr history; STL only at 5yr+). We
   already vendor windowed history. Foundation that thresholds for #4/#6 key off.
4. **Leading indicators & lags** — the strongest *forward-looking* differentiator,
   all on free feeds. Quantified, citable chains:

   | Signal | Lag | Direction |
   |---|---|---|
   | Corn/soymeal → **broiler** | ~2–4 mo (fastest) | feed↑ → chicken↑ |
   | Corn/soymeal → **hog/pork** | ~6–12 mo (watch hog-corn ratio) | feed↑ → pork↑ |
   | Corn → **fed cattle/beef** | 12–24+ mo | feed↑ → beef↑ |
   | **Drought** (USDM D2–D4 in cattle country) → beef | 0–12 mo supply↑→price↓, then **12–36 mo price↑** | counterintuitive inversion |
   | **Diesel** (EIA weekly) → freight surcharge | ~2 days–1 wk | mechanical |

   Static lag/cycle facts are citable, low fact-gate-risk content; a *live*
   indicator overlay (USDM + corn + diesel feeds) is the harder lift. Present as
   directional ranges, never point forecasts.
5. **Driver attribution** — the rendering of #4 on the card: "what moved this"
   (feed, diesel, drought, cold storage). Correlational, **labeled as such** —
   never a fitted coefficient dressed as causation.
6. **Substitution economics** — surface the cheaper interchangeable cut on a spike,
   compared on **yield-adjusted EP cost, not AP**. The curated swap map is the
   manual work (and the moat); cross-price elasticities are small (~0.05–0.3) and
   directional — cite as flavor, not foundation.
7. **Futures lean** — "the market is *pricing* higher," explicitly **not a
   forecast** (futures forecast no better than spot; livestock curves are
   seasonal-supply signals, not cost-of-carry). Highest misuse risk + CME
   licensing wall → ship last, heavily caveated, illustrative only.
8. **Confidence bands** on every `derived` number (ERS prediction-interval posture)
   — bundle with #3.

## 5. ▶ Next sprint — "Depth I"

Scoped to clearly-licensed, public-domain federal data only (no CME licensing
risk). Four deliverables, sequenced so each unlocks the next.

### D1 — Source-tier labeling (`measured` / `derived` / `absent`) — *foundational*
- Add `tier` + `coverage` (reason string) to each ingredient in
  `cost-index-sources.json`; add `scripts/check-source-tier.mjs` (fail-CI on an
  untagged ingredient); add a render hook so cards show the badge and, for
  `absent`, the structural reason.
- **Resolves the dead-ends:** oyster-mushroom / branzino / ground-turkey become
  honest `absent` cards; ground-pork + lambs route to D2 for `measured`.
- **Acceptance:** every ingredient renders one tier; `absent` cards name a reason;
  gate fails on an untagged ingredient.

### D2 — NDPSR dairy as a new source family
- Wire NDPSR (MARS API) into fetch/verify/vendor; lift `butter` + `cheddar-cheese`
  to mandatory weekly; pull the LMR pork-trim + lamb slugs to upgrade ground-pork
  and the lambs.
- Proves the "add a whole source family" pattern on the highest-grade feed.
- **Acceptance:** butter/cheddar + ground-pork + lambs vendor from mandatory data,
  pass all gates, render `measured` with citation.

### D3 — Seasonality baseline v1
- `scripts/build-seasonality.mjs` computes a multi-year monthly normal per
  ingredient from vendored history; cards render a "vs. typical {month}" band
  (`viz-spark`/`viz-bars` overlay), flagged `derived` with a confidence band.
- **Acceptance:** ingredients with ≥2yr history show a seasonal band + plain read
  ("~12% above the June norm"); thin history degrades to "insufficient history."
- **Status (2026-06-13): engine + gate shipped, dormant by design.**
  `scripts/build-seasonality.mjs` → `data/seasonality.json` is live and pure
  (`--check` idempotency + `--self-test`, both in `check-all` and the refresh
  workflow). A month earns a normal only once observed across `minYearsPerMonth`
  (2) distinct years; today's corpus is ~4 months (one partial year), so all 80
  ingredients sit in a transparent `building` state that names its blocker — no
  fake "typical June" off a single June. The artifact self-enriches weekly; the
  remaining work is the **seed/UI render hook** (the "vs. typical {month}" band),
  which lights up automatically once ingredients cross into `ready`.

### D4 (stretch) — Driver attribution v1
- Wire one driver via NASS QuickStats (cold storage or corn) as a labeled "what's
  moving this" line on protein cards; correlational, method-linked.
- **Acceptance:** protein cards show one sourced driver line; copy explicitly
  correlational; gate checks the driver series is alive.

### Quality throughline — public methodology page
- A web-routable methodology page (the Urner-Barry move): how bounds, reducers,
  tiers, and sources work. The trust artifact that makes the index auditable.
  Fold in alongside D1.

### Parallel / prerequisite (in flight)
- The ~80-ingredient refresh vendor + the NOAA seafood re-flip — both feed D3
  (more history → better seasonality).

## 6. Risks & constraints

- **CME redistribution licensing** — real compliance question; keep futures out of
  the published surface until verified. Present as illustrative snapshots only.
- **ERS API is down** (redesign) — use bulk downloads, don't build on the API.
- **Egg/poultry & daily seafood ceiling** — public data is coarser; label it, don't
  fake it.
- **Series rot** — public series get revised/discontinued (BLS retires PPIs on a
  schedule; AMS cells suppress under 3/70/20). Mitigations: store every value with
  an `asOf`/vintage; a monthly `check-series-alive.mjs` "is it still publishing?"
  gate; treat a vanished series as an `absent` event, never a silent zero.

## 7. Backlog (later sprints)

- Futures forward-lean layer (pending CME licensing).
- Basis / invoice-benchmarking (needs operator input).
- Yield-adjusted true plate cost (cost-index × ingredient-yield).
- Substitution economics.
- Regional spread (surface NY-vs-LA instead of a single midpoint).
- IOSCO-style published methodology + an annual self-assurance note.
- **User-built baskets + alerts** *(deferred — only after the depth plan above
  is fully shipped).* Let an operator assemble their own basket of ingredients
  to keep tabs on, and opt into alerts when a tracked item moves. Adds an
  account/notification layer the static no-fetch surface doesn't have today —
  scope the storage + delivery path (and whether it stays client-side) when it
  comes up; until then it sits last in the queue.

## 8. Source notes / caveats

Research pass relied on WebSearch corroboration where primary pages 403'd to
automated fetch. Re-verify before publishing as web prose: exact MARS rate
limits; current poultry report IDs; ERS API restored-date; the egg "spot is
~11%/contract is >95%" and "UB runs 15–20% above realized" figures (plaintiff /
single-compilation sourced — directionally supported, not audited). UB egg
benchmark dates to 1857; UB acquired the *Yellow Sheet* (beef/pork) in Oct 1992;
Mintec Group rebranded to **Expana** (2024–25). LMR (1999) covers cattle/hogs/
beef/pork — **not** poultry or shell eggs.
