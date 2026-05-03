#!/usr/bin/env node
/**
 * Operator Sheets · per-tool reciprocal rail (Phase C1).
 *
 * For each /tools/<slug>/ page, stamps a quiet "Sheets that use this
 * tool" rail between sentinels. Reverse-indexes data/sheets.json by
 * pairsWith.tools — every sheet that names a tool gets a reciprocal
 * link from that tool's page back to the sheet.
 *
 * Caps:
 * - Max 2 sheets per rail (operator attention is finite).
 * - Suppress the rail entirely if 0 pairings.
 * - Insert after the existing tool-storefront-rail or tool-knit
 *   sentinel (whichever comes first), so commercial CTAs don't
 *   push the free reciprocal off-screen.
 *
 * Modeled on inject-glossary-sheet-sidecar.mjs. Sentinel-bracketed,
 * fully idempotent.
 *
 *   node scripts/inject-tool-sheet-rail.mjs           # rewrite
 *   node scripts/inject-tool-sheet-rail.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- tool-sheet-rail:start -->[\s\S]*?<!-- tool-sheet-rail:end -->/;

const sheetsPath = path.join(repoRoot, 'data', 'sheets.json');
if (!fs.existsSync(sheetsPath)) { console.log('sheets.json missing — skipping'); process.exit(0); }
const SHEETS = JSON.parse(fs.readFileSync(sheetsPath, 'utf8')).sheets || {};

// Reverse index: tool slug → [sheet slugs] (live only, capped at 2).
const TOOL_SHEETS = {};
const liveSlugs = Object.entries(SHEETS).filter(([, s]) => s.status === 'live').map(([slug]) => slug);
for (const slug of liveSlugs) {
  const tools = (SHEETS[slug].pairsWith && SHEETS[slug].pairsWith.tools) || [];
  for (const tool of tools) {
    if (!TOOL_SHEETS[tool]) TOOL_SHEETS[tool] = [];
    if (TOOL_SHEETS[tool].length < 2) TOOL_SHEETS[tool].push(slug);
  }
}

const COPY = {
  en: {
    eyebrow: 'Pair with paperwork',
    intro: 'Operator sheets that use this tool — printable, fillable, exports to CSV.',
    cta: 'Open the sheet',
  },
  es: {
    eyebrow: 'Empareja con papeleo',
    intro: 'Hojas del operador que usan esta herramienta — imprimibles, llenables, exportan a CSV.',
    cta: 'Abrir la hoja',
  },
};

function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function escText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function pickI18n(o, key, locale) { return o[`${key}_${locale}`]; }

function buildBlock(toolSlug, locale) {
  const sheetSlugs = TOOL_SHEETS[toolSlug];
  if (!sheetSlugs || !sheetSlugs.length) return null;
  const c = COPY[locale];
  const items = sheetSlugs.map((slug) => {
    const s = SHEETS[slug];
    const title    = pickI18n(s, 'title',    locale);
    const summary  = pickI18n(s, 'summary',  locale);
    const url      = pickI18n(s, 'url',      locale);
    return `        <li>
          <a class="topic-tool-card" href="${escAttr(url)}">
            <h4>${escText(title)}</h4>
            <p>${escText(summary)}</p>
            <span class="topic-tool-cta">${escText(c.cta)} <span aria-hidden="true">→</span></span>
          </a>
        </li>`;
  }).join('\n');
  return `<!-- tool-sheet-rail:start -->
<section class="topic-section tool-sheet-rail" aria-labelledby="tool-sheet-rail-h">
  <div class="container">
    <header class="topic-section-head">
      <span class="eyebrow">${escText(c.eyebrow)}</span>
      <h2 id="tool-sheet-rail-h">${escText(c.intro)}</h2>
    </header>
    <ul class="topic-tool-list">
${items}
    </ul>
  </div>
</section>
<!-- tool-sheet-rail:end -->`;
}

function toolSlugFromPath(filepath) {
  const m = filepath.match(/tools\/([^/]+(?:\/[^/]+)?)\/index\.html$/);
  return m ? m[1] : null;
}

function findToolPages(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const sub = path.join(rootDir, entry.name);
    const idx = path.join(sub, 'index.html');
    if (fs.existsSync(idx)) out.push({ slug: entry.name, file: idx });
    // Two-level: tools/audits/restaurant/
    for (const e2 of fs.readdirSync(sub, { withFileTypes: true })) {
      if (!e2.isDirectory()) continue;
      const idx2 = path.join(sub, e2.name, 'index.html');
      if (fs.existsSync(idx2)) out.push({ slug: `${entry.name}/${e2.name}`, file: idx2 });
    }
  }
  return out;
}

let changed = 0;
let skipped = 0;
let removed = 0;

for (const root of [['en', 'tools'], ['es', 'es/tools']]) {
  const [locale, dir] = root;
  for (const { slug, file } of findToolPages(path.join(repoRoot, dir))) {
    const block = buildBlock(slug, locale);
    const src = fs.readFileSync(file, 'utf8');

    let next;
    if (block) {
      if (SENTINEL_RE.test(src)) {
        next = src.replace(SENTINEL_RE, block);
      } else {
        // Insert before the storefront-rail if present, else before
        // the closing </main>, else skip.
        const storefrontIdx = src.indexOf('<!-- storefront-rail:start -->');
        const knitIdx = src.indexOf('<!-- tool-knit:start -->');
        const closeMain = src.indexOf('</main>');
        let anchor = -1;
        if (storefrontIdx !== -1) anchor = storefrontIdx;
        else if (knitIdx !== -1) anchor = knitIdx;
        else if (closeMain !== -1) anchor = closeMain;
        if (anchor === -1) { skipped++; continue; }
        next = src.slice(0, anchor) + block + '\n\n' + src.slice(anchor);
      }
    } else {
      // No pairings — strip stale block; otherwise leave alone.
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

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} tool page(s); ${skipped} skipped; ${removed} stale rail(s) removed.`);
if (checkOnly && changed > 0) process.exit(1);
