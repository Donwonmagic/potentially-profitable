/**
 * cost-conformal.js — honest, coverage-VALIDATED prediction intervals for the
 * Cost Index. The published "band" must answer "where will the next print land?"
 * and be CHECKED against what prices actually did — not just describe how much
 * markets disagree today (that's the methodology-review finding: descriptive
 * spread is a decoration, not an interval).
 *
 * Method: split/EnbPI-style conformal interval on a chronological price series
 * with a random-walk (last-value) predictor — distribution-free, no Gaussian
 * assumption, so it captures asymmetric ("rockets-and-feathers") moves. The band
 * is the empirical quantiles of recent one-step residuals; the COVERAGE is a
 * walk-forward backtest (at each past step, form the interval from prior residuals
 * and check whether the next actual print fell inside). That backtest is what lets
 * a card say "our 80% band has covered 79% of the last N prints" — a verified
 * statement, the property that out-reasons a single-source quote.
 *
 * Pure, deterministic, integer-friendly, no DOM/network.  Browser: window.MuntinConformal.
 */
(function (root) {
  'use strict';

  function clean(arr) {
    return (arr || []).filter(function (x) { return typeof x === 'number' && isFinite(x); });
  }
  function quantile(sortedAsc, p) {
    var n = sortedAsc.length;
    if (!n) return 0;
    if (n === 1) return sortedAsc[0];
    var idx = (n - 1) * p, lo = Math.floor(idx), hi = Math.ceil(idx);
    if (lo === hi) return sortedAsc[lo];
    return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo);
  }

  // One-step residuals of a random-walk predictor: e_t = v[t] - v[t-1].
  function residuals(values) {
    var e = [];
    for (var i = 1; i < values.length; i++) e.push(values[i] - values[i - 1]);
    return e;
  }

  // Interval for the NEXT value, from the last `window` residuals.
  // Returns null when there aren't enough residuals to form honest quantiles.
  function intervalFromResiduals(last, resid, alpha, window, minResid) {
    var recent = resid.slice(-window);
    if (recent.length < minResid) return null;
    var s = recent.slice().sort(function (a, b) { return a - b; });
    var lo = quantile(s, alpha / 2), hi = quantile(s, 1 - alpha / 2);
    return [last + lo, last + hi];
  }

  /**
   * conformalNext(values, opts) — values: chronological numbers (e.g. weekly cents),
   * oldest→newest. Returns null if too short, else:
   *   { interval:[lo,hi], point, alpha, nominal, coverage, nTested, nResid, window }
   * coverage is the walk-forward empirical hit-rate of the nominal interval — the
   * number that makes the band honest. `coverage` is null when nTested is too small
   * to state a rate (caller should label it "provisional").
   */
  function conformalNext(values, opts) {
    opts = opts || {};
    var alpha = opts.alpha != null ? opts.alpha : 0.20;          // 80% interval by default
    var window = opts.window || 26;                              // ~6 months of weekly residuals
    var minResid = opts.minResid || 8;                           // need >=8 residuals for quantiles
    var minCover = opts.minCover || 12;                          // need >=12 scored steps to claim a rate
    var v = clean(values);
    if (v.length < minResid + 2) return null;                    // not enough to predict + backtest

    var resid = residuals(v);
    var last = v[v.length - 1];
    var interval = intervalFromResiduals(last, resid, alpha, window, minResid);
    if (!interval) return null;

    // Walk-forward coverage backtest: for each step t after warmup, build the
    // interval from residuals strictly BEFORE t and check whether v[t] fell inside.
    var hits = 0, tested = 0;
    for (var t = minResid + 1; t < v.length; t++) {
      var priorResid = resid.slice(0, t - 1);                    // residuals up to v[t-1]
      var iv = intervalFromResiduals(v[t - 1], priorResid, alpha, window, minResid);
      if (!iv) continue;
      tested++;
      if (v[t] >= iv[0] && v[t] <= iv[1]) hits++;
    }
    var coverage = tested >= minCover ? hits / tested : null;

    return {
      interval: interval,
      point: last,
      alpha: alpha,
      nominal: +(1 - alpha).toFixed(2),
      coverage: coverage == null ? null : +coverage.toFixed(3),
      nTested: tested,
      nResid: resid.length,
      window: window,
    };
  }

  var api = { conformalNext: conformalNext, quantile: quantile, residuals: residuals };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinConformal = api;
  if (root) root.MuntinConformal = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
