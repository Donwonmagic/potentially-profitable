/**
 * Tests for the spike-vs-structural classifier (cost-spike.js).
 * Pins the calibrated rule: persistence/retrace decide, not magnitude; thin
 * history defaults to WATCH (never "hold" through a possible real hike).
 *
 *   node --test tools/_shared/cost-spike.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const M = require('./cost-spike.js');

// helper: build a newest-first points array from a newest-first cents list
const pts = (centsNewestFirst) => centsNewestFirst.map((c) => ({ level: { medianCents: c } }));

test('thin history → insufficient → WATCH (never hold through a possible real hike)', () => {
  const r = M.classify(pts([2200, 2100, 2000]));
  assert.equal(r.verdict, 'insufficient');
  assert.equal(r.actionBias, 'watch');
});

test('flat: a move within the normal band → no action', () => {
  const r = M.classify(pts([1010, 1005, 1000, 1008, 1002, 1006, 1003, 1001, 1004, 1000]));
  assert.equal(r.verdict, 'flat');
  assert.equal(r.actionBias, 'hold');
});

test('structural: elevated and sustained → re-price', () => {
  // older half ~$10 baseline; recent 8 weeks all elevated ~$13 and HOLDING (no retrace).
  const r = M.classify(pts([1300, 1310, 1290, 1305, 1300, 1295, 1300, 1300, 1000, 1010, 990, 1000]));
  assert.equal(r.verdict, 'structural');
  assert.equal(r.actionBias, 're-price');
  assert.ok(r.elevatedWeeks >= 4);
});

test('spike: ran up to a peak then retraced a third+ → hold (reverting)', () => {
  // baseline ~$10; peaked at $20 a few weeks back; current pulled back to ~$12 (40% off peak).
  const r = M.classify(pts([1200, 1500, 2000, 1800, 1200, 1000, 1000, 1000, 1000, 1000, 1000, 1000]));
  assert.equal(r.verdict, 'spike');
  assert.equal(r.actionBias, 'hold');
  assert.ok(r.retrace >= 1 / 3);
});

test('easing: a material DOWN move → hold (maybe renegotiate), never re-price up', () => {
  const r = M.classify(pts([700, 720, 740, 760, 980, 1000, 1010, 1000, 1000, 1000]));
  assert.equal(r.verdict, 'easing');
  assert.notEqual(r.actionBias, 're-price');
  assert.ok(r.move < 0);
});

test('emerging: a real move that has not persisted yet → watch', () => {
  // baseline ~$10; only the latest 1-2 weeks tick up, not yet sustained, no retrace.
  const r = M.classify(pts([1150, 1020, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]));
  assert.equal(r.verdict, 'emerging');
  assert.equal(r.actionBias, 'watch');
});
