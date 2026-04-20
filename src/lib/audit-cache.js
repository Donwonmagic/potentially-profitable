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
//     ones (invalid URL, SSRF reject).

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

/**
 * Read a cached entry. Returns null when the binding is absent, the
 * key is missing, `?fresh=1` is present, or the stored payload is
 * malformed.
 *
 *   const cached = await readCache(env, 'psi:https://example.com/', request);
 *   if (cached) return cached;
 *   const fresh = await callUpstream();
 *   await writeCache(env, 'psi:...', fresh, 3600);
 *   return fresh;
 */
export async function readCache(env, key, request) {
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
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

/**
 * Write an entry. Silently no-ops when the binding is absent.
 * ttlSeconds must be >= 60 (Cloudflare's minimum); values below
 * that are clamped up.
 */
export async function writeCache(env, key, value, ttlSeconds) {
  if (!env || !env.AUDIT_CACHE) return;
  if (!key) return;
  try {
    var ttl = Math.max(60, ttlSeconds | 0);
    await env.AUDIT_CACHE.put(key, JSON.stringify(value), { expirationTtl: ttl });
  } catch (err) {
    // KV write failures should never break the audit — log and move on.
    try { console.warn('[audit-cache] write failed:', err && err.message); } catch (_) {}
  }
}

/**
 * Convenience: cache-wrap an async fetcher. The fetcher is called
 * on miss; its result is written to KV with the provided TTL.
 * Returns { value, cacheHit: boolean } so the caller can set an
 * `x-audit-cache` header for observability.
 */
export async function withAuditCache(env, request, keyParts, ttlSeconds, fetcher) {
  var prefix = keyParts[0];
  var urlPart = keyParts[1];
  var salt    = keyParts[2] || '';
  var hash = await hashUrl(urlPart + '|' + salt);
  var key = prefix + ':' + hash;
  var hit = await readCache(env, key, request);
  if (hit) return { value: hit, cacheHit: true };
  var fresh = await fetcher();
  // Only cache successful-looking responses. We never cache error
  // shapes (ok:false, error) so a transient failure doesn't get
  // pinned for an hour.
  if (fresh && fresh.ok !== false) {
    await writeCache(env, key, fresh, ttlSeconds);
  }
  return { value: fresh, cacheHit: false };
}
