// Phase 2 (Workshop) — saved-items library.
//
// Stores per-user "saves" in the AUTH_SESSIONS KV namespace. Schema:
//
//   save:<sub>:<itemId>  → JSON { id, kind, title, payload, createdAt }
//
// where:
//   <sub>     = sha256(email), the same stable user id the session
//               cookie carries. Per-user scoping at the key level
//               means a missing IDOR check at the call site can't
//               leak items across users — the prefix scan only
//               returns the caller's own keys.
//   <itemId>  = 10-char token from the same alphabet as snapshot
//               tokens (excludes look-alikes 0/O/1/I/l), ~49 bits
//               entropy. Random and not user-supplied so an attacker
//               can't guess sibling ids.
//
// kind is a closed enum tracking which tool produced the save. The
// /workbench/ list renders a chip per kind; Phase 3 will use it to
// route "Open" actions back into the originating tool with state.
//
// Why one KV namespace (AUTH_SESSIONS) for both auth AND saves:
// Both are session-lifetime data scoped by the same `sub`. Phase 0
// already documented AUTH_SESSIONS as "the auth + saves namespace"
// in wrangler.jsonc. Splitting them would double the KV-binding
// surface for no operational gain at the current scale (a typical
// operator will have <50 saves; KV per-namespace limit is 1 GB).

const SAVE_KEY_PREFIX = 'save:';

// 10 chars from a 30-symbol alphabet → ~49 bits entropy. Matches
// audit-snapshots' mintSnapshotToken so the user-facing url shape
// is the same across audit shares and saved-item ids.
const ITEM_ID_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ITEM_ID_LENGTH   = 10;

// Closed kind enum. Adding a kind is a one-line addition here PLUS
// a renderer in /workbench/index.html. Refusing unknown kinds at
// the API boundary keeps the workbench list page from rendering
// surprising rows.
const ALLOWED_KINDS = new Set([
  'audit', 'seo', 'gbp', 'mobile', 'schema', 'speed',
  'margin', 'plate', 'photo', 'menu', 'menu-copy', 'brand',
  'open-hours', 'compare', 'tech-stack', 'search-ideas',
  // Phase C.1 (Storefront Health) — composite kind whose payload
  // is just { propertyId }; the Workshop list rehydrates by
  // reading the underlying property:<sub>:<propertyId> row.
  'storefront-health',
  // Phase F.2 (Field Notes) — reader-submitted personal experience
  // tied to one blog article. Surfaced in the Workshop list with
  // a status pill (pending/approved/passed). Public render path:
  // /api/admin/submissions/decide → approved-fieldnote: KV →
  // data/article-fieldnotes.json → article HTML.
  'submission',
  // Phase 6 / Wave B6 (Advanced Invoice Decoder) — encrypted
  // line-item payload from a parsed supplier invoice. Payload
  // shape: { ciphertext, iv, v: 1, source, invoiceDate, ... }.
  // Saved rows MUST go through the envelope-encryption branch
  // in saveItem (B6-2); plaintext writes are rejected.
  'invoice-decoder',
]);

// Soft cap. Past this the save endpoint returns 409 with a clear
// message asking the user to delete some items first. Real
// operators rarely save more than ~20; 100 is a humane ceiling
// that catches pagination-loop bugs and casual abuse.
const MAX_SAVES_PER_USER = 100;

// Hard payload caps. title is short by design (it's the row label).
// payload max keeps a runaway tool from exhausting KV quota.
const MAX_TITLE_LENGTH   = 200;
const MAX_PAYLOAD_BYTES  = 50 * 1024; // 50 KB serialized

// Phase 3 (Workshop) — Watch list scaffolding.
// A "watch" attaches a re-check schedule to an existing saved item.
// The Cron Trigger (commented out in wrangler.jsonc until ops is
// ready to flip it on) iterates `watch:` keys, re-runs the
// underlying check, and emails the user when the score changes
// past a threshold. Two-key model keeps the live data path on the
// existing `save:` keys unchanged — a watch is purely additive.
//
//   watch:<sub>:<savedItemId>  → JSON {
//     savedItemId,         — id of the existing save:<sub>:<id> row
//     kind,                — copied from save row at attach time;
//                            short-circuits a second KV read on cron
//     schedule,            — 'daily' | 'weekly'
//     lastCheckedAt,       — ms epoch; null until first cron run
//     lastScore,           — 0..100 from most recent re-check, or null
//     baselineScore,       — score at attach time (for total-drift)
//     createdAt
//   }
//
// Only API-driven kinds can be watched — calculator-only kinds
// (margin, plate, photo, brand, etc.) have no automatic re-check
// path. Adding a new watchable kind: include it in WATCHABLE_KINDS
// AND wire a re-check function in src/lib/watch-checks.js (Phase 3
// implementation; not in this sprint's scaffolding).
const WATCH_KEY_PREFIX = 'watch:';
const WATCHABLE_KINDS  = new Set([
  'audit', 'seo', 'gbp', 'mobile', 'schema', 'speed',
]);
const ALLOWED_SCHEDULES = new Set(['daily', 'weekly']);

// Defense-in-depth cap: a single user can't subscribe to more
// re-checks than this. Past the cap, the API returns 409 with the
// limit. Combined with Cron's small batch-per-tick, prevents one
// over-eager operator from monopolising the cron's run budget.
const MAX_WATCHES_PER_USER = 25;

// Bug B2.7 (proactive audit) — stalled-watch threshold. After this
// many consecutive recheck failures (upstream 5xx, timeout, parse
// error, etc.), the cron stops retrying that watch and emails the
// user once. Prevents a doomed call from burning quota indefinitely.
const STALL_THRESHOLD = 5;

export {
  SAVE_KEY_PREFIX,
  ALLOWED_KINDS,
  MAX_SAVES_PER_USER,
  MAX_TITLE_LENGTH,
  MAX_PAYLOAD_BYTES,
  WATCH_KEY_PREFIX,
  WATCHABLE_KINDS,
  ALLOWED_SCHEDULES,
  MAX_WATCHES_PER_USER,
  STALL_THRESHOLD,
};

export function mintSaveItemId() {
  const bytes = new Uint8Array(ITEM_ID_LENGTH);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < ITEM_ID_LENGTH; i++) {
    out += ITEM_ID_ALPHABET[bytes[i] % ITEM_ID_ALPHABET.length];
  }
  return out;
}

export function isValidSaveItemIdShape(id) {
  if (typeof id !== 'string') return false;
  if (id.length !== ITEM_ID_LENGTH) return false;
  for (let i = 0; i < id.length; i++) {
    if (ITEM_ID_ALPHABET.indexOf(id[i]) === -1) return false;
  }
  return true;
}

// Validates the save payload from a logged-in user. Returns
// { ok: true, item } or { ok: false, error }.
export function validateSaveBody(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'body-required' };
  }
  const kind = typeof body.kind === 'string' ? body.kind.trim() : '';
  if (!kind || !ALLOWED_KINDS.has(kind)) {
    return { ok: false, error: 'invalid-kind' };
  }
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title || title.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: 'invalid-title' };
  }
  if (body.payload === undefined || body.payload === null) {
    return { ok: false, error: 'payload-required' };
  }
  let serialized;
  try { serialized = JSON.stringify(body.payload); } catch {
    return { ok: false, error: 'payload-not-serializable' };
  }
  if (serialized.length > MAX_PAYLOAD_BYTES) {
    return { ok: false, error: 'payload-too-large' };
  }
  return { ok: true, item: { kind, title, payload: body.payload } };
}

// Saves a new item for `sub`. Returns { ok, id } on success.
// Enforces MAX_SAVES_PER_USER by listing first; the list cost is
// one KV read on the save path which we're willing to pay to keep
// the cap honest.
export async function saveItem(env, sub, item) {
  const existingIds = await listItemIdsForUser(env, sub);
  if (existingIds.length >= MAX_SAVES_PER_USER) {
    return { ok: false, error: 'limit-reached', max: MAX_SAVES_PER_USER };
  }
  let id = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = mintSaveItemId();
    const existing = await env.AUTH_SESSIONS.get(saveKey(sub, candidate));
    if (!existing) { id = candidate; break; }
  }
  if (!id) return { ok: false, error: 'mint-collision' };
  const now = Date.now();
  const row = {
    id,
    kind: item.kind,
    title: item.title,
    payload: item.payload,
    createdAt: now,
  };
  await env.AUTH_SESSIONS.put(saveKey(sub, id), JSON.stringify(row));
  return { ok: true, id, createdAt: now };
}

// Returns just the lightweight summary fields for the list view —
// id, kind, title, createdAt. Skips payload so the response stays
// small when a user has many saves.
export async function listItemsForUser(env, sub) {
  const result = await env.AUTH_SESSIONS.list({ prefix: SAVE_KEY_PREFIX + sub + ':' });
  const items = [];
  // KV list returns keys only; we still need to read each row to
  // get title/kind/createdAt. With MAX_SAVES_PER_USER=100 this is
  // bounded and fine on the request path.
  for (const k of result.keys) {
    const raw = await env.AUTH_SESSIONS.get(k.name);
    if (!raw) continue;
    try {
      const row = JSON.parse(raw);
      items.push({
        id: row.id,
        kind: row.kind,
        title: row.title,
        createdAt: row.createdAt,
      });
    } catch (_) { /* skip corrupt rows */ }
  }
  // Newest first.
  items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return items;
}

// Returns the full row including payload, or null. Per-user scoping
// is enforced by the key prefix — passing a wrong sub returns null
// even if the id is real.
export async function getItem(env, sub, id) {
  if (!isValidSaveItemIdShape(id)) return null;
  const raw = await env.AUTH_SESSIONS.get(saveKey(sub, id));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// Idempotent. Returns { ok: true, deleted: boolean } so the caller
// can distinguish "we removed it" from "it was already gone".
export async function deleteItem(env, sub, id) {
  if (!isValidSaveItemIdShape(id)) return { ok: false, error: 'invalid-id' };
  const key = saveKey(sub, id);
  const existing = await env.AUTH_SESSIONS.get(key);
  if (!existing) return { ok: true, deleted: false };
  await env.AUTH_SESSIONS.delete(key);
  return { ok: true, deleted: true };
}

function saveKey(sub, id) {
  return SAVE_KEY_PREFIX + sub + ':' + id;
}

async function listItemIdsForUser(env, sub) {
  const result = await env.AUTH_SESSIONS.list({ prefix: SAVE_KEY_PREFIX + sub + ':' });
  return result.keys.map((k) => k.name);
}


// ─────────────────────────────────────────────────────────────────
// Phase 3 (Workshop) — Watch list helpers.
//
// Attach a re-check schedule to an existing saved item, list a
// user's active watches, detach, and (Phase 3 cron implementation)
// enumerate ALL watches across users for the scheduled job.

function watchKey(sub, savedItemId) {
  return WATCH_KEY_PREFIX + sub + ':' + savedItemId;
}

// Returns the count of watches a user currently has. Used by the
// API endpoint to enforce MAX_WATCHES_PER_USER without an extra
// list-then-count round-trip.
export async function countWatchesForUser(env, sub) {
  const result = await env.AUTH_SESSIONS.list({ prefix: WATCH_KEY_PREFIX + sub + ':' });
  return result.keys.length;
}

// Attaches a schedule to an existing saved item. Validates the
// underlying save exists and is a watchable kind. Returns
// { ok, error?, watch? }.
export async function attachWatch(env, sub, savedItemId, schedule) {
  if (!isValidSaveItemIdShape(savedItemId)) {
    return { ok: false, error: 'invalid-id' };
  }
  if (!ALLOWED_SCHEDULES.has(schedule)) {
    return { ok: false, error: 'invalid-schedule' };
  }
  const saveRaw = await env.AUTH_SESSIONS.get(saveKey(sub, savedItemId));
  if (!saveRaw) return { ok: false, error: 'save-not-found' };
  let saveRow;
  try { saveRow = JSON.parse(saveRaw); } catch { return { ok: false, error: 'save-corrupt' }; }
  if (!saveRow || !WATCHABLE_KINDS.has(saveRow.kind)) {
    return { ok: false, error: 'kind-not-watchable' };
  }
  const existing = await countWatchesForUser(env, sub);
  // Allow update-in-place (re-attach to refresh schedule) without
  // tripping the cap — only block when adding a NEW watch past the
  // ceiling. Check existence before counting.
  //
  // Bug B2.6 (proactive audit) — accepted TOCTOU tradeoff. KV has no
  // transactional CAS, so two simultaneous attach POSTs can both
  // pass this check before either writes. Worst case: a user with
  // exactly MAX_WATCHES_PER_USER - 1 existing watches double-clicks
  // and ends up with MAX + 1. The cap is a soft per-user-rate
  // limit, not a security boundary; the next attach reverts to the
  // hard rejection. If a future requirement makes this cap a real
  // boundary, route the increment through a Durable Object (the
  // RATE_LIMITER DO is already wired and supports CAS-style ops).
  const already = await env.AUTH_SESSIONS.get(watchKey(sub, savedItemId));
  if (!already && existing >= MAX_WATCHES_PER_USER) {
    return { ok: false, error: 'limit-reached', max: MAX_WATCHES_PER_USER };
  }
  // Pull baseline score from the save's payload if present. Each
  // watchable kind stores its score in a different field — Phase 3
  // can refine this; the scaffolding extracts a number when obvious
  // and falls back to null.
  const baselineScore = extractScoreFromPayload(saveRow.kind, saveRow.payload);
  const now = Date.now();
  const watchRow = already
    ? Object.assign(JSON.parse(already), { schedule })
    : {
        savedItemId,
        kind: saveRow.kind,
        schedule,
        lastCheckedAt: null,
        lastScore: null,
        baselineScore,
        createdAt: now,
      };
  await env.AUTH_SESSIONS.put(watchKey(sub, savedItemId), JSON.stringify(watchRow));
  return { ok: true, watch: watchRow };
}

// Lists watches for one user (UI fetch).
export async function listWatchesForUser(env, sub) {
  const result = await env.AUTH_SESSIONS.list({ prefix: WATCH_KEY_PREFIX + sub + ':' });
  const out = [];
  for (const k of result.keys) {
    const raw = await env.AUTH_SESSIONS.get(k.name);
    if (!raw) continue;
    try { out.push(JSON.parse(raw)); } catch (_) { /* skip */ }
  }
  out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return out;
}

// Detach. Idempotent.
export async function detachWatch(env, sub, savedItemId) {
  if (!isValidSaveItemIdShape(savedItemId)) {
    return { ok: false, error: 'invalid-id' };
  }
  const key = watchKey(sub, savedItemId);
  const existing = await env.AUTH_SESSIONS.get(key);
  if (!existing) return { ok: true, detached: false };
  await env.AUTH_SESSIONS.delete(key);
  return { ok: true, detached: true };
}

// Phase 3 cron entry point — enumerates EVERY watch in the
// namespace, regardless of user. Called from worker.js's
// scheduled() handler when the Cron Trigger fires. Cursor-paged
// so a future at-scale watch volume doesn't blow the per-call
// list budget. Yielded items pair the (sub, watch) so the caller
// can re-look-up the underlying save and write back the result.
//
// Each yielded item: { sub, watch }
export async function* iterateAllWatches(env) {
  let cursor = null;
  while (true) {
    const opts = { prefix: WATCH_KEY_PREFIX };
    if (cursor) opts.cursor = cursor;
    const page = await env.AUTH_SESSIONS.list(opts);
    for (const k of page.keys) {
      const raw = await env.AUTH_SESSIONS.get(k.name);
      if (!raw) continue;
      let watch;
      try { watch = JSON.parse(raw); } catch (_) { continue; }
      // Key shape: watch:<sub>:<savedItemId>. Extract sub.
      const parts = k.name.split(':');
      if (parts.length < 3) continue;
      const sub = parts.slice(1, -1).join(':');
      yield { sub, watch };
    }
    if (page.list_complete) break;
    if (!page.cursor) break;
    cursor = page.cursor;
  }
}

// After a Phase 3 cron re-check runs, the result is written back
// to update lastCheckedAt + lastScore. Separate from attachWatch
// so the re-check path doesn't touch the user-visible schedule
// or baselineScore.
// Bug B2.7 (proactive audit) — mark a watch as stalled so the cron
// skips it on subsequent ticks. Called by the cron when a watch
// hits STALL_THRESHOLD consecutive failures. A successful recheck
// (via recordWatchCheck with failed=false) clears the flag.
export async function markWatchStalled(env, sub, savedItemId) {
  const key = watchKey(sub, savedItemId);
  const raw = await env.AUTH_SESSIONS.get(key);
  if (!raw) return { ok: false, error: 'not-found' };
  let row;
  try { row = JSON.parse(raw); } catch { return { ok: false, error: 'corrupt' }; }
  row.stalled = true;
  await env.AUTH_SESSIONS.put(key, JSON.stringify(row));
  return { ok: true, watch: row };
}

export async function recordWatchCheck(env, sub, savedItemId, score, failed) {
  const key = watchKey(sub, savedItemId);
  const raw = await env.AUTH_SESSIONS.get(key);
  if (!raw) return { ok: false, error: 'not-found' };
  let row;
  try { row = JSON.parse(raw); } catch { return { ok: false, error: 'corrupt' }; }
  row.lastCheckedAt = Date.now();
  row.lastScore = (typeof score === 'number' && isFinite(score)) ? score : null;
  // Bug B2.7 (proactive audit) — track consecutive failures so the
  // cron can stop retrying a doomed watch (upstream permanently 5xx,
  // a deleted page, etc.). Success resets the counter; the cron
  // checks the post-call row.consecutiveFailures against
  // STALL_THRESHOLD to decide whether to emit a one-time stalled
  // notification (gated by row.stalled to avoid spamming).
  if (failed === true) {
    row.consecutiveFailures = (typeof row.consecutiveFailures === 'number' ? row.consecutiveFailures : 0) + 1;
  } else {
    row.consecutiveFailures = 0;
    // A successful recheck un-stalls a previously-stalled watch.
    if (row.stalled) row.stalled = false;
  }
  await env.AUTH_SESSIONS.put(key, JSON.stringify(row));
  return { ok: true, watch: row };
}

// Best-effort score extractor. Each watchable kind stores its
// score under a different field; this is the one place that maps
// kind → field so the rest of the system stays generic. Phase 3's
// re-check functions will write the new score the same way.
function extractScoreFromPayload(kind, payload) {
  if (!payload || typeof payload !== 'object') return null;
  switch (kind) {
    case 'audit': return numericOrNull(payload.score) || numericOrNull(payload.overall);
    case 'seo':   return numericOrNull(payload.titleScore != null && payload.descScore != null
                          ? Math.round((payload.titleScore + payload.descScore) / 2)
                          : null);
    case 'speed': return numericOrNull(payload.score);
    case 'gbp':   return numericOrNull(payload.chosen && payload.chosen.scaledScore);
    case 'mobile':return numericOrNull(payload.passCount != null && payload.failCount != null
                          ? Math.round((payload.passCount / (payload.passCount + payload.failCount + (payload.unknownCount || 0))) * 100)
                          : null);
    case 'schema':return numericOrNull((payload.foundTypes && payload.foundTypes.length) ? 100 : 0);
    default: return null;
  }
}
function numericOrNull(v) {
  return (typeof v === 'number' && isFinite(v)) ? v : null;
}

// ─────────────────────────────────────────────────────────────────
// Phase C (Storefront Health) — Property model.
//
// A Property is a stable, user-owned reference to one URL plus
// pointers to every check that has run against it. Stored alongside
// existing save:/watch: keys in AUTH_SESSIONS:
//
//   property:<sub>:<propertyId>  → JSON {
//     id, url, title,
//     checks: { audit?: savedItemId, seo?: …, gbp?: …, mobile?: …,
//               schema?: …, speed?: … },
//     rollup: { score, grade, generatedAt, byCheck: {…} },
//     createdAt, updatedAt
//   }
//
// Invariants:
// - propertyId minted via mintSaveItemId() — same alphabet/length
//   as save ids for visual consistency in URLs.
// - checks.<kind> is a POINTER to a save:<sub>:<id> row, not a
//   copy. Properties are a thin index over existing saves.
// - rollup is DERIVED, never authoritative. Rebuilt by
//   rollupProperty(env, sub, propertyId) re-reading referenced
//   saves and reusing extractScoreFromPayload(). No new score math.
// - storefront-health is ALSO a save kind (payload = {propertyId})
//   so the Workshop list, ?saved= rehydration, and watch path
//   work without special-casing.
// - Properties count against the existing 100-save cap, with a
//   sub-cap of 10 properties per user.

const PROPERTY_KEY_PREFIX    = 'property:';
const MAX_PROPERTIES_PER_USER = 10;

// Tools that contribute to a property's rollup. Subset of
// WATCHABLE_KINDS — these are the kinds with deterministic
// score extraction.
const PROPERTY_CHECK_KINDS = ['audit', 'seo', 'gbp', 'mobile', 'schema', 'speed'];

export {
  PROPERTY_KEY_PREFIX,
  MAX_PROPERTIES_PER_USER,
  PROPERTY_CHECK_KINDS,
};

export const mintPropertyId = mintSaveItemId;

function propertyKey(sub, id) {
  return PROPERTY_KEY_PREFIX + sub + ':' + id;
}

// Normalize a URL's origin so "https://Foo.com/" and "https://foo.com"
// hash to the same property fingerprint. Lowercases host, strips
// trailing slash on bare-origin URLs, drops fragment + utm query.
function normalizeOrigin(rawUrl) {
  try {
    const u = new URL(rawUrl);
    u.hash = '';
    // Strip tracking params; keep meaningful path/query.
    const params = new URLSearchParams(u.search);
    for (const k of Array.from(params.keys())) {
      if (/^utm_/i.test(k) || k === 'fbclid' || k === 'gclid') params.delete(k);
    }
    u.search = params.toString();
    u.hostname = u.hostname.toLowerCase();
    let s = u.toString();
    if (s.endsWith('/') && u.pathname === '/') s = s.slice(0, -1);
    return s;
  } catch {
    return null;
  }
}

export async function listPropertyIdsForUser(env, sub) {
  const result = await env.AUTH_SESSIONS.list({ prefix: PROPERTY_KEY_PREFIX + sub + ':' });
  return result.keys.map((k) => k.name);
}

export async function listPropertiesForUser(env, sub) {
  const ids = await listPropertyIdsForUser(env, sub);
  const out = [];
  for (const k of ids) {
    const raw = await env.AUTH_SESSIONS.get(k);
    if (!raw) continue;
    try {
      const row = JSON.parse(raw);
      out.push({
        id: row.id,
        url: row.url,
        title: row.title,
        rollup: row.rollup || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    } catch (_) { /* skip corrupt rows */ }
  }
  out.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  return out;
}

export async function getProperty(env, sub, id) {
  if (!isValidSaveItemIdShape(id)) return null;
  const raw = await env.AUTH_SESSIONS.get(propertyKey(sub, id));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// Idempotent on (sub, normalize(url)): returns existing property if
// the user already created one for the same origin. Caller passes
// title (typically the document title or hostname).
export async function createProperty(env, sub, { url, title }) {
  const normalized = normalizeOrigin(url);
  if (!normalized) return { ok: false, error: 'invalid-url' };
  // Check for existing property at same origin (idempotency).
  const existing = await listPropertiesForUser(env, sub);
  const dup = existing.find((p) => normalizeOrigin(p.url) === normalized);
  if (dup) return { ok: true, id: dup.id, existing: true };
  if (existing.length >= MAX_PROPERTIES_PER_USER) {
    return { ok: false, error: 'limit-reached', max: MAX_PROPERTIES_PER_USER };
  }
  let id = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = mintPropertyId();
    const probe = await env.AUTH_SESSIONS.get(propertyKey(sub, candidate));
    if (!probe) { id = candidate; break; }
  }
  if (!id) return { ok: false, error: 'mint-collision' };
  const now = Date.now();
  const row = {
    id,
    url: normalized,
    title: typeof title === 'string' && title.trim() ? title.trim().slice(0, MAX_TITLE_LENGTH) : normalized,
    checks: {},
    rollup: null,
    createdAt: now,
    updatedAt: now,
  };
  await env.AUTH_SESSIONS.put(propertyKey(sub, id), JSON.stringify(row));
  return { ok: true, id, createdAt: now, existing: false };
}

export async function deleteProperty(env, sub, id) {
  if (!isValidSaveItemIdShape(id)) return { ok: false, error: 'invalid-id' };
  const key = propertyKey(sub, id);
  const existing = await env.AUTH_SESSIONS.get(key);
  if (!existing) return { ok: true, deleted: false };
  await env.AUTH_SESSIONS.delete(key);
  return { ok: true, deleted: true };
}

// Attach a check (existing save:<sub>:<savedItemId>) to a property.
// kind must be one of PROPERTY_CHECK_KINDS. Updates the property's
// checks pointer map but does NOT recompute rollup — caller does
// that explicitly via rollupProperty when ready.
export async function attachCheckToProperty(env, sub, propertyId, kind, savedItemId) {
  if (!PROPERTY_CHECK_KINDS.includes(kind)) {
    return { ok: false, error: 'invalid-kind' };
  }
  if (!isValidSaveItemIdShape(savedItemId)) {
    return { ok: false, error: 'invalid-saved-item-id' };
  }
  const prop = await getProperty(env, sub, propertyId);
  if (!prop) return { ok: false, error: 'property-not-found' };
  prop.checks = prop.checks || {};
  prop.checks[kind] = savedItemId;
  prop.updatedAt = Date.now();
  await env.AUTH_SESSIONS.put(propertyKey(sub, propertyId), JSON.stringify(prop));
  return { ok: true };
}

export async function detachCheckFromProperty(env, sub, propertyId, kind) {
  const prop = await getProperty(env, sub, propertyId);
  if (!prop) return { ok: false, error: 'property-not-found' };
  if (prop.checks && prop.checks[kind]) {
    delete prop.checks[kind];
    prop.updatedAt = Date.now();
    await env.AUTH_SESSIONS.put(propertyKey(sub, propertyId), JSON.stringify(prop));
  }
  return { ok: true };
}

// Phase C.4 — iterate every property across all users, for the cron
// rollup pass. Same shape as iterateAllWatches but for property:
// keys. Each yielded item: { sub, property }.
export async function* iterateAllProperties(env) {
  let cursor = null;
  while (true) {
    const opts = { prefix: PROPERTY_KEY_PREFIX };
    if (cursor) opts.cursor = cursor;
    const page = await env.AUTH_SESSIONS.list(opts);
    for (const k of page.keys) {
      const raw = await env.AUTH_SESSIONS.get(k.name);
      if (!raw) continue;
      let property;
      try { property = JSON.parse(raw); } catch (_) { continue; }
      const parts = k.name.split(':');
      if (parts.length < 3) continue;
      const sub = parts.slice(1, -1).join(':');
      yield { sub, property };
    }
    if (page.list_complete) break;
    if (!page.cursor) break;
    cursor = page.cursor;
  }
}

// Recompute the property's rollup by walking referenced saves and
// extracting per-kind scores. Tolerant of orphaned pointers (a
// referenced save that's been deleted) — those kinds drop out of
// rollup.byCheck and the overall score averages over what remains.
export async function rollupProperty(env, sub, propertyId) {
  const prop = await getProperty(env, sub, propertyId);
  if (!prop) return { ok: false, error: 'property-not-found' };
  const byCheck = {};
  let total = 0;
  let count = 0;
  for (const kind of PROPERTY_CHECK_KINDS) {
    const savedId = prop.checks && prop.checks[kind];
    if (!savedId) continue;
    const item = await getItem(env, sub, savedId);
    if (!item) continue; // orphaned pointer; skip
    const score = extractScoreFromPayload(kind, item.payload);
    if (score == null) continue;
    byCheck[kind] = { score, savedItemId: savedId, ts: item.createdAt };
    total += score;
    count += 1;
  }
  const overall = count > 0 ? Math.round(total / count) : null;
  const rollup = {
    score: overall,
    grade: overall == null ? null : (overall >= 90 ? 'A' : overall >= 75 ? 'B' : overall >= 60 ? 'C' : overall >= 40 ? 'D' : 'F'),
    generatedAt: Date.now(),
    byCheck,
  };
  prop.rollup = rollup;
  prop.updatedAt = rollup.generatedAt;
  await env.AUTH_SESSIONS.put(propertyKey(sub, propertyId), JSON.stringify(prop));
  return { ok: true, rollup };
}
