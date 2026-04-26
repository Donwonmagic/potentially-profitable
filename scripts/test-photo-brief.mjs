#!/usr/bin/env node
// Photo Brief Builder — math + privacy regression tests.
// Run via: `node scripts/test-photo-brief.mjs`
//
// Five assertion categories (mirrors the prior tools' test pattern):
//
// 1. Aspect-ratio math (the §3 Risk-2 mitigation made testable):
//    every (source-aspect, destination-surface) pair returns a
//    deterministic crop rectangle.
// 2. Shot-count / dedup math: canonical fixtures + edge cases.
// 3. Enum-default mapping: every (surface, category) pair produces
//    a triple within the declared enums (the §3 Risk-1 mitigation
//    made testable).
// 4. ROI math + fragment encode/decode round-trips (the Risk-3
//    mitigation made testable — fragments are how cross-tool data
//    flows in).
// 5. Privacy / bucket purity: enum-locked sweeps with poison strings.
//
// Exits non-zero on failure.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const PB = require('../tools/photo-brief/photo-brief.js');

let failures = 0;
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              (ok ? '' : '  (expected ' + JSON.stringify(expected) +
                        ', got ' + JSON.stringify(actual) + ')'));
  if (!ok) failures++;
}
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label +
              (cond ? '' : (detail ? '  (' + detail + ')' : '')));
  if (!cond) failures++;
}
function near(label, actual, expected, tolerance) {
  const t = tolerance == null ? 1e-6 : tolerance;
  const diff = Math.abs(Number(actual) - Number(expected));
  const ok = isFinite(diff) && diff <= t;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              (ok ? '' : '  (expected ~' + expected + ', got ' + actual + ', |Δ|=' + diff + ')'));
  if (!ok) failures++;
}

// ============================================================
// 1. Aspect-ratio math
// ============================================================

// Every surface should be in the SURFACES table with a positive ratio.
const expectedSurfaces = ['web-hero','og-card','yelp','gbp-cover','ig-grid','ig-story','menu-inline','apple-maps'];
expectedSurfaces.forEach(function(k){
  assert('SURFACES has "' + k + '"', !!PB.SURFACES[k]);
  assert('SURFACES["' + k + '"] has positive ratio', PB.SURFACES[k].ratio > 0);
  assert('SURFACES["' + k + '"] has pixel resolution', PB.SURFACES[k].pixels.w > 0 && PB.SURFACES[k].pixels.h > 0);
});

// 3:2 source → 1:1 IG square: horizontal crop, fraction = 1/1.5 = 0.667
const crop1 = PB.computeCropRectangle(3/2, 'ig-grid');
assertEq('3:2 → 1:1 axis', crop1.axis, 'horizontal');
near('3:2 → 1:1 cropFraction', crop1.cropFraction, 2/3, 1e-6);

// 3:2 source → 16:9 web hero: vertical crop, fraction = (3/2) / (16/9) = 0.844
const crop2 = PB.computeCropRectangle(3/2, 'web-hero');
assertEq('3:2 → 16:9 axis', crop2.axis, 'vertical');
near('3:2 → 16:9 cropFraction', crop2.cropFraction, (3/2) / (16/9), 1e-6);

// 3:2 source → 9:16 IG story: vertical crop, fraction = (3/2) / (9/16) BUT
// (3/2) > (9/16) so it's actually horizontal. Wait: dst = 9/16 = 0.5625,
// src = 1.5; src > dst so horizontal crop, fraction = dst/src = 0.375
const crop3 = PB.computeCropRectangle(3/2, 'ig-story');
assertEq('3:2 → 9:16 axis', crop3.axis, 'horizontal');
near('3:2 → 9:16 cropFraction', crop3.cropFraction, (9/16) / (3/2), 1e-6);

// 3:2 source → 1.91:1 OG card: src=1.5, dst=1.91. dst > src → vertical, frac = src/dst.
const crop4 = PB.computeCropRectangle(3/2, 'og-card');
assertEq('3:2 → 1.91:1 axis', crop4.axis, 'vertical');
near('3:2 → 1.91:1 cropFraction', crop4.cropFraction, 1.5 / 1.91, 1e-3);

// 3:2 source → 3:2 yelp: exact, fraction=1
const crop5 = PB.computeCropRectangle(3/2, 'yelp');
assertEq('3:2 → 3:2 axis', crop5.axis, 'exact');
near('3:2 → 3:2 cropFraction', crop5.cropFraction, 1);

// 4:3 source (phone) → 1:1 IG: src=1.333, dst=1; src > dst → horizontal, frac=0.75
const crop6 = PB.computeCropRectangle(4/3, 'ig-grid');
assertEq('4:3 → 1:1 axis', crop6.axis, 'horizontal');
near('4:3 → 1:1 cropFraction', crop6.cropFraction, 0.75, 1e-6);

// 4:3 source → 16:9: src=1.333, dst=1.778; dst > src → vertical, frac = 1.333/1.778
const crop7 = PB.computeCropRectangle(4/3, 'web-hero');
assertEq('4:3 → 16:9 axis', crop7.axis, 'vertical');
near('4:3 → 16:9 cropFraction', crop7.cropFraction, (4/3) / (16/9), 1e-6);

// Invalid surface → null
assert('unknown surface returns null', PB.computeCropRectangle(3/2, 'tiktok') === null);

// Invalid source ratio (NaN, 0, negative) → uses 3:2 default
const crop8 = PB.computeCropRectangle(0, 'ig-grid');
near('0 source ratio falls back to 3:2', crop8.sourceRatio, 1.5, 1e-6);
const crop9 = PB.computeCropRectangle(NaN, 'ig-grid');
near('NaN source ratio falls back to 3:2', crop9.sourceRatio, 1.5, 1e-6);

// ============================================================
// 2. Shot-count / dedup math
// ============================================================

// Canonical: 6-dish Italian sample × 4 surfaces × 3 angles
const sample = PB.SAMPLE_RECIPE_EN;
const dedup1 = PB.dedupShotList(sample.dishes, sample.surfaces, 3);
assertEq('sample naive count = 6 × 4 × 3', dedup1.naive, 72);
assert('sample dedup < naive',                  dedup1.dedup < dedup1.naive);
assert('sample dedup > 0',                      dedup1.dedup > 0);
assertEq('sample perDish length',               dedup1.perDish.length, 6);

// Each per-dish entry should report a positive shot count.
dedup1.perDish.forEach(function(d, i){
  assert('perDish[' + i + '] (' + d.name + ') shots > 0', d.shots > 0);
  assert('perDish[' + i + '] shots ≤ surfaces (4)', d.shots <= 4);
});

// Empty dishes → naive=0, dedup=0
const dedup2 = PB.dedupShotList([], sample.surfaces, 3);
assertEq('empty dishes naive', dedup2.naive, 0);
assertEq('empty dishes dedup', dedup2.dedup, 0);

// 1 dish × 1 surface = 1 source frame
const dedup3 = PB.dedupShotList(
  [{ name: 'x', category: 'main' }],
  ['ig-grid'],
  3
);
assertEq('1 dish × 1 surface naive (× 3 angles)', dedup3.naive, 3);
assertEq('1 dish × 1 surface dedup',              dedup3.dedup, 1);

// All same-(angle, lighting) tuple = 1 source frame per dish.
// Use a category that maps to the same defaults across these surfaces.
// 'main' on all four surfaces in the sample list — different
// (angle, lighting) pairs across surfaces, so dedup > 1 per dish.

// All-different surface categories: room-only. Room dishes always
// map to (room, ambient, ...) regardless of surface.
const dedup4 = PB.dedupShotList(
  [{ name: 'dining', category: 'room' }],
  sample.surfaces,
  3
);
assertEq('room dish across 4 surfaces dedups to 1', dedup4.perDish[0].shots, 1);

// Invalid surface keys are filtered out.
const dedup5 = PB.dedupShotList(
  [{ name: 'x', category: 'main' }],
  ['ig-grid', 'tiktok', 'web-hero'],
  3
);
assertEq('unknown surfaces filtered',
         dedup5.perDish[0].surfaces.sort().join(','),
         ['ig-grid', 'web-hero'].sort().join(','));

// ============================================================
// 3. Enum-default mapping — every (surface, category) returns a
// triple in the declared enum sets.
// ============================================================

PB.CATEGORIES.forEach(function(category){
  Object.keys(PB.SURFACES).forEach(function(surface){
    const d = PB.defaultsForCell(surface, category);
    assert('defaultsForCell(' + surface + ', ' + category + ') returns object', d != null);
    if (!d) return;
    assert('  angle ∈ ANGLES',       PB.ANGLES.indexOf(d.angle) !== -1, d.angle);
    assert('  lighting ∈ LIGHTING',  PB.LIGHTING.indexOf(d.lighting) !== -1, d.lighting);
    assert('  negSpace ∈ NEG_SPACE', PB.NEG_SPACE.indexOf(d.negSpace) !== -1, d.negSpace);
  });
});

// Specific spot-checks:
//  - room category → angle=room across the board
['web-hero', 'ig-grid', 'menu-inline'].forEach(function(s){
  assertEq('room category → angle=room (' + s + ')', PB.defaultsForCell(s, 'room').angle, 'room');
});
//  - drink category → angle=plate-level
assertEq('drink × ig-grid → plate-level', PB.defaultsForCell('ig-grid', 'drink').angle, 'plate-level');
//  - dessert × ig-grid → angle=overhead
assertEq('dessert × ig-grid → overhead',  PB.defaultsForCell('ig-grid', 'dessert').angle, 'overhead');
//  - web-hero negSpace=right
assertEq('web-hero negSpace=right',       PB.defaultsForCell('web-hero', 'main').negSpace, 'right');
//  - og-card negSpace=bottom
assertEq('og-card negSpace=bottom',       PB.defaultsForCell('og-card', 'main').negSpace, 'bottom');
//  - ig-story negSpace=top
assertEq('ig-story negSpace=top',         PB.defaultsForCell('ig-story', 'main').negSpace, 'top');

// Unknown surface → null
assertEq('unknown surface → null', PB.defaultsForCell('tiktok', 'main'), null);

// ============================================================
// 4. ROI math
// ============================================================

const roi1 = PB.computeRoiMath(15, 1800);
assertEq('15 shots / 1 day', roi1.days, 1);
assertEq('15 shots × 1 day @ $1800', roi1.totalCost, 1800);
near('cost per shot', roi1.costPerShot, 1800 / 15);
assert('monthlyLift > 0', roi1.monthlyLift > 0);
assert('paybackMonths > 0', roi1.paybackMonths > 0);

const roi2 = PB.computeRoiMath(60, 1800);
assertEq('60 shots ÷ 50/day = 2 days', roi2.days, 2);
assertEq('60 shots × 2 days @ $1800', roi2.totalCost, 3600);

const roi3 = PB.computeRoiMath(0, 1800);
assertEq('0 shots → 0 days', roi3.days, 0);
assertEq('0 shots → 0 cost', roi3.totalCost, 0);
assertEq('0 shots → 0 cost/shot', roi3.costPerShot, 0);

const roi4 = PB.computeRoiMath('not a number', 'also bogus');
assertEq('NaN inputs → 0 days',       roi4.days, 0);
assertEq('NaN inputs → 0 totalCost',  roi4.totalCost, 0);

// ============================================================
// 5. Fragment encode/decode round-trips
// ============================================================

// Stars
const dishesIn = sample.dishes;
const enc = PB.encodeStarsFragment(dishesIn);
const dec = PB.decodeStarsFragment(enc);
assertEq('stars round-trip count', dec.length, dishesIn.length);
assertEq('stars round-trip first name', dec[0].name, dishesIn[0].name);
assertEq('stars round-trip first category', dec[0].category, dishesIn[0].category);
assertEq('stars round-trip first priority', dec[0].priority, dishesIn[0].priority);

// Empty fragment → empty array
assertEq('empty stars fragment → []', PB.decodeStarsFragment(''), []);
assertEq('null stars → []',           PB.decodeStarsFragment(null), []);

// Palette
const paletteIn = ['#1F4E5B', '#C68A2C', '#FAF7F2', '#14161A', '#5A5752'];
const palEnc = PB.encodePaletteFragment(paletteIn);
const palDec = PB.decodePaletteFragment(palEnc);
assertEq('palette round-trip',     palDec, paletteIn);

// Bad palette items filtered
assertEq('palette filters bad hex',
         PB.decodePaletteFragment('1F4E5B-not-a-hex-FAF7F2'),
         ['#1F4E5B', '#FAF7F2']);

// Margins
const marginsIn = [
  { name: 'Cacio e pepe',      plateCost: 3.35, suggestedPrice: 11.17 },
  { name: 'Brodetto di pesce', plateCost: 7.10, suggestedPrice: 23.66 }
];
const mEnc = PB.encodeMarginsFragment(marginsIn);
const mDec = PB.decodeMarginsFragment(mEnc);
assertEq('margins round-trip count', mDec.length, marginsIn.length);
assertEq('margins round-trip first name', mDec[0].name, marginsIn[0].name);
near('margins round-trip plateCost',   mDec[0].plateCost, marginsIn[0].plateCost, 1e-2);
near('margins round-trip suggestedPrice', mDec[0].suggestedPrice, marginsIn[0].suggestedPrice, 1e-2);

// ============================================================
// 6. Paste-from-spreadsheet — parseTabularText
// ============================================================

const csv1 = PB.parseTabularText('Dish,Category,Priority\nCacio e pepe,pasta,hero\nTiramisu,dessert,standard\n');
assertEq('csv parses 2 data rows', csv1.rows.length, 2);
assertEq('csv detects header row', csv1.headerRowDetected, true);
assertEq('csv first dish name', csv1.rows[0].name, 'Cacio e pepe');
assertEq('csv first category', csv1.rows[0].category, 'pasta');
assertEq('csv first priority', csv1.rows[0].priority, 'hero');

// TSV detection
const tsv1 = PB.parseTabularText('name\tcategory\tpriority\nFocaccia\tappetizer\tstandard\n');
assertEq('tsv parses 1 row', tsv1.rows.length, 1);
assertEq('tsv first dish', tsv1.rows[0].name, 'Focaccia');

// Spanish header aliases
const csv2 = PB.parseTabularText('plato,categoria,prioridad\nTiramisú,postre,estrella\n');
assertEq('Spanish headers parse', csv2.rows[0].name, 'Tiramisú');
assertEq('Spanish "postre" maps to dessert', csv2.rows[0].category, 'dessert');
assertEq('Spanish "estrella" maps to hero',  csv2.rows[0].priority, 'hero');

// Headerless positional fallback
const csv3 = PB.parseTabularText('Salad,appetizer,standard\nChicken,main,hero\n');
assertEq('headerless falls through positional', csv3.rows.length, 2);
assert('headerless surfaces a warning',          csv3.warnings.length > 0);

// Quoted commas in dish names
const csv4 = PB.parseTabularText('Dish,Category\n"Beef, ground",main\n');
assertEq('quoted comma preserved', csv4.rows[0].name, 'Beef, ground');

// Unknown category falls back to 'main'
const csv5 = PB.parseTabularText('Dish,Category\nMystery,unknown-cat\n');
assertEq('unknown category falls to main', csv5.rows[0].category, 'main');

// Empty paste
const csv6 = PB.parseTabularText('');
assertEq('empty paste → empty rows', csv6.rows.length, 0);
assert('empty paste surfaces warning', csv6.warnings.length > 0);

// Star → hero, Plowhorse → secondary
assertEq('Star priority → hero',          PB.normalizePriority('Star'),      'hero');
assertEq('Plowhorse priority → secondary',PB.normalizePriority('Plowhorse'), 'secondary');
assertEq('unknown priority → standard',   PB.normalizePriority('blah'),      'standard');

// ============================================================
// 7. Plausible bucket purity — enum-locked across input ranges +
// poison strings.
// ============================================================

const SHOT_BUCKETS    = ['0','1-10','11-25','26-50','gt-50'];
const SURFACE_BUCKETS = ['minimal','standard','full'];
const SOURCE_BUCKETS  = ['manual','prefill-stars','prefill-palette','prefill-full','mixed'];

[0, -1, NaN, '<script>', null, undefined, {}, '0', '1', '10', '11', '25', '26', '50', '51', '999'].forEach(function(v){
  const b = PB.bucketShotCount(v);
  assert('bucketShotCount(' + JSON.stringify(v) + ') ∈ enum', SHOT_BUCKETS.indexOf(b) !== -1, b);
});

[null, undefined, [], 'NOT_AN_ARRAY', {evil:1}, ['ig-grid'], ['ig-grid','web-hero'], ['ig-grid','web-hero','ig-story'], ['ig-grid','web-hero','ig-story','og-card'], ['ig-grid','web-hero','ig-story','og-card','yelp']].forEach(function(v){
  const b = PB.bucketSurfaceCoverage(v);
  assert('bucketSurfaceCoverage(' + JSON.stringify(v) + ') ∈ enum', SURFACE_BUCKETS.indexOf(b) !== -1, b);
});

[
  null, undefined, {},
  { hasStars: true },
  { hasPalette: true },
  { hasStars: true, hasPalette: true, hasMargins: true },
  { hasStars: true, hasPalette: true, hasMargins: true, userEdited: true },
  { hasStars: 'evil string' }
].forEach(function(v){
  const b = PB.bucketSourceMode(v);
  assert('bucketSourceMode(' + JSON.stringify(v) + ') ∈ enum', SOURCE_BUCKETS.indexOf(b) !== -1, b);
});

assertEq('bucketShotCount(0)',     PB.bucketShotCount(0),    '0');
assertEq('bucketShotCount(10)',    PB.bucketShotCount(10),   '1-10');
assertEq('bucketShotCount(11)',    PB.bucketShotCount(11),   '11-25');
assertEq('bucketShotCount(26)',    PB.bucketShotCount(26),   '26-50');
assertEq('bucketShotCount(51)',    PB.bucketShotCount(51),   'gt-50');

assertEq('bucketSurfaceCoverage([])',                   PB.bucketSurfaceCoverage([]),                                 'minimal');
assertEq('bucketSurfaceCoverage 3 valid',               PB.bucketSurfaceCoverage(['ig-grid','web-hero','og-card']),    'standard');
assertEq('bucketSurfaceCoverage 5 valid',               PB.bucketSurfaceCoverage(['ig-grid','web-hero','og-card','yelp','menu-inline']), 'full');

assertEq('bucketSourceMode no data',   PB.bucketSourceMode({}),                                          'manual');
assertEq('bucketSourceMode all data',  PB.bucketSourceMode({ hasStars: true, hasPalette: true, hasMargins: true }), 'prefill-full');
assertEq('bucketSourceMode edited',    PB.bucketSourceMode({ hasStars: true, hasPalette: true, hasMargins: true, userEdited: true }), 'mixed');

// Poison-string sweep — every value passed through every bucket
// helper must come back as a declared enum value.
const poison = ['<script>alert(1)</script>', "'); DROP TABLE", '\0', ' ', 'Infinity', 'NaN', '0xff'];
poison.forEach(function(p){
  assert('no leak from bucketShotCount(' + JSON.stringify(p) + ')',
    SHOT_BUCKETS.indexOf(PB.bucketShotCount(p)) !== -1);
});

// ============================================================
console.log('\n' + (failures === 0
  ? '✓ all photo-brief assertions pass'
  : '✗ ' + failures + ' photo-brief assertion(s) failed'));
process.exit(failures === 0 ? 0 : 1);
