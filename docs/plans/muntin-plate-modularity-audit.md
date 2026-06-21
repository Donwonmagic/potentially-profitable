# Muntin Plate — Modularity & Coverage Audit (every tool combination earns its keep)

*Audit of where the Plate insight layer stands against a single test: **does each subset of connected tools get a great standalone experience, without being forced to adopt the others?** Grounded in a code read of the Ledger (`Muntin-Invoice-Decoder/apps/api`) routes, stores, and the storefront catalog. 2026-06-21.*

## Context — why this audit

The insight catalog (`muntin-plate-insight-catalog.md`) defines each insight by its **inputs** (invoices × recipes × Cost Index × inventory × POS × yields × cohort). The product promise is **modularity**: every tool is valuable alone and better together — an operator who connects only invoices, or recipes-but-not-invoices, or refuses to share recipes at all, must still get incredible, actionable insight. The risk is **silent recipe-gating**: the strongest new insights (E1, E2) flow through recipe lines, so a non-recipe operator gets an empty payload with no explanation. This audit maps coverage across the realistic combinations, names where insights go dark, and prioritizes the fixes that make each tool a complete product on its own.

## The modular building blocks (what an operator can connect)

| Tool / dataset | What it is | Operator action to connect |
|---|---|---|
| **Cost Index** | public market rate-of-change, 100+ ingredients | none — always on (free) |
| **Invoices** (Ledger core) | `line_item_observations` (vendor, `canonical_id`, `cents_per_base`) | forward/scan invoices |
| **Recipes** (Plate) | `org_recipes` + `recipe_line_items.canonical_id` | build recipes (optional; privacy-sensitive) |
| **Inventory** | counts, pars, days-of-cover | periodic counts |
| **POS / sales** | `v_sales_weekly` (Square or manual paste), covers | connect Square or paste sales |
| **Learned yields** | `recordYieldObservation` | weigh-and-record (V2) |
| **Cohort** | k-anon peer pool | opt-in (counsel-gated) |

The first principle the audit confirms: **invoices are the spine; everything else is an optional enrichment that never blocks invoice operations.** That is the right architecture for modularity. The question is whether each *other* subset, and each *partial* combination, is served.

## Insight → dataset dependency map

| Insight | Invoices | Recipes | Index | Inventory | POS | Notes |
|---|:--:|:--:|:--:|:--:|:--:|---|
| **E12** market-implied teaser | – | template | ✓ | – | – | needs nothing — the funnel floor |
| **E3** pack-shrink | ✓ | – | ◐ | – | – | invoice-only (index only for "market flat" clause) |
| **E2** vendor-vs-vendor | ✓ | ◐ | – | – | – | **invoice-only**; recipes only to add $/week |
| **E10/E11** cohort percentile | ✓ | – | – | – | – | invoice-only; opt-in/counsel-gated |
| Ledger-native: vendor-pricing-scorecard, cash-flow-forecast, use-tax, price_creep, reorder_due | ✓ | – | – | ◐ | – | already shipped, invoice-only |
| **E1** vendor-vs-market on the dish | ✓ | ✓ | ✓ | – | – | dish-level → recipes required by design |
| **E4/E5/E6** silent-bleed / blast-radius / margin-map | ✓ | ✓ | – | ◐ | – | recipe fan-out |
| **E9** yield-beats-book | ✓ | ✓ | – | – | – | + learned yields |
| **E7** buy-now-vs-wait | ✓ | – | ✓ | ✓ | – | invoice + inventory |
| food-cost % (Ledger-native) | ✓ | – | – | – | ✓ | actual COGS ÷ sales |
| **E8** theoretical-vs-actual | ✓ | ✓ | – | ✓ | ✓ | the full-stack crown (V3) |

(✓ required · ◐ enriches but optional · – not used.)

## Coverage by operator profile — today vs. the gap

The heart of the audit. **Built** = works now; **Gap** = silent/empty today; the **one fix** column is the single highest-leverage build to complete that tier.

| Profile (who) | Gets today (built) | Goes silent (gap) | The one fix |
|---|---|---|---|
| **Cost Index only** (prospect, no account) | E12 market-implied teaser (storefront free tool) | — | (none — this tier is complete) |
| **Invoices only** *(incl. "won't share recipes")* | verdicts; vendor-pricing-scorecard; cash-flow / use-tax; **✅ E2 vendor-switch (`/v1/insights/vendor-switches`, gap% + add-recipes nudge)**; **✅ E3 pack-shrink (`/v1/insights/pack-shrinks`)** | cohort (dormant) | activate cohort (post-counsel) |
| **Recipes only** *(pre-invoice / won't share invoices)* | plate `/cost` with manual prices; **✅ unpriced lines now cost from the Cost-Index market estimate** (labeled, confidence-docked) | — | (tier now complete) |
| **Invoices + Recipes** | E1 vendor-vs-market (wired end-to-end), E2 per-recipe + digest, recost hero loop, `/cost`, **✅ E4 silent-bleed (`/silent-bleed`), E5 blast-radius (`/blast-radius`), E6 margin-map (`/margin-map`) — all routed** | E9 learned-yield (V2) | E9 (needs learned yields persisted) |
| **Invoices + Inventory** | days-of-cover, reorder_due, inventory cost-index valuation; **◐ E7 buy-now-vs-wait brain built** (engine + honest `trendToVerdict`, parity-locked + node-validated) | E7 read-path (the inventory join) not yet routed | wire E7's `reorder`-style coverage assembly → `buildBuyOrRideFromContext` |
| **Inventory only** | counts visible; reorder_due (needs invoice cadence for cover) | theoretical usage dark (needs recipes); cover null w/o invoice cadence | name the dependency + manual buy-rate |
| **Invoices + POS** | food-cost % (actual, weekly), daypart, prime-cost | no link to dish theoretical (needs recipes) | (full only at the crown) |
| **Full stack** (inv+rec+inventory+POS) | everything above | **E8 theoretical-vs-actual** (V3 hero, not built) | E8 (the crown) |

### What this reveals
1. **The floor is already strong.** Invoices-alone is *not* a barren tier — the Ledger ships price-hike/creep verdicts, the vendor-pricing scorecard, cash-flow forecast, and use-tax watch, none of them recipe-gated. The "won't share recipes" operator is already a real customer. **This is the modularity win to protect and build on.**
2. **The two best invoice-only insights are the ones missing.** E2 (vendor-vs-vendor "found money") and E3 (pack-shrink "the silent hike") are, per the catalog, *invoice-only* — yet E2's only server path iterated recipe lines (silent for non-recipe orgs) and E3 wasn't wired into the Ledger at all. **This was the #1 gap — now CLOSED:** both ship as invoice-only `/v1/insights` surfaces, the vendor-switch one with a graceful "add your recipes to see the $/week" nudge.
3. **Recipes-only can't see an estimate.** Inventory valuation already falls back to the Cost-Index market price (`resolveCostIndexCentsPerBase`), but `plate-cost` does not — a recipe line with no invoice and no manual price contributes `$0`, not a labeled market estimate. A pre-invoice operator can't get a costed plate, so E12's promise ("a dish like yours would feel ~+$0.20") never landed *inside* Plate. **(Now CLOSED — `plate-cost` estimates unpriced canonical lines from the index, labeled + confidence-docked.)**
4. **There was no orchestration layer. (Now CLOSED.)** Previously no `hasRecipes/hasInvoices` signal and no "here's what you have, connect X to unlock Y" surface — each route returned its data or an empty array and the UI had to infer the tier from emptiness. **`GET /v1/insights/capabilities` now makes the ladder legible:** it reports the connected tools + each insight's availability and unlock prompt, so a missing tool reads as "one tap from more," not "nothing here."

## The modularity design principle (make it binding)

Three rules that turn "silent empty" into "complete at every tier":

1. **Every tool is a complete product alone.** Invoices → the cost-watch + vendor + cash-flow surface. Recipes → a costed menu (with estimates pre-invoice). Inventory → par/cover/reorder. POS → food-cost %. None requires another to deliver its core value.
2. **Graceful degradation is *named*, never silent.** The catalog's honesty spine already says "name what's missing, never present partial as complete." Extend it: when a dependency is absent, return the partial insight **plus the one-tap to unlock the fuller one** — "You're paying 14% more for mozzarella with Sysco. Add it to a recipe to see the $/week." A missing tool must read as an *unlock prompt*, not an empty screen.
3. **No forced bundling; privacy is first-class.** The "I won't share recipes" operator gets the entire invoice-only catalog (E2, E3, cohort, scorecard, cash-flow). Recipe-bound insights are an *opt-in deepening*, never a tax on the base experience. **✅ Realized:** the recipe hub (`GET /v1/recipes/hub`) is the pre-first-recipe surface — what Plate is, the benefits, and a *grounded* safety story (row-level isolation → no other operator/vendor sees them; the only cross-operator data is opt-in-off, anonymized invoice ranges, never recipes; no-AI; deletable) — so adding recipes is an informed, trust-first choice, not a leap of faith. (The whole recipe-tier catalog — E4 silent-bleed, E5 blast-radius, E6 margin-map — is now routed on the Ledger, so the deepening is real the moment the first recipe lands.)

## Prioritized recommendations (value × ease)

1. **✅ SHIPPED — Ungate E2 (invoice-only vendor-switch).** `recipes-store.listOrgCanonicals(orgId)` (canonicals + vendor count, `line_item_keys` GROUP BY, no recipe join) → `digestAllVendorSwitches` → `compareVendors`/`buildVendorSwitch` at `GET /v1/insights/vendor-switches`. Gap% invoice-only; $/week added when recipes exist; **gentle "add your recipes" nudge** fires only when a real opportunity is missing its $/week. One engine, two depths — the modularity principle realized.
2. **✅ SHIPPED — E3 pack-shrink (invoice-only).** Built as a read surface `GET /v1/insights/pack-shrinks` (`pack-shrink.ts` port + `digestPackShrinks` scanning each canonical's per-vendor series for a pack change) — same value as an ingest verdict, lower risk. *(Follow-up: also emit a `pack_shrink` verdict at ingest for the live feed.)*
3. **✅ SHIPPED — Cost-index estimate fallback in `plate-cost`.** A canonical line with no invoice/manual price falls back to `resolveCostIndexCentsPerBase` via an injected resolver wired in `costRecipeTree` (`source:"market_estimate"`, `warning:"estimated"`, new `estimatedCount`, confidence docked — never "high" with estimates, "low" when they carry half+ the plate). A pre-invoice operator now gets a costed plate; E12 lands inside Plate.
4. **✅ SHIPPED — A capability / insight-index surface (the modularity spine).** `GET /v1/insights/capabilities` returns `{connected:{invoices,recipes}, insights:[{key, available, deeper?, unlock?}]}` (EN/ES), driven off cheap presence checks (`listOrgCanonicals` for invoices, `activeRecipeCount` for recipes). Each insight reports whether it's available and the one tool to connect for each that isn't — the per-card nudge generalized into a legible tier ladder. *(Follow-up: extend the connected-map + insight list to inventory & POS as those surfaces land.)*
5. **✅ SHIPPED — The recipe-tier catalog (E4/E5/E6) routed on the Ledger.** `GET /v1/recipes/silent-bleed` (the week's `price_hike` recosts ranked by covers-weighted $/week — `silent-bleed.ts` + `recentHikeImpacts` + `digestSilentBleed`), `GET /v1/recipes/blast-radius` (ingredients across ≥2 dishes — `blast-radius.ts` + `digestBlastRadius`), `GET /v1/recipes/margin-map` (dishes past the owner's target — `margin-map.ts` + `marginMapForOrg`). The Invoices+Recipes tier now gets its full deepening, not just E1/E2.
6. **Activate cohort (E10/E11) post-counsel** *(the universal invoice layer)*. Peer percentile is the one insight every invoice operator gets regardless of any other tool — the latent floor-tier upgrade once the antitrust gate clears.

**Sequencing:** 1 + 2 close the floor-tier gaps (most operators, least dependency). 3 unlocks the recipes-only entry. 4 makes the whole ladder legible (and de-risks every "empty" payload). 5 completes the Invoices+Recipes deepening. 6 waits on counsel.

## Verification (how to confirm modularity holds)

- **Per-profile smoke test:** seed an org with each subset (invoices-only, recipes-only, +inventory, +POS, full) and assert each returns a non-empty, honest insight set — or, where a tier is genuinely empty, an *unlock prompt* rather than `[]`.
- **The "no forced bundling" test:** an org with invoices + a deliberately-empty recipe book still gets E2/E3/scorecard/cash-flow — never a dead dashboard.
- **The honesty test (unchanged):** every degraded/estimated insight is labeled (market estimate, partial coverage, gap%-without-$) — graceful degradation never silently fabricates the missing dimension.
- **Parity:** the invoice-only E2 card and the recipe-dish E2 card share `compareVendors`/`buildVendorSwitch` (one engine, two depths) — no divergent logic per tier.
