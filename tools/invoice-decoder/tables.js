/**
 * Invoice Decoder — Stage 4: table structure reconstruction.
 *
 * Two paths:
 *
 *   1. Heuristic (default; ships today). Given OCR lines that
 *      include per-word bboxes (V2 engine populates
 *      `lines[].words[]` with `{text, bbox, confidence}`), finds
 *      consensus column-start X positions across the page and
 *      re-bins each line's words into a structured row of cells.
 *      Sufficient for straight invoice tables (the primary case);
 *      breaks down on multi-row cells, merged headers, and
 *      orientation-tilted tables.
 *
 *   2. TableFormer (heavy-tier; load scaffold present, postprocess
 *      pending browser verification — see _runTableFormer below).
 *      This is the IBM Zurich Docling stack's table-structure
 *      transformer. Given a detected table region (from layout.js
 *      DocLayNet), TableFormer produces an HTML-style structure
 *      sequence + per-cell bounding boxes. Quality is materially
 *      better than the heuristic on complex tables.
 *
 * The TableFormer load + inference IS wired (not stubbed); the
 * model's autoregressive output is captured and surfaced via the
 * _compare/ diagnostic block. The postprocess that converts
 * structure-token sequence into rows × columns is the unverified
 * part — same posture as the DocLayNet postprocess in layout.js
 * (commit ef2ac4f3) before its YOLOX/RT-DETR dispatch was written.
 * A browser-side maintainer can read the actual output shape from
 * _compare/, write the matching postprocess, and the heuristic
 * fallback automatically becomes secondary.
 *
 * Output shape (both paths):
 *
 *   TableResult = {
 *     rows:   [[cell, ...]],     // each cell = { text, confidence, bbox }
 *     cols:   number,
 *     order:  'reading' | 'spatial',
 *     source: 'heuristic' | 'tableformer'
 *   }
 *
 * Returns null when the input doesn't look table-shaped (fewer
 * than 3 lines with .words, or fewer than 2 distinct column
 * starts detected). assemble.js handles null by passing through
 * the OCR lines unchanged.
 *
 * Privacy posture: pure data transform on the heuristic path; the
 * TableFormer path runs ONNX inference same-origin (no fetch
 * outside /assets/vendor/onnx/).
 */
(function (root) {
  'use strict';

  // Tunables. Defaults tuned for typical 300dpi invoices.
  var MIN_LINES_FOR_TABLE = 3;
  var MIN_COLUMNS         = 2;
  var X_BUCKET_PX         = 12;        // resolution of the column histogram
  // Vote threshold scales with input size — fixed 3-vote threshold
  // missed legitimate columns on short tables (3-5 rows) where word
  // X-positions drift across adjacent buckets and no single bucket
  // accumulates 3 hits. Audit-driven fix.
  var WORD_TO_COLUMN_TOLERANCE_PX = 30;
  function _voteThreshold(lineCount) {
    return Math.max(2, Math.ceil(lineCount / 3));
  }

  // Find consensus column-start X positions by histogramming each
  // word's left edge across all lines. Buckets with at least
  // COLUMN_HISTOGRAM_MIN_VOTES votes become column-start anchors.
  // Adjacent buckets are merged so a slightly-jittery column
  // doesn't split into two near-duplicates.
  function _findColumnStarts(lines) {
    var maxX = 0;
    for (var i = 0; i < lines.length; i++) {
      var ws = lines[i].words || [];
      for (var j = 0; j < ws.length; j++) {
        if (ws[j].bbox && ws[j].bbox.x1 > maxX) maxX = ws[j].bbox.x1;
      }
    }
    if (maxX <= 0) return [];
    // Defensive cap — a corrupt OCR output with a stray x1 in the
    // millions shouldn't allocate gigabytes of histogram.
    if (maxX > 50000) return [];
    var bucketCount = Math.ceil(maxX / X_BUCKET_PX) + 1;
    var hist = new Int32Array(bucketCount);
    for (var li = 0; li < lines.length; li++) {
      var words = lines[li].words || [];
      for (var wi = 0; wi < words.length; wi++) {
        if (!words[wi].bbox) continue;
        var bucket = Math.floor(words[wi].bbox.x0 / X_BUCKET_PX);
        if (bucket >= 0 && bucket < bucketCount) hist[bucket]++;
      }
    }
    // Adaptive vote threshold (audit-driven fix). Short tables with
    // word X-positions split across adjacent buckets used to under-
    // shoot a fixed 3-vote threshold; scaling lets a 3-row table
    // pass with 2 votes per bucket while a 30-row table still
    // requires 10 votes for a true column.
    var threshold = _voteThreshold(lines.length);
    // Walk the histogram, collapsing adjacent above-threshold
    // buckets into single column-start anchors at their centre.
    var anchors = [];
    var i2 = 0;
    while (i2 < bucketCount) {
      if (hist[i2] >= threshold) {
        var start = i2;
        var sum = 0, count = 0;
        while (i2 < bucketCount && hist[i2] >= threshold) {
          sum += i2 * hist[i2];
          count += hist[i2];
          i2++;
        }
        var centreBucket = count ? sum / count : start;
        anchors.push(Math.round(centreBucket * X_BUCKET_PX));
      } else {
        i2++;
      }
    }
    return anchors;
  }

  // Bin one line's words into columns by nearest column-start X.
  // Words with no clear column home (X further than tolerance from
  // any anchor) get appended to the nearest column anyway — bias
  // toward over-grouping rather than dropping data.
  function _binWordsToColumns(words, columnStarts) {
    var cells = columnStarts.map(function () { return null; });
    if (!words || !words.length || !columnStarts.length) return cells;
    // Sort words left to right
    var sorted = words.slice().sort(function (a, b) {
      return ((a.bbox && a.bbox.x0) || 0) - ((b.bbox && b.bbox.x0) || 0);
    });
    for (var w = 0; w < sorted.length; w++) {
      var word = sorted[w];
      var x = (word.bbox && word.bbox.x0) || 0;
      // Find the column whose anchor X is closest at or before x.
      // (We bias to "or before" so a word starting at x=305 with
      // anchors at [100, 300, 500] picks col 1 — its actual home —
      // not col 2.)
      var col = 0;
      for (var c = 0; c < columnStarts.length; c++) {
        if (columnStarts[c] <= x + WORD_TO_COLUMN_TOLERANCE_PX) col = c;
        else break;
      }
      var existing = cells[col];
      if (!existing) {
        cells[col] = {
          text:       word.text || '',
          confidence: word.confidence || 0,
          bbox:       word.bbox ? {
            x0: word.bbox.x0, y0: word.bbox.y0,
            x1: word.bbox.x1, y1: word.bbox.y1
          } : null
        };
      } else {
        // Same column already has text — concatenate with a space
        existing.text = (existing.text + ' ' + (word.text || '')).trim();
        // Average confidence (lossy but ok for heuristic)
        existing.confidence = ((existing.confidence || 0) + (word.confidence || 0)) / 2;
        if (existing.bbox && word.bbox) {
          existing.bbox.x1 = Math.max(existing.bbox.x1, word.bbox.x1);
          existing.bbox.y1 = Math.max(existing.bbox.y1, word.bbox.y1);
        }
      }
    }
    // Replace null cells with empty placeholders so downstream code
    // can rely on cells[i] being a truthy object.
    for (var k = 0; k < cells.length; k++) {
      if (!cells[k]) cells[k] = { text: '', confidence: 0, bbox: null };
    }
    return cells;
  }

  // ---------- TableFormer load scaffold ----------
  //
  // Lazy-loaded ONNX session for the IBM Docling TableFormer-fast
  // model. Same caching pattern as ocr-engine.js's _loadSession:
  // first call kicks the load, subsequent calls receive the cached
  // promise. On failure, the slot clears so the next call retries.
  var _tableFormerSession = null;
  function _loadTableFormerSession() {
    if (_tableFormerSession) return _tableFormerSession;
    if (!root || !root.MID_OCR_V2 || !root.MID_OCR_V2._loadOrt) {
      return Promise.reject(new Error('ORT loader unavailable'));
    }
    var cfg = root.MID_VENDORS_CFG;
    if (!cfg || !cfg.SELF || !cfg.SELF.tableformerFast) {
      return Promise.reject(new Error('vendor-config missing tableformerFast URL'));
    }
    var url = cfg.SELF.tableformerFast;
    _tableFormerSession = root.MID_OCR_V2._loadOrt().then(function (ort) {
      return ort.InferenceSession.create(url, { executionProviders: ['wasm'] })
        .then(function (s) { return { ort: ort, session: s }; });
    }).catch(function (err) {
      _tableFormerSession = null;
      throw new Error('TableFormer load failed: ' + (err && err.message || err));
    });
    return _tableFormerSession;
  }

  // Render a region's slice of the canvas into a 448×448 input
  // tensor (TableFormer's standard input size — verified against
  // ds4sd/docling-models card). Same BGR-ordered, mean-subtracted
  // preprocess as layout.js.
  var TF_INPUT_SIZE = 448;
  var TF_MEAN = [0.485, 0.456, 0.406];
  var TF_STD  = [0.229, 0.224, 0.225];
  function _regionToTensor(canvas, region, ort) {
    var off = document.createElement('canvas');
    off.width = TF_INPUT_SIZE; off.height = TF_INPUT_SIZE;
    var ctx = off.getContext('2d');
    var bb = region.bbox;
    ctx.drawImage(canvas, bb.x, bb.y, bb.w, bb.h, 0, 0, TF_INPUT_SIZE, TF_INPUT_SIZE);
    var img = ctx.getImageData(0, 0, TF_INPUT_SIZE, TF_INPUT_SIZE);
    var d = img.data;
    var n = TF_INPUT_SIZE * TF_INPUT_SIZE;
    var arr = new Float32Array(3 * n);
    for (var i = 0; i < n; i++) {
      var R = d[i*4]     / 255;
      var G = d[i*4 + 1] / 255;
      var B = d[i*4 + 2] / 255;
      arr[i]       = (B - TF_MEAN[0]) / TF_STD[0];
      arr[i + n]   = (G - TF_MEAN[1]) / TF_STD[1];
      arr[i + 2*n] = (R - TF_MEAN[2]) / TF_STD[2];
    }
    return new ort.Tensor('float32', arr, [1, 3, TF_INPUT_SIZE, TF_INPUT_SIZE]);
  }

  // Run TableFormer on one detected table region. Returns the raw
  // output dict (model-emitted tensor names + dims + data) for
  // diagnostic surfacing in _compare/. The structure-decode path
  // (sequence-of-HTML-tags → rows × columns) is FIXME-flagged —
  // TableFormer's autoregressive output requires browser
  // verification before a postprocess can be written safely.
  // Today this function loads the model, runs inference, captures
  // diagnostics, then throws so reconstruct() falls back to the
  // heuristic. Once a browser verification confirms the output
  // shape, write the postprocess in _decodeTableFormerOutput
  // below and remove the throw.
  function _runTableFormer(canvas, region) {
    return _loadTableFormerSession().then(function (parts) {
      var ort = parts.ort, session = parts.session;
      var tensor = _regionToTensor(canvas, region, ort);
      var inputName = (session.inputNames && session.inputNames[0]) || 'images';
      var feeds = {}; feeds[inputName] = tensor;
      return session.run(feeds).then(function (outputs) {
        // Capture shape BEFORE disposing tensors (same WASM-heap
        // invalidation gotcha as ocr-engine.js / layout.js).
        var shape = root.MID_LAYOUT && root.MID_LAYOUT._inspectModelOutput
          ? root.MID_LAYOUT._inspectModelOutput(outputs)
          : { keys: Object.keys(outputs) };
        try {
          if (tensor.dispose) tensor.dispose();
          Object.keys(outputs).forEach(function (k) {
            if (outputs[k] && outputs[k].dispose) outputs[k].dispose();
          });
        } catch (_) {}
        // FIXME (browser-verify): TableFormer postprocess.
        // The published heron-family TableFormer-fast emits
        // structure_logits [1, T, V] (HTML-tag vocabulary,
        // typically V≈30-40) plus cell_bboxes [1, T, 4] in
        // normalized cxcywh. T is the autoregressive sequence
        // length (variable per table; capped via max_decode_steps
        // at session creation time, default ~512). Decoding is:
        //   1. sigmoid + argmax structure_logits to get tag IDs
        //   2. emit <tr> at "row open" tokens, </tr> at "row close"
        //   3. for each <td>/<th> token, pull the matching cell
        //      bbox and read the OCR text inside that bbox
        //   4. cellBoxes are in 448×448 input space → scale back
        //      to canvas via region.bbox.{w,h}
        // Pseudocode is sound; the unknowns are the actual tensor
        // names, the vocabulary mapping (tag-ID-to-token), and
        // whether cells emit before or after the structure tokens.
        // Throw with the captured shape until verified — same
        // posture as DocLayNet's postprocess pre-rewrite.
        var err = new Error('TableFormer postprocess pending browser verification — ' +
                            'output shape: ' + JSON.stringify(shape));
        err.code = 'POSTPROCESS_PENDING';
        err.shape = shape;
        throw err;
      });
    });
  }

  // Reconstruct a table from the OCR lines + (optional) layout
  // regions. Tries TableFormer first when the heavy-tier flag is
  // on AND we have at least one layout region typed as 'table';
  // otherwise (and on any TableFormer failure) falls through to
  // the heuristic. Heuristic ships today and handles the primary
  // straight-invoice case; TableFormer is the upgrade path for
  // multi-row cells, oriented tables, and complex headers.
  function _heavyTierEnabled() {
    if (!root) return false;
    if (root.MID_INVOICE_DECODER_FLAGS && root.MID_INVOICE_DECODER_FLAGS.useTableFormer) return true;
    try {
      if (root.localStorage && root.localStorage.getItem('id-tableformer-model') === 'on') return true;
    } catch (_) {}
    return false;
  }

  function reconstruct(canvas, lines, opts) {
    opts = opts || {};
    if (!Array.isArray(lines) || lines.length < MIN_LINES_FOR_TABLE) {
      return Promise.resolve(null);
    }
    var withWords = lines.filter(function (l) {
      return Array.isArray(l.words) && l.words.length > 0
          && l.words.every(function (w) { return w && w.bbox; });
    });
    if (withWords.length < MIN_LINES_FOR_TABLE) return Promise.resolve(null);

    var columnStarts = _findColumnStarts(withWords);
    if (columnStarts.length < MIN_COLUMNS) return Promise.resolve(null);

    function heuristicResult() {
      var rows = withWords.map(function (line) {
        return _binWordsToColumns(line.words, columnStarts);
      });
      return {
        rows:   rows,
        cols:   columnStarts.length,
        order:  'spatial',
        source: 'heuristic',
        _columnAnchors: columnStarts
      };
    }

    // TableFormer path: only attempts when heavy-tier flag is on
    // AND a 'table'-typed region was supplied (typically from
    // layout.js's DocLayNet output). Without a region, we don't
    // know where the table is on the canvas to crop to. Falls
    // through to heuristic on any failure (model load, inference,
    // postprocess pending).
    var tableRegion = (opts.regions || []).find(function (r) { return r && r.kind === 'table'; });
    if (canvas && _heavyTierEnabled() && tableRegion) {
      return _runTableFormer(canvas, tableRegion).then(function (tf) {
        // _decodeTableFormerOutput would map the autoregressive
        // structure sequence + cell bboxes to rows × columns.
        // Pending verification — see _runTableFormer FIXME above.
        return tf || heuristicResult();
      }).catch(function () {
        // Any TableFormer error → heuristic. Telemetry would
        // surface the failure code; we don't fire here because
        // the consumer (ocr-shim.js) already wraps reconstruct
        // calls in its own error reporting layer.
        return heuristicResult();
      });
    }
    return Promise.resolve(heuristicResult());
  }

  var api = {
    reconstruct:        reconstruct,
    // Pure-function exports for the Node test harness
    _findColumnStarts:  _findColumnStarts,
    _binWordsToColumns: _binWordsToColumns,
    _heavyTierEnabled:  _heavyTierEnabled,
    // TableFormer scaffolding (browser-only path; harness mocks
    // _loadOrt + InferenceSession to exercise the load chain)
    _loadTableFormerSession: _loadTableFormerSession,
    _runTableFormer:         _runTableFormer,
    // Tunables exposed so tests / future tuning can adjust without forking
    MIN_LINES_FOR_TABLE: MIN_LINES_FOR_TABLE,
    MIN_COLUMNS:         MIN_COLUMNS,
    X_BUCKET_PX:         X_BUCKET_PX,
    TF_INPUT_SIZE:       TF_INPUT_SIZE
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_TABLES = api;
})(typeof window !== 'undefined' ? window : null);
