#!/usr/bin/env node
/**
 * check-bridge-cointegration.mjs — enforces the ratio bridge's Stability gate as a
 * STATISTICAL test, not an eyeball. A derived dollar level may be published from an
 * outside series only when the two are COINTEGRATED (Engle–Granger; see
 * tools/_shared/cost-cointegration.js). Two independent random walks correlate by
 * accident — a bridge built on that is a fabrication with a band — so the gate's
 * self-test proves on every build that the spurious case is REJECTED and a genuine
 * relationship is ACCEPTED. It then validates any live bridge declared in the data:
 * a point carrying `derived.bridge = { source, beta?, ... }` must still cointegrate
 * against its source's history, or CI fails (publish absent, not a number).
 *
 *   node scripts/check-bridge-cointegration.mjs            # validate live bridges + report
 *   node scripts/check-bridge-cointegration.mjs --self-test
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { adf, engleGranger } = require(path.join(repo, 'tools/_shared/cost-cointegration.js'));

function rd(p) { try { return JSON.parse(readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } }
function seriesFor(key, deep, ci) {
  const d = deep && deep.ingredients && deep.ingredients[key];
  if (Array.isArray(d) && d.length >= 24) return d.map((p) => p.valueCents).filter((x) => typeof x === 'number');
  const v = ci && ci.ingredients && ci.ingredients[key];
  const h = (v && v.history) || (v && v.points && v.points[0] && v.points[0].history) || [];
  return h.map((p) => p.valueCents).filter((x) => typeof x === 'number');
}

function selfTest() {
  const mb = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const g = (r) => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const rw = (n, s, sc = 1) => { const r = mb(s); const a = [100]; for (let i = 1; i < n; i++) a.push(a[i - 1] + g(r) * sc); return a; };
  const ar = (n, s, rho, sc = 1) => { const r = mb(s); const a = [0]; for (let i = 1; i < n; i++) a.push(rho * a[i - 1] + g(r) * sc); return a; };
  const x = rw(300, 3), noise = ar(300, 99, 0, 0.5), y = x.map((xi, i) => 5 + 2 * xi + noise[i]);
  let spuriousRejected = 0;
  for (const [sx, sy] of [[1, 2], [5, 8], [13, 21], [4, 9], [17, 6]]) if (!engleGranger(rw(250, sx), rw(250, sy), {}).cointegrated) spuriousRejected++;
  const checks = [
    ['stationary AR(1) rejects unit root', adf(ar(300, 11, 0.4), { regression: 'c' }).stat < -3.0],
    ['random walk does not reject', adf(rw(300, 7), { regression: 'c' }).stat > -2.6],
    ['genuine cointegration is accepted', engleGranger(y, x, {}).cointegrated === true],
    ['≥4/5 independent walk pairs rejected (spurious trap)', spuriousRejected >= 4],
  ];
  const failed = checks.filter((c) => !c[1]);
  failed.forEach((c) => console.error('  ✗ ' + c[0]));
  console.log(`bridge-cointegration self-test: ${checks.length - failed.length}/${checks.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();

// --- validate any live bridge declarations -------------------------------------
const ci = rd('data/cost-index.json'), deep = rd('data/cost-index-history.json');
const violations = [], validated = [];
for (const [k, v] of Object.entries((ci && ci.ingredients) || {})) {
  const p = v.points && v.points[0];
  const bridge = p && p.derived && p.derived.bridge;        // forward-looking shape: { source }
  if (!bridge || !bridge.source) continue;
  const y = seriesFor(k, deep, ci), x = seriesFor(bridge.source, deep, ci);
  const eg = engleGranger(y, x, {});
  if (eg.cointegrated) validated.push(`${k}←${bridge.source} (adf ${eg.adfStat})`);
  else violations.push(`${k}←${bridge.source}: NOT cointegrated (adf ${eg.adfStat ?? '?'} vs ${eg.crit ?? '?'}, ${eg.reason || ''}) — publish absent, not a derived level`);
}

if (violations.length) { violations.forEach((m) => console.error('✗ ' + m)); process.exit(1); }
if (validated.length) console.log(`✓ ${validated.length} live bridge(s) cointegrate: ${validated.join(', ')}`);
else console.log('Bridge cointegration: no live ratio-bridge publishes a derived level yet — the Stability gate machinery is proven by --self-test and ready to enforce.');
