#!/usr/bin/env node
/**
 * Sprint 16 (Cohesion) — aggregate cohesion-check runner.
 *
 * Runs every check-*.mjs and the inject-* / wire-* idempotency
 * checks in --check mode, reports a one-line status per check, and
 * exits with a non-zero code if any check fails.
 *
 * Wire this into the build pipeline — one entry point, one exit
 * code. Individual checks remain runnable on their own for fast
 * iteration during development.
 *
 *   node scripts/check-all.mjs
 *
 * Returns 0 if everything passes; 1 otherwise. Always prints a
 * summary at the end so a passing run is informative too.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

// Each entry: [label, script, ...args]. Order is stable so output
// reads top-to-bottom in the same way each run.
const CHECKS = [
  ['Name coherence',      'check-name-coherence.mjs',      '--check'],
  ['Counts coherence',    'check-counts-coherence.mjs',    '--check'],
  // Phase-fact-check — blocklist for the patterns that came back as
  // fabricated operator data in May 2026. See data/sourced-claims.json
  // for the registry of verified claims and docs/fact-check.md for the
  // editorial rule. Fail-CI from day 1; new claims must either land in
  // the registry with a real source URL, be cited inline via a
  // <details class="cite"> drawer, or be labeled illustrative.
  ['Fabrication blocklist','check-fabrications.mjs',       '--check'],
  // Per-language audio fact gate — the HTML gate above deliberately skips the
  // narration JSON, but the renderer speaks chunks[].text verbatim in six
  // languages. This applies the shared fabrication registry per spoken
  // language (invariant URL rules everywhere; en/es/fr/it/pt/zh bio-drift
  // rules to their tracks) plus a warn-first numeric-parity check. Pattern
  // hits are fail-CI; known-stale pre-cleanup renders are waived (dated) in
  // the script and re-render is tracked in docs/editorial/ground-truth-pack.md.
  ['Audio fabrication blocklist','check-audio-fabrications.mjs','--check'],
  // Retired-link guard — fail-CI if a chrome/funnel surface (front door, nav +
  // footer partials, hub + trust pages) hard-links a path that only resolves via
  // the Worker 301 map. Catches the class of bug where a loud CTA keeps pointing
  // at a retired product (the homepage mobile CTA did this until 2026-06).
  ['Retired-link guard',  'check-retired-links.mjs',        '--check'],
  // Phase-2 cohesion guards. Sentinel-escape is fail-CI from day 1
  // (the regression cost was 247 frozen pages); banned-words is
  // warn-only at first so existing usage can be flagged + fixed
  // before promoting to fail-CI in a later sprint.
  ['Count sentinel escape','check-count-sentinel-escape.mjs','--check'],
  // Phase-3B cohesion guard. Catches the orphan-hreflang regression
  // where stamp-hreflang.mjs writes its own sentinel block but legacy
  // hand-authored <link rel="alternate" hreflang> / <meta og:locale>
  // lines below it survive — leading to duplicate hreflang triplets
  // on 161 pages until the cleanup pass landed. Fail-CI from day 1.
  ['Hreflang orphans',    'check-hreflang-orphans.mjs',    '--check'],
  // CTA canon — locked Phase 6 + extended in Phase 3B. Catches retired
  // verbs in button-style positions (Send to Don, View case study, etc.).
  // Body-prose mentions are allowed; this only flags the structural
  // pattern of `>Phrase</tag>` or `>Phrase<svg>`.
  ['CTA canon',           'check-cta-canon.mjs',           '--strict'],
  // Phase-3B footer canon — catches the regression class Phase 1
  // cleaned up on 23 tool pages (stale "Structure Brings Clarity"
  // tagline + DMV-studio blurb returning).
  ['Footer payload',      'check-footer-payload.mjs',      '--check'],
  // Phase-3B breadcrumb separator canon — catches &rsaquo; / &#8250;
  // returning inside breadcrumb-sep elements (3 different encodings
  // coexisted before Phase 3B normalised to literal `›`).
  ['Breadcrumb separator','check-breadcrumb-separator.mjs','--check'],
  // Phase-3B no-third-party-Plausible — after the self-host cutover,
  // /assets/p.js + /api/event proxy carry analytics. Any direct
  // plausible.io script src / preconnect / init endpoint reintroduces
  // a third-party request and breaks the privacy posture documented
  // on /never/ #4 + /privacy.html + /cookies.html. Fail-CI from day 1.
  ['No 3p Plausible',     'check-no-third-party-plausible.mjs','--check'],
  // Phase-3B-perf — CSS shell split. Verifies the three shell files
  // (assets/site-{core,tool,article}.css) are a sound partition of
  // assets/site.css: round-trip identity (no rule lost or duplicated),
  // cascade safety (no selector in core AND a supplemental shell),
  // build freshness (running build-css-shells --check would not
  // change anything). Fail-CI from day 1.
  ['CSS shells',          'check-css-shells.mjs',          '--check'],
  // Brand token spine (Wave 8b -> unified). Two complementary locks:
  //  sync  = site :root matches the canonical cross-brand spine
  //          (data/muntin.tokens.json, vendored from the Ledger repo).
  //  purge = no RETIRED warm palette lingers in muntin chrome (the ~850
  //          pages' inline critical CSS, the page-generator templates,
  //          and sheets.css). Pairs with sync: one forbids the old
  //          values, the other pins the new ones.
  ['Token sync',          'check-tokens-sync.mjs'],
  ['Token vendor',        'vendor-tokens.mjs'],
  ['Warm-palette purge',  'migrate-warm-palette.mjs',      '--check'],
  ['Mark geometry',       'check-mark-geometry.mjs'],
  // Invoice-Decoder safety: the four server files in src/ that touch
  // the decoder pipeline must NOT contain any outbound network paths
  ['Dark-mode block',     'build-dark-mode.mjs',           '--check'],
  ['Dark contrast',       'check-dark-contrast.mjs'],
  ['Section contrast',    'check-contrast.mjs'],
  ['Banned words',        'check-banned-words.mjs',        '--check'],
  // Studio voice-boundary — mirror of the product's "Don" check. Blocks a
  // fake-team / corporate "we" ("our team", "a team of") on the studio's own
  // marketing surfaces; the studio is one person (Don, "I"). Marketing-scoped
  // (content registers quote operators, so they are excluded).
  ['Studio voice boundary','check-studio-voice-boundary.mjs','--check'],
  // Sprint M (2026-05-08): retired-slug regression guard. Fails CI
  // if either retired slug is reintroduced anywhere outside the
  // documented allow list (_redirects, 404.html, historical
  // citation snapshots, this script).
  ['Removed slugs',       'check-removed-slugs.mjs'],
  ['Knit coverage',       'check-knit-coverage.mjs',       '--check'],
  // Topical authority — pillar coverage. Every library/blog article must
  // belong to a topic pillar (data/library-tags.json topics[0]); off-funnel
  // generated surfaces are dated-waived. Warn-first during rollout; promote to
  // --check once the depth floor (>=4 per pillar) is green (information-security
  // is at 3 today). See scripts/check-pillar-coverage.mjs.
  ['Pillar coverage (warn)','check-pillar-coverage.mjs'],
  // Phase H.1 — batch-overview quality gate. Every article that's
  // declared as a batch overview in data/library-batches.json gets
  // checked against the synthesis floor (>= 5 H2, >= 3 viz figures
  // with >= 1 viz-bars, every deep-dive linked >= 2x, navigational
  // capstone present, audio not pending, read time >= 5 min). See
  // scripts/check-overview-quality.mjs for the rule rationale.
  ['Overview quality',    'check-overview-quality.mjs'],
  // Phase H.2 — per-article graphics gate. Where overview-quality is
  // wider (≥3 figures, ≥1 viz-bars) and applies only to batch overviews,
  // this gate is the universal floor for every regular article:
  // ≥2 content figures, ≥2 distinct viz-* kinds, ≥80-char data-audio-alt
  // on every figure, figcaption on every figure, teal-rust tone balance,
  // viz-bars --w-vs-num consistency, and cross-post dedup. Empty
  // HISTORICAL_WAIVERS by intent; the cutover edits the under-floor posts
  // it can and dates the rest as backlog. See scripts/check-article-graphics.mjs.
  ['Article graphics',    'check-article-graphics.mjs'],
  // Phase H.2 — unit tests for the article-graphics gate above. The
  // gate is 400+ lines of regex parsing and per-rule logic; these
  // tests pin the parser behavior so future regressions surface
  // before they ship. See scripts/test-article-graphics.mjs for the
  // suite and scripts/run-article-graphics-tests.mjs for why a
  // wrapper is needed.
  ['Article graphics tests', 'run-article-graphics-tests.mjs'],
  // AEO — answer-first snippet shape. Flags question-style H2s whose first
  // paragraph opens with a transition ("Below…", "Empieza por…") instead of
  // the liftable answer answer engines extract. Warn-first during rollout;
  // promote to --check once the backlog is clear. See check-snippet-shape.mjs.
  ['Snippet shape (warn)', 'check-snippet-shape.mjs'],
  // Phase SEO — H2 anchor IDs let AI search engines (Google AI Overview,
  // Perplexity, ChatGPT) deep-link to a specific section instead of the
  // article root. See scripts/inject-h2-anchor-ids.mjs for the slug
  // rules. Catches the regression where a newly-published article
  // shipped with bare <h2> tags.
  ['H2 anchor IDs (idem)', 'inject-h2-anchor-ids.mjs',      '--check'],
  // Phase SEO/Perf — italic font preloads. Operator-reported FOUC where
  // the hero italic line ("Built by one person…") re-paints when the
  // italic woff2 arrives. Preloading the italic variants closes the gap.
  ['Italic font preloads (idem)', 'inject-italic-font-preloads.mjs', '--check'],
  ['Button vocabulary',   'check-button-vocabulary.mjs',   '--check'],
  // Phase 1 (tool-suite upgrade) — guard against NEW innerHTML usage
  // while Phase 3 retrofits existing call sites. Strict mode: fails CI
  // if total usage exceeds the BASELINE_COUNT pinned in the script.
  ['No new innerHTML',    'check-no-innerhtml.mjs',        '--check'],
  ['Tool header',         'check-tool-header.mjs',         '--check'],
  ['Hidden attribute',    'check-hidden-attribute.mjs',    '--check'],
  ['OG image refs',       'check-og-images.mjs'],
  ['OG coverage',         'check-og-coverage.mjs',         '--check'],
  // Native-Spanish parity guard for social cards. Catches an ES article
  // page serving the EN card (or a wrong card) — invisible to og-images
  // (the ref still resolves) and og-coverage (not a generic fallback).
  // Asserts each ES card is locale:"es" and mirrors its EN sibling's focus.
  ['OG locale parity',    'check-og-locale-parity.mjs',    '--check'],
  // OG accent whitelist — every card's `accent` must be a PALETTE key
  // the builder can resolve (derived from build-og-cards.mjs, so the
  // whitelist can't drift). An unknown accent resolves to undefined and
  // ships a wrong-colored share image with no error; this fails-CI on it.
  ['OG accents',          'check-og-accents.mjs'],
  // SEO hygiene — meta-description length. Google truncates the SERP
  // snippet ~155 chars; over-length descriptions leak their tail (CTA +
  // long-tail keyword) and cost CTR. Now fail-CI: the over-length
  // backlog is cleared (generators clamp to <=155; residual inline
  // pages trimmed) and WARN_ONLY=false in the script. Fix any new
  // offender at the generator, not the generated HTML.
  ['Meta description length',  'check-meta-description-length.mjs', '--check'],
  ['Analytics vocab',     'check-analytics-vocabulary.mjs','--check'],
  // Wave A unit-test gate (node:test). Covers menu-schema +
  // reducer/store + allergens regime math today; new modules
  // ship their tests next to the source and the runner picks
  // them up by glob.
  ['Unit tests',          'check-tests.mjs'],
  ['Glossary knit (idem)','wire-glossary-knit.mjs',        '--check'],
  ['Fieldnotes (idem)',   'inject-glossary-fieldnotes.mjs','--check'],
  ['Post-end CTA (idem)', 'inject-post-end-cta.mjs',       '--check'],
  ['Library Cost-Index hero (idem)','inject-library-cost-index-hero.mjs','--check'],
  ['Article sheet callouts (idem)','inject-article-sheet-callouts.mjs','--check'],
  ['Glossary OG seed (idem)','seed-glossary-og.mjs',       '--check'],
  ['Glossary OG meta (idem)','inject-glossary-og.mjs',     '--check'],
  ['Receipts KPIs (idem)','inject-receipts-kpis.mjs',      '--check'],
  ['OG template grid',    'check-og-template-grid.mjs',    '--check'],
  ['Kind registry',       'check-kind-registry.mjs',       '--check'],
  // Operator Sheets — parity gate. Warn-only during initial rollout
  // (FAIL_ON_DRIFT flag in the script); flip to fail-CI once the 30-
  // sheet catalog reaches steady state and ES coverage is complete.
  // Note: build-sheet-pages is intentionally NOT in --check mode here.
  // It full-rewrites pages from the shell template, which conflicts
  // with the sync-includes pass that runs immediately after it in
  // the build chain (a second sync-includes pass restores the
  // canonical nav/footer). Running --check standalone would
  // (correctly) report "would write" since the on-disk pages have
  // the sync-includes-stamped chrome, not the empty shell stubs.
  // The pipeline as a whole is correct; the standalone idempotency
  // check is not the right gate for this script. The hub renderer
  // (build-sheets-index) IS idempotent — it stamps between sentinels
  // and leaves the rest of the file alone.
  ['Operator Sheets parity','check-sheets-parity.mjs',     '--check'],
  ['Sheets index (idem)', 'build-sheets-index.mjs',         '--check'],
  ['Intent param targets','check-intent-param-targets.mjs','--check'],
  ['Article fieldnotes (idem)','inject-article-fieldnotes.mjs','--check'],
  ['Article listen (idem)','inject-article-listen.mjs','--check'],
  ['Checklist script (idem)','inject-checklist-script.mjs','--check'],
  ['Glossary script (idem)','inject-glossary-script.mjs','--check'],
  ['Include coverage',     'check-include-coverage.mjs'],
  ['Bare-sentinel fix (idem)','fix-bare-include-sentinels.mjs','--check'],
  ['CSS shells injected (idem)','inject-css-shells.mjs','--check'],
  // Cache-bust uniformity (PR #290's stale-cache class of bug). Hashes
  // each /assets/site*.css file's content; stamps the hash as the
  // ?v=… cache-bust on every <link href="/assets/site*.css?v=...">
  // reference site-wide. If CSS content changes, hash changes, URL
  // changes, browser refetches. Zero stale-cache risk; zero hand-bumping.
  ['CSS cache-bust (idem)','inject-css-cache-bust.mjs','--check'],
  // Image-formats: every raster source must have AVIF + WebP siblings
  // so the <picture> wrappers (inject-picture-tags) can serve modern
  // formats to capable browsers. --check is sharp-free; only the
  // writer mode (no --check) requires `npm i sharp`.
  ['AVIF/WebP siblings (idem)','build-image-formats.mjs','--check'],
  ['Picture tags (idem)','inject-picture-tags.mjs','--check'],
  // Critical-CSS link color (PR May 2026). Adds `a{color:inherit}` to
  // every page's inline <style> so the brief unstyled-render window
  // before site-core.css applies doesn't show <a> tags in browser
  // default link blue — which inline SVGs that use stroke=currentColor
  // (envelope, search, hamburger) inherit, producing a blue-icon flash.
  ['Critical-CSS link color (idem)','inject-critical-link-color.mjs','--check'],
  // Phase 3C-perf — fonts + above-the-fold skeleton inlined in every
  // page's critical-CSS <style> block. Mirrors the @font-face rules
  // and minimal hero/section/footer layout from assets/site.css so
  // first paint matches the post-CSS-arrival paint and nothing
  // visibly reflows. Fail-CI from day 1 (drift breaks the lag fix).
  ['Critical-CSS fonts+skeleton (idem)','inject-critical-fonts.mjs','--check'],
  // Phase 3D-perf — rewrites p.js + site.js <script> tags into
  // inline lazy loaders that defer JS download + execute until
  // after `load` + requestIdleCallback. Eliminates the multi-second
  // main-thread block on mid-range mobile CPUs where users could not
  // select text, tap, or type for several seconds after the page
  // visually finished rendering. Fail-CI if any page drifts back to
  // the eager `defer` form.
  ['Lazy script loader (idem)','inject-lazy-script-loader.mjs','--check'],
  // Pricing consistency — warn-only during initial rollout. Promotes to
  // --strict once the ~11 inline service-link backlog is worked off
  // (mostly /learn/research/, /learn/topics/, /studio/<city>/ pages
  // that link to a service inline without naming the price).
  ['Pricing consistency (warn)','check-pricing-consistency.mjs'],
  ['Turnstile singleton',   'check-turnstile-singleton.mjs'],
  ['Article fieldnote form (idem)','inject-article-fieldnote-form.mjs','--check'],
  ['Article fieldnotes allowlist','check-fieldnotes-allowlist.mjs','--check'],
  ['Article fieldnote attribution','check-fieldnote-attribution.mjs','--check'],
  ['Contributor pages (idem)','build-people-pages.mjs','--check'],
  ['Homepage field-notes rail (idem)','inject-homepage-fieldnotes-rail.mjs','--check'],
  ['No Calendly refs',    'check-no-calendly-references.mjs', '--check'],
  ['Window locale parity', 'check-window-locale-parity.mjs',  '--check'],
  ['Site counts (idem)',  'inject-site-counts.mjs',        '--check'],
  ['Locale parity',       'check-locale-parity.mjs',       '--check'],
  ['Course locale parity','check-course-locale-parity.mjs','--check'],
  ['Course term-links',   'check-course-term-links.mjs',   '--check'],
  ['L14 generator output','check-l14-generator-output.mjs'],
  ['Course data layer',   'check-course-data-layer.mjs'],
  ['Course listen (idem)','inject-course-listen.mjs','--check'],
  ['Course mark-complete (idem)','inject-course-mark-complete.mjs','--check'],
  ['Course config-sync (idem)','inject-course-config-sync.mjs','--check'],
  ['Course sheet-link (idem)','inject-course-sheet-link.mjs','--check'],
  ['Course objectives (idem)','inject-course-objectives.mjs','--check'],
  ['Course plain-language (idem)','inject-course-plain-language.mjs','--check'],
  ['Course mobile-css (idem)','inject-course-mobile-css.mjs','--check'],
  ['Course og-images (idem)','inject-course-og-images.mjs','--check'],
  ['Tool course-crosslink (idem)','inject-tool-course-crosslink.mjs','--check'],
  ['Glossary lesson-sidecar (idem)','inject-glossary-lesson-sidecar.mjs','--check'],
  ['Topic course-rail (idem)','inject-topic-course-rail.mjs','--check'],
  ['Article course-rail (idem)','inject-article-course-rail.mjs','--check'],
  ['Course titles bundle (idem)','build-course-titles-bundle.mjs','--check'],
  ['Article TL;DR',       'check-article-tldr.mjs',        '--check'],
  ['Article TL;DR retrofit (idem)','inject-article-tldr.mjs','--check'],
  ['Article HowTo schema (idem)','inject-article-howto-schema.mjs','--check'],
  ['Article abstract+mentions (idem)','inject-article-abstract-mentions.mjs','--check'],
  ['Smart-next CTA (idem)','inject-smart-next-cta.mjs',     '--check'],
  // Phase 2B (Cohesion) — Companion kit four-corner footer. The
  // sentinel-bracketed block at the bottom of every library article,
  // tool, sheet, and curated glossary page; resolves titles + deks
  // from the live HTML so check fails on drift. See
  // docs/start-here-canon.md §6 and data/cross-surface-map.json.
  ['Companion kit (idem)','inject-companion-kit.mjs',       '--check'],
  ['KnitRail (idem)',     'inject-knit-rail.mjs',           '--check'],
  ['Ledger CTA (idem)',   'inject-ledger-cta.mjs',          '--check'],
  ['Topic eyebrow (idem)','inject-topic-eyebrow.mjs',       '--check'],
  ['Glossary term-example (idem)','inject-glossary-term-examples.mjs','--check'],
  ['Glossary FAQ (idem)', 'inject-glossary-faq.mjs',                  '--check'],
  ['Glossary SEO meta (idem)', 'inject-glossary-seo.mjs',             '--check'],
  ['Glossary article backlinks (idem)','inject-glossary-article-backlinks.mjs','--check'],
  ['Glossary deep anchors (idem)','inject-glossary-deep-anchors.mjs','--check'],
  ['Glossary verified stamp (idem)','inject-glossary-verified-stamp.mjs','--check'],
  ['Glossary tool sidecar (idem)','inject-glossary-tool-sidecar.mjs','--check'],
  ['Glossary sheet sidecar (idem)','inject-glossary-sheet-sidecar.mjs','--check'],
  ['Topic sheets rail (idem)','inject-topic-sheets-rail.mjs','--check'],
  ['Tool sheet rail (idem)','inject-tool-sheet-rail.mjs','--check'],
  ['Sheet glossary popovers (idem)','inject-sheet-glossary-popovers.mjs','--check'],
  ['Sheet worked examples (idem)','inject-sheet-worked-examples.mjs','--check'],
  // Warn-only — the cap-counter + duplicate-of-label rules are scriptable;
  // the "skip-it-changes-result-by-5%" judgment is in docs/voice-canon-sheets.md
  // and lives with the human reviewer.
  ['Sheet help-cadence (warn)','check-sheet-help-cadence.mjs'],
  ['Sheet OG cards (idem)','sync-sheet-og-cards.mjs','--check'],
  ['Sheet benchmarks (idem)','build-sheet-benchmarks.mjs','--check'],
  ['Window field-notes rail (idem)','inject-window-fieldnotes-rail.mjs','--check'],
  ['Glossary hub',        'check-glossary-hub.mjs',         '--check'],
  ['Topic pillar essay (idem)','inject-topic-pillar-essay.mjs','--check'],
  ['Topic page schema (idem)','inject-topic-page-schema.mjs','--check'],
  // Topical authority — topic (pillar) pages must link their member articles
  // at the canonical path: 34 of 45 members are namespace:library and live at
  // /library/<slug>/, not /blog/<slug>/. Also resolves ES card slugs to the ES
  // counterpart. Post-processor (build-library.mjs, which emits the cards, is
  // stale/divergent — must not be re-run); --check pins the links in sync.
  ['Topic card links (idem)','inject-topic-card-links.mjs','--check'],
  ['Hub collection schema (idem)','inject-hub-collection-schema.mjs','--check'],
  ['Author chip (idem)',  'inject-article-author-chip.mjs', '--check'],
  ['Sitemap (idem)',      'build-sitemap.mjs',              '--check'],
  ['Tool verified stamp (idem)','inject-tool-verified-stamp.mjs','--check'],
  ['Tool verified stamp', 'check-tool-verified-stamp.mjs', '--check'],
  ['llms.txt (idem)',     'build-llms-txt.mjs',            '--check'],
  ['Claims ledger (idem)','build-claims-json.mjs',         '--check'],
  ['Claims rows (idem)',  'inject-claims-rows.mjs',        '--check'],
  ['Basket weights (idem)','inject-cost-index-basket-weights.mjs','--check'],
  ['Tool HowTo schema (idem)','inject-tool-howto.mjs',     '--check'],
  ['Glossary article schema (idem)','inject-glossary-article-schema.mjs','--check'],
  ['RSS feeds (idem)',    'build-rss.mjs',                 '--check'],
  ['RSS coverage',        'check-rss-coverage.mjs',        '--check'],
  ['Content guardrails',  'check-content-guardrails.mjs',  '--check'],
  ['Event prop cardinality','check-event-prop-cardinality.mjs','--check'],
  ['Image dimensions',    'check-image-dimensions.mjs',     '--check'],
  ['Lazy images',         'check-lazy-images.mjs',          '--check'],
  ['CLS animation',       'check-cls-animation.mjs',        '--check'],
  // SVG dimensions — fail-CI from day 1 (the regression cost was 4,366
  // unsized inline SVGs flashing at 300×150 on every page load before
  // CSS arrived; fixed in PR #285). Catches any new SVG without
  // explicit width+height attributes from re-introducing the bug.
  ['SVG dimensions',      'check-svg-dimensions.mjs'],
  ['Image formats (warn)','check-image-formats.mjs',         '--check'],
  ['Newsletter copy',     'check-newsletter-copy.mjs',      '--check'],
  ['Audit fetch-signal',  'check-audit-fetch-timeouts.mjs', '--check'],
  ['Lifecycle locale parity','check-lifecycle-locale-parity.mjs','--check'],
  ['Share snapshot kinds','check-share-snapshot-kinds.mjs', '--check'],
  ['Security page schema (idem)','inject-security-page-schema.mjs','--check'],
  ['Tool data-promise (idem)','inject-tool-data-promise.mjs','--check'],
  ['Tool no-fetch invariant','check-tool-no-fetch.mjs'],
  ['Sheet no-fetch invariant','check-sheet-no-fetch.mjs'],
  ['Themes review board (idem)','build-themes-review-board.mjs','--check'],
  ['Theme story pages (idem)','build-theme-story-pages.mjs','--check'],
  ['Cuisine landing pages (idem)','build-cuisine-landing-pages.mjs','--check'],
  // Ingredient-yield pages are intentionally NOT in --check mode (same
  // reason as build-sheet-pages above): the generator emits a skeleton
  // nav that the sync-includes pass — which runs BEFORE this gate in the
  // deploy build — expands to the canonical nav. So --check always reports
  // drift in the build even though the committed pages are correct (the
  // gate only passes locally if the generator is re-run last, which the
  // deploy chain never does). The generator still runs; the pages stay
  // covered by the site-wide gates (OG refs, image dims, hreflang, locale
  // parity, lazy images, etc.).
  // Ingredient-yield manifest — every page's yield must match the cited CIA table
  // (or declare a yield_source); slugs unique/kebab, bilingual, valid category.
  ['Ingredient-yield manifest','check-ingredient-yields.mjs','--check'],
  ['Ingredient-yield manifest self-test','check-ingredient-yields.mjs','--self-test'],
  // Distributor-tie alias registry — every canonical alias key is a real Cost
  // Index key; every stem is in canonical extractStem form, unambiguous, sourced.
  ['Ingredient alias registry','check-ingredient-aliases.mjs','--check'],
  ['Ingredient alias registry self-test','check-ingredient-aliases.mjs','--self-test'],
  // JSON-LD price-cleanliness — structured data (lifted verbatim by answer
  // engines) must never carry a $ figure, price field, or Offer/Product type.
  ['Ingredient JSON-LD clean','check-ingredient-jsonld.mjs','--check'],
  ['Ingredient JSON-LD self-test','check-ingredient-jsonld.mjs','--self-test'],
  ['Cost-index sources','check-cost-index-sources.mjs','--check'],
  ['Cost-index source tier','check-source-tier.mjs',    '--check'],
  ['Cost-index driver catalog','check-cost-index-drivers.mjs','--check'],
  ['Cost-index editors note','check-cost-index-editors-note.mjs','--check'],
  ['Cost-index sync',   'check-cost-index-sync.mjs',     '--check'],
  ['Cost-index sync self-test','check-cost-index-sync.mjs','--self-test'],
  // Confidence calibration (P1 #36) — min-of-gates ceiling governs precision.
  // Warn-only during rollout (FAIL_ON_DRIFT in the script); flip once the
  // upstream orchestrator confidences are reconciled (today: onion high → medium).
  ['Cost-index calibration','check-cost-index-calibration.mjs'],
  ['Cost-index calibration self-test','check-cost-index-calibration.mjs','--self-test'],
  // Trend-vs-curve consistency — the SHOWN trend % must describe the SHOWN
  // sparkline (guards the unwindowed-index-source bug where a multi-year change
  // leaked into the headline while the curve stayed windowed). Same script
  // repairs the data when run without --check.
  ['Cost-index trend↔curve','reconcile-cost-index-trends.mjs','--check'],
  // Freshness heartbeat — informational here (data ages naturally between weekly
  // runs, so it must never block a PR); the weekly refresh runs it with --check
  // to turn a persistent stall into a red (alerting) scheduled run.
  ['Cost-index freshness (warn)','check-cost-index-freshness.mjs'],
  ['Cost-index freshness self-test','check-cost-index-freshness.mjs','--self-test'],
  ['Cost-index health (idem)','build-cost-index-health.mjs','--check'],
  ['Cost-index provenance (idem)','build-cost-index-provenance.mjs','--check'],
  ['Cost-index health self-test','build-cost-index-health.mjs','--self-test'],
  // Basis-honesty leak gate — the Cost Index renders a $ level ONLY on a real dollar
  // basis (delivered/wholesale/retail); index/farm-gate/customs are shape/direction only.
  // Cross-references every rendered $ (seed, index.json, feed.json, index.csv, per-
  // ingredient series, weekly digest) against the SOURCE newest level, so a surface that
  // MISLABELS a non-$ basis as "wholesale" (the salmon-fillet class) is caught.
  ['Cost-index basis-leak','check-cost-index-basis-leak.mjs'],
  ['Cost-index basis-leak self-test','check-cost-index-basis-leak.mjs','--self-test'],
  // Seasonal baseline (D3) — a month earns a "typical" normal only once observed
  // across 2+ years; until then every ingredient sits in a transparent `building`
  // state. Pure function of the vendored history, so --check pins it in sync.
  ['Cost-index seasonality (idem)','build-seasonality.mjs','--check'],
  ['Cost-index seasonality self-test','build-seasonality.mjs','--self-test'],
  // Seasonality education (S2) — sourced bilingual primers per card. Enforces the
  // USDA-sourced posture: every entry carries a citation + EN/ES + a real key.
  ['Cost-index seasonality education','check-seasonality-education.mjs'],
  ['Cost-index seasonality education self-test','check-seasonality-education.mjs','--self-test'],
  // Seasonal band enforcement (P1d) — the rendered "typical for this month"
  // bands on the ingredient pages state a multi-year norm (median + p25–p75).
  // The fabrication regex can't catch a wrong statistic, so this re-derives
  // every rendered band from seasonality.json and fails on drift or on any
  // band that should not exist (not ready, or a month with <2 distinct years).
  ['Cost-index seasonal band','check-cost-index-seasonal.mjs'],
  ['Cost-index seasonal band self-test','check-cost-index-seasonal.mjs','--self-test'],
  // Shippable bar — below-bar ingredients must stay out of the browser seed
  // (no thin / no-level read on the dashboard; they live as expanding-coverage).
  ['Cost-index shippable bar','check-shippable-bar.mjs'],
  // Vendor Benchmark ingredient-picker manifest (data/cost-index-picker.js) — the
  // honest source-of-truth list a coming picker reads. Pins it to the browser seed
  // (length/keys/labels/units) + the shared taxonomy (group) + the exact reference()
  // dollar rule (dollarRef), and asserts the shared category map stays in lockstep
  // with the inline maps in build-cost-index-pages.mjs. Rebuild: build-cost-index-picker.mjs.
  ['Cost-index picker','check-cost-index-picker.mjs'],
  ['Cost-index picker self-test','check-cost-index-picker.mjs','--self-test'],
  // Vendor Benchmark onboarding worked-examples — the live engine must still yield the
  // tone each demo chip claims (hot→over, tracked→match, thin→hold). Parses the tool's
  // own SCENARIOS so a seed refresh can't leave the honesty demo asserting a stale tone.
  ['VB worked-example scenarios','check-vb-scenarios.mjs'],
  // Band coverage — the published prediction band is a CONFORMAL interval whose
  // realized coverage is backtested against deep history; this gate fails if the
  // 80% band doesn't actually cover ~80% of next prints (verified, not asserted).
  ['Cost-index band coverage','check-band-coverage.mjs'],
  ['Cost-index band coverage self-test','check-band-coverage.mjs','--self-test'],
  // Conformal GOLDEN VECTORS — the exact-output parity lock. The behaviour suites
  // check coverage with tolerance bands; this fixture pins full conformalNext outputs
  // to the last digit and is byte-shared with the Muntin Ledger TS port, so a numeric
  // drift between the two implementations is a failure, not a coincidence. --check
  // re-derives and (when the sibling repo is present) asserts both copies identical.
  // The cost-conformal.vectors.test.mjs assertions run under the Unit tests step.
  ['Cost-index conformal golden vectors','build-conformal-vectors.mjs','--check'],
  // Lock-or-float predictability artifact — the reframed Cost Pulse spine. Buckets
  // every ingredient Lock/Cushion/Float/Won't-call from the certified conformal band
  // (raw scale=1) via the honest classifier; --check re-derives the whole artifact
  // and fails on any coverage/bucket drift, so a published count can never diverge
  // from the data. Deterministic (no build clock). The cost-lockfloat.test.mjs +
  // cost-null-gate.test.mjs vectors are picked up by the Unit tests step.
  ['Cost-index lock-or-float self-test','build-cost-lockfloat.mjs','--self-test'],
  ['Cost-index lock-or-float sync','build-cost-lockfloat.mjs','--check'],
  // Forbidden-claim lint for the lock-or-float surface — a named red-if-reintroduced
  // case per audit-banned read (direction, opportunity-timing, overpayment, X-leads-Y)
  // so an A/B copy tweak can never quietly bring one back in EN or ES.
  ['Cost-index lock-or-float copy','check-lockfloat-copy.mjs'],
  ['Cost-index lock-or-float copy self-test','check-lockfloat-copy.mjs','--self-test'],
  // Trend skill — the reliability-diagram half: a price-only direction call is
  // replayed over deep history and bucketed by strength; the gate fails unless a
  // stronger arrow verifies more often AND beats the no-skill baseline ("high"
  // means high), so the trend's confidence label is earned, not asserted.
  ['Cost-index trend skill','check-trend-skill.mjs'],
  ['Cost-index trend skill self-test','check-trend-skill.mjs','--self-test'],
  // Calibration record — the verified band-coverage + trend-skill numbers, pooled
  // into one versioned artifact the methodology page cites; --check keeps the file
  // (and the published claim) in lockstep with the data.
  ['Cost-index calibration report self-test','build-cost-index-calibration-report.mjs','--self-test'],
  ['Cost-index calibration report sync','build-cost-index-calibration-report.mjs','--check'],
  ['Cost-index calibration page sentinels','inject-cost-index-calibration.mjs','--check'],
  // Forecast backtest — a research artifact (ships to no page): proves how far a forward
  // cone may honestly reach (directional skill dies after 1 step) and whether the seasonal
  // term-structure direction carries signal momentum doesn't. Deterministic; --check pins it.
  ['Cost-index forecast backtest self-test','backtest-cost-forecast.mjs','--self-test'],
  ['Cost-index forecast backtest sync','backtest-cost-forecast.mjs','--check'],
  // Anomaly record (Track B build 1) — Hampel point-outliers + Pettitt regime breaks over the
  // committed history; additive, ships to no page. The cost-anomaly.test.mjs vectors are picked
  // up automatically by the Unit tests step.
  ['Cost-index anomaly log self-test','build-cost-anomaly-log.mjs','--self-test'],
  ['Cost-index anomaly log sync','build-cost-anomaly-log.mjs','--check'],
  // Notable price events — the "events that moved the market" surface. DETECTION
  // (build-cost-index-events.mjs) is pure math over the deep history: the biggest
  // sustained moves off local normal + honest context (duration, own-season,
  // same-category co-movement). Its self-test pins the arithmetic; --check pins the
  // vendored data. The HONESTY gate (check-cost-index-events.mjs) guards the curated
  // WHY notes (data/cost-index-event-notes.json): a note must line up with a real
  // detected event, "verified" must mean a live source + a date, no forecast/regime-step
  // phrasing, and — the core promise — NO unverified cause text may reach any built page.
  ['Cost-index events self-test','build-cost-index-events.mjs','--self-test'],
  ['Cost-index events sync','build-cost-index-events.mjs','--check'],
  ['Cost-index events honesty self-test','check-cost-index-events.mjs','--self-test'],
  ['Cost-index events honesty','check-cost-index-events.mjs'],
  // Open-data publication artifacts (CC0/CC-BY) — deterministic reshapes of the gated source
  // data into cost-index/*.{json,csv}, surfaced on /open. These generators are NOT in the deploy
  // build chain, so their --check here is the ONLY guard against a published open dataset drifting
  // from its source (e.g. a data refresh that regenerates seasonality/events/lockfloat but not the
  // reshape). Each also self-tests its transform + honesty (license, no price-bulk leak, honest
  // column naming). The cost-index-refresh workflow re-runs the generators so refreshes stay in sync.
  ['Yields open-data self-test','build-yields-open-data.mjs','--self-test'],
  ['Yields open-data sync','build-yields-open-data.mjs','--check'],
  ['Events open-data self-test','build-events-open-data.mjs','--self-test'],
  ['Events open-data sync','build-events-open-data.mjs','--check'],
  ['Seasonality open-data self-test','build-seasonality-open-data.mjs','--self-test'],
  ['Seasonality open-data sync','build-seasonality-open-data.mjs','--check'],
  ['Lock-or-float open-data self-test','build-lockfloat-open-data.mjs','--self-test'],
  ['Lock-or-float open-data sync','build-lockfloat-open-data.mjs','--check'],
  ['Anomaly open-data self-test','build-anomaly-open-data.mjs','--self-test'],
  ['Anomaly open-data sync','build-anomaly-open-data.mjs','--check'],
  // Market-context seed for Vendor Benchmark — per ingredient: volatility class, whether the
  // reference is itself unusual right now vs its own normal, and the most recent DOCUMENTED
  // event. Lets the tool add co-occurrence context about the REFERENCE's state (never the
  // operator's price, so the fair-price-gap contract holds). Deterministic; --check pins the seed.
  ['Cost-index context self-test','build-cost-index-context.mjs','--self-test'],
  ['Cost-index context sync','build-cost-index-context.mjs','--check'],
  // Plate-cost drift (truth-discovery for Live Plate Margin) — quantifies how much
  // a protein-forward plate's indexed component drifts over the latest fully-covered
  // quarter, derived-with-stated-method from the deep history; ships to no page.
  ['Cost-index plate-cost drift self-test','build-cost-plate-drift.mjs','--self-test'],
  ['Cost-index plate-cost drift sync','build-cost-plate-drift.mjs','--check'],
  // Level provenance — derives each ingredient's level-basis (wholesale vs
  // index/directional) and shared-source proxy groups from the source registry.
  // Built before the audit, which reconciles structural clones against it.
  ['Cost-index level provenance self-test','build-cost-index-proxies.mjs','--self-test'],
  ['Cost-index level provenance sync','build-cost-index-proxies.mjs','--check'],
  // Data-quality audit — surfaces clone clusters (classified vs the provenance
  // above), implausible per-lb levels, and deviations from USDA/CME wholesale
  // references for upstream triage. Report-only (does not fail on findings);
  // --check keeps it in lockstep with the data.
  ['Cost-index data-quality audit self-test','build-cost-index-audit.mjs','--self-test'],
  ['Cost-index data-quality audit sync','build-cost-index-audit.mjs','--check'],
  // Regression GATE — fails CI if a NEW clone bug or implausible level appears
  // beyond the dated baseline in build-cost-index-audit.mjs (HISTORICAL_WAIVERS
  // idiom). Known issues (beef trio, vegetable-oil) are baselined and pass.
  ['Cost-index data-quality gate','build-cost-index-audit.mjs','--gate'],
  // Published weekly outlook — Basket Forecast over the declared basket, gated to
  // the backtest-validated reach; the forward companion to feed.json. Self-test +
  // sync pair; ships to no page.
  ['Cost-index outlook self-test','build-cost-outlook.mjs','--self-test'],
  ['Cost-index outlook sync','build-cost-outlook.mjs','--check'],
  // Embeddable wholesale-reference card (idea #3) — a self-contained, noindex iframe
  // fragment built from the published series.json; --check keeps it in lockstep with the
  // feed so an embedded card can never drift from the page that produced it.
  ['Cost-index embed self-test','build-cost-index-embed.mjs','--self-test'],
  ['Cost-index embed sync','build-cost-index-embed.mjs','--check'],
  // Data feed (idea #3, machine half) — one machine-readable catalog of every shipping
  // ingredient's current wholesale reference, built from the per-ingredient series.json;
  // --check keeps the catalog in lockstep with the feeds it summarizes.
  ['Cost-index data feed self-test','build-cost-index-feed.mjs','--self-test'],
  ['Cost-index data feed sync','build-cost-index-feed.mjs','--check'],
  // Revisions / audit trail (PRA-grade trust signal) — append-only ledger of changes to
  // previously-published readings, a deterministic diff of the series feeds vs the prior
  // vintage. --check fails if readings drifted since the last revisions build.
  ['Cost-index revisions self-test','build-cost-revisions.mjs','--self-test'],
  ['Cost-index revisions sync','build-cost-revisions.mjs','--check'],
  // Methodology versioning — machine statement (cost-index/methodology.json) + the page's
  // rendered version/changelog kept in lockstep, closing the #governance over-promise.
  ['Cost-index methodology self-test','build-cost-index-methodology.mjs','--self-test'],
  ['Cost-index methodology sync','build-cost-index-methodology.mjs','--check'],
  // Independence invariant — proves the number-producing pipeline reads only public data,
  // never customer/invoice/delivered-price (the firewall behind the #independence claim).
  ['Cost-index independence self-test','check-cost-index-independence.mjs','--self-test'],
  ['Cost-index independence','check-cost-index-independence.mjs',''],
  // Reproducibility worked example — keeps the #reproduce figure pinned to the live feed
  // so the "rebuild our number" recipe can never quote a stale value.
  ['Cost-index reproduce self-test','build-cost-index-reproduce.mjs','--self-test'],
  ['Cost-index reproduce sync','build-cost-index-reproduce.mjs','--check'],
  // Confidence-label calibration — proves the user-facing label (low/medium/high/directional)
  // tracks realized accuracy; reads the shared modules, changes none (parity-safe).
  ['Cost-index confidence calibration self-test','build-cost-confidence-calibration.mjs','--self-test'],
  ['Cost-index confidence calibration sync','build-cost-confidence-calibration.mjs','--check'],
  // Calibrated confidence score — Landing A: the score kernel's shadow report (current vs
  // proposed label + median-split skill test). Reports only; changes no live label. The
  // cost-confidence-score.test.mjs vectors are picked up by the Unit tests step.
  ['Cost-index confidence shadow self-test','build-cost-confidence-shadow.mjs','--self-test'],
  ['Cost-index confidence shadow sync','build-cost-confidence-shadow.mjs','--check'],
  // Staleness penalty — a complete read still has to be CURRENT. Caps confidence by
  // how overdue the freshest contributing print is for its source's cadence (old ≠
  // overdue: a monthly series a month old reads fresh); fails if any published label
  // sits above its staleness ceiling, so CI won't ship a stale-but-confident reading.
  ['Cost-index staleness honesty','check-staleness-honesty.mjs'],
  ['Cost-index staleness honesty self-test','check-staleness-honesty.mjs','--self-test'],
  // Rigorous bridge — a derived dollar level may publish from an outside series only
  // when the two are COINTEGRATED (Engle–Granger), never on a spurious correlation.
  // Self-test proves the spurious trap is rejected; the gate validates any live bridge.
  ['Cost-index bridge cointegration','check-bridge-cointegration.mjs'],
  ['Cost-index bridge cointegration self-test','check-bridge-cointegration.mjs','--self-test'],
  // Dataset freshness — the JSON-LD dateModified on the methodology pages + hub
  // catalog must equal the seed's generatedAt (machine-readable freshness, a
  // top AI-citation factor). Stamped in place; --check pins it in sync.
  ['Cost-index dataset date','inject-cost-index-dataset-date.mjs','--check'],
  // AEO — speakable WebPage node on every per-ingredient page so voice/answer
  // engines lift the name + answer-first reading (.ci-answer). Post-processor,
  // like the dataset-date stamp above; --check pins it in sync.
  ['Cost-index speakable (idem)','inject-cost-index-speakable.mjs','--check'],
  ['Cost-index dispatch freshness','check-cost-index-dispatch-fresh.mjs'],
  ['Cost-index dispatch freshness self-test','check-cost-index-dispatch-fresh.mjs','--self-test'],
  // The dispatch EMAIL's trust rails (2026-07-06): the golden render committed
  // under data/email-preview/ must match a recompute byte-for-byte, and the
  // recomputed render must pass the content rules (banned techniques, numeric
  // parity, confidence language, sign/verb agreement, quiet-lead determinism,
  // first-print coupling). The templates sat outside every CI net before this.
  ['Cost-index email preview (idem)','build-cost-index-email-preview.mjs','--check'],
  ['Cost-index email content gate','check-cost-index-email.mjs'],
  ['Cost-index email content gate self-test','check-cost-index-email.mjs','--self-test'],
  // Pressure honesty — the inferred outlook can't carry a price, can't use a
  // banned verb, and its rendered direction must equal what the rules recompute.
  ['Cost-pressure honesty','check-pressure-honesty.mjs'],
  ['Cost-pressure sources (shape+readiness)','check-pressure-sources.mjs'],
  // Pressure heartbeat — informational here (the overlay ages between weekly runs,
  // so it must never block a PR); the weekly refresh runs it with --check to turn a
  // persistent stall into a red (alerting) scheduled run.
  ['Cost-pressure freshness (warn)','check-pressure-freshness.mjs'],
  ['Cost-pressure freshness self-test','check-pressure-freshness.mjs','--self-test'],
  ['Security claims',      'check-security-claims.mjs'],
  ['Data promise rail',    'check-data-promise-rail.mjs'],
  ['Security locale parity','check-security-locale-parity.mjs'],
  ['KPI doc freshness',    'check-kpi-doc.mjs',              '--check'],
  ['Experiments parity',   'check-experiments-parity.mjs',   '--check'],
  ['No fixed min-width',   'check-no-fixed-min-width.mjs'],
  ['Table scroll wrap',    'check-table-scroll-wrap.mjs'],
  // Article graphics — Phase-1 graphics refresh. Manifest-driven SVG
  // generator at brand/article-svg/graphics.json. Schema validation,
  // locale parity (EN/ES twin enforcement), and idempotency in
  // --check mode. Empty manifest is allowed; entries get filled in
  // as articles are refreshed in Phase 2+.
  ['Article graphics (idem)','build-article-graphics.mjs',  '--check'],
  // Audio coverage — manifest-driven audit of which written pieces
  // ship a studio audio edition in which languages. Warn-only during
  // the studio-audio rollout (pre-existing ENGLISH-IN-FOREIGN issues
  // on FR/IT/PT/ZH tracks need a re-render with --force-retranslate;
  // the 14 prose pages without listen-btn markup need first-time
  // rendering). Promote to fail-CI by removing --warn from this
  // entry once `node scripts/check-audio-coverage.mjs` reports a
  // clean run. Operator runbook: docs/audio-pipeline.md.
  ['Audio coverage (warn)',  'check-audio-coverage.mjs',    '--warn'],
];

const results = [];
let failed = 0;

for (const [label, script, ...args] of CHECKS) {
  const r = spawnSync(process.execPath, [path.join(repoRoot, 'scripts', script), ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
  const status = r.status === 0 ? 'PASS' : 'FAIL';
  if (r.status !== 0) failed++;
  // Last meaningful line of stdout (or stderr if stdout empty).
  const lines = (r.stdout || r.stderr || '').split(/\r?\n/).filter((l) => l.trim());
  const lastLine = lines[lines.length - 1] || '(no output)';
  results.push({ label, script, status, summary: lastLine.slice(0, 80) });
}

console.log('Cohesion checks');
console.log('───────────────');
for (const r of results) {
  console.log(`  ${r.status === 'PASS' ? '✓' : '✗'} ${r.label.padEnd(22)}  ${r.summary}`);
}
console.log(`───────────────`);
console.log(`${results.length - failed} of ${results.length} passed.`);

process.exit(failed > 0 ? 1 : 0);
