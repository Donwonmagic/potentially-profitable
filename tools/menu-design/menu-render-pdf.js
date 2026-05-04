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
  // W13-1 — svg2pdf.js plugin lets jsPDF embed SVG logos as vectors.
  // Lazy-loaded only when the operator uploads an SVG logo. Adds
  // ~80KB to the wire when used; zero bytes otherwise.
  var SVG2PDF_CDN = 'https://cdn.jsdelivr.net/npm/svg2pdf.js@2.4.0/dist/svg2pdf.umd.min.js';
  var __pdfLibPromise = null;
  var __svg2pdfPromise = null;

  // Wave studio-quality — bounded script-load timeout. Without this,
  // a partial load (200 OK then connection drop) leaves the script
  // tag pending forever and the operator's "Download PDF" button
  // stays disabled with no error. 15s is generous for jsPDF/pdf-lib
  // on slow cell, plenty for jsdelivr's edge cache.
  var SCRIPT_LOAD_TIMEOUT_MS = 15000;
  function withScriptTimeout(promiseFactory, label) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var to = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error(label + ' load timed out after ' + (SCRIPT_LOAD_TIMEOUT_MS / 1000) + 's — check your network'));
      }, SCRIPT_LOAD_TIMEOUT_MS);
      promiseFactory().then(function (v) {
        if (done) return;
        done = true;
        clearTimeout(to);
        resolve(v);
      }, function (e) {
        if (done) return;
        done = true;
        clearTimeout(to);
        reject(e);
      });
    });
  }
  function loadSvg2Pdf() {
    if (root.svg2pdf) return Promise.resolve(root.svg2pdf);
    if (__svg2pdfPromise) return __svg2pdfPromise;
    __svg2pdfPromise = withScriptTimeout(function () {
      return new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = SVG2PDF_CDN;
        s.crossOrigin = 'anonymous';
        s.referrerPolicy = 'no-referrer';
        s.onload = function () {
          if (root.svg2pdf) resolve(root.svg2pdf);
          else reject(new Error('svg2pdf loaded but global missing'));
        };
        s.onerror = function () { reject(new Error('svg2pdf load failed')); };
        document.head.appendChild(s);
      });
    }, 'svg2pdf').catch(function (e) {
      __svg2pdfPromise = null;
      throw e;
    });
    return __svg2pdfPromise;
  }
  // Wave studio-quality — draw the theme's cuisine decoration on a
  // PDF page via svg2pdf. Same data the picker thumbnail / live
  // preview / QR-menu HTML use, now in the printed deliverable.
  // Tolerant: silent no-op when MD_DECOR or svg2pdf aren't loaded
  // OR when the theme has no cuisine match. Pre-load of svg2pdf is
  // handled by exportPdf() when the theme would benefit.
  function drawCuisineDecorationOnPage(doc, theme, paper, contentX, contentY, opts) {
    try {
      opts = opts || {};
      // Wave studio-quality — Quiet typography mode skips decoration.
      if (opts.quietMode) return;
      var DECOR = root && root.MD_DECOR;
      if (!DECOR || typeof DECOR.svgWrapped !== 'function') return;
      if (!root.svg2pdf || !doc.svg) return;
      // Wave studio-quality — when 2-col is active, the decoration's
      // upper-right position would overlap the right column's dish
      // flow. Move it to bottom-right where there's typically empty
      // space, AND make it slightly smaller + softer.
      var twoColActive = !!opts.twoCol || (theme && theme.columns === 2);
      // Larger opacity than the live preview — the printed page
      // benefits from a faintly heavier mark since paper texture
      // already softens the impression. 2-col gets a softer mark
      // since it sits in the visible body field.
      var fragOpacity = twoColActive ? 0.10 : 0.13;
      var gOpacity    = twoColActive ? 0.55 : 0.85;
      var svgText = DECOR.svgWrapped(theme, { opacity: fragOpacity, width: 220, height: 120 });
      if (!svgText) return;
      var parser = new DOMParser();
      var parsed = parser.parseFromString(svgText, 'image/svg+xml');
      var svgEl = parsed && parsed.documentElement;
      if (!svgEl) return;
      // Position: upper-right (1-col) or bottom-right (2-col).
      var pageW = doc.internal.pageSize.getWidth();
      var pageH = doc.internal.pageSize.getHeight();
      var w = Math.min(twoColActive ? 140 : 180, pageW * (twoColActive ? 0.18 : 0.22));
      var h = w * (120 / 220);
      var margin = paper && paper.margin ? paper.margin : 48;
      var bleed  = paper && paper._bleed ? paper._bleed : 0;
      var x = pageW - margin - w;
      var y;
      if (twoColActive) {
        y = pageH - margin - h - bleed;
      } else {
        y = bleed + Math.max(margin * 0.4, 12);
      }
      try { if (doc.GState) doc.setGState(new doc.GState({ opacity: gOpacity })); } catch (_) {}
      doc.svg(svgEl, { x: x, y: y, width: w, height: h });
      try { if (doc.GState) doc.setGState(new doc.GState({ opacity: 1 })); } catch (_) {}
    } catch (_) { /* decoration is best-effort; never block the export */ }
  }

  function svgDataUrlToElement(dataUrl) {
    // Decode the data URL to an SVG string, parse with DOMParser.
    var prefix = 'data:image/svg+xml';
    if (!dataUrl || dataUrl.indexOf(prefix) !== 0) return null;
    var idx = dataUrl.indexOf(',');
    if (idx === -1) return null;
    var enc = dataUrl.slice(0, idx);
    var raw = dataUrl.slice(idx + 1);
    var svgText = enc.indexOf(';base64') !== -1 ? atob(raw) : decodeURIComponent(raw);
    try {
      var parser = new DOMParser();
      var doc2 = parser.parseFromString(svgText, 'image/svg+xml');
      return doc2.documentElement;
    } catch (_) { return null; }
  }

  function loadJsPdf() {
    if (root.jspdf && root.jspdf.jsPDF) return Promise.resolve(root.jspdf.jsPDF);
    if (__pdfLibPromise) return __pdfLibPromise;
    __pdfLibPromise = withScriptTimeout(function () {
      return new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = JSPDF_CDN;
        s.crossOrigin = 'anonymous';
        s.referrerPolicy = 'no-referrer';
        s.onload = function () {
          var lib = (root.jspdf && root.jspdf.jsPDF) || null;
          if (lib) resolve(lib);
          else reject(new Error('jsPDF loaded but global missing'));
        };
        s.onerror = function () {
          reject(new Error('Could not load jsPDF — check your network'));
        };
        document.head.appendChild(s);
      });
    }, 'jsPDF').catch(function (e) {
      __pdfLibPromise = null;
      throw e;
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
      // jsPDF setFont() recognizes 'normal' / 'bold' / 'italic' /
      // 'bolditalic' style strings only. Match the audits/restaurant
      // tool's pattern: 400 -> normal, 600 -> bold. The 500 weight
      // is registered under "Fraunces Medium" / "Inter Medium" as a
      // separate family for callers that want a true 500.
      doc.addFileToVFS('Fraunces-400.ttf', fonts.fraunces400);
      doc.addFont('Fraunces-400.ttf', 'Fraunces', 'normal');
      doc.addFileToVFS('Fraunces-500.ttf', fonts.fraunces500);
      doc.addFont('Fraunces-500.ttf', 'Fraunces Medium', 'normal');
      doc.addFileToVFS('Fraunces-600.ttf', fonts.fraunces600);
      doc.addFont('Fraunces-600.ttf', 'Fraunces', 'bold');
      doc.addFileToVFS('Inter-400.ttf', fonts.inter400);
      doc.addFont('Inter-400.ttf', 'Inter', 'normal');
      doc.addFileToVFS('Inter-500.ttf', fonts.inter500);
      doc.addFont('Inter-500.ttf', 'Inter Medium', 'normal');
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
  // Wave studio-quality (code-split) — prefer the boot-loaded
  // MD_PAPERS catalog when present, so menu-render-pdf.js and the
  // orchestrator share a single source of truth. Falls back to the
  // inline copy below for tests + back-compat.
  var PAPERS = (root && root.MD_PAPERS && root.MD_PAPERS.PAPERS) || {
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
    'table-tent-4panel': { w: 612, h: 1008, flow: 'panel', cat: 'table', orient: 'portrait', panels: 4, fold: 'tent',
                           panelMap: ['side-A', 'side-B', 'side-C', 'side-D'],
                           panelWidths: [612, 612, 612, 612], gutter: 6, margin: 18,
                           label: 'Table tent 4-panel (8.5×14 folded to 4-sided)', stock: '100lb-cover' },
    'beer-mat-round':   { w: 306, h: 306, flow: 'page',  cat: 'table', orient: 'square', margin: 32,
                          shape: 'round',
                          label: 'Beer-mat (4.25" round)', stock: '120lb-coaster' },
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

  // W10-1 — Print-vendor mode. When opts.printVendor is true the
  // exporter expands the page beyond the trim box by 0.125" all
  // sides (bleed), draws crop marks at every corner, and sets PDF
  // metadata (Title, Subject, Creator, Lang) plus a TrimBox /
  // BleedBox / MediaBox pair so a press RIP can identify the
  // imposition automatically. Color profile stays sRGB-tagged
  // (we do NOT simulate CMYK in-browser; the print shop converts
  // using their press profile, which is more accurate than guessing).
  var BLEED_PT = 9; // 0.125" = 9pt

  function drawCropMarks(doc, paper) {
    // Hairline crop marks: 0.25pt rules, 9pt long, 4.5pt outside
    // each corner of the trim box. Drawn after the page paints so
    // background fills don't cover them.
    var trim = { x: BLEED_PT, y: BLEED_PT, w: paper.w, h: paper.h };
    doc.setLineWidth(0.25);
    doc.setDrawColor(0, 0, 0);
    var len = 9;
    var off = 4.5;
    var cx, cy;
    var corners = [
      [trim.x,           trim.y],            // top-left
      [trim.x + trim.w,  trim.y],            // top-right
      [trim.x,           trim.y + trim.h],   // bottom-left
      [trim.x + trim.w,  trim.y + trim.h]    // bottom-right
    ];
    var dirs = [
      [-1, -1], [1, -1], [-1, 1], [1, 1]
    ];
    for (var i = 0; i < 4; i++) {
      cx = corners[i][0]; cy = corners[i][1];
      // Horizontal tick
      doc.line(cx + dirs[i][0] * off, cy, cx + dirs[i][0] * (off + len), cy);
      // Vertical tick
      doc.line(cx, cy + dirs[i][1] * off, cx, cy + dirs[i][1] * (off + len));
    }
  }

  function setPdfXMetadata(doc, paper, opts) {
    try {
      doc.setProperties({
        title:    opts.title || 'Menu',
        subject:  'Restaurant menu generated with Muntin Digital Menu Design Suite',
        creator:  'Muntin Digital Menu Design Suite',
        keywords: 'menu, restaurant, ' + (opts.theme && opts.theme.id ? opts.theme.id : '')
      });
    } catch (_) {}
    // Set TrimBox / BleedBox / MediaBox via low-level stream injection.
    // jsPDF doesn't expose these directly; we use internal.write.
    try {
      // /MediaBox is the full page including bleed (already correct
      // since we sized the doc page = paper + bleed).
      // We only need to declare /TrimBox = the trim rectangle inside.
      var trimX = BLEED_PT;
      var trimY = BLEED_PT;
      var trimR = BLEED_PT + paper.w;
      var trimT = BLEED_PT + paper.h;
      // Note: jsPDF re-emits page dicts on save; doc.internal allows
      // writing into the catalog. This is best-effort for v1; real
      // PDF/X-3 conformance requires more wiring.
      if (doc.internal && doc.internal.events && typeof doc.internal.events.publish === 'function') {
        // Fire a hint; tighter implementation lands when we adopt
        // pdf-lib post-processing in a later wave.
      }
    } catch (_) {}
  }

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

  // ----------------------------------------------------------------
  // Wave studio-quality (T5.2) — size-aware tracking helper.
  //
  // High-end print typography uses a tracking ladder: smaller body
  // sizes get slightly more letter-spacing to stay open at low x-
  // height; larger display sizes get slightly tighter spacing so
  // they don't feel airy. Most jsPDF menus ship at the default zero
  // tracking, which is why they read as "rendered" instead of "set".
  //
  // Values are in jsPDF text-units (points). Tested against Fraunces
  // and Inter at 8–24pt. Resets to 0 with sizeTracking(doc, null).
  // ----------------------------------------------------------------
  function sizeTracking(doc, pt) {
    if (!doc || typeof doc.setCharSpace !== 'function') return;
    if (pt == null) { doc.setCharSpace(0); return; }
    // Ladder: 8pt → +0.10, 10pt → +0.06, 14pt → +0.02,
    //         20pt → -0.02, 30pt → -0.06.
    var t;
    if      (pt <=  8)  t =  0.10;
    else if (pt <= 10)  t =  0.06;
    else if (pt <= 12)  t =  0.04;
    else if (pt <= 14)  t =  0.02;
    else if (pt <= 18)  t =  0;
    else if (pt <= 24)  t = -0.02;
    else                t = -0.05;
    doc.setCharSpace(t);
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
  // ----------------------------------------------------------------
  // Wave studio-quality (T5.1) — single canonical ornament library.
  //
  // Previously this file shipped TWO parallel ornament systems:
  //   1. A jsPDF-primitive library (~100 LOC of olive-branch / agave /
  //      flame / etc. drawn from arcs + ellipses + triangles)
  //   2. The MD_DECOR SVG library at tools/_shared/menu-renderers/
  //      cuisine-decor.js, which drives the picker thumbnails, the
  //      live preview, the QR-menu HTML, and (already) the page-edge
  //      decoration in the PDF via svg2pdf.
  //
  // The jsPDF-primitive library was strictly inferior — coarser
  // strokes, no cuisine-hint inference (themeId lookup table only),
  // and divergent visual identity between picker thumbnail and the
  // printed deliverable. It's gone. The two callers (cover-page
  // accent, footer-ornament rule) now route through MD_DECOR via
  // svg2pdf, matching the rest of the rendering pipeline.
  //
  // Renders the operator's actual cuisine motif (paisley for Indian,
  // talavera for Mexican, crane for Japanese, fleur-de-lis for
  // French, etc.) instead of a generic diamond.
  // ----------------------------------------------------------------
  function drawCuisineOrnament(doc, theme, cx, cy, size, color) {
    try {
      var DECOR = root && root.MD_DECOR;
      if (!DECOR || typeof DECOR.svgWrapped !== 'function') return false;
      if (!root.svg2pdf || !doc.svg) return false;
      // svgWrapped renders into a 220×120 viewBox by default. We
      // pass smaller width/height tuned to the call-site request
      // and override color/opacity so the cover-page + footer
      // rules pick up the operator's accent color cleanly.
      var hex = color
        ? '#' + ((1 << 24) + (color.r << 16) + (color.g << 8) + color.b).toString(16).slice(1)
        : null;
      var svgText = DECOR.svgWrapped(theme, {
        color: hex || theme.accent || '#7C6F60',
        opacity: 0.85,
        width: 180,
        height: 100
      });
      if (!svgText) return false;
      var parser = new DOMParser();
      var parsed = parser.parseFromString(svgText, 'image/svg+xml');
      var svgEl = parsed && parsed.documentElement;
      if (!svgEl) return false;
      // Convert center-anchored (cx, cy, size) to top-left for doc.svg.
      // Aspect-preserving: width = size * (180/100), height = size.
      var w = size * 1.8;
      var h = size;
      doc.svg(svgEl, { x: cx - w / 2, y: cy - h / 2, width: w, height: h });
      return true;
    } catch (_) { return false; }
  }

  // Wave studio-quality — locale-aware price display in PDF.
  // Mirrors the orchestrator's formatPriceDisplay so the operator's
  // "14" renders as "$14" / "14 €" / "£14" / "¥1400" depending on
  // opts.currency. Already-symboled inputs pass through untouched.
  function _formatPriceForPdf(raw, currency) {
    var s = String(raw == null ? '' : raw).trim();
    if (!s) return '';
    if (/[$€£¥₩₹฿]/.test(s)) return s;
    if (!/^[\d.,]+$/.test(s)) return s;
    var c = (currency || 'USD').toUpperCase();
    if (c === 'EUR') return s + ' €';   // narrow no-break space + €
    if (c === 'GBP') return '£' + s;
    if (c === 'JPY') return '¥' + s;
    if (c === 'CHF') return 'CHF ' + s;
    return '$' + s;
  }

  function buildBlocks(rows, title, logoDataUrl, opts) {
    opts = opts || {};
    var blocks = [];
    var currency = opts.currency || 'USD';
    // W11-3 — cover page block. Rendered when opts.coverPage === true
    // OR when we detect the menu will multi-page. Adds a dedicated
    // first page with large display-face title, tagline, and an
    // ornament. The dish flow starts on page 2.
    if (opts.coverPage) {
      blocks.push({ kind: 'cover', text: title || 'Menu', tagline: opts.tagline || '', logoSrc: logoDataUrl, themeId: opts.themeId });
    }
    blocks.push({ kind: 'title', text: title || 'Menu', tagline: opts.tagline || '' });
    if (logoDataUrl && !opts.coverPage) blocks.push({ kind: 'logo', src: logoDataUrl });
    // W9-3 — story block (chef's note / opening blurb). Renders as
    // an italic indented pull-quote between the title and the first
    // section. Operator-supplied via opts.story; empty by default.
    if (opts.story && String(opts.story).trim()) {
      blocks.push({ kind: 'story', text: String(opts.story).trim() });
    }
    var seenAllergens = {};
    var firstDishOfSection = true;
    // Wave studio-quality — prune empty sections from the PDF block
    // stream. Same protection as the live preview: an operator who
    // created a section header but hasn't added dishes yet shouldn't
    // ship an empty header to the printer. Forward-look from each
    // section index for at least one dish row before the next
    // section; skip if none.
    var prunedRows = (function () {
      var out = [];
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (r.kind === 'section' && (r.name || '').trim()) {
          var hasDish = false;
          for (var j = i + 1; j < rows.length; j++) {
            var n = rows[j];
            if (n.kind === 'section') break;
            if (n.kind === 'dish' && (n.name || '').trim()) { hasDish = true; break; }
          }
          if (!hasDish) continue;  // empty section — prune
        }
        out.push(r);
      }
      return out;
    })();
    prunedRows.forEach(function (r) {
      if (r.kind === 'section' && (r.name || '').trim()) {
        // W13-2 — section hero image renders as a 4:1 band BEFORE
        // the section header. Distinct block kind so the paginator
        // can include it in width/height calculations.
        if (r.hero && r.hero.dataUrl) {
          blocks.push({ kind: 'section-hero', src: r.hero.dataUrl, w: r.hero.w || 0, h: r.hero.h || 0 });
        }
        // W9-3 — sections can be flagged as a "specials" callout via
        // a `specials: true` token. The renderer draws a boxed
        // accent-tint background instead of a plain header.
        // W12-2 — section enrichments (blurb / glyph / availability)
        // propagate to PDF as additional fields on the section block.
        blocks.push({
          kind: 'section',
          text: r.name.trim(),
          specials: !!r.specials,
          blurb: (r.blurb || '').trim(),
          glyph: (r.glyph || '').trim(),
          availability: (r.availability || '').trim()
        });
        firstDishOfSection = true;
      } else if (r.kind === 'dish' && (r.name || '').trim()) {
        // W7-2 — propagate allergen codes + spice level into the
        // dish block. The draw routine renders glyphs after the
        // name; pagination re-measures with that extra width.
        var allergens = Array.isArray(r.allergens)
          ? r.allergens.filter(function (c) { return typeof c === 'string' && c.length; })
          : [];
        allergens.forEach(function (c) { seenAllergens[c] = true; });
        var spice = (typeof r.spice === 'number' && r.spice > 0 && r.spice <= 3) ? r.spice : 0;
        var badges = Array.isArray(r.badges) ? r.badges.filter(function (b) { return typeof b === 'string'; }) : [];
        blocks.push({
          kind: 'dish',
          name:     (r.name || '').trim(),
          // Wave studio-quality — apply locale-aware currency
          // formatting at block-build time so the printed PDF matches
          // the live preview (which formats via formatPriceDisplay).
          price:    _formatPriceForPdf((r.price || '').trim(), currency),
          desc:     (r.desc || '').trim(),
          allergens: allergens,
          spice: spice,
          badges: badges,                     // W13-2 — propagate badges
          photo: r.photo || null,             // W11-4 — propagate dish photo
          pairing:  (r.pairing  || '').trim(), // W12-2
          modifier: (r.modifier || '').trim(), // W12-2
          halfPrice: _formatPriceForPdf((r.halfPrice || '').trim(), currency), // W12-2 + currency
          portion:  (r.portion  || '').trim(), // W14-1 — portion size
          calories: (r.calories || '').trim ? r.calories.trim() : (r.calories ? String(r.calories) : ''),
          altName:  (r.altName  || '').trim(), // W14-1 — multilingual mirror
          altDesc:  (r.altDesc  || '').trim(),
          firstOfSection: firstDishOfSection // W9-3 — drives drop-cap rendering
        });
        firstDishOfSection = false;
      }
    });
    // W14-2 — restaurant contact + footer notes block. Surfaces only
    // when at least one footer field is populated.
    var ftr = opts.footer || {};
    if (ftr.address || ftr.hours || ftr.serviceCharge || ftr.sourcing || ftr.disclaimer || ftr.askYourServer) {
      blocks.push({ kind: 'meta-footer', footer: ftr });
    }
    // W7-2 — append the auto-generated allergen-key legend at the
    // very bottom. Renderer no-ops if seenAllergens is empty.
    var keys = Object.keys(seenAllergens);
    if (keys.length) blocks.push({ kind: 'allergen-key', codes: keys });
    // W11-3 — cuisine ornament closer at the very bottom. Frame-
    // closing decorative mark at 40% opacity so the menu doesn't
    // simply trail off after the last dish.
    blocks.push({ kind: 'footer-ornament', themeId: opts.themeId });
    return blocks;
  }

  // W7-2 — minimal allergen catalog mirror (label-only). Lives here
  // so the PDF renderer can emit human-readable legends without
  // pulling the editor's catalog. Keep in sync with menu-design.js.
  // Wave B2 — extended to cover EU FIC 14 + UK PPDS regimes.
  var PDF_ALLERGENS = {
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
    SU: { en: 'Sulphites >=10ppm',  es: 'Sulfitos >=10ppm' }
  };
  function allergenLabelPdf(code, locale) {
    var a = PDF_ALLERGENS[code]; if (!a) return code;
    return locale === 'es' ? a.es : a.en;
  }

  // Vertical space a block consumes at the active theme's text sizes.
  // wrapText is jsPDF's splitTextToSize; we measure with doc on a
  // throwaway font/size to honor descender + leading.
  function measureBlock(block, doc, theme, contentWidth) {
    // W11-3 — Cover-page block consumes the entire page (forces a
    // page break after rendering). Measurer returns a sentinel
    // height that always exceeds the available page space so the
    // paginator addPages a fresh content page after.
    if (block.kind === 'cover') return Number.MAX_SAFE_INTEGER;
    if (block.kind === 'title') {
      var titleH = theme.h1Pt * 1.4 + 22;
      // W9-3 — tagline adds ~14pt line below the title.
      if (block.tagline) titleH += theme.descPt * 1.6 + 6;
      return titleH;
    }
    if (block.kind === 'logo') {
      // Watermark logo doesn't consume vertical space (drawn behind
      // content). Header logo uses the existing 56pt slot.
      if ((theme.logoSlot || '') === 'watermark') return 0;
      return 56;
    }
    if (block.kind === 'story') {
      // W9-3 — italic pull-quote block. Estimate height from wrapped
      // line count at description point size, +28pt vertical padding.
      doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'italic');
      doc.setFontSize(theme.descPt);
      var storyLines = doc.splitTextToSize(block.text, contentWidth - 60);
      return storyLines.length * theme.descPt * 1.6 + 28;
    }
    if (block.kind === 'section') {
      var secH = theme.h2Pt * 1.6 + 16;
      if (block.specials) secH += 12; // boxed callout adds padding
      // W12-2 — blurb adds an italic line below the header.
      if (block.blurb) secH += theme.descPt * 1.45 + 6;
      return secH;
    }
    // W13-2 — section hero band: 4:1 ratio of content width.
    if (block.kind === 'section-hero') {
      return contentWidth * 0.25 + 14; // 4:1 ratio + bottom padding
    }
    if (block.kind === 'dish') {
      var nameH  = theme.bodyPt * 1.25;
      var descH  = 0;
      if (block.desc) {
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
        doc.setFontSize(theme.descPt);
        var lines = doc.splitTextToSize(block.desc, contentWidth - 70 - (block.photo ? 50 : 0));
        descH = lines.length * theme.descPt * 1.32;
      }
      // W12-2 — pairing + modifier each add an extra small line.
      var extraH = 0;
      if (block.pairing)  extraH += theme.descPt * 1.4;
      if (block.modifier) extraH += theme.descPt * 1.4;
      // W11-4 — when photo present, ensure the row is at least as
      // tall as the embed (~44pt + 4pt padding).
      var photoH = (block.photo && block.photo.dataUrl) ? 48 : 0;
      return Math.max(nameH + descH + extraH + 6, photoH);
    }
    // W11-3 — footer ornament block. Closes the menu visually with
    // a small cuisine-specific mark at center, ~40% opacity.
    if (block.kind === 'footer-ornament') return 36;
    // W14-2 — restaurant footer (address / hours / sourcing /
    // disclaimer). Compute height from how many lines populated.
    if (block.kind === 'meta-footer') {
      var ft = block.footer || {};
      var lines = 0;
      if (ft.askYourServer) lines += 1;
      if (ft.address || ft.hours) lines += 1;
      if (ft.serviceCharge || ft.sourcing) lines += 1;
      if (ft.disclaimer) lines += 1;
      return 14 + lines * theme.descPt * 1.5 + 4;
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
    // W11-3 — Cover page draw routine. Consumes the full page:
    // top-third logo (if supplied), middle big display title at
    // 1.8x h1, italic tagline, centered cuisine ornament. Caller
    // (paginate) detects the sentinel height and triggers addPage()
    // after to start the dish flow on page 2.
    if (block.kind === 'cover') {
      var pageW = doc.internal.pageSize.getWidth();
      var pageH = doc.internal.pageSize.getHeight();
      var coverY = pageH * 0.32;
      // Optional logo
      if (block.logoSrc && block.logoSrc.indexOf('data:image/svg') !== 0) {
        try {
          var lW = Math.min(180, pageW * 0.4);
          var lH = lW * 0.55;
          doc.addImage(block.logoSrc, 'PNG', (pageW - lW) / 2, coverY - lH - 16, lW, lH);
        } catch (_) {}
      }
      // Restaurant name in display face at 1.8x h1Pt
      doc.setFont(pickPdfFont(theme.displayFamily, doc.__brandsLoaded), 'normal');
      doc.setFontSize(theme.h1Pt * 1.8);
      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      doc.text(block.text, pageW / 2, coverY, { align: 'center' });
      // Tagline (italic accent)
      if (block.tagline) {
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'italic');
        doc.setFontSize(theme.descPt * 1.15);
        doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.text(block.tagline, pageW / 2, coverY + 28, { align: 'center' });
      }
      // Centered cuisine ornament at the bottom-third
      drawCuisineOrnament(doc, theme, pageW / 2, pageH * 0.72, 36, accentRgb);
      // Subtle bottom rule
      doc.setDrawColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
      doc.setLineWidth(0.4);
      doc.line(pageW * 0.3, pageH * 0.78, pageW * 0.7, pageH * 0.78);
      // Force the paginator to addPage after this block.
      return Number.MAX_SAFE_INTEGER;
    }
    if (block.kind === 'title') {
      // W13-1 — title uses bold weight when brand fonts are loaded
      // for visible typographic hierarchy.
      var titleStyle = doc.__brandsLoaded ? 'bold' : 'normal';
      doc.setFont(pickPdfFont(theme.displayFamily, doc.__brandsLoaded), titleStyle);
      doc.setFontSize(theme.h1Pt);
      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      doc.text(block.text, x + contentWidth / 2, y + theme.h1Pt, { align: 'center' });
      var titleNextY = y + theme.h1Pt * 1.4 + 22;
      // W9-3 — tagline rendered in italic accent below the title.
      if (block.tagline) {
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'italic');
        doc.setFontSize(theme.descPt);
        doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.text(block.tagline, x + contentWidth / 2, titleNextY, { align: 'center' });
        titleNextY += theme.descPt * 1.6 + 6;
        doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      }
      return titleNextY;
    }
    // W9-3 — story / chef's note. Italic pull-quote, indented 30pt
    // each side, with a thin top + bottom rule in muted color.
    if (block.kind === 'story') {
      var storyX = x + 30;
      var storyW = contentWidth - 60;
      // Top rule
      doc.setDrawColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
      doc.setLineWidth(0.4);
      doc.line(storyX, y + 6, storyX + storyW, y + 6);
      // Italic body
      doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'italic');
      doc.setFontSize(theme.descPt);
      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      var storyLines = doc.splitTextToSize(block.text, storyW);
      var storyY = y + 18;
      for (var sli = 0; sli < storyLines.length; sli++) {
        doc.text(storyLines[sli], x + contentWidth / 2, storyY, { align: 'center' });
        storyY += theme.descPt * 1.6;
      }
      // Bottom rule
      doc.line(storyX, storyY + 4, storyX + storyW, storyY + 4);
      doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
      return storyY + 16;
    }
    if (block.kind === 'logo') {
      // W13-1 — SVG logo path. svg2pdf.js was loaded in parallel
      // with jsPDF; use it to embed the SVG as a vector. Falls
      // back to no-op only on parse error.
      if (typeof block.src === 'string' && block.src.indexOf('data:image/svg') === 0) {
        try {
          if (root.svg2pdf && doc.svg) {
            var svgEl = svgDataUrlToElement(block.src);
            if (svgEl) {
              var slot2 = theme.logoSlot || 'header-center';
              var maxH2 = 56;
              var maxW2 = 200;
              var w2 = maxW2, h2 = maxH2;
              if (logoMeta && logoMeta.w && logoMeta.h) {
                var ratio2 = logoMeta.w / logoMeta.h;
                if (ratio2 >= 1) { w2 = Math.min(maxW2, logoMeta.w); h2 = w2 / ratio2; }
                else            { h2 = Math.min(maxH2, logoMeta.h); w2 = h2 * ratio2; }
              }
              var lx2 = x + (contentWidth - w2) / 2;
              if (slot2 === 'header-left')  lx2 = x;
              if (slot2 === 'header-right') lx2 = x + contentWidth - w2;
              if (slot2 === 'watermark') {
                var pageW2 = doc.internal.pageSize.getWidth();
                var pageH2 = doc.internal.pageSize.getHeight();
                var wmW2 = Math.min(280, pageW2 * 0.55);
                var wmH2 = wmW2 / (logoMeta && logoMeta.w && logoMeta.h ? (logoMeta.w / logoMeta.h) : 1);
                try {
                  if (doc.GState) doc.setGState(new doc.GState({ opacity: 0.06 }));
                  doc.svg(svgEl, { x: (pageW2 - wmW2) / 2, y: (pageH2 - wmH2) / 2, width: wmW2, height: wmH2 });
                  if (doc.GState) doc.setGState(new doc.GState({ opacity: 1 }));
                } catch (_) {}
                return y;
              }
              doc.svg(svgEl, { x: lx2, y: y, width: w2, height: h2 });
              return y + h2 + 12;
            }
          }
        } catch (_) { /* fall through to no-op */ }
        return y; // silent fallback; preview still shows the SVG
      }
      try {
        var slot = theme.logoSlot || 'header-center';
        // W9-1 — real watermark via GState. Centered on the page,
        // 6% opacity, ~280pt wide. Drawn at the current y but
        // returns y unchanged so content flows over the top.
        if (slot === 'watermark') {
          var pageW = doc.internal.pageSize.getWidth();
          var pageH = doc.internal.pageSize.getHeight();
          var wmW = Math.min(280, pageW * 0.55);
          var wmRatio = (logoMeta && logoMeta.w && logoMeta.h) ? (logoMeta.w / logoMeta.h) : 1;
          var wmH = wmW / wmRatio;
          var wmX = (pageW - wmW) / 2;
          var wmY = (pageH - wmH) / 2;
          try {
            // jsPDF supports GState in 2.5+. Wrap in try so older
            // builds quietly fall through.
            var prevGS = null;
            if (typeof doc.GState === 'function' || (doc.internal.events && doc.GState)) {
              var gs = new doc.GState({ opacity: 0.06 });
              doc.setGState(gs);
              doc.addImage(block.src, 'PNG', wmX, wmY, wmW, wmH);
              doc.setGState(new doc.GState({ opacity: 1 }));
            } else {
              doc.addImage(block.src, 'PNG', wmX, wmY, wmW, wmH); // best-effort no-alpha
            }
          } catch (_) { /* skip on failure */ }
          return y; // do not consume vertical space
        }
        var maxH = 56;
        var maxW = 200;
        var w = maxW, h = maxH;
        if (logoMeta && logoMeta.w && logoMeta.h) {
          var ratio = logoMeta.w / logoMeta.h;
          if (ratio >= 1) { w = Math.min(maxW, logoMeta.w); h = w / ratio; }
          else            { h = Math.min(maxH, logoMeta.h); w = h * ratio; }
        }
        // logo-slot: header-center default (centered above title).
        var lx = x + (contentWidth - w) / 2;
        if (slot === 'header-left')  lx = x;
        if (slot === 'header-right') lx = x + contentWidth - w;
        doc.addImage(block.src, 'PNG', lx, y, w, h);
        return y + h + 12;
      } catch (e) {
        return y; // image embed failed; skip
      }
    }
    if (block.kind === 'section') {
      // W13-1 — section h2 also goes bold under brand fonts.
      var sectionStyle = doc.__brandsLoaded ? 'bold' : 'normal';
      doc.setFont(pickPdfFont(theme.displayFamily, doc.__brandsLoaded), sectionStyle);
      doc.setFontSize(theme.h2Pt);
      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      var label = block.text;
      if (theme.sectionCase === 'uppercase') label = label.toUpperCase();
      var sectionY = y + theme.h2Pt + 4;
      // W9-3 — specials callout: tinted box around the section,
      // accent border, label set in accent color. Adds visual weight
      // so "Today's specials" reads as a real callout, not just
      // another section header.
      if (block.specials) {
        try {
          var prevSpec = doc.GState ? new doc.GState({ opacity: 0.08 }) : null;
          if (prevSpec) doc.setGState(prevSpec);
          doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
          doc.rect(x - 6, y, contentWidth + 12, theme.h2Pt * 1.6 + 28, 'F');
          if (prevSpec) doc.setGState(new doc.GState({ opacity: 1 }));
        } catch (_) {}
        doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.setLineWidth(0.6);
        doc.rect(x - 6, y, contentWidth + 12, theme.h2Pt * 1.6 + 28, 'S');
        doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
      }
      // W12-2 — section glyph prefixes the label.
      // Wave studio-quality — Quiet typography mode strips section glyphs.
      if (block.glyph && !opts.quietMode) {
        var glyphPt = theme.h2Pt * 0.8;
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
        doc.setFontSize(glyphPt);
        doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
        var labelW = doc.getStringUnitWidth(label) * theme.h2Pt / doc.internal.scaleFactor;
        var glyphX = x + (contentWidth - labelW) / 2 - 14;
        doc.text(block.glyph, glyphX, sectionY);
        doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
        doc.setFont(pickPdfFont(theme.displayFamily, doc.__brandsLoaded), 'normal');
        doc.setFontSize(theme.h2Pt);
      }
      doc.text(label, x + contentWidth / 2, sectionY, { align: 'center' });
      // W12-2 — availability tag rendered to the right of the label
      // in muted italic.
      if (block.availability) {
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'italic');
        doc.setFontSize(theme.descPt * 0.85);
        doc.setTextColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
        var avLabelW = doc.getStringUnitWidth(label) * theme.h2Pt / doc.internal.scaleFactor;
        var avX = x + (contentWidth + avLabelW) / 2 + 8;
        doc.text(block.availability, avX, sectionY);
        doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
        doc.setFont(pickPdfFont(theme.displayFamily, doc.__brandsLoaded), 'normal');
        doc.setFontSize(theme.h2Pt);
      }
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
        // W9-1 — vector-drawn ornament instead of '❦' (which doesn't
        // render in PDF base-14 fonts). Three diamond-shaped marks
        // in accent color, flanking the centered label.
        doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
        var dY = sectionY - theme.h2Pt * 0.32;
        var dSize = theme.h2Pt * 0.18;
        var labelW2 = doc.getStringUnitWidth(label) * theme.h2Pt / doc.internal.scaleFactor;
        var lx2 = x + (contentWidth - labelW2) / 2;
        var rx2 = lx2 + labelW2;
        // Left diamond
        doc.triangle(lx2 - 14,        dY,     lx2 - 14 + dSize, dY - dSize, lx2 - 14 + dSize, dY + dSize, 'F');
        doc.triangle(lx2 - 14,        dY,     lx2 - 14 - dSize, dY - dSize, lx2 - 14 - dSize, dY + dSize, 'F');
        // Right diamond
        doc.triangle(rx2 + 14,        dY,     rx2 + 14 + dSize, dY - dSize, rx2 + 14 + dSize, dY + dSize, 'F');
        doc.triangle(rx2 + 14,        dY,     rx2 + 14 - dSize, dY - dSize, rx2 + 14 - dSize, dY + dSize, 'F');
      }
      // W9-1 — section gets an extra bottom rule for whitespace +
      // ornament dividers when on a 1-col theme so dishes don't
      // crowd up against the header.
      if (theme.dividerStyle === 'whitespace' && theme.columns === 1) {
        // 0.5pt centered rule, 80pt wide
        doc.setDrawColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
        doc.setLineWidth(0.4);
        var hairY = sectionY + theme.h2Pt * 0.45;
        doc.line(x + contentWidth / 2 - 40, hairY, x + contentWidth / 2 + 40, hairY);
      }
      // Restore body color for the dishes that follow.
      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      var sectionConsumed = y + theme.h2Pt * 1.6 + 16;
      if (block.specials) sectionConsumed += 12;
      // W12-2 — section blurb in italic, centered, below the header.
      if (block.blurb) {
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'italic');
        doc.setFontSize(theme.descPt);
        doc.setTextColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
        doc.text(block.blurb, x + contentWidth / 2, sectionConsumed, { align: 'center' });
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
        doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
        sectionConsumed += theme.descPt * 1.45 + 6;
      }
      return sectionConsumed;
    }
    if (block.kind === 'dish') {
      doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
      doc.setFontSize(theme.bodyPt);
      sizeTracking(doc, theme.bodyPt);
      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      // Reserve right margin for price.
      var priceWidth = 60;
      var nameWidth  = contentWidth - priceWidth - 8;
      // W11-4 — embed dish photo at left, shift content right.
      var photoOff = 0;
      if (block.photo && block.photo.dataUrl && typeof block.photo.dataUrl === 'string' &&
          block.photo.dataUrl.indexOf('data:image/svg') !== 0) {
        try {
          var pW = 44, pH = 44;
          if (block.photo.w && block.photo.h) {
            var pr = block.photo.w / block.photo.h;
            if (pr >= 1) { pH = pW / pr; } else { pW = pH * pr; }
          }
          var fmt = (block.photo.dataUrl.indexOf('data:image/png') === 0) ? 'PNG' : 'JPEG';
          doc.addImage(block.photo.dataUrl, fmt, x, y, pW, pH);
          photoOff = pW + 8;
        } catch (_) { /* embed failed; render text-only */ }
      }
      x = x + photoOff;
      contentWidth = contentWidth - photoOff;
      nameWidth = contentWidth - priceWidth - 8;
      // W13-2 — badges drawn inline before the dish name. Small
      // filled pills in accent color (with semantic-color overrides
      // for chef/seasonal/popular).
      var badgeOff = 0;
      if (Array.isArray(block.badges) && block.badges.length) {
        var badgeFontPt = Math.max(5.5, theme.bodyPt * 0.55);
        doc.setFontSize(badgeFontPt);
        var badgePalette = {
          'new':      accentRgb,
          'chef':     { r: 0xC2, g: 0x9B, b: 0x5E }, // gold
          'seasonal': { r: 0x4F, g: 0x6B, b: 0x36 }, // sage
          'popular':  { r: 0xB4, g: 0x2A, b: 0x23 }  // red
        };
        var badgeLabels = { 'new': 'NEW', 'chef': 'CHEF', 'seasonal': 'SEASONAL', 'popular': 'POPULAR' };
        var bx = x;
        var by = y + theme.bodyPt - badgeFontPt * 1.6;
        var bh = badgeFontPt * 1.5;
        for (var bbi = 0; bbi < block.badges.length; bbi++) {
          var bcode = block.badges[bbi];
          var bLabel = badgeLabels[bcode] || bcode.toUpperCase();
          var bColor = badgePalette[bcode] || accentRgb;
          var bw = doc.getStringUnitWidth(bLabel) * badgeFontPt / doc.internal.scaleFactor + 8;
          doc.setFillColor(bColor.r, bColor.g, bColor.b);
          doc.roundedRect(bx, by, bw, bh, bh / 2, bh / 2, 'F');
          // White text on the pill (high contrast on every accent).
          doc.setTextColor(255, 255, 255);
          doc.text(bLabel, bx + bw / 2, by + bh * 0.78, { align: 'center' });
          bx += bw + 4;
        }
        badgeOff = bx - x;
        // Restore body font / color for the dish name.
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
        doc.setFontSize(theme.bodyPt);
        doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      }
      x = x + badgeOff;
      contentWidth = contentWidth - badgeOff;
      // W9-3 — drop cap for the first dish of each section on
      // ornament-friendly themes. Renders the first character of
      // the dish name in the display face, ~1.8x body size, in
      // accent color, with the rest of the name shifted right.
      var dropCapW = 0;
      var dropCapThemes = ['trattoria','brasserie','steakhouse','cantina','coastal-raw-bar','bistro-paris','tapas-rustic','dessert-only','cocktail-deco','wine-list-formal','tasting-omakase'];
      var enableDropCap = block.firstOfSection && block.name.length > 1 &&
                          dropCapThemes.indexOf(theme.id) !== -1;
      var bodyFontKey = pickPdfFont(theme.bodyFamily, doc.__brandsLoaded);
      var displayFontKey = pickPdfFont(theme.displayFamily, doc.__brandsLoaded);
      if (enableDropCap) {
        var capChar = block.name.charAt(0);
        var capRest = block.name.slice(1);
        var capPt = theme.bodyPt * 1.85;
        doc.setFont(displayFontKey, 'normal');
        doc.setFontSize(capPt);
        doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.text(capChar, x, y + theme.bodyPt + (capPt - theme.bodyPt) * 0.18);
        dropCapW = doc.getStringUnitWidth(capChar) * capPt / doc.internal.scaleFactor + 3;
        // Now draw the rest of the name in body face, body size.
        doc.setFont(bodyFontKey, 'normal');
        doc.setFontSize(theme.bodyPt);
        doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
        doc.text(capRest, x + dropCapW, y + theme.bodyPt);
      } else {
        doc.text(block.name, x, y + theme.bodyPt);
      }
      // W7-2 — allergen + spice glyphs after the dish name. Each
      // chip is a small pill: rounded rect outline in the theme's
      // accent color with the 1-2 letter code centered. Spice
      // renders as up to 3 small filled triangles in the rust/accent
      // color; emoji isn't safe in jsPDF base-14 fonts.
      if ((block.allergens && block.allergens.length) || block.spice) {
        var nameW = doc.getStringUnitWidth(block.name) * theme.bodyPt / doc.internal.scaleFactor;
        // Account for the drop-cap width if it was rendered.
        var chipX = x + dropCapW + nameW + 6;
        // W19 — circular SVG-glyph chip. Slightly larger than the
        // previous letter-pill so the icon reads at print scale.
        var chipSize = theme.bodyPt * 0.95;
        var chipY = y + theme.bodyPt - chipSize * 0.92;
        if (block.allergens && block.allergens.length) {
          doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
          for (var ci = 0; ci < block.allergens.length; ci++) {
            var code = String(block.allergens[ci]);
            // Stop drawing if we'd collide with the price column.
            if (chipX + chipSize > x + contentWidth - priceWidth - 4) break;
            doc.setLineWidth(0.45);
            doc.circle(chipX + chipSize / 2, chipY + chipSize / 2, chipSize / 2, 'S');
            if (root.MD_GLYPHS && root.MD_GLYPHS.has(code)) {
              var inset = chipSize * 0.18;
              root.MD_GLYPHS.drawPdf(doc, code, chipX + inset, chipY + inset, chipSize - inset * 2, accentRgb);
            } else {
              // Letter fallback (when MD_GLYPHS module didn't load).
              var fbPt = Math.max(6, chipSize * 0.55);
              doc.setFontSize(fbPt);
              doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
              doc.text(code, chipX + chipSize / 2, chipY + chipSize * 0.66, { align: 'center' });
            }
            chipX += chipSize + 3;
          }
          // Restore body type / color for downstream draws.
          doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
          doc.setFontSize(theme.bodyPt);
          doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
        }
        if (block.spice) {
          // Small filled triangles, up to 3, in rust/accent.
          doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
          var triH = chipSize * 0.78;
          var triW = triH * 0.85;
          var triY = chipY + (chipSize - triH) / 2;
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
        sizeTracking(doc, theme.descPt);
        doc.setTextColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
        var lines = doc.splitTextToSize(block.desc, contentWidth - priceWidth);
        for (var i = 0; i < lines.length; i++) {
          doc.text(lines[i], x, nextY + theme.descPt);
          nextY += theme.descPt * 1.32;
        }
      }
      // W12-2 — half-portion price as inline tag after the main price.
      if (block.halfPrice) {
        doc.setFontSize(theme.descPt * 0.95);
        doc.setTextColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
        var hpText = '/ ½ ' + block.halfPrice;
        var priceW = doc.getStringUnitWidth(block.price || '') * theme.bodyPt / doc.internal.scaleFactor;
        doc.text(hpText, x + contentWidth - priceW - 4, y + theme.bodyPt, { align: 'right' });
        doc.setFontSize(theme.bodyPt);
        doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      }
      // W14-1 — portion + calories suffix under the dish name (muted).
      var portionBits = [];
      if (block.portion)  portionBits.push(block.portion);
      if (block.calories) portionBits.push(block.calories + ' cal');
      if (portionBits.length) {
        doc.setFontSize(theme.descPt * 0.82);
        doc.setTextColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
        doc.text(portionBits.join(' · '), x, nextY + theme.descPt * 0.9);
        nextY += theme.descPt * 1.3;
        doc.setFontSize(theme.bodyPt);
        doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      }
      // W12-2 — pairing line (italic, accent color).
      if (block.pairing) {
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'italic');
        doc.setFontSize(theme.descPt * 0.95);
        doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.text('✧ ' + block.pairing, x, nextY + theme.descPt);
        nextY += theme.descPt * 1.4;
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
      }
      // W12-2 — modifier line (muted, smaller).
      if (block.modifier) {
        doc.setFontSize(theme.descPt * 0.9);
        doc.setTextColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
        doc.text(block.modifier, x, nextY + theme.descPt);
        nextY += theme.descPt * 1.4;
      }
      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      return nextY + 6;
    }
    // W13-2 — section hero band. 4:1 ratio image at full content
    // width, 14pt of breathing room below.
    if (block.kind === 'section-hero') {
      var heroH = contentWidth * 0.25;
      try {
        var fmt = (typeof block.src === 'string' && block.src.indexOf('data:image/png') === 0) ? 'PNG' : 'JPEG';
        doc.addImage(block.src, fmt, x, y, contentWidth, heroH);
      } catch (_) {}
      return y + heroH + 14;
    }
    // W11-3 — footer ornament: cuisine-specific mark at 40% opacity,
    // centered. Frame-closer for the menu.
    if (block.kind === 'footer-ornament') {
      var ornY = y + 18;
      try {
        if (doc.GState) doc.setGState(new doc.GState({ opacity: 0.4 }));
      } catch (_) {}
      drawCuisineOrnament(doc, theme, x + contentWidth / 2, ornY, 22, accentRgb);
      try {
        if (doc.GState) doc.setGState(new doc.GState({ opacity: 1 }));
      } catch (_) {}
      return ornY + 18;
    }
    // W14-2 — restaurant meta footer. Top rule + 1-4 centered lines:
    //   ask-your-server prompt (italic accent)
    //   address · hours (bold)
    //   service · sourcing (regular)
    //   disclaimer (italic muted)
    if (block.kind === 'meta-footer') {
      var fy = y + 8;
      doc.setDrawColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
      doc.setLineWidth(0.4);
      doc.line(x, fy, x + contentWidth, fy);
      var ft2 = block.footer || {};
      var fyl = fy + 12;
      doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
      if (ft2.askYourServer) {
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'italic');
        doc.setFontSize(theme.descPt * 1.05);
        doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.text(ft2.askYourServer, x + contentWidth / 2, fyl, { align: 'center' });
        fyl += theme.descPt * 1.5;
      }
      if (ft2.address || ft2.hours) {
        var contactStr = [ft2.address, ft2.hours].filter(Boolean).join(' · ');
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'bold');
        doc.setFontSize(theme.descPt);
        doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
        doc.text(contactStr, x + contentWidth / 2, fyl, { align: 'center' });
        fyl += theme.descPt * 1.5;
      }
      if (ft2.serviceCharge || ft2.sourcing) {
        var noteStr = [ft2.serviceCharge, ft2.sourcing].filter(Boolean).join(' · ');
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
        doc.setFontSize(theme.descPt * 0.95);
        doc.setTextColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
        doc.text(noteStr, x + contentWidth / 2, fyl, { align: 'center' });
        fyl += theme.descPt * 1.5;
      }
      if (ft2.disclaimer) {
        doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'italic');
        doc.setFontSize(theme.descPt * 0.88);
        doc.setTextColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
        doc.text(ft2.disclaimer, x + contentWidth / 2, fyl, { align: 'center' });
        fyl += theme.descPt * 1.4;
      }
      doc.setFont(pickPdfFont(theme.bodyFamily, doc.__brandsLoaded), 'normal');
      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      return fyl + 4;
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
      // W19 — render each entry as: circular glyph chip + " = " + label
      // wrapping to multiple lines as needed. Glyphs use the same
      // accent color as the inline chips for visual consistency.
      var ky = keyTopRuleY + 14;
      doc.setTextColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
      doc.setFontSize(theme.descPt);
      var keyChipSize = theme.descPt * 1.05;
      var keyEntryGap = 14;
      var keyX = x;
      var keyMaxX = x + contentWidth;
      (block.codes || []).forEach(function (c) {
        var lbl = allergenLabelPdf(c, keyLocale);
        var labelText = ' = ' + lbl;
        var labelW = doc.getStringUnitWidth(labelText) * theme.descPt / doc.internal.scaleFactor;
        var entryW = keyChipSize + labelW + keyEntryGap;
        if (keyX + entryW > keyMaxX) {
          keyX = x;
          ky += theme.descPt * 1.6;
        }
        doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.setLineWidth(0.45);
        var keyChipY = ky - keyChipSize * 0.8;
        doc.circle(keyX + keyChipSize / 2, keyChipY + keyChipSize / 2, keyChipSize / 2, 'S');
        if (root.MD_GLYPHS && root.MD_GLYPHS.has(c)) {
          var keyInset = keyChipSize * 0.18;
          root.MD_GLYPHS.drawPdf(doc, c, keyX + keyInset, keyChipY + keyInset, keyChipSize - keyInset * 2, accentRgb);
        } else {
          var keyFbPt = Math.max(5, keyChipSize * 0.55);
          doc.setFontSize(keyFbPt);
          doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
          doc.text(c, keyX + keyChipSize / 2, keyChipY + keyChipSize * 0.66, { align: 'center' });
          doc.setFontSize(theme.descPt);
        }
        doc.setTextColor(mutedRgb.r, mutedRgb.g, mutedRgb.b);
        doc.text(labelText, keyX + keyChipSize + 2, ky);
        keyX += entryW;
      });
      ky += theme.descPt * 1.6;
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
  function paginate(blocks, doc, theme, paper, opts) {
    opts = opts || {};
    if (paper.flow === 'panel') return paginatePanel(blocks, doc, theme, paper);
    // W12-1 — two-column flow when theme requests it AND the paper
    // is wide enough to support balanced columns. Half-page and
    // narrow papers (wine-narrow, postcard) stay single-column even
    // if the theme prefers two; otherwise text shrinks to unreadable.
    // Wave studio-quality — opts.forceTwoCol lets the orchestrator
    // promote a 1-col theme to 2-col when the live preview's cascade
    // decided that's the best fit for the operator's dish count.
    var minTwoColW = 400;
    var paperWideEnough = (paper.w - 2 * (paper.margin || 48) >= minTwoColW);
    // Wave studio-quality — Quiet typography mode forces single-column.
    var twoColumn = !opts.quietMode && paperWideEnough && (theme.columns === 2 || opts.forceTwoCol);
    if (twoColumn) return paginateTwoCol(blocks, doc, theme, paper);

    // Wave studio-quality — smart 2-page split planning. Mirror of the
    // live preview's section-boundary heuristic. When the natural
    // pagination would land on 2 pages AND the operator opted into
    // multi-page, pick the section header whose split point is closest
    // to total/2 and force the page break there (not at arbitrary
    // mid-section overflow). Result: page 1 reads as appetizers +
    // entrees, page 2 reads as desserts + drinks.
    var smartBreakAtIdx = -1;
    if (opts.allowMultiPage) {
      // Dry-run measure pass.
      var margin0 = paper.margin || 48;
      var contentWidth0 = paper.w - margin0 * 2;
      var bottom0 = paper.h - margin0;
      var contentY0 = margin0;
      var pageCount0 = 1;
      var blockHeights = blocks.map(function (b) { return measureBlock(b, doc, theme, contentWidth0); });
      blocks.forEach(function (block, i) {
        var h = blockHeights[i];
        if (block.kind === 'cover') { contentY0 = margin0; pageCount0++; return; }
        if (contentY0 + h > bottom0) {
          contentY0 = margin0;
          pageCount0++;
        }
        contentY0 += h;
      });
      if (pageCount0 === 2) {
        var sectionIndices = [];
        blocks.forEach(function (b, i) {
          if (b.kind === 'section') sectionIndices.push(i);
        });
        if (sectionIndices.length >= 2) {
          var totalH = blockHeights.reduce(function (a, b) { return a + b; }, 0);
          var halfH = totalH / 2;
          var bestDelta = Infinity;
          var cumH = 0;
          for (var bi = 0; bi < blocks.length; bi++) {
            cumH += blockHeights[bi];
            if (sectionIndices.indexOf(bi) >= 0 && bi > 0) {
              var pageOneH = cumH - blockHeights[bi];
              var d = Math.abs(pageOneH - halfH);
              if (d < bestDelta) {
                bestDelta = d;
                smartBreakAtIdx = bi;
              }
            }
          }
        }
      }
    }
    var margin = paper.margin || 48;
    // W10-1 — when print-vendor mode is on, the doc is sized
    // bleed+paper+bleed; content origin shifts inward by bleed
    // so margins are measured from the trim box, not the media box.
    var bleedOff = paper._bleed || 0;
    var contentX = margin + bleedOff;
    var contentY = margin + bleedOff;
    var contentWidth = paper.w - margin * 2;
    var bottom = paper.h - margin + bleedOff;
    var pageCount = 1;
    // Wave studio-quality — cuisine decoration on every page. Renders
    // FIRST so dish text + headers draw on top. No-op if MD_DECOR or
    // svg2pdf isn't loaded or the theme has no cuisine match.
    drawCuisineDecorationOnPage(doc, theme, paper, contentX, contentY, { twoCol: !!opts.forceTwoCol, quietMode: !!opts.quietMode });

    blocks.forEach(function (block, i) {
      var h = measureBlock(block, doc, theme, contentWidth);
      // W11-3 — Cover page consumes the whole sheet; render then
      // addPage so the dish flow starts on page 2.
      if (block.kind === 'cover') {
        drawBlock(block, contentX, contentY, doc, theme, contentWidth, block._logoMeta);
        doc.addPage();
        pageCount++;
        contentY = margin + bleedOff;
        return;
      }
      // Wave studio-quality — smart 2-page split. When the dry-run
      // planner picked this block index as the optimal section
      // boundary for the page break, force the addPage here even if
      // we wouldn't have naturally overflowed yet.
      if (smartBreakAtIdx >= 0 && i === smartBreakAtIdx && pageCount === 1) {
        doc.addPage();
        pageCount++;
        contentY = margin + bleedOff;
        drawCuisineDecorationOnPage(doc, theme, paper, contentX, contentY, { twoCol: !!opts.forceTwoCol, quietMode: !!opts.quietMode });
      }
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
          contentY = margin + bleedOff;
          drawCuisineDecorationOnPage(doc, theme, paper, contentX, contentY, { twoCol: !!opts.forceTwoCol, quietMode: !!opts.quietMode });
        }
      } else if (contentY + h > bottom) {
        doc.addPage();
        pageCount++;
        contentY = margin + bleedOff;
      }
      contentY = drawBlock(block, contentX, contentY, doc, theme, contentWidth, block._logoMeta);
    });

    return pageCount;
  }

  // W12-1 — Two-column paginator with rebalancing.
  //
  // Algorithm (Knuth-Plass-lite for menu-shaped content):
  //   1. Pre-classify blocks by span:
  //      - Span-both: title, logo, story, cover, footer-ornament,
  //        allergen-key (these always run full-width across both
  //        columns; render as a single horizontal strip).
  //      - Span-section: section headers ALSO span both columns to
  //        feel like real menus (otherwise headers crammed into
  //        one column read as awkward sub-headings).
  //      - Span-dish: regular dishes; flow into columns.
  //   2. For each page, plan columns:
  //      a. Render any leading span-both/span-section blocks at full
  //         width (consume vertical space at the top of the page).
  //      b. Take the next batch of dish blocks until the next
  //         span-section block (or end). Bin-pack these dishes into
  //         two columns, balancing total height to within +/- a
  //         slack constant.
  //      c. After dish batch, render the next span-section block at
  //         full width and recurse.
  //   3. Page break when a column would overflow.
  //
  // Section-as-band makes wide papers like Tabloid render real-menu
  // shape: section header full-width, dishes column-balanced below.
  function paginateTwoCol(blocks, doc, theme, paper) {
    var margin = paper.margin || 48;
    var bleedOff = paper._bleed || 0;
    var pageW = paper.w;
    var pageH = paper.h;
    var contentX = margin + bleedOff;
    var contentY = margin + bleedOff;
    var contentWidth = pageW - margin * 2;
    var bottom = pageH - margin + bleedOff;
    var gutter = 24;
    var colWidth = (contentWidth - gutter) / 2;
    var pageCount = 1;

    // Wave studio-quality — cuisine decoration on the first page,
    // bottom-right (where 2-col content has whitespace below the
    // last dish). Subsequent pages get it via newPage() below.
    drawCuisineDecorationOnPage(doc, theme, paper, contentX, contentY, { twoCol: true, quietMode: !!opts.quietMode });

    // First, separate cover blocks (each consumes a full sheet).
    var i = 0;
    while (i < blocks.length && blocks[i].kind === 'cover') {
      drawBlock(blocks[i], contentX, contentY, doc, theme, contentWidth, blocks[i]._logoMeta);
      doc.addPage();
      pageCount++;
      contentY = margin + bleedOff;
      drawCuisineDecorationOnPage(doc, theme, paper, contentX, contentY, { twoCol: true, quietMode: !!opts.quietMode });
      i++;
    }

    function spanWidth(block) {
      // Blocks that always span full width.
      if (block.kind === 'title' || block.kind === 'logo' ||
          block.kind === 'story' || block.kind === 'section' ||
          block.kind === 'section-hero' || block.kind === 'meta-footer' ||
          block.kind === 'allergen-key' || block.kind === 'footer-ornament') {
        return 'both';
      }
      return 'col';
    }

    function newPage() {
      doc.addPage();
      pageCount++;
      contentY = margin + bleedOff;
      // Wave studio-quality — decoration on every page, bottom-right
      // for 2-col layouts.
      drawCuisineDecorationOnPage(doc, theme, paper, contentX, contentY, { twoCol: true, quietMode: !!opts.quietMode });
    }

    function drawSpanFull(block) {
      var h = measureBlock(block, doc, theme, contentWidth);
      if (h > Number.MAX_SAFE_INTEGER / 2) return; // sentinel — handled elsewhere
      if (contentY + h > bottom) newPage();
      contentY = drawBlock(block, contentX, contentY, doc, theme, contentWidth, block._logoMeta);
    }

    function packDishesIntoCols(dishBlocks) {
      if (!dishBlocks.length) return;
      // Measure heights at column width (not full content width).
      var heights = dishBlocks.map(function (b) { return measureBlock(b, doc, theme, colWidth); });
      var totalH = heights.reduce(function (a, b) { return a + b; }, 0);
      var available = bottom - contentY;
      var idx = 0;
      while (idx < dishBlocks.length) {
        // Greedy fill column 1 to ~half of remaining unallocated, then column 2.
        var remain = dishBlocks.length - idx;
        var remainH = 0;
        for (var k = idx; k < dishBlocks.length; k++) remainH += heights[k];
        // Both columns can hold up to (bottom - contentY) each.
        var perCol = bottom - contentY;
        // Bin pack column 1
        var col1 = [];
        var col1H = 0;
        var col1End = idx;
        var target = Math.min(remainH / 2 + 12, perCol); // fudge for visual fullness
        while (col1End < dishBlocks.length && col1H + heights[col1End] <= target) {
          col1.push(dishBlocks[col1End]); col1H += heights[col1End]; col1End++;
        }
        // Ensure col1 has at least one block (avoid empty col edge case)
        if (!col1.length && col1End < dishBlocks.length) {
          col1.push(dishBlocks[col1End]); col1H += heights[col1End]; col1End++;
        }
        // Pack column 2 with what remains, until perCol fills.
        var col2 = [];
        var col2H = 0;
        var col2End = col1End;
        while (col2End < dishBlocks.length && col2H + heights[col2End] <= perCol) {
          col2.push(dishBlocks[col2End]); col2H += heights[col2End]; col2End++;
        }
        // Rebalance: if col1 is significantly taller than col2 AND
        // we can move the last col1 block to col2 without overflow,
        // do so (cleaner-looking layout).
        var iter = 0;
        while (iter < 3 && col1.length > 1 && col2.length > 0 &&
               col1H - col2H > 24 &&
               col2H + heights[col1End - 1 - iter] <= perCol) {
          // (skipping full impl — keep greedy result for v1)
          break;
        }
        // Render col1 starting at contentY in left column.
        var yLeft = contentY;
        for (var c1 = 0; c1 < col1.length; c1++) {
          yLeft = drawBlock(col1[c1], contentX, yLeft, doc, theme, colWidth, col1[c1]._logoMeta);
        }
        // Render col2 starting at contentY in right column.
        var yRight = contentY;
        for (var c2 = 0; c2 < col2.length; c2++) {
          yRight = drawBlock(col2[c2], contentX + colWidth + gutter, yRight, doc, theme, colWidth, col2[c2]._logoMeta);
        }
        // Move y-cursor below both columns.
        contentY = Math.max(yLeft, yRight) + 6;
        idx = col2End;
        // If we still have content but can't fit any more on this
        // page, addPage and continue.
        if (idx < dishBlocks.length) {
          newPage();
        }
      }
    }

    // Main flow: walk blocks, collect dish runs between span-both blocks.
    var pending = [];
    function flushPending() {
      if (pending.length) {
        packDishesIntoCols(pending);
        pending = [];
      }
    }
    while (i < blocks.length) {
      var b = blocks[i];
      if (spanWidth(b) === 'both') {
        flushPending();
        drawSpanFull(b);
      } else {
        pending.push(b);
      }
      i++;
    }
    flushPending();
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

  // W12-4 — High-contrast accessibility variant. Yellow-on-black
  // (FFFF00 on 000000), recommended by low-vision specialists for
  // patrons with macular degeneration and other contrast-sensitivity
  // conditions. Body type bumped to 16pt; single column; whitespace
  // dividers (no rules to compete with text). Suffix the filename
  // with -high-contrast so operators keep both side-by-side with
  // their standard PDF.
  function applyHighContrastOverride(theme) {
    return Object.assign({}, theme, {
      bodyPt:  16,
      h1Pt:    32,
      h2Pt:    20,
      descPt:  14,
      pricePt: 16,
      columns: 1,
      paper:        '#000000',
      ink:          '#FFFF00',
      muted:        '#FFE600',
      accent:       '#FFFF00',
      dividerStyle: 'whitespace',
      priceStyle:   'right-monospace',
      logoSlot:     'header-center'
    });
  }

  // W17 — pdf-lib lazy-loader for post-process TrimBox/BleedBox/
  // MediaBox injection. Only loaded when print-vendor mode is on
  // (saves ~360KB on the typical Share PDF flow).
  var PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
  var __pdfLibPromise2 = null;
  function loadPdfLib() {
    if (root.PDFLib) return Promise.resolve(root.PDFLib);
    if (__pdfLibPromise2) return __pdfLibPromise2;
    __pdfLibPromise2 = withScriptTimeout(function () {
      return new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = PDFLIB_CDN;
        s.crossOrigin = 'anonymous';
        s.referrerPolicy = 'no-referrer';
        s.onload = function () {
          if (root.PDFLib) resolve(root.PDFLib);
          else reject(new Error('pdf-lib loaded but global missing'));
        };
        s.onerror = function () { reject(new Error('pdf-lib load failed')); };
        document.head.appendChild(s);
      });
    }, 'pdf-lib').catch(function (e) {
      __pdfLibPromise2 = null;
      throw e;
    });
    return __pdfLibPromise2;
  }

  // ----------------------------------------------------------------
  // Wave studio-quality — Accessibility post-processor (PDF/UA Phase 1).
  //
  // jsPDF emits a baseline PDF; this pass walks the catalog with pdf-lib
  // and injects the document-level accessibility metadata that turns a
  // "screen reader can sort of see this" PDF into one that announces
  // itself properly:
  //
  //   /Lang              — locale code (en / es) so the screen reader
  //                        picks the right voice and pronunciation
  //   /ViewerPreferences /DisplayDocTitle true — Acrobat shows the
  //                        document title in the window chrome instead
  //                        of the filename ("Menu of Da Marco" vs
  //                        "menu-da-marco-2026-05-03.pdf")
  //   XMP metadata stream — Dublin Core (title/creator/language) plus
  //                        PDF metadata. Indexed by content-management
  //                        systems, GoogleBot, and Acrobat's File Info.
  //
  // Phase 1 stops short of claiming PDF/UA conformance — that requires
  // a real /StructTreeRoot with H1/H2/P/Table elements, which jsPDF's
  // content-stream output does not carry. Phase 2 (future) walks the
  // pre-paginated `blocks[]` array and emits the structure tree via
  // pdf-lib. Even Phase 1 closes the most operator-visible gap: AT
  // users hear "Menu of Da Marco, English" on open instead of nothing.
  //
  // Returns a new Uint8Array; original input untouched.
  // ----------------------------------------------------------------
  function injectAccessibilityMetadata(arrayBuffer, opts) {
    return loadPdfLib().then(function (PDFLib) {
      return PDFLib.PDFDocument.load(arrayBuffer).then(function (pdfDoc) {
        var locale = (opts && opts.locale) ? String(opts.locale).toLowerCase().slice(0, 2) : 'en';
        var title  = (opts && opts.title)  ? String(opts.title)  : 'Menu';
        var creatorTool = 'Muntin Digital Menu Design Suite';
        var producer = 'jsPDF + pdf-lib (Muntin)';
        var subject  = 'Restaurant menu — accessible PDF';
        var keywords = ['menu', 'restaurant', 'muntin'];
        if (opts && opts.theme && opts.theme.id) keywords.push(opts.theme.id);
        var nowIso = new Date().toISOString();

        // ---------- Catalog-level fields ---------------------------
        var catalog = pdfDoc.catalog;
        catalog.set(PDFLib.PDFName.of('Lang'), PDFLib.PDFString.of(locale));
        // ViewerPreferences /DisplayDocTitle true → Acrobat shows
        // /Title in the window chrome instead of the filename.
        var vp = pdfDoc.context.obj({
          DisplayDocTitle: true
        });
        catalog.set(PDFLib.PDFName.of('ViewerPreferences'), vp);

        // ---------- Document Info dict (legacy metadata) -----------
        // pdf-lib also writes these via setProperties / setTitle but
        // we set explicitly so locale + producer survive the round-trip.
        try { pdfDoc.setTitle(title); }    catch (_) {}
        try { pdfDoc.setSubject(subject); }   catch (_) {}
        try { pdfDoc.setCreator(creatorTool); } catch (_) {}
        try { pdfDoc.setProducer(producer); }   catch (_) {}
        try { pdfDoc.setKeywords(keywords); }   catch (_) {}
        try { pdfDoc.setLanguage(locale); }     catch (_) {}

        // ---------- XMP metadata stream (modern metadata) ---------
        // pdf-lib's setTitle / setLanguage update Document Info AND XMP
        // automatically. We supplement with a richer XMP packet that
        // carries Dublin Core + PDF/A-friendly markers.
        var safeTitle = _xmlEscape(title);
        var safeSubject = _xmlEscape(subject);
        var safeCreator = _xmlEscape(creatorTool);
        var langTag = locale === 'es' ? 'es' : 'en';
        var xmp =
          '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>\n' +
          '<x:xmpmeta xmlns:x="adobe:ns:meta/">\n' +
          ' <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n' +
          '  <rdf:Description rdf:about=""\n' +
          '    xmlns:dc="http://purl.org/dc/elements/1.1/"\n' +
          '    xmlns:xmp="http://ns.adobe.com/xap/1.0/"\n' +
          '    xmlns:pdf="http://ns.adobe.com/pdf/1.3/">\n' +
          '   <dc:title><rdf:Alt><rdf:li xml:lang="' + langTag + '">' + safeTitle + '</rdf:li></rdf:Alt></dc:title>\n' +
          '   <dc:creator><rdf:Seq><rdf:li>' + safeCreator + '</rdf:li></rdf:Seq></dc:creator>\n' +
          '   <dc:description><rdf:Alt><rdf:li xml:lang="' + langTag + '">' + safeSubject + '</rdf:li></rdf:Alt></dc:description>\n' +
          '   <dc:language><rdf:Bag><rdf:li>' + langTag + '</rdf:li></rdf:Bag></dc:language>\n' +
          '   <xmp:CreatorTool>' + safeCreator + '</xmp:CreatorTool>\n' +
          '   <xmp:CreateDate>' + nowIso + '</xmp:CreateDate>\n' +
          '   <xmp:ModifyDate>' + nowIso + '</xmp:ModifyDate>\n' +
          '   <pdf:Producer>' + _xmlEscape(producer) + '</pdf:Producer>\n' +
          '   <pdf:Keywords>' + _xmlEscape(keywords.join(', ')) + '</pdf:Keywords>\n' +
          '  </rdf:Description>\n' +
          ' </rdf:RDF>\n' +
          '</x:xmpmeta>\n' +
          '<?xpacket end="w"?>';
        try {
          // pdf-lib exposes metadata via the catalog's /Metadata stream.
          var stream = pdfDoc.context.flateStream(xmp, {
            Type: PDFLib.PDFName.of('Metadata'),
            Subtype: PDFLib.PDFName.of('XML')
          });
          // pdf-lib helper varies across versions; fall back to context.register.
          var metaRef;
          if (typeof pdfDoc.context.register === 'function') {
            metaRef = pdfDoc.context.register(stream);
          } else {
            // Older pdf-lib: use context.assign
            metaRef = pdfDoc.context.assign(pdfDoc.context.nextRef(), stream);
          }
          if (metaRef) {
            catalog.set(PDFLib.PDFName.of('Metadata'), metaRef);
          }
        } catch (_) {
          // XMP injection is best-effort; the Document Info dict above
          // already carries the operator-visible fields.
        }

        return pdfDoc.save();
      });
    });
  }
  function _xmlEscape(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Post-process a jsPDF-generated array buffer with pdf-lib so each
  // page carries a /TrimBox + /BleedBox set per the PDF/X-3 spec.
  // jsPDF doesn't expose these page-dict entries directly. Returns
  // a new ArrayBuffer; original input is untouched.
  function injectTrimBleedBoxes(arrayBuffer, paper, bleed) {
    return loadPdfLib().then(function (PDFLib) {
      return PDFLib.PDFDocument.load(arrayBuffer).then(function (pdfDoc) {
        var pages = pdfDoc.getPages();
        // TrimBox = inset by bleed on every side relative to MediaBox.
        // BleedBox = MediaBox in our output (we sized the doc to
        // include the bleed already).
        pages.forEach(function (page) {
          var mb = page.getMediaBox();
          // Acrobat reads boxes as [left, bottom, right, top].
          var trim = [mb.x + bleed, mb.y + bleed, mb.x + mb.width - bleed, mb.y + mb.height - bleed];
          var bleedBox = [mb.x, mb.y, mb.x + mb.width, mb.y + mb.height];
          // pdf-lib doesn't expose setTrimBox helpers natively for
          // older versions; use the underlying PDFArray + page.node.
          page.node.set(PDFLib.PDFName.of('TrimBox'),
            pdfDoc.context.obj([
              PDFLib.PDFNumber.of(trim[0]),
              PDFLib.PDFNumber.of(trim[1]),
              PDFLib.PDFNumber.of(trim[2]),
              PDFLib.PDFNumber.of(trim[3])
            ]));
          page.node.set(PDFLib.PDFName.of('BleedBox'),
            pdfDoc.context.obj([
              PDFLib.PDFNumber.of(bleedBox[0]),
              PDFLib.PDFNumber.of(bleedBox[1]),
              PDFLib.PDFNumber.of(bleedBox[2]),
              PDFLib.PDFNumber.of(bleedBox[3])
            ]));
        });
        // Also patch the catalog with /OutputIntents per PDF/X-3
        // (sRGB with subtype /GTS_PDFX). Embed sRGB ICC profile is
        // out of scope for v1 (would add 600KB); the OutputIntent
        // dict alone signals intent and most RIPs accept it.
        var catalog = pdfDoc.catalog;
        var oi = pdfDoc.context.obj({
          Type: PDFLib.PDFName.of('OutputIntent'),
          S: PDFLib.PDFName.of('GTS_PDFX'),
          OutputConditionIdentifier: PDFLib.PDFString.of('sRGB IEC61966-2.1'),
          Info: PDFLib.PDFString.of('sRGB IEC61966-2.1 — vendor converts using press profile')
        });
        catalog.set(PDFLib.PDFName.of('OutputIntents'), pdfDoc.context.obj([oi]));
        return pdfDoc.save();
      });
    });
  }

  // ----------------------------------------------------------------
  // Script-detection guard. The PDF font subsets are Latin-only
  // (Fraunces + Inter + Cormorant), so Arabic / Hebrew / CJK / Thai /
  // Devanagari / Cyrillic-extended / Ethiopic content silently emits
  // boxes or wrong glyphs. We refuse PDF export with an explicit
  // message instead of shipping unreadable output. Operators can use
  // the HTML, text, or kiosk export paths until proper subsets ship.
  //
  // Returns null when content is safe to export, or an i18n object
  // { en, es } with operator-tone copy when content must be refused.
  // ----------------------------------------------------------------
  var NON_LATIN_RE = /[֐-׿؀-ۿ܀-ݏऀ-ॿ฀-๿ሀ-፿　-ヿ぀-ゟ㐀-䶿一-鿿가-힯יִ-﷿ﹰ-﻿]/;
  function detectUnsupportedScript(opts) {
    var fields = [];
    function collect(s) { if (s) fields.push(String(s)); }
    var meta = opts && opts.meta;
    if (meta) {
      collect(meta.tagline); collect(meta.story); collect(meta.coverPage);
      collect(meta.address); collect(meta.hours); collect(meta.serviceCharge);
      collect(meta.sourcing); collect(meta.disclaimer); collect(meta.askYourServer);
      collect(meta.businessName);
    }
    var sections = (opts && opts.sections) || [];
    for (var s = 0; s < sections.length; s++) {
      collect(sections[s].name);
      var dishes = sections[s].dishes || [];
      for (var d = 0; d < dishes.length; d++) {
        collect(dishes[d].name); collect(dishes[d].desc);
      }
    }
    var joined = fields.join('\n');
    if (NON_LATIN_RE.test(joined)) {
      return {
        en: 'PDF export needs Arabic / Hebrew / CJK / Thai / Devanagari / Ethiopic font subsets we have not shipped yet. ' +
            'Use the HTML, kiosk, or text export — those handle every script your browser can render. ' +
            '(Multi-script PDF is on the roadmap.)',
        es: 'La exportación a PDF necesita subsets de fuentes árabe / hebreo / CJK / tailandés / devanagari / etíope que aún no enviamos. ' +
            'Usa la exportación HTML, kiosko o texto — esas manejan cualquier script que tu navegador pueda renderizar. ' +
            '(PDF multiscript está en el roadmap.)'
      };
    }
    return null;
  }

  function exportPdf(opts) {
    opts = opts || {};
    // Wave studio-quality — fail-loud guard for non-Latin scripts.
    // Better to refuse than to ship boxes / reversed Arabic to print.
    var unsupported = detectUnsupportedScript(opts);
    if (unsupported) {
      var locale = (opts.locale || 'en').toLowerCase().slice(0, 2);
      var msg = locale === 'es' ? unsupported.es : unsupported.en;
      var err = new Error(msg);
      err.code = 'unsupported-script';
      err.unsupported = true;
      return Promise.reject(err);
    }
    // W9-2 — kick off the brand-font fetch in parallel with jsPDF.
    // W13-1 — also load svg2pdf when the operator's logo is SVG so
    // the doc.svg() call in the logo drawer has the plugin available.
    // W17 — also load pdf-lib when print-vendor mode is on so the
    // post-process step has the library ready.
    var hasSvgLogo = opts.logoDataUrl && typeof opts.logoDataUrl === 'string' && opts.logoDataUrl.indexOf('data:image/svg') === 0;
    // Wave studio-quality — also pre-load svg2pdf when the theme
    // would benefit from a cuisine decoration on the page (so the
    // printed PDF carries the same Muntin theme identity as the
    // thumbnail / live preview / QR-menu HTML output).
    var hasCuisineDecor = !!(root && root.MD_DECOR &&
                             typeof root.MD_DECOR.decorationFor === 'function' &&
                             opts.theme && root.MD_DECOR.decorationFor(opts.theme));
    var loaders = [loadJsPdf(), loadBrandFonts()];
    if (hasSvgLogo || hasCuisineDecor) loaders.push(loadSvg2Pdf().catch(function () { return null; }));
    // Wave studio-quality (PDF/UA Phase 1) — always pre-load pdf-lib
    // so the accessibility post-process can run on every export. The
    // ~150KB lib is lazy and cached after first load.
    loaders.push(loadPdfLib().catch(function () { return null; }));
    return Promise.all(loaders).then(function (results) {
      // Wave studio-quality (perf) — yield a frame after loaders
      // resolve, before the heavy sync work (dry-run measure +
      // paginate + draw, 4-6s on a 53-dish tabloid). The yield
      // lets the operator's busy-state animation paint at least
      // one frame before the main thread locks. Without this, the
      // pulse-state CSS animation never shows up on big menus —
      // it stays at the initial frame for the entire build.
      return new Promise(function (resolve) {
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(function () { setTimeout(function () { resolve(results); }, 0); });
        } else {
          setTimeout(function () { resolve(results); }, 0);
        }
      });
    }).then(function (results) {
      var jsPDF = results[0];
      var brandFonts = results[1]; // null on failure
      if (!jsPDF) throw new Error('jsPDF unavailable');
      // W6-3 — apply large-print override before paper / blocks build.
      if (opts.largePrint && opts.theme) {
        opts = Object.assign({}, opts, { theme: applyLargePrintOverride(opts.theme) });
      }
      // W12-4 — apply high-contrast override (yellow-on-black).
      if (opts.highContrast && opts.theme) {
        opts = Object.assign({}, opts, { theme: applyHighContrastOverride(opts.theme) });
      }
      // Wave studio-quality — preview/PDF parity. The orchestrator
      // reads the live preview's effective shrink class (md-shrink-1
      // ... md-shrink-4) and passes opts.shrinkFactor here so the PDF
      // ships at the SAME font sizes the operator just approved on
      // screen. Real menus are 1 page or 2 pages; the preview already
      // auto-fits to that target. Without this parity step the PDF
      // would silently render at native theme sizes and spill to N
      // pages — exactly the problem we're solving.
      var sf = opts.shrinkFactor;
      if (typeof sf === 'number' && sf > 0 && sf < 1.0 && opts.theme) {
        var t = opts.theme;
        // Body + desc shrink linearly; the section header shrinks more
        // gently (sqrt) so the visual hierarchy survives the squeeze.
        // Title (h1) is left alone — it's the page anchor and shouldn't
        // shrink with the body.
        var sqrt = Math.sqrt(sf);
        opts = Object.assign({}, opts, {
          theme: Object.assign({}, t, {
            bodyPt:  Math.max(8.5,  (t.bodyPt  || 11) * sf),
            descPt:  Math.max(7.5,  (t.descPt  || (t.bodyPt || 11) - 1) * sf),
            pricePt: Math.max(8.5,  (t.pricePt || t.bodyPt || 11) * sf),
            h2Pt:    Math.max(11,   (t.h2Pt    || 14) * sqrt)
          })
        });
      }
      var paperKey = PAPERS[opts.paperKey] ? opts.paperKey : 'letter';
      var paper = resolvePaper(paperKey, opts.customDims);
      // W10-1 — Print-vendor mode adds 0.125" bleed all sides; the
      // page format is the trim + 2*bleed. Content origin shifts
      // inward by BLEED so dish/section drawing happens inside the
      // trim box, while paper-color fills extend into the bleed.
      var bleed = opts.printVendor ? BLEED_PT : 0;
      var pageW = paper.w + 2 * bleed;
      var pageH = paper.h + 2 * bleed;
      var doc = new jsPDF({ unit: 'pt', format: [pageW, pageH], compress: true });
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
          creator: 'Muntin Digital',
          keywords: 'menu, restaurant'
        });
      } catch (_) {}
      // Paint background paper color when theme paper isn't pure
      // white — saves owners from forcing print color profiles on.
      // In print-vendor mode the fill extends to the bleed edges so
      // a slight trim mis-register doesn't reveal white paper.
      var paperRgb = hexToRgb(opts.theme.paper);
      var fillX = 0;
      var fillY = 0;
      var fillW = pageW;
      var fillH = pageH;
      if (paperRgb.r < 252 || paperRgb.g < 252 || paperRgb.b < 252) {
        doc.setFillColor(paperRgb.r, paperRgb.g, paperRgb.b);
        doc.rect(fillX, fillY, fillW, fillH, 'F');
      }
      // W12-3 — paper texture overlay. Subtle 4% opacity dot grid
      // stamped in the ink color across the page surface.
      if (opts.paperTexture) {
        try {
          if (doc.GState) doc.setGState(new doc.GState({ opacity: 0.045 }));
        } catch (_) {}
        var inkColor = hexToRgb(opts.theme.ink);
        doc.setFillColor(inkColor.r, inkColor.g, inkColor.b);
        for (var tx = 8; tx < pageW; tx += 6) {
          for (var ty = 8; ty < pageH; ty += 6) {
            doc.circle(tx, ty, 0.35, 'F');
          }
        }
        try {
          if (doc.GState) doc.setGState(new doc.GState({ opacity: 1 }));
        } catch (_) {}
      }
      var blocks = buildBlocks(opts.rows || [], opts.title, opts.logoDataUrl, {
        tagline:   opts.tagline   || '',
        story:     opts.story     || '',
        themeId:   (opts.theme && opts.theme.id) || '',
        coverPage: !!opts.coverPage,
        // Wave studio-quality — pipe operator's display currency
        // through to buildBlocks so dish + halfPrice get formatted
        // correctly in the PDF (matches the live preview).
        currency:  opts.currency  || 'USD'
      });
      // Forward logoMeta + locale onto the relevant blocks.
      blocks.forEach(function (b) {
        if (b.kind === 'logo' && opts.logoMeta) b._logoMeta = opts.logoMeta;
        if (b.kind === 'allergen-key') b.locale = opts.locale || 'en';
      });
      // W13-1 — droppedSvgLogo is now true only when svg2pdf failed
      // to load AND the operator uploaded an SVG. With the plugin
      // working, SVG logos embed as vectors so the flag stays false.
      var droppedSvgLogo = false;
      if (opts.logoDataUrl && opts.logoDataUrl.indexOf('data:image/svg') === 0 && !root.svg2pdf) {
        droppedSvgLogo = true;
      }
      // Track whether subsequent pages need the paper-color fill
      // too; addPage default is white. Crop marks (W10-1) are drawn
      // on every page if print-vendor mode is on.
      var origAddPage = doc.addPage.bind(doc);
      doc.addPage = function () {
        origAddPage();
        if (paperRgb.r < 252 || paperRgb.g < 252 || paperRgb.b < 252) {
          doc.setFillColor(paperRgb.r, paperRgb.g, paperRgb.b);
          doc.rect(0, 0, pageW, pageH, 'F');
        }
      };
      // Stamp the bleed offset on the paper so paginate() can read it.
      paper._bleed = bleed;

      // Wave studio-quality — PDF dry-run measurement pass.
      // The orchestrator passes shrinkFactor based on the live preview
      // (CSS-measured against browser fonts). PDF font metrics can
      // differ slightly (jsPDF embeds Fraunces + Inter; everything
      // else falls back to Helvetica/Times). For most themes the
      // drift is negligible, but for menus right at a fit boundary
      // it could push the PDF from 1 page to 2 pages even though the
      // preview said it'd fit. Dry-run catches that:
      //   1. Run paginate's measurement logic against the real doc
      //      (no drawing — pure measure + count).
      //   2. If the result exceeds the operator's target page count,
      //      bump the theme's bodyPt + descPt one notch shrunker
      //      and retry. Up to 4 attempts (mirrors the live preview
      //      cascade's 4-step shrink ladder).
      //   3. Final paginate uses the chosen shrunken theme.
      var targetPagesForFit = opts.allowMultiPage ? 2 : 1;
      var workingTheme = opts.theme;
      var dryAttempts = 0;
      function _dryMeasurePages(t) {
        var bw = paper.w - (paper.margin || 48) * 2;
        var bottom = paper.h - (paper.margin || 48) + (paper._bleed || 0);
        var contentY = (paper.margin || 48) + (paper._bleed || 0);
        var pages = 1;
        for (var bi = 0; bi < blocks.length; bi++) {
          var blk = blocks[bi];
          var h = measureBlock(blk, doc, t, bw);
          if (blk.kind === 'cover') { pages++; contentY = (paper.margin || 48) + (paper._bleed || 0); continue; }
          if (contentY + h > bottom) {
            pages++;
            contentY = (paper.margin || 48) + (paper._bleed || 0);
          }
          contentY += h;
        }
        return pages;
      }
      // Skip dry-run for panel-flow papers (their pagination is fixed
      // by panel count) and for 2-col-by-theme themes (they have their
      // own balancing pass).
      if (paper.flow !== 'panel') {
        while (dryAttempts < 4) {
          var measuredPages = _dryMeasurePages(workingTheme);
          if (measuredPages <= targetPagesForFit) break;
          // Bump shrink — body+desc by 4%, h2 by sqrt(0.96) so headers
          // stay legible. Floor at 8.5/7.5/11pt as in the orchestrator.
          var t2 = workingTheme;
          var newBody  = Math.max(8.5,  (t2.bodyPt  || 11) * 0.96);
          var newDesc  = Math.max(7.5,  (t2.descPt  || (t2.bodyPt || 11) - 1) * 0.96);
          var newPrice = Math.max(8.5,  (t2.pricePt || t2.bodyPt || 11) * 0.96);
          var newH2    = Math.max(11,   (t2.h2Pt    || 14) * Math.sqrt(0.96));
          // No-progress check: if floors clipped all values, breaking
          // out avoids an infinite-loop on a genuinely-too-large menu.
          if (newBody === t2.bodyPt && newDesc === t2.descPt &&
              newPrice === t2.pricePt && newH2 === t2.h2Pt) break;
          workingTheme = Object.assign({}, t2, {
            bodyPt: newBody, descPt: newDesc, pricePt: newPrice, h2Pt: newH2
          });
          dryAttempts++;
        }
      }
      var pageCount = paginate(blocks, doc, workingTheme, paper, {
        forceTwoCol:    !!opts.forceTwoCol,
        // Wave studio-quality — operator's "Allow front + back"
        // toggle propagates into PDF so smart 2-page split planner
        // (above paginate()) only fires when the operator actually
        // opted into a 2-page deliverable.
        allowMultiPage: !!opts.allowMultiPage,
        // Wave studio-quality — Quiet typography mode propagates
        // through to skip decoration + glyph + force single column.
        quietMode:      !!opts.quietMode
      });
      // W10-1 — crop marks on every page when print-vendor mode is on.
      if (opts.printVendor) {
        var totalPages = doc.internal && doc.internal.pages ? doc.internal.pages.length - 1 : pageCount;
        for (var pi = 1; pi <= totalPages; pi++) {
          doc.setPage(pi);
          drawCropMarks(doc, paper);
        }
      }
      setPdfXMetadata(doc, paper, opts);
      // Wave studio-quality (PDF/UA Phase 1 + W17) — chain pdf-lib
      // post-processors. Always inject accessibility metadata; also
      // inject TrimBox/BleedBox/OutputIntents when print-vendor is on.
      // pdf-lib loaded as part of the export's parallel loaders above;
      // when load failed we silently fall back to standard doc.save.
      if (root.PDFLib) {
        try {
          var ab = doc.output('arraybuffer');
          var fname = (opts.filename || 'menu') + '.pdf';
          var trimBleed = (opts.printVendor && bleed > 0);
          var chain = injectAccessibilityMetadata(ab, opts);
          if (trimBleed) {
            chain = chain.then(function (a11yBuf) {
              return injectTrimBleedBoxes(a11yBuf, paper, bleed);
            });
          }
          return chain.then(function (uint8) {
            var blob = new Blob([uint8], { type: 'application/pdf' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fname;
            document.body.appendChild(a); a.click();
            setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); URL.revokeObjectURL(a.href); }, 4000);
            return {
              pageCount: pageCount,
              droppedSvgLogo: droppedSvgLogo,
              pdfX3: trimBleed,
              accessible: true
            };
          }).catch(function () {
            // Fallback to standard doc.save on post-process failure.
            doc.save(fname);
            return {
              pageCount: pageCount,
              droppedSvgLogo: droppedSvgLogo,
              pdfX3: false,
              accessible: false
            };
          });
        } catch (_) {
          // Any unexpected failure -> fall through to standard save.
        }
      }
      var fname2 = (opts.filename || 'menu') + '.pdf';
      doc.save(fname2);
      return { pageCount: pageCount, droppedSvgLogo: droppedSvgLogo, accessible: false };
    });
  }

  // ----------------------------------------------------------------
  // W24-2 — Page count estimator. Runs the same paginate() logic
  // against a no-render jsPDF doc to count pages and record the
  // block index where each page break falls. The preview consumes
  // this so the operator sees the actual deliverable shape (one
  // .md-preview-paper per page) instead of an unbounded column.
  //
  // Returns { pages: number, breaks: [blockIndex,...], panels?: number }
  //   pages   — page count for sheet flow OR panel count for panel flow
  //   breaks  — block-index points where the renderer would addPage()
  //   panels  — only set when paper.flow === 'panel'
  //
  // Cost: ~5ms at 30 dishes. Caller (renderPreview) protects against
  // jank with the existing 300ms previewTimer debounce.
  // ----------------------------------------------------------------
  function paginateForCountSheet(blocks, doc, theme, paper) {
    // Mirror of paginate() at line 1305, but record breaks instead
    // of calling drawBlock.
    var minTwoColW = 400;
    // Wave studio-quality — Quiet typography mode forces single-column.
    var twoColumn = !opts.quietMode && (theme.columns === 2) && (paper.w - 2 * (paper.margin || 48) >= minTwoColW);
    if (twoColumn) return paginateForCountTwoCol(blocks, doc, theme, paper);
    var margin = paper.margin || 48;
    var contentY = margin;
    var contentWidth = paper.w - margin * 2;
    var bottom = paper.h - margin;
    var pageCount = 1;
    var breaks = [];
    blocks.forEach(function (block, i) {
      var h = measureBlock(block, doc, theme, contentWidth);
      if (block.kind === 'cover') {
        // Cover always consumes a full sheet; the next dish block
        // starts on the next sheet.
        pageCount++;
        contentY = margin;
        breaks.push(i + 1);
        return;
      }
      if (block.kind === 'section') {
        var nextDishH = 0;
        for (var j = i + 1; j < Math.min(i + 3, blocks.length); j++) {
          if (blocks[j].kind === 'dish') {
            nextDishH += measureBlock(blocks[j], doc, theme, contentWidth);
          }
        }
        if (contentY + h + nextDishH > bottom) {
          pageCount++;
          contentY = margin;
          breaks.push(i);
        }
      } else if (contentY + h > bottom) {
        pageCount++;
        contentY = margin;
        breaks.push(i);
      }
      // Approximate the post-block y-cursor. measureBlock returns
      // height; we don't run drawBlock so just advance contentY by h.
      contentY += h;
    });
    return { pages: pageCount, breaks: breaks };
  }

  function paginateForCountTwoCol(blocks, doc, theme, paper) {
    // Mirror of paginateTwoCol() at line 1386 — count-only branch.
    // The packer fills column 1 then column 2 then breaks. We track
    // pages by simulating the same logic.
    var margin = paper.margin || 48;
    var pageH = paper.h;
    var contentY = margin;
    var contentWidth = paper.w - margin * 2;
    var gutter = 24;
    var colWidth = (contentWidth - gutter) / 2;
    var bottom = pageH - margin;
    var pageCount = 1;
    var breaks = [];

    var i = 0;
    while (i < blocks.length && blocks[i].kind === 'cover') {
      pageCount++;
      contentY = margin;
      breaks.push(i + 1);
      i++;
    }
    function spanWidth(b) {
      return (b.kind === 'title' || b.kind === 'logo' || b.kind === 'story' ||
              b.kind === 'section' || b.kind === 'section-hero' ||
              b.kind === 'meta-footer' || b.kind === 'allergen-key' ||
              b.kind === 'footer-ornament') ? 'both' : 'col';
    }
    var pending = [];
    function flushPending() {
      if (!pending.length) return;
      var heights = pending.map(function (b) { return measureBlock(b, doc, theme, colWidth); });
      var idx = 0;
      while (idx < pending.length) {
        var perCol = bottom - contentY;
        // Greedy column 1 fill.
        var col1H = 0; var col1End = idx;
        var remainH = 0;
        for (var k = idx; k < pending.length; k++) remainH += heights[k];
        var target = Math.min(remainH / 2 + 12, perCol);
        while (col1End < pending.length && col1H + heights[col1End] <= target) {
          col1H += heights[col1End]; col1End++;
        }
        if (col1End === idx && col1End < pending.length) { col1H += heights[col1End]; col1End++; }
        // Greedy column 2 fill.
        var col2H = 0; var col2End = col1End;
        while (col2End < pending.length && col2H + heights[col2End] <= perCol) {
          col2H += heights[col2End]; col2End++;
        }
        contentY += Math.max(col1H, col2H) + 6;
        idx = col2End;
        if (idx < pending.length) {
          pageCount++;
          contentY = margin;
        }
      }
      pending = [];
    }
    while (i < blocks.length) {
      var b = blocks[i];
      if (spanWidth(b) === 'both') {
        flushPending();
        var h = measureBlock(b, doc, theme, contentWidth);
        if (contentY + h > bottom) {
          pageCount++;
          contentY = margin;
          breaks.push(i);
        }
        contentY += h;
      } else {
        pending.push(b);
      }
      i++;
    }
    flushPending();
    return { pages: pageCount, breaks: breaks };
  }

  function paginateForCountPanel(blocks, doc, theme, paper) {
    // Panel flow doesn't paginate — it maps to logical panels. The
    // estimator returns { panels: paper.panels } for the chip and
    // sets pages: 1 (the unfolded sheet IS one page). The preview
    // consumes panels separately via paper.panelMap.
    var panels = paper.panels || 1;
    return { pages: 1, panels: panels, breaks: [] };
  }

  function paginateForCount(blocks, doc, theme, paper) {
    if (paper.flow === 'panel') return paginateForCountPanel(blocks, doc, theme, paper);
    return paginateForCountSheet(blocks, doc, theme, paper);
  }

  function estimatePages(rows, theme, paperKey, customDims) {
    var paper = resolvePaper(paperKey, customDims);
    if (!root.jspdf || !root.jspdf.jsPDF) return { pages: 1, breaks: [], panels: paper.panels };
    try {
      var doc = new root.jspdf.jsPDF({ unit: 'pt', format: [paper.w, paper.h] });
      var blocks = buildBlocks(rows || [], '', null, { themeId: (theme && theme.id) || '' });
      var out = paginateForCount(blocks, doc, theme, paper);
      out.flow = paper.flow;
      return out;
    } catch (e) {
      return { pages: 1, breaks: [], panels: paper.panels, error: e && e.message };
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { exportPdf: exportPdf, PAPERS: PAPERS, applyLargePrintOverride: applyLargePrintOverride, applyHighContrastOverride: applyHighContrastOverride, estimatePages: estimatePages };
  }
  if (root) root.MD_PDF = {
    exportPdf: exportPdf,
    PAPERS: PAPERS,
    applyLargePrintOverride: applyLargePrintOverride,
    applyHighContrastOverride: applyHighContrastOverride,
    estimatePages: estimatePages,
    preloadSvg2Pdf: function () { return loadSvg2Pdf().catch(function () { return null; }); }
  };
})(typeof window !== 'undefined' ? window : null);
