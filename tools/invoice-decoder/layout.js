/**
 * Invoice Decoder — Stage 2: layout analysis (Slice 3).
 *
 * Detects regions on a page (header, line-items table, totals,
 * footer) so the OCR engine can run model-aware recognition per
 * region instead of treating the whole page as one block.
 *
 * Slice 3 ships the heuristic-only path: a single 'page' region
 * covering the full canvas, plus a future-shaped result object the
 * downstream stages can consume. The DocLayNet heron ONNX model
 * (heavy-tier, lazy) plugs in later; analyze() already exposes
 * the {tier} option so the call sites don't need to change.
 *
 *   LayoutResult = {
 *     regions:       [{ kind, bbox: {x,y,w,h}, confidence }],
 *     usedHeuristic: boolean,
 *     usedModel:     boolean
 *   }
 *
 * Privacy posture: zero fetch in the heuristic path. The model
 * path (when added) loads a same-origin ONNX file via ORT —
 * still no external connection.
 */
(function (root) {
  'use strict';

  // Heuristic-only single-region result. The OCR engine will run
  // detection across the entire canvas, which is the correct
  // default until the layout model lands.
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

  function analyze(canvas, opts) {
    opts = opts || {};
    if (!canvas || !canvas.width || !canvas.height) {
      return Promise.resolve({
        regions: [], usedHeuristic: false, usedModel: false
      });
    }
    // Slice 3: heuristic-only. The capable-tier model path lands
    // in a follow-up; gating signature stays stable now so call
    // sites don't churn when it does.
    return Promise.resolve(_wholePageHeuristic(canvas));
  }

  var api = {
    analyze: analyze
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_LAYOUT = api;
})(typeof window !== 'undefined' ? window : null);
