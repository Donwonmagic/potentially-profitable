#!/usr/bin/env node
/**
 * build-anomaly-open-data.mjs — publish the statistical anomaly log (CC-BY):
 * per ingredient, the Hampel-filter point outliers and the Pettitt regime-break
 * (change point) in its wholesale-reference deep history.
 *
 *   cost-index/anomaly-log.json / .csv
 *
 * License: CC-BY 4.0 — a named-method statistical compilation. HONESTY: purely
 * DESCRIPTIVE history — an outlier / a structural break is a fact about the
 * series, NEVER a cause and NEVER a forecast. value_cents is a wholesale
 * reference at that date, not a delivered price.
 *
 *   node scripts/build-anomaly-open-data.mjs [--check] [--self-test]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const CCBY = 'https://creativecommons.org/licenses/by/4.0/';

function load() { return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-anomaly-log.json'), 'utf8')); }
function csvCell(v) { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }

function itemOut(slug, it) {
  return {
    slug, n: it.n,
    point_outliers: (it.pointOutliers || []).map((o) => ({ date: o.date, value_cents: o.valueCents, score: Math.round(o.score * 1000) / 1000 })),
    regime_break: it.changePoint && it.changePoint.date ? { date: it.changePoint.date } : (it.changePoint ? { date: it.changePoint } : null),
  };
}
function items(data) { return Object.keys(data.items).sort().map((s) => itemOut(s, data.items[s])); }

function buildJson(data) {
  const its = items(data);
  return {
    _doc: 'Statistical anomaly log: per ingredient, Hampel-filter point outliers (a robust median-deviation test) and the Pettitt regime-break (a non-parametric change point) in its wholesale-reference deep history. Descriptive statistics only — an outlier or a break is a fact about the series, never an asserted cause and never a forecast. value_cents is a reference level at that date, not a delivered price.',
    license: CCBY,
    method: { point_outliers: 'Hampel filter (robust MAD)', regime_break: 'Pettitt change-point test' },
    sourceVersion: data._version || null,
    summary: data.summary || null,
    count: its.length,
    ingredients: its,
  };
}
function buildCsv(data) {
  // Long format, one row per point outlier + a row per regime break (kind column).
  const cols = ['slug', 'kind', 'date', 'value_cents', 'score'];
  const rows = [];
  for (const it of items(data)) {
    for (const o of it.point_outliers) rows.push({ slug: it.slug, kind: 'point_outlier', date: o.date, value_cents: o.value_cents, score: o.score });
    if (it.regime_break) rows.push({ slug: it.slug, kind: 'regime_break', date: it.regime_break.date, value_cents: '', score: '' });
  }
  return cols.join(',') + '\n' + rows.map((r) => cols.map((c) => csvCell(r[c])).join(',')).join('\n') + '\n';
}

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error(`  ✗ ${n} got ${JSON.stringify(g)} want ${JSON.stringify(w)}`); } };
  const it = { key: 'x', n: 100, pointOutliers: [{ index: 5, date: '2010-01-01', valueCents: 200, score: 6.7451 }], changePoint: { date: '2015-06' } };
  const o = itemOut('x', it);
  eq('renames valueCents→value_cents', o.point_outliers[0].value_cents, 200);
  eq('score rounded', o.point_outliers[0].score, 6.745);
  eq('drops raw index', o.point_outliers[0].index, undefined);
  eq('regime break date', o.regime_break, { date: '2015-06' });
  const j = buildJson({ _version: 1, summary: {}, items: { x: it } });
  eq('json keys', Object.keys(j), ['_doc', 'license', 'method', 'sourceVersion', 'summary', 'count', 'ingredients']);
  eq('license CC-BY', j.license, CCBY);
  const csv = buildCsv({ items: { x: it } });
  eq('csv header', csv.split('\n')[0], 'slug,kind,date,value_cents,score');
  eq('csv has both kinds', csv.split('\n').filter((l) => l.includes('point_outlier') || l.includes('regime_break')).length, 2);
  const live = load();
  eq('live count == items', buildJson(live).count, Object.keys(live.items).length);
  console.log(`build-anomaly-open-data self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

const args = new Set(process.argv.slice(2));
if (args.has('--self-test')) selfTest();
const data = load();
const artifacts = [
  { rel: 'cost-index/anomaly-log.json', content: JSON.stringify(buildJson(data), null, 2) + '\n' },
  { rel: 'cost-index/anomaly-log.csv', content: buildCsv(data) },
];
if (args.has('--check')) {
  let drift = 0;
  for (const a of artifacts) { const p = path.join(repoRoot, a.rel); const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; if (cur !== a.content) { drift++; console.error(`✗ ${a.rel} is stale — run: node scripts/build-anomaly-open-data.mjs`); } }
  if (drift) process.exit(1);
  console.log(`✓ anomaly open data in sync (${artifacts.length} artifact(s)).`);
  process.exit(0);
}
for (const a of artifacts) fs.writeFileSync(path.join(repoRoot, a.rel), a.content);
console.log(`Wrote cost-index/anomaly-log.{json,csv} — ${Object.keys(data.items).length} ingredient(s).`);
