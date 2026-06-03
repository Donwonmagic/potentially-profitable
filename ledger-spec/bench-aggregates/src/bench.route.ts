/**
 * bench.route.ts — GET /v1/bench/aggregates. The freshness/staleness signal;
 * primary delivery is the build-time vendored JSON in the storefront. Unauth,
 * buyer-side, edge rate-limited, honeypot cell, hashed-IP logs.
 *
 * Register: app.route('/v1/bench', bench).
 *
 * Serves the pre-aggregated R2 artifact verbatim (finite blob, no queryable
 * surface to scrape) with a cache-control that signals "weekly aggregate," not
 * a live feed. Counsel-gated: keep this route dark until antitrust sign-off.
 */

import { Hono } from 'hono';

type Env = {
  Variables: {
    getArtifact: (key: string) => Promise<string | null>;  // R2 read
    rateLimit: (key: string) => Promise<boolean>;          // edge RateLimiter DO; true = allowed
    clientHash: () => string;                              // hashed IP for forensic logs
  };
};

export const bench = new Hono<Env>();

bench.get('/aggregates', async (c) => {
  // Edge rate-limit (buyer-side scraping defense). The data is a finite
  // pre-aggregated blob, but rate-limit anyway + keep a forensic hashed-IP log.
  const allowed = await c.get('rateLimit')(c.get('clientHash')());
  if (!allowed) return c.json({ error: 'rate_limited' }, 429);

  const body = await c.get('getArtifact')('bench/aggregate/latest.json');
  if (!body) return c.json({ error: 'unavailable' }, 503);

  // Weekly aggregate → cache it as such. NEVER advertise a fetch-age as
  // data-age; the artifact carries its own generatedAt.
  c.header('cache-control', 'public, max-age=3600, stale-while-revalidate=86400');
  c.header('content-type', 'application/json');
  return c.body(body);
});
