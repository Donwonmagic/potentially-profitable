import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { directionCall, reliabilityCurve, isMonotonic, tierOf } = require('./cost-reliability.js');

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// AR(1) on the CHANGES: phi>0 gives momentum (a directional call should have skill);
// phi=0 is a pure random walk (no skill).
function ar1(n, seed, phi, scale) {
  const rng = mulberry32(seed); const v = [1000]; let c = 0;
  for (let i = 1; i < n; i++) { c = phi * c + (rng() - 0.5) * scale; v.push(Math.max(1, Math.round(v[i - 1] + c))); }
  return v;
}

test('tierOf maps strength to low/med/high by edges', () => {
  const e = [0.34, 0.67];
  assert.equal(tierOf(0.1, e), 0);
  assert.equal(tierOf(0.5, e), 1);
  assert.equal(tierOf(0.9, e), 2);
});

test('directionCall: null when short, dir/strength on a clear uptrend', () => {
  assert.equal(directionCall([1, 2, 3]), null);
  const up = []; for (let i = 0; i < 20; i++) up.push(1000 + i * 10);
  const c = directionCall(up);
  assert.equal(c.dir, 1, 'monotone rise → up call');
  assert.ok(c.strength > 0.5, 'clean trend → strong');
});

test('SKILL: a momentum series beats baseline and is monotonic by strength', () => {
  const v = ar1(600, 2, 0.7, 40);
  const r = reliabilityCurve(v);
  assert.ok(r.skill, `hitRate ${r.hitRate} should beat baseline ${r.baseline}`);
  assert.ok(r.hitRate > r.baseline, 'positive lift');
  assert.ok(isMonotonic(r.tiers), 'stronger calls verify no less often');
  const lo = r.tiers[0].hitRate, hi = r.tiers[2].hitRate;
  assert.ok(hi > lo, `high tier ${hi} > low tier ${lo} — strength discriminates`);
});

test('NO skill: a pure random walk does not beat baseline by much', () => {
  const v = ar1(600, 3, 0, 40);   // phi=0 → iid changes
  const r = reliabilityCurve(v);
  assert.ok(r.hitRate <= r.baseline + 0.05, `random walk hitRate ${r.hitRate} ~ baseline ${r.baseline}`);
});

test('pushes: flat-realized weeks are excluded, not counted as misses', () => {
  // Series that frequently repeats its value (carried-over prints) → pushes > 0.
  const rng = mulberry32(7); const v = [1000];
  for (let i = 1; i < 300; i++) v.push(rng() < 0.4 ? v[i - 1] : Math.max(1, Math.round(v[i - 1] + (rng() - 0.5) * 30)));
  const r = reliabilityCurve(v);
  assert.ok(r.pushes > 0, 'flat next-weeks recorded as pushes');
  assert.ok(r.n > 0 && r.hits <= r.n, 'directional denominator excludes pushes');
});

test('isMonotonic: tolerant of noise, ignores thin tiers, catches real inversion', () => {
  assert.ok(isMonotonic([{ hitRate: 0.48, n: 50 }, { hitRate: 0.51, n: 50 }, { hitRate: 0.58, n: 50 }]));
  assert.ok(isMonotonic([{ hitRate: 0.50, n: 50 }, { hitRate: 0.48, n: 50 }, { hitRate: 0.58, n: 50 }]), 'small dip within tol ok');
  assert.ok(!isMonotonic([{ hitRate: 0.60, n: 50 }, { hitRate: 0.50, n: 50 }, { hitRate: 0.40, n: 50 }]), 'clear inversion fails');
  assert.ok(isMonotonic([{ hitRate: 0.60, n: 2 }, { hitRate: 0.50, n: 50 }]), 'thin tier ignored');
});
