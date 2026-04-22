#!/usr/bin/env node
// D7b: snapshot-meta-override regression test.
// Run via: `node scripts/test-snapshot-meta-overrides.mjs`
//
// Locks the contract of buildSnapshotMetaOverrides() — the pure
// function that computes per-snapshot og:title / og:description /
// og:image / og:url values, extracted from rewriteAuditPageForSnapshot
// so the logic can be validated without mocking HTMLRewriter. Each
// computation is what shared social previews actually render on X /
// Slack / LinkedIn / Facebook, so drift is a real regression.

import { buildSnapshotMetaOverrides } from '../src/worker.js';

let failures = 0;
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label + (cond ? '' : '  ' + (detail || '')));
  if (!cond) failures++;
}
function assertEq(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  if (!ok) failures++;
}

const REQ_URL = new URL('https://muntin.digital/tools/audits/restaurant/?s=ABCDEFGHJK');
const REQ_URL_ES = new URL('https://muntin.digital/es/tools/audits/restaurant/?s=ABCDEFGHJK');
const TOKEN = 'ABCDEFGHJK';
const SAMPLE = {
  auditedUrl: 'https://pizzajoint.example/menu',
  score:      78,
  language:   'en',
  verdict:    'Solid footing with room to tighten up.',
};

// --- golden path EN -------------------------------------------------
{
  const m = buildSnapshotMetaOverrides(SAMPLE, TOKEN, REQ_URL);
  assertEq('EN: ogTitle',       m.ogTitle,       'Audit score: 78/100 — pizzajoint.example');
  assertEq('EN: ogDescription', m.ogDescription, 'Solid footing with room to tighten up.');
  assertEq('EN: ogImage',       m.ogImage,       'https://muntin.digital/api/og-snapshot?token=ABCDEFGHJK');
  assertEq('EN: canonicalUrl',  m.canonicalUrl,  'https://muntin.digital/tools/audits/restaurant/?s=ABCDEFGHJK');
}

// --- golden path ES -------------------------------------------------
{
  const m = buildSnapshotMetaOverrides({ ...SAMPLE, language: 'es' }, TOKEN, REQ_URL_ES);
  assertEq('ES: ogTitle',      m.ogTitle,      'Puntuación de auditoría: 78/100 — pizzajoint.example');
  assertEq('ES: canonicalUrl', m.canonicalUrl, 'https://muntin.digital/es/tools/audits/restaurant/?s=ABCDEFGHJK');
  // ES ogImage uses the same endpoint (no language routing needed —
  // the KV key is the token alone).
  assertEq('ES: ogImage',      m.ogImage,      'https://muntin.digital/api/og-snapshot?token=ABCDEFGHJK');
}

// --- host extraction strips www + protocol --------------------------
{
  const m = buildSnapshotMetaOverrides(
    { ...SAMPLE, auditedUrl: 'https://www.example.com/about' }, TOKEN, REQ_URL);
  assert('ogTitle: host-www stripped',
    m.ogTitle.indexOf('— example.com') !== -1 && m.ogTitle.indexOf('www.') === -1,
    'got: ' + m.ogTitle);
}

// --- score missing falls back to "Shared audit — host" --------------
{
  const m = buildSnapshotMetaOverrides(
    { ...SAMPLE, score: null }, TOKEN, REQ_URL);
  assertEq('EN no-score: ogTitle', m.ogTitle, 'Shared audit — pizzajoint.example');
}
{
  const m = buildSnapshotMetaOverrides(
    { ...SAMPLE, score: null, language: 'es' }, TOKEN, REQ_URL_ES);
  assertEq('ES no-score: ogTitle', m.ogTitle, 'Auditoría compartida — pizzajoint.example');
}

// --- score rounds to integer ----------------------------------------
{
  const m = buildSnapshotMetaOverrides({ ...SAMPLE, score: 72.6 }, TOKEN, REQ_URL);
  assert('score rounded in title', m.ogTitle.indexOf('73/100') !== -1, 'got: ' + m.ogTitle);
}

// --- empty verdict falls back to generic description ---------------
{
  const m = buildSnapshotMetaOverrides(
    { ...SAMPLE, verdict: '' }, TOKEN, REQ_URL);
  assert('EN no-verdict: generic description',
    m.ogDescription.indexOf('muntin.digital') !== -1 && m.ogDescription.indexOf('restaurant') !== -1,
    'got: ' + m.ogDescription);
}
{
  const m = buildSnapshotMetaOverrides(
    { ...SAMPLE, verdict: '', language: 'es' }, TOKEN, REQ_URL_ES);
  assert('ES no-verdict: generic description mentions "Muntin"',
    m.ogDescription.indexOf('muntin.digital') !== -1,
    'got: ' + m.ogDescription);
  assert('ES no-verdict: localized',
    m.ogDescription.indexOf('Auditoría') !== -1,
    'got: ' + m.ogDescription);
}

// --- verdict longer than 200 chars is truncated with ellipsis -------
{
  const longVerdict = 'x'.repeat(260);
  const m = buildSnapshotMetaOverrides(
    { ...SAMPLE, verdict: longVerdict }, TOKEN, REQ_URL);
  assert('long verdict truncated to 200',
    m.ogDescription.length === 200 && m.ogDescription.endsWith('…'),
    'got length: ' + m.ogDescription.length);
}

// --- multi-line verdict is flattened --------------------------------
{
  const m = buildSnapshotMetaOverrides(
    { ...SAMPLE, verdict: 'Line one.\n\n   Line two.\t\tLine three.' }, TOKEN, REQ_URL);
  assertEq('verdict newlines collapsed',
    m.ogDescription,
    'Line one. Line two. Line three.');
}

// --- malformed auditedUrl falls back gracefully ---------------------
{
  const m = buildSnapshotMetaOverrides(
    { ...SAMPLE, auditedUrl: 'not-a-url' }, TOKEN, REQ_URL);
  // Should still produce a title with some string where the host goes;
  // never throw.
  assert('malformed URL: title still produced', typeof m.ogTitle === 'string' && m.ogTitle.length > 0,
    'got: ' + m.ogTitle);
}

// --- token is URL-encoded in ogImage + canonical --------------------
// Token shape never includes special chars at runtime (server alphabet
// excludes them), but encoding still defends against a malformed call.
{
  const m = buildSnapshotMetaOverrides(SAMPLE, TOKEN, REQ_URL);
  assert('ogImage contains token verbatim', m.ogImage.endsWith('=ABCDEFGHJK'));
  assert('canonicalUrl ends in ?s=<token>', m.canonicalUrl.endsWith('?s=ABCDEFGHJK'));
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll snapshot-meta-override tests passed.');
