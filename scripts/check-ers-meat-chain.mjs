#!/usr/bin/env node
/**
 * check-ers-meat-chain.mjs — honesty gate for the protein price-chain layer
 * (cost-index/meat-price-chain.json).
 *
 * The chain carries a NATIONAL-AVERAGE retail value, which the corpus otherwise never shows — so the gate
 * is strict about framing: the note must state national-average + not-a-delivered/menu/wholesale-invoice
 * price + not-a-forecast; no field may carry forecast/causation language; values are bounded. Only the
 * three ERS proteins may appear. This lets the chain be surfaced honestly (farm -> wholesale -> retail as
 * a documented public statistic) without ever reading as the operator's price.
 *
 *   node scripts/check-ers-meat-chain.mjs
 *   node scripts/check-ers-meat-chain.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = 'cost-index/meat-price-chain.json';
const PROTEINS = ['beef', 'pork', 'broiler'];
const RUNGS = ['net_farm_value', 'wholesale_value', 'retail_value', 'farm_to_wholesale_spread', 'wholesale_to_retail_spread', 'farm_to_retail_spread'];

const BANNED = [
  /\bforecast/i, /\bprojected\b/i, /\bexpected?\s+to\b/i, /\bwill\s+(rise|fall|climb|drop|increase|decrease)\b/i,
  /\bpredict/i, /\bcaus(e|es|ed|ing)\b/i, /\bbecause\s+of\b/i, /\bdriv(es|en|ing)\b/i, /\bdue\s+to\b/i,
];

function check(doc) {
  const errs = [];
  if (!doc || !Array.isArray(doc.proteins)) return ['chain doc has no proteins[] array'];
  if (doc.proteins.length > PROTEINS.length) errs.push(`too many proteins (${doc.proteins.length})`);

  for (const p of doc.proteins) {
    const k = p.id || '(no id)';
    if (!PROTEINS.includes(p.id)) errs.push(`protein "${k}" not one of ${PROTEINS.join('/')}`);
    if (!Array.isArray(p.serves) || !p.serves.length) errs.push(`${k}: serves[] missing or empty`);
    if (p.latest_year != null && !(p.latest_year >= 1970 && p.latest_year <= 2030)) errs.push(`${k}: latest_year ${p.latest_year} out of 1970..2030`);
    if (p.latest_month != null && !(p.latest_month >= 1 && p.latest_month <= 12)) errs.push(`${k}: latest_month ${p.latest_month} out of 1..12`);
    if (p.downstream_markup_share != null && !(p.downstream_markup_share >= 0 && p.downstream_markup_share <= 100)) errs.push(`${k}: downstream_markup_share ${p.downstream_markup_share} out of 0..100`);
    for (const [rung, v] of Object.entries(p.chain || {})) {
      if (!RUNGS.includes(rung)) errs.push(`${k}: unknown chain rung "${rung}"`);
      if (v != null && !(v >= 0)) errs.push(`${k}: chain.${rung} ${v} < 0`);
    }
    for (const [rung, series] of Object.entries(p.series || {})) {
      if (!Array.isArray(series) || series.length < 12) errs.push(`${k}: series.${rung} missing or too short`);
      else for (const pt of series) { if (!Array.isArray(pt) || pt.length !== 2 || !(pt[1] >= 0)) { errs.push(`${k}: series.${rung} malformed`); break; } }
    }
    for (const [f, v] of Object.entries(p)) {
      if (typeof v !== 'string') continue;
      for (const re of BANNED) if (re.test(v)) errs.push(`${k}: banned language in ${f}: /${re.source}/`);
    }
  }

  const note = String(doc.note || '');
  if (!/national[- ]average/i.test(note)) errs.push('note is missing the "national-average" framing');
  if (!/\bretail\b/i.test(note)) errs.push('note is missing the "retail" naming');
  if (!/not\s+a\s+delivered\s+price/i.test(note)) errs.push('note is missing the "not a delivered price" disclaimer');
  if (!/not\s+a\s+menu\s+price/i.test(note)) errs.push('note is missing the "not a menu price" disclaimer');
  if (!/not\s+a\s+forecast/i.test(note)) errs.push('note is missing the "not a forecast" disclaimer');
  // the note is REQUIRED to negate forecast, so exempt the bare /\bforecast/ here
  for (const re of BANNED) { if (re.source === '\\bforecast') continue; if (re.test(note)) errs.push(`note: banned language /${re.source}/`); }

  return errs;
}

function selfTest() {
  const bad = { note: 'the retail forecast will rise because of demand', proteins: [
    { id: 'wagyu', serves: [], latest_year: 1950, latest_month: 13, downstream_markup_share: 120,
      chain: { retail_value: -5, bogus_rung: 3 }, series: { retail_value: [[1, 2]] }, label: 'this drives prices' },
  ] };
  const errs = check(bad);
  const want = ['not one of', 'serves[] missing', 'latest_year 1950', 'latest_month 13', 'downstream_markup_share 120',
    'chain.retail_value -5', 'unknown chain rung', 'banned language in label', 'national-average',
    'not a delivered price', 'not a menu price', 'not a forecast', 'note: banned language'];
  const miss = want.filter((w) => !errs.some((e) => e.includes(w)));
  if (miss.length) { console.error('SELF-TEST FAIL — missed:', miss, '\ngot:', errs); process.exit(1); }
  console.log('✓ self-test: caught all', want.length, 'seeded violations'); process.exit(0);
}

if (process.argv.includes('--self-test')) selfTest();
let data; try { data = JSON.parse(fs.readFileSync(path.join(repo, FILE), 'utf8')); }
catch (e) { console.error(`check-ers-meat-chain: cannot read ${FILE}: ${e.message}`); process.exit(1); }
const errors = check(data);
if (errors.length) {
  console.error(`✗ Meat price-chain honesty gate — ${errors.length} violation(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ Meat price-chain honesty gate — ${data.proteins.length} proteins, farm→wholesale→retail bounded; national-average retail named (never delivered/menu price), no forecast/causation.`);
