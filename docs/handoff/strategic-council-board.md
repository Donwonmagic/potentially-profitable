<!-- Orchestrator resume point. Committed so any future session (yours or mine)
     can pick up the queue without the founder re-explaining anything. -->

# Strategic-council board — resume here

**What this is:** the running state of the "strategic council / orchestrator" work,
externalized so a fresh session can resume in one read. The environment is
ephemeral and a new session does not remember the prior chat — only what's in the
repo survives. Update this file as threads move.

**Branches:** both repos develop on `claude/muntin-strategic-council-rqdehe`
(storefront `potentially-profitable`, product `Muntin-Invoice-Decoder`). The prior
dev branch `claude/muntin-digital-strategy-07sowb` is merged to main (storefront
PR #482, product PR #227) and closed — start fresh from `main`.

## ⮕ CURRENT STATE — read this first (updated 2026-06-27)

**Session on branch `claude/muntin-strategic-council-fzdd1j`** (PR #489 — the prior `-rqdehe` heartbeat/prune/anti-Factura work + the Worker-build fix — is **merged to main**, commit `3b3bb6cb0`). Caught up with main; `check-all` re-verified green (215/236 = the documented deploy-regenerated idempotency baseline; all hard gates + every cost-index gate GREEN even after calendar aging).

**Shipped this session:**
- **Durable cost-index fix (standing-queue #1) — DONE.** The 2026-06-26 poblano fix (commit `9239e0fe5`) only *dropped* the stale points by hand; the dead `usda-ams-los-angeles` terminal would re-poison the level on the next live refresh. Root cause: `composeIngredient` computed `levelEligible` per source (`fetch-cost-index-sources.mjs:270`) but `buildCompositeInput` (`tools/_shared/cost-index-sources.js`) ignored it — every non-index source's latest read was pushed into `levelObs`, so a stale terminal anchored the level AND left a >120d date in `level.provenance`, which is exactly what the `stale-level` gate (`check-cost-index-sync.mjs` `pointIssues`) checks. **Cure:** one guard in `buildCompositeInput` — a source contributes to the level only if `o.levelEligible !== false`; a stale terminal still feeds the **trend** (`sourceSeries`, per the line-265 design comment) but never anchors/date-stamps the level. Opt-in flag → existing callers unchanged. Pinned by a new self-test in `cost-index-sources.test.mjs` + verified end-to-end through the real engine against a poblano-style multi-terminal input (dead terminal aged out of level, gate no longer trips, both terminals still in trend). 0 new check-all failures.

- **Anti-Factura execution (standing-queue #2) — DONE** (`a8f4ebbe3`). Strengthened OUR provable commitments on `/ai`, `/never`, `/security` (EN+ES), no competitor named. **Verified each claim against the product repo** (`muntin-invoice-decoder`): `verify-explainers.ts` (`no-llm-ci` gate — "no language model ever reads the content of your invoice"; CI greps openai/anthropic/transformers/langchain, exit 1, no override), `lens-10` ("Docling runs on our infrastructure; the inference is local; no OpenAI/Anthropic/Google call in the extraction path"), the public `/promises` + `/verify/[slug]` surfaces. So "no language model in the customer-data path, runs on our own infrastructure, never trained on your data, verifiable" is true + earned-in-code — no fact fork. `/ai` "Train on your data" bullet + providers note re-anchored from studio-era "engagement letter" framing to the product path; `/never` guarantee two likewise; `/security` got a non-gated bridge sentence in the intro dek (no change to the gated claim/test/tier counts — security-claims + locale-parity stay green). Linked the proof at `ledger.muntin.digital/promises`. `dateModified` bumped honestly on `/ai` `/never` `/changelog`. Fact gate: 0 hits.
- **`/changelog` real entry (standing-queue #3) — DONE** (in `a8f4ebbe3`). A dated 2026-06-27 June entry (EN+ES) recording the trust-surface change — makes the `dateModified` bump honest (real new content, never a bare date bump).
- **ES driver-mechanism translation (standing-queue #3) — DONE** (`fbcec76d9`). Added `label_es`/`mechanism_es` to all 5 drivers in `data/cost-index-drivers.json` (faithful, preserves "association, not cause" + sourced meaning); wired `hubDriverInsight` in `build-cost-index-pages.mjs` to read them on `/es/` ("A menudo sigue a … (asociación, no causa)", "Evidencia/recuperado/fuente" drawer) with a missing-ES omission guard so a half-translated catalog can never leak English. EN output byte-identical. The 354 regenerated pages are emitted by the scheduled `cost-index-refresh` workflow (the established pattern — poblano fix didn't hand-commit pages either); only the durable source is committed.
- **Glossary-hub `dateModified` (standing-queue #3) — DONE** (`84fc54367`). Wired the glossary hub's truthful `article:modified_time` (2026-06-07) from the real `data/glossary-added.json` (newest term-added date) via `inject-hub-modified-time.mjs`; stamped `glossary/` + `es/glossary/`; regenerated `sitemap.xml`. `tools/` still skipped (no dated source).

- **`tools/start` prune (standing-queue #3) — DONE** (founder chose noindex-shelf). Applied the `method/` treatment: `<meta name="robots" content="noindex, nofollow">` on `tools/start/` + `es/tools/start/`, dropped both from the sitemap (1204→1202 URLs), page kept live, no redirect/link work, reversible. `nofollow` exempts it from locale-parity; hreflang-orphans + locale-parity stay green. (Retire+301 remains available later if the visible listing should go too — would need the Worker redirect map since `_redirects` is at CF's 100-rule cap, + repoint the ~6 inbound links.)

- **Thread D — remaining website prune — DONE (the genuine leftovers).** On grounding, most of D was already shipped: the 8 off-funnel tools were retired+301'd in `44d64cc74`, and `/method/` is already out of nav/footer/tools-hub. The real remaining debt was two things, both fixed (`2e6a0bbc7`): (1) the **primary nav still linked the retired `/start/`** on every page (a sitewide 301 hop) while the flagship **Cost Index had no nav entry** — repointed + relabelled the item to the Cost Index (`_includes/nav.html` "Start"→"Cost Index" `/cost-index/`; `_includes/es/nav.html` "Comienza"→"Índice de costos" `/es/cost-index/`), swept sitewide via sync-includes, then `inject-site-counts` to restore footer count sentinels (the documented build-chain order; net per-page diff is the nav link only); (2) removed orphaned `data/start-here-journeys.json` (referenced retired slugs, fed only the deleted `/start/`, no consumer). 0 new check-all failures.
  - **D follow-up (open — a content decision):** `library/index.html` (EN+ES) still has a hero CTA — "Three questions, one plan … we'll point you at the three articles, one tool, and one sheet that match" → `/start/` — that advertises the **retired triage feature**. It 301s to `/cost-index/`, so the promise is now unfulfilled. Needs a real decision: **remove** the section (triage is gone; the hub already lets you browse), **rewrite** it to point honestly at `/cost-index/`, or leave it. Not done unilaterally — it's a hub-hero content/IA call. (The ~126 plain in-content body links to retired tools across articles still 301 by design — board-sanctioned, no broken-link gate; not worth a 126-file repoint sweep.)

**Standing queue is now CLEAR (A–D all addressed).** Next-thread candidates: A — Muntin Plate emergent-insight catalog (design doc); B — vertical-generality build (product, separate repo); C — social pre-launch (needs founder IG decision); the D follow-up above (library hero CTA). Recommend confirming direction before the next build.

---

### Prior state (branch `claude/muntin-strategic-council-rqdehe`, now merged via #489)

Branch `claude/muntin-strategic-council-rqdehe`: **22 commits ahead of main, all pushed, working tree clean.** No PR (none requested). Product repo untouched.

**Shipped this session (all independently audited + pushed):**
- **Phase 0 — freshness foundation:** sitewide `<head>` feed-discovery links; sitemap `lastmod` derives ONLY from real `dateModified` (git-mtime removed — it was re-flattening the signal); 6 collection hubs gained truthful `lastmod` (`inject-hub-modified-time.mjs`).
- **Phase 1 — the Cost Index made genuinely useful (ADR-010):** hub "What's moving now" is now empowering + evidence-backed (sourced driver association + Evidence drawer) + **price-free** (cents stay in the per-ingredient cited Market-read block) + a **price-free indexed movement chart** (`indexedMovement()`, hub mini + per-ingredient large). Fact-gate-reviewed 3× (caught + fixed a down/"up-and-holding" contradiction and an eggplant "rose"-while-falling).
- **Phase 2 — prune COMPLETE:** `method/` + 19 widgets noindex-shelved; 31 off-funnel sheets legacy-shelved; course nav-dot de-wired; **8 tools + `start/` retired+301** (full migration — Worker map `src/lib/tool-redirects.js`, regression-tested `scripts/test-tool-redirects.mjs`).
- **Strategy:** Factura competitive audit → `docs/strategy-anti-factura-positioning.md` (honesty-labelled, NOT publish-ready).

**Gate baseline (CRITICAL for counting regressions):** `check-all` = **~22 failing**, ALL deploy-regenerated idempotency drifts (CSS shells/cache-bust, glossary knit/OG/script/stamp/schema/sidecar, sheet/topic/tool rails, sheet OG cards, themes/theme-story/cuisine builders, warm-palette, RSS, llms.txt, hub schema, H2-anchors, lazy-loader, cost-index sync). These are NOT failures — the deploy regenerates them. **Only count NEW ones.** The hard gates are GREEN: locale-parity, hreflang-orphans, **check-fabrications**, check-intent-param-targets, check-audit-fetch-timeouts.

**NEXT QUEUE (recommended order):**
1. **Act on Factura** — strengthen `/never` `/security` `/ai` with the no-training / deterministic / "your data is yours" commitments (state OUR commitments; do NOT name Factura; ToS wording needs egress-verified before any public reference). Fact-gated prose.
2. **Prune leftovers** — `tools/start/` (survivor "pick a tool" page), tools/glossary hub `dateModified` source (need a real one — don't invent), ES driver-mechanism translation for the hub insight, a real `/changelog` entry (its 2026-05-02 date is HONEST — don't bump without new content).

Full detail + the tools-migration replacement map + gotchas are in the sections below. Cross-refs: `ADR-010` (insight grammar), `docs/plans/website-heartbeat-and-prune.md` (audit synthesis), `docs/strategy-anti-factura-positioning.md`.

## The singular vision (the thing everything ladders to)

muntin is the honest, privacy-first, operator-built, **modular** restaurant
cost-intelligence company — Cost Index + free tools + Muntin Ledger (invoice
decode, inventory, Plate). Pre-release toward GA (Ledger 2026-11-13). The moat is
**trust vs. conflicted incumbents**. Brand line: **"Modern tools. Old-fashioned
honest."** — earned in the code (deterministic, no-LLM in the customer-data path,
private, your data is yours).

## Operating mode

Cadence: **ground → build → audit → iterate**, run as a quiet subscript (not a
ceremony). Lean. Dispatch heavy reads/builds to sub-agents to preserve context.
Record decisions as ADRs (open decision logs). Commit increments to the dev branch
(reviewable); **no PR without an explicit ask**. Surface only genuine forks.
Don't loosen gates. Fact gate is absolute (it's spoken aloud in EN+ES).

## Shipped (this session — all committed + pushed)

| Thread | Result |
|---|---|
| Article enrichment | ADRs 005–009; `check-article-graphics` gate now counts `table`/`data-figure-kind` toward variety (backward-compatible, tested); pilot post `service-charge-vs-tipping-model` (EN+ES) uses a `viz-table` |
| Visual-system foundation | design ADR-001 + `docs/brand/visual-system.md` (the spine duality = the positioning); 2 CI guards (`check-og-accents` wired, `check-stone-2-usage` report-mode); craft tokens |
| OG-card rebrand | `home`/`learn`/`about` (EN) + `home-es`/`about-es` (ES) → "Modern tools. Old-fashioned honest." / cost-intelligence; orphaned retired-services cards removed (770→768) |
| Honest landing-claim fix | product `page.tsx` reworded (claim the universal core, drop untested verticals) |
| Cost Index "of record" | last gap closed — per-ingredient driver attribution for flagged movers (standing context, not causation) |
| **Landed** | storefront **#482** + product **#227** — reviewed and **merged to main** |

## The queue (remaining threads)

### A. Muntin Plate — emergent-insight catalog  *(design deliverable)*
- **Ground:** `docs/plans/muntin-plate.md` (build-ready costing plan) + `docs/plans/muntin-insight-layer.md`. Dedupe against the MVP/V2/V3 phasing.
- **Build:** draft the catalog of insights only possible from the *unity* of datasets (invoices × recipes × Cost Index × inventory × yields × dormant cohort). Flagship example: **vendor-vs-market discrimination** (your vendor raised romaine but the market index is flat → markup, here's the lever). Each insight: inputs, owner-facing one-liner (EN+ES), trigger/cadence, single action, confidence/honesty handling, privacy class, phase.
- **Constraints:** deterministic/no-LLM, show-your-work, empowerment ship-test, privacy (cohort insights dormant until opt-in + k≥10 + ratios-only + antitrust counsel), costing ≠ inventory.
- **Output:** a design doc/ADR.

### B. Vertical-generality build — *earn* the "any small business" claim  *(product feature)*
- **Why:** PR #227 made the claim honest by softening it; this makes it *true*.
- **Ground:** decoder onboarding/seed — `apps/api/src/lib/categories-store.ts` (`seedDefaultsForOrg` seeds `RESTAURANT_DEFAULTS` for every org; no vertical selector), `gl-seed.ts`, the extraction golden suite `services/extract/tests/golden/cases.py`.
- **Build (evidence-first, smallest increment):** add non-restaurant fixtures (retail/services/professional invoices) to the golden suite and verify the deterministic core extracts vendor/date/total/line-items. Then the real feature: a **vertical selector at onboarding** + **non-restaurant category taxonomies**.
- **Audit:** product CI — `check-verboten-phrases`, `check-voice-boundary`, `check-copy-grade`, vitest, the extraction golden tests.

### C. Social pre-launch  *(strategy + execution)*
- Prompt already delivered. **Founder decision needed:** Instagram revive-vs-fresh-start; Bluesky activation.
- Tie to the new brand line + the content engine (weekly Cost Index dispatch, rebranded cards). Next concrete: the IG decision, then the pre-launch anticipation arc + first posts.

### D. Website refresh — heartbeat + prune  *(audit done → awaiting founder go)*
- **Plan:** `docs/plans/website-heartbeat-and-prune.md` (synthesis of a 4-specialist read-only audit).
- **Core finding:** cost-intelligence core is clean; over-extension = studio/course-era survivors (`method/workshop/` 19 widgets, off-funnel `/tools/` clusters, `course-*`/`brand-design`/`local-seo`/`conversions` sheet packs, `start/`, frozen-course nav plumbing). Freshness engine already half-built but a **P0 sitemap `lastmod` bug** (bulk-stamped → crawlers distrust it) is the literal cause of the post-refresh trail-off.
- **Phase 0 — SHIPPED + pushed** (`claude/muntin-strategic-council-rqdehe`, commits `098f3de1`→`83023f46`→`f6e1791a`): `<head>` feed-discovery `<link>` tags sitewide (1328 pages, anchored ABOVE the i18n:hreflang region); sitemap `lastmod` now derives ONLY from real `dateModified` (git-mtime fallback DELETED — adversarial review caught that it would re-flatten ~1030 URLs on every sitewide pass; honest-absent is the fix). 298 URLs truthful-dated, 1030 omit lastmod (spec-valid). Phase 0c regen-on-deploy already covered by the weekly dispatch workflow. 0 new check-all failures vs main (baseline = 20–21 deploy-regenerated drifts on main itself, not ours). Adversarially reviewed twice → SHIP.
- **Posture LOCKED (founder):** prune = retire+301 Tier 1, legacy-shelf Tier 2, de-wire course nav dot. Start point = Phase 0 (done).
- **Phase 1 (heartbeat harvest) — IN PROGRESS.**
  - **SHIPPED** (`b99e1b1b`+`b4d216b7`, ADR-010): the Cost Index hub "What's moving now" is now an *empowering, evidence-backed* insight per mover — magnitude + as-of + measured persistence (elevated N weeks) + the verdict engine's note + a **sourced driver association** (mechanism + Evidence cite drawer, labelled "association, not cause", up-read-only) + action + full-read link. Grammar recorded in **ADR-010** (= first entry of the Plate insight catalog, queue A). Twice adversarially fact-gate-reviewed (caught + fixed a down/"up-and-holding" contradiction). The cost-index hub also gained a truthful `dateModified` lastmod. ES gets the structural enrichment minus the EN-only driver mechanism (catalog has no ES prose → **follow-up: translate `data/cost-index-drivers.json` mechanisms/labels or add `mechanism_es`**).
  - **SHIPPED** (`009bbce2`): hub is now **price-free** — live cents stay in the per-ingredient cited Market-read block only (founder confirmed; ADR-010 updated).
  - **SHIPPED** (`e0a15d9f`): **price-free indexed movement chart** (`indexedMovement()`) — hub mini sparkline + per-ingredient large chart, normalized to 100 at the window's first read, true-to-scale, caption labels the REAL date window (never claims a span we lack), direction word derives from the index endpoint so it can't contradict the curve. Fact-gate reviewed (caught + fixed eggplant "rose" while index fell to 57). Reuses `MuntinSparkline`.
  - **SHIPPED** (`f6f1275c`): truthful `article:modified_time` on 6 collection hubs (homepage/blog/library EN+ES) via `inject-hub-modified-time.mjs` (newest-child date) → they now carry a sitemap `lastmod`.
  - **Remaining:** `tools/` + `glossary/` hubs still lastmod-less (their children carry no `dateModified` — need a real date source, e.g. `data/glossary-added.json` / a tool-release date — do NOT invent). `/changelog/` is **honestly dated** (2026-05-02 matches its newest May entry — the earlier "stale" claim was a misread); to freshen it, WRITE a real new entry (content task), never bump the date alone. Weekly dispatch automation = already DONE (verify `COST_INDEX_BROADCAST_SECRET`). ES driver-mechanism translation for the hub insight still pending.
- **Phase 2 (the prune) — IN PROGRESS.** Redirect mechanism = `/_redirects` (CF Pages, `SOURCE DEST 301`; existing precedent lines for retired services/tools). Gate notes: removing an EN page needs its ES twin too (locale-parity); noindex+**nofollow** exempts a page from parity; only `tools.live` count (13→5) changes; sheets aren't counted.
  - **SHIPPED** (`cf8c2c0e3`): `method/` + 19 workshop widgets noindex-shelved (EN+ES, 40 pages dropped from sitemap). **ADAPTATION:** these were Tier-1 (retire+301) but the frozen-but-live course links into `method/workshop/rhythm-calendar`, so 301 would break a kept-live surface → noindex-shelf instead. Follow-up: drop `/method/` from `_includes/nav.html` + `tools/index.html` (needs the sync-includes sweep).
  - **Remaining Tier 1 (retire+301) — RE-SCOPED: this is a MIGRATION, not a prune. Attempted 2026-06-26, executed in full, then DISCARDED uncommitted** because it shipped breakage. **Finding:** the 8 off-funnel tools (`gbp-grader, store-hours, storefront-health, menu-copy, photo-brief, menu-converter, brand-suite, restaurant-audit`@`tools/audits/restaurant/`) are first-class data-model entities, not lightweight pages — they're referenced across `data/cross-surface-map.json` (~70), `data/post-end-cta.json` (~42), `kind-registry`, `og-coverage`, `glossary-tool-anchors`, AND have ~12 dedicated test files + scorers (`test-gbp-scorer`, `test-menu-copy`, `test-photo-brief`, `test-brand-suite`…). Deleting the pages broke 2 fail-CI gates: **`check-intent-param-targets`** (128 injector-emitted `intent=` deep-links across ~30 articles point at the removed tools — they come from `data/post-end-cta.json`/`cross-surface-map.json`, fix the SOURCE not the outputs) and **`check-audit-fetch-timeouts`** (hardcodes `tools/audits/restaurant/index.html`). Also stale: a hand-maintained `ItemList` JSON-LD (`numberOfItems:14`) in `tools/index.html` + ES still advertising the 8 retired tool URLs. **DO THIS AS A DEDICATED, SCOPED MIGRATION:** decide each retired tool's replacement target (live tool vs `/tools/` hub vs `/cost-index/`), retarget the CTA/cross-surface configs + re-run injectors, fix the 2 gates' target lists, update the ItemList, retire the scorers/tests, THEN delete pages + add 301s. The redirect chain-repointing (store-hours/restaurant-audit are 301 targets of open-hours/holiday-hours/audit/wellness) was worked out and is in this session's discarded diff if needed. The chain repoints + tools.json 13→5 mechanics are sound — it's the cross-surface/test/CTA unwinding that makes it a migration.
  - **Cleaner low-entanglement prune still available (do these as a focused pass, NOT entangled with the tools):** Tier-2 sheets legacy-shelf + Tier-3 course nav-dot de-wire (below). Or apply the **method/ treatment (noindex-shelf, keep live)** to the 8 tools as a lighter interim — drops them from search without the data-model unwind — if the visible `/tools/` listing reduction can wait.
  - **Tier 2 (legacy-shelf) — SHIPPED** (`a07628e8d`): `data/sheets.json` 6→2 packs / 46→15 sheets; 31 off-funnel sheets noindex+nofollow'd EN+ES (66 pages, dropped from sitemap, kept live). Also fixed a latent crash in `sync-sheet-og-cards.mjs` (`preserved`→`filtered`).
  - **Tier 3 (de-wire) — SHIPPED** (`a07628e8d`): course nav-dot block removed from `_includes/nav.html`, propagated sitewide.
  - **Tools migration — SHIPPED** (`44d64cc74`): 8 off-funnel tools + top-level `start/` retired+301 (full migration: refs retargeted before deletion so gates stayed green; 301s via new Worker map `src/lib/tool-redirects.js` since `_redirects` was at CF's 100-rule cap; regression-tested `scripts/test-tool-redirects.mjs` 14/14). `tools.json` 13→5 (operations-margin only). 0 new check-all failures; 2 baseline resolved. **Prune follow-ups (off-funnel survivors, not blockers):** `tools/start/` (the "pick the right tool" page, distinct from the removed top-level `start/`) still has plain links that 301 cleanly — a reasonable next prune; `data/start-here-journeys.json` references retired slugs but feeds only the deleted `start/` (no gate consumes it). Hundreds of plain in-content body links to retired tools 301 via the Worker map by design (no broken-link gate exists).
  - **Tools-migration REPLACEMENT-TARGET MAP (used; intent=watch went to `margin-math` not cost-pulse — cost-pulse isn't watchable):**
    - `menu-copy`, `menu-converter` → `/tools/menu-engineering/` (live, menu-related)
    - `gbp-grader`, `storefront-health`, `photo-brief`, `brand-suite`, `restaurant-audit`, `store-hours` → `/tools/` hub (plain links)
    - ANY `intent=watch` deep-link (gate needs a live *watchable* tool) → `/tools/cost-pulse/`
    - Then: retarget `data/post-end-cta.json` (~42) + `data/cross-surface-map.json` (~70) + glossary-tool-anchors etc. → re-run injectors; fix `check-intent-param-targets` (source-level) + `check-audit-fetch-timeouts` (drop the removed audit page from its TARGETS list); update the hand-maintained `ItemList` JSON-LD in `tools/index.html` + ES (numberOfItems 14→5); retire the ~12 scorers/test files; THEN `git rm` the 9 dirs + add 301s (chain-repoints worked out, in the 2026-06-26 discarded diff). Sheet-shelf left 5 deploy-regenerated idempotency drifts (sheet sidecar/OG-cards/tool-rail/topic-rail/site-counts) — regenerate-on-deploy class, not failures.
  - **Sitewide-sweep caveat:** nav/footer/count-sentinel edits trigger a `sync-includes`/`inject-site-counts` re-stamp entangled with main's pre-existing drift; scope each commit like the dispatch workflow (`git add <targets>; git checkout -- .`) or commit the full intended sitewide sweep deliberately.

### (Note) Cost Index convergence — *coordinate, don't duplicate*
`main` is building the convergence plan's "Fair-Price Audit" (market-prior invoice auto-audit, lighting up `verdict_compute.py`). Stay clear of that lane.

## Parked decisions / locked lockups

- **EN lockup (locked):** "Modern tools. Old-fashioned honest." / subhead "The cost sense the big players have — sourced, private, and on your side." Lives on the OG cards. **Deliberately NOT forced into the homepage H1** — that H1 is already a strong specific-value hero ("Know what every plate costs before the week eats the margin.").
- **ES tagline (locked):** "Herramientas modernas. Honradez de toda la vida." (on `home-es`).
- **Product sibling line:** default **"No black box."** (Register B) — recorded, not yet applied (product hero already strong/gate-clean; apply only if desired).
- **Enrichment ADRs 005–009:** PROPOSAL status. Shipped: gate amendment + pilot. Remaining: image kinds (photo/scan/render) + ADR-008 provenance gate + more pilots; then ratify.
- **Visual Tier-3 aesthetic** (Golden Hour / focus modules): **recommended SKIP** — the system is already gold-standard; restraint.

## Gotchas (save a future session the rediscovery)

- **`check-all` baseline:** ~230/237, **7 known idempotency failures** the deploy regenerates (CSS shells, CSS cache-bust, glossary verified-stamp, glossary article-schema, themes review-board, theme story pages, cuisine landing pages). These are **not** your failures — only count NEW ones.
- **OG cards render locally** via `@resvg/resvg-js` at `/tmp/og-render-deps` (no `rsvg-convert`); committed PNGs can be `Read` to see/verify a card. Build one: `node scripts/build-og-cards.mjs <slug>`.
- **es-MX voice gates (product)** are strict: no `inteligencia artificial`, `sin esfuerzo`, regressive tone, or "no AI" — describe the *mechanism* ("never a language model") instead.
- "The window in." is **sanctioned brand equity** (the muntin/window metaphor), not stale — keep it.
