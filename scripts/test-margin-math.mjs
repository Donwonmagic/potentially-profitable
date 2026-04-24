#!/usr/bin/env node
// Margin Math math + bucket regression tests.
// Run via: `node scripts/test-margin-math.mjs`
//
// Locks in the contract in tools/margin-math/margin-math.js. Two
// categories of assertion:
//
// 1. Math: Delivery Break-Even produces the numbers the DoorDash
//    blog post cites. Boundary cases for recommendation thresholds.
//
// 2. Privacy: every bucket function returns a value drawn from its
//    fixed allow-list, for every input in a scanning range. If any
//    raw input leaks into a bucket return, this suite fails loudly.
//
// Exits non-zero on failure.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const {
  calcDeliveryBreakeven,
  formatMoney,
  formatPct,
  bucketTicket,
  bucketFoodCost,
  bucketCommission,
  clampPct,
  num,
  TICKET_BUCKETS,
  FOODCOST_BUCKETS,
  COMMISSION_TIERS,
  RECOMMENDATIONS,
  DIRECT_PROCESSING_PCT
} = require('../tools/margin-math/margin-math.js');

let failures = 0;
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              (ok ? '' : '  (expected ' + JSON.stringify(expected) +
                        ', got ' + JSON.stringify(actual) + ')'));
  if (!ok) failures++;
}
function assert(label, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label);
  if (!cond) failures++;
}
function assertClose(label, actual, expected, epsilon) {
  const eps = epsilon == null ? 0.01 : epsilon;
  const ok = Math.abs(actual - expected) <= eps;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              (ok ? '' : '  (expected ~' + expected + ' ±' + eps +
                        ', got ' + actual + ')'));
  if (!ok) failures++;
}

// ------------------------------------------------------------
// Helpers: num + clampPct
// ------------------------------------------------------------
assertEq('num("25")',        num('25'),    25);
assertEq('num("-5") -> 0',   num('-5'),    0);
assertEq('num("abc") -> 0',  num('abc'),   0);
assertEq('num(null) -> 0',   num(null),    0);
assertEq('num(Infinity)->0', num(Infinity),0);

assertEq('clampPct(0.25)',     clampPct(0.25), 0.25);
assertEq('clampPct(25) -> .25',clampPct(25),   0.25);
assertEq('clampPct(200)->1',   clampPct(200),  1);
assertEq('clampPct(-5)->0',    clampPct(-5),   0);
assertEq('clampPct(".5")->.5', clampPct('.5'), 0.5);

// ------------------------------------------------------------
// formatMoney / formatPct
// ------------------------------------------------------------
assertEq('money $12.34',      formatMoney(12.34),   '$12.34');
assertEq('money rounds cents',formatMoney(12.345),  '$12.35');
assertEq('money strips .00',  formatMoney(12),      '$12');
assertEq('money >= $1000',    formatMoney(1234.56), '$1,235');
assertEq('money 0',           formatMoney(0),       '$0');

assertEq('pct 0.25',  formatPct(0.25), '25%');
assertEq('pct 25',    formatPct(25),   '25%');
assertEq('pct 0.333', formatPct(0.333),'33%');

// ------------------------------------------------------------
// Delivery Break-Even: match the DoorDash blog post's math exactly
//   ticket $25 × 30% food × 25% commission × 100 orders/mo
// ------------------------------------------------------------
{
  const r = calcDeliveryBreakeven({
    ticket: 25, foodCostPct: 0.30, commissionPct: 0.25, ordersPerMonth: 100
  });
  assertClose('DD post: platform per-order = $11.25', r.perOrderOnPlatform, 11.25);
  assertClose('DD post: direct per-order = $16.75',   r.perOrderDirect,     16.75);
  assertClose('DD post: per-order delta = $5.50',      r.perOrderDelta,      5.50);
  assertClose('DD post: monthly delta = $550',         r.monthlyDelta,       550);
  assertEq('DD post: recommendation = consider-leaving', r.recommendation, 'consider-leaving');
  assertEq('inputs.directProcessingPct is 3% constant',  r.inputs.directProcessingPct, DIRECT_PROCESSING_PCT);
}

// Zero volume: delta per-order still correct, monthly goes to zero.
{
  const r = calcDeliveryBreakeven({
    ticket: 25, foodCostPct: 0.30, commissionPct: 0.25, ordersPerMonth: 0
  });
  assertClose('zero orders: monthly delta = $0', r.monthlyDelta, 0);
  assertClose('zero orders: per-order delta unchanged', r.perOrderDelta, 5.50);
}

// Zero ticket (degenerate): all outputs zero, no NaN.
{
  const r = calcDeliveryBreakeven({ ticket: 0, foodCostPct: 0.30, commissionPct: 0.25 });
  assertClose('zero ticket: platform per-order = $0', r.perOrderOnPlatform, 0);
  assertClose('zero ticket: direct per-order = $0',   r.perOrderDirect, 0);
}

// Food cost passed as integer percent (30) vs fraction (0.30) — same.
{
  const a = calcDeliveryBreakeven({ ticket: 25, foodCostPct: 30, commissionPct: 25 });
  const b = calcDeliveryBreakeven({ ticket: 25, foodCostPct: 0.30, commissionPct: 0.25 });
  assertClose('pct input normalizes: platform nets match', a.perOrderOnPlatform, b.perOrderOnPlatform);
  assertClose('pct input normalizes: direct nets match',   a.perOrderDirect, b.perOrderDirect);
}

// ------------------------------------------------------------
// Recommendation threshold boundaries
// ------------------------------------------------------------
{
  const at14 = calcDeliveryBreakeven({ ticket: 25, foodCostPct: 0.30, commissionPct: 0.14 });
  const at15 = calcDeliveryBreakeven({ ticket: 25, foodCostPct: 0.30, commissionPct: 0.15 });
  const at24 = calcDeliveryBreakeven({ ticket: 25, foodCostPct: 0.30, commissionPct: 0.24 });
  const at25 = calcDeliveryBreakeven({ ticket: 25, foodCostPct: 0.30, commissionPct: 0.25 });
  assertEq('commission 14% -> keep',             at14.recommendation, 'keep');
  assertEq('commission 15% -> optimize',         at15.recommendation, 'optimize');
  assertEq('commission 24% -> optimize',         at24.recommendation, 'optimize');
  assertEq('commission 25% -> consider-leaving', at25.recommendation, 'consider-leaving');
}

// ------------------------------------------------------------
// Privacy-critical: every bucket output lives in its enum
// ------------------------------------------------------------

// Scan a range and confirm every result is in the allow-list.
function scan(label, fn, lo, hi, step, allowList) {
  const seen = new Set();
  for (let v = lo; v <= hi; v += step) {
    const r = fn(v);
    seen.add(r);
    if (!allowList.includes(r)) {
      console.log('FAIL  ' + label + ' leaked non-enum value for input ' + v + ': ' + JSON.stringify(r));
      failures++;
      return;
    }
  }
  console.log('PASS  ' + label + ' (' + seen.size + ' unique values, all in allow-list)');
}

scan('bucketTicket scan $0–$100',       bucketTicket,   0,    100,  1,    TICKET_BUCKETS);
scan('bucketFoodCost scan 0–100%',      bucketFoodCost, 0,    100,  1,    FOODCOST_BUCKETS);
scan('bucketCommission scan 0–0.5',     bucketCommission, 0,    0.5,  0.01, COMMISSION_TIERS);

// Bucket boundaries
assertEq('bucket: ticket $14.99',  bucketTicket(14.99),     'lt15');
assertEq('bucket: ticket $15',     bucketTicket(15),        '15-24');
assertEq('bucket: ticket $24.99',  bucketTicket(24.99),     '15-24');
assertEq('bucket: ticket $25',     bucketTicket(25),        '25-39');
assertEq('bucket: ticket $39.99',  bucketTicket(39.99),     '25-39');
assertEq('bucket: ticket $40',     bucketTicket(40),        'gte40');

assertEq('bucket: food 27%',   bucketFoodCost(0.27),    'lt28');
assertEq('bucket: food 28%',   bucketFoodCost(0.28),    '28-32');
assertEq('bucket: food 33%',   bucketFoodCost(0.33),    '33-37');
assertEq('bucket: food 38%',   bucketFoodCost(0.38),    'gte38');

assertEq('bucket: commission 17%', bucketCommission(0.17), 'basic');
assertEq('bucket: commission 18%', bucketCommission(0.18), 'plus');
assertEq('bucket: commission 27%', bucketCommission(0.27), 'premier');

// ------------------------------------------------------------
// Privacy-critical: no raw string ever leaked
// ------------------------------------------------------------
{
  // A string input that happens to look like a number should never
  // appear anywhere in the bucket output.
  const poison = '31.42159_SECRET';
  const buckets = [
    bucketTicket(poison),
    bucketFoodCost(poison),
    bucketCommission(poison)
  ];
  const leakedAny = buckets.some(function(b) { return ('' + b).indexOf('SECRET') !== -1; });
  assert('no raw "SECRET" string leaks through any bucket fn', !leakedAny);
}

// ------------------------------------------------------------
// Summary
// ------------------------------------------------------------
if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll tests passed.');
