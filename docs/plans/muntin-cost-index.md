<!-- Muntin product plan — committed for persistence. -->
> Recorded from the working session plan so it persists in the repo. The live status + go-live sequence is in docs/cost-index-status.md.

# Composite Price → the Muntin Restaurant Cost Index (build-ready)

*The data layer that turns illustrative prices into a real asset, wakes Bench's dormant market-trend layer, and drives Plate's seasonal-vs-structural flag. The deterministic core is built + tested: `tools/_shared/composite-price.js` (+ 9 tests). What follows is the live-fetch pipeline, which runs in CI/prod (network is blocked in the sandbox).*

**The accuracy rule (non-negotiable):** never average across incommensurable bases. Separate **LEVEL** (anchored on the most delivered-relevant basis available — delivered > wholesale > retail — shown as a p25–p75 range, indexes excluded) from **TREND** (per-source rate-of-change, blended via weighted median; the robust cross-source signal; indexes welcome here). Lead with direction; show level as a labeled range; keep provenance on every point.

**Source roster (public-domain = redistributable + safe):**
- **USDA AMS** terminal-market / Market News (wholesale produce, meat, poultry, dairy) — daily/weekly, basis `wholesale`.
- **BLS PPI** by commodity (food manufacturing, meat, dairy) — monthly, basis `index` (trend only).
- **FRED** — mirrors BLS/USDA series with a clean API; basis `index` or `wholesale`.
- **NOAA Fisheries** — seafood landings/prices; basis `wholesale`.
- **First-party Ledger** delivered prices — the moat, basis `delivered`. **Guarded exactly like Bench/Plate:** aggregated, opt-in, k≥10, historical, buyer-side, ranges-not-points, **antitrust counsel before it powers anything public.** Stays dormant until then; the public sources carry the index in the meantime.

**Pipeline (CI/prod):**
1. `scripts/fetch-cost-index-sources.mjs` (or a Cloudflare cron in `apps/api`) pulls each public source weekly → normalizes to plain observations `{ ingredientKey, source, basis, valueCents|indexValue, date }`.
2. Feed per ingredient into `MuntinComposite.assess({ levelObs, sourceSeries, asOf })` → one composite point (level range + blended trend + confidence + provenance + honest label).
3. Append to a per-ingredient weekly series → vendored `data/cost-index.json` (the time series **is** the Cost Index), parity-gated like `bench-aggregates` (mirror `check-tokens-sync` hash gate + build-time refetch).
4. Every number is fact-gate-citeable: write source + date into `data/sourced-claims.json`; render a `Sourced` line + `<details class="cite">` on each page.

**Wiring (where it makes things valuable):**
- **Ingredient-yield pages** → swap the illustrative AP price for the live composite range + trend: *"Ribeye runs about $13–15/lb wholesale, up 6% this quarter (USDA AMS + BLS PPI)."* Real, citeable — turns reference pages into a returning-traffic data surface.
- **Bench** (`bench-lookup.js`) → `marketTrend()` returns the composite trend instead of `available:false` — the "the market moved 6%, your vendor moved you 18%" line goes live.
- **Plate** (`plate-advice.js`) → the composite trend drives the `seasonal` flag on `priceMove`: a hike the market shows reverting → "Hold"; a structural market rise → "Re-price." Data-driven, not guessed.
- **PR/SEO** → the quarterly *Muntin Restaurant Cost Index* report (Pod 3's news hook) renders straight from the series.

**Verify (CI/prod):** the 9 unit tests on `composite-price.js` (done) + a fixture-fed integration test (canned AMS/PPI rows → expected composite) so a source format change fails loudly; parity gate on `data/cost-index.json`; `check-fabrications` green (every rendered number sourced).

---

# Cost Index — API Integration Architecture (3-pod build-ready spec, 2026-06-02)

*18-specialist API-integration synthesis, grounded in the real tree. The pure adapter seam is BUILT + tested (`tools/_shared/cost-index-sources.js` + 5-case contract test). The rest below is the live-fetch system, which runs in CI/prod.*

## Source adapters (Pod A)

- **Interface (BUILT):** pure `normalize(raw)` (fixture-testable, no IO) split from impure `fetchSeries` (network, in the worker). Output `{ source, basis, unit, points:[{date,value}] }`; `buildCompositeInput` folds them into the engine's `levelObs` + `sourceSeries`. Index sources never emit a level.
- **basis mapping:** USDA AMS terminal = `wholesale` level (daily — our only honestly "real-time" anchor); NOAA ex-vessel = `wholesale` level (annual, lagged); FRED APU "$/lb" = `retail` level; BLS PPI + FRED indexes = `index` (trend-only). Engine anchors level on AMS when present.
- **`data/cost-index-sources.json`** — the mapping file keyed by `ingredientKey` → per-source native id `{ ams:{reportId,commodity,market,reducer}, bls:{seriesId}, fred:{seriesId}, noaa:{species} }`. **Every series/report ID is ⚠VERIFY** — resolve against each API's discovery endpoint (`/reports`, BLS series directory, FRED `/series/search`, NOAA FOSS) and commit confirmed IDs before shipping behind the fact-gate. A discontinued series = a data fix, not a deploy.
- **Reducer contract:** AMS gives ranges, so `reducer:'mostlyMid'` = `(mostly_low+mostly_high)/2` (fallback `(low+high)/2`); NOAA `valuePerPound` = `DOLLARS/POUNDS`. Pure, unit-tested.
- **Auth/cadence:** AMS Basic-auth key (daily); BLS registration key (500/day, monthly releases); FRED key (120/min, mostly monthly food series); NOAA usually keyless (annual, CSV fallback — the shakiest surface). FRED redistribution: allowlist only the US-gov source agencies (avoid IMF/OECD series inside FRED).

## Reliability & real-time (Pod B)

- **Topology:** ONE Cloudflare cron worker, multiple cron strings dispatched by `event.cron` (daily/weekly/monthly — so a monthly series is never fetched hourly); fans out to adapters via `Promise.allSettled` (one source dying can't kill the run); per-ingredient `composite.assess`; writes artifact. **KV** = control plane (`src:<id>:etag|lastmod|last-success|breaker|fail-count`); **R2** = data plane (`raw/`, `series/`, `artifact/cost-index.json`, `artifact/history/<date>`). **No Neon, no Durable Objects in v1** (no DB in the hot path).
- **THE CARDINAL RULE:** a stale/broken/breaker-open source contributes **nothing** — omitted from `levelObs`/`sourceSeries`, never a carried-forward or fabricated current value. The engine's `confidenceFor` then steps `high→medium→low→directional` on its own, and the range widens organically. Stale-but-real *history* may still feed *trend*; an invented *current* level never. A zero-point run keeps the last-good artifact + fires P1 (last-good with a staleness badge beats blank).
- **Caching:** per-source TTL matched to real publish cadence + conditional requests (`If-None-Match`/`If-Modified-Since`; a `304` bumps last-success, doesn't advance `asOf`).
- **Resilience:** 3 retries w/ jittered backoff on transient classes only (never retry a `200` that fails the contract — that's poison, not a blip); per-source circuit breaker (CLOSED→OPEN after 3 fails, HALF_OPEN trial).
- **Contract guards (the accuracy backbone), two layers:** (A) golden-fixture shape test per source — `scripts/check-source-contracts.mjs`, pinned `EXPECTED_CONTRACT_HASH` mirroring `check-tokens-sync.mjs`, wired into `check-all` — fails CI when a source's JSON drifts (this is exactly what the built fixture test does). (B) runtime sanity validator before compose: plausible-range (`data/cost-index-bounds.json`), date-advancing, units-unchanged, cadence-sanity — a `200` that parses but is implausible is rejected + alerted, never averaged in.
- **"Real-time" done honestly:** sources are daily/weekly/monthly, so "real-time" = freshest-available + a **visible "As of {asOf} · N sources"** line (asOf = the *oldest* contributing data date) + a green/amber/grey **freshness badge** + the existing `<details class="cite">` provenance drawer + the engine's confidence word verbatim. Forbidden: a "live" spinner or "updated 2 min ago" (fetch-age ≠ data-age = a currency lie). Parity gate `check-cost-index-sync.mjs` also asserts freshness at build time.

## First-party, POS, quality, security (Pod C)

- **First-party delivered pool (the moat) — 4 stages, A–C ship now (contributing-tenant-only), D waits for counsel:** (A) per-tenant extraction → canonical `{canonical_sku, region_bucket, week, unitPriceCents, basis:'delivered'}` (reuse `sku-match.js`; coarse region, never a point); (B) **k≥10 aggregation with the floor IN the SQL view** (`HAVING count(DISTINCT org_id) >= 10`), p25/p75 ranges only (no mean/min/max), **lagged ≥4 weeks** (no live spot price); (C) feeds `assess()` as the `delivered` anchor but gated to the contributing tenant; (D) cross-operator/public use (Bench `peerBenchmark`, public Cost Index) — **counsel-gated**, already inert in code so it's a policy flip. Consent: `fp_consent` **default-OFF**, revocable, audited.
- **POS sales-mix → real covers** (turns Plate's theoretical cost into *actual* food cost + precise $/week): one `SalesMixAdapter` interface, POS-agnostic output `SalesMixRow[]`; **Square → Toast → Clover** (Square first = cleanest OAuth+webhooks, dominant in the ICP; start Toast's partner application in parallel) **+ a `CsvSalesMixAdapter` fallback that ships day one** so Plate gets real covers with no POS connected. Tokens KMS-wrapped, cloning `apps/api/migrations/0002_integrations.sql` + `routes/integrations/quickbooks.ts`; read-only scopes; webhooks for near-real-time, 15-min poll fallback.
- **Data-quality gate `validate-observation.ts` (the garbage-in defense) — runs before the engine on EVERY obs (public/first-party/POS):** reuse the existing `verdict-compute.ts` detectors (`checkSanityBand`, `computeRollingAnomaly`, `detectGradeSwitch`, `computePromoRestore`, dup hash). Flags map to a `weight∈(0,1]` the engine already accepts → bad data **lowers confidence + widens range** rather than being silently dropped or averaged in; `unit_mismatch` is the one hard-reject (wrong, not low-confidence). CI test: one poisoned obs must drop confidence and must not move the weighted-median level outside the clean p25–p75.
- **Secrets:** Cloudflare Worker secrets for app/API keys; per-tenant OAuth tokens KMS-wrapped (key in AWS KMS, never the DB); read-only scopes; rotation via `refresh()`; gated by the existing `privacy-ci.sh` / `check-cache-keys-tenant-scoped.mjs` / `check-jwt-secret-floor.mjs`.
- **Antitrust / privacy — the hard lines:** public sources redistributable (only data class in public output today); first-party delivered = k≥10 + opt-in + lag + ranges + counsel; POS = per-tenant, encrypted, never pooled without opt-in; **NO scraping of ToS-protected distributor catalogs** (the legal firewall: a buyer-side invoice we were *given* ≠ a seller-side catalog we'd be *taking*); ratios/% (food-cost %, rate-of-change) are the antitrust-safe primitives, current spot delivered prices never published.

## The headline real-time insight to ship FIRST

***"This dish now costs you $X/week more than last month — and here's whether it's the market or just your vendor."*** It fuses all three new capabilities — POS covers (precise, near-real-time $/week) + the quality gate (so it's a real hike, not a grade switch) + the composite trend (market-vs-vendor framing) — and needs **zero counsel gating** (operator's own POS + invoices + public trend only). Fire on the `price_hike` verdict event weighted by covers (only when $/week is material), never on a clock.

## Build order (dependency-correct)
1. `validate-observation.ts` quality gate (everything depends on it; reuses existing detectors). 2. `SalesMixAdapter` + Square + CSV fallback → real covers → ship the headline insight; start Toast partner app in parallel. 3. First-party Stages A–C + open counsel review for D. 4. Source contract gates + orchestrator worker + parity/freshness gates → vendored `data/cost-index.json`. 5. Toast, then Clover. 6. On counsel sign-off: flip Bench `peerBenchmark` / public-pool activation (data/policy flip, no code change).

---

# Cost Index — "will more APIs make it more powerful?" (3-specialist synthesis, 2026-06-03)

Three specialists (data-source scout · composite-accuracy architect · product-strategy) converged hard. **The honest answer: more public APIs make the dashboard look fuller far faster than they make the product more powerful — because every public source is wholesale/retail/index, and none climbs to the DELIVERED price the operator actually pays. That gap is structural (distributor markup, freight, contract terms), closed only by the first-party Ledger feed. The moat is the JOIN (public trend + first-party delivered + the operator's own invoices), which no competitor can clone.**

Ranked roadmap (value-per-effort, sequenced for a solo builder):
1. **Verify the 12 sources you have** (all verified:false). The real unlock — nothing renders until then.
2. **Fix the degenerate `$X–$X` level range** (pure engine, ~5 lines): when the winning basis has n=1, stop faking a range — say "single source." Architect's #1 accuracy-per-effort.
3. **De-correlate sources** (FRED mirrors BLS/USDA): count distinct source *families*, not keys, in confidenceFor + agreement. Fixes the "looks fuller, isn't accurate" pseudo-replication trap + the cheapest poisoning vector.
4. **Name a "Muntin Restaurant Basket" headline index** — zero new data, max PR/SEO leverage, the recurring citeable asset.
5. **CSV covers → $/week** (ALREADY STAGED: ledger-spec/sales-mix). Biggest value jump, no API maintenance.
6. **One freight/diesel source (EIA v2 or FRED)** — reframes the index as *explainable* ("why everything is up"); highest value-per-source, most stable API.
7. **Dairy/eggs/oils breadth** from the AMS/BLS families already run — covers a real menu, feeds PR + SEO programmatic pages, marginal maintenance.
8. **First-party delivered pool** (the moat) — start consent accruing now (can't backfill); counsel-gated for public (#2).
9. **STOP.** Avoid redundant wholesale sources, retail-level anchors, NOAA expansion, and commercial feeds (CME/Circana/Sysco/Technomic are license-gated — internal-only, never publishable). More sources = more fragility + false precision for a solo maintainer.

Trust guardrail (all three): **"Sell the trend and the comparison; label the level. Never let a wholesale number wear a delivered costume."** The ingredient-yield render block already does this ("wholesale reference, not the delivered price you pay").

Cheap engine wins I can do in-sandbox now (pure JS, tested): #2 (n=1 range honesty) + #3 (source-family de-correlation). No keys/network needed.
