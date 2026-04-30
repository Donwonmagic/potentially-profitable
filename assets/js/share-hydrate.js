/**
 * Phase G.11 (Growth) — share-snapshot client-side hydration.
 *
 * On any tool page loaded with ?s=<token>, fetch the snapshot from
 * /api/share/get and dispatch CustomEvent 'muntin:share-snapshot'
 * with detail = { kind, snapshot }. Each tool listens for the
 * event and rehydrates its own UI (form fields + scorecard).
 *
 * Kind is detected from path: /tools/storefront-health/ →
 * 'storefront-health'; everything else → 'tool-result'.
 *
 * Fires Share { target: 'recipient-render' } once per session
 * after a successful hydration.
 */

(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  var sp;
  try { sp = new URLSearchParams(location.search); } catch (_) { return; }
  var token = sp.get('s');
  if (!token || !/^[A-Z0-9]{10}$/.test(token)) return;
  var kind = location.pathname.match(/\/tools\/storefront-health\/?/) ? 'storefront-health' : 'tool-result';

  fetch('/api/share/get?kind=' + encodeURIComponent(kind) + '&t=' + encodeURIComponent(token), {
    credentials: 'omit',
    cache: 'force-cache',
  }).then(function (r) {
    if (!r.ok) throw new Error('fetch-failed');
    return r.json();
  }).then(function (j) {
    if (!j || !j.ok || !j.snapshot) return;
    try {
      document.dispatchEvent(new CustomEvent('muntin:share-snapshot', { detail: { kind: j.kind, snapshot: j.snapshot } }));
    } catch (_) {}
    if (typeof window.plausible === 'function') {
      try { window.plausible('Share', { props: { target: 'recipient-render', surface: kind === 'storefront-health' ? 'tool' : 'tool' } }); } catch (_) {}
    }
  }).catch(function () { /* silent — already-shown banner handles UX */ });
})();
