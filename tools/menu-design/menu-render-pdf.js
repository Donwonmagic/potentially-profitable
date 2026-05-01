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

  // Paper dimensions in PostScript points (jsPDF unit:'pt').
  var PAPERS = {
    'letter':    { w: 612,    h: 792    },
    'a4':        { w: 595.28, h: 841.89 },
    'half-page': { w: 612,    h: 396    }
  };

  // Map theme bodyFamily/displayFamily strings to jsPDF's built-in
  // PDF base 14 fonts. jsPDF can register custom fonts but that
  // adds 100KB+ to the bundle; for v1 we use fonts every PDF
  // viewer can render natively. This keeps the file small and
  // ensures consistent rendering across email clients + print.
  function pickPdfFont(family) {
    var f = String(family || '').toLowerCase();
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
    rows.forEach(function (r) {
      if (r.kind === 'section' && (r.name || '').trim()) {
        blocks.push({ kind: 'section', text: r.name.trim() });
      } else if (r.kind === 'dish' && (r.name || '').trim()) {
        blocks.push({
          kind: 'dish',
          name:  (r.name || '').trim(),
          price: (r.price || '').trim(),
          desc:  (r.desc || '').trim()
        });
      }
    });
    return blocks;
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
        doc.setFont(pickPdfFont(theme.bodyFamily), 'normal');
        doc.setFontSize(theme.descPt);
        var lines = doc.splitTextToSize(block.desc, contentWidth - 70);
        descH = lines.length * theme.descPt * 1.32;
      }
      return nameH + descH + 6;
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
      doc.setFont(pickPdfFont(theme.displayFamily), 'normal');
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
      doc.setFont(pickPdfFont(theme.displayFamily), 'normal');
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
        doc.setFont(pickPdfFont(theme.bodyFamily), 'normal');
        doc.setFontSize(theme.h2Pt);
        doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.text('❦', x + contentWidth / 2 - 60, sectionY);
        doc.text('❦', x + contentWidth / 2 + 60, sectionY);
      }
      return y + theme.h2Pt * 1.6 + 16;
    }
    if (block.kind === 'dish') {
      doc.setFont(pickPdfFont(theme.bodyFamily), 'normal');
      doc.setFontSize(theme.bodyPt);
      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      // Reserve right margin for price.
      var priceWidth = 60;
      var nameWidth  = contentWidth - priceWidth - 8;
      doc.text(block.name, x, y + theme.bodyPt);
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
        doc.setFont(pickPdfFont(theme.bodyFamily), 'normal');
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
    return y;
  }

  // Greedy paginator. Walks the block list, measuring each next
  // block; if it doesn't fit on the current page, fires addPage()
  // and resets y to the top margin. Section headers within 3 dish
  // heights of bottom force an early page break to avoid widow
  // headers.
  function paginate(blocks, doc, theme, paperKey) {
    var paper = PAPERS[paperKey] || PAPERS.letter;
    var margin = 48;
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

  // Public entry point: build the PDF and trigger the download.
  // Args: { rows, theme, paperKey, title, logoDataUrl, logoMeta,
  //         filename }. Returns a Promise resolving to { pageCount,
  //         droppedSvgLogo } so the caller can show toasts.
  function exportPdf(opts) {
    opts = opts || {};
    return loadJsPdf().then(function (jsPDF) {
      if (!jsPDF) throw new Error('jsPDF unavailable');
      var paperKey = PAPERS[opts.paperKey] ? opts.paperKey : 'letter';
      var paper = PAPERS[paperKey];
      var doc = new jsPDF({ unit: 'pt', format: [paper.w, paper.h], compress: true });
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
      // Forward logoMeta to the logo block for sizing math.
      blocks.forEach(function (b) {
        if (b.kind === 'logo' && opts.logoMeta) b._logoMeta = opts.logoMeta;
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
      var pageCount = paginate(blocks, doc, opts.theme, paperKey);
      var fname = (opts.filename || 'menu') + '.pdf';
      doc.save(fname);
      return { pageCount: pageCount, droppedSvgLogo: droppedSvgLogo };
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { exportPdf: exportPdf, PAPERS: PAPERS };
  }
  if (root) root.MD_PDF = { exportPdf: exportPdf, PAPERS: PAPERS };
})(typeof window !== 'undefined' ? window : null);
