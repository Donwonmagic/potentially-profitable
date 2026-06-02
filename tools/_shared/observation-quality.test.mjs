/**
 * Pins the observation quality gate — the garbage-in defense. The
 * load-bearing invariant: a poisoned observation must LOWER confidence
 * (reject or down-weight), never silently move a confident-looking
 * number. Unit mismatch is the one hard reject; real shocks are kept.
 *
 *   node --test tools/_shared/observation-quality.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Q = require('./observation-quality.js');
const C = require('./composite-price.js');

test('unit mismatch is a HARD reject (wrong, not low-confidence)', () => {
  const v = Q.validateObservation(
    { source: 'ams', basis: 'wholesale', valueCents: 4000, unit: 'case', date: '2026-05-01' },
    { expectedUnit: 'lb' });
  assert.equal(v.ok, false);
  assert.deepEqual(v.flags, ['unit_mismatch']);
});

test('a backward / repeated date is rejected (republish/cache bug)', () => {
  const v = Q.validateObservation(
    { source: 'ams', basis: 'wholesale', valueCents: 1400, date: '2026-04-01' },
    { prevDate: '2026-05-01' });
  assert.equal(v.ok, false);
  assert.deepEqual(v.flags, ['date_backward']);
});

test('non-positive and wildly-out-of-band values are rejected', () => {
  assert.equal(Q.validateObservation({ source: 'a', basis: 'wholesale', valueCents: 0, date: '2026-05-01' }, {}).ok, false);
  // band $10–$20; a $500 (units flip) is > hi*2 → hard reject.
  const v = Q.validateObservation(
    { source: 'a', basis: 'wholesale', valueCents: 50000, date: '2026-05-01' },
    { bounds: { minCents: 1000, maxCents: 2000 } });
  assert.equal(v.ok, false);
  assert.deepEqual(v.flags, ['implausible_hard']);
});

test('mildly out of band is KEPT but down-weighted (a real shock is not silenced)', () => {
  const v = Q.validateObservation(
    { source: 'a', basis: 'wholesale', valueCents: 2400, date: '2026-05-01' }, // just over $20 hi
    { bounds: { minCents: 1000, maxCents: 2000 } });
  assert.equal(v.ok, true);
  assert.equal(v.weight, 0.4);
  assert.ok(v.flags.includes('out_of_band'));
});

test('stale → kept but not level-eligible (usable for trend, not current level)', () => {
  const v = Q.validateObservation(
    { source: 'a', basis: 'wholesale', valueCents: 1400, date: '2026-01-01' },
    { asOf: '2026-06-01', maxAgeDays: 30 });
  assert.equal(v.ok, true);
  assert.equal(v.levelEligible, false);
  assert.ok(v.flags.includes('stale'));
});

test('a statistical outlier vs the source history is down-weighted, not dropped', () => {
  const v = Q.validateObservation(
    { source: 'a', basis: 'wholesale', valueCents: 20000, date: '2026-05-01' },
    { history: [10000, 10200, 9800, 10100, 9900] });
  assert.equal(v.ok, true);
  assert.equal(v.weight, 0.5);
  assert.ok(v.flags.includes('outlier'));
});

test('index observations skip value-vetting and are never level-eligible', () => {
  const v = Q.validateObservation({ source: 'ppi', basis: 'index', value: 113, date: '2026-05-01' }, {});
  assert.equal(v.ok, true);
  assert.equal(v.levelEligible, false);
});

test('screen filters hard rejects and reports the lowest per-source weight', () => {
  const r = Q.screen([
    { source: 'x', basis: 'wholesale', valueCents: 1400, date: '2026-05-01' },
    { source: 'x', basis: 'wholesale', valueCents: 2400, date: '2026-05-02' }, // out_of_band → 0.4
    { source: 'y', basis: 'wholesale', valueCents: 50000, date: '2026-05-01', unit: 'case' }, // mismatch → rejected
  ], { bounds: { minCents: 1000, maxCents: 2000 }, expectedUnit: 'lb' });
  assert.equal(r.kept.length, 2);
  assert.equal(r.rejected.length, 1);
  assert.equal(r.sourceWeight.x, 0.4); // min over x's two points
});

test('INVARIANT: a poisoned obs cannot move the composite level (rejected, level unchanged)', () => {
  const clean = [
    { source: 'a', basis: 'wholesale', valueCents: 1300, date: '2026-05-01' },
    { source: 'b', basis: 'wholesale', valueCents: 1400, date: '2026-05-01' },
    { source: 'c', basis: 'wholesale', valueCents: 1500, date: '2026-05-01' },
  ];
  const cleanLevel = C.compositeLevel(clean);
  // inject a unit-flipped poison ($/case read as a huge $/lb)
  const poisoned = clean.concat([{ source: 'bad', basis: 'wholesale', valueCents: 90000, date: '2026-05-01', unit: 'case' }]);
  const screened = Q.screen(poisoned, { expectedUnit: 'lb', bounds: { minCents: 800, maxCents: 2500 } });
  const safeLevel = C.compositeLevel(screened.kept);
  assert.equal(screened.rejected.length, 1);          // poison caught
  assert.equal(safeLevel.medianCents, cleanLevel.medianCents); // 1400, unmoved
  assert.deepEqual(safeLevel.rangeCents, cleanLevel.rangeCents);
});
