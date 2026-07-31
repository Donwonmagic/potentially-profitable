#!/usr/bin/env node
/**
 * check-cost-index-series-freshness.mjs — name the DEAD FEEDS, one ingredient
 * at a time.
 *
 * THE GAP THIS FILLS (found 2026-07-30): no gate could see a single frozen
 * series. Two sibling gates look like they would and do not —
 *
 *   - check-cost-index-freshness.mjs takes the MAXIMUM asOf across the whole
 *     file, so one fresh ingredient masks every stalled one. It prints
 *     "freshest read 2026-07-28 (2d old) — fresh" while 18 of 100 series have
 *     not moved in 45-91 days.
 *   - check-staleness-honesty.mjs measures each SOURCE against its own declared
 *     cadence, deterministically, and prints "0 overdue". A source that stops
 *     publishing entirely is not "overdue", it is absent.
 *
 * The only thing that eventually notices is check-cost-index-sync.mjs's
 * per-point POINT_STALE_DAYS rule — but that is a cliff, not a warning. It
 * arrives as a wall of identical "stale." lines months after the feed died,
 * and by then the builder's carry-forward path drops the ingredient outright
 * (see check-cost-index-orphans.mjs for what that does to the published page).
 *
 * So this gate reports the roster EARLY, and splits it the way the decision
 * actually splits:
 *
 *   - UNEXPECTED — a feed that was working and stopped. This is breakage and
 *     somebody has to look. On 2026-07-30 there were 8, including vegetable-oil,
 *     pork-belly and ground-beef, none of which are covered by the documented
 *     seafood sourcing gap, and one of which (vegetable-oil) is a live basket
 *     contributor dating the published headline.
 *   - KNOWN-LATENT — the ten items in KNOWN_SOURCE_LATENT, content-bound with no
 *     free per-cut wholesale source (docs/cost-index-seafood-sourcing.md). These
 *     are a standing founder decision (source or retire), not a new surprise.
 *
 * Warn by default so it never blocks an unrelated PR; --strict fails on the
 * UNEXPECTED roster only, which is the honest promotion path once those are
 * triaged. Known-latent items are never a build failure — that call belongs to
 * the founder, not to CI.
 *
 *   node scripts/check-cost-index-series-freshness.mjs
 *   node scripts/check-cost-index-series-freshness.mjs --strict
 *   node scripts/check-cost-index-series-freshness.mjs --self-test
 *
 * Override: COST_INDEX_SERIES_MAX_AGE_DAYS (default 45)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { KNOWN_SOURCE_LATENT } from './check-cost-index-basis-leak.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The hard cliff lives in check-cost-index-sync.mjs as a module-local const.
 * Parse it rather than restate it: this gate's whole value is counting DOWN to
 * that number, so a copy that silently drifted would report a false deadline.
 */
export function parsePointStaleDays(src) {
  const m = src.match(/const\s+POINT_STALE_DAYS\s*=\s*(\d+)\s*;/);
  return m ? Number(m[1]) : null;
}

export function ageDays(asOf, now) {
  return Math.round((now - Date.parse(asOf)) / 86400000);
}

/**
 * Whole days until check-cost-index-sync's POINT_STALE_DAYS cliff.
 * Matches pointIssues(): stale iff (now - parseDay(asOf)) / 86400000 > cliffDays.
 * Negative once past; 0 means the point is still valid but crosses on the next tick.
 */
export function daysUntilCliff(asOf, now, cliffDays) {
  const ageExact = (now - Date.parse(asOf + 'T00:00:00Z')) / 86400000;
  return ageExact > cliffDays
    ? Math.floor(cliffDays - ageExact)
    : Math.ceil(cliffDays - ageExact);
}

/**
 * Build the frozen-series roster.
 *
 * @param {Record<string, {points?: Array<{asOf?: string}>}>} ingredients
 * @param {{maxAgeDays: number, cliffDays: number, now: number, knownLatent: Set<string>|Map<string, unknown>, basket: Set<string>}} opts
 * @returns {{unexpected: Array<object>, knownLatent: Array<object>, live: number}}
 */
export function roster(ingredients, opts) {
  const { maxAgeDays, cliffDays, now, knownLatent, basket } = opts;
  const unexpected = [];
  const known = [];
  let live = 0;
  for (const [slug, entry] of Object.entries(ingredients || {})) {
    const point = (entry.points || [])[0];
    if (!point || !point.asOf) continue; // absence of data is not a frozen feed
    const age = ageDays(point.asOf, now);
    if (age <= maxAgeDays) { live++; continue; }
    const row = {
      slug,
      asOf: point.asOf,
      age,
      cliffInDays: daysUntilCliff(point.asOf, now, cliffDays),
      inBasket: basket.has(slug),
    };
    if (knownLatent.has(slug)) known.push(row);
    else unexpected.push(row);
  }
  const byAge = (a, b) => b.age - a.age;
  return { unexpected: unexpected.sort(byAge), knownLatent: known.sort(byAge), live };
}

function line(r, cliffDays) {
  const cliff = r.cliffInDays < 0
    ? `PAST the ${cliffDays}d cliff`
    : `cliff in ${r.cliffInDays}d`;
  return `  ${r.slug.padEnd(24)} last read ${r.asOf}  ${String(r.age).padStart(3)}d  (${cliff})${r.inBasket ? '  [BASKET CONTRIBUTOR — dates the published headline]' : ''}`;
}

function selfTest() {
  const fails = [];
  const eq = (name, got, want) => { if (got !== want) fails.push(`${name}: expected ${want}, got ${got}`); };
  // Midnight, so the day arithmetic below is exact and the assertions test the
  // roster logic rather than the rounding behaviour of a half-day offset.
  const NOW = Date.parse('2026-07-30T00:00:00Z');
  const opts = (over = {}) => ({
    maxAgeDays: 45, cliffDays: 120, now: NOW,
    knownLatent: new Map([['octopus', {}]]), basket: new Set(['vegetable-oil']),
    ...over,
  });

  eq('parses the cliff', parsePointStaleDays('const POINT_STALE_DAYS = 120;'), 120);
  eq('parses a changed cliff', parsePointStaleDays('const POINT_STALE_DAYS = 90;'), 90);
  eq('missing cliff is null', parsePointStaleDays('const OTHER = 120;'), null);

  // A live series is silent.
  let r = roster({ ribeye: { points: [{ asOf: '2026-07-28' }] } }, opts());
  eq('fresh series is live', r.live, 1);
  eq('fresh series is not listed', r.unexpected.length + r.knownLatent.length, 0);

  // A stalled series lands on the UNEXPECTED roster.
  r = roster({ 'pork-belly': { points: [{ asOf: '2026-06-01' }] } }, opts());
  eq('stalled series is unexpected', r.unexpected.length, 1);
  eq('stalled series age', r.unexpected[0].age, 59);
  eq('stalled series counts down to the cliff', r.unexpected[0].cliffInDays, 61);

  // Age rounds to the nearest day, so a part-day offset never reports a stale
  // series as one day fresher than it is.
  eq('part-day age rounds up', ageDays('2026-06-01', Date.parse('2026-07-30T12:00:00Z')), 60);

  // A known-latent slug is separated, never counted as breakage.
  r = roster({ octopus: { points: [{ asOf: '2026-05-01' }] } }, opts());
  eq('known-latent is separated', r.knownLatent.length, 1);
  eq('known-latent is not unexpected', r.unexpected.length, 0);

  // Basket membership is surfaced, because it dates the published headline.
  r = roster({ 'vegetable-oil': { points: [{ asOf: '2026-06-01' }] } }, opts());
  eq('basket contributor flagged', r.unexpected[0].inBasket, true);

  // Past the cliff is reported, not hidden.
  r = roster({ squid: { points: [{ asOf: '2026-02-01' }] } }, opts());
  eq('past-cliff still listed', r.unexpected.length, 1);
  eq('past-cliff has a negative countdown', r.unexpected[0].cliffInDays < 0, true);

  // Sync's pointIssues uses fractional age > cliffDays (no Math.round). At exactly
  // 120.0d the point is still valid; Math.round + (<= 0) would have said PAST.
  r = roster({ boundary: { points: [{ asOf: '2026-04-01' }] } }, opts());
  eq('exact-cliff countdown is 0', r.unexpected[0].cliffInDays, 0);
  eq('exact-cliff is not past', r.unexpected[0].cliffInDays < 0, false);
  // ~119.7d rounds to 120 for display age, but must still count down (sync keeps it).
  r = roster({ boundary: { points: [{ asOf: '2026-04-01' }] } }, opts({ now: Date.parse('2026-07-29T16:48:00Z') }));
  eq('pre-cliff rounded boundary is not past', r.unexpected[0].cliffInDays < 0, false);
  eq('pre-cliff rounded boundary still counts down', r.unexpected[0].cliffInDays > 0, true);

  // An ingredient with no points is not a frozen feed (it is coverage in progress).
  eq('no points is not frozen', roster({ x: { points: [] } }, opts()).unexpected.length, 0);

  // Ordering is oldest-first so the roster reads as a queue.
  r = roster({
    a: { points: [{ asOf: '2026-06-01' }] },
    b: { points: [{ asOf: '2026-05-01' }] },
  }, opts());
  eq('roster is oldest-first', r.unexpected[0].slug, 'b');

  if (fails.length) {
    console.error(`✗ check-cost-index-series-freshness self-test: ${fails.length} failure(s):`);
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log('check-cost-index-series-freshness self-test: 20/20 assertions passed.');
  process.exit(0);
}

function main() {
  if (process.argv.includes('--self-test')) selfTest();
  const strict = process.argv.includes('--strict');

  const syncSrc = fs.readFileSync(path.join(repoRoot, 'scripts/check-cost-index-sync.mjs'), 'utf8');
  const cliffDays = parsePointStaleDays(syncSrc);
  if (cliffDays === null) {
    console.error('✗ check-cost-index-series-freshness: could not read POINT_STALE_DAYS from check-cost-index-sync.mjs.');
    console.error('  This gate counts down to that cliff; a guessed value would report a false deadline. Update parsePointStaleDays().');
    process.exit(1);
  }

  const maxAgeDays = Number(process.env.COST_INDEX_SERIES_MAX_AGE_DAYS || 45);
  const index = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index.json'), 'utf8'));
  const basket = new Set((index.basket?.contributors || []).map((c) => c.ingredient));
  const { unexpected, knownLatent, live } = roster(index.ingredients || {}, {
    maxAgeDays, cliffDays, now: Date.now(), knownLatent: KNOWN_SOURCE_LATENT, basket,
  });

  const total = live + unexpected.length + knownLatent.length;
  if (!unexpected.length && !knownLatent.length) {
    console.log(`cost-index series freshness: OK — all ${total} series have moved within ${maxAgeDays}d.`);
    process.exit(0);
  }

  if (unexpected.length) {
    const say = strict ? console.error : console.warn;
    say(`${strict ? '✗' : '⚠'} cost-index series freshness: ${unexpected.length} feed(s) STOPPED UPDATING and are not a known sourcing gap:`);
    for (const r of unexpected) say(line(r, cliffDays));
    say('  These were working. Re-source them, or move them into KNOWN_SOURCE_LATENT with a dated comment');
    say(`  if the source is genuinely gone — at the ${cliffDays}d cliff the builder drops the ingredient and orphans its page.`);
  }
  if (knownLatent.length) {
    console.warn(`⚠ cost-index series freshness: ${knownLatent.length} known-latent series frozen (documented no free wholesale source — a standing source-or-retire decision, not new breakage):`);
    for (const r of knownLatent) console.warn(line(r, cliffDays));
  }
  console.log(`cost-index series freshness: ${live} of ${total} series fresh within ${maxAgeDays}d; ${unexpected.length} unexpected, ${knownLatent.length} known-latent.`);

  if (strict && unexpected.length) process.exit(1);
  process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
