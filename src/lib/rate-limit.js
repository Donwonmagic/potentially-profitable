// ============================================================
// Per-IP sliding-window rate limiter (Phase 1 item 4a)
// ============================================================
//
// In-isolate sliding window. Catches the common abuse pattern of a
// single IP hammering /api/psi or /api/brand-dossier across many URLs
// to burn our PSI / Places / Resend / LLM quota. Paired with the
// existing per-URL audit-cache (which already collapses repeat hits
// on the SAME URL from any IP), this gives us two independent
// throttles:
//
//     audit-cache     : one request per URL per TTL (any IP)
//     rate-limit.js   : N requests per IP per window  (any URL)
//
// Scope is intentionally per-isolate. Cloudflare Workers run many
// isolates in parallel; a determined distributed attacker can still
// fan out across isolates. Closing that gap needs either the Workers
// Rate Limiting API binding or a Durable Object — both are planned
// (see wrangler.jsonc comments) but neither is provisioned today.
// The in-isolate limiter is cheap (a Map<ip, number[]>), has no
// external dependencies, and costs nothing on the happy path. It is
// also a genuine mitigation: the common burst attack is from one IP,
// and Cloudflare's load balancer is sticky enough that most of that
// burst hits the same handful of isolates.
//
// The limiter is permissive on purpose — real owners who re-audit
// after every fix should not run into it. Defaults:
//
//   window = 60 s
//   max    = 30 requests / IP / window   (= 1 every 2 s)
//
// Returns null on allow, { retryAfterSeconds } on deny.

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX       = 30;

// One buckets-per-ip map per limiter. Exported factory so tests can
// hold their own isolated instance rather than sharing global state
// with the live worker.
export function createRateLimiter(options) {
  const cfg = options || {};
  const windowMs = typeof cfg.windowMs === 'number' && cfg.windowMs > 0 ? cfg.windowMs : DEFAULT_WINDOW_MS;
  const max      = typeof cfg.max === 'number'      && cfg.max > 0      ? cfg.max      : DEFAULT_MAX;
  const now      = typeof cfg.now === 'function' ? cfg.now : () => Date.now();
  const buckets  = new Map();

  // Opportunistic housekeeping: every K calls, drop buckets whose
  // entries are all older than the window so a large IP fleet can't
  // accumulate dead entries forever. We never do this synchronously
  // on every call — the hot path only touches one bucket.
  let calls = 0;
  const SWEEP_EVERY = 500;
  function sweep(nowTs) {
    const cutoff = nowTs - windowMs;
    for (const [ip, hits] of buckets.entries()) {
      while (hits.length && hits[0] < cutoff) hits.shift();
      if (hits.length === 0) buckets.delete(ip);
    }
  }

  return {
    /**
     * Check whether an IP is within the allowed rate. Returns null
     * when the request is allowed (and records it); otherwise returns
     * { retryAfterSeconds } where the IP must wait before the next
     * slot opens.
     */
    check(ip) {
      const id = String(ip || 'unknown');
      const nowTs = now();
      const cutoff = nowTs - windowMs;

      let hits = buckets.get(id);
      if (!hits) {
        hits = [];
        buckets.set(id, hits);
      }
      while (hits.length && hits[0] < cutoff) hits.shift();

      if (hits.length >= max) {
        const oldest = hits[0];
        const waitMs = Math.max(0, oldest + windowMs - nowTs);
        return { retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)) };
      }

      hits.push(nowTs);
      calls++;
      if (calls % SWEEP_EVERY === 0) sweep(nowTs);
      return null;
    },

    // Test hook: inspect current bucket state without mutating it.
    _snapshot() {
      const out = {};
      for (const [ip, hits] of buckets.entries()) out[ip] = hits.slice();
      return out;
    }
  };
}

/**
 * Extract the client IP from the incoming request. Cloudflare stamps
 * cf-connecting-ip on every request; we only fall back to other
 * headers for local development and test harnesses.
 */
export function clientIpFromRequest(request) {
  if (!request || !request.headers) return 'unknown';
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf;
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return 'unknown';
}
