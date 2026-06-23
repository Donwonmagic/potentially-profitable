/**
 * Parity vectors — yield-truth.js (insight E9). The Ledger yield-truth.ts port
 * mirrors these verbatim.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { build } = require('./yield-truth.js');

// whole chicken measured at 66% vs the book's 60%. ratio 0.6/0.66 = 0.90909.
// Roast: 154¢ → saves 14¢ (the catalog's $0.14); Soup: 77¢ → saves 7¢.
const CHICKEN = [
  { dish: 'Roast chicken', ingredientCostCents: 154, coversPerWeek: 100 },
  { dish: 'Chicken soup', ingredientCostCents: 77, coversPerWeek: 50 },
];

test('BEATS + covers (EN): weekly saving, "match your kitchen, not a manual"', () => {
  const c = build({ ingredient: 'whole chicken', bookYield: 0.60, learnedYield: 0.66, dishes: CHICKEN, locale: 'en' });
  assert.equal(c.show, true);
  assert.equal(c.direction, 'beats');
  assert.equal(c.reason, 'beats-book');
  assert.equal(c.count, 2);
  assert.equal(c.weeklyTotalCents, 1750); // 14*100 + 7*50
  assert.match(c.headline, /yields 66%/);
  assert.match(c.headline, /not the book.s 60%/);
  assert.match(c.headline, /\$17\.50\/week/);
  assert.match(c.headline, /match your kitchen, not a manual/);
  assert.deepEqual(c.options[0], { kind: 'apply_yield', ingredient: 'whole chicken', label: 'Apply to all' });
});

test('BEATS + covers (ES): full Spanish', () => {
  const c = build({ ingredient: 'pollo entero', bookYield: 0.60, learnedYield: 0.66, dishes: CHICKEN, locale: 'es' });
  assert.match(c.headline, /rinde 66%/);
  assert.match(c.headline, /\$17\.50 por semana/);
  assert.equal(c.options[0].label, 'Aplicar a todos');
});

test('BEATS, no covers → per-plate drop on the top dish', () => {
  const c = build({ ingredient: 'whole chicken', bookYield: 0.60, learnedYield: 0.66, dishes: [{ dish: 'Roast chicken', ingredientCostCents: 154 }], locale: 'en' });
  assert.equal(c.weeklyTotalCents, null);
  assert.match(c.headline, /Roast chicken drops \$0\.14\/plate/);
});

test('UNDER: a measured yield below the book is stated plainly (not hidden)', () => {
  const c = build({ ingredient: 'whole chicken', bookYield: 0.66, learnedYield: 0.60, dishes: [{ dish: 'Roast chicken', ingredientCostCents: 200, coversPerWeek: 100 }], locale: 'en' });
  assert.equal(c.direction, 'under');
  assert.equal(c.reason, 'under-book');
  assert.match(c.headline, /^Heads up/);
  assert.match(c.headline, /below the book.s 66%/);
  assert.match(c.headline, /\$20\.00\/week higher/);
});

test('MATCHES: a move under 3 points → calm, no card', () => {
  const c = build({ ingredient: 'whole chicken', bookYield: 0.60, learnedYield: 0.61, dishes: CHICKEN, locale: 'en' });
  assert.equal(c.show, false);
  assert.equal(c.reason, 'matches-book');
});

test('HONESTY: a yield outside [0.05, 1.05] is a typo → no card', () => {
  assert.equal(build({ ingredient: 'x', bookYield: 0.60, learnedYield: 1.5, dishes: CHICKEN }).reason, 'invalid-yield');
  assert.equal(build({ ingredient: 'x', bookYield: 0.60, learnedYield: 0.02, dishes: CHICKEN }).reason, 'invalid-yield');
});

test('HONESTY: dishes with no usable ingredient cost are excluded', () => {
  const c = build({ ingredient: 'whole chicken', bookYield: 0.60, learnedYield: 0.66, dishes: [...CHICKEN, { dish: 'Broth', ingredientCostCents: 0 }], locale: 'en' });
  assert.equal(c.count, 2);
  assert.equal(c.dishes.find((d) => d.dish === 'Broth'), undefined);
});
