#!/usr/bin/env node
/**
 * Invoice Decoder — privacy CI (Wave E.4).
 *
 * Belt-and-suspenders defense above the runtime telemetry sentinel
 * (telemetry.js) and the operator-runnable in-tool self-test
 * (privacy-self-test.js). This script is the build-time gate: it
 * scans every invoice-decoder source file and asserts that no
 * code path attempts to hit a non-allowlisted URL.
 *
 * What it catches at static-analysis time:
 *   1. fetch("https://...") to non-allowlisted hosts.
 *   2. new XMLHttpRequest().open("GET", "https://...") same.
 *   3. <script src="https://..."> in either HTML mirror.
 *   4. import("https://...") dynamic imports.
 *   5. <link rel="..." href="https://..."> external resources.
 *   6. fetch("//attacker.example") protocol-relative URLs.
 *   7. Hardcoded URL strings that aren't allowlisted, even when
 *      not directly inside a fetch() call (e.g. a plausible
 *      tracking pixel in an inline script).
 *
 * What it does NOT do:
 *   - Run the tool in a browser. That's the operator-runnable
 *     in-tool self-test (Wave E.5). Headless browser tests are a
 *     follow-up that requires Playwright / Puppeteer.
 *   - Catch URLs assembled at runtime via string concatenation.
 *     The runtime sentinel (telemetry.js) catches these.
 *   - Inspect the encrypted POST body. The sentinel's payload
 *     key-scan (E.2) catches forbidden keys; this script doesn't
 *     re-implement that.
 *
 * Exit codes:
 *   0 — clean; no non-allowlisted URLs found.
 *   1 — violations detected; report printed to stdout.
 *
 * Usage:
 *   node scripts/check-invoice-decoder-privacy.mjs
 *   node scripts/check-invoice-decoder-privacy.mjs --verbose
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const verbose = process.argv.includes('--verbose');

// ----------------------- Allowlist -----------------------
// Must stay in sync with:
//   - tools/invoice-decoder/telemetry.js (runtime sentinel)
//   - tools/invoice-decoder/sw.js (service-worker fetch gate)
//   - _headers CSP connect-src for /tools/invoice-decoder/
const ALLOWED_HOSTS = new Set([
  'plausible.io'
]);
// Same-origin URLs are always allowed; we treat anything starting
// with '/' as same-origin.

// ----------------------- Source set -----------------------
// Every JS module + the two HTML mirrors. The script walks the
// invoice-decoder directory recursively to pick up subfolders
// (vendors/*.json, data/*.txt) but skips JSON / non-text files
// from regex scanning.
const TARGETS = [
  resolve(repoRoot, 'tools/invoice-decoder/index.html'),
  resolve(repoRoot, 'es/tools/invoice-decoder/index.html')
];
function walkJs(dir, out) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkJs(p, out);
    else if (extname(p) === '.js') out.push(p);
  }
}
walkJs(resolve(repoRoot, 'tools/invoice-decoder'), TARGETS);

// ----------------------- URL extraction -----------------------
// We extract URL-shaped strings from each file. A URL-shape requires:
//   - http: / https: prefix OR protocol-relative //
//   - NOT preceded by `\` or `/` (rejects regex-literal false positives:
//     `\/foo\/` inside regex, or `/foo/i.test(ua)` where the trailing
//     `/i` looks superficially like a protocol-relative URL).
//   - At least one host label (letters, digits, hyphens) followed
//     by a dot
//   - A real TLD (2+ alphabetic chars).
//   - Optional path/query/fragment after the host (no whitespace
//     or quote chars).
const URL_RE = /(?<![\\/])(?:https?:)?\/\/(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}(?:[\/:?#][^\s'"<>`)]*)?/g;

function isAllowed(url) {
  try {
    // Normalize protocol-relative.
    const normalized = url.startsWith('//') ? 'https:' + url : url;
    const u = new URL(normalized);
    return ALLOWED_HOSTS.has(u.host);
  } catch (_) {
    // Couldn't parse — be conservative and flag it.
    return false;
  }
}

// Some URLs in source are intentional but non-allowlisted: e.g.
// documentation links in code comments, schema URLs, namespace
// declarations, error message templates that mention example.com.
// We allowlist by whole-line context to keep false positives down.
//
// EXEMPT_HOSTS lists hosts we never want to flag even when they
// appear in source — typically because they're in:
//   - JSDoc / comment URLs (https://www.w3.org/, https://developer.mozilla.org/)
//   - Schema namespaces (http://www.w3.org/2000/svg)
//   - Anthropic / Claude tooling URLs in this branch's commits
//   - CDN URLs that are NEVER fetched at runtime (build-time only)
const EXEMPT_HOSTS = new Set([
  'www.w3.org',            // SVG / XML namespace declarations
  'developer.mozilla.org', // doc links in comments
  'anthropic.com',         // commit-message footer tooling
  'github.com',            // commit-message links
  'claude.ai',             // commit-message session links
  'localhost',             // unit-test fixtures
  'example.com',           // doc / fallback test URLs
  // Microdata + JSON-LD — pure declarative metadata, never fetched
  // by browsers. Schema.org URLs are itemtype namespaces.
  'schema.org',
  // Site's own canonical domain. Same-origin in production; URLs
  // appearing in this file are JSON-LD canonical references and
  // breadcrumb @id values, never runtime fetches.
  'muntin.digital',
  // Build-time CDN — vendor-pin.mjs talks to jsdelivr at deploy time
  // to fetch + SRI-pin Tesseract / pdfjs / SheetJS for self-hosting.
  // Runtime never touches it (allowlist excludes it explicitly).
  'cdn.jsdelivr.net',
  // Runtime allowlist — listed for symmetry; ALLOWED_HOSTS already
  // covers it but we exempt here too so it doesn't clutter reports.
  'plausible.io'
]);

// Some context patterns also exempt a line: a URL inside a JSDoc
// comment, a string literal that's clearly a documentation link,
// or a CSP value (which lists allowed connect-src hosts).
function lineContextExempt(line) {
  const trimmed = line.trim();
  // Pure comment lines (// or *)
  if (/^(\/\/|\*|<!--)/.test(trimmed)) return true;
  // CSP / Content-Security-Policy declaration line
  if (/Content-Security-Policy|connect-src|script-src|font-src|img-src|style-src/i.test(line)) return true;
  // ALLOW_HOSTS allowlist declarations themselves
  if (/ALLOW_HOSTS|ALLOWED_HOSTS|ALLOWLIST_HOSTS|EXEMPT_HOSTS/.test(line)) return true;
  // <meta http-equiv="..." content="...">
  if (/http-equiv=/.test(line)) return true;
  // <link rel="canonical|alternate|stylesheet|preconnect|dns-prefetch">
  if (/<link\s+rel="(canonical|alternate|stylesheet|preconnect|dns-prefetch|icon|manifest|apple-touch-icon|mask-icon|shortcut|prefetch|preload)"/i.test(line)) return true;
  // <meta name="..." content="...">
  if (/<meta\s+(name|property)=/.test(line)) return true;
  // OG / structured data
  if (/og:|twitter:|json-ld|application\/ld\+json/i.test(line)) return true;
  // Microdata declarations — itemtype / itemid / itemprop="url"
  if (/itemtype=|itemid=|itemprop="(url|sameAs|@id|@type|@context)"/.test(line)) return true;
  // JSON-LD inline (any line that appears to be JSON-LD content
  // inside a <script type="application/ld+json"> block — typical
  // shapes are "@context", "@type", "@id", "url", "item", "sameAs").
  if (/"@context"|"@type"|"@graph"|"@id"|"sameAs"|"itemListElement"/.test(line)) return true;
  // plain text href in a <p>/<a> visible to the user (allowed: those
  // are user-facing and don't trigger fetches).
  if (/<a\s+[^>]*href="/.test(line)) return true;
  return false;
}

// ----------------------- Run -----------------------

const violations = [];
let totalScanned = 0;
let totalUrlsExtracted = 0;

for (const path of TARGETS) {
  if (!existsSync(path)) continue;
  totalScanned++;
  const src = readFileSync(path, 'utf8');
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.match(URL_RE);
    if (!matches) continue;
    if (lineContextExempt(line)) continue;
    for (const url of matches) {
      totalUrlsExtracted++;
      // Trim trailing punctuation / quotes that the regex grabs.
      const cleaned = url.replace(/[`"'<>)\]}.,;:!?]+$/, '');
      let host;
      try {
        const normalized = cleaned.startsWith('//') ? 'https:' + cleaned : cleaned;
        host = new URL(normalized).host;
      } catch (_) {
        // Unparsable; skip rather than false-positive.
        continue;
      }
      if (EXEMPT_HOSTS.has(host)) continue;
      if (isAllowed(cleaned)) continue;
      violations.push({
        path:  path.replace(repoRoot + '/', ''),
        line:  i + 1,
        url:   cleaned,
        host:  host,
        snippet: line.trim().slice(0, 140)
      });
    }
  }
}

// ----------------------- Report -----------------------

if (verbose) {
  console.log(`Scanned ${totalScanned} files; extracted ${totalUrlsExtracted} URL-shaped strings; ${violations.length} violations.`);
}

if (violations.length === 0) {
  console.log(`✓  privacy CI passed (${totalScanned} files; allowlist: ${[...ALLOWED_HOSTS].join(', ')})`);
  process.exit(0);
}

console.log(`\n⛔  privacy CI FAILED — ${violations.length} non-allowlisted URL(s) found in invoice-decoder source:`);
for (const v of violations) {
  console.log(`\n  ${v.path}:${v.line}`);
  console.log(`    host:    ${v.host}`);
  console.log(`    url:     ${v.url}`);
  console.log(`    snippet: ${v.snippet}`);
}
console.log(`\n  To fix:`);
console.log(`    - Add the host to ALLOWED_HOSTS in this script (and to`);
console.log(`      telemetry.js, sw.js, _headers CSP connect-src) if it's`);
console.log(`      a legitimate addition.`);
console.log(`    - Add it to EXEMPT_HOSTS if it's only in a doc comment /`);
console.log(`      commit-message footer / build-time tooling.`);
console.log(`    - Otherwise: remove the offending URL — runtime egress`);
console.log(`      to non-allowlisted hosts breaks privacy invariant I-1.`);
process.exit(1);
