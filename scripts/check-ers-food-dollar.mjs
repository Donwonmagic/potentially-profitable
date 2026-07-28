#!/usr/bin/env node
/**
 * check-ers-food-dollar.mjs — honesty gate for the Food Dollar layer (cost-index/food-dollar.json).
 *
 * The Food Dollar is a NATIONAL macro statistic. The gate keeps it from ever reading as a per-ingredient
 * claim, the operator's cost structure, or a forecast: bounded cents (0..100), a farm share present, the
 * chain components summing to ~100, and a note carrying the national + not-a-per-ingredient + not-a-
 * forecast disclaimers. No field may carry forecast/causation language.
 *
 *   node scripts/check-ers-food-dollar.mjs
 *   node scripts/check-ers-food-dollar.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = 'cost-index/food-dollar.json';

const BANNED = [
  /\bforecast/i, /\bprojected\b/i, /\bexpected?\s+to\b/i, /\bwill\s+(rise|fall|climb|drop|increase|decrease)\b/i,
  /\bpredict/i, /\bcaus(e|es|ed|ing)\b/i, /\bbecause\s+of\b/i, /\bdriv(es|en|ing)\b/i, /\bdue\s+to\b/i,
];

function check(doc) {
  const errs = [];
  if (!doc) return ['food-dollar doc missing'];
  if (!(doc.farm_share_cents >= 0 && doc.farm_share_cents <= 100)) errs.push(`farm_share_cents ${doc.farm_share_cents} out of 0..100`);
  if (doc.latest_year != null && !(doc.latest_year >= 1900 && doc.latest_year <= 2030)) errs.push(`latest_year ${doc.latest_year} out of range`);
  if (!Array.isArray(doc.chain_split) || doc.chain_split.length < 6) errs.push('chain_split missing or too short');
  else {
    let sum = 0;
    for (const c of doc.chain_split) {
      if (!c.component) errs.push('a chain_split entry has no component');
      if (!(c.cents >= 0 && c.cents <= 100)) errs.push(`chain_split ${c.component}: cents ${c.cents} out of 0..100`);
      else sum += c.cents;
    }
    if (!(sum >= 98 && sum <= 102)) errs.push(`chain_split components sum to ${Math.round(sum * 10) / 10} (expected ~100)`);
  }
  for (const [f, series] of Object.entries(doc.farm_share_series ? { farm_share_series: doc.farm_share_series } : {})) {
    if (!Array.isArray(series) || series.length < 5) errs.push(`${f} missing or too short`);
    else for (const pt of series) if (!Array.isArray(pt) || pt.length !== 2 || !(pt[1] >= 0 && pt[1] <= 100)) { errs.push(`${f} malformed`); break; }
  }
  // banned language in any top-level string field
  for (const [f, v] of Object.entries(doc)) {
    if (typeof v !== 'string') continue;
    for (const re of BANNED) if (re.test(v) && f !== 'note') errs.push(`banned language in ${f}: /${re.source}/`);
  }
  const note = String(doc.note || '');
  if (!/\bnational\b/i.test(note)) errs.push('note is missing the "national" framing');
  if (!/not\s+a\s+per-ingredient/i.test(note)) errs.push('note is missing the "not a per-ingredient" disclaimer');
  if (!/not\s+a\s+forecast/i.test(note)) errs.push('note is missing the "not a forecast" disclaimer');
  for (const re of BANNED) { if (re.source === '\\bforecast') continue; if (re.test(note)) errs.push(`note: banned language /${re.source}/`); }

  return errs;
}

function selfTest() {
  const bad = { farm_share_cents: 150, latest_year: 1850, note: 'this drives prices and will rise',
    chain_split: [{ component: 'x', cents: 60 }, { component: 'y', cents: 60 }], farm_share_series: [[1, 2]] };
  const errs = check(bad);
  const want = ['farm_share_cents 150', 'latest_year 1850', 'sum to 120', 'national', 'not a per-ingredient', 'not a forecast', 'note: banned language'];
  const miss = want.filter((w) => !errs.some((e) => e.includes(w)));
  if (miss.length) { console.error('SELF-TEST FAIL — missed:', miss, '\ngot:', errs); process.exit(1); }
  console.log('✓ self-test: caught all', want.length, 'seeded violations'); process.exit(0);
}

if (process.argv.includes('--self-test')) selfTest();
let data; try { data = JSON.parse(fs.readFileSync(path.join(repo, FILE), 'utf8')); }
catch (e) { console.error(`check-ers-food-dollar: cannot read ${FILE}: ${e.message}`); process.exit(1); }
const errors = check(data);
if (errors.length) {
  console.error(`✗ Food Dollar honesty gate — ${errors.length} violation(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ Food Dollar honesty gate — farm share ${data.farm_share_cents}c, ${data.chain_split.length} chain components sum ~100; national macro, not per-ingredient, no forecast.`);
