/**
 * Per-operator OCR confusion matrix (Wave 11.2).
 *
 * Tesseract's character confusions are *operator-specific*. The
 * Sysco-shaped serif font feeds it different errors than the
 * Restaurant Depot dot-matrix print or the GFS thermal receipt.
 * Operator A's tool, after 50 invoices, has a meaningfully different
 * confusion profile than Operator B's. Cloud OCR competitors cannot
 * match this because they don't have the operator's private corpus.
 *
 * How it builds:
 *   Every time the operator confirms or edits a row, the original
 *   OCR'd name is aligned with the corrected name via Needleman-
 *   Wunsch (cheap edit alignment). Each substitution / insertion /
 *   deletion is logged into a 64×64 character grid.
 *
 * What it powers:
 *   - Wave 11.3 beam-search line repair: candidate edit list comes
 *     from `topConfusions(char, k)`.
 *   - Future per-character calibration: pair with Wave 11.1.
 *
 * Storage: MuntinContext.ocrConfusion = { '<from>:<to>': count }.
 * Cap: 4096 distinct pairs (unlikely to hit; most operators see
 * < 200 distinct confusions in practice).
 *
 * Public API:
 *   recordCorrection(rawName, correctedName)
 *   topConfusions(srcChar, k=8)   → [{to, count, pSubst}]
 *   matrix()                       → raw map (for tests + proof flyout)
 */
(function (root) {
  'use strict';

  var MAX_PAIRS = 4096;

  function _ctx() {
    if (typeof root !== 'undefined' && root && root.MuntinContext) return root.MuntinContext;
    if (typeof require !== 'undefined') {
      try { return require('../_shared/context-bus.js'); } catch (_) { return null; }
    }
    return null;
  }

  function _normalize(s) {
    return String(s || '').toLowerCase();
  }

  // Needleman-Wunsch alignment with simple gap penalty. Returns
  // arrays of (a, b) char pairs where either may be '' (deletion /
  // insertion). Linear in product of lengths; we cap inputs at 80
  // chars to bound cost.
  function _align(a, b) {
    a = String(a || '').slice(0, 80);
    b = String(b || '').slice(0, 80);
    var n = a.length, m = b.length;
    var matchScore = 1, mismatch = -1, gap = -1;
    var dp = new Array(n + 1);
    var trace = new Array(n + 1);
    for (var i = 0; i <= n; i++) {
      dp[i] = new Array(m + 1);
      trace[i] = new Array(m + 1);
      dp[i][0] = i * gap; trace[i][0] = 'U';
    }
    for (var j = 0; j <= m; j++) {
      dp[0][j] = j * gap; trace[0][j] = 'L';
    }
    trace[0][0] = '0';
    for (var i2 = 1; i2 <= n; i2++) {
      for (var j2 = 1; j2 <= m; j2++) {
        var diagScore = dp[i2 - 1][j2 - 1] + (a.charAt(i2 - 1) === b.charAt(j2 - 1) ? matchScore : mismatch);
        var upScore   = dp[i2 - 1][j2] + gap;
        var leftScore = dp[i2][j2 - 1] + gap;
        var best = diagScore, dir = 'D';
        if (upScore > best) { best = upScore; dir = 'U'; }
        if (leftScore > best) { best = leftScore; dir = 'L'; }
        dp[i2][j2] = best; trace[i2][j2] = dir;
      }
    }
    // Backtrace.
    var pairs = [];
    var ai = n, bj = m;
    while (ai > 0 || bj > 0) {
      var d = trace[ai][bj];
      if (d === 'D') { pairs.unshift([a.charAt(ai - 1), b.charAt(bj - 1)]); ai--; bj--; }
      else if (d === 'U') { pairs.unshift([a.charAt(ai - 1), '']); ai--; }
      else if (d === 'L') { pairs.unshift(['', b.charAt(bj - 1)]); bj--; }
      else break;
    }
    return pairs;
  }

  // Public — record an operator correction. Aligned char-pairs that
  // differ get bumped in the matrix. Identical pairs are skipped.
  function recordCorrection(rawName, correctedName) {
    var c = _ctx();
    if (!c) return false;
    var raw = _normalize(rawName);
    var fix = _normalize(correctedName);
    if (!raw || !fix || raw === fix) return false;
    var pairs = _align(raw, fix);
    var data = (typeof c.read === 'function') ? c.read() : null;
    if (!data) return false;
    var map = data.ocrConfusion || {};
    var changed = 0;
    pairs.forEach(function (p) {
      if (p[0] === p[1]) return;
      var key = p[0] + ':' + p[1];
      map[key] = (map[key] || 0) + 1;
      changed++;
    });
    if (!changed) return false;
    // Cap by dropping the smallest-count pairs.
    var keys = Object.keys(map);
    if (keys.length > MAX_PAIRS) {
      keys.sort(function (k1, k2) { return map[k1] - map[k2]; });
      var drop = keys.length - MAX_PAIRS;
      for (var i = 0; i < drop; i++) delete map[keys[i]];
    }
    return c.merge({ ocrConfusion: map });
  }

  function matrix() {
    var c = _ctx();
    if (!c) return {};
    var data = (typeof c.read === 'function') ? c.read() : null;
    return (data && data.ocrConfusion) || {};
  }

  // Top-K confusions for a single source character. Returns
  // [{to, count, pSubst}] sorted by count desc.
  function topConfusions(srcChar, k) {
    if (!srcChar) return [];
    var topK = k || 8;
    var src = String(srcChar).toLowerCase();
    var m = matrix();
    var keys = Object.keys(m);
    var out = [];
    var totalForSrc = 0;
    keys.forEach(function (key) {
      var parts = key.split(':');
      if (parts[0] !== src) return;
      out.push({ to: parts[1], count: m[key] });
      totalForSrc += m[key];
    });
    out.sort(function (a, b) { return b.count - a.count; });
    if (totalForSrc > 0) {
      out.forEach(function (e) { e.pSubst = +(e.count / totalForSrc).toFixed(3); });
    }
    return out.slice(0, topK);
  }

  var api = {
    recordCorrection: recordCorrection,
    topConfusions:    topConfusions,
    matrix:           matrix,
    _align:           _align,
    MAX_PAIRS:        MAX_PAIRS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_CONFUSION = api;
})(typeof window !== 'undefined' ? window : null);
