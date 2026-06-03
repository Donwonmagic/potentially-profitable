/**
 * plate-recost.ts — THE HERO LOOP.
 *
 * When a price_hike verdict lands on a canonical id, recost exactly the
 * dishes that ingredient touches (covering index org_id, canonical_id),
 * write a new snapshot, compute the $/plate and $/week delta, and turn it
 * into one advice notification per affected dish:
 *
 *   "Romaine is up 14% (Sysco). That's +$0.31/plate on Caesar and +$0.22 on
 *    Cobb — about $47/week at your covers. [Re-price] [Re-portion] [Hold]"
 *
 * Wiring point: call recostForHike(...) where price_hike verdicts are
 * persisted (the post-extraction verdicts write path), fire-and-forget, the
 * same way audit/sync events are emitted today. One new call site.
 */

import { costRecipe, type RecipeForCost, type RecipeLineForCost } from './plate-cost.js';
import { getLatestPrices, type SqlClient } from './recipe-pricing.js';
import { RecipesStore, type LineRow, type RecipeRow } from './recipes-store.js';
import { advise, type AdviceResult } from './plate-advice.js';

export interface PriceHike {
  canonicalId: string;
  ingredientName: string;       // driver display name for the notification
  pctMove?: number;             // verdict.delta_pct (e.g. 0.14)
  vendor?: string;
  seasonal?: boolean;           // from the composite market-trend (spike vs structural); optional
}

export interface DishImpact {
  recipeId: string;
  recipeName: string;
  addedCostCentsPerPlate: number;
  newPlateCostCents: number;
  priorPlateCostCents: number | null;
  weeklyDeltaCents: number | null;
  advice: AdviceResult;
}

function toRecipeForCost(recipe: RecipeRow, lines: LineRow[]): RecipeForCost {
  const rows: RecipeLineForCost[] = lines.map((l) => ({
    id: l.id,
    displayName: l.display_name,
    canonicalId: l.canonical_id,
    subrecipeId: l.subrecipe_id,
    manualPriceCents: l.manual_price_cents,
    portionQty: Number(l.portion_qty),
    portionUnit: l.portion_unit,
    yieldPercent: l.yield_percent != null ? Number(l.yield_percent) : null,
    wastePercent: l.waste_percent != null ? Number(l.waste_percent) : 0,
  }));
  return {
    id: recipe.id,
    name: recipe.name,
    yieldPortions: Number(recipe.yield_portions) || 1,
    menuPriceCents: recipe.menu_price_cents,
    rows,
  };
}

/**
 * recostForHike — recost every dish containing the hiked canonical, persist
 * snapshots, and return the per-dish impact (with the advice payload). The
 * caller emits each impact's advice into the existing sync stream
 * (publishSyncEvent) → /insights + /today, weighted so only material $/week
 * moves notify.
 */
export async function recostForHike(
  client: SqlClient,
  store: RecipesStore,
  orgId: string,
  hike: PriceHike,
): Promise<DishImpact[]> {
  const recipeIds = await store.recipesUsingCanonical(orgId, hike.canonicalId);
  const impacts: DishImpact[] = [];

  for (const recipeId of recipeIds) {
    const loaded = await store.getRecipe(orgId, recipeId);
    if (!loaded) continue;
    const { recipe, lines } = loaded;

    const priorCost = await store.latestSnapshotCost(orgId, recipeId);

    const canonicalIds = lines.map((l) => l.canonical_id).filter((x): x is string => !!x);
    const priceMap = await getLatestPrices(client, orgId, canonicalIds);
    const cost = costRecipe(toRecipeForCost(recipe, lines), priceMap);

    await store.writeSnapshot(orgId, {
      recipeId,
      plateCostCents: cost.plateCostCents,
      foodCostPct: cost.foodCostPct,
      contributionMarginCents: cost.contributionCents,
      trigger: 'price_hike',
      sourceObservationIds: cost.sourceObservationIds,
    });

    const added = priorCost != null ? cost.plateCostCents - priorCost : 0;
    const covers = recipe.covers_per_week != null ? Number(recipe.covers_per_week) : null;
    const weeklyDelta = (covers && added > 0) ? Math.round(added * covers) : null;

    const adviceResult = advise({
      itemName: recipe.name,
      plateCostCents: cost.plateCostCents,
      menuPriceCents: recipe.menu_price_cents,
      coversPerWeek: covers,
      confidence: cost.confidence,
      priceMove: added > 0 ? {
        addedCostCentsPerPlate: added,
        ingredient: hike.ingredientName,
        vendor: hike.vendor,
        pctMove: hike.pctMove,
        seasonal: hike.seasonal,
      } : null,
    });

    impacts.push({
      recipeId,
      recipeName: recipe.name,
      addedCostCentsPerPlate: added,
      newPlateCostCents: cost.plateCostCents,
      priorPlateCostCents: priorCost,
      weeklyDeltaCents: weeklyDelta,
      advice: adviceResult,
    });
  }

  // Materiality: surface biggest $/week first; the caller can threshold.
  impacts.sort((a, b) => (b.weeklyDeltaCents ?? b.addedCostCentsPerPlate) - (a.weeklyDeltaCents ?? a.addedCostCentsPerPlate));
  return impacts;
}
