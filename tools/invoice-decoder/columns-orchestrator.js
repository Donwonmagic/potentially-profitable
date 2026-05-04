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
 * Runs for EVERY invoice with a structured layout. The internal
 * guards keep it safe on non-tabular inputs:
 *
 *   - bypass when fewer than 30 words have bboxes (sparse OCR / image)
 *   - bypass when reconstructColumns can't find ≥3 columns (receipts,
 *     screenshots, free-form text)
 *   - bypass when no parsed rows carry bboxes
 *   - cap at MAX_REFINES re-OCRs per invoice to bound wall clock
 *   - re-read must be within ±50% of the multipass value
 *   - re-read must improve math coherence (qty × unitPrice ≈ lineTotal)
 *
 * The conservatism is in the data shape the orchestrator looks at,
 * not in a per-vendor allowlist. Thermal receipts and free-form
 * text simply don't satisfy the guards and get skipped automatically.
 *
 * Privacy: all OCR runs in-tab via existing pool workers. No new
 * network surface.
 */
(function (root) {
  'use strict';

  // Cap re-OCRs per invoice. Each region recognize is ~1.5s on a
  // mid-tier phone; bounding to 12 keeps worst-case under 20s on
  // photos with many amber rows while still catching the most
  // important fixes (sorted by lowest fieldConf first).
  var MAX_REFINES = 12;

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
  // Returns a Promise<parsed> (mutated in place). Bypasses cleanly on
  // any input that doesn't satisfy the internal guards.
  function refineParsed(parsed, canvas, words, opts) {
    opts = opts || {};
    if (!parsed || !parsed.rows || !parsed.rows.length) return Promise.resolve(parsed);
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
    // regressing high-confidence reads. Sort by lowest min(price,qty)
    // so we attack the most uncertain reads first within the cap.
    var candidates = rowsWithBands.filter(function (entry) {
      var fc = entry.row.fieldConf || {};
      var minF = Math.min(fc.price || 0, fc.qty || 0);
      return minF < 80;
    }).sort(function (a, b) {
      var fa = a.row.fieldConf || {}, fb = b.row.fieldConf || {};
      return Math.min(fa.price || 0, fa.qty || 0) - Math.min(fb.price || 0, fb.qty || 0);
    }).slice(0, MAX_REFINES);
    if (!candidates.length) return Promise.resolve(parsed);

    var stats = { attempted: 0, accepted: 0, rejected: 0, capped: rowsWithBands.length > MAX_REFINES };
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
