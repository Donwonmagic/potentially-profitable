import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { ols, adf, engleGranger, bridgeFit } = require('./cost-cointegration.js');

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(rng) { let u = 0, v = 0; while (u === 0) u = rng(); while (v === 0) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function randomWalk(n, seed, scale = 1) { const r = mulberry32(seed); const v = [100]; for (let i = 1; i < n; i++) v.push(v[i - 1] + gauss(r) * scale); return v; }
function ar1(n, seed, rho, scale = 1) { const r = mulberry32(seed); const v = [0]; for (let i = 1; i < n; i++) v.push(rho * v[i - 1] + gauss(r) * scale); return v; }

test('ols recovers known coefficients', () => {
  const x = [1, 2, 3, 4, 5, 6, 7, 8];
  const y = x.map((xi) => 3 + 2 * xi);
  const f = ols(x.map((xi) => [1, xi]), y);
  assert.ok(Math.abs(f.beta[0] - 3) < 1e-9 && Math.abs(f.beta[1] - 2) < 1e-9);
});

test('ADF rejects a unit root on a stationary AR(1)', () => {
  const s = ar1(300, 11, 0.4, 1);          // mean-reverting
  const a = adf(s, { regression: 'c' });
  assert.ok(a.stat < -3.0, `stationary ADF ${a.stat} should be very negative`);
  assert.ok(a.halfLife != null && a.halfLife < 5, 'fast mean reversion');
});

test('ADF does NOT reject on a random walk', () => {
  const s = randomWalk(300, 7, 1);
  const a = adf(s, { regression: 'c' });
  assert.ok(a.stat > -2.6, `random-walk ADF ${a.stat} should be near zero, not significant`);
});

test('engleGranger: a genuinely cointegrated pair is accepted', () => {
  const x = randomWalk(300, 3, 1);
  const noise = ar1(300, 99, 0.0, 0.5);    // stationary (iid) disturbance
  const y = x.map((xi, i) => 5 + 2 * xi + noise[i]);
  const eg = engleGranger(y, x, {});
  assert.ok(eg.cointegrated, `should be cointegrated (adf ${eg.adfStat} < ${eg.crit})`);
  assert.ok(Math.abs(eg.beta - 2) < 0.15, `beta ${eg.beta} ≈ 2`);
});

test('SPURIOUS TRAP: two independent random walks are NOT cointegrated', () => {
  // The classic spurious regression: high correlation, no real relationship.
  let rejected = 0, trials = 0;
  for (const [sx, sy] of [[1, 2], [5, 8], [13, 21], [4, 9], [17, 6]]) {
    const x = randomWalk(250, sx, 1), y = randomWalk(250, sy, 1);
    const eg = engleGranger(y, x, {});
    trials++; if (!eg.cointegrated) rejected++;
  }
  assert.ok(rejected >= 4, `independent walks should be rejected (${rejected}/${trials})`);
});

test('bridgeFit: publishes a derived level + residual band only when cointegrated', () => {
  const x = randomWalk(300, 3, 1);
  const noise = ar1(300, 99, 0.0, 0.5);
  const y = x.map((xi, i) => 5 + 2 * xi + noise[i]);
  const b = bridgeFit(y, x, {});
  assert.ok(b.ok && b.reason === 'cointegrated');
  const pred = b.predict(50);
  assert.ok(Math.abs(pred.level - (5 + 2 * 50)) < 3, 'derived level tracks the relationship');
  assert.ok(pred.band[0] < pred.level && pred.level < pred.band[1], 'band straddles the level');
  assert.ok(pred.band[1] - pred.band[0] > 0, 'band = residual scatter');
});

test('bridgeFit: a spurious pair yields no publishable level', () => {
  const b = bridgeFit(randomWalk(250, 5, 1), randomWalk(250, 8, 1), {});
  assert.equal(b.ok, false);
  assert.equal(b.predict(50), null, 'no number off a relationship that does not hold');
});

test('too-few overlap points → not cointegrated, with a reason', () => {
  const eg = engleGranger([1, 2, 3, 4, 5], [2, 4, 6, 8, 10], {});
  assert.equal(eg.cointegrated, false);
  assert.match(eg.reason, /few/);
});
