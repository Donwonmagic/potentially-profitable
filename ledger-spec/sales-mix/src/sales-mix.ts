/**
 * sales-mix.ts — CSV sales-mix → real covers (port of tools/_shared/sales-mix.js).
 *
 * PARITY CONTRACT: faithful translation; tests/sales-mix.test.ts is the
 * storefront suite verbatim. Pure, integer cents.
 *
 * Plate frames "$X/week" only when it knows COVERS (units sold). POS
 * integrations supply that live, but need OAuth + a partner account. This is
 * the fallback that ships day one: the operator uploads any POS sales-mix
 * export and Plate gets real covers immediately — turning theoretical cost into
 * actual food cost. Produces the SAME normalized shape a POS adapter would, so
 * everything downstream stays POS-agnostic.
 */

const HEADERS: Record<string, string[]> = {
  item: ['item', 'menu item', 'name', 'product', 'dish', 'plu', 'item name', 'description'],
  units: ['units sold', 'units', 'qty', 'quantity', 'count', 'sold', 'items sold', 'qty sold'],
  sales: ['net sales', 'gross sales', 'sales', 'revenue', 'total', 'amount', 'net amount'],
};

function norm(s: any): string { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function toCents(s: any): number | null {
  if (typeof s === 'number') return Math.round(s * 100);
  const n = parseFloat(String(s == null ? '' : s).replace(/[^0-9.\-]/g, ''));
  return isFinite(n) ? Math.round(n * 100) : null;
}
function toNum(s: any): number | null {
  if (typeof s === 'number') return s;
  const n = parseFloat(String(s == null ? '' : s).replace(/[^0-9.\-]/g, ''));
  return isFinite(n) ? n : null;
}

function splitRows(text: string): string[][] {
  const lines = String(text == null ? '' : text).split(/\r\n|\r|\n/).filter((l) => l.trim() !== '');
  if (!lines.length) return [];
  const delim = lines[0].indexOf('\t') !== -1 ? '\t' : ',';
  return lines.map((line) => splitLine(line, delim));
}
function splitLine(line: string, delim: string): string[] {
  const out: string[] = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (ch === delim && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function mapHeader(cells: string[]): { item: number; units: number; sales: number } {
  const map = { item: -1, units: -1, sales: -1 } as Record<string, number>;
  cells.forEach((cell, i) => {
    const n = norm(cell);
    Object.keys(HEADERS).forEach((field) => {
      if (map[field] === -1 && HEADERS[field].indexOf(n) !== -1) map[field] = i;
    });
  });
  return map as { item: number; units: number; sales: number };
}

export interface SalesMixRow { item: string; unitsSold: number; grossSalesCents: number | null; }
export interface ParseResult { rows: SalesMixRow[]; mapping: { item: number; units: number; sales: number }; warnings: string[]; }

export function parseSalesMixCsv(text: string, opts: Record<string, unknown> = {}): ParseResult {
  const warnings: string[] = [];
  const grid = splitRows(text);
  if (!grid.length) return { rows: [], mapping: { item: -1, units: -1, sales: -1 }, warnings: ['Empty file.'] };
  let map = mapHeader(grid[0]);
  const headerDetected = map.item !== -1 && map.units !== -1;
  if (!headerDetected) {
    map = { item: 0, units: 1, sales: grid[0].length > 2 ? 2 : -1 };
    warnings.push('No header row recognized; assumed columns: item, units, sales.');
  }
  const start = headerDetected ? 1 : 0;
  const rows: SalesMixRow[] = [];
  for (let r = start; r < grid.length; r++) {
    const cells = grid[r];
    let item = (map.item >= 0 ? cells[map.item] : '') || '';
    item = String(item).trim();
    const units = toNum(map.units >= 0 ? cells[map.units] : null);
    if (!item || units == null || units <= 0) continue;
    rows.push({ item, unitsSold: units, grossSalesCents: (map.sales >= 0) ? (toCents(cells[map.sales]) || 0) : null });
  }
  if (!rows.length) warnings.push('No usable rows (need an item name and a positive units-sold value).');
  return { rows, mapping: map, warnings };
}

export interface WeeklyCoversOpts { periodDays?: number; keyFn?: (item: string) => string; }

export function weeklyCovers(rows: SalesMixRow[] | null, opts: WeeklyCoversOpts = {}): Record<string, number> {
  const days = (typeof opts.periodDays === 'number' && opts.periodDays > 0) ? opts.periodDays : 7;
  const keyFn = (typeof opts.keyFn === 'function') ? opts.keyFn : (item: string) => item;
  const out: Record<string, number> = {};
  (rows || []).forEach((row) => {
    if (!row || !(row.unitsSold > 0)) return;
    const key = keyFn(row.item);
    const perWeek = row.unitsSold * 7 / days;
    out[key] = (out[key] || 0) + perWeek;
  });
  Object.keys(out).forEach((k) => { out[k] = Math.round(out[k] * 10) / 10; });
  return out;
}
