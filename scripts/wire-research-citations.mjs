#!/usr/bin/env node
// Wire blog .cite detail blocks and the bottom "Sources" list to
// Muntin's internal research notes. Maps each known external citation
// URL to the corresponding /learn/research/<slug>/ page, then prepends
// an internal "Read Don's summary" link (new-tab) before the existing
// external link inside each block. The reader keeps the blog post's
// scroll position; the research note opens alongside.
//
// Idempotent: if the .cite block already contains a research-note
// anchor it's skipped.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// One row per external research URL → internal note slug. Keep URLs
// matched without trailing / or protocol variations by using indexOf.
const NOTE_MAP = [
  {
    urlNeedle: 'thinkwithgoogle.com/marketing-strategies/app-and-mobile/mobile-page-speed-new-industry-benchmarks',
    slug: 'mobile-page-speed-3-second-rule',
    en: { label: "Read Don's 2-minute summary" },
    es: { label: "Leer el resumen de Don (2 min)" },
  },
  {
    urlNeedle: 'nngroup.com/articles/local-business/',
    slug: 'local-business-websites',
    en: { label: "Read Don's 2-minute summary" },
    es: { label: "Leer el resumen de Don (2 min)" },
  },
  {
    urlNeedle: 'nngroup.com/articles/fittss-law/',
    slug: 'fittss-law',
    en: { label: "Read Don's 2-minute summary" },
    es: { label: "Leer el resumen de Don (2 min)" },
  },
  {
    urlNeedle: 'baymard.com/lists/cart-abandonment-rate',
    slug: 'cart-abandonment-rate',
    en: { label: "Read Don's 2-minute summary" },
    es: { label: "Leer el resumen de Don (2 min)" },
  },
  {
    urlNeedle: 'developer.chrome.com/docs/lighthouse/performance/performance-scoring',
    slug: 'lighthouse-performance-scoring',
    en: { label: "Read Don's 2-minute summary" },
    es: { label: "Leer el resumen de Don (2 min)" },
  },
];

function collectPosts(locale) {
  const dir = locale === 'en'
    ? path.join(repoRoot, 'blog')
    : path.join(repoRoot, locale, 'blog');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name !== 'drafts')
    .map(e => path.join(dir, e.name, 'index.html'))
    .filter(p => fs.existsSync(p));
}

function wire(locale, html) {
  let next = html;
  let hits = 0;

  for (const entry of NOTE_MAP) {
    // Build the internal URL for this locale.
    const internalHref = locale === 'en'
      ? `/learn/research/${entry.slug}/`
      : `/es/learn/research/${entry.slug}/`;

    // Idempotency guard: if this internal href already appears in the
    // file (from a previous run), don't re-inject.
    if (next.includes(`href="${internalHref}"`)) continue;

    // Match a .cite-body anchor that links to the external source, and
    // also the bottom Sources list anchor. We inject an internal CTA
    // before the external <a> in .cite-body by wrapping both in a
    // .cite-actions block. The Sources <li> gets the internal link
    // prefixed as "Don's summary · " with the existing external link
    // retained as "(original)."
    //
    // The regex below is purposely narrow: it requires the same URL
    // substring (entry.urlNeedle) to appear as the anchor href. That
    // way a casual mention of "thinkwithgoogle.com" in prose never
    // gets rewritten by accident.

    // .cite-body treatment: prepend a block with the internal button.
    const cite = new RegExp(
      `(<a\\s+href="https?://[^"]*${entry.urlNeedle.replace(/[.\\/]/g, '\\$&')}[^"]*"\\s+target="_blank"\\s+rel="noopener">[^<]*</a>)`,
      'g'
    );
    const replaced = next.replace(cite, (match) => {
      hits++;
      const label = locale === 'en' ? entry.en.label : entry.es.label;
      return (
        `<a class="cite-note-link" href="${internalHref}" target="_blank" rel="noopener">${label} <span aria-hidden="true">↗</span></a>\n          ${match}`
      );
    });
    next = replaced;
  }

  return { next, hits };
}

let updated = 0, skipped = 0, totalHits = 0;
for (const locale of ['en', 'es']) {
  for (const file of collectPosts(locale)) {
    const src = fs.readFileSync(file, 'utf8');
    const { next, hits } = wire(locale, src);
    if (next !== src) {
      fs.writeFileSync(file, next);
      updated++;
      totalHits += hits;
      console.log(`updated [${locale}]: ${path.relative(repoRoot, file)}  (+${hits} internal links)`);
    } else {
      skipped++;
    }
  }
}
console.log(`\n${updated} file(s) updated, ${skipped} already wired or no citations, ${totalHits} internal research links injected total.`);
