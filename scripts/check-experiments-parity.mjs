#!/usr/bin/env node
/**
 * Phase G.12 (Growth) — assert the EXPERIMENTS const in
 * src/worker.js is in sync with data/experiments.json (the
 * dashboard's source of truth).
 *
 * Drift between them means /admin/kpis/ shows one set of
 * experiments while the runtime A/B HTMLRewriter ships another.
 * Catch that before deploy.
 *
 *   node scripts/check-experiments-parity.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const JSON_FILE   = path.join(repoRoot, 'data/experiments.json');
const WORKER_FILE = path.join(repoRoot, 'src/worker.js');

if (!fs.existsSync(JSON_FILE)) {
  console.error('data/experiments.json missing.');
  process.exit(1);
}
if (!fs.existsSync(WORKER_FILE)) {
  console.error('src/worker.js missing.');
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
const jsonExperiments = json.experiments || {};

const workerSrc = fs.readFileSync(WORKER_FILE, 'utf8');

const failures = [];
for (const name of Object.keys(jsonExperiments)) {
  // Worker EXPERIMENTS const must reference the same key.
  if (!workerSrc.includes(`'${name}'`)) {
    failures.push(`experiment "${name}": present in data/experiments.json but absent from src/worker.js EXPERIMENTS`);
  }
}

// Inverse direction: pull the EXPERIMENTS keys from worker.js by a
// loose regex so we catch experiments running in code with no
// dashboard registration.
const expBlockM = workerSrc.match(/const\s+EXPERIMENTS\s*=\s*Object\.freeze\(\{([\s\S]*?)\n\}\)/);
if (expBlockM) {
  const keyRe = /'([a-z0-9-]+)'\s*:\s*\{/g;
  let m;
  while ((m = keyRe.exec(expBlockM[1]))) {
    if (!jsonExperiments[m[1]]) {
      failures.push(`experiment "${m[1]}": present in src/worker.js but absent from data/experiments.json`);
    }
  }
}

if (failures.length) {
  console.error(`Experiments parity: ${failures.length} drift(s):`);
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`Experiments parity: ${Object.keys(jsonExperiments).length} experiment(s) match across data/experiments.json + src/worker.js.`);
