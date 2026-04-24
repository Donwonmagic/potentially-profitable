#!/usr/bin/env node
// Library build script. Reads data/topics.json + data/library-tags.json
// and generates the new pieces of the educational ecosystem:
//
//   /learn/topics/index.html              — topics hub
//   /learn/topics/<slug>/index.html       — six topic pages
//   (Phase 2 chunks D and E will extend this script with research
//    backlinks, see-also blocks, and per-term glossary pages.)
//
// Run: node scripts/build-library.mjs
//
// The script is idempotent — every output file is fully overwritten
// from the data files on each run. Hand-edited content lives only in
// /blog/, /learn/research/, /tools/, /resources/, /glossary/. The
// generated pages are pure aggregation.

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(fileURLToPath(import.meta.url), '..', '..');
const DATA = join(REPO, 'data');

const topicsDoc = JSON.parse(readFileSync(join(DATA, 'topics.json'), 'utf8'));
const tagsDoc = JSON.parse(readFileSync(join(DATA, 'library-tags.json'), 'utf8'));

const TOPICS = topicsDoc.topics;
const TOPIC_BY_SLUG = Object.fromEntries(TOPICS.map(t => [t.slug, t]));

// ---------- helpers ----------

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function write(file, body) {
  ensureDir(dirname(file));
  writeFileSync(file, body, 'utf8');
}

// HTML-escape user-provided strings going into attributes / text.
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Index every piece of content by topic slug, in the order it should
// appear on the topic page (newest articles first; tools and research
// in the order declared in the tag file).
function indexByTopic() {
  const out = Object.fromEntries(TOPICS.map(t => [t.slug, {
    articles: [],
    research: [],
    tools: [],
    checklists: [],
  }]));

  for (const [slug, meta] of Object.entries(tagsDoc.blog_posts)) {
    for (const t of meta.topics) {
      if (out[t]) out[t].articles.push({ slug, ...meta });
    }
  }
  for (const [slug, meta] of Object.entries(tagsDoc.research_notes)) {
    for (const t of meta.topics) {
      if (out[t]) out[t].research.push({ slug, ...meta });
    }
  }
  for (const [slug, meta] of Object.entries(tagsDoc.tools)) {
    for (const t of meta.topics) {
      if (out[t]) out[t].tools.push({ slug, ...meta });
    }
  }
  for (const [slug, meta] of Object.entries(tagsDoc.checklists)) {
    for (const t of meta.topics) {
      if (out[t]) out[t].checklists.push({ slug, ...meta });
    }
  }

  // Articles sorted newest first
  for (const t of Object.keys(out)) {
    out[t].articles.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  return out;
}

// ---------- shared head/nav/footer fragments ----------

function pageHead({ title, description, canonical, ogImage = '/brand/og/library.png' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta name="theme-color" content="#1F4E5B" />
<link rel="canonical" href="${esc(canonical)}" />
<link rel="alternate" hreflang="en" href="${esc(canonical)}" />
<link rel="alternate" hreflang="es" href="${esc(canonical.replace('https://muntin.digital/', 'https://muntin.digital/es/'))}" />
<link rel="alternate" hreflang="x-default" href="${esc(canonical)}" />
<meta property="og:locale" content="en_US" />
<meta property="og:locale:alternate" content="es_US" />

<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:site_name" content="Muntin Digital" />
<meta property="og:image" content="https://muntin.digital${ogImage}" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="https://muntin.digital${ogImage}" />

<link rel="icon" type="image/svg+xml" sizes="any" href="/brand/mark/mark-square-ink.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/brand/favicons/android-chrome-192x192.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/brand/favicons/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/brand/favicons/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/brand/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/brand/favicons/site.webmanifest" />

<style>.breadcrumb{visibility:hidden;padding-top:100px}</style>
<link rel="stylesheet" href="/assets/site.css?v=20260422-cohesion">
</head>`;
}

function navHeader(altUrl) {
  return `<body>

<a class="skip-link" href="#main">Skip to main content</a>

<header class="nav" id="nav">
  <div class="container nav-inner">
    <a href="/" class="logo" aria-label="Muntin Digital home">
      <svg class="logo-mark" viewBox="0 0 128 128" fill="none" aria-hidden="true">
        <g stroke="currentColor" stroke-width="9" stroke-linecap="square" stroke-linejoin="miter">
          <rect x="18" y="18" width="92" height="92"/>
          <line x1="64" y1="18" x2="64" y2="110"/>
          <line x1="18" y1="49" x2="110" y2="49"/>
        </g>
      </svg>
      Muntin Digital<sup class="tm" aria-hidden="true">&#8482;</sup>
    </a>
    <nav class="nav-links" aria-label="Primary">
      <a href="/services/">Services</a>
      <a href="/for/restaurants/">Restaurants</a>
      <a href="/learn/">Learn</a>
      <a href="/work/">Work</a>
      <a href="/about/">About</a>
    </nav>
    <button type="button" class="nav-search-btn js-open-search" aria-label="Open search (Cmd+K)" title="Search — Cmd K">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7"/>
        <line x1="21" y1="21" x2="16.5" y2="16.5"/>
      </svg>
      <span class="nav-search-label">Search</span>
      <kbd class="nav-search-kbd" aria-hidden="true"><span class="nav-search-kbd-mod">⌘</span>K</kbd>
    </button>
    <nav class="lang-switch" aria-label="Language">
      <a href="${esc(altUrl)}" hreflang="es" lang="es" class="js-lang-switch" data-set-locale="es">Español</a>
      <span class="lang-switch-current" aria-current="true">EN</span>
    </nav>
    <a class="btn btn-primary js-book" href="https://calendly.com/dongoldstein-accts/muntinconsult" target="_blank" rel="noopener">Book a 20-min call<span class="sr-only"> (opens in new tab)</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></svg>
    </a>
    <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-controls="mobileMenu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
  <nav class="mobile-menu" id="mobileMenu" aria-label="Mobile navigation" hidden>
    <a href="/services/">Services</a>
    <a href="/for/restaurants/">Restaurants</a>
    <a href="/learn/">Learn</a>
    <a href="/work/">Work</a>
    <a href="/about/">About</a>
    <button type="button" class="mobile-search js-open-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>
      <span>Search the library</span>
    </button>
    <a class="btn btn-primary js-book" href="https://calendly.com/dongoldstein-accts/muntinconsult" target="_blank" rel="noopener">Book a 20-min call<span class="sr-only"> (opens in new tab)</span></a>
    <a href="${esc(altUrl)}" hreflang="es" lang="es" class="mobile-lang js-lang-switch" data-set-locale="es">Ver en español</a>
  </nav>

  <aside class="lang-hint" id="langHint" role="complementary" aria-label="Sugerencia de idioma" lang="es" hidden>
    <div class="container lang-hint-inner">
      <span class="lang-hint-text"><strong>¿Prefieres este sitio en español?</strong> Tenemos una versión completa.</span>
      <a href="${esc(altUrl)}" class="lang-hint-accept js-lang-switch" data-set-locale="es" hreflang="es" lang="es">Ver en español &rarr;</a>
      <button type="button" class="lang-hint-dismiss" id="langHintDismiss" aria-label="Cerrar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
      </button>
    </div>
  </aside>
</header>

<main id="main">`;
}

function siteFooter() {
  return `</main>

<footer>
  <div class="container">
    <div class="foot-cta">
      <div class="foot-cta-text">Ready to build something worth the time?</div>
      <a class="btn btn-primary js-book" href="https://calendly.com/dongoldstein-accts/muntinconsult" target="_blank" rel="noopener">Book a 20-min call<span class="sr-only"> (opens in new tab)</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></svg>
      </a>
    </div>

    <div class="foot-grid">
      <div class="foot-col foot-brand">
        <a href="/" class="foot-lockup-wrap" aria-label="Muntin Digital home">
          <img class="foot-lockup" src="/brand/lockup/lockup-horizontal-cream.svg" alt="Muntin Digital" width="240" height="53" loading="lazy" decoding="async">
          <sup class="tm" aria-hidden="true">&#8482;</sup>
        </a>
        <p class="foot-tagline">The window in.</p>
        <p class="foot-blurb">A restaurant web library and design studio in Silver Spring, MD &mdash; articles, free tools, research, and a 97-term glossary, with the studio behind them when you&rsquo;re ready to hire.</p>
      </div>

      <nav class="foot-col" aria-labelledby="foot-explore">
        <p class="foot-heading" id="foot-explore">Explore</p>
        <ul class="foot-links">
          <li><a href="/services/">Services</a></li>
          <li><a href="/for/restaurants/">For restaurants</a></li>
          <li><a href="/work/">Work</a></li>
          <li><a href="/about/">About Don</a></li>
          <li><a href="/system/">The system</a></li>
        </ul>
      </nav>

      <nav class="foot-col" aria-labelledby="foot-learn">
        <p class="foot-heading" id="foot-learn">Learn</p>
        <ul class="foot-links">
          <li><a href="/learn/">Library home</a></li>
          <li><a href="/learn/start-here/">Start here</a></li>
          <li><a href="/learn/topics/">Topics</a></li>
          <li><a href="/blog/">Articles</a></li>
          <li><a href="/tools/">Free tools</a></li>
          <li><a href="/glossary/">Glossary</a></li>
          <li><a href="/learn/research/">Research</a></li>
          <li><a href="/resources/">Checklists &amp; guides</a></li>
        </ul>
      </nav>

      <nav class="foot-col foot-contact" aria-labelledby="foot-contact">
        <p class="foot-heading" id="foot-contact">Contact</p>
        <ul class="foot-links">
          <li><a href="mailto:don@muntin.digital">don@muntin.digital</a></li>
          <li><a href="https://calendly.com/dongoldstein-accts/muntinconsult" target="_blank" rel="noopener">Book a 20-min call<span class="sr-only"> (opens in new tab)</span></a></li>
          <li><a href="https://www.instagram.com/muntin.digital/" target="_blank" rel="noopener">Instagram<span class="sr-only"> (opens in new tab)</span></a></li>
        </ul>
        <p class="foot-trust"><strong>Reply time:</strong> under 4 hours, Mon&#8211;Fri</p>
      </nav>
    </div>

    <div class="foot-bottom">
      <p class="foot-copy">&copy; 2026 Muntin Digital<span aria-hidden="true">&#8482;</span> &middot; Maryland LLC &middot; Silver Spring, MD</p>
      <nav class="foot-legal" aria-label="Legal">
        <a href="/terms.html">Terms</a>
        <a href="/privacy.html">Privacy</a>
        <a href="/accessibility.html">Accessibility</a>
        <a href="/cookies.html">Cookies</a>
      </nav>
    </div>
  </div>
</footer>

<script src="/assets/site.js?v=20260422-cohesion" defer></script>
</body>
</html>
`;
}

// ---------- topic page renderer ----------

function topicArticleCard({ slug, title, dek, date }) {
  const human = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  return `<li>
        <a class="topic-article-card" href="/blog/${esc(slug)}/">
          ${human ? `<span class="topic-article-date">${esc(human)}</span>` : ''}
          <h3>${esc(title)}</h3>
          <p>${esc(dek)}</p>
        </a>
      </li>`;
}

function topicResearchCard({ slug, title, source, dek }) {
  return `<li>
        <a class="topic-research-card" href="/learn/research/${esc(slug)}/">
          <span class="topic-research-source">${esc(source || 'Research')}</span>
          <h4>${esc(title)}</h4>
          <p>${esc(dek)}</p>
        </a>
      </li>`;
}

function topicToolCard({ slug, title, dek }) {
  return `<li>
        <a class="topic-tool-card" href="/tools/${esc(slug)}/">
          <h4>${esc(title)}</h4>
          <p>${esc(dek)}</p>
          <span class="topic-tool-cta">Open the tool <span aria-hidden="true">→</span></span>
        </a>
      </li>`;
}

function topicChecklistCard({ slug, title, dek }) {
  return `<li>
        <a class="topic-tool-card" href="/resources/${esc(slug)}/">
          <h4>${esc(title)}</h4>
          <p>${esc(dek)}</p>
          <span class="topic-tool-cta">Open the checklist <span aria-hidden="true">→</span></span>
        </a>
      </li>`;
}

function renderTopicPage(topic, content) {
  const canonical = `https://muntin.digital/learn/topics/${topic.slug}/`;
  const altUrl = `/es/learn/topics/${topic.slug}/`;
  const desc = `Everything in the Muntin Digital library about ${topic.name.toLowerCase()} — articles, research, tools, and checklists.`;

  const sections = [];

  if (content.articles.length) {
    sections.push(`
<section class="topic-section">
  <div class="container">
    <header class="topic-section-head">
      <span class="eyebrow">Articles</span>
      <h2>Read the playbooks.</h2>
    </header>
    <ul class="topic-article-list">
      ${content.articles.map(topicArticleCard).join('\n')}
    </ul>
  </div>
</section>`);
  }

  if (content.research.length) {
    sections.push(`
<section class="topic-section topic-section-alt">
  <div class="container">
    <header class="topic-section-head">
      <span class="eyebrow">Research</span>
      <h2>The evidence behind the playbooks.</h2>
    </header>
    <ul class="topic-research-list">
      ${content.research.map(topicResearchCard).join('\n')}
    </ul>
  </div>
</section>`);
  }

  if (content.tools.length) {
    sections.push(`
<section class="topic-section">
  <div class="container">
    <header class="topic-section-head">
      <span class="eyebrow">Free tools</span>
      <h2>Run a check on your own site.</h2>
    </header>
    <ul class="topic-tool-list">
      ${content.tools.map(topicToolCard).join('\n')}
    </ul>
  </div>
</section>`);
  }

  if (content.checklists.length) {
    sections.push(`
<section class="topic-section topic-section-alt">
  <div class="container">
    <header class="topic-section-head">
      <span class="eyebrow">Checklists</span>
      <h2>Workbooks for this topic.</h2>
    </header>
    <ul class="topic-tool-list">
      ${content.checklists.map(topicChecklistCard).join('\n')}
    </ul>
  </div>
</section>`);
  }

  return `${pageHead({
    title: `${topic.name} — Muntin Digital library`,
    description: desc,
    canonical,
  })}
${navHeader(altUrl)}

<nav class="breadcrumb container" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <a href="/learn/">Learn</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <a href="/learn/topics/">Topics</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <span aria-current="page">${esc(topic.name)}</span>
</nav>

<section class="hero hero-medium">
  <div class="container">
    <div class="hero-center">
      <span class="eyebrow">Topic</span>
      <h1 class="mt-20 topic-hero-h1">${esc(topic.name)}</h1>
      <p class="hero-sub hero-sub-narrow">${esc(topic.blurb)}</p>
    </div>
  </div>
</section>

${sections.join('\n')}

<section class="block final">
  <div class="container">
    <div class="section-header reveal section-center">
      <span class="eyebrow">Other topics</span>
      <h2>Or browse a<br><span class="serif-italic">different angle.</span></h2>
    </div>
    <ul class="topic-other-list">
      ${TOPICS.filter(t => t.slug !== topic.slug).map(t => `<li><a href="/learn/topics/${esc(t.slug)}/">${esc(t.name)}</a></li>`).join('\n      ')}
    </ul>
    <div class="hero-ctas reveal hero-ctas-center" style="margin-top:32px">
      <a class="btn btn-primary" href="/learn/">Back to the Library</a>
      <a class="btn btn-ghost" href="/blog/">All articles</a>
    </div>
  </div>
</section>

${siteFooter()}`;
}

function renderTopicsHub() {
  const canonical = 'https://muntin.digital/learn/topics/';
  const altUrl = '/es/learn/topics/';
  const cards = TOPICS.map(topic => {
    const c = byTopic[topic.slug];
    const counts = [];
    if (c.articles.length) counts.push(`${c.articles.length} ${c.articles.length === 1 ? 'article' : 'articles'}`);
    if (c.research.length) counts.push(`${c.research.length} research`);
    if (c.tools.length) counts.push(`${c.tools.length} ${c.tools.length === 1 ? 'tool' : 'tools'}`);
    return `<li>
      <a class="topics-hub-card" href="/learn/topics/${esc(topic.slug)}/">
        <h3>${esc(topic.name)}</h3>
        <p>${esc(topic.blurb)}</p>
        <span class="topics-hub-meta">${counts.join(' · ')}</span>
      </a>
    </li>`;
  }).join('\n');

  return `${pageHead({
    title: 'Topics — Muntin Digital library',
    description: 'Browse the Muntin Digital library by topic — speed and mobile, conversions and reservations, local SEO, operations and margin, trust and reviews, brand and design.',
    canonical,
  })}
${navHeader(altUrl)}

<nav class="breadcrumb container" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <a href="/learn/">Learn</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <span aria-current="page">Topics</span>
</nav>

<section class="hero hero-medium">
  <div class="container">
    <div class="hero-center">
      <span class="eyebrow">Six lenses on the same library</span>
      <h1 class="mt-20">
        Browse by<br>
        <span class="serif-italic">what you're trying to fix.</span>
      </h1>
      <p class="hero-sub hero-sub-narrow">
        The articles, research, tools, and checklists that make up the Library, regrouped by the question that brought you here. Pick the one that sounds like your week.
      </p>
    </div>
  </div>
</section>

<section class="block">
  <div class="container">
    <ul class="topics-hub-grid">
${cards}
    </ul>
  </div>
</section>

${siteFooter()}`;
}

// ---------- research backlinks ----------
//
// Walk every blog post, count which research notes it cites, and
// stamp a "Cited in" block on each research note. Idempotent —
// replaces the existing block between the LIBRARY:cited-in markers.

import { readdirSync, statSync } from 'node:fs';

function findCitations() {
  const cites = {}; // research-slug -> [{slug, title}]
  for (const [postSlug, postMeta] of Object.entries(tagsDoc.blog_posts)) {
    const file = join(REPO, 'blog', postSlug, 'index.html');
    const html = readFileSync(file, 'utf8');
    // Match /learn/research/<slug>/ inside the article body. We match
    // anywhere on the page; if a cite shows up in 'further reading'
    // or in a sidebar, that still counts as a citation.
    const seen = new Set();
    for (const m of html.matchAll(/\/learn\/research\/([a-z0-9-]+)\//g)) {
      seen.add(m[1]);
    }
    for (const researchSlug of seen) {
      if (!cites[researchSlug]) cites[researchSlug] = [];
      cites[researchSlug].push({ slug: postSlug, title: postMeta.title });
    }
  }
  // Sort each list by title for stable output
  for (const s of Object.keys(cites)) {
    cites[s].sort((a, b) => a.title.localeCompare(b.title));
  }
  return cites;
}

function renderCitedInBlock(researchSlug, citations) {
  if (!citations || !citations.length) {
    return `<!-- LIBRARY:cited-in:start --><!-- LIBRARY:cited-in:end -->`;
  }
  const items = citations.map(c =>
    `      <li><a href="/blog/${esc(c.slug)}/">${esc(c.title)}</a></li>`
  ).join('\n');
  const noun = citations.length === 1 ? 'article uses' : 'articles use';
  return `<!-- LIBRARY:cited-in:start -->
<section class="block research-cited-in" aria-labelledby="cited-in-h">
  <div class="container">
    <header class="research-cited-in-head">
      <span class="eyebrow">Cited in</span>
      <h2 id="cited-in-h">${citations.length} ${noun} this research.</h2>
    </header>
    <ul class="research-cited-in-list">
${items}
    </ul>
  </div>
</section>
<!-- LIBRARY:cited-in:end -->`;
}

function injectCitedIn(researchSlug, citations) {
  const file = join(REPO, 'learn/research', researchSlug, 'index.html');
  const html = readFileSync(file, 'utf8');
  const block = renderCitedInBlock(researchSlug, citations);

  // If markers exist, replace the marked region.
  const markerRe = /<!-- LIBRARY:cited-in:start -->[\s\S]*?<!-- LIBRARY:cited-in:end -->/;
  if (markerRe.test(html)) {
    writeFileSync(file, html.replace(markerRe, block), 'utf8');
    return 'updated';
  }

  // First run — inject the block right before the "More research"
  // / "Next in research" section. Every research note has
  // `<section class="block bg-cream2">` as that section's opener.
  const anchor = '<section class="block bg-cream2">';
  if (!html.includes(anchor)) {
    console.warn(`  warning: ${researchSlug}: no injection anchor found, skipping`);
    return 'skipped';
  }
  const replaced = html.replace(anchor, `${block}\n\n${anchor}`);
  writeFileSync(file, replaced, 'utf8');
  return 'inserted';
}

// ---------- run ----------

const byTopic = indexByTopic();

// Topics hub
write(join(REPO, 'learn/topics/index.html'), renderTopicsHub());

// Six topic pages
for (const topic of TOPICS) {
  const content = byTopic[topic.slug];
  write(join(REPO, 'learn/topics', topic.slug, 'index.html'), renderTopicPage(topic, content));
}

console.log(`Built /learn/topics/ + ${TOPICS.length} topic pages.`);
for (const t of TOPICS) {
  const c = byTopic[t.slug];
  console.log(`  ${t.slug.padEnd(20)} → ${c.articles.length} articles, ${c.research.length} research, ${c.tools.length} tools, ${c.checklists.length} checklists`);
}

// Research backlinks
const cites = findCitations();
console.log(`\nResearch backlinks:`);
for (const researchSlug of Object.keys(tagsDoc.research_notes)) {
  const list = cites[researchSlug] || [];
  const action = injectCitedIn(researchSlug, list);
  console.log(`  ${researchSlug.padEnd(34)} ${list.length} citing post(s) — ${action}`);
}

// Update the "Cited in N articles" labels on the research hub
// (/learn/research/index.html) so the counts match the new
// research backlinks. Keeps the index hub honest as posts are
// added.
{
  const file = join(REPO, 'learn/research/index.html');
  let html = readFileSync(file, 'utf8');
  let changed = 0;
  for (const researchSlug of Object.keys(tagsDoc.research_notes)) {
    const n = (cites[researchSlug] || []).length;
    const noun = n === 1 ? 'article' : 'articles';
    // Find the card for this slug, then replace its count span.
    // The structure is stable: <a class="research-index-card"
    // href="/learn/research/SLUG/"> ... <span class="research-index-uses">
    // Cited in <strong>N</strong> article(s)</span>.
    const cardRe = new RegExp(
      `(<a class="research-index-card" href="/learn/research/${researchSlug}/">[\\s\\S]*?<span class="research-index-uses">Cited in <strong>)(\\d+)(</strong> )(article|articles)(<\\/span>)`,
    );
    const replaced = html.replace(cardRe, (_m, p1, _old, p3, _oldNoun, p5) => {
      changed++;
      return `${p1}${n}${p3}${noun}${p5}`;
    });
    if (replaced !== html) html = replaced;
  }
  if (changed) {
    writeFileSync(file, html, 'utf8');
    console.log(`Updated ${changed} citation count(s) on /learn/research/`);
  }
}
