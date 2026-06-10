/* Validates the calibration math against KNOWN truth: a synthetic indicator that
 * leads a synthetic price by a known lag/sign must be recovered; pure noise must
 * be rejected; the calendar must be removed by deseasonalization. Seeded → exact.
 *   node scripts/test-pressure-calibrate.mjs
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const C = require(path.join(repoRoot, 'tools/_shared/pressure-calibrate.js'));

let fails = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? '✓' : '✗ FAIL'} ${msg}`); if (!cond) fails++; };

// Deterministic PRNG (mulberry32) + standard normal (Box-Muller).
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(42);
function randn() { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function sd(a) { const m = a.reduce((s, x) => s + x, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / a.length); }

console.log('pressure-calibrate self-test (synthetic truth):');

// --- normal CDF sanity ---
ok(Math.abs(C.normCdf(0) - 0.5) < 1e-6, 'normCdf(0) = 0.5');
ok(Math.abs(C.normCdf(1.96) - 0.975) < 1e-3, 'normCdf(1.96) ≈ 0.975');

// --- price = positive random walk; yc = its pct changes ---
const N = 240, LAG = 4;
const price = [100];
for (let i = 1; i < N; i++) price.push(Math.max(5, price[i - 1] * (1 + 0.02 * randn())));
const yc = C.pctChange(price, 1).map((o) => o.v);   // length N-1

// --- signal indicator: its change LEADS yc by LAG (positive sign) + noise ---
const noiseAmp = 0.6 * sd(yc);
const xcSig = [];
for (let t = 0; t + LAG < yc.length; t++) xcSig.push(yc[t + LAG] + noiseAmp * randn());
// --- noise indicators: independent gaussians ---
const noiseInds = [];
for (let k = 0; k < 6; k++) { const a = []; for (let t = 0; t < yc.length; t++) a.push(randn()); noiseInds.push(a); }

// --- lag scan recovers the lead ---
const scan = C.lagScan(xcSig, yc, 12, 20);
ok(scan.best && Math.abs(scan.best.lag - LAG) <= 1, `lag scan recovers lead ≈ ${LAG} (got ${scan.best && scan.best.lag})`);
ok(scan.best && scan.best.r > 0.4, `signal correlation strong + positive (r=${scan.best && scan.best.r.toFixed(2)})`);

// --- the honest pipeline: lag frozen on train, p adjusted for the search, OOS sign ---
const sigEdge = C.calibrateEdge(xcSig, yc, { maxLag: 12, minN: 40 });
ok(sigEdge.ok && Math.abs(sigEdge.lag - LAG) <= 1, `calibrateEdge recovers lag ≈ ${LAG} (got ${sigEdge.lag})`);
ok(sigEdge.sign === 1, 'signal sign positive (correct)');
ok(sigEdge.p < 0.05, `signal survives lag-search-adjusted p (p=${sigEdge.p.toExponential(1)})`);
ok(sigEdge.oosPass === true, `signal sign holds out-of-sample (oosR=${sigEdge.oosR && sigEdge.oosR.toFixed(2)})`);

// --- noise indicators through the SAME honest pipeline ---
const noiseEdges = noiseInds.map((nc, i) => Object.assign({ id: 'noise' + i }, C.calibrateEdge(nc, yc, { maxLag: 12, minN: 40 })));
const noiseInclude = noiseEdges.filter((e) => e.ok && e.p < 0.05 && e.oosPass).length;
ok(noiseInclude === 0, `no noise edge clears adjusted-p AND OOS (${noiseInclude}/6 did)`);

// --- Benjamini-Hochberg over the adjusted p's: real passes, noise rejected ---
const edges = [Object.assign({ id: 'signal' }, sigEdge), ...noiseEdges];
C.benjaminiHochberg(edges, 0.10);
ok(edges[0].bhPass === true, 'BH keeps the real signal');
// FDR 10% is ALLOWED to pass a small fraction of false positives by design — the
// OOS gate (above) is what catches those. So assert FDR is controlled, not zero.
ok(noiseEdges.filter((e) => e.bhPass).length <= 1, `BH controls noise to ≤1 of 6 (FDR 10%) — OOS gate catches the rest`);

// --- end-to-end inclusion: only the signal earns a non-zero weight ---
const sigW = C.suggestWeight(Object.assign({}, sigEdge, { bhPass: edges[0].bhPass }), 3);
const noiseW = noiseEdges.map((e) => C.suggestWeight(Object.assign({}, e, { bhPass: e.bhPass }), 3));
ok(sigW > 0, `signal earns a weight (${sigW})`);
ok(noiseW.every((w) => w === 0), 'every noise edge earns weight 0');

// --- BH threshold sanity on fixed p-values ---
const bh = C.benjaminiHochberg([{ p: 0.001 }, { p: 0.01 }, { p: 0.04 }, { p: 0.5 }, { p: 0.8 }], 0.10);
ok(bh.nPass === 3 && Math.abs(bh.thresh - 0.04) < 1e-9, `BH threshold math (nPass=${bh.nPass}, thresh=${bh.thresh})`);

// --- deseasonalization removes a pure calendar pattern ---
const monthEffect = [0.05, -0.04, 0.03, 0, -0.02, 0.06, -0.05, 0.01, 0.02, -0.03, 0.04, -0.06];
const months = [], seasonal = [];
for (let i = 0; i < 120; i++) { const m = i % 12; months.push(m); seasonal.push(monthEffect[m] + 0.001 * randn()); }
const deseas = C.deseasonalizeByMonth(seasonal, months);
ok(sd(deseas) < 0.2 * sd(seasonal), `deseasonalize kills the calendar (sd ${sd(seasonal).toFixed(3)} → ${sd(deseas).toFixed(3)})`);

console.log(fails ? `\npressure-calibrate: ${fails} FAIL` : '\npressure-calibrate: OK — recovers truth, rejects noise.');
process.exit(fails ? 1 : 0);
