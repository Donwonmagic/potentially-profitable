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
const CCBY = 'https://creativecommons.org/licenses/by/4.0/';
// Neutral framing for the derived index — it carries NO price, so it never says "beside a price
// window" (that phrasing belongs only on the events surface where price is adjacent).
const FRAMING = 'a dated documented recall on its own — never joined to a price, never a cause, never a magnitude; the slug tag is a whole-word product-text match, not a supply or price link';
const CLASS_RANK = { 'Class I': 1, 'Class II': 2, 'Class III': 3 };
const CLASS_KEY = { 1: 'class_i_events', 2: 'class_ii_events', 3: 'class_iii_events' };
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

// per-ingredient index — what the /open/recalls/ explorer renders. The HONEST headline is DISTINCT
// EVENTS, not notices: one firm recalling 70 lots in a single event_id is one event, not 70 shocks.
// So per slug we group notices by event_id, take the most-severe (dominant) class per event, and
// count distinct events by that dominant class (the three class_*_events sum to `events`). `n` (raw
// notice count) is kept as the secondary, less-honest tally. This compiled taxonomy is Muntin's
// analysis over the CC0 source, so the by-ingredient index is CC-BY (the flat CSV stays CC0).
function buildByIngredient(recalls) {
  const notices = {};
  for (const r of recalls) for (const slug of (r.slugs || [])) (notices[slug] = notices[slug] || []).push(r);
  const index = {};
  for (const slug of Object.keys(notices)) {
    const rows = notices[slug];
    // group this slug's notices by event; dominant class = most severe (min rank) notice in the event
    const events = {};
    for (const r of rows) {
      const ev = r.event_id || `_${r.recall_number}`;           // an eventless notice is its own event
      const rank = CLASS_RANK[r.classification] || 99;
      const g = events[ev] || (events[ev] = { rank: 99, latest: null });
      if (rank < g.rank) g.rank = rank;
      if (r.report_date && (!g.latest || r.report_date > g.latest)) g.latest = r.report_date;
    }
    const evList = Object.values(events);
    const classEvents = { class_i_events: 0, class_ii_events: 0, class_iii_events: 0 };
    let latestClassI = null;
    for (const g of evList) {
      const key = CLASS_KEY[g.rank];
      if (key) classEvents[key]++;                              // no key ⇒ unclassified event, not counted by class
      if (g.rank === 1 && g.latest && (!latestClassI || g.latest > latestClassI)) latestClassI = g.latest;
    }
    const latest = rows.reduce((m, r) => (r.report_date && (!m || r.report_date > m) ? r.report_date : m), null);
    const recent = rows.slice()
      .sort((a, b) => String(b.report_date).localeCompare(String(a.report_date)))
      .slice(0, 5)
      .map((r) => ({ date: r.report_date, classification: r.classification, status: r.status, product: r.product, firm: r.firm, states: r.states, recall_number: r.recall_number, event_id: r.event_id }));
    index[slug] = {
      slug,
      n: rows.length,                                           // raw notice count (secondary tally)
      events: evList.length,                                    // distinct events — the honest headline
      ...classEvents,                                           // class_i_events + class_ii_events + class_iii_events ≤ events
      latest,
      order_key: latestClassI || latest,                       // sort by latest Class-I event, else latest event
      recent,
    };
  }
  // top-level summary — deduped by recall_number so a recall tagged to N slugs counts as ONE recall
  const seen = new Map();
  for (const r of recalls) if (!seen.has(r.recall_number)) seen.set(r.recall_number, r);
  const distinct = [...seen.values()];
  const summary = {
    recalls: distinct.length,
    tagged_ingredients: Object.keys(index).length,
    total_tags: Object.values(index).reduce((s, e) => s + e.n, 0),
    distinct_events: new Set(distinct.map((r) => r.event_id || `_${r.recall_number}`)).size,
    class_i_recalls: distinct.filter((r) => r.classification === 'Class I').length,
    ongoing: distinct.filter((r) => /ongoing/i.test(r.status || '')).length,
  };
  return {
    _doc: 'Per-ingredient index of openFDA food recalls (slug → distinct-event counts by FDA class, raw notice count, latest date, 5 most recent). The honest headline is DISTINCT EVENTS (event_id), not notices. ' + FRAMING + '. Source: openFDA (US FDA), public domain (CC0); this compiled analysis/taxonomy is Muntin, CC-BY 4.0. Derived by build-recalls-open-data.mjs from data/food-recalls.json.',
    license: CCBY,
    framing: FRAMING,
    since: '2020-01-01',
    summary,
    ingredients: Object.keys(index).length,
    index,
  };
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
    // two notices sharing event E1 (same event, two lots) + one solo event E2 — onion sees 3 notices, 2 events
    { recall_number: 'F-1', event_id: 'E1', report_date: '2026-01-10', classification: 'Class I', status: 'Ongoing', firm: 'A', states: 'MD', product: 'Fresh Cilantro, big, comma "q"', slugs: ['cilantro', 'onion'] },
    { recall_number: 'F-1b', event_id: 'E1', report_date: '2026-01-11', classification: 'Class II', status: 'Ongoing', firm: 'A', states: 'MD', product: 'Fresh Onion, lot B', slugs: ['onion'] },
    { recall_number: 'F-2', event_id: 'E2', report_date: '2026-03-01', classification: 'Class II', status: 'Completed', firm: 'B', states: 'VA', product: 'Diced Onion', slugs: ['onion'] },
  ];
  const csv = buildCsv(recalls);
  eq('csv header', csv.split('\n')[0], 'slug,recall_number,report_date,classification,status,recalling_firm,distribution_states,product');
  eq('one row per recall×slug (3 notices → 4 rows: cilantro×1 + onion×3)', csv.trim().split('\n').length - 1, 4);
  eq('RFC4180-quotes a comma+quote product', /"Fresh Cilantro, big, comma ""q"""/.test(csv), true);
  const idx = buildByIngredient(recalls);
  eq('onion raw notice count is 3', idx.index.onion.n, 3);
  eq('onion distinct events is 2 (< notices)', idx.index.onion.events, 2);
  eq('events < n when an event spans notices', idx.index.onion.events < idx.index.onion.n, true);
  // dominant class per event: E1 = Class I (most severe of I+II), E2 = Class II
  eq('onion class_i_events (E1 dominant Class I)', idx.index.onion.class_i_events, 1);
  eq('onion class_ii_events (E2)', idx.index.onion.class_ii_events, 1);
  eq('onion class_iii_events', idx.index.onion.class_iii_events, 0);
  eq('class_*_events sum to events', idx.index.onion.class_i_events + idx.index.onion.class_ii_events + idx.index.onion.class_iii_events, idx.index.onion.events);
  eq('onion latest date is the most recent notice', idx.index.onion.latest, '2026-03-01');
  // E1 is a dominant-Class-I event; its date is the event's freshest notice (01-11). E2 is Class-II.
  // So order_key = latest Class-I EVENT date = 2026-01-11 (not E2's 03-01, which isn't Class I).
  eq('order_key is the latest Class-I event date (event = freshest notice), not the latest event overall', idx.index.onion.order_key, '2026-01-11');
  eq('recent is newest-first and carries firm/states', [idx.index.onion.recent[0].date, idx.index.onion.recent[0].firm], ['2026-03-01', 'B']);
  // summary dedups by recall_number (cilantro+onion both tag F-1 ⇒ 3 distinct recalls, not 4)
  eq('summary: 3 distinct recalls', idx.summary.recalls, 3);
  eq('summary: 4 total tags', idx.summary.total_tags, 4);
  eq('summary: 2 distinct events', idx.summary.distinct_events, 2);
  eq('summary: 2 tagged ingredients', idx.summary.tagged_ingredients, 2);
  eq('summary: 1 Class-I recall (F-1)', idx.summary.class_i_recalls, 1);
  eq('summary: 2 ongoing recalls', idx.summary.ongoing, 2);
  eq('framing is the neutral no-price line', idx.framing.startsWith('a dated documented recall on its own'), true);
  eq('by-ingredient index is CC-BY (compiled analysis)', idx.license, CCBY);
  // live shape
  if (fs.existsSync(path.join(repo, SRC))) {
    const live = buildByIngredient(rd(SRC).recalls || []);
    eq('live index has ingredients', live.ingredients > 0, true);
    eq('live: every slug class_*_events sum to events', Object.values(live.index).every((e) => e.class_i_events + e.class_ii_events + e.class_iii_events === e.events), true);
    eq('live: every slug events ≤ n', Object.values(live.index).every((e) => e.events <= e.n), true);
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
