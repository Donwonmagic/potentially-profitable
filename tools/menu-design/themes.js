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
      paperFloors:   ['letter', 'a4', 'half-page', 'trifold', 'table-tent']
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
      paperFloors:   ['letter', 'a4', 'half-page']
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
      paperFloors:   ['letter', 'a4', 'half-page', 'trifold', 'table-tent']
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
      paperFloors:   ['letter', 'a4', 'half-page']
    }
  };

  // Cuisine→theme heuristic for the "We remember" pre-fill.
  // Used only as a default; the owner can flip themes at any point.
  function suggestTheme(cuisine) {
    var c = String(cuisine || '').toLowerCase();
    if (/italian|italiana|trattoria|pizza/.test(c)) return 'trattoria';
    if (/diner|breakfast|burger|sandwich|deli/.test(c)) return 'diner-counter';
    if (/french|francesa|brasserie|bistro/.test(c)) return 'brasserie';
    return 'modern-minimal';
  }

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
    applyPalette: applyPalette
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_THEMES = api;
})(typeof window !== 'undefined' ? window : null);
