/**
 * cost-anomaly.js — robust outlier & regime-break detection for a price series.
 *
 * A price-reporting method is only as honest as its handling of a bad print. Hard bounds
 * (observation-quality.js) catch the impossible; this catches the *statistically* anomalous —
 * a point far from its local neighbourhood (Hampel) and a structural level shift (Pettitt) —
 * so a single fat-fingered USDA cell can't silently widen a conformal band or flip a spike
 * verdict. It classifies HISTORICAL prints only: it makes no forward claim and asserts no
 * price, so the "no forecast" promise holds.
 *
 * Two distribution-free detectors, both robust (median/MAD, rank-based), both pure:
 *   - hampel(values)  — rolling median-absolute-deviation filter; flags points > nSigma robust
 *                       sigmas from their centered window.
 *   - pettitt(values) — Pettitt's non-parametric single change-point test; dates the most
 *                       likely regime break and its approximate significance.
 *
 * Thresholds (k, nSigma, alpha) are labeled-illustrative internal calibration, not published
 * facts (same posture as cost-spike.js).
 *
 * PARITY: a TypeScript port (packages/cost-alerts/src/cost-anomaly.ts in the Muntin Ledger
 * repo) follows in a coordinated commit; until the Ledger imports it the module is static-only
 * and not yet a shared contract. When ported, copy the .test.mjs vectors verbatim.
 *
 * Pure, deterministic, integer-friendly, no DOM/network. Browser: window.MuntinAnomaly.
 */
(function (root) {
  'use strict';

  function clean(a) { return (a || []).filter(function (x) { return typeof x === 'number' && isFinite(x); }); }
  // Same median tie-break as cost-reliability.js, so MAD is byte-consistent across the suite.
  function median(a) {
    if (!a.length) return 0;
    var s = a.slice().sort(function (x, y) { return x - y; }), m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function sgn(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }
  function r3(x) { return Math.round(x * 1000) / 1000; }

  /**
   * hampel(values, opts) — rolling robust outlier flag.
   * opts: k (half-window, default 3 → window 2k+1), nSigma (default 3), minWindow (default 3).
   * Returns { flags:[0|1], scores:number[], count, k, nSigma }. A point with too small a
   * window, or a non-finite value, is flag 0 (never a false alarm from thin edges).
   */
  function hampel(values, opts) {
    opts = opts || {};
    var k = opts.k || 3, nSigma = opts.nSigma != null ? opts.nSigma : 3, minWindow = opts.minWindow || 3;
    var v = values || [];
    var flags = [], scores = [];
    for (var i = 0; i < v.length; i++) {
      var lo = Math.max(0, i - k), hi = Math.min(v.length - 1, i + k);
      var win = [];
      for (var j = lo; j <= hi; j++) if (typeof v[j] === 'number' && isFinite(v[j])) win.push(v[j]);
      if (win.length < minWindow || typeof v[i] !== 'number' || !isFinite(v[i])) { flags.push(0); scores.push(0); continue; }
      var med = median(win);
      var mad = median(win.map(function (x) { return Math.abs(x - med); }));
      var s = 1.4826 * mad;
      var score = s > 0 ? Math.abs(v[i] - med) / s : 0;
      scores.push(r3(score));
      flags.push(s > 0 && score > nSigma ? 1 : 0);
    }
    var count = 0; for (var f = 0; f < flags.length; f++) count += flags[f];
    return { flags: flags, scores: scores, count: count, k: k, nSigma: nSigma };
  }

  /**
   * pettitt(values, opts) — non-parametric single change-point (Pettitt 1979).
   * opts: minN (default 12), alpha (default 0.05).
   * U_t = U_{t-1} + sum_j sgn(x_t - x_j); K = max_t |U_t|; the break is argmax_t |U_t|
   * (first regime = v[0..index]). pApprox = 2*exp(-6 K^2 / (n^3 + n^2)), clamped to [0,1].
   * Returns null if fewer than minN finite points.
   */
  function pettitt(values, opts) {
    opts = opts || {};
    var minN = opts.minN || 12, alpha = opts.alpha != null ? opts.alpha : 0.05;
    var v = clean(values), n = v.length;
    if (n < minN) return null;
    var U = 0, bestK = -Infinity, bestIdx = 0;
    for (var t = 0; t < n; t++) {
      var vt = 0;
      for (var j = 0; j < n; j++) vt += sgn(v[t] - v[j]);
      U += vt;
      var a = Math.abs(U);
      if (a > bestK) { bestK = a; bestIdx = t; }
    }
    var K = bestK;
    var pApprox = Math.min(1, 2 * Math.exp(-6 * K * K / (n * n * n + n * n)));
    return { index: bestIdx, K: K, pApprox: r3(pApprox), significant: pApprox <= alpha };
  }

  /**
   * detect(values, opts) — both detectors over one series.
   * Returns { n, hampel:{count,flags,scores}, changePoint: pettitt|null }.
   */
  function detect(values, opts) {
    opts = opts || {};
    var h = hampel(values, opts.hampel || opts);
    var cp = pettitt(values, opts.pettitt || opts);
    return { n: clean(values).length, hampel: { count: h.count, flags: h.flags, scores: h.scores }, changePoint: cp };
  }

  var api = { hampel: hampel, pettitt: pettitt, detect: detect, median: median };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinAnomaly = api;
  if (root) root.MuntinAnomaly = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
