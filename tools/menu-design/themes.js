/**
 * Menu Design Suite — themes registry.
 *
 * Pure data, no logic. Each theme is a token bundle the preview
 * renderer (and later the PDF renderer) consumes verbatim. Themes
 * are intentionally constrained — four shapes, no theme builder.
 * The point is "owners who don't design get a result that doesn't
 * look amateur," not "owners can express any aesthetic in CSS."
 *
 * Loaded as a global MD_THEMES on the window before menu-design.js
 * runs. UMD-ish wrapper keeps it Node-checkable (used in A3 PDF
 * test fixtures) without a build step.
 */
(function (root) {
  'use strict';

  var THEMES = {
    // 1. Trattoria — warm cream stock, serif body, hand-rule
    //    dividers, leader-dot prices. The "neighborhood Italian
    //    that's been there 30 years" vibe.
    trattoria: {
      id: 'trattoria',
      label_en: 'Trattoria',
      label_es: 'Trattoria',
      blurb_en: 'Cream stock, serif body, hand-drawn rules. Neighborhood Italian energy.',
      blurb_es: 'Papel crema, cuerpo serif, reglas a mano. Energía de trattoria de barrio.',
      paper:    '#FAF6EE',
      ink:      '#2A2620',
      accent:   '#7A2E1F',
      muted:    '#7A6F60',
      bodyFamily:    'Georgia, "Times New Roman", serif',
      displayFamily: 'Fraunces, Georgia, "Times New Roman", serif',
      h1Pt:    32,
      h2Pt:    18,
      bodyPt:  11,
      pricePt: 11,
      descPt:  9.5,
      priceStyle:    'leader-dots',
      dividerStyle:  'hand-rule',
      columns:       1,
      logoSlot:      'header-center',
      letterSpacing: 'normal',
      sectionCase:   'capitalize',
      paperFloors:   ['letter', 'a4', 'half-page', 'trifold', 'table-tent'],
      cuisineHint: ['italian', 'italiana', 'trattoria', 'osteria', 'pasta', 'family italian']
    },

    // 2. Diner counter — white stock, sans body, monospaced
    //    right-aligned prices, boxed sections. The "two-page
    //    laminated counter menu" vibe.
    'diner-counter': {
      id: 'diner-counter',
      label_en: 'Diner counter',
      label_es: 'Mostrador de diner',
      blurb_en: 'White stock, sans body, monospace prices. Two-page-counter energy.',
      blurb_es: 'Papel blanco, cuerpo sans, precios monoespaciados. Energía de mostrador.',
      paper:    '#FFFFFF',
      ink:      '#14161A',
      accent:   '#1F4E5B',
      muted:    '#5C6470',
      bodyFamily:    '"Helvetica Neue", Arial, sans-serif',
      displayFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
      h1Pt:    28,
      h2Pt:    14,
      bodyPt:  11,
      pricePt: 11,
      descPt:  10,
      priceStyle:    'right-monospace',
      dividerStyle:  'box',
      columns:       2,
      logoSlot:      'header-left',
      letterSpacing: 'normal',
      sectionCase:   'uppercase',
      paperFloors:   ['letter', 'a4', 'half-page'],
      cuisineHint: ['diner', 'breakfast', 'burger', 'sandwich', 'deli', 'comfort food', 'american casual']
    },

    // 3. Modern minimal — Inter only, generous whitespace, no
    //    rules, tab-stop prices. The "30-dish bistro that wants
    //    to look like Eleven Madison's spinoff" vibe.
    'modern-minimal': {
      id: 'modern-minimal',
      label_en: 'Modern minimal',
      label_es: 'Minimalista moderno',
      blurb_en: 'Generous whitespace, no rules, tab-aligned prices. Quiet bistro confidence.',
      blurb_es: 'Espacios generosos, sin reglas, precios alineados. Confianza tranquila.',
      paper:    '#F5F2EE',
      ink:      '#1F2024',
      accent:   '#1F4E5B',
      muted:    '#7C8088',
      bodyFamily:    'Inter, system-ui, sans-serif',
      displayFamily: 'Inter, system-ui, sans-serif',
      h1Pt:    26,
      h2Pt:    11,
      bodyPt:  11,
      pricePt: 11,
      descPt:  9.5,
      priceStyle:    'tab-aligned',
      dividerStyle:  'whitespace',
      columns:       1,
      logoSlot:      'header-right',
      letterSpacing: 'wide',
      sectionCase:   'uppercase',
      paperFloors:   ['letter', 'a4', 'half-page', 'trifold', 'table-tent'],
      cuisineHint: ['modern', 'minimalist', 'tasting', 'bistro', 'new american', 'farm to table']
    },

    // 4. Brasserie — black on cream, Georgia + Inter caps,
    //    ornament dividers, leader dots, watermark logo. The
    //    "white-tablecloth weeknight vibe."
    brasserie: {
      id: 'brasserie',
      label_en: 'Brasserie',
      label_es: 'Brasserie',
      blurb_en: 'Cream paper, ornament dividers, watermark logo. Weeknight white-tablecloth.',
      blurb_es: 'Papel crema, divisores ornamentales, logo de marca de agua. Mantel blanco entre semana.',
      paper:    '#F2EDE2',
      ink:      '#1A1612',
      accent:   '#3E2A14',
      muted:    '#6E5E4A',
      bodyFamily:    'Georgia, "Times New Roman", serif',
      displayFamily: 'Georgia, "Times New Roman", serif',
      h1Pt:    34,
      h2Pt:    13,
      bodyPt:  11,
      pricePt: 11,
      descPt:  9.5,
      priceStyle:    'leader-dots',
      dividerStyle:  'ornament',
      columns:       2,
      logoSlot:      'watermark',
      letterSpacing: 'normal',
      sectionCase:   'small-caps',
      paperFloors:   ['letter', 'a4', 'half-page'],
      cuisineHint: ['french', 'french bistro', 'wine bar', 'francesa', 'francesa moderna']
    },

    // 5. Cantina — terracotta + cream, hand-set serif display,
    //    rustic divider, accent ornament between sections. The
    //    "Mexican family-run with abuela's recipes" vibe.
    cantina: {
      id: 'cantina',
      label_en: 'Cantina',
      label_es: 'Cantina',
      blurb_en: 'Terracotta accents on cream stock, hand-set display, rustic dividers. Family-run cantina.',
      blurb_es: 'Acentos terracota sobre crema, display a mano, divisores rústicos. Cantina familiar.',
      paper:    '#F8F1E0',
      ink:      '#2A1A14',
      accent:   '#A0411D',
      muted:    '#8A6F50',
      bodyFamily:    'Georgia, "Times New Roman", serif',
      displayFamily: 'Cormorant Garamond, Georgia, "Times New Roman", serif',
      h1Pt:    32,
      h2Pt:    16,
      bodyPt:  11,
      pricePt: 11,
      descPt:  9.5,
      priceStyle:    'leader-dots',
      dividerStyle:  'ornament',
      columns:       1,
      logoSlot:      'header-center',
      letterSpacing: 'normal',
      sectionCase:   'small-caps',
      paperFloors:   ['letter', 'a4', 'half-page', 'trifold', 'table-tent'],
      ornamentGlyph: '◆',
      cuisineHint: ['mexican', 'mexicana', 'taco', 'taqueria', 'taquería', 'cantina', 'tex-mex']
    },

    // 6. Asian Table — ivory + ink-black, large display serif,
    //    minimalist whitespace dividers, generous bottom padding
    //    so dish names breathe. The "modern Vietnamese / Thai /
    //    Korean tasting room" vibe.
    'asian-table': {
      id: 'asian-table',
      label_en: 'Asian Table',
      label_es: 'Mesa Asiática',
      blurb_en: 'Ivory + ink, generous whitespace. Modern East-Asian tasting calm.',
      blurb_es: 'Marfil + tinta, mucho espacio. Calma de degustación asiática moderna.',
      paper:    '#F4F1E9',
      ink:      '#0E0E0E',
      accent:   '#9F2D1F',
      muted:    '#5C5A52',
      bodyFamily:    'Inter, system-ui, sans-serif',
      displayFamily: 'Noto Serif, Georgia, serif',
      h1Pt:    30,
      h2Pt:    13,
      bodyPt:  11,
      pricePt: 11,
      descPt:  9.5,
      priceStyle:    'tab-aligned',
      dividerStyle:  'whitespace',
      columns:       2,
      logoSlot:      'header-right',
      letterSpacing: 'wide',
      sectionCase:   'uppercase',
      paperFloors:   ['letter', 'a4', 'half-page'],
      cuisineHint: ['vietnamese', 'thai', 'korean', 'japanese', 'asian fusion', 'pho', 'sushi', 'ramen', 'tailandesa', 'coreana', 'japonesa']
    },

    // 7. Coastal Raw Bar — pale sand, navy display, deckle-edge
    //    dividers. The "oyster bar / fish house" vibe.
    'coastal-raw-bar': {
      id: 'coastal-raw-bar',
      label_en: 'Coastal Raw Bar',
      label_es: 'Barra de Mariscos',
      blurb_en: 'Sand paper, navy display, deckle dividers. Oyster bar / fish house.',
      blurb_es: 'Papel arena, display marino, divisores irregulares. Barra de ostras / pescados.',
      paper:    '#F6F1E3',
      ink:      '#0F2238',
      accent:   '#1F4E5B',
      muted:    '#6E7B89',
      bodyFamily:    'Georgia, "Times New Roman", serif',
      displayFamily: 'Quattrocento, Georgia, serif',
      h1Pt:    30,
      h2Pt:    14,
      bodyPt:  11,
      pricePt: 11,
      descPt:  9.5,
      priceStyle:    'leader-dots',
      dividerStyle:  'hand-rule',
      columns:       1,
      logoSlot:      'header-left',
      letterSpacing: 'normal',
      sectionCase:   'capitalize',
      paperFloors:   ['letter', 'a4', 'half-page', 'trifold', 'table-tent'],
      cuisineHint: ['seafood', 'oyster', 'raw bar', 'fish house', 'mariscos', 'pescados']
    },

    // 8. Steakhouse — deep charcoal stock, cream ink, condensed
    //    display caps, leader-dot prices. The "1947-vintage
    //    chophouse" vibe.
    steakhouse: {
      id: 'steakhouse',
      label_en: 'Steakhouse',
      label_es: 'Parrilla',
      blurb_en: 'Charcoal stock, cream ink, condensed caps display. Vintage chophouse.',
      blurb_es: 'Papel carbón, tinta crema, display condensado. Parrilla clásica.',
      paper:    '#1A1814',
      ink:      '#F2EDE2',
      accent:   '#C29B5E',
      muted:    '#8C8470',
      bodyFamily:    'Georgia, "Times New Roman", serif',
      displayFamily: 'Alfa Slab One, Bebas Neue, Georgia, serif',
      h1Pt:    34,
      h2Pt:    14,
      bodyPt:  11,
      pricePt: 11,
      descPt:  9.5,
      priceStyle:    'leader-dots',
      dividerStyle:  'box',
      columns:       2,
      logoSlot:      'header-center',
      letterSpacing: 'wide',
      sectionCase:   'uppercase',
      paperFloors:   ['letter', 'a4', 'half-page'],
      cuisineHint: ['steakhouse', 'chophouse', 'parrilla', 'bbq', 'asador', 'churrasco']
    },

    // 9. Cafe Counter — soft white, warm grey ink, small caps
    //    section heads. The "third-wave coffee + sandwiches" vibe.
    'cafe-counter': {
      id: 'cafe-counter',
      label_en: 'Cafe Counter',
      label_es: 'Mostrador de Café',
      blurb_en: 'Soft white, warm grey ink, small-caps sections. Third-wave coffee + sandwiches.',
      blurb_es: 'Blanco suave, tinta gris cálida, secciones en versalita. Café + sándwiches.',
      paper:    '#FBFAF6',
      ink:      '#2A2622',
      accent:   '#7B5230',
      muted:    '#7C7167',
      bodyFamily:    'Inter, system-ui, sans-serif',
      displayFamily: 'Cormorant SC, Georgia, serif',
      h1Pt:    26,
      h2Pt:    12,
      bodyPt:  10.5,
      pricePt: 10.5,
      descPt:  9,
      priceStyle:    'tab-aligned',
      dividerStyle:  'whitespace',
      columns:       1,
      logoSlot:      'header-left',
      letterSpacing: 'normal',
      sectionCase:   'small-caps',
      paperFloors:   ['letter', 'a4', 'half-page', 'trifold', 'table-tent'],
      cuisineHint: ['cafe', 'café', 'coffee', 'bakery', 'panaderia', 'panadería', 'sandwich', 'breakfast']
    },

    // 10. Pizza Counter — bold white-on-red, condensed sans
    //     display, monospaced prices. The "neighborhood slice
    //     joint" vibe.
    'pizza-counter': {
      id: 'pizza-counter',
      label_en: 'Pizza Counter',
      label_es: 'Pizzería',
      blurb_en: 'White stock, red display ink, condensed caps. Slice-joint energy.',
      blurb_es: 'Papel blanco, display rojo, display condensado. Energía de pizzería.',
      paper:    '#FFFFFF',
      ink:      '#14161A',
      accent:   '#B42A23',
      muted:    '#5C6470',
      bodyFamily:    'Work Sans, Inter, system-ui, sans-serif',
      displayFamily: 'Bebas Neue, "Helvetica Neue Condensed", Arial, sans-serif',
      h1Pt:    34,
      h2Pt:    16,
      bodyPt:  11,
      pricePt: 11,
      descPt:  10,
      priceStyle:    'right-monospace',
      dividerStyle:  'box',
      columns:       2,
      logoSlot:      'header-center',
      letterSpacing: 'wide',
      sectionCase:   'uppercase',
      paperFloors:   ['letter', 'a4', 'half-page'],
      cuisineHint: ['pizza', 'pizzeria', 'pizzería', 'slice joint']
    }
  };

  // Cuisine→theme heuristic for the "We remember" pre-fill.
  // Used only as a default; the owner can flip themes at any point.
  // Reads per-theme cuisineHint[] arrays so adding a new theme
  // automatically extends the routing without touching this function.
  function suggestTheme(cuisine) {
    var c = String(cuisine || '').toLowerCase().trim();
    if (!c) return 'modern-minimal';
    // Pizza specifically wins over Italian-trattoria — operator
    // expectations differ and the slice-joint look is stronger.
    if (/pizza|pizzeria|pizzería|slice/.test(c))      return 'pizza-counter';
    if (/italian|italiana|trattoria|osteria/.test(c)) return 'trattoria';
    if (/diner|breakfast|burger|sandwich|deli/.test(c)) return 'diner-counter';
    // Generic match against per-theme cuisineHint arrays — picks
    // the first theme whose hints include the cuisine token.
    var keys = Object.keys(THEMES);
    for (var i = 0; i < keys.length; i++) {
      var t = THEMES[keys[i]];
      var hints = t.cuisineHint || [];
      for (var j = 0; j < hints.length; j++) {
        if (c.indexOf(hints[j].toLowerCase()) !== -1) return keys[i];
      }
    }
    return 'modern-minimal';
  }

  // Grouping helper for the W5-3 cuisine-accordion theme picker.
  // Returns themes grouped into 4 categories (the picker buckets),
  // with cuisineHint surfaced for the operator-facing chip strip.
  var GROUPS = [
    { id: 'casual',     label_en: 'Casual / quick',          label_es: 'Casual / rápido',
      themes: ['diner-counter', 'cafe-counter', 'pizza-counter', 'cantina'] },
    { id: 'classic',    label_en: 'Classic / traditional',   label_es: 'Clásico / tradicional',
      themes: ['trattoria', 'brasserie', 'steakhouse', 'coastal-raw-bar'] },
    { id: 'modern',     label_en: 'Modern / minimalist',     label_es: 'Moderno / minimalista',
      themes: ['modern-minimal', 'asian-table'] }
  ];
  function groups() { return GROUPS; }

  // Apply a palette[] (5 hex strings) to a theme by overriding
  // accent + muted. Paper + ink stay theme-fixed so contrast
  // never degrades — palettes from brand-suite aren't guaranteed
  // to clear WCAG body-text against the theme's chosen paper.
  function applyPalette(theme, palette) {
    if (!Array.isArray(palette) || palette.length === 0) return theme;
    var clean = palette
      .filter(function (h) { return /^#?[0-9a-fA-F]{6}$/.test(String(h || '')); })
      .map(function (h) { return (String(h)[0] === '#') ? h : ('#' + h); });
    if (!clean.length) return theme;
    return Object.assign({}, theme, {
      accent: clean[0],
      muted:  clean[1] || theme.muted
    });
  }

  var api = {
    THEMES:       THEMES,
    list:         function () { return Object.keys(THEMES); },
    get:          function (id) { return THEMES[id] || null; },
    suggestTheme: suggestTheme,
    applyPalette: applyPalette,
    groups:       groups
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_THEMES = api;
})(typeof window !== 'undefined' ? window : null);
