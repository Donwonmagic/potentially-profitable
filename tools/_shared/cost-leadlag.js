/**
 * Muntin — lead-lag analyzer (the "why" engine).
 *
 * The historical research (docs/plans/muntin-cost-history.md) found that
 * feed-grain (corn/soybean) costs LEAD retail protein prices by a real,
 * biology-driven lag (~10 weeks chicken → ~30 months beef, USDA ERS), while
 * diesel/freight mostly moves ALONGSIDE food (coincident, common-cause). This
 * turns the index from a price ticker into something explanatory: "your protein
 * cost is rising partly because feed-grain rose N periods ago."
 *
 * THE HARD RULE: this reports ASSOCIATION WITH A LAG, never causation. The copy
 * always says "has tended to move before" / "moves alongside", never "causes".
 *
 * Pure, deterministic, no network, no LLM. Browser: window.MuntinLeadLag.
 * Node: module.exports.
 */
(function (root) {
  'use strict';

  function mean(a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; }

  /** Pearson correlation of two equal-length numeric arrays, or null. */
  function pearson(x, y) {
    var n = Math.min(x.length, y.length);
    if (n < 2) return null;
    var mx = mean(x.slice(0, n)), my = mean(y.slice(0, n));
    var sxy = 0, sxx = 0, syy = 0;
    for (var i = 0; i < n; i++) { var dx = x[i] - mx, dy = y[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
    if (sxx === 0 || syy === 0) return null;
    return sxy / Math.sqrt(sxx * syy);
  }

  /**
   * bestLag(leader, follower, opts) — at what lag does `leader` best track
   * `follower`? Both are equal-cadence numeric series, oldest→newest (caller
   * resamples to a common cadence first). Tests lags 0..maxLag where leader[t]
   * is compared to follower[t+lag]; returns the lag maximizing |correlation|,
   * requiring ≥ minOverlap aligned points. Returns null when there's too little
   * overlap to say anything (the honest default — no spurious lag).
   */
  function bestLag(leader, follower, opts) {
    opts = opts || {};
    var maxLag = opts.maxLag != null ? opts.maxLag : 6;
    var minOverlap = opts.minOverlap != null ? opts.minOverlap : 8;
    var best = null;
    for (var lag = 0; lag <= maxLag; lag++) {
      var L = [], Fo = [];
      for (var t = 0; t < leader.length && t + lag < follower.length; t++) { L.push(leader[t]); Fo.push(follower[t + lag]); }
      if (L.length < minOverlap) continue;
      var r = pearson(L, Fo);
      if (r == null) continue;
      if (!best || Math.abs(r) > Math.abs(best.corr)) best = { lag: lag, corr: +r.toFixed(3), n: L.length };
    }
    return best;
  }

  /**
   * Honest framing — association with a lag, NEVER causation. Below a weak-
   * correlation floor it says there's no clear lead yet (rather than over-read
   * noise). periodLabel is the cadence word ("weeks"/"months").
   */
  function framing(res, leaderName, followerName, periodLabel) {
    var L = leaderName || 'this input', F = followerName || 'this cost', P = periodLabel || 'periods';
    if (!res || Math.abs(res.corr) < 0.3) return L + ' shows no clear lead on ' + F + ' in the data yet.';
    var strength = Math.abs(res.corr) >= 0.6 ? 'strongly' : 'modestly';
    var inv = res.corr < 0 ? 'inversely ' : '';
    if (res.lag === 0) return L + ' has tended to move alongside ' + F + ' (' + strength + ', ' + inv + 'r=' + res.corr + ') — an association, not a proven cause.';
    return L + ' has tended to ' + inv + 'move ~' + res.lag + ' ' + P + ' before ' + F + ' (' + strength + ', r=' + res.corr + ') — an association with a lag, not a proven cause.';
  }

  var api = { pearson: pearson, bestLag: bestLag, framing: framing };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinLeadLag = api;
  if (root) root.MuntinLeadLag = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
