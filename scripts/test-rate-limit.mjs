#!/usr/bin/env node
// Per-IP rate-limit regression test.
// Run via: `node scripts/test-rate-limit.mjs`
//
// Locks in the sliding-window behavior of createRateLimiter so a
// future "just bump max" tweak can't silently drop the shape of the
// check. Exits non-zero on failure so CI can gate on it.

import { createRateLimiter, clientIpFromRequest } from '../src/lib/rate-limit.js';

let failures = 0;
function assert(label, cond) {
  const ok = !!cond;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label);
  if (!ok) failures++;
}
function assertEq(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}

// --- Test 1: allow up to `max`, deny the next -----------------------
{
  let now = 1_000_000;
  const rl = createRateLimiter({ windowMs: 60_000, max: 3, now: () => now });

  assert('1st allowed', rl.check('1.2.3.4') === null);
  assert('2nd allowed', rl.check('1.2.3.4') === null);
  assert('3rd allowed', rl.check('1.2.3.4') === null);

  const deny = rl.check('1.2.3.4');
  assert('4th denied',  deny !== null);
  assert('retry-after is a positive integer',
    deny && typeof deny.retryAfterSeconds === 'number' && deny.retryAfterSeconds >= 1);
}

// --- Test 2: per-IP isolation ---------------------------------------
{
  let now = 2_000_000;
  const rl = createRateLimiter({ windowMs: 60_000, max: 1, now: () => now });

  assert('A allowed', rl.check('A') === null);
  assert('A denied',  rl.check('A') !== null);
  assert('B allowed', rl.check('B') === null);
  assert('B denied',  rl.check('B') !== null);
}

// --- Test 3: sliding window expires old hits ------------------------
{
  let now = 3_000_000;
  const rl = createRateLimiter({ windowMs: 60_000, max: 2, now: () => now });

  assert('t=0  1st allow',  rl.check('x') === null);
  assert('t=0  2nd allow',  rl.check('x') === null);
  assert('t=0  3rd deny',   rl.check('x') !== null);

  // Advance past window — both prior hits expire.
  now += 61_000;
  assert('t=61s allow after window rolls',   rl.check('x') === null);
  assert('t=61s 2nd allow after window rolls', rl.check('x') === null);
  assert('t=61s 3rd deny again',              rl.check('x') !== null);
}

// --- Test 4: retry-after reflects next slot --------------------------
{
  let now = 4_000_000;
  const rl = createRateLimiter({ windowMs: 60_000, max: 1, now: () => now });

  rl.check('ip'); // consume the slot at t=0
  now += 10_000; // 10 s later
  const deny = rl.check('ip');
  assert('deny at t+10s', deny !== null);
  // Next slot opens in (60 - 10) = 50 s; retry-after is at most 50 and at least 49.
  assert('retry-after in range',
    deny.retryAfterSeconds >= 49 && deny.retryAfterSeconds <= 50);
}

// --- Test 5: clientIpFromRequest prefers cf-connecting-ip ----------
{
  const req = {
    headers: new Map([
      ['cf-connecting-ip', '203.0.113.9'],
      ['x-forwarded-for',  '198.51.100.1, 10.0.0.1']
    ])
  };
  // The real worker receives Request objects with a Headers instance
  // (also Map-like); both have .get(). Our helper only uses .get().
  req.headers.get = function(k){ return (Map.prototype.get.call(this, k)) || null; };
  assertEq('uses cf-connecting-ip', clientIpFromRequest(req), '203.0.113.9');
}

// --- Test 6: falls back to first x-forwarded-for hop ----------------
{
  const req = {
    headers: new Map([
      ['x-forwarded-for', '198.51.100.1, 10.0.0.1']
    ])
  };
  req.headers.get = function(k){ return (Map.prototype.get.call(this, k)) || null; };
  assertEq('uses first xff hop', clientIpFromRequest(req), '198.51.100.1');
}

// --- Test 7: unknown client when no headers -------------------------
{
  const req = { headers: { get: () => null } };
  assertEq('no headers -> unknown', clientIpFromRequest(req), 'unknown');
}

// --- Test 8: housekeeping sweep drops empty buckets -----------------
{
  let now = 5_000_000;
  const rl = createRateLimiter({ windowMs: 1_000, max: 1, now: () => now });

  // Populate 600 unique ips, then advance past the window and churn
  // through 600 more to trigger the sweep.
  for (let i = 0; i < 600; i++) rl.check('ip-a-' + i);
  now += 2_000;
  for (let i = 0; i < 600; i++) rl.check('ip-b-' + i);

  const snap = rl._snapshot();
  const keys = Object.keys(snap);
  // After sweep, the first 600 ips should have been evicted because
  // their hits are all past the 1s window. We expect close to 600
  // active ips (the B batch), not 1200.
  assert('sweep evicted stale ips (kept ~600, not ~1200)', keys.length < 900);
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll rate-limit tests passed.');
