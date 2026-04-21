#!/usr/bin/env node
// Audit-cache stale-fallback regression test.
// Run via: `node scripts/test-audit-cache.mjs`
//
// Locks in the behavior documented in src/lib/audit-cache.js:34-39:
// when the upstream fetcher errors AND we have a cached entry older
// than TTL but newer than 2× TTL, withAuditCache serves the stale
// value with staleFallback:true. This is the only time we prefer a
// slightly-old report over a fresh error screen. Exits non-zero on
// failure so CI can gate on it.

import { withAuditCache, readCacheEntry } from '../src/lib/audit-cache.js';

let failures = 0;
function assertEq(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}

// In-memory KV shim. Matches the narrow surface withAuditCache uses:
// get(key) returns the stored string or null; put(key, value, opts)
// stores it. We intentionally DO NOT simulate KV expiration — the
// tests drive age via the stored timestamp directly.
function makeKv() {
  const store = new Map();
  return {
    store,
    async get(key) { return store.has(key) ? store.get(key) : null; },
    async put(key, value) { store.set(key, value); }
  };
}

function makeEnv() {
  return { AUDIT_CACHE: makeKv() };
}

// withAuditCache reads request.url for the `fresh=1` bypass. Any URL
// without that query param triggers the normal cache path.
const fakeRequest = { url: 'https://example.test/api/psi?url=whatever' };

// --- Test 1: miss then hit ------------------------------------------
{
  const env = makeEnv();
  let calls = 0;
  const fetcher = async () => { calls++; return { ok: true, score: 80 }; };

  const first  = await withAuditCache(env, fakeRequest, ['psi', 'https://a.test/'], 3600, fetcher);
  assertEq('miss returns cacheHit:false',      first.cacheHit,      false);
  assertEq('miss returns staleFallback:false', first.staleFallback, false);
  assertEq('miss invokes fetcher once',        calls,               1);

  const second = await withAuditCache(env, fakeRequest, ['psi', 'https://a.test/'], 3600, fetcher);
  assertEq('hit returns cacheHit:true',         second.cacheHit,      true);
  assertEq('hit returns staleFallback:false',   second.staleFallback, false);
  assertEq('hit skips fetcher',                 calls,               1);
  assertEq('hit returns stored value',          second.value.score,   80);
}

// --- Test 2: stale fallback when upstream errors --------------------
{
  const env = makeEnv();
  let calls = 0;
  const okFetcher   = async () => { calls++; return { ok: true,  score: 72 }; };
  const failFetcher = async () => { calls++; return { ok: false, error: 'upstream-500' }; };

  // Seed a fresh entry.
  await withAuditCache(env, fakeRequest, ['psi', 'https://b.test/'], 3600, okFetcher);

  // Age the stored timestamp into the stale window (between TTL and
  // 2× TTL). TTL here is 3600s; bump ts back by 5400s.
  const [key] = env.AUDIT_CACHE.store.keys();
  const parsed = JSON.parse(env.AUDIT_CACHE.store.get(key));
  parsed.ts = Date.now() - (5400 * 1000);
  env.AUDIT_CACHE.store.set(key, JSON.stringify(parsed));

  // Upstream now errors; stale entry is still present.
  const stale = await withAuditCache(env, fakeRequest, ['psi', 'https://b.test/'], 3600, failFetcher);
  assertEq('stale path invokes fetcher',         calls,                2);
  assertEq('stale returns cacheHit:false',       stale.cacheHit,       false);
  assertEq('stale returns staleFallback:true',   stale.staleFallback,  true);
  assertEq('stale returns old value not error',  stale.value.score,    72);
  assertEq('stale ageSeconds is in range',       stale.ageSeconds >= 3600 && stale.ageSeconds <= 7200, true);
}

// --- Test 3: stale entry expired past 2× TTL = no fallback ----------
{
  const env = makeEnv();
  const okFetcher   = async () => ({ ok: true, score: 50 });
  const failFetcher = async () => ({ ok: false, error: 'upstream-500' });

  await withAuditCache(env, fakeRequest, ['psi', 'https://c.test/'], 3600, okFetcher);
  const [key] = env.AUDIT_CACHE.store.keys();
  const parsed = JSON.parse(env.AUDIT_CACHE.store.get(key));
  parsed.ts = Date.now() - (9000 * 1000); // older than 2× TTL
  env.AUDIT_CACHE.store.set(key, JSON.stringify(parsed));

  const result = await withAuditCache(env, fakeRequest, ['psi', 'https://c.test/'], 3600, failFetcher);
  assertEq('past-2xTTL returns staleFallback:false', result.staleFallback, false);
  assertEq('past-2xTTL surfaces upstream error',     result.value.ok,       false);
  assertEq('past-2xTTL surfaces error code',         result.value.error,    'upstream-500');
}

// --- Test 4: successful fetch overwrites stale ----------------------
{
  const env = makeEnv();
  await withAuditCache(env, fakeRequest, ['psi', 'https://d.test/'], 3600,
    async () => ({ ok: true, score: 40 }));

  const [key] = env.AUDIT_CACHE.store.keys();
  const parsed = JSON.parse(env.AUDIT_CACHE.store.get(key));
  parsed.ts = Date.now() - (5400 * 1000);
  env.AUDIT_CACHE.store.set(key, JSON.stringify(parsed));

  const result = await withAuditCache(env, fakeRequest, ['psi', 'https://d.test/'], 3600,
    async () => ({ ok: true, score: 90 }));
  assertEq('refresh returns new score',           result.value.score,    90);
  assertEq('refresh returns staleFallback:false', result.staleFallback,  false);
  assertEq('refresh returns cacheHit:false',      result.cacheHit,       false);

  // The stored entry should now carry the fresh timestamp.
  const after = await readCacheEntry(env, key, fakeRequest);
  assertEq('refresh rewrote timestamp', Date.now() - after.ts < 5000, true);
  assertEq('refresh stored fresh value', after.value.score, 90);
}

// --- Test 5: legacy entry (no ts) is treated as fresh ---------------
{
  const env = makeEnv();
  // Write a legacy-shaped entry directly into the KV shim.
  const legacyKey = 'psi:deadbeefdeadbeefdeadbeefdeadbeef';
  env.AUDIT_CACHE.store.set(legacyKey, JSON.stringify({ ok: true, score: 55 }));

  const entry = await readCacheEntry(env, legacyKey, fakeRequest);
  assertEq('legacy entry ts is null', entry.ts, null);
  assertEq('legacy entry value unwrapped', entry.value.score, 55);
}

// --- Test 6: ?fresh=1 bypasses cache --------------------------------
{
  const env = makeEnv();
  let calls = 0;
  const fetcher = async () => { calls++; return { ok: true, score: 10 }; };

  await withAuditCache(env, fakeRequest, ['psi', 'https://e.test/'], 3600, fetcher);
  assertEq('first call is a miss', calls, 1);

  const freshReq = { url: 'https://example.test/api/psi?url=whatever&fresh=1' };
  const result = await withAuditCache(env, freshReq, ['psi', 'https://e.test/'], 3600, fetcher);
  assertEq('fresh=1 skips cache',              result.cacheHit,     false);
  assertEq('fresh=1 still refetches',          calls,               2);
  assertEq('fresh=1 returns fresh value',      result.value.score,  10);
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll audit-cache tests passed.');
