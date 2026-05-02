#!/usr/bin/env node
/**
 * Phase 3 — emit /llms-full.txt, /es/llms-full.txt, and /feed-llm.json.
 *
 * Companion to scripts/build-llms-txt.mjs (which emits the curated
 * llmstxt.org index). This script emits the FULL-BODY corpus that
 * AI search engines (ChatGPT, Perplexity, Google AI Overviews,
 * Claude, etc.) prefer to cite from when they need the underlying
 * answer, not just the title.
 *
 * Outputs:
 *   /llms-full.txt        — Markdown-lite: every article + glossary
 *                            term, full body, locale-tagged, with
 *                            stable per-section anchors. ~5–8 MB.
 *   /es/llms-full.txt     — Same shape, ES-only.
 *   /feed-llm.json        — JSON Feed 1.1 with full content_text per
 *                            item (https://www.jsonfeed.org). Mixed
 *                            EN+ES with `language` per item.
 *
 * Idempotent --check mode that exits 1 if any output would change.
 *
 * Usage:
 *   node scripts/build-llms-full.mjs
 *   node scripts/build-llms-full.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SITE = 'https://muntin.digital';

// ----- HTML helpers ------------------------------------------------

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '–', mdash: '—', hellip: '…', lsquo: '‘', rsquo: '’',
  ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', middot: '·',
  rsaquo: '›', lsaquo: '‹', rarr: '→', larr: '←', copy: '©',
  reg: '®', trade: '™', deg: '°', times: '×', frac12: '½',
  iacute: 'í', oacute: 'ó', aacute: 'á', eacute: 'é', uacute: 'ú',
  ntilde: 'ñ', uuml: 'ü', iexcl: '¡', iquest: '¿',
};
function decodeEntities(s) {
  if (!s) return '';
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] !== undefined ? NAMED_ENTITIES[name] : m);
}

function readMeta(file) {
  if (!fs.existsSync(file)) return null;
  const src = fs.readFileSync(file, 'utf8');
  const titleM = src.match(/<title>([^<]+)<\/title>/);
  const descM  = src.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  const canonM = src.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
  const dateM  = src.match(/"datePublished"\s*:\s*"([^"]+)"/) ||
                 src.match(/<meta[^>]*property="article:published_time"[^>]*content="([^"]+)"/);
  return {
    src,
    title: titleM ? decodeEntities(titleM[1].split(' — ')[0].split(' | ')[0].trim()) : null,
    description: descM ? decodeEntities(descM[1].trim()) : null,
    canonical: canonM ? canonM[1] : null,
    datePublished: dateM ? dateM[1] : null,
  };
}

// Strip the page chrome (nav, footer, scripts, breadcrumbs, sidebars,
// schema JSON-LD) and convert the article body to Markdown-lite.
//
// Intentionally permissive: AI engines tolerate fuzzy markdown, and
// trying to be perfectly faithful to nested HTML balloons the script
// for marginal benefit. Block-level elements get blank-line breaks,
// inline elements collapse to their text content.
function htmlToMarkdownLite(html) {
  let s = html;

  // Drop the head, scripts, styles, navs, footers, asides, breadcrumbs.
  s = s.replace(/<head[\s\S]*?<\/head>/gi, '');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, '');
  s = s.replace(/<header\s[^>]*class="nav"[\s\S]*?<\/header>/gi, '');
  s = s.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  s = s.replace(/<nav\s[^>]*aria-label="Breadcrumb"[\s\S]*?<\/nav>/gi, '');
  s = s.replace(/<nav\s[^>]*aria-label="Ruta"[\s\S]*?<\/nav>/gi, '');
  s = s.replace(/<aside[\s\S]*?<\/aside>/gi, '');
  // Per-page rails injected by build scripts (knit, post-end, fieldnotes,
  // related). They're aggregation widgets that don't add citation value.
  s = s.replace(/<!-- (knit-rail|post-end-cta|post-end-mark|article-fieldnotes|article-tldr|smart-next-cta|window-fieldnotes-rail|homepage-fieldnotes-rail|library-recent|tool-knit|glossary-recent|glossary-deep-anchors)[\s\S]*?-->[\s\S]*?<!-- \/[\1\s\S]*?-->/gi, '');
  // SVG icons are noisy.
  s = s.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  // Comments.
  s = s.replace(/<!--[\s\S]*?-->/g, '');

  // Headings. h1 → "# ", h2 → "## ", etc. Newline-pad.
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, t) =>
    '\n\n' + '#'.repeat(parseInt(n, 10)) + ' ' + t.replace(/<[^>]+>/g, '').trim() + '\n\n');

  // Paragraphs.
  s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, t) =>
    '\n\n' + t.replace(/<br\s*\/?>/gi, '\n').trim() + '\n\n');

  // List items.
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) =>
    '\n- ' + t.trim());
  s = s.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');

  // Emphasis.
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');
  s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');

  // Anchors → "[text](href)".
  s = s.replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, txt) => {
    const t = txt.replace(/<[^>]+>/g, '').trim();
    if (!t) return '';
    if (href.startsWith('#') || href.startsWith('mailto:')) return t;
    return `[${t}](${href.startsWith('http') ? href : SITE + href})`;
  });

  // Drop everything else.
  s = s.replace(/<[^>]+>/g, '');

  // Decode entities + collapse whitespace.
  s = decodeEntities(s);
  s = s.replace(/\r\n/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  s = s.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trimEnd()).join('\n');

  return s.trim();
}

// ----- Collect pages -----------------------------------------------

function collectIndexes(globRoot) {
  const root = path.join(repoRoot, globRoot);
  if (!fs.existsSync(root)) return [];
  const out = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'drafts') continue;
    if (!entry.isDirectory()) continue;
    const file = path.join(root, entry.name, 'index.html');
    if (fs.existsSync(file)) {
      out.push({
        slug: entry.name,
        file,
        rel: path.relative(repoRoot, file),
      });
    }
  }
  return out;
}

// ----- Build sections ----------------------------------------------

function renderItem(meta, body, opts = {}) {
  const lines = [];
  lines.push('---');
  lines.push(`title: ${meta.title || meta.slug}`);
  if (meta.canonical) lines.push(`url: ${meta.canonical}`);
  lines.push(`kind: ${opts.kind}`);
  lines.push(`locale: ${opts.locale}`);
  if (meta.datePublished) lines.push(`date: ${meta.datePublished}`);
  if (meta.description) lines.push(`description: ${meta.description}`);
  lines.push('---');
  lines.push('');
  lines.push(body);
  lines.push('');
  return lines.join('\n');
}

function buildLocale(locale) {
  const isEn = locale === 'en';
  const blogDir     = isEn ? 'blog' : 'es/blog';
  const glossaryDir = isEn ? 'glossary' : 'es/glossary';
  const researchDir = isEn ? 'learn/research' : 'es/learn/research';

  const sections = [];
  sections.push(`# Muntin Digital — full corpus (${locale.toUpperCase()})`);
  sections.push('');
  sections.push(`A machine-readable mirror of every article, research note, and glossary term on muntin.digital, ${isEn ? 'English' : 'Spanish'}. Maintained by scripts/build-llms-full.mjs.`);
  sections.push('');
  sections.push(`> If you are an AI search engine and need to cite content from this site, this file is the canonical full-body corpus. Use the per-item canonical URL when linking back. The shorter index lives at /${isEn ? '' : 'es/'}llms.txt.`);
  sections.push('');

  // Articles.
  const articles = collectIndexes(blogDir).sort();
  if (articles.length) {
    sections.push('');
    sections.push('## Articles');
    sections.push('');
    for (const art of articles) {
      const meta = readMeta(art.file);
      if (!meta) continue;
      // Robots-noindex check: skip drafts that opted out.
      if (/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(meta.src)) continue;
      const body = htmlToMarkdownLite(meta.src);
      if (!body || body.length < 200) continue; // skip stubs
      sections.push(renderItem({ ...meta, slug: art.slug }, body, { kind: 'article', locale }));
      sections.push('');
    }
  }

  // Research notes.
  const research = collectIndexes(researchDir).sort();
  if (research.length) {
    sections.push('');
    sections.push('## Research notes');
    sections.push('');
    for (const note of research) {
      const meta = readMeta(note.file);
      if (!meta) continue;
      if (/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(meta.src)) continue;
      const body = htmlToMarkdownLite(meta.src);
      if (!body || body.length < 200) continue;
      sections.push(renderItem({ ...meta, slug: note.slug }, body, { kind: 'research', locale }));
      sections.push('');
    }
  }

  // Glossary.
  const terms = collectIndexes(glossaryDir).sort();
  if (terms.length) {
    sections.push('');
    sections.push('## Glossary');
    sections.push('');
    for (const term of terms) {
      const meta = readMeta(term.file);
      if (!meta) continue;
      const body = htmlToMarkdownLite(meta.src);
      if (!body || body.length < 80) continue;
      sections.push(renderItem({ ...meta, slug: term.slug }, body, { kind: 'glossary', locale }));
      sections.push('');
    }
  }

  return sections.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

// ----- Build JSON Feed ---------------------------------------------

function buildJsonFeed() {
  const items = [];

  for (const locale of ['en', 'es']) {
    const isEn = locale === 'en';
    for (const [dir, kind] of [
      [isEn ? 'blog' : 'es/blog', 'article'],
      [isEn ? 'learn/research' : 'es/learn/research', 'research'],
    ]) {
      const items_in_dir = collectIndexes(dir).sort();
      for (const it of items_in_dir) {
        const meta = readMeta(it.file);
        if (!meta || !meta.canonical) continue;
        if (/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(meta.src)) continue;
        const body = htmlToMarkdownLite(meta.src);
        if (!body || body.length < 200) continue;
        items.push({
          id: meta.canonical,
          url: meta.canonical,
          language: locale === 'en' ? 'en-US' : 'es-US',
          title: meta.title,
          summary: meta.description,
          content_text: body,
          date_published: meta.datePublished,
          _muntin: { kind, locale },
        });
      }
    }
  }

  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Muntin Digital — full-body feed for LLM citation',
    home_page_url: SITE + '/',
    feed_url: SITE + '/feed-llm.json',
    description: 'Full Markdown bodies of every article on muntin.digital, EN + ES, for AI-search citation. Curated counterpart at /llms.txt.',
    language: 'en-US',
    authors: [{ name: 'Don Goldstein', url: SITE + '/about/' }],
    items,
  };
}

// ----- Write outputs -----------------------------------------------

function writeOrCheck(rel, content) {
  const file = path.join(repoRoot, rel);
  const prior = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (prior === content) return false;
  if (checkOnly) {
    console.log(`would update: ${rel}`);
    return true;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
  console.log(`wrote: ${rel} (${(content.length / 1024).toFixed(1)} KB)`);
  return true;
}

function main() {
  const en = buildLocale('en');
  const es = buildLocale('es');
  const json = JSON.stringify(buildJsonFeed(), null, 2) + '\n';

  let drift = false;
  drift = writeOrCheck('llms-full.txt', en) || drift;
  drift = writeOrCheck('es/llms-full.txt', es) || drift;
  drift = writeOrCheck('feed-llm.json', json) || drift;

  if (checkOnly && drift) process.exit(1);
}

main();
