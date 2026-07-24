#!/usr/bin/env node
/**
 * build-recalls-open-data.mjs — publish the ingredient-tagged food-recall feed (fetched by
 * scripts/fetch-food-recalls.mjs on the operator Mac) as CC0 open-data artifacts + a per-ingredient
 * index the events surface will consume. openFDA Food Enforcement is US-FDA public domain (CC0), and
 * these are a deterministic re-derivation of it (a whole-word ingredient text match), so CC0 holds.
 *
 *   cost-index/food-recalls.csv               — flat, one row per recall × matched ingredient
 *   cost-index/food-recalls-by-ingredient.json — slug → { n, class_i, latest, recent[] } index
 *
 * Honesty (ADR-011): a recall is a DATED, DOCUMENTED event surfaced as CO-OCCURRENCE beside a price
 * window — never an asserted price cause, magnitude, or forecast. The slug tag is a text match on the
 * product, not an inferred supply/price link.
 *
 *   node scripts/build-recalls-open-data.mjs [--check] [--self-test]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = 'data/food-recalls.json';
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
const FRAMING = 'co-occurrence, never cause; a dated documented recall beside a price window, not a supply or price link';
const rd = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));
function csvCell(v) { const s = String(v == null ? '' : v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }

// one CSV row per (recall × matched ingredient) so the file joins cleanly on slug
function buildCsv(recalls) {
  const cols = ['slug', 'recall_number', 'report_date', 'classification', 'status', 'recalling_firm', 'distribution_states', 'product'];
  const rows = [];
  for (const r of recalls) for (const slug of (r.slugs || [])) {
    rows.push([slug, r.recall_number, r.report_date, r.classification, r.status, r.firm, r.states, r.product]);
  }
  rows.sort((a, b) => a[0].localeCompare(b[0]) || String(b[2]).localeCompare(String(a[2])));
  return cols.join(',') + '\n' + rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
}

// per-ingredient index — what the events-page block renders: count, class-I count, latest date, recent list
function buildByIngredient(recalls) {
  const by = {};
  for (const r of recalls) for (const slug of (r.slugs || [])) {
    const e = by[slug] || (by[slug] = { slug, n: 0, class_i: 0, latest: null, recent: [] });
    e.n++;
    if (r.classification === 'Class I') e.class_i++;
    if (!e.latest || (r.report_date && r.report_date > e.latest)) e.latest = r.report_date;
    e.recent.push({ date: r.report_date, classification: r.classification, status: r.status, product: r.product, recall_number: r.recall_number });
  }
  for (const slug of Object.keys(by)) {
    by[slug].recent.sort((a, b) => String(b.date).localeCompare(String(a.date))).splice(5); // keep 5 most recent
  }
  return { _doc: 'Per-ingredient index of openFDA food recalls (slug → count, Class-I count, latest date, 5 most recent). ' + FRAMING + '. Source: openFDA (US FDA), public domain. Derived by build-recalls-open-data.mjs from data/food-recalls.json.', license: CC0, framing: FRAMING, since: '2020-01-01', ingredients: Object.keys(by).length, index: by };
}

function artifacts() {
  const src = rd(SRC);
  const recalls = src.recalls || [];
  return [
    { rel: 'cost-index/food-recalls.csv', content: buildCsv(recalls) },
    { rel: 'cost-index/food-recalls-by-ingredient.json', content: JSON.stringify(buildByIngredient(recalls), null, 2) + '\n' },
  ];
}

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error('  ✗', n, 'got', JSON.stringify(g), 'want', JSON.stringify(w)); } };
  const recalls = [
    { recall_number: 'F-1', report_date: '2026-01-10', classification: 'Class I', status: 'Ongoing', firm: 'A', states: 'MD', product: 'Fresh Cilantro, big, comma "q"', slugs: ['cilantro', 'onion'] },
    { recall_number: 'F-2', report_date: '2026-03-01', classification: 'Class II', status: 'Completed', firm: 'B', states: 'VA', product: 'Diced Onion', slugs: ['onion'] },
  ];
  const csv = buildCsv(recalls);
  eq('csv header', csv.split('\n')[0], 'slug,recall_number,report_date,classification,status,recalling_firm,distribution_states,product');
  eq('one row per recall×slug (2 recalls → 3 rows)', csv.trim().split('\n').length - 1, 3);
  eq('RFC4180-quotes a comma+quote product', /"Fresh Cilantro, big, comma ""q"""/.test(csv), true);
  const idx = buildByIngredient(recalls);
  eq('onion tallies both recalls', idx.index.onion.n, 2);
  eq('onion class_i count', idx.index.onion.class_i, 1);
  eq('onion latest date is the most recent', idx.index.onion.latest, '2026-03-01');
  eq('recent is newest-first', idx.index.onion.recent[0].date, '2026-03-01');
  eq('framing is co-occurrence, never cause', idx.framing.startsWith('co-occurrence, never cause'), true);
  eq('license is CC0', idx.license, CC0);
  // live shape
  if (fs.existsSync(path.join(repo, SRC))) {
    const live = buildByIngredient(rd(SRC).recalls || []);
    eq('live index has ingredients', live.ingredients > 0, true);
  }
  console.log(`build-recalls-open-data self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

const args = new Set(process.argv.slice(2));
if (args.has('--self-test')) selfTest();
if (!fs.existsSync(path.join(repo, SRC))) {
  console.error(`build-recalls-open-data: ${SRC} not found — run scripts/fetch-food-recalls.mjs --live on the operator Mac first.`);
  process.exit(args.has('--check') ? 0 : 1); // --check tolerates absence (CI before the operator has fetched)
}
const arts = artifacts();
if (args.has('--check')) {
  let drift = 0;
  for (const a of arts) { const p = path.join(repo, a.rel); const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; if (cur !== a.content) { drift++; console.error(`✗ ${a.rel} is stale — run: node scripts/build-recalls-open-data.mjs`); } }
  if (drift) process.exit(1);
  console.log(`✓ recalls open-data in sync (${arts.length} artifact(s)).`);
  process.exit(0);
}
for (const a of arts) fs.writeFileSync(path.join(repo, a.rel), a.content);
const idx = JSON.parse(arts[1].content);
console.log(`Wrote food-recalls.csv + by-ingredient index — ${idx.ingredients} ingredients with ≥1 recall.`);
