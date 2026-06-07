/**
 * Tests for the Muntin Restaurant Basket headline index (cost-basket.js).
 * Pins the weighted-median composition, coverage/confidence, the oldest-date
 * asOf, and the honesty rail (never a level, never "what restaurants pay").
 *
 *   node --test tools/_shared/cost-basket.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const B = require('./cost-basket.js');

const r = (pct, asOf) => ({ trend: { pct }, asOf });

test('weighted median of trends, weighted by basket weight', () => {
  // protein-heavy basket; the big-weight ingredients sit near +5%, an outlier veg at +40%.
  const results = {
    chicken: r(0.05, '2026-05-01'),
    beef: r(0.06, '2026-05-01'),
    pork: r(0.04, '2026-05-01'),
    romaine: r(0.40, '2026-05-01'),
  };
  const weights = { chicken: 0.4, beef: 0.3, pork: 0.2, romaine: 0.1 };
  const b = B.basketTrend(results, weights);
  assert.equal(b.dir, 'up');
  assert.ok(b.pct < 0.10, 'the 40% veg outlier must not drag the weighted-median headline up');
  assert.equal(b.coverage, 1);
  assert.equal(b.nContributing, 4);
});

test('coverage + confidence step down when the basket is thin', () => {
  const results = { chicken: r(0.05, '2026-05-01') };               // only 1 of 4 priced
  const weights = { chicken: 0.4, beef: 0.3, pork: 0.2, romaine: 0.1 };
  const b = B.basketTrend(results, weights);
  assert.equal(b.coverage, 0.4);
  assert.equal(b.confidence, 'low');                                // 1 ingredient → never high/medium
  assert.equal(b.nContributing, 1);
});

test('asOf is the OLDEST contributing date (a freshness floor, not the newest)', () => {
  const results = { chicken: r(0.05, '2026-05-01'), beef: r(0.06, '2026-03-15') };
  const b = B.basketTrend(results, { chicken: 0.5, beef: 0.5 });
  assert.equal(b.asOf, '2026-03-15');
});

test('an empty/unpriced basket yields a null headline, not a fake zero', () => {
  const b = B.basketTrend({}, { chicken: 0.5, beef: 0.5 });
  assert.equal(b.pct, null);
  assert.match(B.basketPhrase(b), /Not enough/);
});

test('the phrase is a basis-agnostic trend — never a level or a dollar figure', () => {
  const b = B.basketTrend({ chicken: r(0.063, '2026-05-01') }, { chicken: 1 });
  const phrase = B.basketPhrase(b);
  assert.match(phrase, /moved up \+6\.3%/);
  assert.match(phrase, /not a price level/);
  assert.doesNotMatch(phrase, /\$/);                                // never a dollar level
});
