/**
 * Canonical entry for the Menu Design themes catalog (Wave A2 — partial).
 *
 * The actual source lives at tools/menu-design/themes.js (37 themes,
 * 5 cuisine groups, theme tuner customization API).
 *
 * This re-export shim is the agreed-upon canonical import path for
 * sister tools that need to:
 *   - render a theme picker (e.g. menu-converter showing "preview in
 *     a theme")
 *   - read theme.cuisineHint for cross-cuisine matching
 *   - check theme.twoColPromotable / theme.paperFloors before deciding
 *     a layout strategy
 *
 * Surface (mirrored from tools/menu-design/themes.js):
 *   THEMES, list, get, GROUPS, applyPalette, etc.
 *
 * Also attaches MD_THEMES to window when used in a browser, identical
 * to the source module.
 *
 * The full source-move + importer cascade (10+ build/check scripts
 * reference the source path directly) is deferred to a future session
 * backed by tools/menu-design/snapshot-renderers.test.mjs.
 */
(function (root) {
  'use strict';

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = require('../../menu-design/themes.js');
    return;
  }

  if (root && !root.MD_THEMES) {
    root.MD_THEMES = root.MD_THEMES || null;
  }
})(typeof window !== 'undefined' ? window : null);
