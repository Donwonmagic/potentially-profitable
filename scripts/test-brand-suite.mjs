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

// Fixture 6: single-color input — palette has exactly one entry, no crash.
{
  const pixels = [];
  for (let i = 0; i < 80; i++) pixels.push([31, 78, 91]);
  const palette = B.extractPalette(pixels, { k: 5 });
  assert('single-color → 1 palette entry', palette.length === 1);
  assertClose('single-color dominance = 1', palette[0].dominancePct, 1, 0.001);
}

// Fixture 7: near-monochrome (L-only variation). All pixels share hue+chroma;
// k-means should not crash and should return a valid palette.
{
  const pixels = [];
  for (let i = 0; i < 50; i++) pixels.push([200, 200, 200]);
  for (let i = 0; i < 50; i++) pixels.push([120, 120, 120]);
  for (let i = 0; i < 50; i++) pixels.push([40,  40,  40 ]);
  const palette = B.extractPalette(pixels, { k: 3 });
  assert('near-monochrome → at least 1 entry', palette.length >= 1);
  for (const entry of palette) {
    assertEq('mono entry is achromatic', B.bucketDominantHue(entry.hex), 'achromatic');
  }
}

// Fixture 8: saturated complementary pair (red + cyan).
{
  const pixels = [];
  for (let i = 0; i < 100; i++) pixels.push([220, 30, 30]);
  for (let i = 0; i < 100; i++) pixels.push([30, 220, 220]);
  const palette = B.extractPalette(pixels, { k: 2 });
  assertEq('complementary pair → 2 entries', palette.length, 2);
  const fams = palette.map(p => B.bucketDominantHue(p.hex)).sort();
  assertEq('complementary families = cyan + red', fams, ['cyan', 'red']);
}

// Fixture 9: high-entropy (random-ish) input — must converge without throwing.
{
  const pixels = [];
  let seed = 7;
  function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  for (let i = 0; i < 400; i++) {
    pixels.push([Math.floor(rand() * 256), Math.floor(rand() * 256), Math.floor(rand() * 256)]);
  }
  const palette = B.extractPalette(pixels, { k: 5 });
  assert('high-entropy → between 1 and 5 entries', palette.length >= 1 && palette.length <= 5);
  const sum = palette.reduce((s, p) => s + p.dominancePct, 0);
  assertClose('high-entropy shares sum to 1', sum, 1, 0.001);
}

// Fixture 10: k clamping. Worker accepts k=0 or k=99; extractPalette must
// clamp to [2,8]. Asking for k=1 with 2 colors should still produce a sane
// palette (the implementation clamps k to a min of 2 — that's the contract).
{
  const pixels = [];
  for (let i = 0; i < 30; i++) pixels.push([255, 0, 0]);
  for (let i = 0; i < 30; i++) pixels.push([0, 0, 255]);
  const wide = B.extractPalette(pixels, { k: 99 });
  assert('k=99 clamps to <=8', wide.length <= 8);
  const tight = B.extractPalette(pixels, { k: 0 });
  assert('k=0 still produces >=1 entry', tight.length >= 1);
}

// Fixture 11: deriveAccessiblePair on a color already over the target —
// returns the input unchanged. (Already covered above for ink-on-cream;
// re-check with an arbitrary mid-light surface.)
{
  const pair = B.deriveAccessiblePair('#000000', '#FFFFFF');
  assertEq('already-AAA pair unchanged', pair, '#000000');
}

// Fixture 12: deriveAccessiblePair gamut clamp — pure saturated yellow on
// cream cannot reach 4.5:1 along pure L. Must still clear the target by
// some path (chroma reduction or fallback to ink), never return an off-
// brand muddy color silently.
{
  const yellow = '#FFD400';
  const pair = B.deriveAccessiblePair(yellow, '#FAF7F2');
  const ratio = B.contrastRatio(pair, '#FAF7F2');
  assert('saturated yellow on cream clears 4.5 after derivation', ratio >= 4.5);
}

// ------------------------------------------------------------
// Role assignment — Phase C §2.1
// ------------------------------------------------------------
{
  // A black-heavy logo with a saturated red accent. Dominance order is
  // [black, red, white]; role order should put RED first (Primary) since
  // it's the most chromatic, NOT black.
  const palette = [
    { hex: '#101010', dominancePct: 0.65 },  // black, achromatic
    { hex: '#D03A2C', dominancePct: 0.25 },  // red, chromatic
    { hex: '#F5F5F5', dominancePct: 0.10 }   // white, achromatic
  ];
  const result = B.assignRoles(palette);
  assertEq('role assignment: red beats black for Primary',
           result.entries[0].hex, '#D03A2C');
  assertEq('role assignment: Primary label',
           result.entries[0].role, 'Primary');
  // The achromatic with higher dominance should land as the Neutral.
  const neutralEntry = result.entries.find(e => e.hex === '#101010');
  assert('role assignment: black appears in roled output', !!neutralEntry);
  // One chromatic anchor + two achromatic neutrals is monochromatic-in-
  // spirit per the relaxed §A.5 rule — Workshop should help fill out a
  // single-anchor palette.
  assertEq('role assignment: mono flag true (single chromatic + neutrals)',
           result.monochromatic, true);
}

{
  // Two chromatic colours of comparable share + one neutral. NOT mono —
  // the secondary chromatic is well above the 5% threshold so the rule
  // recognises this as a real two-colour brand system, not a single
  // anchor that needs the Workshop to fill out.
  const palette = [
    { hex: '#1F4E5B', dominancePct: 0.50 },   // teal — chromatic
    { hex: '#B8541A', dominancePct: 0.30 },   // rust — chromatic, comparable share
    { hex: '#F5F5F5', dominancePct: 0.20 }    // white — achromatic
  ];
  const result = B.assignRoles(palette);
  assertEq('role assignment: mono flag false (two real chromatic colours)',
           result.monochromatic, false);
}

{
  // Near-mono: 92% teal + 3% rust + 5% cream — top chromatic ≥ 0.85 AND
  // second chromatic ≤ 0.05, so the §A.5 rule fires. The 3 % accent
  // can't carry a brand system on its own.
  const palette = [
    { hex: '#1F4E5B', dominancePct: 0.92 },   // teal
    { hex: '#B8541A', dominancePct: 0.03 },   // tiny rust
    { hex: '#F3EEE3', dominancePct: 0.05 }    // cream — achromatic
  ];
  const result = B.assignRoles(palette);
  assertEq('role assignment: mono flag true (one dominant + tiny accent)',
           result.monochromatic, true);
}

{
  // Muntin post-fix: 88% teal + 6% rust + 6% ink. Two chromatic colours
  // (teal + rust) — second chromatic is 6 % > 5 %, so NOT mono. Muntin
  // ships with a real accent the Workshop should not erase.
  const palette = [
    { hex: '#1F4E5B', dominancePct: 0.88 },   // teal
    { hex: '#B8541A', dominancePct: 0.06 },   // rust
    { hex: '#1A1612', dominancePct: 0.06 }    // ink — achromatic
  ];
  const result = B.assignRoles(palette);
  assertEq('role assignment: Muntin post-fix is NOT mono (real accent at 6%)',
           result.monochromatic, false);
}

{
  // Monochromatic logo — three grays. assignRoles should set the flag.
  const palette = [
    { hex: '#202020', dominancePct: 0.5 },
    { hex: '#909090', dominancePct: 0.3 },
    { hex: '#F0F0F0', dominancePct: 0.2 }
  ];
  const result = B.assignRoles(palette);
  assertEq('monochromatic flag true when no chroma', result.monochromatic, true);
  assert('monochromatic still produces entries', result.entries.length >= 1);
}

{
  // Hue-distance secondary pick. Primary red (~0°) + cyan (~180°) +
  // pink (~5°). Secondary should be cyan, NOT pink, because pink is
  // too close in hue to the primary.
  const palette = [
    { hex: '#D03A2C', dominancePct: 0.4 },  // red ~ 5°
    { hex: '#E89890', dominancePct: 0.3 },  // soft pink, hue near red
    { hex: '#3AC8D0', dominancePct: 0.3 }   // cyan ~ 180°
  ];
  const result = B.assignRoles(palette);
  assertEq('Primary is the most chromatic red', result.entries[0].hex, '#D03A2C');
  // Secondary should be cyan (hue-distant), not the soft pink.
  assertEq('Secondary is hue-distant cyan, not near-hue pink',
           result.entries[1].hex, '#3AC8D0');
}

{
  // Spanish role names propagate when roleNames passed.
  const palette = [{ hex: '#1F4E5B', dominancePct: 1 }];
  const result = B.assignRoles(palette, { roleNames: ['Primario', 'Secundario', 'Acento 1', 'Acento 2', 'Neutro'] });
  assertEq('localized role label', result.entries[0].role, 'Primario');
}

// ------------------------------------------------------------
// Pairwise similarity — Phase C §2.2
// ------------------------------------------------------------
{
  const palette = [
    { hex: '#1F4E5B', dominancePct: 0.5 },  // teal
    { hex: '#205060', dominancePct: 0.3 },  // near-duplicate teal
    { hex: '#B8541A', dominancePct: 0.2 }   // rust
  ];
  const sims = B.paletteSimilarities(palette);
  assert('similar pair flagged', sims.some(p => (p.a === 0 && p.b === 1) || (p.a === 1 && p.b === 0)));
  assert('rust not flagged similar to teals', !sims.some(p => p.a === 2 || p.b === 2));
}
{
  // No similarity below threshold.
  const sims = B.paletteSimilarities([
    { hex: '#FF0000', dominancePct: 0.5 },
    { hex: '#00FF00', dominancePct: 0.5 }
  ]);
  assertEq('distinct colors → no similarity flag', sims.length, 0);
}

{
  // §A.4 dominance floor — a 0.5%-share noise cluster sitting next to a
  // 50%-share brand colour should NOT generate a "visually similar"
  // warning. Default floor 3 %; below that the entry is k-means residue
  // and warning the user about it is noise.
  const palette = [
    { hex: '#1F4E5B', dominancePct: 0.50 },
    { hex: '#1F4E5C', dominancePct: 0.005 }   // sub-threshold near-duplicate
  ];
  const sims = B.paletteSimilarities(palette);
  assertEq('sub-3% near-duplicate suppressed by dominance floor', sims.length, 0);

  // Pass floor = 0 explicitly and the same pair IS flagged — confirms
  // the suppression is the floor, not the distance threshold.
  const simsAllPairs = B.paletteSimilarities(palette, 0.12, { dominanceFloor: 0 });
  assertEq('floor=0 → tiny near-duplicate IS flagged', simsAllPairs.length, 1);
}

// ------------------------------------------------------------
// Robustness pass §A.1 — AA-halo prune in bsExtractPalette
// ------------------------------------------------------------
{
  // Synthetic Muntin sample at DOWNSAMPLE=200 + 8-neighbour erosion:
  // ~88% teal, ~6% rust, ~6% near-black, with 30 AA-bridge pixels
  // sprinkled along the cream→teal OKLab line. WITH backgroundLab
  // the bridge clusters are pruned; WITHOUT it they survive as 1-3
  // gray-blue noise clusters. This is the regression-lock fixture
  // for the flagship demo.
  const cream = [243, 238, 227];
  const teal  = [31, 78, 91];
  const rust  = [184, 84, 26];
  const dark  = [26, 22, 18];
  function blend(a, b, t) {
    return [
      Math.round(a[0]*(1-t)+b[0]*t),
      Math.round(a[1]*(1-t)+b[1]*t),
      Math.round(a[2]*(1-t)+b[2]*t)
    ];
  }
  const pixels = [];
  for (let i = 0; i < 700; i++) pixels.push(teal);
  for (let i = 0; i < 60;  i++) pixels.push(rust);
  for (let i = 0; i < 60;  i++) pixels.push(dark);
  for (let i = 0; i < 400; i++) pixels.push(blend(teal, cream, (i % 9) * 0.1 + 0.1));

  const bgLab = B.rgbToOklab(243, 238, 227);
  const palette = B.extractPalette(pixels, { k: 5, backgroundLab: bgLab });
  // Top entry must be teal-shaped — first two RGB channels in (15..50, 65..95)
  // (k-means centroid drifts within a couple of units across the OKLab→RGB
  // round-trip, so we assert a band rather than an exact hex).
  const topRgb = (function(hex){
    return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
  })(palette[0].hex);
  assert('Muntin: top entry is teal',
         topRgb[0] >= 15 && topRgb[0] <= 55 && topRgb[1] >= 60 && topRgb[1] <= 100);
  assert('Muntin: top dominance ≥ 75%', palette[0].dominancePct >= 0.75);
  // Rust must appear within 4 RGB units of #B8541A
  const hasRust = palette.some(p => {
    const r = parseInt(p.hex.slice(1,3),16);
    const g = parseInt(p.hex.slice(3,5),16);
    const b = parseInt(p.hex.slice(5,7),16);
    return Math.abs(r-184)<=4 && Math.abs(g-84)<=4 && Math.abs(b-26)<=4;
  });
  assert('Muntin: rust accent surfaces', hasRust);
  // Shares sum to 1
  const sum = palette.reduce((s, p) => s + p.dominancePct, 0);
  assertClose('Muntin: shares sum to 1', sum, 1, 0.001);
  // No 0% entries — the dominance floor + AA-halo prune should ensure all entries are real
  assert('Muntin: no 0%-share entries',
         palette.every(p => p.dominancePct >= 0.005));

  // Same input WITHOUT backgroundLab — AA-halo prune skipped, gradient
  // clusters survive. Confirms the prune is what's doing the cleanup.
  const naivePalette = B.extractPalette(pixels, { k: 5 });
  // Naive should produce more gray-blue intermediate clusters than the
  // pruned version. Top entry's dominance is markedly lower because the
  // gradient pixels split into separate clusters instead of being pruned.
  assert('without bgLab: top dominance is lower (gradient clusters survive)',
         naivePalette[0].dominancePct < palette[0].dominancePct);
}

{
  // §A.1 conjunct (1) — complementary palette protection. Two brand
  // colours with comparable dominance + a midpoint cluster between
  // them. The midpoint is NOT AA-halo because no host has 5× its
  // dominance. Must survive.
  const teal     = [31, 78, 91];
  const rust     = [184, 84, 26];
  function midpoint(a, b) {
    return [Math.round((a[0]+b[0])/2), Math.round((a[1]+b[1])/2), Math.round((a[2]+b[2])/2)];
  }
  const pixels = [];
  for (let i = 0; i < 400; i++) pixels.push(teal);   // 40 %
  for (let i = 0; i < 300; i++) pixels.push(rust);   // 30 %
  for (let i = 0; i < 300; i++) pixels.push(midpoint(teal, rust));   // 30 %
  // No bg-stripping happens here (no bg colour in pixels), but we still
  // pass a bgLab to exercise the prune logic.
  const bgLab = B.rgbToOklab(243, 238, 227);
  const palette = B.extractPalette(pixels, { k: 5, backgroundLab: bgLab });
  // All three input colours should survive — none should be pruned as
  // AA-halo because no host has 5× the others' dominance.
  assert('complementary palette: midpoint NOT pruned (≥3 surviving entries)',
         palette.length >= 3);
}

// ------------------------------------------------------------
// Robustness pass §B.3 — bsDetectBackgroundColorPivot
// ------------------------------------------------------------
{
  // Full-bleed logo: a logo where the foreground colour reaches the
  // edges, so bsDetectBackgroundColor (edge-only) returns null. The
  // pivot fallback looks at the whole sample and finds a dominant
  // colour, validating against the edge sample.
  const cream = [243, 238, 227];
  const teal  = [31, 78, 91];
  // 80% cream, 20% teal — teal dominates the visual weight in some
  // regions but cream is the larger share.
  const all = [];
  for (let i = 0; i < 800; i++) all.push(cream);
  for (let i = 0; i < 200; i++) all.push(teal);
  // Edge sample includes both colours (some teal at the edges — that's
  // the "full-bleed" condition).
  const edges = [];
  for (let i = 0; i < 30; i++) edges.push(cream);
  for (let i = 0; i < 30; i++) edges.push(teal);

  // Edge-only detector should fail: edges are split 50/50, no clear
  // dominant.
  const edgeOnly = B.detectBackgroundColor(edges);
  assertEq('edge-only detector: 50/50 edge split returns null', edgeOnly, null);

  // Pivot fallback should succeed and return cream at confidence 0.7.
  const pivot = B.detectBackgroundColorPivot(all, edges);
  assert('pivot fallback finds cream', pivot && pivot.hex.toLowerCase() === '#f3eee3');
  assertEq('pivot fallback confidence', pivot.confidence, 0.70);
}

{
  // Pivot guards against centre-of-frame bullseye. Dominant colour is
  // teal but it never appears at the edges → must return null.
  const cream = [243, 238, 227];
  const teal  = [31, 78, 91];
  const all = [];
  for (let i = 0; i < 200; i++) all.push(cream);
  for (let i = 0; i < 800; i++) all.push(teal);
  const edges = [];
  for (let i = 0; i < 60; i++) edges.push(cream);  // edges all cream
  const pivot = B.detectBackgroundColorPivot(all, edges);
  assertEq('pivot rejects centre-of-frame bullseye (not seen at edge)',
           pivot, null);
}

// ------------------------------------------------------------
// Color-blindness simulation — Phase C §2.4
// ------------------------------------------------------------
assertEq('simulate normal returns input', B.simulateColorBlindness('#FF0000', 'normal'), '#FF0000');
{
  // Each transform must produce a valid hex and differ from the input
  // for a saturated red.
  for (const type of ['protanopia', 'deuteranopia', 'tritanopia']) {
    const out = B.simulateColorBlindness('#FF0000', type);
    assert('simulate ' + type + ' returns valid 7-char hex',
           /^#[0-9a-f]{6}$/i.test(out));
    assert('simulate ' + type + ' shifts saturated red',
           out.toLowerCase() !== '#ff0000');
  }
}
{
  // Black and white are confusion-line invariants. Both should round-
  // trip cleanly through every projection.
  for (const type of ['protanopia', 'deuteranopia', 'tritanopia']) {
    assertEq('simulate ' + type + ' on black', B.simulateColorBlindness('#000000', type), '#000000');
    const w = B.simulateColorBlindness('#FFFFFF', type);
    assert('simulate ' + type + ' on white stays near white', w.toLowerCase() === '#ffffff');
  }
}
{
  // CB_TYPES enum exposed and includes 'normal'.
  assert('CB_TYPES exposes normal', B.CB_TYPES.includes('normal'));
  assert('CB_TYPES exposes deuteranopia', B.CB_TYPES.includes('deuteranopia'));
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
