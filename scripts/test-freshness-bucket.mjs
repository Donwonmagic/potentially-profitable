#!/usr/bin/env node
// Phase 2 U6: freshness-bucket regression test.
// Run via: `node scripts/test-freshness-bucket.mjs`
//
// Locks in the boundary-case behavior of pickFreshnessKey so a
// future tweak (say, "show seconds for the first 30s") can't
// silently drop the contract used by the Audit Freshness chip.
// Exits non-zero on failure.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const { pickFreshnessKey } =
  require('../tools/audits/restaurant/restaurant-checks.js');

let failures = 0;
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}

// --- Just-now bucket: 0..59s -> 'freshness.justNow' ---------------
assertEq('age=0s -> just-now',  pickFreshnessKey(0).key,  'freshness.justNow');
assertEq('age=30s -> just-now', pickFreshnessKey(30).key, 'freshness.justNow');
assertEq('age=59s -> just-now', pickFreshnessKey(59).key, 'freshness.justNow');

// --- Minutes bucket: 60..3599s -> 'freshness.minutesAgo' ----------
{
  const r = pickFreshnessKey(60);
  assertEq('age=60s -> minutesAgo key',   r.key,        'freshness.minutesAgo');
  assertEq('age=60s -> count=1',          r.vars.count, 1);
}
{
  const r = pickFreshnessKey(120);
  assertEq('age=2min -> count=2',         r.vars.count, 2);
}
{
  const r = pickFreshnessKey(3599);
  assertEq('age=59min59s -> minutesAgo',  r.key,        'freshness.minutesAgo');
  assertEq('age=59min59s -> count=59',    r.vars.count, 59);
}

// --- Hours bucket: 3600..86399s -> 'freshness.hoursAgo' -----------
{
  const r = pickFreshnessKey(3600);
  assertEq('age=1hr -> hoursAgo key',     r.key,        'freshness.hoursAgo');
  assertEq('age=1hr -> count=1',          r.vars.count, 1);
}
{
  const r = pickFreshnessKey(7200);
  assertEq('age=2hr -> count=2',          r.vars.count, 2);
}
{
  const r = pickFreshnessKey(86399);
  assertEq('age=23hr59m59s -> hoursAgo',  r.key,        'freshness.hoursAgo');
  assertEq('age=23hr59m59s -> count=23',  r.vars.count, 23);
}

// --- Days bucket: 86400..(7d-1) -> 'freshness.daysAgo' ------------
{
  const r = pickFreshnessKey(86400);
  assertEq('age=1d -> daysAgo key',       r.key,        'freshness.daysAgo');
  assertEq('age=1d -> count=1',           r.vars.count, 1);
}
{
  const r = pickFreshnessKey(86400 * 6);
  assertEq('age=6d -> count=6',           r.vars.count, 6);
}
{
  const r = pickFreshnessKey(86400 * 7 - 1);
  assertEq('age=just-under-7d -> daysAgo', r.key,       'freshness.daysAgo');
}

// --- Date bucket: >=7d -> 'freshness.onDate' with ISO date --------
{
  const fixedNow = Date.UTC(2026, 3, 21, 12, 0, 0); // 2026-04-21 12:00 UTC
  const r = pickFreshnessKey(86400 * 7, fixedNow);  // exactly 7 days ago
  assertEq('age=7d -> onDate key',        r.key,                    'freshness.onDate');
  assertEq('age=7d -> ISO date set',      typeof r.vars.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.vars.date), true);
  assertEq('age=7d at 2026-04-21 -> 2026-04-14', r.vars.date,       '2026-04-14');
}
{
  const fixedNow = Date.UTC(2026, 3, 21, 12, 0, 0);
  const r = pickFreshnessKey(86400 * 30, fixedNow);
  assertEq('age=30d -> 2026-03-22',       r.vars.date,              '2026-03-22');
}

// --- Defensive: negative / NaN ages collapse to just-now ----------
assertEq('age=-1 -> just-now',   pickFreshnessKey(-1).key,         'freshness.justNow');
assertEq('age=NaN -> just-now',  pickFreshnessKey(Number.NaN).key, 'freshness.justNow');

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll freshness-bucket tests passed.');
