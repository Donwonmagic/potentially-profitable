#!/usr/bin/env node
// Sprint CC3a: priceLevel → avgCheck multiplier regression test.
// Run via: `node scripts/test-price-level-multiplier.mjs`
//
// Google Places v1 returns priceLevel as a string enum. Each value
// shifts the subtype default's avgCheck toward the real check size
// of the restaurant without asking the owner anything. The user
// direction: "minimal user input, wonder at how much it tells them."
//
// Multipliers picked from published US restaurant check-size
// distributions (Nation's Restaurant News / Technomic 2024):
//
//   PRICE_LEVEL_INEXPENSIVE    0.55  (~half the median)
//   PRICE_LEVEL_MODERATE       1.00  (identity — subtype IS median)
//   PRICE_LEVEL_EXPENSIVE      1.60
//   PRICE_LEVEL_VERY_EXPENSIVE 2.40
//
// Unknown / missing / malformed inputs MUST return 1.0 so the chip
// never degrades when Places data is sparse. Exits non-zero on
// failure so CI can gate on it.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const S = require('../tools/audits/restaurant/subtypes.js');
const { priceLevelAvgCheckMultiplier, PLACES_PRICE_LEVEL_AVG_CHECK_MULT } = S;

let failures = 0;
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}

// --- Exact multiplier values (locked) ------------------------------
assertEq('INEXPENSIVE -> 0.55',    priceLevelAvgCheckMultiplier('PRICE_LEVEL_INEXPENSIVE'),    0.55);
assertEq('MODERATE -> 1.00',       priceLevelAvgCheckMultiplier('PRICE_LEVEL_MODERATE'),       1.00);
assertEq('EXPENSIVE -> 1.60',      priceLevelAvgCheckMultiplier('PRICE_LEVEL_EXPENSIVE'),      1.60);
assertEq('VERY_EXPENSIVE -> 2.40', priceLevelAvgCheckMultiplier('PRICE_LEVEL_VERY_EXPENSIVE'), 2.40);

// --- Case-insensitive (Places could change casing; we don't want to break)
assertEq('lowercase input accepted', priceLevelAvgCheckMultiplier('price_level_expensive'), 1.60);
assertEq('mixed case accepted',      priceLevelAvgCheckMultiplier('Price_Level_Moderate'),  1.00);

// --- Identity for UNSPECIFIED / FREE (not meaningful for restaurants)
assertEq('UNSPECIFIED returns 1.0', priceLevelAvgCheckMultiplier('PRICE_LEVEL_UNSPECIFIED'), 1.0);
assertEq('FREE returns 1.0',        priceLevelAvgCheckMultiplier('PRICE_LEVEL_FREE'),         1.0);

// --- Identity for malformed / missing inputs (never corrupt the default)
assertEq('null -> 1.0',        priceLevelAvgCheckMultiplier(null),        1.0);
assertEq('undefined -> 1.0',   priceLevelAvgCheckMultiplier(undefined),   1.0);
assertEq('empty string -> 1.0', priceLevelAvgCheckMultiplier(''),         1.0);
assertEq('number -> 1.0',      priceLevelAvgCheckMultiplier(3),           1.0);
assertEq('object -> 1.0',      priceLevelAvgCheckMultiplier({}),          1.0);
assertEq('garbage -> 1.0',     priceLevelAvgCheckMultiplier('$$$$'),      1.0);
assertEq('future enum -> 1.0', priceLevelAvgCheckMultiplier('PRICE_LEVEL_INSANELY_EXPENSIVE'), 1.0);

// --- Table completeness: every key maps to a positive number ------
{
  const badKeys = Object.keys(PLACES_PRICE_LEVEL_AVG_CHECK_MULT).filter((k) => {
    const v = PLACES_PRICE_LEVEL_AVG_CHECK_MULT[k];
    return typeof v !== 'number' || v <= 0;
  });
  assertEq('all multiplier table values are positive numbers', badKeys, []);
}

// --- Integration-style: pair multipliers with subtype defaults -----
// A ghost kitchen at $ tier should end up with a meaningfully
// lower avgCheck than a ghost kitchen at $$$$ tier.
{
  const gk = S.subtypeOwnerDefaults('ghost-kitchen');
  const cheap = gk.avgCheck * priceLevelAvgCheckMultiplier('PRICE_LEVEL_INEXPENSIVE');
  const lux   = gk.avgCheck * priceLevelAvgCheckMultiplier('PRICE_LEVEL_VERY_EXPENSIVE');
  const ok = lux > cheap * 3;  // ~4.4× difference
  console.log((ok ? 'PASS' : 'FAIL') + '  ghost-kitchen $ vs $$$$ avgCheck spread (' +
    Math.round(cheap) + ' vs ' + Math.round(lux) + ')');
  if (!ok) failures++;
}

// Fine-dining at $ is nonsense but shouldn't crash; the multiplier
// is still applied. Caller could choose to override this later with
// a subtype × priceLevel consistency check, but we don't do that
// here.
{
  const fd = S.subtypeOwnerDefaults('fine-dining');
  const m = priceLevelAvgCheckMultiplier('PRICE_LEVEL_INEXPENSIVE');
  assertEq('fine-dining × $: function still computes (sanity only)',
    Math.round(fd.avgCheck * m), Math.round(fd.avgCheck * 0.55));
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll price-level-multiplier tests passed.');
