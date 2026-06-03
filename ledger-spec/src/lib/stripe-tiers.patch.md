# Entitlement patch — `apps/api/src/lib/stripe-tiers.ts`

Plate ships **included in Solo $25 with a 20-recipe cap** (founder-confirmed
2026-06-03). Higher tiers gate *scale*, not capability.

## 1. Add `plateRecipeCap` to `TierShape`

```ts
export interface TierShape {
  // ...existing fields...
  plateRecipeCap: number | null;   // null = unlimited
}
```

## 2. Set the caps

```ts
export const TIERS: Record<TierId, TierShape> = {
  solo:       { /* ...$25... */  plateRecipeCap: 20 },
  team:       { /* ...$60... */  plateRecipeCap: null },   // unlimited
  accountant: { /* ...$150... */ plateRecipeCap: null },   // unlimited
};
```

## 3. Export the resolver the route uses

```ts
export function plateRecipeCap(tier: TierId): number | null {
  return TIERS[tier]?.plateRecipeCap ?? 20;   // default to the Solo cap, fail-safe
}
```

## 4. Enforce on create (already wired in `routes/recipes.ts`)

`POST /v1/recipes` counts active, non-archived, non-subrecipe recipes for the
caller's org and returns **402** with an `recipe_cap_reached` body + upgrade
hint when `count >= cap`. Capability lives in Solo; the cap gates *scale*.

Counting note: sub-recipes (`is_subrecipe = true`) do **not** count against the
cap — they're components, not menu dishes. `RecipesStore.activeRecipeCount`
already excludes them.
