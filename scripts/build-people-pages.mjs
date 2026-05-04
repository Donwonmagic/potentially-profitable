#!/usr/bin/env node
/**
 * Phase F.7 (Field Notes) — generate per-contributor pages at
 * /people/<author-slug>/ (and /es/people/<author-slug>/).
 *
 * Each page is the public archive of one operator's approved field
 * notes — the moat that turns the contributor list into a share-loop
 * surface. Reads data/article-fieldnotes.json, groups notes by
 * (locale, slugified author), writes one page per group.
 *
 * Idempotent: re-running with the same data produces no diff.
 *
 * Cleanup: any /people/<slug>/ that's no longer referenced by an
 * approved note (author renamed, all notes withdrawn, etc.) is
 * removed — but ONLY if the file carries our auto-generated sentinel
 * comment, so hand-authored pages would never be touched.
 *
 * Usage:
 *   node scripts/build-people-pages.mjs
 *   node scripts/build-people-pages.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const dataPath = path.join(repoRoot, 'data', 'article-fieldnotes.json');
const data     = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const fieldnotes = data.fieldnotes || {};

const AUTO_MARKER = '<!-- people:auto -->';

function readPartial(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}
const NAV_EN = readPartial('_includes/nav.html');
const NAV_ES = readPartial('_includes/es/nav.html');
const FOOTER_EN = readPartial('_includes/footer.html');
const FOOTER_ES = readPartial('_includes/es/footer.html');

// Slug from display name. Lowercase, strip diacritics, collapse
// non-alphanumeric to hyphens. v1: collisions merge contributors
// onto the same page (rare; revisit when it happens).
function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function escAttr(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
}
function escText(s) {
  return String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;' })[c]);
}

function fmtDate(ts, locale) {
  const d = new Date(ts || Date.now());
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale === 'es' ? 'es-US' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function articleTitle(slug, locale) {
  // Best-effort: read <title> from the article HTML, strip the site
  // suffix. This keeps the contributor page in sync with the actual
  // article without a separate title registry.
  const file = path.join(repoRoot, locale === 'es' ? 'es/blog' : 'blog', slug, 'index.html');
  try {
    const src = fs.readFileSync(file, 'utf8');
    const m = src.match(/<title>([^<]+)<\/title>/);
    if (m) {
      return m[1].split(' — ')[0].split(' | ')[0].trim();
    }
  } catch (_) { /* fallback */ }
  return slug.replace(/-/g, ' ');
}

// Phase G.2c — Person + ItemList JSON-LD per contributor page.
// Each approved field note becomes a Comment that the Person
// `subjectOf` lists. Google + LLM search engines treat this as
// authoritative attribution: the contributor is the subject;
// the article is what they're commenting on; the body is the
// citation-quotable substance.
function renderPersonSchema({ locale, slug, author, notes }) {
  const SITE = 'https://muntin.digital';
  const baseUrl = `${SITE}${locale === 'es' ? '/es' : ''}/people/${slug}/`;
  const personId = `${baseUrl}#person`;
  const ogImg = `${SITE}/brand/og/people-${slug}${locale === 'es' ? '-es' : ''}.png`;

  const comments = notes.map((n, i) => {
    const articleUrl = `${SITE}${locale === 'es' ? '/es' : ''}/blog/${n.articleSlug}/`;
    return {
      '@type': 'Comment',
      '@id': `${baseUrl}#note-${i + 1}`,
      author: { '@id': personId },
      about: { '@type': 'Article', url: articleUrl, headline: articleTitle(n.articleSlug, locale) },
      text: n.body,
      dateCreated: n.approvedAt ? new Date(n.approvedAt).toISOString() : undefined,
      url: `${articleUrl}#field-notes`,
    };
  });

  const itemList = {
    '@type': 'ItemList',
    '@id': `${baseUrl}#notes`,
    numberOfItems: notes.length,
    itemListElement: notes.map((n, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: { '@id': `${baseUrl}#note-${i + 1}` },
    })),
  };

  const obj = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        name: author,
        jobTitle: locale === 'es' ? 'Operador de restaurante' : 'Restaurant Operator',
        url: baseUrl,
        image: ogImg,
        subjectOf: { '@id': `${baseUrl}#notes` },
        publishingPrinciples: `${SITE}/about/`,
      },
      itemList,
      ...comments,
    ],
  };
  const json = JSON.stringify(obj, null, 2);
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

function renderPage({ locale, slug, author, notes }) {
  const isEs = locale === 'es';
  const nav = isEs ? NAV_ES : NAV_EN;
  const footer = isEs ? FOOTER_ES : FOOTER_EN;
  const baseHref = isEs ? '/es/' : '/';
  const blogBase = isEs ? '/es/blog/' : '/blog/';
  const peopleBase = isEs ? '/es/people/' : '/people/';
  const altLocale = isEs ? 'en' : 'es';
  const altPath = isEs ? `/people/${slug}/` : `/es/people/${slug}/`;

  const title = isEs
    ? `Apuntes de ${author} — Muntin Digital`
    : `Field notes from ${author} — Muntin Digital`;
  const desc = isEs
    ? `${notes.length} apunte${notes.length === 1 ? '' : 's'} de ${author} en Muntin Digital — experiencias publicadas con su nombre.`
    : `${notes.length} field note${notes.length === 1 ? '' : 's'} from ${author} on Muntin Digital — published experiences attributed by name.`;

  // Sort notes newest-first for the contributor view.
  const sorted = notes.slice().sort((a, b) => (b.approvedAt || 0) - (a.approvedAt || 0));

  const noteBlocks = sorted.map((n) => {
    const articleHref = blogBase + n.articleSlug + '/';
    const t = articleTitle(n.articleSlug, locale);
    const dateLabel = isEs ? `Publicado ${fmtDate(n.approvedAt, locale)}` : `Published ${fmtDate(n.approvedAt, locale)}`;
    const articlePrefix = isEs ? 'En:' : 'On:';
    const donsLeadin = isEs ? 'Don añade —' : 'Don adds —';
    let donsBlock = '';
    if (n.donsResponse) {
      donsBlock = `\n        <p class="callout-body"><span class="callout-eyebrow-inline">${donsLeadin}</span> ${n.donsResponse}</p>`;
    }
    return [
      '      <aside class="callout callout--field people-note">',
      `        <p class="callout-eyebrow">${articlePrefix} <a href="${articleHref}">${escText(t)}</a></p>`,
      `        <p class="callout-body">${n.body}</p>${donsBlock}`,
      `        <p class="people-note__date">${dateLabel}</p>`,
      '      </aside>',
    ].join('\n');
  }).join('\n');

  const eyebrowLabel = isEs ? 'Contribuidor' : 'Contributor';
  const headlinePrefix = isEs ? 'Apuntes de' : 'Field notes from';
  const archiveLabel = isEs
    ? `${notes.length} apunte${notes.length === 1 ? '' : 's'} publicado${notes.length === 1 ? '' : 's'}`
    : `${notes.length} note${notes.length === 1 ? '' : 's'} published`;
  const introBlurb = isEs
    ? 'Cada apunte fue revisado y aprobado editorialmente. Los contribuidores hablan con su voz; Don a veces añade una respuesta.'
    : 'Every note was editorially reviewed and approved. Contributors speak in their own voice; Don sometimes adds a reply.';

  return `<!doctype html>
<html lang="${locale}">
<head>
${AUTO_MARKER}
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<title>${escText(title)}</title>
<meta name="description" content="${escAttr(desc)}" />
<meta name="theme-color" content="#1F4E5B" />
<link rel="canonical" href="https://muntin.digital${peopleBase}${slug}/" />
<link rel="alternate" hreflang="${locale}" href="https://muntin.digital${peopleBase}${slug}/" />
<link rel="alternate" hreflang="${altLocale}" href="https://muntin.digital${altPath}" />
<link rel="alternate" hreflang="x-default" href="https://muntin.digital/people/${slug}/" />
<meta property="og:type" content="profile" />
<meta property="og:title" content="${escAttr(title)}" />
<meta property="og:description" content="${escAttr(desc)}" />
<meta property="og:url" content="https://muntin.digital${peopleBase}${slug}/" />
<meta property="og:site_name" content="Muntin Digital" />
<meta property="og:image" content="https://muntin.digital/brand/og/people-${slug}${isEs ? '-es' : ''}.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="${isEs ? 'es_US' : 'en_US'}" />
<meta property="og:locale:alternate" content="${isEs ? 'en_US' : 'es_US'}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escAttr(title)}" />
<meta name="twitter:description" content="${escAttr(desc)}" />
<meta name="twitter:image" content="https://muntin.digital/brand/og/people-${slug}${isEs ? '-es' : ''}.png" />
<link rel="icon" type="image/svg+xml" sizes="any" href="/brand/mark/mark-square-ink.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/brand/favicons/android-chrome-192x192.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/brand/favicons/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/brand/favicons/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/brand/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/brand/favicons/site.webmanifest" />
<script async src="https://plausible.io/js/pa-LcA9d3kj64ol8aOaLm7Z7.js"></script>
<script>window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()</script>
<style>.breadcrumb{padding-top:100px}</style>
<link rel="stylesheet" href="/assets/site.css?v=20260429-batch3">
${renderPersonSchema({ locale, slug, author, notes: sorted })}
</head>
<body>
<a class="skip-link" href="#main">${isEs ? 'Ir al contenido' : 'Skip to main content'}</a>
${nav}

<main id="main">
<nav class="breadcrumb container" aria-label="Breadcrumb"><a href="${baseHref}">${isEs ? 'Inicio' : 'Home'}</a><span class="breadcrumb-sep" aria-hidden="true">&#8250;</span><a href="${peopleBase}">${isEs ? 'Contribuidores' : 'Contributors'}</a><span class="breadcrumb-sep" aria-hidden="true">&#8250;</span><span aria-current="page">${escText(author)}</span></nav>

<section class="hero hero-tight"><div class="container"><div class="people-hero">
  <span class="eyebrow">${eyebrowLabel}</span>
  <h1>${headlinePrefix} <span class="serif-italic">${escText(author)}</span>.</h1>
  <p class="hero-sub">${escText(archiveLabel)}. ${introBlurb}</p>
</div></div></section>

<section class="block">
  <div class="container">
    <div class="people-notes">
${noteBlocks}
    </div>
  </div>
</section>
</main>

${footer}
<script src="/assets/site.js?v=20260429-batch3" defer></script>
</body>
</html>
`;
}

// Build the set of (locale, slug) → group, with the resolved data.
const groups = { en: {}, es: {} };
for (const [articleSlug, perLocale] of Object.entries(fieldnotes)) {
  for (const locale of ['en', 'es']) {
    const arr = perLocale[locale] || [];
    for (const note of arr) {
      if (!note || !note.author) continue;
      const slug = slugify(note.author);
      if (!slug) continue;
      if (!groups[locale][slug]) groups[locale][slug] = { author: note.author, notes: [] };
      groups[locale][slug].notes.push({ articleSlug, ...note });
    }
  }
}

let changed = 0;
let written = 0;
let removed = 0;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

for (const locale of ['en', 'es']) {
  const peopleRoot = path.join(repoRoot, locale === 'en' ? 'people' : 'es/people');
  // Build set of slugs we want to keep this locale.
  const wantedSlugs = new Set(Object.keys(groups[locale]));

  // Write or update each contributor page.
  for (const [slug, info] of Object.entries(groups[locale])) {
    const targetDir = path.join(peopleRoot, slug);
    const target = path.join(targetDir, 'index.html');
    const html = renderPage({ locale, slug, author: info.author, notes: info.notes });
    const prev = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    if (prev === html) continue;
    if (!checkOnly) {
      ensureDir(targetDir);
      fs.writeFileSync(target, html);
    }
    console.log(`${checkOnly ? 'would write' : 'wrote'}: ${path.relative(repoRoot, target)}`);
    written++;
    changed++;
  }

  // Cleanup: remove orphaned auto-generated pages.
  if (fs.existsSync(peopleRoot)) {
    for (const entry of fs.readdirSync(peopleRoot)) {
      if (wantedSlugs.has(entry)) continue;
      const orphan = path.join(peopleRoot, entry, 'index.html');
      if (!fs.existsSync(orphan)) continue;
      const src = fs.readFileSync(orphan, 'utf8');
      if (!src.includes(AUTO_MARKER)) continue; // hand-authored, never touch
      if (!checkOnly) {
        fs.rmSync(path.join(peopleRoot, entry), { recursive: true, force: true });
      }
      console.log(`${checkOnly ? 'would remove' : 'removed'}: ${path.relative(repoRoot, orphan)}`);
      removed++;
      changed++;
    }
  }
}

console.log(`\n${checkOnly ? 'would change' : 'changed'} ${changed} file(s) (${written} written, ${removed} removed).`);
if (checkOnly && changed > 0) process.exit(1);
