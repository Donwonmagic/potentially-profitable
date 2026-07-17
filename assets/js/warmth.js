/**
 * warmth.js — the on-device warmth substrate (muntin.digital).
 *
 * Warmth is "light through the pane": every warm signal is computed on the
 * reader's OWN device from what their browser already holds — their local clock,
 * OS theme, reduced-motion, locale — and SENT NOWHERE. The personalization IS the
 * privacy moat, not a trade against it. See docs/handoff/warmth-cohesion-plan.md.
 *
 * FAIL-SILENT BY CONSTRUCTION: any missing signal or absent mount is a no-op, and
 * with JS off the page is EXACTLY the certified v3 (every warm token defaults to
 * its certified value; this module only ever nudges an opt-in var upward).
 *
 * This first version drives the Golden-Hour whisper: it reads the local hour and
 * leans the muntin window's light a hair warmer at the edges of the day — midday
 * sits at the certified default (--gh-eve:0), dusk/golden-hour lean the faintest
 * bit gold. A whisper, never a shift (founder decision 2026-07-17). The pure core
 * (todBand + ghEve) is exported for node tests (assets/js/warmth.test.mjs).
 */
(function () {
  'use strict';

  // --- pure core (no DOM / no clock read; unit-tested) --------------------
  // Map a local hour (0-23) to a time-of-day band. Anything out of range → null
  // so the caller no-ops (never guesses a band).
  function todBand(hour) {
    if (typeof hour !== 'number' || !isFinite(hour) || hour < 0 || hour > 23) {
      return null;
    }
    if (hour < 5) return 'night'; //  0:00–4:59
    if (hour < 8) return 'dawn'; //   5:00–7:59
    if (hour < 17) return 'day'; //   8:00–16:59  (certified default; no lean)
    if (hour < 20) return 'golden'; // 17:00–19:59 (the actual golden hour)
    return 'dusk'; //                 20:00–23:59
  }

  // The WHISPER: an additive evening alpha for the window-glass light, capped low
  // so it can only ever read as "the room's light matches your hour," never a
  // theme change. 'day' → 0 (byte-identical to the certified v3).
  function ghEve(band) {
    switch (band) {
      case 'golden':
        return 0.06;
      case 'dusk':
        return 0.05;
      case 'dawn':
        return 0.035;
      case 'night':
        return 0.03;
      default:
        return 0; // 'day' and any unknown band → no lean, certified default
    }
  }

  // --- impure shell (browser only) ---------------------------------------
  function apply(doc, now) {
    try {
      var root = doc && doc.documentElement;
      if (!root) return;
      var hour = now.getHours();
      var band = todBand(hour);
      if (!band) return;
      // The band attribute is a hook future warmth consumers can read; harmless
      // on its own (no selector depends on it yet).
      root.setAttribute('data-warmth-tod', band);
      var eve = ghEve(band);
      // Only ever raise the opt-in var above its certified 0 — never touch a
      // spine token, never lower a default.
      if (eve > 0) root.style.setProperty('--gh-eve', String(eve));
    } catch (_) {
      /* fail-silent: without us, the page is exactly the certified v3 */
    }
  }

  var api = { todBand: todBand, ghEve: ghEve, apply: apply };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.muntinWarmth = api;
    apply(document, new Date());
  }
})();
