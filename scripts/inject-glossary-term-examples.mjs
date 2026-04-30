#!/usr/bin/env node
/**
 * Phase G.4 (Growth) — stamp a per-term concrete-example sentence
 * on glossary term pages. Sourced from data/glossary-term-examples.json.
 *
 * Sentinel-bracketed (<!-- term-example:start -->...end), inserted
 * directly after the term's <h1>. Locale-aware via the entry's
 * { en, es } shape.
 *
 *   node scripts/inject-glossary-term-examples.mjs           # rewrite
 *   node scripts/inject-glossary-term-examples.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- term-example:start -->[\s\S]*?<!-- term-example:end -->/;

const dataPath = path.join(repoRoot, 'data/glossary-term-examples.json');
if (!fs.existsSync(dataPath)) { console.log('term-examples data missing — skipping'); process.exit(0); }
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const examples = data.examples || {};

function buildBlock(text) {
  return [
    '<!-- term-example:start -->',
    `      <p class="term-example">${text}</p>`,
    '      <!-- term-example:end -->',
  ].join('\n      ');
}

function findTerms(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  const out = [];
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
  for (const { slug, file } of findTerms(path.join(repoRoot, dir))) {
    const entry = examples[slug];
    if (!entry || !entry[locale]) { skipped++; continue; }
    const src = fs.readFileSync(file, 'utf8');
    const block = buildBlock(entry[locale]);
    let next;
    if (SENTINEL_RE.test(src)) {
      next = src.replace(SENTINEL_RE, block);
    } else {
      // Insert directly after the FIRST </h1> (the term's heading).
      const h1Idx = src.indexOf('</h1>');
      if (h1Idx === -1) { skipped++; continue; }
      const insertAt = h1Idx + '</h1>'.length;
      next = src.slice(0, insertAt) + '\n      ' + block + src.slice(insertAt);
    }
    if (next === src) continue;
    if (!checkOnly) fs.writeFileSync(file, next);
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
    changed++;
  }
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} term page(s); ${skipped} skipped.`);
if (checkOnly && changed > 0) process.exit(1);
