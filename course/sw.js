/**
 * Open the Doors — no-op service worker.
 *
 * Scope: /course/ only. This service worker exists purely to satisfy
 * iOS Safari's "Add to Home Screen" installability heuristic — it
 * does NOT cache lessons, does NOT serve content offline, and does
 * NOT intercept any fetches. The site-wide "no fetch" posture is
 * preserved: this worker has no fetch event handler.
 *
 * Registered only from /course/ pages (see the inline registration
 * script in course/index.html). Documented as the site's only
 * service worker in data/security-claims.json.
 *
 * If you're reading this trying to understand offline support: the
 * course is fully usable from localStorage cache once visited, but
 * we deliberately do not pre-cache or claim offline support. A
 * restaurant operator on a flaky cellular connection still gets a
 * normal browser request — same as every other tool in the suite.
 */

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

// Intentionally no 'fetch' event listener. Every request from a
// course page reaches the network normally. This service worker is
// effectively transparent.
