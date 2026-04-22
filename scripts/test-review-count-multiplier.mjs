#!/usr/bin/env node
// Sprint CC3b: userRatingCount → coversPerDay multiplier regression test.
// Run via: `node scripts/test-review-count-multiplier.mjs`
//
// Google Places userRatingCount is a published count of Google
// reviews. More reviews tracks (noisily) with more traffic, so the
// audit uses it as a zero-input proxy for daily covers.
//
// Scaling rule:
//   mult = 1.0 + SLOPE * log10(count / ANCHOR)
//   clamped to [FLOOR, CEIL]
//   missing/invalid count -> 1.0 (identity, never degrades the chip)
//
// Exits non-zero on failure.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const S = require('../tools/audits/restaurant/subtypes.js');
const {
  reviewCountCoversPerDayMultiplier,
  REVIEW_COUNT_ANCHOR,
  REVIEW_SCALER_SLOPE,
  REVIEW_SCALER_FLOOR,
  REVIEW_SCALER_CEIL
} = S;

let failures = 0;
function approx(a, b, eps) { return Math.abs(a - b) < (eps || 0.01); }
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}
function assertApprox(label, actual, expected) {
  const ok = approx(actual, expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ~' + expected + ', got ' + actual.toFixed(3) + ')');
  if (!ok) failures++;
}

// --- Identity at the anchor ----------------------------------------
assertEq('count = anchor -> 1.0',
  reviewCountCoversPerDayMultiplier(REVIEW_COUNT_ANCHOR), 1.0);

// --- Log-scaled values at known checkpoints ------------------------
//   10 reviews    -> 1 + 0.30 * log10(10/100)  = 1 + 0.30 * -1 = 0.70
//   1000 reviews  -> 1 + 0.30 * log10(1000/100) = 1 + 0.30 * 1  = 1.30
//   10000 reviews -> 1 + 0.30 * log10(10000/100) = 1 + 0.30 * 2 = 1.60
//   100000 reviews-> 1 + 0.30 * 3 = 1.90
assertApprox('10 reviews',     reviewCountCoversPerDayMultiplier(10),     0.70);
assertApprox('1000 reviews',   reviewCountCoversPerDayMultiplier(1000),   1.30);
assertApprox('10000 reviews',  reviewCountCoversPerDayMultiplier(10000),  1.60);
assertApprox('100000 reviews', reviewCountCoversPerDayMultiplier(100000), 1.90);

// --- Clamp at FLOOR for very low counts -----------------------------
// A brand-new restaurant with 1 review must not produce a chip of
// zero revenue.
{
  const actual = reviewCountCoversPerDayMultiplier(1);
  const ok = actual >= REVIEW_SCALER_FLOOR && actual < 1.0;
  console.log((ok ? 'PASS' : 'FAIL') + '  1 review clamped at FLOOR (got ' + actual.toFixed(3) + ')');
  if (!ok) failures++;
}

// --- Clamp at CEIL for very high counts -----------------------------
// A viral 50k-review neighborhood spot doesn't actually do 3× the
// covers of a normal busy one — additional reviews are fame, not
// traffic.
{
  const actual = reviewCountCoversPerDayMultiplier(50000);
  const ok = actual <= REVIEW_SCALER_CEIL && actual > 1.0;
  console.log((ok ? 'PASS' : 'FAIL') + '  50k reviews clamped at CEIL (got ' + actual.toFixed(3) + ')');
  if (!ok) failures++;
}

// --- Missing / malformed inputs return identity --------------------
assertEq('null -> 1.0',        reviewCountCoversPerDayMultiplier(null),      1.0);
assertEq('undefined -> 1.0',   reviewCountCoversPerDayMultiplier(undefined), 1.0);
assertEq('0 -> 1.0',           reviewCountCoversPerDayMultiplier(0),         1.0);
assertEq('negative -> 1.0',    reviewCountCoversPerDayMultiplier(-5),        1.0);
assertEq('NaN -> 1.0',         reviewCountCoversPerDayMultiplier(Number.NaN), 1.0);
assertEq('Infinity -> 1.0',    reviewCountCoversPerDayMultiplier(Infinity),  1.0);
assertEq('string -> 1.0',      reviewCountCoversPerDayMultiplier('128'),     1.0);
assertEq('object -> 1.0',      reviewCountCoversPerDayMultiplier({}),        1.0);

// --- Monotonicity -- more reviews never decreases the multiplier ---
// Walking from 1 to 100_000 in sensible steps, each step must
// produce a multiplier >= the previous one. Sanity guard against a
// future "fix" that accidentally inverts the sign.
{
  const steps = [1, 5, 10, 25, 50, 75, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 100000];
  let last = -Infinity;
  let monotonic = true;
  for (const n of steps) {
    const m = reviewCountCoversPerDayMultiplier(n);
    if (m < last) { monotonic = false; break; }
    last = m;
  }
  assertEq('monotonic non-decreasing across 1..100k', monotonic, true);
}

// --- Range sanity: final multiplier always within [FLOOR, CEIL] ---
{
  const samples = [1, 3, 10, 100, 500, 1000, 5000, 10000, 100000, 1_000_000];
  const outOfRange = samples.filter((n) => {
    const m = reviewCountCoversPerDayMultiplier(n);
    return m < REVIEW_SCALER_FLOOR || m > REVIEW_SCALER_CEIL;
  });
  assertEq('all samples within [FLOOR, CEIL]', outOfRange, []);
}

// --- Integration-style: a busy cafe's expected covers ------------
// cafe default = 300 covers/day. A cafe with 2,000 Google reviews
// (busy urban spot, not landmark) should scale to ~400 covers/day,
// not fall below 300 or exceed ~700.
{
  const cafe = S.subtypeOwnerDefaults('cafe');
  const busy = Math.round(cafe.coversPerDay * reviewCountCoversPerDayMultiplier(2000));
  const ok = busy > 300 && busy < 700;
  console.log((ok ? 'PASS' : 'FAIL') +
    '  busy cafe (2k reviews) projects ' + busy + ' covers/day (300 < X < 700)');
  if (!ok) failures++;
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll review-count-multiplier tests passed.');
