/**
 * cost-reliability.js — does the trend arrow's CONFIDENCE earn its keep? The band
 * gate proves "where will it land"; this proves "which way, and is a stronger call
 * actually right more often?" — the reliability-diagram half of calibration.
 *
 * It replays a price-only direction call over a series: a robust recent drift
 * (median of the last k weekly changes) gives the DIRECTION, and that drift's
 * signal-to-noise ratio gives a STRENGTH. Walking forward, each directional call
 * is scored against the next realized move, then bucketed by strength. If the
 * arrow is calibrated, higher-strength buckets hit more often — and the whole
 * thing must beat the no-skill majority-class baseline, or the arrow is theater.
 *
 * Honest by construction: a near-random-walk series will show flat reliability at
 * ~baseline — that's a true finding (the arrow should be humble), not a bug.
 *
 * PARITY: mirrored by the Muntin Ledger TS port at
 * ledger-spec/cost-index/src/cost-reliability.ts — vectors copied verbatim; change
 * the math in one repo, change it in the other in the same commit.
 *
 * Pure, deterministic, no DOM/network. Browser: window.MuntinReliability.
 */
(function (root) {
  'use strict';

  function clean(a) { return (a || []).filter(function (x) { return typeof x === 'number' && isFinite(x); }); }
  function changes(v) { var o = []; for (var i = 1; i < v.length; i++) o.push(v[i] - v[i - 1]); return o; }
  function median(a) {
    if (!a.length) return 0;
    var s = a.slice().sort(function (x, y) { return x - y; }), m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function robustSd(a) { var m = median(a); return 1.4826 * median(a.map(function (x) { return Math.abs(x - m); })); }
  function sgn(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }

  // Direction call from a prefix (oldest→newest): robust drift + signal-to-noise.
  // Returns null if too short; dir 0 = "flat / no call" (drift inside the deadband).
  function directionCall(prefix, opts) {
    opts = opts || {};
    var k = opts.k || 8;
    var v = clean(prefix);
    if (v.length < k + 2) return null;
    var recent = changes(v).slice(-k);
    var drift = median(recent);
    var sd = robustSd(recent) || 1;
    var dead = (opts.deadFrac != null ? opts.deadFrac : 0.25) * sd;
    var strength = Math.min(1, Math.abs(drift) / (sd + 1e-9));
    return { dir: Math.abs(drift) > dead ? sgn(drift) : 0, strength: strength, drift: drift, noise: sd };
  }

  function tierOf(strength, edges) {
    for (var i = 0; i < edges.length; i++) if (strength < edges[i]) return i;
    return edges.length;          // top tier
  }

  /**
   * reliabilityCurve(series, opts) → null if too short, else:
   *   { tiers:[{tier,label,n,hits,hitRate}], n, hits, hitRate, baseline, lift, skill, pushes }
   * Flat-realized weeks (often a carried-over print) are PUSHES — excluded from the
   * directional hit-rate denominator, exactly as the majority-class baseline is, so
   * the comparison is apples-to-apples. baseline = majority-class rate over non-flat
   * moves; skill = hitRate > baseline + margin. tiers are low→high strength.
   */
  function reliabilityCurve(series, opts) {
    opts = opts || {};
    var k = opts.k || 8;
    var edges = opts.edges || [0.34, 0.67];          // strength cut-points → low / med / high
    var labels = opts.labels || ['low', 'medium', 'high'];
    var v = clean(series);
    if (v.length < k + 4) return null;

    var rows = labels.map(function (l, i) { return { tier: i, label: l, n: 0, hits: 0 }; });
    var n = 0, hits = 0, up = 0, down = 0, pushes = 0;
    for (var t = k + 1; t < v.length - 1; t++) {
      var call = directionCall(v.slice(0, t + 1), opts);
      if (!call || call.dir === 0) continue;          // score only real directional calls
      var realized = sgn(v[t + 1] - v[t]);
      if (realized === 0) { pushes++; continue; }      // flat next week = push, not a miss
      if (realized > 0) up++; else down++;
      var hit = call.dir === realized ? 1 : 0;
      n++; hits += hit;
      var r = rows[tierOf(call.strength, edges)];
      r.n++; r.hits += hit;
    }
    if (!n) return null;
    rows.forEach(function (r) { r.hitRate = r.n ? +(r.hits / r.n).toFixed(3) : null; });
    var baseline = +(Math.max(up, down) / (up + down || 1)).toFixed(3);
    var hitRate = +(hits / n).toFixed(3);
    return {
      tiers: rows, n: n, hits: hits, hitRate: hitRate, pushes: pushes, up: up, down: down,
      baseline: baseline, lift: +(hitRate - baseline).toFixed(3),
      skill: hitRate > baseline + (opts.margin != null ? opts.margin : 0.0),
    };
  }

  // Are the tier hit-rates monotonic non-decreasing (low ≤ med ≤ high) within tol?
  // The calibration property: a stronger arrow should not verify LESS often.
  function isMonotonic(tiers, tol) {
    tol = tol || 0.05;
    var prev = -Infinity;
    for (var i = 0; i < tiers.length; i++) {
      var r = tiers[i];
      if (r.hitRate == null || r.n < 5) continue;     // ignore thin tiers
      if (r.hitRate < prev - tol) return false;
      prev = r.hitRate;
    }
    return true;
  }

  var api = { directionCall: directionCall, reliabilityCurve: reliabilityCurve, isMonotonic: isMonotonic, tierOf: tierOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinReliability = api;
  if (root) root.MuntinReliability = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
