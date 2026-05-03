/**
 * Menu Design Suite — Allergen + dietary catalog.
 *
 * owns:    ALLERGEN_CODES list + lookup helpers + regime registry
 * exports: MD_ALLERGENS on window; module.exports for tests
 * deps:    none
 * why:     Used by the editor (chip selector + footer-key generator),
 *          the live preview, the PDF renderer, the QR-menu HTML
 *          emitter, the plain-text / Markdown / SSML / BRF emitters.
 *          Single source of truth.
 *
 * Wave B2 — regime extension (synthesized empowerment plan):
 *   - Each entry gets `kind: 'allergen' | 'dietary' | 'sourcing'`
 *     so the editor can group chips meaningfully (safety codes vs
 *     diner-preference codes vs operator-claim codes).
 *   - Each entry gets `regimes: [...]` listing which regulatory
 *     regimes require disclosure of this code. Empty regimes[]
 *     (V / VG / LO) means the code is always available but is not
 *     a legal allergen-disclosure obligation under any regime.
 *   - Five EU-regime codes appended (mustard, celery, lupin,
 *     molluscs, sulphites ≥10ppm) plus peanuts (split from N=
 *     tree nuts so US-FDA-9 and EU-FIC-14 each render the
 *     correct count).
 *   - byRegime(regimeId) returns codes mandatory under that regime
 *     plus all kind!=='allergen' codes (which are always available).
 *
 * Backwards compat: the existing 11-code list is preserved verbatim
 * in order at the head of ALLERGEN_CODES. Existing consumers that
 * iterate CODES + call byId() see no behavior change. Renderers
 * that lookup glyphs see nothing for new codes (MD_GLYPHS falls
 * back to letter monogram, which is fine until B-wave glyph art
 * lands).
 */
(function (root) {
  'use strict';

  // ----- Regime registry (mirrors tools/_shared/menu-schema.js) -----
  // Kept in sync by hand for now; if either drifts the schema is the
  // canonical source. Codes below tag themselves into one or more.
  var REGIMES = {
    'us-fda9':   { label_en: 'United States — FDA Big 9',
                   label_es: 'Estados Unidos — FDA Grupo 9' },
    'eu-fic14':  { label_en: 'European Union — FIC 1169/2011 (14 allergens)',
                   label_es: 'Unión Europea — FIC 1169/2011 (14 alérgenos)' },
    'uk-ppds':   { label_en: 'United Kingdom — PPDS (Natasha’s Law)',
                   label_es: 'Reino Unido — PPDS (Ley Natasha)' },
    'ca-health': { label_en: 'Canada — Health Canada priority allergens',
                   label_es: 'Canadá — Alérgenos prioritarios de Health Canada' },
    'au-fsanz':  { label_en: 'Australia / NZ — FSANZ Standard 1.2.3',
                   label_es: 'Australia / NZ — FSANZ Estándar 1.2.3' }
  };
  var DEFAULT_REGIME = 'us-fda9';

  // Helper to produce the long regime list once (avoid string repetition).
  var ALL_REGIMES = ['us-fda9', 'eu-fic14', 'uk-ppds', 'ca-health', 'au-fsanz'];

  // ----- Catalog ---------------------------------------------------
  // Order preserved for back-compat with renderers that iterate.
  var ALLERGEN_CODES = [
    // Dietary preferences (kind: dietary) — always available, no
    // regime obligation. Operators tag these voluntarily.
    { id: 'V',  kind: 'dietary',  regimes: [],
      label_en: 'Vegan',         label_es: 'Vegano',
      hint_en: 'No animal products', hint_es: 'Sin productos animales' },
    { id: 'VG', kind: 'dietary',  regimes: [],
      label_en: 'Vegetarian',    label_es: 'Vegetariano',
      hint_en: 'No meat',          hint_es: 'Sin carne' },

    // Mandatory under all 5 regimes — the safety baseline.
    { id: 'GF', kind: 'allergen', regimes: ALL_REGIMES,
      label_en: 'Gluten-free',   label_es: 'Sin gluten',
      hint_en: 'No wheat, barley, rye', hint_es: 'Sin trigo, cebada, centeno' },
    { id: 'DF', kind: 'allergen', regimes: ALL_REGIMES,
      label_en: 'Dairy-free',    label_es: 'Sin lácteos',
      hint_en: 'No milk products', hint_es: 'Sin lácteos' },
    { id: 'N',  kind: 'allergen', regimes: ALL_REGIMES,
      label_en: 'Tree nuts',     label_es: 'Frutos secos',
      hint_en: 'Almonds, cashews, walnuts (peanuts = PE)',
      hint_es: 'Almendras, anacardos, nueces (cacahuetes = PE)' },
    { id: 'E',  kind: 'allergen', regimes: ALL_REGIMES,
      label_en: 'Contains eggs', label_es: 'Huevos',
      hint_en: '', hint_es: '' },
    { id: 'SO', kind: 'allergen', regimes: ALL_REGIMES,
      label_en: 'Contains soy',  label_es: 'Soya',
      hint_en: '', hint_es: '' },
    { id: 'SF', kind: 'allergen', regimes: ALL_REGIMES,
      label_en: 'Shellfish (crustaceans)', label_es: 'Mariscos (crustáceos)',
      hint_en: 'Crab, lobster, shrimp', hint_es: 'Cangrejo, langosta, camarón' },
    { id: 'FI', kind: 'allergen', regimes: ALL_REGIMES,
      label_en: 'Contains fish', label_es: 'Pescado',
      hint_en: '', hint_es: '' },
    { id: 'SE', kind: 'allergen', regimes: ALL_REGIMES,
      label_en: 'Sesame',        label_es: 'Sésamo',
      hint_en: 'FDA FASTER Act 2023', hint_es: 'Ley FASTER FDA 2023' },

    // Operator claim — not a legal regime obligation.
    { id: 'LO', kind: 'sourcing', regimes: [],
      label_en: 'Locally sourced', label_es: 'Origen local',
      hint_en: '', hint_es: '' },

    // ----- Wave B2 additions -----
    // Peanuts split from tree nuts (FDA Big 9 + EU FIC 14 separate).
    { id: 'PE', kind: 'allergen', regimes: ALL_REGIMES,
      label_en: 'Peanuts',       label_es: 'Cacahuetes',
      hint_en: 'Distinct from tree nuts (N)', hint_es: 'Distintos a frutos secos (N)' },
    // EU FIC 14 + UK PPDS + (mustard) Canada
    { id: 'MU', kind: 'allergen', regimes: ['eu-fic14', 'uk-ppds', 'ca-health'],
      label_en: 'Mustard',       label_es: 'Mostaza',
      hint_en: '', hint_es: '' },
    // EU + UK only
    { id: 'CE', kind: 'allergen', regimes: ['eu-fic14', 'uk-ppds'],
      label_en: 'Celery',        label_es: 'Apio',
      hint_en: '', hint_es: '' },
    { id: 'LU', kind: 'allergen', regimes: ['eu-fic14', 'uk-ppds', 'au-fsanz'],
      label_en: 'Lupin',         label_es: 'Altramuz',
      hint_en: '', hint_es: '' },
    { id: 'MO', kind: 'allergen', regimes: ['eu-fic14', 'uk-ppds'],
      label_en: 'Molluscs',      label_es: 'Moluscos',
      hint_en: 'Mussels, oysters, squid', hint_es: 'Mejillones, ostras, calamar' },
    { id: 'SU', kind: 'allergen', regimes: ['eu-fic14', 'uk-ppds'],
      label_en: 'Sulphites ≥10ppm', label_es: 'Sulfitos ≥10ppm',
      hint_en: 'Wine, dried fruit, pickles', hint_es: 'Vino, frutos secos, encurtidos' }
  ];

  function byId(id) {
    for (var i = 0; i < ALLERGEN_CODES.length; i++) if (ALLERGEN_CODES[i].id === id) return ALLERGEN_CODES[i];
    return null;
  }
  function label(id, locale) {
    var a = byId(id); if (!a) return id;
    return locale === 'es' ? a.label_es : a.label_en;
  }
  function kindOf(id) {
    var a = byId(id); return a ? a.kind : null;
  }
  // Codes available to a given regime: all dietary + sourcing codes
  // (always available) plus the allergen codes whose regimes[] list
  // contains regimeId. Order preserved from ALLERGEN_CODES.
  function byRegime(regimeId) {
    if (!regimeId || !REGIMES[regimeId]) regimeId = DEFAULT_REGIME;
    return ALLERGEN_CODES.filter(function (a) {
      if (a.kind !== 'allergen') return true;
      return Array.isArray(a.regimes) && a.regimes.indexOf(regimeId) >= 0;
    });
  }
  // Convenience: just the legal allergen codes for a regime (no dietary,
  // no sourcing). Useful for compliance footers.
  function allergensInRegime(regimeId) {
    if (!regimeId || !REGIMES[regimeId]) regimeId = DEFAULT_REGIME;
    return ALLERGEN_CODES.filter(function (a) {
      return a.kind === 'allergen' && Array.isArray(a.regimes) && a.regimes.indexOf(regimeId) >= 0;
    });
  }
  function inRegime(id, regimeId) {
    var a = byId(id);
    if (!a) return false;
    if (a.kind !== 'allergen') return true; // dietary/sourcing always available
    return Array.isArray(a.regimes) && a.regimes.indexOf(regimeId) >= 0;
  }

  var api = {
    CODES: ALLERGEN_CODES,
    REGIMES: REGIMES,
    DEFAULT_REGIME: DEFAULT_REGIME,
    byId:               byId,
    label:              label,
    kindOf:             kindOf,
    byRegime:           byRegime,
    allergensInRegime:  allergensInRegime,
    inRegime:           inRegime
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_ALLERGENS = api;
})(typeof window !== 'undefined' ? window : null);
