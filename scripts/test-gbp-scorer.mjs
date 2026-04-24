#!/usr/bin/env node
// GBP grader scorer regression tests.
// Run via: `node scripts/test-gbp-scorer.mjs`
//
// Locks in the scoring contract in tools/gbp-grader/gbp-grader.js:
//   1. band / letter thresholds: A >= 85, B >= 70, C >= 55, D >= 40, else F
//   2. businessStatus !== OPERATIONAL hard-forces letter to F
//   3. service_attrs is skipped (not penalized) when Google returns no
//      service fields — preserves max integrity for non-restaurants
//   4. Deep Scan checks (review_recency / nap / owner_reply) are skipped
//      when deepScanData is absent; present data pulls them into `max`
//   5. peer-median resolution: overrides beat family beats _default
//   6. fixFirst picks the highest-weight failing check
//   7. primary_category: missing -> fail, generic -> warn, specific -> pass
//   8. the scaled 0-100 value = round(total / max * 100), so a perfect
//      Fast Scan grades as A even though raw total = max = 80
//
// Exits non-zero on failure.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const {
  gbpScoreCandidate,
  gbpResolvePeerMedian,
  gbpGradeBand,
  gbpLetter,
  gbpIsGenericType,
  gbpCountServiceAttrs
} = require('../tools/gbp-grader/gbp-grader.js');

const peerMedians = require('../tools/gbp-grader/peer-medians.json');

let failures = 0;
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              (ok ? '' : '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')'));
  if (!ok) failures++;
}
function assert(label, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label);
  if (!cond) failures++;
}

// Lookup by id across all groups.
function pick(result, id) {
  for (const g of result.groups) {
    for (const c of g.checks) if (c.id === id) return c;
  }
  return null;
}

// ---------------------------------------------------------------
// Fixture factory
// ---------------------------------------------------------------
function place(overrides) {
  return Object.assign({
    businessStatus: 'OPERATIONAL',
    primaryTypeDisplayName: 'Pizza restaurant',
    hasHours: true,
    weekdayHoursText: ['Mon 11am-10pm'],
    nationalPhoneNumber: '+1 301 555 0000',
    rating: 4.7,
    reviewCount: 220,
    photoCount: 45,
    editorialSummary: 'Neapolitan spot.',
    website: 'https://example.com',
    dineIn: true, takeout: true, delivery: true, reservable: false,
    servesLunch: true, servesDinner: true, servesVegetarianFood: true
  }, overrides || {});
}

// ---------------------------------------------------------------
// Letter / band thresholds (pure)
// ---------------------------------------------------------------
assertEq('letter@100',       gbpLetter(100, false), 'A');
assertEq('letter@85',        gbpLetter(85,  false), 'A');
assertEq('letter@84',        gbpLetter(84,  false), 'B');
assertEq('letter@70',        gbpLetter(70,  false), 'B');
assertEq('letter@69',        gbpLetter(69,  false), 'C');
assertEq('letter@55',        gbpLetter(55,  false), 'C');
assertEq('letter@54',        gbpLetter(54,  false), 'D');
assertEq('letter@40',        gbpLetter(40,  false), 'D');
assertEq('letter@39',        gbpLetter(39,  false), 'F');
assertEq('letter:forcedF',   gbpLetter(99,  true),  'F');

assertEq('band@85',          gbpGradeBand(85, false), 'good');
assertEq('band@69',          gbpGradeBand(69, false), 'ok');
assertEq('band@39',          gbpGradeBand(39, false), 'bad');
assertEq('band:forcedF',     gbpGradeBand(99, true),  'bad');

// ---------------------------------------------------------------
// Generic-type and service-attr helpers
// ---------------------------------------------------------------
assert('generic: Establishment',        gbpIsGenericType('Establishment'));
assert('generic: Point of interest',    gbpIsGenericType('Point of interest'));
assert('specific: Pizza restaurant',   !gbpIsGenericType('Pizza restaurant'));
assertEq('countServiceAttrs:restaurant', gbpCountServiceAttrs(place()), 7);
assertEq('countServiceAttrs:empty',      gbpCountServiceAttrs({}), 0);

// ---------------------------------------------------------------
// Peer-median resolution
// ---------------------------------------------------------------
{
  const r = gbpResolvePeerMedian({ primaryTypeDisplayName: 'Pizza restaurant' }, peerMedians);
  assertEq('peer:override Pizza reviewMedian', r.reviewCount, 180);
  assertEq('peer:override source tag',         r.source, 'override');
}
{
  // Chinese restaurant isn't in _overrides, should fall to family 'restaurant'
  const r = gbpResolvePeerMedian({ primaryTypeDisplayName: 'Chinese restaurant' }, peerMedians);
  assertEq('peer:family Chinese reviewMedian', r.reviewCount, 145);
  assertEq('peer:family source tag',           r.source, 'family:restaurant');
}
{
  // Unknown type falls all the way through
  const r = gbpResolvePeerMedian({ primaryTypeDisplayName: 'Tractor dealer' }, peerMedians);
  assertEq('peer:default fallback',         r.reviewCount, peerMedians._default.reviewCount);
  assertEq('peer:default source tag',       r.source, 'default');
}

// ---------------------------------------------------------------
// Full-rubric scoring fixtures
// ---------------------------------------------------------------

// Perfect listing: all Fast Scan checks pass.
{
  const r = gbpScoreCandidate(place(), peerMedians, null, 'en');
  assertEq('good:total == max',     r.total, r.max);
  assertEq('good:scaled',           r.scaled, 100);
  assertEq('good:letter',           r.letter, 'A');
  assertEq('good:band',             r.band, 'good');
  assertEq('good:forcedF',          r.forcedF, false);
  assertEq('good:deepScan flag',    r.deepScan, false);
  assertEq('good:fixFirst',         r.fixFirst, null);
}

// Neglected listing: many fails.
{
  const neglected = place({
    primaryTypeDisplayName: null,
    hasHours: false, weekdayHoursText: null,
    nationalPhoneNumber: null,
    rating: 3.4, reviewCount: 8,
    photoCount: 1,
    editorialSummary: null,
    website: null,
    // zero service attrs set
    dineIn: null, takeout: null, delivery: null, reservable: null,
    servesLunch: null, servesDinner: null, servesVegetarianFood: null
  });
  const r = gbpScoreCandidate(neglected, peerMedians, null, 'en');
  assertEq('neglected:letter',    r.letter, 'F');
  assertEq('neglected:band',      r.band, 'bad');
  // service_attrs skipped because nothing is set
  assertEq('neglected:service_attrs skipped',
           pick(r, 'service_attrs').state, 'skipped');
  // primary_category (weight 10) is the heaviest fail
  assertEq('neglected:fixFirst is primary_category',
           r.fixFirst && r.fixFirst.id, 'primary_category');
}

// Closed temporarily: hard F override.
{
  const closed = place({ businessStatus: 'CLOSED_TEMPORARILY' });
  const r = gbpScoreCandidate(closed, peerMedians, null, 'en');
  assertEq('closed_temp:letter',        r.letter, 'F');
  assertEq('closed_temp:forcedF',       r.forcedF, true);
  assertEq('closed_temp:band',          r.band, 'bad');
  // The underlying total should still be high — we only force the
  // letter, not the math. This matters for the "since last check"
  // delta view in a later sprint.
  assert('closed_temp:scaled >= 60',    r.scaled >= 60);
}

// Generic primary category -> warn, not fail, not pass.
{
  const r = gbpScoreCandidate(place({ primaryTypeDisplayName: 'Establishment' }), peerMedians, null, 'en');
  assertEq('generic_category:state warn',
           pick(r, 'primary_category').state, 'warn');
}

// Primary category missing -> fail.
{
  const r = gbpScoreCandidate(place({ primaryTypeDisplayName: null }), peerMedians, null, 'en');
  assertEq('missing_category:state fail',
           pick(r, 'primary_category').state, 'fail');
}

// Review volume: pass when >= peer median, warn when >=50%, else fail.
{
  const r1 = gbpScoreCandidate(place({ reviewCount: 180 }), peerMedians, null, 'en');  // == Pizza median
  assertEq('volume: at median -> pass',
           pick(r1, 'review_volume').state, 'pass');
  const r2 = gbpScoreCandidate(place({ reviewCount: 90 }),  peerMedians, null, 'en');
  assertEq('volume: half median -> warn',
           pick(r2, 'review_volume').state, 'warn');
  const r3 = gbpScoreCandidate(place({ reviewCount: 40 }),  peerMedians, null, 'en');
  assertEq('volume: below half -> fail',
           pick(r3, 'review_volume').state, 'fail');
}

// Rating thresholds: 4.5 pass, 4.0 warn, 3.9 fail, 0 fail.
{
  assertEq('rating 4.5 -> pass', pick(gbpScoreCandidate(place({ rating: 4.5 }), peerMedians, null, 'en'), 'rating').state, 'pass');
  assertEq('rating 4.0 -> warn', pick(gbpScoreCandidate(place({ rating: 4.0 }), peerMedians, null, 'en'), 'rating').state, 'warn');
  assertEq('rating 3.9 -> fail', pick(gbpScoreCandidate(place({ rating: 3.9 }), peerMedians, null, 'en'), 'rating').state, 'fail');
  assertEq('rating null -> fail', pick(gbpScoreCandidate(place({ rating: null }), peerMedians, null, 'en'), 'rating').state, 'fail');
}

// Photo bands.
{
  assertEq('photos 10 -> pass', pick(gbpScoreCandidate(place({ photoCount: 10 }), peerMedians, null, 'en'), 'photos').state, 'pass');
  assertEq('photos 3  -> warn', pick(gbpScoreCandidate(place({ photoCount: 3 }),  peerMedians, null, 'en'), 'photos').state, 'warn');
  assertEq('photos 2  -> fail', pick(gbpScoreCandidate(place({ photoCount: 2 }),  peerMedians, null, 'en'), 'photos').state, 'fail');
}

// ---------------------------------------------------------------
// Deep Scan: checks skipped when payload absent, scored when present
// ---------------------------------------------------------------
{
  const r = gbpScoreCandidate(place(), peerMedians, null, 'en');
  assertEq('deep: review_recency skipped', pick(r, 'review_recency').state, 'skipped');
  assertEq('deep: nap skipped',            pick(r, 'nap').state, 'skipped');
  assertEq('deep: owner_reply skipped',    pick(r, 'owner_reply').state, 'skipped');
  assertEq('deep: flag false',             r.deepScan, false);
}
{
  const deep = { newestReviewAgeDays: 10, ownerReplyRate: 0.75, nap: { match: 'full' } };
  const r = gbpScoreCandidate(place(), peerMedians, deep, 'en');
  assertEq('deep: flag true',              r.deepScan, true);
  assertEq('deep: review_recency pass',    pick(r, 'review_recency').state, 'pass');
  assertEq('deep: owner_reply pass',       pick(r, 'owner_reply').state, 'pass');
  assertEq('deep: nap pass',               pick(r, 'nap').state, 'pass');
  // With service_attrs also in max, full-eval max should hit 100.
  assertEq('deep: max == 100',             r.max, 100);
  assertEq('deep: scaled 100 letter A',    r.letter, 'A');
}

// Deep Scan mid-range: recency 60d -> warn, reply 30% -> warn, nap partial -> warn.
{
  const deep = { newestReviewAgeDays: 60, ownerReplyRate: 0.30, nap: { match: 'partial' } };
  const r = gbpScoreCandidate(place(), peerMedians, deep, 'en');
  assertEq('deep mid: recency warn',   pick(r, 'review_recency').state, 'warn');
  assertEq('deep mid: reply warn',     pick(r, 'owner_reply').state, 'warn');
  assertEq('deep mid: nap warn',       pick(r, 'nap').state, 'warn');
}

// ---------------------------------------------------------------
// service_attrs is correctly skipped for a business with no
// Places-side attributes (professional/service verticals).
// ---------------------------------------------------------------
{
  const lawyer = {
    businessStatus: 'OPERATIONAL',
    primaryTypeDisplayName: 'Lawyer',
    hasHours: true, weekdayHoursText: ['Mon 9-5'],
    nationalPhoneNumber: '+1 301 555 0001',
    rating: 4.6, reviewCount: 40,
    photoCount: 5,
    editorialSummary: null,
    website: 'https://example.com'
    // no service fields at all
  };
  const r = gbpScoreCandidate(lawyer, peerMedians, null, 'en');
  assertEq('lawyer:service_attrs skipped',
           pick(r, 'service_attrs').state, 'skipped');
  // Lawyer peer median is 35 reviews, so 40 is pass.
  assertEq('lawyer:review_volume pass',
           pick(r, 'review_volume').state, 'pass');
  // editorial_summary is warn (Google-curated, not owner-controlled)
  assertEq('lawyer:editorial_summary warn',
           pick(r, 'editorial_summary').state, 'warn');
}

// ---------------------------------------------------------------
// Summary
// ---------------------------------------------------------------
if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll tests passed.');
