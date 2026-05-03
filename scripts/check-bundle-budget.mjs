#!/usr/bin/env node
/**
 * Bundle-size budget check for the Menu Design Suite.
 *
 * Why: the synthesized empowerment plan (Wave A3) sets a 35 KB
 * gz initial-JS budget for /tools/menu-design/ once the boot is
 * code-split. Today the page loads ~350 KB on first paint, so
 * a hard CI gate would fail every PR. This script ships in two
 * modes:
 *
 *   node scripts/check-bundle-budget.mjs
 *     → reports gz-sizes per file, total, and the budget delta.
 *       Always exits 0. Useful for tracking the Wave A3 split
 *       progress without blocking merges.
 *
 *   node scripts/check-bundle-budget.mjs --enforce
 *     → fails (exit 1) if FIRST_PAINT exceeds BUDGET_FIRST_PAINT.
 *       Wire this into scripts/check-all.mjs once the code-split
 *       is in place and we're sub-budget consistently.
 *
 * The "first paint" set is the synchronous <script> tags in
 * tools/menu-design/index.html. Lazy-loaded modules (jsPDF,
 * JSZip, html2canvas, qrcode-generator, the render-* files
 * once split) do NOT count against this budget — their loading
 * is operator-initiated, not boot-blocking.
 *
 * Maintenance: update FIRST_PAINT_FILES below when index.html's
 * synchronous script tags change.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

// ---- Budgets (Wave A target) --------------------------------
// 35 KB gz hard target; 40 KB gz CI ceiling (5 KB headroom). The
// numbers reflect the synthesized plan's A3 (code-split boot).
const BUDGET_FIRST_PAINT_GZ = 40 * 1024; // 40 KB compressed
const TARGET_FIRST_PAINT_GZ = 35 * 1024; // 35 KB compressed

// ---- File set -----------------------------------------------
// Files that the page loads SYNCHRONOUSLY on first paint. Update
// this list whenever tools/menu-design/index.html's <script src=>
// tags change.
//
// Today (pre-Wave-A3): every renderer + theme + the orchestrator
// is here. After the split: only the shell, data, infra, state
// modules should remain.
const FIRST_PAINT_FILES = [
  // Catalogs (small, pure data)
  'tools/menu-design/data/allergens.js',
  'tools/menu-design/data/badges.js',
  'tools/menu-design/data/templates.js',
  'tools/menu-design/data/quiz-tiles.js',
  'tools/menu-design/data/allergen-glyphs.js',
  // Infra
  'tools/menu-design/infra/dom.js',
  'tools/menu-design/infra/i18n.js',
  // State
  'tools/menu-design/state/draft.js',
  'tools/menu-design/state/history.js',
  // Themes (currently in menu-design/; planned move to _shared)
  'tools/menu-design/themes.js',
  // Renderers (currently first-paint; Wave A3 lazy-loads them)
  'tools/menu-design/menu-render-pdf.js',
  'tools/menu-design/menu-render-html.js',
  'tools/menu-design/menu-render-text.js',
  // Orchestrator
  'tools/menu-design/menu-design.js',
];

// ---- Helpers ------------------------------------------------
function gzSize(filePath) {
  const abs = path.join(repoRoot, filePath);
  if (!fs.existsSync(abs)) return { exists: false, raw: 0, gz: 0 };
  const raw = fs.readFileSync(abs);
  const gz  = zlib.gzipSync(raw, { level: 9 });
  return { exists: true, raw: raw.length, gz: gz.length };
}

function fmtKB(bytes) {
  return (bytes / 1024).toFixed(1) + ' KB';
}

function pad(s, n) {
  return String(s).padEnd(n, ' ');
}

// ---- Run ----------------------------------------------------
const ENFORCE = process.argv.includes('--enforce');

let totalRaw = 0;
let totalGz  = 0;
let missing  = 0;

console.log('');
console.log('Menu Design — first-paint JS bundle');
console.log('-'.repeat(72));
console.log(`${pad('file', 50)} ${pad('raw', 10)} gzipped`);
console.log('-'.repeat(72));

for (const rel of FIRST_PAINT_FILES) {
  const { exists, raw, gz } = gzSize(rel);
  if (!exists) {
    console.log(`${pad(rel, 50)} ${pad('MISSING', 10)} -`);
    missing++;
    continue;
  }
  totalRaw += raw;
  totalGz  += gz;
  console.log(`${pad(rel, 50)} ${pad(fmtKB(raw), 10)} ${fmtKB(gz)}`);
}

console.log('-'.repeat(72));
console.log(`${pad('TOTAL', 50)} ${pad(fmtKB(totalRaw), 10)} ${fmtKB(totalGz)}`);
console.log('');

const overBudget  = totalGz > BUDGET_FIRST_PAINT_GZ;
const overTarget  = totalGz > TARGET_FIRST_PAINT_GZ;
const deltaTarget = totalGz - TARGET_FIRST_PAINT_GZ;
const deltaCeil   = totalGz - BUDGET_FIRST_PAINT_GZ;

console.log(`Target (Wave A3):  ${fmtKB(TARGET_FIRST_PAINT_GZ)}  (delta ${deltaTarget >= 0 ? '+' : ''}${fmtKB(deltaTarget)})`);
console.log(`CI ceiling:        ${fmtKB(BUDGET_FIRST_PAINT_GZ)}  (delta ${deltaCeil >= 0 ? '+' : ''}${fmtKB(deltaCeil)})`);
console.log('');

if (missing > 0) {
  console.log(`note: ${missing} file(s) missing — bundle list may need updating after Wave A3 split.`);
}

if (overBudget) {
  console.log(`OVER CI ceiling by ${fmtKB(deltaCeil)}.`);
  if (ENFORCE) {
    console.log('FAIL — wire in once the code-split lands and we are consistently under budget.');
    process.exit(1);
  } else {
    console.log('Reporting only; pass --enforce to fail CI on this regression.');
  }
} else if (overTarget) {
  console.log(`Within ceiling but over Wave A3 target by ${fmtKB(deltaTarget)}.`);
} else {
  console.log('Within Wave A3 target. Ready to wire as a hard CI gate.');
}
console.log('');
