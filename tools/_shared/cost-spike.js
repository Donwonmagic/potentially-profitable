/**
 * Muntin — spike-vs-structural classifier (the "should I act?" brain).
 *
 * Grounded in the historical research (docs/plans/muntin-cost-history.md): the
 * largest % moves on record all REVERTED; the moves that permanently re-set an
 * operator's cost floor were the SUSTAINED ones. So magnitude does not decide —
 * PERSISTENCE and RETRACE do. Given one ingredient's composite-point history,
 * classify its latest move:
 *   - 'structural'  → elevated and SUSTAINED → re-price (the increase is real).
 *   - 'spike'       → ran up then RETRACED ≥ a third from the recent peak →
 *                     likely reverting → hold (don't re-price a February tomato).
 *   - 'emerging'    → a material move that hasn't persisted yet → watch.
 *   - 'easing'      → a material DOWN move → hold (maybe a chance to renegotiate).
 *   - 'flat'        → within the normal band → no action.
 *   - 'insufficient'→ not enough history to judge seasonality → WATCH, never
 *                     "hold" (the conservative default: never sleep on what could
 *                     be a real hike just because we can't yet prove it's seasonal).
 *
 * Thresholds are INTERNAL CALIBRATION (illustrative), not sourced facts — tune on
 * a backtest as history accrues. Pure, no network, no LLM, integer cents.
 * Browser: window.MuntinSpike. Node: module.exports.
 */
(function (root) {
  'use strict';

  var DEFAULTS = {
    minHistory: 8,     // weeks of level points before we judge anything (< this → 'insufficient')
    material: 0.08,    // a move smaller than ±8% vs baseline is 'flat' (below menu-cost stickiness)
    persist: 4,        // weeks the level must stay elevated to read 'structural'
    retrace: 1 / 3,    // pulled back ≥ a third from the recent peak → 'spike' (reverting)
    recent: 8          // the recent-window length for peak/persistence
  };

  function median(a) {
    if (!a.length) return null;
    var s = a.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  /**
   * classify(points, opts) -> { verdict, actionBias, reason, move, retrace,
   *   elevatedWeeks, nHistory }. `points` = an ingredient's composite points,
   * NEWEST FIRST, each { level:{medianCents}, ... } (asOf optional).
   * `actionBias` ∈ 're-price' | 'hold' | 'watch' (what the verdict suggests,
   * without dictating — the operator decides).
   */
  function classify(points, opts) {
    var o = Object.assign({}, DEFAULTS, opts || {});
    var levels = (points || [])
      .map(function (p) { return p && p.level && typeof p.level.medianCents === 'number' ? p.level.medianCents : null; })
      .filter(function (v) { return v != null && isFinite(v) && v > 0; });   // newest-first
    var n = levels.length;

    if (n < o.minHistory) {
      return { verdict: 'insufficient', actionBias: 'watch', reason: 'not enough history to tell a spike from a real trend — treat as real', move: null, retrace: null, elevatedWeeks: null, nHistory: n };
    }

    var current = levels[0];
    var recent = levels.slice(0, Math.min(o.recent, n));
    var recentPeak = Math.max.apply(null, recent);
    var baseline = median(levels.slice(Math.floor(n / 2)));   // the older half = "normal" before any run-up
    if (baseline == null || baseline <= 0) baseline = median(levels);
    var move = (current - baseline) / baseline;

    if (Math.abs(move) < o.material) {
      return { verdict: 'flat', actionBias: 'hold', reason: 'within the normal range', move: move, retrace: 0, elevatedWeeks: 0, nHistory: n };
    }
    if (move < 0) {
      return { verdict: 'easing', actionBias: 'hold', reason: 'prices have come down vs the baseline', move: move, retrace: 0, elevatedWeeks: 0, nHistory: n };
    }

    var retrace = recentPeak > 0 ? (recentPeak - current) / recentPeak : 0;
    if (retrace >= o.retrace) {
      return { verdict: 'spike', actionBias: 'hold', reason: 'ran up then pulled back from a recent peak — likely reverting', move: move, retrace: retrace, elevatedWeeks: null, nHistory: n };
    }

    var thresh = baseline * (1 + o.material);
    var elevatedWeeks = recent.filter(function (v) { return v >= thresh; }).length;
    if (elevatedWeeks >= o.persist) {
      return { verdict: 'structural', actionBias: 're-price', reason: 'elevated and sustained — the increase looks real', move: move, retrace: retrace, elevatedWeeks: elevatedWeeks, nHistory: n };
    }
    return { verdict: 'emerging', actionBias: 'watch', reason: 'a real move that has not persisted yet — watch the next read', move: move, retrace: retrace, elevatedWeeks: elevatedWeeks, nHistory: n };
  }

  var api = { classify: classify, DEFAULTS: DEFAULTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinSpike = api;
  if (root) root.MuntinSpike = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
