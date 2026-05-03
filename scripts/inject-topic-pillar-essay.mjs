#!/usr/bin/env node
/**
 * Phase G.4 (Growth) — stamp the topic-pillar essay onto each
 * /learn/topics/<slug>/ page (EN + ES). Source: data/topic-essays.json.
 *
 * Sentinel-bracketed (<!-- topic-essay:start -->...end), inserted
 * before the topic page's first <section> (after hero block) so the
 * essay reads as the second beat below the H1.
 *
 *   node scripts/inject-topic-pillar-essay.mjs           # rewrite
 *   node scripts/inject-topic-pillar-essay.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- topic-essay:start -->[\s\S]*?<!-- topic-essay:end -->/;

const dataPath = path.join(repoRoot, 'data/topic-essays.json');
if (!fs.existsSync(dataPath)) { console.log('topic-essays data missing — skipping'); process.exit(0); }
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const essays = data.essays || {};

function buildBlock(title, essayHtml, locale, eyebrow) {
  const defaultEyebrow = locale === 'es' ? 'Lectura del tema' : 'Topic essay';
  const eyebrowText = eyebrow || defaultEyebrow;
  return [
    '<!-- topic-essay:start -->',
    '<section class="topic-essay">',
    '  <div class="container">',
    `    <p class="topic-essay__eyebrow">${eyebrowText}</p>`,
    `    <h2 class="topic-essay__title">${title}</h2>`,
    `    <div class="topic-essay__body">${essayHtml}</div>`,
    '  </div>',
    '</section>',
    '<!-- topic-essay:end -->',
  ].join('\n');
}

let changed = 0;
let skipped = 0;
for (const root of [['en', 'learn/topics'], ['es', 'es/learn/topics']]) {
  const [locale, dir] = root;
  const fullDir = path.join(repoRoot, dir);
  if (!fs.existsSync(fullDir)) { skipped++; continue; }
  for (const slug of fs.readdirSync(fullDir)) {
    const file = path.join(fullDir, slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    const entry = essays[slug];
    if (!entry) { skipped++; continue; }
    const title = locale === 'es' ? entry.title_es : entry.title_en;
    const essayHtml = locale === 'es' ? entry.essay_es_html : entry.essay_en_html;
    const eyebrow = locale === 'es' ? entry.eyebrow_es : entry.eyebrow_en;
    if (!title || !essayHtml) { skipped++; continue; }
    const src = fs.readFileSync(file, 'utf8');
    const block = buildBlock(title, essayHtml, locale, eyebrow);
    let next;
    if (SENTINEL_RE.test(src)) {
      next = src.replace(SENTINEL_RE, block);
    } else {
      // Insert before the first <section class="block"> after <main>.
      const mainIdx = src.search(/<main\b[^>]*>/i);
      if (mainIdx === -1) { skipped++; continue; }
      const tail = src.slice(mainIdx);
      const sectionM = tail.match(/<section\b[^>]*class="[^"]*block[^"]*"[^>]*>/i);
      if (!sectionM) { skipped++; continue; }
      const insertAt = mainIdx + sectionM.index;
      next = src.slice(0, insertAt) + block + '\n' + src.slice(insertAt);
    }
    if (next === src) continue;
    if (!checkOnly) fs.writeFileSync(file, next);
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
    changed++;
  }
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} topic page(s); ${skipped} skipped.`);
if (checkOnly && changed > 0) process.exit(1);
