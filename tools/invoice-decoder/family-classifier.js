/**
 * Invoice family classifier.
 *
 * Picks one of a small set of invoice "families" from layout +
 * tokenisation signals BEFORE the vendor template even matters. The
 * family carries default parsing knobs so a regional distributor we
 * don't have a template for still gets sensible defaults: a Halal
 * wholesaler we've never seen reads as 'broadliner' (because its
 * tokens look like a foodservice grid); a deli-counter receipt
 * reads as 'thermal-receipt' (because its aspect ratio + line
 * density betray the format); a Mexican jobber reads as
 * 'mexican-wholesale' (IVA + Spanish + peso markers).
 *
 * Families:
 *   broadliner        — Sysco / USF / GFS / PFG / Sygma / Cheney etc.
 *   paper-goods       — Imperial Dade / Veritiv class
 *   beverage          — beer/wine distributors, KeHE
 *   dairy-dsd         — Maines / Shamrock / regional dairy
 *   thermal-receipt   — Costco Business / Restaurant Depot wholesale
 *   produce-jobber    — Baldor / FreshPoint / regional produce
 *   asian-wholesale   — H Mart / 99 Ranch / Asian wholesale
 *   mexican-wholesale — Mexican / LatAm distributors
 *   handwritten       — DSD slip / farmer's market / artisan
 *   unknown           — fall-through
 *
 * Each family carries `parseHints`:
 *   columnLayout:    'broadliner' | 'compact' | 'receipt' | 'free-form'
 *   expectedPack:    array of pack-notation hints
 *   taxConvention:   'us-state' | 'us-local' | 'us-crv' | 'ca-gst' |
 *                    'mx-iva' | 'none'
 *   surchargeShape:  array of surcharge regex hints
 *   currency:        'USD' | 'MXN' | 'CAD' | 'unknown'
 *   primaryLang:     'en' | 'es' | 'mixed' | 'asian-mixed'
 *   priceFormat:     'comma-thousand' | 'dot-thousand' | 'either'
 *
 * Privacy: pure function over OCR text. No fetch, no MuntinContext
 * read, no operator data. Same posture as parse.js / categorize.js.
 */
(function (root) {
  'use strict';

  // ---------- Family signal catalog ----------
  // Each family declares positive + negative tokens. Score = Σ(weights
  // of present positives) − Σ(weights of present negatives). Per-token
  // patterns are case-insensitive multi-word regex.

  var FAMILIES = [
    {
      id: 'broadliner',
      positive: [
        { rx: /\bcustomer\s*(?:no|number|#)\b/i,         w: 0.15 },
        { rx: /\binvoice\s*(?:no|number|#)\b/i,           w: 0.15 },
        { rx: /\bship[\s-]?to\b/i,                        w: 0.10 },
        { rx: /\bbill[\s-]?to\b/i,                        w: 0.10 },
        { rx: /\bpurchase\s*order\b|\bP\.?O\.?\s*[#:]/i,  w: 0.08 },
        { rx: /\b(?:pack|cs|case|each|ea|ct)\b/i,         w: 0.05 },
        { rx: /\bfuel\s*surcharge\b/i,                    w: 0.10 },
        { rx: /\bfreight\b/i,                             w: 0.05 },
        { rx: /\bdelivery\s*charge\b/i,                   w: 0.05 },
        { rx: /\bsubtotal\b/i,                            w: 0.10 },
        // Pack-notation density: 4/1GAL / 6X10LB / 24CT etc.
        { rx: /\b\d+[\/Xx]\d+(?:LB|GAL|OZ|CT|EA)\b/i,    w: 0.20 }
      ],
      negative: [
        { rx: /\bIVA\b|\bRFC\b|\bCURP\b/i,                w: 0.30 },
        { rx: /\bthank\s+you\s+come\s+again\b/i,          w: 0.20 }
      ],
      hints: {
        columnLayout: 'broadliner',
        taxConvention: 'us-state',
        surchargeShape: ['fuel-surcharge', 'delivery-charge'],
        currency: 'USD',
        primaryLang: 'en',
        priceFormat: 'comma-thousand'
      }
    },
    {
      id: 'paper-goods',
      positive: [
        { rx: /\bImperial\s+Dade\b/i,                     w: 0.50 },
        { rx: /\bVeritiv\b/i,                             w: 0.50 },
        { rx: /\bWebstaurant\b/i,                         w: 0.30 },
        { rx: /\bjanitorial\b|\bsanitation\b/i,           w: 0.20 },
        { rx: /\b(napkin|towel|tissue|liner|trash)\b/i,   w: 0.10 },
        { rx: /\bcleaning\s+(?:supplies|chemicals)\b/i,   w: 0.15 }
      ],
      negative: [
        { rx: /\b(beef|pork|chicken|seafood|produce)\b/i, w: 0.10 }
      ],
      hints: {
        columnLayout: 'broadliner',
        taxConvention: 'us-state',
        surchargeShape: ['delivery-charge'],
        currency: 'USD',
        primaryLang: 'en',
        priceFormat: 'comma-thousand'
      }
    },
    {
      id: 'beverage',
      positive: [
        { rx: /\b(beer|wine|liquor|spirits|cider|seltzer)\b/i,  w: 0.20 },
        { rx: /\b\d+\s*[Xx]\s*\d+(?:ml|ML|oz|OZ)\b/i,           w: 0.20 },
        { rx: /\bABV\b|\bproof\b|\bvarietal\b|\bvintage\b/i,    w: 0.15 },
        { rx: /\bCRV\b|\bbottle\s*deposit\b|\bkeg\s*deposit\b/i, w: 0.20 },
        { rx: /\b(?:24|12|6)\s*\/\s*(?:12|750|1L)\b/i,           w: 0.10 },
        { rx: /\balcohol\s*tax\b|\bexcise\s*tax\b/i,             w: 0.15 }
      ],
      negative: [],
      hints: {
        columnLayout: 'broadliner',
        taxConvention: 'us-crv',
        surchargeShape: ['bottle-deposit', 'keg-deposit', 'excise-tax'],
        currency: 'USD',
        primaryLang: 'en',
        priceFormat: 'comma-thousand'
      }
    },
    {
      id: 'dairy-dsd',
      positive: [
        { rx: /\bdairy\b/i,                                w: 0.10 },
        { rx: /\b(milk|cream|butter|yogurt|cheese)\b/i,    w: 0.15 },
        { rx: /\b(driver|route)\s*(?:no|number|#)\b/i,     w: 0.20 },
        { rx: /\bdelivery\s*(?:slip|ticket)\b/i,           w: 0.20 },
        { rx: /\bcredit\s*(?:returned|empty)\b/i,          w: 0.15 },
        { rx: /\b(?:1|2|4)\/1\s*GA\b/i,                    w: 0.10 }
      ],
      negative: [],
      hints: {
        columnLayout: 'compact',
        taxConvention: 'us-state',
        surchargeShape: ['delivery-charge'],
        currency: 'USD',
        primaryLang: 'en',
        priceFormat: 'either'
      }
    },
    {
      id: 'thermal-receipt',
      positive: [
        { rx: /\b(?:Costco|Sam'?s)\s+(?:Business|Wholesale)/i,   w: 0.40 },
        { rx: /\bRestaurant\s+Depot\b/i,                          w: 0.30 },
        { rx: /\bmember(?:ship)?\s*(?:no|number|#)/i,             w: 0.15 },
        { rx: /\btax\s*\d+\s*[A-Z]\b/i,                           w: 0.10 },
        // Dense vertical line layout: many lines, narrow page (we
        // can't actually measure page geometry from text, but
        // receipt-like density of bare description+price lines
        // without explicit qty/unit columns scores here).
        { rx: /\b(?:cashier|register|store)\s*[#:]\s*\d/i,        w: 0.20 },
        { rx: /\bthank\s+you\b/i,                                  w: 0.10 }
      ],
      negative: [
        { rx: /\bcustomer\s*(?:no|number)\b/i,             w: 0.15 },
        { rx: /\bP\.?O\.?\s*(?:no|number|#)\b/i,           w: 0.15 }
      ],
      hints: {
        columnLayout: 'receipt',
        taxConvention: 'us-state',
        surchargeShape: [],
        currency: 'USD',
        primaryLang: 'en',
        priceFormat: 'either'
      }
    },
    {
      id: 'produce-jobber',
      positive: [
        { rx: /\bBaldor\b/i,                                w: 0.40 },
        { rx: /\bFreshPoint\b/i,                            w: 0.40 },
        { rx: /\b(?:lettuce|tomato|onion|cucumber|pepper|herbs?|melon)\b/i, w: 0.10 },
        { rx: /\b(?:lb|LB)\s*AVG\b/i,                       w: 0.20 },
        { rx: /\b(?:catch|pack)\s*weight\b/i,                w: 0.15 },
        { rx: /\b\d+\s*\/\s*(?:cs|CS|case)\b/i,             w: 0.10 }
      ],
      negative: [],
      hints: {
        columnLayout: 'broadliner',
        taxConvention: 'us-state',
        surchargeShape: ['fuel-surcharge'],
        currency: 'USD',
        primaryLang: 'en',
        priceFormat: 'either'
      }
    },
    {
      id: 'asian-wholesale',
      positive: [
        { rx: /\bH\s*Mart\b|\bHmart\b/i,                    w: 0.50 },
        { rx: /\b99\s*Ranch\b/i,                            w: 0.50 },
        { rx: /\b(?:asian|korean|chinese|japanese)\s+(?:wholesale|market)/i, w: 0.30 },
        // Asian-script markers (CJK ranges).
        { rx: /[一-鿿]/,                            w: 0.40 },
        { rx: /[぀-ヿ]/,                            w: 0.30 },
        { rx: /[가-힯]/,                            w: 0.30 },
        { rx: /\bsoy|tofu|kimchi|miso|sake|bok\s*choy\b/i,  w: 0.05 }
      ],
      negative: [],
      hints: {
        columnLayout: 'compact',
        taxConvention: 'us-state',
        surchargeShape: [],
        currency: 'USD',
        primaryLang: 'asian-mixed',
        priceFormat: 'either'
      }
    },
    {
      id: 'mexican-wholesale',
      positive: [
        { rx: /\bIVA\b/i,                                   w: 0.30 },
        { rx: /\bRFC\b/i,                                   w: 0.30 },
        { rx: /\bCURP\b/i,                                  w: 0.20 },
        { rx: /\bfactura\b|\bremisi[oó]n\b/i,                w: 0.20 },
        { rx: /\bimporte\b|\bsubtotal\b.*\$/i,               w: 0.10 },
        { rx: /\bdescuento\b/i,                              w: 0.10 },
        // Spanish word density (domain-relevant terms).
        { rx: /\b(carne|res|cerdo|pollo|pescado|verdura|fruta|leche|queso|mantequilla|aceite|harina|az[uú]car|sal|pimienta)\b/i, w: 0.05 },
        { rx: /\bM\.?N\.?\b|\bpesos?\b|\bMXN\b/i,            w: 0.20 }
      ],
      negative: [
        { rx: /\bUSD\b/i,                                   w: 0.20 }
      ],
      hints: {
        columnLayout: 'broadliner',
        taxConvention: 'mx-iva',
        surchargeShape: ['iva-tax'],
        currency: 'MXN',
        primaryLang: 'es',
        priceFormat: 'either'
      }
    },
    {
      id: 'handwritten',
      // Detected mostly by absence of distributor markers + low text
      // density. We can't measure stroke variance from OCR text alone,
      // so we score handwritten only when nothing else fits AND the
      // line count is unusually low.
      positive: [
        { rx: /\b(?:farmer'?s?\s*market|orchard|csa|co\s*-?\s*op)\b/i, w: 0.30 }
      ],
      negative: [
        { rx: /\b(?:invoice\s*(?:no|number)|customer\s*number|P\.?O\.?\s*#)\b/i, w: 0.30 }
      ],
      hints: {
        columnLayout: 'free-form',
        taxConvention: 'none',
        surchargeShape: [],
        currency: 'USD',
        primaryLang: 'en',
        priceFormat: 'either'
      }
    }
  ];

  // ---------- Scoring ----------

  function _scoreFamily(text, family) {
    var score = 0;
    var matches = [];
    family.positive.forEach(function (sig) {
      if (sig.rx.test(text)) { score += sig.w; matches.push(sig.rx.source); }
    });
    family.negative.forEach(function (sig) {
      if (sig.rx.test(text)) { score -= sig.w; matches.push('!' + sig.rx.source); }
    });
    return { score: score, matches: matches };
  }

  // Optional structural signals beyond text tokens.
  function _structuralBoost(family, opts) {
    if (!opts) return 0;
    var lineCount = +opts.lineCount || 0;
    var canvasAspect = +opts.canvasAspect || 0;   // height/width
    var hasPackDensity = !!opts.hasPackDensity;
    var b = 0;
    if (family.id === 'thermal-receipt') {
      // Receipts are tall + narrow (aspect > 2.0) and short (lineCount typically 20–60)
      if (canvasAspect > 2.0)         b += 0.20;
      if (lineCount > 0 && lineCount < 80) b += 0.05;
    }
    if (family.id === 'broadliner') {
      // Broadliners pack-notation-dense and 30+ rows is common.
      if (hasPackDensity)             b += 0.10;
      if (lineCount > 30)             b += 0.05;
    }
    if (family.id === 'handwritten') {
      // Very few lines + missing standard markers → likely handwritten.
      if (lineCount > 0 && lineCount < 12) b += 0.30;
    }
    return b;
  }

  // ---------- Public ----------

  function classifyFamily(text, opts) {
    if (typeof text !== 'string' || !text.length) {
      return { family: 'unknown', confidence: 0, hints: {}, allScores: {} };
    }
    var allScores = {};
    var winner = null;
    var winnerScore = 0;
    FAMILIES.forEach(function (f) {
      var s = _scoreFamily(text, f);
      var total = s.score + _structuralBoost(f, opts);
      allScores[f.id] = +total.toFixed(3);
      if (total > winnerScore) { winnerScore = total; winner = f; }
    });
    if (!winner || winnerScore < 0.3) {
      return { family: 'unknown', confidence: 0, hints: {}, allScores: allScores };
    }
    return {
      family:     winner.id,
      confidence: Math.min(1, winnerScore),
      hints:      Object.assign({}, winner.hints),
      allScores:  allScores
    };
  }

  // Lookup hints for a known family id (used when the controller
  // already has the family from elsewhere — e.g. a saved trend entry).
  function hintsFor(familyId) {
    var f = FAMILIES.filter(function (x) { return x.id === familyId; })[0];
    return f ? Object.assign({}, f.hints) : {};
  }

  function listFamilies() { return FAMILIES.map(function (f) { return f.id; }); }

  var api = {
    classifyFamily: classifyFamily,
    hintsFor:       hintsFor,
    listFamilies:   listFamilies,
    FAMILIES:       FAMILIES
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_FAMILY = api;
})(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : null));
