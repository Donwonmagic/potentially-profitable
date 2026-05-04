/**
 * Per-operator OCR confidence calibration (Wave 11.1).
 *
 * Tesseract reports per-line confidence numbers in 0..100. Empirically
 * those numbers are *under-calibrated* on invoice fixtures: a line
 * reported at 92% has been wrong ~12% of the time across the soak
 * suite. Untangled, that means amber-band thresholds (80, 60) and
 * auto-confirm gates (Wave 5.3 needs ≥ 90) all fire at the wrong
 * spots.
 *
 * The fix: a per-operator isotonic-regression calibrator that learns
 * "Tesseract said X — actual correctness was Y" from the operator's
 * own corrections. After ~30-50 invoices the curve diverges enough
 * from the global prior to materially shift downstream gates.
 *
 * Storage: MuntinContext.ocrCalibrationSamples — capped 500 newest-
 * first ring of `{rawConf, wasCorrect, ts}` pairs. Aggregate-only;
 * no row text.
 *
 * Public API:
 *
 *   recordSample(rawConf, wasCorrect)   add a (Tesseract reported, was
 *                                       it actually right after the
 *                                       operator confirmed/edited)
 *                                       observation.
 *   calibrate(rawConf)               → calibrated 0..100. Returns
 *                                       rawConf when fewer than
 *                                       MIN_SAMPLES exist.
 *   curve()                          → array of {rawConf, calibratedConf}
 *                                       (12-point lookup) for proof-
 *                                       flyout transparency.
 *
 * Pure-ish: `recordSample` is the only mutator and routes through
 * MuntinContext.merge — same posture as every other Wave 10/11 store.
 */
(function (root) {
  'use strict';

  var MAX_SAMPLES = 500;
  var MIN_SAMPLES = 30;
  var BIN_COUNT   = 12;       // 0-100 split into 12 buckets

  function _ctx() {
    if (typeof root !== 'undefined' && root && root.MuntinContext) return root.MuntinContext;
    if (typeof require !== 'undefined') {
      try { return require('../_shared/context-bus.js'); } catch (_) { return null; }
    }
    return null;
  }

  function recordSample(rawConf, wasCorrect) {
    var c = _ctx();
    if (!c) return false;
    var rc = parseFloat(rawConf);
    if (!isFinite(rc) || rc < 0 || rc > 100) return false;
    var data = (typeof c.read === 'function') ? c.read() : null;
    if (!data) return false;
    var ring = Array.isArray(data.ocrCalibrationSamples) ? data.ocrCalibrationSamples.slice() : [];
    ring.unshift({ rawConf: +rc.toFixed(1), wasCorrect: !!wasCorrect, ts: Date.now() });
    if (ring.length > MAX_SAMPLES) ring = ring.slice(0, MAX_SAMPLES);
    return c.merge({ ocrCalibrationSamples: ring });
  }

  // Pool-Adjacent-Violators isotonic regression. Given an array of
  // {rawConf, wasCorrect}, produce a non-decreasing step function
  // mapping rawConf bucket → mean(wasCorrect). Handles ties by
  // pooling.
  function _fit(samples) {
    if (!samples || !samples.length) return null;
    // Bucket by rawConf into BIN_COUNT bins.
    var bins = [];
    for (var i = 0; i < BIN_COUNT; i++) bins.push({ x: (i + 0.5) * (100 / BIN_COUNT), n: 0, sum: 0 });
    samples.forEach(function (s) {
      var idx = Math.min(BIN_COUNT - 1, Math.max(0, Math.floor(s.rawConf / (100 / BIN_COUNT))));
      bins[idx].n++;
      bins[idx].sum += s.wasCorrect ? 1 : 0;
    });
    // Compute per-bin mean. Bins with zero observations carry NaN;
    // they get dropped from the iso fit and re-interpolated later.
    var pts = bins
      .filter(function (b) { return b.n > 0; })
      .map(function (b) { return { x: b.x, y: b.sum / b.n, w: b.n }; });
    if (pts.length < 2) return null;
    // PAV: walk left-to-right, pooling violations.
    for (var p = 1; p < pts.length; p++) {
      while (p > 0 && pts[p].y < pts[p - 1].y) {
        var totalW = pts[p - 1].w + pts[p].w;
        pts[p - 1] = {
          x: pts[p - 1].x,
          y: ((pts[p - 1].y * pts[p - 1].w) + (pts[p].y * pts[p].w)) / totalW,
          w: totalW
        };
        pts.splice(p, 1);
        p--;
      }
    }
    return pts;
  }

  // Build the canonical 12-point lookup. Caches; recomputes on
  // sample-count change.
  var __cacheKey = null;
  var __cachedCurve = null;
  function _buildCurve() {
    var c = _ctx();
    if (!c) return null;
    var data = (typeof c.read === 'function') ? c.read() : null;
    if (!data) return null;
    var samples = Array.isArray(data.ocrCalibrationSamples) ? data.ocrCalibrationSamples : [];
    if (samples.length < MIN_SAMPLES) return null;
    var key = samples.length + ':' + (samples[0] && samples[0].ts);
    if (__cacheKey === key && __cachedCurve) return __cachedCurve;
    var iso = _fit(samples);
    if (!iso) return null;
    // Build a 12-point lookup spanning 0..100.
    var lookup = [];
    for (var i = 0; i <= BIN_COUNT; i++) {
      var x = (i / BIN_COUNT) * 100;
      // Linear interpolation into the iso step function.
      var y;
      if (x <= iso[0].x) y = iso[0].y;
      else if (x >= iso[iso.length - 1].x) y = iso[iso.length - 1].y;
      else {
        for (var j = 1; j < iso.length; j++) {
          if (iso[j].x >= x) {
            var t = (x - iso[j - 1].x) / (iso[j].x - iso[j - 1].x);
            y = iso[j - 1].y + t * (iso[j].y - iso[j - 1].y);
            break;
          }
        }
      }
      lookup.push({ rawConf: +x.toFixed(1), calibratedConf: +(y * 100).toFixed(1) });
    }
    __cacheKey = key;
    __cachedCurve = lookup;
    return lookup;
  }

  function curve() { return _buildCurve(); }

  function calibrate(rawConf) {
    var rc = parseFloat(rawConf);
    if (!isFinite(rc) || rc < 0 || rc > 100) return rawConf;
    var lookup = _buildCurve();
    if (!lookup) return rawConf;
    // Linear-interp into the lookup.
    if (rc <= lookup[0].rawConf) return lookup[0].calibratedConf;
    if (rc >= lookup[lookup.length - 1].rawConf) return lookup[lookup.length - 1].calibratedConf;
    for (var i = 1; i < lookup.length; i++) {
      if (lookup[i].rawConf >= rc) {
        var t = (rc - lookup[i - 1].rawConf) / (lookup[i].rawConf - lookup[i - 1].rawConf);
        return +(lookup[i - 1].calibratedConf + t * (lookup[i].calibratedConf - lookup[i - 1].calibratedConf)).toFixed(1);
      }
    }
    return rawConf;
  }

  // Apply calibration to a row in place (mutates row.confidence and
  // row.fieldConf.* if present). Caller controls when to invoke.
  function applyToRow(row) {
    if (!row) return row;
    if (typeof row.confidence === 'number') row.confidence = calibrate(row.confidence);
    if (row.fieldConf && typeof row.fieldConf === 'object') {
      ['name', 'qty', 'price', 'category'].forEach(function (k) {
        if (typeof row.fieldConf[k] === 'number') row.fieldConf[k] = calibrate(row.fieldConf[k]);
      });
    }
    return row;
  }

  // Invalidate the cache (called by tests or after `MuntinContext.clear`).
  function invalidate() { __cacheKey = null; __cachedCurve = null; }

  var api = {
    recordSample:  recordSample,
    calibrate:     calibrate,
    applyToRow:    applyToRow,
    curve:         curve,
    invalidate:    invalidate,
    MAX_SAMPLES:   MAX_SAMPLES,
    MIN_SAMPLES:   MIN_SAMPLES,
    _fit:          _fit
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_CALIBRATION = api;
})(typeof window !== 'undefined' ? window : null);
