/**
 * Invoice Decoder — Stage 5: output assembly (Slice 3).
 *
 * Final stage of the v2 pipeline. Takes per-page OCR + optional
 * table-structure results and produces the exact input shape
 * MID_PARSE.parseLines expects — preserving the parser contract
 * so parse.js stays untouched across the whole rebuild.
 *
 *   merge({ pages, layouts, ocrResults, tableResults }) →
 *     {
 *       lines:    [{ text, confidence, bbox, words? }],
 *       fullText: string,
 *       perPage:  [{ lines, fullText }],
 *       perPageMeta: [{ source, dpi, regions }]
 *     }
 *
 * The output is consumed at invoice-decoder.js:776 and :4493
 * (both sites read `result.lines` + `result.fullText`).
 *
 * Privacy posture: pure data assembly, zero side-effects.
 */
(function (root) {
  'use strict';

  // OCR-noise-tolerant dedup key. Mirrors normalizeForDedup at
  // invoice-decoder.js:463 — collapses ALL punctuation (not just
  // leading/trailing), lowercases, and refuses to dedup very
  // short strings (under 4 word-chars) so legitimate short row
  // data like "1 LB" or "EA" isn't dropped on page 2. Keeping the
  // two implementations in lockstep avoids regressions when the
  // shim flips an operator between v1 and v2.
  function _normalizeForDedup(s) {
    if (!s) return '';
    var n = String(s).toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return (n.length >= 4) ? n : '';
  }

  // Footer-repeat dedup. Identical heuristic to invoice-decoder.js
  // W2-5 — multi-page invoices (a 2-page Sysco for example)
  // repeat the SYSCO HOUSTON / Customer Number / column-header
  // band on every page; without dedup the parser inflates row
  // counts. The OCR-noise-tolerant key tolerates trailing-comma /
  // glyph-flip drift between page reads.
  function _dedupRepeats(allLines) {
    var seen = Object.create(null);
    var out  = [];
    for (var i = 0; i < allLines.length; i++) {
      var l = allLines[i];
      var key = _normalizeForDedup(l.text);
      if (!key) { out.push(l); continue; }   // un-keyable lines pass through
      if (seen[key]) continue;
      seen[key] = 1;
      out.push(l);
    }
    return out;
  }

  function merge(input) {
    input = input || {};
    var pages       = Array.isArray(input.pages)       ? input.pages       : [];
    var layouts     = Array.isArray(input.layouts)     ? input.layouts     : [];
    var ocrResults  = Array.isArray(input.ocrResults)  ? input.ocrResults  : [];
    var tableResults= Array.isArray(input.tableResults)? input.tableResults: [];

    var allLines    = [];
    var perPage     = [];
    var perPageMeta = [];
    var earlierKeys = Object.create(null);  // running window of seen keys

    for (var i = 0; i < pages.length; i++) {
      var page    = pages[i];
      var ocr     = ocrResults[i] || { text: '', lines: [] };
      var table   = tableResults[i] || null;
      var layout  = layouts[i] || null;

      // pdf-text fast path: no OCR was run; the lines came from
      // the PDF text layer directly. Use them verbatim.
      var pageLines;
      if (page && page.source === 'pdf-text' && page.textLayer && Array.isArray(page.textLayer.lines)) {
        pageLines = page.textLayer.lines;
      } else if (table && Array.isArray(table.rows) && table.rows.length) {
        // Table reconstruction: flatten cells into one line per row,
        // tab-separated. parse.js reads tabs as column separators.
        pageLines = table.rows.map(function (row) {
          return {
            text: row.map(function (c) { return (c && c.text) || ''; }).join('\t'),
            confidence: row.length
              ? row.reduce(function (s, c) { return s + ((c && c.confidence) || 0); }, 0) / row.length
              : 0,
            bbox: null,
            words: null
          };
        });
      } else {
        pageLines = ocr.lines || [];
      }

      perPage.push({
        lines:    pageLines,
        fullText: pageLines.map(function (l) { return l.text || ''; }).join('\n')
      });
      perPageMeta.push({
        source:  page ? page.source : 'unknown',
        dpi:     page ? page.dpi    : null,
        regions: layout ? layout.regions : null
      });
      // First page: trust everything and seed the dedup window.
      // Subsequent pages: dedup against the running window using
      // the OCR-noise-tolerant key. Un-keyable (very short) lines
      // pass through unconditionally so legitimate "1 LB" / "EA"
      // rows don't get dropped on page 2+.
      for (var j = 0; j < pageLines.length; j++) {
        var l = pageLines[j];
        var key = _normalizeForDedup(l.text);
        if (i === 0) {
          allLines.push(l);
          if (key) earlierKeys[key] = 1;
        } else {
          if (key && earlierKeys[key]) continue;
          allLines.push(l);
          if (key) earlierKeys[key] = 1;
        }
      }
    }

    var fullText = perPage.map(function (p) { return p.fullText; }).join('\n');
    return {
      lines:       allLines,
      fullText:    fullText,
      perPage:     perPage,
      perPageMeta: perPageMeta
    };
  }

  var api = {
    merge:               merge,
    _dedupRepeats:       _dedupRepeats,
    _normalizeForDedup:  _normalizeForDedup
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_ASSEMBLE = api;
})(typeof window !== 'undefined' ? window : null);
