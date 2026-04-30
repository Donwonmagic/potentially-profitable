#!/usr/bin/env node
/**
 * Phase G.8 (Growth) — sidecar on /glossary/ index pages: a quiet
 * "Tools that use these terms" rail right after the recently-added
 * block. Net new ~30 internal links from a high-PageRank page.
 *
 *   node scripts/inject-glossary-tool-sidecar.mjs           # rewrite
 *   node scripts/inject-glossary-tool-sidecar.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- glossary-tool-sidecar:start -->[\s\S]*?<!-- glossary-tool-sidecar:end -->/;

const TOOLS = [
  { slug: 'audits/restaurant', en: 'Restaurant Audit',     es: 'Auditoría de Restaurante',  desc_en: 'Composite scorecard across speed, SEO, schema, GBP, and 9 restaurant-specific checks.', desc_es: 'Tarjeta compuesta de velocidad, SEO, schema, GBP y 9 chequeos específicos de restaurante.' },
  { slug: 'storefront-health', en: 'Storefront Health',    es: 'Salud del Escaparate',       desc_en: 'The 6-tool composite score for your full storefront.', desc_es: 'El puntaje compuesto de 6 herramientas para tu escaparate.' },
  { slug: 'gbp-grader',        en: 'GBP Grader',           es: 'Calificador de GBP',         desc_en: 'Grade your Google Business Profile against the categories that drive rank.', desc_es: 'Califica tu perfil de Google contra las categorías que mueven el ranking.' },
  { slug: 'speed-test',        en: 'Speed Test',           es: 'Prueba de Velocidad',        desc_en: 'Lighthouse-backed score with the slowest assets called out.', desc_es: 'Puntaje respaldado por Lighthouse con los archivos más lentos.' },
  { slug: 'schema-check',      en: 'Schema Check',         es: 'Revisor de Schema',          desc_en: 'Validate every restaurant-specific structured data type.', desc_es: 'Valida cada tipo de structured data específico de restaurantes.' },
  { slug: 'margin-math',       en: 'Margin Math',          es: 'Margin Math',                desc_en: 'Prime cost calculator + price-raise simulator.', desc_es: 'Calculadora de costo primario + simulador de aumento de precios.' },
];

function buildBlock(locale) {
  const heading = locale === 'es' ? 'Herramientas que usan estos términos' : 'Tools that use these terms';
  const lead    = locale === 'es' ? 'Cada término del glosario apunta a la herramienta donde se mide. Empieza por la auditoría compuesta y profundiza desde ahí.' : 'Each glossary term links to the tool where it gets measured. Start with the composite audit and drill down.';
  const items = TOOLS.map((t) => {
    const url = locale === 'es' ? `/es/tools/${t.slug}/` : `/tools/${t.slug}/`;
    const name = locale === 'es' ? t.es : t.en;
    const desc = locale === 'es' ? t.desc_es : t.desc_en;
    return `        <li><a href="${url}"><strong>${name}</strong></a> <span>${desc}</span></li>`;
  }).join('\n');
  return [
    '<!-- glossary-tool-sidecar:start -->',
    '<aside class="container gloss-tool-sidecar" aria-labelledby="gloss-tool-sidecar-h">',
    `  <h2 id="gloss-tool-sidecar-h" class="gloss-tool-sidecar__h">${heading}</h2>`,
    `  <p class="gloss-tool-sidecar__lead">${lead}</p>`,
    '  <ul class="gloss-tool-sidecar__list">',
    items,
    '  </ul>',
    '</aside>',
    '<!-- glossary-tool-sidecar:end -->',
  ].join('\n');
}

let changed = 0;
for (const locale of ['en', 'es']) {
  const file = path.join(repoRoot, locale === 'es' ? 'es' : '', 'glossary', 'index.html');
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const block = buildBlock(locale);
  let next;
  if (SENTINEL_RE.test(src)) {
    next = src.replace(SENTINEL_RE, block);
  } else {
    // Insert after the recently-added rail.
    const after = '<!-- glossary-recent:end -->';
    const idx = src.indexOf(after);
    if (idx === -1) continue;
    const insertAt = idx + after.length;
    next = src.slice(0, insertAt) + '\n\n' + block + src.slice(insertAt);
  }
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  changed++;
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} glossary index page(s).`);
if (checkOnly && changed > 0) process.exit(1);
