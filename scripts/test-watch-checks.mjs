#!/usr/bin/env node
// Phase 4 — watch-checks library regression test.
//
// Covers: shouldNotify thresholds (per-kind sensitivity matters
// because it controls what makes it into operators' inboxes),
// kindLabel locale dispatch, RECHECK_BY_KIND map shape, and the
// scaffolded recheck functions returning ok:true with a number.

import {
  shouldNotify,
  kindLabel,
  RECHECK_BY_KIND,
  recheckAudit,
  recheckSeo,
  recheckGbp,
  recheckMobile,
  recheckSchema,
  recheckSpeed,
  countResolvableJsonLdTypes,
} from '../src/lib/watch-checks.js';

let failures = 0;
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label + (cond ? '' : '  ' + (detail || '')));
  if (!cond) failures++;
}

// ---------- shouldNotify ----------

assert(
  'shouldNotify false when oldScore is null',
  shouldNotify(null, 80, 'audit') === false
);
assert(
  'shouldNotify false when newScore is null',
  shouldNotify(80, null, 'audit') === false
);
assert(
  'shouldNotify false when oldScore === newScore',
  shouldNotify(80, 80, 'audit') === false
);
assert(
  'shouldNotify false for unknown kind',
  shouldNotify(50, 80, 'unknown-kind') === false
);

// audit / seo / speed: ≥3 delta OR band crossing
assert(
  'audit: 80 → 82 (delta 2, no band cross) → no notify',
  shouldNotify(80, 82, 'audit') === false
);
assert(
  'audit: 80 → 83 (delta 3) → notify',
  shouldNotify(80, 83, 'audit') === true
);
assert(
  'audit: 79 → 81 (delta 2, crosses warn→good band) → notify',
  shouldNotify(79, 81, 'audit') === true
);
assert(
  'audit: 51 → 49 (delta 2, crosses warn→bad band) → notify',
  shouldNotify(51, 49, 'audit') === true
);
assert(
  'seo: 60 → 65 (delta 5) → notify',
  shouldNotify(60, 65, 'seo') === true
);
assert(
  'speed: 92 → 91 (delta 1, no band cross) → no notify',
  shouldNotify(92, 91, 'speed') === false
);

// schema / mobile / gbp: any change is signal
assert(
  'schema: 100 → 0 (binary flip — site stripped JSON-LD) → notify',
  shouldNotify(100, 0, 'schema') === true
);
assert(
  'schema: 0 → 100 (got structured data back) → notify',
  shouldNotify(0, 100, 'schema') === true
);
assert(
  'mobile: 92 → 95 (small ratio change) → notify',
  shouldNotify(92, 95, 'mobile') === true
);
assert(
  'gbp: 71 → 72 (1pt change in scaled score) → notify',
  shouldNotify(71, 72, 'gbp') === true
);
assert(
  'gbp: 71 → 71 → no notify (no change)',
  shouldNotify(71, 71, 'gbp') === false
);

// ---------- kindLabel ----------

assert(
  'kindLabel returns English label by default',
  kindLabel('audit', 'en') === 'Restaurant audit'
);
assert(
  'kindLabel returns Spanish label for locale=es',
  kindLabel('audit', 'es') === 'Auditoría de restaurante'
);
assert(
  'kindLabel falls through to kind itself for unknown kind',
  kindLabel('unknown-kind', 'en') === 'unknown-kind'
);
assert(
  'kindLabel covers all six watchable kinds in EN',
  kindLabel('audit', 'en') && kindLabel('seo', 'en') && kindLabel('gbp', 'en') &&
  kindLabel('mobile', 'en') && kindLabel('schema', 'en') && kindLabel('speed', 'en')
);
assert(
  'kindLabel covers all six watchable kinds in ES',
  kindLabel('audit', 'es') && kindLabel('seo', 'es') && kindLabel('gbp', 'es') &&
  kindLabel('mobile', 'es') && kindLabel('schema', 'es') && kindLabel('speed', 'es')
);

// ---------- RECHECK_BY_KIND ----------

assert(
  'RECHECK_BY_KIND covers all six watchable kinds',
  typeof RECHECK_BY_KIND.audit === 'function' &&
  typeof RECHECK_BY_KIND.seo === 'function' &&
  typeof RECHECK_BY_KIND.gbp === 'function' &&
  typeof RECHECK_BY_KIND.mobile === 'function' &&
  typeof RECHECK_BY_KIND.schema === 'function' &&
  typeof RECHECK_BY_KIND.speed === 'function'
);

assert(
  'RECHECK_BY_KIND is frozen (closed dispatch)',
  Object.isFrozen(RECHECK_BY_KIND)
);

// ---------- recheck scaffolds ----------
// Each scaffold should return { ok: true, score: <number|null> }
// based on the saved payload's score field. Real upstream calls
// land in a follow-up.

const fakeEnv = {};

// recheckSchema is the only fully-implemented recheck. The rest
// remain scaffolds that read the saved payload's score field.

await (async () => {
  // Empty payload → no URL → ok:false (cron logs + skips, no email).
  const r = await recheckSchema(fakeEnv, { kind: 'schema', payload: {} });
  assert('recheckSchema with no url → ok:false error:no-url',
    r.ok === false && r.error === 'no-url');
})();

await (async () => {
  const r = await recheckSchema(fakeEnv, { kind: 'schema', payload: { url: 'http://localhost:8080/' } });
  assert('recheckSchema rejects localhost (SSRF)',
    r.ok === false && r.error === 'private-network');
})();

await (async () => {
  const r = await recheckSchema(fakeEnv, { kind: 'schema', payload: { url: 'http://10.0.0.5/' } });
  assert('recheckSchema rejects RFC1918 10.0.0.0/8 (SSRF)',
    r.ok === false && r.error === 'private-network');
})();

await (async () => {
  const r = await recheckSchema(fakeEnv, { kind: 'schema', payload: { url: 'http://192.168.1.1/' } });
  assert('recheckSchema rejects RFC1918 192.168.0.0/16 (SSRF)',
    r.ok === false && r.error === 'private-network');
})();

await (async () => {
  const r = await recheckSchema(fakeEnv, { kind: 'schema', payload: { url: 'http://169.254.169.254/' } });
  assert('recheckSchema rejects link-local 169.254/16 (cloud metadata SSRF)',
    r.ok === false && r.error === 'private-network');
})();

await (async () => {
  const r = await recheckSchema(fakeEnv, { kind: 'schema', payload: { url: 'ftp://example.com/' } });
  assert('recheckSchema rejects non-HTTP(S) protocols',
    r.ok === false && r.error === 'no-url');
})();

// countResolvableJsonLdTypes — slim JSON-LD detector
assert(
  'countResolvableJsonLdTypes: empty input → 0',
  countResolvableJsonLdTypes('') === 0 && countResolvableJsonLdTypes(null) === 0
);
assert(
  'countResolvableJsonLdTypes: HTML with no JSON-LD → 0',
  countResolvableJsonLdTypes('<html><body><h1>Hi</h1></body></html>') === 0
);
assert(
  'countResolvableJsonLdTypes: single Restaurant block → 1',
  countResolvableJsonLdTypes(
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Restaurant","name":"Pizza Joint"}</script>'
  ) === 1
);
assert(
  'countResolvableJsonLdTypes: @graph wrapper with multiple types → 1',
  countResolvableJsonLdTypes(
    '<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"Joint"},{"@type":"WebSite","url":"https://x"}]}</script>'
  ) === 1
);
assert(
  'countResolvableJsonLdTypes: malformed JSON → 0 (graceful skip)',
  countResolvableJsonLdTypes(
    '<script type="application/ld+json">{ not valid json }</script>'
  ) === 0
);
assert(
  'countResolvableJsonLdTypes: JSON-LD without @type → 0 (no resolvable type)',
  countResolvableJsonLdTypes(
    '<script type="application/ld+json">{"name":"NoTypeHere"}</script>'
  ) === 0
);
assert(
  'countResolvableJsonLdTypes: array @type → 1',
  countResolvableJsonLdTypes(
    '<script type="application/ld+json">{"@type":["Restaurant","LocalBusiness"]}</script>'
  ) === 1
);
assert(
  'countResolvableJsonLdTypes: handles single quotes in script attribute',
  countResolvableJsonLdTypes(
    '<script type=\'application/ld+json\'>{"@type":"Restaurant"}</script>'
  ) === 1
);
assert(
  'countResolvableJsonLdTypes: counts multiple distinct blocks',
  countResolvableJsonLdTypes(
    '<script type="application/ld+json">{"@type":"Restaurant"}</script>' +
    '<script type="application/ld+json">{"@type":"BreadcrumbList"}</script>'
  ) === 2
);

await (async () => {
  const r = await recheckSpeed(fakeEnv, { kind: 'speed', payload: { score: 87 } });
  assert('recheckSpeed → ok:true score:87', r.ok === true && r.score === 87);
})();

await (async () => {
  const r = await recheckGbp(fakeEnv, { kind: 'gbp', payload: { chosen: { scaledScore: 78 } } });
  assert('recheckGbp → ok:true score:78 (from chosen.scaledScore)', r.ok === true && r.score === 78);
})();

await (async () => {
  const r = await recheckSeo(fakeEnv, { kind: 'seo', payload: { titleScore: 80, descScore: 90 } });
  assert('recheckSeo → ok:true score:85 (avg of title+desc)', r.ok === true && r.score === 85);
})();

await (async () => {
  const r = await recheckMobile(fakeEnv, { kind: 'mobile', payload: { passCount: 8, failCount: 1, unknownCount: 1 } });
  assert('recheckMobile → ok:true score:80 (8/10 pass ratio rounded)', r.ok === true && r.score === 80);
})();

await (async () => {
  const r = await recheckAudit(fakeEnv, { kind: 'audit', payload: { score: 72 } });
  assert('recheckAudit → ok:true score:72', r.ok === true && r.score === 72);
})();

await (async () => {
  const r = await recheckAudit(fakeEnv, { kind: 'audit', payload: {} });
  assert('recheckAudit with missing score → ok:true score:null', r.ok === true && r.score === null);
})();

if (failures === 0) {
  console.log('\n✓ all watch-checks assertions pass');
  process.exit(0);
} else {
  console.error('\n✗ ' + failures + ' assertion(s) failed');
  process.exit(1);
}
