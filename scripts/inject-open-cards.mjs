#!/usr/bin/env node
/**
 * inject-open-cards.mjs — inject the three corpus explorer cards (recalls / labor / demand) into the
 * /open hub grids (spec-corpus-explorers.md §1.5a), EN + ES, via a sentinel-delimited block so the
 * hand-authored hub is never regenerated. Reconciles the "Thirteen"/"Siete" count word by COUNTING the
 * rendered cards (never a blind +3), and reads the recalls/MARTS live numbers from the artifacts.
 *
 * The ES cards point at the EN explorer pages (the ES pages are not built yet — matching how the ES
 * events card links to the EN surface). A built-in honesty guard holds: no price token, recalls'
 * no-price literals present, no pressure token.
 *
 *   node scripts/inject-open-cards.mjs [--check]
 *   node scripts/inject-open-cards.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!-- open-hub:corpus-cards:start -->';
const END = '<!-- open-hub:corpus-cards:end -->';
const rd = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));

const EN_WORD = { 13: 'Thirteen', 14: 'Fourteen', 15: 'Fifteen', 16: 'Sixteen', 17: 'Seventeen', 18: 'Eighteen', 19: 'Nineteen', 20: 'Twenty' };
const ES_WORD = { 7: 'Siete', 8: 'Ocho', 9: 'Nueve', 10: 'Diez', 11: 'Once', 12: 'Doce', 13: 'Trece', 14: 'Catorce', 15: 'Quince' };

function stats() {
  const s = rd('cost-index/food-recalls-by-ingredient.json').summary;
  const marts = rd('cost-index/marts-sales.json').count;
  return { recalls: s.recalls, ingredients: s.tagged_ingredients, classI: s.class_i_recalls, marts };
}

function enBlock(st) {
  return `${START}
      <div class="od-card" style="--accent:var(--gold)">
        <h3>Food recalls</h3>
        <p class="od-card__stat">${st.recalls} recalls · ${st.ingredients} ingredients · ${st.classI} distinct Class-I</p>
        <p class="od-card__desc">Dated FDA food recalls matched to tracked ingredients by product text — a documented record surfaced on its own, never joined to a price, never a cause.</p>
        <div class="od-card__links"><a href="/open/recalls/">Explore</a><a href="/cost-index/food-recalls.csv" download>CSV</a><a href="/cost-index/food-recalls-by-ingredient.json" download>JSON</a><span class="od-lic">CC0 · CC-BY</span></div>
      </div>
      <div class="od-card" style="--accent:var(--teal)">
        <h3>Restaurant wages (county)</h3>
        <p class="od-card__stat">Montgomery County, MD · descriptive backdrop</p>
        <p class="od-card__desc">County food-services average weekly wage and employment (BLS QCEW) — a descriptive lane, never blended into the food index, the pressure math, or the Vendor Benchmark.</p>
        <div class="od-card__links"><a href="/open/labor/">Explore</a><a href="/cost-index/qcew-wages.csv" download>CSV</a><a href="/cost-index/qcew-wages.json" download>JSON</a><span class="od-lic">CC0</span></div>
      </div>
      <div class="od-card" style="--accent:var(--season)">
        <h3>Food-service sales</h3>
        <p class="od-card__stat">National · ${st.marts} months · latest provisional</p>
        <p class="od-card__desc">US food-services monthly sales (Census MARTS) — observed sales, never a forecast; the newest month is a provisional advance estimate.</p>
        <div class="od-card__links"><a href="/open/demand/">Explore</a><a href="/cost-index/marts-sales.csv" download>CSV</a><a href="/cost-index/marts-sales.json" download>JSON</a><span class="od-lic">CC0</span></div>
      </div>
      ${END}`;
}

function esBlock(st) {
  return `${START}
      <div class="od-card" style="--accent:var(--gold)">
        <h3>Retiros de alimentos (FDA)</h3>
        <p class="od-card__stat">${st.recalls} retiros · ${st.ingredients} ingredientes · ${st.classI} de Clase I</p>
        <p class="od-card__desc">Retiros de alimentos de la FDA, con fecha, vinculados a ingredientes por el texto del producto — un registro documentado por sí mismo, nunca unido a un precio, nunca una causa.</p>
        <div class="od-card__links"><a href="/open/recalls/">Explorar (EN)</a><a href="/cost-index/food-recalls.csv" download>CSV</a><a href="/cost-index/food-recalls-by-ingredient.json" download>JSON</a><span class="od-lic">CC0 · CC-BY</span></div>
      </div>
      <div class="od-card" style="--accent:var(--teal)">
        <h3>Salarios de restaurantes (condado)</h3>
        <p class="od-card__stat">Condado de Montgomery, MD · telón de fondo</p>
        <p class="od-card__desc">Salario semanal promedio y empleo del sector gastronómico del condado (BLS QCEW) — un carril descriptivo, nunca mezclado en el índice de costos, la presión ni el Vendor Benchmark.</p>
        <div class="od-card__links"><a href="/open/labor/">Explorar (EN)</a><a href="/cost-index/qcew-wages.csv" download>CSV</a><a href="/cost-index/qcew-wages.json" download>JSON</a><span class="od-lic">CC0</span></div>
      </div>
      <div class="od-card" style="--accent:var(--season)">
        <h3>Ventas del sector gastronómico</h3>
        <p class="od-card__stat">Nacional · ${st.marts} meses · último provisional</p>
        <p class="od-card__desc">Ventas mensuales del sector gastronómico de EE. UU. (Census MARTS) — ventas observadas, nunca un pronóstico; el mes más reciente es una estimación anticipada provisional.</p>
        <div class="od-card__links"><a href="/open/demand/">Explorar (EN)</a><a href="/cost-index/marts-sales.csv" download>CSV</a><a href="/cost-index/marts-sales.json" download>JSON</a><span class="od-lic">CC0</span></div>
      </div>
      ${END}`;
}

// find the matching close of the first .od-grid after the anchor id, by <div> depth counting
function gridClose(html, anchorId) {
  const aIdx = html.indexOf(`id="${anchorId}"`);
  if (aIdx < 0) return -1;
  const gOpen = html.indexOf('<div class="od-grid">', aIdx);
  if (gOpen < 0) return -1;
  const re = /<div\b|<\/div>/g; re.lastIndex = gOpen;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    if (m[0] === '</div>') { if (--depth === 0) return m.index; } else depth++;
  }
  return -1;
}

// count od-card blocks between the grid open (after anchor) and its close
function countCards(html, anchorId) {
  const aIdx = html.indexOf(`id="${anchorId}"`);
  const gOpen = html.indexOf('<div class="od-grid">', aIdx);
  const gClose = gridClose(html, anchorId);
  return (html.slice(gOpen, gClose).match(/<div class="od-card"/g) || []).length;
}

function inject(html, { anchorId, block, countRe, words }) {
  let out = html;
  if (out.includes(START)) {
    out = out.replace(new RegExp(START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), block);
  } else {
    const gClose = gridClose(out, anchorId);
    if (gClose < 0) throw new Error(`inject-open-cards: could not locate the .od-grid close for #${anchorId}`);
    out = out.slice(0, gClose) + block + '\n      ' + out.slice(gClose);
  }
  // reconcile the count word by counting the rendered cards
  const n = countCards(out, anchorId);
  const word = words[n];
  if (!word) throw new Error(`inject-open-cards: no ${anchorId} count word for ${n} cards — extend the word map`);
  out = out.replace(countRe, (_m, pre, _old, post) => pre + word + post);
  return out;
}

const TARGETS = (st) => [
  { rel: 'open/index.html', anchorId: 'od-series', block: enBlock(st), countRe: /(<p class="od-sub">)(\w+)( interactive explorers)/, words: EN_WORD, lang: 'en' },
  { rel: 'es/open/index.html', anchorId: 'od-sets', block: esBlock(st), countRe: /(<p class="od-sub">)(\w+)( conjuntos de datos)/, words: ES_WORD, lang: 'es' },
];

function guardBlock(html, lang) {
  const b = (html.split(START)[1] || '').split(END)[0];
  const errs = [];
  if (/\$/.test(b)) errs.push(`${lang} corpus-card block carries a "$" price token`);
  if (/pressure_dir|pressure_conf/.test(b)) errs.push(`${lang} corpus-card block carries a pressure_* token`);
  const priceLit = lang === 'es' ? 'nunca unido a un precio' : 'never joined to a price';
  const causeLit = lang === 'es' ? 'nunca una causa' : 'never a cause';
  if (!b.includes(priceLit)) errs.push(`${lang} recalls card missing "${priceLit}"`);
  if (!b.includes(causeLit)) errs.push(`${lang} recalls card missing "${causeLit}"`);
  return errs;
}

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error('  ✗', n, 'got', JSON.stringify(g), 'want', JSON.stringify(w)); } };
  const st = { recalls: 718, ingredients: 96, classI: 426, marts: 138 };
  // synthetic EN grid with 2 cards + the count word
  const en = `<h2 id="od-series">x</h2><p class="od-sub">Two interactive explorers — foo</p>
    <div class="od-grid">
      <div class="od-card"><div class="od-card__links"><a href="/open/imports/">Explore</a></div></div>
      <div class="od-card"><div class="od-card__links"><a href="/open/record/">Explore</a></div></div>
    </div>`;
  const enWords = { 5: 'Five' };
  const out1 = inject(en, { anchorId: 'od-series', block: enBlock(st), countRe: /(<p class="od-sub">)(\w+)( interactive explorers)/, words: enWords });
  eq('EN: 2 existing + 3 injected = 5 cards counted', countCards(out1, 'od-series'), 5);
  eq('EN: count word reconciled to Five', /Five interactive explorers/.test(out1), true);
  eq('EN: sentinel block present', out1.includes(START) && out1.includes(END), true);
  eq('EN: recalls/labor/demand links injected', /\/open\/recalls\//.test(out1) && /\/open\/labor\//.test(out1) && /\/open\/demand\//.test(out1), true);
  eq('EN: honesty guard clean', guardBlock(out1, 'en'), []);
  // idempotent: re-inject replaces, does not duplicate
  const out2 = inject(out1, { anchorId: 'od-series', block: enBlock(st), countRe: /(<p class="od-sub">)(\w+)( interactive explorers)/, words: enWords });
  eq('EN: re-inject is idempotent (still 5)', countCards(out2, 'od-series'), 5);
  eq('EN: only one sentinel block', (out2.match(new RegExp(START, 'g')) || []).length, 1);
  // ES block honesty + Spanish literals
  const es = `<h2 id="od-sets">x</h2><p class="od-sub">Two conjuntos de datos, foo</p>
    <div class="od-grid"><div class="od-card"><div class="od-card__links"><a href="/es/cost-index/">Ver</a></div></div>
    <div class="od-card"><div class="od-card__links"><a href="/es/open/seasonality/">Ver</a></div></div></div>`;
  const out3 = inject(es, { anchorId: 'od-sets', block: esBlock(st), countRe: /(<p class="od-sub">)(\w+)( conjuntos de datos)/, words: { 5: 'Cinco' } });
  eq('ES: count reconciled to Cinco', /Cinco conjuntos de datos/.test(out3), true);
  eq('ES: cards link to the EN explorer pages', /\/open\/recalls\//.test(out3) && !/\/es\/open\/recalls\//.test(out3), true);
  eq('ES: honesty guard clean (Spanish literals)', guardBlock(out3, 'es'), []);
  // no price token in either block
  eq('EN block has no dollar token', /\$/.test((out1.split(START)[1] || '').split(END)[0]), false);
  // live shape
  if (fs.existsSync(path.join(repo, 'open/index.html'))) {
    const liveEn = inject(fs.readFileSync(path.join(repo, 'open/index.html'), 'utf8'), TARGETS(stats())[0]);
    eq('LIVE EN grid reaches 16 cards', countCards(liveEn, 'od-series'), 16);
    eq('LIVE EN word is Sixteen', /Sixteen interactive explorers/.test(liveEn), true);
    eq('LIVE EN block honest', guardBlock(liveEn, 'en'), []);
  }
  console.log(`inject-open-cards self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

const args = new Set(process.argv.slice(2));
if (args.has('--self-test')) selfTest();
const st = stats();
const targets = TARGETS(st);
let drift = 0;
for (const t of targets) {
  const p = path.join(repo, t.rel);
  const cur = fs.readFileSync(p, 'utf8');
  const next = inject(cur, t);
  const errs = guardBlock(next, t.lang);
  if (errs.length) { console.error('inject-open-cards: honesty guard failed:\n  ' + errs.join('\n  ')); process.exit(1); }
  if (args.has('--check')) {
    if (cur !== next) { drift++; console.error(`✗ ${t.rel} corpus cards stale — run: node scripts/inject-open-cards.mjs`); }
  } else if (cur !== next) {
    fs.writeFileSync(p, next);
    console.log(`Injected corpus cards → ${t.rel} (${countCards(next, t.anchorId)} cards).`);
  } else {
    console.log(`${t.rel} already in sync.`);
  }
}
if (args.has('--check')) { if (drift) process.exit(1); console.log(`✓ open hub corpus cards in sync (${targets.length} file(s)).`); }
process.exit(0);
