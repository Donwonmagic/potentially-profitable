/**
 * cost-conformal.vectors.test.mjs — EXACT golden-vector parity for the conformal band.
 *
 * The behaviour suite (cost-conformal.test.mjs) checks coverage with tolerance bands;
 * this one checks the FULL output to the last digit against the committed fixture
 * (cost-conformal.vectors.json, written by scripts/build-conformal-vectors.mjs). The
 * Muntin Ledger TS port runs the identical fixture, so any numeric drift between the
 * two implementations is a failure here, not a silent divergence. If this fails after
 * an intentional math change, regenerate the fixture (and re-copy to Ledger) in the
 * same commit as the ported change — never hand-edit the JSON to make it pass.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { conformalNext } = require('./cost-conformal.js');
const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = JSON.parse(readFileSync(path.join(here, 'cost-conformal.vectors.json'), 'utf8'));

test('golden vectors exist and exercise every branch (healthy, calibrated, null-coverage, degenerate)', () => {
  const names = FIXTURE.vectors.map((v) => v.name);
  assert.ok(FIXTURE.vectors.length >= 8, 'a real battery, not a token case');
  assert.ok(FIXTURE.vectors.some((v) => v.expect && v.expect.coverage != null), 'a publishable-coverage case');
  assert.ok(FIXTURE.vectors.some((v) => v.expect && v.expect.coverage == null), 'a withhold (null-coverage) case');
  assert.ok(FIXTURE.vectors.some((v) => v.expect && v.expect.degenerate === true), 'a degenerate (flat) case');
  assert.ok(FIXTURE.vectors.some((v) => v.expect && v.expect.scale > 1), 'a calibration (widened) case');
  assert.equal(new Set(names).size, names.length, 'vector names are unique');
});

for (const v of FIXTURE.vectors) {
  test('vector reproduces byte-for-byte: ' + v.name, () => {
    const got = conformalNext(v.input.values, v.input.opts);
    assert.deepEqual(got, v.expect,
      'conformalNext output drifted from the golden fixture — if this was an intentional math change, regenerate cost-conformal.vectors.json (both repos) in the same commit');
  });
}
