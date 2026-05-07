/**
 * Invoice Decoder — Stage 4: table structure reconstruction.
 *
 * Given OCR lines that include per-word bboxes (V2 engine populates
 * `lines[].words[]` with `{text, bbox, confidence}`), find the
 * consensus column-start X positions across the page and re-bin
 * each line's words into a structured row of cells. Output:
 *
 *   TableResult = {
 *     rows:  [[cell, ...]],          // each cell = { text, confidence, bbox }
 *     cols:  number,                  // detected column count
 *     order: 'reading' | 'spatial'
 *   }
 *
 * Why this matters: a typical invoice line is laid out as
 *
 *     QTY  UNIT  DESCRIPTION                  EACH    TOTAL
 *     5    CS    OYSTER PANKO 5LB             26.90   134.50
 *     2    LB    BONELESS CHICKEN BREAST       4.63     9.26
 *
 * The OCR engine's Y-grouping merges words on the same baseline
 * into a single line text — but a cluttered region (logos /
 * column headers / multi-line descriptions) can break the
 * one-row-one-line assumption. Re-binning by consensus X gives
 * the parser cleaner per-cell text and makes the line-item
 * regexes more reliable.
 *
 * The full Docling stack would call IBM's TableFormer ONNX here
 * for an end-to-end transformer-decoded grid. That model's
 * autoregressive postprocessing is too complex to ship reliably
 * without browser verification — see commit ba8c470d's caveats.
 * The heuristic in this file produces useful results for
 * straight invoice tables; TableFormer-quality oriented or
 * multi-row-cell tables wait for that wire-in.
 *
 * Returns null when the input doesn't look table-shaped (fewer
 * than 3 lines with .words, or fewer than 2 distinct column
 * starts detected). assemble.js handles null by passing through
 * the OCR lines unchanged.
 *
 * Privacy posture: pure data transform, no fetch, no storage.
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

  function reconstruct(canvas, lines, opts) {
    opts = opts || {};
    if (!Array.isArray(lines) || lines.length < MIN_LINES_FOR_TABLE) {
      return Promise.resolve(null);
    }
    // We can only reconstruct from lines that include word bboxes.
    // The V2 engine populates .words; V1 (Tesseract) usually does
    // too, but the bbox layout may differ. Filter defensively.
    var withWords = lines.filter(function (l) {
      return Array.isArray(l.words) && l.words.length > 0
          && l.words.every(function (w) { return w && w.bbox; });
    });
    if (withWords.length < MIN_LINES_FOR_TABLE) return Promise.resolve(null);

    var columnStarts = _findColumnStarts(withWords);
    if (columnStarts.length < MIN_COLUMNS) return Promise.resolve(null);

    var rows = withWords.map(function (line) {
      return _binWordsToColumns(line.words, columnStarts);
    });

    return Promise.resolve({
      rows:  rows,
      cols:  columnStarts.length,
      order: 'spatial',
      // Diagnostic data the _compare/ page can surface
      _columnAnchors: columnStarts
    });
  }

  var api = {
    reconstruct:        reconstruct,
    // Pure-function exports for the Node test harness
    _findColumnStarts:  _findColumnStarts,
    _binWordsToColumns: _binWordsToColumns,
    // Tunables exposed so tests / future tuning can adjust without forking
    MIN_LINES_FOR_TABLE: MIN_LINES_FOR_TABLE,
    MIN_COLUMNS:         MIN_COLUMNS,
    X_BUCKET_PX:         X_BUCKET_PX
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_TABLES = api;
})(typeof window !== 'undefined' ? window : null);
