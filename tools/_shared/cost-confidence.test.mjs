import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { levelConfidence, trendConfidence, isShippable } = require('./cost-confidence.js');

// Shapes mirror real vendored points (data/cost-index.json).
const measuredRange = { medianCents: 2200, rangeCents: [1575, 2825], basis: 'wholesale', rangeBasis: 'markets', nTypes: 1, nFamilies: 7, typeDispersion: 0 };
const singleBand = { medianCents: 1159, rangeCents: [1129, 1189], basis: 'wholesale', rangeBasis: 'volatility', nTypes: 1, nFamilies: 1, typeDispersion: 0 };
const indexOnly = { medianCents: 100, basis: 'index', nTypes: 2 };

test('levelConfidence: one type → medium; index/none → null', () => {
  assert.equal(levelConfidence(measuredRange), 'medium');
  assert.equal(levelConfidence(singleBand), 'medium');
  assert.equal(levelConfidence(indexOnly), null);
  assert.equal(levelConfidence(null), null);
});

test('levelConfidence: two agreeing types → high; two disagreeing → capped medium', () => {
  assert.equal(levelConfidence({ medianCents: 500, basis: 'wholesale', nTypes: 2, typeDispersion: 0.05 }), 'high');
  assert.equal(levelConfidence({ medianCents: 500, basis: 'wholesale', nTypes: 2, typeDispersion: 0.30 }), 'medium');
});

test('trendConfidence: clean corroborated trend → high; noisy → capped', () => {
  assert.equal(trendConfidence({ pct: 0.1, nTypes: 3, agreement: 1, noise: 0.05 }), 'high');
  assert.equal(trendConfidence({ pct: 0.1, nTypes: 2, agreement: 1, noise: 0.12 }), 'medium'); // 0.08<noise<=0.20 caps to medium
  assert.equal(trendConfidence({ pct: 0.1, nTypes: 2, agreement: 1, noise: 0.30 }), 'low');    // noise>0.20 → low
  assert.equal(trendConfidence(null), null);
});

test('trendConfidence: cross-market dispersion (≥3 markets, one type) earns medium, never high', () => {
  // 8 USDA terminal markets agreeing on direction — one methodology (nTypes=1).
  assert.equal(trendConfidence({ pct: 0.1, nTypes: 1, nFamilies: 8, agreement: 0.875, noise: 0.05 }), 'medium');
  // Capped at medium even with perfect agreement — 'high' needs ≥2 independent dollar types (the moat).
  assert.equal(trendConfidence({ pct: 0.1, nTypes: 1, nFamilies: 8, agreement: 1, noise: 0.02 }), 'medium');
  // Fewer than 3 markets, one type → low (no cross-market basis to lean on).
  assert.equal(trendConfidence({ pct: 0.1, nTypes: 1, nFamilies: 2, agreement: 1, noise: 0.02 }), 'low');
  // A noisy cross-market path still self-caps to low (jagged = noise dressed as trend).
  assert.equal(trendConfidence({ pct: 0.1, nTypes: 1, nFamilies: 8, agreement: 0.875, noise: 0.30 }), 'low');
});

test('SHIPPABLE BAR: measured cross-market range ships (produce)', () => {
  assert.equal(isShippable({ level: measuredRange, trend: { pct: -0.089, nTypes: 2, agreement: 0.625, noise: 0.378 } }), true,
    'a 7-market measured range ships even with a noisy trend');
});

test('SHIPPABLE BAR: single source + corroborated trend ships (ribeye, whole-chicken)', () => {
  assert.equal(isShippable({ level: singleBand, trend: { pct: 0.30, nTypes: 3, agreement: 1, noise: 0.064 } }), true);
  assert.equal(isShippable({ level: singleBand, trend: { pct: 0.0, nTypes: 2, agreement: 0.5, noise: 0.039 } }), true,
    'moderate agreement is fine; the authoritative level is trusted when not pathologically noisy');
});

test('SHIPPABLE BAR: drops eggs (single source, pathologically noisy trend)', () => {
  assert.equal(isShippable({ level: { medianCents: 56, basis: 'wholesale', rangeBasis: 'volatility', nFamilies: 1, nTypes: 1 },
    trend: { pct: -0.062, nTypes: 3, agreement: 0.667, noise: 0.261 } }), false);
});

test('SHIPPABLE BAR: drops no-dollar-level items (vegetable oil, shrimp)', () => {
  assert.equal(isShippable({ level: null, trend: { pct: 0.129, nTypes: 2, agreement: 1, noise: 0.144 } }), false);
  assert.equal(isShippable({ level: indexOnly, trend: { pct: 0.4, nTypes: 3, agreement: 0.667, noise: 0.087 } }), false);
});
