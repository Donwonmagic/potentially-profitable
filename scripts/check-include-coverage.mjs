#!/usr/bin/env node
/**
 * Cohesion guard — no public HTML page may ship with bare include
 * sentinels that sync-includes.mjs failed to fill.
 *
 * Catches the regression class found during the launch sweep: 9 pages
 * shipped with literal `<!-- nav:start --><!-- nav:end -->` and
 * `<!-- footer:start --><!-- footer:end -->` markers and NO content
 * between them. They were generated from a fresh template and never
 * received their first sync. sync-includes.mjs is anchored on
 * `<header class="nav" id="nav">…</header>` (and on `<footer>…
 * <div class="foot-grid">…</footer>`), so it silently skipped them —
 * the pages reached production with no nav menu, footer, legal links,
 * language switcher, or newsletter form.
 *
 * Why bare-sentinel only (not "every page must have the canonical
 * nav/footer"): the site has a number of legitimate non-canonical
 * page shells — sign-in / account / window / workbench / studio
 * positioning pages — that intentionally diverge from the main-funnel
 * footer. Tightening the rule to require foot-grid would create a
 * false-positive avalanche on ~30 pages that are correct as-shipped.
 * The bare-sentinel form, on the other hand, never has a legitimate
 * use in deployed HTML.
 *
 * Companion fixer: scripts/fix-bare-include-sentinels.mjs renders
 * the canonical nav + footer into pages that currently carry the
 * bare sentinels.
 *
 * Usage:
 *   node scripts/check-include-coverage.mjs           # report + exit code
 *   node scripts/check-include-coverage.mjs --check   # alias (same behaviour)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const NAV_SENTINEL_BARE_RE  = /<!-- nav:start -->\s*<!-- nav:end -->/;
const FOOT_SENTINEL_BARE_RE = /<!-- footer:start -->\s*<!-- footer:end -->/;

function listHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist'
        || e.name === '_includes' || e.name === 'src' || e.name === 'scripts'
        || e.name === 'assets' || e.name === 'docs' || e.name === 'brand'
        || e.name === '.wrangler') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listHtml(full, out);
    else if (e.isFile() && e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const issues = [];
let scanned = 0;

for (const file of listHtml(repoRoot)) {
  const rel = path.relative(repoRoot, file).split(path.sep).join('/');
  scanned++;
  const src = fs.readFileSync(file, 'utf8');

  if (NAV_SENTINEL_BARE_RE.test(src)) {
    issues.push(`${rel}: bare nav sentinel (\`<!-- nav:start --><!-- nav:end -->\`) — sync-includes never stamped this page.`);
  }
  if (FOOT_SENTINEL_BARE_RE.test(src)) {
    issues.push(`${rel}: bare footer sentinel (\`<!-- footer:start --><!-- footer:end -->\`) — sync-includes never stamped this page.`);
  }
}

if (issues.length) {
  console.error(`Include coverage: ${issues.length} bare-sentinel issue(s) across ${scanned} file(s):\n`);
  for (const i of issues) console.error(`  ${i}`);
  console.error(`\nFix: node scripts/fix-bare-include-sentinels.mjs`);
  process.exit(1);
}

console.log(`Include coverage: ${scanned} HTML page(s) scanned; no bare include sentinels.`);
