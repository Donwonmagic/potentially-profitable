#!/usr/bin/env node
/**
 * Wave G4 (Glossary growth) — overwrite the <title> and meta description
 * on glossary term pages with SERP-optimized, query-shaped copy.
 *
 * The stock titles ("Term — Muntin Digital glossary") and metas (the raw
 * definition dump) waste the highest-CTR real estate in the SERP. This
 * injector replaces them with:
 *   <title>   What Is [Term]? | Muntin Digital   (captures the actual query)
 *   <meta>    the term's own first FAQ answer, trimmed to ~155 chars
 *             (benefit-rich, fact-checked prose — never new claims)
 *
 * Source of truth: data/glossary-seo.json (hand-tunable per term).
 *
 * NOTE: build-library.mjs also writes a stock title for glossary pages,
 * so this injector must run AFTER any build-library pass. It is gated in
 * check-all (idempotence) so drift is caught. Title/meta are NOT
 * sentinel-wrapped in the page, so this matches the exact stock strings
 * to replace them; once replaced it matches its own output (idempotent).
 *
 *   node scripts/inject-glossary-seo.mjs           # rewrite
 *   node scripts/inject-glossary-seo.mjs --check    # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const dataPath = path.join(repoRoot, 'data/glossary-seo.json');
if (!fs.existsSync(dataPath)) { console.log('glossary-seo data missing — skipping'); process.exit(0); }
const seo = (JSON.parse(fs.readFileSync(dataPath, 'utf8')).seo) || {};

function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escTitle(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const TITLE_RE = /<title>[\s\S]*?<\/title>/;
const DESC_RE  = /<meta name="description" content="[\s\S]*?"\s*\/?>/;

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

let changed = 0, skipped = 0;
const diffs = [];
for (const [locale, dir] of [['en', 'glossary'], ['es', 'es/glossary']]) {
  for (const { slug, file } of findTerms(path.join(repoRoot, dir))) {
    const entry = seo[slug] && seo[slug][locale];
    if (!entry || !entry.title || !entry.desc) { skipped++; continue; }
    const src = fs.readFileSync(file, 'utf8');
    let next = src;
    next = next.replace(TITLE_RE, `<title>${escTitle(entry.title)}</title>`);
    next = next.replace(DESC_RE, `<meta name="description" content="${escAttr(entry.desc)}" />`);
    if (next !== src) {
      diffs.push(path.relative(repoRoot, file));
      if (!checkOnly) fs.writeFileSync(file, next);
      changed++;
    }
  }
}

if (checkOnly && changed) {
  console.error(`glossary-seo: would update ${changed} file(s).`);
  for (const d of diffs.slice(0, 8)) console.error('  · ' + d);
  if (diffs.length > 8) console.error(`  … and ${diffs.length - 8} more`);
  process.exit(1);
}
console.log(`glossary-seo: ${changed} file(s) updated, ${skipped} skipped.`);
