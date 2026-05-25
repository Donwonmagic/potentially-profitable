#!/usr/bin/env node
/**
 * Stamp a 'Print the L<N> tear-sheet →' affordance into every Open
 * the Doors lesson page that has a matching course-bootcamp sheet
 * in /sheets/. Anchor: inside the course-takeaways block, right
 * before its closing </section>.
 *
 * Lesson → sheet mapping is fixed (lives in this file). Lessons
 * without a sheet (welcome, what-a-site-does, generator, deploy)
 * are skipped silently. Fork lessons (photos-fresh + photos-rebuild;
 * gbp-fresh + gbp-rebuild) share a single sheet.
 *
 * Sentinel block:
 *
 *   <!-- course-sheet-link:start -->
 *   <p class="takeaway-sheet"><a href="/sheets/course-…/">Print the
 *   L<N> tear-sheet →</a></p>
 *   <!-- course-sheet-link:end -->
 *
 * Idempotent. Run via check-all (--check fails CI if any lesson is
 * out of sync with the mapping).
 *
 * Usage:
 *   node scripts/inject-course-sheet-link.mjs           # rewrite
 *   node scripts/inject-course-sheet-link.mjs --check   # exit 1 if any change
 *   node scripts/inject-course-sheet-link.mjs --dry-run # list, no writes
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

// Lesson id → sheet slug. Lessons not in this map don't get a sheet
// link (welcome, what-a-site-does, generator by design).
const LESSON_TO_SHEET = {
  'one-promise':    'course-promise',
  'customer':       'course-customer',
  'naming':         'course-naming',
  'audit':          'course-audit',
  'positioning':    'course-positioning',
  'leaks':          'course-leaks',
  'palette-voice':  'course-palette-voice',
  'menu':           'course-menu-shortlist',
  'photos-fresh':   'course-photo-brief',
  'photos-rebuild': 'course-photo-brief',
  'hours-contact':  'course-hours',
  'gbp-fresh':      'course-gbp-checklist',
  'gbp-rebuild':    'course-gbp-checklist',
  'local-seo':      'course-local-seo',
  'reviews':        'course-review-template',
  // Deploy gets the launch-week checklist — 10 one-time tasks for the
  // seven days after the site goes live. Closes the audit's G-C3 gap.
  'deploy':         'course-launch-week',
  'rhythm':         'course-rhythm'
};

const SENTINEL_START = '<!-- course-sheet-link:start -->';
const SENTINEL_END   = '<!-- course-sheet-link:end -->';
const SENTINEL_RE    = /\n?\s*<!-- course-sheet-link:start -->[\s\S]*?<!-- course-sheet-link:end -->\n?/;

// Anchor: the closing </section> of the takeaways block. The block
// always carries class="course-takeaways"; we match the closing tag
// of the immediately-following section by anchoring backwards from
// the takeaways h2.
const ANCHOR_RE = /(<section class="course-takeaways"[\s\S]*?)(\n\s*<\/section>)/;

function buildBlock(sheetSlug, lessonPosition, locale) {
  const sheetUrl = (locale === 'es' ? '/es/sheets/' : '/sheets/') + sheetSlug + '/';
  const label = locale === 'es'
    ? `Imprime la hoja de la Lección ${lessonPosition} →`
    : `Print the Lesson ${lessonPosition} tear-sheet →`;
  return [
    SENTINEL_START,
    `        <p class="takeaway-sheet" style="margin-top:14px;padding-top:14px;border-top:1px dashed var(--line);font-size:14.5px"><a href="${sheetUrl}" style="color:var(--teal);font-weight:600">${label}</a></p>`,
    `        ${SENTINEL_END}`
  ].join('\n');
}

function transform(src, sheetSlug, lessonPosition, locale) {
  if (!sheetSlug) {
    // No mapping — strip any stale sentinel if present.
    if (!SENTINEL_RE.test(src)) return null;
    return src.replace(SENTINEL_RE, '\n');
  }
  const block = buildBlock(sheetSlug, lessonPosition, locale);
  if (SENTINEL_RE.test(src)) {
    const next = src.replace(SENTINEL_RE, '\n' + block + '\n');
    return next === src ? null : next;
  }
  if (!ANCHOR_RE.test(src)) return undefined;
  return src.replace(ANCHOR_RE, '$1\n' + block + '$2');
}

function lessonHtmlPath(lesson, locale) {
  const rel = lesson.path.replace(/^\//, '').replace(/\/$/, '');
  const base = locale === 'es' ? path.join(repoRoot, 'es', rel) : path.join(repoRoot, rel);
  return path.join(base, 'index.html');
}

let stamped = 0;
let removed = 0;
let unchanged = 0;
let skipped = 0;
const noAnchor = [];

for (const lesson of manifest.lessons) {
  const sheetSlug = LESSON_TO_SHEET[lesson.id] || null;
  for (const locale of ['en', 'es']) {
    const filePath = lessonHtmlPath(lesson, locale);
    if (!fs.existsSync(filePath)) { skipped++; continue; }

    const src = fs.readFileSync(filePath, 'utf8');
    const result = transform(src, sheetSlug, lesson.position, locale);

    if (result === null) { unchanged++; continue; }
    if (result === undefined) {
      noAnchor.push(path.relative(repoRoot, filePath));
      continue;
    }
    if (sheetSlug) stamped++;
    else removed++;
    if (!checkOnly && !dryRun) fs.writeFileSync(filePath, result);
  }
}

if (noAnchor.length) {
  console.warn(`\ninject-course-sheet-link: ${noAnchor.length} lesson page(s) missing the course-takeaways anchor — skipped:`);
  for (const f of noAnchor.slice(0, 5)) console.warn(`  ${f}`);
  if (noAnchor.length > 5) console.warn(`  …and ${noAnchor.length - 5} more`);
}

const totalChanged = stamped + removed;
console.log(`inject-course-sheet-link: ${stamped} stamped, ${removed} removed (stale sentinel cleared), ${unchanged} unchanged, ${skipped} skipped (lesson page missing).`);

if (checkOnly && totalChanged > 0) {
  console.error(`inject-course-sheet-link: ${totalChanged} file(s) would change under --check (exit 1).`);
  process.exit(1);
}
process.exit(0);
