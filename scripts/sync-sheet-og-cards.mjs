#!/usr/bin/env node
/**
 * Operator Sheets · OG card manifest sync.
 *
 * Reads data/sheets.json and idempotently maintains a `sheet-<slug>` /
 * `sheet-<slug>-es` entry in brand/og/cards.json for every live sheet
 * — so each sheet ships its own social-share + Google Discover card
 * instead of sharing the /tools/ hub fallback.
 *
 * Runs BEFORE scripts/build-og-cards.mjs in the build chain (which
 * walks cards.json and renders SVG + PNG per entry). Idempotent:
 * dedups by slug, sorts the appended block stably, and only writes
 * cards.json when content changes.
 *
 * Title-splitting heuristic for the OG template's title_1 / title_italic
 * / title_2 trio:
 *   1 word  → title_1=""  title_italic=word(lower)            title_2="."
 *   2 words → title_1=w1  title_italic=w2(lower)              title_2="."
 *   ≥3 words → title_1=w1 title_italic=w2(lower)              title_2=rest+"."
 * Acronyms (ALL-CAPS or contains digit) preserve case in title_italic.
 *
 * Accent + glyph mapping is per pack:
 *   operations-margin → accent=gold,  glyph=resources
 *   local-seo         → accent=teal,  glyph=local-seo
 *   conversions       → accent=rust,  glyph=conversions
 *   brand-design      → accent=teal,  glyph=brand
 *   trust-reviews     → accent=ink,   glyph=trust
 *
 *   node scripts/sync-sheet-og-cards.mjs           # rewrite cards.json
 *   node scripts/sync-sheet-og-cards.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SHEETS_PATH = path.join(REPO, 'data', 'sheets.json');
const CARDS_PATH  = path.join(REPO, 'brand', 'og', 'cards.json');

const SHEETS = JSON.parse(fs.readFileSync(SHEETS_PATH, 'utf8'));
const cards  = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));

const PACK_STYLE = {
  'operations-margin': { accent: 'gold', glyph: 'resources',   focus: 'stat' },
  'local-seo':         { accent: 'teal', glyph: 'local-seo',   focus: 'checks' },
  'conversions':       { accent: 'rust', glyph: 'conversions', focus: 'funnel' },
  'brand-design':      { accent: 'teal', glyph: 'brand',       focus: 'list' },
  'trust-reviews':     { accent: 'ink',  glyph: 'trust',       focus: 'score-ring' },
};

// Per-sheet-format focus override. Some formats are universally
// better-served by a specific module regardless of pack — checklist
// formats use 'checks', report formats use 'stat', etc.
const FORMAT_FOCUS_OVERRIDE = {
  'checklist': 'checks',
  'log':       'list',
  'table':     'list',
  'report':    'stat',
};

const COPY = {
  en: { eyebrow: 'FREE OPERATOR SHEET · YOUR NUMBERS NEVER LEAVE YOUR BROWSER' },
  es: { eyebrow: 'HOJA GRATIS DEL OPERADOR · TUS NÚMEROS NUNCA SALEN DEL NAVEGADOR' },
};

function isAcronym(w) {
  if (!w) return false;
  // ALL-CAPS, has digit, or contains an ampersand-like token (P&L, etc.)
  if (/\d/.test(w)) return true;
  if (/[A-Z]/.test(w) && w === w.toUpperCase() && w.length >= 2) return true;
  return false;
}

function splitTitle(title) {
  const cleaned = String(title).replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ');
  function lowerOrPreserve(w) { return isAcronym(w) ? w : w.toLowerCase(); }
  if (words.length === 1) {
    return { title_1: '', title_italic: lowerOrPreserve(words[0]), title_2: '.' };
  }
  if (words.length === 2) {
    return { title_1: words[0], title_italic: lowerOrPreserve(words[1]), title_2: '.' };
  }
  return {
    title_1: words[0],
    title_italic: lowerOrPreserve(words[1]),
    title_2: words.slice(2).join(' ') + '.',
  };
}

function dekFor(sheet, locale) {
  const wk = locale === 'es' ? sheet.walkaway_es : sheet.walkaway_en;
  // Cap at ~140 chars to keep the OG template comfortable.
  if (!wk) return '';
  return wk.length > 160 ? wk.slice(0, 157).trim() + '…' : wk;
}

function buildEntry(slug, sheet, locale) {
  const style = PACK_STYLE[sheet.pack];
  if (!style) return null;
  const titleSrc = locale === 'es' ? sheet.title_es : sheet.title_en;
  const split    = splitTitle(titleSrc);
  // D1 — focus module varies by format with pack as fallback. Format
  // override beats pack default because format is more local to the
  // sheet's actual subject (a "checklist" format always reads better
  // as a 'checks' card regardless of pack).
  const focusType = FORMAT_FOCUS_OVERRIDE[sheet.format] || style.focus || 'type';
  return {
    slug:   locale === 'es' ? `sheet-${slug}-es` : `sheet-${slug}`,
    kind:   'tool',
    locale,
    accent: style.accent,
    eyebrow: COPY[locale].eyebrow,
    title_1: split.title_1,
    title_italic: split.title_italic,
    title_2: split.title_2,
    dek:    dekFor(sheet, locale),
    focus:  { type: focusType },
    glyph:  style.glyph,
  };
}

// Build the desired list of sheet card entries.
const desired = [];
const liveSlugs = Object.entries(SHEETS.sheets)
  .filter(([, s]) => s.status === 'live')
  .map(([slug]) => slug)
  .sort();

for (const slug of liveSlugs) {
  const sheet = SHEETS.sheets[slug];
  for (const locale of ['en', 'es']) {
    const entry = buildEntry(slug, sheet, locale);
    if (entry) desired.push(entry);
  }
}

// Merge with existing cards.json: keep all non-sheet entries; replace
// any sheet-* entries with the freshly-computed set. The slug prefix
// `sheet-` is reserved for this generator.
//
// Position: the desired sheet block goes BEFORE the first glossary-*
// entry. seed-glossary-og.mjs maintains glossary entries as a contiguous
// trailing block; if we appended sheets at the end, the two scripts
// would fight over end-of-array on every build. Putting sheet entries
// just before the glossary block makes both layouts stable.
const SHEET_SLUG_RE = /^sheet-/;
const GLOSS_SLUG_RE = /^glossary-/;
const filtered = (cards.cards || []).filter((c) => !SHEET_SLUG_RE.test(c.slug || ''));
const firstGlossIdx = filtered.findIndex((c) => GLOSS_SLUG_RE.test(c.slug || ''));
const insertAt = firstGlossIdx === -1 ? filtered.length : firstGlossIdx;
const merged = filtered.slice(0, insertAt).concat(desired, filtered.slice(insertAt));
const next = Object.assign({}, cards, { cards: merged });

const prevJson = JSON.stringify(cards, null, 2);
const nextJson = JSON.stringify(next, null, 2);

if (prevJson === nextJson) {
  console.log(`Sheet OG cards: ${desired.length} entries; no changes.`);
  process.exit(0);
}
if (!checkOnly) fs.writeFileSync(CARDS_PATH, nextJson + '\n');
const removedCount = (cards.cards || []).length - preserved.length;
console.log(`${checkOnly ? 'would update' : 'updated'}: brand/og/cards.json (replaced ${removedCount} stale sheet card(s); wrote ${desired.length} fresh entries).`);
if (checkOnly) process.exit(1);
