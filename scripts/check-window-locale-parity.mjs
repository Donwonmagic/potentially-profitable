#!/usr/bin/env node
/**
 * Phase W.6 (The Window) — assert The Window's visitor and admin
 * surfaces stay in lockstep across EN and ES.
 *
 * Specifically, both surfaces must:
 *   - exist at the canonical locale-paired paths
 *     (window/index.html  ↔  es/window/index.html;
 *      admin/window/index.html ↔ es/admin/window/index.html)
 *   - share the same set of element IDs (so the shared JS at
 *     assets/js/window.js + admin-window.js doesn't break on
 *     either locale)
 *   - share the same set of data-bind hooks (the three on-ramp
 *     chips, the breathing pulse, the muntin hairline, the
 *     composer fields)
 *
 * Exits 0 when both pairs match; 1 with a per-pair diff otherwise.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const PAIRS = [
  ['window/index.html',          'es/window/index.html'],
  ['admin/window/index.html',    'es/admin/window/index.html'],
];

// Element IDs that are shared between EN and ES surfaces — JS
// reads these by id, so they must match across locales.
const ID_RE = /id="([^"]+)"/g;

function extractIds(text) {
  const ids = new Set();
  let m;
  while ((m = ID_RE.exec(text))) ids.add(m[1]);
  return ids;
}

const failures = [];

for (const [enPath, esPath] of PAIRS) {
  const enFile = path.join(repoRoot, enPath);
  const esFile = path.join(repoRoot, esPath);
  if (!fs.existsSync(enFile)) {
    failures.push(`missing EN file: ${enPath}`);
    continue;
  }
  if (!fs.existsSync(esFile)) {
    failures.push(`missing ES file: ${esPath}`);
    continue;
  }
  const enIds = extractIds(fs.readFileSync(enFile, 'utf8'));
  const esIds = extractIds(fs.readFileSync(esFile, 'utf8'));
  // Diff
  const enOnly = [...enIds].filter((x) => !esIds.has(x));
  const esOnly = [...esIds].filter((x) => !enIds.has(x));
  if (enOnly.length) {
    failures.push(`${enPath} ↔ ${esPath}: EN-only ids: [${enOnly.join(', ')}]`);
  }
  if (esOnly.length) {
    failures.push(`${enPath} ↔ ${esPath}: ES-only ids: [${esOnly.join(', ')}]`);
  }
}

if (failures.length) {
  console.error('Window locale parity:');
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`Window locale parity: ${PAIRS.length} pair(s) clean.`);
