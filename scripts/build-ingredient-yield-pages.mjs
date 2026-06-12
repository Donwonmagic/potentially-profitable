#!/usr/bin/env node
/**
 * Muntin Plate — per-ingredient yield landing pages.
 *
 * Emits one page per ingredient at /library/ingredient-yields/<slug>/
 * (+ ES mirror) plus a hub at /library/ingredient-yields/. Each page
 * answers a real search ("romaine yield", "how much usable chicken
 * from a whole bird") with the sourced CIA yield, the AP→EP math made
 * plain, and a funnel into the free Plate Cost calculator and on to
 * Muntin Ledger. This is the programmatic demand engine for Plate.
 *
 * Yields are the CIA Standard Yield Tables already shipped in
 * tools/plate-cost/plate-cost.js (YIELD_TABLE) — the single source of
 * truth, cited inline on every page. Example AP prices are explicitly
 * illustrative; the EP figure is computed (AP ÷ yield), not claimed.
 *
 * Modes:
 *   node scripts/build-ingredient-yield-pages.mjs           # write
 *   node scripts/build-ingredient-yield-pages.mjs --check    # diff-only, exit 1 on drift
 *
 * Mirrors scripts/build-cuisine-landing-pages.mjs for chrome + check
 * parity. New ingredients: append to INGREDIENTS (and a CATEGORIES
 * entry if a new bucket). The slug is registered as a non-article
 * collection in scripts/lib/library-skips.mjs.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
// Reuse the SAME tested, localized buy/hold/watch helper the dashboard uses, so
// the page verdict and the tool verdict can never drift.
const makeFmt = createRequire(import.meta.url)(path.join(repoRoot, 'tools/_shared/cost-index-format.js'));
const checkMode  = process.argv.includes('--check');

function shellHash(name) {
  const abs = path.join(repoRoot, 'assets', name);
  const h = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
  return h.slice(0, 12);
}
const SHELL_HASH = { core: shellHash('site-core.css'), article: shellHash('site-article.css') };

function normalizeBatchBanner(html) {
  return html
    .replace(/<!-- batch-banner:start -->[\s\S]*?<!-- batch-banner:end -->/, '<!-- batch-banner:start --><!-- batch-banner:end -->')
    .replace(/\/\* perf-critical \*\/[\s\S]*?(?=<\/style>)/, '')
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

// --- Live Cost Index block (dormant until data/cost-index.json carries a
// verified, sourced point for the ingredient — fact-gated by
// scripts/check-cost-index-sync.mjs). Empty today, so it renders nothing and
// the pages stay byte-identical; the moment real data lands it flows in here. ---
const COST_INDEX = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index.json'), 'utf8')).ingredients || {}; }
  catch { return {}; }
})();
const CI_SOURCE_LABELS = { 'usda-ams': 'USDA AMS', bls: 'BLS PPI', fred: 'FRED', noaa: 'NOAA Fisheries' };
// Surface WHY a read is the strength it is — the honesty engine's reasoning, in
// plain language. Qualitative only (no numbers to fact-gate); mirrors the
// confidenceFor min-of-gates on the vendored fields the point already carries.
function whyConfidence(point, conf, es) {
  const lvl = point.level, tr = point.trend || {};
  if (!lvl) return es ? 'Solo dirección — aún sin un nivel de precio comparable.' : 'Direction only — no comparable dollar level yet.';
  if (conf === 'high') return es ? 'Lectura sólida — fuentes independientes coinciden en el nivel y en el movimiento.' : 'Strong read — independent sources agree on both the level and the move.';
  const lt = lvl.nTypes || 0, tt = tr.nTypes || 0;
  const agree = typeof tr.agreement === 'number' ? tr.agreement : 1;
  const noise = tr.noise == null ? 0 : tr.noise;
  const disp = lvl.typeDispersion || 0;
  const levelPart = lt >= 2 && disp > 0.15
    ? (es ? 'Las fuentes de precio no coinciden en el nivel' : 'The dollar sources disagree on the level')
    : lt >= 2
      ? (es ? 'El nivel está bien respaldado' : 'The level is well backed')
      : (es ? 'Una sola metodología de precio respalda el nivel' : 'One pricing methodology backs the level');
  const trendCaveat = (typeof tr.pct !== 'number') ? ''
    : noise > 0.20 ? (es ? 'pero los precios saltan semana a semana, así que la tendencia no es firme' : "but week-to-week prices are jagged, so the trend isn't firm")
      : agree < 0.5 ? (es ? 'y los mercados no coinciden en la dirección' : 'and the markets disagree on direction')
        : tt < 2 ? (es ? 'y la tendencia se apoya en una sola fuente independiente' : 'and the trend leans on a single independent source')
          : '';
  return `${levelPart}${trendCaveat ? ', ' + trendCaveat : ''}.`;
}
// "Where it's cheapest right now" — the cross-market spread the engine already
// collects in provenance and the page throws away. Each market is individually
// cited (honest); skipped unless ≥2 AMS markets with a real spread.
function ciMarketName(src) {
  if (typeof src !== 'string' || src.indexOf('usda-ams-') !== 0) return null;
  return src.slice('usda-ams-'.length).split('-').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
}
function cheapestLine(point, es) {
  const lp = (point.provenance || []).filter((p) => p.kind === 'level' && typeof p.valueCents === 'number' && p.valueCents > 0 && ciMarketName(p.source));
  if (lp.length < 2) return '';
  let lo = lp[0], hi = lp[0];
  for (const p of lp) { if (p.valueCents < lo.valueCents) lo = p; if (p.valueCents > hi.valueCents) hi = p; }
  const loM = ciMarketName(lo.source), hiM = ciMarketName(hi.source);
  if (loM === hiM || lo.valueCents === hi.valueCents) return '';
  return es
    ? `Más barato en ${loM} (~${money(lo.valueCents)}), más caro en ${hiM} (~${money(hi.valueCents)}).`
    : `Cheapest in ${loM} (~${money(lo.valueCents)}), priciest in ${hiM} (~${money(hi.valueCents)}).`;
}
function costIndexBlock(slug, locale) {
  const entry = COST_INDEX[slug];
  const point = entry && Array.isArray(entry.points) && entry.points[0];
  if (!point) return '';                       // nothing verified+sourced yet → render nothing
  const es = locale === 'es';
  const conf = point.confidence || 'low';
  const confWord = es ? ({ high: 'alta', medium: 'media', low: 'baja', directional: 'direccional' }[conf] || conf) : conf;
  const lvl = point.level;
  const basis = (lvl && lvl.basis) || 'wholesale';
  const unitSfx = lvl && lvl.unit ? '/' + lvl.unit : '';                  // never imply a $/lb we didn't measure (produce is $/carton)
  const basisRef = es
    ? ({ wholesale: 'referencia mayorista', retail: 'referencia minorista', delivered: 'precio entregado' }[basis] || 'referencia')
    : ({ wholesale: 'wholesale reference', retail: 'retail reference', delivered: 'delivered' }[basis] || 'reference');
  const rc = lvl && Array.isArray(lvl.rangeCents) ? lvl.rangeCents : null;
  const range = (rc && rc[0] !== rc[1])
    ? `${money(rc[0])}–${money(rc[1])}${unitSfx} (${basisRef})`
    : rc
      ? `${money(rc[0])}${unitSfx} (${basisRef}${es ? ', una fuente' : ', single source'})`
      : (es ? 'solo dirección' : 'directional only');
  const tr = point.trend || {};
  const dirWord = tr.dir === 'up' ? (es ? 'al alza' : 'up') : tr.dir === 'down' ? (es ? 'a la baja' : 'down') : (es ? 'estable' : 'flat');
  const trendStr = (typeof tr.pct === 'number') ? `, ${dirWord} ${(tr.pct >= 0 ? '+' : '')}${(tr.pct * 100).toFixed(1).replace(/\.0$/, '')}%` : '';
  const sources = [...new Set((point.provenance || []).map((p) => CI_SOURCE_LABELS[p.source] || p.source).filter(Boolean))];
  const asOf = point.asOf || '—';
  const head = es ? 'Lectura de mercado' : 'Market read';
  const line = es ? `Alrededor de ${range}${trendStr} en la ventana reciente.` : `About ${range}${trendStr} over the recent window.`;
  const badge = `${es ? 'confianza' : 'confidence'} ${confWord} · ${es ? 'al' : 'as of'} ${asOf}`;
  const srcSummary = `${es ? 'Fuentes' : 'Sources'} · ${sources.length}`;
  const disclaimer = basis === 'retail'
    ? (es ? 'Referencia minorista, no el precio mayorista ni el entregado que pagas.' : 'Retail reference, not the wholesale or delivered price you pay.')
    : (es ? 'Referencia mayorista, no el precio entregado que pagas.' : 'Wholesale reference, not the delivered price you pay.');
  const srcBody = `${sources.join(' · ')} — ${es ? 'datos públicos' : 'public data'}, ${es ? 'al' : 'as of'} ${asOf}. ${disclaimer}`;
  const why = whyConfidence(point, conf, es);
  const FMT = makeFmt(es);
  const fv = FMT.flagVerb(entry.flag, conf);   // buy/hold/watch — same tested helper as the dashboard, hedged by confidence
  const verdictHtml = fv ? `\n  <p class="iy-ci-verdict iy-ci-${fv.tone}"><strong>${fv.verb}.</strong> ${fv.note}</p>` : '';
  const spread = cheapestLine(point, es);
  const spreadHtml = spread ? `\n  <p class="iy-ci-spread">${spread}</p>` : '';
  // "Where today sits in its own range" — an honest COUNT of the PUBLISHED level
  // vs the vendored weekly history. Anchor "today" to the level median (the
  // authoritative current read), not the history's last point (which can lag the
  // composite), so the percentile can't contradict the level/trend. Gated like the
  // dashboard (never on a directional read).
  const hist = (entry.history || []).map((h) => h && h.valueCents).filter((v) => typeof v === 'number' && isFinite(v));
  const today = lvl && typeof lvl.medianCents === 'number' ? lvl.medianCents : null;
  const pctl = (conf !== 'directional' && today != null) ? FMT.percentileLine([...hist, today]) : '';
  const pctlHtml = pctl ? `\n  <p class="iy-ci-pctl">${pctl}</p>` : '';
  return `
<div class="iy-costindex">
  <p class="iy-ci-head">${head}<span class="iy-ci-badge">${badge}</span></p>
  <p class="iy-ci-line">${line}</p>${pctlHtml}${spreadHtml}${verdictHtml}
  <p class="iy-ci-why">${why}</p>
  <details class="iy-ci-src"><summary>${srcSummary}</summary><div>${srcBody}</div></details>
</div>`;
}

// ---- Data ----------------------------------------------------------
// Category-level guidance (the "what's the loss" truth), bilingual.
const CATEGORIES = {
  greens:     { en: 'Greens & lettuces', es: 'Verduras de hoja',
    guide_en: 'Coring, ribs, and bruised outer leaves are the loss. Weigh what you actually plate, not what you carry in from the walk-in.',
    guide_es: 'El troncho, las nervaduras y las hojas externas golpeadas son la merma. Pesa lo que de verdad emplatas, no lo que entra del refri.' },
  cruciferous:{ en: 'Cruciferous', es: 'Crucíferas',
    guide_en: 'Florets-only means the stalks and core leave as loss — unless they go into a stock or a slaw.',
    guide_es: 'Solo los floretes significa que el tallo y el centro se van como merma — salvo que los uses en caldo o ensalada.' },
  stalks:     { en: 'Stalks', es: 'Tallos',
    guide_en: 'The woody base is the loss. Snap or trim where it gives, and the rest plates.',
    guide_es: 'La base leñosa es la merma. Corta donde cede, y el resto se emplata.' },
  allium:     { en: 'Alliums', es: 'Cebollas y ajos',
    guide_en: 'Papery skin and the root end are the only real loss; most of the bulb plates.',
    guide_es: 'La cáscara y la raíz son la única merma real; casi todo el bulbo se aprovecha.' },
  root:       { en: 'Roots', es: 'Raíces',
    guide_en: 'Peeling and topping is the loss; a sharp peeler and thin strokes claw yield back.',
    guide_es: 'Pelar y descabezar es la merma; un pelador filoso y cortes finos recuperan rendimiento.' },
  tuber:      { en: 'Tubers', es: 'Tubérculos',
    guide_en: 'Peel loss is real; skin-on prep recovers most of it when the dish allows.',
    guide_es: 'La merma de cáscara es real; dejar la piel recupera casi todo cuando el platillo lo permite.' },
  fruiting:   { en: 'Fruiting vegetables', es: 'Verduras de fruto',
    guide_en: 'Cores, seeds, and stems are the loss; very little goes to waste here.',
    guide_es: 'Centros, semillas y tallos son la merma; aquí casi nada se desperdicia.' },
  fruit:      { en: 'Fruit', es: 'Fruta',
    guide_en: 'Pit, skin, and stem are the loss. Ripe fruit yields more than under-ripe.',
    guide_es: 'Hueso, piel y tallo son la merma. La fruta madura rinde más que la verde.' },
  citrus:     { en: 'Citrus', es: 'Cítricos',
    guide_en: 'You buy the whole fruit but plate only the juice or segments. Yield is low, so cost per usable ounce runs high.',
    guide_es: 'Compras la fruta entera pero usas solo el jugo o los gajos. El rendimiento es bajo, así que el costo por onza útil sube.' },
  meat:       { en: 'Meat & poultry', es: 'Carne y aves',
    guide_en: 'Bone, skin, and trim are the loss. A whole bird costs less per pound but yields far less usable meat than a portioned cut.',
    guide_es: 'Hueso, piel y recorte son la merma. Un ave entera cuesta menos por libra pero rinde mucha menos carne útil que un corte porcionado.' },
  beef:       { en: 'Beef & lamb', es: 'Res y cordero',
    guide_en: 'Bone, fat cap, and silverskin are the loss — and they vary by cut and butcher. Bone-in costs less per pound but yields less plate.',
    guide_es: 'Hueso, capa de grasa y telilla son la merma — y varían por corte y carnicero. Con hueso cuesta menos por libra pero rinde menos al plato.' },
  seafood:    { en: 'Seafood', es: 'Pescados',
    guide_en: 'On a whole fish, the head, frame, skin, and trim are the loss — a whole fish at a low per-pound price can cost more per plated ounce than a fillet.',
    guide_es: 'En un pescado entero, la cabeza, el espinazo, la piel y el recorte son la merma — un pescado entero barato por libra puede costar más por onza emplatada que un filete.' },
  shellfish:  { en: 'Shellfish', es: 'Mariscos',
    guide_en: 'Shell, head, and water weight are the loss — shellfish yields are the lowest in the kitchen, so the cost per usable ounce runs high.',
    guide_es: 'Cáscara, cabeza y agua son la merma — los mariscos tienen el rendimiento más bajo de la cocina, así que el costo por onza útil es alto.' },
  herbs:      { en: 'Herbs', es: 'Hierbas',
    guide_en: 'Leaves are what you plate; the stems are the loss. Stem-on herbs can shed half their weight to picking.',
    guide_es: 'Las hojas son lo que emplatas; los tallos son la merma. Las hierbas con tallo pueden perder la mitad de su peso al deshojar.' },
  mushroom:   { en: 'Mushrooms', es: 'Hongos',
    guide_en: 'Trimming the dry stem ends is the only real loss — mushrooms are nearly all usable.',
    guide_es: 'Recortar las puntas secas del tallo es la única merma real — los hongos se aprovechan casi por completo.' }
};

// Curated first batch (sourced yields from plate-cost.js YIELD_TABLE).
// unit + apCents are ILLUSTRATIVE example AP prices for the worked math.
const INGREDIENTS = [
  { slug: 'romaine-lettuce', en: 'Romaine lettuce', es: 'Lechuga romana', yield: 0.75, cat: 'greens',     unit_en: 'head', unit_es: 'pieza',  apCents: 250 },
  { slug: 'spinach',         en: 'Spinach',          es: 'Espinaca',       yield: 0.75, cat: 'greens',     unit_en: 'lb',   unit_es: 'libra',  apCents: 400 },
  { slug: 'broccoli',        en: 'Broccoli',         es: 'Brócoli',        yield: 0.65, cat: 'cruciferous',unit_en: 'lb',   unit_es: 'libra',  apCents: 220 },
  { slug: 'asparagus',       en: 'Asparagus',        es: 'Espárragos',     yield: 0.55, cat: 'stalks',     unit_en: 'lb',   unit_es: 'libra',  apCents: 350 },
  { slug: 'onion',           en: 'Onion',            es: 'Cebolla',        yield: 0.88, cat: 'allium',     unit_en: 'lb',   unit_es: 'libra',  apCents: 90  },
  { slug: 'garlic',          en: 'Garlic',           es: 'Ajo',            yield: 0.87, cat: 'allium',     unit_en: 'lb',   unit_es: 'libra',  apCents: 400 },
  { slug: 'carrot',          en: 'Carrot',           es: 'Zanahoria',      yield: 0.82, cat: 'root',       unit_en: 'lb',   unit_es: 'libra',  apCents: 110 },
  { slug: 'russet-potato',   en: 'Russet potato',    es: 'Papa russet',    yield: 0.81, cat: 'tuber',      unit_en: 'lb',   unit_es: 'libra',  apCents: 80  },
  { slug: 'tomato',          en: 'Tomato',           es: 'Jitomate',       yield: 0.91, cat: 'fruiting',   unit_en: 'lb',   unit_es: 'libra',  apCents: 240 },
  { slug: 'avocado',         en: 'Avocado',          es: 'Aguacate',       yield: 0.75, cat: 'fruit',      unit_en: 'each', unit_es: 'pieza',  apCents: 120 },
  { slug: 'lime',            en: 'Lime',             es: 'Limón',          yield: 0.35, cat: 'citrus',     unit_en: 'each', unit_es: 'pieza',  apCents: 30  },
  { slug: 'whole-chicken',   en: 'Whole chicken',    es: 'Pollo entero',   yield: 0.60, cat: 'meat',       unit_en: 'lb',   unit_es: 'libra',  apCents: 160 },
  { slug: 'chicken-breast',  en: 'Chicken breast',   es: 'Pechuga de pollo', yield: 0.95, cat: 'meat',     unit_en: 'lb', unit_es: 'libra', apCents: 380 },
  { slug: 'chicken-thigh',   en: 'Chicken thigh',    es: 'Muslo de pollo', yield: 0.90, cat: 'meat',       unit_en: 'lb', unit_es: 'libra', apCents: 220 },
  { slug: 'pork-shoulder',   en: 'Pork shoulder',    es: 'Espaldilla de cerdo', yield: 0.75, cat: 'meat',  unit_en: 'lb', unit_es: 'libra', apCents: 250 },
  { slug: 'pork-loin',       en: 'Pork loin',        es: 'Lomo de cerdo',  yield: 0.85, cat: 'meat',       unit_en: 'lb', unit_es: 'libra', apCents: 350 },
  { slug: 'ribeye',          en: 'Ribeye',           es: 'Ribeye (costilla)', yield: 0.75, cat: 'beef',     unit_en: 'lb', unit_es: 'libra', apCents: 1400 },
  { slug: 'striploin',       en: 'Striploin',        es: 'New York (bife angosto)', yield: 0.80, cat: 'beef', unit_en: 'lb', unit_es: 'libra', apCents: 1200 },
  { slug: 'beef-tenderloin', en: 'Beef tenderloin',  es: 'Filete de res',  yield: 0.85, cat: 'beef',       unit_en: 'lb', unit_es: 'libra', apCents: 2000 },
  { slug: 'leg-of-lamb',     en: 'Leg of lamb',      es: 'Pierna de cordero', yield: 0.70, cat: 'beef',     unit_en: 'lb', unit_es: 'libra', apCents: 900 },
  { slug: 'whole-salmon',    en: 'Whole salmon',     es: 'Salmón entero',  yield: 0.55, cat: 'seafood',    unit_en: 'lb', unit_es: 'libra', apCents: 700 },
  { slug: 'salmon-fillet',   en: 'Salmon fillet',    es: 'Filete de salmón', yield: 0.95, cat: 'seafood',  unit_en: 'lb', unit_es: 'libra', apCents: 1200 },
  { slug: 'tuna-loin',       en: 'Tuna loin',        es: 'Lomo de atún',   yield: 0.85, cat: 'seafood',    unit_en: 'lb', unit_es: 'libra', apCents: 1400 },
  { slug: 'whole-branzino',  en: 'Whole branzino',   es: 'Branzino entero', yield: 0.55, cat: 'seafood',   unit_en: 'lb', unit_es: 'libra', apCents: 900 },
  { slug: 'shrimp',          en: 'Shrimp (shell-on)', es: 'Camarón con cáscara', yield: 0.85, cat: 'shellfish', unit_en: 'lb', unit_es: 'libra', apCents: 900 },
  { slug: 'whole-lobster',   en: 'Whole lobster',    es: 'Langosta entera', yield: 0.30, cat: 'shellfish',  unit_en: 'lb', unit_es: 'libra', apCents: 1400 },
  { slug: 'kale',            en: 'Kale',             es: 'Col rizada (kale)', yield: 0.70, cat: 'greens',    unit_en: 'lb',    unit_es: 'libra',  apCents: 250 },
  { slug: 'cauliflower',     en: 'Cauliflower',      es: 'Coliflor',       yield: 0.60, cat: 'cruciferous', unit_en: 'head',  unit_es: 'pieza',  apCents: 300 },
  { slug: 'bell-pepper',     en: 'Bell pepper',      es: 'Pimiento morrón', yield: 0.82, cat: 'fruiting',   unit_en: 'lb',    unit_es: 'libra',  apCents: 200 },
  { slug: 'sweet-potato',    en: 'Sweet potato',     es: 'Camote',         yield: 0.75, cat: 'tuber',       unit_en: 'lb',    unit_es: 'libra',  apCents: 120 },
  { slug: 'corn-on-the-cob', en: 'Corn on the cob',  es: 'Elote (mazorca)', yield: 0.28, cat: 'fruiting',   unit_en: 'ear',   unit_es: 'pieza',  apCents: 50 },
  { slug: 'button-mushroom', en: 'Button mushroom',  es: 'Champiñón',      yield: 0.90, cat: 'mushroom',    unit_en: 'lb',    unit_es: 'libra',  apCents: 350 },
  { slug: 'basil',           en: 'Basil',            es: 'Albahaca',       yield: 0.50, cat: 'herbs',       unit_en: 'bunch', unit_es: 'manojo', apCents: 200 },
  { slug: 'cilantro',        en: 'Cilantro',         es: 'Cilantro',       yield: 0.70, cat: 'herbs',       unit_en: 'bunch', unit_es: 'manojo', apCents: 80 },
  { slug: 'lemon',           en: 'Lemon',            es: 'Limón amarillo', yield: 0.45, cat: 'citrus',      unit_en: 'each',  unit_es: 'pieza',  apCents: 40 },
  { slug: 'pineapple',       en: 'Pineapple',        es: 'Piña',           yield: 0.50, cat: 'fruit',       unit_en: 'each',  unit_es: 'pieza',  apCents: 300 }
];

function relatedInCategory(ing, locale) {
  const sibs = INGREDIENTS.filter(x => x.cat === ing.cat && x.slug !== ing.slug);
  if (!sibs.length) return '';
  const base = locale === 'es' ? '/es' : '';
  const links = sibs.map(s =>
    `<a href="${base}/library/ingredient-yields/${s.slug}/">${escHtml(locale === 'es' ? s.es : s.en)}</a>`
  ).join(' · ');
  const label = locale === 'es' ? 'Misma categoría' : 'Same category';
  return `<p class="iy-related"><span class="iy-related-label">${label}</span>${links}</p>`;
}

function emitJsonLd(ing, locale) {
  const base = locale === 'es' ? '/es' : '';
  const url = `https://muntin.digital${base}/library/ingredient-yields/${ing.slug}/`;
  const name = locale === 'es' ? ing.es : ing.en;
  const pctTxt = Math.round(ing.yield * 100) + '%';
  const q = locale === 'es'
    ? `¿Cuál es el rendimiento de ${name.toLowerCase()}?`
    : `What is the yield of ${name.toLowerCase()}?`;
  const a = locale === 'es'
    ? `El rendimiento típico de ${name.toLowerCase()} es ${pctTxt} (porción comestible sobre peso comprado), según las tablas de rendimiento estándar del CIA.`
    : `${name} typically yields ${pctTxt} edible portion of its as-purchased weight, per the CIA Standard Yield Tables.`;
  const crumb = locale === 'es'
    ? [['Inicio','https://muntin.digital/es/'],['Biblioteca','https://muntin.digital/es/library/'],['Rendimiento de ingredientes','https://muntin.digital/es/library/ingredient-yields/'],[name,url]]
    : [['Home','https://muntin.digital/'],['Library','https://muntin.digital/library/'],['Ingredient yields','https://muntin.digital/library/ingredient-yields/'],[name,url]];
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': url + '#webpage', 'name': name + (locale === 'es' ? ' — rendimiento' : ' yield'),
        'url': url, 'inLanguage': locale === 'es' ? 'es-US' : 'en-US',
        'isPartOf': { '@id': 'https://muntin.digital/#website' }, 'publisher': { '@id': 'https://muntin.digital/#business' } },
      { '@type': 'QAPage', 'mainEntity': { '@type': 'Question', 'name': q,
        'acceptedAnswer': { '@type': 'Answer', 'text': a } } },
      { '@type': 'BreadcrumbList', 'itemListElement': crumb.map((c, i) => ({ '@type': 'ListItem', 'position': i + 1, 'name': c[0], 'item': c[1] })) }
    ]
  });
}

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
<meta property="og:image" content="https://muntin.digital/brand/og/library${locale === 'es' ? '-es' : ''}.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="2400" />
<meta property="og:image:height" content="1260" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escHtml(title)}" />
<meta name="twitter:description" content="${escHtml(clampDesc(desc))}" />
<meta name="twitter:image" content="https://muntin.digital/brand/og/library${locale === 'es' ? '-es' : ''}.png" />
<link rel="icon" type="image/svg+xml" sizes="any" href="/brand/mark/mark-square-ink.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/brand/favicons/android-chrome-192x192.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/brand/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/brand/favicons/site.webmanifest" />
<script type="application/ld+json">${jsonld}</script>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/fraunces-v38-latin-500.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/inter-v20-latin-regular.woff2" crossorigin>
<style>
:root{--cream:#F6F7F8;--cream-2:#EDEEF1;--ink:#16181D;--ink-soft:#4A4F59;--teal:#2A50C8;--max:1200px;--pad-x:clamp(20px,4vw,64px)}
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
</style>
<link rel="preload" as="style" href="/assets/site-core.css?v=${SHELL_HASH.core}" onload="this.onload=null;this.rel='stylesheet'">
<link rel="preload" as="style" href="/assets/site-article.css?v=${SHELL_HASH.article}" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/assets/site-core.css?v=${SHELL_HASH.core}"><link rel="stylesheet" href="/assets/site-article.css?v=${SHELL_HASH.article}"></noscript>
<style>
.iy-hero{padding:48px 0 24px;border-bottom:1px solid var(--line)}
.iy-hero h1{font-family:var(--font-display);font-size:clamp(28px,4vw,40px);font-weight:500;line-height:1.15;color:var(--ink);margin:0 0 12px}
.iy-yield{font-family:var(--font-display);font-size:clamp(40px,8vw,64px);font-weight:600;color:var(--teal);line-height:1;margin:0 0 8px}
.iy-hero-lede{font-size:17px;line-height:1.6;color:var(--ink-soft);margin:0;max-width:720px}
.iy-body{margin:32px auto;max-width:720px;font-size:15.5px;line-height:1.7;color:var(--ink)}
.iy-body p{margin:0 0 16px}
.iy-calc{margin:8px 0 0;padding:18px 20px;background:var(--white);border:1px solid var(--line);border-radius:10px;font-variant-numeric:tabular-nums}
.iy-calc .iy-calc-line{font-size:15px;color:var(--ink);margin:0 0 6px}
.iy-calc .iy-calc-ep{font-weight:600;color:var(--ink)}
.iy-calc small{display:block;font-size:12px;color:var(--ink-soft);margin-top:6px}
.iy-cta-row{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0 0}
.iy-cta{display:inline-flex;align-items:center;gap:6px;padding:12px 22px;border-radius:999px;background:var(--ink);color:var(--cream);font-weight:600;font-size:14px;text-decoration:none}
.iy-cta:hover{background:var(--teal)}
.iy-keep{margin:28px 0 0;padding:20px 22px;border-radius:12px;background:linear-gradient(100deg,#0f3a37 0%,#1f6f6a 100%);color:#fff;}
.iy-keep h2{font-family:var(--font-display);font-size:19px;font-weight:500;color:#fff;margin:0 0 8px;line-height:1.2}
.iy-keep p{font-size:14px;line-height:1.55;color:rgba(255,255,255,0.92);margin:0 0 14px;max-width:60ch}
.iy-keep a{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;border-radius:999px;background:#fff;color:#0f3a37;font-weight:600;font-size:13.5px;text-decoration:none}
.iy-source{font-size:12.5px;color:var(--ink-soft);margin:20px 0 0}
.iy-source a{color:var(--teal);text-decoration:none;border-bottom:1px dashed currentColor}
.iy-costindex{margin:14px 0 0;padding:14px 18px;background:var(--cream-2,#EDEEF1);border:1px solid var(--line);border-left:4px solid var(--teal);border-radius:10px}
.iy-ci-head{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--teal);margin:0 0 6px}
.iy-ci-badge{font-weight:600;text-transform:none;letter-spacing:0;font-size:12px;color:var(--ink-soft);margin-left:8px}
.iy-ci-line{font-size:14.5px;line-height:1.55;color:var(--ink);margin:0}
.iy-ci-why{font-size:13px;line-height:1.5;color:var(--ink-soft);margin:5px 0 0}
.iy-ci-spread{font-size:13px;line-height:1.5;color:var(--ink-soft);margin:4px 0 0}
.iy-ci-pctl{font-size:13px;line-height:1.5;color:var(--ink-soft);margin:4px 0 0}
.iy-ci-verdict{font-size:14px;line-height:1.5;color:var(--ink);margin:7px 0 0;padding:7px 11px;border-radius:6px;background:var(--surface-2,#f5f3ef);border-left:3px solid var(--stone)}
.iy-ci-reprice{border-left-color:var(--rust)}
.iy-ci-hold{border-left-color:var(--teal)}
.iy-ci-src{margin-top:8px;font-size:12.5px}
.iy-ci-src summary{cursor:pointer;color:var(--ink-soft);font-weight:600}
.iy-ci-src div{margin-top:6px;color:var(--ink-soft);line-height:1.5}
.iy-related{font-size:13px;color:var(--ink-soft);margin:18px 0 0}
.iy-related-label{display:inline-block;font-weight:700;text-transform:uppercase;letter-spacing:.04em;font-size:11px;margin-right:8px}
.iy-related a{color:var(--teal);text-decoration:none;border-bottom:1px dashed currentColor}
.iy-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));margin:28px 0}
.iy-card{padding:16px 18px;background:var(--white);border:1px solid var(--line);border-radius:10px}
.iy-card a{font-family:var(--font-display);font-size:17px;color:var(--ink);text-decoration:none}
.iy-card a:hover{color:var(--teal)}
.iy-card-y{display:block;font-size:13px;color:var(--teal);font-weight:600;margin-top:4px}
.iy-cat-h{font-family:var(--font-display);font-size:15px;color:var(--ink-soft);margin:28px 0 0;text-transform:uppercase;letter-spacing:.04em;font-weight:600}
.breadcrumb{font-size:13px;color:var(--ink-soft);margin:24px 0 0}
.breadcrumb a{color:var(--ink-soft);text-decoration:none;border-bottom:1px dashed currentColor}
.breadcrumb a:hover{color:var(--teal)}
${extraCss || ''}
</style>
</head>
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
<script src="/assets/site.js?v=20260430-cohesion" defer></script>
</body>
</html>
`;

function emitIngredientPage(ing, locale) {
  const lang = locale === 'es' ? 'es' : 'en';
  const base = locale === 'es' ? '/es' : '';
  const name = locale === 'es' ? ing.es : ing.en;
  const cat = CATEGORIES[ing.cat];
  const catLabel = locale === 'es' ? cat.es : cat.en;
  const guide = locale === 'es' ? cat.guide_es : cat.guide_en;
  const pct = Math.round(ing.yield * 100);
  const lossPct = 100 - pct;
  const unit = locale === 'es' ? ing.unit_es : ing.unit_en;
  const ep = ing.apCents / ing.yield;
  const canonEn = `https://muntin.digital/library/ingredient-yields/${ing.slug}/`;
  const canonEs = `https://muntin.digital/es/library/ingredient-yields/${ing.slug}/`;

  const title = locale === 'es'
    ? `Rendimiento de ${name.toLowerCase()}: ${pct}% | Muntin Digital`
    : `${name} yield: ${pct}% | Muntin Digital`;
  const desc = locale === 'es'
    ? `${name} rinde ${pct}% de porción comestible. Qué significa para tu costo por platillo, con la cuenta AP→EP clara. Tablas CIA.`
    : `${name} yields ${pct}% edible portion. What that means for your plate cost, with the AP→EP math made plain. CIA yield tables.`;

  const lede = locale === 'es'
    ? `Compras ${name.toLowerCase()} por su peso entero, pero solo emplatas el ${pct}%. Ese ${lossPct}% de merma es costo real que no aparece en la factura — aquí está la cuenta.`
    : `You buy ${name.toLowerCase()} by its whole weight, but you only plate ${pct}% of it. That ${lossPct}% loss is real cost the invoice never shows — here's the math.`;

  const body = locale === 'es'
    ? `<p><strong>Rendimiento (yield)</strong> es la fracción de un ingrediente que de verdad llega al plato después de limpiar, pelar y recortar. Lo que pagas es el precio <em>AP</em> (as-purchased, como se compra); lo que cuesta en el plato es el precio <em>EP</em> (edible portion, porción comestible).</p>
<p>${guide}</p>
<div class="iy-calc">
  <p class="iy-calc-line">Digamos que tu factura muestra <strong>${money(ing.apCents)}</strong> por ${unit} de ${name.toLowerCase()} (precio AP, de ejemplo).</p>
  <p class="iy-calc-line">Con ${pct}% de rendimiento, tu costo real es <span class="iy-calc-ep">${money(ep)} por ${unit} EP</span> &mdash; porque ${money(ing.apCents)} ÷ ${ing.yield.toFixed(2)} = ${money(ep)}.</p>
  <small>Precio AP ilustrativo; el EP se calcula (AP ÷ rendimiento). Usa tu factura real abajo.</small>
</div>`
    : `<p><strong>Yield</strong> is the fraction of an ingredient that actually reaches the plate after you clean, peel, and trim it. What you pay is the <em>AP</em> (as-purchased) price; what it costs on the plate is the <em>EP</em> (edible-portion) price.</p>
<p>${guide}</p>
<div class="iy-calc">
  <p class="iy-calc-line">Say your invoice shows <strong>${money(ing.apCents)}</strong> per ${unit} of ${name.toLowerCase()} (an example AP price).</p>
  <p class="iy-calc-line">At ${pct}% yield, your real cost is <span class="iy-calc-ep">${money(ep)} per ${unit} EP</span> &mdash; because ${money(ing.apCents)} ÷ ${ing.yield.toFixed(2)} = ${money(ep)}.</p>
  <small>AP price is illustrative; the EP figure is computed (AP ÷ yield). Use your real invoice price below.</small>
</div>`;

  const calcCta = locale === 'es' ? 'Costéalo en la calculadora' : 'Cost it in the calculator';
  const keepH = locale === 'es' ? 'Mantén este costo al día' : 'Keep this cost live';
  const keepP = locale === 'es'
    ? `Cuando el precio de ${name.toLowerCase()} cambia, cada platillo que lo usa cambia con él. Muntin Ledger lee tus facturas reales, recostea esos platillos solo, y te avisa el día que el precio se mueve.`
    : `When the price of ${name.toLowerCase()} moves, every dish that uses it moves with it. Muntin Ledger reads your real invoices, recosts those dishes automatically, and tells you the day the price changes.`;
  const keepCta = locale === 'es' ? 'Conoce Muntin Ledger →' : 'See Muntin Ledger →';
  const srcLabel = locale === 'es' ? 'Fuente' : 'Sourced';
  const srcTxt = locale === 'es'
    ? `tablas de rendimiento estándar del CIA, vía la <a href="${base}/tools/plate-cost/">Calculadora de Costo por Platillo</a> · <a href="${base}/glossary/yield-percent/">qué es el rendimiento</a> · <a href="${base}/glossary/edible-portion/">porción comestible</a>`
    : `CIA Standard Yield Tables, via the <a href="${base}/tools/plate-cost/">Plate Cost Calculator</a> · <a href="${base}/glossary/yield-percent/">what yield means</a> · <a href="${base}/glossary/edible-portion/">edible portion</a>`;
  const bcHome = locale === 'es' ? 'Inicio' : 'Home';
  const bcLib = locale === 'es' ? 'Biblioteca' : 'Library';
  const bcHub = locale === 'es' ? 'Rendimiento de ingredientes' : 'Ingredient yields';

  return pageHead({ lang, locale, title, desc, canonEn, canonEs, jsonld: emitJsonLd(ing, locale) }) + `
  <p class="breadcrumb">
    <a href="${base}/">${bcHome}</a> ›
    <a href="${base}/library/">${bcLib}</a> ›
    <a href="${base}/library/ingredient-yields/">${bcHub}</a> ›
    ${escHtml(name)}
  </p>
  <section class="iy-hero">
    <p class="iy-yield">${pct}%</p>
    <h1>${escHtml(name)} ${locale === 'es' ? 'rinde' : 'yields'} ${pct}%</h1>
    <p class="iy-hero-lede">${escHtml(lede)}</p>
  </section>
  <section class="iy-body">
    ${body}${costIndexBlock(ing.slug, locale)}
    <div class="iy-cta-row">
      <a class="iy-cta" href="${base}/tools/plate-cost/">${calcCta} <span aria-hidden="true">→</span></a>
    </div>
    <aside class="iy-keep" aria-labelledby="iyKeepH-${ing.slug}">
      <h2 id="iyKeepH-${ing.slug}">${keepH}</h2>
      <p>${escHtml(keepP)}</p>
      <a class="plausible-event-name=Ledger+Route+Click plausible-event-source=ingredient-yield" href="https://ledger.muntin.digital/">${keepCta}</a>
    </aside>
    <p class="iy-source"><strong>${srcLabel}:</strong> ${srcTxt}</p>
    ${relatedInCategory(ing, locale)}
  </section>` + pageTail;
}

function emitHubPage(locale) {
  const lang = locale === 'es' ? 'es' : 'en';
  const base = locale === 'es' ? '/es' : '';
  const canonEn = 'https://muntin.digital/library/ingredient-yields/';
  const canonEs = 'https://muntin.digital/es/library/ingredient-yields/';
  const title = locale === 'es' ? 'Rendimiento de ingredientes | Muntin Digital' : 'Ingredient yields | Muntin Digital';
  const desc = locale === 'es'
    ? 'El rendimiento (porción comestible) de ingredientes comunes de restaurante, con la cuenta AP→EP y la merma que la factura esconde. Tablas CIA.'
    : 'The yield — edible portion — of common restaurant ingredients, with the AP→EP math and the loss your invoice hides. CIA yield tables.';
  const heroH1 = locale === 'es' ? 'Rendimiento de ingredientes' : 'Ingredient yields';
  const heroLede = locale === 'es'
    ? 'Lo que compras no es lo que emplatas. Estas páginas muestran cuánto de cada ingrediente sobrevive a la limpieza y el recorte — y qué le hace a tu costo por platillo.'
    : 'What you buy is not what you plate. These pages show how much of each ingredient survives cleaning and trim — and what that does to your plate cost.';
  const cats = {};
  INGREDIENTS.forEach(i => { (cats[i.cat] = cats[i.cat] || []).push(i); });
  const sections = Object.keys(cats).map(catKey => {
    const c = CATEGORIES[catKey];
    const cards = cats[catKey].map(i => {
      const nm = locale === 'es' ? i.es : i.en;
      return `<div class="iy-card"><a href="${base}/library/ingredient-yields/${i.slug}/">${escHtml(nm)}</a><span class="iy-card-y">${Math.round(i.yield*100)}% ${locale === 'es' ? 'rendimiento' : 'yield'}</span></div>`;
    }).join('');
    return `<h2 class="iy-cat-h">${escHtml(locale === 'es' ? c.es : c.en)}</h2><div class="iy-grid">${cards}</div>`;
  }).join('\n');
  const items = INGREDIENTS.map((i, idx) => ({
    '@type': 'ListItem', 'position': idx + 1,
    'item': { '@type': 'WebPage', 'name': (locale === 'es' ? i.es : i.en), 'url': (locale === 'es' ? canonEs : canonEn) + i.slug + '/' }
  }));
  const baseUrl = locale === 'es' ? canonEs : canonEn;
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': baseUrl + '#webpage', 'name': heroH1, 'description': heroLede, 'url': baseUrl,
        'inLanguage': locale === 'es' ? 'es-US' : 'en-US', 'isPartOf': { '@id': 'https://muntin.digital/#website' }, 'publisher': { '@id': 'https://muntin.digital/#business' } },
      { '@type': 'ItemList', 'numberOfItems': items.length, 'itemListElement': items },
      { '@type': 'BreadcrumbList', 'itemListElement': [
        ['Home','https://muntin.digital/'],['Library','https://muntin.digital/library/'],[heroH1, baseUrl]
      ].map((c, i) => ({ '@type': 'ListItem', 'position': i + 1, 'name': (locale === 'es' && i < 2 ? ['Inicio','Biblioteca'][i] : c[0]), 'item': c[1] })) }
    ]
  });
  const bcHome = locale === 'es' ? 'Inicio' : 'Home';
  const bcLib = locale === 'es' ? 'Biblioteca' : 'Library';
  return pageHead({ lang, locale, title, desc, canonEn, canonEs, jsonld }) + `
  <p class="breadcrumb">
    <a href="${base}/">${bcHome}</a> ›
    <a href="${base}/library/">${bcLib}</a> ›
    ${escHtml(heroH1)}
  </p>
  <section class="iy-hero">
    <h1>${escHtml(heroH1)}</h1>
    <p class="iy-hero-lede">${escHtml(heroLede)}</p>
  </section>
  <section class="iy-body">
    ${sections}
    <p class="iy-source"><strong>${locale === 'es' ? 'Fuente' : 'Sourced'}:</strong> ${locale === 'es'
      ? `tablas de rendimiento estándar del CIA, vía la <a href="${base}/tools/plate-cost/">Calculadora de Costo por Platillo</a>`
      : `CIA Standard Yield Tables, via the <a href="${base}/tools/plate-cost/">Plate Cost Calculator</a>`}</p>
  </section>` + pageTail;
}

// ---- Write or check ------------------------------------------------
const targets = [];
for (const ing of INGREDIENTS) {
  targets.push({ path: `library/ingredient-yields/${ing.slug}/index.html`, content: emitIngredientPage(ing, 'en') });
  targets.push({ path: `es/library/ingredient-yields/${ing.slug}/index.html`, content: emitIngredientPage(ing, 'es') });
}
targets.push({ path: 'library/ingredient-yields/index.html', content: emitHubPage('en') });
targets.push({ path: 'es/library/ingredient-yields/index.html', content: emitHubPage('es') });

let drift = 0;
for (const tgt of targets) {
  const fullPath = path.join(repoRoot, tgt.path);
  if (checkMode) {
    const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : null;
    if (existing == null || normalizeBatchBanner(existing) !== normalizeBatchBanner(tgt.content)) {
      drift++; console.log(`would update ${tgt.path}`);
    }
  } else {
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, tgt.content);
  }
}
if (checkMode) {
  console.log(`Ingredient-yield pages: ${drift} file(s) would change of ${targets.length}.`);
  process.exit(drift > 0 ? 1 : 0);
} else {
  console.log(`Ingredient-yield pages: wrote ${targets.length} file(s).`);
}
