#!/usr/bin/env node
/**
 * build-events-open-data.mjs — publish the detected price-events + co-movement
 * open datasets (CC0), the machine-readable half of the events explorer.
 *
 *   cost-index/events-detected.json / .csv  — 432 sustained moves off local normal
 *   cost-index/co-movement.json    / .csv  — directed "moves-with" co-occurrence
 *
 * License: CC0. These are pure arithmetic over a public-domain wholesale series
 * (deterministic re-derivation, no creative selection). The CURATED registry
 * (cost-index/events.json) stays CC-BY — that one is compiled prose + citation.
 *
 * Honesty: co-movement is CO-OCCURRENCE within ~6 weeks, never cause; the measure
 * is directed + bounded ("K of the anchor's own N moves"). No forecast. The
 * magnitude column is named ref_pct_from_normal (a wholesale reference vs its own
 * ±26-wk median), never "price change".
 *
 *   node scripts/build-events-open-data.mjs [--check] [--self-test]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEventsData, flatEvents, coMovement, companyStat } from './lib/cost-events-analysis.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
const FRAMING = 'co-occurrence within ~6 weeks, not cause; a shared episode, not a measured relationship';

function csvCell(v) {
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csv(cols, rows) {
  return cols.join(',') + '\n' + rows.map((r) => cols.map((c) => csvCell(r[c])).join(',')).join('\n') + '\n';
}

function buildDetectedJson(data) {
  const items = {};
  for (const slug of Object.keys(data.items)) {
    const it = data.items[slug];
    if (!(it.eventCount || (it.events && it.events.length))) continue;
    items[slug] = {
      n: it.eventCount || it.events.length,
      span: it.span,
      events: (it.events || []).map((e) => ({
        date: e.date, direction: e.direction, ref_pct_from_normal: e.pctFromNormal,
        value_cents: e.valueCents, normal_cents: e.normalCents, duration_days: e.durationDays,
        month: e.month, in_high_season: !!e.inHighSeason, basis: e.basis, cohort: e.cohort || [],
      })),
    };
  }
  const stat = companyStat(data);
  return {
    _doc: 'Detected price events: the biggest SUSTAINED moves of each ingredient\'s wholesale reference off its own centered ±26-week local median, with duration, own-season, and the cohort of ingredients that moved the same way in the same ~6-week window. Pure arithmetic over a public-domain series. ref_pct_from_normal is a reference vs its own normal, not a delivered price change. Co-movement is co-occurrence, not cause. Not a forecast.',
    license: CC0,
    framing: FRAMING,
    sourceVersion: data._version || null,
    params: data.params || null,
    count: { ingredients: Object.keys(items).length, events: stat.total },
    headline: { moved_with_company: stat.withCompany, moved_alone: stat.alone, pct_with_company: stat.pct, up: stat.up, down: stat.down },
    items,
  };
}

function buildDetectedCsv(data) {
  const cols = ['ingredient_slug', 'date', 'direction', 'ref_pct_from_normal', 'value_cents', 'normal_cents', 'duration_days', 'month', 'in_high_season', 'basis', 'cohort'];
  const rows = flatEvents(data).map((e) => ({
    ingredient_slug: e.slug, date: e.date, direction: e.direction, ref_pct_from_normal: e.pctFromNormal,
    value_cents: e.valueCents, normal_cents: e.normalCents, duration_days: e.durationDays, month: e.month,
    in_high_season: e.inHighSeason ? 1 : 0, basis: e.basis, cohort: (e.cohort || []).join('|'),
  }));
  return csv(cols, rows);
}

function buildCoMovementJson(data) {
  const anchors = coMovement(data);
  const stat = companyStat(data);
  return {
    _doc: 'Directed co-movement: for each ingredient X with N notable price moves, how many of X\'s OWN moves each other ingredient shared (moved the same way in the same ~6-week window). A fraction of X\'s own history, never a global pair count. Co-occurrence, not cause; a shared episode (a growing region, a shipping lane, an aisle), not a measured relationship. No coefficient, lead, or lag is implied.',
    license: CC0,
    framing: FRAMING,
    sourceVersion: data._version || null,
    headline: { total_events: stat.total, pct_with_company: stat.pct },
    anchors,
  };
}

function buildCoMovementCsv(data) {
  const anchors = coMovement(data);
  const cols = ['anchor_slug', 'neighbor_slug', 'shared_moves_k', 'anchor_total_n'];
  const rows = [];
  for (const slug of Object.keys(anchors).sort()) {
    const a = anchors[slug];
    for (const [nb, k] of a.neighbors) rows.push({ anchor_slug: slug, neighbor_slug: nb, shared_moves_k: k, anchor_total_n: a.n });
  }
  return csv(cols, rows);
}

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error(`  ✗ ${n}\n     got ${JSON.stringify(g)}\n     want ${JSON.stringify(w)}`); } };
  const fake = { _version: 9, params: {}, items: {
    a: { eventCount: 2, span: {}, events: [
      { date: '2020-01-01', direction: 'up', pctFromNormal: 50, valueCents: 150, normalCents: 100, durationDays: 30, month: 1, inHighSeason: false, basis: 'wholesale', cohort: ['b', 'c'] },
      { date: '2021-01-01', direction: 'up', pctFromNormal: 40, valueCents: 140, normalCents: 100, durationDays: 20, month: 1, inHighSeason: true, basis: 'wholesale', cohort: ['b'] },
    ] },
    b: { eventCount: 1, span: {}, events: [ { date: '2020-01-05', direction: 'up', pctFromNormal: 30, valueCents: 130, normalCents: 100, durationDays: 10, month: 1, inHighSeason: false, basis: 'wholesale', cohort: [] } ] },
    z: { eventCount: 0, events: [] },
  } };
  const cm = coMovement(fake);
  eq('directed K: a→b = 2 of 2', cm.a.neighbors.find((x) => x[0] === 'b'), ['b', 2]);
  eq('directed K: a→c = 1 of 2', cm.a.neighbors.find((x) => x[0] === 'c'), ['c', 1]);
  eq('neighbors sorted by k desc', cm.a.neighbors.map((x) => x[0]), ['b', 'c']);
  eq('empty-event ingredient excluded', cm.z, undefined);
  eq('anchor n carried', cm.a.n, 2);
  const stat = companyStat(fake);
  eq('company stat', { t: stat.total, a: stat.alone, w: stat.withCompany, p: stat.pct }, { t: 3, a: 1, w: 2, p: 67 });
  eq('csv escaping comma', csvCell('a,b'), '"a,b"');
  const dj = buildDetectedJson(fake);
  eq('detected json keys', Object.keys(dj), ['_doc', 'license', 'framing', 'sourceVersion', 'params', 'count', 'headline', 'items']);
  eq('detected renames pct→ref_pct_from_normal', dj.items.a.events[0].ref_pct_from_normal, 50);
  eq('detected drops raw pctFromNormal', dj.items.a.events[0].pctFromNormal, undefined);
  eq('detected license CC0', dj.license, CC0);
  // live data sanity: the panel-cited 94% / 432
  const live = loadEventsData(repoRoot);
  const ls = companyStat(live);
  eq('live 432 events', ls.total, 432);
  eq('live 94% with company', ls.pct, 94);
  console.log(`build-events-open-data self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

const args = new Set(process.argv.slice(2));
if (args.has('--self-test')) selfTest();

const data = loadEventsData(repoRoot);
const artifacts = [
  { rel: 'cost-index/events-detected.json', content: JSON.stringify(buildDetectedJson(data), null, 2) + '\n' },
  { rel: 'cost-index/events-detected.csv', content: buildDetectedCsv(data) },
  { rel: 'cost-index/co-movement.json', content: JSON.stringify(buildCoMovementJson(data), null, 2) + '\n' },
  { rel: 'cost-index/co-movement.csv', content: buildCoMovementCsv(data) },
];

if (args.has('--check')) {
  let drift = 0;
  for (const a of artifacts) {
    const p = path.join(repoRoot, a.rel);
    const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    if (cur !== a.content) { drift++; console.error(`✗ ${a.rel} is stale — run: node scripts/build-events-open-data.mjs`); }
  }
  if (drift) process.exit(1);
  console.log(`✓ events open data in sync (${artifacts.length} artifact(s)).`);
  process.exit(0);
}
for (const a of artifacts) fs.writeFileSync(path.join(repoRoot, a.rel), a.content);
console.log(`Wrote cost-index/{events-detected,co-movement}.{json,csv} — ${companyStat(data).total} events, ${Object.keys(coMovement(data)).length} anchors.`);
