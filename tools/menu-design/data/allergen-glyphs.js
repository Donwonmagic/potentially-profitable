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
    // ============================================================
    // W25 — Muntin-designed allergen glyph set. Each icon shares
    // the family rules: 1.5pt round-cap stroke at 24x24, single
    // ink (currentColor), filled accents only at focal points,
    // 3-5 path elements maximum, balanced inside an 18x18 safe
    // area so silhouettes read at 14px chip size.
    //
    // Voice: editorial restraint. No flourishes. Each silhouette
    // is the most-economical reading of its referent — a leaf is
    // a leaf shape, not a leaf with veins and shadow. Where the
    // reading benefits from detail (an eye on the fish, beans
    // inside the pod, a crack on the egg, crosshatch on the
    // acorn cap), the detail is single-point and load-bearing.
    // ============================================================

    // V — Vegan. Sprout breaking through: small seed dot at the
    // base, single stem rising, two symmetric leaves opening at
    // the top. The seed-dot accent is the family's first
    // load-bearing detail — an inline, almost-typographic mark
    // that says "this grew from nothing".
    V: {
      title_en: 'Vegan',
      title_es: 'Vegano',
      paths: [
        { d: 'M12 21V12' },
        { d: 'M12 12C8.5 12 5.5 9.5 4.5 6.5C8 6.5 11 8.5 12 12Z' },
        { d: 'M12 12C15.5 12 18.5 9.5 19.5 6.5C16 6.5 13 8.5 12 12Z' }
      ],
      extras: [
        { type: 'circle', cx: 12, cy: 21.5, r: 0.8, fill: true }
      ]
    },

    // VG — Vegetarian. Single broad almond leaf, tilted naturally,
    // with a clean midrib running through it. Smoother sweep than
    // the W19 version; control points pulled inward so the curve
    // reads as a single confident gesture, not two arcs sutured
    // together.
    VG: {
      title_en: 'Vegetarian',
      title_es: 'Vegetariano',
      paths: [
        { d: 'M5 19C5 11.5 11.5 5 19 5C19 12.5 12.5 19 5 19Z' },
        { d: 'M6.5 17.5L17.5 6.5' }
      ]
    },

    // GF — Gluten-free. Wheat ear inside a circle, slashed at 45°.
    // Florets are clean perpendicular strokes (W19 used cubic
    // curves that thickened at the ear-tip; the new lines stay
    // even-weight and architectural). The circle frame visually
    // pairs GF and DF as the two "no" marks in the set.
    GF: {
      title_en: 'Gluten-free',
      title_es: 'Sin gluten',
      paths: [
        { d: 'M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z' },
        { d: 'M12 7V17' },
        { d: 'M12 9.5L14.5 11' },
        { d: 'M12 9.5L9.5 11' },
        { d: 'M12 12L14.5 13.5' },
        { d: 'M12 12L9.5 13.5' },
        { d: 'M12 14.5L14.5 16' },
        { d: 'M12 14.5L9.5 16' },
        { d: 'M5.5 18.5L18.5 5.5', w: 2 }
      ]
    },

    // DF — Dairy-free. Milk droplet inside a circle, slashed at
    // 45° (matching GF). The drop curve is now true teardrop
    // geometry (rounded bottom, narrow apex) instead of W19's
    // generic ovoid. Two cubic segments meet at the apex with
    // matched control points so the seam is invisible.
    DF: {
      title_en: 'Dairy-free',
      title_es: 'Sin lácteos',
      paths: [
        { d: 'M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z' },
        { d: 'M12 6.5C9.5 9.5 7.5 11.5 7.5 14C7.5 16.5 9.5 18 12 18C14.5 18 16.5 16.5 16.5 14C16.5 11.5 14.5 9.5 12 6.5Z' },
        { d: 'M5.5 18.5L18.5 5.5', w: 2 }
      ]
    },

    // N — Tree nuts. Acorn: rounded body, textured cap with three
    // crosshatch strokes (the reading detail that lifts this from
    // "egg-on-base" to "acorn"), and a small stem. The cap-body
    // separation line is the seam at y=9.5 — a deliberate cue.
    N: {
      title_en: 'Contains nuts',
      title_es: 'Frutos secos',
      paths: [
        { d: 'M12 3.5V5' },
        { d: 'M8 5C8 7.5 8.5 9 10 9.5H14C15.5 9 16 7.5 16 5Z' },
        { d: 'M9.5 6.5V8' },
        { d: 'M12 6.5V8' },
        { d: 'M14.5 6.5V8' },
        { d: 'M10 9.5C9 13 9.5 17 11 20C11.5 21 12.5 21 13 20C14.5 17 15 13 14 9.5' }
      ]
    },

    // E — Contains eggs. Asymmetric ovoid (narrower at top, wider
    // at base) with a small zig-zag crack on the upper-left. The
    // 4-point crack is intentionally typographic — a paragraph
    // mark, not a hole — so the egg reads as character not damage.
    E: {
      title_en: 'Contains eggs',
      title_es: 'Huevos',
      paths: [
        { d: 'M12 3.5C8 3.5 6 8.5 6 12.5C6 16.5 8.7 20 12 20C15.3 20 18 16.5 18 12.5C18 8.5 16 3.5 12 3.5Z' },
        { d: 'M9 11L10.5 12L9 13L10.5 14' }
      ]
    },

    // SO — Contains soy. Pod with a natural constriction between
    // two beans. The W19 version had three filled dots on a flat
    // ellipse; this one has a true bean-pod silhouette (two beans
    // with a pinch in the middle of the outline) plus two filled
    // bean accents at the focal points. Reads as "two beans in a
    // pod" at every size, where W19 read as "three beads in a tube".
    SO: {
      title_en: 'Contains soy',
      title_es: 'Soya',
      paths: [
        { d: 'M3 12C3 10 5 8 7.5 8C9 8 10 9 10.5 10.5C11 11 11.5 11 12 11C12.5 11 13 11 13.5 10.5C14 9 15 8 16.5 8C19 8 21 10 21 12C21 14 19 16 16.5 16C15 16 14 15 13.5 13.5C13 13 12.5 13 12 13C11.5 13 11 13 10.5 13.5C10 15 9 16 7.5 16C5 16 3 14 3 12Z' }
      ],
      extras: [
        { type: 'circle', cx: 7.5,  cy: 12, r: 1.6, fill: true },
        { type: 'circle', cx: 16.5, cy: 12, r: 1.6, fill: true }
      ]
    },

    // SF — Shellfish. Shrimp curl: C-curve body running upper-left
    // to lower-right, two tail-fan strokes, two antennae, and one
    // filled eye. New addition vs W19: two short body-segmentation
    // arcs along the curve (the visual cue that says "shrimp" not
    // "abstract C"). Eye-dot kept as the family's filled-accent
    // signature.
    SF: {
      title_en: 'Shellfish',
      title_es: 'Mariscos',
      paths: [
        { d: 'M6 9C9 6 14 6 17 9C19 11 19 14 17 16C14 18 10 18 8 16' },
        { d: 'M9.5 8C9.7 9 10 10 10.5 10.5' },
        { d: 'M13 7.5C13.2 8.5 13.5 9.5 14 10' },
        { d: 'M8 16L6 19' },
        { d: 'M10 17L9 20' },
        { d: 'M6 9L4 6' },
        { d: 'M6 9L3 9.5' }
      ],
      extras: [
        { type: 'circle', cx: 7, cy: 9, r: 0.7, fill: true }
      ]
    },

    // FI — Contains fish. Pointed-nose body + fan tail, with two
    // load-bearing detail strokes new in W25: a small gill arc
    // near the nose (gives the fish its character — without it
    // the silhouette reads as "leaf with V"), and the eye-dot.
    FI: {
      title_en: 'Contains fish',
      title_es: 'Pescado',
      paths: [
        { d: 'M5 12C7 9 11 7 15 7C18 7 20 9 20 12C20 15 18 17 15 17C11 17 7 15 5 12Z' },
        { d: 'M5 12L2 8.5' },
        { d: 'M5 12L2 15.5' },
        { d: 'M14.5 9.5C14 11 14 13 14.5 14.5' }
      ],
      extras: [
        { type: 'circle', cx: 17, cy: 11, r: 0.7, fill: true }
      ]
    },

    // SE — Sesame. Three filled seed-ovals at varied angles in a
    // loose triangle. The set's most typographic icon — almost a
    // braille pattern. Tightened from W19 with slightly larger
    // seeds (rx 2.4 vs 2.2) so they read at chip size; angles
    // varied for organic asymmetry.
    SE: {
      title_en: 'Sesame',
      title_es: 'Sésamo',
      extras: [
        { type: 'ellipse', cx: 8,    cy: 8,    rx: 2.4, ry: 1.2, rot: -30, fill: true },
        { type: 'ellipse', cx: 14.5, cy: 10,   rx: 2.4, ry: 1.2, rot:  25, fill: true },
        { type: 'ellipse', cx: 11,   cy: 15.5, rx: 2.4, ry: 1.2, rot: -10, fill: true }
      ]
    },

    // LO — Locally sourced. Map pin outline + inset 5-point star.
    // Path uses only M/L/C/Z so the tiny PDF parser handles it
    // correctly. The pin shape is geometrically exact: a circle
    // tangent to two cubic-bezier flanks meeting at a single
    // vertex at the bottom. The star is hand-tuned so its base
    // sits exactly on the pin's optical center.
    LO: {
      title_en: 'Locally sourced',
      title_es: 'Origen local',
      paths: [
        { d: 'M12 22C12 22 5 14 5 9C5 5.7 8.1 3 12 3C15.9 3 19 5.7 19 9C19 14 12 22 12 22Z' },
        { d: 'M12 6.5L13.2 8.6L15.5 9L13.7 10.7L14.2 13L12 11.9L9.8 13L10.3 10.7L8.5 9L10.8 8.6Z' }
      ]
    },

    // ============================================================
    // Wave B2 — regional allergen extension. Six glyphs covering
    // EU FIC 14 + UK PPDS regimes. Same family rules: 1.5pt stroke
    // at 24x24, single ink, balanced inside an 18x18 safe area.
    // Each silhouette is the most-economical reading of its
    // referent. Where the W25 set used filled accents at focal
    // points, these reuse that grammar (shell whorl center, lupin
    // seed dots, sulphite bubbles) so the visual family holds.
    // ============================================================

    // PE — Peanuts. Classic figure-8 shell silhouette with two
    // filled seed-dots inside, one per lobe. Distinct from N
    // (tree nuts) by the horizontal orientation and the pinch.
    PE: {
      title_en: 'Peanuts',
      title_es: 'Cacahuetes',
      paths: [
        { d: 'M5 12C5 8 7 6 9 6C11 6 12 8 12 10C12 8 13 6 15 6C17 6 19 8 19 12C19 16 17 18 15 18C13 18 12 16 12 14C12 16 11 18 9 18C7 18 5 16 5 12Z' }
      ],
      extras: [
        { type: 'circle', cx: 8.7,  cy: 12, r: 1.0, fill: true },
        { type: 'circle', cx: 15.3, cy: 12, r: 1.0, fill: true }
      ]
    },

    // MU — Mustard. Squeeze-bottle silhouette: short neck, broad
    // shoulder, tapered body. Reads as a condiment vessel without
    // resorting to label text. Cap-line at the top is a single
    // horizontal stroke.
    MU: {
      title_en: 'Mustard',
      title_es: 'Mostaza',
      paths: [
        { d: 'M9 4H15V7L17 9V20C17 21 16 22 15 22H9C8 22 7 21 7 20V9L9 7Z' },
        { d: 'M9 4H15' }
      ]
    },

    // CE — Celery. Vertical stalk with three short leaf strokes
    // fanning outward at the top. Stalk is two parallel uprights
    // joined at the bottom; leaf strokes are economical L-curves
    // that suggest fronds without rendering them literally.
    CE: {
      title_en: 'Celery',
      title_es: 'Apio',
      paths: [
        { d: 'M10 22V8' },
        { d: 'M14 22V8' },
        { d: 'M10 8C9 6 8 4 6 3' },
        { d: 'M12 8C12 5 12 3 12 2' },
        { d: 'M14 8C15 6 16 4 18 3' }
      ]
    },

    // LU — Lupin. Vertical pod (long oval, slight lean) with
    // three filled seed-dots arrayed inside. Distinct from V
    // (vegan sprout) which uses leaves; from PE (peanuts) which
    // is horizontal and pinched.
    LU: {
      title_en: 'Lupin',
      title_es: 'Altramuz',
      paths: [
        { d: 'M12 3C9.5 3 8 5 8 9V17C8 20 9.5 21 12 21C14.5 21 16 20 16 17V9C16 5 14.5 3 12 3Z' }
      ],
      extras: [
        { type: 'circle', cx: 12, cy: 8.5,  r: 1.1, fill: true },
        { type: 'circle', cx: 12, cy: 12,   r: 1.1, fill: true },
        { type: 'circle', cx: 12, cy: 15.5, r: 1.1, fill: true }
      ]
    },

    // MO — Molluscs. Spiral shell silhouette: outer arc opens
    // upward, inner whorl tightens to a filled center-dot. The
    // dot is the family's load-bearing detail, mirroring the
    // SE (sesame) seed accents.
    MO: {
      title_en: 'Molluscs',
      title_es: 'Moluscos',
      paths: [
        { d: 'M3 17C3 10 8 5 14 5C19 5 22 8 22 12C22 16 19 19 15 19C12 19 10 17 10 14C10 12 11.5 10 14 10C16 10 17 11.5 17 13' }
      ],
      extras: [
        { type: 'circle', cx: 14.5, cy: 13, r: 0.9, fill: true }
      ]
    },

    // SU — Sulphites (≥10ppm in wine, dried fruit, pickles).
    // Erlenmeyer flask silhouette: narrow neck, broad triangular
    // base, two small bubble-dots floating above the rim to
    // suggest fermentation / chemistry without literal labelling.
    SU: {
      title_en: 'Sulphites',
      title_es: 'Sulfitos',
      paths: [
        { d: 'M10 4H14V10L19 20C19.5 21 19 22 18 22H6C5 22 4.5 21 5 20L10 10Z' },
        { d: 'M10 4H14' },
        { d: 'M8 16H16' }
      ],
      extras: [
        { type: 'circle', cx: 8.5, cy: 3, r: 0.7, fill: true },
        { type: 'circle', cx: 15.5, cy: 2, r: 0.6, fill: true }
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
