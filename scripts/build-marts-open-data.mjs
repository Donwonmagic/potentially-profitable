#!/usr/bin/env node
/**
 * build-marts-open-data.mjs — publish the food-services demand backdrop (fetched by
 * scripts/fetch-marts-sales.mjs on the operator Mac) as CC0 open-data artifacts for the /open/demand/
 * explorer. Census MARTS (via FRED's keyless mirror) is a US-government public-domain series, and this
 * is a straight RESHAPE of it (no Muntin taxonomy, no derived analysis), so CC0 holds.
 *
 *   cost-index/marts-sales.csv   — flat, one row per month (with a provisional flag)
 *   cost-index/marts-sales.json  — the same series + the demand-lane honesty framing
 *
 * The one derived field is `provisional`: Census publishes the most recent month as an ADVANCE
 * estimate that later releases revise, so the max(date) row is flagged provisional — a documented fact
 * about the source (Census methodology), not a Muntin judgment.
 *
 * HONESTY (ADR-013): a DEMAND / sell-side backdrop of OBSERVED sales — never a demand forecast, never
 * blended into the food index / pressure math / Vendor Benchmark.
 *
 *   node scripts/build-marts-open-data.mjs [--check] [--self-test]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = 'data/marts-sales.json';
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
const FRAMING = 'observed monthly food-services retail sales (Census MARTS) — a descriptive demand backdrop only, never a demand forecast, never blended into the food index / pressure math / Vendor Benchmark';
const rd = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));
function csvCell(v) { const s = String(v == null ? '' : v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }

const COLS = ['date', 'sales_sa_musd', 'sales_nsa_musd', 'provisional'];

// The latest month is Census's advance estimate → provisional. Return months sorted by date, with a
// boolean `provisional` on the single max(date) row (and false on all the settled months).
function withProvisional(months) {
  const sorted = months.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const last = sorted.length ? sorted[sorted.length - 1].date : null;
  return sorted.map((m) => ({ date: m.date, sales_sa_musd: m.sales_sa_musd ?? null, sales_nsa_musd: m.sales_nsa_musd ?? null, provisional: m.date === last }));
}

function buildCsv(months) {
  const rows = withProvisional(months);
  return COLS.join(',') + '\n' + rows.map((m) => COLS.map((c) => csvCell(m[c])).join(',')).join('\n') + '\n';
}

function buildJson(src) {
  const months = withProvisional(src.months || []);
  return {
    _doc: 'Census MARTS monthly retail sales for Food Services & Drinking Places (NAICS 722), US$ millions, seasonally adjusted (sales_sa_musd) and not (sales_nsa_musd), via FRED\'s keyless mirror. ' + FRAMING + '. The most recent month is an advance estimate (provisional:true). Source: US Census Bureau, public domain (CC0), via FRED. A straight reshape by build-marts-open-data.mjs from data/marts-sales.json (fetched by fetch-marts-sales.mjs --live).',
    source: src.source || 'Census MARTS via FRED — https://fred.stlouisfed.org/series/RSFSDP',
    unit: src.unit || 'US$ millions',
    license: CC0,
    lane: 'demand (observed sales; never a forecast, never in the food index / pressure / Vendor Benchmark)',
    framing: FRAMING,
    span: months.length ? { from: months[0].date, to: months[months.length - 1].date } : null,
    provisional_month: months.length ? months[months.length - 1].date : null,
    count: months.length,
    months,
  };
}

function artifacts() {
  const src = rd(SRC);
  return [
    { rel: 'cost-index/marts-sales.csv', content: buildCsv(src.months || []) },
    { rel: 'cost-index/marts-sales.json', content: JSON.stringify(buildJson(src), null, 2) + '\n' },
  ];
}

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error('  ✗', n, 'got', JSON.stringify(g), 'want', JSON.stringify(w)); } };
  const src = { source: 'S', unit: 'US$ millions', months: [
    { date: '2015-03-01', sales_sa_musd: 49966, sales_nsa_musd: 52164 },
    { date: '2015-01-01', sales_sa_musd: 49690, sales_nsa_musd: 47106 },
    { date: '2015-02-01', sales_sa_musd: 49525, sales_nsa_musd: 45761 },
  ] };
  const csv = buildCsv(src.months);
  eq('csv header', csv.split('\n')[0], COLS.join(','));
  eq('one row per month', csv.trim().split('\n').length - 1, 3);
  eq('sorted by date (Jan first)', csv.trim().split('\n')[1].split(',')[0], '2015-01-01');
  const rows = withProvisional(src.months);
  eq('only the latest month is provisional', rows.map((r) => r.provisional), [false, false, true]);
  eq('the provisional month is the max date', rows[rows.length - 1].date, '2015-03-01');
  const j = buildJson(src);
  eq('license is CC0 (raw gov passthrough)', j.license, CC0);
  eq('lane is demand / never a forecast', j.lane.startsWith('demand'), true);
  eq('doc must NOT claim a Muntin compilation (CC0 discipline)', /Muntin compilation|value-added/i.test(j._doc), false);
  eq('provisional_month surfaced at top level', j.provisional_month, '2015-03-01');
  eq('span from earliest to latest', [j.span.from, j.span.to], ['2015-01-01', '2015-03-01']);
  // live shape
  if (fs.existsSync(path.join(repo, SRC))) {
    const live = buildJson(rd(SRC));
    eq('live has months', live.count > 0, true);
    eq('live: exactly one provisional month', live.months.filter((m) => m.provisional).length, 1);
  }
  console.log(`build-marts-open-data self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

const args = new Set(process.argv.slice(2));
if (args.has('--self-test')) selfTest();
if (!fs.existsSync(path.join(repo, SRC))) {
  console.error(`build-marts-open-data: ${SRC} not found — run scripts/fetch-marts-sales.mjs --live on the operator Mac first.`);
  process.exit(args.has('--check') ? 0 : 1);
}
const arts = artifacts();
if (args.has('--check')) {
  let drift = 0;
  for (const a of arts) { const p = path.join(repo, a.rel); const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; if (cur !== a.content) { drift++; console.error(`✗ ${a.rel} is stale — run: node scripts/build-marts-open-data.mjs`); } }
  if (drift) process.exit(1);
  console.log(`✓ MARTS open-data in sync (${arts.length} artifact(s)).`);
  process.exit(0);
}
for (const a of arts) fs.writeFileSync(path.join(repo, a.rel), a.content);
const j = JSON.parse(arts[1].content);
console.log(`Wrote marts-sales.csv + json — ${j.count} months, ${j.span ? j.span.from + '→' + j.span.to : 'empty'} (provisional: ${j.provisional_month}).`);
