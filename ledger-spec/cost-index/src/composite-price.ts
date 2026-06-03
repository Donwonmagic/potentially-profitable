/**
 * composite-price.ts — Cost Index core (port of tools/_shared/composite-price.js).
 *
 * PARITY CONTRACT: faithful translation. The 9 vectors in
 * tests/composite-price.test.ts are copied from the storefront suite and must
 * pass unchanged. Keep both in lockstep.
 *
 * Separates LEVEL (anchored on the most delivered-relevant basis, p25–p75
 * range, indexes never contribute) from TREND (weighted-median rate-of-change
 * across sources). Never averages incommensurable bases. Pure, integer cents.
 */

export type Basis = 'delivered' | 'wholesale' | 'retail' | 'index';
export const DEFAULT_LEVEL_PRIORITY: Basis[] = ['delivered', 'wholesale', 'retail'];

export interface LevelObs { source: string; basis: Basis; valueCents: number; date?: string | null; weight?: number; }
export interface CompositeLevel {
  basis: Basis;
  medianCents: number;
  rangeCents: [number, number];
  nObs: number;
  nSources: number;
  provenance: { source: string; valueCents: number; date: string | null }[];
}
export interface TrendChange { source: string; pct: number; weight?: number; }
export interface CompositeTrend { pct: number | null; dir: 'up' | 'down' | 'flat'; agreement: number; nSources: number; }

export function median(values: number[]): number {
  if (!values.length) return 0;
  const s = values.slice().sort((a, b) => a - b);
  const n = s.length, mid = Math.floor(n / 2);
  return n % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const s = values.slice().sort((a, b) => a - b);
  if (s.length === 1) return s[0];
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

export function weightedMedian(pairs: { v: number; w: number }[]): number {
  const items = pairs.filter((p) => isFinite(p.v) && p.w > 0).sort((a, b) => a.v - b.v);
  if (!items.length) return 0;
  const total = items.reduce((s, p) => s + p.w, 0);
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += items[i].w;
    if (acc >= total / 2) return items[i].v;
  }
  return items[items.length - 1].v;
}

function distinct(arr: (string | null | undefined)[]): number {
  const seen: Record<string, 1> = {}; let n = 0;
  arr.forEach((x) => { if (x != null && !seen[x]) { seen[x] = 1; n++; } });
  return n;
}

export function compositeLevel(observations: LevelObs[], opts: { levelPriority?: Basis[] } = {}): CompositeLevel | null {
  const priority = opts.levelPriority || DEFAULT_LEVEL_PRIORITY;
  const byBasis: Record<string, LevelObs[]> = {};
  (observations || []).forEach((o) => {
    if (!o || o.basis === 'index') return;
    if (typeof o.valueCents !== 'number' || !isFinite(o.valueCents) || o.valueCents <= 0) return;
    (byBasis[o.basis] = byBasis[o.basis] || []).push(o);
  });
  for (let i = 0; i < priority.length; i++) {
    const basis = priority[i];
    const obs = byBasis[basis];
    if (obs && obs.length) {
      const vals = obs.map((o) => o.valueCents);
      return {
        basis,
        medianCents: Math.round(median(vals)),
        rangeCents: [Math.round(percentile(vals, 0.25)), Math.round(percentile(vals, 0.75))],
        nObs: obs.length,
        nSources: distinct(obs.map((o) => o.source)),
        provenance: obs.map((o) => ({ source: o.source, valueCents: o.valueCents, date: o.date || null })),
      };
    }
  }
  return null;
}

export function windowChange(values: number[]): number | null {
  const v = (values || []).filter((x) => typeof x === 'number' && isFinite(x));
  if (v.length < 2) return null;
  const first = v[0], last = v[v.length - 1];
  if (first <= 0) return null;
  return (last - first) / first;
}

export function blendTrend(changes: TrendChange[]): CompositeTrend {
  const valid = (changes || []).filter((c) => c && typeof c.pct === 'number' && isFinite(c.pct));
  if (!valid.length) return { pct: null, dir: 'flat', agreement: 0, nSources: 0 };
  const pct = weightedMedian(valid.map((c) => ({ v: c.pct, w: (c.weight && c.weight > 0 ? c.weight : 1) })));
  const FLAT = 0.005;
  const dir: CompositeTrend['dir'] = pct > FLAT ? 'up' : pct < -FLAT ? 'down' : 'flat';
  const sameDir = valid.filter((c) => {
    const d = c.pct > FLAT ? 'up' : c.pct < -FLAT ? 'down' : 'flat';
    return d === dir;
  }).length;
  return { pct, dir, agreement: +(sameDir / valid.length).toFixed(3), nSources: distinct(valid.map((c) => c.source)) };
}

function confidenceFor(level: CompositeLevel | null, trend: CompositeTrend): 'high' | 'medium' | 'low' | 'directional' {
  const nLvl = level ? level.nSources : 0;
  const nTrd = trend ? trend.nSources : 0;
  const agree = trend ? trend.agreement : 0;
  if (!level && nTrd >= 2 && agree >= 0.66) return 'directional';
  if (nLvl >= 2 && nTrd >= 3 && agree >= 0.75) return 'high';
  if (nLvl >= 1 && nTrd >= 2 && agree >= 0.6) return 'medium';
  return 'low';
}

function fmtPct(p: number): string { return (p >= 0 ? '+' : '') + (p * 100).toFixed(1).replace(/\.0$/, '') + '%'; }
function dollars(c: number): string { return '$' + (Math.round(c) / 100).toFixed(2); }

export interface SourceSeries { basis: Basis; values: number[]; weight?: number; }
export interface AssessInput { levelObs?: LevelObs[]; sourceSeries?: Record<string, SourceSeries>; asOf?: string | null; opts?: { levelPriority?: Basis[] }; }
export interface AssessResult {
  level: CompositeLevel | null;
  trend: CompositeTrend;
  confidence: 'high' | 'medium' | 'low' | 'directional';
  asOf: string | null;
  label: string;
  provenance: any[];
}

export function assess(input: AssessInput): AssessResult {
  input = input || {};
  const opts = input.opts || {};
  const level = compositeLevel(input.levelObs || [], opts);
  const series = input.sourceSeries || {};
  const changes: TrendChange[] = Object.keys(series).map((src) => {
    const s = series[src] || ({} as SourceSeries);
    const pct = windowChange(s.values);
    return pct == null ? null : { source: src, pct, weight: s.weight };
  }).filter(Boolean) as TrendChange[];
  const trend = blendTrend(changes);
  const confidence = confidenceFor(level, trend);

  const provenance: any[] = [];
  if (level) level.provenance.forEach((p) => provenance.push({ kind: 'level', source: p.source, valueCents: p.valueCents, date: p.date }));
  Object.keys(series).forEach((src) => provenance.push({ kind: 'trend', source: src, basis: series[src].basis }));

  let label: string;
  const dirWord = trend.dir === 'up' ? 'up' : trend.dir === 'down' ? 'down' : 'flat';
  if (level && trend.pct != null) {
    label = 'About ' + dollars(level.rangeCents[0]) + '–' + dollars(level.rangeCents[1]) +
      ' (' + level.basis + ' reference), ' + dirWord + ' ' + fmtPct(trend.pct) + ' over the window. ' +
      level.nSources + '+ sources for level, ' + trend.nSources + ' for trend.';
  } else if (trend.pct != null) {
    label = 'Directional only — no comparable price level. The market moved ' + dirWord + ' ' +
      fmtPct(trend.pct) + ' across ' + trend.nSources + ' source(s).';
  } else if (level) {
    label = 'About ' + dollars(level.rangeCents[0]) + '–' + dollars(level.rangeCents[1]) +
      ' (' + level.basis + ' reference). Not enough history yet for a trend.';
  } else {
    label = 'Not enough data yet.';
  }

  return { level, trend, confidence, asOf: input.asOf || null, label, provenance };
}
