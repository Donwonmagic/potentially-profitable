import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { match } = require('./cost-index-lookup.js');

const seed = {
  status: 'live',
  ingredients: [
    // Ribeye carries the full rich shape: a structural flag, a numeric trend,
    // and a yield-adjusted edible-portion cost on a firm wholesale level.
    { key: 'ribeye', label_en: 'Ribeye', label_es: 'Ribeye (bife ancho)', unit_en: 'lb', unit_es: 'libra',
      yield: 0.75, epCents: 1545,
      flag: { verdict: 'structural', actionBias: 're-price', elevatedWeeks: 4 },
      assessment: { asOf: '2026-06-05', confidence: 'medium', trend: { pct: 0.129, dir: 'up' }, level: { medianCents: 1159, rangeCents: [1129, 1189], basis: 'wholesale' } } },
    { key: 'chicken-breast', label_en: 'Chicken breast (boneless)', label_es: 'Pechuga de pollo (sin hueso)', unit_en: 'lb', unit_es: 'libra',
      assessment: { asOf: '2026-06-03', confidence: 'medium', level: { medianCents: 142, rangeCents: [128, 158], basis: 'wholesale' } } },
    { key: 'romaine-lettuce', label_en: 'Romaine lettuce', label_es: 'Lechuga romana', unit_en: 'carton', unit_es: 'caja',
      assessment: { asOf: '2026-06-01', confidence: 'low', level: { medianCents: 4275, rangeCents: [4275, 4275], basis: 'wholesale' } } },
    { key: 'butter', label_en: 'Butter (AA, bulk)', label_es: 'Mantequilla', unit_en: 'lb', unit_es: 'libra',
      assessment: { asOf: '2026-06-02', confidence: 'medium', level: { medianCents: 310, rangeCents: [295, 330], basis: 'wholesale' } } },
    // Tomatoes: a spike flag on a firm level (verdict must read "hold").
    { key: 'tomato', label_en: 'Tomatoes (round)', label_es: 'Tomate', unit_en: 'lb', unit_es: 'libra',
      yield: 0.9, epCents: 178,
      flag: { verdict: 'spike', actionBias: 'hold' },
      assessment: { asOf: '2026-06-04', confidence: 'medium', trend: { pct: -0.04, dir: 'down' }, level: { medianCents: 160, rangeCents: [150, 175], basis: 'wholesale' } } },
    // Coffee: an INDEX-basis item — a real trend direction but no publishable
    // dollar level. Proves `trend` survives while `wholesaleCents`/`epCents` do not.
    { key: 'coffee', label_en: 'Coffee (arabica)', label_es: 'Café', unit_en: 'lb', unit_es: 'libra',
      yield: 1, epCents: 999,
      assessment: { asOf: '2026-06-06', confidence: 'directional', trend: { pct: 0.08, dir: 'up' }, level: { medianCents: 640, basis: 'index' } } }
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

test('VERDICT: a structural flag reads "reprice" (up-and-holding), spike reads "hold"', () => {
  const rib = match('Ribeye', seed);
  assert.ok(rib.verdict, 'a flagged item must carry a verdict');
  assert.equal(rib.verdict.tone, 'reprice', 'structural on firm data → reprice tone');

  const tom = match('Tomatoes', seed);
  assert.ok(tom.verdict, 'a flagged item must carry a verdict');
  assert.equal(tom.verdict.tone, 'hold', 'spike → hold tone');

  const noFlag = match('Chicken Breast', seed);
  assert.equal(noFlag.verdict, null, 'an unflagged item carries no verdict');
});

test('TREND rides with {pct, dir}; EP cost rides the same dollar gate as wholesale', () => {
  const rib = match('Ribeye', seed);
  assert.deepEqual(rib.trend, { pct: 0.129, dir: 'up' });
  assert.equal(rib.epCents, 1545, 'firm wholesale level → edible-portion cost publishes');
});

test('HONESTY: index-basis item keeps its trend but drops the dollar EP cost', () => {
  const cof = match('Coffee', seed);
  assert.equal(cof.wholesaleCents, null, 'index basis publishes no dollar level');
  assert.equal(cof.epCents, null, 'no firm dollar level → no edible-portion cost, even though epCents exists on the item');
  assert.deepEqual(cof.trend, { pct: 0.08, dir: 'up' }, 'direction is still honest without a dollar level');
});

test('HONESTY: a low-confidence item still suppresses the EP dollar cost', () => {
  const rom = match('Romaine', seed);
  assert.equal(rom.epCents, null, 'low confidence must not publish a dollar EP reference');
  assert.equal(rom.verdict, null);
});
