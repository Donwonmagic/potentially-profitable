#!/usr/bin/env node
/**
 * Phase G.2 (Growth) — stamp CollectionPage + ItemList JSON-LD onto
 * each hub page (/blog/, /learn/, /glossary/, /tools/) — EN + ES.
 *
 * Helps Google understand topical authority: a hub is "the canonical
 * list of X type, here are the items." Sentinel-bracketed so re-runs
 * are idempotent.
 *
 *   node scripts/inject-hub-collection-schema.mjs           # rewrite
 *   node scripts/inject-hub-collection-schema.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SITE = 'https://muntin.digital';
const SENTINEL_RE = /<!-- hub-collection:start -->[\s\S]*?<!-- hub-collection:end -->/;

const HUBS = [
  {
    path: 'blog',
    name_en: 'Articles',     name_es: 'Artículos',
    desc_en: 'Long-form articles on restaurant SEO, operations, and the website moves that earn their keep.',
    desc_es: 'Artículos largos sobre SEO de restaurantes, operaciones, y los movimientos del sitio que se ganan su lugar.',
  },
  {
    path: 'glossary',
    name_en: 'Glossary',     name_es: 'Glosario',
    desc_en: 'A bilingual glossary of restaurant-web terms, in plain English.',
    desc_es: 'Un glosario bilingüe de términos web para restaurantes, en español claro.',
  },
  {
    path: 'tools',
    name_en: 'Free tools',   name_es: 'Herramientas gratis',
    desc_en: 'Free, browser-only tools for restaurant SEO, margin math, and storefront diagnostics.',
    desc_es: 'Herramientas gratis, en el navegador, para SEO de restaurantes, márgenes y diagnóstico del escaparate.',
  },
  {
    path: 'learn',
    name_en: 'Library',      name_es: 'Biblioteca',
    desc_en: 'Topic clusters, research, checklists — the structured way through everything Muntin Digital teaches.',
    desc_es: 'Clusters por tema, investigación, listas — la manera estructurada de recorrer todo lo que enseña Muntin Digital.',
  },
];

function listChildren(dir, locale) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (e.name === 'drafts') continue;
    const f = path.join(dir, e.name, 'index.html');
    if (!fs.existsSync(f)) continue;
    // Pull <title> for the ListItem name.
    const src = fs.readFileSync(f, 'utf8');
    if (/<meta\s+name="robots"[^>]*noindex/i.test(src)) continue;
    const t = src.match(/<title>([^<]+)<\/title>/);
    const name = t ? t[1].split(' | ')[0].split(' — ')[0].trim() : e.name;
    const url = `${SITE}${locale === 'es' ? '/es' : ''}/${path.basename(dir)}/${e.name}/`;
    out.push({ name, url });
  }
  return out;
}

function buildBlock(hub, locale) {
  const baseUrl = `${SITE}${locale === 'es' ? '/es' : ''}/${hub.path}/`;
  const dir = path.join(repoRoot, locale === 'es' ? 'es' : '', hub.path);
  const children = listChildren(dir, locale).slice(0, 50); // cap for readability
  const obj = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${baseUrl}#collection`,
        name: locale === 'es' ? hub.name_es : hub.name_en,
        description: locale === 'es' ? hub.desc_es : hub.desc_en,
        url: baseUrl,
        inLanguage: locale === 'es' ? 'es-US' : 'en-US',
        mainEntity: { '@id': `${baseUrl}#items` },
        publisher: { '@id': `${SITE}/#business` },
      },
      {
        '@type': 'ItemList',
        '@id': `${baseUrl}#items`,
        numberOfItems: children.length,
        itemListElement: children.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: c.url,
          name: c.name,
        })),
      },
    ],
  };
  const json = JSON.stringify(obj, null, 2);
  return [
    '<!-- hub-collection:start -->',
    `<script type="application/ld+json">\n${json}\n</script>`,
    '<!-- hub-collection:end -->',
  ].join('\n');
}

let changed = 0;
let skipped = 0;
for (const hub of HUBS) {
  for (const locale of ['en', 'es']) {
    const file = path.join(repoRoot, locale === 'es' ? 'es' : '', hub.path, 'index.html');
    if (!fs.existsSync(file)) { skipped++; continue; }
    const src = fs.readFileSync(file, 'utf8');
    const block = buildBlock(hub, locale);
    let next;
    if (SENTINEL_RE.test(src)) {
      next = src.replace(SENTINEL_RE, block);
    } else {
      const headEnd = src.indexOf('</head>');
      if (headEnd === -1) { skipped++; continue; }
      next = src.slice(0, headEnd) + block + '\n' + src.slice(headEnd);
    }
    if (next === src) continue;
    if (!checkOnly) fs.writeFileSync(file, next);
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
    changed++;
  }
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} hub page(s); ${skipped} skipped.`);
if (checkOnly && changed > 0) process.exit(1);
