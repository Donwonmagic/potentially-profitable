/**
 * Menu Design Suite — i18n helpers (W18 extraction).
 *
 * owns:    locale detection + tt(en, es) translation helper
 * exports: MD_I18N on window; module.exports for tests
 * deps:    none
 * why:     Inlined throughout menu-design.js as `tt(en, es)` calls
 *          (see commit history of W6+); centralizing here lets the
 *          future en.js / es.js dictionaries land cleanly without
 *          touching every call site.
 *
 * Trade-off: the current `tt(en, es)` shape inlines both strings at
 * the call site. Migrating to key-based lookup (`t('encourage.5dishes')`)
 * is a future wave. This module ships the helper as-is to unblock
 * the rest of the W18 module split.
 */
(function (root) {
  'use strict';

  // Detect from <html lang> on the document. Falls back to 'en'.
  function detect() {
    if (typeof document === 'undefined') return 'en';
    var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().slice(0, 2);
    return lang === 'es' ? 'es' : 'en';
  }
  function tt(locale, en, es) {
    return locale === 'es' ? es : en;
  }
  // Convenience: bind a locale once, return a `t` function.
  function bind(locale) {
    return function (en, es) { return tt(locale, en, es); };
  }

  var api = {
    detect: detect,
    tt:     tt,
    bind:   bind
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_I18N = api;
})(typeof window !== 'undefined' ? window : null);
