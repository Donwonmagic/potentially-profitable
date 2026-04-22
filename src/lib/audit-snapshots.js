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

// KV key prefixes. `snap:` holds the serialized JSON snapshot;
// `og:` holds the per-snapshot PNG bytes (D7a — uploaded from the
// client at snapshot-creation time so social crawlers get a rich
// per-audit preview). Same TTL for both so they expire together.
const KV_KEY_PREFIX    = 'snap:';
const KV_OG_KEY_PREFIX = 'og:';

// 90-day TTL in seconds. Matches the retention disclosure shown
// near the share button.
const SNAPSHOT_TTL_SECONDS = 90 * 24 * 60 * 60;

// Hard cap on the serialized payload. Real audits come in at ~30-80
// KB; 512 KB is the abuse ceiling. KV's own limit is 25 MB.
const MAX_PAYLOAD_BYTES = 512 * 1024;

// D7a: hard cap on the uploaded OG PNG (raw bytes, not base64).
// Real Canvas exports come in at 40-120 KB; 300 KB is the ceiling.
// Anything larger is either a bug in the Canvas helper or an abuse
// attempt — the endpoint refuses and the snapshot is saved without
// a custom OG (social crawlers then fall back to the static
// /brand/og/audit-restaurants.png via the HTMLRewriter in D7b).
const MAX_OG_BYTES = 300 * 1024;

// Every snapshot records its schema version so future payload
// changes can be migrated without invalidating in-flight tokens.
const CURRENT_SCHEMA_VERSION = 1;

export { TOKEN_ALPHABET, TOKEN_LENGTH, MAX_PAYLOAD_BYTES, MAX_OG_BYTES, SNAPSHOT_TTL_SECONDS, CURRENT_SCHEMA_VERSION };

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
  // D7a: optional OG PNG payload. Validated separately so a
  // malformed og field can't take down the whole save. A valid `og`
  // is { pngBase64: "iVBORw0KGgo…" } (no data: prefix, no line
  // breaks) decoding to <= MAX_OG_BYTES of image/png bytes.
  let ogBytes = null;
  if (raw.og) {
    if (typeof raw.og !== 'object' || typeof raw.og.pngBase64 !== 'string') {
      return { ok: false, error: 'og payload must be { pngBase64: string }' };
    }
    try {
      ogBytes = _decodeBase64(raw.og.pngBase64);
    } catch (_) {
      return { ok: false, error: 'og.pngBase64 is not valid base64' };
    }
    if (ogBytes.length > MAX_OG_BYTES) {
      return { ok: false, error: `og.png exceeds ${MAX_OG_BYTES}-byte cap (${ogBytes.length})` };
    }
    // Sniff the PNG magic so we don't store arbitrary bytes under
    // a content-type:image/png label. PNG header: 89 50 4E 47.
    if (ogBytes.length < 8
      || ogBytes[0] !== 0x89 || ogBytes[1] !== 0x50
      || ogBytes[2] !== 0x4E || ogBytes[3] !== 0x47) {
      return { ok: false, error: 'og.pngBase64 does not decode to a PNG file' };
    }
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
    // D7a: flag whether a custom OG PNG was saved alongside this
    // snapshot so the HTMLRewriter in D7b knows which og:image URL
    // to inject. `og:TOKEN` entry in KV either exists or doesn't,
    // but re-checking KV on every snapshot fetch is wasteful when
    // we can remember here.
    hasOg:      !!ogBytes,
    // Allow free-form metadata the UI wants to round-trip but
    // doesn't map to a known envelope field.
    meta:       (raw.meta && typeof raw.meta === 'object') ? raw.meta : {},
  });
  const byteLength = new TextEncoder().encode(serialized).byteLength;
  if (byteLength > MAX_PAYLOAD_BYTES) {
    return { ok: false, error: `payload exceeds ${MAX_PAYLOAD_BYTES}-byte cap (${byteLength})` };
  }
  return { ok: true, serialized, byteLength, ogBytes };
}

// D7a: base64 → Uint8Array. Used only inside the snapshot module;
// atob is available in Workers + Node 16+. Throws on non-base64
// input so the caller can decide how to report.
export function _decodeBase64(s) {
  // atob chokes on whitespace/newlines in some runtimes; strip defensively.
  const clean = String(s).replace(/\s+/g, '');
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
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
    // D7a: write the OG bytes (when supplied) to the companion key.
    // Failure here is non-fatal — the snapshot itself has already
    // landed; a missing OG just falls back to the static brand PNG
    // via the HTMLRewriter (D7b). We log and keep going so a
    // transient KV blip on the second put doesn't burn the share.
    if (check.ogBytes) {
      try {
        await env.AUDIT_SNAPSHOTS.put(
          KV_OG_KEY_PREFIX + token,
          check.ogBytes,
          { expirationTtl: SNAPSHOT_TTL_SECONDS }
        );
      } catch (e) {
        console.warn('[snapshot] og put failed', e && e.message);
      }
    }
    return {
      ok: true,
      token,
      expiresAt: new Date(Date.now() + SNAPSHOT_TTL_SECONDS * 1000).toISOString(),
      byteLength: check.byteLength,
      ogBytesWritten: check.ogBytes ? check.ogBytes.length : 0,
    };
  }
  return { ok: false, error: 'token-collision' };
}

// D7a: read back the OG PNG for a token, as an ArrayBuffer. Used by
// the /api/og-snapshot route (added in D7b) to serve the image to
// social crawlers. Returns { ok: false, error } on miss so the
// caller can fall back to the static brand PNG.
export async function getSnapshotOg(env, token) {
  if (!env || !env.AUDIT_SNAPSHOTS) {
    return { ok: false, error: 'snapshot-storage-unavailable' };
  }
  if (!isValidTokenShape(token)) {
    return { ok: false, error: 'invalid-token' };
  }
  const buf = await env.AUDIT_SNAPSHOTS.get(KV_OG_KEY_PREFIX + token, 'arrayBuffer');
  if (!buf) return { ok: false, error: 'not-found' };
  return { ok: true, bytes: buf };
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
