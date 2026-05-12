#!/usr/bin/env node
/**
 * Build-time gate — every `/api/...` fetch in the restaurant audit
 * page must carry a `signal:` option. Without one, a hanging origin
 * (slow CDN, dead worker, network blip) can make the audit loader
 * spin forever — that's the Tacombi-hang failure mode the user
 * reported, traced to two fetches with no client cap.
 *
 * This gate is belt-and-suspenders on top of the runtime 90s audit-
 * wide watchdog: it ensures the per-fetch caps stay in place as new
 * checks are added in Wave D and beyond. Catches drift at build time
 * instead of at hang-time in production.
 *
 *   node scripts/check-audit-fetch-timeouts.mjs --check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const TARGETS = [
  'tools/audits/restaurant/index.html',
  'es/tools/audits/restaurant/index.html',
];

const FETCH_RE = /fetch\(\s*(['"`])(\/api\/[^'"`]+)\1/g;

function findOptionsObject(src, fetchEnd) {
  // After the URL string, the next non-whitespace non-comma char should
  // be the start of the options object `{`. We scan forward, allowing
  // for `, ` and concatenation like `+ params.toString()` or template
  // literals. The options object is the second arg to fetch.
  let i = fetchEnd;
  // Walk to first comma at paren-depth 0 (still inside the fetch call).
  let depth = 0;
  let inStr = null;
  while (i < src.length) {
    const c = src[i];
    if (inStr) {
      if (c === inStr && src[i - 1] !== '\\') inStr = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; i++; continue; }
    if (c === '(' || c === '{' || c === '[') { depth++; i++; continue; }
    if (c === ')' || c === '}' || c === ']') {
      if (depth === 0) return null;
      depth--; i++; continue;
    }
    if (c === ',' && depth === 0) { i++; break; }
    i++;
  }
  // i is just past the comma separator. Walk past whitespace.
  while (i < src.length && /\s/.test(src[i])) i++;
  if (src[i] !== '{') return null;
  // Find matching close brace.
  const start = i;
  depth = 0;
  inStr = null;
  while (i < src.length) {
    const c = src[i];
    if (inStr) {
      if (c === inStr && src[i - 1] !== '\\') inStr = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; i++; continue; }
    if (c === '{' || c === '(' || c === '[') depth++;
    else if (c === '}' || c === ')' || c === ']') {
      depth--;
      if (c === '}' && depth === 0) return src.slice(start, i + 1);
    }
    i++;
  }
  return null;
}

function lineNumber(src, offset) {
  let n = 1;
  for (let i = 0; i < offset; i++) if (src[i] === '\n') n++;
  return n;
}

const failures = [];
let scanned = 0;

for (const rel of TARGETS) {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) {
    failures.push(`${rel}: file missing`);
    continue;
  }
  const src = fs.readFileSync(full, 'utf8');
  FETCH_RE.lastIndex = 0;
  let m;
  while ((m = FETCH_RE.exec(src))) {
    scanned++;
    // m.index points to "fetch("; the URL closing quote ends the match
    const afterUrl = FETCH_RE.lastIndex; // just past the closing quote
    const opts = findOptionsObject(src, afterUrl);
    const path_ = m[2];
    const ln = lineNumber(src, m.index);
    if (!opts) {
      failures.push(`${rel}:${ln}: fetch('${path_}') has no options object — add { signal: MuntinFetchError.safeAbortSignal(MS) }`);
      continue;
    }
    if (!/\bsignal\s*:/.test(opts)) {
      failures.push(`${rel}:${ln}: fetch('${path_}') options object missing 'signal:' — add signal: MuntinFetchError.safeAbortSignal(MS)`);
    }
  }
}

if (failures.length) {
  console.error(`Audit fetch-signal gate: ${failures.length} drift(s):`);
  for (const f of failures) console.error('  ✗ ' + f);
  console.error('\nEvery /api/... fetch in the audit module must carry a signal: option.');
  console.error('Without one, a stalled origin can hang the audit loader indefinitely.');
  process.exit(1);
}
console.log(`Audit fetch-signal gate: all ${scanned} /api/ fetch(es) across ${TARGETS.length} target(s) carry a signal: option.`);
