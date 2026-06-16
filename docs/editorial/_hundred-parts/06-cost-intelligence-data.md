## Domain VI — Cost Intelligence / Data Product

*Positioning Council brief · specialists 41–48. Strategy only — no live-site edits ship from this file. Repo facts current to 2026-06-16. Every figure below is repo-sourced (file-cited), web-sourced (labeled + dated), or marked "analyst assessment / illustrative." The honesty gate is the product here, so this brief holds itself to it.*

**Asymmetric thesis (the spine of all eight).** A platform like Bloomberg will not publish honest, uncertainty-labeled, freely-citable wholesale ingredient prices, because the value of its data is the $31,980/yr-per-seat terminal it sits behind (Bloomberg Terminal 2026 single-seat list, per godeldiscount.com / vendr.com, 2026). Rent depends on opacity. Muntin's Cost Index inverts that: 16 verified ingredients composited only from public USDA/BLS/FRED/EIA series, every number tracing to a dated public report, CC0-licensed, reproducible by re-running the open checks. The reference comps are not Bloomberg — they are **Case-Shiller** (a transparent repeat-sales method everyone cites) and **Zillow ZHVI / FRED / USDA-ERS** (free, downloadable, prediction-interval-bearing, widely re-published). The win condition is to be *cited*, not *subscribed to*. "Verification is the moat, and opacity is the risk" — the methodology page already says this (cost-index/methodology/index.html, #what-this-is, Georgia Dock cautionary tale).

**Cross-cutting repo correction (applies to several audits below):** the prompt's ledger says "weekly refresh" and "no CSV/JSON export"; the repo says otherwise. The workflow is now **daily** (`.github/workflows/cost-index-refresh.yml`, `cron: "0 13 * * *"`). Per-ingredient `series.json` + `series.csv` **do exist on disk** and are wired into each Dataset's JSON-LD `distribution` (verified: `cost-index/ribeye/series.csv`, `series.json`, and siblings for onion, romaine, tenderloin, pork-shoulder, russet-potato…). What is genuinely absent: a *human-visible* download affordance, an *aggregate* (all-ingredient / basket) export, an embeddable widget, and any surfacing of the 431 KB `data/cost-index-history.json` for long-range charts. Briefs are scored against the real state.

---

### 41 · Data-Product Lead (Cost Index) — make it the category's reference price

**Aspect & why it decides success.** Whether the Cost Index becomes *the* thing operators and AI engines quote when they ask "what does ribeye cost wholesale?" decides if muntin owns a data category or just runs a nice widget. A reference price is won by citability and a named, stable method — exactly Case-Shiller's playbook, not Bloomberg's. This is the single most leverage-heavy aspect in the domain.

**Current-state audit (score 7/10).** The bones are excellent. `data/cost-index.json` (2.72 MB) carries 16 verified ingredients with per-point `level{medianCents,rangeCents}`, blended `trend`, dual `confidence`, and `provenance`. The hub renders 13 public pages + methodology + lab (cost-index/index.html). JSON-LD ships `DataCatalog` + per-ingredient `Dataset` with CC0 license, `creditText`, `isBasedOn`, and `distribution` download links (cost-index/ribeye/ head). What it lacks to be a *reference*: (a) a **named headline index** — `data/cost-basket-weights.json` defines a frozen "Muntin Restaurant Basket" (`_version: 2026-Q2`, weighted-median of composite trends) but no public page presents a single quotable "Muntin Restaurant Cost Index = X% MoM" number the way "Case-Shiller rose 0.3%" travels; (b) the basket is rate-of-change only, never a level, which is honest but harder to cite. Score capped at 7 because the asset exists and is gated but isn't yet packaged as one nameable, repeatable figure.

**Benchmark gap (S&P CoreLogic Case-Shiller).** Case-Shiller is cited daily despite a *complicated* three-step weighted-repeat-sales regression — because the method is published, the cadence is fixed, and the number has a name (en.wikipedia.org/wiki/Case-Shiller_index, 2026). Muntin has the transparency Case-Shiller has and the public-domain license Case-Shiller does *not*. The gap is purely packaging: one named headline series with a frozen method note.

**The Extend-Past move (asymmetric).** Ship a **named, dated, frozen-methodology headline** — "The Muntin Restaurant Basket: +X.X% over the trailing period, 2026-Q2 weights, public sources, reproducible" — as a first-class hub module with its own `Dataset` JSON-LD and a permalink AI engines can cite. Bloomberg can't follow: a free, named, CC0 restaurant-cost reference price directly cannibalizes the thing terminals charge for. Pair it with a one-line "cite this" block (the citation IS the asset, per methodology #governance).

**Actions.**
1. Add a named headline "Muntin Restaurant Basket" module to `cost-index/index.html` reading `cost-basket-weights.json` via the existing build — rate-of-change + coverage% + confidence, never a level. (M × 5)
2. Emit a dedicated `Dataset` JSON-LD node for the basket with CC0 license, `temporalCoverage`, and `variableMeasured: rate-of-change`. (S × 4)
3. Add a visible "Cite this index" block (APA + plain-text + JSON-LD link), mirroring how Zillow/FRED publish citation guidance. (S × 4)
4. Keep weights frozen + versioned; any re-weight requires a dated methodology note (already the file's rule — enforce in `check-cost-index-*`). (S × 3)
5. EN↔ES parity for the new module + a `/es/cost-index/` basket mirror; locale-parity gate must stay green. (M × 3)

**Risks & honesty-gate notes.** The headline must never read as "what restaurants pay" — `cost-basket-weights.json._doc` explicitly forbids a national price level, and weights are labeled internal judgment (illustrative), not a sourced fact. Any % shown must reconcile to its own curve (the trend↔curve invariant in `reconcile-cost-index-trends.mjs`). No new number is invented — the basket is a function of already-vendored points.

**One proof metric.** Count of external citations/backlinks to the named-basket permalink (and AI-Overview appearances for "restaurant cost index"), tracked quarterly.

---

### 42 · Data-Provenance Engineer — USDA/BLS/AMS pipeline integrity + freshness

**Aspect & why it decides success.** Every downstream claim — and the six-language audio that reads numbers verbatim — rests on provenance being real and verified. If a source id is wrong or a unit flips, the whole "verification is the moat" thesis collapses into the Georgia Dock failure the methodology warns against. Integrity is existential, not cosmetic.

**Current-state audit (score 8/10).** Strong. `data/cost-index-sources.json` (168 KB) maps each ingredient to USDA-LMR/AMS report ids, BLS series, FRED ids, EIA, NOAA, each carrying `verified:true/false`; the `_doc` documents a hard fact gate — an ingredient renders only if its source ids are `verified:true` AND a live fetch produced real points. `cost-index-bounds.json` rejects unit-flips/sentinels (value `< min/2` or `> max*2` hard-rejected). Pipeline is fetch→normalize→bound→reduce→composite→assess→gate, audited via version history (methodology #pipeline). `check-cost-index-sync.mjs` enforces parity+freshness+fact-gate. The 2-point deduction: `cost-index-sources.json._doc` still says "EVERY id here is an UNVERIFIED best-guess" as boilerplate while 16 ingredients are flipped `verified:true` — a stale doc-comment that could mislead a future maintainer; and beef/pork LMR slugs carry an unresolved note about whether they need the separate LMR/Datamart API.

**Benchmark gap (FRED / Our World in Data).** FRED carries 845,000 series from 121 sources with per-series source attribution and an open API (fred.stlouisfed.org/docs/api, 2026). Our World in Data publishes a machine-readable source + processing trail per chart. Muntin's provenance is per-point but not yet exposed as a single machine-readable "source registry" page a third party (or an auditor) can read without cloning the repo.

**The Extend-Past move (asymmetric).** Publish a **public, machine-readable provenance registry** — a `/cost-index/sources/` page (and `sources.json`) listing every ingredient → source id → report → verified status → last-fetch date, generated from `cost-index-sources.json` + `cost-index-health.json`. A surveillance platform hides its sourcing; muntin's competitive edge is showing its work down to the report id. That page is itself citable and SEO-rich.

**Actions.**
1. Refresh the stale `_doc` boilerplate in `cost-index-sources.json` to reflect that 16 ids are verified; keep the per-id `verified` flags as the source of truth. (S × 3)
2. Build `/cost-index/sources/` from the two JSONs (ingredient → agency → report id → verified → asOf), with `Dataset`/`DataCatalog` JSON-LD. (M × 4)
3. Resolve the beef/pork LMR-vs-Datamart API question and record the outcome inline (verified note), removing the open TODO. (M × 3)
4. Add a CI assertion that every `verified:true` id has a successful live-fetch timestamp in the artifact, else fail. (S × 4)
5. Surface a per-ingredient "last confirmed against source on <date>" line on each page from `health.json.asOf`. (S × 3)

**Risks & honesty-gate notes.** A public sources page must not imply endorsement by USDA/BLS — credit by name, link the public reports (methodology already credits AMS without deep-linking specific proprietary pages). Never show `verified:false` ids as live. No invented report ids.

**One proof metric.** Percentage of published ingredients with a green live-fetch confirmation < 5 days old (the workflow's `COST_INDEX_MAX_AGE_DAYS` heartbeat), shown publicly and ≥ 95%.

---

### 43 · Data-Visualization Specialist — viz-* legibility (fix the chart confusion)

**Aspect & why it decides success.** A busy operator gives a chart ~2 seconds. If the sparkline, range band, and "you are here" marker don't resolve instantly into "market moved vs vendor moved," the data product fails at the only job it has. Legibility is the conversion surface.

**Current-state audit (score 6/10).** The atoms are good and gate-enforced: `viz-bars/flow/tree/ba/ring/waterfall/gauge/spark/hero/scroll` exist in `assets/site-article.css` (3,238 lines), each with `data-audio-alt` ≥ 80 + `<figcaption>` per the article-graphics gate. The ingredient sparkline (cost-index/ribeye/, the `mtn-spark` SVG) does carry an accessible label and a dashed median reference line. But three legibility problems are visible in-repo: (a) the sparkline encodes the trend as area-fill in **teal `rgba(31,111,106,…)`** while the headline trend arrow and Cost Pulse use **rust for "up"** (`.cp-market-trend[data-dir="up"]{color:var(--rust)}`) — an up-move drawn in the calm color is exactly the "chart confusion" reported; (b) `viz-bars` has no value axis or gridline, so a band is read by eyeballing; (c) the percentile capsule ("higher than 5 of its last 12 reads") is prose, not a glanceable mark. Score 6: accessible and gated, but the color semantics fight the message.

**Benchmark gap (NYT / FT graphics).** FT and NYT graphics desks fix one encoding per chart and make direction unambiguous (FT visual-vocabulary; The Pudding's "fewer words, stronger design" visual-essay method, storybench.org 2026). Muntin's charts currently carry two color languages.

**The Extend-Past move (asymmetric).** Adopt **one direction-color law site-wide** (rust = costs rising/bad-for-operator, teal = easing/good) and make the per-ingredient chart a single "two-second read": band + your-price marker + direction-consistent trend line, with the percentile rendered as a tick on the band. A platform optimizes charts for dashboard dwell-time; muntin optimizes for *exit in two seconds with a decision* — the opposite of engagement-maximizing.

**Actions.**
1. Reconcile sparkline fill/stroke color with the direction semantics used in Cost Pulse (rust=up) so one move never shows two colors; centralize the tokens in `site-article.css`. (M × 5)
2. Add an optional light value-gridline + min/max end-labels to `viz-bars` band charts for at-a-glance scale. (M × 3)
3. Render the "higher than N of last 12" percentile as a tick mark on the band (`viz-bars__mark` already supports `--x`). (S × 4)
4. Add a `prefers-reduced-motion` + colorblind check (rust/teal also differ in luminance; add a shape/label cue, not color alone). (S × 4)
5. Extend `test-article-graphics.mjs` with a direction-color consistency assertion so the two-language regression can't return. (M × 3)

**Risks & honesty-gate notes.** Every changed/added figure still needs `data-audio-alt` ≥ 80 chars + `<figcaption>` + teal↔rust tone balance (rules 1–8 of `check-article-graphics.mjs`). Do not bake any literal number into a `data-audio-alt` that isn't in the sourced data, and never copy autolink markers into attribute values (rule 8).

**One proof metric.** Unmoderated 5-second test: ≥ 80% of operators correctly state direction + "is my price normal?" from one ingredient card.

---

### 44 · Data-Freshness / Automation Engineer — the refresh workflow

**Aspect & why it decides success.** A price index that goes stale silently is worse than none — it speaks a wrong number aloud in six languages. Freshness, and *honest failure* when freshness can't be met, is what lets muntin claim "live" without lying.

**Current-state audit (score 9/10).** Near-exemplary, and *better than the prompt's ledger states* — the cron is **daily** (`0 13 * * *`), not weekly (`.github/workflows/cost-index-refresh.yml`). Honest-failure posture is explicit: no keys → log + exit 0 (never a red X, nothing invented); 0 points composed → fetch refuses to write, last-good stays; gates fail → nothing commits ("a stale-but-true index beats a fresh-but-wrong one"); a real stall fails red and emails the founder (`COST_INDEX_MAX_AGE_DAYS: 5`). After vendor it rebuilds seed, health, seasonality, pages, sitemap, and stamps JSON-LD `dateModified`. The 1-point gap: freshness/heartbeat is server-side; the *public* surface shows per-card `asOf` but no single visible "index last updated <date> · next refresh in <window>" status an outside reader/AI can read as a liveness signal.

**Benchmark gap (Bloomberg cadence — inverted).** Bloomberg's value is intraday cadence behind a paywall. Muntin can't and shouldn't match intraday; its asymmetric answer is **transparent automated cadence with public asOf dates** — Zillow/FRED-style "monthly, here's the vintage" trust, applied daily.

**The Extend-Past move (asymmetric).** Surface freshness as a **public trust signal**: a hub status line + a tiny machine-readable `health.json`-derived "freshness" endpoint (oldest reading, refresh cadence, last commit date). Where a platform hides its update lag, muntin advertises it — staleness named is more trustworthy than freshness implied.

**Actions.**
1. Add a visible "Index last refreshed <date>, sources daily; oldest contributing read <date>" line to `cost-index/index.html`, fed from `cost-index-health.json` at build. (S × 4)
2. Publish a small public `/cost-index/health.json` (or reuse) with `oldestAsOf`, `cadence:"daily"`, `lastCommit` for third-party liveness checks. (S × 3)
3. Add a `lastReviewed`/generatedAt freshness assertion to CI so a missed daily run is visible in-repo, not only via email. (S × 3)
4. Document the honest-failure ladder publicly (one paragraph on the methodology page) so readers know stale = last-good, never invented. (S × 3)

**Risks & honesty-gate notes.** The public freshness line must read from `health.json`, never a hardcoded date that can rot. The daily cadence must not be over-claimed as "real-time." Keep the weekly *email* dispatch separate from the daily *data* refresh (already noted in the workflow header).

**One proof metric.** Share of calendar days in a quarter with a successful committed daily read (target ≥ 90%, accounting for "no data change" no-op days).

---

### 45 · Embeddable-Widget / API Lead — cost-index embed + CSV/JSON

**Aspect & why it decides success.** Distribution decides whether the moat compounds. A price index that can only be read on-site is a destination; one that can be *embedded and downloaded* gets cited across the restaurant web and pulled into spreadsheets, which is how Case-Shiller/Zillow/FRED numbers propagate. Embeds are the growth loop.

**Current-state audit (score 4/10).** This is the domain's biggest gap, though less barren than the prompt implies. Per-ingredient `series.json` + `series.csv` already exist on disk and are linked in each `Dataset` JSON-LD `distribution` (verified: `cost-index/ribeye/series.csv` 1.0 KB, `series.json` 2.8 KB, plus onion/romaine/tenderloin/pork-shoulder/russet siblings). What's missing: (a) **no human-visible "Download CSV/JSON" affordance** on any page — the files are machine-only; (b) **no aggregate export** (all 16 ingredients, or the basket, in one file); (c) **no embeddable widget** — zero `iframe`/`embed` references in cost-pulse or cost-index; (d) `cost-index-history.json` (431 KB) is unused by any download path. Score 4 because the data-download substrate exists but is invisible and per-item only.

**Benchmark gap (FRED widgets / Stripe embeds).** FRED offers a public REST API (JSON/XML, free key) and shareable/embeddable graphs; that embeddability is *why* FRED charts appear in thousands of articles (fred.stlouisfed.org, 2026). Muntin has the static files but not the one-click embed or the visible download that turns a reader into a distributor.

**The Extend-Past move (asymmetric).** Ship a **static, no-JS-tracking embeddable card** (`<iframe>` to `/cost-index/<slug>/embed/`, or a copy-paste `<script>` that renders from the same-origin seed) plus visible CSV/JSON download buttons and one **aggregate `index.csv`/`index.json`**. All client-side, PII-clean, CC0 — a platform won't give away an embeddable price ticker because free embeds erode its subscription; muntin *wants* the price quoted everywhere with attribution.

**Actions.**
1. Add visible "Download CSV / JSON" buttons on each ingredient page pointing at the existing `series.*` files (zero new data, just surface them). (S × 5)
2. Generate an aggregate `/cost-index/index.csv` + `index.json` (all 16 ingredients: asOf, range, trend, confidence) in the page build. (M × 4)
3. Build a static embed view `/cost-index/<slug>/embed/` (minimal CSS, no tracking, attribution + canonical backlink baked in). (L × 5)
4. Surface `cost-index-history.json` as a downloadable long-range series per ingredient (powers brief 47's charts too). (M × 4)
5. Add an "Embed / cite this" snippet block with copy-to-clipboard; client-side only. (S × 3)

**Risks & honesty-gate notes.** Embeds and downloads must remain client-side and PII-clean (privacy-first constraint; Cost Pulse's "Network tab stays empty" promise). Embedded numbers must carry the same confidence tier + asOf as the source (no stripping the uncertainty for a cleaner-looking widget). CC0 already declared in JSON-LD — keep it. Static-host/Cloudflare-safe: prefer prebuilt files + iframe over any server API.

**One proof metric.** Number of external domains embedding the widget or hotlinking `series.csv`/`index.csv` per quarter (the distribution loop).

---

### 46 · Calibration / Integrity Auditor — confidence tiers, shippable bar, no overstatement

**Aspect & why it decides success.** The entire pitch is "a number you can check, not a number you have to trust." If confidence is ever overstated, the trust premium — the whole reason to cite muntin over a black box — evaporates. Calibration is the brand.

**Current-state audit (score 9/10).** Best-in-class and already automated. Dual confidence (level + trend scored separately, headline = the lower of the two) is implemented; `data/cost-index-health.json` proves it on every build — `summary.overstated: 0`, `highEligible: 0`, and each ingredient carries `withinAuditCeiling:true` plus `toHigh` naming the single binding blocker (e.g., "add a 2nd independent-agency wholesale $ level"). The shippable bar ("ship complete or not at all") is documented and enforced; below-bar ingredients live as honest expanding-coverage pages, not faked prices (cost-index/index.html #expanding; methodology #shippable-bar). `check-cost-index-calibration.mjs` runs in CI. The summary shows 13 medium / 68 low / 20 directional across 101 tracked keys with 93 carrying a dollar level — honest breadth. Near-perfect; 1 point off only because the calibration story is mostly invisible to a non-technical reader.

**Benchmark gap (error bars / FiveThirtyEight).** 538's lesson is to *embrace* uncertainty visibly and resist suppressing it prematurely (niemanlab.org, 2020); research favors interval/quantile displays over false-precise points (flowingdata 2018; UW CSE442 uncertainty notes). Muntin computes the uncertainty rigorously but renders confidence mostly as a word-badge ("medium"), not as a felt visual interval.

**The Extend-Past move (asymmetric).** Make calibration a **visible, public integrity artifact**: surface the audit ceiling as a reader-facing "why this is "medium" and what would make it "high"" line (straight from `health.json.toHigh`), and render confidence as a band width, not just a label. A surveillance platform asserts precision to look authoritative; muntin's edge is publishing its own ceiling — the uncertainty *is* the trust signal.

**Actions.**
1. Add a reader-facing "What would raise this confidence?" line per ingredient, populated from `health.json.toHigh`. (S × 4)
2. Visually tie band width to confidence (wider, lighter band at low/directional) so uncertainty is seen, not just read — pairs with brief 43. (M × 4)
3. Publish the `summary{overstated, highEligible, byConfidence}` as a small public "integrity scoreboard" on the methodology page. (S × 4)
4. Keep `check-cost-index-calibration.mjs` as a fail-CI gate; add a test asserting `overstated === 0` can never be bypassed. (S × 5)

**Risks & honesty-gate notes.** Never let a visual simplification round a "directional" up to "measured." The audit ceiling is the law: published confidence may never exceed what data supports (methodology #confidence). No number rendered without its tier + asOf.

**One proof metric.** `health.json.summary.overstated` stays at 0 on 100% of builds (already true — keep it provably true and show it publicly).

---

### 47 · Forecast / Seasonality Analyst — USDA-outlook framing with intervals

**Aspect & why it decides success.** Operators don't only want today's price — they want "is this the season it climbs?" Honest forward framing (direction + interval, never a false-precise point forecast) is a high-demand surface the giants either gate or overstate. Done right, it deepens citations without breaking the no-forecast discipline.

**Current-state audit (score 7/10).** Stronger than expected. Two forward surfaces already exist and are bounded hard: (a) the **Pressure Lab** (cost-index/lab/) — an inferred-direction-only model (`P = Σ(weight × sign × signal)`), explicitly "a direction, never a price," gated by a hold-until-proven track record (min calls, min hit rate); (b) **seasonality** — `data/seasonality.json` (114 KB) gives a month a "typical" median+band only after 2+ distinct years, otherwise a transparent "building baseline" state (`minYearsPerMonth: 2`). The methodology forbids price forecasts and labels the pressure overlay direction-only (#pressure, #limitations). Gap: seasonal normals are computed but only lightly surfaced on the hub, and there's no USDA-ERS-style *named interval* presentation ("typical June sits in $X–$Y, 4 of 5 years") for the ingredients that have cleared the 2-year bar.

**Benchmark gap (USDA ERS / FiveThirtyEight).** USDA-ERS Food Price Outlook publishes a **midpoint + 95% prediction interval** that *starts wide and narrows* as observed months accumulate — uncertainty as a feature (ers.usda.gov FPO documentation, 2026). That is precisely muntin's "building baseline → established band" arc; muntin should adopt the framing and the honesty out loud.

**The Extend-Past move (asymmetric).** Present seasonality as an **honest, interval-bearing "typical season" read** in USDA-ERS language — a banded normal for established months, an explicit "building baseline, needs N more observations" for the rest, and never a point price. Giants either sell a confident forecast or hide the model; muntin ships the *interval and the gaps in it*, which is more useful to an operator and impossible for a rent-seeker to match without admitting their own uncertainty.

**Actions.**
1. Surface the established-month seasonal band per ingredient ("typical June: $X–$Y across 3 years") from `seasonality.json`, with the building-baseline state where not ready. (M × 4)
2. Adopt USDA-ERS framing copy ("interval starts wide, narrows as months accumulate"); label illustrative where the band is thin. (S × 4)
3. Link Pressure Lab direction + seasonal band into one "outlook" block per ingredient (direction now, season typically) — direction only, no price. (M × 3)
4. Add a CI assertion that no seasonal/forecast surface ever emits a future dollar level (extends the no-forecast rule). (S × 5)

**Risks & honesty-gate notes.** Hard line: measured levels, measured directions, inferred directional pressure — **never a price forecast** (methodology #limitations). Seasonal normals need ≥ 2 years/month; below that, say "building baseline," don't imply a normal. Pressure rules publish only after clearing the track-record bar. Numbers from `seasonality.json` only — no hand-typed "typical" figures.

**One proof metric.** Number of ingredients with an established (≥ 2-year) seasonal band surfaced, with zero forecast-gate violations across builds.

---

### 48 · Data-Journalism Lead — each week's data → a story

**Aspect & why it decides success.** The index is a standing asset; the *story* is what earns links, AI-Overview pickups, and the weekly-email open. Turning the daily read into "here's what moved and what to do" is the demand-generation engine that makes the moat compound — and it's a beat nobody else covers for independent restaurateurs.

**Current-state audit (score 5/10).** The raw material and a thin surface exist. The hub has a "What's moving now" module (currently "Nothing needs action this week — most ingredients are sitting in their usual range," cost-index/index.html) and a weekly-email signup; a related blog dispatch exists ("Restaurant prices are now rising faster than groceries," `/blog/restaurant-menu-inflation-2026/`, surfaced in the batch banner). But there's no repeatable, data-driven *weekly story* generated from the week's deltas — the "what's moving" block is calm boilerplate, and the rich `cost-index-history.json` + per-week trend data aren't being mined into narrative. Score 5: the channel and a one-off dispatch exist; the repeatable beat does not.

**Benchmark gap (The Pudding / FT).** The Pudding's model — a tight visual essay, fewer words, one clear question answered with data and a method note at the bottom (storybench.org, 2026) — is exactly transposable to "which three ingredients moved this week and why." FT's data desk pairs every move with a driver. Muntin has the drivers already (the "why it's moving" feed-grain/diesel block on each ingredient page).

**The Extend-Past move (asymmetric).** Stand up a **recurring, data-sourced dispatch** — "The Muntin Read" — built from the week's actual deltas + the existing driver overlay, in the blog under Don Goldstein's byline: 2–3 movers, each with direction, the public driver, and one operator action ("watch, don't re-price on one week"). A platform monetizes data by withholding the interpretation; muntin gives away the interpretation to become the cited voice. Each dispatch is a fresh, sourced, citable page that feeds AI Overviews.

**Actions.**
1. Define a repeatable dispatch template (movers + driver + action) populated from the week's `cost-index.json` deltas and the per-ingredient "why it's moving" data. (M × 5)
2. Make the hub "What's moving now" module data-driven (top movers by |trend|), not calm boilerplate, regenerated each refresh. (M × 4)
3. Publish under the **Don Goldstein** blog byline (blog canon — first-person narrator), with `viz-bars`/`viz-spark` figures meeting the article-graphics gate. (M × 3)
4. Mine `cost-index-history.json` for occasional "the year in ribeye" longer reads (pairs with brief 45's history export). (M × 3)
5. Wire each dispatch into the weekly email already collected on the hub; EN↔ES parity. (M × 3)

**Risks & honesty-gate notes.** Blog dispatches ship under Don Goldstein (singular operator bio — full-time FOH at Tacombi, Bethesda; never imply multiple restaurants). Every number must be a sourced/derived value or labeled illustrative — and because the dispatch may get audio, the audio-fabrication gate will read it aloud in six languages, so zero invention and numeric parity with the source article. "Association, not cause" framing for drivers (already the ingredient-page standard). New figures need `data-audio-alt` ≥ 80 + `<figcaption>`.

**One proof metric.** Weekly dispatch cadence sustained (≥ 90% of weeks) with measured email open-rate and per-dispatch backlinks/AI-Overview appearances.
