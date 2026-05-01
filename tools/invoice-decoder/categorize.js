/**
 * Invoice Decoder — categorize.js (Wave B4).
 *
 * Three-tier line-item classifier. Tiers ship in separate atomic
 * commits so the diff stays inspectable:
 *
 *   1. Lexicon data (9 bilingual categories)
 *   2. Tier-1 exact-substring match
 *   3. Tier-2 Levenshtein-distance fuzzy match
 *   4. Tier-3 unit + price-band heuristic
 *   5. Top-level classify() that runs all three in order
 *
 * Output shape: { category, confidence, tier } where category is
 * one of the 9 buckets (or null when nothing fires), confidence
 * is 0..100, and tier names which path won.
 */
(function (root) {
  'use strict';

  // Lexicon + tiers land in subsequent atomic commits.
  var LEXICON = null;

  function classify(/* row */) {
    return { category: null, confidence: 0, tier: 'none' };
  }

  var api = {
    classify: classify,
    LEXICON: LEXICON
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_CATEGORIZE = api;
})(typeof window !== 'undefined' ? window : null);
