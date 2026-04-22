#!/usr/bin/env node
// Phase 4 #1: benchmark-metadata regression test.
// Run via: `node scripts/test-benchmark-metadata.mjs`
//
// The original statistical audit flagged the subtype-benchmark chip
// as the single biggest credibility gap in the tool: owners saw
// "typical fine-dining sites score 68" with zero provenance — no
// sample size, no date, no methodology. This sprint adds a shared
// RESTAURANT_BENCHMARK_METADATA object and a subtypeBenchmarkWith-
// Metadata(id) helper that callers use to render an honest tooltip.
//
// These tests lock in the metadata shape so a future edit can't
// silently drop a field the score-card tooltip depends on, and
// verify the lookup function for every supported subtype + legacy
// alias + malformed input. Exits non-zero on failure.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const S = require('../tools/audits/restaurant/subtypes.js');
const {
  RESTAURANT_BENCHMARK_METADATA,
  RESTAURANT_SUBTYPE_BENCHMARKS,
  RESTAURANT_SUBTYPE_IDS,
  subtypeBenchmark,
  subtypeBenchmarkWithMetadata
} = S;

let failures = 0;
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label + (cond ? '' : '  ' + (detail || '')));
  if (!cond) failures++;
}
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}

// --- Metadata object shape -----------------------------------------
{
  const m = RESTAURANT_BENCHMARK_METADATA;
  assert('metadata.source is non-empty string',
    typeof m.source === 'string' && m.source.length > 0);
  assert('metadata.methodology is non-empty string',
    typeof m.methodology === 'string' && m.methodology.length > 0);
  assert('metadata.lastUpdated matches YYYY-MM format',
    typeof m.lastUpdated === 'string' && /^\d{4}-\d{2}$/.test(m.lastUpdated),
    'got: ' + JSON.stringify(m.lastUpdated));
  assert('metadata.refreshStatus is an expected enum value',
    m.refreshStatus === 'provisional' || m.refreshStatus === 'refreshed');
  assert('metadata.sampleSize is null OR positive number',
    m.sampleSize === null || (typeof m.sampleSize === 'number' && m.sampleSize > 0));
}

// --- Methodology disclosure honest ---------------------------------
// The whole point of Phase 4 #1 is to disclose that the current
// scores are operator estimates, not sampled data. The methodology
// string must include explicit hedging language so the chip
// tooltip cannot be mistaken for a statistical claim.
{
  const m = RESTAURANT_BENCHMARK_METADATA.methodology.toLowerCase();
  const hasHedge = m.indexOf('estimated') >= 0
                || m.indexOf('estimate')  >= 0
                || m.indexOf('provisional') >= 0
                || m.indexOf('manual review') >= 0;
  assert('methodology string contains hedging language', hasHedge,
    'got: ' + RESTAURANT_BENCHMARK_METADATA.methodology);
}

// --- subtypeBenchmarkWithMetadata for every canonical id ----------
{
  for (const id of RESTAURANT_SUBTYPE_IDS) {
    const out = subtypeBenchmarkWithMetadata(id);
    assert(id + ': returns object', out && typeof out === 'object');
    if (!out) continue;
    assert(id + ': scores present',    out.scores && typeof out.scores.overall === 'number');
    assert(id + ': methodology present', typeof out.methodology === 'string' && out.methodology.length > 0);
    assert(id + ': lastUpdated present', typeof out.lastUpdated === 'string');
    assert(id + ': refreshStatus present', typeof out.refreshStatus === 'string');
  }
}

// --- scores match subtypeBenchmark (no drift) ----------------------
// The metadata-wrapped helper must return the EXACT same scores the
// scores-only helper returns. A future edit that adds a scaling
// factor in one path but not the other would break every chip.
{
  for (const id of RESTAURANT_SUBTYPE_IDS) {
    const plain = subtypeBenchmark(id);
    const withMeta = subtypeBenchmarkWithMetadata(id);
    assertEq(id + ': scores match plain lookup', withMeta.scores, plain);
  }
}

// --- Legacy aliases still resolve ----------------------------------
{
  const casual = subtypeBenchmarkWithMetadata('casual');          // -> casual-dining
  const pub    = subtypeBenchmarkWithMetadata('pub');             // -> bar-pub
  const coffee = subtypeBenchmarkWithMetadata('coffee-shop');     // -> cafe
  assert('casual alias resolves',       casual && casual.scores);
  assert('pub alias resolves',          pub    && pub.scores);
  assert('coffee-shop alias resolves',  coffee && coffee.scores);
  assertEq('casual scores match casual-dining',
    casual.scores, RESTAURANT_SUBTYPE_BENCHMARKS['casual-dining']);
}

// --- Malformed / missing ids return null ---------------------------
assertEq('null id returns null',                subtypeBenchmarkWithMetadata(null),             null);
assertEq('undefined id returns null',           subtypeBenchmarkWithMetadata(undefined),        null);
assertEq('unknown id returns null',             subtypeBenchmarkWithMetadata('not-real'),       null);
assertEq('empty-string id returns null',        subtypeBenchmarkWithMetadata(''),               null);
assertEq('numeric id returns null',             subtypeBenchmarkWithMetadata(42),               null);

// --- Refresh status consistent across all subtypes ----------------
// Today every subtype is 'provisional' (shared metadata). When the
// refresh pipeline lands and flips individual subtypes to
// 'refreshed', the shape expands — this test will need to be
// updated at that time, but for now verifies the consistency.
{
  const statuses = new Set();
  for (const id of RESTAURANT_SUBTYPE_IDS) {
    const out = subtypeBenchmarkWithMetadata(id);
    statuses.add(out.refreshStatus);
  }
  assertEq(
    'every subtype currently has the same refreshStatus',
    [...statuses], ['provisional']);
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll benchmark-metadata tests passed.');
