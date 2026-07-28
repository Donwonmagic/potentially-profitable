#!/usr/bin/env node
/**
 * inject-event-exposure.mjs — adds the "Why these ingredients were exposed" block (ADR-019,
 * the events leg of the CHAIN) into every committed per-event detail page (EN + ES) WITHOUT a
 * full page rebuild. The events hub + 39 detail pages run AHEAD of the in-container build engine
 * (nav + JSON-LD), so a from-scratch regenerate would regress them; this injector is additive and
 * idempotent — each page carries an `event-exposure` sentinel in <body> and an
 * `event-exposure-css` sentinel in its <head> <style>; a re-run strips and rewrites both. The
 * rendered HTML is byte-identical to what emitEventPage() would emit (both import
 * scripts/lib/event-exposure.mjs).
 *
 *   node scripts/inject-event-exposure.mjs           # write
 *   node scripts/inject-event-exposure.mjs --check    # dry-run; exit 1 if any page is out of sync
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exposureSection, EXPOSURE_SENTINEL, EXPOSURE_CSS, EXPOSURE_CSS_SENTINEL } from './lib/event-exposure.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const rd = (p) => { try { return JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } };

const REG = (rd('cost-index/events.json') || {}).events || [];
const ISR = {}; for (const r of (rd('cost-index/ingredient-state-record.json') || {}).ingredients || []) ISR[r.slug] = r;
const LABELS = (rd('data/cost-index-labels.json') || {}).labels || {};
const nameOf = (slug, es) => { const l = LABELS[slug] || {}; return (es ? (l.es || l.en) : l.en) || (ISR[slug] && ISR[slug].name) || slug; };

// Insert the exposure section just before "The detected moves" (falling back to Sources), i.e.
// right after "Affected ingredients".
const ANCHORS = ['aria-labelledby="evd-mv-h"', 'aria-labelledby="evd-src-h"', 'aria-labelledby="evd-cmv-h"'];
function findSectionStart(html) {
  for (const a of ANCHORS) {
    const i = html.indexOf(a);
    if (i >= 0) { const s = html.lastIndexOf('<section', i); if (s >= 0) return s; }
  }
  return -1;
}
function strip(s, start, end) {
  const i = s.indexOf(start); if (i < 0) return s;
  const j = s.indexOf(end, i); if (j < 0) return s;
  return s.slice(0, i) + s.slice(j + end.length);
}

function processPage(file, ev, locale) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  const es = locale === 'es';
  const affected = (ev.affectedSlugs || []).map((slug) => ({ slug, name: nameOf(slug, es) }));
  const block = exposureSection(affected, ISR, locale);

  // 1) idempotent removal of any prior injection (body block + head CSS + stray blank lines)
  html = strip(html, EXPOSURE_SENTINEL.start, EXPOSURE_SENTINEL.end);
  html = strip(html, EXPOSURE_CSS_SENTINEL.start, EXPOSURE_CSS_SENTINEL.end);
  html = html.replace(/\n[ \t]*\n([ \t]*<section class="evd-section" aria-labelledby="evd-(mv|src|cmv)-h")/, '\n$1');
  html = html.replace(/\n[ \t]*\n([ \t]*<\/style>)/, '\n$1');

  if (block) {
    // 2a) CSS into the first <style> (head), before its </style>
    const styleEnd = html.indexOf('</style>');
    if (styleEnd < 0) return { status: 'no-style', changed: false };
    html = html.slice(0, styleEnd) + EXPOSURE_CSS + '\n' + html.slice(styleEnd);
    // 2b) body block before the anchor section, preserving indentation
    const sIdx = findSectionStart(html);
    if (sIdx < 0) return { status: 'no-anchor', changed: false };
    const lineStart = html.lastIndexOf('\n', sIdx) + 1;
    const indent = html.slice(lineStart, sIdx);
    html = html.slice(0, lineStart) + indent + block + '\n' + html.slice(lineStart);
  }

  const changed = html !== before;
  if (changed && !CHECK) fs.writeFileSync(file, html);
  return { status: block ? 'injected' : 'no-block', changed };
}

let injected = 0, cleared = 0, changed = 0, skipped = [];
for (const ev of REG) {
  if (!ev || !ev.id) continue;
  for (const [dir, locale] of [['cost-index/events', 'en'], ['es/cost-index/events', 'es']]) {
    const file = path.join(repo, dir, ev.id, 'index.html');
    if (!fs.existsSync(file)) { skipped.push(`${ev.id} (${locale}): missing`); continue; }
    const r = processPage(file, ev, locale);
    if (r.status === 'injected') injected++;
    else if (r.status === 'no-block') cleared++;
    else skipped.push(`${ev.id} (${locale}): ${r.status}`);
    if (r.changed) changed++;
  }
}

if (skipped.length) {
  console.error(`event-exposure inject — ${skipped.length} page(s) had no injection point:`);
  for (const s of skipped.slice(0, 20)) console.error('  - ' + s);
}
if (CHECK) {
  if (changed || skipped.some((s) => !/missing/.test(s))) { console.error(`✗ event-exposure: ${changed} page(s) out of sync — run: node scripts/inject-event-exposure.mjs`); process.exit(1); }
  console.log(`✓ event-exposure: all detail pages in sync (${injected} with a block).`);
} else {
  console.log(`event-exposure: injected ${injected} block(s), ${changed} file(s) changed${cleared ? `, ${cleared} kept block-free` : ''}.`);
}
