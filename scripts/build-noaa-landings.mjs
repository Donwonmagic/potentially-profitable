/**
 * build-noaa-landings.mjs — the US Domestic Wild-Landings layer (NOAA FOSS).
 *
 * The domestic pair for the seafood IMPORT streams already in the corpus: US COMMERCIAL WILD landings
 * (value $ + pounds) by species group, so a seafood ingredient can carry an import-vs-domestic read the
 * way a crop carries import-vs-NASS-production reliance. But this is a WILD-CATCH domestic figure set
 * beside a largely-AQUACULTURE import stream — a chain seam this artifact NAMES per group and never
 * collapses into a clean apparent-consumption share. Value is nominal, never a delivered/retail price;
 * pounds are round/live-weight landings, never edible yield; confidential state-species rows are withheld
 * by NOAA and degrade the sum by ABSENCE, never zero-padded. Descriptive, never a forecast.
 *
 * Input : data/noaa-landings.jsonl        (rows: {year, ts_afs_name, tsn, state_name, region_name, dollars, pounds, collection})
 *          data/ingredient-noaa-codes.json (categories[] with prefix/include/exclude/serves/wild_note)
 *          — NOAA Fisheries FOSS, public domain. Fetched on the operator's Mac.
 * Output: cost-index/noaa-landings-domestic.json  (CC-BY packaging of a public-domain source)
 *
 * Deterministic (no build clock): dateModified = the latest landings year present across the groups.
 *
 * Usage:  node scripts/build-noaa-landings.mjs           # build
 *         node scripts/build-noaa-landings.mjs --check   # CI: rebuild & diff (exit 1 on drift)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const IN = 'data/noaa-landings.jsonl';
const XWALK = 'data/ingredient-noaa-codes.json';
const OUT = 'cost-index/noaa-landings-domestic.json';
const MINIMAL_USD = 5_000_000; // below this latest-year wild value, the domestic wild fishery is negligible vs a farmed/imported menu supply

// Resolve a category's species set from the raw rows per the match rules (prefix, then include-whitelist or exclude).
function matchRows(rows, cat) {
  const inc = cat.include ? new Set(cat.include) : null;
  const exc = cat.exclude ? new Set(cat.exclude) : null;
  return rows.filter((r) => {
    const n = r.ts_afs_name || '';
    if (!n.startsWith(cat.prefix)) return false;
    if (inc) return inc.has(n);
    if (exc && exc.has(n)) return false;
    return true;
  });
}

export function buildLandings(rows, xwalk) {
  const cats = xwalk.categories || [];
  const groups = [];
  let latestYearAll = 0;

  for (const cat of cats) {
    const mine = matchRows(rows, cat);
    // national sum by year: dollars (null excluded from $ sum), pounds, row + null tallies
    const byYear = new Map();
    for (const r of mine) {
      const y = Number(r.year);
      if (!Number.isFinite(y)) continue;
      if (!byYear.has(y)) byYear.set(y, { usd: 0, lb: 0, rows: 0, usdNull: 0, hasUsd: false });
      const g = byYear.get(y);
      g.rows++;
      if (r.dollars == null) g.usdNull++;
      else { g.usd += Number(r.dollars) || 0; g.hasUsd = true; }
      g.lb += Number(r.pounds) || 0;
    }
    const years = [...byYear.keys()].sort((a, b) => a - b);
    if (!years.length) { groups.push({ id: cat.id, label: cat.label, serves: cat.serves || [], species_matched: [], available: false, wild_note: cat.wild_note || null }); continue; }

    const latestYear = years[years.length - 1];
    const latest = byYear.get(latestYear);
    if (latestYear > latestYearAll) latestYearAll = latestYear;
    // trailing 5 years that have a $ value, for a stability read
    const yearsWithUsd = years.filter((y) => byYear.get(y).hasUsd);
    const last5 = yearsWithUsd.slice(-5);
    const avg5 = last5.length ? Math.round(last5.reduce((a, y) => a + byYear.get(y).usd, 0) / last5.length) : null;
    const species = [...new Set(mine.map((r) => r.ts_afs_name))].sort();

    groups.push({
      id: cat.id,
      label: cat.label,
      serves: cat.serves || [],
      species_matched: species,
      species_count: species.length,
      unit_value: 'USD (nominal ex-vessel landings value)',
      unit_weight: 'pounds (round/live weight landed)',
      source: 'NOAA Fisheries FOSS — commercial landings (collection=Commercial), summed across states to national',
      latest_year: latestYear,
      landings_usd: latest.hasUsd ? Math.round(latest.usd) : null,
      landings_lb: Math.round(latest.lb),
      landings_5yr_avg_usd: avg5,
      confidential_rows_latest: latest.usdNull,
      domestic_wild_minimal: latest.hasUsd ? latest.usd < MINIMAL_USD : true,
      span: years[0] + '..' + latestYear,
      wild_note: cat.wild_note || null,
      // full national series for the explorer: [year, usd] for years that carry a $ value, oldest -> newest
      series: yearsWithUsd.map((y) => [y, Math.round(byYear.get(y).usd)]),
    });
  }

  return {
    dataset: 'Muntin Cost Index — US Domestic Wild-Landings (NOAA FOSS)',
    url: 'https://muntin.digital/cost-index/',
    license: 'CC BY 4.0', license_url: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Muntin Cost Index (muntin.digital); underlying data NOAA Fisheries FOSS (public domain)',
    note: "US COMMERCIAL WILD landings (value + pounds) by seafood species group, summed to national. This is the domestic pair for each seafood import stream — but a WILD-CATCH domestic figure set beside a largely-FARMED import stream, so it is NOT a like-for-like apparent-consumption share: the wild-vs-farmed seam is named per group and, where the US wild fishery is negligible (octopus, mahi, trout), domestic_wild_minimal flags it. Value is nominal ex-vessel landings dollars, never a delivered or retail price; pounds are round/live weight landed, never edible yield. Confidential state-species rows are withheld by NOAA and degrade the sum by ABSENCE, never zero-padded. Descriptive of the landings record — it is not a forecast.",
    dateModified: latestYearAll ? String(latestYearAll) : null,
    groups,
  };
}

function run() {
  let rows, xwalk;
  try { rows = fs.readFileSync(path.join(repoRoot, IN), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); }
  catch (e) { console.error(`build-noaa-landings: cannot read ${IN}: ${e.message}`); process.exit(1); }
  try { xwalk = JSON.parse(fs.readFileSync(path.join(repoRoot, XWALK), 'utf8')); }
  catch (e) { console.error(`build-noaa-landings: cannot read ${XWALK}: ${e.message}`); process.exit(1); }
  const out = JSON.stringify(buildLandings(rows, xwalk), null, 2) + '\n';
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(path.join(repoRoot, OUT)) ? fs.readFileSync(path.join(repoRoot, OUT), 'utf8') : '';
    if (cur !== out) { console.error(`DRIFT: ${OUT} is stale — run: node scripts/build-noaa-landings.mjs`); process.exit(1); }
    console.log(`noaa-landings: OK — ${JSON.parse(out).groups.length} groups in sync.`);
  } else {
    fs.writeFileSync(path.join(repoRoot, OUT), out);
    const b = JSON.parse(out);
    const live = b.groups.filter((g) => g.landings_usd != null);
    console.log(`Wrote ${OUT}: ${b.groups.length} groups (${live.length} with a $ value). Top: ${live.sort((a, c) => c.landings_usd - a.landings_usd).slice(0, 4).map((g) => g.label + ' $' + (g.landings_usd / 1e6).toFixed(0) + 'M').join(', ')}.`);
  }
}
if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) run();
