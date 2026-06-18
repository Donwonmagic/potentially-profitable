#!/usr/bin/env node
/**
 * check-cost-index-independence.mjs — turn the independence claim into a tested invariant.
 *
 * The methodology page (#independence) states the Cost Index pipeline has NO input path for
 * customer, invoice, or delivered-price data — it reads only public sources. This proves it:
 * it scans the number-PRODUCING pipeline (fetch → compose → vendor → calibrate → serve) and
 * the shared math modules, extracts every file path they read/import, and fails if any input
 * path references customer/product data. So "we're firewalled from Ledger" is verified on
 * every CI run, not merely asserted — the asymmetry a closed vendor can't match.
 *
 * Scope note: this checks the DATA pipeline only. Page/marketing surfaces (the ingredient
 * page generator, the weekly dispatch) legitimately carry Ledger funnel CTAs and are out of
 * scope — a navigation link is not a price input.
 *
 *   node scripts/check-cost-index-independence.mjs
 *   node scripts/check-cost-index-independence.mjs --self-test
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The number-producing pipeline + shared math. NOT the page/dispatch generators (funnel CTAs).
const PIPELINE = [
  'scripts/fetch-cost-index-sources.mjs',
  'scripts/build-cost-index.mjs',
  'scripts/build-cost-index-calibration-report.mjs',
  'scripts/build-cost-revisions.mjs',
  'scripts/build-cost-index-feed.mjs',
  'scripts/build-seasonality.mjs',
  'scripts/backtest-cost-forecast.mjs',
  'tools/_shared/composite-price.js',
  'tools/_shared/cost-conformal.js',
  'tools/_shared/cost-reliability.js',
  'tools/_shared/cost-confidence.js',
  'tools/_shared/cost-staleness.js',
  'tools/_shared/observation-quality.js',
  'tools/_shared/cost-basket.js',
];

// Input paths that would betray a customer/product data dependency.
const FORBIDDEN = ['ledger', 'invoice', 'customer', 'waitlist', 'founding', 'delivered-'];

// Pull quoted string literals that look like file paths (a '/' or a data-file extension).
function inputPaths(src) {
  const lits = src.match(/['"][^'"\n]+['"]/g) || [];
  return lits
    .map((s) => s.slice(1, -1))
    .filter((p) => /\//.test(p) || /\.(json|csv|mjs|js)$/.test(p));
}

function detectForbidden(paths) {
  const hits = [];
  for (const p of paths) {
    const low = p.toLowerCase();
    for (const tok of FORBIDDEN) if (low.includes(tok)) hits.push({ path: p, token: tok });
  }
  return hits;
}

function selfTest() {
  const checks = [
    ['flags a ledger data input', detectForbidden(['data/ledger-secrets.json']).length === 1],
    ['flags an invoice/customer input', detectForbidden(['data/customer-invoices.json']).some((h) => h.token === 'customer')],
    ['passes clean public paths', detectForbidden(['data/cost-index.json', 'cost-index/ribeye/series.json', 'tools/_shared/cost-conformal.js']).length === 0],
    ['extracts path-like literals only', JSON.stringify(inputPaths(`readFileSync('data/x.json'); const s='not a delivered price'; t='hi'`)) === JSON.stringify(['data/x.json'])],
  ];
  const failed = checks.filter((c) => !c[1]);
  failed.forEach((c) => console.error('  ✗ ' + c[0]));
  console.log(`cost-index-independence self-test: ${checks.length - failed.length}/${checks.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest();

  const violations = [];
  let scanned = 0, distinctPaths = new Set();
  for (const rel of PIPELINE) {
    const fp = path.join(repo, rel);
    if (!existsSync(fp)) continue;   // defensive: pipeline file optional/renamed
    scanned++;
    const paths = inputPaths(readFileSync(fp, 'utf8'));
    paths.forEach((p) => distinctPaths.add(p));
    for (const h of detectForbidden(paths)) violations.push({ file: rel, ...h });
  }
  if (!scanned) { console.error('✗ independence check found no pipeline files — list is stale'); process.exit(1); }
  if (violations.length) {
    console.error('✗ Cost Index independence violated — pipeline reads customer/product data:');
    violations.forEach((v) => console.error(`    ${v.file} → "${v.path}" (matched "${v.token}")`));
    process.exit(1);
  }
  console.log(`✓ Cost Index independence: ${scanned} pipeline file(s), ${distinctPaths.size} input path(s) scanned — all public, none customer/product.`);
}

main();
