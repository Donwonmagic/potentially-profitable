/**
 * Unit tests — tools/_shared/cost-index-sources.js
 * Run via:  node --test tools/_shared/cost-index-sources.test.mjs
 *
 * PARITY GUARANTEE. Mirrored verbatim by Muntin Ledger at
 * apps/api/tests/cost-index/cost-index-sources.test.ts. Raw API payloads →
 * normalize → buildCompositeInput → composite.assess; a shape change fails here.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const S = require('./cost-index-sources.js');
const C = require('./composite-price.js');

const FRED_FIXTURE = {
  observations: [
    { date: '2026-03-01', value: '100' },
    { date: '2026-04-01', value: '.' },
    { date: '2026-05-01', value: '107' },
  ],
};
const BLS_FIXTURE = {
  Results: { series: [{ seriesID: 'WPU0131', data: [
    { year: '2026', period: 'M05', value: '213' },
    { year: '2026', period: 'M03', value: '200' },
    { year: '2026', period: 'M13', value: '999' },
  ] }] },
};
const AMS_FIXTURE = {
  results: [
    { report_date: '03/01/2026', avg_price: '$13.00' },
    { report_date: '05/01/2026', avg_price: '14.00' },
  ],
};

test('FRED normalizer drops the "." missing marker and sorts ascending', () => {
  const out = S.normalizeFred(FRED_FIXTURE, { source: 'fred', basis: 'index' });
  assert.deepEqual(out.points.map((p) => p.value), [100, 107]);
  assert.equal(out.basis, 'index');
});

test('BLS normalizer maps M-periods to dates, skips the M13 annual avg, sorts', () => {
  const out = S.normalizeBls(BLS_FIXTURE, { source: 'bls', basis: 'index' });
  assert.deepEqual(out.points.map((p) => p.date), ['2026-03-01', '2026-05-01']);
  assert.deepEqual(out.points.map((p) => p.value), [200, 213]);
});

test('AMS normalizer parses MM/DD/YYYY dates and strips currency symbols', () => {
  const out = S.normalizeAms(AMS_FIXTURE, { source: 'usda-ams', basis: 'wholesale' });
  assert.deepEqual(out.points.map((p) => p.date), ['2026-03-01', '2026-05-01']);
  assert.deepEqual(out.points.map((p) => p.value), [13.0, 14.0]);
});

test('end-to-end: three sources → composite with wholesale level + blended up-trend', () => {
  const outputs = [
    S.normalizeFred(FRED_FIXTURE, { source: 'fred', basis: 'index' }),
    S.normalizeBls(BLS_FIXTURE, { source: 'bls', basis: 'index' }),
    S.normalizeAms(AMS_FIXTURE, { source: 'usda-ams', basis: 'wholesale' }),
  ];
  const input = S.buildCompositeInput(outputs, { asOf: '2026-05-01' });
  assert.equal(input.levelObs.length, 1);
  assert.equal(input.levelObs[0].basis, 'wholesale');
  assert.equal(input.levelObs[0].valueCents, 1400);

  const r = C.assess(input);
  assert.equal(r.level.basis, 'wholesale');
  assert.equal(r.level.medianCents, 1400);
  assert.equal(r.trend.dir, 'up');
  assert.equal(r.trend.agreement, 1);
  assert.equal(r.trend.nSources, 3);
  assert.equal(r.confidence, 'medium');
  assert.match(r.label, /wholesale reference/);
  assert.ok(r.provenance.length >= 4);
});

test('AMS reducer: mostlyMid averages the mostly band, falls back to low/high', () => {
  assert.equal(S.reduceAmsRow({ mostly_low: '13.00', mostly_high: '15.00' }, 'mostlyMid'), 14);
  assert.equal(S.reduceAmsRow({ low_price: '$12.00', high_price: '$16.00' }, 'mostlyMid'), 14);
  assert.equal(S.reduceAmsRow({ note: 'no price' }, 'mostlyMid'), null);
});

test('AMS reducer: valuePerPound derives $/lb from dollars and pounds', () => {
  assert.equal(S.reduceAmsRow({ dollars: '2800', pounds: '200' }, 'valuePerPound'), 14);
  assert.equal(S.reduceAmsRow({ dollars: '2800', pounds: '0' }, 'valuePerPound'), null);
});

test('normalizeAms honors a mostlyMid reducer on ranged rows', () => {
  const out = S.normalizeAms(
    { results: [
      { report_date: '2026-05-01', mostly_low: '12.50', mostly_high: '13.50' },
      { report_date: '2026-05-08', mostly_low: '13.00', mostly_high: '15.00' },
    ] },
    { source: 'usda-ams', basis: 'wholesale', reducer: 'mostlyMid' });
  assert.deepEqual(out.points.map((p) => p.value), [13.0, 14.0]);
});

test('contract guard: an empty/garbage payload yields no points, not a crash', () => {
  assert.deepEqual(S.normalizeFred({}, {}).points, []);
  assert.deepEqual(S.normalizeBls({ Results: { series: [] } }, {}).points, []);
  assert.deepEqual(S.normalizeAms(null, {}).points, []);
  const r = C.assess(S.buildCompositeInput([], {}));
  assert.match(r.label, /Not enough data/);
});

test('normalizeAms commodity filter pulls ONE ingredient out of a multi-commodity report', () => {
  const veg = { results: [
    { report_date: '06/03/2026', commodity: 'Lettuce, Romaine', low_price: '24.00', high_price: '26.00' },
    { report_date: '06/03/2026', commodity: 'Tomatoes', low_price: '18.00', high_price: '22.00' },
  ] };
  const out = S.normalizeAms(veg, { source: 'usda-ams', basis: 'wholesale', reducer: 'mostlyMid', commodity: 'romaine' });
  assert.equal(out.points.length, 1);
  assert.equal(out.points[0].value, 25);
});

test('normalizeAms wtdAvg + priceUnit (Cents Per Lb) + matchFields restricts the match', () => {
  const chicken = { results: [
    { report_date: '05/04/2026', item: 'Breast - B/S', price_unit: 'Cents Per Lb', wtd_avg_price: 145.72 },
    { report_date: '05/04/2026', item: 'Whole', notes: 'breast - b/s trim note', wtd_avg_price: 88.0 }, // 'breast' only outside item → must NOT match
  ] };
  const out = S.normalizeAms(chicken, { source: 'usda-ams-national', basis: 'wholesale', reducer: 'wtdAvg', priceUnit: 'Cents Per Lb', matchFields: ['item'], commodity: 'Breast - B/S', unit: 'lb' });
  assert.equal(out.points.length, 1);
  assert.equal(out.points[0].value, 1.4572); // 145.72 cents → dollars/lb
});

test('normalizeAms priceUnit Dollars Per Cwt → dollars per lb', () => {
  const beef = { results: [{ report_date: '06/05/2026', commodity: 'Ribeye', wtd_avg_price: 1159 }] };
  const out = S.normalizeAms(beef, { source: 'usda-lmr', basis: 'wholesale', reducer: 'wtdAvg', priceUnit: 'Dollars Per Cwt', commodity: 'ribeye', unit: 'lb' });
  assert.equal(out.points[0].value, 11.59); // $1159/cwt → $11.59/lb
});

test('normalizeEia parses response.data, skips nulls, sorts oldest→newest (basis index)', () => {
  const eia = { response: { dateFormat: 'YYYY-MM', data: [
    { period: '2026-03', price: '12.88', 'price-units': 'cents per kilowatthour' },
    { period: '2026-04', price: null, 'price-units': 'cents per kilowatthour' }, // preliminary → skipped
    { period: '2026-02', price: '12.61', 'price-units': 'cents per kilowatthour' },
  ] } };
  const out = S.normalizeEia(eia, { source: 'eia', basis: 'index', value: 'price' });
  assert.equal(out.basis, 'index');
  assert.deepEqual(out.points, [{ date: '2026-02-01', value: 12.61 }, { date: '2026-03-01', value: 12.88 }]);
});
