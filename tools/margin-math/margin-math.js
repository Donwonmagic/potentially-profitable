/**
 * Margin Math — pure math + bucket helpers.
 *
 * Loaded as a classic script in ./index.html (EN + ES). Also Node-
 * importable for unit tests via scripts/test-margin-math.mjs. The
 * dual-export block at the bottom follows the pattern set by
 * tools/gbp-grader/gbp-grader.js.
 *
 * Privacy-critical invariants (tested in scripts/test-margin-math.mjs):
 *
 *   1. Every exported function is pure — no fetch, no localStorage, no
 *      cookies, no global side effects beyond attaching to window.MM.
 *   2. The Plausible bucket helpers return values from a small fixed
 *      enumerated set. No numeric input string is ever echoed back.
 *
 * Currency notation is USD-only in this release. Every $ figure carries
 * implied precision of $0.01; results are rounded for display by the
 * consumer, not here — keeping math pure and testable.
 */

// ------------------------------------------------------------
// Helpers — pure
// ------------------------------------------------------------

function mmNum(v) {
  // Parse any input into a finite non-negative number. Returns 0 on
  // NaN / null / undefined / negative — the calculator's inputs are
  // never meaningfully negative (no refund math here).
  var n = parseFloat(v);
  if (!isFinite(n) || n < 0) return 0;
  return n;
}

function mmClampPct(v) {
  // Accept either 0.25 (as a fraction) or 25 (as a percentage).
  // Clamp to [0, 1]. This lets the UI pass either shape without
  // every consumer needing to know which the current form uses.
  var n = mmNum(v);
  if (n > 1) n = n / 100;
  return n > 1 ? 1 : n;
}

function mmFormatMoney(n) {
  // Return "$1,234" for whole amounts, "$12.34" for under-$1000 with
  // decimals. Compact-first for the calculator's big-number displays.
  var rounded = Math.round(mmNum(n) * 100) / 100;
  if (rounded >= 1000) {
    return '$' + Math.round(rounded).toLocaleString('en-US');
  }
  var str = rounded.toFixed(2).replace(/\.00$/, '');
  return '$' + str;
}

function mmFormatPct(n) {
  // Return "25%" from either 0.25 or 25. Integer percent only —
  // the calculator's sliders step in whole percent.
  var p = mmClampPct(n) * 100;
  return Math.round(p) + '%';
}

// ------------------------------------------------------------
// Delivery Break-Even math
//
// Inputs (all optional, defaulted):
//   ticket              — avg order amount in dollars
//   foodCostPct         — food cost as fraction of sales (0..1 or 0..100)
//   commissionPct       — aggregator commission as fraction (0..1 or 0..100)
//   ordersPerMonth      — order volume, used for monthly projections
//
// Model:
//   On an aggregator, the platform absorbs payment processing in the
//   commission. Merchant gets ticket - foodCost - commission.
//   On direct ordering, merchant pays payment processing (~3% Stripe/
//   Toast/Square typical). Merchant gets ticket - foodCost - processing.
//   The 3% rate is a constant, not a user input, because its variance
//   (2.9%-3.5%) is smaller than the precision of the other inputs.
// ------------------------------------------------------------

var MM_DIRECT_PROCESSING_PCT = 0.03;

function mmCalcDeliveryBreakeven(input) {
  input = input || {};
  var ticket = mmNum(input.ticket);
  var foodCostPct = mmClampPct(input.foodCostPct);
  var commissionPct = mmClampPct(input.commissionPct);
  var ordersPerMonth = mmNum(input.ordersPerMonth);

  var foodCostDollars = ticket * foodCostPct;
  var platformFeeDollars = ticket * commissionPct;
  var directFeeDollars = ticket * MM_DIRECT_PROCESSING_PCT;

  var perOrderOnPlatform = ticket - foodCostDollars - platformFeeDollars;
  var perOrderDirect = ticket - foodCostDollars - directFeeDollars;
  var perOrderDelta = perOrderDirect - perOrderOnPlatform;

  var monthlyOnPlatform = perOrderOnPlatform * ordersPerMonth;
  var monthlyDirect = perOrderDirect * ordersPerMonth;
  var monthlyDelta = perOrderDelta * ordersPerMonth;

  // Recommendation strip — purely commission-driven because food cost
  // is upstream of the platform decision. If margin disappears at the
  // typical food cost, the owner's lever is "move orders direct," not
  // "re-evaluate DoorDash."
  var recommendation;
  if (commissionPct < 0.15) recommendation = 'keep';
  else if (commissionPct < 0.25) recommendation = 'optimize';
  else recommendation = 'consider-leaving';

  return {
    inputs: {
      ticket: ticket,
      foodCostPct: foodCostPct,
      commissionPct: commissionPct,
      ordersPerMonth: ordersPerMonth,
      directProcessingPct: MM_DIRECT_PROCESSING_PCT
    },
    perOrderOnPlatform: perOrderOnPlatform,
    perOrderDirect: perOrderDirect,
    perOrderDelta: perOrderDelta,
    monthlyOnPlatform: monthlyOnPlatform,
    monthlyDirect: monthlyDirect,
    monthlyDelta: monthlyDelta,
    recommendation: recommendation
  };
}

// ------------------------------------------------------------
// Plausible bucket helpers — privacy-critical
//
// Every analytics prop value is drawn from a tiny, fixed enum. No
// raw input is ever reflected. Tests in test-margin-math.mjs assert
// each of these returns only a value from its allow-list.
// ------------------------------------------------------------

var MM_TICKET_BUCKETS = ['lt15', '15-24', '25-39', 'gte40'];
var MM_FOODCOST_BUCKETS = ['lt28', '28-32', '33-37', 'gte38'];
var MM_COMMISSION_TIERS = ['basic', 'plus', 'premier'];
var MM_RECOMMENDATIONS = ['keep', 'optimize', 'consider-leaving'];
var MM_PRIME_COST_BUCKETS = ['lt55', '55-59', '60-64', '65-69', 'gte70'];
var MM_PRIME_COST_BANDS = ['below', 'good', 'ok', 'warn', 'bad'];

function mmBucketTicket(ticket) {
  var t = mmNum(ticket);
  if (t < 15) return 'lt15';
  if (t < 25) return '15-24';
  if (t < 40) return '25-39';
  return 'gte40';
}

function mmBucketFoodCost(pct) {
  var p = mmClampPct(pct);
  if (p < 0.28) return 'lt28';
  if (p < 0.33) return '28-32';
  if (p < 0.38) return '33-37';
  return 'gte38';
}

function mmBucketCommission(pct) {
  // Aggregator commission tiers roughly match DoorDash / Uber Eats
  // published tiers. Below 18% = "basic." 18–27% = "plus." Above = "premier."
  var p = mmClampPct(pct);
  if (p < 0.18) return 'basic';
  if (p < 0.27) return 'plus';
  return 'premier';
}

function mmBucketPrimeCost(pct) {
  // Prime-cost buckets mirror the band thresholds exactly. No decimal
  // precision leaked; every return value is from MM_PRIME_COST_BUCKETS.
  var p = mmClampPct(pct);
  if (p < 0.55) return 'lt55';
  if (p < 0.60) return '55-59';
  if (p < 0.65) return '60-64';
  if (p < 0.70) return '65-69';
  return 'gte70';
}

// ------------------------------------------------------------
// Prime Cost Check
//
// Inputs:
//   foodCostPct         — food cost as fraction of sales (0..1 or 0..100)
//   laborCostPct        — labor cost as fraction of sales (0..1 or 0..100)
//
// Output:
//   primeCostPct        — sum, capped at 100%
//   band                — 'below' | 'good' | 'ok' | 'warn' | 'bad'
//
// Band thresholds (anchored to NRA benchmarks cited in the DoorDash
// post; 55-65% is the widely-published healthy range for full-service
// independents):
//   < 55%   — below ("unusually tight; confirm costs are fully in")
//   55-59%  — good  (healthy lower half)
//   60-64%  — ok    (healthy upper half; watch trend)
//   65-69%  — warn  (pressure zone)
//   >= 70%  — bad   (unsustainable without correction)
// ------------------------------------------------------------

function mmCalcPrimeCost(input) {
  input = input || {};
  var foodCostPct = mmClampPct(input.foodCostPct);
  var laborCostPct = mmClampPct(input.laborCostPct);
  var primeCostPct = foodCostPct + laborCostPct;
  if (primeCostPct > 1) primeCostPct = 1;

  var band;
  if (primeCostPct < 0.55)       band = 'below';
  else if (primeCostPct < 0.60)  band = 'good';
  else if (primeCostPct < 0.65)  band = 'ok';
  else if (primeCostPct < 0.70)  band = 'warn';
  else                           band = 'bad';

  return {
    inputs: {
      foodCostPct: foodCostPct,
      laborCostPct: laborCostPct
    },
    primeCostPct: primeCostPct,
    band: band
  };
}

// ------------------------------------------------------------
// Dual export
// ------------------------------------------------------------

if (typeof window !== 'undefined') {
  window.MM = {
    calcDeliveryBreakeven: mmCalcDeliveryBreakeven,
    calcPrimeCost:         mmCalcPrimeCost,
    formatMoney: mmFormatMoney,
    formatPct: mmFormatPct,
    bucketTicket: mmBucketTicket,
    bucketFoodCost: mmBucketFoodCost,
    bucketCommission: mmBucketCommission,
    bucketPrimeCost: mmBucketPrimeCost,
    TICKET_BUCKETS: MM_TICKET_BUCKETS,
    FOODCOST_BUCKETS: MM_FOODCOST_BUCKETS,
    COMMISSION_TIERS: MM_COMMISSION_TIERS,
    PRIME_COST_BUCKETS: MM_PRIME_COST_BUCKETS,
    PRIME_COST_BANDS: MM_PRIME_COST_BANDS,
    RECOMMENDATIONS: MM_RECOMMENDATIONS,
    DIRECT_PROCESSING_PCT: MM_DIRECT_PROCESSING_PCT
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calcDeliveryBreakeven: mmCalcDeliveryBreakeven,
    calcPrimeCost:         mmCalcPrimeCost,
    formatMoney: mmFormatMoney,
    formatPct: mmFormatPct,
    bucketTicket: mmBucketTicket,
    bucketFoodCost: mmBucketFoodCost,
    bucketCommission: mmBucketCommission,
    bucketPrimeCost: mmBucketPrimeCost,
    clampPct: mmClampPct,
    num: mmNum,
    TICKET_BUCKETS: MM_TICKET_BUCKETS,
    FOODCOST_BUCKETS: MM_FOODCOST_BUCKETS,
    COMMISSION_TIERS: MM_COMMISSION_TIERS,
    PRIME_COST_BUCKETS: MM_PRIME_COST_BUCKETS,
    PRIME_COST_BANDS: MM_PRIME_COST_BANDS,
    RECOMMENDATIONS: MM_RECOMMENDATIONS,
    DIRECT_PROCESSING_PCT: MM_DIRECT_PROCESSING_PCT
  };
}
