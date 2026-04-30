/**
 * Phase G.10 (Growth) — "Save next time" prompt.
 *
 * Tracks tool runs in localStorage. On a return visit to a tool
 * the user previously ran but didn't save, surface a quiet inline
 * banner offering to save. Fires Tool Save Intent (Plausible)
 * when shown.
 *
 * Storage shape (localStorage `muntin_tool_runs`):
 *   { "<tool-slug>": { lastRunAt, savedAt? } }
 *
 * - lastRunAt is set whenever the tool's main "run" event fires.
 * - savedAt is set when the Save-to-Workshop event fires.
 * - When (lastRunAt && !savedAt) AND ≥1 day has passed, show the prompt.
 *
 * Uses event delegation: tools dispatch a CustomEvent
 * 'muntin:tool-run' (detail: { slug }) and 'muntin:tool-save'
 * (detail: { slug }). The shared analytics helper handles the
 * Plausible side; this file handles the localStorage state +
 * the prompt rendering.
 */

(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var STORAGE_KEY = 'muntin_tool_runs';
  var DAY_MS = 24 * 60 * 60 * 1000;

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function writeState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
    catch (_) { /* quota / private mode */ }
  }

  function detectToolSlug() {
    var m = location.pathname.match(/^\/(?:es\/)?tools\/([a-z0-9-]+(?:\/[a-z0-9-]+)?)\/?/);
    return m ? m[1] : null;
  }

  function recordRun(slug) {
    var s = readState();
    s[slug] = s[slug] || {};
    s[slug].lastRunAt = Date.now();
    writeState(s);
  }

  function recordSave(slug) {
    var s = readState();
    s[slug] = s[slug] || {};
    s[slug].savedAt = Date.now();
    writeState(s);
  }

  function shouldShowPrompt(slug) {
    var s = readState();
    var entry = s[slug];
    if (!entry || !entry.lastRunAt) return false;
    if (entry.savedAt) return false;
    var ageMs = Date.now() - entry.lastRunAt;
    if (ageMs < DAY_MS) return false;
    return true;
  }

  function isLocaleEs() {
    return location.pathname.startsWith('/es/') || (document.documentElement.lang || '').toLowerCase() === 'es';
  }

  function renderPrompt(slug) {
    if (document.querySelector('.tool-save-prompt')) return; // already shown
    var es = isLocaleEs();
    var node = document.createElement('aside');
    node.className = 'tool-save-prompt';
    node.setAttribute('role', 'note');
    node.innerHTML = es
      ? '<p>La última vez corriste esto sin guardarlo. ¿Quieres que aparezca en tu Taller la próxima vez que vuelvas?</p>'
      + '<p><a href="/es/sign-in/?return_to=/es/workbench/" class="tool-save-prompt__cta">Inicia sesión y guarda</a></p>'
      : '<p>Last time you ran this without saving. Want it in your Workshop next time you come back?</p>'
      + '<p><a href="/sign-in/?return_to=/workbench/" class="tool-save-prompt__cta">Sign in and save it</a></p>';
    var anchor = document.querySelector('.tool-verified, .tool-storefront-rail, .post-hero, header');
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(node, anchor.nextSibling);
    } else {
      document.body.insertBefore(node, document.body.firstChild);
    }
    if (typeof window.plausible === 'function') {
      try { window.plausible('Tool Save Intent', { props: { tool: slug } }); }
      catch (_) {}
    }
  }

  // Listen for tool-fired events.
  document.addEventListener('muntin:tool-run', function (e) {
    var slug = (e.detail && e.detail.slug) || detectToolSlug();
    if (slug) recordRun(slug);
  });
  document.addEventListener('muntin:tool-save', function (e) {
    var slug = (e.detail && e.detail.slug) || detectToolSlug();
    if (slug) recordSave(slug);
  });

  // Phase G.9 — auto-bridge: monkey-patch window.plausible so any
  // call with a known tool-grader event name dispatches the
  // matching CustomEvent. Lets the existing tool code continue
  // calling plausible('SEO Grader', …) without per-tool changes.
  // Also fires bounded "Tool First Result" / "Tool Save Intent"
  // events for the Plausible funnel KPIs (registered in
  // tools/_shared/analytics.js).
  var TOOL_RUN_NAME_TO_SLUG = {
    'SEO Grader':     'seo-grader',
    'Speed Test':     'speed-test',
    'Mobile Check':   'mobile-check',
    'Schema Check':   'schema-check',
    'GBP Grader':     'gbp-grader',
    'Tech Stack':     'tech-stack',
    'Search Ideas':   'search-ideas',
    'Compare':        'compare',
    'Audit Started':       'audits/restaurant',
    'Audit Completed':     'audits/restaurant',
    'Margin Math PrimeCost':'margin-math',
    'Margin Math BreakEvenCovers':'margin-math',
    'Margin Math PriceRaise':'margin-math',
    'Margin Math DeliveryBreakeven':'margin-math',
    'Menu Engineering Analysis':'menu-engineering',
    'Plate Cost Compute':  'plate-cost',
    'Photo Brief Compute': 'photo-brief',
    'Open Hours Render':   'open-hours',
    'Brand Suite Demo':    'brand-suite',
    'Menu Copy Inspector Analysis':'menu-copy',
  };
  var SAVE_EVENT_NAMES = {
    'Workbench Save': 1,
    'GBP Share Saved': 1,
    'Audit Shared': 1,
    'Brand Suite Export': 1,
    'Menu Engineering Export': 1,
    'Plate Cost Export': 1,
    'Photo Brief Export': 1,
    'Menu Copy Inspector Export': 1,
    'Open Hours Export': 1,
  };
  var FIRED_RUN_THIS_LOAD = {};
  function bridge(name, opts) {
    var slug = TOOL_RUN_NAME_TO_SLUG[name];
    if (slug) {
      try { document.dispatchEvent(new CustomEvent('muntin:tool-run', { detail: { slug: slug } })); } catch (_) {}
      // Phase G.9 — also fire Tool First Result once per session per tool.
      if (!FIRED_RUN_THIS_LOAD[slug]) {
        FIRED_RUN_THIS_LOAD[slug] = 1;
        try {
          if (typeof origPlausible === 'function') {
            origPlausible('Tool First Result', { props: { tool: slug } });
          }
        } catch (_) {}
      }
    }
    if (SAVE_EVENT_NAMES[name]) {
      var sslug = (opts && opts.props && opts.props.tool) || detectToolSlug();
      if (sslug) {
        try { document.dispatchEvent(new CustomEvent('muntin:tool-save', { detail: { slug: sslug } })); } catch (_) {}
      }
    }
  }
  var origPlausible = window.plausible;
  if (typeof origPlausible === 'function') {
    window.plausible = function (name, opts) {
      try { bridge(name, opts); } catch (_) {}
      return origPlausible.apply(this, arguments);
    };
    // Preserve queue compatibility shim.
    window.plausible.q = origPlausible.q || [];
  } else {
    // Plausible may load after this script. Defer the wrap.
    var deferAttempts = 0;
    var deferId = setInterval(function () {
      if (typeof window.plausible === 'function' && window.plausible !== arguments.callee) {
        var orig = window.plausible;
        window.plausible = function (name, opts) {
          try { bridge(name, opts); } catch (_) {}
          return orig.apply(this, arguments);
        };
        window.plausible.q = orig.q || [];
        clearInterval(deferId);
      } else if (++deferAttempts > 50) {
        clearInterval(deferId);
      }
    }, 100);
  }

  // On load, decide whether to show the prompt.
  function init() {
    var slug = detectToolSlug();
    if (!slug) return;
    if (shouldShowPrompt(slug)) renderPrompt(slug);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
