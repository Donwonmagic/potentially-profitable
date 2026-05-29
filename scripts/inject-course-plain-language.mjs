#!/usr/bin/env node
/**
 * Stamp a "Plain language version" <details> block at the top of
 * every Open the Doors lesson page (right after the course-objectives
 * block if present, else right after the <p class="lead">).
 *
 * Reads lesson.plainLanguage from data/course-lessons.json (added
 * per audit G-A2). The summary inside is targeted at a 6th-8th grade
 * reading level — short sentences, no metaphors, concrete verbs.
 *
 * Operators who want the full editorial register read past the
 * collapsed <details>. Operators who want the fast plain-language
 * recap click it open. Mirrors the inclusive-instruction pattern
 * UDL principle 3.1 ("Promote understanding across languages") names
 * as table stakes.
 *
 * Usage:
 *   node scripts/inject-course-plain-language.mjs            # rewrite in place
 *   node scripts/inject-course-plain-language.mjs --check    # exit 1 if any change
 *   node scripts/inject-course-plain-language.mjs --dry-run  # list, no writes
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
  en: { summary: "Plain language version — the fast read" },
  es: { summary: "Versión en lenguaje sencillo — la lectura rápida" }
};

const SENTINEL_START = '<!-- course-plain-language:start -->';
const SENTINEL_END   = '<!-- course-plain-language:end -->';
const SENTINEL_RE    = /\n?\s*<!-- course-plain-language:start -->[\s\S]*?<!-- course-plain-language:end -->\n?/;

// Anchor (in priority order):
// 1. Right after the course-objectives sentinel block
// 2. Right after <p class="lead">
// 3. Right after <article class="course-body" id="post-body">
const ANCHOR_OBJ_RE  = /(<!-- course-objectives:end -->\n)/;
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

function buildBlock(summaryText, locale) {
  const summaryLabel = (COPY[locale] || COPY.en).summary;
  const css = [
    '<style>',
    '.course-plain{margin:10px 0 22px;padding:0;border:1px solid var(--line);border-radius:8px;background:#FFF;max-width:680px}',
    '.course-plain summary{padding:12px 16px;font-family:var(--font-body);font-size:13px;letter-spacing:.04em;text-transform:uppercase;font-weight:700;color:var(--teal-dark);cursor:pointer;list-style:none;position:relative;padding-right:36px}',
    '.course-plain summary::-webkit-details-marker{display:none}',
    '.course-plain summary::after{content:"+";position:absolute;right:16px;top:50%;transform:translateY(-50%);font-size:18px;line-height:1;color:var(--stone);font-weight:300}',
    '.course-plain[open] summary::after{content:"−"}',
    '.course-plain summary:focus-visible{outline:2px solid var(--teal);outline-offset:-2px;border-radius:8px 8px 0 0}',
    '.course-plain p{margin:0;padding:0 18px 14px;font-size:15.5px;line-height:1.55;color:var(--ink)}',
    '.course-plain[open] summary{border-bottom:1px solid var(--line)}',
    '.course-plain[open] p{padding-top:12px}',
    '@media (prefers-contrast:more){.course-plain p{color:var(--ink)}}',
    '</style>'
  ].join('');
  return [
    SENTINEL_START,
    '      ' + css,
    '      <details class="course-plain">',
    '        <summary>' + escHtml(summaryLabel) + '</summary>',
    '        <p>' + escHtml(summaryText) + '</p>',
    '      </details>',
    '      ' + SENTINEL_END
  ].join('\n');
}

function lessonHtmlPath(lesson, locale) {
  const rel = lesson.path.replace(/^\//, '').replace(/\/$/, '');
  const base = locale === 'es' ? path.join(repoRoot, 'es', rel) : path.join(repoRoot, rel);
  return path.join(base, 'index.html');
}

function transform(src, summaryText, locale) {
  if (!summaryText) return null;
  const block = buildBlock(summaryText, locale);
  if (SENTINEL_RE.test(src)) {
    const next = src.replace(SENTINEL_RE, '\n' + block + '\n');
    return next === src ? null : next;
  }
  if (ANCHOR_OBJ_RE.test(src)) {
    return src.replace(ANCHOR_OBJ_RE, '$1' + block + '\n');
  }
  if (ANCHOR_LEAD_RE.test(src)) {
    return src.replace(ANCHOR_LEAD_RE, '$1' + block + '\n');
  }
  if (ANCHOR_ART_RE.test(src)) {
    return src.replace(ANCHOR_ART_RE, '$1' + block + '\n');
  }
  return undefined;
}

let stamped = 0;
let unchanged = 0;
let skipped = 0;
let noText = 0;
const noAnchor = [];

for (const lesson of manifest.lessons) {
  if (!lesson.plainLanguage) { noText++; continue; }
  for (const locale of ['en', 'es']) {
    const filePath = lessonHtmlPath(lesson, locale);
    if (!fs.existsSync(filePath)) { skipped++; continue; }
    const text = lesson.plainLanguage[locale] || lesson.plainLanguage.en;
    const src = fs.readFileSync(filePath, 'utf8');
    const result = transform(src, text, locale);
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
  console.warn(`\ninject-course-plain-language: ${noAnchor.length} lesson page(s) missing all expected anchors — skipped:`);
  for (const p of noAnchor) console.warn(`  ${p}`);
}

console.log(`inject-course-plain-language: ${stamped} stamped, ${unchanged} unchanged, ${skipped} skipped (lesson page missing), ${noText} lesson(s) without plainLanguage in manifest.`);

if (checkOnly && stamped > 0) {
  console.error(`inject-course-plain-language: ${stamped} file(s) would change under --check (exit 1).`);
  process.exit(1);
}
process.exit(0);
