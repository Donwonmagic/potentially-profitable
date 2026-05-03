#!/usr/bin/env node
/**
 * Operator Sheets — per-slug page generator.
 *
 * Reads:
 *   - data/sheets.json                       (single source of truth)
 *   - data/sheets.es.json                    (ES prose: titles, bullets, labels)
 *   - data/tools.json                        (for pairs-with link resolution)
 *   - _includes/sheet-shell.html             (shared template)
 *   - scripts/sheets-fragments/<slug>.html   (per-slug form fragment)
 *
 * Writes one page per sheet whose status === "live":
 *   - sheets/<slug>/index.html               (EN)
 *   - es/sheets/<slug>/index.html            (ES)
 *
 * Build ordering matters: this script MUST run BEFORE any inject-*
 * script that links INTO sheet URLs. See wrangler.jsonc build.command
 * for the canonical sequence.
 *
 * Usage:
 *   node scripts/build-sheet-pages.mjs           # rewrite in place
 *   node scripts/build-sheet-pages.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SHEETS    = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'sheets.json'), 'utf8'));
const SHEETS_ES = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'sheets.es.json'), 'utf8'));
const TOOLS     = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'tools.json'), 'utf8'));
const SHELL     = fs.readFileSync(path.join(REPO, '_includes', 'sheet-shell.html'), 'utf8');

const LABELS = {
  en: {
    skipToMain: 'Skip to main content',
    breadcrumb: 'Breadcrumb',
    home: 'Home',
    sheets: 'Sheets',
    eyebrow: 'Free operator sheet · Stays in your browser',
    pack: 'Pack',
    cadence: 'Cadence',
    private: 'Private — runs in your browser',
    fillItIn: 'Fill it in',
    sheetIntro: 'Type your numbers — the math runs in your browser. Print it, save it as a CSV, or save it to your Workshop.',
    actions: 'Sheet actions',
    print: 'Print',
    downloadCsv: 'Download CSV',
    copy: 'Copy as text',
    reset: 'Reset',
    savePrompt: 'Save this sheet to your Workshop so you can pull it up next month.',
    saveToWorkbench: 'Save to the Workshop',
    whenToUse: 'When to use it',
    whenToUseHeading: 'Pull this sheet out when —',
    commonMistakes: 'Common mistakes',
    mistakesHeading: 'What operators get wrong',
    pairsWithEyebrow: 'Pairs with',
    pairsWithHeading: 'The tools, terms, and articles this sheet sits next to.',
    pairsTools: 'Tools',
    pairsGlossary: 'Glossary',
    pairsBlog: 'Reading',
    pairsEmpty: 'None yet.',
    runsInBrowser: 'Free, no signup. Your numbers never leave this page.',
    metaLabel: 'Sheet meta',
    sheetsHubUrl: '/sheets/',
    localeHome: '/',
    keyboardHint: 'Keyboard: <kbd>⌘P</kbd> print · <kbd>⌘S</kbd> download CSV · <kbd>⌘↵</kbd> save to Workshop',
  },
  es: {
    skipToMain: 'Saltar al contenido principal',
    breadcrumb: 'Migas de pan',
    home: 'Inicio',
    sheets: 'Hojas',
    eyebrow: 'Hoja gratis del operador · Se queda en tu navegador',
    pack: 'Paquete',
    cadence: 'Cadencia',
    private: 'Privado — corre en tu navegador',
    fillItIn: 'Llénala',
    sheetIntro: 'Mete tus números — la matemática corre en tu navegador. Imprime, exporta a CSV o guárdala en el Taller.',
    actions: 'Acciones de la hoja',
    print: 'Imprimir',
    downloadCsv: 'Bajar CSV',
    copy: 'Copiar como texto',
    reset: 'Reiniciar',
    savePrompt: 'Guarda esta hoja en tu Taller para volver a abrirla el próximo mes.',
    saveToWorkbench: 'Guardar en el Taller',
    whenToUse: 'Cuándo usarla',
    whenToUseHeading: 'Saca esta hoja cuando —',
    commonMistakes: 'Errores comunes',
    mistakesHeading: 'Lo que los operadores hacen mal',
    pairsWithEyebrow: 'Va con',
    pairsWithHeading: 'Las herramientas, términos y artículos al lado de esta hoja.',
    pairsTools: 'Herramientas',
    pairsGlossary: 'Glosario',
    pairsBlog: 'Lectura',
    pairsEmpty: 'Aún ninguno.',
    runsInBrowser: 'Gratis, sin registro. Tus números nunca dejan esta página.',
    metaLabel: 'Metadatos de la hoja',
    sheetsHubUrl: '/es/sheets/',
    localeHome: '/es/',
    keyboardHint: 'Teclado: <kbd>⌘P</kbd> imprimir · <kbd>⌘S</kbd> bajar CSV · <kbd>⌘↵</kbd> guardar en el Taller',
  },
};

// Per-pack glyph for the hero eyebrow. Reuses the existing GLYPHS
// vocabulary in scripts/build-og-cards.mjs; values here are inline
// SVG path d-strokes (the build-og-cards file has the prose
// reference). Keeping a small mirror locally avoids importing the
// renderer and keeps the build script Node-pure.
const PACK_GLYPHS = {
  'operations-margin': '<rect x="3.5" y="3.5" width="6" height="6" rx="0.5"/><rect x="14.5" y="14.5" width="6" height="6" rx="0.5"/><line x1="20" y1="4" x2="4" y2="20"/>',
  'local-seo':         '<path d="M12 22 C7 16 4 12 4 9 a8 8 0 0 1 16 0 c0 3 -3 7 -8 13 z"/><circle cx="12" cy="9" r="2.5"/>',
  'conversions':       '<line x1="4" y1="6" x2="20" y2="6"/><line x1="6" y1="11" x2="18" y2="11"/><line x1="9" y1="16" x2="15" y2="16"/><polyline points="10 19 12 21 14 19"/>',
  'brand-design':      '<rect x="4" y="4" width="16" height="16" rx="1"/><line x1="12" y1="4.5" x2="12" y2="19.5"/><line x1="4.5" y1="10" x2="19.5" y2="10"/>',
  'trust-reviews':     '<path d="M12 3 L20 6 V12 C20 16.5 16.5 19.5 12 21 C7.5 19.5 4 16.5 4 12 V6 Z"/><polyline points="9 12 11.5 14.5 15.5 10"/>',
};

function renderPackGlyph(packId) {
  const paths = PACK_GLYPHS[packId];
  if (!paths) return '';
  return `<span class="sheet-pack-glyph" aria-hidden="true"><svg viewBox="0 0 24 24">${paths}</svg></span>`;
}

function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function escText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function pickI18n(obj, key, locale) {
  return obj[`${key}_${locale}`];
}

// Render the H1 with a graceful italic-tail break if the title has more
// than one word — matches the visual rhythm of the existing tool pages
// (Margin Math, Plate Cost). Single-word titles render plain.
function renderH1(title) {
  const parts = title.split(/\s+/);
  if (parts.length <= 1) return escText(title);
  const tail = parts.slice(-1)[0];
  const head = parts.slice(0, -1).join(' ');
  return `${escText(head)}<br><span class="serif-italic">${escText(tail)}.</span>`;
}

function renderBullets(items) {
  if (!items || !items.length) return '';
  return items.map((b) => `<li>${escText(b)}</li>`).join('\n      ');
}

// Resolve a tool slug to a label and URL using data/tools.json. Falls
// back to a humanized slug if the tool isn't found (queued tools etc).
function resolveTool(slug, locale) {
  const t = TOOLS.tools && TOOLS.tools[slug];
  if (!t) {
    return {
      url: locale === 'es' ? `/es/tools/${slug}/` : `/tools/${slug}/`,
      label: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    };
  }
  return {
    url: pickI18n(t, 'url', locale),
    label: pickI18n(t, 'title', locale),
  };
}

function resolveGlossary(slug, locale) {
  return {
    url: locale === 'es' ? `/es/glossary/${slug}/` : `/glossary/${slug}/`,
    label: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

function resolveBlog(slug, locale) {
  return {
    url: locale === 'es' ? `/es/blog/${slug}/` : `/blog/${slug}/`,
    label: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

function renderPairsCol(headingLabel, items, resolver, locale, emptyLabel) {
  const lis = items && items.length
    ? items.map((s) => {
        const r = resolver(s, locale);
        return `        <li><a href="${escAttr(r.url)}">${escText(r.label)}</a></li>`;
      }).join('\n')
    : `        <li class="sheet-knit-col-empty">${escText(emptyLabel)}</li>`;
  return `<div class="sheet-knit-col">
      <h3>${escText(headingLabel)}</h3>
      <ul>
${lis}
      </ul>
    </div>`;
}

function renderHazardBanner(hazardEnabled, locale) {
  if (!hazardEnabled) return '';
  const notice = SHEETS._locale_hazard_notice[locale];
  const labelTitle = locale === 'es' ? 'Aviso de jurisdicción' : 'Jurisdictional notice';
  return `<aside class="sheet-hazard" role="note" aria-label="${escAttr(labelTitle)}">
    <strong>${escText(labelTitle)}:</strong> ${escText(notice)}
  </aside>`;
}

function buildSchema(sheet, locale) {
  const title = pickI18n(sheet, 'title', locale);
  const summary = pickI18n(sheet, 'summary', locale);
  const url = locale === 'es' ? sheet.url_es : sheet.url_en;
  const inLanguage = locale === 'es' ? 'es' : 'en';
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `https://muntin.digital${url}#sheet`,
        name: title,
        description: summary,
        url: `https://muntin.digital${url}`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        inLanguage: [inLanguage],
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        creator: { '@id': 'https://muntin.digital/#business' },
      },
    ],
  });
}

function findPack(packId) {
  return SHEETS.packs.find((p) => p.id === packId);
}

function buildPage(slug, locale) {
  const sheet = SHEETS.sheets[slug];
  if (!sheet || sheet.status !== 'live') return null;

  const labels = LABELS[locale];
  const isEs = locale === 'es';
  const url     = isEs ? sheet.url_es : sheet.url_en;
  const altUrl  = isEs ? sheet.url_en : sheet.url_es;
  const title   = pickI18n(sheet, 'title', locale);
  const summary = pickI18n(sheet, 'summary', locale);
  const cadence = pickI18n(sheet, 'cadence', locale);
  const pack    = findPack(sheet.pack);
  const packLabel = pack ? pickI18n(pack, 'label', locale) : sheet.pack;

  // Per-sheet ES prose (when_to_use, mistakes) lives in sheets.es.json;
  // EN prose lives inside data/sheets.json directly.
  let whenToUse = [];
  let mistakes  = [];
  if (locale === 'en') {
    whenToUse = sheet.when_to_use_en || [];
    mistakes  = sheet.mistakes_en || [];
  } else {
    const esEntry = SHEETS_ES.sheets && SHEETS_ES.sheets[slug];
    if (esEntry) {
      whenToUse = esEntry.when_to_use || sheet.when_to_use_en || [];
      mistakes  = esEntry.mistakes    || sheet.mistakes_en    || [];
    } else {
      whenToUse = sheet.when_to_use_en || [];
      mistakes  = sheet.mistakes_en || [];
    }
  }

  // Per-slug form fragment.
  const fragmentPath = path.join(REPO, 'scripts', 'sheets-fragments', `${slug}.${isEs ? 'es.' : ''}html`);
  const fragmentFallback = path.join(REPO, 'scripts', 'sheets-fragments', `${slug}.html`);
  let fragment;
  if (fs.existsSync(fragmentPath)) {
    fragment = fs.readFileSync(fragmentPath, 'utf8');
  } else if (fs.existsSync(fragmentFallback)) {
    fragment = fs.readFileSync(fragmentFallback, 'utf8');
    if (isEs) {
      // sync-sheets-es will translate inline labels post-build; for now,
      // fall back to EN fragment with a header note.
    }
  } else {
    throw new Error(`No fragment for sheet "${slug}" at ${fragmentPath} or ${fragmentFallback}`);
  }

  const schemaJson = buildSchema(sheet, locale);

  // OG image — per-sheet card synthesized by sync-sheet-og-cards.mjs
  // and rendered by build-og-cards.mjs into brand/og/sheet-<slug>(.es).png.
  // Both must run before build-sheet-pages so the manifest entries
  // exist; check-og-images verifies the file is on disk at build time.
  const ogImage = isEs ? `/brand/og/sheet-${slug}-es.png` : `/brand/og/sheet-${slug}.png`;

  const pairsToolsHtml = renderPairsCol(labels.pairsTools, sheet.pairsWith?.tools, resolveTool, locale, labels.pairsEmpty);
  const pairsGlossHtml = renderPairsCol(labels.pairsGlossary, sheet.pairsWith?.glossary, resolveGlossary, locale, labels.pairsEmpty);
  const pairsBlogHtml  = renderPairsCol(labels.pairsBlog, sheet.pairsWith?.blog, resolveBlog, locale, labels.pairsEmpty);

  const headTitle = `${title} — ${labels.sheets} | Muntin Digital`;
  const headDesc  = summary;

  const subs = {
    LOCALE: locale,
    OG_LOCALE: locale === 'es' ? 'es_US' : 'en_US',
    OG_LOCALE_ALT: locale === 'es' ? 'en_US' : 'es_US',
    URL: url,
    URL_EN: sheet.url_en,
    URL_ES: sheet.url_es,
    HEAD_TITLE: escAttr(headTitle),
    HEAD_DESCRIPTION: escAttr(headDesc),
    OG_TITLE: escAttr(`${title} — Muntin Digital`),
    OG_DESCRIPTION: escAttr(headDesc),
    OG_IMAGE: ogImage,
    SCHEMA_JSON: schemaJson,
    SHEET_SLUG: slug,
    PACK_ID: sheet.pack,
    PACK_LABEL: escText(packLabel),
    CADENCE: escText(cadence),
    TITLE: escText(title),
    H1_HTML: renderH1(title),
    SUMMARY: escText(summary),
    SHEETS_HUB_URL: labels.sheetsHubUrl,
    LOCALE_HOME: labels.localeHome,
    LABEL_SKIP_TO_MAIN: escText(labels.skipToMain),
    LABEL_BREADCRUMB: escAttr(labels.breadcrumb),
    LABEL_HOME: escText(labels.home),
    LABEL_SHEETS: escText(labels.sheets),
    LABEL_EYEBROW: escText(labels.eyebrow),
    LABEL_PACK: escText(labels.pack),
    LABEL_CADENCE: escText(labels.cadence),
    LABEL_PRIVATE: escText(labels.private),
    LABEL_FILL_IT_IN: escText(labels.fillItIn),
    LABEL_SHEET_INTRO: escText(labels.sheetIntro),
    LABEL_ACTIONS: escAttr(labels.actions),
    LABEL_PRINT: escText(labels.print),
    LABEL_DOWNLOAD_CSV: escText(labels.downloadCsv),
    LABEL_COPY: escText(labels.copy),
    LABEL_RESET: escText(labels.reset),
    LABEL_SAVE_PROMPT: escText(labels.savePrompt),
    LABEL_SAVE_TO_WORKBENCH: escText(labels.saveToWorkbench),
    LABEL_WHEN_TO_USE: escText(labels.whenToUse),
    WHEN_TO_USE_HEADING: escText(labels.whenToUseHeading),
    WHEN_TO_USE_BULLETS: renderBullets(whenToUse),
    LABEL_COMMON_MISTAKES: escText(labels.commonMistakes),
    MISTAKES_HEADING: escText(labels.mistakesHeading),
    MISTAKES_BULLETS: renderBullets(mistakes),
    LABEL_PAIRS_WITH_EYEBROW: escText(labels.pairsWithEyebrow),
    PAIRS_WITH_HEADING: escText(labels.pairsWithHeading),
    PAIRS_TOOLS_HTML: pairsToolsHtml,
    PAIRS_GLOSSARY_HTML: pairsGlossHtml,
    PAIRS_BLOG_HTML: pairsBlogHtml,
    LABEL_RUNS_IN_BROWSER: escText(labels.runsInBrowser),
    LABEL_META: escAttr(labels.metaLabel),
    LOCALE_HAZARD_BANNER: renderHazardBanner(sheet.es_locale_hazard, locale),
    LABEL_KEYBOARD_HINT: labels.keyboardHint,
    PACK_GLYPH_HTML: renderPackGlyph(sheet.pack),
    FRAGMENT_HTML: fragment,
  };

  let out = SHELL;
  for (const [k, v] of Object.entries(subs)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}

function writeIfChanged(target, content) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const prev = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (prev === content) return false;
  if (!checkOnly) fs.writeFileSync(target, content);
  console.log(`${checkOnly ? 'would write' : 'wrote'}: ${path.relative(REPO, target)}`);
  return true;
}

let changed = 0;
let total = 0;
const liveSlugs = Object.entries(SHEETS.sheets)
  .filter(([, s]) => s.status === 'live')
  .map(([slug]) => slug);

for (const slug of liveSlugs) {
  for (const locale of ['en', 'es']) {
    total++;
    const html = buildPage(slug, locale);
    if (!html) continue;
    const target = locale === 'es'
      ? path.join(REPO, 'es', 'sheets', slug, 'index.html')
      : path.join(REPO, 'sheets', slug, 'index.html');
    if (writeIfChanged(target, html)) changed++;
  }
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of ${total} sheet page(s) (${liveSlugs.length} live slug(s) × 2 locales).`);
if (checkOnly && changed > 0) process.exit(1);
