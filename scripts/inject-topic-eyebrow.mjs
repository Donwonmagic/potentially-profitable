#!/usr/bin/env node
/**
 * Topic eyebrow on every article. The content audit flagged that
 * every article uses the same generic eyebrow ("Muntin Digital ·
 * Writing"), missing a chance to identify the article's pillar
 * topic and link back to the cluster.
 *
 * This script reads the article-card grid on each /learn/topics/
 * <slug>/index.html, builds article-slug → topic-slug map, and
 * rewrites the article's <span class="eyebrow"> at the top of the
 * post header to read "Library · <Topic Name>" with a link to the
 * topic landing page.
 *
 * Articles not pinned to any topic cluster keep their existing
 * eyebrow.
 *
 *   node scripts/inject-topic-eyebrow.mjs           # rewrite
 *   node scripts/inject-topic-eyebrow.mjs --check   # exit 1 on diff
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const TOPICS = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/topics.json'), 'utf8')).topics;
const TOPIC_BY_SLUG = Object.fromEntries(TOPICS.map(t => [t.slug, t]));

// The eyebrow we're replacing — the FIRST <span class="eyebrow">
// inside <div class="post-hero">. Articles use various labels here
// (Writing, How-to, Strategy, etc.); rather than match every form,
// we anchor on the post-hero container and target its leading eyebrow.
const POST_HERO_EYEBROW_RE = /(<div class="post-hero">[\s\S]*?)<span class="eyebrow">[^<]*<\/span>/;

function buildArticleTopicMap(locale) {
  const map = {};
  const root = path.join(repoRoot, locale === 'es' ? 'es/learn/topics' : 'learn/topics');
  if (!fs.existsSync(root)) return map;
  for (const topicSlug of fs.readdirSync(root)) {
    const f = path.join(root, topicSlug, 'index.html');
    if (!fs.existsSync(f)) continue;
    const src = fs.readFileSync(f, 'utf8');
    const blogPrefix = locale === 'es' ? '/es/blog/' : '/blog/';
    const re = new RegExp(`<a class="topic-article-card" href="${blogPrefix}([^"/]+)/`, 'g');
    let m;
    while ((m = re.exec(src)) !== null) {
      const slug = m[1];
      // First topic wins — single canonical pillar per article.
      if (!map[slug]) map[slug] = topicSlug;
    }
  }
  return map;
}

function articleFiles() {
  const out = [];
  for (const dir of ['blog', 'es/blog']) {
    const root = path.join(repoRoot, dir);
    if (!fs.existsSync(root)) continue;
    const locale = dir.startsWith('es') ? 'es' : 'en';
    for (const slug of fs.readdirSync(root)) {
      if (slug === 'drafts' || slug === 'index.html') continue;
      const file = path.join(root, slug, 'index.html');
      if (fs.existsSync(file)) out.push({ file, slug, locale });
    }
  }
  return out;
}

function buildEyebrow(topicSlug, locale) {
  const t = TOPIC_BY_SLUG[topicSlug];
  if (!t) return null;
  const name = locale === 'es' ? (t.name_es || t.name) : t.name;
  const label = locale === 'es' ? 'Biblioteca' : 'Library';
  const href = locale === 'es' ? `/es/learn/topics/${topicSlug}/` : `/learn/topics/${topicSlug}/`;
  return `<span class="eyebrow">${label} &middot; <a href="${href}" style="color:inherit;text-decoration:none;border-bottom:1px dashed currentColor">${name}</a></span>`;
}

let changed = 0;
let skipped = 0;
const mapEN = buildArticleTopicMap('en');
const mapES = buildArticleTopicMap('es');

for (const { file, slug, locale } of articleFiles()) {
  const src = fs.readFileSync(file, 'utf8');
  const map = locale === 'es' ? mapES : mapEN;
  const topicSlug = map[slug];
  if (!topicSlug) { skipped++; continue; }
  const eyebrow = buildEyebrow(topicSlug, locale);
  if (!eyebrow) { skipped++; continue; }
  // Only replace if the eyebrow isn't already the topic eyebrow
  // (re-run idempotency).
  const expected = `topics/${topicSlug}/`;
  if (src.includes(`<span class="eyebrow">${expected.includes('es/') ? 'Biblioteca' : 'Library'}`) && src.includes(expected)) {
    skipped++; continue;
  }
  // The post header eyebrow is the first <span class="eyebrow">
  // inside <div class="post-hero">.
  const m = src.match(POST_HERO_EYEBROW_RE);
  if (!m) { skipped++; continue; }
  // Skip if the matched eyebrow already targets this topic page
  // (idempotent).
  if (m[0].includes(`/topics/${topicSlug}/`)) { skipped++; continue; }
  const next = src.replace(POST_HERO_EYEBROW_RE, `$1${eyebrow}`);
  if (next === src) { skipped++; continue; }
  if (!checkOnly) fs.writeFileSync(file, next);
  changed++;
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}  → ${topicSlug}`);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} article(s); ${skipped} skipped.`);
if (checkOnly && changed > 0) process.exit(1);
