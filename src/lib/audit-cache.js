// ============================================================
// Audit response cache (Sprint T3)
// ============================================================
//
// Shared KV wrapper for caching expensive audit upstreams (PSI,
// Places, schema-check, page-crawl). Key design:
//
//   * The binding is OPTIONAL. Every call no-ops when env.AUDIT_CACHE
//     is absent, returning the fresh upstream response unchanged.
//     Flipping the binding on in wrangler.jsonc + creating the KV
//     namespace in the Cloudflare dashboard activates caching
//     instantly — no code change, no re-deploy required beyond the
//     wrangler config.
//
//   * Cache keys are SHA-256 hashes of the normalized URL so two
//     requests that differ only in protocol (http vs https) or in a
//     trailing slash still collide. Per-endpoint prefixes (`psi:`,
//     `gbp:`, `schema:`, `crawl:`) prevent cross-endpoint collisions.
//
//   * TTLs match each endpoint's practical freshness window:
//       - PSI            1 hour (Lighthouse runs drift within a day)
//       - gbp-lookup     6 hours (Places data changes rarely)
//       - gbp-details    24 hours (reviews page changes rarely)
//       - schema-check   1 hour  (schema is a publish-side concern)
//       - page-crawl     1 hour  (menu / ordering pages rotate often)
//       - crux-history  48 hours (Google publishes weekly, our data
//                                  stays accurate for days)
//       - wayback        7 days  (first-seen year is stable)
//       - observatory   24 hours (grade changes when headers change)
//
//   * A bypass query param (`?fresh=1`) short-circuits the cache so
//     owners can force a re-audit after fixing something.
//
//   * Stale-but-served fallback: when the upstream errors AND we have
//     a stale cached value newer than 2× TTL, serve the stale value
//     with an `x-audit-cache: stale-fallback` header. Owners get a
//     report instead of an error screen. This only kicks in for
//     quota-exceeded / 5xx upstream failures, not for structural
//     ones (invalid URL, SSRF reject). Implementation: every write
//     stores `{ v: value, ts: <ms> }` at `expirationTtl = 2 * ttl`,
//     so entries live in KV past their logical TTL; the wrapper
//     compares age-since-ts to the TTL to decide fresh vs stale.

// SHA-256 hex of a normalized URL. Normalization collapses protocol
// and trailing slash. No business fields leak into the cache key.
async function hashUrl(url) {
  var normalized = String(url || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '')
    .toLowerCase();
  var buf = new TextEncoder().encode(normalized);
  var digest = await crypto.subtle.digest('SHA-256', buf);
  var bytes = new Uint8Array(digest);
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex.slice(0, 32); // 128 bits is plenty; keys stay short
}

// Unwrap a stored entry into { value, ts } regardless of whether it
// was written in the new envelope shape or the legacy raw shape. A
// ts of null means "no age information" — treat as fresh for the
// first cycle after deploy so existing KV entries keep working.
function unwrapCacheEntry(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  if (Object.prototype.hasOwnProperty.call(parsed, 'v') && typeof parsed.ts === 'number') {
    return { value: parsed.v, ts: parsed.ts };
  }
  return { value: parsed, ts: null };
}

/**
 * Read a cached entry. Returns null when the binding is absent, the
 * key is missing, `?fresh=1` is present, or the stored payload is
 * malformed. Returns the stored value (unwrapped from the envelope)
 * for backward compatibility with any external caller.
 */
export async function readCache(env, key, request) {
  var entry = await readCacheEntry(env, key, request);
  return entry ? entry.value : null;
}

/**
 * Internal: read the cache with age metadata attached. Used by
 * withAuditCache to decide fresh vs stale. Exported for tests only;
 * not part of the public cache API.
 */
export async function readCacheEntry(env, key, request) {
  if (!env || !env.AUDIT_CACHE) return null;
  if (!key) return null;
  try {
    if (request) {
      var url = new URL(request.url);
      if (url.searchParams.get('fresh') === '1') return null;
    }
  } catch (_) { /* ignore */ }
  try {
    var raw = await env.AUDIT_CACHE.get(key);
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    return unwrapCacheEntry(parsed);
  } catch (_) {
    return null;
  }
}

/**
 * Write an entry. Silently no-ops when the binding is absent.
 * ttlSeconds is the LOGICAL TTL (freshness window). The KV expiration
 * is set to 2× ttl so the entry survives past its logical TTL and can
 * be used as a stale fallback when the upstream errors.
 */
export async function writeCache(env, key, value, ttlSeconds) {
  if (!env || !env.AUDIT_CACHE) return;
  if (!key) return;
  try {
    var ttl = Math.max(60, ttlSeconds | 0);
    var envelope = { v: value, ts: Date.now() };
    await env.AUDIT_CACHE.put(key, JSON.stringify(envelope), { expirationTtl: 2 * ttl });
  } catch (err) {
    // KV write failures should never break the audit — log and move on.
    try { console.warn('[audit-cache] write failed:', err && err.message); } catch (_) {}
  }
}

/**
 * Convenience: cache-wrap an async fetcher with stale-fallback.
 *
 * Returns { value, cacheHit, staleFallback, ageSeconds } so the caller
 * can set an `x-audit-cache` header for observability.
 *   - cacheHit=true, staleFallback=false   -> fresh hit (within TTL)
 *   - cacheHit=false, staleFallback=false  -> fresh fetch (miss)
 *   - cacheHit=false, staleFallback=true   -> upstream failed, served
 *                                             a cached value older
 *                                             than TTL but within 2× TTL
 *
 * The fetcher is called on miss OR when a stale entry is present but
 * its TTL has elapsed (we always try fresh first; stale is only used
 * if the fetcher returns { ok:false } or throws).
 */
export async function withAuditCache(env, request, keyParts, ttlSeconds, fetcher) {
  var prefix = keyParts[0];
  var urlPart = keyParts[1];
  var salt    = keyParts[2] || '';
  var hash = await hashUrl(urlPart + '|' + salt);
  var key = prefix + ':' + hash;
  var ttl = Math.max(60, ttlSeconds | 0);

  var entry = await readCacheEntry(env, key, request);
  var ageSeconds = (entry && typeof entry.ts === 'number')
    ? Math.max(0, Math.floor((Date.now() - entry.ts) / 1000))
    : null;

  // Fresh hit: timestamped entry within the logical TTL, or a legacy
  // entry with no timestamp (we don't know its age; treat as fresh
  // for one cycle so existing KV entries survive the deploy — they'll
  // be rewritten in the new shape on the next miss).
  if (entry && (ageSeconds === null || ageSeconds <= ttl)) {
    return { value: entry.value, cacheHit: true, staleFallback: false, ageSeconds: ageSeconds };
  }

  // Stale but in range (ts between TTL and 2× TTL) — hold as fallback.
  var staleEntry = (entry && ageSeconds !== null && ageSeconds <= 2 * ttl) ? entry : null;

  var fresh;
  var fetcherError = null;
  try {
    fresh = await fetcher();
  } catch (err) {
    fetcherError = err;
  }

  var looksOk = !fetcherError && fresh && fresh.ok !== false;
  if (looksOk) {
    // Write with the TTL the caller asked for; writeCache stores with
    // 2× TTL so the entry survives past freshness as stale fallback.
    await writeCache(env, key, fresh, ttl);
    return { value: fresh, cacheHit: false, staleFallback: false, ageSeconds: 0 };
  }

  // Upstream failed and we have a usable stale entry — serve it rather
  // than an error screen. Owners get a slightly-old report with a
  // disclosure header instead of a generic 502.
  if (staleEntry) {
    return {
      value: staleEntry.value,
      cacheHit: false,
      staleFallback: true,
      ageSeconds: ageSeconds
    };
  }

  // No stale fallback. Preserve the existing contract: if the fetcher
  // threw, let that error propagate so the handler's try/catch can
  // jsonResponse 502. If it returned an { ok:false } shape, pass it
  // through so the caller can surface the upstream error message.
  if (fetcherError) throw fetcherError;
  return { value: fresh, cacheHit: false, staleFallback: false, ageSeconds: null };
}
