/**
 * Pins the Muntin Plate recommendation engine — the "no number ships
 * naked" discipline, the re-price/re-portion/absorb fork, charm
 * rounding, and loss-aversion framing.
 *
 *   node --test tools/_shared/plate-advice.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const A = require('./plate-advice.js');

test('charmRoundUp respects the menu convention and never rounds DOWN', () => {
  assert.equal(A.charmRoundUp(1347, 'whole'), 1400);
  assert.equal(A.charmRoundUp(1347, 'ninetyfive'), 1395);
  assert.equal(A.charmRoundUp(1347, 'ninetynine'), 1399);
  assert.equal(A.charmRoundUp(1300, 'whole'), 1300);     // already on convention
  assert.equal(A.charmRoundUp(1410, 'whole'), 1500);     // never down to 1400
  assert.equal(A.charmRoundUp(1396, 'ninetyfive'), 1495); // past .95 -> next .95
});

test('detectConvention reads the operator’s own price endings', () => {
  assert.equal(A.detectConvention([1395, 1495, 995]), 'ninetyfive');
  assert.equal(A.detectConvention([1400, 1500, 1200]), 'whole');
  assert.equal(A.detectConvention([1399, 1299]), 'ninetynine');
  assert.equal(A.detectConvention([]), 'whole');
});

test('healthy dish: told they are fine, no action (silence is a feature)', () => {
  const r = A.advise({ itemName: 'Chicken parm', plateCostCents: 310, menuPriceCents: 1600, targetFoodCostPct: 0.30 });
  assert.equal(r.tier, 'healthy');
  assert.equal(r.options.length, 0);
  assert.match(r.headline, /Healthy/);
});

test('over target: re-price recommended first, hits the OWNER target, charm-rounded', () => {
  const r = A.advise({ itemName: 'Caesar', plateCostCents: 540, menuPriceCents: 1600, targetFoodCostPct: 0.30, menuPricesCents: [1400, 1800] });
  assert.equal(r.tier, 'over_target');
  assert.ok(r.options.length >= 1, 'no number ships naked');
  assert.equal(r.options[0].kind, 'reprice');
  assert.equal(r.options[0].newPriceCents, 1800); // 540/0.30 = 1800, whole-dollar menu
  assert.equal(r.options.map(o => o.kind).join(','), 'reprice,reportion,absorb'); // full fork offered
});

test('underwater dish: loss-framed, full fork', () => {
  const r = A.advise({ itemName: 'Shrimp tacos', plateCostCents: 1400, menuPriceCents: 1300, targetFoodCostPct: 0.30 });
  assert.equal(r.tier, 'underwater');
  assert.match(r.headline, /lose/i);
  assert.deepEqual(r.options.map(o => o.kind), ['reprice', 'reportion', 'absorb']);
});

test('price hike (structural): blames the ingredient, frames $/week, re-price first when over goal', () => {
  const r = A.advise({
    itemName: 'Caesar', plateCostCents: 540, menuPriceCents: 1600, targetFoodCostPct: 0.30,
    coversPerWeek: 150,
    priceMove: { addedCostCentsPerPlate: 31, ingredient: 'Romaine', pctMove: 0.14 }
  });
  assert.equal(r.tier, 'hike');
  assert.match(r.headline, /Romaine went up/);
  assert.match(r.headline, /\$47\/week/);   // 31c * 150 = $46.50 -> $47
  assert.equal(r.options[0].kind, 'reprice');
});

test('price hike (seasonal): recommends HOLD first, not a re-price', () => {
  const r = A.advise({
    itemName: 'Caprese', plateCostCents: 540, menuPriceCents: 1600, targetFoodCostPct: 0.30,
    coversPerWeek: 100,
    priceMove: { addedCostCentsPerPlate: 40, ingredient: 'Tomatoes', pctMove: 0.30, seasonal: true }
  });
  assert.equal(r.tier, 'hike');
  assert.equal(r.options[0].kind, 'absorb');
  assert.match(r.headline, /seasonal/i);
});

test('hike without covers falls back to per-plate framing (no fabricated weekly)', () => {
  const r = A.advise({
    itemName: 'Burger', plateCostCents: 600, menuPriceCents: 1500, targetFoodCostPct: 0.30,
    priceMove: { addedCostCentsPerPlate: 22, ingredient: 'Beef' }
  });
  assert.match(r.headline, /\/plate/);
  assert.doesNotMatch(r.headline, /week/);
});

test('no price yet: recommends the goal-hitting price', () => {
  const r = A.advise({ itemName: 'New special', plateCostCents: 450, menuPriceCents: null, targetFoodCostPct: 0.30 });
  assert.equal(r.tier, 'price_needed');
  assert.equal(r.options[0].kind, 'reprice');
  assert.equal(r.options[0].newPriceCents, 1500); // 450/0.30
});

test('Spanish locale renders plain ES copy, not a translation stub', () => {
  const r = A.advise({ itemName: 'Tacos', plateCostCents: 540, menuPriceCents: 1600, locale: 'es', coversPerWeek: 150, priceMove: { addedCostCentsPerPlate: 31, ingredient: 'Lechuga', pctMove: 0.14 } });
  assert.match(r.headline, /Subió Lechuga/);
  assert.match(r.headline, /\/semana/);
});

test('insufficient input is handled, not crashed', () => {
  const r = A.advise({ itemName: 'X', plateCostCents: 0, menuPriceCents: 1000 });
  assert.equal(r.tier, 'insufficient');
});
