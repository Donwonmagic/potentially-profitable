#!/usr/bin/env node
// Replace <!-- count:KEY -->...<!-- /count --> sentinels with values
// from data/site-counts.json across every .html file in the repo.
//
// Sentinel format:
//   <!-- count:tools.live -->9<!-- /count -->
//
// KEY is a dotted path into data/site-counts.json. Values are coerced to
// strings. Unknown keys fail the build loudly so a typo can't ship as a
// blank.
//
//   node scripts/inject-site-counts.mjs           # rewrites in place
//   node scripts/inject-site-counts.mjs --check   # exits non-zero if anything would change
//
// This script runs after scripts/sync-includes.mjs so that the nav/footer
// partials have already been stamped onto every page; it then fills the
// counts inside those (and any page-owned) sentinels.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts', 'data',
]);

const counts = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'site-counts.json'), 'utf8'));

function lookup(key) {
  const parts = key.split('.');
  let cur = counts;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object' || !(p in cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

const SENTINEL = /<!-- count:([\w.]+) -->[^<]*<!-- \/count -->/g;

function collectHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectHtml(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

let changed = 0;
let touched = 0;
const unknownKeys = new Set();

for (const file of collectHtml(REPO)) {
  const src = fs.readFileSync(file, 'utf8');
  if (!SENTINEL.test(src)) continue;
  SENTINEL.lastIndex = 0;
  touched++;

  const next = src.replace(SENTINEL, (match, key) => {
    const val = lookup(key);
    if (val === undefined) { unknownKeys.add(key); return match; }
    return `<!-- count:${key} -->${val}<!-- /count -->`;
  });

  if (next !== src) {
    if (!checkOnly) fs.writeFileSync(file, next);
    changed++;
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(REPO, file)}`);
  }
}

if (unknownKeys.size) {
  console.error('\nunknown count keys (add them to data/site-counts.json):');
  for (const k of unknownKeys) console.error('  ' + k);
  process.exit(2);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of ${touched} files containing count sentinels.`);

if (checkOnly && changed > 0) process.exit(1);
