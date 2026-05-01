/**
 * Invoice Decoder — substitution detection (domain-expert layer).
 *
 * Restaurant distributors sub items routinely: the operator orders
 * "U-15 SHRIMP P&D 5LB" but the warehouse is out so the truck
 * arrives with "U-21 SHRIMP P&D 5LB" — a different SKU at a
 * similar per-lb price. The current row has no exact-match history
 * (it's a new stem the operator hasn't seen) but the operator's
 * fingerprint says "you usually buy something nearly identical."
 *
 * Detection strategy (all conditions must hold):
 *   1. Current row has no exact-match history (≤2 prior observations
 *      under its own stem — anything more would be its own SKU).
 *   2. There exists a saved-history stem with similarity ≥0.55
 *      (Jaccard on character bigrams + token overlap), ≥3 prior
 *      observations, AND comparablePrice / comparableUnit on file.
 *   3. Current row's comparablePrice (when present) is within 25%
 *      of the candidate's median comparablePrice — substitutions
 *      typically come in at a similar per-unit cost; large gaps
 *      suggest a different item entirely.
 *
 * Conservative philosophy:
 *   - We DO NOT auto-categorize substitutions or change row.kind.
 *     The chip is informational; the operator decides whether to
 *     accept the row as the substitute or correct it manually.
 *   - When the current row's comparablePrice is missing, we can
 *     still surface a candidate but mark confidence as 'low'.
 *   - One candidate per row, the highest-similarity match.
 *
 * Privacy posture: pure on-device. Reads sku-history's local store
 * via MID_SKU_HISTORY.lookupHistory + stemOf. No fetches.
 */
(function (root) {
  'use strict';

  var MIN_SIMILARITY      = 0.55;
  var MIN_HISTORY_OBS     = 3;
  var MAX_PRICE_GAP_PCT   = 25;
  var SELF_HISTORY_CEILING = 2;     // ≤2 own-stem observations counts as "new"

  // Resolve at-call so test harnesses that swap `global.window`
  // between blocks see the latest MID_LEARNINGS / MID_SKU_HISTORY.
  function getRoot() {
    var g = (typeof globalThis !== 'undefined') ? globalThis : null;
    if (g && g.window) return g.window;
    if (typeof window !== 'undefined') return window;
    return g;
  }
  function stemOf(name) {
    var r = getRoot();
    if (r && r.MID_LEARNINGS && typeof r.MID_LEARNINGS.extractStem === 'function') {
      return r.MID_LEARNINGS.extractStem(name);
    }
    return String(name || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Character-bigram + token Jaccard similarity. Bigrams catch
  // typos/abbreviations; tokens catch "u-15 shrimp pd" vs "u-21
  // shrimp pd" (same tokens except the U-grade).
  function similarity(a, b) {
    if (!a || !b || a === b) return a === b ? 1 : 0;
    var bigramScore = bigramJaccard(a, b);
    var tokenScore  = tokenJaccard(a, b);
    return bigramScore * 0.55 + tokenScore * 0.45;
  }
  function bigramJaccard(a, b) {
    var setA = bigramSet(a);
    var setB = bigramSet(b);
    var keysA = Object.keys(setA);
    var keysB = Object.keys(setB);
    if (!keysA.length || !keysB.length) return 0;
    var inter = 0;
    for (var i = 0; i < keysA.length; i++) if (setB[keysA[i]]) inter++;
    var union = keysA.length + keysB.length - inter;
    return union > 0 ? inter / union : 0;
  }
  function bigramSet(s) {
    var out = Object.create(null);
    var t = String(s || '');
    for (var i = 0; i < t.length - 1; i++) out[t.substr(i, 2)] = true;
    return out;
  }
  function tokenJaccard(a, b) {
    var ta = String(a || '').split(/\s+/).filter(function (x) { return x.length >= 2; });
    var tb = String(b || '').split(/\s+/).filter(function (x) { return x.length >= 2; });
    if (!ta.length || !tb.length) return 0;
    var setA = {};
    ta.forEach(function (x) { setA[x] = true; });
    var inter = 0;
    var seen = {};
    tb.forEach(function (x) {
      if (setA[x] && !seen[x]) { inter++; seen[x] = true; }
    });
    var union = Object.keys(setA).length + Object.keys(seen).length;
    // Token-Jaccard: |A∩B| / |A∪B|. We approximate union by adding
    // distinct B tokens not in A.
    var bExtras = 0;
    var seenB = {};
    tb.forEach(function (x) {
      if (!setA[x] && !seenB[x]) { bExtras++; seenB[x] = true; }
    });
    union = Object.keys(setA).length + bExtras;
    return union > 0 ? inter / union : 0;
  }

  // Check: does this row look like a substitute for an existing
  // saved SKU? Returns null when no candidate clears the bar.
  function detectSubstitution(row) {
    if (!row || !row.name) return null;
    var r = getRoot();
    if (!r || !r.MID_SKU_HISTORY) return null;
    var SKU = r.MID_SKU_HISTORY;
    var rowStem = stemOf(row.name);
    if (!rowStem || rowStem.length < 4) return null;

    // Has the current stem already been seen ≥SELF_HISTORY_CEILING
    // times? If so it's the operator's own SKU; not a substitution.
    var ownHistory = SKU.lookupHistory({ name: row.name });
    if (ownHistory && ownHistory.length > SELF_HISTORY_CEILING) return null;

    // Walk the full skuHistory store and find the best similar stem.
    var ctx = (r && r.MuntinContext) ? r.MuntinContext : null;
    if (!ctx) return null;
    var data = ctx.read() || {};
    var store = data.skuHistory || {};
    var stems = Object.keys(store);
    if (!stems.length) return null;

    var rowComparable = (row.comparable && typeof row.comparable.perBaseUnit === 'number')
      ? row.comparable
      : null;

    var best = null;
    for (var i = 0; i < stems.length; i++) {
      var candStem = stems[i];
      if (candStem === rowStem) continue;       // self-match excluded
      var sim = similarity(rowStem, candStem);
      if (sim < MIN_SIMILARITY) continue;
      var entries = store[candStem] || [];
      if (entries.length < MIN_HISTORY_OBS) continue;

      // Pull median of compatible-unit observations on the candidate.
      var unit = rowComparable ? rowComparable.baseUnit : null;
      var prices = entries
        .filter(function (e) {
          if (typeof e.comparablePrice !== 'number') return false;
          if (unit && e.comparableUnit !== unit) return false;
          return true;
        })
        .map(function (e) { return e.comparablePrice; });
      if (prices.length < MIN_HISTORY_OBS) continue;
      var sorted = prices.slice().sort(function (a, b) { return a - b; });
      var medIdx = Math.floor(sorted.length / 2);
      var candMed = sorted.length % 2 === 1 ? sorted[medIdx] : (sorted[medIdx - 1] + sorted[medIdx]) / 2;

      // Price-gap guard: only consider it a substitution candidate
      // when the current row's price is within MAX_PRICE_GAP_PCT.
      // When the row has no comparable, we skip the gap check and
      // mark confidence 'low'.
      var priceWithinBand = true;
      var priceConfidence = 'medium';
      if (rowComparable) {
        var gapPct = candMed > 0
          ? Math.abs(rowComparable.perBaseUnit - candMed) / candMed * 100
          : 999;
        if (gapPct > MAX_PRICE_GAP_PCT) priceWithinBand = false;
      } else {
        priceConfidence = 'low';
      }
      if (!priceWithinBand) continue;

      if (!best || sim > best.similarity) {
        best = {
          candidateStem:    candStem,
          similarity:       +sim.toFixed(3),
          observations:     entries.length,
          medianComparable: +candMed.toFixed(4),
          comparableUnit:   unit || (entries.find(function (e) { return e.comparableUnit; }) || {}).comparableUnit || null,
          confidence:       priceConfidence
        };
      }
    }
    return best;
  }

  var api = {
    detectSubstitution:   detectSubstitution,
    similarity:           similarity,
    MIN_SIMILARITY:       MIN_SIMILARITY,
    MIN_HISTORY_OBS:      MIN_HISTORY_OBS,
    MAX_PRICE_GAP_PCT:    MAX_PRICE_GAP_PCT,
    _bigramJaccard:       bigramJaccard,
    _tokenJaccard:        tokenJaccard
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_SUBSTITUTION = api;
})(typeof window !== 'undefined' ? window : null);
