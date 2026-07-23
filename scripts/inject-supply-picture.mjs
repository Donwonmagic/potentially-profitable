#!/usr/bin/env node
/**
 * inject-supply-picture.mjs — refreshes the static "Where it comes from" block (ADR-018 surface 2) into
 * every committed /cost-index/<slug>/ page (EN + ES) from the Ingredient State Record, WITHOUT running the
 * full page builder (which is ahead of the committed pages — see the engine-behind-pages note). Idempotent:
 * each page carries a `supply-picture` sentinel in <body> and a `supply-picture-css` sentinel in its <head>
 * <style>; a re-run strips and rewrites both. The rendered HTML is byte-identical to what
 * build-cost-index-pages.mjs would emit (both import scripts/lib/supply-picture.mjs).
 *
 *   node scripts/inject-supply-picture.mjs           # write
 *   node scripts/inject-supply-picture.mjs --check    # dry-run; exit 1 if any page is out of sync
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { supplyPicture, SUPPLY_SENTINEL, SUPPLY_CSS, SUPPLY_CSS_SENTINEL } from './lib/supply-picture.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const ISR = (() => { try { return JSON.parse(fs.readFileSync(path.join(repo, 'cost-index/ingredient-state-record.json'), 'utf8')).ingredients || []; } catch { return []; } })();
const BY = {}; for (const r of ISR) BY[r.slug] = r;

// Insertion point, first match wins: full pages put the block before the weekly-signup wrapper (exactly
// where the builder places importContextBlock); minimal scaffold/"expanding" pages (most seafood, which
// carry no wholesale series) have no signup, so fall back to their end-of-main cta-row.
const ANCHORS = ['<div class="ci-signup', '<div class="ci-cta-row'];
function findAnchor(html) {
  let best = -1;
  for (const a of ANCHORS) { const i = html.indexOf(a); if (i >= 0 && (best < 0 || i < best)) best = i; }
  return best;
}

// strip an existing sentinel-delimited region (+ a trailing newline it left), returning the cleaned string
function strip(s, start, end) {
  const i = s.indexOf(start);
  if (i < 0) return s;
  const j = s.indexOf(end, i);
  if (j < 0) return s; // corrupt; leave as-is, reported by the caller
  let out = s.slice(0, i) + s.slice(j + end.length);
  return out;
}

function processPage(file, slug, locale) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  const { html: block } = supplyPicture(BY[slug], locale);

  // 1) idempotent removal of any prior injection (body block + head CSS + a stray blank line)
  html = strip(html, SUPPLY_SENTINEL.start, SUPPLY_SENTINEL.end);
  html = strip(html, SUPPLY_CSS_SENTINEL.start, SUPPLY_CSS_SENTINEL.end);
  html = html.replace(/\n[ \t]*\n([ \t]*<div class="ci-(signup|cta-row))/, '\n$1');
  html = html.replace(/\n[ \t]*\n([ \t]*<\/style>)/, '\n$1');

  if (block) {
    // 2a) CSS into the FIRST <style> (head), just before its </style>
    const styleEnd = html.indexOf('</style>');
    if (styleEnd < 0) return { status: 'no-style', changed: false };
    html = html.slice(0, styleEnd) + SUPPLY_CSS + '\n' + html.slice(styleEnd);
    // 2b) body block immediately before the insertion anchor, preserving its indentation
    const aIdx = findAnchor(html);
    if (aIdx < 0) return { status: 'no-anchor', changed: false };
    const lineStart = html.lastIndexOf('\n', aIdx) + 1;
    const indent = html.slice(lineStart, aIdx);
    html = html.slice(0, lineStart) + block + '\n' + indent + html.slice(lineStart + indent.length);
  }

  const changed = html !== before;
  if (changed && !CHECK) fs.writeFileSync(file, html);
  return { status: block ? 'injected' : 'no-block', changed };
}

function slugPages() {
  const out = [];
  for (const [dir, locale] of [['cost-index', 'en'], ['es/cost-index', 'es']]) {
    const abs = path.join(repo, dir);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs)) {
      const file = path.join(abs, name, 'index.html');
      if (BY[name] && fs.existsSync(file)) out.push({ file, slug: name, locale });
    }
  }
  return out;
}

let injected = 0, cleared = 0, changed = 0, skipped = [];
for (const { file, slug, locale } of slugPages()) {
  const r = processPage(file, slug, locale);
  if (r.status === 'injected') injected++;
  else if (r.status === 'no-block') cleared++;
  else skipped.push(`${slug} (${locale}): ${r.status}`);
  if (r.changed) changed++;
}

if (skipped.length) {
  console.error(`supply-picture inject — ${skipped.length} page(s) had no injection point:`);
  for (const s of skipped.slice(0, 20)) console.error('  - ' + s);
}
if (CHECK) {
  if (changed) { console.error(`✗ supply-picture: ${changed} page(s) out of sync — run: node scripts/inject-supply-picture.mjs`); process.exit(1); }
  console.log(`✓ supply-picture: all pages in sync (${injected} with a block).`);
} else {
  console.log(`supply-picture: injected ${injected} block(s), ${changed} file(s) changed${cleared ? `, ${cleared} kept block-free` : ''}.`);
}
