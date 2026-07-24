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
    var uncosted = (typeof input.uncostedCount === 'number' && input.uncostedCount > 0) ? Math.floor(input.uncostedCount) : 0;

    var over = dishes
      .filter(function (d) { return d && d.dish && typeof d.foodCostPct === 'number' && isFinite(d.foodCostPct) && d.foodCostPct > target; })
      .map(function (d) { return { dish: d.dish, foodCostPct: d.foodCostPct }; })
      .sort(function (a, b) { return b.foodCostPct - a.foodCostPct; });

    if (!over.length) {
      // Nothing over the line among costable dishes. If some are priced but have
      // no costable line, say so — never a clean "nothing to do" that silently
      // assumes uncosted dishes are on target.
      if (uncosted > 0) {
        // If NOTHING could be costed, don't lead with a vacuous "every costed dish
        // is on target" (there are none) — say only that nothing has been costed.
        var noneCosted = dishes.length === 0;
        var uHeadline = noneCosted
          ? tt(locale,
              uncosted + (uncosted === 1 ? ' dish couldn\'t' : ' dishes couldn\'t') + ' be costed yet. Connect an invoice or add prices to see them.',
              uncosted + (uncosted === 1 ? ' platillo no se pudo' : ' platillos no se pudieron') + ' costear aún. Conecta una factura o agrega precios para verlos.')
          : tt(locale,
              'Every costed dish is at or under your ' + pct(target) + ' goal — but ' + uncosted + (uncosted === 1 ? ' dish couldn\'t' : ' dishes couldn\'t') + ' be costed yet. Connect an invoice or add prices to see them.',
              'Cada platillo costeado está en o bajo tu meta de ' + pct(target) + ' — pero ' + uncosted + (uncosted === 1 ? ' platillo no se pudo' : ' platillos no se pudieron') + ' costear aún. Conecta una factura o agrega precios para verlos.');
        return {
          tier: 'none', show: true,
          headline: uHeadline,
          over: [], targetPct: target, options: [], reason: 'some-uncosted'
        };
      }
      return {
        tier: 'none', show: false,
        headline: tt(locale, 'Every dish is at or under your ' + pct(target) + ' goal. Nothing to do.',
                             'Cada platillo está en o bajo tu meta de ' + pct(target) + '. Nada que hacer.'),
        over: [], targetPct: target, options: [], reason: 'all-on-target'
      };
    }

    var n = over.length;
    var listStr = over.map(function (d) { return d.dish + tt(locale, ' (now ' + pct(d.foodCostPct) + ')', ' (ahora ' + pct(d.foodCostPct) + ')'); }).join(', ');
    var topDish = over[0];
    var top = topDish.dish;
    // Verb + trailing clause track the WORST dish's severity — a dish far over the
    // owner's line, or losing money on every plate (foodCostPct >= 1), is never a
    // calm "slip" / "not an emergency". Mildly-over menus keep the reassuring copy.
    var worst = topDish.foodCostPct;
    var losing = worst >= 1;
    var wellOver = worst >= target * 1.5;
    var severe = losing || wellOver;
    var enVerb = severe ? (n === 1 ? ' is over your ' : ' are over your ') : ' slipped past your ';
    var esVerb = n === 1 ? ' pasó tu meta de ' : ' pasaron tu meta de ';
    var enTail = losing
      ? '. ' + top + ' is losing money on every plate — start there.'
      : (wellOver ? '. ' + top + ' is well over your line — start there.'
                  : '. None are emergencies — but ' + top + ' is the one to look at first.');
    var esTail = losing
      ? '. ' + top + ' pierde dinero en cada plato — empieza por ahí.'
      : (wellOver ? '. ' + top + ' está muy por encima de tu línea — empieza por ahí.'
                  : '. Ninguno es urgente — pero ' + top + ' es el primero que mirar.');
    var headline = tt(locale,
      n + (n === 1 ? ' dish' : ' dishes') + enVerb + pct(target) + ' food-cost goal: ' + listStr + enTail,
      n + (n === 1 ? ' platillo' : ' platillos') + esVerb + pct(target) + ' de costo: ' + listStr + esTail);

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
