#!/usr/bin/env node
/**
 * Operator Sheets — hub renderer.
 *
 * Renders the body of /sheets/index.html and /es/sheets/index.html
 * between <!-- sheets:auto -->...<!-- /sheets:auto --> sentinels from
 * data/sheets.json. Modeled on scripts/build-tools-index.mjs but with
 * its own pack registry — sheet packs are NOT constrained to
 * data/topics.json clusters (sheets have an independent organizing
 * taxonomy; see audit verdict in the implementation plan).
 *
 * Per-pack section renders all sheets in the pack:
 *   - status: live    → linked card with cadence + walkaway
 *   - status: queued  → muted card, "Coming"
 *
 * Run AFTER build-sheet-pages.mjs (so the linked URLs exist on disk).
 *
 * Usage:
 *   node scripts/build-sheets-index.mjs           # rewrite in place
 *   node scripts/build-sheets-index.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SHEETS = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'sheets.json'), 'utf8'));

const SUMMARY_MAX = 240;
const SENTINEL_OPEN  = '<!-- sheets:auto -->';
const SENTINEL_CLOSE = '<!-- /sheets:auto -->';

// --- validation -------------------------------------------------------

const errors = [];
const packIds = new Set(SHEETS.packs.map((p) => p.id));

for (const p of SHEETS.packs) {
  for (const slug of p.sheets) {
    if (!SHEETS.sheets[slug]) errors.push(`pack "${p.id}" references missing sheet "${slug}"`);
    else if (SHEETS.sheets[slug].pack !== p.id) errors.push(`sheet "${slug}".pack (${SHEETS.sheets[slug].pack}) disagrees with pack "${p.id}".sheets`);
  }
}
for (const [slug, s] of Object.entries(SHEETS.sheets)) {
  if (!packIds.has(s.pack)) errors.push(`sheet "${slug}".pack ("${s.pack}") is not a valid pack id`);
  for (const k of ['title_en', 'title_es', 'summary_en', 'summary_es', 'walkaway_en', 'walkaway_es', 'url_en', 'url_es', 'pack', 'cadence_en', 'cadence_es', 'format', 'status']) {
    if (!s[k]) errors.push(`sheet "${slug}" missing required field "${k}"`);
  }
  if (s.summary_en && s.summary_en.length > SUMMARY_MAX) errors.push(`sheet "${slug}".summary_en is ${s.summary_en.length} chars, max ${SUMMARY_MAX}`);
  if (s.summary_es && s.summary_es.length > SUMMARY_MAX) errors.push(`sheet "${slug}".summary_es is ${s.summary_es.length} chars, max ${SUMMARY_MAX}`);
  if (s.walkaway_en && s.walkaway_en.includes('\n')) errors.push(`sheet "${slug}".walkaway_en must be a single line`);
  if (s.walkaway_es && s.walkaway_es.includes('\n')) errors.push(`sheet "${slug}".walkaway_es must be a single line`);
}
if (errors.length) {
  console.error('data/sheets.json has problems:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(2);
}

// --- rendering --------------------------------------------------------

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></svg>';

function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function escText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function pickI18n(obj, key, locale) { return obj[`${key}_${locale}`]; }

const COPY = {
  en: {
    eyebrow: 'Operator Sheets',
    heroTitle: 'Paperwork for the actual restaurant.',
    heroSub: 'Printable, fillable, exportable. Recipe cost cards, par sheets, daily P&L, the GBP audit you keep forgetting to run. All client-side. None of your numbers leave the page.',
    chipNavAria: 'Jump to a pack',
    walkawayLabel: 'You leave with',
    cadenceLabel: 'Cadence',
    liveLabel: 'Live',
    queuedLabel: 'Queued',
    closingNote: 'Free, no signup. Pack 1 (Operations & Margin) is shipping first; the rest follow on a rolling cadence.',
    exclusionsHeading: 'What these sheets do not cover',
  },
  es: {
    eyebrow: 'Hojas del Operador',
    heroTitle: 'Papeleo para el restaurante real.',
    heroSub: 'Imprimibles, llenables, exportables. Tarjetas de costo de receta, par sheets, P&G diario, la auditoría de GBP que sigues olvidando correr. Todo en tu navegador. Tus números no salen de la página.',
    chipNavAria: 'Saltar a un paquete',
    walkawayLabel: 'Te llevas',
    cadenceLabel: 'Cadencia',
    liveLabel: 'En vivo',
    queuedLabel: 'En cola',
    closingNote: 'Gratis, sin registro. El Paquete 1 (Operaciones y Márgenes) sale primero; los demás llegan en cadencia.',
    exclusionsHeading: 'Lo que estas hojas no cubren',
  },
};

function renderChipNav(locale) {
  const c = COPY[locale];
  const chips = SHEETS.packs.map((p) => {
    const label = pickI18n(p, 'label', locale);
    const liveCount = p.sheets.filter((s) => SHEETS.sheets[s] && SHEETS.sheets[s].status === 'live').length;
    const totalCount = p.sheets.length;
    return `      <a href="#${p.id}">${escText(label)} <span style="opacity:.6;font-weight:500;">(${liveCount}/${totalCount})</span></a>`;
  }).join('\n');
  return `<nav class="tool-chipnav" aria-label="${escAttr(c.chipNavAria)}">
${chips}
    </nav>`;
}

function renderSheetCard(slug, locale) {
  const s = SHEETS.sheets[slug];
  if (!s) return '';
  const c = COPY[locale];
  const title    = pickI18n(s, 'title', locale);
  const summary  = pickI18n(s, 'summary', locale);
  const walkaway = pickI18n(s, 'walkaway', locale);
  const cadence  = pickI18n(s, 'cadence', locale);
  const url      = pickI18n(s, 'url', locale);

  if (s.status === 'live') {
    return `      <a href="${escAttr(url)}" class="tool-card tool-card--compact live">
        <span class="status">${escText(c.liveLabel)}</span>
        <h3>${escText(title)}</h3>
        <p>${escText(summary)}</p>
        <p class="tool-card__walkaway"><span class="tool-card__walkaway-label">${escText(c.walkawayLabel)}:</span> ${escText(walkaway)}</p>
        <p style="margin:6px 0 0;font-size:11.5px;color:var(--stone,#6B6B6B);font-weight:500;">${escText(c.cadenceLabel)}: ${escText(cadence)}</p>
      </a>`;
  }
  // Queued — show as soon-card.
  return `      <li class="tool-card tool-card--roadmap soon" aria-disabled="true">
        <span class="status">${escText(c.queuedLabel)}</span>
        <h3>${escText(title)}</h3>
        <p>${escText(summary)}</p>
        <p style="margin:6px 0 0;font-size:11.5px;color:var(--stone,#6B6B6B);font-weight:500;">${escText(c.cadenceLabel)}: ${escText(cadence)}</p>
      </li>`;
}

function renderPack(pack, locale) {
  const label = pickI18n(pack, 'label', locale);
  const blurb = pickI18n(pack, 'blurb', locale);
  const liveSlugs   = pack.sheets.filter((s) => SHEETS.sheets[s] && SHEETS.sheets[s].status === 'live');
  const queuedSlugs = pack.sheets.filter((s) => SHEETS.sheets[s] && SHEETS.sheets[s].status !== 'live');

  const liveCards = liveSlugs.map((s) => renderSheetCard(s, locale)).join('\n');
  const queuedCards = queuedSlugs.map((s) => renderSheetCard(s, locale)).join('\n');

  const liveBlock = liveCards
    ? `<div class="tool-grid">
${liveCards}
    </div>`
    : '';
  const queuedBlock = queuedCards
    ? `<ul class="tool-grid" style="list-style:none;padding:0;margin:18px 0 0;">
${queuedCards}
      </ul>`
    : '';

  return `<section id="${pack.id}" class="tool-cluster" aria-labelledby="pack-${pack.id}-heading">
    <header class="tool-cluster__head">
      <h2 id="pack-${pack.id}-heading">${escText(label)}</h2>
      <p>${escText(blurb)}</p>
    </header>
    ${liveBlock}
    ${queuedBlock}
  </section>`;
}

function renderExclusions(locale) {
  const c = COPY[locale];
  const policy = SHEETS._exclusions[`policy_${locale}`];
  return `<section class="block" style="margin-top:32px;padding:24px 0;border-top:1px solid var(--line,#E5DFD2);">
    <h3 style="font-family:var(--font-display,'Fraunces',Georgia,serif);font-size:18px;font-weight:500;margin:0 0 8px;">${escText(c.exclusionsHeading)}</h3>
    <p style="font-size:14px;line-height:1.6;color:var(--ink-soft,#2A2D33);max-width:760px;margin:0;">${escText(policy)}</p>
  </section>`;
}

function renderBody(locale) {
  const c = COPY[locale];
  const packs = SHEETS.packs.map((p) => '  ' + renderPack(p, locale)).join('\n\n  ');
  return `${SENTINEL_OPEN}
<section class="block">
  <div class="container container-wide">
    <aside class="tool-goals" aria-labelledby="sheets-eyebrow-heading">
      <span class="eyebrow" id="sheets-eyebrow-heading">${escText(c.eyebrow)}</span>
    </aside>

    ${renderChipNav(locale)}

  ${packs}

    ${renderExclusions(locale)}

    <p class="section-aside" style="text-align:center;margin-top:32px;">
      ${escText(c.closingNote)}
    </p>
  </div>
</section>
${SENTINEL_CLOSE}`;
}

// --- write ------------------------------------------------------------

const TARGETS = [
  { file: 'sheets/index.html',     locale: 'en' },
  { file: 'es/sheets/index.html',  locale: 'es' },
];

const SENTINEL_RE = new RegExp(`${SENTINEL_OPEN.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}[\\s\\S]*?${SENTINEL_CLOSE.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`);

let changed = 0;
for (const { file, locale } of TARGETS) {
  const fp = path.join(REPO, file);
  if (!fs.existsSync(fp)) {
    console.error(`${file}: hub page does not exist on disk yet — create it with the canonical scaffold (a head + body containing ${SENTINEL_OPEN} and ${SENTINEL_CLOSE} sentinels) before running this script.`);
    process.exit(3);
  }
  const src = fs.readFileSync(fp, 'utf8');
  if (!SENTINEL_RE.test(src)) {
    console.error(`${file}: missing ${SENTINEL_OPEN} / ${SENTINEL_CLOSE} sentinels.`);
    process.exit(3);
  }
  const next = src.replace(SENTINEL_RE, renderBody(locale));
  if (next !== src) {
    if (!checkOnly) fs.writeFileSync(fp, next);
    changed++;
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${file}`);
  }
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of ${TARGETS.length} sheets index page(s).`);
if (checkOnly && changed > 0) process.exit(1);
