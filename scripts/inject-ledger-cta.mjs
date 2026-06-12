#!/usr/bin/env node
/**
 * Ledger funnel — inject the end-of-article "see the product" CTA that
 * routes high-intent finance / privacy library readers to the sister
 * product, Muntin Ledger (https://ledger.muntin.digital).
 *
 * Reads data/ledger-cta.json. For every listed article that exists on
 * disk, stamps a CTA card between sentinels:
 *
 *   <!-- ledger-cta:start -->
 *   <aside class="post-end-cta" aria-label="Muntin Ledger">
 *     <p class="post-end-cta-headline">…</p>
 *     <p class="post-end-cta-body">…</p>
 *     <a class="btn btn-primary plausible-event-name=Ledger+Route+Click
 *        plausible-event-source=<slug>" href="https://ledger.muntin.digital/">…</a>
 *   </aside>
 *   <!-- ledger-cta:end -->
 *
 * Placement: AFTER the existing tool post-end-cta + smart-next blocks
 * (so the reader gets the article's own tool/sheet first, then "and
 * here is the product"). Insert priority: after <!-- smart-next:end -->,
 * else after <!-- post-end-cta:end -->, else before the see-also
 * marker, else after the post-end-mark. This injector OWNS only its own
 * sentinels; it never touches the tool-CTA / smart-next / knit-rail
 * blocks, so their idempotency checks stay green.
 *
 * Measurement: the anchor is a plain external link (passes link equity
 * to Ledger) carrying Plausible's declarative class API. On click it
 * fires the registered 'Ledger Route Click' event (see
 * tools/_shared/analytics.js) with a bounded { source: '<slug>' } prop,
 * and — because the anchor carries a plausible-event-name class —
 * Plausible suppresses its automatic outbound-link event on the same
 * click, so there is no double-count. Nav-link clicks (which carry no
 * such class) are still captured by the automatic outbound tracking.
 *
 * Usage:
 *   node scripts/inject-ledger-cta.mjs           # rewrite in place
 *   node scripts/inject-ledger-cta.mjs --check   # exit 1 if any change
 *
 * Idempotent: re-running on already-injected articles produces no diff.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const LEDGER_URL = 'https://ledger.muntin.digital/';

const data    = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data', 'ledger-cta.json'), 'utf8'));
const entries = data.posts || {};

const SENTINEL_RE       = /<!-- ledger-cta:start -->[\s\S]*?<!-- ledger-cta:end -->/;
const SMART_NEXT_END_RE = /<!-- smart-next:end -->/;
const POST_END_CTA_END  = /<!-- post-end-cta:end -->/;
const SEE_ALSO_RE       = /<!-- LIBRARY:see-also:start -->/;
const POST_END_MARK_RE  = /<aside class="post-end-mark"[^>]*>[\s\S]*?<\/aside>/;

// Mirror inject-post-end-cta.mjs: evergreen lives in /library/, timely
// in /blog/; ES under es/. First-found-wins (library is canonical).
const LOCALES = [
  { code: 'en', dirs: ['library', 'blog'] },
  { code: 'es', dirs: ['es/library', 'es/blog'] },
];

// ES posts live under TRANSLATED slugs (data/i18n-slug-map.json) —
// same fix as inject-post-end-cta.mjs (2026-06-11): without it the ES
// pass searched es/*/<EN-slug> and silently skipped every translated
// mirror, so the Spanish posts never carried the Ledger CTA at all.
const slugMap = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data', 'i18n-slug-map.json'), 'utf8'));
  } catch { return {}; }
})();
function esSlugFor(dir, enSlug) {
  const ns = dir.replace(/^es\//, '');
  const map = slugMap[ns];
  return (map && map[enSlug]) || enSlug;
}

function escapeText(s) {
  return String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
}

function buildBlock(slug, entry, locale) {
  const head  = entry[`headline_${locale}`];
  const body  = entry[`body_${locale}`];
  const label = entry[`label_${locale}`];
  if (!head || !body || !label) return null;
  // The slug is the article slug (kebab-case [a-z0-9-]) — safe inside a
  // class token and as a Plausible prop value, no escaping needed. The
  // href is a fixed external URL; deliberately NO ?intent= param (that
  // is reserved for local /tools/ + /sheets/ and is gate-validated).
  return [
    '<!-- ledger-cta:start -->',
    '    <aside class="post-end-cta" aria-label="Muntin Ledger">',
    `      <p class="post-end-cta-headline">${escapeText(head)}</p>`,
    `      <p class="post-end-cta-body">${escapeText(body)}</p>`,
    `      <a class="btn btn-primary plausible-event-name=Ledger+Route+Click plausible-event-source=${slug}" href="${LEDGER_URL}">${escapeText(label)}<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></svg></a>`,
    '    </aside>',
    '    <!-- ledger-cta:end -->',
  ].join('\n');
}

let changed = 0;
let skipped = 0;
const missing = [];

for (const [slug, entry] of Object.entries(entries)) {
  for (const { code, dirs } of LOCALES) {
    let file = null;
    for (const dir of dirs) {
      const localSlug = code === 'es' ? esSlugFor(dir, slug) : slug;
      const candidate = path.join(repoRoot, dir, localSlug, 'index.html');
      if (fs.existsSync(candidate)) { file = candidate; break; }
    }
    if (!file) {
      // EN is required; a missing ES translation is normal (skip quietly).
      if (code === 'en') missing.push(`${dirs[0]}/${slug}/index.html`);
      continue;
    }
    const block = buildBlock(slug, entry, code);
    if (!block) continue; // entry has no copy for this locale

    const src = fs.readFileSync(file, 'utf8');
    let next;
    if (SENTINEL_RE.test(src)) {
      next = src.replace(SENTINEL_RE, block);
    } else if (SMART_NEXT_END_RE.test(src)) {
      next = src.replace(SMART_NEXT_END_RE, (m) => `${m}\n\n    ${block}`);
    } else if (POST_END_CTA_END.test(src)) {
      next = src.replace(POST_END_CTA_END, (m) => `${m}\n\n    ${block}`);
    } else if (SEE_ALSO_RE.test(src)) {
      next = src.replace(SEE_ALSO_RE, `${block}\n\n    <!-- LIBRARY:see-also:start -->`);
    } else if (POST_END_MARK_RE.test(src)) {
      next = src.replace(POST_END_MARK_RE, (m) => `${m}\n\n    ${block}`);
    } else {
      console.warn(`  warn: ${path.relative(repoRoot, file)} has no ledger-cta anchor (smart-next / post-end-cta / see-also / post-end-mark); skipping`);
      skipped++;
      continue;
    }

    if (next === src) { skipped++; continue; }
    if (!checkOnly) fs.writeFileSync(file, next);
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
    changed++;
  }
}

if (missing.length) {
  console.warn(`\n${missing.length} article(s) referenced in data/ledger-cta.json but missing on disk:`);
  for (const m of missing) console.warn(`  ${m}`);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} file(s); ${skipped} unchanged.`);

if (checkOnly && changed > 0) process.exit(1);
