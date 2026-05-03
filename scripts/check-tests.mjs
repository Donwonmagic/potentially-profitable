#!/usr/bin/env node
/**
 * Wave A unit-test runner — node:test aggregator.
 *
 * Runs every *.test.mjs file in tools/ via node's built-in test
 * runner. Zero deps. Prints a one-line per-file pass/fail summary
 * and exits 1 on any failure.
 *
 *   node scripts/check-tests.mjs
 *
 * Wire into scripts/check-all.mjs alongside the other guards as
 * the test suite grows. Today the suite covers Wave A foundation:
 *   - tools/_shared/menu-schema.test.mjs
 *   - tools/menu-design/state/reducer.test.mjs
 *   - tools/menu-design/data/allergens.test.mjs
 *
 * Each new module ships its tests next to the source — no central
 * test directory. The runner discovers them by glob.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.isFile() && /\.test\.mjs$/.test(entry.name)) yield p;
  }
}

const ROOTS = ['tools', 'scripts'];
const files = [];
for (const root of ROOTS) {
  const abs = path.join(repoRoot, root);
  if (fs.existsSync(abs)) for (const f of walk(abs)) files.push(f);
}
files.sort();

if (files.length === 0) {
  console.log('No test files found (looked in: ' + ROOTS.join(', ') + ').');
  process.exit(0);
}

console.log('node:test — running ' + files.length + ' test file(s)');
console.log('-'.repeat(64));

let totalPass = 0;
let totalFail = 0;
let totalDur  = 0;
const failed = [];

for (const file of files) {
  const rel = path.relative(repoRoot, file);
  const t0 = Date.now();
  // Use --test-reporter spec-like plain output; we only care about
  // the exit code + a brief pass/fail summary line.
  const r = spawnSync(process.execPath, ['--test', file], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  const dt = Date.now() - t0;
  totalDur += dt;
  // Parse "tests <n>" / "pass <n>" / "fail <n>" footer lines from
  // node's default reporter. Soft-fall-back to exit-code on missing.
  const tap = (r.stdout || '') + (r.stderr || '');
  const passMatch = tap.match(/^# pass (\d+)/m);
  const failMatch = tap.match(/^# fail (\d+)/m);
  const pass = passMatch ? parseInt(passMatch[1], 10) : 0;
  const fail = failMatch ? parseInt(failMatch[1], 10) : (r.status === 0 ? 0 : 1);
  totalPass += pass;
  totalFail += fail;
  const status = r.status === 0 ? 'PASS' : 'FAIL';
  console.log(status.padEnd(5) + ' ' + rel.padEnd(54) + (pass + '/' + (pass + fail)).padStart(7) + '  ' + dt + 'ms');
  if (r.status !== 0) {
    failed.push({ rel, output: tap });
  }
}

console.log('-'.repeat(64));
console.log('Total: ' + totalPass + ' pass, ' + totalFail + ' fail across ' + files.length + ' file(s) in ' + totalDur + 'ms');

if (failed.length > 0) {
  console.log('');
  console.log('Failures:');
  for (const f of failed) {
    console.log('---', f.rel, '---');
    console.log(f.output.split('\n').slice(0, 80).join('\n'));
  }
  process.exit(1);
}
process.exit(0);
