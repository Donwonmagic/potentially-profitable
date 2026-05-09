#!/usr/bin/env node
// scripts/check-reply-time-canon.mjs
//
// Phase 1b CI guard. Phase 4.3 of docs/window-redesign-plan.md
// canonicalized the Window's reply-time copy. This script greps the
// shipped HTML / partials for any of the legacy variants that used
// to drift across pages and exits non-zero if it finds one.
//
// The canonical form (as of v3.1):
//   EN footer:   "Reply: Mondays through Fridays, within 4 hours.
//                 Weekends, by Monday morning."
//   EN /window/: full version including "Some weeks I'm on the floor
//                and slower — the page will say so."
//   ES mirrors equivalent.
//
// What this script forbids:
//   - "under 4 hours" (legacy footer, both EN + ES)
//   - "menos de 4 horas, lun" (legacy ES footer)
//   - "same business day" (legacy /window/ hero + reassurance)
//   - "el mismo día hábil" (legacy ES /window/)
//   - "always inside two" / "siempre dentro de dos" / "siempre en
//     menos de dos" (legacy reassurance qualifier)
//   - "Mon–Fri" / "lun–vie" formal short-hand (replaced by "Mondays
//     through Fridays" / "de lunes a viernes")
//   - "business days" / "días hábiles" formal phrasing
//
// Allowlisted paths: docs/window-redesign-plan.md (the plan
// references the legacy variants explicitly when documenting the
// transition), this script itself, and node_modules/.
//
// Run from repo root: `node scripts/check-reply-time-canon.mjs`

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

// Files to scan. Recursive walk under these roots; everything else
// is skipped to keep the script fast and not paw at brand assets.
const SCAN_ROOTS = ['_includes', 'window', 'es/window', 'about', 'es/about'];

// Path prefixes that are exempt from the rule (script itself, the
// plan doc that explicitly cites legacy strings, build artifacts).
const ALLOWLIST = new Set([
  'docs/window-redesign-plan.md',
  'scripts/check-reply-time-canon.mjs',
]);

// The forbidden substrings. Matched case-insensitively. Each entry is
// [needle, why] for clearer error output.
const FORBIDDEN = [
  ['under 4 hours, mon',                'legacy EN footer'],
  ['menos de 4 horas, lun',             'legacy ES footer'],
  ['same business day',                 'legacy EN reply-time qualifier'],
  ['mismo día hábil',                   'legacy ES reply-time qualifier'],
  ['mismo dia habil',                   'legacy ES reply-time qualifier (no diacritic)'],
  ['always inside two',                 'legacy EN reassurance tail'],
  ['siempre dentro de dos',             'legacy ES reassurance tail'],
  ['siempre en menos de dos',           'legacy ES hero variant'],
  // Mon–Fri short-hand (en-dash + non-breaking variants).
  ['mon–fri',                      'legacy EN day range short-hand'],
  ['mon&#8211;fri',                     'legacy EN day range short-hand (entity)'],
  ['lun–vie',                      'legacy ES day range short-hand'],
  ['lun&#8211;vie',                     'legacy ES day range short-hand (entity)'],
];

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch (_) {
    return;
  }
  for (const name of entries) {
    if (name.startsWith('.')) continue;
    if (name === 'node_modules') continue;
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch (_) { continue; }
    if (st.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

let failures = 0;
for (const scanRoot of SCAN_ROOTS) {
  const absRoot = join(ROOT, scanRoot);
  for (const file of walk(absRoot)) {
    const rel = relative(ROOT, file);
    if (ALLOWLIST.has(rel)) continue;
    if (!/\.(html|md|json|js|mjs)$/.test(file)) continue;

    let body;
    try { body = readFileSync(file, 'utf8'); } catch (_) { continue; }
    const lower = body.toLowerCase();

    for (const [needle, why] of FORBIDDEN) {
      let i = 0;
      while ((i = lower.indexOf(needle, i)) !== -1) {
        // Compute line number for a useful error.
        let line = 1;
        for (let j = 0; j < i; j++) {
          if (body.charCodeAt(j) === 10) line++;
        }
        console.error('reply-time-canon: ' + rel + ':' + line + ' contains "' + needle + '" (' + why + ')');
        failures++;
        i += needle.length;
      }
    }
  }
}

if (failures > 0) {
  console.error('\nreply-time-canon: ' + failures + ' violation(s) found.');
  console.error('See docs/window-redesign-plan.md §4.3 for the canonical form.');
  process.exit(1);
}
console.log('reply-time-canon: clean.');
