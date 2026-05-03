/**
 * Invoice Decoder — per-operator category learnings (Phase 7 W7-8).
 *
 * The lexicon (categorize.js LEXICON) is the floor — covers ~600
 * SKU stems that hit ~95% of independent-restaurant orders. Below
 * that there are operator-specific items the global lexicon never
 * sees: house-made batters, regional brands, custom bulk SKUs.
 *
 * Every time an operator overrides a category in the verification
 * UX (commitCellEdit with field='category'), we record the row's
 * normalized name → chosen category. Next time that name appears,
 * the categorize() function checks this store FIRST (Tier 0) and
 * short-circuits with confidence 95.
 *
 * Storage: MuntinContext.invoiceLearnings = [{ rawNorm, category, ts }]
 * capped at 100 (FIFO eviction). Stays on device — same posture as
 * existing MuntinContext writes. No ML, no cross-operator pooling,
 * no benchmarks.
 */
(function (root) {
  'use strict';

  var CAP = 100;

  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
      .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Wave 4.5 — extract a canonical "stem" from a noisy SKU string.
  // The stem is the alphabetic core after dropping (a) digits, (b)
  // pack notation tokens (24CT, 12/16OZ, 6#10), (c) brand-quantifier
  // adjectives (LRG, XL, FRZN), and (d) trailing distributor codes.
  // Used for variant propagation: correcting "STELLA ARTOIS 24/12 BTL"
  // also matches future "STELLA ARTOIS 12/22 CAN" via the shared
  // "stella artois" stem.
  var DROP_TOKENS = /\b(\d+|\d+\/\d+|lg|md|sm|xl|xxl|frzn|frz|fzn|iqf|cs|ea|ct|lb|kg|oz|gal|btl|can|pk|case|count|each)\b/g;
  function extractStem(rawName) {
    var n = normalize(rawName);
    if (!n) return '';
    return n.replace(DROP_TOKENS, '').replace(/\s+/g, ' ').trim();
  }

  // Wave 4.5 — find bilingual synonyms in the global lexicon. Given a
  // term + category, scan the matching category bucket for entries
  // whose en[]/es[] include the term and return the OTHER side's
  // strongest match.
  function findCrossLanguageSynonym(term, category) {
    if (typeof root === 'undefined' || !root || !root.MID_CATEGORIZE) return null;
    var lex = root.MID_CATEGORIZE.LEXICON;
    if (!lex || !lex[category]) return null;
    var t = normalize(term);
    var entries = lex[category];
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var enList = e.en || [], esList = e.es || [];
      var inEn = enList.some(function (x) { return normalize(x) === t; });
      var inEs = esList.some(function (x) { return normalize(x) === t; });
      if (inEn && esList.length) return esList[0];
      if (inEs && enList.length) return enList[0];
    }
    return null;
  }

  function readStore() {
    try {
      if (typeof root.MuntinContext === 'undefined') return [];
      var ctx = root.MuntinContext.read() || {};
      return Array.isArray(ctx.invoiceLearnings) ? ctx.invoiceLearnings : [];
    } catch (_) { return []; }
  }

  function writeStore(arr) {
    try {
      if (typeof root.MuntinContext === 'undefined') return false;
      return root.MuntinContext.merge({ invoiceLearnings: arr });
    } catch (_) { return false; }
  }

  // Record a category override. If the same rawNorm exists, we
  // update its category (operator changed their mind) and bump
  // its timestamp. New entries push onto the front; FIFO eviction
  // keeps the cap.
  //
  // Wave 4.5 upgrades:
  //   - Stem propagation: also stores the canonical stem so future
  //     SKU variants (different pack/size of the same item) match
  //     without a second correction.
  //   - Bilingual mirror: when the category bucket contains a
  //     cross-language synonym for the corrected term, store that
  //     too — operator who corrects "salsa de soya" → dry-goods also
  //     trains "soy sauce" → dry-goods (and vice versa).
  function recordOverride(rawName, category) {
    var key = normalize(rawName);
    if (!key || !category) return false;
    var arr = readStore();
    function pushOrBump(entryKey, source) {
      if (!entryKey) return;
      var existingIdx = -1;
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] && arr[i].rawNorm === entryKey) { existingIdx = i; break; }
      }
      if (existingIdx !== -1) arr.splice(existingIdx, 1);
      arr.unshift({
        rawNorm:  entryKey,
        category: category,
        ts:       Date.now(),
        source:   source || 'direct'
      });
    }
    pushOrBump(key, 'direct');
    // Stem mirror — only if it's distinct from the full key.
    var stem = extractStem(rawName);
    if (stem && stem !== key && stem.length >= 4) pushOrBump(stem, 'stem');
    // Cross-language mirror — best-effort lookup against the lexicon.
    var synonym = findCrossLanguageSynonym(key, category);
    if (synonym) {
      var syn = normalize(synonym);
      if (syn && syn !== key) pushOrBump(syn, 'bilingual');
    }
    if (arr.length > CAP) arr = arr.slice(0, CAP);
    return writeStore(arr);
  }

  // Look up a category for a rawName. Returns null when no match.
  // Uses normalized substring match — operator's "house guacamole"
  // matches future "house guacamole 32oz" because the substring
  // overlap with the stored key is exact.
  //
  // Wave 4.5 — also tries the canonical stem (pack/size stripped) so
  // a learning recorded for one SKU variant matches future variants.
  // Returns the matched entry's `source` so the proof flyout can
  // surface "auto-applied via your previous correction" attribution.
  function lookupOverride(rawName) {
    var key = normalize(rawName);
    if (!key) return null;
    var stem = extractStem(rawName);
    var arr = readStore();
    for (var i = 0; i < arr.length; i++) {
      var k = arr[i] && arr[i].rawNorm;
      if (!k) continue;
      // Exact match wins.
      if (k === key) {
        return { category: arr[i].category, confidence: 95, tier: 'learned', source: arr[i].source || 'direct', matched: k };
      }
    }
    // Second pass — substring (longer of either) for related variants.
    for (var j = 0; j < arr.length; j++) {
      var kk = arr[j] && arr[j].rawNorm;
      if (!kk || kk.length < 4) continue;
      if (key.indexOf(kk) !== -1 || kk.indexOf(key) !== -1) {
        return { category: arr[j].category, confidence: 90, tier: 'learned', source: arr[j].source || 'direct', matched: kk };
      }
      if (stem && (stem.indexOf(kk) !== -1 || kk.indexOf(stem) !== -1)) {
        return { category: arr[j].category, confidence: 87, tier: 'learned', source: arr[j].source || 'stem', matched: kk };
      }
    }
    return null;
  }

  function clearAll() { writeStore([]); }

  function listAll() { return readStore().slice(); }

  // Wave 4.4 — operator-corpus user-words dictionary. Returns unique
  // tokens (length ≥ 3, alpha-only) from every correction the operator
  // has accepted. Other layers (parse.js token substitution, future
  // Tesseract user_words integration) consult this set to bias toward
  // the operator's own SKU vocabulary on subsequent OCRs. Pure local;
  // no network, no pooling.
  var __userWordsCache = null;
  function buildUserWords() {
    if (__userWordsCache) return __userWordsCache;
    var entries = readStore();
    var set = Object.create(null);
    entries.forEach(function (e) {
      var raw = String(e && e.rawNorm || '');
      raw.split(/\s+/).forEach(function (tok) {
        var t = tok.toLowerCase().replace(/[^a-z]/g, '');
        if (t.length >= 3) set[t] = (set[t] || 0) + 1;
      });
    });
    __userWordsCache = set;
    return set;
  }
  function invalidateUserWords() { __userWordsCache = null; }

  // Patch recordOverride/clearAll to invalidate the cache.
  var _origRecord = recordOverride;
  recordOverride = function () {
    var r = _origRecord.apply(null, arguments);
    invalidateUserWords();
    return r;
  };
  var _origClear = clearAll;
  clearAll = function () { var r = _origClear.apply(null, arguments); invalidateUserWords(); return r; };

  var api = {
    recordOverride: recordOverride,
    lookupOverride: lookupOverride,
    clearAll:       clearAll,
    listAll:        listAll,
    buildUserWords: buildUserWords,
    invalidateUserWords: invalidateUserWords,
    extractStem:    extractStem,
    _normalize:     normalize
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_LEARNINGS = api;
})(typeof window !== 'undefined' ? window : null);
