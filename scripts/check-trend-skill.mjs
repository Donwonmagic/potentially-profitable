/**
 * check-trend-skill.mjs — the reliability-diagram gate: proves the trend arrow's
 * CONFIDENCE is earned. Replaying a price-only direction call over deep history and
 * scoring each call against the next realized move, it pools a reliability curve by
 * stated strength and FAILS the build unless:
 *   1. the curve is monotonic (a stronger arrow never verifies LESS often),
 *   2. strength discriminates (top tier clears the bottom by a margin — "high"≠"low"),
 *   3. the calls have skill overall (hit-rate beats the no-skill majority-class baseline),
 *   4. the HIGH tier — the only one we'd ever label high-confidence — beats baseline.
 * So "high means high" is a checked claim, not a decoration. Flat-realized weeks are
 * pushes (excluded), exactly as the baseline is, so the comparison is honest.
 *
 * Run:  node scripts/check-trend-skill.mjs            # report + gate
 *       node scripts/check-trend-skill.mjs --self-test
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { reliabilityCurve, isMonotonic } = require(path.join(repo, 'tools/_shared/cost-reliability.js'));

const LABELS = ['low', 'medium', 'high'];
const MIN_N = 200;            // pooled directional calls needed before asserting
const DISCRIM = 0.04;         // high-tier minus low-tier hit-rate floor
const MARGIN = 0.0;           // overall/high must clear baseline by at least this

function rd(p) { try { return JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } }
function seriesFor(key, deep, ci) {
  const d = deep && deep.ingredients && deep.ingredients[key];
  if (Array.isArray(d) && d.length >= 14) return d.map((p) => p.valueCents).filter((x) => typeof x === 'number');
  const v = ci && ci.ingredients && ci.ingredients[key];
  const h = (v && v.history) || (v && v.points && v.points[0] && v.points[0].history) || [];
  return h.map((p) => p.valueCents).filter((x) => typeof x === 'number');
}

function pool() {
  const ci = rd('data/cost-index.json'), deep = rd('data/cost-index-history.json');
  const keys = ci && ci.ingredients ? Object.keys(ci.ingredients) : [];
  const tiers = LABELS.map((l, i) => ({ tier: i, label: l, n: 0, hits: 0 }));
  let n = 0, hits = 0, up = 0, down = 0, pushes = 0, items = 0;
  for (const k of keys) {
    const r = reliabilityCurve(seriesFor(k, deep, ci));
    if (!r) continue;
    items++;
    r.tiers.forEach((t, i) => { tiers[i].n += t.n; tiers[i].hits += t.hits; });
    n += r.n; hits += r.hits; up += r.up; down += r.down; pushes += r.pushes;
  }
  tiers.forEach((t) => { t.hitRate = t.n ? +(t.hits / t.n).toFixed(3) : null; });
  const baseline = +(Math.max(up, down) / (up + down || 1)).toFixed(3);
  const hitRate = n ? +(hits / n).toFixed(3) : null;
  return { tiers, n, hitRate, baseline, pushes, items };
}

function selfTest() {
  const mb = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const ar1 = (len, seed, phi, scale) => { const rng = mb(seed); const v = [1000]; let c = 0; for (let i = 1; i < len; i++) { c = phi * c + (rng() - 0.5) * scale; v.push(Math.max(1, Math.round(v[i - 1] + c))); } return v; };
  const mom = reliabilityCurve(ar1(600, 2, 0.7, 40));
  const rw = reliabilityCurve(ar1(600, 3, 0, 40));
  const checks = [
    ['momentum series shows skill', mom.skill && mom.hitRate > mom.baseline],
    ['momentum curve monotonic', isMonotonic(mom.tiers)],
    ['random walk shows no real skill', rw.hitRate <= rw.baseline + 0.05],
  ];
  const failed = checks.filter((c) => !c[1]);
  failed.forEach((c) => console.error('  ✗ ' + c[0]));
  console.log(`trend-skill self-test: ${checks.length - failed.length}/${checks.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();

const p = pool();
const fmt = p.tiers.map((t) => `${t.label} ${t.hitRate == null ? '—' : (t.hitRate * 100).toFixed(0) + '%'} (n=${t.n})`).join(' · ');
console.log(`Trend skill: ${p.items} item(s), ${p.n} scored directional calls (${p.pushes} flat-week pushes excluded).`);
console.log(`  reliability by strength: ${fmt}`);
console.log(`  overall hit-rate ${p.hitRate == null ? '—' : (p.hitRate * 100).toFixed(1) + '%'} vs no-skill baseline ${(p.baseline * 100).toFixed(1)}%.`);

if (p.n < MIN_N) { console.log(`  (only ${p.n} calls — informational until deep history fills in; gate is advisory.)`); process.exit(0); }

const hi = p.tiers[2].hitRate, lo = p.tiers[0].hitRate;
const problems = [];
if (!isMonotonic(p.tiers)) problems.push('reliability is NOT monotonic — a stronger arrow verifies less often (strength is miscalibrated)');
if (hi == null || lo == null || hi - lo < DISCRIM) problems.push(`strength does not discriminate — high ${hi} vs low ${lo} (need ≥${DISCRIM} gap)`);
if (p.hitRate < p.baseline + MARGIN) problems.push(`no skill — overall ${p.hitRate} ≤ baseline ${p.baseline}; the arrow must stay descriptive, not a forecast`);
if (hi != null && hi < p.baseline + MARGIN) problems.push(`high-confidence calls do not beat baseline (${hi} ≤ ${p.baseline}) — 'high' is unearned`);

if (problems.length) { problems.forEach((m) => console.error('✗ ' + m)); process.exit(1); }
console.log(`✓ the arrow is calibrated: stronger calls verify more often (high ${(hi * 100).toFixed(0)}% > low ${(lo * 100).toFixed(0)}%) and beat the ${(p.baseline * 100).toFixed(0)}% no-skill baseline — "high" is earned.`);
