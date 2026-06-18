#!/usr/bin/env node
/**
 * build-cost-index-provenance.mjs — the Cost Index source-provenance registry,
 * in two synchronized surfaces, both generated from the same data:
 *
 *   1. /cost-index/sources.json — machine-readable: every published reading
 *      mapped to the public U.S. government series behind it, by report id.
 *   2. /cost-index/sources/ (+ /es/) — the human-browsable registry table,
 *      stamped between <!-- ci-sources:start --> / <!-- ci-sources:end -->.
 *
 * The method (principles, cadence, the measured/derived/absent spine) is
 * documented for humans at /cost-index/methodology/; this is the "exactly which
 * public report backs each published number" registry methodology can't carry
 * without bloating.
 *
 * The published set is taken from cost-index/index.json (the whole-index
 * aggregate, which already applies the canonical shippable() bar), so the
 * registry covers exactly the readings on the site. Identifiers come from
 * data/cost-index-sources.json (the config the fetch pipeline reads), so the
 * registry can never drift from the pipeline's actual sources.
 *
 *   node scripts/build-cost-index-provenance.mjs           # write all surfaces
 *   node scripts/build-cost-index-provenance.mjs --check   # exit 1 if any stale
 *
 * Idempotent; its --check is wired into check-all.
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
const agg    = read('cost-index/index.json');

const AGENCY = {
  lmr:  { name: 'USDA Livestock, Poultry & Grain Market News', short: 'USDA LMR',  url: 'https://www.ams.usda.gov/market-news/livestock-poultry-grain' },
  ams:  { name: 'USDA AMS Market News (terminal markets)',     short: 'USDA AMS',  url: 'https://www.ams.usda.gov/market-news' },
  bls:  { name: 'U.S. Bureau of Labor Statistics (PPI)',       short: 'BLS',       url: 'https://www.bls.gov/ppi/' },
  fred: { name: 'FRED, Federal Reserve Bank of St. Louis',     short: 'FRED',      url: 'https://fred.stlouisfed.org/' },
  eia:  { name: 'U.S. Energy Information Administration',       short: 'EIA',       url: 'https://www.eia.gov/' },
  noaa: { name: 'NOAA Fisheries',                              short: 'NOAA',      url: 'https://www.fisheries.noaa.gov/' },
};
const escHtml = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function reportIdSource(v, agency) {
  if (!v) return null;
  if (Array.isArray(v)) {
    const reportIds = [...new Set(v.filter((a) => a && a.reportId).map((a) => String(a.reportId)))];
    const markets   = [...new Set(v.filter((a) => a && a.market).map((a) => a.market))];
    if (!reportIds.length) return null;
    return { agency: agency.name, short: agency.short, reportIds, ...(markets.length ? { markets } : {}), url: agency.url };
  }
  return v.reportId ? { agency: agency.name, short: agency.short, reportId: String(v.reportId), url: agency.url } : null;
}
function sourcesFor(e) {
  const out = [];
  const lmr = reportIdSource(e.lmr, AGENCY.lmr); if (lmr) out.push(lmr);
  const ams = reportIdSource(e.ams, AGENCY.ams); if (ams) out.push(ams);
  if (e.bls  && e.bls.seriesId)  out.push({ agency: AGENCY.bls.name,  short: AGENCY.bls.short,  seriesId: e.bls.seriesId,  url: AGENCY.bls.url });
  if (e.fred && e.fred.seriesId) out.push({ agency: AGENCY.fred.name, short: AGENCY.fred.short, seriesId: e.fred.seriesId, url: AGENCY.fred.url });
  if (e.eia  && e.eia.seriesId)  out.push({ agency: AGENCY.eia.name,  short: AGENCY.eia.short,  seriesId: e.eia.seriesId,  url: AGENCY.eia.url });
  if (e.noaa)                    out.push({ agency: AGENCY.noaa.name, short: AGENCY.noaa.short, url: AGENCY.noaa.url });
  return out;
}

const ingredients = (agg.ingredients || [])
  .map((x) => x.slug)
  .filter((slug) => SRC.ingredients && SRC.ingredients[slug])
  .map((slug) => ({ slug, name: (labels[slug] && labels[slug].en) || slug, sources: sourcesFor(SRC.ingredients[slug]) }))
  .filter((x) => x.sources.length);

// ---- Surface 1: the machine-readable JSON (strip the display-only `short`) ---
const payload = {
  name: 'Muntin Restaurant Cost Index — source provenance',
  description: 'Per-ingredient provenance for the Cost Index: every published reading mapped to the public U.S. government data series behind it, by report identifier. Method: https://muntin.digital/cost-index/methodology/. Public-domain inputs; estimates and gaps are labeled on the index itself.',
  license: 'https://creativecommons.org/publicdomain/zero/1.0/',
  methodology: 'https://muntin.digital/cost-index/methodology/',
  index: 'https://muntin.digital/cost-index/',
  data: 'https://muntin.digital/cost-index/index.json',
  lastReviewed: ci._lastReviewed || null,
  count: ingredients.length,
  ingredients: ingredients.map((x) => ({ slug: x.slug, name: x.name, sources: x.sources.map(({ short, ...rest }) => rest) })),
};
const jsonOut = JSON.stringify(payload, null, 2) + '\n';

// ---- Surface 2: the human-browsable table, EN + ES ------------------------
function shortSource(s) {
  if (s.reportIds) return `${s.short} terminal markets (${s.reportIds.length})`;
  if (s.reportId)  return `${s.short} ${s.reportId}`;
  if (s.seriesId)  return `${s.short} ${s.seriesId}`;
  return s.short;
}
function renderTable(isEs) {
  const base = isEs ? '/es' : '';
  const h = isEs ? ['Ingrediente', 'Fuentes públicas (por identificador de reporte)'] : ['Ingredient', 'Public sources (by report identifier)'];
  const rows = ingredients.map((x) =>
    `      <tr><td><a href="${base}/cost-index/${x.slug}/">${escHtml(x.name)}</a></td><td>${escHtml(x.sources.map(shortSource).join(' · '))}</td></tr>`
  ).join('\n');
  return `<style>.ci-srcreg{width:100%;border-collapse:collapse;font-size:14px;margin:6px 0 0;font-variant-numeric:tabular-nums}.ci-srcreg th{text-align:left;padding:8px 10px;border-bottom:2px solid var(--line);font-family:var(--font-display);font-size:13px}.ci-srcreg td{padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top}.ci-srcreg td:first-child{font-weight:500}.ci-srcreg td:last-child{color:var(--ink-soft)}.ci-srcreg a{color:var(--teal);text-decoration:none;border-bottom:1px dashed currentColor}</style>
    <table class="ci-srcreg"><thead><tr><th>${h[0]}</th><th>${h[1]}</th></tr></thead><tbody>
${rows}
    </tbody></table>`;
}
const SENTINEL_RE = /(<!-- ci-sources:start -->)[\s\S]*?(<!-- ci-sources:end -->)/;

// ---- Reconcile all three surfaces -----------------------------------------
const targets = [
  { path: 'cost-index/sources.json', next: jsonOut },
  ...[['cost-index/sources/index.html', false], ['es/cost-index/sources/index.html', true]].map(([p, isEs]) => {
    const cur = fs.existsSync(path.join(repoRoot, p)) ? fs.readFileSync(path.join(repoRoot, p), 'utf8') : '';
    const next = SENTINEL_RE.test(cur) ? cur.replace(SENTINEL_RE, `$1\n    ${renderTable(isEs)}\n    $2`) : null;
    return { path: p, next, missing: next == null };
  }),
];

let drift = 0;
for (const t of targets) {
  const fp = path.join(repoRoot, t.path);
  if (t.missing) { console.error(`cost-index provenance: sentinel not found in ${t.path}`); process.exit(1); }
  const cur = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : null;
  if (cur === t.next) continue;
  drift++;
  if (!checkOnly) fs.writeFileSync(fp, t.next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${t.path}`);
}

console.log(`cost-index provenance: ${drift} surface(s) ${checkOnly ? 'would change' : 'updated'} — ${ingredients.length} ingredients.`);
if (checkOnly && drift > 0) {
  console.error('  run: node scripts/build-cost-index-provenance.mjs');
  process.exit(1);
}
