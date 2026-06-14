#!/usr/bin/env node
/**
 * Phase H — site-wide weekly-batch banner.
 *
 * The wave that ships every Sunday night through Monday morning needs
 * a discovery surface that isn't just /blog/. Without one, a first-
 * time visitor lands on the homepage and sees no signal that anything
 * new shipped — the overview article exists at the top of /blog/ but
 * the homepage / library hub / learn home / topic hubs / individual
 * articles all stay quiet.
 *
 * This script reads data/library-batches.json's `current_batch`,
 * builds the banner partial in EN + ES, and stamps it into every HTML
 * page right above the <header class="nav"> opener, between sentinels:
 *
 *   <!-- batch-banner:start -->
 *   <aside class="batch-banner" data-batch="2026-w1" lang="en">
 *     <a href="/blog/may-2026-wave-publishing-for-citation/" ...>
 *       <span class="batch-banner__label">Week 1 · May 11, 2026</span>
 *       <span class="batch-banner__headline">Nine pieces, one operating thesis.</span>
 *       <span class="batch-banner__cta">Read the batch →</span>
 *     </a>
 *   </aside>
 *   <!-- batch-banner:end -->
 *
 * Inline-styled (no dependency on site-core.css) so the banner renders
 * correctly even before the async stylesheet loads — same FOUC-aware
 * pattern as the nav-critical CSS injection.
 *
 * Locale-aware: pages under /es/ get the ES copy + ES overview link.
 * Hidden when current_batch.expires < today (auto-clean state).
 *
 *   node scripts/inject-batch-banner.mjs           # rewrite
 *   node scripts/inject-batch-banner.mjs --check   # exit 1 on drift
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- batch-banner:start -->[\s\S]*?<!-- batch-banner:end -->\n?/;
const NAV_OPEN_RE = /<header class="nav" id="nav">/;

const data = JSON.parse(fs.readFileSync(path.join(REPO, 'data/library-batches.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const batch = data.batches[data.current_batch];

// Auto-hide expired batches
const isExpired = batch && batch.expires && batch.expires < today;
const showBanner = batch && !isExpired;

function escAttr(s) { return String(s).replace(/"/g, '&quot;'); }
function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function buildBanner(locale) {
  if (!showBanner) {
    // Empty sentinel block — keeps the markers in place for next inject
    return '<!-- batch-banner:start --><!-- batch-banner:end -->';
  }
  const label = locale === 'es' ? batch.label_es : batch.label_en;
  const headline = locale === 'es' ? batch.headline_es : batch.headline_en;
  const cta = locale === 'es' ? (batch.cta_es || 'Leer el lote') : (batch.cta_en || 'Read the batch');
  const href = locale === 'es' ? batch.overview_es : batch.overview_en;
  const blurb = locale === 'es' ? batch.blurb_es : batch.blurb_en;
  const arrow = '&rarr;';
  // Banner is the first thing visible above the nav, so it has to read
  // as "something new shipped" within a second of first paint AND stay
  // short enough that the nav still sits above the mobile fold. Prior
  // iterations were either too quiet (10px padding, no eyebrow pill,
  // ~30px tall) or too loud (16px padding, 17px italic headline, 11px
  // date label, ~180px tall on mobile — pushed the Muntin Digital nav
  // below the fold on every load). This compromise: 8px padding, no
  // date label in the visible markup (it lives in aria-label for SR
  // users), 14px italic headline that wraps to two lines max on mobile,
  // smaller "New this week" pill, smaller pill CTA. Total height ~70-90px
  // on mobile depending on headline wrap, ~40px on desktop.
  // Surfaces use FIXED hex (not var(--ink)/var(--cream)) so the banner
  // does NOT invert in dark mode. The semantic tokens flip per theme,
  // which turned the strip into a plain light bar under a dark-mode
  // page; pinning the colours keeps it a consistent, striking dark
  // "Golden Hour" marquee in both themes.
  //
  // A course / standalone launch (type:'course') is the conversion
  // surface: a warm marigold->coral glow sits behind the CTA side (it
  // adds depth and pulls the eye toward the action), the pill is a
  // marigold "Free course" hook, and the CTA is a FILLED marigold
  // button — a coloured, high-affordance target, not a flat pill. A
  // weekly batch keeps the blue pill + cream CTA on the same dark strip.
  const isCourse = batch.type === 'course';
  const pillText = locale === 'es'
    ? (batch.pill_es || 'Nuevo esta semana')
    : (batch.pill_en || 'New this week');
  const pillBg = isCourse ? '#FFB020' : '#2A50C8';   // marigold | brand blue
  const pillFg = isCourse ? '#16181D' : '#F6F7F8';   // ink on marigold | cream on blue
  const ground = isCourse
    ? 'radial-gradient(160% 240% at 97% 50%,rgba(255,176,32,0.20) 0%,rgba(255,107,92,0.07) 33%,rgba(22,24,29,0) 60%),#16181D'
    : '#16181D';
  const ctaBg = isCourse ? '#FFB020' : '#F6F7F8';
  const ctaFg = '#16181D';
  return [
    '<!-- batch-banner:start -->',
    `<aside class="batch-marquee" data-batch="${escAttr(batch.key)}" role="complementary" aria-label="${escAttr(label)}" style="background:${ground};color:#F6F7F8;font-size:14px;line-height:1.4;padding:8px 0;border-bottom:1px solid rgba(246,247,248,0.16);box-shadow:inset 0 1px 0 rgba(255,255,255,0.05)">`,
    `  <div style="max-width:1200px;margin:0 auto;padding:0 clamp(20px,4vw,64px);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">`,
    `    <div style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1 1 auto">`,
    `      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0">`,
    `        <span style="display:inline-block;font-family:Inter,system-ui,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;background:${pillBg};color:${pillFg};padding:3px 8px;border-radius:3px;white-space:nowrap;flex-shrink:0">${escHtml(pillText)}</span>`,
    `        <span style="font-family:'Fraunces',Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;line-height:1.3;min-width:0;color:#F6F7F8">${escHtml(headline)}</span>`,
    `      </div>`,
    blurb ? `      <span style="font-family:Inter,system-ui,sans-serif;font-size:12px;line-height:1.3;color:rgba(246,247,248,0.72);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;min-width:0">${escHtml(blurb)}</span>` : '',
    `    </div>`,
    `    <a href="${escAttr(href)}" style="display:inline-flex;align-items:center;gap:6px;color:${ctaFg};background:${ctaBg};text-decoration:none;font-family:Inter,system-ui,sans-serif;font-weight:700;font-size:13px;padding:6px 14px;border-radius:999px;white-space:nowrap;flex-shrink:0;box-shadow:0 1px 2px rgba(0,0,0,0.18);transition:transform .15s ease,box-shadow .15s ease">${escHtml(cta)} <span aria-hidden="true">${arrow}</span></a>`,
    `  </div>`,
    `</aside>`,
    // The banner is position:fixed and the nav is offset below it by
    // var(--banner-h). A static --banner-h (40px / 72px mobile) can't
    // track a banner whose height changes when the italic headline
    // wraps — so the nav overlapped the banner's lower edge on narrow
    // screens / long headlines. This measures the real height and sets
    // --banner-h to it (inline style beats the CSS default + media
    // query), re-measuring on resize, on orientation change, and after
    // the Fraunces webfont swaps in (which changes the wrap). Runs at
    // parse time right after the <aside>, so it sets the var before the
    // async stylesheet pins anything. Removed automatically when the
    // banner is hidden (the whole block is re-stamped).
    `<script>(function(){var d=document.documentElement;function s(){var b=document.querySelector('.batch-marquee');if(b){d.style.setProperty('--banner-h',b.offsetHeight+'px');}}s();addEventListener('resize',s,{passive:true});addEventListener('orientationchange',s);if(document.fonts&&document.fonts.ready){document.fonts.ready.then(s);}})();</script>`,
    '<!-- batch-banner:end -->',
  ].join('\n');
}

function localeFromPath(file) {
  return file.includes(`${path.sep}es${path.sep}`) || file.endsWith(`${path.sep}es${path.sep}index.html`)
    ? 'es' : 'en';
}

function* walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || ent.name === 'node_modules' || ent.name === 'dist' || ent.name === '.wrangler' || ent.name === '_includes' || ent.name === 'audio') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(p);
    else if (ent.isFile() && p.endsWith('.html')) yield p;
  }
}

let changed = 0;
let stamped = 0;
let injected = 0;

for (const file of walk(REPO)) {
  const src = fs.readFileSync(file, 'utf8');
  if (!NAV_OPEN_RE.test(src)) continue;  // skip pages without the canonical nav
  const locale = localeFromPath(file);
  const banner = buildBanner(locale);
  let next;
  if (SENTINEL_RE.test(src)) {
    // Existing sentinel block — replace
    next = src.replace(SENTINEL_RE, banner + '\n');
    if (next !== src) stamped++;
  } else {
    // No sentinel — inject above the nav
    next = src.replace(NAV_OPEN_RE, banner + '\n<header class="nav" id="nav">');
    if (next !== src) injected++;
  }
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(file, next);
  changed++;
}

if (checkOnly && changed > 0) {
  console.error(`inject-batch-banner: ${changed} page(s) would update. Run without --check to apply.`);
  process.exit(1);
}
const status = showBanner ? `current batch: ${batch.key} (expires ${batch.expires})` : 'no current batch (banner hidden)';
console.log(`inject-batch-banner: ${injected} new injections, ${stamped} re-stamps; ${status}.`);
