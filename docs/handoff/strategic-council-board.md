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
  - **Remaining Tier 1 (retire+301):** off-funnel tools — `gbp-grader, store-hours, storefront-health, menu-copy, photo-brief, menu-converter, brand-suite, restaurant-audit` (at `tools/audits/restaurant/`) + ES twins; `start/`. **CHAIN HAZARD:** `store-hours` + `restaurant-audit` are themselves 301 *targets* of other rules (`open-hours`/`holiday-hours`/`audit/*`/`wellness`) — repoint those upstream to `/tools/` or accept a hop. Update `data/tools.json` (retire 8 → keep operations-margin only), rebuild tools index + site-counts (13→5) + sitemap.
  - **Remaining Tier 2 (legacy-shelf):** off-funnel sheet packs in `data/sheets.json` — `brand-design`, `local-seo`, `conversions`, `course-bootcamp` (~31 sheets). Mechanically: drop the pack/slugs from `packs[]` (keeps `build-sheets-index.mjs` consistent) + add `noindex,nofollow` to each `sheets/<slug>/` + ES twin.
  - **Remaining Tier 3 (de-wire):** course nav dot — `_includes/nav.html` lines ~194–214 (`fetch('/api/course/progress')`), then `sync-includes.mjs`.
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
