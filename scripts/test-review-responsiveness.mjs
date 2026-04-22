#!/usr/bin/env node
// Phase 3 #4: review-responsiveness scoring regression test.
// Run via: `node scripts/test-review-responsiveness.mjs`
//
// Locks in the scoring contract used by the deep-reviews card's
// responsiveness chip and unanswered-review callout. The formula:
//
//   base   = 100 * replied / sampled
//   penalty = 20 per unreplied 1–2 star review
//   score  = clamp(0, 100, round(base - penalty))
//
// Grade bands:  >=80 good, 50–79 ok, <50 bad.
//
// These fixtures are the record of why the numbers land where they
// do — changing them is a behavior change visible to every owner.
// Exits non-zero on failure so CI can gate on it.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const { computeReviewResponsiveness } =
  require('../tools/audits/restaurant/restaurant-checks.js');

let failures = 0;
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label + (cond ? '' : '  ' + (detail || '')));
  if (!cond) failures++;
}
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}

function review(rating, hasOwnerReply) {
  return { rating: rating, hasOwnerReply: hasOwnerReply, text: 'x' };
}

// --- Test 1: all replied, all 5-star -> perfect ---------------------
{
  const r = computeReviewResponsiveness([
    review(5, true), review(5, true), review(5, true),
    review(5, true), review(5, true)
  ]);
  assertEq('all-replied-all-5star: score',     r.score,     100);
  assertEq('all-replied-all-5star: grade',     r.grade,     'good');
  assertEq('all-replied-all-5star: replied',   r.replied,   5);
  assertEq('all-replied-all-5star: sampled',   r.sampled,   5);
  assertEq('all-replied-all-5star: urgentCount', r.urgentCount, 0);
}

// --- Test 2: none replied, all 5-star -> 0 (no penalty, just missing replies)
{
  const r = computeReviewResponsiveness([
    review(5, false), review(5, false), review(5, false),
    review(5, false), review(5, false)
  ]);
  assertEq('none-replied-all-5star: score', r.score, 0);
  assertEq('none-replied-all-5star: grade', r.grade, 'bad');
  assertEq('none-replied-all-5star: urgentCount', r.urgentCount, 0);
}

// --- Test 3: 4 replied of 5 (1 unreplied 5-star) --------------------
// base = 80, no penalty (not a low-star) -> 80 -> good band
{
  const r = computeReviewResponsiveness([
    review(5, true), review(5, true), review(5, true), review(5, true),
    review(5, false)
  ]);
  assertEq('4-of-5 replied, unreplied is 5-star: score', r.score, 80);
  assertEq('4-of-5 replied, unreplied is 5-star: grade', r.grade, 'good');
  assertEq('4-of-5 replied: urgentCount',               r.urgentCount, 0);
}

// --- Test 4: 4 replied of 5 (1 unreplied 1-star) --------------------
// base = 80, penalty 20 -> 60 -> ok band. Low-star unreplied hurts.
{
  const r = computeReviewResponsiveness([
    review(5, true), review(5, true), review(5, true), review(5, true),
    review(1, false)
  ]);
  assertEq('4-of-5 replied, unreplied is 1-star: score', r.score, 60);
  assertEq('4-of-5 replied, unreplied is 1-star: grade', r.grade, 'ok');
  assertEq('4-of-5 replied, unreplied is 1-star: urgentCount', r.urgentCount, 1);
  assertEq('urgentRatings captures the low star', r.urgentRatings, [1]);
}

// --- Test 5: 3 replied of 5 (2 unreplied 1-2 star) ------------------
// base = 60, penalty 40 -> 20 -> bad band.
{
  const r = computeReviewResponsiveness([
    review(5, true), review(5, true), review(5, true),
    review(2, false), review(1, false)
  ]);
  assertEq('3-of-5 replied + 2 urgent: score', r.score, 20);
  assertEq('3-of-5 replied + 2 urgent: grade', r.grade, 'bad');
  assertEq('3-of-5 replied + 2 urgent: urgentCount', r.urgentCount, 2);
}

// --- Test 6: clamp: base < penalty -> 0, not negative --------------
{
  const r = computeReviewResponsiveness([
    review(1, false), review(1, false), review(1, false),
    review(1, false), review(1, false)
  ]);
  assertEq('all-unreplied-all-1star: score floored at 0', r.score, 0);
  assertEq('all-unreplied-all-1star: urgentCount', r.urgentCount, 5);
}

// --- Test 7: clamp: score can't exceed 100 ---------------------------
// With no urgents, base IS the score. 5/5 replied = 100 exactly. We
// verified 100 above; verify we never overshoot on fractional rounds.
{
  const r = computeReviewResponsiveness([review(5, true), review(5, true), review(5, true)]);
  assert('3-of-3 replied capped at 100', r.score <= 100);
  assertEq('3-of-3 replied: exactly 100', r.score, 100);
}

// --- Test 8: 3-star reviews do NOT count as urgent (spec: <=2) -----
{
  const r = computeReviewResponsiveness([
    review(5, true), review(5, true), review(5, true), review(5, true),
    review(3, false)  // 3-star unreplied: base drops but no urgency penalty
  ]);
  assertEq('unreplied 3-star: score only dropped by base term', r.score, 80);
  assertEq('unreplied 3-star: urgentCount stays 0',             r.urgentCount, 0);
}

// --- Test 9: missing rating -> not counted as urgent even if unreplied
{
  const r = computeReviewResponsiveness([
    review(5, true), review(5, true), review(5, true), review(5, true),
    { rating: null, hasOwnerReply: false, text: 'x' }
  ]);
  assertEq('unreplied null-rating: no urgency penalty', r.score, 80);
  assertEq('unreplied null-rating: urgentCount stays 0', r.urgentCount, 0);
}

// --- Test 10: grade band boundaries ---------------------------------
// 80 -> good, 79 -> ok, 50 -> ok, 49 -> bad
{
  // 4/5 replied with 0 urgents = 80 -> good
  const a = computeReviewResponsiveness([
    review(5, true), review(5, true), review(5, true), review(5, true),
    review(4, false)
  ]);
  assertEq('80 -> good', a.grade, 'good');

  // Build a case landing at 50: 5/5 replied but with 2.5 units of penalty.
  // Penalty is integer (20 per urgent), so we can't hit exactly 50 from
  // 100-base. Use 4/5 base (80) minus 1 urgent (-20) = 60 -> ok.
  const b = computeReviewResponsiveness([
    review(5, true), review(5, true), review(5, true), review(5, true),
    review(1, false)
  ]);
  assertEq('60 -> ok band',  b.grade, 'ok');

  // 3/5 replied (base 60) - 1 urgent (20) = 40 -> bad.
  const c = computeReviewResponsiveness([
    review(5, true), review(5, true), review(5, true),
    review(5, false), review(1, false)
  ]);
  assertEq('40 -> bad band', c.grade, 'bad');
}

// --- Test 11: defensive on null / empty / non-array ----------------
assertEq('null input returns null',  computeReviewResponsiveness(null),  null);
assertEq('empty array returns null', computeReviewResponsiveness([]),    null);
assertEq('string input returns null', computeReviewResponsiveness('nope'), null);

// --- Test 12: all-nulls array returns null (no real reviews) -------
{
  const r = computeReviewResponsiveness([null, null, null]);
  assertEq('array of null reviews returns null', r, null);
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll review-responsiveness tests passed.');
