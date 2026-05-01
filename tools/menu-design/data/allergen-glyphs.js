/**
 * Menu Design Suite — Allergen + dietary glyph artwork (W19).
 *
 * owns:    Custom SVG path strings + jsPDF draw routines for each
 *          of the 11 allergen / dietary codes
 * exports: MD_GLYPHS on window; module.exports for tests
 * deps:    none (pure data + a thin jsPDF primitive shim)
 * why:     The previous chip system rendered letter monograms ("V",
 *          "GF") inside rounded pills. Functional, but visually
 *          generic. This module replaces them with bespoke single-
 *          stroke icons that fit the menu-design aesthetic — clean
 *          geometry at 1.5pt stroke, currentColor inheritance so
 *          they take the theme accent automatically, no fill so
 *          they read on every paper color (cream, charcoal, ivory,
 *          black). Designed in a 24x24 viewBox so they scale
 *          cleanly from 14pt editor chips to 32pt preview pills
 *          to the print-vendor PDF at any DPI.
 *
 * Editorial posture: each icon is a literal-as-possible silhouette
 * of the food / mark itself. No abstract symbology. A vegan icon is
 * a sprout. A fish icon is a fish. A "locally sourced" icon is a
 * pin. Operators don't have to learn a key; the menu reads itself.
 */
(function (root) {
  'use strict';

  // SVG path data — each entry is { paths: [{d, w?}], extras?: [...] }
  // where `paths` is the main stroke geometry and `extras` are filled
  // micro-marks (eyes, dots, seeds) that need separate draw calls.
  // viewBox is uniform 24x24 so callers can scale by a single factor.
  var GLYPHS = {
    // V — Vegan. Two-stage sprout: stem rises then opens into a
    // pair of teardrop leaves. The tallest icon in the set so it
    // visually anchors the "most-restrictive" tier.
    V: {
      title_en: 'Vegan',
      title_es: 'Vegano',
      paths: [
        { d: 'M12 21V11' },
        { d: 'M12 11C9 11 6 9 5 6C8 6 11 8 12 11Z' },
        { d: 'M12 11C15 11 18 9 19 6C16 6 13 8 12 11Z' }
      ]
    },
    // VG — Vegetarian. A single curved leaf with a center vein.
    // Less "starts from a seed" than the vegan sprout — speaks to
    // "plant-forward" without claiming purely-vegan.
    VG: {
      title_en: 'Vegetarian',
      title_es: 'Vegetariano',
      paths: [
        { d: 'M5 19C5 12 11 5 19 5C19 13 13 19 6 19C5.5 19 5 19 5 19Z' },
        { d: 'M6 18L18 6' }
      ]
    },
    // GF — Gluten-free. Wheat ear (vertical spine + paired florets)
    // overlaid by a diagonal "no" slash. Reads at chip size as
    // "grain crossed out" — the universal supermarket convention.
    GF: {
      title_en: 'Gluten-free',
      title_es: 'Sin gluten',
      paths: [
        { d: 'M12 4V19' },
        { d: 'M12 8C13.5 8 14.5 9 15 10' },
        { d: 'M12 8C10.5 8 9.5 9 9 10' },
        { d: 'M12 12C13.5 12 14.5 13 15 14' },
        { d: 'M12 12C10.5 12 9.5 13 9 14' },
        { d: 'M12 16C13.5 16 14.5 17 15 18' },
        { d: 'M12 16C10.5 16 9.5 17 9 18' },
        { d: 'M5 19L19 5', w: 2 }
      ]
    },
    // DF — Dairy-free. Milk droplet outline + diagonal "no" slash.
    // Same slash convention as GF for visual consistency.
    DF: {
      title_en: 'Dairy-free',
      title_es: 'Sin lácteos',
      paths: [
        { d: 'M12 3C9 6.5 6 10 6 14C6 17.3 8.7 20 12 20C15.3 20 18 17.3 18 14C18 10 15 6.5 12 3Z' },
        { d: 'M5 19L19 5', w: 2 }
      ]
    },
    // N — Contains nuts. Acorn: rounded body with notched cap and
    // a tiny stem. Reads as "tree nut" without specifying which.
    N: {
      title_en: 'Contains nuts',
      title_es: 'Frutos secos',
      paths: [
        { d: 'M12 4V6' },
        { d: 'M8 7H16C16 9 15 11 14 11H10C9 11 8 9 8 7Z' },
        { d: 'M9 11C9 16 10 20 12 20C14 20 15 16 15 11' }
      ]
    },
    // E — Contains eggs. Tall oval with a small zig-zag crack on the
    // upper-left. Reads instantly as "egg".
    E: {
      title_en: 'Contains eggs',
      title_es: 'Huevos',
      paths: [
        { d: 'M12 4C8 4 6 9 6 13C6 17 8.7 20 12 20C15.3 20 18 17 18 13C18 9 16 4 12 4Z' },
        { d: 'M9 11L10.5 12L9 13L10.5 14' }
      ]
    },
    // SO — Contains soy. Soy pod: long horizontal capsule with three
    // bean-dots inside (filled circles drawn via extras).
    SO: {
      title_en: 'Contains soy',
      title_es: 'Soya',
      paths: [
        { d: 'M4 12C4 9 7 7 12 7C17 7 20 9 20 12C20 15 17 17 12 17C7 17 4 15 4 12Z' }
      ],
      extras: [
        { type: 'circle', cx: 8.5, cy: 12, r: 1.2, fill: true },
        { type: 'circle', cx: 12,  cy: 12, r: 1.2, fill: true },
        { type: 'circle', cx: 15.5, cy: 12, r: 1.2, fill: true }
      ]
    },
    // SF — Shellfish. Shrimp profile: curved body + tail flare +
    // antenna whiskers + a single eye (filled extra).
    SF: {
      title_en: 'Shellfish',
      title_es: 'Mariscos',
      paths: [
        { d: 'M6 9C9 6 14 6 17 9C19 11 19 14 17 16C14 18 10 18 8 16' },
        { d: 'M8 16L6 19' },
        { d: 'M10 17L9 20' },
        { d: 'M6 9L4 6' },
        { d: 'M6 9L3 9' }
      ],
      extras: [
        { type: 'circle', cx: 7, cy: 9, r: 0.7, fill: true }
      ]
    },
    // FI — Contains fish. Fish silhouette: pointed nose, body, fan
    // tail, single eye dot.
    FI: {
      title_en: 'Contains fish',
      title_es: 'Pescado',
      paths: [
        { d: 'M5 12C7 9 11 7 15 7C18 7 20 9 20 12C20 15 18 17 15 17C11 17 7 15 5 12Z' },
        { d: 'M5 12L2 9' },
        { d: 'M5 12L2 15' }
      ],
      extras: [
        { type: 'circle', cx: 17, cy: 11, r: 0.7, fill: true }
      ]
    },
    // SE — Sesame. Three small ellipses (seeds) at varied angles.
    // No outer container — the seeds themselves are the icon.
    SE: {
      title_en: 'Sesame',
      title_es: 'Sésamo',
      extras: [
        { type: 'ellipse', cx: 8,  cy: 8,  rx: 2.2, ry: 1.2, rot: -30, fill: true },
        { type: 'ellipse', cx: 14, cy: 10, rx: 2.2, ry: 1.2, rot: 20,  fill: true },
        { type: 'ellipse', cx: 11, cy: 15, rx: 2.2, ry: 1.2, rot: -10, fill: true }
      ]
    },
    // LO — Locally sourced. Map pin outline with a small star inset
    // marking the pin's center. Reads as "this came from somewhere
    // specific". Path uses only M/L/C/Z so the tiny PDF parser
    // handles it correctly (W21 review item #1).
    LO: {
      title_en: 'Locally sourced',
      title_es: 'Origen local',
      paths: [
        // Pin outline: bottom point at (12,22) -> right curve up to
        // (19,9) -> down-and-left to (12,3) -> down-and-left back to
        // start. Mirror left side via a second cubic.
        { d: 'M12 22C12 22 5 14 5 9C5 5.7 8.1 3 12 3C15.9 3 19 5.7 19 9C19 14 12 22 12 22Z' },
        // Inset 5-point star (literal coords; parser supports L/Z).
        { d: 'M12 6.5L13.2 8.6L15.5 9L13.7 10.7L14.2 13L12 11.9L9.8 13L10.3 10.7L8.5 9L10.8 8.6Z' }
      ]
    }
  };

  // SVG inline string for HTML emitters (preview, QR-menu HTML,
  // tablet kiosk, editor checkboxes). Uses currentColor so the
  // host's CSS color decides the stroke + fill.
  function inlineSvg(code, opts) {
    var g = GLYPHS[code]; if (!g) return '';
    opts = opts || {};
    var size = opts.size || 24;
    var strokeWidth = opts.strokeWidth != null ? opts.strokeWidth : 1.5;
    var aria = opts.title != null ? opts.title : (g.title_en || code);
    var paths = (g.paths || []).map(function (p) {
      var w = p.w || strokeWidth;
      return '<path d="' + p.d + '" stroke-width="' + w + '" />';
    }).join('');
    var extras = (g.extras || []).map(function (x) {
      var fillAttr = x.fill ? 'fill="currentColor" stroke="none"' : 'fill="none"';
      if (x.type === 'circle') {
        return '<circle cx="' + x.cx + '" cy="' + x.cy + '" r="' + x.r + '" ' + fillAttr + ' />';
      }
      if (x.type === 'ellipse') {
        var rot = x.rot ? ' transform="rotate(' + x.rot + ' ' + x.cx + ' ' + x.cy + ')"' : '';
        return '<ellipse cx="' + x.cx + '" cy="' + x.cy + '" rx="' + x.rx + '" ry="' + x.ry + '"' + rot + ' ' + fillAttr + ' />';
      }
      return '';
    }).join('');
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" ' +
      'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" ' +
      'role="img" aria-label="' + escapeXml(aria) + '">' +
      paths + extras +
      '</svg>';
  }

  function escapeXml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  // jsPDF draw routine. Renders the icon at (x, y, size) with a
  // theme color {r,g,b}. Reuses jsPDF primitives (lines, ellipses,
  // bezier curves) instead of raw SVG embedding so it works without
  // the svg2pdf plugin and at any size.
  //
  // Implementation note: we approximate path d strings by parsing
  // simple absolute commands (M, L, C, Z) — sufficient for the icons
  // shipped here. Callers needing arbitrary SVG should use svg2pdf.
  function drawPdf(doc, code, x, y, size, color) {
    var g = GLYPHS[code]; if (!g) return;
    color = color || { r: 0, g: 0, b: 0 };
    var sf = size / 24;
    doc.setDrawColor(color.r, color.g, color.b);
    doc.setFillColor(color.r, color.g, color.b);
    var defaultStroke = Math.max(0.5, 1.5 * sf * 0.6);
    (g.paths || []).forEach(function (p) {
      var w = (p.w || 1.5) * sf * 0.6;
      doc.setLineWidth(Math.max(0.4, w));
      drawSvgPath(doc, p.d, x, y, sf);
    });
    doc.setLineWidth(defaultStroke);
    (g.extras || []).forEach(function (extra) {
      if (extra.type === 'circle') {
        doc.ellipse(x + extra.cx * sf, y + extra.cy * sf, extra.r * sf, extra.r * sf, extra.fill ? 'F' : 'S');
      } else if (extra.type === 'ellipse') {
        // jsPDF doesn't rotate ellipses; for the small sesame seeds
        // we approximate with the major-axis ratio as-drawn.
        doc.ellipse(x + extra.cx * sf, y + extra.cy * sf, extra.rx * sf, extra.ry * sf, extra.fill ? 'F' : 'S');
      }
    });
  }

  // Tiny SVG path parser for absolute M, L, H, V, C, Z commands.
  // Sufficient for the path strings shipped above; defensive
  // parsing — unknown commands are silently skipped so a typo
  // doesn't crash the export.
  function drawSvgPath(doc, d, ox, oy, scale) {
    if (!d || typeof d !== 'string') return;
    var tokens = d.match(/[MLHVCZ]|-?\d*\.?\d+/gi);
    if (!tokens) return;
    var cmd = null, cur = { x: 0, y: 0 }, start = { x: 0, y: 0 };
    var i = 0;
    function num() {
      while (i < tokens.length && /[MLHVCZ]/i.test(tokens[i])) cmd = tokens[i++];
      return parseFloat(tokens[i++]);
    }
    while (i < tokens.length) {
      var t = tokens[i];
      if (/[MLHVCZ]/i.test(t)) { cmd = t; i++; if (cmd.toUpperCase() === 'Z') {
        doc.line(ox + cur.x * scale, oy + cur.y * scale, ox + start.x * scale, oy + start.y * scale);
        cur.x = start.x; cur.y = start.y; continue;
      } continue; }
      switch (cmd) {
        case 'M':
          cur.x = parseFloat(tokens[i++]); cur.y = parseFloat(tokens[i++]);
          start = { x: cur.x, y: cur.y };
          break;
        case 'L':
          var lx = parseFloat(tokens[i++]); var ly = parseFloat(tokens[i++]);
          doc.line(ox + cur.x * scale, oy + cur.y * scale, ox + lx * scale, oy + ly * scale);
          cur.x = lx; cur.y = ly;
          break;
        case 'H':
          var hx = parseFloat(tokens[i++]);
          doc.line(ox + cur.x * scale, oy + cur.y * scale, ox + hx * scale, oy + cur.y * scale);
          cur.x = hx;
          break;
        case 'V':
          var vy = parseFloat(tokens[i++]);
          doc.line(ox + cur.x * scale, oy + cur.y * scale, ox + cur.x * scale, oy + vy * scale);
          cur.y = vy;
          break;
        case 'C':
          var c1x = parseFloat(tokens[i++]); var c1y = parseFloat(tokens[i++]);
          var c2x = parseFloat(tokens[i++]); var c2y = parseFloat(tokens[i++]);
          var endx = parseFloat(tokens[i++]); var endy = parseFloat(tokens[i++]);
          if (typeof doc.curve === 'function') {
            doc.curve(
              ox + cur.x * scale, oy + cur.y * scale,
              ox + c1x * scale, oy + c1y * scale,
              ox + c2x * scale, oy + c2y * scale,
              ox + endx * scale, oy + endy * scale
            );
          } else if (typeof doc.lines === 'function') {
            // Older jsPDF builds: lines() with a single curve segment.
            doc.lines([[
              (c1x - cur.x) * scale, (c1y - cur.y) * scale,
              (c2x - cur.x) * scale, (c2y - cur.y) * scale,
              (endx - cur.x) * scale, (endy - cur.y) * scale
            ]], ox + cur.x * scale, oy + cur.y * scale, [1, 1], 'S', false);
          } else {
            // Last-ditch fallback: straight line from current to end.
            doc.line(ox + cur.x * scale, oy + cur.y * scale, ox + endx * scale, oy + endy * scale);
          }
          cur.x = endx; cur.y = endy;
          break;
        default:
          i++;
      }
    }
  }

  var api = {
    GLYPHS:   GLYPHS,
    inlineSvg: inlineSvg,
    drawPdf:  drawPdf,
    has:      function (code) { return !!GLYPHS[code]; }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_GLYPHS = api;
})(typeof window !== 'undefined' ? window : null);
