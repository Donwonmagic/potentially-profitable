/**
 * cost-cointegration.js — the rigorous Stability gate for the ratio bridge.
 *
 * The methodology's bridge guard #2 ("a drifting or noisy ratio yields absent") was
 * qualitative. This makes it a test: a derived dollar level may be published from an
 * outside series ONLY when the two series are COINTEGRATED — a statistically real,
 * mean-reverting long-run relationship — not merely correlated. Two independent
 * random walks correlate ~0.9 by accident (the spurious-regression trap); a bridge
 * built on that is a fabrication with a confidence band. Engle–Granger catches it:
 * regress the level on the source, then test the residual for a unit root (ADF). If
 * the residual mean-reverts, the relationship holds and its scatter IS the honest
 * band (guard #3); if it wanders, the bridge is absent.
 *
 *   adf(series, opts)            -> { stat, gamma, halfLife, n }      (unit-root t-test)
 *   engleGranger(y, x, opts)     -> { cointegrated, adfStat, crit, alpha, beta, residSd, halfLife, n }
 *   bridgeFit(y, x, opts)        -> rigorous verdict + predict(xNow) -> { level, band }
 *
 * Pure, deterministic, no DOM/network. Browser: window.MuntinCointegration.
 */
(function (root) {
  'use strict';

  function clean(a) { return (a || []).filter(function (x) { return typeof x === 'number' && isFinite(x); }); }
  function mean(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : 0; }
  function sd(a) { if (a.length < 2) return 0; var m = mean(a), s = 0, i; for (i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return Math.sqrt(s / (a.length - 1)); }
  function diff(s) { var o = [], i; for (i = 1; i < s.length; i++) o.push(s[i] - s[i - 1]); return o; }

  // Multivariate OLS by normal equations. rows: n×k design matrix (caller adds any
  // intercept column); y: length n. Returns coefficients, residuals, and the t-stat
  // of each coefficient. Solves (X'X) b = X'y via Gauss–Jordan (k is tiny: 2–6).
  function ols(rows, y) {
    var n = rows.length, k = rows[0].length, i, j, l;
    var XtX = []; for (i = 0; i < k; i++) { XtX[i] = []; for (j = 0; j < k; j++) XtX[i][j] = 0; }
    var Xty = []; for (i = 0; i < k; i++) Xty[i] = 0;
    for (i = 0; i < n; i++) for (j = 0; j < k; j++) {
      Xty[j] += rows[i][j] * y[i];
      for (l = 0; l < k; l++) XtX[j][l] += rows[i][j] * rows[i][l];
    }
    // Augmented [XtX | I] → reduced row echelon → inverse.
    var A = []; for (i = 0; i < k; i++) { A[i] = XtX[i].slice(); for (j = 0; j < k; j++) A[i].push(i === j ? 1 : 0); }
    for (i = 0; i < k; i++) {
      var piv = A[i][i];
      if (Math.abs(piv) < 1e-12) {                       // pivot via row swap
        var sw = -1; for (l = i + 1; l < k; l++) if (Math.abs(A[l][i]) > 1e-12) { sw = l; break; }
        if (sw < 0) return null;                         // singular → no fit
        var tmp = A[i]; A[i] = A[sw]; A[sw] = tmp; piv = A[i][i];
      }
      for (j = 0; j < 2 * k; j++) A[i][j] /= piv;
      for (l = 0; l < k; l++) if (l !== i) { var f = A[l][i]; for (j = 0; j < 2 * k; j++) A[l][j] -= f * A[i][j]; }
    }
    var inv = []; for (i = 0; i < k; i++) inv[i] = A[i].slice(k);
    var beta = []; for (i = 0; i < k; i++) { var b = 0; for (j = 0; j < k; j++) b += inv[i][j] * Xty[j]; beta[i] = b; }
    var resid = [], ssr = 0;
    for (i = 0; i < n; i++) { var yh = 0; for (j = 0; j < k; j++) yh += rows[i][j] * beta[j]; var e = y[i] - yh; resid.push(e); ssr += e * e; }
    var dof = n - k; var sigma2 = dof > 0 ? ssr / dof : 0;
    var se = [], t = [];
    for (i = 0; i < k; i++) { var v = sigma2 * inv[i][i]; se[i] = v > 0 ? Math.sqrt(v) : 0; t[i] = se[i] > 0 ? beta[i] / se[i] : 0; }
    return { beta: beta, se: se, t: t, resid: resid, n: n, k: k };
  }

  // Augmented Dickey–Fuller. regression 'c' includes a constant, 'nc' none (for
  // cointegrating residuals, which are mean-zero). Δs_t = [c +] γ·s_{t-1} + Σ δ_i Δs_{t-i}.
  // The ADF statistic is the t-ratio on γ; more negative = stronger evidence against a unit root.
  function adf(series, opts) {
    opts = opts || {};
    var reg = opts.regression || 'c';
    var s = clean(series);
    var p = opts.lags != null ? opts.lags : Math.min(8, Math.max(1, Math.floor(Math.pow(s.length, 1 / 3))));
    if (s.length < p + 6) return null;
    var ds = diff(s);                                    // Δs, length s.length-1
    var rows = [], ys = [];
    for (var t = p; t < ds.length; t++) {
      var row = [];
      if (reg === 'c') row.push(1);
      row.push(s[t]);                                    // s_{t-1} relative to Δs_t = ds[t] (ds[t]=s[t+1]-s[t])
      for (var i = 1; i <= p; i++) row.push(ds[t - i]);
      rows.push(row); ys.push(ds[t]);
    }
    if (rows.length < row.length + 2) return null;
    var fit = ols(rows, ys);
    if (!fit) return null;
    var gi = reg === 'c' ? 1 : 0;                        // index of γ (s_{t-1})
    var gamma = fit.beta[gi], stat = fit.t[gi];
    var rho = 1 + gamma;
    var halfLife = (rho > 0 && rho < 1) ? Math.log(0.5) / Math.log(rho) : null;
    return { stat: stat, gamma: gamma, halfLife: halfLife, lags: p, n: fit.n };
  }

  // Engle–Granger critical values for the residual ADF, 1 cointegrating regressor,
  // no trend (MacKinnon asymptotic). More negative than plain DF because β is estimated.
  var EG_CRIT = { '1%': -3.90, '5%': -3.34, '10%': -3.04 };

  function engleGranger(y, x, opts) {
    opts = opts || {};
    var yy = clean(y), xx = clean(x);
    var n = Math.min(yy.length, xx.length);
    if (n < (opts.minN || 24)) return { cointegrated: false, reason: 'too few overlap points', n: n };
    yy = yy.slice(yy.length - n); xx = xx.slice(xx.length - n);
    var fit = ols(xx.map(function (xi) { return [1, xi]; }), yy);   // y = α + βx
    if (!fit) return { cointegrated: false, reason: 'regression failed', n: n };
    var a = adf(fit.resid, { regression: 'nc', lags: opts.lags });
    if (!a) return { cointegrated: false, reason: 'adf failed', n: n };
    var crit = EG_CRIT[opts.level || '5%'];
    return {
      cointegrated: a.stat < crit,
      adfStat: +a.stat.toFixed(3), crit: crit,
      alpha: fit.beta[0], beta: fit.beta[1],
      residSd: +sd(fit.resid).toFixed(4), halfLife: a.halfLife != null ? +a.halfLife.toFixed(1) : null,
      n: n,
    };
  }

  /**
   * bridgeFit(y, x, opts) — the rigorous bridge verdict. y/x are aligned LEVEL series
   * on their overlap (oldest→newest). Publishes only when cointegrated. predict(xNow)
   * returns the derived level and a band = ±z·(residual scatter) — guard #3, the
   * relationship's own error, so a loose bridge reads wide and honest.
   */
  function bridgeFit(y, x, opts) {
    opts = opts || {};
    var eg = engleGranger(y, x, opts);
    var z = opts.z != null ? opts.z : 1.28;              // ~80% band by default
    var ok = !!eg.cointegrated;
    return {
      ok: ok,
      reason: ok ? 'cointegrated' : (eg.reason || 'not cointegrated'),
      adfStat: eg.adfStat, crit: eg.crit, alpha: eg.alpha, beta: eg.beta,
      residSd: eg.residSd, halfLife: eg.halfLife, n: eg.n,
      predict: function (xNow) {
        if (!ok || typeof xNow !== 'number') return null;
        var level = eg.alpha + eg.beta * xNow;
        return { level: level, band: [level - z * eg.residSd, level + z * eg.residSd] };
      },
    };
  }

  var api = { ols: ols, adf: adf, engleGranger: engleGranger, bridgeFit: bridgeFit, EG_CRIT: EG_CRIT, sd: sd };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinCointegration = api;
  if (root) root.MuntinCointegration = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
