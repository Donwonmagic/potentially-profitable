// Tests for tools/_shared/analytics.js — the Plausible URL redactor.
// Strips path/query/fragment/userinfo from URLs before they go into
// analytics props so a user auditing /admin/secret doesn't leak the
// path.
//
// Run with `node scripts/test-shared-analytics.mjs`.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const A = require('../tools/_shared/analytics.js');

let failures = 0;
function assertEq(label, actual, expected) {
  if (actual === expected) console.log('PASS  ' + label);
  else { failures++; console.log('FAIL  ' + label + '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')'); }
}

// ------------------------------------------------------------
// Plain URLs — keep host, drop path
// ------------------------------------------------------------
assertEq('plain root', A.redactUrlForAnalytics('https://example.com/'), 'https://example.com');
assertEq('plain no slash', A.redactUrlForAnalytics('https://example.com'), 'https://example.com');
assertEq('drops path', A.redactUrlForAnalytics('https://example.com/admin/secret'), 'https://example.com');
assertEq('drops deep path', A.redactUrlForAnalytics('https://example.com/a/b/c/d/e'), 'https://example.com');

// ------------------------------------------------------------
// Query strings + fragments — both stripped
// ------------------------------------------------------------
assertEq('drops query string',
         A.redactUrlForAnalytics('https://example.com/?utm_source=email'),
         'https://example.com');
assertEq('drops fragment',
         A.redactUrlForAnalytics('https://example.com/#section'),
         'https://example.com');
assertEq('drops both',
         A.redactUrlForAnalytics('https://example.com/page?q=foo#bar'),
         'https://example.com');

// ------------------------------------------------------------
// Sensitive paths — the load-bearing case
// ------------------------------------------------------------
assertEq('admin URL: path stripped',
         A.redactUrlForAnalytics('https://example.com/admin/secret'),
         'https://example.com');
assertEq('admin with token query',
         A.redactUrlForAnalytics('https://example.com/admin?token=abc123'),
         'https://example.com');
assertEq('userinfo dropped',
         A.redactUrlForAnalytics('https://user:pass@example.com/private'),
         'https://example.com');

// ------------------------------------------------------------
// Subdomains, ports, IDN
// ------------------------------------------------------------
assertEq('keeps subdomain',
         A.redactUrlForAnalytics('https://api.example.com/v1/audit'),
         'https://api.example.com');
assertEq('keeps explicit port',
         A.redactUrlForAnalytics('https://example.com:8443/path'),
         'https://example.com:8443');
assertEq('http (not https) preserved',
         A.redactUrlForAnalytics('http://example.com/'),
         'http://example.com');

// ------------------------------------------------------------
// Edge cases
// ------------------------------------------------------------
assertEq('empty → empty', A.redactUrlForAnalytics(''), '');
assertEq('null → empty', A.redactUrlForAnalytics(null), '');
assertEq('undefined → empty', A.redactUrlForAnalytics(undefined), '');
assertEq('whitespace → empty', A.redactUrlForAnalytics('   '), '');
// Invalid URLs return empty rather than raw input — safer default.
assertEq('"not a url" → empty', A.redactUrlForAnalytics('not a url'), '');
assertEq('missing scheme → empty (parser rejects)',
         A.redactUrlForAnalytics('example.com/admin'), '');

// ------------------------------------------------------------
// Result
// ------------------------------------------------------------
if (failures === 0) {
  console.log('\n✓ all shared-analytics assertions pass');
  process.exit(0);
} else {
  console.log('\n✗ ' + failures + ' assertion(s) failed');
  process.exit(1);
}
