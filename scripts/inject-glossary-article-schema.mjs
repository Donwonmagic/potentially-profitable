#!/usr/bin/env node
/**
 * Phase G.2 (Growth) — schema depth for glossary terms.
 *
 * Injects a sentinel-bracketed second <script type="application/ld+json">
 * block onto every glossary term page (EN + ES). The block contains an
 * Article node that re-references the term's @id, plus author + image +
 * dateModified properties. The existing DefinedTerm + BreadcrumbList
 * @graph (in the first JSON-LD block) stays untouched.
 *
 * Why: Google + LLM search engines rank Article-typed entities for
 * "what is X" queries. DefinedTerm alone doesn't get the same surface.
 * Adding Article via @id-merge lets the same page satisfy both intents.
 *
 * Sources:
 *   - term name + description: parsed from the existing DefinedTerm
 *     JSON-LD already emitted by the static templates.
 *   - dateModified: git log -1 --format=%cI on the term directory.
 *   - image: /brand/og/glossary-<slug>(-es).png — same card the
 *     existing inject-glossary-og.mjs already points at.
 *   - author: https://muntin.digital/#don-goldstein (canonical Person).
 *
 * Sentinels:
 *   <!-- glossary-article-schema:start -->
 *   <script type="application/ld+json">{...}</script>
 *   <!-- glossary-article-schema:end -->
 *
 *   node scripts/inject-glossary-article-schema.mjs           # rewrite
 *   node scripts/inject-glossary-article-schema.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SITE = 'https://muntin.digital';
const SENTINEL_RE = /<!-- glossary-article-schema:start -->[\s\S]*?<!-- glossary-article-schema:end -->/;

const CATEGORY_SLUGS = new Set([
  'basics', 'brand-design', 'conversions', 'data-literacy',
  'findability', 'mobile', 'restaurant-numbers', 'subtypes', 'trust',
]);

function gitMtime(dir) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${dir}"`, { cwd: repoRoot, encoding: 'utf8' }).trim();
    if (out) return out;
  } catch (_) { /* fall through */ }
  return new Date().toISOString();
}

function parseDefinedTerm(src) {
  const m = src.match(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/);
  if (!m) return null;
  let parsed;
  try { parsed = JSON.parse(m[1]); } catch (_) { return null; }
  const graph = Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
  for (const node of graph) {
    if (node['@type'] === 'DefinedTerm') return node;
  }
  return null;
}

function buildBlock({ slug, locale, term }) {
  const baseUrl = `${SITE}${locale === 'es' ? '/es' : ''}/glossary/${slug}/`;
  const ogSuffix = locale === 'es' ? '-es' : '';
  const ogUrl = `${SITE}/brand/og/glossary-${slug}${ogSuffix}.png`;
  const dateModified = gitMtime(path.join(repoRoot, locale === 'es' ? 'es/glossary' : 'glossary', slug));

  const obj = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${baseUrl}#article`,
        headline: term.name,
        abstract: term.description,
        description: term.description,
        url: baseUrl,
        mainEntityOfPage: { '@id': `${baseUrl}#term` },
        about: { '@id': `${baseUrl}#term` },
        inLanguage: locale === 'es' ? 'es-US' : 'en-US',
        author: {
          '@type': 'Person',
          '@id': `${SITE}/#don-goldstein`,
          name: 'Don Goldstein',
          url: `${SITE}/about/`,
        },
        publisher: { '@id': `${SITE}/#business` },
        image: ogUrl,
        dateModified,
        isPartOf: { '@id': `${SITE}/glossary/#muntin-glossary` },
      },
    ],
  };

  const json = JSON.stringify(obj, null, 2);
  return [
    '<!-- glossary-article-schema:start -->',
    `<script type="application/ld+json">\n${json}\n</script>`,
    '<!-- glossary-article-schema:end -->',
  ].join('\n');
}

function collectTerms(rootDir) {
  const out = [];
  if (!fs.existsSync(rootDir)) return out;
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (CATEGORY_SLUGS.has(entry.name)) continue;
    if (entry.name === 'sitemap') continue;
    const file = path.join(rootDir, entry.name, 'index.html');
    if (!fs.existsSync(file)) continue;
    out.push({ slug: entry.name, file });
  }
  return out;
}

const LOCALES = [
  { code: 'en', dir: path.join(repoRoot, 'glossary') },
  { code: 'es', dir: path.join(repoRoot, 'es/glossary') },
];

let changed = 0;
let skipped = 0;
const missing = [];

for (const { code, dir } of LOCALES) {
  for (const { slug, file } of collectTerms(dir)) {
    const src = fs.readFileSync(file, 'utf8');
    const term = parseDefinedTerm(src);
    if (!term) {
      missing.push(`${code}/${slug}: no DefinedTerm JSON-LD found`);
      continue;
    }
    const block = buildBlock({ slug, locale: code, term });

    let next;
    if (SENTINEL_RE.test(src)) {
      next = src.replace(SENTINEL_RE, block);
    } else {
      const headM = src.match(/<\/head>/);
      if (!headM) { skipped++; continue; }
      next = src.replace('</head>', `${block}\n</head>`);
    }
    if (next === src) continue;
    if (!checkOnly) fs.writeFileSync(file, next);
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
    changed++;
  }
}

if (missing.length) {
  console.warn(`Glossary article schema: ${missing.length} term(s) missing DefinedTerm:`);
  for (const m of missing) console.warn('  · ' + m);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} file(s); ${skipped} skipped (no </head>).`);
if (checkOnly && changed > 0) process.exit(1);
