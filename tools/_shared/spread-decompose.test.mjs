/**
 * Unit tests — tools/_shared/spread-decompose.js
 * Run via:  node --test tools/_shared/spread-decompose.test.mjs
 *
 * PARITY GUARANTEE. These vectors pin the vendor-vs-market discrimination and
 * its honesty gates. Muntin Ledger mirrors them verbatim on the TypeScript port;
 * if a number moves here, it moves there in the same change.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const S = require('./spread-decompose.js');

// The canonical Caesar/romaine scenario: own delivered +14%, market +6%.
const CAESAR = {
  ownDeltaPct: 0.14, marketDeltaPct: 0.06,
  marketConfidence: 'high', marketAgreement: 0.8, vendorPeriods: 6,
};

test('vendor majority: the operator moved well past the market → attribution vendor', () => {
  const r = S.decompose(CAESAR);
  assert.equal(r.gated, false);
  assert.equal(r.attribution, 'vendor');
  assert.equal(r.reason, 'vendor-majority');
  assert.equal(r.spreadPct, 0.08);
  assert.equal(r.marketPoints, 0.06);
  assert.equal(r.vendorPoints, 0.08);
  assert.equal(r.vendorShare, 0.57);
  assert.equal(r.confidence, 'high'); // high market read + >=6 own periods
});

test('market explains it: a tiny spread is noise, not a vendor story', () => {
  const r = S.decompose({
    ownDeltaPct: 0.07, marketDeltaPct: 0.065,
    marketConfidence: 'high', marketAgreement: 0.8, vendorPeriods: 5,
  });
  assert.equal(r.gated, false);
  assert.equal(r.attribution, 'market');
  assert.equal(r.reason, 'market-explains');
  assert.equal(r.spreadPct, 0.005);
  assert.equal(r.confidence, 'medium'); // <6 own periods caps below high
});

test('mixed: vendor share is material but the market is the larger half', () => {
  const r = S.decompose({
    ownDeltaPct: 0.14, marketDeltaPct: 0.10,
    marketConfidence: 'high', marketAgreement: 0.7, vendorPeriods: 4,
  });
  assert.equal(r.attribution, 'mixed');
  assert.equal(r.reason, 'mixed-market-majority');
  assert.equal(r.spreadPct, 0.04);
  assert.equal(r.vendorShare, 0.29);
});

test('no cover: the market fell while the operator rose → vendor (strongest case)', () => {
  const r = S.decompose({
    ownDeltaPct: 0.10, marketDeltaPct: -0.03,
    marketConfidence: 'high', marketAgreement: 0.8, vendorPeriods: 5,
  });
  assert.equal(r.attribution, 'vendor');
  assert.equal(r.reason, 'vendor-no-market-cover');
  assert.equal(r.spreadPct, 0.13);
  assert.equal(r.marketPoints, -0.03);
  assert.equal(r.vendorPoints, 0.13);
});

test('downside symmetry: prices fell but the vendor cut less than the market → vendor', () => {
  const r = S.decompose({
    ownDeltaPct: -0.10, marketDeltaPct: -0.04,
    marketConfidence: 'high', marketAgreement: 0.8, vendorPeriods: 6,
  });
  assert.equal(r.attribution, 'vendor');
  assert.equal(r.reason, 'vendor-majority');
  assert.equal(r.vendorPoints, -0.06);
  assert.equal(r.confidence, 'high');
});

test('confidence ceiling: a medium market read can never yield a high attribution', () => {
  const r = S.decompose({
    ownDeltaPct: 0.14, marketDeltaPct: 0.06,
    marketConfidence: 'medium', marketAgreement: 0.7, vendorPeriods: 6,
  });
  assert.equal(r.attribution, 'vendor');
  assert.equal(r.confidence, 'medium');
});

// ---- the gates: when the comparison isn't honest, say nothing ----

test('gate: thin market confidence → inconclusive, no spread', () => {
  const r = S.decompose({ ...CAESAR, marketConfidence: 'low' });
  assert.equal(r.gated, true);
  assert.equal(r.attribution, 'inconclusive');
  assert.equal(r.reason, 'market-confidence-below-medium');
  assert.equal(r.spreadPct, null);
  assert.equal(r.confidence, 'low');
});

test('gate: market agreement below the floor → inconclusive', () => {
  const r = S.decompose({ ...CAESAR, marketAgreement: 0.5 });
  assert.equal(r.gated, true);
  assert.equal(r.reason, 'market-agreement-below-floor');
});

test('gate: fewer than 3 same-unit vendor periods → inconclusive', () => {
  const r = S.decompose({ ...CAESAR, vendorPeriods: 2 });
  assert.equal(r.gated, true);
  assert.equal(r.reason, 'insufficient-vendor-periods');
});

test('gate: each confounder blocks the read with its own reason', () => {
  for (const [flag, reason] of [
    ['packFlip', 'confounder-pack-flip'],
    ['gradeSwitch', 'confounder-grade-switch'],
    ['promo', 'confounder-promo'],
    ['windowMismatch', 'confounder-window-mismatch'],
  ]) {
    const r = S.decompose({ ...CAESAR, confounders: { [flag]: true } });
    assert.equal(r.gated, true, flag);
    assert.equal(r.attribution, 'inconclusive', flag);
    assert.equal(r.reason, reason);
    assert.equal(r.spreadPct, null, flag);
  }
});

test('gate precedence: a confounder is caught before the data-sufficiency gates', () => {
  const r = S.decompose({ ...CAESAR, marketConfidence: 'low', confounders: { packFlip: true } });
  assert.equal(r.reason, 'confounder-pack-flip');
});

test('gate: an immaterial own move has nothing to attribute', () => {
  const r = S.decompose({ ...CAESAR, ownDeltaPct: 0.01 });
  assert.equal(r.gated, true);
  assert.equal(r.reason, 'immaterial-move');
});

test('gate: non-numeric input fails closed', () => {
  assert.equal(S.decompose({ ownDeltaPct: 'x', marketDeltaPct: 0.06 }).reason, 'bad-input');
  assert.equal(S.decompose({}).reason, 'bad-input');
  assert.equal(S.decompose().reason, 'bad-input');
});

test('CARDINAL RULE: the result carries only rates + a label, never a $ level', () => {
  const r = S.decompose(CAESAR);
  const keys = Object.keys(r).sort();
  assert.deepEqual(keys, [
    'attribution', 'confidence', 'gated', 'marketPoints',
    'reason', 'spreadPct', 'vendorPoints', 'vendorShare',
  ]);
  // no field name hints at a currency level...
  for (const k of keys) assert.ok(!/cent|dollar|usd|level|price/i.test(k), k);
  // ...and every numeric output is a rate (a fraction), never a cents value.
  for (const k of ['spreadPct', 'marketPoints', 'vendorPoints', 'vendorShare']) {
    assert.ok(Math.abs(r[k]) <= 2, k + ' looks like a level, not a rate');
  }
});
