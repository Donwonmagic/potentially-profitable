#!/usr/bin/env node
/**
 * Phase G.12 (Growth) — assert every <img> below the fold uses
 * loading="lazy" + decoding="async". On a restaurant website,
 * 80% of bytes are images and 70% of those load below-the-fold —
 * lazy + async is the cheapest LCP/total-bytes win available.
 *
 * Heuristic: an image is "above the fold" if (a) it carries an
 * explicit class containing 'hero', 'logo', or 'lockup', or
 * (b) it's one of the first 2 <img> in the file. Everything
 * else must be lazy + async.
 *
 *   node scripts/check-lazy-images.mjs --check
 *
 * Promote-to-fail history: shipped warn-only with a naive `<img>`
 * regex that swept up tags inside <script> tags (JS string templates)
 * and runtime placeholders without src. The current code strips
 * <script> blocks first and skips placeholder <img> elements (no
 * src/srcset) since they're set by JS at runtime — lazy/async
 * doesn't mean anything before there's a src to fetch.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

// Once script-stripping + placeholder-skip eliminated the false-
// positive noise that had been hiding under warn-only, the check
// found zero real below-fold <img> elements missing lazy/async
// across the site, so the gate was no longer protecting us from a
// fix backlog. Promoted to fail-CI from this PR.
const WARN_ONLY = false;
const ABOVE_FOLD_CLASSES = ['hero', 'logo', 'lockup', 'foot-lockup', 'people-hero'];
const ABOVE_FOLD_FIRST_N = 2;

const SKIP_DIRS = new Set(['node_modules', '.git', '.github', 'dist', '.wrangler', 'docs', 'brand']);

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && e.name.endsWith('.html')) yield p;
  }
}

function stripScripts(src) {
  return src.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

function isPlaceholder(tag) {
  const hasRealSrc = /\bsrc\s*=\s*"[^"]+"/i.test(tag) || /\bsrcset\s*=\s*"[^"]+"/i.test(tag);
  return !hasRealSrc;
}

const failures = [];
let scanned = 0, imgs = 0;

for (const file of walk(repoRoot)) {
  scanned++;
  const src = stripScripts(fs.readFileSync(file, 'utf8'));
  const matches = [...src.matchAll(/<img\b[^>]*>/gi)];
  for (let i = 0; i < matches.length; i++) {
    const tag = matches[i][0];
    if (isPlaceholder(tag)) continue;
    imgs++;
    const isAboveFold = i < ABOVE_FOLD_FIRST_N
      || ABOVE_FOLD_CLASSES.some((c) => tag.includes(c));
    if (isAboveFold) continue;
    const hasLazy  = /\bloading\s*=\s*"?lazy/i.test(tag);
    const hasAsync = /\bdecoding\s*=\s*"?async/i.test(tag);
    if (!hasLazy || !hasAsync) {
      const missing = [!hasLazy && 'loading="lazy"', !hasAsync && 'decoding="async"'].filter(Boolean).join(' + ');
      failures.push(`${path.relative(repoRoot, file)}  missing ${missing}: ${tag.slice(0, 80)}…`);
    }
  }
}

if (failures.length) {
  console.log(`Lazy images${WARN_ONLY ? ' (warning)' : ''}: ${failures.length} below-fold <img> not lazy across ${scanned} HTML file(s):`);
  for (const f of failures.slice(0, 20)) console.log('  · ' + f);
  if (failures.length > 20) console.log(`  … and ${failures.length - 20} more`);
  if (!WARN_ONLY) process.exit(1);
} else {
  console.log(`Lazy images: ${imgs} <img> tag(s) across ${scanned} HTML file(s); all below-fold ones lazy+async.`);
}
