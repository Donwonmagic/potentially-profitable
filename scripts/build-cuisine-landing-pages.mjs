#!/usr/bin/env node
/**
 * Wave B13 — Cuisine landing-page generator.
 *
 * Emits per-cuisine landing pages at /library/menu-design-cuisines/<slug>/
 * (and ES mirror) from the themes.js + theme-credits.js data the
 * tool already ships.
 *
 * Each page lists the themes whose cuisineHint matches the cuisine
 * bucket, with the same card UI as /library/menu-design-themes/.
 * Operators searching "italian restaurant menu template" or
 * "menu para taqueria" land on a curated page that says: here are
 * the themes built for your cuisine, with deeplinks straight into
 * the editor.
 *
 * Cuisine buckets are defined here (10 buckets × 2 locales = 20 pages).
 *
 * Modes:
 *   node scripts/build-cuisine-landing-pages.mjs           # write
 *   node scripts/build-cuisine-landing-pages.mjs --check   # diff-only;
 *                                                            exit 1 on drift
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

// ---- Cuisine buckets ------------------------------------------------
// Each bucket: slug + matchers (regex against cuisineHint strings) +
// label_en/es + lede_en/es. Buckets are deliberately broader than the
// individual cuisineHint tags so a single page covers a meaningful
// search-intent surface.
const CUISINES = [
  {
    slug: 'italian',
    label_en: 'Italian restaurant menu templates',
    label_es: 'Plantillas de menú italiano',
    matchers: [/italian|italiana|trattor|pasta|pizza|pizzeria|osteria/i],
    lede_en: 'From neighborhood trattorias to slice-counter pizzerias to formal Italian dining rooms — here are the themes the Menu Design Suite ships for Italian cuisine. Each one is operator-grade, accessible, and free.',
    lede_es: 'Desde trattorias de barrio hasta pizzerías de mostrador hasta comedores italianos formales — estos son los temas que Menu Design Suite trae para cocina italiana. Cada uno es operativo, accesible y gratis.'
  },
  {
    slug: 'mexican',
    label_en: 'Mexican restaurant menu templates',
    label_es: 'Plantillas de menú mexicano',
    matchers: [/mexic|taco|cantina|taquer|tex-mex|cevich/i],
    lede_en: 'Mexico City taquerias, Tex-Mex cantinas, regional Mexican cuisine — the themes built for Mexican-cuisine operators. Bilingual EN+ES, allergen-aware, no signup.',
    lede_es: 'Taquerías chilangas, cantinas tex-mex, cocinas regionales mexicanas — los temas hechos para operadores de cocina mexicana. Bilingüe EN+ES, con alérgenos, sin registro.'
  },
  {
    slug: 'asian',
    label_en: 'Asian restaurant menu templates',
    label_es: 'Plantillas de menú asiático',
    matchers: [/asian|thai|viet|kor|chin|japan|noodle|ramen|sushi|izakaya|dim sum|pho/i],
    lede_en: 'Pan-Asian, ramen counters, dim sum parlors, izakaya pubs, KBBQ tabletop grills, modern fusion — every theme the suite ships for Asian cuisines. Each respects the cultural register of the cuisine.',
    lede_es: 'Pan-asiático, mostradores de ramen, dim sum, izakayas, parrillas KBBQ de mesa, fusión moderna — todos los temas para cocinas asiáticas. Cada uno respeta el registro cultural de la cocina.'
  },
  {
    slug: 'french-bistro',
    label_en: 'French bistro menu templates',
    label_es: 'Plantillas de menú bistró francés',
    matchers: [/french|francesa|brasser|bistro/i],
    lede_en: 'Brasseries, small Paris bistros, modern bistros run by French-trained chefs. The themes Menu Design Suite ships for the French dining tradition.',
    lede_es: 'Brasseries, pequeños bistrós parisinos, bistrós modernos dirigidos por chefs formados en Francia. Los temas para la tradición gastronómica francesa.'
  },
  {
    slug: 'american-bbq',
    label_en: 'American BBQ + steakhouse menu templates',
    label_es: 'Plantillas de menú BBQ + parrilla',
    matchers: [/steak|chop|parr|asad|bbq|barbec|smoke|brisket|brewpub|grill/i],
    lede_en: 'Texas BBQ joints, Carolina pulled-pork spots, classic American steakhouses, brewpubs. The themes built for live-fire cooking and big-protein menus.',
    lede_es: 'Restaurantes de BBQ texanos, lugares de pulled pork de Carolina, parrillas americanas clásicas, brewpubs. Los temas para cocina al fuego y menús de proteína.'
  },
  {
    slug: 'seafood',
    label_en: 'Seafood + raw bar menu templates',
    label_es: 'Plantillas de menú de mariscos',
    matchers: [/seafood|oyster|fish|maris|pesc|raw bar|cevich|peruvian|nikkei/i],
    lede_en: 'Oyster bars, New England seafood houses, Spanish marisquerías, Peruvian cevicherias, Nikkei restaurants. The themes for seafood-forward menus.',
    lede_es: 'Barras de ostras, casas de mariscos de Nueva Inglaterra, marisquerías españolas, cevicherias peruanas, restaurantes Nikkei. Los temas para menús de mariscos.'
  },
  {
    slug: 'cafe-bakery',
    label_en: 'Cafe + bakery menu templates',
    label_es: 'Plantillas de menú café + panadería',
    matchers: [/cafe|café|coffee|bakery|panaderia|panadería|patisserie|breakfast|pastry/i],
    lede_en: 'Third-wave coffee shops, French viennoiserie counters, morning bakeries, dessert-only patisseries. The themes for the cafe + pastry universe.',
    lede_es: 'Cafés de tercera ola, mostradores de viennoiserie franceses, panaderías de la mañana, patisseries solo de postres. Los temas para café + repostería.'
  },
  {
    slug: 'food-truck',
    label_en: 'Food truck + ghost kitchen menu templates',
    label_es: 'Plantillas de menú food truck + ghost kitchen',
    matchers: [/food truck|ghost kitchen|pop-up|street food|truck|deli|appetiz|bagel/i],
    lede_en: 'Food trucks, ghost kitchens, pop-up stalls, deli counters, bagel shops with above-counter pricing cards. The themes built for menus that are also signage.',
    lede_es: 'Food trucks, cocinas fantasma, puestos pop-up, mostradores de deli, panaderías de bagels. Los temas para menús que también son señalización.'
  },
  {
    slug: 'vegan-plant-forward',
    label_en: 'Vegan + plant-forward menu templates',
    label_es: 'Plantillas de menú vegano + plant-forward',
    matchers: [/farm|garden|plant|seasonal|vegan|vegetarian|vegano/i],
    lede_en: 'Plant-forward restaurants, farm-to-table places, vegan tasting menus, vegetarian-by-default kitchens. The themes built for plant-driven menus where dish names do the heavy lifting.',
    lede_es: 'Restaurantes plant-forward, lugares farm-to-table, menús de degustación veganos, cocinas vegetarianas. Los temas para menús de origen vegetal.'
  },
  {
    slug: 'specialty-bar-tasting',
    label_en: 'Wine bar + tasting menu + cocktail menu templates',
    label_es: 'Plantillas de menú para barra de vinos + degustación + cócteles',
    matchers: [/wine|tasting|degustation|prix.fixe|prix-fixe|cocktail|chef counter|chef's counter|chefs counter|sake|izakaya|omakase|hotel/i],
    lede_en: 'Formal wine lists, tasting / omakase counters, cocktail-deco bars, prix-fixe chef\'s counters, hotel F&B in-room dining. The themes built for the high-touch end of the dining spectrum.',
    lede_es: 'Listas de vinos formales, barras de degustación / omakase, bares de cócteles, prix-fixe en mostrador del chef, F&B de hotel en habitación. Los temas para el extremo más cuidado del espectro gastronómico.'
  }
];

// ---- Helpers --------------------------------------------------------
function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function themesForCuisine(matchers) {
  return THEMES.list().filter(id => {
    const t = THEMES.get(id);
    if (!t || !Array.isArray(t.cuisineHint)) return false;
    return t.cuisineHint.some(hint =>
      matchers.some(re => re.test(hint))
    );
  });
}

function swatchHtml(theme) {
  const colors = [theme.paper, theme.ink, theme.accent, theme.muted];
  return colors.map(c =>
    `<span class="md-c-swatch" style="background:${escHtml(c)}" aria-hidden="true"></span>`
  ).join('');
}

function emitThemeCard(themeId, locale) {
  const t = THEMES.get(themeId);
  const c = CREDITS.get(themeId);
  if (!t) return '';
  const label = locale === 'es' ? t.label_es : t.label_en;
  const blurb = locale === 'es' ? t.blurb_es : t.blurb_en;
  const tryHref = locale === 'es'
    ? `/es/library/menu-design-themes/${themeId}/`
    : `/library/menu-design-themes/${themeId}/`;
  const tryLabel = locale === 'es' ? 'Leer la historia del tema →' : 'Read the theme story →';
  const reviewerLine = c
    ? `<p class="md-c-card-meta">${locale === 'es' ? 'Revisado por' : 'Reviewed by'} ${escHtml(c.reviewedBy)} · ${escHtml(c.dateAdded)}</p>`
    : '';
  return `
      <article class="md-c-card">
        <header class="md-c-card-head">
          <h3 class="md-c-name">${escHtml(label)}</h3>
          <div class="md-c-swatches" aria-label="${escHtml(label)} palette">${swatchHtml(t)}</div>
        </header>
        <p class="md-c-blurb">${escHtml(blurb)}</p>
        ${reviewerLine}
        <p class="md-c-cta"><a href="${escHtml(tryHref)}">${tryLabel}</a></p>
      </article>`;
}

function emitJsonLd(cuisine, themeIds, locale) {
  const baseUrl = locale === 'es'
    ? `https://muntin.digital/es/library/menu-design-cuisines/${cuisine.slug}/`
    : `https://muntin.digital/library/menu-design-cuisines/${cuisine.slug}/`;
  const label = locale === 'es' ? cuisine.label_es : cuisine.label_en;
  const lede  = locale === 'es' ? cuisine.lede_es  : cuisine.lede_en;
  const items = themeIds.map((id, i) => {
    const t = THEMES.get(id);
    const c = CREDITS.get(id);
    if (!t) return null;
    const tlabel = locale === 'es' ? t.label_es : t.label_en;
    return {
      '@type': 'ListItem',
      'position': i + 1,
      'item': {
        '@type': 'CreativeWork',
        '@id': baseUrl + '#theme-' + id,
        'name': tlabel,
        'description': locale === 'es' ? t.blurb_es : t.blurb_en,
        ...(c ? { 'creator': { '@type': 'Person', 'name': c.reviewedBy } } : {}),
        ...(c ? { 'dateCreated': c.dateAdded } : {}),
        'inLanguage': locale === 'es' ? 'es' : 'en'
      }
    };
  }).filter(Boolean);
  const breadcrumb = locale === 'es'
    ? [
        { '@type': 'ListItem', 'position': 1, 'name': 'Muntin Digital', 'item': 'https://muntin.digital/es/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'Biblioteca',     'item': 'https://muntin.digital/es/library/' },
        { '@type': 'ListItem', 'position': 3, 'name': 'Menús por cocina', 'item': 'https://muntin.digital/es/library/menu-design-cuisines/' },
        { '@type': 'ListItem', 'position': 4, 'name': label, 'item': baseUrl }
      ]
    : [
        { '@type': 'ListItem', 'position': 1, 'name': 'Muntin Digital', 'item': 'https://muntin.digital/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'Library',        'item': 'https://muntin.digital/library/' },
        { '@type': 'ListItem', 'position': 3, 'name': 'Menu templates by cuisine', 'item': 'https://muntin.digital/library/menu-design-cuisines/' },
        { '@type': 'ListItem', 'position': 4, 'name': label, 'item': baseUrl }
      ];
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': baseUrl + '#webpage',
        'name': label,
        'description': lede,
        'url': baseUrl,
        'inLanguage': locale === 'es' ? 'es-US' : 'en-US',
        'isPartOf': { '@id': 'https://muntin.digital/#website' },
        'publisher': { '@id': 'https://muntin.digital/#business' }
      },
      { '@type': 'ItemList', 'numberOfItems': items.length, 'itemListElement': items },
      { '@type': 'BreadcrumbList', 'itemListElement': breadcrumb }
    ]
  });
}

function emitCuisinePage(cuisine, locale) {
  const lang = locale === 'es' ? 'es' : 'en';
  const label = locale === 'es' ? cuisine.label_es : cuisine.label_en;
  const lede  = locale === 'es' ? cuisine.lede_es  : cuisine.lede_en;
  const themeIds = themesForCuisine(cuisine.matchers);
  const cardsHtml = themeIds.map(id => emitThemeCard(id, locale)).join('\n');
  const baseSlash = locale === 'es' ? '/es' : '';
  const breadcrumbHome = locale === 'es' ? 'Inicio' : 'Home';
  const breadcrumbLib  = locale === 'es' ? 'Biblioteca' : 'Library';
  const breadcrumbHub  = locale === 'es' ? 'Menús por cocina' : 'Menu templates by cuisine';
  const noneStr = locale === 'es'
    ? 'Ningún tema coincide con esta cocina aún. Si necesitas uno, escribe a don@muntin.digital.'
    : 'No themes match this cuisine yet. If you need one, email don@muntin.digital.';
  const intro2 = locale === 'es'
    ? `<strong>${themeIds.length}</strong> tema${themeIds.length === 1 ? '' : 's'} coinciden con esta cocina. Cada uno trae paleta, tipografía, ornamentos y dimensiones de papel pensadas para el oficio. Toca un tema para abrir el editor con ese tema preseleccionado.`
    : `<strong>${themeIds.length}</strong> theme${themeIds.length === 1 ? '' : 's'} match this cuisine. Each one ships with palette, typography, ornaments, and paper dimensions tuned for the trade. Click a theme to open the editor with it pre-selected.`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<title>${escHtml(label)} | Muntin Digital</title>
<meta name="description" content="${escHtml(lede)}" />
<meta name="theme-color" content="#1F4E5B" />
<link rel="canonical" href="https://muntin.digital${baseSlash}/library/menu-design-cuisines/${cuisine.slug}/" />
<link rel="alternate" hreflang="en" href="https://muntin.digital/library/menu-design-cuisines/${cuisine.slug}/" />
<link rel="alternate" hreflang="es" href="https://muntin.digital/es/library/menu-design-cuisines/${cuisine.slug}/" />
<link rel="alternate" hreflang="x-default" href="https://muntin.digital/library/menu-design-cuisines/${cuisine.slug}/" />
<meta property="og:locale" content="${locale === 'es' ? 'es_US' : 'en_US'}" />
<meta property="og:locale:alternate" content="${locale === 'es' ? 'en_US' : 'es_US'}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escHtml(label)}" />
<meta property="og:description" content="${escHtml(lede)}" />
<meta property="og:url" content="https://muntin.digital${baseSlash}/library/menu-design-cuisines/${cuisine.slug}/" />
<meta property="og:site_name" content="Muntin Digital" />
<link rel="icon" type="image/svg+xml" sizes="any" href="/brand/mark/mark-square-ink.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/brand/favicons/android-chrome-192x192.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/brand/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/brand/favicons/site.webmanifest" />
<script type="application/ld+json">${emitJsonLd(cuisine, themeIds, locale)}</script>
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
</style>
<!-- Async-load the main stylesheet. Pattern: preload + onload-swap
     (with a <noscript> fallback for the JS-disabled path). The
     onload assigns this.rel='stylesheet', which the browser then
     applies; before that the critical CSS above carries the page. -->
<link rel="preload" as="style" href="/assets/site-core.css?v=${SHELL_HASH.core}" onload="this.onload=null;this.rel='stylesheet'">
<link rel="preload" as="style" href="/assets/site-article.css?v=${SHELL_HASH.article}" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/assets/site-core.css?v=${SHELL_HASH.core}"><link rel="stylesheet" href="/assets/site-article.css?v=${SHELL_HASH.article}"></noscript>
<style>
.md-c-hero{padding:48px 0 24px;border-bottom:1px solid var(--line)}
.md-c-hero h1{font-family:var(--font-display);font-size:clamp(28px,4vw,40px);font-weight:500;line-height:1.15;color:var(--ink);margin:0 0 12px}
.md-c-hero-lede{font-size:17px;line-height:1.6;color:var(--ink-soft);margin:0;max-width:720px}
.md-c-intro{margin:32px auto;max-width:720px;font-size:15px;line-height:1.65;color:var(--ink-soft)}
.md-c-grid{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));margin:32px 0}
.md-c-card{padding:18px 20px;background:var(--white);border:1px solid var(--line);border-radius:10px}
.md-c-card-head{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.md-c-name{font-family:var(--font-display);font-size:18px;font-weight:500;color:var(--ink);margin:0}
.md-c-swatches{display:flex;gap:4px}
.md-c-swatch{display:inline-block;width:18px;height:18px;border-radius:3px;border:1px solid var(--line)}
.md-c-blurb{font-size:13.5px;line-height:1.5;color:var(--ink);margin:0 0 8px}
.md-c-card-meta{font-size:11.5px;color:var(--ink-soft);margin:0 0 10px}
.md-c-cta{margin:14px 0 0}
.md-c-cta a{color:var(--teal);text-decoration:none;border-bottom:1px dashed currentColor;font-size:13px;font-weight:600}
.md-c-cta a:hover{color:var(--ink)}
.breadcrumb{font-size:13px;color:var(--ink-soft);margin:24px 0 0}
.breadcrumb a{color:var(--ink-soft);text-decoration:none;border-bottom:1px dashed currentColor}
.breadcrumb a:hover{color:var(--teal)}
.md-c-footer{margin-top:48px;padding-top:24px;border-top:1px solid var(--line);font-size:14px;line-height:1.6;color:var(--ink-soft)}
.md-c-footer a{color:var(--teal);text-decoration:none;border-bottom:1px dashed currentColor;font-weight:600}
</style>
</head>
<body>
<a class="skip-link" href="#main">${locale === 'es' ? 'Saltar al contenido' : 'Skip to content'}</a>
<!-- batch-banner:start --><!-- batch-banner:end -->
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
    <a href="${baseSlash}/library/menu-design-cuisines/">${breadcrumbHub}</a> ›
    ${escHtml(label)}
  </p>
  <section class="md-c-hero">
    <h1>${escHtml(label)}</h1>
    <p class="md-c-hero-lede">${escHtml(lede)}</p>
  </section>
  <section class="md-c-intro">
    <p>${intro2}</p>
  </section>
  <section class="md-c-grid">${cardsHtml || ('<p>' + escHtml(noneStr) + '</p>')}
  </section>
  <section class="md-c-footer">
    <p>${locale === 'es'
        ? '¿Quieres ver todos los 37 temas con su revisor y la cocina que los inspiró?'
        : 'Want to see all 37 themes with their reviewer and the cuisine that inspired each?'}
       <a href="${baseSlash}/library/menu-design-themes/">${locale === 'es' ? 'Ver la mesa de revisión completa →' : 'See the full review board →'}</a></p>
    <p>${locale === 'es'
        ? '¿Quieres que construyamos tu menú?'
        : 'Want it built for you?'}
       <a href="${baseSlash}/services/menu-drop-in/">${locale === 'es' ? 'Pídelo con Menu Drop-In →' : 'Get it built — Menu Drop-In →'}</a></p>
  </section>
</div>
</main>
<footer class="site-footer" id="footer"></footer>
<script src="/assets/site.js?v=20260430-cohesion" defer></script>
</body>
</html>
`;
}

function emitHubPage(locale) {
  const lang = locale === 'es' ? 'es' : 'en';
  const baseSlash = locale === 'es' ? '/es' : '';
  const titleStr = locale === 'es'
    ? 'Plantillas de menú por cocina | Muntin Digital'
    : 'Menu templates by cuisine | Muntin Digital';
  const descStr = locale === 'es'
    ? 'Diez páginas de cocina, cada una listando los temas que el Menu Design Suite trae para esa tradición culinaria. De italiano a peruano-coastal a izakaya-late-night.'
    : 'Ten cuisine pages, each listing the themes Menu Design Suite ships for that culinary tradition. From Italian to Peruvian-coastal to izakaya late-night.';
  const heroH1 = locale === 'es' ? 'Menús por cocina' : 'Menu templates by cuisine';
  const heroLede = locale === 'es'
    ? 'Diez páginas curadas. Cada cocina lista los temas Menu Design Suite construidos para ella, con la paleta, la tipografía y los ornamentos que respetan el registro cultural del oficio.'
    : 'Ten curated pages. Each cuisine lists the Menu Design Suite themes built for it, with the palette, typography, and ornaments that respect the cultural register of the trade.';
  const cuisineCards = CUISINES.map(c => {
    const label = locale === 'es' ? c.label_es : c.label_en;
    const lede  = locale === 'es' ? c.lede_es  : c.lede_en;
    const themeIds = themesForCuisine(c.matchers);
    return `
      <article class="md-c-hub-card">
        <h3 class="md-c-hub-card-name"><a href="${baseSlash}/library/menu-design-cuisines/${c.slug}/">${escHtml(label)}</a></h3>
        <p class="md-c-hub-card-lede">${escHtml(lede.slice(0, 140))}…</p>
        <p class="md-c-hub-card-count">${themeIds.length} ${locale === 'es' ? (themeIds.length === 1 ? 'tema' : 'temas') : (themeIds.length === 1 ? 'theme' : 'themes')}</p>
      </article>`;
  }).join('\n');
  const breadcrumbHome = locale === 'es' ? 'Inicio' : 'Home';
  const breadcrumbLib  = locale === 'es' ? 'Biblioteca' : 'Library';
  const breadcrumbThis = locale === 'es' ? 'Menús por cocina' : 'Menu templates by cuisine';
  const baseUrlEN = 'https://muntin.digital/library/menu-design-cuisines/';
  const baseUrlES = 'https://muntin.digital/es/library/menu-design-cuisines/';
  const baseUrl = locale === 'es' ? baseUrlES : baseUrlEN;
  const itemsLd = CUISINES.map((c, i) => ({
    '@type': 'ListItem',
    'position': i + 1,
    'item': {
      '@type': 'CollectionPage',
      'name': locale === 'es' ? c.label_es : c.label_en,
      'url': (locale === 'es' ? baseUrlES : baseUrlEN) + c.slug + '/'
    }
  }));
  const ldJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': baseUrl + '#webpage',
        'name': heroH1,
        'description': heroLede,
        'url': baseUrl,
        'inLanguage': locale === 'es' ? 'es-US' : 'en-US',
        'isPartOf': { '@id': 'https://muntin.digital/#website' },
        'publisher': { '@id': 'https://muntin.digital/#business' }
      },
      { '@type': 'ItemList', 'numberOfItems': itemsLd.length, 'itemListElement': itemsLd },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': locale === 'es' ? [
          { '@type': 'ListItem', 'position': 1, 'name': 'Muntin Digital', 'item': 'https://muntin.digital/es/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Biblioteca',     'item': 'https://muntin.digital/es/library/' },
          { '@type': 'ListItem', 'position': 3, 'name': breadcrumbThis,   'item': baseUrl }
        ] : [
          { '@type': 'ListItem', 'position': 1, 'name': 'Muntin Digital', 'item': 'https://muntin.digital/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Library',        'item': 'https://muntin.digital/library/' },
          { '@type': 'ListItem', 'position': 3, 'name': breadcrumbThis,   'item': baseUrl }
        ]
      }
    ]
  });
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<title>${escHtml(titleStr)}</title>
<meta name="description" content="${escHtml(descStr)}" />
<meta name="theme-color" content="#1F4E5B" />
<link rel="canonical" href="${baseUrl}" />
<link rel="alternate" hreflang="en" href="${baseUrlEN}" />
<link rel="alternate" hreflang="es" href="${baseUrlES}" />
<link rel="alternate" hreflang="x-default" href="${baseUrlEN}" />
<meta property="og:locale" content="${locale === 'es' ? 'es_US' : 'en_US'}" />
<meta property="og:locale:alternate" content="${locale === 'es' ? 'en_US' : 'es_US'}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escHtml(heroH1)}" />
<meta property="og:description" content="${escHtml(descStr)}" />
<meta property="og:url" content="${baseUrl}" />
<meta property="og:site_name" content="Muntin Digital" />
<link rel="icon" type="image/svg+xml" sizes="any" href="/brand/mark/mark-square-ink.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/brand/favicons/android-chrome-192x192.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/brand/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/brand/favicons/site.webmanifest" />
<script type="application/ld+json">${ldJson}</script>
<link rel="stylesheet" href="/assets/site.css" />
<style>
.md-c-hero{padding:48px 0 24px;border-bottom:1px solid var(--line)}
.md-c-hero h1{font-family:var(--font-display);font-size:clamp(28px,4vw,40px);font-weight:500;line-height:1.15;color:var(--ink);margin:0 0 12px}
.md-c-hero-lede{font-size:17px;line-height:1.6;color:var(--ink-soft);margin:0;max-width:720px}
.md-c-hub-grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));margin:32px 0}
.md-c-hub-card{padding:18px 20px;background:var(--white);border:1px solid var(--line);border-radius:10px}
.md-c-hub-card-name{font-family:var(--font-display);font-size:18px;font-weight:500;margin:0 0 6px}
.md-c-hub-card-name a{color:var(--ink);text-decoration:none;border-bottom:1px dashed transparent}
.md-c-hub-card-name a:hover{color:var(--teal);border-bottom-color:currentColor}
.md-c-hub-card-lede{font-size:13px;line-height:1.5;color:var(--ink-soft);margin:0 0 8px}
.md-c-hub-card-count{font-size:11.5px;color:var(--teal);font-weight:600;letter-spacing:.04em;margin:0;text-transform:uppercase}
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
    ${breadcrumbThis}
  </p>
  <section class="md-c-hero">
    <h1>${escHtml(heroH1)}</h1>
    <p class="md-c-hero-lede">${escHtml(heroLede)}</p>
  </section>
  <section class="md-c-hub-grid">${cuisineCards}
  </section>
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
for (const cuisine of CUISINES) {
  targets.push({ path: `library/menu-design-cuisines/${cuisine.slug}/index.html`, content: emitCuisinePage(cuisine, 'en') });
  targets.push({ path: `es/library/menu-design-cuisines/${cuisine.slug}/index.html`, content: emitCuisinePage(cuisine, 'es') });
}
targets.push({ path: 'library/menu-design-cuisines/index.html', content: emitHubPage('en') });
targets.push({ path: 'es/library/menu-design-cuisines/index.html', content: emitHubPage('es') });

let drift = 0;
for (const tgt of targets) {
  const fullPath = path.join(repoRoot, tgt.path);
  const dirPath  = path.dirname(fullPath);
  if (checkMode) {
    const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : null;
    if (normalizeBatchBanner(existing || "") !== normalizeBatchBanner(tgt.content)) {
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
    console.log(`Cuisine landing pages: would update ${drift} file(s).`);
    console.log('Run: node scripts/build-cuisine-landing-pages.mjs');
    process.exit(1);
  } else {
    console.log('Cuisine landing pages (idem): would update 0 file(s).');
  }
} else {
  console.log(`Cuisine landing pages: ${CUISINES.length} cuisines × 2 locales + 2 hubs = ${targets.length} pages.`);
}
