/**
 * Canonical entry for the Menu Design ESC/POS thermal-printer
 * emitter (Wave C1 finish, A2 partial pattern).
 *
 * The actual source lives at tools/menu-design/menu-render-escpos.js.
 * Sister tools (kitchen-display, daily-specials, etc.) that want to
 * produce thermal-printer-ready output should import from this
 * canonical path rather than depending on tools/menu-design/.
 *
 * Surface (mirrored):
 *   exportEscpos({ rows, theme, meta, title, locale, paperWidth })
 *     → { blob, filename, byteCount }
 *   buildEscpos({ ... }) → Uint8Array
 */
(function (root) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = require('../../menu-design/menu-render-escpos.js');
    return;
  }
  if (root && !root.MD_ESCPOS) {
    root.MD_ESCPOS = root.MD_ESCPOS || null;
  }
})(typeof window !== 'undefined' ? window : null);
