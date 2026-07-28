/**
 * build-ers-food-dollar.mjs — the Food Dollar layer (USDA ERS Food Dollar Series).
 *
 * The sitewide MACRO bookend to the per-protein meat chain: how each dollar Americans spend on
 * domestically-produced food splits across the marketing chain. The FARM SHARE is the cents of each food
 * dollar attributable to farm production; the rest is the marketing chain (processing, packaging,
 * transport, wholesale, retail, foodservices, energy, …). A NATIONAL published statistic — never a
 * per-ingredient claim, never the operator's own cost structure, never a forecast.
 *
 * Input : data/ers-food-dollar.jsonl   (rows {table, category, year, cents, units})
 *          — USDA ERS Food Dollar Series (2011 model, nominal), public domain. Fetched on the Mac.
 * Output: cost-index/food-dollar.json   (CC-BY packaging of a public-domain source)
 *
 * Deterministic (no build clock): dateModified = the latest year present.
 *
 * Usage:  node scripts/build-ers-food-dollar.mjs           # build
 *         node scripts/build-ers-food-dollar.mjs --check   # CI: rebuild & diff (exit 1 on drift)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const IN = 'data/ers-food-dollar.jsonl';
const OUT = 'cost-index/food-dollar.json';

// the 12 industry-group components that partition the food dollar (sum to 100); the aggregates below
// are NOT components and are excluded from the split.
const AGGREGATES = new Set(['Total', 'Total food dollar', 'Domestic food dollar', 'Farm share']);

export function buildFoodDollar(rows) {
  // keep only the normalized cents-per-food-dollar rows of the "Food dollar" table
  const cents = rows.filter((r) => /cents per domestic food dollar/i.test(r.units || '') && r.table === 'Food dollar' && r.cents != null);
  const years = [...new Set(cents.map((r) => Number(r.year)))].filter((y) => y >= 1900 && y <= 2030).sort((a, b) => a - b);
  if (!years.length) return { dataset: 'Muntin Cost Index — Food Dollar', proteins: [], years: [] };
  const latest = years[years.length - 1];
  const at = (cat, y) => { const r = cents.find((x) => x.category === cat && Number(x.year) === y); return r ? Math.round(r.cents * 10) / 10 : null; };

  const farm_share_series = years.map((y) => [y, at('Farm share', y)]).filter((p) => p[1] != null);
  const components = [...new Set(cents.map((r) => r.category))].filter((c) => !AGGREGATES.has(c));
  const chain_split = components.map((c) => ({ component: c, cents: at(c, latest) }))
    .filter((x) => x.cents != null).sort((a, b) => b.cents - a.cents);
  const chain_split_series = {};
  for (const c of components) chain_split_series[c] = years.map((y) => [y, at(c, y)]).filter((p) => p[1] != null);

  return {
    dataset: 'Muntin Cost Index — the Food Dollar (USDA ERS)',
    url: 'https://muntin.digital/cost-index/',
    license: 'CC BY 4.0', license_url: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Muntin Cost Index (muntin.digital); underlying data USDA ERS (public domain)',
    note: "The USDA ERS Food Dollar Series: how each dollar Americans spend on domestically-produced food splits across the marketing chain, in cents per domestic food dollar. The FARM SHARE is the cents of each food dollar attributable to farm production; the rest is the marketing chain (processing, packaging, transport, wholesale, retail, foodservices, energy, finance, advertising). This is a NATIONAL macro statistic — it is not a per-ingredient claim, not the operator's own cost structure, and not a forecast. It is the sitewide bookend to the per-protein farm→wholesale→retail chain: the markup is real, documented, and mostly downstream of the farm.",
    dateModified: String(latest),
    latest_year: latest,
    farm_share_cents: at('Farm share', latest),
    farm_share_series,
    chain_split, // the 12 industry-group components at the latest year (sum ~100)
    chain_split_series,
  };
}

function run() {
  let rows;
  try { rows = fs.readFileSync(path.join(repoRoot, IN), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); }
  catch (e) { console.error(`build-ers-food-dollar: cannot read ${IN}: ${e.message}`); process.exit(1); }
  const out = JSON.stringify(buildFoodDollar(rows), null, 2) + '\n';
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(path.join(repoRoot, OUT)) ? fs.readFileSync(path.join(repoRoot, OUT), 'utf8') : '';
    if (cur !== out) { console.error(`DRIFT: ${OUT} is stale — run: node scripts/build-ers-food-dollar.mjs`); process.exit(1); }
    console.log(`food-dollar: OK — farm share ${JSON.parse(out).farm_share_cents}c in sync.`);
  } else {
    fs.writeFileSync(path.join(repoRoot, OUT), out);
    const b = JSON.parse(out);
    console.log(`Wrote ${OUT}: farm share ${b.farm_share_cents}c of the ${b.latest_year} food dollar; ${b.chain_split.length} chain components.`);
  }
}
if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) run();
