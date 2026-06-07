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

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
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
const LABELS_DOC  = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index-labels.json'), 'utf8')); }
  catch { return { labels: {}, drivers: {} }; }
})();
const LABELS  = LABELS_DOC.labels || {};
const DRIVER_LABELS = LABELS_DOC.drivers || {};

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
  // What may render as a number, by confidence (honesty contract).
  const distinctRange = !!(rc && rc[0] !== rc[1]);
  const emitPoint = (conf === 'high' || conf === 'medium') && !!lvl && rc != null;
  const emitRange = emitPoint || (conf === 'low' && distinctRange);
  return { entry, point, lvl, rc, conf, trend, hist, distinctRange, emitPoint, emitRange,
    basis: (lvl && lvl.basis) || 'wholesale', asOf: point.asOf || null };
}

function dirWord(trend, locale) {
  const es = locale === 'es';
  if (trend.dir === 'up')   return es ? 'al alza' : 'up';
  if (trend.dir === 'down') return es ? 'a la baja' : 'down';
  return es ? 'casi estable' : 'about flat';
}

// ---- The visible "Market read" data block --------------------------
function marketReadBlock(slug, locale) {
  const r = readingOf(slug);
  if (!r) return '';
  const es = locale === 'es';
  const lab = LABELS[slug] || {};
  const unit = es ? (lab.unit_es || lab.unit_en) : lab.unit_en;
  const unitSfx = unit ? '/' + unit : '';
  const basisRef = es
    ? ({ wholesale: 'referencia mayorista', retail: 'referencia minorista', delivered: 'precio entregado' }[r.basis] || 'referencia')
    : ({ wholesale: 'wholesale reference', retail: 'retail reference', delivered: 'delivered' }[r.basis] || 'reference');
  let rangeStr = '';
  let hasNumber = false;
  if (r.emitRange && r.distinctRange) {
    rangeStr = `${money(r.rc[0])}–${money(r.rc[1])}${unitSfx} (${basisRef})`;
    hasNumber = true;
  } else if (r.emitPoint && r.rc) {
    rangeStr = `${money(r.rc[0])}${unitSfx} (${basisRef}${es ? ', una fuente' : ', single source'})`;
    hasNumber = true;
  }
  const trendStr = (r.emitPoint && typeof r.trend.pct === 'number')
    ? `, ${dirWord(r.trend, locale)} ${(r.trend.pct >= 0 ? '+' : '')}${(r.trend.pct * 100).toFixed(1).replace(/\.0$/, '')}%`
    : (r.trend.dir ? `, ${dirWord(r.trend, locale)}` : '');
  const conf = r.conf;
  const confWord = es ? ({ high: 'alta', medium: 'media', low: 'baja', directional: 'direccional' }[conf] || conf) : conf;
  const agencies = citedAgencies(r.entry, r.point);
  const shortList = [...new Set((r.point.provenance || []).map((p) => shortSource(p.source)))];
  const asOf = r.asOf || '—';
  const head = es ? 'Lectura de mercado' : 'Market read';
  const dw = r.trend.dir ? dirWord(r.trend, locale) : null;
  let line;
  if (hasNumber) {
    line = es
      ? `Alrededor de ${rangeStr}${trendStr} en la ventana reciente.`
      : `About ${rangeStr}${trendStr} over the recent window.`;
  } else {
    line = es
      ? `${dw ? 'Tendencia ' + dw : 'Sin tendencia clara'} en la ventana reciente — sin cifra publicada por ahora (poca coincidencia entre fuentes para fijar un número).`
      : `${dw ? 'Trending ' + dw : 'No clear trend'} over the recent window — no published figure this period (too little source agreement to set a number).`;
  }
  const badge = `${es ? 'confianza' : 'confidence'} ${confWord} · ${es ? 'al' : 'as of'} ${asOf}`;
  const disclaimer = r.basis === 'retail'
    ? (es ? 'Referencia minorista, no el precio mayorista ni el entregado que pagas.' : 'Retail reference, not the wholesale or delivered price you pay.')
    : (es ? 'Referencia mayorista, no el precio entregado que pagas.' : 'Wholesale reference, not the delivered price you pay.');
  const srcBody = `${(shortList.length ? shortList.join(' · ') : agencies.map((a) => a.name).join(' · '))} — ${es ? 'datos públicos' : 'public data'}, ${es ? 'al' : 'as of'} ${asOf}. ${disclaimer}`;
  const liveLabel = es ? `Ver ${(lab.es || lab.en || slug).toLowerCase()} en vivo en Cost Pulse` : `See ${(lab.en || slug).toLowerCase()} live in Cost Pulse`;
  return `
  <aside class="ci-read" aria-label="${es ? 'Lectura de mercado' : 'Market read'}">
    <p class="ci-read__head">${head}<span class="ci-read__badge">${badge}</span></p>
    <p class="ci-read__line">${line}</p>
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

function emitIngredientPage(slug, locale) {
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
  const title = es ? 'Índice de costos de restaurante | Muntin Digital' : 'Restaurant ingredient cost index | Muntin Digital';
  const desc = es
    ? 'Dónde se cotizan al mayoreo ingredientes comunes de restaurante — un rango típico y la tendencia, de fuentes públicas (USDA, BLS, FRED) — para distinguir un movimiento de mercado de un sobreprecio.'
    : 'Where common restaurant ingredients are priced wholesale — a typical range and a trend, from public sources (USDA, BLS, FRED) — so you can tell a market move from a vendor markup.';
  const heroH1 = es ? 'Índice de costos de ingredientes' : 'Restaurant ingredient cost index';
  const heroLede = es
    ? `Dónde se cotizan al mayoreo ${slugs.length} ingredientes comunes de restaurante — un rango típico y una tendencia, de datos públicos de USDA, BLS y FRED — para distinguir un movimiento real de mercado de un sobreprecio de proveedor. Elige un ingrediente para su lectura, o abre Cost Pulse para verlos todos a la vez.`
    : `Where ${slugs.length} common restaurant ingredients are priced wholesale — a typical range and a trend, drawn from public USDA, BLS and FRED data — so you can tell a real market move from a vendor markup. Pick an ingredient for its reading, or open Cost Pulse to see them all at once.`;

  // Grouped cards by category.
  const byCat = {};
  for (const s of slugs) { const c = (ING_META[s] || {}).cat || 'pantry'; (byCat[c] = byCat[c] || []).push(s); }
  const sections = CATEGORY_ORDER.filter((c) => byCat[c] && byCat[c].length).map((c) => {
    const cat = CATEGORIES[c];
    const cards = byCat[c].map((s) => {
      const l = LABELS[s] || {};
      const nm = (es ? (l.es || l.en) : l.en) || s;
      return `<div class="ci-card"><a href="${base}/cost-index/${s}/">${escHtml(nm)}</a><span class="ci-card-note">${escHtml(hubCardNote(s, locale))}</span></div>`;
    }).join('');
    return `<h2 class="ci-cat-h" id="${c}">${escHtml(es ? cat.es : cat.en)}</h2><div class="ci-grid">${cards}</div>`;
  }).join('\n');

  const driverNote = es
    ? `<p>Río arriba, los precios se mueven con un puñado de materias primas que el tablero rastrea bajo “por qué se mueve”: maíz y soya (forraje), diésel y electricidad. Para lo que se está moviendo ahora mismo, <a href="${base}/tools/cost-pulse/">abre Cost Pulse</a>.</p>`
    : `<p>Upstream, prices move with a handful of commodities the dashboard tracks under “why it's moving”: corn and soybeans (feed), diesel, and electricity. For what's moving right now, <a href="${base}/tools/cost-pulse/">open Cost Pulse</a>.</p>`;

  // Schema: DataCatalog + CollectionPage + ItemList + Breadcrumb.
  const baseUrl = es ? canonEs : canonEn;
  const datasetRefs = slugs.map((s) => ({ '@id': `https://muntin.digital${base}/cost-index/${s}/#dataset` }));
  const items = slugs.map((s, i) => {
    const l = LABELS[s] || {};
    return { '@type': 'ListItem', 'position': i + 1, 'name': (es ? (l.es || l.en) : l.en) || s, 'item': `${baseUrl}${s}/` };
  });
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
    ${sections}
    ${driverNote}
    <p class="ci-source"><strong>${es ? 'Fuente' : 'Sourced'}:</strong> ${es ? 'datos públicos de mercado (USDA AMS/LMR, BLS, FRED, EIA, NOAA), vía' : 'public market data (USDA AMS/LMR, BLS, FRED, EIA, NOAA), via'} <a href="${base}/tools/cost-pulse/">Cost Pulse</a>.</p>
  </div>` + pageTail;
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
  targets.push({ path: `cost-index/${slug}/series.json`,   content: seriesJson(slug), raw: true });
  targets.push({ path: `cost-index/${slug}/series.csv`,    content: seriesCsv(slug),  raw: true });
}
// Hub lists every gated ingredient regardless of the --only subset, so it
// never advertises a page that isn't built. When --only is active we still
// build the hub from the full gated set so its ItemList stays complete.
targets.push({ path: 'cost-index/index.html',    content: emitHubPage('en', allGated) });
targets.push({ path: 'es/cost-index/index.html', content: emitHubPage('es', allGated) });

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
