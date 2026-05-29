#!/usr/bin/env node
/**
 * Idempotently stamp the course-config-sync.js script tag into every
 * Open the Doors lesson page + the course hub (EN + ES). The script
 * itself debounces context changes and POSTs to /api/course/config
 * for signed-in operators (anonymous → 401, silently skipped).
 *
 * Anchor: right before </body>. Sentinel-wrapped so re-runs are no-ops
 * and removal is clean.
 *
 *   <!-- course-config-sync:start -->
 *   <script src="/assets/js/course-config-sync.js" defer></script>
 *   <!-- course-config-sync:end -->
 *
 * Usage:
 *   node scripts/inject-course-config-sync.mjs            # rewrite
 *   node scripts/inject-course-config-sync.mjs --check    # exit 1 if any change
 *   node scripts/inject-course-config-sync.mjs --dry-run  # list, no writes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const dryRun    = args.has('--dry-run');

const MANIFEST_PATH = path.join(repoRoot, 'data', 'course-lessons.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

const SENTINEL_START = '<!-- course-config-sync:start -->';
const SENTINEL_END   = '<!-- course-config-sync:end -->';
const SENTINEL_RE    = /\n?\s*<!-- course-config-sync:start -->[\s\S]*?<!-- course-config-sync:end -->\n?/;
const SCRIPT_TAG     = '<script src="/assets/js/course-config-sync.js" defer></script>';

// Anchor: just before the closing </body>. Captures the leading
// whitespace so the inserted block lines up. Every lesson page ends
// with </body> on its own line preceded by a blank.
const ANCHOR_RE = /(\s*<\/body>)/;

function buildBlock() {
  return [
    SENTINEL_START,
    SCRIPT_TAG,
    SENTINEL_END
  ].join('\n');
}

function transform(src) {
  const block = buildBlock();
  if (SENTINEL_RE.test(src)) {
    const next = src.replace(SENTINEL_RE, '\n' + block + '\n');
    return next === src ? null : next;
  }
  if (!ANCHOR_RE.test(src)) return undefined;
  return src.replace(ANCHOR_RE, '\n' + block + '$1');
}

function lessonHtmlPath(lesson, locale) {
  const rel = lesson.path.replace(/^\//, '').replace(/\/$/, '');
  const base = locale === 'es' ? path.join(repoRoot, 'es', rel) : path.join(repoRoot, rel);
  return path.join(base, 'index.html');
}

// Pages to stamp: all 20 lesson pages × 2 locales + the two hub pages.
const TARGETS = [];
for (const lesson of manifest.lessons) {
  for (const locale of ['en', 'es']) TARGETS.push(lessonHtmlPath(lesson, locale));
}
TARGETS.push(path.join(repoRoot, 'course', 'index.html'));
TARGETS.push(path.join(repoRoot, 'es', 'course', 'index.html'));

let stamped = 0;
let unchanged = 0;
let skipped = 0;
const noAnchor = [];

for (const filePath of TARGETS) {
  if (!fs.existsSync(filePath)) { skipped++; continue; }
  const src = fs.readFileSync(filePath, 'utf8');
  const result = transform(src);
  if (result === null) { unchanged++; continue; }
  if (result === undefined) {
    noAnchor.push(path.relative(repoRoot, filePath));
    continue;
  }
  stamped++;
  if (!checkOnly && !dryRun) fs.writeFileSync(filePath, result);
}

if (noAnchor.length) {
  console.warn(`\ninject-course-config-sync: ${noAnchor.length} page(s) missing the </body> anchor — skipped:`);
  for (const f of noAnchor.slice(0, 5)) console.warn(`  ${f}`);
  if (noAnchor.length > 5) console.warn(`  …and ${noAnchor.length - 5} more`);
}

console.log(`inject-course-config-sync: ${stamped} stamped, ${unchanged} unchanged, ${skipped} skipped (page missing).`);

if (checkOnly && stamped > 0) {
  console.error(`inject-course-config-sync: ${stamped} file(s) would change under --check (exit 1).`);
  process.exit(1);
}
process.exit(0);
