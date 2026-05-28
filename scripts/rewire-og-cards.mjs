#!/usr/bin/env node
// One-shot: rewire og:image / twitter:image on every EN + ES page to
// its newly-authored Spanish sibling card (or a newly-authored EN
// card for pages that previously shared a sibling's). Idempotent —
// re-running after the pages already point at the right cards is a
// no-op. Run once via `node scripts/rewire-og-cards.mjs`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MAP = [
  // ES side — every ES page gets its Spanish sibling.
  ['es/index.html',                                        'brand/og/home-es.svg'],
  ['es/about/index.html',                                  'brand/og/about-es.svg'],
  ['es/services/index.html',                               'brand/og/services-es.svg'],
  ['es/glossary/index.html',                               'brand/og/glossary-es.svg'],
  ['es/for/restaurants/index.html',                        'brand/og/restaurants-es.svg'],
  // /es/work/* entries retired in Phase 8 (portfolio sunset) — the
  // /work/ section was removed when the company became the resume.
  ['es/learn/checklists/restaurant-website-checklist/index.html', 'brand/og/checklist-es.svg'],
  ['es/tools/index.html',                                  'brand/og/audit-es.svg'],
  ['es/tools/audits/index.html',                           'brand/og/audit-es.svg'],
  ['es/tools/compare/index.html',                          'brand/og/tool-compare-es.svg'],
  ['es/tools/gbp-grader/index.html',                       'brand/og/tool-gbp-grader-es.svg'],
  ['es/tools/mobile-check/index.html',                     'brand/og/tool-mobile-check-es.svg'],
  ['es/tools/schema-check/index.html',                     'brand/og/tool-schema-check-es.svg'],
  ['es/tools/search-ideas/index.html',                     'brand/og/tool-search-ideas-es.svg'],
  ['es/tools/seo-grader/index.html',                       'brand/og/tool-seo-grader-es.svg'],
  ['es/tools/speed-test/index.html',                       'brand/og/tool-speed-test-es.svg'],
  ['es/tools/tech-stack/index.html',                       'brand/og/tool-tech-stack-es.svg'],

  // EN side — new cards for pages that previously shared a sibling's.
  ['about/index.html',                                     'brand/og/about.svg'],
  ['services/index.html',                                  'brand/og/services.svg'],
  ['glossary/index.html',                                  'brand/og/glossary.svg'],
  ['tools/compare/index.html',                             'brand/og/tool-compare.svg'],
  ['tools/gbp-grader/index.html',                          'brand/og/tool-gbp-grader.svg'],
  ['tools/mobile-check/index.html',                        'brand/og/tool-mobile-check.svg'],
  ['tools/schema-check/index.html',                        'brand/og/tool-schema-check.svg'],
  ['tools/search-ideas/index.html',                        'brand/og/tool-search-ideas.svg'],
  ['tools/seo-grader/index.html',                          'brand/og/tool-seo-grader.svg'],
  ['tools/speed-test/index.html',                          'brand/og/tool-speed-test.svg'],
  ['tools/tech-stack/index.html',                          'brand/og/tool-tech-stack.svg'],
];

const BASE = 'https://muntin.digital/';

let changed = 0;
for (const [rel, cardRel] of MAP) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.warn('SKIP (missing):', rel);
    continue;
  }
  const src = fs.readFileSync(abs, 'utf8');
  const target = BASE + cardRel;

  let out = src;
  // og:image
  out = out.replace(
    /(<meta property="og:image" content=")[^"]*(" \/>)/,
    '$1' + target + '$2'
  );
  // twitter:image
  out = out.replace(
    /(<meta name="twitter:image" content=")[^"]*(" \/>)/,
    '$1' + target + '$2'
  );
  // og:image:type — every new card is SVG; keep the declaration consistent.
  out = out.replace(
    /(<meta property="og:image:type" content=")[^"]*(" \/>)/,
    '$1image/svg+xml$2'
  );

  if (out !== src) {
    fs.writeFileSync(abs, out, 'utf8');
    changed++;
    console.log('  rewrote', rel, '→', cardRel);
  } else {
    console.log('  unchanged', rel);
  }
}
console.log('Done. ' + changed + ' file(s) rewritten.');
