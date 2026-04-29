#!/usr/bin/env node
/**
 * Sprint 17 (Cohesion) — point each glossary term page at its
 * per-term OG card.
 *
 * Walks /glossary/<slug>/index.html and /es/glossary/<slug>/, finds
 * the og:image and twitter:image meta tags currently pointing at the
 * generic glossary.png (or glossary-es.png), and rewrites them to
 * point at /brand/og/glossary-<slug>(-es).png.
 *
 * Idempotent — re-running on already-pointed entries produces no
 * diff. Skips category pages (basics/, brand-design/, etc.) and the
 * sitemap meta page; their og:image stays at the catalog-level
 * card per the design-system rule.
 *
 * Usage:
 *   node scripts/inject-glossary-og.mjs           # rewrite in place
 *   node scripts/inject-glossary-og.mjs --check   # exit 1 if any change
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const CATEGORY_SLUGS = new Set([
  'basics', 'brand-design', 'conversions', 'data-literacy',
  'findability', 'mobile', 'restaurant-numbers', 'subtypes', 'trust',
]);

const OG_HOST = 'https://muntin.digital';

function collectTerms(rootDir) {
  const out = [];
  if (!fs.existsSync(rootDir)) return out;
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (CATEGORY_SLUGS.has(entry.name)) continue;
    if (entry.name === 'sitemap') continue;
    const file = path.join(rootDir, entry.name, 'index.html');
    if (!fs.existsSync(file)) continue;
    out.push({ slug: entry.name, file });
  }
  return out;
}

const LOCALES = [
  { code: 'en', dir: path.join(repoRoot, 'glossary'),     suffix: ''     },
  { code: 'es', dir: path.join(repoRoot, 'es', 'glossary'), suffix: '-es' },
];

let changed = 0;
let skipped = 0;
const missing = [];

for (const { code, dir, suffix } of LOCALES) {
  for (const { slug, file } of collectTerms(dir)) {
    const cardPng = `${OG_HOST}/brand/og/glossary-${slug}${suffix}.png`;
    const cardAbs = path.join(repoRoot, 'brand', 'og', `glossary-${slug}${suffix}.png`);
    if (!fs.existsSync(cardAbs)) {
      missing.push(`brand/og/glossary-${slug}${suffix}.png`);
      continue;
    }

    const src = fs.readFileSync(file, 'utf8');

    // Match og:image or twitter:image meta tags whose content points at
    // the GENERIC glossary card. Both attribute orderings supported
    // (the EN convention emits property/name first; the ES pipeline
    // emits content first).
    let next = src;
    next = next.replace(
      /(<meta\s+property="og:image"\s+content=")[^"]*\/brand\/og\/glossary(?:-es)?\.png(")/g,
      `$1${cardPng}$2`,
    );
    next = next.replace(
      /(<meta\s+content=")[^"]*\/brand\/og\/glossary(?:-es)?\.png("\s+property="og:image")/g,
      `$1${cardPng}$2`,
    );
    next = next.replace(
      /(<meta\s+name="twitter:image"\s+content=")[^"]*\/brand\/og\/glossary(?:-es)?\.png(")/g,
      `$1${cardPng}$2`,
    );
    next = next.replace(
      /(<meta\s+content=")[^"]*\/brand\/og\/glossary(?:-es)?\.png("\s+name="twitter:image")/g,
      `$1${cardPng}$2`,
    );

    if (next === src) {
      skipped++;
      continue;
    }
    if (!checkOnly) fs.writeFileSync(file, next);
    changed++;
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  }
}

if (missing.length) {
  console.warn(`\n${missing.length} card PNG(s) missing on disk — run scripts/build-og-cards.mjs first:`);
  for (const m of missing.slice(0, 10)) console.warn(`  ${m}`);
  if (missing.length > 10) console.warn(`  … and ${missing.length - 10} more`);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} file(s); ${skipped} unchanged.`);

if (checkOnly && changed > 0) process.exit(1);
