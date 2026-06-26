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
 *   - lastmod sourced from each page's own dateModified (JSON-LD /
 *     article:modified_time); falls back to `git log -1 --format=%cI`
 *     only for pages that carry no modified date. This keeps <lastmod>
 *     content-truthful — a URL advances only when its content actually
 *     changed, not every time a repo-wide build/inject pass rewrites the
 *     file's git mtime (which previously bulk-stamped ~1,170 URLs to one
 *     date and taught crawlers to discount the freshness signal).
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

// EN↔ES slug map. Library (and blog) ES translations use native Spanish
// slugs that differ from the EN slug, so a same-slug pairing of EN↔ES
// sitemap entries silently falls back to the /es/ homepage for those
// pages. Load the map so emit() can pair /library/<en>/ with its real
// /es/library/<es>/ counterpart (and the reverse for ES entries).
const slugMapPath = path.join(repoRoot, 'data', 'i18n-slug-map.json');
let slugMap = { blog: {}, library: {}, esOriginal: [] };
try {
  slugMap = JSON.parse(fs.readFileSync(slugMapPath, 'utf8'));
  if (!slugMap.blog) slugMap.blog = {};
  if (!slugMap.library) slugMap.library = {};
} catch (_) {
  // Missing/unreadable slug-map: fall back to same-slug pairing.
}
// Reverse maps (es-slug → en-slug) for pairing ES entries back to EN.
const esToEnLibrary = {};
for (const [enSlug, esSlug] of Object.entries(slugMap.library || {})) {
  if (!(esSlug in esToEnLibrary)) esToEnLibrary[esSlug] = enSlug;
}
const esToEnBlog = {};
for (const [enSlug, esSlug] of Object.entries(slugMap.blog || {})) {
  if (!(esSlug in esToEnBlog)) esToEnBlog[esSlug] = enSlug;
}

// Translate a pretty path to its counterpart-locale lookup key so the
// emit() hreflang pairing finds the real divergent-slug counterpart
// instead of falling back to the /es/ (or /) homepage.
function counterpartKey(prettyKey, fromLocale) {
  if (fromLocale === 'en') {
    let m = prettyKey.match(/^\/library\/([^/]+)\/$/);
    if (m && slugMap.library[m[1]]) return `/library/${slugMap.library[m[1]]}/`;
    m = prettyKey.match(/^\/blog\/([^/]+)\/$/);
    if (m && slugMap.blog[m[1]]) return `/blog/${slugMap.blog[m[1]]}/`;
  } else {
    let m = prettyKey.match(/^\/library\/([^/]+)\/$/);
    if (m && esToEnLibrary[m[1]]) return `/library/${esToEnLibrary[m[1]]}/`;
    m = prettyKey.match(/^\/blog\/([^/]+)\/$/);
    if (m && esToEnBlog[m[1]]) return `/blog/${esToEnBlog[m[1]]}/`;
  }
  return prettyKey;
}

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
  // Content-truthful lastmod: prefer the page's own dateModified so a URL's
  // <lastmod> advances only when the content changed. A page may carry several
  // schema nodes; take the most recent YYYY-MM-DD. Also honor an OG
  // article:modified_time if present. Null when the page declares no date.
  const dates = [...src.matchAll(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/g)].map((m) => m[1]);
  const amt = src.match(/<meta\s+property="article:modified_time"\s+content="(\d{4}-\d{2}-\d{2})/);
  if (amt) dates.push(amt[1]);
  dates.sort();
  const dateModified = dates.length ? dates[dates.length - 1] : null;
  return { noindex: false, ogImage: ogM ? ogM[1] : null, dateModified };
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
      en.set('/', { loc: `${SITE}/`, lastmod: meta.dateModified || gitMtime(rootIdx), ogImage: meta.ogImage, slug: '' });
    }
  }
  const esRootIdx = path.join(repoRoot, 'es', 'index.html');
  if (fs.existsSync(esRootIdx)) {
    const meta = readMeta(esRootIdx);
    if (!meta.noindex) {
      es.set('/', { loc: `${SITE}/es/`, lastmod: meta.dateModified || gitMtime(esRootIdx), ogImage: meta.ogImage, slug: '' });
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
  const entry = { loc, lastmod: meta.dateModified || gitMtime(full), ogImage: meta.ogImage, slug };
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
  const ownKey = '/' + (entry.slug || '') + '/';
  const lookupKey = counterpartKey(ownKey, locale);
  const hreflangPair = otherMap.get(lookupKey) || otherMap.get('/');
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

// --check tolerance: every commit that touches a content file shifts
// that URL's git-mtime (and therefore its <lastmod>), so a fresh
// checkout of main almost always reports "sitemap stale" — net zero
// signal, all noise. Three regen PRs in the past week have just been
// "rerun build-sitemap so check-all goes green again."
//
// Normalize <lastmod> tags before comparison: if the URL SET is
// identical and only lastmod values drifted, treat as no-change in
// --check mode. URL set additions / removals (real new pages, real
// deletions) still surface as regen signals. The writer mode is
// unchanged — `node scripts/build-sitemap.mjs` (no --check) still
// rewrites sitemap.xml with today's git-mtimes when run, which is
// what the deploy pipeline does.
const stripLastmod = (s) => s.replace(/<lastmod>[^<]+<\/lastmod>/g, '<lastmod>NORMALIZED</lastmod>');
if (checkOnly && stripLastmod(xml) === stripLastmod(prev)) {
  console.log(`Sitemap: ${en.size} EN + ${es.size} ES URLs; lastmod drift only (within --check tolerance).`);
  process.exit(0);
}

if (!checkOnly) fs.writeFileSync(OUT_PATH, xml);
console.log(`${checkOnly ? 'would update' : 'updated'}: sitemap.xml (${en.size} EN + ${es.size} ES = ${en.size + es.size} URLs)`);
if (checkOnly) process.exit(1);
