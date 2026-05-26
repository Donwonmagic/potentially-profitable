#!/usr/bin/env node
/**
 * Phase G.1 (Growth) — extend each blog post's Article JSON-LD with
 * `abstract` (the TL;DR's bullet text joined into a paragraph) and
 * `mentions` (an array of URLs for every /glossary/<slug>/ term cited
 * inside the article body).
 *
 * Adds a sentinel-bracketed second JSON-LD block that re-references
 * the existing Article @id. Search engines merge nodes with the same
 * @id across multiple JSON-LD blocks.
 *
 * Sources:
 *   - abstract: data/article-content.json[*].tldr (joined with "; ").
 *     Falls back to the article's `<meta name="description">` content
 *     when no curated TL;DR exists yet.
 *   - mentions: scrape distinct /glossary/<slug>/ hrefs from
 *     #post-body, dedupe, return [].
 *
 *   node scripts/inject-article-abstract-mentions.mjs           # rewrite
 *   node scripts/inject-article-abstract-mentions.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SITE = 'https://muntin.digital';
const SENTINEL_RE = /<!-- article-abstract-mentions:start -->[\s\S]*?<!-- article-abstract-mentions:end -->/;

function loadTldrMap(locale) {
  const f = path.join(repoRoot, locale === 'es' ? 'data/article-content.es.json' : 'data/article-content.json');
  if (!fs.existsSync(f)) return {};
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  return data.articles || {};
}

function articleFiles() {
  const out = [];
  for (const dir of ['blog', 'es/blog', 'library', 'es/library']) {
    const root = path.join(repoRoot, dir);
    if (!fs.existsSync(root)) continue;
    const locale = dir.startsWith('es') ? 'es' : 'en';
    for (const slug of fs.readdirSync(root)) {
      if (slug === 'drafts') continue;
      const file = path.join(root, slug, 'index.html');
      if (fs.existsSync(file)) out.push({ file, slug, locale });
    }
  }
  return out;
}

function bodyMentions(src, locale) {
  const m = src.match(/<article[^>]*\bid="post-body"[^>]*>([\s\S]*?)<\/article>/i);
  if (!m) return [];
  const body = m[1];
  const re = locale === 'es' ? /href="\/es\/glossary\/([a-z0-9-]+)\//g : /href="\/glossary\/([a-z0-9-]+)\//g;
  const seen = new Set();
  const out = [];
  let mm;
  while ((mm = re.exec(body))) {
    const slug = mm[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push(`${SITE}${locale === 'es' ? '/es' : ''}/glossary/${slug}/`);
  }
  return out;
}

function fallbackAbstract(src) {
  const m = src.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  return m ? m[1] : null;
}

function buildBlock({ slug, locale, abstract, mentions }) {
  const baseUrl = `${SITE}${locale === 'es' ? '/es' : ''}/blog/${slug}/`;
  const obj = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${baseUrl}#article`,
    abstract,
    mentions: mentions.map((url) => ({ '@type': 'DefinedTerm', url })),
  };
  return [
    '<!-- article-abstract-mentions:start -->',
    `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`,
    '<!-- article-abstract-mentions:end -->',
  ].join('\n');
}

let changed = 0;
for (const { file, slug, locale } of articleFiles()) {
  const src = fs.readFileSync(file, 'utf8');
  const tldrMap = loadTldrMap(locale);
  const tldrEntry = tldrMap[slug];
  let abstract = null;
  if (tldrEntry && Array.isArray(tldrEntry.tldr) && tldrEntry.tldr.length) {
    abstract = tldrEntry.tldr.join(' ');
  } else {
    abstract = fallbackAbstract(src);
  }
  if (!abstract) continue;
  const mentions = bodyMentions(src, locale);
  const block = buildBlock({ slug, locale, abstract, mentions });

  let next;
  if (SENTINEL_RE.test(src)) {
    next = src.replace(SENTINEL_RE, block);
  } else {
    const headEnd = src.indexOf('</head>');
    if (headEnd === -1) continue;
    next = src.slice(0, headEnd) + block + '\n' + src.slice(headEnd);
  }
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  changed++;
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} article(s).`);
if (checkOnly && changed > 0) process.exit(1);
