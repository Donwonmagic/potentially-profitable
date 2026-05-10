// assets/js/window-state.js
//
// Phase 2.3 (Window redesign) — site-wide pulse + pause-state client.
// Tiny script loaded on every page via the footer partial. One fetch
// to /api/window/active reveals every pulse element in the page that
// matches the active threshold (4h since lastSeen). Phase 5+ extends
// the same fetch to also light up the nav pulse + mobile-cta-bar
// pulse, plus a one-shot /api/window/now fetch on /about/ to surface
// the operator-presence line.
//
// Plan §4.1 — "the pulse travels": every page shows the same
// breathing dot beside the foot-cta strip + the nav CTA + the mobile
// sticky-bar CTA so the muntin posture is felt site-wide, not only
// on /window/. Plan §4.4 + §11.4 deferred /about/ presence from Phase
// 4 to Phase 5+; this script handles that surface.
//
// This script does NOT touch the /window/ page's own pulse element
// (#windowPulse) — that's owned by assets/js/window.js.

(function () {
  'use strict';

  // Don't waste a fetch on the destination page itself; window.js
  // handles its own polling there.
  var path = location.pathname;
  if (path === '/window/' || path === '/window' ||
      path === '/es/window/' || path === '/es/window') {
    return;
  }

  // Threshold: pulse if Don's lastSeen was within 4 hours.
  // Plan §11.4's 14-day staleness check is enforced server-side via
  // window:now.updatedAt; this client trusts the lastSeen value the
  // endpoint returned (server already filters).
  var FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

  // All pulse elements that this script can light up. Each ID is
  // optional — the script no-ops when an element is missing (e.g.,
  // pages that opt out of the mobile sticky bar).
  var pulses = [
    document.getElementById('footCtaPulse'),
    document.getElementById('navWindowPulse'),
    document.getElementById('mobileCtaBarPulse'),
  ].filter(Boolean);

  if (pulses.length) {
    fetch('/api/window/active', { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.ok || !j.lastSeen) return;
        var elapsed = Date.now() - Number(j.lastSeen);
        if (elapsed < 0 || elapsed >= FOUR_HOURS_MS) return;
        var minutes = Math.max(1, Math.round(elapsed / 60000));
        var hint = minutes < 60
          ? 'Don is around — last seen ' + minutes + 'm ago'
          : 'Don is around — last seen ' + Math.round(elapsed / 3600000) + 'h ago';
        pulses.forEach(function (el) {
          el.hidden = false;
          // Footer pulse already has a static title; only set on
          // elements that don't carry their own.
          if (!el.title) el.title = hint;
        });
      })
      .catch(function () { /* network error: leave pulses hidden */ });
  }

  // Phase 5+ — /about/ presence. The /now/ widget surfaces here
  // (Phase 4 scoped to /window/ only; the additive expansion lives
  // in Phase 5+). Same endpoint, same locale-aware payload, same
  // privacy/staleness gates as on /window/.
  var aboutNowEl = document.getElementById('aboutNow');
  if (aboutNowEl) {
    var locale = (document.body && document.body.getAttribute('data-locale') === 'es') ? 'es' : 'en';
    fetch('/api/window/now?locale=' + encodeURIComponent(locale), { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.ok || !j.show || !j.text) return;
        // Phase 5+ audit (Issue 3 LOW): set dataset.mode + unhide
        // BEFORE assigning textContent so the aria-live="polite"
        // mutation fires on a region already in the accessibility
        // tree. Setting textContent on a [hidden] node is generally
        // not announced.
        aboutNowEl.dataset.mode = j.mode || 'fuzz';
        aboutNowEl.hidden = false;
        aboutNowEl.textContent = j.text;
      })
      .catch(function () { /* widget off, stale, or network blip — leave hidden */ });
  }
})();
