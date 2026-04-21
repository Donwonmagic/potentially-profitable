// ============================================================
// RateLimiter Durable Object (Phase 1 follow-on)
// ============================================================
//
// Global per-IP sliding-window rate limiter. Closes the per-isolate
// gap left by src/lib/rate-limit.js — a burst spread across many
// isolates could previously fly under every local limiter.
//
// A DO instance is keyed by `tier:ip` so one IP gets ONE instance
// that sees its full hit history, regardless of which Worker
// isolate handled the parent request. Eventual-consistency concerns
// from cross-instance DO storage don't apply: every request for a
// given IP lands on the same DO.
//
// Request contract:
//   POST (any path). Body JSON: { windowMs: number, max: number }
//   Response JSON:   { allowed: boolean, retryAfterSeconds?: number }
//
// check-then-increment semantics: the hit is NOT recorded when the
// bucket is already at capacity. This matches the in-isolate limiter
// in rate-limit.js and means a denied request doesn't itself push
// the retry-after window further out — a client that backs off after
// a 429 gets to retry at the earliest legitimate slot.
//
// Storage layout: a single key 'hits' holds a sorted number[] of
// millisecond timestamps within the current window. Pruning happens
// on every request, so the array never grows unbounded even under
// bursty traffic. DO storage writes are atomic inside one fetch()
// call, so there's no read-modify-write race per instance.

const STORAGE_KEY = 'hits';

export class RateLimiter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    let body;
    try {
      body = await request.json();
    } catch (_) {
      body = {};
    }
    const windowMs = (typeof body.windowMs === 'number' && body.windowMs > 0) ? body.windowMs : 60_000;
    const max      = (typeof body.max === 'number'      && body.max > 0)      ? body.max      : 30;

    const now    = Date.now();
    const cutoff = now - windowMs;

    let hits = await this.state.storage.get(STORAGE_KEY);
    if (!Array.isArray(hits)) hits = [];
    while (hits.length && hits[0] < cutoff) hits.shift();

    if (hits.length >= max) {
      const oldest = hits[0];
      const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
      // Persist the pruned list even on deny so stale entries do roll
      // off eventually — without this, a bucket that went silent for
      // an hour would still show the pre-silence entries on the next
      // check. Cheap: one storage write per deny.
      await this.state.storage.put(STORAGE_KEY, hits);
      return Response.json({ allowed: false, retryAfterSeconds: retryAfter });
    }

    hits.push(now);
    await this.state.storage.put(STORAGE_KEY, hits);
    return Response.json({ allowed: true });
  }
}

/**
 * Worker-side adapter. Calls the RateLimiter DO when the binding is
 * provisioned; returns null (allow) when it isn't, so the caller can
 * fall back to the in-isolate limiter. Never throws — a DO outage
 * must not block real users, so any unexpected error fails open with
 * a structured log line for ops visibility.
 *
 * Returns null on allow, { retryAfterSeconds } on deny.
 */
export async function checkDurableRateLimit(env, key, windowMs, max) {
  if (!env || !env.RATE_LIMITER) return null;
  try {
    const id = env.RATE_LIMITER.idFromName(key);
    const stub = env.RATE_LIMITER.get(id);
    const res = await stub.fetch('https://rate-limiter.local/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ windowMs: windowMs, max: max })
    });
    if (!res.ok) {
      console.log(JSON.stringify({ event: 'ratelimit.do_bad_status', key: key, status: res.status }));
      return null;
    }
    const data = await res.json();
    if (data && data.allowed) return null;
    const retry = (data && typeof data.retryAfterSeconds === 'number') ? data.retryAfterSeconds : 1;
    return { retryAfterSeconds: retry };
  } catch (err) {
    console.log(JSON.stringify({ event: 'ratelimit.do_error', key: key, err: String(err && err.message || err) }));
    return null;
  }
}
