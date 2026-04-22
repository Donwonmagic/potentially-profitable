#!/usr/bin/env node
// One-shot: inject a visible breadcrumb nav into each blog post that
// doesn't already have one. The BreadcrumbList JSON-LD already exists
// in every post; this surfaces the same path in the UI so readers can
// orient themselves and walk back up to /learn/ or /blog/.
//
// Locale-aware:
//   - EN posts get "Home › Learn › Articles › <Post title>"
//   - ES posts get "Inicio › Aprende › Artículos › <Post title>"
//
// Idempotent: skips any file whose <main> already begins with a
// breadcrumb nav. Safe to re-run after new posts ship.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const LOCALE_LABELS = {
  en: { home: 'Home',   learn: 'Learn',   articles: 'Articles',  homeUrl: '/',     learnUrl: '/learn/',     articlesUrl: '/blog/',     ariaLabel: 'Breadcrumb' },
  es: { home: 'Inicio', learn: 'Aprende', articles: 'Artículos', homeUrl: '/es/',  learnUrl: '/es/learn/',  articlesUrl: '/es/blog/',  ariaLabel: 'Migas de pan' },
};

function collectPosts(locale) {
  const blogDir = locale === 'en'
    ? path.join(repoRoot, 'blog')
    : path.join(repoRoot, locale, 'blog');
  if (!fs.existsSync(blogDir)) return [];
  return fs.readdirSync(blogDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name !== 'drafts')
    .map(e => path.join(blogDir, e.name, 'index.html'))
    .filter(p => fs.existsSync(p));
}

// Pull the post's title from the <h1> inside .post-hero. Works whether
// the H1 is one line or split across <br>/<span class="serif-italic">
// (which the studio uses for typographic flourish on most posts).
function extractTitle(html) {
  const heroMatch = html.match(/<div class="post-hero">[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!heroMatch) return null;
  return heroMatch[1]
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*\(.*?\)\s*$/, '')
    .trim();
}

function buildBreadcrumb(locale, title) {
  const L = LOCALE_LABELS[locale];
  return `\n<nav class="breadcrumb container" aria-label="${L.ariaLabel}">
  <a href="${L.homeUrl}">${L.home}</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <a href="${L.learnUrl}">${L.learn}</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <a href="${L.articlesUrl}">${L.articles}</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <span aria-current="page">${title}</span>
</nav>
`;
}

// Match an existing breadcrumb nav at the top of the article, whether
// or not it sits inside a <main> wrapper. Both forms appear in the
// codebase: some posts have <main id="main">, others put the nav
// directly above the hero.
const EXISTING_BREADCRUMB_RE = /<nav class="breadcrumb container"[\s\S]*?<\/nav>\n?/;

let updated = 0, skipped = 0, replaced = 0, inserted = 0;
for (const locale of ['en', 'es']) {
  for (const file of collectPosts(locale)) {
    const src = fs.readFileSync(file, 'utf8');
    const title = extractTitle(src);
    if (!title) {
      console.warn(`skip (no h1 in .post-hero): ${path.relative(repoRoot, file)}`);
      skipped++;
      continue;
    }
    const desired = buildBreadcrumb(locale, title).replace(/^\n/, '');

    let next;
    if (EXISTING_BREADCRUMB_RE.test(src)) {
      // Replace the old-shape breadcrumb (Home > Blog > ...) with the
      // new shape (Home > Learn > Articles > ...). Idempotent: if the
      // existing nav is already the new shape, the replacement is a
      // no-op string-wise.
      next = src.replace(EXISTING_BREADCRUMB_RE, desired + '\n');
      if (next === src) { skipped++; continue; }
      replaced++;
    } else if (/<main id="main">/.test(src)) {
      // No breadcrumb yet, but a <main id="main"> anchor exists — drop
      // the new nav immediately after it.
      next = src.replace(/<main id="main">\n?/, m => m + '\n' + desired);
      if (next === src) { skipped++; continue; }
      inserted++;
    } else {
      // No breadcrumb, no <main> — drop the nav directly above the
      // first <section class="hero ...">.
      next = src.replace(/(<section class="hero[^"]*">)/, desired + '\n$1');
      if (next === src) {
        console.warn(`skip (no anchor): ${path.relative(repoRoot, file)}`);
        skipped++;
        continue;
      }
      inserted++;
    }
    fs.writeFileSync(file, next);
    updated++;
    console.log(`updated [${locale}]: ${path.relative(repoRoot, file)}  —  ${title}`);
  }
}
console.log(`\nbreakdown: ${replaced} replaced (old breadcrumb), ${inserted} inserted (none existed)`);
console.log(`\n${updated} updated, ${skipped} skipped.`);
