-- 0037_bench_aggregates.sql — the first-party k-anonymous benchmark view.
--
-- THE PRIVACY GUARANTEE LIVES HERE, in the query, not in a convention. A bucket
-- (category × pack_size × region × week) materializes ONLY when it clears every
-- floor below. Sub-threshold cells never exist in the view, so nothing
-- downstream can leak them. Defense in depth: this HAVING + the exported
-- K_ANON_FLOOR constant (bench-aggregate-store.ts) + a CI lock test.
--
-- Floors (reconciled design — trust/consent is the binding promise):
--   • ≥ 10 distinct contributing orgs per cell
--   • ≥ 5  distinct vendors per cell
--   • no single org > 40% of a cell's observations (re-identification via a
--     dominant contributor)
--   • lagged ≥ 4 weeks (historical only — never a live/current spot quote;
--     the antitrust "facilitating practices" guard)
--   • opt-in only (org_settings.bench_contribution_opt_in = true)
--
-- Output carries ranges/percentiles + a BANDED count — never org_id, vendor_id,
-- sku, or a precise sample size. GRANT SELECT to the app role only; REFRESH as
-- the schema owner.
--
-- Column names below mirror the verified schema (line_item_observations.unit_price_cents,
-- line_item_keys.{org_id,canonical_id}, product_canonical.{category,pack_uom}).
-- Reconcile vendor_id / observed_at / pack_size_bucket against the live columns.

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_bench_buckets AS
WITH contributing AS (
  SELECT
    pc.category                              AS category,
    coalesce(pc.pack_uom, 'each')            AS pack_bucket,
    os.region_bucket                         AS region_bucket,
    date_trunc('week', lio.observed_at)::date AS week,
    lik.org_id                               AS org_id,
    lio.vendor_id                            AS vendor_id,
    lio.unit_price_cents                     AS unit_price_cents
  FROM line_item_observations lio
  JOIN line_item_keys   lik ON lio.line_item_key_id = lik.id
  JOIN product_canonical pc ON pc.id = lik.canonical_id
  JOIN org_settings      os ON os.org_id = lik.org_id
  WHERE os.bench_contribution_opt_in = true                       -- opt-in only
    AND os.region_bucket IS NOT NULL
    AND lio.observed_at < (now() - interval '4 weeks')            -- lagged, historical
    AND lio.unit_price_cents > 0
),
org_counts AS (
  SELECT category, pack_bucket, region_bucket, week, org_id, count(*) AS org_n
  FROM contributing
  GROUP BY category, pack_bucket, region_bucket, week, org_id
),
dominance AS (
  SELECT category, pack_bucket, region_bucket, week,
         max(org_n)::numeric / nullif(sum(org_n), 0) AS top_share
  FROM org_counts
  GROUP BY category, pack_bucket, region_bucket, week
),
cells AS (
  SELECT
    category, pack_bucket, region_bucket, week,
    count(*)                       AS n_obs,
    count(DISTINCT org_id)         AS n_orgs,
    count(DISTINCT vendor_id)      AS n_vendors,
    percentile_cont(0.10) WITHIN GROUP (ORDER BY unit_price_cents) AS p10_cents,
    percentile_cont(0.25) WITHIN GROUP (ORDER BY unit_price_cents) AS p25_cents,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY unit_price_cents) AS p50_cents,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY unit_price_cents) AS p75_cents,
    percentile_cont(0.90) WITHIN GROUP (ORDER BY unit_price_cents) AS p90_cents
  FROM contributing
  GROUP BY category, pack_bucket, region_bucket, week
)
SELECT
  c.category, c.pack_bucket, c.region_bucket, c.week,
  round(c.p10_cents)::int AS p10_cents,
  round(c.p25_cents)::int AS p25_cents,
  round(c.p50_cents)::int AS p50_cents,
  round(c.p75_cents)::int AS p75_cents,
  round(c.p90_cents)::int AS p90_cents,
  c.n_obs, c.n_orgs, c.n_vendors
FROM cells c
JOIN dominance d USING (category, pack_bucket, region_bucket, week)
WHERE c.n_orgs    >= 10        -- K_ANON_FLOOR
  AND c.n_vendors >= 5         -- VENDOR_FLOOR
  AND d.top_share <= 0.40;     -- DOMINANCE_CAP

-- CONCURRENTLY refresh needs a unique index on the grouping key.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bench_buckets
  ON mv_bench_buckets (category, pack_bucket, region_bucket, week);

-- The app role reads; only the owner refreshes.
GRANT SELECT ON mv_bench_buckets TO muntin_app;

-- Refresh (weekly cron, after the lag window): REFRESH MATERIALIZED VIEW CONCURRENTLY mv_bench_buckets;
