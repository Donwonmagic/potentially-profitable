#!/usr/bin/env node
/**
 * Phase G.5 (Growth) — stamp HowTo + HowToStep JSON-LD onto the
 * three how-to-titled articles. Source: data/article-howto.json.
 *
 * Sentinel-bracketed second <script type="application/ld+json">
 * block, inserted before </head>. Bilingual (EN+ES via parallel
 * data file fields). Idempotent.
 *
 *   node scripts/inject-article-howto-schema.mjs           # rewrite
 *   node scripts/inject-article-howto-schema.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SITE = 'https://muntin.digital';
const SENTINEL_RE = /<!-- article-howto:start -->[\s\S]*?<!-- article-howto:end -->/;

const dataPath = path.join(repoRoot, 'data/article-howto.json');
if (!fs.existsSync(dataPath)) { console.log('article-howto data missing'); process.exit(0); }
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const articles = data.articles || {};

// EN→ES slug map (data/i18n-slug-map.json). Older how-to articles
// used the same slug in both locales (es/blog/<en-slug>/), but the
// May-2026 publication wave translated slugs (e.g. EN
// may-2026-discovery-changed-under-you → ES
// la-busqueda-cambio-bajo-tus-pies-mayo-2026). Without consulting the
// map, the script tries to read es/blog/<en-slug>/index.html which
// doesn't exist on translated posts, and the ES HowTo silently never
// ships. Falls back to <en-slug> when the map has no entry
// (preserves legacy behavior for the older same-slug articles).
const slugMapPath = path.join(repoRoot, 'data/i18n-slug-map.json');
const slugMap = fs.existsSync(slugMapPath)
  ? (JSON.parse(fs.readFileSync(slugMapPath, 'utf8')).blog || {})
  : {};

function localeSlug(enSlug, locale) {
  if (locale === 'en') return enSlug;
  return slugMap[enSlug] || enSlug;
}

function buildBlock(enSlug, entry, locale) {
  const slug = localeSlug(enSlug, locale);
  const baseUrl = `${SITE}${locale === 'es' ? '/es' : ''}/blog/${slug}/`;
  const name = locale === 'es' ? entry.name_es : entry.name_en;
  const stepsRaw = locale === 'es' ? entry.steps_es : entry.steps_en;
  const steps = stepsRaw.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.name,
    text: s.text,
    url: `${baseUrl}#step-${i + 1}`,
  }));
  const obj = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `${baseUrl}#howto`,
    name,
    totalTime: entry.totalTime || undefined,
    inLanguage: locale === 'es' ? 'es-US' : 'en-US',
    step: steps,
    about: { '@id': `${baseUrl}#article` },
  };
  const json = JSON.stringify(obj, null, 2);
  return [
    '<!-- article-howto:start -->',
    `<script type="application/ld+json">\n${json}\n</script>`,
    '<!-- article-howto:end -->',
  ].join('\n');
}

let changed = 0;
for (const locale of ['en', 'es']) {
  for (const [enSlug, entry] of Object.entries(articles)) {
    if (enSlug.startsWith('_')) continue;
    const slug = localeSlug(enSlug, locale);
    const file = path.join(repoRoot, locale === 'es' ? 'es/blog' : 'blog', slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    const block = buildBlock(enSlug, entry, locale);
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
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} article(s).`);
if (checkOnly && changed > 0) process.exit(1);
