/**
 * Phase 7 — dark-mode toggle.
 *
 * The Phase 5 CSS shipped a token swap activated by either
 * @media (prefers-color-scheme: dark) OR [data-theme="dark"] on
 * <html>. This script wires the in-page button so users can override
 * their OS preference. Tri-state:
 *
 *   1. "auto" (no [data-theme] attribute) — follows OS preference.
 *   2. "light" — forces light regardless of OS.
 *   3. "dark"  — forces dark regardless of OS.
 *
 * Each click cycles: auto → light → dark → auto. Storage: a single
 * 'mtn-theme' key in MuntinSafeStorage (or localStorage fallback).
 * The button is rendered hidden in the nav partial; this script
 * un-hides it on init so a no-JS visitor never sees a non-functional
 * control.
 *
 * To avoid a flash of wrong theme on cold load, the inline critical
 * CSS in <head> already runs Phase 5's @media query immediately.
 * This script then optionally overrides AFTER first paint. The
 * intermediate state is the OS preference — acceptable.
 *
 * Pure progressive enhancement; no dependencies.
 */

(function () {
  'use strict';

  var KEY = 'mtn-theme';
  var html = document.documentElement;

  function safeRead() {
    try {
      if (window.MuntinSafeStorage && typeof window.MuntinSafeStorage.get === 'function') {
        return window.MuntinSafeStorage.get(KEY);
      }
      return localStorage.getItem(KEY);
    } catch (_) { return null; }
  }
  function safeWrite(v) {
    try {
      if (window.MuntinSafeStorage && typeof window.MuntinSafeStorage.set === 'function') {
        window.MuntinSafeStorage.set(KEY, v);
        return;
      }
      if (v == null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, v);
    } catch (_) {}
  }

  function applyTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      html.setAttribute('data-theme', theme);
    } else {
      html.removeAttribute('data-theme');
    }
  }

  function readResolved() {
    // What's actually being shown right now (after OS prefs + override)?
    var stored = safeRead();
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }

  function init() {
    // Every .js-theme-toggle instance (desktop nav + mobile menu). They
    // share one state and stay in sync — the desktop one is icon-only,
    // the mobile one also carries a .js-theme-label text.
    var btns = document.querySelectorAll('.js-theme-toggle');
    if (!btns.length) return;

    // Apply stored preference (if any) before un-hiding the buttons.
    var stored = safeRead();
    if (stored === 'dark' || stored === 'light') applyTheme(stored);
    for (var i = 0; i < btns.length; i++) btns[i].hidden = false;

    function syncButtons() {
      var resolved = readResolved();
      var isDark = resolved === 'dark';
      for (var j = 0; j < btns.length; j++) {
        var b = btns[j];
        b.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        b.setAttribute('aria-label',
          isDark ? 'Switch to light mode' : 'Switch to dark mode');
        var lbl = b.querySelector('.js-theme-label');
        if (lbl) lbl.textContent = isDark
          ? (b.getAttribute('data-label-dark') || 'Dark mode')
          : (b.getAttribute('data-label-light') || 'Light mode');
      }
    }
    syncButtons();

    function onToggle() {
      var current = safeRead(); // 'dark' | 'light' | null (auto)
      var next;
      if (current == null)      next = 'light';
      else if (current === 'light') next = 'dark';
      else /* dark */           next = null;
      if (next == null) safeWrite(null);
      else              safeWrite(next);
      applyTheme(next);
      syncButtons();
      if (window.plausible) {
        try { window.plausible('Theme Toggle', { props: { theme: next == null ? 'auto' : next } }); } catch (_) {}
      }
    }
    for (var k = 0; k < btns.length; k++) btns[k].addEventListener('click', onToggle);

    // Keep the labels in sync if the OS preference flips while the user
    // is on the page AND they're in 'auto' mode.
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var listener = function () {
        if (safeRead() == null) syncButtons();
      };
      if (mq.addEventListener) mq.addEventListener('change', listener);
      else if (mq.addListener) mq.addListener(listener);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
