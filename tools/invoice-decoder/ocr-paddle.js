/**
 * Wave 9.2 — PaddleOCR engine adapter.
 *
 * Second OCR engine on capable devices. Tesseract is 2008-era tech;
 * PaddleOCR-mobile-v3 was built for phone-shot text in noisy, real-
 * world conditions. On the same image:
 *   - Tesseract reads cleanly when the input is rectified, well-lit,
 *     and roughly aligned to the camera plane.
 *   - Paddle reads noisy phone shots, curled receipts, oblique
 *     angles, and Asian-script text materially better.
 *
 * We don't replace Tesseract — we ENSEMBLE. Both engines run in
 * parallel; the per-line max-confidence merge picks whichever was
 * more confident on each line. Same merge scheme as the existing
 * aggressive/gentle multipass in ocr.js; the only difference is the
 * upstream engines.
 *
 * Loading: deferred via MID_VENDORS_CFG.importModule('paddleocr').
 * The package + its models live under /assets/vendor/paddleocr@…/
 * (built by scripts/vendor-pin.mjs). On a lean device (or if the
 * package fails to load for any reason) the adapter resolves to
 * `{ available: false }` and the controller falls through to
 * Tesseract-only — no error surfaced to the operator.
 *
 * Privacy posture: model weights ship from our own origin, no
 * external fetch. Same-origin assertion enforced by the Wave 8.6
 * runtime sentinel and the build-time check-no-invoice-egress guard.
 */
(function (root) {
  'use strict';

  var __loadPromise = null;
  var __engineCache = null;     // The initialised model instance, if any.

  // Returns true if the device-tier detector says heavy mode is on.
  // Exists as a hot path so callers don't pay the import cost on
  // lean phones.
  function heavyEnabled() {
    if (typeof root === 'undefined' || !root) return false;
    if (root.MID_DEVICE_TIER && typeof root.MID_DEVICE_TIER.heavyEnabled === 'function') {
      return !!root.MID_DEVICE_TIER.heavyEnabled();
    }
    return false;
  }

  // Lazy import the PaddleOCR module via the vendor-config helper.
  // Resolves to `{ ok: true, paddle }` or `{ ok: false, reason }`.
  function _loadEngine() {
    if (__loadPromise) return __loadPromise;
    if (!heavyEnabled()) {
      __loadPromise = Promise.resolve({ ok: false, reason: 'device-tier-lean' });
      return __loadPromise;
    }
    if (typeof root === 'undefined' || !root || !root.MID_VENDORS_CFG ||
        typeof root.MID_VENDORS_CFG.importModule !== 'function') {
      __loadPromise = Promise.resolve({ ok: false, reason: 'no-vendor-cfg' });
      return __loadPromise;
    }
    __loadPromise = root.MID_VENDORS_CFG.importModule('paddleocr')
      .then(function (mod) {
        // The @paddlejs-models/ocr surface exposes init() + recognize().
        // Some builds wrap them in a default export; some attach to
        // the module object directly. Probe both shapes.
        var init = (mod && typeof mod.init === 'function')
          ? mod.init
          : (mod && mod['default'] && typeof mod['default'].init === 'function' ? mod['default'].init : null);
        var recognize = (mod && typeof mod.recognize === 'function')
          ? mod.recognize
          : (mod && mod['default'] && typeof mod['default'].recognize === 'function' ? mod['default'].recognize : null);
        if (!init || !recognize) {
          return { ok: false, reason: 'unexpected-shape' };
        }
        // Initialise once. The @paddlejs-models/ocr `init()` accepts
        // a modelPath option pointing to the directory containing the
        // text-detection (det) and text-recognition (rec) models. We
        // self-host them under the same /assets/vendor/paddleocr@…/
        // tree as the JS bundle.
        var modelPath = '/assets/vendor/paddleocr@2.2.5/models/';
        return init({ modelPath: modelPath, isFP16: true })
          .then(function () {
            return { ok: true, paddle: { recognize: recognize } };
          })
          .catch(function (err) {
            return { ok: false, reason: 'init-failed: ' + (err && err.message ? err.message : 'unknown') };
          });
      })
      .catch(function (err) {
        return { ok: false, reason: 'import-failed: ' + (err && err.message ? err.message : 'unknown') };
      });
    return __loadPromise;
  }

  // Adapter — converts PaddleOCR output to the same shape Tesseract
  // returns: { text, lines: [{text, confidence, bbox, words}], meanConfidence }.
  //
  // PaddleOCR-mobile-v3 returns one block per detected text region
  // with a quadrilateral (4 points). We compute axis-aligned bbox,
  // sort top-to-bottom, and emit each block as a "line".
  function _normaliseResult(paddleResult) {
    if (!paddleResult) return { text: '', lines: [], meanConfidence: 0 };
    // Two known surface shapes:
    //   v2.2+: { text: [...], points: [[[x,y]×4], ...], confidence: [...] }
    //   v2.0:  [{text, confidence, points}, ...]
    var entries = [];
    if (Array.isArray(paddleResult)) {
      paddleResult.forEach(function (e) {
        if (!e) return;
        entries.push({
          text: String(e.text || '').trim(),
          confidence: typeof e.confidence === 'number' ? e.confidence * 100 : 70,
          points: e.points || null
        });
      });
    } else if (paddleResult.text && Array.isArray(paddleResult.text)) {
      var n = paddleResult.text.length;
      for (var i = 0; i < n; i++) {
        var rawConf = (paddleResult.confidence && paddleResult.confidence[i]);
        entries.push({
          text: String(paddleResult.text[i] || '').trim(),
          confidence: typeof rawConf === 'number' ? rawConf * 100 : 70,
          points: paddleResult.points && paddleResult.points[i] || null
        });
      }
    } else {
      return { text: '', lines: [], meanConfidence: 0 };
    }

    // Convert quad → axis-aligned bbox; sort top→bottom, then left→right.
    var lines = entries.filter(function (e) { return e.text.length > 0; }).map(function (e) {
      var bbox = null;
      if (Array.isArray(e.points) && e.points.length === 4) {
        var xs = e.points.map(function (p) { return p[0]; });
        var ys = e.points.map(function (p) { return p[1]; });
        bbox = {
          x0: Math.min.apply(null, xs),
          y0: Math.min.apply(null, ys),
          x1: Math.max.apply(null, xs),
          y1: Math.max.apply(null, ys)
        };
      }
      return {
        text: e.text,
        confidence: e.confidence,
        bbox: bbox,
        words: undefined,    // Paddle doesn't expose per-word data
        engine: 'paddle'
      };
    }).sort(function (a, b) {
      var ay = a.bbox ? a.bbox.y0 : 0;
      var by = b.bbox ? b.bbox.y0 : 0;
      if (Math.abs(ay - by) > 6) return ay - by;
      var ax = a.bbox ? a.bbox.x0 : 0;
      var bx = b.bbox ? b.bbox.x0 : 0;
      return ax - bx;
    });

    // Within-row coalescing: when two detections sit on roughly the
    // same y baseline, treat them as the same line. Receipts often
    // show "DESC                     $48.00" with a wide gutter that
    // Paddle splits into two boxes; the operator sees the row, not
    // the boxes.
    var coalesced = [];
    lines.forEach(function (ln) {
      var last = coalesced[coalesced.length - 1];
      if (last && last.bbox && ln.bbox &&
          Math.abs(last.bbox.y0 - ln.bbox.y0) < (ln.bbox.y1 - ln.bbox.y0) * 0.4) {
        last.text += '  ' + ln.text;
        last.confidence = Math.min(last.confidence, ln.confidence);
        last.bbox.x1 = Math.max(last.bbox.x1, ln.bbox.x1);
        last.bbox.y1 = Math.max(last.bbox.y1, ln.bbox.y1);
      } else {
        coalesced.push(ln);
      }
    });

    var text = coalesced.map(function (l) { return l.text; }).join('\n');
    var meanConf = coalesced.length
      ? coalesced.reduce(function (s, b) { return s + b.confidence; }, 0) / coalesced.length
      : 0;
    return { text: text, lines: coalesced, meanConfidence: meanConf };
  }

  // Public API — matches recognizeCanvas/recognizeMultiPass's promise
  // shape so the consumer can drop it into the existing ensemble
  // merge logic. Resolves to a Tesseract-shaped result on success,
  // or `null` when the engine isn't available.
  function recognizeCanvas(canvas, opts) {
    return _loadEngine().then(function (result) {
      if (!result.ok) return null;
      var t0 = (typeof performance !== 'undefined') ? performance.now() : 0;
      // The recognize() entry point of @paddlejs-models/ocr accepts an
      // HTMLCanvasElement, HTMLImageElement, or ImageData. We pass the
      // canvas straight through.
      return Promise.resolve()
        .then(function () { return result.paddle.recognize(canvas); })
        .then(function (raw) {
          var normalised = _normaliseResult(raw);
          normalised.engine = 'paddle';
          if (typeof performance !== 'undefined') {
            normalised.elapsedMs = performance.now() - t0;
          }
          if (opts && typeof opts.onProgress === 'function') opts.onProgress(1);
          return normalised;
        })
        .catch(function () { return null; });
    });
  }

  // Eager warmup — kicks off the import + init in the background so
  // the first OCR call doesn't pay the model-load latency. Idempotent.
  // Safe to call at page load on capable devices.
  function warmup() {
    return _loadEngine();
  }

  // Returns a synchronous boolean for "should we try Paddle on this
  // OCR call" — used by the controller to skip the ensemble path on
  // lean devices without paying the import cost.
  function shouldTryEngine() {
    return heavyEnabled();
  }

  // Returns a snapshot of the engine status so the proof flyout /
  // honesty card can show "Paddle engine: loaded" or the failure
  // reason. Async because load is async.
  function status() {
    return _loadEngine().then(function (r) {
      return r && r.ok
        ? { ok: true,  reason: null,            tier: heavyEnabled() ? 'on' : 'off' }
        : { ok: false, reason: r ? r.reason : 'unknown', tier: heavyEnabled() ? 'on' : 'off' };
    });
  }

  var api = {
    recognizeCanvas: recognizeCanvas,
    warmup:          warmup,
    status:          status,
    shouldTryEngine: shouldTryEngine,
    _normaliseResult: _normaliseResult
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_OCR_PADDLE = api;
})(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : null));
