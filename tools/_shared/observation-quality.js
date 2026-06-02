/**
 * Muntin — observation quality gate (the garbage-in defense).
 *
 * Runs on EVERY inbound price observation (public index/wholesale,
 * first-party delivered, POS) BEFORE it reaches the composite engine
 * (tools/_shared/composite-price.js). The engine degrades honestly when
 * sources are few or disagree, but it cannot defend against
 * systematically WRONG inputs — a $/case masquerading as $/lb, a -9999
 * sentinel, a stale value replayed as new. That defense lives here.
 *
 * The discipline (from the API-integration pods): bad data must LOWER
 * CONFIDENCE, not silently corrupt a confident-looking number. So:
 *   - a clearly-wrong observation (unit mismatch, backward date,
 *     non-positive, wildly out of band) is REJECTED (ok:false) — the
 *     source then contributes nothing and the engine degrades itself.
 *   - a merely-suspect observation (mildly out of band, statistical
 *     outlier) is KEPT but DOWN-WEIGHTED — it participates but can't
 *     dominate the weighted-median trend or the median level.
 *   - a real-but-old observation is flagged STALE: excluded from the
 *     current LEVEL, still usable for the TREND window.
 * Unit mismatch is the one hard reject that isn't "low confidence" —
 * a wrong unit is wrong, not uncertain.
 *
 * Pure, deterministic, no network, no LLM, integer cents. Browser:
 * window.MuntinObsQuality. Node: module.exports.
 */
(function (root) {
  'use strict';

  function median(values) {
    if (!values.length) return 0;
    var s = values.slice().sort(function (a, b) { return a - b; });
    var n = s.length, mid = Math.floor(n / 2);
    return n % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  // Robust outlier score via median absolute deviation (resists the very
  // outliers it's trying to find, unlike a mean/stdev z-score).
  function robustZ(value, history) {
    var h = (history || []).filter(function (v) { return typeof v === 'number' && isFinite(v); });
    if (h.length < 4) return 0;
    var med = median(h);
    var mad = median(h.map(function (v) { return Math.abs(v - med); }));
    if (mad === 0) return 0;
    return Math.abs(value - med) / (1.4826 * mad);
  }

  function dayDiff(a, b) {
    // whole days between 'YYYY-MM-DD' a and b (b - a). Null on bad input.
    var ta = Date.parse(a + 'T00:00:00Z'), tb = Date.parse(b + 'T00:00:00Z');
    if (isNaN(ta) || isNaN(tb)) return null;
    return Math.round((tb - ta) / 86400000);
  }

  /**
   * validateObservation(obs, ctx) -> { ok, weight, levelEligible, flags }.
   *   obs: { source, basis, valueCents?, unit?, date }
   *   ctx (all optional): {
   *     bounds: { minCents, maxCents },   // plausible-range band
   *     expectedUnit,                     // hard-reject on mismatch
   *     prevDate,                         // last date seen for this source
   *     asOf, maxAgeDays,                 // staleness window for LEVEL
   *     history: [priorValues],           // for the robust outlier check
   *     hardBandFactor                    // default 2 = "wildly" out of band
   *   }
   * `weight` (0..1] feeds the engine's weighted median; `levelEligible`
   * gates whether this obs may anchor a LEVEL (index/stale never do).
   */
  function validateObservation(obs, ctx) {
    ctx = ctx || {};
    var flags = [];
    var weight = 1;
    var levelEligible = obs && obs.basis !== 'index';

    if (!obs || !obs.date) return { ok: false, weight: 0, levelEligible: false, flags: ['no-date'] };

    // (1) Unit mismatch — the one hard reject that is wrong, not uncertain.
    if (ctx.expectedUnit && obs.unit && String(obs.unit) !== String(ctx.expectedUnit)) {
      return { ok: false, weight: 0, levelEligible: false, flags: ['unit_mismatch'] };
    }

    // (2) Date must advance — a "new" period repeating/predating the last
    // is a republish/cache bug; don't let it advance asOf.
    if (ctx.prevDate) {
      var d = dayDiff(ctx.prevDate, obs.date);
      if (d != null && d < 0) {
        return { ok: false, weight: 0, levelEligible: false, flags: ['date_backward'] };
      }
    }

    // Level-bearing observations carry a dollar value to vet.
    if (obs.basis !== 'index') {
      if (typeof obs.valueCents !== 'number' || !isFinite(obs.valueCents) || obs.valueCents <= 0) {
        return { ok: false, weight: 0, levelEligible: false, flags: ['nonpositive'] };
      }
      if (ctx.bounds && typeof ctx.bounds.minCents === 'number' && typeof ctx.bounds.maxCents === 'number') {
        var lo = ctx.bounds.minCents, hi = ctx.bounds.maxCents;
        var f = ctx.hardBandFactor || 2;
        // (3a) wildly out of band (units flip, 100x error) -> hard reject.
        if (obs.valueCents < lo / f || obs.valueCents > hi * f) {
          return { ok: false, weight: 0, levelEligible: false, flags: ['implausible_hard'] };
        }
        // (3b) mildly out of band -> keep, down-weight (could be a real shock).
        if (obs.valueCents < lo || obs.valueCents > hi) {
          weight *= 0.4; flags.push('out_of_band');
        }
      }
    }

    // (4) Staleness — too old to be the CURRENT level, still fine for trend.
    if (ctx.asOf && ctx.maxAgeDays) {
      var age = dayDiff(obs.date, ctx.asOf);
      if (age != null && age > ctx.maxAgeDays) { levelEligible = false; flags.push('stale'); }
    }

    // (5) Statistical outlier vs the source's own history -> down-weight,
    // never drop (a real spike must not be silenced).
    var val = (obs.basis === 'index') ? obs.value : obs.valueCents;
    var z = robustZ(val, ctx.history);
    if (z >= 3.5) { weight *= 0.5; flags.push('outlier'); }

    return { ok: true, weight: +weight.toFixed(3), levelEligible: levelEligible, flags: flags };
  }

  /**
   * screen(observations, ctxFor) -> { kept, rejected, sourceWeight }.
   * Applies validateObservation across a batch (one ingredient).
   *   ctxFor: object (applied to all) OR function(obs)->ctx.
   * `kept` excludes hard rejects and tags each obs with `_levelEligible`;
   * `sourceWeight[source]` is the LOWEST weight seen for that source (so a
   * suspect point drags its series' trend weight down). Feed `kept` to
   * buildCompositeInput and apply `sourceWeight` to the trend blend.
   */
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
  if (typeof self !== 'undefined') self.MuntinObsQuality = api;
  if (root) root.MuntinObsQuality = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
