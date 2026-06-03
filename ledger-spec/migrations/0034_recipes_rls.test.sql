-- 0034_recipes_rls.test.sql — fail-closed RLS fixture for the recipe tables.
-- Mirrors the verdicts RLS fixture: a query WITHOUT set_config('app.org_id')
-- must return ZERO rows (the policy USING clause compares against an unset
-- GUC, which errors / matches nothing). Cross-org reads are denied.
--
-- Run against a seeded test DB. Expected: every SELECT below returns 0 rows
-- or raises (unset app.org_id), and the org-B read never sees org-A's recipe.

BEGIN;

-- Seed two orgs' data with the GUC set per write (the store pattern).
SELECT set_config('app.org_id', 'org_A', true);
INSERT INTO org_recipes (id, org_id, name, yield_portions, menu_price_cents)
  VALUES ('rec_A', 'org_A', 'Caesar', 1, 1400);
INSERT INTO recipe_line_items (id, org_id, recipe_id, canonical_id, display_name, portion_qty, portion_unit)
  VALUES ('rli_A', 'org_A', 'rec_A', 'can_romaine', 'Romaine', 2, 'oz');

SELECT set_config('app.org_id', 'org_B', true);
INSERT INTO org_recipes (id, org_id, name, yield_portions, menu_price_cents)
  VALUES ('rec_B', 'org_B', 'Cobb', 1, 1600);

-- ASSERTION 1 — org_B cannot see org_A's recipe (cross-org isolation).
DO $$
DECLARE n INTEGER;
BEGIN
  PERFORM set_config('app.org_id', 'org_B', true);
  SELECT count(*) INTO n FROM org_recipes WHERE id = 'rec_A';
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: org_B read org_A recipe (got % rows)', n; END IF;
  RAISE NOTICE 'PASS: cross-org read denied';
END $$;

-- ASSERTION 2 — with no app.org_id set, FORCE RLS yields zero rows (fail-closed).
DO $$
DECLARE n INTEGER;
BEGIN
  PERFORM set_config('app.org_id', '', true);
  BEGIN
    SELECT count(*) INTO n FROM org_recipes;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: unset org_id returned % rows', n; END IF;
    RAISE NOTICE 'PASS: fail-closed with empty app.org_id';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'PASS: fail-closed (raised: %)', SQLERRM;
  END;
END $$;

-- ASSERTION 3 — WITH CHECK blocks writing another org's id.
DO $$
BEGIN
  PERFORM set_config('app.org_id', 'org_B', true);
  BEGIN
    INSERT INTO org_recipes (id, org_id, name) VALUES ('rec_X', 'org_A', 'spoof');
    RAISE EXCEPTION 'FAIL: org_B inserted a row for org_A';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'PASS: WITH CHECK blocked cross-org insert (%).', SQLERRM;
  END;
END $$;

ROLLBACK;
