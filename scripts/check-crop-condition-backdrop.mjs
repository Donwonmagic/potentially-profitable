#!/usr/bin/env node
/**
 * check-crop-condition-backdrop.mjs — honesty gate for the Crop-Condition Backdrop
 * (cost-index/crop-condition-backdrop.json).
 *
 * The backdrop is COINCIDENT CONTEXT, never a driver. It may read each feed crop's good-to-excellent
 * share against its own same-week history, but it must never forecast, never assert a cause, and never
 * reference a tracked food ingredient (which would turn it into the per-ingredient driver ADR-013
 * forbids). Only the two feed crops may appear (a whitelist by construction). This gate fails the build
 * on any of those, plus bounded-field and class-sum sanity checks.
 *
 *   node scripts/check-crop-condition-backdrop.mjs
 *   node scripts/check-crop-condition-backdrop.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = 'cost-index/crop-condition-backdrop.json';
const CROPS = ['corn', 'soybeans'];

// Forecast / causation language must never appear. Also block the specific trap of linking the crop to a
// food price ("... raises meat costs", "drives prices"), which would recreate a per-ingredient driver.
const BANNED = [
  /\bforecast/i, /\bprojected\b/i, /\bexpected?\s+to\b/i, /\bwill\s+(rise|fall|climb|drop|increase|decrease|push|raise|lift|yield)\b/i,
  /\bpredict/i, /\bcaus(e|es|ed|ing)\b/i, /\bbecause\s+of\b/i, /\bdriv(es|en|ing)\b/i, /\bdue\s+to\b/i,
  /\b(raises?|pushes?|lifts?|inflates?)\s+(food|ingredient|grocery|menu|produce|meat|protein|beef|pork|poultry|egg|dairy)\b/i,
];
const BANDS = new Set([
  'well above the typical rating for this week of the season',
  'above the typical rating for this week of the season',
  'near the typical rating for this week of the season',
  'below the typical rating for this week of the season',
  'well below the typical rating for this week of the season',
  'limited same-week history',
]);

function check(doc) {
  const errs = [];
  if (!doc || !Array.isArray(doc.crops)) return ['backdrop has no crops[] array'];
  if (doc.crops.length > CROPS.length) errs.push(`too many crops (${doc.crops.length}) — the backdrop is capped at the ${CROPS.length} feed crops`);

  for (const c of doc.crops) {
    const k = c.key || '(no key)';
    if (!CROPS.includes(c.key)) errs.push(`crop "${k}" not one of ${CROPS.join('/')} — the backdrop must carry ONLY feed crops, never an ingredient`);
    if (c.good_excellent_pct != null && !(c.good_excellent_pct >= 0 && c.good_excellent_pct <= 100)) errs.push(`${k}: good_excellent_pct ${c.good_excellent_pct} out of 0..100`);
    if (c.same_week_percentile != null && !(c.same_week_percentile >= 0 && c.same_week_percentile <= 100)) errs.push(`${k}: same_week_percentile ${c.same_week_percentile} out of 0..100`);
    if (c.season_year != null && !(c.season_year >= 2000 && c.season_year <= 2100)) errs.push(`${k}: season_year ${c.season_year} out of 2000..2100`);
    if (c.as_of_week != null && !(c.as_of_week >= 1 && c.as_of_week <= 53)) errs.push(`${k}: as_of_week ${c.as_of_week} out of 1..53`);
    if (!BANDS.has(c.band)) errs.push(`${k}: band "${c.band}" not an allowed descriptive band`);
    // the five class shares must sum to ~100 (they are shares of the whole crop)
    if (c.classes) {
      const parts = ['very_poor', 'poor', 'fair', 'good', 'excellent'];
      const miss = parts.filter((p) => c.classes[p] == null);
      if (miss.length) errs.push(`${k}: as-of week missing class shares: ${miss.join(',')}`);
      else {
        const sum = parts.reduce((a, p) => a + Number(c.classes[p]), 0);
        if (!(sum >= 98 && sum <= 102)) errs.push(`${k}: class shares sum to ${sum} (expected ~100)`);
        const gp = Math.round((Number(c.classes.good) + Number(c.classes.excellent)) * 10) / 10;
        if (c.good_excellent_pct != null && Math.abs(gp - c.good_excellent_pct) > 0.1) errs.push(`${k}: good_excellent_pct ${c.good_excellent_pct} != good+excellent ${gp}`);
      }
    }
    if (!Array.isArray(c.series) || c.series.length < 5) errs.push(`${k}: series missing or too short`);
    for (const [f, v] of Object.entries(c)) {
      if (typeof v !== 'string') continue;
      for (const re of BANNED) if (re.test(v)) errs.push(`${k}: banned language in ${f}: /${re.source}/`);
    }
  }

  // the note must carry the not-a-driver + not-a-forecast disclaimer, and itself be clean of banned language
  const note = String(doc.note || '');
  if (!/not\s+a\s+driver/i.test(note)) errs.push('note is missing the "not a driver" disclaimer');
  if (!/not\s+a\s+forecast/i.test(note)) errs.push('note is missing the "not a forecast" disclaimer');
  // The note is REQUIRED to say "not a forecast", so the bare noun /\bforecast/ is exempt HERE only.
  // Every affirmative forecast/causation/food-linking pattern still applies to the note.
  for (const re of BANNED) { if (re.source === '\\bforecast') continue; if (re.test(note)) errs.push(`note: banned language /${re.source}/`); }

  return errs;
}

function selfTest() {
  const bad = { note: 'this drives meat prices', crops: [
    { key: 'tomato', good_excellent_pct: 120, same_week_percentile: -3, season_year: 1999, as_of_week: 99,
      band: 'great', classes: { very_poor: 1, poor: 1, fair: 1, good: 1, excellent: 1 }, series: [], role: 'yields will yield more' },
  ] };
  const errs = check(bad);
  const want = ['not one of', 'good_excellent_pct 120', 'same_week_percentile -3', 'season_year 1999', 'as_of_week 99',
    'not an allowed', 'class shares sum to 5', 'good_excellent_pct 120 != good+excellent 2', 'series missing',
    'banned language in role', 'not a driver', 'not a forecast', 'note: banned language'];
  const miss = want.filter((w) => !errs.some((e) => e.includes(w)));
  if (miss.length) { console.error('SELF-TEST FAIL — missed:', miss, '\ngot:', errs); process.exit(1); }
  console.log('✓ self-test: caught all', want.length, 'seeded violations'); process.exit(0);
}

if (process.argv.includes('--self-test')) selfTest();
let data; try { data = JSON.parse(fs.readFileSync(path.join(repo, FILE), 'utf8')); }
catch (e) { console.error(`check-crop-condition-backdrop: cannot read ${FILE}: ${e.message}`); process.exit(1); }
const errors = check(data);
if (errors.length) {
  console.error(`✗ Crop-Condition Backdrop honesty gate — ${errors.length} violation(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ Crop-Condition Backdrop honesty gate — ${data.crops.length} crops, each read against its own same-week history; no forecast/causation, no ingredient reference, class shares sum ~100, disclaimers present.`);
