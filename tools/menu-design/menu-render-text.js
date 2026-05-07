/**
 * Menu Design Suite — Plain-text + SSML + Markdown emitters (W10-2).
 *
 * The menu's accessible / screen-reader-friendly artifacts. None of
 * these require jsPDF; all run synchronously in the browser. Each
 * emitter accepts the same opts shape as the PDF / HTML emitters
 * ({ rows, theme, title, locale, tagline, story, logoDataUrl })
 * but only consumes the fields it needs.
 *
 * Privacy posture: no fetches, no external scripts, runs entirely
 * in-memory and produces a Blob the caller can <a download> as a
 * .md / .ssml / .txt file.
 *
 * Why this matters: the print PDF is not tagged for screen readers
 * (jsPDF can't emit StructTreeRoot in-browser without a 2-3MB WASM
 * toolchain). Operators who need a screen-reader-friendly menu —
 * for blog posts, accessibility statements, voice-assistant pipelines,
 * or assistive-tech distribution — pull from this module instead.
 */
(function (root) {
  'use strict';

  // Shared allergen catalog mirror — keep in sync with the editor
  // and the other emitters. Keys are the codes; values are EN/ES.
  // Wave B2 — extended to cover EU FIC 14 + UK PPDS regimes (peanuts,
  // mustard, celery, lupin, molluscs, sulphites). Original 11 entries
  // preserved verbatim for back-compat with already-shipped menus.
  var TXT_ALLERGENS = {
    V:  { en: 'Vegan',              es: 'Vegano' },
    VG: { en: 'Vegetarian',         es: 'Vegetariano' },
    GF: { en: 'Gluten-free',        es: 'Sin gluten' },
    DF: { en: 'Dairy-free',         es: 'Sin lácteos' },
    N:  { en: 'Tree nuts',          es: 'Frutos secos' },
    E:  { en: 'Contains eggs',      es: 'Huevos' },
    SO: { en: 'Contains soy',       es: 'Soya' },
    SF: { en: 'Shellfish',          es: 'Mariscos' },
    FI: { en: 'Contains fish',      es: 'Pescado' },
    SE: { en: 'Sesame',             es: 'Sésamo' },
    LO: { en: 'Locally sourced',    es: 'Origen local' },
    PE: { en: 'Peanuts',            es: 'Cacahuetes' },
    MU: { en: 'Mustard',            es: 'Mostaza' },
    CE: { en: 'Celery',             es: 'Apio' },
    LU: { en: 'Lupin',              es: 'Altramuz' },
    MO: { en: 'Molluscs',           es: 'Moluscos' },
    SU: { en: 'Sulphites ≥10ppm', es: 'Sulfitos ≥10ppm' }
  };
  function allergenLabel(code, locale) {
    var a = TXT_ALLERGENS[code]; if (!a) return code;
    return locale === 'es' ? a.es : a.en;
  }
  function allergenList(codes, locale) {
    if (!Array.isArray(codes) || !codes.length) return '';
    return codes.map(function (c) { return allergenLabel(c, locale); }).filter(Boolean).join(', ');
  }
  function spiceWord(level, locale) {
    if (!level || level < 1) return '';
    if (locale === 'es') {
      if (level === 1) return 'picante suave';
      if (level === 2) return 'picante medio';
      return 'muy picante';
    }
    if (level === 1) return 'mild spice';
    if (level === 2) return 'medium spice';
    return 'hot spice';
  }

  // -------------------- Markdown emitter --------------------
  // Pure Markdown — works on GitHub, Notion, Obsidian, any reader.
  // Section as ##; dish as bullet "Name — $Price"; description as
  // an indented sub-bullet; allergens + spice on their own line.
  function exportMarkdown(opts) {
    opts = opts || {};
    var rows = opts.rows || [];
    var locale = opts.locale || 'en';
    var lines = [];
    if (opts.title) lines.push('# ' + opts.title);
    if (opts.tagline) lines.push('_' + opts.tagline + '_');
    if (opts.story) { lines.push(''); lines.push('> ' + opts.story); }
    var seenCodes = {};
    rows.forEach(function (r) {
      if (!r) return;
      if (r.kind === 'section' && (r.name || '').trim()) {
        lines.push('');
        lines.push('## ' + r.name.trim());
        lines.push('');
      } else if (r.kind === 'dish' && (r.name || '').trim()) {
        var name = r.name.trim();
        var price = (r.price || '').trim();
        var line = '- **' + name + '**';
        if (price) line += ' — ' + price;
        lines.push(line);
        if ((r.desc || '').trim()) {
          lines.push('  ' + r.desc.trim());
        }
        var allergens = (Array.isArray(r.allergens) ? r.allergens : []).filter(function (c) { return TXT_ALLERGENS[c]; });
        var spice = (typeof r.spice === 'number' && r.spice > 0) ? r.spice : 0;
        if (allergens.length || spice) {
          allergens.forEach(function (c) { seenCodes[c] = true; });
          var notes = [];
          if (allergens.length) notes.push((locale === 'es' ? 'Etiquetas: ' : 'Tags: ') + allergenList(allergens, locale));
          if (spice) notes.push(spiceWord(spice, locale));
          lines.push('  _' + notes.join(' · ') + '_');
        }
      }
    });
    var keys = Object.keys(seenCodes);
    if (keys.length) {
      lines.push('');
      lines.push('---');
      lines.push('');
      lines.push(locale === 'es' ? '### Clave de alérgenos / dieta' : '### Allergen / dietary key');
      lines.push('');
      keys.forEach(function (k) {
        lines.push('- **' + k + '** = ' + allergenLabel(k, locale));
      });
    }
    // Wave B2 — regime-aware allergen disclaimer footer. Renders as
    // a Markdown blockquote above the last-updated line so the
    // advisory tone is preserved when pasted into Notion / GitHub.
    if (opts.disclaimer && String(opts.disclaimer).trim()) {
      lines.push('');
      lines.push('---');
      lines.push('> ' + String(opts.disclaimer).trim());
    }
    lines.push('');
    var when = opts.lastUpdated || new Date().toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    lines.push('_' + (locale === 'es' ? 'Última actualización: ' : 'Last updated: ') + when + '_');
    return lines.join('\n');
  }

  // -------------------- Plain-text emitter --------------------
  // Stripped formatting — usable in TTS, email-body fallback, copy-
  // paste into any host. ASCII rules under section names.
  function exportPlainText(opts) {
    opts = opts || {};
    var rows = opts.rows || [];
    var locale = opts.locale || 'en';
    var out = [];
    if (opts.title) {
      out.push(opts.title.toUpperCase());
      out.push(repeatChar('=', opts.title.length));
      out.push('');
    }
    if (opts.tagline) { out.push(opts.tagline); out.push(''); }
    if (opts.story) { out.push(opts.story); out.push(''); }
    var seenCodes = {};
    rows.forEach(function (r) {
      if (!r) return;
      if (r.kind === 'section' && (r.name || '').trim()) {
        out.push('');
        out.push(r.name.trim().toUpperCase());
        out.push(repeatChar('-', r.name.length));
      } else if (r.kind === 'dish' && (r.name || '').trim()) {
        var line = r.name.trim();
        if ((r.price || '').trim()) {
          // Pad name to 40, price right-aligned for tabular feel.
          var pad = 40 - line.length;
          if (pad > 1) line += repeatChar(' ', pad);
          else line += '  ';
          line += r.price.trim();
        }
        out.push(line);
        if ((r.desc || '').trim()) out.push('  ' + r.desc.trim());
        var allergens = (Array.isArray(r.allergens) ? r.allergens : []).filter(function (c) { return TXT_ALLERGENS[c]; });
        var spice = (typeof r.spice === 'number' && r.spice > 0) ? r.spice : 0;
        if (allergens.length || spice) {
          allergens.forEach(function (c) { seenCodes[c] = true; });
          var notes = [];
          if (allergens.length) notes.push((locale === 'es' ? 'Etiquetas: ' : 'Tags: ') + allergens.join(', '));
          if (spice) notes.push(spiceWord(spice, locale));
          out.push('  ' + notes.join('  ·  '));
        }
      }
    });
    var keys = Object.keys(seenCodes);
    if (keys.length) {
      out.push('');
      out.push(locale === 'es' ? 'CLAVE DE ALÉRGENOS / DIETA' : 'ALLERGEN / DIETARY KEY');
      out.push(repeatChar('-', 26));
      keys.forEach(function (k) {
        out.push(k + ' = ' + allergenLabel(k, locale));
      });
    }
    // Wave B2 — regime-aware allergen disclaimer footer. Caller
    // resolves the effective text (operator-typed wins; otherwise
    // regime default). Emitted as a wrapped paragraph so the line
    // length stays scannable.
    if (opts.disclaimer && String(opts.disclaimer).trim()) {
      out.push('');
      out.push(repeatChar('-', 60));
      var disc = String(opts.disclaimer).trim();
      // Manual word-wrap at 60 cols to match the table width above.
      var words = disc.split(/\s+/);
      var line = '';
      words.forEach(function (w) {
        if ((line + (line ? ' ' : '') + w).length > 60) {
          out.push(line);
          line = w;
        } else {
          line = line + (line ? ' ' : '') + w;
        }
      });
      if (line) out.push(line);
    }
    out.push('');
    out.push((locale === 'es' ? 'Última actualización: ' : 'Last updated: ') + (opts.lastUpdated || new Date().toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })));
    return out.join('\n');
  }

  // -------------------- SSML emitter --------------------
  // Speech Synthesis Markup Language — pipeable to AWS Polly,
  // Google TTS, Azure Speech, or any SSML-aware engine. Renders
  // monetary values via <sub alias="..."> so prices read as
  // dollars; allergens render with prosodic emphasis.
  function exportSsml(opts) {
    opts = opts || {};
    var rows = opts.rows || [];
    var locale = opts.locale || 'en';
    var langTag = locale === 'es' ? 'es-MX' : 'en-US';
    var out = [];
    out.push('<?xml version="1.0"?>');
    out.push('<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="' + langTag + '">');
    if (opts.title) out.push('  <p><emphasis level="strong">' + xmlEsc(opts.title) + '</emphasis></p>');
    if (opts.tagline) out.push('  <p><emphasis>' + xmlEsc(opts.tagline) + '</emphasis></p>');
    if (opts.story) out.push('  <p>' + xmlEsc(opts.story) + '</p>');
    rows.forEach(function (r) {
      if (!r) return;
      if (r.kind === 'section' && (r.name || '').trim()) {
        out.push('  <break time="600ms"/>');
        out.push('  <p><emphasis level="strong">' + xmlEsc(r.name.trim()) + '</emphasis></p>');
      } else if (r.kind === 'dish' && (r.name || '').trim()) {
        var name = xmlEsc(r.name.trim());
        var price = (r.price || '').trim();
        var priceSay = '';
        if (price) {
          // Convert "$14" / "$14.50" to "fourteen dollars" / "fourteen and 50 cents".
          var match = price.replace(/[^\d.]/g, '');
          if (match) {
            priceSay = ' <sub alias="' + spokenPrice(match, locale) + '">' + xmlEsc(price) + '</sub>';
          } else {
            priceSay = ' ' + xmlEsc(price);
          }
        }
        var inner = '<s>' + name + priceSay + '</s>';
        var desc = (r.desc || '').trim();
        if (desc) inner += ' <s>' + xmlEsc(desc) + '</s>';
        var allergens = (Array.isArray(r.allergens) ? r.allergens : []).filter(function (c) { return TXT_ALLERGENS[c]; });
        var spice = (typeof r.spice === 'number' && r.spice > 0) ? r.spice : 0;
        if (allergens.length) {
          var labels = allergens.map(function (c) { return allergenLabel(c, locale); }).join(', ');
          inner += ' <s><emphasis level="moderate">' + (locale === 'es' ? 'Etiquetas: ' : 'Tags: ') + xmlEsc(labels) + '</emphasis></s>';
        }
        if (spice) inner += ' <s>' + xmlEsc(spiceWord(spice, locale)) + '</s>';
        out.push('  <p>' + inner + '<break time="350ms"/></p>');
      }
    });
    out.push('</speak>');
    return out.join('\n');
  }

  function spokenPrice(numStr, locale) {
    // Friendly "$14.50" -> "14 dollars and 50 cents". Locale-aware.
    var f = parseFloat(numStr);
    if (!isFinite(f)) return numStr;
    var dollars = Math.floor(f);
    var cents = Math.round((f - dollars) * 100);
    if (locale === 'es') {
      if (cents === 0) return dollars + ' dólares';
      return dollars + ' dólares con ' + cents + ' centavos';
    }
    if (cents === 0) return dollars + ' dollars';
    return dollars + ' dollars and ' + cents + ' cents';
  }

  function xmlEsc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
  function repeatChar(ch, n) {
    if (n <= 0) return '';
    var out = '';
    for (var i = 0; i < n; i++) out += ch;
    return out;
  }

  // -------------------- BRF Grade-1 emitter --------------------
  // BRF (Braille Ready Format) is a 6-dot ASCII-mapped format for
  // braille embossers / readers. Grade 1 is uncontracted (every
  // letter expanded literally, no shorthand). Real grade-2 requires
  // BANA contractions which are licensed; we ship grade-1 only with
  // a header note so operators know what to expect. Many embossers
  // accept grade-1 BRF fine for menu-shaped content.
  //
  // Format: 40 chars per line, 25 lines per page; pages separated
  // by ASCII form-feed (0x0C). Numbers prefixed with the number
  // sign (#); capitals prefixed with the capital sign (,) per BANA.
  function exportBrf(opts) {
    opts = opts || {};
    var rows = opts.rows || [];
    var locale = opts.locale || 'en';
    var lineW = 40;
    var pageH = 25;
    var lines = [];
    function pushLine(text) {
      // Wrap any oversize line.
      var t = String(text || '');
      while (t.length > lineW) {
        var space = t.lastIndexOf(' ', lineW);
        if (space <= 0) { lines.push(t.slice(0, lineW)); t = t.slice(lineW); }
        else { lines.push(t.slice(0, space)); t = t.slice(space + 1); }
      }
      if (t.length || lines.length === 0) lines.push(t);
    }
    function brfText(s) {
      // Apply Grade-1 capital marker (,) before each uppercase run
      // and number marker (#) before each digit run. Punctuation
      // stays literal — embossers map it natively.
      var out = '';
      var inNum = false;
      var inCap = false;
      for (var i = 0; i < s.length; i++) {
        var c = s.charAt(i);
        if (/\d/.test(c)) {
          if (!inNum) { out += '#'; inNum = true; }
          out += c;
          inCap = false;
        } else {
          inNum = false;
          if (/[A-Z]/.test(c)) {
            if (!inCap) { out += ','; inCap = true; }
            out += c.toLowerCase();
          } else {
            inCap = false;
            out += c;
          }
        }
      }
      return out;
    }
    pushLine(',,brf grade-#a uncontracted');
    pushLine('');
    if (opts.title) { pushLine(brfText(opts.title)); pushLine(''); }
    if (opts.tagline) { pushLine(brfText(opts.tagline)); pushLine(''); }
    // W21 fix #8 — guard with .trim() so whitespace-only names don't
    // emit an empty banner (matches the Markdown / plain-text / SSML
    // / PDF emitters' behavior).
    rows.forEach(function (r) {
      if (!r) return;
      var rName = (r.name || '').trim();
      if (r.kind === 'section' && rName) {
        pushLine('');
        pushLine(',,' + rName.toLowerCase());
        pushLine(repeat('-', Math.min(lineW, rName.length)));
      } else if (r.kind === 'dish' && rName) {
        var line = brfText(rName);
        var rPrice = (r.price || '').trim();
        if (rPrice) {
          var priceStr = brfText(rPrice);
          var pad = lineW - line.length - priceStr.length;
          if (pad > 1) line = line + repeat(' ', pad) + priceStr;
          else line = line + ' ' + priceStr;
        }
        pushLine(line);
        var rDesc = (r.desc || '').trim();
        if (rDesc) pushLine('  ' + brfText(rDesc));
      }
    });
    // Pad pages to 25 lines and join with form-feed separators.
    var paged = [];
    for (var p = 0; p < lines.length; p += pageH) {
      var page = lines.slice(p, p + pageH);
      while (page.length < pageH) page.push('');
      paged.push(page.join('\n'));
    }
    return paged.join('\n\f\n'); // 0x0C form-feed between pages
  }
  function repeat(c, n) { var o = ''; for (var i = 0; i < n; i++) o += c; return o; }

  var api = {
    exportMarkdown:  exportMarkdown,
    exportPlainText: exportPlainText,
    exportSsml:      exportSsml,
    exportBrf:       exportBrf
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_TEXT = api;
})(typeof window !== 'undefined' ? window : null);
