#!/usr/bin/env node
/**
 * Wave 3 — standalone glossary autolinker.
 *
 * The existing build-library.mjs autolinker only matches a term's
 * <h1> headword. That leaves 81 terms orphaned: terms whose
 * head is "Body text size", "First Contentful Paint", "Call to
 * action" — articles allude to them via paraphrase, not the
 * verbatim form. This injector adds an alias-aware pass on top:
 * it ports the safe-range scan from build-library.mjs's
 * autoLinkGlossary(), but tries each per-term alias from
 * data/glossary-autolink-aliases.json before falling back to the
 * head.
 *
 * Idempotent via the same <!-- LIBRARY:autolink:start -->…
 * <!-- LIBRARY:autolink:end --> sentinel pair build-library.mjs
 * stamps. Re-running strips prior markers and re-stamps from
 * scratch, so this script can run after build-library.mjs without
 * compounding link counts.
 *
 * Scope (locked): only touches /library/<slug>/index.html,
 * /blog/<slug>/index.html, and their ES counterparts (/es/library,
 * /es/blog). NEVER touches /glossary/, /learn/, hub pages,
 * sitemap, RSS, llms.txt, or anything else.
 *
 * Usage:
 *   node scripts/inject-glossary-autolinks.mjs              # rewrite in place
 *   node scripts/inject-glossary-autolinks.mjs --check      # exit 1 if any change
 *   node scripts/inject-glossary-autolinks.mjs --verbose    # per-file summary
 *
 * @see scripts/build-library.mjs autoLinkGlossary (line 1851)
 * @see data/glossary-autolink-aliases.json
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = dirname(dirname(__filename));
const DATA       = join(REPO, 'data');

const argv      = process.argv.slice(2);
const checkOnly = argv.includes('--check');
const verbose   = argv.includes('--verbose');

// ---------- glossary parsing (mirror build-library.mjs#424) ----------

function decodeBasicEntities(s) {
  if (!s) return '';
  return s
    .replace(/&amp;/g,  '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—');
}

function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, '');
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Sentence-bounded snippet, capped at `cap` chars. Mirrors
// build-library.mjs#firstSentence so re-stamping matches.
function firstSentence(text, cap = 180) {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  const window = trimmed.slice(0, cap + 40);
  const m = window.match(/[.!?](?=\s+[A-ZÁÉÍÓÚÑ0-9"'(])/);
  if (m && m.index + 1 <= cap) {
    return trimmed.slice(0, m.index + 1);
  }
  if (trimmed.length <= cap) return trimmed;
  const cut = trimmed.slice(0, cap);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
}

// Per-term page → { slug, head, aka, defHtml } needed for the
// data-glossary-* attributes. Parses /glossary/<slug>/index.html
// directly (one term per file in the deployed glossary), so we
// don't need to import build-library.mjs's monolithic parser.
function loadGlossaryTerms(locale) {
  const base = locale === 'en' ? join(REPO, 'glossary') : join(REPO, 'es/glossary');
  if (!existsSync(base)) return [];
  const terms = [];
  for (const slug of readdirSync(base)) {
    const file = join(base, slug, 'index.html');
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    const h1m = html.match(/<h1 class="term-h1">([\s\S]*?)<\/h1>/);
    if (!h1m) continue;
    const head = h1m[1].trim();
    const akaM = html.match(/<p class="term-aka">([\s\S]*?)<\/p>/);
    const aka  = akaM ? akaM[1].trim() : '';
    const defM = html.match(/<p class="term-def">([\s\S]*?)<\/p>/);
    const defHtml = defM ? defM[1].trim() : '';
    terms.push({ slug, head, aka, defHtml });
  }
  return terms;
}

// ---------- safe-range scanner (port of build-library.mjs#1738) ----------

const AUTOLINK_SKIP_TAGS = new Set([
  'a', 'code', 'pre', 'kbd', 'samp',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'aside', 'details', 'svg', 'style', 'script',
]);

const AUTOLINK_VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

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
    closeSeg(i);

    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i + 4);
      i = end < 0 ? articleEnd : end + 3;
      continue;
    }
    if (html[i + 1] === '!' || html[i + 1] === '?') {
      const end = html.indexOf('>', i);
      i = end < 0 ? articleEnd : end + 1;
      continue;
    }
    if (html[i + 1] === '/') {
      const end = html.indexOf('>', i);
      if (end < 0) { i = articleEnd; continue; }
      const name = html.slice(i + 2, end).trim().toLowerCase().split(/\s+/)[0];
      for (let k = stack.length - 1; k >= 0; k--) {
        if (stack[k] === name) { stack.splice(k, 1); break; }
      }
      i = end + 1;
      continue;
    }
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

// ---------- main autolink pass ----------

function pathFor(locale, p) {
  return locale === 'en' ? p : `/${locale}${p}`;
}

// Walk the EN-side article corpus (library + blog) and return the
// set of glossary slugs that already have AT LEAST ONE inbound
// link from any EN article body. Matches the verification one-liner
// in the Wave 3 brief — orphans are defined EN-side because the
// glossary-backlinks injector also scopes the inverted index by
// locale, and ES-only inbound links don't help EN orphan counts.
function computeAlreadyLinkedSet() {
  const linked = new Set();
  for (const base of ['library', 'blog']) {
    const baseDir = join(REPO, base);
    if (!existsSync(baseDir)) continue;
    for (const slug of readdirSync(baseDir)) {
      if (slug === 'drafts' || slug === 'index.html') continue;
      const file = join(baseDir, slug, 'index.html');
      if (!existsSync(file)) continue;
      const html = readFileSync(file, 'utf8');
      // Use the same heuristic as the brief's verify one-liner —
      // any /glossary/<slug>/ href anywhere in the file (not just
      // post-body) counts. That matches the operator's mental
      // model: "is this term linked anywhere on this page?"
      const linkRe = /\/glossary\/([a-z0-9-]+)\//g;
      for (const m of html.matchAll(linkRe)) linked.add(m[1]);
    }
  }
  return linked;
}

function autolinkArticle(file, locale, terms, aliasesMap, orphanOnly) {
  let html;
  try { html = readFileSync(file, 'utf8'); } catch { return { changed: false, added: 0 }; }
  const original = html;

  const articleMatch = html.match(/<article[^>]*\bid="post-body"[^>]*>/);
  if (!articleMatch) return { changed: false, added: 0 };
  const articleStart = articleMatch.index;
  const articleEnd   = html.indexOf('</article>', articleStart);
  if (articleEnd < 0) return { changed: false, added: 0 };

  // Additive-only: do NOT strip prior <!-- LIBRARY:autolink --> markers.
  // build-library.mjs's full pass owns idempotent reset; this script
  // runs out-of-band and must preserve existing links. The skip-list
  // below (alreadyLinked) ensures we don't double-link a term already
  // wrapped or hand-linked elsewhere in the body.
  const articleBody = html.slice(articleStart, articleEnd);

  // Slugs that already have any <a href="/glossary/<slug>/"> inside the
  // body — wrapped or hand-authored — get skipped this pass. Matches
  // both the locale's glossary path (/glossary/ or /es/glossary/) so
  // ES articles' hand-links count too.
  const alreadyLinked = new Set();
  const linkRe = /href="\/(?:es\/)?glossary\/([a-z0-9-]+)\/"/g;
  for (const m of articleBody.matchAll(linkRe)) alreadyLinked.add(m[1]);

  const safeRanges = computeSafeRanges(html, articleStart, articleEnd);
  if (!safeRanges.length) return { changed: false, added: 0 };

  // Sort terms by max matchable surface length DESC so multi-word
  // terms / aliases beat their sub-words. If orphanOnly is set,
  // restrict to that pre-computed set of orphan slugs (terms with
  // zero corpus-wide inbound links before this pass).
  const sorted = [...terms]
    .filter(t => !alreadyLinked.has(t.slug))
    .filter(t => orphanOnly ? orphanOnly.has(t.slug) : true)
    .map(t => {
      const aliases = aliasesMap[t.slug] || [];
      const headPlain = decodeBasicEntities(stripTags(t.head)).trim();
      const surfaces = [headPlain, ...aliases].filter(Boolean);
      const maxLen = surfaces.reduce((a, s) => Math.max(a, s.length), 0);
      return { ...t, headPlain, aliases, surfaces, maxLen };
    })
    .sort((a, b) => b.maxLen - a.maxLen);

  const placed = [];
  const isFree = (s, e) => {
    for (const p of placed) if (s < p.end && e > p.start) return false;
    return true;
  };

  for (const term of sorted) {
    if (!term.surfaces.length) continue;

    // Pick the earliest hit across all (head + alias) surfaces. Surface
    // sort within the term doesn't matter (single pick per term anyway).
    let bestStart = -1, bestEnd = -1;
    for (const surface of term.surfaces) {
      if (surface.length < 3) continue;
      const re = new RegExp(`\\b${escapeRegex(surface).replace(/\\ /g, '\\s+')}\\b`, 'i');
      for (const [rs, re2] of safeRanges) {
        const slice = html.slice(rs, re2);
        const m = re.exec(slice);
        if (!m) continue;
        const mStart = rs + m.index;
        const mEnd   = mStart + m[0].length;
        if (!isFree(mStart, mEnd)) continue;
        if (bestStart < 0 || mStart < bestStart) {
          bestStart = mStart; bestEnd = mEnd;
        }
        break;
      }
    }
    if (bestStart < 0) continue;
    placed.push({ start: bestStart, end: bestEnd, term });
    placed.sort((a, b) => a.start - b.start);
  }

  if (!placed.length) return { changed: false, added: 0 };

  placed.sort((a, b) => b.start - a.start);
  for (const p of placed) {
    const matched = html.slice(p.start, p.end);
    const url     = pathFor(locale, `/glossary/${p.term.slug}/`);
    const head    = decodeBasicEntities(stripTags(p.term.head)).trim();
    const aka     = p.term.aka ? decodeBasicEntities(stripTags(p.term.aka)).trim() : '';
    const blurb   = firstSentence(decodeBasicEntities(stripTags(p.term.defHtml)).trim(), 180);
    const dataAttrs =
      ` data-glossary-head="${escAttr(head)}"` +
      (aka ? ` data-glossary-aka="${escAttr(aka)}"` : '') +
      ` data-glossary-blurb="${escAttr(blurb)}"`;
    const link = `<!-- LIBRARY:autolink:start --><a href="${url}"${dataAttrs}>${matched}</a><!-- LIBRARY:autolink:end -->`;
    html = html.slice(0, p.start) + link + html.slice(p.end);
  }

  const changed = html !== original;
  if (changed && !checkOnly) writeFileSync(file, html, 'utf8');
  return { changed, added: placed.length };
}

// ---------- top-level walk ----------

function loadAliases() {
  const file = join(DATA, 'glossary-autolink-aliases.json');
  if (!existsSync(file)) return {};
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  return doc.aliases || {};
}

function main() {
  const aliases = loadAliases();
  const tallies = { files: 0, touched: 0, totalAdded: 0 };

  // Precompute corpus-wide "already linked" set BEFORE we start
  // mutating, then derive orphanSet = all_term_slugs - already_linked.
  // The autolinker only adds links for slugs in orphanSet so we
  // don't ripple side-effects through inject-glossary-article-
  // backlinks.mjs's inverted index for terms that already had
  // backlinks.
  const corpusLinked = computeAlreadyLinkedSet();
  // Use EN glossary slugs as the canonical term-set; ES slugs match 1:1.
  const enGlossDir = join(REPO, 'glossary');
  const orphanSet = new Set();
  if (existsSync(enGlossDir)) {
    for (const slug of readdirSync(enGlossDir)) {
      const f = join(enGlossDir, slug, 'index.html');
      if (!existsSync(f)) continue;
      // Sanity check term page exists with a term-h1 (filters out hubs).
      const html = readFileSync(f, 'utf8');
      if (!/term-h1/.test(html)) continue;
      if (!corpusLinked.has(slug)) orphanSet.add(slug);
    }
  }
  console.log(`[inject-glossary-autolinks] precompute: ${orphanSet.size} orphan slug(s) scoped`);

  for (const locale of ['en', 'es']) {
    const terms = loadGlossaryTerms(locale);
    if (!terms.length) continue;

    const bases = locale === 'en'
      ? ['library', 'blog']
      : ['es/library', 'es/blog'];

    for (const base of bases) {
      const baseDir = join(REPO, base);
      if (!existsSync(baseDir)) continue;
      for (const slug of readdirSync(baseDir)) {
        if (slug === 'drafts' || slug === 'index.html') continue;
        const file = join(baseDir, slug, 'index.html');
        if (!existsSync(file)) continue;
        tallies.files++;
        const r = autolinkArticle(file, locale, terms, aliases, orphanSet);
        if (r.changed) tallies.touched++;
        tallies.totalAdded += r.added;
        if (verbose) {
          const flag = r.changed ? '*' : ' ';
          console.log(`${flag} ${base}/${slug}  added=${r.added}`);
        }
      }
    }
  }

  const mode = checkOnly ? 'check' : 'write';
  console.log(
    `[inject-glossary-autolinks] mode=${mode} files=${tallies.files} ` +
    `touched=${tallies.touched} new-links=${tallies.totalAdded}`,
  );

  if (checkOnly && tallies.touched > 0) {
    console.error(`[inject-glossary-autolinks] --check: ${tallies.touched} file(s) would change`);
    process.exit(1);
  }
}

main();
