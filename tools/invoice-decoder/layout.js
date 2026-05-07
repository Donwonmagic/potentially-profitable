/**
 * Invoice Decoder — Stage 2: layout analysis.
 *
 * Detects regions on a page (header, line-items table, totals,
 * footer) so the OCR engine can run model-aware recognition per
 * region instead of treating the whole page as one block.
 *
 * Two-tier degradation:
 *
 *   1. **Heuristic** (default, every device): single 'page' region
 *      covering the full canvas. The OCR engine handles whole-page
 *      detection — this works fine for the typical invoice and
 *      ships in production today.
 *
 *   2. **DocLayNet ONNX** (heavy tier, opt-in via
 *      MID_INVOICE_DECODER_FLAGS.useLayoutModel = true): IBM's
 *      layout model from ds4sd/docling-models, lazy-loaded via
 *      ORT. Produces region bboxes labelled by class
 *      (text, table, header, footer, figure, caption).
 *
 *      THE POSTPROCESSING IS UNVERIFIED. Different DocLayNet ONNX
 *      exports use different output shapes (YOLOX-style box lists,
 *      DETR-style bbox+logits, custom Docling formats). Without
 *      browser verification against the actual model file, the
 *      postprocessing code below makes a best-guess assumption
 *      (YOLOX-style [N, 6]: x1, y1, x2, y2, score, class) and
 *      throws on shape mismatch — at which point analyze() falls
 *      back to the heuristic. Treat the model code path as
 *      EXPERIMENTAL until the FIXMEs below are resolved by a
 *      session with browser access.
 *
 *   LayoutResult = {
 *     regions:       [{ kind, bbox: {x,y,w,h}, confidence }],
 *     usedHeuristic: boolean,
 *     usedModel:     boolean
 *   }
 *
 * Privacy posture: same-origin model load via MID_VENDORS_CFG.
 * No external fetch.
 */
(function (root) {
  'use strict';

  // DocLayNet class taxonomy. The order is the standard published
  // by ds4sd; if a different export uses a different ordering,
  // _decodeDocLayNetClass returns 'unknown' and the region is
  // treated as a generic 'text' region.
  var DOCLAYNET_CLASSES = [
    'caption', 'footer', 'formula', 'list-item', 'page-footer',
    'page-header', 'figure', 'section-header', 'table', 'text',
    'title'
  ];

  function _decodeDocLayNetClass(classIdx) {
    var idx = Math.round(classIdx);
    if (idx < 0 || idx >= DOCLAYNET_CLASSES.length) return 'unknown';
    return DOCLAYNET_CLASSES[idx];
  }

  // Heuristic single-region result. Used when the layout model is
  // off, fails to load, or produces output we don't trust.
  function _wholePageHeuristic(canvas) {
    return {
      regions: [{
        kind:       'page',
        bbox:       { x: 0, y: 0, w: canvas.width, h: canvas.height },
        confidence: 1.0
      }],
      usedHeuristic: true,
      usedModel:     false
    };
  }

  // ---------------- DocLayNet ONNX path (experimental) ----------------

  var _layoutSessionPromise = null;

  function _loadLayoutSession() {
    if (_layoutSessionPromise) return _layoutSessionPromise;
    var engineApi = root.MID_OCR_V2;
    if (!engineApi || typeof engineApi._loadOrt !== 'function' || typeof engineApi._loadSession !== 'function') {
      return Promise.reject(new Error('ocr-engine module not loaded'));
    }
    _layoutSessionPromise = engineApi._loadOrt().then(function (ort) {
      return engineApi._loadSession(ort, 'doclingLayoutHeron').then(function (session) {
        return { ort: ort, session: session };
      });
    }).catch(function (err) {
      _layoutSessionPromise = null;   // allow retry
      throw err;
    });
    return _layoutSessionPromise;
  }

  // FIXME (browser-verify): DocLayNet input preprocessing.
  //
  // The ds4sd/docling-models heron export expects a 1280×1280
  // square RGB image normalized to ImageNet mean/std. This is the
  // standard documented in the upstream paper, but exact ONNX
  // exports vary — some expect 800×800, some require BGR ordering,
  // some skip normalization. The numbers below are the most
  // commonly-cited setup. Verify against the actual model's input
  // tensor info (session.inputNames + check input dims via a
  // dummy run with 'IGNORE_OUT_OF_RANGE' allocator) in a browser
  // session before relying on this path.
  var LAYOUT_INPUT_SIZE = 1280;
  var LAYOUT_MEAN = [0.485, 0.456, 0.406];
  var LAYOUT_STD  = [0.229, 0.224, 0.225];

  function _canvasToLayoutTensor(canvas, ort) {
    var sz = LAYOUT_INPUT_SIZE;
    var resized = root.document.createElement('canvas');
    resized.width = sz;
    resized.height = sz;
    var rctx = resized.getContext('2d');
    rctx.imageSmoothingEnabled = true;
    rctx.imageSmoothingQuality = 'high';
    rctx.drawImage(canvas, 0, 0, sz, sz);
    var img = rctx.getImageData(0, 0, sz, sz);
    var d = img.data;
    var n = sz * sz;
    var arr = new Float32Array(3 * n);
    for (var i = 0; i < n; i++) {
      arr[i]         = (d[i*4]/255   - LAYOUT_MEAN[0]) / LAYOUT_STD[0];
      arr[i + n]     = (d[i*4+1]/255 - LAYOUT_MEAN[1]) / LAYOUT_STD[1];
      arr[i + 2*n]   = (d[i*4+2]/255 - LAYOUT_MEAN[2]) / LAYOUT_STD[2];
    }
    return {
      tensor: new ort.Tensor('float32', arr, [1, 3, sz, sz]),
      scaleX: canvas.width  / sz,
      scaleY: canvas.height / sz
    };
  }

  // FIXME (browser-verify): DocLayNet output postprocessing.
  //
  // Common ONNX output shapes for layout-detection models:
  //   YOLOX-style:    one tensor [1, N, 6] = [x1, y1, x2, y2, score, class]
  //   DETR-style:     two tensors — boxes [1, Q, 4] + logits [1, Q, K]
  //   Centernet/FCOS: heatmap + box-regression heads
  // The function below assumes YOLOX-style. If the actual export
  // is DETR-style, this throws with a clear message and analyze()
  // falls back to the heuristic.
  function _postprocessLayoutOutput(outputs, scaleX, scaleY, opts) {
    opts = opts || {};
    var scoreThresh = opts.scoreThresh || 0.3;
    // Use the first output tensor's data — model-graph order may vary
    var firstName = Object.keys(outputs)[0];
    var t = outputs[firstName];
    if (!t || !t.dims || !t.data) {
      throw new Error('DocLayNet output missing dims or data');
    }
    var dims = t.dims;
    // Expect [1, N, 6] for YOLOX-style. Defensive: accept [N, 6] too.
    var N, C;
    if (dims.length === 3 && dims[2] === 6)      { N = dims[1]; C = 6; }
    else if (dims.length === 2 && dims[1] === 6) { N = dims[0]; C = 6; }
    else throw new Error('DocLayNet output shape ' + JSON.stringify(dims) +
                         ' not YOLOX-style [N,6] — postprocess needs verification');
    var data = t.data;
    var regions = [];
    for (var i = 0; i < N; i++) {
      var off = i * C;
      var score = data[off + 4];
      if (score < scoreThresh) continue;
      var cls = _decodeDocLayNetClass(data[off + 5]);
      var x1 = data[off]     * scaleX;
      var y1 = data[off + 1] * scaleY;
      var x2 = data[off + 2] * scaleX;
      var y2 = data[off + 3] * scaleY;
      // Clamp + skip degenerate
      if (x2 <= x1 || y2 <= y1) continue;
      regions.push({
        kind:       cls,
        bbox:       { x: x1, y: y1, w: x2 - x1, h: y2 - y1 },
        confidence: score
      });
    }
    return regions;
  }

  function _runDocLayNet(canvas) {
    return _loadLayoutSession().then(function (parts) {
      var ort = parts.ort, session = parts.session;
      var packed = _canvasToLayoutTensor(canvas, ort);
      var inputName = (session.inputNames && session.inputNames[0]) || 'images';
      var feeds = {}; feeds[inputName] = packed.tensor;
      return session.run(feeds).then(function (outputs) {
        var regions = _postprocessLayoutOutput(outputs, packed.scaleX, packed.scaleY);
        if (!regions.length) {
          throw new Error('DocLayNet produced no regions above threshold');
        }
        return {
          regions:       regions,
          usedHeuristic: false,
          usedModel:     true
        };
      });
    });
  }

  // ---------------- Public API ----------------

  function analyze(canvas, opts) {
    opts = opts || {};
    if (!canvas || !canvas.width || !canvas.height) {
      return Promise.resolve({
        regions: [], usedHeuristic: false, usedModel: false
      });
    }
    // Layout model is gated behind an opt-in flag. Keep it off by
    // default until the FIXME postprocessing is verified in a
    // browser session against the real model file. URL override:
    //   ?engine=v2&layoutModel=on
    // localStorage override:
    //   localStorage.setItem('id-layout-model', 'on')
    var modelOptIn = false;
    try {
      var flags = root.MID_INVOICE_DECODER_FLAGS;
      if (flags && flags.useLayoutModel) modelOptIn = true;
      if (root.localStorage && root.localStorage.getItem('id-layout-model') === 'on') modelOptIn = true;
      if (root.location && /[?&]layoutModel=on\b/.test(root.location.search || '')) modelOptIn = true;
    } catch (_) {}

    if (!modelOptIn) {
      return Promise.resolve(_wholePageHeuristic(canvas));
    }
    return _runDocLayNet(canvas).catch(function (err) {
      // Model failed (load, postprocess, anything). Fall back to
      // the heuristic so the v2 OCR pipeline still has regions to
      // work with. Telemetry surfaces the failure category so we
      // know which FIXME needs work first.
      try {
        if (root.plausible) root.plausible('Invoice Decoder Layout Model Failed', { props: {
          reason: (err && err.message) ? String(err.message).slice(0, 80) : 'unknown'
        } });
      } catch (_) {}
      return _wholePageHeuristic(canvas);
    });
  }

  var api = {
    analyze:                 analyze,
    DOCLAYNET_CLASSES:       DOCLAYNET_CLASSES,
    // Pure-function exports for the Node test harness
    _decodeDocLayNetClass:   _decodeDocLayNetClass,
    _wholePageHeuristic:     _wholePageHeuristic,
    _postprocessLayoutOutput:_postprocessLayoutOutput
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_LAYOUT = api;
})(typeof window !== 'undefined' ? window : null);
