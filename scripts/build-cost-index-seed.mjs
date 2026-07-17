#!/usr/bin/env node
/**
 * build-cost-index-seed.mjs — emit the BROWSER seed (data/cost-index.js) from
 * the fact-gated data layer (data/cost-index.json) + bilingual labels
 * (data/cost-index-labels.json).
 *
 * Why a separate file: the storefront is no-fetch, so the Cost Index surface
 * loads the index as a same-origin <script> that sets window.MUNTIN_COST_INDEX
 * — it cannot fetch the .json. This script is the bridge: it joins display
 * labels onto the newest gated point per ingredient and writes the seed that
 * tools/_shared/cost-index-ui.js renders. No invention happens here — every
 * number comes straight from data/cost-index.json, which already cleared
 * check-cost-index-sync.mjs (verified source, in-bounds, fresh, citeable).
 *
 * Behaviour:
 *   - cost-index.json has vendored ingredients  → write a status:'live' seed.
 *   - cost-index.json is empty                   → leave data/cost-index.js as
 *     is (the hand-authored 'preview' seed stays; we never blank the surface).
 *
 *   node scripts/build-cost-index-seed.mjs            # write
 *   node scripts/build-cost-index-seed.mjs --dry-run  # report only
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
// The shippable bar — keep below-bar ingredients out of the Cost Index seed too,
// so the dashboard never shows a thin/no-level read the pages won't.
const MuntinCostConfidence = require(path.join(repoRoot, 'tools/_shared/cost-confidence.js'));
const DRY = process.argv.includes('--dry-run');
const JSON_IN = path.join(repoRoot, 'data/cost-index.json');
const LABELS_IN = path.join(repoRoot, 'data/cost-index-labels.json');
const OUT = path.join(repoRoot, 'data/cost-index.js');

const rd = (p) => JSON.parse(readFileSync(p, 'utf8'));

// Slugs that have an ingredient-yield page, so a dashboard card can deep-link to
// its yield + EP-math leaf (the dashboard→leaf half of the two-way wiring). Only
// keys with a real page get the link — never a 404.
const YIELD_SLUGS = (() => {
  try { return new Set(rd(path.join(repoRoot, 'data/ingredient-yields.json')).map((r) => r.slug)); }
  catch { return new Set(); }
})();

const PRESSURE_ITEMS = (() => {
  try { return rd(path.join(repoRoot, 'data/cost-pressure.json')).items || {}; }
  catch { return {}; }
})();
// Per-card seasonality EDUCATION (roadmap S2) — sourced bilingual primers, gated by
// check-seasonality-education.mjs. Empty until populated on a connected run.
const SEASON_EDU = (() => {
  try { return rd(path.join(repoRoot, 'data/seasonality-education.json')).education || {}; }
  catch { return {}; }
})();
// Measured seasonal normals (roadmap S3) — per-month median/band from our own
// history, but ONLY for ingredients the engine marked `ready` (>=2yr per month).
// The UI computes the current-vs-normal delta at render time (methodology §7), so
// only the normals ride along. Dormant until the corpus crosses the readiness bar.
const SEASON_NORMALS = (() => {
  try {
    const rows = rd(path.join(repoRoot, 'data/seasonality.json')).ingredients || [];
    const m = {};
    for (const r of rows) if (r.ready && r.months && Object.keys(r.months).length) m[r.key] = r.months;
    return m;
  } catch { return {}; }
})();
// HOLD-UNTIL-PROVEN bar (shared with build-cost-index-pages via the rules manifest):
// the overlay is published only once an item's live track record earns it.
const PROVING = (() => {
  try { return (rd(path.join(repoRoot, 'data/pressure-rules.json')).defaults || {}).proving || { minCalls: 12, minHitRate: 0.6, minNonSteadyCalls: 4 }; }
  catch { return { minCalls: 12, minHitRate: 0.6, minNonSteadyCalls: 4 }; }
})();
// Non-steady floor (matches build-cost-index-pages): the overlay also requires enough
// real directional calls, so a rule can't be "proven" on a streak of flat 'steady' calls.
function pressureProven(rec) { const tr = rec && rec.track_record; return !!(tr && tr.n >= PROVING.minCalls && tr.hitRate >= PROVING.minHitRate && (tr.nonSteady || 0) >= (PROVING.minNonSteadyCalls || 0)); }

function main() {
  const data = rd(JSON_IN);
  const labels = (rd(LABELS_IN).labels) || {};
  const ingredientsObj = data.ingredients || {};
  const keys = Object.keys(ingredientsObj);

  const out = [];
  const missingLabel = [];
  for (const key of keys) {
    const pts = (ingredientsObj[key] && ingredientsObj[key].points) || [];
    if (!pts.length) continue;                       // nothing vendored for this ingredient
    const newest = pts[0];                            // mergePoints sorts newest-first (noaa-trade demoted upstream in the vendor)
    const hasLevel = newest.level && typeof newest.level.medianCents === 'number';
    const hasTrend = newest.trend && typeof newest.trend.pct === 'number';
    if (!hasLevel && !hasTrend) continue;            // defensive — gate already enforces this
    if (!MuntinCostConfidence.isShippable(newest)) continue;   // below the shippable bar → not on the dashboard
    const lab = labels[key];
    if (!lab) { missingLabel.push(key); continue; }  // no display label → can't render bilingually

    // Sparkline: prefer the dedicated history curve (one source, oldest→newest);
    // fall back to the per-point level medians (the weekly accumulation).
    const hist = Array.isArray(ingredientsObj[key].history) ? ingredientsObj[key].history : [];
    const histVals = hist.filter((h) => h && typeof h.valueCents === 'number').map((h) => h.valueCents);
    const spark = histVals.length
      ? histVals
      : pts.map((p) => p.level && typeof p.level.medianCents === 'number' ? p.level.medianCents : null).filter((n) => n != null).reverse();

    const entry = {
      key,
      label_en: lab.en, label_es: lab.es,
      unit_en: lab.unit_en || 'unit', unit_es: lab.unit_es || 'unidad',
      assessment: newest,                            // already an assess()-shaped point
    };
    if (lab.seasonal) entry.seasonal = true;
    // Sourced seasonality primer (S2) — supersedes the generic `seasonal` nudge in
    // the UI when present. Only the rendered fields ride along.
    const se = SEASON_EDU[key];
    if (se && se.note_en && se.source) {
      entry.seasonEd = { peak_en: se.peak_en, peak_es: se.peak_es, note_en: se.note_en, note_es: se.note_es, source: se.source };
    }
    if (SEASON_NORMALS[key]) entry.seasonalNormals = SEASON_NORMALS[key];   // S3: measured "vs typical {month}"
    if (YIELD_SLUGS.has(key)) entry.yieldSlug = key;   // deep-link target for the dashboard→leaf rail
    // Reference-page deep link (the dashboard→reference half of the loop): only when
    // the ingredient has a live /cost-index/<key>/ page (events, drivers, sources,
    // siblings). existsSync-gated at build time so a card never links to a 404.
    if (existsSync(path.join(repoRoot, 'cost-index', key, 'index.html'))) entry.page = true;
    // The spike-vs-structural flag (verdict + actionBias) — a build-time, fact-gated
    // "story so far" the renderer turns into a buy/hold/watch suggestion.
    if (ingredientsObj[key].flag) entry.flag = ingredientsObj[key].flag;
    // Coverage tier (D1) — the UI badges every card measured/derived so a reader
    // can tell a published wholesale price from an honest directional estimate.
    if (ingredientsObj[key].tier) entry.tier = ingredientsObj[key].tier;
    if (ingredientsObj[key].coverage) entry.coverage = ingredientsObj[key].coverage;
    // Yield-adjusted true plate cost — the wholesale level converted to cost per
    // EDIBLE pound (illustrative trim yield; the operator's own yield governs).
    if (ingredientsObj[key].yield && ingredientsObj[key].epCents) {
      entry.yield = ingredientsObj[key].yield;
      entry.epCents = ingredientsObj[key].epCents;
    }
    // Pressure overlay summary (inferred direction only — never a price). Trimmed
    // to the headline so the dashboard can show "where it's headed" honestly.
    // HOLD-UNTIL-PROVEN (matches build-cost-index-pages): the dashboard shows the
    // inferred overlay for an item ONLY once its live track record clears the bar.
    // Until then the seed carries no pressure for it and the UI stays measured-only.
    const pr = PRESSURE_ITEMS[key];
    if (pr && pr.direction && pr.direction !== 'unknown' && pressureProven(pr)) {
      entry.pressure = { direction: pr.direction, confidence: pr.confidence, freshness_weeks: pr.freshness_weeks, under_review: !!pr.under_review };
      if (pr.track_record && pr.track_record.n) entry.pressure.track_record = pr.track_record;
    }
    // Sparkline needs real history to be honest — a 2-point line can mislead
    // (and can straddle bases). Hold it until ~a month of weekly points exists.
    if (spark.length >= 4) {
      entry.spark = spark;
      // Attribution so the UI can cite the curve and never read an index series
      // as dollars. Only when the curve came from the dedicated history field.
      if (hist.length) {
        const h0 = hist[0], hN = hist[hist.length - 1];
        entry.spark_meta = { basis: hN.basis, source: hN.source, from: h0.date, to: hN.date, n: spark.length };
        // Dates aligned 1:1 with `spark` (same filter), so the UI can compute an
        // honest week-over-week step across daily- OR weekly-cadence series.
        if (histVals.length) entry.spark_dates = hist.filter((h) => h && typeof h.valueCents === 'number').map((h) => h.date);
      }
    }
    out.push(entry);
  }

  // Drivers — the "why" strip. Pass through trend + spark (from index history) +
  // leads, joined with bilingual labels (data/cost-index-labels.json#drivers).
  const driverLabels = (rd(LABELS_IN).drivers) || {};
  const driversOut = [];
  for (const dkey of Object.keys(data.drivers || {})) {
    const d = data.drivers[dkey];
    const dl = driverLabels[dkey];
    if (!dl || !d || !d.trend) continue;
    const dHist = (Array.isArray(d.history) ? d.history : []).filter((h) => h && typeof h.valueCents === 'number').map((h) => h.valueCents);
    const dentry = { key: dkey, label_en: dl.en, label_es: dl.es, kind: d.kind, trend: d.trend, leads: Array.isArray(d.leads) ? d.leads : [] };
    if (dHist.length >= 4) dentry.spark = dHist;
    driversOut.push(dentry);
  }

  if (!out.length) {
    console.log('build-cost-index-seed: data/cost-index.json has no vendored ingredients — leaving data/cost-index.js (preview) unchanged.');
    return;
  }
  if (missingLabel.length) console.warn(`build-cost-index-seed: WARNING no label for: ${missingLabel.join(', ')} (skipped) — add to data/cost-index-labels.json.`);

  const seed = {
    status: 'live',
    generatedAt: data._lastReviewed || new Date().toISOString().slice(0, 10),
    ingredients: out,
  };
  if (driversOut.length) seed.drivers = driversOut;
  // Coverage honesty (D1) — pass the measured/derived/absent tally and the absent
  // gaps (with display labels + the structural reason) so the dashboard can render
  // "no public data — here's why" cards instead of silently omitting them.
  if (data.coverage && typeof data.coverage === 'object') {
    const gaps = (data.coverage.gaps || []).map((g) => {
      const lab = labels[g.ingredient];
      return { key: g.ingredient, label_en: lab ? lab.en : g.ingredient, label_es: lab ? lab.es : g.ingredient, reason: g.reason || '' };
    });
    seed.coverage = { measured: data.coverage.measured, derived: data.coverage.derived, absent: data.coverage.absent, gaps };
  }

  const banner = `/**
 * Cost Index — browser seed (LIVE). GENERATED — do not edit by hand.
 *
 * Written by scripts/build-cost-index-seed.mjs from the fact-gated
 * data/cost-index.json (cleared by check-cost-index-sync.mjs: verified source,
 * in-bounds, fresh, citeable provenance) joined with data/cost-index-labels.json.
 * Sets window.MUNTIN_COST_INDEX; loaded same-origin so the tool stays no-fetch.
 * Each ingredient carries its baked assessment (level / trend / confidence /
 * provenance); tools/_shared/cost-index-ui.js renders it directly.
 */
`;
  const body = `(function (root) {
  'use strict';
  var DATA = ${JSON.stringify(seed)};
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  if (typeof self !== 'undefined') self.MUNTIN_COST_INDEX = DATA;
  if (root) root.MUNTIN_COST_INDEX = DATA;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
`;
  if (!DRY) writeFileSync(OUT, banner + body);
  console.log(`build-cost-index-seed: wrote data/cost-index.js (status=live, ${out.length} ingredient(s), generatedAt=${seed.generatedAt}).${DRY ? ' (dry-run)' : ''}`);
}

main();
