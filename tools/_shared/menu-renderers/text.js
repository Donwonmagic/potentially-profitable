/**
 * Canonical entry for the Menu Design text renderer (Wave A2 — partial).
 *
 * The actual source lives at tools/menu-design/menu-render-text.js.
 * This re-export shim is the agreed-upon canonical import path for
 * sister tools (menu-engineering, menu-copy, menu-converter) so they
 * can render styled text/markdown/SSML/BRF without depending on
 * tools/menu-design/ implementation paths.
 *
 * Surface (mirrored from menu-render-text.js):
 *   exportMarkdown, exportPlainText, exportSsml, exportBrf
 *
 * Also attaches MD_TEXT to window when used in a browser, identical
 * to the source module — so a sister tool's <script src> can point
 * here OR at the source file interchangeably.
 *
 * The full move (source relocation + 15-importer cascade + sw.js
 * cache update) is deferred to a future session backed by
 * tools/menu-design/snapshot-renderers.test.mjs as regression cover.
 */
(function (root) {
  'use strict';

  // Node: forward to the existing source module.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = require('../../menu-design/menu-render-text.js');
    return;
  }

  // Browser: the source's IIFE will have already attached MD_TEXT to
  // window if menu-design's index.html loaded it. If a sister tool
  // includes this file BEFORE the source, the source will overwrite
  // window.MD_TEXT — same end state. If neither has loaded, this
  // shim doesn't load the source (script-src can't recurse from JS
  // without document.write). Sister tools must include the source
  // file in their <script> tags; this shim is a Node entry point.
  if (root && !root.MD_TEXT) {
    // Marker so sister tools can detect "shim is here, source not loaded yet".
    root.MD_TEXT = root.MD_TEXT || null;
  }
})(typeof window !== 'undefined' ? window : null);
