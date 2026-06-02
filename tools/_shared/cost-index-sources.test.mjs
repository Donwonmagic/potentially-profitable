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

test('contract guard: an empty/garbage payload yields no points, not a crash', () => {
  assert.deepEqual(S.normalizeFred({}, {}).points, []);
  assert.deepEqual(S.normalizeBls({ Results: { series: [] } }, {}).points, []);
  assert.deepEqual(S.normalizeAms(null, {}).points, []);
  const r = C.assess(S.buildCompositeInput([], {}));
  assert.match(r.label, /Not enough data/);
});
