/**
 * Menu Design Suite — QR-menu HTML emitter (Phase 7 W6-1).
 *
 * The marquee "Canva won't auto-derive this from your dish list"
 * deliverable. From one editor session the operator gets:
 *
 *   menu.html   — self-contained, inlined CSS via theme tokens,
 *                 inlined logo data-URL, no external fetches at
 *                 runtime. Drop into Squarespace / Wix Media /
 *                 GitHub Pages root and it works.
 *   menu-qr.png — base64 PNG containing a QR code that points to
 *                 wherever menu.html will live (operator types the
 *                 destination URL; we encode it).
 *
 * Lazy-loads qrcode-generator from jsdelivr on first call — keeps
 * the static page under-budget when nobody clicks Export QR Menu.
 *
 * Privacy posture: the QR generator runs in-browser after lazy-load.
 * The destination URL is whatever the operator types; we don't
 * record it, ping it, or share it.
 */
(function (root) {
  'use strict';

  var QR_CDN = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
  var __qrLoadPromise = null;
  function loadQrCode() {
    if (root.qrcode) return Promise.resolve(root.qrcode);
    if (__qrLoadPromise) return __qrLoadPromise;
    __qrLoadPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = QR_CDN;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.referrerPolicy = 'no-referrer';
      s.onload = function () {
        if (root.qrcode) resolve(root.qrcode);
        else { __qrLoadPromise = null; reject(new Error('qrcode-generator loaded but global missing')); }
      };
      s.onerror = function () {
        __qrLoadPromise = null;
        reject(new Error('Could not load QR generator — check your network'));
      };
      document.head.appendChild(s);
    });
    return __qrLoadPromise;
  }

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // W7-2 — allergen catalog mirror. Same shape as the editor catalog
  // and the PDF renderer, kept minimal here: code → {en, es} label.
  // Glyph rendering uses the code itself inside a styled pill so we
  // don't depend on emoji fonts on the operator's host.
  var HTML_ALLERGENS = {
    V:  { en: 'Vegan',           es: 'Vegano' },
    VG: { en: 'Vegetarian',      es: 'Vegetariano' },
    GF: { en: 'Gluten-free',     es: 'Sin gluten' },
    DF: { en: 'Dairy-free',      es: 'Sin lácteos' },
    N:  { en: 'Contains nuts',   es: 'Frutos secos' },
    E:  { en: 'Contains eggs',   es: 'Huevos' },
    SO: { en: 'Contains soy',    es: 'Soya' },
    SF: { en: 'Shellfish',       es: 'Mariscos' },
    FI: { en: 'Contains fish',   es: 'Pescado' },
    SE: { en: 'Sesame',          es: 'Sésamo' },
    LO: { en: 'Locally sourced', es: 'Origen local' }
  };
  function allergenLabelHtml(code, locale) {
    var a = HTML_ALLERGENS[code]; if (!a) return code;
    return locale === 'es' ? a.es : a.en;
  }

  // -------------------- HTML emitter --------------------
  // Returns a self-contained HTML string. Theme tokens become CSS
  // custom properties; logo (when supplied) is inlined as
  // data-URL; no <script> tags, no external fetches.
  function exportHtml(opts) {
    opts = opts || {};
    var rows = opts.rows || [];
    var theme = opts.theme || {};
    var title = opts.title || 'Menu';
    var locale = opts.locale || 'en';
    var logoDataUrl = opts.logoDataUrl || '';
    var allergens = opts.allergens || null; // future-proofed for W6-6

    var sectionsHtml = '';
    var seenCodes = {};
    rows.forEach(function (r) {
      if (!r) return;
      if (r.kind === 'section') {
        sectionsHtml += '<h2>' + escHtml(r.name) + '</h2>';
      } else if (r.kind === 'dish') {
        var name  = escHtml(r.name || '');
        var price = escHtml(r.price || '');
        var desc  = escHtml(r.desc || '');
        // W7-2 — render allergen + spice glyphs as accessible pill
        // chips after the dish name. Each chip carries an explicit
        // aria-label so screen readers announce the full word, not
        // just the code letters.
        var glyphHtml = '';
        var validAllergens = (Array.isArray(r.allergens) ? r.allergens : [])
          .filter(function (c) { return !!HTML_ALLERGENS[c]; });
        var spice = (typeof r.spice === 'number' && r.spice > 0 && r.spice <= 3) ? r.spice : 0;
        if (validAllergens.length || spice) {
          glyphHtml = ' <span class="ml-glyphs" role="list">';
          validAllergens.forEach(function (code) {
            seenCodes[code] = true;
            var lbl = allergenLabelHtml(code, locale);
            glyphHtml += '<span class="ml-glyph" role="listitem" aria-label="' + escHtml(lbl) + '">' + escHtml(code) + '</span>';
          });
          if (spice) {
            var sLbl = (locale === 'es' ? 'Picante nivel ' : 'Spicy level ') + spice;
            var fire = '';
            for (var sf = 0; sf < spice; sf++) fire += '🌶';
            glyphHtml += '<span class="ml-glyph ml-glyph-spice" role="listitem" aria-label="' + escHtml(sLbl) + '">' + fire + '</span>';
          }
          glyphHtml += '</span>';
        }
        sectionsHtml +=
          '<div class="ml-dish">' +
            '<div class="ml-row">' +
              '<div class="ml-name">' + name + glyphHtml + '</div>' +
              '<div class="ml-leader" aria-hidden="true"></div>' +
              '<div class="ml-price">' + price + '</div>' +
            '</div>' +
            (desc ? '<div class="ml-desc">' + desc + '</div>' : '') +
          '</div>';
      }
    });

    // W7-2 — auto-generated allergen/dietary key legend. Rendered as
    // a definition list at the menu footer; only appears when at
    // least one dish carries a code.
    var keyHtml = '';
    var seenList = Object.keys(seenCodes);
    if (seenList.length) {
      var ordered = ['V','VG','GF','DF','N','E','SO','SF','FI','SE','LO']
        .filter(function (c) { return seenCodes[c]; });
      var keyTitle = (locale === 'es') ? 'Clave de alérgenos / dieta' : 'Allergen / dietary key';
      keyHtml = '<section class="ml-allergen-key" aria-label="' + escHtml(keyTitle) + '">' +
        '<h2 class="ml-allergen-key-title">' + escHtml(keyTitle) + '</h2>' +
        '<dl class="ml-allergen-key-list">';
      ordered.forEach(function (code) {
        keyHtml += '<div class="ml-allergen-key-row">' +
          '<dt class="ml-allergen-key-glyph">' + escHtml(code) + '</dt>' +
          '<dd>' + escHtml(allergenLabelHtml(code, locale)) + '</dd>' +
          '</div>';
      });
      keyHtml += '</dl></section>';
    }

    var bodyFamily    = theme.bodyFamily    || 'Georgia, "Times New Roman", serif';
    var displayFamily = theme.displayFamily || bodyFamily;
    var ink     = theme.ink    || '#14161A';
    var paper   = theme.paper  || '#FAF6EE';
    var accent  = theme.accent || '#1F4E5B';
    var muted   = theme.muted  || '#7C6F60';

    // Self-contained HTML. The operator can drop this single file
    // into any host — no CDN dependency at view-time.
    return '<!doctype html>\n' +
'<html lang="' + escHtml(locale) + '">\n' +
'<head>\n' +
'<meta charset="utf-8" />\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1" />\n' +
'<title>' + escHtml(title) + '</title>\n' +
'<style>\n' +
'  :root{\n' +
'    --ink:' + ink + ';--paper:' + paper + ';--accent:' + accent + ';--muted:' + muted + ';\n' +
'    --body:"' + bodyFamily.replace(/"/g, '\\"') + '";\n' +
'    --display:"' + displayFamily.replace(/"/g, '\\"') + '";\n' +
'  }\n' +
'  *{box-sizing:border-box}\n' +
'  body{margin:0;padding:32px 16px;background:var(--paper);color:var(--ink);font-family:var(--body);font-size:16px;line-height:1.55}\n' +
'  .ml-page{max-width:720px;margin:0 auto}\n' +
'  .ml-head{text-align:center;padding:0 0 16px;border-bottom:1px solid color-mix(in srgb,var(--ink) 18%,transparent)}\n' +
'  .ml-logo{max-width:120px;height:auto;margin:0 auto 14px;display:block}\n' +
'  .ml-title{font-family:var(--display);font-size:32px;font-weight:500;margin:0;letter-spacing:.02em}\n' +
'  h2{font-family:var(--display);font-size:18px;font-weight:500;color:var(--accent);margin:28px 0 10px;padding-bottom:4px;border-bottom:1px solid color-mix(in srgb,var(--accent) 24%,transparent);text-transform:uppercase;letter-spacing:.06em}\n' +
'  .ml-dish{padding:8px 0}\n' +
'  .ml-row{display:flex;align-items:baseline;gap:10px}\n' +
'  .ml-name{font-weight:600;color:var(--ink);flex:0 0 auto}\n' +
'  .ml-leader{flex:1;border-bottom:1px dotted color-mix(in srgb,var(--muted) 60%,transparent);position:relative;top:-4px;min-width:24px}\n' +
'  .ml-price{font-variant-numeric:tabular-nums;color:var(--ink);font-weight:500}\n' +
'  .ml-desc{font-size:14px;color:var(--muted);margin-top:2px;line-height:1.5}\n' +
'  .ml-allergens{font-size:12px;color:var(--accent);font-weight:400;text-transform:lowercase;letter-spacing:.04em}\n' +
/* W7-2 allergen/spice glyph chips — same monogram pattern as the editor. */
'  .ml-glyphs{display:inline-flex;flex-wrap:wrap;gap:4px;margin-left:6px;vertical-align:middle}\n' +
'  .ml-glyph{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:16px;padding:0 6px;border:1px solid var(--accent);border-radius:999px;color:var(--accent);font-size:10.5px;font-weight:700;letter-spacing:.04em;line-height:1;background:transparent}\n' +
'  .ml-glyph-spice{border:0;color:inherit;font-size:11.5px;letter-spacing:0;padding:0}\n' +
/* W7-2 footer allergen-key block — small two-column list of code → label. */
'  .ml-allergen-key{margin-top:36px;padding-top:18px;border-top:1px solid color-mix(in srgb,var(--accent) 24%,transparent)}\n' +
'  .ml-allergen-key-title{font-family:var(--display);font-size:14px;font-weight:500;color:var(--ink);text-transform:uppercase;letter-spacing:.08em;margin:0 0 10px;text-align:left;border:0;padding:0}\n' +
'  .ml-allergen-key-list{margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px 14px}\n' +
'  .ml-allergen-key-row{display:flex;align-items:center;gap:8px;margin:0}\n' +
'  .ml-allergen-key-glyph{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:18px;padding:0 6px;border:1px solid var(--accent);border-radius:999px;color:var(--accent);font-size:10.5px;font-weight:700;letter-spacing:.04em;margin:0;flex:0 0 auto}\n' +
'  .ml-allergen-key-row dd{margin:0;font-size:13px;color:var(--ink)}\n' +
'  .ml-foot{text-align:center;font-size:12px;color:var(--muted);padding-top:32px;border-top:1px solid color-mix(in srgb,var(--ink) 14%,transparent);margin-top:40px}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<main class="ml-page">\n' +
'  <header class="ml-head">\n' +
'    ' + (logoDataUrl ? '<img class="ml-logo" alt="" src="' + escHtml(logoDataUrl) + '" />' : '') + '\n' +
'    <h1 class="ml-title">' + escHtml(title) + '</h1>\n' +
'  </header>\n' +
'  ' + sectionsHtml + '\n' +
   keyHtml + '\n' +
'  <footer class="ml-foot">' +
    (locale === 'es' ? 'Última actualización: ' : 'Last updated: ') +
    new Date().toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) +
'  </footer>\n' +
'</main>\n' +
'</body>\n' +
'</html>\n';
  }

  // -------------------- QR PNG emitter --------------------
  // Returns Promise<dataUrl-PNG-string>. Caller can <a download>
  // it as menu-qr.png alongside menu.html.
  function exportQrPng(targetUrl, opts) {
    opts = opts || {};
    var size = opts.size || 480;     // PNG dimensions in px
    var ec   = opts.ec   || 'M';     // L / M / Q / H — error-correction level
    var margin = opts.margin || 4;
    return loadQrCode().then(function (qrcode) {
      // Auto-detect type version (1-40). Library scales as needed.
      var qr = qrcode(0, ec);
      qr.addData(String(targetUrl || ''));
      qr.make();
      var modCount = qr.getModuleCount();
      var totalMods = modCount + margin * 2;
      var scale = Math.max(1, Math.floor(size / totalMods));
      var canvasSize = scale * totalMods;
      var canvas = document.createElement('canvas');
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      ctx.fillStyle = '#000000';
      for (var r = 0; r < modCount; r++) {
        for (var c = 0; c < modCount; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(
              (c + margin) * scale,
              (r + margin) * scale,
              scale, scale
            );
          }
        }
      }
      return canvas.toDataURL('image/png');
    });
  }

  // -------------------- ZIP helper --------------------
  // Lazy-loads jszip and returns a Blob containing menu.html +
  // menu-qr.png. Caller triggers download via createObjectURL.
  var JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  var __jszipLoadPromise = null;
  function loadJsZip() {
    if (root.JSZip) return Promise.resolve(root.JSZip);
    if (__jszipLoadPromise) return __jszipLoadPromise;
    __jszipLoadPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = JSZIP_CDN;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.referrerPolicy = 'no-referrer';
      s.onload = function () {
        if (root.JSZip) resolve(root.JSZip);
        else { __jszipLoadPromise = null; reject(new Error('JSZip loaded but global missing')); }
      };
      s.onerror = function () {
        __jszipLoadPromise = null;
        reject(new Error('Could not load JSZip — check your network'));
      };
      document.head.appendChild(s);
    });
    return __jszipLoadPromise;
  }

  function exportZip(opts) {
    opts = opts || {};
    return loadJsZip().then(function (JSZip) {
      var html = exportHtml(opts);
      return exportQrPng(opts.targetUrl || '', { size: 480 }).then(function (qrDataUrl) {
        var zip = new JSZip();
        zip.file('menu.html', html);
        // strip the data: prefix
        var b64 = qrDataUrl.split(',')[1] || '';
        zip.file('menu-qr.png', b64, { base64: true });
        return zip.generateAsync({ type: 'blob' });
      });
    });
  }

  var api = {
    exportHtml:    exportHtml,
    exportQrPng:   exportQrPng,
    exportZip:     exportZip,
    loadQrCode:    loadQrCode
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_HTML = api;
})(typeof window !== 'undefined' ? window : null);
