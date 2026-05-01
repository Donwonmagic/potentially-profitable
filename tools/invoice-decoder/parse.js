/**
 * Invoice Decoder — line-item parser (Wave B2).
 *
 * Takes OCR'd lines and emits structured rows. Five regex patterns
 * applied most-specific-first; falls through to the next pattern
 * when one fails. Each row gets a confidence score that combines
 * (a) the OCR's per-line confidence and (b) a structural-fit boost
 * when the line matches a precise pattern.
 *
 * Patterns extend plate-cost's three-pattern approach
 * (tools/plate-cost/index.html:1411-1470) with two more shapes
 * common on supplier invoices:
 *   D — SKU-prefixed:  "10234  ROMAINE 24CT  CASE  2  CS  $48.00"
 *   E — weight+count:  "GROUND CHUCK  10 LB  2 CT  $58.00"
 *
 * Vendor extraction (top 200px of OCR text) is plumbed here so
 * Wave B3's vendor-template parsers can decide whether to take
 * over for Sysco / US Foods / GFS / Restaurant Depot / Shamrock /
 * Sygma. Generic falls back to these patterns.
 *
 * Total extraction handles EN + ES variants; mismatch detection
 * (parsed line-sum vs printed total) becomes the verification
 * banner in B5.
 *
 * Header skip extended for both EN and ES distributor invoices.
 */
(function (root) {
  'use strict';

  // Common units the discriminator regex accepts as a price-line
  // unit token. Anything else in the unit slot demotes the line
  // toward Pattern C (description-+-price fallback).
  var UNITS_RE = /^(lb|lbs|oz|ozs|kg|g|gal|qt|pt|fl\s*oz|ml|l|case|cs|ea|each|count|ct|dozen|doz|bag|bx|box|jug|jar|tin|can|sleeve|tray|sack|bunch)$/i;

  // Header / footer / boilerplate lines that shouldn't be parsed
  // as items. EN + ES coverage.
  var HEADER_SKIP_RE = /^(invoice|total|subtotal|tax|due|customer|page|date|account|terms|po|p\.o\.|qty|unit|description|item|sku|amount|product|received|driver|signature|gross\s+amount|net\s+amount|continued|page\s+\d+\s+of\s+\d+|factura|cliente|fecha|cuenta|t[ée]rminos|pedido|cantidad|unidad|descripci[oó]n|art[ií]culo|importe|monto|recibi[oó]|firma|p[aá]gina)/i;

  var TOTAL_RE_EN = /(?:invoice\s+)?total(?:\s+due)?[:\s]+\$?(\d+(?:,\d{3})*\.\d{2})/i;
  var TOTAL_RE_ES = /total(?:\s+factura)?[:\s]+\$?(\d+(?:,\d{3})*\.\d{2})/i;

  var VENDOR_RE = /(sysco|us\s*foods|restaurant\s+depot|gordon\s+food|gfs|shamrock|sygma|performance\s+food|vistar|ben\s*e\.\s*keith|reinhart)/i;

  function normPrice(s) {
    var v = String(s || '').replace(/,/g, '').replace(/[^0-9.\-]/g, '');
    if (!v) return null;
    var n = parseFloat(v);
    return isFinite(n) ? n : null;
  }
  function normQty(s) {
    var v = String(s || '').replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
    if (!v) return null;
    var n = parseFloat(v);
    return isFinite(n) ? n : null;
  }
  function normUnit(s) {
    var u = String(s || '').toLowerCase().trim();
    if (u === 'lbs') return 'lb';
    if (u === 'ozs') return 'oz';
    if (u === 'each') return 'ea';
    if (u === 'count') return 'ct';
    if (u === 'doz')  return 'dozen';
    return u;
  }
  function cleanName(s) {
    return String(s || '').replace(/\s{2,}/g, ' ').trim();
  }

  // Parse a single line. Returns either a row object or null when
  // no pattern matches. Confidence factors in the OCR-supplied
  // confidence and the pattern-fit score.
  //
  // Row shape:
  //   { name, qty, unit, unitPrice, lineTotal, confidence, raw, pattern }
  // qty may be null if the line is shape "<desc> $price" (Pattern C).
  function parseLine(rawLine, ocrConfidence) {
    var line = String(rawLine || '').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').trim();
    if (line.length < 4) return null;
    if (HEADER_SKIP_RE.test(line)) return null;

    var ocrConf = (typeof ocrConfidence === 'number') ? ocrConfidence : 60;

    // Pattern D — SKU-prefixed (Sysco-shaped):
    //   "10234  ROMAINE HEARTS 24CT  2  CS  $48.00"
    var m = line.match(/^#?(\d{4,8})\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+([a-zA-Z]+)\s+\$?(\d+(?:[.,]\d{2}))\s*$/);
    if (m && UNITS_RE.test(m[4])) {
      return {
        name: cleanName(m[2]),
        sku: m[1],
        qty: normQty(m[3]),
        unit: normUnit(m[4]),
        unitPrice: null,
        lineTotal: normPrice(m[5]),
        confidence: Math.round(Math.min(100, ocrConf * 1.05 + 5)),
        raw: line,
        pattern: 'D-sku'
      };
    }

    // Pattern A — generic qty/unit/desc/price:
    //   "2 CS ROMAINE HEARTS 24CT $48.00"
    m = line.match(/^(\d+(?:[.,]\d+)?)\s+([a-zA-Z]+)\s+(.+?)\s+\$?(\d+(?:[.,]\d{2}))\s*$/);
    if (m && UNITS_RE.test(m[2])) {
      return {
        name: cleanName(m[3]),
        sku: null,
        qty: normQty(m[1]),
        unit: normUnit(m[2]),
        unitPrice: null,
        lineTotal: normPrice(m[4]),
        confidence: Math.round(Math.min(100, ocrConf + 4)),
        raw: line,
        pattern: 'A-qty-unit-desc-price'
      };
    }

    // Pattern E — weight + count (US Foods-shaped):
    //   "GROUND CHUCK  10 LB  2 CT  $58.00"
    m = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(lb|lbs|oz|kg|g)\s+(\d+)\s*ct\s+\$?(\d+(?:\.\d{2}))\s*$/i);
    if (m) {
      return {
        name: cleanName(m[1]),
        sku: null,
        qty: normQty(m[4]),
        unit: 'ct',
        weight: normQty(m[2]),
        weightUnit: normUnit(m[3]),
        unitPrice: null,
        lineTotal: normPrice(m[5]),
        confidence: Math.round(Math.min(100, ocrConf + 4)),
        raw: line,
        pattern: 'E-weight-count'
      };
    }

    // Pattern B — desc/qty/unit/price:
    //   "ROMAINE HEARTS 24CT  2 CS $48.00"
    m = line.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)?\s+\$?(\d+(?:[.,]\d{2}))\s*$/);
    if (m && (!m[3] || UNITS_RE.test(m[3]))) {
      return {
        name: cleanName(m[1]),
        sku: null,
        qty: normQty(m[2]),
        unit: m[3] ? normUnit(m[3]) : 'ea',
        unitPrice: null,
        lineTotal: normPrice(m[4]),
        confidence: Math.round(Math.min(100, ocrConf + 1)),
        raw: line,
        pattern: 'B-desc-qty-unit-price'
      };
    }

    // Pattern C — fallback "<desc> $price":
    //   "WALK-IN MAINTENANCE  $125.00"
    m = line.match(/^(.+?)\s+\$?(\d+\.\d{2})\s*$/);
    if (m) {
      return {
        name: cleanName(m[1]),
        sku: null,
        qty: 1,
        unit: 'ea',
        unitPrice: null,
        lineTotal: normPrice(m[2]),
        confidence: Math.round(Math.max(20, ocrConf - 15)),
        raw: line,
        pattern: 'C-fallback'
      };
    }

    return null;
  }

  // Compute unit price from line total ÷ qty when only line total
  // was parsed. Trivial but central to plate-cost handoff.
  function deriveUnitPrices(rows) {
    rows.forEach(function (r) {
      if (r.unitPrice == null && r.lineTotal != null && r.qty && r.qty > 0) {
        r.unitPrice = +(r.lineTotal / r.qty).toFixed(4);
      }
    });
    return rows;
  }

  // Extract vendor + total from the full OCR text. Returns
  // { vendor, totalParsed }; nulls when not found.
  function extractMeta(ocrText) {
    var top = String(ocrText || '').slice(0, 600);
    var v = top.match(VENDOR_RE);
    var vendor = v ? v[1].toLowerCase().replace(/\s+/g, '-').replace('us-foods', 'us-foods') : null;
    var t = String(ocrText || '').match(TOTAL_RE_EN) || String(ocrText || '').match(TOTAL_RE_ES);
    var total = t ? normPrice(t[1]) : null;
    return { vendor: vendor, totalParsed: total };
  }

  // Top-level: parse an array of OCR lines into rows + meta.
  function parseLines(lines, fullText) {
    if (!Array.isArray(lines)) lines = [];
    var rows = [];
    lines.forEach(function (ln) {
      var row = parseLine(ln.text || '', ln.confidence);
      if (row) rows.push(row);
    });
    deriveUnitPrices(rows);
    var meta = extractMeta(fullText || lines.map(function (l) { return l.text; }).join('\n'));
    var sumParsed = rows.reduce(function (a, r) { return a + (r.lineTotal || 0); }, 0);
    var deltaPct = (meta.totalParsed && sumParsed)
      ? Math.abs((sumParsed - meta.totalParsed) / meta.totalParsed) * 100
      : null;
    return {
      rows: rows.slice(0, 200), // hard cap — anything past 200 is noise
      vendor: meta.vendor,
      totalParsed: meta.totalParsed,
      sumParsed: +sumParsed.toFixed(2),
      deltaPct: deltaPct
    };
  }

  var api = { parseLine: parseLine, parseLines: parseLines, extractMeta: extractMeta, UNITS_RE: UNITS_RE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_PARSE = api;
})(typeof window !== 'undefined' ? window : null);
