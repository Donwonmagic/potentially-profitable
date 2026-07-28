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
 * RULE 2 (added 2026-07-28) — DANGLING TARGETS. An hreflang must point at a page
 * that exists. Rule 1 and check-locale-parity both look ES→EN; nothing looked
 * EN→ES, so 16 of the 17 /open explorers shipped
 * `hreflang="es" href=".../es/open/<name>/"` for Spanish pages that were never
 * written, while every gate reported clean. A dangling alternate tells crawlers a
 * translation exists and then 404s. This rule resolves every same-origin hreflang
 * href against the working tree (`<path>/index.html`, `<path>.html`, or the file
 * itself) and fails on any that does not resolve. `x-default` is skipped — it is a
 * routing hint, not a page claim.
 *
 * Deliberately folded into this script rather than shipped as a new gate: it is the
 * same walk over the same files, so it costs no extra serial time in check-all.
 *
 *   node scripts/check-hreflang-orphans.mjs           # report + exit 0
 *   node scripts/check-hreflang-orphans.mjs --check   # exit 1 on any orphan/dangler
 *   node scripts/check-hreflang-orphans.mjs --self-test
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

// ── RULE 2 helpers: does a same-origin URL resolve to a file on disk? ──────────
const ORIGIN = 'https://muntin.digital';
const ALT_HREF_RE = /<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*\/?>/gi;

// Mirrors how the static host serves: /a/b/ -> a/b/index.html; /a.html -> a.html.
export function resolvesOnDisk(urlPath, exists = (p) => fs.existsSync(path.join(repoRoot, p))) {
  const clean = String(urlPath).split(/[?#]/)[0];
  const rel = clean.replace(/^\/+/, '');
  if (rel === '') return exists('index.html');
  if (rel.endsWith('.html')) return exists(rel);
  const bare = rel.replace(/\/+$/, '');
  return exists(`${bare}/index.html`) || exists(`${bare}.html`);
}

// Collect dangling same-origin alternates from one page into `sink`.
// `exists` is injectable so the self-test can run against a fake tree.
function scanDanglingAlternatesInto(sink, relFile, src, exists) {
  ALT_HREF_RE.lastIndex = 0;
  let m;
  while ((m = ALT_HREF_RE.exec(src))) {
    const [, lang, href] = m;
    if (lang.toLowerCase() === 'x-default') continue;   // routing hint, not a page claim
    if (!href.startsWith(ORIGIN)) continue;             // off-origin is not ours to verify
    const urlPath = href.slice(ORIGIN.length) || '/';
    if (!resolvesOnDisk(urlPath, exists)) sink.push({ file: relFile, lang, href });
  }
}

// ── self-test: pins RULE 2's resolver + detector against a fake tree ───────────
if (process.argv.includes('--self-test')) {
  const tree = new Set(['index.html', 'open/energy/index.html', 'es/open/seasonality/index.html', 'privacy.html']);
  const fake = (p) => tree.has(p);
  const cases = [
    ['/', true], ['/open/energy/', true], ['/open/energy', true],
    ['/es/open/seasonality/', true], ['/privacy.html', true],
    ['/es/open/energy/', false], ['/open/nope/', false], ['/missing.html', false],
    ['/open/energy/?x=1', true], ['/open/energy/#frag', true],
  ];
  let fail = 0;
  for (const [url, want] of cases) {
    const got = resolvesOnDisk(url, fake);
    if (got !== want) { console.error(`  ✗ resolver ${url}: got ${got}, want ${want}`); fail++; }
  }
  // detector: the dangling ES alternate is caught; x-default and off-origin are not
  const probe = [
    '<link rel="alternate" hreflang="en" href="https://muntin.digital/open/energy/" />',
    '<link rel="alternate" hreflang="es" href="https://muntin.digital/es/open/energy/" />',
    '<link rel="alternate" hreflang="x-default" href="https://muntin.digital/open/nope/" />',
    '<link rel="alternate" hreflang="fr" href="https://example.com/nope/" />',
  ].join('\n');
  const found = [];
  scanDanglingAlternatesInto(found, 'probe.html', probe, fake);
  if (found.length !== 1 || found[0].lang !== 'es') {
    console.error(`  ✗ detector: expected exactly 1 ES dangler, got ${JSON.stringify(found)}`); fail++;
  }
  if (fail) { console.error(`check-hreflang-orphans self-test: ${fail} failure(s).`); process.exit(1); }
  console.log(`check-hreflang-orphans self-test: ${cases.length + 1}/${cases.length + 1} passed (resolver + dangling detector).`);
  process.exit(0);
}

const danglers = [];

const offenders = [];

for (const file of walk(repoRoot)) {
  let src;
  try { src = fs.readFileSync(file, 'utf8'); } catch { continue; }

  // RULE 2 runs on EVERY page — the /open explorers that shipped the defect carry
  // hand-authored alternates and no sentinel block at all.
  scanDanglingAlternatesInto(danglers, path.relative(repoRoot, file), src);

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

if (offenders.length === 0 && danglers.length === 0) {
  console.log(`Hreflang: clean. (${walk(repoRoot).length} HTML pages scanned — no orphan lines, no dangling alternates.)`);
  process.exit(0);
}

if (offenders.length) {
  console.log(`Hreflang orphans: ${offenders.length} page(s) with orphan hreflang/og:locale lines after the sentinel block:\n`);
  for (const o of offenders.slice(0, 20)) {
    console.log(`  ${o.file}:${o.at}  ${o.line.slice(0, 80)}`);
  }
  if (offenders.length > 20) console.log(`  … and ${offenders.length - 20} more.`);
  console.log(`\nFix: re-run scripts/cleanup-hreflang-orphans.mjs (or hand-edit) so the line\nimmediately after <!-- i18n:hreflang END --> is not a hreflang/og:locale tag.`);
}

if (danglers.length) {
  console.log(`\nHreflang dangling targets: ${danglers.length} alternate(s) point at a page that does not exist:\n`);
  for (const d of danglers.slice(0, 20)) {
    console.log(`  ${d.file}  hreflang="${d.lang}" -> ${d.href}`);
  }
  if (danglers.length > 20) console.log(`  … and ${danglers.length - 20} more.`);
  console.log(`\nFix: either write the target page, or drop the alternate. A dangling hreflang\nadvertises a translation that 404s. For generated pages, make the tag conditional\non the counterpart existing (see build-open-{recalls,labor,demand}-page.mjs).`);
}

if (checkMode) process.exit(1);
process.exit(0);
