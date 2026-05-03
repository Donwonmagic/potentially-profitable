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
  // for invoice content. Cheap regex check; high-blast-radius bug if
  // it ever regresses (the whole "your numbers never leave this page"
  // promise depends on it).
  ['No invoice egress',   'check-no-invoice-egress.mjs'],
  ['Banned words',        'check-banned-words.mjs'],
  ['Knit coverage',       'check-knit-coverage.mjs',       '--check'],
  ['Button vocabulary',   'check-button-vocabulary.mjs',   '--check'],
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
  // Wave B13 — LLM citation companion auto-derived from themes +
  // allergens. Idempotent: --check fails if themes.js or
  // allergens.js drifted without a corresponding regen of the
  // /tools/menu-design/llm.md companion.
  ['Menu Design LLM (idem)','build-menu-design-llm.mjs',     '--check'],
  // Studio-quality push — per-theme SVG thumbnails generated from
  // themes.js. The picker uses these as <img> instead of canvas
  // approximations so each theme renders with its real typography
  // (browser uses whichever @font-face fonts are loaded). Idempotent
  // check fails if themes drifted without a regen.
  ['Theme thumbnails (idem)','build-theme-thumbnails.mjs',   '--check'],
  ['Glossary knit (idem)','wire-glossary-knit.mjs',        '--check'],
  ['Fieldnotes (idem)',   'inject-glossary-fieldnotes.mjs','--check'],
  ['Post-end CTA (idem)', 'inject-post-end-cta.mjs',       '--check'],
  ['Glossary OG seed (idem)','seed-glossary-og.mjs',       '--check'],
  ['Glossary OG meta (idem)','inject-glossary-og.mjs',     '--check'],
  ['OG template grid',    'check-og-template-grid.mjs',    '--check'],
  ['Kind registry',       'check-kind-registry.mjs',       '--check'],
  ['Intent param targets','check-intent-param-targets.mjs','--check'],
  ['Article fieldnotes (idem)','inject-article-fieldnotes.mjs','--check'],
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
  ['Image dimensions (warn)','check-image-dimensions.mjs',   '--check'],
  ['Lazy images (warn)',  'check-lazy-images.mjs',          '--check'],
  ['CLS animation (warn)','check-cls-animation.mjs',        '--check'],
  ['Image formats (warn)','check-image-formats.mjs',         '--check'],
  ['Newsletter copy',     'check-newsletter-copy.mjs',      '--check'],
  ['Lifecycle locale parity','check-lifecycle-locale-parity.mjs','--check'],
  ['Share snapshot kinds','check-share-snapshot-kinds.mjs', '--check'],
  ['Storefront rail (idem)','inject-tool-storefront-rail.mjs','--check'],
  ['Storefront-health graph (idem)','inject-storefront-health-graph.mjs','--check'],
  ['Security page schema (idem)','inject-security-page-schema.mjs','--check'],
  ['Tool data-promise (idem)','inject-tool-data-promise.mjs','--check'],
  ['Tool no-fetch invariant','check-tool-no-fetch.mjs'],
  ['Menu-Design consistency','check-menu-design.mjs'],
  ['Themes lint',          'check-themes-lint.mjs'],
  ['Themes metadata',      'check-themes-metadata.mjs'],
  ['Security claims',      'check-security-claims.mjs'],
  ['Data promise rail',    'check-data-promise-rail.mjs'],
  ['Security locale parity','check-security-locale-parity.mjs'],
  ['KPI doc freshness',    'check-kpi-doc.mjs',              '--check'],
  ['Experiments parity',   'check-experiments-parity.mjs',   '--check'],
  ['No fixed min-width',   'check-no-fixed-min-width.mjs'],
  ['Table scroll wrap',    'check-table-scroll-wrap.mjs'],
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
