<!-- Master plan. Synthesizes a 4-lens expert panel (CC-BY strategy · dataviz/
     co-movement · operator-funnel · AEO/honesty) into one coherent build map for
     the open-data explore surfaces + deep pages + new CC-BY datasets. Committed so
     any future session can resume the roadmap without re-deriving it. -->

# Open-Data & Explore Surfaces — master plan

**Thesis.** Turn muntin's already-computed cost-intelligence into a coherent
**open-data product line**: browsable *explore* surfaces + deep *detail* pages +
a family of CC-BY/CC0 datasets, engineered as **citation magnets** that feed the
cost-intelligence funnel (Cost Index → free tools → Muntin Ledger). Every surface
holds the honesty contract absolutely: wholesale is never delivered price,
co-occurrence is never cause, illustrative numbers never launder into claims, the
measured tier / Vendor-Benchmark reference / operator data are never published.

Grounded in a 4-lens expert panel (2026-07): CC-BY-surface strategy, dataviz +
co-movement design, operator/funnel value, AEO + honesty audit. This file is the
resume-here map; sequencing at the end.

---

## 1. Where we are (current state)

- **`/open/` hub** shows 4 cards. Cost Index (CC0) and Seasonality (CC0) get a
  "Browse / Learn & explore" link; **Market events and Ingredient yields are
  JSON-only** — a lone download, no browse, and the `/open/` `DataCatalog`
  JSON-LD points at the `.json`, not at a page.
- **Market events.** A decent hub exists at `/cost-index/events/` (39 curated,
  cited events; category chips; Dataset JSON-LD) — but it's **undiscoverable
  from `/open/`**, its Dataset schema is thin (no `variableMeasured`, no
  `citation`, no CSV, no `CollectionPage`, no cite block, no speakable), and the
  **432 detected moves + their co-movement cohorts are unpublished**. There are
  **no per-event detail pages**.
- **Ingredient yields.** 118 rich per-ingredient library pages already exist,
  plus a static category hub. The hub was upgraded to an **explorer v1**
  (searchable/sortable table + on-device edible-unit cost calculator + CC-BY
  JSON/CSV downloads + cite + Dataset `distribution`) and a new in-repo
  generator `scripts/build-yields-open-data.mjs` (`--check`/`--self-test`).
  The crown-jewel **live edible-unit cost is dormant** (needs the operator's
  Mac fetch to populate `data/cost-index.json`).

---

## 2. Workstreams

### A — Explore-surface depth

**A1 · Yields explorer v2** (`emitHubPage`, `scripts/build-ingredient-yield-pages.mjs`)
- **In-row yield meter** — one-hue teal fill on a neutral `--cream-2`+`--line`
  track; the % stays the visible/sortable label (CSS-only, degrades to the
  number, reduced-motion-safe). Makes "shellfish is a stub next to a near-full
  mushroom" scannable.
- **"Trim tax" column** = `1 / yield` → `×N.NN`, sortable. Pure function of the
  *sourced* yield (no illustrative `apCents`) — turns yield into money an
  operator feels: whole crab **×4.00**, lobster/clams ×3.33, ground pork ×1.00.
  Header: "Trim tax — true cost = invoice × this."
- **Category comparison** — a collapsible single-hue bar ranking of mean yield
  (citrus 46% → mushroom 88%); bars-not-hues avoids the >7-color rule for 15 cats.
- **Memorable moment** — hero: *"Whole crab keeps 25% — you buy four pounds to
  plate one,"* pairing the worst real yield with its ×4.00 trim tax.
- **Schema/AEO** — speakable `.od-answer` ("…a reference, not a price"); upgrade
  `variableMeasured` string → `PropertyValue`; add `citation` (CIA/USDA-FBG),
  `version`/`dateModified`, `publisher`, `keywords`, `includedInDataCatalog`.

**A2 · Events explorer** (`emitEventsHubPage`, `scripts/build-cost-index-pages.mjs`; linked from `/open/`)
- **432-event feed** over the *detected* moves (not just the 39 curated): one
  filter row — search, direction (spikes ▲ rust / drops ▼ teal), season, the
  existing category chips, sort (biggest move / longest / most recent) — with a
  live count and **stable per-event permalink anchors** (`#ev-eggs-2015-05-31`).
  Filter = toggle `hidden`; sort = re-append DOM (the proven yields `apply()`
  pattern). Curated 39 join in as **co-occurrence badges**, never cause.
- **Co-movement view — the novel touch-point.** An **anchored "moves-with" bar
  list** (`viz-bars`), NOT a matrix/chord/network (rejected: 78-node hairball,
  >7-color, sub-400px illegible, needs a banned layout lib, won't degrade).
  Pick an anchor ingredient → ranked list of what moved the same way, deep-linkable
  `#comove=<slug>`. **Honest measure: directed + bounded** — "in **K of X's own
  N** notable moves, Y co-moved" (fraction of the anchor's own events), **never**
  the misleading undirected global count (romaine↔red-leaf = 46 aggregates third
  parties). One teal hue (length encodes; cohorts are same-direction by
  construction, so no polarity to imply). Server-render the default anchor + hold
  the rest in an inline JSON island (no fetch, CSP-safe); rebuild ≤8 `<li>` via
  `createElement` (no innerHTML).
- **Memorable moment** — hero figure: **"94% of price shocks had company"**
  (407 of 432 detected moves had ≥1 other tracked item moving the same way in the
  same ~6-week window; 25 moved alone). Pure arithmetic, fact-gate clean, and it
  answers the operator's real question ("is it just my invoice?").
- **Outlier honesty** — clamp the magnitude *bar* ~200% and flag the known
  seasonal pack/unit artifacts (watermelon 7272% etc., reusing `SEA_ARTIFACT_CAP`);
  show the true number, don't let it dominate.
- **Palette** — direction pair rust `#A23B2D` ↔ teal `#2A50C8` (validated, CVD
  ΔE 86.5). **Dark-mode fix:** replace the failing up-variant `#ed9a8e` →
  `#d06a58`, add dark down `#6d8bf2` (CVD ΔE 76.1).
- **Schema/AEO** — bring the events Dataset up to the yields shape:
  `variableMeasured`, `citation` (surface the 106 registry sources — biggest single
  win), a flat **CSV `DataDownload`**, `CollectionPage`+`ItemList`, an on-page
  "Cite this dataset" block, speakable `.od-answer` ("…co-occurrence in time,
  never an asserted cause").

### B — Deep detail pages (AEO/SEO-maxed, cross-linked, citations easy)

**B1 · Per-event detail pages** — `/cost-index/events/<id>/` for each of the 39
curated events (EN+ES = 78 pages). Each: the cited `whatHappened` narrative, the
affected ingredients (deep-linked), the **detected moves that overlapped** (from
the 432), the co-movement neighbors, all **sources** (the 106 cites) in a drawer,
`Dataset`/`Article`+`ClaimReview`-safe JSON-LD, speakable, a cite block, and
cross-links to each ingredient's `/cost-index/<slug>/` + Vendor Benchmark. **This
is the single biggest AEO/citation play** — 39 citable, sourced, permalinked
event pages. Slugs final-forever.

**B2 · Deepen per-yield leaf pages** (`emitIngredientPage`)
- **Foreground the live edible-unit cost** (the dormant crown jewel) above the
  body/FAQ, with its "as of" date → bridge "see it move" to `/cost-index/<slug>/`.
- Reframe the weak **illustrative worked example** (operator knows the price is
  fake — keep one for method, don't multiply them); the live EP line supersedes it.
- Add the **trim-tax** line + a **cross-ingredient substitution** read
  ("cheap-per-pound ≠ cheap-per-plate," gated on both items having a shippable
  live price in matching units).
- Reframe the plate-cost CTA as **dish-level escalation** ("one ingredient's trim
  is $X — a plate has ten of them"); keep the Ledger aside.

### C — New CC-BY / CC0 open-data surfaces (the "more CC-BY" ask)

Each = a small `build-*-open-data.mjs` reshape+`--check` script (modeled on
`build-yields-open-data.mjs`) + a `/open/` card + a `Dataset` node in the `/open/`
`@graph`. **Licensing rule:** CC0 = deterministic re-derivation of public-domain
gov numbers (no creative selection); CC-BY = muntin's curation/selection/labeling
is the value-add; not-publishable = leaks the measured tier / VB reference /
proxies-as-measured / a forward forecast / operator data.

| # | Dataset | License | Why it earns citations | Effort |
|---|---|---|---|---|
| C1 | **Seasonality file** (`data/seasonality.json`, 5-yr window) | CC0 | The `/open/` card already *claims* CC0 seasonality but ships no file; "when is X cheapest" is prime AEO | **S** |
| C2 | **Revisions ledger** (`cost-index/revisions.json`, 6,535) | CC0 | Already a live file, uncarded; "we publish our own corrections" is a trust moat incumbents won't match | **S** |
| C3 | **Calibration/confidence bundle** (already live files) | CC0 | "How accurate is the index?" — proves the measured tier is measured; the whole data-company thesis | **S** |
| C4 | **Detected events + co-movement** (`data/cost-index-events.json`) | CC-BY registry / **CC0** math | The single most novel citable asset; no one publishes "every sustained move + what moved with it" | **M** |
| C5 | **Lock-or-float bands** (`data/cost-lockfloat.json`) | CC-BY | Decision-useful ("which items are stable enough to fix on the menu"), not just a number | **M** |
| C6 | **Anomaly log** (Hampel + Pettitt, `data/cost-anomaly-log.json`) | CC-BY | Journalist/academic magnet ("when did the beef market structurally break") | **M** |

**Co-movement license = CC0** (math on public-domain price series; CC-BY would
over-claim the numbers and mismatch the CC0 index it derives from).

**DO NOT publish:** internal measured-source recipe (`data/cost-index-sources.json`
— the blueprint to reconstruct the reference), master price/deep-history bulk, VB
market-context seed, Census/IMF/Comtrade-derived proxies (ADR-013; not
redistributable), forward outlook/pressure as a "prediction" product (ADR-010
ceiling), the raw data-quality audit (live defect list), anything ingesting
operator data.

### D — Citation / AEO architecture (cross-cutting)

- **Complete `Dataset` shape on every hub** (see the AEO brief's target graph):
  `variableMeasured` as `PropertyValue`, `citation`, `distribution` incl. CSV with
  `name`/`contentSize`, `version`/`dateModified`/`datePublished`, `publisher`,
  `spatialCoverage`, `keywords`, `measurementTechnique`, `includedInDataCatalog`.
- **Wire the `/open/` `DataCatalog` `@id`** — per-ingredient datasets already
  reference a `#catalog` that no node defines; give the `/open/` catalog that
  `@id` and point every hub Dataset's `includedInDataCatalog` at it (a complete
  bidirectional graph is what Google Dataset Search + answer engines walk).
- **Speakable answer-first line** on every hub + detail page (the site's
  established `.ci-answer`/speakable pattern; the explore hubs are the gap). Keep
  the guard clause ("not a cause" / "not a price") *inside* the speakable selector.
- **`llms.txt` fix** — it blanket-labels "Cost Index data files CC0"; carve out
  the CC-BY events/yields compilations to match the `/open/` prose.
- **CSV hardening** — a leading `# CC BY 4.0 — attribute "Muntin Digital", <url>`
  comment row + a `datapackage.json` / `CITATION.cff` beside each download.
- **DOI + registries (operator action, zero honesty cost, biggest citation
  driver)** — mint DOIs via Zenodo/DataCite, put them in `identifier`/`sameAs`/the
  cite string, submit to Google Dataset Search + re3data; CC0 gov-derived sets can
  also go to data.gov-adjacent registries.
- **Stable permalink anchors** on event cards + ingredient rows.

### E — Wiring, gates, parity, governance

- `/open/` cards → the explore surfaces (repoint the two Dataset `url`s).
- **Gates:** `build-yields-open-data --check` (done); add `build-events-open-data
  --check` + `--self-test`; extend `check-cost-index-events.mjs` to scan the
  co-movement render for `correlat|predict|leads|driven by`; a per-event-page
  structure/self-test; add the new `build-*-open-data --check` to `check-all` +
  the deploy chain + the refresh workflow.
- **EN/ES parity** (directory-mirror) + hreflang + sitemap; per-event ES pages
  render English source text with Spanish framing (the events-registry constraint).
- **ADR-015** (new): open-data explore surfaces + co-movement honesty (co-movement
  as a `DefinedTerm` = "same-direction move within ±6 weeks; a shared episode, not
  a measured relationship"; no coefficients/leads/lags).
- **CTA canon** — the new funnel bridges (events → Vendor Benchmark; volatility →
  lock-or-float; yields → plate-cost escalation) must map to canonical verbs or be
  added to the canon deliberately (founder owns the verb set).

---

## 3. Funnel map (earned, non-filler)

- **Events → Vendor Benchmark** — the market-vs-vendor read: "the reference is
  calm but your price isn't → check your invoice against this reference." Honest by
  ADR-012 (VB reads the reference's own state, never claims overpayment).
- **Events → lock-or-float (Cost Pulse)** — volatility class → "this is a float
  line; see the lock-or-float call + cushion band."
- **Yields → Cost Index** — the live, weekly-moving edible-unit cost.
- **Yields → Plate Cost** — dish-level escalation ("a plate has ten trim haircuts").
- **Both hubs → open CC-BY dataset + cite + JSON-LD** — the top-of-funnel
  citation engine; *this is the data-company thesis*, not an operator touch-point.

**Cut as filler:** static fake-price worked examples as a centerpiece; the bare
co-movement "Affected: slug, slug" list (only leverage if reframed as
concentration/substitution risk); treating yield-% as if it's the value; the
AP→EP calculator pitched as "compute this" (its only honest job is "see the money
you're not counting").

---

### F — Educated-inference / research pages (truly-Muntin repackaging)

Not aggregation — **original analysis** that repackages the open data into
something legitimately useful to a DMV independent operator, and that no
aggregator produces. Each is a crafted, individually-built page (Muntin Desk
byline in the library; or `/learn/research/` where the house already ships
original research), honesty-gated (**descriptive/computed, never a forecast**
per ADR-010; co-occurrence never cause; every number sourced or labeled).
Candidate slate (build/audit/iterate each individually):

- **"What actually moves together"** — the honest co-movement clusters (the
  lettuce complex, the beef complex…) from the 432-event cohorts; the operator
  read is *menu-concentration risk + substitution futility* (swapping within a
  cluster buys nothing).
- **"The trim tax across the pantry"** — the money operators never count, from
  the yields table (×1/yield); which categories punish trim most.
- **"Steady vs wild"** — a volatility taxonomy for menu engineering (print the
  steady items; put the wild ones on market price), from the per-ingredient
  volatility class.
- **"How long do food-price shocks last?"** — the recovery-time study from
  `durationDays` across 432 detected moves (historical, "big moves have held ~N
  months," explicitly not a forecast).
- **"The cheapest-month buying calendar"** — from the 5-yr seasonality normals.
- **"Reading your invoice against the wholesale reference"** — the market-vs-vendor
  method piece (bridges Vendor Benchmark), honest by ADR-012.

Each research page is a citation magnet (Article + Dataset-cite JSON-LD,
speakable, sources drawer) AND a funnel entry, and each cross-links the relevant
explore surface + tool. This is the "data company, not data aggregator" line.

## Site reinvigoration (queued — keep in view)

A complete site reinvigoration is separately queued (see the strategic board).
These open-data surfaces + research pages are built to **fit** that redesign, not
fight it: house tokens/chrome only, no bespoke one-off visual systems, so the
reinvigoration can restyle them centrally. Revisit alignment before Phase 5.

## 4. Sequencing

- **Phase 0 — done.** Yields explorer v1 (`612b33e58`).
- **Phase 1 — S, quick wins (high visibility, low risk).** Card the 3
  already-computed CC0 datasets (C1 seasonality file, C2 revisions, C3
  calibration); fix `llms.txt`; wire the `/open/` `DataCatalog` `@id`; link the
  existing events hub + the yields explorer from `/open/`.
- **Phase 2 — the AEO/citation play.** Events explorer A2 (feed + co-movement +
  CSV + schema + speakable) **and** per-event detail pages B1.
- **Phase 3 — depth.** Yields explorer v2 (A1) + deepen per-yield leaves (B2).
- **Phase 4 — novel datasets.** C4 detected events+co-movement, C5 lock-float, C6
  anomaly log; DOI + Dataset Search prep.
- **Phase 5 — governance.** ADR-015, gates, CTA-canon entries, final adversarial
  audit.

## 5. Open forks (founder's call)

1. **Ambition/sequence** — full build-out (all phases) vs a first slice (Phase
   1 + 2) then reassess?
2. **Per-event detail pages** (B1) — 39 curated events → 78 EN/ES pages. Confirm
   (biggest citation play, but the most new surface area).
3. **Live edible-unit cost** (yields crown jewel) needs the operator's Mac fetch
   to populate `data/cost-index.json` (keys+network the container lacks). Ship the
   surfaces ready-to-light, and you run the fetch — confirm.
4. **DOI + Google Dataset Search** — an operator action (Zenodo account). Want the
   `datapackage.json`/`CITATION.cff` prepped now?
5. **CTA canon** — add the earned bridge verbs, or map to existing?
