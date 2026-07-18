#!/usr/bin/env node
/**
 * check-noaa-landings.mjs — honesty gate for the US Domestic Wild-Landings layer
 * (cost-index/noaa-landings-domestic.json).
 *
 * This layer is a per-seafood-group DOMESTIC pair (unlike the energy/crop backdrops it legitimately keys
 * to ingredient slugs). What it must never do: forecast, assert a cause, present landings as a delivered
 * or retail price, or collapse the wild-vs-farmed seam into a clean apparent-consumption share. The
 * top-level note must carry the seam + wild + not-a-forecast disclaimers. Plus bounded-field checks.
 *
 *   node scripts/check-noaa-landings.mjs
 *   node scripts/check-noaa-landings.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = 'cost-index/noaa-landings-domestic.json';
const XWALK = 'data/ingredient-noaa-codes.json';

const BANNED = [
  /\bforecast/i, /\bprojected\b/i, /\bexpected?\s+to\b/i, /\bwill\s+(rise|fall|climb|drop|increase|decrease|land|catch)\b/i,
  /\bpredict/i, /\bcaus(e|es|ed|ing)\b/i, /\bbecause\s+of\b/i, /\bdriv(es|en|ing)\b/i, /\bdue\s+to\b/i,
  /\b(delivered|retail|wholesale|menu)\s+price\b/i,
];

function check(doc, validIds) {
  const errs = [];
  if (!doc || !Array.isArray(doc.groups)) return ['landings doc has no groups[] array'];

  for (const g of doc.groups) {
    const k = g.id || '(no id)';
    if (validIds && !validIds.has(g.id)) errs.push(`group "${k}" not a known crosswalk category id`);
    if (!Array.isArray(g.serves) || !g.serves.length) errs.push(`${k}: serves[] missing or empty (a landings group must name the slugs it pairs)`);
    if (g.landings_usd != null && !(g.landings_usd >= 0)) errs.push(`${k}: landings_usd ${g.landings_usd} is negative`);
    if (g.landings_lb != null && !(g.landings_lb >= 0)) errs.push(`${k}: landings_lb ${g.landings_lb} is negative`);
    if (g.landings_5yr_avg_usd != null && !(g.landings_5yr_avg_usd >= 0)) errs.push(`${k}: landings_5yr_avg_usd ${g.landings_5yr_avg_usd} is negative`);
    if (g.latest_year != null && !(g.latest_year >= 1950 && g.latest_year <= 2100)) errs.push(`${k}: latest_year ${g.latest_year} out of 1950..2100`);
    if (g.available !== false) {
      if (!Array.isArray(g.species_matched) || !g.species_matched.length) errs.push(`${k}: species_matched missing on an available group`);
      if (!Array.isArray(g.series)) errs.push(`${k}: series[] missing`);
      else for (const pt of g.series) {
        if (!Array.isArray(pt) || pt.length !== 2) { errs.push(`${k}: malformed series point`); break; }
        const [y, v] = pt;
        if (!(y >= 1950 && y <= 2100)) { errs.push(`${k}: series year ${y} out of range`); break; }
        if (!(v >= 0)) { errs.push(`${k}: series value ${v} negative`); break; }
      }
    }
    for (const [f, v] of Object.entries(g)) {
      if (typeof v !== 'string') continue;
      for (const re of BANNED) if (re.test(v)) errs.push(`${k}: banned language in ${f}: /${re.source}/`);
    }
  }

  // the top-level note must carry the seam + wild + not-a-forecast disclaimers, and be clean of banned language
  const note = String(doc.note || '');
  if (!/\bwild\b/i.test(note)) errs.push('note is missing the "wild" framing');
  if (!/not\s+a\s+forecast/i.test(note)) errs.push('note is missing the "not a forecast" disclaimer');
  if (!/not\s+a\s+like-for-like|not\s+a\s+clean|apparent-consumption/i.test(note)) errs.push('note is missing the wild-vs-farmed seam disclaimer (not a like-for-like / apparent-consumption share)');
  // The note is the curated disclaimer: it is REQUIRED to say "not a forecast" and to negate the price
  // framing ("never a delivered or retail price"). So exempt the bare /\bforecast/ noun and the price
  // patterns from the note-scan HERE only; every affirmative forecast/causation pattern still applies.
  for (const re of BANNED) { if (re.source === '\\bforecast' || /price/.test(re.source)) continue; if (re.test(note)) errs.push(`note: banned language /${re.source}/`); }

  return errs;
}

function selfTest() {
  const bad = { note: 'landings drives the menu price forecast', groups: [
    { id: 'not-a-real-cat', serves: [], landings_usd: -5, landings_lb: -1, latest_year: 1900,
      species_matched: [], series: [[3000, -2]], wild_note: 'this will rise' },
  ] };
  const errs = check(bad, new Set(['shrimp']));
  const want = ['not a known crosswalk category id', 'serves[] missing', 'landings_usd -5 is negative',
    'landings_lb -1 is negative', 'latest_year 1900', 'species_matched missing', 'series year 3000',
    'banned language in wild_note', 'not a forecast', 'seam disclaimer', 'note: banned language'];
  const miss = want.filter((w) => !errs.some((e) => e.includes(w)));
  if (miss.length) { console.error('SELF-TEST FAIL — missed:', miss, '\ngot:', errs); process.exit(1); }
  console.log('✓ self-test: caught all', want.length, 'seeded violations'); process.exit(0);
}

if (process.argv.includes('--self-test')) selfTest();
let data, validIds = null;
try { data = JSON.parse(fs.readFileSync(path.join(repo, FILE), 'utf8')); }
catch (e) { console.error(`check-noaa-landings: cannot read ${FILE}: ${e.message}`); process.exit(1); }
try { validIds = new Set((JSON.parse(fs.readFileSync(path.join(repo, XWALK), 'utf8')).categories || []).map((c) => c.id)); }
catch { /* crosswalk optional for the id check */ }
const errors = check(data, validIds);
if (errors.length) {
  console.error(`✗ Domestic Wild-Landings honesty gate — ${errors.length} violation(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ Domestic Wild-Landings honesty gate — ${data.groups.length} groups, each keyed to its slugs; no forecast/causation, no price framing, wild-vs-farmed seam + not-a-forecast disclaimers present.`);
