#!/usr/bin/env node
// Course-specific locale-parity check for the Open the Doors bootcamp.
//
// Sibling of scripts/check-locale-parity.mjs but scoped to /course/ +
// /es/course/. The bootcamp's drift modes are more specific than the
// rest of the site: lesson position numbers, widget instance sets,
// and context-key wiring all need to line up between EN and ES or the
// readiness checklist and rail will read different data on the two
// sides.
//
// Runs in two modes:
//   node scripts/check-course-locale-parity.mjs          # report + exit 0
//   node scripts/check-course-locale-parity.mjs --check  # exit 1 on drift
//
// Drift categories:
//   1. EN lesson page has no ES counterpart (or vice versa).
//   2. The two pages disagree on body data-course-{position,module,
//      lesson,track,total}.
//   3. The two pages mount different widget sets (different
//      data-widget values across .course-widget sections).
//   4. The two pages capture different context keys (different
//      data-context-key values across .course-widget sections).
//   5. Different number of widget instances per data-widget tag.
//
// Items 3-5 are warnings by default but escalate to errors under
// --check. They protect the lesson-level invariant: an EN operator and
// an ES operator working through the same lesson save data to the
// same context shape, so the L14 readiness checklist + rail render
// the same site regardless of locale.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const EN_ROOT = path.join(repoRoot, 'course');
const ES_ROOT = path.join(repoRoot, 'es', 'course');

function collectHtml(dir, out = [], base = dir) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtml(full, out, base);
    } else if (entry.isFile() && entry.name === 'index.html') {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out;
}

// Skip the hub + module-overview pages from the lesson-only parity
// checks — they don't carry data-course-position/lesson and don't
// mount Workshop Kit widgets at the same density. They still get the
// existence check.
function isLesson(rel) {
  const segments = rel.split('/').filter(Boolean);
  // course/m{n}-<name>/<lesson-slug>/index.html  → 3 segments
  // course/m{n}-<name>/<fork>/<lesson-slug>/index.html  → 4 segments
  return segments.length >= 3 && (segments[0].startsWith('m') || segments[1].startsWith('m')) && segments[segments.length - 1] === 'index.html';
}

function attr(html, name) {
  const re = new RegExp('\\b' + name + '\\s*=\\s*"([^"]*)"');
  const m = html.match(re);
  return m ? m[1] : null;
}

function extractCourseMeta(html) {
  return {
    position: attr(html, 'data-course-position'),
    module:   attr(html, 'data-course-module'),
    lesson:   attr(html, 'data-course-lesson'),
    track:    attr(html, 'data-course-track'),
    total:    attr(html, 'data-course-total')
  };
}

function extractWidgetTags(html) {
  const tags = [];
  const re = /class="course-widget"[^>]*\bdata-widget="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) tags.push(m[1]);
  return tags;
}

function extractContextKeys(html) {
  const keys = [];
  const re = /\bdata-context-key="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) keys.push(m[1]);
  return keys;
}

function counts(arr) {
  const c = {};
  for (const v of arr) c[v] = (c[v] || 0) + 1;
  return c;
}

function diffCounts(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const diffs = [];
  for (const k of keys) {
    if ((a[k] || 0) !== (b[k] || 0)) diffs.push({ key: k, en: a[k] || 0, es: b[k] || 0 });
  }
  return diffs;
}

const enLessons = new Set(collectHtml(EN_ROOT));
const esLessons = new Set(collectHtml(ES_ROOT));

const orphans = { enOnly: [], esOnly: [] };
const metaDrift = [];
const widgetDrift = [];
const contextKeyDrift = [];

for (const rel of enLessons) {
  if (!esLessons.has(rel)) {
    orphans.enOnly.push(rel);
    continue;
  }
  if (!isLesson(rel)) continue;

  const enSrc = fs.readFileSync(path.join(EN_ROOT, rel), 'utf8');
  const esSrc = fs.readFileSync(path.join(ES_ROOT, rel), 'utf8');

  const enMeta = extractCourseMeta(enSrc);
  const esMeta = extractCourseMeta(esSrc);
  for (const k of ['position', 'module', 'lesson', 'track', 'total']) {
    if (enMeta[k] !== esMeta[k]) {
      metaDrift.push({ rel, field: k, en: enMeta[k], es: esMeta[k] });
    }
  }

  const enTags = extractWidgetTags(enSrc);
  const esTags = extractWidgetTags(esSrc);
  const tagDiffs = diffCounts(counts(enTags), counts(esTags));
  for (const d of tagDiffs) widgetDrift.push({ rel, ...d });

  const enKeys = extractContextKeys(enSrc);
  const esKeys = extractContextKeys(esSrc);
  const keyDiffs = diffCounts(counts(enKeys), counts(esKeys));
  for (const d of keyDiffs) contextKeyDrift.push({ rel, ...d });
}

for (const rel of esLessons) {
  if (!enLessons.has(rel)) orphans.esOnly.push(rel);
}

let hadFindings = false;

function pluralize(n, singular, plural) {
  return n === 1 ? `1 ${singular}` : `${n} ${plural}`;
}

if (orphans.enOnly.length) {
  hadFindings = true;
  console.log('\n[course-parity] EN lesson(s) without an ES counterpart:');
  for (const rel of orphans.enOnly) console.log(`  course/${rel}  →  es/course/${rel} MISSING`);
}

if (orphans.esOnly.length) {
  hadFindings = true;
  console.log('\n[course-parity] ES lesson(s) without an EN counterpart:');
  for (const rel of orphans.esOnly) console.log(`  es/course/${rel}  →  course/${rel} MISSING`);
}

if (metaDrift.length) {
  hadFindings = true;
  console.log(`\n[course-parity] Body data-course-* metadata drift (${pluralize(metaDrift.length, 'mismatch', 'mismatches')}):`);
  for (const d of metaDrift) console.log(`  ${d.rel}  data-course-${d.field}: EN="${d.en}" ES="${d.es}"`);
}

if (widgetDrift.length) {
  hadFindings = true;
  console.log(`\n[course-parity] Widget-instance count drift (${pluralize(widgetDrift.length, 'difference', 'differences')}):`);
  for (const d of widgetDrift) console.log(`  ${d.rel}  data-widget="${d.key}": EN×${d.en} ES×${d.es}`);
}

if (contextKeyDrift.length) {
  hadFindings = true;
  console.log(`\n[course-parity] Context-key drift (${pluralize(contextKeyDrift.length, 'difference', 'differences')}):`);
  for (const d of contextKeyDrift) console.log(`  ${d.rel}  data-context-key="${d.key}": EN×${d.en} ES×${d.es}`);
}

const enCount = [...enLessons].filter(isLesson).length;
const esCount = [...esLessons].filter(isLesson).length;

console.log(`\n[course-parity] Scanned: ${enCount} EN lesson page(s), ${esCount} ES lesson page(s).`);

if (!hadFindings) {
  console.log('[course-parity] OK — no drift detected.');
  process.exit(0);
} else if (checkMode) {
  console.log('\n[course-parity] FAIL — drift detected (exit 1 in --check mode).');
  process.exit(1);
} else {
  console.log('\n[course-parity] WARN — drift detected (exit 0 outside --check mode).');
  process.exit(0);
}
