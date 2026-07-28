/**
 * seasonality-fusion.mjs — build-time joins that fuse the Ingredient State Record
 * (cost-index/ingredient-state-record.json) into the /open/seasonality/ hub, under
 * the absolute honesty contract. PURE + DETERMINISTIC (no `now`, no I/O): every
 * function takes plain data and returns plain data + a localized string map, so the
 * honesty-critical label/verdict language is unit-testable in isolation before it
 * ever renders.
 *
 * The contract this module enforces in its OWN output strings:
 *   - import_seasonal_index is import *VALUE* seasonality — never volume, tonnage, or
 *     supply share. Labels describe two price/value CALENDARS in phase, never a supply
 *     flow. Banned verbs: supplies/supplied/backfill/fills the gap/tonnage/volume.
 *   - import_source_hhi / import_reliance_pct are of import VALUE (a value proxy), never
 *     a supply-security score or a supply share.
 *   - A mechanism label is a STRUCTURAL shape-descriptor of the curve, never a price
 *     cause and never a forecast. "Domestic-season low" is inferred-from-phase, never
 *     asserted as a measured harvest calendar.
 *   - A swap verdict certifies calendar OFFSET only. Co-movement is co-occurrence, never
 *     cause — "shared calendar", never "driving".
 *   - Degrade by absence: a missing field drops its output, never a synthesized value.
 *
 * node scripts/lib/seasonality-fusion.mjs --self-test
 */

// ---- month helpers -------------------------------------------------------------
export const MONTHS_EN = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTHS_ES = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const moName = (m, es) => (es ? MONTHS_ES : MONTHS_EN)[m] || '';

// A short "{a} and {b}" / "{a}, {b} and {c}" join in the locale.
function joinMonths(mos, es) {
  const names = mos.map((m) => moName(m, es));
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return names[0] + (es ? ' y ' : ' and ') + names[1];
  return names.slice(0, -1).join(', ') + (es ? ' y ' : ' and ') + names[names.length - 1];
}

// slugify a hedge_swap DISPLAY NAME ("Cherry tomato" -> "cherry-tomato") so it can be
// resolved against the classified set. Best-effort; the caller degrades if unresolved.
export function slugifyName(name) {
  if (typeof name !== 'string' || !name.trim()) return null;
  return name.trim().toLowerCase()
    .replace(/[’'".,()]/g, '')
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ---- mechanism label (§4 — "why the low lands", value-only, no supply verbs) ----
// Deterministic structural descriptor of the import-VALUE calendar relative to the
// domestic trough. Never a cause, never a supply flow.
//
// Returns { key, importPeakMonths, hhi, reliance, relianceScope } or a domestic/absent
// marker. Localized strings come from MECHANISM_STRINGS[key](ctx, es).
export function mechanismFor(isr, cheapMonth) {
  const idx = isr && Array.isArray(isr.import_seasonal_index) && isr.import_seasonal_index.length === 12
    ? isr.import_seasonal_index.map(Number) : null;
  const hhi = isr && typeof isr.import_source_hhi === 'number' ? isr.import_source_hhi : null;
  const reliance = isr && typeof isr.import_reliance_pct === 'number' ? isr.import_reliance_pct : null;
  const relianceScope = isr && typeof isr.import_reliance_scope === 'string' ? isr.import_reliance_scope : null;

  // No import-value calendar at all → domestic-supplied item (e.g. whole chicken).
  if (!idx || idx.some((v) => !isFinite(v))) {
    return { key: 'domestic-only', importPeakMonths: [], hhi, reliance, relianceScope };
  }

  // Peak months of the import-value index (top values, ±5% of the max).
  const max = Math.max(...idx);
  const peakMonths = [];
  for (let m = 1; m <= 12; m++) if (idx[m - 1] >= max * 0.95) peakMonths.push(m);

  // Counter-phase test: is import value elevated (>=1.05 of its own mean≈1.0) in the
  // month the domestic reference troughs? If so the two calendars run counter.
  const vCheap = (cheapMonth >= 1 && cheapMonth <= 12) ? idx[cheapMonth - 1] : null;
  const counterPhase = vCheap != null && vCheap >= 1.05;

  const key = counterPhase ? 'counter-phase' : 'domestic-low';
  return { key, importPeakMonths: peakMonths, hhi, reliance, relianceScope, vCheap };
}

// Is this item's import value concentrated in a single origin (a VALUE share, not a
// supply share)? A supplementary structural chip, shown beside the mechanism label.
export function concentrationFor(isr) {
  const hhi = isr && typeof isr.import_source_hhi === 'number' ? isr.import_source_hhi : null;
  const reliance = isr && typeof isr.import_reliance_pct === 'number' ? isr.import_reliance_pct : null;
  const top = isr && Array.isArray(isr.import_top_sources) && isr.import_top_sources[0]
    ? isr.import_top_sources[0] : null;
  if (hhi == null || hhi < 0.5 || !top || typeof top.country !== 'string') return null;
  return { hhi, reliance, country: top.country, sharePct: top.share_pct };
}

// Localized mechanism strings. Each returns { label, tag } — label is the short chip,
// tag is the one-sentence structural gloss. NO supply verbs, NO cause, NO forecast.
export const MECHANISM_STRINGS = {
  'counter-phase': (ctx, es) => {
    const pk = joinMonths(ctx.importPeakMonths.slice(0, 3), es);
    return {
      label: es ? 'Valor de importación en contrafase' : 'Import-value counter-phase',
      tag: es
        ? `El valor de las importaciones sube en ${pk}, cuando la referencia mayorista nacional baja — dos calendarios en contrafase.`
        : `Import value rises in ${pk}, when the domestic wholesale reference dips — two calendars in counter-phase.`,
    };
  },
  'domestic-low': (ctx, es) => ({
    label: es ? 'Mínimo de temporada nacional' : 'Domestic-season low (not import-aligned)',
    tag: es
      ? 'Inferido de que la referencia nacional toca fondo mientras el valor de importación no está en su punto alto — no es un calendario de cosecha medido.'
      : 'Inferred from the domestic reference troughing while import value is not peaking — not a measured harvest calendar.',
  }),
  'domestic-only': (ctx, es) => ({
    label: es ? 'De origen nacional (sin calendario de importación)' : 'Domestically sourced (no import calendar)',
    tag: es
      ? 'No lleva un calendario de valor de importación; su forma la fija el mercado nacional.'
      : 'Carries no import-value calendar; its shape is set by the domestic market.',
  }),
};

export function concentrationString(c, es) {
  const rel = c.reliance != null
    ? (es ? ` con dependencia-por-valor ${c.reliance}%` : ` with reliance-by-value ${c.reliance}%`)
    : '';
  return {
    label: es ? 'Valor de importación concentrado' : 'Concentrated single-origin import value',
    tag: es
      ? `Valor de importación concentrado en un origen (${c.country}, HHI ${c.hhi.toFixed(2)}, una cuota de valor)${rel} — dónde se sitúa el valor de importación anual.`
      : `Import value concentrated in one origin (${c.country}, HHI ${c.hhi.toFixed(2)}, a value share)${rel} — where year-round import value sits.`,
  };
}

// The load-bearing §4 caveat (value, never volume; two calendars, not a cause).
export function mechanismCaveat(es) {
  return es
    ? 'Dos calendarios mostrados uno al lado del otro — ninguno causa al otro. La cifra de importación es estacionalidad del valor nominal de importación, nunca volumen, tonelaje ni cuota de oferta; el HHI es concentración del valor de importación, no de la oferta total; la dependencia es un proxy de valor, no una puntuación de seguridad de suministro. Describe la forma de la curva vía la estructura del valor de importación — nunca una causa de precio, nunca un flujo de oferta y nunca un pronóstico.'
    : "Two calendars shown beside each other — one is not causing the other. The import figure is nominal import-value seasonality, never volume, tonnage, or supply share; HHI is concentration of import value, not of total supply; reliance is a value proxy, not a supply-security score. This describes the curve's shape via import-value structure — never a price cause, never a supply flow, and never a forecast.";
}

// ---- Swap Validator (§6 — certifies calendar OFFSET only) -----------------------
// Given the anchor's cheapest/dearest month and a candidate swap's cheapest/dearest
// month (both from the seasonal digest), plus whether they co-move, return a verdict.
// Verdict certifies calendar offset, never a price outcome, never a shared cause.
//
//   anchor: { slug, name, cheap, dear }
//   swap:   { slug, name, cheap, dear }  (resolved from hedge_swap name; null if unresolved)
//   coMove: boolean (swap appears in anchor.comovers)
// Circular month distance, 0..6 (Jan and Dec are 1 apart, not 11).
export function monthDist(a, b) {
  const d = Math.abs(a - b) % 12;
  return Math.min(d, 12 - d);
}
export function swapVerdict(anchor, swap, coMove) {
  if (!swap || !swap.cheap || !anchor || !anchor.cheap) return { key: 'unknown' };
  const dist = monthDist(anchor.cheap, swap.cheap);
  // Share a cheap month → calendars co-peak, so switching gives no cover. With co-movement
  // it is a plausibly shared calendar; either way it is not a hedge.
  if (dist === 0) return coMove ? { key: 'shared-calendar' } : { key: 'mirror' };
  // Swap cheapest roughly opposite the anchor's cheap month (≥4 months around the circle)
  // → it tends to sit at its own low while the anchor is dearer. Offset calendars.
  if (dist >= 4) return { key: 'real-hedge' };
  // 1–3 months apart → partial offset.
  return { key: 'offset' };
}

export const SWAP_STRINGS = {
  'real-hedge': (ctx, es) => ({
    label: es ? 'Cobertura real' : 'Real hedge',
    line: es
      ? `${ctx.swapName} está más barato en ${moName(ctx.swapCheap, es)}, casi opuesto al mes barato de ${ctx.anchorName} (${moName(ctx.anchorCheap, es)}) — así que tiende a estar en su mínimo cuando ${ctx.anchorName} está más caro. Calendarios desfasados.`
      : `${ctx.swapName} is cheapest in ${moName(ctx.swapCheap, es)}, roughly opposite ${ctx.anchorName}'s cheap month (${moName(ctx.anchorCheap, es)}) — so it tends to sit at its own low when ${ctx.anchorName} is dearer. Offset calendars.`,
  }),
  'offset': (ctx, es) => ({
    label: es ? 'Desfase parcial' : 'Partial offset',
    line: es
      ? `${ctx.swapName} no comparte el mes barato de ${ctx.anchorName}, pero su mínimo está solo a unos meses — un desfase parcial, no opuesto.`
      : `${ctx.swapName} doesn't share ${ctx.anchorName}'s cheap month, but its low is only a few months off — a partial offset, not opposite.`,
  }),
  'mirror': (ctx, es) => ({
    label: es ? 'Espejo — no te ahorra' : "Mirror — won't save you",
    line: es
      ? `${ctx.swapName} y ${ctx.anchorName} comparten el mismo mes barato (${moName(ctx.anchorCheap, es)}) — sus calendarios suben y bajan juntos, así que cambiar no te cubre.`
      : `${ctx.swapName} and ${ctx.anchorName} share the same cheap month (${moName(ctx.anchorCheap, es)}) — their calendars rise and fall together, so switching gives no cover.`,
  }),
  'shared-calendar': (ctx, es) => ({
    label: es ? 'Calendario compartido' : 'Shared calendar',
    line: es
      ? `${ctx.swapName} y ${ctx.anchorName} comparten un mes barato y se mueven juntos — un calendario plausiblemente compartido, no una cobertura.`
      : `${ctx.swapName} and ${ctx.anchorName} share a cheap month and co-move — a plausibly shared calendar, not a hedge.`,
  }),
};

export function swapCaveat(es) {
  return es
    ? 'La co-ocurrencia es una fracción de los propios movimientos de un artículo — coincidencia en el tiempo, no una causa, sin coeficiente, adelanto ni retraso. Un mes barato compartido nombra un calendario plausiblemente compartido; esto certifica el desfase de calendario, no promete un resultado de precio y no afirma ninguna causa compartida.'
    : "Co-movement is a fraction of one item's own moves — co-occurrence, not cause, with no coefficient, lead, or lag. A shared cheap month names a plausibly shared calendar; this certifies calendar offset, it does not promise a price outcome and asserts no shared cause.";
}

// ---- headline range (§0 — build-derived, never hardcoded) -----------------------
// The classified field-crop save_pct distribution's central band (p20–p80), so the
// hero copy templates "{loSave}–{hiSave}%" from data and can't drift.
export function headlineRange(saves) {
  const xs = (saves || []).filter((v) => typeof v === 'number' && isFinite(v) && v > 0)
    .slice().sort((a, b) => a - b);
  if (!xs.length) return null;
  const pct = (p) => {
    const idx = (p / 100) * (xs.length - 1);
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    return Math.round(lo === hi ? xs[lo] : xs[lo] + (xs[hi] - xs[lo]) * (idx - lo));
  };
  return { loSave: pct(20), hiSave: pct(80), n: xs.length };
}

// ---- self-test ------------------------------------------------------------------
function selfTest() {
  let pass = 0, fail = 0;
  const ok = (name, cond) => { if (cond) pass++; else { fail++; console.error('  ✗ ' + name); } };
  const BANNED = /\b(supplies|supplied|supply\s+share|backfill|backfills|backfilled|fills?\s+the\s+gap|tonnage|volume)\b/i;
  const CAUSAL = /\b(driv(e|es|ing)|caused?|because\s+of\s+the\s+price)\b/i;
  const FORECAST = /\b(forecast|projected|will\s+(rise|fall|climb|drop)|next\s+(year|month|season))\b/i;

  // mechanism: domestic-only (null index)
  const m1 = mechanismFor({ import_seasonal_index: null, import_source_hhi: null, import_reliance_pct: null }, 5);
  ok('null index → domestic-only', m1.key === 'domestic-only');

  // mechanism: counter-phase (import value high at cheap month)
  const idxCP = [1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3];
  const m2 = mechanismFor({ import_seasonal_index: idxCP, import_source_hhi: 0.4, import_reliance_pct: 30 }, 1);
  ok('import high at cheap month → counter-phase', m2.key === 'counter-phase');
  const m3 = mechanismFor({ import_seasonal_index: idxCP, import_source_hhi: 0.4, import_reliance_pct: 30 }, 6);
  ok('import low at cheap month → domestic-low', m3.key === 'domestic-low');

  // localized strings carry no banned verbs / cause / forecast (EN + ES, all keys)
  for (const key of Object.keys(MECHANISM_STRINGS)) {
    for (const es of [false, true]) {
      const s = MECHANISM_STRINGS[key]({ importPeakMonths: [11, 12], hhi: 0.6, reliance: 80 }, es);
      const blob = s.label + ' ' + s.tag;
      ok(`mechanism ${key} ${es ? 'es' : 'en'} no banned verb`, !BANNED.test(blob));
      ok(`mechanism ${key} ${es ? 'es' : 'en'} no causal`, !CAUSAL.test(blob));
      ok(`mechanism ${key} ${es ? 'es' : 'en'} no forecast`, !FORECAST.test(blob));
    }
  }
  // concentration string honesty
  const c = concentrationFor({ import_source_hhi: 0.68, import_reliance_pct: 81, import_top_sources: [{ country: 'Mexico', share_pct: 81 }] });
  ok('concentration detected', c && c.country === 'Mexico');
  for (const es of [false, true]) {
    const cs = concentrationString(c, es);
    const blob = cs.label + ' ' + cs.tag;
    ok(`concentration ${es ? 'es' : 'en'} no banned verb`, !BANNED.test(blob));
    ok(`concentration ${es ? 'es' : 'en'} says value share`, /value share|cuota de valor/.test(blob));
  }
  ok('low HHI → no concentration', concentrationFor({ import_source_hhi: 0.2, import_reliance_pct: 10, import_top_sources: [{ country: 'X', share_pct: 20 }] }) === null);

  // mechanism caveat honesty — the caveat is the DISCLAIMER element (gate-exempt from the
  // positive banned-token scan), so it legitimately names "never volume, tonnage, or supply
  // share". We assert the disclaimer is PRESENT, never that it omits the words it disclaims.
  for (const es of [false, true]) {
    const cav = mechanismCaveat(es);
    ok(`mech caveat ${es ? 'es' : 'en'} says never volume`, /never volume|nunca volumen/.test(cav));
    ok(`mech caveat ${es ? 'es' : 'en'} says value proxy`, /value proxy|proxy de valor/.test(cav));
  }

  // swap verdicts
  const anchor = { slug: 'tomato', name: 'Tomato', cheap: 3, dear: 9 };
  ok('swap cheap at anchor dear → real-hedge', swapVerdict(anchor, { slug: 's', name: 'S', cheap: 9, dear: 3 }, false).key === 'real-hedge');
  ok('swap shares cheap, co-move → shared-calendar', swapVerdict(anchor, { slug: 's', name: 'S', cheap: 3, dear: 9 }, true).key === 'shared-calendar');
  ok('swap shares cheap, no co-move → mirror', swapVerdict(anchor, { slug: 's', name: 'S', cheap: 3, dear: 9 }, false).key === 'mirror');
  ok('unresolved swap → unknown', swapVerdict(anchor, null, false).key === 'unknown');
  for (const key of Object.keys(SWAP_STRINGS)) {
    for (const es of [false, true]) {
      const s = SWAP_STRINGS[key]({ anchorName: 'Tomato', swapName: 'Cherry tomato', anchorCheap: 3, anchorDear: 9, swapCheap: 9 }, es);
      const blob = s.label + ' ' + s.line;
      ok(`swap ${key} ${es ? 'es' : 'en'} no causal driving`, !CAUSAL.test(blob));
      ok(`swap ${key} ${es ? 'es' : 'en'} no forecast`, !FORECAST.test(blob));
    }
  }
  for (const es of [false, true]) ok(`swap caveat ${es ? 'es' : 'en'} co-occurrence`, /co-occurrence|coincidencia en el tiempo/.test(swapCaveat(es)));

  // slugify
  ok('slugify Cherry tomato', slugifyName('Cherry tomato') === 'cherry-tomato');
  ok('slugify Short rib', slugifyName('Short rib') === 'short-rib');
  ok('slugify null', slugifyName(null) === null);

  // headline range
  const hr = headlineRange([20, 30, 40, 50, 60, 70, 80]);
  ok('headline range p20/p80', hr && hr.loSave <= hr.hiSave && hr.n === 7);
  ok('headline range empty → null', headlineRange([]) === null);

  console.log(`seasonality-fusion self-test: ${pass}/${pass + fail} passed.`);
  return fail === 0;
}

if (process.argv[1] && process.argv[1].endsWith('seasonality-fusion.mjs') && process.argv.includes('--self-test')) {
  process.exit(selfTest() ? 0 : 1);
}
