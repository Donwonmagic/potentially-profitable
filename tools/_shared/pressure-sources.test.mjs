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

// ---- ADR-014: cold-storage deseasonalization (same-month 5-yr median anomaly) ----
// Rows: { Value, year, begin_code(month#) }. Fixtures pinned in the ADR.
function csRows(monthVals) {
  // monthVals: [{ y, m, v }] flat list
  return monthVals.map((r) => ({ Value: String(r.v), year: String(r.y), begin_code: r.m }));
}

test('coldStorageAnomaly (a): butter spring flush reads ≈neutral, not the raw +30%', () => {
  const rows = [];
  const spring = { 2021: [250, 300, 330], 2022: [255, 305, 335], 2023: [260, 310, 340], 2024: [265, 315, 345], 2025: [270, 320, 350], 2026: [262, 312, 341] };
  for (const y of Object.keys(spring)) [3, 4, 5].forEach((m, i) => rows.push({ y: +y, m, v: spring[y][i] }));
  const dev = S.coldStorageAnomaly(csRows(rows));
  assert.ok(dev !== null && Math.abs(dev) < 0.02, `expected ≈neutral, got ${dev}`);
  // the bug it fixes: the raw within-spring build (Mar→May 2026) is a large false signal
  // (+30%) that the deseasonalized read correctly neutralizes.
  const rawSpring = S.windowChange([262, 312, 341]);
  assert.ok(rawSpring > 0.25, `raw within-spring windowChange should show the seasonal spike, got ${rawSpring}`);
});

test('coldStorageAnomaly (b): a genuine same-month shortfall reads as a real tightening', () => {
  const rows = [];
  const cheese = { 2021: [1360, 1380, 1400], 2022: [1380, 1400, 1420], 2023: [1400, 1420, 1440], 2024: [1420, 1440, 1460], 2025: [1440, 1460, 1480], 2026: [1190, 1210, 1220] };
  for (const y of Object.keys(cheese)) [3, 4, 5].forEach((m, i) => rows.push({ y: +y, m, v: cheese[y][i] }));
  const dev = S.coldStorageAnomaly(csRows(rows));
  assert.ok(dev !== null && dev < -0.10, `expected a real negative anomaly, got ${dev}`);
});

test('coldStorageAnomaly (c): <3 prior same-month years → null (emit nothing, never invent)', () => {
  const rows = [];
  const two = { 2025: [270, 320, 350], 2026: [262, 312, 341] };
  for (const y of Object.keys(two)) [3, 4, 5].forEach((m, i) => rows.push({ y: +y, m, v: two[y][i] }));
  assert.equal(S.coldStorageAnomaly(csRows(rows)), null);
});

test('coldStorageAnomaly (d): one anomalous prior year is absorbed by the median', () => {
  // May only, 2021-2026; 2025 is an anomalous low (150). Recent window = just May 2026.
  const rows = [{ y: 2021, m: 5, v: 335 }, { y: 2022, m: 5, v: 340 }, { y: 2023, m: 5, v: 345 }, { y: 2024, m: 5, v: 340 }, { y: 2025, m: 5, v: 150 }, { y: 2026, m: 5, v: 345 }];
  const dev = S.coldStorageAnomaly(csRows(rows));
  assert.ok(dev !== null && Math.abs(dev) < 0.03, `median should absorb the anomaly → ≈neutral, got ${dev}`);
});

test('nassMonthly keeps period keys, sorts (y,m), dedupes', () => {
  const rows = [{ Value: '5', year: '2026', begin_code: 5 }, { Value: '3', year: '2026', begin_code: 3 }, { Value: '99', year: '2026', begin_code: 3 }];
  const m = S.nassMonthly(rows);
  assert.equal(m.length, 2);
  assert.deepEqual(m.map((p) => p.m), [3, 5]);
  assert.equal(m[0].v, 99); // dedup (2026,3) keeps last
});
