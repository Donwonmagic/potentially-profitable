# Cost Index — Expert Audit & Marked-Increase Roadmap (2026-06-14)

> Synthesis of a four-specialist read-only audit (plan-state, public-data frontier,
> depth/quality, product/quotability). Captures where the index stands and the ranked
> opportunities to lift it, using only public, fact-checkable data. Companion to the
> depth-roadmap, methodology, and adapter-specs docs.

## State of the plan (verified)
- **Live & honest:** ~100 ingredients vendoring measured (after the session's flips), the
  three-tier measured/derived/absent spine, dual level/trend confidence with
  `overstated:0`, the calibrated forward layer (4 proven edges, 19 refuted sign-flips
  dropped), NDPSR dairy, the published methodology page (EN+ES), automated daily refresh
  + freshness heartbeats, and a 20-item deep-history backfill that lit the first 4 seasonal bands.
- **The unlock shipped overnight:** the AMS deep-stitch — the deep backfill now reaches the
  ~77 AMS-terminal produce items (MARS caps a single window; we stitch 150-day windows).
  Re-running the backfill activates produce seasonal bands.
- **Honest ceiling (deliberate, not a bug):** `high` LEVEL confidence is structurally
  unreachable — 0 of ~100 items have a 2nd independent *dollar-level type* (one source family
  each: AMS *or* LMR *or* NDPSR). That is Urner Barry's actual moat. Reaching `high` needs
  either a genuinely independent dollar source per cluster, OR a conscious canon decision to
  let a ≥3-market `rangeBasis:"markets"` AMS range earn `high` on cross-*market* dispersion.
  Decide explicitly; do not drift into it.

## Ranked marked-increase opportunities

### Tier 1 — highest leverage
1. **Re-run the deep backfill (AMS stitch) → ~77 produce seasonal bands.** Code shipped; needs one keyed run (wake-up runbook).
2. **Promote the "are you overpaying?" basis verdict to a headline feature.** ~80% built (`renderYou`/`bandSvg` already compute below/in/above the p25–p75 band and rank biggest gap). It's the competitive wedge no incumbent fills, and its output — "public ribeye is $X–$Y/lb; above $Y you're over market" — is the single most AI-citable thing the index emits.
3. **Freshness in machine-readable form** — wire the seed `generatedAt` into `Dataset.dateModified` + a visible "index refreshed: {date}" line. Freshness is a top-3 AI-citation factor; the index *is* fresh but doesn't *say so* to machines.
4. **Land the last stragglers** (connected `--flip`) → `absent` 6 → ~3.

### Tier 2 — new public sources (frontier scout, honest-fit; spec'd in adapter-specs)
5. **AMS National Retail Report family** (NEW) — a free *retail* leg covering **poultry + shell eggs** (where LMR is structurally blind), making the §7 retail↔wholesale spread method real; plus a quotable "feature rate" demand signal. Rides MARS auth. Reports: pork feature `2868`, daily shell-egg index `2843`, egg feature `ams_2757`, retail beef `lswbfrtl`.
6. **World Bank "Pink Sheet" (CMO)** (NEW) — one free public-domain monthly XLSX → honest *dollar* levels for coffee/cocoa/sugar/rice/palm-soy oil/beef/shrimp/bananas (where US public data is thin and FRED is index-only). Near-level for ~100%-imported tropicals via the ratio bridge. `worldbank.org/en/research/commodity-markets`.
7. **GATS import unit-value** — de-risked: the GATS web tool exposes a native `Customs Unit Value` + `Calculated Duty` field (no account), collapsing the `normalizeGats` math and partially addressing the duty-exclusion caveat. Derived levels for banana/avocado/lime/garlic.
8. **NASS QuickStats as composite *types*** — Prices-Received (~65 commodities; farm-gate dollar → level-bridge) + Cold Storage stocks (hard supply numbers). Free key. Extends existing NASS use beyond pressure.
9. **BLS Import Price Index — extend to produce/coffee** (07/08/09 end-use, via FRED, keys held) — direction corroborators for the import-dominated produce cluster. Pure config.
10. **APHIS HPAI** (egg/poultry avian-flu supply shock) — the dominant egg signal; CDC CSV needs a `fetchAphis` text parser (spec §B).

### Tier 2 — product/quotability (build on the excellence audit)
11. **Per-ingredient `/cost-index/<slug>/` answer pages** — lead each with a liftable one-sentence price answer ("As of {date}, wholesale ribeye is ~$X–$Y/lb (USDA, measured)") + `QAPage` schema mirroring the query. Where reach compounds into "core source" capture for long-tail "what does X cost" queries.
12. **Sharpen the anti-UB wedge into a repeated, quotable claim** on the dashboard dek + hub lede + meta ("the only restaurant cost index where every number traces to a dated public report and every gap is named").
13. **Substitution economics** (the operator's real lever) and **basket→email alerts** (turn the shareable `#basket=` hash into a retention loop via the existing `/api/subscribe`).

### Honest declines (scope-drift guard — do NOT pursue)
CME/CBOT futures (redistribution-licensed), Cass/DAT freight + paid FX feeds (proprietary;
EIA diesel + FRED FX are the free proxies), ERS social atlases (no price), FAO GIEWS / FAS PSD
(no price level — World Bank Pink Sheet + NASS Cold Storage deliver the same supply signal with numbers).

## Sequencing
1. Wake-up runbook (re-backfill + flips + secrets) — realizes coverage already paid for.
2. Tier-1 product wins (basis verdict headline, dateModified) — mostly packaging of built work.
3. Tier-2 sources in order: AMS National Retail → World Bank Pink Sheet → GATS → APHIS.
4. The `high`-confidence canon decision — deliberate, documented.
