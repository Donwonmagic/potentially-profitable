#!/usr/bin/env node
/**
 * JS-module-split (PR-C) — stamp /assets/js/glossary.js next to
 * /assets/site.js on every page that mounts a glossary affordance:
 *
 *   - a[data-glossary-blurb]  → inline popover on autolinked terms
 *                                (~27 article pages today; grows as
 *                                 new articles autolink known terms)
 *   - .term-explainer         → 90-second narrated diagram
 *                                (anticipatory; 0 pages today, 5
 *                                 flagship glossary pages in flight)
 *
 * The glossary popover + explainer player code lives in
 * /assets/js/glossary.js since the JS module split (May 2026). It used
 * to ship inside site.js for every one of the 494 pages on the site;
 * now only the ~27 pages that actually mount a glossary affordance
 * pay for it.
 *
 * Pattern — wraps the new <script> in sentinels right after site.js:
 *
 *   <script src="/assets/site.js?v=…" defer></script>
 *   <!-- glossary-script:start -->
 *   <script src="/assets/js/glossary.js?v=…" defer></script>
 *   <!-- glossary-script:end -->
 *
 * Idempotent. Pairs the glossary.js cache-bust with site.js's so a
 * single deploy invalidates them together.
 *
 * Usage:
 *   node scripts/inject-glossary-script.mjs           # rewrite in place
 *   node scripts/inject-glossary-script.mjs --check   # exit 1 if any change
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const CACHE_BUST = '20260503-modsplit';

const SITE_JS_RE  = /<script\s+(?:src="\/assets\/site\.js(?:\?v=[^"]+)?"\s+defer(?:="")?|defer(?:="")?\s+src="\/assets\/site\.js(?:\?v=[^"]+)?")\s*><\/script>/;
const SENTINEL_RE = /\n\s*<!-- glossary-script:start -->[\s\S]*?<!-- glossary-script:end -->/;

function listHtmlFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listHtmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function needsGlossary(src) {
  return src.includes('data-glossary-blurb') || /class="term-explainer(\s|"|\b)/.test(src);
}

// Canonical shape of the glossary sentinel + tag.
const canonicalSiteJs       = `<script src="/assets/site.js?v=${CACHE_BUST}" defer></script>`;
const canonicalGlossaryTag  = `<script src="/assets/js/glossary.js?v=${CACHE_BUST}" defer></script>`;
const canonicalGlossarySentinel = `<!-- glossary-script:start -->\n  ${canonicalGlossaryTag}\n  <!-- glossary-script:end -->`;

function transform(src) {
  if (!needsGlossary(src)) return src;
  if (!SITE_JS_RE.test(src)) return src;

  // Idempotency: don't fight sibling module-split injectors for the
  // position right after site.js. If the canonical sentinel already
  // exists anywhere after the canonical site.js tag, leave it alone.
  if (src.includes(canonicalSiteJs) && src.includes(canonicalGlossarySentinel)) return src;

  let next = src.replace(SENTINEL_RE, '');
  next = next.replace(SITE_JS_RE, canonicalSiteJs);
  next = next.replace(canonicalSiteJs, `${canonicalSiteJs}\n  ${canonicalGlossarySentinel}`);

  return next;
}

const files = listHtmlFiles(repoRoot);
let changed = 0;
const changedFiles = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const next = transform(src);
  if (next !== src) {
    changed++;
    changedFiles.push(path.relative(repoRoot, file));
    if (!checkOnly) fs.writeFileSync(file, next);
  }
}

if (checkOnly && changed > 0) {
  console.error(`inject-glossary-script: ${changed} file(s) would change:`);
  for (const f of changedFiles.slice(0, 10)) console.error(`  ${f}`);
  if (changedFiles.length > 10) console.error(`  …and ${changedFiles.length - 10} more`);
  process.exit(1);
}

console.log(`inject-glossary-script: ${changed} of ${files.length} file(s) ${checkOnly ? 'would change' : 'updated'}.`);
