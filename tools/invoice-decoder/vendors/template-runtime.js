/**
 * Invoice Decoder — vendor template runtime (Wave 4.1).
 *
 * Generic interpreter for JSON-shaped vendor templates. Replaces
 * the hand-coded detect() functions per vendor with a single
 * runtime that scores each vendor's `detect.tokens[]` against the
 * OCR'd text, picks the best match above the configured threshold,
 * and lazy-loads the per-vendor template details (header skip
 * patterns, parser hints, category bias).
 *
 * Why JSON-per-vendor:
 *   - Initial paint shaves the per-vendor JS bodies (~7 KB) down
 *     to a single ~3 KB index manifest.
 *   - Per-vendor templates can grow rich (column anchors, line
 *     grammar, item-class hints, alcohol-tax handling) without
 *     bloating every visitor's bundle.
 *   - Auto-learned templates from Wave 4.3 use the same JSON
 *     schema, so the operator's own learned vendors plug into the
 *     same runtime path as the shipped 15.
 *
 * Privacy posture: pure same-origin fetches. The integrity manifest
 * + SRI from Wave 6.4 don't apply here (these are static JSON
 * assets, not executable code), but they live under /tools/invoice-
 * decoder/vendors/ so CSP enforces same-origin.
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------
  // Index loading
  // ---------------------------------------------------------------
  // The index manifest is the single boot-time fetch. It contains
  // the detection tokens for every shipped vendor; per-vendor
  // template files load only when a detection match needs them.
  var INDEX_URL = '/tools/invoice-decoder/vendors/_index.json';
  var __indexPromise = null;
  var __templateCache = {};   // id → full template

  function loadIndex() {
    if (__indexPromise) return __indexPromise;
    if (typeof window === 'undefined' && typeof process !== 'undefined' && process.cwd) {
      // Node test path — fs read. We resolve relative to the
      // process cwd so tests run from the repo root work without
      // any extra config. Browsers use the fetch path below.
      __indexPromise = (async function () {
        var fs = require('node:fs');
        var path = require('node:path');
        var indexPath = path.resolve(process.cwd(), 'tools/invoice-decoder/vendors/_index.json');
        var raw = fs.readFileSync(indexPath, 'utf8');
        return JSON.parse(raw);
      })().catch(function (err) {
        __indexPromise = null;
        throw err;
      });
      return __indexPromise;
    }
    __indexPromise = fetch(INDEX_URL, { // h8-exempt: same-origin vendor manifest; no operator data sent
      credentials: 'omit',
      cache:       'force-cache'
    }).then(function (r) {
      if (!r.ok) throw new Error('vendor index HTTP ' + r.status);
      return r.json();
    }).catch(function (err) {
      __indexPromise = null;
      throw err;
    });
    return __indexPromise;
  }

  // Synchronous index access for the cases where the consumer
  // already loaded it. Returns the cached value or null.
  var __indexSync = null;
  loadIndex().then(function (idx) { __indexSync = idx; }).catch(function () {});

  function loadTemplate(id) {
    if (__templateCache[id]) return Promise.resolve(__templateCache[id]);
    if (typeof window === 'undefined' && typeof process !== 'undefined' && process.cwd) {
      return (async function () {
        var fs = require('node:fs');
        var path = require('node:path');
        var p = path.resolve(process.cwd(), 'tools/invoice-decoder/vendors/' + id + '.json');
        var raw = fs.readFileSync(p, 'utf8');
        var t = JSON.parse(raw);
        __templateCache[id] = t;
        return t;
      })();
    }
    return fetch('/tools/invoice-decoder/vendors/' + id + '.json', { // h8-exempt: same-origin vendor template
      credentials: 'omit',
      cache:       'force-cache'
    }).then(function (r) {
      if (!r.ok) throw new Error('vendor template HTTP ' + r.status + ' for ' + id);
      return r.json();
    }).then(function (t) {
      __templateCache[id] = t;
      return t;
    });
  }

  // ---------------------------------------------------------------
  // Detection
  // ---------------------------------------------------------------
  // Compile a token list into a function that scores a string. We
  // memoize the compiled regexes so repeated calls don't re-parse.
  var __compiledTokenCache = new WeakMap();
  function compileTokens(tokens) {
    if (__compiledTokenCache.has(tokens)) return __compiledTokenCache.get(tokens);
    var compiled = (tokens || []).map(function (t) {
      try {
        return { re: new RegExp(t.pattern, t.flags || 'i'), weight: t.weight || 0.1 };
      } catch (_) {
        return null;
      }
    }).filter(Boolean);
    __compiledTokenCache.set(tokens, compiled);
    return compiled;
  }

  function topText(text, n) {
    return String(text || '').slice(0, n || 800).toLowerCase();
  }

  function scoreVendor(stub, ocrText) {
    var top = topText(ocrText, (stub.detect && stub.detect.window) || 800);
    var compiled = compileTokens((stub.detect && stub.detect.tokens) || []);
    var score = 0;
    for (var i = 0; i < compiled.length; i++) {
      if (compiled[i].re.test(top)) score += compiled[i].weight;
    }
    return Math.min(1, score);
  }

  // High-level: detect the best-matching vendor from the loaded
  // index. Returns Promise<{id, label, score, template?} | null>.
  // The `template` is loaded lazily only when the score crosses
  // the threshold — for the common no-match path, only the index
  // bytes ever transfer.
  function detectVendor(ocrText, opts) {
    opts = opts || {};
    var threshold = (opts.threshold != null) ? opts.threshold : 0.5;
    return loadIndex().then(function (idx) {
      if (!idx || !idx.vendors) return null;
      var best = null, bestScore = 0;
      for (var i = 0; i < idx.vendors.length; i++) {
        var stub = idx.vendors[i];
        var minScore = (stub.detect && stub.detect.minScore) || threshold;
        var s = scoreVendor(stub, ocrText);
        if (s >= minScore && s > bestScore) {
          bestScore = s;
          best = stub;
        }
      }
      if (!best) return null;
      return loadTemplate(best.id).then(function (template) {
        return {
          id:       best.id,
          label:    best.label || (template && template.label && template.label.en) || best.id,
          score:    bestScore,
          template: template,
          // Compatibility with the legacy detectVendor return shape.
          vendor:   buildVendorFacade(template)
        };
      });
    });
  }

  // Build a vendor facade compatible with the legacy detect/apply
  // pattern in vendors.js. The legacy MID_VENDORS.applyVendorBoost
  // expects { confidenceBoost, headerLines, id, label_en/es }.
  function buildVendorFacade(template) {
    if (!template) return null;
    var headerLines = (template.headerSkip || []).map(function (src) {
      try { return new RegExp(src, 'i'); } catch (_) { return null; }
    }).filter(Boolean);
    return {
      id:               template.id,
      label_en:         (template.label && template.label.en) || template.id,
      label_es:         (template.label && template.label.es) || template.id,
      confidenceBoost:  template.confidenceBoost || 0,
      headerLines:      headerLines,
      categoryBias:     template.categoryBias || null,
      format:           template.format || 'pdf',
      alcoholTax:       !!template.alcoholTax,
      categoryHints:    template.categoryHints || null,
      learnedTotalRegex: template.totalRegex || null
    };
  }

  // Synchronous variant: when the index is already cached and the
  // caller can't await (legacy call sites). Returns null when the
  // index isn't loaded yet.
  function detectVendorSync(ocrText, opts) {
    if (!__indexSync) return null;
    opts = opts || {};
    var threshold = (opts.threshold != null) ? opts.threshold : 0.5;
    var best = null, bestScore = 0;
    for (var i = 0; i < __indexSync.vendors.length; i++) {
      var stub = __indexSync.vendors[i];
      var minScore = (stub.detect && stub.detect.minScore) || threshold;
      var s = scoreVendor(stub, ocrText);
      if (s >= minScore && s > bestScore) {
        bestScore = s;
        best = stub;
      }
    }
    if (!best) return null;
    var cachedTemplate = __templateCache[best.id];
    return {
      id:       best.id,
      label:    best.label || (cachedTemplate && cachedTemplate.label && cachedTemplate.label.en) || best.id,
      score:    bestScore,
      template: cachedTemplate || null,
      vendor:   cachedTemplate ? buildVendorFacade(cachedTemplate) : null,
      _needsLoad: !cachedTemplate
    };
  }

  // Manually warm the cache for a vendor (used by tests + the
  // controller can pre-warm common vendors on idle).
  function preloadTemplates(ids) {
    return Promise.all((ids || []).map(loadTemplate));
  }

  // ---------------------------------------------------------------
  // Wave 4.2 evolution — per-vendor line grammar.
  //
  // applyLineGrammar(rows, template) runs after parse.parseLines but
  // before categorize.classify. For each row, we scan its raw text
  // against the matched vendor's `lineGrammar.taxPatterns[]` and
  // `lineGrammar.discountPatterns[]`. When a pattern fires, we
  // override the row's `kind` so the downstream pipeline:
  //   - excludes tax lines from the cost-of-goods aggregation in
  //     the trend / margin-impact computations (already handled by
  //     the existing `kind !== 'item'` filter).
  //   - routes tax lines to a different GL account on accountant
  //     export (handled by the existing _credit/_deposit/_surcharge
  //     map — we add a _tax key here).
  //
  // Idempotent + cheap: ~5-10 rows per invoice, ~3 patterns per
  // vendor, sub-millisecond. Returns the rows array (mutated).
  // ---------------------------------------------------------------
  function applyLineGrammar(rows, template) {
    if (!Array.isArray(rows) || !template || !template.lineGrammar) return rows;
    var lg = template.lineGrammar;
    var taxRes = (lg.taxPatterns || []).map(function (p) {
      try { return new RegExp(p, 'i'); } catch (_) { return null; }
    }).filter(Boolean);
    var discRes = (lg.discountPatterns || []).map(function (p) {
      try { return new RegExp(p, 'i'); } catch (_) { return null; }
    }).filter(Boolean);
    if (!taxRes.length && !discRes.length) return rows;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r || !r.raw) continue;
      // Skip rows that already have a non-item kind (credit, deposit
      // already classified by parse.classifyKind).
      if (r.kind && r.kind !== 'item') continue;
      var matched = false;
      for (var j = 0; j < taxRes.length; j++) {
        if (taxRes[j].test(r.raw)) { r.kind = 'tax'; matched = true; break; }
      }
      if (matched) continue;
      for (var k = 0; k < discRes.length; k++) {
        if (discRes[k].test(r.raw)) { r.kind = 'discount'; break; }
      }
    }
    return rows;
  }

  function listIndex() {
    return loadIndex();
  }

  function _resetForTests() {
    __indexPromise = null;
    __indexSync = null;
    __templateCache = {};
    if (__compiledTokenCache.set) __compiledTokenCache = new WeakMap();
  }

  var api = {
    detectVendor:       detectVendor,
    detectVendorSync:   detectVendorSync,
    loadIndex:          loadIndex,
    loadTemplate:       loadTemplate,
    preloadTemplates:   preloadTemplates,
    scoreVendor:        scoreVendor,
    buildVendorFacade:  buildVendorFacade,
    applyLineGrammar:   applyLineGrammar,
    listIndex:          listIndex,
    _resetForTests:     _resetForTests
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_VENDOR_RUNTIME = api;
})(typeof window !== 'undefined' ? window : null);
