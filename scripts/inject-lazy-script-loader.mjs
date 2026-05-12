#!/usr/bin/env node
/**
 * Phase 3D-perf — lazy-load p.js and site.js on every HTML page.
 *
 * Symptom this fixes: "page renders fully and scrolls fine, but I
 * cannot select anything for several seconds." That's main-thread
 * JavaScript execution blocking input event handling. With p.js
 * (~6KB), the 4 footer scripts (~26KB), and site.js (~56KB) all
 * declared as `defer` and executing serially after HTML parse, the
 * browser holds the main thread for 2-4 seconds on mid-range mobile
 * CPUs before any user input (text selection, taps, keyboard) can
 * fire.
 *
 * The fix: drop the script tags' `defer` attribute and instead
 * schedule download + execution via requestIdleCallback after the
 * `load` event. The browser paints, fires `load`, then on next idle
 * starts loading the JS — so users see an interactive page within
 * ~100-300ms instead of having to wait through ~88KB of parse+exec.
 *
 * What this script rewrites:
 *
 *   <script src="/assets/p.js?v=…" defer></script>
 *   <script src="/assets/site.js?v=…" defer></script>
 *
 * Both become inline `<script>` blocks that schedule a dynamically-
 * inserted `<script src="…" async>` on `load` + idle. The inline
 * Plausible queue/init block (the one declaring
 * `window.plausible = window.plausible || …` and calling
 * `plausible.init({…})`) is left untouched so calls to
 * `plausible(...)` queue correctly until p.js eventually arrives.
 *
 * Idempotent: sentinel markers `<!-- lazy-load:p -->` and
 * `<!-- lazy-load:site -->` gate the rewrite. Re-runs find the
 * sentinels and either no-op (canonical state present) or refresh
 * the cache-bust hash inside the inline loader.
 *
 * Cascade with inject-css-cache-bust.mjs: that script rewrites the
 * `?v=…` query string inside <link href> tags. We use the SAME
 * rule for the JS URLs inside our inline loader — the version
 * string is preserved exactly as found in the existing tag, so any
 * future cache-bust injector that targets JS files will continue
 * to work.
 *
 *   node scripts/inject-lazy-script-loader.mjs           # rewrite in place
 *   node scripts/inject-lazy-script-loader.mjs --check   # exit 1 on drift
 *
 * Run AFTER inject-css-cache-bust.mjs and BEFORE check-all.mjs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SKIP_DIRS = new Set([
  '.git', 'node_modules', '.wrangler', 'dist', 'docs', '_includes',
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

// Match the existing canonical tags. The src may carry any ?v=… query
// string (set by manual versioning or a future cache-bust injector).
const P_TAG_RE     = /<script\s+src="(\/assets\/p\.js(?:\?v=[^"]*)?)"\s+defer><\/script>/;
const SITE_TAG_RE  = /<script\s+src="(\/assets\/site\.js(?:\?v=[^"]*)?)"\s+defer><\/script>/;

// Re-match the previously-injected loader so re-runs replace it in
// place rather than appending. The sentinel comment is the gate.
const P_LOADER_RE    = /<!-- lazy-load:p -->[\s\S]*?<!-- \/lazy-load:p -->/;
const SITE_LOADER_RE = /<!-- lazy-load:site -->[\s\S]*?<!-- \/lazy-load:site -->/;

function pLoader(href) {
  return (
    '<!-- lazy-load:p -->' +
    '<script>' +
      '(window.requestIdleCallback||function(c){return setTimeout(c,500);})(function(){' +
        'var s=document.createElement("script");' +
        's.src=' + JSON.stringify(href) + ';' +
        's.async=true;' +
        'document.head.appendChild(s);' +
      '});' +
    '</script>' +
    '<!-- /lazy-load:p -->'
  );
}

function siteLoader(href) {
  return (
    '<!-- lazy-load:site -->' +
    '<script>' +
      '(window.requestIdleCallback||function(c){return setTimeout(c,200);})(function(){' +
        'var s=document.createElement("script");' +
        's.src=' + JSON.stringify(href) + ';' +
        's.async=true;' +
        'document.head.appendChild(s);' +
      '});' +
    '</script>' +
    '<!-- /lazy-load:site -->'
  );
}

let touched = 0;
let scanned = 0;

for (const f of walk(REPO)) {
  scanned++;
  const src = fs.readFileSync(f, 'utf8');
  let next = src;

  // Discover the canonical href for p.js. First check for an existing
  // canonical <script> tag (first run), then check for a previously-
  // injected loader (re-run / refresh).
  const pTagMatch = next.match(P_TAG_RE);
  if (pTagMatch) {
    next = next.replace(P_TAG_RE, pLoader(pTagMatch[1]));
  } else {
    const existing = next.match(P_LOADER_RE);
    if (existing) {
      // Refresh: re-derive href from the inline JSON.stringify literal.
      const m = existing[0].match(/"(\/assets\/p\.js(?:\?v=[^"]*)?)"/);
      if (m) {
        const canonical = pLoader(m[1]);
        if (existing[0] !== canonical) next = next.replace(P_LOADER_RE, canonical);
      }
    }
  }

  // Same dance for site.js.
  const siteTagMatch = next.match(SITE_TAG_RE);
  if (siteTagMatch) {
    next = next.replace(SITE_TAG_RE, siteLoader(siteTagMatch[1]));
  } else {
    const existing = next.match(SITE_LOADER_RE);
    if (existing) {
      const m = existing[0].match(/"(\/assets\/site\.js(?:\?v=[^"]*)?)"/);
      if (m) {
        const canonical = siteLoader(m[1]);
        if (existing[0] !== canonical) next = next.replace(SITE_LOADER_RE, canonical);
      }
    }
  }

  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(f, next);
  touched++;
}

console.log(`inject-lazy-script-loader: ${checkOnly ? 'would touch' : 'touched'} ${touched} of ${scanned} HTML file(s).`);
if (checkOnly && touched > 0) process.exit(1);
process.exit(0);
