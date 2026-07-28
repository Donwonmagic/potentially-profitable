#!/usr/bin/env node
/**
 * check-ers-availability.mjs — honesty gate for the US per-capita food-availability layer
 * (cost-index/ers-food-availability.json).
 *
 * Per-capita availability is a supply-side PROXY for consumption, never a measured intake, never a price,
 * never a forecast, and (being a commodity-level figure) never a per-cut number. This gate fails the
 * build on forecast/price/causation language, out-of-bounds values, an item not in the crosswalk, or a
 * note missing the proxy + not-a-price + not-a-forecast disclaimers. Plus bounded-field checks.
 *
 *   node scripts/check-ers-availability.mjs
 *   node scripts/check-ers-availability.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = 'cost-index/ers-food-availability.json';
const XWALK = 'data/ingredient-ers-codes.json';

const BANNED = [
  /\bforecast/i, /\bprojected\b/i, /\bexpected?\s+to\b/i, /\bwill\s+(rise|fall|climb|drop|increase|decrease)\b/i,
  /\bpredict/i, /\bcaus(e|es|ed|ing)\b/i, /\bbecause\s+of\b/i, /\bdriv(es|en|ing)\b/i, /\bdue\s+to\b/i,
  /\b(delivered|retail|wholesale|menu)\s+price\b/i, /\bprice\s+per\b/i,
];

function check(doc, validSlugs) {
  const errs = [];
  if (!doc || !Array.isArray(doc.items)) return ['availability doc has no items[] array'];

  const seen = new Set();
  for (const it of doc.items) {
    const k = it.slug || '(no slug)';
    if (seen.has(it.slug)) errs.push(`${k}: duplicate slug`);
    seen.add(it.slug);
    if (validSlugs && !validSlugs.has(it.slug)) errs.push(`${k}: not a crosswalk slug`);
    if (!(it.percap_lbs >= 0)) errs.push(`${k}: percap_lbs ${it.percap_lbs} not >= 0`);
    if (it.percap_lbs > 2000) errs.push(`${k}: percap_lbs ${it.percap_lbs} implausibly large (a per-capita lbs/yr figure)`);
    if (it.latest_year != null && !(it.latest_year >= 1900 && it.latest_year <= 2030)) errs.push(`${k}: latest_year ${it.latest_year} out of 1900..2030`);
    if (it.scope !== 'commodity') errs.push(`${k}: scope "${it.scope}" must be 'commodity' (availability is published at commodity level)`);
    if (!Array.isArray(it.series) || it.series.length < 2) errs.push(`${k}: series missing or too short`);
    else for (const pt of it.series) {
      if (!Array.isArray(pt) || pt.length !== 2) { errs.push(`${k}: malformed series point`); break; }
      if (!(pt[0] >= 1900 && pt[0] <= 2030)) { errs.push(`${k}: series year ${pt[0]} out of range`); break; }
      if (!(pt[1] >= 0)) { errs.push(`${k}: series value ${pt[1]} negative`); break; }
    }
    for (const [f, v] of Object.entries(it)) {
      if (typeof v !== 'string') continue;
      for (const re of BANNED) if (re.test(v)) errs.push(`${k}: banned language in ${f}: /${re.source}/`);
    }
  }

  const note = String(doc.note || '');
  if (!/per[- ]capita/i.test(note)) errs.push('note is missing the "per-capita" framing');
  if (!/prox(y|ies)/i.test(note)) errs.push('note is missing the "proxy" framing (availability is not measured intake)');
  if (!/not\s+a\s+price/i.test(note)) errs.push('note is missing the "not a price" disclaimer');
  if (!/not\s+a\s+forecast/i.test(note)) errs.push('note is missing the "not a forecast" disclaimer');
  // the note is REQUIRED to negate forecast + price, so exempt the bare /\bforecast/ and the price patterns here
  for (const re of BANNED) { if (re.source === '\\bforecast' || /price/.test(re.source)) continue; if (re.test(note)) errs.push(`note: banned language /${re.source}/`); }

  return errs;
}

function selfTest() {
  const bad = { note: 'availability drives the retail price', items: [
    { slug: 'ghost', percap_lbs: -3, latest_year: 1850, scope: 'item', series: [], commodity: 'x will rise' },
    { slug: 'ghost', percap_lbs: 99999, latest_year: 2024, scope: 'commodity', series: [[1800, 1], [2024, 2]] },
  ] };
  const errs = check(bad, new Set(['avocado']));
  const want = ['duplicate slug', 'not a crosswalk slug', 'percap_lbs -3', 'latest_year 1850', "scope \"item\"", 'series missing',
    'implausibly large', 'series year 1800', 'banned language in commodity', 'not a price', 'not a forecast', 'note: banned language', 'proxy'];
  const miss = want.filter((w) => !errs.some((e) => e.includes(w)));
  if (miss.length) { console.error('SELF-TEST FAIL — missed:', miss, '\ngot:', errs); process.exit(1); }
  console.log('✓ self-test: caught all', want.length, 'seeded violations'); process.exit(0);
}

if (process.argv.includes('--self-test')) selfTest();
let data, validSlugs = null;
try { data = JSON.parse(fs.readFileSync(path.join(repo, FILE), 'utf8')); }
catch (e) { console.error(`check-ers-availability: cannot read ${FILE}: ${e.message}`); process.exit(1); }
try { validSlugs = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(repo, XWALK), 'utf8')).map || {})); }
catch { /* crosswalk optional for the slug check */ }
const errors = check(data, validSlugs);
if (errors.length) {
  console.error(`✗ ERS availability honesty gate — ${errors.length} violation(s):`);
  for (const e of errors.slice(0, 50)) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ ERS availability honesty gate — ${data.items.length} items, per-capita proxy bounded + commodity-scoped; no forecast/price/causation, disclaimers present.`);
