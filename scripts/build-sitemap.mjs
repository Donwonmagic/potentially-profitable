#!/usr/bin/env node
/**
 * Phase G.3b (Growth) — generate sitemap.xml from the filesystem.
 *
 * Walks the static-asset tree, finds every published HTML page,
 * groups EN+ES counterparts via the parallel /es/ prefix, and emits
 * a Google-compliant sitemap with hreflang alternates AND
 * <image:image> entries pointing at each page's primary OG card.
 *
 * Improvements over the hand-edited sitemap:
 *   - Includes /people/<slug>/ when contributor pages exist.
 *   - Auto-includes new blog posts the moment they land in blog/.
 *   - Image entries help Google Discover + Image Search surface the
 *     OG card in restaurant-specific result types.
 *   - Excludes paths that are noindex (drafts/, /admin/, /sign-in/,
 *     /workbench/, /account/, /sub/) automatically.
 *   - lastmod sourced from `git log -1 --format=%cI` per file.
 *
 *   node scripts/build-sitemap.mjs           # rewrite sitemap.xml
 *   node scripts/build-sitemap.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SITE = 'https://muntin.digital';
const OUT_PATH = path.join(repoRoot, 'sitemap.xml');

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', '.github', 'dist', '.wrangler', 'docs',
  'brand', 'assets', '_includes', 'scripts', 'src', 'data',
  'admin', 'sign-in', 'workbench', 'account', 'sub',
  'drafts',
]);

const EXCLUDE_FILES = new Set([
  'pagefind.yml', 'README.md',
]);

function* walk(dir, rel = '') {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(e.name)) continue;
    if (EXCLUDE_FILES.has(e.name)) continue;
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    const next = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      yield* walk(full, next);
    } else if (e.isFile() && e.name === 'index.html') {
      yield { full, rel };
    }
  }
}

function gitMtime(file) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${file}"`, { cwd: repoRoot, encoding: 'utf8' }).trim();
    if (out) return out.slice(0, 10);
  } catch (_) { /* fall through */ }
  return new Date().toISOString().slice(0, 10);
}

function readMeta(file) {
  const src = fs.readFileSync(file, 'utf8');
  if (/<meta\s+name="robots"[^>]*noindex/i.test(src)) return { noindex: true };
  const ogM = src.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
  return { noindex: false, ogImage: ogM ? ogM[1] : null };
}

function escXml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[c]);
}

// Build the URL set. Each entry: { loc, lastmod, ogImage, locale, slug }
const en = new Map();
const es = new Map();

// Root index.html — special-case (rel === '' from walk's perspective)
{
  const rootIdx = path.join(repoRoot, 'index.html');
  if (fs.existsSync(rootIdx)) {
    const meta = readMeta(rootIdx);
    if (!meta.noindex) {
      en.set('/', { loc: `${SITE}/`, lastmod: gitMtime(rootIdx), ogImage: meta.ogImage, slug: '' });
    }
  }
  const esRootIdx = path.join(repoRoot, 'es', 'index.html');
  if (fs.existsSync(esRootIdx)) {
    const meta = readMeta(esRootIdx);
    if (!meta.noindex) {
      es.set('/', { loc: `${SITE}/es/`, lastmod: gitMtime(esRootIdx), ogImage: meta.ogImage, slug: '' });
    }
  }
}

for (const { full, rel } of walk(repoRoot)) {
  const isEs = rel === 'es' || rel.startsWith('es/');
  const slug = isEs ? rel.replace(/^es\/?/, '') : rel;
  if (!slug) continue; // root handled above
  const meta = readMeta(full);
  if (meta.noindex) continue;
  const loc = isEs ? `${SITE}/es/${slug}/` : `${SITE}/${slug}/`;
  const entry = { loc, lastmod: gitMtime(full), ogImage: meta.ogImage, slug };
  (isEs ? es : en).set('/' + slug + '/', entry);
}

// Emit XML.
const lines = [];
lines.push('<?xml version="1.0" encoding="UTF-8"?>');
lines.push('<urlset');
lines.push('  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
lines.push('  xmlns:xhtml="http://www.w3.org/1999/xhtml"');
lines.push('  xmlns:image="http://www.sitemaps.org/schemas/sitemap-image/1.1">');

function emit(entry, locale) {
  const otherLocale = locale === 'en' ? 'es' : 'en';
  const otherMap = locale === 'en' ? es : en;
  const hreflangPair = otherMap.get('/' + (entry.slug || '') + '/') || otherMap.get('/');
  lines.push('  <url>');
  lines.push(`    <loc>${escXml(entry.loc)}</loc>`);
  lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
  lines.push(`    <xhtml:link rel="alternate" hreflang="${locale}" href="${escXml(entry.loc)}" />`);
  if (hreflangPair) {
    lines.push(`    <xhtml:link rel="alternate" hreflang="${otherLocale}" href="${escXml(hreflangPair.loc)}" />`);
  }
  lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escXml(locale === 'en' ? entry.loc : (hreflangPair ? hreflangPair.loc : entry.loc))}" />`);
  if (entry.ogImage) {
    lines.push('    <image:image>');
    lines.push(`      <image:loc>${escXml(entry.ogImage)}</image:loc>`);
    lines.push('    </image:image>');
  }
  lines.push('  </url>');
}

const enKeys = [...en.keys()].sort();
for (const k of enKeys) emit(en.get(k), 'en');
const esKeys = [...es.keys()].sort();
for (const k of esKeys) emit(es.get(k), 'es');

lines.push('</urlset>');
const xml = lines.join('\n') + '\n';

const prev = fs.existsSync(OUT_PATH) ? fs.readFileSync(OUT_PATH, 'utf8') : '';
if (xml === prev) {
  console.log(`Sitemap: ${en.size} EN + ${es.size} ES URLs; no changes.`);
  process.exit(0);
}
if (!checkOnly) fs.writeFileSync(OUT_PATH, xml);
console.log(`${checkOnly ? 'would update' : 'updated'}: sitemap.xml (${en.size} EN + ${es.size} ES = ${en.size + es.size} URLs)`);
if (checkOnly) process.exit(1);
