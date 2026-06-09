import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('./pressure-sources.js');

test('parseNum strips $ and commas', () => {
  assert.equal(S.parseNum('$1,234.5'), 1234.5);
  assert.equal(S.parseNum('1,000'), 1000);
  assert.equal(S.parseNum(12.3), 12.3);
  assert.equal(S.parseNum('n/a'), null);
  assert.equal(S.parseNum(null), null);
});

test('windowChange = (last-first)/|first|, null on thin/zero', () => {
  assert.equal(S.windowChange([100, 110]), 0.1);
  assert.equal(S.windowChange([100, 90]), -0.1);
  assert.equal(S.windowChange([5]), null);
  assert.equal(S.windowChange([0, 10]), null);
});

test('nassSeries sorts oldest→newest and parses values', () => {
  const rows = [
    { Value: '200', year: '2026', reference_period_desc: 'WEEK #22' },
    { Value: '1,80', year: '2026', reference_period_desc: 'WEEK #20' }, // malformed → 180
    { Value: '190', year: '2026', reference_period_desc: 'WEEK #21' }
  ];
  const s = S.nassSeries(rows);
  assert.deepEqual(s, [180, 190, 200]);
  assert.equal(S.windowChange(s) > 0, true);
});

test('eiaSeries pulls value series in period order (diesel)', () => {
  const json = { response: { data: [
    { period: '2026-06-08', value: '3.95' },
    { period: '2026-05-11', value: '3.80' },
    { period: '2026-06-01', value: '3.90' }
  ] } };
  const s = S.eiaSeries(json);
  assert.deepEqual(s, [3.80, 3.90, 3.95]);
});

test('usdmSeverity sums D2+D3+D4 over time (worsening drought rises)', () => {
  const rows = [
    { MapDate: '20260601', D2: '10', D3: '5', D4: '0' }, // 15
    { MapDate: '20260608', D2: '14', D3: '8', D4: '2' }  // 24
  ];
  const s = S.usdmSeverity(rows);
  assert.deepEqual(s, [15, 24]);
  assert.equal(S.windowChange(s) > 0, true, 'worsening drought → positive change');
});

test('nwsFreezeActive matches event + area; eventSignal encodes it', () => {
  const gj = { features: [
    { properties: { event: 'Freeze Warning', areaDesc: 'Yuma County, AZ' } },
    { properties: { event: 'Flood Watch', areaDesc: 'Miami-Dade, FL' } }
  ] };
  assert.equal(S.nwsFreezeActive(gj, { areaMatch: 'AZ|Yuma' }), true);
  assert.equal(S.nwsFreezeActive(gj, { areaMatch: 'Oregon' }), false);
  assert.equal(S.eventSignal(true), 1);
  assert.equal(S.eventSignal(false), 0);
});

test('amsSeries pulls a dated numeric field in order', () => {
  const rows = [
    { report_date: '2026-06-05', price: '74.50' },
    { report_date: '2026-05-29', price: '70.10' }
  ];
  assert.deepEqual(S.amsSeries(rows, { field: 'price' }), [70.10, 74.50]);
});
