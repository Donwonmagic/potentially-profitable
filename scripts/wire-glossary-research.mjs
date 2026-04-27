#!/usr/bin/env node
// Cross-link glossary terms to relevant Muntin research notes. For each
// term, inserts a compact "See the research" line immediately after the
// .gloss-term-why paragraph, pointing at /learn/research/<slug>/. The
// research drawer (site.js) intercepts clicks and opens an inline
// preview without leaving the glossary page.
//
// Two sources, in priority order:
//   1. TERM_TO_RESEARCH — explicit per-term map (curator's choice).
//   2. Topic-overlap fallback — for any term not in the map, picks the
//      first research note in data/library-tags.json.research_notes
//      whose topics[] overlaps the term's data-topics. Surfaces a
//      research link on every term whose topic has at least one note,
//      instead of leaving 100+ terms unreferenced.
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

const tags = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data', 'library-tags.json'), 'utf8'));

// Friendly labels for research notes — one entry per slug found in
// data/library-tags.json.research_notes. Used by the topic-overlap
// fallback. EN and ES both required; falls back to EN if ES missing.
const RESEARCH_LABELS = {
  'lighthouse-performance-scoring': { label: 'How Lighthouse scores performance',    label_es: 'Cómo califica Lighthouse el rendimiento' },
  'mobile-page-speed-3-second-rule':{ label: 'The 3-second mobile load rule',        label_es: 'La regla de los 3 segundos en móvil' },
  'fittss-law':                     { label: "Fitts's Law",                          label_es: 'Ley de Fitts' },
  'cart-abandonment-rate':          { label: 'The 70% cart abandonment rate',        label_es: 'La tasa del 70% de abandono de carrito' },
  'local-business-websites':        { label: 'Usability of local business websites', label_es: 'Usabilidad de sitios de negocios locales' },
};

// term id → { slug, label, label_es } — explicit map. Curator's choice
// wins over topic fallback so an obvious mapping (LCP → Lighthouse
// scoring, CTA → Fitts's Law) doesn't get overridden by a less-specific
// topic-overlap pick.
const TERM_TO_RESEARCH = {
  'core-web-vitals':   { slug: 'lighthouse-performance-scoring',     ...RESEARCH_LABELS['lighthouse-performance-scoring'] },
  'lcp':               { slug: 'lighthouse-performance-scoring',     ...RESEARCH_LABELS['lighthouse-performance-scoring'] },
  'cls':               { slug: 'lighthouse-performance-scoring',     ...RESEARCH_LABELS['lighthouse-performance-scoring'] },
  'lighthouse':        { slug: 'lighthouse-performance-scoring',     ...RESEARCH_LABELS['lighthouse-performance-scoring'] },
  'fcp':               { slug: 'lighthouse-performance-scoring',     ...RESEARCH_LABELS['lighthouse-performance-scoring'] },
  'viewport-meta':     { slug: 'mobile-page-speed-3-second-rule',    ...RESEARCH_LABELS['mobile-page-speed-3-second-rule'] },
  'tap-targets':       { slug: 'fittss-law',                         ...RESEARCH_LABELS['fittss-law'] },
  'cta':               { slug: 'fittss-law',                         ...RESEARCH_LABELS['fittss-law'] },
  'sticky-footer':     { slug: 'fittss-law',                         ...RESEARCH_LABELS['fittss-law'] },
  'reservation-link':  { slug: 'cart-abandonment-rate',              ...RESEARCH_LABELS['cart-abandonment-rate'] },
  'online-ordering':   { slug: 'cart-abandonment-rate',              ...RESEARCH_LABELS['cart-abandonment-rate'] },
  'hours-visibility':  { slug: 'local-business-websites',            ...RESEARCH_LABELS['local-business-websites'] },
  'click-to-call':     { slug: 'local-business-websites',            ...RESEARCH_LABELS['local-business-websites'] },
};

// Pick the first research note (by stable slug order) whose topics[]
// overlaps any of the given termTopics. Returns null if no overlap.
function pickResearchByTopic(termTopics) {
  if (!termTopics || !termTopics.length) return null;
  const myTopics = new Set(termTopics);
  const notes = tags.research_notes || {};
  const slugs = Object.keys(notes).filter((s) => s !== '_doc' && RESEARCH_LABELS[s]).sort();
  for (const slug of slugs) {
    const noteTopics = notes[slug].topics || [];
    if (noteTopics.some((t) => myTopics.has(t))) {
      return { slug, ...RESEARCH_LABELS[slug] };
    }
  }
  return null;
}

// Pull data-topics="..." from a glossary <article>'s opening tag.
const TOPICS_RE = /data-topics="([^"]*)"/;
function topicsFromBlock(block) {
  const m = TOPICS_RE.exec(block);
  if (!m) return [];
  return m[1].split(/\s+/).filter(Boolean);
}

const TARGETS = [
  { locale: 'en', file: 'glossary/index.html',    urlPrefix: '/learn/research',    seeLabel: 'See the research' },
  { locale: 'es', file: 'es/glossary/index.html', urlPrefix: '/es/learn/research', seeLabel: 'Ver la investigación' },
];

// All term ids in the index page. Used to drive the topic-fallback
// loop without hard-coding every term.
function allTermIds(html) {
  const re = /<article class="gloss-term"\s+id="([^"]+)"/g;
  const ids = [];
  let m;
  while ((m = re.exec(html)) !== null) ids.push(m[1]);
  return ids;
}

let totalInjected = 0;
let totalFallback = 0;
for (const target of TARGETS) {
  const abs = path.join(repoRoot, target.file);
  if (!fs.existsSync(abs)) { console.warn(`missing: ${target.file}`); continue; }
  let src = fs.readFileSync(abs, 'utf8');
  let injected = 0;
  let fallback = 0;
  for (const id of allTermIds(src)) {
    const re = new RegExp(
      '(<article class="gloss-term" id="' + id + '"[\\s\\S]*?)(</article>)',
      'm'
    );
    const m = re.exec(src);
    if (!m) continue;
    const block = m[1];
    if (block.includes('gloss-term-research')) continue; // already wired

    let entry = TERM_TO_RESEARCH[id];
    let viaFallback = false;
    if (!entry) {
      entry = pickResearchByTopic(topicsFromBlock(block));
      viaFallback = !!entry;
    }
    if (!entry) continue; // no explicit map and no topic match — skip silently

    const label = target.locale === 'es' ? entry.label_es : entry.label;
    const href  = target.urlPrefix + '/' + entry.slug + '/';
    const injection =
      '        <p class="gloss-term-research"><strong>' + target.seeLabel + '</strong>' +
      ' <a href="' + href + '">' + label + ' <span aria-hidden="true">↗</span></a></p>\n      ';
    src = src.replace(re, m[1] + injection + m[2]);
    injected++;
    if (viaFallback) fallback++;
  }
  if (injected) {
    fs.writeFileSync(abs, src);
    console.log(`${target.file}: injected ${injected} research cross-links (${fallback} via topic fallback)`);
    totalInjected += injected;
    totalFallback += fallback;
  } else {
    console.log(`${target.file}: no changes (all terms already wired or no topic match)`);
  }
}
console.log(`\nTotal: ${totalInjected} cross-link(s) injected (${totalFallback} via topic fallback) across glossary locales.`);
