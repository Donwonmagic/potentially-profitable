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

  // Footer-repeat dedup. Identical to the heuristic at
  // invoice-decoder.js:687-727 — multi-page invoices repeat the
  // SYSCO HOUSTON / Customer Number / column-header band on every
  // page; without dedup the parser inflates row counts.
  function _dedupRepeats(allLines) {
    var seen = Object.create(null);
    var out  = [];
    for (var i = 0; i < allLines.length; i++) {
      var l = allLines[i];
      var key = (l.text || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (!key) continue;
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
      // First page: trust everything. Subsequent pages: dedup
      // against earlier-seen lines (matches v1 invoice-decoder.js
      // pageIdx === 0 vs pageIdx > 0 logic).
      if (i === 0) {
        allLines = allLines.concat(pageLines);
      } else {
        // Dedup against the running set across all earlier pages.
        var earlier = Object.create(null);
        for (var j = 0; j < allLines.length; j++) {
          var k = (allLines[j].text || '').replace(/\s+/g, ' ').trim().toLowerCase();
          if (k) earlier[k] = 1;
        }
        for (var k2 = 0; k2 < pageLines.length; k2++) {
          var key = (pageLines[k2].text || '').replace(/\s+/g, ' ').trim().toLowerCase();
          if (!key || earlier[key]) continue;
          allLines.push(pageLines[k2]);
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
    merge:        merge,
    _dedupRepeats: _dedupRepeats
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_ASSEMBLE = api;
})(typeof window !== 'undefined' ? window : null);
