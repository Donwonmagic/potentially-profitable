// assets/js/window-state.js
//
// Phase 2.3 (Window redesign) — site-wide pulse + pause-state client.
// Tiny script (≤1KB after minification) loaded on every page via the
// footer partial. Polls /api/window/active once on load (cached 60s
// at the edge — see src/worker.js handleWindowActive) and reveals
// the footer pulse if Don has been seen recently.
//
// Plan §4.1 — "the pulse travels": every page shows the same
// breathing dot beside the foot-cta strip ("Got a question? The
// Window is open.") so the muntin posture is felt site-wide, not
// only on /window/.
//
// Plan §11.4 — staleness circuit-breaker: if window:now.updatedAt
// is more than 14 days old, the pulse stays hidden. (The /api/window/active
// endpoint is the canonical source of presence; the /now/ widget is
// Phase 4 and not yet wired here.)
//
// This script does NOT touch the /window/ page's own pulse element
// (#windowPulse) — that's owned by assets/js/window.js.

(function () {
  'use strict';

  // Don't waste a fetch on the destination page itself; window.js
  // handles its own polling there.
  if (location.pathname === '/window/' || location.pathname === '/window' ||
      location.pathname === '/es/window/' || location.pathname === '/es/window') {
    return;
  }

  var pulse = document.getElementById('footCtaPulse');
  if (!pulse) return;

  // Threshold: pulse if Don's lastSeen was within 4 hours.
  // Plan §11.4's 14-day staleness check is enforced server-side
  // via window:now.updatedAt; this client just trusts the lastSeen
  // value the endpoint returned (server already filters).
  var FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

  fetch('/api/window/active', { credentials: 'omit' })
    .then(function (r) {
      if (!r.ok) return null;
      return r.json();
    })
    .then(function (j) {
      if (!j || !j.ok || !j.lastSeen) return;
      var elapsed = Date.now() - Number(j.lastSeen);
      if (elapsed >= 0 && elapsed < FOUR_HOURS_MS) {
        pulse.hidden = false;
        // Update the title for hover so a curious visitor sees the
        // calendar-honest reading.
        var minutes = Math.max(1, Math.round(elapsed / 60000));
        pulse.title = minutes < 60
          ? 'Don is around — last seen ' + minutes + 'm ago'
          : 'Don is around — last seen ' + Math.round(elapsed / 3600000) + 'h ago';
      }
    })
    .catch(function () { /* network error: leave the pulse hidden */ });
})();
