#!/usr/bin/env node
/**
 * Phase G.8 (Growth) — render a Field Notes rail near the bottom
 * of /window/ + /es/window/ pages. Mirrors the homepage rail
 * pattern. Pulls the 5 freshest approved notes from
 * data/article-fieldnotes.json. Falls back to a quiet placeholder
 * when no notes are approved yet (current state).
 *
 *   node scripts/inject-window-fieldnotes-rail.mjs           # rewrite
 *   node scripts/inject-window-fieldnotes-rail.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- window-fieldnotes-rail:start -->[\s\S]*?<!-- window-fieldnotes-rail:end -->/;

function escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function loadApprovedNotes() {
  const f = path.join(repoRoot, 'data/article-fieldnotes.json');
  if (!fs.existsSync(f)) return [];
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  const out = [];
  for (const [articleSlug, perLocale] of Object.entries(data.fieldnotes || {})) {
    for (const [locale, list] of Object.entries(perLocale)) {
      for (const n of list || []) {
        if (!n || !n.author || !n.body) continue;
        out.push({ articleSlug, locale, ...n });
      }
    }
  }
  return out.sort((a, b) => (b.approvedAt || 0) - (a.approvedAt || 0)).slice(0, 5);
}

function buildBlock(notes, locale) {
  const heading = locale === 'es' ? 'Lo que dicen otros operadores' : 'What other operators are saying';
  const lead    = locale === 'es' ? 'Apuntes recientes de operadores que escribieron por La Ventana. Editorial review antes de publicar; sus palabras, su nombre.' : 'Recent notes from operators who wrote in through The Window. Editorial review before publishing; their words, their name.';
  const empty   = locale === 'es' ? 'Cuando lleguen los primeros apuntes aprobados, aparecerán acá.' : 'When the first approved notes land, they\'ll show up here.';

  if (notes.length === 0) {
    return [
      '<!-- window-fieldnotes-rail:start -->',
      '<aside class="window-fieldnotes-rail" aria-labelledby="window-fn-h">',
      '  <div class="container">',
      `    <h2 id="window-fn-h">${heading}</h2>`,
      `    <p class="window-fieldnotes-rail__lead">${lead}</p>`,
      `    <p class="window-fieldnotes-rail__empty">${empty}</p>`,
      '  </div>',
      '</aside>',
      '<!-- window-fieldnotes-rail:end -->',
    ].join('\n');
  }

  const items = notes.map((n) => {
    const articleHref = locale === 'es' ? `/es/blog/${n.articleSlug}/` : `/blog/${n.articleSlug}/`;
    const personHref  = locale === 'es' ? `/es/people/${n.authorSlug || ''}/` : `/people/${n.authorSlug || ''}/`;
    return [
      '    <li class="window-fieldnotes-rail__item">',
      `      <p class="window-fieldnotes-rail__quote">${escHtml(n.body)}</p>`,
      `      <p class="window-fieldnotes-rail__cite">— <a href="${personHref}">${escHtml(n.author)}</a> on <a href="${articleHref}">${escHtml(n.articleSlug.replace(/-/g, ' '))}</a></p>`,
      '    </li>',
    ].join('\n');
  }).join('\n');

  return [
    '<!-- window-fieldnotes-rail:start -->',
    '<aside class="window-fieldnotes-rail" aria-labelledby="window-fn-h">',
    '  <div class="container">',
    `    <h2 id="window-fn-h">${heading}</h2>`,
    `    <p class="window-fieldnotes-rail__lead">${lead}</p>`,
    '    <ul class="window-fieldnotes-rail__list">',
    items,
    '    </ul>',
    '  </div>',
    '</aside>',
    '<!-- window-fieldnotes-rail:end -->',
  ].join('\n');
}

const notes = loadApprovedNotes();
let changed = 0;
for (const root of [['en', 'window/index.html'], ['es', 'es/window/index.html']]) {
  const [locale, rel] = root;
  const file = path.join(repoRoot, rel);
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const block = buildBlock(notes, locale);
  let next;
  if (SENTINEL_RE.test(src)) {
    next = src.replace(SENTINEL_RE, block);
  } else {
    // Insert before </main>.
    const mainEnd = src.indexOf('</main>');
    if (mainEnd === -1) continue;
    next = src.slice(0, mainEnd) + '\n' + block + '\n' + src.slice(mainEnd);
  }
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  changed++;
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} window page(s); ${notes.length} approved notes available.`);
if (checkOnly && changed > 0) process.exit(1);
