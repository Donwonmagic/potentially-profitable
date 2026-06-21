import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { pick } = require('./leak-of-the-week.js');

const SEED = {
  ingredients: [
    { key: 'ribeye', label_en: 'Ribeye', label_es: 'Ribeye', unit_en: 'lb', unit_es: 'libra',
      assessment: { confidence: 'medium', level: { basis: 'wholesale', medianCents: 1277 } } }
  ]
};
const PRESSURE = { items: { ribeye: { item: 'ribeye', direction: 'building', confidence: 'high', under_review: false, score: 6 } } };
const DISH = { name: 'Ribeye plate', price: 38, rows: [
  { ingredient: 'Ribeye', apPrice: 9, apQty: 1, apUnit: 'lb', usedQty: 8, usedUnit: 'oz', yieldPercent: 0.85 }
]};
const OVERPAY = { item: 'Ribeye', paidCents: 2600, unit: 'lb' };

test('a real per-plate $ leak outranks directional ones', () => {
  const r = pick({ seed: SEED, dishes: [DISH], savedPrices: [OVERPAY], pressure: PRESSURE });
  assert.equal(r.leak.type, 'plate-drift');
  assert.ok(r.leak.dollarsPerPlate > 0);       // real number from the operator's recipe
  assert.equal(r.leak.directional, false);
  assert.ok(r.runnersUp.length >= 1);          // overpay + pressure fall in behind
});

test('with no operator data, only the directional pressure leak is offered', () => {
  const r = pick({ seed: SEED, pressure: PRESSURE });
  assert.equal(r.leak.type, 'cost-pressure');
  assert.equal(r.leak.directional, true);
  assert.equal(r.leak.dollarsPerPlate, null);  // pressure carries no price — no $ invented
});

test('overpay outranks pressure when neither has a dollar figure', () => {
  const r = pick({ seed: SEED, savedPrices: [OVERPAY], pressure: PRESSURE });
  assert.equal(r.leak.type, 'overpay');
  assert.equal(r.leak.directional, true);
});

test('stays quietly dark when nothing clears the bars', () => {
  const calm = { items: { ribeye: { direction: 'easing', confidence: 'high', under_review: false } } };
  const fairlyPriced = { item: 'Ribeye', paidCents: 1300, unit: 'lb' }; // ~at reference
  const r = pick({ seed: SEED, savedPrices: [fairlyPriced], pressure: calm });
  assert.equal(r.leak, null);
});

test('an under-review pressure edge is not surfaced (proven only)', () => {
  const unproven = { items: { ribeye: { direction: 'building', confidence: 'high', under_review: true } } };
  assert.equal(pick({ seed: SEED, pressure: unproven }).leak, null);
});

test('basketSlugs limits the pressure leak to what the operator buys', () => {
  const r = pick({ seed: SEED, pressure: PRESSURE, basketSlugs: ['chicken-breast'] });
  assert.equal(r.leak, null); // ribeye pressure excluded — not in the basket
});

test('a dish whose cost eased is not a leak', () => {
  const eased = { name: 'Ribeye plate', price: 38, rows: [
    { ingredient: 'Ribeye', apPrice: 20, apQty: 1, apUnit: 'lb', usedQty: 8, usedUnit: 'oz', yieldPercent: 0.85 }
  ]}; // entered $20/lb > market $12.77 → deltaDollar negative
  const r = pick({ seed: SEED, dishes: [eased] });
  assert.equal(r.leak, null);
});

test('degrades to empty (never throws) with no inputs', () => {
  assert.deepEqual(pick({}), { leak: null, runnersUp: [] });
});
