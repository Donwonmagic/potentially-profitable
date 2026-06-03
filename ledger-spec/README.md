# Muntin Plate — Track B build-ready staging

**What this is.** Copy-paste-ready TypeScript + SQL for the Ledger `/recipes/`
MVP (Muntin Plate), staged in the storefront repo because the web sandbox
can't reach the Ledger toolchain (pnpm / vitest / Neon). Everything here is
either a **verbatim port** of a storefront engine (so the free tool and Ledger
never disagree) or the **new server-side logic** spelled out precisely enough
to drop into `Muntin-Invoice-Decoder` and run `pnpm -C apps/api typecheck && test`.

**This is staging, not wired code.** Nothing here is imported by the storefront
(`ledger-spec/` is outside every build/gate path). Move the files into the
Ledger repo at the paths below, then wire the repo's concrete bindings
(auth middleware, the Neon `sql` client, id generator).

## Copy-paste map → `Muntin-Invoice-Decoder`

| This file | Goes to |
|---|---|
| `migrations/0034_recipes.sql` | `infra/postgres/migrations/0034_recipes.sql` |
| `migrations/0034_recipes_rls.test.sql` | `infra/postgres/tests/0034_recipes_rls.sql` |
| `src/lib/portion-bridge.ts` | `apps/api/src/lib/portion-bridge.ts` |
| `src/lib/yield-table.ts` | `apps/api/src/lib/yield-table.ts` |
| `src/lib/plate-cost.ts` | `apps/api/src/lib/plate-cost.ts` |
| `src/lib/plate-advice.ts` | `apps/api/src/lib/plate-advice.ts` |
| `src/lib/recipe-pricing.ts` | `apps/api/src/lib/recipe-pricing.ts` |
| `src/lib/recipes-store.ts` | `apps/api/src/lib/recipes-store.ts` |
| `src/lib/plate-recost.ts` | `apps/api/src/lib/plate-recost.ts` |
| `src/routes/recipes.ts` | `apps/api/src/routes/recipes.ts` |
| `src/lib/stripe-tiers.patch.md` | apply to `apps/api/src/lib/stripe-tiers.ts` |
| `tests/*.test.ts` | `apps/api/tests/` |

## The parity contract (do not break)

`portion-bridge.ts`, `plate-advice.ts`, and `yield-table.ts` are faithful ports
of the storefront sources:

- `tools/_shared/portion-bridge.js`
- `tools/_shared/plate-advice.js`
- `tools/plate-cost/plate-cost.js` (the `YIELD_TABLE`)

If you change the math in either repo, change it in the other **in the same
change**, or the free Plate Cost tool and Ledger will give different answers
for the same recipe. `tests/plate-advice.test.ts` is copied verbatim from
`tools/_shared/plate-advice.test.mjs` — keep it that way; it is the guarantee.

Re-extract the yield table after any storefront edit:

```bash
# from the storefront repo root
node -e 'const a=require("./tools/plate-cost/plate-cost.js");const fs=require("fs");
const yt=a.YIELD_TABLE;const e=Object.entries(yt).map(([k,v])=>"  "+JSON.stringify(k)+": "+v).join(",\n");
fs.writeFileSync("ledger-spec/src/lib/yield-table.ts",
"export const YIELD_TABLE: Record<string, number> = {\n"+e+"\n};\n")'
```

## Architecture (the hero loop)

```
price_hike verdict (canonical_id)
  └─ plate-recost.recostForHike(orgId, hike)
       ├─ recipesUsingCanonical(org, canonical)         (covering idx org_id,canonical_id)
       ├─ for each recipe: getLatestPrices() → priceMap  (line_item_observations, RLS-scoped)
       ├─ costRecipe(recipe, priceMap)                   (portion-bridge + yield-table, cents)
       │     • partial coverage honest: uncovered lines = covered:false, contribute 0
       ├─ writeSnapshot(trigger:'price_hike', source_observation_ids)
       ├─ added = new − prior snapshot;  weekly = added × covers_per_week
       └─ advise({plateCost, menu, covers, priceMove:{added, ingredient, pctMove, seasonal}})
            → one notification card per dish → publishSyncEvent → /insights + /today
```

**Wiring point:** call `recostForHike(...)` where `computePriceHike` verdicts
are persisted (the post-extraction verdicts write path), fire-and-forget — one
new call site, same pattern as the existing audit/sync events.

## Verify (in the Ledger env)

```bash
pnpm i
pnpm -C apps/api typecheck
pnpm -C apps/api test            # plate-advice (11 verbatim) + plate-cost + portion-bridge
# apply 0034 + RLS fixture to a seeded test DB:
psql "$TEST_DATABASE_URL" -f infra/postgres/migrations/0034_recipes.sql
psql "$TEST_DATABASE_URL" -f infra/postgres/tests/0034_recipes_rls.sql   # expect PASS notices
bash scripts/no-llm-ci.sh && bash scripts/privacy-ci.sh                  # zero LLM, recipes encrypted/never logged
```

## Still needs the founder / Ledger repo (not portable here)

- **Concrete bindings:** the real Neon `sql` client type (replace the minimal
  `SqlClient` interface), `requireAuth` middleware, and the id generator
  (`nanoid`/`ulid`) used by the other stores.
- **`ingredient-search`:** port `tools/_shared/stem.js` + `sku-match.js` to
  resolve the autocomplete from the org's own `product_canonical` /
  `line_item_keys`. The route handler is stubbed (`results: []`).
- **KMS field-encryption** on `display_name` + quantities, per the documents
  posture; add recipes to the Art. 20 export; extend privacy-policy/DPA.
- **Frontend** `apps/web/app/(product)/recipes/` (editor grid + invoice-line
  picker + the `/insights` hike card) — after the API + tests are green.
- **`seasonal` signal** on `PriceHike` comes from the composite market-trend
  (Cost Index) once that pipeline is live; until then it's optional/undefined
  and the engine simply doesn't suppress a re-price.

## Design decisions baked in

- **Money is integer cents** end to end (no floats in stored values).
- **Yield ≠ waste:** `costRecipe` applies *yield* to plate cost; `waste_percent`
  is a separate recorded kitchen metric, not folded into the cost (matches the
  storefront and the cornerstone library article).
- **Fail-closed everywhere:** cross-family units → `compatible:false` (never a
  guessed density); missing price → `covered:false` (never a silent zero);
  unset `app.org_id` → zero rows (FORCE RLS).
- **Solo cap = 20** live recipes (founder-confirmed); sub-recipes don't count.
