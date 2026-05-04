#!/usr/bin/env node
// Render the /tools/ landing page body from data/tools.json into both
// tools/index.html and es/tools/index.html, between
// <!-- tools:auto -->...<!-- /tools:auto --> sentinels.
//
// What gets rendered (in order):
//   1. .tool-goals      — "Start with a goal" launcher (3 user intents)
//   2. .tool-chipnav    — anchor links to each cluster + #roadmap
//   3. .tool-cluster    — one section per cluster, each holding a .tool-grid
//   4. .tool-roadmap    — coming-soon tools as compact cards tagged by cluster
//
// What's left untouched: the page's <head>, breadcrumb, hero, and the
// "Need one sooner?" final CTA. Those stay hand-edited.
//
// Editing rules enforced:
//   - tool.summary_{en,es}: ≤ 220 chars (build fails otherwise)
//   - tool.walkaway_{en,es}: exactly one line (build fails otherwise)
//   - every cluster slug must exist in data/topics.json
//   - every tool referenced in clusters[].tools, goals[].tools, or
//     roadmap[].cluster must resolve
//
//   node scripts/build-tools-index.mjs           # rewrites in place
//   node scripts/build-tools-index.mjs --check   # exits non-zero if anything would change

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const data    = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'tools.json'),  'utf8'));
const topics  = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'topics.json'), 'utf8'));
const topicSlugs = new Set(topics.topics.map((t) => t.slug));

const SUMMARY_MAX = 220;
const SENTINEL_OPEN  = '<!-- tools:auto -->';
const SENTINEL_CLOSE = '<!-- /tools:auto -->';

// --- validation -------------------------------------------------------

const errors = [];
function err(msg) { errors.push(msg); }

for (const c of data.clusters) {
  if (!topicSlugs.has(c.id)) err(`cluster id "${c.id}" is not a valid topic slug (see data/topics.json)`);
  for (const slug of c.tools) {
    if (!data.tools[slug]) err(`cluster "${c.id}" references missing tool "${slug}"`);
    else if (data.tools[slug].cluster !== c.id) err(`tool "${slug}".cluster (${data.tools[slug].cluster}) disagrees with cluster "${c.id}".tools`);
  }
}
for (const g of data.goals) {
  for (const slug of g.tools) {
    if (!data.tools[slug]) err(`goal "${g.id}" references missing tool "${slug}"`);
  }
}
for (const [slug, t] of Object.entries(data.tools)) {
  for (const k of ['title_en', 'title_es', 'summary_en', 'summary_es', 'walkaway_en', 'walkaway_es', 'cta_en', 'cta_es', 'url_en', 'url_es', 'cluster', 'status']) {
    if (!t[k]) err(`tool "${slug}" missing required field "${k}"`);
  }
  if (t.summary_en && t.summary_en.length > SUMMARY_MAX) err(`tool "${slug}".summary_en is ${t.summary_en.length} chars, max ${SUMMARY_MAX}`);
  if (t.summary_es && t.summary_es.length > SUMMARY_MAX) err(`tool "${slug}".summary_es is ${t.summary_es.length} chars, max ${SUMMARY_MAX}`);
  if (t.walkaway_en && t.walkaway_en.includes('\n')) err(`tool "${slug}".walkaway_en must be a single line`);
  if (t.walkaway_es && t.walkaway_es.includes('\n')) err(`tool "${slug}".walkaway_es must be a single line`);
}
for (const r of data.roadmap) {
  if (!topicSlugs.has(r.cluster)) err(`roadmap entry "${r.slug}".cluster ("${r.cluster}") is not a valid topic slug`);
}

if (errors.length) {
  console.error('data/tools.json has problems:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(2);
}

// --- rendering -------------------------------------------------------

// Forward arrow SVG used in CTAs and chip nav, kept inline so a stale
// stylesheet can't strand the link without an affordance.
const ARROW = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></svg>';

function escAttr(s) { return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function escText(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function pickI18n(obj, key, locale) {
  return obj[`${key}_${locale}`];
}

// Spotlight section — the two flagship tools rendered as
// large, full-width cards above everything else. Reads the
// differentiator headline + chipLabel from the shared module
// at tools/_shared/differentiators.js (single source of truth).
// We don't import the JS module here (this script is Node, the
// module is browser-shaped UMD); instead we keep a small mirror
// of the chipLabel + headline locally and verify match in the
// W1-3 test fixture if added later. Today the canonical strings
// here MUST be kept in sync with differentiators.js — drift is
// caught by the build invariant check-name-coherence.mjs which
// already scans both locations for tool names.
const SPOTLIGHT = {
  'menu-design': {
    en: { headline: 'The only restaurant menu tool that auto-lays out 14 or 53 dishes from one paste — no Canva fight.', chipLabel: 'vs Canva templates' },
    es: { headline: 'La única herramienta de menú que acomoda 14 o 53 platos desde una pasada — sin pelearte con Canva.', chipLabel: 'vs plantillas de Canva' }
  },
  'invoice-decoder': {
    en: { headline: 'An invoice tool that locks your data with a secret only you know — Restaurant365 reads everything; we read nothing.', chipLabel: 'vs Restaurant365 · MarginEdge · Plate IQ' },
    es: { headline: 'Una herramienta de facturas que bloquea tus datos con un secreto que solo tú conoces — Restaurant365 lee todo; nosotros no leemos nada.', chipLabel: 'vs Restaurant365 · MarginEdge · Plate IQ' }
  }
};

function renderSpotlight(locale) {
  const eyebrow = locale === 'en' ? 'Spotlight' : 'Destacado';
  const heading = locale === 'en' ? 'The two tools we built differently.' : 'Las dos herramientas que construimos diferente.';
  const ctaLabel = locale === 'en' ? 'Open the tool' : 'Abrir la herramienta';
  const slugs = ['menu-design', 'invoice-decoder'];
  const cards = slugs.map((slug) => {
    const t      = data.tools[slug];
    if (!t) return '';
    const title  = pickI18n(t, 'title', locale);
    const url    = pickI18n(t, 'url', locale);
    const sp     = SPOTLIGHT[slug] && (SPOTLIGHT[slug][locale] || SPOTLIGHT[slug].en);
    if (!sp) return '';
    return `      <a href="${escAttr(url)}" class="tool-card-spotlight live">
        <span class="tool-card-spotlight__chip">${escText(sp.chipLabel)}</span>
        <h3 class="tool-card-spotlight__title">${escText(title)}</h3>
        <p class="tool-card-spotlight__headline">${escText(sp.headline)}</p>
        <span class="tool-card-spotlight__cta">${escText(ctaLabel)} ${ARROW}</span>
      </a>`;
  }).filter(Boolean).join('\n');
  if (!cards) return '';
  return `<section class="tool-spotlight" aria-labelledby="tool-spotlight-heading">
    <span class="eyebrow">${escText(eyebrow)}</span>
    <h2 id="tool-spotlight-heading" class="tool-spotlight__heading">${escText(heading)}</h2>
    <div class="tool-spotlight__grid">
${cards}
    </div>
  </section>`;
}

function renderGoals(locale) {
  const heading = locale === 'en' ? 'Start with a goal.' : 'Empieza con un objetivo.';
  const eyebrow = locale === 'en' ? 'For when you know what hurts' : 'Cuando ya sabes qué duele';
  const items = data.goals.map((g) => {
    const label = pickI18n(g, 'label', locale);
    const links = g.tools.map((slug) => {
      const t = data.tools[slug];
      const title = pickI18n(t, 'title', locale);
      const url   = pickI18n(t, 'url',   locale);
      return `<a href="${escAttr(url)}">${escText(title)}</a>`;
    }).join(' &middot; ');
    return `      <li><strong>${escText(label)}</strong> ${links}</li>`;
  }).join('\n');
  return `<aside class="tool-goals" aria-labelledby="tool-goals-heading">
  <span class="eyebrow">${escText(eyebrow)}</span>
  <h2 id="tool-goals-heading">${escText(heading)}</h2>
  <ul>
${items}
  </ul>
</aside>`;
}

function renderChipNav(locale) {
  const aria = locale === 'en' ? 'Jump to a topic' : 'Saltar a un tema';
  const roadmapLabel = locale === 'en' ? 'Roadmap' : 'En camino';
  const chips = data.clusters.map((c) => {
    const label = pickI18n(c, 'label', locale);
    return `      <a href="#${c.id}">${escText(label)}</a>`;
  }).join('\n');
  return `<nav class="tool-chipnav" aria-label="${escAttr(aria)}">
${chips}
      <a href="#roadmap" class="tool-chipnav__roadmap">${escText(roadmapLabel)}</a>
    </nav>`;
}

function renderCluster(c, locale) {
  const label = pickI18n(c, 'label', locale);
  const blurb = pickI18n(c, 'blurb', locale);
  const topicLabel = locale === 'en' ? 'See the full topic' : 'Ver el tema completo';
  const topicHref  = locale === 'en' ? `/learn/topics/${c.id}/` : `/es/learn/topics/${c.id}/`;
  const walkawayLabel = locale === 'en' ? 'You leave with' : 'Te llevas';

  const cards = c.tools.map((slug) => {
    const t        = data.tools[slug];
    const title    = pickI18n(t, 'title',    locale);
    const summary  = pickI18n(t, 'summary',  locale);
    const walkaway = pickI18n(t, 'walkaway', locale);
    const cta      = pickI18n(t, 'cta',      locale);
    const url      = pickI18n(t, 'url',      locale);
    const liveLabel = locale === 'en' ? 'Live' : 'En vivo';
    return `      <a href="${escAttr(url)}" class="tool-card tool-card--compact live">
        <span class="status">${liveLabel}</span>
        <h3>${escText(title)}</h3>
        <p>${escText(summary)}</p>
        <p class="tool-card__walkaway"><span class="tool-card__walkaway-label">${escText(walkawayLabel)}:</span> ${escText(walkaway)}</p>
        <span class="cta">${escText(cta)} ${ARROW}</span>
      </a>`;
  }).join('\n');

  return `<section id="${c.id}" class="tool-cluster" aria-labelledby="cluster-${c.id}-heading">
    <header class="tool-cluster__head">
      <h2 id="cluster-${c.id}-heading">${escText(label)}</h2>
      <p>${escText(blurb)}</p>
      <a class="tool-cluster__topic" href="${escAttr(topicHref)}">${escText(topicLabel)} <span aria-hidden="true">&rarr;</span></a>
    </header>
    <div class="tool-grid">
${cards}
    </div>
  </section>`;
}

function renderRoadmap(locale) {
  const eyebrow = locale === 'en' ? 'On the roadmap' : 'En el roadmap';
  const heading = locale === 'en' ? 'Coming soon — and why each one is on the list.' : 'Próximamente — y por qué cada una está en la lista.';
  const sub = locale === 'en'
    ? 'Each future tool is tagged with the topic it belongs to. The order shifts based on what restaurants ask for most.'
    : 'Cada próxima herramienta está etiquetada con el tema al que pertenece. El orden cambia según lo que más nos piden los restaurantes.';
  const comingLabel = locale === 'en' ? 'Coming' : 'En camino';

  // Group roadmap items by cluster for visual coherence.
  const byCluster = new Map();
  for (const r of data.roadmap) {
    if (!byCluster.has(r.cluster)) byCluster.set(r.cluster, []);
    byCluster.get(r.cluster).push(r);
  }

  const clusterLabel = (id) => {
    const t = topics.topics.find((x) => x.slug === id);
    if (!t) return id;
    return locale === 'en' ? t.name : (t.name_es || t.name);
  };

  const groups = Array.from(byCluster.entries()).map(([clusterId, items]) => {
    const cards = items.map((r) => {
      const title = pickI18n(r, 'title', locale);
      const blurb = pickI18n(r, 'blurb', locale);
      return `        <li class="tool-card tool-card--roadmap soon" aria-disabled="true">
          <span class="status">${comingLabel}</span>
          <h3>${escText(title)}</h3>
          <p>${escText(blurb)}</p>
        </li>`;
    }).join('\n');
    return `      <div class="tool-roadmap__group" data-cluster="${escAttr(clusterId)}">
        <h3 class="tool-roadmap__cluster">${escText(clusterLabel(clusterId))}</h3>
        <ul class="tool-grid">
${cards}
        </ul>
      </div>`;
  }).join('\n');

  return `<section id="roadmap" class="tool-roadmap" aria-labelledby="roadmap-heading">
    <header class="tool-roadmap__head">
      <span class="eyebrow">${escText(eyebrow)}</span>
      <h2 id="roadmap-heading">${escText(heading)}</h2>
      <p>${escText(sub)}</p>
    </header>
${groups}
  </section>`;
}

function renderSheetsBand(locale) {
  // Quiet between-sections banner pointing to /sheets/. Sheets are
  // the printable + fillable paperwork that pairs with these tools —
  // recipe cost cards, weekly prime cost worksheet, GBP monthly audit.
  // Surfaces the layer without cluttering the cluster grid.
  const eyebrow  = locale === 'en' ? 'Pair them with paperwork'             : 'Empareja con papeleo';
  const headline = locale === 'en' ? 'Operator Sheets — printable + fillable, exports to CSV.' : 'Hojas del Operador — imprimibles, llenables, exportan a CSV.';
  const sub      = locale === 'en' ? 'Recipe cost cards, weekly prime cost, GBP monthly audit, daily P&L. Free, no signup. None of your numbers leave the page.' : 'Tarjetas de costo, costo primo semanal, auditoría mensual de GBP, P&G diario. Gratis, sin registro. Tus números no salen de la página.';
  const cta      = locale === 'en' ? 'Browse the sheets'                    : 'Explora las hojas';
  const url      = locale === 'en' ? '/sheets/'                              : '/es/sheets/';
  return `<aside class="tool-sheets-band" aria-labelledby="tool-sheets-band-h" style="margin:32px 0 0;padding:22px 24px;border:1px solid var(--line,#E5DFD2);border-left:4px solid var(--teal,#1F4E5B);border-radius:var(--r-md,12px);background:var(--white,#FFFFFF);display:flex;flex-wrap:wrap;align-items:center;gap:18px;">
      <div style="flex:1;min-width:240px;">
        <span class="eyebrow" style="display:block;margin-bottom:4px;">${escText(eyebrow)}</span>
        <h2 id="tool-sheets-band-h" style="font-family:var(--font-display,'Fraunces',Georgia,serif);font-size:22px;font-weight:500;margin:0 0 6px;color:var(--ink,#14161A);">${escText(headline)}</h2>
        <p style="font-size:14.5px;line-height:1.5;color:var(--ink-soft,#2A2D33);margin:0;max-width:640px;">${escText(sub)}</p>
      </div>
      <a class="btn btn-primary" href="${escAttr(url)}" style="white-space:nowrap;">${escText(cta)} ${ARROW}</a>
    </aside>`;
}

function renderBody(locale) {
  const closingNote = locale === 'en'
    ? 'Free tools, no signup, no email required. More coming.'
    : 'Herramientas gratis, sin registro, sin correo. Más en camino.';
  const clusters = data.clusters.map((c) => '  ' + renderCluster(c, locale)).join('\n\n  ');
  return `${SENTINEL_OPEN}
<section class="block">
  <div class="container container-wide">
    ${renderSpotlight(locale)}

    ${renderGoals(locale)}

    ${renderChipNav(locale)}

  ${clusters}

    ${renderSheetsBand(locale)}

  ${renderRoadmap(locale)}

    <p class="section-aside" style="text-align:center;margin-top:32px;">
      ${escText(closingNote)}
    </p>
  </div>
</section>
${SENTINEL_CLOSE}`;
}

// --- write -----------------------------------------------------------

const TARGETS = [
  { file: 'tools/index.html',     locale: 'en' },
  { file: 'es/tools/index.html',  locale: 'es' },
];

const SENTINEL_RE = new RegExp(`${SENTINEL_OPEN.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}[\\s\\S]*?${SENTINEL_CLOSE.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`);

let changed = 0;
for (const { file, locale } of TARGETS) {
  const fp = path.join(REPO, file);
  const src = fs.readFileSync(fp, 'utf8');
  if (!SENTINEL_RE.test(src)) {
    console.error(`${file}: missing ${SENTINEL_OPEN} / ${SENTINEL_CLOSE} sentinels — run scripts/sync-includes.mjs after adding them, or hand-add per the build-tools-index.mjs docstring.`);
    process.exit(3);
  }
  const next = src.replace(SENTINEL_RE, renderBody(locale));
  if (next !== src) {
    if (!checkOnly) fs.writeFileSync(fp, next);
    changed++;
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${file}`);
  }
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of ${TARGETS.length} tools index pages.`);
if (checkOnly && changed > 0) process.exit(1);
