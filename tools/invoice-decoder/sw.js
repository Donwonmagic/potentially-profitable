/**
 * Invoice Decoder — service worker (Wave 6.8).
 *
 * Provides:
 *   1. Offline-first asset caching for the tool shell, scripts,
 *      styles, fonts, and the lazy-loaded Tesseract / pdfjs / SheetJS
 *      bootstraps. After the first online visit the entire tool runs
 *      offline (modulo the optional /api/workbench/save POST, which
 *      the user can defer).
 *   2. A Web Share Target handler so iOS / Android Share Sheets can
 *      deliver image/* and application/pdf files straight into the
 *      tool. The shared file is stashed in a Cache and the page is
 *      redirected with ?shared=<token> so the controller can pull
 *      the file out.
 *   3. An update-available message channel so the page can prompt
 *      the operator to refresh when a new build deploys.
 *
 * Privacy posture:
 *   - The SW NEVER fetches any non-allowlisted host. Allowlist is
 *     identical to the page's CSP: same-origin + plausible.io.
 *     (Wave 6.4 self-hosted Tesseract / pdfjs / SheetJS so jsdelivr
 *     dropped out of the allowlist.)
 *   - Shared files are stored in a same-origin Cache and never sent
 *     anywhere. Cleared after one consumption.
 *   - A user toggling "Privacy mode" off in the page does not affect
 *     the SW behavior; the SW already only talks to allowlisted
 *     hosts, and the page-side telemetry kill-switch handles that
 *     concern.
 */
'use strict';

var SW_VERSION = 'id-decoder-v12-2026-05-03';
var SHELL_CACHE = 'id-shell-' + SW_VERSION;
var ASSET_CACHE = 'id-asset-' + SW_VERSION;
var VENDOR_CACHE = 'id-vendor-' + SW_VERSION;
var SHARE_INBOX = 'id-share-inbox';

// Same-origin shell precaches: the bare minimum so the tool boots
// after one online visit. We DO NOT precache Tesseract / pdfjs / SheetJS
// here — they're large (Tesseract + lang data is ~6-10 MB) and we
// want the install step to complete in under 5s. Those vendors get
// cached on first use via the runtime fetch handler.
var SHELL_URLS = [
  '/tools/invoice-decoder/',
  '/tools/invoice-decoder/manifest.webmanifest',
  '/tools/invoice-decoder/preprocess.js',
  '/tools/invoice-decoder/capture-coach.js',
  '/tools/invoice-decoder/ocr.js',
  '/tools/invoice-decoder/parse.js',
  '/tools/invoice-decoder/learnings.js',
  '/tools/invoice-decoder/categorize.js',
  '/tools/invoice-decoder/pack-pricing.js',
  '/tools/invoice-decoder/vendors.js',
  '/tools/invoice-decoder/vendors/template-runtime.js',
  '/tools/invoice-decoder/vendors/_index.json',
  '/tools/invoice-decoder/auto-learn.js',
  '/tools/invoice-decoder/vendor-config.js',
  // Wave 6.4 — self-hosted vendor JS entry points. The integrity
  // manifest at /assets/vendor/_integrity.json (also precached) is
  // consulted at runtime by vendor-config.js to set SRI on each load.
  '/assets/vendor/_integrity.json',
  '/assets/vendor/tesseract.js@5.1.1/tesseract.min.js',
  '/assets/vendor/tesseract.js@5.1.1/worker.min.js',
  '/assets/vendor/pdfjs-dist@4.5.136/pdf.min.mjs',
  '/assets/vendor/pdfjs-dist@4.5.136/pdf.worker.min.mjs',
  '/assets/vendor/xlsx@0.20.3/xlsx.mjs',
  '/tools/invoice-decoder/kdf.js',
  '/tools/invoice-decoder/encrypt.js',
  '/tools/invoice-decoder/recovery.js',
  '/tools/invoice-decoder/pairing.js',
  '/tools/invoice-decoder/passphrase-modal.js',
  '/tools/invoice-decoder/data/bip39-en.txt',
  '/assets/vendor/hash-wasm@4.11.0/argon2.umd.min.js',
  '/tools/invoice-decoder/pdf-extract.js',
  '/tools/invoice-decoder/csv-extract.js',
  '/tools/invoice-decoder/proof-flyout.js',
  '/tools/invoice-decoder/device-key.js',
  '/tools/invoice-decoder/sku-history.js',
  '/tools/invoice-decoder/substitution.js',
  '/tools/invoice-decoder/margin-impact.js',
  '/tools/invoice-decoder/accountant-export.js',
  '/tools/invoice-decoder/telemetry.js',
  '/tools/invoice-decoder/accuracy-stats.js',
  '/tools/invoice-decoder/privacy-self-test.js',
  '/tools/invoice-decoder/onboarding.js',
  '/tools/invoice-decoder/invoice-decoder.js',
  '/tools/_shared/context-bus.js',
  '/tools/_shared/differentiators.js',
  '/tools/_shared/cost-trend.js',
  '/tools/_shared/sparkline.js',
  '/assets/site.css',
  '/assets/site.js',
  '/brand/favicons/android-chrome-192x192.png',
  '/brand/favicons/android-chrome-512x512.png'
];

// Hosts the SW is allowed to fetch from. Identical to the page's CSP
// so the SW's behavior never extends the network surface.
// Wave 6.4 — jsdelivr dropped out of this list because Tesseract /
// pdfjs / SheetJS now load from /assets/vendor/ on our own origin.
var ALLOW_HOSTS = ['plausible.io'];

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
      // Best-effort precache: a single 404 should not block install.
      // Fall back to per-URL adds so the SW survives a renamed asset
      // until the operator hits a fresh page that triggers the
      // runtime cache.
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
        // Drop any cache whose name doesn't carry the current version,
        // except the share inbox which is unversioned by design.
        if (k === SHARE_INBOX) return null;
        if (k.indexOf(SW_VERSION) === -1) return caches.delete(k);
        return null;
      }));
    }).then(function () {
      // Wave E.6 — opportunistic share-inbox prune on activate.
      // Catches stale entries left over from a previous SW version
      // before that version had TTL headers. Best-effort; never
      // blocks claim().
      return pruneShareInbox().catch(function () {});
    }).then(function () { return self.clients.claim(); })
  );
});

// ---------- Fetch ----------
self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);

  // Wave 6.8 — Web Share Target. Browser POSTs the multipart form
  // here when the operator picks our PWA from the native share sheet.
  if (request.method === 'POST' &&
      url.pathname === '/tools/invoice-decoder/share-handler') {
    event.respondWith(handleShareTarget(request));
    return;
  }

  // Privacy invariant: never reach for a host outside the allowlist.
  // Same-origin requests pass; allowlisted CDN passes; everything
  // else gets rejected loudly.
  if (!isAllowedHost(request.url)) {
    event.respondWith(new Response('Blocked by SW: non-allowlisted origin', {
      status: 403, statusText: 'Forbidden'
    }));
    return;
  }

  // Non-GET requests skip the cache (saves, API hits) — pass through.
  if (request.method !== 'GET') return;

  // /api/* → network only. Saves and Workshop reads are explicit
  // user-initiated traffic and must always go to the live origin.
  if (url.pathname.indexOf('/api/') === 0) return;

  // Vendor CDN — Tesseract, pdfjs, SheetJS. Cache aggressively
  // (these are pinned by URL and rarely change).
  if (url.host !== self.location.host) {
    event.respondWith(cacheFirst(VENDOR_CACHE, request));
    return;
  }

  // Tool-scoped assets — cache-first, network fallback.
  if (url.pathname.indexOf('/tools/invoice-decoder/') === 0 ||
      url.pathname.indexOf('/tools/_shared/') === 0 ||
      url.pathname.indexOf('/assets/') === 0 ||
      url.pathname.indexOf('/brand/') === 0) {
    event.respondWith(cacheFirst(ASSET_CACHE, request));
    return;
  }

  // Anything else: network, fall back to cache, fall back to a
  // graceful offline notice.
  event.respondWith(networkFirst(ASSET_CACHE, request));
});

// ---------- Cache strategies ----------
function cacheFirst(cacheName, request) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(request, { ignoreSearch: false }).then(function (hit) {
      if (hit) return hit;
      return fetch(request).then(function (resp) { // h8-exempt: SW cache miss; allowlisted by isAllowedHost guard above
        if (resp && resp.status === 200) {
          // Clone and stash. Errors here don't block the response.
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

// ---------- Web Share Target ----------
// The browser POSTs here with multipart/form-data. We extract the
// shared file (named "invoice" per manifest.share_target.params.files
// [0].name), stash it in a Cache, and 303-redirect the page to the
// tool with ?shared=<token>. The page's controller reads the token
// on load, fetches the blob from the cache, and feeds it into the
// existing photo / PDF handlers.
function handleShareTarget(request) {
  return request.formData().then(function (formData) {
    var files = formData.getAll('invoice');
    if (!files || !files.length) {
      return Response.redirect('/tools/invoice-decoder/', 303);
    }
    var file = files[0];
    if (!file || typeof file.size !== 'number') {
      return Response.redirect('/tools/invoice-decoder/', 303);
    }
    var token = 'share-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
    var stashUrl = '/tools/invoice-decoder/_shared_inbox/' + token;
    var contentType = file.type || 'application/octet-stream';
    var queuedAt = Date.now();
    var expiresAt = queuedAt + (60 * 60 * 1000); // 1h soft TTL
    var hardExpiresAt = queuedAt + (24 * 60 * 60 * 1000); // 24h hard cap
    return caches.open(SHARE_INBOX).then(function (cache) {
      // Wave E.6 — defensive sweep before we add the new entry.
      // Best-effort; if it fails the existing single-consumption
      // delete still keeps the inbox bounded.
      return pruneShareInbox(cache).catch(function () {}).then(function () {
        return cache.put(stashUrl, new Response(file, {
          headers: {
            'Content-Type': contentType,
            'X-Mid-Shared-Name': encodeURIComponent(file.name || 'shared'),
            'X-Mid-Shared-Size': String(file.size),
            // Wave E.6 — share-inbox TTL. Single-consumption deletion
            // already handles the happy path; the TTL hardens the
            // case where a share lands but the operator never opens
            // the tool, or closes the tab before the controller
            // pulls the blob out. Without a TTL, that file would
            // sit in same-origin Cache storage indefinitely.
            'X-Mid-Shared-Expires': String(expiresAt),
            'X-Mid-Shared-Hard-Expires': String(hardExpiresAt)
          }
        }));
      });
    }).then(function () {
      return Response.redirect('/tools/invoice-decoder/?shared=' + encodeURIComponent(token), 303);
    });
  }).catch(function () {
    return Response.redirect('/tools/invoice-decoder/?shared=error', 303);
  });
}

// Wave E.6 — Share-inbox pruning. Walk every cached share entry, drop
// anything whose soft TTL has passed (1h) without consumption, and
// drop anything past the 24h hard cap regardless. The hard cap is the
// belt-and-suspenders defense in the (rare) case the soft TTL is
// somehow extended by a future code path. Returns the count of
// dropped entries so the caller can observe.
function pruneShareInbox(cache) {
  var openP = cache ? Promise.resolve(cache) : caches.open(SHARE_INBOX);
  return openP.then(function (c) {
    return c.keys().then(function (requests) {
      var now = Date.now();
      var dropped = 0;
      return Promise.all(requests.map(function (req) {
        return c.match(req).then(function (resp) {
          if (!resp) return null;
          var soft = parseInt(resp.headers.get('X-Mid-Shared-Expires') || '0', 10);
          var hard = parseInt(resp.headers.get('X-Mid-Shared-Hard-Expires') || '0', 10);
          // If we have a hard cap timestamp and it's passed → drop.
          // Otherwise if we have a soft TTL and it's passed → drop.
          // Entries with NO expiration headers (legacy, pre-Wave E.6)
          // are dropped if they're older than the hard cap from the
          // moment of pruning — we can't tell their age, so we err
          // on the side of clearing them. This is safe: the
          // controller treats a missing share as "operator dismissed."
          var expired = false;
          if (hard && hard < now) expired = true;
          else if (soft && soft < now) expired = true;
          else if (!soft && !hard) {
            // Legacy: if no headers, drop. Re-shares from the
            // operator will get the new headers.
            expired = true;
          }
          if (expired) {
            dropped++;
            return c.delete(req);
          }
          return null;
        });
      })).then(function () { return dropped; });
    });
  });
}

// ---------- Update channel ----------
// Page can post {type: 'SKIP_WAITING'} when the operator accepts
// the update prompt; SW takes over and the page reloads.
self.addEventListener('message', function (event) {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'CLEAR_SHARE_INBOX') {
    caches.delete(SHARE_INBOX);
  }
  if (event.data.type === 'PRUNE_SHARE_INBOX') {
    // Wave E.6 — operator-initiated prune. Triggered from the
    // controller on tool open so a long-idle browser tab cleans up
    // even between SW activations.
    pruneShareInbox().catch(function () {});
  }
  if (event.data.type === 'SW_VERSION') {
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ type: 'SW_VERSION', version: SW_VERSION });
    }
  }
});
