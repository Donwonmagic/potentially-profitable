#!/usr/bin/env node
/**
 * Operator Sheets — inline glossary popovers (Phase A6).
 *
 * For each live sheet page, finds the FIRST occurrence of each
 * curated term (data/sheet-glossary-anchors.json) inside the page's
 * prose blocks (NOT inside the form, NOT inside scripts) and wraps
 * it with the data attributes the existing assets/js/glossary.js
 * popover expects. The popover script auto-mounts on any page with
 * `a[data-glossary-blurb]` triggers via inject-glossary-script.mjs,
 * so no separate JS wiring is needed.
 *
 * Where popovers are injected:
 *   - "When to use it" bullets (in the sheet-when-to-use card)
 *   - "Common mistakes" bullets (in the sheet-mistakes card)
 *   - The "callout" prose under the results panel ([data-output="callout"]
 *     and the static intro paragraph)
 *
 * Where they are NOT:
 *   - Inside <input>, <select>, <textarea>, <output>, <option>
 *   - Inside <script>, <style>, <code>, or any [data-no-popover]
 *   - In nav, breadcrumb, footer, or sheet-meta chips
 *
 * Caps:
 *   - One popover per fieldset / per prose block (first match wins).
 *   - Skip terms whose target glossary slug doesn't have a corresponding
 *     /glossary/<slug>/ page in the same locale.
 *
 * Sentinel-bracketed at the document level for idempotency:
 *   <!-- sheet-glossary-popovers:applied -->  (presence flag only)
 *
 * Re-runs: detects the flag, strips the previous wraps, and re-injects.
 *
 *   node scripts/inject-sheet-glossary-popovers.mjs
 *   node scripts/inject-sheet-glossary-popovers.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const FLAG = '<!-- sheet-glossary-popovers:applied -->';

const anchorsPath = path.join(repoRoot, 'data', 'sheet-glossary-anchors.json');
const sheetsPath  = path.join(repoRoot, 'data', 'sheets.json');
if (!fs.existsSync(anchorsPath)) { console.log('sheet-glossary-anchors.json missing — skipping'); process.exit(0); }
if (!fs.existsSync(sheetsPath))  { console.log('sheets.json missing — skipping'); process.exit(0); }

const TERMS = JSON.parse(fs.readFileSync(anchorsPath, 'utf8')).terms || {};
const SHEETS = JSON.parse(fs.readFileSync(sheetsPath, 'utf8')).sheets || {};

function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

// Build per-locale list of [matchLiteral, slug, head, aka, blurb, hrefSlug]
// sorted by length desc so longer phrases (e.g. "Google Business Profile")
// match before shorter ones ("Google").
function termList(locale) {
  const list = [];
  for (const [slug, t] of Object.entries(TERMS)) {
    // Only include terms whose glossary page actually exists in this
    // locale (defense against stale anchors).
    const glossDir = locale === 'es' ? 'es/glossary' : 'glossary';
    const glossFile = path.join(repoRoot, glossDir, slug, 'index.html');
    if (!fs.existsSync(glossFile)) continue;
    const head  = locale === 'es' ? t.head_es  : t.head_en;
    const aka   = locale === 'es' ? t.aka_es   : t.aka_en;
    const blurb = locale === 'es' ? t.blurb_es : t.blurb_en;
    if (!head || !blurb) continue;
    // Build match candidates: the head phrase, plus any explicit
    // alternates the entry declares. For our seed data the head
    // phrase is the canonical match; we also accept the AKA when
    // it reads as a real synonym (skip parenthetical glosses like
    // "(EP)"). Acronyms in parens get stripped.
    const cleanHead = head.replace(/\s*\([^)]*\)\s*/g, '').trim();
    const matches = new Set();
    matches.add(cleanHead);
    // Alternative: if head contains "(XYZ)", add XYZ as a separate match.
    const acronymMatch = head.match(/\(([^)]+)\)/);
    if (acronymMatch) matches.add(acronymMatch[1].trim());
    list.push({
      slug,
      matches: Array.from(matches).filter((m) => m.length >= 3),
      head: cleanHead,
      aka: aka || '',
      blurb,
      href: locale === 'es' ? `/es/glossary/${slug}/` : `/glossary/${slug}/`,
    });
  }
  // Sort by longest match phrase first to avoid shadowing.
  list.sort((a, b) => Math.max(...b.matches.map((m) => m.length)) - Math.max(...a.matches.map((m) => m.length)));
  return list;
}

// Strip any previously-injected popover wraps so we can re-stamp
// idempotently. The wrap shape is a strict pattern, so we can recover
// the original text reliably. We only touch our own anchors —
// recognized via data-sheet-popover="1".
function stripExistingPopovers(html) {
  return html.replace(/<a([^>]*\sdata-sheet-popover="1"[^>]*)>([\s\S]*?)<\/a>/g, '$2');
}

// Match a term inside a section of HTML, but NOT inside any of the
// excluded contexts: <input>, <select>, <textarea>, <option>, <script>,
// <style>, <code>, or anywhere within an existing <a>. We do this by
// segmenting the HTML into "safe" and "unsafe" runs based on tag
// boundaries, then only running term replacement on safe runs.
function segmentSafe(section) {
  // Tags we never touch text inside of.
  const RE_UNSAFE = /(<(?:input|select|textarea|output|option|script|style|code|a)\b[^>]*>[\s\S]*?<\/(?:input|select|textarea|output|option|script|style|code|a)>|<input\b[^>]*\/?>|<option\b[^>]*\/?>)/gi;
  const segments = [];
  let lastIdx = 0;
  let m;
  while ((m = RE_UNSAFE.exec(section)) !== null) {
    if (m.index > lastIdx) segments.push({ kind: 'safe', text: section.slice(lastIdx, m.index) });
    segments.push({ kind: 'unsafe', text: m[0] });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < section.length) segments.push({ kind: 'safe', text: section.slice(lastIdx) });
  return segments;
}

// Try each term against the safe segment text; on the first match in
// the section, replace it with the popover anchor and return the new
// section. `usedSlugs` accumulates which terms we've already used in
// this prose block.
function tryWrapFirstMatch(section, terms, usedSlugs) {
  const segs = segmentSafe(section);
  for (const t of terms) {
    if (usedSlugs.has(t.slug)) continue;
    for (const matchPhrase of t.matches) {
      // Word-boundary regex, case-insensitive. Escape regex metas.
      const escaped = matchPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp('(^|[^A-Za-z0-9])(' + escaped + ')(?=[^A-Za-z0-9]|$)', 'i');
      // Walk safe segments; first hit wins.
      for (let i = 0; i < segs.length; i++) {
        if (segs[i].kind !== 'safe') continue;
        const txt = segs[i].text;
        const hit = txt.match(re);
        if (!hit) continue;
        const idx = hit.index + hit[1].length;
        const matched = hit[2];
        const before = txt.slice(0, idx);
        const after  = txt.slice(idx + matched.length);
        const anchor =
          '<a class="sheet-glossary-popover-link" href="' + escAttr(t.href) + '"' +
          ' data-glossary-head="' + escAttr(t.head) + '"' +
          (t.aka ? ' data-glossary-aka="' + escAttr(t.aka) + '"' : '') +
          ' data-glossary-blurb="' + escAttr(t.blurb) + '"' +
          ' data-sheet-popover="1">' + matched + '</a>';
        segs[i] = { kind: 'safe', text: before + anchor + after };
        usedSlugs.add(t.slug);
        return { html: segs.map((s) => s.text).join(''), wrapped: true };
      }
    }
  }
  return { html: section, wrapped: false };
}

// Locate prose blocks within the rendered <main> and wrap the first
// term match per block. Block selectors here are conservative: only
// the sheet's own prose (when-to-use bullets, mistakes bullets,
// callout paragraph, sheet intro under the form's H2). Caller
// receives the modified <main> region back.
function processMain(mainHtml, terms) {
  const usedSlugs = new Set();
  let out = mainHtml;
  // The set of class-anchored prose blocks we treat as eligible.
  // Each entry: { selector regex, blockOpener+closer in HTML }. We
  // handle this by greedy-matching the inner HTML of the first
  // occurrence of each class-bearing element, processing it, and
  // splicing it back.
  const CONTAINERS = [
    // <ul> inside .sheet-when-to-use (bulleted "Pull this sheet out when —")
    { open: /<ul[^>]*>(?=[\s\S]*<\/ul>)/, scope: /class="[^"]*\bsheet-when-to-use\b[^"]*"/ },
    { open: /<ul[^>]*>(?=[\s\S]*<\/ul>)/, scope: /class="[^"]*\bsheet-mistakes\b[^"]*"/ },
    // The static "sheet intro" paragraph under the form's H2.
    { open: /<p[^>]*>/, scope: /class="[^"]*\bmm-card\b[^"]*\bmm-live\b[^"]*"/, paragraphsOnly: true },
    // The dynamic [data-output="callout"] paragraph (rendered text
    // changes per recalc; this is fine — popovers only attach if
    // the glossary term appears in the static fallback text).
    { open: /<p[^>]*data-output="callout"[^>]*>/, paragraphsOnly: true },
  ];

  // Process each prose block we can find. For containers with a
  // scope class, find the parent element first and only process its
  // first matching <ul> or <p>.
  for (const c of CONTAINERS) {
    if (c.scope) {
      // Find element bounded by article/section/aside that carries the
      // scope class. Using a generous match — section opens with
      // <article ...class="... scope ..."> and ends at </article>.
      const re = /<(?:article|aside|section)\b([^>]*)>([\s\S]*?)<\/(?:article|aside|section)>/g;
      out = out.replace(re, function (match, attrs, inner) {
        if (!c.scope.test(attrs)) return match;
        // Inside this scope, find the first matching block (ul or p).
        if (c.paragraphsOnly) {
          const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/;
          const pm = inner.match(pRe);
          if (!pm) return match;
          const result = tryWrapFirstMatch(pm[2], terms, usedSlugs);
          if (!result.wrapped) return match;
          const replaced = '<p' + pm[1] + '>' + result.html + '</p>';
          return match.replace(pm[0], replaced);
        }
        // Find first <ul> in scope.
        const ulRe = /<ul\b([^>]*)>([\s\S]*?)<\/ul>/;
        const um = inner.match(ulRe);
        if (!um) return match;
        // Process each <li> independently — a popover lands on the
        // first li that has a matching term, and only one popover
        // per ul (single use per block).
        const liRe = /<li\b([^>]*)>([\s\S]*?)<\/li>/g;
        let liReplaced = false;
        const newUlBody = um[2].replace(liRe, function (liMatch, liAttrs, liInner) {
          if (liReplaced) return liMatch;
          const r = tryWrapFirstMatch(liInner, terms, usedSlugs);
          if (!r.wrapped) return liMatch;
          liReplaced = true;
          return '<li' + liAttrs + '>' + r.html + '</li>';
        });
        if (!liReplaced) return match;
        return match.replace(um[0], '<ul' + um[1] + '>' + newUlBody + '</ul>');
      });
    } else {
      // Scope-less paragraph match (e.g. the dynamic callout). One
      // pass at the first match.
      const re = /<p\b([^>]*data-output="callout"[^>]*)>([\s\S]*?)<\/p>/;
      const m = out.match(re);
      if (!m) continue;
      const r = tryWrapFirstMatch(m[2], terms, usedSlugs);
      if (!r.wrapped) continue;
      out = out.replace(m[0], '<p' + m[1] + '>' + r.html + '</p>');
    }
  }
  return out;
}

let changed = 0;
let skipped = 0;

const liveSlugs = Object.entries(SHEETS).filter(([, s]) => s.status === 'live').map(([slug]) => slug);

for (const root of [['en', 'sheets'], ['es', 'es/sheets']]) {
  const [locale, dir] = root;
  const terms = termList(locale);
  for (const slug of liveSlugs) {
    const file = path.join(repoRoot, dir, slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    // Strip any prior wraps (idempotency) and the flag.
    let working = stripExistingPopovers(src).replace(/\n?\s*<!-- sheet-glossary-popovers:applied -->\n?/g, '\n');
    // Slice <main>.
    const mainOpen = working.indexOf('<main id="main">');
    const mainClose = working.indexOf('</main>');
    if (mainOpen === -1 || mainClose === -1) { skipped++; continue; }
    const mainBody = working.slice(mainOpen, mainClose);
    const newMain  = processMain(mainBody, terms);
    if (newMain === mainBody) {
      // No popovers wrapped — still re-write to clear stale ones.
      const next = working.slice(0, mainOpen) + newMain + working.slice(mainClose);
      // Add the flag (presence-only marker) so build-info can tell
      // the script ran.
      const final = next.replace('</main>', '</main>\n' + FLAG);
      if (final !== src) {
        if (!checkOnly) fs.writeFileSync(file, final);
        console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}  (no terms matched)`);
        changed++;
      } else { skipped++; }
      continue;
    }
    const next = working.slice(0, mainOpen) + newMain + working.slice(mainClose);
    const final = next.replace('</main>', '</main>\n' + FLAG);
    if (final === src) { skipped++; continue; }
    if (!checkOnly) fs.writeFileSync(file, final);
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
    changed++;
  }
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} sheet page(s); ${skipped} skipped.`);
if (checkOnly && changed > 0) process.exit(1);
