#!/usr/bin/env node
/**
 * Cohesion guard — every <svg> with a viewBox must also carry
 * explicit width and height attributes.
 *
 * Catches the regression class found on 2026-05-04: 4,366 inline
 * SVG tags across 569 pages had `viewBox` but no `width`/`height`,
 * so until CSS arrived browsers rendered them at the SVG default
 * 300×150px — hence the giant Muntin-mark crosshairs the user saw
 * flashing on every page load. CSS later applied the real size
 * (`.logo-mark{width:28px}`, `.mc-watermark{width:14-18px}`, etc.),
 * but during the no-CSS window the page looked broken.
 *
 * Width/height attributes apply BEFORE any CSS, so the SVG renders
 * at viewBox-intrinsic size from first paint and never flashes at
 * 300×150. CSS rules override the rendered dimensions; the attrs
 * only matter during the pre-CSS render window.
 *
 * Convention: width/height should match the viewBox dimensions
 * (so the SVG renders at its "intended" size before CSS applies
 * any further sizing). The fix-svg helper in
 * scripts/inject-post-end-cta.mjs (and the bulk fixer used in PR
 * #285) does exactly that.
 *
 * Allowed exceptions (none today): if a future SVG legitimately
 * needs to be unsized (e.g. because surrounding CSS uses
 * `inline-size:max-content` and the intended size is "fit
 * content"), allowlist it here with a clear comment. Don't break
 * the gate to allow more silent regressions.
 *
 * Usage:
 *   node scripts/check-svg-dimensions.mjs           # report + exit code
 *   node scripts/check-svg-dimensions.mjs --check   # alias
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'brand', 'assets', 'scripts', 'src', 'data',
]);

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && (e.name.endsWith('.html') || e.name === 'inject-post-end-cta.mjs')) yield full;
  }
}

// Match <svg…> opening tags that have a `viewBox` attribute.
// Must check BOTH `width=` and `height=` are present (with proper
// whitespace boundary so `stroke-width=` doesn't false-match).
const SVG_OPEN_RE = /<svg\b[^>]*\bviewBox=\"[^\"]+\"[^>]*>/g;
function hasWidthAttr(s)  { return /(?:^|\s)width\s*=/.test(s); }
function hasHeightAttr(s) { return /(?:^|\s)height\s*=/.test(s); }

const failures = [];
let scanned = 0;
let svgsTotal = 0;

for (const file of walk(repoRoot)) {
  scanned++;
  const src = fs.readFileSync(file, 'utf8');
  const tags = src.match(SVG_OPEN_RE) || [];
  for (const t of tags) {
    svgsTotal++;
    const padded = ' ' + t + ' ';
    if (!hasWidthAttr(padded) || !hasHeightAttr(padded)) {
      failures.push(`${path.relative(repoRoot, file)}  ${t.slice(0, 110)}`);
    }
  }
}

if (failures.length) {
  console.error(`SVG dimensions: ${failures.length} <svg> tag(s) with viewBox but no width/height across ${scanned} file(s):\n`);
  for (const f of failures.slice(0, 25)) console.error(`  ✗ ${f}`);
  if (failures.length > 25) console.error(`  …and ${failures.length - 25} more`);
  console.error(`\nFix: add width="<vbW>" height="<vbH>" matching the viewBox dimensions.`);
  console.error(`     Without these attrs, browsers render at the SVG default 300×150px`);
  console.error(`     until CSS applies — visible as a giant flash on first paint.`);
  process.exit(1);
}

console.log(`SVG dimensions: ${svgsTotal} <svg> tag(s) across ${scanned} file(s); all carry width+height.`);
