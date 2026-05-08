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

  // DocLayNet class taxonomy. Audit fix — corrected to match the
  // published ds4sd order from their model card / annotations.json:
  //   1=caption, 2=footnote, 3=formula, 4=list-item, 5=page-footer,
  //   6=page-header, 7=picture, 8=section-header, 9=table,
  //   10=text, 11=title
  // The previous version had 'figure' instead of 'picture' (idx 7)
  // and 'footer' instead of 'footnote' (idx 2), which would have
  // mis-typed regions for any caller relying on `kind === 'picture'`
  // or `kind === 'footnote'`.
  var DOCLAYNET_CLASSES = [
    'caption', 'footnote', 'formula', 'list-item', 'page-footer',
    'page-header', 'picture', 'section-header', 'table', 'text',
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
    // BGR channel order to match DocLayNet training (Detectron2 /
    // YOLOX-style models from cv2-loaded images). Audit fix — see
    // ocr-engine.js _canvasToDetTensor for the same rationale.
    // Canvas getImageData returns RGBA byte order; we read
    // explicitly and place into BGR-ordered planes.
    for (var i = 0; i < n; i++) {
      var R = d[i*4]     / 255;
      var G = d[i*4 + 1] / 255;
      var B = d[i*4 + 2] / 255;
      arr[i]       = (B - LAYOUT_MEAN[0]) / LAYOUT_STD[0];   // channel 0 = B
      arr[i + n]   = (G - LAYOUT_MEAN[1]) / LAYOUT_STD[1];   // channel 1 = G
      arr[i + 2*n] = (R - LAYOUT_MEAN[2]) / LAYOUT_STD[2];   // channel 2 = R
    }
    return {
      tensor: new ort.Tensor('float32', arr, [1, 3, sz, sz]),
      scaleX: canvas.width  / sz,
      scaleY: canvas.height / sz
    };
  }

  // DocLayNet output postprocessing. Handles three common ONNX
  // export shapes so the same code path works whether the upstream
  // model variant is YOLOX, RT-DETR (the heron family), or DETR.
  //
  //   YOLOX-style    — one tensor `[1, N, 6]` = [x1, y1, x2, y2,
  //                    score, class]. Boxes are in input-pixel
  //                    coordinates (post-resize), classes are
  //                    integer indices.
  //   RT-DETR-style  — two tensors. Boxes `[1, Q, 4]` in cxcywh
  //                    normalized to [0, 1]; class logits
  //                    `[1, Q, K]` requiring sigmoid + argmax.
  //                    The heron variant from IBM Zurich's
  //                    Docling models exports this shape.
  //   Centernet/FCOS — heatmap + regression heads. Not handled
  //                    here; falls through to heuristic.
  //
  // Detection is by shape inspection rather than name (different
  // exporters use different names: `output`, `pred_boxes`,
  // `boxes`, `dets`, etc.). We accept the first tensor that
  // matches a known shape.
  //
  // Diagnostic note: the _compare/ page calls _inspectModelOutput
  // (exported below) on every load to help future browser
  // verifications surface the actual shape — see the layout-
  // diagnostic block in tools/invoice-decoder/_compare/index.html.
  function _postprocessLayoutOutput(outputs, scaleX, scaleY, opts) {
    opts = opts || {};
    var scoreThresh = opts.scoreThresh || 0.3;
    var keys = Object.keys(outputs);
    if (!keys.length) {
      throw new Error('DocLayNet output empty — no tensors returned');
    }
    // Try YOLOX-style first (single-tensor [N, 6] or [1, N, 6]).
    var yoloxRegions = _tryYoloxStyle(outputs, keys, scoreThresh, scaleX, scaleY);
    if (yoloxRegions !== null) return yoloxRegions;
    // Fall back to RT-DETR / DETR (two-tensor, normalized cxcywh + logits).
    var detrRegions = _tryDetrStyle(outputs, keys, scoreThresh, scaleX, scaleY, opts);
    if (detrRegions !== null) return detrRegions;
    // No known shape matched. Build a diagnostic message that lists
    // all output shapes so the next browser verification can read
    // it from the thrown error directly.
    var shapeSummary = keys.map(function (k) {
      var t = outputs[k];
      return k + ': ' + JSON.stringify(t && t.dims) + (t && t.data ? ' len=' + t.data.length : '');
    }).join(', ');
    throw new Error('DocLayNet output shape unrecognized — ' + shapeSummary +
                    '. Postprocess supports YOLOX-style [N,6] and RT-DETR-style ' +
                    '(boxes [1,Q,4] + logits [1,Q,K]). Inspect _inspectModelOutput ' +
                    'in tools/invoice-decoder/_compare/index.html.');
  }

  function _tryYoloxStyle(outputs, keys, scoreThresh, scaleX, scaleY) {
    // Try every output tensor that looks like [..., 6] in case the
    // upstream graph emits both a head and an aux output.
    for (var ki = 0; ki < keys.length; ki++) {
      var t = outputs[keys[ki]];
      if (!t || !t.dims || !t.data) continue;
      var dims = t.dims;
      var N, C;
      if (dims.length === 3 && dims[2] === 6)      { N = dims[1]; C = 6; }
      else if (dims.length === 2 && dims[1] === 6) { N = dims[0]; C = 6; }
      else continue;
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
        if (x2 <= x1 || y2 <= y1) continue;
        regions.push({
          kind:       cls,
          bbox:       { x: x1, y: y1, w: x2 - x1, h: y2 - y1 },
          confidence: score
        });
      }
      return regions;
    }
    return null;
  }

  function _tryDetrStyle(outputs, keys, scoreThresh, scaleX, scaleY, opts) {
    // Look for a [1, Q, 4] tensor (boxes) + a [1, Q, K] tensor (logits).
    // Q must match between the two. Accept any name (pred_boxes / boxes
    // / dets, pred_logits / logits / scores).
    var boxesT = null, logitsT = null;
    var preferredBox = ['pred_boxes', 'boxes', 'dets'];
    var preferredLogit = ['pred_logits', 'logits', 'scores'];
    function shapeIsBoxes(t)  { return t && t.dims && t.dims.length === 3 && t.dims[2] === 4; }
    function shapeIsLogits(t) { return t && t.dims && t.dims.length === 3 && t.dims[2] >= 2 && t.dims[2] !== 4; }
    for (var i = 0; i < preferredBox.length && !boxesT; i++) {
      if (outputs[preferredBox[i]] && shapeIsBoxes(outputs[preferredBox[i]])) boxesT = outputs[preferredBox[i]];
    }
    for (var j = 0; j < preferredLogit.length && !logitsT; j++) {
      if (outputs[preferredLogit[j]] && shapeIsLogits(outputs[preferredLogit[j]])) logitsT = outputs[preferredLogit[j]];
    }
    // Fallback: shape-detect across all tensors.
    if (!boxesT)  for (var k = 0; k < keys.length && !boxesT;  k++) if (shapeIsBoxes(outputs[keys[k]]))  boxesT  = outputs[keys[k]];
    if (!logitsT) for (var m = 0; m < keys.length && !logitsT; m++) if (shapeIsLogits(outputs[keys[m]])) logitsT = outputs[keys[m]];
    if (!boxesT || !logitsT) return null;
    if (boxesT.dims[1] !== logitsT.dims[1]) return null;   // Q mismatch
    var Q = boxesT.dims[1];
    var K = logitsT.dims[2];
    var bd = boxesT.data;
    var ld = logitsT.data;
    // Box-format heuristic: if all four values are in [0, 1.5], assume
    // normalized cxcywh. Otherwise assume xyxy in input pixels (1280x1280).
    var sample = Math.min(8, Q);
    var normalized = true;
    for (var s = 0; s < sample; s++) {
      var bo = s * 4;
      if (bd[bo] > 1.5 || bd[bo+1] > 1.5 || bd[bo+2] > 1.5 || bd[bo+3] > 1.5) { normalized = false; break; }
    }
    var inputSize = (opts.inputSize || 1280);
    var regions = [];
    for (var q = 0; q < Q; q++) {
      // softmax + argmax across K classes (or sigmoid for binary heads).
      var lo = q * K;
      var maxLogit = -Infinity, maxK = -1, sumExp = 0;
      for (var c = 0; c < K; c++) {
        var v = ld[lo + c];
        if (v > maxLogit) { maxLogit = v; maxK = c; }
      }
      // Convert logit to probability via softmax over the row.
      for (var c2 = 0; c2 < K; c2++) sumExp += Math.exp(ld[lo + c2] - maxLogit);
      var prob = 1 / sumExp;
      // RT-DETR commonly reserves index 0 (or the LAST index) as
      // background / no-object. Skip both extremes by default; opts
      // can override if the upstream model uses a different scheme.
      var skipBg = (opts.skipClasses || [0, K - 1]);
      if (skipBg.indexOf(maxK) !== -1) continue;
      if (prob < scoreThresh) continue;
      var bo2 = q * 4;
      var x1, y1, x2, y2;
      if (normalized) {
        // cxcywh in [0,1] → xyxy in input pixels → xyxy in canvas pixels
        var cx = bd[bo2] * inputSize, cy = bd[bo2 + 1] * inputSize;
        var w  = bd[bo2 + 2] * inputSize, h  = bd[bo2 + 3] * inputSize;
        x1 = (cx - w / 2) * scaleX; y1 = (cy - h / 2) * scaleY;
        x2 = (cx + w / 2) * scaleX; y2 = (cy + h / 2) * scaleY;
      } else {
        x1 = bd[bo2]     * scaleX; y1 = bd[bo2 + 1] * scaleY;
        x2 = bd[bo2 + 2] * scaleX; y2 = bd[bo2 + 3] * scaleY;
      }
      if (x2 <= x1 || y2 <= y1) continue;
      regions.push({
        kind:       _decodeDocLayNetClass(maxK),
        bbox:       { x: x1, y: y1, w: x2 - x1, h: y2 - y1 },
        confidence: prob
      });
    }
    return regions;
  }

  // Diagnostic helper for _compare/ page. Returns a structured
  // description of a model output dict — names, shapes, sample
  // values — without consuming the tensor (the caller still needs
  // to dispose). Useful when verifying a new ONNX export.
  function _inspectModelOutput(outputs) {
    if (!outputs || typeof outputs !== 'object') return { error: 'no outputs' };
    var keys = Object.keys(outputs);
    return {
      keys: keys,
      tensors: keys.map(function (k) {
        var t = outputs[k];
        var dims = (t && t.dims) ? Array.from(t.dims) : null;
        var dataLen = (t && t.data && t.data.length) || 0;
        var sample = null;
        try {
          if (t && t.data && t.data.length >= 4) {
            sample = [t.data[0], t.data[1], t.data[2], t.data[3]];
          }
        } catch (_) {}
        return { name: k, dims: dims, dataLen: dataLen, sampleHead: sample };
      })
    };
  }

  function _runDocLayNet(canvas) {
    return _loadLayoutSession().then(function (parts) {
      var ort = parts.ort, session = parts.session;
      var packed = _canvasToLayoutTensor(canvas, ort);
      var inputName = (session.inputNames && session.inputNames[0]) || 'images';
      var feeds = {}; feeds[inputName] = packed.tensor;
      return session.run(feeds).then(function (outputs) {
        // Audit fix: copy WASM-heap-backed output data + dims into JS-side
        // structures BEFORE disposing tensors. _postprocessLayoutOutput
        // reads t.dims + t.data which become invalid after dispose.
        // Without the copy + dispose chain, every call leaks the input
        // tensor (~19 MB float32 at 1280×1280×3) plus every output tensor
        // (often tens of MB) — 50 invoices in a row OOMs iPhone Safari.
        // We dispose BEFORE postprocess so a shape-mismatch throw still
        // releases tensors instead of leaking on the error path.
        var firstName = Object.keys(outputs)[0];
        var firstOut  = outputs[firstName];
        var dataCopy  = (firstOut && firstOut.data) ? new Float32Array(firstOut.data) : null;
        var dimsCopy  = (firstOut && firstOut.dims) ? Array.from(firstOut.dims) : null;
        try {
          if (packed.tensor.dispose) packed.tensor.dispose();
          Object.keys(outputs).forEach(function (k) {
            if (outputs[k] && outputs[k].dispose) outputs[k].dispose();
          });
        } catch (_) {}
        var synthOutputs = {};
        synthOutputs[firstName] = { dims: dimsCopy, data: dataCopy };
        var regions = _postprocessLayoutOutput(synthOutputs, packed.scaleX, packed.scaleY);
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
      //
      // Audit fix (privacy H1): the previous version sent
      // `String(err.message).slice(0, 80)` directly to plausible.
      // Most failures here are model-shape mismatches with terse
      // English messages, but a future change to
      // _postprocessLayoutOutput could throw with a message that
      // quotes coordinates or text fragments derived from the
      // invoice canvas. Map every error to one of a small enum of
      // reason codes so no input-derived data can ever flow into
      // the analytics props.
      try {
        if (root.plausible) root.plausible('Invoice Decoder Layout Model Failed', { props: {
          reason: _classifyLayoutError(err)
        } });
      } catch (_) {}
      return _wholePageHeuristic(canvas);
    });
  }

  function _classifyLayoutError(err) {
    var msg = (err && err.message) ? String(err.message) : '';
    if (!msg) return 'unknown';
    // Order matters — the postprocess "no regions above threshold"
    // message must be matched before the generic shape-mismatch.
    if (/no regions above threshold/i.test(msg))   return 'no-regions';
    if (/missing dims or data/i.test(msg))          return 'missing-output';
    if (/not YOLOX-style/i.test(msg))               return 'shape-mismatch';
    if (/failed to load|404|http /i.test(msg))      return 'load-fail';
    if (/wasm|webassembly|out of memory/i.test(msg)) return 'wasm-fail';
    return 'unknown';
  }

  var api = {
    analyze:                 analyze,
    DOCLAYNET_CLASSES:       DOCLAYNET_CLASSES,
    // Pure-function exports for the Node test harness
    _decodeDocLayNetClass:   _decodeDocLayNetClass,
    _wholePageHeuristic:     _wholePageHeuristic,
    _postprocessLayoutOutput:_postprocessLayoutOutput,
    _inspectModelOutput:     _inspectModelOutput
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_LAYOUT = api;
})(typeof window !== 'undefined' ? window : null);
