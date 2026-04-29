#!/usr/bin/env node
/**
 * Phase F.1 (Field Notes) — assert every articleSlug referenced in
 * data/article-fieldnotes.json resolves to an existing
 * blog/<slug>/index.html (and an es/blog/<slug>/index.html when the
 * entry has an `es` array).
 *
 * Cheap, local, fast. Runs in --check mode to fail CI on drift.
 *
 * Usage:
 *   node scripts/check-fieldnotes-allowlist.mjs --check
 *
 * Exits 0 when every slug resolves; 1 with a per-slug error otherwise.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const dataPath = path.join(repoRoot, 'data', 'article-fieldnotes.json');
const data     = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const fieldnotes = data.fieldnotes || {};

const failures = [];
const slugs = Object.keys(fieldnotes);

for (const slug of slugs) {
  const entry = fieldnotes[slug];
  const enFile = path.join(repoRoot, 'blog', slug, 'index.html');
  const esFile = path.join(repoRoot, 'es', 'blog', slug, 'index.html');
  if (entry.en && entry.en.length && !fs.existsSync(enFile)) {
    failures.push(`${slug}: has en notes but blog/${slug}/index.html missing`);
  }
  if (entry.es && entry.es.length && !fs.existsSync(esFile)) {
    failures.push(`${slug}: has es notes but es/blog/${slug}/index.html missing`);
  }
}

if (failures.length) {
  console.error('Article fieldnotes allowlist:');
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`Article fieldnotes allowlist: ${slugs.length} slug(s) resolve.`);
