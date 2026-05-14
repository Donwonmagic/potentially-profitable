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
  // Invoice-Decoder safety: the four server files in src/ that touch
  // the decoder pipeline must NOT contain any outbound network paths
  ['Banned words',        'check-banned-words.mjs'],
  // Sprint M (2026-05-08): retired-slug regression guard. Fails CI
  // if either retired slug is reintroduced anywhere outside the
  // documented allow list (_redirects, 404.html, historical
  // citation snapshots, this script).
  ['Removed slugs',       'check-removed-slugs.mjs'],
  ['Knit coverage',       'check-knit-coverage.mjs',       '--check'],
  ['Button vocabulary',   'check-button-vocabulary.mjs',   '--check'],
  // Phase 1 (tool-suite upgrade) — guard against NEW innerHTML usage
  // while Phase 3 retrofits existing call sites. Strict mode: fails CI
  // if total usage exceeds the BASELINE_COUNT pinned in the script.
  ['No new innerHTML',    'check-no-innerhtml.mjs',        '--check'],
  ['Tool header',         'check-tool-header.mjs',         '--check'],
  ['Hidden attribute',    'check-hidden-attribute.mjs',    '--check'],
  ['OG image refs',       'check-og-images.mjs'],
  ['OG coverage',         'check-og-coverage.mjs',         '--check'],
  ['Analytics vocab',     'check-analytics-vocabulary.mjs','--check'],
  // Wave A unit-test gate (node:test). Covers menu-schema +
  // reducer/store + allergens regime math today; new modules
  // ship their tests next to the source and the runner picks
  // them up by glob.
  ['Unit tests',          'check-tests.mjs'],
  ['Glossary knit (idem)','wire-glossary-knit.mjs',        '--check'],
  ['Fieldnotes (idem)',   'inject-glossary-fieldnotes.mjs','--check'],
  ['Post-end CTA (idem)', 'inject-post-end-cta.mjs',       '--check'],
  ['Article sheet callouts (idem)','inject-article-sheet-callouts.mjs','--check'],
  ['Glossary OG seed (idem)','seed-glossary-og.mjs',       '--check'],
  ['Glossary OG meta (idem)','inject-glossary-og.mjs',     '--check'],
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
  ['Article TL;DR',       'check-article-tldr.mjs',        '--check'],
  ['Article TL;DR retrofit (idem)','inject-article-tldr.mjs','--check'],
  ['Article HowTo schema (idem)','inject-article-howto-schema.mjs','--check'],
  ['Article abstract+mentions (idem)','inject-article-abstract-mentions.mjs','--check'],
  ['Smart-next CTA (idem)','inject-smart-next-cta.mjs',     '--check'],
  ['KnitRail (idem)',     'inject-knit-rail.mjs',           '--check'],
  ['Topic eyebrow (idem)','inject-topic-eyebrow.mjs',       '--check'],
  ['Glossary term-example (idem)','inject-glossary-term-examples.mjs','--check'],
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
  ['Hub collection schema (idem)','inject-hub-collection-schema.mjs','--check'],
  ['Author chip (idem)',  'inject-article-author-chip.mjs', '--check'],
  ['Sitemap (idem)',      'build-sitemap.mjs',              '--check'],
  ['Tool verified stamp (idem)','inject-tool-verified-stamp.mjs','--check'],
  ['Tool verified stamp', 'check-tool-verified-stamp.mjs', '--check'],
  ['llms.txt (idem)',     'build-llms-txt.mjs',            '--check'],
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
  ['Storefront rail (idem)','inject-tool-storefront-rail.mjs','--check'],
  ['Storefront-health graph (idem)','inject-storefront-health-graph.mjs','--check'],
  ['Security page schema (idem)','inject-security-page-schema.mjs','--check'],
  ['Tool data-promise (idem)','inject-tool-data-promise.mjs','--check'],
  ['Tool no-fetch invariant','check-tool-no-fetch.mjs'],
  ['Sheet no-fetch invariant','check-sheet-no-fetch.mjs'],
  ['Themes review board (idem)','build-themes-review-board.mjs','--check'],
  ['Theme story pages (idem)','build-theme-story-pages.mjs','--check'],
  ['Cuisine landing pages (idem)','build-cuisine-landing-pages.mjs','--check'],
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
