#!/usr/bin/env node
/**
 * inject-study-cite.mjs — promotes the menu-pricing field report (/cost-index/menu-pricing/study/)
 * from a publication into a citable CC-BY surface by adding, to the committed pages (EN + ES), a
 * "Cite this & download" block (APA + BibTeX + the CC-BY evidence-table + per-ingredient downloads)
 * and a `license`/`datePublished`/`isAccessibleForFree` triple in the ScholarlyArticle JSON-LD —
 * WITHOUT a full page rebuild (the study pages run ahead of the in-container engine in nav, so a
 * regenerate would regress them). Idempotent: each page carries a `study-cite` sentinel; a re-run
 * strips and rewrites it. The rendered block is byte-identical to emitStudy()'s (both call
 * scripts/lib/cost-research.mjs#studyCiteBlock).
 *
 *   node scripts/inject-study-cite.mjs           # write
 *   node scripts/inject-study-cite.mjs --check    # dry-run; exit 1 if any page is out of sync
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { studyCiteBlock, STUDY_CITE_SENTINEL } from './lib/cost-research.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const CCBY = 'https://creativecommons.org/licenses/by/4.0/';
const PUBLISHED = '2026-07-11';
// Must match scripts/build-cost-index-pages.mjs#escHtml exactly (byte-parity of the cite block).
const escHtml = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const study = (() => { try { return JSON.parse(fs.readFileSync(path.join(repo, 'data/cost-research-study.json'), 'utf8')); } catch { return null; } })();

// The JSON-LD triple emitStudy now emits, inserted right after the author object.
const AUTHOR_ANCHOR = '"name":"The Muntin Desk"},"citation"';
const AUTHOR_PATCHED = `"name":"The Muntin Desk"},"datePublished":"${PUBLISHED}","license":"${CCBY}","isAccessibleForFree":true,"citation"`;

function strip(s, start, end) {
  const i = s.indexOf(start); if (i < 0) return s;
  const j = s.indexOf(end, i); if (j < 0) return s;
  return s.slice(0, i) + s.slice(j + end.length);
}

function processPage(file, locale) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  const title = study[locale] && study[locale].title;
  if (!title) return { status: 'no-data', changed: false };
  const block = STUDY_CITE_SENTINEL.start + studyCiteBlock(locale, title, escHtml) + STUDY_CITE_SENTINEL.end;

  // 1) idempotent removal + a stray blank line
  html = strip(html, STUDY_CITE_SENTINEL.start, STUDY_CITE_SENTINEL.end);
  html = html.replace(/\n[ \t]*\n([ \t]*<p class="rs-src">)/, '\n$1');

  // 2) body block before the closing source note, preserving indentation
  const anchor = '<p class="rs-src">';
  const aIdx = html.indexOf(anchor);
  if (aIdx < 0) return { status: 'no-anchor', changed: false };
  const lineStart = html.lastIndexOf('\n', aIdx) + 1;
  const indent = html.slice(lineStart, aIdx);
  html = html.slice(0, lineStart) + indent + block + '\n' + html.slice(lineStart);

  // 3) JSON-LD license/datePublished/isAccessibleForFree (idempotent)
  if (html.includes(AUTHOR_ANCHOR)) html = html.replace(AUTHOR_ANCHOR, AUTHOR_PATCHED);

  const changed = html !== before;
  if (changed && !CHECK) fs.writeFileSync(file, html);
  return { status: 'injected', changed };
}

let changed = 0, skipped = [];
for (const [file, locale] of [
  ['cost-index/menu-pricing/study/index.html', 'en'],
  ['es/cost-index/menu-pricing/study/index.html', 'es'],
]) {
  const abs = path.join(repo, file);
  if (!fs.existsSync(abs)) { skipped.push(`${file}: missing`); continue; }
  const r = processPage(abs, locale);
  if (r.status !== 'injected') skipped.push(`${file}: ${r.status}`);
  if (r.changed) changed++;
}

if (skipped.length) { for (const s of skipped) console.error('  - ' + s); }
if (CHECK) {
  if (changed || skipped.length) { console.error(`✗ study-cite: ${changed} page(s) out of sync — run: node scripts/inject-study-cite.mjs`); process.exit(1); }
  console.log('✓ study-cite: both study pages carry the CC-BY cite block + license.');
} else {
  console.log(`study-cite: ${changed} file(s) changed${skipped.length ? `, ${skipped.length} skipped` : ''}.`);
}
