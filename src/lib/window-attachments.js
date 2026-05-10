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
//   R2: attach/<threadId>/<msgId>/<attachId>.<ext>
//     The slash-delimited prefix lets us list all attachments for a
//     thread (cleanup) or a message (admin view) with a single
//     prefix scan. Per audit S3, the per-anon lifetime counter
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
