#!/usr/bin/env node
/**
 * Sprint 10 (Cohesion) — inject "Field note from the kitchen"
 * fieldnotes into glossary term pages.
 *
 * Reads data/glossary-fieldnotes.json. For each entry, finds the
 * corresponding term page (glossary/<slug>/index.html for EN,
 * es/glossary/<slug>/index.html for ES) and stamps the fieldnote
 * inside the .term-body between sentinels:
 *
 *   <!-- field-note:start -->
 *   <aside class="callout callout--field">
 *     <p class="callout-eyebrow">Field note from the kitchen</p>
 *     <p class="callout-body">…</p>
 *   </aside>
 *   <!-- field-note:end -->
 *
 * If the sentinel pair already exists, the script replaces the
 * content between them. If it's missing, the script inserts the
 * pair right before the existing
 * <!-- glossary-explainer-cue:start --> sentinel (or, failing
 * that, just before the </div> closing .term-body).
 *
 * EN-only fieldnotes are supported: the script touches only the
 * EN page. ES counterparts wait for Sprint 11's ES voice pass.
 *
 * Usage:
 *   node scripts/inject-glossary-fieldnotes.mjs           # rewrite in place
 *   node scripts/inject-glossary-fieldnotes.mjs --check   # exit 1 if any change
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const dataPath = path.join(repoRoot, 'data', 'glossary-fieldnotes.json');
const data     = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const fieldnotes = data.fieldnotes || {};

const SENTINEL_RE = /<!-- field-note:start -->[\s\S]*?<!-- field-note:end -->/;
const EXPLAINER_CUE = /<!-- glossary-explainer-cue:start -->/;

const LOCALES = [
  { code: 'en', dir: 'glossary',     eyebrow: 'Field note from the kitchen' },
  { code: 'es', dir: 'es/glossary',  eyebrow: 'Apunte desde la cocina' },
];

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;' })[c]);
}

function renderBlock(eyebrow, body) {
  return [
    '<!-- field-note:start -->',
    '      <aside class="callout callout--field">',
    `        <p class="callout-eyebrow">${escapeHtml(eyebrow)}</p>`,
    `        <p class="callout-body">${escapeHtml(body)}</p>`,
    '      </aside>',
    '      <!-- field-note:end -->',
  ].join('\n      ');
}

function injectFieldnote(file, eyebrow, body) {
  const src = fs.readFileSync(file, 'utf8');
  const block = renderBlock(eyebrow, body);

  let next;
  if (SENTINEL_RE.test(src)) {
    // Already has sentinels — replace content between them.
    next = src.replace(SENTINEL_RE, block);
  } else {
    // Insert immediately before the explainer-cue sentinel if
    // present (keeps the block inside .term-body, before any
    // glossary-explainer that wires research links).
    const insertion = block + '\n      ';
    if (EXPLAINER_CUE.test(src)) {
      next = src.replace(EXPLAINER_CUE, insertion + '<!-- glossary-explainer-cue:start -->');
    } else {
      // Fallback: nothing matched. Skip this file with a warning.
      console.warn(`  warn: ${path.relative(repoRoot, file)} has no glossary-explainer-cue sentinel; skipping`);
      return false;
    }
  }

  if (next === src) return false;
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  return true;
}

let changed = 0;
let skipped = 0;
const missing = [];

for (const [slug, entry] of Object.entries(fieldnotes)) {
  for (const { code, dir, eyebrow } of LOCALES) {
    const body = entry[code];
    if (!body) continue;       // no copy authored for this locale yet
    const file = path.join(repoRoot, dir, slug, 'index.html');
    if (!fs.existsSync(file)) {
      missing.push(`${dir}/${slug}/index.html`);
      continue;
    }
    if (injectFieldnote(file, eyebrow, body)) changed++;
    else skipped++;
  }
}

if (missing.length) {
  console.warn(`\n${missing.length} term page(s) referenced in data/glossary-fieldnotes.json but missing on disk:`);
  for (const m of missing) console.warn(`  ${m}`);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} file(s); ${skipped} unchanged.`);

if (checkOnly && changed > 0) process.exit(1);
