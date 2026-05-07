#!/usr/bin/env node
/**
 * render-invoice-fixtures — synthetic invoice rasterizer (Slice 4).
 *
 * Takes the 66 vendor JSON fixtures at
 * tools/invoice-decoder/__fixtures__/synth/*.json (each carries a
 * fullText representing what the OCR layer should be able to read
 * back, plus expectedRows for the parser side) and renders each
 * one to a deterministic set of SVG variants:
 *
 *   3 fonts        (serif, sans, mono)
 *   × 2 rotations  (0°, 3°)        — typical phone-shot drift
 *   × 2 DPI tiers  (150, 300)      — scanner vs phone photo
 *   = 12 variants per fixture
 *   × 66 fixtures
 *   = 792 SVGs total
 *
 * SVG output (not PNG) for two reasons:
 *   1. Pure-Node, zero deps. Works in any environment, including
 *      the air-gapped CI we're testing under right now.
 *   2. SVG → PNG can be done downstream by any environment that
 *      has rsvg-convert / ImageMagick / Chromium when the v2 OCR
 *      pipeline needs raster input. Until then SVGs work for the
 *      _compare/ page (Slice 5) which loads them via <img>.
 *
 * Output:
 *   tools/invoice-decoder/__fixtures__/images/<vendor-id>/<variant>.svg
 *
 * The output directory is gitignored (added in this slice).
 *
 * Usage:
 *   node scripts/render-invoice-fixtures.mjs              # render all 66
 *   node scripts/render-invoice-fixtures.mjs --vendor=baldor-0
 *   node scripts/render-invoice-fixtures.mjs --variant=serif-0deg-300dpi
 *   node scripts/render-invoice-fixtures.mjs --check      # CI mode (no writes)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const SYNTH_DIR  = path.join(repoRoot, 'tools/invoice-decoder/__fixtures__/synth');
const IMAGES_DIR = path.join(repoRoot, 'tools/invoice-decoder/__fixtures__/images');

// Page geometry — US letter, the most common invoice format from
// the supplier base we serve. Everything else derives from these
// two numbers + the DPI tier.
const PAGE_W_IN = 8.5;
const PAGE_H_IN = 11.0;

// Three font families. The names are CSS generic + a common
// concrete font; SVG renderers (browsers, librsvg, ImageMagick)
// fall back to the generic. Tesseract and PP-OCR have all three
// in their training distribution so this exercises the realistic
// font-shape variety operators photograph in the wild.
const FONTS = [
  { id: 'serif', family: '"Times New Roman", Times, serif',     weight: 400 },
  { id: 'sans',  family: '"Helvetica", Arial, sans-serif',      weight: 400 },
  { id: 'mono',  family: '"Courier New", "DejaVu Sans Mono", monospace', weight: 400 }
];

const ROTATIONS = [
  { id: '0deg', deg: 0  },
  { id: '3deg', deg: 3  }
];

const DPI_TIERS = [
  { id: '150dpi', dpi: 150 },
  { id: '300dpi', dpi: 300 }
];

const args = process.argv.slice(2);
const isCheck = args.includes('--check');
const onlyVendor = (args.find(a => a.startsWith('--vendor=')) || '').slice('--vendor='.length) || null;
const onlyVariant = (args.find(a => a.startsWith('--variant=')) || '').slice('--variant='.length) || null;

function escXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Render one SVG variant. Returns the SVG string. Pure function —
// no side effects, deterministic given the inputs.
function renderSvg(fullText, font, rotation, dpi) {
  const widthPx  = Math.round(PAGE_W_IN * dpi);
  const heightPx = Math.round(PAGE_H_IN * dpi);
  // Font size scales with DPI so the rendered glyphs stay
  // roughly the same physical size on the page (12pt ≈ 1/6 inch).
  const fontSizePt = 11;
  const fontSizePx = Math.round(fontSizePt * dpi / 72);
  const lineHeight = Math.round(fontSizePx * 1.4);
  const marginPx   = Math.round(0.6 * dpi);   // 0.6 inch margin

  // Wrap each fullText line in an SVG <text>. We trust the
  // fixture author to have wrapped lines reasonably; long lines
  // overflow rather than being re-wrapped (that's the operator's
  // real-world experience too — a too-wide column gets clipped
  // on the photo).
  const lines = String(fullText || '').split('\n');
  const textNodes = lines.map((line, i) => {
    const y = marginPx + (i + 1) * lineHeight;
    return '    <text x="' + marginPx + '" y="' + y + '" ' +
           'font-family=' + JSON.stringify(font.family) + ' ' +
           'font-size="' + fontSizePx + '" ' +
           'font-weight="' + font.weight + '" ' +
           'fill="#111">' + escXml(line) + '</text>';
  }).join('\n');

  // Page rotation. SVG transform rotates around the origin; we
  // translate to the centre, rotate, translate back so the page
  // pivots in place. For modest rotations (≤ 5°) some content
  // still crosses the page boundary; that's the realistic
  // "operator tilted the camera" effect.
  const transform = rotation.deg === 0
    ? ''
    : ' transform="rotate(' + rotation.deg + ' ' + (widthPx / 2) + ' ' + (heightPx / 2) + ')"';

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg xmlns="http://www.w3.org/2000/svg" ' +
    'width="' + widthPx + '" height="' + heightPx + '" ' +
    'viewBox="0 0 ' + widthPx + ' ' + heightPx + '">\n' +
    '  <rect width="100%" height="100%" fill="#fdfdfb"/>\n' +
    '  <g' + transform + '>\n' +
    textNodes + '\n' +
    '  </g>\n' +
    '</svg>\n';
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

async function main() {
  if (!fs.existsSync(SYNTH_DIR)) {
    console.error('render-invoice-fixtures: synth dir not found at ' + SYNTH_DIR);
    process.exit(1);
  }
  const fixtureFiles = fs.readdirSync(SYNTH_DIR).filter(f => f.endsWith('.json'));
  let renderedCount = 0;
  let skippedCount  = 0;
  for (const file of fixtureFiles) {
    const stem = file.replace(/\.json$/, '');
    if (onlyVendor && stem !== onlyVendor) { skippedCount++; continue; }
    let fixture;
    try {
      fixture = JSON.parse(fs.readFileSync(path.join(SYNTH_DIR, file), 'utf8'));
    } catch (err) {
      console.error('  ! ' + file + ': JSON parse failed: ' + err.message);
      continue;
    }
    if (!fixture || typeof fixture.fullText !== 'string') {
      console.error('  ! ' + file + ': missing fullText');
      continue;
    }
    const outDir = path.join(IMAGES_DIR, stem);
    if (!isCheck) ensureDir(outDir);

    for (const font of FONTS) {
      for (const rot of ROTATIONS) {
        for (const dpi of DPI_TIERS) {
          const variantId = font.id + '-' + rot.id + '-' + dpi.id;
          if (onlyVariant && variantId !== onlyVariant) { skippedCount++; continue; }
          const svg = renderSvg(fixture.fullText, font, rot, dpi.dpi);
          if (!isCheck) {
            fs.writeFileSync(path.join(outDir, variantId + '.svg'), svg);
          }
          renderedCount++;
        }
      }
    }
  }
  console.log(
    'render-invoice-fixtures: ' + (isCheck ? 'would render ' : 'rendered ') +
    renderedCount + ' SVG variant(s)' +
    (skippedCount ? ' (' + skippedCount + ' skipped by filter)' : '') +
    (isCheck ? ' [--check, no writes]' : '')
  );
}

main().catch(err => {
  console.error('render-invoice-fixtures error:', err.message);
  process.exit(1);
});
