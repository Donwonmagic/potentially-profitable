#!/usr/bin/env node
/**
 * build-cost-index-reproduce.mjs — keep the methodology page's "Reproduce a number
 * yourself" worked example pinned to the LIVE published figure, so the recipe can never
 * quote a stale number.
 *
 * The #reproduce section walks an auditor through reconstructing ribeye's published
 * wholesale reference from USDA LMR report 2453. The figure it quotes is the actual
 * published value from cost-index/ribeye/series.json, stamped via <!-- repro:KEY -->…
 * <!-- /repro --> sentinels on the EN + ES pages. If the published value moves, this
 * re-stamps it; --check fails if the page drifts from the feed, so the worked example
 * stays true by construction.
 *
 * Pure & deterministic.
 *   node scripts/build-cost-index-reproduce.mjs            # stamp the worked example
 *   node scripts/build-cost-index-reproduce.mjs --check    # CI: fail if stale
 *   node scripts/build-cost-index-reproduce.mjs --self-test
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SLUG = 'ribeye';                       // the worked example's ingredient
const EXPECTED_SOURCE = 'usda-lmr';          // the recipe's premise: LMR is the level source
const SERIES = path.join(repo, `cost-index/${SLUG}/series.json`);
const PAGES = [
  'cost-index/methodology/index.html',
  'es/cost-index/methodology/index.html',
];

function rd(p) { return JSON.parse(readFileSync(p, 'utf8')); }

// The live figure to quote: latest published observation for the worked-example ingredient.
function workedValues() {
  const s = rd(SERIES);
  const obs = (s.observations || []).filter((o) => typeof o.priceUsd === 'number');
  const last = obs[obs.length - 1];
  if (!last) throw new Error(`no published observation for ${SLUG}`);
  return {
    latest: last,
    source: last.source,
    asOf: s.asOf || last.date,
    vals: { 'value': '$' + last.priceUsd.toFixed(2), 'asOf': s.asOf || last.date },
  };
}

function stamp(html, vals) {
  let out = html;
  for (const [key, val] of Object.entries(vals)) {
    const re = new RegExp('(<!-- repro:' + key + ' -->)([\\s\\S]*?)(<!-- /repro -->)');
    if (!re.test(out)) throw new Error(`sentinel repro:${key} not found`);
    out = out.replace(re, (_m, a, _cur, b) => a + val + b);
  }
  return out;
}

function main() {
  if (process.argv.includes('--self-test')) {
    const w = workedValues();
    const sample = '<!-- repro:value --><!-- /repro --> as of <!-- repro:asOf --><!-- /repro -->';
    const once = stamp(sample, w.vals);
    const checks = [
      ['worked figure equals the published value', w.vals.value === '$' + w.latest.priceUsd.toFixed(2)],
      ['recipe premise holds: level source is USDA LMR', w.source === EXPECTED_SOURCE],
      ['stamp is idempotent', stamp(once, w.vals) === once],
    ];
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error('  ✗ ' + c[0]));
    console.log(`cost-index-reproduce self-test: ${checks.length - failed.length}/${checks.length} passed.`);
    process.exit(failed.length ? 1 : 0);
  }

  const w = workedValues();
  if (w.source !== EXPECTED_SOURCE) {
    console.error(`✗ reproduce: ${SLUG} level source is now "${w.source}", not "${EXPECTED_SOURCE}" — the worked example must be revisited (it cites USDA LMR report 2453).`);
    process.exit(1);
  }

  if (process.argv.includes('--check')) {
    let drift = 0;
    for (const rel of PAGES) {
      const fp = path.join(repo, rel);
      const cur = readFileSync(fp, 'utf8');
      if (stamp(cur, w.vals) !== cur) { drift++; console.log(`would update ${rel}`); }
    }
    if (drift) { console.error('✗ reproduce worked example is stale vs the live feed — run: node scripts/build-cost-index-reproduce.mjs'); process.exit(1); }
    console.log(`✓ reproduce worked example in sync (${SLUG} ${w.vals.value} as of ${w.vals.asOf}).`);
    return;
  }

  for (const rel of PAGES) {
    const fp = path.join(repo, rel);
    writeFileSync(fp, stamp(readFileSync(fp, 'utf8'), w.vals));
  }
  console.log(`Stamped reproduce example: ${SLUG} ${w.vals.value}/lb as of ${w.vals.asOf} (source ${w.source}).`);
}

main();
