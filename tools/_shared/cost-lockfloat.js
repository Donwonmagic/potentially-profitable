/**
 * cost-lockfloat.js — the lock-or-float predictability classifier (Cost Pulse's
 * trust atom). Turns the ONE element the 2026-07 statistical-rigor audit certified
 * as honest-and-forward — the conformal predictability band (how far the next
 * weekly print tends to move, with a RAW walk-forward coverage rate + Wilson CI) —
 * into a risk/planning read: is this ingredient's price steady enough to COMMIT to
 * (Lock), or too volatile to commit to (Float)?
 *
 * HONESTY BY CONSTRUCTION. This reads ONLY the allowlisted conformal fields:
 *   { halfWidthPct, coverage, coverageLo, coverageHi, nEff, nTested, degenerate,
 *     upPct, downPct }
 * It NEVER reads the level, the range-position, the seasonal position, or the
 * demolished spike/structural verb — so it cannot smuggle back a direction call,
 * an opportunity-timing ("buy now / near a low"), or an overpayment read. "Lock"
 * = predictable-enough-to-commit (a standing order, a fixed contract, a set-and-
 * forget menu price); it is NEVER "cheap" or "buy now". "Float" = too volatile to
 * commit; it is NEVER "prices will fall / wait". The band measures NEXT-WEEK reach,
 * not contract-length drift — callers MUST stamp the horizon.
 *
 * WITHHOLD FIRST, then rank survivors. If the data can't back a band (no deep
 * series, monthly-thin beef, too-wide, flat/stale/degenerate, coverage null) the
 * verdict is 'withhold' with a machine reason — withholding is load-bearing and
 * permanent, never papered over with a guess.
 *
 * Pure, deterministic, no DOM/network. Browser: window.MuntinLockFloat. Node: exports.
 */
(function (root) {
  'use strict';

  // Thresholds (band half-width as a fraction of level). Tuned on the shipped data;
  // exposed so the build gate and tests pin the exact boundaries.
  var LOCK_MAX_HW = 0.08;      // <=8% next-week reach → tight
  var CUSHION_MAX_HW = 0.20;   // <=20% → workable with headroom
  var FLOAT_MAX_HW = 0.30;     // <=30% → volatile but bound-able; beyond → withhold
  var LOCK_MIN_COVERLO = 0.60; // Lock also needs a PROVEN band: Wilson lower bound >= 0.60
  var MONTHLY_MIN_N = 40;      // a monthly series needs >=40 held-out reads to band (else "thin")

  var BUCKETS = ['lock', 'cushion', 'float', 'withhold'];
  var REASONS = ['no-series', 'monthly-thin', 'thin', 'flat', 'volatile'];

  // The ONLY conformal fields this classifier is permitted to read. Any caller/gate
  // can assert the function body references nothing outside this set.
  var ALLOWED_FIELDS = ['halfWidthPct', 'coverage', 'coverageLo', 'coverageHi', 'nEff', 'nTested', 'degenerate', 'upPct', 'downPct'];

  /**
   * classify(conf, opts) → { bucket, reason, halfWidthPct, coverage, coverageLo,
   *   coverageHi, upPct, downPct, nTested, monthly }
   *   conf: a conformalNext() result, or null when no deep band exists.
   *   opts: { monthly?:bool, hasDeep?:bool }  (cadence + whether a deep series exists —
   *          these are structural facts about the SERIES, not price signals.)
   * Deterministic; withhold-first.
   */
  function classify(conf, opts) {
    opts = opts || {};
    var monthly = !!opts.monthly;
    var hasDeep = opts.hasDeep !== false;   // default true unless told otherwise

    // --- withhold first ---
    if (!hasDeep) return withhold('no-series', monthly);
    if (!conf) return withhold(monthly ? 'monthly-thin' : 'thin', monthly);

    var hw = conf.halfWidthPct;
    if (conf.degenerate) return withhold('flat', monthly, conf);
    if (conf.coverage == null) {
      // No publishable rate: a monthly series that is short, or too few near-
      // independent steps. Name it honestly.
      var reason = (monthly && (conf.nTested || 0) < MONTHLY_MIN_N) ? 'monthly-thin' : 'thin';
      return withhold(reason, monthly, conf);
    }
    if (!(hw > 0) || hw > FLOAT_MAX_HW) return withhold('volatile', monthly, conf);

    // --- rank survivors (coverage known, not degenerate, hw<=FLOAT_MAX_HW) ---
    var bucket;
    if (hw <= LOCK_MAX_HW && conf.coverageLo != null && conf.coverageLo >= LOCK_MIN_COVERLO) {
      bucket = 'lock';            // tight AND proven
    } else if (hw <= CUSHION_MAX_HW) {
      bucket = 'cushion';        // workable with headroom (or tight-but-unproven)
    } else {
      bucket = 'float';          // 20% < hw <= 30%
    }
    return shape(bucket, null, conf, monthly);
  }

  function withhold(reason, monthly, conf) {
    return shape('withhold', reason, conf || null, monthly);
  }
  function shape(bucket, reason, conf, monthly) {
    return {
      bucket: bucket,
      reason: reason || null,
      halfWidthPct: conf ? conf.halfWidthPct : null,
      coverage: conf ? conf.coverage : null,
      coverageLo: conf ? conf.coverageLo : null,
      coverageHi: conf ? conf.coverageHi : null,
      upPct: conf ? conf.upPct : null,
      downPct: conf ? conf.downPct : null,
      nTested: conf ? conf.nTested : null,
      monthly: !!monthly,
    };
  }

  var api = {
    classify: classify,
    LOCK_MAX_HW: LOCK_MAX_HW, CUSHION_MAX_HW: CUSHION_MAX_HW, FLOAT_MAX_HW: FLOAT_MAX_HW,
    LOCK_MIN_COVERLO: LOCK_MIN_COVERLO, MONTHLY_MIN_N: MONTHLY_MIN_N,
    BUCKETS: BUCKETS, REASONS: REASONS, ALLOWED_FIELDS: ALLOWED_FIELDS,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinLockFloat = api;
  if (root) root.MuntinLockFloat = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
