/**
 * plate-advice.ts — Ledger port of storefront tools/_shared/plate-advice.js.
 *
 * PARITY CONTRACT: faithful, behavior-identical translation. The 11 test
 * vectors in tests/plate-advice.test.ts are copied verbatim from the
 * storefront suite and MUST pass unchanged — that is the guarantee that
 * the free tool and Ledger give the same recommendation for the same input.
 *
 * The recommendation engine: turns cost numbers into a decision an owner
 * can act on in five seconds. "No number ships naked" — every figure leaves
 * paired with a plain-language meaning and exactly ONE recommended action,
 * the rest of the fork (re-price / re-portion / absorb) behind it. Pure,
 * deterministic, no LLM, no network. Money in integer cents end to end.
 */

export const DEFAULT_TARGET = 0.30;   // owner's goal food-cost %, overridable
const WATCH_BAND = 0.02;              // within 2 pts over target = "watch", not "act"

type Locale = 'en' | 'es';
type Convention = 'whole' | 'ninetyfive' | 'ninetynine';

// ---- money helpers (integer cents) ----------------------------------
function dollars(cents: number): string { return '$' + (Math.round(cents) / 100).toFixed(2); }
function dollarsRound(cents: number): string { return '$' + Math.round(cents / 100); }
function pct(p: number): string { return Math.round(p * 100) + '%'; }

// ---- charm rounding to the menu's own convention --------------------
export function detectConvention(menuPricesCents?: number[]): Convention {
  if (!Array.isArray(menuPricesCents) || !menuPricesCents.length) return 'whole';
  const tally = { whole: 0, ninetyfive: 0, ninetynine: 0, other: 0 };
  menuPricesCents.forEach((c) => {
    if (typeof c !== 'number' || !isFinite(c)) return;
    const end = ((Math.round(c) % 100) + 100) % 100;
    if (end === 0) tally.whole++;
    else if (end === 95) tally.ninetyfive++;
    else if (end === 99) tally.ninetynine++;
    else tally.other++;
  });
  let best: Convention = 'whole', bestN = -1;
  (['whole', 'ninetyfive', 'ninetynine'] as Convention[]).forEach((k) => {
    if ((tally as Record<string, number>)[k] > bestN) { bestN = (tally as Record<string, number>)[k]; best = k; }
  });
  return bestN > 0 ? best : 'whole';
}

export function charmRoundUp(cents: number, convention: Convention): number {
  cents = Math.max(0, Math.ceil(cents));
  if (convention === 'ninetyfive') {
    let k95 = Math.ceil((cents - 95) / 100);
    if (k95 < 0) k95 = 0;
    return k95 * 100 + 95;
  }
  if (convention === 'ninetynine') {
    let k99 = Math.ceil((cents - 99) / 100);
    if (k99 < 0) k99 = 0;
    return k99 * 100 + 99;
  }
  return Math.ceil(cents / 100) * 100; // whole dollar
}

function tt(locale: Locale, en: string, es: string): string { return locale === 'es' ? es : en; }

export interface PriceMove {
  addedCostCentsPerPlate?: number;
  ingredient?: string;
  vendor?: string;
  pctMove?: number;
  seasonal?: boolean;
}

export interface AdviceInput {
  plateCostCents: number;
  menuPriceCents?: number | null;
  targetFoodCostPct?: number;
  menuPricesCents?: number[];
  coversPerWeek?: number | null;
  priceMove?: PriceMove | null;
  confidence?: 'high' | 'medium' | 'low';
  locale?: Locale;
  itemName?: string;
}

export interface AdviceOption {
  kind: 'reprice' | 'reportion' | 'absorb';
  label: string;
  detail: string;
  newPriceCents?: number;
  trimPct?: number;
}

export interface AdviceResult {
  tier: 'healthy' | 'watch' | 'over_target' | 'underwater' | 'hike' | 'price_needed' | 'insufficient';
  itemName: string;
  foodCostPct: number | null;
  contributionCents: number | null;
  targetFoodCostPct: number;
  headline: string;
  options: AdviceOption[];
  confidence: 'high' | 'medium' | 'low';
  receipt: { plateCostCents: number; menuPriceCents: number | null; targetFoodCostPct: number; convention: Convention };
}

export function advise(input: AdviceInput): AdviceResult {
  input = input || ({} as AdviceInput);
  const locale: Locale = input.locale === 'es' ? 'es' : 'en';
  const name = (input.itemName || '').toString().trim() || tt(locale, 'this dish', 'este platillo');
  const plate = Math.round(input.plateCostCents);
  const menu = (input.menuPriceCents != null && isFinite(input.menuPriceCents)) ? Math.round(input.menuPriceCents) : null;
  const target = (typeof input.targetFoodCostPct === 'number' && input.targetFoodCostPct > 0 && input.targetFoodCostPct < 1)
    ? input.targetFoodCostPct : DEFAULT_TARGET;
  const covers = (typeof input.coversPerWeek === 'number' && input.coversPerWeek > 0) ? input.coversPerWeek : null;
  const convention = detectConvention(input.menuPricesCents);
  const confidence = (input.confidence === 'low' || input.confidence === 'medium') ? input.confidence : 'high';
  const move = input.priceMove || null;

  const result: AdviceResult = {
    tier: 'healthy',
    itemName: name,
    foodCostPct: null,
    contributionCents: null,
    targetFoodCostPct: target,
    headline: '',
    options: [],
    confidence,
    receipt: { plateCostCents: plate, menuPriceCents: menu, targetFoodCostPct: target, convention },
  };

  if (!isFinite(plate) || plate <= 0) {
    result.tier = 'insufficient';
    result.headline = tt(locale,
      'Add this dish’s ingredients so Bench can cost it.',
      'Agrega los ingredientes de este platillo para poder costearlo.');
    return result;
  }

  const targetPriceRaw = plate / target;
  const repriceCents = charmRoundUp(targetPriceRaw, convention);

  function repriceOption(): AdviceOption {
    const newPct = repriceCents > 0 ? plate / repriceCents : null;
    return {
      kind: 'reprice',
      newPriceCents: repriceCents,
      label: tt(locale, 'Raise it to ' + dollars(repriceCents), 'Súbelo a ' + dollars(repriceCents)),
      detail: tt(locale,
        'Hits your ' + pct(target) + ' goal' + (newPct ? ' (' + pct(newPct) + ' food cost)' : '') + '.',
        'Llega a tu meta de ' + pct(target) + (newPct ? ' (' + pct(newPct) + ' de costo)' : '') + '.'),
    };
  }
  function reportionOption(): AdviceOption | null {
    if (menu == null) return null;
    const targetCost = Math.round(menu * target);
    const trimCents = plate - targetCost;
    if (trimCents <= 0) return null;
    const trimPct = trimCents / plate;
    const driver = (move && move.ingredient) ? move.ingredient : tt(locale, 'the priciest ingredient', 'el ingrediente más caro');
    return {
      kind: 'reportion',
      trimPct: +trimPct.toFixed(3),
      label: tt(locale, 'Trim ' + pct(trimPct) + ' to hold the price', 'Recorta ' + pct(trimPct) + ' para mantener el precio'),
      detail: tt(locale,
        'Cut about ' + dollars(trimCents) + '/plate of cost (start with ' + driver + ') to keep ' + dollars(menu) + ' and hit your goal.',
        'Quita ~' + dollars(trimCents) + ' de costo por platillo (empieza con ' + driver + ') para mantener ' + dollars(menu) + ' y llegar a tu meta.'),
    };
  }
  function absorbOption(): AdviceOption {
    return {
      kind: 'absorb',
      label: tt(locale, 'Hold the price for now', 'Mantén el precio por ahora'),
      detail: tt(locale,
        'Keep it where it is and accept the thinner margin — fine for a draw or a traffic-builder.',
        'Déjalo igual y acepta el margen más delgado — está bien para un gancho o platillo de tráfico.'),
    };
  }

  // -------- price not set yet --------
  if (menu == null) {
    result.tier = 'price_needed';
    result.headline = tt(locale,
      name + ' costs you ' + dollars(plate) + ' to make. To hit your ' + pct(target) + ' goal, price it at ' + dollars(repriceCents) + '.',
      name + ' te cuesta ' + dollars(plate) + ' preparar. Para tu meta de ' + pct(target) + ', ponle ' + dollars(repriceCents) + '.');
    result.options = [repriceOption()];
    return result;
  }

  const foodCostPct = plate / menu;
  const contribution = menu - plate;
  result.foodCostPct = +foodCostPct.toFixed(4);
  result.contributionCents = contribution;

  function weekly(centsPerPlate: number): number | null {
    if (!covers || centsPerPlate <= 0) return null;
    return Math.round(centsPerPlate * covers);
  }
  function feltLoss(centsPerPlate: number): string {
    const w = weekly(centsPerPlate);
    if (w != null) return tt(locale, dollarsRound(w) + '/week', dollarsRound(w) + '/semana');
    return tt(locale, dollars(centsPerPlate) + '/plate', dollars(centsPerPlate) + ' por platillo');
  }

  // -------- a price hike just hit this dish (blame the price) --------
  if (move && typeof move.addedCostCentsPerPlate === 'number' && move.addedCostCentsPerPlate > 0) {
    const added = Math.round(move.addedCostCentsPerPlate);
    const ing = move.ingredient || tt(locale, 'An ingredient', 'Un ingrediente');
    const moveStr = (typeof move.pctMove === 'number') ? ' (' + pct(move.pctMove) + ')' : '';
    result.tier = 'hike';
    result.headline = tt(locale,
      ing + ' went up' + moveStr + ' — it’s costing you ' + feltLoss(added) + ' on ' + name + '.',
      'Subió ' + ing + moveStr + ' — te está costando ' + feltLoss(added) + ' en ' + name + '.');
    const opts: (AdviceOption | null)[] = [];
    if (move.seasonal) {
      opts.push(absorbOption());
      opts.push(reportionOption());
      opts.push(repriceOption());
      result.headline += tt(locale,
        ' Looks seasonal — it should ease, so holding is usually right.',
        ' Parece de temporada — debería bajar, así que mantenerlo suele ser lo correcto.');
    } else {
      if (foodCostPct > target + WATCH_BAND) opts.push(repriceOption());
      const rp = reportionOption(); if (rp) opts.push(rp);
      if (foodCostPct <= target + WATCH_BAND) opts.push(repriceOption());
      opts.push(absorbOption());
    }
    result.options = opts.filter(Boolean) as AdviceOption[];
    return result;
  }

  // -------- underwater: costs more than it sells for --------
  if (contribution <= 0) {
    result.tier = 'underwater';
    const lossPerPlate = Math.max(1, -contribution);
    result.headline = tt(locale,
      'Heads up — ' + name + ' costs more to make than you charge. You lose about ' + feltLoss(lossPerPlate) + '.',
      'Ojo — ' + name + ' cuesta más de preparar que lo que cobras. Pierdes ~' + feltLoss(lossPerPlate) + '.');
    result.options = [repriceOption(), reportionOption(), absorbOption()].filter(Boolean) as AdviceOption[];
    return result;
  }

  // -------- over the owner's target --------
  if (foodCostPct > target + WATCH_BAND) {
    const gapPerPlate = Math.max(0, plate - Math.round(menu * target));
    result.tier = 'over_target';
    result.headline = tt(locale,
      name + ' eats ' + pct(foodCostPct) + ' of every dollar it earns — your goal is ' + pct(target) + '. Closing that gap is about ' + feltLoss(gapPerPlate) + '.',
      name + ' se lleva ' + pct(foodCostPct) + ' de cada dólar — tu meta es ' + pct(target) + '. Cerrar esa brecha son ~' + feltLoss(gapPerPlate) + '.');
    result.options = [repriceOption(), reportionOption(), absorbOption()].filter(Boolean) as AdviceOption[];
    return result;
  }

  // -------- watch band: a little over, worth a glance --------
  if (foodCostPct > target) {
    result.tier = 'watch';
    result.headline = tt(locale,
      name + ' is running a touch over goal (' + pct(foodCostPct) + ' vs ' + pct(target) + '). Keeps ' + dollars(contribution) + '/plate. Worth a glance, no rush.',
      name + ' está un poco arriba de tu meta (' + pct(foodCostPct) + ' vs ' + pct(target) + '). Te deja ' + dollars(contribution) + ' por platillo. Échale un ojo, sin prisa.');
    result.options = [absorbOption(), repriceOption()].filter(Boolean) as AdviceOption[];
    return result;
  }

  // -------- healthy: tell them they're fine (silence is a feature) --------
  result.tier = 'healthy';
  result.headline = tt(locale,
    name + ' costs you ' + dollars(plate) + ' and keeps ' + dollars(contribution) + '/plate (' + pct(foodCostPct) + ' food cost). Healthy — nothing to do.',
    name + ' te cuesta ' + dollars(plate) + ' y te deja ' + dollars(contribution) + ' por platillo (' + pct(foodCostPct) + ' de costo). Sano — nada que hacer.');
  result.options = [];
  return result;
}
