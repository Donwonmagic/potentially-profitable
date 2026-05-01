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
      paperFloors:   ['letter', 'a4', 'half-page', 'trifold-letter-z', 'table-tent', 'placemat'],
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
      paperFloors:   ['letter', 'a4', 'half-page', 'trifold-letter-z', 'table-tent', 'placemat'],
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
      paperFloors:   ['letter', 'a4', 'half-page', 'trifold-letter-z', 'table-tent', 'placemat'],
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
      paperFloors:   ['letter', 'a4', 'half-page', 'trifold-letter-z', 'table-tent', 'placemat'],
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
      paperFloors:   ['letter', 'a4', 'half-page', 'trifold-letter-z', 'table-tent', 'placemat'],
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
    },

    // ================ W8-2 expansion (15 new compositions) ================
    // Each follows the same flat token shape as the originals.
    // cuisineHint drives the auto-suggest heuristic; contentType
    // ('standard' | 'wine' | 'dessert' | 'kids' | 'tasting' | 'cocktail')
    // tells the renderer when to swap layout defaults (wine list
    // wants no description column, dessert-only is single-section).

    'brewpub-slate': {
      id: 'brewpub-slate', label_en: 'Brewpub', label_es: 'Cervecería',
      blurb_en: 'Slate stock, work-sans body, amber accent. Beer-hall energy.',
      blurb_es: 'Papel pizarra, sans cálido, acento ámbar. Energía de cervecería.',
      paper: '#F0E7D0', ink: '#1F2630', accent: '#C68A2E', muted: '#5C6470',
      bodyFamily: 'Work Sans, Inter, sans-serif', displayFamily: 'Work Sans, Inter, sans-serif',
      h1Pt: 30, h2Pt: 14, bodyPt: 11, pricePt: 11, descPt: 10,
      priceStyle: 'tab-aligned', dividerStyle: 'box', columns: 2, logoSlot: 'header-left',
      letterSpacing: 'wide', sectionCase: 'uppercase', contentType: 'standard',
      paperFloors: ['letter', 'a4', 'tabloid', 'half-page'],
      cuisineHint: ['brewpub', 'beer hall', 'gastropub', 'taproom', 'brewery']
    },

    'bistro-paris': {
      id: 'bistro-paris', label_en: 'Bistro Paris', label_es: 'Bistró parisino',
      blurb_en: 'Bone stock, burgundy accent, Playfair display. Quiet bistro confidence.',
      blurb_es: 'Papel hueso, acento borgoña, display Playfair. Confianza de bistró.',
      paper: '#F4EFE2', ink: '#1B1410', accent: '#7A1C28', muted: '#7C6F60',
      bodyFamily: 'Georgia, "Times New Roman", serif', displayFamily: 'Playfair Display, Georgia, serif',
      h1Pt: 32, h2Pt: 13, bodyPt: 11, pricePt: 11, descPt: 9.5,
      priceStyle: 'leader-dots', dividerStyle: 'ornament', columns: 1, logoSlot: 'header-center',
      letterSpacing: 'normal', sectionCase: 'small-caps', contentType: 'standard',
      paperFloors: ['letter', 'a4', 'half-page', 'trifold-letter-z'],
      cuisineHint: ['bistro', 'french casual', 'french bistro', 'parisien']
    },

    'gastropub-oak': {
      id: 'gastropub-oak', label_en: 'Gastropub', label_es: 'Gastropub',
      blurb_en: 'Oak-cream stock, classical serif, hand-rule dividers.',
      blurb_es: 'Papel roble, serif clásico, divisores a mano.',
      paper: '#EFE8DA', ink: '#241B11', accent: '#5A3A1A', muted: '#7C6F60',
      bodyFamily: 'Georgia, "Times New Roman", serif', displayFamily: 'Fraunces, Georgia, serif',
      h1Pt: 30, h2Pt: 14, bodyPt: 11, pricePt: 11, descPt: 9.5,
      priceStyle: 'leader-dots', dividerStyle: 'hand-rule', columns: 2, logoSlot: 'header-left',
      letterSpacing: 'normal', sectionCase: 'capitalize', contentType: 'standard',
      paperFloors: ['letter', 'a4', 'tabloid', 'half-page'],
      cuisineHint: ['gastropub', 'pub fare', 'public house', 'pub']
    },

    'ramen-counter': {
      id: 'ramen-counter', label_en: 'Ramen Counter', label_es: 'Mostrador de Ramen',
      blurb_en: 'Ink-bone stock, Inter tight, generous whitespace. Counter clarity.',
      blurb_es: 'Papel hueso, Inter compacto, mucho espacio. Claridad de mostrador.',
      paper: '#F2EEE5', ink: '#0D0D0D', accent: '#A53321', muted: '#5C5A52',
      bodyFamily: 'Inter, system-ui, sans-serif', displayFamily: 'Inter, system-ui, sans-serif',
      h1Pt: 28, h2Pt: 12, bodyPt: 11, pricePt: 11, descPt: 9.5,
      priceStyle: 'tab-aligned', dividerStyle: 'whitespace', columns: 1, logoSlot: 'header-right',
      letterSpacing: 'wide', sectionCase: 'uppercase', contentType: 'standard',
      paperFloors: ['letter', 'a4', 'half-page', 'wine-narrow'],
      cuisineHint: ['ramen', 'izakaya', 'noodle bar', 'noodle', 'soba', 'udon']
    },

    'tapas-rustic': {
      id: 'tapas-rustic', label_en: 'Tapas', label_es: 'Tapas',
      blurb_en: 'Terracotta on bone, hand-set serif, ornament rules. Andalusian energy.',
      blurb_es: 'Terracota sobre hueso, serif a mano, divisores ornamentales.',
      paper: '#F4ECDC', ink: '#2A1810', accent: '#8E3A1B', muted: '#8A6F50',
      bodyFamily: 'Georgia, "Times New Roman", serif', displayFamily: 'Cormorant Garamond, Georgia, serif',
      h1Pt: 30, h2Pt: 13, bodyPt: 11, pricePt: 11, descPt: 9.5,
      priceStyle: 'tab-aligned', dividerStyle: 'ornament', columns: 2, logoSlot: 'header-center',
      letterSpacing: 'normal', sectionCase: 'small-caps', contentType: 'standard',
      paperFloors: ['letter', 'a4', 'half-page'],
      cuisineHint: ['tapas', 'spanish', 'andaluz', 'sevillana', 'pinchos']
    },

    'dim-sum-rose': {
      id: 'dim-sum-rose', label_en: 'Dim Sum', label_es: 'Dim Sum',
      blurb_en: 'Rose-jade palette, Inter, blossom dividers. Cantonese tea-room calm.',
      blurb_es: 'Paleta rosa-jade, Inter, divisores florales. Calma de salón cantonés.',
      paper: '#FBF4ED', ink: '#1A0E0A', accent: '#8B1A1A', muted: '#8A6F50',
      bodyFamily: 'Inter, system-ui, sans-serif', displayFamily: 'Noto Serif, Georgia, serif',
      h1Pt: 28, h2Pt: 12, bodyPt: 11, pricePt: 11, descPt: 9.5,
      priceStyle: 'tab-aligned', dividerStyle: 'ornament', columns: 2, logoSlot: 'header-center',
      letterSpacing: 'wide', sectionCase: 'uppercase', contentType: 'standard',
      paperFloors: ['letter', 'a4', 'half-page'],
      cuisineHint: ['dim sum', 'cantonese', 'yum cha', 'chinese tea']
    },

    'plant-forward': {
      id: 'plant-forward', label_en: 'Plant-Forward', label_es: 'Cocina Vegetal',
      blurb_en: 'Sage on cream, Playfair, generous whitespace. Plant-forward calm.',
      blurb_es: 'Salvia sobre crema, Playfair, mucho espacio. Calma vegetal.',
      paper: '#F1EEDF', ink: '#1F2418', accent: '#4F6B36', muted: '#7C8088',
      bodyFamily: 'Inter, system-ui, sans-serif', displayFamily: 'Playfair Display, Georgia, serif',
      h1Pt: 28, h2Pt: 12, bodyPt: 11, pricePt: 11, descPt: 9.5,
      priceStyle: 'tab-aligned', dividerStyle: 'whitespace', columns: 1, logoSlot: 'header-center',
      letterSpacing: 'normal', sectionCase: 'capitalize', contentType: 'standard',
      paperFloors: ['letter', 'a4', 'half-page', 'trifold-letter-z'],
      cuisineHint: ['vegan', 'vegetarian', 'plant-based', 'plant-forward', 'vegetal']
    },

    'bbq-smoke': {
      id: 'bbq-smoke', label_en: 'BBQ Smokehouse', label_es: 'Asador',
      blurb_en: 'Charcoal stock, condensed display caps, monospaced prices. Pit energy.',
      blurb_es: 'Papel carbón, display condensado, precios monoespaciados. Energía de parrilla.',
      paper: '#1B1815', ink: '#F0E2C2', accent: '#B85A1F', muted: '#A09080',
      bodyFamily: 'Work Sans, Inter, sans-serif', displayFamily: 'Bebas Neue, "Helvetica Neue Condensed", Arial, sans-serif',
      h1Pt: 36, h2Pt: 16, bodyPt: 11, pricePt: 11, descPt: 10,
      priceStyle: 'right-monospace', dividerStyle: 'box', columns: 2, logoSlot: 'header-center',
      letterSpacing: 'wide', sectionCase: 'uppercase', contentType: 'standard',
      paperFloors: ['letter', 'a4', 'tabloid', 'half-page', 'placemat'],
      cuisineHint: ['bbq', 'smokehouse', 'pit', 'brisket', 'ribs', 'asador-tx']
    },

    'tasting-omakase': {
      id: 'tasting-omakase', label_en: 'Tasting / Omakase', label_es: 'Degustación',
      blurb_en: 'Bone stock, Cormorant elegance, generous whitespace. Tasting-room hush.',
      blurb_es: 'Papel hueso, Cormorant elegante, mucho espacio. Calma de degustación.',
      paper: '#F8F5EC', ink: '#0E0E0E', accent: '#7A6240', muted: '#7C6F60',
      bodyFamily: 'Cormorant Garamond, Georgia, serif', displayFamily: 'Cormorant Garamond, Georgia, serif',
      h1Pt: 24, h2Pt: 11, bodyPt: 10.5, pricePt: 10.5, descPt: 9.5,
      priceStyle: 'whitespace', dividerStyle: 'whitespace', columns: 1, logoSlot: 'header-center',
      letterSpacing: 'wide', sectionCase: 'small-caps', contentType: 'tasting',
      paperFloors: ['letter', 'a4', 'half-page'],
      cuisineHint: ['omakase', 'tasting', 'kaiseki', 'prix-fixe', 'chef tasting', 'fine dining']
    },

    'kids-bright': {
      id: 'kids-bright', label_en: 'Kids Menu', label_es: 'Menú Infantil',
      blurb_en: 'Sky stock, sunshine accent, friendly sans. Family-fun.',
      blurb_es: 'Papel cielo, acento sol, sans amigable. Diversión familiar.',
      paper: '#FEFBF1', ink: '#1A2740', accent: '#E8AB1F', muted: '#5C6470',
      bodyFamily: 'Work Sans, Inter, sans-serif', displayFamily: 'Work Sans, Inter, sans-serif',
      h1Pt: 30, h2Pt: 14, bodyPt: 12, pricePt: 12, descPt: 11,
      priceStyle: 'tab-aligned', dividerStyle: 'box', columns: 1, logoSlot: 'header-center',
      letterSpacing: 'normal', sectionCase: 'capitalize', contentType: 'kids',
      paperFloors: ['letter', 'a4', 'half-page', 'placemat'],
      cuisineHint: ['kids', 'children', 'family', 'kids menu']
    },

    'wine-list-formal': {
      id: 'wine-list-formal', label_en: 'Wine List', label_es: 'Carta de Vinos',
      blurb_en: 'Parchment stock, classical serif, restrained ornament. Cellar formality.',
      blurb_es: 'Papel pergamino, serif clásico, ornamento sobrio. Formalidad de cava.',
      paper: '#F4EFE0', ink: '#1A1410', accent: '#5A1F2E', muted: '#7C6F60',
      bodyFamily: 'Georgia, "Times New Roman", serif', displayFamily: 'Fraunces, Georgia, serif',
      h1Pt: 24, h2Pt: 11, bodyPt: 10, pricePt: 10, descPt: 9.5,
      priceStyle: 'tab-aligned', dividerStyle: 'hand-rule', columns: 1, logoSlot: 'header-center',
      letterSpacing: 'normal', sectionCase: 'small-caps', contentType: 'wine',
      paperFloors: ['letter', 'a4', 'wine-narrow', 'legal'],
      cuisineHint: ['wine', 'vinos', 'cellar', 'cellars', 'sommelier', 'wine bar']
    },

    'cocktail-deco': {
      id: 'cocktail-deco', label_en: 'Cocktail Bar', label_es: 'Coctelería',
      blurb_en: 'Onyx stock, brass accent, Playfair deco. Speakeasy.',
      blurb_es: 'Papel ónice, acento bronce, Playfair deco. Speakeasy.',
      paper: '#16110D', ink: '#EFE3C2', accent: '#C5984A', muted: '#A09080',
      bodyFamily: 'Georgia, "Times New Roman", serif', displayFamily: 'Playfair Display, Georgia, serif',
      h1Pt: 30, h2Pt: 12, bodyPt: 10.5, pricePt: 10.5, descPt: 9.5,
      priceStyle: 'tab-aligned', dividerStyle: 'ornament', columns: 2, logoSlot: 'header-center',
      letterSpacing: 'wide', sectionCase: 'uppercase', contentType: 'cocktail',
      paperFloors: ['letter', 'a4', 'half-page', 'wine-narrow'],
      cuisineHint: ['cocktail', 'speakeasy', 'bar', 'craft cocktail', 'mixology']
    },

    'dessert-only': {
      id: 'dessert-only', label_en: 'Dessert', label_es: 'Postres',
      blurb_en: 'Ivory stock, rose accent, Cormorant elegance. Sweet finale.',
      blurb_es: 'Papel marfil, acento rosa, Cormorant elegante. Final dulce.',
      paper: '#FBF6EC', ink: '#3A1F1A', accent: '#B86A6A', muted: '#8A6F60',
      bodyFamily: 'Cormorant Garamond, Georgia, serif', displayFamily: 'Cormorant Garamond, Georgia, serif',
      h1Pt: 30, h2Pt: 13, bodyPt: 11, pricePt: 11, descPt: 9.5,
      priceStyle: 'leader-dots', dividerStyle: 'ornament', columns: 1, logoSlot: 'header-center',
      letterSpacing: 'normal', sectionCase: 'small-caps', contentType: 'dessert',
      paperFloors: ['letter', 'a4', 'half-page', 'specials'],
      cuisineHint: ['dessert', 'patisserie', 'pastry', 'sweets', 'postres', 'gelato', 'ice cream']
    },

    'bakery-coffee': {
      id: 'bakery-coffee', label_en: 'Bakery + Coffee', label_es: 'Panadería + Café',
      blurb_en: 'Flour stock, cocoa accent, hand-rule dividers. Morning energy.',
      blurb_es: 'Papel harina, acento cacao, divisores a mano. Energía matinal.',
      paper: '#FAF4E4', ink: '#33231A', accent: '#8C5A2A', muted: '#7C7167',
      bodyFamily: 'Georgia, "Times New Roman", serif', displayFamily: 'Fraunces, Georgia, serif',
      h1Pt: 28, h2Pt: 12, bodyPt: 10.5, pricePt: 10.5, descPt: 9,
      priceStyle: 'tab-aligned', dividerStyle: 'hand-rule', columns: 2, logoSlot: 'header-left',
      letterSpacing: 'normal', sectionCase: 'small-caps', contentType: 'standard',
      paperFloors: ['letter', 'a4', 'half-page', 'specials', 'placemat'],
      cuisineHint: ['bakery', 'panaderia', 'panadería', 'viennoiserie', 'patisserie-bakery', 'morning bakery']
    },

    'food-truck': {
      id: 'food-truck', label_en: 'Food Truck', label_es: 'Food Truck',
      blurb_en: 'Hot yellow display, condensed caps. Counter and curb energy.',
      blurb_es: 'Display amarillo intenso, mayúsculas condensadas. Energía de mostrador.',
      paper: '#FFFFFF', ink: '#0F0F0F', accent: '#FFC83D', muted: '#5C6470',
      bodyFamily: 'Work Sans, Inter, sans-serif', displayFamily: 'Bebas Neue, "Helvetica Neue Condensed", Arial, sans-serif',
      h1Pt: 36, h2Pt: 18, bodyPt: 12, pricePt: 12, descPt: 10,
      priceStyle: 'right-monospace', dividerStyle: 'box', columns: 2, logoSlot: 'header-center',
      letterSpacing: 'wide', sectionCase: 'uppercase', contentType: 'standard',
      paperFloors: ['letter', 'a4', 'half-page', 'a2-board'],
      cuisineHint: ['food truck', 'ghost kitchen', 'pop-up', 'street food', 'truck']
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
      themes: ['diner-counter', 'cafe-counter', 'pizza-counter', 'cantina', 'food-truck', 'bakery-coffee', 'kids-bright'] },
    { id: 'classic',    label_en: 'Classic / traditional',   label_es: 'Clásico / tradicional',
      themes: ['trattoria', 'brasserie', 'steakhouse', 'coastal-raw-bar', 'bistro-paris', 'gastropub-oak', 'tapas-rustic'] },
    { id: 'modern',     label_en: 'Modern / minimalist',     label_es: 'Moderno / minimalista',
      themes: ['modern-minimal', 'asian-table', 'ramen-counter', 'plant-forward', 'dim-sum-rose'] },
    { id: 'specialty',  label_en: 'Specialty',                label_es: 'Especialidad',
      themes: ['wine-list-formal', 'cocktail-deco', 'dessert-only', 'tasting-omakase', 'bbq-smoke', 'brewpub-slate'] }
  ];
  function groups() { return GROUPS; }

  // W15 — Seasonal / daypart / event modifiers. Sparse overrides
  // applied on top of the active theme via applyModifier(). Each
  // modifier names a few token tweaks; nothing is required (an
  // empty modifier is a no-op).
  var SEASONAL_MODS = {
    none:    {},
    summer:  { accent: '#3E7B5C', muted: '#7C8F7C' },                       // sun-faded green
    autumn:  { accent: '#A0411D', muted: '#8E5A3C' },                        // burnt orange
    winter:  { accent: '#2A4060', muted: '#6E7B89' },                        // deep cool blue
    holiday: { accent: '#8B1A1A', muted: '#5A3A1A' },                        // red + bronze
    spring:  { accent: '#D6748D', muted: '#9A958B' }                         // soft rose
  };
  var DAYPART_MODS = {
    none:        {},
    lunch:       { paper: '#FBFAF6', muted: '#7C7167' },                    // brighter
    dinner:      {},                                                          // theme default
    'late-night':{ paper: '#0E0E0E', ink: '#F2EDE2', accent: '#C29B5E' }    // high-contrast invert
  };
  var EVENT_MODS = {
    none:         {},
    valentines:   { accent: '#B42A23', muted: '#7A1C28' },
    'mothers-day':{ accent: '#D6748D', muted: '#A0411D' },
    pride:        { accent: '#9F2D9D', muted: '#3E7B5C' },
    nye:          { accent: '#C29B5E', paper: '#1A1814', ink: '#F2EDE2' },
    halloween:    { accent: '#E8AB1F', paper: '#1A1815', ink: '#F2EDE2' }
  };
  function applyModifier(theme, mods) {
    if (!mods) return theme;
    var out = Object.assign({}, theme);
    var pools = [SEASONAL_MODS[mods.season], DAYPART_MODS[mods.daypart], EVENT_MODS[mods.event]];
    pools.forEach(function (pool) {
      if (!pool) return;
      Object.keys(pool).forEach(function (k) { out[k] = pool[k]; });
    });
    return out;
  }
  function modifierGroups() {
    return {
      season:  Object.keys(SEASONAL_MODS),
      daypart: Object.keys(DAYPART_MODS),
      event:   Object.keys(EVENT_MODS)
    };
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
    THEMES:         THEMES,
    list:           function () { return Object.keys(THEMES); },
    get:            function (id) { return THEMES[id] || null; },
    suggestTheme:   suggestTheme,
    applyPalette:   applyPalette,
    applyModifier:  applyModifier,
    modifierGroups: modifierGroups,
    groups:         groups
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_THEMES = api;
})(typeof window !== 'undefined' ? window : null);
