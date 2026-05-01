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
  function recordOverride(rawName, category) {
    var key = normalize(rawName);
    if (!key || !category) return false;
    var arr = readStore();
    var existingIdx = -1;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] && arr[i].rawNorm === key) { existingIdx = i; break; }
    }
    if (existingIdx !== -1) {
      arr.splice(existingIdx, 1);  // remove old to bump timestamp
    }
    arr.unshift({ rawNorm: key, category: category, ts: Date.now() });
    if (arr.length > CAP) arr = arr.slice(0, CAP);
    return writeStore(arr);
  }

  // Look up a category for a rawName. Returns null when no match.
  // Uses normalized substring match — operator's "house guacamole"
  // matches future "house guacamole 32oz" because the substring
  // overlap with the stored key is exact.
  function lookupOverride(rawName) {
    var key = normalize(rawName);
    if (!key) return null;
    var arr = readStore();
    for (var i = 0; i < arr.length; i++) {
      var k = arr[i] && arr[i].rawNorm;
      if (!k) continue;
      // Exact match wins.
      if (k === key) return { category: arr[i].category, confidence: 95, tier: 'learned' };
      // Substring match in either direction (operator typed shorter
      // form, OR new SKU includes a learned phrase).
      if (k.length >= 4 && (key.indexOf(k) !== -1 || k.indexOf(key) !== -1)) {
        return { category: arr[i].category, confidence: 90, tier: 'learned' };
      }
    }
    return null;
  }

  function clearAll() { writeStore([]); }

  function listAll() { return readStore().slice(); }

  var api = {
    recordOverride: recordOverride,
    lookupOverride: lookupOverride,
    clearAll:       clearAll,
    listAll:        listAll,
    _normalize:     normalize
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_LEARNINGS = api;
})(typeof window !== 'undefined' ? window : null);
