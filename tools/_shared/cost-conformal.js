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
 * walk-forward backtest (at each past step, form the interval from PRIOR residuals
 * and check whether the next actual print fell inside).
 *
 * HONESTY CONTRACT (statistical-rigor audit, 2026-07, finding C1/CRIT-2):
 * `coverage` is ALWAYS the RAW, scale=1 walk-forward hit-rate — the leakage-free
 * number. The earlier build widened the band with the SMALLEST scale whose own
 * backtest reached the nominal target and then reported THAT backtest's hit-rate
 * as `coverage`; the reported number was the fit's stopping condition (a
 * resubstitution / in-sample estimate, mechanically ≥ nominal). We no longer do
 * that. Calibration may still WIDEN the displayed `interval` (option a in the
 * audit), but the reported `coverage` describes the raw band (`rawInterval`) so a
 * card can say "target 80%, held X% of the time" — target and achieved kept
 * separate. Because the walk-forward hit/miss sequence is autocorrelated
 * (overlapping residual windows), a raw hit count overstates the evidence; we
 * report a Wilson interval [coverageLo, coverageHi] on an AR(1)-adjusted effective
 * sample size (`nEff`), not a bare point rate. Degenerate (flat/stale) windows and
 * windows with too few near-independent steps return `coverage: null` so the
 * caller withholds rather than printing "±0%, right 100% of the time".
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
  // the DISPLAYED band can be widened. Returns null when there aren't enough residuals.
  function intervalFromResiduals(last, resid, alpha, window, minResid, scale) {
    var recent = resid.slice(-window);
    if (recent.length < minResid) return null;
    var sc = scale || 1;
    var s = recent.slice().sort(function (a, b) { return a - b; });
    var lo = quantile(s, alpha / 2), hi = quantile(s, 1 - alpha / 2);
    return [last + sc * lo, last + sc * hi];
  }

  // Walk-forward coverage of the (optionally scaled) interval over a series. Also
  // returns the 0/1 hit sequence so the caller can measure the autocorrelation of
  // the hit/miss outcomes (overlapping windows make consecutive tests dependent).
  function backtest(v, resid, alpha, window, minResid, scale) {
    var hits = 0, tested = 0, seq = [];
    for (var t = minResid + 1; t < v.length; t++) {
      var iv = intervalFromResiduals(v[t - 1], resid.slice(0, t - 1), alpha, window, minResid, scale);
      if (!iv) continue;
      tested++;
      var hit = (v[t] >= iv[0] && v[t] <= iv[1]) ? 1 : 0;
      hits += hit; seq.push(hit);
    }
    return { hits: hits, tested: tested, seq: seq };
  }

  // Lag-1 autocorrelation of a 0/1 sequence (0 when undefined / near-constant).
  function lag1Autocorr(seq) {
    var n = seq.length;
    if (n < 3) return 0;
    var mean = 0, i;
    for (i = 0; i < n; i++) mean += seq[i];
    mean /= n;
    var num = 0, den = 0;
    for (i = 0; i < n; i++) { var d = seq[i] - mean; den += d * d; if (i < n - 1) num += d * (seq[i + 1] - mean); }
    if (den <= 0) return 0;
    var r = num / den;
    return r < -0.99 ? -0.99 : r > 0.99 ? 0.99 : r;
  }

  // Effective sample size for an AR(1)-correlated binary series: n_eff = n·(1−r)/(1+r).
  // r ≤ 0 → no penalty (independent or anti-correlated hits are not overstated).
  function effectiveN(n, r) {
    if (n <= 0) return 0;
    if (r <= 0) return n;
    var ne = n * (1 - r) / (1 + r);
    return ne < 1 ? 1 : ne > n ? n : ne;
  }

  // Wilson score interval for a proportion at ~95% (z=1.96), on effective n.
  function wilson(phat, n) {
    if (!(n > 0)) return [null, null];
    var z = 1.96, z2 = z * z;
    var denom = 1 + z2 / n;
    var center = (phat + z2 / (2 * n)) / denom;
    var half = (z * Math.sqrt(phat * (1 - phat) / n + z2 / (4 * n * n))) / denom;
    var lo = center - half, hi = center + half;
    return [lo < 0 ? 0 : lo, hi > 1 ? 1 : hi];
  }

  /**
   * conformalNext(values, opts) — values: chronological numbers (e.g. weekly cents),
   * oldest→newest. Returns null if too short, else:
   *   { interval:[lo,hi], rawInterval:[lo,hi], point, alpha, nominal,
   *     coverage, coverageLo, coverageHi, nEff, scale, nTested, nResid, window,
   *     upPct, downPct, halfWidthPct, degenerate }
   * `coverage` is the RAW (scale=1) walk-forward empirical hit-rate — leakage-free,
   * and the number a card may honestly show as "target {nominal}, held {coverage}".
   * It is null (caller must WITHHOLD) when there are too few near-independent scored
   * steps to state a rate, or the window is degenerate (flat/stale → a ±0% band).
   * `coverageLo/Hi` bound it (Wilson on the AR(1)-adjusted `nEff`), never a bare point.
   * `interval` is the DISPLAYED band (widened if opts.calibrate); `rawInterval` is the
   * scale=1 band that `coverage` actually describes. `upPct/downPct` expose the band's
   * asymmetry around the last print (never collapse to a symmetric ±).
   */
  function conformalNext(values, opts) {
    opts = opts || {};
    var alpha = opts.alpha != null ? opts.alpha : 0.20;          // 80% interval by default
    var window = opts.window || 26;                              // ~6 months of weekly residuals
    var minResid = opts.minResid || 8;                           // need >=8 residuals for quantiles
    var minCover = opts.minCover || 30;                          // need >=30 scored steps to claim a rate
    var minEff = opts.minEff != null ? opts.minEff : 4;          // ...and >=4 near-independent blocks
    var v = clean(values);
    if (v.length < minResid + 2) return null;                    // not enough to predict + backtest

    var resid = residuals(v);
    var last = v[v.length - 1];
    var nominal = 1 - alpha;

    // Raw band + its leakage-free walk-forward backtest. This IS the honesty number.
    var raw = backtest(v, resid, alpha, window, minResid, 1);
    var rawInterval = intervalFromResiduals(last, resid, alpha, window, minResid, 1);
    if (!rawInterval) return null;

    // Degeneracy: a flat/stale window yields a ~zero-width band ("±0%, right 100%").
    // Withhold the coverage claim there — a zero-width band trivially "covers".
    var halfCents = Math.max(rawInterval[1] - last, last - rawInterval[0]);
    var halfWidthPct = last > 0 ? halfCents / last : 0;
    var degenerate = !(last > 0) || halfWidthPct < 0.003;

    // AR(1)-adjusted effective sample size, then a Wilson interval on the raw rate.
    var r1 = lag1Autocorr(raw.seq);
    var nEff = effectiveN(raw.tested, r1);
    var pointRate = raw.tested > 0 ? raw.hits / raw.tested : null;
    var publishable = pointRate != null && raw.tested >= minCover && nEff >= minEff && !degenerate;
    var coverage = publishable ? pointRate : null;
    var ci = publishable ? wilson(pointRate, nEff) : [null, null];

    // Adaptive (ACI-style) widening of the DISPLAYED band only — never changes the
    // reported `coverage`. Kept so a caller may show a band wider than raw while the
    // honesty number stays the leakage-free raw rate (audit option a).
    var scale = 1;
    if (opts.calibrate && pointRate != null && pointRate < nominal) {
      for (var f = 1.1; f <= 3.0001; f += 0.1) {
        var bt = backtest(v, resid, alpha, window, minResid, f);
        scale = +f.toFixed(1);
        if (bt.tested && bt.hits / bt.tested >= nominal) break;
      }
    }

    var interval = scale === 1 ? rawInterval : intervalFromResiduals(last, resid, alpha, window, minResid, scale);
    if (!interval) return null;

    return {
      interval: interval,
      rawInterval: rawInterval,
      point: last,
      alpha: alpha,
      nominal: +nominal.toFixed(2),
      coverage: coverage == null ? null : +coverage.toFixed(3),
      coverageLo: ci[0] == null ? null : +ci[0].toFixed(3),
      coverageHi: ci[1] == null ? null : +ci[1].toFixed(3),
      nEff: +nEff.toFixed(1),
      scale: scale,
      nTested: raw.tested,
      nResid: resid.length,
      window: window,
      upPct: last > 0 ? +((rawInterval[1] - last) / last).toFixed(4) : null,
      downPct: last > 0 ? +((last - rawInterval[0]) / last).toFixed(4) : null,
      halfWidthPct: +halfWidthPct.toFixed(4),
      degenerate: degenerate,
    };
  }

  var api = { conformalNext: conformalNext, quantile: quantile, residuals: residuals, wilson: wilson };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinConformal = api;
  if (root) root.MuntinConformal = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
