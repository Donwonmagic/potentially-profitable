#!/usr/bin/env node
/**
 * --stone-2 text-color guard (REPORT MODE — see status below).
 *
 * Why this exists
 * ---------------
 * `--stone-2` (spine slate-400, #9AA0AB) is documented decoration-only:
 * it carries AA as a large/UI tint and as a non-text channel (borders,
 * fills, strokes, placeholder hints), but it FAILS AAA as body text on
 * the cream surface. Using it as `color:` for real running text is a
 * legibility regression. This guard flags exactly that pattern —
 * `color: var(--stone-2)` — while allowing every non-text channel
 * (background-color / border / outline / fill / stroke), which are
 * legitimate decoration uses.
 *
 * STATUS: REPORT MODE (exit 0 always). The current tree already has
 * many `color: var(--stone-2)` declarations — most are deliberately
 * low-emphasis chrome (input placeholders, breadcrumb separators, mono
 * token labels, ·-separator pseudo-content, source-note micro-labels).
 * Per the Tier-1 hardening rule, a guard that cannot pass clean on the
 * current tree must NOT be promoted to fail-CI or wired into
 * check-all.mjs. It runs as an informational report so the backlog is
 * visible; flip REPORT_ONLY=false (and wire it into check-all) only
 * once those call sites are migrated to --stone or a placeholder-
 * specific token.
 *
 * Run: node scripts/check-stone-2-usage.mjs
 * Always exits 0 while REPORT_ONLY is true.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const ASSETS = path.join(REPO, 'assets');

// While true, the guard reports findings but exits 0. Flip to false to
// make it fail-CI once the existing text uses are migrated.
const REPORT_ONLY = true;

// `color:` (the text channel) set to var(--stone-2). Tolerates
// whitespace. Deliberately does NOT match background-color, border-*,
// outline-*, fill, stroke, caret-color, etc. — those are allowed
// decoration channels for this tone.
const TEXT_STONE2 = /(?<![-\w])color\s*:\s*var\(\s*--stone-2\s*\)/g;

function cssFiles() {
  return fs.readdirSync(ASSETS)
    .filter((f) => f.endsWith('.css'))
    .map((f) => path.join(ASSETS, f));
}

const hits = [];
for (const file of cssFiles()) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    TEXT_STONE2.lastIndex = 0;
    if (TEXT_STONE2.test(lines[i])) {
      hits.push(`${path.relative(REPO, file)}:${i + 1}  ${lines[i].trim().slice(0, 100)}`);
    }
  }
}

if (hits.length) {
  const verb = REPORT_ONLY ? 'REPORT (non-blocking)' : 'FAIL';
  console.error(`--stone-2 as text color: ${hits.length} occurrence(s) [${verb}]`);
  for (const h of hits) console.error('  • ' + h);
  console.error('\n--stone-2 fails AAA as body text on cream. Use --stone for low-emphasis');
  console.error('text, or a placeholder-specific token for input hints. Allowed channels');
  console.error('(background-color / border / outline / fill / stroke) are NOT flagged.');
  if (!REPORT_ONLY) process.exit(1);
  process.exit(0);
}

console.log('--stone-2 text-color guard: clean (no `color: var(--stone-2)` found).');
