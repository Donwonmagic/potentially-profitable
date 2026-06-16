/**
 * cost-staleness.js — the honest staleness penalty. A read isn't trustworthy just
 * because it's complete; it has to be CURRENT. The methodology review's most-cited
 * hole: a price whose freshest contributing print is weeks past its source's normal
 * cadence should not wear the same confidence as today's. This caps confidence by
 * how OVERDUE the data is — measured against the source's cadence, so a monthly
 * series a month old reads fresh while a weekly series three weeks stale gets marked
 * down. Distinguishing "old" from "overdue" is the whole point.
 *
 * Deterministic by construction: it compares the read date (asOf) baked into the
 * vendored point against the freshest contributing observation date — both frozen
 * in the data — never against "today". So it never churns a page between rebuilds
 * (the index-wide "has it been re-vendored lately" question is the freshness
 * heartbeat's job; this is per-item, per-source overdue-ness).
 *
 *   cadenceFor(type)           -> expected days between prints for a source type
 *   stalenessOf(point, opts)   -> { staleDays, cadenceDays, ratio, overdue, ceiling }
 *   capConfidence(conf, ceil)  -> step-min of a confidence label and a ceiling
 *
 * PARITY: mirrored by the Muntin Ledger TS port at
 * ledger-spec/cost-index/src/cost-staleness.ts — vectors copied verbatim; change
 * the math in one repo, change it in the other in the same commit.
 *
 * Pure, no DOM/network. Browser: window.MuntinStaleness.
 */
(function (root) {
  'use strict';

  // Expected days between prints, by source type seen in level provenance. USDA
  // terminal/mandatory feeds refresh ~weekly; NOAA trade (customs) is monthly.
  // Unknown types default to monthly — conservative, so we never over-penalize.
  var CADENCE_BY_TYPE = {
    'usda-ams': 7, 'usda-lmr': 7, 'usda-mars': 7, 'ndpsr': 7, 'eia': 7,
    'noaa-trade': 31, 'noaa-fisheries': 31, 'fred': 31, 'bls': 31, 'census': 31,
  };
  var DEFAULT_CADENCE = 31;
  var STEP = ['directional', 'low', 'medium', 'high'];

  function cadenceFor(type) {
    return CADENCE_BY_TYPE[type] != null ? CADENCE_BY_TYPE[type] : DEFAULT_CADENCE;
  }
  function daysBetween(a, b) {
    var t = (Date.parse(a) - Date.parse(b));
    return isFinite(t) ? Math.round(t / 86400000) : null;
  }

  // The freshest level source decides staleness: if even the newest print backing
  // the dollar level is overdue for its cadence, the level is stale.
  function freshestLevelSource(point) {
    var prov = point && point.level && point.level.provenance;
    if (!Array.isArray(prov) || !prov.length) return null;
    var best = null;
    prov.forEach(function (p) {
      if (!p || !p.date) return;
      if (!best || Date.parse(p.date) > Date.parse(best.date)) best = p;
    });
    return best;
  }

  /**
   * stalenessOf(point, opts) → null if no dated level provenance, else:
   *   { staleDays, cadenceDays, ratio, overdue, ceiling }
   * ceiling is the MAX confidence the data's currency can support (null = no cap):
   *   ratio ≤ warn(1.5) → null · ≤ 2.5 → 'medium' · ≤ 4 → 'low' · else 'directional'.
   * overdue = ratio > overdueAt (default 2 cadences behind).
   */
  function stalenessOf(point, opts) {
    opts = opts || {};
    var src = freshestLevelSource(point);
    var asOf = point && point.asOf;
    if (!src || !asOf) return null;
    var staleDays = daysBetween(asOf, src.date);
    if (staleDays == null || staleDays < 0) staleDays = 0;
    var cadenceDays = cadenceFor(src.type || src.source);
    var ratio = +(staleDays / cadenceDays).toFixed(3);
    var warn = opts.warn != null ? opts.warn : 1.5;
    var overdueAt = opts.overdueAt != null ? opts.overdueAt : 2;
    var ceiling = ratio <= warn ? null : ratio <= 2.5 ? 'medium' : ratio <= 4 ? 'low' : 'directional';
    return { staleDays: staleDays, cadenceDays: cadenceDays, ratio: ratio, overdue: ratio > overdueAt, ceiling: ceiling };
  }

  // Step-min: never let a confidence exceed the staleness ceiling. Unknown labels
  // pass through unchanged; ceiling null = no cap.
  function capConfidence(conf, ceiling) {
    if (!ceiling) return conf;
    var ci = STEP.indexOf(conf), ce = STEP.indexOf(ceiling);
    if (ci < 0 || ce < 0) return conf;
    return STEP[Math.min(ci, ce)];
  }

  var api = { cadenceFor: cadenceFor, stalenessOf: stalenessOf, capConfidence: capConfidence, CADENCE_BY_TYPE: CADENCE_BY_TYPE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinStaleness = api;
  if (root) root.MuntinStaleness = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
