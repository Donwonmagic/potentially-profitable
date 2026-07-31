# CLAUDE.md

Project memory for Claude Code sessions on `muntin.digital` — a one-person, **product-only** restaurant company in Silver Spring, MD (the Cost Index, free operator tools, and Muntin Ledger; the website-build/services line is retired). Static site (HTML + inline CSS + a few sentinel-driven build scripts), no framework, no CMS.

## Recent retirements & freezes (keep new work on-funnel)

New work consolidates around the cost-intelligence funnel (the Cost Index, the live free tools, Muntin Ledger). Do **not** reinvest in these:

  - **Retired 2026-07-28:** the build-a-website course (`/course/`), the method-manifesto + Workshop-Kit pages (`/method/`), and the course-companion sheet pack (`/sheets/course-*`, 15 EN + 15 ES). The whole "Open the Doors" subsystem was torn out — its course CI gates + injectors, the 4 rail injectors (`inject-{topic,article}-course-rail`, `inject-tool-course-crosslink`, `inject-glossary-lesson-sidecar`) whose CTAs were stripped from ~91 pages, the data manifests (`course-lessons.json`, `course-releases.json`, `glossary-course-anchors.json`, `assets/data/course-titles.json`), and the RSS course lane. All paths **301 to the funnel** (course/method → `/cost-index/`; the sheet pack → `/sheets/`). Left **dormant** for a follow-up: the `/api/course/*` KV runtime + `src/lib/course.js`, the `/account/` course-progress tile, the course email lifecycle (`lifecycleCourse*`), and the `/window/` course-contact JS branch — all invisible with no course pages to feed them.
  - **Cut 2026-06-17:** fr/it/pt/zh article audio (EN + ES only now); the "coming soon" tool roadmap (the 6 unbuilt tools removed; `data/tools.json` `roadmap` is empty; `tools.coming` = 0).
  - **Retired earlier:** the web-studio services tiers (301 to `/studio/`, which is now the company page); the Menu Design Suite + Invoice Decoder tools (their `/never/` marketing was removed 2026-06-17).
  - **Prune candidates (off-funnel, do not expand):** the brand/design operator-sheet pack.

## Where things live

  - `library/<slug>/index.html` — evergreen reference articles (the "library").
  - `blog/<slug>/index.html` — timely dispatches (the "blog"). `blog/drafts/<slug>/` for unpublished posts.
  - `es/library/<slug>/`, `es/blog/<slug>/` — Spanish translations. EN ↔ ES slug map in `data/i18n-slug-map.json`.
  - `glossary/<term>/`, `tools/<tool>/`, `sheets/<sheet>/` — companion surfaces.
  - `docs/` — editorial canons and reference docs (not web-routable).
  - `scripts/` — build, inject, and check scripts. ~70 of them.
  - `data/` — JSON manifests (sourced claims, audio coverage, slug map, site counts).
  - `_includes/` — shared HTML partials (nav, footer).

## Continuity & decisions (read first in a fresh context)

The container is ephemeral; only what's in the repo survives a context reset. To resume:

  - **`docs/handoff/strategic-council-board.md`** — the resume-here board. Its top "CURRENT STATE" block is the latest thread's shipped work, in-flight items, runbooks, and open questions. Update it as threads move.
  - **`docs/editorial/decisions/ADR-NNN-*.md`** — Architecture Decision Records (context → decision → consequences). Record every non-trivial decision here. Cost-Index / data decisions: ADR-010 (insight grammar), **ADR-011 (notable price events surface), ADR-012 (Vendor Benchmark market-context), ADR-013 (NASS/Census/EIA data-sources policy), ADR-014 (cold-storage deseasonalization), ADR-015 (open-data explore surfaces — co-movement honesty + the CC0/CC-BY split + per-event page date semantics)**.
  - **Method:** ground → build → audit → iterate, convening expert-panel sub-agents / workflows at the forks and adversarially verifying. Surface only genuine forks; don't loosen gates; the fact gate is absolute.
  - **Events surface** (ADR-011): detection (`data/cost-index-events.json`) × the cited registry (`cost-index/events.json`) as **co-occurrence, never cause**, on ingredient pages + `/cost-index/events/`. Gated by `check-cost-index-events.mjs`.
  - **New public data (ADR-013):** NASS/Census/EIA are US-gov public-domain (redistributable). Honest subset only — never the measured tier or the Vendor Benchmark reference. The live fetch runs on the operator's Mac (keys + network); the container has neither.

## Editorial canons (binding for any prose change)

  - `/methods/index.html` #voice-contract — site-wide voice contract, banned-words list, CTA canon, POV-by-page-type table. Governs.
  - `docs/voice-canon-library.md` — library articles. Byline is **The Muntin Desk**; first-person "I" only when naming personal operator practice.
  - `docs/voice-canon-blog.md` — blog dispatches. Byline is **Don Goldstein**; first-person "I" is the narrator's seat.
  - `docs/voice-canon-sheets.md` — operator-sheets canon.
  - `docs/fact-check.md` + `data/sourced-claims.json` — the absolute fact gate. Every number, date, name, anecdote, percentage must be (a) registered in `sourced-claims.json`, (b) cited inline via `<details class="cite">`, or (c) labeled illustrative in the prose. Zero inventions.

The operator bio: **Don Goldstein, full-time Front-of-House Manager at Tacombi — one restaurant brand, two locations: Bethesda, MD and Arlington, VA.** Past roles live in `/about/#timeline` and in `data/sourced-claims.json#operator_experience_claims.past_roles`. Tacombi is one restaurant with two locations — "Bethesda and Arlington," "both locations," and "DMV locations" are all true. What stays blocked by `scripts/check-fabrications.mjs` is any framing of Don as running a *second restaurant* or multiple distinct restaurants (rather than one brand across two locations).

## Key gates

CI orchestrator is `scripts/check-all.mjs` — runs the wired `check-*.mjs` scripts in sequence and fails fast. It also runs inside the Cloudflare deploy (`wrangler.jsonc` `build.command`), so **a failing gate blocks the deploy** — never wire a gate that is currently failing.

  - **A scanner is only as good as its root list — declare roots, justify omissions.** Learned three times on 2026-07-28, each time by shipping the bug first: (1) a glossary link-graph omitted `learn/`, "found" 11 orphaned cost terms that were not orphaned, and **froze 4 pages a live page still linked**; (2) `check-positioning-drift` scanned only `library/blog`, so the gate written to catch retired-line content could not see `/learn/start-here/`, the worst offender on the site; (3) `check-claim-usage`'s inverse direction indexed 483 of 1428 pages, hiding citations from `/methods/` — and `used_in` is published in the public `/claims.json`. **Rule: a script that scans the site walks everything and carries an explicit skip list, where every entry says why it is not reader-facing prose.** Narrow scope is fine when it is the subject (`check-ingredient-jsonld` → ingredient pages); silent scope is not. When widening a scan explodes the finding count, fix the *cause* rather than tolerating noise — self-referential `muntin.digital` source URLs live in the footer of every page, so matching them finds chrome, not citations.

  - **Idem coverage** (`check-idem-coverage.mjs`) — `check-all` `--check`s 96 `(idem)` builders **and runs at the end of the deploy `build.command`**, so a builder it verifies but nothing re-runs turns drift into a red deploy no automation can clear. Every one must be run by the deploy, run by a named workflow, or listed in that script's `MANUAL` registry with **who runs it and when it drifts**. Today: 83 builders — 59 deploy, 6 workflow, 18 manual (8 of those render operator-fetched data). The 13 `/course/` entries were removed on 2026-07-29 **because the gate demanded it**: PR #530 deleted those builders and `staleManual` failed until the registry caught up. **`inject-knit-rail.mjs` is the highest-churn manual one — run it after any article add, freeze, or retire.**

  - **`build-library.mjs` STRIPS THE `noindex` FREEZE. Never run it to "refresh" after an article add.** Measured 2026-07-31 on a clean tree: one run took glossary pages carrying `noindex, follow` from 146 to 4 — it unfroze 142 pages, silently undoing the positioning work, and `check-positioning-drift` still passed because the pages it unfroze are glossary terms rather than articles. Only the raw count catches it. It is **not** in `build.command`, so the deploy never does this; the exposure is entirely from a human or a session running it by hand, which the article-release habit invites. `build-library-recent.mjs` is a milder version of the same shape — it regenerates the `/learn/topics/*` pages from a template and drops the injected feed-discovery, CSS-shell, cache-bust and topic-schema blocks — but it IS early in `build.command`, so the deploy re-injects and only a standalone run leaves the page half-built. **After any article add, verify `grep -rl 'content="noindex' --include=index.html . | wc -l` is unchanged before committing.** That count is the freeze, and nothing else guards it.

  - **A partial replay of a pipeline is not evidence about the pipeline.** The theme/cuisine builders were misdiagnosed twice (2026-07-31): filed for months as "(idem) noise" when they were blocking the deploy, then recorded as "running them is a regression that strips injected critical CSS" — a conclusion drawn from running the builders followed by only *part* of the injector tail, with `inject-critical-fonts` (the step that emits the `/* perf-critical */` block) missing. The half-processed page was read as the builder's doing. The full replay showed they were idempotent all along and simply were not in `build.command`. **Run the whole chain or claim nothing about it** — and when a page looks damaged after a builder, suspect the replay before the builder.

  - **Positioning drift** (`check-positioning-drift.mjs`) — this is a cost-intelligence company. Any INDEXED page whose prose carries ≥3 retired-line web-design phrases must be frozen (`noindex, follow`) or listed in `ALLOW` with a dated reason. It deliberately does not auto-classify; it only guarantees the judgement is made and written down.

  - **Gate coverage** (`check-gate-coverage.mjs`) — the meta-gate, and it runs first. Every `check-*.mjs` on disk must be either wired into `check-all` or listed in that script's `UNWIRED` registry with a date, its current pass/fail status, and a reason. There is no third state, so a gate can no longer be written and silently never run. As of 2026-07-29: 4 documented-unwired (two of which fail, which is exactly why they must not be wired before their violations are fixed). The `/course/` entry was removed when PR #530 deleted that script — the gate flagged it stale rather than letting the registry outlive what it documented.

  - **The meta-gate does NOT see GitHub Actions — that lane is guarded by hand.** `check-gate-coverage` enumerates `scripts/check-*.mjs`; a workflow job carrying `continue-on-error: true` reds its CHECK while the RUN still concludes `success`, so it is invisible to both the gate and the eye. Found 2026-07-31: three workflows had been advisory for two months under headers promising promotion (`playwright.yml` "promote to required-check once three consecutive PRs land green", `lighthouse-ci.yml` and `window-a11y.yml` "← remove when the baseline is locked"), and two of them were failing the whole time — one test had been red for **six weeks** after hard-coding a tool tier that the roadmap cut removed. **Playwright is now blocking and `@playwright/test` is pinned** (a screenshot gate whose browser version floats will red on any upstream chromium bump — tolerable while advisory, a false-red generator once it blocks; bump the pin and the baselines in the same commit). `lighthouse-ci` + `window-a11y` remain advisory — lhci is red on an unexplained `errors-in-console` on `/es/sheets/`, and **a failing gate must not be promoted before its violations are fixed.**

  - **Fabrication blocklist** (`check-fabrications.mjs`) — blocks the May-2026 fabrication patterns (invented cohorts, fake URLs, the "two restaurants" bio drift). Fail-CI.
  - **Article graphics** (`check-article-graphics.mjs`) — 9 rules per article: ≥2 content figures, ≥2 distinct viz-* kinds, ≥80-char `data-audio-alt`, `<figcaption>` per figure, teal↔rust tone balance, viz-bars `--w` vs num consistency, cross-post dedup, no autolink markers inside attribute values, and **rule 9 — signed data may not ride a one-directional `viz-bars`** (labels mixing + and − must use `viz-diverge`; detection keys on the numeric labels, never `data-tone`, since ~60 figures legitimately use rust/teal for pass/fail categories over all-positive values). Per-slug `HISTORICAL_WAIVERS` + `DEDUP_ALLOW` allowlist, both with dated comments. `GENERATED_ROOTS` (`cost-index/`, `es/cost-index/`) are additionally scanned for figure QUALITY only — rules 3, 4, 6, 8, 9 — because those pages are template-built, carry no `id="post-body"`, and may legitimately ship one figure or none; pages without figures are skipped.
  - **Article graphics tests** (`run-article-graphics-tests.mjs` → `test-article-graphics.mjs`) — `node:test` suite that pins the gate's parser behavior. Run manually with `node --test scripts/test-article-graphics.mjs`.
  - **Overview quality** (`check-overview-quality.mjs`) — stricter bar for batch overviews (≥5 H2, ≥3 figures with ≥1 viz-bars, capstone present, audio not pending, ≥5-min read).
  - **Image dimensions / formats / lazy** (`check-image-dimensions.mjs`, `check-image-formats.mjs`, `check-lazy-images.mjs`) — CLS / LCP guards.
  - **Site counts** (`inject-site-counts.mjs`, `build-site-counts.mjs`) — `<!-- count:KEY -->N<!-- /count -->` sentinels. Source of truth is `data/site-counts.json`.
  - **Locale parity** (`check-locale-parity.mjs`, `check-hreflang-orphans.mjs`) — EN ↔ ES surface parity.
  - **Cost Index sync** (`check-cost-index-sync.mjs`) — the vendored-index fact gate. `data/cost-index.json`'s `points[]` is **append-only and newest-first**, and **`points[0]` is the current read every consumer renders**; `points[1..n]` are the archive behind it, and `history[]` is the deeper curve. Freshness (`stale`, `stale-level`, 120d) applies **only to `points[0]`** — `pointIssues(…, { current })`, defaulting to `true` so a caller must *say* a point is archival. Everything else (verified, bounded, provenance, non-empty) applies to every point. Scoped 2026-07-31: applied flat, the gate could not be satisfied by any action automation can take, because the refresh appends points and never removes them, so each series aged into a red on a fixed clock — on 2026-07-30 that reddened 23 ingredients over archival points and buried the one real finding. A `stale` red means **the feed behind the current read stopped**; no CI rebuild clears it. The per-ingredient dead-feed roster is `check-cost-index-series-freshness.mjs` (18 frozen today, with days-to-cliff); the 10 `KNOWN_SOURCE_LATENT` slugs in `check-cost-index-basis-leak.mjs` have no free wholesale source at all, so for those a re-vendor only helps when the upstream itself moves.
  - **Cost Index driver catalog** (`check-cost-index-drivers.mjs`) — validates the standing driver catalog (schema, source+`retrievedAt`, freshness) and blocks any driver named in a dispatch that has no catalog entry. Fail-CI.
  - **Cost Index editor's note** (`check-cost-index-editors-note.mjs`) — the optional "from the floor" note: every number must trace to the edition snapshot or `sourced-claims.json`; no forecast; bio discipline. Fail-CI.

## viz-* graphic families

Defined in `assets/site-article.css`. New article figures should use these wrappers (`viz-figure` is the post-Phase-1 marker; `article-figure` is the pre-Phase-1 wrapper still in use across some ES mirrors):

  - `viz-bars` — measured share, before/after on a single metric, comparative ranking. **Same-sign values only** — see `viz-diverge` for signed data (rule 9).
  - `viz-diverge` — SIGNED data on a zero-centred axis (a read vs baseline, a contribution, any +/− change). Length = magnitude, **side = direction**, colour reinforces. `data-dir` (pos/neg) sets the side and `data-tone` the sentiment, so a metric where *down is bad* renders rust-on-the-left.
  - `viz-split` — one stacked bar showing how a whole divides into named parts, every part drawn (the honest replacement for a ring that renders only one slice). `.viz-splitrow` stacks several for comparison.
  - `viz-flow` — mechanism sequences, the order a process walks.
  - `viz-tree` — decision diagnostics, branching troubleshooting. Library leans here.
  - `viz-ba` — before/after rewrites of a specific paragraph, profile, or schema block.
  - `viz-ring`, `viz-waterfall`, `viz-gauge`, `viz-spark`, `viz-hero`, `viz-scroll` — see canon §8 in `voice-canon-library.md` for each one's job.

Every content figure carries `data-audio-alt` (full narration, not alt text), `<figcaption>` (one-sentence takeaway), and a `<details class="cite">` drawer when the data is sourced.

## Audio pipeline

  - Manifest: `data/article-audio.json` — per-article `{ path, title, languages, status, owner }`. Status is `rendered`, `partial`, `pending`, or `deferred`.
  - Per-post scripts: `<post>/audio.json` + `audio.<lang>.json` for `en/es/fr/it/pt/zh`. MP3 sibling files render via `scripts/render-post-audio.mjs`.
  - Audio script `text` is read aloud verbatim. Enforced by `scripts/check-audio-fabrications.mjs` — the language-aware fact gate that scans every `audio.<lang>.json` (`check-fabrications.mjs` itself skips the narration JSON). It applies the shared registry (`scripts/lib/fabrication-patterns.mjs`) per spoken language — invariant URL rules on every track, en/es/fr/it/pt/zh bio-drift rules on their own track — plus a warn-first numeric-parity check (a translation must not speak a number absent from the source article). Pattern hits are fail-CI; known-stale pre-cleanup renders are waived (dated) in the script pending re-render.

## The Cost Index monthly dispatch (the publication)

**Cadence + authorship changed by founder call 2026-07-09 — recorded in the header of `.github/workflows/cost-index-dispatch.yml`, which is the source of truth.** The dispatch is now **MONTHLY** and **hand-written**, not weekly and not machine-published. No cron generates or publishes a post. `scripts/build-cost-index-dispatch.mjs` computes the edition's insight and scaffolds the post; a human writes and publishes it. **Do not add a publish cron** — its absence is a decision, not an oversight, and `check-cost-index-dispatch-fresh.mjs` (38-day lag) reding CI **is the intended reminder**: the machine reminds, humans write. A red there means "write this month's edition," never "automate this."

The dispatch (`blog/cost-index-week-<asOf>/`, byline **Don Goldstein**) is an of-record market read from `data/cost-index.json`, one dated post per edition. The `cost-index-week-` slug family predates the cadence change and is kept because slugs are final-forever. **Decisions of record:** `docs/editorial/decisions/ADR-010-cost-index-citable-publication.md`. **Full design + roadmap:** `docs/cost-index-publication-spec.md`. The honesty contract is inviolable: public wholesale levels never delivered price; a read vs each ingredient's own baseline window, not week-over-week unless the archive backs it.

  - **Longitudinal spine** — append-only `data/cost-index-editions.json`, one frozen snapshot per `asOf` (basket, spread, per-ingredient `reads`, `basketWeightsVersion` + `basket.asOf`). Honest week-over-week is computed **only** across commensurable editions (same weights, refreshed anchor) and **withheld with a stated reason** across a re-anchor/re-weight. Reconstructed seed editions (06-05, 06-16) never anchor a per-ingredient WoW. `flag.elevatedWeeks` surfaces as "N weeks running."
  - **Driver layer** — `data/cost-index-drivers.json`: **standing, public-sourced correlations, never invented dated events.** Attached to a flagged mover only when its measured direction agrees with `directionExpected` (eggs easing → no HPAI line). Every line is "association, not a measured cause"; never a magnitude, causation, or forecast. `retrievedAt` bumped **manually** (gate warns >365d); `*_es` fields present for future ES parity, but the dispatch is **EN-only** so they aren't rendered yet.
  - **Human seat** — optional `data/cost-index-editors-notes.json` keyed by `asOf`; a gated "From the floor — Don Goldstein" block, **absent by default**; may not add a number, ingredient, or forecast.
  - **Citability** — per-edition `Dataset` JSON-LD, a "Cite this edition" block, a CC0 per-week snapshot (`cost-index/week-<asOf>.json`/`.csv`), and the EN+ES edition archive at `/cost-index/weekly/` (`scripts/build-cost-index-archive.mjs`).
  - **Automation** — `.github/workflows/cost-index-refresh.yml` (daily 13:00 UTC self-heal) runs the archive/hero builds and the two gates, and commits the spine + per-week dataset + archive. **The DATA is automated; the PUBLICATION is not.** `cost-index-dispatch.yml` is `workflow_dispatch:`-only by the 2026-07-09 founder call (see above) and defaults to `dry-run=true` (prints the insight, publishes nothing, sends nothing). Run it with `dry-run=false` **after** the hand-written edition is live to send the monthly broadcast; the Worker stamps the `asOf` so a re-run cannot double-send. Fresh data needs `FRED_KEY`/`BLS_KEY`/`AMS_KEY` secrets (else the refresh no-ops, holding last-good); email needs `COST_INDEX_BROADCAST_SECRET`. **Do NOT run `sync-includes` in these flows** — the `_includes` footer template drifts vs live count sentinels and would regress them. Live heartbeat/deploy status is on the storefront board, not frozen here.

## Conventions worth knowing

  - Slugs are final-forever. Renaming a post breaks deep links from smart-next blocks, external citations, and AI Overview rotation. To revise content, rewrite in place and bump `dateModified`.
  - Library articles ship under the **Muntin Desk** byline (JSON-LD `author` still references Don Goldstein — he's the human under the hood).
  - Blog articles ship under **Don Goldstein**.
  - `<!-- LIBRARY:autolink:start -->…<!-- /LIBRARY:autolink:end -->` sentinels mark glossary autolinks injected by `scripts/build-library.mjs`. These must NOT live inside attribute values — `check-article-graphics.mjs` rule 8 catches that corruption.
  - `package.json` is gitignored by convention. Contributors maintain their own for npm-dependent scripts (Playwright, puppeteer). See `tests/README.md` for the Playwright setup.

## Don't do

  - Don't invent operator data, cohort sizes, percentages, or restaurants Don doesn't currently run. The fact-check gate will reject the commit; if it slips through, the audio renderer will speak the fabrication aloud in six languages.
  - Don't add new figures without `data-audio-alt` ≥ 80 chars AND a `<figcaption>`. The article-graphics gate will fail.
  - Don't rename a slug after publish.
  - Don't copy body text (including any `<!-- LIBRARY:autolink:start -->` markers) into a `data-audio-alt` or other attribute value.
  - Don't commit `package.json` (it's gitignored).
