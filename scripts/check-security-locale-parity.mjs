#!/usr/bin/env node
/**
 * Phase H.8 — assert /security/ and /learn/checklists/audit-any-tool/
 * have ES mirrors with matching anchor IDs. Catches the drift where
 * a section is added on EN but its ES counterpart is forgotten.
 *
 *   node scripts/check-security-locale-parity.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const PAIRS = [
  ['security/index.html',                       'es/security/index.html'],
  ['learn/checklists/audit-any-tool/index.html','es/learn/checklists/audit-any-tool/index.html'],
];

function extractIds(src) {
  // Pull every id="…" on section / aside / article / h2 / h3 elements
  // we care about. Skip nav / breadcrumb / shell IDs.
  const out = new Set();
  const re = /<(?:section|aside|article|h[123])\b[^>]*\bid="([a-zA-Z0-9-]+)"/g;
  let m;
  while ((m = re.exec(src))) out.add(m[1]);
  return out;
}

const failures = [];
for (const [enPath, esPath] of PAIRS) {
  const enFull = path.join(repoRoot, enPath);
  const esFull = path.join(repoRoot, esPath);
  if (!fs.existsSync(enFull)) { failures.push(`${enPath}: missing`); continue; }
  if (!fs.existsSync(esFull)) { failures.push(`${esPath}: missing (ES mirror)`); continue; }
  const enIds = extractIds(fs.readFileSync(enFull, 'utf8'));
  const esIds = extractIds(fs.readFileSync(esFull, 'utf8'));
  for (const id of enIds) if (!esIds.has(id)) failures.push(`${esPath}: missing #${id} (present in EN)`);
  for (const id of esIds) if (!enIds.has(id)) failures.push(`${enPath}: missing #${id} (present in ES)`);
}

if (failures.length) {
  console.error(`Security locale parity: ${failures.length} drift(s):`);
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`Security locale parity: ${PAIRS.length} pair(s) clean — section IDs match across EN+ES.`);
