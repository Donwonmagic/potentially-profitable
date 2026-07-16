/**
 * cost-research.mjs — the Muntin Cost-Index RESEARCH surface (/cost-index/research/).
 *
 * Original, computed analysis that repackages the open datasets into reads a DMV
 * independent operator can act on — the "data company, not data aggregator" line.
 * Every number is DERIVED here from a committed dataset (events/co-movement, yields,
 * lock-or-float, seasonality); nothing is hand-typed. Honesty contract (ADR-010/-015):
 * descriptive/computed, NEVER a forecast; co-occurrence, never cause; a wholesale
 * reference vs its own normal, never a delivered price.
 *
 * Self-contained: it loads its own data and is handed only the site chrome
 * (pageHead/pageTail/escHtml/clampDesc), the slug→name LABELS, and repoRoot.
 * Consumed by build-cost-index-pages.mjs, which spreads researchTargets() into its
 * page list. Honesty-gated by scripts/check-cost-research.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadEventsData, coMovement, companyStat, durationSummary } from './cost-events-analysis.mjs';

const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
const CCBY = 'https://creativecommons.org/licenses/by/4.0/';

// ---- data loading ------------------------------------------------------
function rd(repoRoot, rel) { return JSON.parse(fs.readFileSync(path.join(repoRoot, rel), 'utf8')); }
function yieldRows(repoRoot) {
  const y = rd(repoRoot, 'data/ingredient-yields.json');
  return Array.isArray(y) ? y : (y.ingredients || y.items || Object.values(y).find(Array.isArray));
}

// ---- analysis (all deterministic) --------------------------------------

// F1 — co-movement CLUSTERS. Undirected edge a—b when EITHER direction shared ≥ MIN
// of that anchor's own notable moves; connected components ≥2 are the clusters. The
// honest read is substitution futility: swapping within a cluster buys nothing.
function clusters(events, MIN = 3) {
  const cm = coMovement(events);
  const anchors = Object.keys(cm);
  const adj = new Map(anchors.map((a) => [a, new Set()]));
  const pairK = new Map(); // "a|b" (sorted) -> max shared count seen either direction
  for (const a of anchors) {
    for (const [b, k] of cm[a].neighbors) {
      if (k < MIN) continue;
      if (!adj.has(a)) adj.set(a, new Set());
      if (!adj.has(b)) adj.set(b, new Set());
      adj.get(a).add(b); adj.get(b).add(a);
      const key = [a, b].sort().join('|');
      pairK.set(key, Math.max(pairK.get(key) || 0, k));
    }
  }
  const seen = new Set(); const out = [];
  for (const a of anchors) {
    if (seen.has(a) || !adj.get(a) || !adj.get(a).size) continue;
    const comp = []; const stack = [a];
    while (stack.length) { const x = stack.pop(); if (seen.has(x)) continue; seen.add(x); comp.push(x); for (const nb of (adj.get(x) || [])) if (!seen.has(nb)) stack.push(nb); }
    if (comp.length < 2) continue;
    // tightest internal pair (max shared count)
    let tight = null;
    for (let i = 0; i < comp.length; i++) for (let j = i + 1; j < comp.length; j++) {
      const key = [comp[i], comp[j]].sort().join('|'); const k = pairK.get(key);
      if (k != null && (!tight || k > tight.k)) tight = { a: comp[i], b: comp[j], k };
    }
    out.push({ members: comp.sort(), size: comp.length, tight });
  }
  return out.sort((x, y) => y.size - x.size || (y.tight?.k || 0) - (x.tight?.k || 0));
}

// F2 — trim tax by category. Mean edible yield per category → trim tax = 1/mean.
function trimTaxByCategory(rows) {
  const byCat = {};
  for (const r of rows) { (byCat[r.cat] = byCat[r.cat] || []).push(r.yield); }
  const cats = Object.keys(byCat).map((cat) => {
    const ys = byCat[cat]; const mean = ys.reduce((s, v) => s + v, 0) / ys.length;
    return { cat, n: ys.length, meanYield: mean, tax: 1 / mean };
  });
  return cats.sort((a, b) => b.tax - a.tax);
}
// worst individual offenders (lowest yield = highest tax), for the lede number.
function worstYields(rows, n = 8) {
  return rows.slice().sort((a, b) => a.yield - b.yield).slice(0, n)
    .map((r) => ({ slug: r.slug, en: r.en, es: r.es, yield: r.yield, tax: 1 / r.yield }));
}

// F3 — steady-vs-wild taxonomy from lock-or-float buckets.
function volatilityTaxonomy(repoRoot) {
  const lf = rd(repoRoot, 'data/cost-lockfloat.json');
  const counts = lf.counts || {};
  const items = lf.items || {};
  const pick = (bucket, n) => Object.keys(items).filter((s) => items[s].bucket === bucket)
    .sort((a, b) => items[a].halfWidthPct - items[b].halfWidthPct)
    .slice(0, n).map((s) => ({ slug: s, name: items[s].name, halfWidthPct: items[s].halfWidthPct }));
  const wildPick = (bucket, n) => Object.keys(items).filter((s) => items[s].bucket === bucket)
    .sort((a, b) => items[b].halfWidthPct - items[a].halfWidthPct)
    .slice(0, n).map((s) => ({ slug: s, name: items[s].name, halfWidthPct: items[s].halfWidthPct }));
  const total = Object.keys(items).length;
  return { counts, total, lock: pick('lock', 8), float: wildPick('float', 8), asOf: lf.asOf || null };
}

// F4 — shock duration study (historical, never a forecast).
function shockDuration(events) {
  const d = durationSummary(events); const c = companyStat(events);
  return { ...d, up: c.up, down: c.down, withCompany: c.withCompany, pct: c.pct, total: c.total,
    medianMonths: Math.round(d.medianDays / 30.4 * 10) / 10, p75Months: Math.round(d.p75 / 30.4 * 10) / 10 };
}

// F5 — cheapest-month calendar. Per ready ingredient, the month of its lowest median.
function cheapestMonthCalendar(repoRoot) {
  const sea = rd(repoRoot, 'data/seasonality.json');
  const ready = (sea.ingredients || []).filter((i) => i.ready && i.months && Object.keys(i.months).length);
  const byMonth = {}; for (let m = 1; m <= 12; m++) byMonth[m] = [];
  for (const i of ready) {
    let lo = null;
    for (const m of Object.keys(i.months)) { const med = i.months[m].medianCents; if (lo == null || med < i.months[lo].medianCents) lo = m; }
    // savings vs its own priciest month
    let hi = null; for (const m of Object.keys(i.months)) { const med = i.months[m].medianCents; if (hi == null || med > i.months[hi].medianCents) hi = m; }
    const loMed = i.months[lo].medianCents, hiMed = i.months[hi].medianCents;
    const savePct = hiMed > 0 ? Math.round((hiMed - loMed) / hiMed * 100) : 0;
    byMonth[Number(lo)].push({ slug: i.key, savePct });
  }
  for (const m of Object.keys(byMonth)) byMonth[m].sort((a, b) => b.savePct - a.savePct);
  return { byMonth, readyN: ready.length };
}

// F6 — the protein map. Cross-joins lock-or-float (the pricing-posture verdict) with the
// co-movement clusters, restricted to center-of-plate proteins — the operator's biggest cost
// line. The honest read is counterintuitive: the pricey proteins mostly hold, and swapping
// within a protein family (breast↔thigh) buys nothing because the family moves together.
const PROTEIN_RE = /chicken|turkey|pork|beef|ribeye|striploin|short rib|tenderloin|crab|lobster|clam|mussel|shrimp|scallop|salmon|tuna|trout|halibut|octopus|ground/i;
function proteinMap(repoRoot, events, rows) {
  const lf = rd(repoRoot, 'data/cost-lockfloat.json');
  // {en, es} per slug — from yields; lock-or-float names (English) as fallback for both locales.
  const nm = {}; for (const r of rows) nm[r.slug] = { en: r.en, es: r.es };
  for (const s of Object.keys(lf.items)) if (!nm[s]) nm[s] = { en: lf.items[s].name, es: lf.items[s].name };
  const NM = (s) => nm[s] || { en: s, es: s };
  const CATP = new Set(['beef', 'meat', 'seafood', 'shellfish', 'poultry']);
  const catBySlug = {}; for (const r of rows) catBySlug[r.slug] = r.cat;
  const isProtein = (s) => CATP.has(catBySlug[s]) || PROTEIN_RE.test((nm[s] && nm[s].en) || '');
  const proteinSlugs = new Set([...Object.keys(lf.items).filter(isProtein), ...rows.map((r) => r.slug).filter(isProtein)]);
  // the lock-or-float verdict per protein that HAS one (dropping the raw price level, as the dataset does)
  const scored = [...proteinSlugs].filter((s) => lf.items[s]).map((s) => ({
    slug: s, en: NM(s).en, es: NM(s).es, bucket: lf.items[s].bucket, halfWidthPct: Math.round(lf.items[s].halfWidthPct * 100 * 10) / 10,
  }));
  const counts = scored.reduce((o, x) => { o[x.bucket] = (o[x.bucket] || 0) + 1; return o; }, {});
  const lockList = scored.filter((x) => x.bucket === 'lock').sort((a, b) => a.halfWidthPct - b.halfWidthPct);
  const cushionList = scored.filter((x) => x.bucket === 'cushion').sort((a, b) => a.halfWidthPct - b.halfWidthPct);
  // co-moving protein families (clusters with ≥2 protein members)
  const cl = clusters(events);
  const families = cl.map((c) => ({ members: c.members.filter((m) => proteinSlugs.has(m)), tight: c.tight }))
    .filter((c) => c.members.length >= 2)
    .map((c) => ({ members: c.members.map((m) => NM(m)), tightK: c.tight.k, a: NM(c.tight.a), b: NM(c.tight.b) }));
  return { total: scored.length, counts, lockList, cushionList, families };
}

export function researchInputs(repoRoot) {
  const events = loadEventsData(repoRoot);
  const rows = yieldRows(repoRoot);
  return {
    clusters: clusters(events),
    company: companyStat(events),
    trimTaxCats: trimTaxByCategory(rows),
    worstYields: worstYields(rows),
    volatility: volatilityTaxonomy(repoRoot),
    duration: shockDuration(events),
    calendar: cheapestMonthCalendar(repoRoot),
    proteins: proteinMap(repoRoot, events, rows),
    yieldCount: rows.length,
  };
}

// ---- the menu-pricing playbook: one card per ingredient, joining every layer ----------
// For each ingredient with a pricing-posture verdict, join: lock-or-float (print/cushion/float/
// withhold + band + coverage), yield (edible % + trim tax = 1/yield), seasonality (cheapest month
// + how far under its own high), and co-movement (the tightest same-direction companion — the swap
// that buys nothing). Honest nulls where a layer is missing. Every number is computed here.
const MONTH_ABBR_EN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_ABBR_ES = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const TIMING_MIN_SAVE = 15; // below this, calendar-timing isn't worth chasing (flat item)
export function pricingCards(repoRoot) {
  const rows = yieldRows(repoRoot);
  const yBySlug = {}; for (const r of rows) yBySlug[r.slug] = r;
  const lf = rd(repoRoot, 'data/cost-lockfloat.json').items;
  const sea = (rd(repoRoot, 'data/seasonality.json').ingredients || []).filter((i) => i.ready && i.months);
  const seaBySlug = {}; for (const i of sea) seaBySlug[i.key] = i;
  const cm = coMovement(loadEventsData(repoRoot));
  const NM = nameMap(repoRoot);
  const nm = (s) => NM[s] || { en: s, es: s };
  // cheapest month + savings vs own priciest, for a ready seasonality ingredient. A "window" is
  // only READABLE when the trough is robust against the ordinary within-month price scatter —
  // otherwise the low month is just a noisy median draw (whole turkey's Feb median sits ABOVE
  // January's own 25th-percentile week, so a typical January buys cheaper than a typical February;
  // "cheapest in Feb" is noise, not a season). Require the trough month's median to beat the PEAK
  // month's p25 AND the peak-to-trough swing to be at least the typical within-month IQR. Fails →
  // no window (price it year-round), never a bogus calendar play. This is what year-round-produced
  // proteins mostly land on — the honest read, item by item, not a category rule.
  const timingFor = (s) => {
    const i = seaBySlug[s]; if (!i) return null;
    const ms = Object.keys(i.months);
    let lo = null, hi = null;
    for (const m of ms) { const v = i.months[m].medianCents; if (lo == null || v < i.months[lo].medianCents) lo = m; if (hi == null || v > i.months[hi].medianCents) hi = m; }
    const loM = i.months[lo], hiM = i.months[hi];
    const save = hiM.medianCents > 0 ? Math.round((hiM.medianCents - loM.medianCents) / hiM.medianCents * 100) : 0;
    const iqrs = ms.map((m) => i.months[m].p75Cents - i.months[m].p25Cents).sort((a, b) => a - b);
    const medIQR = iqrs[Math.floor(iqrs.length / 2)];
    const amp = hiM.medianCents - loM.medianCents;
    const robust = loM.medianCents < hiM.p25Cents && amp >= medIQR;
    if (!robust) return { cheapMonth: null, savePct: null, worthTiming: false, reason: 'noisy' };
    return { cheapMonth: Number(lo), savePct: save, worthTiming: save >= TIMING_MIN_SAVE, reason: save >= TIMING_MIN_SAVE ? 'worth' : 'flat' };
  };
  const swapFor = (s) => {
    const a = cm[s]; if (!a || !a.neighbors || !a.neighbors.length) return null;
    const [nbSlug, k] = a.neighbors[0]; // tightest same-direction companion
    // Only a STRONG companion supports the "a swap buys nothing" read — it must have shared at
    // least half of this ingredient's own notable moves. A weak co-mover (e.g. 2 of 6) is noise.
    if (!(a.n >= 2 && k / a.n >= 0.5)) return null;
    // A co-mover is only a plausible SUBSTITUTE if it shares the ingredient's category. Cross-category
    // companions (onion co-moving with short rib) move together in the market but nobody plates one
    // for the other — so we surface them as "companion, not a substitute," never a futile swap.
    const cs = yBySlug[s] ? yBySlug[s].cat : null; const cn = yBySlug[nbSlug] ? yBySlug[nbSlug].cat : null;
    const sameCat = cs != null && cn != null && cs === cn;
    return { slug: nbSlug, en: nm(nbSlug).en, es: nm(nbSlug).es, k, n: a.n, sameCat };
  };
  const cards = Object.keys(lf).filter((s) => lf[s] && lf[s].bucket).map((s) => {
    const y = yBySlug[s]; const t = timingFor(s); const sw = swapFor(s);
    const cat = y ? y.cat : null;
    return {
      slug: s, en: nm(s).en, es: nm(s).es, cat,
      bucket: lf[s].bucket,
      bandPct: Math.round(lf[s].halfWidthPct * 100 * 10) / 10,
      coverage: lf[s].coverage != null ? Math.round(lf[s].coverage * 100) : null,
      yieldPct: y ? Math.round(y.yield * 100) : null,
      trimTax: y ? Math.round((1 / y.yield) * 100) / 100 : null,
      cheapMonth: t ? t.cheapMonth : null,
      savePct: t ? t.savePct : null,
      worthTiming: t ? t.worthTiming : false,
      timingReason: t ? t.reason : 'thin',
      swap: sw,
    };
  });
  // stable, useful default sort: by posture (lock→cushion→float→withhold), then name
  const order = { lock: 0, cushion: 1, float: 2, withhold: 3 };
  cards.sort((a, b) => (order[a.bucket] - order[b.bucket]) || a.en.localeCompare(b.en));
  const counts = cards.reduce((o, c) => { o[c.bucket] = (o[c.bucket] || 0) + 1; return o; }, {});
  const layer4 = cards.filter((c) => c.yieldPct != null && c.cheapMonth != null && c.swap).length;
  return {
    cards, counts, total: cards.length, layer4,
    withYield: cards.filter((c) => c.yieldPct != null).length,
    withTiming: cards.filter((c) => c.worthTiming).length,
    monthAbbrEn: MONTH_ABBR_EN, monthAbbrEs: MONTH_ABBR_ES,
  };
}

// ---- render ------------------------------------------------------------
// slug→{en,es} display names, from the yields + lock-or-float data.
function nameMap(repoRoot) {
  const map = {};
  for (const r of yieldRows(repoRoot)) map[r.slug] = { en: r.en, es: r.es };
  try { const lf = rd(repoRoot, 'data/cost-lockfloat.json'); for (const s of Object.keys(lf.items)) if (!map[s]) map[s] = { en: lf.items[s].name, es: lf.items[s].name }; } catch { /* ok */ }
  return map;
}
// Bar/meter fill as a plain % of the scale max (0–100, no forced floor): the design's
// `.rs-bar__fill`/meters read `--v` and calc(var(--v)*1%), applying their own 2px min-width
// gating, so a true 0 renders empty while any value>0 keeps a hairline. Length is the only encoding.
const barV = (v, max) => (max > 0 ? Math.round((v / max) * 100) : 0);
// page.accent is "var(--teal)|var(--gold)|var(--season)" → the design's data-accent scope value.
function accentScope(accent) {
  const m = /--(\w+)\)/.exec(String(accent || ''));
  const a = m ? m[1] : 'teal';
  return (a === 'gold' || a === 'season') ? a : 'teal';
}

// Figure BODY renderers. Each returns inner HTML for the figure; renderFigure wraps it in the
// design's <figure class="rs-fig viz-figure"> with the writer's data-audio-alt + a .rs-fig__cap
// figcaption. DATAVIZ CONTRACT: every data mark is a single teal fill (--rs-fill) on a neutral
// 1px-bordered track; the per-page accent is chrome only. Fills read `--v` (a %-of-max number).
function figCompany(A, es) {
  const c = A.company;
  const say = es ? 'de los mayores movimientos detectados viajaron con un acompañante'
    : 'of the biggest detected moves traveled with a companion';
  const sub = es
    ? `${c.withCompany} de ${c.total} mayores movimientos detectados tuvieron compañía · ${c.alone} se movieron solos`
    : `${c.withCompany} of ${c.total} biggest detected moves had company · ${c.alone} moved alone`;
  return `<div class="rs-stat__row"><span class="rs-stat__num">${c.pct}%</span>`
    + `<span class="rs-stat__say">${say}</span></div>`
    + `<div class="rs-stat__proof"><div class="rs-stat__meter"><span class="rs-stat__meter-fill" style="--v:${c.pct}"></span></div>`
    + `<div class="rs-stat__proof-lab"><span>${es ? 'con compañía' : 'with company'} ${c.withCompany}</span>`
    + `<span>${es ? 'solos' : 'alone'} ${c.alone}</span></div></div>`
    + `<p class="rs-stat__sub">${sub}</p>`;
}
function figClusters(A, es, nm) {
  const top = A.clusters.slice(0, 6);
  return `<div class="rs-clusters">` + top.map((cl) => {
    const tightSet = new Set([cl.tight.a, cl.tight.b]);
    const chips = cl.members.map((s) => `<span class="rs-chip${tightSet.has(s) ? ' rs-chip--tight' : ''}">${nm(s, es)}</span>`).join('');
    const name = es ? `Clúster de ${cl.size} miembros` : `${cl.size}-member cluster`;
    const meta = es ? 'se hicieron compañía en ventanas compartidas' : 'kept company in shared windows';
    const lbl = es ? 'pareja más estrecha' : 'tightest couple';
    const shared = es ? `${cl.tight.k} movimientos compartidos` : `${cl.tight.k} shared moves`;
    return `<div class="rs-cluster"><p class="rs-cluster__name">${name}</p>`
      + `<p class="rs-cluster__meta">${meta}</p>`
      + `<div class="rs-cluster__chips">${chips}</div>`
      + `<div class="rs-cluster__couple">${lbl}: <span class="rs-cluster__couple-r">${nm(cl.tight.a, es)} + ${nm(cl.tight.b, es)} · ${shared}</span></div></div>`;
  }).join('') + `</div>`;
}
function figCatTax(A, es) {
  const cats = A.trimTaxCats; const max = Math.max(...cats.map((c) => c.tax));
  return `<div class="rs-bars">` + cats.map((c) => {
    return `<div class="rs-bar"><span class="rs-bar__label">${es ? catNameEs(c.cat) : c.cat}</span>`
      + `<span class="rs-bar__track"><span class="rs-bar__fill" style="--v:${barV(c.tax, max)}"></span></span>`
      + `<span class="rs-bar__val">×${c.tax.toFixed(2)}</span></div>`;
  }).join('') + `</div>`;
}
function figWorst(A, es, nm) {
  const cap = es ? 'Los artículos individuales de mayor merma' : 'Steepest single-item trim taxes';
  const head = es ? ['#', 'Ingrediente', 'Comestible', 'Impuesto de merma'] : ['#', 'Ingredient', 'Edible', 'Trim tax'];
  return `<div class="rs-scroll"><table class="rs-table"><caption>${cap}</caption>`
    + `<thead><tr><th class="rs-rank" scope="col">${head[0]}</th><th scope="col">${head[1]}</th>`
    + `<th class="rs-num" scope="col">${head[2]}</th><th class="rs-num" scope="col">${head[3]}</th></tr></thead><tbody>`
    + A.worstYields.map((w, i) => `<tr><td class="rs-rank">${i + 1}</td><th scope="row">${nm(w.slug, es)}</th>`
      + `<td class="rs-num">${Math.round(w.yield * 100)}%</td><td class="rs-num">×${(1 / w.yield).toFixed(2)}</td></tr>`).join('')
    + `</tbody></table></div>`;
}
function figTaxonomy(A, es) {
  const c = A.volatility.counts; const total = A.volatility.total;
  const lockPick = A.volatility.lock || []; const floatPick = A.volatility.float || [];
  const rep = (arr) => (arr.length ? `±${(arr[0].halfWidthPct * 100).toFixed(1)}%` : '');
  const cols = [
    { k: 'lock', lab: es ? 'Fijar' : 'Lock', def: es ? 'Estable para fijar un precio impreso' : 'Steady enough to print a price', items: lockPick, spread: lockPick.length ? `${es ? 'el más estable' : 'steadiest'} ${rep(lockPick)}` : '' },
    { k: 'cushion', lab: es ? 'Colchón' : 'Cushion', def: es ? 'Más o menos estable; un colchón modesto' : 'Steady-ish; a modest buffer', items: [], spread: '' },
    { k: 'float', lab: es ? 'Flotar' : 'Float', def: es ? 'Volátil; una línea de precio de mercado' : 'Wild enough for a market line', items: floatPick, spread: floatPick.length ? `${es ? 'el más volátil' : 'wildest'} ${rep(floatPick)}` : '' },
    { k: 'withhold', lab: es ? 'Reservar' : 'Withhold', def: es ? 'Muy poca evidencia para puntuar' : 'Too little evidence to score', items: [], spread: '' },
  ];
  const max = Math.max(...cols.map((x) => c[x.k] || 0));
  return `<div class="rs-tax">` + cols.map((col) => {
    const n = c[col.k] || 0;
    const chips = col.items.slice(0, 5).map((x) => `<span class="rs-chip">${x.name}</span>`).join('');
    return `<div class="rs-tax__col"><p class="rs-tax__label">${col.lab}</p>`
      + `<p class="rs-tax__count">${n} ${es ? 'ingredientes' : 'ingredients'}</p>`
      + `<div class="rs-tax__meter"><i style="--v:${barV(n, max)}"></i></div>`
      + (col.spread ? `<p class="rs-tax__spread">${col.spread}</p>` : '')
      + `<p class="rs-tax__def">${col.def}</p>`
      + (chips ? `<div class="rs-tax__items">${chips}</div>` : '') + `</div>`;
  }).join('') + `</div><p class="rs-fig__note">${es ? `de ${total} ingredientes evaluados` : `of ${total} ingredients scored`}</p>`;
}
function figSteadyWild(A, es) {
  // halfWidthPct is a FRACTION in the source (0.006 = ±0.6%); ×100 to the display percent the
  // research prose cites. Both lists share one magnitude scale so lengths compare across columns.
  const lock = A.volatility.lock || []; const float = A.volatility.float || [];
  const max = Math.max(...lock.concat(float).map((x) => x.halfWidthPct * 100));
  const col = (arr, head, sub) => `<div class="rs-duo__col"><p class="rs-duo__h">${head}</p><p class="rs-duo__sub">${sub}</p><div class="rs-bars">`
    + arr.map((x) => { const p = x.halfWidthPct * 100; return `<div class="rs-bar"><span class="rs-bar__label">${x.name}</span>`
      + `<span class="rs-bar__track"><span class="rs-bar__fill" style="--v:${barV(p, max)}"></span></span>`
      + `<span class="rs-bar__val">±${p.toFixed(1)}%</span></div>`; }).join('') + `</div></div>`;
  return `<div class="rs-duo">`
    + col(lock, es ? 'Los más estables' : 'Steadiest', es ? 'banda mayorista más estrecha' : 'tightest wholesale band')
    + col(float, es ? 'Los más salvajes' : 'Wildest', es ? 'banda mayorista más ancha' : 'widest wholesale band')
    + `</div>`;
}
function figDuration(A, es) {
  const d = A.duration; const max = d.p75 * 1.15;
  const L = (v) => Math.round((v / max) * 100);
  const medlab = es ? `mediana ${d.medianDays}d` : `median ${d.medianDays}d`;
  return `<div class="rs-range"><div class="rs-range__track" style="--p25:${L(d.p25)};--p75:${L(d.p75)};--med:${L(d.medianDays)}">`
    + `<span class="rs-range__medlab">${medlab}</span>`
    + `<span class="rs-range__band"></span>`
    + `<span class="rs-range__median"></span></div>`
    + `<div class="rs-range__ends"><span>p25 ${d.p25}d</span><span>p75 ${d.p75}d</span></div>`
    + `<div class="rs-range__axis"><span>0d</span><span>${Math.round(max / 2)}d</span><span>${Math.round(max)}d</span></div></div>`;
}
function figUpdown(A, es) {
  const d = A.duration; const max = Math.max(d.up, d.down);
  const bar = (lab, v) => `<div class="rs-bar"><span class="rs-bar__label">${lab}</span>`
    + `<span class="rs-bar__track"><span class="rs-bar__fill" style="--v:${barV(v, max)}"></span></span>`
    + `<span class="rs-bar__val">${v}</span></div>`;
  const note = es
    ? `De los ${d.total} movimientos, <strong>${d.up}</strong> fueron al alza y ${d.down} a la baja.`
    : `Of the ${d.total} moves, <strong>${d.up}</strong> ran up and ${d.down} eased down.`;
  return `<div class="rs-split">${bar(es ? 'Al alza' : 'Moves that ran up', d.up)}${bar(es ? 'A la baja' : 'Moves that eased down', d.down)}</div>`
    + `<p class="rs-split__note">${note}</p>`;
}
const MONTHS_EN = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_ES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
function figCalendar(A, es, nm) {
  const cal = A.calendar.byMonth;
  return `<div class="rs-cal">` + Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
    const items = (cal[m] || []).slice(0, 5);
    const mname = (es ? MONTHS_ES : MONTHS_EN)[m];
    if (!items.length) {
      return `<div class="rs-cal__m rs-cal__m--flat"><div class="rs-cal__mh"><span class="rs-cal__mname">${mname}</span>`
        + `<span class="rs-cal__mtag">${es ? 'SIN MÍNIMO' : 'NO LOW'}</span></div>`
        + `<p class="rs-cal__flatnote">${es ? 'ningún ingrediente toca fondo aquí' : 'no tracked low lands here'}</p></div>`;
    }
    const lis = items.map((x) => `<li class="rs-cal__item"><span>${nm(x.slug, es)}</span>`
      + `<span class="rs-cal__save">${x.savePct}%</span></li>`).join('');
    return `<div class="rs-cal__m"><div class="rs-cal__mh"><span class="rs-cal__mname">${mname}</span>`
      + `<span class="rs-cal__mtag">${es ? 'COMPRA' : 'BUY'}</span></div>`
      + `<ul class="rs-cal__list">${lis}</ul></div>`;
  }).join('') + `</div>`;
}
function figMethod(A, es) {
  const steps = es
    ? [['¿Se puede referenciar?', '¿El artículo tiene precio? Un nivel mayorista medido, no solo un índice direccional.'],
      ['Por encima del mayorista es normal', 'Un precio de entrega por encima del mayorista es NORMAL: flete, mano de obra y el margen del distribuidor.'],
      ['Vigila su propia historia', 'Vigila un precio de entrega muy por encima de su PROPIO historial reciente — entonces pregunta a tu proveedor.']]
    : [['Is it priceable?', 'Is the item priceable at all? A measured wholesale level, not just a directional index.'],
      ['Above wholesale is normal', 'A delivered price above wholesale is NORMAL — freight, labor, and the distributor’s margin.'],
      ['Watch its own history', 'Watch for a delivered price far above its OWN recent history — then ask your rep.']];
  return `<ol class="rs-steps">` + steps.map(([h, b]) => `<li class="rs-step"><span class="rs-step__n"></span>`
    + `<div><p class="rs-step__h">${h}</p><p class="rs-step__b">${b}</p></div></li>`).join('') + `</ol>`;
}
// Protein pricing-posture ranking: the lock + cushion proteins by band width (data mark = teal
// length only; bucket carried as muted text, never a status hue). Foot states the full split.
function figProteinLock(A, es) {
  const p = A.proteins;
  // Sort ALL shown proteins by band width globally (steadiest first) so the visual order matches
  // the "steadiest first … out to ribeye ±5.8%" caption — not lock-group-then-cushion-group.
  const list = p.lockList.concat(p.cushionList).slice().sort((a, b) => a.halfWidthPct - b.halfWidthPct);
  const max = Math.max(...list.map((x) => x.halfWidthPct), 1);
  const bars = list.map((x) => {
    const tag = x.bucket === 'lock' ? (es ? 'fijar' : 'lock') : (es ? 'cojín' : 'cushion');
    return `<div class="rs-bar"><span class="rs-bar__label">${es ? x.es : x.en}</span>`
      + `<span class="rs-bar__track"><span class="rs-bar__fill" style="--v:${barV(x.halfWidthPct, max)}"></span></span>`
      + `<span class="rs-bar__val">±${x.halfWidthPct.toFixed(1)}% <span class="rs-bar__val--muted">${tag}</span></span></div>`;
  }).join('');
  const c = p.counts;
  const foot = es
    ? `${c.lock || 0} para fijar, ${c.cushion || 0} con cojín, ${c.withhold || 0} sin evidencia suficiente — de ${p.total} proteínas con veredicto. Ninguna oscila lo bastante para flotar.`
    : `${c.lock || 0} lock, ${c.cushion || 0} cushion, ${c.withhold || 0} withheld for thin evidence — of ${p.total} proteins with a verdict. None swing wide enough to float.`;
  return `<div class="rs-bars">${bars}</div><p class="rs-fig__note">${foot}</p>`;
}
// Co-moving protein families (chicken breast↔thigh, ground pork↔shoulder): a within-family swap
// buys nothing because the family moves together.
function figProteinFamily(A, es) {
  return `<div class="rs-clusters">` + A.proteins.families.map((f) => {
    const chips = f.members.map((m) => `<span class="rs-chip${(m.en === f.a.en || m.en === f.b.en) ? ' rs-chip--tight' : ''}">${es ? m.es : m.en}</span>`).join('');
    const name = es ? `Familia de ${f.members.length}` : `${f.members.length}-member family`;
    const meta = es ? 'se movieron juntas en ventanas compartidas' : 'moved together in shared windows';
    const lbl = es ? 'movimientos compartidos' : 'shared moves';
    return `<div class="rs-cluster"><p class="rs-cluster__name">${name}</p>`
      + `<p class="rs-cluster__meta">${meta}</p><div class="rs-cluster__chips">${chips}</div>`
      + `<div class="rs-cluster__couple">${es ? f.a.es : f.a.en} + ${es ? f.b.es : f.b.en} · <span class="rs-cluster__couple-r">${f.tightK} ${lbl}</span></div></div>`;
  }).join('') + `</div>`;
}
// ============================================================================================
// BESPOKE playbook figures — purpose-built per section, NOT the rs-* research templates.
// Honesty contract holds: every data mark is a single teal length (--teal); the posture tint is an
// ORDINAL predictability ladder (print→withhold), never a red/green semaphore; every number is
// computed from the engine (pricingCards P / researchInputs A). Each returns a bare body; emitPlaybook
// wraps it in <figure class="rs-fig viz-figure"> with a figcaption + full data-audio-alt.
const PB_POSTURE = [['lock', { en: 'Print', es: 'Fijar' }], ['cushion', { en: 'Cushion', es: 'Colchón' }], ['float', { en: 'Float', es: 'Flotar' }], ['withhold', { en: 'Withhold', es: 'Reservar' }]];

// §1 — the 100-ingredient posture split as a UNIT GRID: one cell = one ingredient, ordered
// print→withhold, so the proportion is literal, not abstract. Legend carries the counts.
function pbFigSplit(P, es) {
  let cells = '';
  for (const [k] of PB_POSTURE) for (let i = 0; i < (P.counts[k] || 0); i++) cells += `<i class="pbf-cell pbf-cell--${k}"></i>`;
  const legend = PB_POSTURE.map(([k, lab]) => `<span class="pbf-key"><i class="pbf-cell pbf-cell--${k}"></i>${es ? lab.es : lab.en} <b>${P.counts[k] || 0}</b></span>`).join('');
  return `<div class="pbf pbf-split"><div class="pbf-grid" aria-hidden="true">${cells}</div><div class="pbf-legend">${legend}</div></div>`;
}

// §2 — "how far the price wanders": each item is a band CENTERED on its own normal, half-width ∝
// the ±band%. Steady staples/proteins render as slivers; wild produce as wide bands. Length = the
// whole story, one teal hue.
function pbFigBands(A, es) {
  const steady = (A.volatility.lock || []).slice(0, 5).map((x) => ({ n: x.name, w: x.halfWidthPct * 100 }));
  const wild = (A.volatility.float || []).slice(0, 5).map((x) => ({ n: x.name, w: x.halfWidthPct * 100 }));
  const max = Math.max(...steady.concat(wild).map((r) => r.w), 1);
  const row = (r) => `<div class="pbf-band"><span class="pbf-band__n">${r.n}</span>`
    + `<span class="pbf-band__track"><span class="pbf-band__fill" style="--hw:${Math.round((r.w / max) * 50)}"></span></span>`
    + `<span class="pbf-band__v">±${r.w.toFixed(1)}%</span></div>`;
  return `<div class="pbf pbf-bands">`
    + `<p class="pbf-grouph">${es ? 'Los más estables — se imprimen' : 'Steadiest — they print'}</p>${steady.map(row).join('')}`
    + `<p class="pbf-grouph">${es ? 'Los más salvajes — flotan' : 'Wildest — they float'}</p>${wild.map(row).join('')}`
    + `<div class="pbf-band__axis"><span>−</span><span class="pbf-band__c">${es ? 'su propio normal' : "each item's own normal"}</span><span>+</span></div></div>`;
}

// §3 — the trim tax as a SHRINK: one invoice pound (the track), with the edible share filled teal
// and the trimmed-away remainder left empty. The ×multiplier is what the plate pays for the loss.
function pbFigTrim(A, es) {
  const cats = A.trimTaxCats.slice();
  const pick = cats.slice(0, 5).concat(cats.slice(-2)); // steepest few + gentlest couple
  const row = (c) => { const edible = Math.round(c.meanYield * 100);
    return `<div class="pbf-trim"><span class="pbf-trim__n">${es ? catNameEs(c.cat) : c.cat}</span>`
      + `<span class="pbf-trim__bar"><span class="pbf-trim__edible" style="--e:${edible}"></span><b class="pbf-trim__e">${edible}%</b></span>`
      + `<span class="pbf-trim__x">×${c.tax.toFixed(2)}</span></div>`; };
  return `<div class="pbf pbf-trims"><div class="pbf-trim pbf-trim--head"><span class="pbf-trim__n"></span>`
    + `<span class="pbf-trim__bar pbf-trim__bar--head">${es ? 'porción comestible de 1 lb de factura' : 'edible share of one invoice pound'}</span>`
    + `<span class="pbf-trim__x">${es ? 'impuesto' : 'trim tax'}</span></div>${pick.map(row).join('')}</div>`;
}

// §4 — the hero: the hidden season of meat on a 12-MONTH AXIS. Each protein with a real (noise-gated)
// window is a teal column standing in its trough month, height ∝ how far under its own yearly high.
// The eye sees the backward shape — the grill cuts stand in Aug/Sep, after summer, not during it.
function pbFigSeason(P, es) {
  const MOA = es ? MONTH_ABBR_ES : MONTH_ABBR_EN;
  const wins = P.cards.filter((c) => c.timingReason === 'worth' && PROTEIN_RE.test(c.en))
    .map((c) => ({ n: es ? c.es : c.en, m: c.cheapMonth, s: c.savePct }));
  const maxS = Math.max(...wins.map((w) => w.s), 1);
  const byMonth = {}; for (const w of wins) (byMonth[w.m] = byMonth[w.m] || []).push(w);
  const cols = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
    const items = (byMonth[m] || []).sort((a, b) => b.s - a.s);
    const bars = items.map((w) => `<span class="pbf-cal__bar" style="--h:${Math.round((w.s / maxS) * 100)}"><b class="pbf-cal__save">−${w.s}%</b><b class="pbf-cal__cut">${w.n}</b></span>`).join('');
    return `<div class="pbf-cal__col${items.length ? ' is-on' : ''}"><div class="pbf-cal__stack">${bars}</div><span class="pbf-cal__m">${MOA[m]}</span></div>`;
  }).join('');
  return `<div class="pbf pbf-cal"><div class="pbf-cal__scroll"><div class="pbf-cal__row">${cols}</div></div></div>`;
}

// §5 — the swap that isn't: co-moving protein pairs face each other across a "shared moves" bar
// (k of n). A full bar means the two are a mirror — a swap trades one rising number for another.
function pbFigMirror(P, es) {
  const pairs = []; const seen = new Set();
  for (const c of P.cards) {
    if (!c.swap || !PROTEIN_RE.test(c.en) || !PROTEIN_RE.test(c.swap.en)) continue;
    const key = [c.en, c.swap.en].sort().join('|'); if (seen.has(key)) continue; seen.add(key);
    pairs.push({ a: es ? c.es : c.en, b: es ? c.swap.es : c.swap.en, k: c.swap.k, n: c.swap.n });
  }
  const row = (p) => `<div class="pbf-mir"><span class="pbf-mir__a">${p.a}</span>`
    + `<span class="pbf-mir__link"><span class="pbf-mir__track"><span class="pbf-mir__fill" style="--v:${Math.round((p.k / p.n) * 100)}"></span></span><b class="pbf-mir__k">${p.k}/${p.n}</b></span>`
    + `<span class="pbf-mir__b">${p.b}</span></div>`;
  return `<div class="pbf pbf-mirror">${pairs.map(row).join('')}`
    + `<p class="pbf-note">${es ? "de los movimientos notables del primer artículo, cuántos compartió su vecino — lleno = espejo" : "of the first item's notable moves, how many its neighbor shared — full bar = a mirror"}</p></div>`;
}

// shock duration as a bespoke range strip (median marker inside the p25–p75 band).
function pbFigDuration(A, es) {
  const d = A.duration; const max = d.p75 * 1.15;
  const L = (v) => Math.round((v / max) * 100);
  return `<div class="pbf pbf-dur"><div class="pbf-dur__track" style="--p25:${L(d.p25)};--p75:${L(d.p75)};--med:${L(d.medianDays)}">`
    + `<span class="pbf-dur__band"></span><span class="pbf-dur__med"><b>${es ? 'mediana' : 'median'} ${d.medianDays}${es ? 'd' : 'd'}</b></span></div>`
    + `<div class="pbf-dur__ax"><span>0d</span><span>p25 ${d.p25}d</span><span>p75 ${d.p75}d</span><span>${Math.round(max)}d</span></div>`
    + `<p class="pbf-note">${es ? `${d.total} movimientos detectados; la mitad central se resuelve entre ${d.p25} y ${d.p75} días` : `${d.total} detected moves; the middle half clears between ${d.p25} and ${d.p75} days`}</p></div>`;
}
const FIG = { company: figCompany, clusters: figClusters, catTax: figCatTax, worst: figWorst, taxonomy: figTaxonomy, steadyWild: figSteadyWild, duration: figDuration, updown: figUpdown, calendar: figCalendar, method: figMethod, proteinLock: figProteinLock, proteinFamily: figProteinFamily };
const FIG_NEEDS_NAME = new Set(['clusters', 'worst', 'calendar']);

// Category display names in ES (EN uses the raw key, which is already a plain word).
const CAT_ES = { citrus: 'cítricos', shellfish: 'mariscos', stalks: 'tallos', herbs: 'hierbas', seafood: 'pescado', cruciferous: 'crucíferas', fruit: 'fruta', greens: 'hojas verdes', beef: 'res', allium: 'aliáceas', fruiting: 'frutos', tuber: 'tubérculo', root: 'raíz', meat: 'carne', mushroom: 'hongos' };
function catNameEs(cat) { return CAT_ES[cat] || cat; }

function renderFigure(key, A, es, nm, cap, audioAlt, escHtml) {
  const fn = FIG[key]; if (!fn) return '';
  const body = FIG_NEEDS_NAME.has(key) ? fn(A, es, nm) : fn(A, es);
  const aa = audioAlt ? ` data-audio-alt="${escHtml(audioAlt)}"` : '';
  const cp = cap ? `<figcaption class="rs-fig__cap">${escHtml(cap)}</figcaption>` : '';
  return `<figure class="rs-fig viz-figure"${aa}>${body}${cp}</figure>`;
}

const RESEARCH_HUB_BLURB = {
  en: 'Original analysis over the Muntin Cost Index open data — the reads a kitchen can act on, not a data dump. Descriptive and computed; co-occurrence, never cause; a wholesale reference, never the price you pay.',
  es: 'Análisis original sobre los datos abiertos del Muntin Cost Index — las lecturas que una cocina puede usar, no un volcado de datos. Descriptivo y calculado; coincidencia, nunca causa; una referencia mayorista, nunca el precio que pagas.',
};

// Research-surface CSS. Single teal hue on neutral 1px tracks (dataviz honesty); tabular-nums on
// every figure; wide figures (calendar, category bars) scroll in their own container; no color as
// the only signal. Reuses the site's global tokens + base .ci-hero/.ci-answer/.ci-body classes.
const RESEARCH_CSS = `/* ============================================================
   RESEARCH SURFACE — /cost-index/research/
   rs-* system. Reuses the cost-index tokens; THEME-AWARE — those
   tokens flip under [data-theme="dark"] / prefers-color-scheme:dark
   on every cost-index page, and the rs-scoped tokens below
   (--rs-accent-text, --rs-fill-soft, --rs-shadow) supply dark-correct
   equivalents, so the surface is honest in BOTH light and dark.
   DATAVIZ CONTRACT: every bar is a single teal fill on a
   neutral 1px-bordered track. The per-page accent (teal/gold/
   season) colors CHROME ONLY (top rule, kicker, step numerals,
   callout borders) and NEVER a data mark. tabular-nums on all
   figures. No red/green; "wild"/loss is length, not a status hue.
   ACCESSIBLE ACCENT: readable text reads --rs-accent-text, kept
   AA >=4.5:1 on white AND cream-2 — gold resolves to --ink-soft so
   it never drives small text below the floor; only >=3px graphical
   chrome and >=3:1 focus rings read the raw --rs-accent (teal/gold/
   season). Data marks read --rs-fill (always teal).
   ============================================================ */

/* ---- accent scope: chrome reads --rs-accent; readable text reads
   --rs-accent-text; data marks read --rs-fill (always teal) ---- */
.rs{
  --rs-accent:var(--teal);
  --rs-accent-text:var(--teal);
  --rs-track:var(--cream-2);
  --rs-track-line:var(--line);
  --rs-fill:var(--teal);
  --rs-fill-soft:var(--teal-wash);
  --rs-shadow:0 14px 34px -20px rgba(20,22,26,.4);
}
.rs[data-accent="gold"]{--rs-accent:var(--gold);--rs-accent-text:var(--ink-soft)}
.rs[data-accent="season"]{--rs-accent:var(--season);--rs-accent-text:var(--season)}
/* dark: gold accent-text stays --ink-soft (a token that already flips),
   teal/season stay legible, so only the drop-shadow needs a darker cast */
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .rs{--rs-shadow:0 14px 34px -20px rgba(0,0,0,.6)}}
:root[data-theme="dark"] .rs{--rs-shadow:0 14px 34px -20px rgba(0,0,0,.6)}

/* ============================================================
   1. HUB  /cost-index/research/
   ============================================================ */
.rs-hub{max-width:var(--max);margin:0 auto;padding-inline:var(--pad-x)}
.rs-hub__lede{max-width:64ch;font-size:clamp(16px,2.4vw,18px);line-height:1.6;color:var(--ink-soft);margin:8px 0 26px}
.rs-hub__lede strong{color:var(--ink)}
.rs-hub__grid{
  display:grid;gap:16px;margin:0 0 8px;
  grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));
}
.rs-hub-card{
  --rs-accent:var(--teal);
  --rs-accent-text:var(--teal);
  position:relative;display:flex;flex-direction:column;
  background:var(--white);border:1px solid var(--line);
  border-top:3px solid var(--rs-accent);border-radius:12px;
  padding:20px 22px 18px;text-decoration:none;color:inherit;
  transition:border-color .16s ease,box-shadow .16s ease,transform .16s ease;
}
.rs-hub-card[data-accent="gold"]{--rs-accent:var(--gold);--rs-accent-text:var(--ink-soft)}
.rs-hub-card[data-accent="season"]{--rs-accent:var(--season);--rs-accent-text:var(--season)}
.rs-hub-card:hover,.rs-hub-card:focus-visible{
  border-color:var(--rs-accent);box-shadow:var(--rs-shadow);
  transform:translateY(-2px);outline:none;
}
.rs-hub-card:focus-visible{outline:2px solid var(--rs-accent);outline-offset:2px}
.rs-hub-card__kicker{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--rs-accent-text);margin:0 0 10px}
.rs-hub-card__q{font-family:var(--font-display);font-size:clamp(19px,2.4vw,22px);font-weight:500;line-height:1.22;color:var(--ink);margin:0 0 12px;text-wrap:balance}
.rs-hub-card__a{font-size:14.5px;line-height:1.55;color:var(--ink-soft);margin:0 0 16px}
.rs-hub-card__foot{margin-top:auto;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;font-variant-numeric:tabular-nums}
.rs-hub-card__stat{font-family:var(--font-display);font-size:clamp(26px,4vw,34px);font-weight:500;line-height:1;color:var(--ink)}
.rs-hub-card__statlab{font-size:12.5px;line-height:1.4;color:var(--stone)}
.rs-hub-card__go{margin-top:14px;font-size:13px;font-weight:600;color:var(--rs-accent-text)}
.rs-hub-card__go::after{content:" \\2192"}

/* ============================================================
   2. PAGE HERO  (augments .ci-hero, does not redefine it)
   ============================================================ */
.rs-hero{position:relative;padding-top:34px}
.rs-hero::before{content:"";position:absolute;top:0;left:0;width:56px;height:4px;border-radius:2px;background:var(--rs-accent)}
.rs-hero__eyebrow{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--rs-accent-text);margin:0 0 10px}
.rs-hero__eyebrow a{color:inherit;text-decoration:none}
.rs-hero__answer{
  font-size:clamp(17px,2.6vw,20px);font-weight:600;line-height:1.5;color:var(--ink);
  margin:6px 0 16px;max-width:60ch;font-variant-numeric:tabular-nums;
  border-left:3px solid var(--rs-accent);padding-left:16px;
}
.rs-hero__stat{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin:0 0 6px;font-variant-numeric:tabular-nums}
.rs-hero__stat-num{font-family:var(--font-display);font-size:clamp(38px,7vw,56px);font-weight:500;line-height:1;color:var(--ink);letter-spacing:-.01em}
.rs-hero__stat-lab{font-size:15px;line-height:1.4;color:var(--ink-soft);max-width:34ch}
.rs-hero__meta{font-size:12.5px;color:var(--stone);margin:8px 0 0}

/* ============================================================
   3. SECTION RHYTHM inside .ci-body
   ============================================================ */
.rs-section{margin:8px 0 0}
.rs-section + .rs-section{margin-top:6px}
.rs-lede{font-size:16px;line-height:1.7;color:var(--ink-soft);margin:0 0 16px;max-width:66ch}
.rs-lede strong{color:var(--ink)}
/* recessive "don't over-read it" caveat block */
.rs-caution{
  margin:18px 0;padding:14px 18px;background:var(--cream-2);
  border:1px solid var(--line);border-left:3px solid var(--stone);border-radius:10px;
}
.rs-caution__h{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-soft);margin:0 0 6px}
.rs-caution p{font-size:14.5px;line-height:1.6;color:var(--ink-soft);margin:0 0 8px}
.rs-caution p:last-child{margin-bottom:0}
/* the page verdict / action line */
.rs-takeaway{
  margin:22px 0 8px;padding:18px 20px;background:var(--white);
  border:1px solid var(--line);border-left:4px solid var(--rs-accent);border-radius:12px;
}
.rs-takeaway__h{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--rs-accent-text);margin:0 0 6px}
.rs-takeaway__b{font-size:16.5px;line-height:1.55;color:var(--ink);margin:0;font-weight:500;max-width:60ch}
.rs-takeaway__b strong{font-weight:700}

/* ============================================================
   4. SHARED FIGURE FRAME
   ============================================================ */
.rs-fig{margin:22px 0;padding:18px 20px 16px;background:var(--white);border:1px solid var(--line);border-radius:12px;font-variant-numeric:tabular-nums}
.rs-fig__head{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-soft);margin:0 0 14px}
.rs-fig figcaption,.rs-fig__cap{margin:14px 0 0;font-size:13px;line-height:1.55;color:var(--ink-soft)}
.rs-fig__cap strong{color:var(--ink)}
.rs-fig__note{margin:8px 0 0;font-size:12px;color:var(--stone);line-height:1.5}
/* legend — present only when a single plot carries >=2 series.
   Keys differ by TEXTURE, not alpha: solid teal vs teal + teal hatch,
   both with a full-strength teal border, so low-vision users can tell
   them apart without a second hue. */
.rs-legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0 0 12px;font-size:12.5px;color:var(--ink-soft)}
.rs-legend__key{display:inline-flex;align-items:center;gap:7px}
.rs-legend__sw{width:11px;height:11px;border-radius:3px;background:var(--rs-fill);flex:0 0 auto}
.rs-legend__sw--soft{background-color:var(--rs-fill-soft);background-image:repeating-linear-gradient(-45deg,var(--rs-fill) 0 1.5px,transparent 1.5px 5px);border:1px solid var(--rs-fill)}
/* sources drawer */
.rs-src{margin:14px 0 0;font-size:12.5px}
.rs-src summary{cursor:pointer;color:var(--ink-soft);font-weight:600;display:flex;align-items:center;padding:8px 0;min-height:40px;list-style:none}
.rs-src summary::-webkit-details-marker{display:none}
.rs-src summary::before{content:"\\203A\\00a0";color:var(--stone);display:inline-block;transition:transform .16s ease}
.rs-src[open] summary::before{transform:rotate(90deg)}
.rs-src__body{margin:8px 0 0;color:var(--ink-soft);line-height:1.6}
.rs-src__body a{color:var(--teal);text-decoration:none;border-bottom:1px dashed currentColor}
.rs-src__body a:hover{color:var(--teal)}

/* ---- reusable horizontal bar (catTax, steadyWild, updown) ---- */
.rs-bars{display:flex;flex-direction:column;gap:11px;margin:0}
.rs-bar{display:grid;grid-template-columns:minmax(120px,34%) 1fr auto;align-items:center;gap:12px}
.rs-bar__label{font-size:14px;line-height:1.35;color:var(--ink)}
.rs-bar__track{position:relative;height:18px;background:var(--rs-track);border:1px solid var(--rs-track-line);border-radius:4px;overflow:hidden}
/* min-width is gated by the value: a true 0 renders empty (no 2px
   sliver overstating a genuine zero); any value>0 keeps a 2px floor. */
.rs-bar__fill{height:100%;width:calc(var(--v,0)*1%);background:var(--rs-fill);border-radius:0 3px 3px 0;min-width:calc(2px * min(var(--v,0),1))}
.rs-bar__val{font-size:14px;font-weight:600;color:var(--ink);text-align:right;min-width:5ch;white-space:nowrap}
.rs-bar__val--muted{color:var(--ink-soft);font-weight:500}

/* ============================================================
   5a. company-stat  (single big share — a stat tile + proof meter)
   ============================================================ */
.rs-stat{margin:22px 0;padding:22px 24px;background:var(--white);border:1px solid var(--line);border-radius:12px;font-variant-numeric:tabular-nums}
.rs-stat__row{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
.rs-stat__num{font-family:var(--font-display);font-size:clamp(46px,9vw,72px);font-weight:500;line-height:.95;color:var(--ink);letter-spacing:-.015em}
.rs-stat__say{font-size:16px;line-height:1.45;color:var(--ink);font-weight:500;max-width:34ch}
.rs-stat__proof{margin:18px 0 0}
.rs-stat__meter{position:relative;height:14px;background:var(--rs-track);border:1px solid var(--rs-track-line);border-radius:4px;overflow:hidden}
.rs-stat__meter-fill{height:100%;width:calc(var(--v,0)*1%);background:var(--rs-fill);border-radius:0 3px 3px 0}
.rs-stat__proof-lab{display:flex;justify-content:space-between;gap:10px;margin:7px 0 0;font-size:12.5px;color:var(--ink-soft)}
.rs-stat__sub{margin:12px 0 0;font-size:13px;color:var(--stone);line-height:1.5}

/* ============================================================
   5b. clusters  (grouped ingredient chips + tight-couple emphasis)
   ============================================================ */
.rs-clusters{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr))}
.rs-cluster{background:var(--white);border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.rs-cluster__name{font-family:var(--font-display);font-size:16px;font-weight:600;color:var(--ink);margin:0 0 3px}
.rs-cluster__meta{font-size:12px;color:var(--stone);margin:0 0 12px;font-variant-numeric:tabular-nums}
.rs-cluster__chips{display:flex;flex-wrap:wrap;gap:7px}
.rs-chip{display:inline-block;font-size:13px;line-height:1.3;padding:5px 11px;border-radius:999px;background:var(--cream-2);border:1px solid var(--line);color:var(--ink)}
.rs-chip--tight{background:var(--rs-fill-soft);border-color:var(--rs-fill);color:var(--ink);font-weight:600}
.rs-cluster__couple{margin:12px 0 0;display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink-soft);font-variant-numeric:tabular-nums}
.rs-cluster__couple-r{display:inline-flex;align-items:center;gap:6px;font-weight:600;color:var(--ink)}
.rs-cluster__couple-r::before{content:"";width:9px;height:9px;border-radius:2px;background:var(--rs-fill)}

/* ============================================================
   5d. worst  (compact table — scrolls in its own container)
   ============================================================ */
.rs-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:18px 0}
.rs-table{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums;min-width:420px}
.rs-table caption{text-align:left;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-soft);padding:0 0 10px}
.rs-table th,.rs-table td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);white-space:nowrap;vertical-align:middle}
.rs-table thead th{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-soft)}
.rs-table td.rs-num,.rs-table th.rs-num{text-align:right;font-variant-numeric:tabular-nums}
.rs-table tbody tr:hover{background:var(--cream-2)}
.rs-table .rs-rank{color:var(--stone);width:1%}
/* link reads as a link WITHOUT hover (persistent teal dashed underline
   hugging the text) and carries a >=40px tap area */
.rs-table td a{color:var(--ink);text-decoration:underline dashed var(--teal);text-underline-offset:3px;text-decoration-thickness:1px;font-weight:600;display:inline-flex;align-items:center;min-height:40px}
.rs-table td a:hover{color:var(--teal)}
/* optional in-cell magnitude sparkbar (single teal, no second meaning) */
.rs-cellbar{display:inline-block;vertical-align:middle;width:64px;height:9px;background:var(--rs-track);border:1px solid var(--rs-track-line);border-radius:3px;overflow:hidden;margin-right:8px}
.rs-cellbar > i{display:block;height:100%;width:calc(var(--v,0)*1%);background:var(--rs-fill)}

/* ============================================================
   5e. taxonomy  (4-way split lock / cushion / float / withhold)
   ordered buckets: differentiated by POSITION + LABEL, never hue.
   a single-hue teal meter per column carries the rising spread.
   ============================================================ */
.rs-tax{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(180px,100%),1fr))}
.rs-tax__col{background:var(--white);border:1px solid var(--line);border-radius:12px;padding:15px 16px;display:flex;flex-direction:column}
.rs-tax__label{font-family:var(--font-display);font-size:16px;font-weight:600;color:var(--ink);margin:0}
.rs-tax__count{font-size:12px;color:var(--stone);margin:2px 0 10px;font-variant-numeric:tabular-nums}
.rs-tax__meter{height:8px;background:var(--rs-track);border:1px solid var(--rs-track-line);border-radius:3px;overflow:hidden;margin:0 0 4px}
.rs-tax__meter > i{display:block;height:100%;width:calc(var(--v,0)*1%);background:var(--rs-fill)}
.rs-tax__spread{font-size:11.5px;color:var(--ink-soft);margin:0 0 12px;font-variant-numeric:tabular-nums}
.rs-tax__def{font-size:13px;line-height:1.5;color:var(--ink-soft);margin:0 0 10px}
.rs-tax__items{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto}
.rs-tax__items .rs-chip{font-size:12px;padding:4px 9px}

/* ============================================================
   5f. steadyWild  (two ranked single-series bar lists side by side)
   BOTH lists use the same teal; "wild" reads by length, not color.
   ============================================================ */
.rs-duo{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr))}
.rs-duo__col{min-width:0}
.rs-duo__h{font-family:var(--font-display);font-size:15px;font-weight:600;color:var(--ink);margin:0 0 3px}
.rs-duo__sub{font-size:12.5px;color:var(--stone);margin:0 0 14px}
/* a compact bar variant: label above, track+value below (phone-safe) */
.rs-duo .rs-bar{grid-template-columns:1fr auto}
.rs-duo .rs-bar__label{grid-column:1 / -1;font-size:13.5px;margin-bottom:-4px}

/* ============================================================
   5g. duration  (p25 - median - p75 range bar, in days)
   positions are % of a labeled day-axis; median is a 2px tick.
   ============================================================ */
.rs-range{margin:30px 0 0}
.rs-range__track{position:relative;height:26px;background:var(--rs-track);border:1px solid var(--rs-track-line);border-radius:5px}
.rs-range__band{position:absolute;top:-1px;bottom:-1px;left:calc(var(--p25,0)*1%);width:calc((var(--p75,0) - var(--p25,0))*1%);background:var(--rs-fill-soft);border:1px solid var(--rs-fill);border-radius:4px}
.rs-range__median{position:absolute;top:-5px;bottom:-5px;left:calc(var(--med,0)*1%);width:2px;background:var(--rs-fill);transform:translateX(-1px)}
.rs-range__medlab{position:absolute;left:calc(var(--med,0)*1%);top:-26px;transform:translateX(-50%);white-space:nowrap;font-size:13px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums}
.rs-range__ends{display:flex;justify-content:space-between;margin:10px 0 0;font-size:12.5px;color:var(--ink-soft);font-variant-numeric:tabular-nums}
.rs-range__axis{display:flex;justify-content:space-between;margin:14px 2px 0;font-size:11px;color:var(--stone);font-variant-numeric:tabular-nums;border-top:1px solid var(--line);padding-top:5px}

/* ============================================================
   5h. updown  (2-way split — two labeled bars on one scale)
   ============================================================ */
.rs-split{display:flex;flex-direction:column;gap:14px;margin:4px 0 0}
.rs-split .rs-bar{grid-template-columns:minmax(150px,40%) 1fr auto}
.rs-split__note{margin:14px 0 0;font-size:13.5px;line-height:1.55;color:var(--ink-soft)}
.rs-split__note strong{color:var(--ink)}

/* ============================================================
   5i. calendar  (12-month grid; reflows to 1 col on phones)
   ============================================================ */
.rs-cal{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(190px,100%),1fr))}
.rs-cal__m{background:var(--white);border:1px solid var(--line);border-radius:10px;padding:12px 13px;display:flex;flex-direction:column}
.rs-cal__mh{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:0 0 9px}
.rs-cal__mname{font-family:var(--font-display);font-size:14px;font-weight:600;color:var(--ink)}
.rs-cal__mtag{font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--rs-accent-text)}
.rs-cal__list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.rs-cal__item{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;line-height:1.35;color:var(--ink);font-variant-numeric:tabular-nums}
/* the calendar's PRIMARY action: a >=40px tap row with a persistent
   teal dashed underline so it reads as a link on touch (no hover cue) */
.rs-cal__item a{color:var(--ink);text-decoration:underline dashed var(--teal);text-underline-offset:3px;text-decoration-thickness:1px;display:flex;align-items:center;min-height:40px;flex:1 1 auto;min-width:0}
.rs-cal__item a:hover{color:var(--teal)}
.rs-cal__save{color:var(--ink-soft);font-size:12px;white-space:nowrap}
.rs-cal__m--flat{background:var(--cream-2);border-style:dashed}
.rs-cal__m--flat .rs-cal__mtag{color:var(--ink-soft)}
.rs-cal__flatnote{font-size:12px;color:var(--ink-soft);line-height:1.45;margin:0}

/* ============================================================
   5j. method  (3 numbered steps — a walked sequence)
   ============================================================ */
.rs-steps{list-style:none;counter-reset:rs-step;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:2px}
.rs-step{position:relative;display:grid;grid-template-columns:auto 1fr;gap:16px;padding:16px 0}
.rs-step + .rs-step{border-top:1px solid var(--line)}
.rs-step__n{
  counter-increment:rs-step;
  width:38px;height:38px;flex:0 0 38px;border-radius:999px;
  display:flex;align-items:center;justify-content:center;
  font-family:var(--font-display);font-size:18px;font-weight:600;
  color:var(--rs-accent-text);background:var(--white);
  border:2px solid var(--rs-accent);font-variant-numeric:tabular-nums;
}
.rs-step__n::before{content:counter(rs-step)}
.rs-step__h{font-family:var(--font-display);font-size:17px;font-weight:600;color:var(--ink);margin:4px 0 5px;line-height:1.25}
.rs-step__b{font-size:14.5px;line-height:1.6;color:var(--ink-soft);margin:0}
.rs-step__b strong{color:var(--ink)}

/* ============================================================
   6. RELATED  (cross-link module to the other research pages)
   ============================================================ */
.rs-related{margin:36px 0 8px;padding-top:22px;border-top:1px solid var(--line)}
.rs-related__h{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-soft);margin:0 0 14px}
.rs-related__grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(240px,100%),1fr))}
.rs-related__link{
  --rs-accent:var(--teal);
  --rs-accent-text:var(--teal);
  display:block;padding:13px 15px;background:var(--white);border:1px solid var(--line);
  border-left:3px solid var(--rs-accent);border-radius:10px;text-decoration:none;color:inherit;
  transition:border-color .16s ease,background .16s ease;
}
.rs-related__link[data-accent="gold"]{--rs-accent:var(--gold);--rs-accent-text:var(--ink-soft)}
.rs-related__link[data-accent="season"]{--rs-accent:var(--season);--rs-accent-text:var(--season)}
.rs-related__link:hover{border-color:var(--rs-accent);background:var(--cream)}
.rs-related__kicker{font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--rs-accent-text);margin:0 0 4px}
.rs-related__q{font-size:14px;line-height:1.4;color:var(--ink);margin:0}

/* ---- focus-visible: one designed >=3:1 ring on every interactive
   element (gold ring = 3.64:1, clears the 3:1 non-text minimum) ---- */
.rs-related__link:focus-visible,
.rs-table td a:focus-visible,
.rs-cal__item a:focus-visible,
.rs-src summary:focus-visible,
.rs-hero__eyebrow a:focus-visible{outline:2px solid var(--rs-accent);outline-offset:2px;border-radius:3px}

/* ============================================================
   7. MOBILE  (kitchen phone)
   ============================================================ */
@media (max-width:600px){
  /* bars: label rides above the track+value so text never truncates */
  .rs-bar,.rs-split .rs-bar{grid-template-columns:1fr auto}
  .rs-bar__label{grid-column:1 / -1;margin-bottom:-3px}
  /* calendar collapses to a single readable column */
  .rs-cal{grid-template-columns:1fr}
  .rs-fig{padding:16px 15px 14px}
  .rs-stat{padding:18px 16px}
  .rs-range__medlab{font-size:12px}
  /* duration axis stays legible; range keeps its labels */
  .rs-hero__answer{padding-left:12px}
}
/* very wide figures (worst table) always scroll inside .rs-scroll,
   never the page body — enforced by min-width on .rs-table above. */
@media (prefers-reduced-motion:reduce){
  .rs-hub-card,.rs-related__link{transition:none}
  .rs-hub-card:hover{transform:none}
}\n.rs-cta{margin-top:28px}\n`;

// ---- the menu-pricing playbook page (the flagship) --------------------------------------
// Playbook CSS (pb-*). Reuses the rs-* tokens; the posture pill encodes an ordered posture
// (print→cushion→float→thin) by tint depth + a TEXT label — never color alone, no red/green
// semaphore. Data marks elsewhere stay teal.
const PLAYBOOK_CSS = `
.pb-body h2{font-family:var(--font-display);font-weight:500;font-size:23px;line-height:1.15;margin:0 0 8px;text-wrap:balance}
.pb-tool{margin:8px 0 0;padding:22px;background:var(--white);border:1px solid var(--line);border-radius:16px}
.pb-tool__lede{font-size:14.5px;color:var(--ink-soft);line-height:1.55;margin:0 0 16px;max-width:62ch}
.pb-picker{display:flex;flex-direction:column;gap:6px;max-width:340px;margin:0 0 18px}
.pb-picker label{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-soft)}
.pb-picker select{font:inherit;font-size:16px;padding:11px 13px;border:1px solid var(--line);border-radius:10px;background:var(--cream);color:var(--ink);min-height:44px}
.pb-card{background:var(--cream);border:1px solid var(--line);border-radius:12px;padding:18px 20px}
.pb-card__head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px}
.pb-card__name{font-family:var(--font-display);font-weight:600;font-size:21px;margin:0}
.pb-card__posture{font-size:16px;line-height:1.5;color:var(--ink);margin:0 0 14px;font-weight:500}
.pb-card__layers{list-style:none;margin:0;padding:0;display:grid;gap:9px}
.pb-lyr{position:relative;padding:0 0 0 22px;font-size:14.5px;line-height:1.5;color:var(--ink-soft)}
.pb-lyr:before{position:absolute;left:0;top:.05em;font-size:14px}
.pb-lyr--cost:before{content:"$"}.pb-lyr--time:before{content:"◷"}.pb-lyr--swap:before{content:"⇄"}
.pb-more{margin:14px 0 0;border-top:1px solid var(--line);padding:10px 0 0}
.pb-more>summary{cursor:pointer;font-size:12.5px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--teal);list-style:none}
.pb-more>summary::-webkit-details-marker{display:none}
.pb-more>summary:before{content:"+ ";font-weight:700}
.pb-more[open]>summary:before{content:"– "}
.pb-more[open]>summary{margin:0 0 10px}
.pb-deplist{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.pb-dep{position:relative;padding:0 0 0 22px;font-size:14px;line-height:1.5;color:var(--ink-soft)}
.pb-dep:before{position:absolute;left:0;top:.05em;font-size:13px}
.pb-dep--sub:before{content:"↔"}
.pb-dep--cook:before{content:"◐"}.pb-dep--juice:before{content:"◔"}.pb-dep--store:before{content:"⌂"}
.pb-dep--freeze:before{content:"❄"}.pb-dep--season:before{content:"☼"}.pb-dep--trim:before{content:"♻"}
.pb-dep__src{margin:12px 0 0;font-size:12px;line-height:1.5;color:var(--stone)}
.pb-dep__cite{display:block;margin:3px 0 0;color:var(--ink-soft)}
.pb-newtag{display:inline-block;margin-left:7px;font-size:9.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--teal);background:var(--teal-wash);padding:1px 6px;border-radius:999px;vertical-align:1px}
.pb-pill{display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;white-space:nowrap;border:1px solid var(--line)}
.pb-pill--lock{background:var(--teal);color:var(--white);border-color:var(--teal)}
.pb-pill--cushion{background:var(--teal-wash);color:var(--teal);border-color:var(--teal-wash)}
.pb-pill--float{background:transparent;color:var(--ink-soft);border-color:var(--gold)}
.pb-pill--withhold{background:var(--cream-2);color:var(--ink-soft)}
.pb-guide{margin:34px 0 0}
.pb-guide .rs-section{margin:0 0 26px}
.pb-guide .rs-section p{font-size:15.5px;line-height:1.62;color:var(--ink);margin:0 0 12px;max-width:66ch}
.pb-lede{font-size:17px;line-height:1.55;color:var(--ink);font-weight:500;margin:0 0 20px;max-width:64ch}
.pb-play{margin:6px 0 24px;padding:18px 20px;background:var(--teal-wash);border:1px solid var(--teal);border-radius:14px}
.pb-play h3{font-family:var(--font-display);font-weight:600;font-size:16px;margin:0 0 8px;color:var(--teal);text-transform:uppercase;letter-spacing:.04em}
.pb-play p{font-size:15px;line-height:1.58;color:var(--ink);margin:0;max-width:66ch}
.pb-takeaway{font-family:var(--font-display);font-size:19px;line-height:1.4;font-weight:500;color:var(--ink);margin:0 0 6px;padding:16px 0 0;border-top:1px solid var(--line);text-wrap:balance;max-width:64ch}
.pb-tablewrap{margin:34px 0 0}
.pb-table{font-size:13.5px}
.pb-table th[scope=row]{font-weight:500;white-space:nowrap}
.pb-table td.pb-num,.pb-table th.pb-num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.pb-table td:last-child{color:var(--ink-soft);font-size:13px}
@media(max-width:640px){.pb-card__head{flex-wrap:wrap}.pb-table{font-size:12.5px}}

/* ---- bespoke playbook figures (pbf-*): single teal data hue, length-only encoding ---- */
.pb-guide .rs-fig,.pb-play .rs-fig{margin:18px 0 22px}
.pbf{margin:2px 0;font-variant-numeric:tabular-nums}
/* §1 posture unit grid */
.pbf-grid{display:grid;grid-template-columns:repeat(20,1fr);gap:3px;margin:0 0 14px}
.pbf-cell{display:block;aspect-ratio:1;border-radius:3px;background:var(--cream-2)}
.pbf-cell--lock{background:var(--teal)}
.pbf-cell--cushion{background:var(--teal);opacity:.4}
.pbf-cell--float{background:transparent;border:1.5px solid var(--gold)}
.pbf-cell--withhold{background:var(--cream-2);border:1px solid var(--line)}
.pbf-legend{display:flex;flex-wrap:wrap;gap:8px 20px}
.pbf-key{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:var(--ink-soft)}
.pbf-key .pbf-cell{width:13px;height:13px;aspect-ratio:auto;flex:none;border-radius:3px}
.pbf-key b{color:var(--ink);font-weight:700}
/* §2 centered "how far it wanders" bands */
.pbf-grouph{font-size:11.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft);margin:16px 0 9px}
.pbf-grouph:first-child{margin-top:0}
.pbf-band{display:grid;grid-template-columns:118px 1fr 60px;align-items:center;gap:10px;margin:0 0 6px}
.pbf-band__n{font-size:13px;color:var(--ink);text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pbf-band__track{position:relative;height:16px;background:var(--cream);border:1px solid var(--line);border-radius:4px}
.pbf-band__track::before{content:"";position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:var(--stone);opacity:.5}
.pbf-band__fill{position:absolute;top:2px;bottom:2px;left:calc(50% - var(--hw)*1%);width:calc(var(--hw)*2%);min-width:3px;background:var(--teal);border-radius:3px;opacity:.9}
.pbf-band__v{font-size:12.5px;color:var(--ink-soft);text-align:right}
.pbf-band__axis{display:flex;justify-content:space-between;font-size:11px;color:var(--stone);margin:8px 0 0;padding:0 60px 0 128px}
.pbf-band__c{color:var(--ink-soft)}
/* §3 trim-tax shrink bars */
.pbf-trims{font-size:13px}
.pbf-trim{display:grid;grid-template-columns:92px 1fr 52px;align-items:center;gap:10px;margin:0 0 7px}
.pbf-trim__n{text-align:right;color:var(--ink)}
.pbf-trim--head{color:var(--stone);font-size:11px;text-transform:uppercase;letter-spacing:.03em;margin-bottom:10px}
.pbf-trim__bar{position:relative;height:20px;background:var(--cream);border:1px solid var(--line);border-radius:4px;overflow:hidden}
.pbf-trim__bar--head{background:none;border:none;height:auto;overflow:visible}
.pbf-trim__edible{position:absolute;left:0;top:0;bottom:0;width:calc(var(--e)*1%);background:var(--teal);opacity:.85}
.pbf-trim__e{position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:11px;font-weight:700;color:var(--white);z-index:1}
.pbf-trim__x{text-align:right;color:var(--ink);font-weight:700}
/* §4 the hidden season: month-axis columns */
.pbf-cal__scroll{overflow-x:auto}
.pbf-cal__row{display:grid;grid-template-columns:repeat(12,minmax(44px,1fr));gap:4px;align-items:end;min-height:220px;min-width:560px}
.pbf-cal__col{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
.pbf-cal__stack{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px;width:100%;flex:1}
.pbf-cal__bar{position:relative;width:80%;min-height:26px;height:calc(var(--h)*1.55px + 26px);background:var(--teal);border-radius:5px 5px 0 0;display:flex;flex-direction:column;align-items:center;padding:5px 2px;opacity:.92}
.pbf-cal__save{font-size:11px;font-weight:800;color:var(--white);line-height:1}
.pbf-cal__cut{font-size:10px;color:var(--white);writing-mode:vertical-rl;transform:rotate(180deg);margin-top:5px;font-weight:600;letter-spacing:.02em;white-space:nowrap;overflow:hidden}
.pbf-cal__m{font-size:11px;color:var(--ink-soft);margin-top:7px}
.pbf-cal__col.is-on .pbf-cal__m{color:var(--ink);font-weight:700}
/* §5 co-mover mirror */
.pbf-mir{display:grid;grid-template-columns:1fr 128px 1fr;align-items:center;gap:12px;margin:0 0 9px}
.pbf-mir__a{text-align:right;font-size:13.5px;color:var(--ink)}
.pbf-mir__b{text-align:left;font-size:13.5px;color:var(--ink)}
.pbf-mir__link{display:flex;flex-direction:column;align-items:center;gap:4px}
.pbf-mir__track{width:100%;height:8px;background:var(--cream-2);border-radius:99px;overflow:hidden}
.pbf-mir__fill{display:block;height:100%;width:calc(var(--v)*1%);background:var(--teal);border-radius:99px}
.pbf-mir__k{font-size:11.5px;font-weight:700;color:var(--ink-soft)}
.pbf-note{font-size:12px;color:var(--stone);margin:14px 0 0;text-align:center}
/* shock duration range */
.pbf-dur__track{position:relative;height:30px;background:var(--cream);border:1px solid var(--line);border-radius:6px;margin:0 0 7px}
.pbf-dur__band{position:absolute;top:0;bottom:0;left:calc(var(--p25)*1%);width:calc((var(--p75) - var(--p25))*1%);background:var(--teal);opacity:.22;border-left:2px solid var(--teal);border-right:2px solid var(--teal)}
.pbf-dur__med{position:absolute;top:-3px;bottom:-3px;left:calc(var(--med)*1%);width:2px;background:var(--teal)}
.pbf-dur__med b{position:absolute;left:7px;top:50%;transform:translateY(-50%);font-size:11px;font-weight:700;color:var(--ink);white-space:nowrap}
.pbf-dur__ax{display:flex;justify-content:space-between;font-size:11px;color:var(--stone)}
/* ---- methodology dropdowns (inspectable calculations) ---- */
.pb-method{margin:34px 0 0}
.pb-calc{border:1px solid var(--line);border-radius:12px;margin:0 0 8px;background:var(--white);overflow:hidden}
.pb-calc>summary{cursor:pointer;padding:14px 18px;font-weight:600;font-size:15px;color:var(--ink);list-style:none;display:flex;align-items:center;gap:11px}
.pb-calc>summary::-webkit-details-marker{display:none}
.pb-calc>summary::before{content:"+";font-size:19px;color:var(--teal);font-weight:400;line-height:1;width:14px;text-align:center}
.pb-calc[open]>summary::before{content:"\\2013"}
.pb-calc[open]>summary{border-bottom:1px solid var(--line)}
.pb-calc>p,.pb-calc>.rs-scroll{margin:0;padding:15px 18px;font-size:14.5px;line-height:1.62;color:var(--ink-soft)}
.pb-calc em{font-style:italic;color:var(--ink);font-weight:500}
.pb-calc b{color:var(--ink)}
/* ---- CC-BY cite + download ---- */
.pb-cite{margin:30px 0 0;padding:22px 24px;background:var(--cream);border:1px solid var(--line);border-radius:16px}
.pb-cite p{font-size:14.5px;line-height:1.6;color:var(--ink-soft);margin:0 0 13px;max-width:72ch}
.pb-cite__cite{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;color:var(--ink);background:var(--white);border:1px solid var(--line);border-radius:8px;padding:11px 13px;line-height:1.5}
.pb-cite__lab{display:inline-block;font-weight:700;color:var(--teal);margin-right:8px;text-transform:uppercase;font-size:10.5px;letter-spacing:.05em;font-family:var(--font-body)}
.pb-cite__dl{display:flex;flex-wrap:wrap;gap:10px;margin:0}
.pb-dl{display:inline-flex;align-items:center;gap:6px;padding:9px 15px;border:1px solid var(--teal);border-radius:9px;color:var(--teal);font-size:13.5px;font-weight:600;text-decoration:none}
.pb-dl::before{content:"\\2193";font-weight:700}
.pb-dl--ghost{border-color:var(--line);color:var(--ink-soft)}
.pb-dl--ghost::before{content:""}
@media(max-width:640px){
  .pbf-grid{grid-template-columns:repeat(10,1fr)}
  .pbf-band{grid-template-columns:92px 1fr 52px}
  .pbf-band__axis{padding:0 52px 0 102px}
  .pbf-mir{grid-template-columns:1fr 96px 1fr;gap:8px}
}
`;
// Per-card sentences, computed (never a forecast; a wholesale reference vs its own normal, never
// the delivered price; a strong co-mover means a swap is a mirror, never a cause).
function cardLines(c, es) {
  const nm = es ? c.es : c.en; const low = nm.toLowerCase();
  const poss = (w) => (/s$/i.test(w) ? w + "'" : w + "'s"); // avoid "Onions's"
  const mo = (es ? MONTH_ABBR_ES : MONTH_ABBR_EN)[c.cheapMonth || 0];
  const posture = {
    lock: es ? `Fíjalo. Su banda de ±${c.bandPct}% es estrecha y se ha comprobado en semanas recientes — bastante estable para comprometer un precio impreso durante el ciclo.`
      : `Print it. Its ±${c.bandPct}% band is both tight and proven across recent weeks — steady enough to commit a menu price for the print cycle.`,
    cushion: es ? `Imprímelo con colchón. Su banda de ±${c.bandPct}% es estrecha pero aún no se ha comprobado suficientes semanas para fijar — así que ponle precio al tope de la banda, no a la mitad.`
      : `Print it with a cushion. Its ±${c.bandPct}% band is tight but hasn't proven out enough recent weeks to lock — so price to the top of the band, not the middle.`,
    float: es ? `Déjalo flotar. La banda corre ±${c.bandPct}% — va mejor como precio de mercado o especial rotativo; si tienes que imprimir un precio fijo, constrúyelo al tope de la banda, no a la mitad.`
      : `Float it. The band runs ±${c.bandPct}% — better as market price or a rotating special; if you must print a fixed price, build it to the top of the band, not the middle.`,
    withhold: es ? `Muy poca evidencia para decidir. Aún no hay historial reciente suficiente para puntuar su banda — trátalo como flotante hasta que se gane un veredicto.`
      : `Too thin to call. Not enough recent evidence to score its band yet — treat it like a float until it earns a verdict.`,
  }[c.bucket];
  const cost = c.yieldPct != null
    ? (es ? `Costo real: cada dólar mayorista compra ×${c.trimTax.toFixed(2)} de ${low} comestible — solo el ${c.yieldPct}% sobrevive al recorte.`
      : `True cost: every wholesale dollar buys ×${c.trimTax.toFixed(2)} of edible ${low} — ${c.yieldPct}% survives trim.`)
    : (es ? 'Costo real: sin rendimiento estándar en archivo — cálcúlalo desde tu propio peso limpio.' : 'True cost: no standard yield on file — price it off your own trimmed weight.');
  const reason = c.timingReason || (c.cheapMonth == null ? 'thin' : (c.worthTiming ? 'worth' : 'flat'));
  const timing = reason === 'worth'
    ? (es ? `Compra: en el registro ha resultado más barato hacia ${mo}, unos ${c.savePct}% bajo su propio máximo anual — un patrón pasado, no una promesa; tu ahorro real depende de cuándo comprarías si no.` : `Buy timing: in the tracked record it has run cheapest around ${mo}, about ${c.savePct}% under its own yearly high — a past pattern, not a promise; your realized saving depends on when you'd otherwise buy.`)
    : reason === 'flat'
      ? (es ? `Compra: sin ventana estacional fuerte — su mes más barato ahorra solo ${c.savePct}%, así que no persigas el calendario.` : `Buy timing: no strong seasonal window — its cheapest month saves only ${c.savePct}%, so don't chase the calendar.`)
      : reason === 'noisy'
        ? (es ? 'Compra: sus precios mensuales se dispersan sin una ventana barata confiable — sin jugada de calendario; ponle precio todo el año.' : "Buy timing: its monthly prices scatter without a reliable cheap window — no calendar play; price it year-round.")
        : (es ? 'Compra: no hay historial estacional suficiente para nombrar un mes más barato.' : 'Buy timing: not enough seasonal history to name a cheapest month.');
  const swapNm = c.swap ? (es ? c.swap.es : c.swap.en) : null;
  const swap = c.swap
    ? (c.swap.sameCat
      ? (es ? `El cambio que no lo es: no te cubras cambiando ${nm} por ${swapNm} — se han movido juntos en ${c.swap.k} de ${c.swap.n} de los movimientos notables de ${nm}, así que cambiarías un número al alza por otro.` : `The swap that isn't: don't hedge by trading ${nm} for ${swapNm} — they've moved together in ${c.swap.k} of ${c.swap.n} of ${poss(nm)} notable moves, so you'd trade one rising number for another.`)
      : (es ? `Compañero, no sustituto: ${nm} tiende a moverse con ${swapNm} (${c.swap.k} de ${c.swap.n}), pero no puedes servir uno por otro — ningún cambio directo lo cubre.` : `Companion, not a substitute: ${nm} tends to move with ${swapNm} (${c.swap.k} of ${c.swap.n}), but you can't plate one for the other — so no like-for-like swap hedges it.`))
    : (es ? `Sustitución: ${nm} se mueve en gran medida por su cuenta, así que un cambio sí es una cobertura real aquí, no un espejo.` : `Substitution: ${nm} moves largely on its own, so a swap is a real hedge here, not a mirror.`);
  return { posture, cost, timing, swap };
}
const BUCKET_LABEL = { lock: { en: 'Print', es: 'Fijar' }, cushion: { en: 'Cushion', es: 'Colchón' }, float: { en: 'Float', es: 'Flotar' }, withhold: { en: 'Withhold', es: 'Reservar' } };

// The "Full profile" depth drawer, computed from data/ingredient-depth.json (sourced + adversarially
// verified culinary yields, storage, season, substitutes, waste-to-value). Reference/book values —
// labeled "verify your own," with the authoritative source shown. Only lines with real data render;
// a null field (dropped as uncorroboratable) simply doesn't appear.
function depthLines(c, D, es) {
  if (!D) return null;
  const nm = es ? c.es : c.en; const low = nm.toLowerCase();
  const out = [];
  // A swap that HELPS — the culinary substitute that also hedges the price (moves on its own). The
  // card's own swap line already names the co-mover "swap that isn't"; here we surface the one that works.
  const helps = (D.substitutes || []).find((s) => s.hedge && s.hedge.verdict === 'hedge' && !s.hedge.thin);
  const anySub = (D.substitutes || [])[0];
  if (helps) out.push({ k: 'sub', t: es
    ? `Un cambio que sí ayuda: ${helps.name} (${helps.ratio}) — se mueve en gran medida por su cuenta, así que también cubre el precio cuando ${low} sube.`
    : `A swap that helps: ${helps.name} (${helps.ratio}) — it moves largely on its own, so it hedges when ${low} climbs, not just mirrors it.` });
  else if (anySub) out.push({ k: 'sub', t: es
    ? `Cambio de cocina: ${anySub.name} (${anySub.ratio}) — sirve para ${anySub.worksFor}.`
    : `Kitchen swap: ${anySub.name} (${anySub.ratio}) — works for ${anySub.worksFor}.` });
  if (D.cookedYield != null) {
    if (D.cookedYield < 1) { const surv = Math.round(D.cookedYield * 100); out.push({ k: 'cook', t: es
      ? `Rinde cocido: ~${surv}% sobrevive a la cocción — costea el plato sobre el peso cocido, no el crudo.`
      : `Cooked yield: about ${surv}% survives cooking — cost the plate on cooked weight, not raw.` }); }
    else { out.push({ k: 'cook', t: es
      ? `Rinde cocido: ×${D.cookedYield} — 1 libra en seco rinde ~${D.cookedYield} libras cocidas.`
      : `Cooked yield: ×${D.cookedYield} — 1 lb dry makes about ${D.cookedYield} lb cooked.` }); }
  }
  if (D.juiceYield != null) { const j = Math.round(D.juiceYield * 100); out.push({ k: 'juice', t: es
    ? `Jugo: ~${j}% del peso de la fruta es jugo — costea los tragos por onza exprimida, no por pieza.`
    : `Juice: about ${j}% of the fruit's weight is juice — cost drinks by the ounce pressed, not the piece.` }); }
  if (D.shelfLifeDays != null || D.storageMethod) {
    const life = D.shelfLifeDays != null ? (es ? `Se conserva ~${D.shelfLifeDays} días refrigerado. ` : `Keeps about ${D.shelfLifeDays} days refrigerated. `) : '';
    out.push({ k: 'store', t: life + (D.storageMethod || '') });
  }
  if (D.freezeMonths != null) out.push({ k: 'freeze', t: es
    ? `Congelador: ~${D.freezeMonths} meses de vida útil de calidad.`
    : `Freezer: about ${D.freezeMonths} months of quality hold-life.` });
  if (D.peakSeason) out.push({ k: 'season', t: es ? `Mejor calidad: ${D.peakSeason}.` : `Best quality: ${D.peakSeason}.` });
  if (D.trimToValue) out.push({ k: 'trim', t: es ? `De la merma al valor: ${D.trimToValue}.` : `Waste to value: ${D.trimToValue}.` });
  if (!out.length) return null;
  const src = (D.yieldSource || D.depthSource || '').trim();
  return { lines: out, source: src, note: es ? 'Valores de referencia — verifica con tu propio despiece.' : 'Reference/book values — verify against your own fabrication.' };
}

function emitPlaybook(locale, ctx) {
  const { pageHead, pageTail, escHtml, repoRoot } = ctx;
  const es = locale === 'es'; const lang = es ? 'es' : 'en'; const base = es ? '/es' : '';
  const P = pricingCards(repoRoot);
  const DEPTH = (() => { try { return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/ingredient-depth.json'), 'utf8')).ingredients || {}; } catch { return {}; } })();
  const content = (() => { try { return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-research-content.json'), 'utf8')); } catch { return { pages: [] }; } })();
  const guide = (content.pages.find((p) => p.slug === 'menu-pricing-playbook') || {})[locale] || null;
  const canonEn = 'https://muntin.digital/cost-index/menu-pricing/';
  const canonEs = 'https://muntin.digital/es/cost-index/menu-pricing/';
  const title = es ? 'Manual de precios de menú | Muntin Cost Index' : 'The menu-pricing playbook | Muntin Cost Index';
  const desc = es
    ? `Une cuatro capas de datos por ingrediente: qué fijar o flotar, el costo real por porción comestible, el mes más barato y qué cambio no ahorra nada. ${P.counts.lock} de ${P.total} se pueden imprimir.`
    : `Joins four data layers per ingredient: what to print or float, true cost per edible portion, the cheapest month, and which swap saves nothing. ${P.counts.lock} of ${P.total} are printable.`;
  const h1 = es ? 'El manual de precios de menú' : 'The menu-pricing playbook';
  // card data for the JS island (sentences pre-computed per locale → no logic in the client)
  const cardData = P.cards.map((c) => ({ slug: c.slug, name: es ? c.es : c.en, bucket: c.bucket, lines: cardLines(c, es), depth: depthLines(c, DEPTH[c.slug], es) }));
  const moreLabel = es ? 'Perfil completo' : 'Full profile';
  const depthHtml = (dp) => {
    if (!dp) return '';
    const items = dp.lines.map((l) => `<li class="pb-dep pb-dep--${l.k}">${escHtml(l.t)}</li>`).join('');
    const src = dp.source ? `<p class="pb-dep__src"><span>${escHtml(dp.note)}</span>${dp.source ? ` <span class="pb-dep__cite">${es ? 'Fuente' : 'Source'}: ${escHtml(dp.source)}</span>` : ''}</p>` : `<p class="pb-dep__src"><span>${escHtml(dp.note)}</span></p>`;
    return `<details class="pb-more"><summary>${moreLabel}</summary><ul class="pb-deplist">${items}</ul>${src}</details>`;
  };
  const cardHtml = (c) => {
    const nm = es ? c.es : c.en; const L = cardLines(c, es); const bl = BUCKET_LABEL[c.bucket]; const dp = depthLines(c, DEPTH[c.slug], es);
    return `<article class="pb-card" data-slug="${c.slug}" data-bucket="${c.bucket}">`
      + `<header class="pb-card__head"><h3 class="pb-card__name">${escHtml(nm)}</h3><span class="pb-pill pb-pill--${c.bucket}">${es ? bl.es : bl.en}</span></header>`
      + `<p class="pb-card__posture">${escHtml(L.posture)}</p>`
      + `<ul class="pb-card__layers"><li class="pb-lyr pb-lyr--cost">${escHtml(L.cost)}</li>`
      + `<li class="pb-lyr pb-lyr--time">${escHtml(L.timing)}</li>`
      + `<li class="pb-lyr pb-lyr--swap">${escHtml(L.swap)}</li></ul>${depthHtml(dp)}</article>`;
  };
  const def = P.cards.find((c) => c.slug === 'ribeye') || P.cards[0];
  const options = P.cards.map((c) => `<option value="${c.slug}"${c.slug === def.slug ? ' selected' : ''}>${escHtml(es ? c.es : c.en)}</option>`).join('');
  // full table (no-JS core): name | posture | band | true cost | cheapest | swap-buys-nothing
  const th = es ? ['Ingrediente', 'Precio', 'Banda', 'Costo real', 'Más barato', 'Cambio inútil'] : ['Ingredient', 'Pricing', 'Band', 'True cost', 'Cheapest', 'Futile swap'];
  const moA = es ? MONTH_ABBR_ES : MONTH_ABBR_EN;
  const rows = P.cards.map((c) => {
    const nm = es ? c.es : c.en; const bl = BUCKET_LABEL[c.bucket];
    const band = c.bucket === 'withhold' ? '—' : `±${c.bandPct}%`;
    const cost = c.trimTax != null ? `×${c.trimTax.toFixed(2)}` : '—';
    const cheap = c.worthTiming ? `${moA[c.cheapMonth]} −${c.savePct}%` : '—';
    const swap = c.swap ? escHtml(es ? c.swap.es : c.swap.en) : '—';
    return `<tr data-bucket="${c.bucket}"><th scope="row">${escHtml(nm)}</th>`
      + `<td><span class="pb-pill pb-pill--${c.bucket}">${es ? bl.es : bl.en}</span></td>`
      + `<td class="pb-num">${band}</td><td class="pb-num">${cost}</td><td class="pb-num">${cheap}</td><td>${swap}</td></tr>`;
  }).join('');
  // --- figures (grounded in the SAME engine as the prose) interleaved into the guide ------------
  const A = researchInputs(repoRoot);
  const NM = nameMap(repoRoot);
  const nmFn = (s, e) => (NM[s] || { en: s, es: s })[e ? 'es' : 'en'];
  const wrapFig = (bodyHtml, cap, alt) => `<figure class="rs-fig viz-figure" data-audio-alt="${escHtml(alt)}">${bodyHtml}<figcaption class="rs-fig__cap">${escHtml(cap)}</figcaption></figure>`;
  // One figure per guide section, by position (claim → figure → detail). null = no figure.
  const FIGSPEC = [
    { body: () => pbFigSplit(P, es),
      capEn: `Of ${P.total} scored ingredients: ${P.counts.lock} print, ${P.counts.cushion} cushion, ${P.counts.float} float, ${P.counts.withhold} withheld for thin evidence.`,
      capEs: `De ${P.total} ingredientes evaluados: ${P.counts.lock} se imprimen, ${P.counts.cushion} con colchón, ${P.counts.float} flotan, ${P.counts.withhold} reservados por evidencia escasa.`,
      altEn: `A four-column split of ${P.total} scored ingredients by pricing posture: ${P.counts.lock} print a steady price, ${P.counts.cushion} want a cushion, ${P.counts.float} float on market price, and ${P.counts.withhold} are withheld for too little evidence.`,
      altEs: `Una división en cuatro columnas de ${P.total} ingredientes evaluados por postura de precio: ${P.counts.lock} imprimen un precio estable, ${P.counts.cushion} quieren colchón, ${P.counts.float} flotan y ${P.counts.withhold} se reservan por muy poca evidencia.` },
    { body: () => pbFigBands(A, es),
      capEn: 'The steadiest wholesale bands are staples and proteins; the widest are all produce.',
      capEs: 'Las bandas mayoristas más estables son básicos y proteínas; las más anchas son todas de producto fresco.',
      altEn: 'Two ranked bar columns comparing wholesale band width: the steadiest items run near plus or minus one percent, while the wildest — broccoli, yellow squash, raspberry, green leaf lettuce — run above plus or minus twenty-two percent.',
      altEs: 'Dos columnas de barras que comparan el ancho de la banda mayorista: los más estables rondan más o menos uno por ciento, mientras que los más salvajes — brócoli, calabaza amarilla, frambuesa, lechuga verde — superan más o menos veintidós por ciento.' },
    { body: () => pbFigTrim(A, es),
      capEn: 'Trim tax by category — the multiplier from an invoice pound to a plated pound.',
      capEs: 'Impuesto de merma por categoría — el multiplicador de una libra de factura a una libra en el plato.',
      altEn: 'A ranked bar chart of trim tax by category, the cost multiplier of one divided by edible yield, running from citrus at 2.16 times down to mushroom at 1.14 times.',
      altEs: 'Un gráfico de barras del impuesto de merma por categoría, el multiplicador de costo de uno dividido por el rendimiento comestible, de cítricos a 2.16 veces hasta hongos a 1.14 veces.' },
    { body: () => pbFigSeason(P, es),
      capEn: 'Eight proteins with a buying window worth timing — each set in the month it troughs, after its own peak.',
      capEs: 'Ocho proteínas con una ventana de compra que vale cronometrar — cada una en el mes que toca fondo, tras su propio pico.',
      altEn: 'A twelve-month column chart placing eight proteins each in the month it has run cheapest, column height showing how far under the yearly high — whole chicken in May at forty-seven percent, chicken breast in November, striploin in September, down to pork loin in December at eighteen percent — so each cut troughs in a different month, after its own peak, not on one ranked axis.',
      altEs: 'Un gráfico de columnas de doce meses que ubica ocho proteínas cada una en el mes en que ha resultado más barata, con la altura mostrando cuánto queda bajo el máximo anual — pollo entero en mayo al cuarenta y siete por ciento, pechuga en noviembre, bife de lomo en septiembre, hasta lomo de cerdo en diciembre al dieciocho por ciento — así cada corte toca fondo en un mes distinto, tras su propio pico, no en un solo eje ordenado.' },
    { body: () => pbFigMirror(P, es),
      capEn: 'Co-moving protein families — a within-family swap trades one rising number for another.',
      capEs: 'Familias de proteínas que se mueven juntas — un cambio dentro de la familia cambia un número al alza por otro.',
      altEn: 'Chip cards of co-moving protein families showing shared notable moves: chicken breast and thigh, and ground pork and pork shoulder, each moving together in most of their notable windows.',
      altEs: 'Tarjetas de familias de proteínas que se mueven juntas mostrando movimientos notables compartidos: pechuga y muslo de pollo, y cerdo molido y paleta de cerdo, moviéndose juntos en la mayoría de sus ventanas.' },
    null,
  ];
  const figFor = (i) => { const f = FIGSPEC[i]; return f ? wrapFig(f.body(), es ? f.capEs : f.capEn, es ? f.altEs : f.altEn) : ''; };
  // Section = h2 → first paragraph → figure → remaining paragraphs. Breaks the wall of text.
  const secHtml = guide ? (guide.sections || []).map((s, i) => {
    const ps = (s.paragraphs || []).map((p) => `<p>${escHtml(p)}</p>`);
    const fig = figFor(i);
    const head = ps.length ? ps[0] : '';
    const rest = ps.slice(1).join('');
    return `<section class="rs-section"><h2>${escHtml(s.h2)}</h2>${head}${fig}${rest}</section>`;
  }).join('') : '';
  const ledeHtml = guide && Array.isArray(guide.intro) ? guide.intro.map((p) => `<p class="pb-lede">${escHtml(p)}</p>`).join('') : '';
  const durFig = wrapFig(pbFigDuration(A, es),
    es ? `Cuánto se mantiene un choque fuera de su base — mediana ${A.duration.medianDays} días en ${A.duration.total} movimientos.` : `How long a detected shock stays off baseline — median ${A.duration.medianDays} days across ${A.duration.total} moves.`,
    es ? `Un gráfico de rango de la duración del choque en ${A.duration.total} movimientos detectados: el movimiento mediano se mantiene fuera de su base ${A.duration.medianDays} días, y la mitad central se resuelve entre ${A.duration.p25} y ${A.duration.p75} días.` : `A range plot of shock duration across ${A.duration.total} detected moves: the median move stays off its baseline ${A.duration.medianDays} days, with the middle half clearing between ${A.duration.p25} and ${A.duration.p75} days.`);
  const playHtml = guide && guide.operatorPlay ? `<aside class="pb-play"><h3>${es ? 'Esta semana' : 'This week'}</h3><p>${escHtml(guide.operatorPlay)}</p>${durFig}</aside>` : '';
  const takeawayHtml = guide && guide.takeaway ? `<p class="pb-takeaway">${escHtml(guide.takeaway)}</p>` : '';
  const guideHtml = guide ? `<div class="pb-guide">${ledeHtml}${secHtml}${playHtml}${takeawayHtml}</div>` : '';
  // --- methodology: calculations broken into inspectable dropdowns (CC-BY reproducibility) -------
  const ex = (slug) => P.cards.find((c) => c.slug === slug) || {};
  const rib = ex('ribeye'); const rom = ex('romaine-lettuce'); const crab = ex('whole-crab');
  const thigh = ex('chicken-thigh'); const shoulder = ex('pork-shoulder');
  const method = [
    { sEn: `The ±band → print, cushion, float, or withhold`, sEs: `La banda ± → fijar, colchón, flotar o reservar`,
      bEn: `Each ingredient's band is the half-width of its wholesale reference around its own recent normal: ±X% means a typical week sits within X% of center. It measures <em>predictability</em>, not price level, and it is a wholesale reference — never your delivered price. Posture takes <em>two</em> things, not one: how tight the band is <em>and</em> whether it has proven out. A band that is both tight and has held across enough recent weeks prints (lock); a tight band that has not yet proven gets a cushion — price to the top of it; a wide band floats; too little recent history → withhold (unproven, not unstable). That is why a tighter ±${thigh.bandPct}% band (chicken thigh) can be a cushion while a wider ±${shoulder.bandPct}% one (pork shoulder) prints: the wider band simply had more proof behind it. <b>Worked:</b> ribeye's band is ±${rib.bandPct}% → lock; romaine's is ±${rom.bandPct}% → float.`,
      bEs: `La banda de cada ingrediente es la semi-amplitud de su referencia mayorista alrededor de su propio normal reciente: ±X% significa que una semana típica queda dentro del X% del centro. Mide la <em>previsibilidad</em>, no el nivel de precio, y es una referencia mayorista — nunca tu precio de entrega. La postura toma <em>dos</em> cosas, no una: qué tan estrecha es la banda <em>y</em> si se ha comprobado. Una banda estrecha que además se ha sostenido suficientes semanas recientes se imprime (fijar); una banda estrecha que aún no se comprueba recibe colchón — ponle precio al tope; una banda ancha flota; muy poco historial reciente → reservar (no probado, no inestable). Por eso una banda más estrecha de ±${thigh.bandPct}% (muslo de pollo) puede ser colchón mientras una más ancha de ±${shoulder.bandPct}% (paleta de cerdo) se imprime: la banda más ancha tenía más comprobación detrás. <b>Ejemplo:</b> la banda del ribeye es ±${rib.bandPct}% → fijar; la de la romana es ±${rom.bandPct}% → flotar.` },
    { sEn: `True cost = 1 ÷ edible yield (the trim tax)`, sEs: `Costo real = 1 ÷ rendimiento comestible (el impuesto de merma)`,
      bEn: `An invoice price is per pound <em>bought</em>; a plate price is per pound <em>served</em>. Trim tax = 1 ÷ edible yield converts one to the other. Romaine keeps ${rom.yieldPct}% after trim → 1 ÷ 0.${rom.yieldPct} = ×${rom.trimTax != null ? rom.trimTax.toFixed(2) : ''}: every invoice dollar is $${rom.trimTax != null ? rom.trimTax.toFixed(2) : ''} on the plate. Whole crab keeps just ${crab.yieldPct}% → ×${crab.trimTax != null ? crab.trimTax.toFixed(2) : ''}. Always multiply by the item's <em>own</em> yield, never a category average. <b>Caveat:</b> these are generic book yields (raw edible trim only). They exclude cooking loss and, for a frozen-then-thawed cut, thaw purge; and for anything you juice or use as garnish the edible-flesh figure won't match your real use. Treat the trim tax as a starting estimate and verify it against your own fabrication.`,
      bEs: `Un precio de factura es por libra <em>comprada</em>; uno de plato es por libra <em>servida</em>. Impuesto de merma = 1 ÷ rendimiento comestible convierte uno en otro. La romana conserva ${rom.yieldPct}% tras el recorte → 1 ÷ 0.${rom.yieldPct} = ×${rom.trimTax != null ? rom.trimTax.toFixed(2) : ''}: cada dólar de factura es $${rom.trimTax != null ? rom.trimTax.toFixed(2) : ''} en el plato. El cangrejo entero conserva solo ${crab.yieldPct}% → ×${crab.trimTax != null ? crab.trimTax.toFixed(2) : ''}. Multiplica siempre por el rendimiento <em>propio</em> del artículo, nunca por un promedio de categoría. <b>Salvedad:</b> son rendimientos genéricos de referencia (solo merma comestible en crudo). Excluyen la pérdida por cocción y, en un corte congelado y descongelado, la purga; y para lo que exprimes o usas de guarnición el dato de pulpa comestible no coincide con tu uso real. Trátalo como estimación inicial y verifícalo contra tu propio despiece.` },
    { sEn: `When a cheapest month is real, not noise`, sEs: `Cuándo un mes más barato es real, no ruido`,
      bEn: `A cheapest-month window is named only when the trough clears the noise: (1) the cheap month's median beats the dearest month's own 25th-percentile week, <em>and</em> (2) the peak-to-trough swing is at least the ordinary within-month spread. Save% = (dear median − cheap median) ÷ dear median. Whole turkey fails both — its monthly medians scatter and a typical January already undercuts a typical February — so it earns no window and prices year-round. Descriptive of the tracked record, never a forecast. <b>Why an item can be "withheld" yet still name a cheap month:</b> the ±band scores an item's <em>recent weeks</em>, while the seasonal low reads its <em>deep multi-year history</em> — two different windows, so thin recent evidence and a real long-run cheap month can honestly coexist.`,
      bEs: `Una ventana de mes más barato se nombra solo cuando el fondo supera el ruido: (1) la mediana del mes barato vence a la semana del percentil 25 del mes más caro, <em>y</em> (2) el vaivén de pico a fondo es al menos la dispersión habitual dentro del mes. Ahorro% = (mediana cara − mediana barata) ÷ mediana cara. El pavo entero falla ambas — sus medianas mensuales se dispersan y un enero típico ya queda por debajo de un febrero típico — así que no gana ventana y se cotiza todo el año. Descriptivo del registro, nunca un pronóstico. <b>Por qué un artículo puede estar "reservado" y aun así nombrar un mes barato:</b> la banda ± puntúa las <em>semanas recientes</em> del artículo, mientras que el mínimo estacional lee su <em>historial profundo de varios años</em> — dos ventanas distintas, así que evidencia reciente escasa y un mes barato real de largo plazo pueden coexistir honestamente.` },
    { sEn: `When a swap only mirrors the rise (k of n)`, sEs: `Cuándo un cambio solo refleja la subida (k de n)`,
      bEn: `For each item we count how many of its notable moves a neighbor shared — k of n. Pork shoulder and ground pork shared 6 of 6: every notable move moved together, so the swap is a mirror, not a hedge. Below half shared → the swap is a real hedge. This is co-occurrence, never cause — a shared growing region or shipping lane, not one item pushing the other.`,
      bEs: `Para cada artículo contamos cuántos de sus movimientos notables compartió un vecino — k de n. Paleta de cerdo y cerdo molido compartieron 6 de 6: cada movimiento notable se movió junto, así que el cambio es un espejo, no una cobertura. Menos de la mitad compartido → el cambio sí cubre. Esto es coincidencia, nunca causa — una región de cultivo o ruta de envío compartida, no un artículo empujando al otro.` },
  ];
  const methodHtml = `<section class="pb-method" aria-labelledby="pb-method-h">
    <h2 id="pb-method-h" class="rs-section-h">${es ? 'Cómo se calcula cada número' : 'How each number is computed'}</h2>
    <p class="pb-tool__lede">${es ? 'Cada capa es una fórmula sobre los datos abiertos — inspecciónala. Abre cualquiera para ver el cálculo y un ejemplo con números reales.' : 'Every layer is a formula over the open data — inspect it. Open any one for the calculation and a worked example with real numbers.'}</p>
    ${method.map((m) => `<details class="pb-calc"><summary>${es ? m.sEs : m.sEn}</summary><p>${es ? m.bEs : m.bEn}</p></details>`).join('')}
    <details class="pb-calc"><summary>${es ? 'Los ingredientes de mayor merma' : 'The steepest-trim single items'}</summary>${figWorst(A, es, nmFn)}</details>
  </section>`;
  // --- CC-BY cite + license + download (this is open-data content) ------------------------------
  const citeHtml = `<section class="pb-cite" aria-labelledby="pb-cite-h">
    <h2 id="pb-cite-h" class="rs-section-h">${es ? 'Cita y descarga (CC BY 4.0)' : 'Cite &amp; download (CC BY 4.0)'}</h2>
    <p>${es ? `Este manual une cuatro conjuntos abiertos de Muntin por ingrediente — fijar-o-flotar y co-movimiento, rendimientos (CC BY 4.0) y normales estacionales (CC0). La tabla unida de ${P.total} ingredientes se publica bajo <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a>: úsala, con atribución.` : `This playbook joins four Muntin open sets per ingredient — lock-or-float and co-movement, yields (CC BY 4.0) and seasonal normals (CC0). The joined ${P.total}-ingredient table is released under <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a>: reuse it, with attribution.`}</p>
    <p class="pb-cite__cite"><span class="pb-cite__lab">${es ? 'Cita' : 'Cite'}</span> Muntin Cost Index — Menu-Pricing Playbook dataset. muntin.digital${base}/cost-index/menu-pricing/. CC BY 4.0.</p>
    <p class="pb-cite__dl"><a class="pb-dl" href="/cost-index/menu-pricing.json" download>menu-pricing.json</a><a class="pb-dl" href="/cost-index/menu-pricing.csv" download>menu-pricing.csv</a><a class="pb-dl pb-dl--ghost" href="${base}/open/">${es ? 'Todos los datos abiertos →' : 'All the open data →'}</a></p>
  </section>`;
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': ['CollectionPage', 'HowTo'], '@id': (es ? canonEs : canonEn) + '#page', 'url': es ? canonEs : canonEn, 'name': h1, 'inLanguage': es ? 'es-US' : 'en-US', 'description': desc, 'isPartOf': { '@id': 'https://muntin.digital/#website' }, 'isBasedOn': 'https://muntin.digital/open/', 'speakable': { '@type': 'SpeakableSpecification', 'cssSelector': ['h1', '.ci-answer'] } },
    { '@type': 'BreadcrumbList', 'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': es ? 'Inicio' : 'Home', 'item': es ? 'https://muntin.digital/es/' : 'https://muntin.digital/' },
      { '@type': 'ListItem', 'position': 2, 'name': es ? 'Índice de costos' : 'Cost index', 'item': `https://muntin.digital${base}/cost-index/` },
      { '@type': 'ListItem', 'position': 3, 'name': h1, 'item': es ? canonEs : canonEn } ] },
  ] }).replace(/</g, '\\u003c');
  const answer = es
    ? `De ${P.total} ingredientes, ${P.counts.lock} se han mantenido bastante estables para imprimir su precio, ${P.counts.cushion} piden colchón, ${P.counts.float} deben flotar y ${P.counts.withhold} se reservan por evidencia escasa — y para ${P.layer4} este manual une las cuatro capas: precio, costo comestible, mes más barato y qué cambio no ahorra nada.`
    : `Of ${P.total} ingredients, ${P.counts.lock} have held steady enough to print their price, ${P.counts.cushion} want a cushion, ${P.counts.float} should float, and ${P.counts.withhold} are withheld for thin evidence — and for ${P.layer4} this playbook joins all four layers: pricing, edible cost, cheapest month, and which swap saves nothing.`;
  const cross = [
    [es ? 'La herramienta fijar-o-flotar' : 'The lock-or-float tool', `${base}/tools/cost-pulse/`],
    [es ? 'Costea un plato' : 'Cost a plate', `${base}/tools/plate-cost/`],
    [es ? 'Compara tu factura con la referencia' : 'Check your invoice vs the reference', `${base}/tools/vendor-benchmark/`],
    [es ? 'Los datos abiertos' : 'The open data', `${base}/open/`],
  ];
  const relHtml = `<nav class="rs-related" aria-label="${es ? 'Herramientas' : 'Tools'}"><h2>${es ? 'Llévalo a la práctica' : 'Put it to work'}</h2><ul>${cross.map(([t, u]) => `<li><a href="${u}">${escHtml(t)}</a></li>`).join('')}</ul></nav>`;
  // Kitchen profiles: ingredients we track for prep (yield, storage, season, substitutes) but do
  // NOT yet publish a wholesale band for — the 16 new staples + the yield-only items. Honest breadth:
  // a full profile, plainly labeled "no wholesale band tracked yet." Static (no picker/JS).
  const pricedSlugs = new Set(P.cards.map((c) => c.slug));
  const profiles = Object.keys(DEPTH).filter((s) => !pricedSlugs.has(s) && DEPTH[s]).map((s) => ({ slug: s, ...DEPTH[s] }))
    .sort((a, b) => (Number(b.isNew) - Number(a.isNew)) || String(a.en).localeCompare(String(b.en)));
  const helpSub = (D) => { const h = (D.substitutes || []).find((x) => x.hedge && x.hedge.verdict === 'hedge' && !x.hedge.thin) || (D.substitutes || [])[0]; return h ? h.name : '—'; };
  const cookCell = (D) => D.cookedYield == null ? '—' : (D.cookedYield < 1 ? `${Math.round(D.cookedYield * 100)}%` : `×${D.cookedYield}`);
  const profTh = es ? ['Ingrediente', 'Comestible', 'Cocido', 'Dura', 'Un cambio que ayuda', 'Mejor temporada'] : ['Ingredient', 'Edible', 'Cooked', 'Keeps', 'A swap that helps', 'Best season'];
  const profRows = profiles.map((D) => {
    const nm = es ? (D.es || D.en) : D.en;
    const edible = D.edibleYield != null ? `${Math.round(D.edibleYield * 100)}%` : '—';
    const keeps = D.shelfLifeDays != null ? `${D.shelfLifeDays}${es ? ' d' : ' d'}` : '—';
    const season = D.peakSeason ? escHtml(D.peakSeason) : (es ? 'todo el año' : 'year-round');
    const tag = D.isNew ? `<span class="pb-newtag">${es ? 'nuevo' : 'new'}</span>` : '';
    return `<tr><th scope="row">${escHtml(nm)}${tag}</th><td class="pb-num">${edible}</td><td class="pb-num">${cookCell(D)}</td><td class="pb-num">${keeps}</td><td>${escHtml(helpSub(D))}</td><td>${season}</td></tr>`;
  }).join('');
  const profilesHtml = profiles.length ? `<section class="pb-tablewrap" aria-labelledby="pb-prof-h">
      <h2 id="pb-prof-h" class="rs-section-h">${es ? `${profiles.length} perfiles de cocina — sin banda de precio aún` : `${profiles.length} kitchen profiles — no price band yet`}</h2>
      <p class="pb-tool__lede">${es ? 'Los ingredientes que seguimos para la preparación pero cuyo precio mayorista aún no publicamos (los básicos nuevos y los de solo-rendimiento). Rendimiento, conservación, temporada y sustitutos verificados; el precio se enciende cuando el índice lo cubra.' : 'Ingredients we track for prep but do not yet publish a wholesale price for (the new staples + yield-only items). Verified yield, storage, season, and substitutes; the price lights up when the index covers it.'}</p>
      <div class="rs-scroll"><table class="rs-table pb-table"><thead><tr>${profTh.map((h, i) => `<th scope="col"${i >= 1 && i <= 3 ? ' class="pb-num"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${profRows}</tbody></table></div>
    </section>` : '';
  const body = `
  <nav class="breadcrumb" aria-label="Breadcrumb"><a href="${base}/">${es ? 'Inicio' : 'Home'}</a> › <a href="${base}/cost-index/">${es ? 'Índice de costos' : 'Cost index'}</a> › ${escHtml(h1)}</nav>
  <div class="rs" data-accent="teal">
  <section class="ci-hero rs-hero"><p class="ci-eyebrow rs-hero__eyebrow">${es ? 'Investigación Muntin' : 'Muntin Research'}</p>
    <h1>${escHtml(h1)}</h1>
    <p class="ci-answer rs-hero__answer">${escHtml(answer)}</p></section>
  <div class="ci-body rs-body pb-body">
    <section class="pb-tool" aria-labelledby="pb-tool-h">
      <h2 id="pb-tool-h" class="rs-section-h">${es ? 'Busca un ingrediente' : 'Look up an ingredient'}</h2>
      <p class="pb-tool__lede">${es ? 'Elige un ingrediente para ver su tarjeta de precios: qué fijar o flotar, el costo real por porción comestible, el mes más barato y qué cambio no te ahorra nada.' : 'Pick an ingredient to see its pricing card — what to print or float, the true cost per edible portion, the cheapest month, and which swap saves you nothing.'}</p>
      <div class="pb-picker"><label for="pbSel">${es ? 'Ingrediente' : 'Ingredient'}</label>
        <select id="pbSel">${options}</select></div>
      <div id="pbCard">${cardHtml(def)}</div>
    </section>
    ${methodHtml}
    ${guideHtml}
    <section class="pb-tablewrap" aria-labelledby="pb-table-h">
      <h2 id="pb-table-h" class="rs-section-h">${es ? 'Los ' + P.total + ' ingredientes, de un vistazo' : 'All ' + P.total + ' ingredients, at a glance'}</h2>
      <p class="pb-tool__lede">${es ? 'Ordenados por postura de precio (fijar → flotar). La banda es una referencia mayorista contra su propio normal, nunca el precio de entrega.' : 'Sorted by pricing posture (print → float). The band is a wholesale reference against its own normal, never the delivered price.'}</p>
      <div class="rs-scroll"><table class="rs-table pb-table"><thead><tr>${th.map((h, i) => `<th scope="col"${i > 1 ? ' class="pb-num"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
    </section>
    ${profilesHtml}
    ${citeHtml}
    ${relHtml}
    <p class="rs-src">${es ? 'Une cuatro conjuntos abiertos de Muntin — fijar-o-flotar y co-movimiento (CC-BY), rendimientos (CC-BY) y normales estacionales (CC0) — cada uno una lectura de referencia mayorista contra la propia línea base del ingrediente, no el precio de entrega. Descriptivo, nunca un pronóstico; coincidencia, nunca causa.' : "Joins four Muntin open sets — lock-or-float and co-movement (CC-BY), yields (CC-BY), and seasonal normals (CC0) — each a wholesale-reference read against the ingredient's own baseline, not the delivered price. Descriptive, never a forecast; co-occurrence, never cause."}</p>
    <div class="rs-cta"><a class="btn btn-primary" href="${base}/tools/cost-pulse/">${es ? 'Abre la herramienta fijar-o-flotar' : 'Open the lock-or-float tool'} <span aria-hidden="true">→</span></a></div>
  </div>
  </div>
  <script type="application/json" id="pbData">${JSON.stringify(cardData).replace(/</g, '\\u003c')}</script>
  <script>
  (function(){
    var sel=document.getElementById('pbSel'),host=document.getElementById('pbCard'),el=document.getElementById('pbData');
    if(!sel||!host||!el)return; var cards;try{cards=JSON.parse(el.textContent)}catch(e){return}
    var byId={};for(var i=0;i<cards.length;i++)byId[cards[i].slug]=cards[i];
    var LB=${JSON.stringify(Object.fromEntries(Object.keys(BUCKET_LABEL).map((k) => [k, es ? BUCKET_LABEL[k].es : BUCKET_LABEL[k].en])))};
    function mk(t,c,txt){var e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e}
    function render(c){
      while(host.firstChild)host.removeChild(host.firstChild);
      var art=mk('article','pb-card');art.setAttribute('data-bucket',c.bucket);
      var hd=mk('header','pb-card__head');hd.appendChild(mk('h3','pb-card__name',c.name));
      var pill=mk('span','pb-pill pb-pill--'+c.bucket,LB[c.bucket]||c.bucket);hd.appendChild(pill);art.appendChild(hd);
      art.appendChild(mk('p','pb-card__posture',c.lines.posture));
      var ul=mk('ul','pb-card__layers');
      ['cost','time','swap'].forEach(function(k){ul.appendChild(mk('li','pb-lyr pb-lyr--'+k,c.lines[k==='time'?'timing':k]))});
      art.appendChild(ul);
      if(c.depth&&c.depth.lines&&c.depth.lines.length){
        var d=mk('details','pb-more');d.appendChild(mk('summary',null,${JSON.stringify(moreLabel)}));
        var dl=mk('ul','pb-deplist');c.depth.lines.forEach(function(l){dl.appendChild(mk('li','pb-dep pb-dep--'+l.k,l.t))});d.appendChild(dl);
        var sp=mk('p','pb-dep__src');sp.appendChild(mk('span',null,c.depth.note));
        if(c.depth.source){sp.appendChild(document.createTextNode(' '));sp.appendChild(mk('span','pb-dep__cite',${JSON.stringify(es ? 'Fuente' : 'Source')}+': '+c.depth.source));}
        d.appendChild(sp);art.appendChild(d);
      }
      host.appendChild(art);
    }
    sel.addEventListener('change',function(){var c=byId[sel.value];if(c)render(c)});
  })();
  </script>`;
  return pageHead({ lang, locale, title, desc, canonEn, canonEs, jsonld, extraCss: `<style>${RESEARCH_CSS}${PLAYBOOK_CSS}</style>` }) + body + pageTail;
}

// Build the /cost-index/research/ targets. Empty until data/cost-research-content.json exists,
// so the page build never breaks while the content is in flight.
export function researchTargets(ctx) {
  const { repoRoot } = ctx;
  const targets = [];
  // The flagship: the menu-pricing playbook — always emitted (joins all four datasets per
  // ingredient into one decision surface). The thin single-metric research pages are retired.
  targets.push({ path: 'cost-index/menu-pricing/index.html', content: emitPlaybook('en', ctx) });
  targets.push({ path: 'es/cost-index/menu-pricing/index.html', content: emitPlaybook('es', ctx) });
  // The joined dataset as a CC-BY open-data artifact (JSON + CSV). Language-neutral, one canonical
  // copy both locales link to. No timestamp → stable across rebuilds (no spurious drift).
  const ds = pricingDataset(repoRoot);
  targets.push({ path: 'cost-index/menu-pricing.json', content: ds.json });
  targets.push({ path: 'cost-index/menu-pricing.csv', content: ds.csv });
  return targets;
}

// The menu-pricing playbook as a downloadable CC-BY dataset — one row per scored ingredient, the
// four joined layers. Cheapest-month/save only where the noise-gated window is real (matches the
// on-page table). Honest nulls elsewhere. Deterministic (no timestamp) so rebuilds don't churn it.
function pricingDataset(repoRoot) {
  const P = pricingCards(repoRoot);
  const rows = P.cards.map((c) => ({
    slug: c.slug, name: c.en, category: c.cat || null, posture: c.bucket,
    band_pct: c.bucket === 'withhold' ? null : c.bandPct,
    coverage_pct: c.coverage, edible_yield_pct: c.yieldPct, trim_tax: c.trimTax,
    cheapest_month: c.worthTiming ? c.cheapMonth : null,
    save_pct: c.worthTiming ? c.savePct : null,
    comover: c.swap ? c.swap.en : null,
    comover_shared: c.swap ? c.swap.k : null, comover_of: c.swap ? c.swap.n : null,
  }));
  const meta = {
    dataset: 'Muntin Cost Index — Menu-Pricing Playbook',
    url: 'https://muntin.digital/cost-index/menu-pricing/',
    license: 'CC BY 4.0', license_url: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Muntin Cost Index (muntin.digital)',
    joins: 'lock-or-float + co-movement (CC-BY), yields (CC-BY), seasonal normals (CC0)',
    note: "Every band is a wholesale reference read against each ingredient's own baseline window — never a delivered or retail price. cheapest_month is named only when the seasonal trough clears the noise gate; null means priced year-round. Descriptive of the tracked record, never a forecast; co-occurrence, never cause.",
    count: rows.length, ingredients: rows,
  };
  const cols = ['slug', 'name', 'category', 'posture', 'band_pct', 'coverage_pct', 'edible_yield_pct', 'trim_tax', 'cheapest_month', 'save_pct', 'comover', 'comover_shared', 'comover_of'];
  const esc = (v) => { if (v == null) return ''; const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [cols.join(',')].concat(rows.map((r) => cols.map((k) => esc(r[k])).join(','))).join('\n') + '\n';
  return { json: JSON.stringify(meta, null, 2) + '\n', csv };
}

function emitResearchPage(page, loc, A, nm, ctx) {
  const { pageHead, pageTail, escHtml } = ctx;
  const es = loc === 'es'; const lang = es ? 'es' : 'en'; const base = es ? '/es' : '';
  const spec = page[loc]; const accent = page.accent || 'var(--teal)';
  const canonEn = `https://muntin.digital/cost-index/research/${page.slug}/`;
  const canonEs = `https://muntin.digital/es/cost-index/research/${page.slug}/`;
  const secHtml = (spec.sections || []).map((s) => {
    const paras = (s.paragraphs || []).map((p) => `<p>${escHtml(p)}</p>`).join('');
    const fig = s.figureKey ? renderFigure(s.figureKey, A, es, nm, s.figureCaption, s.figureAudioAlt, escHtml) : '';
    return `<section class="rs-section"><h2>${escHtml(s.h2)}</h2>${paras}${fig}</section>`;
  }).join('');
  const crumb = [[es ? 'Inicio' : 'Home', es ? 'https://muntin.digital/es/' : 'https://muntin.digital/'],
    [es ? 'Índice de costos' : 'Cost index', `https://muntin.digital${base}/cost-index/`],
    [es ? 'Investigación' : 'Research', `https://muntin.digital${base}/cost-index/research/`],
    [escHtml(spec.h1), es ? canonEs : canonEn]];
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', '@id': (es ? canonEs : canonEn) + '#article', 'headline': spec.h1, 'name': spec.title,
      'inLanguage': es ? 'es-US' : 'en-US', 'description': spec.metaDesc, 'datePublished': RESEARCH_PUBLISHED,
      'isAccessibleForFree': true, 'author': { '@id': 'https://muntin.digital/#business' }, 'publisher': { '@id': 'https://muntin.digital/#business' },
      'isBasedOn': 'https://muntin.digital/open/', 'speakable': { '@type': 'SpeakableSpecification', 'cssSelector': ['h1', '.ci-answer'] } },
    { '@type': 'BreadcrumbList', 'itemListElement': crumb.map((c, i) => ({ '@type': 'ListItem', 'position': i + 1, 'name': c[0], 'item': c[1] })) },
  ] }).replace(/</g, '\\u003c');
  const rel = (page.crossLinks || spec.crossLinks || []);
  const relHtml = rel.length ? `<nav class="rs-related" aria-label="${es ? 'Relacionado' : 'Related'}"><h2 class="rs-related__h">${es ? 'Sigue el hilo' : 'Follow the thread'}</h2><div class="rs-related__grid">`
    + rel.map(([t, u]) => `<a class="rs-related__link" href="${u.startsWith('http') ? u : base + u}"><p class="rs-related__q">${escHtml(t)}</p></a>`).join('') + `</div></nav>` : '';
  const cta = es ? 'Compara tu factura con la referencia' : 'Check your invoice against the reference';
  const body = `
  <div class="rs" data-accent="${accentScope(accent)}">
  <nav class="breadcrumb" aria-label="Breadcrumb"><a href="${base}/">${es ? 'Inicio' : 'Home'}</a> › <a href="${base}/cost-index/">${es ? 'Índice de costos' : 'Cost index'}</a> › <a href="${base}/cost-index/research/">${es ? 'Investigación' : 'Research'}</a></nav>
  <section class="ci-hero rs-hero">
    <p class="ci-eyebrow rs-hero__eyebrow"><a href="${base}/cost-index/research/">${es ? 'Investigación Muntin' : 'Muntin Research'}</a></p>
    <h1>${escHtml(spec.h1)}</h1>
    <p class="ci-answer rs-hero__answer">${escHtml(spec.speakableAnswer)}</p>
  </section>
  <div class="ci-body">
    ${(spec.intro || []).map((p) => `<p class="rs-lede">${escHtml(p)}</p>`).join('')}
    ${secHtml}
    <section class="rs-takeaway"><p class="rs-takeaway__h">${es ? 'Qué hacer con esto' : 'What to do with this'}</p><p class="rs-takeaway__b">${escHtml(spec.operatorPlay)}</p></section>
    <details class="rs-src"><summary>${es ? 'Fuentes y método' : 'Sources & method'}</summary><div class="rs-src__body">${escHtml(spec.sourcesNote)}</div></details>
    ${relHtml}
    <div class="rs-cta"><a class="btn btn-primary" href="${base}/tools/vendor-benchmark/">${cta} <span aria-hidden="true">→</span></a></div>
  </div>
  </div>`;
  return pageHead({ lang, locale: loc, title: spec.title, desc: spec.metaDesc, canonEn, canonEs, jsonld, extraCss: `<style>${RESEARCH_CSS}</style>` }) + body + pageTail;
}

function emitResearchHub(content, loc, ctx) {
  const { pageHead, pageTail, escHtml } = ctx;
  const es = loc === 'es'; const lang = es ? 'es' : 'en'; const base = es ? '/es' : '';
  const canonEn = 'https://muntin.digital/cost-index/research/';
  const canonEs = 'https://muntin.digital/es/cost-index/research/';
  const h1 = es ? 'Investigación del Cost Index' : 'Cost Index research';
  const title = es ? 'Investigación — Muntin Cost Index' : 'Research — Muntin Cost Index';
  const desc = es ? 'Análisis original sobre los datos abiertos del Cost Index: co-movimiento, impuesto de merma, volatilidad, duración de choques y estacionalidad.'
    : 'Original analysis over the Cost Index open data: co-movement, trim tax, volatility, shock duration, and seasonality.';
  const STRANDS = {
    'what-moves-together': ['Co-movement', 'Co-movimiento'],
    'trim-tax-across-the-pantry': ['Yield & trim', 'Rendimiento y merma'],
    'steady-vs-wild': ['Volatility', 'Volatilidad'],
    'how-long-do-food-price-shocks-last': ['Shock duration', 'Duración del shock'],
    'cheapest-month-buying-calendar': ['Seasonality', 'Estacionalidad'],
    'reading-your-invoice-against-wholesale': ['Invoice method', 'Método de factura'],
  };
  const cards = content.pages.map((p) => {
    const s = p[loc];
    const kick = (STRANDS[p.slug] || ['Research', 'Investigación'])[es ? 1 : 0];
    return `<a class="rs-hub-card" data-accent="${accentScope(p.accent || 'var(--teal)')}" href="${base}/cost-index/research/${p.slug}/">`
      + `<p class="rs-hub-card__kicker">${kick}</p>`
      + `<h2 class="rs-hub-card__q">${escHtml(s.h1)}</h2>`
      + `<p class="rs-hub-card__a">${escHtml(s.takeaway)}</p>`
      + `<span class="rs-hub-card__go">${es ? 'Leer' : 'Read'}</span></a>`;
  }).join('');
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': (es ? canonEs : canonEn) + '#page', 'url': es ? canonEs : canonEn, 'name': h1, 'inLanguage': es ? 'es-US' : 'en-US', 'description': desc, 'isPartOf': { '@id': 'https://muntin.digital/#website' } },
    { '@type': 'ItemList', 'numberOfItems': content.pages.length, 'itemListElement': content.pages.map((p, i) => ({ '@type': 'ListItem', 'position': i + 1, 'name': p[loc].h1, 'url': `https://muntin.digital${base}/cost-index/research/${p.slug}/` })) },
  ] }).replace(/</g, '\\u003c');
  const body = `
  <div class="rs" data-accent="teal">
  <nav class="breadcrumb" aria-label="Breadcrumb"><a href="${base}/">${es ? 'Inicio' : 'Home'}</a> › <a href="${base}/cost-index/">${es ? 'Índice de costos' : 'Cost index'}</a> › ${es ? 'Investigación' : 'Research'}</nav>
  <section class="ci-hero"><p class="ci-eyebrow">${es ? 'Investigación' : 'Research'}</p><h1>${escHtml(h1)}</h1><p class="ci-lede">${escHtml(desc)}</p></section>
  <div class="rs-hub"><p class="rs-hub__lede">${escHtml(RESEARCH_HUB_BLURB[loc])}</p><div class="rs-hub__grid">${cards}</div></div>
  </div>`;
  return pageHead({ lang, locale: loc, title, desc, canonEn, canonEs, jsonld, extraCss: `<style>${RESEARCH_CSS}</style>` }) + body + pageTail;
}

const RESEARCH_PUBLISHED = '2026-07-11';

// CLI debug: node scripts/lib/cost-research.mjs --debug (from repo root)
if (import.meta.url === `file://${process.argv[1]}`) {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
  const A = researchInputs(repoRoot);
  console.log('clusters:', A.clusters.map((c) => ({ size: c.size, tight: c.tight, members: c.members })));
  console.log('company:', A.company);
  console.log('trimTaxCats:', A.trimTaxCats.map((c) => ({ cat: c.cat, tax: +c.tax.toFixed(2), meanYield: +(c.meanYield * 100).toFixed(0), n: c.n })));
  console.log('worstYields:', A.worstYields.map((w) => ({ en: w.en, tax: +w.tax.toFixed(2) })));
  console.log('volatility counts:', A.volatility.counts, 'total', A.volatility.total);
  console.log('  lock (steady):', A.volatility.lock.map((x) => x.name + ' ' + (x.halfWidthPct * 100).toFixed(1) + '%'));
  console.log('  float (wild):', A.volatility.float.map((x) => x.name + ' ' + (x.halfWidthPct * 100).toFixed(1) + '%'));
  console.log('duration:', A.duration);
  console.log('calendar readyN:', A.calendar.readyN);
  for (let m = 1; m <= 12; m++) console.log('  month', m, '→', A.calendar.byMonth[m].length, 'cheapest; top', A.calendar.byMonth[m].slice(0, 3).map((x) => x.slug + ' ' + x.savePct + '%'));
}
