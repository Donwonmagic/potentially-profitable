#!/usr/bin/env node
/**
 * Phase-3-perf — generate AVIF + WebP siblings for every PNG/JPG on
 * the site. Saves 70-80% on hero-image bytes when paired with the
 * <picture> wrapping done by inject-picture-tags.mjs.
 *
 * Today's raster inventory (~33 MB total):
 *   /work/<case-study>/*.png  — case-study artifacts (postcards,
 *                                menus, posters)
 *   /about/portrait/don.png   — bio portrait (5.8 MB!)
 *   /brand/og-image.png       — site-wide OG fallback
 *
 * Approach: read each .png / .jpg / .jpeg, encode to .avif (q=50)
 * and .webp (q=75), write siblings alongside the source. Skip the
 * encode if the sibling exists and is newer than the source — the
 * mtime check makes re-runs fast.
 *
 * Excluded directories:
 *   brand/og/         — pre-rendered OG cards; their generator already
 *                       produces appropriate formats
 *   brand/favicons/   — PNG favicons; AVIF/WebP support varies in
 *                       browser favicon handlers
 *   node_modules, .git, dist, .wrangler — obvious
 *
 * Pairs with: scripts/inject-picture-tags.mjs (wraps <img> in
 * <picture> referencing the AVIF + WebP siblings).
 *
 * Usage:
 *   npm i sharp                             # one-time install
 *   node scripts/build-image-formats.mjs    # encode all
 *   node scripts/build-image-formats.mjs --check  # exit 1 if any
 *                                                 source lacks siblings
 *
 * The generated .avif and .webp files SHOULD be committed alongside
 * the source files. Cloudflare Workers Builds doesn't need sharp at
 * deploy time — it just serves the pre-built files.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

// sharp is only needed for the actual encode (the writer mode).
// --check mode only verifies sibling files exist on disk; it doesn't
// need sharp at all. This keeps the cohesion gate green in build
// environments without sharp installed (Cloudflare Workers Builds,
// fresh checkouts, etc.).
let sharp = null;
if (!checkOnly) {
  try {
    sharp = (await import('sharp')).default;
  } catch (e) {
    console.error('build-image-formats: sharp not installed. Run `npm i sharp` first.');
    process.exit(1);
  }
}

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'data', 'scripts', '_includes',
  // Phase 8 — Playwright PNG baselines aren't user-facing images;
  // they're regression-test fixtures. No need for AVIF/WebP siblings.
  'tests', 'test-results', 'playwright-report',
]);
// Subdirectories that have their own image pipeline (or shouldn't be
// AVIF/WebP-encoded for compatibility reasons).
const SKIP_SUBPATHS = ['brand/og/', 'brand/favicons/'];

const RASTER_EXTS = ['.png', '.jpg', '.jpeg'];

function* walkRasterImages(dir, rel = '') {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const next    = rel ? `${rel}/${e.name}` : e.name;
    const skipSub = SKIP_SUBPATHS.some((p) => next === p || next.startsWith(p));
    if (skipSub) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walkRasterImages(full, next);
    else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (RASTER_EXTS.includes(ext)) yield full;
    }
  }
}

// Skip the encode if the output exists and is newer than the source.
// `--check` mode skips the encode entirely and reports whether any
// source is missing a sibling.
function shouldEncode(src, dst) {
  if (!fs.existsSync(dst)) return true;
  const srcStat = fs.statSync(src);
  const dstStat = fs.statSync(dst);
  return srcStat.mtimeMs > dstStat.mtimeMs;
}

let totalSources = 0;
let totalEncoded = 0;
let totalMissing = 0;
const missingFiles = [];

for (const src of walkRasterImages(repoRoot)) {
  totalSources++;
  const ext = path.extname(src).toLowerCase();
  const base = src.slice(0, -ext.length);
  const avifDst = `${base}.avif`;
  const webpDst = `${base}.webp`;

  for (const [dst, fmt, opts] of [
    // effort=4 is the sweet spot: ~0.3-1.5s per image with quality
    // within a few percent of effort=6 (which can take 10-30s on large
    // PNGs). With 18 images total the build-time budget matters more
    // than the marginal extra compression.
    [avifDst, 'avif', { quality: 50, effort: 4 }],
    [webpDst, 'webp', { quality: 75, effort: 4 }],
  ]) {
    if (checkOnly) {
      if (!fs.existsSync(dst)) {
        totalMissing++;
        missingFiles.push(path.relative(repoRoot, dst));
      }
      continue;
    }

    if (!shouldEncode(src, dst)) continue;

    try {
      await sharp(src).toFormat(fmt, opts).toFile(dst);
      totalEncoded++;
      const srcSize = fs.statSync(src).size;
      const dstSize = fs.statSync(dst).size;
      const pct = Math.round((1 - dstSize / srcSize) * 100);
      console.log(`encoded: ${path.relative(repoRoot, dst)}  (${(dstSize / 1024).toFixed(0)} KB, -${pct}% vs source)`);
    } catch (e) {
      console.error(`encode failed: ${path.relative(repoRoot, src)} → ${fmt}: ${e.message}`);
      process.exit(1);
    }
  }
}

if (checkOnly) {
  if (totalMissing > 0) {
    console.error(`build-image-formats: ${totalMissing} sibling(s) missing across ${totalSources} raster source(s):`);
    for (const f of missingFiles.slice(0, 10)) console.error(`  ${f}`);
    if (missingFiles.length > 10) console.error(`  …and ${missingFiles.length - 10} more`);
    console.error(`\nFix: \`npm i sharp && node scripts/build-image-formats.mjs\` and commit the generated .avif and .webp files.`);
    process.exit(1);
  }
  console.log(`build-image-formats: ${totalSources} raster source(s); all have AVIF+WebP siblings.`);
} else {
  console.log(`build-image-formats: ${totalSources} source(s); ${totalEncoded} encoded (others up-to-date).`);
}
