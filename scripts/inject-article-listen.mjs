#!/usr/bin/env node
/**
 * JS-module-split — stamp /assets/js/listen.js next to /assets/site.js
 * on every page that mounts an audio edition (id="listen-btn").
 *
 * The listen player code lives in /assets/js/listen.js since the JS
 * module split (May 2026). It used to ship inside site.js for every
 * one of the 494 pages on the site; now only the 38 that actually
 * render an audio edition pay for it.
 *
 * Pattern — wraps the new <script> in sentinels right after site.js:
 *
 *   <script src="/assets/site.js?v=…" defer></script>
 *   <!-- listen-script:start -->
 *   <script src="/assets/js/listen.js?v=…" defer></script>
 *   <!-- listen-script:end -->
 *
 * Idempotent. Pairs the listen.js cache-bust with site.js's so a
 * single deploy invalidates them together.
 *
 * Usage:
 *   node scripts/inject-article-listen.mjs           # rewrite in place
 *   node scripts/inject-article-listen.mjs --check   # exit 1 if any change
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const CACHE_BUST = '20260503-modsplit';

// Match either attribute order (src first or defer first), with or
// without a ?v= cache-bust. The 7 ES translated-slug posts ship the
// shorter form (<script defer="" src="/assets/site.js"></script>)
// since they bypass the sync-includes pass that stamps cache-busts.
const SITE_JS_RE = /<script\s+(?:src="\/assets\/site\.js(?:\?v=[^"]+)?"\s+defer(?:="")?|defer(?:="")?\s+src="\/assets\/site\.js(?:\?v=[^"]+)?")\s*><\/script>/;
const SENTINEL_RE  = /\n\s*<!-- listen-script:start -->[\s\S]*?<!-- listen-script:end -->/;

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

function transform(src) {
  if (!src.includes('id="listen-btn"')) return src;
  const m = src.match(SITE_JS_RE);
  if (!m) return src;

  // 1. Drop any existing sentinel block — we re-emit it canonically.
  let next = src.replace(SENTINEL_RE, '');

  // 2. Normalize the site.js tag to the canonical form + bump the
  //    cache-bust to the modsplit tag so the new site.js (without the
  //    listen-player code) lands at the same time as the new listen.js.
  //    Avoids a double-init window.
  const canonicalSiteJs = `<script src="/assets/site.js?v=${CACHE_BUST}" defer></script>`;
  next = next.replace(SITE_JS_RE, canonicalSiteJs);

  // 3. Insert the new sentinel block right after the site.js tag.
  const withListen = `${canonicalSiteJs}\n  <!-- listen-script:start -->\n  <script src="/assets/js/listen.js?v=${CACHE_BUST}" defer></script>\n  <!-- listen-script:end -->`;
  next = next.replace(canonicalSiteJs, withListen);

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
  console.error(`inject-article-listen: ${changed} file(s) would change:`);
  for (const f of changedFiles.slice(0, 10)) console.error(`  ${f}`);
  if (changedFiles.length > 10) console.error(`  …and ${changedFiles.length - 10} more`);
  process.exit(1);
}

console.log(`inject-article-listen: ${changed} of ${files.length} file(s) ${checkOnly ? 'would change' : 'updated'}.`);
