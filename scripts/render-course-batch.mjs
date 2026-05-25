#!/usr/bin/env node
/**
 * Batch-render audio narration for every pending Open the Doors lesson.
 *
 * Reads data/article-audio.json's "course" + "es-course" sections,
 * walks every entry with status="pending", and either prints (default)
 * or executes (--run) the scripts/render-post-audio.mjs invocation
 * needed to produce that lesson's audio.mp3 + audio.json next to its
 * page.
 *
 * Why a wrapper exists at all:
 * - 20 lessons × 2 locales × ~5–8 min audio each × 6 languages
 *   = ~30+ render hours on a CPU. A single typo in the per-lesson
 *   command would silently render the wrong thing for hours. The
 *   wrapper builds the invocation from the manifest so there's one
 *   spot to misspell something.
 * - Defaults to PRINT-ONLY mode: it shows you the commands it WOULD
 *   run. Pass --run to actually execute. Lets you preview which
 *   lessons are pending and which engine/language combo will fire
 *   before the multi-hour batch begins.
 *
 * Usage:
 *
 *   # Preview what would run (default — print-only, no execution):
 *   node scripts/render-course-batch.mjs
 *
 *   # Filter to one locale:
 *   node scripts/render-course-batch.mjs --locale en
 *   node scripts/render-course-batch.mjs --locale es
 *
 *   # Filter to one lesson slug (matches against the manifest key):
 *   node scripts/render-course-batch.mjs --slug m1-orient/welcome
 *
 *   # Filter languages emitted per lesson (default: en,es,fr,it,pt,zh):
 *   node scripts/render-course-batch.mjs --languages en
 *   node scripts/render-course-batch.mjs --languages en,es
 *
 *   # Engine selection — F5 voice-clone for EN, Kokoro for the rest
 *   # (default). Other valid engines per render-post-audio.mjs:
 *   # kokoro (all langs Kokoro), piper (fallback).
 *   node scripts/render-course-batch.mjs --engine f5
 *
 *   # Actually run the renders (sequential, one lesson at a time):
 *   node scripts/render-course-batch.mjs --run \
 *     --kokoro-model /path/to/kokoro-v1.0.onnx \
 *     --kokoro-voices /path/to/voices-v1.0.bin
 *
 * After rendering, run scripts/inject-course-listen.mjs to stamp the
 * listen-btn + listen.js script tag into every lesson page that now
 * has an audio.mp3 on disk. (Wired into check-all.mjs so a forgotten
 * run fails CI.)
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const args = process.argv.slice(2);
const argFlag = (name) => args.includes(name);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
};

const run         = argFlag('--run');
const list        = argFlag('--list');         // print one line per pending lesson, no command
const estimate    = argFlag('--estimate');     // print expected time per lesson + total
const resume      = argFlag('--resume');       // skip lessons whose audio.mp3 already exists
const localeFilter = argValue('--locale');     // 'en' or 'es' or null
const slugFilter   = argValue('--slug');       // exact slug match (manifest key)
const languages    = argValue('--languages') || 'en,es,fr,it,pt,zh';
const engine       = argValue('--engine')    || 'f5';
const kokoroModel  = argValue('--kokoro-model');
const kokoroVoices = argValue('--kokoro-voices');

// Per-language render-time estimate in minutes, per 5-min spoken
// duration. Calibrated empirically against a 2026 M2 MacBook Air
// (8 GB, 8-core CPU). Adjust if your hardware differs.
const RENDER_MINS_PER_5MIN = {
  en: 6,   // F5-TTS — clones Don's voice, slower than Kokoro
  es: 4,   // Kokoro Spanish
  fr: 4,   // Kokoro French
  it: 4,   // Kokoro Italian
  pt: 4,   // Kokoro Portuguese
  zh: 5,   // Kokoro Mandarin — slightly slower due to longer phonemizer chain
  hi: 5,   // Kokoro Hindi
  ja: 5    // Kokoro Japanese
};

if (localeFilter && localeFilter !== 'en' && localeFilter !== 'es') {
  console.error(`render-course-batch: --locale must be "en" or "es" (got ${JSON.stringify(localeFilter)})`);
  process.exit(2);
}

const MANIFEST_PATH = path.join(repoRoot, 'data', 'article-audio.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

// Map each (section, slug) entry to a concrete file path the renderer
// understands. The renderer accepts <section-root>/<slug>; for the
// course it's "course/<slug>" or "es/course/<slug>".
const SECTION_TO_PATH_PREFIX = {
  course:   'course',
  'es-course': 'es/course'
};

function collectPending() {
  const out = [];
  for (const [sectionKey, sectionPathPrefix] of Object.entries(SECTION_TO_PATH_PREFIX)) {
    const locale = sectionKey === 'es-course' ? 'es' : 'en';
    if (localeFilter && localeFilter !== locale) continue;

    const entries = manifest[sectionKey] || {};
    for (const [slug, spec] of Object.entries(entries)) {
      if (slug.startsWith('_')) continue;
      if (!spec || typeof spec !== 'object') continue;
      if (slugFilter && slug !== slugFilter) continue;
      if (spec.status !== 'pending' && spec.status !== 'partial') continue;

      const targetPath = path.join(sectionPathPrefix, slug);
      const absDir = path.join(repoRoot, targetPath);
      const exists = fs.existsSync(path.join(absDir, 'index.html'));

      // --resume: skip lessons whose en audio is already produced.
      // We use the en audio as the canary because it's the first
      // language in the render pipeline; if it exists, the lesson
      // already started rendering (and probably succeeded for the
      // earliest-fired languages). Operator can re-run without
      // --resume to force a full re-render.
      const enAudio = path.join(absDir, 'audio.mp3');
      const alreadyRendered = fs.existsSync(enAudio);
      if (resume && alreadyRendered) continue;

      // Estimate time. Manifest spec.estDurationMin (if set) drives
      // the per-language wall-clock; otherwise default to 6 minutes
      // of spoken audio (typical bootcamp lesson length).
      const spokenMin = Number.isFinite(spec.estDurationMin) ? spec.estDurationMin : 6;
      const langs = languages.split(',').map((s) => s.trim()).filter(Boolean);
      let estMins = 0;
      for (const l of langs) {
        const perFive = RENDER_MINS_PER_5MIN[l] || 5;
        estMins += (spokenMin / 5) * perFive;
      }

      out.push({
        sectionKey, slug, locale, targetPath, exists,
        status: spec.status,
        alreadyRendered,
        spokenMin,
        estMins: Math.round(estMins)
      });
    }
  }
  return out;
}

function buildCommand(targetPath) {
  const argv = ['scripts/render-post-audio.mjs', targetPath];
  argv.push('--engine', engine);
  argv.push('--languages', languages);
  if (kokoroModel)  argv.push('--kokoro-model', kokoroModel);
  if (kokoroVoices) argv.push('--kokoro-voices', kokoroVoices);
  return argv;
}

const pending = collectPending();

if (!pending.length) {
  console.log('render-course-batch: nothing pending under the current filters.');
  process.exit(0);
}

console.log(`render-course-batch: ${pending.length} lesson(s) pending` +
  (localeFilter ? ` (locale=${localeFilter})` : '') +
  (slugFilter ? ` (slug=${slugFilter})` : '') +
  (resume ? ' (skipping already-rendered)' : '') +
  `. Engine=${engine}, languages=${languages}.\n`);

// --list mode: print one line per pending lesson and exit. Useful
// for "what's left?" surveys before kicking off a multi-hour batch.
if (list) {
  for (const p of pending) {
    const flag = p.alreadyRendered ? ' [partial — audio.mp3 exists]' : '';
    console.log(`  ${p.locale.padEnd(2)}  ${p.slug.padEnd(40)} ${p.status.padEnd(8)}${flag}`);
  }
  process.exit(0);
}

// --estimate mode: print expected render-time totals and exit.
// Helps an operator decide whether to start the batch now or after
// dinner service.
if (estimate) {
  const totalMins = pending.reduce((acc, p) => acc + p.estMins, 0);
  const totalHours = (totalMins / 60).toFixed(1);
  console.log(`Estimated render time across ${pending.length} lesson(s): ~${totalMins} minutes (${totalHours}h) on a 2026 M2 MacBook Air baseline.\n`);
  console.log('Per-lesson breakdown:');
  for (const p of pending) {
    console.log(`  ${p.locale.padEnd(2)}  ${p.slug.padEnd(40)} ~${p.estMins}m  (${p.spokenMin}min spoken × ${languages.split(',').length} langs)`);
  }
  console.log('\nThe estimate scales linearly with --languages. Drop languages to shorten.');
  process.exit(0);
}

if (!run) {
  console.log('Print-only mode. Pass --run to execute (and provide --kokoro-model + --kokoro-voices for the Kokoro engines).\n');
  console.log('Other useful flags:');
  console.log('  --list          one-line summary per pending lesson');
  console.log('  --estimate      expected wall-clock time across the batch');
  console.log('  --resume        skip lessons whose audio.mp3 already exists');
  console.log('  --languages X   comma-separated subset of en,es,fr,it,pt,zh,hi,ja\n');
}

// Pre-flight: warn about lessons whose index.html is missing — would
// fail per-lesson at runtime, surface here so the operator can fix
// the manifest first instead of waiting for the first lesson to
// throw during a multi-hour batch.
const missingIndex = pending.filter((p) => !p.exists);
if (missingIndex.length) {
  console.warn(`render-course-batch: ${missingIndex.length} pending lesson(s) have no index.html — would fail at render time:`);
  for (const p of missingIndex) console.warn(`  ${p.targetPath}/index.html missing`);
  console.warn('');
}

if (run && (!kokoroModel || !kokoroVoices) && (engine === 'f5' || engine === 'kokoro')) {
  console.error('render-course-batch: --run with engine=f5 or engine=kokoro requires --kokoro-model and --kokoro-voices.');
  console.error('Even with engine=f5, the non-English languages route through Kokoro for narration so the model files are needed.');
  process.exit(2);
}

let ok = 0, failed = 0;

for (const p of pending) {
  if (!p.exists) { failed++; continue; }
  const argv = buildCommand(p.targetPath);

  if (!run) {
    console.log('  node ' + argv.map((a) => a.includes(' ') ? `"${a}"` : a).join(' '));
    continue;
  }

  console.log(`\n[${p.targetPath}] starting render (engine=${engine}, langs=${languages})…`);
  const r = spawnSync(process.execPath, argv, {
    cwd: repoRoot,
    stdio: 'inherit'
  });
  if (r.status === 0) {
    ok++;
    console.log(`[${p.targetPath}] OK`);
  } else {
    failed++;
    console.error(`[${p.targetPath}] FAILED (exit ${r.status}).`);
    // Continue to the next lesson — one bad render shouldn't abort a
    // multi-hour batch. The summary at the bottom tells the operator
    // which ones to re-run individually.
  }
}

if (run) {
  console.log(`\nrender-course-batch: ${ok} ok, ${failed} failed of ${pending.length} attempted.`);
  if (failed > 0) process.exit(1);
}
process.exit(0);
