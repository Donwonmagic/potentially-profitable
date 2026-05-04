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
// /blog/, /learn/research/, /tools/, /learn/checklists/, /glossary/. The
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

// ---------- locales ----------
//
// The build runs once per locale. EN output lives at the repo root;
// ES output lives under /es/. Content metadata (titles, deks) for
// ES is parsed from the existing translated pages — single source
// of truth stays in the published Spanish content, not in JSON
// duplicates that would drift.

const LOCALES = ['en', 'es'];

// UI string table. Every string my generated pages display lives
// here. Keep keys terse; keep values plain (no markup).
const STRINGS = {
  en: {
    breadcrumb_home: 'Home',
    breadcrumb_learn: 'Learn',
    breadcrumb_topics: 'Topics',
    breadcrumb_glossary: 'Glossary',
    breadcrumb_aria: 'Breadcrumb',
    skip_link: 'Skip to main content',
    topics_hub_eyebrow: 'Six lenses on the same library',
    topics_hub_h1_l1: 'Browse by',
    topics_hub_h1_l2: "what you're trying to fix.",
    topics_hub_sub: "The articles, research, tools, and checklists that make up the Library, regrouped by the question that brought you here. Pick the one that sounds like your week.",
    topic_eyebrow: 'Topic',
    topic_section_articles_eyebrow: 'Articles',
    topic_section_articles_h2: 'Read the playbooks.',
    topic_section_research_eyebrow: 'Research',
    topic_section_research_h2: 'The evidence behind the playbooks.',
    topic_section_tools_eyebrow: 'Free tools',
    topic_section_tools_h2: 'Run a check on your own site.',
    topic_section_checklists_eyebrow: 'Checklists',
    topic_section_checklists_h2: 'Workbooks for this topic.',
    topic_section_terms_eyebrow: 'Vocabulary',
    topic_section_terms_h2: 'The words for this topic.',
    topic_section_terms_more: 'See all in the glossary',
    topic_other_eyebrow: 'Other topics',
    topic_other_h2_l1: 'Or browse a',
    topic_other_h2_l2: 'different angle.',
    topic_back_btn: 'Back to the Library',
    topic_back_btn_alt: 'All articles',
    open_tool_cta: 'Open the tool',
    open_checklist_cta: 'Open the checklist',
    cited_in_eyebrow: 'Cited in',
    cited_in_singular: 'article uses',
    cited_in_plural: 'articles use',
    cited_in_suffix: 'this research.',
    see_also_label: 'See also',
    see_also_kind_article: 'Article',
    see_also_kind_research: 'Research',
    see_also_kind_tool: 'Tool',
    tool_deep_eyebrow: 'Learn more',
    tool_deep_h2: 'Why this tool exists.',
    tool_deep_blurb: 'Every check this tool runs maps to a specific concept in the Library. Two starting points — one definition, one playbook.',
    tool_deep_kind_glossary: 'Glossary',
    tool_deep_kind_article: 'Article',
    tool_deep_cta_glossary: 'Read the definition',
    tool_deep_cta_article: 'Read the playbook',
    term_aria_breadcrumb: 'Breadcrumb',
    term_more_in_section: 'More in',
    term_final_eyebrow: 'Glossary',
    term_final_h2_l1: 'Browse all',
    term_final_h2_l2: '<!-- count:glossary.terms -->135<!-- /count --> terms.',
    term_final_sub: 'Plain-English definitions for every term in your audit, organized by category.',
    term_final_btn: 'Open the full glossary',
    term_final_btn_alt: 'Back to the Library',
    research_see: 'See the research',
  },
  es: {
    breadcrumb_home: 'Inicio',
    breadcrumb_learn: 'Aprende',
    breadcrumb_topics: 'Temas',
    breadcrumb_glossary: 'Glosario',
    breadcrumb_aria: 'Migas de pan',
    skip_link: 'Saltar al contenido principal',
    topics_hub_eyebrow: 'Seis lentes para la misma biblioteca',
    topics_hub_h1_l1: 'Explora según',
    topics_hub_h1_l2: 'lo que estás arreglando.',
    topics_hub_sub: 'Los artículos, investigación, herramientas y listas de la biblioteca, reagrupados según la pregunta que te trajo aquí. Elige el que suena a tu semana.',
    topic_eyebrow: 'Tema',
    topic_section_articles_eyebrow: 'Artículos',
    topic_section_articles_h2: 'Lee las guías.',
    topic_section_research_eyebrow: 'Investigación',
    topic_section_research_h2: 'La evidencia detrás de las guías.',
    topic_section_tools_eyebrow: 'Herramientas gratis',
    topic_section_tools_h2: 'Revisa tu propio sitio.',
    topic_section_checklists_eyebrow: 'Listas',
    topic_section_checklists_h2: 'Workbooks para este tema.',
    topic_section_terms_eyebrow: 'Vocabulario',
    topic_section_terms_h2: 'Las palabras de este tema.',
    topic_section_terms_more: 'Ver todo en el glosario',
    topic_other_eyebrow: 'Otros temas',
    topic_other_h2_l1: 'O explora desde',
    topic_other_h2_l2: 'otro ángulo.',
    topic_back_btn: 'Volver a la biblioteca',
    topic_back_btn_alt: 'Todos los artículos',
    open_tool_cta: 'Abrir la herramienta',
    open_checklist_cta: 'Abrir la lista',
    cited_in_eyebrow: 'Citada en',
    cited_in_singular: 'artículo usa',
    cited_in_plural: 'artículos usan',
    cited_in_suffix: 'esta investigación.',
    see_also_label: 'Ver también',
    see_also_kind_article: 'Artículo',
    see_also_kind_research: 'Investigación',
    see_also_kind_tool: 'Herramienta',
    tool_deep_eyebrow: 'Aprende más',
    tool_deep_h2: 'Por qué existe esta herramienta.',
    tool_deep_blurb: 'Cada chequeo que esta herramienta hace conecta con un concepto específico en la biblioteca. Dos puntos de partida — una definición, una guía.',
    tool_deep_kind_glossary: 'Glosario',
    tool_deep_kind_article: 'Artículo',
    tool_deep_cta_glossary: 'Leer la definición',
    tool_deep_cta_article: 'Leer la guía',
    term_aria_breadcrumb: 'Migas de pan',
    term_more_in_section: 'Más en',
    term_final_eyebrow: 'Glosario',
    term_final_h2_l1: 'Explora los',
    term_final_h2_l2: '<!-- count:glossary.terms -->135<!-- /count --> términos.',
    term_final_sub: 'Definiciones en lenguaje claro para cada término en tu auditoría, organizadas por categoría.',
    term_final_btn: 'Abrir el glosario completo',
    term_final_btn_alt: 'Volver a la biblioteca',
    research_see: 'Ver la investigación',
  },
};

function t(locale, key) {
  return STRINGS[locale]?.[key] ?? STRINGS.en[key] ?? `[?${key}]`;
}

// Build a URL prefix for the locale. EN lives at root; ES lives at /es.
function urlPrefix(locale) {
  return locale === 'en' ? '' : `/${locale}`;
}

// Build an absolute URL on muntin.digital for the given locale + path.
function urlFor(locale, path) {
  // path starts with '/'. Insert locale prefix between the host and path.
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return `https://muntin.digital${prefix}${path}`;
}

// Build a same-origin URL (no host) for the locale + path.
function pathFor(locale, path) {
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return `${prefix}${path}`;
}

// Resolve the on-disk output directory for the locale. EN writes to
// the repo root; ES writes to <repo>/es/.
function outDir(locale) {
  return locale === 'en' ? REPO : join(REPO, locale);
}

// Decode a small set of HTML entities found in scraped ES titles.
function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&iquest;/gi, '¿')
    .replace(/&iexcl;/gi, '¡')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&hellip;/gi, '…')
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&ldquo;/gi, '"')
    .replace(/&rdquo;/gi, '"')
    .replace(/&divide;/gi, '÷')
    .replace(/&times;/gi, '×')
    .replace(/&ge;/gi, '≥')
    .replace(/&le;/gi, '≤')
    .replace(/&plusmn;/gi, '±')
    .replace(/&middot;/gi, '·')
    .replace(/&copy;/gi, '©')
    .replace(/&reg;/gi, '®')
    .replace(/&trade;/gi, '™')
    .replace(/&deg;/gi, '°')
    .replace(/&rarr;/gi, '→')
    .replace(/&larr;/gi, '←')
    .replace(/&nbsp;/gi, ' ');
}

// Read title + meta description from an existing HTML file. Strips
// "| Muntin Digital" suffix and decodes common HTML entities. Used
// to pull authoritative ES content metadata from the published
// Spanish pages instead of duplicating into JSON.
const _metaCache = new Map();
function pageMeta(file) {
  if (_metaCache.has(file)) return _metaCache.get(file);
  let html = '';
  try { html = readFileSync(file, 'utf8'); } catch { return { title: '', dek: '', readMinutes: 0 }; }
  const titleM = html.match(/<title>([\s\S]*?)<\/title>/i);
  const descM = html.match(/<meta[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']*)["']/i)
             || html.match(/<meta[^>]*\bcontent=["']([^"']*)["'][^>]*\bname=["']description["']/i);
  const title = titleM ? decodeEntities(titleM[1]).replace(/\s*\|\s*Muntin Digital\s*$/, '').trim() : '';
  const dek = descM ? decodeEntities(descM[1]).trim() : '';
  // Read-time estimate. Strip nav/footer/header/script/style/aside, then
  // count words inside <article id="post-body"> (or fall back to <main>).
  // 220 wpm is the median for adult silent reading on web prose.
  let readMinutes = 0;
  const articleM = html.match(/<article[^>]*id=["']post-body["'][^>]*>([\s\S]*?)<\/article>/i)
                || html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (articleM) {
    const text = articleM[1]
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;|&#?\w+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) {
      const words = text.split(' ').filter(Boolean).length;
      readMinutes = Math.max(1, Math.round(words / 220));
    }
  }
  const out = { title, dek, readMinutes };
  _metaCache.set(file, out);
  return out;
}

// Locale-aware metadata for a piece of content. EN reads tagsDoc;
// ES reads the corresponding ES page's <title> + <meta description>.
function getMeta(locale, kind, slug) {
  if (locale === 'en') {
    const dict = tagsDoc[kind === 'blog' ? 'blog_posts' : kind === 'research' ? 'research_notes' : kind];
    return dict?.[slug] || {};
  }
  // ES: scrape the page
  let file;
  switch (kind) {
    case 'blog': file = join(REPO, 'es/blog', slug, 'index.html'); break;
    case 'research': file = join(REPO, 'es/learn/research', slug, 'index.html'); break;
    case 'tools': file = join(REPO, 'es/tools', slug, 'index.html'); break;
    case 'checklists': file = join(REPO, 'es/resources', slug, 'index.html'); break;
    default: return {};
  }
  const { title, dek } = pageMeta(file);
  // Inherit topics + date from EN tagsDoc (those are facts, not language)
  const dict = tagsDoc[kind === 'blog' ? 'blog_posts' : kind === 'research' ? 'research_notes' : kind];
  const enMeta = dict?.[slug] || {};
  return {
    ...enMeta,
    title: title || enMeta.title || slug,
    dek: dek || enMeta.dek || '',
  };
}

// Topic name + blurb in the requested locale.
function topicLabel(locale, topic) {
  if (locale === 'es') {
    return { name: topic.name_es || topic.name, blurb: topic.blurb_es || topic.blurb };
  }
  return { name: topic.name, blurb: topic.blurb };
}

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
// in the order declared in the tag file). Locale-aware: ES pulls
// titles + deks from the published Spanish pages.
function indexByTopic(locale) {
  const out = Object.fromEntries(TOPICS.map(tp => [tp.slug, {
    articles: [],
    research: [],
    tools: [],
    checklists: [],
    terms: [],
  }]));

  for (const [slug, enMeta] of Object.entries(tagsDoc.blog_posts)) {
    const meta = getMeta(locale, 'blog', slug);
    const merged = { slug, ...enMeta, title: meta.title, dek: meta.dek };
    for (const tp of (enMeta.topics || [])) {
      if (out[tp]) out[tp].articles.push(merged);
    }
  }
  for (const [slug, enMeta] of Object.entries(tagsDoc.research_notes)) {
    const meta = getMeta(locale, 'research', slug);
    const merged = { slug, ...enMeta, title: meta.title, dek: meta.dek };
    for (const tp of (enMeta.topics || [])) {
      if (out[tp]) out[tp].research.push(merged);
    }
  }
  for (const [slug, enMeta] of Object.entries(tagsDoc.tools)) {
    const meta = getMeta(locale, 'tools', slug);
    const merged = { slug, ...enMeta, title: meta.title, dek: meta.dek };
    for (const tp of (enMeta.topics || [])) {
      if (out[tp]) out[tp].tools.push(merged);
    }
  }
  for (const [slug, enMeta] of Object.entries(tagsDoc.checklists)) {
    const meta = getMeta(locale, 'checklists', slug);
    const merged = { slug, ...enMeta, title: meta.title, dek: meta.dek };
    for (const tp of (enMeta.topics || [])) {
      if (out[tp]) out[tp].checklists.push(merged);
    }
  }
  for (const term of glossaryTerms(locale)) {
    for (const tp of term.topics) {
      if (out[tp]) out[tp].terms.push(term);
    }
  }

  for (const tp of Object.keys(out)) {
    out[tp].articles.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    // Stable alphabetical order on terms so layouts don't churn between
    // builds when an author adds a new term in the middle of a section.
    out[tp].terms.sort((a, b) => a.headword.localeCompare(b.headword, locale === 'es' ? 'es' : 'en'));
  }

  return out;
}

// Parse glossary index for the given locale and return one record per
// term: { slug, topics: [...], headword, aka }. The data-topics attr
// is the source of truth (set by scripts/wire-glossary-topics.mjs); the
// headword is the <h3>'s plain text without the .gloss-aka span; the
// aka is whatever lives inside that span (may be empty).
const _glossaryTermsCache = {};
function glossaryTerms(locale) {
  if (_glossaryTermsCache[locale]) return _glossaryTermsCache[locale];
  const file = locale === 'en'
    ? join(REPO, 'glossary', 'index.html')
    : join(REPO, 'es', 'glossary', 'index.html');
  const html = readFileSync(file, 'utf8');
  // Match: <article class="gloss-term" id="..." ... data-topics="..." ...>
  //          ... <h3>HEADWORD<span class="gloss-aka">AKA</span></h3>
  // or       ... <h3>HEADWORD</h3>          (no AKA)
  const RE = /<article class="gloss-term"\s+id="([^"]+)"[^>]*?data-topics="([^"]*)"[^>]*>[\s\S]*?<h3>([\s\S]*?)<\/h3>/g;
  const AKA_RE = /<span class="gloss-aka">([\s\S]*?)<\/span>/;
  const out = [];
  let m;
  while ((m = RE.exec(html)) !== null) {
    const slug   = m[1];
    const topics = m[2].split(/\s+/).filter(Boolean);
    let h3       = m[3];
    let aka      = '';
    const akaM   = AKA_RE.exec(h3);
    if (akaM) {
      aka = decodeBasicEntities(akaM[1]).trim();
      h3  = h3.replace(AKA_RE, '');
    }
    const headword = decodeBasicEntities(h3).replace(/\s+/g, ' ').trim();
    out.push({ slug, topics, headword, aka });
  }
  _glossaryTermsCache[locale] = out;
  return out;
}

function decodeBasicEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g,  '<')
    .replace(/&gt;/g,  '>')
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—');
}

// ---------- shared head/nav/footer fragments ----------

function pageHead(locale, { title, description, canonical, ogImage, jsonLd }) {
  // Default OG image: the Library hub card. Renderers (renderTopicsHub,
  // renderTopicPage, renderTermPage) override via ogImage when they
  // have a more specific card. ES pages use the -es suffix.
  if (!ogImage) {
    ogImage = locale === 'es' ? '/brand/og/library-es.png' : '/brand/og/library.png';
  } else if (locale === 'es') {
    // Swap any EN-suffixed default to its ES counterpart.
    if (ogImage === '/brand/og/glossary.png') ogImage = '/brand/og/glossary-es.png';
    if (ogImage === '/brand/og/learn.png') ogImage = '/brand/og/learn-es.png';
    if (ogImage === '/brand/og/topics.png') ogImage = '/brand/og/topics-es.png';
  }
  // Compute hreflang counterparts. canonical is locale-correct
  // already; build the other locale's URL by toggling the /es/ prefix.
  const enUrl = locale === 'en' ? canonical : canonical.replace('https://muntin.digital/es/', 'https://muntin.digital/');
  const esUrl = locale === 'es' ? canonical : canonical.replace('https://muntin.digital/', 'https://muntin.digital/es/');
  const ogLocale = locale === 'es' ? 'es_US' : 'en_US';
  const ogAltLocale = locale === 'es' ? 'en_US' : 'es_US';
  const lang = locale;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta name="theme-color" content="#1F4E5B" />
<link rel="canonical" href="${esc(canonical)}" />
<link rel="alternate" hreflang="en" href="${esc(enUrl)}" />
<link rel="alternate" hreflang="es" href="${esc(esUrl)}" />
<link rel="alternate" hreflang="x-default" href="${esc(enUrl)}" />
<meta property="og:locale" content="${ogLocale}" />
<meta property="og:locale:alternate" content="${ogAltLocale}" />

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

<style>.breadcrumb{padding-top:100px}</style>
<link rel="stylesheet" href="/assets/site.css?v=20260425-mobile-library-fix">
${jsonLd ? `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>` : ''}
</head>`;
}

function navHeader(altUrl, bodyClass) {
  return `<body${bodyClass ? ` class="${bodyClass}"` : ''}>

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
    <a class="btn btn-primary js-window" href="/window/" title="A direct line to Don. I read every one.">Write to Don
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
    <a class="btn btn-primary js-window" href="/window/" title="A direct line to Don. I read every one.">Write to Don</a>
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
      <a class="btn btn-primary js-window" href="/window/" title="A direct line to Don. I read every one.">Write to Don
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
        <p class="foot-blurb">A restaurant web library and design studio in Silver Spring, MD &mdash; articles, free tools, research, and a <!-- count:glossary.terms -->135<!-- /count -->-term glossary, with the studio behind them when you&rsquo;re ready to hire.</p>
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
          <li><a href="/learn/checklists/">Checklists &amp; guides</a></li>
        </ul>
      </nav>

      <nav class="foot-col foot-contact" aria-labelledby="foot-contact">
        <p class="foot-heading" id="foot-contact">Contact</p>
        <ul class="foot-links">
          <li><a href="mailto:don@muntin.digital">don@muntin.digital</a></li>
          <li><a href="/window/">Write to Don</a></li>
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

function topicArticleCard(locale, { slug, title, dek, date }) {
  const human = date ? new Date(date).toLocaleDateString(locale === 'es' ? 'es-US' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  return `<li>
        <a class="topic-article-card" href="${pathFor(locale, '/blog/' + slug + '/')}">
          ${human ? `<span class="topic-article-date">${esc(human)}</span>` : ''}
          <h3>${esc(title)}</h3>
          <p>${esc(dek)}</p>
        </a>
      </li>`;
}

function topicResearchCard(locale, { slug, title, source, dek }) {
  return `<li>
        <a class="topic-research-card" href="${pathFor(locale, '/learn/research/' + slug + '/')}">
          <span class="topic-research-source">${esc(source || (locale === 'es' ? 'Investigación' : 'Research'))}</span>
          <h4>${esc(title)}</h4>
          <p>${esc(dek)}</p>
        </a>
      </li>`;
}

function topicToolCard(locale, { slug, title, dek }) {
  return `<li>
        <a class="topic-tool-card" href="${pathFor(locale, '/tools/' + slug + '/')}">
          <h4>${esc(title)}</h4>
          <p>${esc(dek)}</p>
          <span class="topic-tool-cta">${esc(t(locale, 'open_tool_cta'))} <span aria-hidden="true">→</span></span>
        </a>
      </li>`;
}

function topicChecklistCard(locale, { slug, title, dek }) {
  return `<li>
        <a class="topic-tool-card" href="${pathFor(locale, '/learn/checklists/' + slug + '/')}">
          <h4>${esc(title)}</h4>
          <p>${esc(dek)}</p>
          <span class="topic-tool-cta">${esc(t(locale, 'open_checklist_cta'))} <span aria-hidden="true">→</span></span>
        </a>
      </li>`;
}

// Reuses .term-siblings-list (already in site.css) for the same compact
// two-column tile look used on per-term pages — keeps the surface tight
// and avoids a new component for one renderer.
function topicTermCard(locale, { slug, headword, aka }) {
  const akaPart = aka ? `<span> — ${esc(aka)}</span>` : '';
  return `<li><a href="${pathFor(locale, '/glossary/' + slug + '/')}"><strong>${esc(headword)}</strong>${akaPart}</a></li>`;
}

function renderTopicPage(locale, topic, content) {
  const { name, blurb } = topicLabel(locale, topic);
  const canonical = urlFor(locale, `/learn/topics/${topic.slug}/`);
  const altUrl = locale === 'en' ? `/es/learn/topics/${topic.slug}/` : `/learn/topics/${topic.slug}/`;
  const desc = locale === 'es'
    ? `Todo en la biblioteca Muntin Digital sobre ${name.toLowerCase()} — artículos, investigación, herramientas y listas.`
    : `Everything in the Muntin Digital library about ${name.toLowerCase()} — articles, research, tools, and checklists.`;

  const sections = [];

  if (content.articles.length) {
    sections.push(`
<section class="topic-section">
  <div class="container">
    <header class="topic-section-head">
      <span class="eyebrow">${esc(t(locale, 'topic_section_articles_eyebrow'))}</span>
      <h2>${esc(t(locale, 'topic_section_articles_h2'))}</h2>
    </header>
    <ul class="topic-article-list">
      ${content.articles.map(item => topicArticleCard(locale, item)).join('\n')}
    </ul>
  </div>
</section>`);
  }

  if (content.research.length) {
    sections.push(`
<section class="topic-section topic-section-alt">
  <div class="container">
    <header class="topic-section-head">
      <span class="eyebrow">${esc(t(locale, 'topic_section_research_eyebrow'))}</span>
      <h2>${esc(t(locale, 'topic_section_research_h2'))}</h2>
    </header>
    <ul class="topic-research-list">
      ${content.research.map(item => topicResearchCard(locale, item)).join('\n')}
    </ul>
  </div>
</section>`);
  }

  if (content.terms.length) {
    // Cap at 12 to keep the section scannable on a topic page; full
    // list lives under the "See all in the glossary" link, which deep-
    // filters the index by this topic via the existing ?topic= chip.
    const displayTerms = content.terms.slice(0, 12);
    const moreHref = pathFor(locale, '/glossary/') + `?topic=${topic.slug}`;
    sections.push(`
<section class="topic-section">
  <div class="container">
    <header class="topic-section-head">
      <span class="eyebrow">${esc(t(locale, 'topic_section_terms_eyebrow'))}</span>
      <h2>${esc(t(locale, 'topic_section_terms_h2'))}</h2>
    </header>
    <ul class="term-siblings-list">
      ${displayTerms.map(item => topicTermCard(locale, item)).join('\n      ')}
    </ul>
    ${content.terms.length > displayTerms.length ? `<p style="text-align:center;margin-top:24px"><a class="link" href="${esc(moreHref)}">${esc(t(locale, 'topic_section_terms_more'))} (${content.terms.length}) <span aria-hidden="true">→</span></a></p>` : ''}
  </div>
</section>`);
  }

  if (content.tools.length) {
    sections.push(`
<section class="topic-section">
  <div class="container">
    <header class="topic-section-head">
      <span class="eyebrow">${esc(t(locale, 'topic_section_tools_eyebrow'))}</span>
      <h2>${esc(t(locale, 'topic_section_tools_h2'))}</h2>
    </header>
    <ul class="topic-tool-list">
      ${content.tools.map(item => topicToolCard(locale, item)).join('\n')}
    </ul>
  </div>
</section>`);
  }

  if (content.checklists.length) {
    sections.push(`
<section class="topic-section topic-section-alt">
  <div class="container">
    <header class="topic-section-head">
      <span class="eyebrow">${esc(t(locale, 'topic_section_checklists_eyebrow'))}</span>
      <h2>${esc(t(locale, 'topic_section_checklists_h2'))}</h2>
    </header>
    <ul class="topic-tool-list">
      ${content.checklists.map(item => topicChecklistCard(locale, item)).join('\n')}
    </ul>
  </div>
</section>`);
  }

  // Topic-specific OG card. Slug pattern is "topic-<slug>" (or
  // "-es" suffix for ES). Falls back to library default if a
  // bespoke card is missing — pageHead handles that.
  const topicCardSlug = `topic-${topic.slug}${locale === 'es' ? '-es' : ''}`;

  return `${pageHead(locale, {
    title: locale === 'es' ? `${name} — Biblioteca Muntin Digital` : `${name} — Muntin Digital library`,
    description: desc,
    canonical,
    ogImage: `/brand/og/${topicCardSlug}.png`,
  })}
${navHeader(altUrl)}

<nav class="breadcrumb container" aria-label="${esc(t(locale, 'breadcrumb_aria'))}">
  <a href="${pathFor(locale, '/')}">${esc(t(locale, 'breadcrumb_home'))}</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <a href="${pathFor(locale, '/learn/')}">${esc(t(locale, 'breadcrumb_learn'))}</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <a href="${pathFor(locale, '/learn/topics/')}">${esc(t(locale, 'breadcrumb_topics'))}</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <span aria-current="page">${esc(name)}</span>
</nav>

<section class="hero hero-medium">
  <div class="container">
    <div class="hero-center">
      <span class="eyebrow">${esc(t(locale, 'topic_eyebrow'))}</span>
      <h1 class="mt-20 topic-hero-h1">${esc(name)}</h1>
      <p class="hero-sub hero-sub-narrow">${esc(blurb)}</p>
    </div>
  </div>
</section>

${sections.join('\n')}

<section class="block final">
  <div class="container">
    <div class="section-header reveal section-center">
      <span class="eyebrow">${esc(t(locale, 'topic_other_eyebrow'))}</span>
      <h2>${esc(t(locale, 'topic_other_h2_l1'))}<br><span class="serif-italic">${esc(t(locale, 'topic_other_h2_l2'))}</span></h2>
    </div>
    <ul class="topic-other-list">
      ${TOPICS.filter(tp => tp.slug !== topic.slug).map(tp => {
        const lbl = topicLabel(locale, tp);
        return `<li><a href="${pathFor(locale, '/learn/topics/' + tp.slug + '/')}">${esc(lbl.name)}</a></li>`;
      }).join('\n      ')}
    </ul>
    <div class="hero-ctas reveal hero-ctas-center" style="margin-top:32px">
      <a class="btn btn-primary" href="${pathFor(locale, '/learn/')}">${esc(t(locale, 'topic_back_btn'))}</a>
      <a class="btn btn-ghost" href="${pathFor(locale, '/blog/')}">${esc(t(locale, 'topic_back_btn_alt'))}</a>
    </div>
  </div>
</section>

${siteFooter()}`;
}

function renderTopicsHub(locale, byTopicForLocale) {
  const canonical = urlFor(locale, '/learn/topics/');
  const altUrl = locale === 'en' ? '/es/learn/topics/' : '/learn/topics/';
  const cards = TOPICS.map(topic => {
    const lbl = topicLabel(locale, topic);
    const c = byTopicForLocale[topic.slug];
    const counts = [];
    if (locale === 'es') {
      if (c.articles.length) counts.push(`${c.articles.length} ${c.articles.length === 1 ? 'artículo' : 'artículos'}`);
      if (c.research.length) counts.push(`${c.research.length} ${c.research.length === 1 ? 'estudio' : 'estudios'}`);
      if (c.tools.length) counts.push(`${c.tools.length} ${c.tools.length === 1 ? 'herramienta' : 'herramientas'}`);
    } else {
      if (c.articles.length) counts.push(`${c.articles.length} ${c.articles.length === 1 ? 'article' : 'articles'}`);
      if (c.research.length) counts.push(`${c.research.length} research`);
      if (c.tools.length) counts.push(`${c.tools.length} ${c.tools.length === 1 ? 'tool' : 'tools'}`);
    }
    return `<li>
      <a class="topics-hub-card" href="${pathFor(locale, '/learn/topics/' + topic.slug + '/')}">
        <h3>${esc(lbl.name)}</h3>
        <p>${esc(lbl.blurb)}</p>
        <span class="topics-hub-meta">${counts.join(' · ')}</span>
      </a>
    </li>`;
  }).join('\n');

  return `${pageHead(locale, {
    title: locale === 'es' ? 'Temas — Biblioteca Muntin Digital' : 'Topics — Muntin Digital library',
    description: locale === 'es'
      ? 'Explora la biblioteca Muntin Digital por tema — velocidad y móvil, conversiones y reservas, SEO local, operaciones y margen, confianza y reseñas, marca y diseño.'
      : 'Browse the Muntin Digital library by topic — speed and mobile, conversions and reservations, local SEO, operations and margin, trust and reviews, brand and design.',
    canonical,
    ogImage: locale === 'es' ? '/brand/og/topics-es.png' : '/brand/og/topics.png',
  })}
${navHeader(altUrl)}

<nav class="breadcrumb container" aria-label="${esc(t(locale, 'breadcrumb_aria'))}">
  <a href="${pathFor(locale, '/')}">${esc(t(locale, 'breadcrumb_home'))}</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <a href="${pathFor(locale, '/learn/')}">${esc(t(locale, 'breadcrumb_learn'))}</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <span aria-current="page">${esc(t(locale, 'breadcrumb_topics'))}</span>
</nav>

<section class="hero hero-medium">
  <div class="container">
    <div class="hero-center">
      <span class="eyebrow">${esc(t(locale, 'topics_hub_eyebrow'))}</span>
      <h1 class="mt-20">
        ${esc(t(locale, 'topics_hub_h1_l1'))}<br>
        <span class="serif-italic">${esc(t(locale, 'topics_hub_h1_l2'))}</span>
      </h1>
      <p class="hero-sub hero-sub-narrow">
        ${esc(t(locale, 'topics_hub_sub'))}
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

// ---------- glossary parser ----------
//
// Parse /glossary/index.html and return { sections, terms }. The
// glossary's HTML is hand-authored but highly regular — each
// section is <section class="gloss-section" id="X">, each term is
// <article class="gloss-term" id="slug" data-industries="...">
// with predictable child elements.

function parseGlossary(locale = 'en') {
  const file = locale === 'es'
    ? join(REPO, 'es/glossary/index.html')
    : join(REPO, 'glossary/index.html');
  const html = readFileSync(file, 'utf8');

  // First pull section headers so we can attach each term to its section.
  const sectionMap = {};
  const sectionRe = /<section class="gloss-section" id="([a-z0-9-]+)" aria-labelledby="[^"]*">[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>\s*<p>([\s\S]*?)<\/p>/g;
  for (const m of html.matchAll(sectionRe)) {
    const slug = m[1];
    sectionMap[slug] = {
      slug,
      // Section name + description are plain-text fields (used in
      // <title>, JSON-LD names, eyebrow strings interpolated through
      // esc()). The source HTML carries entity-encoded ampersands
      // ("Brand &amp; design") which esc() would re-encode into
      // "&amp;amp;". Decode once here so esc() produces a single
      // round-trip. Raw-HTML uses (term.head, term.aka) keep their
      // entities; only plain-text fields get decoded.
      name: decodeEntities(stripTags(m[2])).trim(),
      description: decodeEntities(stripTags(m[3])).trim(),
      topics: tagsDoc.glossary_section_to_topics[slug] || [],
    };
  }

  // Now walk terms. Track current section by which section-bracket each term falls inside.
  const terms = [];
  // Use a global regex that captures the term opener and content up to its closing tag.
  // The opener carries data-industries plus any number of additional
  // data-* attributes (data-topics from wire-glossary-topics.mjs and
  // anything future scripts add) so the [^>]* between data-industries
  // and `>` is required, not optional.
  const termRe = /<article class="gloss-term" id="([a-z0-9-]+)"[^>]*data-industries="([^"]*)"[^>]*>([\s\S]*?)<\/article>/g;

  // Build a map of [start, end, slug] for each section so we can attach
  // each term to its parent.
  const sectionSpans = [];
  const sectionStartRe = /<section class="gloss-section" id="([a-z0-9-]+)"/g;
  for (const m of html.matchAll(sectionStartRe)) {
    sectionSpans.push({ slug: m[1], start: m.index });
  }
  // End of each section is the start of the next one (or end of file).
  sectionSpans.forEach((s, i) => {
    s.end = i + 1 < sectionSpans.length ? sectionSpans[i + 1].start : html.length;
  });

  for (const m of html.matchAll(termRe)) {
    const offset = m.index;
    const sectionSpan = sectionSpans.find(s => offset >= s.start && offset < s.end);
    if (!sectionSpan) continue;
    const sectionSlug = sectionSpan.slug;

    const slug = m[1];
    const industries = m[2];
    const inner = m[3];

    // h3 with optional <span class="gloss-aka">
    const h3m = inner.match(/<h3>([\s\S]*?)<\/h3>/);
    let head = '', aka = '';
    if (h3m) {
      const akaM = h3m[1].match(/<span class="gloss-aka">([\s\S]*?)<\/span>/);
      if (akaM) {
        aka = akaM[1].trim();
        head = h3m[1].replace(/<span class="gloss-aka">[\s\S]*?<\/span>/, '').trim();
      } else {
        head = h3m[1].trim();
      }
    }

    // Tags
    const tagsM = inner.match(/<div class="gloss-tags">([\s\S]*?)<\/div>/);
    const tagsHtml = tagsM ? tagsM[1].trim() : '';

    // Definition
    const defM = inner.match(/<p class="gloss-term-def">([\s\S]*?)<\/p>/);
    const defHtml = defM ? defM[1].trim() : '';

    // Why it matters — strip the leading <strong>Why it matters</strong>.
    const whyM = inner.match(/<p class="gloss-term-why">[\s\S]*?<strong>[\s\S]*?<\/strong>([\s\S]*?)<\/p>/);
    const whyHtml = whyM ? whyM[1].trim() : '';

    // Optional research link. Source HTML wraps the link with a
    // leading `<strong>See the research</strong>` (or
    // `<strong>Ver la investigación</strong>` in ES) literal — strip
    // either since the rendered page has its own label.
    const researchM = inner.match(/<p class="gloss-term-research">([\s\S]*?)<\/p>/);
    let researchHtml = null, researchUrl = null;
    if (researchM) {
      researchHtml = researchM[1]
        .replace(/<strong>\s*(See the research|Ver la investigaci[óo]n)\s*<\/strong>/i, '')
        .trim();
      const urlM = researchM[1].match(/href="([^"]+)"/);
      if (urlM) researchUrl = urlM[1];
    }

    // Topic resolution: term overrides take precedence over section topics.
    const topics = tagsDoc.glossary_term_overrides[slug] || sectionMap[sectionSlug]?.topics || [];

    terms.push({
      slug,
      head,
      aka,
      tagsHtml,
      industries,
      defHtml,
      whyHtml,
      researchHtml,
      researchUrl,
      sectionSlug,
      sectionName: sectionMap[sectionSlug]?.name || sectionSlug,
      topics,
    });
  }

  return { sections: sectionMap, terms };
}

function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, '');
}

// Term slug → first declared live tool from data/library-tags.json.
// Used by renderTermPage to swap the generic terminal CTA for a
// contextual one when the term has an obvious tool destination
// (e.g., menu-engineering → /tools/menu-engineering/, gbp →
// /tools/gbp-grader/). Lazy: built once on first call.
let _toolsCfgCache = null;
let _toolForTermCache = null;
function toolForTerm(slug) {
  if (!_toolsCfgCache) {
    _toolsCfgCache = JSON.parse(readFileSync(join(DATA, 'tools.json'), 'utf8'));
  }
  if (!_toolForTermCache) {
    // term → ordered list of candidate tool slugs (preserves declaration
    // order). The lookup below walks the list and returns the first
    // candidate that's actually live in data/tools.json — so a term
    // declared against a not-yet-shipped tool falls through to the
    // next live tool that references it.
    _toolForTermCache = new Map();
    for (const [toolKey, t] of Object.entries(tagsDoc.tools || {})) {
      const refs = []
        .concat(t.glossary_term ? [t.glossary_term] : [])
        .concat(t.glossary_terms || []);
      // library-tags uses "audits/restaurant"; tools.json uses "restaurant-audit".
      const normalized = toolKey === 'audits/restaurant' ? 'restaurant-audit' : toolKey;
      for (const term of refs) {
        if (!_toolForTermCache.has(term)) _toolForTermCache.set(term, []);
        _toolForTermCache.get(term).push(normalized);
      }
    }
  }
  const candidates = _toolForTermCache.get(slug) || [];
  for (const toolSlug of candidates) {
    const tool = _toolsCfgCache.tools[toolSlug];
    if (tool && tool.status === 'live') return { slug: toolSlug, ...tool };
  }
  return null;
}

// Render one per-term glossary page. Conservative HTML — definition
// and "why it matters" are pasted as-is from the source (they may
// contain inline <code>, <em>, etc.).
function renderTermPage(locale, term, allTerms) {
  const canonical = urlFor(locale, `/glossary/${term.slug}/`);
  const altUrl = locale === 'en' ? `/es/glossary/${term.slug}/` : `/glossary/${term.slug}/`;
  // headPlain feeds <title>, meta description, the breadcrumb, and
  // JSON-LD "name" — every use is downstream of esc(). Decode entities
  // here so a head like "Dietary &amp; allergen markers" survives
  // round-tripping as a single &amp; in the output, not &amp;amp;.
  const headPlain = decodeEntities(stripTags(term.head));
  const defPlain  = decodeEntities(stripTags(term.defHtml));
  const desc = `${headPlain}: ${defPlain.slice(0, 155).trim()}${defPlain.length > 155 ? '…' : ''}`;

  // The "Why it matters" heading is part of the source HTML; the
  // EN file says "Why it matters", the ES file says "Por qué importa".
  // We strip the leading <strong> in the parser, so the rendered
  // page needs its own <h2> — pick by locale.
  const whyH = locale === 'es' ? 'Por qué importa' : 'Why it matters';

  // Sibling terms in the same section (for "More in this section")
  const siblings = allTerms
    .filter(tm => tm.sectionSlug === term.sectionSlug && tm.slug !== term.slug)
    .slice(0, 6);

  // Related topic chips — link out to /learn/topics/<slug>/
  const topicChips = term.topics
    .map(tp => TOPIC_BY_SLUG[tp])
    .filter(Boolean)
    .map(tp => {
      const lbl = topicLabel(locale, tp);
      return `<a class="term-topic-chip" href="${pathFor(locale, '/learn/topics/' + tp.slug + '/')}">${esc(lbl.name)}</a>`;
    })
    .join('\n          ');

  const researchBlock = term.researchHtml
    ? `<aside class="term-research">
      <p class="term-research-label">${esc(t(locale, 'research_see'))}</p>
      <p>${term.researchHtml}</p>
    </aside>`
    : '';

  const siblingsBlock = siblings.length
    ? `<section class="term-siblings">
  <div class="container">
    <header class="term-siblings-head">
      <span class="eyebrow">${esc(t(locale, 'term_more_in_section'))} ${esc(term.sectionName)}</span>
    </header>
    <ul class="term-siblings-list">
      ${siblings.map(s =>
        `<li><a href="${pathFor(locale, '/glossary/' + s.slug + '/')}"><strong>${s.head}</strong>${s.aka ? `<span> — ${s.aka}</span>` : ''}</a></li>`
      ).join('\n      ')}
    </ul>
  </div>
</section>`
    : '';

  // Per-term JSON-LD: a DefinedTerm that points back to the glossary's
  // DefinedTermSet. Unlocks rich-result eligibility and tells crawlers
  // these pages are part of a structured vocabulary, not standalone
  // articles. inLanguage matches the page locale.
  const termJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "DefinedTerm",
        "@id": `${canonical}#term`,
        "name": headPlain,
        "description": defPlain,
        "url": canonical,
        "inLanguage": locale === 'es' ? 'es-US' : 'en-US',
        "inDefinedTermSet": locale === 'es'
          ? "https://muntin.digital/es/glossary/#glossary"
          : "https://muntin.digital/glossary/#glossary",
        ...(term.aka ? { "alternateName": decodeEntities(stripTags(term.aka)) } : {}),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": locale === 'es' ? 'Inicio' : 'Home',     "item": locale === 'es' ? "https://muntin.digital/es/" : "https://muntin.digital/" },
          { "@type": "ListItem", "position": 2, "name": locale === 'es' ? 'Glosario' : 'Glossary', "item": locale === 'es' ? "https://muntin.digital/es/glossary/" : "https://muntin.digital/glossary/" },
          { "@type": "ListItem", "position": 3, "name": headPlain,                                "item": canonical }
        ]
      }
    ]
  };

  // Contextual terminal CTA: if this term is the primary glossary
  // reference for a live tool, send the reader there as the primary
  // action (with the glossary index as the secondary). Otherwise,
  // fall back to the generic glossary / library pair.
  const ctaTool = toolForTerm(term.slug);
  const ctaPrimaryHref  = ctaTool
    ? (locale === 'es' ? ctaTool.url_es : ctaTool.url_en)
    : pathFor(locale, '/glossary/');
  const ctaPrimaryLabel = ctaTool
    ? (locale === 'es' ? `Abrir ${ctaTool.title_es}` : `Open ${ctaTool.title_en}`)
    : t(locale, 'term_final_btn');
  const ctaSecondaryHref  = ctaTool ? pathFor(locale, '/glossary/') : pathFor(locale, '/learn/');
  const ctaSecondaryLabel = ctaTool ? t(locale, 'term_final_btn')  : t(locale, 'term_final_btn_alt');

  return `${pageHead(locale, {
    title: locale === 'es' ? `${headPlain} — Glosario Muntin Digital` : `${headPlain} — Muntin Digital glossary`,
    description: desc,
    canonical,
    ogImage: '/brand/og/glossary.png',
    jsonLd: termJsonLd,
  })}
${navHeader(altUrl)}

<nav class="breadcrumb container" aria-label="${esc(t(locale, 'term_aria_breadcrumb'))}">
  <a href="${pathFor(locale, '/')}">${esc(t(locale, 'breadcrumb_home'))}</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <a href="${pathFor(locale, '/glossary/')}">${esc(t(locale, 'breadcrumb_glossary'))}</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <span aria-current="page">${esc(headPlain)}</span>
</nav>

<section class="term-page">
  <div class="container term-page-inner">
    <header class="term-head">
      <span class="eyebrow"><a href="${pathFor(locale, '/glossary/' + term.sectionSlug + '/')}">${esc(term.sectionName)}</a></span>
      <h1 class="term-h1">${term.head}</h1>
      ${term.aka ? `<p class="term-aka">${term.aka}</p>` : ''}
      <div class="term-meta">
        <div class="term-tags">${term.tagsHtml}</div>
        ${topicChips ? `<div class="term-topics">${topicChips}</div>` : ''}
      </div>
    </header>

    <div class="term-body">
      <p class="term-def">${term.defHtml}</p>
      <h2 class="term-why-h">${esc(whyH)}</h2>
      <p class="term-why">${term.whyHtml}</p>
      ${researchBlock}
      <!-- glossary-explainer-cue:start -->
      <!-- glossary-explainer-cue:end -->
    </div>
  </div>
</section>

<!-- glossary-explainer:start -->
<!-- glossary-explainer:end -->

${siblingsBlock}

<section class="block final">
  <div class="container">
    <div class="section-header reveal section-center">
      <span class="eyebrow">${esc(t(locale, 'term_final_eyebrow'))}</span>
      <h2>${esc(t(locale, 'term_final_h2_l1'))}<br><span class="serif-italic">${esc(t(locale, 'term_final_h2_l2'))}</span></h2>
      <p class="final-sub">${esc(t(locale, 'term_final_sub'))}</p>
    </div>
    <div class="hero-ctas reveal hero-ctas-center">
      <a class="btn btn-primary" href="${esc(ctaPrimaryHref)}">${esc(ctaPrimaryLabel)}</a>
      <a class="btn btn-ghost" href="${esc(ctaSecondaryHref)}">${esc(ctaSecondaryLabel)}</a>
    </div>
  </div>
</section>

<!-- glossary-knit -->
<!-- /glossary-knit -->
${siteFooter()}`;
}

// Per-section glossary landing page. One page per section (basics,
// mobile, conversions, trust, findability, subtypes, restaurant-
// numbers, data-literacy, brand-design) — bookmarkable, shareable,
// and printable. Compact card grid (reuses .term-siblings-list)
// + per-section JSON-LD DefinedTermSet so the subset is also
// crawlable as a structured vocabulary.
function renderSectionPage(locale, section, sectionTerms) {
  const canonical = urlFor(locale, `/glossary/${section.slug}/`);
  const altUrl = locale === 'es' ? `/glossary/${section.slug}/` : `/es/glossary/${section.slug}/`;
  const title = locale === 'es'
    ? `${section.name} — Glosario Muntin Digital`
    : `${section.name} — Muntin Digital glossary`;
  const desc = locale === 'es'
    ? `${section.description} ${sectionTerms.length} términos en lenguaje claro.`
    : `${section.description} ${sectionTerms.length} terms in plain English.`;

  // DefinedTermSet for just this section, with each term as a member.
  // The site-wide glossary set lives at /glossary/#glossary; this is
  // a sibling subset so search engines can group "Restaurant numbers"
  // distinctly from "Mobile & speed" without inferring it.
  const sectionJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "DefinedTermSet",
        "@id": `${canonical}#section`,
        "name": section.name,
        "description": section.description,
        "url": canonical,
        "inLanguage": locale === 'es' ? 'es-US' : 'en-US',
        "isPartOf": locale === 'es'
          ? "https://muntin.digital/es/glossary/#glossary"
          : "https://muntin.digital/glossary/#glossary",
        "hasDefinedTerm": sectionTerms.map(term => ({
          "@type": "DefinedTerm",
          "@id": `${urlFor(locale, '/glossary/' + term.slug + '/')}#term`,
          "name": decodeEntities(stripTags(term.head)),
          "url": urlFor(locale, '/glossary/' + term.slug + '/'),
        })),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": locale === 'es' ? 'Inicio' : 'Home',     "item": locale === 'es' ? "https://muntin.digital/es/" : "https://muntin.digital/" },
          { "@type": "ListItem", "position": 2, "name": locale === 'es' ? 'Glosario' : 'Glossary', "item": locale === 'es' ? "https://muntin.digital/es/glossary/" : "https://muntin.digital/glossary/" },
          { "@type": "ListItem", "position": 3, "name": section.name,                              "item": canonical }
        ]
      }
    ]
  };

  const cardsHtml = sectionTerms.map(term => `<li><a href="${pathFor(locale, '/glossary/' + term.slug + '/')}"><strong>${term.head}</strong>${term.aka ? `<span> — ${term.aka}</span>` : ''}</a></li>`).join('\n      ');

  const backLabel  = locale === 'es' ? 'Glosario completo' : 'Full glossary';
  const printLabel = locale === 'es' ? 'Imprimir esta sección' : 'Print this section';

  return `${pageHead(locale, {
    title,
    description: desc,
    canonical,
    ogImage: '/brand/og/glossary.png',
    jsonLd: sectionJsonLd,
  })}
${navHeader(altUrl, 'gloss-section-page')}

<nav class="breadcrumb container" aria-label="${esc(t(locale, 'term_aria_breadcrumb'))}">
  <a href="${pathFor(locale, '/')}">${esc(t(locale, 'breadcrumb_home'))}</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <a href="${pathFor(locale, '/glossary/')}">${esc(t(locale, 'breadcrumb_glossary'))}</a>
  <span class="breadcrumb-sep" aria-hidden="true">›</span>
  <span aria-current="page">${esc(section.name)}</span>
</nav>

<section class="hero hero-medium">
  <div class="container">
    <div class="hero-center">
      <span class="eyebrow">${esc(locale === 'es' ? 'Sección del glosario' : 'Glossary section')}</span>
      <h1 class="mt-20 topic-hero-h1">${esc(section.name)}</h1>
      <p class="hero-sub hero-sub-narrow">${esc(section.description)}</p>
    </div>
  </div>
</section>

<section class="topic-section">
  <div class="container">
    <header class="topic-section-head">
      <span class="eyebrow">${esc(locale === 'es' ? 'Términos' : 'Terms')}</span>
      <h2>${sectionTerms.length} ${esc(locale === 'es' ? 'definiciones' : 'definitions')}.</h2>
    </header>
    <ul class="term-siblings-list">
      ${cardsHtml}
    </ul>
    <div class="hero-ctas reveal hero-ctas-center" style="margin-top:32px">
      <a class="btn btn-ghost" href="${pathFor(locale, '/glossary/')}">${esc(backLabel)}</a>
      <button type="button" class="btn btn-ghost" onclick="window.print()">${esc(printLabel)}</button>
    </div>
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

function findCitations(locale) {
  const cites = {}; // research-slug -> [{slug, title}]
  const blogRoot = locale === 'es' ? join(REPO, 'es/blog') : join(REPO, 'blog');
  // Match either /learn/research/<slug>/ or /es/learn/research/<slug>/
  const researchPathRe = /\/(?:es\/)?learn\/research\/([a-z0-9-]+)\//g;
  for (const [postSlug] of Object.entries(tagsDoc.blog_posts)) {
    const file = join(blogRoot, postSlug, 'index.html');
    let html = '';
    try { html = readFileSync(file, 'utf8'); } catch { continue; }
    // Strip auto-generated sidebars before scanning. The see-also and
    // cited-in regions surface research links algorithmically; treating
    // them as "citations" creates a circular bump in the counts.
    // Editorial Further Reading picks are intentional but conventional
    // sidebar — also excluded so the count reflects only in-body cites.
    const cleaned = html
      .replace(/<!-- LIBRARY:see-also:start -->[\s\S]*?<!-- LIBRARY:see-also:end -->/g, '')
      .replace(/<!-- LIBRARY:cited-in:start -->[\s\S]*?<!-- LIBRARY:cited-in:end -->/g, '')
      .replace(/<aside class="further-reading">[\s\S]*?<\/aside>/g, '');
    const seen = new Set();
    for (const m of cleaned.matchAll(researchPathRe)) seen.add(m[1]);
    const meta = getMeta(locale, 'blog', postSlug);
    for (const researchSlug of seen) {
      if (!cites[researchSlug]) cites[researchSlug] = [];
      cites[researchSlug].push({ slug: postSlug, title: meta.title });
    }
  }
  for (const s of Object.keys(cites)) {
    cites[s].sort((a, b) => a.title.localeCompare(b.title));
  }
  return cites;
}

function renderCitedInBlock(locale, researchSlug, citations) {
  if (!citations || !citations.length) {
    return `<!-- LIBRARY:cited-in:start --><!-- LIBRARY:cited-in:end -->`;
  }
  const items = citations.map(c =>
    `      <li><a href="${pathFor(locale, '/blog/' + c.slug + '/')}">${esc(c.title)}</a></li>`
  ).join('\n');
  const noun = citations.length === 1 ? t(locale, 'cited_in_singular') : t(locale, 'cited_in_plural');
  return `<!-- LIBRARY:cited-in:start -->
<section class="block research-cited-in" aria-labelledby="cited-in-h">
  <div class="container">
    <header class="research-cited-in-head">
      <span class="eyebrow">${esc(t(locale, 'cited_in_eyebrow'))}</span>
      <h2 id="cited-in-h">${citations.length} ${esc(noun)} ${esc(t(locale, 'cited_in_suffix'))}</h2>
    </header>
    <ul class="research-cited-in-list">
${items}
    </ul>
  </div>
</section>
<!-- LIBRARY:cited-in:end -->`;
}

function injectCitedIn(locale, researchSlug, citations) {
  const root = locale === 'es' ? join(REPO, 'es/learn/research') : join(REPO, 'learn/research');
  const file = join(root, researchSlug, 'index.html');
  let html = '';
  try { html = readFileSync(file, 'utf8'); } catch { return 'skipped'; }
  const block = renderCitedInBlock(locale, researchSlug, citations);

  const markerRe = /<!-- LIBRARY:cited-in:start -->[\s\S]*?<!-- LIBRARY:cited-in:end -->/;
  if (markerRe.test(html)) {
    writeFileSync(file, html.replace(markerRe, block), 'utf8');
    return 'updated';
  }

  const anchor = '<section class="block bg-cream2">';
  if (!html.includes(anchor)) {
    console.warn(`  warning: ${locale}/${researchSlug}: no injection anchor found, skipping`);
    return 'skipped';
  }
  const replaced = html.replace(anchor, `${block}\n\n${anchor}`);
  writeFileSync(file, replaced, 'utf8');
  return 'inserted';
}

// ---------- see-also generator ----------
//
// For a given source (a blog post slug), pick up to 3 related items
// by topic overlap. Prefer a mix of types (article + research + tool)
// over three of the same type. Skip self-references and any URL
// already linked in the page's editorial "Further reading" aside —
// the See Also block is meant to complement, not duplicate.

function relatedItemsFor(locale, sourceSlug, sourceTopics, existingHrefs = new Set()) {
  const sourceTopicSet = new Set(sourceTopics);
  const candidates = [];

  for (const [slug, enMeta] of Object.entries(tagsDoc.blog_posts)) {
    if (slug === sourceSlug) continue;
    const overlap = (enMeta.topics || []).filter(tp => sourceTopicSet.has(tp)).length;
    if (!overlap) continue;
    const meta = getMeta(locale, 'blog', slug);
    // Read-time always comes from the EN file (article length ~= across
    // translations, and the EN file always exists for the EN slug).
    const enReadMins = pageMeta(join(REPO, 'blog', slug, 'index.html')).readMinutes || 0;
    candidates.push({
      kind: 'article',
      url: pathFor(locale, `/blog/${slug}/`),
      title: meta.title,
      dek: meta.dek,
      readMinutes: enReadMins,
      score: overlap,
      date: enMeta.date,
    });
  }
  for (const [slug, enMeta] of Object.entries(tagsDoc.research_notes)) {
    const overlap = (enMeta.topics || []).filter(tp => sourceTopicSet.has(tp)).length;
    if (!overlap) continue;
    const meta = getMeta(locale, 'research', slug);
    const enReadMins = pageMeta(join(REPO, 'learn/research', slug, 'index.html')).readMinutes || 0;
    candidates.push({
      kind: 'research',
      url: pathFor(locale, `/learn/research/${slug}/`),
      title: meta.title,
      dek: meta.dek,
      readMinutes: enReadMins,
      score: overlap,
    });
  }
  for (const [slug, enMeta] of Object.entries(tagsDoc.tools)) {
    const overlap = (enMeta.topics || []).filter(tp => sourceTopicSet.has(tp)).length;
    if (!overlap) continue;
    const meta = getMeta(locale, 'tools', slug);
    candidates.push({
      kind: 'tool',
      url: pathFor(locale, `/tools/${slug}/`),
      title: meta.title,
      dek: meta.dek,
      // Tools don't carry a read-time — they're calculators, not articles.
      readMinutes: 0,
      score: overlap,
    });
  }

  // Drop anything already linked in the editorial Further Reading aside.
  const filtered = candidates.filter(c => !existingHrefs.has(c.url));

  // Sort: higher overlap score first, then articles by newest date,
  // then alphabetical title for stability.
  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.kind === 'article' && b.kind === 'article') {
      return (b.date || '').localeCompare(a.date || '');
    }
    return a.title.localeCompare(b.title);
  });

  // Pick up to 3, prefer one of each kind first.
  const picked = [];
  const seenKinds = new Set();
  for (const c of filtered) {
    if (picked.length === 3) break;
    if (!seenKinds.has(c.kind)) {
      picked.push(c);
      seenKinds.add(c.kind);
    }
  }
  // Fill remaining slots with anything not already picked.
  if (picked.length < 3) {
    for (const c of filtered) {
      if (picked.length === 3) break;
      if (!picked.includes(c)) picked.push(c);
    }
  }

  return picked;
}

function renderSeeAlso(locale, items) {
  if (!items.length) {
    return `<!-- LIBRARY:see-also:start --><!-- LIBRARY:see-also:end -->`;
  }
  const kindLabel = {
    article: t(locale, 'see_also_kind_article'),
    research: t(locale, 'see_also_kind_research'),
    tool: t(locale, 'see_also_kind_tool'),
  };
  // Localized "min read" suffix. Tools have no read-time, so we omit
  // the pill there. Articles + research read on the EN file (length
  // is approximately equal across translations).
  const minReadSuffix = locale === 'es' ? 'min de lectura' : 'min read';
  const cards = items.map(it => {
    const timePill = it.readMinutes
      ? ` <span class="see-also-time">${it.readMinutes} ${minReadSuffix}</span>`
      : '';
    return `      <li>
        <a class="see-also-card" href="${esc(it.url)}">
          <span class="see-also-kind">${esc(kindLabel[it.kind] || '')}${timePill}</span>
          <h3>${esc(it.title)}</h3>
          <p>${esc(it.dek || '')}</p>
        </a>
      </li>`;
  }).join('\n');
  return `<!-- LIBRARY:see-also:start -->
<aside class="see-also" aria-labelledby="see-also-h">
  <p class="see-also-label" id="see-also-h">${esc(t(locale, 'see_also_label'))}</p>
  <ul class="see-also-list">
${cards}
    </ul>
</aside>
<!-- LIBRARY:see-also:end -->`;
}

function injectSeeAlso(locale, blogSlug, items) {
  const root = locale === 'es' ? join(REPO, 'es/blog') : join(REPO, 'blog');
  const file = join(root, blogSlug, 'index.html');
  let html = '';
  try { html = readFileSync(file, 'utf8'); } catch { return 'skipped'; }
  const block = renderSeeAlso(locale, items);

  const markerRe = /<!-- LIBRARY:see-also:start -->[\s\S]*?<!-- LIBRARY:see-also:end -->/;
  if (markerRe.test(html)) {
    writeFileSync(file, html.replace(markerRe, block), 'utf8');
    return 'updated';
  }

  const anchor = '<aside class="further-reading">';
  if (!html.includes(anchor)) {
    console.warn(`  warning: ${locale}/${blogSlug}: no injection anchor, skipping`);
    return 'skipped';
  }
  const replaced = html.replace(anchor, `${block}\n\n    ${anchor}`);
  writeFileSync(file, replaced, 'utf8');
  return 'inserted';
}

function existingFurtherReadingHrefs(locale, blogSlug) {
  const root = locale === 'es' ? join(REPO, 'es/blog') : join(REPO, 'blog');
  const file = join(root, blogSlug, 'index.html');
  let html = '';
  try { html = readFileSync(file, 'utf8'); } catch { return new Set(); }
  const m = html.match(/<aside class="further-reading">([\s\S]*?)<\/aside>/);
  if (!m) return new Set();
  const hrefs = new Set();
  for (const h of m[1].matchAll(/href="([^"]+)"/g)) hrefs.add(h[1]);
  return hrefs;
}

// ---------- tool deep-links ----------
//
// Every tool gets a "Learn more about this" block injected before
// </main>, surfacing one curated glossary term and one curated
// article + the topic page(s) the tool belongs to. Closes the loop
// from tool result → educational ecosystem (the missing piece in
// the original UX audit). Idempotent via comment markers.

function renderToolDeepLinks(locale, tool, glossaryTerms, articles) {
  const topicChips = (tool.topics || [])
    .map(tp => TOPIC_BY_SLUG[tp])
    .filter(Boolean)
    .map(tp => {
      const lbl = topicLabel(locale, tp);
      return `<a class="tool-deep-topic" href="${pathFor(locale, '/learn/topics/' + tp.slug + '/')}">${esc(lbl.name)}</a>`;
    })
    .join('\n        ');

  const termCards = (glossaryTerms || []).slice(0, 4).map(term => `<a class="tool-deep-card tool-deep-card-term" href="${pathFor(locale, '/glossary/' + term.slug + '/')}">
          <span class="tool-deep-kind">${esc(t(locale, 'tool_deep_kind_glossary'))}</span>
          <h3>${term.head}</h3>
          ${term.aka ? `<p class="tool-deep-aka">${term.aka}</p>` : ''}
          <p class="tool-deep-snippet">${esc(decodeEntities(stripTags(term.defHtml)).slice(0, 140))}${decodeEntities(stripTags(term.defHtml)).length > 140 ? '…' : ''}</p>
          <span class="tool-deep-cta">${esc(t(locale, 'tool_deep_cta_glossary'))} <span aria-hidden="true">→</span></span>
        </a>`).join('\n      ');

  // Lift the article slice from 1 to 2 so each tool surfaces two
  // related reads, not just one. Cuts the "one cold read or nothing"
  // bounce path on tool pages without crowding the term cards.
  const articleCards = (articles || []).slice(0, 2).map(article => `<a class="tool-deep-card tool-deep-card-article" href="${pathFor(locale, '/blog/' + article.slug + '/')}">
          <span class="tool-deep-kind">${esc(t(locale, 'tool_deep_kind_article'))}</span>
          <h3>${esc(article.title)}</h3>
          <p class="tool-deep-snippet">${esc(article.dek)}</p>
          <span class="tool-deep-cta">${esc(t(locale, 'tool_deep_cta_article'))} <span aria-hidden="true">→</span></span>
        </a>`).join('\n      ');

  return `<!-- LIBRARY:tool-deep-links:start -->
<section class="tool-deep-links" aria-labelledby="tool-deep-h">
  <div class="container">
    <header class="tool-deep-head">
      <span class="eyebrow">${esc(t(locale, 'tool_deep_eyebrow'))}</span>
      <h2 id="tool-deep-h">${esc(t(locale, 'tool_deep_h2'))}</h2>
      <p class="tool-deep-blurb">${esc(t(locale, 'tool_deep_blurb'))}</p>
      ${topicChips ? `<div class="tool-deep-topics">${topicChips}</div>` : ''}
    </header>
    <div class="tool-deep-grid">
      ${termCards}
      ${articleCards}
    </div>
  </div>
</section>
<!-- LIBRARY:tool-deep-links:end -->`;
}

function injectToolDeepLinks(locale, toolSlug, tool, glossaryTerms, articles) {
  const root = locale === 'es' ? join(REPO, 'es/tools') : join(REPO, 'tools');
  const file = join(root, toolSlug, 'index.html');
  let html;
  try {
    html = readFileSync(file, 'utf8');
  } catch {
    return 'skipped';
  }

  const block = renderToolDeepLinks(locale, tool, glossaryTerms, articles);

  const markerRe = /<!-- LIBRARY:tool-deep-links:start -->[\s\S]*?<!-- LIBRARY:tool-deep-links:end -->/;
  if (markerRe.test(html)) {
    writeFileSync(file, html.replace(markerRe, block), 'utf8');
    return 'updated';
  }

  const anchor = '</main>';
  const idx = html.indexOf(anchor);
  if (idx < 0) {
    console.warn(`  warning: ${locale}/${toolSlug}: no </main> anchor, skipping`);
    return 'skipped';
  }
  const replaced = html.slice(0, idx) + block + '\n\n' + html.slice(idx);
  writeFileSync(file, replaced, 'utf8');
  return 'inserted';
}

// ---------- glossary auto-linker ----------
//
// For every blog post, find the first whole-word mention of each
// glossary term inside the article body and wrap it with a link
// to the term's standalone page (/glossary/<slug>/). Skips:
//
//   - already-linked text (<a>...</a>)
//   - code / pre / kbd / samp blocks
//   - headings (h1-h6)
//   - <aside> blocks (further-reading, see-also, sources)
//   - <details> blocks (cite drawers)
//   - <svg> / <style> / <script>
//
// Idempotent via LIBRARY:autolink:start/end markers — re-runs strip
// any prior auto-links from the source first, then re-stamp from
// scratch. Hand-edits inside marker pairs will be lost on rebuild;
// editorial links should live OUTSIDE markers.

const AUTOLINK_SKIP_TAGS = new Set([
  'a', 'code', 'pre', 'kbd', 'samp',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'aside', 'details', 'svg', 'style', 'script',
]);

const AUTOLINK_VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

// Walk article body chars; return list of safe [start, end) ranges
// where matching is allowed. Tracks a skip-stack of nested tags;
// when the stack contains any AUTOLINK_SKIP_TAGS member, we're not
// in a safe zone.
function computeSafeRanges(html, articleStart, articleEnd) {
  const ranges = [];
  const stack = [];
  let i = articleStart;
  let segStart = -1;

  const isSafe = () => stack.every(t => !AUTOLINK_SKIP_TAGS.has(t));

  function openSeg(at) { if (segStart < 0 && isSafe()) segStart = at; }
  function closeSeg(at) {
    if (segStart >= 0 && at > segStart) ranges.push([segStart, at]);
    segStart = -1;
  }

  while (i < articleEnd) {
    const c = html[i];
    if (c !== '<') { openSeg(i); i++; continue; }

    // Hit a tag — close any open text segment.
    closeSeg(i);

    // Comment: <!-- ... -->
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i + 4);
      i = end < 0 ? articleEnd : end + 3;
      continue;
    }
    // CDATA / doctype — skip to next >
    if (html[i + 1] === '!' || html[i + 1] === '?') {
      const end = html.indexOf('>', i);
      i = end < 0 ? articleEnd : end + 1;
      continue;
    }
    // Closing tag </x>
    if (html[i + 1] === '/') {
      const end = html.indexOf('>', i);
      if (end < 0) { i = articleEnd; continue; }
      const name = html.slice(i + 2, end).trim().toLowerCase().split(/\s+/)[0];
      // Pop matching tag from stack (or nearest match)
      for (let k = stack.length - 1; k >= 0; k--) {
        if (stack[k] === name) { stack.splice(k, 1); break; }
      }
      i = end + 1;
      continue;
    }
    // Opening tag <x ...>
    const end = html.indexOf('>', i);
    if (end < 0) { i = articleEnd; continue; }
    const tagBody = html.slice(i + 1, end).trim();
    const selfClose = tagBody.endsWith('/');
    const name = tagBody.split(/[\s/]/)[0].toLowerCase();
    if (!selfClose && !AUTOLINK_VOID_TAGS.has(name)) {
      stack.push(name);
    }
    i = end + 1;
  }
  closeSeg(articleEnd);
  return ranges;
}

// Escape a term head so it can be embedded in a regex source.
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Escape a string for use inside an HTML attribute value. Used by the
// glossary autolinker to stamp data-glossary-* blurbs onto inline term
// links, where the source text may contain quotes, ampersands, etc.
function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Return the first sentence (or the first `cap` characters, whichever
// is shorter) of a plain-text string. Used to derive the glossary-link
// hover blurb from the term's full definition. Trims trailing whitespace
// and adds an ellipsis when the string was truncated. Falls back to the
// whole string if no sentence-ending punctuation is found within `cap`.
function firstSentence(text, cap = 180) {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  // Look for a sentence-ending punctuation followed by space + uppercase
  // / digit, within the first `cap` chars.
  const window = trimmed.slice(0, cap + 40);
  const m = window.match(/[.!?](?=\s+[A-ZÁÉÍÓÚÑ0-9"'(])/);
  if (m && m.index + 1 <= cap) {
    return trimmed.slice(0, m.index + 1);
  }
  if (trimmed.length <= cap) return trimmed;
  // Soft truncation at last word boundary inside cap.
  const cut = trimmed.slice(0, cap);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
}

function autoLinkGlossary(locale, blogSlug, terms) {
  const root = locale === 'es' ? join(REPO, 'es/blog') : join(REPO, 'blog');
  const file = join(root, blogSlug, 'index.html');
  let html;
  try { html = readFileSync(file, 'utf8'); } catch { return 0; }

  // Idempotent reset — strip every prior auto-link marker pair,
  // restoring the inner text. Run before searching so prior matches
  // don't pollute the safe-range map.
  html = html.replace(
    /<!-- LIBRARY:autolink:start --><a [^>]*>([\s\S]*?)<\/a><!-- LIBRARY:autolink:end -->/g,
    (_m, inner) => inner,
  );

  const articleStart = html.indexOf('<article class="article-body"');
  if (articleStart < 0) return 0;
  const articleEnd = html.indexOf('</article>', articleStart);
  if (articleEnd < 0) return 0;

  const safeRanges = computeSafeRanges(html, articleStart, articleEnd);
  if (!safeRanges.length) return 0;

  // Sort terms by head length DESC so multi-word terms ("Core Web
  // Vitals") match before sub-words ("Core").
  const sorted = [...terms].sort((a, b) => {
    const al = stripTags(a.head).length;
    const bl = stripTags(b.head).length;
    return bl - al;
  });

  // Track placed matches to avoid overlapping links.
  const placed = []; // sorted by start ascending

  function isFree(s, e) {
    for (const p of placed) {
      if (s < p.end && e > p.start) return false;
    }
    return true;
  }

  for (const term of sorted) {
    const head = decodeEntities(stripTags(term.head)).trim();
    if (!head || head.length < 3) continue;
    // Word-boundary, case-insensitive. Allow internal whitespace
    // collapse to handle rare double-spaces in source.
    const re = new RegExp(`\\b${escapeRegex(head).replace(/\\ /g, '\\s+')}\\b`, 'i');
    let placedHere = false;
    for (const [rs, re2] of safeRanges) {
      if (placedHere) break;
      const slice = html.slice(rs, re2);
      const m = re.exec(slice);
      if (!m) continue;
      const mStart = rs + m.index;
      const mEnd = mStart + m[0].length;
      if (!isFree(mStart, mEnd)) continue;
      placed.push({ start: mStart, end: mEnd, term });
      placed.sort((a, b) => a.start - b.start);
      placedHere = true;
    }
  }

  if (!placed.length) return 0;

  // Apply in reverse offset order so earlier offsets stay valid.
  // Each autolink carries data-glossary-* attributes so site.js can
  // render a hover/focus popover with the term's headword, AKA, and
  // first-sentence blurb without a network roundtrip — progressive
  // enhancement only; the link still works without JS.
  placed.sort((a, b) => b.start - a.start);
  for (const p of placed) {
    const matched = html.slice(p.start, p.end);
    const url = pathFor(locale, `/glossary/${p.term.slug}/`);
    const head  = decodeEntities(stripTags(p.term.head)).trim();
    const aka   = p.term.aka ? decodeEntities(stripTags(p.term.aka)).trim() : '';
    const blurb = firstSentence(decodeEntities(stripTags(p.term.defHtml)).trim(), 180);
    const dataAttrs = ` data-glossary-head="${escAttr(head)}"` +
                      (aka ? ` data-glossary-aka="${escAttr(aka)}"` : '') +
                      ` data-glossary-blurb="${escAttr(blurb)}"`;
    const link = `<!-- LIBRARY:autolink:start --><a href="${url}"${dataAttrs}>${matched}</a><!-- LIBRARY:autolink:end -->`;
    html = html.slice(0, p.start) + link + html.slice(p.end);
  }

  writeFileSync(file, html, 'utf8');
  return placed.length;
}

// ---------- glossary hub permalinks ----------
//
// Each term in /glossary/index.html (and the ES mirror) gets a
// small "Open the term page →" link injected right before its
// closing </article> tag. Idempotent — markers (LIBRARY:gloss-perma:
// start/end) wrap the link so re-runs replace, not append. Points
// readers from the scannable hub at /glossary/ into the standalone
// term page at /glossary/<slug>/ — the URL blog prose now links to.

function injectGlossaryPermalinks(locale) {
  const file = locale === 'es'
    ? join(REPO, 'es/glossary/index.html')
    : join(REPO, 'glossary/index.html');
  let html;
  try { html = readFileSync(file, 'utf8'); } catch { return 0; }

  // Strip any existing permalink markers, then inject fresh ones.
  // This keeps the script idempotent even if a term's slug or label
  // changes.
  const stripped = html.replace(
    /\n?\s*<!-- LIBRARY:gloss-perma:start -->[\s\S]*?<!-- LIBRARY:gloss-perma:end -->/g,
    '',
  );

  const label = locale === 'es' ? 'Abrir la página del término' : 'Open the term page';

  // For each <article class="gloss-term" id="X" data-industries="...">
  // ... </article>, inject a permalink right before the closing.
  let count = 0;
  const out = stripped.replace(
    /(<article class="gloss-term" id="([a-z0-9-]+)"[^>]*>[\s\S]*?)(\n\s*<\/article>)/g,
    (_m, body, slug, close) => {
      count++;
      const block = `\n        <!-- LIBRARY:gloss-perma:start -->\n        <p class="gloss-term-permalink"><a href="${pathFor(locale, '/glossary/' + slug + '/')}">${label} <span aria-hidden="true">&rarr;</span></a></p>\n        <!-- LIBRARY:gloss-perma:end -->`;
      return body + block + close;
    },
  );

  if (out !== html) writeFileSync(file, out, 'utf8');
  return count;
}

// ---------- run ----------

let byTopic; // module-level reference for the topics hub renderer

for (const locale of LOCALES) {
  console.log(`\n=== Building locale: ${locale} ===`);
  byTopic = indexByTopic(locale);
  const outBase = locale === 'en' ? REPO : join(REPO, locale);

  // Topics hub
  write(join(outBase, 'learn/topics/index.html'), renderTopicsHub(locale, byTopic));

  // Six topic pages
  for (const topic of TOPICS) {
    const content = byTopic[topic.slug];
    write(join(outBase, 'learn/topics', topic.slug, 'index.html'), renderTopicPage(locale, topic, content));
  }

  console.log(`Built ${pathFor(locale, '/learn/topics/')} + ${TOPICS.length} topic pages.`);
  for (const tp of TOPICS) {
    const c = byTopic[tp.slug];
    console.log(`  ${tp.slug.padEnd(20)} → ${c.articles.length} articles, ${c.research.length} research, ${c.tools.length} tools, ${c.checklists.length} checklists`);
  }

  // Research backlinks
  const cites = findCitations(locale);
  console.log(`\nResearch backlinks (${locale}):`);
  for (const researchSlug of Object.keys(tagsDoc.research_notes)) {
    const list = cites[researchSlug] || [];
    const action = injectCitedIn(locale, researchSlug, list);
    console.log(`  ${researchSlug.padEnd(34)} ${list.length} citing post(s) — ${action}`);
  }

  // Tool deep-links — every tool gets a Library block at the bottom
  // surfacing curated glossary terms + articles + topic chips. Tools
  // can declare either the singular keys (`glossary_term` / `article`)
  // or the array forms (`glossary_terms` / `articles`); the renderer
  // shows up to 2 glossary cards + 1 article card.
  {
    const { terms } = parseGlossary(locale);
    const termBySlug = Object.fromEntries(terms.map(tm => [tm.slug, tm]));
    console.log(`\nTool deep-links (${locale}):`);
    for (const [toolSlug, tool] of Object.entries(tagsDoc.tools)) {
      const termSlugs = Array.isArray(tool.glossary_terms)
        ? tool.glossary_terms
        : (tool.glossary_term ? [tool.glossary_term] : []);
      const articleSlugs = Array.isArray(tool.articles)
        ? tool.articles
        : (tool.article ? [tool.article] : []);
      const glossaryTerms = termSlugs.map(s => termBySlug[s]).filter(Boolean);
      const articles = articleSlugs.map(slug => {
        const meta = getMeta(locale, 'blog', slug);
        return meta && meta.title ? { slug, ...meta } : null;
      }).filter(Boolean);
      const action = injectToolDeepLinks(locale, toolSlug, tool, glossaryTerms, articles);
      const refs = [];
      glossaryTerms.forEach(t => refs.push(`glossary:${t.slug}`));
      articles.forEach(a => refs.push(`article:${a.slug}`));
      console.log(`  ${toolSlug.padEnd(22)} → ${refs.join(', ').padEnd(60)} — ${action}`);
    }
  }

  // See-also blocks on blog posts.
  console.log(`\nSee-also blocks (${locale}):`);
  for (const [blogSlug, enMeta] of Object.entries(tagsDoc.blog_posts)) {
    const existing = existingFurtherReadingHrefs(locale, blogSlug);
    const items = relatedItemsFor(locale, blogSlug, enMeta.topics, existing);
    const action = injectSeeAlso(locale, blogSlug, items);
    console.log(`  ${blogSlug.padEnd(56)} ${items.length} item(s) — ${action}`);
  }

  // Per-term glossary pages
  {
    const { sections, terms } = parseGlossary(locale);
    let count = 0;
    for (const term of terms) {
      write(join(outBase, 'glossary', term.slug, 'index.html'), renderTermPage(locale, term, terms));
      count++;
    }
    console.log(`\nPer-term glossary pages (${locale}): ${count} term page(s) generated.`);

    // Per-section landing pages (one bookmark-friendly page per
    // glossary section). One write per section that has terms; safe
    // because no term slug collides with a section slug.
    let sectionCount = 0;
    for (const section of Object.values(sections)) {
      const sectionTerms = terms.filter(tm => tm.sectionSlug === section.slug);
      if (!sectionTerms.length) continue;
      write(join(outBase, 'glossary', section.slug, 'index.html'), renderSectionPage(locale, section, sectionTerms));
      sectionCount++;
    }
    console.log(`Per-section glossary pages (${locale}): ${sectionCount} section page(s) generated.`);
  }

  // Glossary hub permalinks — connect the scannable hub at
  // /glossary/ into the standalone term pages at /glossary/<slug>/.
  {
    const stamped = injectGlossaryPermalinks(locale);
    console.log(`Glossary hub permalinks (${locale}): ${stamped} term(s) stamped.`);
  }

  // Glossary auto-linker — for every blog post, find the first
  // whole-word mention of each glossary term in the article body
  // and wrap it with a link to that term's standalone page.
  {
    const { terms } = parseGlossary(locale);
    console.log(`\nGlossary auto-link (${locale}):`);
    for (const blogSlug of Object.keys(tagsDoc.blog_posts)) {
      const linked = autoLinkGlossary(locale, blogSlug, terms);
      console.log(`  ${blogSlug.padEnd(56)} ${linked} link(s) stamped`);
    }
  }

  // Update the "Cited in N articles" labels on the research hub.
  // Both locales have a research hub with the same DOM pattern.
  {
    const file = join(outBase, 'learn/research/index.html');
    let html = '';
    try { html = readFileSync(file, 'utf8'); } catch { html = ''; }
    if (!html) continue;
    let changed = 0;
    const labelText = locale === 'es' ? 'Citado en' : 'Cited in';
    const singular = locale === 'es' ? 'artículo' : 'article';
    const plural = locale === 'es' ? 'artículos' : 'articles';
    for (const researchSlug of Object.keys(tagsDoc.research_notes)) {
      const n = (cites[researchSlug] || []).length;
      const noun = n === 1 ? singular : plural;
      const hrefBase = pathFor(locale, `/learn/research/${researchSlug}/`);
      const cardRe = new RegExp(
        `(<a class="research-index-card" href="${hrefBase.replace(/\//g, '\\/')}">[\\s\\S]*?<span class="research-index-uses">${labelText} <strong>)(\\d+)(</strong> )(\\S+)(<\\/span>)`,
      );
      const replaced = html.replace(cardRe, (_m, p1, _old, p3, _oldNoun, p5) => {
        changed++;
        return `${p1}${n}${p3}${noun}${p5}`;
      });
      if (replaced !== html) html = replaced;
    }
    if (changed) {
      writeFileSync(file, html, 'utf8');
      console.log(`Updated ${changed} citation count(s) on ${pathFor(locale, '/learn/research/')}`);
    }
  }
}
