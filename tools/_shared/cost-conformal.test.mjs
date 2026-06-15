import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { conformalNext, quantile, residuals } = require('./cost-conformal.js');

// Deterministic PRNG so the coverage assertions are reproducible.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Random walk with iid steps drawn from `step(rng)`; integer cents.
function walk(n, seed, step) {
  const rng = mulberry32(seed); const out = [1000]; // start at $10.00
  for (let i = 1; i < n; i++) out.push(Math.max(1, Math.round(out[i - 1] + step(rng()))));
  return out;
}

test('quantile: linear interpolation, endpoints', () => {
  const s = [0, 10, 20, 30, 40];
  assert.equal(quantile(s, 0), 0);
  assert.equal(quantile(s, 1), 40);
  assert.equal(quantile(s, 0.5), 20);
  assert.equal(quantile(s, 0.25), 10);
});

test('residuals: one-step differences', () => {
  assert.deepEqual(residuals([100, 110, 105]), [10, -5]);
});

test('too-short series → null (no honest band)', () => {
  assert.equal(conformalNext([100, 101, 102]), null);
  assert.equal(conformalNext([], {}), null);
});

test('interval brackets the last value and is finite', () => {
  const v = walk(120, 42, (r) => (r - 0.5) * 60);   // ±~30¢/step symmetric
  const r = conformalNext(v, { alpha: 0.20 });
  assert.ok(r, 'returns a result');
  assert.ok(isFinite(r.interval[0]) && isFinite(r.interval[1]));
  assert.ok(r.interval[0] <= r.point && r.point <= r.interval[1], 'band straddles the last print');
  assert.equal(r.nominal, 0.8);
});

test('COVERAGE: an 80% conformal band actually covers ~80% on a random walk', () => {
  // Long, well-behaved random walk → empirical coverage should land near nominal.
  const v = walk(400, 7, (r) => (r - 0.5) * 80);
  const r = conformalNext(v, { alpha: 0.20, window: 52 });
  assert.ok(r.coverage != null, 'enough tested steps to state a rate');
  assert.ok(r.nTested >= 100);
  // Finite-sample tolerance: nominal 0.80, allow a generous honest band.
  assert.ok(r.coverage >= 0.68 && r.coverage <= 0.92, `coverage ${r.coverage} near 0.80`);
});

test('COVERAGE: a 50% band covers ~50% (the rate tracks the nominal you ask for)', () => {
  const v = walk(400, 99, (r) => (r - 0.5) * 80);
  const r = conformalNext(v, { alpha: 0.50, window: 52 });
  assert.equal(r.nominal, 0.5);
  assert.ok(r.coverage >= 0.38 && r.coverage <= 0.62, `coverage ${r.coverage} near 0.50`);
});

test('coverage is null (provisional) when too few steps to verify', () => {
  const v = walk(14, 3, (r) => (r - 0.5) * 40);   // short → < minCover scored steps
  const r = conformalNext(v, { alpha: 0.20 });
  assert.ok(r, 'still produces a band');
  assert.equal(r.coverage, null, 'but refuses to claim a coverage rate');
});

test('asymmetric residuals → asymmetric band (captures rockets-and-feathers)', () => {
  // Up moves big, down moves small → upper tail wider than lower around the last value.
  const v = walk(300, 21, (r) => (r < 0.5 ? r * 120 : -(r - 0.5) * 20));
  const r = conformalNext(v, { alpha: 0.20, window: 60 });
  const upWidth = r.interval[1] - r.point, downWidth = r.point - r.interval[0];
  assert.ok(upWidth > downWidth, `asymmetric: up ${upWidth} > down ${downWidth}`);
});
