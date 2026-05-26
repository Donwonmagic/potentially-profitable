/*
 * Course config sync — bidirectional MuntinContext ↔ /api/course/config.
 *
 * Two operations, sharing the same module:
 *
 *   1. HYDRATE on page load (additive merge):
 *      - If MuntinContext locally has none of the allowlisted keys
 *        (fresh-device case), GET /api/course/config and merge any
 *        present fields into MuntinContext via .merge() (which writes
 *        localStorage and broadcasts mtn:context-change, so already-
 *        mounted widgets re-render with the hydrated state).
 *      - If local already has any allowlisted key, skip hydrate
 *        entirely — local is the source of truth for an operator
 *        who's already typed something here.
 *      - 401 = anonymous → flips serverKnownEmpty so the push side
 *        also short-circuits for the rest of the session.
 *
 *   2. PUSH on debounced context change:
 *      - Listens to mtn:context-change (workshop widget commits) +
 *        cross-tab storage events on mtn:context.
 *      - Resets a 5-second debounce timer; timer fires → reads the
 *        current MuntinContext, picks allowlisted keys, POSTs.
 *      - Empty snapshot → skip (don't clobber server with empties).
 *      - Suppressed for one timer cycle after a successful hydrate
 *        so the freshly-merged state doesn't immediately POST back
 *        the same data.
 *
 * Singleton (window.__mtnCourseConfigSync). No-op if MuntinContext
 * isn't on the page. Loaded on every lesson page + the course hub
 * via scripts/inject-course-config-sync.mjs.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || !document) return;
  if (window.__mtnCourseConfigSync) return;
  window.__mtnCourseConfigSync = true;

  var DEBOUNCE_MS = 5000;
  var ENDPOINT = '/api/course/config';

  // Mirror of CONFIG_ALLOWED_KEYS in src/lib/course.js. The server
  // re-strips anything off-allowlist, so the client filter is a
  // bandwidth optimization, not a security boundary.
  var ALLOWED = [
    'restaurantProfile',
    'palette',
    'voice',
    'fontPair',
    'onePromise',
    'customerParagraph',
    'customerCard',
    'dishes',
    'shotList',
    'deliveryRadius',
    'gbp',
    'gbpDescription',
    'hours',
    'localKeywords',
    'reviewResponseTemplate',
    'rhythmCadence',
    'deployTarget',
    'deployProgress'
  ];

  var timer = null;
  var serverKnownEmpty = false;
  var suppressNextPush = false;  // flipped true right after hydrate; cleared by next push or timer

  function readContextSnapshot() {
    if (!window.MuntinContext || typeof window.MuntinContext.read !== 'function') return null;
    var ctx = window.MuntinContext.read() || {};
    var profile = (typeof window.MuntinContext.readRestaurantProfile === 'function'
                   ? window.MuntinContext.readRestaurantProfile() : null) || null;
    var snapshot = {};
    if (profile) snapshot.restaurantProfile = profile;
    for (var i = 0; i < ALLOWED.length; i++) {
      var k = ALLOWED[i];
      if (k === 'restaurantProfile') continue;
      if (ctx[k] !== undefined && ctx[k] !== null) snapshot[k] = ctx[k];
    }
    return Object.keys(snapshot).length ? snapshot : null;
  }

  // True iff at least one allowlisted field has a non-empty value in
  // local MuntinContext. Used to gate the hydrate decision: if the
  // operator's local state has any real data, don't pull server data
  // on top of it (would create a confusing flicker + risk clobbering
  // in-progress work).
  function localHasAnyAllowedField() {
    if (!window.MuntinContext || typeof window.MuntinContext.read !== 'function') return false;
    var ctx = window.MuntinContext.read() || {};
    var profile = (typeof window.MuntinContext.readRestaurantProfile === 'function'
                   ? window.MuntinContext.readRestaurantProfile() : null) || null;
    if (profile) {
      for (var p in profile) {
        if (Object.prototype.hasOwnProperty.call(profile, p) && profile[p]) return true;
      }
    }
    for (var i = 0; i < ALLOWED.length; i++) {
      var k = ALLOWED[i];
      if (k === 'restaurantProfile') continue;
      var v = ctx[k];
      if (v === undefined || v === null) continue;
      if (Array.isArray(v) && v.length > 0) return true;
      if (typeof v === 'object' && Object.keys(v).length > 0) return true;
      if (typeof v === 'string' && v.trim()) return true;
    }
    return false;
  }

  function push() {
    if (suppressNextPush) { suppressNextPush = false; return; }
    if (serverKnownEmpty) return;
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

  // ---- Hydrate -------------------------------------------------------
  // Runs once at script init. If local has any meaningful field, skip.
  // Otherwise GET /api/course/config and merge non-null fields into
  // MuntinContext via .merge() — which writes localStorage and broadcasts
  // mtn:context-change, so any widgets already mounted re-render
  // immediately with the hydrated state.
  // True iff THIS specific key is empty/missing in local MuntinContext.
  // Used by the per-field hydrate: a tool user who saved a palette in
  // brand-suite has local.palette but no local.dishes — the course
  // can still pull dishes from server without clobbering the palette.
  function localKeyEmpty(k) {
    if (!window.MuntinContext || typeof window.MuntinContext.read !== 'function') return true;
    if (k === 'restaurantProfile') {
      var profile = (typeof window.MuntinContext.readRestaurantProfile === 'function'
                     ? window.MuntinContext.readRestaurantProfile() : null);
      if (!profile) return true;
      for (var p in profile) {
        if (Object.prototype.hasOwnProperty.call(profile, p) && profile[p]) return false;
      }
      return true;
    }
    var ctx = window.MuntinContext.read() || {};
    var v = ctx[k];
    if (v === undefined || v === null) return true;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === 'object') return Object.keys(v).length === 0;
    if (typeof v === 'string') return !v.trim();
    return false;
  }

  function hydrate() {
    if (!window.MuntinContext || typeof window.MuntinContext.merge !== 'function') return;
    // Per-field merge (not whole-snapshot gate): for each ALLOWED key,
    // if local is empty AND server has a value, merge that one key.
    // Preserves "client wins" semantics for non-empty local fields and
    // closes the cross-tool prefill gap (brand-suite save in tab A →
    // course palette widget pre-populates in tab B without sign-in
    // forcing a wholesale wipe).
    try {
      fetch(ENDPOINT, { credentials: 'same-origin' }).then(function (r) {
        if (r.status === 401) { serverKnownEmpty = true; return null; }
        if (!r.ok) return null;
        return r.json();
      }).then(function (data) {
        if (!data || !data.config) return;
        var cfg = data.config;
        var patch = {};
        // restaurantProfile lands via writeRestaurantProfile when available
        // — and only when local profile is empty for this field.
        if (cfg.restaurantProfile && localKeyEmpty('restaurantProfile')) {
          if (typeof window.MuntinContext.writeRestaurantProfile === 'function') {
            try { window.MuntinContext.writeRestaurantProfile(cfg.restaurantProfile); } catch (_) {}
          }
        }
        for (var i = 0; i < ALLOWED.length; i++) {
          var k = ALLOWED[i];
          if (k === 'restaurantProfile') continue;
          if (cfg[k] === undefined || cfg[k] === null) continue;
          if (!localKeyEmpty(k)) continue;  // client wins — skip
          patch[k] = cfg[k];
        }
        if (Object.keys(patch).length) {
          suppressNextPush = true;  // freshly-merged state shouldn't immediately POST back
          try { window.MuntinContext.merge(patch); } catch (_) {}
        }
      }).catch(function () { /* offline — operator can still work locally */ });
    } catch (_) {}
  }

  hydrate();

  var eventName = (window.WorkshopKit && window.WorkshopKit.CONTEXT_CHANGE_EVENT) || 'mtn:context-change';
  document.addEventListener(eventName, schedule);

  window.addEventListener('storage', function (e) {
    if (!e || !e.key || e.key === 'mtn:context') schedule();
  });
})();
