#!/usr/bin/env node
/**
 * Phase F.8 (Field Notes) — stamp a "From the kitchen" rail on the
 * homepage (EN + ES) showing the 3 most recent approved field notes
 * across every article. Brings field-note gravity to readers who
 * haven't gone deep into any single article yet — the front-door
 * surface for the social-draw thesis.
 *
 * Reads data/article-fieldnotes.json. Picks the 3 newest per locale
 * (sorted by approvedAt desc). Renders a card per note:
 *   - eyebrow: "From {author}" → links to their /people/<slug>/
 *   - body: 180-char excerpt (server already escapes; we pass through)
 *   - footer: article title (link)
 *
 * Stamps between sentinels:
 *   <!-- field-notes-rail:start -->...<!-- field-notes-rail:end -->
 *
 * Idempotent: re-running with the same data produces no diff.
 * No-op when the data file has zero approved notes (rail is hidden).
 *
 * Usage:
 *   node scripts/inject-homepage-fieldnotes-rail.mjs
 *   node scripts/inject-homepage-fieldnotes-rail.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const dataPath = path.join(repoRoot, 'data', 'article-fieldnotes.json');
const data     = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const fieldnotes = data.fieldnotes || {};

const SENTINEL_RE = /<!-- field-notes-rail:start -->[\s\S]*?<!-- field-notes-rail:end -->/;

const RAIL_LIMIT = 3;
const EXCERPT_CHARS = 180;

const TARGETS = [
  { file: 'index.html',    locale: 'en', peopleBase: '/people/',    blogBase: '/blog/',
    eyebrow: 'From the kitchen', headline: 'Reader voices.', sub: 'Recent field notes from operators using these articles in real kitchens.', fromPrefix: 'From',
    moreLabel: 'See every contributor →', moreHref: '/people/' },
  { file: 'es/index.html', locale: 'es', peopleBase: '/es/people/', blogBase: '/es/blog/',
    eyebrow: 'Desde la cocina', headline: 'Voces de lectores.', sub: 'Apuntes recientes de operadores que aplicaron estos artículos en cocinas reales.', fromPrefix: 'De',
    moreLabel: 'Ver todos los contribuidores →', moreHref: '/es/people/' },
];

function escAttr(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
}
function escText(s) {
  return String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;' })[c]);
}

function slugifyAuthor(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// data/article-fieldnotes.json bodies are already-escaped HTML
// entities (e.g. "&amp;"). For an excerpt, we want a clean
// text-length truncation, so decode entities → measure → re-escape.
function decodeEntities(s) {
  return String(s == null ? '' : s)
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
}
function excerpt(body, n) {
  const decoded = decodeEntities(body).replace(/\s+/g, ' ').trim();
  if (decoded.length <= n) return escText(decoded);
  // Cut at last word boundary before n.
  const cut = decoded.slice(0, n).replace(/\s+\S*$/, '');
  return escText(cut) + '…';
}

function articleTitle(slug, locale) {
  const file = path.join(repoRoot, locale === 'es' ? 'es/blog' : 'blog', slug, 'index.html');
  try {
    const src = fs.readFileSync(file, 'utf8');
    const m = src.match(/<title>([^<]+)<\/title>/);
    if (m) return m[1].split(' — ')[0].split(' | ')[0].trim();
  } catch (_) { /* fallback */ }
  return slug.replace(/-/g, ' ');
}

function pickRecent(locale) {
  // Walk every (article, note) pair for the locale, sort desc, top N.
  const all = [];
  for (const [articleSlug, perLocale] of Object.entries(fieldnotes)) {
    const arr = perLocale[locale] || [];
    for (const note of arr) {
      if (!note || !note.author || !note.body) continue;
      all.push({ articleSlug, ...note });
    }
  }
  all.sort((a, b) => (b.approvedAt || 0) - (a.approvedAt || 0));
  return all.slice(0, RAIL_LIMIT);
}

function renderRail(target, items) {
  if (!items.length) {
    // Empty state: still emit the sentinels (with zero content) so
    // the homepage layout has the slot reserved. Visible only as a
    // pair of HTML comments.
    return '<!-- field-notes-rail:start --><!-- field-notes-rail:end -->';
  }
  const cards = items.map((n) => {
    const slug = slugifyAuthor(n.author);
    const peopleHref = slug ? `${target.peopleBase}${slug}/` : '#';
    const articleHref = `${target.blogBase}${n.articleSlug}/`;
    const title = articleTitle(n.articleSlug, target.locale);
    return [
      '          <article class="field-notes-rail__card">',
      `            <p class="field-notes-rail__eyebrow"><a href="${peopleHref}">${escText(target.fromPrefix)} ${escText(n.author)}</a></p>`,
      `            <p class="field-notes-rail__excerpt">${excerpt(n.body, EXCERPT_CHARS)}</p>`,
      `            <a class="field-notes-rail__article" href="${articleHref}">${escText(title)} <span aria-hidden="true">→</span></a>`,
      '          </article>',
    ].join('\n');
  }).join('\n');
  return [
    '<!-- field-notes-rail:start -->',
    '      <section class="block field-notes-rail" aria-labelledby="field-notes-rail-heading">',
    '        <div class="container">',
    '          <header class="field-notes-rail__head">',
    `            <span class="eyebrow">${escText(target.eyebrow)}</span>`,
    `            <h2 id="field-notes-rail-heading">${escText(target.headline)}</h2>`,
    `            <p class="field-notes-rail__sub">${escText(target.sub)}</p>`,
    '          </header>',
    '          <div class="field-notes-rail__grid">',
    cards,
    '          </div>',
    `          <p class="field-notes-rail__more"><a href="${target.moreHref}">${escText(target.moreLabel)}</a></p>`,
    '        </div>',
    '      </section>',
    '      <!-- field-notes-rail:end -->',
  ].join('\n      ');
}

let changed = 0;
for (const target of TARGETS) {
  const fp = path.join(repoRoot, target.file);
  if (!fs.existsSync(fp)) continue;
  const src = fs.readFileSync(fp, 'utf8');
  if (!SENTINEL_RE.test(src)) {
    console.warn(`  warn: ${target.file} missing field-notes-rail sentinels; skipping (run scripts/seed-homepage-fieldnotes-rail.mjs first)`);
    continue;
  }
  const items = pickRecent(target.locale);
  const block = renderRail(target, items);
  const next = src.replace(SENTINEL_RE, block);
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(fp, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${target.file}`);
  changed++;
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of ${TARGETS.length} homepage(s).`);
if (checkOnly && changed > 0) process.exit(1);
