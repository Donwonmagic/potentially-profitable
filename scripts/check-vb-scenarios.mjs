#!/usr/bin/env node
/**
 * check-vb-scenarios.mjs — Vendor Benchmark's onboarding shows three worked examples
 * (hot / tracked / thin) whose VERDICT is computed live, and the tool's chip copy claims
 * a specific outcome for each. This gate proves the REAL engine still yields that outcome,
 * so a seed refresh can never leave the demo asserting a tone the data no longer produces.
 *
 * Single-source: the SCENARIOS are parsed out of vendor-benchmark.js itself, then run
 * through the same MW.compute + seed the browser uses.
 *
 *   node scripts/check-vb-scenarios.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// Load the engine + seeds exactly as the browser does (globals via a window shim).
globalThis.window = globalThis; globalThis.self = globalThis;
require(path.join(repoRoot, 'tools/_shared/stem.js'));
require(path.join(repoRoot, 'tools/_shared/sku-match.js'));
require(path.join(repoRoot, 'tools/_shared/cost-index-lookup.js'));
require(path.join(repoRoot, 'data/cost-index.js'));
require(path.join(repoRoot, 'data/cost-index-history.js'));
const MW = require(path.join(repoRoot, 'tools/_shared/market-window.js'));

const src = fs.readFileSync(path.join(repoRoot, 'tools/vendor-benchmark/vendor-benchmark.js'), 'utf8');
const m = src.match(/var SCENARIOS = (\{[\s\S]*?\n  \});/);
if (!m) { console.error('check-vb-scenarios: could not locate the SCENARIOS literal in vendor-benchmark.js.'); process.exit(1); }
let SCENARIOS;
try { SCENARIOS = new Function('return ' + m[1])(); } // eslint-disable-line no-new-func
catch (e) { console.error('check-vb-scenarios: could not parse SCENARIOS —', e.message); process.exit(1); }

// The outcome each scenario's onboarding chip promises the operator.
const EXPECT = {
  hot:     { desc: "'over' (vendor ran hot)",      ok: (r) => r.market.available && r.market.res && r.market.res.ok && r.market.say && r.market.say.tone === 'over' },
  tracked: { desc: "'match' (vendor tracked)",     ok: (r) => r.market.available && r.market.res && r.market.res.ok && r.market.say && r.market.say.tone === 'match' },
  thin:    { desc: 'withheld hold (no market call)', ok: (r) => r.market.available && r.market.res && !r.market.res.ok },
};

const errors = [];
for (const key of Object.keys(EXPECT)) {
  const s = SCENARIOS[key];
  if (!s || !Array.isArray(s.rows)) { errors.push(`${key}: missing/invalid in SCENARIOS`); continue; }
  const rows = s.rows.map((p) => ({ cents: Math.round(parseFloat(p.price) * 100), date: p.date }));
  let r;
  try { r = MW.compute({ item: s.item, purchases: rows, locale: 'en' }); }
  catch (e) { errors.push(`${key}: compute threw ${e.message}`); continue; }
  if (!EXPECT[key].ok(r)) {
    const t = r.market && r.market.say && r.market.say.tone;
    const ok = r.market && r.market.res && r.market.res.ok;
    errors.push(`${key} (${s.item}): expected ${EXPECT[key].desc}, got tone='${t}' ok=${ok}`);
  }
}

if (errors.length) {
  console.error('VB scenarios: the live engine no longer yields the claimed onboarding outcome:');
  for (const e of errors) console.error('  ✗ ' + e);
  console.error('Update the SCENARIOS prices in tools/vendor-benchmark/vendor-benchmark.js so each chip is honest again.');
  process.exit(1);
}
console.log(`VB scenarios: OK — all ${Object.keys(EXPECT).length} worked examples still compute their claimed tone.`);
process.exit(0);
