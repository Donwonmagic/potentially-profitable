/**
 * portion-bridge.test.ts — unit compatibility + the fail-closed contract.
 *   pnpm -C apps/api test portion-bridge
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { quoteAtPortion, unitsCompatible, convertQuantity, familyOf } from '../src/lib/portion-bridge.js';

test('unitsCompatible only within a family', () => {
  assert.equal(unitsCompatible('lb', 'oz'), true);     // weight ↔ weight
  assert.equal(unitsCompatible('cup', 'fl_oz'), true); // volume ↔ volume
  assert.equal(unitsCompatible('lb', 'fl_oz'), false); // weight ✗ volume
  assert.equal(unitsCompatible('lb', 'ct'), false);    // weight ✗ count
  assert.equal(unitsCompatible('lb', 'zorp'), false);  // unknown unit
});

test('convertQuantity is exact within a family, null across', () => {
  assert.equal(convertQuantity(1, 'lb', 'oz'), 16);
  assert.equal(convertQuantity(16, 'oz', 'lb'), 1);
  assert.equal(convertQuantity(1, 'lb', 'cup'), null);
});

test('familyOf normalizes aliases', () => {
  assert.equal(familyOf('pounds'), 'weight');
  assert.equal(familyOf('Ounces'), 'weight');
  assert.equal(familyOf('each'), 'count');
});

test('quoteAtPortion declines cross-family rather than guessing a density', () => {
  const q = quoteAtPortion({ comparable: { perBaseUnit: 400, baseUnit: 'lb' }, portion: { qty: 4, unit: 'fl_oz' } });
  assert.equal(q.compatible, false);
  assert.equal(q.reason, 'cross-family');
});

test('quoteAtPortion rejects a non-positive price', () => {
  const q = quoteAtPortion({ comparable: { perBaseUnit: 0, baseUnit: 'oz' }, portion: { qty: 2, unit: 'oz' } });
  assert.equal(q.compatible, false);
});
