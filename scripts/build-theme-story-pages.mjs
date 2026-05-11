#!/usr/bin/env node
/**
 * Wave B14 — Per-theme story page generator.
 *
 * Each of the 37 themes gets its own indexable page at
 * /library/menu-design-themes/<id>/ (and ES mirror). Operator
 * searching "izakaya lantern menu template" lands directly on
 * the page for that theme — no scrolling through a directory.
 *
 * Each page surfaces:
 *   - Theme name + group + palette swatches
 *   - Curator metadata (reviewedBy / dateAdded)
 *   - Long-form curator story (theme-credits.js)
 *   - Inspired-by cuisine traditions
 *   - Typography spec (body / display family + sizes)
 *   - Compatible papers
 *   - Cuisine hint chips (the search terms that auto-route to
 *     this theme inside the editor)
 *   - "Open this theme in the editor →" deeplink with ?theme=<id>
 *   - Cross-links: review board hub, related cuisine page
 *
 * SEO surface: 37 themes × 2 locales = 74 pages, each with
 * CreativeWork + BreadcrumbList JSON-LD.
 *
 * Modes:
 *   node scripts/build-theme-story-pages.mjs           # write
 *   node scripts/build-theme-story-pages.mjs --check   # diff-only;
 *                                                       exit 1 on drift
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
import crypto from 'node:crypto';
function shellHash(name) {
  // Content-hashed cache-bust, in lockstep with inject-css-cache-bust.mjs.
  // Generators emit the current hash so their --check stays clean even
  // after inject-css-cache-bust rewrites cache-busts on existing pages.
  const abs = path.join(repoRoot, 'assets', name);
  const h = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
  return h.slice(0, 12);
}
const SHELL_HASH = { core: shellHash('site-core.css'), article: shellHash('site-article.css') };

const checkMode  = process.argv.includes('--check');

function loadModule(relPath) {
  const src  = fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
  const win  = {};
  const moduleObj = { exports: {} };
  const ctx = {
    window: win, module: moduleObj,
    Math, Date, Object, Array, String, Number,
    JSON, parseFloat, parseInt, isFinite, isNaN, Boolean
  };
  const fn = new Function(...Object.keys(ctx), src);
  fn(...Object.values(ctx));
  return moduleObj.exports;
}

const THEMES  = loadModule('data/menu-design-themes.js');
const CREDITS = loadModule('data/menu-design-theme-credits.js');
const groups  = THEMES.groups();

// ---- Cuisine bucket lookup (mirrors build-cuisine-landing-pages.mjs)
const CUISINE_BUCKETS = [
  { slug: 'italian',                matchers: [/italian|italiana|trattor|pasta|pizza|pizzeria|osteria/i] },
  { slug: 'mexican',                matchers: [/mexic|taco|cantina|taquer|tex-mex|cevich/i] },
  { slug: 'asian',                  matchers: [/asian|thai|viet|kor|chin|japan|noodle|ramen|sushi|izakaya|dim sum|pho/i] },
  { slug: 'french-bistro',          matchers: [/french|francesa|brasser|bistro/i] },
  { slug: 'american-bbq',           matchers: [/steak|chop|parr|asad|bbq|barbec|smoke|brisket|brewpub|grill/i] },
  { slug: 'seafood',                matchers: [/seafood|oyster|fish|maris|pesc|raw bar|cevich|peruvian|nikkei/i] },
  { slug: 'cafe-bakery',            matchers: [/cafe|café|coffee|bakery|panaderia|panadería|patisserie|breakfast|pastry/i] },
  { slug: 'food-truck',             matchers: [/food truck|ghost kitchen|pop-up|street food|truck|deli|appetiz|bagel/i] },
  { slug: 'vegan-plant-forward',    matchers: [/farm|garden|plant|seasonal|vegan|vegetarian|vegano/i] },
  { slug: 'specialty-bar-tasting',  matchers: [/wine|tasting|degustation|prix.fixe|prix-fixe|cocktail|chef counter|chef's counter|chefs counter|sake|izakaya|omakase|hotel/i] }
];

function cuisineSlugsForTheme(theme) {
  const hints = (theme.cuisineHint || []).slice();
  const slugs = new Set();
  for (const bucket of CUISINE_BUCKETS) {
    for (const hint of hints) {
      if (bucket.matchers.some(re => re.test(hint))) {
        slugs.add(bucket.slug);
        break;
      }
    }
  }
  return Array.from(slugs);
}

function findGroupLabel(themeId, locale) {
  for (const g of groups) {
    if (g.themes.indexOf(themeId) >= 0) {
      return locale === 'es' ? (g.label_es || g.label_en) : g.label_en;
    }
  }
  return locale === 'es' ? 'Otros' : 'Other';
}

// ---- Helpers --------------------------------------------------------
function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function cleanFamily(s) {
  return String(s || '').split(',')[0].trim().replace(/['"]/g, '');
}

function emitJsonLd(themeId, locale) {
  const t = THEMES.get(themeId);
  const c = CREDITS.get(themeId);
  if (!t) return '';
  const baseUrl = locale === 'es'
    ? `https://muntin.digital/es/library/menu-design-themes/${themeId}/`
    : `https://muntin.digital/library/menu-design-themes/${themeId}/`;
  const label = locale === 'es' ? t.label_es : t.label_en;
  const blurb = locale === 'es' ? t.blurb_es : t.blurb_en;
  const breadcrumb = locale === 'es' ? [
    { '@type': 'ListItem', 'position': 1, 'name': 'Muntin Digital', 'item': 'https://muntin.digital/es/' },
    { '@type': 'ListItem', 'position': 2, 'name': 'Biblioteca', 'item': 'https://muntin.digital/es/library/' },
    { '@type': 'ListItem', 'position': 3, 'name': 'Mesa de revisión de temas', 'item': 'https://muntin.digital/es/library/menu-design-themes/' },
    { '@type': 'ListItem', 'position': 4, 'name': label, 'item': baseUrl }
  ] : [
    { '@type': 'ListItem', 'position': 1, 'name': 'Muntin Digital', 'item': 'https://muntin.digital/' },
    { '@type': 'ListItem', 'position': 2, 'name': 'Library', 'item': 'https://muntin.digital/library/' },
    { '@type': 'ListItem', 'position': 3, 'name': 'Theme review board', 'item': 'https://muntin.digital/library/menu-design-themes/' },
    { '@type': 'ListItem', 'position': 4, 'name': label, 'item': baseUrl }
  ];
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        '@id': baseUrl + '#theme',
        'name': label,
        'description': blurb,
        ...(c ? { 'creator': { '@type': 'Person', 'name': c.reviewedBy } } : {}),
        ...(c ? { 'dateCreated': c.dateAdded } : {}),
        'inLanguage': locale === 'es' ? 'es' : 'en',
        'url': baseUrl,
        'isPartOf': { '@id': locale === 'es' ? 'https://muntin.digital/es/library/menu-design-themes/#collection' : 'https://muntin.digital/library/menu-design-themes/#collection' }
      },
      { '@type': 'BreadcrumbList', 'itemListElement': breadcrumb }
    ]
  });
}

function emitThemePage(themeId, locale) {
  const t = THEMES.get(themeId);
  const c = CREDITS.get(themeId);
  if (!t || !c) return null;
  const lang = locale === 'es' ? 'es' : 'en';
  const baseSlash = locale === 'es' ? '/es' : '';
  const label = locale === 'es' ? t.label_es : t.label_en;
  const blurb = locale === 'es' ? t.blurb_es : t.blurb_en;
  const groupLabel = findGroupLabel(themeId, locale);

  const titleStr = locale === 'es'
    ? `${label} — plantilla de menú | Muntin Digital`
    : `${label} — menu template | Muntin Digital`;

  const cuisineSlugs = cuisineSlugsForTheme(t);

  const reviewedLabel = locale === 'es' ? 'Revisado por' : 'Reviewed by';
  const addedLabel    = locale === 'es' ? 'Añadido'      : 'Added';
  const inspiredLabel = locale === 'es' ? 'Inspirado en' : 'Inspired by';
  const tryLabel      = locale === 'es' ? 'Pídelo con Menu Drop-In →' : 'Get it built — Menu Drop-In →';
  const tryHref       = `${baseSlash}/services/menu-drop-in/`;

  const inspiredHtml = (c.inspiredBy || []).map(s => `<li>${escHtml(s)}</li>`).join('');

  const cuisineLinkLabel = locale === 'es' ? 'Más temas para cocina' : 'More themes for';
  const cuisineLinks = cuisineSlugs.map(slug => {
    const labelMap = {
      'italian':                { en: 'Italian', es: 'italiana' },
      'mexican':                { en: 'Mexican', es: 'mexicana' },
      'asian':                  { en: 'Asian',   es: 'asiática' },
      'french-bistro':          { en: 'French bistro', es: 'bistró francés' },
      'american-bbq':           { en: 'American BBQ',  es: 'BBQ americano' },
      'seafood':                { en: 'Seafood',       es: 'mariscos' },
      'cafe-bakery':            { en: 'Cafe + bakery', es: 'café y panadería' },
      'food-truck':             { en: 'Food truck',    es: 'food truck' },
      'vegan-plant-forward':    { en: 'Vegan + plant-forward', es: 'vegano' },
      'specialty-bar-tasting':  { en: 'Wine bar + tasting',    es: 'barra de vinos + degustación' }
    };
    const cuisineLabel = labelMap[slug] ? labelMap[slug][locale === 'es' ? 'es' : 'en'] : slug;
    return `<li><a href="${baseSlash}/library/menu-design-cuisines/${slug}/">${cuisineLinkLabel} ${escHtml(cuisineLabel)}</a></li>`;
  }).join('');

  const cuisineHints = (t.cuisineHint || []).slice(0, 12).map(h =>
    `<span class="md-ts-chip">${escHtml(h)}</span>`
  ).join(' ');
  const paperFloors = (t.paperFloors || []).map(p =>
    `<span class="md-ts-chip">${escHtml(p)}</span>`
  ).join(' ');

  const heroH1 = label;
  const breadcrumbHome = locale === 'es' ? 'Inicio' : 'Home';
  const breadcrumbLib  = locale === 'es' ? 'Biblioteca' : 'Library';
  const breadcrumbHub  = locale === 'es' ? 'Mesa de revisión de temas' : 'Theme review board';

  const swatches = [
    { hex: t.paper,  label: locale === 'es' ? 'papel'  : 'paper'  },
    { hex: t.ink,    label: locale === 'es' ? 'tinta'  : 'ink'    },
    { hex: t.accent, label: locale === 'es' ? 'acento' : 'accent' },
    { hex: t.muted,  label: locale === 'es' ? 'suave'  : 'muted'  }
  ];
  const swatchesHtml = swatches.map(s =>
    `<span class="md-ts-swatch-row"><span class="md-ts-swatch" style="background:${escHtml(s.hex)}" aria-hidden="true"></span><code>${escHtml(s.hex)}</code> <span>${escHtml(s.label)}</span></span>`
  ).join('');

  const sectionStoryLabel = locale === 'es' ? 'Historia del tema' : 'Theme story';
  const sectionTokensLabel = locale === 'es' ? 'Especificaciones técnicas' : 'Technical spec';
  const sectionCuisineLabel = locale === 'es' ? 'Cocinas y pistas de búsqueda' : 'Cuisine + search hints';
  const sectionPaperLabel  = locale === 'es' ? 'Papeles compatibles' : 'Compatible papers';

  const tokensIntro = locale === 'es'
    ? 'Cada tema lleva una paleta, dos tipografías como máximo, un estilo de divisor, un estilo de precio y un piso mínimo de tipo de cuerpo. Estos son los valores exactos que el editor aplica cuando eliges este tema.'
    : 'Each theme ships with a palette, at most two typefaces, a divider style, a price style, and a minimum body-type floor. These are the exact values the editor applies when you pick this theme.';

  const tokensRow = (lbl, val) =>
    `<div class="md-ts-token"><dt>${escHtml(lbl)}</dt><dd>${escHtml(val)}</dd></div>`;

  const tokens = [
    [locale === 'es' ? 'Cuerpo'              : 'Body family',     cleanFamily(t.bodyFamily)],
    [locale === 'es' ? 'Display'             : 'Display family',  cleanFamily(t.displayFamily)],
    [locale === 'es' ? 'Tamaño de cuerpo'    : 'Body size',       `${t.bodyPt} pt`],
    [locale === 'es' ? 'Tamaño H1'           : 'H1 size',         `${t.h1Pt} pt`],
    [locale === 'es' ? 'Tamaño H2'           : 'H2 size',         `${t.h2Pt} pt`],
    [locale === 'es' ? 'Tamaño descripción'  : 'Description size',`${t.descPt} pt`],
    [locale === 'es' ? 'Estilo de precio'    : 'Price style',     t.priceStyle],
    [locale === 'es' ? 'Estilo de divisor'   : 'Divider style',   t.dividerStyle],
    [locale === 'es' ? 'Columnas'            : 'Columns',         String(t.columns)],
    [locale === 'es' ? 'Caso de sección'     : 'Section case',    t.sectionCase],
    [locale === 'es' ? 'Espaciado de letras' : 'Letter spacing',  t.letterSpacing]
  ];
  const tokensHtml = tokens.map(([lbl, val]) => tokensRow(lbl, val)).join('');

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<title>${escHtml(titleStr)}</title>
<meta name="description" content="${escHtml(blurb)} ${escHtml(reviewedLabel)} ${escHtml(c.reviewedBy)}, ${escHtml(addedLabel)} ${escHtml(c.dateAdded)}." />
<meta name="theme-color" content="#1F4E5B" />
<link rel="canonical" href="https://muntin.digital${baseSlash}/library/menu-design-themes/${themeId}/" />
<link rel="alternate" hreflang="en" href="https://muntin.digital/library/menu-design-themes/${themeId}/" />
<link rel="alternate" hreflang="es" href="https://muntin.digital/es/library/menu-design-themes/${themeId}/" />
<link rel="alternate" hreflang="x-default" href="https://muntin.digital/library/menu-design-themes/${themeId}/" />
<meta property="og:locale" content="${locale === 'es' ? 'es_US' : 'en_US'}" />
<meta property="og:locale:alternate" content="${locale === 'es' ? 'en_US' : 'es_US'}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${escHtml(titleStr)}" />
<meta property="og:description" content="${escHtml(blurb)}" />
<meta property="og:url" content="https://muntin.digital${baseSlash}/library/menu-design-themes/${themeId}/" />
<meta property="og:site_name" content="Muntin Digital" />
<link rel="icon" type="image/svg+xml" sizes="any" href="/brand/mark/mark-square-ink.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/brand/favicons/android-chrome-192x192.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/brand/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/brand/favicons/site.webmanifest" />
<script type="application/ld+json">${emitJsonLd(themeId, locale)}</script>
<!-- Self-hosted fonts. @font-face rules live in site.css; preload only
     the two critical above-the-fold weights (Fraunces 500 for the display
     headline and Inter 400 for body copy) to keep first paint fast without
     over-fetching. Metric-matched fallbacks in site.css prevent CLS. -->
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/fraunces-v38-latin-500.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/inter-v20-latin-regular.woff2" crossorigin>
<style>
/* Critical CSS — prevents flash of unstyled content while the main
   stylesheet (assets/site.css) loads non-render-blocking via the
   <link> below. Carries: token vars used in inline styles elsewhere,
   body baseline (cream + ink + body-size + line-height), container
   width, skip-link affordance, and a min-height reservation for the
   fixed nav so layout doesn't shift when site.css applies. ~600
   bytes. Documented in Phase 3B perf cutover; the full token set
   reapplies once site.css arrives. */
:root{--cream:#FAF7F2;--cream-2:#F3EEE3;--ink:#14161A;--ink-soft:#2A2D33;--teal:#1F4E5B;--max:1200px;--pad-x:clamp(20px,4vw,64px)}
html{box-sizing:border-box}*,*:before,*:after{box-sizing:inherit}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--cream);line-height:1.6;font-size:17px;-webkit-font-smoothing:antialiased}
.container{max-width:var(--max);margin:0 auto;padding-inline:var(--pad-x)}
.skip-link{position:absolute;left:-9999px;top:0}
.skip-link:focus{position:static;display:inline-block;background:#14161A;color:#FAF7F2;padding:12px 16px;z-index:100}
/* injected by inject-critical-link-color.mjs */
a{color:inherit}
.btn{display:inline-flex;align-items:center;gap:10px;padding:15px 26px;border-radius:999px;font-weight:500;font-size:15px;text-decoration:none;white-space:nowrap;cursor:pointer}
.btn-primary{background:var(--ink);color:var(--cream)}
.btn-ghost{background:transparent;color:var(--ink);border:1px solid #D9D5CB}
header.nav{min-height:64px}
/* nav-critical */
.nav{position:fixed;top:0;left:0;right:0;background:var(--cream);z-index:50;border-bottom:1px solid #E8E2D6}
.nav-inner{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:64px;padding:12px 0}
.logo{display:flex;align-items:center;gap:10px;font-family:Georgia,serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;flex-shrink:0;white-space:nowrap;color:inherit;text-decoration:none}
.logo-mark{width:28px;height:28px;flex:0 0 28px}
.tm{font-size:0.5em;vertical-align:super;margin-left:1px}
.nav-links{display:flex;gap:36px;font-size:15px}
.nav-links a{text-decoration:none;color:inherit}
.nav-toggle{display:none}
.nav-search-btn,.lang-switch{display:none}
@media (max-width:1100px){.nav-links{display:none}.nav-toggle{display:flex;width:44px;height:44px;flex-direction:column;justify-content:center;align-items:center;gap:5px;background:transparent;border:0;padding:0}.nav-toggle span{display:block;width:22px;height:2px;background:var(--ink)}.nav-inner .btn-primary{display:none}}
main{padding-top:64px}
</style>
<!-- Async-load the main stylesheet. Pattern: preload + onload-swap
     (with a <noscript> fallback for the JS-disabled path). The
     onload assigns this.rel='stylesheet', which the browser then
     applies; before that the critical CSS above carries the page. -->
<link rel="preload" as="style" href="/assets/site-core.css?v=${SHELL_HASH.core}" onload="this.onload=null;this.rel='stylesheet'">
<link rel="preload" as="style" href="/assets/site-article.css?v=${SHELL_HASH.article}" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/assets/site-core.css?v=${SHELL_HASH.core}"><link rel="stylesheet" href="/assets/site-article.css?v=${SHELL_HASH.article}"></noscript>
<style>
.md-ts-hero{padding:48px 0 24px;border-bottom:1px solid var(--line)}
.md-ts-group{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--teal);margin:0 0 8px}
.md-ts-hero h1{font-family:var(--font-display);font-size:clamp(28px,4vw,40px);font-weight:500;line-height:1.15;color:var(--ink);margin:0 0 12px}
.md-ts-hero-lede{font-size:17px;line-height:1.6;color:var(--ink-soft);margin:0 0 18px;max-width:720px}
.md-ts-meta{font-size:13.5px;color:var(--ink-soft);margin:0 0 18px}
.md-ts-cta{display:inline-block;padding:12px 22px;background:var(--ink);color:var(--cream);border-radius:999px;font-weight:600;font-size:14px;text-decoration:none}
.md-ts-cta:hover{background:var(--teal)}
.md-ts-section{margin:36px 0}
.md-ts-section h2{font-family:var(--font-display);font-size:22px;font-weight:500;color:var(--ink);margin:0 0 12px;padding-bottom:6px;border-bottom:2px solid var(--teal);display:inline-block}
.md-ts-story{font-size:15px;line-height:1.7;color:var(--ink);margin:0 0 14px;max-width:720px}
.md-ts-inspired{padding-left:18px;font-size:14px;line-height:1.65;color:var(--ink);margin:0;max-width:720px}
.md-ts-inspired li{margin:0 0 6px}
.md-ts-tokens{display:grid;grid-template-columns:auto 1fr;gap:6px 18px;margin:14px 0 0;font-size:13.5px;max-width:720px}
.md-ts-token{display:contents}
.md-ts-token dt{font-weight:600;color:var(--ink)}
.md-ts-token dd{margin:0;color:var(--ink-soft)}
.md-ts-tokens-intro{font-size:14px;line-height:1.65;color:var(--ink-soft);margin:0 0 14px;max-width:720px}
.md-ts-swatches{display:flex;flex-direction:column;gap:6px;margin:14px 0 0}
.md-ts-swatch-row{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ink-soft)}
.md-ts-swatch{display:inline-block;width:32px;height:32px;border-radius:6px;border:1px solid var(--line)}
.md-ts-swatch-row code{background:var(--cream-2);padding:2px 6px;border-radius:3px;font-size:12px}
.md-ts-chips{margin:14px 0 0}
.md-ts-chip{display:inline-block;padding:3px 10px;margin:0 4px 4px 0;background:var(--cream-2);border:1px solid var(--line);border-radius:999px;font-size:12px;color:var(--ink-soft)}
.md-ts-related{margin:36px 0;padding-top:24px;border-top:1px solid var(--line)}
.md-ts-related ul{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:10px}
.md-ts-related li a{display:inline-block;padding:8px 14px;background:var(--white);border:1px solid var(--line);border-radius:999px;font-size:13px;color:var(--ink);text-decoration:none}
.md-ts-related li a:hover{border-color:var(--teal);color:var(--teal)}
.breadcrumb{font-size:13px;color:var(--ink-soft);margin:24px 0 0}
.breadcrumb a{color:var(--ink-soft);text-decoration:none;border-bottom:1px dashed currentColor}
.breadcrumb a:hover{color:var(--teal)}
</style>
</head>
<body>
<a class="skip-link" href="#main">${locale === 'es' ? 'Saltar al contenido' : 'Skip to content'}</a>
<header class="nav" id="nav">
  <div class="container nav-inner">
    <a href="${baseSlash}/" class="logo" aria-label="Muntin Digital">
      <img class="logo-mark" src="/brand/mark/mark-square-ink.svg" alt="" width="36" height="36" />
      <span class="logo-text">Muntin Digital</span>
    </a>
  </div>
</header>
<main id="main" role="main">
<div class="container">
  <p class="breadcrumb">
    <a href="${baseSlash}/">${breadcrumbHome}</a> ›
    <a href="${baseSlash}/library/">${breadcrumbLib}</a> ›
    <a href="${baseSlash}/library/menu-design-themes/">${breadcrumbHub}</a> ›
    ${escHtml(label)}
  </p>
  <section class="md-ts-hero">
    <p class="md-ts-group">${escHtml(groupLabel)}</p>
    <h1>${escHtml(heroH1)}</h1>
    <p class="md-ts-hero-lede">${escHtml(blurb)}</p>
    <p class="md-ts-meta"><strong>${escHtml(reviewedLabel)}</strong> ${escHtml(c.reviewedBy)} · <strong>${escHtml(addedLabel)}</strong> <time datetime="${escHtml(c.dateAdded)}">${escHtml(c.dateAdded)}</time></p>
    <a href="${escHtml(tryHref)}" class="md-ts-cta">${tryLabel}</a>
  </section>
  <section class="md-ts-section">
    <h2>${escHtml(sectionStoryLabel)}</h2>
    <p class="md-ts-story">${escHtml(c.story)}</p>
    <h3 style="font-family:var(--font-display);font-size:16px;font-weight:500;margin:18px 0 8px;color:var(--ink)">${escHtml(inspiredLabel)}</h3>
    <ul class="md-ts-inspired">${inspiredHtml}</ul>
  </section>
  <section class="md-ts-section">
    <h2>${escHtml(sectionTokensLabel)}</h2>
    <p class="md-ts-tokens-intro">${escHtml(tokensIntro)}</p>
    <dl class="md-ts-tokens">${tokensHtml}</dl>
    <h3 style="font-family:var(--font-display);font-size:16px;font-weight:500;margin:18px 0 8px;color:var(--ink)">${locale === 'es' ? 'Paleta' : 'Palette'}</h3>
    <div class="md-ts-swatches">${swatchesHtml}</div>
  </section>
  <section class="md-ts-section">
    <h2>${escHtml(sectionCuisineLabel)}</h2>
    <p class="md-ts-tokens-intro">${locale === 'es'
      ? 'Cuando tu lista de platos contiene una de estas pistas, el editor sugiere automáticamente este tema. También son los términos que orientan tu menú a una página de cocina específica.'
      : 'When your dish list contains any of these hints, the editor auto-suggests this theme. They\'re also the search terms that route your menu toward a specific cuisine page.'}</p>
    <div class="md-ts-chips">${cuisineHints || '—'}</div>
  </section>
  <section class="md-ts-section">
    <h2>${escHtml(sectionPaperLabel)}</h2>
    <div class="md-ts-chips">${paperFloors || '—'}</div>
  </section>
  ${cuisineLinks ? `<section class="md-ts-related"><h2 style="font-family:var(--font-display);font-size:18px;font-weight:500;color:var(--ink);margin:0 0 12px">${locale === 'es' ? 'Páginas relacionadas' : 'Related pages'}</h2><ul>${cuisineLinks}<li><a href="${baseSlash}/library/menu-design-themes/">${locale === 'es' ? 'Mesa de revisión de temas' : 'Theme review board'}</a></li><li><a href="${tryHref}">${tryLabel}</a></li></ul></section>` : ''}
</div>
</main>
<footer class="site-footer" id="footer"></footer>
<script src="/assets/site.js?v=20260430-cohesion" defer></script>
</body>
</html>
`;
}

// ---- Write or check ------------------------------------------------
const targets = [];
const themeIds = THEMES.list();
for (const id of themeIds) {
  const enContent = emitThemePage(id, 'en');
  const esContent = emitThemePage(id, 'es');
  if (enContent) targets.push({ path: `library/menu-design-themes/${id}/index.html`,    content: enContent });
  if (esContent) targets.push({ path: `es/library/menu-design-themes/${id}/index.html`, content: esContent });
}

let drift = 0;
for (const tgt of targets) {
  const fullPath = path.join(repoRoot, tgt.path);
  const dirPath  = path.dirname(fullPath);
  if (checkMode) {
    const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : null;
    if (existing !== tgt.content) {
      drift++;
      console.log(`would update ${tgt.path}`);
    }
  } else {
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(fullPath, tgt.content);
  }
}

if (checkMode) {
  if (drift > 0) {
    console.log(`Theme story pages: would update ${drift} file(s).`);
    console.log('Run: node scripts/build-theme-story-pages.mjs');
    process.exit(1);
  } else {
    console.log('Theme story pages (idem): would update 0 file(s).');
  }
} else {
  console.log(`Theme story pages: ${themeIds.length} themes × 2 locales = ${targets.length} pages.`);
}
