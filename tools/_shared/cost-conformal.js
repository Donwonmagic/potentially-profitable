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
 * PARITY: mirrored by the Muntin Ledger TS port at
 * packages/cost-alerts/src/cost-conformal.ts — vectors copied verbatim; change
 * the math in one repo, change it in the other in the same commit.
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

  // Interval for the NEXT value, from the last `window` residuals. `scale` widens
  // the residual quantiles (1 = raw); the adaptive-conformal layer searches it so
  // the band actually covers. Returns null when there aren't enough residuals.
  function intervalFromResiduals(last, resid, alpha, window, minResid, scale) {
    var recent = resid.slice(-window);
    if (recent.length < minResid) return null;
    var sc = scale || 1;
    var s = recent.slice().sort(function (a, b) { return a - b; });
    var lo = quantile(s, alpha / 2), hi = quantile(s, 1 - alpha / 2);
    return [last + sc * lo, last + sc * hi];
  }

  // Walk-forward coverage of the (optionally scaled) interval over a series.
  function backtest(v, resid, alpha, window, minResid, scale) {
    var hits = 0, tested = 0;
    for (var t = minResid + 1; t < v.length; t++) {
      var iv = intervalFromResiduals(v[t - 1], resid.slice(0, t - 1), alpha, window, minResid, scale);
      if (!iv) continue;
      tested++;
      if (v[t] >= iv[0] && v[t] <= iv[1]) hits++;
    }
    return { hits: hits, tested: tested };
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
    var nominal = 1 - alpha;

    // Raw band + its walk-forward backtest.
    var raw = backtest(v, resid, alpha, window, minResid, 1);
    var coverage = raw.tested >= minCover ? raw.hits / raw.tested : null;

    // Adaptive (ACI-style) widening: if the raw band under-covers, scale the
    // residual quantiles up by the SMALLEST factor that reaches nominal coverage
    // on the backtest — so the published band is honest per item, not just pooled.
    // (Never narrows below raw; capped so a pathological series can't blow up.)
    var scale = 1;
    if (opts.calibrate && coverage != null && coverage < nominal) {
      for (var f = 1.1; f <= 3.0001; f += 0.1) {
        var bt = backtest(v, resid, alpha, window, minResid, f);
        if (bt.tested && bt.hits / bt.tested >= nominal) { scale = +f.toFixed(1); coverage = +(bt.hits / bt.tested).toFixed(3); break; }
        scale = +f.toFixed(1);   // keep widening to the cap if never reached
      }
    }

    var interval = intervalFromResiduals(last, resid, alpha, window, minResid, scale);
    if (!interval) return null;

    return {
      interval: interval,
      point: last,
      alpha: alpha,
      nominal: +nominal.toFixed(2),
      coverage: coverage == null ? null : +coverage.toFixed(3),
      scale: scale,
      nTested: raw.tested,
      nResid: resid.length,
      window: window,
    };
  }

  var api = { conformalNext: conformalNext, quantile: quantile, residuals: residuals };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinConformal = api;
  if (root) root.MuntinConformal = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
