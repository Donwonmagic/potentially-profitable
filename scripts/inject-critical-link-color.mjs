#!/usr/bin/env node
/**
 * Phase 4 perf — kill the blue link-color flash.
 *
 * Inline critical CSS in every HTML page covers tokens, body baseline,
 * .container, .skip-link, and nav min-height — but NOT link color.
 * Without an `a{color:inherit}` rule, every <a> tag in the unstyled
 * pre-shell render uses the browser default link color (#0000EE blue).
 * Inline SVGs that use `stroke="currentColor"` inherit that blue,
 * producing a visible blue-icon flash before site-core.css applies.
 *
 * Most visible: the envelope SVG inside the "Email Don" CTA in the nav
 * (mobile + desktop). Reported May 2026 as "blue icons flash on screen."
 *
 * This script appends `a{color:inherit}` to the critical-CSS block on
 * every HTML page that has one. Idempotent — re-runs are no-ops.
 *
 * Run after page generators emit new pages and before
 * inject-css-cache-bust.
 *
 *   node scripts/inject-critical-link-color.mjs
 *   node scripts/inject-critical-link-color.mjs --check   # exit 1 if any page would change
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SKIP_DIRS = new Set([
  '.git', 'node_modules', '.wrangler', 'dist', 'docs',
]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && full.endsWith('.html')) out.push(full);
  }
  return out;
}

// Sentinel rule. Inserted right before the critical-CSS </style> tag.
// `header.nav{min-height:64px}` is the last rule in the canonical
// critical-CSS block; we splice in before it so search regexes that
// key off that line still work.
const RULE = 'a{color:inherit}';

let touched = 0, scanned = 0;
const files = walk(REPO);

for (const f of files) {
  scanned++;
  let html = fs.readFileSync(f, 'utf8');

  // Only operate on pages that already carry the critical-CSS block.
  if (!html.includes('Critical CSS — prevents flash')) continue;

  // Already injected? skip.
  if (html.includes(RULE)) continue;

  // Insert before `header.nav{min-height:64px}` to keep the rule order
  // stable (token decl → element resets → body → utilities → nav reservation).
  const before = 'header.nav{min-height:64px}';
  if (!html.includes(before)) continue;
  const next = html.replace(before, RULE + '\n' + before);

  if (next !== html) {
    if (!checkOnly) fs.writeFileSync(f, next);
    touched++;
  }
}

console.log(
  `${checkOnly ? 'would touch' : 'touched'} ${touched} of ${scanned} HTML file(s) ` +
  `(adding ${RULE} to critical CSS)`
);
if (checkOnly && touched > 0) process.exit(1);
process.exit(0);
