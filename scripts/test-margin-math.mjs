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
  calcPrimeCost,
  calcBreakEvenCovers,
  calcPriceRaise,
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
// Summary
// ------------------------------------------------------------
if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll tests passed.');
