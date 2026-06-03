/**
 * cost-index-sources.test.ts — VERBATIM port of the storefront contract test.
 * raw API payloads → normalize → buildCompositeInput → composite.assess.
 * If a source changes its JSON shape, these fixtures fail LOUDLY here.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as S from '../src/cost-index-sources.js';
import * as C from '../src/composite-price.js';

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
  assert.equal(r.level!.basis, 'wholesale');
  assert.equal(r.level!.medianCents, 1400);
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
