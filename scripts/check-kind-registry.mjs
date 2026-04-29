#!/usr/bin/env node
/**
 * Phase C.1 — assert the four sources of truth for the closed
 * `kind` enum agree:
 *
 *   1. ALLOWED_KINDS    in src/lib/workbench.js (server source of truth)
 *   2. KIND_REGISTRY    in workbench/index.html (EN client UI)
 *   3. KIND_REGISTRY    in es/workbench/index.html (ES client UI)
 *   4. WATCHABLE_KINDS  in src/lib/workbench.js (server) ↔ entries
 *      with `watchable: true` in KIND_REGISTRY (client)
 *
 * Without this check the new `storefront-health` entry would
 * typically end up in 2 of 4 places and the failure would only
 * surface when a user clicked an "Open" link.
 *
 * Usage:
 *   node scripts/check-kind-registry.mjs --check
 *
 * Exits 0 on agreement; 1 with a clear diff otherwise.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const SERVER_FILE = path.join(repoRoot, 'src', 'lib', 'workbench.js');
const EN_FILE     = path.join(repoRoot, 'workbench', 'index.html');
const ES_FILE     = path.join(repoRoot, 'es', 'workbench', 'index.html');

function extractAllowedKinds(src) {
  const m = src.match(/const ALLOWED_KINDS = new Set\(\[([\s\S]*?)\]\)/);
  if (!m) return null;
  return [...m[1].matchAll(/'([^']+)'/g)].map((mm) => mm[1]);
}

function extractWatchableKinds(src) {
  const m = src.match(/const WATCHABLE_KINDS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  if (!m) return null;
  return [...m[1].matchAll(/'([^']+)'/g)].map((mm) => mm[1]);
}

function extractKindRegistry(src) {
  const m = src.match(/var KIND_REGISTRY\s*=\s*\{([\s\S]*?)\n\s*\};/);
  if (!m) return null;
  const body = m[1];
  const out = { kinds: [], watchable: [] };
  // Match each entry: 'key': { ..., watchable: true|false }
  // Or unquoted key form: key: { ... }
  const re = /(?:'([^']+)'|([\w-]+))\s*:\s*\{[^}]*watchable:\s*(true|false)/g;
  let mm;
  while ((mm = re.exec(body))) {
    const k = mm[1] || mm[2];
    out.kinds.push(k);
    if (mm[3] === 'true') out.watchable.push(k);
  }
  return out;
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
  return true;
}

function main() {
  const serverSrc = fs.readFileSync(SERVER_FILE, 'utf8');
  const enSrc     = fs.readFileSync(EN_FILE, 'utf8');
  const esSrc     = fs.readFileSync(ES_FILE, 'utf8');

  const allowed   = extractAllowedKinds(serverSrc);
  const watchable = extractWatchableKinds(serverSrc);
  const enReg     = extractKindRegistry(enSrc);
  const esReg     = extractKindRegistry(esSrc);

  const failures = [];

  if (!allowed)   failures.push('Could not parse ALLOWED_KINDS in src/lib/workbench.js');
  if (!watchable) failures.push('Could not parse WATCHABLE_KINDS in src/lib/workbench.js');
  if (!enReg)     failures.push('Could not parse KIND_REGISTRY in workbench/index.html');
  if (!esReg)     failures.push('Could not parse KIND_REGISTRY in es/workbench/index.html');

  if (allowed && enReg && !arraysEqual(allowed, enReg.kinds)) {
    const a = new Set(allowed); const b = new Set(enReg.kinds);
    failures.push('ALLOWED_KINDS ↔ EN KIND_REGISTRY mismatch — ' +
      'server-only: [' + [...a].filter(x => !b.has(x)).join(', ') + '] ' +
      'client-only: [' + [...b].filter(x => !a.has(x)).join(', ') + ']');
  }
  if (allowed && esReg && !arraysEqual(allowed, esReg.kinds)) {
    const a = new Set(allowed); const b = new Set(esReg.kinds);
    failures.push('ALLOWED_KINDS ↔ ES KIND_REGISTRY mismatch — ' +
      'server-only: [' + [...a].filter(x => !b.has(x)).join(', ') + '] ' +
      'client-only: [' + [...b].filter(x => !a.has(x)).join(', ') + ']');
  }
  if (watchable && enReg && !arraysEqual(watchable, enReg.watchable)) {
    const a = new Set(watchable); const b = new Set(enReg.watchable);
    failures.push('WATCHABLE_KINDS ↔ EN watchable mismatch — ' +
      'server-only: [' + [...a].filter(x => !b.has(x)).join(', ') + '] ' +
      'client-only: [' + [...b].filter(x => !a.has(x)).join(', ') + ']');
  }
  if (watchable && esReg && !arraysEqual(watchable, esReg.watchable)) {
    const a = new Set(watchable); const b = new Set(esReg.watchable);
    failures.push('WATCHABLE_KINDS ↔ ES watchable mismatch — ' +
      'server-only: [' + [...a].filter(x => !b.has(x)).join(', ') + '] ' +
      'client-only: [' + [...b].filter(x => !a.has(x)).join(', ') + ']');
  }

  if (failures.length) {
    console.error('Kind registry:');
    for (const f of failures) console.error('  ✗ ' + f);
    process.exit(1);
  }
  console.log(`Kind registry: ${allowed.length} kinds (${watchable.length} watchable) agreed across server + EN + ES.`);
}

main();
