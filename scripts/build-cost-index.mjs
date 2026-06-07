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
import { pointIssues } from './check-cost-index-sync.mjs';

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
    const issues = pointIssues(ingredient, points[ingredient], srcIng, boundsMap);
    if (issues.length) { for (const i of issues) dropped[i] = (dropped[i] || 0) + 1; continue; }
    const prior = (existing.ingredients?.[ingredient]?.points) || [];
    out.ingredients[ingredient] = { points: mergePoints(prior, [points[ingredient]]) };
    vendored++;
  }

  // Carry forward prior history for verified ingredients with no new point this
  // run — but re-filter each carried point through the SAME predicate, so a
  // point that has since gone out-of-bounds / lost its source is dropped, never
  // silently re-vendored.
  for (const ingredient of Object.keys(existing.ingredients || {})) {
    if (out.ingredients[ingredient]) continue;
    const kept = ((existing.ingredients[ingredient].points) || []).filter((p) => ok(ingredient, p));
    if (kept.length) out.ingredients[ingredient] = { points: kept };
  }

  // Attach the spike-vs-structural flag per ingredient (from its own history) —
  // the "should I act?" read the render/Plate fork consumes. Thin history → 'insufficient'.
  for (const k of Object.keys(out.ingredients)) {
    out.ingredients[k].flag = Spike.classify(out.ingredients[k].points || []);
  }
  out.basket = computeBasket(out);   // headline from the post-gate vendored set only
  if (!DRY) writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  const dropMsg = Object.keys(dropped).length ? ` · dropped: ${Object.entries(dropped).map(([k, v]) => `${v} ${k}`).join(', ')}` : '';
  const bk = out.basket && out.basket.pct != null ? ` · basket ${(out.basket.pct * 100).toFixed(1)}% (${Math.round(out.basket.coverage * 100)}% covered)` : '';
  console.log(`build-cost-index: vendored ${vendored} ingredient(s)${dropMsg}${bk}.${DRY ? ' (dry-run)' : ''}`);
}

main();
