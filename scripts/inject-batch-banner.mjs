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
  const newLabel = locale === 'es' ? 'Nuevo esta semana' : 'New this week';
  return [
    '<!-- batch-banner:start -->',
    `<aside class="batch-marquee" data-batch="${escAttr(batch.key)}" role="complementary" aria-label="${escAttr(label)}" style="background:var(--ink,#14161A);color:var(--cream,#FAF7F2);font-size:14px;line-height:1.4;padding:8px 0;border-bottom:1px solid rgba(250,247,242,0.12)">`,
    `  <div style="max-width:1200px;margin:0 auto;padding:0 clamp(20px,4vw,64px);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">`,
    `    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0;flex:1 1 auto">`,
    `      <span style="display:inline-block;font-family:Inter,system-ui,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;background:var(--teal,#2A50C8);color:var(--cream,#FAF7F2);padding:3px 8px;border-radius:3px;white-space:nowrap;flex-shrink:0">${escHtml(newLabel)}</span>`,
    `      <span style="font-family:Georgia,serif;font-size:14px;font-style:italic;line-height:1.35;min-width:0">${escHtml(headline)}</span>`,
    `    </div>`,
    `    <a href="${escAttr(href)}" style="display:inline-flex;align-items:center;gap:6px;color:var(--ink,#14161A);background:var(--cream,#FAF7F2);text-decoration:none;font-family:Inter,system-ui,sans-serif;font-weight:600;font-size:12px;padding:5px 12px;border-radius:999px;white-space:nowrap;flex-shrink:0;transition:transform .15s ease">${escHtml(cta)} <span aria-hidden="true">${arrow}</span></a>`,
    `  </div>`,
    `</aside>`,
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
