/**
 * Plate Cost Calculator — pure math, dual-exported (browser + Node).
 *
 * What it does, said the way an owner would say it:
 *   "What does it actually cost to put each plate on the table?"
 *
 * The math the tool teaches:
 *   AP cost  → what the invoice says  (e.g. $28 / case of Romaine)
 *   yield %  → share that survives trim, peel, bone, shrink
 *   EP cost  → AP ÷ yield  (the cost of one usable ounce)
 *   plate    → Σ (EP cost × portion used) ÷ recipe portions
 *
 * This module computes those numbers and ships an ~80-row canonical
 * yield table (CIA-sourced; users may override per ingredient).
 *
 * Privacy invariants:
 *   - Pure math. No fetch, no DOM, no storage.
 *   - The recipe never leaves this function call.
 *   - Plausible bucket helpers are enum-locked: poison-string inputs
 *     return one of the declared values, never user data.
 *
 * Public API (also attached to window.PC for the browser):
 *   computeIngredientCost(row, options)   → per-row math
 *   computePlateCost(recipe)              → recipe-wide math
 *   suggestMenuPrices(plateCost)          → 28% / 30% / 33% targets
 *   validateRecipe(recipe)                → { valid, errors, warnings }
 *   convertUnits(amount, fromUnit, toUnit)→ same-category conversion
 *   lookupYield(ingredientName)           → canonical yield % or null
 *   bucketIngredientCount(n)              → enum bucket
 *   bucketYieldUsage(rows)                → enum bucket
 *   bucketPlateCostBand(plateCost)        → enum bucket
 *   YIELD_TABLE                           → the canonical yield table
 *   FOOD_COST_TARGETS                     → [0.28, 0.30, 0.33]
 */

(function(){
  'use strict';

  // Auto-require the shared loose-number parser in Node so tests pick
  // up EU-format / currency-symbol handling without per-test wiring.
  // Browsers get MuntinParse via the page-side <script> tag.
  if (typeof MuntinParse === 'undefined' && typeof require !== 'undefined') {
    try { var MuntinParse = require('../_shared/parse-number.js'); } catch (_) {}
  }

  // ============================================================
  // Constants
  // ============================================================

  // Three target food-cost percentages used to suggest menu prices.
  // The categories come straight from the National Restaurant Assoc.
  // benchmark guidance — we surface all three with one-line context
  // so the owner picks the bucket that matches their model.
  var FOOD_COST_TARGETS = [
    { target: 0.28, label: 'fine-dining',   note: 'Aim here if labour is high.' },
    { target: 0.30, label: 'casual',        note: 'Casual full-service benchmark.' },
    { target: 0.33, label: 'high-volume',   note: 'High-volume kitchens with lower labour.' }
  ];

  // Unit conversions. Every supported unit has a `category` (weight,
  // volume, count) and a `canonical` factor — multiply by `canonical`
  // to get the canonical unit for that category.
  // Canonical: weight = grams; volume = milliliters; count = each.
  var UNITS = {
    // Weight
    g:    { category: 'weight', canonical: 1 },
    gram: { category: 'weight', canonical: 1 },
    grams:{ category: 'weight', canonical: 1 },
    kg:   { category: 'weight', canonical: 1000 },
    oz:   { category: 'weight', canonical: 28.349523125 },
    lb:   { category: 'weight', canonical: 453.59237 },
    lbs:  { category: 'weight', canonical: 453.59237 },
    pound:{ category: 'weight', canonical: 453.59237 },
    pounds:{category: 'weight', canonical: 453.59237 },

    // Volume
    ml:    { category: 'volume', canonical: 1 },
    l:     { category: 'volume', canonical: 1000 },
    liter: { category: 'volume', canonical: 1000 },
    liters:{ category: 'volume', canonical: 1000 },
    tsp:   { category: 'volume', canonical: 4.92892 },
    tbsp:  { category: 'volume', canonical: 14.7868 },
    'fl-oz':{ category: 'volume', canonical: 29.5735 },
    'fl oz':{ category: 'volume', canonical: 29.5735 },
    floz:  { category: 'volume', canonical: 29.5735 },
    cup:   { category: 'volume', canonical: 236.588 },
    cups:  { category: 'volume', canonical: 236.588 },
    pt:    { category: 'volume', canonical: 473.176 },
    pint:  { category: 'volume', canonical: 473.176 },
    qt:    { category: 'volume', canonical: 946.353 },
    quart: { category: 'volume', canonical: 946.353 },
    gal:   { category: 'volume', canonical: 3785.41 },
    gallon:{ category: 'volume', canonical: 3785.41 },

    // Count
    each:  { category: 'count', canonical: 1 },
    ea:    { category: 'count', canonical: 1 },
    unit:  { category: 'count', canonical: 1 },
    units: { category: 'count', canonical: 1 },
    dozen: { category: 'count', canonical: 12 },
    dz:    { category: 'count', canonical: 12 },
    case:  { category: 'count', canonical: 1 } // a "case" is a count;
                                                 // its yield reflects
                                                 // whatever is in it.
  };

  // Canonical yield table. Sourced from culinary references (the
  // Culinary Institute of America's standard yield tables and the
  // Restaurant Association's purchasing handbook). Numbers are the
  // most-commonly-cited typical yield for a properly-handled
  // ingredient — a chef's gut yield will vary by ±5%. Keys are
  // normalized lowercase strings; matching is case-insensitive.
  var YIELD_TABLE = {
    // Greens & lettuces
    'romaine':              0.75,
    'iceberg':              0.74,
    'butter lettuce':       0.65,
    'green leaf':           0.70,
    'red leaf':             0.70,
    'spinach':              0.75,
    'kale':                 0.70,
    'arugula':              0.85,
    'swiss chard':          0.75,
    'collard greens':       0.65,

    // Cruciferous & stalks
    'broccoli':             0.65,
    'cauliflower':          0.60,
    'brussels sprouts':     0.80,
    'cabbage':              0.80,
    'asparagus':            0.55,
    'celery':               0.75,
    'fennel':               0.65,
    'leek':                 0.50,

    // Alliums
    'onion':                0.88,
    'red onion':            0.88,
    'shallot':              0.85,
    'garlic':               0.87,
    'scallion':             0.65,

    // Roots
    'carrot':               0.82,
    'parsnip':              0.85,
    'beet':                 0.75,
    'radish':               0.85,
    'turnip':               0.78,
    'rutabaga':             0.78,

    // Tubers
    'russet potato':        0.81,
    'yukon potato':         0.85,
    'sweet potato':         0.75,
    'red potato':           0.85,

    // Fruiting vegetables
    'tomato':               0.91,
    'cherry tomato':        1.00,
    'bell pepper':          0.82,
    'jalapeño':             0.85,
    'cucumber':             0.95,
    'eggplant':             0.81,
    'zucchini':             0.95,
    'butternut squash':     0.70,
    'acorn squash':         0.70,
    'pumpkin':              0.55,
    'corn on cob':          0.28,

    // Herbs (leaf yield from stem-on)
    'basil':                0.50,
    'parsley':              0.70,
    'cilantro':             0.70,
    'mint':                 0.70,
    'rosemary':             0.50,
    'thyme':                0.50,
    'oregano':              0.55,
    'tarragon':             0.55,
    'dill':                 0.65,

    // Mushrooms
    'button mushroom':      0.90,
    'cremini':              0.90,
    'portobello':           0.85,
    'shiitake':             0.85,
    'oyster mushroom':      0.90,

    // Fruit
    'avocado':              0.75,
    'lemon':                0.45,           // juice from whole
    'lime':                 0.35,           // juice from whole
    'orange':               0.55,           // segments / juice
    'grapefruit':           0.50,
    'apple':                0.78,
    'pear':                 0.78,
    'banana':               0.65,
    'mango':                0.65,
    'pineapple':            0.50,
    'watermelon':           0.50,
    'cantaloupe':           0.50,
    'strawberry':           0.89,
    'blueberry':            1.00,
    'raspberry':            1.00,

    // Meat
    'whole chicken':        0.60,
    'chicken breast':       0.95,
    'chicken thigh':        0.90,
    'whole turkey':         0.50,
    'whole duck':           0.45,
    'whole rabbit':         0.50,
    'pork shoulder':        0.75,
    'pork loin':             0.85,
    'pork belly':            0.90,
    // Bacon yield depends on whether the row captures cook-shrink.
    // We keep two entries so a row can choose the right physics; a
    // bare "bacon" lookup defaults to "raw" (1.00) since most prep
    // sheets list bacon as an AP weight.
    'bacon (raw)':           1.00,
    'bacon (cooked)':        0.55,
    'ribeye':                0.75,           // bone-in
    'striploin':            0.80,
    'tenderloin':           0.85,
    'short rib':            0.65,
    'lamb shoulder':        0.65,
    'lamb leg':             0.70,
    'ground beef':          1.00,           // no trim, but cook-shrink
    'ground pork':          1.00,
    'ground turkey':        1.00,

    // Seafood
    'whole salmon':         0.55,
    'salmon fillet':        0.95,
    'salmon (skin-on fillet)': 0.80,        // skin off + portion trim
    'whole halibut':        0.50,
    'whole branzino':       0.55,
    'whole sea bass':       0.55,
    'whole snapper':        0.50,
    'whole trout':          0.55,
    'tuna loin':            0.85,
    'lobster (whole)':      0.30,
    'shrimp (head-on)':     0.50,
    'shrimp (shell-on)':    0.85,
    'shrimp (p&d)':         1.00,
    'mussels':              0.35,
    'clams':                0.30,
    'whole crab':           0.25,
    'scallops':             1.00,           // already shucked at most ports
    'octopus':              0.45,           // tentacle yield after braise
    'squid':                0.80,

    // Aromatics & specialty produce
    'ginger':               0.85,
    'lemongrass':           0.45,           // tender white core only
    'bok choy':             0.80,
    'napa':                 0.80,
    'daikon':               0.85,

    // Plant-protein staples (no trim, listed for autocomplete + clarity)
    'tofu (firm)':          1.00,
    'tempeh':               1.00,
    'paneer':               1.00,

    // Pantry pastes / condiments common in independent kitchens
    'miso':                 1.00,
    'gochujang':            1.00,
    'harissa':              1.00,

    // Dairy & shelf items (default 100%, listed for autocomplete)
    'butter':               1.00,
    'olive oil':            1.00,
    'flour':                1.00,
    'sugar':                1.00,
    'salt':                 1.00,
    'pepper':               1.00,
    'parmesan':             0.95,           // rind
    'pecorino':             0.95,
    'feta':                 1.00,
    'mozzarella':           1.00,
    'egg':                  1.00
  };

  // ============================================================
  // Unit helpers
  // ============================================================

  // Normalize a raw unit string to a canonical lookup key.
  // 'LBS', 'lbs.', 'lbs '  →  'lbs'
  function normalizeUnit(u) {
    if (u == null) return '';
    return String(u).trim().toLowerCase().replace(/[.\s]+$/g, '').replace(/\s+/g, ' ');
  }

  // Convert `amount` from `fromUnit` to `toUnit`. Returns NaN if the
  // units aren't in the same category. The caller is responsible for
  // surfacing a user-visible error when NaN is returned.
  function convertUnits(amount, fromUnit, toUnit) {
    var f = UNITS[normalizeUnit(fromUnit)];
    var t = UNITS[normalizeUnit(toUnit)];
    if (!f || !t || f.category !== t.category) return NaN;
    var canonical = Number(amount) * f.canonical;
    return canonical / t.canonical;
  }

  // Numeric coercion routed through the shared loose-number parser
  // when present. Handles EU decimals, currency symbols beyond $,
  // smart quotes from Word pastes, and NBSP whitespace — the audit-
  // found failure modes that previously returned NaN and surfaced as
  // an "invalid-numbers" warning the user couldn't act on. Returns
  // a finite number or NaN.
  function pcCoerceNumber(v) {
    if (v == null || v === '') return NaN;
    if (typeof v === 'number') return isFinite(v) ? v : NaN;
    if (typeof MuntinParse !== 'undefined' && MuntinParse.parseLooseNumberValue) {
      var parsed = MuntinParse.parseLooseNumberValue(v);
      return parsed == null ? NaN : parsed;
    }
    var n = Number(v);
    return isFinite(n) ? n : NaN;
  }

  // Yield resolver — single source of truth for both the paste path
  // (via normalizeYieldInput) and the manual-entry path (called
  // directly from computeIngredientCost). Returns a fraction (0..1]
  // or null if unparseable. Disambiguates:
  //   "75%" → 0.75 (explicit percent)
  //   "0.75" → 0.75 (already a fraction)
  //   "75"   → 0.75 (over-1 heuristic: treat as a percent)
  //   "1.5"  → null (out-of-range — can't yield more than 100%)
  //   "0"    → 0 (caller should error)
  function pcResolveYield(raw) {
    if (raw == null || raw === '') return null;
    var hadPct = String(raw).indexOf('%') !== -1;
    var n = pcCoerceNumber(String(raw).replace(/%/g, ''));
    if (!isFinite(n) || n < 0) return null;
    if (n === 0) return 0;
    if (hadPct) return n / 100;
    if (n > 1) return n / 100;   // "75" interpreted as 75%
    return n;                     // already a fraction
  }

  // Look up a canonical yield % for an ingredient name. Returns null
  // if no match is found — the caller should default to 1.0 in that
  // case but display a "unknown yield, assuming 100%" hint.
  function lookupYield(name) {
    if (!name) return null;
    var key = String(name).trim().toLowerCase();
    if (YIELD_TABLE[key] != null) return YIELD_TABLE[key];
    // Loose fallbacks: drop parenthetical notes, then try plural-strip
    // forms ("tomatoes" → "tomato", "carrots" → "carrot").
    var noParens = key.replace(/\s*\([^)]*\)\s*/g, '').trim();
    if (YIELD_TABLE[noParens] != null) return YIELD_TABLE[noParens];
    // Bare "bacon" lookups default to the raw entry — most prep sheets
    // list bacon as an AP weight; cook-shrink is the rarer case and
    // requires the explicit "bacon (cooked)" name.
    if (noParens === 'bacon') return YIELD_TABLE['bacon (raw)'];
    var stripS = noParens.replace(/s$/, '');
    if (YIELD_TABLE[stripS] != null) return YIELD_TABLE[stripS];
    var stripEs = noParens.replace(/es$/, '');
    if (YIELD_TABLE[stripEs] != null) return YIELD_TABLE[stripEs];
    return null;
  }

  // ============================================================
  // Per-ingredient cost
  //
  // Inputs (a row):
  //   ingredient   — string (used for yield lookup if `yield` is null)
  //   apPrice      — dollars paid for `apQty` of `apUnit`
  //   apQty        — quantity purchased
  //   apUnit       — unit of purchase
  //   yield        — 0..1; if null, looked up from YIELD_TABLE
  //                  (defaults to 1.0 with a `unknown-yield` warning
  //                  if no canonical yield exists)
  //   usedQty      — quantity used in the recipe
  //   usedUnit     — unit the quantity is in
  //
  // Output:
  //   apUnitCost   — dollars per AP-canonical unit (g / ml / each)
  //   epUnitCost   — dollars per EP-canonical unit (after yield)
  //   usedCost     — dollars contributed to this plate
  //   apToEp       — multiplier (1 / yield)
  //   warning      — null or one of: 'mixed-units', 'zero-yield',
  //                  'over-used', 'unknown-yield', 'invalid-numbers'
  // ============================================================
  function computeIngredientCost(row) {
    var out = {
      ingredient: (row && row.ingredient) || '',
      apUnitCost: 0,
      epUnitCost: 0,
      usedCost: 0,
      apToEp: 1,
      yieldPercent: 1,
      warning: null
    };
    if (!row) return out;

    var apPrice = pcCoerceNumber(row.apPrice);
    var apQty   = pcCoerceNumber(row.apQty);
    var usedQty = pcCoerceNumber(row.usedQty);

    if (!isFinite(apPrice) || !isFinite(apQty) || !isFinite(usedQty) ||
        apPrice < 0 || apQty <= 0 || usedQty < 0) {
      out.warning = 'invalid-numbers';
      return out;
    }

    // Resolve yield. null/empty → ingredient lookup. Otherwise route
    // through pcResolveYield, which unifies the paste path
    // (normalizeYieldInput already canonicalises to "0.75") with the
    // manual-entry path (where users type "75" expecting 75 %, not
    // 7500 %). Both now produce identical math.
    var y;
    if (row.yieldPercent == null || row.yieldPercent === '') {
      y = lookupYield(row.ingredient);
    } else {
      y = pcResolveYield(row.yieldPercent);
    }
    if (y == null || !isFinite(y)) {
      out.warning = 'unknown-yield';
      y = 1;
    }
    if (y <= 0) {
      out.warning = 'zero-yield';
      out.yieldPercent = 0;
      return out;
    }
    out.yieldPercent = y;
    out.apToEp = 1 / y;

    // Convert the used quantity into the AP unit so the math is in a
    // single domain. If the units don't share a category, surface the
    // mixed-units warning and skip cost computation.
    var converted = convertUnits(usedQty, row.usedUnit, row.apUnit);
    if (!isFinite(converted)) {
      out.warning = 'mixed-units';
      return out;
    }
    if (converted > apQty * 50) {
      // Recipe consumes >50× the AP qty — almost always a unit
      // mistake (cup-of-flour vs lb-of-flour). Surface honestly.
      out.warning = 'over-used';
    }

    out.apUnitCost = apPrice / apQty;
    out.epUnitCost = out.apUnitCost / y;
    out.usedCost   = out.epUnitCost * converted;
    return out;
  }

  // ============================================================
  // Whole-recipe cost
  //
  // Recipe shape:
  //   { name, portions, rows: [ ...ingredient rows ] }
  //
  // Output:
  //   batchCost   — sum of per-ingredient usedCost (one batch)
  //   plateCost   — batchCost / portions
  //   portions
  //   ingredients — array of computeIngredientCost results
  //   warnings    — collected per-row warnings (deduped, ordered)
  //   confidence  — 'high' | 'medium' | 'low' depending on warnings
  // ============================================================
  function computePlateCost(recipe) {
    var out = {
      name:        (recipe && recipe.name) || '',
      portions:    Math.max(1, Number((recipe && recipe.portions) || 1)),
      ingredients: [],
      batchCost:   0,
      plateCost:   0,
      warnings:    [],
      confidence:  'high'
    };
    if (!recipe || !Array.isArray(recipe.rows) || !recipe.rows.length) {
      out.confidence = 'low';
      return out;
    }
    var costable = 0;
    recipe.rows.forEach(function(row){
      var r = computeIngredientCost(row);
      out.ingredients.push(r);
      if (r.warning && out.warnings.indexOf(r.warning) === -1) {
        out.warnings.push(r.warning);
      }
      // Costs from rows with mixed-units / zero-yield / invalid are
      // not counted into the plate. The warning surfaces the gap.
      if (!r.warning || r.warning === 'unknown-yield' || r.warning === 'over-used') {
        out.batchCost += r.usedCost;
        costable++;
      }
    });
    out.plateCost = out.portions > 0 ? out.batchCost / out.portions : 0;

    // Confidence rating. Every uncostable row drops us a tier.
    if (costable < recipe.rows.length) {
      out.confidence = costable >= recipe.rows.length * 0.7 ? 'medium' : 'low';
    }
    if (out.warnings.indexOf('unknown-yield') !== -1 && out.confidence === 'high') {
      out.confidence = 'medium';
    }
    return out;
  }

  // ============================================================
  // formatRowMath — produce a one-line equation showing how a single
  // row's cost was derived. Used by the form's "Show the math"
  // disclosure so the AP→EP→plate physics is visible to the reader.
  // Returns '' for rows that didn't compute a usable cost (warnings
  // surface separately).
  // ============================================================
  function formatRowMath(row, computed) {
    if (!row || !computed) return '';
    if (!isFinite(computed.usedCost) || computed.usedCost <= 0) return '';
    if (computed.warning && computed.warning !== 'unknown-yield') return '';
    var ap = '$' + Number(row.apPrice).toFixed(2);
    var apQty = String(row.apQty);
    var apUnit = String(row.apUnit || '');
    var apUnitCost = '$' + Number(computed.apUnitCost).toFixed(4);
    var yieldStr = Math.round(Number(computed.yieldPercent) * 100) + '%';
    var epUnitCost = '$' + Number(computed.epUnitCost).toFixed(4);
    var usedQty = String(row.usedQty);
    var usedUnit = String(row.usedUnit || '');
    var usedCost = '$' + Number(computed.usedCost).toFixed(2);
    var ep = (yieldStr === '100%')
      ? apUnitCost + ' (no yield loss)'
      : apUnitCost + ' ÷ ' + yieldStr + ' = ' + epUnitCost + ' / ' + apUnit;
    return ap + ' ÷ ' + apQty + ' ' + apUnit + ' = ' + apUnitCost + ' / ' + apUnit +
           ' · ' + ep +
           ' · × ' + usedQty + ' ' + usedUnit + ' = ' + usedCost;
  }

  // ============================================================
  // Suggested menu prices at 28% / 30% / 33% food-cost targets.
  // Each entry includes the suggested price and the contribution
  // margin in dollars at that price.
  // ============================================================
  function suggestMenuPrices(plateCost) {
    var p = Number(plateCost);
    if (!isFinite(p) || p < 0) p = 0;
    return FOOD_COST_TARGETS.map(function(t){
      var price = p > 0 ? p / t.target : 0;
      return {
        target:    t.target,
        label:     t.label,
        note:      t.note,
        price:     price,
        cmDollars: price - p
      };
    });
  }

  // ============================================================
  // validateRecipe — per-row validation surfaces user-fixable input
  // errors. Returns errors that block computation and warnings the
  // tool should display alongside the result.
  // ============================================================
  function validateRecipe(recipe) {
    var errors = [];
    var warnings = [];
    if (!recipe || typeof recipe !== 'object') {
      errors.push({ field: 'recipe', message: 'No recipe provided.' });
      return { valid: false, errors: errors, warnings: warnings };
    }
    if (!Array.isArray(recipe.rows) || recipe.rows.length === 0) {
      errors.push({ field: 'rows', message: 'Add at least one ingredient.' });
    }
    var portions = pcCoerceNumber(recipe.portions);
    if (!isFinite(portions) || portions <= 0) {
      errors.push({ field: 'portions', message: 'Portions must be a positive number.' });
    }
    (recipe.rows || []).forEach(function(row, idx){
      var apPrice = pcCoerceNumber(row.apPrice);
      var apQty   = pcCoerceNumber(row.apQty);
      var usedQty = pcCoerceNumber(row.usedQty);
      if (!row.ingredient || !String(row.ingredient).trim()) {
        warnings.push({ row: idx, field: 'ingredient', message: 'Name this ingredient.' });
      }
      if (!isFinite(apPrice) || apPrice < 0) {
        errors.push({ row: idx, field: 'apPrice', message: 'AP price must be a non-negative number.' });
      }
      if (!isFinite(apQty) || apQty <= 0) {
        errors.push({ row: idx, field: 'apQty', message: 'AP quantity must be greater than zero.' });
      }
      if (!isFinite(usedQty) || usedQty < 0) {
        errors.push({ row: idx, field: 'usedQty', message: 'Used quantity must be zero or more.' });
      }
      if (row.apUnit && !UNITS[normalizeUnit(row.apUnit)]) {
        errors.push({ row: idx, field: 'apUnit', message: 'Unrecognised unit: "' + row.apUnit + '".' });
      }
      if (row.usedUnit && !UNITS[normalizeUnit(row.usedUnit)]) {
        errors.push({ row: idx, field: 'usedUnit', message: 'Unrecognised unit: "' + row.usedUnit + '".' });
      }
      if (row.apUnit && row.usedUnit) {
        var fa = UNITS[normalizeUnit(row.apUnit)];
        var fu = UNITS[normalizeUnit(row.usedUnit)];
        if (fa && fu && fa.category !== fu.category) {
          warnings.push({ row: idx, field: 'usedUnit',
            message: 'AP unit (' + row.apUnit + ') and used unit (' + row.usedUnit + ') are different categories. The math needs the same kind of measure.' });
        }
      }
    });
    return { valid: errors.length === 0, errors: errors, warnings: warnings };
  }

  // ============================================================
  // Paste-from-spreadsheet parser. Owners with a recipe spreadsheet
  // paste it directly. Auto-detects delimiter (CSV / TSV / pipe),
  // auto-maps headers via an alias table, and produces rows in the
  // plate-cost row shape so they drop into the form unchanged.
  // ============================================================
  // Header aliases — English and Spanish header rows both auto-map.
  var HEADER_ALIASES = {
    ingredient:   ['ingredient', 'item', 'name', 'product',
                   'ingrediente', 'producto', 'nombre'],
    apPrice:      ['ap price', 'ap_price', 'price', 'cost', 'ap cost', 'ap$',
                   'precio ap', 'precio_ap', 'precio', 'costo'],
    apQty:        ['ap qty', 'ap_qty', 'ap quantity', 'qty', 'quantity', 'purchased', 'pack size',
                   'cant. ap', 'cant ap', 'cantidad ap', 'cantidad', 'comprado'],
    apUnit:       ['ap unit', 'ap_unit', 'unit', 'pack unit', 'purchase unit',
                   'unidad ap', 'unidad', 'unidad de compra'],
    yieldPercent: ['yield', 'yield %', 'yield_percent', 'yield_pct', 'yield pct', 'edible',
                   'rendimiento', 'rendimiento %', 'rend.', 'rend. %', 'rend %'],
    usedQty:      ['used qty', 'used_qty', 'used', 'recipe qty', 'amount', 'serving', 'portion',
                   'cant. usada', 'cant usada', 'cantidad usada', 'usado', 'porción'],
    usedUnit:     ['used unit', 'used_unit', 'recipe unit', 'serving unit', 'portion unit',
                   'unidad usada', 'unidad receta', 'unidad de porción']
  };

  // Yield-input forgiveness. Accepts "75%", "75", "0.75" and returns
  // a string in the canonical 0..1 fractional form. Empty/null inputs
  // pass through as-is so the form's "auto" placeholder still fires.
  function normalizeYieldInput(raw) {
    if (raw == null) return null;
    var s = String(raw).trim();
    if (s === '') return '';
    var hadPct = s.indexOf('%') !== -1;
    var n = Number(s.replace(/%/g, '').trim());
    if (!isFinite(n)) return s;
    if (hadPct || n > 1) return String(n / 100);
    return String(n);
  }

  function detectDelimiter(text){
    var firstLine = String(text).split(/\r?\n/)[0] || '';
    var counts = { ',': 0, '\t': 0, ';': 0, '|': 0 };
    for (var i = 0; i < firstLine.length; i++) {
      var c = firstLine[i];
      if (c in counts) counts[c]++;
    }
    var best = ',', bestCount = -1;
    for (var k in counts) if (counts[k] > bestCount) { best = k; bestCount = counts[k]; }
    return best;
  }
  // Minimal CSV splitter — handles double-quote-quoted fields.
  function splitCsvLine(line, delim){
    var out = [], cur = '', inQ = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (inQ) {
        if (c === '"' && line[i+1] === '"') { cur += '"'; i++; }
        else if (c === '"') { inQ = false; }
        else cur += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === delim) { out.push(cur); cur = ''; }
        else cur += c;
      }
    }
    out.push(cur);
    return out.map(function(s){ return s.trim(); });
  }
  function isHeaderRow(cells){
    var nonNumeric = 0;
    for (var i = 0; i < cells.length; i++) {
      var s = String(cells[i]).trim();
      if (s === '') continue;
      if (isNaN(Number(s.replace(/[$,]/g, '')))) nonNumeric++;
    }
    return nonNumeric >= Math.max(2, Math.ceil(cells.length / 2));
  }
  function autoMapHeaders(headerCells){
    var mapping = {};
    headerCells.forEach(function(cell, idx){
      var norm = String(cell).trim().toLowerCase().replace(/\s+/g, ' ');
      Object.keys(HEADER_ALIASES).forEach(function(field){
        if (mapping[field] != null) return;
        if (HEADER_ALIASES[field].indexOf(norm) !== -1) mapping[field] = idx;
      });
    });
    return mapping;
  }

  function parseTabularText(text){
    // Returns { rows: [...], mapping, headerRowDetected, warnings }.
    // rows are in the same shape that the input grid produces, so
    // populating the grid is a 1:1 set.
    var raw = String(text || '').replace(/^﻿/, '');
    if (!raw.trim()) return { rows: [], mapping: {}, headerRowDetected: false, warnings: ['Pasted text was empty.'] };

    var lines = raw.split(/\r?\n/).filter(function(l){ return l.trim().length > 0; });
    var delim = detectDelimiter(raw);
    var cellRows = lines.map(function(l){ return splitCsvLine(l, delim); });
    if (!cellRows.length) return { rows: [], mapping: {}, headerRowDetected: false, warnings: ['No rows detected.'] };

    var warnings = [];
    var headerRowDetected = isHeaderRow(cellRows[0]);
    var mapping;
    var dataRows;
    if (headerRowDetected) {
      mapping = autoMapHeaders(cellRows[0]);
      dataRows = cellRows.slice(1);
    } else {
      // Positional fallback: ingredient, ap_price, ap_qty, ap_unit,
      // yield, used_qty, used_unit.
      mapping = { ingredient: 0, apPrice: 1, apQty: 2, apUnit: 3, yieldPercent: 4, usedQty: 5, usedUnit: 6 };
      dataRows = cellRows;
      warnings.push('No header row detected — assumed columns: Ingredient, AP price, AP qty, AP unit, Yield %, Used qty, Used unit.');
    }

    if (mapping.ingredient == null && mapping.apPrice == null) {
      return { rows: [], mapping: mapping, headerRowDetected: headerRowDetected,
               warnings: warnings.concat(['Could not find Ingredient or AP price columns. Add a header row, or paste columns in this order: Ingredient, AP price, AP qty, AP unit, Yield %, Used qty, Used unit.']) };
    }

    ['ingredient','apPrice','apQty','apUnit','usedQty','usedUnit'].forEach(function(f){
      if (mapping[f] == null) warnings.push('Could not find a "' + f + '" column — those cells will be blank.');
    });

    // Numeric fields strip $ and thousands-separators; string fields
    // do not (preserve "Beef, ground" verbatim if quoted).
    function cleanString(s){
      return String(s == null ? '' : s).trim();
    }
    function cleanNumber(s){
      return cleanString(s).replace(/^[$]/, '').replace(/,/g, '');
    }
    var NUMERIC_FIELDS = { apPrice: 1, apQty: 1, usedQty: 1, yieldPercent: 1 };
    // Aliases mapping common spreadsheet unit names onto the canonical
    // dropdown values. "case" is intentionally collapsed to "each"
    // because case counts vary by supplier — the warning surfaces so
    // the owner can verify the AP qty number captures actual count.
    var UNIT_ALIASES = { 'case': 'each', 'cs': 'each', 'cs.': 'each' };
    var caseSeen = false;
    function mapUnit(u){
      var v = String(u || '').trim().toLowerCase();
      if (UNIT_ALIASES[v]) { caseSeen = caseSeen || v === 'case' || v === 'cs' || v === 'cs.'; return UNIT_ALIASES[v]; }
      return u;
    }
    var rows = dataRows.map(function(cells){
      function pick(field){
        var idx = mapping[field];
        if (idx == null || idx >= cells.length) return '';
        return NUMERIC_FIELDS[field] ? cleanNumber(cells[idx]) : cleanString(cells[idx]);
      }
      // Yield handling — accept "75%", "0.75", "75" all as 0.75.
      // Shared with the form's blur handler so both entry paths obey
      // the same forgiveness rules.
      var y = normalizeYieldInput(pick('yieldPercent'));
      if (y == null) y = '';
      return {
        ingredient:   pick('ingredient'),
        apPrice:      pick('apPrice'),
        apQty:        pick('apQty'),
        apUnit:       mapUnit(pick('apUnit')) || 'lb',
        yieldPercent: y,
        usedQty:      pick('usedQty'),
        usedUnit:     mapUnit(pick('usedUnit')) || 'oz'
      };
    });
    if (caseSeen) {
      warnings.push('"case" was treated as "each" — case counts vary by supplier. Verify the AP qty captures the actual unit count (e.g. 24 for a case of 24).');
    }

    return { rows: rows, mapping: mapping, headerRowDetected: headerRowDetected, warnings: warnings };
  }

  // ============================================================
  // bottleneckLine — the single ingredient that dominates plate cost.
  // Returns { name, share } when one ingredient accounts for ≥30%
  // of plate cost; null otherwise. The chef knows which ingredient
  // moved their menu — the tool surfaces it.
  // ============================================================
  function bottleneckLine(summary) {
    if (!summary || !Array.isArray(summary.ingredients) || !summary.ingredients.length) return null;
    if (!isFinite(summary.batchCost) || summary.batchCost <= 0) return null;
    var top = null;
    for (var i = 0; i < summary.ingredients.length; i++) {
      var ing = summary.ingredients[i];
      if (!ing || !isFinite(ing.usedCost) || ing.usedCost <= 0) continue;
      if (!top || ing.usedCost > top.usedCost) top = ing;
    }
    if (!top) return null;
    var share = top.usedCost / summary.batchCost;
    if (share < 0.30) return null;
    return { name: top.ingredient || '', share: share, dollars: top.usedCost };
  }

  // ============================================================
  // recommendedTier — picks one of the three suggested-price tiers
  // as the default for this dish. Deterministic; used to render a
  // RECOMMENDED pill next to the right row.
  //
  // Rule:
  //   - Recipe contains ≥4 perishable rows or ≥2 protein rows → 30% (casual)
  //   - 'unknown-yield' warning fires → 28% (fine-dining; absorbs uncertainty)
  //   - Otherwise → 33% (high-volume)
  // ============================================================
  var PERISHABLE_KEYS = (function(){
    var set = {};
    [
      'romaine','iceberg','butter lettuce','green leaf','red leaf','spinach','kale','arugula','swiss chard','collard greens',
      'broccoli','cauliflower','brussels sprouts','cabbage','asparagus','celery','fennel','leek','scallion',
      'tomato','cherry tomato','bell pepper','jalapeño','cucumber','eggplant','zucchini','butternut squash','acorn squash',
      'basil','parsley','cilantro','mint','rosemary','thyme','oregano','tarragon','dill',
      'avocado','strawberry','blueberry','raspberry','mango','pineapple','watermelon','cantaloupe','grapefruit','orange','lemon','lime'
    ].forEach(function(k){ set[k] = true; });
    return set;
  })();
  var PROTEIN_KEYS = (function(){
    var set = {};
    [
      'whole chicken','chicken breast','chicken thigh','whole turkey','whole duck','whole rabbit',
      'pork shoulder','pork loin','pork belly','bacon (raw)','bacon (cooked)','ribeye','striploin','tenderloin','short rib',
      'lamb shoulder','lamb leg','ground beef','ground pork','ground turkey',
      'whole salmon','salmon fillet','salmon (skin-on fillet)','whole halibut','whole branzino','whole sea bass','whole snapper','whole trout',
      'tuna loin','lobster (whole)','shrimp (head-on)','shrimp (shell-on)','shrimp (p&d)','mussels','clams','whole crab','scallops','octopus','squid',
      'tofu (firm)','tempeh','paneer'
    ].forEach(function(k){ set[k] = true; });
    return set;
  })();
  function recommendedTier(summary) {
    if (!summary || !Array.isArray(summary.ingredients) || !summary.ingredients.length) return 'high-volume';
    if (Array.isArray(summary.warnings) && summary.warnings.indexOf('unknown-yield') !== -1) {
      return 'fine-dining';
    }
    var perishable = 0, protein = 0;
    summary.ingredients.forEach(function(ing){
      var key = String(ing.ingredient || '').trim().toLowerCase();
      if (PERISHABLE_KEYS[key]) perishable++;
      if (PROTEIN_KEYS[key])    protein++;
    });
    if (perishable >= 4 || protein >= 2) return 'casual';
    return 'high-volume';
  }

  // ============================================================
  // URL-fragment scenario encoding (Phase D — Muntin signature).
  //
  // The Cost Drift Check-in needs the calendar reminder to lead the
  // owner back to a fully-rehydrated form. Same shape as Open Hours
  // and Margin Math (URL-safe key=value pairs, not base64) so the
  // family pattern is recognisable across the suite.
  //
  // Fragment schema (v1):
  //   v=1
  //   n=<urlencoded dish name>
  //   p=<portions>
  //   d=<YYYY-MM-DD baseline date — when this costing was captured>
  //   i=<row1>;<row2>;...   each row pipe-delimited:
  //                          name|apPrice|apQty|apUnit|yield|usedQty|usedUnit
  //   mode=recost            present when the recheck UI should open
  //
  // Privacy-safe: data lives only in the user's URL bar; per HTTP
  // spec, fragments after `#` are never sent to a server. Forward-
  // compat: unknown keys are ignored on decode.
  // ============================================================
  var PC_FRAGMENT_VERSION = '1';

  // encodeURIComponent leaves "|", ";", "&", and "=" untouched, but
  // those are our row/segment/pair delimiters. Hard-encode them so a
  // dish name like "Tinga & Mole; Pico|Salsa" round-trips cleanly.
  function encodeRowField(s) {
    return encodeURIComponent(String(s == null ? '' : s))
      .replace(/\|/g, '%7C')
      .replace(/;/g,  '%3B')
      .replace(/&/g,  '%26')
      .replace(/=/g,  '%3D');
  }

  function encodeRecipe(recipe, options) {
    if (!recipe) return '';
    options = options || {};
    var rows = (recipe.rows || []).filter(function(r){
      return r && (r.ingredient || r.apPrice || r.apQty || r.usedQty);
    });
    var parts = [];
    parts.push('v=' + PC_FRAGMENT_VERSION);
    if (recipe.name)     parts.push('n=' + encodeRowField(recipe.name));
    if (recipe.portions) parts.push('p=' + Number(recipe.portions));
    if (options.date)    parts.push('d=' + encodeRowField(options.date));
    if (rows.length) {
      parts.push('i=' + rows.map(function(r){
        return [
          encodeRowField(r.ingredient || ''),
          encodeRowField(r.apPrice    || ''),
          encodeRowField(r.apQty      || ''),
          encodeRowField(r.apUnit     || ''),
          encodeRowField(r.yieldPercent || ''),
          encodeRowField(r.usedQty    || ''),
          encodeRowField(r.usedUnit   || '')
        ].join('|');
      }).join(';'));
    }
    if (options.mode) parts.push('mode=' + encodeRowField(options.mode));
    return parts.join('&');
  }

  function decodeRecipe(fragment) {
    var s = String(fragment || '').replace(/^#/, '');
    if (!s) return null;
    var pairs = s.split('&');
    // Pair values are kept ENCODED until field extraction. Decoding
    // eagerly here would re-introduce literal "|" and ";" inside
    // ingredient names and corrupt the field/row split.
    var raw = {};
    for (var i = 0; i < pairs.length; i++) {
      var eq = pairs[i].indexOf('=');
      if (eq === -1) continue;
      raw[pairs[i].slice(0, eq)] = pairs[i].slice(eq + 1);
    }
    function dec(v) { try { return decodeURIComponent(v); } catch (e) { return v; } }
    if (raw.v !== PC_FRAGMENT_VERSION) return null;
    var rows = [];
    if (raw.i) {
      raw.i.split(';').forEach(function(seg){
        if (!seg) return;
        var parts = seg.split('|').map(dec);
        rows.push({
          ingredient:   parts[0] || '',
          apPrice:      parts[1] || '',
          apQty:        parts[2] || '',
          apUnit:       parts[3] || 'lb',
          yieldPercent: parts[4] || '',
          usedQty:      parts[5] || '',
          usedUnit:     parts[6] || 'oz'
        });
      });
    }
    return {
      name:     raw.n != null ? dec(raw.n) : '',
      portions: Number(raw.p) || 1,
      rows:     rows,
      date:     raw.d != null ? dec(raw.d) : '',
      mode:     raw.mode != null ? dec(raw.mode) : ''
    };
  }

  // ============================================================
  // generateQuarterlyIcs — RFC 5545 calendar reminder, 8 events at
  // 3-month intervals (mirrors Open Hours's signature). DTSTART is
  // 90 days from today; URL field carries the rehydration link.
  // ============================================================
  function generateQuarterlyIcs(scenarioUrl, options) {
    options = options || {};
    var locale = options.locale === 'es' ? 'es' : 'en';
    var url = String(scenarioUrl || '');
    var dishName = String(options.dishName || '').trim();
    var summary = locale === 'es'
      ? 'Costo del plato — revisión trimestral' + (dishName ? ' (' + dishName + ')' : '')
      : 'Plate cost — quarterly recipe recheck' + (dishName ? ' (' + dishName + ')' : '');
    var description = locale === 'es'
      ? ('Re-costea esta receta. Los precios de las facturas se mueven cada mes; ' +
         'una vez al trimestre, abre el escenario guardado y captura los costos de hoy. ' +
         'Reabre el escenario: ' + url)
      : ('Recost this recipe. Invoice prices drift monthly; once a quarter, ' +
         'reopen the saved scenario and type today\'s prices. ' +
         'Reopen the scenario: ' + url);
    var alarmMsg = locale === 'es'
      ? 'Recordatorio: re-costea ' + (dishName || 'la receta') + ' mañana'
      : 'Reminder: recost ' + (dishName || 'the recipe') + ' tomorrow';

    var p2 = function(n){ return (n < 10 ? '0' : '') + n; };
    var icsDate = function(d){
      return d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) +
             'T' + p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + p2(d.getUTCSeconds()) + 'Z';
    };
    var slug = (dishName || 'recipe').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    var start = new Date();
    start.setUTCDate(start.getUTCDate() + 90);
    start.setUTCHours(15, 0, 0, 0);
    var end = new Date(start.getTime() + 30 * 60 * 1000);
    var uid = 'pc-quarterly-' + slug + '-' + start.getTime() + '@muntin.digital';

    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Muntin Digital//Plate Cost Calculator//' + (locale === 'es' ? 'ES' : 'EN'),
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + icsDate(new Date()),
      'DTSTART:' + icsDate(start),
      'DTEND:' + icsDate(end),
      'RRULE:FREQ=MONTHLY;INTERVAL=3;COUNT=8',
      'SUMMARY:' + summary,
      'DESCRIPTION:' + description.replace(/\n/g, '\\n'),
      'URL:' + url,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:' + alarmMsg,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    return lines.join('\r\n') + '\r\n';
  }

  // ============================================================
  // verdictForDrift — produces a one-sentence Drift Verdict given
  // old plate cost, new plate cost, and the menu price the dish
  // currently sells at. Returns { tone, copyEN, copyES }.
  //
  // Tone bands:
  //   'improved' — new plate cost is meaningfully lower (< -5% of old)
  //   'steady'   — drift within ±5% AND food-cost % stays in band
  //   'slipped'  — drift > +5% but still within target food-cost band
  //   'crossed'  — food-cost % crosses out of healthy band (>33%)
  // ============================================================
  function verdictForDrift(oldPlate, newPlate, menuPrice) {
    var op = Number(oldPlate);
    var np = Number(newPlate);
    if (!isFinite(op) || op <= 0 || !isFinite(np) || np < 0) {
      return { tone: 'unknown', copyEN: '', copyES: '' };
    }
    var driftPct = (np - op) / op;
    var mp = Number(menuPrice);
    var foodCostPct = (isFinite(mp) && mp > 0) ? (np / mp) : null;
    var driftPctRound = Math.round(driftPct * 100);
    var driftAbsRound = Math.abs(driftPctRound);
    var fcPctRound = foodCostPct != null ? Math.round(foodCostPct * 100) : null;
    var fcStr = fcPctRound != null ? fcPctRound + '%' : null;

    if (foodCostPct != null && foodCostPct > 0.33 && (foodCostPct - (op / mp)) > 0.02) {
      // Food-cost % crossed out of the healthy band on this drift.
      return {
        tone: 'crossed',
        driftPct: driftPctRound,
        foodCostPct: fcPctRound,
        copyEN: 'Crossed out of the healthy food-cost band — at the current menu price, this dish is now ' +
                fcStr + ' food cost (was ' + Math.round((op / mp) * 100) + '%). Consider raising the menu price or substituting.',
        copyES: 'Cruzó fuera de la banda saludable — al precio actual del menú, este plato es ahora ' +
                fcStr + ' de costo de alimento (antes ' + Math.round((op / mp) * 100) + '%). Considera subir el precio o sustituir.'
      };
    }
    if (driftPct > 0.05) {
      return {
        tone: 'slipped',
        driftPct: driftPctRound,
        foodCostPct: fcPctRound,
        copyEN: 'Plate cost up ' + driftPctRound + '% since the baseline' +
                (fcStr ? ' (now ' + fcStr + ' food cost at the current menu price)' : '') +
                '. Still in band — but the trend is one to watch.',
        copyES: 'Costo del plato +' + driftPctRound + '% desde la base' +
                (fcStr ? ' (ahora ' + fcStr + ' de costo de alimento al precio actual)' : '') +
                '. Aún en banda — pero la tendencia merece atención.'
      };
    }
    if (driftPct < -0.05) {
      return {
        tone: 'improved',
        driftPct: driftPctRound,
        foodCostPct: fcPctRound,
        copyEN: 'Plate cost down ' + Math.abs(driftPctRound) + '% — the dish is more profitable than three months ago.',
        copyES: 'Costo del plato −' + Math.abs(driftPctRound) + '% — el plato rinde más que hace tres meses.'
      };
    }
    return {
      tone: 'steady',
      driftPct: driftPctRound,
      foodCostPct: fcPctRound,
      copyEN: 'Steady — within ' + driftAbsRound + '% of the baseline. No action needed this quarter.',
      copyES: 'Estable — dentro de ' + driftAbsRound + '% de la base. Sin acción este trimestre.'
    };
  }

  // ============================================================
  // Plausible bucket helpers — every event-property value is one of
  // the declared enum values, never user data. Tested in the test
  // suite with poison-string inputs.
  // ============================================================
  function bucketIngredientCount(n) {
    var v = Number(n);
    if (!isFinite(v) || v <= 0) return '0';
    if (v <= 3) return '1-3';
    if (v <= 7) return '4-7';
    if (v <= 12) return '8-12';
    return 'gt-12';
  }
  function bucketYieldUsage(rows) {
    if (!Array.isArray(rows) || !rows.length) return 'none-set';
    var withYield = 0;
    rows.forEach(function(r){
      var y = (r && r.yieldPercent != null && r.yieldPercent !== '')
        ? Number(r.yieldPercent)
        : NaN;
      if (isFinite(y) && y > 0 && y < 1) withYield++;
    });
    if (withYield === 0) return 'none-set';
    if (withYield <= rows.length * 0.5) return 'partial';
    return 'full';
  }
  function bucketPlateCostBand(plateCost) {
    var v = Number(plateCost);
    if (!isFinite(v) || v < 0) return 'invalid';
    if (v < 2) return 'lt-2';
    if (v < 5) return '2-5';
    if (v < 10) return '5-10';
    return 'gt-10';
  }
  // Cost Drift Check-in tracking — buckets the % change between the
  // baseline plate cost and today's recosted plate cost. Enum-locked
  // exactly like the others; poison-safe.
  function bucketDriftBand(oldPlate, newPlate) {
    var op = Number(oldPlate);
    var np = Number(newPlate);
    if (!isFinite(op) || op <= 0 || !isFinite(np) || np < 0) return 'invalid';
    var d = (np - op) / op;
    if (d <= -0.10) return 'lt-neg-10';
    if (d <= -0.05) return 'neg-5-to-10';
    if (d <  0.05) return 'steady';
    if (d <  0.10) return 'pos-5-to-10';
    return 'gt-pos-10';
  }

  // ============================================================
  // Sample recipe — Cacio e pepe. Five ingredients; tight; uses two
  // units that need conversion (oz → g) so a first-time visitor sees
  // every code path fire.
  // ============================================================
  var SAMPLE_RECIPE_EN = {
    name:     'Cacio e pepe',
    portions: 1,
    rows: [
      { ingredient: 'Tonnarelli (dry pasta)', apPrice: 4.50, apQty: 1,    apUnit: 'lb',
        yieldPercent: 1.00, usedQty: 4,   usedUnit: 'oz' },
      { ingredient: 'Pecorino Romano',         apPrice: 18,   apQty: 1,    apUnit: 'lb',
        yieldPercent: 0.95, usedQty: 1.5, usedUnit: 'oz' },
      { ingredient: 'Black peppercorn',        apPrice: 12,   apQty: 8,    apUnit: 'oz',
        yieldPercent: 1.00, usedQty: 0.05, usedUnit: 'oz' },
      { ingredient: 'Olive oil',               apPrice: 24,   apQty: 1,    apUnit: 'l',
        yieldPercent: 1.00, usedQty: 1,    usedUnit: 'tbsp' },
      { ingredient: 'Sea salt',                apPrice: 6,    apQty: 26,   apUnit: 'oz',
        yieldPercent: 1.00, usedQty: 0.1,  usedUnit: 'oz' }
    ]
  };

  // Spanish sample — the same recipe, rendered with the names a
  // Spanish-speaking chef would actually use on the prep sheet.
  // Same numbers (so the Plate Card output matches between locales)
  // but locale-appropriate ingredient names + dish title.
  // Spanish sample is a dish a Spanish-speaking kitchen actually
  // cooks (rather than a translated Roman pasta). Five rows, mixes
  // weight + count + volume so every code path still fires.
  var SAMPLE_RECIPE_ES = {
    name:     'Tinga de pollo',
    portions: 4,
    rows: [
      { ingredient: 'Pechuga de pollo',     apPrice: 18,    apQty: 4,  apUnit: 'lb',
        yieldPercent: 0.95, usedQty: 1.5, usedUnit: 'lb' },
      { ingredient: 'Tomate Roma',          apPrice: 6,     apQty: 2,  apUnit: 'lb',
        yieldPercent: 0.91, usedQty: 12,  usedUnit: 'oz' },
      { ingredient: 'Cebolla blanca',       apPrice: 1.50,  apQty: 1,  apUnit: 'lb',
        yieldPercent: 0.88, usedQty: 4,   usedUnit: 'oz' },
      { ingredient: 'Chipotle en adobo',    apPrice: 4.50,  apQty: 8,  apUnit: 'oz',
        yieldPercent: 1.00, usedQty: 1,   usedUnit: 'oz' },
      { ingredient: 'Aceite de oliva',      apPrice: 24,    apQty: 1,  apUnit: 'l',
        yieldPercent: 1.00, usedQty: 2,   usedUnit: 'tbsp' }
    ]
  };

  // ============================================================
  // Public API
  // ============================================================
  var api = {
    computeIngredientCost: computeIngredientCost,
    computePlateCost:      computePlateCost,
    suggestMenuPrices:     suggestMenuPrices,
    formatRowMath:         formatRowMath,
    bottleneckLine:        bottleneckLine,
    recommendedTier:       recommendedTier,
    validateRecipe:        validateRecipe,
    convertUnits:          convertUnits,
    lookupYield:           lookupYield,
    normalizeUnit:         normalizeUnit,
    parseTabularText:      parseTabularText,
    normalizeYieldInput:   normalizeYieldInput,
    encodeRecipe:          encodeRecipe,
    decodeRecipe:          decodeRecipe,
    generateQuarterlyIcs:  generateQuarterlyIcs,
    verdictForDrift:       verdictForDrift,
    bucketIngredientCount: bucketIngredientCount,
    bucketYieldUsage:      bucketYieldUsage,
    bucketPlateCostBand:   bucketPlateCostBand,
    bucketDriftBand:       bucketDriftBand,
    YIELD_TABLE:           YIELD_TABLE,
    UNITS:                 UNITS,
    FOOD_COST_TARGETS:     FOOD_COST_TARGETS,
    SAMPLE_RECIPE_EN:      SAMPLE_RECIPE_EN,
    SAMPLE_RECIPE_ES:      SAMPLE_RECIPE_ES
  };

  if (typeof window !== 'undefined') window.PC = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
