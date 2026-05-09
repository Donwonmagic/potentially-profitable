// Phase W.1 (The Window) — direct-line correspondence storage,
// validation, and helpers. Sibling to src/lib/submissions.js.
//
// Stores per-user threads with Don in the AUTH_SESSIONS KV namespace
// alongside save:/watch:/property:/submission:/approved-fieldnote:
// keys:
//
//   window:thread:<sub>:<threadId>  → JSON {
//     id, sub, status:'open'|'closed'|'archived',
//     createdAt, updatedAt,
//     lastDonReplyAt?, lastUserMsgAt?,
//     msgCount, unreadByUser, unreadByAdmin
//   }
//
//   window:msg:<threadId>:<msgId>   → JSON {
//     id, threadId, sub, from:'user'|'don',
//     body,                ← already-escaped plaintext
//     createdAt
//   }
//
//   window:thread-index:<sub>       → JSON { threadIds:[...] }
//   window:admin-index:<bucketDay>  → JSON { entries:[...] }
//                                     (YYYY-MM-DD bucket of updatedAt)
//   window:throttle:<sub>           → JSON { lastUserMsgAt, dayCount, dayBucket }
//                                     (TTL 48h)
//   window:pending-don:<sub>        → JSON { firstAt, msgIds:[...] }
//                                     (TTL 5m, batched email coalescing)
//   window:meta:active              → JSON { lastSeen, replyingTo? }
//
// One thread per user lifetime, capped at 100 messages. When a
// thread reaches the cap, a new thread is opened on next append.
// Archived threads remove from the admin index but persist in KV
// for audit forever.

import { mintSaveItemId, isValidSaveItemIdShape } from './workbench.js';

export const THREAD_KEY_PREFIX        = 'window:thread:';
export const MSG_KEY_PREFIX           = 'window:msg:';
export const THREAD_INDEX_KEY_PREFIX  = 'window:thread-index:';
export const ADMIN_INDEX_KEY_PREFIX   = 'window:admin-index:';
export const THROTTLE_KEY_PREFIX      = 'window:throttle:';
export const PENDING_DON_KEY_PREFIX   = 'window:pending-don:';
export const META_ACTIVE_KEY          = 'window:meta:active';

// Phase 1a (Window redesign) — anonymous-first send keys.
// Anon threads are cookie-bound (md_anon_thread_id, see worker.js).
// The cookie's anonId IS the thread index — one thread per cookie
// lifetime. Message keys remain sub-agnostic (window:msg:<threadId>:
// <msgId>) so a future migration to a sub-keyed thread is a
// single-thread-row write, not a bulk re-key. See
// docs/window-redesign-plan.md §2.1 + §2.3.
export const THREAD_KEY_PREFIX_ANON   = 'window:thread:anon:';
export const THROTTLE_KEY_PREFIX_ANON = 'window:throttle:anon:';
export const THROTTLE_KEY_PREFIX_IP   = 'window:throttle:ip:';

export const MAX_MSG_LENGTH         = 4000;
export const MIN_MSG_LENGTH         = 1;
export const MAX_MSGS_PER_THREAD    = 100;
export const MAX_MSGS_PER_DAY       = 50;
export const MAX_ANON_MSGS_PER_DAY  = 5;   // tighter cap for unidentified anons
export const APPEND_BACK_PRESSURE_MS = 60 * 1000;
export const THROTTLE_TTL_SEC       = 48 * 3600;
export const PENDING_DON_TTL_SEC    = 5 * 60;
export const PENDING_DON_BATCH_MS   = 2 * 60 * 1000;

export const THREAD_STATUSES = new Set(['open', 'closed', 'archived']);

// Mirror save/submission id shape (10-char alphabet, ~49 bits).
// Visual URL consistency across save/property/submission/window.
export const mintThreadId = mintSaveItemId;
export const mintMessageId = mintSaveItemId;

export function threadKey(sub, threadId) {
  return THREAD_KEY_PREFIX + sub + ':' + threadId;
}
export function msgKey(threadId, msgId) {
  return MSG_KEY_PREFIX + threadId + ':' + msgId;
}
export function threadIndexKey(sub) {
  return THREAD_INDEX_KEY_PREFIX + sub;
}
export function adminIndexKey(bucketDay) {
  return ADMIN_INDEX_KEY_PREFIX + bucketDay;
}
export function throttleKey(sub) {
  return THROTTLE_KEY_PREFIX + sub;
}
export function pendingDonKey(sub) {
  return PENDING_DON_KEY_PREFIX + sub;
}

// YYYY-MM-DD bucket from a millisecond timestamp.
export function dayBucket(ts) {
  const d = new Date(ts || Date.now());
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
}

// Minimal HTML escape — bodies are already-escaped at write time
// via sanitizePlaintext (imported by callers from submissions.js).
// This module's validators only check shape, not escape.
export function validateMessageBody(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'body-required' };
  }
  const body = String(input.body == null ? '' : input.body);
  if (body.length < MIN_MSG_LENGTH) {
    return { ok: false, error: 'body-too-short' };
  }
  if (body.length > MAX_MSG_LENGTH) {
    return { ok: false, error: 'body-too-long', max: MAX_MSG_LENGTH };
  }
  return { ok: true, body };
}

// Returns the user's open thread or null. If multiple threads
// exist (e.g., previous one hit the 100-msg cap), returns the
// newest open one.
export async function getOpenThreadForUser(env, sub) {
  const idxRaw = await env.AUTH_SESSIONS.get(threadIndexKey(sub));
  if (!idxRaw) return null;
  let idx;
  try { idx = JSON.parse(idxRaw); } catch { return null; }
  const ids = Array.isArray(idx.threadIds) ? idx.threadIds : [];
  // Iterate newest-first; return the first open thread.
  for (let i = ids.length - 1; i >= 0; i--) {
    const raw = await env.AUTH_SESSIONS.get(threadKey(sub, ids[i]));
    if (!raw) continue;
    try {
      const t = JSON.parse(raw);
      if (t.status === 'open' || t.status === 'closed') return t;
    } catch (_) { /* skip */ }
  }
  return null;
}

export async function getThreadById(env, sub, threadId) {
  if (!isValidSaveItemIdShape(threadId)) return null;
  const raw = await env.AUTH_SESSIONS.get(threadKey(sub, threadId));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// List recent messages for a thread, newest-first, paginated.
// Returns up to `limit` items; uses a list scan over the
// msg:<threadId>:* prefix.
export async function listThreadMessages(env, threadId, limit = 50) {
  if (!isValidSaveItemIdShape(threadId)) return [];
  const result = await env.AUTH_SESSIONS.list({ prefix: MSG_KEY_PREFIX + threadId + ':' });
  const items = [];
  for (const k of result.keys) {
    const raw = await env.AUTH_SESSIONS.get(k.name);
    if (!raw) continue;
    try { items.push(JSON.parse(raw)); } catch (_) { /* skip */ }
  }
  items.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  return items.slice(-limit);
}

// Create a new thread for a user. Updates the per-user index.
// `email` is stored on the thread row so the admin reply path can
// look up the recipient address without a separate KV scan.
export async function createThread(env, sub, email = null) {
  let id = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = mintThreadId();
    const probe = await env.AUTH_SESSIONS.get(threadKey(sub, candidate));
    if (!probe) { id = candidate; break; }
  }
  if (!id) throw new Error('mint-collision');
  const now = Date.now();
  const thread = {
    id,
    sub,
    email: email || null,
    status: 'open',
    createdAt: now,
    updatedAt: now,
    msgCount: 0,
    unreadByUser: false,
    unreadByAdmin: false,
  };
  await env.AUTH_SESSIONS.put(threadKey(sub, id), JSON.stringify(thread));
  // Update per-user index.
  const idxRaw = await env.AUTH_SESSIONS.get(threadIndexKey(sub));
  let idx = { threadIds: [] };
  if (idxRaw) {
    try { idx = JSON.parse(idxRaw); } catch (_) { /* reset */ }
  }
  if (!Array.isArray(idx.threadIds)) idx.threadIds = [];
  idx.threadIds.push(id);
  await env.AUTH_SESSIONS.put(threadIndexKey(sub), JSON.stringify(idx));
  return thread;
}

// Append a message to a thread. Returns { ok, msg } or
// { ok:false, error }. Caller must have already passed
// validation + back-pressure + day-cap checks.
export async function appendMessageToThread(env, sub, thread, from, body) {
  if (thread.status === 'archived') {
    return { ok: false, error: 'thread-archived' };
  }
  if ((thread.msgCount || 0) >= MAX_MSGS_PER_THREAD) {
    return { ok: false, error: 'thread-full', max: MAX_MSGS_PER_THREAD };
  }
  let msgId = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = mintMessageId();
    const probe = await env.AUTH_SESSIONS.get(msgKey(thread.id, candidate));
    if (!probe) { msgId = candidate; break; }
  }
  if (!msgId) return { ok: false, error: 'mint-collision' };
  const now = Date.now();
  const msg = { id: msgId, threadId: thread.id, sub, from, body, createdAt: now };
  await env.AUTH_SESSIONS.put(msgKey(thread.id, msgId), JSON.stringify(msg));

  // Update thread row.
  thread.msgCount = (thread.msgCount || 0) + 1;
  thread.updatedAt = now;
  if (from === 'user') {
    thread.lastUserMsgAt = now;
    thread.unreadByAdmin = true;
    if (thread.status === 'closed') thread.status = 'open'; // auto-reopen
  } else {
    thread.lastDonReplyAt = now;
    thread.unreadByUser = true;
  }
  await env.AUTH_SESSIONS.put(threadKey(sub, thread.id), JSON.stringify(thread));

  // Update admin index for cheap admin-list scans.
  await upsertAdminIndex(env, thread);

  return { ok: true, msg, thread };
}

// Add or refresh a thread's entry in the admin index for the day
// of `updatedAt`. Cheap, eventually consistent — the admin list
// merges N recent buckets newest-first.
async function upsertAdminIndex(env, thread) {
  const bucket = dayBucket(thread.updatedAt);
  const key = adminIndexKey(bucket);
  const raw = await env.AUTH_SESSIONS.get(key);
  let row = { entries: [] };
  if (raw) {
    try { row = JSON.parse(raw); } catch (_) { /* reset */ }
  }
  if (!Array.isArray(row.entries)) row.entries = [];
  // Replace any prior entry for this thread in the same bucket.
  row.entries = row.entries.filter((e) => e.threadId !== thread.id);
  // Anon threads carry `kind:'anon'` and `anonId` instead of `sub`.
  // Admin queue consumers branch on `kind` (or `sub == null`) to
  // render the "not signed in" chip.
  const entry = {
    threadId: thread.id,
    sub: thread.sub || null,
    updatedAt: thread.updatedAt,
    unreadByAdmin: !!thread.unreadByAdmin,
    status: thread.status,
  };
  if (thread.kind === 'anon' || thread.anonId) {
    entry.kind = 'anon';
    entry.anonId = thread.anonId;
  }
  // Phase 1b — crisis tier surfaces in the admin queue so Don can
  // see a red/yellow bar at-a-glance. The kind-of-flag persists at
  // the thread level (above) AND on the index entry (here) so the
  // queue scan in iterateAdminQueue doesn't have to re-fetch the
  // thread row to render.
  if (thread.crisisTier === 'tier1' || thread.crisisTier === 'tier2') {
    entry.crisisTier = thread.crisisTier;
  }
  row.entries.push(entry);
  await env.AUTH_SESSIONS.put(key, JSON.stringify(row));
}

// Iterate the admin queue newest-first by walking the most recent
// buckets. Caller passes how many days back to scan. Yields
// { entry, thread } for each thread in the buckets, sorted desc
// by updatedAt.
export async function iterateAdminQueue(env, daysBack = 30) {
  const buckets = [];
  const now = Date.now();
  for (let i = 0; i < daysBack; i++) {
    buckets.push(dayBucket(now - i * 24 * 3600 * 1000));
  }
  const seen = new Set(); // dedupe across buckets (a thread updated
                          // today and yesterday appears in both)
  const all = [];
  for (const b of buckets) {
    const raw = await env.AUTH_SESSIONS.get(adminIndexKey(b));
    if (!raw) continue;
    try {
      const row = JSON.parse(raw);
      for (const e of (row.entries || [])) {
        if (seen.has(e.threadId)) continue;
        seen.add(e.threadId);
        all.push(e);
      }
    } catch (_) { /* skip */ }
  }
  all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return all;
}

// Throttle helper — enforces 60s back-pressure + 50/day cap.
// Returns { ok } or { ok:false, error, retryAfter? }.
export async function checkAndStampThrottle(env, sub) {
  const now = Date.now();
  const today = dayBucket(now);
  const raw = await env.AUTH_SESSIONS.get(throttleKey(sub));
  let row = { lastUserMsgAt: 0, dayCount: 0, dayBucket: today };
  if (raw) {
    try { row = JSON.parse(raw); } catch (_) { /* reset */ }
  }
  // Reset day count when bucket flips.
  if (row.dayBucket !== today) {
    row.dayBucket = today;
    row.dayCount = 0;
  }
  const elapsed = now - (row.lastUserMsgAt || 0);
  if (elapsed < APPEND_BACK_PRESSURE_MS) {
    return { ok: false, error: 'rate-limited', retryAfter: Math.ceil((APPEND_BACK_PRESSURE_MS - elapsed) / 1000) };
  }
  if (row.dayCount >= MAX_MSGS_PER_DAY) {
    return { ok: false, error: 'day-cap-reached', max: MAX_MSGS_PER_DAY };
  }
  row.lastUserMsgAt = now;
  row.dayCount = (row.dayCount || 0) + 1;
  await env.AUTH_SESSIONS.put(throttleKey(sub), JSON.stringify(row), { expirationTtl: THROTTLE_TTL_SEC });
  return { ok: true };
}

// Add a message id to the pending-don batch (for email coalescing).
// Creates the row if missing; appends if exists. The cron flushes
// rows whose firstAt is older than PENDING_DON_BATCH_MS.
//
// `kind` is 'identified' (default — keyed by sub) or 'anon' (keyed by
// anonId). The cron handler dispatches on this so anon threads get
// notified through the anon-aware path. Without `kind`, anon rows
// would route through getOpenThreadForUser (sub-keyed) and silently
// drop. See docs/window-redesign-plan.md §2.1, audit B1.
export async function pushPendingDon(env, suffix, msgId, kind = 'identified') {
  const raw = await env.AUTH_SESSIONS.get(pendingDonKey(suffix));
  const now = Date.now();
  let row;
  if (raw) {
    try {
      row = JSON.parse(raw);
      row.msgIds = Array.isArray(row.msgIds) ? row.msgIds : [];
      row.msgIds.push(msgId);
      // Preserve existing kind if present; older rows pre-this-fix
      // default to 'identified'.
      if (!row.kind) row.kind = kind;
    } catch (_) {
      row = { firstAt: now, msgIds: [msgId], kind };
    }
  } else {
    row = { firstAt: now, msgIds: [msgId], kind };
  }
  await env.AUTH_SESSIONS.put(pendingDonKey(suffix), JSON.stringify(row), { expirationTtl: PENDING_DON_TTL_SEC });
  return row;
}

// Iterate pending-don rows ready to flush (older than batch window).
// Yields the suffix (sub OR anonId), the row, the kind, and the key.
// Pre-fix rows without `kind` default to 'identified' for backward
// compatibility — they'll route through the existing sub-keyed path.
export async function* iteratePendingDonReady(env) {
  const result = await env.AUTH_SESSIONS.list({ prefix: PENDING_DON_KEY_PREFIX });
  const now = Date.now();
  for (const k of result.keys) {
    const raw = await env.AUTH_SESSIONS.get(k.name);
    if (!raw) continue;
    let row;
    try { row = JSON.parse(raw); } catch (_) { continue; }
    if (!row.firstAt || (now - row.firstAt) < PENDING_DON_BATCH_MS) continue;
    const suffix = k.name.slice(PENDING_DON_KEY_PREFIX.length);
    const kind = row.kind === 'anon' ? 'anon' : 'identified';
    // Backward-compatible alias: callers expecting `sub` get the
    // suffix only when this is an identified row.
    yield {
      suffix,
      sub: kind === 'identified' ? suffix : null,
      anonId: kind === 'anon' ? suffix : null,
      kind,
      row,
      key: k.name,
    };
  }
}

export async function setActiveMeta(env, payload) {
  await env.AUTH_SESSIONS.put(META_ACTIVE_KEY, JSON.stringify({
    lastSeen: Date.now(),
    ...(payload || {}),
  }));
}

export async function getActiveMeta(env) {
  const raw = await env.AUTH_SESSIONS.get(META_ACTIVE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────
// Phase 1a (Window redesign) — Anonymous-first send.
//
// Anon threads are cookie-bound (md_anon_thread_id, see worker.js).
// The cookie's anonId IS the per-user index — one thread per cookie
// lifetime. The internal threadId is minted distinct from anonId so
// a future claim-via-magic-link migration preserves the threadId
// across the rekey from anon-prefix to sub-prefix.
//
// Message keys remain sub-agnostic (`window:msg:<threadId>:<msgId>`)
// so a claim is a single thread-row write, not a bulk re-key.
//
// Lower per-day cap (5 vs 50) because anon identity is unverified.
// Per-IP throttle on top defeats cookie-cycling abuse.
//
// Reference: docs/window-redesign-plan.md §2.1, §2.3.

export const mintAnonId = mintSaveItemId;

export function anonThreadKey(anonId) {
  return THREAD_KEY_PREFIX_ANON + anonId;
}

export function anonThrottleKey(anonId) {
  return THROTTLE_KEY_PREFIX_ANON + anonId;
}

export function ipThrottleKey(ipHash) {
  return THROTTLE_KEY_PREFIX_IP + ipHash;
}

// SHA-256 hex of an IP address. The key-suffix for per-IP throttling
// on anon paths so we don't write raw IPs into KV.
export async function hashIp(ip) {
  if (!ip) return null;
  const enc = new TextEncoder().encode(String(ip));
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const bytes = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const h = bytes[i].toString(16);
    out += h.length === 1 ? '0' + h : h;
  }
  return out;
}

// Returns the anon thread for an anonId or null. anonId IS the index;
// no scanning needed. Claimed threads are treated as no-thread —
// after migrateAnonThread runs, the anon row stays in KV with a
// claimedBy stamp + 30d TTL for audit, but the cookie path must
// not append to it. (handleAuthVerify also clears the anon cookie
// on claim; this is defense in depth for the edge case where the
// cookie outlives session expiry on the same device.)
export async function getOpenThreadForAnon(env, anonId) {
  if (!isValidSaveItemIdShape(anonId)) return null;
  const raw = await env.AUTH_SESSIONS.get(anonThreadKey(anonId));
  if (!raw) return null;
  try {
    const t = JSON.parse(raw);
    if (t.claimedBy) return null;
    if (t.status === 'open' || t.status === 'closed') return t;
  } catch (_) { /* drop */ }
  return null;
}

// Create an anon thread. Stores under `window:thread:anon:<anonId>`.
// `locale` (optional) is recorded so the admin queue + email
// templates can branch.
//
// Audit S3 — refuses to overwrite a row that has been claimed
// (claimedBy stamp set). Without this, a stale anon-cookie request
// arriving after migrateAnonThread would clobber the claimed-row
// audit stamp and replace it with a fresh anon thread (since
// getOpenThreadForAnon returns null on claimedBy, the caller would
// otherwise fall straight here). Returns the special error
// 'anon-id-claimed' so handleWindowAppend can clear the stale cookie
// and prompt the operator to sign in.
export async function createAnonThread(env, anonId, locale = null) {
  if (!isValidSaveItemIdShape(anonId)) throw new Error('invalid-anon-id');
  const existingRaw = await env.AUTH_SESSIONS.get(anonThreadKey(anonId));
  if (existingRaw) {
    try {
      const existing = JSON.parse(existingRaw);
      if (existing && existing.claimedBy) {
        throw new Error('anon-id-claimed');
      }
    } catch (err) {
      if (err && err.message === 'anon-id-claimed') throw err;
      // Parse error → row is corrupt; safe to overwrite.
    }
  }
  let id = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = mintThreadId();
    // Best-effort uniqueness probe via the message-key prefix (msg
    // keys are global per threadId). Acceptable at 49-bit entropy.
    const probe = await env.AUTH_SESSIONS.list({ prefix: MSG_KEY_PREFIX + candidate + ':', limit: 1 });
    if (!probe.keys || probe.keys.length === 0) { id = candidate; break; }
  }
  if (!id) throw new Error('mint-collision');
  const now = Date.now();
  const thread = {
    id,
    kind: 'anon',
    anonId,
    sub: null,
    email: null,
    locale: locale || null,
    status: 'open',
    createdAt: now,
    updatedAt: now,
    msgCount: 0,
    unreadByUser: false,
    unreadByAdmin: false,
  };
  await env.AUTH_SESSIONS.put(anonThreadKey(anonId), JSON.stringify(thread));
  return thread;
}

// Same body validation + thread-cap behavior as appendMessageToThread
// but writes to anonThreadKey + admin index entry tagged with anonId.
// Message keys remain sub-agnostic so a future claim is a single-row
// rewrite of the thread metadata, not a bulk re-key.
export async function appendMessageToAnonThread(env, anonId, thread, from, body) {
  if (thread.status === 'archived') {
    return { ok: false, error: 'thread-archived' };
  }
  if ((thread.msgCount || 0) >= MAX_MSGS_PER_THREAD) {
    return { ok: false, error: 'thread-full', max: MAX_MSGS_PER_THREAD };
  }
  let msgId = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = mintMessageId();
    const probe = await env.AUTH_SESSIONS.get(msgKey(thread.id, candidate));
    if (!probe) { msgId = candidate; break; }
  }
  if (!msgId) return { ok: false, error: 'mint-collision' };
  const now = Date.now();
  const msg = { id: msgId, threadId: thread.id, anonId, from, body, createdAt: now };
  await env.AUTH_SESSIONS.put(msgKey(thread.id, msgId), JSON.stringify(msg));

  thread.msgCount = (thread.msgCount || 0) + 1;
  thread.updatedAt = now;
  if (from === 'user') {
    thread.lastUserMsgAt = now;
    thread.unreadByAdmin = true;
    if (thread.status === 'closed') thread.status = 'open';
  } else {
    thread.lastDonReplyAt = now;
    thread.unreadByUser = true;
  }
  await env.AUTH_SESSIONS.put(anonThreadKey(anonId), JSON.stringify(thread));

  await upsertAdminIndex(env, thread);

  return { ok: true, msg, thread };
}

// Per-anonId throttle. 5/day cap (vs 50/day for identified) shares
// the 60s back-pressure window with the identified path so a
// signed-in operator who started anon doesn't double-rate-limit.
export async function checkAndStampAnonThrottle(env, anonId) {
  const now = Date.now();
  const today = dayBucket(now);
  const raw = await env.AUTH_SESSIONS.get(anonThrottleKey(anonId));
  let row = { lastUserMsgAt: 0, dayCount: 0, dayBucket: today };
  if (raw) {
    try { row = JSON.parse(raw); } catch (_) { /* reset */ }
  }
  if (row.dayBucket !== today) {
    row.dayBucket = today;
    row.dayCount = 0;
  }
  const elapsed = now - (row.lastUserMsgAt || 0);
  if (elapsed < APPEND_BACK_PRESSURE_MS) {
    return { ok: false, error: 'rate-limited', retryAfter: Math.ceil((APPEND_BACK_PRESSURE_MS - elapsed) / 1000) };
  }
  if (row.dayCount >= MAX_ANON_MSGS_PER_DAY) {
    return { ok: false, error: 'day-cap-reached', max: MAX_ANON_MSGS_PER_DAY };
  }
  row.lastUserMsgAt = now;
  row.dayCount = (row.dayCount || 0) + 1;
  await env.AUTH_SESSIONS.put(anonThrottleKey(anonId), JSON.stringify(row), { expirationTtl: THROTTLE_TTL_SEC });
  return { ok: true };
}

// Per-anon back-pressure on email-attach (audit S2). Different from
// the message-send throttle: no day-cap, just a 60s cooldown so an
// attacker with the cookie can't churn the email field before each
// of Don's replies arrives. Returns the same shape as the other
// throttle helpers.
export async function checkAndStampEmailAttachThrottle(env, anonId) {
  if (!isValidSaveItemIdShape(anonId)) return { ok: false, error: 'invalid-anon-id' };
  const key = THROTTLE_KEY_PREFIX_ANON + 'email-attach:' + anonId;
  const now = Date.now();
  const raw = await env.AUTH_SESSIONS.get(key);
  let row = { lastAt: 0 };
  if (raw) {
    try { row = JSON.parse(raw); } catch (_) { /* reset */ }
  }
  const elapsed = now - (row.lastAt || 0);
  if (elapsed < APPEND_BACK_PRESSURE_MS) {
    return { ok: false, error: 'rate-limited', retryAfter: Math.ceil((APPEND_BACK_PRESSURE_MS - elapsed) / 1000) };
  }
  row.lastAt = now;
  await env.AUTH_SESSIONS.put(key, JSON.stringify(row), { expirationTtl: THROTTLE_TTL_SEC });
  return { ok: true };
}

// Update an anon thread's email field. Returns the updated thread or
// null if the thread doesn't exist. Idempotent — no-op when the email
// is already set to the same value. Used by /api/window/email when
// the operator opts into email replies post-send.
export async function setAnonThreadEmail(env, anonId, email) {
  if (!isValidSaveItemIdShape(anonId)) return null;
  const raw = await env.AUTH_SESSIONS.get(anonThreadKey(anonId));
  if (!raw) return null;
  let thread;
  try { thread = JSON.parse(raw); } catch { return null; }
  if (thread.email === email) return thread; // idempotent
  thread.email = email;
  thread.updatedAt = Date.now();
  await env.AUTH_SESSIONS.put(anonThreadKey(anonId), JSON.stringify(thread));
  return thread;
}

// Migrate an anon thread to sub-keyed identified storage. Runs when
// an operator clicks Don's reply email (which contains a one-shot
// claim-magic-link token bound to their anonId). The migration is
// metadata-only:
//
//   - Read anon thread row at window:thread:anon:<anonId>
//   - Skip if missing or already claimed (idempotent re-run)
//   - Mint a sub-keyed row at window:thread:<sub>:<threadId> carrying
//     the SAME threadId, sub, email
//   - Update window:thread-index:<sub> to include threadId
//   - Stamp the anon row with {claimedBy:sub, claimedAt} + 30d TTL
//     for safe rollback
//   - upsertAdminIndex with the new sub-keyed shape (admin queue
//     stops showing the anon entry; entries dedupe on threadId)
//
// Message keys (window:msg:<threadId>:<msgId>) are NOT moved — they're
// sub-agnostic by design (src/lib/window.js:64-66). The migration
// preserves the threadId so the messages remain reachable through
// either keying.
//
// Returns { ok, thread } on success or { ok:false, error } on
// no-op / failure.
export async function migrateAnonThread(env, anonId, sub, email) {
  if (!isValidSaveItemIdShape(anonId)) return { ok: false, error: 'invalid-anon-id' };
  if (typeof sub !== 'string' || !sub) return { ok: false, error: 'invalid-sub' };

  const anonRaw = await env.AUTH_SESSIONS.get(anonThreadKey(anonId));
  if (!anonRaw) return { ok: false, error: 'anon-thread-not-found' };

  let anonThread;
  try { anonThread = JSON.parse(anonRaw); } catch { return { ok: false, error: 'anon-thread-corrupt' }; }

  // Idempotent: a duplicate verify (e.g., user opens the email twice
  // quickly) finds the row already claimed and returns the existing
  // sub-keyed thread instead of double-migrating.
  if (anonThread.claimedBy === sub) {
    const existingRaw = await env.AUTH_SESSIONS.get(threadKey(sub, anonThread.id));
    if (existingRaw) {
      try { return { ok: true, thread: JSON.parse(existingRaw), alreadyClaimed: true }; }
      catch { /* fall through to re-write */ }
    }
  }
  if (anonThread.claimedBy && anonThread.claimedBy !== sub) {
    return { ok: false, error: 'anon-thread-already-claimed-by-other' };
  }

  const now = Date.now();
  const subThread = {
    id: anonThread.id,
    sub,
    email: email || anonThread.email || null,
    locale: anonThread.locale || null,
    status: anonThread.status || 'open',
    createdAt: anonThread.createdAt || now,
    updatedAt: now,
    msgCount: anonThread.msgCount || 0,
    unreadByUser: !!anonThread.unreadByUser,
    unreadByAdmin: !!anonThread.unreadByAdmin,
    claimedFromAnon: anonId,
    claimedAt: now,
  };
  // Carry forward the timestamps if present.
  if (anonThread.lastUserMsgAt) subThread.lastUserMsgAt = anonThread.lastUserMsgAt;
  if (anonThread.lastDonReplyAt) subThread.lastDonReplyAt = anonThread.lastDonReplyAt;

  await env.AUTH_SESSIONS.put(threadKey(sub, anonThread.id), JSON.stringify(subThread));

  // Update per-user thread index (idempotent — uses Set semantics).
  const idxRaw = await env.AUTH_SESSIONS.get(threadIndexKey(sub));
  let idx = { threadIds: [] };
  if (idxRaw) {
    try { idx = JSON.parse(idxRaw); } catch (_) { /* reset */ }
  }
  if (!Array.isArray(idx.threadIds)) idx.threadIds = [];
  if (!idx.threadIds.includes(anonThread.id)) {
    idx.threadIds.push(anonThread.id);
    await env.AUTH_SESSIONS.put(threadIndexKey(sub), JSON.stringify(idx));
  }

  // Stamp the anon row as claimed + set 30d TTL for rollback safety.
  // Keep the row body intact so a future bug investigation can read
  // exactly what was migrated.
  anonThread.claimedBy = sub;
  anonThread.claimedAt = now;
  await env.AUTH_SESSIONS.put(anonThreadKey(anonId), JSON.stringify(anonThread), {
    expirationTtl: 30 * 24 * 3600,
  });

  // Refresh admin index entry so the queue stops showing the anon
  // shape and starts showing the sub-keyed shape. Same threadId, so
  // the existing entries.filter(threadId match) replaces in place.
  await upsertAdminIndex(env, subThread);

  return { ok: true, thread: subThread, alreadyClaimed: false };
}

// Phase 1b — PII pre-write gate. Refuses to store a body that
// looks like it carries credit-card numbers, SSNs, or passwords.
// Caller surfaces a polite error so the operator emails Don directly
// (or calls). The plan §2.6 says: "On match: do not store body;
// reply 'I don't take card numbers or passwords through the Window
// — email me directly or call.'"
//
// Trade-offs: false positives are acceptable (operator just gets
// nudged toward a more-secure channel); false negatives are NOT
// (storing a CC means Don's KV is in PCI scope, and we're not).
//
// Returns null if the body looks clean, or one of:
//   { kind: 'credit-card' }
//   { kind: 'ssn' }
//   { kind: 'password' }
export function detectLikelyPII(body) {
  if (typeof body !== 'string' || !body) return null;
  const text = body;

  // Credit card: 13-19 digits with common separators (space, dash).
  // Pre-filter via regex, then verify with Luhn so "1234 5678 9012 3456"
  // (16 digits but invalid checksum) doesn't trip on receipts/order
  // numbers a restaurant operator might paste.
  const ccRegex = /(?:\d[\s-]?){12,18}\d/g;
  let m;
  while ((m = ccRegex.exec(text)) !== null) {
    const digits = m[0].replace(/[\s-]/g, '');
    if (digits.length >= 13 && digits.length <= 19 && _luhnValid(digits)) {
      return { kind: 'credit-card' };
    }
  }

  // SSN: NNN-NN-NNNN. Boundary anchors prevent the date-format
  // false positive (e.g., 123-45-6789 vs 2024-01-15 doesn't match).
  if (/(?:^|[^\d-])\d{3}-\d{2}-\d{4}(?:[^\d]|$)/.test(text)) {
    return { kind: 'ssn' };
  }

  // Password keywords (EN + ES). Look for "<word> is/=/:" patterns
  // that strongly indicate the operator is about to type a credential.
  // The English alphabet check on the trailing context keeps
  // common phrases like "password protection is good" from matching.
  const lower = text.toLowerCase();
  const passwordPatterns = [
    /\bpassword\s+is\s+\S/,
    /\bpassword\s*[:=]\s*\S/,
    /\bmy\s+password\s+\S/,
    /\bcontrase[nñ]a\s+es\s+\S/,
    /\bcontrase[nñ]a\s*[:=]\s*\S/,
    /\bmi\s+contrase[nñ]a\s+\S/,
    /\bclave\s+es\s+\S/,
    /\bclave\s*[:=]\s*\S/,
  ];
  for (const re of passwordPatterns) {
    if (re.test(lower)) return { kind: 'password' };
  }

  return null;
}

// Luhn checksum for credit-card validation. Right-to-left, double
// every second digit, sum digits, mod 10 == 0.
function _luhnValid(digits) {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// Phase 1b — crisis-keyword triage (server-side scan only; SMS
// dispatch deferred to Phase 2). Returns:
//   null      — no match
//   'tier1'   — urgent: surface to Don as a red bar in admin
//   'tier2'   — welfare-check: surface as a yellow bar in admin
//
// Allowlist-only matching to avoid pathologizing normal restaurant
// vocabulary (closing tomorrow could be a planned end-of-week
// closing, etc — the keyword presence is a signal, not a diagnosis).
// The crisis path is paired in the worker with an admin-flag write;
// the operator-facing referral footer (988 / Chefs With Issues /
// CHOW) lives in the Phase 2 composer UI and is text-only — this
// scan does not auto-acknowledge or interrupt the send.
export function detectCrisisTier(body) {
  if (typeof body !== 'string' || !body) return null;
  const lower = body.toLowerCase();

  const tier1Keywords = [
    'kill myself', 'kill my self',
    'end my life', 'end it all',
    "can't keep going", 'cant keep going',
    "can't go on", 'cant go on',
    'hurt myself', 'harm myself',
    'suicide', 'suicidal',
    // ES — narrow allowlist; the Tier-1 set must be specific enough
    // not to match poetic figures of speech.
    'suicidio', 'suicida',
    'quitarme la vida', 'quitar la vida',
    'acabar con todo', 'acabar conmigo',
    'no aguanto más', 'no aguanto mas',
  ];
  for (const k of tier1Keywords) {
    if (lower.indexOf(k) !== -1) return 'tier1';
  }

  const tier2Keywords = [
    'breakdown', 'mental breakdown',
    'evicted', 'eviction',
    'bankruptcy', 'bankrupt',
    'closing tomorrow', 'closing next week',
    'domestic violence', 'domestic abuse',
    'crisis',
    // ES
    'quiebra', 'me quiebro',
    'desahucio', 'desalojo',
    'crisis',
    'violencia doméstica', 'violencia domestica',
  ];
  for (const k of tier2Keywords) {
    if (lower.indexOf(k) !== -1) return 'tier2';
  }

  return null;
}

// Per-IP throttle — defeats cookie-cycling abuse. 5/day cap on the
// IP-hash regardless of how many anon cookies cycled. Returns ok
// without writing if no IP is available (best-effort).
export async function checkAndStampIpThrottle(env, ipHash) {
  if (!ipHash) return { ok: true };
  const now = Date.now();
  const today = dayBucket(now);
  const raw = await env.AUTH_SESSIONS.get(ipThrottleKey(ipHash));
  let row = { dayCount: 0, dayBucket: today };
  if (raw) {
    try { row = JSON.parse(raw); } catch (_) { /* reset */ }
  }
  if (row.dayBucket !== today) {
    row.dayBucket = today;
    row.dayCount = 0;
  }
  if (row.dayCount >= MAX_ANON_MSGS_PER_DAY) {
    return { ok: false, error: 'day-cap-reached', max: MAX_ANON_MSGS_PER_DAY };
  }
  row.dayCount = (row.dayCount || 0) + 1;
  await env.AUTH_SESSIONS.put(ipThrottleKey(ipHash), JSON.stringify(row), { expirationTtl: THROTTLE_TTL_SEC });
  return { ok: true };
}
