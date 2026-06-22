/**
 * Muntin — Menu-resilience stress-test (insight E14: the labeled what-if).
 *
 * "If beef jumps 20%, which dishes cross your line?" Takes the operator's
 * already-costed dishes and applies a HYPOTHETICAL price hike to one ingredient
 * — re-pricing only the exposed share of each plate — then flags the dishes that
 * would slip past the owner's own food-cost target. The unity that makes it
 * possible: invoices × recipes already give the per-dish exposure to a single
 * canonical; the stress is just arithmetic on top.
 *
 * Honesty discipline:
 *   - It is a WHAT-IF, said so in every headline ("What-if:"). It is not a
 *     forecast and never claims the hike will happen.
 *   - Only dishes that actually USE the ingredient (exposedCents > 0) and have a
 *     menu price are scored — a dish with no exposure is untouched, not faked.
 *   - The % move is exact arithmetic on the operator's own plate cost; the line
 *     is the owner's OWN target, never a textbook number.
 *   - Nothing crosses → calm green: "even at +20%, all of them hold."
 *
 * Pure, deterministic, no DOM/network/LLM. EN + ES first-class. Browser:
 * window.MuntinStressTest. Node: module.exports.
 *
 * PARITY CONTRACT. Source of truth for the stress-test copy; the Ledger TS port
 * is behaviour-identical and stress-test.test.mjs mirrors verbatim.
 *
 * @param {{
 *   ingredient:string, hikePct:number, targetPct:number,
 *   dishes:Array<{dish:string, plateCostCents:number, menuPriceCents:number, exposedCents:number}>,
 *   locale?:('en'|'es')
 * }} input
 * @returns {{
 *   show:boolean, ingredient:string, hikePct:number, targetPct:number,
 *   dishes:Array<{dish:string, baseFoodPct:number, stressedFoodPct:number, deltaPp:number, status:('crossed'|'already-over'|'safe')}>,
 *   crossed:string[], headline:(string|null),
 *   options:Array<{kind:string,dish?:string,label:string}>, reason:string
 * }}
 */
(function (root) {
  'use strict';

  function tt(locale, en, es) { return locale === 'es' ? es : en; }
  function fcPct(frac) { return (frac * 100).toFixed(1) + '%'; }
  function targetStr(frac) { return Math.round(frac * 100) + '%'; }

  function build(input) {
    input = input || {};
    var locale = input.locale === 'es' ? 'es' : 'en';
    var ingredient = input.ingredient || tt(locale, 'that ingredient', 'ese ingrediente');
    var hikePct = (typeof input.hikePct === 'number' && isFinite(input.hikePct)) ? input.hikePct : 0;
    var targetPct = (typeof input.targetPct === 'number' && isFinite(input.targetPct) && input.targetPct > 0) ? input.targetPct : 0.30;
    var dishesIn = Array.isArray(input.dishes) ? input.dishes : [];

    if (!(hikePct > 0)) {
      return { show: false, ingredient: ingredient, hikePct: hikePct, targetPct: targetPct, dishes: [], crossed: [], headline: null, options: [], reason: 'no-hike' };
    }

    var scored = dishesIn
      .filter(function (d) {
        return d && d.dish &&
          typeof d.plateCostCents === 'number' && isFinite(d.plateCostCents) && d.plateCostCents > 0 &&
          typeof d.menuPriceCents === 'number' && isFinite(d.menuPriceCents) && d.menuPriceCents > 0 &&
          typeof d.exposedCents === 'number' && isFinite(d.exposedCents) && d.exposedCents > 0; // must actually use it
      })
      .map(function (d) {
        var stressedPlate = d.plateCostCents + d.exposedCents * (hikePct / 100);
        var baseFoodPct = d.plateCostCents / d.menuPriceCents;
        var stressedFoodPct = stressedPlate / d.menuPriceCents;
        var status = baseFoodPct > targetPct ? 'already-over'
          : (stressedFoodPct > targetPct ? 'crossed' : 'safe');
        return {
          dish: d.dish,
          baseFoodPct: +baseFoodPct.toFixed(4),
          stressedFoodPct: +stressedFoodPct.toFixed(4),
          deltaPp: +((stressedFoodPct - baseFoodPct) * 100).toFixed(1),
          status: status
        };
      })
      .sort(function (a, b) { return b.stressedFoodPct - a.stressedFoodPct; });

    if (!scored.length) {
      return { show: false, ingredient: ingredient, hikePct: hikePct, targetPct: targetPct, dishes: [], crossed: [], headline: null, options: [], reason: 'no-exposed-dishes' };
    }

    var crossed = scored.filter(function (s) { return s.status === 'crossed'; });
    var crossedNames = crossed.map(function (s) { return s.dish; });
    var whatif = tt(locale, 'What-if: ', 'Supongamos: ');

    var headline;
    var options = [];
    if (crossed.length) {
      var top = crossed[0];
      var list = crossedNames.join(', ');
      headline = whatif + tt(locale,
        'if ' + ingredient + ' jumps ' + hikePct + '%, ' + crossed.length + (crossed.length === 1 ? ' dish' : ' dishes') +
          ' would cross your ' + targetStr(targetPct) + ' line — ' + list + '. ' + top.dish + ' moves from ' + fcPct(top.baseFoodPct) + ' to ' + fcPct(top.stressedFoodPct) + '.',
        'si ' + ingredient + ' sube ' + hikePct + '%, ' + crossed.length + (crossed.length === 1 ? ' platillo' : ' platillos') +
          ' cruzarían tu línea de ' + targetStr(targetPct) + ' — ' + list + '. ' + top.dish + ' pasa de ' + fcPct(top.baseFoodPct) + ' a ' + fcPct(top.stressedFoodPct) + '.');
      options = [{ kind: 'open_dish', dish: top.dish, label: tt(locale, 'Look at ' + top.dish, 'Mira ' + top.dish) }];
    } else {
      var mostExposed = scored[0];
      headline = whatif + tt(locale,
        'even if ' + ingredient + ' jumps ' + hikePct + '%, all ' + scored.length + ' of your ' + ingredient + ' dishes stay under your ' + targetStr(targetPct) + ' line. ' +
          mostExposed.dish + ' moves to ' + fcPct(mostExposed.stressedFoodPct) + ' — still safe.',
        'aunque ' + ingredient + ' suba ' + hikePct + '%, los ' + scored.length + ' platillos con ' + ingredient + ' se quedan bajo tu línea de ' + targetStr(targetPct) + '. ' +
          mostExposed.dish + ' llega a ' + fcPct(mostExposed.stressedFoodPct) + ' — aún seguro.');
    }

    return {
      show: true, ingredient: ingredient, hikePct: hikePct, targetPct: targetPct,
      dishes: scored, crossed: crossedNames, headline: headline,
      options: options, reason: crossed.length ? 'dishes-cross' : 'all-hold'
    };
  }

  var api = { build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinStressTest = api;
  if (root) root.MuntinStressTest = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
