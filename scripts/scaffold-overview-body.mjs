#!/usr/bin/env node
/**
 * Phase H.1 — batch-overview body scaffold.
 *
 * Companion to check-overview-quality.mjs. Outputs the HTML body
 * fragment for a new batch overview, pre-filled with the structure
 * the gate enforces:
 *
 *   - Six <h2> placeholders with TODO comments describing what each
 *     section must do (synthesis spine, not list of pieces).
 *   - Three <figure class="viz-figure"> stubs (one .viz-bars for the
 *     quantitative claim, one .viz-flow for the unifying graphic,
 *     one .viz-flow for the reading-order ladder).
 *   - A complete <section class="wave-toc"> capstone with one
 *     <li class="wave-toc__item"> per deep-dive in the batch,
 *     resolved from data/library-tags.json by matching the batch's
 *     date. EN and ES versions emit their respective slug maps.
 *
 * The output is the inner body — what new-article-skeleton.mjs takes
 * as its `body_html` field in the brief JSON. Pipe it in, or paste
 * it into the brief file.
 *
 * Usage
 *   node scripts/scaffold-overview-body.mjs <batch-key> <locale>
 *   node scripts/scaffold-overview-body.mjs 2026-w4 en
 *   node scripts/scaffold-overview-body.mjs 2026-w4 es
 *
 * Output goes to stdout. The script does NOT write to disk — pipe
 * it where you need it.
 *
 * Pairs with check-overview-quality.mjs: if you start from this
 * scaffold, the gate's structural rules are satisfied by
 * construction. The remaining work is editorial: fill in the H2
 * titles, the viz figure data, the thesis prose, and the deep-dive
 * inline citations (each piece must be linked >= 2 times in the
 * finished article, once inline + once in the capstone).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');

const [, , batchKey, localeArg] = process.argv;
if (!batchKey || !localeArg) {
  console.error('Usage: node scripts/scaffold-overview-body.mjs <batch-key> <locale>');
  console.error('   e.g. node scripts/scaffold-overview-body.mjs 2026-w4 en');
  process.exit(1);
}
const locale = localeArg === 'es' ? 'es' : 'en';

function readJSON(rel) {
  return JSON.parse(fs.readFileSync(path.join(REPO, rel), 'utf8'));
}

const batches = readJSON('data/library-batches.json').batches || {};
const batch = batches[batchKey];
if (!batch) {
  console.error(`batch '${batchKey}' not found in data/library-batches.json`);
  process.exit(2);
}

const tags = readJSON('data/library-tags.json');
const slugMap = readJSON('data/i18n-slug-map.json').blog || {};

// Resolve deep-dives by matching the batch's date in library-tags.
const overviewEn = batch.overview_en || '';
const deepDiveEnSlugs = [];
for (const [slug, post] of Object.entries(tags.blog_posts || {})) {
  if (post.date === batch.date && !overviewEn.includes(slug)) {
    deepDiveEnSlugs.push({
      slug,
      title: post.title || slug,
      dek:   post.dek   || '',
    });
  }
}
if (deepDiveEnSlugs.length === 0) {
  console.error(`no deep-dives found for date ${batch.date}. Add the deep-dives to data/library-tags.json first, then re-run.`);
  process.exit(3);
}

const num = (i) => String(i + 1).padStart(2, '0');

function tocItem(i, slug, role, title, desc) {
  return [
    `      <li class="wave-toc__item" data-band="search">`,
    `        <span class="wave-toc__num">${num(i)}</span>`,
    `        <div class="wave-toc__body">`,
    `          <p class="wave-toc__role">${role}</p>`,
    `          <a class="wave-toc__title" href="${slug}">${title}</a>`,
    `          <p class="wave-toc__desc">${desc}</p>`,
    `        </div>`,
    `      </li>`,
  ].join('\n');
}

function deepDiveHref(slug) {
  if (locale === 'es') {
    const esSlug = slugMap[slug];
    return esSlug ? `/es/blog/${esSlug}/` : `/blog/${slug}/  <!-- TODO: ES slug missing in data/i18n-slug-map.json -->`;
  }
  return `/blog/${slug}/`;
}

const I18N = locale === 'es' ? {
  todoNote: 'EDITORIAL TODO: replace each placeholder.',
  thesisTodo: 'TODO — la tesis unificadora en una frase.',
  h2: [
    'TODO — H2 #1 (la afirmación, con datos)',
    'TODO — H2 #2 (los términos operativos)',
    'TODO — H2 #3 (la pieza central: el activo que une todo)',
    'TODO — H2 #4 (por qué las piezas están en este orden)',
    'TODO — H2 #5 (el trabajo que ya conoces, recontextualizado)',
    'TODO — H2 #6 (cierre y CTA tácito)',
  ],
  vizBarsTitle: 'TODO — encabezado de la gráfica de barras',
  vizBarsAlt:   'TODO — descripción de audio en palabras (legible al oído).',
  vizFlow1Title: 'TODO — diagrama de la convergencia (eje unificador)',
  vizFlow1Alt:   'TODO — descripción del diagrama en palabras.',
  vizFlow2Title: 'TODO — la escalera de lectura',
  vizFlow2Alt:   'TODO — descripción de la escalera de lectura.',
  waveTocEyebrow: 'Lee el lote',
  waveTocHeading: `${deepDiveEnSlugs.length} piezas, en orden.`,
  itemRoles: deepDiveEnSlugs.map(() => 'TODO — rol'),
  itemDescs: deepDiveEnSlugs.map(() => 'TODO — una frase, no un resumen.'),
} : {
  todoNote: 'EDITORIAL TODO: fill in each placeholder.',
  thesisTodo: 'TODO — the unifying thesis in one sentence.',
  h2: [
    'TODO — H2 #1 (the claim, with the data)',
    'TODO — H2 #2 (the operational terms)',
    'TODO — H2 #3 (the central piece: the single asset that unifies)',
    'TODO — H2 #4 (why the pieces are in this order)',
    'TODO — H2 #5 (the work you already know, recontextualized)',
    'TODO — H2 #6 (close + implicit CTA)',
  ],
  vizBarsTitle: 'TODO — bar chart heading (quantitative evidence)',
  vizBarsAlt:   'TODO — audio description in words (listenable, no number symbols).',
  vizFlow1Title: 'TODO — convergence diagram (the unifying axis)',
  vizFlow1Alt:   'TODO — audio description of the diagram in words.',
  vizFlow2Title: 'TODO — the reading-order ladder',
  vizFlow2Alt:   'TODO — audio description of the reading ladder.',
  waveTocEyebrow: 'Read the wave',
  waveTocHeading: `${deepDiveEnSlugs.length} pieces, in order.`,
  itemRoles: deepDiveEnSlugs.map(() => 'TODO — role'),
  itemDescs: deepDiveEnSlugs.map(() => 'TODO — one sentence, not a summary.'),
};

const tocItems = deepDiveEnSlugs.map((d, i) => tocItem(
  i,
  deepDiveHref(d.slug),
  I18N.itemRoles[i],
  d.title,
  I18N.itemDescs[i]
)).join('\n');

const body = [
  `<!-- ============================================================`,
  `     Batch overview body (${batchKey} · ${locale}).`,
  `     Scaffolded by scripts/scaffold-overview-body.mjs.`,
  `     ${I18N.todoNote}`,
  `     This skeleton satisfies the structural rules in`,
  `     scripts/check-overview-quality.mjs (>= 5 H2, >= 3 viz figures`,
  `     with >= 1 viz-bars, a wave-toc capstone). The editorial`,
  `     work is: replace every TODO + cite each deep-dive >= 2 times`,
  `     (once inline + once in the capstone you see below).`,
  `============================================================ -->`,
  ``,
  `<p>TODO — opening lede (2-3 sentences). State what just happened and why these ${deepDiveEnSlugs.length} pieces ladder.</p>`,
  ``,
  `<p>${I18N.thesisTodo}</p>`,
  ``,
  `<!-- viz #1 of 3 — quantitative claim (.viz-bars) -->`,
  `<figure class="viz-figure article-figure" data-audio-alt="${I18N.vizBarsAlt}">`,
  `  <div class="viz-bars">`,
  `    <p class="viz-bars__title">${I18N.vizBarsTitle}</p>`,
  `    <div class="viz-bars__row">`,
  `      <p class="viz-bars__label">TODO — label</p>`,
  `      <div class="viz-bars__track"><span class="viz-bars__fill" data-tone="teal" style="--w:0.50"></span></div>`,
  `      <p class="viz-bars__num">TODO</p>`,
  `    </div>`,
  `    <div class="viz-bars__row">`,
  `      <p class="viz-bars__label">TODO — label</p>`,
  `      <div class="viz-bars__track"><span class="viz-bars__fill" data-tone="teal" style="--w:0.75"></span></div>`,
  `      <p class="viz-bars__num">TODO</p>`,
  `    </div>`,
  `  </div>`,
  `</figure>`,
  ``,
  `<h2>${I18N.h2[0]}</h2>`,
  `<p>TODO — open with the number. Cite the first deep-dive inline: <a href="${deepDiveHref(deepDiveEnSlugs[0].slug)}">TODO link phrase</a>.</p>`,
  ``,
  `<h2>${I18N.h2[1]}</h2>`,
  `<p>TODO — define the two-or-three operational terms the rest of the piece will use. Cite the second deep-dive inline: <a href="${deepDiveHref(deepDiveEnSlugs[Math.min(1, deepDiveEnSlugs.length-1)].slug)}">TODO link phrase</a>.</p>`,
  ``,
  `<h2>${I18N.h2[2]}</h2>`,
  `<p>TODO — the synthesis paragraph. What single asset / lever / question unifies all ${deepDiveEnSlugs.length} pieces?</p>`,
  ``,
  `<!-- viz #2 of 3 — unifying graphic (.viz-flow as hub-and-spoke or convergence) -->`,
  `<figure class="viz-figure article-figure" data-audio-alt="${I18N.vizFlow1Alt}">`,
  `  <div class="viz-flow">`,
  `    <p class="viz-flow__title">${I18N.vizFlow1Title}</p>`,
  `    <ol class="viz-flow__list">`,
  `      <li class="viz-flow__step" data-tone="teal"><span class="viz-flow__num">1</span><div class="viz-flow__body"><p class="viz-flow__title">TODO — step title</p><p class="viz-flow__detail">TODO — one-line detail.</p></div></li>`,
  `      <li class="viz-flow__step" data-tone="teal"><span class="viz-flow__num">2</span><div class="viz-flow__body"><p class="viz-flow__title">TODO — step title</p><p class="viz-flow__detail">TODO — one-line detail.</p></div></li>`,
  `      <li class="viz-flow__step" data-tone="teal"><span class="viz-flow__num">3</span><div class="viz-flow__body"><p class="viz-flow__title">TODO — step title</p><p class="viz-flow__detail">TODO — one-line detail.</p></div></li>`,
  `      <li class="viz-flow__step" data-tone="rust"><span class="viz-flow__num">4</span><div class="viz-flow__body"><p class="viz-flow__title">TODO — step title</p><p class="viz-flow__detail">TODO — one-line detail.</p></div></li>`,
  `    </ol>`,
  `  </div>`,
  `</figure>`,
  ``,
  `<h2>${I18N.h2[3]}</h2>`,
  `<p>TODO — explain why the ${deepDiveEnSlugs.length} pieces ladder in this order. Cite at least one more deep-dive inline.</p>`,
  ``,
  `<!-- viz #3 of 3 — reading-order ladder (.viz-flow) -->`,
  `<figure class="viz-figure article-figure" data-audio-alt="${I18N.vizFlow2Alt}">`,
  `  <div class="viz-flow">`,
  `    <p class="viz-flow__title">${I18N.vizFlow2Title}</p>`,
  `    <ol class="viz-flow__list">`,
  ...deepDiveEnSlugs.map((d, i) => `      <li class="viz-flow__step" data-tone="teal"><span class="viz-flow__num">${i + 1}</span><div class="viz-flow__body"><p class="viz-flow__title">TODO — short verb-led title</p><p class="viz-flow__detail">TODO — one-line role for piece ${i + 1}.</p></div></li>`),
  `    </ol>`,
  `  </div>`,
  `</figure>`,
  ``,
  `<h2>${I18N.h2[4]}</h2>`,
  `<p>TODO — argue that the work that wins is the work the operator already knows; the May/June/whenever shift just made it newly load-bearing.</p>`,
  ``,
  `<h2>${I18N.h2[5]}</h2>`,
  `<p>TODO — close with an imperative call. No CTA buttons — just direction. Pair the first and last deep-dive in the same sentence.</p>`,
  ``,
  `<!-- ============================================================`,
  `     Wave-toc capstone — one row per deep-dive. The gate requires`,
  `     this exact structure (or a multi-row .knit-rail) at the end`,
  `     of the article so every deep-dive has its second link.`,
  `============================================================ -->`,
  `<section class="wave-toc" aria-labelledby="wave-toc-h">`,
  `  <p class="eyebrow wave-toc__eyebrow">${I18N.waveTocEyebrow}</p>`,
  `  <h2 id="wave-toc-h" class="wave-toc__head">${I18N.waveTocHeading}</h2>`,
  `  <ol class="wave-toc__list">`,
  tocItems,
  `  </ol>`,
  `</section>`,
  ``,
].join('\n');

process.stdout.write(body);
