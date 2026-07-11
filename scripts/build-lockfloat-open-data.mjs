#!/usr/bin/env node
/**
 * build-lockfloat-open-data.mjs — publish the lock-or-float predictability
 * dataset (CC-BY). Decision-useful, not a price: for each ingredient, how tight
 * its recent wholesale-reference band has been (the conformal half-width) and the
 * resulting menu-pricing posture — lock / cushion / float / withhold.
 *
 *   cost-index/lockfloat.json / .csv
 *
 * License: CC-BY 4.0 — the thresholds + the lock/float/withhold vocabulary are
 * Muntin's compilation. HONESTY: this is PREDICTABILITY (band width), NOT a price
 * forecast; the `withhold` tier is when evidence is too thin to say. We publish
 * the DECISION + band metrics only — NOT the wholesale price level (that would be
 * a bulk reference-price leak). Not a delivered price. Not a forecast.
 *
 *   node scripts/build-lockfloat-open-data.mjs [--check] [--self-test]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const CCBY = 'https://creativecommons.org/licenses/by/4.0/';

function load() { return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-lockfloat.json'), 'utf8')); }
function csvCell(v) { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }

// Publish the DECISION + predictability metrics only. Deliberately DROP `level`,
// `spark`, and `replay` — the wholesale price level and its raw series are the
// measured tier and must not ship as an open bulk.
function row(slug, it) {
  return {
    slug, name: it.name, bucket: it.bucket, monthly: !!it.monthly,
    half_width_pct: it.halfWidthPct, coverage: it.coverage,
    coverage_lo: it.coverageLo, coverage_hi: it.coverageHi,
    up_pct: it.upPct, down_pct: it.downPct, n_tested: it.nTested,
  };
}
function rows(data) { return Object.keys(data.items).sort().map((s) => row(s, data.items[s])); }

function buildJson(data) {
  return {
    _doc: 'Lock-or-float predictability: for each ingredient, how tight its wholesale-reference band has run recently (a conformal half-width) and the menu-pricing posture that follows — lock (very steady), cushion, float (swingy), or withhold (too little evidence to say). Band WIDTH, not a price forecast. The price level itself is deliberately not published. Not a delivered price.',
    license: CCBY,
    asOf: data.asOf || null,
    thresholds: data.thresholds || null,
    counts: data.counts || null,
    count: Object.keys(data.items).length,
    ingredients: rows(data),
  };
}
function buildCsv(data) {
  const cols = ['slug', 'name', 'bucket', 'monthly', 'half_width_pct', 'coverage', 'coverage_lo', 'coverage_hi', 'up_pct', 'down_pct', 'n_tested'];
  return cols.join(',') + '\n' + rows(data).map((r) => cols.map((c) => csvCell(r[c])).join(',')).join('\n') + '\n';
}

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error(`  ✗ ${n} got ${JSON.stringify(g)} want ${JSON.stringify(w)}`); } };
  const it = { name: 'X', unit: 'lb', level: 999, monthly: false, bucket: 'lock', coverage: 0.77, coverageLo: 0.7, coverageHi: 0.8, upPct: 0.06, downPct: 0.01, nTested: 100, halfWidthPct: 0.06, spark: [1, 2], replay: '01' };
  const r = row('x', it);
  eq('drops level/spark/replay/unit', Object.keys(r), ['slug', 'name', 'bucket', 'monthly', 'half_width_pct', 'coverage', 'coverage_lo', 'coverage_hi', 'up_pct', 'down_pct', 'n_tested']);
  eq('no price level leaked', r.level, undefined);
  eq('bucket carried', r.bucket, 'lock');
  const j = buildJson({ asOf: '2026-07-10', thresholds: {}, counts: {}, items: { x: it } });
  eq('json keys', Object.keys(j), ['_doc', 'license', 'asOf', 'thresholds', 'counts', 'count', 'ingredients']);
  eq('license CC-BY', j.license, CCBY);
  eq('csv header', buildCsv({ items: { x: it } }).split('\n')[0], 'slug,name,bucket,monthly,half_width_pct,coverage,coverage_lo,coverage_hi,up_pct,down_pct,n_tested');
  const live = load();
  eq('live count == items', buildJson(live).count, Object.keys(live.items).length);
  eq('live has withhold bucket published', buildJson(live).ingredients.some((x) => x.bucket === 'withhold'), true);
  console.log(`build-lockfloat-open-data self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

const args = new Set(process.argv.slice(2));
if (args.has('--self-test')) selfTest();
const data = load();
const artifacts = [
  { rel: 'cost-index/lockfloat.json', content: JSON.stringify(buildJson(data), null, 2) + '\n' },
  { rel: 'cost-index/lockfloat.csv', content: buildCsv(data) },
];
if (args.has('--check')) {
  let drift = 0;
  for (const a of artifacts) { const p = path.join(repoRoot, a.rel); const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; if (cur !== a.content) { drift++; console.error(`✗ ${a.rel} is stale — run: node scripts/build-lockfloat-open-data.mjs`); } }
  if (drift) process.exit(1);
  console.log(`✓ lockfloat open data in sync (${artifacts.length} artifact(s)).`);
  process.exit(0);
}
for (const a of artifacts) fs.writeFileSync(path.join(repoRoot, a.rel), a.content);
console.log(`Wrote cost-index/lockfloat.{json,csv} — ${Object.keys(data.items).length} ingredient(s).`);
