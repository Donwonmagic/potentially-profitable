/**
 * Invoice Decoder — Stage 3: ONNX-based OCR engine (engine wired).
 *
 * The v2 recognition core. Replaces Tesseract.js as the default OCR
 * pipeline behind the engineV2 feature flag. Architecture borrows
 * Docling's intent (layout-first, region-aware OCR) but uses
 * redistributable Apache-2.0 ONNX models.
 *
 * Lean tier (every device): PP-OCRv3 mobile det + rec.
 *   det model: ~4.5 MB — DBNet detection head, outputs probability map
 *   rec model: ~10  MB — CRNN sequence recognition, outputs CTC logits
 *   dict:      ~5   KB — English + Latin character set
 *
 * Pipeline per recognize() call:
 *   1. Resize canvas to det input (long edge → 736 px, multiple of 32)
 *   2. Normalize per PP-OCR mean/std → NCHW float32 tensor
 *   3. Run det session → probability map (1, 1, H, W)
 *   4. DB postprocess: threshold → connected components → axis-aligned
 *      bboxes (oriented bbox fitting deferred — invoices are mostly
 *      axis-aligned; the < 5° tilt the EXIF fix at preprocess.js:418
 *      already corrects for catches the residual).
 *   5. Unclip each bbox (expand by 6 px outward) so glyph ascenders
 *      / descenders aren't truncated.
 *   6. Crop each bbox from the original canvas, resize to rec input
 *      (height 48 px, width preserved at 4:1 max aspect).
 *   7. Batch crops through rec session in chunks of 8.
 *   8. CTC decode each output: argmax along char-dim, collapse
 *      consecutive repeats, drop the blank token at index 0.
 *   9. Group lines by Y-coordinate so multi-word lines stitch
 *      together in reading order.
 *   10. Return OcrResult shape (text, lines, meanConfidence,
 *      detectionStats) so the existing parse.js consumes it
 *      unchanged.
 *
 * Confidence-floor fallback: if mean recognition confidence < 0.2,
 * throw OcrError(IMAGE_QUALITY). Catches "engine ran but output is
 * garbage" so the shim's V1 fallback covers it. Real failures
 * (model load, OOM) throw earlier with their own codes.
 *
 * Privacy posture: same-origin only. ORT WASM + ONNX models all
 * resolved through MID_VENDORS_CFG.resolve. No external fetch.
 * Covered by check-no-invoice-egress.mjs.
 *
 * Testability: the pure functions (_ctcDecode, _dbPostprocess,
 * _unclip, _groupLinesByY) are exposed on the public api as
 * underscore-prefixed names for the Node test harness. ORT
 * inference itself can only be exercised in a browser.
 */
(function (root) {
  'use strict';

  // ---------------- Errors ----------------
  function OcrError(code, message) {
    var e = new Error(message || code);
    e.code = code;
    e.retryable = (code !== 'IMAGE_QUALITY' && code !== 'OUT_OF_MEMORY');
    return e;
  }

  // ---------------- ORT loader (cached) ----------------
  var _ortPromise = null;
  function loadOrt() {
    if (_ortPromise) return _ortPromise;
    var cfg = root && root.MID_VENDORS_CFG;
    if (!cfg || typeof cfg.importModule !== 'function') {
      return Promise.reject(OcrError('ENGINE_LOAD', 'vendor-config module missing'));
    }
    _ortPromise = cfg.importModule('ortMjs').then(function (mod) {
      var ort = mod && (mod.default || mod);
      if (!ort || !ort.InferenceSession) {
        throw OcrError('ENGINE_LOAD', 'onnxruntime-web loaded but InferenceSession missing');
      }
      // Configure WASM paths to same-origin. Without this, ORT
      // tries to fetch its WASM blobs from the script's URL parent
      // — which works for our self-hosted layout but is brittle
      // if the deploy URL ever moves. Explicit pinning is safer.
      try {
        if (ort.env && ort.env.wasm) {
          var ortVer = cfg.ORT_VERSION || '1.20.1';
          ort.env.wasm.wasmPaths = '/assets/vendor/onnxruntime-web@' + ortVer + '/';
          // Single-thread by default. Multi-thread WASM requires
          // crossOriginIsolated (Cross-Origin-Opener-Policy: same-
          // origin + Cross-Origin-Embedder-Policy: require-corp).
          //
          // Audit fix (build H1) — explicit decision to stay
          // single-thread for this branch. Enabling COOP/COEP site-
          // wide breaks embedded cross-origin resources (Google
          // Fonts at gstatic.com, third-party blog embeds, etc.)
          // that don't ship Cross-Origin-Resource-Policy headers.
          // A path-scoped /tools/invoice-decoder/* COOP+COEP block
          // would limit blast radius but still requires every
          // external asset the page loads (gstatic fonts in CSS,
          // analytics, etc.) to have the right CORP header. Deferred
          // until a deploy-time smoke test verifies no resource is
          // broken — single-thread WASM is functional, just slower
          // (the lean-tier ORT runs invoices in 5-15s on a 2024
          // mid-tier phone vs 2-5s threaded; acceptable for now).
          // Operators on capable devices already get WebGPU when
          // navigator.gpu is present, which sidesteps WASM threading.
          ort.env.wasm.numThreads = 1;
          ort.env.wasm.simd = true;
        }
      } catch (_) { /* defensive — ORT versions differ slightly */ }
      return ort;
    }).catch(function (err) {
      _ortPromise = null;   // allow retry
      throw OcrError('WASM_COMPILE', 'ORT init failed: ' + (err && err.message || err));
    });
    return _ortPromise;
  }

  // ---------------- Model session loader (cached per tier) ----------------
  var _sessionCache = Object.create(null);
  function _loadSession(ort, urlKey) {
    if (_sessionCache[urlKey]) return _sessionCache[urlKey];
    var cfg = root.MID_VENDORS_CFG;
    var url = (cfg && cfg.SELF && cfg.SELF[urlKey]) || null;
    if (!url) return Promise.reject(OcrError('MODEL_LOAD', 'no URL for ' + urlKey));
    _sessionCache[urlKey] = ort.InferenceSession.create(url, {
      executionProviders: ['wasm']
    }).catch(function (err) {
      delete _sessionCache[urlKey];
      throw OcrError('MODEL_LOAD',
        'failed to load model ' + urlKey + ' from ' + url + ': ' + (err && err.message || err));
    });
    return _sessionCache[urlKey];
  }

  // ---------------- Char dictionary loader (cached) ----------------
  var _dictCache = Object.create(null);
  function _loadDict(urlKey) {
    if (_dictCache[urlKey]) return _dictCache[urlKey];
    var cfg = root.MID_VENDORS_CFG;
    var url = (cfg && cfg.SELF && cfg.SELF[urlKey]) || null;
    if (!url) return Promise.reject(OcrError('MODEL_LOAD', 'no URL for ' + urlKey));
    // cache: 'force-cache' — the dict file is content-addressed via
    // the vendor-config version and never changes for a given
    // PPOCR_V*_VERSION. Audit fix to drop the 200-800 ms cellular
    // revalidation cost on every cold start.
    _dictCache[urlKey] = fetch(url, {  // h8-exempt: same-origin PP-OCR dict file load (vendor bootstrap)
      credentials: 'omit',
      cache:       'force-cache'
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (txt) {
      // PP-OCR convention: each line is one char; index 0 is
      // RESERVED for the CTC blank token. So actual chars start
      // at index 1.
      var chars = txt.split(/\r?\n/).filter(function (s) { return s.length > 0; });
      return ['<blank>'].concat(chars);
    }).catch(function (err) {
      delete _dictCache[urlKey];
      throw OcrError('MODEL_LOAD', 'failed to load dict: ' + (err && err.message || err));
    });
    return _dictCache[urlKey];
  }

  // ---------------- Tier resolution ----------------
  function _resolveTier() {
    try {
      var dt = root.MID_DEVICE_TIER;
      if (dt && typeof dt.tier === 'function') return dt.tier();
    } catch (_) {}
    return 'lean';
  }

  function _modelKeysForTier(tier) {
    // Capable tier silently upgrades to PP-OCRv4 once the background
    // fetch completes. Until then everyone is on v3 — that's the
    // default that ships with this module.
    if (tier === 'heavy' || tier === 'capable') {
      return { det: 'ppocrV4Det', rec: 'ppocrV4Rec', dict: 'ppocrV4Dict' };
    }
    return { det: 'ppocrV3Det', rec: 'ppocrV3Rec', dict: 'ppocrV3Dict' };
  }

  // ---------------- Image normalization for det ----------------
  // PP-OCR det expects a NCHW float32 tensor with mean / std
  // normalization. The exact constants are from the PP-OCR
  // training config — same numbers RapidOCR + PaddleOCR use.
  var DET_MEAN = [0.485, 0.456, 0.406];
  var DET_STD  = [0.229, 0.224, 0.225];
  // Detection target size: long-edge resized to 736 (a multiple of
  // 32, which matches the model's downsampling factor). Short edge
  // is padded to a multiple of 32. 736 balances accuracy and speed
  // on phone-sized invoices.
  var DET_LONG_EDGE = 736;

  function _resizeForDet(canvas) {
    var w = canvas.width, h = canvas.height;
    var scale = DET_LONG_EDGE / Math.max(w, h);
    // Math.ceil (audit fix) so a 1000×750 canvas with scale 0.736
    // resizes to a stride-32-aligned 736×576 instead of dropping 8
    // px of content via Math.round-down. Floor of 32 prevents zero
    // dims on tiny inputs.
    var resizedW = Math.max(32, Math.ceil(w * scale / 32) * 32);
    var resizedH = Math.max(32, Math.ceil(h * scale / 32) * 32);
    var out = root.document.createElement('canvas');
    out.width = resizedW;
    out.height = resizedH;
    var ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, resizedW, resizedH);
    return { canvas: out, scaleX: w / resizedW, scaleY: h / resizedH };
  }

  function _canvasToDetTensor(ort, resized) {
    var c = resized.canvas;
    var ctx = c.getContext('2d');
    var img = ctx.getImageData(0, 0, c.width, c.height);
    var d = img.data;
    var n = c.width * c.height;
    var arr = new Float32Array(3 * n);
    // NCHW layout in **BGR channel order**. PP-OCR was trained on
    // cv2-loaded BGR images; the mean/std vectors below are
    // applied to BGR-ordered channels (channel 0 = B, 1 = G,
    // 2 = R). Audit catch from senior-CV review — ImageNet
    // [0.485, 0.456, 0.406] looks RGB but PaddleOCR's inference
    // pipeline uses it against cv2-native BGR pixels with no
    // cvtColor step. Canvas getImageData always returns RGBA
    // (byte 0 = R, byte 1 = G, byte 2 = B), so we explicitly
    // swap byte-0 and byte-2 here.
    for (var i = 0; i < n; i++) {
      var R = d[i * 4]     / 255;
      var G = d[i * 4 + 1] / 255;
      var B = d[i * 4 + 2] / 255;
      arr[i]         = (B - DET_MEAN[0]) / DET_STD[0];   // channel 0 = B
      arr[i + n]     = (G - DET_MEAN[1]) / DET_STD[1];   // channel 1 = G
      arr[i + 2 * n] = (R - DET_MEAN[2]) / DET_STD[2];   // channel 2 = R
    }
    return new ort.Tensor('float32', arr, [1, 3, c.height, c.width]);
  }

  // ---------------- DB postprocess ----------------
  // Differentiable Binarization: turn the prob map into bboxes.
  // Pragmatic implementation:
  //   1. Threshold at 0.3 → binary mask
  //   2. Connected components (4-neighbourhood flood-fill) → regions
  //   3. For each region: compute axis-aligned bbox + mean prob inside
  //   4. Filter by min area (28 px²) and min mean prob (0.6)
  //   5. Unclip by 6 px outward to capture ascenders/descenders
  // We skip the standard "fit oriented min-area rect" step because
  // it's a lot of code for marginal gain on near-axis-aligned text
  // (which our preprocess EXIF fix already corrects for).
  function _dbPostprocess(probMap, w, h, opts) {
    opts = opts || {};
    var threshold   = opts.threshold   || 0.3;
    var minArea     = opts.minArea     || 28;
    var minMeanProb = opts.minMeanProb || 0.6;

    // Threshold to binary mask (Uint8Array, values 0 or 1)
    var mask = new Uint8Array(w * h);
    for (var i = 0; i < probMap.length; i++) mask[i] = probMap[i] > threshold ? 1 : 0;

    // Connected components via iterative flood-fill (4-neighbour).
    // We track per-component min/max x/y + sum of prob values so
    // we get the bbox + mean prob in one pass.
    var labels = new Int32Array(w * h);   // 0 = unlabeled / background
    var nextLabel = 1;
    var components = [];
    var queue = new Int32Array(w * h);    // re-used flood-fill queue

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var idx = y * w + x;
        if (!mask[idx] || labels[idx]) continue;
        // New component — flood fill.
        var label = nextLabel++;
        labels[idx] = label;
        var qHead = 0, qTail = 0;
        queue[qTail++] = idx;
        var minX = x, maxX = x, minY = y, maxY = y;
        var sumProb = 0, count = 0;
        while (qHead < qTail) {
          var p = queue[qHead++];
          var py = (p / w) | 0, px = p - py * w;
          sumProb += probMap[p];
          count++;
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
          // 4-neighbours
          if (px > 0     && mask[p - 1] && !labels[p - 1])     { labels[p - 1] = label;     queue[qTail++] = p - 1; }
          if (px < w - 1 && mask[p + 1] && !labels[p + 1])     { labels[p + 1] = label;     queue[qTail++] = p + 1; }
          if (py > 0     && mask[p - w] && !labels[p - w])     { labels[p - w] = label;     queue[qTail++] = p - w; }
          if (py < h - 1 && mask[p + w] && !labels[p + w])     { labels[p + w] = label;     queue[qTail++] = p + w; }
        }
        var area = count;
        var meanProb = sumProb / count;
        if (area < minArea || meanProb < minMeanProb) continue;
        components.push({
          x0: minX, y0: minY, x1: maxX + 1, y1: maxY + 1,
          area: area, meanProb: meanProb
        });
      }
    }
    return components;
  }

  // Unclip each bbox: expand by `unclipPx` on each side. Without
  // this, the recognition crops cut off ascenders / descenders,
  // costing accuracy on most fonts.
  //
  // FIXME (CV-audit follow-up): replace with PP-OCR's Vatti-style
  // proportional unclip — `dist = (boxArea * 1.6) / boxPerimeter`,
  // expand by `dist` in det-space before the scale-back to source.
  // The current fixed-px expansion is wrong for two reasons:
  //   (1) det-space expansion of N px scales differently per
  //       canvas (a 6 px expansion = ~25 src-px on a 4000-px
  //       photo, ~2 src-px on an 800-px capture)
  //   (2) small bboxes need proportionally more unclip than large
  //       ones to capture full glyph extents
  // Closed-form, ~6 lines. Lands when the team gets browser
  // verification time on real PP-OCR output.
  function _unclip(bboxes, w, h, unclipPx) {
    if (unclipPx == null) unclipPx = 6;
    var out = new Array(bboxes.length);
    for (var i = 0; i < bboxes.length; i++) {
      var b = bboxes[i];
      out[i] = {
        x0: Math.max(0,        b.x0 - unclipPx),
        y0: Math.max(0,        b.y0 - unclipPx),
        x1: Math.min(w,        b.x1 + unclipPx),
        y1: Math.min(h,        b.y1 + unclipPx),
        meanProb: b.meanProb
      };
    }
    return out;
  }

  // ---------------- Crop + resize for rec ----------------
  // PP-OCR rec model expects a 48px-tall RGB tensor with width
  // proportional to aspect ratio, max 320 px (longer crops are
  // resized to fit). We pad short crops up to a max-batch width
  // outside this function so all crops in a batch share width.
  var REC_HEIGHT     = 48;
  var REC_MAX_WIDTH  = 320;
  // PP-OCR rec normalization: [0.5, 0.5, 0.5] mean and std for
  // the v3 mobile rec model. (Different from det; rec uses a
  // simpler unit-normal-ish normalization.)
  var REC_MEAN = [0.5, 0.5, 0.5];
  var REC_STD  = [0.5, 0.5, 0.5];

  // FIXME (CV-audit follow-up): for invoice rows running >10:1
  // aspect at 48 px height (long descriptions like "BONELESS
  // CHICKEN BREAST 5LB CASE QUANTITY 12"), targetW hits the
  // REC_MAX_WIDTH cap and we resize-down the source horizontally.
  // PP-OCR reference splits at >10:1 into N=ceil(targetW/320)
  // overlapping crops (~16 px overlap), recognizes each, then
  // concatenates the decoded strings dropping the overlap. The
  // single highest-leverage rec-accuracy fix on long line items.
  // Lands with the Vatti unclip in the same browser-verification
  // session.
  function _cropToCanvas(srcCanvas, bbox) {
    var bw = bbox.x1 - bbox.x0;
    var bh = bbox.y1 - bbox.y0;
    if (bw < 1 || bh < 1) return null;
    var aspect = bw / bh;
    var targetW = Math.round(REC_HEIGHT * aspect);
    if (targetW > REC_MAX_WIDTH) targetW = REC_MAX_WIDTH;
    if (targetW < 1) targetW = 1;
    var out = root.document.createElement('canvas');
    out.width = targetW;
    out.height = REC_HEIGHT;
    var ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(srcCanvas, bbox.x0, bbox.y0, bw, bh, 0, 0, targetW, REC_HEIGHT);
    return out;
  }

  // Build a batched NCHW tensor with all crops padded to the max
  // width in the batch. Returns { tensor, perCropWidths }.
  function _cropsToRecTensor(ort, crops) {
    var maxW = 0;
    for (var i = 0; i < crops.length; i++) if (crops[i].width > maxW) maxW = crops[i].width;
    // Round up to a multiple of 16 — many ONNX runtimes pick up
    // small kernels for non-multiples-of-16 widths.
    maxW = Math.ceil(maxW / 16) * 16 || 16;
    var n = crops.length;
    var arr = new Float32Array(n * 3 * REC_HEIGHT * maxW);
    var perCrop = 3 * REC_HEIGHT * maxW;
    var perChan = REC_HEIGHT * maxW;
    var widths = new Array(n);
    for (var c = 0; c < n; c++) {
      var ctx = crops[c].getContext('2d');
      var img = ctx.getImageData(0, 0, crops[c].width, crops[c].height);
      var d = img.data;
      widths[c] = crops[c].width;
      // BGR channel order to match PP-OCR training (audit fix —
      // see _canvasToDetTensor for the full rationale). REC_MEAN
      // and REC_STD are channel-symmetric [0.5,0.5,0.5] so this
      // change is conservative for rec specifically, but kept
      // consistent across all three tensor builders so a future
      // dict / model swap to a non-symmetric normalization
      // doesn't silently regress.
      // Padding (cells past crops[c].width) stays 0 in normalized
      // space — matches RapidOCR / PaddleOCR reference's np.zeros
      // padding (mid-grey in raw pixel terms; the model is
      // trained to ignore it).
      for (var y = 0; y < REC_HEIGHT; y++) {
        for (var x = 0; x < crops[c].width; x++) {
          var pi = (y * crops[c].width + x) * 4;
          var R = d[pi]     / 255;
          var G = d[pi + 1] / 255;
          var B = d[pi + 2] / 255;
          var off = c * perCrop + y * maxW + x;
          arr[off]               = (B - REC_MEAN[0]) / REC_STD[0];   // channel 0 = B
          arr[off + perChan]     = (G - REC_MEAN[1]) / REC_STD[1];   // channel 1 = G
          arr[off + perChan * 2] = (R - REC_MEAN[2]) / REC_STD[2];   // channel 2 = R
        }
      }
    }
    return {
      tensor: new ort.Tensor('float32', arr, [n, 3, REC_HEIGHT, maxW]),
      perCropWidths: widths,
      paddedWidth: maxW
    };
  }

  // ---------------- CTC decode ----------------
  // Given logits of shape [N, T, C], produce per-line text + conf.
  // Algorithm: argmax along C → sequence of token IDs → collapse
  // consecutive repeats → drop the blank token (id 0) → look up
  // chars via the dict. Confidence is the mean softmax prob of
  // the selected (non-blank) tokens.
  function _ctcDecode(logits, dims, dict) {
    // logits is a flat Float32Array of length N*T*C.
    var N = dims[0], T = dims[1], C = dims[2];
    var out = new Array(N);
    var perBatch = T * C;
    for (var n = 0; n < N; n++) {
      var batchOff = n * perBatch;
      var prevId = -1;
      var charsOut = [];
      var sumProb = 0, kept = 0;
      for (var t = 0; t < T; t++) {
        var rowOff = batchOff + t * C;
        // Argmax + softmax-of-argmax (we don't need full softmax
        // for confidence; the max logit's softmax is sufficient
        // for relative ranking and cheaper to compute).
        var maxId = 0;
        var maxVal = logits[rowOff];
        for (var c = 1; c < C; c++) {
          var v = logits[rowOff + c];
          if (v > maxVal) { maxVal = v; maxId = c; }
        }
        // Softmax-of-max — compute denominator
        var denom = 0;
        for (var c2 = 0; c2 < C; c2++) denom += Math.exp(logits[rowOff + c2] - maxVal);
        var prob = 1 / denom;
        if (maxId !== 0 && maxId !== prevId) {
          if (maxId < dict.length) charsOut.push(dict[maxId]);
          else charsOut.push('?');
          sumProb += prob;
          kept++;
        }
        prevId = maxId;
      }
      out[n] = {
        text: charsOut.join(''),
        confidence: kept ? sumProb / kept : 0
      };
    }
    return out;
  }

  // ---------------- Group line crops by Y-coordinate ----------------
  // PP-OCR detection emits one bbox per text region — sometimes a
  // single visual line splits across multiple bboxes (long lines,
  // or noisy splits). We re-stitch by Y proximity: bboxes whose Y
  // centres fall within a tolerance band are treated as the same
  // line and their texts joined left-to-right.
  function _groupLinesByY(bboxesWithText, opts) {
    opts = opts || {};
    if (!bboxesWithText.length) return [];
    var yTol = opts.yTol || 8;
    // Sort by Y centre
    var items = bboxesWithText.slice().sort(function (a, b) {
      return ((a.bbox.y0 + a.bbox.y1) - (b.bbox.y0 + b.bbox.y1)) / 2;
    });
    var lines = [];
    var current = [items[0]];
    var currentMidY = (items[0].bbox.y0 + items[0].bbox.y1) / 2;
    for (var i = 1; i < items.length; i++) {
      var midY = (items[i].bbox.y0 + items[i].bbox.y1) / 2;
      if (Math.abs(midY - currentMidY) <= yTol) {
        current.push(items[i]);
      } else {
        lines.push(_finalizeLine(current));
        current = [items[i]];
        currentMidY = midY;
      }
    }
    lines.push(_finalizeLine(current));
    return lines;
  }
  function _finalizeLine(items) {
    // Sort items left-to-right within the line
    items.sort(function (a, b) { return a.bbox.x0 - b.bbox.x0; });
    var text = items.map(function (it) { return it.text; }).join(' ');
    var conf = items.length
      ? items.reduce(function (s, it) { return s + (it.confidence || 0); }, 0) / items.length
      : 0;
    var x0 = Math.min.apply(Math, items.map(function (it) { return it.bbox.x0; }));
    var y0 = Math.min.apply(Math, items.map(function (it) { return it.bbox.y0; }));
    var x1 = Math.max.apply(Math, items.map(function (it) { return it.bbox.x1; }));
    var y1 = Math.max.apply(Math, items.map(function (it) { return it.bbox.y1; }));
    return {
      text: text,
      confidence: conf,
      bbox: { x0: x0, y0: y0, x1: x1, y1: y1 },
      words: items.map(function (it) {
        return { text: it.text, bbox: it.bbox, confidence: it.confidence };
      })
    };
  }

  // ---------------- Rec batching ----------------
  // Process crops in chunks so we don't allocate one giant tensor
  // for an invoice with hundreds of detections. Batch size 8
  // balances throughput against peak memory on phones.
  var REC_BATCH_SIZE = 8;
  function _runRec(ort, recSession, crops, dict, onProgress) {
    var results = new Array(crops.length);
    var done = 0;
    function processBatch(start) {
      if (start >= crops.length) return Promise.resolve(results);
      var batch = crops.slice(start, start + REC_BATCH_SIZE);
      var packed = _cropsToRecTensor(ort, batch);
      var feeds = {};
      // PP-OCR rec model input name varies — try common names.
      // The model graph's first input is the only one we feed.
      var inputName = (recSession.inputNames && recSession.inputNames[0]) || 'x';
      feeds[inputName] = packed.tensor;
      return recSession.run(feeds).then(function (out) {
        var outName = (recSession.outputNames && recSession.outputNames[0]) ||
                      Object.keys(out)[0];
        var t = out[outName];
        var dims = t.dims;
        // COPY the data before disposing — OrtTensor.data is a
        // typed-array view into the WASM heap and gets invalidated
        // on dispose. Audit fix: without the copy + dispose chain
        // a 200-line invoice processed in 25 batches leaks ~25
        // [8, 80, 6625] float32 tensors (~17 MB each) until the
        // next GC, which is enough to OOM iPhone Safari.
        var data = new Float32Array(t.data);
        var decoded = _ctcDecode(data, dims, dict);
        try {
          if (t.dispose) t.dispose();
          Object.keys(out).forEach(function (k) {
            if (out[k] !== t && out[k].dispose) out[k].dispose();
          });
        } catch (_) {}
        try { if (packed.tensor.dispose) packed.tensor.dispose(); } catch (_) {}
        for (var i = 0; i < decoded.length; i++) results[start + i] = decoded[i];
        done += batch.length;
        if (onProgress) try { onProgress(done / crops.length); } catch (_) {}
        return processBatch(start + REC_BATCH_SIZE);
      });
    }
    return processBatch(0);
  }

  // ---------------- Public recognize ----------------
  // Per-region API: regions[] is from MID_LAYOUT.analyze. When the
  // single 'page' region is passed, this is whole-page OCR. When
  // a layout model later identifies header/table/totals regions,
  // each gets its own OCR pass with optional per-region biasing.
  // (Per-region biasing is a follow-up; today every region uses
  // the same det+rec models.)
  // iOS Safari caps <canvas> total area at ~16.7 M px (effectively
  // 4096 × 4096 on iPhone). Multi-page PDF renders that exceed
  // this limit silently produce a blank canvas — feeding all-zero
  // pixels to the det model returns no detections and we'd surface
  // a misleading IMAGE_QUALITY error. Audit fix: clamp explicitly
  // here and surface a specific code that the controller can copy
  // for ("the page is too large; try splitting").
  var IOS_CANVAS_MAX_AREA = 16777216;   // 4096 * 4096

  function recognize(canvas, regions, opts) {
    opts = opts || {};
    if (!canvas || !canvas.width || !canvas.height) {
      return Promise.reject(OcrError('IMAGE_QUALITY', 'no canvas given'));
    }
    if (canvas.width * canvas.height > IOS_CANVAS_MAX_AREA) {
      return Promise.reject(OcrError('IMAGE_QUALITY',
        'canvas exceeds iOS Safari area cap (' + canvas.width + '×' +
        canvas.height + ' > 4096×4096) — page too large for in-browser OCR'));
    }
    var tier = _resolveTier();
    var keys = _modelKeysForTier(tier);
    var onProgress = opts.onProgress || function () {};

    return loadOrt().then(function (ort) {
      onProgress(0.05);
      return Promise.all([
        _loadSession(ort, keys.det),
        _loadSession(ort, keys.rec),
        _loadDict(keys.dict)
      ]).then(function (parts) {
        onProgress(0.20);
        var detSession = parts[0], recSession = parts[1], dict = parts[2];
        // Detection
        var resized = _resizeForDet(canvas);
        var detTensor = _canvasToDetTensor(ort, resized);
        var detInputName = (detSession.inputNames && detSession.inputNames[0]) || 'x';
        var detFeeds = {}; detFeeds[detInputName] = detTensor;
        return detSession.run(detFeeds).then(function (detOut) {
          onProgress(0.45);
          var detOutName = (detSession.outputNames && detSession.outputNames[0]) ||
                           Object.keys(detOut)[0];
          var probMapTensor = detOut[detOutName];
          var probDims = probMapTensor.dims;
          // Expect [1, 1, H, W]. Defensive — some exports use
          // [1, H, W] without the channel dim.
          var probH = probDims[probDims.length - 2];
          var probW = probDims[probDims.length - 1];
          // COPY before disposing — see _runRec for the same
          // pattern and rationale (OrtTensor.data is a WASM-heap
          // view that gets invalidated on dispose).
          var probData = new Float32Array(probMapTensor.data);
          try {
            if (detTensor.dispose) detTensor.dispose();
            Object.keys(detOut).forEach(function (k) {
              if (detOut[k].dispose) detOut[k].dispose();
            });
          } catch (_) {}
          // DB postprocess in detection-input coordinates
          var bboxesIn = _dbPostprocess(probData, probW, probH, opts.dbOpts);
          // Unclip slightly for ascender/descender capture
          var unclipped = _unclip(bboxesIn, probW, probH, opts.unclipPx);
          // Map back to original canvas coordinates. Use floor on
          // x0/y0 + ceil on x1/y1 (audit fix) so a 1-px-wide bbox
          // never collapses to zero after rounding.
          var bboxesSrc = unclipped.map(function (b) {
            return {
              x0: Math.floor(b.x0 * resized.scaleX),
              y0: Math.floor(b.y0 * resized.scaleY),
              x1: Math.ceil(b.x1 * resized.scaleX),
              y1: Math.ceil(b.y1 * resized.scaleY),
              meanProb: b.meanProb
            };
          });
          // Crop each bbox from the original canvas
          var crops = [];
          var cropToBbox = [];
          for (var i = 0; i < bboxesSrc.length; i++) {
            var c = _cropToCanvas(canvas, bboxesSrc[i]);
            if (c) { crops.push(c); cropToBbox.push(bboxesSrc[i]); }
          }
          // Detection stats — surfaced for the diagnostic at
          // invoice-decoder.js:2944 zero-rows hint branching.
          var meanAspect = 0;
          if (bboxesSrc.length) {
            var sumAspect = 0;
            for (var ai = 0; ai < bboxesSrc.length; ai++) {
              var bw = bboxesSrc[ai].x1 - bboxesSrc[ai].x0;
              var bh = bboxesSrc[ai].y1 - bboxesSrc[ai].y0;
              sumAspect += bh > 0 ? bw / bh : 0;
            }
            meanAspect = sumAspect / bboxesSrc.length;
          }
          var detectionStats = {
            candidateBoxes: bboxesSrc.length,
            meanAspect:     meanAspect,
            meanConfidence: bboxesSrc.length
              ? bboxesSrc.reduce(function (s, b) { return s + b.meanProb; }, 0) / bboxesSrc.length
              : 0
          };
          if (!crops.length) {
            // Detection found nothing. Surface as IMAGE_QUALITY so
            // the shim's V1 fallback runs (Tesseract may pick up
            // text that PP-OCR's detector missed).
            throw OcrError('IMAGE_QUALITY', 'detection found no text regions');
          }
          // Recognition (batched)
          return _runRec(ort, recSession, crops, dict, function (p) {
            onProgress(0.45 + p * 0.5);
          }).then(function (decoded) {
            onProgress(0.97);
            // Pair each decoded result with its source bbox
            var withBboxes = [];
            for (var ri = 0; ri < decoded.length; ri++) {
              if (!decoded[ri].text) continue;   // skip empty decodes
              withBboxes.push({
                text:       decoded[ri].text,
                confidence: decoded[ri].confidence,
                bbox:       cropToBbox[ri]
              });
            }
            // Group bboxes by Y proximity into reading-order lines
            var lines = _groupLinesByY(withBboxes, opts.lineGroupOpts);
            // Mean confidence (in 0..1 scale — distinct from
            // Tesseract's 0..100 so the controller's confidence
            // bands need to know which scale they're getting).
            // We multiply by 100 so downstream code that treats
            // confidence as 0..100 (matching Tesseract) keeps
            // working without a switch.
            var meanConf = 0;
            if (lines.length) {
              meanConf = lines.reduce(function (s, l) { return s + (l.confidence || 0); }, 0) / lines.length;
            }
            // Confidence-floor fallback: if the average rec
            // confidence is below 0.2, we don't trust the output
            // — throw so the shim falls through to V1 instead of
            // returning garbage that looks structurally correct.
            if (lines.length && meanConf < 0.2) {
              throw OcrError('IMAGE_QUALITY',
                'recognition confidence too low (' + meanConf.toFixed(2) + ')');
            }
            // Scale to 0..100 to match Tesseract conventions so
            // the existing confidence chips at invoice-decoder.js
            // line 1005-1009 / 3005-3014 keep working.
            for (var li = 0; li < lines.length; li++) {
              lines[li].confidence = Math.round(lines[li].confidence * 100);
              if (lines[li].words) {
                for (var wi = 0; wi < lines[li].words.length; wi++) {
                  lines[li].words[wi].confidence = Math.round((lines[li].words[wi].confidence || 0) * 100);
                }
              }
            }
            var fullText = lines.map(function (l) { return l.text; }).join('\n');
            onProgress(1.0);
            return {
              text:           fullText,
              lines:          lines,
              meanConfidence: Math.round(meanConf * 100),
              detectionStats: detectionStats,
              engineVersion:  'v2'
            };
          });
        });
      });
    }).catch(function (err) {
      // Re-wrap unknown errors as ENGINE_LOAD-style so the shim
      // routes them through the V1 fallback consistently.
      if (err && err.code) throw err;
      throw OcrError('UNKNOWN', err && err.message || String(err));
    });
  }

  var api = {
    recognize:        recognize,
    OcrError:         OcrError,
    _resolveTier:     _resolveTier,
    // Pure-function exports for the Node test harness
    _ctcDecode:       _ctcDecode,
    _dbPostprocess:   _dbPostprocess,
    _unclip:          _unclip,
    _groupLinesByY:   _groupLinesByY,
    _modelKeysForTier: _modelKeysForTier,
    // Loader exports for the _compare/ page diagnostic
    _loadOrt:         loadOrt,
    _loadSession:     _loadSession,
    _loadDict:        _loadDict
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_OCR_V2 = api;
})(typeof window !== 'undefined' ? window : null);
