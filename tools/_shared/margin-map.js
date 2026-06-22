/**
 * Muntin — Menu margin map (insight E6: "which dishes crossed your line").
 *
 * The dashboard rollup: which dishes have slipped past the owner's OWN food-cost
 * target (asked once at setup), ranked by how far over. Anchored on the owner's
 * number — never a textbook 28/30/33 — and framed calm, not alarmist.
 *
 * Honesty discipline:
 *   - Anchored on the owner's `targetPct` (passed in); the copy names it.
 *   - A dish with no usable food-cost % is excluded (never assumed on target).
 *   - The food-cost % is theoretical plate cost / menu price; label it theoretical
 *     wherever the figure is shown (the caller owns that chrome).
 *   - Nothing over the line → calm green (`show:false`), no CTA.
 *
 * Pure, deterministic, no DOM/network/LLM. EN + ES first-class. Browser:
 * window.MuntinMarginMap. Node: module.exports.
 *
 * PARITY CONTRACT. Source of truth for the margin-map copy; the Ledger TS port
 * is behaviour-identical and margin-map.test.mjs mirrors verbatim.
 *
 * @param {{ dishes:Array<{dish:string,foodCostPct:number}>, targetPct?:number, locale?:('en'|'es') }} input
 * @returns {{
 *   tier:('crossed'|'none'), show:boolean, headline:(string|null),
 *   over:Array<{dish:string,foodCostPct:number}>, targetPct:number,
 *   options:Array<{kind:string,dish?:string,label:string}>, reason:string
 * }}
 */
(function (root) {
  'use strict';

  function tt(locale, en, es) { return locale === 'es' ? es : en; }
  function pct(x) { return Math.round(x * 100) + '%'; }

  function build(input) {
    input = input || {};
    var locale = input.locale === 'es' ? 'es' : 'en';
    var target = (typeof input.targetPct === 'number' && input.targetPct > 0 && input.targetPct < 1) ? input.targetPct : 0.30;
    var dishes = Array.isArray(input.dishes) ? input.dishes : [];

    var over = dishes
      .filter(function (d) { return d && d.dish && typeof d.foodCostPct === 'number' && isFinite(d.foodCostPct) && d.foodCostPct > target; })
      .map(function (d) { return { dish: d.dish, foodCostPct: d.foodCostPct }; })
      .sort(function (a, b) { return b.foodCostPct - a.foodCostPct; });

    if (!over.length) {
      return {
        tier: 'none', show: false,
        headline: tt(locale, 'Every dish is at or under your ' + pct(target) + ' goal. Nothing to do.',
                             'Cada platillo está en o bajo tu meta de ' + pct(target) + '. Nada que hacer.'),
        over: [], targetPct: target, options: [], reason: 'all-on-target'
      };
    }

    var n = over.length;
    var listStr = over.map(function (d) { return d.dish + tt(locale, ' (now ' + pct(d.foodCostPct) + ')', ' (ahora ' + pct(d.foodCostPct) + ')'); }).join(', ');
    var top = over[0].dish;
    var headline = tt(locale,
      n + (n === 1 ? ' dish' : ' dishes') + ' slipped past your ' + pct(target) + ' food-cost goal: ' + listStr + '. None are emergencies — but ' + top + ' is the one to look at first.',
      n + (n === 1 ? ' platillo' : ' platillos') + ' pasaron tu meta de ' + pct(target) + ' de costo: ' + listStr + '. Ninguno es urgente — pero ' + top + ' es el primero que mirar.');

    return {
      tier: 'crossed', show: true, headline: headline, over: over, targetPct: target,
      options: [{ kind: 'open_dish', dish: top, label: tt(locale, 'Look at ' + top, 'Mira ' + top) }],
      reason: 'dishes-over-target'
    };
  }

  var api = { build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinMarginMap = api;
  if (root) root.MuntinMarginMap = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
