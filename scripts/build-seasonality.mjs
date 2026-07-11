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
 * Backfill readiness: an OPTIONAL deep-history store, data/cost-index-history.json,
 * shaped `{ "_doc":"…", "ingredients": { "<key>": [ {"date":"YYYY-MM-DD",
 * "valueCents":N}, … oldest→newest ] } }`, can carry the full multi-year series a
 * connected fetch backfills. When present, build-seasonality uses the deep series
 * for any key whose deep series is LONGER than the capped cost-index.json history,
 * letting the seasonal band activate without touching the live seed. The file now
 * exists (a 12.7 MB, 102-ingredient, 2001-2026 deep backfill), so seasonal normals
 * build from the deep series wherever it is longer; were it ever absent the engine
 * falls back fully INERT (output byte-identical to the capped-history path).
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

// Trailing same-month window (ADR-014 precedent). The "typical {month}" normal is a
// LEVEL comparator — the consumer asks "is today's price high FOR this month?" — so it
// must stay inside today's price regime. A raw multi-decade nominal median drags the
// normal far below the current market (a 25yr ribeye median reads $6.82 when $13/lb IS
// the 2026 normal → a false "~97% above typical"). We therefore compute each month's
// normal from only the observations within WINDOW_YEARS of the series' OWN latest print
// (deterministic — never `now`, so --check stays stable). The full deep series still
// feeds the relative SHAPE surfaces (cheapest/priciest month, 12-month curve), which
// compare months to each other within one pooled series and are robust to nominal drift.
export const WINDOW_YEARS = 5;

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
  const all = (entry && Array.isArray(entry.history) ? entry.history : [])
    .filter((h) => h && typeof h.valueCents === 'number' && typeof h.date === 'string'
                   && /^\d{4}-\d{2}-\d{2}/.test(h.date));
  // Trailing-window bound: keep only observations within WINDOW_YEARS of the series' OWN
  // latest print (never `now`), so the seasonal normal reads today's regime, not a
  // nominal-dragged multi-decade average. Older prints still exist in the deep store for
  // the shape surfaces — they just don't set the level comparator here.
  let history = all;
  if (all.length) {
    let maxYear = 0;
    for (const h of all) { const y = Number(h.date.slice(0, 4)); if (y > maxYear) maxYear = y; }
    const minYear = maxYear - WINDOW_YEARS + 1;
    history = all.filter((h) => Number(h.date.slice(0, 4)) >= minYear);
  }
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

// Optional deep-history store (backfill readiness). The capped history inside
// data/cost-index.json is intentionally short (recent weeks only). A connected
// fetch can populate data/cost-index-history.json with the FULL multi-year series
// per ingredient, letting the seasonal band activate from backfilled data without
// touching the live seed. Contract:
//
//   {
//     "_doc": "…",
//     "ingredients": {
//       "<key>": [ { "date": "YYYY-MM-DD", "valueCents": N }, …oldest→newest ]
//     }
//   }
//
// For each ingredient, if this deep store carries a LONGER series for that key,
// build-seasonality uses it INSTEAD of the capped cost-index.json history;
// otherwise it falls back to the current behavior. INERT until the file exists —
// while it is absent, output is byte-for-byte identical to today, so
// data/seasonality.json and the --check gate are unchanged.
export function deepHistoryFor(deep, key, fallbackHistory) {
  const series = deep && deep.ingredients && Array.isArray(deep.ingredients[key]) ? deep.ingredients[key] : null;
  if (!series) return fallbackHistory;
  const clean = series.filter((h) => h && typeof h.valueCents === 'number' && typeof h.date === 'string');
  // Only override when the deep store is actually longer — never shorten a series.
  return clean.length > (Array.isArray(fallbackHistory) ? fallbackHistory.length : 0) ? clean : fallbackHistory;
}

export function build(data, deep) {
  const ings = data.ingredients || {};
  const rows = Object.keys(ings)
    .map((k) => {
      const entry = ings[k] || {};
      const history = deepHistoryFor(deep, k, (entry && Array.isArray(entry.history)) ? entry.history : []);
      return ingredientSeasonality(k, { ...entry, history });
    })
    .filter((r) => r.weeks > 0)   // only ingredients that carry history
    .sort((a, b) => (b.establishedMonths - a.establishedMonths) || (b.weeks - a.weeks) || a.key.localeCompare(b.key));
  return {
    _doc: 'Per-ingredient seasonal baseline for the Cost Index, derived purely from the vendored history in data/cost-index.json by scripts/build-seasonality.mjs (CI runs --check). A month appears under `months` only once observed across ' + MIN_YEARS_PER_MONTH + '+ distinct years; `ready` means enough established months to read a season. Until then `building` names what it waits for. The current-vs-normal delta is computed by the consumer at render time so this file stays date-independent. Regenerate after every vendor.',
    generatedFrom: data.generatedAt || data._lastReviewed || data.asOf || null,
    params: { minYearsPerMonth: MIN_YEARS_PER_MONTH, minEstablishedMonths: MIN_ESTABLISHED_MONTHS, weeksTarget: WEEKS_TARGET, windowYears: WINDOW_YEARS },
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
  // Optional deep-history store — absent by default (a connected fetch populates
  // it later). When missing, `deep` stays null and build() reproduces today's
  // output exactly, so the committed file and --check gate do not move.
  let deep = null;
  try { deep = JSON.parse(readFileSync(path.join(repoRoot, 'data/cost-index-history.json'), 'utf8')); }
  catch { /* deep store not present yet → inert, fall back to capped history */ }
  const outPath = path.join(repoRoot, 'data/seasonality.json');
  const built = JSON.stringify(build(data, deep), null, 2) + '\n';
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
    // Bounded-window invariant (ADR-014): no published month may pool more than
    // WINDOW_YEARS of history — that is what keeps the "typical {month}" normal in
    // today's price regime instead of nominal-dragging it across decades.
    const drift = s.ingredients.find((r) => Object.values(r.months || {}).some((m) => m && m.years > WINDOW_YEARS));
    if (drift) {
      console.error(`seasonality: bounded-window invariant broken for ${drift.key} (a month pools > ${WINDOW_YEARS} years — nominal-drag risk).`);
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

  // Trailing window: a decades-old print must NOT set the normal. Same June across
  // 2001 (cheap nominal) + 2024/2025/2026 (current regime): the 2001 point falls
  // outside the 5yr window of the 2026 anchor, so the median reads the recent regime
  // and the month reports years<=WINDOW_YEARS.
  const drifted = { history: [
    { date: '2001-06-10', valueCents: 300 },   // out of window — must be dropped
    { date: '2024-06-10', valueCents: 1200 }, { date: '2025-06-10', valueCents: 1300 },
    { date: '2026-06-10', valueCents: 1400 },
  ] };
  const rW = ingredientSeasonality('w', drifted);
  ok('trailing window drops 2001 print', rW.months['06'] && rW.months['06'].years, 3);
  ok('trailing window median is in-regime (not dragged by 2001)', rW.months['06'] && rW.months['06'].medianCents, 1300);
  ok('trailing window caps years at WINDOW_YEARS', rW.months['06'] && rW.months['06'].years <= WINDOW_YEARS, true);

  // No history → dropped from the matrix by build().
  ok('no history → weeks 0', ingredientSeasonality('z', { history: [] }).weeks, 0);

  // Deep-history backfill: a synthetic 2-year series in the optional deep store
  // (6 months observed across BOTH years) activates the seasonal band — `ready`
  // with populated `months` — even though the capped seed history is a single point.
  const deepData = { ingredients: { romaine: { history: [{ date: '2026-06-01', valueCents: 200 }] } } };
  const deepStore = { ingredients: { romaine: [] } };
  for (const yr of ['2025', '2026']) {
    for (const mm of ['01', '02', '03', '04', '05', '06']) {
      deepStore.ingredients.romaine.push({ date: `${yr}-${mm}-05`, valueCents: 100 + Number(mm) });
      deepStore.ingredients.romaine.push({ date: `${yr}-${mm}-19`, valueCents: 140 + Number(mm) });
    }
  }
  // deepHistoryFor must prefer the longer deep series over the capped seed history.
  ok('deepHistoryFor prefers longer series', deepHistoryFor(deepStore, 'romaine', deepData.ingredients.romaine.history).length, 24);
  // ...and a key absent from the deep store falls back to the seed history untouched.
  ok('deepHistoryFor falls back when key absent', deepHistoryFor(deepStore, 'butter', [{ date: '2026-06-01', valueCents: 9 }]).length, 1);
  const builtDeep = build(deepData, deepStore);
  const romaineRow = builtDeep.ingredients.find((r) => r.key === 'romaine');
  ok('deep series → ingredient ready', !!romaineRow && romaineRow.ready, true);
  ok('deep series → 6 established months', romaineRow && romaineRow.establishedMonths, 6);
  ok('deep series → months populated', romaineRow && Object.keys(romaineRow.months).length, 6);
  // INERT guarantee: with no deep store, build() reproduces the capped-history path.
  const builtFlat = build(deepData, null);
  const flatRow = builtFlat.ingredients.find((r) => r.key === 'romaine');
  ok('no deep store → not ready (inert)', !flatRow || !flatRow.ready, true);

  const failed = cases.filter((c) => !c.pass);
  for (const c of failed) console.error(`  ✗ ${c.name}: got ${JSON.stringify(c.got)}, want ${JSON.stringify(c.want)}`);
  console.log(`seasonality self-test: ${cases.length - failed.length}/${cases.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) run();
