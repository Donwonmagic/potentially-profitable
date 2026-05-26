#!/usr/bin/env node
/**
 * Phase G.8 (Growth) — turn the bare "By Don" in every article's
 * post-meta into a link to /about/#don-goldstein.
 *
 * Sentinel-bracketed via the existing post-meta block. Idempotent:
 * already-linked bylines pass through unchanged.
 *
 *   node scripts/inject-article-author-chip.mjs           # rewrite
 *   node scripts/inject-article-author-chip.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const EN_BYLINE_RE = /By\s*<strong>Don<\/strong>/;
const ES_BYLINE_RE = /Por\s*<strong>Don<\/strong>/;

function articleFiles() {
  const out = [];
  for (const dir of ['blog', 'es/blog', 'library', 'es/library']) {
    const root = path.join(repoRoot, dir);
    if (!fs.existsSync(root)) continue;
    const locale = dir.startsWith('es') ? 'es' : 'en';
    for (const slug of fs.readdirSync(root)) {
      if (slug === 'drafts') continue;
      const file = path.join(root, slug, 'index.html');
      if (fs.existsSync(file)) out.push({ file, slug, locale });
    }
  }
  return out;
}

let changed = 0;
for (const { file, locale } of articleFiles()) {
  const src = fs.readFileSync(file, 'utf8');
  const aboutUrl = locale === 'es' ? '/es/about/#don-goldstein' : '/about/#don-goldstein';
  const re = locale === 'es' ? ES_BYLINE_RE : EN_BYLINE_RE;
  if (!re.test(src)) continue;
  const replacement = locale === 'es'
    ? `Por <a href="${aboutUrl}" class="author-chip"><strong>Don</strong></a>`
    : `By <a href="${aboutUrl}" class="author-chip"><strong>Don</strong></a>`;
  // Don't double-wrap if already linked.
  if (src.includes('class="author-chip"')) continue;
  const next = src.replace(re, replacement);
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  changed++;
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} article(s).`);
if (checkOnly && changed > 0) process.exit(1);
