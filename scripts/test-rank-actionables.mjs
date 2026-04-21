#!/usr/bin/env node
// Phase 2 U9: rank-by-$-impact regression test.
// Run via: `node scripts/test-rank-actionables.mjs`
//
// Locks in the ordering contract used by both renderTopFixes and
// renderActionPlan in tools/audits/restaurant/index.html:
//   1. items with a dollarImpact outrank items without
//   2. inside each group, dollarImpact DESC
//   3. then subtype weight DESC
//   4. then statusRank DESC (fail=1 outranks unverified=0)
//   5. ties resolve by original index ASC (stable-ish)
//
// Exits non-zero on failure.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const { rankActionablesByImpact } =
  require('../tools/audits/restaurant/restaurant-checks.js');

let failures = 0;
function assert(label, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label);
  if (!cond) failures++;
}
function assertEq(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}

// Build a synthetic actionable item. `impactById` is a lookup the
// test controls so we can prove items-with-impact sort ahead of
// items-without.
function item(id, weight, statusRank) {
  return {
    entry: { def: { type: id }, result: { mark: { cls: statusRank === 1 ? 'fail' : 'unverified' } } },
    weight: weight,
    statusRank: statusRank,
    _id: id
  };
}
function impactFn(table) {
  return function(def){
    if (!def) return null;
    var v = table[def.type];
    return (typeof v === 'number') ? v : null;
  };
}

// --- Test 1: items WITH impact outrank items WITHOUT ---------------
{
  const items = [
    item('no-impact-heavy',   2.0, 1),   // weight 2, no $
    item('has-impact-light',  0.4, 0),   // weight 0.4, $3k
    item('no-impact-light',   0.4, 0),   // weight 0.4, no $
    item('has-impact-heavy',  2.0, 1)    // weight 2, $10k
  ];
  const fn = impactFn({
    'has-impact-heavy': 10000,
    'has-impact-light': 3000
  });
  rankActionablesByImpact(items, fn);
  const ids = items.map(function(x){ return x._id; });
  assert('impact items come first (positions 0-1)',
    ids[0].indexOf('has-impact') === 0 && ids[1].indexOf('has-impact') === 0);
  assert('non-impact items come last (positions 2-3)',
    ids[2].indexOf('no-impact') === 0 && ids[3].indexOf('no-impact') === 0);
  assertEq('highest $ is first',  ids[0], 'has-impact-heavy');
  assertEq('next $ is second',    ids[1], 'has-impact-light');
  assertEq('heavier weight wins within no-impact group', ids[2], 'no-impact-heavy');
}

// --- Test 2: within the impact group, $ strictly dominates weight --
{
  const items = [
    item('big-weight-small-$', 2.0, 1),
    item('small-weight-big-$', 0.4, 1)
  ];
  const fn = impactFn({
    'small-weight-big-$': 20000,
    'big-weight-small-$': 5000
  });
  rankActionablesByImpact(items, fn);
  assertEq('small weight but big $ wins', items[0]._id, 'small-weight-big-$');
}

// --- Test 3: same $, weight breaks tie ------------------------------
{
  const items = [
    item('lighter', 0.5, 1),
    item('heavier', 2.0, 1)
  ];
  const fn = impactFn({ lighter: 5000, heavier: 5000 });
  rankActionablesByImpact(items, fn);
  assertEq('same $, heavier weight ranks first', items[0]._id, 'heavier');
}

// --- Test 4: same $ and weight, statusRank breaks tie --------------
{
  const items = [
    item('unverified-same', 1.0, 0),
    item('fail-same',       1.0, 1)
  ];
  const fn = impactFn({ 'unverified-same': 4000, 'fail-same': 4000 });
  rankActionablesByImpact(items, fn);
  assertEq('same $+weight, confirmed fail outranks unverified',
    items[0]._id, 'fail-same');
}

// --- Test 5: everything identical -> input order preserved ---------
{
  const items = [
    item('alpha', 1.0, 1),
    item('beta',  1.0, 1),
    item('gamma', 1.0, 1)
  ];
  const fn = impactFn({ alpha: 5000, beta: 5000, gamma: 5000 });
  rankActionablesByImpact(items, fn);
  assertEq('fully-tied rank 0 stays alpha', items[0]._id, 'alpha');
  assertEq('fully-tied rank 1 stays beta',  items[1]._id, 'beta');
  assertEq('fully-tied rank 2 stays gamma', items[2]._id, 'gamma');
}

// --- Test 6: no impact function -> falls back to weight/status ----
{
  const items = [
    item('heavy-fail',   2.0, 1),
    item('light-fail',   0.5, 1),
    item('heavy-unver',  2.0, 0)
  ];
  rankActionablesByImpact(items); // no fn passed
  assertEq('no-fn: heavier weight first',          items[0]._id, 'heavy-fail');
  assertEq('no-fn: same weight, fail ranks above unverified',
    items[1]._id, 'heavy-unver');
  assertEq('no-fn: lighter weight last',           items[2]._id, 'light-fail');
}

// --- Test 7: defensive on bad input --------------------------------
{
  const out = rankActionablesByImpact(null, null);
  assertEq('null input is returned as-is', out, null);
  const str = rankActionablesByImpact('nope', null);
  assertEq('non-array input is returned as-is', str, 'nope');
}

// --- Test 8: dollarImpact set in-place -----------------------------
{
  const items = [
    item('with-dollar',  1.0, 1),
    item('sans-dollar',  1.0, 1)
  ];
  const fn = impactFn({ 'with-dollar': 7500 });
  rankActionablesByImpact(items, fn);
  const withD = items.find(function(x){ return x._id === 'with-dollar'; });
  const sansD = items.find(function(x){ return x._id === 'sans-dollar'; });
  assertEq('annotation: with-dollar has numeric impact', withD.dollarImpact, 7500);
  assertEq('annotation: sans-dollar has null impact',    sansD.dollarImpact, null);
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll rank-actionables tests passed.');
