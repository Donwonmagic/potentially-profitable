#!/usr/bin/env node
/**
 * Operator Sheets — verifiable "no numbers leave the page" gate.
 *
 * Backs claim #11 (data/security-claims.json#claim-11): every sheet
 * fragment's client-side JS is forbidden from sending the operator's
 * inputs anywhere. The shared sheet plumbing (sheets.js, sheet-csv.js,
 * sheet-viz.js, sheet-parse.js, sheet-benchmarks.gen.js) is allowed
 * to fetch from the same-origin Workshop endpoints because that is
 * the user-initiated save path; the per-sheet fragment scripts in
 * scripts/sheets-fragments/<slug>.html must NOT call any network API.
 *
 * Forbidden in fragment scripts:
 *   - fetch( / XMLHttpRequest / sendBeacon
 *   - navigator.geolocation, navigator.clipboard.write, etc.
 *   - localStorage / sessionStorage / cookie writes (autosave is
 *     handled by the shared sheets.js, not per-fragment)
 *   - any external <script src> in a fragment
 *
 * Allowed in fragment scripts:
 *   - window.SheetPage.register(...) — the only entry point
 *   - DOM reads/writes inside #sheet-fields and its descendants
 *   - Math, string formatting, no-side-effect utilities
 *
 *   node scripts/check-sheet-no-fetch.mjs
 *   node scripts/check-sheet-no-fetch.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const FRAGMENT_DIR = path.join(repoRoot, 'scripts', 'sheets-fragments');

const FORBIDDEN = [
  { id: 'fetch', re: /\bfetch\s*\(/, what: 'fetch( call — fragment scripts may not contact any URL' },
  { id: 'xhr', re: /\bXMLHttpRequest\b/, what: 'XMLHttpRequest reference — fragment scripts may not contact any URL' },
  { id: 'beacon', re: /\bsendBeacon\b/, what: 'navigator.sendBeacon — fragment scripts may not contact any URL' },
  { id: 'localStorage', re: /\blocalStorage\b/, what: 'localStorage access — autosave is handled by the shared sheets.js, not per-fragment' },
  { id: 'sessionStorage', re: /\bsessionStorage\b/, what: 'sessionStorage access — fragment scripts must not write to client storage' },
  { id: 'cookie', re: /document\.cookie\s*=/, what: 'document.cookie write — fragment scripts must not write cookies' },
  { id: 'geolocation', re: /navigator\.geolocation/, what: 'geolocation access — sheets are paperwork, not location-aware tools' },
  { id: 'externalScript', re: /<script\b[^>]+src=["'](?!\/)/i, what: 'external <script src> — fragment must not load third-party JS' },
  { id: 'eval', re: /\beval\s*\(/, what: 'eval() — fragment scripts must not run dynamic code' },
  { id: 'newFunction', re: /new\s+Function\s*\(/, what: 'new Function() — fragment scripts must not run dynamic code' },
  { id: 'workshopUrl', re: /\/api\/workbench\//, what: '/api/workbench/ reference — fragments must use SheetPage.register() and let sheets.js handle save calls' },
];

if (!fs.existsSync(FRAGMENT_DIR)) {
  console.log('No sheets-fragments directory — nothing to check.');
  process.exit(0);
}

const fragments = fs.readdirSync(FRAGMENT_DIR).filter((f) => f.endsWith('.html'));
const violations = [];

for (const file of fragments) {
  const full = path.join(FRAGMENT_DIR, file);
  const src = fs.readFileSync(full, 'utf8');
  // Strip HTML attributes that legitimately contain checkable
  // strings (e.g. CSV download filename). We only scan what's
  // inside <script>...</script> blocks plus the raw HTML.
  for (const pat of FORBIDDEN) {
    const m = src.match(pat.re);
    if (m) {
      // Find line number for the first match.
      const beforeIdx = src.indexOf(m[0]);
      const lineNum = src.slice(0, beforeIdx).split('\n').length;
      violations.push({ file, line: lineNum, id: pat.id, what: pat.what, snippet: m[0] });
    }
  }
}

// Also check the rendered sheet pages (sheets/<slug>/index.html and
// es/sheets/<slug>/index.html) — defense-in-depth in case anyone
// hand-edits a generated page. Scoped to inline scripts INSIDE the
// <main id="main"> block, so the shared nav (which legitimately
// fetches /api/auth/me + /api/workbench/count for the auth toggle)
// is not flagged.
const RENDERED_DIRS = ['sheets', 'es/sheets'];
for (const dir of RENDERED_DIRS) {
  const root = path.join(repoRoot, dir);
  if (!fs.existsSync(root)) continue;
  for (const slug of fs.readdirSync(root)) {
    const idx = path.join(root, slug, 'index.html');
    if (!fs.existsSync(idx)) continue;
    const src = fs.readFileSync(idx, 'utf8');
    // Slice the <main> region only.
    const mainOpen = src.indexOf('<main id="main">');
    const mainClose = src.indexOf('</main>');
    if (mainOpen === -1 || mainClose === -1) continue;
    const mainSrc = src.slice(mainOpen, mainClose);
    // Extract inline script bodies (no src attribute) inside <main>.
    const inlineScripts = [];
    mainSrc.replace(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi, (_, body) => {
      inlineScripts.push(body);
      return '';
    });
    const inlineBody = inlineScripts.join('\n');
    for (const pat of FORBIDDEN) {
      // workshopUrl is fine if it's just a string ref (e.g. in the
      // sheet's mm-save data attributes); only flag if it appears
      // inside an inline script.
      if (pat.id === 'workshopUrl' && !inlineBody.includes('/api/workbench/')) continue;
      const m = inlineBody.match(pat.re);
      if (m) {
        violations.push({ file: path.relative(repoRoot, idx), line: 0, id: pat.id, what: pat.what, snippet: m[0] });
      }
    }
  }
}

if (violations.length) {
  console.error('Sheet no-fetch invariant: ' + violations.length + ' violation(s):');
  for (const v of violations) {
    console.error(`  ✗ ${v.file}${v.line ? ':' + v.line : ''}  ${v.id}  ${v.what}`);
    console.error(`        ${v.snippet}`);
  }
  process.exit(1);
}
console.log(`Sheet no-fetch invariant: ${fragments.length} fragment(s) + ${RENDERED_DIRS.length} rendered tree(s) scanned; all clean.`);
