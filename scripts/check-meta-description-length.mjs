#!/usr/bin/env node
/**
 * SEO hygiene — meta-description length gate.
 *
 * Google truncates the SERP snippet around ~155 characters; a
 * <meta name="description"> longer than that leaks its tail (often the
 * part carrying the call-to-action or the long-tail keyword) and costs
 * CTR on impressions the page already earns. This check flags every
 * indexable page whose description exceeds MAX_LEN, and softly warns on
 * suspiciously thin ones below MIN_LEN.
 *
 * Length is measured on the DECODED string: HTML entities (&mdash;,
 * &amp;, &#39;, &iacute; …) each render as a single glyph in the SERP,
 * so counting the raw attribute would over-count. We decode the common
 * named/numeric entities first, then count code points.
 *
 * SOURCE OF TRUTH — where a fix must land:
 *   - Library articles, blog posts, homepage, hubs, service/marketing
 *     pillars, tool pages, legal pages: the <meta> is authored INLINE in
 *     each index.html — edit the file.
 *   - Glossary terms + topic/section hubs: emitted by
 *     scripts/build-library.mjs (pageHead) — trim the source data
 *     (data/library-tags.json / term defs), then rebuild.
 *   - Operator sheets: scripts/build-sheet-pages.mjs (`summary`).
 *   - Cuisine / people / theme pages: their respective build-*.mjs.
 *   Editing the generated HTML directly will be overwritten on build.
 *
 * Modes:
 *   node scripts/check-meta-description-length.mjs          # report + exit code (honors WARN_ONLY)
 *   node scripts/check-meta-description-length.mjs --check   # alias for the default gated run
 *   node scripts/check-meta-description-length.mjs --warn    # force exit 0 even with offenders
 *   node scripts/check-meta-description-length.mjs --json    # machine-readable offender list
 *
 * Shipped warn-only: there is a known backlog of long descriptions
 * (mostly scripted glossary/sheet pages). PROMOTE-TO-FAIL: once
 * `node scripts/check-meta-description-length.mjs` reports a clean run,
 * flip WARN_ONLY to false below AND drop the trailing '--warn' from the
 * check-all.mjs entry. (Mirrors the check-image-dimensions /
 * check-audio-coverage promote-to-fail history.)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const args       = new Set(process.argv.slice(2));
const jsonOut    = args.has('--json');
const forceWarn  = args.has('--warn');

// Promote-to-fail switch. The over-length backlog (homepage/hub/library/
// blog inline + scripted glossary & sheet templates) has been worked off
// — generators clamp to <=155 (build-library pageHead, build-sheet-pages,
// build-cuisine-landing-pages, build-theme-story-pages,
// build-themes-review-board) and the residual inline pages were trimmed.
// Gate is now hard-fail.
const WARN_ONLY = false;

// SERP truncation thresholds. MAX_LEN is the hard ceiling Google trims
// around; MIN_LEN is a soft floor — below it the snippet is thin enough
// to leave description real estate (and keywords) on the table. MIN_LEN
// issues are advisory only and never gate CI.
const MAX_LEN = 155;
const MIN_LEN = 50;

// Build/dev/non-content trees. Mirrors check-og-coverage.mjs.
const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts', 'data', 'audio', 'tests',
]);

// Non-indexable surfaces (robots.txt Disallow trees). These never
// appear in SERPs, so their description length is irrelevant.
const SKIP_REL_PREFIX = [
  'admin/', 'es/admin/', 'account/', 'es/account/',
  'sign-in/', 'es/sign-in/', 'workbench/', 'es/workbench/',
  'blog/drafts/', 'es/blog/drafts/',
];

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      yield* walk(path.join(dir, e.name));
    } else if (e.isFile() && e.name.endsWith('.html')) {
      yield path.join(dir, e.name);
    }
  }
}

// Match both attribute orderings: name-then-content (the EN/ES house
// convention) and content-then-name (post-translation pipelines).
// Capture is double-quote-delimited ONLY — descriptions here are always
// double-quoted and many contain literal apostrophes (what's, isn't),
// so a class that included ' would truncate early.
const RE_NAME_FIRST = /<meta\s+name="description"\s+content="([^"]*)"/i;
const RE_CONT_FIRST = /<meta\s+content="([^"]*)"\s+name="description"/i;
function findDescription(src) {
  const a = src.match(RE_NAME_FIRST);
  if (a) return a[1];
  const b = src.match(RE_CONT_FIRST);
  if (b) return b[1];
  return null;
}

// Skip pages that ask robots not to index them — their snippet never
// renders, so length is moot.
function isNoindex(src) {
  return /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(src)
      || /<meta[^>]+content="[^"]*noindex[^"]*"[^>]+name="robots"/i.test(src);
}

// Decode the entities that actually appear in our descriptions to a
// single rendered glyph, so the count matches what Google truncates.
const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: '’',
  mdash: '—', ndash: '–', hellip: '…', nbsp: ' ',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”',
  iacute: 'í', oacute: 'ó', eacute: 'é', aacute: 'á',
  uacute: 'ú', ntilde: 'ñ',
};
function decodeEntities(s) {
  return s
    .replace(/&#39;/g, '’')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => (NAMED[n] !== undefined ? NAMED[n] : m));
}
function glyphLength(s) {
  return [...decodeEntities(s)].length; // code points, not UTF-16 units
}

const tooLong = [];
const tooShort = [];
let scanned = 0;

for (const file of walk(repoRoot)) {
  const rel = path.relative(repoRoot, file).split(path.sep).join('/');
  if (SKIP_REL_PREFIX.some((p) => rel.startsWith(p))) continue;
  const src = fs.readFileSync(file, 'utf8');
  if (isNoindex(src)) continue;
  const desc = findDescription(src);
  if (desc === null) continue; // missing-description is a different gate's job
  scanned++;
  const len = glyphLength(desc);
  if (len > MAX_LEN) tooLong.push({ rel, len, text: decodeEntities(desc) });
  else if (len < MIN_LEN) tooShort.push({ rel, len, text: decodeEntities(desc) });
}

tooLong.sort((a, b) => b.len - a.len);
tooShort.sort((a, b) => a.len - b.len);

if (jsonOut) {
  console.log(JSON.stringify({ scanned, max: MAX_LEN, min: MIN_LEN, tooLong, tooShort }, null, 2));
  process.exit((WARN_ONLY || forceWarn) ? 0 : (tooLong.length ? 1 : 0));
}

if (tooLong.length === 0 && tooShort.length === 0) {
  console.log(`Meta description length: clean. (${scanned} indexable pages, all ${MIN_LEN}-${MAX_LEN} chars.)`);
  process.exit(0);
}

if (tooLong.length) {
  console.log(`Meta description length${WARN_ONLY ? ' (warning)' : ''}: ${tooLong.length} page(s) over ${MAX_LEN} chars (of ${scanned} scanned):`);
  for (const o of tooLong.slice(0, 30)) {
    console.log(`  · [${String(o.len).padStart(3)}] ${o.rel}`);
  }
  if (tooLong.length > 30) console.log(`  … and ${tooLong.length - 30} more`);
}

if (tooShort.length) {
  // Advisory only — never gates CI, even after promotion.
  console.log(`\nThin descriptions (< ${MIN_LEN} chars, advisory only): ${tooShort.length}`);
  for (const o of tooShort.slice(0, 15)) {
    console.log(`  · [${String(o.len).padStart(3)}] ${o.rel}`);
  }
}

console.log('\nSource of truth: inline <meta> for articles/posts/hubs/pillars/tools;');
console.log('build-library.mjs (pageHead) for glossary+topics; build-sheet-pages.mjs for sheets.');

// Only the OVER-length set gates CI; thin descriptions stay advisory.
if (!WARN_ONLY && !forceWarn && tooLong.length > 0) process.exit(1);
process.exit(0);
