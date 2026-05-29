#!/usr/bin/env node
// Phase 1 (tool-suite upgrade) — guard against new innerHTML usage.
//
// The tool-suite's defining failure mode is that 20+ tools use
// `el.innerHTML = stringConcat(...)` as the primary render strategy.
// When any single concat throws (a null lookup, a missing module, an
// unescaped value), the rest of the section either goes blank or
// leaks raw markup. That's the "bare code halfway down the page"
// regression class.
//
// Phase 0 introduced tools/_shared/safe-html.js with `h()`, `setHTML()`,
// and `escapeHtml()`. Phase 3 migrates each tool. Until then, this
// guard prevents NEW innerHTML usage from being added.
//
// Modes:
//   node scripts/check-no-innerhtml.mjs         # report + exit 0 (advisory)
//   node scripts/check-no-innerhtml.mjs --check # report + exit 1 if NEW usage
//
// Advisory mode (no flag) is the default — it surfaces the current
// callsite count as a baseline for Phase 3 retrofits. --check mode
// compares against the baseline file in this script (BASELINE_COUNT)
// and fails CI if the count grew.
//
// Scope: scans /tools/*.html (and *.js inside /tools/) — the tool
// suite is the focus. /admin/, /studio/, blog content, and the
// global nav/footer are excluded.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

// Baseline. Update this number ONLY when a Phase 3 track lands and the
// count drops; never raise it. The CI check fails if the live count
// exceeds the baseline.
// Pinned to the latest baseline. Migrations history:
//   Phase 1 commit:    556 (across 45 files; safe-html.js + states.js
//                            exempted as safe-by-construction).
//   Phase 3 batch 1:   529 (schema-check, mobile-check, tech-stack
//                            EN+ES hardened: every interpolated value
//                            now escaped; final renders routed through
//                            MuntinSafeHtml.setHTML where present).
//   Phase 3 batch 2:   523 (plate-cost/stale-banner.js: 4 empty-string
//                            clears converted to removeChild loops;
//                            2 dynamic assignments wrapped with
//                            MuntinSafeHtml.setHTML + onError fallback;
//                            1 dynamic assignment rewritten as DOM
//                            construction with createElement).
// Each future Phase 3 track lowers this number; the last drives it to zero.
const BASELINE_COUNT = 523;

// File globs to scan. Tool suite + ES mirrors. Build artifacts excluded.
const SCAN_GLOBS = [
  'tools/**/index.html',
  'tools/**/*.js',
  'es/tools/**/index.html',
  'es/tools/**/*.js',
];

// Files explicitly allowed to contain innerHTML.
const ALLOWED_PATHS = new Set([
  // The Phase 0 shim itself wraps innerHTML in try/catch — that's
  // the point. Its escape function is the suite-wide source of truth.
  'tools/_shared/safe-html.js',
  // states.js builds the canonical .tool-error card and wraps every
  // interpolated value in escapeHtml() (line 118-121). Safe by
  // construction; Phase 3 may migrate it to MuntinUI.errorCard()
  // for component consistency, but the current implementation is
  // not a "bare-code" risk.
  'tools/_shared/states.js',
]);

// Directory prefixes excluded from the scan. The Workshop Kit
// widgets at tools/_shared/workshop/ are the Open the Doors course's
// Method primitives — a self-contained component library where each
// widget owns its own DOM and never interpolates user input. They
// predate the safe-html.js migration policy and live outside the
// legacy tool-suite surfaces this check was designed to gate.
const ALLOWED_PREFIXES = [
  'tools/_shared/workshop/',
];

// Patterns that count as "innerHTML usage". innerHTML assignment is
// the primary risk. `.outerHTML =` and `document.write` count too.
const PATTERNS = [
  { rx: /\.innerHTML\s*=/g,       label: 'innerHTML=' },
  { rx: /\.innerHTML\s*\+=/g,     label: 'innerHTML+=' },
  { rx: /\.outerHTML\s*=/g,       label: 'outerHTML=' },
  { rx: /document\.write\(/g,     label: 'document.write(' },
];

function walk(dir, glob, out) {
  let stat;
  try { stat = fs.statSync(dir); } catch (_) { return; }
  if (!stat.isDirectory()) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    if (e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full, glob, out); continue; }
    if (glob.test(full)) out.push(full);
  }
}

// Simple glob: only need `**` and `*` plus file extensions.
function globToRegex(g) {
  let r = g.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  r = r.replace(/\*\*/g, '__DSTAR__');
  r = r.replace(/\*/g, '[^/]*');
  r = r.replace(/__DSTAR__/g, '.*');
  return new RegExp(r + '$');
}

const args = process.argv.slice(2);
const strict = args.includes('--check') || args.includes('--strict');

const files = [];
for (const g of SCAN_GLOBS) walk(repoRoot, globToRegex(g), files);

let totalHits = 0;
const byFile = new Map();

for (const f of files) {
  const rel = path.relative(repoRoot, f);
  if (ALLOWED_PATHS.has(rel)) continue;
  if (ALLOWED_PREFIXES.some((p) => rel.startsWith(p))) continue;
  const src = fs.readFileSync(f, 'utf8');
  let fileHits = 0;
  for (const pat of PATTERNS) {
    const matches = src.match(pat.rx);
    if (matches) fileHits += matches.length;
  }
  if (fileHits > 0) {
    byFile.set(rel, fileHits);
    totalHits += fileHits;
  }
}

const sorted = [...byFile.entries()].sort((a, b) => b[1] - a[1]);

if (strict) {
  if (totalHits > BASELINE_COUNT) {
    console.error(
      'check-no-innerhtml: ' + totalHits + ' usage(s) found; ' +
      'baseline is ' + BASELINE_COUNT + '. Threshold exceeded.'
    );
    console.error('\nTop offenders:');
    for (const [f, n] of sorted.slice(0, 12)) console.error('  ' + n + '  ' + f);
    console.error(
      '\nFix: route renders through tools/_shared/safe-html.js ' +
      '(setHTML / replaceChildren / h tagged template). See Phase 3 plan.'
    );
    process.exit(1);
  }
  console.log(
    'check-no-innerhtml: ' + totalHits + ' usage(s) across ' +
    byFile.size + ' file(s); baseline ' + BASELINE_COUNT + ' — within budget.'
  );
  process.exit(0);
}

// Advisory mode — print baseline summary, exit 0.
console.log(
  'check-no-innerhtml (advisory): ' + totalHits + ' usage(s) across ' +
  byFile.size + ' file(s) in the tool suite.'
);
console.log('Phase 3 target: drive this to zero by migrating to safe-html.js.');
console.log('\nTop offenders (file: count):');
for (const [f, n] of sorted.slice(0, 15)) console.log('  ' + n.toString().padStart(4) + '  ' + f);
if (sorted.length > 15) {
  console.log('  ... and ' + (sorted.length - 15) + ' more file(s)');
}
process.exit(0);
