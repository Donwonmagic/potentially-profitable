/**
 * Unit tests — tools/_shared/sales-mix.js
 * Run via:   node --test tools/_shared/sales-mix.test.mjs
 *            (or via scripts/check-tests.mjs in CI)
 *
 * PARITY GUARANTEE. These 8 vectors are the canonical spec for the sales-mix
 * engine. Muntin Ledger mirrors them verbatim at apps/api/tests/sales-mix.test.ts.
 * The end-to-end vector ties CSV → covers → plate-advice so the "$X/week"
 * framing is proven across the seam.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SM = require('./sales-mix.js');
const Advice = require('./plate-advice.js');

test('parses a comma CSV with a recognized header', () => {
  const r = SM.parseSalesMixCsv('Item,Units Sold,Net Sales\nCaesar Salad,42,"$588.00"\nBurger,15,$225.00');
  assert.equal(r.rows.length, 2);
  assert.deepEqual(r.rows[0], { item: 'Caesar Salad', unitsSold: 42, grossSalesCents: 58800 });
  assert.equal(r.rows[1].grossSalesCents, 22500);
});

test('parses a tab CSV and maps header synonyms (Menu Item / Qty / Revenue)', () => {
  const r = SM.parseSalesMixCsv('Menu Item\tQty\tRevenue\nTacos\t30\t120.00');
  assert.equal(r.rows[0].item, 'Tacos');
  assert.equal(r.rows[0].unitsSold, 30);
  assert.equal(r.rows[0].grossSalesCents, 12000);
});

test('falls back to positional columns when no header is recognized', () => {
  const r = SM.parseSalesMixCsv('Pizza,20,300\nWings,40,200');
  assert.ok(r.warnings.some((w) => /No header/.test(w)));
  assert.equal(r.rows.length, 2);
  assert.equal(r.rows[0].item, 'Pizza');
  assert.equal(r.rows[0].unitsSold, 20);
});

test('skips rows with no item or non-positive units', () => {
  const r = SM.parseSalesMixCsv('Item,Units Sold\nGood,10\n,5\nBadUnits,0\nAlsoGood,3');
  assert.deepEqual(r.rows.map((x) => x.item), ['Good', 'AlsoGood']);
});

test('weeklyCovers normalizes the export period to a per-week rate', () => {
  const rows = [{ item: 'Caesar', unitsSold: 28, grossSalesCents: null }];
  assert.deepEqual(SM.weeklyCovers(rows, { periodDays: 14 }), { Caesar: 14 });
  assert.deepEqual(SM.weeklyCovers(rows, { periodDays: 7 }), { Caesar: 28 });
  assert.deepEqual(SM.weeklyCovers(rows), { Caesar: 28 });
});

test('weeklyCovers folds duplicate items and can key by a custom fn', () => {
  const rows = [{ item: 'Caesar', unitsSold: 10, grossSalesCents: null }, { item: 'caesar', unitsSold: 4, grossSalesCents: null }];
  const out = SM.weeklyCovers(rows, { periodDays: 7, keyFn: (s) => s.toLowerCase() });
  assert.equal(out.caesar, 14);
});

test('END TO END: CSV upload → real covers → Plate frames actual $/week', () => {
  const parsed = SM.parseSalesMixCsv('Item,Units Sold\nCaesar,28\nBurger,40');
  const covers = SM.weeklyCovers(parsed.rows, { periodDays: 7 });
  assert.equal(covers.Caesar, 28);

  const r = Advice.advise({
    itemName: 'Caesar', plateCostCents: 540, menuPriceCents: 1600, targetFoodCostPct: 0.30,
    coversPerWeek: covers.Caesar,
    priceMove: { addedCostCentsPerPlate: 31, ingredient: 'Romaine', pctMove: 0.14 },
  });
  assert.equal(r.tier, 'hike');
  assert.match(r.headline, /\/week/);
  assert.match(r.headline, /Romaine went up/);
});

test('empty / junk input degrades gracefully', () => {
  assert.deepEqual(SM.parseSalesMixCsv('').rows, []);
  assert.deepEqual(SM.weeklyCovers(null), {});
});
