#!/usr/bin/env node
/**
 * Phase G.4 (Growth) — rewrite glossary "Used in tools" links from
 * /tools/<slug>/ to /tools/<slug>/#<anchor> when the (term, tool)
 * pair has a curated anchor in data/glossary-tool-anchors.json.
 *
 * Sentinel-bracketed via the existing glossary-knit block — we don't
 * write our own sentinels, we mutate the existing tool links inside
 * the page in place. Idempotent: a link already at the deep anchor
 * passes through unchanged.
 *
 *   node scripts/inject-glossary-deep-anchors.mjs           # rewrite
 *   node scripts/inject-glossary-deep-anchors.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const dataPath = path.join(repoRoot, 'data/glossary-tool-anchors.json');
if (!fs.existsSync(dataPath)) { console.log('no anchors data — skipping'); process.exit(0); }
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const anchors = data.anchors || {};

function termsIn(rootDir) {
  const out = [];
  if (!fs.existsSync(rootDir)) return out;
  for (const e of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const f = path.join(rootDir, e.name, 'index.html');
    if (fs.existsSync(f)) out.push({ slug: e.name, file: f });
  }
  return out;
}

let changed = 0;
let skipped = 0;
for (const root of [['en', 'glossary'], ['es', 'es/glossary']]) {
  const [locale, dir] = root;
  for (const { slug, file } of termsIn(path.join(repoRoot, dir))) {
    const pairings = anchors[slug];
    if (!pairings) { skipped++; continue; }
    const src = fs.readFileSync(file, 'utf8');
    let next = src;
    for (const [toolSlug, anchor] of Object.entries(pairings)) {
      const pathPrefix = locale === 'es' ? `/es/tools/${toolSlug}/` : `/tools/${toolSlug}/`;
      // Match href="/tools/<toolSlug>/" — a bare root URL — and append #anchor.
      const re = new RegExp(`href="${pathPrefix.replace(/\//g, '\\/')}"`, 'g');
      next = next.replace(re, `href="${pathPrefix}#${anchor}"`);
    }
    if (next === src) continue;
    if (!checkOnly) fs.writeFileSync(file, next);
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
    changed++;
  }
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} term page(s); ${skipped} skipped (no anchor pairings).`);
if (checkOnly && changed > 0) process.exit(1);
