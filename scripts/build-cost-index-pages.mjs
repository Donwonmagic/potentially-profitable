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
 * live Cost Index tool for the always-fresh reading.
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
// Cost Index + the audits tool ship) rather than forking a renderer.
const MuntinSparkline = require(path.join(repoRoot, 'tools/_shared/sparkline.js'));
// ONE shared verdict voice — the same module the Cost Index dashboard uses, so
// the static pages, the hub, and the live tool can never disagree (a thin-data
// "structural" reads "Watch", not "Re-price", on every surface).
const MuntinCostVerdict = require(path.join(repoRoot, 'tools/_shared/cost-verdict.js'));
// Level/trend confidence split + the shippable bar — so a solid multi-market
// price isn't buried under a noisy trend's "low", and nothing apologetic ships.
const MuntinCostConfidence = require(path.join(repoRoot, 'tools/_shared/cost-confidence.js'));
// Per-item VERIFIED credential — the calibration work surfaced on the page itself:
// the conformal band's backtested COVERAGE (a track-record stat, never a forward price
// forecast — the index doesn't forecast) + the freshness/staleness read. Both are
// deterministic functions of the frozen vendored data, so the page never churns.
const MuntinConformal = require(path.join(repoRoot, 'tools/_shared/cost-conformal.js'));
const MuntinStaleness = require(path.join(repoRoot, 'tools/_shared/cost-staleness.js'));
// CRIT-5 multiplicity gate — per-item null (moving-block bootstrap) + Benjamini-
// Yekutieli across the panel, so a non-neutral read only surfaces where it beats
// the item's OWN week-to-week noise after correcting for scanning every ingredient.
const MuntinSpike = require(path.join(repoRoot, 'tools/_shared/cost-spike.js'));
const MuntinNullGate = require(path.join(repoRoot, 'tools/_shared/cost-null-gate.js'));
const DEEP_HIST = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index-history.json'), 'utf8')).ingredients || {}; }
  catch { return {}; }
})();
// Edible-portion yields (slug -> { yield, en, es, unit_en, unit_es, cat }). Lets a
// coverage-in-progress page still give the operator ONE honest fact — the usable
// share after trim/waste — even when no live wholesale price has earned publication.
const YIELDS = (() => {
  try { const a = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/ingredient-yields.json'), 'utf8'));
    const m = {}; for (const y of a) if (y && y.slug) m[y.slug] = y; return m; }
  catch { return {}; }
})();
// Prefer the deep backfill (enough points to backtest coverage); fall back to the
// vendored capped history.
function bandSeries(slug, entry) {
  const d = DEEP_HIST[slug];
  if (Array.isArray(d) && d.length >= 20) return d.map((p) => p.valueCents).filter((x) => typeof x === 'number');
  const h = entry && Array.isArray(entry.history) ? entry.history : [];
  return h.map((p) => p.valueCents).filter((x) => typeof x === 'number');
}
// Cadence of the series a coverage claim is computed on: the deep backfill is
// MONTHLY for a few items (beef) and WEEKLY for the rest. A blanket "weeks" mislabels
// the monthly items (audit HIGH-1), so derive it from the actual date spacing.
function seriesCadence(slug, entry) {
  const d = DEEP_HIST[slug];
  const rows = (Array.isArray(d) && d.length >= 20) ? d : (entry && Array.isArray(entry.history) ? entry.history : []);
  const dates = rows.map((p) => p.date).filter(Boolean).sort();
  if (dates.length < 3) return 'weekly';
  const gaps = [];
  for (let i = 1; i < dates.length; i++) {
    const a = Date.parse(dates[i - 1]), b = Date.parse(dates[i]);
    if (isFinite(a) && isFinite(b)) gaps.push((b - a) / 86400000);
  }
  gaps.sort((a, b) => a - b);
  const med = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 7;
  return med >= 20 ? 'monthly' : 'weekly';
}
// The per-item verified line: backtested coverage (only when it genuinely holds — an
// honest per-item record, not the pooled claim) + the freshness read. '' when neither
// is verifiable, so the generic method link stands alone.
function verifiedNote(slug, entry, point, locale) {
  const es = locale === 'es';
  const bits = [];
  // RAW walk-forward coverage (leakage-free) with its Wilson range; published only
  // when the un-tuned band genuinely holds (audit CRIT-2 / HIGH-6 — no widening, a
  // range not a point, and the horizon stated per the series' real cadence).
  const r = MuntinConformal.conformalNext(bandSeries(slug, entry), { alpha: 0.20, window: 52 });
  if (r && r.coverage != null && !r.degenerate && r.coverage >= 0.75) {
    const pct = Math.round(r.coverage * 100);
    const lo = Math.round((r.coverageLo != null ? r.coverageLo : r.coverage) * 100);
    const hi = Math.round((r.coverageHi != null ? r.coverageHi : r.coverage) * 100);
    const monthly = seriesCadence(slug, entry) === 'monthly';
    bits.push(es
      ? `nuestro rango del 80% capturó la próxima lectura ${monthly ? 'mensual' : 'semanal'} cerca del ${pct}% de las veces (${lo}–${hi}%, ${r.nTested} lecturas)`
      : `our 80% range caught the next ${monthly ? 'monthly' : 'weekly'} print about ${pct}% of the time (${lo}–${hi}%, ${r.nTested} reads)`);
  }
  const st = point ? MuntinStaleness.stalenessOf(point, {}) : null;
  if (st) bits.push(st.overdue
    ? (es ? `lectura con ${st.staleDays} días de atraso para su cadencia` : `${st.staleDays} days overdue for its source's cadence`)
    : (es ? 'al día para la cadencia de su fuente' : 'current for its source’s cadence'));
  if (!bits.length) return '';
  return `<p class="ci-read__verified"><strong>${es ? 'Verificado' : 'Verified'}:</strong> ${bits.join(' · ')}.</p>`;
}
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

// CRIT-5: stamp flag.gated on every ingredient whose spike read is a non-neutral
// "call". gated=false → the shared verdict voice (cost-verdict.js) withholds it to
// the neutral "not distinguishable from its own noise" note. An item surfaces only
// if its own-null p survives Benjamini-Yekutieli at q=0.10 across the panel; items
// too short to bootstrap are withheld. Deterministic (slug-seeded). The client seed
// receives the same field from build-cost-index.mjs on the next vendor run.
(() => {
  const items = [];
  for (const slug of Object.keys(COST_INDEX)) {
    const flag = COST_INDEX[slug] && COST_INDEX[slug].flag;
    if (!flag || !flag.verdict || MuntinNullGate.actionRank(flag.verdict) <= 0) continue;
    items.push({ key: slug, levels: bandSeries(slug, COST_INDEX[slug]), verdict: flag.verdict });
  }
  const { surfaced } = MuntinNullGate.gatePanel(items, MuntinSpike.classify, { q: 0.10 });
  for (const it of items) COST_INDEX[it.key].flag.gated = !!surfaced[it.key];
})();
// Sourced driver-association catalog (association, never causation). Each entry
// carries a labelled mechanism + a source/sourceUrl/retrievedAt for the hub
// "what's moving" insight evidence drawer. Spoken only on an up read, per the
// catalog's own honesty note.
const DRIVER_CAT = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index-drivers.json'), 'utf8')).drivers || []; }
  catch { return []; }
})();
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

// ---- Seasonality (multi-year monthly norms) ------------------------
// data/seasonality.json carries, per ingredient, a per-month median + p25/p75
// earned ACROSS distinct calendar years, with a `ready` flag and a `years`
// count per month. Built by scripts/build-seasonality.mjs from the deep public
// history. Used to render the "typical for this month" band — gated so a month
// only earns a "typical" figure once observed across >=2 distinct years (the
// methodology's stated bar). Shape is an array of entries keyed by `.key`.
const SEASON = (() => {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/seasonality.json'), 'utf8'));
    const arr = Array.isArray(raw) ? raw : (raw.ingredients || []);
    const map = {};
    for (const e of arr) { if (e && e.key) map[e.key] = e; }
    return map;
  } catch { return {}; }
})();
const MONTHS_EN = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_ES = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// HOLD-UNTIL-PROVEN. The 2026-Q2 calibration (scripts/calibrate-pressure.mjs) found
// the hand-set pressure weights have weak out-of-sample support against the best
// free long-history price proxy. So the inferred Outlook overlay is PUBLISHED for an
// ingredient only once its OWN live track record (predicted direction vs the realized
// measured trend) clears this bar — it earns its public slot by demonstrated hit
// rate, never by assertion. Until then the page ships the MEASURED read alone and the
// overlay accrues its record silently. (Config lives here, transparent + tunable.)
const PROVING = (PRESSURE_RULES.defaults && PRESSURE_RULES.defaults.proving) || { minCalls: 12, minHitRate: 0.6, minNonSteadyCalls: 4 };
function pressureProven(rec) {
  const tr = rec && rec.track_record;
  // Three floors, all required: enough scored calls, a real hit rate, AND enough
  // of those calls were actual directional (non-'steady') bets — so a rule can't
  // earn its public overlay by calling flat forever and riding flat's base rate.
  return !!(tr && tr.n >= PROVING.minCalls && tr.hitRate >= PROVING.minHitRate
    && (tr.nonSteady || 0) >= (PROVING.minNonSteadyCalls || 0));
}
function anyPressureProven() { return Object.values(PRESSURE_ITEMS).some(pressureProven); }
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
  'onion-shipments':           { en: 'Shipment volume', es: 'Volumen de envíos' },
  'lettuce-shipments':         { en: 'Shipment volume', es: 'Volumen de envíos' },
  'tomato-shipments':          { en: 'Shipment volume', es: 'Volumen de envíos' },
  'potato-shipments':          { en: 'Shipment volume', es: 'Volumen de envíos' },
  'onion-imports':             { en: 'Import share', es: 'Cuota de importación' },
  'lettuce-imports':           { en: 'Import share', es: 'Cuota de importación' },
  'tomato-imports':            { en: 'Import share', es: 'Cuota de importación' },
  'potato-imports':            { en: 'Import share', es: 'Cuota de importación' },
  'onion-pace':                { en: 'Shipments vs last year', es: 'Envíos vs. año pasado' },
  'lettuce-pace':              { en: 'Shipments vs last year', es: 'Envíos vs. año pasado' },
  'tomato-pace':               { en: 'Shipments vs last year', es: 'Envíos vs. año pasado' },
  'potato-pace':               { en: 'Shipments vs last year', es: 'Envíos vs. año pasado' },
  'freeze-alert':              { en: 'Freeze warnings', es: 'Alertas de helada' },
  'drought-ca-az':             { en: 'Drought (CA/AZ)', es: 'Sequía (CA/AZ)' },
  'drought-fl-ca':             { en: 'Drought (FL/CA)', es: 'Sequía (FL/CA)' },
  'drought-id':                { en: 'Drought (Idaho)', es: 'Sequía (Idaho)' },
  'drought':                   { en: 'Drought (growing regions)', es: 'Sequía (regiones de cultivo)' },
  'crop-condition':            { en: 'Crop condition', es: 'Condición del cultivo' },
  'onion-transition':           { en: 'Region transition', es: 'Transición de región' },
  'lettuce-transition':           { en: 'Region transition', es: 'Transición de región' },
  'tomato-transition':           { en: 'Region transition', es: 'Transición de región' },
  'potato-transition':           { en: 'Region transition', es: 'Transición de región' },
  'feed-grain':                { en: 'Feed grain (corn)', es: 'Grano forrajero (maíz)' },
  'diesel':                    { en: 'Diesel / freight', es: 'Diésel / flete' }
};
function sourceShort(key) {
  if (!key) return '';
  if (key.indexOf('nass') === 0) return 'USDA NASS';
  if (key.indexOf('ams') === 0) return 'USDA AMS';
  if (key.indexOf('ers') === 0) return 'USDA ERS';
  if (key.indexOf('eia') === 0) return 'EIA';
  if (key.indexOf('fred') === 0) return 'FRED';
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
// Source-id prefix → glossary term slug, so the inline "Sources" disclosure
// can teach what each agency is (the Cost Data & Sources class). Plain label
// when a source has no term page yet.
const CI_SOURCE_GLOSS = { 'usda-ams': 'usda-market-news', 'usda-lmr': 'usda-lmr', bls: 'bls', fred: 'fred', eia: 'eia', noaa: 'noaa-fisheries' };
function glossSourceLink(srcId, label, es) {
  for (const k of Object.keys(CI_SOURCE_GLOSS)) if (srcId.startsWith(k)) return `<a href="${es ? '/es' : ''}/glossary/${CI_SOURCE_GLOSS[k]}/">${label}</a>`;
  return label;
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
  'vegetable-oil':   { cat: 'pantry',     drivers: ['soybeans', 'diesel'] },
  // Batch 1 (high-traffic) — labels already curated in data/cost-index-labels.json.
  'ground-beef':     { cat: 'beef',       drivers: ['corn', 'soybeans', 'diesel'] },
  'short-rib':       { cat: 'beef',       drivers: ['corn', 'soybeans', 'diesel'] },
  'chicken-thigh':   { cat: 'poultry',    drivers: ['corn', 'soybeans', 'diesel'] },
  'whole-salmon':    { cat: 'seafood',    drivers: ['diesel'] },
  'tuna-loin':       { cat: 'seafood',    drivers: ['diesel'] },
  'bell-pepper':     { cat: 'produce',    drivers: ['diesel'] },
  'garlic':          { cat: 'produce',    drivers: ['diesel'] },
  'avocado':         { cat: 'produce',    drivers: ['diesel'] },
  'lemon':           { cat: 'produce',    drivers: ['diesel'] },
  'button-mushroom': { cat: 'produce',    drivers: ['diesel'] },
  'cucumber':        { cat: 'produce',    drivers: ['diesel'] },
  'broccoli':        { cat: 'produce',    drivers: ['diesel'] },
  'cauliflower':       { cat: 'produce',    drivers: ['diesel'] },
  'spinach':           { cat: 'produce',    drivers: ['diesel'] },
  'asparagus':         { cat: 'produce',    drivers: ['diesel'] },
  'carrot':            { cat: 'produce',    drivers: ['diesel'] },
  'corn-on-the-cob':   { cat: 'produce',    drivers: ['diesel'] },
  'kale':              { cat: 'produce',    drivers: ['diesel'] },
  'basil':             { cat: 'produce',    drivers: ['diesel'] },
  'cilantro':          { cat: 'produce',    drivers: ['diesel'] },
  'sweet-potato':      { cat: 'produce',    drivers: ['diesel'] },
  'lime':              { cat: 'produce',    drivers: ['diesel'] },
  'pineapple':         { cat: 'produce',    drivers: ['diesel'] },
  'whole-lobster':     { cat: 'seafood',    drivers: ['diesel'] },
  'celery':            { cat: 'produce',    drivers: ['diesel'] },
  'cabbage':           { cat: 'produce',    drivers: ['diesel'] },
  'eggplant':          { cat: 'produce',    drivers: ['diesel'] },
  'zucchini':          { cat: 'produce',    drivers: ['diesel'] },
  'beet':              { cat: 'produce',    drivers: ['diesel'] },
  'leek':              { cat: 'produce',    drivers: ['diesel'] },
  'ginger':            { cat: 'produce',    drivers: ['diesel'] },
  'yellow-squash':     { cat: 'produce',    drivers: ['diesel'] },
  'jalapeno':          { cat: 'produce',    drivers: ['diesel'] },
  'green-onion':       { cat: 'produce',    drivers: ['diesel'] },
  'green-beans':       { cat: 'produce',    drivers: ['diesel'] },
  'parsley':           { cat: 'produce',    drivers: ['diesel'] },
  'brussels-sprouts':  { cat: 'produce',    drivers: ['diesel'] },
  'butternut-squash':  { cat: 'produce',    drivers: ['diesel'] },
  'iceberg-lettuce':   { cat: 'produce',    drivers: ['diesel'] },
  'bok-choy':          { cat: 'produce',    drivers: ['diesel'] },
  'artichoke':         { cat: 'produce',    drivers: ['diesel'] },
  'okra':              { cat: 'produce',    drivers: ['diesel'] },
  'snow-peas':         { cat: 'produce',    drivers: ['diesel'] },
  'butter-lettuce':    { cat: 'produce',    drivers: ['diesel'] },
  'green-leaf-lettuce': { cat: 'produce',    drivers: ['diesel'] },
  'red-leaf-lettuce':  { cat: 'produce',    drivers: ['diesel'] },
  'collard-greens':    { cat: 'produce',    drivers: ['diesel'] },
  'napa-cabbage':      { cat: 'produce',    drivers: ['diesel'] },
  'rutabaga':          { cat: 'produce',    drivers: ['diesel'] },
  'daikon':            { cat: 'produce',    drivers: ['diesel'] },
  'cherry-tomato':     { cat: 'produce',    drivers: ['diesel'] },
  'acorn-squash':      { cat: 'produce',    drivers: ['diesel'] },
  'serrano-pepper':    { cat: 'produce',    drivers: ['diesel'] },
  'poblano-pepper':    { cat: 'produce',    drivers: ['diesel'] },
  'habanero-pepper':   { cat: 'produce',    drivers: ['diesel'] },
  'mint':              { cat: 'produce',    drivers: ['diesel'] },
  'rosemary':          { cat: 'produce',    drivers: ['diesel'] },
  'thyme':             { cat: 'produce',    drivers: ['diesel'] },
  'oregano':           { cat: 'produce',    drivers: ['diesel'] },
  'tarragon':          { cat: 'produce',    drivers: ['diesel'] },
  'dill':              { cat: 'produce',    drivers: ['diesel'] },
  'red-onion':         { cat: 'produce',    drivers: ['diesel'] },
  'red-potato':        { cat: 'produce',    drivers: ['diesel'] },
  'grapefruit':        { cat: 'produce',    drivers: ['diesel'] },
  'apple':             { cat: 'produce',    drivers: ['diesel'] },
  'pear':              { cat: 'produce',    drivers: ['diesel'] },
  'banana':            { cat: 'produce',    drivers: ['diesel'] },
  'watermelon':        { cat: 'produce',    drivers: ['diesel'] },
  'cantaloupe':        { cat: 'produce',    drivers: ['diesel'] },
  'blueberry':         { cat: 'produce',    drivers: ['diesel'] },
  'raspberry':         { cat: 'produce',    drivers: ['diesel'] },
  'whole-turkey':      { cat: 'poultry',    drivers: ['corn', 'soybeans', 'diesel'] },
  'whole-halibut':     { cat: 'seafood',    drivers: ['diesel'] },
  'whole-trout':       { cat: 'seafood',    drivers: ['diesel'] },
  'scallops':          { cat: 'seafood',    drivers: ['diesel'] },
  'whole-crab':        { cat: 'seafood',    drivers: ['diesel'] },
  'octopus':           { cat: 'seafood',    drivers: ['diesel'] },
  'salmon-skin-on-fillet':{ cat: 'seafood',    drivers: ['diesel'] },
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
// pages, the hub, and the Cost Index dashboard speak identically — a thin-data
// "structural" reads "Watch", not "Re-price", on every surface. The chip is
// the terse action; the note is the calibrated reason. The flag is a build-
// time, fact-gated qualitative read — no sourced numbers live here.
const TONE_BIAS = { hold: 'hold', watch: 'watch', reprice: 're-price' };
const TONE_LABEL = {
  'hold':     { en: 'Hold',     es: 'Mantener' },
  'watch':    { en: 'Watch',    es: 'Vigilar' },
  // Post-audit (2026-07, C3/C6): the firm-structural chip is a DESCRIPTION of state
  // ("up and holding"), not an imperative to re-price — the forward call was unearned.
  're-price': { en: 'Elevated', es: 'Elevado' }
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
// Driver association for the hub mover insight. Association, NEVER cause, and it
// honors the catalog's own rule: a driver is spoken ONLY when the measured read
// is up (a supply-risk backdrop never explains an easing print). It surfaces the
// sourced mechanism + a cite drawer, so the "why" travels with its evidence.
// Bilingual: ES reads the catalog's own label_es/mechanism_es (the registered
// Spanish translation). A driver that lacks ES prose is omitted on the ES page
// rather than leaking English text — so a half-translated catalog can never
// breach the ES voice contract; those ES movers still get magnitude +
// persistence + the verdict's own note_es + action.
function hubDriverInsight(slug, r, locale) {
  const es = locale === 'es';
  const up = !!(r && r.trend && r.trend.dir === 'up');
  if (!up) return { assoc: '', cite: '' };
  const d = DRIVER_CAT.find((x) => Array.isArray(x.affects) && x.affects.includes(slug) && x.directionExpected === 'up');
  if (!d) return { assoc: '', cite: '' };
  // ES needs the translated prose; without it, omit (never drop English on /es/).
  if (es && (!d.label_es || !d.mechanism_es)) return { assoc: '', cite: '' };
  const label = es ? d.label_es : d.label;
  const mechanism = es ? d.mechanism_es : d.mechanism;
  const tracks = es ? 'A menudo sigue a' : 'Often tracks';
  const tag = es ? 'asociación, no causa' : 'association, not cause';
  const assoc = ` ${tracks} <strong>${escHtml(label)}</strong> — ${escHtml(mechanism)} <span class="ci-assoc-tag">(${tag})</span>.`;
  const evid = es ? 'Evidencia' : 'Evidence';
  const retrieved = es ? 'recuperado' : 'retrieved';
  const srcLabel = es ? 'fuente' : 'source';
  const cite = d.source
    ? `<details class="cite ci-moving-cite"><summary>${evid}</summary><p>${escHtml(d.source)}${d.retrievedAt ? ` · ${retrieved} ${escHtml(d.retrievedAt)}` : ''}${d.sourceUrl ? ` · <a href="${escHtml(d.sourceUrl)}" rel="nofollow noopener" target="_blank">${srcLabel}</a>` : ''}</p></details>`
    : '';
  return { assoc, cite };
}
function movingNowSection(slugs, locale) {
  const es = locale === 'es';
  // CRIT-5: a read that the null gate withheld (flag.gated===false) is NOT "moving"
  // in any statistically-distinguished sense — it reverts to the neutral voice — so
  // it is excluded from the triage reel. The honest count below makes the
  // withholding legible instead of silently emptying the section.
  const gatedOut = (s) => { const f = hubFlag(s); return !!(f && f.gated === false); };
  const candSlugs = slugs.filter((s) => { const f = hubFlag(s); return f && MuntinNullGate.actionRank(f.verdict) > 0; });
  const M = candSlugs.length;
  const K = candSlugs.filter((s) => { const f = hubFlag(s); return f.gated !== false; }).length;
  const barNote = M > 0
    ? (es ? `${K} de ${M} movimientos rastreados superaron nuestro filtro de ruido y comparación múltiple esta semana; el resto se lee como contexto, no como una señal.`
          : `${K} of ${M} tracked moves cleared our noise + multiple-comparison bar this week; the rest read as context, not a call.`)
    : '';
  const bar = barNote ? `<p class="ci-moving-bar">${barNote}</p>` : '';
  const rows = slugs
    .map((s) => ({ s, v: ingVerdict(s), r: readingOf(s) }))
    .filter((x) => x.v && x.v.tone !== 'hold' && !gatedOut(x.s))   // surface distinguished watch + reprice
    .sort((a, b) => (TONE_RANK[a.v.tone] - TONE_RANK[b.v.tone]) || a.s.localeCompare(b.s));
  // Curate, don't dump (persona audit #4): "what's moving" is the highlight reel
  // — the handful that need action — not the whole list. Dumping all ~20 movers
  // here repeats the same "elevated N weeks" note over and over AND re-lists the
  // same ingredients already in the searchable readings table below. Show every
  // act-now re-price; fill to a cap with watches; point to the table for the rest.
  const CAP = 8;
  const repriceCount = rows.filter((x) => x.v.tone === 'reprice').length;
  const shown = rows.slice(0, Math.max(repriceCount, CAP));
  const moreCount = rows.length - shown.length;
  const head = es ? 'Qué se está moviendo ahora' : "What's moving now";
  if (!rows.length) {
    const calm = es
      ? `Nada exige acción esta semana — la mayoría de los ingredientes están en su rango habitual.`
      : `Nothing needs action this week — most ingredients are sitting in their usual range.`;
    return `<section class="ci-moving"><h2 class="ci-cat-h" id="moving">${head}</h2>${bar}<p class="ci-moving-calm">${calm}</p></section>`;
  }
  const lis = shown.map((x) => {
    const { s, v, r } = x;
    const l = LABELS[s] || {};
    const nm = (es ? (l.es || l.en) : l.en) || s;
    const base = es ? '/es' : '';
    // The verdict engine's own authoritative, gated reasoning carries the
    // (sustained) directional story.
    const note = es ? (v.note_es || '') : (v.note_en || '');
    // NO live cents on the hub. Per the honesty contract, a price appears ONLY in
    // the per-ingredient "Market read" cited-data block (asOf badge + provenance
    // drawer); the index/hub stays cents-free, and the exact figure lives one
    // click away via the full read. We also omit the current-week direction word
    // (a live down-tick on a still-elevated "structural" flag would read
    // "down … up and holding"). The hub insight is therefore: measured
    // persistence + the verdict's own reasoning + a sourced driver association
    // + a single action — empowering, evidence-led, and price-free.
    const wk = (hubFlag(s) || {}).elevatedWeeks;
    const persistLead = (typeof wk === 'number' && wk >= 2 && !/weeks?|semanas?/i.test(note))
      ? (es ? `Elevado ${wk} semanas` : `Elevated ${wk} weeks`) : '';
    const di = hubDriverInsight(s, r, locale);
    const action = es ? (v.verb_es || 'Observa') : (v.verb_en || 'Watch');
    const more = es ? 'lectura completa' : 'full read';
    const read = `${persistLead ? `${persistLead}. ` : ''}${note ? escHtml(note) : ''}${di.assoc}`;
    return `<li class="ci-moving-item">${verdictChip(v, locale)}<a href="${base}/cost-index/${s}/">${escHtml(nm)}</a>`
      + `<div class="ci-moving-insight"><p class="ci-moving-read">— ${read}</p>${indexedMovement(r && r.entry, locale, {})}${di.cite}`
      + `<p class="ci-moving-act">→ <strong>${escHtml(action)}.</strong> <a class="ci-moving-more" href="${base}/cost-index/${s}/">${more} →</a></p></div></li>`;
  }).join('');
  const key = es
    ? `<strong>Elevado</strong> = sube y se mantiene (contexto, no una decisión) · <strong>Vigilar</strong> = un movimiento real, aún sin confirmar · <strong>Mantener</strong> = dentro de su rango normal`
    : `<strong>Elevated</strong> = up and holding (context, not a call) · <strong>Watch</strong> = a real move, not yet confirmed · <strong>Hold</strong> = within its normal range`;
  const moreLine = moreCount > 0
    ? `<p class="ci-moving-more-all">${es
        ? `+${moreCount} más en movimiento — míralos todos en <a href="#all-readings">la tabla de lecturas</a> de abajo.`
        : `+${moreCount} more moving — see them all in <a href="#all-readings">the readings table</a> below.`}</p>`
    : '';
  return `<section class="ci-moving"><h2 class="ci-cat-h" id="moving">${head}</h2>${bar}<p class="ci-vkey">${key}</p><ul class="ci-moving-list">${lis}</ul>${moreLine}</section>`;
}

// ---- Composite band — the whole basket as one honest reading ----------
// The weighted basket is computed in data/cost-index.json (build-cost-index.mjs)
// and, until now, rendered nowhere on the hub. It is a READING AGAINST BASELINE
// — the same semantics the weekly dispatch publishes via its viz-ring — never a
// "move this window." We surface it as the hub's headline data-product KPI: the
// basket's standing read, the breadth of the staples behind it (its credibility
// lever), its confidence tier and as-of date, with a provenance drawer. Every
// number derives from the basket object — zero invention. NO live cents: an
// index reading is a percentage against baseline, not a price.
function compositeBand(locale) {
  const es = locale === 'es';
  const b = CI.basket;
  if (!b || typeof b.pct !== 'number' || !Array.isArray(b.contributors) || !b.contributors.length) return '';
  const contribs = b.contributors.filter((c) => typeof c.pct === 'number');
  if (!contribs.length) return '';
  const n = b.nContributing || contribs.length;
  // Spread from the basket's OWN contributors (a small deadband keeps a hair-line
  // reading from being called a direction), so the parts reconcile to the whole.
  const DEAD = 0.005;
  let up = 0, down = 0, flat = 0;
  for (const c of contribs) { if (c.pct > DEAD) up++; else if (c.pct < -DEAD) down++; else flat++; }
  const band = b.pct > DEAD ? 'up' : b.pct < -DEAD ? 'down' : 'flat';
  const pctStr = `${b.pct >= 0 ? '+' : '−'}${Math.abs(b.pct * 100).toFixed(1)}%`;
  const confMap = es
    ? { high: 'confianza alta', medium: 'confianza media', moderate: 'confianza media', low: 'confianza baja' }
    : { high: 'high confidence', medium: 'medium confidence', moderate: 'moderate confidence', low: 'low confidence' };
  const confChip = confMap[b.confidence] || (es ? 'confianza sin declarar' : 'confidence unstated');
  const asOf = b.asOf || '—';
  const asOfChip = es ? `al ${asOf}` : `as of ${asOf}`;
  const head = es ? 'Dónde está la canasta' : 'Where the basket sits';
  const say = es
    ? `la canasta ponderada de ${n} insumos de restaurante, frente a su ventana base`
    : `the weighted basket of ${n} restaurant staples, against its baseline window`;
  // Agreement (weight-share moving the dominant way) near 0.5 means the staples
  // are nearly split — the composite % is then a soft signal, not a precise read.
  // Say so, using the real number, so one decimal never implies false precision.
  const agree = typeof b.agreement === 'number' ? b.agreement : null;
  const splitNote = (agree != null && agree < 0.6)
    ? (es
      ? ` Las fuentes están casi divididas en partes iguales (acuerdo ${Math.round(agree * 100)}%), así que léelo como una señal suave, no una cifra precisa.`
      : ` The staples are nearly evenly split (agreement ${Math.round(agree * 100)}%), so read it as a soft signal, not a precise figure.`)
    : '';
  const spread = es
    ? `<strong>${up}</strong> de ${n} por encima de su línea base · <strong>${down}</strong> por debajo · <strong>${flat}</strong> sin cambio. Es una lectura de estado, no un movimiento respecto a la semana pasada.${splitNote}`
    : `<strong>${up}</strong> of ${n} reading above their baseline · <strong>${down}</strong> below · <strong>${flat}</strong> flat. A state-of-play reading, not a week-over-week move.${splitNote}`;
  const base = es ? '/es' : '';
  const srcSummary = es ? 'Cómo se construye esta cifra' : 'How this figure is built';
  const srcBody = es
    ? `Compuesto ponderado de ${n} insumos seguidos, cada uno leído frente a su propia ventana base con datos públicos de mercado de EE. UU. (USDA, BLS, FRED, EIA, NOAA). Una lectura frente a la base — no un precio, ni un cambio desde la semana pasada. Ver los ${n} pesos y cómo se arma el compuesto en <a href="${base}/cost-index/basket/">La Cesta de Restaurante Muntin</a>, o <a href="${base}/cost-index/methodology/">cómo se construye el índice</a>.`
    : `Weighted composite of ${n} tracked staples, each read against its own baseline window from public U.S. market data (USDA, BLS, FRED, EIA, NOAA). A reading against baseline — not a price, and not a change since last week. See all ${n} weights and how the composite is assembled in <a href="${base}/cost-index/basket/">The Muntin Restaurant Basket</a>, or <a href="${base}/cost-index/methodology/">how the index is built</a>.`;
  return `<section class="ci-composite" data-band="${band}" aria-label="${es ? 'Lectura de la canasta' : 'Basket reading'}">
    <p class="ci-composite__head">${head}</p>
    <div class="ci-composite__read">
      <span class="ci-composite__num">${pctStr}</span>
      <span class="ci-composite__say">${say}</span>
    </div>
    <div class="ci-composite__meta">
      <span class="ci-composite__chip">${confChip}</span>
      <span class="ci-composite__chip">${asOfChip}</span>
    </div>
    <p class="ci-composite__spread">${spread}</p>
    <details class="ci-composite__src"><summary>${srcSummary}</summary><div>${srcBody}</div></details>
  </section>`;
}

// ---- The "all readings" table — the terminal scan view -------------
// Every shippable reading in one scannable grid: direction, verdict, as-of, and
// the price-free indexed-movement spark. NO live cents (the hub honesty contract)
// — the dollar range lives one click away on each ingredient page. Pure surfacing
// of values already rendered per page (no new statistic), ordered by verdict
// urgency then name so the movers sit on top. The <table> is wrapped in the
// known .table-scroll wrapper (check-table-scroll-wrap).
function allReadingsTable(slugs, locale) {
  const es = locale === 'es';
  const base = es ? '/es' : '';
  const rows = slugs.filter(shippable)
    .map((s) => ({ s, r: readingOf(s), v: ingVerdict(s) }))
    .filter((x) => x.r && x.v)
    .sort((a, b) => (TONE_RANK[a.v.tone] - TONE_RANK[b.v.tone]) || a.s.localeCompare(b.s));
  if (rows.length < 4) return '';
  const head = es ? 'Todas las lecturas' : 'All readings';
  const note = es
    ? `Las ${rows.length} lecturas que pasan la barra de publicación, los movimientos primero. Sin precios aquí — abre un ingrediente para su rango en dólares.`
    : `All ${rows.length} readings that clear the publish bar — movers first. No prices here; open an ingredient for its dollar range.`;
  const cols = es
    ? ['Ingrediente', 'Dirección', 'Señal', 'Movimiento', 'Al']
    : ['Ingredient', 'Direction', 'Signal', 'Movement', 'As of'];
  const body = rows.map(({ s, r, v }) => {
    const l = LABELS[s] || {};
    const nm = (es ? (l.es || l.en) : l.en) || s;
    const dir = (r.trend && r.trend.dir) || 'flat';
    const dw = (r.trend && r.trend.dir) ? dirWord(r.trend, locale) : (es ? 'casi estable' : 'about flat');
    const spark = indexedMovement(r.entry, locale, {});
    // data-name (display name + slug) is the filter key for the search box below.
    const key = `${nm} ${s}`.toLowerCase();
    return `<tr data-name="${escHtml(key)}">`
      + `<td><a href="${base}/cost-index/${s}/">${escHtml(nm)}</a></td>`
      + `<td class="ci-t-dir" data-dir="${dir}">${escHtml(dw)}</td>`
      + `<td>${verdictChip(v, locale)}</td>`
      + `<td>${spark || '<span class="ci-t-na">—</span>'}</td>`
      + `<td>${escHtml(r.asOf || '—')}</td>`
      + `</tr>`;
  }).join('');
  // The find-an-ingredient box (the #1 experiential miss — two operators bounced
  // looking for their ingredient in an 82-row list). Hidden until JS so no-JS
  // users never see a dead control; the full table is the no-JS baseline. The
  // filter script lives in pageTail, guarded on this input's id.
  const emptyRow = `<tr class="ci-table-empty" data-empty hidden><td colspan="${cols.length}">${es ? 'Sin coincidencias.' : 'No matches.'}</td></tr>`;
  const tools = `<div class="ci-table-tools" hidden>`
    + `<label class="ci-table-search__label" for="ci-ingredient-search">${es ? 'Buscar ingrediente' : 'Find an ingredient'}</label>`
    + `<input id="ci-ingredient-search" class="ci-table-search" type="search" autocomplete="off" spellcheck="false" placeholder="${es ? 'Escribe un ingrediente…' : 'Type an ingredient…'}" aria-controls="ci-readings-table" />`
    + `<span class="ci-table-count" role="status" aria-live="polite"></span></div>`;
  return `<section class="ci-readings"><h2 class="ci-cat-h" id="all-readings">${escHtml(head)}</h2>`
    + `<p class="ci-pending-note">${note}</p>`
    + tools
    + `<div class="table-scroll"><table class="ci-table" id="ci-readings-table"><thead><tr>${cols.map((c) => `<th>${escHtml(c)}</th>`).join('')}</tr></thead><tbody>${body}${emptyRow}</tbody></table></div></section>`;
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
  // Post-audit (2026-07, C2): a pure POSITION phrase — no coupled buy/lock verb
  // (range position is near coin-flip for the next move), and "recent range" not
  // "usual range" so a ~6-month window is never read as an all-time judgment. The
  // gated seasonalBand block below carries any "seasonally cheap" cue where earned.
  const pos = now < lo ? (es ? 'cerca del fondo de su rango reciente' : 'near the bottom of its recent range')
    : now > hi ? (es ? 'cerca del tope de su rango reciente' : 'near the top of its recent range')
    : (es ? 'cerca de la mitad de su rango reciente' : 'around the middle of its recent range');
  const half = Math.floor(vals.length / 2);
  const ch = (() => { const a = medOf(vals.slice(0, half)); const b = medOf(vals.slice(half)); return a > 0 ? (b - a) / a : 0; })();
  const shape = ch > 0.03 ? (es ? 'subió a lo largo de la ventana' : 'rose over the tracked window')
    : ch < -0.03 ? (es ? 'bajó a lo largo de la ventana' : 'eased over the tracked window')
    : (es ? 'se mantuvo estable en la ventana' : 'held steady over the tracked window');
  const windowNote = es ? 'en la ventana seguida' : 'over the tracked window';
  // "Recent range" — NOT "Normally": this band is the trailing tracked window
  // (≤26 weeks), which for a seasonal item can be dominated by one season. The
  // word "normal" belongs only to the multi-year seasonal band (seasonalBand).
  const capsule = es
    ? `Rango reciente ${money(lo)}–${money(hi)}, ahora ${money(now)} — ${pos}.`
    : `Recent range ${money(lo)}–${money(hi)}, right now ${money(now)} — ${pos}.`;
  // Percentile-of-history as a COUNT (never a smoothed "85th percentile"):
  // the figure operators repeat. Last ≤12 prior reads, honesty-gated like
  // the rest of the block.
  const recent = vals.slice(Math.max(0, vals.length - 13), vals.length - 1);
  const above = recent.filter((v) => now > v).length;
  const rank = recent.length >= 8
    ? (above === 0
        ? (es ? `Más bajo que cada una de sus últimas ${recent.length} lecturas.` : `Lower than every one of its last ${recent.length} reads.`)
        : above === recent.length
        ? (es ? `Más alto que cada una de sus últimas ${recent.length} lecturas.` : `Higher than every one of its last ${recent.length} reads.`)
        : (es ? `Más alto que ${above} de sus últimas ${recent.length} lecturas.` : `Higher than ${above} of its last ${recent.length} reads.`))
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

// ---- Full 12-month seasonal curve ----------------------------------
// The band below states only THIS month's typical figure. This curve renders
// the WHOLE annual shape from the same seasonality.json — each month's median
// with its p25-p75 band — and names the cheapest/priciest month (the seasonal
// buying window). Same >=2-distinct-years honesty gate per month: months that
// haven't earned it are drawn as gaps, never guessed. Price-free by construction
// (a normalized shape + month names, no dollar figures asserted here), so it
// carries no data-season-* attributes and the seasonal checker ignores it.
function seasonalCurve(e, curMo, locale) {
  const es = locale === 'es';
  const order = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  const gated = order.map((k, i) => ({ i, mo: i + 1, m: e.months && e.months[k] }))
    .filter((x) => x.m && x.m.years >= 2 && x.m.medianCents > 0);
  if (gated.length < 4) return '';   // too few established months to show a shape
  let cheap = gated[0], dear = gated[0];
  for (const g of gated) { if (g.m.medianCents < cheap.m.medianCents) cheap = g; if (g.m.medianCents > dear.m.medianCents) dear = g; }
  let yMin = Math.min(...gated.map((g) => g.m.p25Cents));
  let yMax = Math.max(...gated.map((g) => g.m.p75Cents));
  if (yMax <= yMin) yMax = yMin + 1;
  const W = 288, H = 92, padL = 8, padR = 8, padT = 8, padB = 18;
  const pw = W - padL - padR, ph = H - padT - padB, bw = pw / 12 * 0.42;
  const xOf = (i) => padL + (i + 0.5) / 12 * pw;
  const yOf = (v) => padT + ph - (v - yMin) / (yMax - yMin) * ph;
  const PUR = '#6b4fa1';
  let bands = '', dots = '', labels = '', d = '', prev = -2;
  gated.forEach((g) => {
    const x = xOf(g.i), yhi = yOf(g.m.p75Cents), ylo = yOf(g.m.p25Cents), ym = yOf(g.m.medianCents);
    bands += `<rect x="${(x - bw / 2).toFixed(1)}" y="${yhi.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, ylo - yhi).toFixed(1)}" rx="2" fill="${PUR}" fill-opacity="0.15"/>`;
    d += (g.i === prev + 1 ? ' L ' : ' M ') + x.toFixed(1) + ' ' + ym.toFixed(1); prev = g.i;
    const isCheap = g.mo === cheap.mo, isCur = g.mo === curMo;
    dots += `<circle cx="${x.toFixed(1)}" cy="${ym.toFixed(1)}" r="${isCur ? 3.4 : 2.4}" fill="${isCheap ? 'var(--gold,#B7791F)' : PUR}"/>`;
    if (isCur) dots += `<circle cx="${x.toFixed(1)}" cy="${ym.toFixed(1)}" r="5.5" fill="none" stroke="${PUR}" stroke-width="1.3"/>`;
  });
  const line = `<path d="${d.trim()}" fill="none" stroke="${PUR}" stroke-width="1.4" stroke-opacity="0.7"/>`;
  const INI = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  for (let i = 0; i < 12; i++) {
    const cur = i + 1 === curMo;
    labels += `<text x="${xOf(i).toFixed(1)}" y="${H - 5}" text-anchor="middle" font-size="8" fill="${cur ? 'var(--ink,#16181D)' : 'var(--stone,#6B7280)'}"${cur ? ' font-weight="700"' : ''}>${INI[i]}</text>`;
  }
  const mc = es ? MONTHS_ES[cheap.mo] : MONTHS_EN[cheap.mo];
  const mdr = es ? MONTHS_ES[dear.mo] : MONTHS_EN[dear.mo];
  const cap = es
    ? `Curva estacional de 12 meses: mediana y banda p25-p75 por mes. Normalmente más barato en ${mc}, más caro en ${mdr}. Forma normalizada, sin precio.`
    : `12-month seasonal curve: each month's median and p25-p75 band. Usually cheapest in ${mc}, priciest in ${mdr}. Normalized shape, no price.`;
  const call = es
    ? `Ventana estacional: normalmente más barato en <strong>${mc}</strong>, más caro en <strong>${mdr}</strong>.`
    : `Seasonal window: usually cheapest in <strong>${mc}</strong>, priciest in <strong>${mdr}</strong>.`;
  return `<figure class="ci-season-curve">
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${cap}" preserveAspectRatio="xMidYMid meet">${bands}${line}${dots}${labels}</svg>
      <figcaption class="ci-season-curve__cap">${call} <span class="ci-season-curve__note">${gated.length}/12 ${es ? 'meses con ≥2 años' : 'months with ≥2 yrs'}</span></figcaption>
    </figure>`;
}

// ---- Seasonal "typical for this month" band ------------------------
// The trailing-window capsule above answers "is this above its RECENT range?"
// — it cannot answer the question an operator on a seasonal item actually asks:
// "is this expensive *for this month*, or just a normal seasonal level?" This
// band answers it from data/seasonality.json — the median + p25–p75 a month has
// earned across >=2 DISTINCT calendar years (below that bar nothing renders, per
// the methodology). Every figure is a deterministic re-derivation of the deep
// public history; the data-season-* attributes let check-cost-index-seasonal.mjs
// recompute and diff. Cents are allowed here (per-ingredient page, not the hub).
function seasonalBand(slug, r, locale) {
  const es = locale === 'es';
  const e = SEASON[slug];
  if (!e || !e.ready || !r || !r.emitPoint || !r.asOf) return '';
  const mo = parseInt(String(r.asOf).slice(5, 7), 10);
  if (!(mo >= 1 && mo <= 12)) return '';
  const md = e.months && e.months[String(mo).padStart(2, '0')];
  // The hard honesty gate: a month earns a "typical" figure only with >=2
  // distinct years observed (and a real median). Otherwise: render nothing.
  if (!md || !(md.years >= 2) || !(md.medianCents > 0)) return '';
  const lo = md.p25Cents, hi = md.p75Cents, med = md.medianCents;
  // current price drawn from the SAME basis/series the sparkline uses, so the
  // two never disagree.
  const basis = r.basis;
  const vals = (r.entry.history || [])
    .filter((h) => h && h.basis === basis && typeof h.valueCents === 'number' && isFinite(h.valueCents) && h.valueCents > 0)
    .map((h) => h.valueCents);
  const now = vals.length ? vals[vals.length - 1] : null;
  const monName = es ? MONTHS_ES[mo] : MONTHS_EN[mo];
  let posTxt = '';
  if (now != null && lo > 0 && hi > 0) {
    posTxt = now > hi
      ? (es ? ` La lectura actual (${money(now)}) está por encima de lo típico de ${monName}.` : ` The current read (${money(now)}) is running above its typical ${monName}.`)
      : now < lo
      ? (es ? ` La lectura actual (${money(now)}) está por debajo de lo típico de ${monName} — barato para la temporada.` : ` The current read (${money(now)}) is below its typical ${monName} — seasonally cheap.`)
      : (es ? ` La lectura actual (${money(now)}) está dentro de lo típico de ${monName}.` : ` The current read (${money(now)}) sits inside its typical ${monName}.`);
  }
  const rangeTxt = lo !== hi ? `${money(lo)}–${money(hi)}` : money(lo);
  const headTxt = es ? `Típico de ${monName}` : `Typical for ${monName}`;
  const body = es
    ? `Normalmente ${rangeTxt} (mediana ${money(med)}) en ${monName}, según ${md.n} lecturas en ${md.years} años distintos.${posTxt}`
    : `Usually ${rangeTxt} (median ${money(med)}) in ${monName}, across ${md.n} reads over ${md.years} distinct years.${posTxt}`;
  const srcTxt = es
    ? `Norma estacional de varios años, calculada a partir del historial público profundo (USDA, BLS, FRED). Un mes solo gana una cifra “típica” una vez observado en 2 o más años distintos; por debajo de esa barra no se muestra ninguna.`
    : `Multi-year seasonal norm, computed from the deep public history (USDA, BLS, FRED). A month earns a “typical” figure only once observed across 2 or more distinct years; below that bar, none is shown.`;
  const summ = es ? 'Cómo se calcula lo típico' : 'How “typical” is figured';
  const curve = seasonalCurve(e, mo, locale);
  return `
    <div class="ci-season" data-season-month="${mo}" data-season-med="${med}" data-season-lo="${lo}" data-season-hi="${hi}" data-season-years="${md.years}" data-season-n="${md.n}">
      <p class="ci-season__head">${headTxt}</p>
      <p class="ci-season__body">${body}</p>
      ${curve}
      <details class="ci-season__src"><summary>${summ}</summary><div>${srcTxt}</div></details>
    </div>`;
}

// ---- The visible "Market read" data block --------------------------
// The 5-second answer, promoted above the lede: direction · price range · as-of · verdict.
// Reuses the same helpers as the full reading so the two can never disagree.
function answerBanner(slug, locale) {
  const r = readingOf(slug);
  if (!r || !r.emitRange || !Array.isArray(r.rc)) return '';
  const es = locale === 'es';
  const lab = LABELS[slug] || {};
  const unit = (es ? (lab.unit_es || lab.unit_en) : lab.unit_en) || '';
  const unitSfx = unit ? `/${unit}` : '';
  const range = r.rc[0] !== r.rc[1] ? `${money(r.rc[0])}–${money(r.rc[1])}` : money(r.rc[0]);
  // Lead with the RANGE, not a direction word: this is the exact line answer
  // engines lift, and the 25-year backtest shows direction is at chance. The
  // committability verdict chip (Hold/Watch) is volatility, not a price call.
  const asOf = r.asOf || '—';
  const chip = verdictChip(ingVerdict(slug), locale);
  return `<p class="ci-answer">~${range}${unitSfx} · ${es ? 'al' : 'as of'} ${asOf} ${chip}</p>`;
}

// ---- Price-free INDEXED movement chart ----------------------------
// Normalizes the gated history series to 100 at the window's first read and
// plots the relative path true-to-scale: it shows HOW MUCH and which way an
// item moved WITHOUT ever stating a price (cents live only in the per-ingredient
// cited Market-read block). Honest by construction — it's the shape of the
// already-gated series. Gated on >=8 same-basis real reads; the caption labels
// the REAL date window (it never claims a span we don't have — e.g. "6 months"
// when only weeks exist). The window lengthens as history accumulates.
function indexedMovement(entry, locale, opts) {
  opts = opts || {};
  const es = locale === 'es';
  if (!entry || !Array.isArray(entry.history)) return '';
  const point = Array.isArray(entry.points) ? entry.points[0] : null;
  const basis = (point && point.level && point.level.basis) || 'wholesale';
  const pts = entry.history
    .filter((h) => h && h.basis === basis && typeof h.valueCents === 'number'
                && isFinite(h.valueCents) && h.valueCents > 0 && h.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (pts.length < 8) return '';
  const base = pts[0].valueCents;
  if (!(base > 0)) return '';
  const idx = pts.map((p) => 100 * p.valueCents / base);
  const firstDate = pts[0].date, lastDate = pts[pts.length - 1].date;
  const idxNow = Math.round(idx[idx.length - 1]);
  // The direction word derives from the SAME headline index (endpoint vs the 100
  // baseline) so it can NEVER contradict the number or the curve it labels. A
  // half-window median (which an earlier version used) measures a different thing
  // and could say "rose" while the line ends below 100 — caught by fact-gate review.
  const shape = idxNow > 103 ? (es ? 'subió' : 'rose')
              : idxNow < 97 ? (es ? 'bajó' : 'eased')
              : (es ? 'se mantuvo estable' : 'held steady');
  const big = opts.size === 'large';
  // Index value IS relative movement (100 = the window's start); it is never a
  // price, carries its dates, and traces to the same gated series as everything
  // else — so it is build-stamped + dated, like the direction word.
  const cap = es
    ? `Indexado a 100 el ${firstDate} · ~${idxNow} el ${lastDate} — ${shape} en la ventana seguida. Movimiento relativo, sin precio.`
    : `Indexed to 100 on ${firstDate} · ~${idxNow} on ${lastDate} — ${shape} over the tracked window. Relative movement, no price.`;
  const svg = MuntinSparkline.render(idx.map((v) => Math.round(v * 10) / 10), {
    width: big ? 460 : 132, height: big ? 128 : 34, stroke: '#2A50C8',
    baseline: 100, fill: big ? 'rgba(42,80,200,0.10)' : false, dotLast: true,
    ariaLabel: cap,
  });
  return big
    ? `<figure class="ci-index"><figcaption class="ci-index__cap">${escHtml(cap)}</figcaption>${svg}</figure>`
    : `<span class="ci-index ci-index--mini">${svg}</span>`;
}

function marketReadBlock(slug, locale) {
  const r = readingOf(slug);
  if (!r) return '';
  const es = locale === 'es';
  const point = r.entry && Array.isArray(r.entry.points) ? r.entry.points[0] : null;
  const verified = verifiedNote(slug, r.entry, point, locale);
  const verdict = verdictLine(r.entry.flag, r.conf, locale);
  const spark = sparkBlock(r, locale);
  const season = seasonalBand(slug, r, locale);
  const idxChart = indexedMovement(r.entry, locale, { size: 'large' });
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
  const shortListLinked = (() => { const seen = new Set(), out = []; for (const p of (r.point.provenance || [])) { const lab = shortSource(p.source); if (seen.has(lab)) continue; seen.add(lab); out.push(glossSourceLink(p.source, lab, es)); } return out; })();
  const disclaimer = r.basis === 'retail'
    ? (es ? 'Referencia minorista, no el precio mayorista ni el entregado que pagas.' : 'Retail reference, not the wholesale or delivered price you pay.')
    : (es ? 'Referencia mayorista (aproximadamente lo que pagan los distribuidores), no el precio entregado que pagas.' : 'Wholesale reference (roughly what distributors pay), not the delivered price you pay.');
  const srcBody = `${(shortListLinked.length ? shortListLinked.join(' · ') : agencies.map((a) => a.name).join(' · '))} — ${es ? 'datos públicos' : 'public data'}, ${es ? 'al' : 'as of'} ${asOf}. ${disclaimer}`;
  const liveLabel = es ? `Ver ${(lab.es || lab.en || slug).toLowerCase()} en vivo en el Índice de Costos` : `See ${(lab.en || slug).toLowerCase()} live in the Cost Index`;
  return `
  <aside class="ci-read" data-layer="measured" aria-label="${es ? 'Lectura de mercado' : 'Market read'}">
    <p class="ci-read__head">${head}<span class="ci-read__badge">${badge}</span></p>
    <p class="ci-read__line">${line}</p>${trendLine}${verdict}${spark}${season}${idxChart}
    <details class="ci-read__src"><summary>${es ? 'Fuentes' : 'Sources'} · ${(shortList.length || agencies.length)}</summary><div>${srcBody}</div></details>
    ${verified}
    <p class="ci-read__method"><a href="${es ? '/es' : ''}/cost-index/methodology/#track-record">${es ? 'Cómo verificamos este número' : 'How we verify this number'} <span aria-hidden="true">→</span></a></p>
    <p class="ci-read__data">${es ? 'Descarga los datos' : 'Download this series'}: <a href="/cost-index/${slug}/series.csv" download>CSV</a> · <a href="/cost-index/${slug}/series.json">JSON</a></p>
    <p class="ci-read__live"><a href="${es ? '/es' : ''}/tools/cost-pulse/#ci-${slug}">${liveLabel} <span aria-hidden="true">→</span></a></p>
  </aside>`;
}

// ---- Series distribution files (JSON + CSV from history) ------------
// ---- The full downloadable series (deep backfill + live) -----------
// The methodology cites a multi-year track record, but the public download long
// shipped only the ~5-week capped window from cost-index.json. The deep monthly
// backfill (data/cost-index-history.json, 53 ingredients back to 2023) was used
// only internally for the conformal backtest. Stitch them so the download is as
// long as the record we claim. The early monthly points are RECONSTRUCTED from
// public sources after the fact — not "published live" in 2023 — and are flagged
// reconstructed:true so the artifact never overclaims its own history. Live and
// reconstructed share one valueCents scale (the backfill's own contract). Live
// points win on any shared date; the backfill is cut at the first live date so a
// monthly series never interleaves with the daily live window.
function mergedSeries(slug, entry) {
  const point = entry && entry.points && entry.points[0];
  const basis = (point && point.level && point.level.basis) || 'wholesale';
  const live = (entry && Array.isArray(entry.history)) ? entry.history : [];
  const deep = Array.isArray(DEEP_HIST[slug]) ? DEEP_HIST[slug] : [];
  const okPt = (p) => p && p.date && typeof p.valueCents === 'number' && isFinite(p.valueCents) && p.valueCents > 0;
  const firstLive = live.filter(okPt).map((p) => p.date).sort()[0] || null;
  const byDate = new Map();
  for (const p of deep) {
    if (!okPt(p)) continue;
    if (firstLive && p.date >= firstLive) continue;   // live takes over from here
    byDate.set(p.date, { date: p.date, valueCents: p.valueCents, source: null, basis, reconstructed: true });
  }
  for (const p of live) {
    if (!okPt(p)) continue;
    byDate.set(p.date, { date: p.date, valueCents: p.valueCents, source: p.source || null, basis: p.basis || basis, reconstructed: false });
  }
  return Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
}
function seriesJson(slug) {
  const entry = COST_INDEX[slug];
  const lab = LABELS[slug] || {};
  const point = entry && entry.points && entry.points[0];
  const obs = mergedSeries(slug, entry);
  const nRecon = obs.filter((o) => o.reconstructed).length;
  const obj = {
    ingredient: slug,
    name: lab.en || slug,
    unit: lab.unit_en || null,
    basis: (point && point.level && point.level.basis) || 'wholesale',
    currency: 'USD',
    note: 'Wholesale reference prices compiled from public U.S. market sources (USDA AMS/LMR, BLS, FRED, EIA, NOAA). Values are in US dollars per unit. Not a delivered or retail price. Source: muntin.digital/cost-index/' + slug + '/',
    reconstructedNote: nRecon ? 'Observations marked reconstructed:true are a monthly backfill reconstructed from public sources after the fact — not figures published live on that date. Live points (reconstructed:false) were captured at publication.' : undefined,
    coverage: obs.length ? { start: obs[0].date, end: obs[obs.length - 1].date, points: obs.length, reconstructed: nRecon } : undefined,
    asOf: (point && point.asOf) || null,
    observations: obs.map((h) => ({ date: h.date, priceUsd: +(h.valueCents / 100).toFixed(2), source: h.source || null, reconstructed: h.reconstructed }))
  };
  return JSON.stringify(obj, null, 2) + '\n';
}
function seriesCsv(slug) {
  const entry = COST_INDEX[slug];
  const obs = mergedSeries(slug, entry);
  const rows = ['date,price_usd,unit,basis,source,reconstructed'];
  const lab = LABELS[slug] || {};
  const unit = lab.unit_en || '';
  for (const h of obs) rows.push(`${h.date},${(h.valueCents / 100).toFixed(2)},${unit},${h.basis || ''},${h.source || ''},${h.reconstructed ? 'true' : 'false'}`);
  return rows.join('\n') + '\n';
}

// ---- Whole-index aggregate export (the entire basket in one file) ---
// One downloadable snapshot of every shippable reading — the citable,
// embeddable artifact a researcher or another site can pull. Built from the
// same gated readingOf() the pages use, so the aggregate can never disagree
// with a page. Shippable-only: an "expanding coverage" ingredient (thin data)
// is never exposed as a dollar here, exactly as it isn't on the pages.
function aggregateRows(slugs) {
  const rows = [];
  for (const slug of slugs.filter(shippable)) {
    const r = readingOf(slug);
    if (!r) continue;
    const lab = LABELS[slug] || {};
    rows.push({
      slug,
      name: lab.en || slug,
      unit: lab.unit_en || null,
      basis: r.basis,
      currency: 'USD',
      priceLowUsd: r.rc ? +(r.rc[0] / 100).toFixed(2) : null,
      priceMedianUsd: (r.lvl && r.lvl.medianCents != null) ? +(r.lvl.medianCents / 100).toFixed(2) : null,
      priceHighUsd: r.rc ? +(r.rc[1] / 100).toFixed(2) : null,
      // Honest magnitude fields, not a forecast: how wide the current range is
      // (spread) and where the median sits inside it (0 = low, 100 = high).
      spreadPct: (r.rc && r.lvl && r.lvl.medianCents) ? +(((r.rc[1] - r.rc[0]) / r.lvl.medianCents) * 100).toFixed(1) : null,
      pctInWindow: (r.rc && r.lvl && r.lvl.medianCents != null && r.rc[1] > r.rc[0]) ? Math.max(0, Math.min(100, Math.round(((r.lvl.medianCents - r.rc[0]) / (r.rc[1] - r.rc[0])) * 100))) : null,
      confidence: r.conf,
      asOf: r.asOf,
      sources: (r.lvl && r.lvl.nSources) || null,
      url: 'https://muntin.digital/cost-index/' + slug + '/'
    });
  }
  return rows;
}
function aggregateJson(slugs) {
  const rows = aggregateRows(slugs);
  return JSON.stringify({
    name: 'Muntin Restaurant Cost Index',
    description: 'A public read of where common restaurant ingredients are priced wholesale across U.S. government market sources — a typical range, its spread and where the median sits within that range, and a confidence tier per ingredient. Built only from citable public data (USDA, BLS, FRED, EIA, NOAA). Values are US dollars per unit, a wholesale reference — not a delivered or retail price, and not a price forecast.',
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://muntin.digital/cost-index/',
    methodology: 'https://muntin.digital/cost-index/methodology/',
    refresh: 'daily',
    lastRefreshed: CI._lastReviewed || null,
    count: rows.length,
    ingredients: rows
  }, null, 2) + '\n';
}
function aggregateCsv(slugs) {
  const rows = aggregateRows(slugs);
  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const out = ['slug,name,unit,basis,price_low_usd,price_median_usd,price_high_usd,spread_pct,pct_in_window,confidence,as_of,sources,url'];
  for (const r of rows) {
    out.push([r.slug, r.name, r.unit, r.basis, r.priceLowUsd, r.priceMedianUsd, r.priceHighUsd, r.spreadPct, r.pctInWindow, r.confidence, r.asOf, r.sources, r.url].map(esc).join(','));
  }
  return out.join('\n') + '\n';
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
  // temporalCoverage + datePublished span the FULL downloadable series (deep
  // backfill + live), not the capped on-page window — so the schema's claimed
  // span matches what /series.json actually contains, and datePublished stops
  // collapsing onto the latest read (which had erased the dataset's real history).
  const merged = r ? mergedSeries(slug, r.entry) : [];
  const temporal = merged.length ? `${merged[0].date}/${merged[merged.length - 1].date}` : undefined;
  const seriesStart = merged.length ? merged[0].date : null;
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
  // A magnitude, never a forecast: where today's median sits within today's
  // low–high wholesale range (0 = low, 100 = high). Deliberately NOT a trend
  // direction — the 25-year backtest shows direction calls are at chance
  // (50.5% vs a 50.2% baseline), so no direction is published as a liftable field.
  if (r && r.emitPoint && r.distinctRange && r.lvl && r.lvl.medianCents != null && r.rc && r.rc[1] > r.rc[0]) {
    const posPct = Math.max(0, Math.min(100, Math.round(((r.lvl.medianCents - r.rc[0]) / (r.rc[1] - r.rc[0])) * 100)));
    pv.valueReference = {
      '@type': 'PropertyValue', 'name': 'position-in-range', 'value': posPct, 'unitText': 'percent',
      'description': `Where the current median sits within today's low–high wholesale range (0 = low, 100 = high). A magnitude, not a forecast.`
    };
  }

  const dataset = {
    '@type': 'Dataset',
    '@id': url + '#dataset',
    'name': es ? `${esName} — precio mayorista de referencia` : `${enName} wholesale price index`,
    'alternateName': es ? `${enName} wholesale price index` : `${esName} — precio mayorista`,
    'description': es
      ? `Precio mayorista de referencia para ${esName.toLowerCase()} (por ${lab.unit_es || lab.unit_en}), combinado de fuentes públicas de mercado de EE. UU. y mostrado como un rango típico con fecha. Para que un restaurante distinga un movimiento de mercado de un sobreprecio de proveedor. No es un pronóstico de precio.`
      : `Wholesale reference price for ${enName.toLowerCase()} (per ${lab.unit_en}), blended from public U.S. market sources and shown as a dated typical range. Built for restaurant operators to tell a market move from a vendor markup — not a price forecast.`,
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
  if (r && r.asOf) { dataset.dateModified = r.asOf; dataset.datePublished = seriesStart || r.asOf; }
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

  // WebPage node carries the speakable selectors (the range-first .ci-answer line,
  // now direction-free) and the page's dateModified — so answer engines can lift the
  // honest sentence and Google sees a per-page freshness signal.
  const webpage = {
    '@type': 'WebPage', '@id': url + '#page', 'url': url, 'name': name,
    'inLanguage': es ? 'es-US' : 'en-US',
    'isPartOf': { '@id': 'https://muntin.digital/#website' },
    'mainEntity': { '@id': url + '#dataset' },
    'speakable': { '@type': 'SpeakableSpecification', 'cssSelector': ['h1', '.ci-answer'] }
  };
  if (r && r.asOf) webpage.dateModified = r.asOf;

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      webpage,
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
:root{--cream:#F6F7F8;--cream-2:#EDEEF1;--ink:#16181D;--ink-soft:#4A4F59;--teal:#2A50C8;--white:#fff;--line:#E3E5E9;--teal-wash:rgba(42,80,200,.06);--font-display:'Fraunces',Georgia,serif;--max:1200px;--pad-x:clamp(20px,4vw,64px)}
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
.ci-answer{font-size:clamp(18px,3vw,22px);font-weight:600;color:var(--ink);margin:0 0 14px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-variant-numeric:tabular-nums}
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
.ci-read__verb[data-bias="watch"]{color:#6b540f;border-color:#9a7d2e}
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
.ci-read__verified{margin:10px 0 0;font-size:13px;color:var(--ink);background:var(--teal-wash);border-left:3px solid var(--teal);padding:6px 10px;border-radius:3px}
.ci-read__verified strong{color:var(--teal)}
.ci-read__live,.ci-read__method{margin:10px 0 0;font-size:14px}
.ci-read__live a,.ci-read__method a,.ci-read__data a{color:var(--teal);text-decoration:none;font-weight:600;border-bottom:1px dashed currentColor}
.ci-read__method{margin-top:6px;font-size:13px}
.ci-read__data{margin:4px 0 0;font-size:13px;color:var(--ink-soft)}
.ci-season{margin:12px 0 4px;padding:12px 16px;background:var(--white);border:1px solid var(--line);border-left:3px solid #6b4fa1;border-radius:10px;font-variant-numeric:tabular-nums}
.ci-season__head{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6b4fa1;margin:0 0 4px}
.ci-season__body{font-size:14.5px;line-height:1.5;color:var(--ink);margin:0}
.ci-season__src{margin:6px 0 0;font-size:12.5px}
.ci-season__src summary{cursor:pointer;color:var(--ink-soft);font-weight:600;display:inline-block;padding:6px 0;min-height:24px}
.ci-season__src div{margin-top:6px;color:var(--ink-soft);line-height:1.5}
.ci-season__src a{color:var(--teal);text-decoration:none;border-bottom:1px dashed currentColor}
.ci-season-curve{margin:12px 0 2px}
.ci-season-curve svg{display:block;width:100%;height:auto;overflow:visible}
.ci-season-curve__cap{font-size:12.5px;color:var(--ink-soft);line-height:1.5;margin:7px 0 0}
.ci-season-curve__cap strong{color:var(--ink)}
.ci-season-curve__note{color:var(--stone);font-size:11.5px;white-space:nowrap}
.ci-yield{margin:18px 0;padding:14px 16px;background:var(--white);border:1px solid var(--line);border-left:3px solid var(--teal);border-radius:10px}
.ci-yield__head{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--teal);margin:0 0 5px}
.ci-yield__body{font-size:14.5px;line-height:1.55;color:var(--ink);margin:0}
.ci-yield__body strong{font-weight:700}
.ci-yield__link{margin:9px 0 0;font-size:13.5px}
.ci-yield__link a{color:var(--teal);text-decoration:none;font-weight:600;border-bottom:1px dashed currentColor}
.ci-yield__src{margin:7px 0 0;font-size:12px;color:var(--stone)}
.ci-faq{margin:34px 0 0}
.ci-faq__item{margin:0 0 18px}
.ci-faq__q{font-family:var(--font-display);font-size:17px;font-weight:600;color:var(--ink);margin:0 0 6px}
.ci-faq__a{font-size:15.5px;line-height:1.65;color:var(--ink-soft);margin:0}
.ci-sibs{margin:30px 0 0;font-size:14px;color:var(--ink-soft)}
.ci-sibs-label{display:inline-block;font-weight:700;text-transform:uppercase;letter-spacing:.04em;font-size:11px;margin-right:8px}
.ci-sibs a{color:var(--teal);text-decoration:none;border-bottom:1px dashed currentColor}
.ci-cta-row{display:flex;flex-wrap:wrap;gap:12px;margin:30px 0 8px}
.ci-composite{margin:22px 0 6px;padding:20px 22px;background:var(--cream-2);border:1px solid var(--line);border-left:4px solid var(--ink-soft);border-radius:12px;font-variant-numeric:tabular-nums}
.ci-composite[data-band="up"]{border-left-color:#A23B2D}
.ci-composite[data-band="down"]{border-left-color:var(--teal)}
.ci-composite__head{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);margin:0 0 8px}
.ci-composite__read{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 14px;margin:0}
.ci-composite__num{font-family:var(--font-display);font-size:clamp(30px,6vw,44px);font-weight:500;line-height:1;color:var(--ink)}
.ci-composite[data-band="up"] .ci-composite__num{color:#A23B2D}
.ci-composite[data-band="down"] .ci-composite__num{color:var(--teal)}
.ci-composite__say{font-size:15px;line-height:1.4;color:var(--ink);font-weight:600;max-width:46ch}
.ci-composite__meta{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;margin:10px 0 0}
.ci-composite__chip{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:var(--white);border:1px solid var(--line);color:var(--ink-soft)}
.ci-composite__spread{font-size:14px;line-height:1.5;color:var(--ink-soft);margin:10px 0 0}
.ci-composite__spread strong{color:var(--ink)}
.ci-composite__src{margin:8px 0 0;font-size:12.5px}
.ci-composite__src summary{cursor:pointer;color:var(--ink-soft);font-weight:600;display:inline-block;padding:6px 0;min-height:24px}
.ci-composite__src div{margin-top:6px;color:var(--ink-soft);line-height:1.55}
.ci-composite__src a{color:var(--teal);text-decoration:none;border-bottom:1px dashed currentColor}
.ci-orient{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));margin:18px 0 8px}
.ci-orient__cell{background:var(--cream-2);border-radius:6px;padding:14px 16px}
.ci-orient__h{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--teal);margin:0 0 6px}
.ci-orient__b{font-size:14px;line-height:1.5;color:var(--ink);margin:0}
.ci-signup--compact{margin:18px 0}
.ci-signup-alt{margin:12px 0 0;font-size:13.5px;color:var(--ink-soft);line-height:1.6}
.ci-signup-alt a{color:var(--teal);text-decoration:none;font-weight:600;border-bottom:1px dashed currentColor}
.ci-signup-sep{color:var(--stone,#9aa0aa);margin:0 4px}
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
.ci-moving-bar{margin:0 0 12px;font-size:13px;line-height:1.5;color:var(--ink-soft);padding:8px 12px;background:var(--surface-1,#faf9f7);border:1px solid var(--line);border-radius:8px}
.ci-vkey{margin:2px 0 12px;font-size:12.5px;color:var(--ink-soft);line-height:1.6}
.ci-vkey strong{color:var(--ink)}
.ci-moving-insight{margin:3px 0 2px}
.ci-moving-read{margin:2px 0;font-size:14.5px;line-height:1.5;color:var(--ink)}
.ci-assoc-tag{color:var(--ink-soft);font-style:italic;font-size:12.5px}
.ci-moving-cite{margin:3px 0 4px;font-size:12.5px}
.ci-moving-cite summary{color:var(--teal);cursor:pointer}
.ci-moving-cite p{margin:4px 0 0;color:var(--ink-soft)}
.ci-moving-act{margin:2px 0 0;font-size:13.5px;color:var(--ink-soft)}
.ci-moving-act strong{color:var(--ink)}
.ci-moving-more{font-size:12.5px}
.ci-moving-more-all{margin:10px 0 0;font-size:13.5px;color:var(--ink-soft)}
.ci-moving-more-all a{color:var(--teal);text-decoration:none;font-weight:600;border-bottom:1px dashed currentColor}
.ci-index--mini{display:inline-block;vertical-align:middle;margin:4px 0 2px;opacity:.9}
.ci-index{margin:10px 0 4px}
.ci-index__cap{margin:0 0 4px;font-size:12.5px;color:var(--ink-soft);line-height:1.5}
.ci-index .mtn-spark{max-width:100%;height:auto}
.ci-card--pending{opacity:.72;background:var(--cream-2)}
.ci-card--pending a{color:var(--ink-soft)}
.ci-pending-note{font-size:13.5px;color:var(--ink-soft);margin:8px 0 0}
.ci-readings{margin:20px 0 8px}
.ci-table-tools{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:12px 0 0}
.ci-table-search__label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-soft)}
.ci-table-search{flex:1 1 220px;max-width:340px;font:inherit;font-size:14px;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--white);color:var(--ink)}
.ci-table-search:focus-visible{outline:2px solid var(--teal);outline-offset:1px}
.ci-table-count{font-size:13px;color:var(--ink-soft);font-variant-numeric:tabular-nums}
.ci-table-empty td{color:var(--ink-soft);font-style:italic;padding:14px 10px}
.table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:12px 0}
.ci-table{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}
.ci-table th,.ci-table td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap;vertical-align:middle}
.ci-table th{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-soft)}
.ci-table tbody tr:hover{background:var(--cream-2)}
.ci-table td a{color:var(--ink);text-decoration:none;font-weight:600;border-bottom:1px dashed var(--line)}
.ci-table td a:hover{color:var(--teal)}
.ci-table .ci-t-dir{font-weight:600}
.ci-table .ci-t-dir[data-dir="up"]{color:#A23B2D}
.ci-table .ci-t-dir[data-dir="down"]{color:var(--teal)}
.ci-table .ci-t-na{color:var(--stone,#9aa0aa)}
.ci-table .ci-index--mini{margin:0}
:root[data-theme="dark"] .ci-table .ci-t-dir[data-dir="up"]{color:#ed9a8e}
.ci-read--pending{border-left-color:#cdb368;background:var(--cream-2)}
.ci-read--pending .ci-read__head{color:#8a6d1f}
.ci-outlook{margin:14px 0 8px;padding:16px 20px;background:#fff;border:1px solid var(--line);border-left:4px solid #6b4fa1;border-radius:12px}
.ci-outlook__head{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6b4fa1;margin:0 0 6px}
.ci-outlook__line{font-size:15.5px;line-height:1.5;color:var(--ink);margin:0}
.ci-outlook__record{margin:6px 0 0;font-size:12.5px;color:var(--ink-soft);font-variant-numeric:tabular-nums}
.ci-outlook__how{margin-top:8px;font-size:12.5px}
.ci-outlook__how summary{cursor:pointer;color:var(--ink-soft);font-weight:600}
.ci-outlook__how div{margin-top:6px;color:var(--ink-soft);line-height:1.55}
.ci-outlook__panel{margin:0 0 8px;padding-left:18px}
.ci-outlook__panel li{margin:0 0 4px}
.ci-outlook__lab{margin:10px 0 0;font-size:13.5px}
.ci-outlook__lab a{color:#6b4fa1;text-decoration:none;font-weight:600;border-bottom:1px dashed currentColor}
/* a11y: a keyboard/switch user must always see focus (only the skip-link had one). */
.ci-card a:focus-visible,.ci-read a:focus-visible,.ci-sibs a:focus-visible,.breadcrumb a:focus-visible,.ci-source a:focus-visible,summary:focus-visible{outline:2px solid var(--teal);outline-offset:2px;border-radius:2px}
/* touch: lift the drawer summaries to a real tap target (WCAG 2.5.8). */
.ci-read__src summary,.ci-outlook__how summary{display:inline-block;padding:6px 0;min-height:24px}
/* the pre-rendered sparkline must never clip in a narrower container. */
.mtn-spark{max-width:100%;height:auto}
/* print: the controller-PDFs-a-reading-for-a-vendor workflow. Drop the chrome, force the
   provenance drawers open, and print the verdict with a border + its word (never color-only). */
@media print{
  .nav,.ci-cta-row,.ci-sibs,.ci-read__live,.ci-read__method,.skip-link,form,footer{display:none!important}
  main{padding-top:0!important}
  body{background:#fff!important;color:#000!important}
  .ci-read{break-inside:avoid;border-color:#000}
  details>*:not(summary){display:block!important}
  details summary{font-weight:700}
  .ci-read__verb{border:1px solid #000!important;color:#000!important;background:#fff!important}
  a[href]::after{content:""!important}
}
/* dark mode: the inline tokens hardcoded light, so the reading area stayed cream in dark.
   Redefine the cost-index tokens (light text on dark = high-contrast by construction) and
   lighten the three verdict accents so they stay legible. Honors OS preference AND the
   site theme toggle ([data-theme]); a forced-light toggle wins over OS dark. */
:root[data-theme="dark"]{--cream:#121419;--cream-2:#1e2127;--ink:#e8eaed;--ink-soft:#a3a9b3;--teal:#7f9bff;--white:#1e2127;--line:#2a2e37;--teal-wash:rgba(127,155,255,.12)}
:root[data-theme="dark"] .ci-read__verb[data-bias="hold"]{color:#8ea4ff;border-color:#5b73c8}
:root[data-theme="dark"] .ci-read__verb[data-bias="watch"]{color:#d8bd6a;border-color:#8a7530}
:root[data-theme="dark"] .ci-read__verb[data-bias="re-price"]{color:#ed9a8e;border-color:#9a4438}
:root[data-theme="dark"] .ci-composite[data-band="up"]{border-left-color:#ed9a8e}
:root[data-theme="dark"] .ci-composite[data-band="up"] .ci-composite__num{color:#ed9a8e}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){--cream:#121419;--cream-2:#1e2127;--ink:#e8eaed;--ink-soft:#a3a9b3;--teal:#7f9bff;--white:#1e2127;--line:#2a2e37;--teal-wash:rgba(127,155,255,.12)}
  :root:not([data-theme="light"]) .ci-read__verb[data-bias="hold"]{color:#8ea4ff;border-color:#5b73c8}
  :root:not([data-theme="light"]) .ci-read__verb[data-bias="watch"]{color:#d8bd6a;border-color:#8a7530}
  :root:not([data-theme="light"]) .ci-read__verb[data-bias="re-price"]{color:#ed9a8e;border-color:#9a4438}
  :root:not([data-theme="light"]) .ci-composite[data-band="up"]{border-left-color:#ed9a8e}
  :root:not([data-theme="light"]) .ci-composite[data-band="up"] .ci-composite__num{color:#ed9a8e}
  :root:not([data-theme="light"]) .ci-table .ci-t-dir[data-dir="up"]{color:#ed9a8e}
}
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
<!-- Newsletter signup — eager progressive enhancement. This page ships
     an empty footer (no footer assets, so first-touch.js never loads
     here); wire the in-page #weekly-email form at parse time so a quick
     submit can't fall back to a native POST that paints the API's raw
     {"ok":true}. Stamps ts for the anti-spam gate, posts via fetch, and
     flips data-state="ok" for the inline confirmation. -->
<script>
(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  function wire(form) {
    if (!form || form.dataset.enhanced === '1') return;
    form.dataset.enhanced = '1';
    var ts = form.querySelector('input[name="ts"]');
    if (ts) ts.value = String(Date.now());
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var params = new URLSearchParams();
      new FormData(form).forEach(function (v, k) { params.append(k, v); });
      fetch(form.action, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        credentials: 'same-origin',
      }).then(function () {
        form.dataset.state = 'ok';
        if (typeof window.plausible === 'function') {
          var evName = form.dataset.event || 'Newsletter Signup';
          var surface = form.dataset.surface || (form.dataset.locale === 'es' ? 'cost-index-es' : 'cost-index-en');
          try { window.plausible(evName, { props: { surface: surface } }); } catch (_) {}
        }
      }).catch(function () { /* fire-and-forget; no error UI by design */ });
    });
  }
  function init() {
    var forms = document.querySelectorAll('.foot-newsletter-form, .js-signup-form');
    Array.prototype.forEach.call(forms, wire);
  }
  init();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
})();
</script>
<!-- Find-an-ingredient filter for the Cost Index hub table. Progressive
     enhancement: reveals the (hidden) search box, filters rows by name/slug,
     shows a no-match row, and announces the count. No-ops on pages without
     the table (every other cost-index page). -->
<script>
(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  function init() {
    var box = document.getElementById('ci-ingredient-search');
    if (!box || box.dataset.wired === '1') return;
    var table = document.getElementById('ci-readings-table');
    if (!table || !table.tBodies.length) return;
    box.dataset.wired = '1';
    var tools = box.closest('.ci-table-tools');
    if (tools) tools.hidden = false;
    var all = Array.prototype.slice.call(table.tBodies[0].rows);
    var rows = all.filter(function (r) { return !r.hasAttribute('data-empty'); });
    var empty = table.querySelector('tr[data-empty]');
    var count = document.querySelector('.ci-table-count');
    function apply() {
      var q = box.value.trim().toLowerCase();
      var shown = 0;
      for (var i = 0; i < rows.length; i++) {
        var hit = !q || (rows[i].getAttribute('data-name') || '').indexOf(q) !== -1;
        rows[i].hidden = !hit;
        if (hit) shown++;
      }
      if (empty) empty.hidden = !(q && shown === 0);
      if (count) count.textContent = q ? (shown + ' / ' + rows.length) : '';
    }
    box.addEventListener('input', apply);
  }
  init();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
})();
</script>
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
  // Post-audit (2026-07, HIGH-4): the feed clause states the measured driver
  // DIRECTION only. The old "which has tended to move before protein prices" +
  // "as of {date}" badge implied an on-device lag measurement we don't publish.
  // The feed-grain series (corn, soybeans) ARE now in the shipped deep history
  // (.drivers), so the lag is computable — but only honestly behind the Engle-
  // Granger cointegration gate on first-differences (cost-leadlag is dormant until
  // then). Until it's wired, the feed→protein lag stays a CITED USDA-ERS external
  // fact in the drawer below, not asserted on-device here.
  if (feed.length) clauses.push(
    (es ? 'forraje — ' : 'feed-grain — ') + feed.map(part).join(', '));
  if (energy.length) clauses.push(
    energy.map(part).join(', ') + (es ? ', que se mueve junto al costo de los alimentos' : ', which moves alongside food costs'));
  const lead = es ? 'Insumos río arriba ahora: ' : 'Upstream inputs right now: ';
  const tail = es ? ' Asociación, no causa.' : ' Association, not cause.';
  const head = es ? 'Por qué se mueve' : "Why it's moving";
  // Cited external mechanism for the feed→protein biological lag (USDA ERS) when a
  // feed-grain driver is present. Gated on ES prose like hubDriverInsight so a
  // half-translated catalog never leaks English onto /es/.
  let cite = '';
  if (feed.length) {
    const fc = DRIVER_CAT.find((x) => x.class === 'feed' && Array.isArray(x.affects) && x.affects.includes(slug));
    if (fc && !(es && (!fc.label_es || !fc.mechanism_es))) {
      const flabel = es ? fc.label_es : fc.label;
      const fmech = es ? fc.mechanism_es : fc.mechanism;
      const summ = es ? 'Por qué importa el forraje aquí' : 'Why feed matters here';
      const retrieved = es ? 'recuperado' : 'retrieved';
      const srcLabel = es ? 'fuente' : 'source';
      cite = `<details class="cite ci-why__cite"><summary>${summ}</summary><p>${escHtml(flabel)}: ${escHtml(fmech)}.${fc.retrievedAt ? ` · ${retrieved} ${escHtml(fc.retrievedAt)}` : ''}${fc.sourceUrl ? ` · <a href="${escHtml(fc.sourceUrl)}" rel="nofollow noopener" target="_blank">${srcLabel}</a>` : ''}</p></details>`;
    }
  }
  return `
  <aside class="ci-why" aria-label="${head}">
    <p class="ci-why__head">${head}</p>
    <p class="ci-why__line">${lead}${clauses.join('; ')}.${tail}</p>${cite}
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
  // Category-direction context (produce only): the fresh fruits & vegetables PPI
  // as a whole. Explicitly framed as CATEGORY context, never this item's own read
  // — it must not be mistaken for the cross-market level/trend above. Guarded: it
  // renders only once the fresh-produce driver has been vendored.
  const fp = DRIVERS['fresh-produce'];
  const categoryLine = (meta.cat === 'produce' && fp && fp.trend && typeof fp.trend.pct === 'number')
    ? (() => {
      const pctTxt = `${(fp.trend.pct >= 0 ? '+' : '')}${(fp.trend.pct * 100).toFixed(1).replace(/\.0$/, '')}%`;
      return es
        ? `<p>Como contexto de categoría: las frutas y verduras frescas <em>en conjunto</em> se han movido <strong>${pctTxt}</strong> en el periodo (índice PPI de BLS, frutas y verduras frescas). Es la dirección general del mercado de productos frescos — no la lectura propia de ${lc}, que está arriba.</p>`
        : `<p>For category context: fresh fruits &amp; vegetables <em>as a whole</em> moved <strong>${pctTxt}</strong> over the window (BLS PPI, fresh fruits &amp; vegetables). That's the broad produce market's direction — not ${lc}'s own read, which is above.</p>`;
    })()
    : '';
  return `<h2 id="why-it-matters">${h}</h2>${unitLine}${moveLine}${seasonalLine}${categoryLine}`;
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
  if (!pressureProven(rec)) return '';   // HOLD: overlay stays private until its track record earns it
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
    <p class="ci-outlook__line" data-dir="${dir}">${line}</p>${(rec.track_record && rec.track_record.n) ? `
    <p class="ci-outlook__record">${es ? `Acertó ${rec.track_record.hits} de las últimas ${rec.track_record.n} lecturas medidas.` : `Right on ${rec.track_record.hits} of the last ${rec.track_record.n} measured reads.`}</p>` : ''}
    <details class="ci-outlook__how"><summary>${howHead}</summary><div><ul class="ci-outlook__panel">${rows}</ul><p>${note}</p></div></details>
    <p class="ci-outlook__lab"><a href="${es ? '/es' : ''}/cost-index/lab/?it=${slug}">${es ? 'Juega con las señales' : 'Play with the signals'} <span aria-hidden="true">→</span></a></p>
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
// One honest fact for a coverage-in-progress page: the edible-portion yield.
// Even with no published wholesale price, an operator gets the usable share
// after trim/waste + a link to the full yield-and-cost analysis. Sourced to the
// standard reference yield tables; no dollar figure asserted here.
function yieldBlock(slug, locale) {
  const y = YIELDS[slug];
  if (!y || !(y.yield > 0 && y.yield <= 1)) return '';
  const es = locale === 'es';
  const base = es ? '/es' : '';
  const pct = Math.round(y.yield * 100), waste = 100 - pct;
  const nm = (es ? (y.es || y.en) : y.en || slug).toLowerCase();
  const head = es ? 'Lo que sí sabemos' : 'What we do know';
  const body = es
    ? `Aunque todavía no publicamos un precio de <strong>${nm}</strong>, sí conocemos su <strong>rendimiento de porción comestible: ~${pct}%</strong>. Cerca del ${pct}% de lo que compras llega al plato tras la limpieza y el desperdicio (~${waste}% de merma), así que tu costo real por libra utilizable es más alto que el precio de compra.`
    : `Even without a live price for <strong>${nm}</strong> yet, we do know its <strong>edible-portion yield: ~${pct}%</strong>. About ${pct}% of what you buy reaches the plate after trim and waste (~${waste}% loss), so your true cost per usable pound runs higher than the purchase price.`;
  const link = es
    ? `<a href="${base}/library/ingredient-yields/${slug}/">Ver el análisis completo de rendimiento y costo comestible <span aria-hidden="true">→</span></a>`
    : `<a href="${base}/library/ingredient-yields/${slug}/">See the full yield &amp; edible-cost analysis <span aria-hidden="true">→</span></a>`;
  const src = es ? 'Rendimiento estándar de referencia de la industria.' : 'Standard industry reference yield.';
  return `
    <aside class="ci-yield" aria-label="${es ? 'Rendimiento de porción comestible' : 'Edible-portion yield'}">
      <p class="ci-yield__head">${head}</p>
      <p class="ci-yield__body">${body}</p>
      <p class="ci-yield__link">${link}</p>
      <p class="ci-yield__src">${src}</p>
    </aside>`;
}

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
    ${yieldBlock(slug, locale)}
    <h2>Qué puedes hacer ahora</h2>
    <p>Compara tu última factura de ${lc} con tus facturas recientes, o abre <a href="${base}/tools/cost-pulse/">la herramienta en vivo</a> para los ingredientes que sí cubrimos. Esta página se completará cuando lo hagan los datos.</p>
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
    ${yieldBlock(slug, locale)}
    <h2>What you can do now</h2>
    <p>Check your last ${lc} invoice against your own recent ones, or open <a href="${base}/tools/cost-pulse/">the live tool</a> for the ingredients we do cover. This page fills in when the data does.</p>
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

// ---- Weekly-email capture (reused on the hub + every ingredient page) ----
// Persona audit #2: the email signup — the one conversion a tired operator was
// ready for — sat below the hub's longest scroll. Most visitors land on an
// INGREDIENT page (from search), which had no capture at all. Same wired form
// (.foot-newsletter-form → pageTail script), so it posts via fetch and shows
// the inline confirmation; data-surface tags the conversion source.
function weeklySignup(locale, opts) {
  opts = opts || {};
  const es = locale === 'es';
  const lang = es ? 'es' : 'en';
  const base = es ? '/es' : '';
  const id = opts.id || 'ci-news-email';
  const source = opts.source || 'cost-index';
  const pitch = opts.pitch || (es
    ? 'Recibe el índice cada semana por correo — una lectura corta de lo que se mueve y qué hacer al respecto. Cuatro líneas, sin relleno.'
    : 'Get the index in your inbox every week — a short read on what’s moving and what to do about it. A few lines, no funnels.');
  const alt = opts.compact ? '' : `
      <p class="ci-signup-alt">${es ? '¿Prefieres explorar a tu ritmo?' : 'Rather check back yourself?'} <a href="${base}/cost-index/weekly/">${es ? 'Ediciones semanales anteriores' : 'Past weekly reads'} <span aria-hidden="true">→</span></a> <span class="ci-signup-sep">·</span> <a href="${base}/feed.xml">RSS</a></p>`;
  return `<div class="ci-signup${opts.compact ? ' ci-signup--compact' : ''}"${opts.anchor ? ' id="weekly-email"' : ''}>
      <div class="foot-newsletter">
        <form action="/api/subscribe" method="post" class="foot-newsletter-form" data-locale="${lang}" data-surface="${source}">
          <p class="foot-newsletter-pitch">${pitch}</p>
          <label class="foot-newsletter-label" for="${id}">${es ? 'Tu correo' : 'Your email'}</label>
          <input id="${id}" name="email" type="email" required autocomplete="email" inputmode="email" enterkeyhint="send" autocapitalize="off" spellcheck="false" placeholder="you@yourrestaurant.com" />
          <input type="hidden" name="locale" value="${lang}" />
          <input type="hidden" name="source" value="${source}" />
          <input type="hidden" name="ts" value="" />
          <input type="text" name="hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;" />
          <div class="cf-turnstile" data-sitekey="0x4AAAAAADIgoGh56MvqeE8L" data-action="newsletter" data-size="flexible"></div>
          <button type="submit">${es ? 'Enviarme el índice semanal' : 'Email me the weekly index'}</button>
        </form>
      </div>${alt}
    </div>`;
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
    ? `<p class="ci-source"><strong>${es ? 'Fuente' : 'Sourced'}:</strong> ${agencies.map((a) => `<a href="${a.url}" rel="noopener">${escHtml(a.name)}</a>`).join(' · ')} — ${es ? 'datos públicos, vía' : 'public data, via'} <a href="${base}/tools/cost-pulse/">${es ? 'la herramienta en vivo' : 'the live tool'}</a> · <a href="${base}/glossary/cost-index/">${es ? 'qué es un índice de costos' : 'what a cost index is'}</a></p>`
    : `<p class="ci-source"><strong>${es ? 'Fuente' : 'Sourced'}:</strong> ${es ? 'datos públicos de mercado, vía' : 'public market data, via'} <a href="${base}/tools/cost-pulse/">the live tool</a> · <a href="${base}/glossary/cost-index/">${es ? 'qué es un índice de costos' : 'what a cost index is'}</a></p>`;

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
    ${answerBanner(slug, locale)}
    <p class="ci-lede">${lede}</p>
  </section>
  <div class="ci-body">
    ${marketReadBlock(slug, locale)}
    ${pressureBlock(slug, locale)}
    ${whyMovingBlock(slug, locale)}
    ${whyItMatters(slug, locale)}
    ${howToUse(slug, locale)}
    ${weeklySignup(locale, { id: 'ci-news-email-ing', source: 'cost-index-ingredient', compact: true, pitch: (locale === 'es'
      ? '¿No quieres revisar a mano cada semana? Recibe el índice por correo — una lectura corta de lo que se mueve y qué hacer. Unas líneas, sin relleno.'
      : 'Don’t want to check this by hand every week? Get the index by email — a short read on what’s moving and what to do. A few lines, no funnels.') })}
    ${faqHtml}
    ${siblings(slug, locale)}
    <div class="ci-cta-row">
      <a class="btn btn-primary" href="${base}/tools/cost-pulse/#ci-${slug}">${es ? 'Abrir la herramienta en vivo' : 'Open the live tool'}</a>
      <a class="btn btn-ghost" href="${base}/cost-index/">${es ? 'Ver todas las lecturas' : 'Browse all readings'}</a>
    </div>
    <p class="ci-ledger-bridge" style="margin:16px 0 0;font-size:14.5px;line-height:1.6;color:var(--ink-soft)">${es
      ? `Esta es la referencia del mercado. Para ver si <em>tus</em> facturas la siguen, l&iacute;nea por l&iacute;nea, eso es <a href="${base}/ledger/" style="color:var(--teal);font-weight:600">Muntin Ledger</a> &mdash; tus datos, sin modelo de lenguaje.`
      : `This is the market reference. To see whether <em>your</em> invoices track it, line by line, that's <a href="${base}/ledger/" style="color:var(--teal);font-weight:600">Muntin Ledger</a> &mdash; your data, no language model.`}</p>
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

// Front-door orientation: a first-timer learns what this is, who it's for, and the one
// thing that makes it defensible (citable public data, not a paywalled assessed quote).
// Bolder pass 2026-07 — the public scorecard, promoted from the depths of
// the methodology page onto the hub. Values read from the calibration
// report at build time so the band recomputes with every refresh; the
// prose track record stays canonical on the methodology page.
function scorecardBand(locale) {
  const es = locale === 'es';
  let rep;
  try { rep = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index-calibration-report.json'), 'utf8')); }
  catch { return ''; }
  const pct = (x) => Math.round(x * 100) + '%';
  const nominal = pct(rep.band.nominal), coverage = pct(rep.band.pooledCoverage);
  const steps = es ? String(rep.band.scoredSteps) : rep.band.scoredSteps.toLocaleString('en-US');
  const base = es ? '/es' : '';
  const figStyle = 'font-family:var(--font-display);font-size:clamp(24px,2.6vw,32px);font-weight:560;letter-spacing:-.015em;line-height:1;color:var(--ink);font-variant-numeric:tabular-nums lining-nums';
  const labStyle = 'font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--stone);font-weight:600;margin-top:6px';
  const cell = (fig, lab) => `<div style="min-width:120px"><div style="${figStyle}">${fig}</div><div style="${labStyle}">${lab}</div></div>`;
  const heading = es ? 'Calificado en p\u00fablico, fallos incluidos.' : 'Graded in public, misses included.';
  const line = es
    ? `La banda con objetivo del ${nominal} captur\u00f3 la pr\u00f3xima lectura cerca del ${coverage} de las veces en ${steps} lecturas evaluadas \u2014 su tasa cruda sin ajustar; lo que no tiene precio se reporta ausente, nunca se adivina.`
    : `The ${nominal}-target band caught the next print about ${coverage} of the time across ${steps} scored reads \u2014 its raw, un-tuned rate; anything without a price print reports absent, never guessed.`;
  const linkTxt = es ? 'Ver la boleta completa' : 'See the full track record';
  return `<section class="ci-scorecard" aria-label="${es ? 'Boleta de calibraci\u00f3n' : 'Calibration scorecard'}" style="margin:22px 0 8px;padding:20px 24px;background:var(--surface-1,#fff);border:1px solid var(--line);border-top:3px solid var(--ink);border-radius:12px;box-shadow:var(--elev-1)">
      <div style="display:flex;flex-wrap:wrap;gap:18px 36px;align-items:flex-start">
        ${cell(nominal, es ? 'banda nominal' : 'nominal band')}
        ${cell(coverage, es ? 'cobertura realizada' : 'realized coverage')}
        ${cell(steps, es ? 'lecturas evaluadas' : 'scored reads')}
        <div style="flex:1 1 260px;min-width:240px">
          <p style="margin:0;font-family:var(--font-display);font-size:16px;font-weight:600;color:var(--ink)">${heading}</p>
          <p style="margin:6px 0 0;font-size:13.5px;line-height:1.55;color:var(--ink-soft)">${line} <a href="${base}/cost-index/methodology/#track-record" style="color:var(--teal);font-weight:600;border-bottom:1px dashed currentColor;text-decoration:none">${linkTxt} \u2192</a></p>
        </div>
      </div>
    </section>`;
}

function hubOrientation(locale) {

  const es = locale === 'es';
  const cells = es ? [
    ['Qué es', 'Rangos mayoristas típicos de ingredientes comunes de restaurante, tomados de reportes públicos del USDA, BLS y FRED.'],
    ['Para quién', 'Distingue un movimiento real del mercado del recargo de tu proveedor — antes de ajustar el precio de un plato.'],
    ['En qué se diferencia', 'Cada número se rastrea hasta un reporte público con fecha que puedes abrir. No una cotización valorada de pago — un número que puedes verificar.'],
  ] : [
    ['What it is', 'Typical wholesale ranges for common restaurant ingredients, drawn from public USDA, BLS and FRED reports.'],
    ['Who it’s for', 'Tell a real market move from your vendor’s markup — before you re-price a dish.'],
    ['How it’s different', 'Every number traces to a dated public report you can open. Not a paywalled, assessed quote — a number you can check.'],
  ];
  return `<div class="ci-orient">${cells.map(([h, b]) => `<div class="ci-orient__cell"><p class="ci-orient__h">${h}</p><p class="ci-orient__b">${b}</p></div>`).join('')}</div>`;
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
    ? `Dónde se cotizan al mayoreo ${shipSlugs.length} ingredientes comunes de restaurante — un rango típico y una tendencia, de datos públicos de USDA, BLS y FRED — para distinguir un movimiento real de mercado de un sobreprecio de proveedor. Elige un ingrediente para su lectura, o abre la herramienta en vivo para verlos todos a la vez.`
    : `Where ${shipSlugs.length} common restaurant ingredients are priced wholesale — a typical range and a trend, drawn from public USDA, BLS and FRED data — so you can tell a real market move from a vendor markup. Pick an ingredient for its reading, or open the live tool to see them all at once.`;

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
    ? `<p>Río arriba, los precios se mueven con un puñado de materias primas que se rastrean bajo “por qué se mueve”: maíz y soya (forraje), diésel y electricidad. Para lo que se está moviendo ahora mismo, <a href="${base}/tools/cost-pulse/">abre la herramienta en vivo</a>.</p>`
    : `<p>Upstream, prices move with a handful of commodities tracked under “why it's moving”: corn and soybeans (feed), diesel, and electricity. For what's moving right now, <a href="${base}/tools/cost-pulse/">open the live tool</a>.</p>`;

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
        'distribution': [
          { '@type': 'DataDownload', 'name': es ? 'Índice completo (CSV)' : 'Whole index (CSV)', 'encodingFormat': 'text/csv', 'contentUrl': 'https://muntin.digital/cost-index/index.csv' },
          { '@type': 'DataDownload', 'name': es ? 'Índice completo (JSON)' : 'Whole index (JSON)', 'encodingFormat': 'application/json', 'contentUrl': 'https://muntin.digital/cost-index/index.json' }
        ],
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

  const fresh = CI._lastReviewed || null;
  const freshTxt = fresh
    ? (es ? `Datos públicos, actualizados cuando las fuentes publican. Última revisión: ${fresh}.` : `Public data, refreshed as the sources publish. Last reviewed ${fresh}.`)
    : (es ? 'Datos públicos, actualizados cuando las fuentes publican.' : 'Public data, refreshed as the sources publish.');
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
      <a class="btn btn-primary" href="${base}/tools/cost-pulse/">${es ? 'Abrir la herramienta en vivo' : 'Open the live tool'}</a>
      <a class="btn btn-ghost" href="${base}/cost-index/methodology/">${es ? 'Cómo funciona' : 'How this index works'}</a>
      ${anyPressureProven() ? `<a class="btn btn-ghost" href="${base}/cost-index/lab/">${es ? 'Laboratorio de Presión' : 'Pressure Lab'}</a>` : ''}
      <a class="btn btn-ghost" href="${base}/glossary/cost-index/">${es ? '¿Qué es un índice de costos?' : 'What is a cost index?'}</a>
    </div>
    ${compositeBand(locale)}
    ${scorecardBand(locale)}
    <p class="ci-hub-data" style="margin:14px 0 4px;font-size:13.5px;line-height:1.5;color:var(--ink-soft)">${freshTxt} ${es ? 'Llévate los datos: todo el índice' : 'Take the data with you — the whole index'}: <a href="/cost-index/index.csv" download style="color:var(--teal);font-weight:600;border-bottom:1px dashed currentColor;text-decoration:none">CSV</a> · <a href="/cost-index/index.json" style="color:var(--teal);font-weight:600;border-bottom:1px dashed currentColor;text-decoration:none">JSON</a> <span style="color:var(--stone)">${es ? '· dominio público (CC0)' : '· public domain (CC0)'}</span></p>
    ${hubOrientation(locale)}
    ${movingNowSection(shipSlugs, locale)}
    ${allReadingsTable(shipSlugs, locale)}
    ${sections}
    ${pendingSection}
    ${driverNote}
    ${weeklySignup(locale, { anchor: true })}
    <p class="ci-source"><strong>${es ? 'Fuente' : 'Sourced'}:</strong> ${es ? 'datos públicos de mercado (USDA AMS/LMR, BLS, FRED, EIA, NOAA), vía' : 'public market data (USDA AMS/LMR, BLS, FRED, EIA, NOAA), via'} <a href="${base}/tools/cost-pulse/">${es ? 'la herramienta en vivo' : 'the live tool'}</a>.</p>
  </div>` + pageTail;
}

// ---- Pressure Lab — the playable engine (a new tool page) -----------
const LAB_CSS = `<style>
#pressureLab[data-layer]{margin:18px 0}
.plab-pick{display:flex;align-items:center;gap:8px;margin:0 0 14px;flex-wrap:wrap}
.plab-pick__label{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-soft)}
.plab-pick__select{font:inherit;font-size:14px;padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:var(--white);color:var(--ink)}
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
.plab-reset,.plab-share{font:inherit;font-size:13px;cursor:pointer;border:1px solid var(--line);background:var(--cream);border-radius:999px;padding:6px 14px;margin:4px 6px 0 0}
.plab-reset:hover,.plab-share:hover{border-color:#6b4fa1;color:#6b4fa1}
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
  const v = 'v=20260610-season1';
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
      <a class="btn btn-ghost" href="${base}/tools/cost-pulse/">${es ? 'Abrir la herramienta en vivo' : 'Open the live tool'}</a>
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
// Whole-index aggregate export — the entire basket in one downloadable file
// (CSV + JSON), language-neutral, linked from both hubs (absolute /cost-index/
// path, shared like the per-ingredient series.* files). Shippable readings only.
targets.push({ path: 'cost-index/index.json', content: aggregateJson(allGated), raw: true });
targets.push({ path: 'cost-index/index.csv',  content: aggregateCsv(allGated),  raw: true });
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
