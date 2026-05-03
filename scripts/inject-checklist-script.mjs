#!/usr/bin/env node
/**
 * JS-module-split (PR-B) — stamp /assets/js/checklist.js next to
 * /assets/site.js on the 2 pages that mount the interactive checklist
 * (.check-item[data-check-id]).
 *
 * The checklist + Phase-M6 popover code lives in /assets/js/checklist.js
 * since the JS module split. It used to ship inside site.js for every
 * one of the 494 pages on the site; now only the 2 checklist pages
 * (EN + ES) pay for it.
 *
 * Pattern — wraps the new <script> in sentinels right after site.js:
 *
 *   <script src="/assets/site.js?v=…" defer></script>
 *   <!-- checklist-script:start -->
 *   <script src="/assets/js/checklist.js?v=…" defer></script>
 *   <!-- checklist-script:end -->
 *
 * Idempotent. Pairs the checklist.js cache-bust with site.js's so a
 * single deploy invalidates them together (avoids the double-init
 * window where a stale cached site.js would still boot the now-removed
 * checklist code while the new checklist.js is also loading).
 *
 * Usage:
 *   node scripts/inject-checklist-script.mjs           # rewrite in place
 *   node scripts/inject-checklist-script.mjs --check   # exit 1 if any change
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const CACHE_BUST = '20260503-modsplit';

// Match either attribute order (src first or defer first), with or
// without a ?v= cache-bust. Mirrors inject-article-listen's regex.
const SITE_JS_RE  = /<script\s+(?:src="\/assets\/site\.js(?:\?v=[^"]+)?"\s+defer(?:="")?|defer(?:="")?\s+src="\/assets\/site\.js(?:\?v=[^"]+)?")\s*><\/script>/;
const SENTINEL_RE = /\n\s*<!-- checklist-script:start -->[\s\S]*?<!-- checklist-script:end -->/;

// Hand-curated list — only the 2 pages that render an interactive
// checklist. Could be auto-discovered with a grep for class="check-item",
// but a literal list is faster + obvious in code review.
const PAGES = [
  'learn/checklists/restaurant-website-checklist/index.html',
  'es/learn/checklists/restaurant-website-checklist/index.html',
];

// Canonical shape of the checklist sentinel + tag.
const canonicalSiteJs        = `<script src="/assets/site.js?v=${CACHE_BUST}" defer></script>`;
const canonicalChecklistTag  = `<script src="/assets/js/checklist.js?v=${CACHE_BUST}" defer></script>`;
const canonicalChecklistSentinel = `<!-- checklist-script:start -->\n  ${canonicalChecklistTag}\n  <!-- checklist-script:end -->`;

function transform(src) {
  if (!src.includes('class="check-item"')) return src;
  if (!SITE_JS_RE.test(src)) return src;

  // Idempotency: don't fight other module-split injectors for the
  // position right after site.js. If the canonical sentinel already
  // exists anywhere after the canonical site.js tag, leave it alone.
  if (src.includes(canonicalSiteJs) && src.includes(canonicalChecklistSentinel)) return src;

  let next = src.replace(SENTINEL_RE, '');
  next = next.replace(SITE_JS_RE, canonicalSiteJs);
  next = next.replace(canonicalSiteJs, `${canonicalSiteJs}\n  ${canonicalChecklistSentinel}`);

  return next;
}

let changed = 0;
const changedFiles = [];

for (const rel of PAGES) {
  const file = path.join(repoRoot, rel);
  if (!fs.existsSync(file)) {
    console.error(`inject-checklist-script: missing expected page: ${rel}`);
    process.exit(1);
  }
  const src = fs.readFileSync(file, 'utf8');
  const next = transform(src);
  if (next !== src) {
    changed++;
    changedFiles.push(rel);
    if (!checkOnly) fs.writeFileSync(file, next);
  }
}

if (checkOnly && changed > 0) {
  console.error(`inject-checklist-script: ${changed} file(s) would change:`);
  for (const f of changedFiles) console.error(`  ${f}`);
  process.exit(1);
}

console.log(`inject-checklist-script: ${changed} of ${PAGES.length} file(s) ${checkOnly ? 'would change' : 'updated'}.`);
