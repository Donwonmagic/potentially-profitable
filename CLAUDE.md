# CLAUDE.md

Project memory for Claude Code sessions on `muntin.digital` — a one-person, **product-only** restaurant company in Silver Spring, MD (the Cost Index, free operator tools, and Muntin Ledger; the website-build/services line is retired). Static site (HTML + inline CSS + a few sentinel-driven build scripts), no framework, no CMS.

## Recent retirements & freezes (keep new work on-funnel)

New work consolidates around the cost-intelligence funnel (the Cost Index, the live free tools, Muntin Ledger). Do **not** reinvest in these:

  - **Frozen:** the build-a-website course (`/course/`) — kept live, no further investment.
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

## Editorial canons (binding for any prose change)

  - `/methods/index.html` #voice-contract — site-wide voice contract, banned-words list, CTA canon, POV-by-page-type table. Governs.
  - `docs/voice-canon-library.md` — library articles. Byline is **The Muntin Desk**; first-person "I" only when naming personal operator practice.
  - `docs/voice-canon-blog.md` — blog dispatches. Byline is **Don Goldstein**; first-person "I" is the narrator's seat.
  - `docs/voice-canon-sheets.md` — operator-sheets canon.
  - `docs/fact-check.md` + `data/sourced-claims.json` — the absolute fact gate. Every number, date, name, anecdote, percentage must be (a) registered in `sourced-claims.json`, (b) cited inline via `<details class="cite">`, or (c) labeled illustrative in the prose. Zero inventions.

The current operator bio is singular: **Don Goldstein, full-time Front-of-House Manager at Tacombi in Bethesda.** Past roles live in `/about/#timeline` and in `data/sourced-claims.json#operator_experience_claims.past_roles`. Phrases that frame Don as currently managing more than one restaurant are blocked by `scripts/check-fabrications.mjs`.

## Key gates

CI orchestrator is `scripts/check-all.mjs` — runs every `check-*.mjs` script in sequence and fails fast.

  - **Fabrication blocklist** (`check-fabrications.mjs`) — blocks the May-2026 fabrication patterns (invented cohorts, fake URLs, the "two restaurants" bio drift). Fail-CI.
  - **Article graphics** (`check-article-graphics.mjs`) — 8 rules per article: ≥2 content figures, ≥2 distinct viz-* kinds, ≥80-char `data-audio-alt`, `<figcaption>` per figure, teal↔rust tone balance, viz-bars `--w` vs num consistency, cross-post dedup, no autolink markers inside attribute values. Per-slug `HISTORICAL_WAIVERS` + `DEDUP_ALLOW` allowlist, both with dated comments.
  - **Article graphics tests** (`run-article-graphics-tests.mjs` → `test-article-graphics.mjs`) — `node:test` suite that pins the gate's parser behavior. Run manually with `node --test scripts/test-article-graphics.mjs`.
  - **Overview quality** (`check-overview-quality.mjs`) — stricter bar for batch overviews (≥5 H2, ≥3 figures with ≥1 viz-bars, capstone present, audio not pending, ≥5-min read).
  - **Image dimensions / formats / lazy** (`check-image-dimensions.mjs`, `check-image-formats.mjs`, `check-lazy-images.mjs`) — CLS / LCP guards.
  - **Site counts** (`inject-site-counts.mjs`, `build-site-counts.mjs`) — `<!-- count:KEY -->N<!-- /count -->` sentinels. Source of truth is `data/site-counts.json`.
  - **Locale parity** (`check-locale-parity.mjs`, `check-hreflang-orphans.mjs`) — EN ↔ ES surface parity.

## viz-* graphic families

Defined in `assets/site-article.css`. New article figures should use these wrappers (`viz-figure` is the post-Phase-1 marker; `article-figure` is the pre-Phase-1 wrapper still in use across some ES mirrors):

  - `viz-bars` — measured share, before/after on a single metric, comparative ranking.
  - `viz-flow` — mechanism sequences, the order a process walks.
  - `viz-tree` — decision diagnostics, branching troubleshooting. Library leans here.
  - `viz-ba` — before/after rewrites of a specific paragraph, profile, or schema block.
  - `viz-ring`, `viz-waterfall`, `viz-gauge`, `viz-spark`, `viz-hero`, `viz-scroll` — see canon §8 in `voice-canon-library.md` for each one's job.

Every content figure carries `data-audio-alt` (full narration, not alt text), `<figcaption>` (one-sentence takeaway), and a `<details class="cite">` drawer when the data is sourced.

## Audio pipeline

  - Manifest: `data/article-audio.json` — per-article `{ path, title, languages, status, owner }`. Status is `rendered`, `partial`, `pending`, or `deferred`.
  - Per-post scripts: `<post>/audio.json` + `audio.<lang>.json` for `en/es/fr/it/pt/zh`. MP3 sibling files render via `scripts/render-post-audio.mjs`.
  - Audio script `text` is read aloud verbatim. Enforced by `scripts/check-audio-fabrications.mjs` — the language-aware fact gate that scans every `audio.<lang>.json` (`check-fabrications.mjs` itself skips the narration JSON). It applies the shared registry (`scripts/lib/fabrication-patterns.mjs`) per spoken language — invariant URL rules on every track, en/es/fr/it/pt/zh bio-drift rules on their own track — plus a warn-first numeric-parity check (a translation must not speak a number absent from the source article). Pattern hits are fail-CI; known-stale pre-cleanup renders are waived (dated) in the script pending re-render.

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
