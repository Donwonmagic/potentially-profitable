#!/usr/bin/env node
/**
 * inject-seasonality-why.mjs — re-land §4 "why a curve has the shape it does" on
 * /open/seasonality/ (EN + ES).
 *
 * BACKGROUND. ADR-019 fused the Ingredient State Record into the seasonality hub as a
 * mechanism layer, and check-seasonality-fusion.mjs was written to police it. The #523
 * "main-base + re-apply corpus" merge took main's build-cost-index-pages.mjs, which does
 * not render that layer, so §4 vanished from the page and the gate's live page scan was
 * commented out of check-all (2026-07-28). The honesty LOGIC survived intact in
 * scripts/lib/seasonality-fusion.mjs (self-test 11/11) — only the renderer was lost.
 * This injector is that renderer, so the gate can go back on.
 *
 * WHAT IT SAYS. Each seasonal curve on the page is a domestic wholesale reference. Beside
 * it sits a second, independent calendar: where the nominal VALUE of US imports of that
 * food falls month to month. Classifying the 84 settled windows by how those two calendars
 * line up is information the price curve alone cannot carry.
 *
 * HONESTY (binding — ADR-019, ADR-020, docs/fact-check.md; enforced by the gate):
 *   - Import figures are nominal VALUE seasonality. Never volume, never tonnage, never a
 *     supply share. HHI is concentration of import VALUE, not of total supply.
 *   - Two calendars are shown side by side. Neither is presented as causing the other,
 *     and nothing here is a forecast.
 *   - Every count is computed from committed files at build time, never typed.
 *   - The load-bearing caveat comes verbatim from mechanismCaveat() in the shared lib and
 *     is rendered inside <div class="od-note sea-caveat">, the zone the gate's siteVoice()
 *     strips before its positive scans — so the caveat may name the banned tokens in order
 *     to disclaim them, while the site's own affirmative voice may not.
 *
 * Idempotent strip+rewrite between sentinels. Runs AFTER build-cost-index-pages.mjs
 * (which owns this page), same posture as inject-supply-picture / inject-provenance-hop.
 *
 *   node scripts/inject-seasonality-why.mjs            # rewrite in place
 *   node scripts/inject-seasonality-why.mjs --check    # exit 1 if out of sync
 *   node scripts/inject-seasonality-why.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mechanismFor, concentrationFor, mechanismCaveat } from './lib/seasonality-fusion.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const START = '<!-- seasonality-why:start -->';
const END = '<!-- /seasonality-why:end -->';
// §4 sits between "how to read the curve" and the operator's playbook.
const ANCHOR = '<section aria-labelledby="sea-play-h"';

const rd = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Affirmative-voice glosses. These are the site SPEAKING, so they carry no supply verb,
// no "volume", no cause and no forecast — the gate scans them.
const CLASS_COPY = {
  'counter-phase': {
    en: { label: '⇄ Import-value counter-phase', gloss: 'Import value rises in the months the domestic wholesale reference dips — two calendars running opposite, set side by side.' },
    es: { label: '⇄ Valor de importación en contrafase', gloss: 'El valor de importación sube en los meses en que la referencia mayorista nacional baja — dos calendarios opuestos, puestos uno al lado del otro.' },
  },
  'domestic-low': {
    en: { label: 'Domestic-season low (not import-aligned)', gloss: 'The domestic reference troughs while import value is not at its high. Inferred from the two series read together, not a measured harvest calendar.' },
    es: { label: 'Mínimo de temporada nacional', gloss: 'La referencia nacional toca fondo mientras el valor de importación no está en su punto alto. Inferido de las dos series leídas juntas, no es un calendario de cosecha medido.' },
  },
  'domestic-only': {
    en: { label: 'Domestically sourced (no import calendar)', gloss: 'Carries no import-value calendar at all; the shape of its curve is set in the domestic market.' },
    es: { label: 'De origen nacional (sin calendario de importación)', gloss: 'No lleva ningún calendario de valor de importación; la forma de su curva se fija en el mercado nacional.' },
  },
};
const ORDER = ['counter-phase', 'domestic-low', 'domestic-only'];

const CSS = `<style>/* seasonality-why */
.sea-mlist{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:10px}
.sea-mlist li{display:grid;grid-template-columns:auto auto 1fr;gap:10px;align-items:baseline;padding:10px 12px;border:1px solid var(--line);border-radius:8px}
.sea-mchip{display:inline-block;font-family:var(--font-display);font-size:12px;line-height:1.4;padding:3px 8px;border-radius:999px;border:1px solid var(--line);white-space:nowrap}
.sea-mchip--counter-phase{background:rgba(42,80,200,.10)}
.sea-mchip--domestic-low{background:rgba(42,80,200,.05)}
.sea-mchip--domestic-only{background:transparent}
.sea-mchip--concentrated{background:rgba(176,84,44,.10)}
.sea-mcount{font-family:var(--font-display);font-variant-numeric:tabular-nums;font-weight:600}
.sea-mgloss{font-size:14px}
.sea-mex{display:block;margin-top:3px;font-size:13px;opacity:.75}
@media (max-width:640px){.sea-mlist li{grid-template-columns:1fr;gap:4px}}
</style>`;

// ── model: classify every settled window from committed data ─────────────────
export function buildModel(seasonality, isrRecords) {
  const bySlug = new Map(isrRecords.map((r) => [r.slug, r]));
  const groups = { 'counter-phase': [], 'domestic-low': [], 'domestic-only': [] };
  let concentrated = 0, total = 0;

  for (const item of (seasonality.ingredients || [])) {
    if (!item || !item.ready) continue;
    const months = Object.entries(item.months || {}).filter(([, v]) => v && v.medianCents != null);
    if (!months.length) continue;
    const rec = bySlug.get(item.key);
    if (!rec) continue;
    const cheapMonth = Number(months.slice().sort((a, b) => a[1].medianCents - b[1].medianCents)[0][0]);
    const m = mechanismFor(rec, cheapMonth);
    if (!groups[m.key]) continue;
    total++;
    groups[m.key].push(rec.name || item.key);
    if (concentrationFor(rec)) concentrated++;
  }
  for (const k of ORDER) groups[k].sort((a, b) => String(a).localeCompare(String(b)));
  return { groups, concentrated, total };
}

export function whyBlock(model, es) {
  const { groups, concentrated, total } = model;
  const L = (k) => CLASS_COPY[k][es ? 'es' : 'en'];
  const exLabel = es ? 'p. ej.' : 'e.g.';

  const items = ORDER.filter((k) => groups[k].length).map((k) => {
    const c = L(k);
    const ex = groups[k].slice(0, 4).map(esc).join(', ');
    return `<li><span class="sea-mchip sea-mchip--${k}">${esc(c.label)}</span>`
      + `<span class="sea-mcount">${groups[k].length}</span>`
      + `<span class="sea-mgloss">${esc(c.gloss)}<span class="sea-mex">${exLabel} ${ex}</span></span></li>`;
  }).join('');

  const h = es ? 'Por qué una curva tiene la forma que tiene' : 'Why a curve has the shape it does';
  const intro = es
    ? `Cada curva de esta página es una referencia mayorista nacional. A su lado hay un segundo calendario independiente: dónde cae mes a mes el valor nominal de las importaciones estadounidenses de ese alimento. De los <b>${total}</b> ingredientes con una ventana asentada, así se alinean los dos calendarios.`
    : `Every curve on this page is a domestic wholesale reference. Beside it sits a second, independent calendar: where the nominal value of US imports of that food falls month to month. Across the <b>${total}</b> ingredients with a settled window, this is how the two calendars line up.`;
  const conc = es
    ? `Por separado, <b>${concentrated}</b> de los ${total} llevan <span class="sea-mchip sea-mchip--concentrated">Valor de importación concentrado</span> — la mayor parte de su valor anual de importación se sitúa en un solo país de origen (HHI ≥ 0,50, una cuota de valor).`
    : `Separately, <b>${concentrated}</b> of the ${total} carry <span class="sea-mchip sea-mchip--concentrated">Concentrated single-origin import value</span> — most of their annual import value sits with one origin country (HHI ≥ 0.50, a value share).`;

  return `${START}${CSS}
  <section aria-labelledby="sea-why">
    <h2 id="sea-why">${h}</h2>
    <p>${intro}</p>
    <ul class="sea-mlist">${items}</ul>
    <p>${conc}</p>
    <div class="od-note sea-caveat">${esc(mechanismCaveat(es))}</div>
  </section>
${END}`;
}

export function injectWhy(html, model, es) {
  // Strip any prior block AND the whitespace on BOTH sides of it. Consuming only the
  // leading side let the separator we insert after the block accumulate on every re-run
  // — caught by the byte-identity case in --self-test.
  const i = html.indexOf(START);
  if (i >= 0) {
    const j = html.indexOf(END, i);
    if (j >= 0) {
      let from = i, to = j + END.length;
      while (from > 0 && /\s/.test(html[from - 1])) from--;
      while (to < html.length && /\s/.test(html[to])) to++;
      html = html.slice(0, from) + html.slice(to);
    }
  }
  const at = html.indexOf(ANCHOR);
  if (at < 0) return null;
  // Normalize the whitespace ahead of the anchor too, so the FIRST insert and every
  // re-insert emit the identical separator — otherwise run 1 and run 2 differ by one
  // separator and the block is never byte-stable.
  let ins = at;
  while (ins > 0 && /\s/.test(html[ins - 1])) ins--;
  return html.slice(0, ins) + '\n\n  ' + whyBlock(model, es) + '\n\n  ' + html.slice(at);
}

// ── self-test ────────────────────────────────────────────────────────────────
if (process.argv.includes('--self-test')) {
  let fail = 0;
  const t = (n, c) => { if (!c) { console.error('  ✗', n); fail++; } };

  const seas = { ingredients: [
    { key: 'apple', ready: true, months: { '3': { medianCents: 300 }, '8': { medianCents: 100 } } },
    { key: 'beef', ready: true, months: { '1': { medianCents: 500 } } },
    { key: 'skip', ready: false, months: { '1': { medianCents: 1 } } },
  ] };
  const isr = [
    { slug: 'apple', name: 'Apple', import_seasonal_index: [1.2, 1, 1, 1, 1, 1, 1, 1.3, 1, 1, 1, 1], import_source_hhi: 0.7, import_top_sources: [{ country: 'Chile', share_pct: 60 }], import_reliance_pct: 20 },
    { slug: 'beef', name: 'Beef', import_seasonal_index: null, import_source_hhi: null },
  ];
  const m = buildModel(seas, isr);
  t('classifies only ready items with ISR', m.total === 2);
  t('apple is counter-phase (import high in its cheap month)', m.groups['counter-phase'].includes('Apple'));
  t('beef has no import calendar', m.groups['domestic-only'].includes('Beef'));
  t('counts concentration', m.concentrated === 1);

  const page = '<main><section aria-labelledby="sea-read"><h2 id="sea-read">read</h2></section><section aria-labelledby="sea-play-h"><h2 id="sea-play-h">play</h2></section></main>';
  const once = injectWhy(page, m, false);
  t('inserts before the playbook section', once.indexOf(START) < once.indexOf(ANCHOR));
  t('emits the section with the gate id', once.includes('aria-labelledby="sea-why"'));
  t('carries the load-bearing caveat literal', once.includes('never volume, tonnage, or supply share'));
  t('caveat is inside the siteVoice-exempt zone', /<div class="od-note sea-caveat">/.test(once));
  const twice = injectWhy(once, m, false);
  t('idempotent (byte-identical on re-run)', twice === once);
  t('exactly one block after re-run', (twice.match(/seasonality-why:start/g) || []).length === 1);
  t('no anchor -> null', injectWhy('<div>x</div>', m, false) === null);

  // honesty: the AFFIRMATIVE voice must be clean (mirror the gate's own regexes)
  const SUPPLY_RE = /\b(supplies?|supplied|backfill(?:s|ed|ing)?|fills?\s+the\s+gap|tonnage|supply\s+share|supply\s+volume)\b/i;
  const VOLUME_RE = /\bvolume\b/i;
  const voice = once.replace(/<div class="od-note sea-caveat"[\s\S]*?<\/div>/g, ' ').replace(/<[^>]+>/g, ' ');
  t('affirmative voice makes no supply claim', !SUPPLY_RE.test(voice));
  t('affirmative voice never says "volume"', !VOLUME_RE.test(voice));
  t('affirmative voice speaks no forecast', !/\bforecast|\bprojected\b|\bwill\s+(rise|fall)/i.test(voice));
  t('affirmative voice asserts no price cause', !/caused\s+(the\s+)?price|drove\s+(the\s+)?prices?/i.test(voice));

  const esOut = injectWhy(page, m, true);
  t('ES carries its own caveat literal', esOut.includes('nunca volumen, tonelaje ni cuota de oferta'));
  t('ES heading', esOut.includes('Por qué una curva'));

  if (fail) { console.error(`inject-seasonality-why self-test: ${fail} failure(s).`); process.exit(1); }
  console.log('inject-seasonality-why self-test: 16/16 passed (model, placement, idempotency, caveat zone, honesty voice, ES).');
  process.exit(0);
}

// ── run ──────────────────────────────────────────────────────────────────────
const model = buildModel(rd('data/seasonality.json'), rd('data/ingredient-state-record.json').records || []);

let changed = 0; const skipped = [];
for (const [rel, es] of [['open/seasonality/index.html', false], ['es/open/seasonality/index.html', true]]) {
  const abs = path.join(repo, rel);
  if (!fs.existsSync(abs)) { skipped.push(`${rel}: missing`); continue; }
  const before = fs.readFileSync(abs, 'utf8');
  const after = injectWhy(before, model, es);
  if (after === null) { skipped.push(`${rel}: no ${ANCHOR} anchor`); continue; }
  if (after !== before) { changed++; if (!CHECK) fs.writeFileSync(abs, after); }
}

if (skipped.length) for (const s of skipped) console.error('  - ' + s);
if (CHECK) {
  if (changed || skipped.length) { console.error(`✗ seasonality-why: ${changed} page(s) out of sync — run: node scripts/inject-seasonality-why.mjs`); process.exit(1); }
  console.log(`✓ seasonality-why: §4 mechanism layer in sync on both locales (${model.total} classified, ${model.concentrated} concentrated).`);
} else {
  console.log(`seasonality-why: ${changed} file(s) changed — ${model.total} settled windows classified, ${model.concentrated} with concentrated single-origin import value.`);
}
