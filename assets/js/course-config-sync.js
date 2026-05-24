/*
 * Course config sync — debounced push of MuntinContext to
 * /api/course/config for signed-in operators.
 *
 * Listens to mtn:context-change events (broadcast by the workshop
 * widget engine on every commit) and on each event resets a 5-second
 * debounce timer. When the timer fires, the script reads the current
 * MuntinContext, picks only the keys the server-side allowlist
 * accepts (matches src/lib/course.js CONFIG_ALLOWED_KEYS), and POSTs
 * the snapshot.
 *
 * Anonymous operators get a 401 — silently skipped. Signed-in
 * operators get cross-device sync of their rich config (palette,
 * dishes, hours, onePromise, customerParagraph, the lot) so signing
 * in on a second device pulls a working snapshot via /api/course/config
 * GET (which the L14 readiness checklist or a future hydration step
 * can consume).
 *
 * Loaded on every lesson page + the course hub by
 * scripts/inject-course-config-sync.mjs. The script is idempotent
 * (multiple imports share a single timer); a no-op if MuntinContext
 * isn't on the page (e.g., the script is included somewhere outside
 * the bootcamp by mistake).
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || !document) return;
  if (window.__mtnCourseConfigSync) return;  // singleton guard
  window.__mtnCourseConfigSync = true;

  var DEBOUNCE_MS = 5000;
  var ENDPOINT = '/api/course/config';

  // Mirror of CONFIG_ALLOWED_KEYS in src/lib/course.js. The server
  // re-strips anything off-allowlist, so the client filter is a
  // bandwidth optimization, not a security boundary.
  var ALLOWED = [
    'restaurantProfile',
    'palette',
    'onePromise',
    'customerParagraph',
    'dishes',
    'hours',
    'localKeywords',
    'reviewResponseTemplate',
    'rhythmCadence',
    'deployTarget'
  ];

  var timer = null;
  var serverKnownEmpty = false;  // flipped to true on any 401 — never retry within session

  function readContextSnapshot() {
    if (!window.MuntinContext || typeof window.MuntinContext.read !== 'function') return null;
    var ctx = window.MuntinContext.read() || {};
    var profile = (typeof window.MuntinContext.readRestaurantProfile === 'function'
                   ? window.MuntinContext.readRestaurantProfile() : null) || null;
    var snapshot = {};
    if (profile) snapshot.restaurantProfile = profile;
    for (var i = 0; i < ALLOWED.length; i++) {
      var k = ALLOWED[i];
      if (k === 'restaurantProfile') continue;  // already handled
      if (ctx[k] !== undefined && ctx[k] !== null) snapshot[k] = ctx[k];
    }
    // Only push if there's at least one meaningful field. An entirely
    // empty snapshot would push the server back to the empty state,
    // which is the wrong thing for an operator who's just dropped
    // their localStorage but hasn't re-typed anything yet.
    return Object.keys(snapshot).length ? snapshot : null;
  }

  function push() {
    if (serverKnownEmpty) return;  // anonymous user — don't keep firing 401s
    var snapshot = readContextSnapshot();
    if (!snapshot) return;
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(snapshot)
      }).then(function (r) {
        if (r.status === 401) serverKnownEmpty = true;
      }).catch(function () { /* offline / network — retry on next event */ });
    } catch (_) { /* fetch unavailable */ }
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      timer = null;
      push();
    }, DEBOUNCE_MS);
  }

  var eventName = (window.WorkshopKit && window.WorkshopKit.CONTEXT_CHANGE_EVENT) || 'mtn:context-change';
  document.addEventListener(eventName, schedule);

  // Cross-tab: when another tab writes mtn:context, the storage event
  // fires here. Schedule a push so the server picks up changes the
  // operator made in a different tab too.
  window.addEventListener('storage', function (e) {
    if (!e || !e.key || e.key === 'mtn:context') schedule();
  });
})();
