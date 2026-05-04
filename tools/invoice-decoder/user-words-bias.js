/**
 * Wave 4.4 — operator-corpus user-words bias for OCR output.
 *
 * Compounds across invoices. Every confirmed correction the operator
 * makes seeds MID_LEARNINGS.buildUserWords(); this module reads that
 * dictionary and rewrites low-confidence OCR words that are at edit
 * distance ≤ 1 from a user-word.
 *
 * Why this works: OCR engines are general-purpose. Restaurant SKU
 * vocabulary (BNLS, SKLS, RDLS, ROAST, BRSKT, distributor proper
 * nouns) sits in the long tail and gets mis-read consistently — the
 * same way, every time. Once an operator has corrected
 * "BNLS SKLS THIGH" once or twice, the word "BNLS" is in their
 * dictionary; the next invoice that reads "8NLS" or "BNL5" gets
 * snapped back to "BNLS" without their having to correct it again.
 *
 * Conservative by design:
 *   - Only acts on words with conf < CONF_THRESHOLD (default 70).
 *   - Only replaces alpha-only tokens (digits stay untouched —
 *     letting an OCR error in a price column auto-replace would be
 *     dangerous).
 *   - Edit distance cap of 1 for tokens of length 3-4, 2 for 5+.
 *   - Replacement preserves the original word's case style: if the
 *     OCR token was UPPERCASE, the user-word maps back to UPPERCASE.
 *
 * Privacy posture: pure local read of MID_LEARNINGS state, which
 * already lives in MuntinContext. No network. Same posture as every
 * other Wave 10+ feature.
 */
(function (root) {
  'use strict';

  var CONF_THRESHOLD = 70;          // act only on words below this conf
  var MIN_TOKEN_LEN  = 3;           // words shorter than this are too noisy
  var MIN_DICT_SIZE  = 5;           // skip the bias entirely until the
                                    // operator has built up a real corpus

  // Single-symbol edit distance, bounded. Returns a value > maxD when
  // the true distance exceeds maxD — saves ~80% of the inner work for
  // the common case (most candidates are too far to matter).
  function _ed(a, b, maxD) {
    var alen = a.length, blen = b.length;
    if (Math.abs(alen - blen) > maxD) return maxD + 1;
    if (alen === 0) return blen;
    if (blen === 0) return alen;
    var prev = new Array(blen + 1);
    var curr = new Array(blen + 1);
    for (var j = 0; j <= blen; j++) prev[j] = j;
    for (var i = 1; i <= alen; i++) {
      curr[0] = i;
      var rowMin = curr[0];
      for (var jj = 1; jj <= blen; jj++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(jj - 1) ? 0 : 1;
        var del = prev[jj] + 1;
        var ins = curr[jj - 1] + 1;
        var sub = prev[jj - 1] + cost;
        curr[jj] = (del < ins ? (del < sub ? del : sub) : (ins < sub ? ins : sub));
        if (curr[jj] < rowMin) rowMin = curr[jj];
      }
      // Bail early if the entire row is past the threshold.
      if (rowMin > maxD) return maxD + 1;
      var tmp = prev; prev = curr; curr = tmp;
    }
    return prev[blen];
  }

  // Match the case style of the original token. Distributor invoices
  // are overwhelmingly UPPERCASE, so a token that's even majority-
  // uppercase (e.g. "ROMAlNE" — one letter mis-OCR'd as lowercase) is
  // snapped back to uppercase. Pure-lowercase tokens stay lowercase.
  function _matchCase(replacement, original) {
    if (!original) return replacement;
    var upper = 0, lower = 0;
    for (var i = 0; i < original.length; i++) {
      var ch = original.charCodeAt(i);
      if (ch >= 65 && ch <= 90) upper++;
      else if (ch >= 97 && ch <= 122) lower++;
    }
    if (upper === 0 && lower > 0) return replacement.toLowerCase();
    if (upper >= lower) return replacement.toUpperCase();
    return replacement;  // genuinely mixed (rare on invoice text)
  }

  // Eligible for replacement when the token reads as a "word" rather
  // than a number. Pure-digit and digit-dominant tokens are rejected
  // (we never want to silently rewrite a price or quantity). Tokens
  // like "8NLS" (canonical OCR error for "BNLS") qualify because the
  // alpha share is high enough that a letter-shaped digit is the
  // likely culprit.
  function _isWordLike(s) {
    if (!s) return false;
    var alpha = 0;
    for (var i = 0; i < s.length; i++) {
      var ch = s.charCodeAt(i);
      if ((ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122)) alpha++;
    }
    if (alpha < 2) return false;
    return (alpha / s.length) >= 0.6;
  }

  // Build a sorted-by-frequency dictionary array from the user-words
  // map. Higher-count tokens win ties (a word the operator has
  // confirmed five times is preferred over one they confirmed once).
  function _dictArray(userWordsMap) {
    var keys = Object.keys(userWordsMap || {});
    if (!keys.length) return [];
    keys.sort(function (a, b) { return (userWordsMap[b] || 0) - (userWordsMap[a] || 0); });
    return keys;
  }

  // Apply bias to a list of Tesseract word objects in place. Returns
  // the count of replacements made. Pure mutation — caller's
  // responsibility to rebuild any derived `text` strings (we do that
  // here for line objects in `applyToLines`).
  function applyToWords(words, opts) {
    if (!Array.isArray(words) || !words.length) return 0;
    opts = opts || {};
    var thresh = (typeof opts.confThreshold === 'number') ? opts.confThreshold : CONF_THRESHOLD;
    var dict = opts.dict;
    if (!dict) {
      var src = (typeof root !== 'undefined' && root && root.MID_LEARNINGS && root.MID_LEARNINGS.buildUserWords)
        ? root.MID_LEARNINGS.buildUserWords()
        : null;
      if (!src) return 0;
      var keys = Object.keys(src);
      if (keys.length < MIN_DICT_SIZE) return 0;
      dict = _dictArray(src);
    }
    if (!dict.length) return 0;

    var replaced = 0;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!w || typeof w.text !== 'string') continue;
      if ((w.confidence || 0) >= thresh) continue;
      var raw = w.text.trim();
      if (raw.length < MIN_TOKEN_LEN) continue;
      if (!_isWordLike(raw)) continue;    // numerics + digit-dominant tokens stay untouched
      // Lowercase + strip non-alpha so "8NLS" matches dictionary
      // entry "bnls". The replacement re-applies the original case
      // style below, with the digit-shaped letters corrected.
      var lc = raw.toLowerCase().replace(/[^a-z]/g, '');
      if (lc.length < MIN_TOKEN_LEN) continue;
      var maxD = (raw.length <= 4) ? 1 : 2;
      var best = null;
      var bestD = maxD + 1;
      for (var k = 0; k < dict.length; k++) {
        var cand = dict[k];
        if (Math.abs(cand.length - lc.length) > maxD) continue;
        if (cand === lc) { best = null; bestD = 0; break; } // already correct
        var d = _ed(lc, cand, maxD);
        if (d < bestD) { bestD = d; best = cand; if (d === 1) break; }
      }
      if (best && bestD > 0 && bestD <= maxD) {
        w._origText = raw;
        w.text = _matchCase(best, raw);
        w._userWordsBias = { from: raw, to: best, distance: bestD };
        replaced++;
      }
    }
    return replaced;
  }

  // Apply to a list of OCR line objects. Mutates each line's words
  // (when present) and rebuilds line.text from the updated words.
  // Lines without words[] are left alone.
  function applyToLines(lines, opts) {
    if (!Array.isArray(lines) || !lines.length) return 0;
    opts = opts || {};
    var dict = opts.dict;
    if (!dict) {
      var src = (typeof root !== 'undefined' && root && root.MID_LEARNINGS && root.MID_LEARNINGS.buildUserWords)
        ? root.MID_LEARNINGS.buildUserWords()
        : null;
      if (!src) return 0;
      var keys = Object.keys(src);
      if (keys.length < MIN_DICT_SIZE) return 0;
      dict = _dictArray(src);
    }
    var localOpts = Object.assign({}, opts, { dict: dict });

    var total = 0;
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (!ln || !Array.isArray(ln.words) || !ln.words.length) continue;
      var n = applyToWords(ln.words, localOpts);
      if (n > 0) {
        // Rebuild line.text from the (now-corrected) words. Preserve
        // original spacing — Tesseract's words are pre-trimmed, so
        // single-space joins match the upstream `text` shape.
        ln.text = ln.words.map(function (w) { return w.text; }).join(' ').replace(/\s+/g, ' ').trim();
        ln._userWordsBiasCount = (ln._userWordsBiasCount || 0) + n;
        total += n;
      }
    }
    return total;
  }

  var api = {
    applyToWords: applyToWords,
    applyToLines: applyToLines,
    _editDistance: _ed,
    _matchCase: _matchCase,
    CONF_THRESHOLD: CONF_THRESHOLD,
    MIN_DICT_SIZE: MIN_DICT_SIZE
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_USER_WORDS_BIAS = api;
})(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : null));
