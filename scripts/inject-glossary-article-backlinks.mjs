#!/usr/bin/env node
/**
 * Bidirectional glossary↔article backlinks. Articles already auto-link
 * out to glossary terms via [data-glossary-blurb] (rendered popovers
 * on hover/touch). This script closes the loop: it scans every blog
 * article (EN + ES) for those out-links, builds an inverted index
 * { termSlug: [{articleSlug, title, dek, locale}, …] }, and stamps a
 * sentinel-bracketed "Where this term shows up in the library" panel
 * on each glossary term page directly after the term-example block.
 *
 * Reuses the .see-also-card CSS already in site.css.
 *
 *   node scripts/inject-glossary-article-backlinks.mjs           # rewrite
 *   node scripts/inject-glossary-article-backlinks.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- glossary-backlinks:start -->[\s\S]*?<!-- glossary-backlinks:end -->/;
const TERM_EXAMPLE_END_RE = /<!-- term-example:end -->/;

const COPY = {
  en: { label: 'Where this term shows up' },
  es: { label: 'Dónde aparece este término' },
};

const MAX_BACKLINKS = 4;

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&rsquo;/g, '’')
    .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–');
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function pageMeta(file) {
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf8');
  const titleM = html.match(/<title>([\s\S]*?)<\/title>/i);
  const descM = html.match(/<meta[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']*)["']/i)
             || html.match(/<meta[^>]*\bcontent=["']([^"']*)["'][^>]*\bname=["']description["']/i);
  const title = titleM ? decodeEntities(titleM[1]).replace(/\s*\|\s*Muntin Digital\s*$/, '').trim() : '';
  const dek = descM ? decodeEntities(descM[1]).trim() : '';
  return { title, dek, html };
}

function listArticleDirs(blogRoot) {
  if (!fs.existsSync(blogRoot)) return [];
  return fs.readdirSync(blogRoot, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name !== 'drafts')
    .map(e => ({ slug: e.name, file: path.join(blogRoot, e.name, 'index.html') }))
    .filter(e => fs.existsSync(e.file));
}

function buildInvertedIndex(locale, blogRoot, glossaryPathPrefix) {
  // term slug → [{articleSlug, title, dek, url}]
  const map = {};
  for (const { slug, file } of listArticleDirs(blogRoot)) {
    const meta = pageMeta(file);
    if (!meta || !meta.title) continue;
    // Match every <a href="<glossaryPathPrefix><termSlug>/" with
    // data-glossary-blurb (popover-annotated only — that's the
    // intentional outbound link, not a passing reference).
    const re = new RegExp(`<a href="${glossaryPathPrefix}([a-z0-9-]+)/"[^>]*data-glossary-blurb=`, 'g');
    let m;
    const seen = new Set();
    while ((m = re.exec(meta.html)) !== null) {
      const termSlug = m[1];
      if (seen.has(termSlug)) continue;
      seen.add(termSlug);
      if (!map[termSlug]) map[termSlug] = [];
      const articleUrl = locale === 'es' ? `/es/blog/${slug}/` : `/blog/${slug}/`;
      map[termSlug].push({ slug, title: meta.title, dek: meta.dek, url: articleUrl });
    }
  }
  return map;
}

function buildBlock(locale, items) {
  if (!items.length) return '<!-- glossary-backlinks:start --><!-- glossary-backlinks:end -->';
  const label = COPY[locale].label;
  const cards = items.slice(0, MAX_BACKLINKS).map(it =>
    `        <li>
          <a class="see-also-card" href="${esc(it.url)}">
            <span class="see-also-kind">${esc(locale === 'es' ? 'Artículo' : 'Article')}</span>
            <h3>${esc(it.title)}</h3>
            <p>${esc(it.dek || '')}</p>
          </a>
        </li>`
  ).join('\n');
  return `<!-- glossary-backlinks:start -->
      <aside class="see-also glossary-backlinks" aria-labelledby="glossary-backlinks-h">
        <p class="see-also-label" id="glossary-backlinks-h">${esc(label)}</p>
        <ul class="see-also-list">
${cards}
        </ul>
      </aside>
      <!-- glossary-backlinks:end -->`;
}

function listGlossaryTerms(glossaryRoot) {
  if (!fs.existsSync(glossaryRoot)) return [];
  return fs.readdirSync(glossaryRoot, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => ({ slug: e.name, file: path.join(glossaryRoot, e.name, 'index.html') }))
    .filter(e => fs.existsSync(e.file));
}

let changed = 0;
let skipped = 0;
for (const [locale, blogDir, glossaryDir, glossaryPathPrefix] of [
  ['en', 'blog', 'glossary', '/glossary/'],
  ['es', 'es/blog', 'es/glossary', '/es/glossary/'],
]) {
  const blogRoot = path.join(repoRoot, blogDir);
  const glossaryRoot = path.join(repoRoot, glossaryDir);
  const inverted = buildInvertedIndex(locale, blogRoot, glossaryPathPrefix);

  for (const { slug, file } of listGlossaryTerms(glossaryRoot)) {
    const items = inverted[slug] || [];
    const src = fs.readFileSync(file, 'utf8');
    const block = buildBlock(locale, items);

    let next;
    if (SENTINEL_RE.test(src)) {
      next = src.replace(SENTINEL_RE, block);
    } else if (TERM_EXAMPLE_END_RE.test(src)) {
      // Insert directly after the term-example block, when one exists.
      next = src.replace(TERM_EXAMPLE_END_RE, m => `${m}\n      ${block}`);
    } else {
      // Otherwise, insert directly after </h1>.
      const h1Idx = src.indexOf('</h1>');
      if (h1Idx === -1) { skipped++; continue; }
      const insertAt = h1Idx + '</h1>'.length;
      next = src.slice(0, insertAt) + '\n      ' + block + src.slice(insertAt);
    }
    if (next === src) continue;
    if (!checkOnly) fs.writeFileSync(file, next);
    const note = items.length ? `${items.length} backlink(s)` : 'no backlinks';
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)} (${note})`);
    changed++;
  }
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} term page(s); ${skipped} skipped.`);
if (checkOnly && changed > 0) process.exit(1);
