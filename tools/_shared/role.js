/**
 * Shared owner/developer/designer role toggle for the Muntin Digital
 * toolkit.
 *
 * Problem: tools surface developer artifacts (CSS tokens, JSON-LD,
 * copy-as-CSV, dev-brief Markdown) at the same visual weight as
 * owner-facing artifacts (printable card, voicemail script, plain-English
 * fix). For the average restaurant owner, the dev-shaped exports are
 * noise; for an owner who outsources, they're exactly what they need to
 * forward to their web person.
 *
 * Solution: a single global role toggle persisted in localStorage at
 * `mtn:role`. Tools read it on render and use the helpers below to
 * promote / demote sections per role. Default is 'owner'. Switching
 * never hides capability — it demotes lower-priority sections into a
 * `<details>` so the page stays scannable.
 *
 * Roles:
 *   'owner'     — average operator, no dev/design help. Promotes:
 *                 plain-English fixes, primary artifact (PNG, voicemail,
 *                 rewritten sentence), platform recipe.
 *   'dev'       — has a web person, or is one. Promotes: JSON-LD,
 *                 CSS tokens, dev-brief Markdown, mailto-developer.
 *   'designer'  — has a designer. Promotes: palette tokens, mockup pack,
 *                 brand sheet, photo brief.
 *
 * Wiring:
 *
 *   var role = MuntinRole.get();           // 'owner' | 'dev' | 'designer'
 *   if (MuntinRole.is('dev')) showDevBlock();
 *   MuntinRole.applyTo(document.body);     // sets data-mtn-role on root
 *   MuntinRole.onChange(function (next) { rerender(); });
 *
 * CSS pattern (host page):
 *
 *   [data-mtn-role="owner"]    .for-dev      { display: none; }
 *   [data-mtn-role="owner"]    .for-designer { display: none; }
 *   [data-mtn-role="dev"]      .for-designer { display: none; }
 *
 * Pure-ish: the only side effects are localStorage and (if applyTo is
 * called) a single attribute on a host element.
 */

(function (root) {
  'use strict';

  var STORAGE_KEY = 'mtn:role';
  var ATTR = 'data-mtn-role';
  var DEFAULT = 'owner';
  var VALID = ['owner', 'dev', 'designer'];

  function safeStorage() {
    try {
      if (typeof localStorage === 'undefined') return null;
      var probe = '__mtn_role_probe__';
      localStorage.setItem(probe, probe); // h8-exempt: quota-availability probe; immediately removed
      localStorage.removeItem(probe);
      return localStorage;
    } catch (e) {
      return null;
    }
  }

  function normalize(v) {
    if (typeof v !== 'string') return DEFAULT;
    var lower = v.toLowerCase();
    return VALID.indexOf(lower) !== -1 ? lower : DEFAULT;
  }

  function get() {
    var ls = safeStorage();
    if (!ls) return DEFAULT;
    try {
      return normalize(ls.getItem(STORAGE_KEY));
    } catch (e) {
      return DEFAULT;
    }
  }

  function set(role) {
    var next = normalize(role);
    var ls = safeStorage();
    if (ls) {
      try { ls.setItem(STORAGE_KEY, next); } catch (e) { /* swallow */ }
    }
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute(ATTR, next);
    }
    return next;
  }

  function is(role) {
    return get() === normalize(role);
  }

  function applyTo(el) {
    if (!el || typeof el.setAttribute !== 'function') return;
    el.setAttribute(ATTR, get());
  }

  // Subscribe to cross-tab + same-tab role changes. Same-tab changes
  // require the caller to dispatch a synthetic 'storage' event after
  // writing, since browsers only fire 'storage' across tabs. We provide
  // `set()` which already does the right thing for cross-tab; for same-
  // tab, callers should re-render after their own set() call.
  function onChange(callback) {
    if (typeof callback !== 'function') return function () {};
    if (typeof root.addEventListener !== 'function') return function () {};
    var handler = function (e) {
      if (e && e.key === STORAGE_KEY) {
        try { callback(get()); } catch (err) { /* swallow */ }
      }
    };
    root.addEventListener('storage', handler);
    return function () { root.removeEventListener('storage', handler); };
  }

  // One-call setup helper for tool pages: reads current role, applies
  // it to <html>, returns the role string. Idempotent.
  function init() {
    var role = get();
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute(ATTR, role);
    }
    return role;
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    ATTR: ATTR,
    DEFAULT: DEFAULT,
    VALID: VALID,
    get: get,
    set: set,
    is: is,
    applyTo: applyTo,
    onChange: onChange,
    init: init
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.MuntinRole = api;
  }
})(typeof self !== 'undefined' ? self : this);
