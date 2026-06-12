#!/usr/bin/env node
/**
 * Phase 6 — CTA canon CI guard.
 *
 * The launch plan locks a single set of CTA verbs (see /methods/
 * #voice-contract). Each verb does one job; alternates are retired.
 * This script scans every shipped HTML page and fails if it finds a
 * banned variant in a button-style position.
 *
 * Banned variants (with the canonical replacement):
 *   "Send to Don"                   → "Send the note"  (field-note form submit)
 *   "Enviar a Don"                  → "Enviar la nota" (ES field-note form submit)
 *   "Send & book your call"         → "Send the note" (booking retired, Phase 9)
 *
 * Phase 8 (portfolio sunset): the case-study CTA entries
 * ("View case study", "Read the case study" → "See the case study")
 * were dropped when /work/ was retired. No surface emits a case-
 * study CTA anymore; if the section ever returns, restore the
 * entries from git history.
 *
 * Both "Email Don" and "Write to Don" are CANONICAL per the voice
 * contract: "Email Don" is the nav primary contact (one tap from
 * anywhere, direct verb); "Write to Don" is the softer body / footer
 * register (used in foot-cta, Care Plan inline mention, etc.). They
 * coexist by design — neither is in the BANNED list.
 *
 * The first match in a button-style position (preceded by `>`,
 * inside a label-like element) is treated as drift and reported.
 * Body-prose mentions of these phrases are allowed (the phrases
 * themselves are part of the site's vocabulary in changelog notes,
 * methods page, and similar). The script keys on the structural
 * pattern, not the phrase alone.
 *
 * Allowlist:
 *   /changelog/             — historical notes can quote retired CTAs
 *   /methods/               — the canon page itself names them
 *   /window/                — the aria-label "Write to Don" on the
 *                             composer reads naturally; not a button
 *   /scripts/               — this file plus any voice-refs
 *   /docs/                  — internal docs reference the canon
 *
 *   node scripts/check-cta-canon.mjs           # report all drift
 *   node scripts/check-cta-canon.mjs --strict  # exit 1 on any drift
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const strict     = process.argv.includes('--strict');

// Phrases that must not appear in button-style positions.
// Each entry: regex that matches the drift in a button label.
// Anchoring on `>` immediately before the label catches the most
// common drift (HTML element opening then visible text). Whitespace
// allowed around the phrase to match indented HTML.
const BANNED = [
  // Field-note submit buttons across every blog post — the canon is
  // "Send the note" / "Enviar la nota" (verb-on-the-object, not
  // verb-on-the-recipient — the recipient context is already clear
  // from the form's surrounding "Be the first field note on this
  // article" framing).
  { phrase: 'Send to Don',            replace: 'Send the note' },
  { phrase: 'Enviar a Don',           replace: 'Enviar la nota' },
  // Legacy intake-form submit; intake form now uses "Send the note"
  // and the booking page is retired (Phase 9, services sunset).
  { phrase: 'Send & book your call',  replace: '"Send the note"' },
  // Phase 9: the consult-booking funnel is retired with the services
  // business — the calendar CTA must not come back in button copy.
  { phrase: 'Book a 20-min call',     replace: '"Email Don" or "See pricing"' },
  { phrase: 'Reservar una llamada de 20 min', replace: '"Escribirle a Don" o "Ver precios"' },
  // Phase 8 (portfolio sunset): the case-study CTA entries were
  // dropped when /work/ was retired. See the header docstring.
];

const ALLOWLIST_DIRS = new Set([
  'changelog', 'methods', 'window', 'scripts', 'docs', 'src', 'node_modules',
  '.git', '.github', '.wrangler', 'brand', 'assets', '_includes',
]);

function collectHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      if (ALLOWLIST_DIRS.has(entry.name)) continue;
      // /es/changelog/, /es/methods/, /es/window/ also allowlisted.
      if (entry.name === 'es') {
        for (const sub of fs.readdirSync(path.join(dir, entry.name), { withFileTypes: true })) {
          if (ALLOWLIST_DIRS.has(sub.name)) continue;
          if (sub.isDirectory()) collectHtml(path.join(dir, entry.name, sub.name), out);
          else if (sub.isFile() && sub.name.endsWith('.html')) out.push(path.join(dir, entry.name, sub.name));
        }
        continue;
      }
      collectHtml(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function scanFile(file) {
  const src  = fs.readFileSync(file, 'utf8');
  const hits = [];
  for (const { phrase, replace } of BANNED) {
    // Match button-style positions. Two flavors:
    //   1. >  Phrase  </tag>            (label ends with closing tag)
    //   2. >  Phrase  <svg>             (label followed by trailing icon)
    // The lookbehind asserts we're inside a button/anchor/span body
    // (i.e. preceded by a `>` plus arbitrary whitespace, possibly
    // including a newline + indent — so the multi-line `<a>\n  Phrase
    // \n  <svg>...</svg>\n</a>` pattern in card components is caught).
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`>[\\s]*${escaped}(?=\\b)([\\s]*<\\/[a-z]+>|[\\s]*<svg)`, 'g');
    let m;
    while ((m = re.exec(src)) !== null) {
      const before = src.slice(0, m.index);
      const line   = before.split('\n').length;
      hits.push({ phrase, replace, line });
    }
  }
  return hits;
}

const files = collectHtml(repoRoot);

let total = 0;
const byPhrase = new Map();
const offenders = [];
for (const file of files) {
  const hits = scanFile(file);
  if (hits.length === 0) continue;
  total += hits.length;
  offenders.push({ file: path.relative(repoRoot, file), hits });
  for (const h of hits) {
    byPhrase.set(h.phrase, (byPhrase.get(h.phrase) || 0) + 1);
  }
}

if (total === 0) {
  console.log('CTA canon: clean.');
  process.exit(0);
}

console.log(`CTA canon: ${total} drift hit(s) across ${offenders.length} file(s).\n`);
for (const { phrase, replace } of BANNED) {
  const count = byPhrase.get(phrase) || 0;
  if (count) console.log(`  ${count.toString().padStart(4)} × "${phrase}" → should be "${replace}"`);
}
console.log('');
const sample = offenders.slice(0, 10);
for (const { file, hits } of sample) {
  console.log(`  ${file}`);
  for (const h of hits.slice(0, 3)) {
    console.log(`     L${h.line}: "${h.phrase}" → "${h.replace}"`);
  }
}
if (offenders.length > sample.length) {
  console.log(`  ... and ${offenders.length - sample.length} more file(s).`);
}

if (strict) process.exit(1);
