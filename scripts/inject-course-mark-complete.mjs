#!/usr/bin/env node
/**
 * Stamp a 'mark this lesson complete' affordance + a lesson-view
 * Plausible-event tracker into every Open the Doors bootcamp page,
 * idempotently. The button writes to localStorage (anonymous) and
 * /api/course/progress (signed-in); both update the account-page tile
 * + the future hub progress indicator.
 *
 * Insertion anchor: right before the <nav class="course-pager"> on
 * every lesson page. Sentinel block is a self-contained <style> +
 * <div> + <script> unit so the stamper can refresh or remove it
 * cleanly without touching anything around it.
 *
 * The stamped script runs on every lesson page and:
 *   - Reads body data-course-{module,lesson,position} for the
 *     Plausible event props.
 *   - Fires 'Course Lesson View' on page load (debounced via
 *     sessionStorage so reload-storm doesn't double-count — same
 *     posture as first-touch.js).
 *   - Reads mtn:course:progress from localStorage on mount; if this
 *     lesson is already in completed[], starts the button in the
 *     'Completed ✓' state.
 *   - On click: appends a { lesson, at: Date.now() } entry to
 *     localStorage and POSTs to /api/course/progress (anonymous
 *     callers get 401 from the route — handled silently). Fires
 *     'Course Lesson Complete'. Flips the button state.
 *
 * Usage:
 *   node scripts/inject-course-mark-complete.mjs            # rewrite
 *   node scripts/inject-course-mark-complete.mjs --check    # exit 1 if any change
 *   node scripts/inject-course-mark-complete.mjs --dry-run  # list, no writes
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

const SENTINEL_START = '<!-- course-mark-complete:start -->';
const SENTINEL_END   = '<!-- course-mark-complete:end -->';
const SENTINEL_RE    = /\n?\s*<!-- course-mark-complete:start -->[\s\S]*?<!-- course-mark-complete:end -->\n?/;

// Anchor: right before the lesson's nav class="course-pager". Captures
// the leading whitespace so the inserted block lines up. Lessons are
// hand-authored so the indent is consistent (six spaces).
const ANCHOR_RE = /(\n\s*<nav class="course-pager")/;

/**
 * Build the complete sentinel block — <style> + <div> + <script>.
 * Locale-agnostic at the markup level; the inline script picks copy
 * by reading <html lang>. That keeps both EN and ES pages byte-
 * identical at the sentinel boundary so the stamper round-trips cleanly.
 */
function buildBlock() {
  const css = [
    '<style>',
    '.course-mc{margin:48px 0 0;padding:22px 24px;border:1px dashed var(--line);border-radius:10px;background:var(--cream)}',
    '.course-mc-btn{display:inline-flex;align-items:center;gap:10px;padding:12px 22px;font-family:var(--font-body);font-size:15px;font-weight:600;border-radius:99px;border:1.5px solid var(--teal);background:var(--teal);color:#FAF7F2;cursor:pointer;transition:transform .08s ease}',
    '.course-mc-btn:hover{transform:translateY(-1px)}',
    '.course-mc-btn:focus-visible{outline:2px solid var(--teal-dark);outline-offset:2px}',
    '.course-mc-btn[data-state="saving"]{opacity:.7;cursor:wait}',
    '.course-mc-btn[data-state="done"]{background:var(--cream);color:var(--teal-dark);border-color:var(--status-good)}',
    '.course-mc-btn[data-state="done"] .icon{color:var(--status-good)}',
    '.course-mc-btn[data-state="error"]{background:var(--cream);color:var(--rust);border-color:var(--rust)}',
    '.course-mc-help{margin:10px 0 0;font-size:13px;color:var(--stone);line-height:1.5}',
    '.course-mc-help a{color:var(--teal);font-weight:600}',
    '</style>'
  ].join('');

  const html = [
    '<aside class="course-mc" aria-labelledby="courseMcH">',
    '  <h2 id="courseMcH" class="sr-only" data-i18n="mark.heading">Mark this lesson complete</h2>',
    '  <button type="button" class="course-mc-btn" id="courseMarkBtn" data-state="idle">',
    '    <span class="icon" aria-hidden="true">✓</span>',
    '    <span class="course-mc-label" data-i18n="mark.idle">Mark this lesson complete</span>',
    '  </button>',
    '  <p class="course-mc-help" data-i18n="mark.help">Saved in this browser. <a href="/sign-in/" data-i18n-href="mark.signin-href">Sign in</a> to sync across devices.</p>',
    '</aside>'
  ].join('\n      ');

  const script = [
    '<script>',
    '/*',
    ' * Mark-complete + lesson-view tracker. Stamped by',
    ' * scripts/inject-course-mark-complete.mjs into every Open the Doors',
    ' * lesson page. Reads body data-course-* attributes for the Plausible',
    ' * event props; writes localStorage["mtn:course:progress"]; POSTs to',
    ' * /api/course/progress for signed-in operators.',
    ' */',
    '(function () {',
    '  if (typeof window === "undefined" || !document.body) return;',
    '  var body = document.body;',
    '  var moduleAttr   = body.getAttribute("data-course-module")   || "";',
    '  var lessonAttr   = body.getAttribute("data-course-lesson")   || "";',
    '  var positionAttr = body.getAttribute("data-course-position") || "";',
    '  if (!lessonAttr) return;',
    '  var locale = (document.documentElement.getAttribute("lang") || "en").toLowerCase().startsWith("es") ? "es" : "en";',
    '  var L = locale === "es" ? {',
    '    heading: "Marcar esta lección como completa",',
    '    idle: "Marcar esta lección como completa",',
    '    saving: "Guardando…",',
    '    done: "Lección completada",',
    '    error: "Error al guardar — reintenta",',
    '    help: "Guardado en este navegador. <a href=\\"/es/sign-in/\\">Inicia sesión</a> para sincronizar entre dispositivos.",',
    '    signinHref: "/es/sign-in/"',
    '  } : {',
    '    heading: "Mark this lesson complete",',
    '    idle: "Mark this lesson complete",',
    '    saving: "Saving…",',
    '    done: "Lesson complete",',
    '    error: "Save failed — retry",',
    '    help: "Saved in this browser. <a href=\\"/sign-in/\\">Sign in</a> to sync across devices.",',
    '    signinHref: "/sign-in/"',
    '  };',
    '',
    '  // ---- Plausible: Course Lesson View (debounced per session) ----',
    '  try {',
    '    var viewKey = "mtn:course:view:" + lessonAttr;',
    '    if (typeof window.plausible === "function" && !sessionStorage.getItem(viewKey)) {',
    '      window.plausible("Course Lesson View", { props: { module: moduleAttr, lesson: lessonAttr, locale: locale } });',
    '      sessionStorage.setItem(viewKey, "1");',
    '    }',
    '  } catch (_) { /* analytics is best-effort */ }',
    '',
    '  // ---- Localize the stamped copy now that locale is known ----',
    '  var heading = document.getElementById("courseMcH");',
    '  if (heading) heading.textContent = L.heading;',
    '  var labels = document.querySelectorAll(".course-mc-label[data-i18n=\\"mark.idle\\"]");',
    '  for (var i = 0; i < labels.length; i++) labels[i].textContent = L.idle;',
    '  var helps = document.querySelectorAll(".course-mc-help[data-i18n=\\"mark.help\\"]");',
    '  for (var j = 0; j < helps.length; j++) helps[j].innerHTML = L.help;',
    '',
    '  var btn = document.getElementById("courseMarkBtn");',
    '  if (!btn) return;',
    '  var labelEl = btn.querySelector(".course-mc-label");',
    '',
    '  function setState(state, label) {',
    '    btn.setAttribute("data-state", state);',
    '    if (labelEl && label) labelEl.textContent = label;',
    '    if (state === "saving") btn.disabled = true;',
    '    else btn.disabled = (state === "done");  // once marked complete, button stays clicked-disabled',
    '  }',
    '',
    '  // ---- Read local progress; mark this lesson done if it\'s in the saved list ----',
    '  var STORAGE_KEY = "mtn:course:progress";',
    '  function readLocal() {',
    '    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || null; }',
    '    catch (_) { return null; }',
    '  }',
    '  function writeLocal(next) {',
    '    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }',
    '    catch (_) { /* private mode or quota — silently degrade */ }',
    '  }',
    '  var local = readLocal();',
    '  var alreadyDone = local && Array.isArray(local.completed) && local.completed.some(function (e) { return e && e.lesson === lessonAttr; });',
    '  if (alreadyDone) setState("done", L.done);',
    '',
    '  btn.addEventListener("click", function () {',
    '    if (btn.disabled) return;',
    '    setState("saving", L.saving);',
    '',
    '    var now = Date.now();',
    '    var next = local || { track: null, completed: [], startedAt: now, updatedAt: now, v: 1 };',
    '    var existing = Array.isArray(next.completed) ? next.completed : [];',
    '    if (!existing.some(function (e) { return e && e.lesson === lessonAttr; })) {',
    '      existing.push({ lesson: lessonAttr, at: now });',
    '    }',
    '    next.completed = existing;',
    '    next.updatedAt = now;',
    '    if (!next.startedAt) next.startedAt = now;',
    '    writeLocal(next);',
    '    local = next;',
    '',
    '    // POST to /api/course/progress — fire-and-forget for anonymous',
    '    // callers (401 is fine; the localStorage write covered them).',
    '    var didFinish = false;',
    '    function finish(ok) {',
    '      if (didFinish) return;',
    '      didFinish = true;',
    '      setState(ok ? "done" : "done", L.done);  // even on POST failure the localStorage write succeeded',
    '      try {',
    '        if (typeof window.plausible === "function") {',
    '          window.plausible("Course Lesson Complete", { props: { module: moduleAttr, lesson: lessonAttr, locale: locale } });',
    '        }',
    '      } catch (_) { /* analytics is best-effort */ }',
    '    }',
    '',
    '    try {',
    '      fetch("/api/course/progress", {',
    '        method: "POST",',
    '        credentials: "same-origin",',
    '        headers: { "content-type": "application/json" },',
    '        body: JSON.stringify({ completed: [{ lesson: lessonAttr, at: now }] })',
    '      }).then(function (r) { finish(r.ok || r.status === 401); })',
    '        .catch(function () { finish(true); });',
    '    } catch (_) {',
    '      finish(true);',
    '    }',
    '    // Hard fallback: if neither resolve nor catch fires in 4s, still finish.',
    '    setTimeout(function () { finish(true); }, 4000);',
    '  });',
    '})();',
    '</script>'
  ].join('\n      ');

  return [
    SENTINEL_START,
    '      ' + css,
    '      ' + html,
    '      ' + script,
    '      ' + SENTINEL_END
  ].join('\n');
}

function lessonHtmlPath(lesson, locale) {
  const rel = lesson.path.replace(/^\//, '').replace(/\/$/, '');
  const base = locale === 'es' ? path.join(repoRoot, 'es', rel) : path.join(repoRoot, rel);
  return path.join(base, 'index.html');
}

function transform(src) {
  const block = buildBlock();
  if (SENTINEL_RE.test(src)) {
    const next = src.replace(SENTINEL_RE, '\n' + block + '\n');
    return next === src ? null : next;
  }
  if (!ANCHOR_RE.test(src)) return undefined;  // skip — caller logs as a failure
  return src.replace(ANCHOR_RE, '\n' + block + '$1');
}

let stamped = 0;
let unchanged = 0;
let skipped = 0;
const noAnchor = [];

for (const lesson of manifest.lessons) {
  for (const locale of ['en', 'es']) {
    const filePath = lessonHtmlPath(lesson, locale);
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
}

if (noAnchor.length) {
  console.warn(`\ninject-course-mark-complete: ${noAnchor.length} lesson page(s) missing the <nav class="course-pager"> anchor — skipped:`);
  for (const f of noAnchor.slice(0, 5)) console.warn(`  ${f}`);
  if (noAnchor.length > 5) console.warn(`  …and ${noAnchor.length - 5} more`);
}

console.log(`inject-course-mark-complete: ${stamped} stamped, ${unchanged} unchanged, ${skipped} skipped (lesson page missing).`);

if (checkOnly && stamped > 0) {
  console.error(`inject-course-mark-complete: ${stamped} file(s) would change under --check (exit 1).`);
  process.exit(1);
}
process.exit(0);
