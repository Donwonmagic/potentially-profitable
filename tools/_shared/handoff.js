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

  return { complete: complete, _detectLocale: detectLocale };
}));
