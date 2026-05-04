/**
 * Invoice grammar atlas.
 *
 * Universal pattern library for invoice text — pack notation, line
 * shapes, line-kind classification, math reconciliation grammar.
 * Pattern-mined from the broad foodservice / wholesale / DSD /
 * thermal-receipt / handwritten / LatAm / Asian-wholesale corpus.
 * No operator-private data — just the structural conventions.
 *
 * Four atlases:
 *   1. PACK_NOTATION    — case/count/per-unit/base-unit normalisers
 *   2. LINE_SHAPES      — regex catalog of common line layouts
 *   3. KIND_CLASSIFIER  — item / credit / surcharge / fee / tax /
 *                         subtotal / total / deposit / discount /
 *                         backorder / substitution
 *   4. MATH_GRAMMAR     — distributor-family-specific footer
 *                         conventions for math reconciliation
 *
 * Used by parse.js (delegated to in commit 3 of this atlas).
 *
 * Privacy: pure functions over OCR text. No fetch, no context read.
 */
(function (root) {
  'use strict';

  // ===========================================================
  // 1. PACK NOTATION ATLAS
  // ===========================================================
  //
  // parsePack(text) → {count, perUnit, baseUnit, totalQuantity, raw}
  // or null when no pack notation is found.
  //
  // Catches:
  //   "4/1GAL"      → {count:4, perUnit:1, baseUnit:'GAL', total:4}
  //   "6X10LB"      → {count:6, perUnit:10, baseUnit:'LB', total:60}
  //   "24CT"        → {count:24, perUnit:1, baseUnit:'CT', total:24}
  //   "12X750ML"    → {count:12, perUnit:750, baseUnit:'ML', total:9000}
  //   "1/2GAL"      → {count:1, perUnit:0.5, baseUnit:'GAL', total:0.5}
  //   "5LB AVG"     → {count:1, perUnit:5, baseUnit:'LB', total:5, avg:true}
  //   "6/#10"       → {count:6, perUnit:1, baseUnit:'#10CAN', total:6}
  //   "EACH" / "EA" → {count:1, perUnit:1, baseUnit:'EA', total:1}
  //   "2/CASE"      → {count:2, perUnit:1, baseUnit:'CASE', total:2}
  //   "4LB AVG @ $X/LB" → {count:1, perUnit:4, baseUnit:'LB', total:4, avg:true, perBasePriced:true}
  //
  // Multi-pass: try each pattern in priority order, take first match.

  var PACK_PATTERNS = [
    // "12X750ML" or "12 x 750ml" — count × per-unit, no fraction
    {
      rx: /(\d+)\s*[Xx×]\s*(\d+(?:\.\d+)?)\s*(ML|L|LB|OZ|FL\s*OZ|GAL|G|KG|CT|CAN|BTL)\b/i,
      build: function (m) {
        var c = +m[1], p = +m[2], u = m[3].replace(/\s+/g, '').toUpperCase();
        return { count: c, perUnit: p, baseUnit: u, totalQuantity: c * p, avg: false, perBasePriced: false };
      }
    },
    // Fractional per-unit ("1/2GAL", "1/4LB", "3/4GAL"). Only fires
    // when numerator < denominator AND denominator is one of the
    // common kitchen fractions (2,3,4,8). Otherwise the generic
    // count/per-unit pattern below takes it.
    {
      rx: /(?:^|\s)(\d+)\s*\/\s*(\d+)\s*(ML|L|LB|OZ|GAL|GA|G|KG)\b/i,
      build: function (m) {
        var num = +m[1], den = +m[2];
        if (num >= den) return null;
        if ([2, 3, 4, 8].indexOf(den) === -1) return null;
        var u = m[3].toUpperCase();
        if (u === 'GA') u = 'GAL';
        return { count: 1, perUnit: num / den, baseUnit: u, totalQuantity: num / den, avg: false, perBasePriced: false };
      }
    },
    // "4/1GAL" or "4/1 GAL" — count/per-unit (general case)
    {
      rx: /(\d+)\s*\/\s*(\d+(?:\.\d+)?)\s*(ML|L|LB|OZ|FL\s*OZ|GAL|G|KG|CT|CAN|BTL|GA)\b/i,
      build: function (m) {
        var c = +m[1], p = +m[2], u = m[3].replace(/\s+/g, '').toUpperCase();
        if (u === 'GA') u = 'GAL';
        return { count: c, perUnit: p, baseUnit: u, totalQuantity: c * p, avg: false, perBasePriced: false };
      }
    },
    // "#10" canned goods notation: "6/#10"
    {
      rx: /(\d+)\s*\/\s*#(\d+)\b/,
      build: function (m) {
        return { count: +m[1], perUnit: 1, baseUnit: '#' + m[2] + 'CAN', totalQuantity: +m[1], avg: false, perBasePriced: false };
      }
    },
    // "5LB AVG @ $X/LB" — catch-weight, priced per base unit
    {
      rx: /(\d+(?:\.\d+)?)\s*(LB|OZ|KG)\s*AVG(?:\s*@\s*\$\d|\s*PER\s*LB)?/i,
      build: function (m) {
        var w = +m[1], u = m[2].toUpperCase();
        return { count: 1, perUnit: w, baseUnit: u, totalQuantity: w, avg: true, perBasePriced: /@|PER/i.test(m[0]) };
      }
    },
    // "24CT" or "24 CT" — count units only
    {
      rx: /(\d+)\s*(CT|EA|EACH|CN|CAN|BTL|BAG|PK)\b/i,
      build: function (m) {
        var c = +m[1], u = m[2].toUpperCase();
        if (u === 'EACH') u = 'EA';
        return { count: c, perUnit: 1, baseUnit: u, totalQuantity: c, avg: false, perBasePriced: false };
      }
    },
    // "2/CASE" or "1/EACH" — minimal
    {
      rx: /(\d+)\s*\/\s*(CASE|CS|EACH|EA|CT)\b/i,
      build: function (m) {
        var c = +m[1], u = m[2].toUpperCase();
        if (u === 'EACH') u = 'EA';
        if (u === 'CS') u = 'CASE';
        return { count: c, perUnit: 1, baseUnit: u, totalQuantity: c, avg: false, perBasePriced: false };
      }
    },
    // Bare "EACH"
    {
      rx: /\b(EA|EACH)\b/i,
      build: function () {
        return { count: 1, perUnit: 1, baseUnit: 'EA', totalQuantity: 1, avg: false, perBasePriced: false };
      }
    }
  ];

  function parsePack(text) {
    if (!text) return null;
    for (var i = 0; i < PACK_PATTERNS.length; i++) {
      var m = PACK_PATTERNS[i].rx.exec(text);
      if (m) {
        var pack = PACK_PATTERNS[i].build(m);
        if (pack) {
          pack.raw = m[0];
          return pack;
        }
      }
    }
    return null;
  }

  // ===========================================================
  // 2. LINE SHAPE ATLAS
  // ===========================================================
  //
  // Each shape returns parsed {sku, name, qty, unit, unitPrice,
  // lineTotal} when matched; null otherwise. Probed in order; first
  // match wins.

  var LINE_SHAPES = [
    {
      id: 'canonical-broadliner',
      // SKU + desc + qty + unit + unit-price + line-total
      // e.g. "6741034 ROMAINE HEARTS 24CT  2 CS  $24.00  $48.00"
      rx: /^(\d{5,8})\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(CS|CT|EA|EACH|LB|GAL|CASE|PK|BAG|BTL|CAN)\s+\$?(\d+(?:\.\d+)?)\s+\$?(\d+(?:\.\d+)?)\s*$/i,
      build: function (m) {
        return {
          sku: m[1], name: m[2].trim(),
          qty: +m[3], unit: m[4].toUpperCase(),
          unitPrice: +m[5], lineTotal: +m[6]
        };
      }
    },
    {
      id: 'broadliner-no-sku',
      // desc + qty + unit + unit-price + line-total (no SKU)
      rx: /^(.+?)\s+(\d+(?:\.\d+)?)\s+(CS|CT|EA|EACH|LB|GAL|CASE|PK|BAG|BTL|CAN)\s+\$?(\d+(?:\.\d+)?)\s+\$?(\d+(?:\.\d+)?)\s*$/i,
      build: function (m) {
        return {
          sku: null, name: m[1].trim(),
          qty: +m[2], unit: m[3].toUpperCase(),
          unitPrice: +m[4], lineTotal: +m[5]
        };
      }
    },
    {
      id: 'compact',
      // desc + qty/unit + price (no line-total column; receipt-shaped)
      rx: /^(.+?)\s+(\d+(?:\.\d+)?)\s*(CT|EA|LB|OZ|GAL|PK|CS)\s+\$?(\d+(?:\.\d+)?)\s*$/i,
      build: function (m) {
        var qty = +m[2];
        var unitPrice = +m[4];
        return {
          sku: null, name: m[1].trim(),
          qty: qty, unit: m[3].toUpperCase(),
          unitPrice: unitPrice, lineTotal: +(qty * unitPrice).toFixed(2)
        };
      }
    },
    {
      id: 'receipt-flat',
      // "ROMAINE 24CT  $48.00" — receipt format, no qty/unit column
      rx: /^(.+?)\s+\$?(\d+(?:\.\d+)?)\s*$/i,
      build: function (m) {
        return {
          sku: null, name: m[1].trim(),
          qty: 1, unit: 'EA',
          unitPrice: +m[2], lineTotal: +m[2]
        };
      }
    }
  ];

  function parseLineShape(text) {
    if (!text) return null;
    var t = String(text).trim();
    for (var i = 0; i < LINE_SHAPES.length; i++) {
      var m = LINE_SHAPES[i].rx.exec(t);
      if (m) {
        var built = LINE_SHAPES[i].build(m);
        if (built) {
          built.shape = LINE_SHAPES[i].id;
          return built;
        }
      }
    }
    return null;
  }

  // ===========================================================
  // 3. KIND CLASSIFIER
  // ===========================================================
  //
  // Each line is one of:
  //   'item'         — actual product line
  //   'credit'       — return / credit memo (negative dollars)
  //   'backorder'    — out of stock; usually $0
  //   'substitution' — alt SKU shipped in place of ordered SKU
  //   'deposit'      — bottle/keg deposit (often refundable)
  //   'surcharge'    — fuel / delivery / handling
  //   'fee'          — generic fee
  //   'tax'          — sales tax / VAT / IVA
  //   'discount'     — line or invoice discount
  //   'subtotal'     — pre-tax / pre-fee subtotal line
  //   'total'        — final total
  //   'unknown'      — fall-through (still parsed as item)

  var KIND_PATTERNS = [
    { kind: 'subtotal',     rx: /^\s*(?:sub\s*total|subtotal|sub-total|subtotal\s*sale)\b/i },
    { kind: 'total',        rx: /^\s*(?:total|grand\s*total|invoice\s*total|amount\s*due|net\s*total|total\s*due)\b/i },
    { kind: 'tax',          rx: /\b(?:sales\s*tax|state\s*tax|local\s*tax|county\s*tax|city\s*tax|vat|iva|gst|hst|pst|qst|crv)\b/i },
    { kind: 'surcharge',    rx: /\b(?:fuel\s*surcharge|fuel\s*charge|delivery\s*charge|delivery\s*fee|freight|handling|off[\s-]?load|service\s*charge)\b/i },
    { kind: 'deposit',      rx: /\b(?:bottle\s*deposit|keg\s*deposit|crate\s*deposit|pallet\s*deposit|deposit\s*-?\s*returnable)\b/i },
    { kind: 'discount',     rx: /\b(?:discount|allowance|rebate|promo|promotion|member\s*discount|case\s*discount|volume\s*discount)\b/i },
    { kind: 'credit',       rx: /\b(?:credit\s*memo|return|returned|refund|cr\b)\b/i },
    { kind: 'backorder',    rx: /\b(?:back[\s-]?order|backordered|out\s*of\s*stock|oos\b|bo\b)\b/i },
    { kind: 'substitution', rx: /\b(?:sub|substitut(?:e|ion)|alt(?:ernate)?|in\s*place\s*of)\b/i },
    { kind: 'fee',          rx: /\b(?:fee|charge)\b/i }
  ];

  function classifyKind(text) {
    if (!text) return 'unknown';
    var t = String(text);
    for (var i = 0; i < KIND_PATTERNS.length; i++) {
      if (KIND_PATTERNS[i].rx.test(t)) return KIND_PATTERNS[i].kind;
    }
    return 'item';
  }

  // ===========================================================
  // 4. MATH RECONCILIATION GRAMMAR
  // ===========================================================
  //
  // Per-family footer conventions. Used to validate parse results
  // and to bias the suggestMathFix heuristic toward family-correct
  // fix candidates.
  //
  // Each entry: {family, sequence: [step, ...]}
  // Sequence steps (in order): 'subtotal', 'discount', 'tax',
  // 'surcharge', 'deposit', 'total'. Different families interleave
  // these differently.

  var MATH_GRAMMARS = {
    'broadliner': {
      sequence: ['subtotal', 'discount', 'surcharge', 'tax', 'total'],
      // Fuel surcharge typically falls between subtotal and tax.
      taxBase: 'subtotal-plus-surcharge'
    },
    'paper-goods': {
      sequence: ['subtotal', 'discount', 'tax', 'surcharge', 'total'],
      taxBase: 'subtotal'
    },
    'beverage': {
      sequence: ['subtotal', 'crv', 'tax', 'deposit', 'total'],
      // CRV is per-line in CA but totaled; deposits separate from CRV.
      taxBase: 'subtotal-plus-crv'
    },
    'dairy-dsd': {
      sequence: ['subtotal', 'credit', 'total'],
      taxBase: 'none'
    },
    'thermal-receipt': {
      sequence: ['subtotal', 'tax', 'total'],
      taxBase: 'subtotal'
    },
    'produce-jobber': {
      sequence: ['subtotal', 'surcharge', 'total'],
      taxBase: 'none'
    },
    'asian-wholesale': {
      sequence: ['subtotal', 'tax', 'total'],
      taxBase: 'subtotal'
    },
    'mexican-wholesale': {
      sequence: ['subtotal', 'discount', 'iva', 'total'],
      taxBase: 'subtotal-minus-discount'
    },
    'handwritten': {
      sequence: ['subtotal', 'total'],
      taxBase: 'none'
    },
    'unknown': {
      sequence: ['subtotal', 'tax', 'total'],
      taxBase: 'subtotal'
    }
  };

  function mathGrammarFor(family) {
    return MATH_GRAMMARS[family] || MATH_GRAMMARS.unknown;
  }

  // Validate that the math sequence in a parsed result respects the
  // family's footer convention. Returns {ok, expectedTaxBase, gaps}.
  // Used by suggestMathFix to bias fix candidates.
  function validateMath(parsed, family) {
    if (!parsed || !parsed.rows) return { ok: false, gaps: ['no-rows'] };
    var grammar = mathGrammarFor(family || 'unknown');
    var gaps = [];
    var rows = parsed.rows;
    var rowsByKind = {};
    rows.forEach(function (r) {
      if (!r) return;
      var k = r.kind || 'item';
      (rowsByKind[k] = rowsByKind[k] || []).push(r);
    });
    grammar.sequence.forEach(function (step) {
      // Map sequence steps to row kinds for presence check.
      var kinds =
        step === 'subtotal' ? ['subtotal'] :
        step === 'discount' ? ['discount'] :
        step === 'tax'      ? ['tax'] :
        step === 'iva'      ? ['tax'] :
        step === 'crv'      ? ['tax', 'fee'] :
        step === 'surcharge'? ['surcharge'] :
        step === 'deposit'  ? ['deposit'] :
        step === 'credit'   ? ['credit'] :
        step === 'total'    ? ['total'] : [];
      var found = kinds.some(function (k) { return (rowsByKind[k] || []).length > 0; });
      // Only some steps are required (subtotal + total typically);
      // others are optional. Don't fail validation — just record gaps
      // for diagnostic.
      if (!found && (step === 'subtotal' || step === 'total')) {
        gaps.push('missing-' + step);
      }
    });
    return { ok: gaps.length === 0, gaps: gaps, expectedTaxBase: grammar.taxBase, sequence: grammar.sequence };
  }

  // ===========================================================
  // PUBLIC
  // ===========================================================

  var api = {
    parsePack:        parsePack,
    parseLineShape:   parseLineShape,
    classifyKind:     classifyKind,
    mathGrammarFor:   mathGrammarFor,
    validateMath:     validateMath,
    PACK_PATTERNS:    PACK_PATTERNS,
    LINE_SHAPES:      LINE_SHAPES,
    KIND_PATTERNS:    KIND_PATTERNS,
    MATH_GRAMMARS:    MATH_GRAMMARS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_GRAMMAR = api;
})(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : null));
