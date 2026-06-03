/**
 * recipes.ts — Hono route for Muntin Plate. Register in apps/api/src/index.ts:
 *   app.route('/v1/recipes', recipes)
 *
 * All routes require auth (route.use('*', requireAuth)). The org id comes from
 * the authed session (c.get('orgId')) — never from the client. Every handler
 * delegates to RecipesStore, which scopes each txn with set_config('app.org_id').
 *
 * Endpoints:
 *   GET    /v1/recipes                 list (non-archived)
 *   POST   /v1/recipes                 create (enforces Solo cap → 402)
 *   GET    /v1/recipes/:id             one recipe + lines
 *   PUT    /v1/recipes/:id             update + replace lines
 *   DELETE /v1/recipes/:id             archive (soft delete)
 *   GET    /v1/recipes/:id/costing     live cost + advice
 *   GET    /v1/recipes/ingredient-search?q=   autocomplete from the org's own catalog
 *
 * This file shows the shape against a generic Hono app; wire the concrete
 * deps (db client, store factory, requireAuth, plateRecipeCap) to the repo's
 * existing context bindings.
 */

import { Hono } from 'hono';
import { costRecipe, type RecipeForCost } from '../lib/plate-cost.js';
import { getLatestPrices } from '../lib/recipe-pricing.js';
import { advise } from '../lib/plate-advice.js';
import { RecipesStore } from '../lib/recipes-store.js';

// These come from the app's existing context — shown as typed getters.
type Env = {
  Variables: {
    orgId: string;
    tier: 'solo' | 'team' | 'accountant';
    store: RecipesStore;       // built per-request with the scoped sql client
    sql: import('../lib/recipe-pricing.js').SqlClient;
    plateRecipeCap: (tier: string) => number | null;  // from stripe-tiers
  };
};

export const recipes = new Hono<Env>();

// recipes.use('*', requireAuth);  // ← wire the repo's existing auth middleware

recipes.get('/', async (c) => {
  const store = c.get('store');
  const rows = await store.listRecipes(c.get('orgId'));
  return c.json({ recipes: rows });
});

recipes.post('/', async (c) => {
  const store = c.get('store');
  const orgId = c.get('orgId');
  const cap = c.get('plateRecipeCap')(c.get('tier'));
  if (cap != null) {
    const count = await store.activeRecipeCount(orgId);
    if (count >= cap) {
      return c.json(
        { error: 'recipe_cap_reached', cap, message: `Your plan includes ${cap} live recipes. Upgrade to Team for unlimited.` },
        402,
      );
    }
  }
  const body = await c.req.json<{ name: string; yield_portions?: number; menu_price_cents?: number; category?: string; covers_per_week?: number; lines?: any[] }>();
  if (!body?.name) return c.json({ error: 'name_required' }, 400);
  const recipe = await store.createRecipe(orgId, body);
  if (Array.isArray(body.lines)) await store.replaceLines(orgId, recipe.id, body.lines);
  return c.json({ recipe }, 201);
});

recipes.get('/:id', async (c) => {
  const loaded = await c.get('store').getRecipe(c.get('orgId'), c.req.param('id'));
  if (!loaded) return c.json({ error: 'not_found' }, 404);
  return c.json(loaded);
});

recipes.put('/:id', async (c) => {
  const store = c.get('store');
  const orgId = c.get('orgId');
  const id = c.req.param('id');
  const body = await c.req.json<{ lines?: any[] }>();
  if (Array.isArray(body.lines)) await store.replaceLines(orgId, id, body.lines);
  // (column updates on org_recipes elided for brevity — same scoped pattern)
  const loaded = await store.getRecipe(orgId, id);
  if (!loaded) return c.json({ error: 'not_found' }, 404);
  // Re-cost on edit so the snapshot stays live.
  const canonicalIds = loaded.lines.map((l) => l.canonical_id).filter((x): x is string => !!x);
  const priceMap = await getLatestPrices(c.get('sql'), orgId, canonicalIds);
  const cost = costRecipe(toCostInput(loaded), priceMap);
  await store.writeSnapshot(orgId, {
    recipeId: id, plateCostCents: cost.plateCostCents, foodCostPct: cost.foodCostPct,
    contributionMarginCents: cost.contributionCents, trigger: 'recipe_edit', sourceObservationIds: cost.sourceObservationIds,
  });
  return c.json({ recipe: loaded.recipe, cost });
});

recipes.delete('/:id', async (c) => {
  // Soft-delete (archive). RLS-scoped UPDATE elided — same set_config pattern.
  return c.json({ ok: true });
});

recipes.get('/:id/costing', async (c) => {
  const store = c.get('store');
  const orgId = c.get('orgId');
  const loaded = await store.getRecipe(orgId, c.req.param('id'));
  if (!loaded) return c.json({ error: 'not_found' }, 404);
  const canonicalIds = loaded.lines.map((l) => l.canonical_id).filter((x): x is string => !!x);
  const priceMap = await getLatestPrices(c.get('sql'), orgId, canonicalIds);
  const cost = costRecipe(toCostInput(loaded), priceMap);
  const adviceResult = advise({
    itemName: loaded.recipe.name,
    plateCostCents: cost.plateCostCents,
    menuPriceCents: loaded.recipe.menu_price_cents,
    coversPerWeek: loaded.recipe.covers_per_week,
    confidence: cost.confidence,
  });
  return c.json({ cost, advice: adviceResult });
});

recipes.get('/ingredient-search', async (c) => {
  // Autocomplete from the org's OWN product_canonical / line_item_keys via the
  // ported stem/sku-match — the operator picks pre-priced things they buy.
  // (query elided; RLS-scoped, returns [{ canonicalId, displayName, baseUnit }])
  const q = c.req.query('q') || '';
  return c.json({ q, results: [] });
});

function toCostInput(loaded: { recipe: any; lines: any[] }): RecipeForCost {
  return {
    id: loaded.recipe.id,
    name: loaded.recipe.name,
    yieldPortions: Number(loaded.recipe.yield_portions) || 1,
    menuPriceCents: loaded.recipe.menu_price_cents,
    rows: loaded.lines.map((l) => ({
      id: l.id, displayName: l.display_name, canonicalId: l.canonical_id, subrecipeId: l.subrecipe_id,
      manualPriceCents: l.manual_price_cents, portionQty: Number(l.portion_qty), portionUnit: l.portion_unit,
      yieldPercent: l.yield_percent != null ? Number(l.yield_percent) : null,
      wastePercent: l.waste_percent != null ? Number(l.waste_percent) : 0,
    })),
  };
}
