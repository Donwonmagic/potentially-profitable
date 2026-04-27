/**
 * Brand Suite — color math + palette extraction.
 *
 * Loaded as a classic script in ./index.html (EN + ES). Also Node-
 * importable for unit tests via scripts/test-brand-suite.mjs. Dual-
 * export pattern matches margin-math.js + gbp-grader.js.
 *
 * Privacy invariants (tested in scripts/test-brand-suite.mjs):
 *   1. Every exported function is pure — no fetch, no localStorage,
 *      no cookies, no side effects beyond attaching to window.BS.
 *   2. Bucket helpers (bsBucketDominantHue, bsBucketLogoSize, etc.)
 *      return values only from fixed enumerated sets. No raw input
 *      value (hex, bytes, filename) is ever reflected.
 *
 * Color-science references:
 *   - WCAG 2.1 contrast formula: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 *   - OKLab (Björn Ottosson, 2020): https://bottosson.github.io/posts/oklab/
 *   - k-means++ seeding (Arthur & Vassilvitskii, 2007)
 */

// ------------------------------------------------------------
// Hex / RGB format helpers
// ------------------------------------------------------------

function bsHexToRgb(hex) {
  // Accept "#rgb", "#rrggbb", "rgb", "rrggbb". Returns {r,g,b} in 0..255.
  var h = String(hex || '').replace(/^#/, '').trim().toLowerCase();
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (!/^[0-9a-f]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
}

function bsRgbToHex(r, g, b) {
  function c(v) {
    var n = Math.max(0, Math.min(255, Math.round(v)));
    var s = n.toString(16);
    return s.length < 2 ? '0' + s : s;
  }
  return '#' + c(r) + c(g) + c(b);
}

// ------------------------------------------------------------
// WCAG 2.1 contrast
// ------------------------------------------------------------

function bsSrgbToLinearChannel(c8) {
  // Input: channel in 0..255. Output: linear 0..1. Per WCAG 2.1.
  var c = c8 / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function bsRelativeLuminance(r, g, b) {
  var rl = bsSrgbToLinearChannel(r);
  var gl = bsSrgbToLinearChannel(g);
  var bl = bsSrgbToLinearChannel(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function bsContrastRatio(hexA, hexB) {
  var A = bsHexToRgb(hexA);
  var B = bsHexToRgb(hexB);
  if (!A || !B) return 1;
  var La = bsRelativeLuminance(A.r, A.g, A.b);
  var Lb = bsRelativeLuminance(B.r, B.g, B.b);
  var lighter = Math.max(La, Lb);
  var darker  = Math.min(La, Lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG 2.1 grading:
//   AAA        >= 7    (normal text)
//   AA         >= 4.5  (normal text; AA-large at >= 3)
//   AA-large   >= 3    (18pt+ or 14pt bold only)
//   fail       <  3
// Returns one of four fixed strings — the enum that bucket-purity
// tests lock.
var BS_CONTRAST_GRADES = ['AAA', 'AA', 'AA-large', 'fail'];

function bsGradeContrast(ratio) {
  var r = typeof ratio === 'number' && isFinite(ratio) ? ratio : 0;
  if (r >= 7)   return 'AAA';
  if (r >= 4.5) return 'AA';
  if (r >= 3)   return 'AA-large';
  return 'fail';
}

// ------------------------------------------------------------
// OKLab conversion (Björn Ottosson's formulas)
//
// OKLab is perceptually uniform — shifting L in OKLab space
// preserves the feel of hue + chroma while adjusting brightness,
// which is what the accessible-pair derivation needs. K-means in
// OKLab also produces more natural clusters than k-means in RGB.
// ------------------------------------------------------------

function bsRgbToOklab(r, g, b) {
  // sRGB → linear
  var rl = bsSrgbToLinearChannel(r);
  var gl = bsSrgbToLinearChannel(g);
  var bl = bsSrgbToLinearChannel(b);
  // Linear RGB → LMS
  var l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  var m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  var s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;
  // Cube root
  var l_ = Math.cbrt(l);
  var m_ = Math.cbrt(m);
  var s_ = Math.cbrt(s);
  // LMS′ → OKLab
  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  };
}

function bsOklabToRgb(L, A, B) {
  // OKLab → LMS′
  var l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  var m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  var s_ = L - 0.0894841775 * A - 1.2914855480 * B;
  // Cube → LMS
  var l = l_ * l_ * l_;
  var m = m_ * m_ * m_;
  var s = s_ * s_ * s_;
  // LMS → linear RGB (inverse matrix)
  var rl =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  var gl = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  var bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  // Linear → sRGB (inverse gamma)
  function linToSrgb(c) {
    var v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(v * 255)));
  }
  return { r: linToSrgb(rl), g: linToSrgb(gl), b: linToSrgb(bl) };
}

function bsOklabDistance(a, b) {
  // Simple Euclidean in OKLab; close enough to ΔE for our clustering.
  var dL = a.L - b.L;
  var dA = a.a - b.a;
  var dB = a.b - b.b;
  return Math.sqrt(dL * dL + dA * dA + dB * dB);
}

// ------------------------------------------------------------
// Accessible-pair derivation
//
// Given a brand color and a ground (cream or ink), walk OKLab L
// up or down until contrast clears 4.5:1. Preserves A + B so hue
// and chroma feel stay intact.
// ------------------------------------------------------------

// Site brand neutrals — used as the *last-resort* fallback when no
// in-gamut adjustment of the source color reaches the contrast target.
// Hard-coding these keeps the JS dependency-free; they match
// var(--ink) and var(--cream) in assets/site.css.
var BS_INK   = '#14161A';
var BS_CREAM = '#FAF7F2';

function bsDeriveAccessiblePair(hex, groundHex, targetRatio) {
  var tgt = typeof targetRatio === 'number' ? targetRatio : 4.5;
  var rgb = bsHexToRgb(hex);
  var ground = bsHexToRgb(groundHex);
  if (!rgb || !ground) return hex;
  var current = bsContrastRatio(hex, groundHex);
  if (current >= tgt) return hex;

  var lab = bsRgbToOklab(rgb.r, rgb.g, rgb.b);
  var groundLab = bsRgbToOklab(ground.r, ground.g, ground.b);
  // Walk AWAY from the ground's L — if ground is light, go darker; if dark, go lighter.
  var step = groundLab.L > 0.5 ? -0.02 : 0.02;

  // First pass: walk L with original chroma. If a saturated source
  // can't reach the target along pure L (out-of-gamut clamping
  // produces a muddy shade), try again with progressively reduced
  // chroma so we stay in the source's hue family.
  var chromaScales = [1.0, 0.8, 0.6, 0.4, 0.2];
  for (var s = 0; s < chromaScales.length; s++) {
    var scale = chromaScales[s];
    var L = lab.L;
    for (var i = 0; i < 50; i++) {
      L += step;
      if (L < 0 || L > 1) break;
      var a2 = lab.a * scale;
      var b2 = lab.b * scale;
      var adjusted = bsOklabToRgb(L, a2, b2);
      var candidateHex = bsRgbToHex(adjusted.r, adjusted.g, adjusted.b);
      if (bsContrastRatio(candidateHex, groundHex) >= tgt) return candidateHex;
    }
  }
  // Last resort: fall back to whichever site neutral (ink / cream)
  // contrasts more strongly with the ground. Never invent an
  // off-brand muddy color.
  var inkR   = bsContrastRatio(BS_INK,   groundHex);
  var creamR = bsContrastRatio(BS_CREAM, groundHex);
  return inkR >= creamR ? BS_INK : BS_CREAM;
}

// ------------------------------------------------------------
// Role assignment
//
// Earlier versions sorted by raw dominance and labeled the most
// abundant cluster "Primary". A black-heavy or white-grounded logo
// would name the achromatic background the Primary — useless.
// Roles should be earned by chromatic intent, not pixel count.
//
// Algorithm:
//   1. Mark each cluster achromatic if OKLab chroma < CHROMA_FLOOR.
//   2. Among non-achromatic clusters, sort by chroma desc and pick:
//      Primary  = most chromatic
//      Secondary= next most chromatic with min hue distance from Primary
//      Accents  = remaining chromatic in hue-distance order
//   3. Neutral = the achromatic cluster with highest dominance, or
//      whichever extreme (lightest/darkest) when no clear neutral.
//   4. Monochromatic fallback (no chromatic clusters): label by L
//      extremes ("Dark"/"Light"/"Mid").
//
// Returns the input array re-ordered with role + roleVar + tokenName
// fields attached, and a `monochromatic: bool` flag on the array.
// Pure (no globals); deterministic.
// ------------------------------------------------------------
var BS_ROLE_NAMES_EN  = ['Primary', 'Secondary', 'Accent 1', 'Accent 2', 'Neutral'];
var BS_ROLE_VARS      = ['--brand-primary', '--brand-secondary', '--brand-accent-1', '--brand-accent-2', '--brand-neutral'];
var BS_TOKEN_NAMES    = ['brand.primary', 'brand.secondary', 'brand.accent-1', 'brand.accent-2', 'brand.neutral'];

function bsClusterChroma(lab) {
  return Math.sqrt(lab.a * lab.a + lab.b * lab.b);
}

function bsHueAngleDeg(lab) {
  // Atan2 of OKLab a,b. Normalised to [0, 360).
  if (lab.a === 0 && lab.b === 0) return 0;
  var h = Math.atan2(lab.b, lab.a) * 180 / Math.PI;
  if (h < 0) h += 360;
  return h;
}

function bsHueDistance(h1, h2) {
  var d = Math.abs(h1 - h2);
  return d > 180 ? 360 - d : d;
}

function bsAssignRoles(palette, options) {
  options = options || {};
  var roleNames = options.roleNames || BS_ROLE_NAMES_EN;
  var chromaFloor = options.chromaFloor || 0.04;
  var minSecondaryHueDist = options.minSecondaryHueDist || 30;

  if (!palette || !palette.length) return { entries: [], monochromatic: false };

  // Annotate each entry with computed OKLab features.
  var annotated = palette.map(function(entry, idx) {
    var rgb = bsHexToRgb(entry.hex) || { r: 0, g: 0, b: 0 };
    var lab = bsRgbToOklab(rgb.r, rgb.g, rgb.b);
    return {
      hex: entry.hex,
      dominancePct: entry.dominancePct,
      _orig: idx,
      _lab: lab,
      _chroma: bsClusterChroma(lab),
      _hue: bsHueAngleDeg(lab),
      _achromatic: bsClusterChroma(lab) < chromaFloor
    };
  });

  var chromatic = annotated.filter(function(e){ return !e._achromatic; });
  var achromatic = annotated.filter(function(e){ return e._achromatic; });
  // Capture the truly-chromatic count BEFORE the mutating shift/splice
  // calls below — that's what determines the monochromatic flag.
  //
  // Mono in spirit, not just by-the-letter. Three triggers:
  //   1. No chromatic cluster at all (true greyscale).
  //   2. Exactly one chromatic cluster + at least one achromatic
  //      (single brand colour + grey lines / neutrals — the textbook
  //      single-anchor logo).
  //   3. One chromatic cluster dominates (≥ 85% share) AND every other
  //      chromatic cluster is tiny (≤ 5%). The 3 % accent that can't
  //      carry a brand system on its own — Workshop helps fill it out.
  // Note: `chromatic` is about to be sorted by chroma below, so use the
  // dominance-sorted view here for the threshold tests.
  var chromaticByDominance = chromatic.slice().sort(function(a, b){
    return (b.dominancePct || 0) - (a.dominancePct || 0);
  });
  var topChromaticDom    = chromaticByDominance[0] ? (chromaticByDominance[0].dominancePct || 0) : 0;
  var secondChromaticDom = chromaticByDominance[1] ? (chromaticByDominance[1].dominancePct || 0) : 0;
  var monochromatic =
       (chromatic.length === 0 && annotated.length > 0)
    || (chromatic.length === 1 && annotated.length > 1)
    || (chromatic.length >= 1 && topChromaticDom >= 0.85 && secondChromaticDom <= 0.05);

  // Primary = most-chromatic non-achromatic.
  // Secondary = next most-chromatic at min hue distance from Primary.
  // Accents = remaining chromatic, ordered by descending hue distance from Primary.
  var ordered = [];
  if (chromatic.length) {
    chromatic.sort(function(a, b){ return b._chroma - a._chroma; });
    var primary = chromatic.shift();
    ordered.push(primary);
    var secondary = null;
    for (var i = 0; i < chromatic.length; i++) {
      if (bsHueDistance(chromatic[i]._hue, primary._hue) >= minSecondaryHueDist) {
        secondary = chromatic.splice(i, 1)[0];
        break;
      }
    }
    if (!secondary && chromatic.length) secondary = chromatic.shift();
    if (secondary) ordered.push(secondary);
    chromatic.sort(function(a, b){
      return bsHueDistance(b._hue, primary._hue) - bsHueDistance(a._hue, primary._hue);
    });
    ordered = ordered.concat(chromatic);
  }

  // Neutral: pick the achromatic cluster with the highest dominance,
  // breaking ties toward the darker. If only one achromatic cluster
  // exists, take it. If none, fill with whichever remaining chromatic
  // has the lowest chroma (best surrogate).
  achromatic.sort(function(a, b){
    if (b.dominancePct !== a.dominancePct) return b.dominancePct - a.dominancePct;
    return a._lab.L - b._lab.L;
  });
  if (achromatic.length) {
    ordered.push(achromatic.shift());
    // Any leftover achromatics fill remaining slots after the primary chain.
    ordered = ordered.concat(achromatic);
  }

  // Truncate / pad to roleNames length and attach role labels.
  var out = ordered.slice(0, roleNames.length).map(function(entry, i) {
    return {
      hex: entry.hex,
      dominancePct: entry.dominancePct,
      role: roleNames[i] || ('Color ' + (i + 1)),
      roleVar: BS_ROLE_VARS[i] || ('--brand-color-' + (i + 1)),
      tokenName: BS_TOKEN_NAMES[i] || ('brand.color-' + (i + 1)),
      chroma: entry._chroma,
      hueDeg: entry._hue,
      achromatic: entry._achromatic
    };
  });
  return { entries: out, monochromatic: monochromatic };
}

// ------------------------------------------------------------
// Similarity flagging
//
// Two clusters that survive merge but are close in OKLab will read
// as "the same color" to a human eye even though contrast math
// gives them different hex values. Flag pairs within OKLab distance
// SIMILARITY_THRESHOLD so the UI can warn rather than silently
// presenting them as distinct roles.
// ------------------------------------------------------------
function bsPaletteSimilarities(palette, threshold, options) {
  var t = typeof threshold === 'number' ? threshold : 0.12;
  // Dominance floor — palette entries below this share are noise (k-means
  // residue, sub-1% accents that don't carry visual weight). Flagging them
  // as "similar to" anything else generates spurious warnings on near-zero
  // clusters that pollute the UI. Default 3% — meaningful brand colours
  // come back well above this; AA halos and k-means leftovers come back
  // well below it.
  var dominanceFloor = (options && typeof options.dominanceFloor === 'number')
    ? options.dominanceFloor
    : 0.03;
  var labs = palette.map(function(p){
    var rgb = bsHexToRgb(p.hex) || { r: 0, g: 0, b: 0 };
    return bsRgbToOklab(rgb.r, rgb.g, rgb.b);
  });
  var pairs = [];
  for (var i = 0; i < labs.length; i++) {
    if ((palette[i].dominancePct || 0) < dominanceFloor) continue;
    for (var j = i + 1; j < labs.length; j++) {
      if ((palette[j].dominancePct || 0) < dominanceFloor) continue;
      var d = bsOklabDistance(labs[i], labs[j]);
      if (d < t) pairs.push({ a: i, b: j, distance: d });
    }
  }
  return pairs;
}

// ------------------------------------------------------------
// Color-blindness simulation
//
// Brettel/Viénot/Mollon (1997) projection matrices applied in linear
// RGB. Each dichromacy projects the visible-color volume onto the
// confusion-line plane, collapsing the missing-cone dimension. The
// matrices below are the standard sRGB-space approximations widely
// cited in color-vision research; they're a perceptual preview, not
// a clinical simulation.
//
// Reference: Viénot, Brettel, Mollon (1999), "Digital video
// colourmaps for checking the legibility of displays by dichromats."
// ------------------------------------------------------------
var BS_CB_MATRICES = {
  protanopia: [
    [0.567, 0.433, 0.000],
    [0.558, 0.442, 0.000],
    [0.000, 0.242, 0.758]
  ],
  deuteranopia: [
    [0.625, 0.375, 0.000],
    [0.700, 0.300, 0.000],
    [0.000, 0.300, 0.700]
  ],
  tritanopia: [
    [0.950, 0.050, 0.000],
    [0.000, 0.433, 0.567],
    [0.000, 0.475, 0.525]
  ]
};
var BS_CB_TYPES = ['normal', 'protanopia', 'deuteranopia', 'tritanopia'];

function bsSimulateColorBlindness(hex, type) {
  if (!type || type === 'normal') return hex;
  var M = BS_CB_MATRICES[type];
  if (!M) return hex;
  var rgb = bsHexToRgb(hex);
  if (!rgb) return hex;
  // Apply in linear space so we don't get gamma-distortion on transforms.
  var rl = bsSrgbToLinearChannel(rgb.r);
  var gl = bsSrgbToLinearChannel(rgb.g);
  var bl = bsSrgbToLinearChannel(rgb.b);
  var nr = M[0][0] * rl + M[0][1] * gl + M[0][2] * bl;
  var ng = M[1][0] * rl + M[1][1] * gl + M[1][2] * bl;
  var nb = M[2][0] * rl + M[2][1] * gl + M[2][2] * bl;
  function linToSrgb(c){
    var v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(v * 255)));
  }
  return bsRgbToHex(linToSrgb(nr), linToSrgb(ng), linToSrgb(nb));
}

// ------------------------------------------------------------
// k-means palette extraction
//
// Input: array of [r,g,b] tuples (sampled pixels; alpha pre-filtered
// by the caller). The browser IIFE converts ImageData → this shape.
//
// Algorithm:
//   1. Convert all pixels to OKLab.
//   2. k-means++ seed to pick initial centers deterministically
//      (seeded via a simple LCG over a counter — reproducible
//      across runs on the same pixel input).
//   3. Iterate Lloyd's algorithm to convergence or maxIterations.
//   4. Merge centers with OKLab distance < mergeThreshold.
//   5. Return centers sorted by pixel share desc, as {hex, dominancePct}.
// ------------------------------------------------------------

// Deterministic pseudo-random — seeded LCG. Using for k-means++ so
// tests are repeatable. Not cryptographic.
function bsSeededRandom(seed) {
  var state = seed || 1;
  return function() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function bsExtractPalette(pixels, options) {
  options = options || {};
  var k = Math.max(2, Math.min(8, options.k || 5));
  var maxIterations = options.maxIterations || 8;
  var mergeThreshold = options.mergeThreshold || 0.05;
  var seed = options.seed || 1;

  if (!pixels || !pixels.length) return [];

  // Convert once to OKLab + keep the original RGB alongside.
  var points = new Array(pixels.length);
  for (var i = 0; i < pixels.length; i++) {
    var p = pixels[i];
    var lab = bsRgbToOklab(p[0], p[1], p[2]);
    points[i] = { lab: lab, rgb: [p[0], p[1], p[2]] };
  }

  // k-means++ seeding. First center random; each subsequent center
  // chosen with probability proportional to squared distance to nearest.
  var rand = bsSeededRandom(seed);
  var centers = [];
  centers.push(points[Math.floor(rand() * points.length)].lab);
  while (centers.length < k) {
    var dists = points.map(function(pt) {
      var minD = Infinity;
      for (var c = 0; c < centers.length; c++) {
        var d = bsOklabDistance(pt.lab, centers[c]);
        if (d < minD) minD = d;
      }
      return minD * minD;
    });
    var total = 0;
    for (var d = 0; d < dists.length; d++) total += dists[d];
    if (total === 0) break;
    var threshold = rand() * total;
    var acc = 0;
    for (var j = 0; j < dists.length; j++) {
      acc += dists[j];
      if (acc >= threshold) { centers.push(points[j].lab); break; }
    }
  }

  // Lloyd's iteration
  var assignments = new Array(points.length);
  for (var iter = 0; iter < maxIterations; iter++) {
    var changed = 0;
    for (var pi = 0; pi < points.length; pi++) {
      var nearest = 0;
      var nearestD = Infinity;
      for (var ci = 0; ci < centers.length; ci++) {
        var dd = bsOklabDistance(points[pi].lab, centers[ci]);
        if (dd < nearestD) { nearestD = dd; nearest = ci; }
      }
      if (assignments[pi] !== nearest) { changed++; assignments[pi] = nearest; }
    }
    // Recompute centers
    var sumsL = new Array(centers.length).fill(0);
    var sumsA = new Array(centers.length).fill(0);
    var sumsB = new Array(centers.length).fill(0);
    var counts = new Array(centers.length).fill(0);
    for (var ai = 0; ai < assignments.length; ai++) {
      var cluster = assignments[ai];
      sumsL[cluster] += points[ai].lab.L;
      sumsA[cluster] += points[ai].lab.a;
      sumsB[cluster] += points[ai].lab.b;
      counts[cluster]++;
    }
    for (var ci2 = 0; ci2 < centers.length; ci2++) {
      if (counts[ci2] > 0) {
        centers[ci2] = {
          L: sumsL[ci2] / counts[ci2],
          a: sumsA[ci2] / counts[ci2],
          b: sumsB[ci2] / counts[ci2]
        };
      }
    }
    if (changed === 0) break;
  }

  // Count share per cluster (final assignment)
  var clusterCounts = new Array(centers.length).fill(0);
  for (var ci3 = 0; ci3 < assignments.length; ci3++) {
    clusterCounts[assignments[ci3]]++;
  }

  // Merge near-duplicate centers (OKLab distance < mergeThreshold)
  for (var mi = 0; mi < centers.length; mi++) {
    if (clusterCounts[mi] === 0) continue;
    for (var mj = mi + 1; mj < centers.length; mj++) {
      if (clusterCounts[mj] === 0) continue;
      if (bsOklabDistance(centers[mi], centers[mj]) < mergeThreshold) {
        // Merge mj into mi
        clusterCounts[mi] += clusterCounts[mj];
        clusterCounts[mj] = 0;
      }
    }
  }

  // Build output sorted by dominance desc, dropping empties
  var total2 = 0;
  for (var co = 0; co < clusterCounts.length; co++) total2 += clusterCounts[co];
  var out = [];
  for (var ro = 0; ro < centers.length; ro++) {
    if (clusterCounts[ro] === 0) continue;
    var rgb = bsOklabToRgb(centers[ro].L, centers[ro].a, centers[ro].b);
    out.push({
      hex: bsRgbToHex(rgb.r, rgb.g, rgb.b),
      dominancePct: total2 > 0 ? clusterCounts[ro] / total2 : 0
    });
  }
  out.sort(function(a, b) { return b.dominancePct - a.dominancePct; });
  return out;
}

// ------------------------------------------------------------
// Plausible bucket helpers — enum-locked, privacy-critical
// ------------------------------------------------------------

// 12 hue families (30° slices) + achromatic. Enum locked.
// Bands are centered on the RGB primaries and secondaries: the
// cardinal hue angles (0, 60, 120, 180, 240, 300) each sit at a
// band's midpoint. sRGB #0000FF (H=240°) → "blue" (not "indigo"),
// which matches user intuition for a pure-blue logo.
var BS_HUE_FAMILIES = [
  'achromatic',
  'red', 'orange', 'yellow', 'warm-yellow',
  'green', 'teal', 'cyan', 'sky-blue',
  'blue', 'violet', 'magenta', 'rose'
];

function bsBucketDominantHue(hex) {
  var rgb = bsHexToRgb(hex);
  if (!rgb) return 'achromatic';
  // sRGB → HSL for hue classification; saturation threshold below
  // which we call it achromatic.
  var r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var l = (max + min) / 2;
  var d = max - min;
  if (d < 0.08) return 'achromatic';              // low chroma
  var s = d / (1 - Math.abs(2 * l - 1));
  if (s < 0.1) return 'achromatic';
  var h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = h * 60;
  if (h < 0) h += 360;
  // Band midpoints: red 0°, orange 30°, yellow 60°, warm-yellow 90°,
  // green 120°, teal 150°, cyan 180°, sky-blue 210°, blue 240°,
  // violet 270°, magenta 300°, rose 330°. Each 30° wide.
  var bands = [
    { name: 'red',          lo: 345, hi: 15  },
    { name: 'orange',       lo: 15,  hi: 45  },
    { name: 'yellow',       lo: 45,  hi: 75  },
    { name: 'warm-yellow',  lo: 75,  hi: 105 },
    { name: 'green',        lo: 105, hi: 135 },
    { name: 'teal',         lo: 135, hi: 165 },
    { name: 'cyan',         lo: 165, hi: 195 },
    { name: 'sky-blue',     lo: 195, hi: 225 },
    { name: 'blue',         lo: 225, hi: 255 },
    { name: 'violet',       lo: 255, hi: 285 },
    { name: 'magenta',      lo: 285, hi: 315 },
    { name: 'rose',         lo: 315, hi: 345 }
  ];
  for (var i = 0; i < bands.length; i++) {
    var band = bands[i];
    if (band.lo > band.hi) {
      if (h >= band.lo || h < band.hi) return band.name;
    } else {
      if (h >= band.lo && h < band.hi) return band.name;
    }
  }
  return 'red'; // unreachable
}

// Logo file-size buckets. Input is bytes. Enum-locked.
var BS_SIZE_BUCKETS = ['lt100kb', '100-500kb', '500kb-2mb', 'gt2mb'];

function bsBucketLogoSize(bytes) {
  var n = typeof bytes === 'number' && isFinite(bytes) && bytes >= 0 ? bytes : 0;
  if (n < 102400)    return 'lt100kb';        // < 100 KB
  if (n < 512000)    return '100-500kb';
  if (n < 2097152)   return '500kb-2mb';
  return 'gt2mb';
}

// File-type bucket. Enum-locked.
var BS_FILE_TYPES = ['png', 'jpg', 'webp', 'svg', 'other'];

function bsBucketFileType(mimeOrExt) {
  var s = String(mimeOrExt || '').toLowerCase();
  if (/png/.test(s))          return 'png';
  if (/jpe?g/.test(s))        return 'jpg';
  if (/webp/.test(s))         return 'webp';
  if (/svg/.test(s))          return 'svg';
  return 'other';
}

// ------------------------------------------------------------
// Dual export — browser window + Web Worker self + Node module.
// In a Web Worker `typeof window === 'undefined'` but `self` is the
// worker global scope; in the browser `self === window`; in Node
// neither exists and we take the module.exports branch. Attaching
// to `self` unifies the browser + worker paths.
// ------------------------------------------------------------

// ============================================================
// CMYK approximation — naive uncalibrated conversion useful for
// the Palette Sheet hand-off to a printer. Real CMYK depends on
// the ink profile, paper, and press; this gives a starting-point
// the printer can match against. Returns { c, m, y, k } as
// integers in [0, 100].
// ============================================================
function bsRgbToCmyk(r, g, b) {
  var rN = (r || 0) / 255;
  var gN = (g || 0) / 255;
  var bN = (b || 0) / 255;
  var k = 1 - Math.max(rN, gN, bN);
  if (k >= 0.999) return { c: 0, m: 0, y: 0, k: 100 };
  var c = (1 - rN - k) / (1 - k);
  var m = (1 - gN - k) / (1 - k);
  var y = (1 - bN - k) / (1 - k);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
}

// ============================================================
// Background detection + strip — fixes the single-colour-logo
// extraction case where the background gets clustered as a
// "Light Neutral" (e.g. white pulled from the canvas around a
// black wordmark). The page passes in the edge-band pixels
// separately; we find the dominant edge colour and exclude all
// pixels within OKLab distance 0.05 of it from the main sample.
// ============================================================

// Quantise an [r,g,b] triplet to a coarser grid so neighbouring
// edge pixels (anti-aliased white-vs-near-white) cluster together
// in the histogram. 24-step bins give 24^3 = 13,824 buckets — fine
// enough that distinct logo colours stay separate, coarse enough
// that aliased edges merge into one bucket.
function bsQuantiseRgb(r, g, b) {
  var q = function(v) { return Math.min(23, Math.floor(v / 11)); };
  return q(r) * 24 * 24 + q(g) * 24 + q(b);
}

// Given an array of edge pixels ([[r,g,b], ...]), find the
// dominant colour. Returns { hex, rgb: {r,g,b}, confidence } or
// null if no single colour reaches the validation threshold.
//
// validation: at least `threshold` (default 0.7) of edge pixels
// must lie within OKLab distance 0.05 of the dominant centroid.
function bsDetectBackgroundColor(edgePixels, options) {
  options = options || {};
  var threshold = options.threshold == null ? 0.7  : options.threshold;
  var radius    = options.radius    == null ? 0.05 : options.radius;
  if (!edgePixels || !edgePixels.length) return null;

  // Histogram over quantised RGB bins.
  var bins = Object.create(null);
  for (var i = 0; i < edgePixels.length; i++) {
    var p = edgePixels[i];
    if (!p || p.length < 3) continue;
    var key = bsQuantiseRgb(p[0], p[1], p[2]);
    if (!bins[key]) bins[key] = { count: 0, sumR: 0, sumG: 0, sumB: 0 };
    var bin = bins[key];
    bin.count++;
    bin.sumR += p[0]; bin.sumG += p[1]; bin.sumB += p[2];
  }

  // Find the most-populated bin and compute its centroid.
  var best = null;
  for (var k in bins) {
    if (!best || bins[k].count > best.count) best = bins[k];
  }
  if (!best) return null;
  var cr = Math.round(best.sumR / best.count);
  var cg = Math.round(best.sumG / best.count);
  var cb = Math.round(best.sumB / best.count);

  // Validate — count how many edge pixels lie within `radius`
  // OKLab distance of the centroid.
  var centroidLab = bsRgbToOklab(cr, cg, cb);
  var matched = 0;
  for (var j = 0; j < edgePixels.length; j++) {
    var q = edgePixels[j];
    if (!q || q.length < 3) continue;
    var qLab = bsRgbToOklab(q[0], q[1], q[2]);
    if (bsOklabDistance(centroidLab, qLab) <= radius) matched++;
  }
  var confidence = matched / edgePixels.length;
  if (confidence < threshold) return null;

  return {
    hex: bsRgbToHex(cr, cg, cb),
    rgb: { r: cr, g: cg, b: cb },
    confidence: confidence
  };
}

// Filter cluster pixels to exclude any within `radius` OKLab
// distance of the supplied background colour. Returns the
// remaining pixels (in the same [[r,g,b], ...] shape).
function bsStripBackground(pixels, backgroundRgb, options) {
  options = options || {};
  var radius = options.radius == null ? 0.05 : options.radius;
  if (!pixels || !pixels.length || !backgroundRgb) return pixels || [];
  var bgLab = bsRgbToOklab(backgroundRgb.r, backgroundRgb.g, backgroundRgb.b);
  var out = [];
  for (var i = 0; i < pixels.length; i++) {
    var p = pixels[i];
    if (!p || p.length < 3) continue;
    var pLab = bsRgbToOklab(p[0], p[1], p[2]);
    if (bsOklabDistance(bgLab, pLab) > radius) out.push(p);
  }
  return out;
}

// ============================================================
// Colour-harmony generators — produce candidate palettes from an
// anchor + ground in OKLab. All six return the same role-tagged
// shape `bsAssignRoles` produces, so downstream rendering is
// agnostic to whether the palette was extracted or generated.
// Each generator runs a gamut-clamp pass (out-of-sRGB results
// get chroma-reduced 20 % at a time until in gamut) and a WCAG
// contrast pass (every accent must hit ≥ 4.5:1 against ground;
// fallback shifts L away from ground until it does or clamps to
// site neutrals).
// ============================================================

// Convert OKLab → hex with gamut clamping. If the L+a+b point is
// out-of-sRGB, scales chroma down 20 % per iteration up to 5
// passes; if still out-of-gamut, clamps to the nearest in-gamut
// L=anchor point. Returns hex.
function bsOklabToHexClamped(L, a, b) {
  var aIn = a, bIn = b;
  for (var pass = 0; pass < 6; pass++) {
    var rgb = bsOklabToRgb(L, aIn, bIn);
    if (rgb.r >= 0 && rgb.r <= 255 &&
        rgb.g >= 0 && rgb.g <= 255 &&
        rgb.b >= 0 && rgb.b <= 255) {
      return bsRgbToHex(Math.round(rgb.r), Math.round(rgb.g), Math.round(rgb.b));
    }
    aIn *= 0.8; bIn *= 0.8;
  }
  // Final fallback: pure greyscale at this L.
  var grey = bsOklabToRgb(L, 0, 0);
  return bsRgbToHex(
    Math.max(0, Math.min(255, Math.round(grey.r))),
    Math.max(0, Math.min(255, Math.round(grey.g))),
    Math.max(0, Math.min(255, Math.round(grey.b)))
  );
}

// Rotate an OKLab a/b vector by `degrees` around the origin, at
// the same chroma. Standard 2-D rotation in the a-b plane.
function bsRotateHueOklab(lab, degrees) {
  var rad = (degrees * Math.PI) / 180;
  var cos = Math.cos(rad), sin = Math.sin(rad);
  return {
    L: lab.L,
    a: lab.a * cos - lab.b * sin,
    b: lab.a * sin + lab.b * cos
  };
}

// Push an OKLab point's L away from the ground's L until WCAG
// contrast against ground hits ≥ targetRatio. Returns hex.
function bsForceContrastAgainstGround(lab, groundHex, targetRatio) {
  var target = targetRatio || 4.5;
  var hex = bsOklabToHexClamped(lab.L, lab.a, lab.b);
  if (bsContrastRatio(hex, groundHex) >= target) return hex;
  // Determine which direction in L moves us away from ground.
  var groundRgb = bsHexToRgb(groundHex);
  if (!groundRgb) return hex;
  var groundLab = bsRgbToOklab(groundRgb.r, groundRgb.g, groundRgb.b);
  var direction = lab.L < groundLab.L ? -1 : 1;
  var L = lab.L;
  for (var step = 0; step < 25; step++) {
    L += direction * 0.04;
    if (L < 0 || L > 1) break;
    hex = bsOklabToHexClamped(L, lab.a, lab.b);
    if (bsContrastRatio(hex, groundHex) >= target) return hex;
  }
  // Last-resort fallback to site neutrals.
  return groundLab.L > 0.5 ? BS_INK : BS_CREAM;
}

// Build a role-tagged entry in the same shape `bsAssignRoles`
// emits, so generated palettes feed every downstream surface
// (renderPalette, renderFixture, renderContrastGrid, renderExports,
// renderMuntinPane) unchanged.
function bsBuildEntry(hex, role, roleVar, tokenName) {
  var rgb = bsHexToRgb(hex);
  var lab = rgb ? bsRgbToOklab(rgb.r, rgb.g, rgb.b) : { L: 0, a: 0, b: 0 };
  return {
    hex: hex,
    dominancePct: 0.20,            // synthetic — equal-share for generated palettes
    role: role,
    roleVar: roleVar,
    tokenName: tokenName,
    chroma: bsClusterChroma(lab),
    hueDeg: bsHueAngleDeg(lab),
    achromatic: bsClusterChroma(lab) < 0.04
  };
}

// Pad / truncate a list of colour hexes to `count`, label them
// with the standard role names, and run them through the WCAG
// guarantee against the chosen ground.
function bsAssembleHarmony(anchor, ground, accentHexes, count) {
  // Roles: Primary (anchor) → Secondary (ground) → Accents → Neutral
  var palette = [];
  palette.push(bsBuildEntry(anchor, BS_ROLE_NAMES_EN[0], BS_ROLE_VARS[0], BS_TOKEN_NAMES[0]));
  palette.push(bsBuildEntry(ground, BS_ROLE_NAMES_EN[1], BS_ROLE_VARS[1], BS_TOKEN_NAMES[1]));
  // Slot accents (3rd, 4th positions)
  var accentIdx = 0;
  while (palette.length < Math.min(count, 4) && accentIdx < accentHexes.length) {
    palette.push(bsBuildEntry(
      accentHexes[accentIdx],
      BS_ROLE_NAMES_EN[2 + accentIdx] || ('Accent ' + (accentIdx + 1)),
      BS_ROLE_VARS[2 + accentIdx]     || ('--brand-accent-' + (accentIdx + 1)),
      BS_TOKEN_NAMES[2 + accentIdx]   || ('brand.accent-' + (accentIdx + 1))
    ));
    accentIdx++;
  }
  // Final slot: derived neutral (anchor desaturated to 0.4 chroma factor at mid-L)
  if (palette.length < count) {
    var anchorRgb = bsHexToRgb(anchor) || { r: 100, g: 100, b: 100 };
    var anchorLab = bsRgbToOklab(anchorRgb.r, anchorRgb.g, anchorRgb.b);
    var neutralLab = { L: 0.45, a: anchorLab.a * 0.15, b: anchorLab.b * 0.15 };
    var neutralHex = bsOklabToHexClamped(neutralLab.L, neutralLab.a, neutralLab.b);
    palette.push(bsBuildEntry(neutralHex, BS_ROLE_NAMES_EN[4], BS_ROLE_VARS[4], BS_TOKEN_NAMES[4]));
  }
  return palette.slice(0, count);
}

function bsHarmonyAnalogous(anchor, ground, count) {
  count = Math.max(3, Math.min(5, count || 5));
  var rgb = bsHexToRgb(anchor) || { r: 60, g: 100, b: 120 };
  var anchorLab = bsRgbToOklab(rgb.r, rgb.g, rgb.b);
  // Generate hue-rotated accents at ±15°, ±30°. Pick the count needed.
  var offsets = [-30, -15, +15, +30];
  var hexes = offsets.map(function(d){
    var rotated = bsRotateHueOklab(anchorLab, d);
    return bsForceContrastAgainstGround(rotated, ground, 4.5);
  });
  return bsAssembleHarmony(anchor, ground, hexes, count);
}

function bsHarmonyComplementary(anchor, ground, count) {
  count = Math.max(3, Math.min(5, count || 5));
  var rgb = bsHexToRgb(anchor) || { r: 60, g: 100, b: 120 };
  var anchorLab = bsRgbToOklab(rgb.r, rgb.g, rgb.b);
  var complement = bsRotateHueOklab(anchorLab, 180);
  // Bridge tones: complement at reduced chroma + a small hue rotation.
  var bridge1 = { L: complement.L, a: complement.a * 0.4, b: complement.b * 0.4 };
  var bridge2 = bsRotateHueOklab(anchorLab, 165);
  var hexes = [
    bsForceContrastAgainstGround(complement, ground, 4.5),
    bsForceContrastAgainstGround(bridge1,    ground, 4.5),
    bsForceContrastAgainstGround(bridge2,    ground, 4.5)
  ];
  return bsAssembleHarmony(anchor, ground, hexes, count);
}

function bsHarmonySplitComplementary(anchor, ground, count) {
  count = Math.max(3, Math.min(5, count || 5));
  var rgb = bsHexToRgb(anchor) || { r: 60, g: 100, b: 120 };
  var anchorLab = bsRgbToOklab(rgb.r, rgb.g, rgb.b);
  var split1 = bsRotateHueOklab(anchorLab, 150);
  var split2 = bsRotateHueOklab(anchorLab, 210);
  // Third accent: a low-chroma version of the anchor.
  var muted = { L: anchorLab.L, a: anchorLab.a * 0.45, b: anchorLab.b * 0.45 };
  var hexes = [
    bsForceContrastAgainstGround(split1, ground, 4.5),
    bsForceContrastAgainstGround(split2, ground, 4.5),
    bsForceContrastAgainstGround(muted,  ground, 4.5)
  ];
  return bsAssembleHarmony(anchor, ground, hexes, count);
}

function bsHarmonyTriadic(anchor, ground, count) {
  count = Math.max(3, Math.min(5, count || 5));
  var rgb = bsHexToRgb(anchor) || { r: 60, g: 100, b: 120 };
  var anchorLab = bsRgbToOklab(rgb.r, rgb.g, rgb.b);
  var triad1 = bsRotateHueOklab(anchorLab, 120);
  var triad2 = bsRotateHueOklab(anchorLab, 240);
  // Fourth accent: muted version of anchor for visual breathing room.
  var muted = { L: Math.min(0.85, anchorLab.L + 0.15), a: anchorLab.a * 0.25, b: anchorLab.b * 0.25 };
  var hexes = [
    bsForceContrastAgainstGround(triad1, ground, 4.5),
    bsForceContrastAgainstGround(triad2, ground, 4.5),
    bsForceContrastAgainstGround(muted,  ground, 4.5)
  ];
  return bsAssembleHarmony(anchor, ground, hexes, count);
}

function bsHarmonyTetradic(anchor, ground, count) {
  count = Math.max(3, Math.min(5, count || 5));
  var rgb = bsHexToRgb(anchor) || { r: 60, g: 100, b: 120 };
  var anchorLab = bsRgbToOklab(rgb.r, rgb.g, rgb.b);
  var quad1 = bsRotateHueOklab(anchorLab, 90);
  var quad2 = bsRotateHueOklab(anchorLab, 180);
  var quad3 = bsRotateHueOklab(anchorLab, 270);
  var hexes = [
    bsForceContrastAgainstGround(quad1, ground, 4.5),
    bsForceContrastAgainstGround(quad2, ground, 4.5),
    bsForceContrastAgainstGround(quad3, ground, 4.5)
  ];
  return bsAssembleHarmony(anchor, ground, hexes, count);
}

function bsHarmonyMonochromatic(anchor, ground, count) {
  count = Math.max(3, Math.min(5, count || 5));
  var rgb = bsHexToRgb(anchor) || { r: 60, g: 100, b: 120 };
  var anchorLab = bsRgbToOklab(rgb.r, rgb.g, rgb.b);
  // Vary only L; preserve hue + chroma.
  var deltas = [-0.20, -0.10, +0.10, +0.20];
  var hexes = deltas.map(function(d){
    var L = Math.max(0.05, Math.min(0.95, anchorLab.L + d));
    return bsForceContrastAgainstGround({ L: L, a: anchorLab.a, b: anchorLab.b }, ground, 4.5);
  });
  return bsAssembleHarmony(anchor, ground, hexes, count);
}

// Mood → which harmony families produce the candidates. Each mood
// returns an ordered list of generator functions; the first 3 run
// (or all of them, for moods with fewer than 3 mapped families).
var BS_MOOD_TO_HARMONIES = {
  'calm':     [bsHarmonyAnalogous, bsHarmonyMonochromatic],
  'warm':     [bsHarmonyAnalogous, bsHarmonyMonochromatic],
  'bold':     [bsHarmonyComplementary, bsHarmonySplitComplementary, bsHarmonyTriadic],
  'refined':  [bsHarmonyMonochromatic, bsHarmonyAnalogous],
  'playful':  [bsHarmonyTriadic, bsHarmonyTetradic, bsHarmonySplitComplementary]
};

var BS_HARMONY_LABELS = {
  analogous:        'Analogous',
  complementary:    'Complementary',
  splitComplementary:'Split-complementary',
  triadic:          'Triadic',
  tetradic:         'Tetradic',
  monochromatic:    'Monochromatic'
};

// Produce 1-3 candidate palettes for a given anchor + ground +
// mood + count. Returns [{ palette, harmonyName, harmonyLabel }, ...].
function bsGenerateCandidatePalettes(anchor, ground, mood, count) {
  var families = BS_MOOD_TO_HARMONIES[mood] || BS_MOOD_TO_HARMONIES.calm;
  var nameByFn = [
    [bsHarmonyAnalogous,         'analogous'],
    [bsHarmonyComplementary,     'complementary'],
    [bsHarmonySplitComplementary,'splitComplementary'],
    [bsHarmonyTriadic,           'triadic'],
    [bsHarmonyTetradic,          'tetradic'],
    [bsHarmonyMonochromatic,     'monochromatic']
  ];
  function lookupName(fn) {
    for (var i = 0; i < nameByFn.length; i++) if (nameByFn[i][0] === fn) return nameByFn[i][1];
    return 'unknown';
  }
  return families.slice(0, 3).map(function(fn){
    var name = lookupName(fn);
    return {
      palette:      fn(anchor, ground, count),
      harmonyName:  name,
      harmonyLabel: BS_HARMONY_LABELS[name] || name
    };
  });
}

var BS_PUBLIC = {
  hexToRgb:               bsHexToRgb,
  rgbToHex:               bsRgbToHex,
  contrastRatio:          bsContrastRatio,
  gradeContrast:          bsGradeContrast,
  rgbToOklab:             bsRgbToOklab,
  oklabToRgb:             bsOklabToRgb,
  oklabDistance:          bsOklabDistance,
  deriveAccessiblePair:   bsDeriveAccessiblePair,
  extractPalette:         bsExtractPalette,
  assignRoles:            bsAssignRoles,
  paletteSimilarities:    bsPaletteSimilarities,
  rgbToCmyk:              bsRgbToCmyk,
  detectBackgroundColor:  bsDetectBackgroundColor,
  stripBackground:        bsStripBackground,
  harmonyAnalogous:           bsHarmonyAnalogous,
  harmonyComplementary:       bsHarmonyComplementary,
  harmonySplitComplementary:  bsHarmonySplitComplementary,
  harmonyTriadic:             bsHarmonyTriadic,
  harmonyTetradic:            bsHarmonyTetradic,
  harmonyMonochromatic:       bsHarmonyMonochromatic,
  generateCandidatePalettes:  bsGenerateCandidatePalettes,
  MOOD_TO_HARMONIES:          BS_MOOD_TO_HARMONIES,
  HARMONY_LABELS:             BS_HARMONY_LABELS,
  simulateColorBlindness: bsSimulateColorBlindness,
  bucketDominantHue:      bsBucketDominantHue,
  bucketLogoSize:         bsBucketLogoSize,
  bucketFileType:         bsBucketFileType,
  CONTRAST_GRADES:        BS_CONTRAST_GRADES,
  HUE_FAMILIES:           BS_HUE_FAMILIES,
  SIZE_BUCKETS:           BS_SIZE_BUCKETS,
  FILE_TYPES:             BS_FILE_TYPES,
  CB_TYPES:               BS_CB_TYPES,
  ROLE_NAMES_EN:          BS_ROLE_NAMES_EN,
  ROLE_VARS:              BS_ROLE_VARS,
  TOKEN_NAMES:            BS_TOKEN_NAMES
};

if (typeof self !== 'undefined' && typeof module === 'undefined') {
  self.BS = BS_PUBLIC;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BS_PUBLIC;
}
