/**
 * cost-index-sources.ts — PURE source normalizers (port of
 * tools/_shared/cost-index-sources.js). Translates raw FRED / BLS / USDA AMS
 * payloads into the one shape the composite engine consumes, separating the
 * pure normalize*() (fixture-testable) from the impure fetch (fetch-sources.ts,
 * the worker). A source changing its JSON shape is caught by a fixture test
 * here, never silently poisoning the index.
 *
 * PARITY CONTRACT: faithful translation; tests/cost-index-sources.test.ts is
 * the storefront suite verbatim.
 *
 * Adapter output: { source, basis, unit, points:[{date,value}] } (oldest→newest).
 */

import type { Basis, LevelObs } from './composite-price.js';

export interface Point { date: string; value: number; }
export interface AdapterOutput { source: string; basis: Basis; unit: string; points: Point[]; weight?: number; }
export interface AdapterMeta { source?: string; basis?: Basis; unit?: string; dateField?: string; reducer?: string; fields?: Record<string, string>; }

function byDate(a: Point, b: Point): number { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }

export function isoDate(d?: string | null): string | null {
  if (!d) return null;
  const s = String(d).trim();
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return ymd[1] + '-' + ymd[2] + '-' + ymd[3];
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdy) return mdy[3] + '-' + ('0' + mdy[1]).slice(-2) + '-' + ('0' + mdy[2]).slice(-2);
  return null;
}

export function normalizeFred(json: any, meta: AdapterMeta = {}): AdapterOutput {
  const obs = (json && json.observations) || [];
  const points = obs.map((o: any) => {
    const v = (o.value === '.' || o.value == null) ? null : parseFloat(o.value);
    const date = isoDate(o.date);
    return (date && v != null && isFinite(v)) ? { date, value: v } : null;
  }).filter(Boolean).sort(byDate) as Point[];
  return { source: meta.source || 'fred', basis: meta.basis || 'index', unit: meta.unit || 'index', points };
}

export function normalizeBls(json: any, meta: AdapterMeta = {}): AdapterOutput {
  const series = json && json.Results && json.Results.series && json.Results.series[0];
  const data = (series && series.data) || [];
  const points = data.map((d: any) => {
    if (!d || !d.period || d.period[0] !== 'M' || d.period === 'M13') return null;
    const mm = d.period.slice(1);
    const v = parseFloat(d.value);
    return isFinite(v) ? { date: d.year + '-' + mm + '-01', value: v } : null;
  }).filter(Boolean).sort(byDate) as Point[];
  return { source: meta.source || 'bls', basis: meta.basis || 'index', unit: meta.unit || 'index', points };
}

function num(s: any): number | null {
  if (typeof s === 'number') return isFinite(s) ? s : null;
  if (s == null) return null;
  const n = parseFloat(String(s).replace(/[^0-9.\-]/g, ''));
  return isFinite(n) ? n : null;
}

export function reduceAmsRow(row: any, reducer?: string, fields: Record<string, string> = {}): number | null {
  if (!row) return null;
  reducer = reducer || 'single';
  if (reducer === 'mostlyMid') {
    const ml = num(row[fields.mostlyLow || 'mostly_low']);
    const mh = num(row[fields.mostlyHigh || 'mostly_high']);
    if (ml != null && mh != null) return (ml + mh) / 2;
    const lo = num(row[fields.low || 'low_price']);
    const hi = num(row[fields.high || 'high_price']);
    if (lo != null && hi != null) return (lo + hi) / 2;
    return null;
  }
  if (reducer === 'valuePerPound') {
    const d = num(row[fields.dollars || 'dollars']);
    const p = num(row[fields.pounds || 'pounds']);
    return (d != null && p != null && p > 0) ? d / p : null;
  }
  return num(row[fields.price || 'avg_price']);
}

export function normalizeAms(json: any, meta: AdapterMeta = {}): AdapterOutput {
  const rows = (json && (json.results || json.report || json.data)) || [];
  const dateField = meta.dateField || 'report_date';
  const points = rows.map((r: any) => {
    if (!r) return null;
    const v = reduceAmsRow(r, meta.reducer, meta.fields);
    const date = isoDate(r[dateField]);
    return (date && v != null && isFinite(v)) ? { date, value: v } : null;
  }).filter(Boolean).sort(byDate) as Point[];
  return { source: meta.source || 'usda-ams', basis: meta.basis || 'wholesale', unit: meta.unit || 'usd', points };
}

function latestDate(outputs: AdapterOutput[]): string | null {
  let d: string | null = null;
  (outputs || []).forEach((o) => {
    ((o && o.points) || []).forEach((p) => { if (!d || p.date > d) d = p.date; });
  });
  return d;
}

export interface CompositeInput { levelObs: LevelObs[]; sourceSeries: Record<string, { basis: Basis; values: number[]; weight?: number }>; asOf: string | null; }

export function buildCompositeInput(outputs: AdapterOutput[], opts: { asOf?: string } = {}): CompositeInput {
  const sourceSeries: CompositeInput['sourceSeries'] = {};
  const levelObs: LevelObs[] = [];
  (outputs || []).forEach((o) => {
    if (!o || !Array.isArray(o.points) || !o.points.length) return;
    sourceSeries[o.source] = { basis: o.basis, values: o.points.map((p) => p.value), weight: o.weight };
    if (o.basis !== 'index') {
      const latest = o.points[o.points.length - 1];
      levelObs.push({ source: o.source, basis: o.basis, valueCents: Math.round(latest.value * 100), date: latest.date });
    }
  });
  return { levelObs, sourceSeries, asOf: opts.asOf || latestDate(outputs) };
}
