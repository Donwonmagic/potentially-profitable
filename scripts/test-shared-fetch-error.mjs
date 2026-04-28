// Tests for tools/_shared/fetch-error.js — the toolkit-wide fetch
// error classifier. Replaces 7 generic "Could not scan that URL.
// Try again." messages with actionable kind-specific guidance.
//
// Run with `node scripts/test-shared-fetch-error.mjs`.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const FE = require('../tools/_shared/fetch-error.js');

let failures = 0;
function assertEq(label, actual, expected) {
  if (actual === expected) console.log('PASS  ' + label);
  else { failures++; console.log('FAIL  ' + label + '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')'); }
}
function assertTrue(label, condition) {
  if (condition) console.log('PASS  ' + label);
  else { failures++; console.log('FAIL  ' + label); }
}

// ------------------------------------------------------------
// HTTP-status classification
// ------------------------------------------------------------
{
  const c = FE.classifyFetchError(null, { status: 429 });
  assertEq('429 → rate-limit', c.kind, 'rate-limit');
  assertEq('rate-limit retryAfter default 30s', c.retryAfterSec, 30);
}
{
  const c = FE.classifyFetchError(null, { status: 429, headers: { get: () => '90' } });
  assertEq('429 + Retry-After: 90 → 90s', c.retryAfterSec, 90);
}
{
  assertEq('404 → not-found', FE.classifyFetchError(null, { status: 404 }).kind, 'not-found');
}
{
  assertEq('500 → server-error', FE.classifyFetchError(null, { status: 500 }).kind, 'server-error');
  assertEq('502 → server-error', FE.classifyFetchError(null, { status: 502 }).kind, 'server-error');
  assertEq('503 → server-error', FE.classifyFetchError(null, { status: 503 }).kind, 'server-error');
}
{
  // 403 without body hint defaults to bot-block (most common cause)
  assertEq('403 → bot-block', FE.classifyFetchError(null, { status: 403 }).kind, 'bot-block');
}
{
  // 403 with Cloudflare body hint stays bot-block (explicit confirmation)
  const c = FE.classifyFetchError(null, { status: 403, bodySnippet: 'Cloudflare attention required' });
  assertEq('403 + Cloudflare hint → bot-block', c.kind, 'bot-block');
}
{
  assertEq('400 → unknown (uncommon)', FE.classifyFetchError(null, { status: 400 }).kind, 'unknown');
}

// ------------------------------------------------------------
// Error-object classification (no response)
// ------------------------------------------------------------
{
  const e = new Error('aborted'); e.name = 'AbortError';
  assertEq('AbortError → timeout', FE.classifyFetchError(e, null).kind, 'timeout');
}
{
  const e = new TypeError('Failed to fetch');
  assertEq('TypeError "Failed to fetch" → network',
           FE.classifyFetchError(e, null).kind, 'network');
}
{
  const e = new Error('No CORS header');
  assertEq('CORS-mentioning error → cors', FE.classifyFetchError(e, null).kind, 'cors');
}
{
  assertEq('null err + null response → unknown', FE.classifyFetchError(null, null).kind, 'unknown');
}

// ------------------------------------------------------------
// Localised messages — every kind has both EN and ES
// ------------------------------------------------------------
const KINDS = ['rate-limit', 'timeout', 'bot-block', 'not-found', 'server-error', 'cors', 'network', 'unknown'];
KINDS.forEach(kind => {
  const c = { kind: kind, messageEn: FE.MESSAGES[kind].en, messageEs: FE.MESSAGES[kind].es, retryAfterSec: null };
  assertTrue('EN message exists for ' + kind, FE.MESSAGES[kind].en && FE.MESSAGES[kind].en.length > 10);
  assertTrue('ES message exists for ' + kind, FE.MESSAGES[kind].es && FE.MESSAGES[kind].es.length > 10);
  assertEq('localizedMessage(' + kind + ', "es") returns ES',
           FE.localizedMessage(c, 'es'), FE.MESSAGES[kind].es);
  assertEq('localizedMessage(' + kind + ', "en") returns EN',
           FE.localizedMessage(c, 'en'), FE.MESSAGES[kind].en);
  assertEq('localizedMessage(' + kind + ', undef) defaults EN',
           FE.localizedMessage(c), FE.MESSAGES[kind].en);
});

// ------------------------------------------------------------
// Real-user fixtures
// ------------------------------------------------------------
{
  // Owner runs Speed Test; PSI hits 429 with Retry-After
  const c = FE.classifyFetchError(null, { status: 429, headers: { get: function(h) { return h === 'retry-after' ? '45' : null; } } });
  assertEq('PSI 429 with Retry-After:45 → 45s', c.retryAfterSec, 45);
  assertTrue('rate-limit ES message mentions seconds',
             c.messageEs.indexOf('30 segundos') !== -1);
}
{
  // Owner enters localhost:8080 — Speed Test returns network error
  const e = new TypeError('Failed to fetch');
  const c = FE.classifyFetchError(e, null);
  assertTrue('network EN message mentions https:// hint',
             c.messageEn.indexOf('https://') !== -1);
}
{
  // Owner audits a Cloudflare-protected site
  const c = FE.classifyFetchError(null, { status: 403, bodySnippet: 'Cloudflare' });
  assertTrue('bot-block EN message suggests warming the URL',
             c.messageEn.toLowerCase().indexOf('browser') !== -1);
}

// ------------------------------------------------------------
// Result
// ------------------------------------------------------------
if (failures === 0) {
  console.log('\n✓ all fetch-error assertions pass');
  process.exit(0);
} else {
  console.log('\n✗ ' + failures + ' assertion(s) failed');
  process.exit(1);
}
