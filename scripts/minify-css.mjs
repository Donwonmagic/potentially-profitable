#!/usr/bin/env node
/**
 * Phase 3C-perf — CSS minification post-build step.
 *
 * The async preload+onload pattern ships site-core.css (~179 KB
 * unminified) + site-article.css (~158 KB unminified) lazily after
 * first paint. When the swap fires, the browser parses ~337 KB of
 * CSS off the main thread, then reflows everything below the hero —
 * the user-perceived "page loads first screen then lags for several
 * seconds" symptom.
 *
 * This script minifies the CSS shells in dist/assets/ using
 * lightningcss, expected to cut ~60-65% off disk size and parse
 * time. Operates on the dist/ copy so assets/site*.css in the repo
 * stay editable and the check-css-shells.mjs round-trip invariant
 * (core+tool+article reassemble byte-equivalently to assets/site.css)
 * stays intact on the source.
 *
 *   node scripts/minify-css.mjs                  # minify dist/assets/site-*.css
 *   node scripts/minify-css.mjs --in-place       # minify assets/site-*.css in repo (dev/verification)
 *   node scripts/minify-css.mjs --check          # exit 1 if --in-place files are still unminified
 *
 * Pipeline placement (wrangler.jsonc build.command):
 *
 *   ... && tar ... | tar -xf - -C dist && test -f dist/index.html
 *   && npm install --no-save --no-fund --no-audit --silent lightningcss@latest
 *   && node scripts/minify-css.mjs
 *   && node scripts/vendor-pin.mjs && npx -y pagefind@latest --site dist
 *
 * Why post-tar and not in-place on assets/:
 *
 *   check-css-shells.mjs (and build-css-shells.mjs --check) verifies
 *   that the three shells round-trip back to assets/site.css with
 *   identical rules. That invariant only holds on the pre-minified
 *   text. Keeping assets/ unminified preserves the round-trip; the
 *   dist/ copy gets minified for shipping.
 *
 * Why we trust the existing cache-bust hashes:
 *
 *   inject-css-cache-bust.mjs hashes assets/site-*.css (unminified)
 *   and stamps ?v=<hash> on every <link> in the HTML. The hash
 *   tracks SOURCE content; when site.css changes, the shells change,
 *   the hash changes, and the minified output also changes — so the
 *   cache-bust still works. A minifier-version-only change wouldn't
 *   bump the hash; that's an acceptable trade-off (rare enough that
 *   a manual cache-bust nudge would handle it).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const inPlace    = process.argv.includes('--in-place');
const checkOnly  = process.argv.includes('--check');

const TARGETS_DIR = inPlace
  ? path.join(repoRoot, 'assets')
  : path.join(repoRoot, 'dist', 'assets');

// Order matters only for the summary print. site.css is the source
// of truth that lives alongside the shells; minifying it too keeps
// the dist/ tarball consistent (some legacy pages may still reference
// site.css directly via cache-busted URLs).
const FILES = ['site-core.css', 'site-article.css', 'site-tool.css', 'site.css'];

let transform;
try {
  ({ transform } = await import('lightningcss'));
} catch (e) {
  console.error('minify-css: lightningcss not installed.');
  console.error('Fix: npm install --no-save --no-fund --no-audit --silent lightningcss');
  process.exit(1);
}

if (!fs.existsSync(TARGETS_DIR)) {
  console.error(`minify-css: ${TARGETS_DIR} does not exist. Run build-css-shells.mjs first (or the full build pipeline that materializes dist/).`);
  process.exit(1);
}

let totalIn  = 0;
let totalOut = 0;
const rows   = [];

for (const name of FILES) {
  const file = path.join(TARGETS_DIR, name);
  if (!fs.existsSync(file)) continue;

  const inBuf = fs.readFileSync(file);
  totalIn += inBuf.length;

  // Pre-strip /* ... */ comments before parsing. build-css-shells.mjs
  // injects its per-section header right at the SECTIONS-map line
  // boundary, which can land inside a hand-authored multi-line block
  // comment in assets/site.css — leaving an unbalanced comment in
  // the shell that lightningcss's strict parser rejects (whereas
  // browsers tolerate the malformed shape). Stripping comments first
  // sidesteps that quirk and gives the minifier clean rules.
  // Safe because grep shows no `/*` or `*/` sequence appears inside
  // a string or url() in assets/site.css.
  const sanitised = Buffer.from(inBuf.toString('utf8').replace(/\/\*[\s\S]*?\*\//g, ''));

  // No `targets` field: lightningcss minifies whitespace/comments
  // and merges adjacent rules but does NOT transform any syntax to
  // older browser equivalents. The CSS shells already target modern
  // evergreen browsers; we don't want any down-leveling here.
  const { code } = transform({
    filename: name,
    code: sanitised,
    minify: true,
  });

  totalOut += code.length;
  const ratio = inBuf.length === 0 ? 100 : Math.round((100 * code.length) / inBuf.length);
  rows.push(`  ${name.padEnd(20)} ${(inBuf.length / 1024).toFixed(1).padStart(6)} KB → ${(code.length / 1024).toFixed(1).padStart(6)} KB  (${String(ratio).padStart(3)}%)`);

  if (checkOnly) {
    // In --in-place --check mode, fail if the file would still
    // shrink meaningfully. >5% slack absorbs minifier-internal
    // determinism quirks; below that, the file is effectively
    // already minified.
    if (code.length < inBuf.length * 0.95) {
      console.error(`minify-css: ${name} is unminified (${(inBuf.length / 1024).toFixed(1)} KB → ${(code.length / 1024).toFixed(1)} KB would ship).`);
      process.exit(1);
    }
    continue;
  }

  fs.writeFileSync(file, code);
}

const totalRatio = totalIn === 0 ? 100 : Math.round((100 * totalOut) / totalIn);
console.log(`minify-css: ${(totalIn / 1024).toFixed(1)} KB → ${(totalOut / 1024).toFixed(1)} KB  (${totalRatio}%)  in ${path.relative(repoRoot, TARGETS_DIR) || TARGETS_DIR}`);
for (const r of rows) console.log(r);
