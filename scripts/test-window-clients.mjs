#!/usr/bin/env node
// Phase 8.4 — client roster classifier regression test.
//
// Covers classifyClientTier (pure tier logic) and classifyThreadClientStatus
// (thread-level, with the sub-hash fallback). The SHIPPED roster is empty, so
// every identified thread must read as `prospect` and every anonymous thread
// as `cold` — i.e. the feature is a safe single-tier no-op until an operator
// adds emails to src/lib/window-clients.js.
//
// Run: node scripts/test-window-clients.mjs

import {
  classifyClientTier,
  classifyThreadClientStatus,
  normalizeClientEmail,
  WINDOW_CLIENT_EMAILS,
} from '../src/lib/window-clients.js';

let failures = 0;
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label + (cond ? '' : '  ' + (detail || '')));
  if (!cond) failures++;
}

// ---------- normalizeClientEmail ----------
assert('normalize trims + lowercases', normalizeClientEmail('  Foo@Bar.COM ') === 'foo@bar.com');
assert('normalize handles non-strings', normalizeClientEmail(null) === '' && normalizeClientEmail(undefined) === '');

// ---------- classifyClientTier (pure, custom roster) ----------
const roster = new Set(['client@cafe.com']);
assert('no identity → cold', classifyClientTier('', false, roster) === 'cold');
assert('roster email → client', classifyClientTier('client@cafe.com', true, roster) === 'client');
assert('off-roster identified → prospect', classifyClientTier('someone@else.com', true, roster) === 'prospect');
assert('identity w/o email (sub only) → prospect', classifyClientTier('', true, roster) === 'prospect');
assert('empty roster → prospect for identified', classifyClientTier('a@b.com', true, new Set()) === 'prospect');

// ---------- classifyThreadClientStatus (against the shipped empty roster) ----------
const anon = await classifyThreadClientStatus({ anonId: 'abc', kind: 'anon' });
assert('anon thread → cold', anon === 'cold', anon);
const identified = await classifyThreadClientStatus({ sub: 'deadbeef', email: 'guest@x.com' });
assert('identified thread (empty roster) → prospect', identified === 'prospect', identified);
const subOnly = await classifyThreadClientStatus({ sub: 'deadbeef' });
assert('sub-only thread (empty roster) → prospect', subOnly === 'prospect', subOnly);
const nullThread = await classifyThreadClientStatus(null);
assert('null thread → cold', nullThread === 'cold', nullThread);

// ---------- ships safe ----------
assert('default roster is empty (single-tier until populated)', WINDOW_CLIENT_EMAILS.length === 0);

if (failures === 0) {
  console.log('\n✓ all window-clients assertions pass');
  process.exit(0);
} else {
  console.error('\n✗ ' + failures + ' assertion(s) failed');
  process.exit(1);
}
