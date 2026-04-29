#!/usr/bin/env node
// Phase 1 fix (silent-200 swallow) — regression test.
//
// Covers: isSpamHoneypot + isTimestampSane accept BOTH field-name
// conventions used by intake forms (_gotcha, _ts) AND in-house
// forms like the magic-link sign-in page (hp, ts). The magic-link
// silent-200 bug fixed in dbf980dc was caused by the gates only
// reading _ts, so adding regression coverage here keeps either
// future refactor (e.g., consolidating both forms onto one shape)
// from re-breaking the live sign-in path.

import {
  isSpamHoneypot,
  isTimestampSane,
} from '../src/lib/validation.js';

let failures = 0;
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label + (cond ? '' : '  ' + (detail || '')));
  if (!cond) failures++;
}

// ---------- isSpamHoneypot ----------

assert(
  'isSpamHoneypot returns false for null/undefined body',
  isSpamHoneypot(null) === false && isSpamHoneypot(undefined) === false
);

assert(
  'isSpamHoneypot returns false when neither honeypot field is present',
  isSpamHoneypot({ email: 'x@y.com' }) === false
);

assert(
  'isSpamHoneypot returns false for legacy _gotcha = ""  (intake forms)',
  isSpamHoneypot({ _gotcha: '' }) === false
);

assert(
  'isSpamHoneypot returns true for legacy _gotcha = "spam"',
  isSpamHoneypot({ _gotcha: 'spam' }) === true
);

assert(
  'isSpamHoneypot returns false for new hp = ""  (sign-in form)',
  isSpamHoneypot({ hp: '' }) === false
);

assert(
  'isSpamHoneypot returns true for new hp = "spam"',
  isSpamHoneypot({ hp: 'spam' }) === true
);

assert(
  'isSpamHoneypot trims whitespace before checking',
  isSpamHoneypot({ hp: '   ' }) === false &&
  isSpamHoneypot({ _gotcha: '   ' }) === false
);

assert(
  'isSpamHoneypot ignores non-string honeypot values',
  isSpamHoneypot({ hp: 42 }) === false &&
  isSpamHoneypot({ _gotcha: { evil: true } }) === false
);

// ---------- isTimestampSane ----------

const NOW = Date.now();
const TWO_SEC_AGO  = NOW - 2_000;        // > MIN_TS_AGE_MS (1500ms) → sane
const HALF_SEC_AGO = NOW - 500;          // < MIN_TS_AGE_MS → too fast
const HOUR_AGO     = NOW - 60 * 60_000;  // > MAX_TS_AGE_MS (30 min) → too stale
const FUTURE       = NOW + 5_000;        // browser clock skew → reject

assert(
  'isTimestampSane returns false for null/undefined body',
  isTimestampSane(null) === false && isTimestampSane(undefined) === false
);

assert(
  'isTimestampSane returns false for empty body (no ts at all)',
  isTimestampSane({}) === false
);

assert(
  'isTimestampSane returns true for legacy _ts = (now - 2s)  (intake forms)',
  isTimestampSane({ _ts: String(TWO_SEC_AGO) }) === true
);

assert(
  'isTimestampSane returns true for new ts = (now - 2s)  (sign-in form)',
  isTimestampSane({ ts: String(TWO_SEC_AGO) }) === true
);

assert(
  'isTimestampSane accepts numeric ts as well as string',
  isTimestampSane({ ts: TWO_SEC_AGO }) === true
);

assert(
  'isTimestampSane rejects too-fast submission (< 1.5s)',
  isTimestampSane({ ts: String(HALF_SEC_AGO) }) === false
);

assert(
  'isTimestampSane rejects too-stale submission (> 30 min)',
  isTimestampSane({ ts: String(HOUR_AGO) }) === false
);

assert(
  'isTimestampSane rejects future timestamp (clock skew)',
  isTimestampSane({ ts: String(FUTURE) }) === false
);

assert(
  'isTimestampSane rejects garbage ts',
  isTimestampSane({ ts: 'not-a-number' }) === false
);

assert(
  'isTimestampSane prefers _ts when both are present (legacy precedence)',
  // _ts is sane (now-2s), ts is bad (future) → _ts wins → true
  isTimestampSane({ _ts: String(TWO_SEC_AGO), ts: String(FUTURE) }) === true
);

if (failures === 0) {
  console.log('\n✓ all validation-alias assertions pass');
  process.exit(0);
} else {
  console.error('\n✗ ' + failures + ' assertion(s) failed');
  process.exit(1);
}
