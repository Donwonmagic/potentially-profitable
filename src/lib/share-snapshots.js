// Phase G.11 (Growth) — generalized share-snapshot store.
//
// Sister library to audit-snapshots.js. Where audit-snapshots is
// audit-tool-specific, this module accepts ANY shareable kind from
// a closed enum, tagging KV keys with the kind so we can rebuild
// kind-specific lookups + rate limits in one place.
//
// Contract
// --------
// saveShareSnapshot(env, kind, payload) -> { ok, token, url, expiresAt }
//   Validates kind ∈ SHARE_KINDS + payload shape/size, mints a token,
//   writes to KV under `share:<kind>:<token>` with 90-day TTL.
//
// getShareSnapshot(env, kind, token) -> { ok, snapshot } | null
//
// Closed-enum kinds — adding a new shareable surface requires:
//   1. Add the kind here.
//   2. Wire a new endpoint in src/worker.js (mirrors handleShare* shape).
//   3. Wire the receiving page (so loading ?s=<token> rehydrates).
//
// scripts/check-share-snapshot-kinds.mjs ensures every endpoint that
// references a kind here has a registered worker handler.

export const SHARE_KINDS = Object.freeze({
  TOOL_RESULT: 'tool-result',
  STOREFRONT_HEALTH: 'storefront-health',
});

const KIND_VALUES = new Set(Object.values(SHARE_KINDS));

const TOKEN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TOKEN_LENGTH   = 10;
const TTL_SECONDS    = 90 * 24 * 60 * 60;
const MAX_PAYLOAD    = 512 * 1024;

const KV_BINDING_NAME = 'AUTH_SESSIONS';

export function isValidShareKind(kind) {
  return typeof kind === 'string' && KIND_VALUES.has(kind);
}

export function isValidShareTokenShape(token) {
  if (typeof token !== 'string' || token.length !== TOKEN_LENGTH) return false;
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    if (TOKEN_ALPHABET.indexOf(token[i]) === -1) return false;
  }
  return true;
}

function mintShareToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_LENGTH));
  let out = '';
  for (let i = 0; i < TOKEN_LENGTH; i++) out += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  return out;
}

function shareKey(kind, token) {
  return `share:${kind}:${token}`;
}

export async function saveShareSnapshot(env, kind, payload) {
  if (!env || !env[KV_BINDING_NAME]) return { ok: false, error: 'kv-unbound' };
  if (!isValidShareKind(kind))       return { ok: false, error: 'invalid-kind' };
  if (payload == null || typeof payload !== 'object') return { ok: false, error: 'invalid-payload' };
  let serialized;
  try { serialized = JSON.stringify(payload); } catch (_) { return { ok: false, error: 'invalid-payload' }; }
  if (serialized.length > MAX_PAYLOAD) return { ok: false, error: 'payload-too-large' };

  let token;
  for (let i = 0; i < 5; i++) {
    const candidate = mintShareToken();
    const collision = await env[KV_BINDING_NAME].get(shareKey(kind, candidate));
    if (!collision) { token = candidate; break; }
  }
  if (!token) return { ok: false, error: 'token-mint-failed' };

  await env[KV_BINDING_NAME].put(shareKey(kind, token), serialized, { expirationTtl: TTL_SECONDS });
  const expiresAt = Date.now() + TTL_SECONDS * 1000;
  return { ok: true, token, kind, expiresAt };
}

export async function getShareSnapshot(env, kind, token) {
  if (!env || !env[KV_BINDING_NAME]) return null;
  if (!isValidShareKind(kind) || !isValidShareTokenShape(token)) return null;
  const raw = await env[KV_BINDING_NAME].get(shareKey(kind, token));
  if (!raw) return null;
  try {
    return { ok: true, snapshot: JSON.parse(raw) };
  } catch (_) {
    return null;
  }
}
