/**
 * Invoice Decoder — vendors.js (Wave 4.1).
 *
 * After Wave 4.1, the canonical source of truth for each vendor's
 * detection tokens + parser hints is a JSON file at
 * /tools/invoice-decoder/vendors/<id>.json. This module reads from
 * an inline registry (mirroring vendors/_index.json) for fast
 * synchronous detection, and lazy-loads the per-vendor template
 * enrichment (headerSkip, future column anchors, item-class hints)
 * the first time a vendor matches.
 *
 * Architecture:
 *   - REGISTRY: list of detection stubs + confidenceBoost + facade.
 *     Mirrors vendors/_index.json. Embedded inline so detection
 *     stays synchronous and the existing test suite is unchanged.
 *   - vendors/<id>.json: full template — detection tokens (same),
 *     headerSkip patterns, categoryBias, format, alcoholTax,
 *     plus future per-vendor parser features.
 *   - MID_VENDOR_RUNTIME: generic interpreter (./vendors/template-
 *     runtime.js) used by Wave 4.3 auto-learn and any future
 *     consumer that wants the async lazy-load path.
 *
 * Backward compatibility:
 *   - detectVendor(text, threshold) → same shape as before.
 *   - applyVendorBoost(rows, vendorMatch) → unchanged.
 *   - REGISTRY entries expose { id, label_en, label_es,
 *     detect(text), confidenceBoost, headerLines, categoryBias,
 *     format, alcoholTax } — the legacy fields downstream code
 *     reads.
 *
 * Wave 4.3 integration:
 *   - detectVendor still consults MID_AUTOLEARN.detectLearnedVendor
 *     when the inline registry doesn't match. Auto-learned templates
 *     use the same JSON shape, so they plug into the same runtime.
 */
(function (root) {
  'use strict';

  function topText(text, n) {
    return String(text || '').slice(0, n || 800).toLowerCase();
  }

  // ---------------------------------------------------------------
  // Inline detection stubs. This block mirrors vendors/_index.json.
  // Generated from the previous REGISTRY in Wave 4.1's migration;
  // future edits should edit the JSON file AND this stub list (or
  // future build step can sync them — see vendor-pin.mjs precedent).
  // ---------------------------------------------------------------
  var STUBS = [
    { id: 'sysco', label_en: 'Sysco', label_es: 'Sysco', confidenceBoost: 12, tokens: [
      { p: '\\bsysco\\b', w: 0.6 },
      { p: 'sysco\\s+(houston|chicago|atlanta|memphis|kansas|denver|seattle|portland|baltimore|cincinnati|nashville|jacksonville)', w: 0.2 },
      { p: 'customer\\s+number\\s*:?\\s*\\d{6,}', w: 0.15 },
      { p: '\\bsupc\\b|\\bsupc#\\b', w: 0.15 },
      { p: 'sysco\\s+pickup', w: 0.1 }
    ]},
    { id: 'us-foods', label_en: 'US Foods', label_es: 'US Foods', confidenceBoost: 12, tokens: [
      { p: '\\bus\\s*foods\\b', w: 0.6 },
      { p: '\\busfoods\\b', w: 0.5 },
      { p: '\\busf\\b', w: 0.15 },
      { p: 'pack\\s*\\/\\s*size', w: 0.15 },
      { p: '\\d+\\s*\\/\\s*\\d+\\s*(oz|lb|ct|ea)', w: 0.15 },
      { p: 'division\\s+of\\s+us\\s*foods', w: 0.2 }
    ]},
    { id: 'gfs', label_en: 'Gordon Food Service', label_es: 'Gordon Food Service', confidenceBoost: 14, tokens: [
      { p: 'gordon\\s+food\\s+service', w: 0.6 },
      { p: '\\bgfs\\b', w: 0.4 },
      { p: '\\bgfs\\s+marketplace', w: 0.2 },
      // Class-code heuristic: 3+ matches across body text
      // signals GFS reliably. Encoded as a presence-of-three
      // tokens with the same group regex repeated.
      { p: '\\b(prd|pro|dry|pap|frz|bev|jan|sml|equ)\\b[\\s\\S]+\\b(prd|pro|dry|pap|frz|bev|jan|sml|equ)\\b[\\s\\S]+\\b(prd|pro|dry|pap|frz|bev|jan|sml|equ)\\b', w: 0.25 }
    ]},
    { id: 'restaurant-depot', label_en: 'Restaurant Depot', label_es: 'Restaurant Depot', confidenceBoost: 10, tokens: [
      { p: 'restaurant\\s+depot', w: 0.6 },
      { p: '\\brdmember\\b|member\\s+price', w: 0.2 },
      { p: 'jetro\\s+cash\\s+&\\s+carry', w: 0.5 },
      { p: 'warehouse\\s*#?\\s*\\d{2,3}', w: 0.15 },
      { p: 'cash\\s+and\\s+carry', w: 0.1 }
    ]},
    { id: 'shamrock', label_en: 'Shamrock Foods', label_es: 'Shamrock Foods', confidenceBoost: 10, tokens: [
      { p: 'shamrock\\s+foods', w: 0.6 },
      { p: '\\bshamrock\\b', w: 0.4 },
      { p: 'phoenix|denver|albuquerque|salt\\s+lake', w: 0.1 },
      { p: 'clover\\s*pricing|clover\\s*list', w: 0.15 }
    ]},
    { id: 'sygma', label_en: 'Sygma', label_es: 'Sygma', confidenceBoost: 10, tokens: [
      { p: '\\bsygma\\b', w: 0.6 },
      { p: 'sygma\\s+network', w: 0.2 },
      { p: 'cust\\s*item\\s*#\\s+house\\s*item', w: 0.2 }
    ]},
    { id: 'pfg', label_en: 'Performance Food Group', label_es: 'Performance Food Group', confidenceBoost: 10, tokens: [
      { p: 'performance\\s+food', w: 0.6 },
      { p: '\\bpfg\\b', w: 0.4 },
      { p: '\\bvistar\\b', w: 0.5 },
      { p: 'reinhart\\s+foodservice', w: 0.5 },
      { p: '\\breinhart\\b', w: 0.3 },
      { p: 'pfg\\s+customized', w: 0.2 }
    ]},
    { id: 'cheney-brothers', label_en: 'Cheney Brothers', label_es: 'Cheney Brothers', confidenceBoost: 11, tokens: [
      { p: '\\bcheney\\s+brothers\\b', w: 0.6 },
      { p: '\\bcbi\\s+invoice\\b', w: 0.3 },
      { p: '\\bcheney\\b', w: 0.3 },
      { p: 'riviera\\s+beach|ocala|punta\\s+gorda|north\\s+carolina', w: 0.05 }
    ]},
    { id: 'ben-e-keith', label_en: 'Ben E. Keith Foods', label_es: 'Ben E. Keith Foods', confidenceBoost: 11, tokens: [
      { p: 'ben\\s*e\\.?\\s*keith', w: 0.6 },
      { p: '\\bbek\\s+invoice\\b', w: 0.3 },
      { p: 'dallas|fort\\s+worth|houston|san\\s+antonio|amarillo|albuquerque', w: 0.05 }
    ]},
    { id: 'imperial-dade', label_en: 'Imperial Dade', label_es: 'Imperial Dade', confidenceBoost: 9, categoryBias: { paper: 1.2, cleaning: 1.2 }, tokens: [
      { p: 'imperial\\s+dade', w: 0.6 },
      { p: '\\bimp\\s+dade\\b', w: 0.3 },
      { p: 'janitorial|disposables|packaging|food\\s*service\\s+supplies', w: 0.1 }
    ]},
    { id: 'kehe', label_en: 'KeHE Distributors', label_es: 'KeHE Distributors', confidenceBoost: 9, tokens: [
      { p: '\\bkehe\\b', w: 0.6 },
      { p: 'kehe\\s+distributors|kehe\\s+specialty', w: 0.2 },
      { p: 'natural\\s+foods|specialty\\s+foods|organic\\s+grocery', w: 0.05 }
    ]},
    { id: 'unfi', label_en: 'UNFI', label_es: 'UNFI', confidenceBoost: 9, tokens: [
      { p: '\\bunfi\\b', w: 0.6 },
      { p: 'united\\s+natural\\s+foods', w: 0.4 },
      { p: 'super\\s*valu|supervalu', w: 0.1 }
    ]},
    { id: 'baldor', label_en: 'Baldor Specialty Foods', label_es: 'Baldor Specialty Foods', confidenceBoost: 11, categoryBias: { produce: 1.15, seafood: 1.1, protein: 1.1 }, tokens: [
      { p: '\\bbaldor\\b', w: 0.6 },
      { p: 'baldor\\s+specialty', w: 0.3 },
      { p: 'bronx|the\\s+bronx|ny|new\\s+york', w: 0.05 }
    ]},
    { id: 'freshpoint', label_en: 'FreshPoint', label_es: 'FreshPoint', confidenceBoost: 12, categoryBias: { produce: 1.25 }, tokens: [
      { p: '\\bfreshpoint\\b', w: 0.6 },
      { p: 'fresh\\s+point', w: 0.4 },
      { p: 'produce\\s+invoice|produce\\s+order', w: 0.05 }
    ]},
    { id: 'maines', label_en: 'Maines Paper & Food', label_es: 'Maines Paper & Food', confidenceBoost: 10, tokens: [
      { p: '\\bmaines\\b', w: 0.55 },
      { p: 'maines\\s+paper\\s+(and|&)\\s+food', w: 0.3 },
      { p: 'conklin|broome\\s+county', w: 0.05 }
    ]},
    { id: 'asian-wholesale', label_en: 'Asian wholesale (H Mart / 99 Ranch / Restaurant Depot Asia)', label_es: 'Mayorista asiático', confidenceBoost: 8, tokens: [
      { p: '\\bh\\s*mart\\b|hmart', w: 0.6 },
      { p: '99\\s*ranch', w: 0.6 },
      { p: 'restaurant\\s+depot\\s+asia|rd\\s+asia', w: 0.5 },
      { p: 'asian\\s+wholesale|korean\\s+market|chinese\\s+market', w: 0.2 }
    ]},
    { id: 'mexican-wholesale', label_en: 'Mexican wholesaler', label_es: 'Mayorista mexicano', confidenceBoost: 8, tokens: [
      { p: 'la\\s+michoacana\\s+meat', w: 0.55 },
      { p: 'northgate\\s+market\\s+foodservice|northgate\\s+gonzalez', w: 0.5 },
      { p: 'mariscos\\s+linares', w: 0.5 },
      { p: 'carniceria\\s+|carnicería\\s+', w: 0.2 },
      { p: 'abarrotes\\s+y\\s+mas|abarrotes\\s+y\\s+más', w: 0.2 },
      { p: 'proveedor\\s+mexicano|distribuidor\\s+latino', w: 0.2 }
    ]},
    { id: 'costco-business', label_en: 'Costco Business Center', label_es: 'Costco Business Center', confidenceBoost: 8, format: 'thermal', tokens: [
      { p: 'costco\\s+business\\s+center', w: 0.6 },
      { p: '\\bcostco\\s+wholesale\\b', w: 0.4 },
      { p: 'business\\s+member|gold\\s+star\\s+business', w: 0.15 },
      { p: '\\bsubtotal\\b[\\s\\S]{0,80}\\btax\\b', w: 0.05 }
    ]},
    { id: 'webstaurantstore', label_en: 'WebstaurantStore', label_es: 'WebstaurantStore', confidenceBoost: 9, categoryBias: { paper: 1.1, cleaning: 1.05 }, tokens: [
      { p: 'webstaurant\\s*store', w: 0.6 },
      { p: '\\bwebstaurant\\b', w: 0.4 },
      { p: 'clark\\s+associates', w: 0.15 },
      { p: 'order\\s+confirmation\\s+#', w: 0.05 }
    ]},
    { id: 'veritiv', label_en: 'Veritiv', label_es: 'Veritiv', confidenceBoost: 9, categoryBias: { paper: 1.2, cleaning: 1.1 }, tokens: [
      { p: '\\bveritiv\\b', w: 0.6 },
      { p: 'veritiv\\s+corporation', w: 0.3 },
      { p: 'packaging\\s+&?\\s*facility', w: 0.15 }
    ]},
    { id: 'dairy-dsd', label_en: 'Dairy / DSD route delivery', label_es: 'Lácteos / entrega ruta DSD', confidenceBoost: 9, format: 'thermal', categoryBias: { dairy: 1.3 }, tokens: [
      { p: 'hiland\\s+dairy', w: 0.55 },
      { p: 'borden\\s+dairy|dean\\s+foods', w: 0.5 },
      { p: 'producers\\s+dairy', w: 0.5 },
      { p: 'crystal\\s+creamery', w: 0.5 },
      { p: 'route\\s+\\d+|driver\\s+\\d+', w: 0.1 },
      { p: 'route\\s+invoice|dsd\\s+invoice', w: 0.15 }
    ]},
    { id: 'beer-wine-distributor', label_en: 'Beer / wine distributor', label_es: 'Distribuidor de cerveza / vino', confidenceBoost: 10, alcoholTax: true, categoryBias: { beverage: 1.4 }, tokens: [
      { p: 'republic\\s+national\\s+distributing', w: 0.55 },
      { p: '\\brndc\\b', w: 0.3 },
      { p: 'southern\\s+glazer', w: 0.55 },
      { p: 'reyes\\s+beverage', w: 0.55 },
      { p: 'breakthru\\s+beverage', w: 0.55 },
      { p: 'empire\\s+merchants', w: 0.55 },
      { p: 'ben\\s+arnold|wirtz\\s+beverage', w: 0.45 },
      { p: '\\balcohol\\s+tax|excise\\s+tax|state\\s+liquor\\s+tax\\b', w: 0.15 },
      { p: 'case\\s+price|bottle\\s+price|keg\\s+price', w: 0.1 }
    ]}
  ];

  // ---------------------------------------------------------------
  // Token compilation + scoring (mirrors template-runtime.js but
  // synchronous so the legacy detectVendor() API is preserved).
  // ---------------------------------------------------------------
  function compileStub(stub) {
    if (stub._compiled) return stub._compiled;
    var compiled = stub.tokens.map(function (t) {
      try { return { re: new RegExp(t.p, 'i'), w: t.w }; }
      catch (_) { return null; }
    }).filter(Boolean);
    stub._compiled = compiled;
    return compiled;
  }

  function scoreStub(stub, ocrText) {
    var top = topText(ocrText, 800);
    var compiled = compileStub(stub);
    var score = 0;
    for (var i = 0; i < compiled.length; i++) {
      if (compiled[i].re.test(top)) score += compiled[i].w;
    }
    return Math.min(1, score);
  }

  // ---------------------------------------------------------------
  // Per-vendor enrichment cache. headerLines + future fields load
  // lazily from /tools/invoice-decoder/vendors/<id>.json the first
  // time a vendor matches. Result is memoized so subsequent calls
  // hit the cache.
  // ---------------------------------------------------------------
  var __enrichmentCache = {};

  function loadEnrichment(id) {
    if (__enrichmentCache[id]) return Promise.resolve(__enrichmentCache[id]);
    if (typeof fetch === 'undefined') return Promise.resolve(null);
    return fetch('/tools/invoice-decoder/vendors/' + id + '.json', { // h8-exempt: same-origin vendor template
      credentials: 'omit',
      cache:       'force-cache'
    }).then(function (r) {
      if (!r.ok) return null;
      return r.json();
    }).then(function (j) {
      if (j) {
        __enrichmentCache[id] = j;
        // Wave 4.2 evolution — pin the enrichment back onto the
        // matching STUB so categorize.tier05VendorHints() can read
        // categoryHints synchronously when classifying rows. The
        // cache lives across renders for the page's lifetime.
        for (var i = 0; i < STUBS.length; i++) {
          if (STUBS[i].id === id) { STUBS[i]._enrichment = j; break; }
        }
      }
      return j;
    }).catch(function () { return null; });
  }

  // Trigger enrichment fetch in the background after a successful
  // detection; doesn't block detectVendor itself, but pre-warms the
  // cache so applyVendorBoost can use the headerLines on this call
  // OR the next.
  function preloadEnrichment(id) {
    loadEnrichment(id);
  }

  // ---------------------------------------------------------------
  // Build a legacy vendor facade from a stub. Same shape downstream
  // code expects: { id, label_en, label_es, detect(), confidenceBoost,
  // headerLines, categoryBias, format, alcoholTax }.
  // ---------------------------------------------------------------
  function facadeForStub(stub) {
    if (stub._facade) return stub._facade;
    var enrichment = __enrichmentCache[stub.id] || null;
    var headerLines = (enrichment && enrichment.headerSkip || []).map(function (src) {
      try { return new RegExp(src, 'i'); } catch (_) { return null; }
    }).filter(Boolean);
    var f = {
      id:               stub.id,
      label_en:         stub.label_en,
      label_es:         stub.label_es,
      detect:           function (text) { return { score: scoreStub(stub, text), label: stub.label_en }; },
      confidenceBoost:  stub.confidenceBoost || 0,
      headerLines:      headerLines,
      categoryBias:     stub.categoryBias || null,
      format:           stub.format || 'pdf',
      alcoholTax:       !!stub.alcoholTax
    };
    if (enrichment) {
      // Only memoize the facade once enrichment landed.
      stub._facade = f;
    }
    return f;
  }

  // Public REGISTRY — array of facades. Compatible with legacy
  // consumers; `detect()` is synchronous.
  var REGISTRY = STUBS.map(facadeForStub);

  // Wave 4.2 evolution — eagerly prefetch every vendor's enrichment
  // JSON at idle time after page load. The 22 templates are tiny
  // (~1 KB each) and lazy-load over HTTP cache; warming them all
  // pre-emptively means categorize.tier05VendorHints sees the
  // categoryHints synchronously when an invoice is parsed. Browsers
  // without requestIdleCallback fall back to a 1.5s setTimeout.
  function prefetchAllEnrichments() {
    if (typeof root === 'undefined' || !root || typeof fetch === 'undefined') return;
    var schedule = (typeof root.requestIdleCallback === 'function')
      ? function (cb) { root.requestIdleCallback(cb, { timeout: 4000 }); }
      : function (cb) { setTimeout(cb, 1500); };
    schedule(function () {
      for (var i = 0; i < STUBS.length; i++) {
        loadEnrichment(STUBS[i].id);   // fire-and-forget
      }
    });
  }
  if (typeof root !== 'undefined' && root && root.document) {
    if (root.document.readyState === 'complete') prefetchAllEnrichments();
    else root.addEventListener('load', prefetchAllEnrichments, { once: true });
  }

  // ---------------------------------------------------------------
  // detectVendor — unchanged signature.
  //
  // Wave 4.3 — also consults the operator's learned templates via
  // MID_AUTOLEARN.detectLearnedVendor when no shipped vendor matches.
  // ---------------------------------------------------------------
  function detectVendor(ocrText, threshold) {
    var t = (typeof threshold === 'number') ? threshold : 0.5;
    var bestStub = null;
    var bestScore = 0;
    for (var i = 0; i < STUBS.length; i++) {
      var s = scoreStub(STUBS[i], ocrText);
      if (s >= t && s > bestScore) { bestScore = s; bestStub = STUBS[i]; }
    }
    if (bestStub) {
      preloadEnrichment(bestStub.id);
      var vendor = facadeForStub(bestStub);
      return { id: bestStub.id, label: bestStub.label_en, score: bestScore, vendor: vendor };
    }
    if (typeof root !== 'undefined' && root && root.MID_AUTOLEARN &&
        typeof root.MID_AUTOLEARN.detectLearnedVendor === 'function') {
      var learned = root.MID_AUTOLEARN.detectLearnedVendor(ocrText);
      if (learned) return learned;
    }
    return null;
  }

  // ---------------------------------------------------------------
  // Wave 3.6 — Logo dHash vendor detection.
  //
  // Crop the top 12% of the rectified canvas, downscale to 9×8, take
  // grayscale luminance, and compute a 64-bit dHash by comparing
  // adjacent horizontal pixel pairs. Each vendor enrichment may carry
  // a `logoHash` field (16-hex 64-bit). Hamming distance ≤ 12 wins.
  //
  // Survives smudged headers where text-token detection currently
  // fails. Falls through silently when no vendor has a logoHash yet
  // (introduced incrementally as we add reference letterheads).
  // ---------------------------------------------------------------
  function dHashCanvas(canvas, opts) {
    if (!canvas || !canvas.getContext) return null;
    opts = opts || {};
    var topRatio = opts.topRatio || 0.12;
    var W = 9, H = 8;
    var sw = canvas.width, sh = canvas.height;
    if (sw < 30 || sh < 30) return null;
    var cropH = Math.max(20, Math.round(sh * topRatio));
    // Downscale source crop to 9×8 directly via 2D drawImage.
    try {
      var dc = document.createElement('canvas');
      dc.width = W; dc.height = H;
      var ctx = dc.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, sw, cropH, 0, 0, W, H);
      var d = ctx.getImageData(0, 0, W, H).data;
      // Compute 8-row × 8-bit hash: row[y].bit[x] = (px[y][x] > px[y][x+1])
      var bits = '';
      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W - 1; x++) {
          var i  = (y * W + x) * 4;
          var i2 = (y * W + (x + 1)) * 4;
          var l1 = 0.299 * d[i]  + 0.587 * d[i + 1]  + 0.114 * d[i + 2];
          var l2 = 0.299 * d[i2] + 0.587 * d[i2 + 1] + 0.114 * d[i2 + 2];
          bits += (l1 > l2) ? '1' : '0';
        }
      }
      // Convert to 16-hex (64 bits).
      var hex = '';
      for (var b = 0; b < bits.length; b += 4) {
        hex += parseInt(bits.substr(b, 4), 2).toString(16);
      }
      return hex;
    } catch (_) { return null; }
  }
  function _hammingDistanceHex(a, b) {
    if (!a || !b || a.length !== b.length) return Infinity;
    var dist = 0;
    for (var i = 0; i < a.length; i++) {
      var x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
      while (x) { dist += x & 1; x >>= 1; }
    }
    return dist;
  }
  function detectVendorByLogo(canvas, opts) {
    var hash = dHashCanvas(canvas, opts);
    if (!hash) return null;
    var maxDist = (opts && typeof opts.maxDist === 'number') ? opts.maxDist : 12;
    var best = null;
    var bestDist = Infinity;
    for (var i = 0; i < STUBS.length; i++) {
      var enrichment = STUBS[i]._enrichment;
      if (!enrichment || !enrichment.logoHash) continue;
      var d = _hammingDistanceHex(hash, enrichment.logoHash);
      if (d < bestDist && d <= maxDist) {
        bestDist = d;
        best = STUBS[i];
      }
    }
    if (!best) return null;
    var vendor = facadeForStub(best);
    return {
      id: best.id,
      label: best.label_en,
      // Higher score for tighter Hamming match. Map [0..maxDist] →
      // [1.0..0.5] so logo detections come in higher-confidence than
      // borderline text-token detections.
      score: 1.0 - (bestDist / maxDist) * 0.5,
      vendor: vendor,
      detection: { kind: 'logo', dHash: hash, hamming: bestDist }
    };
  }

  function applyVendorBoost(rows, vendor) {
    if (!vendor || !vendor.vendor) return rows;
    var boost = vendor.vendor.confidenceBoost || 0;
    rows.forEach(function (r) {
      r.confidence = Math.min(100, (r.confidence || 0) + boost);
      r.vendorDetected = vendor.id;
    });
    return rows;
  }

  var api = {
    REGISTRY:          REGISTRY,
    STUBS:             STUBS,           // exposed for tests
    detectVendor:      detectVendor,
    detectVendorByLogo: detectVendorByLogo,
    dHashCanvas:       dHashCanvas,
    applyVendorBoost:  applyVendorBoost,
    loadEnrichment:    loadEnrichment   // exposed for callers wanting headerLines for the matched vendor
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_VENDORS = api;
})(typeof window !== 'undefined' ? window : null);
