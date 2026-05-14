/**
 * Shared color-swatch primitive for the Muntin Digital toolkit.
 *
 * Brand Suite, Photo Brief, Storefront Health, and (eventually) the
 * Menu Design preview each render a "color chip" — a small square of
 * a brand color with hex, copy-to-clipboard, and contrast against a
 * paired surface. Today each tool draws its own with slightly different
 * sizes, hex casing, and copy affordances. This module centralizes.
 *
 * API:
 *   const node = MuntinSwatch.create({
 *     hex: '#3A7D7B',
 *     label: 'Brand teal',
 *     pairedAgainst: '#FAF7F2',  // surface to test contrast against
 *     size: 'md',                // sm | md | lg
 *     onCopy: (hex) => toast.show('Copied ' + hex),
 *   });
 *   container.appendChild(node);
 *
 * Also exposed: `relativeLuminance(hex)`, `contrastRatio(hex1, hex2)`,
 * `wcagLevel(ratio, fontSize)` so other tools can compute contrast
 * without rendering a swatch.
 *
 * Pure functions where possible; create() returns a detached DOM node.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof self !== 'undefined') {
    self.MuntinSwatch = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function hexToRgb(hex) {
    if (!hex) return null;
    var s = String(hex).trim().replace(/^#/, '');
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
    return [
      parseInt(s.slice(0, 2), 16),
      parseInt(s.slice(2, 4), 16),
      parseInt(s.slice(4, 6), 16)
    ];
  }

  function channelLuminance(c) {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function relativeLuminance(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) return null;
    return 0.2126 * channelLuminance(rgb[0]) +
           0.7152 * channelLuminance(rgb[1]) +
           0.0722 * channelLuminance(rgb[2]);
  }

  function contrastRatio(hex1, hex2) {
    var l1 = relativeLuminance(hex1);
    var l2 = relativeLuminance(hex2);
    if (l1 == null || l2 == null) return null;
    var lighter = Math.max(l1, l2);
    var darker  = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // WCAG 2.1 thresholds. fontSize in px (CSS pixels); >= 18 is "large".
  function wcagLevel(ratio, fontSize) {
    if (ratio == null) return 'unknown';
    var large = (fontSize || 16) >= 18;
    if (large) {
      if (ratio >= 4.5) return 'AAA';
      if (ratio >= 3.0) return 'AA';
    } else {
      if (ratio >= 7.0) return 'AAA';
      if (ratio >= 4.5) return 'AA';
    }
    return 'fail';
  }

  function normalizeHex(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return '#' + rgb.map(function (c) {
      var h = c.toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('').toUpperCase();
  }

  var SIZE_PX = { sm: 28, md: 44, lg: 64 };

  // create({ hex, label, pairedAgainst, size, onCopy, locale })
  // Returns a detached <div class="mtn-swatch"> with chip + label + hex.
  // Tools own the surrounding layout.
  function create(spec) {
    spec = spec || {};
    var hex = normalizeHex(spec.hex || '#000000');
    var size = SIZE_PX[spec.size] || SIZE_PX.md;
    var locale = spec.locale === 'es' ? 'es' : 'en';

    var wrap = document.createElement('div');
    wrap.className = 'mtn-swatch mtn-swatch--' + (spec.size || 'md');
    wrap.style.display = 'inline-flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = 'flex-start';
    wrap.style.gap = '6px';

    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'mtn-swatch-chip';
    chip.style.width = size + 'px';
    chip.style.height = size + 'px';
    chip.style.background = hex;
    chip.style.border = '1px solid rgba(0,0,0,.08)';
    chip.style.borderRadius = '6px';
    chip.style.cursor = 'pointer';
    chip.style.padding = '0';
    chip.setAttribute('aria-label',
      (locale === 'es' ? 'Copiar ' : 'Copy ') + hex);

    var hexEl = document.createElement('span');
    hexEl.className = 'mtn-swatch-hex';
    hexEl.style.font = '500 11px/1 ui-monospace,Menlo,Consolas,monospace';
    hexEl.style.letterSpacing = '.02em';
    hexEl.textContent = hex;

    if (spec.label) {
      var labelEl = document.createElement('span');
      labelEl.className = 'mtn-swatch-label';
      labelEl.style.font = '600 12px/1.3 system-ui,sans-serif';
      labelEl.textContent = spec.label;
      wrap.appendChild(chip);
      wrap.appendChild(labelEl);
      wrap.appendChild(hexEl);
    } else {
      wrap.appendChild(chip);
      wrap.appendChild(hexEl);
    }

    if (spec.pairedAgainst) {
      var ratio = contrastRatio(hex, spec.pairedAgainst);
      var level = wcagLevel(ratio);
      var contrastEl = document.createElement('span');
      contrastEl.className = 'mtn-swatch-contrast';
      contrastEl.style.font = '500 11px/1 system-ui,sans-serif';
      contrastEl.style.color = level === 'fail' ? '#a53b3b' : '#2a6b3d';
      contrastEl.textContent =
        (ratio ? ratio.toFixed(2) + ':1' : '—') + ' · ' + level;
      wrap.appendChild(contrastEl);
    }

    chip.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(hex).then(function () {
          if (typeof spec.onCopy === 'function') spec.onCopy(hex);
        }).catch(function () {
          // Clipboard may be blocked (file://, http://); silently degrade.
          if (typeof spec.onCopy === 'function') spec.onCopy(hex);
        });
      } else if (typeof spec.onCopy === 'function') {
        spec.onCopy(hex);
      }
    });

    return wrap;
  }

  return {
    create: create,
    relativeLuminance: relativeLuminance,
    contrastRatio: contrastRatio,
    wcagLevel: wcagLevel,
    normalizeHex: normalizeHex,
    _hexToRgb: hexToRgb
  };
}));
