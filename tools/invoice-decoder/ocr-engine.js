/**
 * Invoice Decoder — Stage 3: ONNX-based OCR engine (Slice 3).
 *
 * The v2 recognition core — replaces Tesseract.js as the default
 * OCR pipeline behind the engineV2 feature flag. Borrows Docling's
 * architecture (detection → crop → batched recognition → CTC
 * decode) but uses redistributable Apache-2.0 ONNX models
 * (PP-OCRv3 mobile lean tier, PP-OCRv4 mobile capable tier).
 *
 * Slice 3 establishes the public API contract; the actual ORT
 * loader, model session creation, and inference loop land in the
 * follow-up slice. Until then `recognize()` rejects with a
 * specific OcrError(code='ENGINE_NOT_LOADED'), which the shim
 * catches and falls back to v1. This lets the rest of the
 * pipeline land + integrate without breaking anything.
 *
 *   recognize(canvas, regions, opts) → Promise<OcrResult>
 *   OcrResult = {
 *     text:           string,
 *     lines:          [{ text, confidence, bbox, words? }],
 *     meanConfidence: number,
 *     detectionStats: {
 *       candidateBoxes: number,
 *       meanAspect:     number,
 *       meanConfidence: number
 *     },
 *     ensembleStats?: { ... }     // present when v3+v4 ensembled
 *   }
 *
 * Errors carry a machine-readable .code so the controller's
 * _classifyOcrError taxonomy can route recovery actions:
 *
 *   ENGINE_NOT_LOADED — engine not yet wired (Slice 3 stub state)
 *   MODEL_LOAD        — a model file failed to fetch / parse
 *   WASM_COMPILE      — ORT couldn't compile its WASM kernels
 *   WEBGPU_UNAVAILABLE— WebGPU EP requested but adapter rejected
 *   IMAGE_QUALITY     — input canvas was unusable
 *   LAYOUT_FAILED     — region passed in was malformed
 *   TIMEOUT           — single-page recognition exceeded budget
 *   OUT_OF_MEMORY     — WASM heap rejected an allocation
 *
 * Privacy posture: no fetch other than same-origin ONNX model
 * loads resolved through MID_VENDORS_CFG.resolve. Covered by the
 * existing check-no-invoice-egress invariant.
 */
(function (root) {
  'use strict';

  function OcrError(code, message) {
    var e = new Error(message || code);
    e.code = code;
    e.retryable = (code !== 'IMAGE_QUALITY' && code !== 'OUT_OF_MEMORY');
    return e;
  }

  // Slice 3 stub. The real ORT-backed implementation lands in the
  // follow-up; until then the shim catches this rejection and
  // routes the operator transparently to the v1 Tesseract path.
  function recognize(canvas, regions, opts) {
    return Promise.reject(OcrError(
      'ENGINE_NOT_LOADED',
      'v2 OCR engine not wired yet (Slice 3 scaffolding only)'
    ));
  }

  // Internal: tier detection. Mirrors the existing device-tier
  // logic so capable-tier devices (laptops, modern phones) get
  // the upgraded PP-OCRv4 once it has been silently fetched in
  // the background after the first read.
  function _resolveTier() {
    try {
      var dt = root.MID_DEVICE_TIER;
      if (dt && typeof dt.tier === 'function') return dt.tier();
    } catch (_) {}
    return 'lean';
  }

  var api = {
    recognize:    recognize,
    OcrError:     OcrError,
    _resolveTier: _resolveTier   // exposed for Slice 4 fixture harness
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_OCR_V2 = api;
})(typeof window !== 'undefined' ? window : null);
