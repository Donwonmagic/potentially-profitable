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
 * Promote-to-fail history: shipped warn-only with naive `<img>`
 * regex that grepped HTML files including content INSIDE `<script>`
 * tags. Tool pages whose render layer builds <img> tags as JS string
 * templates — `'<img src="' + foo + '">'` — got every literal
 * occurrence flagged as a static-HTML placeholder, drowning the
 * report. The current code strips <script> blocks first and skips
 * runtime placeholder <img> elements (no src, no srcset) since they
 * don't ship bytes at first paint and the surrounding layout
 * (min-height on the figure, aspect-ratio CSS, max-* on the img)
 * already reserves the box.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

// Once script-stripping + placeholder-skip eliminated the false-
// positive noise that had been hiding under warn-only, the check
// found zero real un-dimensioned <img> elements across the site,
// so the gate was no longer protecting us from a fix backlog.
// Promoted to fail-CI from this PR.
const WARN_ONLY = false;

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

// Strip <script>…</script> blocks. Inside them, <img> tags are JS
// string templates that get concatenated at runtime — not actual
// page elements. Stripping eliminates the bulk of false positives.
function stripScripts(src) {
  return src.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

// Skip placeholder <img> tags whose src/srcset is absent or empty —
// JS sets the source at runtime, and the parent figure typically
// reserves the box via min-height / aspect-ratio. Flagging them
// generates fixes that don't move CLS.
function isPlaceholder(tag) {
  const hasRealSrc = /\bsrc\s*=\s*"[^"]+"/i.test(tag) || /\bsrcset\s*=\s*"[^"]+"/i.test(tag);
  return !hasRealSrc;
}

const failures = [];
let scanned = 0, imgs = 0;

for (const file of walk(repoRoot)) {
  scanned++;
  const src = stripScripts(fs.readFileSync(file, 'utf8'));
  const matches = src.match(/<img\b[^>]*>/gi) || [];
  for (const tag of matches) {
    imgs++;
    if (/\bwidth\s*=/.test(tag) && /\bheight\s*=/.test(tag)) continue;
    if (isPlaceholder(tag)) continue;
    if (ASPECT_CLASSES.some((c) => tag.includes(`class="${c}`) || tag.includes(` ${c}`))) continue;
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
