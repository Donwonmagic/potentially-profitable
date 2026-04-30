#!/usr/bin/env node
/**
 * Phase G.8 (Growth) — render a "Part of Storefront Health" rail
 * near the top of each Storefront Health sub-tool page. The rail
 * tells operators arriving from search "this tool is one input
 * into a composite scorecard" — and drives traffic from each
 * sub-tool back to the high-leverage Storefront Health surface.
 *
 * Sub-tools (per Phase C — Storefront Health composite scorecard):
 *   - seo-grader, speed-test, mobile-check, schema-check,
 *     gbp-grader, audits/restaurant
 *
 * Sentinel-bracketed (<!-- storefront-rail:start -->...end), placed
 * directly after the H1. Locale-aware copy.
 *
 *   node scripts/inject-tool-storefront-rail.mjs           # rewrite
 *   node scripts/inject-tool-storefront-rail.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- storefront-rail:start -->[\s\S]*?<!-- storefront-rail:end -->/;

const SUB_TOOLS = ['seo-grader', 'speed-test', 'mobile-check', 'schema-check', 'gbp-grader', 'audits/restaurant'];

function renderRail(locale) {
  const sfUrl = locale === 'es' ? '/es/tools/storefront-health/' : '/tools/storefront-health/';
  const label = locale === 'es' ? 'Forma parte de' : 'Part of';
  const name = locale === 'es' ? 'Salud del Escaparate' : 'Storefront Health';
  const note = locale === 'es'
    ? '— el puntaje compuesto que junta esta señal con cinco más en una sola tarjeta.'
    : '— the composite score that pairs this signal with five others on one scorecard.';
  return [
    '<!-- storefront-rail:start -->',
    `      <p class="tool-storefront-rail">${label} <a href="${sfUrl}"><strong>${name}</strong></a> ${note}</p>`,
    '      <!-- storefront-rail:end -->',
  ].join('\n      ');
}

let changed = 0;
const targets = [];
for (const sub of SUB_TOOLS) {
  for (const root of ['tools', 'es/tools']) {
    const file = path.join(repoRoot, root, sub, 'index.html');
    if (!fs.existsSync(file)) continue;
    targets.push({ file, locale: root.startsWith('es') ? 'es' : 'en' });
  }
}

for (const { file, locale } of targets) {
  const src = fs.readFileSync(file, 'utf8');
  const block = renderRail(locale);
  let next;
  if (SENTINEL_RE.test(src)) {
    next = src.replace(SENTINEL_RE, block);
  } else {
    // First-time insert: place after the existing tool-verified stamp
    // (which is itself just-after-H1) so the rail follows the date.
    if (src.includes('<!-- tool-verified:end -->')) {
      next = src.replace('<!-- tool-verified:end -->', '<!-- tool-verified:end -->\n      ' + block);
    } else {
      const h1M = src.match(/<\/h1>/);
      if (!h1M) continue;
      next = src.replace('</h1>', `</h1>\n      ${block}`);
    }
  }
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  changed++;
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of ${targets.length} sub-tool page(s).`);
if (checkOnly && changed > 0) process.exit(1);
