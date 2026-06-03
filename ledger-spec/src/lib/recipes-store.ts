/**
 * recipes-store.ts — RLS-scoped CRUD on org_recipes / recipe_line_items /
 * recipe_cost_snapshots. Every method opens its transaction with
 * set_config('app.org_id', $1, true) FIRST, mirroring documents-store.ts.
 * org_id is written explicitly on every row (denormalized) so the WITH CHECK
 * policy passes and child-row recost loops stay flat.
 *
 * IDs: generate with the repo's existing id helper (e.g. nanoid/ulid used by
 * the other stores) — shown here as an injected idgen for portability.
 */

import type { SqlClient } from './recipe-pricing.js';

export interface RecipeRow {
  id: string;
  org_id: string;
  name: string;
  yield_portions: number;
  menu_price_cents: number | null;
  category: string | null;
  is_subrecipe: boolean;
  covers_per_week: number | null;
  archived_at: string | null;
}

export interface LineRow {
  id: string;
  org_id: string;
  recipe_id: string;
  canonical_id: string | null;
  subrecipe_id: string | null;
  display_name: string;
  portion_qty: number;
  portion_unit: string;
  yield_percent: number | null;
  waste_percent: number;
  manual_price_cents: number | null;
  sort_order: number;
}

export interface SnapshotInput {
  recipeId: string;
  plateCostCents: number;
  foodCostPct: number | null;
  contributionMarginCents: number | null;
  trigger: 'invoice' | 'recipe_edit' | 'price_hike' | 'manual';
  sourceObservationIds: string[];
}

type IdGen = () => string;

export class RecipesStore {
  constructor(private client: SqlClient, private idgen: IdGen) {}

  private async scope(orgId: string): Promise<void> {
    await this.client.query("select set_config('app.org_id', $1, true)", [orgId]);
  }

  async listRecipes(orgId: string, includeArchived = false): Promise<RecipeRow[]> {
    await this.scope(orgId);
    const { rows } = await this.client.query<RecipeRow>(
      `SELECT * FROM org_recipes
        WHERE org_id = current_setting('app.org_id')
          ${includeArchived ? '' : 'AND archived_at IS NULL'}
        ORDER BY name ASC`,
    );
    return rows;
  }

  async activeRecipeCount(orgId: string): Promise<number> {
    await this.scope(orgId);
    const { rows } = await this.client.query<{ n: string }>(
      `SELECT count(*) AS n FROM org_recipes
        WHERE org_id = current_setting('app.org_id') AND archived_at IS NULL AND is_subrecipe = false`,
    );
    return Number(rows[0]?.n ?? 0);
  }

  async getRecipe(orgId: string, recipeId: string): Promise<{ recipe: RecipeRow; lines: LineRow[] } | null> {
    await this.scope(orgId);
    const { rows: recs } = await this.client.query<RecipeRow>(
      `SELECT * FROM org_recipes WHERE id = $1 AND org_id = current_setting('app.org_id')`, [recipeId]);
    if (!recs.length) return null;
    const { rows: lines } = await this.client.query<LineRow>(
      `SELECT * FROM recipe_line_items WHERE recipe_id = $1 AND org_id = current_setting('app.org_id') ORDER BY sort_order ASC`, [recipeId]);
    return { recipe: recs[0], lines };
  }

  async createRecipe(orgId: string, input: Partial<RecipeRow> & { name: string }): Promise<RecipeRow> {
    await this.scope(orgId);
    const id = this.idgen();
    const { rows } = await this.client.query<RecipeRow>(
      `INSERT INTO org_recipes (id, org_id, name, yield_portions, menu_price_cents, category, is_subrecipe, covers_per_week)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, orgId, input.name, input.yield_portions ?? 1, input.menu_price_cents ?? null,
       input.category ?? null, input.is_subrecipe ?? false, input.covers_per_week ?? null],
    );
    return rows[0];
  }

  // Replace a recipe's lines wholesale inside one txn (the editor saves the
  // full grid). Caller has already scoped the txn via any method above; for a
  // standalone call, scope() runs first.
  async replaceLines(orgId: string, recipeId: string, lines: Omit<LineRow, 'id' | 'org_id' | 'recipe_id'>[]): Promise<void> {
    await this.scope(orgId);
    await this.client.query(
      `DELETE FROM recipe_line_items WHERE recipe_id = $1 AND org_id = current_setting('app.org_id')`, [recipeId]);
    let sort = 0;
    for (const l of lines) {
      await this.client.query(
        `INSERT INTO recipe_line_items
           (id, org_id, recipe_id, canonical_id, subrecipe_id, display_name, portion_qty, portion_unit, yield_percent, waste_percent, manual_price_cents, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [this.idgen(), orgId, recipeId, l.canonical_id ?? null, l.subrecipe_id ?? null, l.display_name,
         l.portion_qty, l.portion_unit, l.yield_percent ?? null, l.waste_percent ?? 0,
         l.manual_price_cents ?? null, l.sort_order ?? (sort++)],
      );
    }
  }

  async writeSnapshot(orgId: string, s: SnapshotInput): Promise<void> {
    await this.scope(orgId);
    await this.client.query(
      `INSERT INTO recipe_cost_snapshots
         (id, org_id, recipe_id, plate_cost_cents, food_cost_pct, contribution_margin_cents, trigger, source_observation_ids)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
      [this.idgen(), orgId, s.recipeId, s.plateCostCents, s.foodCostPct, s.contributionMarginCents, s.trigger,
       JSON.stringify(s.sourceObservationIds || [])],
    );
  }

  async latestSnapshotCost(orgId: string, recipeId: string): Promise<number | null> {
    await this.scope(orgId);
    const { rows } = await this.client.query<{ plate_cost_cents: number }>(
      `SELECT plate_cost_cents FROM recipe_cost_snapshots
        WHERE recipe_id = $1 AND org_id = current_setting('app.org_id')
        ORDER BY priced_at DESC LIMIT 1`, [recipeId]);
    return rows.length ? rows[0].plate_cost_cents : null;
  }

  // Recipes containing a given canonical id — the covering index (org_id, canonical_id).
  async recipesUsingCanonical(orgId: string, canonicalId: string): Promise<string[]> {
    await this.scope(orgId);
    const { rows } = await this.client.query<{ recipe_id: string }>(
      `SELECT DISTINCT recipe_id FROM recipe_line_items
        WHERE org_id = current_setting('app.org_id') AND canonical_id = $1`, [canonicalId]);
    return rows.map((r) => r.recipe_id);
  }
}
