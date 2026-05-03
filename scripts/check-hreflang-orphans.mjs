#!/usr/bin/env node
/**
 * Phase 3B (cohesion) — guard against orphan hreflang lines.
 *
 * Background: stamp-hreflang.mjs writes a sentinel-marked block
 * (<!-- i18n:hreflang START --> ... <!-- i18n:hreflang END -->) into
 * every EN page. For 161 pages, the page already had hand-authored
 * <link rel="alternate" hreflang="..."> and <meta property="og:locale">
 * lines from before the script existed. The script wrote its own block
 * on top of the canonical (matching the marker), but never removed
 * the legacy hand-authored lines underneath. The result: every
 * affected page declared 2× the same hreflang triplet (one inside the
 * sentinel block, one outside).
 *
 * Two-line block + two-line orphan = Google sees four hreflang declarations
 * for the same page, which is technically valid but not what the rest
 * of the site says. This guard fails the build if any page has a
 * <link rel="alternate" hreflang> or <meta property="og:locale"> on
 * the FIRST non-blank line after <!-- i18n:hreflang END -->.
 *
 *   node scripts/check-hreflang-orphans.mjs           # report + exit 0
 *   node scripts/check-hreflang-orphans.mjs --check   # exit 1 on any orphan
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts', 'data',
]);

const END_MARK = '<!-- i18n:hreflang END -->';
// Same shape used by the cleanup script — be strict so we don't false-
// positive on unrelated meta tags.
const ORPHAN_LINE_RE = /^\s*(?:<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="[^"]+"\s*\/?>|<meta\s+property="og:locale(?::alternate)?"\s+content="[a-z_]+"\s*\/?>)\s*$/i;
const BLANK_LINE_RE = /^\s*$/;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

const offenders = [];

for (const file of walk(repoRoot)) {
  let src;
  try { src = fs.readFileSync(file, 'utf8'); } catch { continue; }
  if (!src.includes(END_MARK)) continue;

  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes(END_MARK)) continue;
    // Skip blank lines, then check the first content line that follows.
    let j = i + 1;
    while (j < lines.length && BLANK_LINE_RE.test(lines[j])) j++;
    if (j < lines.length && ORPHAN_LINE_RE.test(lines[j])) {
      offenders.push({ file: path.relative(repoRoot, file), at: j + 1, line: lines[j].trim() });
    }
    break; // one sentinel per page
  }
}

if (offenders.length === 0) {
  console.log(`Hreflang orphans: clean. (${walk(repoRoot).length} HTML pages scanned.)`);
  process.exit(0);
}

console.log(`Hreflang orphans: ${offenders.length} page(s) with orphan hreflang/og:locale lines after the sentinel block:\n`);
for (const o of offenders.slice(0, 20)) {
  console.log(`  ${o.file}:${o.at}  ${o.line.slice(0, 80)}`);
}
if (offenders.length > 20) console.log(`  … and ${offenders.length - 20} more.`);
console.log(`\nFix: re-run scripts/cleanup-hreflang-orphans.mjs (or hand-edit) so the line\nimmediately after <!-- i18n:hreflang END --> is not a hreflang/og:locale tag.`);

if (checkMode) process.exit(1);
process.exit(0);
