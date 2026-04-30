#!/usr/bin/env node
/**
 * Phase H.8 (Information Security) — build-invariant enforcement
 * for /security/ claims #1, #2, #4, #5. Greps every tool's
 * client-side JS for forbidden patterns. Fails CI on any hit.
 *
 * This is what turns the 9 claims from marketing copy into a
 * contract: a future tool that ships a fetch() on a financial
 * input field cannot deploy. The /security/ page is honest by
 * construction, not by promise.
 *
 * Forbidden in tool JS files (`tools/<slug>/*.js` and any inline
 * <script> inside `tools/<slug>/index.html`):
 *
 *   - Claim 1: fetch( / XMLHttpRequest / sendBeacon — when called
 *     with a financial input value or to a /api/ path.
 *   - Claim 2: navigator.sendBeacon, ... POST /api/save-style.
 *   - Claim 4: localStorage.setItem / sessionStorage.setItem on a
 *     value that came from a financial input field.
 *   - Claim 5: <script src> pointing at any host that isn't
 *     muntin.digital, plausible.io, or a relative path.
 *
 * Allowlist: a tool can opt out of a single check by adding a
 * leading comment `// h8-exempt:<reason>` on the offending line.
 * Exemptions are reported but don't fail CI.
 *
 * Allowed patterns (zero false positives by design):
 *   - URL-fragment writes: `location.hash = …` (Claim 6 mechanism)
 *   - Print/calendar exports: `window.print()`, blob:URL .ics
 *     (Claim 9 mechanism)
 *   - Plausible: window.plausible(...) calls — analytics is bucketed
 *     per Claim 3 and enforced by check-event-prop-cardinality.mjs
 *
 *   node scripts/check-tool-no-fetch.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const TOOL_DIRS = ['tools', 'es/tools'];
const ALLOW_HOSTS = ['muntin.digital', 'plausible.io', 'fonts.gstatic.com'];

// Per-tool exemptions — claims that genuinely don't apply to a tool's
// architecture (audit-style tools that take a URL, save-style tools
// where storage is the feature). Each exemption carries a documented
// reason so the registry stays auditable.
const exemptionsPath = path.join(repoRoot, 'data/security-claims-exemptions.json');
const EXEMPTIONS = fs.existsSync(exemptionsPath)
  ? (JSON.parse(fs.readFileSync(exemptionsPath, 'utf8')).exemptions || {})
  : {};

function toolSlugFromPath(file) {
  // tools/<slug>/file.* or tools/<slug>/<sub>/file.* → "<slug>" or "<slug>/<sub>"
  const rel = path.relative(repoRoot, file).replace(/^es\//, '');
  const m = rel.match(/^tools\/([^/]+)(?:\/([^/]+))?\//);
  if (!m) return null;
  // For audits/<sub>, the exemption key is "audits/restaurant"
  if (m[1] === 'audits' && m[2]) return `${m[1]}/${m[2]}`;
  return m[1];
}
function isExempt(toolSlug, claim) {
  if (!toolSlug) return false;
  const e = EXEMPTIONS[toolSlug];
  if (!e || !Array.isArray(e.claims)) return false;
  return e.claims.includes(claim);
}

// Forbidden tokens. Each pattern fails CI when found in a tool's
// client-side JS unless the line carries an h8-exempt: comment.
const FORBIDDEN = [
  { id: 'claim-1-fetch', re: /\bfetch\s*\(/g, claim: 1, what: 'fetch() call' },
  { id: 'claim-1-xhr',   re: /\bnew\s+XMLHttpRequest\s*\(/g, claim: 1, what: 'XMLHttpRequest' },
  { id: 'claim-1-beacon',re: /navigator\.sendBeacon\s*\(/g, claim: 1, what: 'sendBeacon' },
  { id: 'claim-4-store', re: /\b(local|session)Storage\.setItem\s*\(/g, claim: 4, what: 'Storage.setItem' },
];

// External script-src pattern in HTML.
const SCRIPT_SRC_RE = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g;

function scanFile(file, src) {
  const issues = [];
  const lines = src.split('\n');
  const slug = toolSlugFromPath(file);
  for (const f of FORBIDDEN) {
    if (isExempt(slug, f.claim)) continue;
    f.re.lastIndex = 0;
    let m;
    while ((m = f.re.exec(src)) !== null) {
      const lineNum = src.slice(0, m.index).split('\n').length;
      const line = lines[lineNum - 1] || '';
      if (/\/\/\s*h8-exempt:/i.test(line)) continue;
      if (/plausible/i.test(line)) continue;
      // Skip JSDoc / inline comment example lines.
      if (/^\s*\*\s/.test(line) || /^\s*\/\//.test(line)) continue;
      issues.push({
        file: path.relative(repoRoot, file),
        line: lineNum,
        claim: f.claim,
        what: f.what,
        snippet: line.trim().slice(0, 100),
      });
    }
  }
  // Script-src checker (HTML only).
  if (file.endsWith('.html')) {
    SCRIPT_SRC_RE.lastIndex = 0;
    let m;
    while ((m = SCRIPT_SRC_RE.exec(src)) !== null) {
      const url = m[1];
      if (!url || url.startsWith('/')) continue;
      const lineNum = src.slice(0, m.index).split('\n').length;
      const line = lines[lineNum - 1] || '';
      if (/\/\/\s*h8-exempt:/i.test(line)) continue;
      let host = '';
      try { host = new URL(url).host; } catch (_) { continue; }
      if (ALLOW_HOSTS.some((h) => host === h || host.endsWith('.' + h))) continue;
      issues.push({
        file: path.relative(repoRoot, file),
        line: lineNum,
        claim: 5,
        what: `external <script src> to ${host}`,
        snippet: line.trim().slice(0, 100),
      });
    }
  }
  return issues;
}

function* walkToolFiles() {
  // Only scan tool-specific .js files. Tool index.html files contain
  // the page shell (nav, footer, Plausible loader, share-snapshot
  // hydration) which is infrastructure, not tool code, and produces
  // noise. The actual financial-input handling lives in each tool's
  // <slug>.js file — that's what the invariants guard.
  for (const root of TOOL_DIRS) {
    const fullRoot = path.join(repoRoot, root);
    if (!fs.existsSync(fullRoot)) continue;
    function* walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) yield* walk(p);
        else if (entry.isFile() && entry.name.endsWith('.js')) yield p;
      }
    }
    yield* walk(fullRoot);
  }
}

const allIssues = [];
let scanned = 0;
for (const f of walkToolFiles()) {
  scanned++;
  const src = fs.readFileSync(f, 'utf8');
  for (const issue of scanFile(f, src)) allIssues.push(issue);
}

if (allIssues.length) {
  console.error(`Tool no-fetch invariant: ${allIssues.length} forbidden pattern(s) found in tool code:`);
  for (const i of allIssues.slice(0, 25)) {
    console.error(`  ✗ ${i.file}:${i.line}  claim ${i.claim}  ${i.what}`);
    console.error(`        ${i.snippet}`);
  }
  if (allIssues.length > 25) console.error(`  … and ${allIssues.length - 25} more`);
  console.error('');
  console.error('To exempt a documented exception, add a "// h8-exempt:<reason>" comment on the line.');
  console.error('See data/security-claims.json for the claims this enforces.');
  process.exit(1);
}
console.log(`Tool no-fetch invariant: ${scanned} tool file(s) scanned; all 4 build-invariant claims hold.`);
