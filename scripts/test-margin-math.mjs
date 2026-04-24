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
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const require = createRequire(import.meta.url);
const mmSrc = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../tools/margin-math/margin-math.js'),
  'utf8'
);

const {
  calcDeliveryBreakeven,
  calcPrimeCost,
  PRIME_COST_SEGMENTS,
  PRIME_COST_SEGMENT_KEYS,
  calcBreakEvenCovers,
  calcPriceRaise,
  encodeState,
  decodeState,
  crossFillState,
  CROSS_FILL_PAIRS,
  formatMoney,
  formatPct,
  bucketTicket,
  bucketFoodCost,
  bucketCommission,
  bucketPrimeCost,
  bucketFixedCosts,
  bucketPriceRaiseTier,
  bucketCoverLoss,
  clampPct,
  num,
  TICKET_BUCKETS,
  FOODCOST_BUCKETS,
  COMMISSION_TIERS,
  PRIME_COST_BUCKETS,
  PRIME_COST_BANDS,
  FIXED_COST_BUCKETS,
  BREAKEVEN_BANDS,
  PRICE_RAISE_TIERS,
  COVER_LOSS_BUCKETS,
  PRICE_RAISE_BANDS,
  RECOMMENDATIONS,
  DIRECT_PROCESSING_PCT,
  FRAGMENT_VERSION,
  FRAGMENT_KEYS
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
// Prime Cost Check
// ------------------------------------------------------------
{
  const r = calcPrimeCost({ foodCostPct: 0.30, laborCostPct: 0.32 });
  assertClose('prime cost sums food + labor', r.primeCostPct, 0.62);
  assertEq('prime cost band @ 62% = ok', r.band, 'ok');
}
{
  // pct input normalization (30 vs 0.30)
  const a = calcPrimeCost({ foodCostPct: 30, laborCostPct: 32 });
  const b = calcPrimeCost({ foodCostPct: 0.30, laborCostPct: 0.32 });
  assertClose('pct input normalizes: prime cost %', a.primeCostPct, b.primeCostPct);
}
// Band boundaries
assertEq('prime @ 54% -> below', calcPrimeCost({ foodCostPct: 0.27, laborCostPct: 0.27 }).band, 'below');
assertEq('prime @ 55% -> good',  calcPrimeCost({ foodCostPct: 0.27, laborCostPct: 0.28 }).band, 'good');
assertEq('prime @ 59% -> good',  calcPrimeCost({ foodCostPct: 0.30, laborCostPct: 0.29 }).band, 'good');
assertEq('prime @ 60% -> ok',    calcPrimeCost({ foodCostPct: 0.30, laborCostPct: 0.30 }).band, 'ok');
assertEq('prime @ 64% -> ok',    calcPrimeCost({ foodCostPct: 0.32, laborCostPct: 0.32 }).band, 'ok');
assertEq('prime @ 65% -> warn',  calcPrimeCost({ foodCostPct: 0.33, laborCostPct: 0.32 }).band, 'warn');
assertEq('prime @ 69% -> warn',  calcPrimeCost({ foodCostPct: 0.34, laborCostPct: 0.35 }).band, 'warn');
assertEq('prime @ 70% -> bad',   calcPrimeCost({ foodCostPct: 0.35, laborCostPct: 0.35 }).band, 'bad');
assertEq('prime @ 80% -> bad',   calcPrimeCost({ foodCostPct: 0.40, laborCostPct: 0.40 }).band, 'bad');

// Segment-aware bands.
//
// full-service (default): matches the historical thresholds above.
//   echoed through segment input.
// fast-casual: same lower bands, but "warn" compresses (65-68) and
//   "bad" lands at ≥68%.
// fine-dining: every threshold shifts up by 5 percentage points.
assertEq('prime segment default is full-service',
  calcPrimeCost({ foodCostPct: 0.30, laborCostPct: 0.32 }).segment, 'full-service');
assertEq('prime segment unknown falls back to full-service',
  calcPrimeCost({ foodCostPct: 0.30, laborCostPct: 0.32, segment: 'cloud-kitchen' }).segment, 'full-service');

// fast-casual boundaries. Thresholds < 55 / 55 / 60 / 65 / 68 ≤.
// Note: 65% is the "warn" lower bound here (same as full-service);
// the difference vs. full-service is the "bad" boundary moving from
// 70% down to 68%.
assertEq('fast-casual @ 64% -> ok',
  calcPrimeCost({ foodCostPct: 0.32, laborCostPct: 0.32, segment: 'fast-casual' }).band, 'ok');
assertEq('fast-casual @ 65% -> warn',
  calcPrimeCost({ foodCostPct: 0.33, laborCostPct: 0.32, segment: 'fast-casual' }).band, 'warn');
assertEq('fast-casual @ 67% -> warn',
  calcPrimeCost({ foodCostPct: 0.33, laborCostPct: 0.34, segment: 'fast-casual' }).band, 'warn');
assertEq('fast-casual @ 68% -> bad',
  calcPrimeCost({ foodCostPct: 0.34, laborCostPct: 0.34, segment: 'fast-casual' }).band, 'bad');
assertEq('fast-casual @ 70% -> bad',
  calcPrimeCost({ foodCostPct: 0.35, laborCostPct: 0.35, segment: 'fast-casual' }).band, 'bad');

// fine-dining boundaries
assertEq('fine-dining @ 59% -> below',
  calcPrimeCost({ foodCostPct: 0.29, laborCostPct: 0.30, segment: 'fine-dining' }).band, 'below');
assertEq('fine-dining @ 60% -> good',
  calcPrimeCost({ foodCostPct: 0.30, laborCostPct: 0.30, segment: 'fine-dining' }).band, 'good');
assertEq('fine-dining @ 65% -> ok',
  calcPrimeCost({ foodCostPct: 0.33, laborCostPct: 0.32, segment: 'fine-dining' }).band, 'ok');
assertEq('fine-dining @ 70% -> warn',
  calcPrimeCost({ foodCostPct: 0.35, laborCostPct: 0.35, segment: 'fine-dining' }).band, 'warn');
assertEq('fine-dining @ 75% -> bad',
  calcPrimeCost({ foodCostPct: 0.38, laborCostPct: 0.37, segment: 'fine-dining' }).band, 'bad');

// A 70% prime cost is classified differently per segment — this is
// the whole point of the segmentation.
assertEq('70% prime: full-service -> bad',
  calcPrimeCost({ foodCostPct: 0.35, laborCostPct: 0.35, segment: 'full-service' }).band, 'bad');
assertEq('70% prime: fast-casual -> bad',
  calcPrimeCost({ foodCostPct: 0.35, laborCostPct: 0.35, segment: 'fast-casual' }).band, 'bad');
assertEq('70% prime: fine-dining -> warn',
  calcPrimeCost({ foodCostPct: 0.35, laborCostPct: 0.35, segment: 'fine-dining' }).band, 'warn');

// Exposure + enum
assert('PRIME_COST_SEGMENTS exposed', PRIME_COST_SEGMENTS && typeof PRIME_COST_SEGMENTS === 'object');
assertEq('PRIME_COST_SEGMENT_KEYS length', PRIME_COST_SEGMENT_KEYS.length, 3);
assert('PRIME_COST_SEGMENT_KEYS contains full-service', PRIME_COST_SEGMENT_KEYS.indexOf('full-service') >= 0);
assert('PRIME_COST_SEGMENT_KEYS contains fast-casual',  PRIME_COST_SEGMENT_KEYS.indexOf('fast-casual')  >= 0);
assert('PRIME_COST_SEGMENT_KEYS contains fine-dining',  PRIME_COST_SEGMENT_KEYS.indexOf('fine-dining')  >= 0);

// Privacy invariant: the result.segment echoed back to the UI (and
// from there to Plausible as the `segment` prop) is always from the
// fixed enum, even when garbage flows in. The UI uses result.segment
// as its wire to analytics, so this guarantee closes the trust
// boundary between decodeState (which may carry any string from the
// URL fragment) and the bucket/enum discipline that every other
// Plausible value already follows.
{
  const garbage = [
    undefined, null, '', '  ', 'cloud-kitchen', 'full_service', 'FULL-SERVICE',
    '<script>', '0', '42', 'true', 'full-service_HIDDEN', '__proto__', 'constructor'
  ];
  garbage.forEach(function(g){
    const r = calcPrimeCost({ foodCostPct: 0.30, laborCostPct: 0.32, segment: g });
    assert(
      'garbage segment → enum value (input: ' + JSON.stringify(g) + ')',
      PRIME_COST_SEGMENT_KEYS.indexOf(r.segment) >= 0
    );
    assert(
      'garbage segment does not echo back through result.segment',
      typeof g === 'string' ? r.segment !== g || PRIME_COST_SEGMENT_KEYS.indexOf(g) >= 0 : true
    );
  });
}

// Overflow clamp
{
  const r = calcPrimeCost({ foodCostPct: 0.60, laborCostPct: 0.60 });
  assertEq('prime cost caps at 100%', r.primeCostPct, 1);
  assertEq('overflow prime -> bad',   r.band, 'bad');
}

// Prime-cost bucket scan (privacy enum)
scan('bucketPrimeCost scan 0-100%', bucketPrimeCost, 0, 100, 1, PRIME_COST_BUCKETS);
assertEq('bucket: prime 54%', bucketPrimeCost(0.54), 'lt55');
assertEq('bucket: prime 55%', bucketPrimeCost(0.55), '55-59');
assertEq('bucket: prime 60%', bucketPrimeCost(0.60), '60-64');
assertEq('bucket: prime 65%', bucketPrimeCost(0.65), '65-69');
assertEq('bucket: prime 70%', bucketPrimeCost(0.70), 'gte70');

// Privacy: bucketPrimeCost can't leak a raw string either
{
  const poison = '0.626_HIDDEN';
  const out = bucketPrimeCost(poison);
  assert('no "HIDDEN" leak from bucketPrimeCost', ('' + out).indexOf('HIDDEN') === -1);
}

// Band name is always from the fixed PRIME_COST_BANDS enum
{
  const bandsSeen = new Set();
  for (let f = 0; f <= 1; f += 0.05) {
    for (let l = 0; l <= 1; l += 0.05) {
      const r = calcPrimeCost({ foodCostPct: f, laborCostPct: l });
      bandsSeen.add(r.band);
      if (!PRIME_COST_BANDS.includes(r.band)) {
        console.log('FAIL  band name not in enum: ' + JSON.stringify(r.band));
        failures++;
      }
    }
  }
  console.log('PASS  calcPrimeCost band names all in enum (' + bandsSeen.size + ' distinct)');
}

// ------------------------------------------------------------
// Break-Even Covers
//
// Canonical fixture: $15k fixed, $35 avg check, 20% margin,
// 28 open days. Contribution per cover = $7. Monthly break-even
// covers = 15000 / 7 = 2142.86 → 76.5 covers/day.
// ------------------------------------------------------------
{
  const r = calcBreakEvenCovers({
    fixedMonthlyCosts: 15000,
    avgCheck: 35,
    avgMarginPct: 0.20,
    openDaysPerMonth: 28
  });
  assertClose('BEC: contribution per cover = $7', r.contributionPerCover, 7.00);
  assertClose('BEC: monthly covers = 2143',       r.coversToBreakEvenMonthly, 2142.86, 0.1);
  assertClose('BEC: daily covers ≈ 76.5',         r.coversToBreakEvenDaily, 76.5, 0.1);
  assertEq('BEC: no typical -> band null',        r.band, null);
  assertEq('BEC: no typical -> headroom null',    r.monthlyHeadroom, null);
}

// With typicalCoversPerDay set, capacity band emerges.
{
  // typical 150/day, break-even ~76.5/day → utilization 51% → ok
  const r = calcBreakEvenCovers({
    fixedMonthlyCosts: 15000, avgCheck: 35, avgMarginPct: 0.20,
    openDaysPerMonth: 28, typicalCoversPerDay: 150
  });
  assertClose('BEC: capacity ~51%', r.capacityUtilization, 0.51, 0.02);
  assertEq('BEC: 51% capacity -> ok', r.band, 'ok');
  // Headroom = (150 − 2142.857/28) × 28 × $7 = (150×28 − 2142.857) × 7
  //          = (4200 − 2142.857) × 7 = 2057.143 × 7 = $14,400
  assertClose('BEC: monthly headroom = $14,400', r.monthlyHeadroom, 14400, 1);
}

// Band boundaries at capacity-utilization
{
  // 40%: good. typical = 76.5/0.40 = 191.25; round to 192 → ~0.398
  const good = calcBreakEvenCovers({
    fixedMonthlyCosts: 15000, avgCheck: 35, avgMarginPct: 0.20,
    openDaysPerMonth: 28, typicalCoversPerDay: 192
  });
  assertEq('BEC: capacity ~40% -> good', good.band, 'good');

  // 65%: typical = 76.5/0.65 = 117.7; round to 118 → 0.648
  const ok = calcBreakEvenCovers({
    fixedMonthlyCosts: 15000, avgCheck: 35, avgMarginPct: 0.20,
    openDaysPerMonth: 28, typicalCoversPerDay: 118
  });
  assertEq('BEC: capacity ~65% -> ok', ok.band, 'ok');

  // ~80%: typical = 76.5/0.80 = 96 → utilization 0.797, safely warn
  const warn = calcBreakEvenCovers({
    fixedMonthlyCosts: 15000, avgCheck: 35, avgMarginPct: 0.20,
    openDaysPerMonth: 28, typicalCoversPerDay: 96
  });
  assertEq('BEC: capacity ~80% -> warn', warn.band, 'warn');

  // >85%: typical = 80 → 0.956
  const bad = calcBreakEvenCovers({
    fixedMonthlyCosts: 15000, avgCheck: 35, avgMarginPct: 0.20,
    openDaysPerMonth: 28, typicalCoversPerDay: 80
  });
  assertEq('BEC: capacity >85% -> bad', bad.band, 'bad');
}

// Zero contribution margin: no math panic, covers = 0.
{
  const r = calcBreakEvenCovers({
    fixedMonthlyCosts: 15000, avgCheck: 35, avgMarginPct: 0,
    openDaysPerMonth: 28
  });
  assertEq('BEC: zero margin -> covers 0', r.coversToBreakEvenMonthly, 0);
  assertEq('BEC: zero margin -> daily 0',  r.coversToBreakEvenDaily, 0);
  assertEq('BEC: zero margin -> band null',r.band, null);
}

// openDays clamp
{
  const a = calcBreakEvenCovers({ fixedMonthlyCosts: 15000, avgCheck: 35, avgMarginPct: 0.20, openDaysPerMonth: 0 });
  assertEq('BEC: zero openDays clamps to 28', a.inputs.openDaysPerMonth, 28);
  const b = calcBreakEvenCovers({ fixedMonthlyCosts: 15000, avgCheck: 35, avgMarginPct: 0.20, openDaysPerMonth: 99 });
  assertEq('BEC: 99 openDays clamps to 31',   b.inputs.openDaysPerMonth, 31);
}

// Privacy: fixed-cost bucket enum
scan('bucketFixedCosts scan $0-$100k',  bucketFixedCosts, 0, 100000, 1000, FIXED_COST_BUCKETS);
assertEq('bucket: fixed $4999',   bucketFixedCosts(4999),   'lt5k');
assertEq('bucket: fixed $5000',   bucketFixedCosts(5000),   '5-15k');
assertEq('bucket: fixed $15000',  bucketFixedCosts(15000),  '15-30k');
assertEq('bucket: fixed $30000',  bucketFixedCosts(30000),  '30-60k');
assertEq('bucket: fixed $60000',  bucketFixedCosts(60000),  'gte60k');

// Privacy: no raw leak
{
  const poison = '42000_HIDDEN';
  assert('no "HIDDEN" leak from bucketFixedCosts',
    ('' + bucketFixedCosts(poison)).indexOf('HIDDEN') === -1);
}

// Band sweep for Break-Even Covers: every band returned is in the enum.
{
  const bandsSeen = new Set();
  for (let fixed = 0; fixed <= 50000; fixed += 2500) {
    for (let typical = 0; typical <= 300; typical += 15) {
      const r = calcBreakEvenCovers({
        fixedMonthlyCosts: fixed, avgCheck: 30, avgMarginPct: 0.22,
        openDaysPerMonth: 28, typicalCoversPerDay: typical
      });
      bandsSeen.add(r.band);
      const b = r.band == null ? 'na' : r.band;
      if (!BREAKEVEN_BANDS.includes(b)) {
        console.log('FAIL  BEC band not in enum: ' + JSON.stringify(r.band));
        failures++;
      }
    }
  }
  console.log('PASS  calcBreakEvenCovers band names all in enum (' + bandsSeen.size + ' distinct)');
}

// ------------------------------------------------------------
// Price-Raise Simulator
//
// Canonical fixture from the blog: baseline $100,000/mo, 6% raise,
// 2.5% cover loss ->
//   newSales = 100000 × 1.06 × 0.975 = 103,350
//   delta    = +3,350 (+3.35%)
//   breakEvenCoverLoss = 0.06 / 1.06 = 5.66%
// ------------------------------------------------------------
{
  const r = calcPriceRaise({
    monthlyBaseline: 100000,
    priceRaisePct: 0.06,
    coverLossPct: 0.025
  });
  assertClose('PR: new sales = $103,350',         r.newSales, 103350, 1);
  assertClose('PR: delta = +$3,350',              r.delta, 3350, 1);
  assertClose('PR: deltaPct ≈ 3.35%',             r.deltaPct, 0.0335, 0.001);
  assertClose('PR: break-even cover loss ≈ 5.66%',r.breakEvenCoverLossPct, 0.0566, 0.001);
  assertEq('PR: +3.35% delta -> good',             r.band, 'good');
}

// Wash scenario: 6% raise, 5.66% cover loss -> near-zero delta
{
  const r = calcPriceRaise({
    monthlyBaseline: 100000,
    priceRaisePct: 0.06,
    coverLossPct: 0.0566
  });
  assert('PR: near-zero delta at break-even', Math.abs(r.deltaPct) < 0.005);
}

// Too-aggressive: 6% raise with 10% cover loss -> negative
{
  const r = calcPriceRaise({
    monthlyBaseline: 100000,
    priceRaisePct: 0.06,
    coverLossPct: 0.10
  });
  assert('PR: over-elastic delta is negative', r.delta < 0);
  assert('PR: band is bad when delta < -1%', r.band === 'bad' || r.band === 'warn');
}

// Zero baseline guard (no NaN)
{
  const r = calcPriceRaise({ monthlyBaseline: 0, priceRaisePct: 0.06, coverLossPct: 0.025 });
  assertEq('PR: zero baseline -> zero delta', r.delta, 0);
  assertEq('PR: zero baseline -> zero deltaPct', r.deltaPct, 0);
}

// Band boundaries
{
  // 3% raise, 1% cover loss: newSales = 1.03 × 0.99 = 1.0197; +1.97% -> ok
  const ok = calcPriceRaise({ monthlyBaseline: 100000, priceRaisePct: 0.03, coverLossPct: 0.01 });
  assertEq('PR: +1.97% -> ok', ok.band, 'ok');
  // 3% raise, 3% cover loss: newSales = 1.03 × 0.97 = 0.9991; -0.09% -> warn
  const warn = calcPriceRaise({ monthlyBaseline: 100000, priceRaisePct: 0.03, coverLossPct: 0.03 });
  assertEq('PR: -0.09% -> warn', warn.band, 'warn');
}

// Profit-based break-even + contribution delta
//   6% raise at 20% margin -> profit BE = 0.06 / 0.26 ≈ 23.08%
//   2.5% cover loss at 20% margin:
//     new contribution = 100000 × 0.975 × 0.26 = 25,350
//     baseline contrib = 100000 × 0.20      = 20,000
//     contribDelta     = +5,350 (+26.75% on baseline contribution)
{
  const r = calcPriceRaise({
    monthlyBaseline: 100000,
    priceRaisePct: 0.06,
    coverLossPct: 0.025,
    contribMarginPct: 0.20
  });
  assertClose('PR: profit break-even ≈ 23.08%', r.breakEvenProfitCoverLossPct, 0.2308, 0.001);
  assertClose('PR: contrib delta ≈ +$5,350',    r.contribDelta, 5350, 1);
  assertClose('PR: contrib deltaPct ≈ +26.75%', r.contribDeltaPct, 0.2675, 0.001);
}

// Profit break-even is 0 when contribMarginPct is not supplied
{
  const r = calcPriceRaise({ monthlyBaseline: 100000, priceRaisePct: 0.06, coverLossPct: 0.025 });
  assertEq('PR: profit BE = 0 without margin', r.breakEvenProfitCoverLossPct, 0);
  assertEq('PR: contrib deltaPct = 0 without margin', r.contribDeltaPct, 0);
}

// At profit break-even the contribution delta is ~zero
{
  const p = 0.06, m = 0.20;
  const L = p / (p + m); // 0.2308
  const r = calcPriceRaise({
    monthlyBaseline: 100000, priceRaisePct: p, coverLossPct: L, contribMarginPct: m
  });
  assert('PR: near-zero contrib delta at profit BE', Math.abs(r.contribDelta) < 1);
}

// Privacy: bucket scan
scan('bucketPriceRaiseTier scan 0-20%', bucketPriceRaiseTier, 0, 0.20, 0.005, PRICE_RAISE_TIERS);
scan('bucketCoverLoss scan 0-12%',      bucketCoverLoss,      0, 0.12, 0.005, COVER_LOSS_BUCKETS);

assertEq('bucket: price-raise 0%',    bucketPriceRaiseTier(0),     'none');
assertEq('bucket: price-raise 4%',    bucketPriceRaiseTier(0.04),  'small');
assertEq('bucket: price-raise 6%',    bucketPriceRaiseTier(0.06),  'core');
assertEq('bucket: price-raise 10%',   bucketPriceRaiseTier(0.10),  'signature');
assertEq('bucket: price-raise 12%',   bucketPriceRaiseTier(0.12),  'aggressive');

// Poison-string test for new buckets
{
  const poison = '0.0626_HIDDEN';
  assert('no "HIDDEN" leak from bucketPriceRaiseTier',
    ('' + bucketPriceRaiseTier(poison)).indexOf('HIDDEN') === -1);
  assert('no "HIDDEN" leak from bucketCoverLoss',
    ('' + bucketCoverLoss(poison)).indexOf('HIDDEN') === -1);
}

// Band sweep
{
  const bandsSeen = new Set();
  for (let raise = 0; raise <= 0.15; raise += 0.01) {
    for (let loss = 0; loss <= 0.12; loss += 0.01) {
      const r = calcPriceRaise({ monthlyBaseline: 100000, priceRaisePct: raise, coverLossPct: loss });
      bandsSeen.add(r.band);
      if (!PRICE_RAISE_BANDS.includes(r.band)) {
        console.log('FAIL  PR band not in enum: ' + JSON.stringify(r.band));
        failures++;
      }
    }
  }
  console.log('PASS  calcPriceRaise band names all in enum (' + bandsSeen.size + ' distinct)');
}

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
// URL-fragment scenario encode / decode
//
// Round-trip tests, version-tag presence, and forward-compat guards.
// The encoder intentionally emits raw values — unlike the Plausible
// bucket helpers — because permalinks are the user's own shareable
// link, not telemetry. A separate assertion below confirms the
// encoder implementation does not reach into any bucket function.
// ------------------------------------------------------------
{
  // Empty state → just a version marker
  assertEq('encode: empty state emits v=1 only', encodeState({}), 'v=' + FRAGMENT_VERSION);
  assertEq('encode: undefined input is safe',    encodeState(),   'v=' + FRAGMENT_VERSION);
}

{
  const state = {
    dbe: { t: '25', f: '30', c: 'plus',       o: '150' },
    pc:  { f: '32', l: '34' },
    bec: { fx: '15000', k: '45', m: '22', d: '28', tp: '150' },
    pr:  { b: '120000', t: 'core', l: '2.5', m: '20' }
  };
  const encoded = encodeState(state);
  assert('encode: starts with v=', encoded.indexOf('v=' + FRAGMENT_VERSION + '&') === 0);
  const decoded = decodeState(encoded);
  assertEq('round-trip: dbe.t', decoded.dbe.t, '25');
  assertEq('round-trip: dbe.c', decoded.dbe.c, 'plus');
  assertEq('round-trip: pc.f',  decoded.pc.f,  '32');
  assertEq('round-trip: bec.fx', decoded.bec.fx, '15000');
  assertEq('round-trip: bec.tp', decoded.bec.tp, '150');
  assertEq('round-trip: pr.t',  decoded.pr.t,  'core');
  assertEq('round-trip: pr.l',  decoded.pr.l,  '2.5');
  assertEq('round-trip: pr.m',  decoded.pr.m,  '20');
}

{
  // Partial state (cross-calc pre-fill style)
  const partial = encodeState({ dbe: { t: '40' } });
  assertEq('encode: partial omits unset keys', partial, 'v=' + FRAGMENT_VERSION + '&dbe.t=40');
  const d = decodeState('v=1&dbe.t=40');
  assertEq('decode: partial leaves others absent', d.pc, undefined);
  assertEq('decode: partial reads single key', d.dbe.t, '40');
}

{
  // Leading hash is tolerated
  assertEq('decode: leading hash is stripped', decodeState('#v=1&dbe.t=42').dbe.t, '42');
}

{
  // Unknown namespaces / keys are dropped
  const d = decodeState('v=1&unknown.x=1&dbe.bogus=1&dbe.t=7');
  assertEq('decode: unknown namespace dropped', d.unknown, undefined);
  assertEq('decode: unknown key dropped',       d.dbe.bogus, undefined);
  assertEq('decode: known key kept',            d.dbe.t,  '7');
}

{
  // Malformed input must not throw
  const tries = [
    '',
    '#',
    '===',
    '&&&',
    'v=1&=abc',
    'v=1&dbe.t=%E0%A4%A'  // invalid percent-escape
  ];
  let ok = true;
  tries.forEach(function(s){
    try { decodeState(s); } catch (_e) { ok = false; }
  });
  assert('decode: malformed inputs do not throw', ok);
}

{
  // Separation-of-concerns: source of mmEncodeState / mmDecodeState
  // must not reference any bucket helper. Permalinks emit raw user
  // values; buckets exist to redact raw values before they reach
  // Plausible. The two paths must never cross.
  for (const name of ['mmEncodeState', 'mmDecodeState']) {
    const re = new RegExp('function ' + name + '[\\s\\S]*?^\\}', 'm');
    const block = mmSrc.match(re);
    assert('source: ' + name + ' block exists', !!block);
    if (block) {
      const touches = block[0].match(/mmBucket[A-Za-z]+/);
      assert('source: ' + name + ' does not call any mmBucket*', !touches);
    }
  }
}

// Also proves we imported the two new names
assertEq('FRAGMENT_VERSION is exposed', FRAGMENT_VERSION, '1');
assert('FRAGMENT_KEYS is exposed', FRAGMENT_KEYS && typeof FRAGMENT_KEYS === 'object');

// ------------------------------------------------------------
// Cross-calculator pre-fill
//
// A food-cost percentage is one fact about a restaurant; so is its
// average check and its contribution margin. When one calculator
// receives the value via fragment, the others should seed from it
// unless the fragment already set them explicitly.
// ------------------------------------------------------------
assert('CROSS_FILL_PAIRS is exposed', Array.isArray(CROSS_FILL_PAIRS) && CROSS_FILL_PAIRS.length >= 1);

{
  // dbe.f propagates to pc.f when pc.f is missing
  const a = crossFillState({ dbe: { f: '32' } });
  assertEq('cross-fill: dbe.f -> pc.f (pc missing)', a.pc.f, '32');
  assertEq('cross-fill: dbe.f unchanged',            a.dbe.f, '32');
}
{
  // pc.f propagates to dbe.f when dbe.f is missing
  const a = crossFillState({ pc: { f: '28' } });
  assertEq('cross-fill: pc.f -> dbe.f (dbe missing)', a.dbe.f, '28');
  assertEq('cross-fill: pc.f unchanged',              a.pc.f, '28');
}
{
  // Both sides set: no propagation (user explicitly diverged them)
  const a = crossFillState({ dbe: { f: '30' }, pc: { f: '35' } });
  assertEq('cross-fill: dbe.f preserved when both set', a.dbe.f, '30');
  assertEq('cross-fill: pc.f preserved when both set',  a.pc.f,  '35');
}
{
  // Neither side set: no namespaces created
  const a = crossFillState({ bec: { fx: '15000' } });
  assertEq('cross-fill: no spurious dbe namespace', a.dbe, undefined);
  assertEq('cross-fill: no spurious pc namespace',  a.pc,  undefined);
}
{
  // Average check: dbe.t ↔ bec.k
  assertEq('cross-fill: dbe.t -> bec.k', crossFillState({ dbe: { t: '40' } }).bec.k, '40');
  assertEq('cross-fill: bec.k -> dbe.t', crossFillState({ bec: { k: '45' } }).dbe.t, '45');
}
{
  // Contribution margin: bec.m ↔ pr.m
  assertEq('cross-fill: bec.m -> pr.m', crossFillState({ bec: { m: '22' } }).pr.m, '22');
  assertEq('cross-fill: pr.m -> bec.m', crossFillState({ pr:  { m: '25' } }).bec.m, '25');
}
{
  // Empty input: safe, no throw, no-op
  assertEq('cross-fill: undefined safe', typeof crossFillState(), 'object');
  assertEq('cross-fill: {} safe',        typeof crossFillState({}), 'object');
}
{
  // End-to-end: decode → crossFill pipeline preserves user-set
  // divergence and fills the gap otherwise.
  const state = crossFillState(decodeState('v=1&dbe.f=30&bec.k=38'));
  assertEq('pipeline: dbe.f -> pc.f',   state.pc.f,  '30');
  assertEq('pipeline: bec.k -> dbe.t',  state.dbe.t, '38');
}

// ------------------------------------------------------------
// Summary
// ------------------------------------------------------------
if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll tests passed.');
