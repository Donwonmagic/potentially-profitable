// event-exposure.mjs — the "Why these ingredients were exposed" block for each
// /cost-index/events/<id>/ detail page (ADR-019, the events leg of the CHAIN). For every
// affected ingredient, a compact, RELIANCE-BRANCHED structural read that makes a documented
// event's co-occurrence legible — never a cause, never a forecast.
//
// The audit's binding fix: an import-origin / HHI gauge may render ONLY for import-exposed
// items. A domestically-supplied item (eggs, poultry, beef) gets a domestic-structure note,
// never an import-HHI concentration figure (which would imply an import exposure it does not
// have). Seafood gets the catchpair (two different measures, never a supply share).
//
// Honesty rules (mirrors supply-picture.mjs + the events co-occurrence contract):
//   · import value / HHI / reliance are of import VALUE — a value proxy, never volume,
//     tonnage, a supply share, or a supply-security score
//   · catchpair is ex-vessel wild value BESIDE customs import value — two measures, not a ratio
//   · the block is structural CONTEXT for the co-occurrence — it never asserts the event
//     caused a price move, and never forecasts
//   · degrade by absence — an affected slug with no ISR record is simply not listed
//
// Single source of truth: imported by build-cost-index-pages.mjs (emitEventPage) and
// inject-event-exposure.mjs (refreshing committed detail pages in-container).
//
//   node scripts/lib/event-exposure.mjs --self-test

export const EXPOSURE_SENTINEL = { start: '<!-- event-exposure:start -->', end: '<!-- /event-exposure:end -->' };
export const EXPOSURE_CSS_SENTINEL = { start: '/* event-exposure-css:start */', end: '/* event-exposure-css:end */' };
export const EXPOSURE_CSS = `${EXPOSURE_CSS_SENTINEL.start}
.evd-exposure{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:10px}
.evd-exposure li{padding:11px 14px;background:var(--white,#fff);border:1px solid var(--line,#e5e0d8);border-radius:10px;font-size:14.5px;line-height:1.55;color:var(--ink,#2a2a26)}
.evd-exposure .evd-exp__name{font-weight:700}
.evd-exposure .evd-exp__mode{font-size:11px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;margin-left:8px;padding:2px 8px;border-radius:999px;border:1px solid var(--line,#e5e0d8);color:var(--ink-soft,#615c53)}
.evd-exposure .evd-exp__cav{color:var(--ink-soft,#615c53)}
${EXPOSURE_CSS_SENTINEL.end}`;

const COUNTRY_ES = { Mexico: 'México', Canada: 'Canadá', Peru: 'Perú', Chile: 'Chile', China: 'China', Spain: 'España', Ecuador: 'Ecuador', India: 'India', Indonesia: 'Indonesia', Italy: 'Italia', France: 'Francia', Guatemala: 'Guatemala', Honduras: 'Honduras', Vietnam: 'Vietnam', Thailand: 'Tailandia', Netherlands: 'Países Bajos', Morocco: 'Marruecos', Turkey: 'Turquía', Brazil: 'Brasil', Argentina: 'Argentina', Colombia: 'Colombia', 'Costa Rica': 'Costa Rica', Norway: 'Noruega', Ireland: 'Irlanda', Germany: 'Alemania', 'New Zealand': 'Nueva Zelanda', Australia: 'Australia' };
const country = (c, es) => (es && COUNTRY_ES[c]) ? COUNTRY_ES[c] : c;

function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function usd(n) {
  if (n == null) return '';
  const a = Math.abs(n);
  if (a >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return '$' + Math.round(n / 1e6) + 'M';
  if (a >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
  return '$' + n;
}

// Which exposure axis is honest for this ingredient?
//   'seafood'  — has a wild-landings figure or a farmed-import flag → catchpair
//   'import'   — import reliance ≥ 40% by value → import-origin exposure
//   'domestic' — otherwise → domestic production structure (NO import-HHI gauge)
export function exposureMode(isr) {
  if (!isr) return null;
  if (isr.us_landings_value_usd != null || isr.import_mostly_farmed != null) return 'seafood';
  const rel = typeof isr.import_reliance_pct === 'number' ? isr.import_reliance_pct : null;
  if (rel != null && rel >= 40) return 'import';
  return 'domestic';
}

const MODE_LABEL = {
  import: (es) => es ? 'Expuesto por importación' : 'Import-exposed',
  domestic: (es) => es ? 'De origen nacional' : 'Domestically sourced',
  seafood: (es) => es ? 'Silvestre vs importado' : 'Wild vs imported',
};

// One <li> exposure read for an affected ingredient. Returns '' when the record carries no
// usable structure. `name` is the localized display name.
export function exposureLi(name, isr, locale) {
  const es = locale === 'es';
  const mode = exposureMode(isr);
  if (!mode) return '';
  const badge = `<span class="evd-exp__mode">${MODE_LABEL[mode](es)}</span>`;
  let body = '';
  if (mode === 'import') {
    const top = Array.isArray(isr.import_top_sources) ? isr.import_top_sources.slice(0, 2) : [];
    const src = top.map((s) => `${s.share_pct}% ${esc(country(s.country, es))}`).join(' · ');
    const hhi = typeof isr.import_source_hhi === 'number' ? isr.import_source_hhi : null;
    const rel = isr.import_reliance_pct;
    body = es
      ? `su valor de importación se concentra en pocos orígenes${src ? ` (${src}` : ''}${hhi != null ? `${src ? ', ' : ' ('}HHI ${hhi}, una cuota de valor` : ''}${src || hhi != null ? ')' : ''}, con una dependencia-por-valor de ~${rel}%. Por eso un evento en esa región de origen coincide de forma legible con su ventana de precio.`
      : `its import value concentrates in a few origins${src ? ` (${src}` : ''}${hhi != null ? `${src ? ', ' : ' ('}HHI ${hhi}, a value share` : ''}${src || hhi != null ? ')' : ''}, at ~${rel}% reliance by value. That is why an event in that origin region overlaps its price window legibly.`;
  } else if (mode === 'domestic') {
    const rel = typeof isr.import_reliance_pct === 'number' ? isr.import_reliance_pct : null;
    body = es
      ? `proviene casi por completo de la producción nacional, con poco colchón de importación${rel != null ? ` (dependencia-por-valor ~${rel}%)` : ''}. Su exposición corre por la estructura de producción nacional, no por los orígenes de importación — un evento nacional coincide con su ventana de precio.`
      : `comes almost entirely from domestic production, with little import buffer${rel != null ? ` (reliance ~${rel}% by value)` : ''}. Its exposure runs through domestic production structure, not import origins — a domestic event overlaps its price window.`;
  } else { // seafood
    const ly = isr.us_landings_year;
    const wild = isr.us_landings_value_usd;
    const imp = isr.us_import_value_usd;
    const farmed = isr.import_mostly_farmed
      ? (es ? ' La mayoría de las importaciones de esta especie son de cultivo en el extranjero.' : ' Most imports of this species are farmed abroad.')
      : '';
    body = es
      ? `${wild != null ? `los desembarques silvestres de EE. UU. fueron ${usd(wild)}${ly ? ` (${ly})` : ''}, junto a ${usd(imp)} de importaciones` : `su suministro corre por las importaciones`} — dos medidas distintas, no una cuota de suministro.${farmed}`
      : `${wild != null ? `US wild landings were ${usd(wild)}${ly ? ` (${ly})` : ''}, beside ${usd(imp)} of imports` : `its supply runs through imports`} — two different measures, not a supply share.${farmed}`;
  }
  return `<li><span class="evd-exp__name">${esc(name)}</span>${badge} ${body}</li>`;
}

// The full section for a per-event detail page. `affected` is [{slug, name}]; `isrMap` is
// slug -> ISR record. Returns '' when no affected slug has a usable record.
export function exposureSection(affected, isrMap, locale) {
  const es = locale === 'es';
  const entries = (affected || []).map((a) => ({ a, isr: isrMap[a.slug], mode: exposureMode(isrMap[a.slug]) })).filter((e) => e.mode);
  const lis = entries.map((e) => exposureLi(e.a.name, e.isr, locale)).filter(Boolean);
  if (!lis.length) return '';
  const modes = new Set(entries.map((e) => e.mode));
  // Only explain the honesty of a measure this section actually shows — an all-domestic page
  // needn't define import-value HHI (the audit's precision fix), and only mentions reliance if a
  // reliance figure is on the page.
  const showsReliance = entries.some((e) => e.mode === 'import' || (e.mode === 'domestic' && typeof e.isr.import_reliance_pct === 'number'));
  const clauses = [];
  if (showsReliance) clauses.push(es ? 'la dependencia es una cuota del valor de importación, un proxy aproximado de exposición, no una puntuación de seguridad de suministro' : 'reliance is a share of import value, a rough exposure proxy, not a supply-security score');
  if (modes.has('import')) clauses.push(es ? 'la concentración de origen (HHI) es del valor de importación, no de la oferta total' : 'origin concentration (HHI) is of import value, not total supply');
  if (modes.has('seafood')) clauses.push(es ? 'los desembarques y las importaciones son dos medidas distintas, no una cuota de suministro' : 'wild landings and imports are two different measures, not a supply share');
  if (clauses.length) clauses[0] = clauses[0][0].toUpperCase() + clauses[0].slice(1);
  const lead = clauses.length ? clauses.join('; ') + '. ' : '';
  const h2 = es ? 'Por qué estos ingredientes estaban expuestos' : 'Why these ingredients were exposed';
  const intro = es
    ? 'La estructura de suministro pública de cada ingrediente afectado — de dónde llega y cuánto depende de importaciones. Contexto que hace legible la coincidencia en el tiempo con un evento documentado, nunca su causa.'
    : "Each affected ingredient's public supply structure — where it comes from and how much it leans on imports. Context that makes the co-occurrence with a documented event legible, never its cause.";
  const caveat = lead + (es
    ? 'Explica por qué un ingrediente está en la trayectoria de un evento documentado — no que el evento causara ningún movimiento de precio. Coincidencia en el tiempo, nunca una causa.'
    : 'It explains why an ingredient sits in the path of a documented event — not that the event caused any price move. Co-occurrence in time, never a cause.');
  return `${EXPOSURE_SENTINEL.start}<section class="evd-section evd-exp" aria-labelledby="evd-exp-h">
      <h2 id="evd-exp-h">${h2}</h2>
      <p class="evd-eyebrow-note">${intro}</p>
      <ul class="evd-exposure">${lis.join('')}</ul>
      <p class="evd-caveat">${caveat}</p>
    </section>${EXPOSURE_SENTINEL.end}`;
}

// ---- self-test ------------------------------------------------------------------
function selfTest() {
  let pass = 0, fail = 0;
  const ok = (n, c) => { if (c) pass++; else { fail++; console.error('  ✗ ' + n); } };
  const SUPPLY = /\b(supplies|supplied|supply\s+share|backfill|tonnage|volume)\b/i;
  const CAUSAL = /\bcaused\s+(the\s+)?(price|prices|spike|jump|move)\b|\bdrove\s+(the\s+)?prices?\b/i;
  const FORECAST = /\bforecast|\bwill\s+(rise|fall)|\bnext\s+(year|month)\b/i;

  const importIsr = { import_reliance_pct: 81, import_source_hhi: 0.68, import_top_sources: [{ country: 'Mexico', share_pct: 81 }, { country: 'Canada', share_pct: 18 }] };
  const domesticIsr = { import_reliance_pct: null };
  const domesticIsr2 = { import_reliance_pct: 5 };
  const seafoodIsr = { us_landings_value_usd: 312004946, us_import_value_usd: 6000000000, us_landings_year: 2023, import_mostly_farmed: true };

  ok('import mode', exposureMode(importIsr) === 'import');
  ok('domestic mode (null reliance)', exposureMode(domesticIsr) === 'domestic');
  ok('domestic mode (low reliance)', exposureMode(domesticIsr2) === 'domestic');
  ok('seafood mode', exposureMode(seafoodIsr) === 'seafood');
  ok('no isr → null mode', exposureMode(null) === null);

  // The binding fix: a domestic item must NOT render an import-HHI gauge.
  const domLi = exposureLi('Eggs', domesticIsr, 'en');
  ok('domestic li has no HHI', !/HHI/.test(domLi));
  ok('domestic li says domestic structure', /domestic production structure/.test(domLi));
  const impLi = exposureLi('Tomato', importIsr, 'en');
  ok('import li has HHI value share', /HHI 0\.68, a value share/.test(impLi));
  ok('import li says reliance by value', /reliance by value|by value/i.test(impLi));
  const seaLi = exposureLi('Shrimp', seafoodIsr, 'en');
  ok('seafood li two measures', /two different measures, not a supply share/.test(seaLi));
  ok('seafood li farmed clause', /farmed abroad/.test(seaLi));

  // Honesty scan on every li (EN + ES, all modes): no causal, no forecast; no bare supply verb
  // outside the disclaimer "not a supply share".
  for (const [nm, isr] of [['Tomato', importIsr], ['Eggs', domesticIsr], ['Shrimp', seafoodIsr]]) {
    for (const loc of ['en', 'es']) {
      const li = exposureLi(nm, isr, loc);
      ok(`${nm} ${loc} no causal`, !CAUSAL.test(li));
      ok(`${nm} ${loc} no forecast`, !FORECAST.test(li));
      // strip the sanctioned "not a supply share" disclaimer, then no supply verb should remain
      const voice = li.replace(/not a supply share|no una cuota de suministro/gi, '');
      ok(`${nm} ${loc} no laundered supply verb`, !SUPPLY.test(voice));
    }
  }

  // Section carries the required co-occurrence marker (EN + ES).
  const affected = [{ slug: 'tomato', name: 'Tomato' }, { slug: 'eggs', name: 'Eggs' }];
  const isrMap = { tomato: importIsr, eggs: domesticIsr };
  for (const loc of ['en', 'es']) {
    const sec = exposureSection(affected, isrMap, loc);
    ok(`section ${loc} co-occurrence marker`, /co-occurrence in time, never a cause|coincidencia en el tiempo, nunca una causa/i.test(sec));
    ok(`section ${loc} not-a-cause on both items`, sec.includes('evd-exposure'));
  }
  ok('section empty when no ISR', exposureSection([{ slug: 'x', name: 'X' }], {}, 'en') === '');
  // Adaptive caveat: an all-domestic (null-reliance) section must NOT define import-value HHI,
  // but must still carry the co-occurrence marker.
  const domSec = exposureSection([{ slug: 'eggs', name: 'Eggs' }, { slug: 'turkey', name: 'Turkey' }], { eggs: domesticIsr, turkey: { import_reliance_pct: null } }, 'en');
  ok('all-domestic section omits HHI', !/HHI/.test(domSec));
  ok('all-domestic section keeps co-occurrence marker', /co-occurrence in time, never a cause/i.test(domSec));
  // A section with an import item DOES define HHI.
  ok('import-bearing section defines HHI', /origin concentration \(HHI\) is of import value/.test(exposureSection([{ slug: 'tomato', name: 'Tomato' }], { tomato: importIsr }, 'en')));

  console.log(`event-exposure self-test: ${pass}/${pass + fail} passed.`);
  return fail === 0;
}

if (process.argv[1] && process.argv[1].endsWith('event-exposure.mjs') && process.argv.includes('--self-test')) {
  process.exit(selfTest() ? 0 : 1);
}
