#!/usr/bin/env node
// Workshop subsystem aggregate test runner.
//
// Runs every test + check script that exercises the Phase 1–5
// Workshop surface (auth, Save, Watch, /account/, editorial moves)
// in one command. Each child runs as a separate node process so a
// failure in one suite doesn't poison module state for the next.
//
// Exit code: 0 if all green, 1 if any single suite fails. The
// output groups each suite under its own heading so a CI run is
// scannable.
//
// Usage:
//   node scripts/test-workshop.mjs
//
// Adding a test: append the script path + a short label below.
// Keep the list explicit (not a glob) so the matrix stays curated
// — running ALL tests/* in glob form pulls in unrelated audit-tool
// tests that are slower and less relevant to the Workshop subsystem.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const REPO       = path.resolve(__dirname, '..');

const SUITES = [
  // Sprint 0/1 cross-cutting: locale parity is the gate that
  // catches every EN-but-not-ES drift across all the Workshop
  // surfaces (sign-in, /workbench/, /account/, the seven Save
  // tools, and the homepage).
  { label: 'Locale parity (EN ↔ ES)',          cmd: 'check-locale-parity.mjs', args: ['--check'] },
  { label: 'CSS token drift',                  cmd: 'check-css-drift.mjs',     args: [] },
  { label: 'Tool-card QA assertions',          cmd: 'test-cards-qa.mjs',       args: [] },

  // Phase 1 — auth fix regression
  { label: 'Validation aliases (ts/_ts, hp/_gotcha)', cmd: 'test-validation-aliases.mjs', args: [] },

  // Phase 3 + Phase 4 — emails
  { label: 'Workshop email templates (auth + delete + watch)', cmd: 'test-email-templates-workshop.mjs', args: [] },

  // Phase 4 — Watch dispatch + threshold + JSON-LD detector
  { label: 'Watch checks (shouldNotify, kindLabel, recheckSchema, JSON-LD)', cmd: 'test-watch-checks.mjs', args: [] },

  // Existing intake/audit email regression — keeps the older
  // surfaces honest while the Workshop work lands. Kept last
  // because it's the largest and most expensive of the suites.
  { label: 'Intake / audit / checklist email templates (D9/D10)', cmd: 'test-email-templates.mjs', args: [] },
];

let failed = [];
let total  = 0;

for (const suite of SUITES) {
  const scriptPath = path.join(REPO, 'scripts', suite.cmd);
  if (!existsSync(scriptPath)) {
    console.log('\n== ' + suite.label + ' ==');
    console.log('SKIP — script not found at scripts/' + suite.cmd);
    failed.push(suite.label + '  (missing script)');
    continue;
  }
  console.log('\n== ' + suite.label + ' ==');
  total++;
  const res = spawnSync(process.execPath, [scriptPath, ...suite.args], {
    cwd: REPO,
    stdio: 'inherit',
    env: process.env,
  });
  if (res.status !== 0) {
    failed.push(suite.label + '  (exit ' + res.status + ')');
  }
}

console.log('\n' + '='.repeat(60));
if (failed.length === 0) {
  console.log('✓ Workshop test suite: ' + total + '/' + total + ' green');
  process.exit(0);
} else {
  console.error('✗ Workshop test suite: ' + (total - failed.length) + '/' + total + ' green; ' + failed.length + ' failed:');
  for (const line of failed) console.error('  - ' + line);
  process.exit(1);
}
