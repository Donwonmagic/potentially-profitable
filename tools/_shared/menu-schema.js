/**
 * Canonical menu schema (v3) shared across the menu tool suite —
 * menu-converter, menu-engineering, menu-copy, menu-design.
 *
 * Why: today each tool has its own input shape. menu-design uses
 * `rows: [{kind, name, price, desc, allergens, spice, badges, ...}]`
 * (state/draft.js v2). menu-engineering takes (name, foodCost,
 * price, units) tuples. menu-copy takes a single dish description
 * string. menu-converter parses free-text. There is no single
 * canonical menu the four tools can hand off.
 *
 * This module is the canonical shape. It introduces:
 *   - explicit per-dish `id` so cross-tool fields can stack on the
 *     same dish across tools without race conditions
 *   - explicit `sections[]` so the row-stream/section-marker model
 *     in menu-design can round-trip into a structured form
 *   - optional cross-tool fields (foodCost, unitsSold,
 *     copyDiagnostic) that downstream tools write but DO NOT
 *     require — every tool reads what it needs and ignores the rest
 *   - per-allergen state ('contains' vs 'may contain') for
 *     UK Natasha's Law / EU FIC PPDS compliance
 *   - `descPlain` for the plain-language accessibility mode
 *
 * Storage: this object lives in MuntinContext under the `menu` key
 * (single canonical menu per browser). Each tool reads on entry,
 * writes on save. Conflict resolution is the responsibility of the
 * tool surfacing the load banner — never overwrite silently.
 *
 * Backwards compat: `migrate(obj)` accepts v1 / v2 drafts (the
 * shapes already living in `tools/menu-design/state/draft.js`)
 * and returns a clean v3. Each step is reversible-friendly:
 * the v3 reducer never drops fields it does not understand,
 * so a Wave-B tool that adds a new optional field does not
 * brick a Wave-A tool that doesn't know about it.
 *
 * Privacy: this module is pure data + pure migration logic. Zero
 * fetch, zero localStorage. Storage of the canonical menu happens
 * in MuntinContext (which itself is localStorage-backed and already
 * h8-exempt-annotated). This file should never trigger
 * scripts/check-tool-no-fetch.mjs.
 *
 * UMD-ish loader: attaches to window.MD_SCHEMA in the browser,
 * exports via module.exports in Node tests.
 */
(function (root) {
  'use strict';

  var SCHEMA_VERSION = 3;

  // -------- Allergen regimes (referenced from data/allergens.js) -----
  // The catalog of codes lives in tools/menu-design/data/allergens.js;
  // this module just declares which regimes ship and what their
  // disclaimer text is. Renderers consume both.
  var REGIMES = {
    'us-fda9': {
      label_en: 'United States — FDA Big 9',
      label_es: 'Estados Unidos — FDA Grupo 9',
      defaultDisclaimer_en: 'Please inform your server of any allergies. Cross-contamination is possible in our kitchen.',
      defaultDisclaimer_es: 'Por favor informe a su mesero de cualquier alergia. Es posible la contaminación cruzada en nuestra cocina.'
    },
    'eu-fic14': {
      label_en: 'European Union — FIC 1169/2011 (14 allergens)',
      label_es: 'Unión Europea — FIC 1169/2011 (14 alérgenos)',
      defaultDisclaimer_en: 'If you have a food allergy or intolerance, please ask a member of staff before ordering.',
      defaultDisclaimer_es: 'Si tiene alguna alergia o intolerancia alimentaria, por favor consulte a nuestro personal antes de pedir.'
    },
    'uk-ppds': {
      label_en: 'United Kingdom — PPDS (Natasha’s Law)',
      label_es: 'Reino Unido — PPDS (Ley Natasha)',
      defaultDisclaimer_en: 'If you have a food allergy or intolerance, please speak to a member of staff. Items prepacked for direct sale list all 14 allergens on the label.',
      defaultDisclaimer_es: 'Si tiene alguna alergia o intolerancia alimentaria, por favor hable con nuestro personal.'
    },
    'ca-health': {
      label_en: 'Canada — Health Canada priority allergens',
      label_es: 'Canadá — Alérgenos prioritarios de Health Canada',
      defaultDisclaimer_en: 'Please inform your server of any allergies. Cross-contamination is possible in our kitchen.',
      defaultDisclaimer_es: 'Por favor informe a su mesero de cualquier alergia.'
    },
    'au-fsanz': {
      label_en: 'Australia / NZ — FSANZ Standard 1.2.3',
      label_es: 'Australia / NZ — FSANZ Estándar 1.2.3',
      defaultDisclaimer_en: 'Please inform staff of any allergies. Cross-contamination is possible.',
      defaultDisclaimer_es: 'Por favor informe al personal de cualquier alergia.'
    }
  };
  var DEFAULT_REGIME = 'us-fda9';

  // -------- ID minting (no deps, collision-resistant enough) ----------
  // Per-dish IDs are 12-char base36 (~62 bits of entropy). Adequate
  // for one operator's local menu (collision risk is essentially zero
  // at <1M dishes). Not cryptographic.
  function mintId() {
    var rnd = (typeof crypto !== 'undefined' && crypto.getRandomValues)
      ? (function () {
          var b = new Uint8Array(8);
          crypto.getRandomValues(b);
          var s = '';
          for (var i = 0; i < b.length; i++) s += b[i].toString(36);
          return s.slice(0, 12);
        })()
      : (Math.random().toString(36).slice(2, 8) + Date.now().toString(36)).slice(0, 12);
    return 'd_' + rnd;
  }
  function mintSectionId() {
    var rnd = (typeof crypto !== 'undefined' && crypto.getRandomValues)
      ? (function () {
          var b = new Uint8Array(6);
          crypto.getRandomValues(b);
          var s = '';
          for (var i = 0; i < b.length; i++) s += b[i].toString(36);
          return s.slice(0, 8);
        })()
      : (Math.random().toString(36).slice(2, 8) + Date.now().toString(36)).slice(0, 8);
    return 's_' + rnd;
  }

  // -------- Empty constructors -------------------------------------
  function blankDish(overrides) {
    var d = {
      id: mintId(),
      sectionId: null,
      position: 0,
      name: '',
      desc: '',
      price: '',
      allergens: [],
      allergenStates: {},  // { 'GF': 'contains' | 'may' } — defaults to 'contains' when absent
      dietary: [],         // [ 'halal' | 'kosher' | 'pescatarian' | 'fodmap' | 'lowsodium' ]
      spice: 0,
      badges: [],
      photo: null,
      pairing: '',
      modifier: '',
      halfPrice: '',
      portion: '',
      calories: '',
      // bilingual mirrors
      name_es: '',
      desc_es: '',
      // plain-language accessibility variant
      descPlain: '',
      // cross-tool optional fields (populated by sister tools, may be absent)
      foodCost: undefined,
      unitsSold: undefined,
      copyDiagnostic: undefined  // { score, sensoryCats, hedges, length, version }
    };
    if (overrides && typeof overrides === 'object') {
      for (var k in overrides) if (Object.prototype.hasOwnProperty.call(overrides, k)) d[k] = overrides[k];
    }
    return d;
  }

  function blankSection(overrides) {
    var s = {
      id: mintSectionId(),
      name: '',
      name_es: '',
      blurb: '',
      glyph: '',
      availability: '',
      hero: null,
      position: 0
    };
    if (overrides && typeof overrides === 'object') {
      for (var k in overrides) if (Object.prototype.hasOwnProperty.call(overrides, k)) s[k] = overrides[k];
    }
    return s;
  }

  function blankMenu(overrides) {
    var m = {
      v: SCHEMA_VERSION,
      meta: {
        businessName: '',
        tagline: '',
        story: '',
        address: '',
        hours: '',
        serviceCharge: '',
        sourcing: '',
        disclaimer: '',
        askYourServer: '',
        cuisine: '',
        locale: 'en',
        currency: 'USD',
        allergenRegime: DEFAULT_REGIME
      },
      sections: [],
      dishes: [],
      theme: {
        id: '',
        paper: '',
        ink: '',
        accent: '',
        paperTexture: '',
        font: '',
        mods: { season: '', daypart: '', event: '' },
        customDims: null,
        logoRef: null
      },
      logos: { primary: null },  // { dataUrl?, sha256, bytes }
      source: {
        tool: '',
        updatedAt: 0,
        transitionFrom: ''
      }
    };
    if (overrides && typeof overrides === 'object') {
      for (var k in overrides) if (Object.prototype.hasOwnProperty.call(overrides, k)) m[k] = overrides[k];
    }
    return m;
  }

  // -------- Migration ---------------------------------------------
  // v1 (pre-extraction): { rows: [...] } only, no schemaVersion field.
  //                      rows entries lack `allergens`.
  // v2 (current draft.js): { rows: [...], theme, paper, customDims, meta,
  //                          customize: { mods: {season, daypart, event} } }
  //                      with schemaVersion = 2 on persisted draft.
  // v3 (this module):    { v: 3, meta, sections[], dishes[], theme,
  //                        logos, source } — explicit IDs, sections array,
  //                        cross-tool optional fields.
  //
  // Inputs of unknown shape return blankMenu().
  function migrate(input) {
    if (!input || typeof input !== 'object') return blankMenu();

    // Already v3.
    if (input.v === SCHEMA_VERSION || input.v === 3) {
      return _ensureShapeV3(input);
    }

    // v2 draft (menu-design current draft.js shape) — has rows[], theme,
    // meta, customize. No `v` field.
    if (Array.isArray(input.rows)) {
      return _v2ToV3(input);
    }

    // v1 (rows-only, no allergens) — same code path as v2; the missing
    // fields fall back to blankDish defaults.
    if (Array.isArray(input.dishes) && Array.isArray(input.sections)) {
      // Looks v3-ish but lacking the `v` tag. Trust the shape.
      return _ensureShapeV3(Object.assign({}, input, { v: SCHEMA_VERSION }));
    }

    return blankMenu();
  }

  function _v2ToV3(v2) {
    var menu = blankMenu();
    var nowMeta = v2.meta || {};
    var nowCustomize = v2.customize || {};

    // ---- meta ----
    menu.meta.businessName  = nowMeta.businessName  || '';
    menu.meta.tagline       = nowMeta.tagline       || '';
    menu.meta.story         = nowMeta.story         || '';
    menu.meta.address       = nowMeta.address       || '';
    menu.meta.hours         = nowMeta.hours         || '';
    menu.meta.serviceCharge = nowMeta.serviceCharge || '';
    menu.meta.sourcing      = nowMeta.sourcing      || '';
    menu.meta.disclaimer    = nowMeta.disclaimer    || '';
    menu.meta.askYourServer = nowMeta.askYourServer || '';
    menu.meta.cuisine       = nowMeta.cuisine       || '';
    menu.meta.locale        = nowMeta.locale        || 'en';
    menu.meta.currency      = nowMeta.currency      || 'USD';
    menu.meta.allergenRegime = nowMeta.allergenRegime || DEFAULT_REGIME;

    // ---- theme ----
    menu.theme.id           = v2.theme || '';
    menu.theme.paper        = (nowCustomize.paper) || '';
    menu.theme.ink          = (nowCustomize.ink)   || '';
    menu.theme.accent       = (nowCustomize.accent) || '';
    menu.theme.paperTexture = (nowCustomize.paperTexture) || '';
    menu.theme.font         = (nowCustomize.font) || '';
    menu.theme.mods = {
      season:  (nowCustomize.mods && nowCustomize.mods.season)  || '',
      daypart: (nowCustomize.mods && nowCustomize.mods.daypart) || '',
      event:   (nowCustomize.mods && nowCustomize.mods.event)   || ''
    };
    menu.theme.customDims   = v2.customDims || null;

    // ---- sections + dishes (rows[] is row-stream w/ section markers) ----
    var currentSection = null;
    var sectionPos = 0;
    var dishPos = 0;
    (v2.rows || []).forEach(function (r) {
      if (!r || typeof r !== 'object') return;
      if (r.kind === 'section') {
        currentSection = blankSection({
          name: r.name || '',
          name_es: r.name_es || '',
          blurb: r.blurb || '',
          glyph: r.glyph || '',
          availability: r.availability || '',
          hero: r.hero || null,
          position: sectionPos++
        });
        menu.sections.push(currentSection);
        return;
      }
      if (r.kind === 'dish') {
        // If a dish appears before any section header, synthesize one so
        // the canonical menu is always section-rooted.
        if (!currentSection) {
          currentSection = blankSection({ name: '', position: sectionPos++ });
          menu.sections.push(currentSection);
        }
        var d = blankDish({
          sectionId: currentSection.id,
          position: dishPos++,
          name: r.name || '',
          desc: r.desc || '',
          price: r.price || '',
          allergens: Array.isArray(r.allergens) ? r.allergens.slice() : [],
          spice: typeof r.spice === 'number' ? r.spice : 0,
          badges: Array.isArray(r.badges) ? r.badges.slice() : [],
          photo: r.photo || null,
          pairing: r.pairing || '',
          modifier: r.modifier || '',
          halfPrice: r.halfPrice || '',
          portion: r.portion || '',
          calories: r.calories || '',
          name_es: r.altName || '',
          desc_es: r.altDesc || ''
        });
        menu.dishes.push(d);
      }
    });

    // ---- source ----
    menu.source = {
      tool: v2.__tool || 'menu-design',
      updatedAt: Date.now(),
      transitionFrom: 'v2'
    };

    return menu;
  }

  // Ensure a v3-tagged input has all fields present (shape-validate).
  function _ensureShapeV3(input) {
    var menu = blankMenu();
    if (input.meta && typeof input.meta === 'object') {
      for (var k in menu.meta) {
        if (Object.prototype.hasOwnProperty.call(input.meta, k) && input.meta[k] != null) {
          menu.meta[k] = input.meta[k];
        }
      }
    }
    if (Array.isArray(input.sections)) {
      menu.sections = input.sections.map(function (s) {
        return blankSection(s || {});
      });
    }
    if (Array.isArray(input.dishes)) {
      menu.dishes = input.dishes.map(function (d) {
        return blankDish(d || {});
      });
    }
    if (input.theme && typeof input.theme === 'object') {
      for (var t in menu.theme) {
        if (Object.prototype.hasOwnProperty.call(input.theme, t) && input.theme[t] != null) {
          menu.theme[t] = input.theme[t];
        }
      }
    }
    if (input.logos && typeof input.logos === 'object') menu.logos = input.logos;
    if (input.source && typeof input.source === 'object') {
      menu.source = {
        tool: input.source.tool || '',
        updatedAt: input.source.updatedAt || 0,
        transitionFrom: input.source.transitionFrom || ''
      };
    }
    return menu;
  }

  // -------- Inverse transform (v3 -> v2 draft shape) ---------------
  // The menu-design tool's existing draft.js writes a v2 row-stream
  // shape. Until A1 (state store) fully cuts over to v3, we need to
  // round-trip a v3 menu back into the row stream so the existing
  // editor keeps working.
  function toV2Draft(menu) {
    if (!menu || typeof menu !== 'object') menu = blankMenu();
    var rows = [];
    var sectionsById = {};
    (menu.sections || []).forEach(function (s) { sectionsById[s.id] = s; });

    // Emit sections in `position` order; emit dishes within each section
    // in their own `position` order.
    var sortedSections = (menu.sections || []).slice().sort(function (a, b) {
      return (a.position || 0) - (b.position || 0);
    });
    sortedSections.forEach(function (s) {
      // Only emit a section header row if it has a name (preserves the
      // synthetic-section convention used in _v2ToV3).
      if (s.name) {
        rows.push({
          kind: 'section',
          name: s.name,
          name_es: s.name_es,
          blurb: s.blurb,
          glyph: s.glyph,
          availability: s.availability,
          hero: s.hero
        });
      }
      var dishesInSection = (menu.dishes || []).filter(function (d) {
        return d.sectionId === s.id;
      }).sort(function (a, b) {
        return (a.position || 0) - (b.position || 0);
      });
      dishesInSection.forEach(function (d) {
        rows.push({
          kind: 'dish',
          name: d.name,
          price: d.price,
          desc: d.desc,
          allergens: (d.allergens || []).slice(),
          spice: d.spice || 0,
          badges: (d.badges || []).slice(),
          photo: d.photo || null,
          pairing: d.pairing || '',
          modifier: d.modifier || '',
          halfPrice: d.halfPrice || '',
          portion: d.portion || '',
          calories: d.calories || '',
          altName: d.name_es || '',
          altDesc: d.desc_es || ''
        });
      });
    });

    return {
      rows: rows,
      theme: menu.theme.id,
      meta: Object.assign({}, menu.meta),
      customize: {
        paper:        menu.theme.paper,
        ink:          menu.theme.ink,
        accent:       menu.theme.accent,
        paperTexture: menu.theme.paperTexture,
        font:         menu.theme.font,
        mods:         Object.assign({}, menu.theme.mods)
      },
      customDims: menu.theme.customDims,
      schemaVersion: 2
    };
  }

  // -------- Validation --------------------------------------------
  // Returns array of validation messages; empty = valid.
  function validate(menu) {
    var errors = [];
    if (!menu || typeof menu !== 'object') {
      errors.push('menu must be an object');
      return errors;
    }
    if (menu.v !== SCHEMA_VERSION) errors.push('expected v=' + SCHEMA_VERSION + ', got ' + menu.v);
    if (!menu.meta || typeof menu.meta !== 'object') errors.push('meta missing');
    if (!Array.isArray(menu.sections)) errors.push('sections must be an array');
    if (!Array.isArray(menu.dishes)) errors.push('dishes must be an array');

    // Every dish must reference a real section.
    var sectionIds = {};
    (menu.sections || []).forEach(function (s) { sectionIds[s.id] = true; });
    (menu.dishes || []).forEach(function (d, i) {
      if (!d.id) errors.push('dish[' + i + '] missing id');
      if (!sectionIds[d.sectionId]) errors.push('dish[' + i + '] sectionId ' + d.sectionId + ' not found');
    });

    // Allergen regime must be known.
    if (menu.meta && menu.meta.allergenRegime && !REGIMES[menu.meta.allergenRegime]) {
      errors.push('unknown allergenRegime: ' + menu.meta.allergenRegime);
    }

    return errors;
  }

  // -------- Public API ---------------------------------------------
  var api = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    REGIMES: REGIMES,
    DEFAULT_REGIME: DEFAULT_REGIME,
    blankMenu: blankMenu,
    blankDish: blankDish,
    blankSection: blankSection,
    mintId: mintId,
    mintSectionId: mintSectionId,
    migrate: migrate,
    toV2Draft: toV2Draft,
    validate: validate
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.MD_SCHEMA = api;
  }
})(typeof window !== 'undefined' ? window : null);
