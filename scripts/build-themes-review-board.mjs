#!/usr/bin/env node
/**
 * Wave C14 — Public theme review-board page generator.
 *
 * Emits /library/menu-design-themes/index.html (and ES mirror) from
 * the data already in data/menu-design-themes.js +
 * data/menu-design-theme-credits.js. Every theme gets a public
 * record: label, group, blurb, palette swatches, paper formats,
 * cuisine hints, AND the curator metadata (reviewedBy / inspiredBy /
 * dateAdded / story) that makes the catalog defensible vs Canva.
 *
 * SEO surface: 1 indexable page per locale × 37 themes = ~74
 * crawlable theme records on a single page (pre-rendered HTML, no
 * JS required to read). JSON-LD CollectionPage + ItemList with
 * 37 CreativeWork entries.
 *
 * Modes:
 *   node scripts/build-themes-review-board.mjs           # write
 *   node scripts/build-themes-review-board.mjs --check   # diff-only;
 *                                                          exit 1 on drift
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


// Strip the batch-banner block before comparison so the injector-stamped
// banner content doesn't trip the generator's check-mode drift detector.
function normalizeBatchBanner(html) {
  return html.replace(/<!-- batch-banner:start -->[\s\S]*?<!-- batch-banner:end -->/, '<!-- batch-banner:start --><!-- batch-banner:end -->');
}

const checkMode  = process.argv.includes('--check');

// ---- Load themes + credits via a tiny vm-like sandbox --------------
function loadModule(relPath) {
  const src  = fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
  const win  = {};
  const moduleObj = { exports: {} };
  const ctx = {
    window: win,
    module: moduleObj,
    Math, Date, Object, Array, String, Number,
    JSON, parseFloat, parseInt, isFinite, isNaN, Boolean
  };
  const fn = new Function(...Object.keys(ctx), src);
  fn(...Object.values(ctx));
  return moduleObj.exports;
}

const THEMES  = loadModule('data/menu-design-themes.js');
const CREDITS = loadModule('data/menu-design-theme-credits.js');

const themeIds = THEMES.list();
const groups   = THEMES.groups();

// ---- Helpers --------------------------------------------------------
function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function swatchHtml(theme) {
  const colors = [
    { hex: theme.paper,  label: 'paper'  },
    { hex: theme.ink,    label: 'ink'    },
    { hex: theme.accent, label: 'accent' },
    { hex: theme.muted,  label: 'muted'  }
  ];
  return colors.map(c =>
    `<span class="md-rb-swatch" style="background:${escHtml(c.hex)}" title="${escHtml(c.label)}: ${escHtml(c.hex)}" aria-label="${escHtml(c.label + ' ' + c.hex)}"></span>`
  ).join('');
}

function findGroupLabel(themeId, locale) {
  for (const g of groups) {
    if (g.themes.indexOf(themeId) >= 0) {
      return locale === 'es' ? (g.label_es || g.label_en) : g.label_en;
    }
  }
  return locale === 'es' ? 'Otros' : 'Other';
}

function emitTheme(themeId, locale) {
  const t = THEMES.get(themeId);
  const c = CREDITS.get(themeId);
  if (!t || !c) return '';
  const label = locale === 'es' ? t.label_es : t.label_en;
  const blurb = locale === 'es' ? t.blurb_es : t.blurb_en;
  const groupLabel = findGroupLabel(themeId, locale);
  const reviewedLabel = locale === 'es' ? 'Revisado por' : 'Reviewed by';
  const addedLabel    = locale === 'es' ? 'Añadido'      : 'Added';
  const inspiredLabel = locale === 'es' ? 'Inspirado en' : 'Inspired by';
  const cuisineHints  = (t.cuisineHint || []).slice(0, 6).join(' · ');
  const paperFloors   = (t.paperFloors || []).join(' · ');
  const inspBits = (c.inspiredBy || []).map(s => `<li>${escHtml(s)}</li>`).join('');
  const toolHref = locale === 'es'
    ? `/es/library/menu-design-themes/${themeId}/`
    : `/library/menu-design-themes/${themeId}/`;
  const tryLabel = locale === 'es' ? 'Leer la historia del tema →' : 'Read the theme story →';

  return `
    <article class="md-rb-card" id="theme-${escHtml(themeId)}">
      <header class="md-rb-card-head">
        <h3 class="md-rb-name">${escHtml(label)}</h3>
        <p class="md-rb-group">${escHtml(groupLabel)}</p>
        <div class="md-rb-swatches" aria-label="${escHtml(label)} palette">${swatchHtml(t)}</div>
      </header>
      <p class="md-rb-blurb">${escHtml(blurb)}</p>
      <p class="md-rb-meta"><strong>${reviewedLabel}</strong> ${escHtml(c.reviewedBy)} · <strong>${addedLabel}</strong> <time datetime="${escHtml(c.dateAdded)}">${escHtml(c.dateAdded)}</time></p>
      <details class="md-rb-details">
        <summary>${locale === 'es' ? 'Historia del tema' : 'Theme story'}</summary>
        <p class="md-rb-story">${escHtml(c.story)}</p>
        <p class="md-rb-inspired-label"><strong>${inspiredLabel}:</strong></p>
        <ul class="md-rb-inspired">${inspBits}</ul>
        <dl class="md-rb-tokens">
          <dt>${locale === 'es' ? 'Tipografía' : 'Typography'}</dt>
          <dd>${escHtml(t.bodyFamily.split(',')[0].replace(/['"]/g, ''))} (body) · ${escHtml(t.displayFamily.split(',')[0].replace(/['"]/g, ''))} (display) · ${t.bodyPt}pt body / ${t.h1Pt}pt h1</dd>
          <dt>${locale === 'es' ? 'Cocinas' : 'Cuisines'}</dt>
          <dd>${escHtml(cuisineHints) || '—'}</dd>
          <dt>${locale === 'es' ? 'Papeles compatibles' : 'Compatible papers'}</dt>
          <dd>${escHtml(paperFloors) || '—'}</dd>
        </dl>
      </details>
      <p class="md-rb-cta"><a href="${escHtml(toolHref)}">${tryLabel}</a> · <a href="${locale === 'es' ? '/es' : ''}/library/menu-design-themes/${escHtml(themeId)}/">${locale === 'es' ? 'Leer la historia del tema →' : 'Read the theme story →'}</a></p>
    </article>`;
}

function emitJsonLd(locale) {
  const baseUrl = locale === 'es'
    ? 'https://muntin.digital/es/library/menu-design-themes/'
    : 'https://muntin.digital/library/menu-design-themes/';
  const items = themeIds.map((id, i) => {
    const t = THEMES.get(id);
    const c = CREDITS.get(id);
    if (!t || !c) return null;
    const label = locale === 'es' ? t.label_es : t.label_en;
    const blurb = locale === 'es' ? t.blurb_es : t.blurb_en;
    return {
      '@type': 'ListItem',
      'position': i + 1,
      'item': {
        '@type': 'CreativeWork',
        '@id': baseUrl + '#theme-' + id,
        'name': label,
        'description': blurb,
        'creator': { '@type': 'Person', 'name': c.reviewedBy },
        'dateCreated': c.dateAdded,
        'inLanguage': locale === 'es' ? 'es' : 'en',
        'isPartOf': { '@id': locale === 'es' ? 'https://muntin.digital/es/library/menu-design-themes/#collection' : 'https://muntin.digital/library/menu-design-themes/#collection' }
      }
    };
  }).filter(Boolean);
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': baseUrl + '#webpage',
        'name': locale === 'es'
          ? 'Mesa de revisión de temas — Menu Design Suite'
          : 'Theme review board — Menu Design Suite',
        'url': baseUrl,
        'inLanguage': locale === 'es' ? 'es-US' : 'en-US',
        'description': locale === 'es'
          ? 'Cada tema del Menu Design Suite con su revisor, su inspiración por cocina y su fecha de incorporación.'
          : 'Every Menu Design Suite theme with the named reviewer, the cuisine traditions that inspired it, and the date it landed.',
        'isPartOf': { '@id': 'https://muntin.digital/#website' },
        'publisher': { '@id': 'https://muntin.digital/#business' }
      },
      {
        '@type': 'ItemList',
        'numberOfItems': items.length,
        'itemListElement': items
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': locale === 'es' ? [
          { '@type': 'ListItem', 'position': 1, 'name': 'Muntin Digital', 'item': 'https://muntin.digital/es/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Biblioteca',    'item': 'https://muntin.digital/es/library/' },
          { '@type': 'ListItem', 'position': 3, 'name': 'Mesa de revisión de temas', 'item': baseUrl }
        ] : [
          { '@type': 'ListItem', 'position': 1, 'name': 'Muntin Digital', 'item': 'https://muntin.digital/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Library',        'item': 'https://muntin.digital/library/' },
          { '@type': 'ListItem', 'position': 3, 'name': 'Theme review board', 'item': baseUrl }
        ]
      }
    ]
  });
}

function emitPage(locale) {
  const lang = locale === 'es' ? 'es' : 'en';
  const titleStr = locale === 'es'
    ? 'Mesa de revisión de temas — Menu Design Suite | Muntin Digital'
    : 'Theme review board — Menu Design Suite | Muntin Digital';
  const descStr = locale === 'es'
    ? 'Los 37 temas de Menu Design Suite, cada uno con su revisor, sus tradiciones culinarias inspiradoras, y su fecha de incorporación. Curado por humanos. Auditable.'
    : 'All 37 Menu Design Suite themes, each with the named reviewer, the cuisine traditions that inspired it, and the date it landed. Human-curated. Auditable.';
  const heroH1 = locale === 'es' ? 'Mesa de revisión de temas' : 'Theme review board';
  const heroLede = locale === 'es'
    ? 'Cada uno de los 37 temas de Menu Design Suite tiene un revisor humano nombrado, una tradición culinaria que lo inspiró, y una fecha de incorporación. Canva no puede; sus temas son anónimos y de stock.'
    : "Every one of the 37 Menu Design Suite themes has a named human reviewer, a cuisine tradition that inspired it, and a date it landed. Canva can't say the same; their themes are anonymous and stock.";
  const groupBlocks = groups.map(g => {
    const groupLabel = locale === 'es' ? (g.label_es || g.label_en) : g.label_en;
    const cardsHtml = g.themes.map(id => emitTheme(id, locale)).filter(Boolean).join('\n');
    if (!cardsHtml) return '';
    return `
  <section class="md-rb-group" aria-labelledby="group-${g.id}">
    <h2 id="group-${g.id}" class="md-rb-group-title">${escHtml(groupLabel)}</h2>
    <div class="md-rb-grid">${cardsHtml}
    </div>
  </section>`;
  }).join('\n');
  // Catch any orphan (defensive — shouldn't happen with the metadata gate).
  const placedIds = new Set();
  groups.forEach(g => g.themes.forEach(id => placedIds.add(id)));
  const orphans = themeIds.filter(id => !placedIds.has(id));
  let orphanBlock = '';
  if (orphans.length) {
    const orphanLabel = locale === 'es' ? 'Otros' : 'Other';
    orphanBlock = `
  <section class="md-rb-group" aria-labelledby="group-orphans">
    <h2 id="group-orphans" class="md-rb-group-title">${escHtml(orphanLabel)}</h2>
    <div class="md-rb-grid">${orphans.map(id => emitTheme(id, locale)).join('\n')}
    </div>
  </section>`;
  }

  const langHrefBase = locale === 'es' ? 'https://muntin.digital/es' : 'https://muntin.digital';
  const otherLocaleHref = locale === 'es'
    ? 'https://muntin.digital/library/menu-design-themes/'
    : 'https://muntin.digital/es/library/menu-design-themes/';
  const ogLocale       = locale === 'es' ? 'es_US' : 'en_US';
  const ogLocaleAlt    = locale === 'es' ? 'en_US' : 'es_US';
  const libraryHref    = locale === 'es' ? '/es/library/' : '/library/';
  const toolHref       = locale === 'es' ? '/es/services/menu-drop-in/' : '/services/menu-drop-in/';
  const breadcrumbHome = locale === 'es' ? 'Inicio' : 'Home';
  const breadcrumbLib  = locale === 'es' ? 'Biblioteca' : 'Library';
  const breadcrumbThis = locale === 'es' ? 'Mesa de revisión de temas' : 'Theme review board';
  const introH2        = locale === 'es' ? 'Cómo leer esto' : 'How to read this';
  const intro1 = locale === 'es'
    ? 'Cada tema lleva una pequeña ficha: paleta, tipografía, papeles compatibles, las pistas de cocina que activan su elección automática en el editor. Despliega la ficha para leer la historia del tema y la lista de tradiciones que lo inspiraron.'
    : 'Each theme has a small record: palette, typography, compatible papers, the cuisine hints that fire its auto-selection in the editor. Expand the record to read the theme story and the list of cuisine traditions that inspired it.';
  const intro2 = locale === 'es'
    ? 'El campo "Inspirado en" describe géneros, tradiciones, culturas culinarias — nunca un negocio específico. Si eres operador y quieres figurar como inspiración explícita de un tema, escribe a don@muntin.digital.'
    : 'The "Inspired by" field describes genres, traditions, cuisine cultures — never a specific business. If you\'re an operator and want to be credited as an explicit inspiration for a theme, email don@muntin.digital.';

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<title>${escHtml(titleStr)}</title>
<meta name="description" content="${escHtml(descStr)}" />
<meta name="theme-color" content="#1F4E5B" />
<link rel="canonical" href="${langHrefBase}/library/menu-design-themes/" />
<link rel="alternate" hreflang="en" href="https://muntin.digital/library/menu-design-themes/" />
<link rel="alternate" hreflang="es" href="https://muntin.digital/es/library/menu-design-themes/" />
<link rel="alternate" hreflang="x-default" href="https://muntin.digital/library/menu-design-themes/" />
<meta property="og:locale" content="${ogLocale}" />
<meta property="og:locale:alternate" content="${ogLocaleAlt}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escHtml(heroH1 + ' — Menu Design Suite')}" />
<meta property="og:description" content="${escHtml(descStr)}" />
<meta property="og:url" content="${langHrefBase}/library/menu-design-themes/" />
<meta property="og:site_name" content="Muntin Digital" />
<link rel="icon" type="image/svg+xml" sizes="any" href="/brand/mark/mark-square-ink.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/brand/favicons/android-chrome-192x192.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/brand/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/brand/favicons/site.webmanifest" />
<script type="application/ld+json">${emitJsonLd(locale)}</script>
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
.md-rb-hero{padding:48px 0 24px;border-bottom:1px solid var(--line)}
.md-rb-hero h1{font-family:var(--font-display);font-size:clamp(28px,4vw,40px);font-weight:500;line-height:1.15;color:var(--ink);margin:0 0 12px}
.md-rb-hero-lede{font-size:17px;line-height:1.6;color:var(--ink-soft);margin:0;max-width:720px}
.md-rb-intro{margin:32px auto;max-width:720px;font-size:15px;line-height:1.65;color:var(--ink-soft)}
.md-rb-intro h2{font-family:var(--font-display);font-size:20px;font-weight:500;color:var(--ink);margin:0 0 8px}
.md-rb-intro p{margin:0 0 12px}
.md-rb-group{margin:48px 0}
.md-rb-group-title{font-family:var(--font-display);font-size:24px;font-weight:500;color:var(--ink);margin:0 0 18px;padding-bottom:8px;border-bottom:2px solid var(--teal)}
.md-rb-grid{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr))}
.md-rb-card{padding:18px 20px;background:var(--white);border:1px solid var(--line);border-radius:10px}
.md-rb-card-head{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.md-rb-name{font-family:var(--font-display);font-size:18px;font-weight:500;color:var(--ink);margin:0}
.md-rb-group{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--teal);margin:0}
.md-rb-swatches{display:flex;gap:4px;margin-top:4px}
.md-rb-swatch{display:inline-block;width:20px;height:20px;border-radius:4px;border:1px solid var(--line)}
.md-rb-blurb{font-size:13.5px;line-height:1.5;color:var(--ink);margin:0 0 8px}
.md-rb-meta{font-size:12px;color:var(--ink-soft);margin:0 0 10px}
.md-rb-details{font-size:13px}
.md-rb-details summary{cursor:pointer;font-weight:600;color:var(--teal);padding:4px 0}
.md-rb-details summary:hover{color:var(--ink)}
.md-rb-story{font-size:13.5px;line-height:1.6;color:var(--ink);margin:8px 0 10px}
.md-rb-inspired-label{font-size:12.5px;color:var(--ink-soft);margin:0 0 4px}
.md-rb-inspired{margin:0 0 12px;padding-left:18px;font-size:12.5px;line-height:1.5;color:var(--ink-soft)}
.md-rb-inspired li{margin:0 0 2px}
.md-rb-tokens{font-size:12px;color:var(--ink-soft);margin:8px 0 0;display:grid;grid-template-columns:auto 1fr;gap:4px 12px}
.md-rb-tokens dt{font-weight:700;color:var(--ink)}
.md-rb-tokens dd{margin:0}
.md-rb-cta{margin:14px 0 0}
.md-rb-cta a{color:var(--teal);text-decoration:none;border-bottom:1px dashed currentColor;font-size:13px;font-weight:600}
.md-rb-cta a:hover{color:var(--ink)}
.breadcrumb{font-size:13px;color:var(--ink-soft);margin:24px 0 0}
.breadcrumb a{color:var(--ink-soft);text-decoration:none;border-bottom:1px dashed currentColor}
.breadcrumb a:hover{color:var(--teal)}
</style>
</head>
<body>
<a class="skip-link" href="#main">${locale === 'es' ? 'Saltar al contenido' : 'Skip to content'}</a>
<!-- batch-banner:start --><!-- batch-banner:end -->
<header class="nav" id="nav">
  <div class="container nav-inner">
    <a href="${escHtml(locale === 'es' ? '/es/' : '/')}" class="logo" aria-label="Muntin Digital">
      <img class="logo-mark" src="/brand/mark/mark-square-ink.svg" alt="" width="36" height="36" />
      <span class="logo-text">Muntin Digital</span>
    </a>
  </div>
</header>
<main id="main" role="main">
<div class="container">
  <p class="breadcrumb">
    <a href="${escHtml(locale === 'es' ? '/es/' : '/')}">${breadcrumbHome}</a> ›
    <a href="${escHtml(libraryHref)}">${breadcrumbLib}</a> ›
    ${breadcrumbThis}
  </p>
  <section class="md-rb-hero">
    <h1>${escHtml(heroH1)}</h1>
    <p class="md-rb-hero-lede">${escHtml(heroLede)}</p>
  </section>
  <section class="md-rb-intro">
    <h2>${escHtml(introH2)}</h2>
    <p>${escHtml(intro1)}</p>
    <p>${escHtml(intro2)}</p>
    <p><a href="${escHtml(toolHref)}" style="color:var(--teal);font-weight:600;border-bottom:1px dashed currentColor;text-decoration:none">${locale === 'es' ? 'Pídelo con Menu Drop-In →' : 'Get it built — Menu Drop-In →'}</a></p>
  </section>
${groupBlocks}${orphanBlock}
</div>
</main>
<footer class="site-footer" id="footer"></footer>
<script src="/assets/site.js?v=20260430-cohesion" defer></script>
</body>
</html>
`;
}

// ---- Write or check ------------------------------------------------
const targets = [
  { locale: 'en', path: 'library/menu-design-themes/index.html'   },
  { locale: 'es', path: 'es/library/menu-design-themes/index.html' }
];

let drift = 0;
for (const tgt of targets) {
  const out = emitPage(tgt.locale);
  const fullPath = path.join(repoRoot, tgt.path);
  const dirPath  = path.dirname(fullPath);
  if (checkMode) {
    const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : null;
    if (normalizeBatchBanner(existing || "") !== normalizeBatchBanner(out)) {
      drift++;
      console.log(`would update ${tgt.path}`);
    }
  } else {
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(fullPath, out);
    console.log(`wrote ${tgt.path} (${out.length} bytes)`);
  }
}

if (checkMode) {
  if (drift > 0) {
    console.log(`Themes review-board: would update ${drift} file(s).`);
    console.log('Run: node scripts/build-themes-review-board.mjs');
    process.exit(1);
  } else {
    console.log('Themes review-board (idem): would update 0 file(s).');
  }
} else {
  console.log(`Themes review-board: ${themeIds.length} themes, ${targets.length} pages.`);
}
