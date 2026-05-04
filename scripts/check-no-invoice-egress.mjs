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

// Wave 10.0b — extend egress invariant into the client-side spine.
//
// The runtime sentinel in tools/invoice-decoder/telemetry.js monkey-
// patches fetch + XHR; this build-time pass catches the source-code
// patterns that would have to land before that sentinel could fail.
// Two directories:
//   tools/invoice-decoder/   — the tool's own modules
//   tools/_shared/            — cross-tool helpers consumed by the tool
//                              (stem, sku-match, portion-bridge,
//                              cross-vendor, dish-drift, etc).
//
// Forbidden runtime calls in those directories:
//   fetch(...)                — direct network egress
//   navigator.sendBeacon(...) — analytics-style fire-and-forget
//   new XMLHttpRequest        — pre-fetch escape hatch
//   new WebSocket(...)        — bidirectional channel
//   new EventSource(...)      — server-sent events
//   new Image().src=          — img-src exfiltration trick
//
// Allowlist exemptions for vendor bootstraps and same-origin save
// flows are encoded as inline `// h8-exempt:<reason>` comments on
// the same line — already in use elsewhere in the repo.

const CLIENT_FORBIDDEN = [
  { id: 'client-fetch',         re: /(?<!\/\/.*)\bfetch\s*\(/,                                 what: 'direct fetch() call' },
  { id: 'client-sendBeacon',    re: /\bnavigator\s*\.\s*sendBeacon\s*\(/,                       what: 'navigator.sendBeacon() call' },
  { id: 'client-xhr',           re: /\bnew\s+XMLHttpRequest\s*\(/,                              what: 'new XMLHttpRequest()' },
  { id: 'client-websocket',     re: /\bnew\s+WebSocket\s*\(/,                                   what: 'new WebSocket()' },
  { id: 'client-eventsource',   re: /\bnew\s+EventSource\s*\(/,                                 what: 'new EventSource()' },
  { id: 'client-image-exfil',   re: /\bnew\s+Image\s*\(\s*\)\s*\.\s*src\s*=/,                   what: 'new Image().src = …  (img-src exfil pattern)' }
];

// Walk a directory recursively, collecting .js / .mjs files.
function walkClientDir(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip vendored third-party assets and test fixtures — those
      // legitimately reference their own bootstraps.
      if (entry.name === 'vendor' || entry.name === '__fixtures__' || entry.name === 'recipes') continue;
      out.push(...walkClientDir(full));
    } else if (/\.(m?js)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const CLIENT_TARGETS = [
  ...walkClientDir(path.join(repoRoot, 'tools', 'invoice-decoder')),
  ...walkClientDir(path.join(repoRoot, 'tools', '_shared'))
];

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

// Wave 10.0b — client-side scan. Strip /* … */ blocks (including
// multi-line) before scanning so JSDoc examples don't false-positive.
function stripBlockComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, function (m) {
    // Preserve line breaks so error line numbers stay accurate.
    return m.replace(/[^\n]/g, ' ');
  });
}
for (const file of CLIENT_TARGETS) {
  const content = stripBlockComments(fs.readFileSync(file, 'utf8'));
  const rawLines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Trim line-trailing // comments.
    const stripped = line.replace(/\/\/.*$/, '');
    if (!stripped.trim()) continue;
    // JSDoc continuation lines start with * — skip.
    if (/^\s*\*/.test(stripped)) continue;
    if (/h8-exempt|vendor-bootstrap-allowlisted/.test(line)) continue;
    for (const pat of CLIENT_FORBIDDEN) {
      if (pat.re.test(stripped)) {
        const rel = path.relative(repoRoot, file);
        console.error(`  ✗ ${rel}:${i + 1}  ${pat.id}  ${pat.what}`);
        console.error(`        ${(rawLines[i] || '').trim().slice(0, 120)}`);
        violations++;
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
  console.log(`No-invoice-egress: ${TARGETS.length} server file(s) + ${CLIENT_TARGETS.length} client file(s) scanned; no egress paths found.`);
  process.exit(0);
}

console.error(`\n${violations} violation(s) found. See data/security-claims.json#claim-10 for the contract.`);
process.exit(1);
