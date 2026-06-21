/**
 * Muntin — Cross-dish blast radius (insight E5: one hike, many dishes).
 *
 * A single ingredient's price move fans out across every dish that uses it — a
 * view only the invoices x recipes join can produce (the recipes share a
 * canonical_id). Naming the blast radius turns N separate small alerts into one
 * decision: a single swap or vendor call fixes all of them at once.
 *
 * Honesty discipline:
 *   - A "blast radius" needs >= 2 dishes; a single dish is the ordinary
 *     dish-level path, not this card.
 *   - The $/week total is shown ONLY when every listed dish carries a usable
 *     $/week; otherwise the count stands alone ("across N dishes") — never a
 *     partial total dressed as complete.
 *
 * Pure, deterministic, no DOM/network/LLM. EN + ES first-class. Browser:
 * window.MuntinBlastRadius. Node: module.exports.
 *
 * PARITY CONTRACT. Source of truth for the blast-radius copy; the Ledger TS
 * port is behaviour-identical and blast-radius.test.mjs mirrors verbatim.
 *
 * @param {{ ingredient:string, dishes:Array<{name:string,dollarsPerWeek?:number}>, locale?:('en'|'es') }} input
 * @returns {{
 *   tier:('blast'|'none'), show:boolean, headline:(string|null),
 *   dishCount:number, totalPerWeek:(number|null),
 *   options:Array<{kind:string,label:string}>, reason:string
 * }}
 */
(function (root) {
  'use strict';

  function tt(locale, en, es) { return locale === 'es' ? es : en; }
  function money(n) { return '$' + Math.round(n); }

  function build(input) {
    input = input || {};
    var locale = input.locale === 'es' ? 'es' : 'en';
    var ing = input.ingredient || tt(locale, 'this ingredient', 'este ingrediente');
    var dishes = Array.isArray(input.dishes) ? input.dishes.filter(function (d) { return d && d.name; }) : [];
    var n = dishes.length;

    if (n < 2) {
      return { tier: 'none', show: false, headline: null, dishCount: n, totalPerWeek: null, options: [], reason: 'single-dish' };
    }

    // Total only when EVERY dish has a usable $/week — never a partial total.
    var allHaveDollars = dishes.every(function (d) { return typeof d.dollarsPerWeek === 'number' && isFinite(d.dollarsPerWeek) && d.dollarsPerWeek > 0; });
    var total = allHaveDollars ? Math.round(dishes.reduce(function (s, d) { return s + d.dollarsPerWeek; }, 0)) : null;

    var moneyClause = total != null
      ? tt(locale, ' — ' + money(total) + '/week in total', ' — ' + money(total) + ' por semana en total')
      : tt(locale, ' across ' + n + ' dishes', ' en ' + n + ' platillos');

    var cap = ing.charAt(0).toUpperCase() + ing.slice(1);
    var headline = tt(locale,
      cap + ' is in ' + n + ' of your dishes. This one price move touches all of them' + moneyClause + '. One swap or one vendor call fixes ' + n + ' problems at once.',
      cap + ' está en ' + n + ' de tus platillos. Este solo cambio los toca todos' + moneyClause + '. Un cambio o una llamada arregla ' + n + ' problemas de una vez.');

    return {
      tier: 'blast', show: true, headline: headline, dishCount: n, totalPerWeek: total,
      options: [{ kind: 'see_dishes', label: tt(locale, 'See the ' + n, 'Ver los ' + n) }],
      reason: 'multi-dish-ingredient'
    };
  }

  var api = { build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinBlastRadius = api;
  if (root) root.MuntinBlastRadius = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
