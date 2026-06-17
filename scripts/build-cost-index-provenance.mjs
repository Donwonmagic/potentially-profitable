#!/usr/bin/env node
/**
 * build-cost-index-provenance.mjs — emit /cost-index/sources.json, the public,
 * machine-readable provenance registry for the Muntin Cost Index.
 *
 * The method (principles, cadence, the measured/derived/absent spine) is
 * documented for humans at /cost-index/methodology/. This file is the
 * complement methodology can't carry without bloating: the "exactly which
 * public report backs each published number" registry — every PUBLISHED
 * ingredient mapped to the U.S. government data series behind it, by report
 * identifier.
 *
 * The published set is taken from cost-index/index.json (the whole-index
 * aggregate, which already applies the canonical shippable() bar), so the
 * provenance registry covers exactly the readings on the site — no staged or
 * unpublished ingredient leaks in. Source identifiers come from
 * data/cost-index-sources.json (the same config the fetch pipeline reads), so
 * the registry can never drift from the pipeline's actual sources. Pairs with
 * /cost-index/index.json (current readings) — this is their provenance.
 *
 *   node scripts/build-cost-index-provenance.mjs           # write the file
 *   node scripts/build-cost-index-provenance.mjs --check   # exit 1 if stale
 *
 * Idempotent; its --check is wired into check-all as the freshness gate.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');

const read = (p) => JSON.parse(fs.readFileSync(path.join(repoRoot, p), 'utf8'));
const SRC    = read('data/cost-index-sources.json');
const labels = read('data/cost-index-labels.json').labels || {};
const ci     = read('data/cost-index.json');
const agg    = read('cost-index/index.json'); // the published set (shippable())

// Public agency landing pages — credited by name + report identifier, not
// deep-linked (MyMarketNews / series-viewer URLs change; the agency page + the
// id is the stable, verifiable citation, the same posture methodology takes).
const AGENCY = {
  lmr:  { name: 'USDA Livestock, Poultry & Grain Market News', url: 'https://www.ams.usda.gov/market-news/livestock-poultry-grain' },
  ams:  { name: 'USDA AMS Market News (terminal markets)',     url: 'https://www.ams.usda.gov/market-news' },
  bls:  { name: 'U.S. Bureau of Labor Statistics (PPI)',       url: 'https://www.bls.gov/ppi/' },
  fred: { name: 'FRED, Federal Reserve Bank of St. Louis',     url: 'https://fred.stlouisfed.org/' },
  eia:  { name: 'U.S. Energy Information Administration',       url: 'https://www.eia.gov/' },
  noaa: { name: 'NOAA Fisheries',                              url: 'https://www.fisheries.noaa.gov/' },
};

// A report-id source can be a single object (one report) or an array of
// terminal-market reports (produce, sampled across markets). Collapse arrays to
// the distinct report ids + markets behind the reading.
function reportIdSource(v, agency) {
  if (!v) return null;
  if (Array.isArray(v)) {
    const reportIds = [...new Set(v.filter((a) => a && a.reportId).map((a) => String(a.reportId)))];
    const markets   = [...new Set(v.filter((a) => a && a.market).map((a) => a.market))];
    if (!reportIds.length) return null;
    return { agency: agency.name, reportIds, ...(markets.length ? { markets } : {}), url: agency.url };
  }
  return v.reportId ? { agency: agency.name, reportId: String(v.reportId), url: agency.url } : null;
}

function sourcesFor(e) {
  const out = [];
  const lmr = reportIdSource(e.lmr, AGENCY.lmr); if (lmr) out.push(lmr);
  const ams = reportIdSource(e.ams, AGENCY.ams); if (ams) out.push(ams);
  if (e.bls  && e.bls.seriesId)  out.push({ agency: AGENCY.bls.name,  seriesId: e.bls.seriesId,  url: AGENCY.bls.url });
  if (e.fred && e.fred.seriesId) out.push({ agency: AGENCY.fred.name, seriesId: e.fred.seriesId, url: AGENCY.fred.url });
  if (e.eia  && e.eia.seriesId)  out.push({ agency: AGENCY.eia.name,  seriesId: e.eia.seriesId,  url: AGENCY.eia.url });
  if (e.noaa)                    out.push({ agency: AGENCY.noaa.name, url: AGENCY.noaa.url });
  return out;
}

const ingredients = (agg.ingredients || [])
  .map((x) => x.slug)
  .filter((slug) => SRC.ingredients && SRC.ingredients[slug])
  .map((slug) => ({ slug, name: (labels[slug] && labels[slug].en) || slug, sources: sourcesFor(SRC.ingredients[slug]) }))
  .filter((x) => x.sources.length);

const payload = {
  name: 'Muntin Restaurant Cost Index — source provenance',
  description: 'Per-ingredient provenance for the Cost Index: every published reading mapped to the public U.S. government data series behind it, by report identifier. Method: https://muntin.digital/cost-index/methodology/. Public-domain inputs; estimates and gaps are labeled on the index itself.',
  license: 'https://creativecommons.org/publicdomain/zero/1.0/',
  methodology: 'https://muntin.digital/cost-index/methodology/',
  index: 'https://muntin.digital/cost-index/',
  data: 'https://muntin.digital/cost-index/index.json',
  lastReviewed: ci._lastReviewed || null,
  count: ingredients.length,
  ingredients,
};

const out  = JSON.stringify(payload, null, 2) + '\n';
const fp   = path.join(repoRoot, 'cost-index', 'sources.json');
const prev = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : null;

if (out === prev) {
  console.log(`cost-index provenance: in sync (${ingredients.length} ingredients).`);
  process.exit(0);
}
if (checkOnly) {
  console.error('cost-index provenance: cost-index/sources.json is stale — run: node scripts/build-cost-index-provenance.mjs');
  process.exit(1);
}
fs.writeFileSync(fp, out);
console.log(`cost-index provenance: wrote cost-index/sources.json (${ingredients.length} ingredients).`);
