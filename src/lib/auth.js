// Magic-link authentication primitives for the Workshop.
//
// Sprint 0 ships these wired but NOT exposed publicly: there is no
// public /sign-in/ page, no nav link, no modal. The /workbench/
// route 404s for anonymous visitors. This module exists so Phase 2
// can flip on the public surface without touching auth internals.
//
// Design choices documented at /root/.claude/plans/okay-please-get-current-cheeky-puffin.md
//
// 1. Tokens use the same alphabet + entropy primitive as the
//    snapshot tokens (lib/audit-snapshots.js): 30-symbol alphabet
//    excluding look-alikes (0/O, 1/I/l). Magic-link tokens are 10
//    chars (~49 bits). Session jti is 24 chars (~115 bits) because
//    sessions are bearer-equivalent and live 30 days.
//
// 2. Sessions are SIGNED-COOKIE ONLY. No per-request KV lookup. The
//    cookie carries { sub, email, iat, exp, jti } base64url-encoded
//    with an HMAC-SHA256 signature appended. Pros: zero KV reads on
//    the hot path, simpler ops, smaller blast radius if KV degrades.
//    Cons: cannot revoke a stolen session before 30-day expiry.
//    Mitigation reserved for Phase 2: a revoked:<jti> deny-list keyed
//    in AUTH_SESSIONS. The cookie format already carries `jti` so
//    that change is purely additive.
//
// 3. Cookie attributes: HttpOnly, Secure, SameSite=Lax, Path=/, no
//    Domain. Host-only prevents subdomain leakage. SameSite=Lax
//    matches the magic-link redirect flow (top-level GET arrives
//    after a click in a mail client).
//
// 4. HMAC uses SubtleCrypto only — no Node deps, no package.json.
//    AUTH_COOKIE_SECRET must be set via `wrangler secret put` before
//    first deploy. Rotation: verifySession accepts an array of keys
//    (primary + legacy) so a rotation is additive.

const SESSION_COOKIE_NAME = 'md_session';

// 30-day session lifetime. Long enough that a casual operator who
// signs in once a month doesn't have to repeat the magic-link dance,
// short enough that a leaked cookie eventually expires on its own.
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

// Magic-link tokens live 15 minutes in KV. Long enough for an
// operator to read the email, switch tabs, and click. Short enough
// that an intercepted email (e.g., shared inbox) can't be replayed
// hours later.
const MAGIC_LINK_TTL_SECONDS = 15 * 60;

// Alphabet matches lib/audit-snapshots.js so operators see the same
// shape of token across the system (audit share URLs vs. magic links).
const TOKEN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const MAGIC_LINK_TOKEN_LENGTH = 10;
const SESSION_JTI_LENGTH      = 24;

export {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  MAGIC_LINK_TTL_SECONDS,
  TOKEN_ALPHABET,
  MAGIC_LINK_TOKEN_LENGTH,
  SESSION_JTI_LENGTH,
};

// ─────────────────────────────────────────────────────────────────
// Token minting

function mintToken(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  }
  return out;
}

export function mintMagicLinkToken() {
  return mintToken(MAGIC_LINK_TOKEN_LENGTH);
}

export function mintSessionToken() {
  return mintToken(SESSION_JTI_LENGTH);
}

export function isValidMagicLinkTokenShape(token) {
  if (typeof token !== 'string') return false;
  if (token.length !== MAGIC_LINK_TOKEN_LENGTH) return false;
  for (let i = 0; i < token.length; i++) {
    if (TOKEN_ALPHABET.indexOf(token[i]) === -1) return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────
// Encoding helpers — base64url for cookie payloads.

function bytesToBase64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  // btoa is available in Cloudflare Workers + Node 18+.
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(s) {
  if (typeof s !== 'string') return null;
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function utf8Encode(str) {
  return new TextEncoder().encode(str);
}

function utf8Decode(bytes) {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

// ─────────────────────────────────────────────────────────────────
// SubtleCrypto helpers

async function importHmacKey(secret) {
  // The secret is a 32-byte hex string (per the openssl rand -hex 32
  // recipe in wrangler.jsonc). Decode to raw bytes for SubtleCrypto.
  // Tolerate operators who paste the raw string by treating any
  // non-hex secret as utf-8 bytes — slightly lower entropy but never
  // throws. The verifyer is constant-time either way.
  let keyBytes;
  if (typeof secret !== 'string' || secret.length === 0) {
    throw new Error('AUTH_COOKIE_SECRET is not configured');
  }
  if (/^[0-9a-fA-F]+$/.test(secret) && secret.length % 2 === 0) {
    keyBytes = new Uint8Array(secret.length / 2);
    for (let i = 0; i < keyBytes.length; i++) {
      keyBytes[i] = parseInt(secret.slice(i * 2, i * 2 + 2), 16);
    }
  } else {
    keyBytes = utf8Encode(secret);
  }
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function sha256Hex(input) {
  const bytes = typeof input === 'string' ? utf8Encode(input) : input;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const view = new Uint8Array(digest);
  let out = '';
  for (let i = 0; i < view.length; i++) {
    out += view[i].toString(16).padStart(2, '0');
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────
// Session sign / verify
//
// Format: <base64url(json)>.<base64url(hmac)>
// JSON shape: { sub, email, iat, exp, jti }
//   sub  — sha256(email), the stable user id used for KV `user:` rows
//   email — display copy ("Hello, {email}") and convenience for
//           per-request work; we never trust this for authorization,
//           only for UX rendering. The signature is over both.
//   iat  — issued-at (seconds since epoch)
//   exp  — expiry (seconds since epoch). verifySession refuses if past.
//   jti  — opaque session id reserved for a future revocation list.
//
// Constant-time verification is provided by crypto.subtle.verify; we
// do NOT compare strings ourselves.

export async function signSession(payload, secret) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('signSession: payload required');
  }
  const key = await importHmacKey(secret);
  const headerJson = JSON.stringify(payload);
  const headerB64  = bytesToBase64Url(utf8Encode(headerJson));
  const sigBytes   = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, utf8Encode(headerB64))
  );
  const sigB64     = bytesToBase64Url(sigBytes);
  return headerB64 + '.' + sigB64;
}

// `secrets` may be a string (single key) or an array (rotation
// window: try primary first, then any legacy keys). Returns
// { ok: true, payload } on success or { ok: false, reason } on
// any failure mode. Never throws on bad input.
export async function verifySession(cookieValue, secrets) {
  if (typeof cookieValue !== 'string' || !cookieValue.includes('.')) {
    return { ok: false, reason: 'malformed' };
  }
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed' };
  const [headerB64, sigB64] = parts;
  const sigBytes = base64UrlToBytes(sigB64);
  if (!sigBytes) return { ok: false, reason: 'malformed' };
  const headerBytes = base64UrlToBytes(headerB64);
  if (!headerBytes) return { ok: false, reason: 'malformed' };
  const data = utf8Encode(headerB64);

  const keyList = Array.isArray(secrets) ? secrets : [secrets];
  let verified = false;
  for (const secret of keyList) {
    if (!secret) continue;
    try {
      const key = await importHmacKey(secret);
      const ok = await crypto.subtle.verify('HMAC', key, sigBytes, data);
      if (ok) { verified = true; break; }
    } catch {
      // Fall through to the next key in the rotation window.
    }
  }
  if (!verified) return { ok: false, reason: 'bad_signature' };

  let payload;
  try {
    payload = JSON.parse(utf8Decode(headerBytes));
  } catch {
    return { ok: false, reason: 'bad_payload' };
  }
  if (!payload || typeof payload !== 'object') {
    return { ok: false, reason: 'bad_payload' };
  }
  if (typeof payload.email !== 'string' || !payload.email) {
    return { ok: false, reason: 'bad_payload' };
  }
  if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
    return { ok: false, reason: 'bad_payload' };
  }
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, payload };
}

// ─────────────────────────────────────────────────────────────────
// Cookie helpers

export function setSessionCookie(headers, value) {
  // Secure + HttpOnly + SameSite=Lax + Path=/ + host-only (no Domain).
  // Max-Age in seconds matches SESSION_TTL_SECONDS so the browser
  // expires the cookie at the same time the JWT-style payload does.
  const cookie =
    SESSION_COOKIE_NAME + '=' + value +
    '; HttpOnly; Secure; SameSite=Lax; Path=/' +
    '; Max-Age=' + SESSION_TTL_SECONDS;
  headers.append('Set-Cookie', cookie);
}

export function clearSessionCookie(headers) {
  // Max-Age=0 + a placeholder value tells the browser to drop the
  // cookie immediately. SameSite/Secure/Path must match the original
  // Set-Cookie or browsers ignore the deletion request.
  const cookie =
    SESSION_COOKIE_NAME + '=' +
    '; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
  headers.append('Set-Cookie', cookie);
}

function parseCookieHeader(raw) {
  // Minimal RFC-6265-style parser. We only need one value, so no need
  // to handle the full grammar. Returns the first matching value or null.
  if (typeof raw !== 'string' || !raw) return null;
  const parts = raw.split(';');
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (name !== SESSION_COOKIE_NAME) continue;
    return part.slice(eq + 1).trim();
  }
  return null;
}

// Returns { ok: true, email, payload } or null. The handler decides
// the failure response (401 for /api/auth/me, 404 for /workbench/).
// Reads AUTH_COOKIE_SECRET from env; when the secret is missing, we
// treat every request as anonymous rather than 500'ing the page —
// fail-closed behavior for the gate, fail-soft for the visitor.
export async function getSessionFromRequest(request, env) {
  if (!env || !env.AUTH_COOKIE_SECRET) return null;
  const raw = request.headers.get('cookie');
  if (!raw) return null;
  const value = parseCookieHeader(raw);
  if (!value) return null;
  const result = await verifySession(value, env.AUTH_COOKIE_SECRET);
  if (!result.ok) return null;
  return { ok: true, email: result.payload.email, payload: result.payload };
}
