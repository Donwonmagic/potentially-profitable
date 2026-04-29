#!/usr/bin/env node
/**
 * Sprint 18 / Bug B1.3 — guard against the [hidden] attribute
 * regression that broke the homepage's "Continue your work" button.
 *
 * The Bug. `.btn { display: inline-flex }` in author CSS overrode
 * the user-agent rule `[hidden] { display: none }` — equal
 * specificity, author CSS loaded later, so .btn won. Every element
 * with `class="btn ... hidden"` was visible regardless of the
 * `hidden` attribute, defeating the auth-state JS that revealed
 * "Continue your work" only to authenticated users.
 *
 * Fix (commit 9ac11356): a defensive global rule
 * `[hidden] { display: none !important }` near the top of
 * assets/site.css. Author rules can no longer override.
 *
 * This check ensures that rule stays present and isn't accidentally
 * removed by a future cleanup. Two layers:
 *
 *   1. assets/site.css MUST contain a `[hidden]` rule that sets
 *      `display: none !important` (the defensive global).
 *   2. As a soft warning, list HTML elements that combine `class="btn …"`
 *      with the `hidden` attribute — these specifically rely on the
 *      defensive rule. Useful for documentation; not a fail.
 *
 * Modes:
 *   node scripts/check-hidden-attribute.mjs         # report + exit 0
 *   node scripts/check-hidden-attribute.mjs --check # report + exit 1 if defensive rule missing
 *
 * Sprint 18: hard-fail in --check mode if the defensive rule is
 * missing. Soft-warn on `.btn ... hidden` usage (informational).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const cssPath = path.join(repoRoot, 'assets', 'site.css');
const css     = fs.readFileSync(cssPath, 'utf8');

// The defensive rule. Must contain `[hidden]` selector with
// `display: none` and `!important`. Whitespace-flexible.
const DEFENSIVE_RE = /\[hidden\][^{]*\{\s*display\s*:\s*none\s*!important\s*[;}]/i;

const defensivePresent = DEFENSIVE_RE.test(css);

// Soft check: HTML files that depend on the defensive rule.
const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts', 'data',
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

// Match any tag where the class attribute contains `btn` AND the
// element also has the `hidden` attribute. Either order on the tag.
const COLLISION_RE = /<\w+[^>]*class="[^"]*\bbtn\b[^"]*"[^>]*\bhidden\b/g;
const COLLISION_RE2 = /<\w+[^>]*\bhidden\b[^>]*class="[^"]*\bbtn\b[^"]*"/g;

const dependents = [];
for (const file of walk(repoRoot)) {
  const src = fs.readFileSync(file, 'utf8');
  COLLISION_RE.lastIndex = 0;
  COLLISION_RE2.lastIndex = 0;
  if (COLLISION_RE.test(src) || COLLISION_RE2.test(src)) {
    dependents.push(path.relative(repoRoot, file));
  }
}

if (defensivePresent) {
  console.log('Hidden attribute: defensive rule present.');
  if (dependents.length) {
    console.log(`  ${dependents.length} HTML file(s) rely on the rule (class="btn …" + hidden):`);
    for (const f of dependents.slice(0, 5)) console.log(`    ${f}`);
    if (dependents.length > 5) console.log(`    … and ${dependents.length - 5} more`);
  }
} else {
  console.log('Hidden attribute: ✗ defensive rule MISSING from assets/site.css.');
  console.log('  Expected: `[hidden] { display: none !important }` near the top.');
  console.log('  Without it, .btn { display: inline-flex } overrides [hidden]');
  console.log('  and elements like the homepage "Continue your work" button');
  console.log('  become visible to anonymous visitors, leading to a 404 click.');
  if (dependents.length) {
    console.log(`\n  Currently ${dependents.length} HTML file(s) rely on the rule:`);
    for (const f of dependents.slice(0, 5)) console.log(`    ${f}`);
  }
}

if (checkMode && !defensivePresent) {
  // Sprint 18: hard fail if the defensive rule is gone.
  process.exit(1);
}
