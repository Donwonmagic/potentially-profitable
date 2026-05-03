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

// Canonical shape of the listen-script sentinel block + tag. Used
// both for the existence check (idempotency) and for emission.
const canonicalSiteJs    = `<script src="/assets/site.js?v=${CACHE_BUST}" defer></script>`;
const canonicalListenTag = `<script src="/assets/js/listen.js?v=${CACHE_BUST}" defer></script>`;
const canonicalListenSentinel = `<!-- listen-script:start -->\n  ${canonicalListenTag}\n  <!-- listen-script:end -->`;

function transform(src) {
  if (!src.includes('id="listen-btn"')) return src;
  if (!SITE_JS_RE.test(src)) return src;

  // Idempotency: if the site.js tag already has the modsplit cache-bust
  // AND the canonical listen sentinel exists somewhere after it (any
  // position is fine — sibling sentinels from other injectors may sit
  // between them), return the file unchanged. This prevents the three
  // mod-split injectors (listen, checklist, glossary) from fighting
  // each other for the position right after site.js.
  if (src.includes(canonicalSiteJs) && src.includes(canonicalListenSentinel)) return src;

  // Otherwise, normalize: strip any stale listen sentinel, normalize
  // the site.js tag, then insert the canonical sentinel right after.
  let next = src.replace(SENTINEL_RE, '');
  next = next.replace(SITE_JS_RE, canonicalSiteJs);
  next = next.replace(canonicalSiteJs, `${canonicalSiteJs}\n  ${canonicalListenSentinel}`);

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
