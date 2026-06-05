/**
 * Tests for the lead-lag analyzer (cost-leadlag.js). Pins that it finds a real
 * planted lag, refuses to over-read noise, and never claims causation.
 *
 *   node --test tools/_shared/cost-leadlag.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const L = require('./cost-leadlag.js');

test('pearson: perfect positive correlation = 1', () => {
  assert.equal(L.pearson([1, 2, 3, 4], [2, 4, 6, 8]), 1);
});

test('bestLag finds a planted lag: follower = leader shifted by 2 periods', () => {
  // leader rises 1..12; follower repeats leader two periods LATER.
  const leader = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const follower = [99, 99, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // follower[t] = leader[t-2]
  const res = L.bestLag(leader, follower, { maxLag: 4, minOverlap: 6 });
  assert.equal(res.lag, 2);
  assert.ok(res.corr > 0.99);
});

test('bestLag returns null when overlap is below the floor (honest no-answer)', () => {
  assert.equal(L.bestLag([1, 2, 3], [1, 2, 3], { maxLag: 1, minOverlap: 8 }), null);
});

test('framing: a real lag reads as association-with-a-lag, never causation', () => {
  const s = L.framing({ lag: 10, corr: 0.72 }, 'Feed-grain', 'chicken', 'weeks');
  assert.match(s, /~10 weeks before chicken/);
  assert.match(s, /not a proven cause/);
  assert.doesNotMatch(s, /causes|because of/i);
});

test('framing: weak correlation → "no clear lead yet", not a spurious story', () => {
  assert.match(L.framing({ lag: 3, corr: 0.12 }, 'Diesel', 'beef', 'weeks'), /no clear lead/);
});

test('framing: lag 0 → "moves alongside" (coincident, like diesel)', () => {
  assert.match(L.framing({ lag: 0, corr: 0.65 }, 'Diesel', 'food', 'weeks'), /move alongside/);
});
