#!/usr/bin/env node
/**
 * check-eia-energy-backdrop.mjs — honesty gate for the Energy Backdrop (cost-index/eia-energy-backdrop.json).
 *
 * The backdrop is COINCIDENT CONTEXT, never a driver: it may read each energy carrier against its own
 * range, but it must never forecast, never assert a cause, and never reference a tracked food ingredient
 * (which would turn it into the per-ingredient driver ADR-013 forbids). This gate fails the build on any
 * of those, plus bounded-field checks.
 *
 *   node scripts/check-eia-energy-backdrop.mjs
 *   node scripts/check-eia-energy-backdrop.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = 'cost-index/eia-energy-backdrop.json';
const CARRIERS = ['diesel', 'natural_gas', 'electricity'];

// Forecast / causation language must never appear. Also block the specific trap of linking energy to a
// food price ("... raises food costs", "drives prices"), which would recreate the demoted diesel driver.
const BANNED = [
  /\bforecast/i, /\bprojected\b/i, /\bexpected?\s+to\b/i, /\bwill\s+(rise|fall|climb|drop|increase|decrease|push|raise|lift)\b/i,
  /\bpredict/i, /\bcaus(e|es|ed|ing)\b/i, /\bbecause\s+of\b/i, /\bdriv(es|en|ing)\b/i, /\bdue\s+to\b/i,
  /\b(raises?|pushes?|lifts?|inflates?)\s+(food|ingredient|grocery|menu|produce)\b/i,
];

function check(doc) {
  const errs = [];
  if (!doc || !Array.isArray(doc.carriers)) return ['backdrop has no carriers[] array'];
  if (doc.carriers.length > CARRIERS.length) errs.push(`too many carriers (${doc.carriers.length}) — backdrop is capped at the ${CARRIERS.length} energy series`);

  for (const c of doc.carriers) {
    const k = c.key || '(no key)';
    if (!CARRIERS.includes(c.key)) errs.push(`carrier "${k}" not one of ${CARRIERS.join('/')} — the backdrop must carry ONLY energy series, never an ingredient`);
    if (c.percentile != null && !(c.percentile >= 0 && c.percentile <= 100)) errs.push(`${k}: percentile ${c.percentile} out of 0..100`);
    if (c.pct_of_range != null && !(c.pct_of_range >= 0 && c.pct_of_range <= 100)) errs.push(`${k}: pct_of_range ${c.pct_of_range} out of 0..100`);
    if (c.range_min != null && c.range_max != null && c.latest_value != null) {
      if (!(c.latest_value >= c.range_min - 1e-9 && c.latest_value <= c.range_max + 1e-9)) errs.push(`${k}: latest ${c.latest_value} outside its own range [${c.range_min}, ${c.range_max}]`);
    }
    if (!Array.isArray(c.series) || c.series.length < 24) errs.push(`${k}: series missing or too short`);
    for (const [f, v] of Object.entries(c)) {
      if (typeof v !== 'string') continue;
      for (const re of BANNED) if (re.test(v)) errs.push(`${k}: banned language in ${f}: /${re.source}/`);
    }
  }

  // the note must carry the not-a-driver + not-a-forecast disclaimer, and itself be clean of banned language
  const note = String(doc.note || '');
  if (!/not\s+a\s+driver/i.test(note)) errs.push('note is missing the "not a driver" disclaimer');
  if (!/not\s+a\s+forecast/i.test(note)) errs.push('note is missing the "not a forecast" disclaimer');
  // The note is the curated disclaimer: it is REQUIRED to say "not a forecast", so the bare noun
  // /\bforecast/ is exempt HERE only. Every affirmative forecast/causation pattern (will-rise, predict,
  // projected, drives, causes, food-linking) still applies to the note.
  for (const re of BANNED) { if (re.source === '\\bforecast') continue; if (re.test(note)) errs.push(`note: banned language /${re.source}/`); }

  return errs;
}

function selfTest() {
  const bad = { note: 'energy drives food prices', carriers: [
    { key: 'tomato', percentile: 120, pct_of_range: -3, range_min: 1, range_max: 5, latest_value: 9, series: [], role: 'this will rise next year' },
  ] };
  const errs = check(bad);
  const want = ['not one of', 'percentile 120', 'pct_of_range -3', 'outside its own range', 'series missing', 'banned language in role', 'not a driver', 'not a forecast', 'note: banned language'];
  const miss = want.filter((w) => !errs.some((e) => e.includes(w)));
  if (miss.length) { console.error('SELF-TEST FAIL — missed:', miss, '\ngot:', errs); process.exit(1); }
  console.log('✓ self-test: caught all', want.length, 'seeded violations'); process.exit(0);
}

if (process.argv.includes('--self-test')) selfTest();
let data; try { data = JSON.parse(fs.readFileSync(path.join(repo, FILE), 'utf8')); }
catch (e) { console.error(`check-eia-energy-backdrop: cannot read ${FILE}: ${e.message}`); process.exit(1); }
const errors = check(data);
if (errors.length) {
  console.error(`✗ Energy Backdrop honesty gate — ${errors.length} violation(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ Energy Backdrop honesty gate — ${data.carriers.length} carriers, each read against its own range; no forecast/causation, no ingredient reference, disclaimers present.`);
