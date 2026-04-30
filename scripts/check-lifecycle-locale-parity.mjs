#!/usr/bin/env node
/**
 * Phase G.11 (Growth) — assert every lifecycle email template
 * exported from src/lib/templates.js has a matching counterpart in
 * src/lib/templates.es.js.
 *
 * The lifecycle program (welcome / saved-never-returned / monthly
 * digest / watch-score-swing) ships in EN+ES from day one. A drop
 * to one locale silently degrades the experience for the other —
 * fail CI on any export-name mismatch.
 *
 * Scope: every exported function name. Skips htmlShell/primaryCta/
 * helpers (not exported from templates.js public surface).
 *
 *   node scripts/check-lifecycle-locale-parity.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const EN_FILE = path.join(repoRoot, 'src/lib/templates.js');
const ES_FILE = path.join(repoRoot, 'src/lib/templates.es.js');

// Exports that are EN-only by design — the ES file delegates to a
// helper that lives in EN (e.g., shared CSS shells). Keep this set
// intentional and small so it can't be a hiding place for drift.
const EN_ONLY = new Set([
  // pickLocale is the EN-side dispatcher — every ES template is
  // called via "if (pickLocale(body) === 'es') return ES.fn(body)"
  // from the EN function. ES has no equivalent because by the time
  // an ES template fires, the dispatch has already happened.
  'pickLocale',
]);

function exportNames(file) {
  if (!fs.existsSync(file)) return new Set();
  const src = fs.readFileSync(file, 'utf8');
  const re = /^export\s+function\s+([A-Za-z0-9_]+)\s*\(/gm;
  const out = new Set();
  let m;
  while ((m = re.exec(src))) out.add(m[1]);
  return out;
}

const en = exportNames(EN_FILE);
const es = exportNames(ES_FILE);

const missingInEs = [];
const missingInEn = [];
for (const name of en) {
  if (EN_ONLY.has(name)) continue;
  if (!es.has(name)) missingInEs.push(name);
}
for (const name of es) {
  if (!en.has(name)) missingInEn.push(name);
}

if (missingInEs.length || missingInEn.length) {
  console.error(`Lifecycle locale parity: ${missingInEs.length + missingInEn.length} drift(s):`);
  for (const n of missingInEs) console.error(`  ✗ EN exports ${n} but ES does not`);
  for (const n of missingInEn) console.error(`  ✗ ES exports ${n} but EN does not`);
  process.exit(1);
}
console.log(`Lifecycle locale parity: ${en.size} exported function(s) match across EN+ES.`);
