/**
 * Muntin — sales-mix → real covers (the CSV fallback adapter).
 *
 * Plate computes a *theoretical* plate cost and can only frame impact as
 * "$/week" when it knows COVERS (units sold). POS integrations (Square/
 * Toast/Clover) supply that live, but they need OAuth and a partner
 * account. This pure module is the fallback that ships day one: the
 * operator uploads a sales-mix export (units sold per item over a date
 * range) from any POS, and Plate gets real covers immediately — turning
 * theoretical cost into actual food cost and making the hero "$X/week"
 * number precise.
 *
 * It produces the SAME normalized shape a POS SalesMixAdapter would, so
 * everything downstream (plate-advice.js, dish-drift.js) is POS-agnostic.
 *
 * Pure, deterministic, no network, no LLM. Integer cents. Browser:
 * window.MuntinSalesMix. Node: module.exports.
 */
(function (root) {
  'use strict';

  // Column header synonyms → our fields. Lowercased, punctuation-stripped.
  var HEADERS = {
    item:  ['item', 'menu item', 'name', 'product', 'dish', 'plu', 'item name', 'description'],
    units: ['units sold', 'units', 'qty', 'quantity', 'count', 'sold', 'items sold', 'qty sold'],
    sales: ['net sales', 'gross sales', 'sales', 'revenue', 'total', 'amount', 'net amount']
  };

  function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
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

  // Minimal delimited-row split: tab if present, else comma; tolerates
  // simple double-quoted cells containing the delimiter.
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

  /**
   * parseSalesMixCsv(text, opts) -> { rows, mapping, warnings }.
   * rows: [{ item, unitsSold, grossSalesCents }]. Requires at least an
   * item column and a units column; sales is optional. Rows with no
   * item or non-positive units are skipped (with a warning count).
   */
  function parseSalesMixCsv(text, opts) {
    opts = opts || {};
    var warnings = [];
    var grid = splitRows(text);
    if (!grid.length) return { rows: [], mapping: { item: -1, units: -1, sales: -1 }, warnings: ['Empty file.'] };
    var map = mapHeader(grid[0]);
    var headerDetected = map.item !== -1 && map.units !== -1;
    if (!headerDetected) {
      // Fallback: assume col 0 = item, col 1 = units, col 2 = sales.
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
      rows.push({
        item: item,
        unitsSold: units,
        grossSalesCents: (map.sales >= 0) ? (toCents(cells[map.sales]) || 0) : null
      });
    }
    if (!rows.length) warnings.push('No usable rows (need an item name and a positive units-sold value).');
    return { rows: rows, mapping: map, warnings: warnings };
  }

  /**
   * weeklyCovers(rows, opts) -> { [itemKey]: coversPerWeek }.
   * Normalizes units sold over the export's period to a per-week rate, so
   * Plate's $/week is consistent regardless of whether the export covered
   * a week, two weeks, or a month. opts.periodDays defaults to 7.
   * itemKey is the raw item label unless opts.keyFn is provided (e.g. to
   * stem/match against recipe names).
   */
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
    // Round to a clean cover count.
    Object.keys(out).forEach(function (k) { out[k] = Math.round(out[k] * 10) / 10; });
    return out;
  }

  var api = {
    parseSalesMixCsv: parseSalesMixCsv,
    weeklyCovers: weeklyCovers,
    _toCents: toCents
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinSalesMix = api;
  if (root) root.MuntinSalesMix = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
