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
var MM_FIXED_COST_BUCKETS = ['lt5k', '5-15k', '15-30k', '30-60k', 'gte60k'];
var MM_BREAKEVEN_BANDS = ['good', 'ok', 'warn', 'bad', 'na'];
var MM_PRICE_RAISE_TIERS = ['none', 'small', 'core', 'signature', 'aggressive'];
var MM_COVER_LOSS_BUCKETS = ['lt2', '2-4', '5-8', 'gt8'];
var MM_PRICE_RAISE_BANDS = ['good', 'ok', 'warn', 'bad'];

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

function mmBucketPriceRaiseTier(pct) {
  // Menu-pricing tiers anchored to the post: hold / core / signature
  // / aggressive. Zero is its own bucket (useful analytics signal).
  var p = mmClampPct(pct);
  if (p === 0)    return 'none';
  if (p < 0.05)   return 'small';
  if (p < 0.08)   return 'core';
  if (p < 0.11)   return 'signature';
  return 'aggressive';
}

function mmBucketCoverLoss(pct) {
  var p = mmClampPct(pct);
  if (p < 0.02)   return 'lt2';
  if (p < 0.05)   return '2-4';
  if (p <= 0.08)  return '5-8';
  return 'gt8';
}

function mmBucketFixedCosts(dollars) {
  var d = mmNum(dollars);
  if (d < 5000)  return 'lt5k';
  if (d < 15000) return '5-15k';
  if (d < 30000) return '15-30k';
  if (d < 60000) return '30-60k';
  return 'gte60k';
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

// ------------------------------------------------------------
// Break-Even Covers
//
// Inputs (all optional, defaulted):
//   fixedMonthlyCosts        — rent + insurance + utilities + loan + SaaS, etc. ($)
//   avgCheck                 — average ticket size ($)
//   avgMarginPct             — contribution margin per cover after variable
//                               costs (food, hourly labor, card fees) (0..1 or 0..100)
//   openDaysPerMonth         — days open (defaulted to 28 if not supplied)
//   typicalCoversPerDay      — OPTIONAL; enables capacity-utilization band
//                               + monthly headroom. Zero/blank skips the band.
//
// Model:
//   contributionPerCover      = avgCheck × avgMarginPct
//   coversToBreakEvenMonthly  = fixedMonthlyCosts / contributionPerCover
//   coversToBreakEvenDaily    = coversToBreakEvenMonthly / openDaysPerMonth
//   capacityUtilization       = coversToBreakEvenDaily / typicalCoversPerDay
//                               (fraction of daily covers spent on fixed costs)
//   monthlyHeadroom           = (typical − breakeven) × openDaysPerMonth ×
//                                contributionPerCover
//
// Capacity bands (only emitted when typicalCoversPerDay > 0):
//   ≤ 40%   — good   ("fixed costs are a comfortable share of operations")
//   41-65%  — ok     ("typical; most of the month is spent clearing fixed")
//   66-85%  — warn   ("tight; one slow week tips into loss")
//   > 85%   — bad    ("at break-even; no margin for error")
// ------------------------------------------------------------

function mmCalcBreakEvenCovers(input) {
  input = input || {};
  var fixedMonthlyCosts = mmNum(input.fixedMonthlyCosts);
  var avgCheck = mmNum(input.avgCheck);
  var avgMarginPct = mmClampPct(input.avgMarginPct);
  var openDaysPerMonth = mmNum(input.openDaysPerMonth);
  if (openDaysPerMonth <= 0) openDaysPerMonth = 28;
  if (openDaysPerMonth > 31) openDaysPerMonth = 31;
  var typicalCoversPerDay = mmNum(input.typicalCoversPerDay);

  var contributionPerCover = avgCheck * avgMarginPct;
  var coversToBreakEvenMonthly = contributionPerCover > 0
    ? fixedMonthlyCosts / contributionPerCover
    : 0;
  var coversToBreakEvenDaily = coversToBreakEvenMonthly / openDaysPerMonth;

  var band = null;
  var capacityUtilization = null;
  var monthlyHeadroom = null;
  if (typicalCoversPerDay > 0 && contributionPerCover > 0) {
    capacityUtilization = coversToBreakEvenDaily / typicalCoversPerDay;
    monthlyHeadroom = (typicalCoversPerDay - coversToBreakEvenDaily)
                      * openDaysPerMonth * contributionPerCover;
    if (capacityUtilization <= 0.40)      band = 'good';
    else if (capacityUtilization <= 0.65) band = 'ok';
    else if (capacityUtilization <= 0.85) band = 'warn';
    else                                   band = 'bad';
  }

  return {
    inputs: {
      fixedMonthlyCosts: fixedMonthlyCosts,
      avgCheck: avgCheck,
      avgMarginPct: avgMarginPct,
      openDaysPerMonth: openDaysPerMonth,
      typicalCoversPerDay: typicalCoversPerDay
    },
    contributionPerCover: contributionPerCover,
    coversToBreakEvenMonthly: coversToBreakEvenMonthly,
    coversToBreakEvenDaily: coversToBreakEvenDaily,
    capacityUtilization: capacityUtilization,
    monthlyHeadroom: monthlyHeadroom,
    band: band
  };
}

// ------------------------------------------------------------
// Price-Raise Simulator
//
// Models a menu-wide price raise with assumed cover-loss elasticity.
// First-order approximation:
//   newSales = baseline × (1 + priceRaise) × (1 − coverLoss)
//
// Works because on typical independents the cross-elasticity between
// a small raise and specific-item cover loss is small enough that
// the product approximation tracks observed behavior within a few %.
// The canonical reference: /blog/how-to-raise-restaurant-menu-prices-
// without-losing-reservations/ walks through why this holds for the
// 3-12% raise range the calculator supports.
//
// Two break-even cover-loss thresholds are reported:
//
//   Revenue break-even: cover loss at which newSales = baseline.
//     L_rev = p / (1 + p)
//     e.g., a 6% raise tolerates ~5.66% cover loss before revenue
//     returns to baseline.
//
//   Profit break-even: cover loss at which new contribution =
//   baseline contribution. Variable cost per cover (food, variable
//   labor, card fees) is unchanged by a menu-price change, so each
//   lost cover only costs you its contribution margin, not the whole
//   ticket — which means the profit break-even is much more generous
//   than the revenue one for low-margin restaurants.
//     Derivation (m = contribution margin per cover as a fraction):
//       new contribution = N(1-L) × [T(1+p) - T(1-m)] = N(1-L)T(p+m)
//       baseline contribution = NTm
//       setting equal: (1-L)(p+m) = m  →  L_profit = p / (p + m)
//     e.g., a 6% raise at a 20% contribution margin tolerates
//     ~23.1% cover loss before profit returns to baseline.
//   Requires contribMarginPct > 0; returns 0 otherwise so UI can
//   treat "no margin supplied" as "no profit break-even to show".
//
// Contribution delta (dollars) is the margin-relevant counterpart to
// the revenue delta already computed: the change in monthly
// contribution dollars at the given raise × loss × margin.
//     contribution delta = baseline × [(1-L)(p+m) - m]
//
// Band (driven off revenue delta so it remains comparable to prior
// versions — profit delta is surfaced alongside, not substituted):
//   > +2% delta    — good  ("real pickup")
//   0 to +2%       — ok    ("net positive, small")
//   −1% to 0       — warn  ("wash — watching elasticity")
//   < −1%          — bad   ("losing ground")
// ------------------------------------------------------------

function mmCalcPriceRaise(input) {
  input = input || {};
  var monthlyBaseline = mmNum(input.monthlyBaseline);
  var priceRaisePct = mmClampPct(input.priceRaisePct);
  var coverLossPct = mmClampPct(input.coverLossPct);
  var contribMarginPct = mmClampPct(input.contribMarginPct);

  var newSales = monthlyBaseline * (1 + priceRaisePct) * (1 - coverLossPct);
  var delta = newSales - monthlyBaseline;
  var deltaPct = monthlyBaseline > 0 ? delta / monthlyBaseline : 0;

  var breakEvenCoverLossPct = priceRaisePct > 0
    ? (priceRaisePct / (1 + priceRaisePct))
    : 0;

  var breakEvenProfitCoverLossPct = (priceRaisePct > 0 && contribMarginPct > 0)
    ? (priceRaisePct / (priceRaisePct + contribMarginPct))
    : 0;

  var contribDelta = monthlyBaseline * (
    (1 - coverLossPct) * (priceRaisePct + contribMarginPct) - contribMarginPct
  );
  var contribDeltaPct = (monthlyBaseline > 0 && contribMarginPct > 0)
    ? (contribDelta / (monthlyBaseline * contribMarginPct))
    : 0;

  var band;
  if (deltaPct > 0.02)        band = 'good';
  else if (deltaPct >= 0)     band = 'ok';
  else if (deltaPct >= -0.01) band = 'warn';
  else                         band = 'bad';

  return {
    inputs: {
      monthlyBaseline: monthlyBaseline,
      priceRaisePct: priceRaisePct,
      coverLossPct: coverLossPct,
      contribMarginPct: contribMarginPct
    },
    newSales: newSales,
    delta: delta,
    deltaPct: deltaPct,
    breakEvenCoverLossPct: breakEvenCoverLossPct,
    breakEvenProfitCoverLossPct: breakEvenProfitCoverLossPct,
    contribDelta: contribDelta,
    contribDeltaPct: contribDeltaPct,
    band: band
  };
}

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
// URL-fragment scenario encode / decode
//
// Shareable scenarios live in the URL fragment (after `#`) so the
// browser never sends the encoded state to the server. `v=1` is a
// forward-compat version tag. Keys are flat, dot-namespaced by
// calculator, so a partial link — e.g. `#v=1&dbe.t=30` — still
// loads cleanly (every decoder reads only its own namespace).
//
// Schema:
//   v=1                     version marker (required)
//   dbe.t  dbe.f  dbe.c  dbe.o          Delivery Break-Even
//   pc.f   pc.l                          Prime Cost
//   bec.fx bec.k  bec.m  bec.d  bec.tp   Break-Even Covers
//   pr.b   pr.t   pr.l   pr.m            Price-Raise
//
// Only the tier fields (`dbe.c`, `pr.t`) are enumerated strings; all
// others are numeric strings. The decoder does NOT validate numeric
// bounds — that's the consumer UI's job (clamp via input min/max).
//
// Separation-of-concerns invariant:
//   These functions are fully disjoint from the Plausible bucket
//   helpers. Analytics remain bucket-only; permalinks intentionally
//   emit raw values because they are the user's own link, not
//   telemetry the server sees. The test suite asserts neither path
//   calls into the other.
// ------------------------------------------------------------

var MM_FRAGMENT_VERSION = '1';
var MM_FRAGMENT_KEYS = {
  dbe: ['t', 'f', 'c', 'o'],
  pc:  ['f', 'l'],
  bec: ['fx', 'k', 'm', 'd', 'tp'],
  pr:  ['b', 't', 'l', 'm']
};

function mmEncodeState(state) {
  // Pure: given a { dbe, pc, bec, pr } partial object, return a URL
  // fragment string (without leading `#`). Missing values are
  // omitted entirely so the link stays compact.
  state = state || {};
  var parts = ['v=' + MM_FRAGMENT_VERSION];
  Object.keys(MM_FRAGMENT_KEYS).forEach(function(ns){
    var sub = state[ns];
    if (!sub) return;
    MM_FRAGMENT_KEYS[ns].forEach(function(k){
      var v = sub[k];
      if (v === undefined || v === null || v === '') return;
      parts.push(ns + '.' + k + '=' + encodeURIComponent(String(v)));
    });
  });
  return parts.join('&');
}

function mmDecodeState(hash) {
  // Pure: accept a fragment string (leading `#` optional) and return
  // a { dbe, pc, bec, pr } partial object with only the keys that
  // were present. Silently ignores unknown namespaces/keys so a
  // future schema version can forward-compat with this decoder.
  if (typeof hash !== 'string') return {};
  if (hash.charAt(0) === '#') hash = hash.slice(1);
  if (!hash) return {};
  var out = {};
  var pairs = hash.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var eq = pairs[i].indexOf('=');
    if (eq < 0) continue;
    var rawKey = pairs[i].slice(0, eq);
    var rawVal = pairs[i].slice(eq + 1);
    if (!rawKey) continue;
    var dot = rawKey.indexOf('.');
    if (dot < 0) continue;  // skips v=1, and any non-namespaced key
    var ns = rawKey.slice(0, dot);
    var k  = rawKey.slice(dot + 1);
    if (!MM_FRAGMENT_KEYS[ns]) continue;
    if (MM_FRAGMENT_KEYS[ns].indexOf(k) < 0) continue;
    var val;
    try { val = decodeURIComponent(rawVal); } catch (_e) { continue; }
    if (!out[ns]) out[ns] = {};
    out[ns][k] = val;
  }
  return out;
}

// ------------------------------------------------------------
// Dual export
// ------------------------------------------------------------

if (typeof window !== 'undefined') {
  window.MM = {
    calcDeliveryBreakeven: mmCalcDeliveryBreakeven,
    calcPrimeCost:         mmCalcPrimeCost,
    calcBreakEvenCovers:   mmCalcBreakEvenCovers,
    calcPriceRaise:        mmCalcPriceRaise,
    encodeState: mmEncodeState,
    decodeState: mmDecodeState,
    FRAGMENT_VERSION: MM_FRAGMENT_VERSION,
    FRAGMENT_KEYS:    MM_FRAGMENT_KEYS,
    formatMoney: mmFormatMoney,
    formatPct: mmFormatPct,
    bucketTicket: mmBucketTicket,
    bucketFoodCost: mmBucketFoodCost,
    bucketCommission: mmBucketCommission,
    bucketPrimeCost: mmBucketPrimeCost,
    bucketFixedCosts: mmBucketFixedCosts,
    bucketPriceRaiseTier: mmBucketPriceRaiseTier,
    bucketCoverLoss: mmBucketCoverLoss,
    TICKET_BUCKETS: MM_TICKET_BUCKETS,
    FOODCOST_BUCKETS: MM_FOODCOST_BUCKETS,
    COMMISSION_TIERS: MM_COMMISSION_TIERS,
    PRIME_COST_BUCKETS: MM_PRIME_COST_BUCKETS,
    PRIME_COST_BANDS: MM_PRIME_COST_BANDS,
    FIXED_COST_BUCKETS: MM_FIXED_COST_BUCKETS,
    BREAKEVEN_BANDS: MM_BREAKEVEN_BANDS,
    PRICE_RAISE_TIERS: MM_PRICE_RAISE_TIERS,
    COVER_LOSS_BUCKETS: MM_COVER_LOSS_BUCKETS,
    PRICE_RAISE_BANDS: MM_PRICE_RAISE_BANDS,
    RECOMMENDATIONS: MM_RECOMMENDATIONS,
    DIRECT_PROCESSING_PCT: MM_DIRECT_PROCESSING_PCT
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calcDeliveryBreakeven: mmCalcDeliveryBreakeven,
    calcPrimeCost:         mmCalcPrimeCost,
    calcBreakEvenCovers:   mmCalcBreakEvenCovers,
    calcPriceRaise:        mmCalcPriceRaise,
    encodeState: mmEncodeState,
    decodeState: mmDecodeState,
    FRAGMENT_VERSION: MM_FRAGMENT_VERSION,
    FRAGMENT_KEYS:    MM_FRAGMENT_KEYS,
    formatMoney: mmFormatMoney,
    formatPct: mmFormatPct,
    bucketTicket: mmBucketTicket,
    bucketFoodCost: mmBucketFoodCost,
    bucketCommission: mmBucketCommission,
    bucketPrimeCost: mmBucketPrimeCost,
    bucketFixedCosts: mmBucketFixedCosts,
    bucketPriceRaiseTier: mmBucketPriceRaiseTier,
    bucketCoverLoss: mmBucketCoverLoss,
    clampPct: mmClampPct,
    num: mmNum,
    TICKET_BUCKETS: MM_TICKET_BUCKETS,
    FOODCOST_BUCKETS: MM_FOODCOST_BUCKETS,
    COMMISSION_TIERS: MM_COMMISSION_TIERS,
    PRIME_COST_BUCKETS: MM_PRIME_COST_BUCKETS,
    PRIME_COST_BANDS: MM_PRIME_COST_BANDS,
    FIXED_COST_BUCKETS: MM_FIXED_COST_BUCKETS,
    BREAKEVEN_BANDS: MM_BREAKEVEN_BANDS,
    PRICE_RAISE_TIERS: MM_PRICE_RAISE_TIERS,
    COVER_LOSS_BUCKETS: MM_COVER_LOSS_BUCKETS,
    PRICE_RAISE_BANDS: MM_PRICE_RAISE_BANDS,
    RECOMMENDATIONS: MM_RECOMMENDATIONS,
    DIRECT_PROCESSING_PCT: MM_DIRECT_PROCESSING_PCT
  };
}
