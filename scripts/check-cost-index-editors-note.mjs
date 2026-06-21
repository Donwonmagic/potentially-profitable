#!/usr/bin/env node
/**
 * check-cost-index-editors-note.mjs — fact gate for the "from the floor" human notes.
 *
 * The note is the one human-authored surface in an otherwise generated dispatch, so it gets
 * the strictest numeric discipline:
 *   1. Numeric traceability: every percentage, dollar amount, and multi-digit number in the
 *      note must trace to that edition's snapshot in data/cost-index-editions.json (basket,
 *      per-ingredient reads, flag levels, spread counts) or to data/sourced-claims.json.
 *      Years 2024–2030 are allowed.
 *   2. No forecast: forward-looking price claims are forbidden (the index never forecasts).
 *   3. Bio discipline: no "restaurants I run/own/manage" plural drift (Don's current seat is
 *      a single front-of-house role; check-fabrications also guards this).
 *
 *   node scripts/check-cost-index-editors-note.mjs           # report (exit 0)
 *   node scripts/check-cost-index-editors-note.mjs --check   # exit 1 on any violation
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const rd = (p) => JSON.parse(fs.readFileSync(path.join(REPO, p), 'utf8'));

const notesPath = path.join(REPO, 'data/cost-index-editors-notes.json');
if (!fs.existsSync(notesPath)) {
  console.log('check-cost-index-editors-note: no notes file; nothing to check.');
  process.exit(0);
}
let notesFile, editions, claims;
try { notesFile = JSON.parse(fs.readFileSync(notesPath, 'utf8')); }
catch (e) { console.error(`editors-note: notes file is not valid JSON — ${e.message}`); process.exit(1); }
try { editions = rd('data/cost-index-editions.json').editions || []; } catch { editions = []; }
try { claims = JSON.stringify(rd('data/sourced-claims.json')); } catch { claims = ''; }

const editionByAsOf = Object.fromEntries(editions.map((e) => [e.asOf, e]));
const FORECAST = /\b(forecast|predict|will\s+(rise|fall|climb|drop|jump|spike)|expect(?:ed|s)?\s+to\s+(?:rise|fall|climb|drop)|going\s+to\s+(?:rise|fall)|next\s+week['’]?s?\s+price)\b/i;
const BIO = /\b(restaurants\s+I\s+(?:run|own|manage|operate)|my\s+restaurants|the\s+restaurants\s+I)\b/i;

// Build the set of number-strings the edition can back.
function allowedNumbers(ed) {
  const set = new Set();
  const addPct = (v) => { if (typeof v === 'number') { set.add(Math.abs(v * 100).toFixed(1)); set.add((v * 100).toFixed(1)); set.add(Math.abs(Math.round(v * 100)).toString()); } };
  const addCents = (c) => { if (typeof c === 'number') { set.add((c / 100).toFixed(2)); set.add(Math.round(c / 100).toString()); } };
  if (ed.basket) addPct(ed.basket.pct);
  for (const v of Object.values(ed.reads || {})) addPct(v);
  for (const f of (ed.flags || [])) { addPct(f.pct); addCents(f.medianCents); }
  for (const c of ((ed.basket && ed.basket.contributors) || [])) addPct(c.pct);
  if (ed.spread) for (const v of Object.values(ed.spread)) set.add(String(v));
  for (let y = 2024; y <= 2030; y++) set.add(String(y));
  return set;
}

const errors = [];
let noteCount = 0;
for (const [asOf, note] of Object.entries(notesFile.notes || {})) {
  if (!note || !note.text) continue;
  noteCount++;
  const ed = editionByAsOf[asOf];
  if (!ed) { errors.push(`${asOf}: note has no matching edition in cost-index-editions.json`); continue; }
  const allowed = allowedNumbers(ed);
  const text = note.text;

  if (FORECAST.test(text)) errors.push(`${asOf}: note contains a forecast/forward-price claim — not permitted`);
  if (BIO.test(text)) errors.push(`${asOf}: note drifts the operator bio (plural-restaurant ownership)`);

  // Extract risky number tokens: percentages, dollar amounts, multi-digit integers.
  const tokens = [];
  for (const m of text.matchAll(/[-+]?\d+(?:\.\d+)?%/g)) tokens.push(m[0].replace(/[+%]/g, ''));
  for (const m of text.matchAll(/\$\s?\d+(?:\.\d+)?/g)) tokens.push(m[0].replace(/[$\s]/g, ''));
  for (const m of text.matchAll(/(?<![\d.$])\d{2,}(?!\.\d)(?![\d%])/g)) tokens.push(m[0]);

  for (const t of tokens) {
    const norm = t.replace(/^-/, '');
    const inClaims = claims.includes(norm) || claims.includes(t);
    if (!allowed.has(norm) && !allowed.has(t) && !inClaims) {
      errors.push(`${asOf}: number "${t}" in the note is not in the edition snapshot or sourced-claims (every number must be traceable)`);
    }
  }
}

if (errors.length) {
  console.error(`check-cost-index-editors-note: ${errors.length} violation(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  if (checkOnly) process.exit(1);
} else {
  console.log(`check-cost-index-editors-note: clean. ${noteCount} note(s) checked.`);
}
