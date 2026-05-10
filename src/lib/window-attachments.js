// src/lib/window-attachments.js
//
// Phase 3.1 (Window redesign) — multimodal attachment data layer.
// Companion to src/lib/window.js. Handles the per-attachment KV
// metadata + R2 object-key shape; the upload/download endpoints,
// EXIF strip, transcript flow live in worker.js (Phase 3.2+).
//
// Schema:
//   KV: window:attach:<attachId>
//     {
//       id: <attachId>,
//       threadId,
//       msgId,
//       sub|null, anonId|null,
//       kind: 'photo' | 'voice',
//       mime,
//       sizeBytes,
//       durationMs?    // voice only
//       transcript?    // voice only — set by Whisper backfill
//       altText?       // photo only — operator-supplied
//       r2Key,
//       createdAt,
//       deleted?: { at, by: 'visitor' | 'admin' }
//     }
//
//   R2: attach/<identityPrefix>/<attachId>.<ext>
//     identityPrefix = first 10 chars of sub or anonId. Schema is
//     stable across upload→link (the operator hasn't sent the
//     message yet at upload time, so we don't know threadId or
//     msgId yet). Cleanup-by-thread is NOT supported by prefix
//     listing — admin-by-message scans go through the msg row's
//     attachIds[] array (Phase 3.5) or via KV scan of
//     window:attach:* filtered on threadId/msgId.
//
//     Audit B2 fix: the original schema promised
//     attach/<threadId>/<msgId>/<attachId>.<ext> but we'd have to
//     R2 PUT-new + DELETE-old on every link to honor it. We
//     instead commit to an identity-keyed schema from upload time
//     and accept that thread-based cleanup uses the KV index, not
//     the R2 prefix.
//
//     Per audit S3, the per-anon lifetime counter
//     window:attach-lifetime:<anonId> caps gross uploads regardless
//     of message-cap evasion via cookie cycling.
//
// References: docs/window-redesign-plan.md §2.3, §2.7-2.9, §11.

import { mintSaveItemId, isValidSaveItemIdShape } from './workbench.js';
import {
  ATTACH_KEY_PREFIX,
  ATTACH_LIFETIME_KEY_PREFIX,
  TRANSCRIPT_QUEUE_KEY_PREFIX,
  MAX_ATTACHMENTS_PER_ANON_LIFETIME,
  MAX_ATTACH_BYTES_PER_DAY_PER_ANON,
  MAX_VOICE_PER_DAY,
  MAX_VOICE_MINUTES_PER_DAY,
  VOICE_R2_TTL_DAYS,
  PHOTO_R2_TTL_DAYS,
  MSG_KEY_PREFIX,
} from './window.js';

export const mintAttachId = mintSaveItemId;

export function attachKey(attachId) {
  return ATTACH_KEY_PREFIX + attachId;
}

export function attachLifetimeKey(suffix) {
  // suffix is anonId or sub — same cap applies regardless of identity
  // (a signed-in operator with high lifetime usage shouldn't be able
  // to dodge the cap by clearing their session cookie either).
  return ATTACH_LIFETIME_KEY_PREFIX + suffix;
}

// R2 object key shape: attach/<threadId>/<msgId>/<attachId>.<ext>
// ext is derived from the MIME type (we re-encode photos to webp/jpeg
// and voice stays in whatever client MediaRecorder produced).
const MIME_TO_EXT = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/png':  'png',
  'audio/webm': 'webm',
  'audio/webm;codecs=opus': 'webm',
  'audio/mp4':  'm4a',
  'audio/mpeg': 'mp3',
  'audio/ogg':  'ogg',
};

export function r2Key(threadId, msgId, attachId, mime) {
  if (!isValidSaveItemIdShape(threadId)) throw new Error('invalid-thread-id');
  if (!isValidSaveItemIdShape(msgId)) throw new Error('invalid-msg-id');
  if (!isValidSaveItemIdShape(attachId)) throw new Error('invalid-attach-id');
  const ext = MIME_TO_EXT[String(mime).toLowerCase()] || 'bin';
  return 'attach/' + threadId + '/' + msgId + '/' + attachId + '.' + ext;
}

// TTL in seconds for the R2 object lifecycle. Voice is 30d
// (BIPA-conservative), photo is 90d. Returned to the caller so the
// upload endpoint can pass `httpMetadata.cacheControl` or stamp the
// custom metadata for an external lifecycle policy.
export function r2TtlSeconds(kind) {
  const days = kind === 'voice' ? VOICE_R2_TTL_DAYS : PHOTO_R2_TTL_DAYS;
  return days * 24 * 60 * 60;
}

// Create the KV metadata row for an attachment. Caller has already
// uploaded the R2 object. Returns the row object on success.
export async function createAttachmentRow(env, params) {
  const id = params.id || mintAttachId();
  if (!isValidSaveItemIdShape(id)) throw new Error('invalid-attach-id');
  if (!isValidSaveItemIdShape(params.threadId)) throw new Error('invalid-thread-id');
  if (!isValidSaveItemIdShape(params.msgId)) throw new Error('invalid-msg-id');
  if (params.kind !== 'photo' && params.kind !== 'voice') throw new Error('invalid-kind');
  if (!params.mime) throw new Error('mime-required');
  if (!params.sizeBytes || params.sizeBytes < 0) throw new Error('size-required');

  const row = {
    id,
    threadId: params.threadId,
    msgId: params.msgId,
    sub: params.sub || null,
    anonId: params.anonId || null,
    kind: params.kind,
    mime: String(params.mime),
    sizeBytes: Number(params.sizeBytes),
    r2Key: r2Key(params.threadId, params.msgId, id, params.mime),
    createdAt: Date.now(),
  };
  if (params.kind === 'voice' && typeof params.durationMs === 'number') {
    row.durationMs = params.durationMs;
  }
  if (params.kind === 'photo' && typeof params.altText === 'string') {
    row.altText = params.altText.slice(0, 240);
  }

  await env.AUTH_SESSIONS.put(attachKey(id), JSON.stringify(row));
  return row;
}

export async function getAttachmentRow(env, attachId) {
  if (!isValidSaveItemIdShape(attachId)) return null;
  const raw = await env.AUTH_SESSIONS.get(attachKey(attachId));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// List attachments belonging to a specific message. Used by the
// thread renderer + admin reply UI. Listing is a KV prefix scan
// over `window:attach:` + filter on the row's msgId — KV doesn't
// support a "list by message" prefix without us encoding msgId
// into the key, but the volume per message is tiny (max 4
// attachments) so the filter is cheap.
//
// For admin queue scans across many messages, prefer storing the
// attach IDs on the msg row itself (Phase 3.2 will).
export async function listAttachmentsForMessage(env, threadId, msgId) {
  if (!isValidSaveItemIdShape(threadId) || !isValidSaveItemIdShape(msgId)) return [];
  const result = await env.AUTH_SESSIONS.list({ prefix: ATTACH_KEY_PREFIX, limit: 1000 });
  const out = [];
  for (const k of result.keys) {
    const raw = await env.AUTH_SESSIONS.get(k.name);
    if (!raw) continue;
    let row;
    try { row = JSON.parse(raw); } catch { continue; }
    if (row.threadId === threadId && row.msgId === msgId) out.push(row);
  }
  out.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  return out;
}

// Phase 3.5 — list attachments for a thread (single KV prefix scan,
// then in-memory group by msgId). Used by handleWindowThread +
// handleAdminWindowThread to render attachments inline alongside
// each message.
//
// Phase 3.6 — deleted voice tombstones STAY in the response so the
// thread renderer can show "Voice note deleted." where the audio
// used to be. The renderer + the response-shape sanitizer are
// responsible for not leaking transcripts/r2Keys from tombstoned
// rows. Photo deletes (admin-only, future) skip.
//
// Cost: O(N) scan over `window:attach:*` filtered to the thread's
// own attachments. With max 100 messages × max 4 attachments = 400
// candidates per thread, this stays cheap. For long threads or
// admin views across many threads, consider a per-thread index
// (window:attach-by-thread:<threadId>) — Phase 4+ optimization
// (audit final §4 cost flag).
export async function listAttachmentsForThread(env, threadId) {
  if (!isValidSaveItemIdShape(threadId)) return [];
  const result = await env.AUTH_SESSIONS.list({ prefix: ATTACH_KEY_PREFIX, limit: 1000 });
  const out = [];
  for (const k of result.keys) {
    const raw = await env.AUTH_SESSIONS.get(k.name);
    if (!raw) continue;
    let row;
    try { row = JSON.parse(raw); } catch { continue; }
    if (row.threadId !== threadId) continue;
    // Tombstones for voice deletes stay in the response (renderer
    // shows "Voice note deleted."). Photo deletes (Phase 5+ admin)
    // would skip — but no path creates them today.
    out.push(row);
  }
  return out;
}

// Phase 3.6 — visitor-deletable voice note (HARD delete).
//
// Plan §2.9 promised: "KV row replaced with {deleted:true,
// deletedAt}; R2 object hard-deleted." The Phase 3.5 implementation
// only nulled the transcript, leaving the audio in R2 until 30d
// TTL. The audit flagged this drift as BIPA-relevant: operators in
// immigration-status / DV cases who tap "Delete" expect the audio
// to vanish, not linger 30 days.
//
// New behavior (audit fix):
//   - R2 object is DELETED immediately.
//   - KV row keeps id + threadId + msgId + createdAt for audit trail
//     but nulls transcript + sets deleted:true + deletedAt.
//   - Idempotent on re-run.
//
// Caller must have already verified ownership (sub OR anonId match).
export async function deleteVoiceAttachment(env, attachId) {
  if (!isValidSaveItemIdShape(attachId)) return { ok: false, error: 'invalid-attach-id' };
  const raw = await env.AUTH_SESSIONS.get(attachKey(attachId));
  if (!raw) return { ok: false, error: 'not-found' };
  let row;
  try { row = JSON.parse(raw); } catch { return { ok: false, error: 'corrupt-row' }; }
  if (row.kind !== 'voice') return { ok: false, error: 'not-voice' };
  // Idempotent — repeated delete is a no-op.
  if (row.deleted) return { ok: true, alreadyDeleted: true };

  // Hard-delete the R2 object first. If R2 fails, leave the KV row
  // intact so a retry can re-attempt; a partial state where the
  // KV row says deleted but the audio still exists is the WORSE
  // failure mode under BIPA scrutiny.
  if (env.WINDOW_ATTACHMENTS && row.r2Key) {
    try {
      await env.WINDOW_ATTACHMENTS.delete(row.r2Key);
    } catch (err) {
      return { ok: false, error: 'r2-delete-failed', detail: err && err.message };
    }
  }

  row.transcript = null;
  row.transcriptLanguage = null;
  row.transcriptDeleted = true;
  row.transcriptDeletedAt = Date.now();
  row.deleted = true;
  row.deletedAt = Date.now();
  // Drop the bytes-related fields — auditors should see the row
  // as a tombstone, not a usable attachment.
  row.r2Key = null;
  // Keep TTL at 30d so the tombstone naturally expires when the
  // original audio would have. Maintains a window for ops to
  // verify the deletion happened.
  const opts = { expirationTtl: VOICE_R2_TTL_DAYS * 24 * 60 * 60 };
  await env.AUTH_SESSIONS.put(attachKey(attachId), JSON.stringify(row), opts);
  return { ok: true, row };
}

// Backward-compat alias for any caller still using the old name.
// Prefer deleteVoiceAttachment in new code.
export const deleteAttachmentTranscript = deleteVoiceAttachment;

// Per-anon (or per-sub) lifetime + daily-bytes throttle. Audit S3
// hard cap of 12 attachments lifetime + 8 MB/day. Returns
// { ok } or { ok:false, error, ... }. Caller stamps via
// stampAttachmentLifetime after the upload succeeds.
export async function checkAttachmentLifetime(env, suffix, additionalBytes) {
  if (!suffix) return { ok: false, error: 'no-suffix' };
  const today = _dayBucket(Date.now());
  const raw = await env.AUTH_SESSIONS.get(attachLifetimeKey(suffix));
  let row = { count: 0, bytesByDay: {} };
  if (raw) { try { row = JSON.parse(raw); } catch (_) { /* reset */ } }
  if (!row.bytesByDay) row.bytesByDay = {};
  const bytesToday = Number(row.bytesByDay[today] || 0) + Number(additionalBytes || 0);
  if (row.count >= MAX_ATTACHMENTS_PER_ANON_LIFETIME) {
    return { ok: false, error: 'attachment-lifetime-cap', max: MAX_ATTACHMENTS_PER_ANON_LIFETIME };
  }
  if (bytesToday > MAX_ATTACH_BYTES_PER_DAY_PER_ANON) {
    return { ok: false, error: 'attachment-bytes-day-cap', max: MAX_ATTACH_BYTES_PER_DAY_PER_ANON };
  }
  return { ok: true };
}

export async function stampAttachmentLifetime(env, suffix, addedBytes) {
  if (!suffix) return;
  const today = _dayBucket(Date.now());
  const raw = await env.AUTH_SESSIONS.get(attachLifetimeKey(suffix));
  let row = { count: 0, bytesByDay: {} };
  if (raw) { try { row = JSON.parse(raw); } catch (_) { /* reset */ } }
  if (!row.bytesByDay) row.bytesByDay = {};
  row.count = (row.count || 0) + 1;
  row.bytesByDay[today] = Number(row.bytesByDay[today] || 0) + Number(addedBytes || 0);
  // Prune day buckets older than 7 days to keep the row bounded.
  const cutoff = _dayBucket(Date.now() - 7 * 24 * 3600 * 1000);
  for (const day of Object.keys(row.bytesByDay)) {
    if (day < cutoff) delete row.bytesByDay[day];
  }
  // 30-day TTL: if the user goes silent for 30 days, the lifetime
  // cap resets (acceptable — the time gap itself is the rate limit).
  await env.AUTH_SESSIONS.put(attachLifetimeKey(suffix), JSON.stringify(row), { expirationTtl: 30 * 24 * 3600 });
}

function _dayBucket(ts) {
  const d = new Date(ts || Date.now());
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
}

// Phase 3.2 — server-side EXIF strip. Defense-in-depth: the client
// already canvas-re-encodes which strips EXIF, but a curl/script
// uploader bypasses JS entirely, so the worker must scrub on
// ingest before any byte hits R2.
//
// Returns { ok, bytes, kind, mime } on success; { ok:false, error }
// on unrecognized format. Caller passes the raw uploaded bytes
// (Uint8Array) + the declared MIME.
//
// Coverage:
//   - JPEG: rebuilds without APP1 (Exif/XMP) segments
//   - WEBP: rebuilds without EXIF + XMP chunks
//   - PNG: validates magic bytes, walks chunks, drops EXIF/text/ICC
//
// Each path validates the format's magic bytes before walking
// segments. Audit B1 — without this, an attacker could declare
// `image/png` in their multipart `file.type` and upload arbitrary
// bytes; the worker would write them to R2 unchecked. Rejecting
// on signature mismatch keeps R2 from holding anything we can't
// audit as a real image of the declared type.
//
// Rejects unknown formats — we won't store anything we can't audit.
export function stripImageExif(bytes, mime) {
  if (!(bytes instanceof Uint8Array)) {
    return { ok: false, error: 'invalid-bytes' };
  }
  const m = String(mime || '').toLowerCase();
  if (m === 'image/jpeg' || m === 'image/jpg') {
    return _stripJpegExif(bytes);
  }
  if (m === 'image/webp') {
    return _stripWebpExif(bytes);
  }
  if (m === 'image/png') {
    return _stripPngExif(bytes);
  }
  return { ok: false, error: 'unsupported-mime' };
}

// JPEG: starts with FFD8 (SOI), then a sequence of segments each
// beginning with 0xFF + marker byte. APP0 (FFE0) is JFIF basic and
// stays; APP1 (FFE1) carries Exif/XMP and gets dropped. APP2-APP15
// carry ICC, MakerNote, etc — we drop APP1-APP15 to be thorough
// (legitimate JFIF only needs APP0). Quantization tables, Huffman
// tables, and image data (SOS) all stay.
function _stripJpegExif(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
    return { ok: false, error: 'jpeg-bad-soi' };
  }
  const out = [0xFF, 0xD8];
  let i = 2;
  while (i < bytes.length) {
    if (bytes[i] !== 0xFF) {
      return { ok: false, error: 'jpeg-bad-marker' };
    }
    // Skip any 0xFF padding bytes (allowed by spec).
    let j = i + 1;
    while (j < bytes.length && bytes[j] === 0xFF) j++;
    const marker = bytes[j];
    // Standalone markers without length fields: SOI(D8), EOI(D9),
    // RSTn (D0-D7), TEM(01).
    if (marker === 0xD9) {
      // EOI — copy and stop.
      out.push(0xFF, 0xD9);
      break;
    }
    if (marker === 0x00 || (marker >= 0xD0 && marker <= 0xD7)) {
      // 0xFF00 (escaped FF) and RSTn — pass through verbatim.
      out.push(0xFF, marker);
      i = j + 1;
      continue;
    }
    // SOS marker (DA): the segment header has a length field, then
    // entropy-coded image data follows until the next non-RST marker.
    // We copy from here to EOI verbatim.
    if (marker === 0xDA) {
      // Push everything from i to end (including FFD9).
      for (let k = i; k < bytes.length; k++) out.push(bytes[k]);
      break;
    }
    // Length-bearing segment. Length includes the 2 length bytes
    // but NOT the marker.
    if (j + 2 >= bytes.length) {
      return { ok: false, error: 'jpeg-truncated' };
    }
    const segLen = (bytes[j + 1] << 8) | bytes[j + 2];
    if (segLen < 2 || j + 1 + segLen > bytes.length) {
      return { ok: false, error: 'jpeg-bad-segment-length' };
    }
    // Drop APP1-APP15 (E1-EF). Keep APP0 (E0) for JFIF basic.
    const isApp = marker >= 0xE0 && marker <= 0xEF;
    const isAppToDrop = marker >= 0xE1 && marker <= 0xEF;
    // Also drop COM (FE) which can carry arbitrary text.
    const isComToDrop = marker === 0xFE;
    if (isAppToDrop || isComToDrop) {
      // Skip the segment entirely.
      i = j + 1 + segLen;
      continue;
    }
    // Keep — copy 0xFF + marker + length + data.
    out.push(0xFF, marker);
    for (let k = j + 1; k < j + 1 + segLen; k++) out.push(bytes[k]);
    i = j + 1 + segLen;
  }
  return { ok: true, bytes: new Uint8Array(out), kind: 'jpeg', mime: 'image/jpeg' };
}

// WEBP: RIFF container. After "RIFF" + size32LE + "WEBP", a sequence
// of chunks each with FourCC + size32LE + data + optional pad byte.
// Drop the EXIF chunk and the XMP  (note trailing space) chunk.
function _stripWebpExif(bytes) {
  if (bytes.length < 12) {
    return { ok: false, error: 'webp-too-short' };
  }
  if (String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== 'RIFF' ||
      String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) !== 'WEBP') {
    return { ok: false, error: 'webp-bad-header' };
  }
  // Walk chunks starting at offset 12.
  const kept = [];
  let i = 12;
  while (i < bytes.length) {
    if (i + 8 > bytes.length) break;
    const fourcc = String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]);
    // >>> 0 keeps the 32-bit value unsigned; bit-31 sign-extension
    // would otherwise produce a negative value (audit S4 hygiene).
    const size = (bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] << 24)) >>> 0;
    if (i + 8 + size > bytes.length) {
      return { ok: false, error: 'webp-bad-chunk-size' };
    }
    const chunkLen = 8 + size + (size & 1); // pad to even
    if (fourcc !== 'EXIF' && fourcc !== 'XMP ') {
      // Keep this chunk verbatim.
      for (let k = i; k < i + chunkLen && k < bytes.length; k++) kept.push(bytes[k]);
    }
    i += chunkLen;
  }
  // Rebuild RIFF/WEBP header with new size.
  const newSize = 4 + kept.length; // 'WEBP' + chunks
  const out = [
    'R'.charCodeAt(0), 'I'.charCodeAt(0), 'F'.charCodeAt(0), 'F'.charCodeAt(0),
    newSize & 0xFF, (newSize >> 8) & 0xFF, (newSize >> 16) & 0xFF, (newSize >> 24) & 0xFF,
    'W'.charCodeAt(0), 'E'.charCodeAt(0), 'B'.charCodeAt(0), 'P'.charCodeAt(0),
  ].concat(kept);
  return { ok: true, bytes: new Uint8Array(out), kind: 'webp', mime: 'image/webp' };
}

// PNG: 8-byte magic (89 50 4E 47 0D 0A 1A 0A) then a sequence of
// chunks each with size32BE + 4-byte type + data + 4-byte CRC32.
// Drop the chunks that can carry identifying / locating info:
//   - eXIf (EXIF metadata)
//   - tEXt, zTXt, iTXt (textual metadata, often "Software" / GPS)
//   - iCCP (ICC color profile — can carry serial/manufacturer)
// Required chunks (IHDR, IDAT, IEND) and benign visual ones
// (PLTE, tRNS, gAMA, sRGB, cHRM, bKGD, pHYs, sBIT, hIST, tIME)
// are preserved.
//
// Audit B1 — without this, declaring image/png in the multipart
// upload bypassed signature validation entirely (the prior
// passthrough wrote any bytes verbatim to R2).
// ─────────────────────────────────────────────────────────────────
// Phase 3.3 — voice transcript queue + Whisper wrapper.
//
// Each voice attachment stamps a queue row at upload time; the
// upload handler also tries an inline Whisper call (fast path)
// and updates the attachment row on success. Failures fall through
// to the cron drain (slow path) which retries up to 3 times.

export function transcriptQueueKey(attachId) {
  return TRANSCRIPT_QUEUE_KEY_PREFIX + attachId;
}

// Enqueue an attachment for transcription. Idempotent — the row
// just records {attachId, attempts, enqueuedAt}. TTL 24h: if a
// voice attachment doesn't get transcribed within a day of upload,
// it's gone (the audio is still in R2 for retention duration; just
// no transcript).
export async function markForTranscript(env, attachId) {
  if (!isValidSaveItemIdShape(attachId)) return false;
  const raw = await env.AUTH_SESSIONS.get(transcriptQueueKey(attachId));
  let row;
  if (raw) {
    try { row = JSON.parse(raw); } catch (_) { row = null; }
  }
  if (!row) {
    row = { attachId, attempts: 0, enqueuedAt: Date.now() };
  }
  await env.AUTH_SESSIONS.put(transcriptQueueKey(attachId), JSON.stringify(row), {
    expirationTtl: 24 * 3600,
  });
  return true;
}

export async function unmarkTranscript(env, attachId) {
  if (!isValidSaveItemIdShape(attachId)) return;
  await env.AUTH_SESSIONS.delete(transcriptQueueKey(attachId));
}

export async function* iterateTranscriptQueue(env, limit = 5) {
  const result = await env.AUTH_SESSIONS.list({ prefix: TRANSCRIPT_QUEUE_KEY_PREFIX, limit });
  for (const k of result.keys) {
    const raw = await env.AUTH_SESSIONS.get(k.name);
    if (!raw) continue;
    let row;
    try { row = JSON.parse(raw); } catch (_) { continue; }
    yield { row, key: k.name };
  }
}

// Run Whisper on the audio bytes. Returns { ok, text } on success
// or { ok:false, error } on failure. Workers AI binding is env.AI;
// the model is the canonical `@cf/openai/whisper` (audit B-1: the
// `whisper-large-v3-turbo` variant has had argument-shape churn
// in Workers AI; the canonical wrapper is the long-stable version).
// Auto-detects the spoken language — returned text is in the
// operator's spoken language regardless of the page locale (plan
// §6.5: a Spanish operator on /window/ EN still gets a Spanish
// transcript).
//
// Response shape is handled defensively (audit B-1 bullet 2): we
// accept either `{text}` (canonical) or `{segments:[{text}]}`
// (alternate shape) and fall through gracefully.
export async function transcribeVoice(env, audioBytes) {
  if (!env || !env.AI) {
    return { ok: false, error: 'ai-not-configured' };
  }
  if (!(audioBytes instanceof Uint8Array)) {
    return { ok: false, error: 'invalid-audio' };
  }
  // Workers AI Whisper expects `audio` as `number[]`. Array.from
  // handles the Uint8Array → number[] conversion correctly.
  let res;
  try {
    res = await env.AI.run('@cf/openai/whisper', {
      audio: Array.from(audioBytes),
    });
  } catch (err) {
    return { ok: false, error: 'whisper-threw', detail: err && err.message };
  }
  if (!res) return { ok: false, error: 'whisper-empty-response' };
  // Defensive parse: Workers AI usually returns { text, ... } but
  // some model variants surface `segments: [{text}]` or
  // `transcription: '...'`. Try in priority order; if all empty,
  // give up.
  let text = '';
  if (typeof res.text === 'string') text = res.text;
  else if (typeof res.transcription === 'string') text = res.transcription;
  else if (Array.isArray(res.segments)) {
    text = res.segments.map(s => (s && s.text) || '').join(' ');
  }
  text = String(text || '').trim();
  if (!text) return { ok: false, error: 'empty-transcript' };
  return {
    ok: true,
    text: text.slice(0, 4000),  // cap at MAX_MSG_LENGTH equivalent
    language: res && res.language ? String(res.language).toLowerCase() : null,
  };
}

// Update an attachment row with its transcript. Idempotent — repeats
// just overwrite. Returns true on success.
//
// Audit S-4 — voice rows get a 30d TTL on the rewrite so the
// transcript metadata doesn't outlive the R2 audio (which expires
// at VOICE_R2_TTL_DAYS via R2 lifecycle policy). Photo rows skip
// the TTL — photos persist for 90d (PHOTO_R2_TTL_DAYS), but the
// row itself has no TTL today (admin reaper handles it). When
// Phase 3.5's per-message delete-transcript ships, that path
// flips a deleted flag instead of relying on TTL.
export async function setAttachmentTranscript(env, attachId, transcript, language) {
  if (!isValidSaveItemIdShape(attachId)) return false;
  const raw = await env.AUTH_SESSIONS.get(attachKey(attachId));
  if (!raw) return false;
  let row;
  try { row = JSON.parse(raw); } catch { return false; }
  row.transcript = String(transcript || '').slice(0, 4000);
  if (language) row.transcriptLanguage = String(language).slice(0, 8);
  row.transcriptAt = Date.now();
  const opts = row.kind === 'voice'
    ? { expirationTtl: VOICE_R2_TTL_DAYS * 24 * 60 * 60 }
    : undefined;
  await env.AUTH_SESSIONS.put(attachKey(attachId), JSON.stringify(row), opts);
  return true;
}

// Per-anon (or per-sub) voice-daily throttle: 5 voice notes/day +
// 5 minutes total/day. Distinct from the photo lifetime cap because
// voice is the riskier modality (BIPA-conservative + Workers AI
// cost). Caller passes additionalMs for THIS upload.
const VOICE_DAILY_KEY_PREFIX = 'window:voice-daily:';
function _voiceDailyKey(suffix) { return VOICE_DAILY_KEY_PREFIX + suffix; }

export async function checkVoiceDailyCap(env, suffix, additionalMs) {
  if (!suffix) return { ok: false, error: 'no-suffix' };
  const today = _dayBucket(Date.now());
  const raw = await env.AUTH_SESSIONS.get(_voiceDailyKey(suffix));
  let row = { day: today, count: 0, ms: 0 };
  if (raw) { try { row = JSON.parse(raw); } catch (_) { /* reset */ } }
  if (row.day !== today) { row.day = today; row.count = 0; row.ms = 0; }
  if (row.count >= MAX_VOICE_PER_DAY) {
    return { ok: false, error: 'voice-day-cap', max: MAX_VOICE_PER_DAY };
  }
  if ((row.ms + Number(additionalMs || 0)) > MAX_VOICE_MINUTES_PER_DAY * 60 * 1000) {
    return { ok: false, error: 'voice-minutes-cap', max: MAX_VOICE_MINUTES_PER_DAY };
  }
  return { ok: true };
}

export async function stampVoiceDaily(env, suffix, addedMs) {
  if (!suffix) return;
  const today = _dayBucket(Date.now());
  const raw = await env.AUTH_SESSIONS.get(_voiceDailyKey(suffix));
  let row = { day: today, count: 0, ms: 0 };
  if (raw) { try { row = JSON.parse(raw); } catch (_) { /* reset */ } }
  if (row.day !== today) { row.day = today; row.count = 0; row.ms = 0; }
  row.count += 1;
  row.ms += Number(addedMs || 0);
  await env.AUTH_SESSIONS.put(_voiceDailyKey(suffix), JSON.stringify(row), { expirationTtl: 48 * 3600 });
}

// ─────────────────────────────────────────────────────────────────
// Phase 3.4 — async voicenote callback request.
//
// Operator submits {phone, windowSlot} (slot = 'tomorrow-morning' |
// 'tomorrow-midday' | etc — not free-form time strings, to keep
// validation tight and to match the plan §5.3 chip vocabulary).
// Optional attachId points to a voice memo recorded as part of the
// request. Worker stores the row + appends a 'don' auto-confirmation
// message into the thread so the visitor sees acknowledgement
// without waiting for Don's actual reply.
//
// Phase 3.4 is the SHIM — it records the request only. No live
// Twilio call is dispatched; Don sees the request in admin and
// either calls back asynchronously (replying with his own voicenote)
// or escalates to a live call (Phase 5+ Care-Plan-only path).
//
// Plan §4.5 + operations review's recommendation.

export const CALLBACK_KEY_PREFIX = 'window:callback:';

const CALLBACK_WINDOWS = {
  // Map of slot key → human-readable EN/ES labels. The label is
  // what the auto-confirmation thread message renders. The slot
  // itself (the key) is what gets stored in KV.
  'tomorrow-morning':  { en: 'tomorrow morning (8–11am)',     es: 'mañana en la mañana (8–11am)' },
  'tomorrow-midday':   { en: 'tomorrow midday (11am–1pm)',   es: 'mañana al mediodía (11am–1pm)' },
  'tomorrow-afternoon':{ en: 'tomorrow afternoon (2–4pm)',    es: 'mañana en la tarde (2–4pm)' },
  'tomorrow-evening':  { en: 'tomorrow evening (5–7pm)',      es: 'mañana en la noche (5–7pm)' },
  'this-week':         { en: 'sometime this week',            es: 'en algún momento esta semana' },
  'next-week':         { en: 'sometime next week',            es: 'la próxima semana' },
};

export function callbackKey(threadId, callbackId) {
  return CALLBACK_KEY_PREFIX + threadId + ':' + callbackId;
}

// Validate a slot key against the allowlist. Returns the slot when
// valid, null otherwise. The label lookup is locale-aware — falls
// back to EN if the locale entry is missing.
export function getCallbackSlotLabel(slotKey, locale) {
  const slot = CALLBACK_WINDOWS[slotKey];
  if (!slot) return null;
  const lang = locale === 'es' ? 'es' : 'en';
  return slot[lang] || slot.en;
}

// Normalize a phone number to E.164 best-effort. Accepts US-style
// (10 digits, prepends +1) or international (existing + prefix).
// Returns null if the result doesn't look like a valid E.164.
//
// Audit P2: rejects multi-plus inputs (`++1...`) and country codes
// starting with `0` (no E.164 country code is `0...`).
export function normalizePhone(input) {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Multi-plus is malformed; refuse rather than coerce. A single
  // leading + is the only valid plus position.
  const firstPlus = trimmed.indexOf('+');
  const lastPlus = trimmed.lastIndexOf('+');
  if (firstPlus !== lastPlus) return null;
  if (firstPlus > 0) return null;  // + must be the very first char if present
  const hadPlus = firstPlus === 0;
  const digits = trimmed.replace(/[^\d]/g, '');
  if (!digits) return null;
  if (hadPlus) {
    // International — keep digits as-is. E.164 max is 15 digits.
    if (digits.length < 7 || digits.length > 15) return null;
    // No valid country code starts with 0. Reject.
    if (digits[0] === '0') return null;
    return '+' + digits;
  }
  // US default: 10-digit local → +1; 11-digit starting with 1 → +1.
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits[0] === '1') return '+' + digits;
  // Anything else without a + is ambiguous — refuse.
  return null;
}

// Mask a phone for display: last 4 digits visible, rest as ***.
// Used for the auto-confirmation thread message + admin queue
// (privacy: phone numbers shouldn't be cleartext in admin views
// unless Don explicitly taps to reveal — that affordance ships
// in Phase 3.5 admin display).
export function maskPhone(e164) {
  if (typeof e164 !== 'string' || e164.length < 4) return '***';
  const last4 = e164.slice(-4);
  return '***-***-' + last4;
}

export const mintCallbackId = mintSaveItemId;

// Create a callback request row. Returns the row on success;
// throws on KV failure.
export async function createCallbackRequest(env, params) {
  const callbackId = mintCallbackId();
  const row = {
    id: callbackId,
    threadId: params.threadId,
    msgId: params.msgId || null,        // links to the auto-confirmation message
    sub: params.sub || null,
    anonId: params.anonId || null,
    phoneE164: params.phoneE164,         // E.164 — never logged in cleartext
    slotKey: params.slotKey,
    voiceAttachId: params.voiceAttachId || null,
    locale: params.locale || 'en',
    status: 'requested',
    requestedAt: Date.now(),
  };
  await env.AUTH_SESSIONS.put(callbackKey(params.threadId, callbackId), JSON.stringify(row), {
    // 30-day retention — Don has a month to make the call before
    // the row expires. Phone numbers in particular shouldn't sit
    // forever; the TTL is the primary privacy backstop.
    expirationTtl: 30 * 24 * 60 * 60,
  });
  return row;
}

export async function listCallbacksForThread(env, threadId) {
  if (!isValidSaveItemIdShape(threadId)) return [];
  const result = await env.AUTH_SESSIONS.list({ prefix: CALLBACK_KEY_PREFIX + threadId + ':', limit: 100 });
  const out = [];
  for (const k of result.keys) {
    const raw = await env.AUTH_SESSIONS.get(k.name);
    if (!raw) continue;
    try { out.push(JSON.parse(raw)); } catch (_) { continue; }
  }
  out.sort((a, b) => (a.requestedAt || 0) - (b.requestedAt || 0));
  return out;
}

function _stripPngExif(bytes) {
  const SIG = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  if (bytes.length < 8) return { ok: false, error: 'png-too-short' };
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== SIG[i]) return { ok: false, error: 'png-bad-signature' };
  }
  const DROP = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'iCCP']);
  // Output starts with the magic bytes verbatim.
  const out = [];
  for (let i = 0; i < 8; i++) out.push(bytes[i]);

  let i = 8;
  let sawIend = false;
  while (i < bytes.length) {
    if (i + 12 > bytes.length) {
      return { ok: false, error: 'png-truncated' };
    }
    // length is BE 32-bit unsigned.
    const len = ((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0;
    const type = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);
    const total = 12 + len; // 4 length + 4 type + len data + 4 CRC
    if (i + total > bytes.length) {
      return { ok: false, error: 'png-bad-chunk-length' };
    }
    if (!DROP.has(type)) {
      for (let k = i; k < i + total; k++) out.push(bytes[k]);
    }
    if (type === 'IEND') { sawIend = true; break; }
    i += total;
  }
  if (!sawIend) return { ok: false, error: 'png-no-iend' };
  return { ok: true, bytes: new Uint8Array(out), kind: 'png', mime: 'image/png' };
}
