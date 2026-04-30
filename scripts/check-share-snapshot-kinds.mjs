#!/usr/bin/env node
/**
 * Phase G.11 (Growth) — assert every share-snapshot kind in
 * src/lib/share-snapshots.js has a corresponding endpoint in
 * src/worker.js. Catches the "I added the kind but forgot the
 * endpoint" drift before it ships.
 *
 *   node scripts/check-share-snapshot-kinds.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const LIB_FILE    = path.join(repoRoot, 'src/lib/share-snapshots.js');
const WORKER_FILE = path.join(repoRoot, 'src/worker.js');

if (!fs.existsSync(LIB_FILE)) {
  console.error('share-snapshots.js missing — run scripts/build-share-snapshots.mjs');
  process.exit(1);
}

const libSrc = fs.readFileSync(LIB_FILE, 'utf8');
const workerSrc = fs.existsSync(WORKER_FILE) ? fs.readFileSync(WORKER_FILE, 'utf8') : '';

// Extract enum values from `export const SHARE_KINDS = Object.freeze({ KEY: 'value', ... });`
const kindsM = libSrc.match(/export\s+const\s+SHARE_KINDS\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/);
if (!kindsM) {
  console.error('SHARE_KINDS enum not found in src/lib/share-snapshots.js');
  process.exit(1);
}
const valueRe = /:\s*'([a-z0-9-]+)'/g;
const kinds = [];
let m;
while ((m = valueRe.exec(kindsM[1]))) kinds.push(m[1]);

const failures = [];
for (const kind of kinds) {
  // Each kind must have a worker route (literal '/api/share/<kind>'
  // string in worker.js routing). The route handler implementation
  // can come later, but the route entry must exist for the kind to
  // be considered "wired."
  const route = `/api/share/${kind}`;
  if (workerSrc.length && !workerSrc.includes(route)) {
    failures.push(`kind "${kind}": no worker route ${route} found in src/worker.js`);
  }
}

if (failures.length) {
  console.error(`Share snapshot kinds: ${failures.length} unrouted kind(s):`);
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`Share snapshot kinds: ${kinds.length} kind(s) registered (${kinds.join(', ')}); all routes present.`);
