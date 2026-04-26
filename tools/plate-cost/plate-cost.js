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

    var apPrice = Number(row.apPrice);
    var apQty   = Number(row.apQty);
    var usedQty = Number(row.usedQty);

    if (!isFinite(apPrice) || !isFinite(apQty) || !isFinite(usedQty) ||
        apPrice < 0 || apQty <= 0 || usedQty < 0) {
      out.warning = 'invalid-numbers';
      return out;
    }

    // Resolve yield. null → lookup; missing → default to 1.0 with hint.
    var y = (row.yieldPercent == null || row.yieldPercent === '')
      ? lookupYield(row.ingredient)
      : Number(row.yieldPercent);
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
    if (!isFinite(Number(recipe.portions)) || Number(recipe.portions) <= 0) {
      errors.push({ field: 'portions', message: 'Portions must be a positive number.' });
    }
    (recipe.rows || []).forEach(function(row, idx){
      var apPrice = Number(row.apPrice);
      var apQty   = Number(row.apQty);
      var usedQty = Number(row.usedQty);
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
  var SAMPLE_RECIPE_ES = {
    name:     'Cacio e pepe',
    portions: 1,
    rows: [
      { ingredient: 'Tonnarelli (pasta seca)', apPrice: 4.50, apQty: 1,    apUnit: 'lb',
        yieldPercent: 1.00, usedQty: 4,   usedUnit: 'oz' },
      { ingredient: 'Pecorino Romano',          apPrice: 18,   apQty: 1,    apUnit: 'lb',
        yieldPercent: 0.95, usedQty: 1.5, usedUnit: 'oz' },
      { ingredient: 'Pimienta negra en grano', apPrice: 12,   apQty: 8,    apUnit: 'oz',
        yieldPercent: 1.00, usedQty: 0.05, usedUnit: 'oz' },
      { ingredient: 'Aceite de oliva',          apPrice: 24,   apQty: 1,    apUnit: 'l',
        yieldPercent: 1.00, usedQty: 1,    usedUnit: 'tbsp' },
      { ingredient: 'Sal marina',               apPrice: 6,    apQty: 26,   apUnit: 'oz',
        yieldPercent: 1.00, usedQty: 0.1,  usedUnit: 'oz' }
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
    validateRecipe:        validateRecipe,
    convertUnits:          convertUnits,
    lookupYield:           lookupYield,
    normalizeUnit:         normalizeUnit,
    parseTabularText:      parseTabularText,
    normalizeYieldInput:   normalizeYieldInput,
    bucketIngredientCount: bucketIngredientCount,
    bucketYieldUsage:      bucketYieldUsage,
    bucketPlateCostBand:   bucketPlateCostBand,
    YIELD_TABLE:           YIELD_TABLE,
    UNITS:                 UNITS,
    FOOD_COST_TARGETS:     FOOD_COST_TARGETS,
    SAMPLE_RECIPE_EN:      SAMPLE_RECIPE_EN,
    SAMPLE_RECIPE_ES:      SAMPLE_RECIPE_ES
  };

  if (typeof window !== 'undefined') window.PC = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
