/**
 * Menu Design Suite — Dish badge catalog (W18 extraction).
 *
 * owns:    DISH_BADGES list + lookup helpers
 * exports: MD_BADGES on window; module.exports for tests
 * deps:    none
 * why:     Distinct from allergens (which are dietary / safety):
 *          badges advertise menu-marketing signals like NEW / chef's
 *          pick / seasonal / popular. Used by the editor toggle pill
 *          and the preview + PDF renderers.
 */
(function (root) {
  'use strict';

  var DISH_BADGES = [
    { id: 'new',      label_en: 'New',           label_es: 'Nuevo',         glyph: 'NEW',      color: 'accent' },
    { id: 'chef',     label_en: "Chef's pick",   label_es: 'Recomendado',   glyph: '★',  color: 'gold' },
    { id: 'seasonal', label_en: 'Seasonal',      label_es: 'De temporada',  glyph: '◐',  color: 'sage' },
    { id: 'popular',  label_en: 'Popular',       label_es: 'Popular',       glyph: '♥',  color: 'red' }
  ];
  function byId(id) {
    for (var i = 0; i < DISH_BADGES.length; i++) if (DISH_BADGES[i].id === id) return DISH_BADGES[i];
    return null;
  }
  function label(id, locale) {
    var b = byId(id); if (!b) return id;
    return locale === 'es' ? b.label_es : b.label_en;
  }

  var api = {
    BADGES: DISH_BADGES,
    byId:   byId,
    label:  label
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_BADGES = api;
})(typeof window !== 'undefined' ? window : null);
