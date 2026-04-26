#!/usr/bin/env node
// Inject the per-tool "Keep going" knit-in module into every live tool
// page (EN + ES) between <!-- tool-knit -->...<!-- /tool-knit -->
// sentinels. Drives Phase 3 of the cohesion pass: each tool now ends
// with a 4-column block tying it back to its topic, sibling tools,
// articles, and glossary terms — closing the educational loop.
//
// Inputs:
//   data/tool-knit.json — relations (per-tool topic / related_tools /
//                         articles / glossary) and article labels.
//   data/tools.json     — tool slugs, EN+ES titles, file paths.
//   data/topics.json    — topic slugs and EN+ES names.
//   glossary/<slug>/index.html (EN + es/) — labels extracted from
//                         <h1 class="term-h1">...</h1>.
//
// Output: each tool page's tool-knit sentinel block is replaced with
// the rendered <aside class="tool-knit">. Hand-edits between the
// sentinels are clobbered every build — that's the point.
//
// Validation (build fails if any of these break):
//   - every tool slug in tool-knit.tools exists in data/tools.json
//   - every cluster slug exists in data/topics.json
//   - every related_tools[] slug exists in data/tools.json
//   - every articles[] URL points at an existing index.html on disk
//     (both /<url>/index.html and /es/<url>/index.html)
//   - every glossary[] slug has an entry under glossary/ AND es/glossary/
//   - every tool page contains the sentinel pair
//
//   node scripts/inject-tool-knit.mjs           # rewrites in place
//   node scripts/inject-tool-knit.mjs --check   # exits non-zero if anything would change

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const knit   = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'tool-knit.json'), 'utf8'));
const tools  = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'tools.json'),     'utf8'));
const topics = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'topics.json'),    'utf8'));

const SENTINEL_OPEN  = '<!-- tool-knit -->';
const SENTINEL_CLOSE = '<!-- /tool-knit -->';
const SENTINEL_RE = new RegExp(
  `${SENTINEL_OPEN.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}[\\s\\S]*?${SENTINEL_CLOSE.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`
);

function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function escText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// --- label resolvers -------------------------------------------------

function topicLabel(slug, locale) {
  const t = topics.topics.find((x) => x.slug === slug);
  if (!t) return slug;
  return locale === 'en' ? t.name : (t.name_es || t.name);
}

function toolLabel(slug, locale) {
  const t = tools.tools[slug];
  if (!t) return slug;
  return locale === 'en' ? t.title_en : t.title_es;
}

function toolUrl(slug, locale) {
  const t = tools.tools[slug];
  if (!t) return '#';
  return locale === 'en' ? t.url_en : t.url_es;
}

const glossaryLabelCache = new Map();
function glossaryLabel(slug, locale) {
  const key = `${locale}:${slug}`;
  if (glossaryLabelCache.has(key)) return glossaryLabelCache.get(key);
  const file = locale === 'en'
    ? path.join(REPO, 'glossary', slug, 'index.html')
    : path.join(REPO, 'es', 'glossary', slug, 'index.html');
  if (!fs.existsSync(file)) { glossaryLabelCache.set(key, slug); return slug; }
  const html = fs.readFileSync(file, 'utf8');
  const m = html.match(/<h1 class="term-h1">([^<]+)<\/h1>/);
  const label = m ? m[1].trim() : slug;
  glossaryLabelCache.set(key, label);
  return label;
}

function articleUrl(url, locale) {
  return locale === 'en' ? url : `/es${url}`;
}

function articleLabel(url, locale) {
  const entry = knit.articles[url];
  if (!entry) return url;
  return locale === 'en' ? entry.label_en : entry.label_es;
}

// File path resolver for a tool page given its EN URL pattern.
// /tools/audits/restaurant/  →  tools/audits/restaurant/index.html
// /tools/plate-cost/         →  tools/plate-cost/index.html
function toolPagePath(slug, locale) {
  const url = locale === 'en' ? tools.tools[slug].url_en : tools.tools[slug].url_es;
  // Strip leading slash + trailing slash, append index.html.
  const stripped = url.replace(/^\/+/, '').replace(/\/$/, '');
  return path.join(REPO, stripped, 'index.html');
}

// --- validation -------------------------------------------------------

const topicSlugs = new Set(topics.topics.map((t) => t.slug));
const errors = [];
function err(msg) { errors.push(msg); }

for (const [slug, entry] of Object.entries(knit.tools)) {
  if (!tools.tools[slug])             err(`tool-knit references missing tool "${slug}"`);
  if (!topicSlugs.has(entry.topic))   err(`tool "${slug}".topic ("${entry.topic}") is not a valid topic slug`);
  for (const rel of entry.related_tools || []) {
    if (!tools.tools[rel]) err(`tool "${slug}".related_tools references missing tool "${rel}"`);
    if (rel === slug)      err(`tool "${slug}".related_tools includes itself`);
  }
  for (const url of entry.articles || []) {
    if (!knit.articles[url]) err(`tool "${slug}".articles references "${url}" which is not in tool-knit.articles{}`);
    const enFile = path.join(REPO, url.replace(/^\/+/, '').replace(/\/$/, ''), 'index.html');
    const esFile = path.join(REPO, 'es', url.replace(/^\/+/, '').replace(/\/$/, ''), 'index.html');
    if (!fs.existsSync(enFile)) err(`article "${url}" missing on disk: ${path.relative(REPO, enFile)}`);
    if (!fs.existsSync(esFile)) err(`article "${url}" missing ES counterpart: ${path.relative(REPO, esFile)}`);
  }
  for (const g of entry.glossary || []) {
    if (!fs.existsSync(path.join(REPO, 'glossary', g, 'index.html'))) err(`glossary "${g}" missing EN entry`);
    if (!fs.existsSync(path.join(REPO, 'es', 'glossary', g, 'index.html'))) err(`glossary "${g}" missing ES entry`);
  }
}

// Make sure every live tool in data/tools.json has a knit entry; the
// inverse already validated above. A live tool without a knit entry
// is a bug — it'd ship with an empty sentinel block.
for (const [slug, t] of Object.entries(tools.tools)) {
  if (t.status !== 'live') continue;
  if (!knit.tools[slug]) err(`tool "${slug}" is live but has no entry in data/tool-knit.json`);
}

if (errors.length) {
  console.error('data/tool-knit.json has problems:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(2);
}

// --- rendering -------------------------------------------------------

function renderKnit(slug, locale) {
  const entry = knit.tools[slug];
  const headings = locale === 'en'
    ? { h2: 'Keep going.', topic: 'Topic', tools: 'Related tools', read: 'Read', words: 'Words' }
    : { h2: 'Sigue.',      topic: 'Tema',  tools: 'Herramientas relacionadas', read: 'Lee', words: 'Palabras' };

  const topicHref = locale === 'en'
    ? `/learn/topics/${entry.topic}/`
    : `/es/learn/topics/${entry.topic}/`;

  const topicCol = `<div class="tool-knit__col">
        <h3>${escText(headings.topic)}</h3>
        <a href="${escAttr(topicHref)}">${escText(topicLabel(entry.topic, locale))}</a>
      </div>`;

  const toolsList = entry.related_tools.map((rel) => {
    const url   = toolUrl(rel, locale);
    const label = toolLabel(rel, locale);
    return `          <li><a href="${escAttr(url)}">${escText(label)}</a></li>`;
  }).join('\n');
  const toolsCol = `<div class="tool-knit__col">
        <h3>${escText(headings.tools)}</h3>
        <ul>
${toolsList}
        </ul>
      </div>`;

  const articlesList = entry.articles.map((url) => {
    const href  = articleUrl(url, locale);
    const label = articleLabel(url, locale);
    return `          <li><a href="${escAttr(href)}">${escText(label)}</a></li>`;
  }).join('\n');
  const articlesCol = `<div class="tool-knit__col">
        <h3>${escText(headings.read)}</h3>
        <ul>
${articlesList}
        </ul>
      </div>`;

  const glossaryList = entry.glossary.map((g) => {
    const href = locale === 'en' ? `/glossary/${g}/` : `/es/glossary/${g}/`;
    const label = glossaryLabel(g, locale);
    return `          <li><a href="${escAttr(href)}">${escText(label)}</a></li>`;
  }).join('\n');
  const glossaryCol = `<div class="tool-knit__col">
        <h3>${escText(headings.words)}</h3>
        <ul>
${glossaryList}
        </ul>
      </div>`;

  return `${SENTINEL_OPEN}
<aside class="tool-knit" aria-labelledby="tool-knit-heading-${slug}">
    <div class="container">
      <h2 id="tool-knit-heading-${slug}" class="tool-knit__h">${escText(headings.h2)}</h2>
      <div class="tool-knit__grid">
      ${topicCol}
      ${toolsCol}
      ${articlesCol}
      ${glossaryCol}
      </div>
    </div>
  </aside>
${SENTINEL_CLOSE}`;
}

// --- write ------------------------------------------------------------

let changed = 0;
let skipped = 0;
const missingSentinels = [];

for (const slug of Object.keys(knit.tools)) {
  for (const locale of ['en', 'es']) {
    const fp  = toolPagePath(slug, locale);
    const rel = path.relative(REPO, fp);
    if (!fs.existsSync(fp)) {
      console.error(`tool page missing: ${rel}`);
      process.exit(3);
    }
    const src = fs.readFileSync(fp, 'utf8');
    if (!SENTINEL_RE.test(src)) {
      missingSentinels.push(rel);
      continue;
    }
    const next = src.replace(SENTINEL_RE, renderKnit(slug, locale));
    if (next !== src) {
      if (!checkOnly) fs.writeFileSync(fp, next);
      changed++;
      console.log(`${checkOnly ? 'would update' : 'updated'}: ${rel}`);
    } else {
      skipped++;
    }
  }
}

if (missingSentinels.length) {
  console.error('\nthe following tool pages are missing the tool-knit sentinel pair:');
  for (const r of missingSentinels) console.error('  ' + r);
  console.error(`\nadd <!-- tool-knit --><!-- /tool-knit --> at the bottom of <main> in each page.`);
  process.exit(4);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of ${Object.keys(knit.tools).length * 2} tool pages, ${skipped} unchanged.`);
if (checkOnly && changed > 0) process.exit(1);
