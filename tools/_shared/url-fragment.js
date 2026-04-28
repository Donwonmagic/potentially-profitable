/**
 * Shared URL-fragment encoder/decoder for the Muntin Digital toolkit.
 *
 * The cross-tool deep-link pattern is "encode user data into a URL
 * fragment, decode it on the destination tool." Currently each tool
 * has its own escape routine; some (Plate Cost) hard-encode the
 * reserved delimiters but raw `.split('|')` paths in Menu Engineering
 * + Photo Brief crash on a dish like "Fish & Chips | Pan-Seared".
 *
 * This module is the single source of truth.
 *
 * Reserved delimiters across the toolkit:
 *   |  row separator (palette colours, dish lists, ingredients)
 *   ;  field separator (within a row)
 *   ~  segment separator (deeper nesting)
 *   =  key/value separator (`#prefill=name~hex|...`)
 *   &  multi-fragment AND (`#stars=...&palette=...`)
 *   #  fragment delimiter itself
 *
 * Encoder maps each reserved char to a `~h<HEX>~` token. Decoder
 * reverses. Round-trips losslessly for any UTF-8 string.
 *
 * Plus a hex-colour normaliser (always uppercase, always `#`-prefixed,
 * always 6-char form) so palette fragments don't render inconsistent
 * casing across tools after a round-trip.
 *
 * Pure functions; safe to import in Node tests.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof self !== 'undefined') {
    self.MuntinFragment = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // The full set of reserved delimiters used anywhere in the toolkit.
  // Adding a new one here breaks the round-trip test in T6 by design —
  // it forces a deliberate decision about where it's used.
  var RESERVED = ['|', ';', '~', '=', '&', '#'];

  function encodeRowField(s) {
    var input = String(s == null ? '' : s);
    // Encode our escape token first, otherwise it would conflict.
    // Pattern: `~h<HEX>~`. We use a literal `~h` prefix because tilde
    // is itself reserved — encoding tilde as `~h7E~` works because the
    // sequence `~h` is itself encoded (a literal `~h` in user input
    // becomes `~h7E~h`).
    var out = '';
    for (var i = 0; i < input.length; i++) {
      var ch = input.charAt(i);
      if (RESERVED.indexOf(ch) !== -1) {
        out += '~h' + ch.charCodeAt(0).toString(16).toUpperCase() + '~';
      } else {
        out += ch;
      }
    }
    return out;
  }

  function decodeRowField(s) {
    var input = String(s == null ? '' : s);
    return input.replace(/~h([0-9A-Fa-f]{1,4})~/g, function (_, hex) {
      return String.fromCharCode(parseInt(hex, 16));
    });
  }

  // Hex-colour normaliser. Always uppercase, always #-prefixed, always
  // 6-char form (3-char shorthand expanded). Returns null for invalid
  // hex so callers can validate intent (e.g. surface "1 colour from
  // the shared link couldn't be parsed").
  function normaliseHex(s) {
    var input = String(s == null ? '' : s).trim();
    var stripped = input.charAt(0) === '#' ? input.slice(1) : input;
    if (!/^[0-9A-Fa-f]+$/.test(stripped)) return null;
    if (stripped.length === 3) {
      // Expand #abc to #aabbcc.
      stripped = stripped.charAt(0) + stripped.charAt(0) +
                 stripped.charAt(1) + stripped.charAt(1) +
                 stripped.charAt(2) + stripped.charAt(2);
    } else if (stripped.length === 8) {
      // Drop the alpha channel — palette fragments don't carry alpha.
      stripped = stripped.slice(0, 6);
    } else if (stripped.length !== 6) {
      return null;
    }
    return '#' + stripped.toUpperCase();
  }

  // Convenience: encode an array of strings as a row using `;` as the
  // internal field separator. The fields are individually escaped, so
  // a literal `;` inside a field becomes `~h3B~` and survives the
  // round-trip.
  function encodeRow(fields, sep) {
    var s = sep || ';';
    return fields.map(encodeRowField).join(s);
  }

  function decodeRow(s, sep) {
    var sepCh = sep || ';';
    return String(s == null ? '' : s).split(sepCh).map(decodeRowField);
  }

  return {
    RESERVED: RESERVED,
    encodeRowField: encodeRowField,
    decodeRowField: decodeRowField,
    encodeRow: encodeRow,
    decodeRow: decodeRow,
    normaliseHex: normaliseHex
  };
}));
