#!/usr/bin/env node
// Brand Suite color-math + palette regression tests.
// Run via: `node scripts/test-brand-suite.mjs`
//
// Two categories of assertion:
//
// 1. Math: WCAG contrast against canonical fixtures. OKLab round-
//    trips. K-means palette extraction on synthetic pixel arrays.
//    Accessible-pair derivation clears the 4.5:1 target.
//
// 2. Privacy: every bucket helper returns values only from its
//    enumerated allow-list, tested across full input ranges and
//    against poison-string inputs. If any raw input ever leaks
//    into a bucket return, this suite fails loudly.
//
// Exits non-zero on failure.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const B = require('../tools/brand-suite/brand-suite.js');

let failures = 0;
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              (ok ? '' : '  (expected ' + JSON.stringify(expected) +
                        ', got ' + JSON.stringify(actual) + ')'));
  if (!ok) failures++;
}
function assert(label, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label);
  if (!cond) failures++;
}
function assertClose(label, actual, expected, epsilon) {
  const eps = epsilon == null ? 0.01 : epsilon;
  const ok = Math.abs(actual - expected) <= eps;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              (ok ? '' : '  (expected ~' + expected + ' ±' + eps +
                        ', got ' + actual + ')'));
  if (!ok) failures++;
}

// ------------------------------------------------------------
// hexToRgb / rgbToHex
// ------------------------------------------------------------
assertEq('hex #000',      B.hexToRgb('#000'),    { r: 0, g: 0, b: 0 });
assertEq('hex #FFFFFF',   B.hexToRgb('#FFFFFF'), { r: 255, g: 255, b: 255 });
assertEq('hex lowercase', B.hexToRgb('#ff00aa'), { r: 255, g: 0, b: 170 });
assertEq('hex no #',      B.hexToRgb('1F4E5B'),  { r: 31, g: 78, b: 91 });
assertEq('hex bad input', B.hexToRgb('nope'),    null);

assertEq('rgbToHex(0,0,0)',   B.rgbToHex(0, 0, 0),   '#000000');
assertEq('rgbToHex rounding', B.rgbToHex(31.4, 78.2, 91), '#1f4e5b');
assertEq('rgbToHex clamps',   B.rgbToHex(300, -5, 128),   '#ff0080');

// ------------------------------------------------------------
// Canonical WCAG contrast fixtures
// ------------------------------------------------------------
assertClose('black-on-white = 21', B.contrastRatio('#000000', '#FFFFFF'), 21, 0.01);
assertClose('#767676 on white ≈ 4.54', B.contrastRatio('#767676', '#FFFFFF'), 4.54, 0.03);
assertClose('white-on-white = 1',   B.contrastRatio('#FFFFFF', '#FFFFFF'), 1, 0.01);
assertClose('same-color = 1',       B.contrastRatio('#1F4E5B', '#1F4E5B'), 1, 0.01);
// Order-invariant
const fwd = B.contrastRatio('#112233', '#DDEEFF');
const rev = B.contrastRatio('#DDEEFF', '#112233');
assertClose('order-invariant',     fwd, rev, 0.0001);
// Muntin site palette
assertClose('site --teal on --cream ≈ 8.55', B.contrastRatio('#1F4E5B', '#FAF7F2'), 8.55, 0.05);
assertClose('site --ink on --cream ≈ 16.95', B.contrastRatio('#14161A', '#FAF7F2'), 16.95, 0.05);

// ------------------------------------------------------------
// gradeContrast thresholds
// ------------------------------------------------------------
assertEq('grade 21 → AAA',      B.gradeContrast(21),    'AAA');
assertEq('grade 7 → AAA',       B.gradeContrast(7.0),   'AAA');
assertEq('grade 6.99 → AA',     B.gradeContrast(6.99),  'AA');
assertEq('grade 4.5 → AA',      B.gradeContrast(4.5),   'AA');
assertEq('grade 4.49 → AA-lg',  B.gradeContrast(4.49),  'AA-large');
assertEq('grade 3 → AA-lg',     B.gradeContrast(3.0),   'AA-large');
assertEq('grade 2.99 → fail',   B.gradeContrast(2.99),  'fail');
assertEq('grade 1 → fail',      B.gradeContrast(1.0),   'fail');
assertEq('grade NaN → fail',    B.gradeContrast(NaN),   'fail');

// Band sweep — every grade must be in the fixed enum.
{
  const seen = new Set();
  for (let r = 0; r <= 25; r += 0.1) seen.add(B.gradeContrast(r));
  for (const g of seen) {
    if (!B.CONTRAST_GRADES.includes(g)) {
      console.log('FAIL  gradeContrast returned non-enum: ' + JSON.stringify(g));
      failures++;
    }
  }
  console.log('PASS  gradeContrast sweep (' + seen.size + ' distinct, all in enum)');
}

// ------------------------------------------------------------
// OKLab roundtrip — lossless for valid sRGB in-gamut
// ------------------------------------------------------------
function roundtrip(r, g, b) {
  const lab = B.rgbToOklab(r, g, b);
  const out = B.oklabToRgb(lab.L, lab.a, lab.b);
  return out;
}
assertEq('OKLab roundtrip (0,0,0)',     roundtrip(0, 0, 0),       { r: 0, g: 0, b: 0 });
assertEq('OKLab roundtrip (255,255,255)', roundtrip(255, 255, 255), { r: 255, g: 255, b: 255 });
assertEq('OKLab roundtrip (31,78,91)',  roundtrip(31, 78, 91),    { r: 31, g: 78, b: 91 });
assertEq('OKLab roundtrip (255,0,0)',   roundtrip(255, 0, 0),     { r: 255, g: 0, b: 0 });
assertEq('OKLab roundtrip (184,84,26)', roundtrip(184, 84, 26),   { r: 184, g: 84, b: 26 });

// OKLab distance — same color = 0; different = positive
{
  const a = B.rgbToOklab(255, 0, 0);
  const b = B.rgbToOklab(255, 0, 0);
  const c = B.rgbToOklab(0, 255, 0);
  assertEq('OKLab distance same color = 0', B.oklabDistance(a, b), 0);
  assert('OKLab distance different > 0',    B.oklabDistance(a, c) > 0);
}

// ------------------------------------------------------------
// deriveAccessiblePair
// ------------------------------------------------------------
{
  // Mid-gray on white fails AA; derived pair should pass.
  const mid = '#888888';
  const pair = B.deriveAccessiblePair(mid, '#FFFFFF');
  const ratio = B.contrastRatio(pair, '#FFFFFF');
  assert('accessible pair on white clears 4.5',    ratio >= 4.5);
  assert('accessible pair differs from original',  pair !== mid);
}
{
  // Already-accessible color stays unchanged.
  const ink = '#14161A';
  const pair = B.deriveAccessiblePair(ink, '#FAF7F2');
  assertEq('already-accessible color unchanged', pair, ink);
}
{
  // Against a dark ground, we walk L up (toward light).
  const teal = '#1F4E5B';
  const pair = B.deriveAccessiblePair(teal, '#14161A');
  const ratio = B.contrastRatio(pair, '#14161A');
  assert('pair vs ink ground clears 4.5', ratio >= 4.5);
}

// ------------------------------------------------------------
// K-means palette extraction — synthetic fixtures
// ------------------------------------------------------------

// Fixture 1: three pure colors in equal counts. Palette should
// surface all three.
{
  const pixels = [];
  for (let i = 0; i < 50; i++) pixels.push([255, 0,   0]);   // red
  for (let i = 0; i < 50; i++) pixels.push([0,   255, 0]);   // green
  for (let i = 0; i < 50; i++) pixels.push([0,   0,   255]); // blue
  const palette = B.extractPalette(pixels, { k: 3 });
  assertEq('3 colors → 3-entry palette', palette.length, 3);
  const hues = palette.map(p => B.bucketDominantHue(p.hex)).sort();
  assertEq('3 colors → red/green/blue families', hues, ['blue', 'green', 'red']);
  const totalShare = palette.reduce((s, p) => s + p.dominancePct, 0);
  assertClose('shares sum to 1', totalShare, 1, 0.001);
}

// Fixture 2: dominance-weighted. Red dominant, blue minor.
{
  const pixels = [];
  for (let i = 0; i < 180; i++) pixels.push([200, 30, 40]);  // near-red
  for (let i = 0; i < 20;  i++) pixels.push([40,  50, 200]); // blue
  const palette = B.extractPalette(pixels, { k: 2 });
  assertEq('dominance-weighted → 2 entries', palette.length, 2);
  assert('red family appears first', B.bucketDominantHue(palette[0].hex) === 'red');
  assert('red dominance > 0.8',      palette[0].dominancePct > 0.8);
  assert('blue family second',       B.bucketDominantHue(palette[1].hex) === 'blue');
}

// Fixture 3: near-duplicate colors merge.
{
  const pixels = [];
  for (let i = 0; i < 100; i++) pixels.push([200, 30, 40]);
  for (let i = 0; i < 100; i++) pixels.push([202, 32, 42]);  // near-duplicate
  const palette = B.extractPalette(pixels, { k: 3, mergeThreshold: 0.1 });
  assert('near-duplicates merge to 1–2 entries', palette.length <= 2);
}

// Fixture 4: empty input handled
{
  const palette = B.extractPalette([]);
  assertEq('empty input → empty palette', palette, []);
}

// Fixture 5: deterministic seeding — same pixels + same seed = same output
{
  const pixels = [];
  for (let i = 0; i < 60; i++) pixels.push([100, 80, 60]);
  for (let i = 0; i < 60; i++) pixels.push([60, 80, 100]);
  for (let i = 0; i < 60; i++) pixels.push([200, 200, 200]);
  const a = B.extractPalette(pixels, { k: 3, seed: 42 });
  const b = B.extractPalette(pixels, { k: 3, seed: 42 });
  assertEq('same seed → same output', a.map(p => p.hex), b.map(p => p.hex));
}

// ------------------------------------------------------------
// Privacy-critical: bucket enum purity + raw-string poison test
// ------------------------------------------------------------

// bucketDominantHue: sweep across full hue space
{
  const seen = new Set();
  for (let r = 0; r < 256; r += 32) {
    for (let g = 0; g < 256; g += 32) {
      for (let b = 0; b < 256; b += 32) {
        const hex = B.rgbToHex(r, g, b);
        const bucket = B.bucketDominantHue(hex);
        seen.add(bucket);
        if (!B.HUE_FAMILIES.includes(bucket)) {
          console.log('FAIL  bucketDominantHue non-enum at ' + hex + ': ' + JSON.stringify(bucket));
          failures++;
        }
      }
    }
  }
  console.log('PASS  bucketDominantHue sweep (' + seen.size + ' unique, all in enum)');
}

// Canonical hue families
assertEq('hue #FF0000 = red',    B.bucketDominantHue('#FF0000'), 'red');
assertEq('hue #00FF00 = green',  B.bucketDominantHue('#00FF00'), 'green');
assertEq('hue #0000FF = blue',   B.bucketDominantHue('#0000FF'), 'blue');
assertEq('hue #FFFF00 = yellow', B.bucketDominantHue('#FFFF00'), 'yellow');
assertEq('hue #808080 = achrom', B.bucketDominantHue('#808080'), 'achromatic');
assertEq('hue #000000 = achrom', B.bucketDominantHue('#000000'), 'achromatic');
assertEq('hue null → achrom',    B.bucketDominantHue(null),      'achromatic');

// bucketLogoSize
assertEq('size 50kb → lt100kb',       B.bucketLogoSize(50000),    'lt100kb');
assertEq('size 100000 boundary',      B.bucketLogoSize(100000),   'lt100kb');
assertEq('size 102400 → 100-500kb',   B.bucketLogoSize(102400),   '100-500kb');
assertEq('size 400kb → 100-500kb',    B.bucketLogoSize(400000),   '100-500kb');
assertEq('size 512000 → 500kb-2mb',   B.bucketLogoSize(512000),   '500kb-2mb');
assertEq('size 2MB → gt2mb',          B.bucketLogoSize(2097152),  'gt2mb');
assertEq('size neg → lt100kb',        B.bucketLogoSize(-100),     'lt100kb');
assertEq('size NaN → lt100kb',        B.bucketLogoSize(NaN),      'lt100kb');

// bucketFileType
assertEq('image/png → png',  B.bucketFileType('image/png'),         'png');
assertEq('image/jpeg → jpg', B.bucketFileType('image/jpeg'),        'jpg');
assertEq('image/webp → webp',B.bucketFileType('image/webp'),        'webp');
assertEq('image/svg+xml → svg', B.bucketFileType('image/svg+xml'),  'svg');
assertEq('gif → other',      B.bucketFileType('image/gif'),         'other');
assertEq('empty → other',    B.bucketFileType(''),                  'other');

// Poison-string tests — no raw input may leak through any bucket.
{
  const poison = 'SECRET_LOGO_FILENAME_31.42';
  const b1 = B.bucketDominantHue(poison);
  const b2 = B.bucketLogoSize(poison);
  const b3 = B.bucketFileType(poison + '/png');
  assert('no "SECRET" leak from bucketDominantHue', ('' + b1).indexOf('SECRET') === -1);
  assert('no "SECRET" leak from bucketLogoSize',    ('' + b2).indexOf('SECRET') === -1);
  assert('no "SECRET" leak from bucketFileType',    ('' + b3).indexOf('SECRET') === -1);
}

// ------------------------------------------------------------
// Summary
// ------------------------------------------------------------
if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll tests passed.');
