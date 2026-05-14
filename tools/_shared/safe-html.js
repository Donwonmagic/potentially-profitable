/**
 * Shared HTML-safety primitives for the Muntin Digital toolkit.
 *
 * The 21 tools in this suite render most of their dynamic output via
 * `el.innerHTML = stringConcat(...)`. When any one of those concatenations
 * throws — a null lookup, a missing module, an unescaped angle-bracket —
 * the rest of the page either goes blank or leaks raw markup into the
 * DOM. That's the "bare code halfway down the page" complaint.
 *
 * This module is the foundation for Phase 1's UI primitives. It does
 * three jobs:
 *
 *   1. `escapeHtml(s)` — the single escape function. Twelve+ tools
 *      currently inline their own `escHtml` / `escHTML` / `escape`.
 *      Consolidate, audit once, fix once.
 *
 *   2. `h` — a tagged-template that builds an HTML string with every
 *      interpolated value escaped by default. Opt out per-slot by
 *      passing `safeHtml(rawString)` for trusted markup.
 *
 *      Example:
 *        const card = h`<p class="cp-drift-cat">${label}</p>
 *                       <span class="cp-drift-delta">${delta}%</span>`;
 *
 *   3. `setHTML(el, htmlString)` — assigns innerHTML with a try/catch
 *      that renders a fallback error card on failure instead of leaving
 *      the section empty. Errors are surfaced as `aria-live="polite"`
 *      alerts; tools opt in by passing an `onError` callback.
 *
 * No dependencies. UMD-wrapped to match the rest of `_shared/`.
 * Pure functions; safe to import in Node tests.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof self !== 'undefined') {
    self.MuntinSafeHtml = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var AMP_RE  = /&/g;
  var LT_RE   = /</g;
  var GT_RE   = />/g;
  var QUOT_RE = /"/g;
  var APOS_RE = /'/g;

  function escapeHtml(input) {
    if (input == null) return '';
    return String(input)
      .replace(AMP_RE, '&amp;')
      .replace(LT_RE, '&lt;')
      .replace(GT_RE, '&gt;')
      .replace(QUOT_RE, '&quot;')
      .replace(APOS_RE, '&#39;');
  }

  // Brand a string as already-safe HTML so the tagged template skips
  // escaping for that slot. Callers should only wrap markup they
  // themselves built (e.g. nested h`` results) or static template
  // fragments — never user input.
  function safeHtml(markup) {
    return { __safeHtml: true, markup: String(markup == null ? '' : markup) };
  }

  function isSafe(v) {
    return v && typeof v === 'object' && v.__safeHtml === true;
  }

  // Tagged template. Every interpolation is escaped unless wrapped in
  // safeHtml(). Arrays are joined; nested safeHtml results pass through.
  function h(strings, var_args) {
    var out = strings[0];
    for (var i = 1; i < arguments.length; i++) {
      var v = arguments[i];
      if (Array.isArray(v)) {
        var parts = '';
        for (var j = 0; j < v.length; j++) {
          parts += isSafe(v[j]) ? v[j].markup : escapeHtml(v[j]);
        }
        out += parts;
      } else if (isSafe(v)) {
        out += v.markup;
      } else {
        out += escapeHtml(v);
      }
      out += strings[i];
    }
    return safeHtml(out);
  }

  // Assign innerHTML with a try/catch and an optional onError fallback.
  // Use this anywhere a render throw would leave the page half-blank.
  // Accepts either a safeHtml() result or a plain string (treated as
  // already-safe — callers opting in to legacy behavior).
  function setHTML(el, content, options) {
    options = options || {};
    if (!el) return false;
    var markup = isSafe(content) ? content.markup : String(content == null ? '' : content);
    try {
      el.innerHTML = markup;
      return true;
    } catch (err) {
      if (typeof options.onError === 'function') {
        try { options.onError(err); } catch (_) {}
      } else if (options.fallbackMessage) {
        try {
          el.textContent = options.fallbackMessage;
        } catch (_) {}
      }
      return false;
    }
  }

  // Build an alert/error card as a detached element. Phase 1's
  // error-card.js will replace this with the formal component; this
  // shim covers Phase 0 callsites.
  function errorCard(message, options) {
    options = options || {};
    var card = document.createElement('div');
    card.className = options.className || 'cp-card';
    card.setAttribute('role', 'alert');
    var strong = document.createElement('strong');
    strong.textContent = options.title || '';
    var p = document.createElement('p');
    if (options.title) {
      p.appendChild(strong);
      p.appendChild(document.createTextNode(' '));
    }
    p.appendChild(document.createTextNode(message == null ? '' : String(message)));
    card.appendChild(p);
    return card;
  }

  return {
    escapeHtml: escapeHtml,
    safeHtml: safeHtml,
    h: h,
    setHTML: setHTML,
    errorCard: errorCard
  };
}));
