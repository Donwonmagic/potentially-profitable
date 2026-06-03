/**
 * bench-aggregate.scheduled.ts — weekly cron handler. Refreshes the k-anon
 * materialized view, reads ONLY public buckets, and writes the artifact to R2
 * (latest + dated snapshot for rollback). Logs counts only (never values) for
 * privacy-ci. Clone of the chain-head-canary handler pattern.
 *
 * Cadence: '0 9 * * 1' (weekly). Weekly signals "historical aggregate," not a
 * live feed — the antitrust posture. The view's 4-week lag already enforces
 * historical-only; the weekly cadence reinforces it.
 */

import type { SqlClient } from '../../src/lib/recipe-pricing.js';
import { readPublicBuckets, K_ANON_FLOOR, VENDOR_FLOOR, DOMINANCE_CAP, type PublicBucket } from './bench-aggregate-store.js';

export interface BenchArtifact {
  generatedAt: string;
  floors: { kAnon: number; vendor: number; dominanceCap: number };
  buckets: PublicBucket[];
}

export interface ScheduledEnv {
  sql: SqlClient;
  putArtifact: (key: string, body: string) => Promise<void>;   // R2
  log: (msg: string) => void;
  signal?: AbortSignal;
}

export async function runBenchAggregate(env: ScheduledEnv): Promise<BenchArtifact> {
  // Refresh concurrently (the unique index supports it; readers never block).
  await env.sql.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_bench_buckets');

  const buckets = await readPublicBuckets(env.sql);

  const artifact: BenchArtifact = {
    generatedAt: new Date().toISOString(),
    floors: { kAnon: K_ANON_FLOOR, vendor: VENDOR_FLOOR, dominanceCap: DOMINANCE_CAP },
    buckets,
  };
  const body = JSON.stringify(artifact);

  await env.putArtifact('bench/aggregate/latest.json', body);
  await env.putArtifact(`bench/aggregate/${new Date().toISOString().slice(0, 10)}.json`, body);

  // privacy-ci: log COUNTS only, never a value or an identifier.
  env.log(`bench-aggregate: ${buckets.length} public bucket(s) written (k>=${K_ANON_FLOOR})`);
  return artifact;
}
