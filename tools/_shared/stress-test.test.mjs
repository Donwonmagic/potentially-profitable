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

test("HONESTY: an already-over dish (no NEW crossing) is never called 'still safe'/'under your line'", () => {
  // Base 40% (already over the 30% line); stressed 48%. No dish newly crosses.
  const c = build({
    ingredient: 'Beef', hikePct: 20, targetPct: 0.30,
    dishes: [{ dish: 'Braised beef', plateCostCents: 600, menuPriceCents: 1500, exposedCents: 600 }],
    locale: 'en',
  });
  assert.equal(c.show, true);
  assert.equal(c.reason, 'already-over');
  assert.deepEqual(c.crossed, []);
  assert.equal(c.dishes[0].status, 'already-over');
  assert.doesNotMatch(c.headline, /still safe/);
  assert.doesNotMatch(c.headline, /stay under your/);
  assert.match(c.headline, /no new dish crosses your 30% line/);
  assert.match(c.headline, /1 dish is already over it: Braised beef/);
  assert.match(c.headline, /Braised beef runs 40.0% now, 48.0% after/);
  assert.deepEqual(c.options[0], { kind: 'open_dish', dish: 'Braised beef', label: 'Look at Braised beef' });
});

test('HONESTY: already-over + safe (none newly crossing) reports already-over, not all-hold', () => {
  const c = build({
    ingredient: 'beef', hikePct: 10, targetPct: 0.30,
    dishes: [
      { dish: 'Burger', plateCostCents: 500, menuPriceCents: 1500, exposedCents: 150 }, // 33.3% already over
      { dish: 'Beef stew', plateCostCents: 400, menuPriceCents: 1600, exposedCents: 100 }, // 25% -> 25.6% safe
    ],
    locale: 'en',
  });
  assert.equal(c.reason, 'already-over');
  assert.deepEqual(c.crossed, []);
  assert.match(c.headline, /no new dish crosses/);
  assert.match(c.headline, /1 dish is already over it: Burger/);
  assert.doesNotMatch(c.headline, /still safe/);
});

test("HONESTY (ES): already-over never says 'aún seguro'/'se quedan bajo'", () => {
  const c = build({
    ingredient: 'Res', hikePct: 20, targetPct: 0.30,
    dishes: [{ dish: 'Birria', plateCostCents: 600, menuPriceCents: 1500, exposedCents: 600 }],
    locale: 'es',
  });
  assert.equal(c.reason, 'already-over');
  assert.match(c.headline, /^Supongamos:/);
  assert.match(c.headline, /ningún platillo nuevo cruza tu línea de 30%/);
  assert.match(c.headline, /1 platillo ya está por encima: Birria/);
  assert.doesNotMatch(c.headline, /aún seguro/);
  assert.doesNotMatch(c.headline, /se quedan bajo/);
});

test("RENDER: a hairline crossing shows visible movement, not '30.0% to 30.0%'", () => {
  // base 29.98%, stressed 30.01% — a real crossing the 1-decimal render used to
  // collapse to "moves from 30.0% to 30.0%".
  const c = build({
    ingredient: 'Beef', hikePct: 20, targetPct: 0.30,
    dishes: [{ dish: 'Line-straddler', plateCostCents: 1499, menuPriceCents: 5000, exposedCents: 8 }],
    locale: 'en',
  });
  assert.equal(c.reason, 'dishes-cross');
  assert.deepEqual(c.crossed, ['Line-straddler']);
  assert.doesNotMatch(c.headline, /moves from 30.0% to 30.0%/);
  assert.match(c.headline, /moves from 29.98% to 30.01%/);
});
