#!/usr/bin/env node
/**
 * Regression guard for retired tool slugs.
 *
 * Invoice Decoder + Menu Design were retired 2026-05-08. This check
 * fails CI if either slug is reintroduced anywhere it shouldn't be —
 * a fresh URL, a new tools.json entry, a copy-pasted handoff
 * function from an older sibling tool, an OG card slug, etc.
 *
 * The check is intentionally narrow:
 *   - matches /tools/(invoice-decoder|menu-design)/  (with trailing
 *     slash; safely excludes library/menu-design-cuisines/ and
 *     library/menu-design-themes/, which we keep)
 *   - matches "slug": "(invoice-decoder|menu-design)" in JSON values
 *   - matches a file path under tools/(invoice-decoder|menu-design)/
 *
 * Allow list (legitimate references that must NOT trigger the guard):
 *   - _redirects: holds the 410 rules pointing AT the dead paths
 *   - 404.html: holds the sunset-path scrub regex
 *   - this script itself: documents the regexes in prose
 *   - llms-full.txt and feed-llm.json: historical citation snapshots
 *     of pre-sunset content (regenerate to clean if desired)
 *   - data/tool-releases.json: historical release notes
 *
 * Cosmetic comment refs in script docstrings (build-pdf-fonts.mjs,
 * check-tests.mjs, build-themes-review-board.mjs) and _shared module
 * comments are explicitly ignored — they're prose, not behavior.
 *
 * Run via:    node scripts/check-removed-slugs.mjs
 *             (wired into scripts/check-all.mjs)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

// ---- Patterns ------------------------------------------------
// Trailing slash matters: it makes "/tools/menu-design/" not match
// against "/library/menu-design-cuisines/" (no /tools/ prefix) or
// "/library/menu-design-themes/" (same), which both stay live.
const URL_RE  = /\/tools\/(?:invoice-decoder|menu-design)\//;
const SLUG_RE = /"slug"\s*:\s*"(?:invoice-decoder|menu-design)"/;

// ---- Allow list ----------------------------------------------
const ALLOW_FILES = new Set([
  '_redirects',                            // 410 rules intentionally cite dead paths
  '404.html',                              // sunset-path scrub regex cites them
  'scripts/check-removed-slugs.mjs',       // this file documents the patterns
  'feed-llm.json',                         // historical LLM snapshot
  'llms-full.txt',                         // historical LLM snapshot
  'data/tool-releases.json',               // historical release notes
]);

// Comment-only refs in scripts and _shared modules are noise.
// Skip these directories entirely.
const ALLOW_DIRS = [
  'tools/_shared/',
  'docs/',                                 // historical planning docs
  'scripts/build-pdf-fonts.mjs',
  'scripts/check-tests.mjs',
  'scripts/build-themes-review-board.mjs',
  'scripts/check-tool-header.mjs',
];

// Don't walk these
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', '.wrangler']);

// ---- File walker ---------------------------------------------
function shouldScanFile(rel) {
  return /\.(html|json|jsonc|js|mjs|xml|txt|webmanifest|md)$/.test(rel);
}

function walk(dir, hits) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel  = path.relative(repoRoot, full).replaceAll('\\', '/');
    if (entry.isDirectory()) { walk(full, hits); continue; }
    if (!shouldScanFile(rel)) continue;
    if (ALLOW_FILES.has(rel)) continue;
    if (ALLOW_DIRS.some((p) => rel === p || rel.startsWith(p))) continue;
    let body;
    try { body = fs.readFileSync(full, 'utf8'); } catch { continue; }
    const lines = body.split('\n');
    lines.forEach((line, i) => {
      if (URL_RE.test(line) || SLUG_RE.test(line)) {
        hits.push({ file: rel, line: i + 1, snippet: line.trim().slice(0, 160) });
      }
    });
  }
}

const hits = [];
walk(repoRoot, hits);

if (hits.length === 0) {
  console.log('✓ No retired slug references found in scanned surfaces.');
  process.exit(0);
}

console.error(`✗ Retired slug references found in ${hits.length} location(s):`);
for (const h of hits) {
  console.error(`  ${h.file}:${h.line}  ${h.snippet}`);
}
console.error('');
console.error('Allowed surfaces: _redirects (410 rules), 404.html (scrub regex),');
console.error('scripts/check-removed-slugs.mjs (this guard), feed-llm.json,');
console.error('llms-full.txt, data/tool-releases.json. If a new reference is');
console.error('legitimate, add it to ALLOW_FILES or ALLOW_DIRS in this script.');
process.exit(1);
