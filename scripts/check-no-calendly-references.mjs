#!/usr/bin/env node
/**
 * Phase W.6 (The Window) — fail CI if any Calendly reference reaches
 * the production tree.
 *
 * After Phase W.5's sweep, every "Book a 20-min call" CTA was
 * replaced with /window/ links. This check prevents accidental
 * re-introduction (a future contributor pasting a Calendly URL,
 * a stale tool template still pointing at calendly.com, etc.).
 *
 * Scans every .html / .js / .mjs / .json file under the repo
 * (excluding node_modules, .git, dist, .wrangler, _includes/
 * changelog if any, and this plan file). Looks for two markers:
 *
 *   1. Any string containing "calendly.com"
 *   2. Any string containing "js-book" (the deprecated CSS class)
 *
 * Exits 0 when both are zero across the tree; 1 otherwise, with
 * file:line pointers for every offending hit.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

// Skip dirs that are out of band, generated, or contain
// historical references on purpose.
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs',
]);

// Skip individual files whose Calendly references are intentional —
// either historical / changelog content, or the script itself (which
// contains the needles it's searching for).
const ALLOWED_FILES = new Set([
  'scripts/check-no-calendly-references.mjs',
  'scripts/test-email-templates.mjs',
]);

// Patterns to forbid.
const FORBIDDEN = [
  { needle: 'calendly.com',  label: 'Calendly URL' },
  { needle: 'js-book',       label: 'deprecated js-book class' },
];

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile()) {
      const ext = path.extname(e.name);
      if (['.html', '.js', '.mjs', '.json', '.css'].includes(ext)) {
        yield p;
      }
    }
  }
}

const failures = [];
let scanned = 0;

for (const file of walk(repoRoot)) {
  const rel = path.relative(repoRoot, file);
  if (ALLOWED_FILES.has(rel)) continue;
  scanned++;
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split(/\r?\n/);
  for (const { needle, label } of FORBIDDEN) {
    if (!src.includes(needle)) continue;
    for (let i = 0; i < lines.length; i++) {
      const idx = lines[i].indexOf(needle);
      if (idx < 0) continue;
      failures.push(`${rel}:${i + 1}  ${label} — ${lines[i].trim().slice(0, 100)}`);
    }
  }
}

if (failures.length) {
  console.error(`No-Calendly-references: ${failures.length} hit(s) in ${scanned} file(s):`);
  for (const f of failures) console.error('  ✗ ' + f);
  console.error('\nIf the reference is intentional historical content, add the file to');
  console.error('ALLOWED_FILES in scripts/check-no-calendly-references.mjs.');
  process.exit(1);
}
console.log(`No-Calendly-references: clean across ${scanned} file(s).`);
