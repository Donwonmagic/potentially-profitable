/**
 * portion-bridge.ts — Ledger port of storefront tools/_shared/portion-bridge.js.
 *
 * PARITY CONTRACT: this is a faithful, math-identical translation of the
 * storefront module (Wave 10.2). If you change the unit factors or the
 * quoteAtPortion arithmetic here, change them in the storefront source in
 * the same commit, or the free Plate Cost tool and Ledger will disagree.
 *
 * Translates an invoice comparable price into Plate Cost's per-portion
 * AP-cost domain. Returns { compatible:false } rather than guessing
 * densities when the invoice's base-unit family doesn't match the
 * portion's family ($/lb beef vs a portion in fl-oz). Pure function.
 */

export interface UnitFamily { family: 'weight' | 'volume' | 'count'; canonical: number; }

// Conversion factor: how many of this unit equal one canonical base unit.
// Canonical: weight=g, volume=ml, count=each.
export const UNIT_FAMILIES: Record<string, UnitFamily> = {
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
  each:     { family: 'count', canonical: 1 },
};

export function normalizeUnitToken(u?: string | null): string | null {
  if (!u) return null;
  const s = String(u).toLowerCase().trim().replace(/\.$/, '');
  if (UNIT_FAMILIES[s]) return s;
  if (s === 'pounds' || s === 'pound') return 'lb';
  if (s === 'ounces' || s === 'ounce') return 'oz';
  if (s === 'liters') return 'l';
  if (s === 'count')  return 'ct';
  return null;
}

export function familyOf(unit?: string | null): UnitFamily['family'] | null {
  const k = normalizeUnitToken(unit);
  return (k && UNIT_FAMILIES[k] && UNIT_FAMILIES[k].family) || null;
}

function canonicalOf(unit?: string | null): number | null {
  const k = normalizeUnitToken(unit);
  return (k && UNIT_FAMILIES[k] && UNIT_FAMILIES[k].canonical) || null;
}

export function unitsCompatible(unitA?: string | null, unitB?: string | null): boolean {
  const fa = familyOf(unitA), fb = familyOf(unitB);
  if (!fa || !fb) return false;
  return fa === fb;
}

export function convertQuantity(qty: number, fromUnit: string, toUnit: string): number | null {
  if (typeof qty !== 'number' || !isFinite(qty)) return null;
  if (!unitsCompatible(fromUnit, toUnit)) return null;
  const fromCanonical = canonicalOf(fromUnit);
  const toCanonical = canonicalOf(toUnit);
  if (!fromCanonical || !toCanonical) return null;
  return (qty * fromCanonical) / toCanonical;
}

export interface Comparable { perBaseUnit: number; baseUnit: string; }
export interface Portion { qty: number; unit: string; }
export interface QuoteArgs { comparable: Comparable; portion: Portion; yieldPercent?: number; }
export interface QuoteResult {
  compatible: boolean;
  reason?: string;
  apPrice?: number;
  apQty?: number;
  apUnit?: string;
  epUnitCost?: number;
  perPortionCost?: number;
  yieldApplied?: number;
  conversionPath?: string;
  invoiceFamily?: UnitFamily['family'] | null;
  portionFamily?: UnitFamily['family'] | null;
}

/**
 * The headline function. $4.00/lb beef, portion 4 oz, yield 0.75:
 *   1 lb = 16 oz → $0.25/oz raw → ÷0.75 = $0.333/oz EP → ×4 = $1.33/portion.
 */
export function quoteAtPortion(args: QuoteArgs): QuoteResult {
  args = args || ({} as QuoteArgs);
  const comp = args.comparable;
  const portion = args.portion;
  const y = (typeof args.yieldPercent === 'number' && args.yieldPercent > 0)
    ? Math.min(args.yieldPercent, 5)   // cap absurd yields
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
      invoiceFamily: familyOf(comp.baseUnit),
      portionFamily: familyOf(portion.unit),
      conversionPath: comp.baseUnit + '→' + portion.unit,
    };
  }
  const oneBaseInPortionUnit = convertQuantity(1, comp.baseUnit, portion.unit);
  if (!oneBaseInPortionUnit || oneBaseInPortionUnit <= 0) {
    return { compatible: false, reason: 'conversion-failed' };
  }
  const apUnitPriceRaw = comp.perBaseUnit / oneBaseInPortionUnit;  // $/portionUnit (AP)
  const epUnitCost = apUnitPriceRaw / y;
  const perPortionCost = epUnitCost * portion.qty;
  return {
    compatible: true,
    apPrice: +apUnitPriceRaw.toFixed(6),
    apQty: 1,
    apUnit: portion.unit,
    epUnitCost: +epUnitCost.toFixed(6),
    perPortionCost: +perPortionCost.toFixed(4),
    yieldApplied: y,
    conversionPath: comp.baseUnit + '→' + portion.unit,
  };
}
