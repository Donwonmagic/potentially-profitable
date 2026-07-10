#!/usr/bin/env node
/**
 * OG locale-parity guard (native-Spanish parity for social cards).
 *
 * Catches the regression where an ES article page serves the ENGLISH
 * OG card — or the wrong card — a parity break that is invisible to the
 * sibling gates: check-og-images only checks that a reference resolves,
 * and check-og-coverage only blocks the generic fallbacks (blog.png,
 * etc.), not a wrong *specific* card. The break was systemic in
 * 2026-06: ~18 es/library pages inherited their EN card's og:image at
 * translation time and nothing flagged it.
 *
 * For every es/library and es/blog page that declares an og:image card,
 * this asserts:
 *   1. the referenced card exists in brand/og/cards.json and has
 *      locale "es" (never an English card on a Spanish page); and
 *   2. its focus mirrors the EN sibling card's focus — same focus.type,
 *      or both absent — so an ES card can't silently drop the EN card's
 *      stat / bars / list.
 * A page whose EN sibling also has no card is at parity and passes.
 *
 *   node scripts/check-og-locale-parity.mjs          # report, exit 0
 *   node scripts/check-og-locale-parity.mjs --check  # exit 1 on drift
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const cards  = JSON.parse(fs.readFileSync(path.join(repoRoot, 'brand', 'og', 'cards.json'), 'utf8')).cards;
const bySlug = new Map(cards.map((c) => [c.slug, c]));

// Bespoke, hand-composed share cards live as committed PNGs OUTSIDE the
// template manifest (see scripts/render-bespoke-og-*.mjs). They are native
// to their locale by construction — a Spanish card transcreated for a
// Spanish post — so they satisfy parity without a cards.json entry, and
// they must NOT be added to the manifest or build-og-cards.mjs would
// template-render over the hand-authored art. Keep this list dated + tight.
const BESPOKE_ALLOW = new Set([
  'blog-el-nino-y-precios-de-alimentos-2026', // 2026-07-10 bespoke ES card; EN sibling blog-el-nino-food-prices-2026
]);

// First brand/og/<slug>.png referenced by og:image on the page.
function ogCard(file) {
  const m = fs.readFileSync(file, 'utf8')
    .match(/property="og:image"\s+content="[^"]*\/brand\/og\/([^."]+)\.png/);
  return m ? m[1] : null;
}

// EN counterpart page resolved from the hreflang="en" alternate.
function enSiblingFile(file) {
  const m = fs.readFileSync(file, 'utf8')
    .match(/hreflang="en"\s+href="https:\/\/muntin\.digital\/([^"]*)"/);
  if (!m) return null;
  const rel = m[1].replace(/^\/+|\/+$/g, '');
  const f = path.join(repoRoot, rel, 'index.html');
  return fs.existsSync(f) ? f : null;
}

function focusType(slug) {
  const c = slug && bySlug.get(slug);
  if (!c) return null;          // card not found / no card
  return c.focus ? c.focus.type : 'none';
}

function* esPages() {
  for (const base of ['es/library', 'es/blog']) {
    const dir = path.join(repoRoot, base);
    if (!fs.existsSync(dir)) continue;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const f = path.join(dir, e.name, 'index.html');
      if (fs.existsSync(f)) yield { rel: `${base}/${e.name}`, file: f };
    }
  }
}

const fails = [];
let ok = 0, total = 0;

for (const { rel, file } of esPages()) {
  total++;
  const esSlug = ogCard(file);
  const enFile = enSiblingFile(file);
  const enSlug = enFile ? ogCard(enFile) : null;

  if (!esSlug) {
    // No ES card is a parity break only if the EN sibling carries one.
    if (enSlug) fails.push(`${rel}: no OG card, but its EN sibling has "${enSlug}"`);
    else ok++;
    continue;
  }

  const esCard = bySlug.get(esSlug);
  if (!esCard) {
    if (BESPOKE_ALLOW.has(esSlug)) { ok++; continue; } // hand-authored PNG, off-manifest by design
    fails.push(`${rel}: og card "${esSlug}" is not in the manifest`); continue;
  }
  if (esCard.locale !== 'es') {
    fails.push(`${rel}: serves a non-Spanish card "${esSlug}" (locale=${esCard.locale || 'none'})`);
    continue;
  }

  // Focus parity against the EN sibling (only when a sibling card exists).
  if (enSlug) {
    const esFocus = esCard.focus ? esCard.focus.type : 'none';
    const enFocus = focusType(enSlug) || 'none';
    if (esFocus !== enFocus) {
      fails.push(`${rel}: focus "${esFocus}" ≠ EN sibling focus "${enFocus}" (${esSlug} vs ${enSlug})`);
      continue;
    }
  }
  ok++;
}

if (fails.length) {
  console.error(`OG locale parity: ${fails.length} ES page(s) drift from native-Spanish parity (of ${total} checked):\n`);
  for (const f of fails.slice(0, 40)) console.error(`  ✗ ${f}`);
  if (fails.length > 40) console.error(`  …and ${fails.length - 40} more`);
  console.error('\nEvery ES article page must serve a locale:"es" card whose focus mirrors its EN sibling.');
  console.error('Fix: add the ES card to brand/og/cards.json (mirror the EN focus, transcreate the copy),');
  console.error('render it, and repoint the page\'s og:image / twitter:image.');
  process.exit(checkMode ? 1 : 0);
}

console.log(`OG locale parity: ${ok}/${total} ES pages serve a native-Spanish card matching their EN sibling.`);
