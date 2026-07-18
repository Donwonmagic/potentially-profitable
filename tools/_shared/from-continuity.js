/**
 * from-continuity.js — the ?from continuity line (muntin.digital, Move 9).
 *
 * When a reader arrives at a free tool from a Cost Index ingredient surface, the
 * link carries ?from=<slug>. This module renders ONE calm line naming where they
 * came from — "You came here from Romaine lettuce in the Cost Index." — so the
 * surfaces talk to each other. It is a pure client-side enhancement: reads
 * location.search, no fetch, no storage (every build-invariant tool claim holds).
 *
 * THE ENTIRE INJECTION SURFACE IS titleFor(): the raw ?from value is only ever a
 * lookup KEY, never content. The only string written to the DOM is a title from
 * the closed, committed slug->{en,es} map, assigned via textContent — never the
 * raw param, never innerHTML. Any miss (absent / malformed / unknown / missing-es)
 * is a silent no-op: no element, no placeholder, no echo. With JS off nothing
 * renders and layout is unaffected (the element is created only in JS on a hit).
 */
(function (root) {
  'use strict';

  // PURE — the whole guard, so it is unit-tested (from-continuity.test.mjs).
  // map: { slug: { en, es } }. lang: 'en' | 'es'. Returns the mapped title or ''.
  function titleFor(raw, map, lang) {
    if (typeof raw !== 'string' || !/^[a-z0-9-]{1,40}$/.test(raw)) return '';   // charset guard
    if (!map || typeof map !== 'object') return '';
    if (!Object.prototype.hasOwnProperty.call(map, raw)) return '';             // blocks __proto__/constructor/prototype
    var e = map[raw];
    var t = e && e[lang];
    return (typeof t === 'string' && t) ? t : '';   // missing es on an es page → '' (never echo the en title)
  }

  // DOM mount. Builds NOTHING on a miss (JS-off inert and miss-inert are one path).
  // opts = { map, mountEl, position:'prepend'|'before', className,
  //          leadEn, tailEn, leadES, tailES }
  function mount(opts) {
    if (typeof document === 'undefined' || !opts || !opts.mountEl || !opts.map) return;
    var lang = (document.documentElement.lang || 'en').slice(0, 2) === 'es' ? 'es' : 'en';
    var raw;
    try { raw = new URLSearchParams(location.search).get('from'); } catch (_) { return; }
    var title = titleFor(raw, opts.map, lang);
    if (!title) return;                              // silent no-op on any miss

    var p = document.createElement('p');
    if (opts.className) p.className = opts.className;
    var lead = document.createElement('span');
    lead.textContent = (lang === 'es' ? opts.leadES : opts.leadEn) + ' ';
    var strong = document.createElement('strong');
    strong.textContent = title;                      // the ONLY untrusted-keyed value — via textContent
    var tail = document.createElement('span');
    tail.textContent = ' ' + (lang === 'es' ? opts.tailES : opts.tailEn);
    p.appendChild(lead); p.appendChild(strong); p.appendChild(tail);

    if (opts.position === 'before' && opts.mountEl.parentNode) {
      opts.mountEl.parentNode.insertBefore(p, opts.mountEl);
    } else {
      opts.mountEl.insertBefore(p, opts.mountEl.firstChild);
    }
    return p;
  }

  var api = { titleFor: titleFor, mount: mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinFromContinuity = api;
  if (root) root.MuntinFromContinuity = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
