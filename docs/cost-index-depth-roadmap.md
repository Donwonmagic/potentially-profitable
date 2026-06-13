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

### 3a. USDA ERS API products — triage (added 2026-06-13)

ERS exposes a product-API set (this supersedes the "ERS API down" note below — the
*data-product* APIs are live even while the Meat Price Spreads API was mid-redesign).
Triaged against this index's actual job — **wholesale ingredient cost level +
direction** — not everything USDA publishes earns a place:

| ERS product | Fit | Verdict |
|---|---|---|
| **Food Dollar Series** | The farm-to-consumer cost split (farm share vs. the marketing bill: processing, transport, retail). *Explains why a wholesale tick ≠ a plate/retail move.* | **Take — as an education/context layer**, not a price. Annual, national, public-domain. Pairs with driver-attribution (§4 #5) and the per-card education theme. |
| **ARMS** (farm financial / production practices) | Cost-of-production context (input costs, practices). Annual, aggregate, survey, lagging. | **Defer.** A weak, slow structural backdrop — not a price or a usable lead. Revisit only if a "cost-of-production pressure" driver is ever scoped. |
| **Food Access Atlas** · **Food Environment Atlas** · **SNAP Data System** · **Farm Program Atlas** · **Atlas of Rural & Small-Town America** | Social / geographic / program data (access, assistance, county socioeconomics). | **Decline — out of scope.** None carries a wholesale ingredient price or a cost-driver signal; adding them is scope drift that dilutes the "every number earns its place" posture. The Food Environment Atlas has a *retail* price element, but retail≠wholesale and it's not a usable feed. |

**Net:** one real add (**Food Dollar Series**, as context/education), one parked
(ARMS), five declined. All staged for a **connected run** — this environment has
no API keys and outbound is blocked (MARS/NASS/FRED all 403), so nothing here
vendors until keys + network exist.

### 3c. Non-typical source research (added 2026-06-13)

Web research pass for *unconventional but reputable* public sources — aimed squarely
at the gaps domestic wholesale data can't fill (import-heavy seafood/produce; honest
direction where there's no level). Several need **no new credentials** (they ride the
BLS / FRED / MARS auth we already hold). Re-verify series IDs + API shapes on a
connected run before vendoring.

| Source | What it adds | Basis / honest use | Access | Verdict |
|---|---|---|---|---|
| **BLS Import/Export Price Indexes (MXP)** — e.g. Fish & Shellfish `IR01000`, also vegetables/fruit end-use | Monthly import-price **direction** for import-dominated items — the missing *direction* corroborator for absent seafood | `index` (not $) → a **trend/corroboration** source, never a level (§5 bars index-as-level). Feeds the shippable bar's "single level + corroborated direction" path and the pressure overlay | **BLS API / FRED — keys we already use.** | **Take.** Highest value-for-effort: no new auth, directly attacks the seafood gap |
| **USDA FAS GATS** (Census + UN ComTrade import/export value & volume) | **Import unit value** = customs value ÷ volume — a $/kg proxy for import-dominated ingredients (shrimp, branzino, off-season produce, garlic) | `derived` level only: customs value excludes duty/freight/importer margin and lags (monthly), so band it and label it — a sibling to the retail-spread method (§7). Can move select items `absent → derived` | FAS Open Data API key (new); Swagger + open-source SDK exist | **Take (derived).** The backdoor wholesale proxy for import items with no domestic series |
| **USDA AMS Specialty Crops Movement reports** (shipments + border crossings + imports, by commodity) | **Volume** as a *leading* price indicator — high arrivals foreshadow softening | Not a price — a directional **pressure** input (§10), correlational and labeled | **My Market News / MARS API — auth we already use.** | **Take (pressure).** No new auth; turns volume into an honest forward read |
| **NOAA Foreign Fishery Trade Data** | Seafood import value/volume — corroborates GATS for fish | Same `derived`/direction treatment as GATS | NOAA (public) | **Cross-check** for the seafood derived proxy |
| **Census USA Trade Online** | Customs-value imports at HS-code granularity | Same as GATS (Census is the underlying source) | Free account / bulk | **Defer** — GATS already wraps Census; use only if finer HS detail is needed |

**Net new methods this unlocks:** (1) an **import-price-index direction** corroborator
that lets some absent seafood clear the shippable bar honestly; (2) an **import
unit-value derived level** (§7 sibling) for import-dominated items; (3) a **movement/
volume pressure** lead. Items 1 and 3 need *no new credentials*. All staged for a
connected run — see the runbook.

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
- **Draft exists:** `docs/cost-index-methodology.md` — the internal canonical
  methodology (PRA/UB-structured, transparency-first, grounded in the implemented
  gates). It carries §7's retail↔wholesale-spread derived method and the source
  register that gates publication.
- **Sequencing (operator directive, 2026-06-13): WRITE THIS LAST.** The
  methodology documents how the sources work, so it can't be honest or final
  until source integration is *done*. Squeeze every viable public source into the
  index first (§3 + §3a, the source-integration audit), settle the tier/bounds/
  reducer per source, *then* write the methodology against the finished surface.
  Drafting it earlier just guarantees a rewrite. Treat the source-expansion work
  (§3/§3a/D2) as the prerequisite gate on this page.

### Parallel / prerequisite (in flight)
- The ~80-ingredient refresh vendor + the NOAA seafood re-flip — both feed D3
  (more history → better seasonality).

## 5b. Focused workstream — Seasonality (its own track)

Seasonality outgrew a single Depth-I bullet (D3). It is a distinct capability with
its own multi-phase arc, its own data layer, and its own honest-degradation story,
so it gets a dedicated track. Two halves that ship independently:

- **The measured read** (needs history): our own "is this high *for {month}*?"
  normal + band, computed from vendored weekly history. Gated on 2+ years per
  month — dormant until the corpus fills (see D3 status).
- **The education** (ships now): a short, per-ingredient seasonality primer on
  every card — *why* this item has a season and roughly when it runs — so a card
  teaches the pattern long before we have the years of data to measure it. This is
  the half a reader can use today; it does not depend on our price history.

**Phases:**

1. **S1 — Engine + gate** *(done, 2026-06-13)*. `build-seasonality.mjs` →
   `data/seasonality.json`, pure + `--check` + self-test, in `check-all` and the
   refresh chain. All ingredients currently `building` with a named blocker.
2. **S2 — Per-card education** *(next; this is the operator-facing win today)*.
   A curated, bilingual `data/seasonality-education.json` keyed by ingredient: a
   peak window + a one-line "why," joined into the seed and rendered as a
   *Seasonality* line on each card — replacing today's single generic
   `seasonal:true` nudge (`cost-index-ui.js`) with something specific per item.
   Its own gate (shape · key-existence · EN/ES parity · length · banned-words ·
   self-test). **Sourcing posture is the open decision** (general-illustrative
   vs. USDA-AMS-sourced precise windows) — see reply thread.
3. **S3 — Render hook for the measured read.** Once an ingredient crosses to
   `ready`, the card adds the "~X% above the typical {month}" band beneath the
   education line. Engine already emits the normals; this is seed-join + UI only.
4. **S4 — Seasonal alerts.** Ties into the backlog's *user-built baskets + alerts*
   item: "your tracked item is entering its typical high season." Deferred with
   that feature (needs the account/notification layer).

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
