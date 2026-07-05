import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { nullP, benjaminiYekutieli, gatePanel, actionRank, seedFromString } = require('./cost-null-gate.js');
const Spike = require('./cost-spike.js');
const classify = Spike.classify;

// Deterministic PRNG for building synthetic fixtures (separate from the module's own).
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function walk(n, seed, stepPct) {
  const rng = mulberry32(seed); const out = [1000];
  for (let i = 1; i < n; i++) out.push(Math.max(1, Math.round(out[i - 1] * (1 + (rng() - 0.5) * stepPct))));
  return out;
}

test('actionRank: neutral verdicts are 0, calls are positive', () => {
  assert.equal(actionRank('flat'), 0);
  assert.equal(actionRank('insufficient'), 0);
  assert.ok(actionRank('structural') > actionRank('easing'));
  assert.equal(actionRank('reprice'), actionRank('structural'));
  assert.equal(actionRank(undefined), 0);
});

test('seedFromString is deterministic and slug-specific', () => {
  assert.equal(seedFromString('ribeye'), seedFromString('ribeye'));
  assert.notEqual(seedFromString('ribeye'), seedFromString('butter'));
});

test('nullP: neutral observed verdict returns 1 (nothing to gate)', () => {
  assert.equal(nullP(walk(60, 1, 0.05), 'flat', classify, { seedKey: 'x' }), 1);
});

test('nullP: too-short series returns null (withhold, do not fabricate a p)', () => {
  assert.equal(nullP([1000, 1010, 1020], 'structural', classify, { seedKey: 'x' }), null);
});

test('nullP is deterministic for a given seedKey', () => {
  const v = walk(80, 7, 0.05);
  const a = nullP(v, 'structural', classify, { seedKey: 'ribeye', B: 200 });
  const b = nullP(v, 'structural', classify, { seedKey: 'ribeye', B: 200 });
  assert.equal(a, b, 'same seed → same p-value (byte-reproducible build)');
});

test('nullP: a "structural" read on a pure random walk is NOT significant (high p)', () => {
  // The whole point of CRIT-5: on noise, "structural" fires easily, so its own-null
  // p should be large (the label is common under the item's own noise).
  const v = walk(120, 3, 0.05);
  const p = nullP(v, 'structural', classify, { seedKey: 'noise', B: 300 });
  assert.ok(p != null && p > 0.2, `random-walk structural p=${p} should be large (not a discovery)`);
});

test('benjaminiYekutieli: nothing passes when all p are large', () => {
  assert.deepEqual(benjaminiYekutieli([0.6, 0.7, 0.8, 0.9], 0.10), []);
});

test('benjaminiYekutieli: a single tiny p among many can survive; ordering is by p', () => {
  // With m=5, c=Σ1/i≈2.283; the smallest p must clear (1/(5*2.283))*0.10 ≈ 0.00876.
  const pass = benjaminiYekutieli([0.004, 0.5, 0.6, 0.7, 0.8], 0.10);
  assert.deepEqual(pass, [0], 'the 0.004 item (index 0) survives, the rest do not');
});

test('benjaminiYekutieli is more conservative than an uncorrected 0.10 cut', () => {
  // Five items each at p=0.05 would all pass an uncorrected 0.10 threshold, but BY
  // rejects them (0.05 > (5/(5*c))*0.10 for the largest rank).
  const pass = benjaminiYekutieli([0.05, 0.05, 0.05, 0.05, 0.05], 0.10);
  assert.equal(pass.length, 0, 'BY does not wave through five marginal calls');
});

test('gatePanel: a panel of noise-driven structurals is (almost) entirely withheld', () => {
  const items = [];
  for (let s = 0; s < 12; s++) {
    const levels = walk(120, 100 + s, 0.05);
    const verd = (classify(levels.slice().reverse().map((c) => ({ level: { medianCents: c }, asOf: null }))) || {}).verdict;
    items.push({ key: 'noise-' + s, levels, verdict: verd });
  }
  const res = gatePanel(items, classify, { q: 0.10, B: 200 });
  const surfacedCount = Object.keys(res.surfaced).length;
  assert.ok(surfacedCount <= 1, `noise panel surfaced ${surfacedCount}/12 — should be ~0 after BY`);
  // Determinism: identical inputs → identical surfaced set.
  const res2 = gatePanel(items, classify, { q: 0.10, B: 200 });
  assert.deepEqual(res.surfaced, res2.surfaced, 'gatePanel is deterministic');
});
