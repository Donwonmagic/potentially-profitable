/**
 * Muntin — Spread decomposition (the vendor-vs-market discrimination).
 *
 * The pure core of the Plate flagship insight E1 ("it's the vendor, not the
 * market"): given the operator's OWN delivered rate-of-change on a product and
 * the public Cost-Index market rate-of-change for the same ingredient, decide
 * how much of the move the market explains and how much is the vendor — and,
 * crucially, REFUSE to say anything when the comparison isn't honest yet.
 *
 * THE CARDINAL RULE: a % is basis-invariant; a $ level is not. This function
 * takes only rate-of-change percentages and returns only percentages and a
 * label — it is structurally incapable of subtracting a wholesale level from a
 * delivered level (the fatal lie). Spread-of-CHANGES only, never spread-of-levels.
 *
 * The discipline that makes it honest — it screens before it speaks:
 *   1. Four confounders (a true flag = an unresolved contamination):
 *      - packFlip:       pack size changed → compare on cents-per-base first, not this %.
 *      - gradeSwitch:    canonical/grade changed → not the same product.
 *      - promo:          a promo/one-off blip in the window (period-median + robust-Z upstream).
 *      - windowMismatch: own vs market windows not the same calendar span.
 *   2. Data sufficiency (mirrors muntin-insight-layer.md #1): show a spread only
 *      when the market read is confidence >= medium AND agreement >= 0.66 AND the
 *      operator has >= 3 same-unit vendor periods behind their own %. Otherwise
 *      `gated: true` — the caller shows each side alone, no spread.
 * When gated, attribution is 'inconclusive' and the spread fields are null.
 *
 * Attribution (only when the gates pass) leads the caller toward the RECOVERABLE
 * lever; the caller still discloses BOTH numbers (see vendorAsk copy). The label
 * is where the lever is, not a verdict on anyone's motive:
 *   - 'market':  the vendor share is immaterial — the market explains the move.
 *   - 'vendor':  the vendor is the majority of the move (or the market moved the
 *                other way and gave no cover at all).
 *   - 'mixed':   both are material but the market is the larger share.
 *
 * Pure, deterministic, no DOM/network/LLM. Browser: window.MuntinSpreadDecompose.
 * Node: module.exports.
 *
 * PARITY CONTRACT. This module is the source of truth for the discrimination.
 * The paid product (Muntin Ledger) ships a behaviour-identical TypeScript port;
 * the vectors in spread-decompose.test.mjs are mirrored verbatim on that side.
 * If the thresholds or the attribution change here, change the Ledger port in the
 * same change — or the free read and the product will disagree in front of the
 * same operator.
 *
 * @param {{
 *   ownDeltaPct:number, marketDeltaPct:number,
 *   marketConfidence:('high'|'medium'|'low'|'directional'),
 *   marketAgreement:number, vendorPeriods:number,
 *   confounders?:{packFlip?:boolean,gradeSwitch?:boolean,promo?:boolean,windowMismatch?:boolean}
 * }} input
 * @returns {{
 *   attribution:('vendor'|'market'|'mixed'|'inconclusive'),
 *   gated:boolean, reason:string,
 *   spreadPct:(number|null), marketPoints:(number|null),
 *   vendorPoints:(number|null), vendorShare:(number|null),
 *   confidence:('high'|'medium'|'low')
 * }}
 */
(function (root) {
  'use strict';

  // Tunable thresholds (kept here so the parity port can mirror them exactly).
  var FLAT = 0.005;            // |move| below this is directionless noise
  var MATERIAL_MOVE = 0.02;    // own move must clear this to be worth attributing
  var MATERIAL_SPREAD = 0.03;  // vendor share below this (in pts) is noise → 'market'
  var VENDOR_MAJORITY = 0.5;   // vendor share of the move at/above this → 'vendor'
  var MIN_VENDOR_PERIODS = 3;  // same-unit vendor periods behind the own %
  var MIN_AGREEMENT = 0.66;    // market-trend agreement floor

  function num(x) { return typeof x === 'number' && isFinite(x); }
  function round4(x) { return +x.toFixed(4); }
  function sign(x) { return x > FLAT ? 1 : (x < -FLAT ? -1 : 0); }

  function gate(reason) {
    return {
      attribution: 'inconclusive', gated: true, reason: reason,
      spreadPct: null, marketPoints: null, vendorPoints: null, vendorShare: null,
      confidence: 'low'
    };
  }

  function decompose(input) {
    input = input || {};
    var own = input.ownDeltaPct;
    var mkt = input.marketDeltaPct;
    if (!num(own) || !num(mkt)) return gate('bad-input');

    // 1. Confounder screen — a contaminated % must not speak (fixed order).
    var c = input.confounders || {};
    if (c.packFlip)       return gate('confounder-pack-flip');
    if (c.gradeSwitch)    return gate('confounder-grade-switch');
    if (c.promo)          return gate('confounder-promo');
    if (c.windowMismatch) return gate('confounder-window-mismatch');

    // 2. Nothing to attribute if the operator's own move is immaterial.
    if (Math.abs(own) < MATERIAL_MOVE) return gate('immaterial-move');

    // 3. Data-sufficiency gate (insight-layer #1): else show each side alone.
    var conf = input.marketConfidence;
    if (conf === 'low' || conf === 'directional' || !conf) return gate('market-confidence-below-medium');
    if (!num(input.marketAgreement) || input.marketAgreement < MIN_AGREEMENT) return gate('market-agreement-below-floor');
    if (!num(input.vendorPeriods) || input.vendorPeriods < MIN_VENDOR_PERIODS) return gate('insufficient-vendor-periods');

    // 4. Decompose — spread of CHANGES (own = market + residual vendor share).
    var spread = own - mkt;                 // the part the market does not explain
    var marketPoints = mkt;
    var vendorPoints = spread;
    var vendorShare = Math.abs(own) > 0 ? Math.abs(spread) / Math.abs(own) : 0;

    var attribution, reason;
    if (sign(mkt) !== 0 && sign(mkt) !== sign(own)) {
      // The market moved the other way (or flat-against the move) → no cover.
      attribution = 'vendor';
      reason = 'vendor-no-market-cover';
    } else if (Math.abs(spread) < MATERIAL_SPREAD) {
      attribution = 'market';
      reason = 'market-explains';
    } else if (vendorShare >= VENDOR_MAJORITY) {
      attribution = 'vendor';
      reason = 'vendor-majority';
    } else {
      attribution = 'mixed';
      reason = 'mixed-market-majority';
    }

    // Confidence in the ATTRIBUTION never exceeds the market read's confidence
    // (the honesty ceiling). 'high' only when the own side is also firm.
    var confidence = (conf === 'high' && input.vendorPeriods >= 6) ? 'high' : 'medium';

    return {
      attribution: attribution,
      gated: false,
      reason: reason,
      spreadPct: round4(spread),
      marketPoints: round4(marketPoints),
      vendorPoints: round4(vendorPoints),
      vendorShare: +vendorShare.toFixed(2),
      confidence: confidence
    };
  }

  var api = { decompose: decompose };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinSpreadDecompose = api;
  if (root) root.MuntinSpreadDecompose = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
