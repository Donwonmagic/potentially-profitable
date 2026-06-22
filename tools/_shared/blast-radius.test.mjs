/**
 * Unit tests — tools/_shared/blast-radius.js
 * Run via:  node --test tools/_shared/blast-radius.test.mjs
 *
 * PARITY GUARANTEE. Insight E5 (cross-dish blast radius), pinned EN + ES.
 * Muntin Ledger mirrors these vectors verbatim on the TypeScript port.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const R = require('./blast-radius.js');

const SEVEN = [
  { name: 'Pizza', dollarsPerWeek: 18 }, { name: 'Caprese', dollarsPerWeek: 9 },
  { name: 'Lasagna', dollarsPerWeek: 8 }, { name: 'Calzone', dollarsPerWeek: 8 },
  { name: 'Ziti', dollarsPerWeek: 7 }, { name: 'Sub', dollarsPerWeek: 6 },
  { name: 'Flatbread', dollarsPerWeek: 5 }, // sums to 61
];

test('blast (EN): names the fan-out, the total, and the one-move framing', () => {
  const c = R.build({ ingredient: 'mozzarella', dishes: SEVEN, locale: 'en' });
  assert.equal(c.tier, 'blast');
  assert.equal(c.show, true);
  assert.equal(c.dishCount, 7);
  assert.equal(c.totalPerWeek, 61);
  assert.match(c.headline, /Mozzarella is in 7 of your dishes/);
  assert.match(c.headline, /\$61\/week in total/);
  assert.match(c.headline, /fixes 7 problems at once/);
  assert.equal(c.options[0].label, 'See the 7');
});

test('blast (ES): full Spanish, ingredient capitalized', () => {
  const c = R.build({ ingredient: 'mozzarella', dishes: SEVEN, locale: 'es' });
  assert.match(c.headline, /Mozzarella está en 7 de tus platillos/);
  assert.match(c.headline, /\$61 por semana en total/);
  assert.match(c.headline, /arregla 7 problemas/);
  assert.equal(c.options[0].label, 'Ver los 7');
});

test('a single dish is the ordinary path, not a blast radius', () => {
  const c = R.build({ ingredient: 'mozzarella', dishes: [{ name: 'Pizza', dollarsPerWeek: 18 }], locale: 'en' });
  assert.equal(c.tier, 'none');
  assert.equal(c.reason, 'single-dish');
});

test('HONESTY: no total unless EVERY dish has a $/week — never a partial total', () => {
  const c = R.build({ ingredient: 'mozzarella', dishes: [
    { name: 'Pizza', dollarsPerWeek: 18 }, { name: 'Caprese', dollarsPerWeek: 9 }, { name: 'Lasagna' /* no $ */ },
  ], locale: 'en' });
  assert.equal(c.tier, 'blast');
  assert.equal(c.totalPerWeek, null);
  assert.doesNotMatch(c.headline, /\$/);
  assert.match(c.headline, /across 3 dishes/);
});
