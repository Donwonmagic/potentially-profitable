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

## Engine-room completion (2026-06-05) — the in-sandbox core is done

- **Headline Basket** shipped + fact-gated: `tools/_shared/cost-basket.js` (weighted-median, basis-agnostic % for the frozen `data/cost-basket-weights.json` basket — never a level); `build-cost-index` recomputes it from the post-gate vendored set; `check-cost-index-sync` validates it.
- **Spike-vs-structural flag** shipped: `tools/_shared/cost-spike.js` — per-ingredient "should I act?" by persistence × retrace (not magnitude); thin history → WATCH, never hold-through-a-hike. `build-cost-index` attaches it per ingredient.
- **Confidence counts source TYPES, not correlated markets** — 8 terminals widen the range (families) but are one methodology for confidence; produce/chicken cap at "medium" honestly.
- **FRED search** (`--discover-fred`) + restored ribeye/russet/8-terminal slots (search/keep, never drop). vegetable-oil mirror legs collapsed to one family/type.
- Shared resilient transport (retry/backoff/parallel/last-good), unit-aware adapter (cents→dollars, wtdAvg, scoped match, per-case produce). check-all 149/151; unit tests 153/153.

## 2026-06-08 — P1 calibration SHIPPED + FIRST LIVE VENDOR (branch `claude/muntin-invoice-decoder-audit-d7upo`)

**The Cost Index is live.** 16 ingredients vendored from a real founder fetch,
basket 9.1% (100% covered), every confidence within its data-supported ceiling.

**P1 headline quant item — DONE (the min-of-gates calibration + range-widening).**
`confidenceFor` now computes level- and trend-confidence separately and publishes
their **min**, each gated on:
- **source independence** → distinct source TYPES (`nTypes`; correlated terminals collapse) `4dafbd1`/`07b4ab9`
- **agreement** → `trend.agreement`
- **completeness** → distinct ISO-week coverage (daily rows ≠ N weeks)
- **stability** → Theil–Sen detrend, residual MAD (`trend.noise`; >20%→low, >8%→medium) `398afba`/`2724806`
- **level-agreement** → per-type robust dispersion caps disagreeing dollar types `f972ebb`/`60a0133`
- **range-widening** → rolling weekly-MAD band unioned with cross-market p25–p75; single-source items get an honest band, not `$X–$X` `f24e1d5`/`905976d`
- **explicit type in provenance** so the gate and engine count types identically `592a921`/`c81698f`

All parity-mirrored JS↔TS (Ledger `ledger-spec/cost-index/`), 19 vectors each side.
**Calibration gate is now STRICT (fail-CI)** `4c34cbe` — `COST_INDEX_WARN_ONLY=1` to
downgrade. First live data `55f9693`.

**Live confidence distribution (honest, both directions):**
- medium (10): proteins, chicken×2, salmon, **onion** (was falsely high; earned medium on a real BLS trend type), butter, cheddar
- directional (2): shrimp, vegetable-oil (no dollar level exists)
- low (4): romaine/tomato/eggs (trend noise 26–38% → stability cap), russet (trend agreement 0.22)

**Honest ceiling finding:** `high` needs two independent-agency wholesale **dollar**
levels that agree. Free public data gives exactly one per commodity (produce=AMS,
proteins=LMR cut, dairy=NDPSR, seafood=NOAA). AMS Dairy Market News is CME-**basis**
(`price_Unit:"Basis Pricing"`), not a price — unusable as a 2nd level. So **medium
is the ceiling on free data**; `high` requires a paid feed (CME/Urner Barry/Mintec).
Plan + per-ingredient detail: `docs/cost-index-confidence-plan.md`.

**P1 experience-layer — already built in `cost-index-ui.js`** (ahead of this doc's
old "NEXT"): honest-gaps sparkline (breaks at missing weeks), own-range p25–p75
band (≥12wk), confidence as dash/weight, freshness as filled-vs-hollow end dot,
`sparkShape` text alternative, `percentileLine` (count, not smoothed), `weekOverWeek`
($-anchored, ~7d window, gap-safe), `flagVerb` buy/hold/watch.

**P1 experience-layer — now EXTRACTED + TESTED** (`tools/_shared/cost-index-format.js`,
factory `MuntinCostFormat(es)`, loaded before `cost-index-ui.js` like composite-price):
the four honesty-phrasing helpers above are now a node-tested module (the UI
delegates verbatim), plus **`vsLastYear`** SHIPPED — gap-safe ~365d comparison with
an "about double/half" flourish, behind the index/directional guards. On today's
data salmon activates live ("down −11% — about $0.72 a lb"); the daily-series items
stay dormant until ~a year of history accrues, then self-activate. `cost-index-format.test.mjs`
covers all of it.

**Coverage matrix:** `scripts/build-cost-index-health.mjs` → `data/cost-index-health.json`
(per-ingredient: dollar-level? · families · level/trend types · confidence · ceiling ·
weeks · `toHigh` hint), `--check` idempotency wired into check-all. Self-prioritizes
the family work and proves honest maintenance.

**P1 remaining — DECIDED 2026-06-08 (founder):**
- **Weekly heartbeat** → **keep the privacy promise; not wired.** A cross-visit
  marker needs localStorage, which **/security/ claim #4 forbids** for this tool
  (CI-enforced by `check-tool-no-fetch.mjs`). The `MuntinCostFormat.heartbeat`
  phrasing helper is built + tested and left ready; wiring it would mean exempting
  cost-pulse from claim 4 (a public-promise change) — declined for now. The
  no-client-storage claim stays a trust differentiator.
- **Driver lag-claim** → **deferred.** Lead-lag on the current ~6–26-week series
  risks a spurious correlation and a causal-adjacent claim needs an editorial
  honesty bar + ≥~1yr history. Revisit once history deepens.

vs-last-year (the third old item) is now SHIPPED (above). **P1 experience layer is
complete** for everything safely shippable today.

## NEXT — to get the Cost Index live (in priority order)

1. **Re-run verify with the unit fix (founder, needs keys).** chicken-breast +
   whole-chicken should now resolve IN BOUNDS (was "0 in bounds" = the cents bug).
   `node scripts/verify-cost-index-sources.mjs --flip`, then the go-live sequence
   (runbook §4). Produce should run without hanging (parallel + windowed).
2. **Breadth: dairy/eggs/oils (founder-chosen coverage direction).** Add butter/
   eggs/cooking-oil from the AMS Dairy + Egg Market News + BLS families already
   wired (same MARS key). Needs report-ID discovery (`--discover`), bounds, and
   ingredient-yield pages. The fuller menu coverage feeds programmatic SEO.
3. **Beef & pork — LMR fetcher SHIPPED; confirm the slugs.** The LMR Datamart
   (keyless) is now wired as the `lmr` source (shares the AMS normalizer + the new
   $/cwt→$/lb conversion). ribeye/tenderloin → `LM_XB403`, pork-loin/shoulder →
   `LM_PK602` (best-guess). Confirm via `--discover-lmr "boxed beef"/"pork"` + a
   sample curl, set `lmr.reportId`/`lmr.commodity`, then they go READY (level +
   BLS trend). Set `LMR_KEY` only if the Datamart requires auth.
4. **Resolve the FRED ids by SEARCH, not deletion** — `scripts/verify-cost-index-sources.mjs
   --discover-fred "<query>"` searches the FRED catalog (incl. BLS PPI/CPI via FRED).
   russet-potato fred 400s → find the right potato series; ribeye fred is generic
   beef (no ribeye cut in FRED retail) → either keep as an honest `index` trend or
   wait for the LMR ribeye wholesale level. Don't drop the slot — search for the id.
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
