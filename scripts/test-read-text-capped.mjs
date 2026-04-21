#!/usr/bin/env node
// Streaming-read size-cap regression test.
// Run via: `node scripts/test-read-text-capped.mjs`
//
// readTextCapped() is the guard between a malicious / broken upstream
// and Worker memory. A 10 MB HTML response on a free-tier restaurant
// audit would otherwise buffer in full before truncateHtml could run.
// These fixtures lock in that the cap is enforced at the byte level,
// that truncation is signaled to the caller, and that the decoder
// stays correct when a chunk boundary lands mid-UTF-8.
//
// Note: we import readTextCapped as a named export from worker.js.
// Cloudflare only cares about the default export; the named export
// is test-only. Exits non-zero on failure.

import { readTextCapped } from '../src/worker.js';

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

// Build a Response with a body we can control. Lazy pull() so cancel
// actually has something to abort — an eagerly-closed stream resolves
// cancel() as a no-op (per WHATWG) which would defeat the test.
function resFromChunks(chunks) {
  let cancelled = false;
  let i = 0;
  const encoded = chunks.map((c) => c instanceof Uint8Array ? c : new TextEncoder().encode(c));
  const stream = new ReadableStream({
    pull(controller) {
      if (i < encoded.length) {
        controller.enqueue(encoded[i++]);
      } else {
        controller.close();
      }
    },
    cancel() { cancelled = true; }
  });
  const res = new Response(stream);
  res._cancelled = () => cancelled;
  return res;
}

// --- Test 1: under-cap body returns full text ----------------------
{
  const doc = '<html><body>short</body></html>';
  const res = resFromChunks([doc]);
  const out = await readTextCapped(res, 1_000_000);
  assertEq('short body text', out.text, doc);
  assertEq('short body not truncated', out.truncated, false);
  assertEq('short body bytesRead', out.bytesRead, doc.length);
}

// --- Test 2: over-cap body is truncated at byte limit --------------
{
  // 5 chunks of 1,000 bytes each = 5,000 bytes total; cap at 2,500.
  const chunk = new Uint8Array(1000).fill('A'.charCodeAt(0));
  const res = resFromChunks([chunk, chunk, chunk, chunk, chunk]);
  const out = await readTextCapped(res, 2500);
  assertEq('cap truncates to exact byte count', out.bytesRead, 2500);
  assertEq('cap sets truncated:true',           out.truncated,  true);
  assertEq('cap truncates text length',         out.text.length, 2500);
  assertEq('cap text is all As',                /^A+$/.test(out.text), true);
}

// --- Test 3: cap equal to body size ---------------------------------
{
  const chunk = new Uint8Array(500).fill(0x42); // 'B'
  const res = resFromChunks([chunk, chunk]); // 1000 bytes
  const out = await readTextCapped(res, 1000);
  assertEq('exactly-at-cap not truncated', out.truncated, false);
  assertEq('exactly-at-cap bytesRead',     out.bytesRead, 1000);
  assertEq('exactly-at-cap length',        out.text.length, 1000);
}

// --- Test 4: reader is cancelled when cap fires --------------------
{
  // One chunk of 10 KB; cap at 1 KB. After the cap fires the reader
  // should be cancelled so the upstream stops sending. Our fake
  // ReadableStream records cancellation.
  const big = new Uint8Array(10_000).fill(0x43);
  const res = resFromChunks([big]);
  const out = await readTextCapped(res, 1000);
  assertEq('huge chunk truncated at 1KB', out.bytesRead, 1000);
  assertEq('huge chunk is flagged truncated', out.truncated, true);
  assert  ('stream was cancelled', res._cancelled());
}

// --- Test 5: UTF-8 across chunk boundary decodes cleanly -----------
{
  // The em-dash U+2014 is three bytes in UTF-8: 0xE2 0x80 0x94. Split
  // it across two chunks to confirm our decode-once-after-merge path
  // doesn't produce U+FFFD replacement chars for a legitimate run.
  const encoded = new TextEncoder().encode('before — after');
  const mid = encoded.length >> 1;
  const a = encoded.subarray(0, mid);
  const b = encoded.subarray(mid);
  const res = resFromChunks([a, b]);
  const out = await readTextCapped(res, 10_000);
  assertEq('utf-8 across boundary decodes cleanly', out.text, 'before — after');
  assertEq('utf-8 boundary not truncated', out.truncated, false);
}

// --- Test 6: zero-byte cap returns empty text + cancels stream ----
{
  const res = resFromChunks(['some content']);
  const out = await readTextCapped(res, 0);
  assertEq('zero-cap text is empty',     out.text,      '');
  assertEq('zero-cap bytesRead is zero', out.bytesRead, 0);
  assertEq('zero-cap is flagged truncated', out.truncated, true);
  assert  ('zero-cap cancels body stream',  res._cancelled());
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll readTextCapped tests passed.');
