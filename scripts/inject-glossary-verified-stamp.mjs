#!/usr/bin/env node
/**
 * Phase G.4 (Growth) — stamp a "Last verified" date on glossary
 * terms in volatile categories where the underlying platform
 * documentation changes frequently (Google Business Profile,
 * Find a Table, third-party platforms, Core Web Vitals).
 *
 * The list of volatile slugs is curated explicitly so this never
 * stamps something stable like "aspect-ratio." Date is derived
 * from `git log -1 --format=%cI` on the term directory.
 *
 * Sentinel-bracketed; placed directly after the term-example
 * block (or after the H1 if no term-example yet).
 *
 *   node scripts/inject-glossary-verified-stamp.mjs           # rewrite
 *   node scripts/inject-glossary-verified-stamp.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- glossary-verified:start -->[\s\S]*?<!-- glossary-verified:end -->/;

const VOLATILE_SLUGS = new Set([
  // Google surfaces — change quarterly.
  'google-business-profile', 'gbp', 'find-a-table', 'apple-bing-maps',
  'search-console', 'pagespeed-insights', 'lighthouse',
  // Web Vitals — Google updates the thresholds.
  'core-web-vitals', 'lcp', 'cls', 'fid', 'inp', 'ttfb',
  // Third-party platforms — pricing + policies churn.
  'doordash', 'ubereats', 'grubhub', 'opentable', 'resy', 'tock',
  // Schema types Google's docs change definitions on.
  'schema-markup', 'menu-schema', 'opening-hours-specification',
  'aggregaterating', 'reservation-schema',
]);

// Fallback chain: git history → existing <time datetime="..."> in the
// file → today. The file fallback keeps this idempotent in build
// environments without git history (e.g. Cloudflare Workers Builds
// shallow clone): two consecutive invocations within the same build
// read back the same value, so the "would update" check stays clean.
function gitMtime(dir, src) {
  try {
    const out = execSync(`git log --reverse --format=%cI -- "${dir}"`, { cwd: repoRoot, encoding: 'utf8' }).split('\n')[0].trim();
    if (out) return out.slice(0, 10);
  } catch (_) { /* fall through */ }
  if (src) {
    const m = src.match(/<!-- glossary-verified:start -->[\s\S]*?datetime="(\d{4}-\d{2}-\d{2})"/);
    if (m) return m[1];
  }
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(iso, locale) {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString(locale === 'es' ? 'es-US' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

function buildBlock(dateIso, locale) {
  const label = locale === 'es' ? 'Última revisión' : 'Last verified';
  return [
    '<!-- glossary-verified:start -->',
    `      <p class="glossary-verified">${label}: <time datetime="${dateIso}">${fmtDate(dateIso, locale)}</time></p>`,
    '      <!-- glossary-verified:end -->',
  ].join('\n      ');
}

let changed = 0;
let skipped = 0;
for (const root of [['en', 'glossary'], ['es', 'es/glossary']]) {
  const [locale, dir] = root;
  const fullDir = path.join(repoRoot, dir);
  if (!fs.existsSync(fullDir)) continue;
  for (const slug of fs.readdirSync(fullDir)) {
    if (!VOLATILE_SLUGS.has(slug)) { skipped++; continue; }
    const file = path.join(fullDir, slug, 'index.html');
    if (!fs.existsSync(file)) { skipped++; continue; }
    const src = fs.readFileSync(file, 'utf8');
    const dateIso = gitMtime(path.join(fullDir, slug), src);
    const block = buildBlock(dateIso, locale);
    let next;
    if (SENTINEL_RE.test(src)) {
      next = src.replace(SENTINEL_RE, block);
    } else {
      // Insert after term-example block if present, else after H1.
      const exEnd = src.indexOf('<!-- term-example:end -->');
      if (exEnd !== -1) {
        const insertAt = exEnd + '<!-- term-example:end -->'.length;
        next = src.slice(0, insertAt) + '\n      ' + block + src.slice(insertAt);
      } else {
        const h1Idx = src.indexOf('</h1>');
        if (h1Idx === -1) { skipped++; continue; }
        const insertAt = h1Idx + '</h1>'.length;
        next = src.slice(0, insertAt) + '\n      ' + block + src.slice(insertAt);
      }
    }
    if (next === src) continue;
    if (!checkOnly) fs.writeFileSync(file, next);
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
    changed++;
  }
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} term page(s); ${skipped} skipped (not volatile or absent).`);
if (checkOnly && changed > 0) process.exit(1);
