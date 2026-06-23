/**
 * Unit tests — tools/_shared/margin-map.js
 * Run via:  node --test tools/_shared/margin-map.test.mjs
 *
 * PARITY GUARANTEE. Insight E6 (menu margin map), pinned EN + ES. Muntin Ledger
 * mirrors these vectors verbatim on the TypeScript port.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const M = require('./margin-map.js');

const MENU = [
  { dish: 'Chicken parm', foodCostPct: 0.34 },
  { dish: 'Cobb', foodCostPct: 0.32 },
  { dish: 'Wings', foodCostPct: 0.31 },
  { dish: 'Caesar', foodCostPct: 0.28 },
];

test('crossed (EN): lists the dishes over the owner target, ranked, calm', () => {
  const c = M.build({ dishes: MENU, targetPct: 0.30, locale: 'en' });
  assert.equal(c.tier, 'crossed');
  assert.equal(c.over.length, 3);
  assert.equal(c.over[0].dish, 'Chicken parm');
  assert.match(c.headline, /3 dishes slipped past your 30% food-cost goal/);
  assert.match(c.headline, /Chicken parm \(now 34%\)/);
  assert.match(c.headline, /Chicken parm is the one to look at first/);
  assert.equal(c.options[0].dish, 'Chicken parm');
});

test('crossed (ES): full Spanish', () => {
  const c = M.build({ dishes: MENU, targetPct: 0.30, locale: 'es' });
  assert.match(c.headline, /pasaron tu meta de 30%/);
  assert.match(c.headline, /Chicken parm \(ahora 34%\)/);
  assert.equal(c.options[0].label, 'Mira Chicken parm');
});

test('anchored on the OWNER target, not a textbook one', () => {
  const c = M.build({ dishes: MENU, targetPct: 0.33, locale: 'en' }); // owner runs a 33% goal
  assert.equal(c.over.length, 1);             // only Chicken parm (34%) is over 33%
  assert.match(c.headline, /your 33% food-cost goal/);
});

test('all on target → calm green, show:false, no CTA', () => {
  const c = M.build({ dishes: [{ dish: 'Caesar', foodCostPct: 0.28 }], targetPct: 0.30, locale: 'en' });
  assert.equal(c.tier, 'none');
  assert.equal(c.show, false);
  assert.equal(c.reason, 'all-on-target');
});

test('HONESTY: a dish with no food-cost % is excluded, not assumed on target', () => {
  const c = M.build({ dishes: [...MENU, { dish: 'Special' /* no foodCostPct */ }], targetPct: 0.30, locale: 'en' });
  assert.equal(c.over.find((d) => d.dish === 'Special'), undefined);
  assert.equal(c.over.length, 3);
});
