/* Pressure calibration math — the honest backtest core.
 *
 * Pure, deterministic, spreadsheet-checkable functions that take an indicator's
 * long history + a price-proxy's long history and report the REAL lead/lag, sign,
 * and predictive strength — so hand-set weights can be replaced by evidence
 * instead of guesswork. It estimates; it never auto-applies. A human reviews the
 * report and edits data/pressure-rules.json with a _version bump.
 *
 * The guardrails (per the methodology review) are baked in, because the project's
 * zero-fabrication canon means a spurious correlation is a fabrication:
 *   - stationary CHANGES only (never correlate trending levels)
 *   - month-deseasonalize (or you "discover" the calendar)
 *   - publication-lag alignment is the caller's job (pass already-lagged dates)
 *   - lag scan 0..maxLag, pick one best lag, then FREEZE it
 *   - Newey-West (HAC) standard errors (weekly/monthly residuals autocorrelate)
 *   - N>=minN gate, else "insufficient evidence, keep prior"
 *   - walk-forward out-of-sample sign check
 *   - Benjamini-Hochberg FDR across all tested edges (you test many → control it)
 *   - weight shrunk toward zero by out-of-sample R2, then capped
 *
 * Node: require('tools/_shared/pressure-calibrate.js'). No DOM, no network.
 */
(function (root) {
  'use strict';

  function num(v) { return typeof v === 'number' && isFinite(v) ? v : null; }

  // ---- stationary transforms ----------------------------------------
  // k-step percent change of a value series. Returns {idx, v} so the caller can
  // realign to dates. Skips non-positive bases (pct change undefined).
  function pctChange(values, k) {
    k = k || 1; var out = [];
    for (var i = k; i < values.length; i++) {
      var a = num(values[i - k]), b = num(values[i]);
      if (a == null || b == null || a === 0) continue;
      out.push({ idx: i, v: (b - a) / Math.abs(a) });
    }
    return out;
  }

  // Subtract the calendar-MONTH mean from a change series so a recurring seasonal
  // swing can't masquerade as a leading signal. months[i] is 0..11 for change[i].
  function deseasonalizeByMonth(changes, months) {
    var sum = {}, cnt = {};
    for (var i = 0; i < changes.length; i++) {
      var m = months[i]; if (m == null) continue;
      sum[m] = (sum[m] || 0) + changes[i]; cnt[m] = (cnt[m] || 0) + 1;
    }
    var mean = {}; for (var k in sum) mean[k] = sum[k] / cnt[k];
    return changes.map(function (c, i) { var m = months[i]; return m != null && cnt[m] >= 2 ? c - mean[m] : c; });
  }

  // ---- correlation + regression -------------------------------------
  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : 0; }
  function pearson(x, y) {
    var n = Math.min(x.length, y.length); if (n < 3) return { r: null, n: n };
    var mx = mean(x), my = mean(y), sxy = 0, sxx = 0, syy = 0;
    for (var i = 0; i < n; i++) { var dx = x[i] - mx, dy = y[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
    if (sxx === 0 || syy === 0) return { r: null, n: n };
    return { r: sxy / Math.sqrt(sxx * syy), n: n };
  }

  // OLS slope of y on x, plus Newey-West (HAC) standard error on the slope. HAC
  // lag defaults to the Newey-West rule ~floor(4*(n/100)^(2/9)). Returns
  // {beta, se, t, p, n, r2} with a two-sided normal-approx p (fine for n>=40).
  function olsHAC(x, y, L) {
    var n = Math.min(x.length, y.length); if (n < 5) return null;
    var mx = mean(x.slice(0, n)), my = mean(y.slice(0, n));
    var sxx = 0, sxy = 0, i, dx;
    for (i = 0; i < n; i++) { dx = x[i] - mx; sxx += dx * dx; sxy += dx * (y[i] - my); }
    if (sxx === 0) return null;
    var beta = sxy / sxx, alpha = my - beta * mx;
    var u = [], sse = 0, sst = 0;
    for (i = 0; i < n; i++) { var e = y[i] - (alpha + beta * x[i]); u.push(e); sse += e * e; sst += (y[i] - my) * (y[i] - my); }
    var r2 = sst === 0 ? 0 : 1 - sse / sst;
    if (L == null) L = Math.max(1, Math.floor(4 * Math.pow(n / 100, 2 / 9)));
    // HAC meat: S = Σ w_l * Σ (x_t-mx)(x_{t-l}-mx) u_t u_{t-l}, Bartlett weights.
    var xc = x.slice(0, n).map(function (v) { return v - mx; });
    var S = 0;
    for (i = 0; i < n; i++) S += xc[i] * xc[i] * u[i] * u[i];
    for (var l = 1; l <= L; l++) {
      var w = 1 - l / (L + 1), g = 0;
      for (i = l; i < n; i++) g += xc[i] * xc[i - l] * u[i] * u[i - l];
      S += 2 * w * g;
    }
    var varBeta = S / (sxx * sxx);
    var se = Math.sqrt(Math.max(varBeta, 0));
    var t = se > 0 ? beta / se : 0;
    var p = 2 * (1 - normCdf(Math.abs(t)));
    return { beta: beta, se: se, t: t, p: p, n: n, r2: r2 };
  }

  // Abramowitz-Stegun 26.2.17 normal CDF (max error ~7.5e-8) — keeps p-values
  // dependency-free and reproducible.
  function normCdf(z) {
    var s = z < 0 ? -1 : 1; z = Math.abs(z) / Math.SQRT2;
    var t = 1 / (1 + 0.3275911 * z);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
    return 0.5 * (1 + s * y);
  }

  // ---- lag scan -----------------------------------------------------
  // x leads y by `lag`: pair x[t] with y[t+lag]. Scans 0..maxLag, returns each
  // {lag, r, n} and the |r|-best one with N>=minN.
  function lagScan(x, y, maxLag, minN) {
    maxLag = maxLag || 12; minN = minN || 8;
    var scans = [], best = null;
    for (var lag = 0; lag <= maxLag; lag++) {
      var xs = [], ys = [];
      for (var t = 0; t + lag < Math.min(x.length, y.length); t++) { xs.push(x[t]); ys.push(y[t + lag]); }
      var pc = pearson(xs, ys);
      var rec = { lag: lag, r: pc.r, n: pc.n };
      scans.push(rec);
      if (pc.r != null && pc.n >= minN && (best == null || Math.abs(pc.r) > Math.abs(best.r))) best = rec;
    }
    return { scans: scans, best: best };
  }

  // ---- walk-forward OOS sign check ----------------------------------
  // Fit the lead relationship on the first `trainFrac` of the (lag-aligned) pairs,
  // then require the correlation SIGN to hold on the held-out tail. Returns
  // {pass, oosR, oosN, trainR}. A pair that only works in-sample fails.
  function walkForward(x, y, lag, trainFrac) {
    trainFrac = trainFrac || 0.7;
    var xs = [], ys = [];
    for (var t = 0; t + lag < Math.min(x.length, y.length); t++) { xs.push(x[t]); ys.push(y[t + lag]); }
    var n = xs.length, cut = Math.floor(n * trainFrac);
    if (cut < 5 || n - cut < 5) return { pass: false, oosR: null, oosN: n - cut, trainR: null };
    var tr = pearson(xs.slice(0, cut), ys.slice(0, cut));
    var te = pearson(xs.slice(cut), ys.slice(cut));
    var pass = tr.r != null && te.r != null && Math.sign(tr.r) === Math.sign(te.r) && Math.abs(te.r) > 0.05;
    return { pass: pass, oosR: te.r, oosN: n - cut, trainR: tr.r };
  }

  // ---- Benjamini-Hochberg FDR ---------------------------------------
  // edges: [{p, ...}]. Returns the same objects with .bhPass set at FDR q.
  function benjaminiHochberg(edges, q) {
    q = q || 0.10;
    var withP = edges.filter(function (e) { return typeof e.p === 'number' && isFinite(e.p); });
    var sorted = withP.slice().sort(function (a, b) { return a.p - b.p; });
    var m = sorted.length, kMax = 0;
    for (var i = 0; i < m; i++) if (sorted[i].p <= ((i + 1) / m) * q) kMax = i + 1;
    var thresh = kMax > 0 ? sorted[kMax - 1].p : -1;
    edges.forEach(function (e) { e.bhPass = (typeof e.p === 'number' && e.p <= thresh); });
    return { edges: edges, thresh: thresh, nPass: kMax, m: m };
  }

  // ---- the honest pipeline for one indicator→price edge -------------
  // Defends against the two traps a naive scan creates:
  //   (1) lag-shopping inflates significance → the in-sample p is Bonferroni-
  //       adjusted by the number of lags searched (p_adj = min(1, p*(maxLag+1))).
  //   (2) choosing the lag on the full series leaks into the OOS test → the lag
  //       is frozen on the TRAIN window only, then the sign is required to hold on
  //       the never-touched holdout.
  // x, y are stationary CHANGE series (deseasonalize first). Returns a verdict
  // object; the caller runs benjaminiHochberg over the .p of all edges, then
  // includes only edges with bhPass && oosPass && n>=minN.
  function calibrateEdge(x, y, opts) {
    opts = opts || {};
    var maxLag = opts.maxLag || 12, minN = opts.minN || 40, trainFrac = opts.trainFrac || 0.7;
    var nFull = Math.min(x.length, y.length);
    var cut = Math.floor(nFull * trainFrac);
    if (cut < 10 || nFull - cut < 8) return { ok: false, reason: 'too few points', n: nFull };
    // lag frozen on TRAIN only
    var scan = lagScan(x.slice(0, cut), y.slice(0, cut), maxLag, Math.max(8, Math.floor(minN * trainFrac * 0.3)));
    if (!scan.best) return { ok: false, reason: 'no lag with enough train N', n: cut };
    var lag = scan.best.lag;
    // regress on train at the frozen lag (HAC), adjust p for the lag search
    var trX = [], trY = [], i;
    for (i = 0; i + lag < cut; i++) { trX.push(x[i]); trY.push(y[i + lag]); }
    var reg = olsHAC(trX, trY);
    if (!reg) return { ok: false, reason: 'train regression failed', n: trX.length };
    var pAdj = Math.min(1, reg.p * (maxLag + 1));
    // out-of-sample: same lag, holdout pairs only
    var teX = [], teY = [];
    for (i = cut; i + lag < nFull; i++) { teX.push(x[i]); teY.push(y[i + lag]); }
    var oos = pearson(teX, teY);
    var oosPass = oos.r != null && Math.sign(oos.r) === Math.sign(reg.beta) && Math.abs(oos.r) > 0.05;
    var nEff = trX.length;
    return {
      ok: true, lag: lag, sign: reg.beta >= 0 ? 1 : -1, beta: reg.beta,
      trainR: scan.best.r, p: pAdj, pRaw: reg.p, n: nEff, oosR: oos.r, oosN: oos.n,
      oosPass: oosPass, enoughN: nEff >= minN, minN: minN
    };
  }

  // ---- weight suggestion --------------------------------------------
  // A validated edge → a shrunk, capped weight. Shrink toward zero by OOS R2 so we
  // never adopt the in-sample max; cap at maxW. Returns 0 if it didn't earn it.
  function suggestWeight(edge, maxW) {
    maxW = maxW || 3;
    if (!edge || !edge.bhPass || !edge.oosPass || edge.n < (edge.minN || 40)) return 0;
    var oosR2 = edge.oosR != null ? edge.oosR * edge.oosR : 0;
    return Math.max(0, Math.min(maxW, Math.round(maxW * oosR2 * 10) / 10));
  }

  // ---- sign-constrained weight fitting (NNLS) -----------------------
  // Fit weights so the panel best predicts the target, but FORCE each indicator's
  // weight to keep its economic sign — the sign constraint IS the regularization
  // (nothing to overfit), and the output is fixed coefficients a reader re-multiplies.
  // Solves min ||Xw − y||² s.t. signs·w ≥ 0 by flipping each column to its expected
  // sign, running non-negative least squares (exact coordinate descent on the normal
  // equations — convex, converges), then restoring signs. Optionally sum-to-one so
  // weights read as shares.
  function nnlsFit(X, y, signs, opts) {
    opts = opts || {};
    var m = X.length; if (!m) return null;
    var n = X[0].length;
    signs = signs || []; for (var s = 0; s < n; s++) if (signs[s] !== -1) signs[s] = 1;
    // Flip columns to expected sign so a correctly-signed relationship → positive coef.
    var G = [], c = [], i, j, k;
    for (j = 0; j < n; j++) { G.push(new Array(n).fill(0)); c.push(0); }
    for (i = 0; i < m; i++) {
      for (j = 0; j < n; j++) {
        var xij = X[i][j] * signs[j];
        c[j] += xij * y[i];
        for (k = 0; k < n; k++) G[j][k] += xij * (X[i][k] * signs[k]);
      }
    }
    var w = new Array(n).fill(0);
    for (var it = 0; it < (opts.maxIter || 500); it++) {
      var maxd = 0;
      for (j = 0; j < n; j++) {
        if (G[j][j] <= 1e-12) continue;
        var dot = 0; for (k = 0; k < n; k++) if (k !== j) dot += G[j][k] * w[k];
        var wj = Math.max(0, (c[j] - dot) / G[j][j]);
        maxd = Math.max(maxd, Math.abs(wj - w[j])); w[j] = wj;
      }
      if (maxd < 1e-10) break;
    }
    var mag = w.slice();                                  // non-negative magnitudes
    var sum = mag.reduce(function (a, b) { return a + b; }, 0);
    var weights = mag.map(function (v, idx) { return (opts.sumToOne && sum > 0 ? v / sum : v) * signs[idx]; });
    // R² on the fit
    var my = mean(y), sse = 0, sst = 0;
    for (i = 0; i < m; i++) { var pred = 0; for (j = 0; j < n; j++) pred += X[i][j] * weights[j] * (opts.sumToOne ? 1 : 1); sse += (y[i] - pred) * (y[i] - pred); sst += (y[i] - my) * (y[i] - my); }
    return { weights: weights, magnitudes: mag, r2: sst === 0 ? 0 : 1 - sse / sst, sumToOne: !!opts.sumToOne };
  }

  // Equal-weight combination — the benchmark a fitted scheme must beat out-of-sample
  // (the "forecast combination puzzle": equal weights often win on short noisy data).
  function equalWeightPredict(X, signs) {
    signs = signs || [];
    return X.map(function (row) { var s = 0; for (var j = 0; j < row.length; j++) s += row[j] * (signs[j] === -1 ? -1 : 1); return s / (row.length || 1); });
  }

  var api = {
    pctChange: pctChange, deseasonalizeByMonth: deseasonalizeByMonth,
    pearson: pearson, olsHAC: olsHAC, normCdf: normCdf,
    lagScan: lagScan, walkForward: walkForward, calibrateEdge: calibrateEdge,
    benjaminiHochberg: benjaminiHochberg, suggestWeight: suggestWeight,
    nnlsFit: nnlsFit, equalWeightPredict: equalWeightPredict
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MuntinPressureCalibrate = api;
})(typeof self !== 'undefined' ? self : null);
