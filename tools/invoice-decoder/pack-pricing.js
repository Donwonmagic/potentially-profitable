/**
 * Invoice Decoder — pack-aware unit pricing (domain expert layer).
 *
 * Restaurant purchasers don't compare "$42 per case." They compare
 * "$0.146 per fluid ounce" or "$2.90 per pound." A 24/12oz case
 * from Vendor A and a 30/12oz case from Vendor B aren't apples-to-
 * apples even when both label themselves "1 case of beer." This
 * module converts each parsed row to a canonical comparable price
 * via the pack notation that parse.js already extracts.
 *
 * Public API:
 *   computeComparable(row) → null OR {
 *     perBaseUnit:    Number,          // $ per canonical unit
 *     baseUnit:       String,          // 'fl_oz' | 'oz' | 'lb' | 'kg' | 'ct' | 'gal' | 'l'
 *     totalQuantity:  Number,          // total units in the row
 *     basis:          String           // 'pack' | 'weight' | 'unit-price'
 *   }
 *   formatComparable(comparable, opts?) → display string ("$0.146/oz")
 *
 * Conservative philosophy:
 *   - When pack is unambiguous (24/12OZ → 288 fl oz total), compute
 *     the cleanest comparable price.
 *   - When pack is ambiguous (just "24CT" with no per-unit weight),
 *     fall back to per-count or skip — never guess.
 *   - Pattern E rows (weight + count) compute via row.weight ×
 *     row.qty since parse.js already separated them.
 *   - When a row has neither pack info nor weight, return null.
 *     Downstream code falls back to raw row.unitPrice.
 *
 * Why this matters operationally:
 *   - Cross-vendor purchasing decisions: operator sees the same
 *     SKU stem priced at different per-oz / per-lb across two
 *     vendors and can switch suppliers with confidence.
 *   - Honest drift detection: when the case size changes ("12pk
 *     → 18pk same brand"), per-case price drift is noise; per-oz
 *     price drift is the real signal.
 *   - Contract-price anchoring: operators set contracts in the
 *     unit they actually negotiated ("$3.20/lb chicken thigh"
 *     not "$32/case").
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------
  // Unit conversion table
  //
  // We canonicalize to one of: fl_oz, oz, lb, ct, gal, l, kg.
  // The choice of base unit per category is what restaurant
  // purchasing pros actually use:
  //   - liquids: fl_oz (US) or l (metric); we use fl_oz when the
  //     pack expresses container volume in oz/ml, l when in l.
  //   - dry weight: lb (US); kg only when explicitly metric.
  //   - count-priced (eggs, plates, cups): ct.
  // ---------------------------------------------------------------
  var UNIT_FAMILY = {
    // Liquid volume (fluid ounces base for US, liters for metric)
    'fl_oz':     { family: 'liquid_us',     toBase: 1 },
    'fluid_oz':  { family: 'liquid_us',     toBase: 1 },
    'fl oz':     { family: 'liquid_us',     toBase: 1 },
    'gal':       { family: 'liquid_us',     toBase: 128 },     // 1 gal = 128 fl oz
    'gallon':    { family: 'liquid_us',     toBase: 128 },
    'qt':        { family: 'liquid_us',     toBase: 32 },      // 1 qt = 32 fl oz
    'quart':     { family: 'liquid_us',     toBase: 32 },
    'pt':        { family: 'liquid_us',     toBase: 16 },      // 1 pt = 16 fl oz
    'pint':      { family: 'liquid_us',     toBase: 16 },

    'l':         { family: 'liquid_metric', toBase: 1 },
    'liter':     { family: 'liquid_metric', toBase: 1 },
    'litre':     { family: 'liquid_metric', toBase: 1 },
    'ml':        { family: 'liquid_metric', toBase: 0.001 },

    // Dry weight (pound base)
    'lb':        { family: 'weight_us',     toBase: 1 },
    'lbs':       { family: 'weight_us',     toBase: 1 },
    'oz':        { family: 'weight_us',     toBase: 1/16 },    // 1 oz = 1/16 lb
    'pound':     { family: 'weight_us',     toBase: 1 },

    // Dry weight (metric)
    'kg':        { family: 'weight_metric', toBase: 1 },
    'g':         { family: 'weight_metric', toBase: 0.001 },

    // Count
    'ct':        { family: 'count',         toBase: 1 },
    'count':     { family: 'count',         toBase: 1 },
    'ea':        { family: 'count',         toBase: 1 },
    'each':      { family: 'count',         toBase: 1 },
    'pk':        { family: 'count',         toBase: 1 },
    'pack':      { family: 'count',         toBase: 1 },

    // Container (treated as count when no inner-unit info)
    'cs':        { family: 'count',         toBase: 1 },
    'case':      { family: 'count',         toBase: 1 },
    'box':       { family: 'count',         toBase: 1 },
    'bx':        { family: 'count',         toBase: 1 },
    'sleeve':    { family: 'count',         toBase: 1 },
    'jug':       { family: 'count',         toBase: 1 },
    'bag':       { family: 'count',         toBase: 1 },
    'bunch':     { family: 'count',         toBase: 1 },
    'dozen':     { family: 'count',         toBase: 12 },
    'doz':       { family: 'count',         toBase: 12 },

    // #-can placeholder. The actual per-can volume depends on the
    // size enumeration (#10, #5, #2.5, etc.) and is looked up via
    // HASH_CAN_TOBASE — NOT computed via toBase × unitSize.
    '#':         { family: 'liquid_us',     toBase: 1 }
  };

  // Foodservice #-can size table. Standard convention: a #10 can
  // holds ~110 fl oz; other sizes follow this enumeration. unitSize
  // in the pack notation IS the # number, NOT a multiplier.
  var HASH_CAN_TOBASE = {
    '10':  110,    // #10 (the common foodservice big can)
    '5':   56,
    '2.5': 27,
    '2':   19,
    '1':   11,
    '300': 14
  };

  // Canonical aliases for unit normalization. Folded in BEFORE the
  // direct UNIT_FAMILY lookup so plurals + period-suffixed forms
  // resolve to their canonical key.
  var UNIT_ALIASES = {
    'lbs':       'lb',
    'pound':     'lb',
    'pounds':    'lb',
    'ounce':     'oz',
    'ounces':    'oz',
    'gallons':   'gal',
    'quarts':    'qt',
    'pints':     'pt',
    'liters':    'l',
    'litres':    'l',
    'kilograms': 'kg',
    'kilogram':  'kg',
    'grams':     'g',
    'gram':      'g',
    'fluid oz':  'fl_oz',
    'fl oz':     'fl_oz'
  };

  // The display base unit per family. When a row's unit family is
  // identified, we report the comparable price in this unit.
  var BASE_UNIT_BY_FAMILY = {
    'liquid_us':     'fl_oz',
    'liquid_metric': 'l',
    'weight_us':     'lb',
    'weight_metric': 'kg',
    'count':         'ct'
  };

  // ---------------------------------------------------------------
  // Unit normalization
  // ---------------------------------------------------------------
  function normalizeUnitToken(u) {
    if (!u) return null;
    var t = String(u).toLowerCase().trim().replace(/\.$/, '');
    // Aliases first — they fold plurals + period-suffixed forms to
    // the canonical key. This way `normalizeUnitToken('LBS') === 'lb'`
    // (not 'lbs') so callers see a consistent canonical form.
    if (UNIT_ALIASES[t]) return UNIT_ALIASES[t];
    if (UNIT_FAMILY[t])  return t;
    return null;
  }

  // Convert a quantity from `unit` to the family's base unit.
  // Returns { qtyInBase, family } or null when unit unrecognized.
  function toBaseQuantity(qty, unit) {
    var u = normalizeUnitToken(unit);
    if (!u) return null;
    var def = UNIT_FAMILY[u];
    if (!def) return null;
    return { qtyInBase: qty * def.toBase, family: def.family };
  }

  // ---------------------------------------------------------------
  // Comparable price computation
  // ---------------------------------------------------------------
  //
  // Strategy per row, in order:
  //
  //   1. Pack-aware: row.pack carries { caseQty, unitSize, unit }
  //      from parse.extractPack. Examples:
  //         "STELLA 24/12OZ CASE $42"  →  caseQty=24, unitSize=12, unit='oz'
  //         "TOMATO PASTE 6#10 $48"    →  caseQty=6, unitSize=10, unit='#'
  //      Total inner volume = caseQty × unitSize × (qty cases)
  //      The 'oz' inside a pack like 24/12OZ means fl_oz for liquids
  //      OR weight oz for dry goods. We disambiguate via the row's
  //      category if available; otherwise default to fl_oz (the more
  //      common foodservice case-pack convention).
  //
  //   2. Pattern-E weight + count: row.weight + row.weightUnit +
  //      row.qty. Example: "GROUND CHUCK 10LB 2CS" has weight=2,
  //      weightUnit='ct', qty=...  Wait — actually the parse.js
  //      Pattern E extracts weight=10, weightUnit='lb', qty=2,
  //      unit='ct'. Total weight = 10 × 2 = 20 lb.
  //
  //   3. Plain unit-priced: when row.unit is recognized (lb/oz/gal),
  //      just normalize.
  //
  //   4. Otherwise: null. Caller falls back to raw row.unitPrice.

  function computeComparable(row) {
    if (!row || (typeof row.lineTotal !== 'number' && typeof row.unitPrice !== 'number')) return null;
    var lineTotal = (typeof row.lineTotal === 'number') ? row.lineTotal : null;
    var qty = (typeof row.qty === 'number' && row.qty > 0) ? row.qty : 1;
    if (lineTotal == null || lineTotal <= 0) return null;

    // --- Path 1: pack-aware ---
    if (row.pack && typeof row.pack.caseQty === 'number' && row.pack.unit) {
      var packUnit = normalizeUnitToken(row.pack.unit);

      // Special case: #-cans. The unitSize in the pack notation is
      // the #-size enumeration (10 → #10 = 110 fl oz, 5 → #5, etc.),
      // NOT a multiplier. Total volume = caseQty × per-can-volume.
      if (packUnit === '#') {
        var sizeKey = String(row.pack.unitSize);
        var perCan = HASH_CAN_TOBASE[sizeKey] || HASH_CAN_TOBASE['10'];   // default #10
        var totalHash = row.pack.caseQty * perCan * qty;
        if (totalHash > 0) {
          return {
            perBaseUnit:   +(lineTotal / totalHash).toFixed(6),
            baseUnit:      'fl_oz',
            totalQuantity: +totalHash.toFixed(3),
            basis:         'pack'
          };
        }
      }

      if (packUnit && packUnit !== '#' && typeof row.pack.unitSize === 'number') {
        // For 'oz' specifically: disambiguate liquid vs weight by
        // the row's category. Liquids (beverage / cleaning that
        // ships in liquid form) → fl_oz. Dry goods / herbs-spices
        // / paper → weight oz. Default: liquid (foodservice case-
        // packs are predominantly bottled/canned liquids).
        if (packUnit === 'oz') {
          if (row.category === 'beverage') packUnit = 'fl_oz';
          else if (row.category === 'dry-goods' || row.category === 'herbs-spices') packUnit = 'oz';
          else packUnit = 'fl_oz';
        }
        var conv = toBaseQuantity(row.pack.unitSize, packUnit);
        if (conv) {
          // Total inner-unit volume across the entire line:
          //   caseQty × unitSize-in-base × number-of-cases-bought
          var totalInBase = row.pack.caseQty * conv.qtyInBase * qty;
          if (totalInBase > 0) {
            var perBase = lineTotal / totalInBase;
            return {
              perBaseUnit:   +perBase.toFixed(6),
              baseUnit:      BASE_UNIT_BY_FAMILY[conv.family],
              totalQuantity: +totalInBase.toFixed(3),
              basis:         'pack'
            };
          }
        }
      }
    }

    // --- Path 2: weight + count (Pattern E rows) ---
    if (typeof row.weight === 'number' && row.weight > 0 && row.weightUnit) {
      var conv2 = toBaseQuantity(row.weight, row.weightUnit);
      if (conv2 && (conv2.family === 'weight_us' || conv2.family === 'weight_metric')) {
        var totalWeight = conv2.qtyInBase * qty;
        if (totalWeight > 0) {
          return {
            perBaseUnit:   +(lineTotal / totalWeight).toFixed(6),
            baseUnit:      BASE_UNIT_BY_FAMILY[conv2.family],
            totalQuantity: +totalWeight.toFixed(3),
            basis:         'weight'
          };
        }
      }
    }

    // --- Path 3: plain unit-priced (lb / kg / gal / etc.) ---
    var rowUnit = normalizeUnitToken(row.unit);
    if (rowUnit && UNIT_FAMILY[rowUnit].family !== 'count') {
      var conv3 = toBaseQuantity(qty, rowUnit);
      if (conv3 && conv3.qtyInBase > 0) {
        return {
          perBaseUnit:   +(lineTotal / conv3.qtyInBase).toFixed(6),
          baseUnit:      BASE_UNIT_BY_FAMILY[conv3.family],
          totalQuantity: +conv3.qtyInBase.toFixed(3),
          basis:         'unit-price'
        };
      }
    }

    return null;
  }

  // ---------------------------------------------------------------
  // Display helpers
  // ---------------------------------------------------------------
  function formatComparable(c, opts) {
    if (!c || typeof c.perBaseUnit !== 'number') return '';
    opts = opts || {};
    var locale = opts.locale || 'en';
    var p = c.perBaseUnit;
    var unitDisplay = ({
      'fl_oz': locale === 'es' ? 'oz líq' : 'fl oz',
      'oz':    'oz',
      'lb':    'lb',
      'kg':    'kg',
      'ct':    locale === 'es' ? 'unidad' : 'ct',
      'gal':   'gal',
      'l':     locale === 'es' ? 'litro' : 'l'
    })[c.baseUnit] || c.baseUnit;
    // Pretty-print: small fractions get 4 decimals, larger get 2-3.
    var precision = (p < 0.1) ? 4 : (p < 1 ? 3 : 2);
    return '$' + p.toFixed(precision) + '/' + unitDisplay;
  }

  // Compare two comparable-price records. Returns null when the
  // base units differ (you can't compare $/lb to $/fl_oz). Otherwise
  // returns the % delta of `current` vs `baseline` in the shared
  // unit family.
  function compareComparables(current, baseline) {
    if (!current || !baseline) return null;
    if (current.baseUnit !== baseline.baseUnit) return null;
    if (!baseline.perBaseUnit || baseline.perBaseUnit <= 0) return null;
    return {
      deltaPct: +(((current.perBaseUnit - baseline.perBaseUnit) / baseline.perBaseUnit) * 100).toFixed(1),
      direction: current.perBaseUnit > baseline.perBaseUnit ? 'up' :
                 (current.perBaseUnit < baseline.perBaseUnit ? 'down' : 'flat')
    };
  }

  var api = {
    computeComparable:   computeComparable,
    formatComparable:    formatComparable,
    compareComparables:  compareComparables,
    normalizeUnitToken:  normalizeUnitToken,
    toBaseQuantity:      toBaseQuantity,
    UNIT_FAMILY:         UNIT_FAMILY,
    BASE_UNIT_BY_FAMILY: BASE_UNIT_BY_FAMILY
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_PACK_PRICING = api;
})(typeof window !== 'undefined' ? window : null);
