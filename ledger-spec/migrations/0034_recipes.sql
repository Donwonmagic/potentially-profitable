-- 0034_recipes.sql — Muntin Plate MVP: recipes + line items + cost snapshots.
-- Additive, forward-only. FORCE RLS fail-closed on app.org_id, exactly like
-- 0015_rls_data_plane.sql / 0023. org_id is denormalized onto child rows for
-- tight recost loops and flat RLS policies.
--
-- NOTE: the ALTER ... ENABLE/FORCE ROW LEVEL SECURITY and CREATE POLICY
-- statements are NOT idempotent — guard re-runs per the 0015 convention
-- (DROP POLICY IF EXISTS before CREATE, or run once on a fresh branch).

CREATE TABLE IF NOT EXISTS org_recipes (
  id               TEXT PRIMARY KEY,
  org_id           TEXT NOT NULL,
  name             TEXT NOT NULL,
  yield_portions   NUMERIC(10,2) NOT NULL DEFAULT 1,
  menu_price_cents INTEGER,
  category         TEXT,
  is_subrecipe     BOOLEAN NOT NULL DEFAULT false,
  covers_per_week  INTEGER,                 -- operator-entered; enables $/week framing
  archived_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_line_items (
  id                 TEXT PRIMARY KEY,
  org_id             TEXT NOT NULL,         -- denormalized for tight recost loops + flat RLS
  recipe_id          TEXT NOT NULL REFERENCES org_recipes(id) ON DELETE CASCADE,
  canonical_id       TEXT,                  -- → product_canonical.id (the price binding)
  subrecipe_id       TEXT REFERENCES org_recipes(id) ON DELETE SET NULL,
  display_name       TEXT NOT NULL,
  portion_qty        NUMERIC(12,4) NOT NULL,
  portion_unit       TEXT NOT NULL,
  yield_percent      NUMERIC(6,4),          -- NULL → fall back to ported YIELD_TABLE / learned
  waste_percent      NUMERIC(6,4) NOT NULL DEFAULT 0,   -- kept SEPARATE from yield
  manual_price_cents INTEGER,               -- off-invoice items (salt, spice)
  sort_order         INTEGER NOT NULL DEFAULT 0,
  CHECK (canonical_id IS NOT NULL OR subrecipe_id IS NOT NULL OR manual_price_cents IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS recipe_cost_snapshots (
  id                        TEXT PRIMARY KEY,
  org_id                    TEXT NOT NULL,
  recipe_id                 TEXT NOT NULL REFERENCES org_recipes(id) ON DELETE CASCADE,
  plate_cost_cents          INTEGER NOT NULL,
  food_cost_pct             NUMERIC(6,4),
  contribution_margin_cents INTEGER,
  priced_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  trigger                   TEXT NOT NULL,  -- 'invoice'|'recipe_edit'|'price_hike'|'manual'
  source_observation_ids    JSONB NOT NULL DEFAULT '[]'  -- provenance for "show your work"
);

CREATE INDEX IF NOT EXISTS idx_rli_org_canonical ON recipe_line_items (org_id, canonical_id);
CREATE INDEX IF NOT EXISTS idx_rcs_recipe_time   ON recipe_cost_snapshots (recipe_id, priced_at DESC);

-- FORCE RLS on all three (NOT idempotent — guard re-runs per 0015 note):
ALTER TABLE org_recipes ENABLE ROW LEVEL SECURITY;            ALTER TABLE org_recipes FORCE ROW LEVEL SECURITY;
ALTER TABLE recipe_line_items ENABLE ROW LEVEL SECURITY;      ALTER TABLE recipe_line_items FORCE ROW LEVEL SECURITY;
ALTER TABLE recipe_cost_snapshots ENABLE ROW LEVEL SECURITY;  ALTER TABLE recipe_cost_snapshots FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_recipes_org_isolation ON org_recipes;
CREATE POLICY org_recipes_org_isolation ON org_recipes
  USING (org_id = current_setting('app.org_id')) WITH CHECK (org_id = current_setting('app.org_id'));

DROP POLICY IF EXISTS recipe_line_items_org_isolation ON recipe_line_items;
CREATE POLICY recipe_line_items_org_isolation ON recipe_line_items
  USING (org_id = current_setting('app.org_id')) WITH CHECK (org_id = current_setting('app.org_id'));

DROP POLICY IF EXISTS recipe_cost_snapshots_org_isolation ON recipe_cost_snapshots;
CREATE POLICY recipe_cost_snapshots_org_isolation ON recipe_cost_snapshots
  USING (org_id = current_setting('app.org_id')) WITH CHECK (org_id = current_setting('app.org_id'));
