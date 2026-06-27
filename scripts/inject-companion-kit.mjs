#!/usr/bin/env node
/**
 * Phase 2B (Cohesion) — inject the Companion kit four-corner footer
 * block on every library article, live tool, operator sheet, and
 * curated glossary page. Reads data/cross-surface-map.json as the
 * source of truth (per docs/start-here-canon.md §6).
 *
 * The block carries four columns — Read · Run · Write · Look up —
 * resolved per surface. Titles/deks/read-times are NOT hard-coded
 * in JSON; they are read from each referenced surface's live HTML
 * at injection time so they stay fresh as those pages are edited.
 *
 * Idempotent via the <!-- companion-kit:start -->…<!-- /companion-kit:end -->
 * sentinel pair. Two runs without intervening edits produce a zero
 * diff. --check mode exits 1 on any would-be edit.
 *
 *   node scripts/inject-companion-kit.mjs              # apply
 *   node scripts/inject-companion-kit.mjs --check      # exit 1 on drift
 *   node scripts/inject-companion-kit.mjs --dry-run    # print, no write
 *   node scripts/inject-companion-kit.mjs --surface=library
 *   node scripts/inject-companion-kit.mjs --only=<slug>
 *
 * Safe-range rule: never write a sentinel inside an attribute value.
 * The block contains titles and deks read from the source pages'
 * HTML; the script strips <!-- LIBRARY:autolink:start --> markers
 * before rendering. This protects against the attribute-corruption
 * pattern that check-article-graphics.mjs rule 8 catches.
 *
 * @see docs/start-here-canon.md §6 (canonical HTML + per-surface variations)
 * @see data/cross-surface-map.json (source of truth)
 * @see scripts/check-fabrications.mjs (gate that blocks bio drift)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');

const argv       = process.argv.slice(2);
const checkOnly  = argv.includes('--check');
const dryRun     = argv.includes('--dry-run');
const surfaceArg = (argv.find((a) => a.startsWith('--surface=')) || '').slice('--surface='.length) || null;
const onlySlug   = (argv.find((a) => a.startsWith('--only=')) || '').slice('--only='.length) || null;

// ============================================================
// Paths and overrides
// ============================================================

// Override map for tools that live at a non-canonical path. Empty
// after the 2026-06-26 tools migration retired the restaurant-audit
// page (it lived at tools/audits/restaurant); kept tools are all at
// the canonical tools/<slug> path.
const TOOL_PATHS = {};

function toolDir(slug, locale) {
  const sub = TOOL_PATHS[slug] || `tools/${slug}`;
  return locale === 'en' ? sub : `es/${sub}`;
}

function toolUrl(slug, locale) {
  return '/' + toolDir(slug, locale) + '/';
}

function libraryDir(slug, locale) {
  return locale === 'en' ? `library/${slug}` : `es/library/${slug}`;
}

function libraryUrl(slug, locale) {
  return '/' + libraryDir(slug, locale) + '/';
}

function sheetDir(slug, locale) {
  return locale === 'en' ? `sheets/${slug}` : `es/sheets/${slug}`;
}

function sheetUrl(slug, locale) {
  return '/' + sheetDir(slug, locale) + '/';
}

function glossaryDir(slug, locale) {
  return locale === 'en' ? `glossary/${slug}` : `es/glossary/${slug}`;
}

function glossaryUrl(slug, locale) {
  return '/' + glossaryDir(slug, locale) + '/';
}

// ============================================================
// Data
// ============================================================

const MAP = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'cross-surface-map.json'), 'utf8'));

let SLUG_MAP = {};
try {
  SLUG_MAP = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'i18n-slug-map.json'), 'utf8'));
} catch (_) { /* tolerated */ }
const LIB_SLUG_EN_TO_ES = SLUG_MAP.library || {};

// ============================================================
// HTML helpers
// ============================================================

function escAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Text-node escape. Titles/deks read from live HTML may already
// contain entity-encoded characters (&amp;, &mdash;) — we treat
// the incoming bytes as opaque HTML-safe spans and only re-escape
// raw & / < / > that are NOT already part of a known entity.
function escText(s) {
  return String(s == null ? '' : s)
    .replace(/&(?!(?:[a-z]+|#[0-9]+|#x[0-9a-f]+);)/gi, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Strip every comment marker and tag from a snippet. Used to clean
// title + dek bytes read out of <title> / <meta> attribute values
// where the autolink markers should never have been but the gate
// has historically caught.
function stripTagsAndMarkers(s) {
  if (!s) return '';
  return String(s)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeBasicEntities(s) {
  if (!s) return '';
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// ============================================================
// Read live HTML for title + dek + read-time
// ============================================================

const fileCache = new Map();
function readFile(rel) {
  if (fileCache.has(rel)) return fileCache.get(rel);
  const abs = path.join(REPO, rel);
  if (!fs.existsSync(abs)) { fileCache.set(rel, null); return null; }
  const src = fs.readFileSync(abs, 'utf8');
  fileCache.set(rel, src);
  return src;
}

function getTitle(html) {
  if (!html) return null;
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  let t = stripTagsAndMarkers(m[1]);
  // Strip the site-suffix.
  t = t.replace(/\s*\|\s*Muntin Digital\s*$/i, '');
  return t || null;
}

function getMetaDescription(html) {
  if (!html) return null;
  const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  if (!m) return null;
  return stripTagsAndMarkers(decodeBasicEntities(m[1])) || null;
}

function getReadMinutes(html) {
  if (!html) return null;
  // Eyebrow pattern: " · 12 min read · " (used across the library)
  const m = html.match(/(\d+)\s*min\s*read/i);
  return m ? m[1] : null;
}

// Glossary term display name: prefer the term-h1, fall back to
// the page title with the site-suffix trimmed. Strips embedded
// autolink markers and tags.
function getGlossaryDisplay(html) {
  if (!html) return null;
  const m = html.match(/<h1[^>]*class="[^"]*term-h1[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
  if (m) {
    const t = stripTagsAndMarkers(m[1]);
    if (t) return t;
  }
  return getTitle(html);
}

// ============================================================
// Per-entry resolution: pull live title + dek for the linked surfaces
// ============================================================

const missing = []; // for reporting at the end
function noteMissing(kind, slug, locale) {
  missing.push(`${kind} ${locale}/${slug}`);
}

function resolveArticleCard(slug, locale) {
  // For ES, if no ES slug exists, fall back to the EN slug.
  let esSlug = LIB_SLUG_EN_TO_ES[slug] || slug;
  let useLocale = locale;
  let useSlug = locale === 'en' ? slug : esSlug;
  let rel = libraryDir(useSlug, useLocale) + '/index.html';
  let html = readFile(rel);
  if (!html && locale === 'es') {
    // ES path missing — fall back to EN.
    useLocale = 'en';
    useSlug = slug;
    rel = libraryDir(useSlug, useLocale) + '/index.html';
    html = readFile(rel);
  }
  if (!html) { noteMissing('library', slug, locale); return null; }
  const title = getTitle(html);
  const dek   = getMetaDescription(html);
  const mins  = getReadMinutes(html);
  if (!title) { noteMissing('library', slug, locale); return null; }
  return {
    href:  libraryUrl(useSlug, useLocale),
    title: title,
    dek:   dek || '',
    mins:  mins,
  };
}

function resolveToolCard(slug, locale) {
  // Per the brief: ES tools may exist as standalone files but we
  // skip ES-side tool/sheet rendering. Card always resolves from
  // the EN-side tool path for the EN render, and points to the
  // ES tool URL only if we ever extend ES injection.
  const rel = toolDir(slug, locale) + '/index.html';
  let html = readFile(rel);
  let useLocale = locale;
  if (!html && locale === 'es') {
    useLocale = 'en';
    html = readFile(toolDir(slug, 'en') + '/index.html');
  }
  if (!html) { noteMissing('tool', slug, locale); return null; }
  const title = getTitle(html);
  const dek   = getMetaDescription(html);
  if (!title) { noteMissing('tool', slug, locale); return null; }
  return {
    href:  toolUrl(slug, useLocale),
    title: title,
    dek:   dek || '',
  };
}

function resolveSheetCard(slug, locale) {
  const rel = sheetDir(slug, locale) + '/index.html';
  let html = readFile(rel);
  let useLocale = locale;
  if (!html && locale === 'es') {
    useLocale = 'en';
    html = readFile(sheetDir(slug, 'en') + '/index.html');
  }
  if (!html) { noteMissing('sheet', slug, locale); return null; }
  const title = getTitle(html);
  const dek   = getMetaDescription(html);
  if (!title) { noteMissing('sheet', slug, locale); return null; }
  return {
    href:  sheetUrl(slug, useLocale),
    title: title,
    dek:   dek || '',
  };
}

function resolveGlossaryChip(slug, locale) {
  const rel = glossaryDir(slug, locale) + '/index.html';
  let html = readFile(rel);
  let useLocale = locale;
  if (!html && locale === 'es') {
    useLocale = 'en';
    html = readFile(glossaryDir(slug, 'en') + '/index.html');
  }
  if (!html) { noteMissing('glossary', slug, locale); return null; }
  const display = getGlossaryDisplay(html);
  if (!display) { noteMissing('glossary', slug, locale); return null; }
  return { href: glossaryUrl(slug, useLocale), display };
}

// ============================================================
// Block builder
// ============================================================

function localizedLabels(locale) {
  if (locale === 'es') {
    return {
      eyebrow:  'Las cuatro esquinas',
      heading:  'Lee, corre, anota, busca.',
      read:     'Lee',
      run:      'Corre en tu propio sitio',
      write:    'Anota',
      lookup:   'Busca',
      selfTool:  'Estás en la herramienta. Las otras esquinas te mantienen en movimiento.',
      selfSheet: 'Estás en la hoja. Las otras esquinas te mantienen en movimiento.',
      selfGloss: 'Estás en el término. Las otras esquinas te mantienen en movimiento.',
      articleKind: 'Artículo',
      toolKind:    'Herramienta',
      sheetKind:   'Hoja',
      readMin:     'min de lectura',
    };
  }
  return {
    eyebrow:  'The four corners',
    heading:  'Read, run, write down, look up.',
    read:     'Read',
    run:      'Run on your own site',
    write:    'Write it down',
    lookup:   'Look up',
    selfTool:  "You're on the tool. The other corners keep you moving.",
    selfSheet: "You're on the sheet. The other corners keep you moving.",
    selfGloss: "You're on the term. The other corners keep you moving.",
    articleKind: 'Article',
    toolKind:    'Tool',
    sheetKind:   'Sheet',
    readMin:     'min read',
  };
}

function renderArticleCard(card, kindLabel, readMinLabel) {
  const title = escText(card.title);
  const dek   = escText(card.dek);
  const mins  = card.mins
    ? `<span class="see-also-time">${escText(card.mins)} ${escText(readMinLabel)}</span>`
    : '';
  return [
    `        <li><a class="see-also-card" href="${escAttr(card.href)}">`,
    `          <span class="see-also-kind">${escText(kindLabel)}${mins ? ' ' + mins : ''}</span>`,
    `          <h4>${title}</h4>`,
    `          <p>${dek}</p>`,
    `        </a></li>`,
  ].join('\n');
}

function renderSingleCard(card, kindLabel) {
  if (!card) return '';
  return [
    `        <a class="companion-kit__single see-also-card" href="${escAttr(card.href)}">`,
    `          <span class="see-also-kind">${escText(kindLabel)}</span>`,
    `          <h4>${escText(card.title)}</h4>`,
    `          <p>${escText(card.dek)}</p>`,
    `        </a>`,
  ].join('\n');
}

function renderChip(chip) {
  return `          <li><a class="glossary-chip" href="${escAttr(chip.href)}">${escText(chip.display)}</a></li>`;
}

function renderSelfSentence(text) {
  return `        <p class="companion-kit__self">${escText(text)}</p>`;
}

function buildBlock({ surface, sourceSlug, locale, entry }) {
  const L = localizedLabels(locale);
  const headId = `companion-kit-h-${surface}-${sourceSlug.replace(/[^a-z0-9-]/gi, '-')}`;

  // --- Resolve the four corners ---
  const isSurface = (s) => surface === s;

  // Read corner: 3 related library articles (unless source IS a library article AND we're showing the empty self-corner — but per spec the read corner gets articles even for library source, since the source is one OF many. Wait — re-reading the table:
  //
  // | Source surface | Read | Run | Write | Look up |
  // | Library article | 3 related articles | 1 tool | 1 sheet | 3 chips |
  // | Live tool       | 3 articles         | (self) | 1 sheet | 3 chips |
  // | Sheet           | 3 articles         | 1 tool | (self)  | 3 chips |
  // | Glossary        | 3 articles         | 1 tool | 1 sheet | (self)  |
  //
  // So the self-corner is the corner whose VERB matches the source.
  // For library article → Read is the self corner.
  // For tool          → Run is the self corner.
  // For sheet         → Write is the self corner.
  // For glossary      → Look up is the self corner.
  //
  // Per docs/start-here-canon.md §6 "Per-surface variations":
  //   "the source page IS the corner (e.g., a tool page → Run corner
  //    self-references), replace the card with the canonical sentence"

  // Read column — 3 related articles for every surface. Per the
  // canon table in docs/start-here-canon.md §6, the Read corner is
  // never the self-corner; even library articles get 3 related
  // articles here. (Self-corners are: tool→Run, sheet→Write,
  // glossary→Look up.)
  let readHtml;
  {
    const cards = (entry.related_articles || [])
      .map((slug) => resolveArticleCard(slug, locale))
      .filter(Boolean);
    if (cards.length === 0) return null;
    readHtml =
      `        <ul class="companion-kit__list">\n` +
      cards.map((c) => renderArticleCard(c, L.articleKind, L.readMin)).join('\n') +
      `\n        </ul>`;
  }

  // Run column (single tool)
  let runHtml;
  if (isSurface('tool')) {
    runHtml = renderSelfSentence(L.selfTool);
  } else {
    const toolSlug = entry.tool;
    if (!toolSlug) return null;
    const card = resolveToolCard(toolSlug, locale);
    if (!card) return null;
    runHtml = renderSingleCard(card, L.toolKind);
  }

  // Write column (single sheet)
  let writeHtml;
  if (isSurface('sheet')) {
    writeHtml = renderSelfSentence(L.selfSheet);
  } else {
    const sheetSlug = entry.sheet;
    if (!sheetSlug) return null;
    const card = resolveSheetCard(sheetSlug, locale);
    if (!card) return null;
    writeHtml = renderSingleCard(card, L.sheetKind);
  }

  // Look up column (3 glossary chips)
  let lookupHtml;
  if (isSurface('glossary')) {
    lookupHtml = renderSelfSentence(L.selfGloss);
  } else {
    const chips = (entry.glossary || [])
      .map((s) => resolveGlossaryChip(s, locale))
      .filter(Boolean);
    if (chips.length === 0) return null;
    lookupHtml =
      `        <ul class="companion-kit__chips">\n` +
      chips.map(renderChip).join('\n') +
      `\n        </ul>`;
  }

  return [
    '<!-- companion-kit:start -->',
    `  <aside class="companion-kit" data-surface="${escAttr(surface)}" data-source-slug="${escAttr(sourceSlug)}" aria-labelledby="${escAttr(headId)}">`,
    '    <div class="container">',
    `      <p class="companion-kit__eyebrow">${escText(L.eyebrow)}</p>`,
    `      <h2 id="${escAttr(headId)}" class="companion-kit__h">${escText(L.heading)}</h2>`,
    '      <div class="companion-kit__grid">',
    `        <div class="companion-kit__col companion-kit__col--read">`,
    `          <h3>${escText(L.read)}</h3>`,
    readHtml,
    '        </div>',
    `        <div class="companion-kit__col companion-kit__col--try">`,
    `          <h3>${escText(L.run)}</h3>`,
    runHtml,
    '        </div>',
    `        <div class="companion-kit__col companion-kit__col--write">`,
    `          <h3>${escText(L.write)}</h3>`,
    writeHtml,
    '        </div>',
    `        <div class="companion-kit__col companion-kit__col--lookup">`,
    `          <h3>${escText(L.lookup)}</h3>`,
    lookupHtml,
    '        </div>',
    '      </div>',
    '    </div>',
    '  </aside>',
    '  <!-- /companion-kit:end -->',
  ].join('\n');
}

// ============================================================
// Safe-range: never insert sentinels inside an attribute value.
// Port of the safe-ranges scanner in inject-glossary-autolinks.mjs;
// we use it only to validate our chosen insertion offset.
// ============================================================

function isOffsetInAttribute(html, offset) {
  // Walk from start of file to `offset`, tracking whether we are
  // inside a tag's attribute zone (between '<' and '>'). True if so.
  let inTag = false;
  let i = 0;
  while (i < offset) {
    const c = html[i];
    if (!inTag) {
      if (c === '<') {
        // Skip comments and doctype/processing.
        if (html.startsWith('<!--', i)) {
          const end = html.indexOf('-->', i + 4);
          if (end < 0) return false;
          i = end + 3;
          continue;
        }
        inTag = true;
        i++;
        continue;
      }
      i++;
      continue;
    } else {
      if (c === '>') { inTag = false; i++; continue; }
      i++;
    }
  }
  return inTag;
}

// ============================================================
// Insertion (per surface)
// ============================================================

const SENTINEL_RE = /\n?[ \t]*<!-- companion-kit:start -->[\s\S]*?<!-- \/companion-kit:end -->\n?/;

// Where the block should land if the sentinel pair is missing.
// Each anchor is a regex that matches a known marker; we insert
// IMMEDIATELY AFTER the matched marker (with a blank line break)
// for post-end-cta/see-also/tool-knit anchors, and IMMEDIATELY
// BEFORE the matched marker for closing-tag anchors (</main>).
function findInsertOffset(surface, html) {
  // Try a series of anchors. Return { offset, indent } or null.
  const tryAnchors = (anchors, mode = 'after') => {
    for (const re of anchors) {
      const m = html.match(re);
      if (!m) continue;
      const idx = m.index;
      const len = m[0].length;
      const insertAt = mode === 'after' ? idx + len : idx;
      return { offset: insertAt, mode };
    }
    return null;
  };

  if (surface === 'library') {
    // 1) After post-end-cta:end (preferred).
    // 2) After LIBRARY:see-also:end.
    // 3) Before </main> when present.
    // 4) Before <footer> for the few legacy articles that have no
    //    <main> wrapper (e.g., can-chatgpt-write-your-restaurant-website).
    return (
      tryAnchors([/<!-- post-end-cta:end -->/], 'after') ||
      tryAnchors([/<!-- LIBRARY:see-also:end -->/], 'after') ||
      tryAnchors([/<\/main>/i], 'before') ||
      tryAnchors([/<footer[\s>]/i], 'before')
    );
  }
  if (surface === 'tool') {
    // 1) After </tool-knit> closing marker.
    // 2) Before </main>.
    return (
      tryAnchors([/<!-- \/tool-knit -->/], 'after') ||
      tryAnchors([/<\/main>/i], 'before')
    );
  }
  if (surface === 'sheet') {
    // Sheets have no consistent named anchor for the post-content
    // tail. Insert before </main>. (sheets that have a
    // sheet-glossary-popovers:applied or sheet-worked-example:end
    // marker still close </main> after them.)
    return tryAnchors([/<\/main>/i], 'before');
  }
  if (surface === 'glossary') {
    // After glossary-lesson-sidecar:end if present, else before </main>.
    return (
      tryAnchors([/<!-- glossary-lesson-sidecar:end -->/], 'after') ||
      tryAnchors([/<!-- glossary-recent:end -->/], 'after') ||
      tryAnchors([/<\/main>/i], 'before')
    );
  }
  return null;
}

// ============================================================
// Main: walk every surface + locale
// ============================================================

function processOne({ surface, sourceSlug, locale, sourceRel }) {
  const entry = (MAP[mapKeyFor(surface)] || {})[sourceSlug];
  if (!entry) return { status: 'skip-no-map', surface, sourceSlug, locale, sourceRel };

  const abs = path.join(REPO, sourceRel);
  if (!fs.existsSync(abs)) return { status: 'skip-no-file', surface, sourceSlug, locale, sourceRel };

  const src = fs.readFileSync(abs, 'utf8');

  const block = buildBlock({ surface, sourceSlug, locale, entry });
  if (!block) return { status: 'skip-no-block', surface, sourceSlug, locale, sourceRel };

  // Replace existing sentinel pair if present; else insert at anchor.
  let next;
  if (SENTINEL_RE.test(src)) {
    next = src.replace(SENTINEL_RE, '\n  ' + block + '\n');
  } else {
    const anchor = findInsertOffset(surface, src);
    if (!anchor) return { status: 'skip-no-anchor', surface, sourceSlug, locale, sourceRel };
    // Safety: never insert inside an attribute value.
    if (isOffsetInAttribute(src, anchor.offset)) {
      return { status: 'skip-unsafe-anchor', surface, sourceSlug, locale, sourceRel };
    }
    const before = src.slice(0, anchor.offset);
    const after  = src.slice(anchor.offset);
    next = before + '\n\n  ' + block + '\n' + after;
  }

  if (next === src) return { status: 'unchanged', surface, sourceSlug, locale, sourceRel };

  if (!checkOnly && !dryRun) fs.writeFileSync(abs, next, 'utf8');
  return { status: 'updated', surface, sourceSlug, locale, sourceRel };
}

function mapKeyFor(surface) {
  if (surface === 'library')  return 'library';
  if (surface === 'tool')     return 'tools';
  if (surface === 'sheet')    return 'sheets';
  if (surface === 'glossary') return 'glossary';
  return null;
}

function libraryFiles() {
  const out = [];
  for (const locale of ['en', 'es']) {
    const root = locale === 'en' ? 'library' : 'es/library';
    const dir = path.join(REPO, root);
    if (!fs.existsSync(dir)) continue;
    for (const slug of fs.readdirSync(dir)) {
      if (slug === 'index.html' || slug === 'drafts') continue;
      // Skip non-article collection landings.
      if (slug === 'menu-design-cuisines' || slug === 'menu-design-themes') continue;
      const file = path.join(dir, slug, 'index.html');
      if (!fs.existsSync(file)) continue;
      // For ES, look up the canonical (EN) slug for map lookup.
      let mapSlug = slug;
      if (locale === 'es') {
        const en = Object.entries(LIB_SLUG_EN_TO_ES).find(([, esS]) => esS === slug);
        if (en) mapSlug = en[0];
      }
      out.push({
        surface: 'library',
        locale,
        sourceSlug: mapSlug,
        sourceRel: path.relative(REPO, file),
      });
    }
  }
  return out;
}

function toolFiles() {
  const out = [];
  // EN only per the brief (ES tools skipped).
  for (const slug of Object.keys(MAP.tools || {})) {
    const dir = toolDir(slug, 'en');
    const file = path.join(REPO, dir, 'index.html');
    if (!fs.existsSync(file)) continue;
    out.push({
      surface: 'tool',
      locale: 'en',
      sourceSlug: slug,
      sourceRel: path.relative(REPO, file),
    });
  }
  return out;
}

function sheetFiles() {
  const out = [];
  // EN only per the brief.
  for (const slug of Object.keys(MAP.sheets || {})) {
    const dir = sheetDir(slug, 'en');
    const file = path.join(REPO, dir, 'index.html');
    if (!fs.existsSync(file)) continue;
    out.push({
      surface: 'sheet',
      locale: 'en',
      sourceSlug: slug,
      sourceRel: path.relative(REPO, file),
    });
  }
  return out;
}

function glossaryFiles() {
  const out = [];
  for (const locale of ['en', 'es']) {
    for (const slug of Object.keys(MAP.glossary || {})) {
      const dir = glossaryDir(slug, locale);
      const file = path.join(REPO, dir, 'index.html');
      if (!fs.existsSync(file)) continue;
      out.push({
        surface: 'glossary',
        locale,
        sourceSlug: slug,
        sourceRel: path.relative(REPO, file),
      });
    }
  }
  return out;
}

function allTargets() {
  const surfaces = surfaceArg ? [surfaceArg] : ['library', 'tool', 'sheet', 'glossary'];
  const out = [];
  for (const s of surfaces) {
    if (s === 'library')  out.push(...libraryFiles());
    if (s === 'tool')     out.push(...toolFiles());
    if (s === 'sheet')    out.push(...sheetFiles());
    if (s === 'glossary') out.push(...glossaryFiles());
  }
  if (onlySlug) return out.filter((t) => t.sourceSlug === onlySlug);
  return out;
}

// ============================================================
// Run
// ============================================================

function main() {
  const targets = allTargets();
  const tallies = {
    updated: 0,
    unchanged: 0,
    'skip-no-map': 0,
    'skip-no-file': 0,
    'skip-no-block': 0,
    'skip-no-anchor': 0,
    'skip-unsafe-anchor': 0,
  };
  const bySurface = {
    library: { en: { updated: 0, total: 0 }, es: { updated: 0, total: 0 } },
    tool:    { en: { updated: 0, total: 0 }, es: { updated: 0, total: 0 } },
    sheet:   { en: { updated: 0, total: 0 }, es: { updated: 0, total: 0 } },
    glossary:{ en: { updated: 0, total: 0 }, es: { updated: 0, total: 0 } },
  };
  const driftFiles = []; // for --check
  const skipReasons = []; // for verbose reporting

  for (const t of targets) {
    bySurface[t.surface][t.locale].total++;
    const r = processOne(t);
    tallies[r.status] = (tallies[r.status] || 0) + 1;
    if (r.status === 'updated') {
      bySurface[t.surface][t.locale].updated++;
      driftFiles.push(r.sourceRel);
    } else if (r.status !== 'unchanged') {
      skipReasons.push(`${r.status}: ${r.sourceRel}`);
    }
  }

  // Output summary.
  const mode = checkOnly ? 'check' : (dryRun ? 'dry-run' : 'apply');
  for (const [surface, locales] of Object.entries(bySurface)) {
    for (const [loc, t] of Object.entries(locales)) {
      if (!t.total) continue;
      console.log(`  ${surface} (${loc}): ${t.updated}/${t.total} ${mode === 'apply' ? 'updated' : 'would update'}`);
    }
  }
  if (skipReasons.length) {
    console.log(`\nSkipped ${skipReasons.length} target(s):`);
    for (const s of skipReasons.slice(0, 20)) console.log(`  ${s}`);
    if (skipReasons.length > 20) console.log(`  ... ${skipReasons.length - 20} more`);
  }
  if (missing.length) {
    const uniq = Array.from(new Set(missing));
    console.log(`\nReferenced surfaces not on disk (${uniq.length}):`);
    for (const m of uniq.slice(0, 10)) console.log(`  ${m}`);
    if (uniq.length > 10) console.log(`  ... ${uniq.length - 10} more`);
  }

  const total = targets.length;
  const skipped = total - tallies.updated - tallies.unchanged;
  console.log(
    `\ncompanion-kit: ${mode === 'apply' ? 'updated' : 'would update'} ${tallies.updated} of ${total} page(s); ${skipped} skipped (no anchor / source not in map / missing linked surface).`,
  );

  if (checkOnly && tallies.updated > 0) {
    console.error(`\n--check: ${tallies.updated} file(s) would change.`);
    process.exit(1);
  }
}

main();
