#!/usr/bin/env node
// Plate Cost Calculator — math + privacy regression tests.
// Run via: `node scripts/test-plate-cost.mjs`
//
// Four assertion categories (mirrors the prior tools' test pattern):
//
// 1. Cost math: per-ingredient EP/AP/used costs, plate cost, batch
//    recipes, suggested prices.
// 2. Unit conversions: within-category exhaustive, cross-category
//    returns NaN, normalisation handles edge cases.
// 3. Edge cases: 1-ingredient, 0% yield, over-used, mixed-units,
//    invalid numbers, unknown-yield fallback.
// 4. Privacy / bucket purity: every bucket helper returns enum-
//    locked values across full input ranges + poison strings.
//
// Exits non-zero on failure.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const PC = require('../tools/plate-cost/plate-cost.js');

let failures = 0;
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              (ok ? '' : '  (expected ' + JSON.stringify(expected) +
                        ', got ' + JSON.stringify(actual) + ')'));
  if (!ok) failures++;
}
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label +
              (cond ? '' : (detail ? '  (' + detail + ')' : '')));
  if (!cond) failures++;
}
function near(label, actual, expected, tolerance) {
  const t = tolerance == null ? 1e-6 : tolerance;
  const diff = Math.abs(Number(actual) - Number(expected));
  const ok = isFinite(diff) && diff <= t;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              (ok ? '' : '  (expected ~' + expected + ', got ' + actual + ', |Δ|=' + diff + ')'));
  if (!ok) failures++;
}

// ============================================================
// 1. Unit conversions
// ============================================================

near('1 lb → 16 oz',          PC.convertUnits(1,    'lb',   'oz'),    16);
near('16 oz → 1 lb',          PC.convertUnits(16,   'oz',   'lb'),    1);
near('1 kg → 1000 g',         PC.convertUnits(1,    'kg',   'g'),     1000);
near('1 oz → 28.3495 g',      PC.convertUnits(1,    'oz',   'g'),     28.349523125, 1e-3);
near('1 lb → 453.59 g',       PC.convertUnits(1,    'lb',   'g'),     453.59237, 1e-3);

near('1 cup → 8 fl-oz',       PC.convertUnits(1,    'cup',  'fl-oz'), 8, 0.01);
near('1 cup → 16 tbsp',       PC.convertUnits(1,    'cup',  'tbsp'),  16, 0.01);
near('3 tsp → 1 tbsp',        PC.convertUnits(3,    'tsp',  'tbsp'),  1, 1e-3);
near('1 gal → 4 qt',          PC.convertUnits(1,    'gal',  'qt'),    4, 0.01);
near('1 l → 1000 ml',         PC.convertUnits(1,    'l',    'ml'),    1000);

near('1 dozen → 12 each',     PC.convertUnits(1,    'dozen','each'),  12);
near('24 each → 2 dozen',     PC.convertUnits(24,   'each', 'dozen'), 2);

assert('lb → cup is NaN (cross-category)', isNaN(PC.convertUnits(1, 'lb', 'cup')));
assert('oz → each is NaN',                  isNaN(PC.convertUnits(1, 'oz', 'each')));
assert('cup → dozen is NaN',                isNaN(PC.convertUnits(1, 'cup', 'dozen')));
assert('unknown unit "stones" is NaN',      isNaN(PC.convertUnits(1, 'stones', 'lb')));

// Unit normalisation
assertEq('normalize "LBS"',       PC.normalizeUnit('LBS'),     'lbs');
assertEq('normalize " lb. "',     PC.normalizeUnit(' lb. '),   'lb');
assertEq('normalize "fl oz"',     PC.normalizeUnit('fl oz'),   'fl oz');
assertEq('normalize null → ""',   PC.normalizeUnit(null),      '');
assertEq('normalize undefined',   PC.normalizeUnit(undefined), '');

// ============================================================
// 2. Yield-table lookup
// ============================================================

assertEq('Romaine yield is 0.75',           PC.lookupYield('Romaine'),               0.75);
assertEq('romaine (lowercase) yield',        PC.lookupYield('romaine'),               0.75);
assertEq('Whole chicken yield is 0.60',     PC.lookupYield('Whole chicken'),         0.60);
assertEq('Whole halibut yield is 0.50',     PC.lookupYield('whole halibut'),         0.50);
assertEq('Tomato yield is 0.91',            PC.lookupYield('Tomato'),                0.91);
assertEq('Olive oil yield is 1.00',         PC.lookupYield('olive oil'),             1.00);
assertEq('Unknown ingredient → null',        PC.lookupYield('dragonfruit'),           null);
assertEq('Plural fallback ("tomatoes")',    PC.lookupYield('tomatoes'),              0.91);
assertEq('Empty string → null',              PC.lookupYield(''),                      null);
assertEq('null → null',                      PC.lookupYield(null),                    null);

// ============================================================
// 3. Per-ingredient cost — single rows
// ============================================================

// Simple: 1 lb of pasta @ $4.50, use 4 oz, 100% yield → $1.125
const pastaRow = {
  ingredient: 'Tonnarelli', apPrice: 4.50, apQty: 1, apUnit: 'lb',
  yieldPercent: 1.00, usedQty: 4, usedUnit: 'oz'
};
const pasta = PC.computeIngredientCost(pastaRow);
near('pasta apUnitCost = $4.50/lb',  pasta.apUnitCost, 4.50);
near('pasta epUnitCost = $4.50/lb',  pasta.epUnitCost, 4.50);
near('pasta usedCost  = $1.125',      pasta.usedCost,   1.125, 1e-6);
assertEq('pasta no warning',          pasta.warning,    null);

// Yield-affected: 1 lb of pecorino @ $18, use 1.5 oz, 95% yield
//   AP unit cost = $18/lb
//   EP unit cost = $18/0.95 = $18.947/lb
//   Used cost    = $18.947 × (1.5/16) = $1.7763
const pec = PC.computeIngredientCost({
  ingredient: 'Pecorino Romano', apPrice: 18, apQty: 1, apUnit: 'lb',
  yieldPercent: 0.95, usedQty: 1.5, usedUnit: 'oz'
});
near('pecorino apUnitCost',     pec.apUnitCost,  18);
near('pecorino epUnitCost',     pec.epUnitCost,  18 / 0.95, 1e-6);
near('pecorino usedCost',       pec.usedCost,    (18 / 0.95) * (1.5 / 16), 1e-6);
near('pecorino apToEp',         pec.apToEp,      1 / 0.95, 1e-6);
assertEq('pecorino no warning', pec.warning,     null);

// Look-up yield: row omits yieldPercent for "Whole halibut" → 0.50.
const halibut = PC.computeIngredientCost({
  ingredient: 'Whole halibut', apPrice: 80, apQty: 1, apUnit: 'lb',
  usedQty: 5, usedUnit: 'oz'
});
near('halibut yield from table', halibut.yieldPercent, 0.50);
near('halibut epUnitCost',       halibut.epUnitCost,    80 / 0.50, 1e-6);
near('halibut usedCost',         halibut.usedCost,      (80 / 0.50) * (5 / 16), 1e-6);

// Cross-category mixed units — surface 'mixed-units' warning, no cost
const mixed = PC.computeIngredientCost({
  ingredient: 'Olive oil', apPrice: 24, apQty: 1, apUnit: 'l',
  yieldPercent: 1, usedQty: 1, usedUnit: 'oz'                 // weight vs volume
});
assertEq('mixed-units warning', mixed.warning, 'mixed-units');
assertEq('mixed-units cost = 0', mixed.usedCost, 0);

// Volume → volume (tbsp → l)
const oil = PC.computeIngredientCost({
  ingredient: 'Olive oil', apPrice: 24, apQty: 1, apUnit: 'l',
  yieldPercent: 1, usedQty: 1, usedUnit: 'tbsp'
});
assertEq('olive oil no warning', oil.warning, null);
near('olive oil usedCost',       oil.usedCost,    24 * (14.7868 / 1000), 1e-3);

// Zero-yield warning
const zero = PC.computeIngredientCost({
  ingredient: 'something', apPrice: 5, apQty: 1, apUnit: 'lb',
  yieldPercent: 0, usedQty: 1, usedUnit: 'oz'
});
assertEq('zero-yield warning', zero.warning,  'zero-yield');
assertEq('zero-yield usedCost = 0', zero.usedCost, 0);

// Invalid numbers
const invalid = PC.computeIngredientCost({
  ingredient: 'x', apPrice: 'NaN', apQty: 1, apUnit: 'lb',
  yieldPercent: 1, usedQty: 1, usedUnit: 'oz'
});
assertEq('invalid-numbers warning', invalid.warning, 'invalid-numbers');

// Over-used (used > AP × 50) — surfaces a warning, still computes
const over = PC.computeIngredientCost({
  ingredient: 'flour', apPrice: 1, apQty: 1, apUnit: 'oz',
  yieldPercent: 1, usedQty: 5, usedUnit: 'lb'
});
assertEq('over-used warning', over.warning, 'over-used');

// Unknown-yield fallback (no yield given, ingredient not in table)
const unknown = PC.computeIngredientCost({
  ingredient: 'dragonfruit pulp', apPrice: 12, apQty: 1, apUnit: 'lb',
  usedQty: 2, usedUnit: 'oz'
});
assertEq('unknown-yield warning', unknown.warning, 'unknown-yield');
near('unknown-yield assumes 1.0',  unknown.yieldPercent, 1);

// ============================================================
// 4. Whole-recipe — Cacio e pepe sample
// ============================================================

const sample = PC.computePlateCost(PC.SAMPLE_RECIPE_EN);
assertEq('sample recipe name',           sample.name,        'Cacio e pepe');
assertEq('sample portions = 1',          sample.portions,    1);
assertEq('sample ingredient count = 5',  sample.ingredients.length, 5);
assertEq('sample warnings empty',        sample.warnings,    []);
assertEq('sample confidence high',       sample.confidence,  'high');
assert('sample plateCost reasonable ($3-4)',  sample.plateCost > 3 && sample.plateCost < 4);
near('sample batchCost matches plateCost (1 portion)',
     sample.batchCost, sample.plateCost, 1e-9);

// Bolognese batch — 8-portion → batchCost / 8
const bolognese = {
  name: 'Bolognese',
  portions: 8,
  rows: [
    { ingredient: 'Ground beef', apPrice: 6, apQty: 1, apUnit: 'lb', yieldPercent: 1, usedQty: 1, usedUnit: 'lb' },
    { ingredient: 'Ground pork', apPrice: 5, apQty: 1, apUnit: 'lb', yieldPercent: 1, usedQty: 0.5, usedUnit: 'lb' },
    { ingredient: 'Onion',       apPrice: 1.50, apQty: 1, apUnit: 'lb', yieldPercent: 0.88, usedQty: 8, usedUnit: 'oz' },
    { ingredient: 'Carrot',      apPrice: 1.20, apQty: 1, apUnit: 'lb', yieldPercent: 0.82, usedQty: 4, usedUnit: 'oz' },
    { ingredient: 'Tomato',      apPrice: 2.50, apQty: 1, apUnit: 'lb', yieldPercent: 0.91, usedQty: 2, usedUnit: 'lb' }
  ]
};
const bol = PC.computePlateCost(bolognese);
assertEq('bolognese portions',              bol.portions,           8);
assertEq('bolognese ingredient count',      bol.ingredients.length, 5);
near('bolognese plateCost = batch / 8',    bol.plateCost,          bol.batchCost / 8, 1e-9);
assert('bolognese plate cost > 0',          bol.plateCost > 0);

// Suggested prices for $3.35 plate cost
const prices = PC.suggestMenuPrices(3.35);
assertEq('three suggested prices',  prices.length, 3);
near('28% target → $11.96',         prices[0].price, 3.35 / 0.28, 1e-3);
near('30% target → $11.17',         prices[1].price, 3.35 / 0.30, 1e-3);
near('33% target → $10.15',         prices[2].price, 3.35 / 0.33, 1e-3);
near('30% CM dollars',              prices[1].cmDollars, prices[1].price - 3.35, 1e-3);
assertEq('zero plateCost → zero prices', PC.suggestMenuPrices(0)[0].price, 0);

// ============================================================
// 5. validateRecipe
// ============================================================

const v1 = PC.validateRecipe(PC.SAMPLE_RECIPE_EN);
assertEq('sample recipe is valid', v1.valid, true);

const v2 = PC.validateRecipe(null);
assertEq('null recipe → invalid', v2.valid, false);

const v3 = PC.validateRecipe({ portions: 1, rows: [] });
assertEq('empty rows → invalid', v3.valid, false);

const v4 = PC.validateRecipe({ portions: 0, rows: [{ ingredient: 'x', apPrice: 1, apQty: 1, apUnit: 'lb', usedQty: 1, usedUnit: 'oz' }] });
assertEq('zero portions → invalid', v4.valid, false);

const v5 = PC.validateRecipe({ portions: 1, rows: [
  { ingredient: '', apPrice: 1, apQty: 1, apUnit: 'lb', usedQty: 1, usedUnit: 'oz' }
] });
assertEq('missing ingredient name → warning, valid', v5.valid, true);
assert('missing-name warning fires', v5.warnings.length > 0);

const v6 = PC.validateRecipe({ portions: 1, rows: [
  { ingredient: 'x', apPrice: -1, apQty: 1, apUnit: 'lb', usedQty: 1, usedUnit: 'oz' }
] });
assertEq('negative apPrice → invalid', v6.valid, false);

const v7 = PC.validateRecipe({ portions: 1, rows: [
  { ingredient: 'x', apPrice: 1, apQty: 1, apUnit: 'stones', usedQty: 1, usedUnit: 'oz' }
] });
assertEq('unrecognised AP unit → invalid', v7.valid, false);

const v8 = PC.validateRecipe({ portions: 1, rows: [
  { ingredient: 'x', apPrice: 1, apQty: 1, apUnit: 'lb', usedQty: 1, usedUnit: 'cup' }
] });
assertEq('mixed-category units → valid + warning', v8.valid, true);
assert('mixed-category warning fires', v8.warnings.length > 0);

// ============================================================
// 6. Plausible bucket purity — enum-locked across input ranges +
// poison strings.
// ============================================================

const ICOUNT_BUCKETS = ['0','1-3','4-7','8-12','gt-12'];
const YUSAGE_BUCKETS = ['none-set','partial','full'];
const PCOST_BUCKETS  = ['invalid','lt-2','2-5','5-10','gt-10'];

[0, -1, NaN, '<script>', null, undefined, {}, '0', '1', '3', '4', '7', '8', '12', '13', '999'].forEach(function(v){
  const b = PC.bucketIngredientCount(v);
  assert('bucketIngredientCount(' + JSON.stringify(v) + ') ∈ enum', ICOUNT_BUCKETS.indexOf(b) !== -1, b);
});

[null, undefined, [], 'NOT_AN_ARRAY', {evil:1}].forEach(function(v){
  const b = PC.bucketYieldUsage(v);
  assert('bucketYieldUsage(' + JSON.stringify(v) + ') ∈ enum', YUSAGE_BUCKETS.indexOf(b) !== -1, b);
});

const yRows1 = [{ yieldPercent: '' }, { yieldPercent: null }];
assertEq('bucketYieldUsage all-blank → none-set', PC.bucketYieldUsage(yRows1), 'none-set');
const yRows2 = [{ yieldPercent: 0.75 }, { yieldPercent: 1 }, { yieldPercent: 1 }, { yieldPercent: 1 }];
assertEq('bucketYieldUsage 1/4 with yield → partial', PC.bucketYieldUsage(yRows2), 'partial');
const yRows3 = [{ yieldPercent: 0.75 }, { yieldPercent: 0.6 }, { yieldPercent: 1 }];
assertEq('bucketYieldUsage 2/3 with yield → full', PC.bucketYieldUsage(yRows3), 'full');

[-1, NaN, 'evil', null, undefined, 0, 1.99, 2, 4.99, 5, 9.99, 10, 100].forEach(function(v){
  const b = PC.bucketPlateCostBand(v);
  assert('bucketPlateCostBand(' + JSON.stringify(v) + ') ∈ enum', PCOST_BUCKETS.indexOf(b) !== -1, b);
});

assertEq('bucketPlateCostBand(0) = lt-2',   PC.bucketPlateCostBand(0),   'lt-2');
assertEq('bucketPlateCostBand(1.99) = lt-2',PC.bucketPlateCostBand(1.99),'lt-2');
assertEq('bucketPlateCostBand(2) = 2-5',    PC.bucketPlateCostBand(2),   '2-5');
assertEq('bucketPlateCostBand(4.99) = 2-5', PC.bucketPlateCostBand(4.99),'2-5');
assertEq('bucketPlateCostBand(5) = 5-10',   PC.bucketPlateCostBand(5),   '5-10');
assertEq('bucketPlateCostBand(10) = gt-10', PC.bucketPlateCostBand(10),  'gt-10');
assertEq('bucketPlateCostBand(-1) = invalid', PC.bucketPlateCostBand(-1),'invalid');

assertEq('bucketIngredientCount(0) = 0',     PC.bucketIngredientCount(0),  '0');
assertEq('bucketIngredientCount(1) = 1-3',   PC.bucketIngredientCount(1),  '1-3');
assertEq('bucketIngredientCount(7) = 4-7',   PC.bucketIngredientCount(7),  '4-7');
assertEq('bucketIngredientCount(8) = 8-12',  PC.bucketIngredientCount(8),  '8-12');
assertEq('bucketIngredientCount(13) = gt-12',PC.bucketIngredientCount(13), 'gt-12');

// Poison-string sweep: every value passed through every bucket
// helper must still come out as one of the declared enum values.
const poison = ['<script>alert(1)</script>', "'); DROP TABLE", '\0', ' ', 'Infinity', 'NaN', '0xff'];
poison.forEach(function(p){
  assert('no leak from bucketIngredientCount(' + JSON.stringify(p) + ')',
    ICOUNT_BUCKETS.indexOf(PC.bucketIngredientCount(p)) !== -1);
  assert('no leak from bucketPlateCostBand(' + JSON.stringify(p) + ')',
    PCOST_BUCKETS.indexOf(PC.bucketPlateCostBand(p)) !== -1);
});

// ============================================================
console.log('\n' + (failures === 0
  ? '✓ all plate-cost assertions pass'
  : '✗ ' + failures + ' plate-cost assertion(s) failed'));
process.exit(failures === 0 ? 0 : 1);
