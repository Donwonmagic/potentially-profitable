#!/usr/bin/env node
/**
 * Phase G.12 (Growth) — assert every <img> in production HTML has
 * width AND height attributes (or an aspect-ratio class). The
 * highest-leverage CLS (Cumulative Layout Shift) fix in restaurant
 * websites: the browser reserves the image's box BEFORE the bytes
 * arrive, so reading the page on a slow phone doesn't make the
 * paragraph below jump 200px when the hero loads.
 *
 *   node scripts/check-image-dimensions.mjs --check
 *
 * Ships as a WARNING on first introduction (exits 0 + lists offenses).
 * Promote to fail-CI after a 30-day soak by changing WARN_ONLY=false.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const WARN_ONLY = true;

const SKIP_DIRS = new Set(['node_modules', '.git', '.github', 'dist', '.wrangler', 'docs', 'brand']);
const ASPECT_CLASSES = ['aspect', 'ar-', 'has-aspect'];

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && e.name.endsWith('.html')) yield p;
  }
}

const failures = [];
let scanned = 0, imgs = 0;

for (const file of walk(repoRoot)) {
  scanned++;
  const src = fs.readFileSync(file, 'utf8');
  // Match <img …> tags. Self-closing, multi-line attributes.
  const matches = src.match(/<img\b[^>]*>/gi) || [];
  for (const tag of matches) {
    imgs++;
    if (/\bwidth\s*=/.test(tag) && /\bheight\s*=/.test(tag)) continue;
    if (ASPECT_CLASSES.some((c) => tag.includes(`class="${c}`) || tag.includes(` ${c}`))) continue;
    // SVG sprite uses, brand assets imported via JS, and CSS-bg-via-img
    // are uncommon — leave them flagged so they show up in the report.
    failures.push(`${path.relative(repoRoot, file)}  ${tag.slice(0, 100).replace(/\s+/g, ' ')}…`);
  }
}

if (failures.length) {
  console.log(`Image dimensions${WARN_ONLY ? ' (warning)' : ''}: ${failures.length} <img> tag(s) without width+height across ${scanned} HTML file(s):`);
  for (const f of failures.slice(0, 20)) console.log('  · ' + f);
  if (failures.length > 20) console.log(`  … and ${failures.length - 20} more`);
  if (!WARN_ONLY) process.exit(1);
} else {
  console.log(`Image dimensions: ${imgs} <img> tag(s) across ${scanned} HTML file(s); all dimensioned.`);
}
