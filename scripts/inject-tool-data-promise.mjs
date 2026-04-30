#!/usr/bin/env node
/**
 * Phase H.6 (Information Security) — Data Promise rail at the top
 * of every tool page (EN + ES). Reads the 3-line condensed text
 * from data/security-claims.json (`data_promise_rail_3line`) so a
 * future edit cascades to every tool without per-page touches.
 *
 * Sentinel-bracketed: <!-- data-promise:start -->...<!-- data-promise:end -->
 * Inserted directly after the tool-verified stamp (or after the H1
 * if no verified stamp present). Idempotent.
 *
 *   node scripts/inject-tool-data-promise.mjs
 *   node scripts/inject-tool-data-promise.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- data-promise:start -->[\s\S]*?<!-- data-promise:end -->/;

const dataPath = path.join(repoRoot, 'data/security-claims.json');
if (!fs.existsSync(dataPath)) { console.log('security-claims data missing'); process.exit(0); }
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const rail = data.data_promise_rail_3line || {};

function buildBlock(locale) {
  const isEs = locale === 'es';
  const line1 = isEs ? rail.line1_es : rail.line1_en;
  const line2 = isEs ? rail.line2_es : rail.line2_en;
  const link3 = isEs ? rail.line3_link_es : rail.line3_link_en;
  const label3 = isEs ? rail.line3_label_es : rail.line3_label_en;
  const link4 = isEs ? rail.line4_link_es : rail.line4_link_en;
  const label4 = isEs ? rail.line4_label_es : rail.line4_label_en;
  return [
    '<!-- data-promise:start -->',
    `      <aside class="tool-data-promise" aria-label="${isEs ? 'Promesa de datos' : 'Data promise'}">`,
    `        <p class="tool-data-promise__line">${line1}</p>`,
    `        <p class="tool-data-promise__line">${line2}</p>`,
    `        <p class="tool-data-promise__links"><a href="${link3}">${label3} &rarr;</a> &middot; <a href="${link4}">${label4} &rarr;</a></p>`,
    '      </aside>',
    '      <!-- data-promise:end -->',
  ].join('\n      ');
}

function findToolPages() {
  const out = [];
  for (const root of ['tools', 'es/tools']) {
    const fullRoot = path.join(repoRoot, root);
    if (!fs.existsSync(fullRoot)) continue;
    const locale = root.startsWith('es') ? 'es' : 'en';
    function walk(rel) {
      const full = path.join(fullRoot, rel);
      for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const sub = path.posix.join(rel, entry.name);
        const idx = path.join(fullRoot, sub, 'index.html');
        if (fs.existsSync(idx)) out.push({ file: idx, locale });
        walk(sub);
      }
    }
    walk('');
  }
  return out;
}

let changed = 0;
const pages = findToolPages();
for (const { file, locale } of pages) {
  const src = fs.readFileSync(file, 'utf8');
  const block = buildBlock(locale);
  let next;
  if (SENTINEL_RE.test(src)) {
    next = src.replace(SENTINEL_RE, block);
  } else {
    // Insert after the tool-verified stamp (preferred), else after H1.
    if (src.includes('<!-- tool-verified:end -->')) {
      next = src.replace('<!-- tool-verified:end -->', '<!-- tool-verified:end -->\n      ' + block);
    } else {
      const h1End = src.indexOf('</h1>');
      if (h1End === -1) continue;
      next = src.slice(0, h1End + 5) + '\n      ' + block + src.slice(h1End + 5);
    }
  }
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  changed++;
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of ${pages.length} tool page(s).`);
if (checkOnly && changed > 0) process.exit(1);
