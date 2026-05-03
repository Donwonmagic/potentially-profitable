#!/usr/bin/env node
/**
 * Operator Sheets · D3 worked examples injector.
 *
 * Reads data/sheet-worked-examples.json and stamps a quiet
 * `<details class="sheet-worked-example">` block right BEFORE the
 * `<form id="sheet-fields">` on each mapped sheet page (EN+ES).
 * The block is collapsed by default — the operator opens it when
 * they want to see what a typical Tuesday-morning fill-in looks
 * like for a real shop.
 *
 * Sentinel-bracketed (sheet-worked-example:start/end) so re-runs
 * are idempotent. If the slug isn't in the data file, the sheet
 * page is left alone.
 *
 *   node scripts/inject-sheet-worked-examples.mjs           # rewrite
 *   node scripts/inject-sheet-worked-examples.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /\n[ \t]*<!-- sheet-worked-example:start -->[\s\S]*?<!-- sheet-worked-example:end -->/g;
const FORM_RE     = /<form id="sheet-fields"/;

const dataPath = path.join(repoRoot, 'data', 'sheet-worked-examples.json');
if (!fs.existsSync(dataPath)) { console.log('sheet-worked-examples.json missing — skipping'); process.exit(0); }

const EXAMPLES = JSON.parse(fs.readFileSync(dataPath, 'utf8')).examples || {};

const COPY = {
  en: {
    eyebrow: 'Worked example',
    open:    'See what a Tuesday-morning fill-in looks like',
    inputs:  'What they typed in',
    result:  'What the sheet returned',
    note:    'Composite-typical numbers — not a real shop. Use the rhythm, not the figures.',
  },
  es: {
    eyebrow: 'Ejemplo trabajado',
    open:    'Ve cómo se ve un llenado de un martes en la mañana',
    inputs:  'Lo que tipearon',
    result:  'Lo que la hoja les regresó',
    note:    'Números compuestos típicos — no un local real. Usa el ritmo, no las cifras.',
  },
};

function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function escText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function rowsTable(rows) {
  if (!rows || !rows.length) return '';
  const trs = rows.map(([k, v]) =>
    `<tr><th scope="row">${escText(k)}</th><td>${escText(v)}</td></tr>`
  ).join('');
  return `<table class="swe-rows"><tbody>${trs}</tbody></table>`;
}

function buildBlock(slug, ex, locale) {
  const c = COPY[locale];
  const subject   = locale === 'es' ? ex.subject_es   : ex.subject_en;
  const inputs    = locale === 'es' ? ex.inputs_es    : ex.inputs_en;
  const result    = locale === 'es' ? ex.result_es    : ex.result_en;
  const punchline = locale === 'es' ? ex.punchline_es : ex.punchline_en;
  if (!subject || !inputs || !result || !punchline) return null;

  return `<!-- sheet-worked-example:start -->
    <details class="sheet-worked-example" data-sheet="${escAttr(slug)}">
      <summary>
        <span class="swe-eyebrow">${escText(c.eyebrow)}</span>
        <span class="swe-subject">${escText(subject)}</span>
        <span class="swe-cta">${escText(c.open)}</span>
      </summary>
      <div class="swe-body">
        <p class="swe-section-label">${escText(c.inputs)}</p>
        ${rowsTable(inputs)}
        <p class="swe-section-label">${escText(c.result)}</p>
        ${rowsTable(result)}
        <p class="swe-punchline">${escText(punchline)}</p>
        <p class="swe-note">${escText(c.note)}</p>
      </div>
    </details>
    <!-- sheet-worked-example:end -->`;
}

function injectBlock(html, block) {
  // Strip any prior worked-example blocks (idempotency).
  let out = html.replace(SENTINEL_RE, '');
  // Inject right before `<form id="sheet-fields"`.
  const m = FORM_RE.exec(out);
  if (!m) return null;
  const before = out.slice(0, m.index);
  const after  = out.slice(m.index);
  return before + block + '\n        ' + after;
}

let changed = 0;
let skipped = 0;
const missing = [];

for (const [slug, ex] of Object.entries(EXAMPLES)) {
  for (const root of [['en', 'sheets'], ['es', 'es/sheets']]) {
    const [locale, dir] = root;
    const file = path.join(repoRoot, dir, slug, 'index.html');
    if (!fs.existsSync(file)) { skipped++; continue; }
    const original = fs.readFileSync(file, 'utf8');
    const block = buildBlock(slug, ex, locale);
    if (!block) { skipped++; continue; }
    const next = injectBlock(original, block);
    if (next == null) {
      missing.push(`${slug} (${locale}): <form id="sheet-fields"> not found`);
      continue;
    }
    if (next === original) { skipped++; continue; }
    if (!checkOnly) fs.writeFileSync(file, next);
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
    changed++;
  }
}

if (missing.length) {
  console.warn('\nform anchors not found:');
  for (const a of missing) console.warn('  · ' + a);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} sheet page(s); ${skipped} skipped.`);
if (checkOnly && changed > 0) process.exit(1);
