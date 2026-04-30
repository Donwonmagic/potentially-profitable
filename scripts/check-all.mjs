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
  ['Knit coverage',       'check-knit-coverage.mjs',       '--check'],
  ['Button vocabulary',   'check-button-vocabulary.mjs',   '--check'],
  ['Tool header',         'check-tool-header.mjs',         '--check'],
  ['Hidden attribute',    'check-hidden-attribute.mjs',    '--check'],
  ['OG image refs',       'check-og-images.mjs'],
  ['OG coverage',         'check-og-coverage.mjs',         '--check'],
  ['Analytics vocab',     'check-analytics-vocabulary.mjs','--check'],
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
  ['Glossary term-example (idem)','inject-glossary-term-examples.mjs','--check'],
  ['Glossary deep anchors (idem)','inject-glossary-deep-anchors.mjs','--check'],
  ['Glossary verified stamp (idem)','inject-glossary-verified-stamp.mjs','--check'],
  ['Glossary hub',        'check-glossary-hub.mjs',         '--check'],
  ['Topic pillar essay (idem)','inject-topic-pillar-essay.mjs','--check'],
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
  ['KPI doc freshness',    'check-kpi-doc.mjs',              '--check'],
  ['Experiments parity',   'check-experiments-parity.mjs',   '--check'],
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
