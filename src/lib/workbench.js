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
  'margin', 'plate', 'photo', 'menu', 'brand',
  'open-hours', 'compare', 'tech-stack', 'search-ideas',
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

export {
  SAVE_KEY_PREFIX,
  ALLOWED_KINDS,
  MAX_SAVES_PER_USER,
  MAX_TITLE_LENGTH,
  MAX_PAYLOAD_BYTES,
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
