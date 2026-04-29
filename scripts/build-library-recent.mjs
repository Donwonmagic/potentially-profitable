#!/usr/bin/env node
// Render the "Recently added" strip on /learn/ (EN + ES) between
// <!-- recently-added -->...<!-- /recently-added --> sentinels.
// Three cards, sorted by date desc, drawn from the union of:
//   - data/tools.json[*].added           (Phase 2 tool entries)
//   - data/library-tags.json.blog_posts.<slug>.date (article dates)
//
// Why a strip and not the existing 6 topic cards: returning visitors
// want to know "what's new since I last looked." A 3-card row above
// the topic grid answers that without crowding the page.
//
//   node scripts/build-library-recent.mjs           # rewrites in place
//   node scripts/build-library-recent.mjs --check   # exits non-zero if anything would change

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const tools = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'tools.json'),        'utf8'));
const tags  = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'library-tags.json'), 'utf8'));
const knit  = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'tool-knit.json'),    'utf8'));

const SENTINEL_OPEN  = '<!-- recently-added -->';
const SENTINEL_CLOSE = '<!-- /recently-added -->';
const SENTINEL_RE    = new RegExp(
  `${SENTINEL_OPEN.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}[\\s\\S]*?${SENTINEL_CLOSE.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`
);

function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function escText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// --- collect candidates ----------------------------------------------

const candidates = [];

for (const [slug, t] of Object.entries(tools.tools || {})) {
  if (t.status !== 'live' || !t.added) continue;
  candidates.push({
    kind: 'tool',
    date: t.added,
    title_en: t.title_en,
    title_es: t.title_es,
    url_en: t.url_en,
    url_es: t.url_es,
    eyebrow_en: 'New tool',
    eyebrow_es: 'Nueva herramienta',
  });
}

for (const [slug, post] of Object.entries(tags.blog_posts || {})) {
  if (!post.date) continue;
  const url = `/blog/${slug}/`;
  // Prefer the friendly label from tool-knit.json.articles{} so the
  // Recently Added card uses the same short text as the rest of the
  // ecosystem; fall back to the long blog title if no label is set.
  const labels = knit.articles && knit.articles[url];
  candidates.push({
    kind: 'article',
    date: post.date,
    title_en: labels ? labels.label_en : post.title,
    title_es: labels ? labels.label_es : post.title,
    url_en: url,
    url_es: `/es${url}`,
    eyebrow_en: 'New article',
    eyebrow_es: 'Nuevo artículo',
  });
}

candidates.sort((a, b) => b.date.localeCompare(a.date));
const top = candidates.slice(0, 8);

if (top.length < 3) {
  console.error(`build-library-recent: only ${top.length} dated items found; expected at least 3.`);
  process.exit(2);
}

// --- render -----------------------------------------------------------
//
// Phase 5 Move 5 (Field Guide editorial): the strip is rendered as
// a tabular index, not a card grid. Same data, different posture —
// reads like the cover of a reference work, lets us show 8 entries
// instead of 3, and the dedicated Contributor column is reserved
// for the day a guest byline ships (no markup change required to
// surface it).
//
// Section column is derived from the eyebrow string: "New tool" →
// "Tools", "New article" → "Articles", "Nueva investigación" →
// "Investigación", etc. Falls through to the eyebrow itself if the
// short-form lookup misses (defensive: a future eyebrow value
// without a mapped Section just reads as the eyebrow string).
const SECTION_FROM_EYEBROW = {
  // EN
  'New tool':           'Tools',
  'New article':        'Articles',
  'New research':       'Research',
  'New checklist':      'Checklists',
  'New playbook':       'Articles',
  'New term':           'Glossary',
  // ES
  'Nueva herramienta':  'Herramientas',
  'Nuevo artículo':     'Artículos',
  'Nueva investigación': 'Investigación',
  'Nueva lista':        'Listas',
  'Nuevo playbook':     'Artículos',
  'Nuevo término':      'Glosario',
};

function sectionFor(eyebrow) {
  return SECTION_FROM_EYEBROW[eyebrow] || eyebrow || '—';
}

function renderRow(item, locale) {
  const eyebrow = locale === 'en' ? item.eyebrow_en : item.eyebrow_es;
  const title   = locale === 'en' ? item.title_en   : item.title_es;
  const url     = locale === 'en' ? item.url_en     : item.url_es;
  const section = sectionFor(eyebrow);
  // Contributor stays as-is until a real byline ships. Hardcoded to
  // "Don Goldstein" today; future entries can carry a `contributor`
  // field on the source data and replace this fallback inline.
  const contributor = item.contributor || 'Don Goldstein';
  return `      <tr>
        <td class="lib-idx-title"><a href="${escAttr(url)}">${escText(title)}</a></td>
        <td class="lib-idx-section">${escText(section)}</td>
        <td class="lib-idx-date" aria-label="${escAttr(item.date)}"><time datetime="${escAttr(item.date)}">${escText(item.date)}</time></td>
        <td class="lib-idx-contributor">${escText(contributor)}</td>
      </tr>`;
}

function renderBody(locale) {
  const eyebrow = locale === 'en' ? 'Library index' : 'Índice de la biblioteca';
  const heading = locale === 'en' ? 'Recently added.' : 'Añadido recientemente.';
  const subhead = locale === 'en'
    ? 'The eight most recent entries across the library — articles, research, tools, and checklists. Older entries live in the topic shelves below.'
    : 'Las ocho entradas más recientes de la biblioteca — artículos, investigación, herramientas y listas. Las entradas antiguas viven en las secciones por tema más abajo.';
  const colTitle    = locale === 'en' ? 'Title'        : 'Título';
  const colSection  = locale === 'en' ? 'Section'      : 'Sección';
  const colDate     = locale === 'en' ? 'Last updated' : 'Última actualización';
  const colContrib  = locale === 'en' ? 'Contributor'  : 'Autor';
  const captionText = locale === 'en' ? 'Recently added across the library' : 'Añadidos recientes en toda la biblioteca';
  const rows        = top.map((c) => renderRow(c, locale)).join('\n');
  return `${SENTINEL_OPEN}
<section class="block recently-added" aria-labelledby="recently-added-heading">
  <div class="container">
    <header class="recently-added__head">
      <span class="eyebrow">${escText(eyebrow)}</span>
      <h2 id="recently-added-heading">${escText(heading)}</h2>
      <p class="recently-added__sub">${escText(subhead)}</p>
    </header>
    <table class="lib-idx" role="table">
      <caption class="sr-only">${escText(captionText)}</caption>
      <thead>
        <tr>
          <th scope="col" class="lib-idx-title">${escText(colTitle)}</th>
          <th scope="col" class="lib-idx-section">${escText(colSection)}</th>
          <th scope="col" class="lib-idx-date">${escText(colDate)}</th>
          <th scope="col" class="lib-idx-contributor">${escText(colContrib)}</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</section>
${SENTINEL_CLOSE}`;
}

// --- write ------------------------------------------------------------

const TARGETS = [
  { file: 'learn/index.html',    locale: 'en' },
  { file: 'es/learn/index.html', locale: 'es' },
];

let changed = 0;
for (const { file, locale } of TARGETS) {
  const fp  = path.join(REPO, file);
  const src = fs.readFileSync(fp, 'utf8');
  if (!SENTINEL_RE.test(src)) {
    console.error(`${file}: missing ${SENTINEL_OPEN} / ${SENTINEL_CLOSE} sentinels.`);
    process.exit(3);
  }
  const next = src.replace(SENTINEL_RE, renderBody(locale));
  if (next !== src) {
    if (!checkOnly) fs.writeFileSync(fp, next);
    changed++;
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${file}`);
  }
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of ${TARGETS.length} learn page(s).`);
if (checkOnly && changed > 0) process.exit(1);
