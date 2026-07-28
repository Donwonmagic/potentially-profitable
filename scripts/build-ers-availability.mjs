/**
 * build-ers-availability.mjs — the US per-capita food-availability layer (USDA ERS).
 *
 * The VOLUME cross-check for the value-based reliance seam: how many pounds per person per year of a
 * commodity are AVAILABLE domestically (ERS's supply-side proxy — production + imports − exports − non-
 * food/loss uses). It is descriptive of the tracked ERS series, NEVER a measured intake, NEVER a price,
 * NEVER a forecast. Per-capita availability is published at the COMMODITY level, so a variety or cut
 * carries its parent commodity's figure (scope=commodity), labeled as the commodity per-capita.
 *
 * Input : data/ers-food-availability.jsonl        (rows {group, commodity, year, attribute, value})
 *          data/ingredient-ers-codes.json          (attributes per group + map slug -> {group, commodity, attribute?, scope})
 *          — USDA ERS, public domain. Fetched on the operator's Mac.
 * Output: cost-index/ers-food-availability.json    (CC-BY packaging of a public-domain source)
 *
 * Deterministic (no build clock): dateModified = latest year present across the mapped series.
 *
 * Usage:  node scripts/build-ers-availability.mjs           # build
 *         node scripts/build-ers-availability.mjs --check   # CI: rebuild & diff (exit 1 on drift)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const IN = 'data/ers-food-availability.jsonl';
const XWALK = 'data/ingredient-ers-codes.json';
const OUT = 'cost-index/ers-food-availability.json';

export function buildAvailability(rows, xwalk) {
  const ATTR = xwalk.attributes || {};
  const map = xwalk.map || {};
  // index (group|commodity|attribute) -> [{year,value}] for fast lookup
  const idx = new Map();
  for (const r of rows) {
    if (r.value == null) continue;
    const key = `${r.group}|${r.commodity}|${r.attribute}`;
    if (!idx.has(key)) idx.set(key, []);
    idx.get(key).push([Number(r.year), Number(r.value)]);
  }
  const items = [];
  let latestAll = 0;
  for (const [slug, m] of Object.entries(map)) {
    const attr = m.attribute || ATTR[m.group];
    const series = (idx.get(`${m.group}|${m.commodity}|${attr}`) || [])
      .filter(([y, v]) => Number.isFinite(y) && Number.isFinite(v) && y >= 1900 && y <= 2030)
      .sort((a, b) => a[0] - b[0]);
    if (!series.length) continue;
    const [ly, lv] = series[series.length - 1];
    if (ly > latestAll) latestAll = ly;
    items.push({
      slug,
      group: m.group,
      commodity: m.commodity.replace(/: Supply and use.*/, '').replace(/^Fresh /, ''),
      ers_commodity: m.commodity,
      scope: m.scope || 'commodity',
      unit: 'pounds per capita per year',
      source: 'USDA ERS Food Availability (Per Capita) Data System',
      percap_lbs: Math.round(lv * 100) / 100,
      latest_year: ly,
      span: series[0][0] + '..' + ly,
      series: series.map(([y, v]) => [y, Math.round(v * 100) / 100]),
    });
  }
  items.sort((a, b) => a.slug.localeCompare(b.slug));
  return {
    dataset: 'Muntin Cost Index — US per-capita food availability (USDA ERS)',
    url: 'https://muntin.digital/cost-index/',
    license: 'CC BY 4.0', license_url: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Muntin Cost Index (muntin.digital); underlying data USDA ERS (public domain)',
    note: "Per-capita food availability (pounds per person per year) from USDA ERS, mapped to tracked ingredients. This is a national supply-side PROXY for consumption (ERS: production + imports − exports − non-food/loss uses), NOT a measured intake, NOT a price, and NOT a forecast. Availability is published at the COMMODITY level, so a variety or cut carries its parent commodity's per-capita figure (scope=commodity), never a per-cut number. It is the VOLUME companion to the value-based reliance read — how many pounds per person are available domestically, beside how much of the value is imported. Underlying series are USDA ERS, public domain.",
    dateModified: latestAll ? String(latestAll) : null,
    items,
  };
}

function run() {
  let rows, xwalk;
  try { rows = fs.readFileSync(path.join(repoRoot, IN), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); }
  catch (e) { console.error(`build-ers-availability: cannot read ${IN}: ${e.message}`); process.exit(1); }
  try { xwalk = JSON.parse(fs.readFileSync(path.join(repoRoot, XWALK), 'utf8')); }
  catch (e) { console.error(`build-ers-availability: cannot read ${XWALK}: ${e.message}`); process.exit(1); }
  const out = JSON.stringify(buildAvailability(rows, xwalk), null, 2) + '\n';
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(path.join(repoRoot, OUT)) ? fs.readFileSync(path.join(repoRoot, OUT), 'utf8') : '';
    if (cur !== out) { console.error(`DRIFT: ${OUT} is stale — run: node scripts/build-ers-availability.mjs`); process.exit(1); }
    console.log(`ers-availability: OK — ${JSON.parse(out).items.length} items in sync.`);
  } else {
    fs.writeFileSync(path.join(repoRoot, OUT), out);
    const b = JSON.parse(out);
    console.log(`Wrote ${OUT}: ${b.items.length} items (latest ${b.dateModified}). e.g. ${b.items.slice(0, 3).map((i) => i.slug + ' ' + i.percap_lbs + 'lb').join(', ')}.`);
  }
}
if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) run();
