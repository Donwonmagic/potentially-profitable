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
 *   "Write to Don"                  → "Email Don"
 *   "Send to Don"                   → "Email Don"
 *   "Send & book your call"         → "Book a 20-min call"
 *   "View case study"               → "Open the case"
 *   "Read the case study"           → "Open the case"
 *   "See the work"                  → "Open the case"
 *   "Email Don about <topic>"       → use a topic chip on /window/
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
  { phrase: 'Write to Don',           replace: 'Email Don' },
  { phrase: 'Send to Don',            replace: 'Email Don' },
  { phrase: 'Send & book your call',  replace: 'Book a 20-min call' },
  { phrase: 'View case study',        replace: 'Open the case' },
  { phrase: 'Read the case study',    replace: 'Open the case' },
  { phrase: 'See the work',           replace: 'Open the case' },
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
