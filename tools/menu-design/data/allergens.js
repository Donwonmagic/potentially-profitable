/**
 * Menu Design Suite — Allergen catalog (W18 extraction).
 *
 * owns:    ALLERGEN_CODES list + lookup helpers
 * exports: MD_ALLERGENS on window; module.exports for tests
 * deps:    none
 * why:     Used by the editor (chip selector + footer-key generator),
 *          the live preview, the PDF renderer, the QR-menu HTML
 *          emitter, the plain-text / Markdown / SSML / BRF emitters.
 *          Single source of truth for allergen labels avoids the
 *          drift that was about to happen as the catalog spread
 *          across 5 files.
 */
(function (root) {
  'use strict';

  var ALLERGEN_CODES = [
    { id: 'V',  label_en: 'Vegan',         label_es: 'Vegano',         hint_en: 'No animal products',     hint_es: 'Sin productos animales' },
    { id: 'VG', label_en: 'Vegetarian',    label_es: 'Vegetariano',    hint_en: 'No meat',                hint_es: 'Sin carne' },
    { id: 'GF', label_en: 'Gluten-free',   label_es: 'Sin gluten',     hint_en: 'No wheat, barley, rye',  hint_es: 'Sin trigo, cebada, centeno' },
    { id: 'DF', label_en: 'Dairy-free',    label_es: 'Sin lácteos',    hint_en: 'No milk products',       hint_es: 'Sin lácteos' },
    { id: 'N',  label_en: 'Contains nuts', label_es: 'Frutos secos',   hint_en: 'Tree nuts',              hint_es: 'Nueces de árbol' },
    { id: 'E',  label_en: 'Contains eggs', label_es: 'Huevos',         hint_en: '',                       hint_es: '' },
    { id: 'SO', label_en: 'Contains soy',  label_es: 'Soya',           hint_en: '',                       hint_es: '' },
    { id: 'SF', label_en: 'Shellfish',     label_es: 'Mariscos',       hint_en: 'Crab, lobster, shrimp',  hint_es: 'Cangrejo, langosta, camarón' },
    { id: 'FI', label_en: 'Contains fish', label_es: 'Pescado',        hint_en: '',                       hint_es: '' },
    { id: 'SE', label_en: 'Sesame',        label_es: 'Sésamo',         hint_en: '',                       hint_es: '' },
    { id: 'LO', label_en: 'Locally sourced', label_es: 'Origen local', hint_en: '',                       hint_es: '' }
  ];
  function byId(id) {
    for (var i = 0; i < ALLERGEN_CODES.length; i++) if (ALLERGEN_CODES[i].id === id) return ALLERGEN_CODES[i];
    return null;
  }
  function label(id, locale) {
    var a = byId(id); if (!a) return id;
    return locale === 'es' ? a.label_es : a.label_en;
  }

  var api = {
    CODES: ALLERGEN_CODES,
    byId:  byId,
    label: label
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_ALLERGENS = api;
})(typeof window !== 'undefined' ? window : null);
