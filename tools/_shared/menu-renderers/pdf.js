/**
 * Canonical entry for the Menu Design PDF renderer (Wave A2 — partial).
 *
 * The actual source lives at tools/menu-design/menu-render-pdf.js.
 * This re-export shim is the agreed-upon canonical import path for
 * sister tools (menu-engineering, menu-copy, menu-converter) so they
 * can produce print-ready PDFs from the canonical menu schema without
 * depending on tools/menu-design/ implementation paths.
 *
 * Surface (mirrored from menu-render-pdf.js):
 *   exportPdf, PAPERS, applyLargePrintOverride,
 *   applyHighContrastOverride, estimatePages
 *
 * The PDF renderer is heavy (~120 KB unminified). Sister tools should
 * lazy-load it on first export, never at boot. See A3 for the
 * boot-vs-export code-split that this shim is part of the foundation for.
 *
 * Also attaches MD_PDF to window when used in a browser, identical to
 * the source module — so a sister tool's <script src> can point here
 * OR at the source file interchangeably.
 *
 * The full source-move + importer cascade (15+ scripts and HTML files
 * reference the source path directly) is deferred to a future session
 * backed by tools/menu-design/snapshot-renderers.test.mjs as
 * regression cover.
 */
(function (root) {
  'use strict';

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = require('../../menu-design/menu-render-pdf.js');
    return;
  }

  if (root && !root.MD_PDF) {
    root.MD_PDF = root.MD_PDF || null;
  }
})(typeof window !== 'undefined' ? window : null);
