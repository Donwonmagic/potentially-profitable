/**
 * Shared portion-bridge — translate invoice comparable prices into
 * Plate Cost's per-portion AP-cost domain (Wave 10.2).
 *
 * Invoice rows carry `{perBaseUnit, baseUnit}` from
 * MID_PACK_PRICING.computeComparable: the price per smallest base
 * unit, where baseUnit ∈ {fl_oz, oz, lb, kg, l, ct, gal}.
 *
 * Plate Cost ingredient rows carry `{apPrice, apQty, apUnit}` and
 * a portion expressed as `{usedQty, usedUnit, yieldPercent}`.
 * Plate Cost canonicalizes weight to grams, volume to ml, count
 * to each.
 *
 * The bridge:
 *
 *   quoteAtPortion({comparable, portion, yieldPercent})
 *     → { apPrice, apQty, apUnit, epUnitCost, perPortionCost,
 *         conversionPath, compatible }
 *
 * Returns `compatible:false` rather than guessing densities when
 * the invoice's base-unit family doesn't match the portion's family
 * (e.g., $/lb beef vs portion in fl-oz). Caller surfaces "we don't
 * know the density of this ingredient — please enter manually."
 *
 * Privacy posture: pure function. No fetch, no localStorage, no DOM.
 */
(function (root) {
  'use strict';

  // Family map. Anything not in this list is treated as 'unknown'.
  // Conversion factor: how many of this unit equals one canonical
  // base unit for the family. Plate Cost canonical: weight=g,
  // volume=ml, count=each. We add lb / kg / fl_oz / l / gal because
  // invoice baseUnits use those.
  var UNIT_FAMILIES = {
    // Weight (canonical: gram)
    g:        { family: 'weight', canonical: 1 },
    kg:       { family: 'weight', canonical: 1000 },
    oz:       { family: 'weight', canonical: 28.349523125 },
    lb:       { family: 'weight', canonical: 453.59237 },
    lbs:      { family: 'weight', canonical: 453.59237 },
    // Volume (canonical: ml)
    ml:       { family: 'volume', canonical: 1 },
    l:        { family: 'volume', canonical: 1000 },
    liter:    { family: 'volume', canonical: 1000 },
    fl_oz:    { family: 'volume', canonical: 29.5735 },
    'fl-oz':  { family: 'volume', canonical: 29.5735 },
    'fl oz':  { family: 'volume', canonical: 29.5735 },
    floz:     { family: 'volume', canonical: 29.5735 },
    tsp:      { family: 'volume', canonical: 4.92892 },
    tbsp:     { family: 'volume', canonical: 14.7868 },
    cup:      { family: 'volume', canonical: 236.588 },
    pt:       { family: 'volume', canonical: 473.176 },
    pint:     { family: 'volume', canonical: 473.176 },
    qt:       { family: 'volume', canonical: 946.353 },
    quart:    { family: 'volume', canonical: 946.353 },
    gal:      { family: 'volume', canonical: 3785.41 },
    gallon:   { family: 'volume', canonical: 3785.41 },
    // Count (canonical: each)
    ct:       { family: 'count', canonical: 1 },
    ea:       { family: 'count', canonical: 1 },
    each:     { family: 'count', canonical: 1 }
  };

  function _normalizeUnitToken(u) {
    if (!u) return null;
    var s = String(u).toLowerCase().trim().replace(/\.$/, '');
    if (UNIT_FAMILIES[s]) return s;
    // Common aliases.
    if (s === 'pounds' || s === 'pound') return 'lb';
    if (s === 'ounces' || s === 'ounce') return 'oz';
    if (s === 'liters') return 'l';
    if (s === 'count')  return 'ct';
    return null;
  }
  function _familyOf(unit) {
    var k = _normalizeUnitToken(unit);
    return (k && UNIT_FAMILIES[k] && UNIT_FAMILIES[k].family) || null;
  }
  function _canonicalOf(unit) {
    var k = _normalizeUnitToken(unit);
    return (k && UNIT_FAMILIES[k] && UNIT_FAMILIES[k].canonical) || null;
  }

  // Cross-family safety check.
  function unitsCompatible(unitA, unitB) {
    var fa = _familyOf(unitA), fb = _familyOf(unitB);
    if (!fa || !fb) return false;
    return fa === fb;
  }

  // Convert a quantity from one unit to another within the same
  // family. Returns null on cross-family or unknown units.
  function convertQuantity(qty, fromUnit, toUnit) {
    if (typeof qty !== 'number' || !isFinite(qty)) return null;
    if (!unitsCompatible(fromUnit, toUnit)) return null;
    var fromCanonical = _canonicalOf(fromUnit);
    var toCanonical = _canonicalOf(toUnit);
    if (!fromCanonical || !toCanonical) return null;
    return (qty * fromCanonical) / toCanonical;
  }

  // The headline function. Inputs:
  //   comparable: { perBaseUnit: number, baseUnit: 'fl_oz'|'oz'|... }
  //   portion: { qty: number, unit: 'oz'|'cup'|... }   — Plate Cost
  //                                                     "used" qty/unit
  //   yieldPercent: number 0-1 (default 1)
  //
  // Output:
  //   { apPrice, apQty, apUnit,        — drop into computeIngredientCost
  //     epUnitCost,                    — pre-yield $/ap-unit
  //     perPortionCost,                — final $ per single portion
  //     conversionPath,                — debug string (e.g. 'lb→oz')
  //     compatible                     — true/false safety flag
  //   }
  function quoteAtPortion(args) {
    args = args || {};
    var comp = args.comparable;
    var portion = args.portion;
    var y = (typeof args.yieldPercent === 'number' && args.yieldPercent > 0)
              ? Math.min(args.yieldPercent, 5)  // cap absurd yields
              : 1.0;
    if (!comp || typeof comp.perBaseUnit !== 'number' || !comp.baseUnit) {
      return { compatible: false, reason: 'bad-comparable' };
    }
    if (!portion || typeof portion.qty !== 'number' || !portion.unit) {
      return { compatible: false, reason: 'bad-portion' };
    }
    if (!isFinite(comp.perBaseUnit) || comp.perBaseUnit <= 0) {
      return { compatible: false, reason: 'non-positive-price' };
    }
    if (!isFinite(portion.qty) || portion.qty < 0) {
      return { compatible: false, reason: 'invalid-qty' };
    }
    if (!unitsCompatible(comp.baseUnit, portion.unit)) {
      return {
        compatible: false,
        reason: 'cross-family',
        invoiceFamily: _familyOf(comp.baseUnit),
        portionFamily: _familyOf(portion.unit),
        conversionPath: comp.baseUnit + '→' + portion.unit
      };
    }
    // Convert one base-unit's worth into the portion's unit, so we
    // know "$X per N of portion-unit." Then divide to get $/portion-unit.
    // Example: $4.00/lb beef, portion 4 oz, yield 0.75
    //   1 lb = 16 oz → $4.00 per 16 oz → $0.25/oz (raw)
    //   Yield 0.75 → effective EP cost = $0.25 / 0.75 = $0.333/oz
    //   Portion 4 oz → $0.333 × 4 = $1.33
    var oneBaseInPortionUnit = convertQuantity(1, comp.baseUnit, portion.unit);
    if (!oneBaseInPortionUnit || oneBaseInPortionUnit <= 0) {
      return { compatible: false, reason: 'conversion-failed' };
    }
    var apUnitPriceRaw = comp.perBaseUnit / oneBaseInPortionUnit;  // $/portionUnit (AP)
    var epUnitCost = apUnitPriceRaw / y;
    var perPortionCost = epUnitCost * portion.qty;
    return {
      compatible:     true,
      apPrice:        +apUnitPriceRaw.toFixed(6),
      apQty:          1,
      apUnit:         portion.unit,
      epUnitCost:     +epUnitCost.toFixed(6),
      perPortionCost: +perPortionCost.toFixed(4),
      yieldApplied:   y,
      conversionPath: comp.baseUnit + '→' + portion.unit
    };
  }

  var api = {
    quoteAtPortion:    quoteAtPortion,
    unitsCompatible:   unitsCompatible,
    convertQuantity:   convertQuantity,
    UNIT_FAMILIES:     UNIT_FAMILIES,
    _normalizeUnitToken: _normalizeUnitToken,
    _familyOf:         _familyOf
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinPortionBridge = api;
  if (root) root.MuntinPortionBridge = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
