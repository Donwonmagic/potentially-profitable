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

  // On load, decide whether to show the prompt.
  function init() {
    var slug = detectToolSlug();
    if (!slug) return;
    if (shouldShowPrompt(slug)) renderPrompt(slug);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
