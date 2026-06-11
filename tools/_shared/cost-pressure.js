/**
 * Muntin — Cost Pressure engine (the inferred "where it's headed" overlay).
 *
 * A DETERMINISTIC scorecard over a small, fixed panel of public leading
 * indicators — the Atlanta-Fed-GDPNow / Cleveland-Fed-nowcast move, shrunk so a
 * reader could redo it in a spreadsheet. It outputs a DIRECTION and a confidence,
 * never a price. It is the opposite of a black box: same inputs + same rule
 * manifest → same label, forever, and check-pressure-honesty.mjs re-runs this
 * exact arithmetic against the rendered page.
 *
 * THE TWO-LAYER CONTRACT: the measured wholesale price is a separate, anchor
 * layer that alone may carry a `$`. This engine never sees or emits a price —
 * the returned record HAS NO value/price/level field, so a fabricated number is
 * structurally impossible.
 *
 *   assess(panel, observations, opts) -> {
 *     item, direction ('building'|'easing'|'steady'|'unknown'),
 *     confidence ('high'|'moderate'|'low'), agreement, score, cutoff,
 *     freshness_weeks, anchor_print_date, as_of, under_review, rule_version,
 *     contributors: [{ indicator, source, signed_signal, weight, lead, tier,
 *                      cite, group, change_pct, as_of }]
 *   }
 *
 * panel: one item's rule from data/pressure-rules.json —
 *   { item, rule_version, cutoffT, deadband, agreement:{highT,modT,minHigh,minMod},
 *     decay:{weeksPerNotch, floorWeeks},
 *     indicators:[{ id, source, sign(+1|-1), weight, tier, lead:{min,max,unit},
 *                   window, deadband?, group?, cite }] }
 * observations: { [indicatorId]: { changePct, asOf } }  // % change over the
 *   indicator's window, ALREADY lead-shifted by the caller.
 * opts: { anchorPrintDate, asOf, ruleVersion }
 *
 * Pure, deterministic, no DOM/network. Browser: window.MuntinCostPressure.
 */
(function (root) {
  'use strict';

  // A move smaller than the deadband is "steady" (0) — this is what stops noise
  // from manufacturing a story.
  function discretize(changePct, deadband) {
    if (changePct == null || !isFinite(changePct)) return 0;
    if (changePct > deadband) return 1;
    if (changePct < -deadband) return -1;
    return 0;
  }

  function assess(panel, observations, opts) {
    panel = panel || {};
    observations = observations || {};
    opts = opts || {};
    var inds = panel.indicators || [];
    var defaultDeadband = panel.deadband != null ? panel.deadband : 0.02;
    var T = panel.cutoffT != null ? panel.cutoffT : 1;

    var contributors = [];
    var ungrouped = 0, activeWeight = 0;
    var groups = {};   // correlated indicators share one weight bucket (no double-count)

    inds.forEach(function (ind) {
      var obs = observations[ind.id];
      if (!obs || obs.changePct == null || !isFinite(obs.changePct)) return;   // no data → skip
      var db = ind.deadband != null ? ind.deadband : defaultDeadband;
      var d = discretize(obs.changePct, db);
      var sign = ind.sign === -1 ? -1 : 1;          // does indicator-up mean cost-up (+) or cost-down (−)?
      var c = sign * d;                             // this indicator's cost-pressure vote ∈ {−1,0,+1}
      var w = ind.weight != null ? ind.weight : 1;
      contributors.push({
        indicator: ind.id, source: ind.source || null, signed_signal: c, weight: w,
        lead: ind.lead || null, tier: ind.tier || null, cite: ind.cite || null,
        group: ind.group || null, change_pct: obs.changePct, as_of: obs.asOf || null
      });
      if (ind.group) {
        var g = groups[ind.group] = groups[ind.group] || { signedSum: 0, bucketWeight: 0 };
        g.signedSum += w * c;
        g.bucketWeight = Math.max(g.bucketWeight, w);   // group contributes at most its strongest member
      } else {
        ungrouped += w * c;
        activeWeight += w;
      }
    });

    var P = ungrouped;
    Object.keys(groups).forEach(function (k) {
      var g = groups[k];
      P += g.bucketWeight * (g.signedSum > 0 ? 1 : g.signedSum < 0 ? -1 : 0);
      activeWeight += g.bucketWeight;
    });

    var freshnessWeeks = null;
    if (opts.anchorPrintDate && opts.asOf) {
      var ms = Date.parse(opts.asOf) - Date.parse(opts.anchorPrintDate);
      if (isFinite(ms)) freshnessWeeks = Math.max(0, Math.round(ms / (7 * 86400000)));
    }

    // Agreement = how aligned the panel is. A disagreeing panel can't show a
    // confident arrow — it's forced toward "steady / mixed".
    var agreement = activeWeight > 0 ? +(Math.abs(P) / activeWeight).toFixed(3) : 0;

    var direction;
    if (!contributors.length) direction = 'unknown';
    else if (P >= T) direction = 'building';
    else if (P <= -T) direction = 'easing';
    else direction = 'steady';

    var aH = (panel.agreement && panel.agreement.highT) || 0.66;
    var aM = (panel.agreement && panel.agreement.modT) || 0.33;
    var order = ['high', 'moderate', 'low'];
    var conf = agreement >= aH ? 'high' : agreement >= aM ? 'moderate' : 'low';

    // Breadth floor: confidence measures AGREEMENT AMONG INDICATORS, so it cannot
    // outrun how many actually reported. With a sample of one, agreement is
    // trivially 1.0 — but one surviving signal is a hint, not a confident read. A
    // panel thinned by an absent/off-season indicator (no active freeze warning in
    // summer) or a fetch gap must step its claim down: 'high' needs minHigh active
    // indicators, 'moderate' needs minMod; a lone signal caps at 'low'.
    var nActive = contributors.length;
    var minHigh = (panel.agreement && panel.agreement.minHigh) || 3;
    var minMod = (panel.agreement && panel.agreement.minMod) || 2;
    if (nActive < minHigh && conf === 'high') conf = 'moderate';
    if (nActive < minMod && conf !== 'low') conf = 'low';

    // Staleness decay: the further past the last measured print, the weaker the
    // claim. Step confidence down on a published schedule; past the floor, the
    // overlay must suppress its arrow to "steady — under review".
    var decay = panel.decay || {};
    var underReview = false;
    if (freshnessWeeks != null) {
      if (decay.weeksPerNotch) {
        var idx = Math.min(order.length - 1, order.indexOf(conf) + Math.floor(freshnessWeeks / decay.weeksPerNotch));
        conf = order[idx];
      }
      if (decay.floorWeeks != null && freshnessWeeks > decay.floorWeeks) {
        underReview = true; direction = 'steady'; conf = 'low';
      }
    }

    return {
      item: panel.item || null,
      direction: direction,
      confidence: conf,
      agreement: agreement,
      score: +P.toFixed(3),
      cutoff: T,
      freshness_weeks: freshnessWeeks,
      anchor_print_date: opts.anchorPrintDate || null,
      as_of: opts.asOf || null,
      under_review: underReview,
      rule_version: panel.rule_version || opts.ruleVersion || null,
      contributors: contributors
      // DELIBERATELY no value/price/level field — fabrication is impossible.
    };
  }

  var api = { assess: assess, discretize: discretize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinCostPressure = api;
  if (root) root.MuntinCostPressure = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
