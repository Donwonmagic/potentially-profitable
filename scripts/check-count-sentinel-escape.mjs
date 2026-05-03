#!/usr/bin/env node
// Phase 1 (Launch refresh) — flag HTML-escaped count sentinels.
//
// inject-site-counts.mjs uses the regex
//   /<!-- count:KEY -->[^<]*<!-- \/count -->/g
// which matches LITERAL <!-- ... -->. If a sentinel ever lands as
// `&lt;!-- count:KEY --&gt;...` (HTML-entity-escaped, typically because
// it was placed inside a heading or other context where someone tried
// to "show the comment as text"), the injector silently misses it and
// the count freezes forever at whatever value was authored.
//
// This script catches that class of bug at build time.
//
// Modes:
//   node scripts/check-count-sentinel-escape.mjs         # report + exit 0
//   node scripts/check-count-sentinel-escape.mjs --check # exit 1 if any drift

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts', 'data',
]);

const ESCAPED_RE = /&lt;!--\s*count:[\w.]+\s*--&gt;/g;

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

let hits = 0;
const offenders = [];

for (const file of collectHtml(repoRoot)) {
  const src = fs.readFileSync(file, 'utf8');
  const matches = src.match(ESCAPED_RE);
  if (matches) {
    hits += matches.length;
    offenders.push({ file: path.relative(repoRoot, file), count: matches.length });
  }
}

if (offenders.length === 0) {
  console.log('Count-sentinel escape: clean.');
  process.exit(0);
}

console.log('Count-sentinel escape: ' + hits + ' escaped sentinel(s) across '
  + offenders.length + ' file(s). These will NEVER be injected.');
for (const o of offenders) console.log('  ' + o.file + ' (' + o.count + ')');
console.log('');
console.log('Fix: replace `&lt;!--` with `<!--` and `--&gt;` with `-->` so the');
console.log('comment is a real HTML comment, then run inject-site-counts.mjs.');

process.exit(checkMode ? 1 : 0);
