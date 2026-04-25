#!/usr/bin/env node
// Menu Engineering Matrix — math + classifier regression tests.
// Run via: `node scripts/test-menu-engineering.mjs`
//
// Two categories of assertion (mirrors test-brand-suite.mjs):
//
// 1. Math: number coercion, contribution-margin formulas, median
//    calculations, quadrant assignment, what-if simulations,
//    edge cases (single-item menu, all-same-price, negative CM).
//
// 2. Privacy: every bucket helper returns values only from its
//    enumerated allow-list, tested across full input ranges and
//    against poison-string inputs. If any raw input ever leaks
//    into a bucket return, this suite fails loudly.
//
// Exits non-zero on failure.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const M = require('../tools/menu-engineering/menu-engineering.js');

let failures = 0;
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              (ok ? '' : '  (expected ' + JSON.stringify(expected) +
                        ', got ' + JSON.stringify(actual) + ')'));
  if (!ok) failures++;
}
function assert(label, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label);
  if (!cond) failures++;
}
function assertClose(label, actual, expected, epsilon) {
  const eps = epsilon == null ? 0.01 : epsilon;
  const ok = Math.abs(actual - expected) <= eps;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              (ok ? '' : '  (expected ~' + expected + ' ±' + eps +
                        ', got ' + actual + ')'));
  if (!ok) failures++;
}

// ------------------------------------------------------------
// coerceNumber — accepts strings with $/commas/whitespace
// ------------------------------------------------------------
assertEq('coerce 24', M.coerceNumber(24), 24);
assertEq('coerce "24"', M.coerceNumber('24'), 24);
assertEq('coerce "$24.50"', M.coerceNumber('$24.50'), 24.5);
assertEq('coerce "1,250"', M.coerceNumber('1,250'), 1250);
assertEq('coerce "  $12.00  "', M.coerceNumber('  $12.00  '), 12);
assertEq('coerce null = 0', M.coerceNumber(null), 0);
assertEq('coerce undefined = 0', M.coerceNumber(undefined), 0);
assertEq('coerce "" = 0', M.coerceNumber(''), 0);
assert('coerce "nope" = NaN', isNaN(M.coerceNumber('nope')));

// ------------------------------------------------------------
// contributionMargin
// ------------------------------------------------------------
{
  const cm = M.contributionMargin({ price: 24, food_cost: 6 });
  assertEq('CM dollars 24-6', cm.dollars, 18);
  assertClose('CM percent 18/24', cm.percent, 0.75);
}
{
  const cm = M.contributionMargin({ price: 0, food_cost: 0 });
  assertEq('zero price = zero CM', cm.dollars, 0);
  assertEq('zero price = zero CM percent', cm.percent, 0);
}
{
  // Negative CM (selling below cost) — valid, flagged downstream.
  const cm = M.contributionMargin({ price: 8, food_cost: 12 });
  assertEq('negative CM dollars', cm.dollars, -4);
  assertClose('negative CM percent', cm.percent, -0.5);
}

// ------------------------------------------------------------
// median
// ------------------------------------------------------------
assertEq('median odd', M.median([1, 3, 5, 7, 9]), 5);
assertEq('median even', M.median([1, 2, 3, 4]), 2.5);
assertEq('median single', M.median([42]), 42);
assertEq('median empty', M.median([]), 0);
assertEq('median negatives', M.median([-3, -1, 1, 3]), 0);

// ------------------------------------------------------------
// summariseMenu — canonical 8-item Italian fixture
// Hand-classified expected values:
//   Median CM dollars and median share split items into:
//     Stars     = Cacio e pepe, Bolognese  (high CM, high pop)
//     Plowhorse = House wine, Bread basket (low CM, high pop)
//     Puzzle    = Branzino, Pork chop      (high CM, low pop)
//     Dog       = Caesar, Tiramisu         (low CM, low pop)
// ------------------------------------------------------------
{
  const items = [
    { item: 'Cacio e pepe', price: 24, food_cost: 6,   units_sold: 80 },
    { item: 'Bolognese',    price: 26, food_cost: 9,   units_sold: 60 },
    { item: 'Branzino',     price: 38, food_cost: 12,  units_sold: 12 },
    { item: 'Caesar',       price: 14, food_cost: 4,   units_sold: 50 },
    { item: 'House wine',   price: 12, food_cost: 4,   units_sold: 90 },
    { item: 'Tiramisu',     price: 11, food_cost: 3,   units_sold: 30 },
    { item: 'Pork chop',    price: 32, food_cost: 14,  units_sold: 8  },
    { item: 'Bread basket', price: 6,  food_cost: 1.5, units_sold: 110 }
  ];
  const r = M.summariseMenu(items);
  assertEq('8 items in', r.totals.item_count, 8);
  const byName = {};
  r.items.forEach(it => { byName[it.item] = it; });
  assertEq('Cacio e pepe = Star',  byName['Cacio e pepe'].quadrant, 'Star');
  assertEq('Bolognese = Star',     byName['Bolognese'].quadrant, 'Star');
  assertEq('Branzino = Puzzle',    byName['Branzino'].quadrant, 'Puzzle');
  assertEq('Pork chop = Puzzle',   byName['Pork chop'].quadrant, 'Puzzle');
  assertEq('House wine = Plowhorse', byName['House wine'].quadrant, 'Plowhorse');
  assertEq('Bread basket = Plowhorse', byName['Bread basket'].quadrant, 'Plowhorse');
  assertEq('Caesar = Dog',         byName['Caesar'].quadrant, 'Dog');
  assertEq('Tiramisu = Dog',       byName['Tiramisu'].quadrant, 'Dog');
  // Total CM = sum of (cm_dollars * units_sold). Sanity check positive.
  assert('total CM is positive', r.totals.contribution_margin > 0);
  // Shares sum to 1.
  const shareSum = r.items.reduce((s, it) => s + it.share, 0);
  assertClose('shares sum to 1', shareSum, 1, 0.001);
  // Prime-cost percent reasonable for a casual restaurant.
  assert('prime cost between 25-40%',
         r.totals.prime_cost_pct >= 0.25 && r.totals.prime_cost_pct <= 0.40);
  // No warnings on a well-formed 8-item menu.
  assertEq('no warnings', r.warnings.length, 0);
}

// ------------------------------------------------------------
// summariseMenu edge cases
// ------------------------------------------------------------

// Empty
{
  const r = M.summariseMenu([]);
  assertEq('empty input → 0 items', r.totals.item_count, 0);
  assert('empty input has warning', r.warnings.length > 0);
}

// Drops empty rows
{
  const r = M.summariseMenu([
    { item: '', price: 0, food_cost: 0, units_sold: 0 },
    { item: 'Real', price: 10, food_cost: 3, units_sold: 5 }
  ]);
  assertEq('empty rows dropped', r.totals.item_count, 1);
}

// Small menu warning
{
  const r = M.summariseMenu([
    { item: 'A', price: 10, food_cost: 3, units_sold: 5 },
    { item: 'B', price: 20, food_cost: 5, units_sold: 8 },
    { item: 'C', price: 12, food_cost: 4, units_sold: 12 }
  ]);
  assert('< 6 items → warning', r.warnings.some(w => /Fewer than 6/i.test(w)));
}

// All-same-price menu (x-axis collapses)
{
  const r = M.summariseMenu([
    { item: 'A', price: 10, food_cost: 3, units_sold: 5 },
    { item: 'B', price: 10, food_cost: 3, units_sold: 8 },
    { item: 'C', price: 10, food_cost: 3, units_sold: 12 },
    { item: 'D', price: 10, food_cost: 3, units_sold: 7 },
    { item: 'E', price: 10, food_cost: 3, units_sold: 9 },
    { item: 'F', price: 10, food_cost: 3, units_sold: 11 }
  ]);
  assert('axis-collapse (CM) warning', r.warnings.some(w => /x-axis collapses/i.test(w)));
}

// All-same-volume menu (y-axis collapses)
{
  const r = M.summariseMenu([
    { item: 'A', price: 10, food_cost: 3, units_sold: 10 },
    { item: 'B', price: 12, food_cost: 4, units_sold: 10 },
    { item: 'C', price: 14, food_cost: 5, units_sold: 10 },
    { item: 'D', price: 16, food_cost: 6, units_sold: 10 },
    { item: 'E', price: 18, food_cost: 7, units_sold: 10 },
    { item: 'F', price: 20, food_cost: 8, units_sold: 10 }
  ]);
  assert('axis-collapse (share) warning', r.warnings.some(w => /y-axis collapses/i.test(w)));
}

// Negative CM lands in Dog
{
  const r = M.summariseMenu([
    { item: 'Loss leader', price: 5,  food_cost: 9,  units_sold: 100 },
    { item: 'Normal',      price: 20, food_cost: 6,  units_sold: 30 },
    { item: 'Other',       price: 15, food_cost: 5,  units_sold: 20 },
    { item: 'Pasta',       price: 18, food_cost: 6,  units_sold: 25 },
    { item: 'Salad',       price: 12, food_cost: 3,  units_sold: 18 },
    { item: 'Wine',        price: 10, food_cost: 4,  units_sold: 40 }
  ]);
  const byName = {};
  r.items.forEach(it => { byName[it.item] = it; });
  // Loss leader has negative CM and high share — still ends up Dog.
  assertEq('negative CM → Dog regardless of popularity', byName['Loss leader'].quadrant, 'Dog');
  assert('negative CM dollars', byName['Loss leader'].cm_dollars < 0);
}

// Zero-CM items (sold at exact cost / comp) also land in Dog
{
  const r = M.summariseMenu([
    { item: 'Comp dessert', price: 10, food_cost: 10, units_sold: 100 },
    { item: 'Normal',       price: 20, food_cost: 6,  units_sold: 30 },
    { item: 'Other',        price: 15, food_cost: 5,  units_sold: 20 },
    { item: 'Pasta',        price: 18, food_cost: 6,  units_sold: 25 },
    { item: 'Salad',        price: 12, food_cost: 3,  units_sold: 18 },
    { item: 'Wine',         price: 10, food_cost: 4,  units_sold: 40 }
  ]);
  const byName = {};
  r.items.forEach(it => { byName[it.item] = it; });
  assertEq('zero CM → Dog regardless of popularity', byName['Comp dessert'].quadrant, 'Dog');
  assertEq('zero CM dollars exactly 0', byName['Comp dessert'].cm_dollars, 0);
}

// ------------------------------------------------------------
// simulateChange — pure, never mutates input
// ------------------------------------------------------------
{
  const items = [
    { item: 'A', price: 10, food_cost: 5, units_sold: 30 },
    { item: 'B', price: 12, food_cost: 4, units_sold: 50 },
    { item: 'C', price: 20, food_cost: 6, units_sold: 10 },
    { item: 'D', price: 8,  food_cost: 3, units_sold: 40 },
    { item: 'E', price: 18, food_cost: 7, units_sold: 15 },
    { item: 'F', price: 14, food_cost: 5, units_sold: 25 }
  ];
  const beforeA = items[0].price;
  const r = M.simulateChange(items, [{ index: 0, price: 14 }]);
  assertEq('input not mutated', items[0].price, beforeA);
  const a = r.items.find(it => it.item === 'A');
  assertEq('simulated price applied', a.price, 14);
  assertEq('simulated CM dollars updated', a.cm_dollars, 9);
}

// Patch with units_sold = 0 still applies (not treated as "absent")
{
  const items = [
    { item: 'A', price: 10, food_cost: 5, units_sold: 30 },
    { item: 'B', price: 12, food_cost: 4, units_sold: 50 },
    { item: 'C', price: 20, food_cost: 6, units_sold: 10 },
    { item: 'D', price: 8,  food_cost: 3, units_sold: 40 },
    { item: 'E', price: 18, food_cost: 7, units_sold: 15 },
    { item: 'F', price: 14, food_cost: 5, units_sold: 25 }
  ];
  const r = M.simulateChange(items, [{ index: 0, units_sold: 0 }]);
  const a = r.items.find(it => it.item === 'A');
  assertEq('zero units patched', a.units_sold, 0);
}

// ------------------------------------------------------------
// parseTabularText — paste-from-spreadsheet
// ------------------------------------------------------------

// CSV with header row + 5 columns including category
{
  const csv = 'Item,Price,Food cost,Units sold,Category\nCacio e pepe,24,6,80,Pasta\nBolognese,26,9,60,Pasta';
  const r = M.parseTabularText(csv);
  assertEq('CSV header detected', r.headerRowDetected, true);
  assertEq('CSV mapping all 5', r.mapping, { item: 0, price: 1, food_cost: 2, units_sold: 3, category: 4 });
  assertEq('CSV row count', r.items.length, 2);
  assertEq('CSV first item name', r.items[0].item, 'Cacio e pepe');
  assertEq('CSV warnings none', r.warnings.length, 0);
}

// TSV (tab-delimited) with Spanish headers
{
  const tsv = 'Plato\tPrecio\tCosto\tUnidades\nTacos\t12\t4\t100\nQuesadilla\t14\t5\t60';
  const r = M.parseTabularText(tsv);
  assertEq('TSV ES header detected', r.headerRowDetected, true);
  assertEq('TSV ES mapping found', r.mapping.item, 0);
  assertEq('TSV ES price mapped',  r.mapping.price, 1);
  assertEq('TSV ES food_cost mapped', r.mapping.food_cost, 2);
  assertEq('TSV ES units_sold mapped', r.mapping.units_sold, 3);
}

// CSV with quoted cell containing a comma
{
  const csv = 'Item,Price,Food cost,Units sold\n"Pollo, lemon",18,5,40';
  const r = M.parseTabularText(csv);
  assertEq('quoted-comma cell preserved', r.items[0].item, 'Pollo, lemon');
  assertEq('quoted-comma cell parsed price', r.items[0].price, '18');
}

// CSV with doubled-quote escape
{
  const csv = 'Item,Price,Food cost,Units sold\n"The ""special""",22,7,15';
  const r = M.parseTabularText(csv);
  assertEq('doubled-quote unescaped', r.items[0].item, 'The "special"');
}

// No header row — positional fallback with warning
{
  const data = 'Tacos,12,4,100\nQuesadilla,14,5,60\nBurrito,18,6,40';
  const r = M.parseTabularText(data);
  assertEq('no-header positional mapping', r.mapping, { item: 0, price: 1, food_cost: 2, units_sold: 3 });
  assertEq('no-header detected', r.headerRowDetected, false);
  assert('no-header surfaces warning', r.warnings.some(w => /No header row/i.test(w)));
  assertEq('no-header item count', r.items.length, 3);
}

// Empty input
{
  const r = M.parseTabularText('');
  assertEq('empty text → no items', r.items.length, 0);
  assert('empty text warns',        r.warnings.length > 0);
}

// Whitespace-only input
{
  const r = M.parseTabularText('   \n\n  \n');
  assertEq('whitespace → no items', r.items.length, 0);
}

// Items round-trip into summariseMenu
{
  const csv = 'Item,Price,Food cost,Units sold,Category\n' +
              'Cacio e pepe,24,6,80,Pasta\nBolognese,26,9,60,Pasta\n' +
              'Branzino,38,12,12,Mains\nCaesar,14,4,50,Starters\n' +
              'House wine,12,4,90,Drinks\nTiramisu,11,3,30,Dessert\n' +
              'Pork chop,32,14,8,Mains\nBread basket,6,1.5,110,Sides';
  const parsed = M.parseTabularText(csv);
  const summary = M.summariseMenu(parsed.items);
  assertEq('parser → summariser round-trip count', summary.totals.item_count, 8);
  const cacio = summary.items.find(it => it.item === 'Cacio e pepe');
  assertEq('round-tripped Cacio is Star', cacio.quadrant, 'Star');
}

// Headers with weird casing/punctuation auto-map
{
  const csv = 'MENU ITEM, list-price, COGS, qty\nFoo,10,3,5';
  const r = M.parseTabularText(csv);
  assertEq('headers auto-normalize: item',       r.mapping.item, 0);
  assertEq('headers auto-normalize: price',      r.mapping.price, 1);
  assertEq('headers auto-normalize: food_cost',  r.mapping.food_cost, 2);
  assertEq('headers auto-normalize: units_sold', r.mapping.units_sold, 3);
}

// detectDelimiter
assertEq('detect tab',   M.detectDelimiter('a\tb\tc\nd\te\tf'), '\t');
assertEq('detect comma', M.detectDelimiter('a,b,c\nd,e,f'),     ',');

// ------------------------------------------------------------
// QUADRANTS enum stability
// ------------------------------------------------------------
assertEq('QUADRANTS exposes 4 labels', M.QUADRANTS, ['Star', 'Plowhorse', 'Puzzle', 'Dog']);

// ------------------------------------------------------------
// Privacy-critical bucket helpers — enum purity + poison test
// ------------------------------------------------------------

// bucketMenuSize — sweep
{
  const seen = new Set();
  for (let n = 0; n <= 100; n++) seen.add(M.bucketMenuSize(n));
  for (const v of seen) {
    if (!M.SIZE_BUCKETS.includes(v)) {
      console.log('FAIL  bucketMenuSize non-enum: ' + JSON.stringify(v));
      failures++;
    }
  }
  console.log('PASS  bucketMenuSize sweep (' + seen.size + ' unique, all in enum)');
}
assertEq('size 0 → lt-10', M.bucketMenuSize(0), 'lt-10-items');
assertEq('size 9 → lt-10', M.bucketMenuSize(9), 'lt-10-items');
assertEq('size 10 → 10-25', M.bucketMenuSize(10), '10-25-items');
assertEq('size 24 → 10-25', M.bucketMenuSize(24), '10-25-items');
assertEq('size 25 → 25-50', M.bucketMenuSize(25), '25-50-items');
assertEq('size 49 → 25-50', M.bucketMenuSize(49), '25-50-items');
assertEq('size 50 → gt-50', M.bucketMenuSize(50), 'gt-50-items');
assertEq('size 1000 → gt-50', M.bucketMenuSize(1000), 'gt-50-items');
assertEq('size NaN → lt-10', M.bucketMenuSize(NaN), 'lt-10-items');
assertEq('size neg → lt-10', M.bucketMenuSize(-5), 'lt-10-items');

// bucketPrimeCostBand — sweep
{
  const seen = new Set();
  for (let r = 0; r <= 100000; r += 1000) {
    for (let pct = 0; pct <= 100; pct += 5) {
      const fc = (pct / 100) * r;
      const v = M.bucketPrimeCostBand(fc, r);
      seen.add(v);
      if (!M.PRIME_COST_BANDS.includes(v)) {
        console.log('FAIL  bucketPrimeCostBand non-enum at fc=' + fc + ' r=' + r + ': ' + JSON.stringify(v));
        failures++;
      }
    }
  }
  console.log('PASS  bucketPrimeCostBand sweep (' + seen.size + ' unique, all in enum)');
}
assertEq('prime 20% → lt-25', M.bucketPrimeCostBand(2000, 10000), 'lt-25pct');
assertEq('prime 28% → 25-30', M.bucketPrimeCostBand(2800, 10000), '25-30pct');
assertEq('prime 32% → 30-35', M.bucketPrimeCostBand(3200, 10000), '30-35pct');
assertEq('prime 40% → gt-35', M.bucketPrimeCostBand(4000, 10000), 'gt-35pct');
assertEq('prime zero revenue → lt-25', M.bucketPrimeCostBand(100, 0), 'lt-25pct');

// bucketDogsRatio
assertEq('dogs ratio 0/10 → none', M.bucketDogsRatio(10, 0), 'none');
assertEq('dogs ratio 0/0 → none', M.bucketDogsRatio(0, 0), 'none');
assertEq('dogs ratio 1/20 → lt-10', M.bucketDogsRatio(20, 1), 'lt-10pct');
assertEq('dogs ratio 3/20 → 10-25', M.bucketDogsRatio(20, 3), '10-25pct');
assertEq('dogs ratio 6/20 → gt-25', M.bucketDogsRatio(20, 6), 'gt-25pct');

// Poison-string tests — no raw input may leak through any bucket.
{
  const poison = 'SECRET_MENU_ITEM_CACIO';
  assert('no SECRET leak from bucketMenuSize',
         ('' + M.bucketMenuSize(poison)).indexOf('SECRET') === -1);
  assert('no SECRET leak from bucketPrimeCostBand',
         ('' + M.bucketPrimeCostBand(poison, poison)).indexOf('SECRET') === -1);
  assert('no SECRET leak from bucketDogsRatio',
         ('' + M.bucketDogsRatio(poison, poison)).indexOf('SECRET') === -1);
}

// ------------------------------------------------------------
// Summary
// ------------------------------------------------------------
if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll tests passed.');
