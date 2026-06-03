# First-party k-anonymous benchmark pool (build-ready staging)

**What this is.** The first-party delivered-price aggregate — the moat behind
Bench's `peerBenchmark` and the public Cost Index's `delivered` anchor. Staged
because it needs Neon + a Cloudflare Worker. **Counsel-gated:** this code stays
inert until antitrust counsel signs off on public use of pooled buyer prices
(plan pin #2). Everything here is built so that clearance is a *policy flip*,
not a code change.

This is plan pin #12. The guardrails ARE the deliverable.

## Copy-paste map → `Muntin-Invoice-Decoder`

| This file | Goes to |
|---|---|
| `migrations/0036_bench_consent.sql` | `infra/postgres/migrations/00NN_bench_consent.sql` |
| `migrations/0037_bench_aggregates.sql` | `infra/postgres/migrations/00NN_bench_aggregates.sql` |
| `migrations/0037_bench_kanon.test.sql` | `infra/postgres/tests/bench_kanon.sql` |
| `src/bench-aggregate-store.ts` | `apps/api/src/lib/bench-aggregate-store.ts` |
| `src/bench-aggregate.scheduled.ts` | `apps/api/src/scheduled/bench-aggregate.ts` |
| `src/bench.route.ts` | `apps/api/src/routes/bench.ts` |
| `tests/bench-aggregate.test.ts` | `apps/api/tests/bench-aggregate.test.ts` |

Renumber the migrations to the live sequence; reconcile column names
(`vendor_id`, `observed_at`, `pack_uom`, `region_bucket`) against the real schema.

## The privacy guarantee — defense in depth

A bucket (category × pack × region × week) **materializes only when it clears
every floor**, enforced in three independent places:

1. **The SQL view** (`0037_bench_aggregates.sql`) — `HAVING n_orgs ≥ 10 AND
   n_vendors ≥ 5 AND top_share ≤ 0.40`, plus a **4-week lag** (historical only)
   and **opt-in filter**. Sub-threshold cells never exist, so nothing
   downstream can leak them.
2. **The exported constants** (`bench-aggregate-store.ts`) — `K_ANON_FLOOR=10`,
   `VENDOR_FLOOR=5`, `DOMINANCE_CAP=0.40`, `POINT_PRICE_FLOOR=30`.
3. **A CI lock test** — `bench-aggregate.test.ts` pins those constants so the
   code and the view's HAVING can't silently drift apart.

`toPublicBucket()` is the only function allowed to produce an outward-facing
row: it strips every identifier, **bands** the sample count (exact n never
leaks), and **suppresses the median point price below k=30** — below that, only
the p25–p75 range ships, never a point.

## Proven here (not just asserted)

Run against real PostgreSQL 16 in the sandbox:

- `0037_bench_kanon.test.sql` → **4/4 PASS**: a 4-org cell is suppressed; a
  12-org/6-vendor cell is present; a cell where one org holds 80% of obs is
  suppressed by the dominance cap; the output carries no org_id/vendor_id/sku.
- `0036` + `0037` apply clean against stub base tables; the materialized view +
  unique index create, and `REFRESH MATERIALIZED VIEW CONCURRENTLY` works.
- `bench-aggregate.test.ts` (pure) → **5/5 PASS**: floors locked, identifiers
  stripped, count banded, point price suppressed below k=30.

```bash
# reproduce the SQL proof (needs a local/Neon postgres):
psql "$DB" -f migrations/0036_bench_consent.sql
psql "$DB" -f migrations/0037_bench_aggregates.sql      # after the base tables exist
psql "$DB" -f migrations/0037_bench_kanon.test.sql       # expect 4 PASS notices
pnpm -C apps/api test bench-aggregate                    # the 5 pure assertions
```

## Posture (the hard lines)

- **Opt-in only**, default OFF, revocable (`0036_bench_consent.sql`).
- **Historical only** — 4-week lag; weekly cron cadence. Never a live/current
  spot quote (the antitrust "facilitating practices" guard).
- **Buyer-side only** — block supplier accounts at the route; ranges/percentiles,
  never point prices below k=30.
- **Ranges, not points** — p25–p75 always; p50 only at k≥30.
- The public route (`bench.route.ts`) serves a finite pre-aggregated R2 blob
  (no queryable surface to scrape) + edge rate-limit + hashed-IP forensic log.

## Needs the founder / live env (pins)

- **Antitrust counsel sign-off (#2)** — non-optional before this powers anything
  public. The code is inert until then; clearance is a policy flip.
- **Privacy-policy / DPA amendment (#3)** + 30-day purpose-change notice for the
  opt-in copy.
- **Neon + Worker env** to apply the migrations, run the cron, and wire the R2
  bindings + the RateLimiter DO + supplier-account block on the route.
