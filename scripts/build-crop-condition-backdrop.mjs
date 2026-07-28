/**
 * build-crop-condition-backdrop.mjs — the Crop-Condition Backdrop.
 *
 * A COINCIDENT, SITE-WIDE backdrop: the observed health of the US corn and soybean crop — the feed
 * complex that stands behind the animal-protein and dairy complex. It is descriptive context, read only
 * against each crop's OWN same-week history across prior years. Parallel to the Energy Backdrop and bound
 * by the same discipline (ADR-013): it is an OBSERVED present-state rating, NEVER a forecast of yield or
 * price, NEVER a driver of any tracked food price, and NEVER a per-ingredient link. The artifact carries
 * no ingredient reference at all — only the two feed crops — and the honesty gate enforces that.
 *
 * The read is the standard USDA "good-to-excellent" share (PCT GOOD + PCT EXCELLENT) — the number the
 * trade watches — placed against the same week of the season in prior years (percentile + band).
 *
 * Input : data/nass-crop-condition.jsonl  (one line per class-week:
 *          {crop, year, period:"WEEK #NN", week_ending, unit:"PCT GOOD"|..., value})
 *          — USDA NASS QuickStats (SURVEY), public domain. Fetched on the operator's Mac.
 * Output: cost-index/crop-condition-backdrop.json  (CC-BY packaging of a public-domain source)
 *
 * Deterministic (no build clock): dateModified = the latest week_ending present across the crops.
 *
 * Usage:  node scripts/build-crop-condition-backdrop.mjs           # build
 *         node scripts/build-crop-condition-backdrop.mjs --check   # CI: rebuild & diff (exit 1 on drift)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const IN = 'data/nass-crop-condition.jsonl';
const OUT = 'cost-index/crop-condition-backdrop.json';

// The two feed crops this backdrop covers. A whitelist by construction: nothing but these can appear,
// so a tracked ingredient can never sneak in as a "crop".
const TITLE = { CORN: 'Corn', SOYBEANS: 'Soybeans' };
const ROLE = {
  CORN: 'the primary US feed grain behind the animal-protein and dairy complex',
  SOYBEANS: 'the primary US protein meal behind the animal-protein and dairy complex',
};
const MIN_SAME_WEEK = 5; // need this many prior years at the same week to place a percentile

// unit_desc -> the five condition classes
const CLASS = {
  'PCT VERY POOR': 'very_poor', 'PCT POOR': 'poor', 'PCT FAIR': 'fair',
  'PCT GOOD': 'good', 'PCT EXCELLENT': 'excellent',
};

function weekNum(period) {
  const m = /#\s*(\d+)/.exec(String(period || ''));
  return m ? Number(m[1]) : null;
}

function bandLabel(pctile) {
  if (pctile == null) return 'limited same-week history';
  if (pctile >= 80) return 'well above the typical rating for this week of the season';
  if (pctile >= 60) return 'above the typical rating for this week of the season';
  if (pctile > 40) return 'near the typical rating for this week of the season';
  if (pctile > 20) return 'below the typical rating for this week of the season';
  return 'well below the typical rating for this week of the season';
}

export function buildBackdrop(rows) {
  // index: crop -> "year|week" -> { classes:{}, week_ending }
  const idx = new Map();
  for (const r of rows) {
    const crop = String(r.crop || '').toUpperCase();
    if (!TITLE[crop]) continue;
    const wk = weekNum(r.period);
    const cls = CLASS[String(r.unit || '').toUpperCase().trim()];
    if (wk == null || !cls) continue;
    const val = Number(String(r.value).replace(/,/g, ''));
    if (!Number.isFinite(val)) continue;
    const key = `${r.year}|${wk}`;
    if (!idx.has(crop)) idx.set(crop, new Map());
    const cm = idx.get(crop);
    if (!cm.has(key)) cm.set(key, { year: Number(r.year), week: wk, classes: {}, week_ending: r.week_ending || '' });
    const cell = cm.get(key);
    cell.classes[cls] = val;
    if (r.week_ending && (!cell.week_ending || r.week_ending > cell.week_ending)) cell.week_ending = r.week_ending;
  }

  const complete = (c) => c && ['very_poor', 'poor', 'fair', 'good', 'excellent'].every((k) => c[k] != null);
  const goodPlus = (c) => Math.round((c.good + c.excellent) * 10) / 10;

  const crops = [];
  let latestEnding = '';
  for (const crop of Object.keys(TITLE)) {
    const cm = idx.get(crop);
    if (!cm) continue;
    const weeks = [...cm.values()].filter((w) => complete(w.classes));
    if (!weeks.length) continue;
    weeks.sort((a, b) => (a.year - b.year) || (a.week - b.week));

    const latestYear = Math.max(...weeks.map((w) => w.year));
    const season = weeks.filter((w) => w.year === latestYear);
    const asOf = season[season.length - 1]; // latest complete week of the latest season
    const asOfGP = goodPlus(asOf.classes);

    // same-week distribution across PRIOR seasons only (never the current season)
    const sameWeek = weeks.filter((w) => w.week === asOf.week && w.year < latestYear).map((w) => goodPlus(w.classes));
    let percentile = null, sameAvg = null, vsAvg = null;
    if (sameWeek.length >= MIN_SAME_WEEK) {
      percentile = Math.round((sameWeek.filter((v) => v <= asOfGP).length / sameWeek.length) * 100);
      sameAvg = Math.round((sameWeek.reduce((a, b) => a + b, 0) / sameWeek.length) * 10) / 10;
      vsAvg = Math.round((asOfGP - sameAvg) * 10) / 10;
    }
    if (asOf.week_ending && asOf.week_ending > latestEnding) latestEnding = asOf.week_ending;

    crops.push({
      key: crop.toLowerCase(),
      title: TITLE[crop],
      role: ROLE[crop],
      unit: 'pct of crop rated good-to-excellent',
      source: 'USDA NASS QuickStats — Crop Progress (SURVEY, NATIONAL, CONDITION)',
      season_year: latestYear,
      as_of_week: asOf.week,
      as_of_week_label: `WEEK #${asOf.week}`,
      as_of_week_ending: asOf.week_ending || null,
      classes: {
        very_poor: asOf.classes.very_poor, poor: asOf.classes.poor, fair: asOf.classes.fair,
        good: asOf.classes.good, excellent: asOf.classes.excellent,
      },
      good_excellent_pct: asOfGP,
      same_week_percentile: percentile,
      same_week_n: sameWeek.length,
      same_week_avg_pct: sameAvg,
      vs_same_week_avg_pts: vsAvg,
      band: bandLabel(percentile),
      span: weeks[0].year + '..' + latestYear,
      // full history for the explorer: one point per complete week, oldest -> newest
      series: weeks.map((w) => [`${w.year}-W${String(w.week).padStart(2, '0')}`, goodPlus(w.classes)]),
    });
  }

  return {
    dataset: 'Muntin Cost Index — Crop-Condition Backdrop',
    url: 'https://muntin.digital/cost-index/',
    license: 'CC BY 4.0', license_url: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Muntin Cost Index (muntin.digital); underlying data USDA NASS (public domain)',
    note: "A coincident, site-wide backdrop — the observed health of the US corn and soybean crop, the feed complex that stands behind the animal-protein and dairy complex broadly. Each crop's latest good-to-excellent share is read only against its OWN same-week history in prior seasons (percentile, band) — descriptive of the published condition series. This is an OBSERVED present-state rating, NOT a forecast of yield or price; it is NOT a driver of any tracked food price, NOT a measured link to a single ingredient, and it carries no ingredient reference. The feed complex stands behind animal protein and dairy in general, but no single ingredient's price is attributed to it here. Underlying series are USDA NASS, public domain.",
    dateModified: latestEnding || null,
    crops,
  };
}

function run() {
  let rows;
  try { rows = fs.readFileSync(path.join(repoRoot, IN), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); }
  catch (e) { console.error(`build-crop-condition-backdrop: cannot read ${IN}: ${e.message}`); process.exit(1); }
  const out = JSON.stringify(buildBackdrop(rows), null, 2) + '\n';
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(path.join(repoRoot, OUT)) ? fs.readFileSync(path.join(repoRoot, OUT), 'utf8') : '';
    if (cur !== out) { console.error(`DRIFT: ${OUT} is stale — run: node scripts/build-crop-condition-backdrop.mjs`); process.exit(1); }
    console.log(`crop-condition-backdrop: OK — ${JSON.parse(out).crops.length} crops in sync.`);
  } else {
    fs.writeFileSync(path.join(repoRoot, OUT), out);
    const b = JSON.parse(out);
    console.log(`Wrote ${OUT}: ${b.crops.length} crops (${b.crops.map((c) => c.title + ' ' + c.good_excellent_pct + '% G/E, ' + c.band.split(' ').slice(0, 2).join(' ')).join('; ')}).`);
  }
}
if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) run();
