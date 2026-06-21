import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { compute } = require('./plate-market-recost.js');

// A minimal seed in the shape data/cost-index.js writes (window.MUNTIN_COST_INDEX):
// ribeye is a firm $/lb wholesale level; acorn squash is firm but priced per
// carton (a unit the portion bridge can't translate to oz).
const SEED = {
  ingredients: [
    {
      key: 'ribeye', label_en: 'Ribeye', label_es: 'Ribeye', unit_en: 'lb', unit_es: 'libra',
      assessment: { asOf: '2026-06-17', confidence: 'medium',
        level: { basis: 'wholesale', medianCents: 1277, rangeCents: [1235, 1319] } }
    },
    {
      key: 'acorn-squash', label_en: 'Acorn squash', label_es: 'Calabaza', unit_en: 'carton', unit_es: 'caja',
      assessment: { asOf: '2026-06-16', confidence: 'medium',
        level: { basis: 'wholesale', medianCents: 3200 } }
    }
  ]
};

const opts = (dishes, extra) => Object.assign({ seed: SEED, dishes }, extra || {});

test('recosts a dish against the live market and computes the delta', () => {
  // 8 oz ribeye, yield 1. Operator's saved AP price: $10.00/lb. Market: $12.77/lb.
  const out = compute(opts([{
    name: 'Ribeye plate', price: 18,
    rows: [{ ingredient: 'Ribeye', apPrice: 10, apQty: 1, apUnit: 'lb', usedQty: 8, usedUnit: 'oz', yieldPercent: 1 }]
  }]));
  assert.equal(out.length, 1);
  const e = out[0];
  assert.equal(e.enteredPlateCost, 5);        // $10/lb → $0.625/oz × 8
  assert.equal(e.marketPlateCost, 6.385);     // $12.77/lb → $0.798125/oz × 8
  assert.equal(e.deltaDollar, 1.385);
  assert.equal(e.deltaPct, 27.7);
  assert.equal(e.coveredLines, 1);
  assert.equal(e.wholesaleReference, true);   // the honesty flag is always set
});

test('exposes expert-grounded food-cost target bands (28–35%, by service model)', () => {
  const { targetFor, FOOD_COST_TARGETS } = require('./plate-market-recost.js');
  assert.equal(targetFor('fine-dining'), 37);     // (34+40)/2
  assert.equal(targetFor('casual'), 32);          // (30+34)/2
  assert.equal(targetFor('quick-service'), 27.5); // (25+30)/2
  assert.equal(targetFor(undefined), 30);         // canonical full-service default
  assert.equal(FOOD_COST_TARGETS['casual'].min, 30);
});

test('compute uses the service-model band when no explicit target is given', () => {
  // Same dish, different concept → different verdict. 35.47% food cost is over a
  // casual 32% target but under a fine-dining 37% target.
  const dish = [{
    name: 'Ribeye plate', price: 18,
    rows: [{ ingredient: 'Ribeye', apPrice: 10, apQty: 1, apUnit: 'lb', usedQty: 8, usedUnit: 'oz', yieldPercent: 1 }]
  }];
  assert.equal(compute(opts(dish, { serviceModel: 'casual' }))[0].belowTarget, true);
  const fine = compute(opts(dish, { serviceModel: 'fine-dining' }))[0];
  assert.equal(fine.targetPct, 37);
  assert.equal(fine.belowTarget, false);
});

test('flags a dish that crossed below target margin', () => {
  const e = compute(opts([{
    name: 'Ribeye plate', price: 18,
    rows: [{ ingredient: 'Ribeye', apPrice: 10, apQty: 1, apUnit: 'lb', usedQty: 8, usedUnit: 'oz', yieldPercent: 1 }]
  }]))[0];
  assert.equal(e.enteredFoodCostPct, 27.78);  // was under the 30% target when priced
  assert.equal(e.marketFoodCostPct, 35.47);   // market moved it over
  assert.equal(e.belowTarget, true);
  assert.equal(e.crossedTarget, true);
});

test('honors a custom target percentage', () => {
  const e = compute(opts([{
    name: 'Ribeye plate', price: 18,
    rows: [{ ingredient: 'Ribeye', apPrice: 10, apQty: 1, apUnit: 'lb', usedQty: 8, usedUnit: 'oz', yieldPercent: 1 }]
  }], { targetPct: 40 }))[0];
  assert.equal(e.belowTarget, false);          // 35.47% is under a 40% target
});

test('a fuzzy name match is a suggestion, never summed into the plate total', () => {
  const out = compute(opts([{
    name: 'Steak frites',
    rows: [{ ingredient: 'Ribeye steak', apPrice: 10, apQty: 1, apUnit: 'lb', usedQty: 8, usedUnit: 'oz', yieldPercent: 1 }]
  }]));
  // No exact/auto match → no covered line → dish omitted, not a fabricated number.
  assert.equal(out.length, 0);
});

test('an unmatched ingredient is reported unpriced, not guessed', () => {
  const out = compute(opts([{
    name: 'Mixed plate', price: 20,
    rows: [
      { ingredient: 'Ribeye', apPrice: 10, apQty: 1, apUnit: 'lb', usedQty: 8, usedUnit: 'oz', yieldPercent: 1 },
      { ingredient: 'Black truffle', apPrice: 200, apQty: 1, apUnit: 'oz', usedQty: 1, usedUnit: 'oz' }
    ]
  }]));
  const e = out[0];
  assert.equal(e.coveredLines, 1);
  assert.equal(e.totalLines, 2);
  assert.equal(e.unpriced.length, 1);
  assert.equal(e.unpriced[0].reason, 'no-match');
});

test('a market level in a non-bridgeable unit (carton) is excluded, not guessed', () => {
  const out = compute(opts([{
    name: 'Squash side',
    rows: [{ ingredient: 'Acorn squash', apPrice: 1.5, apQty: 1, apUnit: 'lb', usedQty: 4, usedUnit: 'oz', yieldPercent: 0.8 }]
  }]));
  // Market is priced per carton; portion is in oz → can't bridge → no covered line.
  assert.equal(out.length, 0);
});

test('normalizes a yield typed as a whole percent (75 → 0.75)', () => {
  const asFraction = compute(opts([{
    name: 'A', rows: [{ ingredient: 'Ribeye', apPrice: 10, apQty: 1, apUnit: 'lb', usedQty: 8, usedUnit: 'oz', yieldPercent: 0.75 }]
  }]))[0];
  const asPercent = compute(opts([{
    name: 'B', rows: [{ ingredient: 'Ribeye', apPrice: 10, apQty: 1, apUnit: 'lb', usedQty: 8, usedUnit: 'oz', yieldPercent: 75 }]
  }]))[0];
  assert.equal(asFraction.marketPlateCost, asPercent.marketPlateCost);
});

test('sorts dishes by absolute drift, largest first', () => {
  const out = compute(opts([
    { name: 'Small move', rows: [{ ingredient: 'Ribeye', apPrice: 12, apQty: 1, apUnit: 'lb', usedQty: 8, usedUnit: 'oz', yieldPercent: 1 }] },
    { name: 'Big move',   rows: [{ ingredient: 'Ribeye', apPrice: 6,  apQty: 1, apUnit: 'lb', usedQty: 8, usedUnit: 'oz', yieldPercent: 1 }] }
  ]));
  assert.equal(out[0].dish, 'Big move');
  assert.ok(Math.abs(out[0].deltaPct) > Math.abs(out[1].deltaPct));
});

test('degrades to empty (never throws) when the Cost Index module is absent', () => {
  assert.deepEqual(compute({ dishes: [{ name: 'X', rows: [] }] }), []);
  assert.deepEqual(compute({ seed: SEED, dishes: [] }), []);
});
