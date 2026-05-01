/**
 * Menu Design Suite — first-run cuisine quiz tile catalog (W22 extraction).
 *
 * owns:    The 9-tile picker that operators see on a cold load
 * exports: MD_QUIZ on window; module.exports for tests
 * deps:    none
 * why:     Catalog data inlined in menu-design.js. Pulling it out
 *          decouples copy edits from orchestrator changes — voice
 *          tweaks ship without touching the orchestrator.
 */
(function (root) {
  'use strict';

  var TILES = [
    { id: 'italian',  glyph: '🍝', label_en: 'Italian / pasta',         label_es: 'Italiana / pasta',     hint_en: 'Trattoria, pizza, neighborhood',  hint_es: 'Trattoria, pizza, vecindario',     theme: 'trattoria',     template: null },
    { id: 'french',   glyph: '🥖', label_en: 'French / bistro',          label_es: 'Francesa / bistró',    hint_en: 'Brasserie, weeknight tablecloth',  hint_es: 'Brasserie, mantel entre semana',   theme: 'bistro-paris',  template: null },
    { id: 'mexican',  glyph: '🌮', label_en: 'Mexican / cantina',        label_es: 'Mexicana / cantina',   hint_en: 'Cantina, taquería, family-run',    hint_es: 'Cantina, taquería, familiar',      theme: 'cantina',       template: null },
    { id: 'cafe',     glyph: '☕', label_en: 'Café / brunch',            label_es: 'Café / brunch',        hint_en: 'Coffee, sandwiches, brunch',       hint_es: 'Café, sándwiches, brunch',          theme: 'cafe-counter',  template: 'brunch' },
    { id: 'asian',    glyph: '🍣', label_en: 'Asian fusion',             label_es: 'Asiática',             hint_en: 'Ramen, sushi, dim sum, Thai',      hint_es: 'Ramen, sushi, dim sum, tailandesa',theme: 'asian-table',   template: null },
    { id: 'pizza',    glyph: '🍕', label_en: 'Pizza counter',            label_es: 'Pizzería',             hint_en: 'Slice joint, takeaway',            hint_es: 'Pizzería, para llevar',            theme: 'pizza-counter', template: null },
    { id: 'bbq',      glyph: '🔥', label_en: 'BBQ / smokehouse',         label_es: 'BBQ / asador',         hint_en: 'Pit, ribs, brisket, sides',         hint_es: 'Pit, costillas, brisket, guarniciones', theme: 'bbq-smoke', template: null },
    { id: 'wine-bar', glyph: '🍷', label_en: 'Wine bar / cellar',        label_es: 'Bar de vinos',         hint_en: 'Wine list, small plates',          hint_es: 'Carta de vinos, raciones',          theme: 'wine-list-formal', template: 'wine-list' },
    { id: 'modern',   glyph: '◯', label_en: 'Modern / something else',   label_es: 'Moderno / otro',       hint_en: 'Minimalist, generous whitespace',  hint_es: 'Minimalista, mucho espacio',        theme: 'modern-minimal', template: null }
  ];

  function findById(id) {
    for (var i = 0; i < TILES.length; i++) if (TILES[i].id === id) return TILES[i];
    return null;
  }

  var api = { TILES: TILES, findById: findById };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_QUIZ = api;
})(typeof window !== 'undefined' ? window : null);
