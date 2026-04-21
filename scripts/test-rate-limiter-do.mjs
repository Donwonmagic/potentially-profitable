#!/usr/bin/env node
// Durable-Object rate-limiter regression test.
// Run via: `node scripts/test-rate-limiter-do.mjs`
//
// Covers:
//   * allow up to `max`, deny the next
//   * deny response carries a sensible retryAfterSeconds
//   * per-key isolation (one DO instance per ip) via per-instance storage
//   * sliding window expires old hits (wall-clock simulated via sleep)
//   * storage writes on deny so stale hits still roll off
//   * checkDurableRateLimit adapter returns null when binding absent
//   * adapter fails open (null) on DO error — never blocks real users
//
// Exits non-zero on failure.

import { RateLimiter, checkDurableRateLimit } from '../src/lib/rate-limiter-do.js';

let failures = 0;
function assert(label, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label);
  if (!cond) failures++;
}
function assertEq(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}

// --- DO harness -----------------------------------------------------
// Minimal state/storage shim matching the DO runtime surface the
// RateLimiter class uses. A single get/put pair per key, with values
// held in-memory. One harness per DO instance mirrors the real
// topology (one DO per idFromName).
function makeState() {
  const store = new Map();
  return {
    store,
    storage: {
      async get(k)    { return store.has(k) ? store.get(k) : undefined; },
      async put(k, v) { store.set(k, v); }
    }
  };
}

async function callDo(instance, windowMs, max) {
  const req = new Request('https://do/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ windowMs, max })
  });
  const res = await instance.fetch(req);
  return res.json();
}

// --- Test 1: allow up to max, deny the next -------------------------
{
  const state = makeState();
  const rl = new RateLimiter(state, {});
  const out1 = await callDo(rl, 60_000, 2);
  const out2 = await callDo(rl, 60_000, 2);
  const out3 = await callDo(rl, 60_000, 2);
  assertEq('1st allowed', out1.allowed, true);
  assertEq('2nd allowed', out2.allowed, true);
  assertEq('3rd denied',  out3.allowed, false);
  assert  ('3rd carries retryAfterSeconds',
    typeof out3.retryAfterSeconds === 'number' && out3.retryAfterSeconds >= 1);
}

// --- Test 2: per-instance isolation (separate state == separate IP) ---
{
  const stateA = makeState();
  const stateB = makeState();
  const rlA = new RateLimiter(stateA, {});
  const rlB = new RateLimiter(stateB, {});

  await callDo(rlA, 60_000, 1);
  const aSecond = await callDo(rlA, 60_000, 1);
  const bFirst  = await callDo(rlB, 60_000, 1);

  assertEq('A second call denied',  aSecond.allowed, false);
  assertEq('B first call allowed',  bFirst.allowed, true);
}

// --- Test 3: sliding window lets old hits roll off ------------------
{
  const state = makeState();
  const rl = new RateLimiter(state, {});
  // 1ms window so we can wait past it without slowing the test.
  await callDo(rl, 1, 1);
  const denied = await callDo(rl, 1, 1);
  assertEq('at-capacity denied', denied.allowed, false);

  // Wait > 10ms so the single stored hit rolls out of the 1ms window.
  await new Promise((r) => setTimeout(r, 20));
  const allowedAgain = await callDo(rl, 1, 1);
  assertEq('post-window allowed', allowedAgain.allowed, true);
}

// --- Test 4: deny still writes pruned state -------------------------
// Seed a bucket with TWO stale hits and ONE fresh hit, then call with
// max:1. Prune drops the two stale entries; the remaining one fresh
// hit still trips the cap (count >= max), so the response is deny.
// The stored state should now hold exactly [freshHit] — proving that
// (a) prune ran even on the deny path, and (b) the pruned array was
// persisted.
{
  const state = makeState();
  const now = Date.now();
  // Two stale hits (older than 1s window) plus one fresh hit.
  await state.storage.put('hits', [now - 10_000, now - 5_000, now]);
  const rl = new RateLimiter(state, {});
  const denied = await callDo(rl, 1_000, 1);
  assertEq('at-cap-after-prune is denied', denied.allowed, false);
  const stored = await state.storage.get('hits');
  assertEq('stale hits pruned from storage',
    Array.isArray(stored) && stored.length === 1, true);
  assert('surviving entry is the fresh hit',
    stored.length === 1 && stored[0] >= now - 100);
}

// --- Test 5: bad body defaults safely -------------------------------
{
  const state = makeState();
  const rl = new RateLimiter(state, {});
  const req = new Request('https://do/check', { method: 'POST', body: 'not json' });
  const res = await rl.fetch(req);
  const data = await res.json();
  // Defaults kick in: windowMs=60_000, max=30. First call should allow.
  assertEq('bad body falls back to defaults and allows first call', data.allowed, true);
}

// --- Test 6: checkDurableRateLimit returns null when binding absent --
{
  const deny = await checkDurableRateLimit({}, 'api:1.2.3.4', 60_000, 30);
  assertEq('no-binding returns null (allow)', deny, null);
}

// --- Test 7: adapter passes through DO allow/deny -------------------
{
  // Fake binding that proxies to a single RateLimiter instance so the
  // adapter's idFromName / get / fetch dance is exercised end-to-end.
  const state = makeState();
  const rl = new RateLimiter(state, {});
  const env = {
    RATE_LIMITER: {
      idFromName(name) { return { name }; },
      get(_id) {
        return {
          fetch: (url, init) => rl.fetch(new Request(url, init))
        };
      }
    }
  };

  const a1 = await checkDurableRateLimit(env, 'api:7.7.7.7', 60_000, 1);
  const a2 = await checkDurableRateLimit(env, 'api:7.7.7.7', 60_000, 1);
  assertEq('adapter: first call allowed (null)', a1, null);
  assert  ('adapter: second call denies with retry-after',
    a2 && typeof a2.retryAfterSeconds === 'number' && a2.retryAfterSeconds >= 1);
}

// --- Test 8: adapter fails open when DO errors ----------------------
{
  const env = {
    RATE_LIMITER: {
      idFromName() { return {}; },
      get() {
        return {
          fetch: () => { throw new Error('simulated DO outage'); }
        };
      }
    }
  };
  const deny = await checkDurableRateLimit(env, 'api:5.5.5.5', 60_000, 10);
  assertEq('DO outage -> adapter returns null (fail open)', deny, null);
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll rate-limiter-do tests passed.');
