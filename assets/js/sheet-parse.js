/*
 * Operator Sheets — generous number parser (Phase B4).
 *
 * Real operators type "$45.50/lb", "1,200", "12hundred", "62.5%".
 * type="number" silently rejects all of these. This module accepts
 * type="text" inputmode="decimal" fields with data-parse="money|qty|pct"
 * and parses on blur, with a visible mirror echo so the operator
 * always sees what was understood.
 *
 *   Voice canon:
 *   IN:  "I read this as $45.50. Tap to keep your text instead."
 *   OUT: silent normalization with no echo.
 *
 * Usage in fragments:
 *   <input type="text" inputmode="decimal" data-parse="money" name="…">
 *   <input type="text" inputmode="decimal" data-parse="qty"   name="…">
 *   <input type="text" inputmode="decimal" data-parse="pct"   name="…">
 *
 * Public API:
 *   window.SheetParse.parse(rawText, kind)  → { value, display, raw, ok }
 *   window.SheetParse.attach(form)          → wire data-parse fields
 *   window.SheetParse.format(value, kind)   → canonical display string
 *
 * Defensive rules:
 *   - Empty / whitespace-only → null value, ok:true (operators clear fields).
 *   - If parsing succeeds AND the canonical form differs from raw,
 *     show a one-line mirror "I read this as ___. Tap to keep your
 *     text instead." that lets the operator restore the raw text.
 *   - If parsing fails, leave the raw text intact and show a
 *     muted help line ("Could not read a number. Tap to clear.").
 *   - Never silently overwrite. The operator always gets the last word.
 */
(function () {
  'use strict';

  if (window.SheetParse) return;

  var COPY = {
    en: {
      mirror: 'I read this as ',
      mirrorTail: '. Tap to keep your text instead.',
      failed: 'Could not read a number from this. Tap to clear.',
    },
    es: {
      mirror: 'Lo leí como ',
      mirrorTail: '. Toca para mantener tu texto.',
      failed: 'No pude leer un número aquí. Toca para limpiar.',
    },
  };

  function locale() {
    var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    return lang.indexOf('es') === 0 ? 'es' : 'en';
  }

  // The word-form ladder. Restricted to the patterns operators
  // actually type — no full English-number parser, just the common
  // shorthand.
  var WORD_FORMS = {
    'hundred':  100,
    'thousand': 1000,
    'k':        1000,    // "5k"
    'million':  1000000,
    'm':        1000000, // "1.2m"
  };

  function parseNumberFromText(s) {
    if (s == null) return null;
    var raw = String(s).trim();
    if (!raw) return null;

    // Strip currency, percent, common per-unit suffixes, whitespace.
    // Preserve sign and decimal mark.
    var cleaned = raw
      .replace(/[ \s]+/g, ' ')                 // unify whitespace
      .replace(/^[\$€£¥]/, '')                      // leading currency
      .replace(/[\$€£¥]/g, '')                      // any other currency
      .replace(/%/g, '')                            // percent sign (handled by kind)
      .replace(/[,_]/g, '')                         // grouping separators
      .replace(/\/[a-zA-Z]+(\.|$)/g, '$1')          // /lb, /unit, /case, /ea
      .replace(/\s*(per|each|ea\.?)\s*\w+/gi, '')   // "per lb", "each case"
      .trim();

    // Word-shorthand: "5k", "1.2m", "12hundred", "5 thousand".
    // Two patterns: digits-stuck-to-word, or digits-space-word.
    var wordRe = /^(-?\d*\.?\d+)\s*(hundred|thousand|million|k|m)\b/i;
    var wm = cleaned.match(wordRe);
    if (wm) {
      var base = parseFloat(wm[1]);
      var mult = WORD_FORMS[wm[2].toLowerCase()];
      if (isFinite(base) && mult) return base * mult;
    }

    // Plain numeric (after stripping). Accept negative, decimal,
    // optional trailing junk we already removed.
    var num = parseFloat(cleaned);
    if (isFinite(num)) return num;

    return null;
  }

  function format(value, kind) {
    if (value == null || !isFinite(value)) return '';
    if (kind === 'money') {
      var sign = value < 0 ? '-' : '';
      return sign + '$' + Math.abs(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    if (kind === 'pct') {
      // Round to 1 decimal place if not whole, else integer.
      return (Math.round(value * 10) / 10) + '%';
    }
    // qty / generic — keep up to 4 decimal places, drop trailing zeros.
    var s = (Math.round(value * 10000) / 10000).toString();
    return s;
  }

  function parse(rawText, kind) {
    var raw = (rawText == null ? '' : String(rawText)).trim();
    if (!raw) return { value: null, display: '', raw: '', ok: true };
    var value = parseNumberFromText(raw);
    if (value == null) {
      return { value: null, display: raw, raw: raw, ok: false };
    }
    var display = format(value, kind);
    return { value: value, display: display, raw: raw, ok: true };
  }

  // Mirror element key used to attach the echo line to a field.
  function mirrorEl(input) {
    var key = '__sheetParseMirror';
    if (input[key]) return input[key];
    var el = document.createElement('span');
    el.className = 'sheet-parse-mirror';
    el.style.cssText = 'display:block;margin:4px 0 0;font-size:12px;line-height:1.4;color:var(--stone,#6B6B6B);font-style:italic;';
    el.hidden = true;
    // Inject right after the input's parent label (if any) or after
    // the input itself.
    var label = input.closest('label');
    if (label && label.parentNode) {
      label.appendChild(el);
    } else if (input.parentNode) {
      input.parentNode.insertBefore(el, input.nextSibling);
    }
    input[key] = el;
    return el;
  }

  function showMirror(input, msg, opts) {
    var el = mirrorEl(input);
    el.textContent = '';
    var span = document.createElement('span');
    span.textContent = msg;
    el.appendChild(span);
    if (opts && opts.action) {
      el.appendChild(document.createTextNode(' '));
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opts.action.label;
      btn.style.cssText = 'background:transparent;border:0;padding:0;font:inherit;font-style:italic;color:var(--teal,#1F4E5B);text-decoration:underline;text-underline-offset:2px;cursor:pointer;';
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        opts.action.onClick();
      });
      el.appendChild(btn);
    }
    el.hidden = false;
  }

  function clearMirror(input) {
    var el = input.__sheetParseMirror;
    if (el) { el.hidden = true; el.textContent = ''; }
  }

  function attachField(input) {
    if (input.__sheetParseAttached) return;
    input.__sheetParseAttached = true;
    var kind = input.dataset.parse || 'qty';

    // Convert type=number on this field if anyone left it as number;
    // we want type=text + inputmode=decimal so we control the parser.
    if (input.type === 'number') input.type = 'text';
    if (!input.getAttribute('inputmode')) input.setAttribute('inputmode', 'decimal');

    input.addEventListener('blur', function () {
      var raw = input.value;
      var result = parse(raw, kind);
      var c = COPY[locale()];
      if (!result.raw) { clearMirror(input); return; }
      if (!result.ok) {
        showMirror(input, c.failed, {
          action: { label: '', onClick: function () { input.value = ''; clearMirror(input); input.dispatchEvent(new Event('input', { bubbles: true })); } },
        });
        return;
      }
      // ok: parsed cleanly. If the canonical form matches what the
      // operator typed (after trimming whitespace), no mirror needed.
      if (result.display === result.raw) { clearMirror(input); return; }
      // Canonical form differs — overwrite the visible text with the
      // canonical, but show the mirror so the operator can restore.
      var typedRaw = result.raw;
      input.value = result.display;
      showMirror(input, c.mirror + result.display + c.mirrorTail.replace('Tap', '').replace('Toca', ''), {
        action: { label: c.mirrorTail.indexOf('Tap') === 0 ? 'Tap to keep your text instead.' : 'Toca para mantener tu texto.', onClick: function () {
          input.value = typedRaw;
          clearMirror(input);
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } },
      });
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Re-typing clears the mirror so it doesn't follow stale state.
    input.addEventListener('input', function () { clearMirror(input); });
  }

  function attach(root) {
    var scope = root || document;
    var fields = scope.querySelectorAll('[data-parse]');
    for (var i = 0; i < fields.length; i++) attachField(fields[i]);
  }

  // Auto-attach on DOMContentLoaded for any data-parse fields already
  // in the DOM. Per-page logic can call attach() again after dynamic
  // additions if needed.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { attach(); });
  } else {
    attach();
  }

  window.SheetParse = {
    parse: parse,
    format: format,
    attach: attach,
  };
})();
