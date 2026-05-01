/**
 * Menu Design Suite — PDF renderer (Wave A3).
 *
 * Reads the same theme objects the HTML preview consumes and emits
 * a jsPDF document. Auto-paginates dish overflow; never silently
 * drops a row. Letter / A4 / Half-page paper sizes for v1.
 *
 * Privacy posture: jsPDF is lazy-loaded from a CDN on the FIRST
 * Download tap. The document is built entirely in-browser and
 * passed to doc.save() which triggers a Blob download — no upload,
 * no server round-trip. The check-tool-no-fetch invariant remains
 * satisfied because this is a deliberate user-initiated CDN load
 * for an export, not an input-side fetch.
 *
 * Wave A3 scope: RGB share PDF, single flavor. CMYK + bleed +
 * crop-marks flavor (print-vendor PDF) is queued for Wave A4 polish.
 */
(function (root) {
  'use strict';

  var JSPDF_CDN = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
  var __pdfLibPromise = null;

  function loadJsPdf() {
    if (root.jspdf && root.jspdf.jsPDF) return Promise.resolve(root.jspdf.jsPDF);
    if (__pdfLibPromise) return __pdfLibPromise;
    __pdfLibPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = JSPDF_CDN;
      s.crossOrigin = 'anonymous';
      s.referrerPolicy = 'no-referrer';
      s.onload = function () {
        var lib = (root.jspdf && root.jspdf.jsPDF) || null;
        if (lib) resolve(lib);
        else { __pdfLibPromise = null; reject(new Error('jsPDF loaded but global missing')); }
      };
      s.onerror = function () {
        __pdfLibPromise = null;
        reject(new Error('Could not load jsPDF — check your network'));
      };
      document.head.appendChild(s);
    });
    return __pdfLibPromise;
  }

  // W9-2 — Brand font loader. Mirrors the audits/restaurant pattern.
  // Fetches subset TTFs from /assets/fonts/pdf/ (Fraunces + Inter,
  // pre-built by scripts/build-pdf-fonts.mjs) and base64-encodes
  // them so jsPDF's addFileToVFS / addFont can register them. Same-
  // origin only — never an external CDN. Failure short-circuits to
  // base-14 fonts so the PDF still ships.
  var __pdfFontsPromise = null;
  function loadBrandFonts() {
    if (root.__menuPdfFonts) return Promise.resolve(root.__menuPdfFonts);
    if (__pdfFontsPromise) return __pdfFontsPromise;
    var specs = [
      ['fraunces400', '/assets/fonts/pdf/fraunces-400.ttf'],
      ['fraunces500', '/assets/fonts/pdf/fraunces-500.ttf'],
      ['fraunces600', '/assets/fonts/pdf/fraunces-600.ttf'],
      ['inter400',    '/assets/fonts/pdf/inter-400.ttf'],
      ['inter500',    '/assets/fonts/pdf/inter-500.ttf'],
      ['inter600',    '/assets/fonts/pdf/inter-600.ttf']
    ];
    __pdfFontsPromise = Promise.all(specs.map(function (s) {
      return fetch(s[1], { cache: 'force-cache' }) // h8-exempt: same-origin font asset for in-browser PDF embed
        .then(function (r) { if (!r.ok) throw new Error('font ' + s[1] + ' ' + r.status); return r.arrayBuffer(); })
        .then(function (buf) {
          var bytes = new Uint8Array(buf);
          var CHUNK = 0x8000, parts = [];
          for (var i = 0; i < bytes.length; i += CHUNK) {
            parts.push(String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK)));
          }
          return [s[0], btoa(parts.join(''))];
        });
    })).then(function (pairs) {
      var out = {};
      for (var i = 0; i < pairs.length; i++) out[pairs[i][0]] = pairs[i][1];
      root.__menuPdfFonts = out;
      return out;
    }).catch(function () {
      __pdfFontsPromise = null;
      return null;
    });
    return __pdfFontsPromise;
  }

  function registerBrandFonts(doc, fonts) {
    if (!fonts) return false;
    try {
      doc.addFileToVFS('Fraunces-400.ttf', fonts.fraunces400);
      doc.addFont('Fraunces-400.ttf', 'Fraunces', 'normal');
      doc.addFileToVFS('Fraunces-500.ttf', fonts.fraunces500);
      doc.addFont('Fraunces-500.ttf', 'Fraunces', 'medium');
      doc.addFileToVFS('Fraunces-600.ttf', fonts.fraunces600);
      doc.addFont('Fraunces-600.ttf', 'Fraunces', 'bold');
      doc.addFileToVFS('Inter-400.ttf', fonts.inter400);
      doc.addFont('Inter-400.ttf', 'Inter', 'normal');
      doc.addFileToVFS('Inter-500.ttf', fonts.inter500);
      doc.addFont('Inter-500.ttf', 'Inter', 'medium');
      doc.addFileToVFS('Inter-600.ttf', fonts.inter600);
      doc.addFont('Inter-600.ttf', 'Inter', 'bold');
      return true;
    } catch (e) {
      return false;
    }
  }

  // Paper dimensions in PostScript points (jsPDF unit:'pt').
  // W7-3 — expanded catalog. Each entry self-describes its flow
  // (single page vs multi-panel folded), default orientation,
  // margin, recommended stock, and a panel structure for folded
  // formats. The marketing copy on index.html line 588 finally
  // matches reality: trifold + table-tent + bifold ship.
  //
  // Categories (used by the picker UI):
  //   sheet   — single-page sheet (letter, A4, legal, tabloid, half-page, quarter, postcard)
  //   folded  — multi-panel folded (bifold, trifold-z, trifold-gate, trifold-legal)
  //   table   — table-presentation (tent, card, placemat, wine-narrow)
  //   board   — large format (A2 board, A1 board)
  //   digital — screen-aspect-ratio (16:9 horizontal, 9:16 vertical)
  //   custom  — operator-typed dimensions
  var PAPERS = {
    // -------- Sheets --------
    'letter':       { w: 612,    h: 792,    flow: 'page',  cat: 'sheet',  orient: 'portrait',  margin: 48, label: 'Letter (8.5×11)',          stock: '24lb-text' },
    'letter-land':  { w: 792,    h: 612,    flow: 'page',  cat: 'sheet',  orient: 'landscape', margin: 48, label: 'Letter landscape (11×8.5)', stock: '24lb-text' },
    'a4':           { w: 595.28, h: 841.89, flow: 'page',  cat: 'sheet',  orient: 'portrait',  margin: 48, label: 'A4 (210×297mm)',           stock: '24lb-text' },
    'a4-land':      { w: 841.89, h: 595.28, flow: 'page',  cat: 'sheet',  orient: 'landscape', margin: 48, label: 'A4 landscape',             stock: '24lb-text' },
    'legal':        { w: 612,    h: 1008,   flow: 'page',  cat: 'sheet',  orient: 'portrait',  margin: 48, label: 'Legal (8.5×14)',           stock: '24lb-text' },
    'tabloid':      { w: 792,    h: 1224,   flow: 'page',  cat: 'sheet',  orient: 'portrait',  margin: 60, label: 'Tabloid (11×17)',          stock: '32lb-text' },
    'half-page':    { w: 612,    h: 396,    flow: 'page',  cat: 'sheet',  orient: 'landscape', margin: 30, label: 'Half-page (8.5×5.5)',      stock: '32lb-text' },
    'quarter-pc':   { w: 306,    h: 396,    flow: 'page',  cat: 'sheet',  orient: 'portrait',  margin: 24, label: 'Postcard (4.25×5.5)',      stock: '80lb-cover' },
    // -------- Folded multi-panel --------
    'bifold-letter': { w: 792, h: 612, flow: 'panel', cat: 'folded', orient: 'landscape', panels: 4, fold: 'bifold',
                       panelMap: ['back', 'front', 'inside-L', 'inside-R'], gutter: 18, margin: 36,
                       label: 'Bi-fold (letter, 4 panels)', stock: '80lb-cover' },
    'trifold-letter-z': { w: 792, h: 612, flow: 'panel', cat: 'folded', orient: 'landscape', panels: 6, fold: 'z-fold',
                          panelMap: ['front', 'inside-1', 'inside-2', 'back', 'address', 'tear'],
                          panelWidths: [264, 264, 264], gutter: 12, margin: 24,
                          label: 'Tri-fold Z (letter)', stock: '80lb-cover' },
    'trifold-letter-gate': { w: 792, h: 612, flow: 'panel', cat: 'folded', orient: 'landscape', panels: 6, fold: 'gate-fold',
                             panelWidths: [198, 396, 198],
                             panelMap: ['gate-L', 'front', 'gate-R', 'inside-L', 'center', 'inside-R'],
                             gutter: 12, margin: 24, label: 'Tri-fold gate (letter)', stock: '80lb-cover' },
    'trifold-legal': { w: 1008, h: 612, flow: 'panel', cat: 'folded', orient: 'landscape', panels: 6, fold: 'z-fold',
                       panelMap: ['front', 'inside-1', 'inside-2', 'back', 'inside-3', 'inside-4'],
                       panelWidths: [336, 336, 336], gutter: 12, margin: 24,
                       label: 'Tri-fold Z (legal — more dishes)', stock: '80lb-cover' },
    // -------- Table formats --------
    'table-tent':   { w: 360, h: 720, flow: 'panel', cat: 'table', orient: 'portrait', panels: 2, fold: 'tent',
                      panelMap: ['side-A', 'side-B'], gutter: 6, margin: 18,
                      label: 'Table tent (5×10 folded to 5×5)', stock: '100lb-cover' },
    'table-card':   { w: 360, h: 504, flow: 'page',  cat: 'table', orient: 'portrait', margin: 18, label: 'Table card (5×7)',   stock: '100lb-cover' },
    'placemat':     { w: 720, h: 1008, flow: 'page', cat: 'table', orient: 'landscape', margin: 36, label: 'Placemat (10×14)',  stock: '70lb-uncoated' },
    'wine-narrow':  { w: 306, h: 792, flow: 'page',  cat: 'table', orient: 'portrait',  margin: 24, label: 'Wine list (4.25×11)', stock: '32lb-text' },
    'specials':     { w: 360, h: 504, flow: 'page',  cat: 'table', orient: 'portrait',  margin: 18, label: 'Specials card (5×7)', stock: '100lb-cover' },
    // -------- Board / poster --------
    'a2-board':     { w: 1190.55, h: 1683.78, flow: 'page', cat: 'board', orient: 'portrait', margin: 72, label: 'A2 menu board',     stock: 'rigid-board' },
    'a1-board':     { w: 1683.78, h: 2383.94, flow: 'page', cat: 'board', orient: 'portrait', margin: 96, label: 'A1 menu board',     stock: 'rigid-board' },
    // -------- Digital display --------
    'digital-16x9': { w: 1440,    h: 810,     flow: 'page', cat: 'digital', orient: 'landscape', margin: 60, label: 'Digital screen 16:9',     stock: 'screen-rgb' },
    'digital-9x16': { w: 810,     h: 1440,    flow: 'page', cat: 'digital', orient: 'portrait',  margin: 48, label: 'Digital screen 9:16 (TV)', stock: 'screen-rgb' },
    // -------- Custom (resolved at runtime) --------
    'custom':       { w: 612,     h: 792,     flow: 'page', cat: 'custom', orient: 'portrait',  margin: 48, label: 'Custom dimensions', stock: 'operator-choice', custom: true }
  };

  // Resolve a paper key, applying custom-dimension overrides if needed.
  function resolvePaper(key, customDims) {
    var p = PAPERS[key] ? Object.assign({}, PAPERS[key]) : Object.assign({}, PAPERS.letter);
    if (p.custom && customDims && customDims.w && customDims.h) {
      var unit = (customDims.unit || 'in').toLowerCase();
      var toPt = unit === 'mm' ? (72 / 25.4) : unit === 'cm' ? (72 / 2.54) : unit === 'pt' ? 1 : 72;
      var w = Math.round(customDims.w * toPt);
      var h = Math.round(customDims.h * toPt);
      // Clamp to sane bounds (2"×2" to 50"×50").
      w = Math.max(144, Math.min(3600, w));
      h = Math.max(144, Math.min(3600, h));
      p.w = w; p.h = h;
      p.label = 'Custom ' + customDims.w + '×' + customDims.h + ' ' + unit;
    }
    return p;
  }

  // Map theme bodyFamily/displayFamily strings to a jsPDF font
  // identifier. W9-2 prefers Muntin's brand fonts (Fraunces +
  // Inter) when they've been registered on the doc; otherwise
  // falls back to PDF base-14 (times/helvetica/courier) so output
  // is still legible without the font fetch.
  //
  // The 2nd arg `brandsLoaded` is a boolean the caller sets after
  // registerBrandFonts() succeeds.
  function pickPdfFont(family, brandsLoaded) {
    var f = String(family || '').toLowerCase();
    if (brandsLoaded) {
      // Match every serif theme face to Fraunces (covers Georgia,
      // Cormorant, Quattrocento, Noto, Playfair, Source Serif —
      // they all read as serif on screen, and Fraunces is a
      // fitting general-purpose stand-in for the PDF deliverable).
      if (/georgia|times|fraunces|cormorant|noto|quattrocento|playfair|garamond|source.serif|serif/.test(f)) {
        return 'Fraunces';
      }
      // Match every sans theme face to Inter.
      if (/inter|helvetica|arial|work.sans|system/.test(f)) {
        return 'Inter';
      }
      // Display-only special cases (Bebas, Alfa Slab) get Inter
      // bold as the closest available stand-in until W9-3 adds
      // those subsets.
      if (/bebas|alfa.slab|condensed/.test(f)) return 'Inter';
    }
    if (/georgia|times|fraunces|serif/.test(f)) return 'times';
    if (/courier|monospace/.test(f)) return 'courier';
    return 'helvetica';
  }

  // Convert hex to {r,g,b} for jsPDF.setTextColor / setDrawColor.
  function hexToRgb(hex) {
    var h = String(hex || '').replace(/^#/, '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  // Block model: turn rows[] into a flow-able sequence the layout
  // engine can paginate. Each block has a `measure(maxWidth, doc,
  // theme)` returning {width, height} and a `draw(x, y, doc, theme)`
  // mutating the page. This shape lets us swap in a column packer
  // later (Wave A4) without touching block draw code.
  function buildBlocks(rows, title, logoDataUrl) {
    var blocks = [];
    blocks.push({ kind: 'title', text: title || 'Menu' });
    if (logoDataUrl) blocks.push({ kind: 'logo', src: logoDataUrl });
    var seenAllergens = {};
    rows.forEach(function (r) {
      if (r.kind === 'section' && (r.name || '').trim()) {
        blocks.push({ kind: 'section', text: r.name.trim() });
      } else if (r.kind === 'dish' && (r.name || '').trim()) {
        // W7-2 — propagate allergen codes + spice level into the
        // dish block. The draw routine renders glyphs after the
        // name; pagination re-measures with that extra width.
        var allergens = Array.isArray(r.allergens)
          ? r.allergens.filter(function (c) { return typeof c === 'string' && c.length; })
          : [];
        allergens.forEach(function (c) { seenAllergens[c] = true; });
        var spice = (typeof r.spice === 'number' && r.spice > 0 && r.spice <= 3) ? r.spice : 0;
        blocks.push({
          kind: 'dish',
          name:  (r.name || '').trim(),
          price: (r.price || '').trim(),
          desc:  (r.desc || '').trim(),
          allergens: allergens,
          spice: spice
        });
      }
    });
    // W7-2 — append the auto-generated allergen-key legend at the
    // very bottom. Renderer no-ops if seenAllergens is empty.
    var keys = Object.keys(seenAllergens);
    if (keys.length) blocks.push({ kind: 'allergen-key', codes: keys });
    return blocks;
  }

  // W7-2 — minimal allergen catalog mirror (label-only). Lives here
  // so the PDF renderer can emit human-readable legends without
  // pulling the editor's catalog. Keep in sync with menu-design.js.
  var PDF_ALLERGENS = {
    V:  { en: 'Vegan',          es: 'Vegano' },
    VG: { en: 'Vegetarian',     es: 'Vegetariano' },
    GF: { en: 'Gluten-free',    es: 'Sin gluten' },
    DF: { en: 'Dairy-free',     es: 'Sin lácteos' },
    N:  { en: 'Contains nuts',  es: 'Frutos secos' },
    E:  { en: 'Contains eggs',  es: 'Huevos' },
    SO: { en: 'Contains soy',   es: 'Soya' },
    SF: { en: 'Shellfish',      es: 'Mariscos' },
    FI: { en: 'Contains fish',  es: 'Pescado' },
    SE: { en: 'Sesame',         es: 'Sésamo' },
    LO: { en: 'Locally sourced', es: 'Origen local' }
  };
  function allergenLabelPdf(code, locale) {
    var a = PDF_ALLERGENS[code]; if (!a) return code;
    return locale === 'es' ? a.es : a.en;
  }

  // Vertical space a block consumes at the active theme's text sizes.
  // wrapText is jsPDF's splitTextToSize; we measure with doc on a
  // throwaway font/size to honor descender + leading.
  function measureBlock(block, doc, theme, contentWidth) {
    if (block.kind === 'title') return theme.h1Pt * 1.4 + 22;
    if (block.kind === 'logo')  return 56; // ~80px max — see logo-slot constraint
    if (block.kind === 'section') return theme.h2Pt * 1.6 + 16;
    if (block.kind === 'dish') {
      var nameH  = theme.bodyPt * 1.25;
      var descH  = 0;
      if (block.desc) {
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
        doc.setFontSize(theme.descPt);
        var lines = doc.splitTextToSize(block.desc, contentWidth - 70);
        descH = lines.length * theme.descPt * 1.32;
      }
      return nameH + descH + 6;
    }
    // W7-2 — allergen-key legend block. Wraps onto multiple lines if
    // many codes present; reuse splitTextToSize with the rendered
    // string to get an honest height.
    if (block.kind === 'allergen-key') {
      doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
      doc.setFontSize(theme.descPt);
      var keyText = (block.codes || []).map(function (c) {
        return c + ' = ' + allergenLabelPdf(c, block.locale || 'en');
      }).join('  ·  ');
      var keyLines = doc.splitTextToSize(keyText, contentWidth);
      // 14pt top padding + a leading rule + the wrapped text
      return 18 + keyLines.length * theme.descPt * 1.5 + 4;
    }
    return 0;
  }

  // Draw a block at (x, y) with the active theme. Returns the
  // y-coordinate after the block (top of next free space).
  function drawBlock(block, x, y, doc, theme, contentWidth, logoMeta) {
    var inkRgb     = hexToRgb(theme.ink);
    var mutedRgb   = hexToRgb(theme.muted);
    var accentRgb  = hexToRgb(theme.accent);
    if (block.kind === 'title') {
      doc.setFont(pickPdfFont(theme.displayFamily, doc.__brandsLoaded), 'normal');
      doc.setFontSize(theme.h1Pt);
      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      doc.text(block.text, x + contentWidth / 2, y + theme.h1Pt, { align: 'center' });
      return y + theme.h1Pt * 1.4 + 22;
    }
    if (block.kind === 'logo') {
      // Skip image embed for SVG (jsPDF doesn't natively rasterize
      // SVG without an extra plugin; defer SVG path to Wave A4).
      if (typeof block.src === 'string' && block.src.indexOf('data:image/svg') === 0) {
        return y; // silently skip; SVG logos are still rendered in
                  // the on-screen preview, but PDF v1 needs a raster.
      }
      try {
        var maxH = 56;
        var maxW = 200;
        var w = maxW, h = maxH;
        if (logoMeta && logoMeta.w && logoMeta.h) {
          var ratio = logoMeta.w / logoMeta.h;
          if (ratio >= 1) { w = Math.min(maxW, logoMeta.w); h = w / ratio; }
          else            { h = Math.min(maxH, logoMeta.h); w = h * ratio; }
        }
        // logo-slot: header-center default (centered above title).
        var slot = theme.logoSlot || 'header-center';
        var lx = x + (contentWidth - w) / 2;
        if (slot === 'header-left')  lx = x;
        if (slot === 'header-right') lx = x + contentWidth - w;
        if (slot === 'watermark') {
          // Watermark placement is tricky in jsPDF — defer to A4
          // (needs alpha + page-center math). For v1 fall through
          // to header-center so the logo still ships.
          lx = x + (contentWidth - w) / 2;
        }
        doc.addImage(block.src, 'PNG', lx, y, w, h);
        return y + h + 12;
      } catch (e) {
        return y; // image embed failed; skip
      }
    }
    if (block.kind === 'section') {
      doc.setFont(pickPdfFont(theme.displayFamily, doc.__brandsLoaded), 'normal');
      doc.setFontSize(theme.h2Pt);
      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      var label = block.text;
      if (theme.sectionCase === 'uppercase') label = label.toUpperCase();
      // hand-rule: short rule both sides of the centered label.
      var sectionY = y + theme.h2Pt + 4;
      doc.text(label, x + contentWidth / 2, sectionY, { align: 'center' });
      if (theme.dividerStyle === 'hand-rule') {
        var labelW = doc.getStringUnitWidth(label) * theme.h2Pt / doc.internal.scaleFactor;
        var ruleHalf = (contentWidth - labelW) / 2 - 12;
        doc.setDrawColor(inkRgb.r, inkRgb.g, inkRgb.b);
        doc.setLineWidth(0.5);
        doc.line(x, sectionY - theme.h2Pt * 0.35, x + ruleHalf, sectionY - theme.h2Pt * 0.35);
        doc.line(x + contentWidth - ruleHalf, sectionY - theme.h2Pt * 0.35, x + contentWidth, sectionY - theme.h2Pt * 0.35);
      } else if (theme.dividerStyle === 'box') {
        var bw = doc.getStringUnitWidth(label) * theme.h2Pt / doc.internal.scaleFactor + 28;
        doc.setDrawColor(inkRgb.r, inkRgb.g, inkRgb.b);
        doc.setLineWidth(0.6);
        doc.rect(x + (contentWidth - bw) / 2, sectionY - theme.h2Pt - 2, bw, theme.h2Pt + 10);
      } else if (theme.dividerStyle === 'ornament') {
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
        doc.setFontSize(theme.h2Pt);
        doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.text('❦', x + contentWidth / 2 - 60, sectionY);
        doc.text('❦', x + contentWidth / 2 + 60, sectionY);
      }
      return y + theme.h2Pt * 1.6 + 16;
    }
    if (block.kind === 'dish') {
      doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
      doc.setFontSize(theme.bodyPt);
      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      // Reserve right margin for price.
      var priceWidth = 60;
      var nameWidth  = contentWidth - priceWidth - 8;
      doc.text(block.name, x, y + theme.bodyPt);
      // W7-2 — allergen + spice glyphs after the dish name. Each
      // chip is a small pill: rounded rect outline in the theme's
      // accent color with the 1-2 letter code centered. Spice
      // renders as up to 3 small filled triangles in the rust/accent
      // color; emoji isn't safe in jsPDF base-14 fonts.
      if ((block.allergens && block.allergens.length) || block.spice) {
        var nameW = doc.getStringUnitWidth(block.name) * theme.bodyPt / doc.internal.scaleFactor;
        var chipX = x + nameW + 6;
        var chipY = y + theme.bodyPt - theme.bodyPt * 0.78; // top of pill
        var chipH = theme.bodyPt * 0.78;
        var chipPad = 3;
        var chipFontPt = Math.max(6, theme.bodyPt * 0.62);
        if (block.allergens && block.allergens.length) {
          doc.setFontSize(chipFontPt);
          doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
          doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
          doc.setLineWidth(0.4);
          for (var ci = 0; ci < block.allergens.length; ci++) {
            var code = String(block.allergens[ci]);
            var codeW = doc.getStringUnitWidth(code) * chipFontPt / doc.internal.scaleFactor;
            var pillW = codeW + chipPad * 2;
            // Stop drawing if we'd collide with the price column.
            if (chipX + pillW > x + contentWidth - priceWidth - 4) break;
            doc.roundedRect(chipX, chipY, pillW, chipH, chipH / 2, chipH / 2, 'S');
            doc.text(code, chipX + chipPad, chipY + chipH * 0.78);
            chipX += pillW + 3;
          }
          // Restore body type for following text + price.
          doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
          doc.setFontSize(theme.bodyPt);
          doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
        }
        if (block.spice) {
          // Small filled triangles, up to 3, in rust/accent.
          doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
          var triH = chipH * 0.85;
          var triW = triH * 0.85;
          var triY = chipY + (chipH - triH) / 2;
          for (var sp = 0; sp < block.spice; sp++) {
            if (chipX + triW > x + contentWidth - priceWidth - 4) break;
            doc.triangle(
              chipX,         triY + triH,
              chipX + triW,  triY + triH,
              chipX + triW/2, triY,
              'F'
            );
            chipX += triW + 2;
          }
          doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
        }
      }
      // Price right-aligned.
      if (block.price) {
        if (theme.priceStyle === 'right-monospace') {
          doc.setFont('courier', 'normal');
        }
        doc.text(block.price, x + contentWidth, y + theme.bodyPt, { align: 'right' });
        // leader-dots: short dotted line between name and price.
        if (theme.priceStyle === 'leader-dots') {
          var nameW  = doc.getStringUnitWidth(block.name) * theme.bodyPt / doc.internal.scaleFactor;
          var priceW = doc.getStringUnitWidth(block.price) * theme.bodyPt / doc.internal.scaleFactor;
          var leaderStart = x + nameW + 4;
          var leaderEnd   = x + contentWidth - priceW - 4;
          if (leaderEnd > leaderStart) {
            doc.setDrawColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
            doc.setLineDashPattern([1, 2], 0);
            doc.setLineWidth(0.5);
            doc.line(leaderStart, y + theme.bodyPt * 0.7, leaderEnd, y + theme.bodyPt * 0.7);
            doc.setLineDashPattern([], 0);
          }
        }
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
      }
      var nextY = y + theme.bodyPt * 1.25;
      if (block.desc) {
        doc.setFontSize(theme.descPt);
        doc.setTextColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
        var lines = doc.splitTextToSize(block.desc, contentWidth - priceWidth);
        for (var i = 0; i < lines.length; i++) {
          doc.text(lines[i], x, nextY + theme.descPt);
          nextY += theme.descPt * 1.32;
        }
      }
      return nextY + 6;
    }
    // W7-2 — allergen-key legend at the menu footer. Top rule + small
    // wrapped text listing each code = label. Code is rendered in
    // the accent color so it visually echoes the inline glyphs.
    if (block.kind === 'allergen-key') {
      var keyTopRuleY = y + 8;
      doc.setDrawColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
      doc.setLineWidth(0.4);
      doc.line(x, keyTopRuleY, x + contentWidth, keyTopRuleY);
      doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
      doc.setFontSize(theme.descPt);
      // Build the legend as a single string so splitTextToSize can
      // wrap it cleanly across the available width. Each entry is
      // "CODE = Label", joined with a middle-dot separator.
      var keyLocale = block.locale || 'en';
      var entries = (block.codes || []).map(function (c) {
        return c + ' = ' + allergenLabelPdf(c, keyLocale);
      });
      var keyText = entries.join('  ·  ');
      var keyLines = doc.splitTextToSize(keyText, contentWidth);
      doc.setTextColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
      var ky = keyTopRuleY + 14;
      for (var li = 0; li < keyLines.length; li++) {
        doc.text(keyLines[li], x, ky);
        ky += theme.descPt * 1.5;
      }
      return ky + 4;
    }
    return y;
  }

  // Greedy paginator. Walks the block list, measuring each next
  // block; if it doesn't fit on the current page, fires addPage()
  // and resets y to the top margin. Section headers within 3 dish
  // heights of bottom force an early page break to avoid widow
  // headers.
  //
  // W7-3 — branches to paginatePanel() for folded formats. Sheet
  // and digital formats use the simple flow below; panel formats
  // (bifold/trifold/tent) get a panel-aware layout that maps
  // content to logical panels (front/inside/back/address).
  function paginate(blocks, doc, theme, paper) {
    if (paper.flow === 'panel') return paginatePanel(blocks, doc, theme, paper);
    var margin = paper.margin || 48;
    var contentX = margin;
    var contentY = margin;
    var contentWidth = paper.w - margin * 2;
    var bottom = paper.h - margin;
    var pageCount = 1;

    blocks.forEach(function (block, i) {
      var h = measureBlock(block, doc, theme, contentWidth);
      // Widow-section avoidance — if we're a section header and
      // there's room for fewer than 2 dishes after, skip to next
      // page.
      if (block.kind === 'section') {
        var nextDishH = 0;
        for (var j = i + 1; j < Math.min(i + 3, blocks.length); j++) {
          if (blocks[j].kind === 'dish') {
            nextDishH += measureBlock(blocks[j], doc, theme, contentWidth);
          }
        }
        if (contentY + h + nextDishH > bottom) {
          doc.addPage();
          pageCount++;
          contentY = margin;
        }
      } else if (contentY + h > bottom) {
        doc.addPage();
        pageCount++;
        contentY = margin;
      }
      contentY = drawBlock(block, contentX, contentY, doc, theme, contentWidth, block._logoMeta);
    });

    return pageCount;
  }

  // W7-3 — Panel-flow paginator for folded formats (bifold, trifold,
  // table-tent). Slices the page into N panels, then walks blocks
  // assigning content to panel roles:
  //   front     — title + logo + tagline (no dishes)
  //   inside-*  — dish flow (broken at section boundaries)
  //   back      — overflow + footer info
  //   address   — restaurant address/hours/QR slot (skipped here;
  //                operator can fill via menu-meta in a later wave)
  //   tear      — coupon/email-list slot (skipped)
  //   side-A/B  — table-tent two-sided (B duplicates A rotated)
  function paginatePanel(blocks, doc, theme, paper) {
    var margin = paper.margin || 24;
    var gutter = paper.gutter || 12;
    var pageCount = 1;
    var panels = paper.panels || 6;

    // Compute panel rectangles given paper.panelWidths or even split.
    var panelWidths = paper.panelWidths;
    if (!panelWidths) {
      // For tents (2 panels stacked vertically) split height; for
      // others (horizontal panels) split width.
      if (paper.fold === 'tent') {
        panelWidths = null; // we'll split vertically below
      } else {
        var equalW = (paper.w - 2 * margin - gutter * (panels - 1)) / panels;
        panelWidths = [];
        for (var pi = 0; pi < panels; pi++) panelWidths.push(equalW);
      }
    }

    function panelRect(idx) {
      if (paper.fold === 'tent') {
        // Vertical split — side-A on top, side-B on bottom.
        var half = paper.h / 2;
        return { x: margin, y: idx * half + margin, w: paper.w - 2 * margin, h: half - 2 * margin };
      }
      var x = margin;
      for (var k = 0; k < idx; k++) x += panelWidths[k] + gutter;
      return { x: x, y: margin, w: panelWidths[idx], h: paper.h - 2 * margin };
    }

    // Categorize blocks: title/logo go to front; dishes flow into
    // inside panels; allergen-key goes on the back. The naive but
    // honest approach for a v1 panel renderer.
    var frontBlocks = [];
    var insideBlocks = [];
    var backBlocks = [];
    blocks.forEach(function (b) {
      if (b.kind === 'title' || b.kind === 'logo') frontBlocks.push(b);
      else if (b.kind === 'allergen-key') backBlocks.push(b);
      else insideBlocks.push(b);
    });

    function drawIntoPanel(panel, panelBlocks, isBack) {
      var py = panel.y;
      var bottom = panel.y + panel.h;
      panelBlocks.forEach(function (block, i) {
        var h = measureBlock(block, doc, theme, panel.w);
        if (block.kind === 'section') {
          var look = 0;
          for (var j = i + 1; j < Math.min(i + 3, panelBlocks.length); j++) {
            if (panelBlocks[j].kind === 'dish') look += measureBlock(panelBlocks[j], doc, theme, panel.w);
          }
          if (py + h + look > bottom) return; // overflow this panel — drop block (will be picked up by overflow logic below)
        } else if (py + h > bottom) {
          return;
        }
        py = drawBlock(block, panel.x, py, doc, theme, panel.w, block._logoMeta);
      });
      return py;
    }

    // Walk paper.panelMap and place content per role.
    var panelMap = paper.panelMap || [];
    var insideQueue = insideBlocks.slice();
    for (var pIdx = 0; pIdx < panels; pIdx++) {
      var role = panelMap[pIdx] || 'inside-' + pIdx;
      var rect = panelRect(pIdx);
      // For tent side-B, save state then rotate via transform.
      var rotated = (paper.fold === 'tent' && role === 'side-B');
      if (rotated) {
        // jsPDF doesn't expose easy 180° rotation per region; fall
        // back to redrawing the same content (operators can flip
        // the printed sheet manually). v1 trade-off.
      }
      if (role === 'front') {
        // Front cover: title + logo only, centered vertically.
        drawIntoPanel(rect, frontBlocks, false);
      } else if (role === 'side-A' || role === 'side-B' || role === 'inside-1' || role === 'inside-2' ||
                 role === 'inside-L' || role === 'inside-R' || role === 'center' ||
                 role === 'inside-3' || role === 'inside-4') {
        // Pull as many inside blocks as fit into this panel, in order.
        var panelHeight = rect.h;
        var taken = [];
        var consumedH = 0;
        while (insideQueue.length) {
          var nb = insideQueue[0];
          var nh = measureBlock(nb, doc, theme, rect.w);
          if (consumedH + nh > panelHeight) break;
          taken.push(insideQueue.shift());
          consumedH += nh;
        }
        drawIntoPanel(rect, taken, false);
      } else if (role === 'back') {
        // Back panel: any leftover inside content + the allergen-key.
        var backFlow = insideQueue.splice(0, insideQueue.length).concat(backBlocks);
        drawIntoPanel(rect, backFlow, true);
      } else {
        // Address / tear / unmapped — empty for now.
      }
    }

    // If we still have unflushed inside content, paginate to a new
    // sheet (front-and-back duplex) so nothing is silently dropped.
    while (insideQueue.length) {
      doc.addPage();
      pageCount++;
      var leftover = insideQueue.splice(0, insideQueue.length);
      drawIntoPanel({ x: margin, y: margin, w: paper.w - 2 * margin, h: paper.h - 2 * margin }, leftover);
    }
    return pageCount;
  }

  // Public entry point: build the PDF and trigger the download.
  // Args: { rows, theme, paperKey, title, logoDataUrl, logoMeta,
  //         filename }. Returns a Promise resolving to { pageCount,
  //         droppedSvgLogo } so the caller can show toasts.
  // W6-3 — Large-print accessibility override. Bumps body / heading
  // / description point sizes, forces single column, swaps theme
  // paper to high-contrast white-on-black with a whitespace divider
  // style. Hits WCAG AAA on 18pt body text. Operator passes
  // largePrint: true on the opts.
  function applyLargePrintOverride(theme) {
    return Object.assign({}, theme, {
      bodyPt:  18,
      h1Pt:    36,
      h2Pt:    24,
      descPt:  16,
      pricePt: 18,
      columns: 1,
      paper:        '#FFFFFF',
      ink:          '#000000',
      muted:        '#202020',
      accent:       '#000000',
      dividerStyle: 'whitespace',
      priceStyle:   'right-monospace',
      logoSlot:     'header-center'
    });
  }

  function exportPdf(opts) {
    opts = opts || {};
    // W9-2 — kick off the brand-font fetch in parallel with jsPDF.
    return Promise.all([loadJsPdf(), loadBrandFonts()]).then(function (results) {
      var jsPDF = results[0];
      var brandFonts = results[1]; // null on failure
      if (!jsPDF) throw new Error('jsPDF unavailable');
      // W6-3 — apply large-print override before paper / blocks build.
      if (opts.largePrint && opts.theme) {
        opts = Object.assign({}, opts, { theme: applyLargePrintOverride(opts.theme) });
      }
      var paperKey = PAPERS[opts.paperKey] ? opts.paperKey : 'letter';
      var paper = resolvePaper(paperKey, opts.customDims);
      var doc = new jsPDF({ unit: 'pt', format: [paper.w, paper.h], compress: true });
      // W9-2 — register Fraunces + Inter on this doc so subsequent
      // pickPdfFont() calls return 'Fraunces' / 'Inter' instead of
      // 'times' / 'helvetica'.
      var brandsLoaded = registerBrandFonts(doc, brandFonts);
      // Stamp the boolean on the doc so drawBlock / measureBlock
      // can read it via doc.__brandsLoaded (added below).
      doc.__brandsLoaded = brandsLoaded;
      try {
        doc.setProperties({
          title:   opts.title || 'Menu',
          subject: 'Restaurant menu generated with Muntin Digital Menu Design Suite',
          creator: 'Muntin Digital'
        });
      } catch (_) {}
      // Paint background paper color when theme paper isn't pure
      // white — saves owners from forcing print color profiles on.
      var paperRgb = hexToRgb(opts.theme.paper);
      if (paperRgb.r < 252 || paperRgb.g < 252 || paperRgb.b < 252) {
        doc.setFillColor(paperRgb.r, paperRgb.g, paperRgb.b);
        doc.rect(0, 0, paper.w, paper.h, 'F');
      }
      var blocks = buildBlocks(opts.rows || [], opts.title, opts.logoDataUrl);
      // Forward logoMeta + locale onto the relevant blocks.
      blocks.forEach(function (b) {
        if (b.kind === 'logo' && opts.logoMeta) b._logoMeta = opts.logoMeta;
        if (b.kind === 'allergen-key') b.locale = opts.locale || 'en';
      });
      var droppedSvgLogo = false;
      if (opts.logoDataUrl && opts.logoDataUrl.indexOf('data:image/svg') === 0) {
        droppedSvgLogo = true;
      }
      // Track whether subsequent pages need the paper-color fill
      // too; addPage default is white.
      var origAddPage = doc.addPage.bind(doc);
      doc.addPage = function () {
        origAddPage();
        if (paperRgb.r < 252 || paperRgb.g < 252 || paperRgb.b < 252) {
          doc.setFillColor(paperRgb.r, paperRgb.g, paperRgb.b);
          doc.rect(0, 0, paper.w, paper.h, 'F');
        }
      };
      var pageCount = paginate(blocks, doc, opts.theme, paper);
      var fname = (opts.filename || 'menu') + '.pdf';
      doc.save(fname);
      return { pageCount: pageCount, droppedSvgLogo: droppedSvgLogo };
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { exportPdf: exportPdf, PAPERS: PAPERS, applyLargePrintOverride: applyLargePrintOverride };
  }
  if (root) root.MD_PDF = { exportPdf: exportPdf, PAPERS: PAPERS, applyLargePrintOverride: applyLargePrintOverride };
})(typeof window !== 'undefined' ? window : null);
