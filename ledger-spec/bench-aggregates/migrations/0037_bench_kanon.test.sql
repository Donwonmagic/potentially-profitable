-- 0037_bench_kanon.test.sql — the critical privacy-leak fixture.
--
-- Pins THE guarantee: a sub-threshold cell never materializes, and the output
-- exposes no org_id / vendor_id / sku. Self-contained — it builds a temp table
-- mirroring the view's `contributing` CTE and applies the EXACT same
-- aggregation + floors, so it runs without the full base-table schema and pins
-- the privacy math precisely. (Run the same assertions against the real
-- mv_bench_buckets in CI once seeded.)
--
-- Expected: every RAISE NOTICE prints PASS; any RAISE EXCEPTION fails CI.

BEGIN;

CREATE TEMP TABLE contributing (
  category TEXT, pack_bucket TEXT, region_bucket TEXT, week DATE,
  org_id TEXT, vendor_id TEXT, unit_price_cents INT
) ON COMMIT DROP;

-- Cell A — SUB-THRESHOLD: only 4 orgs. Must be ABSENT from the result.
INSERT INTO contributing
SELECT 'romaine', 'case', 'us-northeast', DATE '2026-04-06',
       'orgA' || g, 'vend' || (g % 3), 1400 + g
FROM generate_series(1, 4) g;

-- Cell B — CLEARS: 12 orgs, 6 vendors, balanced (no org > 40%). Must be PRESENT.
INSERT INTO contributing
SELECT 'tomato', 'case', 'us-south', DATE '2026-04-06',
       'orgB' || g, 'vend' || (g % 6), 900 + g * 10
FROM generate_series(1, 12) g;

-- Cell C — DOMINATED: 10 orgs but one org is 80% of observations. Must be ABSENT.
INSERT INTO contributing
SELECT 'onion', 'sack', 'us-west', DATE '2026-04-06',
       'orgC' || g, 'vend' || (g % 5), 200 + g
FROM generate_series(1, 10) g;
INSERT INTO contributing   -- pile 40 extra obs onto a single org → 40/50 = 80%
SELECT 'onion', 'sack', 'us-west', DATE '2026-04-06',
       'orgC1', 'vend' || (g % 5), 200 + g
FROM generate_series(1, 40) g;

-- The view's exact aggregation + floors, as a CTE chain.
CREATE TEMP VIEW result AS
WITH org_counts AS (
  SELECT category, pack_bucket, region_bucket, week, org_id, count(*) AS org_n
  FROM contributing GROUP BY 1,2,3,4,5
),
dominance AS (
  SELECT category, pack_bucket, region_bucket, week,
         max(org_n)::numeric / nullif(sum(org_n),0) AS top_share
  FROM org_counts GROUP BY 1,2,3,4
),
cells AS (
  SELECT category, pack_bucket, region_bucket, week,
         count(*) AS n_obs,
         count(DISTINCT org_id) AS n_orgs,
         count(DISTINCT vendor_id) AS n_vendors,
         percentile_cont(0.50) WITHIN GROUP (ORDER BY unit_price_cents) AS p50_cents
  FROM contributing GROUP BY 1,2,3,4
)
SELECT c.category, c.pack_bucket, c.region_bucket, c.week,
       round(c.p50_cents)::int AS p50_cents, c.n_obs, c.n_orgs, c.n_vendors
FROM cells c JOIN dominance d USING (category, pack_bucket, region_bucket, week)
WHERE c.n_orgs >= 10 AND c.n_vendors >= 5 AND d.top_share <= 0.40;

DO $$
DECLARE n INT;
BEGIN
  -- A: sub-threshold (4 orgs) absent.
  SELECT count(*) INTO n FROM result WHERE category = 'romaine';
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: sub-threshold cell (4 orgs) materialized'; END IF;
  RAISE NOTICE 'PASS: 4-org cell suppressed (k>=10 floor)';

  -- B: clears, present exactly once.
  SELECT count(*) INTO n FROM result WHERE category = 'tomato';
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: 12-org/6-vendor cell missing (got %)', n; END IF;
  RAISE NOTICE 'PASS: 12-org/6-vendor cell present';

  -- C: dominated (one org 80%) absent.
  SELECT count(*) INTO n FROM result WHERE category = 'onion';
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: dominated cell (single org over cap) materialized'; END IF;
  RAISE NOTICE 'PASS: dominated cell suppressed (dominance cap)';

  -- No identifier columns escape (only counts + percentiles).
  SELECT count(*) INTO n FROM information_schema.columns
   WHERE table_name = 'result' AND column_name IN ('org_id', 'vendor_id', 'sku', 'canonical_id');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: identifier column leaked into output'; END IF;
  RAISE NOTICE 'PASS: no org_id/vendor_id/sku in output';
END $$;

ROLLBACK;
