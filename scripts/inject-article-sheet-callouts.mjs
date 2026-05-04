#!/usr/bin/env node
/**
 * Operator Sheets · per-article inline callouts (Phase C9).
 *
 * Reads data/article-sheet-callouts.json and stamps a quiet
 * `<aside class="article-sheet-callout">` right after the matching
 * <h2 id="..."> in the article body. The post-end-cta is the
 * moment-of-intent push at the close of the article; this is the
 * section-of-intent push at the moment the operator just read the
 * paragraph that maps to the sheet.
 *
 * Sentinel-bracketed (article-sheet-callout:start/end) so re-runs
 * are idempotent. Per-article cap of 1 callout (the data file may
 * declare more, but the first matched anchor wins to keep articles
 * calm).
 *
 * Section anchor: matches `<h2 id="anchor-h2">…</h2>` exactly. If
 * the H2's id changes upstream, the callout silently no-ops on
 * that article rather than misplace itself.
 *
 *   node scripts/inject-article-sheet-callouts.mjs           # rewrite
 *   node scripts/inject-article-sheet-callouts.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /\n[ \t]*<!-- article-sheet-callout:start -->[\s\S]*?<!-- article-sheet-callout:end -->/g;

const calloutsPath = path.join(repoRoot, 'data', 'article-sheet-callouts.json');
const sheetsPath   = path.join(repoRoot, 'data', 'sheets.json');
if (!fs.existsSync(calloutsPath)) { console.log('article-sheet-callouts.json missing — skipping'); process.exit(0); }
if (!fs.existsSync(sheetsPath))   { console.log('sheets.json missing — skipping'); process.exit(0); }

const CALLOUTS = JSON.parse(fs.readFileSync(calloutsPath, 'utf8')).callouts || {};
const SHEETS   = JSON.parse(fs.readFileSync(sheetsPath, 'utf8')).sheets || {};

function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function escText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function pickI18n(o, key, locale) { return o[`${key}_${locale}`]; }

const COPY = {
  en: { eyebrow: 'Pair with paperwork', cta: 'Open the sheet' },
  es: { eyebrow: 'Empareja con papeleo', cta: 'Abrir la hoja' },
};

function buildBlock(callout, locale) {
  const sheet = SHEETS[callout.sheet];
  if (!sheet || sheet.status !== 'live') return null;
  const c = COPY[locale];
  const sheetTitle    = pickI18n(sheet, 'title',    locale);
  const sheetWalkaway = pickI18n(sheet, 'walkaway', locale);
  const sheetUrl      = pickI18n(sheet, 'url',      locale);
  const lead = locale === 'es' ? callout.lead_es : callout.lead_en;
  if (!lead || !sheetTitle || !sheetUrl) return null;

  return `<!-- article-sheet-callout:start -->
    <aside class="article-sheet-callout" aria-label="${escAttr(c.eyebrow)}" style="margin:24px 0;padding:16px 18px;border:1px solid var(--line,#E5DFD2);border-left:3px solid var(--teal,#1F4E5B);border-radius:6px;background:var(--cream-2,#F3EEE3);">
      <p style="margin:0 0 6px;font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--teal,#1F4E5B);">${escText(c.eyebrow)}</p>
      <p style="margin:0 0 8px;font-size:14.5px;line-height:1.55;color:var(--ink,#14161A);">${escText(lead)}</p>
      <p style="margin:0;font-size:13.5px;line-height:1.4;">
        <a href="${escAttr(sheetUrl)}" style="color:var(--teal,#1F4E5B);font-weight:600;text-decoration:none;border-bottom:1px solid currentColor;">${escText(sheetTitle)}</a>
        <span style="color:var(--stone,#6B6B6B);"> &nbsp;·&nbsp; ${escText(sheetWalkaway)}</span>
      </p>
    </aside>
    <!-- article-sheet-callout:end -->`;
}

function injectCallout(html, anchor, block) {
  // Two-mode anchor:
  //   anchor_h2          → id-based match on <h2 id="…">
  //   anchor_h2_contains → substring match on the H2 text content
  // The substring form is the working pattern for articles whose H2s
  // don't carry IDs (most posts on this site today).
  const candidates = [];
  const re = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    candidates.push({ start: m.index, end: m.index + m[0].length, attrs: m[1], inner: m[2] });
  }
  for (const c of candidates) {
    if (anchor.id) {
      const idMatch = c.attrs.match(/\bid="([^"]+)"/);
      if (idMatch && idMatch[1] === anchor.id) {
        return html.slice(0, c.end) + '\n    ' + block + html.slice(c.end);
      }
    }
    if (anchor.contains) {
      const text = c.inner.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').toLowerCase();
      if (text.indexOf(anchor.contains.toLowerCase()) !== -1) {
        return html.slice(0, c.end) + '\n    ' + block + html.slice(c.end);
      }
    }
  }
  return null;
}

let changed = 0;
let skipped = 0;
const missingAnchors = [];

for (const [postSlug, calloutList] of Object.entries(CALLOUTS)) {
  for (const root of [['en', 'blog'], ['es', 'es/blog']]) {
    const [locale, dir] = root;
    const file = path.join(repoRoot, dir, postSlug, 'index.html');
    if (!fs.existsSync(file)) continue;
    let src = fs.readFileSync(file, 'utf8');
    const original = src;
    // Strip any prior callouts before re-stamping (idempotency).
    src = src.replace(SENTINEL_RE, '');
    // Cap at 1 callout per article — first matched anchor wins.
    let stamped = false;
    for (const c of calloutList) {
      if (stamped) break;
      const block = buildBlock(c, locale);
      if (!block) continue;
      // Locale-specific anchor text wins; fall back to the
      // locale-neutral field for backward compat.
      const localeContains = locale === 'es' ? c.anchor_h2_contains_es : c.anchor_h2_contains_en;
      const anchor = {
        id: c.anchor_h2_id || null,
        contains: localeContains || c.anchor_h2_contains || c.anchor_h2 || null,
      };
      const next = injectCallout(src, anchor, block);
      if (!next) {
        const ref = anchor.id ? '#' + anchor.id : '"' + anchor.contains + '"';
        missingAnchors.push(`${postSlug} (${locale}): h2 ${ref} not found`);
        continue;
      }
      src = next;
      stamped = true;
    }
    if (src === original) { skipped++; continue; }
    if (!checkOnly) fs.writeFileSync(file, src);
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
    changed++;
  }
}

if (missingAnchors.length) {
  console.warn('\nanchors not found (callout silently no-op-ed):');
  for (const a of missingAnchors) console.warn('  · ' + a);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} article(s); ${skipped} unchanged.`);
if (checkOnly && changed > 0) process.exit(1);
