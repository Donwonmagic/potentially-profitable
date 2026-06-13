# Muntin Restaurant Cost Index — Methodology

> **Status: internal canonical DRAFT (2026-06-13).** This documents the method the
> code already enforces, so it is defensible today. It is NOT yet the published,
> web-routable page — per the source-first sequencing (roadmap §5b / §3), the
> public version ships once source integration is finalized, because §13 (the
> source register) is the one part that is still filling in. Everything from §1–§12
> is stable and quotable now.
>
> Companion to `docs/cost-index-depth-roadmap.md`. The mechanics here are not
> aspiration — each maps to a `check-*.mjs` gate and a `tools/_shared/*.js`
> primitive named inline, so any claim on this page is reproducible from the repo.
>
> **Structure** is modeled on how price-reporting-agency methodology pages are
> built (Urner Barry and the IOSCO PRA conventions it follows: specification &
> quotation basis · data collection · assessment · confidence · revision &
> correction · governance · definitions · limitations) — and deliberately goes
> *further* on transparency, where a PRA's page stops at "we assess the market":
> we name every source, label every estimate, and explain every gap (§6, §14).

## 1. What this index is, and how it differs from Urner Barry

The Muntin Cost Index publishes, per restaurant ingredient, a **wholesale dollar
level** and a **direction**, each carrying an honest **confidence** and a **source
citation with a report date**. It is a decision tool for an operator: *is this a
real market move, or my vendor?*

Urner Barry is the reference benchmark for proteins, and we take its rigor as the
bar. But UB is an **assessed/judgment benchmark** — market reporters phone
participants and publish a normalized private assessment. Its timeliness is its
moat; its opacity and self-reported, contract-pegged design are its exposure (the
*Habash* egg litigation; the Georgia Dock broiler index that was manipulated with
9 unverified contributors and discontinued in 2016, with UB/USDA cited as the
better-verified alternatives).

**Our position is the inverse of Georgia Dock: verification is the moat, and
opacity is fatal.** We do not out-quote UB on daily granularity. We out-*explain*
it: every number traces to a mandatory or transaction-verified public report, every
estimate is labeled as one, and every gap is named with its structural reason. That
is what makes this index quotable in search and AI answers — not a number, but a
**citable, reproducible number**.

## 2. Sourcing principles (in priority order)

1. **Public + public-domain.** USDA data is republishable, including derived
   values (courtesy citation requested, not required). We build only on sources we
   can cite by report ID and date.
2. **Mandatory / transaction-verified first.** USDA LMR (cattle/hogs/beef/pork —
   transaction-reported under the 1999 Act), NDPSR (mandatory weekly dairy), and
   AMS terminal-market reports outrank survey or index series.
3. **Verification before publication.** A source is wired as `verified:false`
   (STAGED) and only flips to `verified:true` after a live probe confirms the
   report ID, commodity term, unit, and price field resolve
   (`verify-cost-index-sources.mjs --flip`). Until then it never reaches a reader.
4. **Name the ceiling, don't fake it.** Where public data is structurally coarser
   than UB (poultry/shell-egg granularity, *daily* seafood), we label the limit.

## 3. The assessment pipeline

`fetch → normalize → bound → reduce → composite → assess → gate`, all enforced in
`build-cost-index.mjs` and gated by `check-cost-index-sync.mjs`.

- **Normalize.** Each source family has an adapter (`normalizeAms`, `normalizeBls`,
  `normalizeFred`, `normalizeNoaaTrade`, `normalizeEia`) that maps a raw payload to
  `{ valueCents, basis, asOf }` on a declared **basis** (`wholesale` vs `index`).
- **Bound.** Every ingredient carries per-source sanity bounds; an out-of-bounds
  observation is rejected before it can move a level (guards a mis-parsed unit or a
  decimal slip). In-bounds is a fail-CI gate, not a warning.
- **Reduce.** A single report (a range across markets/grades) becomes one number
  via a declared **reducer** — `mostlyMid` (trim the tails, take the middle) for
  terminal produce, `wtdAvg` for volume-weighted LMR cuts. The reducer is part of
  the source spec, so the same raw report always reduces the same way.
- **Composite.** Independent sources are blended into a **level** (the dollar) and
  a **trend** (the direction) as *separate* sub-objects — see §4.
- **Assess.** The point is stamped with level/trend confidence + provenance (which
  families and types backed it).

## 3a. Specification & quotation basis (what, exactly, is priced)

The hallmark of a defensible methodology page — and where we go further than a
silent number — is stating precisely *what* each quote represents. Every ingredient
carries an explicit specification:

- **Commodity & grade.** The exact source term and grade (e.g. meat cuts by
  IMPS/NAMP number — striploin = IMPS 180 boneless strip; produce by the AMS
  commodity term, e.g. "Lettuce, Green Leaf").
- **Unit.** The quoted unit (lb, carton, cwt) and, where unit conversion is
  involved, the conversion is declared, not silent.
- **Pricing basis & point.** `wholesale` vs `index`, and the market level it
  represents (USDA terminal-market shipping point, LMR FOB cutout, etc.). A level on
  an `index` basis is never presented as a dollar (§5).
- **Geographic basis.** A national composite or a named multi-market range; the
  `rangeBasis` (`markets` vs single source) is recorded and drives the shippable
  bar (§5). Regional splits (NY-vs-LA) are a roadmap item, not yet quoted.

The per-ingredient specification register lives in `data/cost-index-sources.json`;
publication of a quote requires its spec to be `verified:true` (§2.3).

## 3b. Data collection & cadence

Collection is automated and logged, not surveyed by phone (the structural
difference from UB): a scheduled refresh fetches each source's API on its native
cadence — AMS terminal reports daily, LMR daily/weekly, NDPSR weekly, BLS/FRED
monthly — windows the series, and re-vendors through the gates. Every fetch records
the report's own publication date as the value's `asOf` vintage (§8). No human
keys in a number; the audit trail is the git history of the data files.

## 4. Confidence — level and trend, scored separately

The headline confidence is the **min** of two independently-scored stories
(`tools/_shared/cost-confidence.js`, in lockstep with `composite-price.js` via
`cost-confidence.test.mjs`). Scoring them separately stops a noisy week-to-week
direction from stamping an 8-market measured price as "low."

- **Level confidence** (`levelConfidence`): `high` needs ≥2 independent dollar
  *types* that agree within a 15% robust coefficient-of-variation; ≥1 type is
  `medium`; an index-basis or absent level scores `null` (no dollar). Two types
  that **disagree** (>15% dispersion) are capped at `medium` — independence without
  agreement is not certainty.
- **Trend confidence** (`trendConfidence`): `high` needs ≥2 independent trend types
  agreeing on direction ≥66% of the time; ≥33% is `medium`. A **jagged** path
  (noise >0.20) is capped at `low` no matter how the endpoints line up — a noisy
  series is noise dressed as a trend.
- **Calibration ceiling** (`check-cost-index-calibration.mjs`): the published
  confidence may never exceed what the data supports. The health matrix
  (`build-cost-index-health.mjs`) proves `overstated == 0` on every build.

## 5. The shippable bar — ship complete, or not at all

An ingredient earns a *public reading* only if it clears `isShippable`: a credible
wholesale dollar level — **either** a measured cross-market range (≥3 market
families) **or** a single authoritative source whose direction is corroborated by
≥2 independent types and isn't pathologically noisy (≤0.20). No dollar level, or a
lone uncorroborated source, ⇒ it does **not** ship. There are no apologetic "no
published figure" reads on the dashboard (`check-shippable-bar.mjs` pins the
browser seed to this bar). Below-bar ingredients live only as honest
*expanding-coverage* pages.

## 6. The three-tier honesty spine

Every ingredient is one of (`check-source-tier.mjs`, fail-CI on an untagged item):

| Tier | Meaning | Treatment |
|---|---|---|
| `measured` | Published USDA/BLS/EIA/NDPSR series, as-is | solid line · source link · report date |
| `derived` | Our estimate from public inputs (§7) | dashed line · confidence band · "estimate" badge · method link |
| `absent` | No credible public series | greyed "no public data — here's why" + the structural reason (e.g. USDA's 3/70/20 confidentiality suppression) |

Making `absent` a first-class, *explained* state is more trustworthy than a silent
number, and it is the honest answer for the ~3 ingredients (branzino, oyster
mushroom, ground turkey) where no public series exists.

## 7. Derived methods (labeled `derived`, never `measured`)

Each derived value carries a confidence band, a method link, and degrades to
`absent` when its inputs don't clear the method's own bar.

- **Yield-adjusted true plate cost (EP).** `EP = AP wholesale ÷ representative trim
  yield` (`data/ingredient-yields.json`). Converts a wholesale tick into the number
  an operator pays; a 40%-yield item amplifies a move ~2.5×. Yields are ranges —
  labeled illustrative, the operator's own yield governs.
- **Seasonal normalization** (roadmap S-track). Our own multi-year monthly normal
  from vendored history (`build-seasonality.mjs`). A month earns a "typical"
  median + p25/p75 band only once observed across ≥2 distinct years; until then the
  card reads a transparent *building baseline* state. No "typical June" off one June.
- **Indirect estimation from the retail↔wholesale spread** *(proposed — the
  "work backward from retail" method).* Where no direct wholesale series exists but
  a reputable **retail** series does (BLS Average Price Data / FRED) **and** a
  reputable **spread** is published (USDA ERS *Meat Price Spreads*; the *Food Dollar
  Series* farm/marketing split), estimate wholesale as
  `retail × farm-or-wholesale-share`, with the share **validated against our own
  observed wholesale↔retail ratio** on the ingredients where we hold both.
  - **Honesty constraints that make or break it:** the spread is *not* constant —
    retail is sticky and lags, so retail-derived wholesale **understates volatility
    and lags turns**. It is therefore (a) `derived` only, never a measured level;
    (b) published only when the historical ratio is stable enough to band honestly
    (else `absent`); (c) strongest for meat, where ERS publishes the spread
    directly, and weak for produce, where spread data is thin; (d) best used as a
    *cross-check* or a coverage *fallback*, not a primary level when a direct
    wholesale source is available. Done this way it converts some `absent`
    ingredients into honest `derived` reads from reputable sources + price history,
    exactly the spine §6 is built for.
- **Import unit-value estimation** *(proposed — the import backdoor).* For
  import-dominated ingredients with no domestic wholesale series (much seafood,
  off-season produce, garlic), estimate a level from **customs value ÷ import
  volume** (USDA FAS GATS / Census; NOAA for fish). Same honesty rules as the
  retail back-out: `derived` only, banded, monthly + lagged, and explicitly *not*
  wholesale (customs value excludes duty, freight, and the importer's margin). Best
  paired with the **BLS Import Price Index** (e.g. Fish & Shellfish `IR01000`) as a
  *direction* corroborator — an index, never shown as a dollar (§5) — which can let
  a single such item clear the shippable bar honestly. The reputable path to a
  number for the seafood gap that domestic data structurally cannot cover.

## 8. Freshness & series rot

Every value stores an `asOf`/vintage. A freshness heartbeat
(`check-cost-index-freshness.mjs`) reports the oldest read; the weekly refresh runs
it with `--check` to turn a persistent stall red. Public series get revised or
discontinued (BLS retires PPIs on a schedule; AMS suppresses cells under 3/70/20) —
a vanished series becomes an `absent` event, **never a silent zero**.

## 9. Trend↔curve honesty

The percentage we *show* must describe the line we *draw*. A blend off a fresh
fetch won't equal the windowed primary curve, so `reconcile-cost-index-trends.mjs`
(fail-CI with `--check`) aligns every shown trend % to its own sparkline before
publish.

## 10. The leading-indicator (pressure) overlay

Forward signals (feed→protein lags, drought→beef, diesel→freight) are published as
**inferred direction only — never a price**, and only once a rule's live track
record clears a hold-until-proven bar (≥12 calls, ≥60% hit rate, ≥4 non-steady
calls). The recompute must match the rendered direction (`check-pressure-honesty.mjs`).

## 11. Fact discipline

No number, date, or claim is invented. Every figure is a published source value, a
labeled `derived` estimate, or labeled illustrative in the prose
(`data/sourced-claims.json` + the fabrication gates). The audio renderer speaks the
prose verbatim in six languages, so a fabrication would be spoken aloud — the gate
is absolute.

## 12. Auditability

Every published number traces to a dated public report and a named reducer/bound,
and the entire surface is reproducible by running the `check-*.mjs` suite
(`check-all.mjs`, 177 gates) against the committed data. That reproducibility — not
any single quote — is the citable asset.

## 13. Revision & correction policy

PRA methodologies live or die on how they handle a number that changes. Ours:

- **Source revisions.** When a source republishes a revised value, the next refresh
  re-vendors it; the new `asOf` vintage and the git diff are the record. We do not
  silently overwrite history — the prior value is recoverable from version control.
- **Corrections.** A discovered error (mis-parsed unit, wrong commodity term) is
  fixed at the source spec, re-verified (`--flip`), and the affected ingredient
  re-vendors. A correction that changes a published reading is noted in the change
  log (§15).
- **Withdrawals.** A series that is discontinued or suppressed transitions the
  ingredient to `absent` with the reason (§8) — it is never frozen at a stale last
  value pretending to be current; the freshness heartbeat (§8) would flag it anyway.

## 14. Known limitations & biases (stated, not hidden)

- **The public-data ceiling.** Poultry and shell-egg granularity, and *daily*
  seafood, are structurally coarser in public data than UB's assessed quotes. We
  label these, and several ingredients are honestly `absent` (§6) rather than faked.
- **Derived-method lag.** The retail→wholesale back-out (§7) understates volatility
  and lags turning points; it is a labeled `derived` fallback, never a primary level.
- **Yield ranges.** EP cost (§7) uses representative trim yields; the operator's own
  yield governs, so EP is illustrative, not a guaranteed plate cost.
- **Seasonal thinness.** Seasonal normals need ≥2 years per month; until the corpus
  fills, the seasonal read is an honest "building baseline," not a normal (§7).
- **No forecast.** We publish measured levels, measured directions, and *inferred*
  directional pressure (§10) — never a price forecast. Futures, if ever shown, are
  labeled "the market is pricing," not a prediction.

## 15. Methodology governance & change log

The methodology is versioned with the code. A change to how a number is assessed
(a threshold, a reducer, a new derived method) is a reviewable commit, and a dated
entry is appended below — so a reader can see not just the current method but how it
evolved (the IOSCO-style governance posture, adapted for a one-person studio).

| Date | Change |
|---|---|
| 2026-06-13 | Initial canonical draft: pipeline, dual confidence, shippable bar, three-tier spine, derived methods (EP, seasonal, retail-spread), freshness, trend↔curve, pressure, fact gate, governance. |

## 16. Definitions

- **Level** — the wholesale dollar figure (median cents) for a quote.
- **Trend** — the direction/percentage over the windowed history.
- **Basis** — `wholesale` (a dollar) vs `index` (a series, never shown as dollars).
- **Reducer** — how a multi-row report collapses to one number (`mostlyMid`, `wtdAvg`).
- **Type vs family** — independent *sources* (families) and independent *methods/
  agencies* (types); confidence counts types, the shippable bar counts market families.
- **measured / derived / absent** — the §6 honesty tier.
- **EP cost** — edible-portion cost: AP wholesale ÷ trim yield (§7).
- **Shippable** — clears the §5 bar and may carry a public reading.

## 17. Source register *(provisional — the source-first gate on publication)*

Fills in as integration finalizes; see roadmap §3/§3a for the live triage. Direct
families in use: USDA AMS (terminal produce), USDA LMR (beef/pork cutout), BLS PPI,
FRED, EIA, NOAA Fisheries. Staged for a connected run: NDPSR (dairy), LMR
pork-trim/lamb, AMS egg/poultry, the ~11 resolved AMS/LMR produce/protein terms.
Context layer: ERS Food Dollar Series (the §7 spread method's published anchor).
**This section is why the page is not yet public** — it must describe the finished
surface, not a moving one.
