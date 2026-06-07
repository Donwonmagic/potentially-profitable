/**
 * Transport tests for the Cost Index live fetch (tools/_shared/cost-index-fetch.js).
 * Pins the transient-classification + bounded fan-out that keep a flaky source
 * from silently dropping (the onion/russet "fetch failed" cascade).
 *
 *   node --test tools/_shared/cost-index-fetch.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const F = require('./cost-index-fetch.js');

test('isTransient: Node\'s bare "fetch failed" (real code in e.cause) IS transient', () => {
  const e = new TypeError('fetch failed');
  e.cause = { code: 'ECONNRESET' };
  assert.equal(F.isTransient(e), true);                       // the exact bug: was treated as permanent → never retried
});

test('isTransient: timeout / abort / known network codes are transient', () => {
  assert.equal(F.isTransient(Object.assign(new Error('x'), { name: 'TimeoutError' })), true);
  assert.equal(F.isTransient(Object.assign(new Error('x'), { name: 'AbortError' })), true);
  assert.equal(F.isTransient(new Error('ETIMEDOUT')), true);
});

test('isTransient: a bad id/key (HTTP 4xx) is NOT transient — fail fast, do not retry', () => {
  assert.equal(F.isTransient(new Error('HTTP 404')), false);
  assert.equal(F.isTransient(new Error('HTTP 401')), false);
  assert.equal(F.isTransient(null), false);
});

test('mapLimit settles every item in order; one failure drops only itself', async () => {
  const calls = [];
  const out = await F.mapLimit([1, 2, 3, 4], 2, async (x) => {
    calls.push(x);
    if (x === 3) throw new Error('boom');
    return x * 10;
  });
  assert.equal(out.length, 4);
  assert.deepEqual(out.map((r) => r.ok), [true, true, false, true]);
  assert.deepEqual(out.filter((r) => r.ok).map((r) => r.value), [10, 20, 40]);
  assert.equal(calls.length, 4);                              // every item attempted despite the failure
});

test('amsWindow renders an MM/DD/YYYY:MM/DD/YYYY range', () => {
  assert.match(F.amsWindow(30), /^\d{2}\/\d{2}\/\d{4}:\d{2}\/\d{2}\/\d{4}$/);
});
