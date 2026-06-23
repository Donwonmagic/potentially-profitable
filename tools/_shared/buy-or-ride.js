/**
 * Muntin — Buy-now-or-ride-it-out (insight E7: invoices × inventory × index).
 *
 * The decision a single dataset can't make. Invoices alone say "beef's up 12%,
 * re-price." But if the market move is a SPIKE that already retraced, and you
 * have 9 days on hand, you don't have to buy at the high — you can wait it out.
 * Only the join (your invoice hike × your days-of-cover × the market's
 * spike-vs-structural read) tells you whether you can AFFORD to wait.
 *
 * Core decision needs no recipes — it serves the invoices+inventory operator on
 * its own. A dish $/week (when recipes exist) is optional enrichment, never
 * invented.
 *
 * Honesty discipline:
 *   - Days-of-cover is EXACT (from the operator's own counts/coverage). E7 does
 *     not fire without a real cover read — it never invents inventory, and never
 *     asks you to count stock just for this card.
 *   - "It may not stick" is the SPIKE CLASSIFIER's retrace-from-peak language
 *     (ran up then pulled back) — never seasonality ("always spikes in Feb"),
 *     which needs 2-yr history we don't have. A structural (sustained) move is
 *     called real and routed to re-price regardless of cover.
 *   - Lead time tightens the forced-buy point: slack = cover − lead. You can
 *     only "ride" if you have slack to wait and still reorder in time.
 *   - $/week appears only when a real dish impact is supplied. No covers → no
 *     dollar clause, never a guess.
 *
 * Pure, deterministic, no DOM/network/LLM. EN + ES first-class. Browser:
 * window.MuntinBuyOrRide. Node: module.exports.
 *
 * PARITY CONTRACT. Source of truth for the buy/ride copy; the Ledger TS port is
 * behaviour-identical and buy-or-ride.test.mjs mirrors verbatim.
 *
 * @param {{
 *   ingredient:string, hikePct:number, daysOfCover:(number|null),
 *   leadTimeDays?:(number|null),
 *   spikeVerdict:('structural'|'spike'|'emerging'|'easing'|'flat'|'insufficient'),
 *   retrace?:(number|null), dishImpactPerWeek?:(number|null),
 *   reassessLabel?:string, locale?:('en'|'es')
 * }} input
 * @returns {{
 *   tier:('ride'|'buy-now'|'reprice'|'watch'|'none'), show:boolean,
 *   actionBias:('hold'|'act'|'re-price'|'watch'|null), headline:(string|null),
 *   daysOfCover:(number|null), options:Array<{kind:string,label:string}>,
 *   reason:string
 * }}
 */
(function (root) {
  'use strict';

  var DEFAULTS = {
    nearlyOutDays: 2,   // slack (cover − lead) at/below this → you must buy now
    material: 0.5       // a hike smaller than this % is below menu-cost stickiness
  };

  function tt(locale, en, es) { return locale === 'es' ? es : en; }
  function money(n) { return '$' + Math.round(n); }
  function pct(n) { return (Math.round(n * 10) / 10) + '%'; }

  function none(reason) {
    return { tier: 'none', show: false, actionBias: null, headline: null, daysOfCover: null, options: [], reason: reason };
  }

  function decide(input, opts) {
    input = input || {};
    var o = Object.assign({}, DEFAULTS, opts || {});
    var locale = input.locale === 'es' ? 'es' : 'en';
    var ing = input.ingredient || tt(locale, 'this item', 'este producto');
    var h = input.hikePct;
    var cover = (typeof input.daysOfCover === 'number' && isFinite(input.daysOfCover)) ? input.daysOfCover : null;
    var lead = (typeof input.leadTimeDays === 'number' && isFinite(input.leadTimeDays) && input.leadTimeDays > 0) ? input.leadTimeDays : 0;
    var v = input.spikeVerdict;
    var day = input.reassessLabel || tt(locale, 'Monday', 'el lunes');
    var dish = (typeof input.dishImpactPerWeek === 'number' && isFinite(input.dishImpactPerWeek) && input.dishImpactPerWeek > 0) ? input.dishImpactPerWeek : null;

    // Honesty gates: a real hike, and a real cover read. Never invent either.
    if (!(typeof h === 'number' && isFinite(h) && h >= o.material)) return none('no-hike');
    if (cover == null) return none('no-coverage'); // E7 reads cover; it never asks you to count

    var dCover = Math.round(cover);
    var slack = cover - lead;                 // days you can wait before you must reorder
    var nearlyOut = slack <= o.nearlyOutDays; // you'll buy at the high before it can settle
    var coverWord = tt(locale, dCover + (dCover === 1 ? ' day' : ' days'), dCover + (dCover === 1 ? ' día' : ' días'));

    var dishClause = dish
      ? tt(locale, ' That works out to about ' + money(dish) + '/week across your dishes.', ' Eso es como ' + money(dish) + ' por semana en tus platillos.')
      : '';
    var remind = { kind: 'remind', label: tt(locale, 'Remind me ' + day, 'Recuérdame ' + day) };

    // 1. STRUCTURAL — a real, sustained move. Cover only buys deliberation time;
    //    price it in now. (cover phrasing flexes, the call doesn't.)
    if (v === 'structural') {
      var coverPhrase = nearlyOut
        ? tt(locale, "and you're down to " + coverWord, "y te quedan " + coverWord)
        : tt(locale, "even with " + coverWord + " on hand", "aun con " + coverWord + " en inventario");
      return {
        tier: 'reprice', show: true, actionBias: 're-price',
        headline: tt(locale,
          ing + ' is up ' + pct(h) + ' on your invoice, and this looks like a real, sustained move — not a blip. ' + coverPhrase + ', this one is worth pricing in now.' + dishClause,
          ing + ' subió ' + pct(h) + ' en tu factura, y esto parece un alza real y sostenida — no un brinco. ' + coverPhrase + ', conviene ajustar el precio ahora.' + dishClause),
        daysOfCover: dCover,
        options: [{ kind: 'reprice', label: tt(locale, 'See the move', 'Ver el movimiento') }],
        reason: 'structural-reprice'
      };
    }

    var reverting = (v === 'spike' || v === 'easing' || v === 'flat');

    // 2. NEARLY OUT — you must buy before it can settle. Mitigate on the dish.
    if (nearlyOut) {
      return {
        tier: 'buy-now', show: true, actionBias: 'act',
        headline: tt(locale,
          ing + ' is up ' + pct(h) + " on your invoice, and you're down to " + coverWord + " — you'll be buying at the high before this can settle." + dishClause + ' Here is the move.',
          ing + ' subió ' + pct(h) + ' en tu factura, y te quedan ' + coverWord + ' — vas a comprar caro antes de que esto se calme.' + dishClause + ' Aquí está el movimiento.'),
        daysOfCover: dCover,
        options: [{ kind: 'see_move', label: tt(locale, 'See the move', 'Ver el movimiento') }],
        reason: 'nearly-out-buy'
      };
    }

    // 3. REVERTING + room to wait — ride it out, re-check. (phrasing per verdict)
    if (reverting) {
      var why = v === 'spike'
        ? tt(locale, 'this jump already pulled back from its peak, so it may not stick', 'este salto ya bajó algo desde su punto alto, así que puede que no se quede')
        : v === 'easing'
          ? tt(locale, "the market has actually been easing, so this may not hold", 'el mercado ha estado bajando, así que puede que no se quede')
          : tt(locale, "the market for " + ing + " has barely moved, so this is not a broad rise — worth a look before you pay it", 'el mercado de ' + ing + ' casi no se ha movido, así que no es un alza general — vale revisarlo antes de pagarlo');
      return {
        tier: 'ride', show: true, actionBias: 'hold',
        headline: tt(locale,
          ing + ' is up ' + pct(h) + " on your invoice — but you've got " + coverWord + ' on hand, and ' + why + ". You don't have to buy at the high. We'll re-check " + day + '.',
          ing + ' subió ' + pct(h) + ' en tu factura — pero tienes ' + coverWord + ' en inventario, y ' + why + '. No tienes que comprar caro. Revisamos ' + day + '.'),
        daysOfCover: dCover,
        options: [remind],
        reason: 'spike-ride'
      };
    }

    // 4. EMERGING / INSUFFICIENT + room to wait — too early to call; watch.
    return {
      tier: 'watch', show: true, actionBias: 'watch',
      headline: tt(locale,
        ing + ' is up ' + pct(h) + " on your invoice. It's too early to tell if this sticks, and you've got " + coverWord + ' on hand — room to wait for the next read before you decide. ' + "We'll re-check " + day + '.',
        ing + ' subió ' + pct(h) + ' en tu factura. Es muy pronto para saber si se queda, y tienes ' + coverWord + ' en inventario — tiempo para esperar la próxima lectura antes de decidir. Revisamos ' + day + '.'),
      daysOfCover: dCover,
      options: [remind],
      reason: 'emerging-watch'
    };
  }

  var api = { decide: decide, DEFAULTS: DEFAULTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinBuyOrRide = api;
  if (root) root.MuntinBuyOrRide = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
