/**
 * Wave 9.4 — Tesseract language-pack selection.
 *
 * Default `eng+spa` reads cleanly for English + Spanish distributors,
 * which covers the operator base today. Asian / Indic / Hispanic
 * markets need additional packs:
 *
 *   chi_sim — Mandarin (simplified) — H Mart, 99 Ranch, Asian-wholesale
 *   chi_tra — Mandarin (traditional) — Hong Kong / Taiwan distributors
 *   jpn     — Japanese — Mitsuwa / Marukai / sushi distributors
 *   kor     — Korean — H Mart Korean SKUs, Korean halal/specialty
 *
 * Each pack is ~10-12 MB and only loads on capable devices (per
 * device-tier.js) AND when at least one of these signals is present:
 *
 *   1. The matched vendor template declares `requiresLang: 'chi_sim'`
 *      (e.g., asian-wholesale.json, h-mart.json).
 *   2. MuntinContext.preferredLanguagePacks lists the lang
 *      (e.g., the operator self-identified during onboarding).
 *   3. A previously-saved invoice from this MuntinContext came from
 *      a vendor template that requires the lang — sticky preference,
 *      auto-applied to subsequent invoices.
 *
 * Privacy posture: language preference is one short string per pack,
 * stored alongside other MuntinContext keys. No fingerprinting; no
 * server-side log of operator demographics.
 */
(function (root) {
  'use strict';

  // The packs the build can ship (must match scripts/vendor-pin.mjs
  // LANG_PACKS entries marked optional). 'eng' and 'spa' always load.
  var HEAVY_PACKS = ['chi_sim', 'chi_tra', 'jpn', 'kor'];
  var BASE_PACKS  = ['eng', 'spa'];

  function _heavyEnabled() {
    if (typeof root === 'undefined' || !root) return false;
    if (root.MID_DEVICE_TIER && typeof root.MID_DEVICE_TIER.heavyEnabled === 'function') {
      return !!root.MID_DEVICE_TIER.heavyEnabled();
    }
    return false;
  }

  function _readPreferred() {
    if (!root || !root.MuntinContext || typeof root.MuntinContext.read !== 'function') return [];
    try {
      var data = root.MuntinContext.read() || {};
      var prefs = data.preferredLanguagePacks;
      if (!Array.isArray(prefs)) return [];
      return prefs.filter(function (p) { return HEAVY_PACKS.indexOf(p) !== -1; });
    } catch (_) { return []; }
  }

  function setPreferred(packs) {
    if (!root || !root.MuntinContext || typeof root.MuntinContext.merge !== 'function') return false;
    if (!Array.isArray(packs)) return false;
    var clean = packs.filter(function (p) { return HEAVY_PACKS.indexOf(p) !== -1; });
    try { root.MuntinContext.merge({ preferredLanguagePacks: clean }); return true; }
    catch (_) { return false; }
  }

  // Returns the array of additional heavy-tier packs implied by the
  // operator's saved-vendor history. Picks up "they ordered from
  // H Mart twice" → load chi_sim from invoice 3 onwards. Read from
  // MuntinContext.invoiceTrend (a small ring of recent vendor IDs).
  function _packsFromHistory() {
    if (!root || !root.MuntinContext || typeof root.MuntinContext.readTrend !== 'function') return [];
    try {
      var trend = root.MuntinContext.readTrend() || [];
      var packs = Object.create(null);
      trend.forEach(function (entry) {
        if (entry && typeof entry.requiresLang === 'string') packs[entry.requiresLang] = true;
        if (entry && Array.isArray(entry.requiresLangs)) {
          entry.requiresLangs.forEach(function (l) { packs[l] = true; });
        }
      });
      return Object.keys(packs).filter(function (p) { return HEAVY_PACKS.indexOf(p) !== -1; });
    } catch (_) { return []; }
  }

  // Compute the full Tesseract `lang` argument for the next OCR call.
  // Always includes BASE_PACKS; appends heavy packs implied by:
  //   - the vendor template (vendorEnrichment.requiresLang)
  //   - the operator's preferences
  //   - the saved-vendor history
  // On lean devices this collapses to BASE_PACKS regardless of inputs.
  function languageArg(opts) {
    opts = opts || {};
    var langs = BASE_PACKS.slice();
    if (!_heavyEnabled()) return langs.join('+');
    // Vendor-template hint (e.g., asian-wholesale.json declares
    // `"requiresLang": "chi_sim"` or `"requiresLangs": ["chi_sim", "kor"]`).
    if (opts.vendor) {
      if (typeof opts.vendor.requiresLang === 'string' &&
          HEAVY_PACKS.indexOf(opts.vendor.requiresLang) !== -1 &&
          langs.indexOf(opts.vendor.requiresLang) === -1) {
        langs.push(opts.vendor.requiresLang);
      }
      if (Array.isArray(opts.vendor.requiresLangs)) {
        opts.vendor.requiresLangs.forEach(function (l) {
          if (HEAVY_PACKS.indexOf(l) !== -1 && langs.indexOf(l) === -1) langs.push(l);
        });
      }
    }
    var prefs = _readPreferred();
    prefs.forEach(function (p) { if (langs.indexOf(p) === -1) langs.push(p); });
    var hist  = _packsFromHistory();
    hist.forEach(function (p) { if (langs.indexOf(p) === -1) langs.push(p); });
    return langs.join('+');
  }

  // Returns the heavy packs that the next OCR call would activate,
  // for the proof flyout / tier indicator. Same gating as languageArg
  // but without the BASE_PACKS prefix.
  function activeHeavyPacks(opts) {
    var arg = languageArg(opts);
    return arg.split('+').filter(function (p) { return HEAVY_PACKS.indexOf(p) !== -1; });
  }

  // Convenience flag — heavy packs available at all on this device.
  function heavyAvailable() { return _heavyEnabled(); }

  var api = {
    languageArg:     languageArg,
    activeHeavyPacks: activeHeavyPacks,
    setPreferred:    setPreferred,
    heavyAvailable:  heavyAvailable,
    HEAVY_PACKS:     HEAVY_PACKS,
    BASE_PACKS:      BASE_PACKS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_LANG_PACK = api;
})(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : null));
