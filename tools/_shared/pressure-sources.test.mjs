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

test('nassSeries orders weekly series by begin_code, not the lexical label', () => {
  // The trap: lexically "WEEK #9" sorts AFTER "WEEK #10/#20" (the "9" beats "1").
  // begin_code (numeric week#) is the real chronological key. Reverse-chronological
  // input (as NASS often returns) must come back oldest→newest.
  const rows = [
    { Value: '210', year: '2026', begin_code: '20', reference_period_desc: 'WEEK #20' },
    { Value: '195', year: '2026', begin_code: '10', reference_period_desc: 'WEEK #10' },
    { Value: '180', year: '2026', begin_code: '9',  reference_period_desc: 'WEEK #9' }
  ];
  assert.deepEqual(S.nassSeries(rows), [180, 195, 210]);
  assert.equal(S.windowChange(S.nassSeries(rows)) > 0, true, 'rising weekly placements → positive');
});

test('nassSeries orders monthly series chronologically (month names do not sort)', () => {
  // "MAY" < "MARCH" alphabetically — wrong. begin_code (month#) fixes it. Also
  // spans a year boundary to prove year wins over month.
  const rows = [
    { Value: '1,820', year: '2026', begin_code: '01', reference_period_desc: 'JANUARY' },
    { Value: '1,950', year: '2025', begin_code: '12', reference_period_desc: 'DECEMBER' },
    { Value: '1,900', year: '2026', begin_code: '03', reference_period_desc: 'MARCH' }
  ];
  // DEC 2025 (1950) → JAN 2026 (1820) → MAR 2026 (1900)
  assert.deepEqual(S.nassSeries(rows), [1950, 1820, 1900]);
});

test('nassSeries drops withheld cells ((D)/(NA)) without scrambling order', () => {
  const rows = [
    { Value: '(D)',  year: '2026', begin_code: '04', reference_period_desc: 'WEEK #4' },
    { Value: '120',  year: '2026', begin_code: '05', reference_period_desc: 'WEEK #5' },
    { Value: '(NA)', year: '2026', begin_code: '06', reference_period_desc: 'WEEK #6' },
    { Value: '140',  year: '2026', begin_code: '07', reference_period_desc: 'WEEK #7' }
  ];
  assert.deepEqual(S.nassSeries(rows), [120, 140]);
});

test('usdmSeverity averages multi-area rows per date (CA+AZ → one regional point)', () => {
  // Two states per week (aoi=06,04). Per date we want the mean severe share, not
  // an interleaved CA,AZ,CA,AZ series that windowChange would read end-to-end.
  const rows = [
    { ValidStart: '2026-06-01', D2: '10', D3: '5', D4: '0' }, // CA wk1 = 15
    { ValidStart: '2026-06-01', D2: '20', D3: '5', D4: '0' }, // AZ wk1 = 25  → mean 20
    { ValidStart: '2026-06-08', D2: '14', D3: '8', D4: '2' }, // CA wk2 = 24
    { ValidStart: '2026-06-08', D2: '30', D3: '6', D4: '0' }  // AZ wk2 = 36  → mean 30
  ];
  assert.deepEqual(S.usdmSeverity(rows), [20, 30]);
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
