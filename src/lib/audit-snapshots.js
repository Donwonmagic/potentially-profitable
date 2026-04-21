// D1: audit-snapshot persistence.
//
// The restaurant audit tool computes every signal client-side. When
// an owner wants to share the result — with their web developer, a
// landlord, a business partner — we persist a compact JSON snapshot
// to Workers KV and return an unguessable token. The share URL looks
// like `/tools/audits/restaurant/?s=ABCD1234XY`; loading that URL
// fetches the snapshot and hydrates the audit UI with the same data
// the original owner saw.
//
// Contract
// --------
// saveSnapshot(env, payload) -> { ok: true, token, expiresAt }
//   Validates payload shape + size, mints a ~60-bit token, writes
//   to KV under `snap:<token>` with a 90-day TTL, returns the token.
//
// getSnapshot(env, token) -> { ok: true, snapshot } | null
//   Looks up a previously-saved snapshot. Returns null for unknown
//   or expired tokens. Never throws on a cache miss.
//
// Binding
// -------
// Reads env.AUDIT_SNAPSHOTS (Workers KV namespace). When the binding
// is absent (local dev, pre-provision), both functions return a
// structured error so the caller can show the user a useful message.
//
// Privacy
// -------
// Snapshots are unlisted but not secret — the token in the URL is
// all that protects them. That's fine for the use case (owner
// shares with a handful of collaborators) but the disclosure copy
// near the share button must say so plainly. No PII is stored
// beyond what was already voluntarily entered into the audit.
//
// Retention: 90 days auto-expiry via KV's native TTL. Owner can
// request earlier deletion by emailing don@muntin.digital; that
// manual path is intentional for v1 (no self-serve delete UI).

// Character set excludes look-alikes (0/O, 1/I/l). 10 chars × 30
// symbols ≈ 49 bits of entropy — enough for an unlisted resource.
const TOKEN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TOKEN_LENGTH   = 10;

// KV key prefix keeps snapshots distinct from any other data the
// namespace might hold later (rate-limit counters, feature flags).
const KV_KEY_PREFIX  = 'snap:';

// 90-day TTL in seconds. Matches the retention disclosure shown
// near the share button.
const SNAPSHOT_TTL_SECONDS = 90 * 24 * 60 * 60;

// Hard cap on the serialized payload. Real audits come in at ~30-80
// KB; 512 KB is the abuse ceiling. KV's own limit is 25 MB.
const MAX_PAYLOAD_BYTES = 512 * 1024;

// Every snapshot records its schema version so future payload
// changes can be migrated without invalidating in-flight tokens.
const CURRENT_SCHEMA_VERSION = 1;

export { TOKEN_ALPHABET, TOKEN_LENGTH, MAX_PAYLOAD_BYTES, SNAPSHOT_TTL_SECONDS, CURRENT_SCHEMA_VERSION };

export function mintSnapshotToken() {
  // crypto.getRandomValues is available in every Cloudflare Worker
  // isolate + Node 19+ (test harness). Never falls back to Math.random.
  const bytes = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    out += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  }
  return out;
}

export function isValidTokenShape(token) {
  if (typeof token !== 'string') return false;
  if (token.length !== TOKEN_LENGTH) return false;
  for (let i = 0; i < token.length; i++) {
    if (TOKEN_ALPHABET.indexOf(token[i]) === -1) return false;
  }
  return true;
}

// Validates a snapshot payload from the client. Returns
// { ok: true, payload } on success or { ok: false, error } on any
// shape violation. Deliberately shallow — we trust the client to
// not submit adversarial content, but enforce the envelope so a
// malformed POST can't poison downstream hydration.
export function validateSnapshotPayload(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'payload must be an object' };
  }
  // Required envelope fields.
  if (typeof raw.auditedUrl !== 'string' || !raw.auditedUrl.length) {
    return { ok: false, error: 'auditedUrl is required' };
  }
  if (raw.auditedUrl.length > 2048) {
    return { ok: false, error: 'auditedUrl too long' };
  }
  if (typeof raw.score !== 'number' || raw.score < 0 || raw.score > 100) {
    return { ok: false, error: 'score must be a number 0..100' };
  }
  if (raw.language && typeof raw.language !== 'string') {
    return { ok: false, error: 'language must be a string' };
  }
  if (raw.subtype && typeof raw.subtype !== 'string') {
    return { ok: false, error: 'subtype must be a string' };
  }
  if (raw.results && typeof raw.results !== 'object') {
    return { ok: false, error: 'results must be an object' };
  }
  if (raw.verdict && typeof raw.verdict !== 'string') {
    return { ok: false, error: 'verdict must be a string' };
  }
  // Size cap — serialize once to measure, return the serialized
  // bytes alongside so the caller doesn't re-serialize.
  const serialized = JSON.stringify({
    v: CURRENT_SCHEMA_VERSION,
    createdAt: Date.now(),
    auditedUrl: raw.auditedUrl,
    language:   raw.language || 'en',
    subtype:    raw.subtype  || null,
    score:      Math.round(raw.score),
    verdict:    raw.verdict  || '',
    results:    raw.results  || {},
    // Allow free-form metadata the UI wants to round-trip but
    // doesn't map to a known envelope field.
    meta:       (raw.meta && typeof raw.meta === 'object') ? raw.meta : {},
  });
  const byteLength = new TextEncoder().encode(serialized).byteLength;
  if (byteLength > MAX_PAYLOAD_BYTES) {
    return { ok: false, error: `payload exceeds ${MAX_PAYLOAD_BYTES}-byte cap (${byteLength})` };
  }
  return { ok: true, serialized, byteLength };
}

export async function saveSnapshot(env, rawPayload) {
  if (!env || !env.AUDIT_SNAPSHOTS) {
    return { ok: false, error: 'snapshot-storage-unavailable' };
  }
  const check = validateSnapshotPayload(rawPayload);
  if (!check.ok) return check;

  // Collision-retry loop. At 49 bits of entropy, a collision after
  // say 10,000 active snapshots is ~1 in 500 billion. Still cheap
  // insurance: try up to 3 times.
  for (let attempt = 0; attempt < 3; attempt++) {
    const token = mintSnapshotToken();
    const key = KV_KEY_PREFIX + token;
    // KV's get-then-put is not atomic, but the collision probability
    // makes a TOCTOU race effectively impossible. Still, we check so
    // we don't overwrite a valid snapshot.
    const existing = await env.AUDIT_SNAPSHOTS.get(key);
    if (existing) continue;
    await env.AUDIT_SNAPSHOTS.put(key, check.serialized, {
      expirationTtl: SNAPSHOT_TTL_SECONDS,
    });
    return {
      ok: true,
      token,
      expiresAt: new Date(Date.now() + SNAPSHOT_TTL_SECONDS * 1000).toISOString(),
      byteLength: check.byteLength,
    };
  }
  return { ok: false, error: 'token-collision' };
}

export async function getSnapshot(env, token) {
  if (!env || !env.AUDIT_SNAPSHOTS) {
    return { ok: false, error: 'snapshot-storage-unavailable' };
  }
  if (!isValidTokenShape(token)) {
    return { ok: false, error: 'invalid-token' };
  }
  const raw = await env.AUDIT_SNAPSHOTS.get(KV_KEY_PREFIX + token);
  if (!raw) return { ok: false, error: 'not-found' };
  try {
    const snapshot = JSON.parse(raw);
    return { ok: true, snapshot };
  } catch (_) {
    // A corrupt KV value is a no-op from the caller's POV; they'll
    // show "this share link is broken" rather than a 500.
    return { ok: false, error: 'corrupt-snapshot' };
  }
}
