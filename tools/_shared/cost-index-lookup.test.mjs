import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { match } = require('./cost-index-lookup.js');

const seed = {
  status: 'live',
  ingredients: [
    { key: 'ribeye', label_en: 'Ribeye', label_es: 'Ribeye (bife ancho)', unit_en: 'lb', unit_es: 'libra',
      assessment: { asOf: '2026-06-05', confidence: 'medium', level: { medianCents: 1159, rangeCents: [1129, 1189], basis: 'wholesale' } } },
    { key: 'chicken-breast', label_en: 'Chicken breast (boneless)', label_es: 'Pechuga de pollo (sin hueso)', unit_en: 'lb', unit_es: 'libra',
      assessment: { asOf: '2026-06-03', confidence: 'medium', level: { medianCents: 142, rangeCents: [128, 158], basis: 'wholesale' } } },
    { key: 'romaine-lettuce', label_en: 'Romaine lettuce', label_es: 'Lechuga romana', unit_en: 'carton', unit_es: 'caja',
      assessment: { asOf: '2026-06-01', confidence: 'low', level: { medianCents: 4275, rangeCents: [4275, 4275], basis: 'wholesale' } } },
    { key: 'butter', label_en: 'Butter (AA, bulk)', label_es: 'Mantequilla', unit_en: 'lb', unit_es: 'libra',
      assessment: { asOf: '2026-06-02', confidence: 'medium', level: { medianCents: 310, rangeCents: [295, 330], basis: 'wholesale' } } }
  ]
};

test('exact label → auto match with the wholesale reference', () => {
  const r = match('Ribeye', seed);
  assert.equal(r.key, 'ribeye');
  assert.equal(r.tier, 'auto');
  assert.equal(r.wholesaleCents, 1159);
  assert.deepEqual(r.rangeCents, [1129, 1189]);
  assert.equal(r.basis, 'wholesale');
  assert.equal(r.unit_en, 'lb');
});

test('label with a parenthetical still matches ("Chicken breast (boneless)")', () => {
  const r = match('Chicken Breast', seed);
  assert.equal(r.key, 'chicken-breast');
  assert.equal(r.wholesaleCents, 142);
});

test('extra words → propose via token-subset ("ribeye steak")', () => {
  const r = match('ribeye steak', seed);
  assert.equal(r.key, 'ribeye');
  assert.equal(r.tier, 'propose');
});

test('HONESTY: a matched but low-confidence ingredient returns identity, no dollar', () => {
  const r = match('Romaine', seed);
  assert.equal(r.key, 'romaine-lettuce');
  assert.equal(r.wholesaleCents, null, 'low confidence must not publish a dollar reference');
  assert.equal(r.confidence, 'low');
});

test('no match → null; bad input → null', () => {
  assert.equal(match('unobtanium widget', seed), null);
  assert.equal(match('', seed), null);
  assert.equal(match('x', seed), null);
  assert.equal(match('Ribeye', null), null);
});

test('accepts a bare array seed as well as {ingredients:[...]}', () => {
  assert.equal(match('Butter', seed.ingredients).key, 'butter');
});
