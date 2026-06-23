/**
 * Parity vectors — stress-test.js (insight E14). The Ledger stress-test.ts port
 * mirrors these verbatim.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { build } = require('./stress-test.js');

// Target 30%. Short-rib: 28.1% → 31.9% (crosses). Ribeye: 25% → 27.5% (safe).
// Burger: 33.3% (already over).
const DISHES = [
  { dish: 'Short-rib special', plateCostCents: 450, menuPriceCents: 1600, exposedCents: 300 },
  { dish: 'Ribeye', plateCostCents: 400, menuPriceCents: 1600, exposedCents: 200 },
  { dish: 'Burger', plateCostCents: 500, menuPriceCents: 1500, exposedCents: 150 },
];

test('CROSS (EN): names the dishes that slip past the owner line, as a what-if', () => {
  const c = build({ ingredient: 'Beef', hikePct: 20, targetPct: 0.30, dishes: DISHES, locale: 'en' });
  assert.equal(c.show, true);
  assert.equal(c.reason, 'dishes-cross');
  assert.deepEqual(c.crossed, ['Short-rib special']);
  assert.match(c.headline, /^What-if:/);
  assert.match(c.headline, /if Beef jumps 20%/);
  assert.match(c.headline, /1 dish would cross your 30% line/);
  assert.match(c.headline, /Short-rib special moves from 28.1% to 31.9%/);
  assert.deepEqual(c.options[0], { kind: 'open_dish', dish: 'Short-rib special', label: 'Look at Short-rib special' });
  // sorted by stressed food-cost desc → Burger (already-over) first
  assert.equal(c.dishes[0].dish, 'Burger');
  assert.equal(c.dishes[0].status, 'already-over');
  assert.equal(c.dishes.find((d) => d.dish === 'Short-rib special').status, 'crossed');
  assert.equal(c.dishes.find((d) => d.dish === 'Ribeye').status, 'safe');
});

test('CROSS (ES): full Spanish', () => {
  const c = build({ ingredient: 'Res', hikePct: 20, targetPct: 0.30, dishes: DISHES, locale: 'es' });
  assert.match(c.headline, /^Supongamos:/);
  assert.match(c.headline, /si Res sube 20%/);
  assert.match(c.headline, /cruzarían tu línea de 30%/);
});

test('ALL HOLD → calm green, no action', () => {
  const c = build({
    ingredient: 'Beef', hikePct: 20, targetPct: 0.30,
    dishes: [{ dish: 'Stew', plateCostCents: 400, menuPriceCents: 1600, exposedCents: 100 }],
    locale: 'en',
  });
  assert.equal(c.reason, 'all-hold');
  assert.deepEqual(c.crossed, []);
  assert.match(c.headline, /even if Beef jumps 20%/);
  assert.match(c.headline, /stay under your 30% line/);
  assert.match(c.headline, /still safe/);
  assert.deepEqual(c.options, []);
});

test('HONESTY: a dish that does not use the ingredient is excluded, not faked', () => {
  const c = build({
    ingredient: 'Beef', hikePct: 20, targetPct: 0.30,
    dishes: [
      { dish: 'Short-rib special', plateCostCents: 450, menuPriceCents: 1600, exposedCents: 300 },
      { dish: 'Veggie bowl', plateCostCents: 300, menuPriceCents: 1200, exposedCents: 0 }, // no beef
    ],
    locale: 'en',
  });
  assert.equal(c.dishes.length, 1);
  assert.equal(c.dishes[0].dish, 'Short-rib special');
});

test('HONESTY: a dish with no menu price is excluded (can not compute food-cost %)', () => {
  const c = build({
    ingredient: 'Beef', hikePct: 20, targetPct: 0.30,
    dishes: [{ dish: 'Off-menu', plateCostCents: 450, menuPriceCents: 0, exposedCents: 300 }],
    locale: 'en',
  });
  assert.equal(c.show, false);
  assert.equal(c.reason, 'no-exposed-dishes');
});

test('HONESTY: a non-positive hike is not a stress test', () => {
  const c = build({ ingredient: 'Beef', hikePct: 0, targetPct: 0.30, dishes: DISHES, locale: 'en' });
  assert.equal(c.show, false);
  assert.equal(c.reason, 'no-hike');
});
