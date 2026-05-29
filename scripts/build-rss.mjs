#!/usr/bin/env node
/**
 * Phase G.3 (Growth) — generate /feed.xml and /es/feed.xml.
 *
 * RSS 2.0 + Atom self-link, newest-first, capped at 50 items.
 * Sources merged across:
 *   - blog posts (article:published_time meta from each
 *     blog/<slug>/index.html and ES counterpart)
 *   - new glossary terms (data/glossary-added.json)
 *   - tool releases (data/tool-releases.json — manual curation)
 *
 * Why ship RSS when most readers no longer use a feed reader?
 *   1. ChatGPT, Perplexity, Claude, and other LLM-search engines
 *      crawl RSS as a primary "what's new" surface — much more
 *      reliably than parsing 400 HTML pages every week.
 *   2. Google Discover + the new SearchGPT pull from RSS.
 *   3. Power users (the operator-at-11pm who returns 4x/wk) DO
 *      use feed readers and get a quiet way to follow without
 *      handing over an email address.
 *
 *   node scripts/build-rss.mjs           # rewrite
 *   node scripts/build-rss.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SITE = 'https://muntin.digital';
const MAX_ITEMS = 50;

function escXml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[c]);
}

// Extract a <meta> content value, tolerating BOTH attribute orderings:
//   <meta {attr}="{val}" content="…">   (name-/property-first)
//   <meta content="…" {attr}="{val}">   (content-first — emitted by the
//   ES post-translation pipeline). build-rss previously matched only the
//   first form, so content-first ES posts parsed as empty description AND
//   null article:published_time; the null pubDate then fell through to
//   gitMtime()/new Date(), stamping a fresh timestamp into es/feed.xml on
//   every run and making the feed non-deterministic. Matching both orders
//   restores the real description + real published_time, so the feed is
//   stable + idempotent.
function metaContent(src, attr, val) {
  const v = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    src.match(new RegExp(`<meta\\s+${attr}="${v}"\\s+content="([^"]*)"`, 'i'))?.[1] ??
    src.match(new RegExp(`<meta\\s+content="([^"]*)"\\s+${attr}="${v}"`, 'i'))?.[1] ??
    null
  );
}

function readMeta(file) {
  const src = fs.readFileSync(file, 'utf8');
  const titleM = src.match(/<title>([^<]+)<\/title>/);
  const title = titleM ? titleM[1].split(' | ')[0].split(' — ')[0].trim() : null;
  return {
    title,
    description: metaContent(src, 'name', 'description') ?? '',
    pubDate: metaContent(src, 'property', 'article:published_time'),
    ogImage: metaContent(src, 'property', 'og:image'),
  };
}

function gitMtime(file) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${file}"`, { cwd: repoRoot, encoding: 'utf8' }).trim();
    if (out) return out;
  } catch (_) { /* fall through */ }
  return new Date().toISOString();
}

// Accepts either a bare 'YYYY-MM-DD' (data-file dates) or a full ISO datetime
// (article:published_time / git %cI). Bare dates are anchored at noon UTC so the
// calendar day is stable regardless of reader timezone; full datetimes parse as-is.
// Returns the RFC-822 string for <pubDate> and a 'YYYY-MM-DD' key for sorting.
function normalizeDate(raw) {
  const str = String(raw || '');
  const d = new Date(str.includes('T') ? str : `${str}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return { rfc: now.toUTCString(), iso: now.toISOString().slice(0, 10) };
  }
  return { rfc: d.toUTCString(), iso: d.toISOString().slice(0, 10) };
}

function blogItems(locale) {
  const out = [];
  // Phase 7: walk both /blog/ (timely) and /library/ (evergreen).
  // Library posts ride the same feed so subscribers don't lose history
  // when a post is reclassified. GUIDs are slug-based (see below) so
  // a blog→library move with an unchanged slug stays the same item.
  // /library/menu-design-*/ are collection landings, not articles, and
  // are excluded from the feed.
  const namespaces = [
    { dir: locale === 'es' ? 'es/blog' : 'blog',    urlPrefix: `${locale === 'es' ? '/es' : ''}/blog/`,    skip: new Set(['drafts']) },
    { dir: locale === 'es' ? 'es/library' : 'library', urlPrefix: `${locale === 'es' ? '/es' : ''}/library/`, skip: new Set(['menu-design-cuisines', 'menu-design-themes']) },
  ];
  for (const { dir, urlPrefix, skip } of namespaces) {
    const root = path.join(repoRoot, dir);
    if (!fs.existsSync(root)) continue;
    for (const slug of fs.readdirSync(root)) {
      if (skip.has(slug) || slug === 'index.html') continue;
      const file = path.join(root, slug, 'index.html');
      if (!fs.existsSync(file)) continue;
      const meta = readMeta(file);
      if (!meta.title) continue;
      const url = `${SITE}${urlPrefix}${slug}/`;
      // Stable GUID: slug-only identifier (not the URL). A post moving
      // /blog/<slug>/ → /library/<slug>/ keeps the same GUID, so RSS
      // readers don't treat it as a brand-new item. Renames or merges
      // (different slug) will produce a new GUID by design.
      const guid = `urn:muntin:article:${locale}:${slug}`;
      const { rfc, iso } = normalizeDate(meta.pubDate || gitMtime(file));
      out.push({
        kind: 'article',
        title: meta.title,
        description: meta.description,
        url,
        guid,
        pubDate: rfc,
        pubDateIso: iso,
        image: meta.ogImage,
        category: locale === 'es' ? 'Artículo' : 'Article',
      });
    }
  }
  return out;
}

function glossaryItems(locale) {
  const dataPath = path.join(repoRoot, 'data/glossary-added.json');
  if (!fs.existsSync(dataPath)) return [];
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const out = [];
  for (const entry of data.added || []) {
    const file = path.join(repoRoot, locale === 'es' ? 'es/glossary' : 'glossary', entry.slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    const meta = readMeta(file);
    if (!meta.title) continue;
    const url = `${SITE}${locale === 'es' ? '/es' : ''}/glossary/${entry.slug}/`;
    out.push({
      kind: 'glossary',
      title: meta.title,
      description: meta.description || entry.note || '',
      url,
      pubDate: normalizeDate(entry.date).rfc,
      pubDateIso: normalizeDate(entry.date).iso,
      image: meta.ogImage,
      category: locale === 'es' ? 'Glosario' : 'Glossary',
    });
  }
  return out;
}

function toolItems(locale) {
  const dataPath = path.join(repoRoot, 'data/tool-releases.json');
  if (!fs.existsSync(dataPath)) return [];
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const out = [];
  for (const entry of data.releases || []) {
    const slug = entry.slug;
    const file = path.join(repoRoot, locale === 'es' ? 'es/tools' : 'tools', slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    const meta = readMeta(file);
    if (!meta.title) continue;
    const url = `${SITE}${locale === 'es' ? '/es' : ''}/tools/${slug}/`;
    const blurb = (locale === 'es' ? entry.note_es : entry.note_en) || meta.description;
    out.push({
      kind: 'tool',
      title: meta.title,
      description: blurb,
      url,
      pubDate: normalizeDate(entry.date).rfc,
      pubDateIso: normalizeDate(entry.date).iso,
      image: meta.ogImage,
      category: locale === 'es' ? 'Herramienta' : 'Tool',
    });
  }
  return out;
}

function courseItems(locale) {
  const dataPath = path.join(repoRoot, 'data/course-releases.json');
  if (!fs.existsSync(dataPath)) return [];
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const out = [];
  for (const entry of data.releases || []) {
    const slug = entry.slug || ''; // 'course' for hub, 'course/m1-orient' for module
    const file = path.join(repoRoot, locale === 'es' ? 'es' : '', slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    const meta = readMeta(file);
    if (!meta.title) continue;
    const url = `${SITE}${locale === 'es' ? '/es' : ''}/${slug}/`;
    const blurb = (locale === 'es' ? entry.note_es : entry.note_en) || meta.description;
    out.push({
      kind: 'course',
      title: meta.title,
      description: blurb,
      url,
      pubDate: normalizeDate(entry.date).rfc,
      pubDateIso: normalizeDate(entry.date).iso,
      image: meta.ogImage,
      category: locale === 'es' ? 'Curso' : 'Course',
    });
  }
  return out;
}

function sheetItems(locale) {
  const dataPath = path.join(repoRoot, 'data/sheet-releases.json');
  if (!fs.existsSync(dataPath)) return [];
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const out = [];
  for (const entry of data.releases || []) {
    const slug = entry.slug || ''; // empty string targets the hub
    const file = path.join(repoRoot, locale === 'es' ? 'es/sheets' : 'sheets', slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    const meta = readMeta(file);
    if (!meta.title) continue;
    const url = slug
      ? `${SITE}${locale === 'es' ? '/es' : ''}/sheets/${slug}/`
      : `${SITE}${locale === 'es' ? '/es' : ''}/sheets/`;
    const blurb = (locale === 'es' ? entry.note_es : entry.note_en) || meta.description;
    out.push({
      kind: 'sheet',
      title: meta.title,
      description: blurb,
      url,
      pubDate: normalizeDate(entry.date).rfc,
      pubDateIso: normalizeDate(entry.date).iso,
      image: meta.ogImage,
      category: locale === 'es' ? 'Hoja del Operador' : 'Operator Sheet',
    });
  }
  return out;
}

function buildFeed(locale) {
  const items = [
    ...blogItems(locale),
    ...glossaryItems(locale),
    ...toolItems(locale),
    ...sheetItems(locale),
    ...courseItems(locale),
  ].sort((a, b) => b.pubDateIso.localeCompare(a.pubDateIso)).slice(0, MAX_ITEMS);

  const feedUrl = `${SITE}${locale === 'es' ? '/es' : ''}/feed.xml`;
  const homeUrl = `${SITE}${locale === 'es' ? '/es/' : '/'}`;
  const channelTitle = locale === 'es'
    ? 'Muntin Digital — biblioteca para restaurantes'
    : 'Muntin Digital — restaurant web library';
  const channelDesc = locale === 'es'
    ? 'Artículos, glosario, y herramientas para restaurantes — escrito y mantenido por Don Goldstein.'
    : 'Articles, glossary, and tools for independent restaurants — written and maintained by Don Goldstein.';
  const langTag = locale === 'es' ? 'es-us' : 'en-us';
  const lastBuild = items[0] ? items[0].pubDate : new Date().toUTCString();

  const itemXml = items.map((i) => {
    const enclosure = i.image
      ? `      <enclosure url="${escXml(i.image)}" type="image/png" length="0" />`
      : '';
    return [
      '    <item>',
      `      <title>${escXml(i.title)}</title>`,
      `      <link>${escXml(i.url)}</link>`,
      // isPermaLink="true" when the GUID is a real URL (glossary, tools);
      // "false" when it's a synthetic stable identifier (urn:muntin:article:…).
      i.guid
        ? `      <guid isPermaLink="false">${escXml(i.guid)}</guid>`
        : `      <guid isPermaLink="true">${escXml(i.url)}</guid>`,
      `      <pubDate>${i.pubDate}</pubDate>`,
      `      <description>${escXml(i.description)}</description>`,
      `      <category>${escXml(i.category)}</category>`,
      `      <dc:creator>Don Goldstein</dc:creator>`,
      enclosure,
      '    </item>',
    ].filter(Boolean).join('\n');
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escXml(channelTitle)}</title>
    <link>${escXml(homeUrl)}</link>
    <description>${escXml(channelDesc)}</description>
    <language>${langTag}</language>
    <copyright>Muntin Digital</copyright>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <generator>scripts/build-rss.mjs</generator>
    <atom:link href="${escXml(feedUrl)}" rel="self" type="application/rss+xml" />
${itemXml}
  </channel>
</rss>
`;
}

let changed = 0;
for (const locale of ['en', 'es']) {
  const xml = buildFeed(locale);
  const outPath = path.join(repoRoot, locale === 'es' ? 'es/feed.xml' : 'feed.xml');
  const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
  if (xml !== prev) {
    if (!checkOnly) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, xml);
    }
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, outPath)}`);
    changed++;
  }
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} feed(s).`);
if (checkOnly && changed > 0) process.exit(1);
