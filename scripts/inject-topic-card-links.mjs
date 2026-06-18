#!/usr/bin/env node
/**
 * Fix topic-page article-card links.
 *
 * The topic (pillar) pages under /learn/topics/ render an article card per
 * member with href="/blog/<slug>/" for EVERY entry — but 34 of the 45 entries
 * are namespace:"library" articles that live at /library/<slug>/, so those
 * links 404. The ES topic pages are worse: the card slug is sometimes the EN
 * slug and sometimes the ES slug, always under /es/blog/, so both the
 * namespace and the slug can be wrong.
 *
 * This rewrites each topic-article-card href to the canonical path, resolving
 * the card's slug (EN or ES, library or blog) back to its canonical article
 * via data/library-tags.json (namespace) + data/i18n-slug-map.json (locale
 * slug). It only touches <a class="topic-article-card"> hrefs; everything else
 * is left alone. Idempotent.
 *
 * Why a post-processor and not the generator: scripts/build-library.mjs (which
 * emits these pages) is stale/divergent from the committed HTML — re-running it
 * regresses hundreds of files (off-spine colors, dropped autolinks). The
 * committed pages are authoritative, so the fix is stamped in place here and
 * pinned by --check in check-all.
 *
 *   node scripts/inject-topic-card-links.mjs           # rewrite in place
 *   node scripts/inject-topic-card-links.mjs --check   # exit 1 if any link is wrong
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');

const tags = JSON.parse(fs.readFileSync(path.join(REPO, 'data/library-tags.json'), 'utf8')).blog_posts;
const slugMap = JSON.parse(fs.readFileSync(path.join(REPO, 'data/i18n-slug-map.json'), 'utf8'));

// Canonical EN slug sets by namespace.
const libEn = new Set(Object.entries(tags).filter(([, v]) => v.namespace === 'library').map(([k]) => k));
const blogEn = new Set(Object.entries(tags).filter(([, v]) => !v.namespace).map(([k]) => k));
const libEnToEs = slugMap.library || {};
const blogEnToEs = slugMap.blog || {};
const libEsToEn = Object.fromEntries(Object.entries(libEnToEs).map(([en, es]) => [es, en]));
const blogEsToEn = Object.fromEntries(Object.entries(blogEnToEs).map(([en, es]) => [es, en]));

// Resolve any card slug (EN or ES, lib or blog) → { ns, enSlug } or null.
function resolve(slug) {
  if (libEn.has(slug)) return { ns: 'library', enSlug: slug };
  if (blogEn.has(slug)) return { ns: 'blog', enSlug: slug };
  if (libEsToEn[slug]) return { ns: 'library', enSlug: libEsToEn[slug] };
  if (blogEsToEn[slug]) return { ns: 'blog', enSlug: blogEsToEn[slug] };
  return null;
}

function canonicalHref(es, ns, enSlug) {
  if (es) {
    const map = ns === 'library' ? libEnToEs : blogEnToEs;
    const s = map[enSlug] || enSlug;
    return `/es/${ns}/${s}/`;
  }
  return `/${ns}/${enSlug}/`;
}

function collectTopicPages(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collectTopicPages(p, out);
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

const CARD_RE = /(<a class="topic-article-card" href=")([^"]+)(")/g;
const SLUG_RE = /\/(?:es\/)?(?:blog|library)\/([^/]+)\//;

const targets = [
  ...collectTopicPages(path.join(REPO, 'learn/topics')),
  ...collectTopicPages(path.join(REPO, 'es/learn/topics')),
];

let changed = 0;
const problems = [];
const changedFiles = [];

for (const file of targets) {
  const rel = path.relative(REPO, file);
  const es = rel.startsWith('es/');
  let src = fs.readFileSync(file, 'utf8');
  let fileChanged = false;
  const next = src.replace(CARD_RE, (m, a, href, b) => {
    const sm = href.match(SLUG_RE);
    if (!sm) return m;
    const r = resolve(sm[1]);
    if (!r) { problems.push(`${rel}: unresolved card slug "${sm[1]}"`); return m; }
    const good = canonicalHref(es, r.ns, r.enSlug);
    if (good !== href) { fileChanged = true; return a + good + b; }
    return m;
  });
  if (fileChanged) {
    changed++;
    changedFiles.push(rel);
    if (!checkOnly) fs.writeFileSync(file, next);
  }
}

if (problems.length) {
  console.warn('warnings:');
  for (const p of [...new Set(problems)].slice(0, 20)) console.warn(`  ${p}`);
}

if (changed === 0) {
  console.log(`Topic card links: in sync — all topic-article-card hrefs canonical. (${targets.length} pages scanned.)`);
  process.exit(0);
}
console.log(`Topic card links: ${checkOnly ? 'would fix' : 'fixed'} ${changed} page(s):`);
for (const f of changedFiles.slice(0, 16)) console.log(`  ${f}`);
if (checkOnly) { console.error('Run: node scripts/inject-topic-card-links.mjs'); process.exit(1); }
process.exit(0);
