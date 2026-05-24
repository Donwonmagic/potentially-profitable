#!/usr/bin/env node
/**
 * Phase SEO/Perf — preload the italic Fraunces + Inter variable fonts
 * on every page that already preloads the normal variants.
 *
 * Problem this fixes
 * ------------------
 * Every page preloads:
 *   <link rel="preload" as="font" href=".../fraunces-variable-latin-wght-normal.woff2" ...>
 *   <link rel="preload" as="font" href=".../inter-variable-latin-wght-normal.woff2" ...>
 *
 * But the homepage hero — and most articles — render italic text above
 * the fold ("Built by one person, in one season.", the citation drawer
 * source labels, italic article eyebrows, etc.). When the renderer needs
 * an italic glyph, the browser fetches the italic file ON-DEMAND. Result:
 * the page first paints with the metric-matched fallback (Times New
 * Roman → Fraunces Fallback), then re-paints when the normal weight
 * arrives, then re-paints AGAIN a beat later when the italic arrives.
 *
 * Operator reported the "page temporarily loads in a different font"
 * artifact in May 2026 — that's the italic-font swap. Preloading the
 * italic variants makes the swap happen during initial network parallel
 * with the normal weight, so first paint already has italic.
 *
 * Trade-off: adds 2 more font requests to first-paint critical path
 * (each ~50 KB woff2). For above-the-fold italic-rendering pages —
 * which is most of the long-form library — the perceived experience
 * win clearly beats the bandwidth cost.
 *
 * Idempotent: if the italic preload is already on the page, no-op.
 *
 * Usage
 *   node scripts/inject-italic-font-preloads.mjs
 *   node scripts/inject-italic-font-preloads.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SKIP_DIRS = new Set([
  '.git', 'node_modules', '.wrangler', 'dist', 'docs', '_includes',
]);

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name) || ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(p);
    else if (ent.isFile() && p.endsWith('.html')) yield p;
  }
}

// Pattern: the normal-weight Fraunces preload tag (anchor for inserting
// the italic preloads right after it, in the same head ordering).
const FRAUNCES_NORMAL_RE =
  /<link rel="preload" as="font" type="font\/woff2" href="\/assets\/fonts\/fraunces-variable-latin-wght-normal\.woff2" crossorigin>/;
const INTER_NORMAL_RE =
  /<link rel="preload" as="font" type="font\/woff2" href="\/assets\/fonts\/inter-variable-latin-wght-normal\.woff2" crossorigin>/;

const FRAUNCES_ITALIC_TAG =
  '<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/fraunces-variable-latin-wght-italic.woff2" crossorigin>';
const INTER_ITALIC_TAG =
  '<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/inter-variable-latin-wght-italic.woff2" crossorigin>';

let touched = 0;
let scanned = 0;
const pending = [];

for (const f of walk(REPO)) {
  scanned++;
  const src = fs.readFileSync(f, 'utf8');

  // Both preload anchors must exist. If a page doesn't preload fonts at
  // all (e.g. /workbench/, /admin/), skip it.
  if (!FRAUNCES_NORMAL_RE.test(src) || !INTER_NORMAL_RE.test(src)) continue;

  // Idempotency: skip if both italic preloads are already in place.
  if (src.includes(FRAUNCES_ITALIC_TAG) && src.includes(INTER_ITALIC_TAG)) continue;

  let next = src;
  if (!next.includes(FRAUNCES_ITALIC_TAG)) {
    next = next.replace(
      FRAUNCES_NORMAL_RE,
      (m) => `${m}\n${FRAUNCES_ITALIC_TAG}`
    );
  }
  if (!next.includes(INTER_ITALIC_TAG)) {
    next = next.replace(
      INTER_NORMAL_RE,
      (m) => `${m}\n${INTER_ITALIC_TAG}`
    );
  }

  if (next === src) continue;
  if (checkOnly) {
    pending.push(path.relative(REPO, f));
  } else {
    fs.writeFileSync(f, next);
  }
  touched++;
}

if (checkOnly) {
  if (pending.length > 0) {
    console.error(`inject-italic-font-preloads: ${pending.length} page(s) would update:`);
    for (const p of pending.slice(0, 10)) console.error(`  - ${p}`);
    if (pending.length > 10) console.error(`  … and ${pending.length - 10} more`);
    process.exit(1);
  }
  console.log(`inject-italic-font-preloads: no changes (${scanned} files scanned).`);
  process.exit(0);
}

console.log(`inject-italic-font-preloads: stamped italic preloads on ${touched} page(s) (of ${scanned} HTML files scanned).`);
