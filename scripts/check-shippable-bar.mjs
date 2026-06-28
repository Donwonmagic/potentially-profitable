#!/usr/bin/env node
/**
 * check-shippable-bar.mjs — the "ship complete or not at all" gate.
 *
 * An ingredient earns a live reading only if it clears the shippable bar
 * (tools/_shared/cost-confidence.js isShippable): a credible wholesale dollar
 * level — a measured multi-market range, or a single authoritative source whose
 * direction is corroborated. Below-bar ingredients must be ABSENT from the
 * browser seed (data/cost-index.js → Cost Index) and live only as honest
 * "expanding coverage" pages. This gate pins the seed to the bar so a thin or
 * no-level read can never leak onto the dashboard.
 *
 *   node scripts/check-shippable-bar.mjs           # report + fail on leak
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { isShippable } = require(path.join(repoRoot, 'tools/_shared/cost-confidence.js'));

const ci = JSON.parse(readFileSync(path.join(repoRoot, 'data/cost-index.json'), 'utf8')).ingredients || {};
const ship = [], pending = [];
for (const [k, v] of Object.entries(ci)) {
  const p = (v.points || [])[0];
  if (!p) continue;
  (isShippable(p) ? ship : pending).push(k);
}

// Read the browser seed's ingredient keys (it sets self.MUNTIN_COST_INDEX).
let seedKeys = [];
try {
  const code = readFileSync(path.join(repoRoot, 'data/cost-index.js'), 'utf8');
  const self = {};
  // eslint-disable-next-line no-new-func
  (new Function('self', code))(self);
  const DATA = self.MUNTIN_COST_INDEX;
  seedKeys = ((DATA && DATA.ingredients) || []).map((e) => e.key);
} catch (e) {
  console.error('check-shippable-bar: could not read data/cost-index.js —', e.message);
  process.exit(1);
}

const shipSet = new Set(ship), seedSet = new Set(seedKeys);
const leaked = seedKeys.filter((k) => !shipSet.has(k));   // below-bar but on the dashboard
const missing = ship.filter((k) => !seedSet.has(k));      // shippable but absent from the seed

let fail = false;
if (leaked.length) { console.error('✗ below-bar ingredient(s) leaked into the Cost Index seed:', leaked.join(', ')); fail = true; }
if (missing.length) { console.error('✗ shippable ingredient(s) missing from the seed (re-run build-cost-index-seed):', missing.join(', ')); fail = true; }

console.log(`Shippable bar: ${ship.length} shipping a reading, ${pending.length} expanding-coverage${pending.length ? ' (' + pending.join(', ') + ')' : ''}.`);
process.exit(fail ? 1 : 0);
