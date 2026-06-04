<!-- Muntin product plan — committed for persistence. -->
> Recorded from the working session plan so it persists in the repo. The live status + go-live sequence is in docs/cost-index-status.md.

# MUNTIN PLATE — Complete Launch Plan

*22-specialist synthesis (4 pods: Product/Data/Domain · Empowerment/Insight · Go-to-Market/Growth · Viability/Trust/Measurement), grounded in a deep read of both repos. 2026-06-02.*

## Context — why this, why now

Muntin runs the *learn* layer (storefront) and the *file* layer (Ledger). Operators have a **menu** (what they sell) and a **stack of invoices** (what it costs) — and nothing connects them. **Muntin Plate is that bridge.** It binds each dish to the real prices the operator actually paid, so plate cost, margin, and menu price stay *live* — and the moment a vendor raises a price, Plate names the dishes that just got less profitable, by how much, and hands the owner a one-tap fix. That is the founder's north star made literal: *"empowerment of business owners through easily accessible data with actionable insights."*

**Why now:** recon confirmed the hard parts are ~80% built and scattered. `dish-drift.js` already turns "price moved → per-dish $ + ranked ingredient drivers." `portion-bridge.js` already does AP→EP→per-portion (fail-closed on unit mismatch — never guesses). Ledger already normalizes price to `unit_price_cents` per base unit, resolves product identity across vendor relabels via `canonical_id` (migration 0023), and fires a deterministic `price_hike` verdict (8% AND $5 dual floor). The MVP is **wiring four finished halves together** behind three new RLS tables.

**Founder decisions locked (2026-06-02):** (1) Plate ships **included in Solo $25 with a generous recipe cap**; higher tiers gate *scale* (unlimited recipes, staff editing, multi-location, accountant cockpit), not capability. (2) **Full parallel launch** — storefront demand engine + Ledger MVP together.

## What Plate IS (and is NOT)

**One line:** *Muntin Plate connects your invoices to your recipes, so the day a vendor raises a price you know exactly which dishes stopped making money — and what to do about it.*

**IS:** live per-dish cost/margin from real invoice prices; the hike→dish alert; defensible menu-price recommendations. **IS NOT:** a recipe manager/cookbook (no plating photos/prep notes), not inventory/ordering/PO (never becomes inventory — that's MarginEdge's swamp), not a POS/sales-mix tool at MVP (it computes *theoretical* plate cost, labeled honestly), not an LLM product (deterministic, auditable — a feature we sell). Naming fits the `Muntin <Noun>` canon; slug `/recipes/`.

## The hero loop — the soul of the product

A **notification, not a dashboard** (operators don't open dashboards; they want to be *told*):

> *"Romaine is up 14% this week (Sysco). That's **+$0.31/plate** on Caesar and **+$0.22** on Cobb — about **$47/week** at your covers. Re-price Caesar to $14, or trim the portion ½ oz to hold margin. [Re-price] [Re-portion] [Hold] [Dismiss]"*

It fires weekly, unprompted, off data the operator already uploads for invoice-decoding — **zero marginal effort, enormous value.** Built by wiring the existing `price_hike` verdict stream into the existing `dish-drift` math, server-side, emitted into the existing `/insights` surface.

## The empowerment discipline (governs every screen)

**The ship test:** *A tired, non-finance, EN-or-ES operator, on a phone, between tickets, can in 5 seconds name the dish, feel the dollars in $/week, see the one move, trust the math, and act with one tap — or be told they're fine and put the phone down.*

- **No number ships naked.** Every figure pairs, in one eye-span, with a plain-language meaning + exactly ONE recommended action. Second option behind a "more" tap.
- **Loss-aversion framing:** never "+8%," always "quietly costing you $74/week across 3 dishes."
- **Anchor on the owner's OWN target margin** (asked once at setup, default 30% labeled as a starting point), never a textbook benchmark.
- **Blame the price, not the owner** ("beef went up," never "your costs are too high"). Recoverable + small + caught-in-time.
- **Trust via receipts:** every number taps open to `2 oz mozzarella × $0.71/oz = $1.42 — from your Sysco invoice, May 28 [view line]`. Boring, checkable, *theirs*. Low-confidence is labeled and never the hero number; missing prices say "we don't have this yet," never a guess.
- **Plain language, grade-6 / CEFR-B1:** "what's left after ingredients" not "contribution margin"; teach jargon inline in parentheses. **EN + ES first-class** (write Spanish, don't translate; "platillo," "carne molida," "te está costando ~$74 por semana"). USD in both; dates spelled ("28 de mayo").
- **Kitchen-phone a11y:** ≥48dp targets, primary action full-width in thumb zone, AAA contrast on hero number, color+icon+word (never color alone), real `<table>` semantics, offline-tolerant with calm timestamps, tap-don't-type (pre-filled actions), CLS-safe skeletons.

The product spec, stated as the sentence the owner can say afterward: ***"My chicken parm quietly started losing me $60 a week, so I bumped it a dollar — fixed."***

## Architecture & build (reuse-first)

**Reuse map (the four halves):** `tools/_shared/dish-drift.js` (price-move → per-dish $ + ranked drivers) · `tools/_shared/portion-bridge.js` (`quoteAtPortion`, fail-closed `compatible:false`) · `apps/api/src/lib/verdict-compute.ts` (`computePriceHike`, 8%+$5) · `product_canonical.canonical_id` (migration 0023, survives vendor relabels) + latest `line_item_observations.unit_price_cents`. Plus `stem.js`/`sku-match.js` for ingredient identity and `plate-cost.js` math (yield table, contribution margin) ported from the storefront.

**New Neon tables (migrations 0034+, additive, FORCE RLS fail-closed on `app.org_id`, `org_id` denormalized onto child rows for tight recost loops):**
- `org_recipes` (name, yield_portions, menu_price_cents, category, is_subrecipe)
- `recipe_line_items` (recipe_id, **canonical_id** | subrecipe_id | manual_price_cents, display_name, portion_qty, portion_unit, yield_percent, **waste_percent separate from yield**, sort_order)
- `recipe_cost_snapshots` (plate_cost_cents, food_cost_pct, contribution_margin_cents, priced_at, trigger ∈ invoice|recipe_edit|price_hike|manual, **source_observation_ids JSONB for provenance**)

**The loop, server-side:** `price_hike` verdict per `canonical_id` → find `recipe_line_items` rows on covering index `(org_id, canonical_id)` → recompute recipes → write snapshot (`trigger='price_hike'`) → port `dish-drift.compute` for $/week impact → emit notification card into `/insights`. Sub-recipes recurse via `subrecipe_id` (memoize shared prep). **Recipes are the most sensitive data Muntin holds** — per-org RLS + KMS field-encryption on recipe contents/quantities + no-LLM + GDPR Art. 20 export (a *selling point*: "leave anytime with your recipes").

**Phasing:**
- **MVP — live plate cost + the hike loop.** `/recipes/`, the 3 tables, invoice-line autocomplete picker, AP→EP via portion-bridge, manual fallback for off-invoice items, food-cost % vs 28/30/33 targets, **contribution margin in $**, the hero notification with re-price/re-portion fork. *Zero new external deps.* This alone justifies $25.
- **V2 — trust + depth.** Sub-recipes/prep (batch yields), operator-learned yields persisted per-org (override the CIA table), menu-engineering rollup (stars/dogs), per-dish price-history sparkline (`dishCostHistory` model), seasonality awareness (transient spike vs structural).
- **V3 — theoretical vs actual + cockpit.** POS sales-mix import → real covers → theoretical-vs-actual variance (exposes waste/theft/over-portioning), accountant cross-client cockpit, vendor-substitution suggestions.

## Domain truths Plate MUST get right (or chefs close the tab)

AP vs **EP/yield is the whole game** (cost on EP, never AP). **Yield ≠ waste** (intrinsic vs operational — schema separates them). **Theoretical ≠ actual** food cost — label it *"theoretical plate cost, your best case"* or operators reconcile against the P&L, see a gap, and distrust the tool. **Batch vs plate** (divide by *actual yielded* portions, account for reduction). **Sub-recipes are not optional** (the bun and the house sauce are recipes). **Pack-size is the silent killer** (24ct→20ct at "same price" = 20% hike the invoice hides — cost per base unit, which Ledger already normalizes). **Seasonality** (don't scream "re-price!" on a February tomato spike that reverts). **Operator-learned yield always overrides the textbook.**

## From cost to a price the owner trusts (never "cost ÷ 30%")

The cost target is the **floor, not the answer.** Layer: **charm rounding** matched to the menu's own convention ($13.47 → $14 or $13.95, detected from other dishes' prices); **anchoring to the menu's price ladder** (flag when a cost-driven re-price would break it); the **re-price / re-portion / absorb fork** by elasticity (raise price on inelastic signatures, re-portion elastic anchors, absorb loss-leaders); optimize **contribution dollars × covers**, not food-cost %; **state confidence** and widen the band rather than print false precision. Deliverable is a *judgment*, not a quotient.

## Monetization (decision: Solo $25, generous cap)

- **solo $25** — invoice capture + verdicts + **live Plate with a generous recipe allowance** (best-sellers + room). The free→paid funnel's destination; the reason a margin-anxious owner pays at all.
- **team $60** — **unlimited recipes**, staff invites (kitchen/manager edit recipes), multi-location dish rollups. Scale, not capability.
- **accountant $150** — Plate across a book of clients, the cross-client margin cockpit ("every client whose food cost crossed 33% this month") — a resellable advisory service.
- **Free↔paid bridge (honest, not bait-and-switch):** the free storefront calculator fully answers the *one-time* question (typed prices, on-device, "Network tab stays empty"); paid Plate sells *recurrence* — "keeps it costed forever with your real invoice prices, and tells you the day it changes." Free recipe pre-fills into signup (zero re-entry). CTA: *"Stop re-typing prices. Connect your invoices →"*

## Go-to-market

**Positioning:** new narrow category — *"a costing sheet that updates itself" / a smoke detector for your margins* — NOT "recipe costing software" (crowded, signals heavy onboarding). Hero message: **"Know which dishes stop making money the day a price changes."** Wedge vs MarginEdge/R365/xtraCHEF/MarketMan: **simpler** (10 min to value, not a 3-week implementation), **cheaper** ($25–150 flat vs $300+), **private** (encrypted, no-LLM, never pooled, portable), **for independents** (built by Don Goldstein, a real working FOH operator), **bilingual**, **deterministic-trust**. The real competitor is the owner's **spreadsheet** — and the one thing it can never do is re-cost itself when a price moves.

**Growth loops:** (A) free calculator → "keep this live" → Ledger trial (the money loop); (B) **shareable recipe-cost cards** ("made with Muntin") spreading in owner FB groups + to accountants (viral + BD in one); (C) the **Muntin Restaurant Cost Index** flywheel — anonymized opt-in price-movement data becomes recurring PR/SEO that refills the funnel. Plus Vendor Bench → Plate ("found a cheaper vendor — see which dishes that changes").

**SEO (extend the existing build-script machine):** own transactional heads ("recipe/food/plate cost calculator," "menu pricing"), re-pricing territory ("raise menu prices without losing customers," "ingredient prices going up what to do"). **Programmatic page sets:** per-ingredient cost & yield pages (chicken breast, ground beef, salmon, olive oil… hundreds, each → calculator + "track this in Plate") and per-dish pricing guides ("how to price tacos/burgers/pizza/wings"). Internal-link up to glossary (food-cost, edible-portion, yield-percent, contribution-margin, prime-cost, menu-engineering — all live), out to the free tool, on to the Plate CTA. Ensure clean structured data + llms.txt so AI answer engines cite Muntin.

**Lifecycle (privacy-first, action-triggered, EN/ES):** nurture (free → "your costs aren't frozen" → "the day chicken went up 12% — which 6 dishes lost money?" → trial); onboarding to activation (cost first best-seller → **connect one invoice** (the unlock) → watch a price move); retention trio — **weekly "your costs moved" digest** (the rhythm) + **price-hike alert** (the re-engagement spike, the single most important notification) + **re-pricing nudge** (insight → action) + personalized monthly Cost Index cut.

**Partnerships (effort÷payoff):** Tier 1 — **bookkeepers/accountants** (Ledger has the accountant tier; cost cards are their natural artifact), food-cost educators/creators, restaurant associations & chambers. Tier 2 — POS imports (Square/Toast/Clover, start with CSV/menu import), culinary schools. Tier 3 — distributors (slow/political; later).

**PR/community:** lead with the **operator founder story** (Don, Tacombi: "I got tired of finding out a dish stopped making money a month too late, so I built the tool I wished I had"). News hook = the **Cost Index** ("independent restaurants saw food costs move X% this quarter" — press will run that, the app they won't). Be where owners are: r/restaurateur, r/KitchenConfidential, FB owner groups, association newsletters, LinkedIn. Mission framing (true, not gimmick): *leveling the data playing field for independents* — give the solo owner the margin visibility a 200-unit chain's analytics team has.

## Trust, privacy, legal

Recipes = competitive secrets: per-org RLS, KMS encryption, no-LLM, never to third parties, Art. 20 portable. **Peer benchmark ("your carnitas food cost vs peers") stays DORMANT** until: opt-in (default off) + **k-anonymity k≥10** in a cuisine/region cohort + **aggregate food-cost-% / margin ratios only, never prices or recipe contents** + **antitrust counsel** (price/cost pooling among competitors is real Sherman-Act exposure). This is exactly why Bench shipped with its peer layer dormant — the same guardrail extends here.

## Onboarding (the make-or-break: getting the first recipe IN)

**Ingredient picker = the org's own invoice line items** (the unfair advantage — they're picking pre-priced things they already buy, resolved via `stem`/`sku-match`). **"Cost your 5 best-sellers first"** (bounded, not the whole menu). **Cuisine templates** (taqueria/pizzeria/café). **Paste-to-parse** a plain-text recipe (deterministic, no-LLM). **UoM helper** (case→cup) with explicit confirmation. **Progressive disclosure** — useful at 2–3 bound lines; confidence meter fills as they bind more. **Target: first live plate cost < 60 sec; first valued insight < 10 min.**

## Measurement — North-Star: "Live Recipes Acted Upon"

*Recipes kept bound to live invoice prices that produced an insight the owner acted on (re-priced / changed behavior) in the trailing 90 days* — fuses "live" + "acted-upon," rewards behavior change not data entry. **Activation:** first best-seller live-costed < 10 min. **Inputs:** recipes/org, % via invoice-picker vs free-entry, % "fully covered," verdict→re-cost rate. **Retention:** recipes still live at 30/60/90d (decay = churn signal), logins triggered BY a hike alert. **Empowerment proof:** re-pricing events after a flag (the behavior change), solo→cap→team upgrades, free→paid conversion. All server-side/first-party (cookieless honored). Honest limit: we see in-app re-pricing, not the printed menu — pair with an opt-in "did Plate change a decision?" micro-survey; don't fake certainty.

## Top risks & mitigations

1. **Wrong cost → bad pricing decision → trust destroyed** (most fatal) → show-your-work receipts, sanity warnings, determinism.
2. **Data-entry burden kills activation** (most likely to kill, quietly) → the invoice-line picker (attacks this *and* #1 at once), templates, paste, "5 best-sellers."
3. **Incomplete invoice coverage** → flag partial costs explicitly ("3 of 8 ingredients not yet from invoices"); never present partial as complete.
4. **Ingredient-match errors / UoM mismatch** → confirm-once-reuse picker, fail-closed `portion-bridge`, conversion confirmation.
5. **Scope creep into inventory/BOM** → hold the line: costing ≠ inventory.
6. **Cannibalizing the free tool** → free stays genuinely good (static-typed); paid is the *living* version. Never cripple free.
7. **Theoretical-vs-actual confusion** → label honestly; make the gap the V3 hero, not a hidden error.
8. **Premature peer benchmark / antitrust** → stays dormant until opt-in + k-anonymity + counsel.

## Execution — two tracks in parallel (the full launch)

**Track A — Storefront demand engine (cheap, fast, no Ledger build):** refresh the free calculator's exit moment + "keep this live" handoff; build the shareable recipe-cost card; ship the first batches of per-ingredient and per-dish programmatic pages; stand up the EN/ES lifecycle sequences; compile the inaugural Cost Index. *Files:* `tools/plate-cost/*`, `scripts/build-*-pages.mjs`, `data/tools.json`, `data/tool-knit.json`, `data/ledger-cta.json`.

**Track B — Ledger MVP (the hero loop):** migrations 0034+ (3 RLS tables), `/recipes/` UI (editor grid, dish list, the `/insights` hike card), invoice-line picker, port `dish-drift`/`portion-bridge`/`plate-cost` math server-side, wire `price_hike` → recost → notification, Stripe entitlement (Solo cap + Team unlimited). *Files:* `infra/postgres/migrations/`, `apps/api/src/routes/recipes.ts` (new), `apps/api/src/lib/`, `apps/web/app/(product)/recipes/`, `stripe-tiers.ts`.

**Rough sequence:** Wk -4..-1 build both tracks + soft beta (3–5 friendly operators, gather quotes); Wk 0 founder launch post + email + Plate live in trial + per-dish guides + cost card in communities; Wk +1 inaugural Cost Index as the PR centerpiece; Wk +2.. BD outreach (accountants first) + programmatic page cadence + monthly Cost Index. **Minimum credible launch** (if focus slips): Track A + Plate MVP in trial + founder post + email + 2–3 communities + Cost Index teaser.

## Verification (how we'll know it works)

- **Build correctness:** plate cost for a known recipe matches a hand calc to the cent (reuse `plate-cost.js` test vectors); a simulated `price_hike` verdict re-costs exactly the dishes containing that `canonical_id` and produces the right $/week; `portion-bridge` returns `compatible:false` (not a guess) on cross-family units; RLS denies cross-org reads (fail-closed test); no-LLM CI passes; Art. 20 export round-trips recipes.
- **Activation:** a new beta operator reaches first live-costed best-seller in < 10 min using only their own invoice data.
- **The loop end-to-end:** post a new invoice with a romaine hike → the operator gets the dish-impact notification with a correct $/week and a working one-tap re-price.
- **Funnel:** Plausible goals on free-tool completion → email capture → trial → activation → trial→paid; the shareable card carries attribution.
- **North-star instrumentation:** server-side count of live + acted-upon recipes; re-pricing-after-flag events tracked.

---

# Track B — Build-Ready Spec (Ledger MVP; execute in a CI-runnable env)

*The sandbox has no `node_modules`/DB/network for the Ledger repo, so this is specified precisely enough to build + `pnpm -C apps/api test`/`typecheck` elsewhere. Mirrors verified storefront engines: `tools/_shared/plate-advice.js` (recommendation) and `plate-cost.js`/`portion-bridge.js` (math) are the reference implementations to port to TS — keep the math identical so the free tool and Ledger never disagree.*

## 1. Migration `infra/postgres/migrations/0034_recipes.sql`

Additive, forward-only. FORCE RLS fail-closed, exactly like `0015_rls_data_plane.sql` / `0023`:

```sql
CREATE TABLE IF NOT EXISTS org_recipes (
  id               TEXT PRIMARY KEY,
  org_id           TEXT NOT NULL,
  name             TEXT NOT NULL,
  yield_portions   NUMERIC(10,2) NOT NULL DEFAULT 1,
  menu_price_cents INTEGER,
  category         TEXT,
  is_subrecipe     BOOLEAN NOT NULL DEFAULT false,
  covers_per_week  INTEGER,                 -- operator-entered; enables $/week framing
  archived_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS recipe_line_items (
  id               TEXT PRIMARY KEY,
  org_id           TEXT NOT NULL,           -- denormalized for tight recost loops + flat RLS
  recipe_id        TEXT NOT NULL REFERENCES org_recipes(id) ON DELETE CASCADE,
  canonical_id     TEXT,                    -- → product_canonical.id (the price binding)
  subrecipe_id     TEXT REFERENCES org_recipes(id) ON DELETE SET NULL,
  display_name     TEXT NOT NULL,
  portion_qty      NUMERIC(12,4) NOT NULL,
  portion_unit     TEXT NOT NULL,
  yield_percent    NUMERIC(6,4),            -- NULL → fall back to ported YIELD_TABLE / learned
  waste_percent    NUMERIC(6,4) NOT NULL DEFAULT 0,   -- kept SEPARATE from yield
  manual_price_cents INTEGER,               -- off-invoice items (salt, spice)
  sort_order       INTEGER NOT NULL DEFAULT 0,
  CHECK (canonical_id IS NOT NULL OR subrecipe_id IS NOT NULL OR manual_price_cents IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS recipe_cost_snapshots (
  id                        TEXT PRIMARY KEY,
  org_id                    TEXT NOT NULL,
  recipe_id                 TEXT NOT NULL REFERENCES org_recipes(id) ON DELETE CASCADE,
  plate_cost_cents          INTEGER NOT NULL,
  food_cost_pct             NUMERIC(6,4),
  contribution_margin_cents INTEGER,
  priced_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  trigger                   TEXT NOT NULL,  -- 'invoice'|'recipe_edit'|'price_hike'|'manual'
  source_observation_ids    JSONB NOT NULL DEFAULT '[]'  -- provenance for "show your work"
);
CREATE INDEX IF NOT EXISTS idx_rli_org_canonical ON recipe_line_items (org_id, canonical_id);
CREATE INDEX IF NOT EXISTS idx_rcs_recipe_time   ON recipe_cost_snapshots (recipe_id, priced_at DESC);

-- FORCE RLS on all three (NOT idempotent — guard re-runs per 0015 note):
ALTER TABLE org_recipes ENABLE ROW LEVEL SECURITY;            ALTER TABLE org_recipes FORCE ROW LEVEL SECURITY;
ALTER TABLE recipe_line_items ENABLE ROW LEVEL SECURITY;      ALTER TABLE recipe_line_items FORCE ROW LEVEL SECURITY;
ALTER TABLE recipe_cost_snapshots ENABLE ROW LEVEL SECURITY;  ALTER TABLE recipe_cost_snapshots FORCE ROW LEVEL SECURITY;
CREATE POLICY org_recipes_org_isolation ON org_recipes
  USING (org_id = current_setting('app.org_id')) WITH CHECK (org_id = current_setting('app.org_id'));
CREATE POLICY recipe_line_items_org_isolation ON recipe_line_items
  USING (org_id = current_setting('app.org_id')) WITH CHECK (org_id = current_setting('app.org_id'));
CREATE POLICY recipe_cost_snapshots_org_isolation ON recipe_cost_snapshots
  USING (org_id = current_setting('app.org_id')) WITH CHECK (org_id = current_setting('app.org_id'));
```
Companion `infra/postgres/tests/0034_recipes_rls.sql`: assert a query without `set_config('app.org_id')` returns 0 rows / errors (fail-closed), mirroring the verdicts RLS fixture.

## 2. Pure libs (port the verified JS, keep math identical)

- `apps/api/src/lib/portion-bridge.ts` — port `tools/_shared/portion-bridge.js` (`unitsCompatible`, `convertQuantity`, `quoteAtPortion` → `{ compatible:false }` on cross-family — never guess densities).
- `apps/api/src/lib/plate-cost.ts` — port the AP→EP→per-portion + `computePlateCost` math from `tools/plate-cost/plate-cost.js` (incl. the CIA `YIELD_TABLE`). Signature:
  `costRecipe(recipe: RecipeForCost, priceMap: Map<string, CanonicalPrice>, opts?): { plateCostCents, foodCostPct|null, contributionCents|null, lines: LineCost[], coveredCount, totalCount, confidence }` where `CanonicalPrice = { unitPriceCents:number; baseUnit:string; observedAt:string; observationId:string }`. **Partial-coverage honesty:** any line whose `canonical_id` is absent from `priceMap` (and has no `manual_price_cents`) is returned `covered:false`; never silently zeroed.
- `apps/api/src/lib/plate-advice.ts` — port `tools/_shared/plate-advice.js` verbatim (it's already pure + tested). This is the recommendation/​fork engine.

## 3. Stores (RLS-scoped; copy the `set_config` txn pattern from `documents-store.ts`)

- `apps/api/src/lib/recipes-store.ts` — CRUD on the three tables; **every method opens the txn with** `sql.query("select set_config('app.org_id', $1, true)", [orgId])` first.
- `apps/api/src/lib/recipe-pricing.ts` — `getLatestPrices(orgId, canonicalIds): Map<canonical_id, CanonicalPrice>`:
  ```sql
  SELECT DISTINCT ON (lik.canonical_id)
         lik.canonical_id, lio.unit_price_cents, lio.observed_at, lio.id AS observation_id,
         pc.pack_uom AS base_unit
  FROM line_item_observations lio
  JOIN line_item_keys lik ON lio.line_item_key_id = lik.id
  LEFT JOIN product_canonical pc ON pc.id = lik.canonical_id
  WHERE lik.org_id = current_setting('app.org_id') AND lik.canonical_id = ANY($1)
  ORDER BY lik.canonical_id, lio.observed_at DESC;
  ```

## 4. The hero loop — recost on `price_hike` (`apps/api/src/lib/plate-recost.ts`)

`recostForHike(orgId, hike: { canonical_id, verdict: PriceHikeVerdict }) → DishImpact[]`:
1. `recipe_line_items` WHERE `(org_id, canonical_id)` → affected recipe_ids (covering index).
2. For each recipe: load lines, `getLatestPrices`, `costRecipe` → new snapshot (`trigger:'price_hike'`, `source_observation_ids`).
3. Compute `addedCostCentsPerPlate` = new − prior snapshot plate cost; `coversPerWeek` from recipe → `$/week`.
4. `plate-advice.advise({ plateCostCents, menuPriceCents, coversPerWeek, priceMove:{ addedCostCentsPerPlate, ingredient: driver.display_name, pctMove: verdict.delta_pct }, itemName })`.
5. Emit one notification via the **existing sync stream** (`publishSyncEvent`, the pattern verdicts.ts already uses) carrying the advice payload → surfaces in `/insights` + `/today`.

**Wiring point:** where `computePriceHike` verdicts are persisted (verdicts write path / the post-extraction pipeline), after a `price_hike` verdict lands call `recostForHike` (fire-and-forget, same as audit/sync events). One new call site.

## 5. Route `apps/api/src/routes/recipes.ts` (Hono, `route.use("*", requireAuth)`)

`GET /v1/recipes` (list) · `POST /v1/recipes` (create — enforce Solo cap, see §6) · `GET /v1/recipes/:id` · `PUT /v1/recipes/:id` · `DELETE /v1/recipes/:id` · `GET /v1/recipes/:id/costing` (live cost via `getLatestPrices`+`costRecipe`+`advise`) · `GET /v1/recipes/ingredient-search?q=` (autocomplete from the org's own `product_canonical`/`line_item_keys` via ported `stem`/`sku-match`). Register in `apps/api/src/index.ts`: `app.route("/v1/recipes", recipes)`.

## 6. Entitlement (`apps/api/src/lib/stripe-tiers.ts`)

Add `plateRecipeCap` to `TierShape`: `solo: <GENEROUS_CAP e.g. 20>`, `team: null` (unlimited), `accountant: null`. `POST /v1/recipes` checks active recipe count vs the caller's tier cap → 402 with an upgrade hint when exceeded (capability is in Solo; the cap gates *scale*).

## 7. Tests (vitest, mirror `apps/api/tests/verdict-compute.test.ts`)

- `plate-cost.test.ts`: known recipe → exact plate cost to the cent (reuse the storefront test vectors); EP≠AP (cost on EP); partial coverage flagged (`coveredCount < totalCount`), never zeroed; sub-recipe recursion; pack-size/base-unit normalization.
- `portion-bridge.test.ts`: cross-family → `compatible:false`.
- `plate-advice.test.ts`: copy the 11 storefront cases verbatim (parity guarantee).
- `plate-recost.test.ts`: a `price_hike` on canonical X re-costs exactly the recipes containing X, computes correct `$/week`, emits one advice notification; seasonal → HOLD first.
- `recipes-rls.test.ts` + the SQL fixture: cross-org read denied (fail-closed).
- `no-llm-ci.sh` + `privacy-ci.sh` must stay green (zero LLM imports; recipes encrypted/never logged).

## 8. Privacy / frontend (later in the same track)

Recipes = sensitive: per-org RLS (above) + KMS field-encryption on `display_name`/quantities per the documents posture; add recipes to the Art. 20 export; extend privacy-policy/DPA with the recipe clause. Frontend `apps/web/app/(product)/recipes/` (list, editor grid with invoice-line picker, the `/insights` hike card) — built after the API + tests are green.

## 9. Verify (in the CI-runnable env)

`pnpm i` → `pnpm -C apps/api typecheck` → `pnpm -C apps/api test` (all suites green) → apply `0034` + RLS fixture to a seeded test DB → simulate a `price_hike` and assert the notification payload → `bash scripts/no-llm-ci.sh && bash scripts/privacy-ci.sh`.

---

