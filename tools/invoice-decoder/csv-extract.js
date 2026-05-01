/**
 * Invoice Decoder — CSV / TSV / XLSX ingest (Phase 7 W2-2).
 *
 * Restaurant Depot exports CSV directly from their member portal.
 * Sysco's "MarketPlace" portal ships CSV order-history. US Foods'
 * "Stratus" exports XLSX. These are zero-OCR paths — the columns
 * are already structured. Phase 6 W6-2 promised the chip, the
 * audit found it never shipped. This module wires it.
 *
 * Output shape matches MID_PARSE.parseLines so the caller hands
 * it through the existing render pipeline. Confidence: 99 unless
 * a header alias misses (single-field demotes to confidence 50
 * with a "field unmapped" hover for that row).
 *
 * Privacy posture:
 *   - CSV/TSV: vanilla quote-aware parser, ~70 lines, no
 *     dependency. Zero fetch.
 *   - XLSX: lazy-loads SheetJS (xlsx) from jsdelivr on first
 *     .xlsx tap (~400KB; cached after; zero cost when no Excel
 *     uploaded).
 *   - File never leaves the device. Same posture as PDF path.
 */
(function (root) {
  'use strict';

  // -------------------- Header alias map --------------------
  // EN + ES variants. Lower-cased + whitespace-collapsed at
  // lookup time so source headers can be any case / formatting.
  var HEADERS = {
    name: ['item', 'item name', 'description', 'product', 'product description', 'product name', 'sku description',
           'plato', 'producto', 'descripción', 'descripcion', 'nombre', 'descripcion del articulo'],
    sku:  ['sku', 'item code', 'item number', 'item #', 'product code', 'product id', 'prod id', 'supc', 'rd item',
           'codigo', 'código', 'codigo articulo', 'artículo', 'articulo', 'numero parte', 'núm parte'],
    qty:  ['qty', 'quantity', 'qty shipped', 'qty ordered', 'cases', 'pack qty', 'count',
           'cant', 'cantidad', 'cant.', 'piezas', 'cajas'],
    unit: ['unit', 'uom', 'unit of measure', 'pack', 'pack/size', 'size',
           'unidad', 'medida', 'empaque', 'presentacion', 'presentación'],
    unitPrice: ['unit price', 'price', 'price per unit', 'each', '$/unit',
                'precio unitario', 'precio', 'precio por unidad'],
    lineTotal: ['total', 'extended', 'extended price', 'amount', 'line total', 'ext price', 'ext',
                'total linea', 'total línea', 'importe', 'subtotal', 'monto']
  };

  function normHdr(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }

  // Map a row of header strings → { idxByField } that the row
  // walker uses to read each cell. Returns null if no fields
  // mapped (caller surfaces "couldn't find a header row").
  function mapHeaders(headerRow) {
    var idx = {};
    var hits = 0;
    headerRow.forEach(function (raw, i) {
      var h = normHdr(raw);
      for (var field in HEADERS) {
        if (idx[field] != null) continue;
        if (HEADERS[field].indexOf(h) !== -1) {
          idx[field] = i;
          hits++;
          break;
        }
      }
    });
    return hits >= 2 ? idx : null;
  }

  // -------------------- CSV / TSV parser --------------------
  // RFC 4180 friendly. Auto-detects delimiter from the first
  // ~500 chars (highest count among ',', '\t', ';' wins).
  function detectDelim(text) {
    var sample = String(text || '').slice(0, 500);
    var counts = { ',': 0, '\t': 0, ';': 0 };
    for (var i = 0; i < sample.length; i++) {
      var c = sample[i];
      if (counts[c] != null) counts[c]++;
    }
    var best = ',', bestN = -1;
    Object.keys(counts).forEach(function (k) {
      if (counts[k] > bestN) { best = k; bestN = counts[k]; }
    });
    return best;
  }

  function parseDelimited(text, delim) {
    var rows = [];
    var row = [];
    var cell = '';
    var inQuotes = false;
    var i = 0;
    while (i < text.length) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { cell += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        cell += c; i++; continue;
      }
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === delim) { row.push(cell); cell = ''; i++; continue; }
      if (c === '\n' || c === '\r') {
        row.push(cell); cell = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
        if (c === '\r' && text[i + 1] === '\n') i += 2; else i++;
        continue;
      }
      cell += c; i++;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  // -------------------- XLSX (SheetJS) --------------------
  // Wave 6.4 — load from same-origin via vendor-config. The pinned
  // vendor file is the @e965/xlsx fork at the same 0.20.3 version
  // (functionally identical to the legacy unscoped xlsx package);
  // we serve it under /assets/vendor/xlsx@0.20.3/xlsx.mjs.
  var __xlsxLoadPromise = null;
  function loadXlsx() {
    if (root.XLSX) return Promise.resolve(root.XLSX);
    if (__xlsxLoadPromise) return __xlsxLoadPromise;
    if (typeof root.MID_VENDORS_CFG === 'undefined' || !root.MID_VENDORS_CFG.importModule) {
      return Promise.reject(new Error('vendor-config module missing'));
    }
    __xlsxLoadPromise = (async function () {
      var mod = await root.MID_VENDORS_CFG.importModule('xlsx');
      var XLSX = mod && (mod.default || mod);
      if (!XLSX || !XLSX.read) {
        __xlsxLoadPromise = null;
        throw new Error('SheetJS loaded but read() missing');
      }
      root.XLSX = XLSX;
      return XLSX;
    })().catch(function (err) {
      __xlsxLoadPromise = null;
      throw new Error('Could not load Excel reader — check your network. (' + (err && err.message ? err.message : 'load failed') + ')');
    });
    return __xlsxLoadPromise;
  }

  // -------------------- Row → row converter --------------------
  // Reads a 2-D matrix (header row + data rows), returns the
  // shape MID_PARSE.parseLines emits so renderParsed can consume
  // directly.
  function matrixToParsedShape(matrix) {
    if (!matrix || matrix.length < 2) {
      return { rows: [], vendor: null, totalParsed: null, sumParsed: 0, deltaPct: null };
    }
    var headerRow = matrix[0];
    var idx = mapHeaders(headerRow);
    if (!idx) {
      return { rows: [], vendor: null, totalParsed: null, sumParsed: 0, deltaPct: null, _noHeaders: true };
    }
    var rows = [];
    for (var r = 1; r < matrix.length; r++) {
      var raw = matrix[r];
      if (!raw || raw.every(function (c) { return String(c || '').trim() === ''; })) continue;
      var name = idx.name != null ? String(raw[idx.name] || '').trim() : '';
      if (!name) continue;
      var qty = idx.qty != null ? parseFloat(String(raw[idx.qty] || '').replace(/[^0-9.\-]/g, '')) : null;
      if (!isFinite(qty)) qty = null;
      var unitPrice = idx.unitPrice != null ? parseFloat(String(raw[idx.unitPrice] || '').replace(/[^0-9.\-]/g, '')) : null;
      if (!isFinite(unitPrice)) unitPrice = null;
      var lineTotal = idx.lineTotal != null ? parseFloat(String(raw[idx.lineTotal] || '').replace(/[^0-9.\-]/g, '')) : null;
      if (!isFinite(lineTotal)) lineTotal = null;
      // Derive when only one of unitPrice/lineTotal is present.
      if (lineTotal == null && unitPrice != null && qty != null) lineTotal = +(unitPrice * qty).toFixed(2);
      if (unitPrice == null && lineTotal != null && qty != null && qty > 0) unitPrice = +(lineTotal / qty).toFixed(4);

      // Confidence is 99 when the core columns mapped; demotes
      // to 50 if name parsed but unit price + line total both
      // missing — invites operator review.
      var conf = 99;
      if (lineTotal == null && unitPrice == null) conf = 50;

      rows.push({
        name: name,
        sku: idx.sku != null ? String(raw[idx.sku] || '').trim() : null,
        qty: qty,
        unit: idx.unit != null ? String(raw[idx.unit] || '').trim() || 'ea' : 'ea',
        unitPrice: unitPrice,
        lineTotal: lineTotal,
        confidence: conf,
        raw: raw.join(' '),
        pattern: 'csv'
      });
    }
    var sumParsed = rows.reduce(function (a, r) { return a + (r.lineTotal || 0); }, 0);
    return {
      rows: rows.slice(0, 200),
      vendor: null,
      totalParsed: null,
      sumParsed: +sumParsed.toFixed(2),
      deltaPct: null
    };
  }

  // -------------------- Public entry --------------------
  function extractCsv(text) {
    var delim = detectDelim(text);
    var matrix = parseDelimited(text, delim);
    return matrixToParsedShape(matrix);
  }

  function extractXlsx(file) {
    return file.arrayBuffer().then(function (buf) {
      return loadXlsx().then(function (XLSX) {
        var wb = XLSX.read(buf, { type: 'array' });
        if (!wb.SheetNames || !wb.SheetNames.length) {
          return { rows: [], _noHeaders: true };
        }
        // Use first sheet. Distributor exports rarely have multi-
        // sheet workbooks; if they do, the operator can re-export.
        var sheet = wb.Sheets[wb.SheetNames[0]];
        var matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        return matrixToParsedShape(matrix);
      });
    });
  }

  function extractFile(file) {
    if (!file) return Promise.reject(new Error('file required'));
    var name = String(file.name || '').toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      return extractXlsx(file);
    }
    return file.text().then(function (text) {
      return extractCsv(text);
    });
  }

  function vendorHintFromFilename(name) {
    var n = String(name || '').toLowerCase();
    if (/sysco/.test(n)) return 'sysco';
    if (/us[\-_]?foods/.test(n)) return 'us-foods';
    if (/gfs|gordon[\-_]?food/.test(n)) return 'gfs';
    if (/restaurant[\-_]?depot|rdepot/.test(n)) return 'restaurant-depot';
    if (/shamrock/.test(n)) return 'shamrock';
    if (/sygma/.test(n)) return 'sygma';
    return null;
  }

  var api = {
    extractFile:               extractFile,
    extractCsv:                extractCsv,
    extractXlsx:               extractXlsx,
    vendorHintFromFilename:    vendorHintFromFilename,
    _detectDelim:              detectDelim,
    _parseDelimited:           parseDelimited,
    _mapHeaders:               mapHeaders,
    _matrixToParsedShape:      matrixToParsedShape
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_CSV_EXTRACT = api;
})(typeof window !== 'undefined' ? window : null);
