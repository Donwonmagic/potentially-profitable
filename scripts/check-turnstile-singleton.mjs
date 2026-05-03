#!/usr/bin/env node
/**
 * Cohesion guard — every public HTML page must load Cloudflare
 * Turnstile AT MOST ONCE.
 *
 * Catches the regression class found during the launch sweep: 417
 * pages were loading Turnstile twice. _includes/footer.html had been
 * updated from an unconditional `<script src="…/turnstile/v0/api.js">`
 * to a localhost-gated loader (so dev/CI pages stop firing console
 * warnings), but sync-includes.mjs's old FOOTER_RE didn't capture
 * the trailing Turnstile block, so the original unconditional script
 * tag survived alongside the new gated one. Net effect: every dev/CI
 * page logged "Turnstile widget on localhost is not authorized";
 * Lighthouse-CI's errors-in-console audit failed; production loaded
 * Turnstile twice (extra ~28 KB request, double widget render risk).
 *
 * The fix lived in sync-includes.mjs (FOOTER_RE was extended to
 * capture trailing Turnstile-related comments + scripts, so future
 * partial-updates can dedup in one pass). This guard makes it a
 * fail-CI invariant.
 *
 * What this guard checks: count the occurrences of the literal
 *   challenges.cloudflare.com/turnstile
 * in each public HTML page. The count must be 0 (page has no
 * Turnstile reference) or 1 (single canonical load). 2+ is the
 * regression.
 *
 * Note: the gated loader script contains the URL inside a
 * `document.createElement('script').src = '…'` assignment, so it
 * counts as 1 occurrence per page (not 0). That's the canonical
 * shape and what the partial currently emits.
 *
 * Usage:
 *   node scripts/check-turnstile-singleton.mjs           # report + exit code
 *   node scripts/check-turnstile-singleton.mjs --check   # alias
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts',
]);

function listHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listHtml(full, out);
    else if (e.isFile() && e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const NEEDLE = 'challenges.cloudflare.com/turnstile';

const offenders = [];
let scanned = 0;

for (const file of listHtml(repoRoot)) {
  scanned++;
  const src = fs.readFileSync(file, 'utf8');
  // Cheap counter — no regex needed since we're matching a literal URL.
  let count = 0, idx = 0;
  while ((idx = src.indexOf(NEEDLE, idx)) !== -1) { count++; idx += NEEDLE.length; }
  if (count > 1) {
    offenders.push(`${path.relative(repoRoot, file)}: ${count} Turnstile references (expected 0 or 1)`);
  }
}

if (offenders.length) {
  console.error(`Turnstile singleton: ${offenders.length} page(s) with duplicate Turnstile references:\n`);
  for (const o of offenders.slice(0, 15)) console.error(`  ✗ ${o}`);
  if (offenders.length > 15) console.error(`  …and ${offenders.length - 15} more`);
  console.error(`\nFix: node scripts/sync-includes.mjs (FOOTER_RE captures Turnstile tail; running sync replaces it canonically).`);
  process.exit(1);
}

console.log(`Turnstile singleton: ${scanned} HTML page(s) scanned; all carry at most 1 Turnstile reference.`);
