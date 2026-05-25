#!/usr/bin/env node
/**
 * Stamp the §COURSE-MOBILE refinement CSS block into every Open the
 * Doors bootcamp lesson page (and the L14 generator, the hub, and
 * module overviews), idempotently. The block is the entire body of
 * the mobile-first refinement plan — touch-target floors, rail
 * collapse below 1024 px, widget grid-collapse below 480 px,
 * microinteractions bundle, view-transitions opt-in — all scoped to
 * course pages by class selector and by sentinel-stamped per-lesson
 * <style> block.
 *
 * Insertion anchor: right before </head>. Sentinel block is a self-
 * contained <style> unit so the stamper can refresh or remove it
 * cleanly without touching anything around it.
 *
 * Two posture decisions worth naming:
 *  1) Per-page sentinel-stamped block (not a shared CSS shell). This
 *     matches the established inject-course-* injector pattern, lets
 *     us refresh independently of `site-*.css` shell builds, and keeps
 *     the rules byte-identical across all 50+ stamped course pages
 *     (drift check via scripts/check-course-mobile-css.mjs).
 *  2) Zero new color tokens, scoped via course-unique class names
 *     (.course-pager, .course-rail, .course-widget, .track-picker,
 *     .term-link, .gen-step, .course-mc-btn) so the rules cannot leak
 *     to non-course pages.
 *
 * Usage:
 *   node scripts/inject-course-mobile-css.mjs            # rewrite
 *   node scripts/inject-course-mobile-css.mjs --check    # exit 1 if any change
 *   node scripts/inject-course-mobile-css.mjs --dry-run  # list, no writes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const dryRun    = args.has('--dry-run');

const MANIFEST_PATH = path.join(repoRoot, 'data', 'course-lessons.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

const SENTINEL_START = '<!-- course-mobile-css:start -->';
const SENTINEL_END   = '<!-- course-mobile-css:end -->';
const SENTINEL_RE    = /\n?\s*<!-- course-mobile-css:start -->[\s\S]*?<!-- course-mobile-css:end -->\n?/;

// Anchor: right before </head>. Lessons / hub / module pages are
// hand-authored so the indent is consistent (zero indent for </head>).
const ANCHOR_RE = /(\n<\/head>)/;

/**
 * The CSS block. Every rule is scoped to course-unique class names —
 * .course-pager, .course-rail, .course-widget, .track-picker,
 * .term-link, .gen-step, .course-mc-btn, .lpf-frame — so rules cannot
 * accidentally leak to non-course pages even though the block is
 * stamped into multiple page types.
 *
 * Selectors prefer @media (pointer:coarse) and @media (max-width:640px)
 * or @container so the desktop bytes are byte-for-byte unchanged.
 */
function buildBlock() {
  const css = [
    '<style id="course-mobile-css">',
    '/* §COURSE-MOBILE — stamped by scripts/inject-course-mobile-css.mjs */',

    // ---- View Transitions opt-in (browsers without API ignore) ----
    '@view-transition{navigation:auto}',
    '::view-transition-old(course-root),::view-transition-new(course-root){animation-duration:220ms;animation-timing-function:cubic-bezier(.16,1,.3,1)}',

    // ---- Smooth scroll within course area (in-page anchor jumps) ----
    'main:has(.course-hero),main:has(.course-syllabus-grid),main:has(.checklist){scroll-behavior:smooth}',
    '@media (prefers-reduced-motion:reduce){main:has(.course-hero),main:has(.course-syllabus-grid),main:has(.checklist){scroll-behavior:auto}}',

    // ---- Touch-target floor (44x44 minimum) — coarse pointer ----
    '@media (pointer:coarse){',
    '.course-pager a,.course-pager button,.track-picker button,.track-picker label.track-tile,.course-mc-btn,.gen-step>summary,.download-btn,.c-track-card,.c-pre-form label{min-height:44px}',
    '.course-pager a,.course-pager button{padding-block:max(10px,calc((44px - 1em)/2))}',
    '.c-pre-form label{padding:10px 12px;gap:12px}',
    '}',

    // ---- Press-scale microinteraction (coarse pointer + motion OK) ----
    '@media (pointer:coarse) and (prefers-reduced-motion:no-preference){',
    '.course-pager a,.course-pager button,.course-mc-btn,.track-picker button,.download-btn,.course-widget button,.c-track-card,.c-pre-form label{transition:transform 80ms ease}',
    '.course-pager a:active,.course-pager button:active,.course-mc-btn:active,.track-picker button:active,.download-btn:active,.course-widget button:active,.c-track-card:active,.c-pre-form label:active{transform:scale(.98)}',
    '}',

    // ---- Write-pulse keyframe (rail fires this on mtn:context-change) ----
    '@keyframes mtn-write-pulse{0%{box-shadow:0 0 0 0 color-mix(in oklab,var(--teal) 35%,transparent)}100%{box-shadow:0 0 0 12px transparent}}',
    '.course-rail [data-pulse="true"],.course-widget[data-pulse="true"]{animation:mtn-write-pulse 700ms ease-out}',
    '@media (prefers-reduced-motion:reduce){.course-rail [data-pulse="true"],.course-widget[data-pulse="true"]{animation:none}}',

    // ---- Rail collapse below 1024px (live-preview moves below the fold) ----
    '@media (max-width:1024px){',
    '.course-layout{grid-template-columns:minmax(0,1fr)!important;gap:24px}',
    '.course-rail{position:static!important;max-height:none!important;order:2}',
    '.course-body{order:1}',
    '.course-rail .lpf-frame{height:220px;transition:height 220ms ease}',
    '.course-rail [data-expanded="true"] .lpf-frame{height:70vh}',
    '.course-rail .rail-expand{display:inline-flex;align-items:center;gap:6px;margin-top:8px;font:600 13px/1 var(--font-body);padding:10px 14px;border-radius:99px;background:var(--cream-2);color:var(--teal-dark);border:1px solid var(--line);cursor:pointer;min-height:44px}',
    '.course-rail .rail-expand:focus-visible{outline:2px solid var(--teal);outline-offset:2px}',
    '}',

    // ---- Mobile-only widget remediation (≤ 640px) ----
    '@media (max-width:640px){',
    // body inputs avoid iOS zoom
    '.course-widget input[type="text"],.course-widget input[type="number"],.course-widget input[type="search"],.course-widget input[type="tel"],.course-widget input[type="email"],.course-widget input[type="url"],.course-widget textarea,.course-widget select{font-size:16px}',

    // palette-picker — bigger swatches
    '.course-widget[data-widget="palette-picker"] .pp-swatch,.course-widget[data-widget="palette-picker"] .swatch{min-width:56px;min-height:56px}',
    '.course-widget[data-widget="palette-picker"] .pp-swatches,.course-widget[data-widget="palette-picker"] .swatches{gap:12px}',

    // voice-slider — bigger thumbs
    '.course-widget[data-widget="voice-slider"] input[type="range"]{height:28px}',
    '.course-widget[data-widget="voice-slider"] input[type="range"]::-webkit-slider-thumb{width:28px;height:28px}',
    '.course-widget[data-widget="voice-slider"] input[type="range"]::-moz-range-thumb{width:28px;height:28px}',

    // drag-rank — bigger rows + drag handles
    '.course-widget[data-widget="drag-rank"] .drag-item,.course-widget[data-widget="drag-rank"] li.dr-item,.course-widget[data-widget="drag-rank"] li{min-height:56px}',
    '.course-widget[data-widget="drag-rank"] .drag-handle,.course-widget[data-widget="drag-rank"] .dr-handle{min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center}',

    // menu-builder — bigger rows
    '.course-widget[data-widget="menu-builder"] .menu-row,.course-widget[data-widget="menu-builder"] li.dish,.course-widget[data-widget="menu-builder"] .mb-row{min-height:56px}',
    '.course-widget[data-widget="menu-builder"] .mb-reorder,.course-widget[data-widget="menu-builder"] .dish-handle,.course-widget[data-widget="menu-builder"] .mb-handle{min-width:44px;min-height:44px}',

    // before-after-slider — bigger thumbs
    '.course-widget[data-widget="before-after-slider"] .bas-thumb,.course-widget[data-widget="before-after-slider"] .ba-handle,.course-widget[data-widget="before-after-slider"] .bas-handle{width:28px;height:28px}',

    // tab-flip — bigger tabs
    '.course-widget[data-widget="tab-flip"] [role="tab"],.course-widget[data-widget="tab-flip"] .tf-tab{min-height:44px}',

    // persona-card-builder — single-column collapse
    '.course-widget[data-widget="persona-card-builder"] .pcb-grid,.course-widget[data-widget="persona-card-builder"] .pcb-form{grid-template-columns:1fr}',

    // positioning-plotter — bound to viewport
    '.course-widget[data-widget="positioning-plotter"] .pp-grid,.course-widget[data-widget="positioning-plotter"] .plotter-grid,.course-widget[data-widget="positioning-plotter"] .pos-plot{max-width:min(280px,calc(100vw - 32px))}',

    // font-pair-picker — single-column collapse
    '.course-widget[data-widget="font-pair-picker"] .fpp-grid,.course-widget[data-widget="font-pair-picker"] .fp-combos{grid-template-columns:1fr}',

    // shot-list-grid — auto-fit
    '.course-widget[data-widget="shot-list-grid"] .slg-grid,.course-widget[data-widget="shot-list-grid"] .sl-grid{grid-template-columns:repeat(auto-fit,minmax(96px,1fr))}',

    // weekly-hours-grid — fluid columns
    '.course-widget[data-widget="weekly-hours-grid"] .whg-grid,.course-widget[data-widget="weekly-hours-grid"] .wh-grid,.course-widget[data-widget="weekly-hours-grid"] .hours-week{grid-template-columns:repeat(7,minmax(40px,1fr))}',

    // gbp-card-preview — fluid padding
    '.course-widget[data-widget="gbp-card-preview"] .gcp-card,.course-widget[data-widget="gbp-card-preview"] .gbp-card{padding:clamp(12px,4vw,24px)}',

    // map-radius — bigger thumb + always-visible readout
    '.course-widget[data-widget="map-radius"] input[type="range"]{height:28px}',
    '.course-widget[data-widget="map-radius"] input[type="range"]::-webkit-slider-thumb{width:28px;height:28px}',
    '.course-widget[data-widget="map-radius"] input[type="range"]::-moz-range-thumb{width:28px;height:28px}',

    // keyword-builder — tight chips
    '.course-widget[data-widget="keyword-builder"] .kb-chip,.course-widget[data-widget="keyword-builder"] .keyword{min-height:36px;padding:8px 12px}',

    // rhythm-calendar — bound the grid
    '.course-widget[data-widget="rhythm-calendar"] .rc-grid,.course-widget[data-widget="rhythm-calendar"] .calendar-grid{max-width:clamp(280px,92vw,480px);margin-inline:auto}',

    // .term-link — bigger tap-area without changing visual
    '.term-link{padding:2px 1px;display:inline-block}',

    '}',  // end @media (max-width:640px)

    // ---- Single-column persona/font collapse below 480 px (extra-narrow) ----
    '@media (max-width:480px){',
    '.course-widget[data-widget="persona-card-builder"] .pcb-grid,.course-widget[data-widget="font-pair-picker"] .fpp-grid,.course-widget[data-widget="font-pair-picker"] .fp-combos{grid-template-columns:1fr;gap:12px}',
    '}',

    // ---- Container queries — widgets adapt to their own container ----
    '.course-widget{container-type:inline-size}',
    '@container (max-width:380px){',
    '.pp-grid,.plotter-grid,.fpp-grid,.pcb-grid,.fp-combos{grid-template-columns:1fr}',
    '}',

    // ---- L14 generator: accordion-stepper on mobile, native layout on desktop ----
    '@media (max-width:768px){',
    'details.gen-step{margin:18px 0;border:1px solid var(--line);border-radius:10px;background:var(--cream);overflow:hidden}',
    'details.gen-step>summary{cursor:pointer;list-style:none;padding:16px 18px;font:600 15px/1.3 var(--font-body);color:var(--teal-dark);display:flex;align-items:center;gap:10px;min-height:44px}',
    'details.gen-step>summary::-webkit-details-marker{display:none}',
    'details.gen-step>summary::after{content:"›";margin-left:auto;font-size:22px;transition:transform 180ms ease;line-height:1}',
    'details.gen-step[open]>summary::after{transform:rotate(90deg)}',
    'details.gen-step>:not(summary){padding:0 18px 18px}',
    '.gen-stepper-map{display:flex;gap:8px;justify-content:center;margin:18px 0}',
    '.gen-stepper-map .dot{width:28px;height:28px;border-radius:50%;background:var(--cream-2);color:var(--stone);display:inline-flex;align-items:center;justify-content:center;font:600 12px/1 var(--font-body);border:1px solid var(--line)}',
    '.gen-stepper-map .dot[data-active="true"]{background:var(--teal);color:var(--cream);border-color:var(--teal)}',
    '.gen-stepper-map .dot[data-ready="true"]{background:var(--status-good);color:var(--cream);border-color:var(--status-good)}',
    '}',
    '@media (min-width:769px){',
    'details.gen-step{display:contents}',
    'details.gen-step>summary{display:none}',
    '.gen-stepper-map{display:none}',
    '}',

    // ---- Hub picker tile sizing ----
    '.track-picker label.track-tile{display:flex;align-items:flex-start;gap:14px;padding:18px;border-radius:12px;border:1px solid var(--line);background:var(--cream);cursor:pointer;min-height:88px}',
    '.track-picker input[type="radio"]:checked + label.track-tile,.track-picker label.track-tile:has(input:checked){border-color:var(--teal);background:color-mix(in oklab,var(--teal) 6%,var(--cream))}',
    '@media (max-width:640px){.track-picker label.track-tile{padding:16px;gap:12px}}',

    '</style>'
  ].join('');

  return [
    SENTINEL_START,
    css,
    SENTINEL_END
  ].join('\n');
}

function lessonHtmlPath(lesson, locale) {
  const rel = lesson.path.replace(/^\//, '').replace(/\/$/, '');
  const base = locale === 'es' ? path.join(repoRoot, 'es', rel) : path.join(repoRoot, rel);
  return path.join(base, 'index.html');
}

const EXTRA_PAGES = [
  'course/index.html',
  'es/course/index.html',
  'course/m1-orient/index.html',
  'es/course/m1-orient/index.html',
  'course/m2-decide/index.html',
  'es/course/m2-decide/index.html',
  'course/m3-assemble/index.html',
  'es/course/m3-assemble/index.html',
  'course/m4-launch/index.html',
  'es/course/m4-launch/index.html',
  'course/accessibility/index.html',
  'es/course/accessibility/index.html'
];

function transform(src) {
  const block = buildBlock();
  if (SENTINEL_RE.test(src)) {
    const next = src.replace(SENTINEL_RE, '\n' + block + '\n');
    return next === src ? null : next;
  }
  if (!ANCHOR_RE.test(src)) return undefined;
  return src.replace(ANCHOR_RE, '\n' + block + '$1');
}

let stamped = 0;
let unchanged = 0;
let skipped = 0;
const noAnchor = [];

const targets = [];
for (const lesson of manifest.lessons) {
  for (const locale of ['en', 'es']) {
    targets.push(lessonHtmlPath(lesson, locale));
  }
}
for (const rel of EXTRA_PAGES) {
  targets.push(path.join(repoRoot, rel));
}

for (const filePath of targets) {
  if (!fs.existsSync(filePath)) { skipped++; continue; }

  const src = fs.readFileSync(filePath, 'utf8');
  const result = transform(src);

  if (result === null) { unchanged++; continue; }
  if (result === undefined) {
    noAnchor.push(path.relative(repoRoot, filePath));
    continue;
  }

  stamped++;
  if (!checkOnly && !dryRun) fs.writeFileSync(filePath, result);
}

if (noAnchor.length) {
  console.warn(`\ninject-course-mobile-css: ${noAnchor.length} page(s) missing the </head> anchor — skipped:`);
  for (const f of noAnchor.slice(0, 5)) console.warn(`  ${f}`);
  if (noAnchor.length > 5) console.warn(`  …and ${noAnchor.length - 5} more`);
}

console.log(`inject-course-mobile-css: ${stamped} stamped, ${unchanged} unchanged, ${skipped} skipped (page missing).`);

if (checkOnly && stamped > 0) {
  console.error(`inject-course-mobile-css: ${stamped} file(s) would change under --check (exit 1).`);
  process.exit(1);
}
process.exit(0);
