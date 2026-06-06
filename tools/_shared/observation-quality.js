/**
 * Shared observation-quality — the Cost Index garbage-in defense.
 *
 * Runs on every inbound observation before the composite engine. Bad data
 * LOWERS confidence, never silently corrupts a confident number:
 *   - clearly wrong (unit mismatch, backward date, non-positive, wildly out of
 *     band) → REJECT (source contributes nothing; the engine self-degrades).
 *   - merely suspect (mildly out of band, statistical outlier) → KEEP +
 *     down-weight (participates, can't dominate).
 *   - real-but-old → STALE (excluded from LEVEL, still feeds TREND).
 * unit_mismatch is the one hard reject that is wrong, not uncertain. Pure.
 *
 * PARITY CONTRACT (canonical source). Muntin Ledger ships a behaviour-identical
 * port; observation-quality.test.mjs is mirrored verbatim there.
 */
(function (root) {
  'use strict';

  function median(values) {
    if (!values.length) return 0;
    var s = values.slice().sort(function (a, b) { return a - b; });
    var n = s.length, mid = Math.floor(n / 2);
    return n % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  function robustZ(value, history) {
    var h = (history || []).filter(function (v) { return typeof v === 'number' && isFinite(v); });
    if (h.length < 4) return 0;
    var med = median(h);
    var mad = median(h.map(function (v) { return Math.abs(v - med); }));
    if (mad === 0) return 0;
    return Math.abs(value - med) / (1.4826 * mad);
  }

  function dayDiff(a, b) {
    var ta = Date.parse(a + 'T00:00:00Z'), tb = Date.parse(b + 'T00:00:00Z');
    if (isNaN(ta) || isNaN(tb)) return null;
    return Math.round((tb - ta) / 86400000);
  }

  function validateObservation(obs, ctx) {
    ctx = ctx || {};
    var flags = [];
    var weight = 1;
    var levelEligible = !!obs && obs.basis !== 'index';

    if (!obs || !obs.date) return { ok: false, weight: 0, levelEligible: false, flags: ['no-date'] };

    if (ctx.expectedUnit && obs.unit && String(obs.unit) !== String(ctx.expectedUnit)) {
      return { ok: false, weight: 0, levelEligible: false, flags: ['unit_mismatch'] };
    }

    if (ctx.prevDate) {
      var d = dayDiff(ctx.prevDate, obs.date);
      if (d != null && d < 0) return { ok: false, weight: 0, levelEligible: false, flags: ['date_backward'] };
    }

    if (obs.basis !== 'index') {
      if (typeof obs.valueCents !== 'number' || !isFinite(obs.valueCents) || obs.valueCents <= 0) {
        return { ok: false, weight: 0, levelEligible: false, flags: ['nonpositive'] };
      }
      if (ctx.bounds && typeof ctx.bounds.minCents === 'number' && typeof ctx.bounds.maxCents === 'number') {
        var lo = ctx.bounds.minCents, hi = ctx.bounds.maxCents;
        var f = ctx.hardBandFactor || 2;
        if (obs.valueCents < lo / f || obs.valueCents > hi * f) {
          return { ok: false, weight: 0, levelEligible: false, flags: ['implausible_hard'] };
        }
        if (obs.valueCents < lo || obs.valueCents > hi) { weight *= 0.4; flags.push('out_of_band'); }
      }
    }

    if (ctx.asOf && ctx.maxAgeDays) {
      var age = dayDiff(obs.date, ctx.asOf);
      if (age != null && age > ctx.maxAgeDays) { levelEligible = false; flags.push('stale'); }
    }

    var val = (obs.basis === 'index') ? obs.value : obs.valueCents;
    var z = robustZ(val, ctx.history);
    if (z >= 3.5) { weight *= 0.5; flags.push('outlier'); }

    return { ok: true, weight: +weight.toFixed(3), levelEligible: levelEligible, flags: flags };
  }

  function screen(observations, ctxFor) {
    var kept = [], rejected = [], sourceWeight = {};
    (observations || []).forEach(function (obs) {
      var ctx = (typeof ctxFor === 'function') ? ctxFor(obs) : (ctxFor || {});
      var v = validateObservation(obs, ctx);
      if (!v.ok) { rejected.push({ obs: obs, flags: v.flags }); return; }
      var tagged = {};
      for (var k in obs) if (Object.prototype.hasOwnProperty.call(obs, k)) tagged[k] = obs[k];
      tagged._levelEligible = v.levelEligible;
      tagged._weight = v.weight;
      kept.push(tagged);
      var s = obs.source;
      sourceWeight[s] = (sourceWeight[s] == null) ? v.weight : Math.min(sourceWeight[s], v.weight);
    });
    return { kept: kept, rejected: rejected, sourceWeight: sourceWeight };
  }

  var api = {
    median: median,
    robustZ: robustZ,
    validateObservation: validateObservation,
    screen: screen
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinObservationQuality = api;
  if (root) root.MuntinObservationQuality = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
