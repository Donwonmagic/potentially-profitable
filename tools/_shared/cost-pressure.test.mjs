import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { assess, discretize } = require('./cost-pressure.js');

// A chicken-like panel: feed futures up = cost up (+); placements up = supply up
// = cost down (−); cold storage up = cost down (−).
const panel = {
  item: 'chicken-breast', rule_version: 'test-1', cutoffT: 2, deadband: 0.02,
  decay: { weeksPerNotch: 3, floorWeeks: 8 },
  indicators: [
    { id: 'corn', source: 'AMS', sign: 1, weight: 3, tier: 'A', cite: 'x' },
    { id: 'placements', source: 'NASS', sign: -1, weight: 2, tier: 'B', cite: 'x' },
    { id: 'coldstorage', source: 'NASS', sign: -1, weight: 1, tier: 'C', cite: 'x' }
  ]
};
const opts = { anchorPrintDate: '2026-06-01', asOf: '2026-06-08' }; // 1 week fresh

test('discretize honors the deadband', () => {
  assert.equal(discretize(0.05, 0.02), 1);
  assert.equal(discretize(-0.05, 0.02), -1);
  assert.equal(discretize(0.01, 0.02), 0);
  assert.equal(discretize(null, 0.02), 0);
});

test('all signals point up → building, high agreement', () => {
  // corn up (+1·3), placements down (supply down → cost up: sign −1 × −1 = +1·2), coldstorage down (+1·1)
  const r = assess(panel, { corn: { changePct: 0.06 }, placements: { changePct: -0.06 }, coldstorage: { changePct: -0.06 } }, opts);
  assert.equal(r.direction, 'building');
  assert.equal(r.score, 6);          // 3+2+1
  assert.equal(r.agreement, 1);
  assert.equal(r.confidence, 'high');
});

test('conflicting signals → low agreement → steady', () => {
  // corn up (+3), placements up (supply up → cost down: −1×+1 = −1·2 = −2), coldstorage up (−1)
  const r = assess(panel, { corn: { changePct: 0.06 }, placements: { changePct: 0.06 }, coldstorage: { changePct: 0.06 } }, opts);
  assert.equal(r.score, 0);          // 3 − 2 − 1
  assert.equal(r.direction, 'steady');
  assert.equal(r.confidence, 'low'); // agreement 0
});

test('NO price field exists on the record (fabrication impossible)', () => {
  const r = assess(panel, { corn: { changePct: 0.06 } }, opts);
  for (const k of ['value', 'price', 'level', 'medianCents', 'cents']) {
    assert.ok(!(k in r), `record must not carry a ${k} field`);
  }
});

test('correlated indicators share one weight bucket (no double-count)', () => {
  const grouped = {
    item: 'x', cutoffT: 2, deadband: 0.02,
    indicators: [
      { id: 'wasde', sign: 1, weight: 3, group: 'feed-outlook', cite: 'x' },
      { id: 'cornfut', sign: 1, weight: 3, group: 'feed-outlook', cite: 'x' } // priced-in by WASDE
    ]
  };
  const r = assess(grouped, { wasde: { changePct: 0.06 }, cornfut: { changePct: 0.06 } }, opts);
  assert.equal(r.score, 3, 'two correlated up-signals contribute at most the bucket weight (3), not 6');
});

test('staleness decay steps confidence down, then suppresses to under-review', () => {
  const obs = { corn: { changePct: 0.06 }, placements: { changePct: -0.06 }, coldstorage: { changePct: -0.06 } };
  // 6 weeks past print = 2 notches (weeksPerNotch 3): high → low
  const r6 = assess(panel, obs, { anchorPrintDate: '2026-06-01', asOf: '2026-07-13' });
  assert.equal(r6.confidence, 'low');
  assert.equal(r6.direction, 'building');
  // 10 weeks past print > floorWeeks(8) → under review, arrow suppressed
  const r10 = assess(panel, obs, { anchorPrintDate: '2026-06-01', asOf: '2026-08-10' });
  assert.equal(r10.under_review, true);
  assert.equal(r10.direction, 'steady');
  assert.equal(r10.confidence, 'low');
});

test('no observations → unknown (never a fabricated lean)', () => {
  const r = assess(panel, {}, opts);
  assert.equal(r.direction, 'unknown');
  assert.equal(r.contributors.length, 0);
});

test('breadth floor: a lone surviving signal cannot claim high confidence', () => {
  // Only corn reports (placements + coldstorage absent — e.g. a fetch gap, or an
  // off-season indicator). Score 3 ≥ cutoff → building, agreement trivially 1.0.
  // But with a sample of ONE, confidence must floor to 'low', not 'high'.
  const r = assess(panel, { corn: { changePct: 0.06 } }, opts);
  assert.equal(r.direction, 'building');
  assert.equal(r.agreement, 1);
  assert.equal(r.contributors.length, 1);
  assert.equal(r.confidence, 'low', 'one indicator is a hint, not a confident read');
});

test('breadth floor: two agreeing signals cap at moderate (high needs three)', () => {
  // corn up (+3) + coldstorage down→cost up (+1): agreement 1.0, but only 2 of the
  // panel reported, so the ceiling is 'moderate' until a third aligns.
  const r = assess(panel, { corn: { changePct: 0.06 }, coldstorage: { changePct: -0.06 } }, opts);
  assert.equal(r.direction, 'building');
  assert.equal(r.agreement, 1);
  assert.equal(r.contributors.length, 2);
  assert.equal(r.confidence, 'moderate');
});
