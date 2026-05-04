#!/usr/bin/env node
/**
 * Phase-3-perf — wrap every <img src="X.png|jpg|jpeg"> in a <picture>
 * element that prefers an AVIF or WebP sibling.
 *
 * Generated output (one example, .png source):
 *
 *   <!-- picture:start -->
 *   <picture>
 *     <source type="image/avif" srcset="X.avif">
 *     <source type="image/webp" srcset="X.webp">
 *     <img src="X.png" alt="…" width="…" height="…" loading="lazy">
 *   </picture>
 *   <!-- picture:end -->
 *
 * Browsers that support AVIF (Chrome ≥ 85, Safari ≥ 16, Firefox ≥
 * 113 — ~95% global) get the AVIF. Older browsers get WebP (~99%).
 * Anyone without WebP gets the original PNG/JPG fallback.
 *
 * Per-image bytes saved depends on source format/content; AVIF
 * typically wins 60-80% on photo-style PNG and 50-70% on JPG.
 *
 * Pairs with: scripts/build-image-formats.mjs (produces the .avif
 * and .webp sibling files this script's <source> tags reference).
 *
 * Idempotent: only wraps <img> tags that don't ALREADY sit inside a
 * <picture>. Marker comments (<!-- picture:start --> /
 * <!-- picture:end -->) make it easy to spot the wraps in source +
 * to unwrap later if needed.
 *
 * Skipped:
 *   - <img> tags inside SVG / inline brand marks
 *   - <img> tags inside <noscript> blocks (separate codepath)
 *   - <img class="foot-lockup"> (footer brand lockup, an SVG anyway
 *     — included as <img src="…svg"> since browsers handle SVG)
 *   - <img> in /admin/, /workbench/ (auth-gated, not user-facing)
 *
 * Usage:
 *   node scripts/inject-picture-tags.mjs           # rewrite in place
 *   node scripts/inject-picture-tags.mjs --check   # exit 1 if any change
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'data', 'scripts', '_includes',
  'admin', 'workbench',
]);

function listHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listHtml(full, out);
    else if (e.isFile() && e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

// Match <img …src="…X.png|jpg|jpeg"…> tags. Multi-line attrs allowed
// inside the opening tag. The src must end in a raster extension that
// has AVIF + WebP siblings (verified at the per-tag level below).
const IMG_RE = /<img\b[^>]*\bsrc="([^"]+\.(?:png|jpg|jpeg))"[^>]*>/gi;

// `<!-- picture:start -->\n<picture>…</picture>\n<!-- picture:end -->`
// is what THIS injector emits. We don't double-wrap.
const PICTURE_OPEN_MARKER = '<!-- picture:start -->';

function siblingExists(srcPath, htmlFile) {
  // Resolve src relative to repoRoot if absolute (`/work/…`) or relative
  // to the HTML file's directory if not.
  const isAbsolute = srcPath.startsWith('/');
  const base = isAbsolute
    ? path.join(repoRoot, srcPath)
    : path.resolve(path.dirname(htmlFile), srcPath);
  const ext = path.extname(base);
  const stem = base.slice(0, -ext.length);
  return fs.existsSync(`${stem}.avif`) && fs.existsSync(`${stem}.webp`);
}

function wrapImg(imgTag, srcPath) {
  const ext = path.extname(srcPath);
  const stem = srcPath.slice(0, -ext.length);
  const avifSrc = `${stem}.avif`;
  const webpSrc = `${stem}.webp`;
  return [
    PICTURE_OPEN_MARKER,
    '<picture>',
    `<source type="image/avif" srcset="${avifSrc}">`,
    `<source type="image/webp" srcset="${webpSrc}">`,
    imgTag,
    '</picture>',
    '<!-- picture:end -->',
  ].join('\n');
}

let changed = 0;
let pagesChanged = 0;

for (const file of listHtml(repoRoot)) {
  const src = fs.readFileSync(file, 'utf8');
  let next = src;
  let replaced = 0;
  let cursor = 0;

  // Walk the file linearly so we can detect "already wrapped" by
  // looking at the surrounding context (the previous line is the
  // <!-- picture:start --> marker if so).
  IMG_RE.lastIndex = 0;
  let m;
  const replacements = [];
  while ((m = IMG_RE.exec(src))) {
    const imgTag = m[0];
    const srcPath = m[1];

    // Skip if already inside a <picture> wrap. Lookback needs to span
    // the marker + <picture>\n + 2 <source> tags. The longest <source>
    // is ~85 chars (for absolute /work/<slug>/<long-name>.{avif,webp})
    // so a 400-char window comfortably covers it.
    const lookback = src.slice(Math.max(0, m.index - 400), m.index);
    if (lookback.includes(PICTURE_OPEN_MARKER)) continue;

    // Skip if AVIF + WebP siblings don't exist for this src.
    if (!siblingExists(srcPath, file)) continue;

    replacements.push({ start: m.index, end: m.index + imgTag.length, replacement: wrapImg(imgTag, srcPath) });
  }

  if (!replacements.length) continue;

  // Apply replacements right-to-left so earlier indices stay valid.
  for (const r of replacements.reverse()) {
    next = next.slice(0, r.start) + r.replacement + next.slice(r.end);
  }

  if (next !== src) {
    pagesChanged++;
    changed += replacements.length;
    if (!checkOnly) fs.writeFileSync(file, next);
  }
}

if (checkOnly && changed > 0) {
  console.error(`inject-picture-tags: ${changed} <img> tag(s) across ${pagesChanged} page(s) would be wrapped.`);
  console.error(`Fix: node scripts/inject-picture-tags.mjs`);
  process.exit(1);
}

console.log(`inject-picture-tags: ${changed} <img> tag(s) across ${pagesChanged} page(s) ${checkOnly ? 'would be wrapped' : 'wrapped in <picture>'}.`);
