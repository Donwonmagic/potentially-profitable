#!/usr/bin/env node
/**
 * fetch-food-recalls.mjs — openFDA Food Enforcement (recall) adapter, wave-1 of the corpus-expansion
 * fetch list (data/corpus-fetch-list.json). It pulls dated, documented food recalls into the ADR-011
 * events lane as CO-OCCURRENCE — an event flag beside a price window, NEVER an asserted price cause
 * or magnitude. openFDA is US-FDA public domain (CC0), so the normalized subset is redistributable.
 *
 * Per ADR-013 the LIVE fetch runs on the operator Mac (network); the container proves the transform
 * offline with a synthetic fixture. normalize() keeps only factual recall fields and adds no
 * interpretation — the honesty work (which ingredient a recall co-occurs with, and its caveat) is a
 * separate, fact-gated surface build once real data lands.
 *
 *   node scripts/fetch-food-recalls.mjs                 # demo: normalize a synthetic fixture, no network
 *   node scripts/fetch-food-recalls.mjs --self-test     # CI: pin the transform + honesty framing
 *   node scripts/fetch-food-recalls.mjs --live          # operator Mac: fetch openFDA + write data/food-recalls.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENDPOINT = 'https://api.fda.gov/food/enforcement.json';
const OUT = 'data/food-recalls.json';
const SINCE = '20200101'; // pull recalls from this report_date forward (openFDA YYYYMMDD)

// A recall is a DATED, DOCUMENTED EVENT. Keep the factual recall fields; add nothing interpretive.
function normalize(r) {
  const d = (s) => /^\d{8}$/.test(s || '') ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : (s || null);
  const clamp = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  return {
    recall_number: r.recall_number || null,
    event_id: r.event_id || null,
    report_date: d(r.report_date),
    initiated: d(r.recall_initiation_date),
    classification: r.classification || null, // FDA severity Class I/II/III — a published fact, not our judgment
    status: r.status || null,
    product: clamp(r.product_description, 180),
    reason: clamp(r.reason_for_recall, 220),
    firm: clamp(r.recalling_firm, 90),
    states: clamp(r.distribution_pattern, 120),
    product_type: r.product_type || null,
  };
}

function buildOutput(results, fetchedAt) {
  return {
    _doc: 'openFDA Food Enforcement (recall) events for the Cost Index events lane (ADR-011). Each row is a DATED, DOCUMENTED recall, surfaced as CO-OCCURRENCE beside a price window — NEVER an asserted price cause, magnitude, or forecast. Source: openFDA (US FDA), public domain (CC0). Built by scripts/fetch-food-recalls.mjs --live on the operator Mac.',
    source: `openFDA Food Enforcement — ${ENDPOINT}`,
    license: 'CC0-1.0 / public-domain-usgov',
    framing: 'co-occurrence, never cause',
    fetchedAt: fetchedAt || null,
    count: results.length,
    recalls: results.map(normalize),
  };
}

// Synthetic fixture — clearly NOT real recalls (F-DEMO numbers, Example firms), so the transform is
// provable offline without ever asserting a real event. Only --live writes real data.
const DEMO = {
  results: [
    { recall_number: 'F-DEMO-0001', event_id: '00000', report_date: '20260115', recall_initiation_date: '20260110', classification: 'Class I', status: 'Ongoing', product_description: 'Sample leafy greens, 10 oz bag (synthetic demo item)', reason_for_recall: 'Illustrative demo reason — potential contamination; synthetic sample, not a real recall', recalling_firm: 'Example Produce Co.', distribution_pattern: 'MD, VA, DC', product_type: 'Food' },
    { recall_number: 'F-DEMO-0002', event_id: '00001', report_date: '20260203', recall_initiation_date: '20260130', classification: 'Class II', status: 'Completed', product_description: 'Sample tree nuts, 2 lb (synthetic demo item)', reason_for_recall: 'Illustrative demo reason — mislabeling; synthetic sample', recalling_firm: 'Example Nut Co.', distribution_pattern: 'Nationwide', product_type: 'Food' },
  ],
};

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error('  ✗', n, 'got', JSON.stringify(g), 'want', JSON.stringify(w)); } };
  const r = normalize(DEMO.results[0]);
  eq('report_date YYYYMMDD → YYYY-MM-DD', r.report_date, '2026-01-15');
  eq('initiated date converted', r.initiated, '2026-01-10');
  eq('FDA classification preserved verbatim', r.classification, 'Class I');
  eq('distribution states preserved', r.states, 'MD, VA, DC');
  eq('whitespace-collapsed + clamped product', normalize({ product_description: '  a   b  ' }).product, 'a b');
  eq('only factual recall keys (no interpretation field)', Object.keys(r).sort().join(','), ['classification', 'event_id', 'firm', 'initiated', 'product', 'product_type', 'reason', 'recall_number', 'report_date', 'states', 'status'].join(','));
  const out = buildOutput(DEMO.results, null);
  eq('output framing is co-occurrence, never cause', out.framing, 'co-occurrence, never cause');
  eq('output is CC0 public domain', out.license, 'CC0-1.0 / public-domain-usgov');
  eq('output count matches', out.count, 2);
  eq('demo fetchedAt is null (no clock in the container)', out.fetchedAt, null);
  console.log(`fetch-food-recalls self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

async function live() {
  const all = [];
  const LIMIT = 1000;
  for (let skip = 0; skip < 26000; skip += LIMIT) {
    const url = `${ENDPOINT}?search=report_date:[${SINCE}+TO+29991231]&limit=${LIMIT}&skip=${skip}&sort=report_date:desc`;
    let res;
    for (let attempt = 0; attempt < 4; attempt++) {
      try { res = await fetch(url); break; } catch (e) { if (attempt === 3) throw e; await new Promise((r) => setTimeout(r, 2000 * (attempt + 1))); }
    }
    if (res.status === 404) break; // openFDA returns 404 when skip runs past the result set
    if (!res.ok) throw new Error(`openFDA HTTP ${res.status} at skip=${skip}`);
    const json = await res.json();
    const results = (json && json.results) || [];
    all.push(...results);
    if (results.length < LIMIT) break;
  }
  const out = buildOutput(all, new Date().toISOString());
  fs.writeFileSync(path.join(repo, OUT), JSON.stringify(out, null, 2) + '\n');
  console.log(`fetch-food-recalls: wrote ${OUT} — ${out.count} recall(s) since ${SINCE}.`);
}

if (process.argv.includes('--self-test')) { selfTest(); }
else if (process.argv.includes('--live')) { live().catch((e) => { console.error('fetch-food-recalls --live failed:', e.message); process.exit(1); }); }
else {
  console.log('DEMO (synthetic sample, no network) — normalized recall events:\n');
  console.log(JSON.stringify(buildOutput(DEMO.results, null), null, 2));
  console.log(`\nRun with --live on the operator Mac to fetch openFDA and write ${OUT}.`);
}
