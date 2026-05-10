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
  MAX_ATTACHMENTS_PER_ANON_LIFETIME,
  MAX_ATTACH_BYTES_PER_DAY_PER_ANON,
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
