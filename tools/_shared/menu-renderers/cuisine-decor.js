/**
 * Muntin cuisine-decoration library — Wave studio-quality.
 *
 * Curated single-stroke line art that gives each cuisine + theme
 * a visual identity in the picker thumbnails AND in the actual
 * deliverable (QR-menu HTML, print PDF). The same data drives all
 * three surfaces so the operator's experience is end-to-end coherent:
 * pick a Trattoria theme → see olive branch on the thumbnail → see
 * the same olive branch on the live preview → see it on the printed
 * PDF the diner actually holds.
 *
 * Visual language:
 *   - 24×24 unit local coordinates per motif
 *   - 1.0–1.4 unit stroke weight
 *   - 12–16% opacity in the host theme's muted color
 *   - currentColor inheritance so no per-decoration color tuning
 *   - aria-hidden on every wrapper (decorative, not informational)
 *
 * Consumers:
 *   - scripts/build-theme-thumbnails.mjs (picker SVG bundle)
 *   - tools/menu-design/menu-render-html.js (QR-menu HTML overlay)
 *   - tools/menu-design/menu-render-pdf.js (PDF overlay; future)
 *   - tools/menu-design/menu-design.js (live preview overlay; future)
 *
 * UMD-ish loader: attaches MD_DECOR on window in browser; module.exports
 * in Node.
 */
(function (root) {
  'use strict';

  // ---- Motif library ---------------------------------------------
  // paths: array of SVG path d-strings rendered as fill=none stroke=
  // currentColor. extras: pre-built SVG fragment strings (typically
  // <circle>/<rect>/<polygon>), default fill=currentColor.
  var DECOR = {
    'olive-branch': {
      paths: [
        'M2 12 Q9 8 18 5',
        'M5 11 Q3 8 1 9 Q3 11 5 11',
        'M9 9.5 Q7 6 5 7 Q7 9 9 10',
        'M13 8 Q11 5 9 6 Q11 8 13 8.5',
        'M16 6.7 Q14 4 12 5 Q14 7 16 7.3'
      ],
      extras: ['<circle cx="17" cy="5.4" r="0.6"/>',
               '<circle cx="14" cy="6.5" r="0.55"/>',
               '<circle cx="11" cy="7.7" r="0.5"/>']
    },
    'talavera': {
      paths: ['M12 2 L13 8 L19 7 L14 11 L18 17 L12 14 L6 17 L10 11 L5 7 L11 8 Z'],
      extras: ['<circle cx="12" cy="11" r="1.2"/>',
               '<circle cx="12" cy="11" r="2.4" fill="none" stroke="currentColor" stroke-width="0.4"/>']
    },
    'fleur-de-lis': {
      paths: [
        'M12 3 Q11 7 8 9 Q10 10 11 13 L11 19 Q9 17 6 17 Q9 15 9 12 Q11 11 12 8',
        'M12 3 Q13 7 16 9 Q14 10 13 13 L13 19 Q15 17 18 17 Q15 15 15 12 Q13 11 12 8',
        'M9 13 L15 13'
      ],
      extras: []
    },
    'crane': {
      paths: [
        'M3 14 Q8 12 11 13 L13 13 Q15 11 18 8 L20 7',
        'M11 13 Q11 16 9 18 M11 13 Q12 16 11 18',
        'M19.5 7.5 L21 6.5 M19.5 7.5 L20.5 8.5'
      ],
      extras: ['<circle cx="19" cy="7.8" r="0.35"/>']
    },
    'wave': {
      paths: [
        'M0 6 Q3 3 6 6 T12 6 T18 6 T24 6',
        'M0 9.5 Q3 7 6 9.5 T12 9.5 T18 9.5 T24 9.5'
      ],
      extras: []
    },
    'laurel': {
      paths: [
        'M3 18 Q5 14 8 12 Q11 10 13 8 Q15 6 17 5',
        'M5 16 L7 17 M7 14 L9 15 M9 12 L11 13 M11 10 L13 11 M13 8 L15 9 M15 6 L17 7'
      ],
      extras: []
    },
    'coffee-bean': {
      paths: [
        'M5 5 Q7 3 9 5 Q7 7 5 5 M5 5 Q7 5 9 5',
        'M11 8 Q13 6 15 8 Q13 10 11 8 M11 8 Q13 8 15 8',
        'M7 12 Q9 10 11 12 Q9 14 7 12 M7 12 Q9 12 11 12'
      ],
      extras: []
    },
    'brush-stroke': {
      paths: ['M2 14 Q6 6 14 9 Q19 11 22 7'],
      extras: ['<circle cx="22" cy="7" r="0.7"/>']
    },
    'grape-cluster': {
      paths: ['M12 2 Q14 4 13 7', 'M11 7 L13 7'],
      extras: [
        '<circle cx="10" cy="9" r="1.6"/>', '<circle cx="14" cy="9" r="1.6"/>',
        '<circle cx="8" cy="12" r="1.6"/>', '<circle cx="12" cy="12" r="1.6"/>',
        '<circle cx="16" cy="12" r="1.6"/>', '<circle cx="10" cy="15" r="1.6"/>',
        '<circle cx="14" cy="15" r="1.6"/>', '<circle cx="12" cy="18" r="1.6"/>'
      ]
    },
    'deco-fan': {
      paths: [
        'M12 20 L4 6 M12 20 L7 5 M12 20 L12 4 M12 20 L17 5 M12 20 L20 6',
        'M4 6 Q12 2 20 6'
      ],
      extras: []
    },
    'pizza-slice': {
      paths: ['M12 3 L4 19 L20 19 Z', 'M5 17 L19 17'],
      extras: ['<circle cx="10" cy="11" r="0.9"/>',
               '<circle cx="14" cy="11" r="0.9"/>',
               '<circle cx="12" cy="14" r="0.9"/>']
    },
    'wood-grain': {
      paths: [
        'M0 4 Q6 5 12 4 T24 4', 'M0 9 Q6 10 12 9 T24 9',
        'M0 14 Q6 13 12 14 T24 14', 'M0 19 Q6 20 12 19 T24 19'
      ],
      extras: []
    },
    'leaf-cluster': {
      paths: [
        'M12 4 Q8 8 8 14 Q12 12 12 18',
        'M12 4 Q16 8 16 14 Q12 12 12 18',
        'M12 4 L12 18'
      ],
      extras: []
    },
    'confetti': {
      paths: [],
      extras: [
        '<circle cx="3" cy="4" r="1.2"/>', '<circle cx="20" cy="3" r="1"/>',
        '<circle cx="6" cy="14" r="0.9"/>', '<circle cx="18" cy="13" r="1.3"/>',
        '<circle cx="11" cy="6" r="0.8"/>', '<circle cx="14" cy="18" r="1.1"/>',
        '<circle cx="22" cy="9" r="0.7"/>',
        '<rect x="2" y="11" width="2" height="2" transform="rotate(20 3 12)"/>',
        '<rect x="20" y="17" width="1.6" height="1.6" transform="rotate(35 20.8 17.8)"/>'
      ]
    },
    'spanish-tile': {
      paths: ['M12 2 L15 9 L22 9 L17 13 L19 20 L12 16 L5 20 L7 13 L2 9 L9 9 Z'],
      extras: ['<circle cx="12" cy="12" r="1.5" fill="none" stroke="currentColor" stroke-width="0.5"/>']
    },
    'coffee-cup': {
      paths: [
        'M5 12 L5 17 Q5 19 7 19 L15 19 Q17 19 17 17 L17 12 Z',
        'M17 13 Q20 13 20 16 Q20 18 17 18',
        'M8 6 Q9 8 8 10 M11 5 Q12 7 11 9 M14 6 Q15 8 14 10'
      ],
      extras: []
    },
    // Wave studio-quality — paisley (boteh) + small Mughal arch.
    // The paisley curl is a classic South-Asian textile motif; the
    // arch hints at Mughal architecture without being literal. Both
    // shapes carry the Indian-cuisine identity at low opacity behind
    // the menu content.
    'paisley': {
      paths: [
        'M5 18 Q3 14 5 11 Q7 8 11 8 Q15 8 17 11 Q18 13 17 16 Q15 19 11 19 Q9 19 7 17 Q9 17 11 16 Q14 14 13 11 Q11 9 8 11 Q5 14 7 17',
        'M14 5 Q14 3 16 3 Q18 3 18 5 L18 8 L14 8 Z'
      ],
      extras: [
        '<circle cx="11" cy="13" r="1" fill="none" stroke="currentColor" stroke-width="0.4"/>',
        '<circle cx="9" cy="14" r="0.4" fill="currentColor"/>',
        '<circle cx="13" cy="13" r="0.4" fill="currentColor"/>'
      ]
    },
    // Wave studio-quality — flame motif for Korean BBQ tabletop-grill
    // theme. Three flame tongues curving up; minimal stroke so the
    // motif sits softly behind menu content at low opacity.
    'flame': {
      paths: [
        'M9 19 Q6 16 7 13 Q8 11 9 9 Q9 12 11 13 Q11 11 12 9 Q12 12 14 13 Q15 11 15 9 Q16 11 17 13 Q18 16 15 19',
        'M11 17 Q10 15 11 13 Q12 14 11 17',
        'M13 17 Q14 15 13 13 Q12 14 13 17'
      ],
      extras: []
    },
    // Wave studio-quality — Persian eight-pointed star (girih / khatam).
    // Two squares rotated 45° on each other form the classic 8-point
    // star at the heart of Persian / Iranian decorative geometry.
    // Inner small star adds depth without going busy.
    'persian-star': {
      paths: [
        'M12 3 L15 9 L21 12 L15 15 L12 21 L9 15 L3 12 L9 9 Z',
        'M12 6 L13.5 10.5 L18 12 L13.5 13.5 L12 18 L10.5 13.5 L6 12 L10.5 10.5 Z'
      ],
      extras: [
        '<circle cx="12" cy="12" r="0.6" fill="currentColor"/>'
      ]
    }
  };

  // ---- Cuisine + content-type → motif key + position +scale ------
  // Returns null when no cuisine match — caller renders nothing.
  // x/y/s coordinates are tuned for the THUMBNAIL viewBox (220×120);
  // consumers in other surfaces pass them through their own
  // positioning math (HTML uses a max-width container; PDF uses
  // page-relative positioning).
  function decorationFor(theme) {
    if (!theme) return null;
    var ct = theme.contentType || 'standard';
    var ch = (theme.cuisineHint || []).map(String);
    function has(re) { return ch.some(function (s) { return re.test(s); }); }

    if (ct === 'tasting')  return { key: 'brush-stroke',  x: 8,   y: 88, s: 1.3 };
    if (ct === 'wine')     return { key: 'grape-cluster', x: 178, y: 38, s: 1.2 };
    if (ct === 'cocktail') return { key: 'deco-fan',      x: 178, y: 38, s: 1.3 };
    if (ct === 'kids')     return { key: 'confetti',      x: 0,   y: 0,  s: 4 };

    if (has(/italian|trattor|pasta/i))                       return { key: 'olive-branch', x: 175, y: 38, s: 1.4 };
    if (has(/mexic|taco|cantina/i))                          return { key: 'talavera',     x: 178, y: 38, s: 1.3 };
    if (has(/french|bistro|francesa|brasser/i))              return { key: 'fleur-de-lis', x: 180, y: 36, s: 1.4 };
    if (has(/japan|ramen|sushi|izakaya|noodle/i))            return { key: 'crane',        x: 4,   y: 86, s: 1.3 };
    if (has(/asian|thai|viet|kor/i))                         return { key: 'crane',        x: 4,   y: 86, s: 1.3 };
    if (has(/seafood|oyster|fish|maris|pesc|raw bar/i))      return { key: 'wave',         x: 0,   y: 0,  s: 9.2 };
    if (has(/steak|chop|parr|asad|grill/i))                  return { key: 'laurel',       x: 175, y: 36, s: 1.5 };
    if (has(/cafe|café|bakery|patisser|coffee/i))            return { key: 'coffee-bean',  x: 178, y: 38, s: 1.3 };
    if (has(/pizza|slice/i))                                 return { key: 'pizza-slice',  x: 178, y: 38, s: 1.3 };
    if (has(/bbq|barbec|smoke|brisket|brewpub|brewery/i))    return { key: 'wood-grain',   x: 0,   y: 28, s: 9.2 };
    if (has(/farm|garden|plant|seasonal/i))                  return { key: 'leaf-cluster', x: 178, y: 36, s: 1.4 };
    if (has(/tapas|pinchos|spanish|andaluz/i))               return { key: 'spanish-tile', x: 178, y: 38, s: 1.3 };
    if (has(/diner|breakfast|burger/i))                      return { key: 'coffee-cup',   x: 178, y: 36, s: 1.4 };
    if (has(/dessert|patisserie|dolci/i))                    return { key: 'leaf-cluster', x: 178, y: 36, s: 1.4 };
    // Wave studio-quality — Indian-cuisine motif (paisley + Mughal
    // arch). Operators currently default to a wrong theme; this gives
    // the modern-indian theme its visual identity end-to-end.
    if (has(/indian|india|mughal|tandoor|biryani|curry|punjab|tamil|bengali|gujarati|kashmir/i)) {
      return { key: 'paisley', x: 175, y: 38, s: 1.3 };
    }
    // Wave studio-quality — Korean BBQ. Flame tongue motif for the
    // tabletop-grill cuisine. Differentiates from generic bbq-smoke.
    if (has(/korean.*bbq|kbbq|korean barbecue|gogi|samgyeopsal|bulgogi|galbi|coreana/i)) {
      return { key: 'flame', x: 178, y: 38, s: 1.3 };
    }
    // Wave studio-quality — Levantine / Mediterranean sharing plates.
    // Reuses the olive-branch motif (olive trees are central to this
    // cuisine culture). Covers Lebanese / Israeli / Palestinian /
    // Syrian / Jordanian / Greek / Turkish overlap.
    if (has(/levant|leban|israel|palest|syrian|jordan|mezze|hummus|falafel|shawarma|kebab|greek|turkish|mediterran|aegean/i)) {
      return { key: 'olive-branch', x: 175, y: 38, s: 1.4 };
    }
    // Wave studio-quality — Peruvian coastal cuisine. Ceviche-driven,
    // heavily seafood. Reuses the wave motif (Pacific coastline).
    // Covers Peruvian / Nikkei / Pisco bar overlap.
    if (has(/peruvian|peru|nikkei|ceviche|tiradito|pisco|cevicheria|chifa/i)) {
      return { key: 'wave', x: 0, y: 0, s: 9.2 };
    }
    // Wave studio-quality — Persian / Iranian high-end cuisine.
    // Eight-pointed star (girih / khatam) is classic Persian geometry.
    if (has(/persian|iran|iranian|saffron|kebab persian|tahdig|fesenjan|ghormeh|persa/i)) {
      return { key: 'persian-star', x: 178, y: 38, s: 1.4 };
    }
    return null;
  }

  // ---- Build an inline SVG fragment ------------------------------
  // Returns an SVG <g>…</g> string (no outer <svg>). The caller wraps
  // in their own SVG container with whatever viewBox + positioning
  // they need.
  //
  // Options:
  //   color: stroke/fill color. Defaults to theme.muted || theme.accent
  //   opacity: 0–1. Defaults to 0.13 (0.10 for kids/wave/wood-grain
  //     since those motifs are denser visually)
  //   strokeWidth: defaults to 1.0 (1.4 for wave/wood-grain/brush)
  //   x, y, s: position + scale. Defaults to decorationFor().
  function svgFragment(theme, opts) {
    opts = opts || {};
    var dec = opts.decoration || decorationFor(theme);
    if (!dec) return '';
    var motif = DECOR[dec.key];
    if (!motif) return '';
    var color = opts.color || (theme.muted || theme.accent || '#7C6F60');
    var heavyKey = (dec.key === 'kids' || dec.key === 'confetti' || dec.key === 'wave' || dec.key === 'wood-grain');
    var opacity = (typeof opts.opacity === 'number') ? opts.opacity
      : (heavyKey ? 0.10 : 0.13);
    var sw = opts.strokeWidth || ((dec.key === 'wave' || dec.key === 'wood-grain' || dec.key === 'brush-stroke') ? 1.4 : 1.0);
    var x = (typeof opts.x === 'number') ? opts.x : dec.x;
    var y = (typeof opts.y === 'number') ? opts.y : dec.y;
    var s = (typeof opts.s === 'number') ? opts.s : dec.s;

    var inner = '';
    motif.paths.forEach(function (d) {
      inner += '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"/>';
    });
    motif.extras.forEach(function (e) {
      inner += (e.indexOf('fill=') >= 0 ? e : e.replace(/<(circle|rect)/, '<$1 fill="currentColor"'));
    });
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" color="' + color + '" opacity="' + opacity + '" aria-hidden="true">' + inner + '</g>';
  }

  // Convenience: a complete <svg>…</svg> wrapper sized to a given box.
  // Useful for the QR-menu HTML overlay where the decoration ships
  // as a positioned <aside>.
  function svgWrapped(theme, opts) {
    opts = opts || {};
    var w = opts.width  || 220;
    var h = opts.height || 120;
    var frag = svgFragment(theme, opts);
    if (!frag) return '';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h +
           '" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
           frag + '</svg>';
  }

  var api = {
    DECOR:           DECOR,
    decorationFor:   decorationFor,
    svgFragment:     svgFragment,
    svgWrapped:      svgWrapped
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_DECOR = api;
})(typeof window !== 'undefined' ? window : null);
