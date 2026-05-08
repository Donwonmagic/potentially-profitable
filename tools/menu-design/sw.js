/**
 * Menu Design Suite — kill-switch service worker.
 *
 * The original tool was retired on 2026-05-08. Returning visitors
 * have the old PWA shell installed; this replacement unregisters
 * itself, drops every cache the previous SW owned, and forces any
 * open clients to navigate to the live (now sunset) HTML so they
 * see the draft-export flow.
 *
 * The /_headers rule on this path is `no-cache, must-revalidate`,
 * so the browser fetches this file on next visit, runs `activate`,
 * unregisters, and the next navigation hits the network for real.
 *
 * Stays in place until the directory is deleted entirely.
 */
'use strict';

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (_) { /* best-effort */ }
    try {
      await self.registration.unregister();
    } catch (_) { /* best-effort */ }
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach((c) => { try { c.navigate(c.url); } catch (_) {} });
  })());
});

self.addEventListener('fetch', () => { /* let network handle every request */ });
