#!/usr/bin/env node
/**
 * Operator Sheets · per-term sidecar.
 *
 * For each glossary term that has an entry in data/glossary-sheet-anchors.json,
 * stamp a quiet "Use this sheet" callout right after the </h1>. The callout
 * lists 1–N sheets that pair with the term — pulled from data/sheets.json so
 * titles stay in sync, status is honored (only live sheets surface), and ES
 * locale routes to /es/sheets/.
 *
 * Sentinel-bracketed (<!-- term-sheet-sidecar:start --> ... :end -->) so
 * re-runs are idempotent. Modeled on inject-glossary-term-examples.mjs.
 *
 * The block has its own scoped CSS — small inline <style> on first stamp,
 * then suppressed on subsequent stamps within the same page (only one
 * <style> ships per page).
 *
 *   node scripts/inject-glossary-sheet-sidecar.mjs           # rewrite
 *   node scripts/inject-glossary-sheet-sidecar.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- term-sheet-sidecar:start -->[\s\S]*?<!-- term-sheet-sidecar:end -->/;

const anchorsPath = path.join(repoRoot, 'data', 'glossary-sheet-anchors.json');
const sheetsPath  = path.join(repoRoot, 'data', 'sheets.json');

if (!fs.existsSync(anchorsPath)) { console.log('glossary-sheet-anchors data missing — skipping'); process.exit(0); }
if (!fs.existsSync(sheetsPath))  { console.log('sheets data missing — skipping'); process.exit(0); }

const anchors = JSON.parse(fs.readFileSync(anchorsPath, 'utf8')).anchors || {};
const sheets  = JSON.parse(fs.readFileSync(sheetsPath, 'utf8')).sheets || {};

function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function escText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

const COPY = {
  en: {
    label: 'Use this sheet',
    intro: (n) => n === 1 ? 'A printable + fillable sheet pairs with this term:' : 'Printable + fillable sheets pair with this term:',
    arrowAria: 'Open sheet',
  },
  es: {
    label: 'Usa esta hoja',
    intro: (n) => n === 1 ? 'Una hoja imprimible y llenable va con este término:' : 'Hojas imprimibles y llenables van con este término:',
    arrowAria: 'Abrir hoja',
  },
};

// Resolve a sheet slug to its title + URL for the locale, only if live.
function resolveSheet(slug, locale) {
  const s = sheets[slug];
  if (!s) return null;
  if (s.status !== 'live') return null;
  return {
    title: locale === 'es' ? s.title_es : s.title_en,
    url:   locale === 'es' ? s.url_es   : s.url_en,
    walkaway: locale === 'es' ? s.walkaway_es : s.walkaway_en,
  };
}

function buildBlock(termSlug, locale) {
  const list = anchors[termSlug];
  if (!Array.isArray(list) || !list.length) return null;
  const resolved = list.map((sl) => resolveSheet(sl, locale)).filter(Boolean);
  if (!resolved.length) return null;
  const c = COPY[locale];
  const items = resolved.map((r) => `        <li>
          <a class="term-sheet-sidecar__link" href="${escAttr(r.url)}">
            <span class="term-sheet-sidecar__title">${escText(r.title)}</span>
            <span class="term-sheet-sidecar__walkaway">${escText(r.walkaway)}</span>
          </a>
        </li>`).join('\n');
  return `<!-- term-sheet-sidecar:start -->
      <aside class="term-sheet-sidecar" aria-labelledby="term-sheet-sidecar-h-${escAttr(termSlug)}">
        <p class="term-sheet-sidecar__eyebrow">${escText(c.label)}</p>
        <p class="term-sheet-sidecar__intro" id="term-sheet-sidecar-h-${escAttr(termSlug)}">${escText(c.intro(resolved.length))}</p>
        <ul class="term-sheet-sidecar__list">
${items}
        </ul>
      </aside>
      <!-- term-sheet-sidecar:end -->`;
}

// Inject a single inline <style> the first time we touch the page, scoped
// to .term-sheet-sidecar so it never collides with site.css. Subsequent
// re-runs detect the marker and skip the style block.
const STYLE_MARKER = '<!-- term-sheet-sidecar:style -->';
const STYLE_BLOCK  = `${STYLE_MARKER}<style>
.term-sheet-sidecar{margin:18px 0 0;padding:14px 18px;border:1px solid var(--line,#E5DFD2);border-left:3px solid var(--teal,#1F4E5B);border-radius:var(--r-sm,6px);background:var(--cream-2,#F3EEE3)}
.term-sheet-sidecar__eyebrow{margin:0;font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--teal,#1F4E5B)}
.term-sheet-sidecar__intro{margin:4px 0 10px;font-size:14px;line-height:1.5;color:var(--ink-soft,#2A2D33)}
.term-sheet-sidecar__list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
.term-sheet-sidecar__link{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border:1px solid var(--line,#E5DFD2);border-radius:var(--r-sm,6px);background:var(--white,#FFFFFF);text-decoration:none;color:var(--ink,#14161A);transition:border-color 140ms ease}
.term-sheet-sidecar__link:hover{border-color:var(--teal,#1F4E5B)}
.term-sheet-sidecar__title{font-family:var(--font-display,"Fraunces",Georgia,serif);font-size:16px;font-weight:500;color:var(--teal,#1F4E5B)}
.term-sheet-sidecar__walkaway{font-size:13px;line-height:1.45;color:var(--ink-soft,#2A2D33)}
@media print{.term-sheet-sidecar{display:none !important}}
</style>`;

function ensureStyle(src) {
  if (src.includes(STYLE_MARKER)) return src;
  // Insert just before </head>.
  const headEnd = src.indexOf('</head>');
  if (headEnd === -1) return src; // page has no </head>, skip styling
  return src.slice(0, headEnd) + STYLE_BLOCK + '\n' + src.slice(headEnd);
}

function findTerms(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  const out = [];
  for (const e of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const f = path.join(rootDir, e.name, 'index.html');
    if (fs.existsSync(f)) out.push({ slug: e.name, file: f });
  }
  return out;
}

let changed = 0;
let skipped = 0;
let removed = 0;
const missingAnchors = new Set();

for (const root of [['en', 'glossary'], ['es', 'es/glossary']]) {
  const [locale, dir] = root;
  for (const { slug, file } of findTerms(path.join(repoRoot, dir))) {
    const block = buildBlock(slug, locale);
    const src = fs.readFileSync(file, 'utf8');

    let next;
    if (block) {
      // Stamp or refresh the sidecar.
      const withStyle = ensureStyle(src);
      if (SENTINEL_RE.test(withStyle)) {
        next = withStyle.replace(SENTINEL_RE, block);
      } else {
        const h1Idx = withStyle.indexOf('</h1>');
        if (h1Idx === -1) { skipped++; continue; }
        const insertAt = h1Idx + '</h1>'.length;
        next = withStyle.slice(0, insertAt) + '\n      ' + block + withStyle.slice(insertAt);
      }
    } else {
      // No anchors for this term — strip any stale sidecar block,
      // leave the inert style block alone (cheap, no other-page side
      // effects, future-stamps idempotent).
      if (!SENTINEL_RE.test(src)) { skipped++; continue; }
      next = src.replace(SENTINEL_RE, '');
      removed++;
    }
    if (next === src) { skipped++; continue; }
    if (!checkOnly) fs.writeFileSync(file, next);
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
    changed++;
  }
}

// Report any anchor entries that point at a sheet slug that doesn't exist
// in data/sheets.json (typo or rename). Warn-only — does not fail the build.
for (const [term, list] of Object.entries(anchors)) {
  for (const slug of list) {
    if (!sheets[slug]) missingAnchors.add(`${term} → ${slug} (sheet not in data/sheets.json)`);
  }
}
if (missingAnchors.size) {
  console.warn('\nglossary-sheet-anchors warnings:');
  for (const m of missingAnchors) console.warn(`  · ${m}`);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} term page(s); ${skipped} skipped; ${removed} stale sidecar(s) removed.`);
if (checkOnly && changed > 0) process.exit(1);
