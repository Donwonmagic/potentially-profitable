#!/usr/bin/env node
/**
 * Phase G.2 (Growth) — Storefront Health composite expansion.
 * Adds a sentinel-bracketed JSON-LD block on /tools/storefront-health/
 * (EN + ES) carrying:
 *   - Service node ("Storefront Health audit")
 *   - ItemList of the 6 sub-tools (seo-grader, speed-test, mobile-check,
 *     schema-check, gbp-grader, audits/restaurant)
 *
 * The existing SoftwareApplication + HowTo block from
 * inject-tool-howto.mjs stays untouched.
 *
 *   node scripts/inject-storefront-health-graph.mjs           # rewrite
 *   node scripts/inject-storefront-health-graph.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SITE = 'https://muntin.digital';
const SENTINEL_RE = /<!-- storefront-health-graph:start -->[\s\S]*?<!-- storefront-health-graph:end -->/;

const SUB_TOOLS = [
  { slug: 'seo-grader',         en: 'SEO Grader',         es: 'Calificador de SEO' },
  { slug: 'speed-test',         en: 'Speed Test',         es: 'Prueba de Velocidad' },
  { slug: 'mobile-check',       en: 'Mobile Check',       es: 'Revisor Móvil' },
  { slug: 'schema-check',       en: 'Schema Check',       es: 'Revisor de Schema' },
  { slug: 'gbp-grader',         en: 'GBP Grader',         es: 'Calificador de GBP' },
  { slug: 'audits/restaurant',  en: 'Restaurant Audit',   es: 'Auditoría de Restaurante' },
];

function buildBlock(locale) {
  const baseUrl = `${SITE}${locale === 'es' ? '/es' : ''}/tools/storefront-health/`;
  const obj = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${baseUrl}#service`,
        name: locale === 'es' ? 'Auditoría de Salud del Escaparate' : 'Storefront Health audit',
        provider: { '@id': `${SITE}/#business` },
        serviceType: 'RestaurantSEOAudit',
        areaServed: 'United States',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: baseUrl,
        about: { '@id': `${baseUrl}#tool` },
      },
      {
        '@type': 'ItemList',
        '@id': `${baseUrl}#sub-tools`,
        numberOfItems: SUB_TOOLS.length,
        itemListElement: SUB_TOOLS.map((t, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE}${locale === 'es' ? '/es' : ''}/tools/${t.slug}/`,
          name: locale === 'es' ? t.es : t.en,
        })),
      },
    ],
  };
  return [
    '<!-- storefront-health-graph:start -->',
    `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`,
    '<!-- storefront-health-graph:end -->',
  ].join('\n');
}

let changed = 0;
for (const locale of ['en', 'es']) {
  const file = path.join(repoRoot, locale === 'es' ? 'es' : '', 'tools/storefront-health', 'index.html');
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const block = buildBlock(locale);
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
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} storefront-health page(s).`);
if (checkOnly && changed > 0) process.exit(1);
