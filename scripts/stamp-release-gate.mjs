#!/usr/bin/env node
/**
 * Release-gate stamper for the weekly drip cadence.
 *
 * Reads data/library-tags.json. For every blog_post (and ES counterpart
 * via i18n-slug-map.json) whose `date` is in the future relative to
 * "today" (UTC midnight), stamps the article HEAD with a noindex robots
 * meta. For articles whose `date` has arrived or passed, restores the
 * canonical robots meta. Idempotent — running every build keeps the
 * gate state aligned with the calendar.
 *
 * Why this exists
 * ---------------
 * The May 2026 publication wave drops one article per Tuesday across
 * 9 weeks (see docs/library-letter/2026-q2-may-wave.md). Articles are
 * authored, audio-rendered, and committed in advance so the operator
 * doesn't have to scramble each Tuesday — but they shouldn't compete
 * for blue-link rank or AI-Overview citation until their release date.
 *
 * Mechanism
 * ---------
 *   - Canonical robots: <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
 *   - Gated robots:     <meta name="robots" content="noindex,nofollow" />
 *
 * The article body still serves at its URL; the audio still plays; the
 * page is still in the sitemap with a future <lastmod>. Google's
 * indexer respects noindex,nofollow and skips it. On release day, the
 * next build flip the gate and Google picks it up on the next crawl
 * (typically 24-72h).
 *
 * Companion filters
 * -----------------
 * scripts/build-library.mjs, scripts/build-sitemap.mjs,
 * scripts/build-rss.mjs and scripts/inject-blog-breadcrumbs.mjs each
 * check the same date field and suppress future-dated entries from
 * their respective indexes. The robots meta is the belt; the index
 * filters are the suspenders.
 *
 * Usage
 * -----
 *   node scripts/stamp-release-gate.mjs           # apply
 *   node scripts/stamp-release-gate.mjs --check   # exit 1 on drift
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const checkOnly = process.argv.includes('--check');

const CANONICAL_ROBOTS = '<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />';
const GATED_ROBOTS     = '<meta name="robots" content="noindex,nofollow" />';
const ROBOTS_RE        = /<meta name="robots" content="[^"]*"\s*\/?>/;

const today = new Date().toISOString().slice(0, 10);  // YYYY-MM-DD, UTC

const tags = JSON.parse(fs.readFileSync(path.join(REPO, 'data/library-tags.json'), 'utf8'));
const slugMap = JSON.parse(fs.readFileSync(path.join(REPO, 'data/i18n-slug-map.json'), 'utf8'));

const enToEs = slugMap.blog || {};

let stamped = 0;
let restored = 0;
let drift = 0;

function processFile(filePath, shouldGate, slug) {
  if (!fs.existsSync(filePath)) return;
  const src = fs.readFileSync(filePath, 'utf8');
  const m = src.match(ROBOTS_RE);
  if (!m) {
    console.warn(`  ! no <meta name="robots"> in ${path.relative(REPO, filePath)}`);
    return;
  }
  const current = m[0];
  const target = shouldGate ? GATED_ROBOTS : CANONICAL_ROBOTS;
  if (current === target) return;  // no change
  if (checkOnly) {
    drift++;
    console.log(`  drift: ${path.relative(REPO, filePath)} — ${shouldGate ? 'should be gated' : 'should be open'}`);
    return;
  }
  const next = src.replace(ROBOTS_RE, target);
  fs.writeFileSync(filePath, next);
  if (shouldGate) {
    stamped++;
    console.log(`  gated:    ${path.relative(REPO, filePath)} (date ${tags.blog_posts[slug].date} > today ${today})`);
  } else {
    restored++;
    console.log(`  released: ${path.relative(REPO, filePath)} (date ${tags.blog_posts[slug].date} reached)`);
  }
}

for (const [enSlug, entry] of Object.entries(tags.blog_posts || {})) {
  if (!entry.date) continue;
  const shouldGate = entry.date > today;
  const enFile = path.join(REPO, 'blog', enSlug, 'index.html');
  processFile(enFile, shouldGate, enSlug);
  const esSlug = enToEs[enSlug];
  if (esSlug) {
    const esFile = path.join(REPO, 'es/blog', esSlug, 'index.html');
    processFile(esFile, shouldGate, enSlug);
  }
}

if (checkOnly) {
  if (drift > 0) {
    console.error(`\n${drift} file(s) need release-gate update. Run scripts/stamp-release-gate.mjs to fix.`);
    process.exit(1);
  }
  console.log(`Release-gate clean (${today}).`);
  process.exit(0);
}
console.log(`\n${stamped} article(s) gated (noindex), ${restored} article(s) released (today is ${today}).`);
