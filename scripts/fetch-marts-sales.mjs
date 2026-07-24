#!/usr/bin/env node
/**
 * fetch-marts-sales.mjs — Census MARTS "Food Services & Drinking Places" monthly sales, wave-3
 * (DEMAND lane) of the corpus-expansion fetch list. This is the sell-side / pricing-power backdrop
 * the food index lacks: are diners spending, or trading down? Pulled from FRED's KEYLESS CSV mirror
 * of the Census series (simpler + more stable than the Census EITS API, and no CENSUS_KEY needed):
 *   RSFSDP  — Advance Retail Sales: Food Services & Drinking Places, seasonally adjusted, $millions
 *   RSFSDPN — same, NOT seasonally adjusted
 * Both are US-Census public domain.
 *
 * STRICT LANE DISCIPLINE (ADR-013): OBSERVED sales, never a demand forecast; the latest month is an
 * advance estimate (provisional); a DEMAND backdrop, never blended into the food index, the pressure
 * math, or the Vendor Benchmark reference.
 *
 *   node scripts/fetch-marts-sales.mjs               # demo: transform a fixture CSV, no network
 *   node scripts/fetch-marts-sales.mjs --self-test   # CI: pin the transform + lane framing
 *   node scripts/fetch-marts-sales.mjs --live        # operator Mac: fetch FRED CSV → data/marts-sales.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'data/marts-sales.json';
const CSV_URL = (id) => `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`;
const SINCE = '2015-01-01';

// FRED CSV is dead simple: "observation_date,<ID>\nYYYY-MM-DD,value\n…"; missing values are ".".
function parseFredCsv(text) {
  const out = {};
  const lines = String(text || '').trim().split('\n');
  for (const line of lines.slice(1)) {
    const [date, raw] = line.split(',');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) continue;
    const v = Number(raw);
    if (raw !== '.' && Number.isFinite(v)) out[date] = v;
  }
  return out;
}

function assemble(sa, nsa, fetchedAt) {
  const dates = [...new Set([...Object.keys(sa), ...Object.keys(nsa)])].filter((d) => d >= SINCE).sort();
  const months = dates.map((date) => ({ date, sales_sa_musd: sa[date] ?? null, sales_nsa_musd: nsa[date] ?? null }));
  return {
    _doc: 'Census MARTS monthly retail sales for Food Services & Drinking Places (NAICS 722), $millions, via FRED\'s keyless CSV mirror (RSFSDP seasonally adjusted, RSFSDPN not). The sell-side / pricing-power backdrop: OBSERVED sales, NEVER a demand forecast; the most recent month is an advance estimate (provisional). A DEMAND backdrop only — never blended into the food index / pressure math / Vendor Benchmark. Source: US Census Bureau (public domain) via FRED. Built by scripts/fetch-marts-sales.mjs --live on the operator Mac.',
    source: 'Census MARTS via FRED — https://fred.stlouisfed.org/series/RSFSDP',
    unit: 'US$ millions',
    license: 'public-domain-usgov',
    lane: 'demand (observed sales; never a forecast, never in the food index)',
    fetchedAt: fetchedAt || null,
    count: months.length,
    months,
  };
}

const DEMO_SA = 'observation_date,RSFSDP\n2024-10-01,98700\n2024-11-01,99100\n2024-12-01,.\n';
const DEMO_NSA = 'observation_date,RSFSDPN\n2024-10-01,96500\n2024-11-01,94800\n2024-12-01,101200\n';

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error('  ✗', n, 'got', JSON.stringify(g), 'want', JSON.stringify(w)); } };
  const sa = parseFredCsv(DEMO_SA), nsa = parseFredCsv(DEMO_NSA);
  eq('parses a FRED value', sa['2024-10-01'], 98700);
  eq('drops a "." missing value', sa['2024-12-01'], undefined);
  const out = assemble(sa, nsa, null);
  eq('merges SA + NSA by date', out.count, 3);
  eq('missing SA month is null, NSA present', out.months.find((m) => m.date === '2024-12-01'), { date: '2024-12-01', sales_sa_musd: null, sales_nsa_musd: 101200 });
  eq('unit is US$ millions', out.unit, 'US$ millions');
  eq('lane is demand / never a forecast', out.lane, 'demand (observed sales; never a forecast, never in the food index)');
  console.log(`fetch-marts-sales self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

async function live() {
  const get = async (id) => {
    let res;
    for (let a = 0; a < 4; a++) { try { res = await fetch(CSV_URL(id)); break; } catch (e) { if (a === 3) throw e; await new Promise((r) => setTimeout(r, 2000 * (a + 1))); } }
    if (!res.ok) throw new Error(`FRED HTTP ${res.status} for ${id}`);
    return parseFredCsv(await res.text());
  };
  const sa = await get('RSFSDP'), nsa = await get('RSFSDPN');
  const out = assemble(sa, nsa, new Date().toISOString());
  fs.writeFileSync(path.join(repo, OUT), JSON.stringify(out, null, 2) + '\n');
  const last = out.months[out.months.length - 1];
  console.log(`fetch-marts-sales: wrote ${OUT} — ${out.count} months, latest ${last ? last.date + ' $' + last.sales_sa_musd + 'M SA' : 'none'}.`);
}

if (process.argv.includes('--self-test')) { selfTest(); }
else if (process.argv.includes('--live')) { live().catch((e) => { console.error('fetch-marts-sales --live failed:', e.message); process.exit(1); }); }
else {
  console.log('DEMO (fixture CSV, no network):\n');
  console.log(JSON.stringify(assemble(parseFredCsv(DEMO_SA), parseFredCsv(DEMO_NSA), null), null, 2));
  console.log(`\nRun with --live on the operator Mac to fetch the FRED CSV mirror and write ${OUT}.`);
}
