#!/usr/bin/env node
// Sprint 0 (Workshop) — privacy gate for /workbench/.
//
// The /workbench/ route is gated server-side: anonymous visitors
// get a 404. That gate is only meaningful if NO PUBLIC SURFACE
// links to /workbench/ — a stale link in nav, footer, sitemap, or
// JSON data file would let a curious crawler (or human) discover
// that the path exists, even if it 404s on visit.
//
// This script enforces the contract at build time. It scans every
// HTML / JSON / XML file in the repo and fails the build if any
// non-allowlisted file mentions /workbench/.
//
// Allowlist:
//   - workbench/index.html              (the EN stub itself)
//   - es/workbench/index.html           (the ES stub itself)
//   - robots.txt                        (Disallow lines, intentional)
//   - _redirects                        (intentional rewrites, future-proof)
//   - scripts/check-workbench-private.mjs (this file)
//   - The plan file (under /root/.claude/plans/) — not in repo, never scanned
//
// Run: node scripts/check-workbench-private.mjs
// Exit 0 if clean; non-zero if a leak is detected.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(fileURLToPath(import.meta.url), '..', '..');

// Files that legitimately mention /workbench/. Anything else that
// matches /workbench/ is a privacy leak.
const ALLOWLIST = new Set([
  'workbench/index.html',
  'es/workbench/index.html',
  'robots.txt',
  '_redirects',
  'scripts/check-workbench-private.mjs',
]);

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.github', 'dist', '.wrangler',
]);

// File extensions that could expose a /workbench/ link to a crawler
// or to a user navigating the site. We deliberately do NOT scan
// .js / .mjs / .ts — server-side code may need to reference the
// path (the worker gate does), and that's not a leak.
const SCAN_EXTS = ['.html', '.json', '.xml', '.txt'];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (SCAN_EXTS.some((ext) => entry.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(REPO);
const violations = [];

for (const file of files) {
  const rel = relative(REPO, file).replace(/\\/g, '/');
  if (ALLOWLIST.has(rel)) continue;
  const content = readFileSync(file, 'utf8');
  if (content.includes('/workbench/') || content.includes('"workbench"')) {
    // Capture the matching line so the failure message is actionable.
    const lines = content.split('\n');
    const hits = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('/workbench/') || lines[i].includes('"workbench"')) {
        hits.push({ line: i + 1, snippet: lines[i].trim().slice(0, 120) });
      }
    }
    violations.push({ file: rel, hits });
  }
}

if (violations.length === 0) {
  console.log('Workbench privacy gate: clean.');
  console.log(`  Scanned ${files.length} files across ${SCAN_EXTS.join(', ')}.`);
  console.log(`  Allowlist: ${ALLOWLIST.size} file(s).`);
  process.exit(0);
}

console.error('Workbench privacy gate: LEAKS DETECTED.');
console.error('');
console.error('A non-allowlisted file references /workbench/. Sprint 0 contract');
console.error('says no public surface should expose this path. Either:');
console.error('  - Remove the reference, or');
console.error('  - Add the file to ALLOWLIST in scripts/check-workbench-private.mjs');
console.error('    if the reference is intentional (and explain why in a comment).');
console.error('');
for (const v of violations) {
  console.error(v.file);
  for (const h of v.hits) {
    console.error('  L' + h.line + ':  ' + h.snippet);
  }
  console.error('');
}
console.error(`${violations.length} violation(s) found.`);
process.exit(1);
