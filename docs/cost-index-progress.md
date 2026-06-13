# Cost Index — build progress & roadmap

Living record of the Cost Index / Plate effort. Update as items land. Status:
✅ done · ▶︎ in progress · ☐ todo · ⛔ gated (needs founder env/keys/counsel).

## 2026-06-13 — post-merge keyless execution (branch `…-audit-d7upo`)
Branch merged to main; the master plan (`docs/cost-index-master-plan.md`) committed.
Then executed the keyless, verifiable-now roadmap items (each shipped at 174/174 gates):
- ✅ **#9 pressure credibility** — dropped 7 mis-signed/freight-only starter rules
  (pineapple, ginger, button-mushroom, sweet-potato, corn-on-the-cob, tuna-loin,
  whole-lobster) that the category template signed against the wrong geography; added a
  non-steady-call proving floor (`minNonSteadyCalls:4`) so a rule can't earn its overlay
  by calling flat forever. 50 rules remain.
- ✅ **#6 / P0 operator price-vs-benchmark** — a private "your price" input on every
  wholesale-basis ingredient page (47 EN + 47 ES), compared live against the public
  wholesale reference. No fetch, no localStorage. Honest framing (reference is wholesale;
  delivered runs higher).
- ✅ **+ EP from your price** — same-unit pages (7 EN + 7 ES) also show the operator's
  edible-portion cost = their price ÷ the cited yield (the most actionable number).
- ✅ **P2 alias registry** — `data/ingredient-aliases.json` (15 keys, 29 generic-synonym
  stems, all staged) + `check-ingredient-aliases.mjs` (+self-test). The canonical
  distributor-tie collapse layer, fact-gated.

⛔ **Gated on founder keys/data (next, highest-leverage):** set FRED/BLS/AMS secrets +
one green cron (#2) → then verify the 47 staged sources (#3), the free low→medium BLS
trend legs (#4), and the free dairy `high` via USDA-republished CME cash spot (#5) all
light up on refetch. FBG yield-gaps (#8) need founder verification against CIA/FBG.

## Shipped (merged to main)
- ✅ Parity engines made real: `plate-advice.js`, `sales-mix.js`, `composite-price.js`,
  `observation-quality.js`, `cost-index-sources.js` (+ vector suites). [PR #421/#177]
- ✅ Plate product: `/v1/recipes` (CRUD, deep sub-recipe costing, hero loop +
  transitive recost, tier cap, RLS migration), `/v1/sales-mix`, `apps/web /recipes` UI. [PR #177]
- ✅ Free Plate Cost tool: advice panel + Ledger funnel (EN/ES). [PR #421]
- ✅ Cost Index market overlay in Cost Pulse (EN/ES): honest range, trend, confidence,
  freshness, provenance. [PR #421]

## In flight (PR #423, storefront branch)
- ✅ Shared module `tools/_shared/cost-index-ui.js` (one source of truth).
- ✅ "Where do you sit?" — your price vs the p25–p75 band + verdict.
- ✅ Orientation summary + "How we read the market" methodology disclosure.
- ✅ Trend sparkline (DOM-SVG).
- ✅ Deep anchors (`#ci-<ingredient>`) + filter (activates ≥8 items).
- ✅ Cross-wire free tools (Plate Cost ⇄ Cost Index, with Plausible events).
- ✅ Structured data: WebApplication + FAQPage + BreadcrumbList JSON-LD.
- ✅ `/glossary/cost-index/` (+ES): DefinedTerm + Article + FAQPage + Breadcrumb, visible
  FAQ matching JSON-LD, canonical OG cards rendered (SVG+PNG), full derived-artifact
  propagation (sitemap, llms.txt, RSS, hub schema, OG seed). (H1 #2 done.)
- ✅ "Your basket" persisted in the URL hash — per-card Track, basket bar (count /
  show-only-tracked / clear), composes with search. Keys only, no storage, no-fetch. (H1 #4)

## Buildable next — no external deps (Horizon 1 runway)
- ✅ Negotiation helper: when above band, an editable vendor note — copy
  (clipboard + select fallback) or mailto. Honest framing ("typical range from
  public sources"); sample-data caution; a11y disclosure + aria-live. (done)
- ✅ Plausible instrumentation — privacy-respecting (ingredient key + label only,
  never the typed price). Events: `Cost Index Price Entered` {ingredient, verdict
  above/in/below}, `Cost Index Ingredient Tracked` {ingredient}, `Cost Index Vendor
  Note` {action opened/copied/mailto, ingredient}. (H1 #5 done.)
- ✅ "Where you're overpaying most" live summary — as prices are entered, ranks the
  ingredients furthest above the typical top (p75) into one prioritized action line.
  Per-unit gaps (no cross-unit summing); aria-live, dedup'd to limit announcements. (done)
- ✅ Cross-wire Cost Pulse ⇄ Bench (vendor-benchmark): the market read vs. the
  operator's own price history — so it's clear which tool answers which question. (done)
- ✅ Confidence-aware trend honesty — on a `directional` read (thin data, no level)
  the UI drops the false-precise percent and says "up — early signal, not a firm
  number yet" instead. High/medium keep the percent. Dormant in the all-`medium`
  preview; verified via constructed directional input; ready for live data. (done)
- ☐ Shareable per-ingredient OG "market snapshot" cards. (deferred — can't honestly
  bake illustrative numbers into a shareable card; revisit once data is live.)

## Architecture reconciliation (post-merge audit, 2026-06-07)
Two Cost Index streams now coexist; a 10-point audit found NO critical conflict.
Decisions recorded so they aren't relitigated:
- **`data/cost-index.js` (preview seed) vs `data/cost-index.json` (gated output).**
  Complementary by design. `cost-index.js` ships RAW engine input; the browser runs
  `composite-price.assess()` live (no-fetch). `cost-index.json` is the fact-gated
  BAKED output written by `scripts/build-cost-index.mjs` and guarded by
  `check-cost-index-sync.mjs` (verified sources only, bounds, <120-day freshness).
  It is currently EMPTY (all sources `verified:false` — gated on founder API keys).
  DECISION: when sources are verified and the JSON populates, the browser seed
  `cost-index.js` should be GENERATED from the gated JSON (status flips
  preview→live; the UI's preview banner already keys off `DATA.status`). Until then,
  the labeled preview is correct and the surface needs no change. Do NOT hand-edit
  `cost-index.js` to fake "live" numbers — that bypasses the fact gate.
- **Duplicated stats primitives** (`median`/`percentile`/`weightedMedian`/`mean`) exist
  in both `composite-price.js` (Stream A, PARITY-mirrored to Ledger) and the Node-side
  `cost-spike.js`/`cost-basket.js`/`cost-leadlag.js` (Stream B). DECISION: leave as-is
  for now. Severity is low (deterministic math, each independently tested), and
  `composite-price.js` is under the parity contract — extracting a shared `stats.js`
  would force a mirrored refactor in the Ledger port for little gain. Revisit only if
  the math needs to change.
- **Bench vs Cost Pulse**: complementary, not duplicative (own-history hike detector vs
  market read). Now cross-linked both ways. Parity contract: single canonical source
  intact (`composite-price.js` + `cost-index-sources.js`); Stream B reuses them.

## Live wiring (2026-06-07)
- ✅ The data layer (`data/cost-index.json`) was already vendored (16 ingredients,
  fact-gated, citeable) but the surface still showed the preview seed. Built the
  bridge: `scripts/build-cost-index-seed.mjs` emits `data/cost-index.js`
  (status:'live') from the gated JSON + `data/cost-index-labels.json` (bilingual
  names/units). Renderer reads `ing.assessment` directly (falls back to the
  engine for the preview shape). Cost Pulse now shows real prices; stale "sample
  preview" FAQ copy fixed; cache-busts bumped. Bake path validated with a fixture
  (vendored 4, dropped 1 out-of-bounds). All 16 numbers verified citeable.
- ⚠️ NO historical record yet — 1 point per ingredient (butter/cheddar have 2).
  The schema accumulates up to 26 weekly points and the build merges them, but
  the orchestrator has run once. Sparklines are held until ≥4 points. The trend %
  (e.g. romaine +169%) is computed upstream from series NOT committed here, so the
  curve behind it isn't shown. To make today's prices relevant: (a) accumulate —
  run the orchestrator weekly + commit (history grows automatically), or (b)
  backfill — have the orchestrator emit historical points (FRED/BLS/AMS all carry
  history) so build-cost-index vendors the climb. Both run upstream (keys+egress).

## P2 depth — page-level reads + measured spread (2026-06-12)
- ✅ **Live edible-unit cost (Phase A.6)** on every ingredient-yield page that
  carries a live point in a matching unit: today's sourced reference price ÷ the
  page's cited yield → the number an operator repeats (ribeye $12.74/lb at 75% →
  **$16.99 edible lb**; salmon $5.58 ÷ 0.95 → $5.87). Guarded by a unit match
  (`CI_BOUNDS[slug].unit === manifest unit_en`) so we NEVER divide a $/carton
  produce price by a per-head yield — produce reads correctly skip the line. Both
  inputs are sourced, so it's a shown calculation, not a new claim. EN+ES. The
  build also renders the confidence "why", the cross-market cheapest/priciest
  spread, a level-anchored percentile, and a flagVerb buy/hold verdict.
- ✅ **Measured market spread in the level band (Phase B)** — the engine now
  widens `compositeLevel.rangeCents` to the ACTUAL reported trading range USDA AMS
  publishes (`low_price..high_price` per terminal, min-low/max-high across
  markets), not just a synthetic volatility band. `normalizeAms` captures the
  per-day band, `buildCompositeInput` threads it as `spreadCents`, `compositeLevel`
  unions it in and names the band `'measured'` whenever it sets an edge. UNION
  ONLY (never narrows); an inverted/non-positive band is dropped; a band that
  doesn't CONTAIN its own value is treated as a unit mismatch and dropped. New
  label: "band from reported market low–high". Parity-mirrored to the Ledger TS
  engine with 3 new vectors (24/24 storefront, TS harness green).
- ⚠️ **Dormant until refetch**: `spreadCents` is optional, so the 16 vendored
  points are untouched until the founder's next orchestrator run carries low/high.
  No config change needed — the band flows straight from the report columns
  (`low_price`/`high_price`, falling back to `mostly_low`/`mostly_high`). Expect
  some ranges to widen visibly on refetch (e.g. romaine), which is the honest
  picture, not a regression.
- ☐ **Founder verify pass** (their laptop, has keys): `verify --flip` the 20 new
  produce + earlier dormant batch; investigate the romaine trend (+159/169%)
  series; confirm the 6 gap yields; close striploin price-0, leg-of-lamb PDF,
  branzino NOAA.

## Trend windowing bug — fixed end to end (2026-06-13)
- 🐞 **Root cause**: the composite trend blended source series that arrived
  UNWINDOWED. USDA AMS/LMR are windowed by the fetcher (120d), but FRED/BLS/EIA
  carry their full multi-year history — so a single index source injected a
  multi-year change into the headline trend % while the level and the sparkline
  stayed recent. Result: a shown % that contradicted its OWN curve and its OWN
  spike/structural verdict (romaine read **"+159% up"** next to an *"easing /
  hold"* verdict; diesel **+371%**, electricity **+92%**). This was the flagged
  "romaine trend glitch."
- ✅ **Durable fix (orchestrator, both repos)**: `windowOutputPoints` trims every
  source's series to a shared recent horizon (`SERIES_WINDOW_DAYS`, 120d, relative
  to each source's own latest point) before composing — so level, trend and
  history share one window. Storefront `fetch-cost-index-sources.mjs#toOutputs`
  and Ledger `orchestrator.ts#composeIngredient/composeDriver` (mirrored;
  type-checked clean).
- ✅ **Live data repair (stopgap until next refetch)**:
  `scripts/reconcile-cost-index-trends.mjs` recomputes each SHOWN point's
  `trend.pct`/`dir` as `windowChange` over the exact history curve the sparkline
  draws (engine's own `windowChange` + flat band). Repaired 20 trends (16
  ingredients + 4 drivers); 10 were direction flips. Verdict flags were already
  correct and untouched — the repaired trends now AGREE with them. Seed + pages
  rebuilt.
- ✅ **Regression gate**: `reconcile-cost-index-trends.mjs --check` wired into
  `check-all` ("Cost-index trend↔curve") — a shown % that contradicts its curve
  now fails CI. 166/166.

## Depth-at-scale + reliability wave (2026-06-13)
- ✅ **Heartbeat freshness monitor** (`check-cost-index-freshness.mjs`) — the weekly
  refresh failed silently (keys lapse / sources down → exit 0, last-good kept). Now
  a persistent stall fails the scheduled run red → GitHub emails the founder.
  Warn-only in check-all (never blocks a PR on natural aging).
- ✅ **Answer-first depth on every page** — yield-breakdown table + 3-Q FAQ +
  FAQPage/HowTo JSON-LD, all from the sourced yield, EN+ES. Shared `faqItems()` so
  visible text === structured data. **Zero dollars in JSON-LD** (enforced by the new
  `check-ingredient-jsonld.mjs` price-cleanliness gate; no Offer/Product).
- ✅ **Two-way Cost-Index ↔ yield wiring** — leaf→dashboard (gated to shippable
  reads) and dashboard→leaf (gated to real pages via `yieldSlug` in the seed).
- ✅ **Manifest → `data/ingredient-yields.json`** + `check-ingredient-yields.mjs`:
  proves every rendered yield matches the cited CIA `YIELD_TABLE` (66) or declares a
  `yield_source` (5 FBG). Adding an ingredient is now a reviewable data row.
- ✅ **Routable category hubs** (`/library/ingredient-yields/<category>/`, EN+ES) —
  the taxonomy middle tier; ranked sourced yield table + guide prose; 4-level
  breadcrumb (rendered + JSON-LD); master-hub headings now link down. Sibling rail
  capped at 8 + "see all". Doorway/thin-content guard for scaling breadth.
- ✅ **Ribeye ES fix** — "costilla" (short-rib, 65%) → "bife ancho" (the actual cut).
- ☐ **Next keyless**: sitemap segmentation (now 1016 URLs), thin-content near-dup
  gate, the entity/alias layer (DefinedTerm + `sameAs` — needs *verified* aliases).

## Gated — needs founder env (the big value)
- ▶︎ **VERIFY PASS — turnkey runbook at `docs/cost-index-verify-runbook.md`.** 44
  staged sources ready to flip live; the dormant features (measured spread, EIA
  driver, live EP cost, history) light up automatically on the next live fetch.
- ⛔ H2: flip index preview → live (USDA/BLS/FRED keys); real freshness/history; last-good banner.
- ⛔ H3: `/v1/cost-index` = artifact ⨝ invoices; watchlist + alerts; market-vs-vendor → Plate
  seasonal + hero-loop production trigger (`queue.ts`); invoice-canonical ingredient binding.
- ⛔ H4: fold first-party k-anon delivered anchor into the index (antitrust counsel).
- ⛔ Visual QA (browser); refresh Ledger visual-regression baselines (CI run).

## Conventions / guardrails to respect
- Two-repo boundary: storefront = free, client-side, no-fetch, public sources only (no moat leak);
  Ledger = authenticated, live, invoice-tied.
- Storefront gates: no-innerhtml (baseline 523), no-fetch, verified-stamp, tool-header,
  fabrications, banned-words, locale-parity, hreflang, image-dims, check-tests.
- Parity contract: free-tool JS canonical ↔ Ledger TS port; vectors mirrored.
- Honesty: no fabricated live prices (preview labeled illustrative); no "live" spinner.
