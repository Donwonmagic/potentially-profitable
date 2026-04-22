#!/usr/bin/env node
// Sprint CC1: subtype-aware owner-default regression test.
// Run via: `node scripts/test-subtype-owner-defaults.mjs`
//
// Locks in the contract that drives the better-than-generic
// starting values for the revenue-at-risk chip. Every shipped
// subtype (10 total) must resolve to a plausible {coversPerDay,
// avgCheck, openDays} triple. Unknown / missing subtype ids must
// return null so the caller falls back to the generic
// DEFAULT_OWNER_INPUTS instead of crashing.
//
// Also verifies that legacy subtype ids (the ?bt=casual / ?bt=pub
// share-link aliases) route through canonicalSubtypeId to the
// canonical entry — same contract as subtypeBenchmark so callers
// can trust one lookup across the entire subtype system.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const S = require('../tools/audits/restaurant/subtypes.js');
const {
  RESTAURANT_SUBTYPE_IDS,
  RESTAURANT_SUBTYPE_OWNER_DEFAULTS,
  subtypeOwnerDefaults,
  canonicalSubtypeId
} = S;

let failures = 0;
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label + (cond ? '' : '  ' + (detail || '')));
  if (!cond) failures++;
}
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}

// --- Test 1: every canonical subtype id has a defaults entry -------
{
  const missing = RESTAURANT_SUBTYPE_IDS.filter(
    (id) => !RESTAURANT_SUBTYPE_OWNER_DEFAULTS[id]);
  assertEq(
    'every canonical subtype has owner defaults',
    missing, []);
}

// --- Test 2: every entry has a complete {coversPerDay, avgCheck, openDays} triple
{
  const required = ['coversPerDay', 'avgCheck', 'openDays'];
  const incomplete = Object.keys(RESTAURANT_SUBTYPE_OWNER_DEFAULTS).filter((id) => {
    const d = RESTAURANT_SUBTYPE_OWNER_DEFAULTS[id];
    return required.some((k) => typeof d[k] !== 'number' || d[k] <= 0);
  });
  assertEq(
    'every defaults entry has all three positive-number fields',
    incomplete, []);
}

// --- Test 3: specific expected values per subtype ------------------
// Lock in the rough medians so an accidental "fix" later doesn't
// silently shift every restaurant's chip by a quiet multiplier.
{
  const fine = subtypeOwnerDefaults('fine-dining');
  assertEq('fine-dining defaults',
    fine, { coversPerDay: 80, avgCheck: 85, openDays: 310 });

  const cafe = subtypeOwnerDefaults('cafe');
  assertEq('cafe defaults',
    cafe, { coversPerDay: 300, avgCheck: 8, openDays: 360 });

  const foodTruck = subtypeOwnerDefaults('food-truck');
  assertEq('food-truck defaults (seasonal openDays)',
    foodTruck, { coversPerDay: 80, avgCheck: 12, openDays: 240 });
}

// --- Test 4: legacy ids route through canonicalSubtypeId -----------
// The existing aliases map 'casual' -> 'casual-dining', 'pub' ->
// 'bar-pub', etc. subtypeOwnerDefaults must honor those so share
// links saved with an older id continue resolving correctly.
{
  const casual     = subtypeOwnerDefaults('casual');          // -> casual-dining
  const restaurant = subtypeOwnerDefaults('restaurant');      // -> casual-dining
  const coffee     = subtypeOwnerDefaults('coffee-shop');     // -> cafe
  const pub        = subtypeOwnerDefaults('pub');             // -> bar-pub
  const brewery    = subtypeOwnerDefaults('brewery');         // -> bar-pub
  const cafeBakery = subtypeOwnerDefaults('cafe-bakery');     // -> cafe

  assertEq('casual -> casual-dining',
    casual, RESTAURANT_SUBTYPE_OWNER_DEFAULTS['casual-dining']);
  assertEq('restaurant -> casual-dining',
    restaurant, RESTAURANT_SUBTYPE_OWNER_DEFAULTS['casual-dining']);
  assertEq('coffee-shop -> cafe',
    coffee, RESTAURANT_SUBTYPE_OWNER_DEFAULTS['cafe']);
  assertEq('pub -> bar-pub',
    pub, RESTAURANT_SUBTYPE_OWNER_DEFAULTS['bar-pub']);
  assertEq('brewery -> bar-pub',
    brewery, RESTAURANT_SUBTYPE_OWNER_DEFAULTS['bar-pub']);
  assertEq('cafe-bakery -> cafe',
    cafeBakery, RESTAURANT_SUBTYPE_OWNER_DEFAULTS['cafe']);
}

// --- Test 5: unknown / malformed ids return null -------------------
// Caller code reads `subtypeOwnerDefaults(id) || DEFAULT_OWNER_INPUTS`
// so null is the signal to fall back to the generic shape. Never
// throw, never return a partial object, never return the wrong
// subtype's values.
assertEq('null id returns null',              subtypeOwnerDefaults(null),        null);
assertEq('undefined id returns null',         subtypeOwnerDefaults(undefined),   null);
assertEq('empty-string id returns null',      subtypeOwnerDefaults(''),          null);
assertEq('unknown id returns null',           subtypeOwnerDefaults('not-a-real-subtype'), null);
assertEq('numeric id returns null',           subtypeOwnerDefaults(123),         null);
assertEq('object id returns null',            subtypeOwnerDefaults({ id: 'fine-dining' }), null);

// --- Test 6: defaults are plausible order-of-magnitude -------------
// Guardrail against a future edit accidentally swapping two fields
// (e.g. setting avgCheck=250 for cafe would make every cafe's
// revenue chip 30× too high). Hard bounds:
//   coversPerDay in [10, 500]
//   avgCheck     in [5, 200]
//   openDays     in [180, 365]
{
  const outOfBounds = [];
  for (const id of Object.keys(RESTAURANT_SUBTYPE_OWNER_DEFAULTS)) {
    const d = RESTAURANT_SUBTYPE_OWNER_DEFAULTS[id];
    if (d.coversPerDay < 10  || d.coversPerDay > 500) outOfBounds.push(id + '.coversPerDay=' + d.coversPerDay);
    if (d.avgCheck     <  5  || d.avgCheck     > 200) outOfBounds.push(id + '.avgCheck='     + d.avgCheck);
    if (d.openDays     < 180 || d.openDays     > 365) outOfBounds.push(id + '.openDays='     + d.openDays);
  }
  assertEq('all defaults within plausibility bounds', outOfBounds, []);
}

// --- Test 7: derived annual revenue is in a plausible band --------
// Catches cases where the three fields individually pass bounds but
// their product is out of reasonable range. US restaurant industry
// averages independent sites around $500k-$2M/yr; we allow $100k-$5M
// so niche subtypes (food-truck low end, fine-dining high end) fit.
{
  const outOfRange = [];
  for (const id of Object.keys(RESTAURANT_SUBTYPE_OWNER_DEFAULTS)) {
    const d = RESTAURANT_SUBTYPE_OWNER_DEFAULTS[id];
    const annual = d.coversPerDay * d.avgCheck * d.openDays;
    if (annual < 100_000 || annual > 5_000_000) {
      outOfRange.push(id + '=$' + Math.round(annual / 1000) + 'k');
    }
  }
  assertEq('derived annual revenue within $100k–$5M band', outOfRange, []);
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll subtype-owner-defaults tests passed.');
