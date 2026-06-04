# Muntin Plate + Cost Index — status & roadmap

*Working record so we don't lose place. Branch: `claude/muntin-brand-audit-xtVSf`.
Last updated 2026-06-03.*

## North star
Empower independent operators with accessible data + **actionable** insight,
presented in a way that feels cutting-edge and trustworthy. Never overclaim:
sell the trend and the comparison, **label the level**, never let a wholesale
number wear a delivered costume.

---

## SHIPPED (committed to the branch)

**Storefront**
- Cornerstone library article "Keep your plate cost honest when prices change" (EN+ES) + the homepage byline reconciliation.
- Cost Index **engine, runnable**: `scripts/fetch-cost-index-sources.mjs` (demo + `--live` + `--out` artifact) `38e2d2f977`,`4cfca64eef`.
- Cost Index **fact-gated data layer**: `data/cost-index.json` + `scripts/build-cost-index.mjs` + `scripts/check-cost-index-sync.mjs` (wired into check-all) `e67851cf54`.
- **Render**: `build-ingredient-yield-pages.mjs` shows a "Market read" panel when data lands (dormant today) `329d0f238b`.
- **Source verifier**: `scripts/verify-cost-index-sources.mjs` (`--discover`, `--flip`) `bc3637a190`,`175a2dfe7a`,`4cfca64eef`.
- **Engine accuracy wins**: honest single-source level (no fake `$X–$X`) + source-family de-correlation `25801333ad`; AMS commodity row-filter `bd9446243c`; **multi-terminal national level** (ams as array, 8 markets) `d24d11f2a1`.

**Ledger MVP staging — MOVED to the `Muntin-Invoice-Decoder` repo** (branch `claude/muntin-brand-audit-xtVSf`, commit `904b52f`, 2026-06-03). No longer in the storefront; build-ready, copy-paste per each README. Commits below were the storefront history before the move:
- Track B Plate MVP (migrations + recost hero loop + route + tests) `a6f339c425` — RLS proven in real Postgres.
- Cost Index live-fetch pipeline (TS ports + worker) `5a1ca7c4ed` — 26 vectors parity.
- First-party k-anonymous benchmark (the moat) `4db80ca416` — k≥10 proven in real Postgres.
- Sales-mix → covers (CSV ships day one) `31ed6b62e9`.
- `market-vs-vendor.ts` headline insight `304b8869ea`.

`check-all`: 149/151 (the 2 pre-existing glossary idempotency failures are unrelated).

---

## Specialist hardening pass (2026-06-04) — 4-specialist API-integration review

A 4-specialist review (adapter correctness · fetch reliability · data integrity ·
accuracy/coverage) drove a correctness + resilience pass. All shipped, check-all
149/151:
- **AMS adapter is now unit-aware** (`78bf47d80b`): reads `price_unit` and
  converts cents→dollars (the chicken report is "Cents Per Lb" — $1.46/lb was
  being read as $145 and dropped); new `wtdAvg` reducer prefers the
  volume-weighted `wtd_avg_price`; commodity match scoped to descriptive fields;
  the unit flows through so the dormant unit-mismatch hard-reject is armed.
- **Section auto-detect** (`9408c03d7a`): "Report Detail" (chicken) vs "Report
  Details" (produce) — MARS returns the header on a name miss, so we read the
  advertised `reportSections` and refetch the real detail section.
- **Vendor fact-gate hardened** (`383d906d1f`): tight `[min,max]` bounds (no 2x
  slop on a rendered number), point staleness is a HARD fail (no frozen
  carry-forward), provenance must carry date/basis not just a source.
- **Produce labeled per-case** (`52bf0b8db4`, founder call): the level renders
  "$24.00/carton" — never implies a $/lb we didn't measure. Produce specs carry
  a package unit; bounds recalibrated to per-case.
- **Shared fetch transport** (`25f9ba5ca0`): one `tools/_shared/cost-index-fetch.js`
  for verify + orchestrator — transient-only retry+backoff (the BLS 500 that
  dropped pork-shoulder), bounded-concurrency parallel fan-out (8 produce
  terminals no longer felt hung), last-good guard (an all-failed run can't
  clobber the vendored index), + the AMS window/timeout.

## NEXT — to get the Cost Index live (in priority order)

1. **Re-run verify with the unit fix (founder, needs keys).** chicken-breast +
   whole-chicken should now resolve IN BOUNDS (was "0 in bounds" = the cents bug).
   `node scripts/verify-cost-index-sources.mjs --flip`, then the go-live sequence
   (runbook §4). Produce should run without hanging (parallel + windowed).
2. **Breadth: dairy/eggs/oils (founder-chosen coverage direction).** Add butter/
   eggs/cooking-oil from the AMS Dairy + Egg Market News + BLS families already
   wired (same MARS key). Needs report-ID discovery (`--discover`), bounds, and
   ingredient-yield pages. The fuller menu coverage feeds programmatic SEO.
3. **Beef & pork need the LMR API.** Boxed-beef-cutout / negotiated-pork wholesale
   are NOT in Market News v1.2 — they're under USDA's **LMR / Datamart** (separate
   fetcher; ribeye/tenderloin/pork-* carry BLS trend only until then).
4. **Fix FRED russet-potato** (HTTP 400 — bad series id) and **drop FRED ribeye**
   (wrong cut, ~$6.90 generic beef).
5. **Verify → flip → fetch --live --out → build-cost-index → check-sync → render.**

## API KEYS (founder)
- ✅ FRED, BLS, USDA AMS (Market News) — have them.
- ⏳ **USDA LMR / Mandatory Price Reporting key** — for beef/pork wholesale (#2 above).
- ⏳ **EIA Open Data key** — diesel/freight, the "why everything is up" signal (high value, low maintenance).
- (No new key) **AMS Dairy + Egg Market News** — same MARS key; adds dairy/eggs categories.

## "MORE POWERFUL" roadmap (3-specialist synthesis)
More public APIs help TREND (to ~3–5 independent sources) + breadth, but the
DELIVERED price an operator pays is a structural gap only the first-party Ledger
feed closes — that's the moat. Highest-leverage, sequenced for a solo builder:
verify the sources you have → name a "Muntin Restaurant Basket" headline index
(zero new data, max PR) → CSV covers ($/week, already staged) → one freight
source (EIA) → dairy/eggs/oils breadth → first-party delivered pool. Then stop.

## UX / interaction (the current priority)
Designer prompt issued (Plate Cost result, ingredient-yield pages, Bench, landing
band). Honesty rails the data layer already guarantees: As-of · N sources, the
confidence word verbatim, ranges-not-points, "wholesale reference, not the
delivered price you pay." States to design: fresh / stale / last-good /
low-confidence / directional-only / no-data, plus the market-vs-vendor verdicts.
Empowerment discipline: 5-second read, loss-aversion $/week framing, one
recommended move, receipts on tap.

## Where the durable plan lives
Full detail in the session plan; this file is the in-repo, persistent summary.
The ledger-spec/ READMEs carry the copy-paste maps + verify sequences.

## Findings 2026-06-03 (live verify with keys)
- AMS report prices live in the **"Report Details"** section, not the bare
  `/reports/{id}` (which returns "Report Header" = weather/metadata). Fetchers
  now request `/reports/{id}/Report Details` (override via `ams.section`).
  → confirm the Detail row field names (commodity, price) from one sample, then
  produce + chicken go READY.
- Beef/pork wholesale (boxed-beef cutout, negotiated pork) are **NOT** in the
  Market News (MARS) API — `2461` is invalid; `--discover beef/pork` shows only
  import/variety/grocery-feature. They require the **LMR Datamart**
  (https://mpr.datamart.ams.usda.gov/) — a separate fetcher (likely keyless).
  Until then beef/pork carry BLS trend only (no wholesale level).
