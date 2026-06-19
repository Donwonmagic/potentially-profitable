#!/usr/bin/env node
/**
 * build-cost-plate-drift.mjs — quarterly plate-cost drift, the truth-discovery
 * artifact behind the "Live Plate Margin" capability.
 *
 * Tests a falsifiable claim from market data ALONE: independent plate margins
 * drift measurably between recostings. Operators are advised to recost only
 * ~every six months (data/sourced-claims.json #menu_recost_cadence_six_months_2026)
 * while wholesale moves far faster than menus (#menu_price_lag_wholesale_2025) —
 * so this measures how much a protein-forward plate's cost moved over one quarter.
 *
 * Two honesty-tiered layers, both DERIVED-WITH-STATED-METHOD (no operator data,
 * no invented prices):
 *   1. ingredientDrift — per-ingredient wholesale % change over the quarter
 *      (unit-agnostic), with distribution stats and a proteins subset.
 *   2. plateArchetypes — a few EXPLICITLY ILLUSTRATIVE protein-forward plates
 *      (standard culinary portions) recosted at the quarter's start vs end.
 *      Ingredients without a bridgeable $/lb level are excluded and counted —
 *      never guessed (flag-don't-fabricate).
 *
 * Deterministic: the window is derived from the DATA (cost-index-history.json),
 * never wall-clock. Built like scripts/backtest-cost-forecast.mjs; ships to no
 * page; CI re-checks with --check.
 *
 *   node scripts/build-cost-plate-drift.mjs            # write data/cost-plate-drift.json
 *   node scripts/build-cost-plate-drift.mjs --check    # CI: exit 1 if stale
 *   node scripts/build-cost-plate-drift.mjs --self-test
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const repo = path.resolve(path.dirname(__filename), '..');
const require = createRequire(import.meta.url);
const BRIDGE = require(path.join(repo, 'tools/_shared/portion-bridge.js'));

const OUT = path.join(repo, 'data', 'cost-plate-drift.json');
const rd = (p) => { try { return JSON.parse(readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } };

// ---- deterministic helpers -------------------------------------------------

function round(n, d) { const f = Math.pow(10, d); return Math.round(n * f) / f; }

// Percentile of a numeric array (linear interpolation), deterministic.
function quantile(sorted, q) {
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

// 'YYYY-MM-01' three calendar months before the given 'YYYY-MM-01'.
function quarterBefore(ym) {
  const [y, m] = ym.split('-').map(Number);
  let ny = y, nm = m - 3;
  while (nm < 1) { nm += 12; ny -= 1; }
  return ny + '-' + String(nm).padStart(2, '0') + '-01';
}

// Representative valueCents for a calendar month = the MEDIAN of that month's
// observations. The deep history is monthly with a few recent sub-monthly
// appends; taking the month's median (not "nearest on/before") stops a mid-month
// local peak from masquerading as a quarter move, and is symmetric on both ends.
// Returns null when the month has no observation (skipped, never guessed).
function priceInMonth(series, ym) {
  const v = series.filter((p) => p.date.slice(0, 7) === ym).map((p) => p.valueCents).sort((a, b) => a - b);
  return v.length ? quantile(v, 0.5) : null;
}

// Some Cost Index entries are labeled per-lb but carry a level on another basis
// (e.g. vegetable-oil reads ~$290/"lb" — a bulk/other-basis figure). Flag-don't-
// fabricate: any implausible per-lb level is excluded from plate costing (the
// % drift layer is scale-invariant and keeps it). No real foodservice protein/
// fat trades above this per pound.
const MAX_PLAUSIBLE_PER_LB = 60;

// Per-portion cost ($) of one ingredient at a $/lb level, via the shared bridge.
// Returns null (uncovered) on an implausible level or a unit it can't bridge.
function portionCost(perLbDollars, portionOz, yieldPercent) {
  if (!(perLbDollars > 0) || perLbDollars > MAX_PLAUSIBLE_PER_LB) return null;
  const q = BRIDGE.quoteAtPortion({
    comparable: { perBaseUnit: perLbDollars, baseUnit: 'lb' },
    portion: { qty: portionOz, unit: 'oz' },
    yieldPercent: yieldPercent
  });
  return (q && q.compatible) ? q.perPortionCost : null;
}

// ---- illustrative archetype plates: the INDEXED COMPONENT of a plate --------
// Slugs are real Cost Index keys; portions/yields are illustrative archetypes
// (standard culinary portions), NOT operator data. Built only from clean,
// distinct, plausibly-scaled per-lb proteins/fats (vegetable-oil excluded —
// mis-scaled level; short-rib/beef-tenderloin excluded — placeholder clones of
// ribeye in the deep history). These measure ONLY the indexed protein+fat the
// market moves — not a full recipe — so we report the component cost and its
// drift, never a food-cost % (that would imply a complete dish we don't have).
// Each row: { slug, label, portionOz, yield }.
const ARCHETYPES = [
  { name: 'Pan-seared ribeye', rows: [
    { slug: 'ribeye', label: 'Ribeye', portionOz: 8, yield: 0.85 },
    { slug: 'butter', label: 'Butter', portionOz: 1, yield: 1.0 }
  ]},
  { name: 'Roast chicken breast', rows: [
    { slug: 'chicken-breast', label: 'Chicken breast', portionOz: 6, yield: 0.95 },
    { slug: 'butter', label: 'Butter', portionOz: 0.5, yield: 1.0 }
  ]},
  { name: 'Cheeseburger', rows: [
    { slug: 'ground-beef', label: 'Ground beef', portionOz: 6, yield: 1.0 },
    { slug: 'cheddar-cheese', label: 'Cheddar', portionOz: 1, yield: 1.0 }
  ]},
  { name: 'Pulled pork', rows: [
    { slug: 'pork-shoulder', label: 'Pork shoulder', portionOz: 8, yield: 0.6 },
    { slug: 'butter', label: 'Butter', portionOz: 0.25, yield: 1.0 }
  ]},
  { name: 'Shrimp scampi', rows: [
    { slug: 'shrimp', label: 'Shrimp', portionOz: 6, yield: 0.85 },
    { slug: 'butter', label: 'Butter', portionOz: 1, yield: 1.0 }
  ]}
];

// Bridgeable = priced per lb in the labels (so a portion can be costed).
function bridgeableSet(labels) {
  const lk = labels.labels || labels;
  const out = {};
  for (const k of Object.keys(lk)) if ((lk[k].unit_en || lk[k].unit) === 'lb') out[k] = true;
  return out;
}

function build() {
  const hist = rd('data/cost-index-history.json');
  const labels = rd('data/cost-index-labels.json');
  if (!hist || !hist.ingredients || !labels) {
    return { _doc: 'inputs missing', _version: 1, error: 'missing-inputs' };
  }
  const H = hist.ingredients;
  const isLb = bridgeableSet(labels);

  // Window: derived from the data, not wall-clock. `to` = the latest month with
  // BROAD coverage (≥90% of ingredients have an observation), so both endpoints
  // compare the same basket; `from` = one quarter earlier. This deterministically
  // picks the latest fully-covered quarter (the recent months thin out as some
  // series update less often).
  const total = Object.keys(H).length;
  const monthCov = {};
  for (const k of Object.keys(H)) {
    const months = new Set(H[k].map((p) => p.date.slice(0, 7)));
    for (const m of months) monthCov[m] = (monthCov[m] || 0) + 1;
  }
  let toMonth = '';
  for (const m of Object.keys(monthCov).sort()) if (monthCov[m] >= 0.9 * total) toMonth = m;
  const to = toMonth + '-01';
  const from = quarterBefore(to);
  const fromMonth = from.slice(0, 7);

  // Collapse placeholder clones (byte-identical series — see the data-quality
  // audit, build-cost-index-audit.mjs): keep one representative per cluster so
  // the distribution isn't inflated by duplicate beef cuts etc.
  const seenSig = {};
  const skipClone = {};
  let clonesCollapsed = 0;
  for (const slug of Object.keys(H).sort()) {
    const sig = H[slug].map((p) => p.valueCents).join(',');
    if (seenSig[sig]) { skipClone[slug] = true; clonesCollapsed++; } else seenSig[sig] = slug;
  }

  // ---- layer 1: per-ingredient drift over the quarter ----
  const drifts = [];
  for (const slug of Object.keys(H).sort()) {
    if (skipClone[slug]) continue;
    const s = H[slug];
    const a = priceInMonth(s, fromMonth), b = priceInMonth(s, toMonth);
    if (a == null || b == null || a <= 0) continue;
    drifts.push({ slug, fromCents: Math.round(a), toCents: Math.round(b), pct: round(((b - a) / a) * 100, 2) });
  }
  const pcts = drifts.map((d) => d.pct).sort((x, y) => x - y);
  const proteins = drifts.filter((d) => isLb[d.slug]);
  const protPcts = proteins.map((d) => d.pct).sort((x, y) => x - y);
  const byPctDesc = drifts.slice().sort((a, b) => b.pct - a.pct);

  const ingredientDrift = {
    count: drifts.length,
    clonesCollapsed: clonesCollapsed,
    medianPct: pcts.length ? round(quantile(pcts, 0.5), 2) : null,
    p25Pct: pcts.length ? round(quantile(pcts, 0.25), 2) : null,
    p75Pct: pcts.length ? round(quantile(pcts, 0.75), 2) : null,
    shareOver5pct: pcts.length ? round(drifts.filter((d) => Math.abs(d.pct) >= 5).length / drifts.length, 3) : null,
    maxRiser: byPctDesc.length ? { slug: byPctDesc[0].slug, pct: byPctDesc[0].pct } : null,
    maxFaller: byPctDesc.length ? { slug: byPctDesc[byPctDesc.length - 1].slug, pct: byPctDesc[byPctDesc.length - 1].pct } : null,
    proteins: {
      count: proteins.length,
      medianPct: protPcts.length ? round(quantile(protPcts, 0.5), 2) : null
    },
    byIngredient: byPctDesc
  };

  // ---- layer 2: indexed-component cost of archetype plates, recosted from→to ----
  const plateArchetypes = ARCHETYPES.map((a) => {
    let costFrom = 0, costTo = 0, covered = 0;
    const drivers = [];
    for (const r of a.rows) {
      const s = H[r.slug];
      const pa = (s && isLb[r.slug]) ? priceInMonth(s, fromMonth) : null;
      const pb = (s && isLb[r.slug]) ? priceInMonth(s, toMonth) : null;
      if (pa == null || pb == null) { drivers.push({ ingredient: r.label, slug: r.slug, covered: false }); continue; }
      const cf = portionCost(pa / 100, r.portionOz, r.yield);
      const ct = portionCost(pb / 100, r.portionOz, r.yield);
      if (cf == null || ct == null) { drivers.push({ ingredient: r.label, slug: r.slug, covered: false }); continue; }
      covered++; costFrom += cf; costTo += ct;
      drivers.push({ ingredient: r.label, slug: r.slug, covered: true, perPortionFrom: round(cf, 4), perPortionTo: round(ct, 4) });
    }
    return {
      name: a.name,
      illustrative: true,
      indexedComponentOnly: true, // protein+fat the market moves, not a full recipe
      coveredLines: covered,
      totalLines: a.rows.length,
      componentCostFrom: round(costFrom, 4),
      componentCostTo: round(costTo, 4),
      driftPct: costFrom > 0 ? round(((costTo - costFrom) / costFrom) * 100, 2) : null,
      drivers
    };
  });

  const covered = plateArchetypes.filter((p) => p.coveredLines > 0 && p.driftPct != null);
  const archDrifts = covered.map((p) => p.driftPct).sort((x, y) => x - y);

  return {
    _doc: 'Quarterly plate-cost drift — derived-with-stated-method from committed public Cost Index history (data/cost-index-history.json; USDA AMS/LMR etc.). Tests the claim that independent plate margins drift measurably between recostings. ingredientDrift = monthly-median wholesale % change over the quarter per ingredient (scale-invariant; all units kept; placeholder clone series collapsed to one representative — see build-cost-index-audit.mjs). plateArchetypes = the INDEXED COMPONENT (protein+fat only, not a full dish) of ILLUSTRATIVE archetype plates with standard culinary portions (not operator data), recosted start vs end; mis-scaled levels (>$60/lb) and non-bridgeable units are excluded and counted, never guessed — so we report component cost & its drift, never a food-cost %. Window is the latest quarter with >=90% ingredient coverage. Deterministic; derived from the data, not wall-clock. Ships to no page. Built by scripts/build-cost-plate-drift.mjs; CI re-checks with --check.',
    _version: 1,
    source: { history: 'data/cost-index-history.json', labels: 'data/cost-index-labels.json' },
    method: 'per-ingredient pct = (median(to-month) - median(from-month)) / median(from-month); component cost via tools/_shared/portion-bridge.js quoteAtPortion at each endpoint; implausible per-lb levels (>$60) excluded',
    asOf: hist.generatedAt || null,
    window: { from, to, months: 3 },
    ingredientDrift,
    plateArchetypes,
    headline: {
      windowMonths: 3,
      medianIngredientPct: ingredientDrift.medianPct,
      shareOver5pct: ingredientDrift.shareOver5pct,
      proteinMedianPct: ingredientDrift.proteins.medianPct,
      archetypeComponentMedianDriftPct: archDrifts.length ? round(quantile(archDrifts, 0.5), 2) : null,
      archetypesCovered: covered.length
    }
  };
}

function main() {
  const report = build();
  const json = JSON.stringify(report, null, 2) + '\n';

  if (process.argv.includes('--self-test')) {
    const h = report.headline || {};
    const id = report.ingredientDrift || {};
    const checks = [
      ['inputs present', !report.error],
      ['window spans a quarter', report.window && report.window.from < report.window.to && report.window.months === 3],
      ['ingredient drift computed', id.count > 0 && Number.isFinite(id.medianPct)],
      ['share in [0,1]', id.shareOver5pct == null || (id.shareOver5pct >= 0 && id.shareOver5pct <= 1)],
      ['>=1 archetype covered', h.archetypesCovered > 0 && Number.isFinite(h.archetypeComponentMedianDriftPct)],
      ['all pcts finite', report.ingredientDrift.byIngredient.every((d) => Number.isFinite(d.pct))],
      ['deterministic (rebuild equal)', JSON.stringify(build()) === JSON.stringify(report)]
    ];
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error('  ✗ ' + c[0]));
    console.log(`plate-cost-drift self-test: ${checks.length - failed.length}/${checks.length} passed.`);
    process.exit(failed.length ? 1 : 0);
  }

  if (process.argv.includes('--check')) {
    let cur = '';
    try { cur = readFileSync(OUT, 'utf8'); } catch {}
    if (cur !== json) { console.error('✗ plate-cost drift is stale — run: node scripts/build-cost-plate-drift.mjs'); process.exit(1); }
    console.log('✓ plate-cost drift in sync with the data.');
    return;
  }

  writeFileSync(OUT, json);
  console.log(`plate-cost-drift: wrote ${report.ingredientDrift.count} ingredient(s), ${report.headline.archetypesCovered} archetype(s); window ${report.window.from}→${report.window.to}.`);
}

main();
