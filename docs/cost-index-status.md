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

**ledger-spec/ (build-ready staging, copy-paste into Muntin-Invoice-Decoder)**
- Track B Plate MVP (migrations + recost hero loop + route + tests) `a6f339c425` — RLS proven in real Postgres.
- Cost Index live-fetch pipeline (TS ports + worker) `5a1ca7c4ed` — 26 vectors parity.
- First-party k-anonymous benchmark (the moat) `4db80ca416` — k≥10 proven in real Postgres.
- Sales-mix → covers (CSV ships day one) `31ed6b62e9`.
- `market-vs-vendor.ts` headline insight `304b8869ea`.

`check-all`: 149/151 (the 2 pre-existing glossary idempotency failures are unrelated).

---

## NEXT — to get the Cost Index live (in priority order)

1. **Fix the AMS adapter for terminal/chicken reports.** Verify shows the numeric
   reportIds RESOLVE (no 404) but yield 0 priced rows — the report JSON shape /
   commodity field / price field doesn't match the adapter yet. **BLOCKER: need a
   sample report JSON** (`curl` reportId 2282 + 3646) to map the fields. Then
   produce + chicken go READY.
2. **Beef & pork need the LMR API.** Boxed-beef-cutout / negotiated-pork wholesale
   reports are NOT in the Market News v1.2 directory — they're under USDA's
   **LMR (Livestock Mandatory Reporting) / Datamart**. Needs a fetcher + likely the
   second USDA key. (ribeye, beef-tenderloin, pork-loin, pork-shoulder.)
3. **Fix FRED russet-potato** (HTTP 400 — bad series id) and **drop FRED ribeye**
   (wrong cut, ~$6.90 generic beef).
4. **Verify → flip → fetch --live --out → build-cost-index → check-sync → render.**

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
