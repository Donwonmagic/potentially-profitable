// node:test suite pinning cost-anomaly.js behavior. Run: node --test tools/_shared/cost-anomaly.test.mjs
// Discovered automatically by scripts/check-tests.mjs (glob over tools/_shared/*.test.mjs).
// PARITY: when ported to the Ledger (packages/cost-alerts/tests/cost-anomaly.test.ts), copy
// these vectors VERBATIM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const A = require(path.join(path.dirname(fileURLToPath(import.meta.url)), 'cost-anomaly.js'));

test('hampel: a clean series flags nothing', () => {
  const r = A.hampel([100, 101, 99, 100, 102, 98, 101, 100, 99, 101]);
  assert.equal(r.count, 0);
  assert.ok(r.flags.every((f) => f === 0));
});

test('hampel: a single injected spike is flagged at its index only', () => {
  const r = A.hampel([100, 101, 99, 100, 500, 98, 101, 100, 99, 101], { k: 3, nSigma: 3 });
  assert.equal(r.count, 1);
  assert.equal(r.flags.indexOf(1), 4);
  assert.ok(r.scores[4] > 3);
});

test('hampel: too-short windows never false-alarm', () => {
  const r = A.hampel([1, 2]);
  assert.deepEqual(r.flags, [0, 0]);
  assert.equal(r.count, 0);
});

test('pettitt: a clear level step is dated and significant', () => {
  const r = A.pettitt([10, 10, 10, 10, 10, 10, 20, 20, 20, 20, 20, 20]);
  assert.equal(r.index, 5);          // first regime = v[0..5]
  assert.equal(r.K, 36);
  assert.equal(r.pApprox, 0.031);
  assert.equal(r.significant, true);
});

test('pettitt: stationary noise yields no significant break', () => {
  const r = A.pettitt([100, 101, 100, 102, 99, 101, 100, 101, 99, 100, 101, 100]);
  assert.equal(r.significant, false);
  assert.equal(r.pApprox, 1);
});

test('pettitt: too-short series returns null', () => {
  assert.equal(A.pettitt([1, 2, 3]), null);
});

test('detect: deterministic and well-formed', () => {
  const v = [10, 10, 10, 20, 20, 20, 10, 10, 10, 20, 20, 20];
  const a = A.detect(v), b = A.detect(v);
  assert.deepEqual(a, b);
  assert.equal(a.n, 12);
  assert.ok(a.hampel.scores.every((s) => s >= 0));
  assert.ok(a.changePoint.pApprox >= 0 && a.changePoint.pApprox <= 1);
});
