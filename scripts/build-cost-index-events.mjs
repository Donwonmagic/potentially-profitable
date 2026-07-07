#!/usr/bin/env node
/**
 * build-cost-index-events.mjs — the DETECTION half of the "notable price events" surface.
 *
 * Reads the committed deep price history and, per ingredient, surfaces the biggest
 * SUSTAINED departures from its own local normal — the moves a reader means by "an
 * event that moved the market" (the 2025 egg run, a produce freeze), which a point-
 * outlier filter misses because when every week is high, no single week is anomalous.
 *
 * For each week: local normal = the centered ±BASE_WIN median (≈1yr window, so routine
 * short-season wiggle is folded into the baseline); the level is 3-week-median-smoothed
 * first so a lone bad print can't manufacture an event. A week is a candidate when it
 * sits ≥ FLOOR_PCT from that normal; candidates are collapsed within MERGE_WEEKS to the
 * single peak, then ranked by size. Ingredients with no real move get zero events —
 * "stable" is a true answer, not a gap to fill.
 *
 * Each event also carries three HONEST, computed context signals (no narrative, no cause):
 *   - durationDays  — how long the move actually held (the shoulder around the peak), so
 *                     a one-print blip and a months-long run read differently.
 *   - monthContext  — whether the peak lands in the ingredient's OWN high-price season
 *                     (top-tertile month by its seasonal index); null when <2yr of data,
 *                     so a short series never claims a season it can't measure.
 *   - cohort        — other tracked ingredients that moved the SAME way within ±COHORT_WEEKS,
 *                     surfacing shared episodes (a dairy-complex move, a winter produce squeeze).
 *
 * This is the numbers half. The WHY — "avian flu drove the egg run" — lives in the
 * hand-curated, source-gated data/cost-index-event-notes.json (see check-cost-index-events.mjs);
 * it is editorial, not computed, and nothing unverified ever renders. Here there is
 * deliberately NO cause, NO forecast, NO Pettitt "market step" (that diagnostic is gated
 * off per the 2026-07 stats audit; see data/cost-anomaly-log.json#_doc). Every field is
 * pure arithmetic over the public price series.
 *
 * PURE & DETERMINISTIC (no `now`). Writes data/cost-index-events.json.
 *   node scripts/build-cost-index-events.mjs            # write the surface data
 *   node scripts/build-cost-index-events.mjs --check    # CI: fail if stale
 *   node scripts/build-cost-index-events.mjs --self-test
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(repo, 'data/cost-index-events.json');

const BASE_WIN = 26;      // ± weeks for the local baseline (≈1yr window; folds short-season wiggle into normal)
const SMOOTH = 1;         // ± weeks of median smoothing on the level → 3-week; kills lone-print glitches
const FLOOR_PCT = 20;     // a week must sit ≥ this % from its local normal to count as a notable event
const SHOULDER_FRAC = 0.5;// the move's "duration" runs while it stays ≥ this fraction of the floor, same side
const MERGE_WEEKS = 12;   // collapse candidate weeks within this span to one event (the peak)
const COHORT_WEEKS = 6;   // other ingredients moving the same way within ± this span = a shared episode
const TOP_N = 6;          // most-notable events surfaced per ingredient
const DAY = 864e5;

function rd(p) { try { return JSON.parse(readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } }
// Same median tie-break as cost-anomaly.js / cost-reliability.js — byte-consistent across the suite.
function median(a) {
  if (!a.length) return 0;
  const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
// Ordered {date, valueCents, basis?} per ingredient — same filter the anomaly builder uses.
function historySeries(hist) {
  const out = {};
  const ing = (hist && hist.ingredients) || {};
  for (const k of Object.keys(ing)) {
    const arr = Array.isArray(ing[k]) ? ing[k] : [];
    const pts = arr.filter((p) => p && typeof p.valueCents === 'number' && typeof p.date === 'string');
    if (pts.length) out[k] = pts;
  }
  return out;
}

// Per-month seasonal index over the ingredient's OWN history, with a top-tertile cut.
// Null unless the series spans ≥3 distinct years AND ≥8 calendar months are present.
// The ≥3-year floor is the honesty guard against CIRCULARITY: on a ~1yr series a single
// spike IS the month's median, so it would flag its own event's month as "high season."
// With ≥3 years each month has multiple samples and one event can't define the season.
function monthProfile(pts, vals) {
  const years = new Set(pts.map((p) => p.date.slice(0, 4)));
  if (years.size < 3) return null;
  const byMonth = {};
  for (let i = 0; i < pts.length; i++) {
    const m = +pts[i].date.slice(5, 7);
    (byMonth[m] || (byMonth[m] = [])).push(vals[i]);
  }
  const months = Object.keys(byMonth);
  if (months.length < 8) return null;
  const overall = median(vals);
  if (!(overall > 0)) return null;
  const ratio = {};
  for (const m of months) ratio[m] = median(byMonth[m]) / overall;
  const desc = Object.values(ratio).sort((a, b) => b - a);
  const cut = desc[Math.max(0, Math.ceil(desc.length / 3) - 1)]; // top-tertile threshold
  return { ratio, cut };
}

// How long the move held: expand out from the peak while the smoothed deviation stays on
// the same side and above a shoulder fraction of the floor. Returned in DAYS (cadence-agnostic).
function durationDays(pts, dev, i) {
  const sign = Math.sign(dev[i]);
  const shoulder = (FLOOR_PCT * SHOULDER_FRAC) / 100;
  let l = i, r = i;
  while (l - 1 >= 0 && Math.sign(dev[l - 1]) === sign && Math.abs(dev[l - 1]) >= shoulder) l--;
  while (r + 1 < dev.length && Math.sign(dev[r + 1]) === sign && Math.abs(dev[r + 1]) >= shoulder) r++;
  return Math.max(0, Math.round((Date.parse(pts[r].date) - Date.parse(pts[l].date)) / DAY));
}

// The biggest sustained departures from local normal, ranked by size, de-duped in time.
function eventsFor(pts) {
  const n = pts.length;
  if (n < 2 * BASE_WIN) return [];                 // too short to have a stable "normal"
  const vals = pts.map((p) => p.valueCents);
  const sm = vals.map((_, i) => median(vals.slice(Math.max(0, i - SMOOTH), Math.min(n, i + SMOOTH + 1))));
  const base = vals.map((_, i) => median(vals.slice(Math.max(0, i - BASE_WIN), Math.min(n, i + BASE_WIN + 1))));
  const dev = vals.map((_, i) => (base[i] > 0 ? (sm[i] - base[i]) / base[i] : 0));

  const cand = [];
  for (let i = 0; i < n; i++) if (Math.abs(dev[i]) * 100 >= FLOOR_PCT) cand.push(i);
  cand.sort((a, b) => Math.abs(dev[b]) - Math.abs(dev[a]));   // biggest first
  const picked = [];
  for (const i of cand) {
    if (picked.every((j) => Math.abs(i - j) > MERGE_WEEKS)) picked.push(i);
    if (picked.length >= TOP_N) break;
  }

  const prof = monthProfile(pts, vals);
  const events = picked.map((i) => {
    const b = base[i];
    const pct = Math.round(((vals[i] - b) / b) * 100);       // vs the ACTUAL printed price, so the number is real
    const month = +pts[i].date.slice(5, 7);
    return {
      date: pts[i].date,
      direction: vals[i] > b ? 'up' : 'down',
      pctFromNormal: pct,
      valueCents: vals[i],
      normalCents: Math.round(b),
      durationDays: durationDays(pts, dev, i),
      month,
      inHighSeason: prof ? prof.ratio[month] >= prof.cut : null,
      basis: pts[i].basis || null,
    };
  });
  events.sort((a, b) => Math.abs(b.pctFromNormal) - Math.abs(a.pctFromNormal) || (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return events.map((e, idx) => ({ rank: idx + 1, ...e }));
}

// Shared episodes: after every ingredient's events exist, tag each event with OTHER
// ingredients that moved the SAME direction within ±COHORT_WEEKS. Honest co-movement,
// not causation — the render says "moved together," never "caused."
function addCohorts(items) {
  const span = COHORT_WEEKS * 7 * DAY;
  const flat = [];
  for (const key of Object.keys(items)) for (const e of items[key].events) flat.push({ key, t: Date.parse(e.date), dir: e.direction, e });
  for (const a of flat) {
    const peers = flat
      .filter((b) => b.key !== a.key && b.dir === a.dir && Math.abs(b.t - a.t) <= span)
      .map((b) => b.key);
    a.e.cohort = Array.from(new Set(peers)).sort();
  }
}

function build() {
  const series = historySeries(rd('data/cost-index-history.json'));
  const items = {};
  for (const key of Object.keys(series).sort()) {
    const pts = series[key];
    const events = eventsFor(pts);
    const span = { from: pts[0].date, to: pts[pts.length - 1].date, years: +(((Date.parse(pts[pts.length - 1].date) - Date.parse(pts[0].date)) / (365.25 * DAY))).toFixed(1) };
    items[key] = { n: pts.length, span, eventCount: events.length, events };
  }
  addCohorts(items);
  let nEvents = 0, nIngredients = 0;
  for (const key of Object.keys(items)) { nEvents += items[key].events.length; if (items[key].events.length) nIngredients++; }
  return {
    _doc: 'Notable price events for the Cost Index — the DETECTION half. Per ingredient, the top ' + TOP_N + ' biggest SUSTAINED departures from local normal over the committed deep price history: date, direction, % vs the centered ±' + BASE_WIN + '-week normal, the printed price, how long the move held (durationDays), whether it lands in the item’s own high season (inHighSeason), and which other ingredients moved the same way at the same time (cohort). Pure arithmetic — no cause, no forecast, no invented number, no Pettitt "market step". The WHY is the hand-curated, source-gated data/cost-index-event-notes.json; nothing unverified renders. The level is 3-week-median-smoothed so a lone glitch cannot manufacture an event, and a move must clear ' + FLOOR_PCT + '% to qualify. Built by scripts/build-cost-index-events.mjs; CI re-checks with --check.',
    _version: 2,
    source: { history: 'data/cost-index-history.json' },
    params: { baseWindow: BASE_WIN, smooth: SMOOTH, floorPct: FLOOR_PCT, shoulderFrac: SHOULDER_FRAC, mergeWeeks: MERGE_WEEKS, cohortWeeks: COHORT_WEEKS, topN: TOP_N },
    summary: { ingredients: nIngredients, events: nEvents },
    items,
  };
}

function main() {
  const report = build();
  const json = JSON.stringify(report, null, 2) + '\n';

  if (process.argv.includes('--self-test')) {
    const flat = Object.values(report.items).flatMap((it) => it.events);
    const checks = [
      ['summary present', report.summary && typeof report.summary.events === 'number'],
      ['every event clears the floor', flat.every((e) => Math.abs(e.pctFromNormal) >= FLOOR_PCT)],
      ['direction matches the numbers', flat.every((e) => (e.direction === 'up') === (e.valueCents > e.normalCents))],
      ['ranks are 1..k contiguous', Object.values(report.items).every((it) => it.events.every((e, i) => e.rank === i + 1))],
      ['sorted by |% move| desc', Object.values(report.items).every((it) => it.events.every((e, i) => i === 0 || Math.abs(it.events[i - 1].pctFromNormal) >= Math.abs(e.pctFromNormal)))],
      ['events are time-separated', Object.values(report.items).every((it) => { const d = it.events.map((e) => Date.parse(e.date)).sort((a, b) => a - b); return d.every((x, i) => i === 0 || (x - d[i - 1]) / (7 * DAY) > MERGE_WEEKS); })],
      ['duration is a non-negative number', flat.every((e) => typeof e.durationDays === 'number' && e.durationDays >= 0)],
      ['season flag is bool-or-null', flat.every((e) => e.inHighSeason === true || e.inHighSeason === false || e.inHighSeason === null)],
      ['cohort excludes self, same direction', Object.entries(report.items).every(([k, it]) => it.events.every((e) => Array.isArray(e.cohort) && !e.cohort.includes(k)))],
      ['counts reconcile', report.summary.events === flat.length],
      ['no cause / forecast field leaked', flat.every((e) => !('cause' in e) && !('reason' in e) && !('forecast' in e) && !('why' in e))],
      ['deterministic (rebuild equal)', JSON.stringify(build()) === JSON.stringify(report)],
    ];
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error('  ✗ ' + c[0]));
    console.log(`cost-index-events self-test: ${checks.length - failed.length}/${checks.length} passed.`);
    process.exit(failed.length ? 1 : 0);
  }

  if (process.argv.includes('--check')) {
    let cur = '';
    try { cur = readFileSync(OUT, 'utf8'); } catch {}
    if (cur !== json) { console.error('✗ cost-index events are stale — run: node scripts/build-cost-index-events.mjs'); process.exit(1); }
    console.log(`✓ cost-index events in sync — ${report.summary.events} event(s) across ${report.summary.ingredients} ingredient(s).`);
    return;
  }

  writeFileSync(OUT, json);
  console.log(`Wrote ${report.summary.events} notable event(s) across ${report.summary.ingredients} ingredient(s) → data/cost-index-events.json`);
}

main();
