#!/usr/bin/env node
/**
 * build-qcew-open-data.mjs — publish the county food-services labor backdrop (fetched by
 * scripts/fetch-qcew-wages.mjs on the operator Mac) as CC0 open-data artifacts for the /open/labor/
 * explorer. BLS QCEW is a US-government public-domain series, and this is a straight RESHAPE of it
 * (no Muntin taxonomy, no derived analysis), so CC0 holds — it is NOT a Muntin compilation.
 *
 *   cost-index/qcew-wages.csv   — flat, one row per (year, quarter, industry code)
 *   cost-index/qcew-wages.json  — the same series with the labor-lane honesty framing
 *
 * HONESTY (ADR-013): a DESCRIPTIVE labor backdrop for the ~30% of the plate the food index does not
 * track — a county industry AVERAGE, never a per-plate labor cost, never blended into the food index /
 * pressure math / Vendor Benchmark, and never a forecast.
 *
 *   node scripts/build-qcew-open-data.mjs [--check] [--self-test]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = 'data/qcew-wages.json';
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
const FRAMING = 'a county food-services industry average (BLS QCEW) — a descriptive labor backdrop only, never a per-plate labor cost, never blended into the food index / pressure math / Vendor Benchmark, never a forecast';
const rd = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));
function csvCell(v) { const s = String(v == null ? '' : v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }

const COLS = ['year', 'qtr', 'industry_code', 'industry', 'avg_wkly_wage', 'establishments', 'avg_employment', 'oty_wage_pct_chg'];

function buildCsv(quarters) {
  const rows = quarters.slice().sort((a, b) => a.year - b.year || a.qtr - b.qtr || String(a.industry_code).localeCompare(String(b.industry_code)));
  return COLS.join(',') + '\n' + rows.map((q) => COLS.map((c) => csvCell(q[c])).join(',')).join('\n') + '\n';
}

function buildJson(src) {
  const quarters = (src.quarters || []).slice().sort((a, b) => a.year - b.year || a.qtr - b.qtr || String(a.industry_code).localeCompare(String(b.industry_code)));
  const years = quarters.map((q) => q.year);
  return {
    _doc: 'BLS QCEW quarterly average weekly wage + employment for private food services (NAICS 722 & 7225) in Montgomery County, MD (FIPS 24031). ' + FRAMING + '. Source: BLS QCEW, US-government public domain (CC0). A straight reshape by build-qcew-open-data.mjs from data/qcew-wages.json (fetched by fetch-qcew-wages.mjs --live).',
    source: src.source || 'BLS QCEW — https://data.bls.gov/cew/downloadable-data-files.htm',
    area: src.area || 'Montgomery County, MD (FIPS 24031)',
    license: CC0,
    lane: 'labor (descriptive; never in the food index / pressure / Vendor Benchmark)',
    framing: FRAMING,
    span: quarters.length ? { from: `${years[0]} Q${quarters[0].qtr}`, to: `${years[years.length - 1]} Q${quarters[quarters.length - 1].qtr}` } : null,
    count: quarters.length,
    quarters,
  };
}

function artifacts() {
  const src = rd(SRC);
  return [
    { rel: 'cost-index/qcew-wages.csv', content: buildCsv(src.quarters || []) },
    { rel: 'cost-index/qcew-wages.json', content: JSON.stringify(buildJson(src), null, 2) + '\n' },
  ];
}

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error('  ✗', n, 'got', JSON.stringify(g), 'want', JSON.stringify(w)); } };
  const src = { source: 'S', area: 'A', quarters: [
    { year: 2020, qtr: 2, industry_code: '7225', industry: 'Restaurants & other eating places', avg_wkly_wage: 400, establishments: 1600, avg_employment: 20000, oty_wage_pct_chg: -1.0 },
    { year: 2019, qtr: 1, industry_code: '722', industry: 'Food services & drinking places, "and" bars', avg_wkly_wage: 486, establishments: 1873, avg_employment: 31470, oty_wage_pct_chg: 1.2 },
    { year: 2019, qtr: 1, industry_code: '7225', industry: 'Restaurants & other eating places', avg_wkly_wage: 433, establishments: 1674, avg_employment: 29158, oty_wage_pct_chg: 3.3 },
  ] };
  const csv = buildCsv(src.quarters);
  eq('csv header', csv.split('\n')[0], COLS.join(','));
  eq('one row per quarter record', csv.trim().split('\n').length - 1, 3);
  eq('sorted year→qtr→industry_code (2019/722 first)', csv.trim().split('\n')[1].split(',').slice(0, 3).join('|'), '2019|1|722');
  eq('RFC4180-quotes a comma in industry name', /"Food services & drinking places, ""and"" bars"/.test(csv), true);
  const j = buildJson(src);
  eq('license is CC0 (raw gov passthrough)', j.license, CC0);
  eq('lane is labor / never in the food index', j.lane.startsWith('labor'), true);
  eq('doc must NOT claim a Muntin compilation (CC0 discipline)', /Muntin compilation|value-added/i.test(j._doc), false);
  eq('count matches', j.count, 3);
  eq('span from earliest to latest', [j.span.from, j.span.to], ['2019 Q1', '2020 Q2']);
  // live shape
  if (fs.existsSync(path.join(repo, SRC))) {
    const live = buildJson(rd(SRC));
    eq('live has quarters', live.count > 0, true);
  }
  console.log(`build-qcew-open-data self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

const args = new Set(process.argv.slice(2));
if (args.has('--self-test')) selfTest();
if (!fs.existsSync(path.join(repo, SRC))) {
  console.error(`build-qcew-open-data: ${SRC} not found — run scripts/fetch-qcew-wages.mjs --live on the operator Mac first.`);
  process.exit(args.has('--check') ? 0 : 1);
}
const arts = artifacts();
if (args.has('--check')) {
  let drift = 0;
  for (const a of arts) { const p = path.join(repo, a.rel); const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; if (cur !== a.content) { drift++; console.error(`✗ ${a.rel} is stale — run: node scripts/build-qcew-open-data.mjs`); } }
  if (drift) process.exit(1);
  console.log(`✓ QCEW open-data in sync (${arts.length} artifact(s)).`);
  process.exit(0);
}
for (const a of arts) fs.writeFileSync(path.join(repo, a.rel), a.content);
const j = JSON.parse(arts[1].content);
console.log(`Wrote qcew-wages.csv + json — ${j.count} quarter records, ${j.span ? j.span.from + '→' + j.span.to : 'empty'}.`);
