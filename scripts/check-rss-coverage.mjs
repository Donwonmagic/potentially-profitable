#!/usr/bin/env node
/**
 * Phase G.3 (Growth) — assert /feed.xml + /es/feed.xml exist,
 * are valid RSS 2.0, contain locale-correct items only, and that
 * EN−ES drift is ≤ 5 items.
 *
 *   node scripts/check-rss-coverage.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const feeds = [
  { path: path.join(repoRoot, 'feed.xml'),       locale: 'en' },
  { path: path.join(repoRoot, 'es', 'feed.xml'), locale: 'es' },
];

const failures = [];
const counts = {};

for (const { path: file, locale } of feeds) {
  if (!fs.existsSync(file)) {
    failures.push(`${path.relative(repoRoot, file)}: missing — run scripts/build-rss.mjs`);
    continue;
  }
  const src = fs.readFileSync(file, 'utf8');
  if (!src.startsWith('<?xml')) failures.push(`${path.relative(repoRoot, file)}: not XML`);
  if (!src.includes('<rss version="2.0"')) failures.push(`${path.relative(repoRoot, file)}: not RSS 2.0`);
  const itemCount = (src.match(/<item>/g) || []).length;
  counts[locale] = itemCount;
  if (itemCount === 0) failures.push(`${path.relative(repoRoot, file)}: zero items`);

  // Locale check: EN feed shouldn't have /es/ links; ES feed shouldn't
  // have non-ES links (other than the SITE root and the legal pages).
  const links = (src.match(/<link>([^<]+)<\/link>/g) || []).map((m) => m.slice(6, -7));
  for (const link of links) {
    if (locale === 'en' && link.includes('/es/')) failures.push(`${path.relative(repoRoot, file)}: EN feed contains /es/ link → ${link}`);
    if (locale === 'es' && !link.includes('/es/') && link !== 'https://muntin.digital/') failures.push(`${path.relative(repoRoot, file)}: ES feed contains EN-only link → ${link}`);
  }
}

if (counts.en && counts.es && Math.abs(counts.en - counts.es) > 5) {
  failures.push(`EN−ES item drift: ${counts.en} vs ${counts.es} (>5; check translations)`);
}

if (failures.length) {
  console.error(`RSS coverage: ${failures.length} issue(s):`);
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`RSS coverage: ${counts.en} EN items, ${counts.es} ES items.`);
