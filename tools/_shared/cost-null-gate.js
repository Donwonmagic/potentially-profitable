/**
 * cost-null-gate.js — the per-item significance gate for the Cost Index action
 * layer (statistical-rigor audit 2026-07, CRIT-5).
 *
 * The spike/structural/easing classifier emits a non-neutral read (an "Elevated"
 * / "below baseline" label) on a large majority of ingredients even under pure
 * noise: on a vol-matched random-walk null ~99.5% of items get at least one
 * non-HOLD read, because a driftless walk wanders away from its own trailing
 * baseline and lingers there long enough to look "sustained". Surfacing a label on
 * ~every item every week, with no correction for scanning ~40–80 candidates, is a
 * false-discovery problem — the methodology-hardening doc (§9) prescribes exactly
 * this fix and it was never shipped.
 *
 * WHAT THIS DOES. Two pure, deterministic pieces:
 *   1. nullP(levels, verdict, classify, opts) — a MONTE-CARLO p-value for one item.
 *      Build B synthetic nulls of the SAME series with a MOVING-BLOCK bootstrap of
 *      its week-to-week CHANGES (block length preserves short-run autocorrelation),
 *      re-classify each, and return the fraction whose verdict is at least as
 *      "actionable" as the observed one. A low p means the observed read is rarely
 *      produced by the item's own noise. Add-one smoothing → a valid p in (0,1].
 *   2. benjaminiYekutieli(pvals, q) — FDR control across the panel. BY (not BH),
 *      because ingredients share feed/freight drivers so positive dependence (PRDS)
 *      fails; BY is valid under ARBITRARY dependence via the harmonic penalty.
 *   gatePanel() ties them together: only items whose own-null p SURVIVES the BY
 *   threshold keep a non-HOLD read; the rest (and any too-short to bootstrap) are
 *   WITHHELD to the neutral voice. Default q = 0.10.
 *
 * DETERMINISM. The bootstrap PRNG is seeded from the ingredient slug, so a build is
 * byte-reproducible (no Math.random — the seed feeds every gate consistently).
 *
 * Pure, deterministic, no DOM/network. Browser: window.MuntinNullGate. Node: exports.
 */
(function (root) {
  'use strict';

  // FNV-1a string hash → 32-bit seed, so the PRNG is a stable function of the slug.
  function seedFromString(s) {
    var h = 2166136261;
    s = String(s == null ? '' : s);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // How "actionable" (non-neutral) a verdict is. A synthetic null counts as
  // at-least-as-extreme when its rank >= the observed rank.
  var RANK = { reprice: 3, structural: 3, emerging: 2, spike: 2, easing: 1, flat: 0, insufficient: 0 };
  function actionRank(v) { return (v && RANK[v] != null) ? RANK[v] : 0; }

  /**
   * nullP(levels, observedVerdict, classify, opts)
   *   levels: chronological cents, oldest→newest.
   *   classify: fn(ptsNewestFirst) -> { verdict } (e.g. MuntinSpike.classify).
   *   opts: { B=300, blockLen=8, seedKey='' }
   * Returns a p-value in (0,1], or null when the series is too short to bootstrap.
   * A neutral observed verdict (flat/insufficient) returns 1 (nothing to gate).
   */
  function nullP(levels, observedVerdict, classify, opts) {
    opts = opts || {};
    var B = opts.B || 300;
    var blockLen = opts.blockLen || 8;
    var v = (levels || []).filter(function (x) { return typeof x === 'number' && isFinite(x); });
    var obsRank = actionRank(observedVerdict);
    if (obsRank === 0) return 1;
    if (v.length < blockLen + 4) return null;
    if (typeof classify !== 'function') return null;

    var diffs = [];
    for (var i = 1; i < v.length; i++) diffs.push(v[i] - v[i - 1]);
    var n = diffs.length;
    if (n < blockLen) return null;

    var rng = mulberry32(seedFromString(opts.seedKey || 'x'));
    var atLeast = 0;
    for (var b = 0; b < B; b++) {
      var synth = [];
      while (synth.length < n) {
        var start = Math.floor(rng() * n);
        for (var j = 0; j < blockLen && synth.length < n; j++) synth.push(diffs[(start + j) % n]);
      }
      var path = [v[0]];
      for (var k = 0; k < n; k++) path.push(path[k] + synth[k]);
      var pts = [];
      for (var m = path.length - 1; m >= 0; m--) pts.push({ level: { medianCents: path[m] }, asOf: null });
      var vv = null;
      try { vv = classify(pts); } catch (_) { vv = null; }
      if (actionRank(vv && vv.verdict) >= obsRank) atLeast++;
    }
    return (atLeast + 1) / (B + 1);
  }

  /**
   * benjaminiYekutieli(pvals, q) — indices (into pvals) that survive FDR control at
   * level q under arbitrary dependence. Empty array if none survive.
   */
  function benjaminiYekutieli(pvals, q) {
    var m = pvals.length;
    if (!m) return [];
    var c = 0;
    for (var i = 1; i <= m; i++) c += 1 / i;              // harmonic penalty c(m)
    var order = pvals.map(function (p, idx) { return { p: p, idx: idx }; })
      .sort(function (a, b) { return a.p - b.p; });
    var kmax = -1;
    for (var r = 0; r < m; r++) {
      if (order[r].p <= ((r + 1) / (m * c)) * q) kmax = r;
    }
    var pass = [];
    for (var s = 0; s <= kmax; s++) pass.push(order[s].idx);
    return pass;
  }

  /**
   * gatePanel(items, classify, opts) — items: [{ key, levels, verdict }].
   * Returns { surfaced: Set-like object of keys that keep a non-HOLD read,
   *           tested: number, mTested: number } — a key is surfaced only if its
   * verdict is actionable, its own-null p is computable, AND it survives BY at q.
   * Neutral verdicts are not candidates (they were never a "call"); too-short items
   * are withheld (not surfaced). Default q = 0.10.
   */
  function gatePanel(items, classify, opts) {
    opts = opts || {};
    var q = opts.q != null ? opts.q : 0.10;
    var candidates = (items || []).filter(function (it) { return it && actionRank(it.verdict) > 0; });
    var testable = [], testableP = [];
    for (var i = 0; i < candidates.length; i++) {
      var p = nullP(candidates[i].levels, candidates[i].verdict, classify, {
        B: opts.B, blockLen: opts.blockLen, seedKey: candidates[i].key
      });
      if (p != null) { testable.push(candidates[i]); testableP.push(p); }
    }
    var passIdx = benjaminiYekutieli(testableP, q);
    var surfaced = {};
    for (var j = 0; j < passIdx.length; j++) surfaced[testable[passIdx[j]].key] = true;
    return { surfaced: surfaced, tested: testable.length, mCandidates: candidates.length, q: q };
  }

  var api = { nullP: nullP, benjaminiYekutieli: benjaminiYekutieli, gatePanel: gatePanel, actionRank: actionRank, seedFromString: seedFromString };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinNullGate = api;
  if (root) root.MuntinNullGate = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
