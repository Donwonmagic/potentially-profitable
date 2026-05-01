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

  var VENDOR_RE = /(sysco|us\s*foods|restaurant\s+depot|gordon\s+food|gfs|shamrock|sygma|performance\s+food|vistar|ben\s*e\.\s*keith|reinhart|cheney|imperial\s+dade|kehe|unfi|baldor|fresh\s*point|maines|veritiv|webstaurant|h\s*mart|northgate|mariscos)/i;

  // Wave 1.5 — credit / return / deposit / surcharge detection.
  // Distributors print these alongside line items but they aren't
  // ingredients; bucketing them as `kind` keeps math reconciliation
  // honest and gives the accountant export a clean line type.
  var CREDIT_RE   = /\b(credit|cred|cr|return|returned|adjustment|adj|reembolso|devoluci[oó]n|abono|nota\s+de\s+cr[eé]dito)\b/i;
  var DEPOSIT_RE  = /\b(deposit|btl\s*dep|bottle\s+dep|crv|recycl|envase|dep[oó]sito|dep\.?)\b/i;
  var SURCHARGE_RE = /\b(fuel\s+surcharge|fuel\s+adj|surcharge|delivery\s+fee|svc\s+fee|service\s+fee|small\s+order|recargo|combustible|env[ií]o)\b/i;
  var BACKORDER_RE = /\b(b\/o|b\.?o\.?|backorder|back\s*order|sin\s+existencia)\b/i;
  // Negative-sign or parentheses-wrapped extended price flips the line
  // toward credit/return. This catches "$(48.00)", "-$48.00", "$48.00 CR".
  var NEG_PRICE_RE = /(\(\$?\d+(?:[.,]\d{2})\)|-\s*\$?\d+(?:[.,]\d{2})|\$?\d+(?:[.,]\d{2})\s*cr\b)/i;

  // Pack notation seen on distributor invoices: "12/16OZ", "1/CASE",
  // "6#10", "24CT", "40LB". We capture into row.pack so the accountant
  // export and plate-cost handoff have honest case/unit data.
  var PACK_NOTATION_RE = /\b(\d+)\s*\/\s*(\d+(?:\.\d+)?)\s*(oz|fl\s*oz|ml|l|lb|kg|g|ct|ea|count|pk|gal|qt|pt)\b/i;
  var PACK_HASH_RE     = /\b(\d+)\s*#\s*(\d+)\b/;       // "6#10" = 6 #10 cans
  var PACK_SIMPLE_RE   = /\b(\d+)\s*(ct|count|pk|pack|cs|case|bx|box|bag|sleeve)\b/i;

  // Wave 8.1 — OCR numeric-cluster repair.
  //
  // Tesseract routinely confuses similar-looking glyphs in price /
  // quantity columns: O↔0, l/I/|↔1, S↔5, B↔8. Confusion is ALWAYS
  // wrong for our purposes — invoice numerics are pure digits — but
  // the regex parsers (`\d+(?:[.,]\d{2})`) reject any letter, so a
  // line like `ROMAINE  $48.OO` fails to match instead of just being
  // misread.
  //
  // Strategy: walk the line, find clusters that look numeric (start
  // with $ OR contain a .dd decimal), and substitute the confused
  // letter back to its digit. We DO NOT touch other clusters — words
  // like "loss" or unit suffixes like "10lb" stay intact.
  //
  // Conservative bias: skip lone-digit clusters with letters (e.g.
  // "B7" — could be a SKU prefix). The .dd-decimal / $-prefix
  // requirement filters out almost all false positives.
  var OCR_CLUSTER_RE = /(\$[0-9OoIl|SsBbQq.,]+|[0-9OoIl|SsBbQq,]+\.[0-9OoIl|SsBbQq]{2,3})/g;
  function repairOcrNumerics(line) {
    return String(line || '').replace(OCR_CLUSTER_RE, function (m) {
      return m
        .replace(/[OoQq]/g, '0')
        .replace(/[lI|]/g,  '1')
        .replace(/[Ss]/g,   '5')
        .replace(/[Bb]/g,   '8');
    });
  }

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

  // Wave 1.5 — classify the row kind from the raw line. Defaults to
  // 'item'; flips when a credit/deposit/surcharge marker fires.
  function classifyKind(raw) {
    var s = String(raw || '');
    if (CREDIT_RE.test(s) || NEG_PRICE_RE.test(s)) return 'credit';
    if (DEPOSIT_RE.test(s)) return 'deposit';
    if (SURCHARGE_RE.test(s)) return 'surcharge';
    if (BACKORDER_RE.test(s)) return 'backorder';
    return 'item';
  }

  // Wave 1.5 — extract pack notation into a small structured object.
  // Conservative: only fires when one of three notations matches; never
  // mutates name/qty (those stay as the line's primary signals).
  function extractPack(raw) {
    var s = String(raw || '');
    var m = s.match(PACK_NOTATION_RE);
    if (m) {
      return {
        caseQty:  parseInt(m[1], 10),
        unitSize: parseFloat(m[2]),
        unit:     String(m[3]).toLowerCase().replace(/\s+/g, '')
      };
    }
    m = s.match(PACK_HASH_RE);
    if (m) {
      return { caseQty: parseInt(m[1], 10), unitSize: parseInt(m[2], 10), unit: '#' };
    }
    m = s.match(PACK_SIMPLE_RE);
    if (m) {
      return { caseQty: parseInt(m[1], 10), unitSize: null, unit: String(m[2]).toLowerCase() };
    }
    return null;
  }

  // Wave 1.7 — per-field confidence scoring.
  //
  // The legacy `confidence` is a single rolled-up scalar that's hard
  // to act on: an amber row could be amber for any of (name, qty,
  // price, category) and the operator can't tell which. We now score
  // each field independently using cheap structural signals, then
  // expose `fieldConf` alongside the rolled-up scalar (kept for
  // back-compat with the bulk-confirm filter).
  //
  // Signals per field:
  //   name  — letter-density + length sanity; OCR-conf carries weight
  //           when the parsed name is short or all-caps gibberish
  //   qty   — finite-numeric, non-negative, < 9999
  //   price — finite-numeric, two decimals, presence of $ in raw
  //   category — set by categorize.js after this runs; we initialize
  //              to ocrConf so it's never empty (categorize overwrites)
  function scoreFields(row, raw, ocrConf, pattern) {
    var rawStr = String(raw || '');
    var name = String(row.name || '');
    // Name confidence: 90 baseline minus penalties for very short
    // names (<5 chars) and lots of digits-vs-letters drift.
    var letters = (name.match(/[a-záéíóúñ]/gi) || []).length;
    var digits  = (name.match(/\d/g) || []).length;
    var letterRatio = letters / Math.max(1, letters + digits);
    var nameConf = ocrConf;
    if (name.length >= 5 && letterRatio >= 0.6) nameConf = Math.min(100, nameConf + 6);
    if (name.length < 5)  nameConf = Math.max(20, nameConf - 22);
    if (letterRatio < 0.4) nameConf = Math.max(20, nameConf - 12);
    // Pattern boost — D / A are highest-precision; C is fallback.
    if (pattern === 'D-sku' || pattern === 'A-qty-unit-desc-price') nameConf = Math.min(100, nameConf + 4);
    if (pattern === 'C-fallback') nameConf = Math.max(20, nameConf - 18);

    var qtyConf;
    if (row.qty == null) qtyConf = (pattern === 'C-fallback') ? 55 : 45;
    else if (!isFinite(row.qty) || row.qty < 0 || row.qty > 9999) qtyConf = 30;
    else qtyConf = Math.min(100, ocrConf + 6);

    var priceConf;
    if (row.lineTotal == null) priceConf = 25;
    else if (!isFinite(row.lineTotal) || row.lineTotal < 0) priceConf = 30;
    else {
      var hasDollar = /\$/.test(rawStr);
      var hasTwoDecimals = /\d\.\d{2}\b/.test(rawStr);
      priceConf = ocrConf + (hasDollar ? 4 : 0) + (hasTwoDecimals ? 4 : 0);
      priceConf = Math.min(100, priceConf);
    }

    return {
      name:     Math.round(nameConf),
      qty:      Math.round(qtyConf),
      price:    Math.round(priceConf),
      category: Math.round(ocrConf) // overwritten by categorize.js
    };
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
    // Wave 8.1 — repair common OCR digit confusions in numeric clusters
    // before pattern matching. Ensures "$48.OO" (Tesseract O→0 mis-read)
    // matches Pattern A/B/C/D regexes that require strict `\d{2}` decimals.
    line = repairOcrNumerics(line);

    var ocrConf = (typeof ocrConfidence === 'number') ? ocrConfidence : 60;

    // Helper: finalize a parsed row with kind + pack + per-field
    // confidence. Centralizes the post-pattern bookkeeping so each
    // pattern stays focused on its regex.
    function finalize(row, pattern) {
      row.pattern = pattern;
      row.kind = classifyKind(line);
      var pack = extractPack(line);
      if (pack) row.pack = pack;
      // Negative-extended on a credit row: flip the lineTotal sign so
      // math reconciliation sums correctly.
      if (row.kind === 'credit' && typeof row.lineTotal === 'number' && row.lineTotal > 0) {
        if (NEG_PRICE_RE.test(line)) row.lineTotal = -row.lineTotal;
      }
      row.fieldConf = scoreFields(row, line, ocrConf, pattern);
      // Roll-up confidence is min(name, qty, price) so the legacy
      // bulk-confirm filter still works. Category fills in later.
      row.confidence = Math.min(row.fieldConf.name, row.fieldConf.qty, row.fieldConf.price);
      return row;
    }

    // Pattern D — SKU-prefixed (Sysco-shaped):
    //   "10234  ROMAINE HEARTS 24CT  2  CS  $48.00"
    var m = line.match(/^#?(\d{4,8})\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+([a-zA-Z]+)\s+\$?(\d+(?:[.,]\d{2}))\s*$/);
    if (m && UNITS_RE.test(m[4])) {
      return finalize({
        name: cleanName(m[2]),
        sku: m[1],
        qty: normQty(m[3]),
        unit: normUnit(m[4]),
        unitPrice: null,
        lineTotal: normPrice(m[5]),
        raw: line
      }, 'D-sku');
    }

    // Pattern A — generic qty/unit/desc/price:
    //   "2 CS ROMAINE HEARTS 24CT $48.00"
    m = line.match(/^(\d+(?:[.,]\d+)?)\s+([a-zA-Z]+)\s+(.+?)\s+\$?(\d+(?:[.,]\d{2}))\s*$/);
    if (m && UNITS_RE.test(m[2])) {
      return finalize({
        name: cleanName(m[3]),
        sku: null,
        qty: normQty(m[1]),
        unit: normUnit(m[2]),
        unitPrice: null,
        lineTotal: normPrice(m[4]),
        raw: line
      }, 'A-qty-unit-desc-price');
    }

    // Pattern E — weight + count (US Foods-shaped):
    //   "GROUND CHUCK  10 LB  2 CT  $58.00"
    m = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(lb|lbs|oz|kg|g)\s+(\d+)\s*ct\s+\$?(\d+(?:\.\d{2}))\s*$/i);
    if (m) {
      return finalize({
        name: cleanName(m[1]),
        sku: null,
        qty: normQty(m[4]),
        unit: 'ct',
        weight: normQty(m[2]),
        weightUnit: normUnit(m[3]),
        unitPrice: null,
        lineTotal: normPrice(m[5]),
        raw: line
      }, 'E-weight-count');
    }

    // Pattern B — desc/qty/unit/price:
    //   "ROMAINE HEARTS 24CT  2 CS $48.00"
    m = line.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)?\s+\$?(\d+(?:[.,]\d{2}))\s*$/);
    if (m && (!m[3] || UNITS_RE.test(m[3]))) {
      return finalize({
        name: cleanName(m[1]),
        sku: null,
        qty: normQty(m[2]),
        unit: m[3] ? normUnit(m[3]) : 'ea',
        unitPrice: null,
        lineTotal: normPrice(m[4]),
        raw: line
      }, 'B-desc-qty-unit-price');
    }

    // Pattern C — fallback "<desc> $price":
    //   "WALK-IN MAINTENANCE  $125.00"
    m = line.match(/^(.+?)\s+\$?(\d+\.\d{2})\s*$/);
    if (m) {
      return finalize({
        name: cleanName(m[1]),
        sku: null,
        qty: 1,
        unit: 'ea',
        unitPrice: null,
        lineTotal: normPrice(m[2]),
        raw: line
      }, 'C-fallback');
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

  // Wave 1.3 — math reconciliation candidate generator.
  //
  // When line-sum disagrees with the printed total by more than 1¢,
  // try to propose ONE specific fix. Strategies, in order of
  // preference (highest signal first):
  //
  //   1. Single-row qty fix — does any row's lineTotal closely equal
  //      a multiple of its unitPrice that closes the delta?
  //   2. Single-row price digit-flip — does any row look like an
  //      OCR digit confusion (8↔0, 1↔7, 6↔5) where the alternative
  //      digit closes the delta within 1¢?
  //   3. Missing line — when the gap is positive and roughly equal
  //      to the median row total, suggest "we likely missed a line."
  //   4. Rounding only — when the absolute delta is ≤ rows × 0.05¢,
  //      it's just rounding; auto-correct can be offered.
  //
  // Returns `null` when no honest candidate exists; never invents.
  function suggestMathFix(rows, printedTotal) {
    if (!Array.isArray(rows) || !printedTotal || !isFinite(printedTotal)) return null;
    var sum = 0;
    rows.forEach(function (r) { sum += (r.lineTotal || 0); });
    sum = +sum.toFixed(2);
    var delta = +(printedTotal - sum).toFixed(2);
    if (Math.abs(delta) < 0.01) return null;

    // Rounding-only auto-correct candidate.
    if (Math.abs(delta) <= rows.length * 0.05) {
      return {
        kind: 'rounding',
        delta: delta,
        message: 'Likely rounding only — within ' + rows.length * 5 + '¢.'
      };
    }

    // Strategy 2: single-row digit-flip in the line total. Test every
    // row, every digit position, every common OCR confusion pair.
    var DIGIT_PAIRS = [['0','8'],['8','0'],['1','7'],['7','1'],['5','6'],['6','5'],['3','8'],['8','3'],['2','7'],['7','2']];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (typeof r.lineTotal !== 'number') continue;
      var s = r.lineTotal.toFixed(2);
      for (var p = 0; p < s.length; p++) {
        if (s[p] === '.') continue;
        for (var pair = 0; pair < DIGIT_PAIRS.length; pair++) {
          if (s[p] !== DIGIT_PAIRS[pair][0]) continue;
          var alt = s.slice(0, p) + DIGIT_PAIRS[pair][1] + s.slice(p + 1);
          var altVal = parseFloat(alt);
          if (!isFinite(altVal)) continue;
          var altSum = +(sum - r.lineTotal + altVal).toFixed(2);
          if (Math.abs(altSum - printedTotal) < 0.01) {
            return {
              kind: 'digit-flip',
              rowIdx: i,
              from: r.lineTotal,
              to: altVal,
              delta: delta,
              message: 'Line ' + (i + 1) + ' reads $' + s + ' — if it\'s $' + alt + ', the math balances.'
            };
          }
        }
      }
    }

    // Strategy 3: missing-line hint.
    if (delta > 0 && rows.length > 0) {
      var medianTotal = rows.map(function (r) { return r.lineTotal || 0; })
        .filter(function (v) { return v > 0; })
        .sort(function (a, b) { return a - b; })[Math.floor(rows.length / 2)] || 0;
      if (medianTotal > 0 && Math.abs(delta - medianTotal) / medianTotal < 0.5) {
        return {
          kind: 'missing-line',
          delta: delta,
          message: 'Sum is $' + delta.toFixed(2) + ' under printed total — likely one missed line near the bottom.'
        };
      }
    }

    return {
      kind: 'unknown',
      delta: delta,
      message: 'Math is off by $' + Math.abs(delta).toFixed(2) + '.'
    };
  }

  // Wave 8.1 — Multi-line description merger.
  //
  // Long product descriptions sometimes span two OCR rows because
  // the printed line wrapped on the invoice paper:
  //
  //   Row N    : "ROMAINE HEARTS GREEN"
  //   Row N+1  : "LEAF ORGANIC 24CT  2  CS  $48.00"
  //
  // The first row has no qty/price, so parseLine returns null and the
  // line is silently dropped; the second row's NAME ends up truncated
  // ("LEAF ORGANIC 24CT" instead of the full "ROMAINE HEARTS GREEN
  // LEAF ORGANIC 24CT"). Merger fixes this conservatively: a non-row
  // line that has letters and isn't a header gets held; the next
  // line that ends in a price gets the held text prepended to its name.
  //
  // Bail conditions:
  //   - Empty lines flush the pending buffer (lines aren't continuous).
  //   - Header lines flush.
  //   - Continuation lines >60 chars are rejected (likely a real row
  //     the parser failed on; we don't want to glue it onto something
  //     unrelated).
  //   - The pending buffer never grows beyond 3 segments.
  function endsWithPrice(s) {
    return /\$?\d+(?:[.,]\d{3})*[.,]\d{2}\s*$/.test(String(s || ''));
  }
  function mergeWrappedLines(lines) {
    if (!Array.isArray(lines)) return [];
    var out = [];
    var pendingText = '';
    var pendingConf = 100;
    var pendingSegments = 0;
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      var text = String(ln && ln.text || '').trim();
      var conf = (typeof ln.confidence === 'number') ? ln.confidence : 60;
      if (!text) {
        pendingText = '';
        pendingConf = 100;
        pendingSegments = 0;
        continue;
      }
      // A repaired version is what parseLine sees, so use it for the
      // ends-with-price probe.
      var repaired = repairOcrNumerics(text);
      var isRow = endsWithPrice(repaired);
      if (isRow) {
        if (pendingText) {
          out.push({
            text:       pendingText + ' ' + text,
            confidence: Math.min(pendingConf, conf),
            merged:     true
          });
          pendingText = '';
          pendingConf = 100;
          pendingSegments = 0;
        } else {
          out.push(ln);
        }
        continue;
      }
      // Not-a-row: candidate continuation if it has letters, isn't a
      // header, and is short enough to be a wrapped name.
      var hasLetters = /[a-záéíóúñ]/i.test(text);
      var isHeader   = HEADER_SKIP_RE.test(text);
      if (hasLetters && !isHeader && text.length <= 60 && pendingSegments < 3) {
        pendingText = pendingText ? (pendingText + ' ' + text) : text;
        if (conf < pendingConf) pendingConf = conf;
        pendingSegments++;
      } else {
        // Non-letter / header / too long → flush.
        pendingText = '';
        pendingConf = 100;
        pendingSegments = 0;
      }
    }
    return out;
  }

  // Top-level: parse an array of OCR lines into rows + meta.
  function parseLines(lines, fullText) {
    if (!Array.isArray(lines)) lines = [];
    // Wave 8.1 — merge wrapped descriptions before per-line parsing
    // so the second-row's price/qty doesn't become a row with a
    // truncated name.
    var merged = mergeWrappedLines(lines);
    var rows = [];
    merged.forEach(function (ln) {
      var row = parseLine(ln.text || '', ln.confidence);
      if (row) {
        if (ln.merged) row.merged = true;
        rows.push(row);
      }
    });
    deriveUnitPrices(rows);
    var meta = extractMeta(fullText || lines.map(function (l) { return l.text; }).join('\n'));
    // Item rows contribute fully; credits subtract; deposits/surcharges
    // add. The reconciliation only checks "do all rows sum to printed".
    var sumParsed = rows.reduce(function (a, r) { return a + (r.lineTotal || 0); }, 0);
    var deltaPct = (meta.totalParsed && sumParsed)
      ? Math.abs((sumParsed - meta.totalParsed) / meta.totalParsed) * 100
      : null;
    var capped = rows.slice(0, 200); // hard cap — anything past 200 is noise
    var mathFix = suggestMathFix(capped, meta.totalParsed);
    // Wave 1.5 — kind buckets so the UI can group items vs. credits
    // vs. deposits/surcharges without re-scanning rows.
    var kindCounts = { item: 0, credit: 0, deposit: 0, surcharge: 0, backorder: 0 };
    capped.forEach(function (r) {
      var k = r.kind || 'item';
      kindCounts[k] = (kindCounts[k] || 0) + 1;
    });
    return {
      rows: capped,
      vendor: meta.vendor,
      totalParsed: meta.totalParsed,
      sumParsed: +sumParsed.toFixed(2),
      deltaPct: deltaPct,
      mathFix: mathFix,
      kindCounts: kindCounts
    };
  }

  var api = {
    parseLine: parseLine,
    parseLines: parseLines,
    extractMeta: extractMeta,
    suggestMathFix: suggestMathFix,
    classifyKind: classifyKind,
    extractPack: extractPack,
    repairOcrNumerics: repairOcrNumerics,
    mergeWrappedLines: mergeWrappedLines,
    UNITS_RE: UNITS_RE
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_PARSE = api;
})(typeof window !== 'undefined' ? window : null);
