#!/usr/bin/env node
/**
 * Phase 3B (cohesion) — footer-payload canon.
 *
 * Catches the class of regression Phase 1 cleaned up on 23 tool
 * pages: stale foot-tagline ("Structure Brings Clarity.") and the
 * old DMV-studio blurb ("A one-person studio in Silver Spring,
 * MD, building custom websites…") replacing the canonical "The
 * window in." / library blurb.
 *
 * The check is intentionally narrow — it only flags PHRASES that
 * are documented as retired, not the broader question of whether
 * the rendered footer matches the include byte-for-byte. Tool
 * utility pages legitimately ship a slimmer footer than the main
 * include; matching those would require a per-page allowlist
 * larger than this script. The retired-phrase list catches the
 * actual user-visible drift class.
 *
 *   node scripts/check-footer-payload.mjs           # report + exit 0
 *   node scripts/check-footer-payload.mjs --check   # exit 1 on drift
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

// Each entry: [retired phrase, replacement, scope hint].
// Scope hint is a regex that requires the offending phrase to be
// inside a footer-shaped block. Most retired phrases are also fine
// in body prose (e.g. /changelog/ talking about the old tagline);
// the scope keeps the check from flagging legitimate references.
const RETIRED = [
  {
    phrase: 'Structure Brings Clarity.',
    replace: '"The window in." (EN) or "La ventana." (ES)',
    scope: /<p[^>]*class="foot-tagline"[^>]*>\s*Structure Brings Clarity\./i,
  },
  {
    phrase: 'A one-person studio in Silver Spring, MD, building custom websites',
    replace: 'the canonical library blurb from _includes/footer.html',
    scope: /<p[^>]*class="foot-blurb"[^>]*>[^<]*A one-person studio in Silver Spring/i,
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
  for (const { phrase, replace, scope } of RETIRED) {
    if (!src.includes(phrase)) continue;
    if (scope && !scope.test(src)) continue;
    offenders.push({ file: path.relative(repoRoot, file), phrase, replace });
  }
}

if (offenders.length === 0) {
  console.log(`Footer payload: clean. (${scanned} pages scanned.)`);
  process.exit(0);
}

console.log(`Footer payload: ${offenders.length} retired phrase(s) in footer position:\n`);
const grouped = new Map();
for (const o of offenders) {
  if (!grouped.has(o.phrase)) grouped.set(o.phrase, { count: 0, replace: o.replace, files: [] });
  const g = grouped.get(o.phrase);
  g.count++;
  if (g.files.length < 5) g.files.push(o.file);
}
for (const [phrase, info] of grouped) {
  console.log(`  ✗ "${phrase}" (${info.count}×) → use ${info.replace}`);
  for (const f of info.files) console.log(`      ${f}`);
  if (info.count > info.files.length) console.log(`      … and ${info.count - info.files.length} more`);
}
console.log(`\nFix: re-stamp the footer block with the canonical content. For\ntool-utility pages the recipe lives at _includes/footer.html; for\npages using sync-includes, just re-run scripts/sync-includes.mjs.`);

if (checkMode) process.exit(1);
process.exit(0);
