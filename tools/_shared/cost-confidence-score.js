/**
 * cost-confidence-score.js — a calibrated, continuous confidence SCORE for a Cost Index
 * point, the within-ceiling gradation the heuristic label lacks.
 *
 * The confidence-label calibration report showed the published gradation isn't ordered by
 * realized accuracy ("medium" is skillful; "low"/"directional" are near-noise on direction).
 * This computes a continuous S in [0,1] from the SAME dimensions the hard cap already uses —
 * independence, cross-source agreement, freshness, and the item's own backtested band
 * coverage — so a higher S means a genuinely better-supported read. Binning S (via DERIVED
 * cut-points) re-grades the label; the hard cap (calibrationCeiling) still dominates, so a
 * score can only LOWER a label, never raise it past what the data supports.
 *
 * This is a PURE numeric kernel: it takes already-computed inputs (the caller composes the
 * existing modules — typeCount, stalenessOf, conformalNext — to produce them), so the kernel
 * stays browser-safe and testable with plain numbers, and touches no parity-locked module.
 * It asserts no price and makes no forward claim (the "no forecast" promise holds). Weights
 * are labeled-illustrative tuning constants (same posture as cost-spike.js / cost-anomaly.js);
 * the BINDING property is monotone realized hit-rate across tiers, enforced where cuts are
 * derived — not the weights.
 *
 * PARITY: storefront-only. The Ledger consumes the confidence label as an opaque enum and
 * never recomputes it (see packages/cost-alerts/src/overpayment-alert.ts), so no TS port is
 * required as long as the four label strings + their order are unchanged.
 *
 * Pure, deterministic, no DOM/network. Browser: window.MuntinCostScore.
 */
(function (root) {
  "use strict";

  var NAME = ["directional", "low", "medium", "high"];
  var DEFAULT_WEIGHTS = { indep: 0.4, agreement: 0.3, freshness: 0.15, ownCoverage: 0.15 };

  function clamp(x, lo, hi) {
    return x < lo ? lo : x > hi ? hi : x;
  }
  function r3(x) {
    return Math.round(x * 1000) / 1000;
  }

  // ratio = staleDays / cadenceDays (from cost-staleness.stalenessOf); null → assume fresh.
  // within-cadence (ratio<=1) → 1 ; 4 cadences overdue → 0.
  function freshnessFromRatio(ratio) {
    if (ratio == null) return 1;
    return clamp(1 - (ratio - 1) / 3, 0, 1);
  }

  /**
   * scoreOf(inputs, weights) — inputs:
   *   { indepTypes, agreement, freshnessRatio, ownCoverage }
   * indepTypes = distinct independent dollar TYPES (1→0, 2→0.5, 3+→1); agreement ∈ [0,1];
   * freshnessRatio = staleness ratio (null=fresh); ownCoverage = this item's backtested band
   * coverage ∈ [0,1] (0 when history too short — degrades down).
   * Returns { S, parts:{indep,agreement,freshness,ownCoverage} }.
   */
  function scoreOf(inputs, weights) {
    var w = weights || DEFAULT_WEIGHTS;
    inputs = inputs || {};
    var indep = clamp(((inputs.indepTypes || 0) - 1) / 2, 0, 1);
    var agreement = clamp(inputs.agreement || 0, 0, 1);
    var freshness = freshnessFromRatio(inputs.freshnessRatio);
    var ownCoverage = clamp(inputs.ownCoverage || 0, 0, 1);
    var S = w.indep * indep + w.agreement * agreement + w.freshness * freshness + w.ownCoverage * ownCoverage;
    return {
      S: r3(S),
      parts: { indep: r3(indep), agreement: r3(agreement), freshness: r3(freshness), ownCoverage: r3(ownCoverage) },
    };
  }

  // Tier index 0..len(cuts) for ascending cut-points [c1,c2,c3].
  function tierFromCuts(S, cuts) {
    var i = 0;
    for (var c = 0; c < cuts.length; c++) if (S >= cuts[c]) i++;
    return i;
  }

  // The calibrated label: bin by score, then apply the HARD CAP (a score never raises a
  // label above its data-supported ceiling rank). ceilingRank is RANK[calibrationCeiling].
  function calibratedRank(S, cuts, ceilingRank) {
    return Math.min(tierFromCuts(S, cuts), ceilingRank);
  }
  function calibratedConfidence(S, cuts, ceilingRank) {
    return NAME[calibratedRank(S, cuts, ceilingRank)];
  }

  function quantile(sortedAsc, p) {
    var n = sortedAsc.length;
    if (!n) return 0;
    if (n === 1) return sortedAsc[0];
    var idx = (n - 1) * p, lo = Math.floor(idx), hi = Math.ceil(idx);
    if (lo === hi) return sortedAsc[lo];
    return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo);
  }

  /**
   * deriveCuts(samples, opts) — DERIVE cut-points from data, not hand-typed.
   * samples: [{ S, hits, n }] per backtestable item (n = scored directional calls).
   * Starts from S quartiles (3 cuts → 4 tiers), then MERGES adjacent tiers (drops a cut)
   * until every occupied tier has >= minItems AND pooled hit-rate is monotone non-decreasing
   * by tier. Returns { cuts, tiers:[{n, calls, hits, hitRate}], monotone }.
   * Naturally collapses to fewer tiers when the data can't support four.
   */
  function deriveCuts(samples, opts) {
    opts = opts || {};
    var minItems = opts.minItems != null ? opts.minItems : 4;
    var tol = opts.tol != null ? opts.tol : 0.07;
    var pts = (samples || []).filter(function (s) { return s && typeof s.S === "number" && s.n > 0; });
    var Ss = pts.map(function (s) { return s.S; }).sort(function (a, b) { return a - b; });
    var cuts = [quantile(Ss, 0.25), quantile(Ss, 0.5), quantile(Ss, 0.75)]
      .filter(function (c, i, arr) { return i === 0 || c > arr[i - 1]; }); // dedupe ties

    function tiersFor(cs) {
      var rows = [];
      for (var t = 0; t <= cs.length; t++) rows.push({ items: 0, calls: 0, hits: 0 });
      pts.forEach(function (s) {
        var r = rows[tierFromCuts(s.S, cs)];
        r.items++; r.calls += s.n; r.hits += s.hits;
      });
      return rows.map(function (r) {
        return { items: r.items, calls: r.calls, hits: r.hits, hitRate: r.calls ? r3(r.hits / r.calls) : null };
      });
    }
    function ok(cs) {
      var rows = tiersFor(cs);
      var occ = rows.filter(function (r) { return r.items > 0; });
      if (occ.some(function (r) { return r.items < minItems; })) return false;
      var prev = -Infinity;
      for (var i = 0; i < occ.length; i++) {
        if (occ[i].hitRate == null) continue;
        if (occ[i].hitRate < prev - tol) return false;
        prev = occ[i].hitRate;
      }
      return true;
    }
    // Drop the cut whose removal best restores validity, until valid or no cuts remain.
    var guard = 0;
    while (cuts.length && !ok(cuts) && guard++ < 8) {
      var best = null;
      for (var i = 0; i < cuts.length; i++) {
        var cand = cuts.slice(0, i).concat(cuts.slice(i + 1));
        if (best === null && (ok(cand) || cand.length === 0)) best = cand;
      }
      cuts = best !== null ? best : cuts.slice(0, -1);
    }
    return { cuts: cuts, tiers: tiersFor(cuts), monotone: ok(cuts) };
  }

  var api = {
    NAME: NAME,
    DEFAULT_WEIGHTS: DEFAULT_WEIGHTS,
    scoreOf: scoreOf,
    freshnessFromRatio: freshnessFromRatio,
    tierFromCuts: tierFromCuts,
    calibratedRank: calibratedRank,
    calibratedConfidence: calibratedConfidence,
    deriveCuts: deriveCuts,
    quantile: quantile,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof self !== "undefined") self.MuntinCostScore = api;
  if (root) root.MuntinCostScore = api;
})(typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null);
