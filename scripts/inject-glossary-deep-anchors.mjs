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
    // Carve out the companion-kit block: inject-companion-kit.mjs owns
    // every href inside it and rewrites them on each run from its data
    // source (which emits bare /tools/<slug>/ URLs). Mutating tool hrefs
    // inside the block would just bounce back on the next companion-kit
    // run, breaking idempotence for both gates.
    const ckStart = src.indexOf('<!-- companion-kit:start -->');
    const ckEnd   = src.indexOf('<!-- /companion-kit:end -->');
    const head    = ckStart >= 0 ? src.slice(0, ckStart) : src;
    const block   = ckStart >= 0 && ckEnd > ckStart ? src.slice(ckStart, ckEnd + '<!-- /companion-kit:end -->'.length) : '';
    const tail    = ckEnd  >  ckStart ? src.slice(ckEnd + '<!-- /companion-kit:end -->'.length) : '';
    function rewrite(chunk) {
      let out = chunk;
      for (const [toolSlug, anchor] of Object.entries(pairings)) {
        const pathPrefix = locale === 'es' ? `/es/tools/${toolSlug}/` : `/tools/${toolSlug}/`;
        const re = new RegExp(`href="${pathPrefix.replace(/\//g, '\\/')}"`, 'g');
        out = out.replace(re, `href="${pathPrefix}#${anchor}"`);
      }
      return out;
    }
    const next = ckStart >= 0
      ? rewrite(head) + block + rewrite(tail)
      : rewrite(src);
    if (next === src) continue;
    if (!checkOnly) fs.writeFileSync(file, next);
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
    changed++;
  }
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} term page(s); ${skipped} skipped (no anchor pairings).`);
if (checkOnly && changed > 0) process.exit(1);
