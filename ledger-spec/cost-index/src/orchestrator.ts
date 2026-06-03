/**
 * orchestrator.ts — the Cost Index cron worker (Pod B).
 *
 * ONE Cloudflare cron worker, multiple cron strings dispatched by event.cron
 * (daily/weekly/monthly) so a monthly series is never fetched hourly. Per run:
 *   1. fan out to the source fetchers via Promise.allSettled — one source
 *      dying can't kill the run.
 *   2. per ingredient: screen() the observations (observation-quality), build
 *      the composite input, assess() → one Cost Index point with provenance,
 *      confidence, and an honest label.
 *   3. write the artifact to R2 (latest.json + dated snapshot for rollback).
 *
 * THE CARDINAL RULE: a stale / broken / breaker-open source contributes
 * NOTHING — it is omitted from levelObs/sourceSeries, never carried-forward
 * or fabricated. The engine's confidence then steps high→medium→low→
 * directional on its own and the range widens organically. A zero-point run
 * keeps the last-good artifact + raises an alert (last-good with a staleness
 * badge beats blank).
 *
 * KV = control plane (etag/last-modified/breaker/fail-count). R2 = data plane
 * (raw/, series/, artifact/cost-index.json, artifact/history/<date>). No Neon,
 * no Durable Objects in v1.
 */

import { fetchFred, fetchBls, fetchAms, type FetchEnv, type FetchOutcome } from './fetch-sources.js';
import { buildCompositeInput, type AdapterOutput } from './cost-index-sources.js';
import { screen, type QualityObs, type QualityCtx } from './observation-quality.js';
import { assess, type AssessResult, type LevelObs } from './composite-price.js';

// Shapes of the two config files (storefront data/, copied into the worker at
// build): cost-index-sources.json (the mapping) + cost-index-bounds.json.
export interface SourceMapEntry {
  verified: boolean;
  ams?: { reportId: string; commodity?: string; market?: string; reducer?: string };
  bls?: { seriesId: string };
  fred?: { seriesId: string; basis?: 'index' | 'retail' | 'wholesale' };
  noaa?: { species: string };
}
export interface SourceMap { ingredients: Record<string, SourceMapEntry>; }
export interface BoundsMap { bounds: Record<string, { minCents: number; maxCents: number; unit: string }>; }

export interface CostIndexPoint {
  ingredient: string;
  asOf: string | null;
  level: AssessResult['level'];
  trend: AssessResult['trend'];
  confidence: AssessResult['confidence'];
  label: string;
  provenance: any[];
  freshness: 'fresh' | 'stale' | 'last-good';
  contributingSources: string[];
}
export interface CostIndexArtifact { generatedAt: string; points: Record<string, CostIndexPoint>; }

export interface OrchestratorEnv extends FetchEnv {
  sourceMap: SourceMap;
  bounds: BoundsMap;
  putArtifact: (key: string, body: string) => Promise<void>;   // R2
  getLastGood: () => Promise<CostIndexArtifact | null>;
  alert: (msg: string) => Promise<void>;
  maxAgeDays?: number;   // staleness window for LEVEL eligibility (default 28)
}

// Fetch every configured, VERIFIED source for one ingredient. Unverified
// entries (verified:false) are skipped — nothing renders behind the fact gate
// until a source id is confirmed against the live discovery endpoint.
async function fetchIngredient(env: OrchestratorEnv, ingredient: string, entry: SourceMapEntry): Promise<AdapterOutput[]> {
  if (!entry.verified) return [];
  const jobs: Promise<FetchOutcome>[] = [];
  if (entry.ams) jobs.push(fetchAms(env, `${ingredient}:ams`, entry.ams.reportId, { reducer: entry.ams.reducer, basis: 'wholesale' }));
  if (entry.bls) jobs.push(fetchBls(env, `${ingredient}:bls`, entry.bls.seriesId, { basis: 'index' }));
  if (entry.fred) jobs.push(fetchFred(env, `${ingredient}:fred`, entry.fred.seriesId, { basis: entry.fred.basis || 'index' }));
  const settled = await Promise.allSettled(jobs);
  const outputs: AdapterOutput[] = [];
  for (const s of settled) {
    if (s.status === 'fulfilled' && s.value.output) outputs.push(s.value.output);
    // rejected / not-modified / skipped / error → contributes nothing (cardinal rule).
  }
  return outputs;
}

function toQualityObs(outputs: AdapterOutput[]): QualityObs[] {
  // The LEVEL-eligible latest point per non-index source, plus index points
  // carry no value — they're vetted only for date/unit. We screen the latest
  // observation of each source (the one that could anchor a level).
  const obs: QualityObs[] = [];
  for (const o of outputs) {
    if (!o.points.length) continue;
    const latest = o.points[o.points.length - 1];
    obs.push({
      source: o.source,
      basis: o.basis,
      valueCents: o.basis === 'index' ? undefined : Math.round(latest.value * 100),
      value: o.basis === 'index' ? latest.value : undefined,
      unit: o.unit,
      date: latest.date,
    });
  }
  return obs;
}

export async function composeIngredient(env: OrchestratorEnv, ingredient: string, entry: SourceMapEntry): Promise<CostIndexPoint | null> {
  const outputs = await fetchIngredient(env, ingredient, entry);
  if (!outputs.length) return null;

  // Quality gate: bounds-aware screen. Rejected sources drop out; suspect ones
  // are down-weighted and their series weight is dragged down.
  const bound = env.bounds.bounds[ingredient];
  const obs = toQualityObs(outputs);
  const ctxFor: QualityCtx = {
    bounds: bound ? { minCents: bound.minCents, maxCents: bound.maxCents } : undefined,
    asOf: undefined, maxAgeDays: env.maxAgeDays ?? 28,
  };
  const screened = screen(obs, ctxFor);
  const okSources = new Set(screened.kept.map((k) => k.source));

  // Keep only sources that survived screening; apply their dragged weight to
  // the trend blend. Drop a rejected source's whole series (cardinal rule).
  const kept = outputs.filter((o) => okSources.has(o.source)).map((o) => ({ ...o, weight: screened.sourceWeight[o.source] }));
  if (!kept.length) return null;

  const input = buildCompositeInput(kept);
  // LEVEL eligibility from the quality gate (stale → not eligible): drop level
  // obs whose source the screen marked level-ineligible.
  const eligible = new Set(screened.kept.filter((k) => k._levelEligible).map((k) => k.source));
  input.levelObs = input.levelObs.filter((l: LevelObs) => eligible.has(l.source));

  const result = assess(input);
  return {
    ingredient,
    asOf: result.asOf,
    level: result.level,
    trend: result.trend,
    confidence: result.confidence,
    label: result.label,
    provenance: result.provenance,
    freshness: 'fresh',
    contributingSources: kept.map((o) => o.source),
  };
}

/** The cron entry point. cadence ∈ 'daily'|'weekly'|'monthly' (from event.cron). */
export async function runCostIndex(env: OrchestratorEnv): Promise<CostIndexArtifact> {
  const points: Record<string, CostIndexPoint> = {};
  const ingredients = Object.keys(env.sourceMap.ingredients);
  const settled = await Promise.allSettled(
    ingredients.map(async (ing) => ({ ing, point: await composeIngredient(env, ing, env.sourceMap.ingredients[ing]) })),
  );
  for (const s of settled) {
    if (s.status === 'fulfilled' && s.value.point) points[s.value.ing] = s.value.point;
  }

  // Zero-point run → keep last-good with a staleness badge, alert. Never blank.
  if (Object.keys(points).length === 0) {
    const lastGood = await env.getLastGood();
    await env.alert('cost-index: zero points this run — serving last-good with staleness badge');
    if (lastGood) {
      for (const k of Object.keys(lastGood.points)) lastGood.points[k] = { ...lastGood.points[k], freshness: 'last-good' };
      return lastGood;
    }
  }

  const artifact: CostIndexArtifact = { generatedAt: new Date().toISOString(), points };
  const body = JSON.stringify(artifact);
  await env.putArtifact('artifact/cost-index.json', body);                                  // latest
  await env.putArtifact(`artifact/history/${new Date().toISOString().slice(0, 10)}.json`, body); // rollback snapshot
  return artifact;
}
