<!-- Muntin product plan — committed for persistence. -->
> Recorded from the working session plan so it persists in the repo. The live status + go-live sequence is in docs/cost-index-status.md.

# Muntin Bench — Cross-Product Integration Plan

*Brand strategist + 24-specialist synthesis. Scope: the third surface under the Muntin brand. Built on a deep read of both repos and 23 specialist briefs (data/privacy, product/UX, brand/content/SEO, growth/trust, risk/legal/ops). 2026-06-02.*

---

## ⚑ PINNED — REQUIRES THE FOUNDER (nothing below blocks autonomous build)

*Master action list across the whole session. Everything here needs Don's decision, sign-off, an account/registration, or an environment this sandbox can't reach (network / the Ledger toolchain). Autonomous build continues around all of it.*

**Decisions / approvals**
1. **Plate pricing cap** — ✅ CONFIRMED 2026-06-03: Solo $25 includes Plate with a **20-recipe cap** (Team/Accountant unlimited). Wire as `plateRecipeCap` in Track B `stripe-tiers.ts` (`solo: 20`).
2. **Antitrust counsel sign-off** — REQUIRED before the first-party delivered-price pool powers anything public (Bench `peerBenchmark`, public Cost Index). Stays dormant in code until then. Non-optional.
3. **Privacy policy / DPA amendment** — for recipes-as-customer-data + the opt-in "contribute anonymized prices" consent copy (when Ledger `/recipes/` ships).
4. **Landing-page positioning — SHIPPED with judgment calls (override any of these freely).** Executed across 3 surfaces (tools index, homepage co-flagship, operations-margin topic), all gate-green (148/150). Calls I made: (a) headline = *"Know what your menu makes you"* ✅; (b) promoted Plate to a homepage **co-flagship card** beside the Audit (two doors: website-leak + menu-leak) ✅; (c) **re-portion verb** → I aligned ALL copy to the tool's real verbs *"raise, swap, or hold"* (did NOT add a re-portion path to `plate-cost.js`) — if you'd rather the tool literally word "re-portion," that's a `plate-cost.js` verdict-string change + a copy revert; (d) kept **"Plate Cost"** as the name everywhere (did NOT introduce a separate "Muntin Plate" marketing name) to avoid two-name confusion — flip if you want the Muntin Plate brand on the band; (e) ~~my band carries **no byline**, so the homepage's existing multi-venue byline (Irish Inn + Tacombi vs the singular-bio rule) is **still open** — reconcile separately~~ → **✅ DONE (2026-06-03):** homepage hero byline (EN `index.html:457` + ES `es/index.html:505`) reconciled to the singular Tacombi bio; Irish Inn stays a past role in `/about/`. Committed `ebe77a71d1`, gate-green; (f) no yield-page count is cited in prose (not sentinel-backed); Cost Index not mentioned on the band (stays "coming"). **✅ DONE (2026-06-03):** `plate-advice.js` is now wired into the Plate Cost result (EN+ES) — the operator enters their current price and gets the verdict + the re-price/re-portion/absorb fork on real cost + weekly volume. That also resolves (c): the tool now literally words *re-portion*, and the landing copy was updated to match (*"raise, re-portion, or hold"* / *"sube, recorta la porción o mantén"*). DOM-built (no new innerHTML), gate-green.
5. **Cornerstone library explainer + the quarterly "Muntin Restaurant Cost Index" PR report** — ✅ DECIDED 2026-06-03: both **yes**, both under **The Muntin Desk** byline. (a) **✅ SHIPPED (2026-06-03, commit `02629882f1`):** `library/keep-plate-cost-honest-when-prices-change/` + ES `es/library/costo-del-plato-cuando-cambian-los-precios/`. ~2,900-word EN, 7 H2 mechanism sections, 2 viz figures (viz-bars + viz-ba), 3 cite drawers (CIA yields / Cornell menu engineering / USDA AMS + BLS PPI), all numbers illustrative-labeled. Registered across 9 manifests + OG cards. Drives Plate Cost (hero tool) + the Ledger funnel; post-end-cta → Margin Math (savable). check-all 148/150. **Two follow-up pins below (#14, #15).** (b) Quarterly Cost Index PR report — intent locked: **quarterly cadence · Muntin Desk byline**; renders from `data/cost-index.json` once the live-fetch pipeline + source-ID verification (pins #6, #8) are done. Parked on those externals.

**Accounts / registrations (free, but founder action)**
6. **API keys**: USDA AMS (Basic-auth key via mymarketnews), BLS registration key, FRED key. Needed for the live Cost Index fetch.
7. **POS partner accounts / OAuth apps**: Square (first), **Toast (start the partner application early — it has lead time)**, Clover. For sales-mix live integration. **✅ The day-one CSV path is STAGED 2026-06-03 in `ledger-spec/sales-mix/`** (commit `31ed6b62e9`) — `CsvSalesMixAdapter` ships with zero deps (no account needed); `sales-mix.ts` is a parity-proven port (storefront's 8 vectors pass against the compiled TS, incl. the end-to-end CSV→covers→`plate-advice` $/week vector). The `SalesMixAdapter` interface + `SquareSalesMixAdapter` skeleton (exact Orders-API call shape) are staged; **the live POS adapters need these accounts** + KMS token store + read-only OAuth scopes.

**Verification (needs network / can't run in sandbox)**
8. **Verify every source ID** in `data/cost-index-sources.json` against the live discovery endpoints (AMS `/reports`, BLS series directory, FRED `/series/search`, NOAA FOSS) and flip `verified:false → true`. The whole file is placeholders today; nothing renders behind the fact-gate until verified.
9. **OG card render** for any newly-featured surface — renders in the prod build (resvg); the sandbox has no rasterizer (the per-tool cards already fall back to a placeholder here).

**Needs the CI-runnable / Ledger environment (specced build-ready, not auditable here)**
10. **Track B — Ledger `/recipes/` MVP**: migrations + recost engine + route + tests. **✅ Build-ready code STAGED 2026-06-03 in `ledger-spec/`** (storefront repo, commit `a6f339c425`) — copy-paste into `Muntin-Invoice-Decoder` per `ledger-spec/README.md`. Ports (portion-bridge / plate-advice / yield-table / plate-cost) are parity-locked to the storefront and **proven identical by execution** (the storefront's own 13 advice vectors pass against the compiled TS port; `tsc --strict` clean). New logic written: `0034_recipes.sql` + RLS fixture, `recipe-pricing.ts`, `recipes-store.ts`, the hero-loop `plate-recost.ts`, `routes/recipes.ts`, `stripe-tiers.patch.md` (Solo cap 20). **RLS fail-closed PROVEN against real PostgreSQL 16 in-sandbox (2026-06-03):** migration applies clean (3 tables + 3 FORCE-RLS policies, idempotent guards work), and run as a non-superuser role the fixture passes 3/3 — cross-org read denied, fail-closed on empty `app.org_id`, `WITH CHECK` blocks a cross-org insert. **Still needs the Ledger env** to: wire concrete bindings (Neon `sql` client, `requireAuth`, id gen), port `stem.js`/`sku-match.js` for `ingredient-search`, add KMS field-encryption + Art. 20 export, build the frontend, and run `pnpm -C apps/api typecheck && test` + the RLS fixture against Neon.
11. **Cost Index orchestrator worker** (Cloudflare cron + KV + R2) + the live source-contract / parity / freshness gates. **✅ Build-ready code STAGED 2026-06-03 in `ledger-spec/cost-index/`** (commit `5a1ca7c4ed`) — copy-paste per its README. Ports (composite-price / cost-index-sources / observation-quality) are parity-locked and **proven identical by execution** (the storefront's own 26 vectors pass against the compiled TS ports; `tsc --strict` clean incl. the worker under DOM lib). New: `fetch-sources.ts` (conditional GET + breaker + transient-only retry), `orchestrator.ts` (Promise.allSettled fan-out → screen → assess → R2 artifact; cardinal rule + last-good fallback; skips `verified:false`). **Still needs the live env / founder:** the 3 API keys (#6), source-id verification (#8), NOAA fetcher (stubbed), the `check-source-contracts` hash gate, and first-party pool stays counsel-gated (#2). **✅ Storefront integration glue SHIPPED 2026-06-03 (commit `e67851cf54`):** `scripts/fetch-cost-index-sources.mjs` (runnable orchestrator: demo mode proves the pipeline — ribeye $13.90 +5.4% — `--live` fetches with keys, skips verified:false) + `scripts/build-cost-index.mjs` (vendors → `data/cost-index.json`, fact-gated) + `scripts/check-cost-index-sync.mjs` (CI gate, wired into check-all: fact-gate + freshness + parity, 11/11 self-test, build & gate share one `pointIssues` predicate). `data/cost-index.json` ships empty (zero verified sources). Go-live sequence: get keys (#6) → verify source ids + flip verified:true (#8) → run orchestrator `--live` → `build-cost-index --artifact` → gate stays green → render layer (UI/UX) reads `data/cost-index.json`.
12. **The first-party k-anonymous SQL view** (k≥10, lagged, ranged) — code-inert until #2 (counsel) clears. **✅ Build-ready code STAGED 2026-06-03 in `ledger-spec/bench-aggregates/`** (commit `4db80ca416`). The view enforces `HAVING n_orgs≥10 AND n_vendors≥5 AND top_share≤0.40` + 4-week lag + opt-in; `toPublicBucket()` strips identifiers, bands the count, suppresses the median below k=30. **PROVEN against real PostgreSQL 16 in-sandbox:** the k-anon fixture passes 4/4 (sub-threshold + dominated cells suppressed, no identifier leak), both migrations apply clean, the MV + unique index create and `REFRESH CONCURRENTLY` works; the pure floor-lock test passes 5/5. Still **counsel-gated (#2)** for any public use; needs Neon/Worker env to deploy + the privacy-policy/DPA amendment (#3). (Note: the web sandbox HAS PostgreSQL 16 + a `postgres` user — SQL fixtures can be run here under `su postgres`.)

**Housekeeping**
13. **2 pre-existing `check-all` failures** (`Glossary verified stamp`, `Glossary article schema` idempotency) — **⚠ ENVIRONMENT-BLOCKED in the web sandbox (confirmed 2026-06-03).** Both injectors derive their stamps from git history (`inject-glossary-verified-stamp` uses `git log --reverse` first-commit date; `inject-glossary-article-schema` uses `git log -1` dateModified + `--reverse` datePublished). The web container is a **shallow clone** (353 commits; `git log --reverse` on a glossary dir returns empty), and `git fetch --unshallow` is blocked by the network policy. Running the injectors here computes WRONG dates vs. CI's full history, so committing the fix would bake in bad stamps that CI rejects — net worse. **Fix in a full-history checkout** (local clone or a CI job with `fetch-depth: 0`): run `node scripts/inject-glossary-verified-stamp.mjs && node scripts/inject-glossary-article-schema.mjs`, confirm both `--check` pass, commit the ~278-file diff. The dates are stable (first-commit based), so it converges once done with real history.

**New follow-ups from the cornerstone explainer (2026-06-03)**
14. **Six-language audio render for the new explainer** — `data/article-audio.json` has it at `status:"pending"` (sandbox has no TTS). Run `scripts/render-post-audio.mjs` in prod (Kokoro) for en/es/fr/it/pt/zh, then flip to `rendered`. The article ships with the house DRAFT comment until then (not noindex, matches the exemplar pattern). Audio scripts must clear `check-fabrications` in all six languages — the illustrative numbers are labeled, so they should pass, but verify.
15. **Plate Cost workbench-save enhancement — ❌ DECLINED 2026-06-03 (founder call).** Investigated: `workbench-save.js` adds an opt-in "Save to my Workbench" button that POSTs the recipe to the server on a signed-in click, which contradicts Plate Cost's emphatic, verifiable privacy copy (*"No accounts, no fetches, no tracking," "Network tab stays empty," "Nothing leaves the browser; close the tab and the recipe is gone."*). That promise is the trust anchor of the whole free→Ledger funnel. Founder chose **keep Plate Cost strictly private** — persistence lives in paid Ledger; the cornerstone article's "save & watch" CTA stays on Margin Math (which is positioned for it and only *loads* the script to satisfy the intent gate, without softening its own promise). Not doing it.

**Edge case logged (for whoever adds the next ES library article)**
- `inject-post-end-cta.mjs` and `inject-ledger-cta.mjs` key off `es/library/<EN-slug>/` but ES articles live at `es/library/<ES-slug>/`, so they **silently skip every ES library article** (lists them as "missing"). Those two blocks (+ `further-reading`, which no injector manages) had to be hand-authored in the ES mirror — a clone carries the source article's content there. The dir-scan injectors (`inject-smart-next-cta`, `inject-article-abstract-mentions`, `build-library` see-also) handle ES correctly. Also: `stamp-hreflang.mjs` is **non-idempotent vs HEAD** (re-running dirtied 37 unrelated library files from latent drift) — stamp only your pair or revert the collateral before committing.

---

## ✅ P0 SHIPPED — free "is my price moving wrong?" tool (2026-06-02)

Built and pushed to `claude/muntin-brand-audit-xtVSf` in `potentially-profitable`. The honest, data-free core is live; the moat layers are present-but-dormant, lighting up only when real data exists. `check-all`: 146/148 (2 pre-existing glossary failures, unrelated).

**What shipped:**
- `tools/_shared/bench-lookup.js` (+ 12 tests) — the engine. Reuses Ledger's exact `computePriceHike` (trailing-median + 8%/$5 co-gate) so the surfaces never contradict. **Identity resolution** via `stem.js` + `sku-match.js` (operator never names a canonical item — auto-bind/propose/new). **UoM handling**: same unit → exact parity; different units, one dimension → normalized ($/oz↔$/lb); opaque pack vs weight → declines, defers to Ledger's catalog. No fetch, no LLM, no naming.
- `tools/vendor-benchmark/index.html` + `es/…` — the page. Renders via `MuntinSafeHtml` (no new innerHTML; "Network tab stays empty" holds). Verdict + plain-language negotiation line; **peer-percentile and market-trend cards dormant ("soon"), never fabricated**; Ledger funnel on overpay verdicts only.
- Wired into `tools.json`, analytics EVENTS, og `cards.json`; regenerated tools index, sitemap, llms.txt, hub schema, glossary knit.

**Decisions confirmed with founder this session:** (1) item identity must be inferred, not typed — "do less, get more"; (2) UoM must be differentiated AND normalized where honest; (3) cross-operator canonicalization in Ledger = **noted, not built yet** — it's the real long pole for the peer layer (a second, independent reason that layer stays dormant beyond raw data volume).

**Known follow-ups (not blockers):** per-tool OG card renders as a placeholder PNG in-sandbox (no rasterizer) — prod build (resvg) renders the committed SVG into the real card; market-trend seed data needs network + sourcing (deferred); peer layer needs the Ledger pool + canonicalization.

---

### Original analysis (the deferral that this build superseded)

**Earlier decision was ON HOLD.** The analysis below is complete and was the basis for the build; the founder then chose to ship the honest free tool now (the tool *is* the data machine — the funnel into Ledger, where opt-in collection legitimately lives), with the peer/market layers density-gated rather than deferred wholesale.

**Why hold:** Bench is a data product wearing a UI. Its only durable differentiation is the **first-party, line-item, delivered-price benchmark** drawn from Ledger's parsed invoices — the one thing distributors won't publish and surveys can't match. That data does not exist at sufficient density yet. Without it:
- The wholesale/public-index layer is unreliable as a verdict (terminal/wholesale ≠ delivered price an operator pays) — shipping it would mislead and burn trust.
- The peer-percentile layer (the moat) is empty until cells cross k≥10.
- What remains (your-history, your-move-vs-market-trend) is real but is a **Ledger feature, not a third surface.**

A full launch now would mean shipping the marquee "vs. peers" feature empty — which would *undercut* the brand-recognition goal that motivated Bench in the first place.

**Revisit trigger:** reopen this plan when Ledger's `line_item_observations` reach **k≥10 distinct opted-in orgs across a meaningful set of (category, pack_size, region) cells in at least one region.** At that point the moat is real and the plan below executes as written.

**Highest-leverage "meanwhile" work (inside Ledger, independently valuable, de-risks a future Bench):**
1. **Start accruing the corpus legally now** — ship the opt-in "contribute anonymized prices" consent + the privacy-policy/DPA amendment (P1 prereqs below). Data can't appear later if collection consent isn't in place now.
2. **Canonical category / pack-size normalization** (the taxonomy work below) — Ledger gets better verdicts from it regardless, and it's a hard prerequisite for any future benchmark.
3. Leave active external seeding (design partners, cash-and-carry, FOIA, modeled ranges) **parked** per founder direction — revisit alongside the trigger above.

*Everything below is preserved as the ready-to-execute blueprint for when the trigger is met. No code was written; this was a planning exercise.*

---

## Context — why this, why now

Muntin runs two surfaces with a gap between them. **Muntin Digital** (`potentially-profitable` → muntin.digital) is the *learn / get-found* layer: a 4-module course, 70+ library articles, 150+ glossary terms, and 14 free static tools. **Muntin Ledger** (`Muntin-Invoice-Decoder` → ledger.muntin.digital) is the *file / operate* layer: deterministic, no-LLM invoice extraction into a ledger of vendors, line items, unit prices, and price-hike "verdicts."

The unserved middle is **decide**: the storefront *teaches* plate cost; Ledger *knows your real prices*; nothing tells an operator **"is what I pay normal?"** That is **Muntin Bench** — a free, no-login tool where an operator enters an item + the unit price they pay and sees their percentile against an anonymized peer/category benchmark, plus a plain-language negotiation talking point. It funnels to Ledger and, aggregated, becomes a citeable **"Muntin Restaurant Cost Index."**

Chosen over two alternatives (Muntin Plate = recipe↔invoice food-cost bridge; Muntin Runway = cashflow forecast) because the founder weighted **brand recognition** and **low engineering cost** — Bench is cheapest (reuses the static-tool pattern), most linkable/SEO-rich, and it *creates the data asset* the other two would later depend on.

**Naming:** "Muntin Bench" passes the `Muntin <Noun>` canon (workbench = where the muntin grid is assembled; no collision). URL slug `vendor-benchmark` (self-describing for SEO); display name "Muntin Bench."

---

## The one hard truth that shapes everything: the privacy-promise collision

Ledger's `docs/privacy-policy.md` makes an **architecture-backed promise** — *"we do not sell, rent, or share your data"* — and the existing `cost-pulse` tool's own copy/OG card explicitly say *"we don't pool data across operators."* A benchmark built from customer invoices is, technically, a new secondary use the current documents foreclose.

**Consequence (drives the phasing):**
- **P0 uses NO customer data** — only public-domain price indices. It ships brand value with zero privacy/legal exposure while consent infrastructure is built.
- **P1 (first-party data) is gated** on: explicit opt-in (default OFF), a privacy-policy + DPA amendment, a 30-day purpose-change notice, and a hard k-anonymity floor. This is a **founder decision**, not an engineering default (see Open Decisions).
- `cost-pulse`'s "no pooling" disclaimer gets **rescoped** to "your saved invoices in this browser"; Bench's pooled data is a **separate opt-in track** and never retro-pools cost-pulse's on-device data.

---

## Reconciled design decisions (where specialists converged / I broke ties)

| Decision | Resolution | Why |
|---|---|---|
| **k-anonymity floor** | **≥10 distinct contributing orgs AND ≥5 distinct vendors per cell; no single org >40% of a cell's observations** | Trust/consent (10) is the binding promise; exceeds privacy(8)/legal(5)/postgres(5)/QA(3). One enforced constant, not a convention. |
| **Where the floor lives** | A `HAVING` clause **inside** the materialized view (sub-threshold rows never materialize) **+** an exported `K_ANON_FLOOR` constant **+** a CI test that locks the value | Defense in depth: query layer + code + CI. |
| **Data recency** | **Historical only**, weekly aggregate; never current/future quotes | Antitrust "facilitating practices" risk — keeps Bench a backward-looking buyer tool, not a live price feed. |
| **Access posture** | **Buyer-side only** (verified restaurants; block supplier accounts); published ranges/percentiles, never point prices below k=30 | Antitrust: buyer-power framing is the procompetitive defense. |
| **Publish cadence** | **Weekly cron** (`0 9 * * 1`) in `apps/api` | Legal + DevOps agree weekly signals "historical aggregate," not a feed. |
| **Cross-repo transport** | Cron → R2 artifact → **build-time vendored JSON in storefront + parity gate** (primary); public `GET /v1/bench/aggregates` route as freshness/staleness signal | Preserves the storefront's static "no runtime fetch" data-promise and satisfies `check-tool-no-fetch`; runtime route is the graceful-degradation fallback. |
| **Cold start** | Seed public-domain **USDA AMS / BLS PPI / FRED** indices, labeled *"wholesale reference, not delivered price"*; swap to first-party medians per-bucket as k≥10 is met | All four sources are federal public-domain, redistributable. |
| **Benchmark JSON schema (design in P0, even if unused until later)** | Each entry carries: `category`, `pack_size`, `region` (e.g. `"us"`), `unit_system` (imperial/metric), `currency`, `p10/p25/p50/p75/p90`, `sample_n` (banded), `source`, `lastReviewed`, `source_kind` (`seed`\|`live`) | i18n, SEO, content, and frontend all depend on these slots; retrofitting after ES ships means touching 31 sheets + the tool. |
| **Result viz** | Horizontal **percentile-band strip** (p10→p90 track, IQR fill, median tick, operator marker as a *shape*), ~12 lines new CSS, CLS-safe, backed by a visually-hidden data table | Honest "where do I fall" encoding; not color-only; reuses token vars. |
| **Voice register** | Storefront editorial **"you" + imperative**; never product "we," never "I" in result blocks | Bench is a storefront tool surface. |

---

## Architecture (data flow)

```
Ledger invoices → line_item_observations (Postgres, org-scoped, opt-in only)
   └─[weekly cron, apps/api]→ mv_bench_buckets  (k≥10 HAVING; p10–p90; banded counts; no org/vendor/sku)
        └─→ R2  bench/aggregate/latest.json  +  bench/aggregate/{YYYY-MM-DD}.json (rollback)
             ├─[build-time]→ storefront data/bench-aggregates.json  (vendored, parity-gated)
             │     + data/bench-seed-indices.json (public USDA/BLS, P0 + cold-start fallback)
             │        └─→ tools/vendor-benchmark/index.html  (client-side lookup, percentile band)
             │        └─→ build-vendor-benchmark-pages.mjs → /tools/vendor-benchmark/<item>/ (Cost Index, Dataset schema)
             └─[runtime]→ GET /v1/bench/aggregates (freshness signal; edge rate-limited; honeypot cell)
```

---

## Files: create vs modify

### Storefront (`potentially-profitable`)
**Create:**
- `tools/vendor-benchmark/index.html` — the tool (copy `tools/cost-pulse/index.html` scaffold; inline critical CSS, vanilla JS, `.vb-*` namespace, percentile-band SVG, Ledger CTA). `// h8-exempt` comment on the one `fetch()`.
- `es/tools/vendor-benchmark/index.html` — P0 ships as `noindex,nofollow` stub for parity; full build in P2.
- `tools/_shared/bench-lookup.js` (+ `bench-lookup.test.mjs`) — pure lookup module (loads vendored JSON + seed indices; `MuntinBench.lookup()` → percentile, spread, deterministic talking point; no LLM, no network on default path).
- `data/bench-aggregates.json` — vendored first-party artifact (P1).
- `data/bench-seed-indices.json` — public-index seed data (P0).
- `scripts/build-bench-aggregates.mjs` — build-time fetch of R2 artifact → vendored JSON.
- `scripts/check-bench-parity.mjs` (+ `--self-test`) — hash parity gate, mirrors `check-tokens-parity.mjs`.
- `scripts/build-vendor-benchmark-pages.mjs` — programmatic Cost Index pages (mirror `build-cuisine-landing-pages.mjs`; `Dataset`+`Table`+`BreadcrumbList` JSON-LD; "no source = no page" gate).
- `library/how-to-read-a-vendor-price-benchmark/index.html` — new explainer (Muntin Desk byline).
- `tests/muntin-bench.spec.mjs` — Playwright happy-path + cold-start.

**Modify:** `data/tools.json` (add `vendor-benchmark` to `operations-margin` cluster + `goals`); `brand/og/cards.json` (tool + Cost-Index cards, honest "anonymized peer benchmark" eyebrow); `data/sourced-claims.json` (every seed number, with `source_url` + `date_verified`); `data/security-claims-exemptions.json` (the `fetch` exemption); `data/ledger-cta.json` (add `bench` source slug); `tools/_shared/analytics.js` (add `Vendor Bench Loaded`/`Vendor Bench Compute` to `calculators[]`); `data/glossary-tool-anchors.json` + relevant sheets' `pairsWith.tools` + course `m3-assemble`; `wrangler.jsonc` (build chain); `scripts/check-all.mjs` (add `check-bench-parity`); `lighthouserc.js` + `.github/workflows/window-a11y.yml` (add the new routes); rescope `cost-pulse` disclaimer copy + OG card.

### Product (`Muntin-Invoice-Decoder`)
**Create:**
- `infra/postgres/migrations/0034_bench_aggregates.sql` — `mv_bench_buckets` materialized view (joins `line_item_observations → line_item_keys → product_canonical.category`; coarse region; `PERCENTILE_CONT`; **`HAVING COUNT(DISTINCT org_id) >= 10 AND COUNT(DISTINCT vendor_id) >= 5`**; opt-in source filter; banded counts; `REFRESH ... CONCURRENTLY`; unique index; `GRANT SELECT` to `muntin_app` only — refresh as schema owner).
- `infra/postgres/migrations/0035_bench_consent.sql` — `org_settings.bench_contribution_opt_in BOOLEAN NOT NULL DEFAULT FALSE`.
- `infra/postgres/tests/0034_bench_kanon.sql` — SQL fixture: sub-threshold buckets return zero rows.
- `apps/api/src/lib/bench-aggregate-store.ts` — reader + count-banding; exports `K_ANON_FLOOR`.
- `apps/api/tests/bench-aggregate.test.ts` — **the critical privacy-leak test** (4-org & 5/19 buckets absent; 10/20 present; output carries no org_id/vendor_id/sku; `K_ANON_FLOOR === 10` lock).
- `apps/api/src/scheduled/bench-aggregate.ts` — weekly handler (clone `chain-head-canary.ts`; writes R2 `latest.json` + dated snapshot; logs counts only for `privacy-ci.sh`; LIMIT/cursor + AbortSignal cap).
- `apps/api/src/routes/bench.ts` — `GET /v1/bench/aggregates` (unauth, edge rate-limited via RateLimiter DO, honeypot cell, hashed-IP logs, `cache-control: public, max-age`).
- `scripts/check-bench-artifact-parity.mjs` (+ `--self-test`).

**Modify:** `apps/api/wrangler.toml` (`crons` += `"0 9 * * 1"`); `apps/api/src/index.ts` (cron dispatch arm + `app.route("/v1/bench", bench)`); `docs/privacy-policy.md` + `docs/dpa.md` + `docs/sub-processors.md` (benchmark purpose carve-out — **P1 gate**); `apps/web/lib/copy.ts` (consent toggle copy); `.github/workflows/ci.yml` (wire `bench-aggregate.test.ts` + artifact parity into existing jobs); `deploy.yml` (`bench-aggregate` deploy target). Outlier-flagging on the Ledger write path (poisoning defense). Optional P2: Ledger line-item "Benchmark this line" deep-link.

---

## Phasing

**P0 — Minimal lovable, zero customer data (storefront only).** Tool + percentile-band viz + deterministic talking point + Ledger funnel CTA, running on **public-index seed data only** (labeled "wholesale reference"). Cost Index hub + first programmatic pages from seed data. ES noindex stub. New library explainer + cross-links.
*Gates:* `check-all.mjs` (banned-words, fabrications, data-promise, counts), `check-tool-no-fetch` exemption, `bench-lookup.test.mjs`, Playwright e2e, Lighthouse/axe on the new routes. **No privacy/legal dependency — ships immediately.**

**P1 — First-party privacy-safe pipeline (gated on the founder privacy decision).** Consent column + opt-in UI + privacy-policy/DPA amendment + 30-day notice. `mv_bench_buckets` (k≥10 view) + k-anon CI test + SQL fixture. Weekly cron → R2 → vendored JSON + parity gate. Public route with rate-limit + honeypot. Buyer-side access control. First-party medians displace seed buckets per-cell as k is met.
*Gates:* `no-llm-ci.sh`, `privacy-ci.sh`, k-anon vitest (blocking), SQL fixture, `check-bench-parity` / `check-bench-artifact-parity`, `check-tokens-parity`.

**P2 — Reach + revenue + recognition.** Ledger deep-link param-prefill bridge; full ES/LatAm (region/unit_system/currency live; US bands suppressed/disclosed for LatAm); richer band-specific negotiation guidance; the personalized "your price vs peers" delta gated inside Ledger paid tiers (the monetization join); quarterly **"Muntin Restaurant Cost Index"** PR report.
*Gates:* `check-locale-parity`, `check-hreflang-orphans`, `check-copy-grade` (FK≤7), `check-voice-boundary`.

---

## Monetization & growth thesis
Bench is a **CAC-reduction engine, not a profit center.** Free forever: category-level, regional ranges (shareable, SEO magnet). Paid (inside Ledger tiers): the *personalized* delta, history, vendor-specific comps — the value appears only when the benchmark joins the operator's own ledger, which requires an account. **Funnel rule:** the Ledger CTA fires only on an *overpay/warn* verdict ("Bench shows this once; Ledger flags the next hike automatically"), never on a healthy verdict. The flywheel: more opt-in Ledger invoices → sharper benchmarks → more Bench traffic → more signups.

## Top risks & mitigations
1. **Privacy-promise breach** → P0 uses no customer data; P1 strictly opt-in + policy amendment + k≥10 enforced in-view + CI test; cost-pulse disclaimer rescoped.
2. **Antitrust (competitor price signaling)** → historical-only, aggregated (k≥10/≥5 vendors), anonymized ranges, buyer-side-only access, disclaimers; **outside counsel sign-off mandatory before P1 launch.**
3. **Re-identification via thin cells** → in-view HAVING + 40% dominance cap + coarse regions + banded counts + single-supplier suppression list + honeypot cell.
4. **Thin/invented data erodes trust** → minimum-N floor before any verdict; every number in `sourced-claims.json`; "wholesale reference" labeling; under-claim deliberately.
5. **Vendored dataset rot** → `check-bench-parity` hash gate + build-time refetch (the exact failure `check-tokens-parity` prevents).
6. **Scraping the data moat** → finite pre-aggregated blobs (no queryable surface), edge rate-limits, bot-score bucket, honeypot for forensic standing.

## Verification
- **P0:** `bench-lookup.test.mjs`; serve locally, confirm percentile band + talking point render and DevTools Network stays empty; `check-all.mjs` green; Lighthouse/axe green on new routes.
- **P1:** apply `0034`/`0035` to a seeded test DB; run `0034_bench_kanon.sql` (sub-threshold → 0 rows) and `bench-aggregate.test.ts` (the no-leak proof); invoke cron locally (miniflare), confirm R2 artifact has banded counts only; `curl` the route for `cache-control`; `check-bench-parity --check` after build.
- **Gates stay green:** product `no-llm-ci.sh` / `privacy-ci.sh` / `check-tokens-parity`; storefront `check-all.mjs`.

---

## Open decisions for the founder
1. **Pursue P1 first-party data at all?** P0 (public-index) ships brand value with zero privacy exposure. P1 requires **amending the "we never share your data" promise** (opt-in, anonymized, k≥10). Real brand-trust call — recommend P0 now, P1 only with explicit founder + counsel sign-off.
2. **k-anonymity floor = 10** (my recommendation). Adjustable, but it's the published promise; lower only with counsel.
3. **Antitrust counsel** before any first-party launch — non-optional for P1.
4. **Cost Index as PR strategy** (quarterly report) — yes/no, and under whose byline (Don / Muntin Desk).

---
---

