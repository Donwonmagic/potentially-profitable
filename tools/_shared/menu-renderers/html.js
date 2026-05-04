/**
 * Canonical entry for the Menu Design HTML renderer (Wave A2 — partial).
 *
 * The actual source lives at tools/menu-design/menu-render-html.js.
 * This re-export shim is the agreed-upon canonical import path for
 * sister tools (menu-engineering, menu-copy, menu-converter) so they
 * can render the QR-menu HTML output (or a styled preview of an
 * operator's menu) without depending on tools/menu-design/
 * implementation paths.
 *
 * Surface (mirrored from menu-render-html.js):
 *   exportHtml
 *
 * Also attaches MD_HTML to window when used in a browser, identical
 * to the source module — so a sister tool's <script src> can point
 * here OR at the source file interchangeably.
 *
 * The full source-move + importer cascade is deferred to a future
 * session backed by tools/menu-design/snapshot-renderers.test.mjs
 * as regression cover.
 */
(function (root) {
  'use strict';

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = require('../../menu-design/menu-render-html.js');
    return;
  }

  if (root && !root.MD_HTML) {
    root.MD_HTML = root.MD_HTML || null;
  }
})(typeof window !== 'undefined' ? window : null);
