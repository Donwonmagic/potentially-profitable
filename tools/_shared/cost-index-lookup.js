/**
 * Muntin — Cost Index lookup: match a recipe/invoice ingredient name to the
 * Cost Index seed and return its current WHOLESALE REFERENCE.
 *
 * The shared core of the "connected loop": Plate Cost (storefront) and the
 * Muntin Ledger invoice decoder both need to bind a free-typed ingredient name
 * to a Cost Index key and read its reference price. One module, so the two
 * surfaces match identically.
 *
 * THE HONESTY RULE (load vs delivered): the Cost Index is a WHOLESALE reference,
 * never the delivered price an operator pays. `wholesaleCents` is returned ONLY
 * when the matched ingredient has a medium+ confidence dollar level on a
 * wholesale/delivered basis (an index series never yields a dollar level). The
 * caller MUST label it "wholesale reference — your delivered price is usually
 * higher" and never auto-assert it as the operator's cost. A match with no
 * publishable level still returns identity (so the UI can link), with
 * wholesaleCents = null.
 *
 * Matching reuses MuntinStem + MuntinSkuMatch when present (browser), and falls
 * back to exact / token-subset matching in Node so it stays unit-testable.
 *
 * match(name, seed) -> {
 *   key, label_en, label_es, unit_en, unit_es,
 *   wholesaleCents, rangeCents, basis, asOf, confidence, tier ('auto'|'propose')
 * } | null
 *
 * Pure, deterministic, no DOM/network. Browser: window.MuntinCostIndexLookup.
 */
(function (root) {
  'use strict';

  function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim(); }
  function tokens(s) { return norm(s).split(/[^a-z0-9]+/).filter(Boolean); }
  function stemOf(s) {
    var S = root && root.MuntinStem;
    return (S && S.extractStem) ? S.extractStem(s) : norm(s);
  }
  // Candidate strings for an ingredient: de-hyphenated key + labels with any
  // parenthetical (e.g. "(boneless)") stripped, all normalized.
  function cands(it) {
    var out = [];
    if (it.key) out.push(it.key.replace(/-/g, ' '));
    if (it.label_en) out.push(it.label_en.replace(/\s*\([^)]*\)\s*/g, ' '));
    if (it.label_es) out.push(it.label_es.replace(/\s*\([^)]*\)\s*/g, ' '));
    return out.map(norm).filter(Boolean);
  }
  function subset(a, b) { // every token of a present in b
    if (!a.length) return false;
    for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) < 0) return false;
    return true;
  }

  function reference(it, tier) {
    var a = it.assessment || {};
    var lvl = a.level || null;
    var conf = a.confidence || null;
    var firm = conf === 'high' || conf === 'medium';
    var hasDollar = !!(lvl && typeof lvl.medianCents === 'number' && lvl.basis !== 'index' && firm);
    return {
      key: it.key,
      label_en: it.label_en, label_es: it.label_es,
      unit_en: it.unit_en || 'unit', unit_es: it.unit_es || 'unidad',
      wholesaleCents: hasDollar ? lvl.medianCents : null,
      rangeCents: hasDollar && Array.isArray(lvl.rangeCents) ? lvl.rangeCents : null,
      basis: lvl ? (lvl.basis || null) : null,
      asOf: a.asOf || null,
      confidence: conf,
      tier: tier
    };
  }

  function match(name, seed) {
    if (!name || !seed) return null;
    var items = seed.ingredients || seed;
    if (!Array.isArray(items) || !items.length) return null;
    var n = norm(name);
    if (n.length < 2) return null;
    var nTok = tokens(n), nStem = stemOf(name);

    var auto = null, propose = null;
    for (var i = 0; i < items.length; i++) {
      var cs = cands(items[i]);
      for (var j = 0; j < cs.length; j++) {
        var c = cs[j];
        if (c === n || stemOf(c) === nStem) { auto = items[i]; break; }
        if (!propose && c.length >= 3) {
          var cTok = tokens(c);
          if (subset(nTok, cTok) || subset(cTok, nTok)) propose = items[i];
        }
      }
      if (auto) break;
    }
    if (!auto && propose == null && root && root.MuntinSkuMatch && root.MuntinSkuMatch.classify) {
      // Browser fuzzy fallback (Levenshtein + Jaccard) for typos/variants.
      var bestScore = -1, bestItem = null;
      for (var k = 0; k < items.length; k++) {
        var cl = root.MuntinSkuMatch.classify(name, cands(items[k]));
        if (cl && (cl.tier === 'auto' || cl.tier === 'propose')) {
          var sc = typeof cl.score === 'number' ? cl.score : 0;
          if (sc > bestScore) { bestScore = sc; bestItem = items[k]; }
        }
      }
      if (bestItem) propose = bestItem;
    }
    var hit = auto || propose;
    return hit ? reference(hit, auto ? 'auto' : 'propose') : null;
  }

  var api = { match: match };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinCostIndexLookup = api;
  if (root) root.MuntinCostIndexLookup = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
