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
  var L = lab.L;
  for (var i = 0; i < 50; i++) {
    L += step;
    if (L < 0 || L > 1) break;
    var adjusted = bsOklabToRgb(L, lab.a, lab.b);
    var candidateHex = bsRgbToHex(adjusted.r, adjusted.g, adjusted.b);
    if (bsContrastRatio(candidateHex, groundHex) >= tgt) return candidateHex;
  }
  // Could not reach target — return the most extreme adjustment we tried.
  var clampedL = step > 0 ? 1 : 0;
  var extreme = bsOklabToRgb(clampedL, lab.a, lab.b);
  return bsRgbToHex(extreme.r, extreme.g, extreme.b);
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
// Dual export
// ------------------------------------------------------------

if (typeof window !== 'undefined') {
  window.BS = {
    hexToRgb:             bsHexToRgb,
    rgbToHex:             bsRgbToHex,
    contrastRatio:        bsContrastRatio,
    gradeContrast:        bsGradeContrast,
    rgbToOklab:           bsRgbToOklab,
    oklabToRgb:           bsOklabToRgb,
    oklabDistance:        bsOklabDistance,
    deriveAccessiblePair: bsDeriveAccessiblePair,
    extractPalette:       bsExtractPalette,
    bucketDominantHue:    bsBucketDominantHue,
    bucketLogoSize:       bsBucketLogoSize,
    bucketFileType:       bsBucketFileType,
    CONTRAST_GRADES:      BS_CONTRAST_GRADES,
    HUE_FAMILIES:         BS_HUE_FAMILIES,
    SIZE_BUCKETS:         BS_SIZE_BUCKETS,
    FILE_TYPES:           BS_FILE_TYPES
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    hexToRgb:             bsHexToRgb,
    rgbToHex:             bsRgbToHex,
    contrastRatio:        bsContrastRatio,
    gradeContrast:        bsGradeContrast,
    rgbToOklab:           bsRgbToOklab,
    oklabToRgb:           bsOklabToRgb,
    oklabDistance:        bsOklabDistance,
    deriveAccessiblePair: bsDeriveAccessiblePair,
    extractPalette:       bsExtractPalette,
    bucketDominantHue:    bsBucketDominantHue,
    bucketLogoSize:       bsBucketLogoSize,
    bucketFileType:       bsBucketFileType,
    CONTRAST_GRADES:      BS_CONTRAST_GRADES,
    HUE_FAMILIES:         BS_HUE_FAMILIES,
    SIZE_BUCKETS:         BS_SIZE_BUCKETS,
    FILE_TYPES:           BS_FILE_TYPES
  };
}
