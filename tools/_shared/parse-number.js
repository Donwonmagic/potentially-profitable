/**
 * Shared loose number parser for the Muntin Digital toolkit.
 *
 * Restaurant owners paste numbers in many shapes:
 *   - US: "$1,234.50", "8.50", "30%"
 *   - EU/ES: "€1.234,50", "8,50", "30%"
 *   - UK: "£1,234.50"
 *   - Word-pasted: smart quotes ("8.50"), curly apostrophes
 *   - Spreadsheet artefacts: leading/trailing whitespace, NBSP, BOM
 *
 * The previous per-tool parsers (mmNum, meCoerceNumber, plate-cost
 * coercion) silently returned NaN on any of the above except the plain
 * US format. A real Argentinian or Spanish owner pasting "1.234,56"
 * got an empty palette / zero plate cost / wrong break-even with no
 * indication their input was misinterpreted.
 *
 * This module is the single source of truth. Every numeric input
 * across the toolkit routes through `parseLooseNumber`.
 *
 * Returns a discriminated record so callers can validate intent
 * without re-parsing:
 *   { value, hadCurrency, wasPercent, raw }
 *
 *   - value: number | null   (null = couldn't parse, caller decides
 *                             whether to default or surface an error)
 *   - hadCurrency: boolean   (input contained a currency symbol)
 *   - wasPercent: boolean    (input ended in % — value is the raw
 *                             percent, e.g. "30%" → 30; pass through
 *                             options.percentAsFraction to get 0.30)
 *   - raw: string            (the trimmed input as we saw it)
 *
 * Options:
 *   nonNegative: bool        (clamp negatives to 0; default false —
 *                             callers should validate intent rather
 *                             than silently clamping)
 *   percentAsFraction: bool  (if input ended in %, divide by 100;
 *                             default false)
 *   defaultLocale: 'us'|'eu' (when input is ambiguous like "1,234"
 *                             which could be US 1234 or EU 1.234.
 *                             Default 'us'; tools should set 'eu' when
 *                             rendering for ES locale)
 *
 * Pure function; safe to import in Node tests.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof self !== 'undefined') {
    self.MuntinParse = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Currency symbols we strip silently. Adding more is safe — none of
  // these characters can appear in a legitimate numeric token.
  var CURRENCY_RE = /[\$€£¥₱₩₹₺]/g;
  // Whitespace including NBSP (U+00A0), thin space (U+2009), narrow no-break (U+202F), BOM.
  var WHITESPACE_RE = /[\s   ﻿]/g;
  // Smart-quote variants. Word and Pages turn straight quotes into curly
  // ones — owners who copy-paste from documents need them stripped, not
  // treated as numeric tokens.
  var SMART_QUOTE_RE = /[‘’‚‛“”„‟'"]/g;

  function parseLooseNumber(input, options) {
    options = options || {};
    var defaultLocale = options.defaultLocale === 'eu' ? 'eu' : 'us';
    var raw = String(input == null ? '' : input);
    var trimmed = raw.replace(WHITESPACE_RE, '').replace(SMART_QUOTE_RE, '');
    if (!trimmed) return _result(null, false, false, raw);

    // Strip currency symbols. Track whether any were present so the
    // caller can validate (e.g. a price field with no currency might
    // still warrant a soft warning in some flows).
    var hadCurrency = CURRENCY_RE.test(trimmed);
    if (hadCurrency) trimmed = trimmed.replace(CURRENCY_RE, '');

    // Strip a trailing percent sign (and anything after — covers
    // "30 %", "30%off", though the latter is malformed). We allow
    // leading minus, then digits + separators + final percent.
    var wasPercent = false;
    var pctMatch = trimmed.match(/^([+\-]?[\d.,]+)\s*%/);
    if (pctMatch) {
      wasPercent = true;
      trimmed = pctMatch[1];
    }

    // Allow a leading sign.
    var sign = 1;
    if (trimmed.charAt(0) === '+') {
      trimmed = trimmed.slice(1);
    } else if (trimmed.charAt(0) === '-') {
      sign = -1;
      trimmed = trimmed.slice(1);
    }

    // Reject if anything other than digits, commas, dots remains.
    if (!/^[\d.,]+$/.test(trimmed)) return _result(null, hadCurrency, wasPercent, raw);

    // Disambiguate decimal vs thousands separator. The rules:
    //   - If both `.` and `,` appear, the LAST one is the decimal.
    //     Strip every other separator. ("1,234.56" → 1234.56;
    //     "1.234,56" → 1234.56)
    //   - If only one separator type appears:
    //       - More than one occurrence → it's a thousands separator
    //         ("1,234,567" → 1234567; "1.234.567" → 1234567).
    //       - Exactly one occurrence → ambiguous. If the digits AFTER
    //         the separator are exactly 3 AND defaultLocale is 'us',
    //         treat as thousands ("1,234" → 1234). Otherwise treat as
    //         decimal ("1,5" → 1.5; "8.50" → 8.50).
    var hasDot = trimmed.indexOf('.') !== -1;
    var hasComma = trimmed.indexOf(',') !== -1;
    var normalised = trimmed;
    if (hasDot && hasComma) {
      var lastDot = trimmed.lastIndexOf('.');
      var lastComma = trimmed.lastIndexOf(',');
      if (lastDot > lastComma) {
        // US-shaped: strip commas, keep dot.
        normalised = trimmed.replace(/,/g, '');
      } else {
        // EU-shaped: strip dots, swap comma to dot.
        normalised = trimmed.replace(/\./g, '').replace(',', '.');
      }
    } else if (hasComma && !hasDot) {
      var commaCount = (trimmed.match(/,/g) || []).length;
      if (commaCount > 1) {
        normalised = trimmed.replace(/,/g, '');
      } else {
        // Single comma — ambiguous.
        var afterComma = trimmed.split(',')[1] || '';
        if (defaultLocale === 'us' && afterComma.length === 3) {
          normalised = trimmed.replace(',', '');
        } else {
          normalised = trimmed.replace(',', '.');
        }
      }
    } else if (hasDot && !hasComma) {
      var dotCount = (trimmed.match(/\./g) || []).length;
      if (dotCount > 1) {
        // Multiple dots — must be thousands ("1.234.567").
        normalised = trimmed.replace(/\./g, '');
      }
      // Single dot — treat as decimal ("8.50"). No-op.
    }

    var parsed = parseFloat(normalised);
    if (!isFinite(parsed)) return _result(null, hadCurrency, wasPercent, raw);

    var value = sign * parsed;
    if (wasPercent && options.percentAsFraction) value = value / 100;
    if (options.nonNegative && value < 0) value = 0;

    return _result(value, hadCurrency, wasPercent, raw);
  }

  function _result(value, hadCurrency, wasPercent, raw) {
    return {
      value: value,
      hadCurrency: !!hadCurrency,
      wasPercent: !!wasPercent,
      raw: raw
    };
  }

  // Convenience: most callers just want the number. Use this when you
  // don't care about the discriminated record.
  function parseLooseNumberValue(input, options) {
    return parseLooseNumber(input, options).value;
  }

  return {
    parseLooseNumber: parseLooseNumber,
    parseLooseNumberValue: parseLooseNumberValue
  };
}));
