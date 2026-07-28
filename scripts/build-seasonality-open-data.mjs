#!/usr/bin/env node
/**
 * build-seasonality-open-data.mjs — publish the seasonality open dataset (CC0).
 * The /open/ hub already advertises a CC0 seasonality dataset but linked only the
 * HTML explorer; this ships the actual downloadable file the card promises.
 *
 *   cost-index/seasonality.json / .csv — per-month wholesale-reference normals
 *   (median + p25/p75 cents) for ready ingredients, over a 5-yr trailing window,
 *   with each ingredient's cheapest/priciest month.
 *
 * License: CC0 — a deterministic recompute of a public-domain deep history via a
 * published window; no creative selection. A reference, not a delivered price.
 * Source of truth: data/seasonality.json (built by build-seasonality.mjs, gated
 * by check-cost-index-seasonal + build-seasonality --check).
 *
 *   node scripts/build-seasonality-open-data.mjs [--check] [--self-test]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';

function load() { return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/seasonality.json'), 'utf8')); }
function csvCell(v) { const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }

// cheapest/priciest month by median, honest tie-break (lowest month number).
function extrema(months) {
  let lo = null, hi = null;
  for (const m of Object.keys(months)) {
    const med = months[m].medianCents;
    if (lo == null || med < months[lo].medianCents) lo = m;
    if (hi == null || med > months[hi].medianCents) hi = m;
  }
  return { cheapest_month: lo == null ? null : Number(lo), priciest_month: hi == null ? null : Number(hi) };
}

function readyRows(data) {
  return (data.ingredients || []).filter((i) => i.ready && i.months && Object.keys(i.months).length);
}

function buildJson(data) {
  const rows = readyRows(data).map((i) => {
    const ext = extrema(i.months);
    const months = {};
    for (const m of Object.keys(i.months).sort((a, b) => Number(a) - Number(b))) {
      const mm = i.months[m];
      months[m] = { median_cents: mm.medianCents, p25_cents: mm.p25Cents, p75_cents: mm.p75Cents, n: mm.n };
    }
    return { slug: i.key, ...ext, months };
  });
  return {
    _doc: 'Seasonal wholesale-reference normals: for each ready ingredient, the median (and p25/p75) reference level by calendar month over a 5-year trailing window of a public-domain deep history, plus its cheapest and priciest month. A reference level vs its own season, NOT a delivered price. Deterministic recompute of the public record.',
    license: CC0,
    params: data.params || null,
    count: rows.length,
    ingredients: rows,
  };
}

function buildCsv(data) {
  const cols = ['slug', 'month', 'median_cents', 'p25_cents', 'p75_cents', 'n'];
  const out = [];
  for (const i of readyRows(data)) {
    for (const m of Object.keys(i.months).sort((a, b) => Number(a) - Number(b))) {
      const mm = i.months[m];
      out.push({ slug: i.key, month: Number(m), median_cents: mm.medianCents, p25_cents: mm.p25Cents, p75_cents: mm.p75Cents, n: mm.n });
    }
  }
  return cols.join(',') + '\n' + out.map((r) => cols.map((c) => csvCell(r[c])).join(',')).join('\n') + '\n';
}

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error(`  ✗ ${n} got ${JSON.stringify(g)} want ${JSON.stringify(w)}`); } };
  eq('extrema cheapest/priciest', extrema({ '3': { medianCents: 200 }, '7': { medianCents: 100 }, '11': { medianCents: 300 } }), { cheapest_month: 7, priciest_month: 11 });
  eq('extrema tie → lowest month', extrema({ '5': { medianCents: 100 }, '2': { medianCents: 100 } }), { cheapest_month: 2, priciest_month: 2 });
  const fake = { params: { windowYears: 5 }, ingredients: [
    { key: 'x', ready: true, months: { '1': { medianCents: 100, p25Cents: 90, p75Cents: 110, n: 4 }, '2': { medianCents: 80, p25Cents: 70, p75Cents: 90, n: 4 } } },
    { key: 'y', ready: false, months: {} },
  ] };
  const j = buildJson(fake);
  eq('excludes not-ready', j.count, 1);
  eq('json keys', Object.keys(j), ['_doc', 'license', 'params', 'count', 'ingredients']);
  eq('renames medianCents→median_cents', j.ingredients[0].months['2'].median_cents, 80);
  eq('cheapest month derived', j.ingredients[0].cheapest_month, 2);
  eq('license CC0', j.license, CC0);
  eq('csv header', buildCsv(fake).split('\n')[0], 'slug,month,median_cents,p25_cents,p75_cents,n');
  const live = load();
  eq('live ready count > 0', buildJson(live).count > 0, true);
  console.log(`build-seasonality-open-data self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

const args = new Set(process.argv.slice(2));
if (args.has('--self-test')) selfTest();

const data = load();
const artifacts = [
  { rel: 'cost-index/seasonality.json', content: JSON.stringify(buildJson(data), null, 2) + '\n' },
  { rel: 'cost-index/seasonality.csv', content: buildCsv(data) },
];
if (args.has('--check')) {
  let drift = 0;
  for (const a of artifacts) {
    const p = path.join(repoRoot, a.rel);
    const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    if (cur !== a.content) { drift++; console.error(`✗ ${a.rel} is stale — run: node scripts/build-seasonality-open-data.mjs`); }
  }
  if (drift) process.exit(1);
  console.log(`✓ seasonality open data in sync (${artifacts.length} artifact(s)).`);
  process.exit(0);
}
for (const a of artifacts) fs.writeFileSync(path.join(repoRoot, a.rel), a.content);
console.log(`Wrote cost-index/seasonality.{json,csv} — ${buildJson(data).count} ready ingredient(s).`);
