#!/usr/bin/env node
/**
 * Operator Sheets · per-topic-page rail.
 *
 * Each /learn/topics/<cluster>/ page already lists the cluster's TOOLS
 * in a "Run a check on your own site" section. This injector adds a
 * parallel "Pull out the paperwork" section listing the cluster's
 * SHEETS, sourced from data/sheets.json's pack → sheets[] map.
 *
 * Sentinel-bracketed (<!-- topic-sheets-rail:start --> ... :end -->),
 * inserted just before the topic-essay block (or replaces an existing
 * stamp on re-runs). Honors status="live" so queued sheets do not
 * surface as 404s.
 *
 * Topic slug ↔ pack id is identical for the five clusters that have
 * sheets (operations-margin, local-seo, conversions, brand-design,
 * trust-reviews). The other three topic pages (speed-mobile,
 * ai-search, information-security) have no sheet pack — the injector
 * silently skips them.
 *
 *   node scripts/inject-topic-sheets-rail.mjs           # rewrite
 *   node scripts/inject-topic-sheets-rail.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- topic-sheets-rail:start -->[\s\S]*?<!-- topic-sheets-rail:end -->/;
const ESSAY_ANCHOR = '<!-- topic-essay:start -->';

const sheetsPath = path.join(repoRoot, 'data', 'sheets.json');
if (!fs.existsSync(sheetsPath)) { console.log('sheets data missing — skipping'); process.exit(0); }
const SHEETS = JSON.parse(fs.readFileSync(sheetsPath, 'utf8'));

function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function escText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

const COPY = {
  en: {
    eyebrow: 'Operator sheets',
    headingByPack: {
      'operations-margin': 'Pull out the paperwork.',
      'local-seo':         'Pull out the paperwork.',
      'conversions':       'Pull out the paperwork.',
      'brand-design':      'Hand off to the designer.',
      'trust-reviews':     'Defensible paperwork, ready to print.',
    },
    cta: 'Open the sheet',
  },
  es: {
    eyebrow: 'Hojas del operador',
    headingByPack: {
      'operations-margin': 'Saca el papeleo.',
      'local-seo':         'Saca el papeleo.',
      'conversions':       'Saca el papeleo.',
      'brand-design':      'Entrégaselo al diseñador.',
      'trust-reviews':     'Papeleo defendible, listo para imprimir.',
    },
    cta: 'Abrir la hoja',
  },
};

function pickI18n(obj, key, locale) { return obj[`${key}_${locale}`]; }

function findPack(packId) {
  return SHEETS.packs.find((p) => p.id === packId);
}

function buildBlock(packId, locale) {
  const pack = findPack(packId);
  if (!pack) return null;
  const liveSlugs = pack.sheets.filter((slug) => SHEETS.sheets[slug] && SHEETS.sheets[slug].status === 'live');
  if (!liveSlugs.length) return null;

  const c = COPY[locale];
  const eyebrow = c.eyebrow;
  const heading = c.headingByPack[packId] || (locale === 'es' ? 'Saca el papeleo.' : 'Pull out the paperwork.');

  const items = liveSlugs.map((slug) => {
    const s = SHEETS.sheets[slug];
    const title    = pickI18n(s, 'title', locale);
    const summary  = pickI18n(s, 'summary', locale);
    const url      = pickI18n(s, 'url', locale);
    return `      <li>
        <a class="topic-tool-card" href="${escAttr(url)}">
          <h4>${escText(title)}</h4>
          <p>${escText(summary)}</p>
          <span class="topic-tool-cta">${escText(c.cta)} <span aria-hidden="true">→</span></span>
        </a>
      </li>`;
  }).join('\n');

  return `<!-- topic-sheets-rail:start -->
<section class="topic-section">
  <div class="container">
    <header class="topic-section-head">
      <span class="eyebrow">${escText(eyebrow)}</span>
      <h2>${escText(heading)}</h2>
    </header>
    <ul class="topic-tool-list">
${items}
    </ul>
  </div>
</section>
<!-- topic-sheets-rail:end -->`;
}

function topicSlugFromPath(filepath) {
  // /learn/topics/operations-margin/index.html → operations-margin
  // /es/learn/topics/operations-margin/index.html → operations-margin
  const m = filepath.match(/learn\/topics\/([^/]+)\/index\.html$/);
  return m ? m[1] : null;
}

let changed = 0;
let skipped = 0;

const TARGETS = [];
for (const root of [['en', 'learn/topics'], ['es', 'es/learn/topics']]) {
  const [locale, dir] = root;
  const full = path.join(repoRoot, dir);
  if (!fs.existsSync(full)) continue;
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(full, entry.name, 'index.html');
    if (fs.existsSync(file)) TARGETS.push({ file, locale, slug: entry.name });
  }
}

for (const { file, locale, slug } of TARGETS) {
  const block = buildBlock(slug, locale);
  const src = fs.readFileSync(file, 'utf8');

  let next;
  if (block) {
    if (SENTINEL_RE.test(src)) {
      next = src.replace(SENTINEL_RE, block);
    } else {
      const idx = src.indexOf(ESSAY_ANCHOR);
      if (idx === -1) {
        // No essay anchor — append before the closing </main> as a fallback.
        const closeMain = src.indexOf('</main>');
        if (closeMain === -1) { skipped++; continue; }
        next = src.slice(0, closeMain) + block + '\n\n' + src.slice(closeMain);
      } else {
        next = src.slice(0, idx) + block + '\n\n' + src.slice(idx);
      }
    }
  } else {
    // Pack has no sheets — strip any stale block, leave the page alone otherwise.
    if (!SENTINEL_RE.test(src)) { skipped++; continue; }
    next = src.replace(SENTINEL_RE, '');
  }

  if (next === src) { skipped++; continue; }
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  changed++;
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} topic page(s); ${skipped} skipped.`);
if (checkOnly && changed > 0) process.exit(1);
