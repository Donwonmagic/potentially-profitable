/**
 * Unit tests — tools/_shared/silent-bleed.js
 * Run via:  node --test tools/_shared/silent-bleed.test.mjs
 *
 * PARITY GUARANTEE. Insight E4 (the $/week leaderboard), pinned EN + ES.
 * Muntin Ledger mirrors these vectors verbatim on the TypeScript port.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const B = require('./silent-bleed.js');

const WEEK = [
  { dish: 'Caesar', dollarsPerWeek: 47 },
  { dish: 'Wings', dollarsPerWeek: 22 },
  { dish: 'Cobb', dollarsPerWeek: 14 },
  { dish: 'Side salad', dollarsPerWeek: 3 },
];

test('leaderboard (EN): ranks by $/week and points at the top dish', () => {
  const c = B.build({ impacts: WEEK, locale: 'en' });
  assert.equal(c.tier, 'leaderboard');
  assert.equal(c.show, true);
  assert.equal(c.totalPerWeek, 86);
  assert.equal(c.ranked[0].dish, 'Caesar');
  assert.match(c.headline, /Caesar -\$47/);
  assert.match(c.headline, /Wings -\$22/);
  assert.match(c.headline, /4 dishes/);
  assert.match(c.headline, /more than half of it/); // 47/86 = 0.55, an honest band
  assert.deepEqual(c.options[0], { kind: 'open_dish', dish: 'Caesar', label: 'Start with Caesar' });
});

test('leaderboard (ES): full Spanish', () => {
  const c = B.build({ impacts: WEEK, locale: 'es' });
  assert.match(c.headline, /Caesar -\$47/);
  assert.match(c.headline, /4 platillos/);
  assert.match(c.headline, /más de la mitad/);
  assert.equal(c.options[0].label, 'Empieza con Caesar');
});

test('nothing bled → calm green, no leaderboard, no CTA', () => {
  const c = B.build({ impacts: [], locale: 'en' });
  assert.equal(c.tier, 'none');
  assert.equal(c.show, false);
  assert.equal(c.reason, 'nothing-bled');
});

test('HONESTY: a dish with no usable $/week is excluded, never zeroed', () => {
  const c = B.build({ impacts: [...WEEK, { dish: 'Soup' /* no dollarsPerWeek */ }], locale: 'en' });
  assert.equal(c.ranked.length, 4);
  assert.equal(c.ranked.find((r) => r.dish === 'Soup'), undefined);
});

test('share band scales: a dominant top dish reads "three-quarters"', () => {
  const c = B.build({ impacts: [{ dish: 'A', dollarsPerWeek: 80 }, { dish: 'B', dollarsPerWeek: 10 }, { dish: 'C', dollarsPerWeek: 10 }], locale: 'en' });
  assert.match(c.headline, /about three-quarters of it/);
});

test('HONESTY: a top dish below one half reads "about N%", never "more than half"', () => {
  // 47/100 = 0.47 — a plurality, not a majority. "More than half" would be a
  // false direction; the honest band states the real fraction.
  const c = B.build({ impacts: [{ dish: 'A', dollarsPerWeek: 47 }, { dish: 'B', dollarsPerWeek: 28 }, { dish: 'C', dollarsPerWeek: 25 }], locale: 'en' });
  assert.match(c.headline, /about 47% of it/);
  assert.doesNotMatch(c.headline, /more than half/);
});

test('a single bleeding dish: a leaderboard of one, no "start at the top"', () => {
  const c = B.build({ impacts: [{ dish: 'Solo', dollarsPerWeek: 30 }], locale: 'en' });
  assert.equal(c.tier, 'leaderboard');
  assert.match(c.headline, /1 dish\b/);
  assert.doesNotMatch(c.headline, /Start at the top/);
});
