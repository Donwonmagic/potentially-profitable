// assets/js/window-handoff.js
//
// Phase 2.4 (Window redesign) — tool-result + sheets handoff helper.
// Tools include this script to render a "slide this under his door"
// aside that prefills a /window/ message with the finding.
//
// Plan §4.2.
//
// Usage from a tool page:
//
//   <aside class="window-handoff" data-window-handoff
//          data-topic="audit"
//          data-lead="Your audit found {n} leaks. The two ranked Critical are usually the ones I'd start with."
//          data-cta="Want me to take a look? &rarr;">
//   </aside>
//   <script src="/assets/js/window-handoff.js" defer></script>
//
// Then, when the tool finishes a run, call:
//
//   window.muntinHandoff.update({ findingText: 'Hero image is 4.2 MB...', n: 6 });
//
// The helper builds /window/?topic=<topic>&prefill=<base64> and
// renders the eyebrow + lead + CTA. The lead supports {n}
// substitution for counts.
//
// On pages where the helper hasn't been initialized when this script
// loads, it auto-renders any <aside data-window-handoff> with a
// generic CTA (no prefill) so the surface always has a "go to /window/"
// fallback.

(function () {
  'use strict';

  var locale = (document.body && document.body.getAttribute('data-locale') === 'es') ? 'es' : 'en';
  var windowHref = locale === 'es' ? '/es/window/' : '/window/';

  function base64UrlEncode(s) {
    try {
      var utf8 = unescape(encodeURIComponent(String(s)));
      var b64 = btoa(utf8);
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (_) {
      return '';
    }
  }

  function buildHandoffUrl(topic, finding) {
    var url = windowHref + '?topic=' + encodeURIComponent(topic || 'else');
    if (finding) {
      url += '&prefill=' + base64UrlEncode(finding);
    }
    return url;
  }

  // Render the aside content. The aside element should already exist
  // in the DOM (per-tool); we just fill in the eyebrow / lead / CTA.
  function renderAside(aside, opts) {
    if (!aside) return;
    var topic = aside.getAttribute('data-topic') || 'else';
    var leadTpl = aside.getAttribute('data-lead') || '';
    var ctaText = aside.getAttribute('data-cta') || (locale === 'es' ? '¿Quieres que le eche un vistazo? →' : 'Want me to take a look? →');
    var eyebrowText = locale === 'es' ? 'Mándaselo a Don' : 'Slide this under his door';

    var n = opts && typeof opts.n === 'number' ? opts.n : null;
    var finding = opts && typeof opts.findingText === 'string' ? opts.findingText : '';
    var lead = leadTpl.replace(/\{n\}/g, n != null ? String(n) : '');

    while (aside.firstChild) aside.removeChild(aside.firstChild);

    var eyebrow = document.createElement('p');
    eyebrow.className = 'window-handoff__eyebrow';
    eyebrow.textContent = eyebrowText;
    aside.appendChild(eyebrow);

    if (lead) {
      var leadEl = document.createElement('p');
      leadEl.className = 'window-handoff__lead';
      leadEl.textContent = lead;
      aside.appendChild(leadEl);
    }

    var cta = document.createElement('a');
    cta.className = 'window-handoff__cta';
    cta.href = buildHandoffUrl(topic, finding);
    cta.textContent = ctaText;
    aside.appendChild(cta);
  }

  // Public API for tool pages that need to update the aside after
  // a run completes (e.g., once the audit has scored).
  window.muntinHandoff = window.muntinHandoff || {
    update: function (opts) {
      var asides = document.querySelectorAll('[data-window-handoff]');
      for (var i = 0; i < asides.length; i++) {
        renderAside(asides[i], opts || {});
      }
    },
  };

  // Auto-render on load (no-prefill variant) so the aside always has
  // a working CTA even before the tool fires its update callback.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.muntinHandoff.update({});
    });
  } else {
    window.muntinHandoff.update({});
  }
})();
