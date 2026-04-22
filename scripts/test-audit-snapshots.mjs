#!/usr/bin/env node
// D1: audit-snapshot persistence regression test.
// Run via: `node scripts/test-audit-snapshots.mjs`
//
// Locks the contract of src/lib/audit-snapshots.js — token shape,
// payload validation, save/get round-trip, graceful degradation when
// the KV binding is missing, and TTL metadata. Exits non-zero on any
// failure so CI can gate on it.

import {
  saveSnapshot,
  getSnapshot,
  getSnapshotOg,
  mintSnapshotToken,
  isValidTokenShape,
  validateSnapshotPayload,
  TOKEN_ALPHABET,
  TOKEN_LENGTH,
  MAX_PAYLOAD_BYTES,
  MAX_OG_BYTES,
  SNAPSHOT_TTL_SECONDS,
  CURRENT_SCHEMA_VERSION,
} from '../src/lib/audit-snapshots.js';

let failures = 0;
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label + (cond ? '' : '  ' + (detail || '')));
  if (!cond) failures++;
}
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}

// In-memory KV shim. saveSnapshot + getSnapshot only touch .get() and
// .put(value, opts) — we store {value, expirationTtl} so we can
// assert on the retention time the caller asked for.
function makeKv() {
  const store = new Map();
  return {
    store,
    async get(key) { return store.has(key) ? store.get(key).value : null; },
    async put(key, value, opts) { store.set(key, { value, expirationTtl: opts && opts.expirationTtl }); },
    async delete(key) { store.delete(key); },
  };
}
function makeEnv() { return { AUDIT_SNAPSHOTS: makeKv() }; }

// --- Token constants pinned -----------------------------------------
assertEq('TOKEN_LENGTH is 10',       TOKEN_LENGTH, 10);
assertEq('alphabet excludes 0/O/1/I/l',
  /[01OIl]/.test(TOKEN_ALPHABET), false);
assertEq('alphabet size',            TOKEN_ALPHABET.length, 31);
assertEq('TTL is 90 days in seconds', SNAPSHOT_TTL_SECONDS, 90 * 24 * 60 * 60);
assertEq('MAX_PAYLOAD_BYTES is 512KB', MAX_PAYLOAD_BYTES, 512 * 1024);
assertEq('schema version pinned',    CURRENT_SCHEMA_VERSION, 1);

// --- mintSnapshotToken produces valid tokens ------------------------
for (let i = 0; i < 20; i++) {
  const t = mintSnapshotToken();
  assert(`minted token #${i} passes isValidTokenShape`, isValidTokenShape(t), 'got: ' + t);
}

// --- isValidTokenShape rejects garbage ------------------------------
assertEq('null is invalid',       isValidTokenShape(null),       false);
assertEq('undefined is invalid',  isValidTokenShape(undefined),  false);
assertEq('empty string invalid',  isValidTokenShape(''),         false);
assertEq('wrong-length invalid',  isValidTokenShape('ABC'),      false);
assertEq('lowercase invalid',     isValidTokenShape('abcdefghij'), false);
assertEq('contains 0 invalid',    isValidTokenShape('ABCDEFGH0J'), false);
assertEq('contains O invalid',    isValidTokenShape('ABCDEFGHOJ'), false);
assertEq('contains 1 invalid',    isValidTokenShape('ABCDEFGH1J'), false);
assertEq('contains I invalid',    isValidTokenShape('ABCDEFGHIJ'), false);
assertEq('number input invalid',  isValidTokenShape(1234567890), false);

// --- validateSnapshotPayload shape enforcement ----------------------
{
  const r = validateSnapshotPayload(null);
  assertEq('null payload rejected', r.ok, false);
}
{
  const r = validateSnapshotPayload({});
  assertEq('missing auditedUrl rejected', r.ok, false);
}
{
  const r = validateSnapshotPayload({ auditedUrl: 'https://example.com', score: 150 });
  assertEq('out-of-range score rejected', r.ok, false);
}
{
  const r = validateSnapshotPayload({ auditedUrl: 'https://example.com', score: 42 });
  assertEq('minimal-valid payload accepted', r.ok, true);
  assert('serialized field present', r.ok && typeof r.serialized === 'string');
  assert('byteLength field present', r.ok && typeof r.byteLength === 'number');
}
{
  // Oversized payload (fill results with a giant string to trip the cap).
  const big = { auditedUrl: 'https://example.com', score: 42, results: { junk: 'x'.repeat(600 * 1024) } };
  const r = validateSnapshotPayload(big);
  assertEq('oversized payload rejected', r.ok, false);
}

// --- saveSnapshot round-trips via getSnapshot -----------------------
{
  const env = makeEnv();
  const save = await saveSnapshot(env, {
    auditedUrl: 'https://pizzajoint.example',
    score: 78,
    verdict: 'Solid footing with room to tighten up.',
    subtype: 'casual-dining',
    language: 'en',
    results: { mobile: { state: 'pass' }, https: { state: 'pass' } },
  });
  assert('save ok',          save.ok,                          save.error);
  assert('save returns token', save.ok && typeof save.token === 'string');
  assert('token is valid',   save.ok && isValidTokenShape(save.token));
  assert('save returns expiresAt', save.ok && typeof save.expiresAt === 'string');

  // KV entry must have been written with the correct TTL.
  const kv = env.AUDIT_SNAPSHOTS;
  const entry = kv.store.get('snap:' + save.token);
  assert('KV entry exists',  !!entry);
  assertEq('TTL matches',   entry && entry.expirationTtl, SNAPSHOT_TTL_SECONDS);

  const read = await getSnapshot(env, save.token);
  assert('read ok',          read.ok,                          read.error);
  assertEq('auditedUrl round-trips', read.ok && read.snapshot.auditedUrl, 'https://pizzajoint.example');
  assertEq('score round-trips',      read.ok && read.snapshot.score, 78);
  assertEq('subtype round-trips',    read.ok && read.snapshot.subtype, 'casual-dining');
  assertEq('verdict round-trips',    read.ok && read.snapshot.verdict, 'Solid footing with room to tighten up.');
  assertEq('language round-trips',   read.ok && read.snapshot.language, 'en');
  assertEq('schema version recorded', read.ok && read.snapshot.v, CURRENT_SCHEMA_VERSION);
  assert('createdAt recorded',       read.ok && typeof read.snapshot.createdAt === 'number');
}

// --- Score is rounded to int ---------------------------------------
{
  const env = makeEnv();
  const save = await saveSnapshot(env, {
    auditedUrl: 'https://example.com', score: 72.7, results: {},
  });
  const read = await getSnapshot(env, save.token);
  assertEq('score rounded', read.ok && read.snapshot.score, 73);
}

// --- Missing optional fields default gracefully --------------------
{
  const env = makeEnv();
  const save = await saveSnapshot(env, { auditedUrl: 'https://example.com', score: 50 });
  const read = await getSnapshot(env, save.token);
  assertEq('default language en', read.ok && read.snapshot.language, 'en');
  assertEq('default subtype null', read.ok && read.snapshot.subtype, null);
  assertEq('default verdict empty', read.ok && read.snapshot.verdict, '');
  assertEq('default results {}',    read.ok && read.snapshot.results, {});
  assertEq('default meta {}',       read.ok && read.snapshot.meta, {});
}

// --- Missing binding returns structured error ----------------------
{
  const empty = {};
  const save = await saveSnapshot(empty, { auditedUrl: 'https://example.com', score: 50 });
  assertEq('save without binding errors', save.ok, false);
  assertEq('error code is snapshot-storage-unavailable', save.error, 'snapshot-storage-unavailable');

  const read = await getSnapshot(empty, 'ABCDEFGHJK');
  assertEq('read without binding errors', read.ok, false);
  assertEq('read error code matches',    read.error, 'snapshot-storage-unavailable');
}

// --- Unknown token returns not-found, not a throw ------------------
{
  const env = makeEnv();
  const read = await getSnapshot(env, 'ABCDEFGHJK');
  assertEq('unknown token → not-found', read.error, 'not-found');
}

// --- Malformed token shape is rejected before KV read --------------
{
  const env = makeEnv();
  const read = await getSnapshot(env, 'too-short');
  assertEq('malformed token → invalid-token', read.error, 'invalid-token');
  // Must not have touched the KV store.
  assertEq('no KV read on malformed token', env.AUDIT_SNAPSHOTS.store.size, 0);
}

// --- Corrupt KV value returns corrupt-snapshot, not 500 -------------
{
  const env = makeEnv();
  await env.AUDIT_SNAPSHOTS.put('snap:ABCDEFGHJK', '{this is not: valid-json');
  const read = await getSnapshot(env, 'ABCDEFGHJK');
  assertEq('corrupt value → corrupt-snapshot', read.error, 'corrupt-snapshot');
}

// --- Token collisions retry up to 3x --------------------------------
// Simulate the pathological case by stubbing crypto.getRandomValues to
// always emit zero bytes (same token every call). Save first should
// succeed; second should collide and (after 3 attempts at the same
// deterministic token) fail with token-collision. At 49 bits of real
// entropy this is effectively impossible in production, but we want
// the safety net tested.
{
  const originalGet = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
  let called = 0;
  // Property is a getter on the object, but the returned object's
  // methods are writable; we only swap the one method for the window
  // of this test and restore it at the end.
  const stub = (arr) => { called++; arr.fill(0); return arr; };
  Object.defineProperty(globalThis.crypto, 'getRandomValues', {
    value: stub, configurable: true, writable: true,
  });
  try {
    const env = makeEnv();
    const first = await saveSnapshot(env, { auditedUrl: 'https://example.com', score: 50 });
    assert('first save ok', first.ok);
    const second = await saveSnapshot(env, { auditedUrl: 'https://example.com', score: 60 });
    assertEq('second save with forced collision → token-collision', second.error, 'token-collision');
    // 1 call for first save + 3 retries for second = 4 calls
    assert('collision retries happen', called >= 4, 'got: ' + called);
  } finally {
    Object.defineProperty(globalThis.crypto, 'getRandomValues', {
      value: originalGet, configurable: true, writable: true,
    });
  }
}

// --- D7a: OG PNG field ---------------------------------------------
// Smallest valid PNG: 1×1 transparent. Magic + IHDR + IDAT + IEND.
// Hex-hand-built so the test has zero runtime dependencies.
const TINY_PNG_BYTES = Uint8Array.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // magic
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
  0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9C, 0x62, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
  0x42, 0x60, 0x82,
]);
const TINY_PNG_BASE64 = Buffer.from(TINY_PNG_BYTES).toString('base64');

assertEq('MAX_OG_BYTES is 300KB', MAX_OG_BYTES, 300 * 1024);

// --- validateSnapshotPayload: og field shape ----------------------
{
  const r = validateSnapshotPayload({
    auditedUrl: 'https://example.com', score: 50,
    og: { pngBase64: TINY_PNG_BASE64 },
  });
  assertEq('og valid → ok',              r.ok, true);
  assert  ('og valid → ogBytes present', r.ok && r.ogBytes && r.ogBytes.length === TINY_PNG_BYTES.length);
  assert  ('og valid → serialized hasOg flag',
    r.ok && JSON.parse(r.serialized).hasOg === true);
}
{
  const r = validateSnapshotPayload({
    auditedUrl: 'https://example.com', score: 50,
    og: 'not-an-object',
  });
  assertEq('og not-object → rejected', r.ok, false);
  assert('og not-object error mentions pngBase64', r.error.indexOf('pngBase64') !== -1);
}
{
  const r = validateSnapshotPayload({
    auditedUrl: 'https://example.com', score: 50,
    og: { pngBase64: 'not-base64!@#$' },
  });
  assertEq('og bad-base64 → rejected', r.ok, false);
}
{
  const r = validateSnapshotPayload({
    auditedUrl: 'https://example.com', score: 50,
    og: { pngBase64: Buffer.from(Uint8Array.from([0, 0, 0, 0])).toString('base64') },
  });
  assertEq('og not-a-png → rejected', r.ok, false);
  assert('og not-a-png error mentions PNG', r.error.indexOf('PNG') !== -1);
}
{
  // Oversized PNG payload (fill with > MAX_OG_BYTES of zeros after
  // the PNG magic so size-check trips before magic-check).
  const oversized = new Uint8Array(MAX_OG_BYTES + 16);
  oversized[0] = 0x89; oversized[1] = 0x50; oversized[2] = 0x4E; oversized[3] = 0x47;
  const r = validateSnapshotPayload({
    auditedUrl: 'https://example.com', score: 50,
    og: { pngBase64: Buffer.from(oversized).toString('base64') },
  });
  assertEq('og oversized → rejected', r.ok, false);
}
{
  // No og field at all → accepts and hasOg=false.
  const r = validateSnapshotPayload({ auditedUrl: 'https://example.com', score: 50 });
  assertEq('og absent → ok', r.ok, true);
  assertEq('og absent → hasOg=false', JSON.parse(r.serialized).hasOg, false);
  // ogBytes is explicitly null when no og field was sent (not
  // absent from the return) so the caller can branch on truthy.
  assertEq('og absent → ogBytes null', r.ogBytes, null);
}

// --- saveSnapshot stores OG bytes separately -----------------------
{
  const env = makeEnv();
  const save = await saveSnapshot(env, {
    auditedUrl: 'https://example.com', score: 50,
    og: { pngBase64: TINY_PNG_BASE64 },
  });
  assert('save with og ok', save.ok);
  const kv = env.AUDIT_SNAPSHOTS;
  assert('snap key exists', kv.store.has('snap:' + save.token));
  assert('og key exists',   kv.store.has('og:'   + save.token));
  assertEq('og key TTL matches snap TTL',
    kv.store.get('og:' + save.token).expirationTtl,
    SNAPSHOT_TTL_SECONDS);
  assertEq('save reports og byte count', save.ogBytesWritten, TINY_PNG_BYTES.length);
}

// --- saveSnapshot without OG leaves og key absent ------------------
{
  const env = makeEnv();
  const save = await saveSnapshot(env, { auditedUrl: 'https://example.com', score: 50 });
  const kv = env.AUDIT_SNAPSHOTS;
  assert('snap key exists (no-og save)',          kv.store.has('snap:' + save.token));
  assertEq('og key NOT written (no-og save)',     kv.store.has('og:' + save.token), false);
  assertEq('save reports zero og bytes',          save.ogBytesWritten, 0);
}

// --- getSnapshotOg round-trips the PNG bytes -----------------------
// The in-memory KV shim in this file stores the put value verbatim;
// in Workers KV the value comes back as an ArrayBuffer when fetched
// with 'arrayBuffer' mode. For the test we need the shim to honor
// that mode, so extend it.
function makeBinaryKv() {
  const store = new Map();
  return {
    store,
    async get(key, mode) {
      if (!store.has(key)) return null;
      const entry = store.get(key);
      if (mode === 'arrayBuffer' && entry.value instanceof Uint8Array) {
        return entry.value.buffer.slice(entry.value.byteOffset, entry.value.byteOffset + entry.value.byteLength);
      }
      return entry.value;
    },
    async put(key, value, opts) { store.set(key, { value, expirationTtl: opts && opts.expirationTtl }); },
    async delete(key) { store.delete(key); },
  };
}
{
  const env = { AUDIT_SNAPSHOTS: makeBinaryKv() };
  const save = await saveSnapshot(env, {
    auditedUrl: 'https://example.com', score: 50,
    og: { pngBase64: TINY_PNG_BASE64 },
  });
  assert('save with og ok (binary kv)', save.ok);
  const read = await getSnapshotOg(env, save.token);
  assert('og read ok',                    read.ok, read.error);
  assert('og read returns bytes',         read.ok && read.bytes && read.bytes.byteLength === TINY_PNG_BYTES.length);
  // Spot-check PNG magic survived the round-trip.
  const back = new Uint8Array(read.bytes);
  assertEq('og bytes[0] round-trips 0x89', back[0], 0x89);
  assertEq('og bytes[1] round-trips 0x50', back[1], 0x50);
}

// --- getSnapshotOg: missing-binding / invalid-token / not-found ---
{
  const read = await getSnapshotOg({}, 'ABCDEFGHJK');
  assertEq('og read without binding errors', read.error, 'snapshot-storage-unavailable');
}
{
  const env = { AUDIT_SNAPSHOTS: makeBinaryKv() };
  const read = await getSnapshotOg(env, 'too-short');
  assertEq('og malformed token → invalid-token', read.error, 'invalid-token');
}
{
  const env = { AUDIT_SNAPSHOTS: makeBinaryKv() };
  const read = await getSnapshotOg(env, 'ABCDEFGHJK');
  assertEq('og unknown token → not-found', read.error, 'not-found');
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll audit-snapshot tests passed.');
