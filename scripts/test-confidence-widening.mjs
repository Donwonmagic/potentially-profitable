#!/usr/bin/env node
// Sprint CC3c: confidence-aware revenue-chip widening regression test.
// Run via: `node scripts/test-confidence-widening.mjs`
//
// CC3a + CC3b tightened the revenue chip when priceLevel +
// reviewCount are present. About half of real audits have both
// signals, roughly a quarter have neither. Without a widening
// layer, the chip showed the same visual weight for a well-
// resolved restaurant and a nothing-detected one.
//
// confidenceWideningFactors(signals) stretches the chip's [low, high]
// span multiplicatively when signals are missing, so the range
// WIDTH itself communicates how much the audit actually knows.
// No copy change needed — the honesty is visual.
//
// Widening factors:
//   Places match missing          0.70 × 1.40
//   priceLevel missing            0.85 × 1.15
//   reviewCount < threshold(50)   0.85 × 1.15
//
// Stacked worst case:  0.506 × 1.852   (~3.7× wider range)
// Stacked best case:   1.0   × 1.0      (identity, no widening)
//
// Exits non-zero on failure.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const S = require('../tools/audits/restaurant/subtypes.js');
const { confidenceWideningFactors, LOW_REVIEW_COUNT_THRESHOLD } = S;

let failures = 0;
function approx(a, b, eps) { return Math.abs(a - b) < (eps || 0.005); }
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}
function assertApprox(label, actual, expected) {
  const ok = approx(actual, expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ~' + expected + ', got ' + actual.toFixed(4) + ')');
  if (!ok) failures++;
}

// --- Identity when ALL signals present ------------------------------
{
  const w = confidenceWideningFactors({ hasPlacesMatch: true, hasPriceLevel: true, reviewCount: 200 });
  assertEq('all-signals: low factor is identity',  w.low,  1.0);
  assertEq('all-signals: high factor is identity', w.high, 1.0);
}

// --- Only Places match missing --------------------------------------
{
  const w = confidenceWideningFactors({ hasPlacesMatch: false, hasPriceLevel: true, reviewCount: 200 });
  // Still hits the priceLevel + reviewCount paths even though we have
  // those signals? NO — we only widen on MISSING signals. Places
  // missing pushes both factors; the others don't apply here.
  // Wait: if hasPlacesMatch=false, we'd never have priceLevel or
  // reviewCount anyway. But if a test sets them independently, the
  // widening only fires on the false flags. Verify that isolation:
  assertApprox('places-missing-only: low',  w.low,  0.70);
  assertApprox('places-missing-only: high', w.high, 1.40);
}

// --- Only priceLevel missing ----------------------------------------
{
  const w = confidenceWideningFactors({ hasPlacesMatch: true, hasPriceLevel: false, reviewCount: 200 });
  assertApprox('price-missing-only: low',  w.low,  0.85);
  assertApprox('price-missing-only: high', w.high, 1.15);
}

// --- Only reviewCount thin (< threshold) ----------------------------
{
  const w = confidenceWideningFactors({ hasPlacesMatch: true, hasPriceLevel: true, reviewCount: 10 });
  assertApprox('thin-reviews: low',  w.low,  0.85);
  assertApprox('thin-reviews: high', w.high, 1.15);
}

// --- Exactly at threshold: 50 reviews does NOT widen ----------------
// Threshold is "< 50"; exactly 50 is the first count we trust.
{
  const w = confidenceWideningFactors({ hasPlacesMatch: true, hasPriceLevel: true, reviewCount: LOW_REVIEW_COUNT_THRESHOLD });
  assertApprox('at threshold 50: identity low',  w.low,  1.0);
  assertApprox('at threshold 50: identity high', w.high, 1.0);
}
{
  const w = confidenceWideningFactors({ hasPlacesMatch: true, hasPriceLevel: true, reviewCount: LOW_REVIEW_COUNT_THRESHOLD - 1 });
  assertApprox('at threshold-1 (49): widens low',  w.low,  0.85);
  assertApprox('at threshold-1 (49): widens high', w.high, 1.15);
}

// --- All three missing (worst case) ---------------------------------
{
  const w = confidenceWideningFactors({ hasPlacesMatch: false, hasPriceLevel: false, reviewCount: null });
  assertApprox('nothing-resolved: low',  w.low,  0.70 * 0.85 * 0.85); // 0.5058
  assertApprox('nothing-resolved: high', w.high, 1.40 * 1.15 * 1.15); // 1.8515
}

// --- Defensive: null / undefined / missing signals object -----------
{
  const w1 = confidenceWideningFactors(null);
  assertApprox('null signals: low maxes widening',  w1.low,  0.70 * 0.85 * 0.85);
  assertApprox('null signals: high maxes widening', w1.high, 1.40 * 1.15 * 1.15);

  const w2 = confidenceWideningFactors(undefined);
  assertApprox('undefined signals: low maxes widening',  w2.low,  0.70 * 0.85 * 0.85);
  assertApprox('undefined signals: high maxes widening', w2.high, 1.40 * 1.15 * 1.15);

  // Partial object — missing fields treated as "signal missing"
  const w3 = confidenceWideningFactors({ hasPlacesMatch: true });
  assertApprox('partial signals {hasPlacesMatch}: low', w3.low,  0.85 * 0.85);
  assertApprox('partial signals {hasPlacesMatch}: high', w3.high, 1.15 * 1.15);
}

// --- Low factor is always <= 1.0; high is always >= 1.0 -------------
// Sanity check: a future edit that accidentally flips a factor
// direction must trip this test.
{
  const samples = [
    { hasPlacesMatch: true,  hasPriceLevel: true,  reviewCount: 200 },
    { hasPlacesMatch: false, hasPriceLevel: false, reviewCount: 0 },
    { hasPlacesMatch: true,  hasPriceLevel: false, reviewCount: 100 },
    { hasPlacesMatch: false, hasPriceLevel: true,  reviewCount: 1000 }
  ];
  let allInvariant = true;
  for (const s of samples) {
    const w = confidenceWideningFactors(s);
    if (w.low > 1.0 || w.high < 1.0) { allInvariant = false; break; }
  }
  assertEq('low <= 1.0 and high >= 1.0 across samples', allInvariant, true);
}

// --- reviewCount = 0 treated as missing -----------------------------
{
  const w = confidenceWideningFactors({ hasPlacesMatch: true, hasPriceLevel: true, reviewCount: 0 });
  // 0 < threshold, so the thin-reviews widening fires.
  assertApprox('0 reviews widens', w.low, 0.85);
  assertApprox('0 reviews widens', w.high, 1.15);
}

// --- reviewCount as string / NaN / Infinity -> treated as missing ---
{
  const bogus = [{ reviewCount: '200' }, { reviewCount: NaN }, { reviewCount: Infinity }];
  for (const s of bogus) {
    const full = Object.assign({ hasPlacesMatch: true, hasPriceLevel: true }, s);
    const w = confidenceWideningFactors(full);
    const ok = approx(w.low, 0.85) && approx(w.high, 1.15);
    console.log((ok ? 'PASS' : 'FAIL') +
      '  malformed reviewCount (' + JSON.stringify(s.reviewCount) + ') widens');
    if (!ok) failures++;
  }
}

// --- Integration: apply widening to a hypothetical chip range ------
// A $20k-per-year range on an audit with NO signals should stretch
// to roughly [$10k, $37k] — a 3.7× wider span that reads "we're
// guessing" visually, without changing any copy.
{
  const lowPct = 0.02;
  const highPct = 0.05;
  const annualRevenue = 500_000;
  const w = confidenceWideningFactors({ hasPlacesMatch: false, hasPriceLevel: false, reviewCount: null });
  const lowDollars  = Math.round(annualRevenue * lowPct  * w.low);
  const highDollars = Math.round(annualRevenue * highPct * w.high);
  const spreadRatio = highDollars / lowDollars;
  // Original would be 10000–25000 (ratio 2.5). Widened, spread should
  // be roughly 3.7× as wide -> ratio ~9.2.
  const ok = spreadRatio > 6 && spreadRatio < 14;
  console.log((ok ? 'PASS' : 'FAIL') +
    '  nothing-resolved: chip spread ratio ~9.2x (' +
    lowDollars + '–' + highDollars + ', ratio ' + spreadRatio.toFixed(2) + ')');
  if (!ok) failures++;
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll confidence-widening tests passed.');
