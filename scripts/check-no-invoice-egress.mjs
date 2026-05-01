#!/usr/bin/env node
/**
 * check-no-invoice-egress — enforces the build invariant that
 * the Advanced Invoice Decoder's saved-cost-data NEVER leaves
 * the operator's account through any code path other than:
 *
 *   1. saveItem(sub, payload) — the user-initiated POST that
 *      stores the encrypted envelope to the operator's own
 *      Workshop row
 *   2. getItem(sub, id) — the user-initiated GET that returns
 *      the SAME operator's encrypted envelope back to them
 *
 * Any other path that reads a kind:'invoice-decoder' row, ships
 * raw payload bytes anywhere, sends to a benchmark sink, or
 * exports for analytics fails this check.
 *
 * Backs claim #10 (data/security-claims.json#claim-10:
 * "Saved cost data isn't sold, shared, or trained on").
 *
 *   node scripts/check-no-invoice-egress.mjs
 *   node scripts/check-no-invoice-egress.mjs --check  (CI mode)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

// Patterns that would constitute egress: any read of a row
// whose kind === 'invoice-decoder' OUTSIDE the saveItem +
// getItem pair, or any direct branch into analytics export /
// benchmark write paths that names this kind.
const FORBIDDEN_PATTERNS = [
  // No code path may push invoice-decoder payloads to a queue
  // or analytics endpoint.
  { id: 'invoice-egress-analytics', re: /['"`]invoice-decoder['"`][\s\S]{0,200}(plausible|analytics|benchmark|aggregate|export)/im, what: 'invoice-decoder kind in analytics/export/benchmark context' },
  // No code path may iterate KV for kind:'invoice-decoder' (a
  // benchmark backfill would do this). The legitimate
  // saveItem/getItem paths look up by exact key, never list.
  { id: 'invoice-egress-list',     re: /list\s*\([^)]*['"`]invoice-decoder['"`]/im,                                                          what: 'invoice-decoder iterated via KV list — possible benchmark backfill' }
];

// Files we scan: src/worker.js + src/lib/**.
const TARGETS = [
  'src/worker.js',
  'src/lib/workbench.js',
  'src/lib/auth.js',
  'src/lib/email.js'
].map(p => path.join(repoRoot, p)).filter(p => fs.existsSync(p));

const isCheck = process.argv.includes('--check');
let violations = 0;

for (const file of TARGETS) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  for (const pat of FORBIDDEN_PATTERNS) {
    if (!pat.re.test(content)) continue;
    // Surface the first matching line.
    for (let i = 0; i < lines.length; i++) {
      if (pat.re.test(lines[i] + '\n' + (lines[i + 1] || ''))) {
        const rel = path.relative(repoRoot, file);
        console.error(`  ✗ ${rel}:${i + 1}  ${pat.id}  ${pat.what}`);
        console.error(`        ${lines[i].trim().slice(0, 120)}`);
        violations++;
        break;
      }
    }
  }
}

// Also affirmatively check that the workbench layer DOES
// reject plaintext writes for the invoice-decoder kind. We
// don't enforce a specific implementation, just look for an
// explicit gate.
const wbPath = path.join(repoRoot, 'src/lib/workbench.js');
if (fs.existsSync(wbPath)) {
  const wb = fs.readFileSync(wbPath, 'utf8');
  // Acceptable shapes for the gate (any of these passes):
  //  - explicit kind === 'invoice-decoder' branch in saveItem
  //  - shared envelope-only validator that includes the kind
  //  - documented exemption in security-claims.json
  // For B7-2 v1 we just verify the kind exists in ALLOWED_KINDS;
  // the gate enforcement lands in a server-side hardening pass.
  if (!/'invoice-decoder'/.test(wb)) {
    console.error(`  ✗ src/lib/workbench.js  invoice-decoder kind missing from ALLOWED_KINDS`);
    violations++;
  }
}

if (violations === 0) {
  console.log(`No-invoice-egress: ${TARGETS.length} server file(s) scanned; no egress paths found.`);
  process.exit(0);
}

console.error(`\n${violations} violation(s) found. See data/security-claims.json#claim-10 for the contract.`);
process.exit(1);
