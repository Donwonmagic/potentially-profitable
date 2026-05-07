/**
 * Invoice Decoder — v1↔v2 routing shim (Slice 3).
 *
 * This file is the single integration seam between the v1 OCR
 * path (Tesseract.js multipass + PaddleOCR-mobile-v3 ensemble,
 * shipping in production today) and the v2 pipeline being built
 * in parallel (ORT + PP-OCRv4 + Docling-style layout / tables).
 *
 * Load order requirement (enforced by index.html script-tag list):
 *
 *   vendor-config.js              ← MID_VENDORS_CFG
 *   preprocess.js                 ← MID_PREPROCESS
 *   ocr.js                        ← MID_OCR (v1 — captured here)
 *   ocr-paddle.js (defer)         ← MID_OCR_PADDLE (used by v1 ensemble)
 *   normalize.js / layout.js / ocr-engine.js / tables.js / assemble.js
 *   ocr-shim.js                   ← THIS FILE; replaces MID_OCR
 *
 * The shim captures the V1 api at load time and replaces
 * window.MID_OCR with a routing wrapper. When the engineV2 flag
 * is OFF (the default), every call passes straight through to
 * V1 — zero behavior change for current users. When the flag is
 * ON, calls route to the new pipeline; if the new pipeline
 * throws (model load failure, ENGINE_NOT_LOADED, etc.) the shim
 * falls back to V1 so the operator never sees a regression.
 *
 * Feature flag sources, in priority order:
 *   1. URL ?engine=v2 / ?engine=v1   (per-session override)
 *   2. localStorage 'id-engine-v2' = 'on' / 'off' (operator persistence)
 *   3. window.MID_INVOICE_DECODER_FLAGS.engineV2 (build / page default)
 *   4. otherwise: false (V1 stays the default through the rollout)
 *
 * Privacy posture: the shim adds zero fetch / storage writes of
 * its own. The localStorage read is a no-op in the no-storage
 * page mode and is wrapped in try/catch so private-mode Safari
 * doesn't throw.
 */
(function (root) {
  'use strict';
  if (!root) return;

  // Capture V1 at the moment this file loads. ocr.js has already
  // run and exposed MID_OCR (it's a non-defer script earlier in
  // the tag list); ocr-paddle.js may or may not have run yet
  // because it's defer — that's fine, V1's recognizeMultiPassEnsemble
  // checks MID_OCR_PADDLE at call time, not load time.
  var V1 = root.MID_OCR;

  // Build-time / page-level default. Setting this to true on the
  // page element (e.g., in a beta cohort _includes file) flips
  // the default for that operator without exposing a button.
  if (typeof root.MID_INVOICE_DECODER_FLAGS === 'undefined') {
    root.MID_INVOICE_DECODER_FLAGS = { engineV2: false };
  }

  function _readQs() {
    try {
      var s = (root.location && root.location.search) || '';
      var m = /[?&]engine=(v[12])\b/.exec(s);
      if (!m) return null;
      return m[1] === 'v2';
    } catch (_) { return null; }
  }

  function _readLs() {
    try {
      var v = root.localStorage && root.localStorage.getItem('id-engine-v2');
      if (v === 'on')  return true;
      if (v === 'off') return false;
      return null;
    } catch (_) { return null; }
  }

  function shouldUseV2() {
    var qs = _readQs();
    if (qs !== null) return qs;
    var ls = _readLs();
    if (ls !== null) return ls;
    return Boolean(root.MID_INVOICE_DECODER_FLAGS && root.MID_INVOICE_DECODER_FLAGS.engineV2);
  }

  // The "Only the standard reader" setting in the operator panel
  // writes 'off' to localStorage. When set, suppress the
  // escalation path entirely so V1 owns every read on this device
  // — useful as a kill-switch if a recent invoice came back wrong
  // and the operator wants to isolate the cause.
  function _v2Suppressed() {
    try {
      return root.localStorage && root.localStorage.getItem('id-engine-v2') === 'off';
    } catch (_) { return false; }
  }

  // Build a v2 OcrResult by running the assembled pipeline on a
  // single canvas. We accept the v1 API shape (canvasA, canvasG)
  // and use the gentle canvas — it's closest to source-grade for
  // the new engine which does its own normalization.
  function _runV2(canvas, opts) {
    var L = root.MID_LAYOUT;
    var E = root.MID_OCR_V2;
    var T = root.MID_TABLES;
    var A = root.MID_ASSEMBLE;
    if (!L || !E || !A) {
      return Promise.reject(new Error('v2 modules missing — falling back'));
    }
    return L.analyze(canvas, opts || {}).then(function (layout) {
      return E.recognize(canvas, layout.regions, opts || {}).then(function (ocrResult) {
        // tables.js currently no-ops; keeping the call here for
        // the heavy-tier upgrade path.
        return (T && T.reconstruct
          ? T.reconstruct(canvas, ocrResult.lines, opts || {})
          : Promise.resolve(null)
        ).then(function (tableResult) {
          // Single-page wrapper for assemble.merge so the output
          // shape matches what the v1 caller in invoice-decoder.js
          // expects (text + lines + meanConfidence).
          var assembled = A.merge({
            pages:        [{ canvas: canvas, source: 'image', dpi: null }],
            layouts:      [layout],
            ocrResults:   [ocrResult],
            tableResults: [tableResult]
          });
          return {
            text:           assembled.fullText,
            lines:          assembled.lines,
            meanConfidence: ocrResult.meanConfidence,
            detectionStats: ocrResult.detectionStats || null,
            ensembleStats:  ocrResult.ensembleStats || null,
            engineVersion:  'v2'
          };
        });
      });
    });
  }

  // Threshold at which V1's output is considered "broken enough"
  // to escalate to V2. The user's reported failure mode is "picks
  // up no words at all" — when V1 returns fewer than this, V2
  // gets a chance to do better.
  var V1_ESCALATION_THRESHOLD = 2;

  // Quality-driven escalation: V1 first, V2 only if V1 returns
  // suspiciously little. This pattern means EVERY operator gets
  // V2's help on the cases where V1 was already failing them
  // (the actual user complaint), with zero risk of regression
  // on cases V1 already handles correctly.
  function _escalateIfV1Insufficient(v1Result, canvasGentle, opts, ensembleVariant) {
    var v1Lines = (v1Result && v1Result.lines && v1Result.lines.length) || 0;
    if (v1Lines >= V1_ESCALATION_THRESHOLD) return Promise.resolve(v1Result);
    // V1 returned suspiciously little — escalate to V2.
    return _runV2(canvasGentle, opts).then(function (v2Result) {
      var v2Lines = (v2Result && v2Result.lines && v2Result.lines.length) || 0;
      if (v2Lines > v1Lines) {
        try {
          if (root.plausible) root.plausible('Invoice Decoder V2 Escalation Win', { props: {
            v1_lines:        String(v1Lines),
            v2_lines_bucket: v2Lines < 5 ? '<5' : v2Lines < 15 ? '5-14' : '15+',
            variant:         ensembleVariant ? 'ensemble' : 'multipass'
          } });
        } catch (_) {}
        return v2Result;
      }
      return v1Result;     // V2 didn't beat V1 — return V1's result unchanged
    }).catch(function (err) {
      try {
        if (root.plausible) root.plausible('Invoice Decoder V2 Escalation Fail', { props: {
          code: (err && err.code) || 'UNKNOWN'
        } });
      } catch (_) {}
      return v1Result;     // V2 errored — V1 result still valid, return it
    });
  }

  // V2-first path: used when the operator has explicitly opted into
  // V2 (URL ?engine=v2 or localStorage 'id-engine-v2'='on').
  function _v2FirstThenV1(canvasA, canvasG, opts, v1Fn) {
    return _runV2(canvasG || canvasA, opts).catch(function (err) {
      try {
        if (root.plausible) root.plausible('Invoice Decoder V2 Fallback', { props: {
          code: (err && err.code) || 'UNKNOWN'
        } });
      } catch (_) {}
      return v1Fn(canvasA, canvasG, opts);
    });
  }

  // Wrapped recognizeMultiPass. Two routing modes:
  //   1. Default (engineV2 flag off): V1 first; on V1 success with
  //      enough lines, ship it. Only escalate to V2 when V1 returns
  //      suspiciously little — the user's actual complaint.
  //   2. V2-first (engineV2 flag on): try V2 first; on V2 error,
  //      fall back to V1. Used by beta testers who want to dogfood
  //      V2 directly.
  function recognizeMultiPass(canvasAggressive, canvasGentle, opts) {
    if (shouldUseV2()) {
      return _v2FirstThenV1(canvasAggressive, canvasGentle, opts, V1.recognizeMultiPass);
    }
    if (_v2Suppressed()) {
      // Operator chose "Only the standard reader" — V1 owns this read.
      return V1.recognizeMultiPass(canvasAggressive, canvasGentle, opts);
    }
    return V1.recognizeMultiPass(canvasAggressive, canvasGentle, opts).then(function (v1Result) {
      return _escalateIfV1Insufficient(v1Result, canvasGentle || canvasAggressive, opts, false);
    });
  }

  function recognizeMultiPassEnsemble(canvasAggressive, canvasGentle, opts) {
    var v1Fn = V1.recognizeMultiPassEnsemble || V1.recognizeMultiPass;
    if (shouldUseV2()) {
      return _v2FirstThenV1(canvasAggressive, canvasGentle, opts, v1Fn);
    }
    if (_v2Suppressed()) {
      return v1Fn(canvasAggressive, canvasGentle, opts);
    }
    return v1Fn(canvasAggressive, canvasGentle, opts).then(function (v1Result) {
      return _escalateIfV1Insufficient(v1Result, canvasGentle || canvasAggressive, opts, true);
    });
  }

  // adaptiveReread is a v1-specific optimization (PSM 7 reread on
  // amber-confidence lines). The v2 engine doesn't need it because
  // PP-OCR's confidence calibration is much tighter; we route
  // through to v1 always so the existing telemetry continues to
  // work and any v2-flagged sessions still benefit when they
  // happen to fall back.
  function adaptiveReread(canvas, ocrResult, opts) {
    if (V1 && typeof V1.adaptiveReread === 'function') {
      return V1.adaptiveReread(canvas, ocrResult, opts);
    }
    return Promise.resolve(ocrResult);
  }

  // Replace window.MID_OCR. The wrapper preserves the V1 API
  // surface so the controller code in invoice-decoder.js keeps
  // working without edits. Anything not explicitly wrapped is
  // delegated to V1 verbatim so V1-only callers (region-scoped
  // OCR for the "what'd we read?" panel, etc.) keep working.
  var wrapped = {
    recognizeMultiPass:         recognizeMultiPass,
    recognizeMultiPassEnsemble: recognizeMultiPassEnsemble,
    adaptiveReread:             adaptiveReread,
    // Pass-throughs (V1 only):
    loadTesseract:              V1 && V1.loadTesseract,
    recognizeCanvas:            V1 && V1.recognizeCanvas,
    recognizeCanvasWithWords:   V1 && V1.recognizeCanvasWithWords,
    recognizeRegion:            V1 && V1.recognizeRegion,
    REGION_WHITELISTS:          V1 && V1.REGION_WHITELISTS,
    // Diagnostic helpers exposed for the _compare/ page (Slice 5):
    _v1:                        V1,
    _shouldUseV2:               shouldUseV2,
    _runV2:                     _runV2
  };
  // Only override if V1 was actually present — defensive in case
  // ocr.js failed to load (e.g., 404 on the script). In that
  // edge case the controller's `typeof MID_OCR === 'undefined'`
  // guard at invoice-decoder.js:553 surfaces the right error.
  if (V1) root.MID_OCR = wrapped;
})(typeof window !== 'undefined' ? window : null);
