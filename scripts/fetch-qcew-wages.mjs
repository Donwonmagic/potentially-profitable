#!/usr/bin/env node
/**
 * fetch-qcew-wages.mjs — BLS QCEW county restaurant-industry wages, wave-3 (LABOR lane) of the
 * corpus-expansion fetch list. It pulls the quarterly average weekly wage + employment for the
 * food-services industry in Montgomery County, MD (FIPS 24031 — Silver Spring / Bethesda), the ~30%
 * of the plate the food index is silent on. Keyless open data (data.bls.gov/cew), US-gov public domain.
 *
 * STRICT LANE DISCIPLINE (ADR-013): this is a DESCRIPTIVE labor backdrop — a county industry average,
 * never blended into the food index, the pressure math, or the Vendor Benchmark reference. It is not a
 * per-plate labor cost and not a forecast.
 *
 *   node scripts/fetch-qcew-wages.mjs               # demo: transform a fixture CSV, no network
 *   node scripts/fetch-qcew-wages.mjs --self-test   # CI: pin the transform + lane framing
 *   node scripts/fetch-qcew-wages.mjs --live        # operator Mac: fetch QCEW → data/qcew-wages.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './build-study-dataset.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'data/qcew-wages.json';
const FIPS = '24031'; // Montgomery County, MD
const CSV_URL = (year, qtr) => `https://data.bls.gov/cew/data/api/${year}/${qtr}/area/${FIPS}.csv`;
const OWN_PRIVATE = '5'; // private ownership (the operating restaurant industry)
const INDUSTRIES = { '722': 'Food services & drinking places', '7225': 'Restaurants & other eating places' };
const START_YEAR = 2019;

// Filter a parsed area CSV (all industries) to private food-services rows; keep the descriptive fields.
function transformRows(rows) {
  if (!rows.length) return [];
  const H = rows[0]; const ci = (n) => H.indexOf(n);
  const num = (v) => { const n = Number(v); return Number.isFinite(n) && v !== '' ? n : null; };
  const out = [];
  for (const r of rows.slice(1)) {
    if (r.length < H.length) continue;
    if (r[ci('own_code')] !== OWN_PRIVATE) continue;
    const ind = r[ci('industry_code')];
    if (!INDUSTRIES[ind]) continue;
    const emp = [num(r[ci('month1_emplvl')]), num(r[ci('month2_emplvl')]), num(r[ci('month3_emplvl')])].filter((x) => x != null);
    out.push({
      year: num(r[ci('year')]), qtr: num(r[ci('qtr')]),
      industry_code: ind, industry: INDUSTRIES[ind],
      avg_wkly_wage: num(r[ci('avg_wkly_wage')]),
      establishments: num(r[ci('qtrly_estabs')]),
      avg_employment: emp.length ? Math.round(emp.reduce((a, b) => a + b, 0) / emp.length) : null,
      oty_wage_pct_chg: num(r[ci('oty_avg_wkly_wage_pct_chg')]),
    });
  }
  return out;
}

function assemble(records, fetchedAt) {
  records.sort((a, b) => a.year - b.year || a.qtr - b.qtr || a.industry_code.localeCompare(b.industry_code));
  return {
    _doc: 'BLS QCEW quarterly average weekly wage + employment for the private food-services industry (NAICS 722 & 7225) in Montgomery County, MD (FIPS 24031). A DESCRIPTIVE labor backdrop for the ~30% of the plate the food index does not track — a county industry AVERAGE, never a per-plate labor cost, never blended into the food index / pressure math / Vendor Benchmark, and never a forecast. Source: BLS QCEW open data, US-gov public domain. Built by scripts/fetch-qcew-wages.mjs --live on the operator Mac.',
    source: 'BLS QCEW — https://data.bls.gov/cew/downloadable-data-files.htm',
    area: 'Montgomery County, MD (FIPS 24031)',
    license: 'public-domain-usgov',
    lane: 'labor (descriptive; never in the food index)',
    fetchedAt: fetchedAt || null,
    count: records.length,
    quarters: records,
  };
}

// Fixture: two rows (722 + 7225, private) plus a non-matching row (own_code 1) that must be filtered.
const DEMO_CSV = [
  '"area_fips","own_code","industry_code","agglvl_code","size_code","year","qtr","disclosure_code","qtrly_estabs","month1_emplvl","month2_emplvl","month3_emplvl","total_qtrly_wages","taxable_qtrly_wages","qtrly_contributions","avg_wkly_wage","oty_avg_wkly_wage_pct_chg"',
  '"24031","5","722","74","0","2024","1","",1450,29000,29200,29400,270000000,0,0,712,3.1',
  '"24031","5","7225","75","0","2024","1","",1300,26000,26100,26200,240000000,0,0,701,2.8',
  '"24031","1","10","71","0","2024","1","",137,48355,48342,48359,1817049829,0,0,2891,3.6',
].join('\n');

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error('  ✗', n, 'got', JSON.stringify(g), 'want', JSON.stringify(w)); } };
  const recs = transformRows(parseCsv(DEMO_CSV));
  eq('keeps only private food-services rows (drops own_code 1 / industry 10)', recs.length, 2);
  eq('industry codes are 722 + 7225', recs.map((r) => r.industry_code).sort().join(','), '722,7225');
  eq('avg weekly wage parsed', recs.find((r) => r.industry_code === '722').avg_wkly_wage, 712);
  eq('avg employment = mean of the three months', recs.find((r) => r.industry_code === '722').avg_employment, 29200);
  eq('oty pct change parsed', recs.find((r) => r.industry_code === '7225').oty_wage_pct_chg, 2.8);
  const out = assemble(recs, null);
  eq('lane is labor / never in the index', out.lane, 'labor (descriptive; never in the food index)');
  eq('public domain', out.license, 'public-domain-usgov');
  console.log(`fetch-qcew-wages self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

async function live() {
  const endYear = new Date().getFullYear();
  const records = [];
  for (let year = START_YEAR; year <= endYear; year++) {
    for (let qtr = 1; qtr <= 4; qtr++) {
      let res;
      try { res = await fetch(CSV_URL(year, qtr)); } catch { continue; }
      if (!res.ok) continue; // an unpublished quarter 404s — skip it
      const text = await res.text();
      if (!text || text.length < 50) continue;
      records.push(...transformRows(parseCsv(text)));
    }
  }
  const out = assemble(records, new Date().toISOString());
  fs.writeFileSync(path.join(repo, OUT), JSON.stringify(out, null, 2) + '\n');
  const span = records.length ? `${records[0].year}Q${records[0].qtr}–${records[records.length - 1].year}Q${records[records.length - 1].qtr}` : 'none';
  console.log(`fetch-qcew-wages: wrote ${OUT} — ${out.count} quarter-rows (${span}).`);
}

if (process.argv.includes('--self-test')) { selfTest(); }
else if (process.argv.includes('--live')) { live().catch((e) => { console.error('fetch-qcew-wages --live failed:', e.message); process.exit(1); }); }
else {
  console.log('DEMO (fixture CSV, no network) — private food-services rows only:\n');
  console.log(JSON.stringify(assemble(transformRows(parseCsv(DEMO_CSV)), null), null, 2));
  console.log(`\nRun with --live on the operator Mac to fetch QCEW ${START_YEAR}→present and write ${OUT}.`);
}
