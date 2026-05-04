/**
 * Shared SKU-stem normalization (Wave 10.0a).
 *
 * Lifted out of `tools/invoice-decoder/learnings.js` so cross-tool
 * consumers (Plate Cost, Menu Engineering, Margin Math, Cost Pulse)
 * can normalize ingredient/SKU names identically to Invoice Decoder.
 * Without this lift the per-tool stem extraction would diverge silently
 * the moment the DROP_TOKENS regex evolves.
 *
 * Two functions, both pure:
 *
 *   normalize(s)
 *     - lowercases
 *     - strips Latin accent diacritics (á → a, ñ → n, etc)
 *     - drops non-alphanumeric/space characters
 *     - collapses whitespace
 *
 *   extractStem(rawName)
 *     - normalizes
 *     - drops digit + pack-notation + brand-quantifier tokens
 *     - returns the alphabetic core, e.g.
 *       "STELLA ARTOIS 24/12 BTL" → "stella artois"
 *
 * Backward compat: `tools/invoice-decoder/learnings.js` re-exports
 * MID_LEARNINGS.extractStem so existing call sites continue to work
 * unchanged.
 */
(function (root) {
  'use strict';

  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
      .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Drop digit + pack-notation + brand-quantifier tokens. Conservative —
  // keeps anything alphabetic that might carry meaning.
  var DROP_TOKENS = /\b(\d+|\d+\/\d+|lg|md|sm|xl|xxl|frzn|frz|fzn|iqf|cs|ea|ct|lb|kg|oz|gal|btl|can|pk|case|count|each)\b/g;
  function extractStem(rawName) {
    var n = normalize(rawName);
    if (!n) return '';
    return n.replace(DROP_TOKENS, '').replace(/\s+/g, ' ').trim();
  }

  var api = {
    normalize:    normalize,
    extractStem:  extractStem,
    DROP_TOKENS:  DROP_TOKENS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinStem = api;
  if (root) root.MuntinStem = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
