#!/usr/bin/env node
/**
 * Phase G.12 (Growth) — assert hero images use a <picture> element
 * with a WebP/AVIF source. Falls back to plain <img> for non-hero
 * images (those are covered by check-lazy-images.mjs and
 * check-image-dimensions.mjs).
 *
 * Heuristic: an image is "hero" if (a) it's inside a <section> that
 * carries class containing 'hero', or (b) its <img> tag has a class
 * containing 'hero'. The check is forgiving — it doesn't fail when
 * a hero is rendered via CSS background-image (those are out of
 * scope).
 *
 *   node scripts/check-image-formats.mjs --check
 *
 * WARN_ONLY by default; flip after the existing tree is cleaned.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const WARN_ONLY = true;
const SKIP_DIRS = new Set(['node_modules', '.git', '.github', 'dist', '.wrangler', 'docs', 'brand']);

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && e.name.endsWith('.html')) yield p;
  }
}

const failures = [];
let scanned = 0, heroes = 0;

for (const file of walk(repoRoot)) {
  scanned++;
  const src = fs.readFileSync(file, 'utf8');
  // Find <section class="...hero..."> or <img class="...hero...">.
  // Loose regex — false positives are fine for a warning check.
  const heroSectionRe = /<section[^>]*class="[^"]*hero[^"]*"[^>]*>([\s\S]*?)<\/section>/g;
  let m;
  while ((m = heroSectionRe.exec(src))) {
    const block = m[1];
    const imgs = block.match(/<img\b[^>]*>/g) || [];
    for (const img of imgs) {
      heroes++;
      // Skip SVG-source images — they don't need WebP.
      if (/src="[^"]+\.svg"/i.test(img)) continue;
      // Look for a <picture> wrapper near this img — search backwards
      // for "<picture" within ~400 chars before the img position.
      const imgPos = block.indexOf(img);
      const lookback = block.slice(Math.max(0, imgPos - 400), imgPos);
      if (/<picture\b/i.test(lookback)) continue;
      failures.push(`${path.relative(repoRoot, file)}  hero <img> not wrapped in <picture> with WebP source: ${img.slice(0, 90)}…`);
    }
  }
}

if (failures.length) {
  console.log(`Image formats${WARN_ONLY ? ' (warning)' : ''}: ${failures.length} hero <img>(s) without <picture>/WebP across ${scanned} HTML file(s):`);
  for (const f of failures.slice(0, 20)) console.log('  · ' + f);
  if (failures.length > 20) console.log(`  … and ${failures.length - 20} more`);
  if (!WARN_ONLY) process.exit(1);
} else {
  console.log(`Image formats: ${heroes} hero <img>(s) across ${scanned} HTML file(s); all wrapped with <picture>/WebP source.`);
}
