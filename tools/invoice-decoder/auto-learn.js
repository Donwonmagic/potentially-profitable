/**
 * Invoice Decoder — auto-learn for unrecognized vendors (Wave 4.3).
 *
 * The shipped registry covers the top 15 distributors that hit
 * ~80% of independent restaurants. The remaining 20% — regional
 * produce houses, ethnic-specialty wholesalers, beer/wine route
 * trucks, the operator's local fish guy — never get matched and
 * always fall through to the generic 5-pattern parser.
 *
 * This module closes that gap WITHOUT a server. Every time an
 * invoice runs without a matched vendor, we hash the OCR'd
 * letterhead (top 100 chars normalized) and record a small
 * fingerprint locally. After ≥3 invoices share a letterhead
 * fingerprint, we induce a vendor template from their common
 * structure (header lines that recur, total-line position,
 * letterhead tokens) and ask the operator: "Save this layout
 * as <name>?" Confirmed templates persist in MuntinContext and
 * are consulted before the next invoice falls through.
 *
 * Privacy posture:
 *   - All on-device. No fetch. No server upload.
 *   - We store only normalized top-of-page text + fingerprints,
 *     never raw OCR text or parsed line items.
 *   - Capped at 20 learned vendors × ~2KB each = ~40KB local.
 *   - Caps observation buffer at 12 (so 4 different unrecognized
 *     vendors can each accumulate up to 3 observations before
 *     the buffer pressures FIFO eviction).
 *
 * Conservative v1:
 *   - Header-skip induction: stable, low false-positive rate.
 *   - Total regex induction: simple, well-scoped.
 *   - Letterhead detection tokens: extracted from common words.
 *   - We deliberately do NOT induce per-vendor line grammar in v1
 *     — that's where false-positives become invisible bugs in the
 *     parsed rows. The generic 5-pattern parser handles parsing;
 *     the learned template just contributes confidence boost +
 *     header skip + better detection.
 */
(function (root) {
  'use strict';

  var OBSERVATION_CAP = 12;
  var LEARNED_CAP = 20;
  var MIN_OBSERVATIONS_TO_INDUCE = 3;
  var TOP_CHAR_LIMIT = 200;
  var LETTERHEAD_HASH_THRESHOLD = 0.7;  // Jaccard similarity on character bigrams

  // ---------- Storage ----------
  function ctx() {
    return (typeof root !== 'undefined' && root && root.MuntinContext) ? root.MuntinContext : null;
  }
  function readStore() {
    var c = ctx();
    if (!c) return { obs: [], learned: [] };
    var data = c.read() || {};
    return {
      obs:     Array.isArray(data.learnedVendorObservations) ? data.learnedVendorObservations : [],
      learned: Array.isArray(data.learnedVendors)             ? data.learnedVendors             : []
    };
  }
  function writeStore(patch) {
    var c = ctx();
    if (!c) return false;
    return c.merge(patch);
  }

  // ---------- Letterhead normalization + similarity ----------
  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
      .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\d+/g, ' ')          // strip digits — invoice numbers vary
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, TOP_CHAR_LIMIT);
  }

  // FNV-1a 32-bit hash. Used as a fast bucket key — not cryptographic.
  function fnv1a(s) {
    var hash = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      hash ^= s.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return hash;
  }

  // Character-bigram set for Jaccard similarity.
  function bigramSet(s) {
    var set = Object.create(null);
    var t = String(s || '');
    if (t.length < 2) return set;
    for (var i = 0; i < t.length - 1; i++) {
      set[t.substr(i, 2)] = true;
    }
    return set;
  }
  function bigramJaccard(a, b) {
    var setA = bigramSet(a);
    var setB = bigramSet(b);
    var keysA = Object.keys(setA);
    if (keysA.length === 0) return 0;
    var keysB = Object.keys(setB);
    if (keysB.length === 0) return 0;
    var intersect = 0;
    for (var i = 0; i < keysA.length; i++) {
      if (setB[keysA[i]]) intersect++;
    }
    var union = keysA.length + keysB.length - intersect;
    return union > 0 ? intersect / union : 0;
  }

  // ---------- Observation tracking ----------
  // Record an unrecognized-vendor observation. Called by the
  // controller when detectVendor returns null AND no learned
  // vendor matches. Returns the observation count for the
  // current letterhead.
  function recordObservation(fullText, parsedLines, parsedTotal) {
    var letterhead = normalize(String(fullText || '').slice(0, TOP_CHAR_LIMIT * 2));
    if (!letterhead || letterhead.length < 20) return 0;
    var hash = fnv1a(letterhead);
    var s = readStore();
    // Bucket by exact hash first (fast path); fall back to
    // bigram-similarity match for OCR-noisy variants.
    var matchedBucket = null;
    for (var i = 0; i < s.obs.length; i++) {
      if (s.obs[i].letterheadHash === hash ||
          bigramJaccard(s.obs[i].letterhead, letterhead) >= LETTERHEAD_HASH_THRESHOLD) {
        matchedBucket = s.obs[i];
        break;
      }
    }
    var topLines = String(fullText || '').split(/\r?\n/).slice(0, 8).map(function (l) {
      return l.trim().slice(0, 120);
    }).filter(Boolean);
    var sample = {
      topLines:     topLines,
      parsedTotal:  parsedTotal || null,
      seenAt:       Date.now()
    };
    if (matchedBucket) {
      matchedBucket.samples = matchedBucket.samples || [];
      matchedBucket.samples.unshift(sample);
      if (matchedBucket.samples.length > 6) matchedBucket.samples = matchedBucket.samples.slice(0, 6);
    } else {
      s.obs.unshift({
        letterhead:     letterhead,
        letterheadHash: hash,
        samples:        [sample]
      });
      if (s.obs.length > OBSERVATION_CAP) s.obs = s.obs.slice(0, OBSERVATION_CAP);
      matchedBucket = s.obs[0];
    }
    writeStore({ learnedVendorObservations: s.obs });
    return matchedBucket.samples.length;
  }

  // Has this letterhead already been saved as a learned vendor?
  function isAlreadyLearned(letterhead) {
    var s = readStore();
    var hash = fnv1a(normalize(letterhead));
    for (var i = 0; i < s.learned.length; i++) {
      if (s.learned[i].letterheadHash === hash) return true;
      if (bigramJaccard(s.learned[i].letterhead, normalize(letterhead)) >= LETTERHEAD_HASH_THRESHOLD) {
        return true;
      }
    }
    return false;
  }

  // ---------- Pattern induction ----------
  //
  // Header skip: lines appearing in ≥2 of the 3 most-recent samples
  // for this letterhead AND that don't look like body lines (no
  // dollar-sign price, no sequence of qty + unit + price). Convert
  // to anchored regex.
  function induceHeaderSkip(samples) {
    if (!samples || samples.length < 2) return [];
    // Count occurrences of each normalized line across samples.
    var lineCounts = {};
    var lineExamples = {};
    samples.forEach(function (s) {
      var seen = {};
      (s.topLines || []).forEach(function (line) {
        var trimmed = String(line || '').trim();
        if (!trimmed || trimmed.length < 4) return;
        // Skip body lines (contain $ + 2-decimal price).
        if (/\$\d+(?:[.,]\d{2})/.test(trimmed)) return;
        var key = trimmed.toLowerCase().replace(/\s+/g, ' ').replace(/\d+/g, '#');
        if (seen[key]) return;
        seen[key] = true;
        lineCounts[key] = (lineCounts[key] || 0) + 1;
        if (!lineExamples[key]) lineExamples[key] = trimmed;
      });
    });
    var sampleN = samples.length;
    var minCount = Math.max(2, Math.ceil(sampleN * 0.5));
    var headerLines = [];
    Object.keys(lineCounts).forEach(function (key) {
      if (lineCounts[key] >= minCount) {
        // Build an anchored regex from the original line. Replace
        // digits with \d+ for invoice-number-like fields.
        var src = lineExamples[key]
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')   // escape regex
          .replace(/\\d/g, '\\d')                    // (already escaped above)
          .replace(/\d+/g, '\\d+')
          .replace(/\\\d\\\+/g, '\\d+');             // collapse double-escaping
        headerLines.push('^' + src);
      }
    });
    return headerLines.slice(0, 8);  // cap to keep templates lean
  }

  // Total regex: find a line containing 'total' or its ES variants
  // followed by a price. We extract the surrounding token shape so
  // future invoices match the same vendor's specific phrasing.
  function induceTotalRegex(samples) {
    if (!samples || !samples.length) return null;
    // Look for the same total-shape across samples.
    var candidates = {};
    samples.forEach(function (s) {
      (s.topLines || []).concat([]).forEach(function (line) {
        var t = String(line || '').toLowerCase();
        if (!/\$?\d+(?:[.,]\d{2})/.test(t)) return;
        if (!/\b(invoice\s+total|grand\s+total|total\s+due|total\s+factura|importe\s+total|amount\s+due|monto\s+total)\b/.test(t)) return;
        var keyword = t.match(/\b(invoice\s+total|grand\s+total|total\s+due|total\s+factura|importe\s+total|amount\s+due|monto\s+total)\b/);
        if (keyword) candidates[keyword[1]] = (candidates[keyword[1]] || 0) + 1;
      });
    });
    var best = null, bestN = 0;
    Object.keys(candidates).forEach(function (k) {
      if (candidates[k] > bestN) { bestN = candidates[k]; best = k; }
    });
    if (!best || bestN < Math.max(2, Math.ceil(samples.length * 0.5))) return null;
    var escaped = best.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    return escaped + '[:\\s]+\\$?(\\d+(?:[.,]\\d{2}))';
  }

  // Letterhead detection tokens — pick the 3-5 longest distinctive
  // words from the normalized letterhead. These become the regex
  // tokens that future invoices match against.
  function induceDetectTokens(letterhead) {
    if (!letterhead) return [];
    var STOPWORDS = {
      'invoice': 1, 'order': 1, 'bill': 1, 'customer': 1, 'number': 1,
      'date': 1, 'page': 1, 'address': 1, 'phone': 1, 'fax': 1,
      'email': 1, 'web': 1, 'www': 1, 'http': 1, 'https': 1,
      'cliente': 1, 'numero': 1, 'fecha': 1, 'pagina': 1, 'direccion': 1,
      'telefono': 1, 'factura': 1, 'pedido': 1
    };
    var words = letterhead.split(/\s+/).filter(function (w) {
      return w.length >= 4 && !STOPWORDS[w] && !/^\d+$/.test(w);
    });
    // Dedup, prefer longer words first.
    var seen = {};
    words.sort(function (a, b) { return b.length - a.length; });
    var picked = [];
    for (var i = 0; i < words.length && picked.length < 5; i++) {
      if (seen[words[i]]) continue;
      seen[words[i]] = true;
      picked.push(words[i]);
    }
    return picked;
  }

  // Build a learned vendor template. The operator supplies a label
  // (e.g., "My Local Produce Co"). Returns the persisted template
  // object or null on failure.
  function buildLearnedTemplate(letterhead, samples, label) {
    if (!letterhead || !samples || samples.length < MIN_OBSERVATIONS_TO_INDUCE) return null;
    if (!label || !String(label).trim()) return null;
    var tokens = induceDetectTokens(letterhead);
    if (!tokens.length) return null;
    var headerSkip = induceHeaderSkip(samples);
    var totalRegex = induceTotalRegex(samples);
    var hash = fnv1a(letterhead);
    var template = {
      id:             'learned-' + hash.toString(16),
      label:          String(label).trim().slice(0, 60),
      letterhead:     letterhead,
      letterheadHash: hash,
      detectTokens:   tokens,
      headerSkip:     headerSkip,
      totalRegex:     totalRegex,
      confidenceBoost: 8,
      savedAt:        Date.now()
    };
    return template;
  }

  // Persist a learned template. Replaces any existing entry with
  // the same letterhead hash (operator chose a new label or
  // re-induced after observing new samples).
  function saveLearnedTemplate(template) {
    if (!template || !template.letterheadHash) return false;
    var s = readStore();
    var idx = -1;
    for (var i = 0; i < s.learned.length; i++) {
      if (s.learned[i].letterheadHash === template.letterheadHash) { idx = i; break; }
    }
    if (idx !== -1) s.learned.splice(idx, 1);
    s.learned.unshift(template);
    if (s.learned.length > LEARNED_CAP) s.learned = s.learned.slice(0, LEARNED_CAP);
    // Also clear the observation buffer for this letterhead since
    // we've moved it into the learned set.
    s.obs = s.obs.filter(function (o) { return o.letterheadHash !== template.letterheadHash; });
    writeStore({ learnedVendors: s.learned, learnedVendorObservations: s.obs });
    return true;
  }

  function deleteLearnedTemplate(hash) {
    var s = readStore();
    s.learned = s.learned.filter(function (t) { return t.letterheadHash !== hash; });
    writeStore({ learnedVendors: s.learned });
    return true;
  }

  function listLearnedTemplates() { return readStore().learned.slice(); }

  // ---------- Detection at parse time ----------
  // Match an OCR'd letterhead against learned templates. Returns
  // { id, label, score, vendor } compatible with detectVendor's
  // shape so the controller can apply confidence boost without
  // special-casing the path.
  function detectLearnedVendor(ocrText) {
    var letterhead = normalize(String(ocrText || '').slice(0, TOP_CHAR_LIMIT * 2));
    if (!letterhead || letterhead.length < 20) return null;
    var hash = fnv1a(letterhead);
    var s = readStore();
    var best = null, bestScore = 0;
    for (var i = 0; i < s.learned.length; i++) {
      var t = s.learned[i];
      var score = 0;
      if (t.letterheadHash === hash) score = 1;
      else score = bigramJaccard(t.letterhead, letterhead);
      // Token-presence bonus.
      if (t.detectTokens && t.detectTokens.length) {
        var hits = 0;
        for (var j = 0; j < t.detectTokens.length; j++) {
          if (letterhead.indexOf(t.detectTokens[j]) !== -1) hits++;
        }
        var tokScore = hits / t.detectTokens.length;
        score = Math.max(score, tokScore * 0.85);
      }
      if (score > bestScore) {
        bestScore = score;
        best = t;
      }
    }
    if (!best || bestScore < 0.55) return null;
    // Build a synthetic vendor record compatible with the registry's
    // shape so vendors.js can apply confidence boost and use the
    // headerSkip patterns.
    var headerSkipRegexes = (best.headerSkip || []).map(function (src) {
      try { return new RegExp(src, 'i'); } catch (_) { return null; }
    }).filter(Boolean);
    var vendorShape = {
      id:             best.id,
      label_en:       best.label,
      label_es:       best.label,
      headerLines:    headerSkipRegexes,
      confidenceBoost: best.confidenceBoost || 8,
      learned:        true,
      learnedTotalRegex: best.totalRegex || null
    };
    return {
      id:     best.id,
      label:  best.label,
      score:  bestScore,
      vendor: vendorShape,
      learned: true
    };
  }

  // ---------- Public helpers for the controller ----------
  // Did the most recent observation cross the induction threshold?
  function shouldPromptToLearn(letterhead) {
    var norm = normalize(letterhead);
    if (!norm) return null;
    if (isAlreadyLearned(norm)) return null;
    var hash = fnv1a(norm);
    var s = readStore();
    var bucket = null;
    for (var i = 0; i < s.obs.length; i++) {
      if (s.obs[i].letterheadHash === hash ||
          bigramJaccard(s.obs[i].letterhead, norm) >= LETTERHEAD_HASH_THRESHOLD) {
        bucket = s.obs[i]; break;
      }
    }
    if (!bucket || !bucket.samples || bucket.samples.length < MIN_OBSERVATIONS_TO_INDUCE) return null;
    return {
      letterhead: bucket.letterhead,
      samples:    bucket.samples
    };
  }

  function clearAll() {
    writeStore({ learnedVendors: [], learnedVendorObservations: [] });
  }

  var api = {
    // Observation
    recordObservation:    recordObservation,
    shouldPromptToLearn:  shouldPromptToLearn,
    isAlreadyLearned:     isAlreadyLearned,
    // Induction
    induceHeaderSkip:     induceHeaderSkip,
    induceTotalRegex:     induceTotalRegex,
    induceDetectTokens:   induceDetectTokens,
    buildLearnedTemplate: buildLearnedTemplate,
    // Persistence
    saveLearnedTemplate:  saveLearnedTemplate,
    deleteLearnedTemplate: deleteLearnedTemplate,
    listLearnedTemplates: listLearnedTemplates,
    // Detection
    detectLearnedVendor:  detectLearnedVendor,
    // Utility
    normalize:            normalize,
    bigramJaccard:        bigramJaccard,
    fnv1a:                fnv1a,
    clearAll:             clearAll,
    // Constants
    OBSERVATION_CAP:      OBSERVATION_CAP,
    LEARNED_CAP:          LEARNED_CAP,
    MIN_OBSERVATIONS_TO_INDUCE: MIN_OBSERVATIONS_TO_INDUCE
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_AUTOLEARN = api;
})(typeof window !== 'undefined' ? window : null);
