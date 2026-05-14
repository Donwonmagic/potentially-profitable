/**
 * Shared number formatter for the Muntin Digital toolkit.
 *
 * Companion to parse-number.js — twelve+ tools currently render
 * currency, percentages, and compact counts inline, each with its
 * own rounding rules, locale assumptions, and edge-case handling.
 * The result: a price renders as "$1,234.50" in one tool and
 * "$1234.5" in another. This module is the single source of truth
 * for OUTPUT formatting, just as parse-number is for INPUT parsing.
 *
 * All functions accept `null`/`undefined`/`NaN` safely and return
 * a sensible empty-state string (default '—', overridable per call).
 *
 * Locale behaviour: 'en'/'es' switch the thousand+decimal markers
 * via Intl.NumberFormat. Defaults to 'en' to match historical output.
 *
 * Pure functions; safe to import in Node tests.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof self !== 'undefined') {
    self.MuntinFormat = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var EMPTY = '—'; // em-dash

  function localeCode(locale) {
    return locale === 'es' ? 'es-MX' : 'en-US';
  }

  function isNum(n) {
    return typeof n === 'number' && isFinite(n);
  }

  // Currency. Defaults to USD; pass currency:'EUR' etc. for other tools.
  function currency(value, options) {
    options = options || {};
    if (!isNum(value)) return options.empty || EMPTY;
    var locale = localeCode(options.locale);
    var ccy = options.currency || 'USD';
    var fractionDigits = options.fractionDigits == null ? 2 : options.fractionDigits;
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: ccy,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
      }).format(value);
    } catch (_) {
      // Fallback: prefix $ + fixed digits if Intl rejects the currency code.
      return '$' + value.toFixed(fractionDigits);
    }
  }

  // Plain number with locale-aware separators. Pass `digits` for fixed
  // decimals; otherwise renders integers as integers and decimals up to 2.
  function number(value, options) {
    options = options || {};
    if (!isNum(value)) return options.empty || EMPTY;
    var locale = localeCode(options.locale);
    var fmtOpts = { useGrouping: options.grouping !== false };
    if (options.digits != null) {
      fmtOpts.minimumFractionDigits = options.digits;
      fmtOpts.maximumFractionDigits = options.digits;
    } else {
      fmtOpts.maximumFractionDigits = 2;
    }
    return new Intl.NumberFormat(locale, fmtOpts).format(value);
  }

  // Percentage. By convention the input is a RATIO (0.32 -> "32%").
  // Pass already-percent values with `asRatio:false` (32 -> "32%").
  function percent(value, options) {
    options = options || {};
    if (!isNum(value)) return options.empty || EMPTY;
    var ratio = options.asRatio === false ? value / 100 : value;
    var locale = localeCode(options.locale);
    var digits = options.digits == null ? 0 : options.digits;
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(ratio);
  }

  // Compact number for sparkline labels: 1.2k, 4.7M.
  function compact(value, options) {
    options = options || {};
    if (!isNum(value)) return options.empty || EMPTY;
    var locale = localeCode(options.locale);
    try {
      return new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(value);
    } catch (_) {
      // Older Safari may not support compact notation.
      if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(1) + 'M';
      if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(1) + 'k';
      return String(Math.round(value));
    }
  }

  // Signed delta — "+12.3%" / "-4.0%". Useful for drift cards.
  function signedPercent(value, options) {
    options = options || {};
    if (!isNum(value)) return options.empty || EMPTY;
    var body = percent(Math.abs(value), options);
    if (value > 0) return '+' + body;
    if (value < 0) return '−' + body; // proper minus sign
    return body;
  }

  function signedCurrency(value, options) {
    options = options || {};
    if (!isNum(value)) return options.empty || EMPTY;
    var body = currency(Math.abs(value), options);
    if (value > 0) return '+' + body;
    if (value < 0) return '−' + body;
    return body;
  }

  return {
    currency: currency,
    number: number,
    percent: percent,
    compact: compact,
    signedPercent: signedPercent,
    signedCurrency: signedCurrency
  };
}));
