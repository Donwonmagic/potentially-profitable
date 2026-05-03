/**
 * Menu Design Suite — service worker.
 *
 * Provides:
 *   1. Offline-first asset caching for the tool shell, scripts,
 *      styles, fonts, and the lazy-loaded jsPDF / JSZip / svg2pdf /
 *      qrcode-generator vendor bundles. After one online visit the
 *      tool runs offline (the page is static + a single JS file; no
 *      backend in the critical path).
 *   2. An installable PWA via manifest.webmanifest — operators can
 *      add to their home screen and open the tool like a native app.
 *
 * Privacy posture:
 *   - The SW NEVER fetches a non-allowlisted host. Allowlist matches
 *     the page's CSP: same-origin + plausible.io + jsdelivr (vendor
 *     PDF libs). This invariant guards against future extensions
 *     accidentally widening the network surface.
 *   - The page's privacy claim ("Network tab stays empty after first
 *     paint") is preserved — the SW only fetches when the page does.
 *   - No telemetry from the SW itself. The page-side Plausible events
 *     stay the only signal channel.
 */
'use strict';

var SW_VERSION = 'md-v2-2026-05-03';
var SHELL_CACHE = 'md-shell-' + SW_VERSION;
var ASSET_CACHE = 'md-asset-' + SW_VERSION;
var VENDOR_CACHE = 'md-vendor-' + SW_VERSION;

// Same-origin shell precaches. Sized for an under-5s install on a
// slow 4G connection. Vendor JS (jsPDF / JSZip / svg2pdf / qrcode-
// generator) are NOT in this list — they're lazy-loaded only when
// the operator hits Export, and the runtime fetch handler caches
// them on first use.
var SHELL_URLS = [
  '/tools/menu-design/',
  '/tools/menu-design/manifest.webmanifest',
  '/tools/menu-design/menu-design.js',
  // Wave studio-quality (code-split) — these three are now lazy-loaded
  // by menu-design.js at first export. Precaching them anyway means
  // the first export is offline-capable too without paying any extra
  // first-paint cost (the page doesn't fetch them at boot).
  '/tools/menu-design/menu-render-pdf.js',
  '/tools/menu-design/menu-render-html.js',
  '/tools/menu-design/menu-render-text.js',
  '/tools/menu-design/themes.js',
  '/tools/menu-design/theme-thumbs.js',
  '/tools/menu-design/data/allergens.js',
  '/tools/menu-design/data/allergen-glyphs.js',
  '/tools/menu-design/data/badges.js',
  '/tools/menu-design/data/templates.js',
  '/tools/menu-design/data/quiz-tiles.js',
  '/tools/menu-design/data/papers.js',
  '/tools/menu-design/infra/dom.js',
  '/tools/menu-design/infra/i18n.js',
  '/tools/menu-design/state/draft.js',
  '/tools/menu-design/state/history.js',
  '/tools/_shared/context-bus.js',
  '/tools/_shared/menu-schema.js',
  '/tools/_shared/menu-renderers/cuisine-decor.js',
  '/tools/_shared/menu-renderers/jsonld.js',
  '/tools/_shared/menu-renderers/studio-brief.js',
  '/tools/_shared/menu-renderers/menu-pack.js',
  '/assets/site.css',
  '/assets/site.js',
  '/assets/p.js',
  '/brand/favicons/android-chrome-192x192.png',
  '/brand/favicons/android-chrome-512x512.png'
];

// Hosts the SW is allowed to fetch from. Identical to the page's
// CSP so the SW's behavior never extends the network surface.
//   plausible.io  — analytics beacon (page-controlled)
//   cdn.jsdelivr.net — jsPDF / JSZip / svg2pdf / qrcode-generator
//                      lazy-loaded by export buttons
var ALLOW_HOSTS = ['plausible.io', 'cdn.jsdelivr.net'];

function isAllowedHost(url) {
  try {
    var u = new URL(url);
    if (u.origin === self.location.origin) return true;
    var host = u.host;
    for (var i = 0; i < ALLOW_HOSTS.length; i++) {
      var h = ALLOW_HOSTS[i];
      if (host === h || host.endsWith('.' + h)) return true;
    }
    return false;
  } catch (_) { return false; }
}

// ---------- Install ----------
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      // Best-effort precache — single 404 should not block install.
      return Promise.all(SHELL_URLS.map(function (u) {
        return cache.add(u).catch(function () { /* tolerate 404 */ });
      }));
    })
  );
});

// ---------- Activate ----------
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        // Drop any cache whose name doesn't carry the current version
        // — the SW upgrade path then re-precaches against new URLs.
        if (k.indexOf(SW_VERSION) === -1 && k.indexOf('md-') === 0) {
          return caches.delete(k);
        }
        return null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// ---------- Fetch ----------
self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);

  // Privacy invariant: never reach for a host outside the allowlist.
  if (!isAllowedHost(request.url)) {
    event.respondWith(new Response('Blocked by SW: non-allowlisted origin', {
      status: 403, statusText: 'Forbidden'
    }));
    return;
  }

  // Non-GET requests skip the cache (saves, API hits) — pass through.
  if (request.method !== 'GET') return;

  // /api/* → network only. Kept for forward-compat with worker-side
  // routes the tool may use later (currently none).
  if (url.pathname.indexOf('/api/') === 0) return;

  // Vendor CDN — jsPDF / JSZip / svg2pdf / qrcode-generator lazy
  // loads. Cache aggressively; URLs are version-pinned upstream.
  if (url.host !== self.location.host) {
    event.respondWith(cacheFirst(VENDOR_CACHE, request));
    return;
  }

  // Tool-scoped + shared assets — cache-first, network fallback.
  if (url.pathname.indexOf('/tools/menu-design/') === 0 ||
      url.pathname.indexOf('/tools/_shared/') === 0 ||
      url.pathname.indexOf('/assets/') === 0 ||
      url.pathname.indexOf('/brand/') === 0) {
    event.respondWith(cacheFirst(ASSET_CACHE, request));
    return;
  }

  // Anything else: network, fall back to cache.
  event.respondWith(networkFirst(ASSET_CACHE, request));
});

// ---------- Cache strategies ----------
function cacheFirst(cacheName, request) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(request, { ignoreSearch: false }).then(function (hit) {
      if (hit) return hit;
      return fetch(request).then(function (resp) { // h8-exempt: SW cache miss; allowlisted by isAllowedHost guard above
        if (resp && resp.status === 200) {
          try { cache.put(request, resp.clone()); } catch (_) {}
        }
        return resp;
      }).catch(function () {
        return new Response('Offline and asset not in cache', { status: 503 });
      });
    });
  });
}

function networkFirst(cacheName, request) {
  return fetch(request).then(function (resp) { // h8-exempt: SW network-first; allowlisted by isAllowedHost guard above
    if (resp && resp.status === 200) {
      try {
        var cloned = resp.clone();
        caches.open(cacheName).then(function (cache) { cache.put(request, cloned); });
      } catch (_) {}
    }
    return resp;
  }).catch(function () {
    return caches.open(cacheName).then(function (cache) {
      return cache.match(request).then(function (hit) {
        return hit || new Response('Offline', { status: 503 });
      });
    });
  });
}

// ---------- Update channel ----------
// Page posts {type: 'SKIP_WAITING'} when operator accepts an update
// prompt; SW takes over and the page reloads.
self.addEventListener('message', function (event) {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'SW_VERSION') {
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ type: 'SW_VERSION', version: SW_VERSION });
    }
  }
});
