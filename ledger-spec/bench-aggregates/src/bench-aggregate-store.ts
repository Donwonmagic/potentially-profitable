/**
 * bench-aggregate-store.ts — reader + public-shape transform for the
 * first-party benchmark. The SQL view (0037_bench_aggregates.sql) already
 * enforces the k-anonymity floors; this layer is DEFENSE IN DEPTH:
 *   - K_ANON_FLOOR / VENDOR_FLOOR / DOMINANCE_CAP exported as constants and
 *     LOCKED by a CI test (bench-aggregate.test.ts), so the query's HAVING and
 *     the code can't silently drift apart.
 *   - toPublicBucket() strips every identifier (no org_id/vendor_id/sku ever
 *     reaches an output) and BANDS the sample count (exact n never leaks).
 *   - point prices (the median) are suppressed below POINT_PRICE_FLOOR — below
 *     k=30 we publish only the p25–p75 RANGE, never a point.
 *
 * Counsel-gated (plan pin #2): even with this code correct, the aggregate stays
 * internal until antitrust counsel clears public use. Buyer-side only.
 */

import type { SqlClient } from '../../src/lib/recipe-pricing.js'; // reuse the minimal client surface

// ---- the floors. Changing any of these must also change the SQL view's
// HAVING in the same commit; the CI test pins these exact values. -----------
export const K_ANON_FLOOR = 10;     // distinct contributing orgs per cell
export const VENDOR_FLOOR = 5;      // distinct vendors per cell
export const DOMINANCE_CAP = 0.40;  // no single org > 40% of a cell's obs
export const POINT_PRICE_FLOOR = 30; // below this k, publish ranges only — never a point

export interface RawBucketRow {
  category: string;
  pack_bucket: string;
  region_bucket: string;
  week: string;
  p10_cents: number;
  p25_cents: number;
  p50_cents: number;
  p75_cents: number;
  p90_cents: number;
  n_obs: number;
  n_orgs: number;
  n_vendors: number;
}

export interface PublicBucket {
  category: string;
  pack: string;
  region: string;
  week: string;
  rangeCents: [number, number];      // p25–p75, always present (k≥10 guaranteed)
  spreadCents: [number, number];     // p10–p90 envelope
  medianCents: number | null;        // p50 — suppressed below POINT_PRICE_FLOOR
  sampleBand: string;                // banded count, never the exact n
}

/** Band the sample size so the exact contributor count never leaks. */
export function bandSampleN(nOrgs: number): string {
  if (nOrgs < K_ANON_FLOOR) return '<10';   // should never ship (view suppresses it)
  if (nOrgs < 25) return '10–24';
  if (nOrgs < 50) return '25–49';
  if (nOrgs < 100) return '50–99';
  return '100+';
}

/**
 * toPublicBucket — the only function allowed to produce an outward-facing
 * bucket. Drops identifiers, bands the count, suppresses the point price below
 * the floor. A row that somehow arrives below K_ANON_FLOOR returns null (it
 * must never have materialized; this is the last fence).
 */
export function toPublicBucket(row: RawBucketRow): PublicBucket | null {
  if (!row || row.n_orgs < K_ANON_FLOOR || row.n_vendors < VENDOR_FLOOR) return null;
  return {
    category: row.category,
    pack: row.pack_bucket,
    region: row.region_bucket,
    week: row.week,
    rangeCents: [row.p25_cents, row.p75_cents],
    spreadCents: [row.p10_cents, row.p90_cents],
    medianCents: row.n_orgs >= POINT_PRICE_FLOOR ? row.p50_cents : null,
    sampleBand: bandSampleN(row.n_orgs),
  };
}

/** Read every materialized bucket and return ONLY public shapes. */
export async function readPublicBuckets(client: SqlClient): Promise<PublicBucket[]> {
  const { rows } = await client.query<RawBucketRow>(
    `SELECT category, pack_bucket, region_bucket, week::text AS week,
            p10_cents, p25_cents, p50_cents, p75_cents, p90_cents,
            n_obs, n_orgs, n_vendors
       FROM mv_bench_buckets`,
  );
  return rows.map(toPublicBucket).filter((b): b is PublicBucket => b !== null);
}
