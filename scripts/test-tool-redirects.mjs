#!/usr/bin/env node
/**
 * Regression test for the retired-tool 301 map (src/lib/tool-redirects.js),
 * the Worker-side mechanism that 301s the 8 tools retired in the 2026-06-26
 * tools migration (they live here, not /_redirects, which is at Cloudflare's
 * 100-rule cap). Pins: retired roots + sub-paths + deep assets redirect to the
 * decided target; ES mirrors to /es; and — critically — kept tools and the
 * redirect TARGETS themselves never redirect (no loop, no collateral).
 *
 *   node scripts/test-tool-redirects.mjs   # exit 1 on any mismatch
 */
import assert from 'node:assert';
import { lookupToolRedirect } from '../src/lib/tool-redirects.js';

const norm = (r) => (r && typeof r === 'object') ? (r.target || r.location || r.url) : r;

const CASES = [
  // retired → catalog hub
  ['/tools/gbp-grader/', '/tools/'],
  ['/tools/store-hours/holidays/', '/tools/'],
  ['/tools/storefront-health/', '/tools/'],
  ['/tools/photo-brief/', '/tools/'],
  ['/tools/brand-suite/', '/tools/'],
  ['/tools/audits/restaurant/', '/tools/'],
  // menu-related → menu-engineering (incl. deep asset path)
  ['/tools/menu-copy/', '/tools/menu-engineering/'],
  ['/tools/menu-converter/anything/x.png', '/tools/menu-engineering/'],
  // ES mirrors → /es prefix
  ['/es/tools/brand-suite/', '/es/tools/'],
  ['/es/tools/menu-copy/', '/es/tools/menu-engineering/'],
  // kept tools + targets + catalog must NOT redirect (no loop, no collateral)
  ['/tools/cost-pulse/', null],
  ['/tools/margin-math/', null],
  ['/tools/menu-engineering/', null],
  ['/tools/', null],
];

let fail = 0;
for (const [input, want] of CASES) {
  const got = norm(lookupToolRedirect(input));
  try {
    assert.strictEqual(want === null ? (got ?? null) : got, want);
  } catch {
    console.error(`FAIL  ${input}  ->  ${got}  (want ${want})`);
    fail++;
  }
}
if (fail) { console.error(`tool-redirects: ${fail}/${CASES.length} failed.`); process.exit(1); }
console.log(`tool-redirects: ${CASES.length}/${CASES.length} pass.`);
