#!/usr/bin/env node
/**
 * Sprint 13 (Cohesion) — inject the post-end "Workshop next step" CTA.
 *
 * Reads data/post-end-cta.json. For every published post with an
 * entry, stamps a CTA card between the post-end-mark and the
 * see-also block:
 *
 *   <!-- post-end-cta:start -->
 *   <aside class="post-end-cta">
 *     <p class="post-end-cta-headline">…</p>
 *     <p class="post-end-cta-body">…</p>
 *     <a class="btn btn-primary" href="/tools/X/?from=blog/SLUG&intent=watch">…</a>
 *   </aside>
 *   <!-- post-end-cta:end -->
 *
 * The block sits at the moment of highest reader intent (just
 * finished the article) and frames the relevant tool as the next
 * step — "save your starting numbers and watch them weekly." The
 * Calendly inline-cta blocks already in many posts stay where
 * they are; this is additive, not a replacement.
 *
 * Usage:
 *   node scripts/inject-post-end-cta.mjs           # rewrite in place
 *   node scripts/inject-post-end-cta.mjs --check   # exit 1 if any change
 *
 * Idempotent: re-running on already-injected posts produces no diff.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const data    = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data', 'post-end-cta.json'), 'utf8'));
const entries = data.posts || {};

const SENTINEL_RE = /<!-- post-end-cta:start -->[\s\S]*?<!-- post-end-cta:end -->/;
const SEE_ALSO_RE = /<!-- LIBRARY:see-also:start -->/;
const POST_END_RE = /<aside class="post-end-mark"[^>]*>[\s\S]*?<\/aside>/;

const LOCALES = [
  { code: 'en', dir: 'blog' },
  { code: 'es', dir: 'es/blog' },
];

function escapeAttr(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
}
function escapeText(s) {
  return String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;' })[c]);
}

function buildBlock(slug, entry, locale) {
  const url   = entry[`tool_url_${locale}`];
  const label = entry[`tool_label_${locale}`];
  const head  = entry[`headline_${locale}`];
  const body  = entry[`body_${locale}`];
  if (!url || !label || !head || !body) return null;
  const href = `${url}?from=blog%2F${encodeURIComponent(slug)}&intent=watch`;
  return [
    '<!-- post-end-cta:start -->',
    '    <aside class="post-end-cta" aria-label="Workshop next step">',
    `      <p class="post-end-cta-headline">${escapeText(head)}</p>`,
    `      <p class="post-end-cta-body">${escapeText(body)}</p>`,
    `      <a class="btn btn-primary" href="${escapeAttr(href)}">${escapeText(label)}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></svg></a>`,
    '    </aside>',
    '    <!-- post-end-cta:end -->',
  ].join('\n');
}

let changed = 0;
let skipped = 0;
const missing = [];

for (const [slug, entry] of Object.entries(entries)) {
  for (const { code, dir } of LOCALES) {
    const file = path.join(repoRoot, dir, slug, 'index.html');
    if (!fs.existsSync(file)) {
      missing.push(`${dir}/${slug}/index.html`);
      continue;
    }
    const block = buildBlock(slug, entry, code);
    if (!block) continue; // entry has no copy for this locale
    const src = fs.readFileSync(file, 'utf8');

    let next;
    if (SENTINEL_RE.test(src)) {
      next = src.replace(SENTINEL_RE, block);
    } else {
      // Insert just BEFORE the see-also marker (preferred) or just
      // after the post-end-mark (fallback).
      if (SEE_ALSO_RE.test(src)) {
        next = src.replace(SEE_ALSO_RE, `${block}\n\n    <!-- LIBRARY:see-also:start -->`);
      } else if (POST_END_RE.test(src)) {
        next = src.replace(POST_END_RE, (m) => `${m}\n\n    ${block}`);
      } else {
        console.warn(`  warn: ${path.relative(repoRoot, file)} has neither see-also nor post-end-mark anchor; skipping`);
        skipped++;
        continue;
      }
    }
    if (next === src) {
      skipped++;
      continue;
    }
    if (!checkOnly) fs.writeFileSync(file, next);
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
    changed++;
  }
}

if (missing.length) {
  console.warn(`\n${missing.length} post(s) referenced in data/post-end-cta.json but missing on disk:`);
  for (const m of missing) console.warn(`  ${m}`);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} file(s); ${skipped} unchanged.`);

if (checkOnly && changed > 0) process.exit(1);
