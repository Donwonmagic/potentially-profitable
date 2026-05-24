#!/usr/bin/env node
/**
 * Stamp a <button id="listen-btn"> into every course lesson page that
 * has a recorded audio narration on disk, idempotently. Removes the
 * button cleanly when the audio file is deleted.
 *
 * Why this script exists: per the Method plan, each bootcamp lesson
 * can ship an optional ~5–8 min audio narration in the operator's
 * voice (Don). The audio files live at
 *
 *   audio/course/<slug>.mp3      — EN
 *   audio/course/<slug>.es.mp3   — ES
 *
 * The lesson HTML pages are hand-authored and don't know about the
 * audio. This script bridges the two: it walks data/course-lessons.json,
 * checks for the existence of each lesson's audio file, and stamps
 * (or removes) the listen-btn accordingly. The runtime player at
 * /assets/js/listen.js upgrades the simple <button> into the rich
 * .listen-card UI used by the rest of the site.
 *
 * The script silently no-ops on missing audio files — until Don records
 * one and drops it into place, the lesson stays text-only. ES lessons
 * get their own narration or skip independently of EN.
 *
 * Usage:
 *   node scripts/inject-course-listen.mjs            # rewrite in place
 *   node scripts/inject-course-listen.mjs --check    # exit 1 if any change
 *   node scripts/inject-course-listen.mjs --dry-run  # list, no writes
 *
 * Sentinel block (idempotent insertion + removal):
 *
 *   <!-- course-listen:start -->
 *   <div class="row-center">…<button id="listen-btn">…</button></div>
 *   <!-- course-listen:end -->
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
if (!fs.existsSync(MANIFEST_PATH)) {
  console.error('inject-course-listen: manifest not found at data/course-lessons.json');
  process.exit(2);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

const AUDIO_DIR = path.join(repoRoot, 'audio', 'course');

const LABEL = {
  en: 'Listen to this lesson',
  es: 'Escuchar esta lección'
};

const SENTINEL_START = '<!-- course-listen:start -->';
const SENTINEL_END   = '<!-- course-listen:end -->';
const SENTINEL_RE    = /\n?\s*<!-- course-listen:start -->[\s\S]*?<!-- course-listen:end -->\n?/;

// listen.js script-tag sentinel — lesson pages don't ship site.js, so
// inject-article-listen.mjs (which anchors to site.js) never reaches
// them. We carry the script-tag injection here, gated on the same
// "audio present" signal as the button itself.
const SCRIPT_START = '<!-- course-listen-script:start -->';
const SCRIPT_END   = '<!-- course-listen-script:end -->';
const SCRIPT_RE    = /\n?\s*<!-- course-listen-script:start -->[\s\S]*?<!-- course-listen-script:end -->\n?/;
const LISTEN_SCRIPT_TAG = '<script src="/assets/js/listen.js" defer></script>';

// Insertion anchors:
//   1. Button: right after the <article class="course-body"> opening
//      tag, before the first child (typically <p class="lead">).
//   2. Script tag: right before the closing </body>. The other course
//      scripts (workshop-widget.js, context-bus.js) sit there too.
const ANCHOR_BUTTON_RE = /(<article\s+class="course-body">\s*)/;
const ANCHOR_BODY_END_RE = /(\s*<\/body>)/;

function audioPathFor(lessonId, locale) {
  const fname = locale === 'es' ? `${lessonId}.es.mp3` : `${lessonId}.mp3`;
  return path.join(AUDIO_DIR, fname);
}

function audioHrefFor(lessonId, locale) {
  // Absolute URL path for the rendered <button data-audio-src="…">.
  // The renderer ships from /audio/course/, mirroring the source layout.
  return locale === 'es'
    ? `/audio/course/${lessonId}.es.mp3`
    : `/audio/course/${lessonId}.mp3`;
}

function buildListenButton(lessonId, locale) {
  const label = LABEL[locale] || LABEL.en;
  const audioHref = audioHrefFor(lessonId, locale);
  // Layout: same shape as the article listen-btn pattern (a single
  // button that listen.js upgrades to a full .listen-card on hydration).
  // Wrapping <div class="row-center"> matches the article-side
  // convention so any future shared CSS picks up both surfaces.
  return [
    SENTINEL_START,
    '      <div class="row-center" style="margin:0 0 22px">',
    `        <button type="button" id="listen-btn" class="listen-btn" aria-pressed="false" data-state="idle" data-audio-src="${audioHref}" data-audio-languages="en,es">`,
    '          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
    '            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>',
    '            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>',
    '            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    '          </svg>',
    `          <span class="listen-label i18n">${label}</span>`,
    '        </button>',
    '      </div>',
    `      ${SENTINEL_END}`
  ].join('\n');
}

function lessonHtmlPath(lesson, locale) {
  // Convert the manifest's /course/m1-orient/welcome/ path to an
  // absolute file path, optionally under /es/.
  const rel = lesson.path.replace(/^\//, '').replace(/\/$/, '');
  const base = locale === 'es' ? path.join(repoRoot, 'es', rel) : path.join(repoRoot, rel);
  return path.join(base, 'index.html');
}

function transform(src, lesson, locale) {
  const hasAudio = fs.existsSync(audioPathFor(lesson.id, locale));
  const hasButtonSentinel = SENTINEL_RE.test(src);
  const hasScriptSentinel = SCRIPT_RE.test(src);

  let next = src;

  if (!hasAudio) {
    // Audio missing — strip both stale sentinels if present. The
    // SENTINEL_RE consumed the trailing \n; the following line's own
    // indent stays intact, so we replace with just a single newline
    // to reconstruct the original byte layout exactly.
    if (!hasButtonSentinel && !hasScriptSentinel) return null;
    if (hasButtonSentinel) next = next.replace(SENTINEL_RE, '\n');
    if (hasScriptSentinel) next = next.replace(SCRIPT_RE, '\n');
    return next === src ? null : next;
  }

  // Audio present — insert (or refresh) both sentinel blocks.
  const button = buildListenButton(lesson.id, locale);
  const scriptBlock = [
    SCRIPT_START,
    LISTEN_SCRIPT_TAG,
    SCRIPT_END
  ].join('\n');

  if (hasButtonSentinel) {
    next = next.replace(SENTINEL_RE, '\n      ' + button + '\n      ');
  } else {
    if (!ANCHOR_BUTTON_RE.test(next)) {
      return undefined; // no <article class="course-body"> anchor; skip + log
    }
    next = next.replace(ANCHOR_BUTTON_RE, '$1' + button + '\n      ');
  }

  if (hasScriptSentinel) {
    next = next.replace(SCRIPT_RE, '\n' + scriptBlock + '\n');
  } else if (ANCHOR_BODY_END_RE.test(next)) {
    next = next.replace(ANCHOR_BODY_END_RE, '\n' + scriptBlock + '$1');
  }
  // If </body> is missing for some reason (shouldn't be in our lessons)
  // we silently skip the script injection — the button-only state is
  // safe (listen.js falls back to Web Speech if loaded, no-op if not).

  return next === src ? null : next;
}

let stamped = 0;
let removed = 0;
let skipped = 0;
let unchanged = 0;
const noAnchor = [];

for (const lesson of manifest.lessons) {
  for (const locale of ['en', 'es']) {
    const filePath = lessonHtmlPath(lesson, locale);
    if (!fs.existsSync(filePath)) { skipped++; continue; }

    const src = fs.readFileSync(filePath, 'utf8');
    const result = transform(src, lesson, locale);

    if (result === null) { unchanged++; continue; }
    if (result === undefined) {
      noAnchor.push(path.relative(repoRoot, filePath));
      continue;
    }

    const hasAudio = fs.existsSync(audioPathFor(lesson.id, locale));
    if (hasAudio) stamped++;
    else removed++;

    if (!checkOnly && !dryRun) fs.writeFileSync(filePath, result);
  }
}

const totalChanged = stamped + removed;

if (noAnchor.length) {
  console.warn(`\ninject-course-listen: ${noAnchor.length} lesson page(s) missing the <article class="course-body"> anchor — skipped:`);
  for (const f of noAnchor.slice(0, 5)) console.warn(`  ${f}`);
  if (noAnchor.length > 5) console.warn(`  …and ${noAnchor.length - 5} more`);
}

const audioFilesPresent = fs.existsSync(AUDIO_DIR)
  ? fs.readdirSync(AUDIO_DIR).filter((f) => f.endsWith('.mp3')).length
  : 0;

console.log(`inject-course-listen: ${audioFilesPresent} audio file(s) present at audio/course/. ` +
  `${stamped} stamped, ${removed} removed (stale sentinel cleared), ${unchanged} unchanged, ${skipped} skipped (lesson page missing).`);

if (checkOnly && totalChanged > 0) {
  console.error(`inject-course-listen: ${totalChanged} file(s) would change under --check (exit 1).`);
  process.exit(1);
}
process.exit(0);
