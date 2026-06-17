#!/usr/bin/env node
/**
 * check-staleness-honesty.mjs — the staleness penalty, enforced. A complete read is
 * not a current one: an ingredient whose freshest contributing print is overdue for
 * its source's cadence must not wear a confidence its data no longer earns. This gate
 * computes each shippable point's staleness ceiling (see tools/_shared/cost-staleness.js)
 * and FAILS if any published confidence sits ABOVE that ceiling — so CI refuses to ship
 * a stale-but-confident reading. It also reports who's drifting toward overdue.
 *
 * Deterministic: staleness is read-date-minus-observation-date, both frozen in the
 * vendored data (never "today"), so this never churns between rebuilds.
 *
 *   node scripts/check-staleness-honesty.mjs            # report + gate
 *   node scripts/check-staleness-honesty.mjs --self-test
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { stalenessOf, capConfidence } = require(path.join(repo, 'tools/_shared/cost-staleness.js'));
const STEP = ['directional', 'low', 'medium', 'high'];

function rd(p) { return JSON.parse(readFileSync(path.join(repo, p), 'utf8')); }

function evaluate() {
  const d = rd('data/cost-index.json');
  const rows = [];
  for (const [k, v] of Object.entries(d.ingredients || {})) {
    const p = v.points && v.points[0];
    if (!p || !p.level || typeof p.level.medianCents !== 'number') continue;   // no dollar level → not shippable
    const s = stalenessOf(p, {});
    if (!s) continue;
    const conf = p.confidence;
    const capped = capConfidence(conf, s.ceiling);
    const violates = STEP.indexOf(conf) > STEP.indexOf(capped);                  // published above its ceiling
    rows.push({ k, conf, ratio: s.ratio, staleDays: s.staleDays, cadenceDays: s.cadenceDays, overdue: s.overdue, ceiling: s.ceiling, capped, violates });
  }
  return rows;
}

function selfTest() {
  const mk = (type, staleDays, asOf = '2026-06-16') => ({ asOf, confidence: 'high', level: { medianCents: 100, provenance: [{ type, source: type, date: new Date(Date.parse(asOf) - staleDays * 86400000).toISOString().slice(0, 10) }] } });
  const fresh = stalenessOf(mk('usda-ams', 3));
  const overdue = stalenessOf(mk('usda-ams', 28));        // 4 cadences
  const checks = [
    ['fresh weekly read has no ceiling', fresh.ceiling === null],
    ['28-day weekly read is overdue', overdue.overdue === true],
    ['a high label on an overdue read is a violation', STEP.indexOf('high') > STEP.indexOf(capConfidence('high', overdue.ceiling))],
    ['monthly read at 30d stays fresh', stalenessOf(mk('noaa-trade', 30)).ceiling === null],
  ];
  const failed = checks.filter((c) => !c[1]);
  failed.forEach((c) => console.error('  ✗ ' + c[0]));
  console.log(`staleness-honesty self-test: ${checks.length - failed.length}/${checks.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();

const rows = evaluate();
const violations = rows.filter((r) => r.violates);
const overdue = rows.filter((r) => r.overdue);
const drifting = rows.filter((r) => !r.overdue && r.ratio > 1.5).sort((a, b) => b.ratio - a.ratio);
const maxRatio = rows.reduce((m, r) => Math.max(m, r.ratio), 0);

console.log(`Staleness: ${rows.length} shippable point(s) · max overdue ratio ${maxRatio.toFixed(2)}× cadence · ${overdue.length} overdue.`);
if (drifting.length) console.log(`  drifting toward overdue: ${drifting.slice(0, 5).map((r) => `${r.k} ${r.ratio.toFixed(1)}×`).join(', ')}`);

if (violations.length) {
  violations.forEach((r) => console.error(`✗ ${r.k}: published '${r.conf}' but ${r.staleDays}d stale (${r.ratio.toFixed(1)}× its ${r.cadenceDays}d cadence) caps it at '${r.capped}'. Re-vendor or downgrade.`));
  process.exit(1);
}
console.log(`✓ no point wears a confidence its freshness can't support — every published label honors the staleness ceiling.`);
