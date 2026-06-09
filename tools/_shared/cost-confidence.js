/**
 * Muntin — Cost Index confidence, split honestly into LEVEL and TREND.
 *
 * The headline confidence (composite-price.js) is the MIN of the level and
 * trend stories, which buries a solid measured price under a noisy trend: an
 * 8-market USDA wholesale range gets stamped "low" only because its week-to-week
 * direction is choppy. That mislabels complete, authoritative data as untrust-
 * worthy. This module derives the two confidences SEPARATELY from a vendored
 * point's stored sub-objects (no re-fetch), so each can be presented on its own
 * terms — a confident dated price range, plus an honestly-hedged trend.
 *
 * Thresholds mirror composite-price.js confidenceFor() exactly (kept in lockstep
 * by cost-confidence.test.mjs); this module READS, never recomputes the headline.
 *
 *   levelConfidence(level) -> 'low'|'medium'|'high'|null   (null = no dollar level)
 *   trendConfidence(trend) -> 'low'|'medium'|'high'|null   (null = no trend)
 *   isShippable(point)     -> boolean   (the "ship complete or not at all" bar)
 *
 * THE SHIPPABLE BAR: an ingredient earns a public reading only if it has a
 * CREDIBLE wholesale dollar level — either a measured cross-market range (>=3
 * markets) OR a single authoritative source whose direction is corroborated by
 * >=2 independent types and isn't pathologically noisy. No dollar level, or a
 * lone source the trend can't corroborate, => it does not ship (no apologetic
 * "no published figure" reads, ever).
 *
 * Pure, deterministic, no DOM/network. Browser: window.MuntinCostConfidence.
 */
(function (root) {
  'use strict';
  var STEP = ['low', 'medium', 'high'];

  function levelConfidence(level) {
    if (!level || typeof level.medianCents !== 'number' || !isFinite(level.medianCents) || level.basis === 'index') return null;
    var lt = level.nTypes != null ? level.nTypes : (level.nFamilies != null ? level.nFamilies : level.nSources) || 0;
    var ceil = lt >= 2 ? 2 : lt >= 1 ? 1 : 0;
    // Independent dollar types that DISAGREE (>15% robust CoV) can't earn 'high'.
    if (lt >= 2 && level.typeDispersion != null && level.typeDispersion > 0.15) ceil = 1;
    return STEP[ceil];
  }

  function trendConfidence(trend) {
    if (!trend || trend.pct == null) return null;
    var tt = trend.nTypes != null ? trend.nTypes : (trend.nFamilies != null ? trend.nFamilies : trend.nSources) || 0;
    var agree = trend.agreement || 0;
    var ceil = (tt >= 2 && agree >= 0.66) ? 2 : (tt >= 2 && agree >= 0.33) ? 1 : 0;
    // A jagged path is noise dressed as a trend; endpoints agreeing doesn't redeem it.
    if (trend.noise != null) {
      if (trend.noise > 0.20) ceil = 0;
      else if (trend.noise > 0.08 && ceil > 1) ceil = 1;
    }
    return STEP[ceil];
  }

  function isShippable(point) {
    if (!point) return false;
    var L = point.level, T = point.trend;
    // No usable wholesale dollar level (index-only / nothing) => never ship.
    if (!L || typeof L.medianCents !== 'number' || !isFinite(L.medianCents) || L.basis === 'index') return false;
    // A measured cross-market range is complete, authoritative data on its own.
    if (L.rangeBasis === 'markets' && (L.nFamilies || 0) >= 3) return true;
    // A single authoritative source ships only if its direction is corroborated
    // by >=2 independent types and the trend isn't pathologically noisy (the
    // signal that the lone level is real, not a fluke). Drops eggs (noise 0.26).
    if (T && T.pct != null && (T.nTypes || 0) >= 2 && (T.noise == null || T.noise <= 0.20)) return true;
    return false;
  }

  var api = { levelConfidence: levelConfidence, trendConfidence: trendConfidence, isShippable: isShippable };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinCostConfidence = api;
  if (root) root.MuntinCostConfidence = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
