/**
 * recipe-pricing.ts — resolve the latest invoice price for each canonical id.
 *
 * Returns a Map<canonical_id, CanonicalPrice> drawn from the org's own
 * line_item_observations (the price binding for recipe costing). RLS-scoped:
 * every call opens its txn with set_config('app.org_id', ...) first, exactly
 * like documents-store.ts. No cross-org leakage — the WHERE clause also pins
 * org_id = current_setting('app.org_id') as defense in depth.
 *
 * The SQL uses DISTINCT ON to take the most recent observation per canonical.
 * base_unit comes from product_canonical.pack_uom (the unit unit_price_cents
 * is expressed in) so portion-bridge can convert into the recipe portion unit.
 */

import type { CanonicalPrice } from './plate-cost.js';

// Minimal Neon/pg client surface this module needs. Match the concrete type
// used by the existing stores (e.g. the Neon serverless `sql` tagged template
// or a pooled client with .query). Shown here as a parameterized .query.
export interface SqlClient {
  query<T = any>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

interface PriceRow {
  canonical_id: string;
  unit_price_cents: number;
  observed_at: string;
  observation_id: string;
  base_unit: string;
}

export async function getLatestPrices(
  client: SqlClient,
  orgId: string,
  canonicalIds: string[],
): Promise<Map<string, CanonicalPrice>> {
  const out = new Map<string, CanonicalPrice>();
  const ids = Array.from(new Set(canonicalIds.filter(Boolean)));
  if (ids.length === 0) return out;

  // Scope the transaction to this org (RLS), then read. The third arg `true`
  // makes set_config transaction-local, matching documents-store.ts.
  await client.query("select set_config('app.org_id', $1, true)", [orgId]);

  const { rows } = await client.query<PriceRow>(
    `SELECT DISTINCT ON (lik.canonical_id)
            lik.canonical_id,
            lio.unit_price_cents,
            lio.observed_at,
            lio.id            AS observation_id,
            pc.pack_uom       AS base_unit
       FROM line_item_observations lio
       JOIN line_item_keys lik       ON lio.line_item_key_id = lik.id
       LEFT JOIN product_canonical pc ON pc.id = lik.canonical_id
      WHERE lik.org_id = current_setting('app.org_id')
        AND lik.canonical_id = ANY($1)
      ORDER BY lik.canonical_id, lio.observed_at DESC`,
    [ids],
  );

  for (const r of rows) {
    if (!r.base_unit) continue; // no normalized base unit → cannot cost honestly; leave uncovered
    out.set(r.canonical_id, {
      unitPriceCents: r.unit_price_cents,
      baseUnit: r.base_unit,
      observedAt: r.observed_at,
      observationId: r.observation_id,
    });
  }
  return out;
}
