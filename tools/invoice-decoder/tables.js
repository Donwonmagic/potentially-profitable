/**
 * Invoice Decoder — Stage 4: table structure recognition (Slice 3).
 *
 * Heavy-tier-only stage. When layout reports a table region with
 * many rows on a difficult invoice, this module loads the
 * Docling TableFormer-fast ONNX model and reconstructs the
 * row/column structure so the existing parser's Pattern A/B/C/D/E
 * regexes have an easier job (each row arrives pre-segmented
 * instead of sharing whitespace ambiguity with neighbors).
 *
 *   reconstruct(canvas, regionLines, opts) → Promise<TableResult|null>
 *   TableResult = {
 *     rows:  [[cell, ...]],      // each cell = { text, confidence, bbox }
 *     cols:  number,             // detected column count
 *     order: 'reading' | 'spatial'
 *   }
 *
 * Slice 3 ships a no-op pass-through that resolves to null so
 * downstream stages just use the raw OCR lines. The TableFormer
 * loader lands in a follow-up alongside the layout model.
 *
 * Privacy posture: zero fetch in the no-op state. Loader will
 * use same-origin paths via MID_VENDORS_CFG.resolve.
 */
(function (root) {
  'use strict';

  function reconstruct(canvas, regionLines, opts) {
    // Slice 3 stub — heavy tier model not wired yet. Returning
    // null tells the assemble stage "use the raw OCR lines as-is".
    return Promise.resolve(null);
  }

  var api = {
    reconstruct: reconstruct
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_TABLES = api;
})(typeof window !== 'undefined' ? window : null);
