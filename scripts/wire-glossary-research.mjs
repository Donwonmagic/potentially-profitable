#!/usr/bin/env node
// Cross-link specific glossary terms to their relevant Muntin
// research notes. For each term in the map, inserts a compact
// "See the research" line immediately after the .gloss-term-why
// paragraph, pointing at /learn/research/<slug>/. The research
// drawer (site.js) intercepts clicks and opens an inline preview
// without leaving the glossary page.
//
// Idempotent: skips a term whose <article> already contains a
// .gloss-term-research element. Safe to re-run after edits.
//
// Runs on both locales by detecting /learn/research/ vs
// /es/learn/research/ from the file path.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// term id → { slug, label (EN), label_es }
const TERM_TO_RESEARCH = {
  'core-web-vitals':   { slug: 'lighthouse-performance-scoring',     label: 'How Lighthouse scores performance',    label_es: 'Cómo califica Lighthouse el rendimiento' },
  'lcp':               { slug: 'lighthouse-performance-scoring',     label: 'How Lighthouse scores performance',    label_es: 'Cómo califica Lighthouse el rendimiento' },
  'cls':               { slug: 'lighthouse-performance-scoring',     label: 'How Lighthouse scores performance',    label_es: 'Cómo califica Lighthouse el rendimiento' },
  'lighthouse':        { slug: 'lighthouse-performance-scoring',     label: 'How Lighthouse scores performance',    label_es: 'Cómo califica Lighthouse el rendimiento' },
  'fcp':               { slug: 'lighthouse-performance-scoring',     label: 'How Lighthouse scores performance',    label_es: 'Cómo califica Lighthouse el rendimiento' },
  'viewport-meta':     { slug: 'mobile-page-speed-3-second-rule',    label: 'The 3-second mobile load rule',        label_es: 'La regla de los 3 segundos en móvil' },
  'tap-targets':       { slug: 'fittss-law',                         label: "Fitts's Law",                          label_es: 'Ley de Fitts' },
  'cta':               { slug: 'fittss-law',                         label: "Fitts's Law",                          label_es: 'Ley de Fitts' },
  'sticky-footer':     { slug: 'fittss-law',                         label: "Fitts's Law",                          label_es: 'Ley de Fitts' },
  'reservation-link':  { slug: 'cart-abandonment-rate',              label: 'The 70% cart abandonment rate',        label_es: 'La tasa del 70% de abandono de carrito' },
  'online-ordering':   { slug: 'cart-abandonment-rate',              label: 'The 70% cart abandonment rate',        label_es: 'La tasa del 70% de abandono de carrito' },
  'hours-visibility':  { slug: 'local-business-websites',            label: 'Usability of local business websites', label_es: 'Usabilidad de sitios de negocios locales' },
  'click-to-call':     { slug: 'local-business-websites',            label: 'Usability of local business websites', label_es: 'Usabilidad de sitios de negocios locales' },
};

const TARGETS = [
  { locale: 'en', file: 'glossary/index.html',    urlPrefix: '/learn/research',    seeLabel: 'See the research' },
  { locale: 'es', file: 'es/glossary/index.html', urlPrefix: '/es/learn/research', seeLabel: 'Ver la investigación' },
];

let totalInjected = 0;
for (const target of TARGETS) {
  const abs = path.join(repoRoot, target.file);
  if (!fs.existsSync(abs)) { console.warn(`missing: ${target.file}`); continue; }
  let src = fs.readFileSync(abs, 'utf8');
  let injected = 0;
  for (const [id, entry] of Object.entries(TERM_TO_RESEARCH)) {
    // Match the article block for this term id, up to and including
    // its closing </article>. Captures so we can test idempotency and
    // insert before the closing tag.
    const re = new RegExp(
      '(<article class="gloss-term" id="' + id + '"[\\s\\S]*?)(</article>)',
      'm'
    );
    const m = re.exec(src);
    if (!m) continue;
    const block = m[1];
    if (block.includes('gloss-term-research')) continue; // already wired
    const label = target.locale === 'es' ? entry.label_es : entry.label;
    const href  = target.urlPrefix + '/' + entry.slug + '/';
    const injection =
      '        <p class="gloss-term-research"><strong>' + target.seeLabel + '</strong>' +
      ' <a href="' + href + '">' + label + ' <span aria-hidden="true">↗</span></a></p>\n      ';
    src = src.replace(re, m[1] + injection + m[2]);
    injected++;
  }
  if (injected) {
    fs.writeFileSync(abs, src);
    console.log(`${target.file}: injected ${injected} research cross-links`);
    totalInjected += injected;
  } else {
    console.log(`${target.file}: no changes (all terms already wired or not found)`);
  }
}
console.log(`\nTotal: ${totalInjected} cross-link(s) injected across glossary locales.`);
