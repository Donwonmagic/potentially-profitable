#!/usr/bin/env node
/**
 * Muntin Cost Index — per-ingredient wholesale-price reference pages.
 *
 * Emits one page per ingredient at /cost-index/<slug>/ (+ ES mirror) plus
 * a hub at /cost-index/, plus a machine-readable price-history
 * distribution per ingredient (series.json + series.csv). Each page
 * answers a real operator question — "what does <ingredient> cost
 * wholesale right now, and am I overpaying?" — with the typical range,
 * the trend, the confidence, an "as of" date, and a deep link into the
 * live Cost Pulse tool for the always-fresh reading.
 *
 * THE FACT GATE / HONESTY CONTRACT:
 *   - Every number rendered here is read at build time from the gated
 *     data/cost-index.json (an ingredient only appears there once its
 *     sources are verified:true AND a live fetch produced real points;
 *     scripts/check-cost-index-sync.mjs enforces provenance + freshness).
 *     Nothing is hand-typed. No invention can reach the page.
 *   - The visible "Market read" block is a dated, sourced data block
 *     (asOf badge + a <details> provenance drawer + a basis disclaimer),
 *     mirroring the proven block on the ingredient-yield pages. That is
 *     the cited-data exception to "no live cents in evergreen prose" —
 *     the digits travel with their date and source, never as bare prose.
 *   - The lede, "why it matters", "how to use", and the FAQ stay
 *     number-free and qualitative, so the most-cached / rich-result
 *     surfaces never carry a price that can go stale. The one market
 *     token allowed in prose is a direction word, build-stamped + dated.
 *   - Confidence governs precision in the JSON-LD Dataset: high/medium
 *     emit value + range; low emits the range only when it is a real
 *     interquartile band; directional emits a direction word and no
 *     number. The Dataset stays valid + indexable in every case.
 *
 * Schema: per page a Dataset (variableMeasured PropertyValue +
 * DataDownload distribution) + BreadcrumbList + FAQPage; the hub a
 * DataCatalog + CollectionPage + ItemList + BreadcrumbList. dateModified
 * == points[0].asOf; temporalCoverage spans the history endpoints.
 *
 * Chrome mirrors scripts/build-ingredient-yield-pages.mjs: a skeleton
 * nav that the sync-includes pass expands to the canonical nav, an empty
 * #footer hydrated by site.js, and self-emitted hreflang (registered in
 * scripts/stamp-hreflang.mjs SKIP_PATH_PREFIXES so it isn't double-
 * stamped). Like that generator, this one is intentionally NOT wired
 * into check-all in --check mode — the skeleton nav drifts against the
 * sync-includes-expanded on-disk nav. It runs in the deploy build, then
 * sync-includes runs after it.
 *
 * Modes:
 *   node scripts/build-cost-index-pages.mjs                  # write all gated ingredients + hub
 *   node scripts/build-cost-index-pages.mjs --only=romaine-lettuce   # write a subset + hub
 *   node scripts/build-cost-index-pages.mjs --check          # diff-only, exit 1 on drift
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const require    = createRequire(import.meta.url);
// Reuse the shared, no-DOM inline-SVG sparkline primitive (the same one
// Cost Pulse + the audits tool ship) rather than forking a renderer.
const MuntinSparkline = require(path.join(repoRoot, 'tools/_shared/sparkline.js'));
// ONE shared verdict voice — the same module the Cost Pulse dashboard uses, so
// the static pages, the hub, and the live tool can never disagree (a thin-data
// "structural" reads "Watch", not "Re-price", on every surface).
const MuntinCostVerdict = require(path.join(repoRoot, 'tools/_shared/cost-verdict.js'));
// Level/trend confidence split + the shippable bar — so a solid multi-market
// price isn't buried under a noisy trend's "low", and nothing apologetic ships.
const MuntinCostConfidence = require(path.join(repoRoot, 'tools/_shared/cost-confidence.js'));
const checkMode  = process.argv.includes('--check');
const onlyArg    = (process.argv.find((a) => a.startsWith('--only=')) || '').slice('--only='.length);
const ONLY       = onlyArg ? new Set(onlyArg.split(',').map((s) => s.trim()).filter(Boolean)) : null;

// ---- Shared chrome helpers (mirrors build-ingredient-yield-pages.mjs) ----
function shellHash(name) {
  const abs = path.join(repoRoot, 'assets', name);
  const h = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
  return h.slice(0, 12);
}
const SHELL_HASH = { core: shellHash('site-core.css'), article: shellHash('site-article.css') };

function normalizeBatchBanner(html) {
  return html
    .replace(/<!-- batch-banner:start -->[\s\S]*?<!-- batch-banner:end -->/, '<!-- batch-banner:start --><!-- batch-banner:end -->')
    .replace(/<!-- lazy-load:site -->[\s\S]*?<!-- \/lazy-load:site -->/g, '<!--script:site-->')
    .replace(/<script\s+src="\/assets\/site\.js(?:\?v=[^"]*)?"\s+defer><\/script>/g, '<!--script:site-->');
}

const _DESC_NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', hellip: '…', deg: '°' };
function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function clampDesc(text, max = 155) {
  const s = String(text == null ? '' : text)
    .replace(/&#39;/g, '’')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => (_DESC_NAMED[n] !== undefined ? _DESC_NAMED[n] : m))
    .replace(/\s+/g, ' ').trim();
  if ([...s].length <= max) return s;
  const cut = [...s].slice(0, max - 1).join('');
  const lastSpace = cut.lastIndexOf(' ');
  let head = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  head = head.replace(/[\s.,;:!?\-–—("'“”‘’]+$/u, '').trim();
  return head + '…';
}
function money(cents) { return '$' + (Math.round(cents) / 100).toFixed(2); }

// ---- Data ----------------------------------------------------------
const CI = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index.json'), 'utf8')); }
  catch { return { ingredients: {}, drivers: {} }; }
})();
const COST_INDEX = CI.ingredients || {};
const DRIVERS = CI.drivers || {};
const LABELS_DOC  = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index-labels.json'), 'utf8')); }
  catch { return { labels: {}, drivers: {} }; }
})();
const LABELS  = LABELS_DOC.labels || {};
const DRIVER_LABELS = LABELS_DOC.drivers || {};

// ---- Pressure (inferred outlook) layer -----------------------------
const PRESSURE = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-pressure.json'), 'utf8')); }
  catch { return { items: {} }; }
})();
const PRESSURE_ITEMS = PRESSURE.items || {};
const PRESSURE_RULES = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/pressure-rules.json'), 'utf8')); }
  catch { return { sources: {} }; }
})();
const PRESSURE_SOURCES = PRESSURE_RULES.sources || {};
const INDICATOR_NAME = {
  'feed-futures':              { en: 'Feed (corn/soy) futures', es: 'Futuros de forraje (maíz/soya)' },
  'broiler-placements':        { en: 'Broiler chick placements', es: 'Colocación de pollitos' },
  'cattle-on-feed-placements': { en: 'Cattle-on-feed placements', es: 'Ganado en engorda (colocaciones)' },
  'hogs-market-supply':        { en: 'Market-hog supply', es: 'Oferta de cerdos de mercado' },
  'cold-storage-poultry':      { en: 'Cold-storage stocks', es: 'Inventario en frío' },
  'cold-storage-beef':         { en: 'Cold-storage stocks', es: 'Inventario en frío' },
  'cold-storage-pork':         { en: 'Cold-storage stocks', es: 'Inventario en frío' },
  'cold-storage-butter':       { en: 'Cold-storage stocks', es: 'Inventario en frío' },
  'cold-storage-cheese':       { en: 'Cold-storage stocks', es: 'Inventario en frío' },
  'milk-production':           { en: 'Milk production', es: 'Producción de leche' },
  'ams-shipments':             { en: 'Produce shipments', es: 'Envíos de producto' },
  'freeze-alert':              { en: 'Freeze warnings', es: 'Alertas de helada' },
  'drought-ca-az':             { en: 'Drought (CA/AZ)', es: 'Sequía (CA/AZ)' },
  'drought-fl-ca':             { en: 'Drought (FL/CA)', es: 'Sequía (FL/CA)' },
  'drought':                   { en: 'Drought (growing regions)', es: 'Sequía (regiones de cultivo)' },
  'crop-condition':            { en: 'Crop condition', es: 'Condición del cultivo' },
  'diesel':                    { en: 'Diesel / freight', es: 'Diésel / flete' }
};
function sourceShort(key) {
  if (!key) return '';
  if (key.indexOf('nass') === 0) return 'USDA NASS';
  if (key.indexOf('ams') === 0) return 'USDA AMS';
  if (key.indexOf('ers') === 0) return 'USDA ERS';
  if (key.indexOf('eia') === 0) return 'EIA';
  if (key.indexOf('usdm') === 0) return 'US Drought Monitor';
  if (key.indexOf('nws') === 0) return 'NWS';
  return key;
}

// Source-id prefix → { agency name, url } — derived map for citations.
const SOURCE_AGENCY = [
  [/^usda-ams/, { name: 'USDA Agricultural Marketing Service', url: 'https://www.ams.usda.gov/market-news' }],
  [/^usda-lmr/, { name: 'USDA Livestock, Poultry & Grain Market News', url: 'https://www.ams.usda.gov/market-news/livestock-poultry-grain' }],
  [/^bls/,      { name: 'U.S. Bureau of Labor Statistics', url: 'https://www.bls.gov/ppi/' }],
  [/^fred/,     { name: 'FRED, Federal Reserve Bank of St. Louis', url: 'https://fred.stlouisfed.org/' }],
  [/^eia/,      { name: 'U.S. Energy Information Administration', url: 'https://www.eia.gov/' }],
  [/^noaa/,     { name: 'NOAA Fisheries', url: 'https://www.fisheries.noaa.gov/' }]
];
const CI_SOURCE_SHORT = { 'usda-ams': 'USDA AMS', 'usda-lmr': 'USDA LMR', bls: 'BLS', fred: 'FRED', eia: 'EIA', noaa: 'NOAA Fisheries' };
function agencyFor(srcId) {
  for (const [re, a] of SOURCE_AGENCY) if (re.test(srcId)) return a;
  return null;
}
function shortSource(srcId) {
  for (const k of Object.keys(CI_SOURCE_SHORT)) if (srcId.startsWith(k)) return CI_SOURCE_SHORT[k];
  return srcId;
}
// Distinct agencies that contributed to a point's level + the history series.
function citedAgencies(entry, point) {
  const ids = new Set();
  (point.provenance || []).forEach((p) => p.source && ids.add(p.source));
  (entry.history || []).forEach((h) => h.source && ids.add(h.source));
  const out = [];
  const seen = new Set();
  for (const id of ids) {
    const a = agencyFor(id);
    if (a && !seen.has(a.name)) { seen.add(a.name); out.push(a); }
  }
  return out;
}

// Display unit phrasing. unitText for schema uses the long noun form.
const UNIT_LONG = { lb: 'pound', carton: 'carton', sack: 'sack', dozen: 'dozen', case: 'case', head: 'head', each: 'each' };
function unitLong(u) { return UNIT_LONG[u] || u; }

// ---- Ingredient → category map -------------------------------------
const CATEGORIES = {
  beef:       { en: 'Beef',          es: 'Res' },
  poultry:    { en: 'Poultry',       es: 'Aves' },
  pork:       { en: 'Pork',          es: 'Cerdo' },
  seafood:    { en: 'Seafood',       es: 'Pescados y mariscos' },
  produce:    { en: 'Produce',       es: 'Frutas y verduras' },
  'dairy-eggs': { en: 'Dairy & eggs', es: 'Lácteos y huevo' },
  pantry:     { en: 'Pantry',        es: 'Despensa' }
};
// category key, plus the upstream drivers (association, never cause) we
// name in "why it matters", and a one-line "what moves it" note.
const ING_META = {
  'ribeye':          { cat: 'beef',       drivers: ['corn', 'soybeans', 'diesel'] },
  'beef-tenderloin': { cat: 'beef',       drivers: ['corn', 'soybeans', 'diesel'] },
  'chicken-breast':  { cat: 'poultry',    drivers: ['corn', 'soybeans', 'diesel'] },
  'whole-chicken':   { cat: 'poultry',    drivers: ['corn', 'soybeans', 'diesel'] },
  'pork-loin':       { cat: 'pork',       drivers: ['corn', 'soybeans', 'diesel'] },
  'pork-shoulder':   { cat: 'pork',       drivers: ['corn', 'soybeans', 'diesel'] },
  'salmon-fillet':   { cat: 'seafood',    drivers: ['diesel'] },
  'shrimp':          { cat: 'seafood',    drivers: ['diesel'] },
  'romaine-lettuce': { cat: 'produce',    drivers: ['diesel'] },
  'tomato':          { cat: 'produce',    drivers: ['diesel'] },
  'onion':           { cat: 'produce',    drivers: ['diesel'] },
  'russet-potato':   { cat: 'produce',    drivers: ['diesel'] },
  'butter':          { cat: 'dairy-eggs', drivers: ['corn', 'soybeans', 'diesel'] },
  'cheddar-cheese':  { cat: 'dairy-eggs', drivers: ['corn', 'soybeans', 'diesel'] },
  'eggs':            { cat: 'dairy-eggs', drivers: ['corn', 'soybeans', 'diesel'] },
  'vegetable-oil':   { cat: 'pantry',     drivers: ['soybeans', 'diesel'] }
};
// Hub display order, grouped by category.
const CATEGORY_ORDER = ['beef', 'poultry', 'pork', 'seafood', 'produce', 'dairy-eggs', 'pantry'];

// The pages we can build: an ingredient with at least a points[0] entry
// (i.e. past the fact gate), present in ING_META and LABELS.
function gatedSlugs() {
  return Object.keys(ING_META).filter((slug) => {
    const e = COST_INDEX[slug];
    return e && Array.isArray(e.points) && e.points[0] && LABELS[slug];
  });
}

// ---- Reading helpers (level / trend / confidence) ------------------
function readingOf(slug) {
  const entry = COST_INDEX[slug];
  const point = entry && Array.isArray(entry.points) && entry.points[0];
  if (!point) return null;
  const lvl = point.level || null;
  const rc = lvl && Array.isArray(lvl.rangeCents) ? lvl.rangeCents : null;
  const conf = point.confidence || 'low';
  const trend = point.trend || {};
  const hist = Array.isArray(entry.history) ? entry.history : [];
  // Confidence is split: a measured wholesale LEVEL stands on its own even when
  // the week-to-week TREND is choppy. The number renders by LEVEL confidence
  // (not the headline min), so a solid 8-market range reads as the fact it is.
  const levelConf = MuntinCostConfidence.levelConfidence(lvl);
  const trendConf = MuntinCostConfidence.trendConfidence(trend);
  const distinctRange = !!(rc && rc[0] !== rc[1]);
  const emitPoint = (levelConf === 'high' || levelConf === 'medium') && !!lvl && rc != null;
  const emitRange = emitPoint || (levelConf === 'low' && distinctRange);
  return { entry, point, lvl, rc, conf, levelConf, trendConf, trend, hist, distinctRange, emitPoint, emitRange,
    basis: (lvl && lvl.basis) || 'wholesale', asOf: point.asOf || null };
}

function dirWord(trend, locale) {
  const es = locale === 'es';
  if (trend.dir === 'up')   return es ? 'al alza' : 'up';
  if (trend.dir === 'down') return es ? 'a la baja' : 'down';
  return es ? 'casi estable' : 'about flat';
}

// ---- The spike-vs-structural verdict, as a calibrated SUGGESTION ----
// Delegates to the shared, confidence-aware MuntinCostVerdict so the static
// pages, the hub, and the Cost Pulse dashboard speak identically — a thin-data
// "structural" reads "Watch", not "Re-price", on every surface. The chip is
// the terse action; the note is the calibrated reason. The flag is a build-
// time, fact-gated qualitative read — no sourced numbers live here.
const TONE_BIAS = { hold: 'hold', watch: 'watch', reprice: 're-price' };
const TONE_LABEL = {
  'hold':     { en: 'Hold',     es: 'Mantener' },
  'watch':    { en: 'Watch',    es: 'Vigilar' },
  're-price': { en: 'Re-price', es: 'Re-precificar' }
};
function verdictChip(v, locale) {
  const bias = TONE_BIAS[v.tone] || 'watch';
  const lab = TONE_LABEL[bias];
  return `<span class="ci-read__verb" data-bias="${bias}">${lab[locale === 'es' ? 'es' : 'en']}</span>`;
}
function verdictLine(flag, confidence, locale) {
  const v = MuntinCostVerdict.verdict(flag, confidence);
  if (!v) return '';
  const es = locale === 'es';
  return `
    <p class="ci-read__verdict">${verdictChip(v, locale)}${es ? v.note_es : v.note_en}</p>`;
}

// ---- Hub "what's moving now" + per-card action chip ----------------
// Same shared verdict + confidence, so the hub never disagrees with the page
// it links to. Surfaces the ones worth a look (re-price, then watch) first.
const TONE_RANK = { reprice: 0, watch: 1, hold: 2 };
const MOVING_REASON = {
  reprice:      { en: 'elevated and sustained', es: 'elevado y sostenido' },
  structural:   { en: 'up, but the data is thin', es: 'sube, pero hay pocos datos' },
  emerging:     { en: 'a real move, not settled yet', es: 'un movimiento real, aún sin asentarse' },
  insufficient: { en: 'too new to call', es: 'demasiado nuevo para concluir' }
};
function hubFlag(slug) { return (COST_INDEX[slug] || {}).flag || null; }
function hubConf(slug) { const p = (COST_INDEX[slug] || {}).points; return (p && p[0] && p[0].confidence) || 'low'; }
function ingVerdict(slug) { return MuntinCostVerdict.verdict(hubFlag(slug), hubConf(slug)); }
function actionChip(slug, locale) { const v = ingVerdict(slug); return v ? verdictChip(v, locale) : ''; }
function reasonFor(slug, v, locale) {
  // reprice → firm structural; watch → name the underlying verdict honestly.
  const key = v.tone === 'reprice' ? 'reprice' : ((hubFlag(slug) || {}).verdict || 'insufficient');
  const r = MOVING_REASON[key] || MOVING_REASON.insufficient;
  return locale === 'es' ? r.es : r.en;
}
function movingNowSection(slugs, locale) {
  const es = locale === 'es';
  const rows = slugs
    .map((s) => ({ s, v: ingVerdict(s) }))
    .filter((x) => x.v && x.v.tone !== 'hold')   // surface watch + reprice
    .sort((a, b) => (TONE_RANK[a.v.tone] - TONE_RANK[b.v.tone]) || a.s.localeCompare(b.s));
  const head = es ? 'Qué se está moviendo ahora' : "What's moving now";
  if (!rows.length) {
    const calm = es
      ? `Nada exige acción esta semana — la mayoría de los ingredientes están en su rango habitual.`
      : `Nothing needs action this week — most ingredients are sitting in their usual range.`;
    return `<section class="ci-moving"><h2 class="ci-cat-h" id="moving">${head}</h2><p class="ci-moving-calm">${calm}</p></section>`;
  }
  const lis = rows.map((x) => {
    const l = LABELS[x.s] || {};
    const nm = (es ? (l.es || l.en) : l.en) || x.s;
    const base = es ? '/es' : '';
    return `<li class="ci-moving-item">${verdictChip(x.v, locale)}<a href="${base}/cost-index/${x.s}/">${escHtml(nm)}</a> <span class="ci-moving-reason">— ${escHtml(reasonFor(x.s, x.v, locale))}</span></li>`;
  }).join('');
  return `<section class="ci-moving"><h2 class="ci-cat-h" id="moving">${head}</h2><ul class="ci-moving-list">${lis}</ul></section>`;
}

// ---- History sparkline + "normally X–Y, right now Z" capsule -------
// Charts the gated history series the page already ships as series.json,
// so the trend the verdict asserts is visible, not just claimed. Numbers
// only when confidence supports them (same gate as the market-read line);
// the SVG carries a text alternative (role=img + aria-label) and a visible
// capsule, closing the WCAG 1.1.1 gap. "Usual range" is the ingredient's
// own tracked window — never implied as a seasonal/annual normal (which
// would need ≥1yr of history we don't claim).
function pctile(sorted, p) {
  if (!sorted.length) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p, lo = Math.floor(idx), hi = Math.ceil(idx);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}
function medOf(a) { const s = a.slice().sort((x, y) => x - y); const n = s.length, m = Math.floor(n / 2); return n % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function sparkBlock(r, locale) {
  const es = locale === 'es';
  if (!r.emitPoint) return '';   // qualitative-only confidence → no chart, no numbers
  const basis = r.basis;
  const vals = (r.entry.history || [])
    .filter((h) => h && h.basis === basis && typeof h.valueCents === 'number' && isFinite(h.valueCents) && h.valueCents > 0)
    .map((h) => h.valueCents);
  if (vals.length < 8) return '';   // too thin to chart an honest line
  const sorted = vals.slice().sort((a, b) => a - b);
  const lo = Math.round(pctile(sorted, 0.25)), hi = Math.round(pctile(sorted, 0.75));
  const now = vals[vals.length - 1];
  const pos = now < lo ? (es ? 'por debajo de su rango habitual — buena compra' : 'below its usual range — a good buy')
    : now > hi ? (es ? 'en la parte alta de su rango habitual' : 'top of its usual range')
    : (es ? 'dentro de su rango habitual' : 'inside its usual range');
  const half = Math.floor(vals.length / 2);
  const ch = (() => { const a = medOf(vals.slice(0, half)); const b = medOf(vals.slice(half)); return a > 0 ? (b - a) / a : 0; })();
  const shape = ch > 0.03 ? (es ? 'subió a lo largo de la ventana' : 'rose over the tracked window')
    : ch < -0.03 ? (es ? 'bajó a lo largo de la ventana' : 'eased over the tracked window')
    : (es ? 'se mantuvo estable en la ventana' : 'held steady over the tracked window');
  const windowNote = es ? 'en la ventana seguida' : 'over the tracked window';
  const capsule = es
    ? `Normalmente ${money(lo)}–${money(hi)}, ahora ${money(now)} — ${pos}.`
    : `Normally ${money(lo)}–${money(hi)}, right now ${money(now)} — ${pos}.`;
  // Percentile-of-history as a COUNT (never a smoothed "85th percentile"):
  // the figure operators repeat. Last ≤12 prior reads, honesty-gated like
  // the rest of the block.
  const recent = vals.slice(Math.max(0, vals.length - 13), vals.length - 1);
  const above = recent.filter((v) => now > v).length;
  const rank = recent.length >= 8
    ? (es ? `Más alto que ${above} de sus últimas ${recent.length} lecturas.` : `Higher than ${above} of its last ${recent.length} reads.`)
    : '';
  const alt = (es ? 'Precio ' : 'Price ') + shape + '. ' + capsule + (rank ? ' ' + rank : '');
  const svg = MuntinSparkline.render(vals, {
    width: 248, height: 46, stroke: '#2A50C8',
    baseline: Math.round(pctile(sorted, 0.5)),
    ariaLabel: alt
  });
  return `
    <div class="ci-read__spark">${svg}<p class="ci-read__capsule">${capsule}${rank ? ` <span class="ci-read__rank">${rank}</span>` : ''} <span class="ci-read__capsule-note">(${windowNote})</span></p></div>`;
}

// ---- The visible "Market read" data block --------------------------
function marketReadBlock(slug, locale) {
  const r = readingOf(slug);
  if (!r) return '';
  const es = locale === 'es';
  const verdict = verdictLine(r.entry.flag, r.conf, locale);
  const spark = sparkBlock(r, locale);
  const lab = LABELS[slug] || {};
  const unit = es ? (lab.unit_es || lab.unit_en) : lab.unit_en;
  const unitSfx = unit ? '/' + unit : '';
  const basisRef = es
    ? ({ wholesale: 'referencia mayorista', retail: 'referencia minorista', delivered: 'precio entregado' }[r.basis] || 'referencia')
    : ({ wholesale: 'wholesale reference', retail: 'retail reference', delivered: 'delivered' }[r.basis] || 'reference');
  const asOf = r.asOf || '—';
  const head = es ? 'Lectura de mercado' : 'Market read';
  const nMk = (r.lvl && r.lvl.nFamilies) || 0;
  const measured = !!(r.lvl && r.lvl.rangeBasis === 'markets' && nMk >= 3);
  const srcNote = measured
    ? (es ? ` en ${nMk} mercados USDA` : ` across ${nMk} USDA markets`)
    : (es ? ', un mercado USDA' : ', single USDA market');
  // The LEVEL — a dated, sourced wholesale fact (not "low"): a measured
  // multi-market range, or a single authoritative market.
  let line, hasNumber = false;
  if (r.emitRange && r.distinctRange) {
    line = es
      ? `Alrededor de ${money(r.rc[0])}–${money(r.rc[1])}${unitSfx} (${basisRef}${srcNote}), al ${asOf}.`
      : `About ${money(r.rc[0])}–${money(r.rc[1])}${unitSfx} (${basisRef}${srcNote}), as of ${asOf}.`;
    hasNumber = true;
  } else if (r.emitPoint && r.rc) {
    line = es
      ? `Alrededor de ${money(r.rc[0])}${unitSfx} (${basisRef}${srcNote}), al ${asOf}.`
      : `About ${money(r.rc[0])}${unitSfx} (${basisRef}${srcNote}), as of ${asOf}.`;
    hasNumber = true;
  } else {
    // Defensive only — the shippable-bar gate keeps no-level items off the site.
    const dw = r.trend.dir ? dirWord(r.trend, locale) : null;
    line = es
      ? `${dw ? 'Tendencia ' + dw : 'Sin tendencia clara'} en la ventana reciente.`
      : `${dw ? 'Trending ' + dw : 'No clear trend'} over the recent window.`;
  }
  // The TREND — its own honesty. A firm trend states the move; a low-confidence
  // one is a hint with no number flaunted.
  let trendLine = '';
  if (hasNumber && typeof r.trend.pct === 'number' && r.trendConf) {
    const dirw = dirWord(r.trend, locale);
    if (r.trendConf === 'low') {
      trendLine = `<p class="ci-read__trend">${es
        ? `Tendencia ${dirw} en la ventana — pero las fuentes no coinciden; tómalo como una pista, no una cifra firme.`
        : `Trend ${dirw} over the window — but the sources disagree; read it as a hint, not a firm move.`}</p>`;
    } else {
      const pctTxt = `${(r.trend.pct >= 0 ? '+' : '')}${(r.trend.pct * 100).toFixed(1).replace(/\.0$/, '')}%`;
      trendLine = `<p class="ci-read__trend">${es
        ? `Tendencia: ${dirw} ${pctTxt} en la ventana reciente.`
        : `Trend: ${dirw} ${pctTxt} over the recent window.`}</p>`;
    }
  }
  // Badge carries the LEVEL's own confidence (what the number is worth), dated.
  const badgeConf = hasNumber ? r.levelConf : r.conf;
  const confWord = es ? ({ high: 'alta', medium: 'media', low: 'baja', directional: 'direccional' }[badgeConf] || badgeConf) : badgeConf;
  const badge = `${es ? 'confianza' : 'confidence'} ${confWord} · ${es ? 'al' : 'as of'} ${asOf}`;
  const agencies = citedAgencies(r.entry, r.point);
  const shortList = [...new Set((r.point.provenance || []).map((p) => shortSource(p.source)))];
  const disclaimer = r.basis === 'retail'
    ? (es ? 'Referencia minorista, no el precio mayorista ni el entregado que pagas.' : 'Retail reference, not the wholesale or delivered price you pay.')
    : (es ? 'Referencia mayorista, no el precio entregado que pagas.' : 'Wholesale reference, not the delivered price you pay.');
  const srcBody = `${(shortList.length ? shortList.join(' · ') : agencies.map((a) => a.name).join(' · '))} — ${es ? 'datos públicos' : 'public data'}, ${es ? 'al' : 'as of'} ${asOf}. ${disclaimer}`;
  const liveLabel = es ? `Ver ${(lab.es || lab.en || slug).toLowerCase()} en vivo en Cost Pulse` : `See ${(lab.en || slug).toLowerCase()} live in Cost Pulse`;
  return `
  <aside class="ci-read" data-layer="measured" aria-label="${es ? 'Lectura de mercado' : 'Market read'}">
    <p class="ci-read__head">${head}<span class="ci-read__badge">${badge}</span></p>
    <p class="ci-read__line">${line}</p>${trendLine}${verdict}${spark}
    <details class="ci-read__src"><summary>${es ? 'Fuentes' : 'Sources'} · ${(shortList.length || agencies.length)}</summary><div>${srcBody}</div></details>
    <p class="ci-read__live"><a href="${es ? '/es' : ''}/tools/cost-pulse/#ci-${slug}">${liveLabel} <span aria-hidden="true">→</span></a></p>
  </aside>`;
}

// ---- Series distribution files (JSON + CSV from history) ------------
function seriesJson(slug) {
  const entry = COST_INDEX[slug];
  const hist = (entry && Array.isArray(entry.history)) ? entry.history : [];
  const lab = LABELS[slug] || {};
  const point = entry && entry.points && entry.points[0];
  const obj = {
    ingredient: slug,
    name: lab.en || slug,
    unit: lab.unit_en || null,
    basis: (point && point.level && point.level.basis) || 'wholesale',
    currency: 'USD',
    note: 'Wholesale reference prices compiled from public U.S. market sources (USDA AMS/LMR, BLS, FRED, EIA, NOAA). Values are in US dollars per unit. Not a delivered or retail price. Source: muntin.digital/cost-index/' + slug + '/',
    asOf: (point && point.asOf) || null,
    observations: hist.map((h) => ({ date: h.date, priceUsd: +(h.valueCents / 100).toFixed(2), source: h.source || null }))
  };
  return JSON.stringify(obj, null, 2) + '\n';
}
function seriesCsv(slug) {
  const entry = COST_INDEX[slug];
  const hist = (entry && Array.isArray(entry.history)) ? entry.history : [];
  const rows = ['date,price_usd,unit,basis,source'];
  const lab = LABELS[slug] || {};
  const unit = lab.unit_en || '';
  const point = entry && entry.points && entry.points[0];
  const basis = (point && point.level && point.level.basis) || 'wholesale';
  for (const h of hist) rows.push(`${h.date},${(h.valueCents / 100).toFixed(2)},${unit},${basis},${h.source || ''}`);
  return rows.join('\n') + '\n';
}

// ---- JSON-LD: per-ingredient Dataset graph -------------------------
function emitIngredientJsonLd(slug, locale) {
  const r = readingOf(slug);
  const lab = LABELS[slug] || {};
  const es = locale === 'es';
  const base = es ? '/es' : '';
  const url = `https://muntin.digital${base}/cost-index/${slug}/`;
  const enName = lab.en || slug;
  const esName = lab.es || enName;
  const name = es ? esName : enName;
  const unitText = `USD per ${unitLong(lab.unit_en || 'unit')}`;
  const hist = r ? r.hist : [];
  const temporal = hist.length ? `${hist[0].date}/${hist[hist.length - 1].date}` : undefined;
  const agencies = r ? citedAgencies(r.entry, r.point) : [];

  // variableMeasured PropertyValue, degraded by confidence.
  const pv = {
    '@type': 'PropertyValue',
    'name': `Wholesale price, ${enName}`,
    'unitText': unitText
  };
  if (r && r.emitPoint) {
    pv.value = +(r.lvl.medianCents / 100).toFixed(2);
    if (r.distinctRange) { pv.minValue = +(r.rc[0] / 100).toFixed(2); pv.maxValue = +(r.rc[1] / 100).toFixed(2); }
  } else if (r && r.emitRange && r.distinctRange) {
    pv.minValue = +(r.rc[0] / 100).toFixed(2); pv.maxValue = +(r.rc[1] / 100).toFixed(2);
    pv.description = 'Low confidence — interquartile range shown, no point estimate.';
  } else {
    pv.description = 'Directional read only — insufficient source agreement to publish a point estimate.';
  }
  if (r && r.trend && r.trend.dir) {
    pv.valueReference = {
      '@type': 'PropertyValue', 'name': 'trend', 'value': r.trend.dir,
      'description': `Direction over the tracked window; confidence: ${r.conf}.`
    };
  }

  const dataset = {
    '@type': 'Dataset',
    '@id': url + '#dataset',
    'name': es ? `${esName} — precio mayorista de referencia` : `${enName} wholesale price index`,
    'alternateName': es ? `${enName} wholesale price index` : `${esName} — precio mayorista`,
    'description': es
      ? `Precio mayorista de referencia para ${esName.toLowerCase()} (por ${lab.unit_es || lab.unit_en}), combinado de fuentes públicas de mercado de EE. UU. y mostrado como un rango típico con su tendencia. Para que un restaurante distinga un movimiento de mercado de un sobreprecio de proveedor.`
      : `Wholesale reference price for ${enName.toLowerCase()} (per ${lab.unit_en}), blended from public U.S. market sources and shown as a typical range with a trend. Built for restaurant operators to tell a market move from a vendor markup.`,
    'url': url,
    'mainEntityOfPage': url,
    'inLanguage': es ? 'es-US' : 'en-US',
    'isAccessibleForFree': true,
    'license': 'https://creativecommons.org/publicdomain/zero/1.0/',
    'creditText': 'Muntin Digital, compiled from public USDA, BLS, FRED and EIA market data.',
    'keywords': [
      `${enName.toLowerCase()} price`, 'wholesale food prices', 'restaurant food cost', 'USDA market news'
    ],
    'variableMeasured': pv,
    'measurementTechnique': 'Composite of public wholesale market prices; median and 25th–75th percentile range across contributing sources. Different price bases are never averaged into one number.',
    'creator': { '@type': 'Person', '@id': 'https://muntin.digital/#don-goldstein', 'name': 'Don Goldstein', 'url': 'https://muntin.digital/about/' },
    'publisher': { '@id': 'https://muntin.digital/#business' },
    'includedInDataCatalog': { '@id': 'https://muntin.digital/cost-index/#catalog' },
    'distribution': [
      { '@type': 'DataDownload', 'name': `${enName} price history (JSON)`, 'encodingFormat': 'application/json', 'contentUrl': `https://muntin.digital/cost-index/${slug}/series.json` },
      { '@type': 'DataDownload', 'name': `${enName} price history (CSV)`, 'encodingFormat': 'text/csv', 'contentUrl': `https://muntin.digital/cost-index/${slug}/series.csv` }
    ]
  };
  if (r && r.asOf) { dataset.dateModified = r.asOf; dataset.datePublished = r.asOf; }
  if (temporal) dataset.temporalCoverage = temporal;
  if (agencies.length) {
    dataset.citation = agencies.map((a) => a.url);
    dataset.isBasedOn = agencies.map((a) => ({ '@type': 'Organization', 'name': a.name, 'url': a.url }));
  }

  const crumb = es
    ? [['Inicio', 'https://muntin.digital/es/'], ['Índice de costos', 'https://muntin.digital/es/cost-index/'], [esName, url]]
    : [['Home', 'https://muntin.digital/'], ['Cost index', 'https://muntin.digital/cost-index/'], [enName, url]];

  const faq = faqItems(slug, locale).map((f) => ({
    '@type': 'Question', 'name': f.q, 'acceptedAnswer': { '@type': 'Answer', 'text': f.a }
  }));

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      dataset,
      { '@type': 'BreadcrumbList', '@id': url + '#breadcrumbs', 'itemListElement': crumb.map((c, i) => ({ '@type': 'ListItem', 'position': i + 1, 'name': c[0], 'item': c[1] })) },
      { '@type': 'FAQPage', '@id': url + '#faq', 'inLanguage': es ? 'es-US' : 'en-US', 'mainEntity': faq }
    ]
  });
}

// ---- FAQ (number-free; visible text byte-matches the JSON-LD) -------
function faqItems(slug, locale) {
  const es = locale === 'es';
  const lab = LABELS[slug] || {};
  const name = (es ? (lab.es || lab.en) : lab.en) || slug;
  const lc = name.toLowerCase();
  const unit = (es ? (lab.unit_es || lab.unit_en) : lab.unit_en) || (es ? 'unidad' : 'unit');
  const meta = ING_META[slug] || { drivers: [] };
  const driverNames = (meta.drivers || []).map((d) => ((es ? (DRIVER_LABELS[d] && DRIVER_LABELS[d].es) : (DRIVER_LABELS[d] && DRIVER_LABELS[d].en)) || d).toLowerCase());
  const driverPhrase = driverNames.length
    ? (es ? driverNames.join(', ') : driverNames.join(', '))
    : (es ? 'el combustible' : 'fuel');
  if (es) {
    return [
      { q: `¿Cuánto cuesta ${lc} al mayoreo ahora mismo?`, a: `Cambia semana a semana. La lectura de mercado de arriba muestra el rango típico actual y la fecha detrás del dato; compárala con tu propia factura.` },
      { q: `¿Por qué subió el precio de ${lc}?`, a: `Puede ser todo el mercado o un solo proveedor. El rango te dice cuál: si tu precio queda dentro del rango, el mercado se movió; si queda muy por encima, es conversación de proveedor. Suele moverse junto con ${driverPhrase} — asociación, no causa directa.` },
      { q: `¿En qué unidad se cotiza ${lc}?`, a: `Se cotiza por ${unit} como referencia mayorista — no es el precio entregado que pagas, así que compara con tu factura en la misma unidad.` },
      { q: `¿Estoy pagando de más por ${lc}?`, a: `Pon tu precio sobre el rango típico de arriba. Debajo del rango es buen trato; dentro es normal; por encima del rango vale una conversación con el proveedor.` }
    ];
  }
  return [
    { q: `What does ${lc} cost wholesale right now?`, a: `It moves week to week. The market read above shows the current typical range and the date behind it; read it against your own invoice.` },
    { q: `Why did my ${lc} price jump?`, a: `It can be the whole market or a single vendor. The range tells you which: if your price lands inside the range, the market moved; well above the range is a vendor conversation. It tends to move with ${driverPhrase} — association, not direct cause.` },
    { q: `What unit is ${lc} priced in?`, a: `It trades per ${unit} as a wholesale reference — not the delivered price you pay, so compare against your invoice in the same unit.` },
    { q: `Am I overpaying for ${lc}?`, a: `Place your own price on the typical range above. Below the range is a good deal; inside is normal; above the range is worth a vendor conversation.` }
  ];
}

// ---- Page head (skeleton chrome; sync-includes expands the nav) -----
function pageHead(opts) {
  const { lang, locale, title, desc, canonEn, canonEs, jsonld, extraCss } = opts;
  const canon = locale === 'es' ? canonEs : canonEn;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(clampDesc(desc))}" />
<meta name="theme-color" content="#2A50C8" />
<link rel="canonical" href="${canon}" />
<link rel="alternate" hreflang="en" href="${canonEn}" />
<link rel="alternate" hreflang="es" href="${canonEs}" />
<link rel="alternate" hreflang="x-default" href="${canonEn}" />
<meta property="og:locale" content="${locale === 'es' ? 'es_US' : 'en_US'}" />
<meta property="og:locale:alternate" content="${locale === 'es' ? 'en_US' : 'es_US'}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escHtml(title)}" />
<meta property="og:description" content="${escHtml(clampDesc(desc))}" />
<meta property="og:url" content="${canon}" />
<meta property="og:site_name" content="Muntin Digital" />
<meta property="og:image" content="https://muntin.digital/brand/og/tool-cost-pulse.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escHtml(title)}" />
<meta name="twitter:description" content="${escHtml(clampDesc(desc))}" />
<meta name="twitter:image" content="https://muntin.digital/brand/og/tool-cost-pulse.png" />
<link rel="icon" type="image/svg+xml" sizes="any" href="/brand/mark/mark-square-ink.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/brand/favicons/android-chrome-192x192.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/brand/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/brand/favicons/site.webmanifest" />
<script type="application/ld+json">${jsonld}</script>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/fraunces-v38-latin-500.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/inter-v20-latin-regular.woff2" crossorigin>
<style>
:root{--cream:#F6F7F8;--cream-2:#EDEEF1;--ink:#16181D;--ink-soft:#4A4F59;--teal:#2A50C8;--white:#fff;--line:#E3E5E9;--font-display:'Fraunces',Georgia,serif;--max:1200px;--pad-x:clamp(20px,4vw,64px)}
html{box-sizing:border-box}*,*:before,*:after{box-sizing:inherit}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--cream);line-height:1.6;font-size:17px;-webkit-font-smoothing:antialiased}
.container{max-width:var(--max);margin:0 auto;padding-inline:var(--pad-x)}
.skip-link{position:absolute;left:-9999px;top:0}
.skip-link:focus{position:static;display:inline-block;background:#16181D;color:#F6F7F8;padding:12px 16px;z-index:100}
a{color:inherit}
.btn{display:inline-flex;align-items:center;gap:10px;padding:15px 26px;border-radius:999px;font-weight:500;font-size:15px;text-decoration:none;white-space:nowrap;cursor:pointer}
.btn-primary{background:var(--ink);color:var(--cream)}
.btn-ghost{background:transparent;color:var(--ink);border:1px solid #D7DAE0}
header.nav{min-height:64px}
.nav{position:fixed;top:0;left:0;right:0;background:var(--cream);z-index:50;border-bottom:1px solid #E3E5E9}
.nav-inner{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:64px;padding:12px 0}
.logo{display:flex;align-items:center;gap:10px;font-family:Georgia,serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;flex-shrink:0;white-space:nowrap;color:inherit;text-decoration:none}
.logo-mark{width:28px;height:28px;flex:0 0 28px}
.nav-links{display:flex;gap:36px;font-size:15px}
.nav-toggle{display:none}
.nav-search-btn,.lang-switch{display:none}
@media (max-width:1100px){.nav-links{display:none}}
main{padding-top:64px}
.breadcrumb{font-size:13px;color:var(--ink-soft);margin:24px 0 0}
.breadcrumb a{color:var(--ink-soft);text-decoration:none;border-bottom:1px dashed currentColor}
.breadcrumb a:hover{color:var(--teal)}
.ci-hero{padding:40px 0 8px}
.ci-eyebrow{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--teal);margin:0 0 10px}
.ci-eyebrow a{color:var(--teal);text-decoration:none}
.ci-hero h1{font-family:var(--font-display);font-size:clamp(30px,5vw,46px);font-weight:500;line-height:1.12;color:var(--ink);margin:0 0 14px}
.ci-lede{font-size:18px;line-height:1.6;color:var(--ink);margin:0;max-width:720px}
.ci-body{margin:8px auto 0;max-width:760px}
.ci-body h2{font-family:var(--font-display);font-size:clamp(20px,3vw,26px);font-weight:500;color:var(--ink);margin:34px 0 10px;line-height:1.2}
.ci-body p{margin:0 0 16px;font-size:16px;line-height:1.7}
.ci-body ol,.ci-body ul{margin:0 0 16px;padding-left:22px;font-size:16px;line-height:1.7}
.ci-body li{margin:0 0 8px}
.ci-read{margin:22px 0 8px;padding:18px 20px;background:var(--cream-2);border:1px solid var(--line);border-left:4px solid var(--teal);border-radius:12px;font-variant-numeric:tabular-nums}
.ci-read__head{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--teal);margin:0 0 6px}
.ci-read__badge{font-weight:600;text-transform:none;letter-spacing:0;font-size:12px;color:var(--ink-soft);margin-left:8px}
.ci-read__line{font-size:16px;line-height:1.55;color:var(--ink);margin:0}
.ci-read__trend{margin:6px 0 0;font-size:14.5px;line-height:1.5;color:var(--ink-soft)}
.ci-read__verdict{margin:10px 0 0;font-size:15px;line-height:1.5;color:var(--ink)}
.ci-read__verb{display:inline-block;font-weight:700;font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:2px 8px;border-radius:999px;margin-right:8px;vertical-align:1px;background:var(--cream);border:1px solid var(--line);color:var(--ink-soft)}
.ci-read__verb[data-bias="hold"]{color:#2A50C8;border-color:#2A50C8}
.ci-read__verb[data-bias="watch"]{color:#8a6d1f;border-color:#cdb368}
.ci-read__verb[data-bias="re-price"]{color:#A23B2D;border-color:#A23B2D}
.ci-read__spark{margin:12px 0 0;display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px}
.ci-read__spark .mtn-spark{flex:0 0 auto;overflow:visible}
.ci-read__capsule{margin:0;font-size:14.5px;line-height:1.45;color:var(--ink)}
.ci-read__capsule-note{color:var(--ink-soft);font-size:12.5px}
.ci-read__rank{color:var(--ink-soft)}
.ci-why{margin:14px 0 8px;padding:14px 18px;background:var(--white);border:1px solid var(--line);border-radius:12px}
.ci-why__head{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);margin:0 0 6px}
.ci-why__line{font-size:15px;line-height:1.55;color:var(--ink);margin:0}
.ci-read__src{margin-top:8px;font-size:12.5px}
.ci-read__src summary{cursor:pointer;color:var(--ink-soft);font-weight:600}
.ci-read__src div{margin-top:6px;color:var(--ink-soft);line-height:1.5}
.ci-read__live{margin:10px 0 0;font-size:14px}
.ci-read__live a{color:var(--teal);text-decoration:none;font-weight:600;border-bottom:1px dashed currentColor}
.ci-faq{margin:34px 0 0}
.ci-faq__item{margin:0 0 18px}
.ci-faq__q{font-family:var(--font-display);font-size:17px;font-weight:600;color:var(--ink);margin:0 0 6px}
.ci-faq__a{font-size:15.5px;line-height:1.65;color:var(--ink-soft);margin:0}
.ci-sibs{margin:30px 0 0;font-size:14px;color:var(--ink-soft)}
.ci-sibs-label{display:inline-block;font-weight:700;text-transform:uppercase;letter-spacing:.04em;font-size:11px;margin-right:8px}
.ci-sibs a{color:var(--teal);text-decoration:none;border-bottom:1px dashed currentColor}
.ci-cta-row{display:flex;flex-wrap:wrap;gap:12px;margin:30px 0 8px}
.ci-source{font-size:12.5px;color:var(--ink-soft);margin:24px 0 40px}
.ci-source a{color:var(--teal);text-decoration:none;border-bottom:1px dashed currentColor}
.ci-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));margin:14px 0 0}
.ci-card{padding:16px 18px;background:var(--white);border:1px solid var(--line);border-radius:10px}
.ci-card a{font-family:var(--font-display);font-size:17px;color:var(--ink);text-decoration:none}
.ci-card a:hover{color:var(--teal)}
.ci-card-note{display:block;font-size:13px;color:var(--ink-soft);margin-top:4px}
.ci-cat-h{font-family:var(--font-display);font-size:16px;color:var(--ink-soft);margin:30px 0 0;text-transform:uppercase;letter-spacing:.04em;font-weight:600}
.ci-card-action{margin-top:10px}
.ci-moving{margin:20px 0 8px;padding:16px 20px;background:var(--cream-2);border:1px solid var(--line);border-left:4px solid var(--teal);border-radius:12px}
.ci-moving .ci-cat-h{margin:0 0 10px}
.ci-moving-list{list-style:none;margin:0;padding:0}
.ci-moving-item{margin:0 0 8px;font-size:15.5px;line-height:1.5}
.ci-moving-item a{color:var(--ink);text-decoration:none;font-weight:600;border-bottom:1px dashed var(--line)}
.ci-moving-item a:hover{color:var(--teal)}
.ci-moving-reason{color:var(--ink-soft);font-size:14px}
.ci-moving-calm{margin:0;font-size:15.5px;color:var(--ink)}
.ci-card--pending{opacity:.72;background:var(--cream-2)}
.ci-card--pending a{color:var(--ink-soft)}
.ci-pending-note{font-size:13.5px;color:var(--ink-soft);margin:8px 0 0}
.ci-read--pending{border-left-color:#cdb368;background:var(--cream-2)}
.ci-read--pending .ci-read__head{color:#8a6d1f}
.ci-outlook{margin:14px 0 8px;padding:16px 20px;background:#fff;border:1px solid var(--line);border-left:4px solid #6b4fa1;border-radius:12px}
.ci-outlook__head{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6b4fa1;margin:0 0 6px}
.ci-outlook__line{font-size:15.5px;line-height:1.5;color:var(--ink);margin:0}
.ci-outlook__how{margin-top:8px;font-size:12.5px}
.ci-outlook__how summary{cursor:pointer;color:var(--ink-soft);font-weight:600}
.ci-outlook__how div{margin-top:6px;color:var(--ink-soft);line-height:1.55}
.ci-outlook__panel{margin:0 0 8px;padding-left:18px}
.ci-outlook__panel li{margin:0 0 4px}
</style>
<link rel="preload" as="style" href="/assets/site-core.css?v=${SHELL_HASH.core}" onload="this.onload=null;this.rel='stylesheet'">
<link rel="preload" as="style" href="/assets/site-article.css?v=${SHELL_HASH.article}" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/assets/site-core.css?v=${SHELL_HASH.core}"><link rel="stylesheet" href="/assets/site-article.css?v=${SHELL_HASH.article}"></noscript>
${extraCss || ''}</head>
<body>
<a class="skip-link" href="#main">${locale === 'es' ? 'Saltar al contenido' : 'Skip to content'}</a>
<!-- batch-banner:start --><!-- batch-banner:end -->
<header class="nav" id="nav">
  <div class="container nav-inner">
    <a href="${locale === 'es' ? '/es' : ''}/" class="logo" aria-label="Muntin Digital">
      <img class="logo-mark" src="/brand/mark/mark-square-ink.svg" alt="" width="36" height="36" />
      <span class="logo-text">Muntin Digital</span>
    </a>
  </div>
</header>
<main id="main" role="main">
<div class="container">`;
}

const pageTail = `</div>
</main>
<footer class="site-footer" id="footer"></footer>
<!-- lazy-load:site --><script>(window.requestIdleCallback||function(c){return setTimeout(c,200);})(function(){var s=document.createElement("script");s.src="/assets/site.js?v=20260430-cohesion";s.async=true;document.head.appendChild(s);});</script><!-- /lazy-load:site -->
</body>
</html>
`;

// ---- Per-ingredient body content -----------------------------------
// "Why it's moving now" — turns the static driver prose into a dated read:
// each upstream input's CURRENT direction, with feed-grain framed as a
// leading association (it has tended to move before protein prices) and
// energy as coincident. Direction words only (allowed in prose, dated);
// never a fabricated lag number — the driver/ingredient cadences differ,
// so a build-time lag would be false precision. Honest rule: not a cause.
function whyMovingBlock(slug, locale) {
  const es = locale === 'es';
  const meta = ING_META[slug] || { drivers: [] };
  const rel = (meta.drivers || [])
    .map((d) => ({ d, dr: DRIVERS[d] }))
    .filter((x) => x.dr && x.dr.trend && x.dr.trend.dir);
  if (!rel.length) return '';
  const labelOf = (d) => ((es ? (DRIVER_LABELS[d] && DRIVER_LABELS[d].es) : (DRIVER_LABELS[d] && DRIVER_LABELS[d].en)) || d)
    .replace(/\s*\([^)]*\)\s*$/, '');   // drop a trailing "(feed)" — the clause already says feed-grain
  const part = (x) => `${escHtml(labelOf(x.d))} (${dirWord(x.dr.trend, locale)})`;
  const feed = rel.filter((x) => x.dr.kind === 'feed-grain');
  const energy = rel.filter((x) => x.dr.kind !== 'feed-grain');
  const clauses = [];
  if (feed.length) clauses.push(
    (es ? 'forraje — ' : 'feed-grain — ') + feed.map(part).join(', ') +
    (es ? ' — que ha tendido a moverse antes que los precios de proteína' : ' — which has tended to move before protein prices'));
  if (energy.length) clauses.push(
    energy.map(part).join(', ') + (es ? ', que se mueve junto al costo de los alimentos' : ', which moves alongside food costs'));
  const lead = es ? 'Insumos río arriba ahora: ' : 'Upstream inputs right now: ';
  const tail = es ? ' Asociación, no causa.' : ' Association, not cause.';
  let asOf = null;
  rel.forEach((x) => (x.dr.history || []).forEach((h) => { if (h.date && (!asOf || h.date > asOf)) asOf = h.date; }));
  const head = es ? 'Por qué se mueve' : "Why it's moving";
  const badge = asOf ? `<span class="ci-read__badge">${es ? 'al' : 'as of'} ${asOf}</span>` : '';
  return `
  <aside class="ci-why" aria-label="${head}">
    <p class="ci-why__head">${head}${badge}</p>
    <p class="ci-why__line">${lead}${clauses.join('; ')}.${tail}</p>
  </aside>`;
}

function whyItMatters(slug, locale) {
  const es = locale === 'es';
  const lab = LABELS[slug] || {};
  const name = (es ? (lab.es || lab.en) : lab.en) || slug;
  const lc = name.toLowerCase();
  const unit = (es ? (lab.unit_es || lab.unit_en) : lab.unit_en) || (es ? 'unidad' : 'unit');
  const meta = ING_META[slug] || { drivers: [] };
  const driverNames = (meta.drivers || []).map((d) => ((es ? (DRIVER_LABELS[d] && DRIVER_LABELS[d].es) : (DRIVER_LABELS[d] && DRIVER_LABELS[d].en)) || d).toLowerCase());
  const driverPhrase = driverNames.length ? driverNames.join(es ? ' y ' : ', ').replace(/, ([^,]*)$/, es ? ' y $1' : ', and $1') : (es ? 'el combustible' : 'fuel');
  const seasonal = !!lab.seasonal;
  const h = es ? 'Por qué importa' : 'Why it matters';
  const unitLine = es
    ? `<p>${name} se cotiza por <strong>${unit}</strong> como referencia mayorista. Esa es la cifra del mercado, no el precio entregado en tu puerta — tu factura suma flete, margen del proveedor y tu volumen. Compara siempre en la misma unidad.</p>`
    : `<p>${name} trades per <strong>${unit}</strong> as a wholesale reference. That is the market's figure, not the delivered price at your door — your invoice adds freight, the vendor's margin, and your volume. Always compare in the same unit.</p>`;
  const moveLine = es
    ? `<p>El precio se mueve con factores que están río arriba de tu cocina: sobre todo ${driverPhrase}. Es una asociación, no una causa directa — pero cuando esos suben, ${lc} tiende a seguirlos. Por eso una factura más alta no siempre es culpa del proveedor: a veces todo el mercado se movió.</p>`
    : `<p>The price moves with forces upstream of your kitchen — chiefly ${driverPhrase}. That is an association, not a direct cause, but when those climb, ${lc} tends to follow. So a higher invoice is not always the vendor's doing: sometimes the whole market moved.</p>`;
  const seasonalLine = seasonal
    ? (es
      ? `<p>${name} es de temporada: un precio alto hoy puede ceder cuando vuelve la oferta. Si el rango está caro pero la dirección apunta a la baja, a veces conviene aguantar el platillo unas semanas antes de re-cotizarlo.</p>`
      : `<p>${name} is seasonal: a high read today can ease as supply returns. If the range is expensive but the direction points down, holding the dish a few weeks can beat re-pricing it.</p>`)
    : '';
  return `<h2 id="why-it-matters">${h}</h2>${unitLine}${moveLine}${seasonalLine}`;
}

function howToUse(slug, locale) {
  const es = locale === 'es';
  const base = es ? '/es' : '';
  const lab = LABELS[slug] || {};
  const name = (es ? (lab.es || lab.en) : lab.en) || slug;
  const lc = name.toLowerCase();
  const h = es ? 'Cómo usar esta lectura' : 'How to use this reading';
  const steps = es
    ? `<ol>
  <li>Abre la lectura de arriba y anota el rango típico y la fecha.</li>
  <li>Saca tu última factura de ${lc}, en la misma unidad.</li>
  <li>Debajo del rango = buen trato; dentro = normal; muy por encima = conversación con el proveedor.</li>
  <li>Observa la dirección unas semanas antes de re-cotizar un platillo — una sola semana es ruido.</li>
</ol>
<p>¿Vas a costear un platillo que lleva ${lc}? Usa la <a href="${base}/tools/plate-cost/">Calculadora de Costo por Platillo</a>.</p>`
    : `<ol>
  <li>Open the reading above and note the typical range and the date.</li>
  <li>Pull your last ${lc} invoice, in the same unit.</li>
  <li>Below the range is a good deal; inside is normal; well above is a vendor conversation.</li>
  <li>Watch the direction over a few weeks before re-pricing a dish — one week is noise.</li>
</ol>
<p>Costing a dish that uses ${lc}? Use the <a href="${base}/tools/plate-cost/">Plate Cost Calculator</a>.</p>`;
  return `<h2 id="how-to-use">${h}</h2>${steps}`;
}

function siblings(slug, locale) {
  const es = locale === 'es';
  const base = es ? '/es' : '';
  const meta = ING_META[slug];
  if (!meta) return '';
  const all = gatedSlugs();
  const sibs = all.filter((s) => s !== slug && ING_META[s] && ING_META[s].cat === meta.cat);
  if (!sibs.length) return '';
  const links = sibs.map((s) => {
    const l = LABELS[s] || {};
    return `<a href="${base}/cost-index/${s}/">${escHtml((es ? (l.es || l.en) : l.en) || s)}</a>`;
  }).join(' · ');
  const cat = CATEGORIES[meta.cat] || { en: '', es: '' };
  const label = es ? `Más en ${(cat.es || '').toLowerCase()}` : `More ${(cat.en || '').toLowerCase()}`;
  return `<p class="ci-sibs"><span class="ci-sibs-label">${escHtml(label)}</span>${links}</p>`;
}

function ledeDirection(slug, locale) {
  const r = readingOf(slug);
  if (!r || !r.trend || !r.trend.dir) return null;
  return { word: dirWord(r.trend, locale), asOf: r.asOf };
}

// ---- The Pressure overlay — INFERRED outlook, structurally separate -------
// A distinct data-layer="inferred" aside: direction + confidence + the leading-
// indicator panel. NO price ever appears here (the record carries none);
// check-pressure-honesty.mjs recomputes the arrow and scans this block for any
// $. Verbs are honest — "looks to be", "tends to lead", never "will".
function pressureBlock(slug, locale) {
  const rec = PRESSURE_ITEMS[slug];
  if (!rec || rec.direction === 'unknown') return '';
  const es = locale === 'es';
  const dir = rec.under_review ? 'review' : rec.direction;
  const lines = {
    building: { en: 'Cost pressure looks to be building — the leading signals lean higher.', es: 'La presión de costo parece ir en aumento — las señales adelantadas apuntan al alza.' },
    easing:   { en: 'Cost pressure looks to be easing — the leading signals lean lower.', es: 'La presión de costo parece ceder — las señales adelantadas apuntan a la baja.' },
    steady:   { en: 'Signals are mixed — no clear lean right now.', es: 'Señales mixtas — sin una tendencia clara por ahora.' },
    review:   { en: 'Awaiting the next measured price — too far past the last print to call.', es: 'A la espera de la próxima lectura medida — demasiado tiempo desde la última cifra para concluir.' }
  };
  const line = lines[dir][es ? 'es' : 'en'];
  const confWord = es ? ({ high: 'alta', moderate: 'media', low: 'baja' }[rec.confidence] || rec.confidence) : rec.confidence;
  const fresh = rec.freshness_weeks != null ? rec.freshness_weeks : '—';
  const head = es ? 'Perspectiva' : 'Outlook';
  const chip = es
    ? `inferido · confianza ${confWord} · hace ${fresh} sem de la última cifra`
    : `inferred · ${confWord} confidence · ${fresh}w since last price`;
  const rows = (rec.contributors || []).map((c) => {
    const nm = (INDICATOR_NAME[c.indicator] && INDICATOR_NAME[c.indicator][es ? 'es' : 'en']) || c.indicator;
    const src = sourceShort(c.source);
    const url = PRESSURE_SOURCES[c.cite] || PRESSURE_SOURCES[c.source] || null;
    const push = c.signed_signal > 0 ? (es ? 'empuja al alza' : 'pushing up')
      : c.signed_signal < 0 ? (es ? 'empuja a la baja' : 'pushing down')
      : (es ? 'neutral' : 'neutral');
    const unit = c.lead ? (c.lead.unit === 'week' ? (es ? 'sem' : 'wk') : c.lead.unit) : '';
    const lead = c.lead ? `~${c.lead.min}–${c.lead.max} ${unit}` : '';
    const nameHtml = url ? `<a href="${url}" rel="noopener">${escHtml(nm)}</a>` : escHtml(nm);
    return `<li>${nameHtml} (${escHtml(src)}) — ${push}${lead ? `; ${es ? 'suele anticipar' : 'tends to lead'} ${lead}` : ''}.</li>`;
  }).join('');
  const howHead = es ? 'Cómo se calcula' : 'How this is computed';
  const note = es
    ? `Dirección inferida de indicadores públicos adelantados — no es un precio. Regla ${rec.rule_version || ''}.`
    : `Inferred direction from public leading indicators — not a price. Rule ${rec.rule_version || ''}.`;
  return `
  <aside class="ci-outlook" data-layer="inferred" data-as-of="${rec.as_of || ''}" data-rule-version="${rec.rule_version || ''}" aria-label="${head}">
    <p class="ci-outlook__head">${head}<span class="ci-read__badge">${chip}</span></p>
    <p class="ci-outlook__line" data-dir="${dir}">${line}</p>
    <details class="ci-outlook__how"><summary>${howHead}</summary><div><ul class="ci-outlook__panel">${rows}</ul><p>${note}</p></div></details>
  </aside>`;
}

// The shippable bar (tools/_shared/cost-confidence.js): an ingredient earns a
// full public reading only with a credible wholesale dollar level. Below the
// bar it gets an honest "expanding coverage" page — URL kept alive (slugs are
// final-forever), but no apologetic price.
function shippable(slug) {
  const e = COST_INDEX[slug];
  const p = e && Array.isArray(e.points) && e.points[0];
  return !!p && MuntinCostConfidence.isShippable(p);
}

// Expanding-coverage page: honest absence, not an apology. No price, no Dataset.
function emitExpandingPage(slug, locale) {
  const es = locale === 'es';
  const lang = es ? 'es' : 'en';
  const base = es ? '/es' : '';
  const lab = LABELS[slug] || {};
  const name = es ? (lab.es || lab.en || slug) : (lab.en || slug);
  const lc = name.toLowerCase();
  const meta = ING_META[slug] || { cat: 'pantry' };
  const cat = CATEGORIES[meta.cat] || { en: 'Pantry', es: 'Despensa' };
  const canonEn = `https://muntin.digital/cost-index/${slug}/`;
  const canonEs = `https://muntin.digital/es/cost-index/${slug}/`;
  const title = es
    ? `${name} al mayoreo — cobertura en preparación | Muntin Digital`
    : `${name} wholesale price — coverage in progress | Muntin Digital`;
  const desc = es
    ? `Aún no publicamos un precio mayorista para ${lc}: solo mostramos una cifra cuando los datos públicos respaldan una lectura honesta y completa.`
    : `We don't publish a wholesale price for ${lc} yet — the index shows a number only when public data supports an honest, complete read.`;
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': (es ? canonEs : canonEn) + '#page', 'url': es ? canonEs : canonEn,
        'name': name, 'inLanguage': es ? 'es-US' : 'en-US', 'isPartOf': { '@id': 'https://muntin.digital/#website' },
        'description': desc },
      { '@type': 'BreadcrumbList', 'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': es ? 'Inicio' : 'Home', 'item': es ? 'https://muntin.digital/es/' : 'https://muntin.digital/' },
        { '@type': 'ListItem', 'position': 2, 'name': es ? 'Índice de costos' : 'Cost index', 'item': (es ? 'https://muntin.digital/es' : 'https://muntin.digital') + '/cost-index/' },
        { '@type': 'ListItem', 'position': 3, 'name': name, 'item': es ? canonEs : canonEn } ] }
    ]
  });
  const body = es
    ? `<div class="ci-body">
    <aside class="ci-read ci-read--pending" aria-label="Cobertura en preparación">
      <p class="ci-read__head">Cobertura en preparación</p>
      <p class="ci-read__line">Seguimos ${lc} para el índice, pero todavía no tenemos una lectura mayorista gratuita y completa que respaldaríamos — así que no publicamos una cifra. El índice muestra un precio solo cuando los datos públicos lo sostienen.</p>
    </aside>
    <h2>Por qué aún no hay número</h2>
    <p>La regla es simple: un precio se publica solo cuando podemos obtenerlo de datos públicos (USDA, BLS, FRED) con una calidad sobre la que actuaríamos nosotros mismos. Para ${lc}, la serie mayorista gratuita que necesitamos aún no está conectada. Una estimación de una sola fuente sería peor que nada.</p>
    <h2>Qué puedes hacer ahora</h2>
    <p>Compara tu última factura de ${lc} con tus facturas recientes, o abre <a href="${base}/tools/cost-pulse/">Cost Pulse</a> para los ingredientes que sí cubrimos. Esta página se completará cuando lo hagan los datos.</p>
    <div class="ci-cta-row">
      <a class="btn btn-ghost" href="${base}/cost-index/">Ver todas las lecturas</a>
      <a class="btn btn-ghost" href="${base}/glossary/cost-index/">Qué es un índice de costos</a>
    </div>
  </div>`
    : `<div class="ci-body">
    <aside class="ci-read ci-read--pending" aria-label="Coverage in progress">
      <p class="ci-read__head">Coverage in progress</p>
      <p class="ci-read__line">We track ${lc} for the index, but we don't yet have a complete, free wholesale read we'd stand behind — so we're not publishing a number. The index shows a price only when public data supports an honest one.</p>
    </aside>
    <h2>Why there's no number yet</h2>
    <p>The rule is simple: a price ships only when we can source it from public USDA, BLS or FRED data at a quality we'd act on ourselves. For ${lc}, the free wholesale series we need isn't wired up yet — and a thin, single-source guess would be worse than nothing.</p>
    <h2>What you can do now</h2>
    <p>Check your last ${lc} invoice against your own recent ones, or open <a href="${base}/tools/cost-pulse/">Cost Pulse</a> for the ingredients we do cover. This page fills in when the data does.</p>
    <div class="ci-cta-row">
      <a class="btn btn-ghost" href="${base}/cost-index/">Browse all readings</a>
      <a class="btn btn-ghost" href="${base}/glossary/cost-index/">What is a cost index?</a>
    </div>
  </div>`;
  return pageHead({ lang, locale, title, desc, canonEn, canonEs, jsonld }) + `
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="${base}/">${es ? 'Inicio' : 'Home'}</a> ›
    <a href="${base}/cost-index/">${es ? 'Índice de costos' : 'Cost index'}</a> ›
    ${escHtml(name)}
  </nav>
  <section class="ci-hero">
    <p class="ci-eyebrow"><a href="${base}/cost-index/#${meta.cat}">${escHtml(es ? cat.es : cat.en)}</a></p>
    <h1>${escHtml(name)}</h1>
  </section>
  ${body}` + pageTail;
}

function emitIngredientPage(slug, locale) {
  if (!shippable(slug)) return emitExpandingPage(slug, locale);
  const es = locale === 'es';
  const lang = es ? 'es' : 'en';
  const base = es ? '/es' : '';
  const lab = LABELS[slug] || {};
  const enName = lab.en || slug;
  const esName = lab.es || enName;
  const name = es ? esName : enName;
  const lc = name.toLowerCase();
  const meta = ING_META[slug] || { cat: 'pantry' };
  const cat = CATEGORIES[meta.cat] || { en: 'Pantry', es: 'Despensa' };
  const canonEn = `https://muntin.digital/cost-index/${slug}/`;
  const canonEs = `https://muntin.digital/es/cost-index/${slug}/`;

  const title = es
    ? `¿Cuánto cuesta ${lc} al mayoreo? | Muntin Digital`
    : `What does ${lc} cost wholesale? | Muntin Digital`;
  const desc = es
    ? `Dónde se cotiza ${lc} al mayoreo según fuentes públicas (USDA, BLS, FRED) — un rango típico y la tendencia — para distinguir un movimiento de mercado de un sobreprecio de proveedor.`
    : `Where ${lc} is priced wholesale across public sources (USDA, BLS, FRED) — a typical range and the trend — so you can tell a market move from a vendor markup.`;

  // Answer-first lede: qualitative, one build-stamped + dated direction word.
  const dir = ledeDirection(slug, locale);
  const dirClause = dir
    ? (es ? ` ahora va <strong>${dir.word}</strong> según fuentes públicas (al ${dir.asOf})` : ` right now it's reading <strong>${dir.word}</strong> across public sources (as of ${dir.asOf})`)
    : (es ? ' y se mueve semana a semana' : ', and it moves week to week');
  const lede = es
    ? `${name} se cotiza con un precio de referencia de mayoreo que cambia semana a semana;${dirClause}. Para ver el número en vivo, el rango típico y dónde queda tu precio, abre la lectura de abajo — y compárala con tu última factura.`
    : `${name} trades on a wholesale reference price that moves week to week;${dirClause}. To see the live number, the typical range, and where your own price sits, open the reading below — then check your last invoice against it.`;

  const faq = faqItems(slug, locale);
  const faqHtml = `<section class="ci-faq" aria-labelledby="ci-faq-h-${slug}">
  <h2 id="ci-faq-h-${slug}">${es ? 'Preguntas frecuentes' : 'Frequently asked'}</h2>
  ${faq.map((f) => `<div class="ci-faq__item"><h3 class="ci-faq__q">${escHtml(f.q)}</h3><p class="ci-faq__a">${escHtml(f.a)}</p></div>`).join('\n  ')}
</section>`;

  const agencies = (() => { const r = readingOf(slug); return r ? citedAgencies(r.entry, r.point) : []; })();
  const srcLine = agencies.length
    ? `<p class="ci-source"><strong>${es ? 'Fuente' : 'Sourced'}:</strong> ${agencies.map((a) => `<a href="${a.url}" rel="noopener">${escHtml(a.name)}</a>`).join(' · ')} — ${es ? 'datos públicos, vía' : 'public data, via'} <a href="${base}/tools/cost-pulse/">Cost Pulse</a> · <a href="${base}/glossary/cost-index/">${es ? 'qué es un índice de costos' : 'what a cost index is'}</a></p>`
    : `<p class="ci-source"><strong>${es ? 'Fuente' : 'Sourced'}:</strong> ${es ? 'datos públicos de mercado, vía' : 'public market data, via'} <a href="${base}/tools/cost-pulse/">Cost Pulse</a> · <a href="${base}/glossary/cost-index/">${es ? 'qué es un índice de costos' : 'what a cost index is'}</a></p>`;

  const bcHome = es ? 'Inicio' : 'Home';
  const bcHub  = es ? 'Índice de costos' : 'Cost index';

  return pageHead({ lang, locale, title, desc, canonEn, canonEs, jsonld: emitIngredientJsonLd(slug, locale) }) + `
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="${base}/">${bcHome}</a> ›
    <a href="${base}/cost-index/">${bcHub}</a> ›
    ${escHtml(name)}
  </nav>
  <section class="ci-hero">
    <p class="ci-eyebrow"><a href="${base}/cost-index/#${meta.cat}">${escHtml(es ? cat.es : cat.en)}</a></p>
    <h1>${escHtml(name)}</h1>
    <p class="ci-lede">${lede}</p>
  </section>
  <div class="ci-body">
    ${marketReadBlock(slug, locale)}
    ${pressureBlock(slug, locale)}
    ${whyMovingBlock(slug, locale)}
    ${whyItMatters(slug, locale)}
    ${howToUse(slug, locale)}
    ${faqHtml}
    ${siblings(slug, locale)}
    <div class="ci-cta-row">
      <a class="btn btn-primary" href="${base}/tools/cost-pulse/#ci-${slug}">${es ? 'Abrir Cost Pulse' : 'Open Cost Pulse'}</a>
      <a class="btn btn-ghost" href="${base}/cost-index/">${es ? 'Ver todas las lecturas' : 'Browse all readings'}</a>
    </div>
    ${srcLine}
  </div>` + pageTail;
}

// ---- Hub page ------------------------------------------------------
function hubCardNote(slug, locale) {
  const es = locale === 'es';
  const lab = LABELS[slug] || {};
  const unit = (es ? (lab.unit_es || lab.unit_en) : lab.unit_en) || (es ? 'unidad' : 'unit');
  return es ? `por ${unit}, referencia mayorista` : `per ${unit}, wholesale reference`;
}

function emitHubPage(locale, slugs) {
  const es = locale === 'es';
  const lang = es ? 'es' : 'en';
  const base = es ? '/es' : '';
  const canonEn = 'https://muntin.digital/cost-index/';
  const canonEs = 'https://muntin.digital/es/cost-index/';
  // Only ingredients past the shippable bar get a live reading; the rest are
  // listed honestly under "expanding coverage" (no price, URL preserved).
  const shipSlugs = slugs.filter(shippable);
  const pendingSlugs = slugs.filter((s) => !shippable(s));
  const title = es ? 'Índice de costos de restaurante | Muntin Digital' : 'Restaurant ingredient cost index | Muntin Digital';
  const desc = es
    ? 'Dónde se cotizan al mayoreo ingredientes comunes de restaurante — un rango típico y la tendencia, de fuentes públicas (USDA, BLS, FRED) — para distinguir un movimiento de mercado de un sobreprecio.'
    : 'Where common restaurant ingredients are priced wholesale — a typical range and a trend, from public sources (USDA, BLS, FRED) — so you can tell a market move from a vendor markup.';
  const heroH1 = es ? 'Índice de costos de ingredientes' : 'Restaurant ingredient cost index';
  const heroLede = es
    ? `Dónde se cotizan al mayoreo ${shipSlugs.length} ingredientes comunes de restaurante — un rango típico y una tendencia, de datos públicos de USDA, BLS y FRED — para distinguir un movimiento real de mercado de un sobreprecio de proveedor. Elige un ingrediente para su lectura, o abre Cost Pulse para verlos todos a la vez.`
    : `Where ${shipSlugs.length} common restaurant ingredients are priced wholesale — a typical range and a trend, drawn from public USDA, BLS and FRED data — so you can tell a real market move from a vendor markup. Pick an ingredient for its reading, or open Cost Pulse to see them all at once.`;

  // Grouped cards by category — shippable readings only.
  const byCat = {};
  for (const s of shipSlugs) { const c = (ING_META[s] || {}).cat || 'pantry'; (byCat[c] = byCat[c] || []).push(s); }
  const sections = CATEGORY_ORDER.filter((c) => byCat[c] && byCat[c].length).map((c) => {
    const cat = CATEGORIES[c];
    const cards = byCat[c].map((s) => {
      const l = LABELS[s] || {};
      const nm = (es ? (l.es || l.en) : l.en) || s;
      const chip = actionChip(s, locale);
      return `<div class="ci-card"><a href="${base}/cost-index/${s}/">${escHtml(nm)}</a><span class="ci-card-note">${escHtml(hubCardNote(s, locale))}</span>${chip ? `<div class="ci-card-action">${chip}</div>` : ''}</div>`;
    }).join('');
    return `<h2 class="ci-cat-h" id="${c}">${escHtml(es ? cat.es : cat.en)}</h2><div class="ci-grid">${cards}</div>`;
  }).join('\n');

  const driverNote = es
    ? `<p>Río arriba, los precios se mueven con un puñado de materias primas que el tablero rastrea bajo “por qué se mueve”: maíz y soya (forraje), diésel y electricidad. Para lo que se está moviendo ahora mismo, <a href="${base}/tools/cost-pulse/">abre Cost Pulse</a>.</p>`
    : `<p>Upstream, prices move with a handful of commodities the dashboard tracks under “why it's moving”: corn and soybeans (feed), diesel, and electricity. For what's moving right now, <a href="${base}/tools/cost-pulse/">open Cost Pulse</a>.</p>`;

  // Schema: DataCatalog + CollectionPage + ItemList + Breadcrumb.
  const baseUrl = es ? canonEs : canonEn;
  // Catalog + ItemList carry only complete datasets (shippable readings).
  const datasetRefs = shipSlugs.map((s) => ({ '@id': `https://muntin.digital${base}/cost-index/${s}/#dataset` }));
  const items = shipSlugs.map((s, i) => {
    const l = LABELS[s] || {};
    return { '@type': 'ListItem', 'position': i + 1, 'name': (es ? (l.es || l.en) : l.en) || s, 'item': `${baseUrl}${s}/` };
  });
  // Honest "expanding coverage" list — kept-alive URLs, no price claimed.
  const pendingSection = pendingSlugs.length ? `<h2 class="ci-cat-h" id="expanding">${es ? 'Cobertura en preparación' : 'Expanding coverage'}</h2>
    <p class="ci-pending-note">${es ? 'Seguimos estos, pero aún no publicamos un precio: solo mostramos una cifra cuando los datos públicos gratuitos la sostienen.' : 'We track these, but don\'t publish a price yet — the index shows a number only when free public data supports an honest one.'}</p>
    <div class="ci-grid">${pendingSlugs.map((s) => { const l = LABELS[s] || {}; const nm = (es ? (l.es || l.en) : l.en) || s; return `<div class="ci-card ci-card--pending"><a href="${base}/cost-index/${s}/">${escHtml(nm)}</a><span class="ci-card-note">${es ? 'cobertura en preparación' : 'coverage in progress'}</span></div>`; }).join('')}</div>` : '';
  const crumb = es
    ? [['Inicio', 'https://muntin.digital/es/'], ['Índice de costos', baseUrl]]
    : [['Home', 'https://muntin.digital/'], ['Cost index', baseUrl]];
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'DataCatalog', '@id': baseUrl + '#catalog', 'name': es ? 'Índice de costos de restaurante Muntin' : 'Muntin Restaurant Cost Index',
        'description': es
          ? 'Precios mayoristas de referencia para ingredientes comunes de restaurante, combinados de fuentes públicas de mercado de EE. UU. (USDA, BLS, FRED, EIA) y mostrados como un rango típico con su tendencia.'
          : 'Wholesale reference prices for common restaurant ingredients, blended from public U.S. market sources (USDA, BLS, FRED, EIA) and shown as a typical range with a trend.',
        'url': baseUrl, 'inLanguage': es ? 'es-US' : 'en-US', 'isAccessibleForFree': true,
        'license': 'https://creativecommons.org/publicdomain/zero/1.0/',
        'publisher': { '@id': 'https://muntin.digital/#business' },
        'creator': { '@id': 'https://muntin.digital/#don-goldstein' },
        'dataset': datasetRefs },
      { '@type': 'CollectionPage', '@id': baseUrl + '#page', 'url': baseUrl, 'name': heroH1,
        'inLanguage': es ? 'es-US' : 'en-US', 'isPartOf': { '@id': 'https://muntin.digital/#website' },
        'about': { '@id': baseUrl + '#catalog' }, 'mainEntity': { '@id': baseUrl + '#itemlist' } },
      { '@type': 'ItemList', '@id': baseUrl + '#itemlist', 'itemListOrder': 'https://schema.org/ItemListUnordered',
        'numberOfItems': items.length, 'itemListElement': items },
      { '@type': 'BreadcrumbList', '@id': baseUrl + '#breadcrumbs',
        'itemListElement': crumb.map((c, i) => ({ '@type': 'ListItem', 'position': i + 1, 'name': c[0], 'item': c[1] })) }
    ]
  });

  const bcHome = es ? 'Inicio' : 'Home';
  return pageHead({ lang, locale, title, desc, canonEn, canonEs, jsonld }) + `
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="${base}/">${bcHome}</a> ›
    ${escHtml(heroH1)}
  </nav>
  <section class="ci-hero">
    <h1>${escHtml(heroH1)}</h1>
    <p class="ci-lede">${escHtml(heroLede)}</p>
  </section>
  <div class="ci-body">
    <div class="ci-cta-row">
      <a class="btn btn-primary" href="${base}/tools/cost-pulse/">${es ? 'Abrir Cost Pulse' : 'Open Cost Pulse'}</a>
      <a class="btn btn-ghost" href="${base}/glossary/cost-index/">${es ? '¿Qué es un índice de costos?' : 'What is a cost index?'}</a>
    </div>
    ${movingNowSection(shipSlugs, locale)}
    ${sections}
    ${pendingSection}
    ${driverNote}
    <p class="ci-source"><strong>${es ? 'Fuente' : 'Sourced'}:</strong> ${es ? 'datos públicos de mercado (USDA AMS/LMR, BLS, FRED, EIA, NOAA), vía' : 'public market data (USDA AMS/LMR, BLS, FRED, EIA, NOAA), via'} <a href="${base}/tools/cost-pulse/">Cost Pulse</a>.</p>
  </div>` + pageTail;
}

// ---- Pressure Lab — the playable engine (a new tool page) -----------
const LAB_CSS = `<style>
#pressureLab[data-layer]{margin:18px 0}
.plab-verdict{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;padding:16px 20px;background:var(--cream-2);border:1px solid var(--line);border-left:4px solid #6b4fa1;border-radius:12px}
.plab-arrow{font-size:22px;line-height:1}
.plab-arrow[data-dir="building"]{color:#A23B2D}.plab-arrow[data-dir="easing"]{color:#2A50C8}.plab-arrow[data-dir="steady"]{color:#8a6d1f}
.plab-verdict__line{font-size:16px;margin:0;font-weight:600;flex:1 1 60%}
.plab-verdict__meta{font-size:11px;color:var(--ink-soft);margin:0;text-transform:uppercase;letter-spacing:.04em}
.plab-sr{position:absolute;left:-9999px}
.plab-board{margin:14px 0;display:grid;gap:8px}
.plab-bar{display:grid;grid-template-columns:140px 1fr 70px;align-items:center;gap:10px;font-size:13px}
.plab-bar__name{color:var(--ink-soft)}
.plab-bar__track{height:14px;background:var(--cream-2);border-radius:8px;overflow:hidden}
.plab-bar__fill{display:block;height:100%;border-radius:8px}
.plab-bar__fill[data-push="up"]{background:#A23B2D}.plab-bar__fill[data-push="down"]{background:#2A50C8}.plab-bar__fill[data-push="flat"]{background:#9aa0ab}
.plab-bar__fill[data-zero]{opacity:.4}
.plab-bar__push{font-variant-numeric:tabular-nums;color:var(--ink-soft);text-align:right}
.plab-sum{display:grid;grid-template-columns:140px 1fr 120px;align-items:center;gap:10px;margin-top:6px;font-size:13px}
.plab-sum__label{color:var(--ink-soft)}
.plab-meter{position:relative;height:18px;background:var(--cream-2);border-radius:9px}
.plab-meter__line{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--ink-soft);opacity:.5}
.plab-meter__needle{position:absolute;top:-4px;width:4px;height:26px;border-radius:2px;background:#6b4fa1;transform:translateX(-50%)}
.plab-meter__needle[data-dir="building"]{background:#A23B2D}.plab-meter__needle[data-dir="easing"]{background:#2A50C8}
.plab-sum__num{font-variant-numeric:tabular-nums;color:var(--ink-soft);text-align:right}
.plab-controls{margin:16px 0;padding:14px 18px;background:var(--white);border:1px solid var(--line);border-radius:12px}
.plab-controls__head{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-soft);margin:0 0 10px}
.plab-ctrl{margin:0 0 10px}
.plab-ctrl__label{display:flex;justify-content:space-between;font-size:13.5px;margin:0 0 2px}
.plab-ctrl__val{font-variant-numeric:tabular-nums;color:#6b4fa1;font-weight:600}
.plab-ctrl input[type=range]{width:100%;accent-color:#6b4fa1}
.plab-reset{font:inherit;font-size:13px;cursor:pointer;border:1px solid var(--line);background:var(--cream);border-radius:999px;padding:6px 14px;margin-top:4px}
.plab-reset:hover{border-color:#6b4fa1;color:#6b4fa1}
.plab-foot{font-size:12.5px;color:var(--ink-soft);margin:8px 0 0}
@media (max-width:560px){.plab-bar,.plab-sum{grid-template-columns:90px 1fr 56px}}
</style>`;

function emitLabPage(locale) {
  const es = locale === 'es';
  const lang = es ? 'es' : 'en';
  const base = es ? '/es' : '';
  const canonEn = 'https://muntin.digital/cost-index/lab/';
  const canonEs = 'https://muntin.digital/es/cost-index/lab/';
  const h1 = es ? 'Laboratorio de Presión' : 'Pressure Lab';
  const title = es ? `${h1} — juega con lo que mueve tus costos | Muntin Digital`
    : `${h1} — play with what's moving your food costs | Muntin Digital`;
  const desc = es
    ? 'Mueve un indicador adelantado y observa cómo cambia en vivo la perspectiva de costos — un modelo transparente, sin fetch, con datos públicos de USDA y EIA. Una dirección, nunca un precio.'
    : 'Drag a leading indicator and watch the food-cost outlook change live — a transparent, no-fetch model fed by free USDA and EIA data. A direction, never a price.';
  const lede = es
    ? 'Este es el modelo real detrás de la perspectiva del Índice de Costos — y puedes jugarlo. Mueve una señal y observa cómo cambia la dirección. Nada aquí es un precio; es hacia dónde parecen ir los costos.'
    : 'This is the actual model behind the Cost Index outlook — and you can play it. Move a signal and watch the direction change. Nothing here is a price; it\'s where costs look to be headed.';
  const baseUrl = es ? canonEs : canonEn;
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebApplication', '@id': baseUrl + '#tool', 'name': h1, 'url': baseUrl, 'applicationCategory': 'BusinessApplication', 'operatingSystem': 'Web', 'inLanguage': es ? 'es' : 'en', 'isAccessibleForFree': true, 'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }, 'creator': { '@id': 'https://muntin.digital/#business' }, 'description': desc },
    { '@type': 'BreadcrumbList', 'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': es ? 'Inicio' : 'Home', 'item': es ? 'https://muntin.digital/es/' : 'https://muntin.digital/' },
      { '@type': 'ListItem', 'position': 2, 'name': es ? 'Índice de costos' : 'Cost index', 'item': (es ? 'https://muntin.digital/es' : 'https://muntin.digital') + '/cost-index/' },
      { '@type': 'ListItem', 'position': 3, 'name': h1, 'item': baseUrl } ] }
  ]});
  const methodHead = es ? 'Cómo funciona' : 'How this works';
  const methodBody = es
    ? 'El modelo es una suma transparente: P = Σ(peso × signo × señal). Cada indicador público adelantado aporta un voto — al alza, a la baja o neutral dentro de una banda muerta — ponderado por su nivel de evidencia. Si P cruza la línea ±, la dirección cambia. Sin ajustes subjetivos: los mismos números que podrías rehacer a mano. Es una dirección inferida, no un precio; los rezagos vienen de USDA/EIA y la ponderación por semana es nuestra estimación.'
    : 'The model is a transparent sum: P = Σ(weight × sign × signal). Each public leading indicator casts one vote — up, down, or neutral inside a deadband — weighted by its evidence tier. When P crosses the ± line, the direction flips. No subjective adjustments: the same numbers you could redo by hand. It is an inferred direction, not a price; the lead times come from USDA/EIA and the per-week weighting is our estimate.';
  const noscript = es ? 'El Laboratorio de Presión necesita JavaScript. Verás la perspectiva en vivo en cada página de ingrediente.'
    : 'The Pressure Lab needs JavaScript — you\'ll find the live outlook on each ingredient page.';
  const v = 'v=20260608-lab1';
  return pageHead({ lang, locale, title, desc, canonEn, canonEs, jsonld, extraCss: LAB_CSS }) + `
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="${base}/">${es ? 'Inicio' : 'Home'}</a> ›
    <a href="${base}/cost-index/">${es ? 'Índice de costos' : 'Cost index'}</a> ›
    ${escHtml(h1)}
  </nav>
  <section class="ci-hero">
    <p class="ci-eyebrow"><a href="${base}/cost-index/">${es ? 'Índice de costos' : 'Cost index'}</a></p>
    <h1>${escHtml(h1)}</h1>
    <p class="ci-lede">${escHtml(lede)}</p>
  </section>
  <div class="ci-body">
    <div id="pressureLab" data-layer="inferred"><noscript>${escHtml(noscript)}</noscript></div>
    <details class="ci-read__src" style="margin-top:18px"><summary>${methodHead}</summary><div>${escHtml(methodBody)}</div></details>
    <div class="ci-cta-row">
      <a class="btn btn-ghost" href="${base}/cost-index/">${es ? 'Ver el índice' : 'Browse the index'}</a>
      <a class="btn btn-ghost" href="${base}/tools/cost-pulse/">${es ? 'Abrir Cost Pulse' : 'Open Cost Pulse'}</a>
    </div>
  </div>
  <script src="/tools/_shared/cost-pressure.js?${v}"></script>
  <script src="/data/pressure-rules.js?${v}"></script>
  <script src="/data/pressure-live.js?${v}"></script>
  <script src="/tools/_shared/pressure-scenario.js?${v}"></script>
  <script src="/tools/_shared/pressure-lab-ui.js?${v}"></script>` + pageTail;
}

// ---- Write or check ------------------------------------------------
const allGated = gatedSlugs();
const buildSlugs = ONLY ? allGated.filter((s) => ONLY.has(s)) : allGated;
if (ONLY) {
  const miss = [...ONLY].filter((s) => !allGated.includes(s));
  if (miss.length) console.warn(`--only: not gated/buildable, skipped: ${miss.join(', ')}`);
}

const targets = [];
for (const slug of buildSlugs) {
  targets.push({ path: `cost-index/${slug}/index.html`,    content: emitIngredientPage(slug, 'en') });
  targets.push({ path: `es/cost-index/${slug}/index.html`, content: emitIngredientPage(slug, 'es') });
  // Downloadable series only for shippable readings — never expose the thin
  // data behind an "expanding coverage" ingredient as a data file.
  if (shippable(slug)) {
    targets.push({ path: `cost-index/${slug}/series.json`,   content: seriesJson(slug), raw: true });
    targets.push({ path: `cost-index/${slug}/series.csv`,    content: seriesCsv(slug),  raw: true });
  }
}
// Hub lists every gated ingredient regardless of the --only subset, so it
// never advertises a page that isn't built. When --only is active we still
// build the hub from the full gated set so its ItemList stays complete.
targets.push({ path: 'cost-index/index.html',    content: emitHubPage('en', allGated) });
targets.push({ path: 'es/cost-index/index.html', content: emitHubPage('es', allGated) });
// The Pressure Lab — the cost-index suite's playable instrument. Lives under
// /cost-index/ (not /tools/) so it inherits the cost-index chrome + hreflang
// skip and isn't held to the /tools/ shell conventions. Built whole regardless
// of --only so EN/ES stay in parity.
targets.push({ path: 'cost-index/lab/index.html',    content: emitLabPage('en') });
targets.push({ path: 'es/cost-index/lab/index.html', content: emitLabPage('es') });

let drift = 0;
for (const tgt of targets) {
  const fullPath = path.join(repoRoot, tgt.path);
  if (checkMode) {
    const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : null;
    const norm = tgt.raw ? (x) => x : normalizeBatchBanner;
    if (existing == null || norm(existing) !== norm(tgt.content)) {
      drift++; console.log(`would update ${tgt.path}`);
    }
  } else {
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, tgt.content);
  }
}
if (checkMode) {
  console.log(`Cost-index pages: ${drift} file(s) would change of ${targets.length}.`);
  process.exit(drift > 0 ? 1 : 0);
} else {
  console.log(`Cost-index pages: wrote ${targets.length} file(s) for ${buildSlugs.length} ingredient(s) + hub.`);
}
