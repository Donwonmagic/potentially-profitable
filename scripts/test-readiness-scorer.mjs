#!/usr/bin/env node
// Sprint A5: scoring-regression fixtures for the restaurant readiness
// scorer. Run via: `node scripts/test-readiness-scorer.mjs`
//
// These tests lock in the A1 half-weight-unverified behavior so a
// future "just exclude them again" change can't slip through
// unnoticed. Exits non-zero on failure so CI can gate on it.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const {
  createRestaurantReadinessState,
  accumulateRestaurantReadiness,
  finalizeRestaurantReadinessScore
} = require('../tools/audits/restaurant/restaurant-checks.js');

let failures = 0;
function assertEq(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + expected + ', got ' + actual + ')');
  if (!ok) failures++;
}

function score(entries) {
  const state = createRestaurantReadinessState();
  for (const [status, weight] of entries) {
    accumulateRestaurantReadiness(state, { weight: weight }, status);
  }
  return { score: finalizeRestaurantReadinessScore(state), state: state };
}

// Baseline: 3 passes, 1 fail, no unverifieds → 3/(3+1) = 75.
{
  const { score: s } = score([
    ['pass', 1], ['pass', 1], ['pass', 1], ['fail', 1]
  ]);
  assertEq('baseline 3p/1f → 75', s, 75);
}

// A1 regression: 3 passes, 1 fail, 5 unverifieds at weight 1.
// Old behavior excluded unverifieds entirely → 3/4 = 75 (inflated).
// New behavior: half-weight unverifieds → 3 / (3 + 1 + 5*0.5) = 3/6.5
// ≈ 46.15 → rounds to 46.
{
  const { score: s, state } = score([
    ['pass', 1], ['pass', 1], ['pass', 1], ['fail', 1],
    ['unverified', 1], ['unverified', 1], ['unverified', 1],
    ['unverified', 1], ['unverified', 1]
  ]);
  assertEq('A1 regression 3p/1f/5u → 46', s, 46);
  assertEq('unverifiedCount populated', state.unverifiedCount, 5);
  assertEq('unverifiedWeight populated', state.unverifiedWeight, 2.5);
}

// Zero-state: no checks at all → 0, no divide-by-zero.
{
  const { score: s } = score([]);
  assertEq('empty rollup → 0', s, 0);
}

// All unverified: half-weight still divides correctly (0 credit).
{
  const { score: s } = score([
    ['unverified', 1], ['unverified', 1], ['unverified', 1]
  ]);
  assertEq('all-unverified → 0', s, 0);
}

// Weighted pass beats weighted fail: viewport (2.0) pass, tap-targets
// (1.0) fail → 2/(2+1) = 66.67 → 67.
{
  const { score: s } = score([['pass', 2.0], ['fail', 1.0]]);
  assertEq('weighted 2p/1f → 67', s, 67);
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll readiness-scorer tests passed.');
