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
 * parity. New ingredients: add a row to data/ingredient-yields.json
 * (slug, en, es, yield, yield_key→YIELD_TABLE | yield_source, cat,
 * unit_en, unit_es, apCents) — validated by scripts/check-ingredient-yields.mjs
 * — plus a CATEGORIES entry here if it's a new bucket. The slug is a
 * non-article collection in scripts/lib/library-skips.mjs.
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
// Same shippable bar the dashboard seed uses — so we only deep-link to a Cost
// Pulse card that actually exists (below-bar reads render on the page but aren't
// on the dashboard, so linking them would be a dead anchor).
const COST_CONF = createRequire(import.meta.url)(path.join(repoRoot, 'tools/_shared/cost-confidence.js'));
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
const CI_BOUNDS = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index-bounds.json'), 'utf8')).bounds || {}; }
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
  const lvl = point.level;
  // NOAA import unit value runs ~half of true delivered wholesale, so it must NOT
  // render as a dollar LEVEL or an edible-unit cost — only a trend/direction. Detect
  // it from provenance and force the read directional (suppresses level, EP, percentile).
  const isImportValue = !!(lvl && Array.isArray(lvl.provenance) && lvl.provenance.some((p) => p.type === 'noaa-trade'));
  // A 6x+ wide band (a grade/market min–max collapsed into one range) can't honestly
  // read 'medium' — cap it at 'low'. (The engine now narrows these on the next refetch.)
  const _rc0 = lvl && Array.isArray(lvl.rangeCents) ? lvl.rangeCents : null;
  const wideBand = !!(_rc0 && _rc0[0] > 0 && _rc0[1] / _rc0[0] > 6);
  const conf = isImportValue ? 'directional'
    : (wideBand && (point.confidence === 'medium' || point.confidence === 'high') ? 'low' : (point.confidence || 'low'));
  const confWord = es ? ({ high: 'alta', medium: 'media', low: 'baja', directional: 'direccional' }[conf] || conf) : conf;
  const basis = (lvl && lvl.basis) || 'wholesale';
  // Show the price unit (produce is $/carton or $/sack, proteins $/lb). The level
  // doesn't carry a unit, so fall back to the bounds unit and localize it — an
  // unlabeled "$32–$105" reads as $/head, which it isn't.
  const U_ES = { lb: 'libra', carton: 'caja', sack: 'saco', each: 'pieza', head: 'pieza', bunch: 'manojo', crate: 'caja', lug: 'caja', flat: 'caja', ear: 'pieza', dozen: 'docena', cwt: 'quintal', count: 'pieza' };
  const ciUnitRaw = (lvl && lvl.unit) || (CI_BOUNDS[slug] || {}).unit;
  const ciUnit = ciUnitRaw ? (es ? (U_ES[ciUnitRaw] || ciUnitRaw) : ciUnitRaw) : '';
  const unitSfx = ciUnit ? '/' + ciUnit : '';
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
  // Collapse the per-market terminal slugs (usda-ams-atlanta, …) to one clean label —
  // raw engineering slugs in the user-facing Sources drawer read as a scraper hack.
  const srcLabel = (s) => typeof s === 'string'
    ? (s.indexOf('usda-ams') === 0 ? 'USDA AMS' : s.indexOf('usda-lmr') === 0 ? 'USDA LMR' : (CI_SOURCE_LABELS[s] || s))
    : s;
  const sources = [...new Set((point.provenance || []).map((p) => srcLabel(p.source)).filter(Boolean))];
  const asOf = point.asOf || '—';
  const head = es ? 'Lectura de mercado' : 'Market read';
  // Import-value seafood: no dollar level — a directional caveat + the trend only.
  const importCaveat = es
    ? 'Índice de valor de importación — solo dirección; el valor de importación de NOAA va por debajo del precio mayorista entregado.'
    : 'Trade-value index — directional only; the NOAA import value runs below delivered wholesale.';
  const pctTxt = (typeof tr.pct === 'number') ? `${(tr.pct >= 0 ? '+' : '')}${(tr.pct * 100).toFixed(1).replace(/\.0$/, '')}%` : '';
  const trendSentence = pctTxt ? (es ? ` El mercado va ${dirWord} ${pctTxt} en la ventana reciente.` : ` The market is ${dirWord} ${pctTxt} over the recent window.`) : '';
  const line = isImportValue
    ? `${importCaveat}${trendSentence}`
    : (es ? `Alrededor de ${range}${trendStr} en la ventana reciente.` : `About ${range}${trendStr} over the recent window.`);
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
  const today = (!isImportValue && lvl && typeof lvl.medianCents === 'number') ? lvl.medianCents : null;
  // Suppress the percentile when it would CONTRADICT the trend (e.g. "near the top"
  // while the trend is down) — that reads as a bug and erodes trust. Show it only
  // when the rank and the direction agree.
  let pctl = '';
  if (conf !== 'directional' && today != null && hist.length) {
    const rank = hist.filter((v) => v < today).length / hist.length;   // 0..1, higher = nearer the top
    const contradicts = (tr.dir === 'down' && rank > 0.7) || (tr.dir === 'up' && rank < 0.3);
    if (!contradicts) pctl = FMT.percentileLine([...hist, today]);
  }
  const pctlHtml = pctl ? `\n  <p class="iy-ci-pctl">${pctl}</p>` : '';
  // Live edible-unit cost: the number an operator repeats. ONLY when the live
  // price unit matches the yield unit (both 'lb', etc.) — never divide a $/carton
  // price by a per-head yield (the unit-mismatch trap). Both inputs are sourced
  // (the price via provenance, the yield cited on the page), so the result is a
  // shown calculation, not a new claim.
  const ing = INGREDIENTS.find((i) => i.slug === slug);
  const bUnit = (CI_BOUNDS[slug] || {}).unit;
  let epHtml = '';
  if (ing && ing.yield > 0 && bUnit && bUnit === ing.unit_en && today != null) {
    const u = es ? (ing.unit_es || bUnit) : bUnit;
    const pctY = Math.round(ing.yield * 100);
    const ep = money(Math.round(today / ing.yield));
    epHtml = es
      ? `\n  <p class="iy-ci-ep">Al precio de hoy (~${money(today)}/${u}) y el ${pctY}% de rendimiento, tu ${u} comestible cuesta unos <strong>${ep}</strong>.</p>`
      : `\n  <p class="iy-ci-ep">At today's reference (~${money(today)}/${u}) and the ${pctY}% yield, your edible ${u} runs about <strong>${ep}</strong>.</p>`;
  }
  // Operator price check (P0 — the keyless distributor tie): one private "your price"
  // input compared against the public wholesale reference, computed live in the page.
  // No fetch, no storage — the number never leaves the browser, honoring the Cost
  // Pulse privacy promise. Honest framing: the reference is WHOLESALE, and an
  // operator's delivered price normally sits above it, so being over the reference is
  // expected; being well under it is the notable read. Shown only for a real wholesale
  // dollar level with a unit (never retail / index / import-value / directional).
  let pcHtml = '';
  if (!isImportValue && basis === 'wholesale' && conf !== 'directional' && today != null && ciUnit) {
    const refDollars = (today / 100).toFixed(2);
    const tpl = es ? {
      empty: 'Ingresa tu precio para compararlo con esta referencia mayorista pública.',
      even: 'Está casi a la par con la referencia mayorista pública. La referencia es mayorista — tu precio entregado suele ser algo más alto.',
      above: 'Está alrededor de {pct}% por encima de la referencia mayorista pública. El entregado normalmente va por encima del mayorista, así que algo de diferencia es de esperar; una grande amerita hablar con tu proveedor.',
      below: 'Está alrededor de {pct}% por debajo de la referencia mayorista pública — un buen número (la referencia ya está por debajo del entregado). Conviene confirmar que sea el mismo grado y empaque.'
    } : {
      empty: 'Enter your price to compare it against this public wholesale reference.',
      even: "That's about even with the public wholesale reference. The reference is wholesale — your delivered price usually runs a little higher.",
      above: "That's about {pct}% above the public wholesale reference. Delivered normally runs above wholesale, so some gap is expected; a large one is worth a vendor conversation.",
      below: "That's about {pct}% below the public wholesale reference — a strong number (the reference already sits below delivered). Worth confirming it's the same grade and pack."
    };
    // Edible-portion cost from THEIR price (the most actionable number): only when
    // the price unit matches the yield unit, so we never divide a $/carton price by
    // a per-head yield. {ep} is filled live in the browser = their price ÷ the cited
    // yield — a shown calculation off two sourced inputs, not a new claim.
    const epEligible = ing && ing.yield > 0 && bUnit && bUnit === ing.unit_en;
    let epAttr = '', epOut = '';
    if (epEligible) {
      const u = es ? (ing.unit_es || bUnit) : bUnit;
      const pctY = Math.round(ing.yield * 100);
      tpl.ep = es
        ? `A ese precio y el ${pctY}% de rendimiento, tu ${u} comestible cuesta unos {ep}.`
        : `At that price and the ${pctY}% yield, your edible ${u} costs about {ep}.`;
      epAttr = ` data-yield="${ing.yield}"`;
      epOut = `\n    <p class="iy-pc-ep" aria-live="polite"></p>`;
    }
    const lbl = es ? 'Tu precio (opcional)' : 'Your price (optional)';
    pcHtml = `
  <div class="iy-pricecheck" data-ref="${today}"${epAttr} data-tpls="${escHtml(JSON.stringify(tpl))}">
    <label class="iy-pc-label" for="iy-yp-${slug}">${lbl}</label>
    <div class="iy-pc-row">
      <span class="iy-pc-cur" aria-hidden="true">$</span>
      <input class="iy-pc-input" id="iy-yp-${slug}" type="number" inputmode="decimal" min="0" step="0.01" placeholder="${refDollars}" autocomplete="off" />
      <span class="iy-pc-unit">/ ${ciUnit}</span>
    </div>
    <p class="iy-pc-out" aria-live="polite">${tpl.empty}</p>${epOut}
  </div>`;
  }
  // Two-way wiring: deep-link to the live dashboard card — but only when this read
  // clears the shippable bar (so it actually has a #ci-<slug> anchor over there).
  let dashHtml = '';
  if (COST_CONF.isShippable(point)) {
    const dashTxt = es ? 'Ver la lectura completa en el panel' : 'See the full market read';
    dashHtml = `\n  <p class="iy-ci-more"><a href="${es ? '/es' : ''}/tools/cost-pulse/#ci-${slug}">${dashTxt} <span aria-hidden="true">→</span></a></p>`;
  }
  return `
<div class="iy-costindex">
  <p class="iy-ci-head">${head}<span class="iy-ci-badge">${badge}</span></p>
  <p class="iy-ci-line">${line}</p>${epHtml}${pctlHtml}${spreadHtml}${verdictHtml}${pcHtml}
  <p class="iy-ci-why">${why}</p>
  <details class="iy-ci-src"><summary>${srcSummary}</summary><div>${srcBody}</div></details>${dashHtml}
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
const INGREDIENTS = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/ingredient-yields.json'), 'utf8'));

const RELATED_CAP = 8;   // cap the sibling rail so a large category can't spray 30+ links (link-farm/doorway guard)
function relatedInCategory(ing, locale) {
  const all = INGREDIENTS.filter(x => x.cat === ing.cat && x.slug !== ing.slug);
  if (!all.length) return '';
  const base = locale === 'es' ? '/es' : '';
  // Nearest-by-yield first, so the shown siblings are the most comparable ones.
  const sibs = all.slice().sort((a, b) => Math.abs(a.yield - ing.yield) - Math.abs(b.yield - ing.yield)).slice(0, RELATED_CAP);
  const links = sibs.map(s =>
    `<a href="${base}/library/ingredient-yields/${s.slug}/">${escHtml(locale === 'es' ? s.es : s.en)}</a>`
  ).join(' · ');
  const more = all.length > RELATED_CAP
    ? ` · <a class="iy-related-all" href="${base}/library/ingredient-yields/">${locale === 'es' ? `ver las ${all.length + 1} →` : `see all ${all.length + 1} →`}</a>`
    : '';
  const label = locale === 'es' ? 'Misma categoría' : 'Same category';
  return `<p class="iy-related"><span class="iy-related-label">${label}</span>${links}${more}</p>`;
}

// Shared FAQ source of truth — the VISIBLE faqBlock and the FAQPage JSON-LD both
// render from this, so the structured data can never drift from the on-page text
// (the visible-must-match discipline AEO rewards). Every answer is SOURCED (the
// CIA yield) or DERIVED (lossPct, the AP÷yield method) — and carries NO dollar
// figure, because JSON-LD answer text is lifted verbatim by answer engines and an
// illustrative price must never be laundered into a claim.
function faqItems(ing, locale) {
  const es = locale === 'es';
  const name = es ? ing.es : ing.en;
  const nlow = name.toLowerCase();
  const pct = Math.round(ing.yield * 100);
  const lossPct = 100 - pct;
  const dy = ing.yield.toFixed(2);
  return es ? [
    { q: `¿Cuál es el rendimiento de ${nlow}?`,
      a: `El rendimiento típico de ${nlow} es ${pct}% (porción comestible sobre el peso comprado), según las tablas de rendimiento estándar del CIA.` },
    { q: `¿Cuánto se pierde al limpiar ${nlow}?`,
      a: `Alrededor del ${lossPct}% del peso comprado se pierde al limpiar, pelar y recortar antes de emplatar.` },
    { q: `¿Cómo se calcula el costo de porción comestible de ${nlow}?`,
      a: `Divide el precio de compra entre el rendimiento: costo EP = precio AP ÷ ${dy}. Con ${pct}% de rendimiento, la merma hace que tu costo real en el plato sea bastante mayor que el precio de la factura.` },
  ] : [
    { q: `What is the yield of ${nlow}?`,
      a: `${name} typically yields ${pct}% edible portion of its as-purchased weight, per the CIA Standard Yield Tables.` },
    { q: `How much ${nlow} is lost to trim?`,
      a: `About ${lossPct}% of the as-purchased weight is lost to cleaning, peeling, and trimming before it reaches the plate.` },
    { q: `How do you calculate the edible-portion cost of ${nlow}?`,
      a: `Divide the as-purchased price by the yield: EP cost = AP price ÷ ${dy}. At ${pct}% yield, the trim makes your real plated cost meaningfully higher than the invoice price.` },
  ];
}

// The one liftable table (sourced rows, NO price column — a price column would
// read as a claim) + the visible FAQ that mirrors the FAQPage JSON-LD.
function faqBlock(ing, locale) {
  const es = locale === 'es';
  const pct = Math.round(ing.yield * 100);
  const lossPct = 100 - pct;
  const items = faqItems(ing, locale);
  const tblH = es ? 'Desglose del rendimiento' : 'Yield breakdown';
  const faqH = es ? 'Preguntas frecuentes' : 'Common questions';
  const rAP = es ? 'Comprado (AP)' : 'As-purchased (AP)';
  const rEP = es ? 'Porción comestible (EP)' : 'Edible portion (EP)';
  const rLoss = es ? 'Merma al recortar' : 'Lost to trim';
  const cap = es ? 'Fuente: tablas de rendimiento estándar del CIA.' : 'Source: CIA Standard Yield Tables.';
  return `
    <h2 class="iy-h2">${tblH}</h2>
    <div class="table-scroll">
      <table class="iy-breakdown">
        <tbody>
          <tr><th scope="row">${rAP}</th><td>100%</td></tr>
          <tr><th scope="row">${rEP}</th><td>${pct}%</td></tr>
          <tr><th scope="row">${rLoss}</th><td>${lossPct}%</td></tr>
        </tbody>
      </table>
    </div>
    <p class="iy-breakdown-src">${cap}</p>
    <h2 class="iy-h2">${faqH}</h2>
    <div class="iy-faq">
      ${items.map((it) => `<details class="iy-faq-item"><summary>${escHtml(it.q)}</summary><p>${escHtml(it.a)}</p></details>`).join('\n      ')}
    </div>`;
}

function emitJsonLd(ing, locale) {
  const base = locale === 'es' ? '/es' : '';
  const url = `https://muntin.digital${base}/library/ingredient-yields/${ing.slug}/`;
  const name = locale === 'es' ? ing.es : ing.en;
  const nlow = name.toLowerCase();
  const es = locale === 'es';
  const pct = Math.round(ing.yield * 100);
  const dy = ing.yield.toFixed(2);
  const unit = es ? ing.unit_es : ing.unit_en;
  const items = faqItems(ing, locale);   // identical to the visible faqBlock
  // HowTo for the AP→EP method — procedure only, NO dollar figures (the worked
  // dollar example lives in the visible, illustrative-labeled iy-calc block).
  const howSteps = es ? [
    `Toma el precio de compra (AP) por ${unit} de tu factura.`,
    `Busca el rendimiento: ${nlow} rinde ${pct}% (tablas de rendimiento estándar del CIA).`,
    `Divide: costo de porción comestible = precio AP ÷ ${dy}. El resultado es tu costo real en el plato por ${unit}.`,
  ] : [
    `Take the as-purchased (AP) price per ${unit} from your invoice.`,
    `Look up the yield: ${nlow} yields ${pct}% (CIA Standard Yield Tables).`,
    `Divide: edible-portion cost = AP price ÷ ${dy}. The result is your true plated cost per ${unit}.`,
  ];
  const catLabel = locale === 'es' ? CATEGORIES[ing.cat].es : CATEGORIES[ing.cat].en;
  const catUrl = `https://muntin.digital${base}/library/ingredient-yields/${ing.cat}/`;
  const crumb = locale === 'es'
    ? [['Inicio','https://muntin.digital/es/'],['Biblioteca','https://muntin.digital/es/library/'],['Rendimiento de ingredientes','https://muntin.digital/es/library/ingredient-yields/'],[catLabel,catUrl],[name,url]]
    : [['Home','https://muntin.digital/'],['Library','https://muntin.digital/library/'],['Ingredient yields','https://muntin.digital/library/ingredient-yields/'],[catLabel,catUrl],[name,url]];
  // The ingredient as a disambiguated ENTITY (DefinedTerm) so search + LLMs resolve
  // "ribeye" / its variants to this canonical page. Description is DERIVED from the
  // sourced yield — no new claim, no dollar figure. alternateName/sameAs are
  // deliberately omitted until a gated alias/QID source exists (a wrong one corrupts
  // the graph). mainEntity binds the page to the entity.
  const termDesc = es
    ? `${name} rinde ${pct}% de porción comestible sobre su peso comprado (tablas de rendimiento estándar del CIA).`
    : `${name} yields ${pct}% edible portion of its as-purchased weight (CIA Standard Yield Tables).`;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': url + '#webpage', 'name': name + (locale === 'es' ? ' — rendimiento' : ' yield'),
        'url': url, 'inLanguage': locale === 'es' ? 'es-US' : 'en-US', 'mainEntity': { '@id': url + '#term' },
        'isPartOf': { '@id': 'https://muntin.digital/#website' }, 'publisher': { '@id': 'https://muntin.digital/#business' } },
      { '@type': 'DefinedTerm', '@id': url + '#term', 'name': name, 'description': termDesc,
        'inDefinedTermSet': { '@id': `https://muntin.digital${base}/library/ingredient-yields/#termset` } },
      { '@type': 'FAQPage', 'mainEntity': items.map((it) => ({ '@type': 'Question', 'name': it.q,
        'acceptedAnswer': { '@type': 'Answer', 'text': it.a } })) },
      { '@type': 'HowTo', 'name': es ? `Cómo calcular el costo de porción comestible de ${nlow}` : `How to calculate the edible-portion cost of ${nlow}`,
        'step': howSteps.map((t, i) => ({ '@type': 'HowToStep', 'position': i + 1, 'text': t })) },
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
.iy-h2{font-size:19px;line-height:1.3;margin:26px 0 10px}
.iy-breakdown{border-collapse:collapse;width:100%;max-width:340px;font-size:15px}
.iy-breakdown th,.iy-breakdown td{text-align:left;padding:9px 14px;border-bottom:1px solid var(--line)}
.iy-breakdown th{font-weight:500;color:var(--ink-soft)}
.iy-breakdown td{font-weight:600;text-align:right}
.iy-breakdown-src{font-size:12px;color:var(--ink-soft);margin:6px 0 0}
.iy-cat-table{border-collapse:collapse;width:100%;font-size:15px}
.iy-cat-table th,.iy-cat-table td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--line)}
.iy-cat-table thead th{font-size:12.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-soft);font-weight:600}
.iy-cat-table tbody th{font-weight:500}
.iy-cat-table tbody td{text-align:right;font-weight:600;font-variant-numeric:tabular-nums}
.iy-cat-table a{color:var(--teal);text-decoration:none}
.iy-faq{margin:4px 0 0}
.iy-faq-item{border-bottom:1px solid var(--line);padding:2px 0}
.iy-faq-item summary{cursor:pointer;font-weight:600;font-size:15px;padding:11px 0;list-style:none}
.iy-faq-item summary::-webkit-details-marker{display:none}
.iy-faq-item summary::after{content:"+";float:right;color:var(--ink-soft);font-weight:400}
.iy-faq-item[open] summary::after{content:"−"}
.iy-faq-item p{font-size:14.5px;line-height:1.55;color:var(--ink);margin:0 0 12px}
.iy-costindex{margin:14px 0 0;padding:14px 18px;background:var(--cream-2,#EDEEF1);border:1px solid var(--line);border-left:4px solid var(--teal);border-radius:10px}
.iy-ci-head{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--teal);margin:0 0 6px}
.iy-ci-badge{font-weight:600;text-transform:none;letter-spacing:0;font-size:12px;color:var(--ink-soft);margin-left:8px}
.iy-ci-line{font-size:14.5px;line-height:1.55;color:var(--ink);margin:0}
.iy-ci-why{font-size:13px;line-height:1.5;color:var(--ink-soft);margin:5px 0 0}
.iy-ci-ep{font-size:14px;line-height:1.5;color:var(--ink);margin:5px 0 0}
.iy-ci-more{font-size:13.5px;margin:9px 0 0}
.iy-ci-more a{color:var(--teal);font-weight:600;text-decoration:none}
.iy-ci-spread{font-size:13px;line-height:1.5;color:var(--ink-soft);margin:4px 0 0}
.iy-ci-pctl{font-size:13px;line-height:1.5;color:var(--ink-soft);margin:4px 0 0}
.iy-ci-verdict{font-size:14px;line-height:1.5;color:var(--ink);margin:7px 0 0;padding:7px 11px;border-radius:6px;background:var(--surface-2,#f5f3ef);border-left:3px solid var(--stone)}
.iy-ci-reprice{border-left-color:var(--rust)}
.iy-ci-hold{border-left-color:var(--teal)}
.iy-ci-watch{border-left-color:var(--gold,#C99A2E)}
.iy-ci-src{margin-top:8px;font-size:12.5px}
.iy-ci-src summary{cursor:pointer;color:var(--ink-soft);font-weight:600}
.iy-ci-src div{margin-top:6px;color:var(--ink-soft);line-height:1.5}
.iy-pricecheck{margin:9px 0 0;padding:9px 11px;border-radius:6px;background:var(--surface-2,#f5f3ef);border:1px solid var(--hairline,#e6e1d8)}
.iy-pc-label{display:block;font-size:12px;font-weight:600;color:var(--ink-soft);margin:0 0 5px}
.iy-pc-row{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.iy-pc-cur{font-size:14px;color:var(--ink-soft)}
.iy-pc-input{width:96px;font-size:14px;padding:5px 7px;border:1px solid var(--stone,#cfc8bb);border-radius:5px;background:#fff;color:var(--ink)}
.iy-pc-unit{font-size:13px;color:var(--ink-soft)}
.iy-pc-out{font-size:13px;line-height:1.5;color:var(--ink);margin:6px 0 0}
.iy-pc-ep{font-size:13.5px;line-height:1.5;color:var(--ink);font-weight:600;margin:4px 0 0}
.iy-pc-ep:empty{margin:0}
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
<script src="/assets/site.js?v=20260717-reassure" defer></script>
<script>
/* Operator price check — pure in-memory compare against the public wholesale
 * reference. No fetch, no localStorage: the typed price never leaves the page. */
(function(){
  var boxes = document.querySelectorAll('.iy-pricecheck');
  if (!boxes.length) return;
  for (var i = 0; i < boxes.length; i++) (function(box){
    var ref = parseFloat(box.getAttribute('data-ref'));
    var out = box.querySelector('.iy-pc-out');
    var input = box.querySelector('.iy-pc-input');
    if (!(ref > 0) || !out || !input) return;
    var tpl; try { tpl = JSON.parse(box.getAttribute('data-tpls')); } catch (e) { return; }
    var yld = parseFloat(box.getAttribute('data-yield'));
    var epOut = box.querySelector('.iy-pc-ep');
    function render(){
      var v = parseFloat(input.value);
      if (!(v > 0)) { out.textContent = tpl.empty; if (epOut) epOut.textContent = ''; return; }
      var pct = (Math.round(v * 100) - ref) / ref * 100;
      var a = Math.round(Math.abs(pct));
      out.textContent = a <= 3 ? tpl.even : (pct > 0 ? tpl.above : tpl.below).replace('{pct}', a);
      // Their edible-portion cost = entered price / cited yield (a shown calculation).
      if (epOut && tpl.ep && yld > 0) epOut.textContent = tpl.ep.replace('{ep}', '$' + (v / yld).toFixed(2));
    }
    input.addEventListener('input', render);
  })(boxes[i]);
})();
</script>
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
    <a href="${base}/library/ingredient-yields/${ing.cat}/">${escHtml(catLabel)}</a> ›
    ${escHtml(name)}
  </p>
  <section class="iy-hero">
    <p class="iy-yield">${pct}%</p>
    <h1>${escHtml(name)} ${locale === 'es' ? 'rinde' : 'yields'} ${pct}%</h1>
    <p class="iy-hero-lede">${escHtml(lede)}</p>
  </section>
  <section class="iy-body">
    ${body}${faqBlock(ing, locale)}${costIndexBlock(ing.slug, locale)}
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
    const catName = escHtml(locale === 'es' ? c.es : c.en);
    return `<h2 class="iy-cat-h"><a href="${base}/library/ingredient-yields/${catKey}/">${catName}</a></h2><div class="iy-grid">${cards}</div>`;
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
      // The hub is the ENTITY REGISTRY: a DefinedTermSet naming every ingredient term,
      // so an LLM lands here to enumerate all of them. And it IS a sourced dataset
      // (N ingredients × edible-portion yield) — Dataset schema makes it citable.
      { '@type': 'DefinedTermSet', '@id': baseUrl + '#termset', 'name': heroH1, 'inLanguage': locale === 'es' ? 'es-US' : 'en-US',
        'hasDefinedTerm': INGREDIENTS.map((i) => ({ '@id': (locale === 'es' ? canonEs : canonEn) + i.slug + '/#term' })) },
      { '@type': 'Dataset', '@id': baseUrl + '#dataset',
        'name': locale === 'es' ? 'Rendimiento de ingredientes de restaurante (porción comestible)' : 'Restaurant ingredient yields (edible portion)',
        'description': locale === 'es'
          ? `Rendimiento de porción comestible de ${items.length} ingredientes comunes de restaurante, según las tablas de rendimiento estándar del CIA.`
          : `Edible-portion yield for ${items.length} common restaurant ingredients, per the CIA Standard Yield Tables.`,
        'url': baseUrl, 'inLanguage': locale === 'es' ? 'es-US' : 'en-US', 'isAccessibleForFree': true,
        'creator': { '@id': 'https://muntin.digital/#business' }, 'citation': 'CIA Standard Yield Tables / USDA Food Buying Guide',
        'variableMeasured': locale === 'es' ? 'porcentaje de rendimiento de porción comestible' : 'edible-portion yield percent' },
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

// A routable category hub — the taxonomy middle tier (Library → master hub →
// category hub → leaf). Its unique content is the category guide prose + a
// ranked, sourced yield table of its members, so it carries data a leaf doesn't
// and reads as a real landing page, not a doorway.
function emitCategoryHub(catKey, locale) {
  const lang = locale === 'es' ? 'es' : 'en';
  const base = locale === 'es' ? '/es' : '';
  const c = CATEGORIES[catKey];
  const catLabel = locale === 'es' ? c.es : c.en;
  const guide = locale === 'es' ? c.guide_es : c.guide_en;
  const members = INGREDIENTS.filter((i) => i.cat === catKey).slice().sort((a, b) => b.yield - a.yield);
  const canonEn = `https://muntin.digital/library/ingredient-yields/${catKey}/`;
  const canonEs = `https://muntin.digital/es/library/ingredient-yields/${catKey}/`;
  const title = locale === 'es' ? `Rendimiento: ${catLabel.toLowerCase()} | Muntin Digital` : `${catLabel} yield chart | Muntin Digital`;
  const desc = locale === 'es'
    ? `Rendimiento (porción comestible) de ${members.length} ${catLabel.toLowerCase()} de restaurante, ordenado de mayor a menor. ${guide}`
    : `Edible-portion yield for ${members.length} restaurant ${catLabel.toLowerCase()}, ranked highest to lowest. ${guide}`;
  const heroH1 = locale === 'es' ? `Rendimiento de ${catLabel.toLowerCase()}` : `${catLabel} yields`;
  const colIng = locale === 'es' ? 'Ingrediente' : 'Ingredient';
  const colY = locale === 'es' ? 'Rendimiento' : 'Yield';
  const rows = members.map((i) => {
    const nm = locale === 'es' ? i.es : i.en;
    return `<tr><th scope="row"><a href="${base}/library/ingredient-yields/${i.slug}/">${escHtml(nm)}</a></th><td>${Math.round(i.yield * 100)}%</td></tr>`;
  }).join('\n          ');
  const baseUrl = locale === 'es' ? canonEs : canonEn;
  const hubUrl = `https://muntin.digital${base}/library/ingredient-yields/`;
  const items = members.map((i, idx) => ({
    '@type': 'ListItem', 'position': idx + 1,
    'item': { '@type': 'WebPage', 'name': (locale === 'es' ? i.es : i.en), 'url': baseUrl.replace(catKey + '/', '') + i.slug + '/' }
  }));
  const crumb = locale === 'es'
    ? [['Inicio', 'https://muntin.digital/es/'], ['Biblioteca', 'https://muntin.digital/es/library/'], ['Rendimiento de ingredientes', hubUrl], [catLabel, baseUrl]]
    : [['Home', 'https://muntin.digital/'], ['Library', 'https://muntin.digital/library/'], ['Ingredient yields', hubUrl], [catLabel, baseUrl]];
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': baseUrl + '#webpage', 'name': heroH1, 'description': clampDesc(desc, 300), 'url': baseUrl,
        'inLanguage': locale === 'es' ? 'es-US' : 'en-US', 'isPartOf': { '@id': 'https://muntin.digital/#website' }, 'publisher': { '@id': 'https://muntin.digital/#business' } },
      { '@type': 'ItemList', 'numberOfItems': items.length, 'itemListElement': items },
      { '@type': 'BreadcrumbList', 'itemListElement': crumb.map((cc, i) => ({ '@type': 'ListItem', 'position': i + 1, 'name': cc[0], 'item': cc[1] })) }
    ]
  });
  const bcHome = locale === 'es' ? 'Inicio' : 'Home';
  const bcLib = locale === 'es' ? 'Biblioteca' : 'Library';
  const bcHub = locale === 'es' ? 'Rendimiento de ingredientes' : 'Ingredient yields';
  return pageHead({ lang, locale, title, desc, canonEn, canonEs, jsonld }) + `
  <p class="breadcrumb">
    <a href="${base}/">${bcHome}</a> ›
    <a href="${base}/library/">${bcLib}</a> ›
    <a href="${base}/library/ingredient-yields/">${bcHub}</a> ›
    ${escHtml(catLabel)}
  </p>
  <section class="iy-hero">
    <h1>${escHtml(heroH1)}</h1>
    <p class="iy-hero-lede">${escHtml(guide)}</p>
  </section>
  <section class="iy-body">
    <div class="table-scroll">
      <table class="iy-cat-table">
        <thead><tr><th scope="col">${colIng}</th><th scope="col">${colY}</th></tr></thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
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
for (const catKey of Object.keys(CATEGORIES)) {
  if (!INGREDIENTS.some((i) => i.cat === catKey)) continue;   // skip empty buckets
  targets.push({ path: `library/ingredient-yields/${catKey}/index.html`, content: emitCategoryHub(catKey, 'en') });
  targets.push({ path: `es/library/ingredient-yields/${catKey}/index.html`, content: emitCategoryHub(catKey, 'es') });
}

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
