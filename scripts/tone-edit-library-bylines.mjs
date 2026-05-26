#!/usr/bin/env node
// One-shot tone editor — Phase 7 library posts.
//
// Strips the visible publish-date marker from /library/<slug>/ post-meta
// blocks (and /es/library/). Library posts are evergreen reference —
// they keep dateModified in schema for SEO but drop the visible
// "<month> <day>, <year> · 9 min read · By Don" frontmatter.
//
// Pattern targeted (EN + ES):
//   <time datetime="YYYY-MM-DD">DATE TEXT</time> ·
//
// The trailing " · " separator is dropped along with the <time> so
// the post-meta line collapses to "9 min read · By Don".
//
// Idempotent: re-running on already-stripped files is a no-op.
//
// Usage:
//   node scripts/tone-edit-library-bylines.mjs           # report only
//   node scripts/tone-edit-library-bylines.mjs --apply   # write
//
// Excludes /library/menu-design-*/ (collection landings, not articles).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const apply      = process.argv.includes('--apply');

const ROOTS = ['library', 'es/library'];
const SKIP_SLUGS = new Set(['menu-design-cuisines', 'menu-design-themes']);

// Match the visible byline date and the trailing " · " separator.
// Allows whitespace flexibility. The DATE TEXT inside <time> is any
// non-< content so it covers both "April 30, 2026" (EN) and
// "30 de abril, 2026" (ES) without locale-specific patterns.
// Separator after the <time> can be:
//   ·          (U+00B7 middle dot, literal char)
//   •          (U+2022 bullet)
//   &middot;   (HTML entity equivalent of ·)
//   &bull;     (HTML entity equivalent of •)
// All variants are stripped along with surrounding whitespace.
const BYLINE_DATE_RE = /<time datetime="\d{4}-\d{2}-\d{2}">[^<]+<\/time>\s*(?:[·•]|&middot;|&bull;)\s*/;

let touched = 0;
let scanned = 0;
let already = 0;

for (const root of ROOTS) {
  const rootAbs = path.join(repoRoot, root);
  if (!fs.existsSync(rootAbs)) continue;
  for (const slug of fs.readdirSync(rootAbs)) {
    if (SKIP_SLUGS.has(slug)) continue;
    const file = path.join(rootAbs, slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    scanned++;
    const src = fs.readFileSync(file, 'utf8');
    if (!BYLINE_DATE_RE.test(src)) {
      already++;
      continue;
    }
    const next = src.replace(BYLINE_DATE_RE, '');
    if (next === src) { already++; continue; }
    if (apply) fs.writeFileSync(file, next);
    console.log(`${apply ? 'STRIPPED' : 'would strip'}  ${root}/${slug}/index.html`);
    touched++;
  }
}

console.log(`\n${apply ? 'stripped' : 'would strip'} ${touched} byline(s); ${already} already clean; ${scanned} scanned.`);
if (!apply && touched > 0) console.log('Re-run with --apply to write.');
