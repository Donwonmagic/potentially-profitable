import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { assess } = require('./fair-price-gap.js');

// Minimal seed in the shape data/cost-index.js writes. ribeye = firm $/lb
// wholesale; acorn-squash = firm but per carton; veg-oil = index-basis (no level).
const SEED = {
  ingredients: [
    // ribeye carries a rising trend; acorn-squash carries none; veg-oil is
    // index-basis with a falling trend (direction honest without a $-level).
    { key: 'ribeye', label_en: 'Ribeye', label_es: 'Ribeye', unit_en: 'lb', unit_es: 'libra',
      assessment: { asOf: '2026-06-17', confidence: 'medium', trend: { pct: 0.09, dir: 'up' }, level: { basis: 'wholesale', medianCents: 1277 } } },
    { key: 'acorn-squash', label_en: 'Acorn squash', label_es: 'Calabaza', unit_en: 'carton', unit_es: 'caja',
      assessment: { asOf: '2026-06-16', confidence: 'medium', level: { basis: 'wholesale', medianCents: 3200 } } },
    { key: 'veg-oil', label_en: 'Vegetable oil', label_es: 'Aceite', unit_en: 'lb', unit_es: 'libra',
      assessment: { asOf: '2026-06-16', confidence: 'medium', trend: { pct: -0.05, dir: 'down' }, level: { basis: 'index', medianCents: 35000 } } }
  ]
};
const go = (o) => assess(Object.assign({ seed: SEED }, o));

test('reports the gap above the wholesale reference (not an overpayment claim)', () => {
  const r = go({ item: 'Ribeye', paidCents: 1500, unit: 'lb' });
  assert.equal(r.comparable, true);
  assert.equal(r.marketCents, 1277);
  assert.equal(r.gapPct, 17.5);                 // (1500-1277)/1277
  assert.equal(r.verdict, 'above-reference');   // above wholesale is expected for delivered
  assert.equal(r.worthAsking, false);
  assert.equal(r.wholesaleReference, true);
});

test('flags only an extreme gap as worth asking (directional)', () => {
  const r = go({ item: 'Ribeye', paidCents: 2500, unit: 'lb' });
  assert.equal(r.verdict, 'far-above-reference');
  assert.equal(r.worthAsking, true);            // ~+96%, well beyond a normal delivered markup
});

test('a generous custom threshold suppresses the flag', () => {
  const r = go({ item: 'Ribeye', paidCents: 2500, unit: 'lb', worthAskingPct: 200 });
  assert.equal(r.worthAsking, false);
  assert.equal(r.verdict, 'above-reference');
});

test('a price near the reference reads at-reference', () => {
  assert.equal(go({ item: 'Ribeye', paidCents: 1300, unit: 'lb' }).verdict, 'at-reference');
});

test('an unusually low price reads below-reference (verify the spec)', () => {
  assert.equal(go({ item: 'Ribeye', paidCents: 1000, unit: 'lb' }).verdict, 'below-reference');
});

test('reconciles a different but compatible unit (oz vs lb)', () => {
  const r = go({ item: 'Ribeye', paidCents: 90, unit: 'oz' }); // $0.90/oz = $14.40/lb
  assert.equal(r.paidPerMarketUnit, 1440);
  assert.equal(r.marketUnit, 'lb');
  assert.equal(r.gapPct, 12.8);
});

test('compares same non-bridgeable unit directly (carton vs carton)', () => {
  const r = go({ item: 'Acorn squash', paidCents: 3000, unit: 'carton' });
  assert.equal(r.comparable, true);
  assert.equal(r.verdict, 'at-reference'); // -6.25%
});

test('cross-family unit (case vs lb) is unknown, never a fake gap', () => {
  const r = go({ item: 'Ribeye', paidCents: 5000, unit: 'case' });
  assert.equal(r.matched, true);
  assert.equal(r.comparable, false);
  assert.equal(r.verdict, 'unknown');
  assert.equal(r.reason, 'unit-mismatch');
});

test('an index-basis item exposes no dollar level (directional only)', () => {
  const r = go({ item: 'Vegetable oil', paidCents: 200, unit: 'lb' });
  assert.equal(r.matched, true);
  assert.equal(r.comparable, false);
  assert.equal(r.reason, 'index-basis-no-level');
});

test('no match and insufficient input degrade to unknown, never throw', () => {
  assert.equal(go({ item: 'Black truffle', paidCents: 9000, unit: 'lb' }).reason, 'no-match');
  assert.equal(assess({ seed: SEED }).verdict, 'unknown');
  assert.equal(assess({}).verdict, 'unknown');
});

test('the reference market direction rides with a comparable result', () => {
  const r = go({ item: 'Ribeye', paidCents: 1500, unit: 'lb' });
  assert.equal(r.comparable, true);
  assert.deepEqual(r.marketTrend, { pct: 0.09, dir: 'up' }); // above a RISING reference
});

test('direction survives even when no dollar level does (index-basis)', () => {
  const r = go({ item: 'Vegetable oil', paidCents: 200, unit: 'lb' });
  assert.equal(r.comparable, false);
  assert.equal(r.reason, 'index-basis-no-level');
  assert.deepEqual(r.marketTrend, { pct: -0.05, dir: 'down' }); // still honest
});

test('a matched item with no trend carries marketTrend: null, never undefined', () => {
  const r = go({ item: 'Acorn squash', paidCents: 3000, unit: 'carton' });
  assert.equal(r.comparable, true);
  assert.equal(r.marketTrend, null);
});
