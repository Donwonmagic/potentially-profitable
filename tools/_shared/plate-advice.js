/**
 * Shared plate-advice — turn plate-cost numbers into a decision an owner
 * can act on in five seconds.
 *
 * "No number ships naked": every figure leaves paired with a plain-language
 * meaning and exactly ONE recommended action, with the rest of the fork
 * (re-price / re-portion / absorb) behind it. Pure, deterministic, no LLM,
 * no network, no DOM. Money is integer cents end to end.
 *
 * PARITY CONTRACT (canonical source). This module is the source of truth for
 * the Plate recommendation engine. The paid product (Muntin Ledger) ships a
 * behaviour-identical TypeScript port at apps/api/src/lib/plate-advice.ts; the
 * 11 vectors in plate-advice.test.mjs are mirrored verbatim on that side. If
 * you change the math or the tiers here, change the Ledger port in the same
 * change — or the free tool and the product will recommend different things
 * for the same dish in front of the same operator.
 *
 * Accessibility: headlines and option copy are plain language at a low reading
 * grade, EN + ES, no jargon, no abbreviations the owner has to decode. The
 * one recommended action is always first; "healthy" says so and stops
 * (silence is a feature).
 *
 * Privacy posture: pure function. No fetch, no localStorage, no DOM.
 */
(function (root) {
  'use strict';

  var DEFAULT_TARGET = 0.30; // owner's goal food-cost %, overridable
  var WATCH_BAND = 0.02;     // within 2 pts over target = "watch", not "act"

  // ---- money helpers (integer cents) --------------------------------
  function dollars(cents) { return '$' + (Math.round(cents) / 100).toFixed(2); }
  function dollarsRound(cents) { return '$' + Math.round(cents / 100); }
  function pct(p) { return Math.round(p * 100) + '%'; }

  // ---- charm rounding to the menu's own convention ------------------
  function detectConvention(menuPricesCents) {
    if (!Array.isArray(menuPricesCents) || !menuPricesCents.length) return 'whole';
    var tally = { whole: 0, ninetyfive: 0, ninetynine: 0, other: 0 };
    menuPricesCents.forEach(function (c) {
      if (typeof c !== 'number' || !isFinite(c)) return;
      var end = ((Math.round(c) % 100) + 100) % 100;
      if (end === 0) tally.whole++;
      else if (end === 95) tally.ninetyfive++;
      else if (end === 99) tally.ninetynine++;
      else tally.other++;
    });
    var best = 'whole', bestN = -1;
    ['whole', 'ninetyfive', 'ninetynine'].forEach(function (k) {
      if (tally[k] > bestN) { bestN = tally[k]; best = k; }
    });
    return bestN > 0 ? best : 'whole';
  }

  function charmRoundUp(cents, convention) {
    cents = Math.max(0, Math.ceil(cents));
    if (convention === 'ninetyfive') {
      var k95 = Math.ceil((cents - 95) / 100);
      if (k95 < 0) k95 = 0;
      return k95 * 100 + 95;
    }
    if (convention === 'ninetynine') {
      var k99 = Math.ceil((cents - 99) / 100);
      if (k99 < 0) k99 = 0;
      return k99 * 100 + 99;
    }
    return Math.ceil(cents / 100) * 100; // whole dollar
  }

  function tt(locale, en, es) { return locale === 'es' ? es : en; }

  // The headline function. See plate-advice.test.mjs for the worked vectors.
  function advise(input) {
    input = input || {};
    var locale = input.locale === 'es' ? 'es' : 'en';
    var name = (input.itemName || '').toString().trim() || tt(locale, 'this dish', 'este platillo');
    var plate = Math.round(input.plateCostCents);
    var menu = (input.menuPriceCents != null && isFinite(input.menuPriceCents)) ? Math.round(input.menuPriceCents) : null;
    var target = (typeof input.targetFoodCostPct === 'number' && input.targetFoodCostPct > 0 && input.targetFoodCostPct < 1)
      ? input.targetFoodCostPct : DEFAULT_TARGET;
    var covers = (typeof input.coversPerWeek === 'number' && input.coversPerWeek > 0) ? input.coversPerWeek : null;
    var convention = detectConvention(input.menuPricesCents);
    var confidence = (input.confidence === 'low' || input.confidence === 'medium') ? input.confidence : 'high';
    var move = input.priceMove || null;

    var result = {
      tier: 'healthy',
      itemName: name,
      foodCostPct: null,
      contributionCents: null,
      targetFoodCostPct: target,
      headline: '',
      options: [],
      confidence: confidence,
      receipt: { plateCostCents: plate, menuPriceCents: menu, targetFoodCostPct: target, convention: convention }
    };

    if (!isFinite(plate) || plate <= 0) {
      result.tier = 'insufficient';
      result.headline = tt(locale,
        'Add this dish’s ingredients so Bench can cost it.',
        'Agrega los ingredientes de este platillo para poder costearlo.');
      return result;
    }

    var targetPriceRaw = plate / target;
    var repriceCents = charmRoundUp(targetPriceRaw, convention);

    function repriceOption() {
      var newPct = repriceCents > 0 ? plate / repriceCents : null;
      return {
        kind: 'reprice',
        newPriceCents: repriceCents,
        label: tt(locale, 'Raise it to ' + dollars(repriceCents), 'Súbelo a ' + dollars(repriceCents)),
        detail: tt(locale,
          'Hits your ' + pct(target) + ' goal' + (newPct ? ' (' + pct(newPct) + ' food cost)' : '') + '.',
          'Llega a tu meta de ' + pct(target) + (newPct ? ' (' + pct(newPct) + ' de costo)' : '') + '.')
      };
    }
    function reportionOption() {
      if (menu == null) return null;
      var targetCost = Math.round(menu * target);
      var trimCents = plate - targetCost;
      if (trimCents <= 0) return null;
      var trimPct = trimCents / plate;
      var driver = (move && move.ingredient) ? move.ingredient : tt(locale, 'the priciest ingredient', 'el ingrediente más caro');
      return {
        kind: 'reportion',
        trimPct: +trimPct.toFixed(3),
        label: tt(locale, 'Trim ' + pct(trimPct) + ' to hold the price', 'Recorta ' + pct(trimPct) + ' para mantener el precio'),
        detail: tt(locale,
          'Cut about ' + dollars(trimCents) + '/plate of cost (start with ' + driver + ') to keep ' + dollars(menu) + ' and hit your goal.',
          'Quita ~' + dollars(trimCents) + ' de costo por platillo (empieza con ' + driver + ') para mantener ' + dollars(menu) + ' y llegar a tu meta.')
      };
    }
    function absorbOption() {
      return {
        kind: 'absorb',
        label: tt(locale, 'Hold the price for now', 'Mantén el precio por ahora'),
        detail: tt(locale,
          'Keep it where it is and accept the thinner margin — fine for a draw or a traffic-builder.',
          'Déjalo igual y acepta el margen más delgado — está bien para un gancho o platillo de tráfico.')
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

    var foodCostPct = plate / menu;
    var contribution = menu - plate;
    result.foodCostPct = +foodCostPct.toFixed(4);
    result.contributionCents = contribution;

    function weekly(centsPerPlate) {
      if (!covers || centsPerPlate <= 0) return null;
      return Math.round(centsPerPlate * covers);
    }
    function feltLoss(centsPerPlate) {
      var w = weekly(centsPerPlate);
      if (w != null) return tt(locale, dollarsRound(w) + '/week', dollarsRound(w) + '/semana');
      return tt(locale, dollars(centsPerPlate) + '/plate', dollars(centsPerPlate) + ' por platillo');
    }

    // -------- a price hike just hit this dish (blame the price) --------
    if (move && typeof move.addedCostCentsPerPlate === 'number' && move.addedCostCentsPerPlate > 0) {
      var added = Math.round(move.addedCostCentsPerPlate);
      var ing = move.ingredient || tt(locale, 'An ingredient', 'Un ingrediente');
      var moveStr = (typeof move.pctMove === 'number') ? ' (' + pct(move.pctMove) + ')' : '';
      result.tier = 'hike';
      result.headline = tt(locale,
        ing + ' went up' + moveStr + ' — it’s costing you ' + feltLoss(added) + ' on ' + name + '.',
        'Subió ' + ing + moveStr + ' — te está costando ' + feltLoss(added) + ' en ' + name + '.');
      var opts = [];
      if (move.seasonal) {
        opts.push(absorbOption());
        opts.push(reportionOption());
        opts.push(repriceOption());
        result.headline += tt(locale,
          ' Looks seasonal — it should ease, so holding is usually right.',
          ' Parece de temporada — debería bajar, así que mantenerlo suele ser lo correcto.');
      } else {
        if (foodCostPct > target + WATCH_BAND) opts.push(repriceOption());
        var rp = reportionOption(); if (rp) opts.push(rp);
        if (foodCostPct <= target + WATCH_BAND) opts.push(repriceOption());
        opts.push(absorbOption());
      }
      result.options = opts.filter(Boolean);
      return result;
    }

    // -------- underwater: costs more than it sells for --------
    if (contribution <= 0) {
      result.tier = 'underwater';
      var lossPerPlate = Math.max(1, -contribution);
      result.headline = tt(locale,
        'Heads up — ' + name + ' costs more to make than you charge. You lose about ' + feltLoss(lossPerPlate) + '.',
        'Ojo — ' + name + ' cuesta más de preparar que lo que cobras. Pierdes ~' + feltLoss(lossPerPlate) + '.');
      result.options = [repriceOption(), reportionOption(), absorbOption()].filter(Boolean);
      return result;
    }

    // -------- over the owner's target --------
    if (foodCostPct > target + WATCH_BAND) {
      var gapPerPlate = Math.max(0, plate - Math.round(menu * target));
      result.tier = 'over_target';
      result.headline = tt(locale,
        name + ' eats ' + pct(foodCostPct) + ' of every dollar it earns — your goal is ' + pct(target) + '. Closing that gap is about ' + feltLoss(gapPerPlate) + '.',
        name + ' se lleva ' + pct(foodCostPct) + ' de cada dólar — tu meta es ' + pct(target) + '. Cerrar esa brecha son ~' + feltLoss(gapPerPlate) + '.');
      result.options = [repriceOption(), reportionOption(), absorbOption()].filter(Boolean);
      return result;
    }

    // -------- watch band: a little over, worth a glance --------
    if (foodCostPct > target) {
      result.tier = 'watch';
      result.headline = tt(locale,
        name + ' is running a touch over goal (' + pct(foodCostPct) + ' vs ' + pct(target) + '). Keeps ' + dollars(contribution) + '/plate. Worth a glance, no rush.',
        name + ' está un poco arriba de tu meta (' + pct(foodCostPct) + ' vs ' + pct(target) + '). Te deja ' + dollars(contribution) + ' por platillo. Échale un ojo, sin prisa.');
      result.options = [absorbOption(), repriceOption()].filter(Boolean);
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

  var api = {
    advise: advise,
    detectConvention: detectConvention,
    charmRoundUp: charmRoundUp,
    DEFAULT_TARGET: DEFAULT_TARGET
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinPlateAdvice = api;
  if (root) root.MuntinPlateAdvice = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
