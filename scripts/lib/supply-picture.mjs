// supply-picture.mjs — the static "Where it comes from" block for each /cost-index/<slug>/ page
// (ADR-018 surface 2, the citable / answer-engine surface). It renders the audited SOURCE-rung seams of
// the Ingredient State Record — import stream, domestic production/farm-price/exports, value-reliance,
// and the seafood catchpair — as prose sentences that survive verbatim extraction WITH their caveat
// intact (never a tile a snippet would strip of context).
//
// Single source of truth: imported by both build-cost-index-pages.mjs (page generation) and
// inject-supply-picture.mjs (refreshing the committed pages in-container without a full rebuild), so the
// two never diverge. The honesty rules mirror the menu-pricing island exactly (post-audit):
//   · import value is NOMINAL customs value — never volume, never a delivered price
//   · reliance is an apparent-consumption proxy (import ÷ (production + import − export)); a dollar
//     comparison, not a shelf-share, not a supply-security score; NOT clamped at 100% (re-export note)
//   · commodity-scope reliance names the group in the reader's own language (EN→ES map)
//   · catchpair is two DIFFERENT measures (ex-vessel wild vs customs import), never a share; the
//     "farmed abroad" clause appears only when import_mostly_farmed is true
//   · degrade by absence — any missing layer is simply not written

export const SUPPLY_SENTINEL = { start: '<!-- supply-picture:start -->', end: '<!-- /supply-picture:end -->' };
export const SUPPLY_CSS_SENTINEL = { start: '/* supply-picture-css:start */', end: '/* supply-picture-css:end */' };
// Reuses the pages' existing ci-profile card + CSS custom props (--ink, --ink-soft). Caveats are NOT
// de-emphasized into fine print — they carry the honesty and read at body weight; only the trailing
// metadata (HS code, source note) is muted.
export const SUPPLY_CSS = `${SUPPLY_CSS_SENTINEL.start}
.ci-supply__p{margin:11px 0 0;font-size:15px;line-height:1.6;color:var(--ink)}
.ci-supply__rel strong{font-weight:700}
.ci-supply__caveat{color:var(--ink-soft)}
.ci-supply__meta{color:var(--ink-soft);font-size:.9em}
${SUPPLY_CSS_SENTINEL.end}`;

const COM_ES = { TOMATOES: 'tomates', CATTLE: 'res', HOGS: 'cerdo', PEPPERS: 'chiles', SQUASH: 'calabaza', LETTUCE: 'lechuga', ONIONS: 'cebolla', POTATOES: 'papa', CABBAGE: 'col', MUSHROOMS: 'hongos', MELONS: 'melones' };

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function usd(n) {
  if (n == null) return '';
  const a = Math.abs(n);
  if (a >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return '$' + Math.round(n / 1e6) + 'M';
  if (a >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
  return '$' + n;
}

// Returns { html, faq } — html is the sentinel-wrapped <section> (or '' when the record carries no
// SOURCE layer at all), faq is an optional { q, a } for the FAQPage schema (null when no import stream).
export function supplyPicture(R, locale) {
  if (!R) return { html: '', faq: null };
  const es = locale === 'es';
  const base = es ? '/es' : '';
  const MO = es ? ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const hasImport = R.us_import_value_usd != null;
  const hasDomestic = R.us_production_usd != null || R.us_export_value_usd != null || R.import_reliance_pct != null;
  const hasCatch = R.us_landings_value_usd != null;
  if (!hasImport && !hasDomestic && !hasCatch) return { html: '', faq: null };

  const P = []; // prose paragraphs

  // ---- import stream ----
  if (hasImport) {
    const lastYr = R.import_years ? String(R.import_years).split('-').pop() : null;
    const bits = [];
    bits.push((es ? 'El valor de importación general de EE. UU. fue de ' : 'US general-import value was ') + usd(R.us_import_value_usd) + (lastYr ? ` (${lastYr})` : '') + (R.import_years ? `, ${es ? 'serie' : 'series'} ${R.import_years}` : '') + (R.import_yoy_pct != null ? `, ${es ? 'interanual' : 'YoY'} ${R.import_yoy_pct > 0 ? '+' : ''}${R.import_yoy_pct}%` : '') + '.');
    if (R.import_top_sources && R.import_top_sources.length) {
      const src = R.import_top_sources.map((s) => `${s.share_pct}% ${esc(s.country)}`).join(' · ');
      const conc = R.import_source_concentration ? ` (${esc(R.import_source_concentration)}${R.import_source_hhi != null ? `, HHI ${R.import_source_hhi}` : ''})` : '';
      bits.push((es ? 'Principales orígenes: ' : 'Top origins: ') + src + conc + '.');
    }
    if (R.import_peak_months && R.import_peak_months.length) bits.push((es ? 'Meses pico de importación: ' : 'Peak import months: ') + R.import_peak_months.map((m) => MO[m - 1]).join(' · ') + '.');
    P.push(`<p class="ci-supply__p">${bits.join(' ')} <span class="ci-supply__caveat">${es ? 'Valor de aduana nominal (US Census, dominio público) — mezcla precio y cantidad, nunca volumen ni tu precio de entrega.' : 'Nominal customs value (US Census, public domain) — mixes price and quantity, never volume or your delivered price.'}</span>${R.import_hs6 ? ` <span class="ci-supply__meta">${es ? 'Código HS' : 'HS code'} ${esc(R.import_hs6)}.</span>` : ''}${R.import_note ? ` <span class="ci-supply__meta">${esc(R.import_note)}</span>` : ''}</p>`);
  }

  // ---- domestic production + farm price + exports ----
  if (R.us_production_usd != null || R.us_export_value_usd != null || (R.farm_price != null && R.farm_price_unit)) {
    const bits = [];
    if (R.us_production_usd != null) bits.push((es ? 'La producción a precio de campo (EE. UU.) fue de ' : 'US farm-gate production was ') + usd(R.us_production_usd) + (R.production_years ? ` (${R.production_years})` : '') + '.');
    if (R.farm_price != null && R.farm_price_unit) {
      const perLb = /cwt/i.test(R.farm_price_unit) ? ` (≈ $${(R.farm_price / 100).toFixed(2)}/lb)` : '';
      bits.push((es ? 'Precio de campo: ' : 'Farm-gate price: ') + R.farm_price + ' ' + esc(R.farm_price_unit) + perLb + '.');
    }
    if (R.us_export_value_usd != null) bits.push((es ? 'Exportaciones de EE. UU.: ' : 'US exports: ') + usd(R.us_export_value_usd) + (R.us_export_year ? ` (${R.us_export_year})` : '') + '.');
    const hasNass = R.us_production_usd != null || (R.farm_price != null && R.farm_price_unit);
    const domCaveat = hasNass
      ? (es ? 'Valor a precio de campo (USDA NASS) — lo que gana el productor, no un precio mayorista ni de entrega.' : 'Farm-gate value (USDA NASS) — what the grower earns, not a wholesale or delivered price.')
      : (es ? 'Valor de exportación nacional (US Census, DF=1) — valor nominal, nunca tu precio de entrega.' : 'US domestic-export value (US Census, DF=1) — nominal value, never your delivered price.');
    if (bits.length) P.push(`<p class="ci-supply__p">${bits.join(' ')} <span class="ci-supply__caveat">${domCaveat}</span></p>`);
  }

  // ---- value-reliance (apparent-consumption proxy) ----
  let faq = null;
  if (R.import_reliance_pct != null) {
    const yr = R.import_reliance_year;
    const commodity = (R.import_reliance_scope === 'commodity' && R.nass_commodity)
      ? (es ? (COM_ES[R.nass_commodity] || R.nass_commodity.toLowerCase()) : R.nass_commodity.toLowerCase())
      : null;
    const subject = commodity
      ? (es ? `del grupo ${commodity}` : `of the ${commodity} group`)
      : (es ? 'del consumo aparente' : 'of apparent consumption');
    const lead = (es
      ? `En ${yr || ''}, las importaciones fueron alrededor del ${R.import_reliance_pct}% ${subject} por valor (producido + importado − exportado).`
      : `In ${yr || ''}, imports were about ${R.import_reliance_pct}% ${subject} by value (made + imported − exported).`).replace('  ', ' ');
    const over = R.import_reliance_pct > 100 ? ' ' + (es ? 'Más de 100% significa que las importaciones superan el consumo aparente — EE. UU. reexporta parte de su suministro.' : 'Over 100% means imports exceed apparent consumption — the US re-exports part of its supply.') : '';
    const percap = R.us_percap_lbs != null ? ' ' + (es ? `Hay alrededor de ${R.us_percap_lbs} lb/persona/año disponibles en el país (${R.us_percap_year || ''}).` : `About ${R.us_percap_lbs} lb/person/yr are available domestically (${R.us_percap_year || ''}).`).replace(' ()', '') : '';
    const caveat = es
      ? 'Compara dólares de importación (que incluyen flete que un precio de campo no) con el consumo aparente nacional — una comparación de dólares, no cuánto de lo que tienes en el estante vino del extranjero, ni un puntaje de seguridad de suministro.'
      : 'Counts import dollars (which carry freight a farm-gate price does not) against domestic apparent consumption — a dollar comparison, not how much of what is on your shelf came from abroad, and not a supply-security score.';
    P.push(`<p class="ci-supply__p ci-supply__rel"><strong>${lead}</strong>${over}${percap} <span class="ci-supply__caveat">${caveat}</span></p>`);
    faq = {
      q: es ? `¿Cuánto de ${esc(R.name || '')} se importa?` : `How much ${esc(R.name || '')} is imported?`,
      a: (lead + over + percap + ' ' + caveat).replace(/\s+/g, ' ').trim(),
    };
  }

  // ---- catchpair (seafood: wild landings vs same-year imports) ----
  if (hasCatch) {
    const ly = R.us_landings_year;
    const ann = R.import_annual_usd || {};
    const impSame = (ly != null && ann[ly] != null) ? ann[ly] : null;
    const impVal = impSame != null ? impSame : R.us_import_value_usd;
    const impYr = impSame != null ? ly : (R.import_year || (Object.keys(ann).map(Number).filter(Number.isFinite).sort((a, b) => b - a)[0] || null));
    const wildLead = R.us_landings_wild_minimal
      ? (es ? `Los desembarques silvestres de EE. UU. son mínimos para esta especie (${usd(R.us_landings_value_usd)}${ly ? `, ${ly}` : ''}) frente a ${usd(impVal)} de importaciones${impYr ? ` (${impYr})` : ''}.` : `US wild landings are minimal for this species (${usd(R.us_landings_value_usd)}${ly ? `, ${ly}` : ''}) beside ${usd(impVal)} of imports${impYr ? ` (${impYr})` : ''}.`)
      : (es ? `Los desembarques silvestres de EE. UU. fueron de ${usd(R.us_landings_value_usd)}${ly ? ` (${ly})` : ''}, junto a ${usd(impVal)} de importaciones el mismo año${impYr ? ` (${impYr})` : ''}.` : `US wild landings were ${usd(R.us_landings_value_usd)}${ly ? ` (${ly})` : ''}, beside ${usd(impVal)} of imports the same year${impYr ? ` (${impYr})` : ''}.`);
    const caveat = es
      ? 'Dos medidas distintas — valor en muelle (primera venta) de la captura silvestre frente al valor en aduana de las importaciones — no una razón de participación en el suministro.'
      : 'Two different measures — dockside ex-vessel (first-sale) value of the wild catch vs the customs value of imports — not a supply-share ratio.';
    const farmed = R.import_mostly_farmed ? ' ' + (es ? 'La mayoría de las importaciones de esta especie son de cultivo (acuicultura) en el extranjero.' : 'Most imports of this species are farmed abroad.') : '';
    P.push(`<p class="ci-supply__p ci-supply__rel"><strong>${wildLead}</strong> <span class="ci-supply__caveat">${caveat}${farmed}</span></p>`);
    if (!faq) faq = { q: es ? `¿De dónde viene ${esc(R.name || '')}?` : `Where does ${esc(R.name || '')} come from?`, a: (wildLead + ' ' + caveat + farmed).replace(/\s+/g, ' ').trim() };
  }

  if (!P.length) return { html: '', faq: null };

  const h2 = es ? 'De dónde llega' : 'Where it comes from';
  const intro = es
    ? `El panorama de suministro público de este ingrediente — comercio, producción nacional y (para mariscos) desembarques silvestres. Contexto descriptivo, nunca un pronóstico ni tu precio de entrega. Ficha completa en el <a href="${base}/cost-index/menu-pricing/#${esc(R.slug || '')}">registro del ingrediente</a>.`
    : `This ingredient's public supply picture — trade, domestic production, and (for seafood) wild landings. Descriptive context, never a forecast or your delivered price. Full record in the <a href="${base}/cost-index/menu-pricing/#${esc(R.slug || '')}">ingredient state record</a>.`;

  const html = `${SUPPLY_SENTINEL.start}<section class="ci-profile ci-supply" aria-labelledby="ci-supply-h">
    <h2 id="ci-supply-h">${h2}</h2>
    <p class="ci-supply__note">${intro}</p>
    ${P.join('\n    ')}
  </section>${SUPPLY_SENTINEL.end}`;

  return { html, faq };
}
