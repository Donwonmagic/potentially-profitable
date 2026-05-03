#!/usr/bin/env node
/**
 * Phase 3B (cohesion) — breadcrumb separator canon.
 *
 * Three different encodings for the › separator coexisted in the
 * source until Phase 3B normalised them: literal `›`, the named
 * entity `&rsaquo;`, and the numeric entity `&#8250;`. Visually
 * identical when rendered, but a source-code smell that catches
 * reviewers off-guard.
 *
 * Canon: literal `›` inside any element with class="breadcrumb-sep"
 * (the dedicated separator span used across .breadcrumb components).
 * Bare `<li aria-hidden="true">›</li>` patterns also count.
 *
 *   node scripts/check-breadcrumb-separator.mjs           # report + exit 0
 *   node scripts/check-breadcrumb-separator.mjs --check   # exit 1 on drift
 */

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

// Two patterns that should NEVER appear inside a breadcrumb-sep:
//   class="breadcrumb-sep" ... > &rsaquo; <
//   class="breadcrumb-sep" ... > &#8250; <
// Plus the bare li-aria-hidden separator pattern.
const PATTERNS = [
  {
    name: '&rsaquo; in breadcrumb-sep',
    re: /class="breadcrumb-sep"[^>]*>\s*&rsaquo;\s*</g,
  },
  {
    name: '&#8250; in breadcrumb-sep',
    re: /class="breadcrumb-sep"[^>]*>\s*&#8250;\s*</g,
  },
  {
    name: '&rsaquo; in li[aria-hidden]',
    re: /<li[^>]*aria-hidden="true"[^>]*>\s*&rsaquo;\s*<\/li>/g,
  },
  {
    name: '&#8250; in li[aria-hidden]',
    re: /<li[^>]*aria-hidden="true"[^>]*>\s*&#8250;\s*<\/li>/g,
  },
];

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && e.name.endsWith('.html')) yield p;
  }
}

const offenders = [];
let scanned = 0;

for (const file of walk(repoRoot)) {
  scanned++;
  let src;
  try { src = fs.readFileSync(file, 'utf8'); } catch { continue; }
  for (const { name, re } of PATTERNS) {
    const matches = src.match(re);
    if (matches) {
      offenders.push({ file: path.relative(repoRoot, file), pattern: name, count: matches.length });
    }
  }
}

if (offenders.length === 0) {
  console.log(`Breadcrumb separator: clean. (${scanned} pages scanned.)`);
  process.exit(0);
}

console.log(`Breadcrumb separator: ${offenders.length} drift hit(s) across ${new Set(offenders.map((o) => o.file)).size} file(s):\n`);
for (const o of offenders.slice(0, 20)) {
  console.log(`  ${o.file}  ${o.pattern} (${o.count}×)`);
}
if (offenders.length > 20) console.log(`  … and ${offenders.length - 20} more.`);
console.log(`\nFix: replace &rsaquo; / &#8250; with the literal › character\ninside breadcrumb-sep elements. The literal renders identically and\nkeeps source greppable.`);

if (checkMode) process.exit(1);
process.exit(0);
