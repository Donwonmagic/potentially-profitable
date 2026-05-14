/**
 * Phase 4 wiring helper.
 *
 * The Phase 4 commit shipped two APIs separately:
 *   - MuntinContext.recordToolVisit(toolKey, signals) — writes the
 *     "Continue → X" history the hub reads on returning visits.
 *   - MuntinNextTool.render({ mount, from, signals, locale }) —
 *     renders the next-step card at the end of a tool's result.
 *
 * Both need to fire after a successful tool render with the same
 * signals object. Calling them independently means 8+ lines per
 * tool and the risk that one is wired and the other isn't. This
 * helper does both in one call.
 *
 * Usage at the end of a tool's result render:
 *
 *   MuntinHandoff.complete({
 *     toolKey: 'plate-cost',
 *     signals: { dishSaved: true, needsMenuMix: true },
 *     resultEl: document.getElementById('pcResult'),
 *   });
 *
 * Locale is auto-detected from <html lang="es"> (any other value
 * falls back to 'en'). Both write paths are wrapped in try/catch
 * so a missing module never breaks the tool's own result render.
 *
 * No dependencies beyond MuntinContext + MuntinNextTool.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof self !== 'undefined') {
    self.MuntinHandoff = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function detectLocale() {
    try {
      var lang = (document.documentElement.lang || 'en').toLowerCase();
      return lang.indexOf('es') === 0 ? 'es' : 'en';
    } catch (_) { return 'en'; }
  }

  // complete({ toolKey, signals, resultEl, locale? })
  //   - toolKey: required. Slug like 'plate-cost' or 'audits/restaurant'.
  //   - signals: optional flat object matched against next-tool-map.json.
  //   - resultEl: required. DOM node where the recommendation card
  //               mounts. Phase 5 a11y: focus is NOT moved here — the
  //               tool's own result-region focus management owns that.
  //   - locale:  optional override; defaults to <html lang> detection.
  function complete(spec) {
    if (!spec || !spec.toolKey) return;
    var signals = (spec.signals && typeof spec.signals === 'object') ? spec.signals : null;
    var locale = spec.locale || detectLocale();
    try {
      if (window.MuntinContext && typeof window.MuntinContext.recordToolVisit === 'function') {
        window.MuntinContext.recordToolVisit(spec.toolKey, signals);
      }
    } catch (_) {}
    try {
      if (spec.resultEl && window.MuntinNextTool && typeof window.MuntinNextTool.render === 'function') {
        window.MuntinNextTool.render({
          mount: spec.resultEl,
          from: spec.toolKey,
          signals: signals,
          locale: locale
        });
      }
    } catch (_) {}
  }

  // prefill({ map, captureOnSubmit })
  //   map: { fieldName: '#inputId' | HTMLElement }
  //     fieldName must be a key in restaurantProfile (or 'websiteUrl').
  //     If the input is empty AND the Profile has the value, fill it.
  //   captureOnSubmit: form element OR array of inputs to capture
  //     values back to the Profile on submit. Lets the operator's
  //     first explicit entry seed the Profile for every subsequent tool.
  //
  // Both reads and writes are wrapped in try/catch. If MuntinContext
  // isn't loaded the helper no-ops silently so the tool still works.
  function prefill(spec) {
    if (!spec || typeof spec !== 'object') return;
    var profile = null;
    try {
      if (window.MuntinContext && typeof window.MuntinContext.readRestaurantProfile === 'function') {
        profile = window.MuntinContext.readRestaurantProfile() || null;
      }
    } catch (_) {}
    var entries = spec.map && typeof spec.map === 'object' ? spec.map : null;
    if (entries && profile) {
      Object.keys(entries).forEach(function (field) {
        if (!profile[field]) return;
        var el = entries[field];
        if (typeof el === 'string') el = document.querySelector(el);
        if (!el) return;
        // Only fill empty inputs — never overwrite something the
        // user already typed (e.g. on back-button revisit).
        if ('value' in el && !el.value) {
          el.value = String(profile[field]);
          // Notify any input-listeners (counters, validators) the
          // value changed programmatically. Same event the user's
          // first keystroke would fire.
          try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) {}
          try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
        }
      });
    }
    // Capture-on-submit: when a form submits, read the named fields
    // and persist whatever the user typed. Wraps the form's submit
    // handler additively so the existing submit logic still runs first.
    if (spec.captureOnSubmit && entries) {
      var form = spec.captureOnSubmit;
      if (typeof form === 'string') form = document.querySelector(form);
      if (form && form.addEventListener) {
        form.addEventListener('submit', function () {
          // Run AFTER the form's own submit logic by deferring.
          setTimeout(function () {
            var patch = {};
            Object.keys(entries).forEach(function (field) {
              var el = entries[field];
              if (typeof el === 'string') el = document.querySelector(el);
              if (!el || !('value' in el)) return;
              var v = String(el.value || '').trim();
              if (v) patch[field] = v;
            });
            if (Object.keys(patch).length === 0) return;
            try {
              if (window.MuntinContext && typeof window.MuntinContext.writeRestaurantProfile === 'function') {
                window.MuntinContext.writeRestaurantProfile(patch);
              }
            } catch (_) {}
          }, 0);
        });
      }
    }
  }

  return { complete: complete, prefill: prefill, _detectLocale: detectLocale };
}));
