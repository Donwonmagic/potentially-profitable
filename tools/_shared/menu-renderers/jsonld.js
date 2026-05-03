/**
 * Schema.org `Menu` JSON-LD emitter — Wave B6 of the empowerment plan.
 *
 * Takes a canonical v3 menu (from tools/_shared/menu-schema.js) and
 * produces a JSON-LD object suitable for either:
 *   1. inline injection as `<script type="application/ld+json">`
 *      inside the QR-menu HTML output (Google rich-result on the
 *      operator's website when they paste it in)
 *   2. a standalone `menu.jsonld` download for operators who want
 *      to drop it into Squarespace / WordPress / Webflow head
 *
 * Sister tool `menu-converter` already emits Menu JSON-LD from
 * paste-text input; this module is the canonical-menu equivalent.
 * They share the same shape so a downstream consumer (Google,
 * an LLM citing the schema) sees a single grammar regardless of
 * which surface it came from.
 *
 * Schema.org spec references:
 *   https://schema.org/Menu
 *   https://schema.org/MenuSection
 *   https://schema.org/MenuItem
 *   https://schema.org/Offer
 *   https://schema.org/RestrictedDiet (for suitableForDiet enum)
 *   https://schema.org/NutritionInformation (for calories)
 *
 * Privacy: pure synchronous data transformation. Zero fetch, zero
 * localStorage. The emitter never sees the operator's logo bytes
 * (logos are visual-only and absent from JSON-LD entirely).
 *
 * Performance: ~3KB minified, no deps. Safe to lazy-load via the
 * existing tools/_shared/ load path; safe to bundle into the
 * boot path if the menu page wants inline JSON-LD on first paint.
 *
 * UMD-ish loader: attaches MD_JSONLD on window in browser; exports
 * via module.exports in Node tests.
 */
(function (root) {
  'use strict';

  // Map our 11+6 allergen / dietary codes → Schema.org RestrictedDiet
  // enum values. Codes without a schema.org equivalent (sourcing
  // claims like LO, regional allergens like LU/MO/SU) are dropped
  // from the suitableForDiet array — they belong in plain-text
  // descriptions, not the structured-data RestrictedDiet field.
  //
  // RestrictedDiet enum members (Schema.org as of 2025):
  //   DiabeticDiet, GlutenFreeDiet, HalalDiet, HinduDiet, KosherDiet,
  //   LowCalorieDiet, LowFatDiet, LowLactoseDiet, LowSaltDiet,
  //   VeganDiet, VegetarianDiet
  //
  // Mapping logic: only mark `suitableForDiet` for codes that
  // POSITIVELY assert the diet — V (vegan), VG (vegetarian),
  // GF (gluten-free), and the dietary axis (halal, kosher,
  // pescatarian, fodmap, lowsodium). DO NOT mark "suitable for"
  // an allergen-free version when the code is a CONTAINS marker
  // (e.g. 'DF' = dairy-free is positive; 'N' = contains tree nuts
  // is negative and must NOT produce a suitableForDiet entry).
  var DIET_MAP = {
    V:  'https://schema.org/VeganDiet',
    VG: 'https://schema.org/VegetarianDiet',
    GF: 'https://schema.org/GlutenFreeDiet',
    DF: 'https://schema.org/LowLactoseDiet'   // closest schema.org equivalent
  };
  var DIETARY_MAP = {
    halal:        'https://schema.org/HalalDiet',
    kosher:       'https://schema.org/KosherDiet',
    pescatarian:  null,                         // no schema.org enum
    fodmap:       null,                         // no schema.org enum
    lowsodium:    'https://schema.org/LowSaltDiet'
  };

  // Locale → BCP-47 inLanguage tag. v3 stores ISO 639-1 only;
  // expand to BCP-47 if/when sub-tags are added.
  function inLanguageFor(locale) {
    if (!locale) return 'en';
    return String(locale).toLowerCase();
  }

  // Parse a price string like "12", "12.50", "$12", "$12.50",
  // "€8,50", "8.5" into a numeric string Schema.org accepts.
  // Returns null on un-parseable input (which causes us to omit
  // the offers block — better than emitting bogus structured data).
  function parsePrice(s) {
    if (s == null) return null;
    if (typeof s === 'number' && isFinite(s)) return String(s);
    var str = String(s).trim();
    if (!str) return null;
    // Strip currency symbols and locale group separators.
    var cleaned = str.replace(/[^\d.,\-]/g, '');
    if (!cleaned) return null;
    // Distinguish European decimal "8,50" (= 8.5) from US thousands
    // "1,200" (= 1200). Heuristic: when there is no period and a
    // single comma, look at the digits after the comma.
    //   - exactly 3 digits and only one comma  → US thousands (1,200)
    //   - 1 or 2 digits                        → European decimal
    //   - more than 3 digits                   → European decimal
    //     (no European writes 1,2000)
    // When BOTH period and comma appear we trust the period as
    // decimal and treat commas as thousands separators (US convention,
    // which dominates the operator base).
    if (cleaned.indexOf('.') === -1 && cleaned.indexOf(',') !== -1) {
      var m1 = cleaned.match(/^(-?\d+),(\d+)$/);
      if (m1 && m1[2].length === 3) {
        cleaned = m1[1] + m1[2];                    // 1,200 → 1200
      } else {
        cleaned = cleaned.replace(',', '.');        // 8,50 → 8.50
      }
    } else {
      // Drop commas as thousands separators when a period is present.
      cleaned = cleaned.replace(/,/g, '');
    }
    var n = parseFloat(cleaned);
    if (!isFinite(n)) return null;
    // Normalize trailing zeros: "12.00" -> "12", "12.50" -> "12.5"
    return parseFloat(n.toFixed(2)).toString();
  }

  // Resolve suitableForDiet[] from a v3 dish. Returns array of
  // schema.org URL strings; empty array if no positive diet assertion.
  function dietsForDish(dish) {
    var diets = [];
    var allergens = Array.isArray(dish.allergens) ? dish.allergens : [];
    var dietary = Array.isArray(dish.dietary) ? dish.dietary : [];
    allergens.forEach(function (code) {
      if (DIET_MAP[code]) diets.push(DIET_MAP[code]);
    });
    dietary.forEach(function (code) {
      if (DIETARY_MAP[code]) diets.push(DIETARY_MAP[code]);
    });
    // De-dupe — a dish tagged both V and VG should emit only the
    // stricter VeganDiet (vegans are vegetarians; the union is
    // already implicit in schema.org's enum semantics).
    return Array.from(new Set(diets));
  }

  // Resolve nutrition from dish.calories. Schema expects a string
  // like "300 calories" (NutritionInformation.calories is text).
  function nutritionForDish(dish) {
    var cal = String(dish.calories || '').trim();
    if (!cal) return null;
    // Operator might have entered "300", "300 cal", or "300 kcal" —
    // normalize to "300 calories" since that's what schema.org wants.
    var n = parseFloat(cal);
    if (!isFinite(n)) return null;
    return {
      '@type': 'NutritionInformation',
      'calories': n + ' calories'
    };
  }

  // Build a single MenuItem from a v3 dish.
  function menuItemFor(dish, currency) {
    var item = { '@type': 'MenuItem' };
    if (dish.name) item.name = String(dish.name);
    if (dish.desc) item.description = String(dish.desc);
    var pricedAt = parsePrice(dish.price);
    if (pricedAt != null) {
      item.offers = {
        '@type': 'Offer',
        'price': pricedAt,
        'priceCurrency': String(currency || 'USD')
      };
    }
    var diets = dietsForDish(dish);
    if (diets.length === 1) item.suitableForDiet = diets[0];
    else if (diets.length > 1) item.suitableForDiet = diets;
    var nutrition = nutritionForDish(dish);
    if (nutrition) item.nutrition = nutrition;
    return item;
  }

  // Build all MenuSections from a v3 menu.
  function menuSectionsFor(menu) {
    var sortedSections = (menu.sections || []).slice()
      .sort(function (a, b) { return (a.position || 0) - (b.position || 0); });
    var dishesBySection = {};
    (menu.dishes || []).forEach(function (d) {
      var sid = d.sectionId;
      (dishesBySection[sid] = dishesBySection[sid] || []).push(d);
    });
    return sortedSections.map(function (s) {
      var sec = { '@type': 'MenuSection' };
      if (s.name) sec.name = String(s.name);
      if (s.blurb) sec.description = String(s.blurb);
      var items = (dishesBySection[s.id] || [])
        .slice()
        .sort(function (a, b) { return (a.position || 0) - (b.position || 0); })
        .map(function (d) { return menuItemFor(d, menu.meta && menu.meta.currency); });
      if (items.length) sec.hasMenuItem = items;
      return sec;
    });
  }

  /**
   * Build a complete schema.org Menu JSON-LD object from a canonical v3 menu.
   *
   * @param {object} menu  v3 menu (output of MD_SCHEMA.migrate)
   * @param {object} [opts]
   * @param {string} [opts.url]            canonical URL of the menu page
   *                                       (e.g. "https://example.com/menu/")
   * @param {boolean} [opts.includeContext=true]  emit @context: schema.org
   * @returns {object} JSON-LD object
   */
  function build(menu, opts) {
    opts = opts || {};
    if (!menu || typeof menu !== 'object') menu = { meta: {}, sections: [], dishes: [] };
    var meta = menu.meta || {};
    var jsonld = {};
    if (opts.includeContext !== false) jsonld['@context'] = 'https://schema.org';
    jsonld['@type'] = 'Menu';
    if (meta.businessName) jsonld.name = String(meta.businessName);
    if (meta.tagline)      jsonld.description = String(meta.tagline);
    if (opts.url)          jsonld.url = String(opts.url);
    if (meta.locale)       jsonld.inLanguage = inLanguageFor(meta.locale);
    var sections = menuSectionsFor(menu);
    if (sections.length) jsonld.hasMenuSection = sections;
    return jsonld;
  }

  /**
   * Serialize a v3 menu as a JSON-LD string suitable for embedding
   * inside <script type="application/ld+json">…</script>. The
   * caller is responsible for the wrapping <script> tag.
   *
   * @param {object} menu v3 menu
   * @param {object} [opts] passed through to build()
   * @param {number} [opts.indent=2] JSON.stringify indent
   * @returns {string}
   */
  function emitInline(menu, opts) {
    opts = opts || {};
    var indent = (typeof opts.indent === 'number') ? opts.indent : 2;
    return JSON.stringify(build(menu, opts), null, indent);
  }

  /**
   * Serialize a v3 menu as a complete <script>-wrapped block,
   * ready to drop into a host page's <head>.
   */
  function emitScriptTag(menu, opts) {
    return '<script type="application/ld+json">' + emitInline(menu, opts) + '</script>';
  }

  // -------- Validation (best-effort, no external deps) --------
  // Returns an array of validation warnings. Empty array = valid.
  // Mirrors the pattern of MD_SCHEMA.validate(): warnings, not throws.
  function validate(jsonld) {
    var w = [];
    if (!jsonld || typeof jsonld !== 'object') {
      w.push('jsonld must be an object');
      return w;
    }
    if (jsonld['@type'] !== 'Menu') w.push('@type must be "Menu"');
    if (jsonld.hasMenuSection && !Array.isArray(jsonld.hasMenuSection)) {
      w.push('hasMenuSection must be an array');
    }
    (jsonld.hasMenuSection || []).forEach(function (sec, i) {
      if (sec['@type'] !== 'MenuSection') w.push('hasMenuSection[' + i + '] @type must be "MenuSection"');
      (sec.hasMenuItem || []).forEach(function (item, j) {
        if (item['@type'] !== 'MenuItem') w.push('hasMenuSection[' + i + '].hasMenuItem[' + j + '] @type must be "MenuItem"');
        if (item.offers && item.offers['@type'] !== 'Offer') {
          w.push('hasMenuSection[' + i + '].hasMenuItem[' + j + '].offers @type must be "Offer"');
        }
        if (item.offers && (!item.offers.price || !item.offers.priceCurrency)) {
          w.push('hasMenuSection[' + i + '].hasMenuItem[' + j + '].offers requires price + priceCurrency');
        }
      });
    });
    return w;
  }

  var api = {
    build:        build,
    emitInline:   emitInline,
    emitScriptTag: emitScriptTag,
    validate:     validate,
    // exported for tests
    _parsePrice:    parsePrice,
    _dietsForDish:  dietsForDish,
    _DIET_MAP:      DIET_MAP,
    _DIETARY_MAP:   DIETARY_MAP
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_JSONLD = api;
})(typeof window !== 'undefined' ? window : null);
