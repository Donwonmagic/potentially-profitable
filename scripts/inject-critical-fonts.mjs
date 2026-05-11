#!/usr/bin/env node
/**
 * Phase 3C-perf — inline-critical fonts + above-the-fold skeleton.
 *
 * Two problems this injector fixes:
 *
 *   1. The four @font-face declarations for Fraunces + Inter (plus the
 *      two metric-matched fallback definitions) live inside
 *      assets/site-core.css. site-core.css is loaded via the async
 *      preload+onload swap, so the browser cannot register the
 *      @font-face rules until that 179 KB sheet finishes downloading
 *      AND parsing. The font preloads at the top of every page's
 *      <head> fetch the woff2 files immediately, but the browser
 *      can't use them until the rules exist — wasting most of the
 *      preload's benefit. Inlining the @font-face block here closes
 *      that gap: rules register at HTML parse time, the preloaded
 *      fonts swap in on first paint.
 *
 *   2. The hand-authored critical CSS block in every page (~600
 *      bytes) covers nav + body baseline only. Everything below the
 *      hero — section headers, trust strip, footer skeleton — reflows
 *      visibly when site-core.css finally applies. Adding the
 *      structural rules for those surfaces here renders below-the-
 *      fold content correctly on first paint, eliminating the
 *      "first screen then multi-second lag" cascade users report.
 *
 *      Also adds the .below-fold-island utility (content-visibility:
 *      auto) so wrapper elements with that class skip painting work
 *      until they're near the viewport.
 *
 * Idempotent. Sentinel comment "/* perf-critical *\/" gates the
 * injection — re-runs find the marker and no-op.
 *
 *   node scripts/inject-critical-fonts.mjs           # rewrite in place
 *   node scripts/inject-critical-fonts.mjs --check   # exit 1 on drift
 *
 * Run AFTER inject-critical-css-nav.mjs and inject-critical-link-color.mjs
 * (so the nav-critical + link-color blocks exist when we extend past
 * them) and BEFORE inject-css-cache-bust.mjs.
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

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && full.endsWith('.html')) out.push(full);
  }
  return out;
}

const SENTINEL = '/* perf-critical */';

// Latin unicode-range used for both Fraunces + Inter variable fonts.
// Identical between the two so we declare it once for readability.
const RANGE = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

// Block to inject. Each rule is on one line so byte diffs are
// inspectable and the minified size on the wire is predictable.
//
// The token redeclaration on the first line extends the existing
// :root{...} block at index.html:480 with the two font-family chains
// the @font-face rules feed into. Without these tokens declared
// inline, references to var(--font-display) in subsequent rules
// resolve to the initial value (unset) until site-core.css applies.
const BLOCK = [
  SENTINEL,
  // Font-family chains. Body + display tokens used everywhere; chains
  // point at the @font-face names declared immediately below so the
  // cascade resolves correctly at HTML parse time.
  `:root{--font-display:'Fraunces','Fraunces Fallback',Georgia,'Times New Roman',serif;--font-body:'Inter','Inter Fallback',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;--ink-soft:#2A2D33;--teal:#1F4E5B;--teal-dark:#143640;--stone:#6B6B6B;--line:#E8E2D6;--line-dark:#D4CCBC}`,
  `body{font-family:var(--font-body)}`,
  `h1,h2,h3,h4,h5,.serif-italic{font-family:var(--font-display)}`,
  // @font-face — four variable-font rules + two metric-matched fallbacks.
  // Mirrors assets/site.css:558-605 so the inlined declarations match
  // what site-core.css later (re-)registers. font-display:swap lets the
  // fallback render immediately and swap when the woff2 arrives.
  `@font-face{font-family:'Fraunces';font-style:normal;font-weight:100 900;font-display:swap;src:url('/assets/fonts/fraunces-variable-latin-wght-normal.woff2') format('woff2-variations');unicode-range:${RANGE}}`,
  `@font-face{font-family:'Fraunces';font-style:italic;font-weight:100 900;font-display:swap;src:url('/assets/fonts/fraunces-variable-latin-wght-italic.woff2') format('woff2-variations');unicode-range:${RANGE}}`,
  `@font-face{font-family:'Inter';font-style:normal;font-weight:100 900;font-display:swap;src:url('/assets/fonts/inter-variable-latin-wght-normal.woff2') format('woff2-variations');unicode-range:${RANGE}}`,
  `@font-face{font-family:'Inter';font-style:italic;font-weight:100 900;font-display:swap;src:url('/assets/fonts/inter-variable-latin-wght-italic.woff2') format('woff2-variations');unicode-range:${RANGE}}`,
  `@font-face{font-family:'Fraunces Fallback';src:local('Times New Roman');size-adjust:100%;ascent-override:97.8%;descent-override:25.5%;line-gap-override:0%}`,
  `@font-face{font-family:'Inter Fallback';src:local('Arial');size-adjust:100%;ascent-override:96.875%;descent-override:24.121%;line-gap-override:0%}`,
  // Hero skeleton — mirrors assets/site.css:951-972 minimally.
  // Skipping the expensive cosmetics (.window panes, gradients,
  // box-shadow on .hero-meta .avatar). Just the structural rules that
  // determine the hero's grid + spacing.
  `.hero{padding:160px 0 100px;position:relative;overflow:hidden}`,
  `.hero-grid{display:grid;grid-template-columns:1.1fr 0.9fr;gap:60px;align-items:center}`,
  `@media (max-width:960px){.hero{padding:130px 0 60px}.hero-grid{grid-template-columns:1fr;gap:48px}}`,
  `.hero h1{margin-top:24px;text-wrap:balance;max-width:18ch}`,
  `.hero h1 .serif-italic{font-style:italic;font-weight:400;color:var(--teal)}`,
  `.hero-sub{margin-top:28px;max-width:520px;font-size:clamp(17px,1.35vw,20px);line-height:1.55;color:var(--ink-soft)}`,
  `.hero-ctas{margin-top:40px;display:flex;gap:14px;flex-wrap:wrap}`,
  `.hero-counts{display:flex;flex-wrap:wrap;gap:10px 14px;list-style:none;padding:0;margin:18px 0 22px;font-size:13.5px;font-weight:600;letter-spacing:0.02em;color:var(--ink-soft)}`,
  `.hero-counts__chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--line);border-radius:999px;background:var(--cream-2)}`,
  `.hero-counts__chip strong{color:var(--teal)}`,
  // Section heading skeleton — used by every below-fold section.
  // Without these the section headers collapse onto a single
  // unsized line when site-core.css hasn't applied yet.
  `.section-header{max-width:760px;margin-bottom:64px}`,
  `.section-header h2{margin-top:16px}`,
  `.section-header p{margin-top:20px;font-size:19px;line-height:1.55;color:var(--ink-soft);max-width:640px}`,
  `.section-center{text-align:center;margin-left:auto;margin-right:auto}`,
  // Trust strip — the band immediately under the hero on several
  // landing pages. Background + border, flex centering for the list.
  `.trust-strip{padding:18px 0;background:var(--cream-2);border-block:1px solid var(--line)}`,
  `.trust-strip__list{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 18px;list-style:none;padding:0;margin:0;font-size:13.5px;color:var(--ink-soft);line-height:1.5}`,
  // Footer skeleton. Color, padding, grid layout — enough that the
  // footer occupies its final dimensions on first paint and doesn't
  // reflow when site-core.css applies the decorative finish.
  `footer{background:var(--ink);color:rgba(250,247,242,0.7);padding:64px 0 36px;border-top:1px solid rgba(250,247,242,0.08);font-size:14px}`,
  `.foot-cta{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;padding-bottom:40px;margin-bottom:48px;border-bottom:1px solid rgba(250,247,242,0.08)}`,
  `.foot-cta-text{color:var(--cream);font-family:var(--font-display);font-size:clamp(22px,2.6vw,30px);line-height:1.2;letter-spacing:-0.01em;max-width:460px}`,
  `.foot-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr 1.1fr;gap:clamp(24px,3vw,44px);padding-bottom:48px;margin-bottom:32px;border-bottom:1px solid rgba(250,247,242,0.08)}`,
  `@media (max-width:1100px){.foot-grid{grid-template-columns:1fr 1fr 1fr 1fr;gap:36px}}`,
  `@media (max-width:960px){.foot-grid{grid-template-columns:1fr 1fr 1fr;gap:40px}}`,
  `@media (max-width:640px){.foot-grid{grid-template-columns:1fr 1fr}.foot-cta{flex-direction:column;align-items:flex-start;gap:20px}}`,
  `@media (max-width:420px){.foot-grid{grid-template-columns:1fr}}`,
  `.foot-bottom{display:flex;justify-content:space-between;gap:24px;align-items:center;flex-wrap:wrap}`,
  // Below-fold island utility — wrapper elements with class
  // below-fold-island skip painting + layout work until they scroll
  // near the viewport. Print stylesheet overrides for paper output.
  `.below-fold-island{content-visibility:auto;contain-intrinsic-size:auto 800px}`,
  `@media print{.below-fold-island{content-visibility:visible}}`,
].join('\n') + '\n';

// Anchor: end of the critical-CSS <style> block. The nav-critical
// injector terminates with `main{padding-top:64px}`. We insert our
// block immediately after, before the closing </style>.
const ANCHOR = 'main{padding-top:64px}\n</style>';
const ANCHOR_REPLACE = 'main{padding-top:64px}\n' + BLOCK + '</style>';

// Strip a prior version of the block if the sentinel exists, then
// re-inject. Allows the injector to absorb edits to BLOCK without
// leaving a stale duplicate.
const STRIP_RE = new RegExp(
  SENTINEL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '[\\s\\S]*?(?=' +
    'main\\{padding-top:64px\\}\\n</style>' +
    ')',
  'g'
);

let touched = 0;
let scanned = 0;

for (const f of walk(REPO)) {
  scanned++;
  const src = fs.readFileSync(f, 'utf8');
  if (!src.includes('Critical CSS — prevents flash')) continue;
  if (!src.includes(ANCHOR)) continue;

  // Strip any prior injection of the same sentinel block first, so
  // edits to BLOCK propagate cleanly across re-runs.
  let next = src.replace(STRIP_RE, '');

  // If the canonical block is already present (exact match), no-op.
  if (next.includes(SENTINEL) && next.includes(ANCHOR_REPLACE)) {
    if (next !== src) {
      if (!checkOnly) fs.writeFileSync(f, next);
      touched++;
    }
    continue;
  }

  next = next.replace(ANCHOR, ANCHOR_REPLACE);
  if (next === src) continue;

  if (!checkOnly) fs.writeFileSync(f, next);
  touched++;
}

console.log(
  `inject-critical-fonts: ${checkOnly ? 'would touch' : 'touched'} ${touched} of ${scanned} HTML file(s).`
);
if (checkOnly && touched > 0) process.exit(1);
process.exit(0);
