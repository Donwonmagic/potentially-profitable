#!/usr/bin/env node
/**
 * Phase F.5 (Field Notes) — assert every entry in
 * data/article-fieldnotes.json has:
 *   - non-empty author
 *   - valid locale ('en' or 'es')
 *   - body that is already-escaped (decoding+re-encoding is a no-op)
 *   - articleSlug that resolves to an existing blog/<slug>/index.html
 *     (and ES counterpart when the entry is in the es array)
 *
 * Runs in --check mode to fail CI on drift. Catches:
 *   - Hand-edited file with an attribution removed by accident.
 *   - Worker bug that wrote unescaped HTML into the public projection.
 *   - Article moved/deleted while fieldnotes still reference it.
 *
 * Usage:
 *   node scripts/check-fieldnote-attribution.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const dataPath = path.join(repoRoot, 'data', 'article-fieldnotes.json');
const data     = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const fieldnotes = data.fieldnotes || {};

function decodeEntities(s) {
  return String(s == null ? '' : s)
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
}
function reescape(s) {
  return decodeEntities(s).replace(/[&<>"']/g, (c) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
  })[c]);
}

const failures = [];
let total = 0;

for (const [slug, perLocale] of Object.entries(fieldnotes)) {
  for (const locale of ['en', 'es']) {
    const arr = perLocale[locale];
    if (!arr) continue;
    if (!Array.isArray(arr)) {
      failures.push(`${slug}.${locale}: expected an array, got ${typeof arr}`);
      continue;
    }
    arr.forEach((entry, i) => {
      total++;
      if (!entry || typeof entry !== 'object') {
        failures.push(`${slug}.${locale}[${i}]: not an object`);
        return;
      }
      if (!entry.author || typeof entry.author !== 'string' || !entry.author.trim()) {
        failures.push(`${slug}.${locale}[${i}]: missing or empty author`);
      }
      if (!entry.body || typeof entry.body !== 'string') {
        failures.push(`${slug}.${locale}[${i}]: missing body`);
        return;
      }
      // Body must already be escaped: decoding + re-escaping should
      // be a no-op. If it changes, the file shipped unescaped HTML
      // (a server bug or hand-edit error).
      if (reescape(entry.body) !== entry.body) {
        failures.push(`${slug}.${locale}[${i}]: body is not already-escaped`);
      }
      if (entry.donsResponse && reescape(entry.donsResponse) !== entry.donsResponse) {
        failures.push(`${slug}.${locale}[${i}]: donsResponse is not already-escaped`);
      }
    });
    // Article slug resolution.
    const dir = locale === 'es' ? path.join(repoRoot, 'es', 'blog', slug) : path.join(repoRoot, 'blog', slug);
    if (arr.length && !fs.existsSync(path.join(dir, 'index.html'))) {
      failures.push(`${slug}.${locale}: ${arr.length} note(s) but ${path.relative(repoRoot, dir)}/index.html missing`);
    }
  }
}

if (failures.length) {
  console.error('Article fieldnote attribution:');
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`Article fieldnote attribution: ${total} entry(ies) clean.`);
