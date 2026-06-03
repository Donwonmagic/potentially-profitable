/**
 * plate-cost.ts — Ledger costing core.
 *
 * Recomposes the storefront AP→EP→plate math (tools/plate-cost/plate-cost.js)
 * onto Ledger's data model: prices come from a canonical priceMap (latest
 * invoice unit_price_cents per base unit), not per-row AP price. Per-line
 * unit conversion + yield go through the ported portion-bridge; default
 * yields come from the verbatim-extracted CIA YIELD_TABLE. Money in integer
 * cents throughout.
 *
 * PARITY CONTRACT: lookupYield + the yield table are extracted from the
 * storefront source; the per-portion arithmetic lives in portion-bridge.ts
 * (also a verbatim port). Keep all three in lockstep with the storefront.
 *
 * PARTIAL-COVERAGE HONESTY: a line whose canonical_id is absent from the
 * priceMap (and has no manual_price_cents / subrecipe cost) is returned
 * covered:false and contributes ZERO to the plate — never silently zeroed
 * into a flattering total. coveredCount < totalCount is the signal the UI
 * uses to say "5 of 8 ingredients priced from your invoices, 3 estimated."
 */

import { quoteAtPortion } from './portion-bridge.js';
import { YIELD_TABLE } from './yield-table.js';

export interface CanonicalPrice {
  unitPriceCents: number;   // price per one base unit (e.g. per gram, per ml, per each)
  baseUnit: string;         // 'g' | 'ml' | 'oz' | 'lb' | 'fl_oz' | 'ct' | ...
  observedAt: string;       // ISO timestamp of the invoice line this came from
  observationId: string;    // provenance: the line_item_observations.id
}

export interface RecipeLineForCost {
  id: string;
  displayName: string;
  canonicalId?: string | null;       // → product_canonical.id (the price binding)
  subrecipeId?: string | null;
  manualPriceCents?: number | null;  // off-invoice items (salt, spice)
  portionQty: number;
  portionUnit: string;
  yieldPercent?: number | null;      // explicit override; else YIELD_TABLE; else 1
  wastePercent?: number | null;      // tracked separately; NOT folded into plate cost (kitchen metric)
}

export interface RecipeForCost {
  id: string;
  name: string;
  yieldPortions: number;
  menuPriceCents?: number | null;
  rows: RecipeLineForCost[];
}

export interface LineCost {
  lineId: string;
  displayName: string;
  covered: boolean;
  costCents: number;                 // contribution to ONE batch (pre ÷ portions)
  yieldApplied: number;
  source: 'invoice' | 'manual' | 'subrecipe' | 'uncovered';
  observationId?: string | null;
  warning?: string | null;           // 'cross-family' | 'unknown-yield' | 'no-price'
}

export interface RecipeCost {
  plateCostCents: number;            // batchCost / yieldPortions, rounded to cents
  batchCostCents: number;
  foodCostPct: number | null;        // plateCost / menuPrice
  contributionCents: number | null;  // menuPrice - plateCost
  lines: LineCost[];
  coveredCount: number;
  totalCount: number;
  confidence: 'high' | 'medium' | 'low';
  sourceObservationIds: string[];
}

export interface CostOpts {
  // Optional resolver for sub-recipe lines: id → batch cost per ONE portion
  // of that sub-recipe, in cents. Memoize at the caller to avoid recompute.
  subrecipeCostCents?: (subrecipeId: string) => number | null;
}

// ---- yield lookup (ported from plate-cost.js lookupYield fallbacks) -----
export function lookupYield(name?: string | null): number | null {
  if (!name) return null;
  const key = String(name).toLowerCase().trim();
  if (YIELD_TABLE[key] != null) return YIELD_TABLE[key];
  const noParens = key.replace(/\s*\([^)]*\)/g, '').trim();
  if (YIELD_TABLE[noParens] != null) return YIELD_TABLE[noParens];
  if (noParens === 'bacon') return YIELD_TABLE['bacon (raw)'] ?? null;
  const stripS = noParens.replace(/s$/, '');
  if (YIELD_TABLE[stripS] != null) return YIELD_TABLE[stripS];
  return null;
}

function resolveYield(line: RecipeLineForCost): { y: number; warning: string | null } {
  if (line.yieldPercent != null && isFinite(line.yieldPercent) && line.yieldPercent > 0) {
    return { y: line.yieldPercent, warning: null };
  }
  const looked = lookupYield(line.displayName);
  if (looked != null && isFinite(looked) && looked > 0) return { y: looked, warning: null };
  return { y: 1, warning: 'unknown-yield' };
}

/**
 * costRecipe — the whole-recipe cost, in cents.
 * priceMap: canonical_id → latest CanonicalPrice (from recipe-pricing.getLatestPrices).
 */
export function costRecipe(
  recipe: RecipeForCost,
  priceMap: Map<string, CanonicalPrice>,
  opts: CostOpts = {},
): RecipeCost {
  const lines: LineCost[] = [];
  const obsIds: string[] = [];
  let batchCostCents = 0;
  let covered = 0;
  const total = Array.isArray(recipe.rows) ? recipe.rows.length : 0;

  for (const line of (recipe.rows || [])) {
    const { y, warning: yWarn } = resolveYield(line);

    // 1) Sub-recipe line.
    if (line.subrecipeId && opts.subrecipeCostCents) {
      const sub = opts.subrecipeCostCents(line.subrecipeId);
      if (sub != null && isFinite(sub)) {
        const costCents = Math.round(sub * line.portionQty);
        batchCostCents += costCents;
        covered++;
        lines.push({ lineId: line.id, displayName: line.displayName, covered: true, costCents, yieldApplied: y, source: 'subrecipe', warning: yWarn });
        continue;
      }
    }

    // 2) Manual (off-invoice) price — already a per-portion cents figure.
    if (line.manualPriceCents != null && isFinite(line.manualPriceCents) && line.manualPriceCents >= 0) {
      const costCents = Math.round(line.manualPriceCents);
      batchCostCents += costCents;
      covered++;
      lines.push({ lineId: line.id, displayName: line.displayName, covered: true, costCents, yieldApplied: y, source: 'manual', warning: yWarn });
      continue;
    }

    // 3) Canonical invoice price → portion-bridge.
    const price = line.canonicalId ? priceMap.get(line.canonicalId) : undefined;
    if (!price) {
      lines.push({ lineId: line.id, displayName: line.displayName, covered: false, costCents: 0, yieldApplied: y, source: 'uncovered', warning: 'no-price' });
      continue;
    }
    const quote = quoteAtPortion({
      comparable: { perBaseUnit: price.unitPriceCents, baseUnit: price.baseUnit },
      portion: { qty: line.portionQty, unit: line.portionUnit },
      yieldPercent: y,
    });
    if (!quote.compatible || quote.perPortionCost == null) {
      lines.push({ lineId: line.id, displayName: line.displayName, covered: false, costCents: 0, yieldApplied: y, source: 'uncovered', warning: quote.reason || 'cross-family' });
      continue;
    }
    const costCents = Math.round(quote.perPortionCost);
    batchCostCents += costCents;
    covered++;
    obsIds.push(price.observationId);
    lines.push({ lineId: line.id, displayName: line.displayName, covered: true, costCents, yieldApplied: y, source: 'invoice', observationId: price.observationId, warning: yWarn });
  }

  const portions = Math.max(1, Number(recipe.yieldPortions) || 1);
  const plateCostCents = Math.round(batchCostCents / portions);
  const menu = (recipe.menuPriceCents != null && isFinite(recipe.menuPriceCents)) ? Math.round(recipe.menuPriceCents) : null;
  const foodCostPct = (menu != null && menu > 0) ? +(plateCostCents / menu).toFixed(4) : null;
  const contributionCents = (menu != null) ? menu - plateCostCents : null;

  // Confidence: every uncovered row drops a tier (mirrors storefront).
  let confidence: RecipeCost['confidence'] = 'high';
  if (total > 0 && covered < total) {
    confidence = covered >= total * 0.7 ? 'medium' : 'low';
  }
  if (lines.some((l) => l.warning === 'unknown-yield') && confidence === 'high') {
    confidence = 'medium';
  }

  return {
    plateCostCents,
    batchCostCents,
    foodCostPct,
    contributionCents,
    lines,
    coveredCount: covered,
    totalCount: total,
    confidence,
    sourceObservationIds: obsIds,
  };
}
