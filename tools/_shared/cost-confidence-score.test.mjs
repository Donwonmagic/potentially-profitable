// node:test suite pinning cost-confidence-score.js. Run: node --test tools/_shared/cost-confidence-score.test.mjs
// Discovered automatically by scripts/check-tests.mjs (glob over tools/_shared/*.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const S = require(path.join(path.dirname(fileURLToPath(import.meta.url)), "cost-confidence-score.js"));

test("scoreOf: weighted sum of the four axes", () => {
  // indep 0 (1 type), agreement 1, freshness 1, coverage 0.8 → .3 + .15 + .12 = .57
  assert.equal(S.scoreOf({ indepTypes: 1, agreement: 1, freshnessRatio: 0, ownCoverage: 0.8 }).S, 0.57);
  // indep .5 (2 types) lifts it
  assert.equal(S.scoreOf({ indepTypes: 2, agreement: 1, freshnessRatio: 0, ownCoverage: 0.85 }).S, 0.778);
});

test("scoreOf: missing/thin inputs degrade DOWN, never up", () => {
  const r = S.scoreOf({ indepTypes: 1, agreement: 0, freshnessRatio: 4, ownCoverage: 0 });
  assert.equal(r.S, 0);
  assert.deepEqual(r.parts, { indep: 0, agreement: 0, freshness: 0, ownCoverage: 0 });
});

test("freshnessFromRatio: within cadence=1, 4 overdue=0, null=fresh", () => {
  assert.equal(S.freshnessFromRatio(null), 1);
  assert.equal(S.freshnessFromRatio(1), 1);
  assert.equal(S.freshnessFromRatio(4), 0);
  assert.ok(Math.abs(S.freshnessFromRatio(2) - 2 / 3) < 1e-9);
});

test("hard cap dominates: a high score never exceeds the ceiling rank", () => {
  const cuts = [0.3, 0.55, 0.75];
  assert.equal(S.calibratedConfidence(0.9, cuts, 1), "low"); // ceiling=low caps a high score
  assert.equal(S.calibratedConfidence(0.6, cuts, 3), "medium"); // tier 2, ceiling high → medium
  assert.equal(S.tierFromCuts(0.6, cuts), 2);
});

test("deriveCuts: keeps monotone tiers", () => {
  const s = [];
  for (let i = 0; i < 12; i++) s.push({ S: 0.2, hits: 4, n: 10 });
  for (let i = 0; i < 12; i++) s.push({ S: 0.5, hits: 5, n: 10 });
  for (let i = 0; i < 12; i++) s.push({ S: 0.8, hits: 6, n: 10 });
  const d = S.deriveCuts(s);
  assert.equal(d.monotone, true);
  const occ = d.tiers.filter((t) => t.items > 0).map((t) => t.hitRate);
  assert.deepEqual(occ, [0.4, 0.5, 0.6]);
});

test("deriveCuts: collapses tiers when the data is non-monotone", () => {
  // upper-S tier worse than mid → a 4-way split can't be monotone; merge until it is.
  const s = [];
  for (let i = 0; i < 12; i++) s.push({ S: 0.2, hits: 5, n: 10 });
  for (let i = 0; i < 12; i++) s.push({ S: 0.5, hits: 7, n: 10 });
  for (let i = 0; i < 12; i++) s.push({ S: 0.8, hits: 4, n: 10 });
  const d = S.deriveCuts(s);
  assert.equal(d.monotone, true);
  assert.ok(d.tiers.filter((t) => t.items > 0).length < 3, "collapsed to fewer tiers");
});
