#!/usr/bin/env node
/**
 * Phase G.9 (Growth) — guard Plausible event-prop cardinality.
 *
 * Plausible has a hard limit on the number of unique (event, prop)
 * combinations per goal. Sending an unbounded value (a user's email,
 * a free-form URL path, a timestamp) explodes cardinality and starts
 * costing money + makes the dashboard useless.
 *
 * This check scans every plausible('Event', { props: { … } }) call
 * site and asserts each prop value is one of:
 *
 *   - a literal string  ('article', 'tool', 'glossary', …)
 *   - a constant from a known closed-enum file
 *     (assets/js/first-touch.js, tools/_shared/analytics.js)
 *   - a bucketed helper call  (bucketDays(...), bucketScore(...))
 *
 * It does NOT enforce that EVERY value is from an enum — that's
 * impractical without source-level type info. It DOES catch the
 * common drift patterns: passing user input, passing path strings,
 * passing timestamps, passing arbitrary URLs.
 *
 *   node scripts/check-event-prop-cardinality.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const SCAN_DIRS = ['assets/js', 'assets/site.js', 'tools', 'src'];
const SCAN_EXTS = new Set(['.js', '.mjs', '.html']);

function* walk(dir) {
  const stat = fs.statSync(dir, { throwIfNoEntry: false });
  if (!stat) return;
  if (stat.isFile()) { yield dir; return; }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.isFile() && SCAN_EXTS.has(path.extname(entry.name))) yield p;
  }
}

// Patterns to flag inside a `props: { ... }` argument.
// Each pattern matches a forbidden VALUE assigned directly to a prop —
// i.e. `: <forbidden> ,` or `: <forbidden> }`. A bucketing function
// wrapper around the same expression (e.g.
// `surface: shareLandingKind(location.pathname)`) is allowed.
const FORBIDDEN_VALUE_RES = [
  { name: 'raw location.href',     re: /:\s*(?:window\.|document\.)?location\.href\s*[,}]/ },
  { name: 'raw location.pathname', re: /:\s*(?:window\.|document\.)?location\.pathname\s*[,}]/ },
  { name: 'raw document.referrer', re: /:\s*document\.referrer\s*[,}]/ },
  { name: 'raw Date.now()',        re: /:\s*Date\.now\(\)\s*[,}]/ },
  { name: 'raw ISO timestamp',     re: /:\s*new\s+Date\(\)\.toISOString\(\)\s*[,}]/ },
  { name: 'email-shape prop name', re: /(?:^|[,{])\s*email\s*:/ },
  { name: 'unbounded id-like prop',re: /(?:^|[,{])\s*(token|userId|sessionId|hash|sha)\s*:/i },
];

const ALLOW_FILES = new Set([
  // Files that legitimately contain the patterns (this script + some
  // bucketing helpers) — exempt to keep the linter happy.
  path.join(repoRoot, 'scripts/check-event-prop-cardinality.mjs'),
  // first-touch.js intentionally reads document.referrer (host only),
  // location.pathname (only via detectLandingKind), and Date.now()
  // (for session bucketing) — none of these flow into prop values.
  path.join(repoRoot, 'assets/js/first-touch.js'),
]);

const PROPS_RE = /plausible\s*\(\s*['"][^'"]+['"]\s*,\s*\{\s*props\s*:\s*\{([^}]*)\}/g;

const failures = [];
let scanned = 0;
let plausibleCalls = 0;

for (const root of SCAN_DIRS) {
  const fullRoot = path.join(repoRoot, root);
  for (const file of walk(fullRoot)) {
    if (ALLOW_FILES.has(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    scanned++;
    let m;
    PROPS_RE.lastIndex = 0;
    while ((m = PROPS_RE.exec(src))) {
      plausibleCalls++;
      const propsBody = m[1];
      for (const f of FORBIDDEN_VALUE_RES) {
        if (f.re.test(propsBody)) {
          // Identify line number for better error messages.
          const before = src.slice(0, m.index);
          const line = (before.match(/\n/g) || []).length + 1;
          failures.push(`${path.relative(repoRoot, file)}:${line}  passes ${f.name} as a Plausible prop`);
        }
      }
    }
  }
}

if (failures.length) {
  console.error(`Plausible event prop cardinality: ${failures.length} unbounded call(s):`);
  for (const f of failures) console.error('  ✗ ' + f);
  console.error('\nProps must be literals, closed-enum constants, or bucketed helpers.');
  process.exit(1);
}
console.log(`Plausible event prop cardinality: ${plausibleCalls} call site(s) across ${scanned} file(s); all bounded.`);
