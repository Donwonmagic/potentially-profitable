/**
 * Phase 2 — hub tier filter handler.
 *
 * Wires the [data-tier-filter] strip on /tools/ and /es/tools/.
 * Pure progressive enhancement: without JS the strip stays hidden
 * (CSS rule .tool-tier-filter{display:none;}); JS marks it ready
 * (data-tier-filter-ready), then click toggles the active tier and
 * sets data-active-tier on the surrounding <section.block>. CSS
 * does the actual hide/show of cards by selector — no per-card
 * iteration. Cluster section <header>s stay visible so users see
 * which category groups are present even when filtered.
 *
 * No dependencies. Loaded by /tools/index.html and the ES mirror.
 */

(function () {
  'use strict';
  function init() {
    var strip = document.querySelector('[data-tier-filter]');
    if (!strip) return;
    var section = strip.closest('section.block') || document.body;
    strip.setAttribute('data-tier-filter-ready', '');

    var btns = strip.querySelectorAll('[data-tier-filter-btn]');
    function setActive(tier) {
      btns.forEach(function (b) {
        var on = b.getAttribute('data-tier-filter-btn') === tier;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (tier === 'all') {
        section.removeAttribute('data-active-tier');
      } else {
        section.setAttribute('data-active-tier', tier);
      }
      // Light-weight analytics ping; gracefully degrades if plausible
      // isn't loaded yet.
      if (window.plausible) {
        try {
          window.plausible('Tools Hub Filter', { props: { tier: tier } });
        } catch (_) {}
      }
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        setActive(b.getAttribute('data-tier-filter-btn') || 'all');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
