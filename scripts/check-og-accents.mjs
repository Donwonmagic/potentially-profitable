#!/usr/bin/env node
/**
 * OG accent whitelist guard.
 *
 * Why this exists
 * ---------------
 * Every card in brand/og/cards.json declares an `accent`. The OG
 * builder resolves it with `PALETTE[card.accent]` (see
 * scripts/build-og-cards.mjs). An accent that isn't a PALETTE key
 * resolves to `undefined`, and the card silently falls back to its
 * template default — a quiet drift that ships a wrong-colored share
 * image with no error. This guard makes an unknown accent fail-CI.
 *
 * The valid set is DERIVED from the build, not hardcoded here: the
 * script reads the PALETTE block out of build-og-cards.mjs so the two
 * can never drift. Today that yields the documented accent vocabulary
 * — teal, rust, gold, ink, cream (plus the build-internal tones
 * primary/coral/muted/rule/dim, which are valid PALETTE keys and so
 * are accepted, though cards.json doesn't use them as accents).
 *
 * Run: node scripts/check-og-accents.mjs
 * Exit 0 if every accent is a known PALETTE key; 1 otherwise.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const CARDS_JSON = path.join(REPO, 'brand', 'og', 'cards.json');
const BUILDER = path.join(REPO, 'scripts', 'build-og-cards.mjs');

/**
 * Derive the valid accent set by parsing the `const PALETTE = { ... }`
 * object literal out of the builder. Keys-only — we don't need the
 * values. This keeps the whitelist locked to whatever the build
 * actually supports.
 */
function readPaletteKeys() {
  const src = fs.readFileSync(BUILDER, 'utf8');
  const m = src.match(/const\s+PALETTE\s*=\s*\{([\s\S]*?)\};/);
  if (!m) {
    console.error('check-og-accents: could not locate `const PALETTE = { ... }` in build-og-cards.mjs.');
    console.error('  If the builder refactored the PALETTE declaration, update this guard to match.');
    process.exit(1);
  }
  const body = m[1];
  const keys = new Set();
  // Each PALETTE entry is `<key>: "<value>",` on its own line. Match the
  // leading identifier before the colon (line-anchored so values that
  // contain a colon, e.g. rgba(...) strings, are never mistaken for keys).
  for (const km of body.matchAll(/^[ \t]*([A-Za-z_][A-Za-z0-9_-]*)\s*:/gm)) {
    keys.add(km[1]);
  }
  return keys;
}

function main() {
  const valid = readPaletteKeys();
  const manifest = JSON.parse(fs.readFileSync(CARDS_JSON, 'utf8'));
  const cards = manifest.cards ?? [];

  const failures = [];
  for (const card of cards) {
    if (card.accent === undefined) continue; // accent is optional; templates default
    if (!valid.has(card.accent)) {
      failures.push(`${card.slug}: unknown accent "${card.accent}"`);
    }
  }

  const sorted = [...valid].sort();
  if (failures.length) {
    console.error(`OG accents: ${failures.length} card(s) use an accent that is not a PALETTE key:`);
    for (const f of failures) console.error('  ✗ ' + f);
    console.error(`\nValid accents (PALETTE keys in build-og-cards.mjs): ${sorted.join(', ')}`);
    console.error('Fix the card\'s accent in brand/og/cards.json, or add the tone to PALETTE first.');
    process.exit(1);
  }

  console.log(`OG accents: clean across ${cards.length} card(s). Valid set: ${sorted.join(', ')}.`);
}

main();
