# Sales-mix → real covers (build-ready staging)

**What this is.** The POS-agnostic sales-mix seam that gives Plate **real
covers**, which is what makes the hero loop's "$X/week" framing precise instead
of an operator's manual guess. The CSV adapter ships day one (no POS, no OAuth);
the POS adapters slot in behind the same interface.

Completes the data inputs for the Track B Plate MVP (`../`): `plate-recost.ts`
reads `covers_per_week` to compute `$/week` — this is where a real number comes
from.

## Copy-paste map → `Muntin-Invoice-Decoder`

| This file | Goes to |
|---|---|
| `src/sales-mix.ts` | `apps/api/src/lib/sales-mix.ts` |
| `src/adapter.ts` | `apps/api/src/lib/sales-mix-adapter.ts` |
| `tests/sales-mix.test.ts` | `apps/api/tests/sales-mix.test.ts` |

## The parity contract

`sales-mix.ts` is a faithful port of `tools/_shared/sales-mix.js`; the 8 vectors
in `tests/` are the storefront suite verbatim (incl. the end-to-end vector that
runs CSV → covers → `plate-advice.advise` and asserts the `$/week` framing).
**Proven by execution:** the storefront's own 8 vectors pass against the
compiled TS port.

## The seam (build order, plan Pod C)

```
SalesMixAdapter (POS-agnostic) → SalesMixRow[] { item, unitsSold, grossSalesCents }
  1. CsvSalesMixAdapter   — ships day one, zero deps                     ← built
  2. SquareSalesMixAdapter — cleanest OAuth, dominant in the ICP          ← skeleton
  3. Toast (start the partner app early — lead time), then Clover         ← later
       │
       └─ coversFromWindow() → weeklyCovers (period-normalized) → recipe.covers_per_week
            └─ plate-recost: addedCostCentsPerPlate × covers = the real $/week
```

Everything downstream consumes `SalesMixRow[]` and never knows the source — a
CSV upload and a Square webhook produce the same shape.

## Needs the founder / live env (pins)

- **POS partner accounts / OAuth apps (#7):** Square first (cleanest), then
  **Toast — start the partner application early (lead time)**, then Clover.
- KMS-wrapped tokens (clone `migrations/0002_integrations.sql` +
  `routes/integrations/quickbooks.ts`), read-only scopes (Square: `ORDERS_READ`,
  `ITEMS_READ`), webhook for near-real-time + 15-min poll fallback.
- The `SquareSalesMixAdapter.fetchWindow` body (Orders API SearchOrders →
  aggregate line items) — stubbed with the exact call shape in a comment.

## Why this matters (theoretical → actual)

Plate's plate cost is *theoretical* (best-case). Real covers turn it into the
headline insight the plan leads with — *"this dish now costs you $X/week more
than last month"* — and, with POS line items, into theoretical-vs-actual
variance (the V3 hero: exposes over-portioning / waste / theft). The CSV adapter
gets the first, useful version of that into operators' hands with zero
integration lift.
