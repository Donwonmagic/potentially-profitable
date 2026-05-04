/**
 * Shared SKU-match tier classifier (Wave 10.1).
 *
 * Given a candidate ingredient name from Plate Cost (or any tool that
 * needs to bind a recipe row to invoice history) and a list of known
 * stems from the operator's invoice corpus, return the best match
 * with a confidence tier:
 *
 *   { tier: 'auto' | 'propose' | 'manual' | 'none', stem, score, why }
 *
 * Tiers (mirrors sku-history conventions):
 *   - 'auto'   — identical stem after normalization. Bind silently.
 *   - 'propose'— Levenshtein ≤ 2 OR token-set overlap ≥ 0.6 OR strict
 *                substring ≥ 4 chars. Render a "match found" pill;
 *                operator confirms with one tap.
 *   - 'manual' — close-but-not-confident. Caller surfaces a picker.
 *   - 'none'   — no candidate stem within edit distance of 4.
 *
 * Pure function. No localStorage, no fetch, no DOM. Safe to import
 * in tests.
 *
 * Privacy posture: input strings live in this function's scope only.
 * Returns the matched stem (which is the operator's own normalized
 * SKU stem they typed) — never any cross-tenant data.
 */
(function (root) {
  'use strict';

  // We rely on tools/_shared/stem.js for normalize + extractStem.
  function _stem() {
    if (root && root.MuntinStem) return root.MuntinStem;
    if (typeof require !== 'undefined') {
      try { return require('./stem.js'); } catch (_) { return null; }
    }
    return null;
  }

  // Standard Levenshtein with early-out when distance exceeds maxDist.
  function _editDistance(a, b, maxDist) {
    if (a === b) return 0;
    var alen = a.length, blen = b.length;
    if (!alen) return blen;
    if (!blen) return alen;
    if (Math.abs(alen - blen) > (maxDist != null ? maxDist : Infinity)) return Infinity;
    var prev = new Array(blen + 1);
    var curr = new Array(blen + 1);
    for (var j = 0; j <= blen; j++) prev[j] = j;
    for (var i = 1; i <= alen; i++) {
      curr[0] = i;
      var rowMin = curr[0];
      for (var j2 = 1; j2 <= blen; j2++) {
        var cost = (a.charAt(i - 1) === b.charAt(j2 - 1)) ? 0 : 1;
        curr[j2] = Math.min(curr[j2 - 1] + 1, prev[j2] + 1, prev[j2 - 1] + cost);
        if (curr[j2] < rowMin) rowMin = curr[j2];
      }
      if (maxDist != null && rowMin > maxDist) return Infinity;
      var tmp = prev; prev = curr; curr = tmp;
    }
    return prev[blen];
  }

  function _tokenSet(s) {
    var out = Object.create(null);
    String(s || '').split(/\s+/).forEach(function (t) {
      if (t.length >= 2) out[t] = true;
    });
    return out;
  }
  function _tokenSetJaccard(a, b) {
    var sa = _tokenSet(a), sb = _tokenSet(b);
    var ka = Object.keys(sa), kb = Object.keys(sb);
    if (!ka.length || !kb.length) return 0;
    var inter = 0;
    for (var i = 0; i < ka.length; i++) if (sb[ka[i]]) inter++;
    var union = ka.length + kb.length - inter;
    return union > 0 ? inter / union : 0;
  }
  function _strictSubstring(a, b, minOverlap) {
    if (!a || !b) return false;
    var min = Math.min(a.length, b.length);
    if (min < (minOverlap || 4)) return false;
    return a.indexOf(b) !== -1 || b.indexOf(a) !== -1;
  }

  // classify(name, candidateStems[, opts])
  //
  //   name      — the ingredient name to match (will be stem-normalized)
  //   candidates— array of stems already present in the operator's
  //               history. Each candidate is itself a stem (already
  //               normalized via MuntinStem.extractStem).
  //   opts.minLen — minimum stem length to consider (default 3)
  function classify(name, candidates, opts) {
    opts = opts || {};
    var stem = _stem();
    if (!stem) {
      return { tier: 'none', stem: null, score: 0, why: 'MuntinStem-missing' };
    }
    var query = stem.extractStem(name);
    var minLen = opts.minLen || 3;
    if (!query || query.length < minLen) {
      return { tier: 'none', stem: null, score: 0, why: 'query-too-short' };
    }
    if (!Array.isArray(candidates) || !candidates.length) {
      return { tier: 'none', stem: null, score: 0, why: 'no-candidates' };
    }
    // Pass 1 — exact match.
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i] === query) {
        return { tier: 'auto', stem: query, score: 1.0, why: 'exact' };
      }
    }
    // Pass 2 — propose: Levenshtein ≤ 2 OR Jaccard ≥ 0.6 OR substring.
    var bestProposal = null;
    var bestScore = 0;
    for (var k = 0; k < candidates.length; k++) {
      var cand = candidates[k];
      if (!cand || cand.length < minLen) continue;
      // Cheap-first: token-set Jaccard on space-tokenized stems.
      var jac = _tokenSetJaccard(query, cand);
      if (jac >= 0.6) {
        if (jac > bestScore) { bestScore = jac; bestProposal = { stem: cand, score: jac, why: 'jaccard-' + jac.toFixed(2) }; }
        continue;
      }
      // Strict substring (4+ chars overlap).
      if (_strictSubstring(query, cand, 4)) {
        var subScore = Math.min(query.length, cand.length) / Math.max(query.length, cand.length);
        if (subScore > bestScore) { bestScore = subScore; bestProposal = { stem: cand, score: subScore, why: 'substring' }; }
        continue;
      }
      // Levenshtein ≤ 2.
      var d = _editDistance(query, cand, 2);
      if (d <= 2) {
        var levScore = 1 - (d / Math.max(query.length, cand.length));
        if (levScore > bestScore) { bestScore = levScore; bestProposal = { stem: cand, score: levScore, why: 'lev-' + d }; }
      }
    }
    if (bestProposal) {
      return { tier: 'propose', stem: bestProposal.stem, score: +bestProposal.score.toFixed(3), why: bestProposal.why };
    }
    // Pass 3 — manual: best Levenshtein ≤ 4.
    var bestManual = null;
    var bestDist = 5;
    for (var m = 0; m < candidates.length; m++) {
      var cm = candidates[m];
      if (!cm || cm.length < minLen) continue;
      var dm = _editDistance(query, cm, 4);
      if (dm < bestDist) { bestDist = dm; bestManual = cm; }
    }
    if (bestManual) {
      return { tier: 'manual', stem: bestManual, score: +(1 - bestDist / Math.max(query.length, bestManual.length)).toFixed(3), why: 'lev-' + bestDist };
    }
    return { tier: 'none', stem: null, score: 0, why: 'no-match' };
  }

  // Bulk classify: walk a list of names against the same candidate
  // pool. Returns an array of {name, classification}. Sorts auto-tier
  // matches first so callers can apply them silently and surface
  // propose/manual tiers in the UI.
  function classifyMany(names, candidates, opts) {
    if (!Array.isArray(names) || !names.length) return [];
    return names.map(function (n) {
      return { name: n, classification: classify(n, candidates, opts) };
    });
  }

  var api = {
    classify:        classify,
    classifyMany:    classifyMany,
    _editDistance:   _editDistance,
    _tokenSetJaccard: _tokenSetJaccard
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinSkuMatch = api;
  if (root) root.MuntinSkuMatch = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
