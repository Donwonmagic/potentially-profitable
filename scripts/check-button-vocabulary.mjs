#!/usr/bin/env node
// Sprint 4 (Cohesion) — lock the site's button vocabulary.
//
// One canonical button family lives in assets/site.css under the
// "Button vocabulary (Sprint 4 — locked)" comment block:
//
//   .btn (base) × .btn-primary | .btn-ghost | .btn-link
//                × .btn-sm | (default) | .btn-lg
//                × .btn-danger (color modifier)
//
// Every interactive control should compose from these primitives.
// A short list of registered exceptions covers controls whose
// context warrants a divergent style (icon buttons in the nav,
// the audio-narration controls, etc.); see ALLOWED_EXCEPTIONS
// below.
//
// This script greps assets/site.css for class definitions whose
// name looks button-shaped (`.*-btn`, `.btn-*`, `.btn`) and warns
// when the discovered set differs from the canonical set + the
// registered exceptions. New button-shaped class? Add it to the
// allowlist (with a one-line justification) or refactor it to
// compose primitives.
//
// Modes:
//   node scripts/check-button-vocabulary.mjs         # report + exit 0 (warn-only)
//   node scripts/check-button-vocabulary.mjs --check # report + exit 1 if drift
//
// Sprint 4: warn-only. Sprint 16 flips --check to fail-CI.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const cssPath = path.join(repoRoot, 'assets', 'site.css');
const css     = fs.readFileSync(cssPath, 'utf8');

// Canonical button family. These are the classes that compose to
// produce every legal button on the site.
const CANONICAL = new Set([
  'btn',
  'btn-primary',
  'btn-ghost',
  'btn-link',
  'btn-danger',
  'btn-sm',
  'btn-lg',
]);

// Registered exceptions. Each is a class whose NAME contains "btn"
// or "button" but whose context warrants a divergent style. Each
// carries a one-line justification so future readers know it isn't
// drift. Add to this list rather than inventing a new ad-hoc class.
//
// (Other interactive controls without "btn" in the name — e.g.
// .nav-toggle, .lang-hint-accept, .form-submit, .mobile-search —
// don't need to be allowlisted here; this check only catches the
// "looks like a button by name" form. Those page-local controls
// are also documented in the // §Button vocabulary block of
// assets/site.css.)
const ALLOWED_EXCEPTIONS = new Map([
  ['nav-search-btn',     'Nav search trigger with kbd shortcut hint — fits the quiet nav vocabulary.'],
  ['share-btn',          'Share-card button at post-end — distinct white-on-cream contrast.'],
  ['listen-btn',         'Audio narration play button — multi-state with progress meter.'],
  ['listen-iconbtn',     'Audio narration mini icon button — square, used in the dock.'],
  ['listen-iconbtn-label','Sub-element of .listen-iconbtn (text label inside the icon button).'],
  ['score-pill-btn',     'Floating score pill on grader pages — fixed position, distinct shape.'],
  ['cmp-btn',            'Comparison-tool selector button — page-local rhythm.'],
  ['wsh-watch-btn',      'Workshop watch toggle — teal-on-hover marks the act of watching.'],
]);

// Locate every class definition that looks button-shaped:
//   .btn{...}                            base
//   .btn-foo, .btn-foo:hover {...}       variant
//   .foo-btn, .foo-btn:hover {...}       page-local
//   .listen-iconbtn-label                page-local sub-element of an exception
//
// Exclude utility-only patterns where "btn" is part of a longer
// token (e.g. ".btn-loading" is a state class on .btn — not a
// new button class).
const STATE_SUFFIXES = new Set(['loading', 'arrow', 'text']);

const CLASS_DEF_RE = /^\s*(\.[a-zA-Z_][a-zA-Z0-9_-]*)/gm;
const found = new Map();
let m;
while ((m = CLASS_DEF_RE.exec(css)) !== null) {
  const cls = m[1].slice(1);
  // Only flag classes whose name contains "btn" or "button" (case-
  // insensitive substring); other classes aren't part of the button
  // vocabulary check.
  if (!/btn|button/i.test(cls)) continue;
  // Skip state suffixes on .btn (e.g. .btn-loading, .btn-arrow,
  // .btn-text — these are .btn descendants, not new buttons).
  const tail = cls.replace(/^btn-/, '');
  if (cls.startsWith('btn-') && STATE_SUFFIXES.has(tail)) continue;
  if (!found.has(cls)) found.set(cls, []);
  // Track first definition line for the report.
  const upToHere = css.slice(0, m.index);
  const lineNo = upToHere.split('\n').length;
  found.get(cls).push(lineNo);
}

const drift = [];
for (const [cls, lines] of found) {
  if (CANONICAL.has(cls)) continue;
  if (ALLOWED_EXCEPTIONS.has(cls)) continue;
  // .btn-loading state pseudo-classes etc. handled above. Anything
  // else is potential drift.
  drift.push({ cls, lines });
}

// Also flag any registered exception that has DISAPPEARED from
// site.css — means the allowlist needs trimming.
const stale = [];
for (const cls of ALLOWED_EXCEPTIONS.keys()) {
  if (!found.has(cls)) stale.push(cls);
}

if (drift.length === 0 && stale.length === 0) {
  console.log(`Button vocabulary: clean.`);
  console.log(`  ${CANONICAL.size} canonical classes; ${ALLOWED_EXCEPTIONS.size} registered exceptions.`);
} else {
  if (drift.length) {
    console.log(`Button vocabulary: ${drift.length} unregistered button-shaped class(es) in assets/site.css:\n`);
    for (const d of drift) {
      console.log(`  .${d.cls}  (line ${d.lines[0]})`);
    }
    console.log('\nEither compose primitives instead, or add the class to ALLOWED_EXCEPTIONS');
    console.log(`in scripts/check-button-vocabulary.mjs with a one-line justification.`);
  }
  if (stale.length) {
    console.log(`\nStale exceptions (allowlisted but no longer in site.css):`);
    for (const s of stale) console.log(`  .${s}`);
    console.log(`Trim these from ALLOWED_EXCEPTIONS.`);
  }
}

if (checkMode && (drift.length > 0 || stale.length > 0)) {
  // Sprint 16 — promoted to fail-CI. Drift = unregistered button
  // class added; stale = registered class no longer in site.css.
  process.exit(1);
}
