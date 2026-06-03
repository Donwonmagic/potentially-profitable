/**
 * observation-quality.ts — the garbage-in defense (port of
 * tools/_shared/observation-quality.js). Runs on EVERY inbound observation
 * before the composite engine. Bad data LOWERS CONFIDENCE, never silently
 * corrupts a confident number:
 *   - clearly wrong (unit mismatch, backward date, non-positive, wildly out
 *     of band) → REJECT (source contributes nothing; engine self-degrades).
 *   - merely suspect (mildly out of band, statistical outlier) → KEEP +
 *     down-weight (participates, can't dominate).
 *   - real-but-old → STALE (excluded from LEVEL, still feeds TREND).
 * unit_mismatch is the one hard reject that is wrong, not uncertain.
 *
 * PARITY CONTRACT: faithful translation; tests/observation-quality.test.ts is
 * the storefront suite verbatim. Pure, integer cents.
 */

import type { Basis } from './composite-price.js';

export interface QualityObs { source: string; basis: Basis; valueCents?: number; value?: number; unit?: string; date: string; }
export interface QualityCtx {
  bounds?: { minCents: number; maxCents: number };
  expectedUnit?: string;
  prevDate?: string;
  asOf?: string;
  maxAgeDays?: number;
  history?: number[];
  hardBandFactor?: number;
}
export interface QualityResult { ok: boolean; weight: number; levelEligible: boolean; flags: string[]; }

export function median(values: number[]): number {
  if (!values.length) return 0;
  const s = values.slice().sort((a, b) => a - b);
  const n = s.length, mid = Math.floor(n / 2);
  return n % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function robustZ(value: number, history?: number[]): number {
  const h = (history || []).filter((v) => typeof v === 'number' && isFinite(v));
  if (h.length < 4) return 0;
  const med = median(h);
  const mad = median(h.map((v) => Math.abs(v - med)));
  if (mad === 0) return 0;
  return Math.abs(value - med) / (1.4826 * mad);
}

function dayDiff(a: string, b: string): number | null {
  const ta = Date.parse(a + 'T00:00:00Z'), tb = Date.parse(b + 'T00:00:00Z');
  if (isNaN(ta) || isNaN(tb)) return null;
  return Math.round((tb - ta) / 86400000);
}

export function validateObservation(obs: QualityObs, ctx: QualityCtx = {}): QualityResult {
  const flags: string[] = [];
  let weight = 1;
  let levelEligible = !!obs && obs.basis !== 'index';

  if (!obs || !obs.date) return { ok: false, weight: 0, levelEligible: false, flags: ['no-date'] };

  // (1) Unit mismatch — hard reject (wrong, not uncertain).
  if (ctx.expectedUnit && obs.unit && String(obs.unit) !== String(ctx.expectedUnit)) {
    return { ok: false, weight: 0, levelEligible: false, flags: ['unit_mismatch'] };
  }

  // (2) Date must advance.
  if (ctx.prevDate) {
    const d = dayDiff(ctx.prevDate, obs.date);
    if (d != null && d < 0) return { ok: false, weight: 0, levelEligible: false, flags: ['date_backward'] };
  }

  if (obs.basis !== 'index') {
    if (typeof obs.valueCents !== 'number' || !isFinite(obs.valueCents) || obs.valueCents <= 0) {
      return { ok: false, weight: 0, levelEligible: false, flags: ['nonpositive'] };
    }
    if (ctx.bounds && typeof ctx.bounds.minCents === 'number' && typeof ctx.bounds.maxCents === 'number') {
      const lo = ctx.bounds.minCents, hi = ctx.bounds.maxCents;
      const f = ctx.hardBandFactor || 2;
      if (obs.valueCents < lo / f || obs.valueCents > hi * f) {
        return { ok: false, weight: 0, levelEligible: false, flags: ['implausible_hard'] };
      }
      if (obs.valueCents < lo || obs.valueCents > hi) { weight *= 0.4; flags.push('out_of_band'); }
    }
  }

  // (4) Staleness.
  if (ctx.asOf && ctx.maxAgeDays) {
    const age = dayDiff(obs.date, ctx.asOf);
    if (age != null && age > ctx.maxAgeDays) { levelEligible = false; flags.push('stale'); }
  }

  // (5) Statistical outlier vs the source's own history → down-weight, never drop.
  const val = (obs.basis === 'index') ? (obs.value as number) : (obs.valueCents as number);
  const z = robustZ(val, ctx.history);
  if (z >= 3.5) { weight *= 0.5; flags.push('outlier'); }

  return { ok: true, weight: +weight.toFixed(3), levelEligible, flags };
}

export interface ScreenResult { kept: any[]; rejected: { obs: QualityObs; flags: string[] }[]; sourceWeight: Record<string, number>; }

export function screen(observations: QualityObs[], ctxFor: QualityCtx | ((o: QualityObs) => QualityCtx)): ScreenResult {
  const kept: any[] = [], rejected: ScreenResult['rejected'] = [], sourceWeight: Record<string, number> = {};
  (observations || []).forEach((obs) => {
    const ctx = (typeof ctxFor === 'function') ? ctxFor(obs) : (ctxFor || {});
    const v = validateObservation(obs, ctx);
    if (!v.ok) { rejected.push({ obs, flags: v.flags }); return; }
    const tagged: any = {};
    for (const k in obs) if (Object.prototype.hasOwnProperty.call(obs, k)) tagged[k] = (obs as any)[k];
    tagged._levelEligible = v.levelEligible;
    tagged._weight = v.weight;
    kept.push(tagged);
    const s = obs.source;
    sourceWeight[s] = (sourceWeight[s] == null) ? v.weight : Math.min(sourceWeight[s], v.weight);
  });
  return { kept, rejected, sourceWeight };
}
