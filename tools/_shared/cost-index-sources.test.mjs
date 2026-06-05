/**
 * End-to-end contract test for the Cost Index pipeline:
 * raw API payloads → normalize → buildCompositeInput → composite.assess.
 * If a source changes its JSON shape, the normalizer fixtures fail here
 * LOUDLY instead of poisoning the index.
 *
 *   node --test tools/_shared/cost-index-sources.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const S = require('./cost-index-sources.js');
const C = require('./composite-price.js');
const Q = require('./observation-quality.js');

// ---- canned fixtures (the upstream dialects) ----
const FRED_FIXTURE = {
  observations: [
    { date: '2026-03-01', value: '100' },
    { date: '2026-04-01', value: '.' },        // FRED missing marker → dropped
    { date: '2026-05-01', value: '107' },
  ],
};
const BLS_FIXTURE = {
  Results: { series: [{ seriesID: 'WPU0131', data: [
    { year: '2026', period: 'M05', value: '213' },
    { year: '2026', period: 'M03', value: '200' },   // out of order → sorted
    { year: '2026', period: 'M13', value: '999' },   // annual avg → skipped
  ] }] },
};
const AMS_FIXTURE = {
  results: [
    { report_date: '03/01/2026', avg_price: '$13.00' },   // MM/DD/YYYY + $ symbol
    { report_date: '05/01/2026', avg_price: '14.00' },
  ],
};

test('FRED normalizer drops the "." missing marker and sorts ascending', () => {
  const out = S.normalizeFred(FRED_FIXTURE, { source: 'fred', basis: 'index' });
  assert.deepEqual(out.points.map(p => p.value), [100, 107]);
  assert.equal(out.basis, 'index');
});

test('BLS normalizer maps M-periods to dates, skips the M13 annual avg, sorts', () => {
  const out = S.normalizeBls(BLS_FIXTURE, { source: 'bls', basis: 'index' });
  assert.deepEqual(out.points.map(p => p.date), ['2026-03-01', '2026-05-01']);
  assert.deepEqual(out.points.map(p => p.value), [200, 213]);
});

test('AMS normalizer parses MM/DD/YYYY dates and strips currency symbols', () => {
  const out = S.normalizeAms(AMS_FIXTURE, { source: 'usda-ams', basis: 'wholesale' });
  assert.deepEqual(out.points.map(p => p.date), ['2026-03-01', '2026-05-01']);
  assert.deepEqual(out.points.map(p => p.value), [13.0, 14.0]);
});

test('end-to-end: three sources → composite with wholesale level + blended up-trend', () => {
  const outputs = [
    S.normalizeFred(FRED_FIXTURE, { source: 'fred', basis: 'index' }),
    S.normalizeBls(BLS_FIXTURE, { source: 'bls', basis: 'index' }),
    S.normalizeAms(AMS_FIXTURE, { source: 'usda-ams', basis: 'wholesale' }),
  ];
  const input = S.buildCompositeInput(outputs, { asOf: '2026-05-01' });

  // Level comes ONLY from AMS (the lone non-index/level source), in cents.
  assert.equal(input.levelObs.length, 1);
  assert.equal(input.levelObs[0].basis, 'wholesale');
  assert.equal(input.levelObs[0].valueCents, 1400); // $14.00 latest

  const r = C.assess(input);
  assert.equal(r.level.basis, 'wholesale');
  assert.equal(r.level.medianCents, 1400);
  assert.equal(r.trend.dir, 'up');                 // all three sources rose
  assert.equal(r.trend.agreement, 1);
  assert.equal(r.trend.nSources, 3);
  // One level source + 3 corroborating trend sources → honest "medium".
  assert.equal(r.confidence, 'medium');
  assert.match(r.label, /wholesale reference/);
  assert.ok(r.provenance.length >= 4);             // every source retained, citeable
});

test('AMS reducer: mostlyMid averages the mostly band, falls back to low/high', () => {
  assert.equal(S.reduceAmsRow({ mostly_low: '13.00', mostly_high: '15.00' }, 'mostlyMid'), 14);
  // live MARS terminal rows use the _price suffix (mostly_low_price/mostly_high_price)
  assert.equal(S.reduceAmsRow({ mostly_low_price: '16.00', mostly_high_price: '18.00' }, 'mostlyMid'), 17);
  // a null/blank mostly band (common — band often absent) falls through to low/high
  assert.equal(S.reduceAmsRow({ mostly_low_price: null, mostly_high_price: '', low_price: '12.00', high_price: '16.00' }, 'mostlyMid'), 14);
  // no mostly_* → fall back to low/high
  assert.equal(S.reduceAmsRow({ low_price: '$12.00', high_price: '$16.00' }, 'mostlyMid'), 14);
  // neither present → null (dropped, never guessed)
  assert.equal(S.reduceAmsRow({ note: 'no price' }, 'mostlyMid'), null);
});

test('AMS reducer: valuePerPound derives $/lb from dollars and pounds', () => {
  assert.equal(S.reduceAmsRow({ dollars: '2800', pounds: '200' }, 'valuePerPound'), 14);
  assert.equal(S.reduceAmsRow({ dollars: '2800', pounds: '0' }, 'valuePerPound'), null); // no div-by-zero
});

test('AMS reducer: price_unit "Cents Per Lb" is converted to dollars (the chicken bug)', () => {
  // Real National Chicken Report row: 145.72 ¢/lb must become $1.4572/lb, not $145.72.
  const row = { item: 'Breast - B/S', wtd_avg_price: 145.72, low_price: '120.00', high_price: '173.00', price_unit: 'Cents Per Lb' };
  assert.equal(S.reduceAmsRow(row, 'wtdAvg').toFixed(4), '1.4572');     // prefers the volume-weighted average
  assert.equal(S.reduceAmsRow(row, 'mostlyMid'), 1.465);               // (120+173)/2 = 146.5 ¢ → $1.465
  // Dollars rows (no price_unit) are unscaled — produce path stays correct.
  assert.equal(S.reduceAmsRow({ mostly_low_price: '16.00', mostly_high_price: '18.00' }, 'mostlyMid'), 17);
});

test('AMS/LMR reducer: "Dollars Per Cwt" is converted to $/lb (boxed beef / pork)', () => {
  // LMR boxed-beef cuts quote $/cwt → divide by 100 for a $/lb level.
  const row = { commodity: 'Ribeye', low_price: '280.00', high_price: '320.00', price_unit: 'Dollars Per Cwt' };
  assert.equal(S.reduceAmsRow(row, 'mostlyMid'), 3.0);             // (280+320)/2 = 300 $/cwt → $3.00/lb
  const out = S.normalizeAms({ results: [{ ...row, report_date: '2026-05-01' }] }, { reducer: 'mostlyMid', commodity: 'Ribeye' });
  assert.equal(out.unit, 'lb');
  assert.equal(out.points[0].value, 3.0);
});

test('LMR Datamart row: case-insensitive Item_Description match + weighted_average + $/cwt fallback', () => {
  // Real LMR pork row shape: capital "Item_Description", price_range_*/weighted_average,
  // NO price_unit field (the spec supplies the $/cwt fallback).
  const lmr = { results: [
    { report_date: '06/04/2026', Item_Description: '1/4 Trimmed Loin VAC', price_range_low: '100.00', price_range_high: '122.07', weighted_average: '103.19' },
    { report_date: '06/04/2026', Item_Description: 'Belly, 9-13#', price_range_low: '180.00', price_range_high: '190.00', weighted_average: '185.00' },
  ] };
  const out = S.normalizeAms(lmr, { source: 'usda-lmr', reducer: 'wtdAvg', commodity: 'Loin', priceUnit: 'Dollars Per Cwt' });
  assert.equal(out.unit, 'lb');
  assert.equal(out.points.length, 1);                       // only the loin row (belly excluded by the commodity match)
  assert.equal(out.points[0].value.toFixed(4), '1.0319');   // 103.19 $/cwt → $1.0319/lb
});

test('AMS reducer: wtdAvg falls back to the band when wtd_avg_price is absent', () => {
  assert.equal(S.reduceAmsRow({ mostly_low: '2.10', mostly_high: '2.30' }, 'wtdAvg'), 2.2);
  assert.equal(S.reduceAmsRow({ note: 'no price' }, 'wtdAvg'), null);
});

test('normalizeAms carries the reported unit and scoped commodity match', () => {
  const chicken = { results: [
    { item: 'Breast - B/S', wtd_avg_price: 145.72, price_unit: 'Cents Per Lb', report_date: '05/25/2026', region: 'National' },
    { item: 'Backs and Necks', wtd_avg_price: 9.1, price_unit: 'Cents Per Lb', report_date: '05/25/2026' },
  ] };
  const out = S.normalizeAms(chicken, { reducer: 'wtdAvg', commodity: 'Breast - B/S', matchFields: ['item'] });
  assert.equal(out.unit, 'lb');                          // detected from price_unit, not a constant 'usd'
  assert.equal(out.points.length, 1);
  assert.equal(out.points[0].value.toFixed(4), '1.4572'); // only the B/S breast row, in dollars
  // the bare token "National" must NOT match via region now that matching is field-scoped:
  const none = S.normalizeAms(chicken, { reducer: 'wtdAvg', commodity: 'National', matchFields: ['item'] });
  assert.equal(none.points.length, 0);
});

test('quality screen hard-rejects a flipped unit even when the number lands in band', () => {
  // $/dozen value (300¢) inside the chicken band [90,500] but the wrong unit → reject, not silently kept.
  const r = Q.validateObservation({ source: 'usda-ams', basis: 'wholesale', valueCents: 300, unit: 'dozen', date: '2026-05-25' },
    { bounds: { minCents: 90, maxCents: 500 }, expectedUnit: 'lb' });
  assert.equal(r.ok, false);
  assert.deepEqual(r.flags, ['unit_mismatch']);
});

test('normalizeAms honors a mostlyMid reducer on ranged rows', () => {
  const out = S.normalizeAms(
    { results: [
      { report_date: '2026-05-01', mostly_low: '12.50', mostly_high: '13.50' },
      { report_date: '2026-05-08', mostly_low: '13.00', mostly_high: '15.00' },
    ] },
    { source: 'usda-ams', basis: 'wholesale', reducer: 'mostlyMid' });
  assert.deepEqual(out.points.map(p => p.value), [13.0, 14.0]);
});

test('contract guard: an empty/garbage payload yields no points, not a crash', () => {
  assert.deepEqual(S.normalizeFred({}, {}).points, []);
  assert.deepEqual(S.normalizeBls({ Results: { series: [] } }, {}).points, []);
  assert.deepEqual(S.normalizeAms(null, {}).points, []);
  const r = C.assess(S.buildCompositeInput([], {}));
  assert.match(r.label, /Not enough data/);
});

test('normalizeAms commodity filter pulls ONE ingredient out of a multi-commodity terminal report', () => {
  const veg = { results: [
    { report_date: '06/03/2026', commodity: 'Lettuce, Romaine', low_price: '24.00', high_price: '26.00' },
    { report_date: '06/03/2026', commodity: 'Tomatoes', low_price: '18.00', high_price: '22.00' },
    { report_date: '06/03/2026', commodity: 'Peppers, Bell', low_price: '30.00', high_price: '34.00' },
  ] };
  const out = S.normalizeAms(veg, { source: 'usda-ams', basis: 'wholesale', reducer: 'mostlyMid', commodity: 'romaine' });
  assert.equal(out.points.length, 1);
  assert.equal(out.points[0].value, 25);   // (24+26)/2 — only the romaine row survives
  // multiple package rows for the SAME commodity+date collapse to a median:
  const veg2 = { results: [
    { report_date: '06/03/2026', commodity: 'Onions, Yellow, 50 lb', low_price: '20', high_price: '22' },
    { report_date: '06/03/2026', commodity: 'Onions, Yellow, 25 lb', low_price: '24', high_price: '26' },
    { report_date: '06/03/2026', commodity: 'Potatoes, Russet', low_price: '15', high_price: '17' },
  ] };
  const onion = S.normalizeAms(veg2, { reducer: 'mostlyMid', commodity: 'onion' });
  assert.equal(onion.points.length, 1);
  assert.equal(onion.points[0].value, 23);   // median of [21, 25]
});
