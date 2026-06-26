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

// 2026-06-26 tools migration: the audit/storefront-health/gbp-grader
// entries were removed when those pages were retired. Kept the cost
// tools plus the live sub-tools (speed-test, schema-check).
const TOOLS = [
  { slug: 'margin-math',       en: 'Margin Math',          es: 'Margin Math',                desc_en: 'Prime cost calculator + price-raise simulator.', desc_es: 'Calculadora de costo primario + simulador de aumento de precios.' },
  { slug: 'menu-engineering',  en: 'Menu Engineering',     es: 'Ingeniería de Menú',         desc_en: 'Sort every dish into Stars, Plowhorses, Puzzles, and Dogs with one action each.', desc_es: 'Ordena cada plato en Estrellas, Caballos, Acertijos y Perros con una acción cada uno.' },
  { slug: 'plate-cost',        en: 'Plate Cost',           es: 'Costo del Plato',            desc_en: 'What each dish makes the house per year on your real volume and invoice prices.', desc_es: 'Cuánto le deja cada plato al año sobre tu volumen real y tus precios de factura.' },
  { slug: 'speed-test',        en: 'Speed Test',           es: 'Prueba de Velocidad',        desc_en: 'Lighthouse-backed score with the slowest assets called out.', desc_es: 'Puntaje respaldado por Lighthouse con los archivos más lentos.' },
  { slug: 'schema-check',      en: 'Schema Check',         es: 'Revisor de Schema',          desc_en: 'Validate every restaurant-specific structured data type.', desc_es: 'Valida cada tipo de structured data específico de restaurantes.' },
];

function buildBlock(locale) {
  const heading = locale === 'es' ? 'Herramientas que usan estos términos' : 'Tools that use these terms';
  const lead    = locale === 'es' ? 'Cada término del glosario apunta a la herramienta donde se mide. Empieza por las cuentas de margen y profundiza desde ahí.' : 'Each glossary term links to the tool where it gets measured. Start with the margin math and drill down.';
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
