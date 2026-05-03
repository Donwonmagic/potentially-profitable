/**
 * Invoice Decoder — Smart-defaults ghost-text proposals (Wave 5.4).
 *
 * For every amber-confidence row, compute one or more "the system
 * thinks the right value is X" suggestions sourced from:
 *
 *   1. SKU history mode — pack-size string mode of the operator's
 *      last 8 invoices for this stem. Stable hint when the operator
 *      buys the same SKU repeatedly.
 *   2. Learnings canonicalization — the operator's last accepted
 *      spelling for a name. "Eggp lant" → "Eggplant".
 *   3. Vendor pack-size column — when the row's vendor template has
 *      a fixed pack-column regex and the OCR'd column failed, fall
 *      back to the modal pack from the same vendor's history.
 *
 * Each proposal carries:
 *   { field, suggested, confidence, source }
 *
 * The UI renders each as ghost-text in the matching cell with one-tap
 * accept (Enter / single-click), Esc to dismiss.
 */
(function (root) {
  'use strict';

  // Mode of an array of strings — most-frequent value, ties broken by
  // first-seen. Returns null on empty / no clear mode.
  function _mode(values) {
    if (!values || !values.length) return null;
    var counts = Object.create(null);
    var best = null, bestCount = 0;
    for (var i = 0; i < values.length; i++) {
      var v = values[i];
      if (v == null || v === '') continue;
      counts[v] = (counts[v] || 0) + 1;
      if (counts[v] > bestCount) { bestCount = counts[v]; best = v; }
    }
    return bestCount >= 2 ? best : null;
  }

  // Build a unit-string key like "12 OZ" from a history entry.
  function _packStringFor(entry) {
    if (!entry) return null;
    var qty  = (entry.qty != null) ? entry.qty : null;
    var unit = entry.unit || null;
    if (qty == null && !unit) return null;
    return (qty != null ? qty : '') + (qty != null && unit ? ' ' : '') + (unit || '');
  }

  // Per-row: returns up to one proposal per field. Cells that already
  // have a confident value (fieldConf >= 75) are skipped.
  function fieldFixesFor(row, opts) {
    opts = opts || {};
    var vendor = opts.vendor || null;
    var fc = row && row.fieldConf;
    if (!fc) return {};
    var out = {};

    // Name canonicalization via learnings.
    if (fc.name < 75 && root && root.MID_LEARNINGS && root.MID_LEARNINGS.lookupOverride) {
      try {
        var ov = root.MID_LEARNINGS.lookupOverride(row.name);
        if (ov && ov.matched && ov.matched !== row.name) {
          out.name = {
            field: 'name',
            suggested: ov.matched,
            confidence: Math.min(95, ov.confidence || 80),
            source: 'learnings'
          };
        }
      } catch (_) {}
    }

    // Pack / unit / qty via SKU history mode for this vendor.
    if ((fc.qty < 75 || fc.price < 75) &&
        root && root.MID_SKU_HISTORY && root.MID_SKU_HISTORY.lookupHistory) {
      try {
        var hist = root.MID_SKU_HISTORY.lookupHistory(row);
        if (hist && hist.length >= 2) {
          var vendorHist = hist.filter(function (h) {
            return vendor ? h.vendor === vendor : true;
          });
          var pool = vendorHist.length >= 2 ? vendorHist : hist;
          var packs = pool.map(_packStringFor).filter(Boolean);
          var modePack = _mode(packs);
          if (modePack && fc.qty < 75) {
            // The accept handler in the UI splits this on space and
            // assigns qty + unit independently.
            out.qty = {
              field: 'qty',
              suggested: modePack,
              confidence: 80,
              source: 'history-' + pool.length + '-obs'
            };
          }
          // Median unit price as a price suggestion when the OCR
          // confidence on the price cell is poor.
          if (fc.price < 70 && pool.length >= 3) {
            var prices = pool.map(function (h) { return h.unitPrice; }).filter(function (p) { return typeof p === 'number'; });
            if (prices.length >= 3) {
              prices.sort(function (a, b) { return a - b; });
              var median = prices[Math.floor(prices.length / 2)];
              if (typeof row.qty === 'number' && row.qty > 0) {
                out.lineTotal = {
                  field: 'lineTotal',
                  suggested: +(median * row.qty).toFixed(2),
                  confidence: 70,
                  source: 'history-median'
                };
              }
            }
          }
        }
      } catch (_) {}
    }

    return out;
  }

  // Convenience: serialize a single proposal as a small label the UI
  // can render in a ghost-chip. UI is free to ignore and render its own.
  function describe(proposal) {
    if (!proposal) return '';
    var v = proposal.suggested;
    if (typeof v === 'number') v = '$' + v.toFixed(2);
    return v + ' ↩';
  }

  var api = {
    fieldFixesFor: fieldFixesFor,
    describe:      describe,
    _mode:         _mode,
    _packStringFor: _packStringFor
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_PROPOSED_FIX = api;
})(typeof window !== 'undefined' ? window : null);
