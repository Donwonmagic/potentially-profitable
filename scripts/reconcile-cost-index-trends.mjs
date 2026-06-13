#!/usr/bin/env node
/**
 * reconcile-cost-index-trends.mjs — make every SHOWN trend % describe the SHOWN curve.
 *
 * Why this exists: the composite trend was being blended across source series
 * that arrived UNWINDOWED (FRED/BLS/EIA carry multi-year history), so a single
 * index source could inject a multi-year change into the headline % while the
 * level and the sparkline stayed windowed. The result: a vendored point whose
 * trend.pct contradicted both its own sparkline AND its own spike/structural
 * verdict (e.g. romaine "+159% up" headline next to an "easing / hold" verdict).
 *
 * The fix at the source is the orchestrator windowing (see fetch-cost-index-
 * sources.mjs). This script repairs the ALREADY-VENDORED data so the live
 * surface stops showing the contradiction before the next refetch: it recomputes
 * the displayed point's trend.pct / dir as windowChange over the exact history
 * curve the sparkline draws (data/cost-index.json#ingredients[k].history, and
 * drivers[d].history), using the engine's own windowChange + flat threshold.
 * Nothing else is touched — the verdict flag is already correct and stays put;
 * the internal label string is not a user surface.
 *
 * Idempotent. Run:  node scripts/reconcile-cost-index-trends.mjs [--check]
 *   --check : report what WOULD change and exit non-zero if anything would,
 *             without writing (for CI / a dry run).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const C = require(path.join(repoRoot, 'tools/_shared/composite-price.js'));
const DATA = path.join(repoRoot, 'data/cost-index.json');

const FLAT = 0.005;   // mirrors blendTrend's flat band — keep in lockstep
const dirOf = (pct) => (pct > FLAT ? 'up' : pct < -FLAT ? 'down' : 'flat');

// windowChange over the displayed curve (history is oldest→newest, valueCents).
function curveChange(history) {
  const vals = (Array.isArray(history) ? history : [])
    .filter((h) => h && typeof h.valueCents === 'number' && isFinite(h.valueCents))
    .map((h) => h.valueCents);
  return C.windowChange(vals);
}

function reconcile(check) {
  const json = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const changes = [];

  const fix = (label, history, trend) => {
    if (!trend || typeof trend.pct !== 'number') return;     // nothing displayed to reconcile
    const pct = curveChange(history);
    if (pct == null) return;                                  // <2 history points → leave as-is
    const newDir = dirOf(pct);
    const dpct = Math.abs((trend.pct || 0) - pct);
    if (dpct < 1e-9 && trend.dir === newDir) return;          // already consistent
    changes.push({ label, oldPct: trend.pct, newPct: pct, oldDir: trend.dir, newDir });
    if (!check) { trend.pct = pct; trend.dir = newDir; }
  };

  for (const [key, ing] of Object.entries(json.ingredients || {})) {
    const shown = (ing.points || [])[0];                      // the dashboard/page renders points[0]
    if (shown) fix(key, ing.history, shown.trend);
  }
  for (const [dkey, d] of Object.entries(json.drivers || {})) {
    fix('driver:' + dkey, d.history, d.trend);
  }

  if (!changes.length) {
    console.log('reconcile-cost-index-trends: all shown trends already match their curve — no change.');
    return 0;
  }
  changes.forEach((c) => {
    const f = (v) => (v == null ? 'n/a' : (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%');
    console.log(`  ${c.label.padEnd(18)} ${f(c.oldPct)} ${c.oldDir} → ${f(c.newPct)} ${c.newDir}`);
  });
  if (check) {
    console.error(`reconcile-cost-index-trends: ${changes.length} shown trend(s) contradict their curve (run without --check to repair).`);
    return 1;
  }
  fs.writeFileSync(DATA, JSON.stringify(json, null, 2) + '\n');
  console.log(`reconcile-cost-index-trends: repaired ${changes.length} trend(s) → ${path.relative(repoRoot, DATA)}.`);
  return 0;
}

process.exit(reconcile(process.argv.includes('--check')));
