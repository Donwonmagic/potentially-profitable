#!/usr/bin/env node
/**
 * Stamp a "What you'll be able to do by the end" <details> block at
 * the top of every Open the Doors lesson page, idempotently. Reads
 * lesson.objectives from data/course-lessons.json (added per audit
 * G-Q2).
 *
 * Anchor: right after the <p class="lead"> in the lesson body, OR
 * immediately after <article class="course-body" id="post-body"> if
 * no .lead exists.
 *
 * Sentinel block (self-contained <style> + <details>):
 *
 *   <!-- course-objectives:start -->
 *   <style>...</style>
 *   <details class="course-objectives">
 *     <summary>What you'll be able to do by the end</summary>
 *     <ul><li>...</li>...</ul>
 *   </details>
 *   <!-- course-objectives:end -->
 *
 * Usage:
 *   node scripts/inject-course-objectives.mjs            # rewrite in place
 *   node scripts/inject-course-objectives.mjs --check    # exit 1 if any change
 *   node scripts/inject-course-objectives.mjs --dry-run  # list, no writes
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

const COPY = {
  en: { summary: "What you'll be able to do by the end" },
  es: { summary: "Lo que vas a poder hacer al final" }
};

const SENTINEL_START = '<!-- course-objectives:start -->';
const SENTINEL_END   = '<!-- course-objectives:end -->';
const SENTINEL_RE    = /\n?\s*<!-- course-objectives:start -->[\s\S]*?<!-- course-objectives:end -->\n?/;

// Anchor: right after <p class="lead">...</p> if present, else right
// after <article class="course-body" id="post-body">. We capture the
// whole tag + a trailing newline so the insertion lines up cleanly.
const ANCHOR_LEAD_RE = /(<p class="lead">[\s\S]*?<\/p>\n)/;
const ANCHOR_ART_RE  = /(<article class="course-body" id="post-body">\n)/;

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildBlock(objectives, locale) {
  const summary = (COPY[locale] || COPY.en).summary;
  const items = objectives.map((o) => '          <li>' + escHtml(o) + '</li>').join('\n');
  const css = [
    '<style>',
    '.course-objectives{margin:18px 0 24px;padding:0;border:1px solid var(--line);border-radius:8px;background:var(--cream-2);max-width:680px}',
    '.course-objectives summary{padding:12px 16px;font-family:var(--font-body);font-size:13px;letter-spacing:.04em;text-transform:uppercase;font-weight:700;color:var(--teal-dark);cursor:pointer;list-style:none;position:relative;padding-right:36px}',
    '.course-objectives summary::-webkit-details-marker{display:none}',
    '.course-objectives summary::after{content:"+";position:absolute;right:16px;top:50%;transform:translateY(-50%);font-size:18px;line-height:1;color:var(--stone);font-weight:300}',
    '.course-objectives[open] summary::after{content:"−"}',
    '.course-objectives summary:focus-visible{outline:2px solid var(--teal);outline-offset:-2px;border-radius:8px 8px 0 0}',
    '.course-objectives ul{margin:0;padding:0 22px 14px 38px;font-size:14.5px;line-height:1.55;color:var(--ink-soft)}',
    '.course-objectives li{margin-bottom:4px}',
    '.course-objectives li:last-child{margin-bottom:0}',
    '@media (prefers-contrast:more){.course-objectives ul{color:var(--ink)}}',
    '</style>'
  ].join('');
  return [
    SENTINEL_START,
    '      ' + css,
    '      <details class="course-objectives">',
    '        <summary>' + escHtml(summary) + '</summary>',
    '        <ul>',
    items,
    '        </ul>',
    '      </details>',
    '      ' + SENTINEL_END
  ].join('\n');
}

function lessonHtmlPath(lesson, locale) {
  const rel = lesson.path.replace(/^\//, '').replace(/\/$/, '');
  const base = locale === 'es' ? path.join(repoRoot, 'es', rel) : path.join(repoRoot, rel);
  return path.join(base, 'index.html');
}

function transform(src, objectives, locale) {
  if (!objectives || !objectives.length) return null;
  const block = buildBlock(objectives, locale);
  if (SENTINEL_RE.test(src)) {
    const next = src.replace(SENTINEL_RE, '\n' + block + '\n');
    return next === src ? null : next;
  }
  // Insert right after <p class="lead">...</p> if present
  if (ANCHOR_LEAD_RE.test(src)) {
    return src.replace(ANCHOR_LEAD_RE, '$1' + block + '\n');
  }
  // Fallback: insert right after the article tag
  if (ANCHOR_ART_RE.test(src)) {
    return src.replace(ANCHOR_ART_RE, '$1' + block + '\n');
  }
  return undefined;
}

let stamped = 0;
let unchanged = 0;
let skipped = 0;
let noObj = 0;
const noAnchor = [];

for (const lesson of manifest.lessons) {
  if (!lesson.objectives) { noObj++; continue; }
  for (const locale of ['en', 'es']) {
    const filePath = lessonHtmlPath(lesson, locale);
    if (!fs.existsSync(filePath)) { skipped++; continue; }
    const objectives = lesson.objectives[locale] || lesson.objectives.en;
    const src = fs.readFileSync(filePath, 'utf8');
    const result = transform(src, objectives, locale);
    if (result === null) { unchanged++; continue; }
    if (result === undefined) {
      noAnchor.push(path.relative(repoRoot, filePath));
      continue;
    }
    stamped++;
    if (!checkOnly && !dryRun) fs.writeFileSync(filePath, result);
  }
}

if (noAnchor.length) {
  console.warn(`\ninject-course-objectives: ${noAnchor.length} lesson page(s) missing both <p class="lead"> and <article class="course-body" id="post-body"> anchors — skipped:`);
  for (const p of noAnchor) console.warn(`  ${p}`);
}

console.log(`inject-course-objectives: ${stamped} stamped, ${unchanged} unchanged, ${skipped} skipped (lesson page missing), ${noObj} lesson(s) without objectives in manifest.`);

if (checkOnly && stamped > 0) {
  console.error(`inject-course-objectives: ${stamped} file(s) would change under --check (exit 1).`);
  process.exit(1);
}
process.exit(0);
