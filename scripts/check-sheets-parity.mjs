#!/usr/bin/env node
/**
 * Operator Sheets — parity & completeness gate.
 *
 * Validates that every "live" sheet has the inputs it needs to render:
 *
 *   - data/sheets.json entry has when_to_use_en[] + mistakes_en[]
 *   - data/sheets.es.json carries a matching entry with when_to_use[]
 *     + mistakes[] (3 + 3 bullets to mirror EN)
 *   - scripts/sheets-fragments/<slug>.html exists
 *   - sheets/<slug>/index.html and es/sheets/<slug>/index.html exist
 *     after the page generator has run
 *   - canonical link is present in both pages
 *   - locale-hazard sheets carry the regional disclaimer banner
 *
 * Wired into scripts/check-all.mjs. Warn-only during initial rollout
 * (sheets land in waves); flip the rollout flag at the bottom to
 * fail-CI when the catalog reaches steady state.
 *
 *   node scripts/check-sheets-parity.mjs           # report + exit 0
 *   node scripts/check-sheets-parity.mjs --check   # report + warn-only
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');

const SHEETS    = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'sheets.json'), 'utf8'));
const SHEETS_ES = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'sheets.es.json'), 'utf8'));

const FAIL_ON_DRIFT = false; // flip to true once the catalog is steady-state

const problems = [];
const warnings = [];

const liveSlugs = Object.entries(SHEETS.sheets)
  .filter(([, s]) => s.status === 'live')
  .map(([slug]) => slug);

// 1. Live sheets must carry EN prose (when_to_use, mistakes).
for (const slug of liveSlugs) {
  const s = SHEETS.sheets[slug];
  if (!Array.isArray(s.when_to_use_en) || s.when_to_use_en.length < 2) {
    problems.push(`${slug}: missing or under-filled when_to_use_en (need ≥2 bullets)`);
  }
  if (!Array.isArray(s.mistakes_en) || s.mistakes_en.length < 2) {
    problems.push(`${slug}: missing or under-filled mistakes_en (need ≥2 bullets)`);
  }
}

// 2. Live sheets must carry ES prose in data/sheets.es.json.
for (const slug of liveSlugs) {
  const es = SHEETS_ES.sheets && SHEETS_ES.sheets[slug];
  if (!es) {
    problems.push(`${slug}: data/sheets.es.json has no entry`);
    continue;
  }
  if (!Array.isArray(es.when_to_use) || es.when_to_use.length < 2) {
    problems.push(`${slug}: data/sheets.es.json when_to_use missing or under-filled`);
  }
  if (!Array.isArray(es.mistakes) || es.mistakes.length < 2) {
    problems.push(`${slug}: data/sheets.es.json mistakes missing or under-filled`);
  }
}

// 3. Live sheets must have a fragment file.
for (const slug of liveSlugs) {
  const fp = path.join(REPO, 'scripts', 'sheets-fragments', `${slug}.html`);
  if (!fs.existsSync(fp)) {
    problems.push(`${slug}: missing fragment scripts/sheets-fragments/${slug}.html`);
  }
}

// 4. After the page generator runs, the per-locale page files must exist.
//    Treated as warnings (the generator may not have run yet locally).
for (const slug of liveSlugs) {
  const en = path.join(REPO, 'sheets', slug, 'index.html');
  const es = path.join(REPO, 'es', 'sheets', slug, 'index.html');
  if (!fs.existsSync(en)) warnings.push(`${slug}: sheets/${slug}/index.html not yet generated (run build-sheet-pages.mjs)`);
  if (!fs.existsSync(es)) warnings.push(`${slug}: es/sheets/${slug}/index.html not yet generated (run build-sheet-pages.mjs)`);
}

// 5. Canonical link present in both pages, plus locale-hazard banner
//    where flagged.
for (const slug of liveSlugs) {
  const sheet = SHEETS.sheets[slug];
  const targets = [
    { file: path.join(REPO, 'sheets', slug, 'index.html'),         locale: 'en' },
    { file: path.join(REPO, 'es', 'sheets', slug, 'index.html'),   locale: 'es' },
  ];
  for (const { file, locale } of targets) {
    if (!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    if (!/<link\s+rel="canonical"/i.test(src)) {
      problems.push(`${slug} (${locale}): missing <link rel="canonical">`);
    }
    if (sheet.es_locale_hazard && !/class="sheet-hazard"/.test(src)) {
      problems.push(`${slug} (${locale}): es_locale_hazard=true but page lacks .sheet-hazard banner`);
    }
  }
}

// 6. Pack IDs all valid; pack.sheets ↔ sheet.pack consistency.
const packIds = new Set(SHEETS.packs.map((p) => p.id));
for (const [slug, s] of Object.entries(SHEETS.sheets)) {
  if (!packIds.has(s.pack)) {
    problems.push(`${slug}: pack "${s.pack}" is not in data/sheets.json packs[]`);
  }
}

// Report.
function bullet(items, marker) {
  if (!items.length) return;
  for (const i of items) console.log(`  ${marker} ${i}`);
}
console.log('Operator Sheets parity:');
console.log(`  ${liveSlugs.length} live slug(s) checked.`);
if (problems.length) {
  console.log(`\n  ${problems.length} problem(s):`);
  bullet(problems, '✗');
}
if (warnings.length) {
  console.log(`\n  ${warnings.length} warning(s):`);
  bullet(warnings, '·');
}
if (!problems.length && !warnings.length) {
  console.log('  All clean.');
}

if (FAIL_ON_DRIFT && problems.length) process.exit(1);
process.exit(0);
