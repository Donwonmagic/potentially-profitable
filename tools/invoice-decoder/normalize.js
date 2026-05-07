/**
 * Invoice Decoder — Stage 1: input normalization (Slice 3).
 *
 * Single entry point that takes any operator input (image / PDF /
 * HEIC / TIFF) and returns a uniform list of PageBundle objects
 * the v2 pipeline can hand straight to layout + OCR.
 *
 *   PageBundle = {
 *     canvas:    HTMLCanvasElement,        // the page rendered at <= 2000 px long edge
 *     dpi:       number | null,            // when known (e.g., from PDF metadata)
 *     source:    'image' | 'pdf-image' | 'pdf-text',
 *     textLayer: { lines: [{text,bbox}] }  // present only when source === 'pdf-text'
 *   }
 *
 * This stage is intentionally a thin orchestrator — heavy lifting
 * stays in the existing helpers (preprocess.fileToCanvas,
 * pdf-extract.extractPdf, pdf-extract.rasterizeImageOnlyPdf,
 * preprocess.tiffToPageFiles). Slice 3 keeps behavior identical to
 * the v1 pipeline for the file-decode path; what changes is that
 * the v2 OCR engine receives a single normalized canvas per page
 * instead of v1's aggressive+gentle dual-pass.
 *
 * Privacy posture: zero fetch, zero localStorage writes. Inherits
 * the no-egress invariant from preprocess + pdf-extract.
 */
(function (root) {
  'use strict';

  var MAX_EDGE_PX = 2000;

  function _err(msg) { var e = new Error(msg); e.code = 'NORMALIZE_FAILED'; return e; }

  function _isPdf(file) {
    if (!file) return false;
    var t = String(file.type || '').toLowerCase();
    return t === 'application/pdf' || /\.pdf$/i.test(String(file.name || ''));
  }

  // Single-image input → one-page bundle.
  function _normalizeImage(file) {
    if (typeof root.MID_PREPROCESS === 'undefined' ||
        typeof root.MID_PREPROCESS.fileToCanvas !== 'function') {
      return Promise.reject(_err('preprocess module unavailable'));
    }
    return root.MID_PREPROCESS.fileToCanvas(file, MAX_EDGE_PX).then(function (canvas) {
      return [{ canvas: canvas, dpi: null, source: 'image' }];
    });
  }

  // Multi-page TIFF → array of page bundles. Reuses the existing
  // tiff-to-jpegs path from preprocess; each page comes back as a
  // File which we then route through fileToCanvas.
  function _normalizeTiff(file) {
    var P = root.MID_PREPROCESS;
    if (!P || typeof P.tiffToPageFiles !== 'function') {
      return Promise.reject(_err('TIFF support module unavailable'));
    }
    return P.tiffToPageFiles(file, { maxPages: 8, maxEdge: 2400 }).then(function (out) {
      return Promise.all(out.files.map(function (f) {
        return P.fileToCanvas(f, MAX_EDGE_PX).then(function (canvas) {
          return { canvas: canvas, dpi: null, source: 'image' };
        });
      }));
    });
  }

  // PDF input → text-layer fast path when the PDF has embedded
  // text, image-rasterization path otherwise. The actual logic
  // already lives in pdf-extract; we just adapt the output shape.
  function _normalizePdf(file) {
    var X = root.MID_PDF_EXTRACT;
    if (!X || typeof X.extractPdf !== 'function') {
      return Promise.reject(_err('PDF support module unavailable'));
    }
    return X.extractPdf(file).then(function (result) {
      // result = { lines, fullText, perPage, hasTextLayer, ... }
      // When hasTextLayer is true, parse.js can run directly on
      // result.lines with no OCR needed. The v2 engine routes
      // around itself in that case — same as the v1 path.
      if (result && result.hasTextLayer && Array.isArray(result.lines) && result.lines.length) {
        // Synthesize a single bundle whose textLayer carries the
        // ready-made lines; layout/ocr-engine will short-circuit.
        return [{
          canvas: null, dpi: null, source: 'pdf-text',
          textLayer: { lines: result.lines, fullText: result.fullText, perPage: result.perPage }
        }];
      }
      // No text layer — rasterize each page and return as image bundles.
      if (typeof X.rasterizeImageOnlyPdf !== 'function') {
        return Promise.reject(_err('PDF rasterizer unavailable'));
      }
      return X.rasterizeImageOnlyPdf(file, { maxPages: 8, maxEdge: MAX_EDGE_PX })
        .then(function (pages) {
          return pages.map(function (p) {
            return { canvas: p.canvas, dpi: p.dpi || null, source: 'pdf-image' };
          });
        });
    });
  }

  // Public entry point. Returns Promise<PageBundle[]>.
  function normalizeFile(file) {
    if (!file) return Promise.reject(_err('no file given'));
    if (_isPdf(file)) return _normalizePdf(file);
    var P = root.MID_PREPROCESS;
    if (P && typeof P._isTiffFile === 'function' && P._isTiffFile(file)) return _normalizeTiff(file);
    return _normalizeImage(file);
  }

  var api = {
    normalizeFile:   normalizeFile,
    MAX_EDGE_PX:     MAX_EDGE_PX
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_NORMALIZE = api;
})(typeof window !== 'undefined' ? window : null);
