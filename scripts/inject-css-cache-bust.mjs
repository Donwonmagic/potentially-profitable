#!/usr/bin/env node
/**
 * Phase-3-perf — derive cache-bust from CSS file hash.
 *
 * The recurring "user sees stale CSS for hours after deploy"
 * problem (which produced the FOUC + giant-Muntin-mark bug the
 * user reported on 2026-05-04) has a structural root cause: cache-
 * bust query strings on `<link href="/assets/site*.css?v=...">`
 * tags were hand-bumped to date-tag strings (e.g., ?v=20260503-shells,
 * ?v=20260504-fouc) on PRs that touched CSS. If a PR forgot to
 * bump, OR bumped on some pages and not others, browsers served
 * the cached file at the old URL forever — even after the
 * underlying CSS file changed.
 *
 * The fix: derive the cache-bust from the CSS file's content hash.
 *
 *   <link href="/assets/site-core.css?v=3d48557d891a">
 *
 * If the file content changes, the hash changes, the URL changes,
 * the browser refetches. If the content doesn't change, the hash
 * doesn't change, the URL doesn't change, the browser keeps using
 * its cached copy. Zero stale-cache risk; zero hand-bumping.
 *
 * What this script does on every build:
 *
 *   1. Compute a 12-hex-char SHA-256 prefix of each of:
 *        assets/site.css
 *        assets/site-core.css
 *        assets/site-tool.css
 *        assets/site-article.css
 *
 *   2. Walk every HTML page. For each `<link…href="/assets/<f>.css?v=X">`
 *      where <f> matches one of the four files above, replace X with
 *      the corresponding hash. Idempotent: if the URL already has the
 *      right hash, no change.
 *
 *   3. Also handle the matching `<noscript><link rel="stylesheet"
 *      href="/assets/<f>.css?v=X"></noscript>` pattern.
 *
 * Usage:
 *   node scripts/inject-css-cache-bust.mjs           # rewrite in place
 *   node scripts/inject-css-cache-bust.mjs --check   # exit 1 if any change
 *
 * Wire into the build pipeline AFTER build-css-shells.mjs (so the
 * shells exist) and AFTER inject-css-shells.mjs (so the page <link>
 * tags exist), but BEFORE the static-asset deploy.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const FILES = ['site.css', 'site-core.css', 'site-tool.css', 'site-article.css'];

// 12-hex-char prefix. Full SHA-256 is 64 chars; 12 is enough for
// uniqueness (collision odds 1 in 281 trillion at typical change rate)
// and short enough to keep the cache-bust readable in DevTools.
const HASH_LEN = 12;

function hashFile(rel) {
  const abs = path.join(repoRoot, 'assets', rel);
  if (!fs.existsSync(abs)) return null;
  const h = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
  return h.slice(0, HASH_LEN);
}

const hashes = Object.fromEntries(FILES.map((f) => [f, hashFile(f)]));
for (const [f, h] of Object.entries(hashes)) {
  if (!h) {
    console.error(`inject-css-cache-bust: missing assets/${f} — skipping (build-css-shells should run first)`);
  }
}

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'brand', 'assets', 'scripts', 'src', 'data',
]);

function listHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listHtml(full, out);
    else if (e.isFile() && e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

let changed = 0;
const changedFiles = [];

for (const file of listHtml(repoRoot)) {
  const src = fs.readFileSync(file, 'utf8');
  let next = src;

  for (const f of FILES) {
    const h = hashes[f];
    if (!h) continue;
    // Match /assets/<f>.css?v=<anything-not-quote> in any link rel context.
    // Allowing any URL-safe payload covers both old date tags and any
    // hand-typed value. Only swaps the v= portion; the rest of the
    // attribute string is untouched.
    const re = new RegExp(`(\\/assets\\/${f.replace(/\./g, '\\.')}\\?v=)[^"']+`, 'g');
    next = next.replace(re, `$1${h}`);
  }

  if (next !== src) {
    changed++;
    changedFiles.push(path.relative(repoRoot, file));
    if (!checkOnly) fs.writeFileSync(file, next);
  }
}

if (checkOnly && changed > 0) {
  console.error(`inject-css-cache-bust: ${changed} page(s) would change:`);
  for (const f of changedFiles.slice(0, 10)) console.error(`  ${f}`);
  if (changedFiles.length > 10) console.error(`  …and ${changedFiles.length - 10} more`);
  console.error(`\nFix: run \`node scripts/inject-css-cache-bust.mjs\` to update cache-bust hashes.`);
  process.exit(1);
}

const hashSummary = FILES.map((f) => `${f}=${hashes[f] || 'MISSING'}`).join(', ');
console.log(`inject-css-cache-bust: ${changed} page(s) ${checkOnly ? 'would update' : 'updated'}. (hashes: ${hashSummary})`);
