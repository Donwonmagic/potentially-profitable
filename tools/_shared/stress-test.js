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
  // Render a base→stressed food-cost pair. If both collapse to the same string at
  // one decimal (a hairline move near the line — including a base that sits exactly
  // on the target), step precision up so the movement the prose describes is
  // actually visible — never "moves from 30.0% to 30.0%". Fed the UNROUNDED
  // fractions so a real crossing always separates at some precision.
  function movePair(baseFrac, stressedFrac) {
    var dps = [1, 2, 3, 4, 5, 6];
    for (var i = 0; i < dps.length; i++) {
      var b = (baseFrac * 100).toFixed(dps[i]);
      var s = (stressedFrac * 100).toFixed(dps[i]);
      if (b !== s) return [b + '%', s + '%'];
    }
    return [(baseFrac * 100).toFixed(6) + '%', (stressedFrac * 100).toFixed(6) + '%'];
  }

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
          // Raw fractions kept internally — movePair/fcPct/sort read these; the
          // public dishes array rounds them to 4dp at the return, so a hairline
          // crossing still separates when rendered.
          baseFoodPct: baseFoodPct,
          stressedFoodPct: stressedFoodPct,
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
    var reason;
    if (crossed.length) {
      var top = crossed[0];
      var list = crossedNames.join(', ');
      var xp = movePair(top.baseFoodPct, top.stressedFoodPct);
      headline = whatif + tt(locale,
        'if ' + ingredient + ' jumps ' + hikePct + '%, ' + crossed.length + (crossed.length === 1 ? ' dish' : ' dishes') +
          ' would cross your ' + targetStr(targetPct) + ' line — ' + list + '. ' + top.dish + ' moves from ' + xp[0] + ' to ' + xp[1] + '.',
        'si ' + ingredient + ' sube ' + hikePct + '%, ' + crossed.length + (crossed.length === 1 ? ' platillo' : ' platillos') +
          ' cruzarían tu línea de ' + targetStr(targetPct) + ' — ' + list + '. ' + top.dish + ' pasa de ' + xp[0] + ' a ' + xp[1] + '.');
      options = [{ kind: 'open_dish', dish: top.dish, label: tt(locale, 'Look at ' + top.dish, 'Mira ' + top.dish) }];
      reason = 'dishes-cross';
    } else {
      // No dish NEWLY crosses. But "no new crossing" is not "all safe": a dish
      // whose base cost already exceeds the owner's line is already-over, never
      // safe. Split them — the calm "all stay under / still safe" copy may only
      // speak for genuinely-safe dishes, and an over-the-line dish must never be
      // called safe (honesty contract: never misstate calm).
      var alreadyOver = scored.filter(function (s) { return s.status === 'already-over'; });
      var safe = scored.filter(function (s) { return s.status === 'safe'; });
      if (alreadyOver.length) {
        var topOver = alreadyOver[0];
        var overList = alreadyOver.map(function (s) { return s.dish; }).join(', ');
        var m = alreadyOver.length;
        var op = movePair(topOver.baseFoodPct, topOver.stressedFoodPct);
        headline = whatif + tt(locale,
          'even if ' + ingredient + ' jumps ' + hikePct + '%, no new dish crosses your ' + targetStr(targetPct) + ' line — but ' +
            m + (m === 1 ? ' dish is' : ' dishes are') + ' already over it: ' + overList + '. ' + topOver.dish + ' runs ' + op[0] + ' now, ' + op[1] + ' after.',
          'aunque ' + ingredient + ' suba ' + hikePct + '%, ningún platillo nuevo cruza tu línea de ' + targetStr(targetPct) + ' — pero ' +
            m + (m === 1 ? ' platillo ya está' : ' platillos ya están') + ' por encima: ' + overList + '. ' + topOver.dish + ' está en ' + op[0] + ' ahora, ' + op[1] + ' después.');
        options = [{ kind: 'open_dish', dish: topOver.dish, label: tt(locale, 'Look at ' + topOver.dish, 'Mira ' + topOver.dish) }];
        reason = 'already-over';
      } else {
        // Genuinely calm: every exposed dish stays under the line, before & after.
        var mostExposed = safe[0] || scored[0];
        headline = whatif + tt(locale,
          'even if ' + ingredient + ' jumps ' + hikePct + '%, all ' + scored.length + ' of your ' + ingredient + ' dishes stay under your ' + targetStr(targetPct) + ' line. ' +
            mostExposed.dish + ' moves to ' + fcPct(mostExposed.stressedFoodPct) + ' — still safe.',
          'aunque ' + ingredient + ' suba ' + hikePct + '%, los ' + scored.length + ' platillos con ' + ingredient + ' se quedan bajo tu línea de ' + targetStr(targetPct) + '. ' +
            mostExposed.dish + ' llega a ' + fcPct(mostExposed.stressedFoodPct) + ' — aún seguro.');
        reason = 'all-hold';
      }
    }

    return {
      show: true, ingredient: ingredient, hikePct: hikePct, targetPct: targetPct,
      dishes: scored.map(function (s) {
        return {
          dish: s.dish, baseFoodPct: +s.baseFoodPct.toFixed(4),
          stressedFoodPct: +s.stressedFoodPct.toFixed(4), deltaPp: s.deltaPp, status: s.status
        };
      }),
      crossed: crossedNames, headline: headline,
      options: options, reason: reason
    };
  }

  var api = { build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinStressTest = api;
  if (root) root.MuntinStressTest = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
