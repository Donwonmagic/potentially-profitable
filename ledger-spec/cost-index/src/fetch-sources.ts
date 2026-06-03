/**
 * fetch-sources.ts — IMPURE source fetchers (Pod A). The network half that the
 * pure normalizers (cost-index-sources.ts) deliberately don't touch. Each
 * fetcher: applies the source's auth + cadence, sends conditional requests
 * (If-None-Match / If-Modified-Since), retries transient classes only with
 * jittered backoff, and hands the raw payload to its normalizer. A 200 that
 * fails the normalizer contract is POISON, not a blip — it is never retried.
 *
 * Runs in the Cloudflare cron worker (orchestrator.ts). Secrets come from
 * Worker env bindings; per-source ETag/Last-Modified live in KV.
 *
 * Cadence (matched to real publish frequency — never poll a monthly series
 * hourly): USDA AMS daily; BLS monthly; FRED mostly monthly; NOAA annual.
 */

import { normalizeFred, normalizeBls, normalizeAms, type AdapterOutput, type AdapterMeta } from './cost-index-sources.js';

export interface SourceSecrets { AMS_KEY?: string; BLS_KEY?: string; FRED_KEY?: string; }
export interface CondCache { etag?: string; lastModified?: string; }
export interface FetchEnv {
  secrets: SourceSecrets;
  /** read/write the per-source conditional-request cache (KV-backed). */
  getCond: (sourceId: string) => Promise<CondCache | null>;
  setCond: (sourceId: string, c: CondCache) => Promise<void>;
  /** circuit-breaker state (KV). open=true short-circuits the fetch. */
  breakerOpen: (sourceId: string) => Promise<boolean>;
  recordResult: (sourceId: string, ok: boolean) => Promise<void>;
  /** optional injected fetch for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

export interface FetchOutcome { sourceId: string; output: AdapterOutput | null; status: 'ok' | 'not-modified' | 'skipped' | 'error'; reason?: string; }

const TRANSIENT = new Set([408, 425, 429, 500, 502, 503, 504]);

async function backoff(attempt: number): Promise<void> {
  const base = 500 * Math.pow(2, attempt);          // 0.5s, 1s, 2s
  const jitter = Math.floor(Math.random() * 250);
  await new Promise((r) => setTimeout(r, base + jitter));
}

/**
 * conditionalGet — one source request with ETag/Last-Modified + bounded retry
 * on transient classes only. Returns { json, status:'ok'|'not-modified' }.
 * A non-transient non-2xx (or a contract failure upstream) is a hard error.
 */
async function conditionalGet(
  env: FetchEnv, sourceId: string, url: string, headers: Record<string, string> = {},
): Promise<{ json: any; status: 'ok' | 'not-modified' }> {
  const doFetch = env.fetchImpl || fetch;
  const cond = (await env.getCond(sourceId)) || {};
  const h: Record<string, string> = { ...headers };
  if (cond.etag) h['If-None-Match'] = cond.etag;
  if (cond.lastModified) h['If-Modified-Since'] = cond.lastModified;

  let lastErr = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await backoff(attempt - 1);
    const res = await doFetch(url, { headers: h, signal: env.signal });
    if (res.status === 304) return { json: null, status: 'not-modified' };
    if (res.ok) {
      const etag = res.headers.get('etag') || undefined;
      const lastModified = res.headers.get('last-modified') || undefined;
      if (etag || lastModified) await env.setCond(sourceId, { etag, lastModified });
      return { json: await res.json(), status: 'ok' };
    }
    lastErr = 'HTTP ' + res.status;
    if (!TRANSIENT.has(res.status)) break;   // non-transient → don't retry
  }
  throw new Error(lastErr || 'fetch failed');
}

/** Wrap a fetcher with the breaker + result recording (Pod B reliability). */
async function guarded(env: FetchEnv, sourceId: string, run: () => Promise<FetchOutcome>): Promise<FetchOutcome> {
  if (await env.breakerOpen(sourceId)) return { sourceId, output: null, status: 'skipped', reason: 'breaker-open' };
  try {
    const out = await run();
    await env.recordResult(sourceId, out.status === 'ok' || out.status === 'not-modified');
    return out;
  } catch (e: any) {
    await env.recordResult(sourceId, false);
    return { sourceId, output: null, status: 'error', reason: String(e?.message || e) };
  }
}

// ---- FRED: https://api.stlouisfed.org/fred/series/observations -----------
export function fetchFred(env: FetchEnv, sourceId: string, seriesId: string, meta: AdapterMeta = {}): Promise<FetchOutcome> {
  return guarded(env, sourceId, async () => {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(seriesId)}&file_type=json&api_key=${env.secrets.FRED_KEY || ''}`;
    const { json, status } = await conditionalGet(env, sourceId, url);
    if (status === 'not-modified') return { sourceId, output: null, status: 'not-modified' };
    return { sourceId, output: normalizeFred(json, { source: sourceId, ...meta }), status: 'ok' };
  });
}

// ---- BLS v2: https://api.bls.gov/publicAPI/v2/timeseries/data/ (POST) -----
export function fetchBls(env: FetchEnv, sourceId: string, seriesId: string, meta: AdapterMeta = {}): Promise<FetchOutcome> {
  return guarded(env, sourceId, async () => {
    const doFetch = env.fetchImpl || fetch;
    const res = await doFetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesid: [seriesId], registrationkey: env.secrets.BLS_KEY }),
      signal: env.signal,
    });
    if (!res.ok) throw new Error('BLS HTTP ' + res.status);
    return { sourceId, output: normalizeBls(await res.json(), { source: sourceId, ...meta }), status: 'ok' };
  });
}

// ---- USDA AMS Market News: https://marsapi.ams.usda.gov (Basic auth) ------
export function fetchAms(env: FetchEnv, sourceId: string, reportId: string, meta: AdapterMeta = {}): Promise<FetchOutcome> {
  return guarded(env, sourceId, async () => {
    const url = `https://marsapi.ams.usda.gov/services/v1.2/reports/${encodeURIComponent(reportId)}`;
    const auth = 'Basic ' + btoa((env.secrets.AMS_KEY || '') + ':');   // AMS uses key as Basic-auth username, empty password
    const { json, status } = await conditionalGet(env, sourceId, url, { Authorization: auth });
    if (status === 'not-modified') return { sourceId, output: null, status: 'not-modified' };
    return { sourceId, output: normalizeAms(json, { source: sourceId, basis: 'wholesale', ...meta }), status: 'ok' };
  });
}
