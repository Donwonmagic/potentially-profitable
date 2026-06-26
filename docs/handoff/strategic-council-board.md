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
- **Phase 1 (heartbeat harvest) — NEXT.** First task: add a real `dateModified` to ~6 high-value hub pages that now emit no lastmod (homepage EN/ES, blog/tools/glossary indexes) — derive truthfully from newest child. Then: automate weekly dispatch end-to-end, "biggest movers this week" strip on `/cost-index/`, resuscitate `/changelog/` (its prose says 2026-06-26 but JSON-LD `dateModified`=2026-05-02 → understates freshness).
- **Phase 2 (the prune):** execute locked posture via 301s, gated through locale-parity + hreflang-orphans.

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
