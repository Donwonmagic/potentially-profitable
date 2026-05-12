#!/usr/bin/env node
/**
 * Phase G — inline-critical-CSS nav extension.
 *
 * The async preload-onload pattern that loads site-core.css after
 * parse leaves the nav flashing unstyled on first paint:
 *   - "Muntin Digital" text renders in inherited serif font
 *   - SVG logo mark is unsized
 *   - desktop .nav-links flash visible on mobile
 *   - .nav-toggle (mobile menu) flashes hidden on mobile
 *
 * Fix: extend the inline critical CSS block with the minimum nav
 * rules so the header renders correctly on first paint without
 * waiting for site-core.css. Adds ~420 bytes inline per page;
 * eliminates the visible flash entirely.
 *
 * Idempotent: skips pages that already have the nav-critical block.
 * Marker comment "/_* nav-critical *_/" gates the injection. (Slashes
 * normalize in the regex so /* nav-critical *\/ counts as marker.)
 *
 *   node scripts/inject-critical-css-nav.mjs           # rewrite
 *   node scripts/inject-critical-css-nav.mjs --check   # exit 1 on drift
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

// Minimum nav rules to render the header correctly on first paint.
// Hand-extracted from assets/site-core.css. Stay in sync if those
// source rules change — if you see new flash, add the rule here.
const NAV_CRITICAL = [
  '/* nav-critical */',
  // Header height + horizontal layout
  '.nav{position:fixed;top:0;left:0;right:0;background:var(--cream);z-index:50;border-bottom:1px solid #E8E2D6}',
  '.nav-inner{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:64px;padding:12px 0}',
  // Logo: font + svg sizing so brand mark + wordmark land correctly
  '.logo{display:flex;align-items:center;gap:10px;font-family:Georgia,serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;flex-shrink:0;white-space:nowrap;color:inherit;text-decoration:none}',
  '.logo-mark{width:28px;height:28px;flex:0 0 28px}',
  '.tm{font-size:0.5em;vertical-align:super;margin-left:1px}',
  // Visibility split: desktop nav at ≥1100px, mobile toggle below
  '.nav-links{display:flex;gap:36px;font-size:15px}',
  '.nav-links a{text-decoration:none;color:inherit}',
  '.nav-toggle{display:none}',
  '.nav-search-btn,.lang-switch{display:none}',  // hidden until site-core.css can render them properly
  '@media (max-width:1100px){.nav-links{display:none}.nav-toggle{display:flex;width:44px;height:44px;flex-direction:column;justify-content:center;align-items:center;gap:5px;background:transparent;border:0;padding:0}.nav-toggle span{display:block;width:22px;height:2px;background:var(--ink)}.nav-inner .btn-primary{display:none}}',
  // Reserve space for the body content below the fixed nav
  'main{padding-top:64px}',
].join('\n');

// The inline critical CSS block we extend. Pattern keys off the
// "header.nav{min-height:64px}" line which is the last line of the
// hand-authored critical block in every page.
const MIN_HEIGHT_LINE = 'header.nav{min-height:64px}';
const MARKER = '/* nav-critical */';

let changed = 0;
let scanned = 0;

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || ent.name === 'node_modules' || ent.name === 'dist' || ent.name === '.wrangler' || ent.name === '_includes' || ent.name === 'audio') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && p.endsWith('.html')) out.push(p);
  }
  return out;
}

for (const file of walk(REPO)) {
  scanned++;
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes(MIN_HEIGHT_LINE)) continue;     // not a page with critical-CSS block
  if (src.includes(MARKER)) continue;               // already extended
  const next = src.replace(MIN_HEIGHT_LINE, MIN_HEIGHT_LINE + '\n' + NAV_CRITICAL);
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(file, next);
  changed++;
}

if (checkOnly && changed > 0) {
  console.error(`inject-critical-css-nav: ${changed} page(s) would update. Run without --check to apply.`);
  process.exit(1);
}
console.log(`inject-critical-css-nav: ${changed} of ${scanned} HTML file(s) ${checkOnly ? 'would update' : 'updated'}.`);
