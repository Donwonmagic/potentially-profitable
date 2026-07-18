/**
 * build-ers-meat-chain.mjs — the protein price-chain layer (USDA ERS Meat Price Spreads).
 *
 * The documented NATIONAL-AVERAGE farm -> wholesale -> retail chain for beef, pork, and broilers: the
 * literal Source -> Market -> (consumer) chain the CHAIN presentation is built around (ADR-018). Each
 * value is a published national statistic in cents per pound of retail equivalent — the RETAIL figure is
 * national-average GROCERY retail per ERS, NEVER a delivered, wholesale-invoice, or menu price. The
 * honest headline the data carries: the farm->wholesale spread is small while the wholesale->retail
 * spread is large, so a kitchen buying near the wholesale rung sits far below the consumer markup — that
 * markup is downstream of the operator. Descriptive of the tracked ERS series, never a forecast.
 *
 * Input : data/ers-meat-price-spreads.jsonl   (rows {year, month, data_item, value, units})
 *          — USDA ERS Meat Price Spreads, public domain. Fetched on the operator's Mac.
 * Output: cost-index/meat-price-chain.json     (CC-BY packaging of a public-domain source)
 *
 * Deterministic (no build clock): dateModified = the latest year-month present.
 *
 * Usage:  node scripts/build-ers-meat-chain.mjs           # build
 *         node scripts/build-ers-meat-chain.mjs --check   # CI: rebuild & diff (exit 1 on drift)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const IN = 'data/ers-meat-price-spreads.jsonl';
const OUT = 'cost-index/meat-price-chain.json';

// protein config: the exact ERS Data_Item strings per chain rung + the slugs each protein serves.
const PROTEINS = [
  { id: 'beef', label: 'Choice beef', serves: ['ribeye', 'striploin', 'short-rib', 'beef-tenderloin', 'ground-beef'],
    items: {
      net_farm_value: 'Choice beef net farm value',
      wholesale_value: 'Choice beef wholesale value',
      retail_value: 'Choice beef retail value',
      farm_to_wholesale_spread: 'Choice beef farm to wholesale price spread',
      wholesale_to_retail_spread: 'Choice beef wholesale to retail price spread',
      farm_to_retail_spread: 'Choice beef farm to retail price spread',
    } },
  { id: 'pork', label: 'Pork', serves: ['pork-belly', 'pork-loin', 'pork-shoulder', 'bacon'],
    items: {
      net_farm_value: 'Pork net farm value',
      wholesale_value: 'Pork wholesale value',
      retail_value: 'Pork retail value',
      farm_to_wholesale_spread: 'Pork farm to wholesale price spread',
      wholesale_to_retail_spread: 'Pork Wholesale to retail price spread',
      farm_to_retail_spread: 'Pork farm to retail price spread',
    } },
  { id: 'broiler', label: 'Broiler chicken', serves: ['chicken-breast', 'chicken-thigh', 'whole-chicken'],
    items: {
      wholesale_value: 'Wholesale broiler composite',
      retail_value: 'Retail broiler composite',
      wholesale_to_retail_spread: 'Retail-wholesale spread for broiler composite',
    } },
];
// the rungs we carry a monthly series for (the explorer walks these)
const SERIES_RUNGS = ['net_farm_value', 'wholesale_value', 'retail_value'];

export function buildChain(rows) {
  // data_item -> Map("year-month" -> value), and a sortable list
  const byItem = new Map();
  for (const r of rows) {
    if (r.value == null || !r.year || !r.month) continue;
    if (!byItem.has(r.data_item)) byItem.set(r.data_item, []);
    byItem.get(r.data_item).push([Number(r.year), Number(r.month), Number(r.value)]);
  }
  for (const arr of byItem.values()) arr.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
  const ym = (y, m) => `${y}-${String(m).padStart(2, '0')}`;

  let latestKey = '';
  const proteins = PROTEINS.map((p) => {
    const chain = {}, series = {};
    let latest_year = null, latest_month = null;
    for (const [rung, item] of Object.entries(p.items)) {
      const arr = byItem.get(item);
      if (!arr || !arr.length) { chain[rung] = null; continue; }
      const [ly, lm, lv] = arr[arr.length - 1];
      chain[rung] = Math.round(lv * 100) / 100;
      if (latest_year == null || ly > latest_year || (ly === latest_year && lm > latest_month)) { latest_year = ly; latest_month = lm; }
      if (SERIES_RUNGS.includes(rung)) series[rung] = arr.map(([y, m, v]) => [ym(y, m), Math.round(v * 100) / 100]);
    }
    if (latest_year != null) { const k = ym(latest_year, latest_month); if (k > latestKey) latestKey = k; }
    // descriptive markup-share read: how much of the total farm->retail spread sits ABOVE wholesale
    // (i.e. downstream of where a kitchen buys). Pure arithmetic on the published spreads, no new claim.
    let downstream_markup_share = null;
    if (chain.wholesale_to_retail_spread != null && chain.farm_to_retail_spread > 0) {
      downstream_markup_share = Math.round((chain.wholesale_to_retail_spread / chain.farm_to_retail_spread) * 100);
    }
    return {
      id: p.id, label: p.label, serves: p.serves,
      unit: 'cents per pound of retail equivalent',
      source: 'USDA ERS — Meat Price Spreads (historical monthly)',
      latest_year, latest_month,
      chain,
      downstream_markup_share, // % of the farm->retail spread that is wholesale->retail (downstream of the buy)
      series,
    };
  });

  return {
    dataset: 'Muntin Cost Index — protein price chain (USDA ERS Meat Price Spreads)',
    url: 'https://muntin.digital/cost-index/',
    license: 'CC BY 4.0', license_url: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Muntin Cost Index (muntin.digital); underlying data USDA ERS (public domain)',
    note: "The documented NATIONAL-AVERAGE farm -> wholesale -> retail price chain for beef, pork, and broilers, in cents per pound of retail equivalent. Every value is a published ERS national statistic: net farm value, wholesale value, retail value, and the spreads between them. The RETAIL value is national-average GROCERY retail per ERS — it is NOT a delivered price, NOT a wholesale-invoice price, and NOT a menu price. The honest reading the data carries: the farm->wholesale spread is small and the wholesale->retail spread is large (downstream_markup_share), so a kitchen buying near the wholesale rung sits well below the consumer retail figure — that markup is downstream of the operator. Descriptive of the tracked ERS series — it is not a forecast.",
    dateModified: latestKey || null,
    proteins,
  };
}

function run() {
  let rows;
  try { rows = fs.readFileSync(path.join(repoRoot, IN), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); }
  catch (e) { console.error(`build-ers-meat-chain: cannot read ${IN}: ${e.message}`); process.exit(1); }
  const out = JSON.stringify(buildChain(rows), null, 2) + '\n';
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(path.join(repoRoot, OUT)) ? fs.readFileSync(path.join(repoRoot, OUT), 'utf8') : '';
    if (cur !== out) { console.error(`DRIFT: ${OUT} is stale — run: node scripts/build-ers-meat-chain.mjs`); process.exit(1); }
    console.log(`meat-price-chain: OK — ${JSON.parse(out).proteins.length} proteins in sync.`);
  } else {
    fs.writeFileSync(path.join(repoRoot, OUT), out);
    const b = JSON.parse(out);
    console.log(`Wrote ${OUT}: ${b.proteins.length} proteins (latest ${b.dateModified}). ${b.proteins.map((p) => p.label + ' whlsl→retail ' + p.downstream_markup_share + '% of the spread').join('; ')}.`);
  }
}
if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) run();
