import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const LF = require('./cost-lockfloat.js');
const { conformalNext } = require('./cost-conformal.js');
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');

// A conformal-shaped stub with only the allowlisted fields.
function conf(o) {
  return Object.assign({ halfWidthPct: 0.05, coverage: 0.8, coverageLo: 0.7, coverageHi: 0.88, nEff: 60, nTested: 148, degenerate: false, upPct: 0.05, downPct: 0.05 }, o);
}

test('withhold FIRST: no deep series → withhold/no-series', () => {
  assert.deepEqual(pick(LF.classify(null, { hasDeep: false })), ['withhold', 'no-series']);
});
test('withhold: null conformal → thin (weekly) / monthly-thin (monthly)', () => {
  assert.deepEqual(pick(LF.classify(null, { hasDeep: true, monthly: false })), ['withhold', 'thin']);
  assert.deepEqual(pick(LF.classify(null, { hasDeep: true, monthly: true })), ['withhold', 'monthly-thin']);
});
test('withhold: degenerate (flat/stale) before any bucketing', () => {
  assert.deepEqual(pick(LF.classify(conf({ degenerate: true, halfWidthPct: 0 }))), ['withhold', 'flat']);
});
test('withhold: coverage null → thin; monthly + few reads → monthly-thin', () => {
  assert.deepEqual(pick(LF.classify(conf({ coverage: null }))), ['withhold', 'thin']);
  assert.deepEqual(pick(LF.classify(conf({ coverage: null, nTested: 27 }), { monthly: true })), ['withhold', 'monthly-thin']);
});
test('withhold: band wider than the float ceiling → volatile', () => {
  assert.deepEqual(pick(LF.classify(conf({ halfWidthPct: 0.51 }))), ['withhold', 'volatile']);
});

test('LOCK requires a tight band AND a proven one (coverageLo ≥ 0.60)', () => {
  assert.equal(LF.classify(conf({ halfWidthPct: 0.04, coverageLo: 0.64 })).bucket, 'lock');
  // tight but NOT proven → falls to cushion, never lock
  assert.equal(LF.classify(conf({ halfWidthPct: 0.04, coverageLo: 0.55 })).bucket, 'cushion');
});
test('CUSHION and FLOAT boundaries are exact', () => {
  assert.equal(LF.classify(conf({ halfWidthPct: 0.08, coverageLo: 0.7 })).bucket, 'lock');     // 8% == lock ceiling
  assert.equal(LF.classify(conf({ halfWidthPct: 0.081, coverageLo: 0.7 })).bucket, 'cushion'); // just over → cushion
  assert.equal(LF.classify(conf({ halfWidthPct: 0.20 })).bucket, 'cushion');                   // 20% == cushion ceiling
  assert.equal(LF.classify(conf({ halfWidthPct: 0.21 })).bucket, 'float');                     // just over → float
  assert.equal(LF.classify(conf({ halfWidthPct: 0.30 })).bucket, 'float');                     // 30% == float ceiling
  assert.equal(LF.classify(conf({ halfWidthPct: 0.31 })).bucket, 'withhold');                  // beyond → withhold/volatile
});
test('every result carries the receipt fields (never a bare bucket)', () => {
  const r = LF.classify(conf({}));
  for (const f of ['coverage', 'coverageLo', 'coverageHi', 'upPct', 'downPct', 'nTested', 'halfWidthPct'])
    assert.ok(f in r, `${f} present`);
  assert.ok(LF.BUCKETS.includes(r.bucket));
});
test('the classifier only touches allowlisted conformal fields (source discipline)', () => {
  const src = fs.readFileSync(path.join(repo, 'tools/_shared/cost-lockfloat.js'), 'utf8');
  const body = src.slice(src.indexOf('function classify'));
  for (const forbidden of ['point', 'medianCents', 'level', 'spark', 'verdict', 'trend', 'percentile', 'seasonal', 'interval'])
    assert.doesNotMatch(body, new RegExp('conf\\.' + forbidden + '\\b'), `classify() must not read conf.${forbidden}`);
});

// ---- real-ingredient pins (the buckets must hold on the shipped data) ----
const HIST = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(repo, 'data/cost-index-history.json'), 'utf8')).ingredients || {}; }
  catch { return {}; }
})();
function bucketOf(slug, monthly) {
  const d = HIST[slug];
  if (!Array.isArray(d) || d.length < 24) return LF.classify(null, { hasDeep: false }).bucket;
  const vals = d.map((p) => p.valueCents).filter((x) => typeof x === 'number');
  return LF.classify(conformalNext(vals), { monthly: !!monthly, hasDeep: true }).bucket;
}
test('REAL DATA: staples with tight PROVEN bands are lockable', () => {
  for (const s of ['butter', 'cheddar-cheese', 'pork-shoulder'])
    if (HIST[s]) assert.equal(bucketOf(s), 'lock', `${s} should be lock`);
});
test('REAL DATA: the proven-band gate holds — a tight band with coverageLo<0.60 is cushion, not lock', () => {
  // chicken-breast's band is tight (~5%) but its Wilson coverage floor is ~0.595, just
  // under the 0.60 proven bar — so the honest gate demotes it to cushion, never lock.
  if (HIST['chicken-breast']) assert.equal(bucketOf('chicken-breast'), 'cushion');
});
test('REAL DATA: wild produce floats or is withheld, never lockable', () => {
  // Genuinely volatile produce — deliberately NOT storage crops like russet potato, which
  // on 25 years of data is a legitimately tight (~4.5%), proven (covLo ~0.72) lock.
  for (const s of ['tomato', 'broccoli', 'cauliflower'])
    if (HIST[s]) assert.ok(['float', 'withhold'].includes(bucketOf(s)), `${s} must not be lock`);
});
test('REAL DATA: a genuinely volatile staple (eggs) is withheld, never lockable', () => {
  // Eggs swing far too wide (half-width ~57%) to fence — the honest call is withhold.
  // (The thin/monthly-thin withhold paths are covered by the synthetic gate tests above.)
  if (HIST['eggs']) assert.equal(bucketOf('eggs'), 'withhold');
});
test('REAL DATA: a flat/degenerate series (carrot) is withheld, never a ±0%/100% lock', () => {
  if (HIST['carrot']) assert.equal(bucketOf('carrot'), 'withhold');
});

function pick(r) { return [r.bucket, r.reason]; }
