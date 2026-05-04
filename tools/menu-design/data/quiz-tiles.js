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
    // Western / Mediterranean
    { id: 'italian',  glyph: '🍝', label_en: 'Italian / trattoria',     label_es: 'Italiana / trattoria', hint_en: 'Trattoria, pasta, neighborhood',   hint_es: 'Trattoria, pasta, vecindario',     theme: 'trattoria',     template: 'italian-trattoria' },
    { id: 'french',   glyph: '🥖', label_en: 'French / bistro',          label_es: 'Francesa / bistró',    hint_en: 'Brasserie, weeknight tablecloth',  hint_es: 'Brasserie, mantel entre semana',   theme: 'bistro-paris',  template: 'french-bistro' },
    { id: 'mexican',  glyph: '🌮', label_en: 'Mexican / cantina',        label_es: 'Mexicana / cantina',   hint_en: 'Cantina, taquería, family-run',    hint_es: 'Cantina, taquería, familiar',      theme: 'cantina',       template: 'mexican-cantina' },
    { id: 'cafe',     glyph: '☕', label_en: 'Café / brunch',            label_es: 'Café / brunch',        hint_en: 'Coffee, sandwiches, brunch',       hint_es: 'Café, sándwiches, brunch',          theme: 'cafe-counter',  template: 'brunch' },
    { id: 'pizza',    glyph: '🍕', label_en: 'Pizza counter',            label_es: 'Pizzería',             hint_en: 'Slice joint, wood-fired, takeaway',hint_es: 'Pizzería, horno de leña, para llevar',theme: 'pizza-counter', template: 'pizza-counter' },
    { id: 'bbq',      glyph: '🔥', label_en: 'BBQ / smokehouse',         label_es: 'BBQ / asador',         hint_en: 'Pit, ribs, brisket, sides',         hint_es: 'Pit, costillas, brisket, guarniciones', theme: 'bbq-smoke', template: 'bbq-smokehouse' },
    { id: 'wine-bar', glyph: '🍷', label_en: 'Wine bar / cellar',        label_es: 'Bar de vinos',         hint_en: 'Wine list, small plates',          hint_es: 'Carta de vinos, raciones',          theme: 'wine-list-formal', template: 'wine-list' },
    // East Asian (split — 🍣 single tile collapses 4 cuisines)
    { id: 'japanese', glyph: '🍣', label_en: 'Japanese / izakaya',       label_es: 'Japonesa / izakaya',   hint_en: 'Ramen, sushi, izakaya, omakase',   hint_es: 'Ramen, sushi, izakaya, omakase',   theme: 'izakaya-lantern', template: 'japanese-izakaya' },
    { id: 'korean',   glyph: '🥢', label_en: 'Korean / BBQ counter',     label_es: 'Coreana / BBQ',        hint_en: 'BBQ, banchan, bibimbap, soju',     hint_es: 'BBQ, banchan, bibimbap, soju',     theme: 'korean-bbq-counter', template: 'korean-bbq' },
    { id: 'chinese',  glyph: '🥟', label_en: 'Chinese / dim sum',        label_es: 'China / dim sum',      hint_en: 'Dim sum, regional, hand-pulled',   hint_es: 'Dim sum, regional, hechas a mano', theme: 'dim-sum-rose',  template: 'chinese-dimsum' },
    // Southeast Asian
    { id: 'sea',      glyph: '🍜', label_en: 'Vietnamese / Thai',        label_es: 'Vietnamita / tailandesa', hint_en: 'Pho, banh mi, pad thai, larb',  hint_es: 'Pho, banh mi, pad thai, larb',     theme: 'asian-table',   template: 'vietnamese-thai' },
    { id: 'filipino', glyph: '🥥', label_en: 'Filipino / kamayan',       label_es: 'Filipina / kamayan',   hint_en: 'Adobo, lechon, kamayan, halo-halo',hint_es: 'Adobo, lechon, kamayan, halo-halo',theme: 'filipino-feast', template: 'filipino-feast' },
    // South Asian
    { id: 'indian',   glyph: '🍛', label_en: 'Indian / regional',        label_es: 'India / regional',     hint_en: 'Thali, curry, dosa, chaat',        hint_es: 'Thali, curry, dosa, chaat',        theme: 'modern-indian', template: 'indian-regional' },
    // Middle Eastern + North African
    { id: 'levantine',glyph: '🫓', label_en: 'Middle Eastern / mezze',   label_es: 'Medio Oriente / mezze',hint_en: 'Mezze, kebab, hummus, shawarma',   hint_es: 'Mezze, kebab, hummus, shawarma',   theme: 'levantine-mezze', template: 'levantine-mezze' },
    // African
    { id: 'ethiopian',glyph: '🌶️', label_en: 'Ethiopian / Eritrean',    label_es: 'Etíope / eritrea',     hint_en: 'Injera, wat, kitfo, communal',     hint_es: 'Injera, wat, kitfo, comunal',      theme: 'asian-table',   template: 'ethiopian' },
    // Catch-all
    { id: 'modern',   glyph: '◯', label_en: 'Modern / something else',   label_es: 'Moderno / otro',       hint_en: 'Minimalist, generous whitespace',  hint_es: 'Minimalista, mucho espacio',        theme: 'modern-minimal', template: null }
  ];

  function findById(id) {
    for (var i = 0; i < TILES.length; i++) if (TILES[i].id === id) return TILES[i];
    return null;
  }

  // Locale → suggested-tile + currency map. Reads navigator.languages
  // on cold start so a Spanish operator in CDMX sees the Mexicana
  // tile pre-highlighted (visually pulsed) and the currency defaults
  // to MXN. Read-only — never overrides an operator who's already
  // typed dishes or saved a draft.
  //
  // The mapping is conservative: only locales where ONE tile is the
  // overwhelming default get suggested. en-US sees no suggestion (the
  // 16-tile picker is genuinely the right cold-start UX). Likewise
  // for English-speaking countries where cuisine isn't predictable.
  var LOCALE_HINTS = {
    'es-MX':    { tile: 'mexican',   currency: 'MXN' },
    'es-AR':    { tile: 'modern',    currency: 'ARS' },
    'es-CL':    { tile: 'modern',    currency: 'CLP' },
    'es-CO':    { tile: 'modern',    currency: 'COP' },
    'es-PE':    { tile: 'modern',    currency: 'PEN' },
    'es-ES':    { tile: 'wine-bar',  currency: 'EUR' },  // tapas-friendly
    'es':       { tile: 'mexican',   currency: 'USD' },  // generic-ES default for US Latino market
    'fr-FR':    { tile: 'french',    currency: 'EUR' },
    'fr-CA':    { tile: 'french',    currency: 'CAD' },
    'fr':       { tile: 'french',    currency: 'EUR' },
    'it-IT':    { tile: 'italian',   currency: 'EUR' },
    'it':       { tile: 'italian',   currency: 'EUR' },
    'pt-BR':    { tile: 'modern',    currency: 'BRL' },
    'pt-PT':    { tile: 'wine-bar',  currency: 'EUR' },
    'ja-JP':    { tile: 'japanese',  currency: 'JPY' },
    'ja':       { tile: 'japanese',  currency: 'JPY' },
    'ko-KR':    { tile: 'korean',    currency: 'KRW' },
    'ko':       { tile: 'korean',    currency: 'KRW' },
    'zh-CN':    { tile: 'chinese',   currency: 'CNY' },
    'zh-HK':    { tile: 'chinese',   currency: 'HKD' },
    'zh-TW':    { tile: 'chinese',   currency: 'TWD' },
    'zh':       { tile: 'chinese',   currency: 'CNY' },
    'vi':       { tile: 'sea',       currency: 'VND' },
    'vi-VN':    { tile: 'sea',       currency: 'VND' },
    'th':       { tile: 'sea',       currency: 'THB' },
    'th-TH':    { tile: 'sea',       currency: 'THB' },
    'tl':       { tile: 'filipino',  currency: 'PHP' },
    'fil':      { tile: 'filipino',  currency: 'PHP' },
    'hi':       { tile: 'indian',    currency: 'INR' },
    'hi-IN':    { tile: 'indian',    currency: 'INR' },
    'ar':       { tile: 'levantine', currency: 'USD' },  // varies; safe default
    'am':       { tile: 'ethiopian', currency: 'ETB' },
    'am-ET':    { tile: 'ethiopian', currency: 'ETB' },
    'en-GB':    { tile: null,        currency: 'GBP' },
    'en-AU':    { tile: null,        currency: 'AUD' },
    'en-CA':    { tile: null,        currency: 'CAD' },
    'en-NZ':    { tile: null,        currency: 'NZD' }
  };

  function suggestForBrowser() {
    if (typeof navigator === 'undefined') return null;
    var langs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : (navigator.language ? [navigator.language] : []);
    for (var i = 0; i < langs.length; i++) {
      var raw = String(langs[i] || '').trim();
      if (!raw) continue;
      // Try exact match (e.g. 'es-MX'), then language part (e.g. 'es').
      var hit = LOCALE_HINTS[raw] || LOCALE_HINTS[raw.split('-')[0]];
      if (hit) return { locale: raw, tile: hit.tile, currency: hit.currency };
    }
    return null;
  }

  var api = { TILES: TILES, findById: findById, suggestForBrowser: suggestForBrowser, LOCALE_HINTS: LOCALE_HINTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_QUIZ = api;
})(typeof window !== 'undefined' ? window : null);
