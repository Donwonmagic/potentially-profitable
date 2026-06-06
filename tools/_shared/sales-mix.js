/**
 * Shared sales-mix — turn a POS sales-mix export into real weekly covers.
 *
 * Plate frames "$X/week" only when it knows COVERS (units sold). A live POS
 * integration supplies that, but needs OAuth + a partner account. This is the
 * fallback that works with zero setup: paste or upload any POS sales-mix
 * export (CSV/TSV) and get real covers immediately — turning a theoretical
 * plate cost into actual food cost. Produces the same normalized shape a POS
 * adapter would, so everything downstream stays POS-agnostic.
 *
 * PARITY CONTRACT (canonical source). This module is the source of truth.
 * Muntin Ledger ships a behaviour-identical TypeScript port at
 * apps/api/src/lib/sales-mix.ts; the 8 vectors in sales-mix.test.mjs are
 * mirrored verbatim there (including the end-to-end CSV → covers →
 * plate-advice vector). Change one, change the other in the same change.
 *
 * Privacy posture: pure function. No fetch, no localStorage, no DOM. Money is
 * integer cents.
 */
(function (root) {
  'use strict';

  var HEADERS = {
    item:  ['item', 'menu item', 'name', 'product', 'dish', 'plu', 'item name', 'description'],
    units: ['units sold', 'units', 'qty', 'quantity', 'count', 'sold', 'items sold', 'qty sold'],
    sales: ['net sales', 'gross sales', 'sales', 'revenue', 'total', 'amount', 'net amount']
  };

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function toCents(s) {
    if (typeof s === 'number') return Math.round(s * 100);
    var n = parseFloat(String(s == null ? '' : s).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? Math.round(n * 100) : null;
  }
  function toNum(s) {
    if (typeof s === 'number') return s;
    var n = parseFloat(String(s == null ? '' : s).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : null;
  }

  function splitRows(text) {
    var lines = String(text == null ? '' : text).split(/\r\n|\r|\n/).filter(function (l) { return l.trim() !== ''; });
    if (!lines.length) return [];
    var delim = lines[0].indexOf('\t') !== -1 ? '\t' : ',';
    return lines.map(function (line) { return splitLine(line, delim); });
  }
  function splitLine(line, delim) {
    var out = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (ch === delim && !q) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map(function (c) { return c.trim(); });
  }

  function mapHeader(cells) {
    var map = { item: -1, units: -1, sales: -1 };
    cells.forEach(function (cell, i) {
      var n = norm(cell);
      Object.keys(HEADERS).forEach(function (field) {
        if (map[field] === -1 && HEADERS[field].indexOf(n) !== -1) map[field] = i;
      });
    });
    return map;
  }

  function parseSalesMixCsv(text) {
    var warnings = [];
    var grid = splitRows(text);
    if (!grid.length) return { rows: [], mapping: { item: -1, units: -1, sales: -1 }, warnings: ['Empty file.'] };
    var map = mapHeader(grid[0]);
    var headerDetected = map.item !== -1 && map.units !== -1;
    if (!headerDetected) {
      map = { item: 0, units: 1, sales: grid[0].length > 2 ? 2 : -1 };
      warnings.push('No header row recognized; assumed columns: item, units, sales.');
    }
    var start = headerDetected ? 1 : 0;
    var rows = [];
    for (var r = start; r < grid.length; r++) {
      var cells = grid[r];
      var item = (map.item >= 0 ? cells[map.item] : '') || '';
      item = String(item).trim();
      var units = toNum(map.units >= 0 ? cells[map.units] : null);
      if (!item || units == null || units <= 0) continue;
      rows.push({ item: item, unitsSold: units, grossSalesCents: (map.sales >= 0) ? (toCents(cells[map.sales]) || 0) : null });
    }
    if (!rows.length) warnings.push('No usable rows (need an item name and a positive units-sold value).');
    return { rows: rows, mapping: map, warnings: warnings };
  }

  function weeklyCovers(rows, opts) {
    opts = opts || {};
    var days = (typeof opts.periodDays === 'number' && opts.periodDays > 0) ? opts.periodDays : 7;
    var keyFn = (typeof opts.keyFn === 'function') ? opts.keyFn : function (item) { return item; };
    var out = {};
    (rows || []).forEach(function (row) {
      if (!row || !(row.unitsSold > 0)) return;
      var key = keyFn(row.item);
      var perWeek = row.unitsSold * 7 / days;
      out[key] = (out[key] || 0) + perWeek;
    });
    Object.keys(out).forEach(function (k) { out[k] = Math.round(out[k] * 10) / 10; });
    return out;
  }

  var api = {
    parseSalesMixCsv: parseSalesMixCsv,
    weeklyCovers: weeklyCovers,
    HEADERS: HEADERS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinSalesMix = api;
  if (root) root.MuntinSalesMix = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
