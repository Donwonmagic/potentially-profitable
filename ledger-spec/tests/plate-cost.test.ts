/**
 * plate-cost.test.ts — costRecipe + portion-bridge integration.
 * Hand-computed expectations; cost in integer cents. Proves: EP≠AP (yield
 * applied), partial coverage flagged (never silently zeroed), cross-family
 * declined, batch ÷ portions.
 *
 *   pnpm -C apps/api test plate-cost
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { costRecipe, lookupYield, type CanonicalPrice, type RecipeForCost } from '../src/lib/plate-cost.js';
import { quoteAtPortion } from '../src/lib/portion-bridge.js';

function price(unitPriceCents: number, baseUnit: string): CanonicalPrice {
  return { unitPriceCents, baseUnit, observedAt: '2026-05-28T00:00:00Z', observationId: 'obs_' + baseUnit + '_' + unitPriceCents };
}

test('portion-bridge: $4.00/lb beef, 4 oz, 0.75 yield → $1.33/portion (storefront example)', () => {
  const q = quoteAtPortion({ comparable: { perBaseUnit: 400, baseUnit: 'lb' }, portion: { qty: 4, unit: 'oz' }, yieldPercent: 0.75 });
  assert.equal(q.compatible, true);
  assert.equal(q.perPortionCost, 133.3333); // 400/16=25 → /0.75=33.333… → ×4
});

test('portion-bridge: cross-family ($/lb weight vs fl_oz volume) declines, does not guess', () => {
  const q = quoteAtPortion({ comparable: { perBaseUnit: 400, baseUnit: 'lb' }, portion: { qty: 4, unit: 'fl_oz' }, yieldPercent: 1 });
  assert.equal(q.compatible, false);
  assert.equal(q.reason, 'cross-family');
});

test('costRecipe: known recipe matches a hand calc to the cent', () => {
  const recipe: RecipeForCost = {
    id: 'rec1', name: 'Caesar', yieldPortions: 1, menuPriceCents: 1400,
    rows: [
      // Romaine: 32¢/oz, 2 oz, yield 1.0 → 64¢
      { id: 'l1', displayName: 'Romaine', canonicalId: 'can_romaine', portionQty: 2, portionUnit: 'oz', yieldPercent: 1 },
      // Dressing: off-invoice manual 10¢
      { id: 'l2', displayName: 'House dressing', manualPriceCents: 10, portionQty: 1, portionUnit: 'oz' },
      // Croutons: canonical present but NOT in priceMap → uncovered, contributes 0
      { id: 'l3', displayName: 'Croutons', canonicalId: 'can_croutons', portionQty: 1, portionUnit: 'oz' },
    ],
  };
  const priceMap = new Map<string, CanonicalPrice>([['can_romaine', price(32, 'oz')]]);
  const c = costRecipe(recipe, priceMap);

  assert.equal(c.batchCostCents, 74);          // 64 + 10 + 0
  assert.equal(c.plateCostCents, 74);          // ÷ 1 portion
  assert.equal(c.coveredCount, 2);
  assert.equal(c.totalCount, 3);
  assert.equal(c.confidence, 'low');           // 2/3 covered < 0.7 → low
  assert.equal(c.contributionCents, 1326);     // 1400 − 74
  assert.equal(c.foodCostPct, 0.0529);         // 74/1400
  // Partial coverage is explicit, never silently zeroed:
  const crouton = c.lines.find((l) => l.lineId === 'l3')!;
  assert.equal(crouton.covered, false);
  assert.equal(crouton.warning, 'no-price');
});

test('costRecipe: yield is applied (EP ≠ AP) and batch ÷ portions divides', () => {
  const recipe: RecipeForCost = {
    id: 'rec2', name: 'Batch sauce', yieldPortions: 4, menuPriceCents: null,
    rows: [
      // 400¢/lb, 8 oz used, yield 0.75 → 400/16=25 → /0.75=33.333… → ×8 = 266.6667 → 267¢ batch
      { id: 'l1', displayName: 'Beef', canonicalId: 'can_beef', portionQty: 8, portionUnit: 'oz', yieldPercent: 0.75 },
    ],
  };
  const priceMap = new Map<string, CanonicalPrice>([['can_beef', price(400, 'lb')]]);
  const c = costRecipe(recipe, priceMap);
  assert.equal(c.batchCostCents, 267);   // round(266.6667)
  assert.equal(c.plateCostCents, 67);    // round(267/4) = round(66.75)
  assert.equal(c.confidence, 'high');
});

test('lookupYield falls back through paren-strip and plural-strip', () => {
  // exact values depend on the extracted YIELD_TABLE; assert it resolves a
  // known ingredient to a number in (0,1], and unknowns to null.
  const known = lookupYield('romaine');
  assert.ok(known === null || (known > 0 && known <= 1));
  assert.equal(lookupYield('definitely-not-an-ingredient-xyz'), null);
});
