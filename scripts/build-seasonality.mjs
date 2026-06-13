#!/usr/bin/env node
/**
 * build-seasonality.mjs — per-ingredient seasonal baseline (D3) from the vendored
 * history in data/cost-index.json.
 *
 * A PURE, DETERMINISTIC function of data/cost-index.json (no `now`, so --check is
 * stable across days). It answers "is this high *for this month*?" — but ONLY for
 * a calendar month we have actually observed across enough separate years to call
 * a number "typical." A month is `established` once it carries observations in
 * >= MIN_YEARS_PER_MONTH distinct years; for those months we publish a median +
 * an interquartile (p25/p75) band. An ingredient is `ready` once it has enough
 * established months to read a season honestly.
 *
 * Until the weekly refresh accumulates that history (current corpus is months,
 * not years), every ingredient sits in a transparent `building` state that names
 * exactly what it is still waiting for — the "no public data — here's why" ethos
 * applied to TIME rather than coverage. Nothing renders a fake "typical June" off
 * a single June. The renderer reads this artifact; the current-vs-normal delta is
 * computed by the consumer at its own run time so this file stays pure.
 *
 *   node scripts/build-seasonality.mjs            # write data/seasonality.json
 *   node scripts/build-seasonality.mjs --check    # CI: fail if the committed file is stale
 *   node scripts/build-seasonality.mjs --self-test
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { historyWeeks } from './check-cost-index-calibration.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Honesty thresholds (the roadmap puts a robust seasonal read at 2-3yr history).
// A month is only "established" once it repeats across years — one June is a point,
// not a norm. ~78 weeks (1.5yr) is the soft progress yardstick shown to a reader.
export const MIN_YEARS_PER_MONTH = 2;   // distinct years of a month before it earns a normal
export const MIN_ESTABLISHED_MONTHS = 6; // established months before the ingredient reads "ready"
const WEEKS_TARGET = 78;                 // progress denominator only — never a gate

// Linear-interpolation percentile over an unsorted cents array (cents in → cents out).
export function percentileCents(values, p) {
  const xs = values.filter((v) => typeof v === 'number').slice().sort((a, b) => a - b);
  if (!xs.length) return null;
  if (xs.length === 1) return xs[0];
  const idx = (p / 100) * (xs.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return Math.round(xs[lo]);
  return Math.round(xs[lo] + (xs[hi] - xs[lo]) * (idx - lo));
}
export const medianCents = (values) => percentileCents(values, 50);

// Pure per-ingredient seasonal record from its history ({date, valueCents} oldest→newest).
export function ingredientSeasonality(key, entry) {
  const history = (entry && Array.isArray(entry.history) ? entry.history : [])
    .filter((h) => h && typeof h.valueCents === 'number' && typeof h.date === 'string');
  const weeks = historyWeeks(history);
  const years = new Set();
  const monthsObserved = new Set();
  const byMonth = new Map();   // "MM" -> { values:[], years:Set }
  for (const h of history) {
    const yr = h.date.slice(0, 4), mm = h.date.slice(5, 7);
    if (!/^\d{4}$/.test(yr) || !/^(0[1-9]|1[0-2])$/.test(mm)) continue;
    years.add(yr);
    monthsObserved.add(mm);
    let b = byMonth.get(mm);
    if (!b) { b = { values: [], years: new Set() }; byMonth.set(mm, b); }
    b.values.push(h.valueCents);
    b.years.add(yr);
  }

  const months = {};
  for (const mm of [...byMonth.keys()].sort()) {
    const b = byMonth.get(mm);
    if (b.years.size < MIN_YEARS_PER_MONTH) continue;   // not enough separate years → not a norm yet
    months[mm] = {
      medianCents: medianCents(b.values),
      p25Cents: percentileCents(b.values, 25),
      p75Cents: percentileCents(b.values, 75),
      n: b.values.length,
      years: b.years.size,
    };
  }
  const establishedMonths = Object.keys(months).length;
  const ready = establishedMonths >= MIN_ESTABLISHED_MONTHS;

  // The single binding reason it can't read a season yet (advisory, reader-facing).
  let blocker = null;
  if (!ready) {
    if (years.size < MIN_YEARS_PER_MONTH) blocker = `need a second year of history to know a typical month (have ${years.size})`;
    else blocker = `need ${MIN_ESTABLISHED_MONTHS} months proven across ${MIN_YEARS_PER_MONTH}+ years (have ${establishedMonths})`;
  }

  return {
    key,
    ready,
    weeks,
    distinctYears: years.size,
    distinctMonths: monthsObserved.size,
    establishedMonths,
    progress: `building baseline — ${weeks} of ~${WEEKS_TARGET} weeks · ${years.size} of ${MIN_YEARS_PER_MONTH} years · ${establishedMonths} established month(s)`,
    blocker,
    months,
  };
}

export function build(data) {
  const ings = data.ingredients || {};
  const rows = Object.keys(ings)
    .map((k) => ingredientSeasonality(k, ings[k]))
    .filter((r) => r.weeks > 0)   // only ingredients that carry history
    .sort((a, b) => (b.establishedMonths - a.establishedMonths) || (b.weeks - a.weeks) || a.key.localeCompare(b.key));
  return {
    _doc: 'Per-ingredient seasonal baseline for the Cost Index, derived purely from the vendored history in data/cost-index.json by scripts/build-seasonality.mjs (CI runs --check). A month appears under `months` only once observed across ' + MIN_YEARS_PER_MONTH + '+ distinct years; `ready` means enough established months to read a season. Until then `building` names what it waits for. The current-vs-normal delta is computed by the consumer at render time so this file stays date-independent. Regenerate after every vendor.',
    generatedFrom: data.generatedAt || data._lastReviewed || data.asOf || null,
    params: { minYearsPerMonth: MIN_YEARS_PER_MONTH, minEstablishedMonths: MIN_ESTABLISHED_MONTHS, weeksTarget: WEEKS_TARGET },
    summary: {
      total: rows.length,
      ready: rows.filter((r) => r.ready).length,
      building: rows.filter((r) => !r.ready).length,
    },
    ingredients: rows,
  };
}

function run() {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) return selfTest();
  let data;
  try { data = JSON.parse(readFileSync(path.join(repoRoot, 'data/cost-index.json'), 'utf8')); }
  catch (e) { console.error('seasonality: cannot read data/cost-index.json —', e.message); process.exit(1); }
  const outPath = path.join(repoRoot, 'data/seasonality.json');
  const built = JSON.stringify(build(data), null, 2) + '\n';
  const s = JSON.parse(built);
  const tag = `${s.summary.total} ingredient(s) with history, ${s.summary.ready} ready / ${s.summary.building} building`;

  if (args.includes('--check')) {
    let current = '';
    try { current = readFileSync(outPath, 'utf8'); } catch { /* missing → stale */ }
    if (current !== built) {
      console.error('seasonality: data/seasonality.json is stale — run `node scripts/build-seasonality.mjs` and commit.');
      process.exit(1);
    }
    // Invariant: a `ready` ingredient must carry established months; a `building` one
    // must name its blocker. Cheap guards that pin the engine's honesty contract.
    const bad = s.ingredients.find((r) => (r.ready && Object.keys(r.months).length === 0) || (!r.ready && !r.blocker));
    if (bad) {
      console.error(`seasonality: honesty invariant broken for ${bad.key} (ready without normals, or building without a reason).`);
      process.exit(1);
    }
    console.log(`seasonality: baseline in sync — ${tag}.`);
    process.exit(0);
  }
  writeFileSync(outPath, built);
  console.log(`seasonality: wrote data/seasonality.json — ${tag}.`);
}

function selfTest() {
  const cases = [];
  const ok = (name, got, want) => cases.push({ name, pass: JSON.stringify(got) === JSON.stringify(want), got, want });

  // percentile / median math
  ok('median odd', medianCents([300, 100, 200]), 200);
  ok('median even (interp)', medianCents([100, 200, 300, 400]), 250);
  ok('p25 interp', percentileCents([100, 200, 300, 400, 500], 25), 200);
  ok('single value', medianCents([777]), 777);

  // A month seen in only ONE year is NOT established (no fake "typical June").
  const oneYear = { history: [
    { date: '2026-06-01', valueCents: 100 }, { date: '2026-06-08', valueCents: 120 },
    { date: '2026-06-15', valueCents: 110 },
  ] };
  const r1 = ingredientSeasonality('x', oneYear);
  ok('one year → not ready', r1.ready, false);
  ok('one year → no established months', r1.establishedMonths, 0);
  ok('one year → year blocker', /second year/.test(r1.blocker), true);

  // The SAME month across two years IS established → publishes a normal + band.
  const twoYears = { history: [
    { date: '2025-06-03', valueCents: 100 }, { date: '2025-06-17', valueCents: 140 },
    { date: '2026-06-02', valueCents: 120 }, { date: '2026-06-16', valueCents: 160 },
  ] };
  const r2 = ingredientSeasonality('y', twoYears);
  ok('two years of June → June established', !!r2.months['06'], true);
  ok('June median across years', r2.months['06'] && r2.months['06'].medianCents, 130);
  ok('June counts 2 years', r2.months['06'] && r2.months['06'].years, 2);
  // ...but two established months is short of the readiness bar.
  ok('one established month → still building', r2.ready, false);
  ok('building names month-count blocker', /months proven/.test(r2.blocker), true);

  // No history → dropped from the matrix by build().
  ok('no history → weeks 0', ingredientSeasonality('z', { history: [] }).weeks, 0);

  const failed = cases.filter((c) => !c.pass);
  for (const c of failed) console.error(`  ✗ ${c.name}: got ${JSON.stringify(c.got)}, want ${JSON.stringify(c.want)}`);
  console.log(`seasonality self-test: ${cases.length - failed.length}/${cases.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) run();
