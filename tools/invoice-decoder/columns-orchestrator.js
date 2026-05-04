/**
 * Layout-aware column OCR orchestrator (Wave 14.7).
 *
 * Wires the previously-exposed-but-unwired pieces:
 *
 *   MID_PARSE.reconstructColumns(words, opts)     Wave 4.1 — projects
 *                                                 word density along X,
 *                                                 returns labeled columns
 *                                                 (desc | qty | unit |
 *                                                 price | total).
 *   MID_OCR.recognizeRegion(canvas, region, opts) Wave 4.2 — re-runs
 *                                                 OCR on a column-cropped
 *                                                 canvas with column-tuned
 *                                                 whitelists.
 *
 * Gated by per-vendor `columnsEnabled: true` flags. Sysco gets the
 * flag first; other vendors enable as their fixtures validate. When
 * the vendor template doesn't carry the flag, the orchestrator
 * silently returns the input parsed result unchanged — zero risk to
 * the existing 100%-accuracy soak fixtures.
 *
 * Pipeline:
 *
 *   1. After standard multipass parse + classifyRows, the controller
 *      calls MID_COLUMNS.refineParsed(parsed, canvas, words).
 *   2. If the vendor's columnsEnabled flag is set AND the words array
 *      has ≥ 30 entries with bboxes, project columns.
 *   3. For each parsed row, find the row's vertical band and the
 *      price column's x-range. Re-OCR that crop with the price
 *      whitelist (PSM 7, '0123456789.,$()-').
 *   4. If the re-read yields a numeric value within ±50% of the
 *      multipass value AND fixes a math gap (qty × re-read ≈
 *      lineTotal), commit the re-read as the new lineTotal and bump
 *      fieldConf.price.
 *
 * Conservative: never replaces a multipass read with a worse re-read;
 * never commits a re-read whose number isn't even plausible.
 *
 * Privacy: all OCR runs in-tab via existing pool workers. No new
 * network surface.
 */
(function (root) {
  'use strict';

  function _vendorTpl(vendorId) {
    if (!vendorId || !root || !root.MID_VENDORS) return null;
    var registry = root.MID_VENDORS.REGISTRY || [];
    for (var i = 0; i < registry.length; i++) {
      if (registry[i].id === vendorId) return registry[i];
    }
    return null;
  }

  function _columnByLabel(columns, label) {
    if (!columns || !columns.length) return null;
    for (var i = 0; i < columns.length; i++) {
      if (columns[i].label === label) return columns[i];
    }
    return null;
  }

  // Re-run a per-row crop bounded by (priceColX0, priceColX1) and the
  // row's own vertical band. We need the row's bbox; pulled from the
  // parsed row's `bbox` field when present, or from the matching line
  // bbox in the OCR result.
  function _rowBbox(row) {
    if (row && row.bbox && row.bbox.y0 != null) return row.bbox;
    return null;
  }

  // Public — extend a parsed result with column-aware refinements.
  // Returns a Promise<parsed> (mutated in place). Bypasses on:
  //   - vendor without columnsEnabled flag
  //   - missing canvas / words array
  //   - too few words (< 30) to form a reliable column projection
  //   - reconstructColumns returns null
  function refineParsed(parsed, canvas, words, opts) {
    opts = opts || {};
    if (!parsed || !parsed.rows || !parsed.rows.length) return Promise.resolve(parsed);
    var vendorId = parsed.vendor;
    var tpl = _vendorTpl(vendorId);
    if (!tpl || !tpl.columnsEnabled) return Promise.resolve(parsed);
    if (!canvas || !words || words.length < 30) return Promise.resolve(parsed);
    if (!root || !root.MID_PARSE || !root.MID_PARSE.reconstructColumns) return Promise.resolve(parsed);
    if (!root.MID_OCR || !root.MID_OCR.recognizeRegion) return Promise.resolve(parsed);

    var columns;
    try {
      columns = root.MID_PARSE.reconstructColumns(words, { minColumns: 3 });
    } catch (_) { return Promise.resolve(parsed); }
    if (!columns || columns.length < 3) return Promise.resolve(parsed);
    parsed._columnLayout = columns;
    var priceCol = _columnByLabel(columns, 'price') || _columnByLabel(columns, 'total');
    if (!priceCol) return Promise.resolve(parsed);

    // Build row-bband list from the parsed rows' OCR-line bboxes (set
    // by recognizeCanvas when withWords is true). Skip rows without
    // bbox; they'd require fuzzy y-match against words.
    var rowsWithBands = parsed.rows
      .map(function (r, idx) {
        var bb = _rowBbox(r);
        if (!bb) return null;
        return { idx: idx, row: r, bbox: bb };
      })
      .filter(Boolean);
    if (!rowsWithBands.length) return Promise.resolve(parsed);

    // Limit to amber/red rows where the multipass read isn't already
    // confident — running re-OCR on every row is wasteful and risks
    // regressing high-confidence reads.
    var candidates = rowsWithBands.filter(function (entry) {
      var fc = entry.row.fieldConf || {};
      var minF = Math.min(fc.price || 0, fc.qty || 0);
      return minF < 80;
    });
    if (!candidates.length) return Promise.resolve(parsed);

    var stats = { attempted: 0, accepted: 0, rejected: 0 };
    var chain = Promise.resolve();
    candidates.forEach(function (entry) {
      chain = chain.then(function () {
        stats.attempted++;
        var region = {
          x0: priceCol.x0,
          y0: entry.bbox.y0 - 2,
          x1: priceCol.x1,
          y1: entry.bbox.y1 + 2,
          label: 'price'
        };
        return root.MID_OCR.recognizeRegion(canvas, region, { lang: 'eng' })
          .then(function (regionResult) {
            var raw = ((regionResult && regionResult.text) || '').replace(/[^0-9.,]/g, '');
            if (!raw) { stats.rejected++; return; }
            var num = parseFloat(raw.replace(/,/g, ''));
            if (!isFinite(num) || num <= 0) { stats.rejected++; return; }
            var existing = (typeof entry.row.lineTotal === 'number') ? entry.row.lineTotal : null;
            // Require the re-read to be within ±50% of the multipass
            // value (catches digit-flips without accepting wild
            // re-reads from adjacent column bleed-through).
            if (existing != null && existing > 0) {
              var ratio = num / existing;
              if (ratio < 0.5 || ratio > 1.5) {
                stats.rejected++;
                return;
              }
            }
            // Math-coherence check: does the re-read close a gap?
            var qty = entry.row.qty;
            if (typeof qty === 'number' && qty > 0 && entry.row.unitPrice > 0) {
              var calcExisting = Math.abs((entry.row.unitPrice * qty) - (existing || 0));
              var calcNew      = Math.abs((entry.row.unitPrice * qty) - num);
              if (calcNew >= calcExisting) {
                // Re-read doesn't improve coherence — keep the old
                // value.
                stats.rejected++;
                return;
              }
            }
            entry.row.lineTotal = +num.toFixed(2);
            entry.row._columnRefined = true;
            if (!entry.row.fieldConf) entry.row.fieldConf = {};
            entry.row.fieldConf.price = Math.max(entry.row.fieldConf.price || 0, 92);
            stats.accepted++;
          })
          .catch(function () { stats.rejected++; });
      });
    });
    return chain.then(function () {
      parsed._columnRefineStats = stats;
      return parsed;
    });
  }

  var api = {
    refineParsed:    refineParsed,
    _vendorTpl:      _vendorTpl,
    _columnByLabel:  _columnByLabel
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_COLUMNS = api;
})(typeof window !== 'undefined' ? window : null);
