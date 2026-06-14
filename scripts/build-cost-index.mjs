#!/usr/bin/env node
/**
 * build-cost-index.mjs — vendor the live Cost Index into data/cost-index.json.
 *
 * THE FACT GATE LIVES IN THE BUILD: a point is written ONLY if it clears the
 * exact same predicate the CI gate enforces — `pointIssues()` imported from
 * check-cost-index-sync.mjs, so build and gate can never drift. That means:
 * verified:true ingredient, a bounds entry, provenance whose every element
 * names a source, a valid asOf, level/trend present, and an in-bounds level.
 * Anything else is dropped — never vendored. Today (all 12 verified:false) the
 * file stays the empty canonical.
 *
 * Input artifact = the orchestrator's output (ledger-spec/cost-index → R2 in
 * prod): { generatedAt, points: { <ingredient>: <MuntinComposite.assess result> } }.
 * Pass it with --artifact <file> (or COST_INDEX_ARTIFACT env). Without one, the
 * writer leaves an existing data/cost-index.json untouched (creates the empty
 * canonical if absent) — it never invents points.
 *
 *   node scripts/build-cost-index.mjs --artifact /tmp/ci-artifact.json
 *   node scripts/build-cost-index.mjs --artifact … --date 2026-06-08 --dry-run
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { pointIssues, historyIssues, driverIssues } from './check-cost-index-sync.mjs';
import { ingredientTier } from './check-source-tier.mjs';
import { calibrationCeiling, RANK, NAME } from './check-cost-index-calibration.mjs';

const require = createRequire(import.meta.url);
const B = require('../tools/_shared/cost-basket.js');
const Spike = require('../tools/_shared/cost-spike.js');
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
const DRY = process.argv.includes('--dry-run');
const OUT = path.join(repoRoot, 'data/cost-index.json');
const MAX_POINTS = 26;            // ~6 months of weekly points per ingredient (older are discarded, not archived)

function rd(p) {
  try { return JSON.parse(readFileSync(p, 'utf8')); }
  catch (e) { console.error(`build-cost-index: cannot read ${p}: ${e.message}`); process.exit(1); }
}

const sources = rd(path.join(repoRoot, 'data/cost-index-sources.json'));
const bounds = rd(path.join(repoRoot, 'data/cost-index-bounds.json'));
const srcIng = sources.ingredients || {};
const srcDrivers = sources.drivers || {};
const boundsMap = bounds.bounds || {};
const today = arg('--date') || new Date().toISOString().slice(0, 10);

const basketWeights = (() => { try { return rd(path.join(repoRoot, 'data/cost-basket-weights.json')).weights || {}; } catch { return {}; } })();

function emptyCanonical() {
  const existing = existsSync(OUT) ? rd(OUT) : {};
  return {
    _doc: existing._doc || 'Vendored Muntin Restaurant Cost Index. Built by scripts/build-cost-index.mjs; fact/freshness-gated by scripts/check-cost-index-sync.mjs.',
    _lastReviewed: today,
    _generatedFrom: 'verified-sources-only',
    ingredients: {},
    basket: null,
  };
}

// Recompute the headline Basket from the VENDORED ingredients only (newest point
// each), so the published headline can never reflect a point that didn't clear
// the fact gate. Honest coverage = the share of basket weight that actually shipped.
function computeBasket(out) {
  const latest = {};
  for (const k of Object.keys(out.ingredients)) {
    const pts = (out.ingredients[k] && out.ingredients[k].points) || [];
    if (pts.length) latest[k] = pts[0];   // mergePoints sorts newest-first
  }
  return B.basketTrend(latest, basketWeights);
}

const ok = (ingredient, point) => pointIssues(ingredient, point, srcIng, boundsMap).length === 0;

function mergePoints(existing, incoming) {
  const byAsOf = new Map();
  for (const p of existing || []) byAsOf.set(p.asOf, p);
  for (const p of incoming || []) byAsOf.set(p.asOf, p);   // incoming wins on same asOf
  return [...byAsOf.values()]
    .sort((a, b) => (a.asOf < b.asOf ? 1 : a.asOf > b.asOf ? -1 : 0))  // newest first
    .slice(0, MAX_POINTS);
}

function main() {
  const artifactPath = arg('--artifact') || process.env.COST_INDEX_ARTIFACT;
  if (!artifactPath) {
    if (!existsSync(OUT)) {
      if (!DRY) writeFileSync(OUT, JSON.stringify(emptyCanonical(), null, 2) + '\n');
      console.log('build-cost-index: no artifact — wrote empty canonical (no verified live data yet).');
    } else {
      console.log('build-cost-index: no artifact — leaving committed data/cost-index.json unchanged (never invents points).');
    }
    return;
  }

  const artifact = rd(path.resolve(artifactPath));
  const points = artifact.points || artifact.ingredients || {};
  const existing = existsSync(OUT) ? rd(OUT) : {};
  const out = { ...emptyCanonical(), ingredients: {} };
  const dropped = {};
  let vendored = 0;

  for (const ingredient of Object.keys(points)) {
    // NOAA import unit value runs ~half of true delivered wholesale, so it must never
    // ship as a dollar LEVEL. Demote it to an index/directional read here — the level
    // (and its provenance) is kept so the page can show the "trade-value, below
    // delivered wholesale" caveat, but isShippable() rejects basis:'index', so it
    // never reaches the dashboard with a misleading price.
    const _pt = points[ingredient];
    if (_pt && _pt.level && Array.isArray(_pt.level.provenance) && _pt.level.provenance.some((x) => x.type === 'noaa-trade')) {
      _pt.level.basis = 'index';
      _pt.confidence = 'directional';
    }
    const issues = pointIssues(ingredient, points[ingredient], srcIng, boundsMap);
    if (issues.length) { for (const i of issues) dropped[i] = (dropped[i] || 0) + 1; continue; }
    const prior = (existing.ingredients?.[ingredient]?.points) || [];
    out.ingredients[ingredient] = { points: mergePoints(prior, [points[ingredient]]) };
    // Historical curve (sibling to points): gated for citeability + bounds but
    // NOT for staleness (old by design). A failing series is dropped, never
    // vendored — the current point still ships.
    const hist = points[ingredient].history;
    const hIssues = historyIssues(ingredient, hist, srcIng, boundsMap);
    if (!hIssues.length && Array.isArray(hist) && hist.length) out.ingredients[ingredient].history = hist.slice(-MAX_POINTS);
    else if (hIssues.length) for (const i of hIssues) dropped[i] = (dropped[i] || 0) + 1;
    vendored++;
  }

  // Carry forward prior points AND history for verified ingredients with no new
  // point this run — re-filter each through the SAME predicates, so anything
  // that has since gone out-of-bounds / lost its source is dropped, never
  // silently re-vendored. History is re-validated WITHOUT the staleness check.
  for (const ingredient of Object.keys(existing.ingredients || {})) {
    if (out.ingredients[ingredient]) continue;
    const kept = ((existing.ingredients[ingredient].points) || []).filter((p) => ok(ingredient, p));
    if (!kept.length) continue;
    out.ingredients[ingredient] = { points: kept };
    const priorHist = existing.ingredients[ingredient].history;
    if (Array.isArray(priorHist) && priorHist.length && !historyIssues(ingredient, priorHist, srcIng, boundsMap).length) {
      out.ingredients[ingredient].history = priorHist.slice(-MAX_POINTS);
    }
  }

  // Attach the spike-vs-structural flag per ingredient — the "should I act?" read
  // the render/Plate fork consumes. Classify on the DEEP history series (the curve
  // that actually exists this run) rather than the thin vendored points[] (one
  // snapshot per weekly run), so the buy/hold/watch verb is live immediately
  // instead of reading 'insufficient' until weeks of points accrue. Falls back to
  // points[] when there's no richer history. Spike.classify wants newest-first
  // { level:{medianCents} }; history is {date,valueCents} oldest→newest.
  for (const k of Object.keys(out.ingredients)) {
    const hist = out.ingredients[k].history;
    const pts = out.ingredients[k].points || [];
    const fromHistory = Array.isArray(hist) && hist.length >= pts.length && hist.length >= 2
      ? hist.slice().reverse().map((h) => ({ level: { medianCents: h.valueCents }, asOf: h.date }))
      : pts;
    out.ingredients[k].flag = Spike.classify(fromHistory);
  }

  // Confidence honesty — cap every vendored point's confidence at the calibration
  // ceiling its data actually supports (independent source TYPES + weeks of track
  // record + trend stability), using check-cost-index-calibration's OWN function so
  // build and gate cannot drift. The engine's confidenceFor() can't see the
  // vendored track-record length (it runs pre-vendor), so a thin-but-fresh read like
  // a just-started ingredient could claim 'low' when only 'directional' is earned.
  // This is the floor, never a substitute for adding sources/history to raise it.
  for (const k of Object.keys(out.ingredients)) {
    const hist = Array.isArray(out.ingredients[k].history) ? out.ingredients[k].history : [];
    for (const p of out.ingredients[k].points || []) {
      if (!p || !p.confidence || RANK[p.confidence] == null) continue;
      const ceil = calibrationCeiling(p, hist);
      if (RANK[p.confidence] > ceil) p.confidence = NAME[ceil];
    }
  }

  // Coverage tier (D1) — label every vendored card measured/derived with the SAME
  // rule check-source-tier.mjs enforces, and publish the `absent` gaps with their
  // reasons so the UI can render "no public data — here's why" instead of a blank.
  // Honest coverage is a first-class feature, not an omission.
  for (const k of Object.keys(out.ingredients)) {
    out.ingredients[k].tier = ingredientTier(srcIng[k]);
    if (srcIng[k] && srcIng[k].coverage) out.ingredients[k].coverage = srcIng[k].coverage;
  }
  const gaps = [];
  let nMeasured = 0, nDerived = 0;
  for (const [slug, e] of Object.entries(srcIng)) {
    const t = ingredientTier(e);
    if (t === 'measured') nMeasured++;
    else if (t === 'derived') nDerived++;
    else gaps.push({ ingredient: slug, reason: (e && e.coverage) || '' });
  }
  out.coverage = { measured: nMeasured, derived: nDerived, absent: gaps.length, gaps };

  // Yield-adjusted true plate cost (the #1 operator-value lever) — EP cost =
  // AP wholesale ÷ representative trim yield (data/ingredient-yields.json). A
  // labeled ESTIMATE beside the measured wholesale level (yields are ranges; the
  // operator's own yield governs), never a replacement. Only where a level exists.
  let yieldMap = {};
  try {
    yieldMap = Object.fromEntries(rd(path.join(repoRoot, 'data/ingredient-yields.json'))
      .filter((r) => r && r.slug && typeof r.yield === 'number' && r.yield > 0)
      .map((r) => [r.slug, r.yield]));
  } catch { /* no yield table → skip plate-cost */ }
  for (const k of Object.keys(out.ingredients)) {
    const y = yieldMap[k];
    const lvl = ((out.ingredients[k].points || [])[0] || {}).level;
    if (y && lvl && typeof lvl.medianCents === 'number') {
      out.ingredients[k].yield = y;
      out.ingredients[k].epCents = Math.round(lvl.medianCents / y);
    }
  }

  // Drivers (corn/soybeans/diesel/electricity): the explanatory "why" layer.
  // Gated for trend + citeable index history + leads that name known ingredients
  // (the source universe — a lead isn't "bad" just because it had a thin week).
  const inDrivers = artifact.drivers || {};
  let vendoredDrivers = 0;
  const outDrivers = {};
  for (const d of Object.keys(inDrivers)) {
    const dIssues = driverIssues(d, inDrivers[d], srcDrivers, srcIng);
    if (dIssues.length) { for (const i of dIssues) dropped[i] = (dropped[i] || 0) + 1; continue; }
    outDrivers[d] = {
      kind: inDrivers[d].kind,
      leads: Array.isArray(inDrivers[d].leads) ? inDrivers[d].leads : [],
      trend: inDrivers[d].trend,
      history: (inDrivers[d].history || []).slice(-MAX_POINTS),
    };
    vendoredDrivers++;
  }
  if (vendoredDrivers) out.drivers = outDrivers;

  out.basket = computeBasket(out);   // headline from the post-gate vendored set only
  if (!DRY) writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  const dropMsg = Object.keys(dropped).length ? ` · dropped: ${Object.entries(dropped).map(([k, v]) => `${v} ${k}`).join(', ')}` : '';
  const histN = Object.values(out.ingredients).filter((x) => Array.isArray(x.history) && x.history.length).length;
  const bk = out.basket && out.basket.pct != null ? ` · basket ${(out.basket.pct * 100).toFixed(1)}% (${Math.round(out.basket.coverage * 100)}% covered)` : '';
  console.log(`build-cost-index: vendored ${vendored} ingredient(s), ${histN} with history, ${vendoredDrivers} driver(s)${dropMsg}${bk}.${DRY ? ' (dry-run)' : ''}`);
}

main();
