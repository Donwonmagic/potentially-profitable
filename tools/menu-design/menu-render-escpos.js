/**
 * Menu Design Suite — ESC/POS thermal-printer emitter (Wave C1 finish).
 *
 * Produces a raw-bytes .bin file the operator pipes to a thermal
 * receipt printer (Epson TM series, Star TSP, etc.) for the most
 * common operator artifact you can't get out of Canva: a printed
 * "today's specials" or "delivery only" receipt that lives at the
 * pickup window or stamps onto the bottom of every kitchen slip.
 *
 * Format reference: ESC/POS command set (Epson docs).
 * Target hardware: 80 mm paper at 203 dpi → 576 dots wide → 48
 * characters at the printer's default font A. Falls back gracefully
 * on 58 mm printers (32 chars wide) — long lines wrap.
 *
 * Privacy + brand: pure browser-side, no fetches, no external
 * scripts. Output is a Blob the caller wraps in a download <a>.
 *
 * What gets printed:
 *   - Header: business name (double-height, centered) + tagline (italic)
 *   - For each section: small-caps section header + rule
 *   - For each dish: name + price (right-aligned), description (small)
 *   - Footer: allergen prompt + URL/QR placeholder line
 *   - Partial cut command at the end
 *
 * What does NOT get printed:
 *   - Logo (graphics raster commands vary per vendor; out of scope)
 *   - Photos (kitchen receipts don't carry photos)
 *   - Allergen glyph icons (resolve to allergen-code letters only)
 *   - Multi-language formatting (UTF-8 → CP437/CP1252 via best-effort)
 *
 * Exports:
 *   exportEscpos({ rows, theme, meta, title, locale, paperWidth })
 *     → { blob, filename, byteCount }
 *
 * Loaded as a global MD_ESCPOS in the browser; re-exported via
 * tools/_shared/menu-renderers/escpos.js for sister-tool access.
 */
(function (root) {
  'use strict';

  // ---- ESC/POS byte primitives ----
  var ESC = 0x1B;
  var GS  = 0x1D;
  // Codes:
  var INIT          = [ESC, 0x40];                   // initialize
  var ALIGN_LEFT    = [ESC, 0x61, 0x00];
  var ALIGN_CENTER  = [ESC, 0x61, 0x01];
  var ALIGN_RIGHT   = [ESC, 0x61, 0x02];
  var TEXT_NORMAL   = [GS,  0x21, 0x00];             // 1× width 1× height
  var TEXT_DOUBLE_H = [GS,  0x21, 0x01];             // 1× width 2× height
  var TEXT_DOUBLE_W = [GS,  0x21, 0x10];             // 2× width 1× height
  var TEXT_DOUBLE   = [GS,  0x21, 0x11];             // 2× width 2× height (header)
  var BOLD_ON       = [ESC, 0x45, 0x01];
  var BOLD_OFF      = [ESC, 0x45, 0x00];
  var UNDERLINE_ON  = [ESC, 0x2D, 0x01];
  var UNDERLINE_OFF = [ESC, 0x2D, 0x00];
  var FEED          = [0x0A];                        // newline + line feed
  var FEED_N        = function (n) { return [ESC, 0x64, n & 0xFF]; };
  var CUT_PARTIAL   = [GS, 0x56, 0x42, 0x00];        // partial cut, 0 lines feed
  var CUT_FULL      = [GS, 0x56, 0x41, 0x00];

  // CP437 / Latin-1 best-effort downgrade. Restaurant menus often
  // carry accented characters (café, jalapeño, tonnarelli) that the
  // printer's default code page doesn't include. We strip diacritics
  // rather than emit garbled bytes.
  function asciiSafe(s) {
    if (!s) return '';
    // Compose first, then strip combining marks. Catches NFC + NFD inputs.
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
      // Common typographic chars → ASCII equivalents.
      .replace(/[‘’‚‛]/g, "'")
      .replace(/[“”„‟]/g, '"')
      .replace(/[–—]/g, '-')
      .replace(/…/g, '...')
      .replace(/[ ]/g, ' ')
      .replace(/[•]/g, '*')
      // Anything still non-ASCII → '?'. Kitchen prints don't need
      // to be elegant; they need to be readable.
      .replace(/[^\x20-\x7E\n]/g, '?');
  }

  // Encode a JS string as a Uint8Array of CP437-compatible bytes.
  function encStr(s) {
    var ascii = asciiSafe(s);
    var bytes = new Uint8Array(ascii.length);
    for (var i = 0; i < ascii.length; i++) bytes[i] = ascii.charCodeAt(i) & 0xFF;
    return bytes;
  }

  // Concatenate command arrays and Uint8Arrays into one Uint8Array.
  function concatBytes(parts) {
    var total = 0;
    for (var i = 0; i < parts.length; i++) {
      total += parts[i] instanceof Uint8Array ? parts[i].length : parts[i].length;
    }
    var out = new Uint8Array(total);
    var offset = 0;
    for (var j = 0; j < parts.length; j++) {
      var p = parts[j];
      if (p instanceof Uint8Array) {
        out.set(p, offset);
        offset += p.length;
      } else {
        for (var k = 0; k < p.length; k++) out[offset + k] = p[k];
        offset += p.length;
      }
    }
    return out;
  }

  // Pad a name + price line so the price right-aligns at column N.
  // Wraps long names to a new indented line so the price column
  // stays clean. Default 48 chars (80 mm, font A); 32-col fallback
  // for 58 mm printers via opts.paperWidth = 58.
  function nameAndPriceLine(name, price, cols) {
    cols = cols || 48;
    var safeName  = asciiSafe(name).trim();
    var safePrice = asciiSafe(price).trim();
    if (!safeName) return '';
    if (!safePrice) return safeName + '\n';
    // Reserve at least 1 space + price width for the right edge.
    var maxName = cols - safePrice.length - 1;
    if (safeName.length <= maxName) {
      var pad = cols - safeName.length - safePrice.length;
      return safeName + new Array(Math.max(1, pad) + 1).join(' ') + safePrice + '\n';
    }
    // Wrap: emit name on its own line, then a right-aligned price line.
    var nameWrapped = wrapText(safeName, cols);
    var pricePad = cols - safePrice.length;
    return nameWrapped + '\n' + new Array(Math.max(0, pricePad) + 1).join(' ') + safePrice + '\n';
  }

  function wrapText(s, cols) {
    cols = cols || 48;
    var safe = asciiSafe(s);
    if (safe.length <= cols) return safe;
    var out = [];
    var words = safe.split(/\s+/);
    var line = '';
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!line.length) {
        line = w;
      } else if (line.length + 1 + w.length <= cols) {
        line += ' ' + w;
      } else {
        out.push(line);
        line = w;
      }
    }
    if (line.length) out.push(line);
    return out.join('\n');
  }

  function repeatChar(ch, n) {
    return new Array(Math.max(0, n) + 1).join(ch);
  }

  // ---- main: build the byte stream ----
  function buildEscpos(opts) {
    opts = opts || {};
    var rows  = opts.rows  || [];
    var meta  = opts.meta  || {};
    var theme = opts.theme || {};
    var title = (opts.title || meta.businessName || 'Menu').trim();
    var paperWidth = opts.paperWidth === 58 ? 58 : 80;
    var cols = paperWidth === 58 ? 32 : 48;

    var parts = [];

    // Init.
    parts.push(INIT);

    // Header — business name in double-size, centered.
    if (title) {
      parts.push(ALIGN_CENTER);
      parts.push(TEXT_DOUBLE);
      parts.push(BOLD_ON);
      parts.push(encStr(asciiSafe(title)));
      parts.push(FEED);
      parts.push(BOLD_OFF);
      parts.push(TEXT_NORMAL);
    }
    if (meta.tagline) {
      parts.push(ALIGN_CENTER);
      parts.push(encStr(asciiSafe(meta.tagline)));
      parts.push(FEED);
    }
    parts.push(ALIGN_LEFT);
    parts.push(encStr(repeatChar('-', cols)));
    parts.push(FEED);

    // Body — sections + dishes.
    for (var ri = 0; ri < rows.length; ri++) {
      var r = rows[ri] || {};
      if (r.kind === 'section' && (r.name || '').trim()) {
        parts.push(FEED);
        parts.push(BOLD_ON);
        parts.push(UNDERLINE_ON);
        parts.push(encStr(asciiSafe((r.name || '').toUpperCase())));
        parts.push(FEED);
        parts.push(UNDERLINE_OFF);
        parts.push(BOLD_OFF);
      } else if (r.kind === 'dish' && (r.name || '').trim()) {
        parts.push(BOLD_ON);
        parts.push(encStr(nameAndPriceLine(r.name, r.price || '', cols)));
        parts.push(BOLD_OFF);
        if ((r.desc || '').trim()) {
          // Description: indented 2 spaces, wrapped at cols-2.
          var wrapped = wrapText(r.desc, cols - 2);
          var indented = wrapped.split('\n').map(function (l) { return '  ' + l; }).join('\n');
          parts.push(encStr(indented + '\n'));
        }
        // Allergens: simple comma-list of codes (no glyph).
        if (Array.isArray(r.allergens) && r.allergens.length) {
          parts.push(encStr('  allergens: ' + r.allergens.join(', ') + '\n'));
        }
      }
    }

    // Footer.
    parts.push(FEED);
    parts.push(encStr(repeatChar('-', cols)));
    parts.push(FEED);
    parts.push(ALIGN_CENTER);
    parts.push(encStr(asciiSafe(
      meta.askYourServer ||
      (opts.locale === 'es'
        ? 'Pregunta al servidor por alergenos'
        : 'Ask your server about allergens')
    )));
    parts.push(FEED);
    parts.push(FEED_N(3));

    // Cut.
    parts.push(CUT_PARTIAL);

    return concatBytes(parts);
  }

  // ---- exportEscpos: build a Blob for download ----
  function exportEscpos(opts) {
    opts = opts || {};
    var bytes = buildEscpos(opts);
    var blob;
    if (typeof Blob !== 'undefined') {
      blob = new Blob([bytes], { type: 'application/octet-stream' });
    } else {
      blob = bytes;
    }
    var safe = asciiSafe((opts.title || (opts.meta && opts.meta.businessName) || 'menu')).toLowerCase();
    safe = safe.replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!safe) safe = 'menu';
    var filename = safe + '-thermal.bin';
    return { blob: blob, filename: filename, byteCount: bytes.length };
  }

  var api = {
    exportEscpos: exportEscpos,
    buildEscpos:  buildEscpos,
    // Internal helpers exported for tests.
    _asciiSafe:   asciiSafe,
    _wrapText:    wrapText,
    _nameAndPriceLine: nameAndPriceLine
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_ESCPOS = api;
})(typeof window !== 'undefined' ? window : null);
