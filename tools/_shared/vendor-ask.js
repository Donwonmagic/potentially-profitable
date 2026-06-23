/**
 * Muntin — Vendor-ask card (the operator-facing half of flagship insight E1).
 *
 * Turns a spread-decomposition (tools/_shared/spread-decompose.js) into the
 * card the owner reads in five seconds: when the move is the vendor's, lead with
 * the recoverable dollars and hand them a show-your-work script to read to the
 * rep; when it's the market's, say so plainly and DON'T send them to fight a
 * vendor over a market move (a false alarm trains distrust and lowers IAR).
 *
 * The empowerment discipline, enforced in the copy:
 *   - Disclose BOTH numbers (own % and market %), always — never just one.
 *   - Loss-framed in $/week, anchored on the dish; the ingredient/vendor is the
 *     grammatical subject ("romaine is up", "your vendor"), never "your costs".
 *   - ONE default action (Draft the ask); the dish re-price/re-portion fork is
 *     the fallback, owned by plate-advice.js (not re-implemented here).
 *   - Gated decomposition → `show:false`: the caller renders each side alone,
 *     no spread card. We never show a spread we couldn't stand behind.
 *   - Never invents a dollar figure: if dish $/week is absent, the headline
 *     drops the money clause rather than guessing.
 *
 * Pure, deterministic, no DOM/network/LLM. EN + ES first-class. Browser:
 * window.MuntinVendorAsk. Node: module.exports.
 *
 * PARITY CONTRACT. Source of truth for the vendor-ask copy; the Ledger TS port
 * is behaviour-identical and the vectors in vendor-ask.test.mjs mirror verbatim.
 *
 * @param {{
 *   decomposition:object, ingredient:string, vendor:string, itemName:string,
 *   ownDeltaPct?:number, marketDeltaPct?:number, unitPriceText?:string,
 *   dishDollarsPerWeek?:number, locale?:('en'|'es')
 * }} input
 * @returns {{
 *   tier:('vendor'|'mixed'|'market'|'gated'), show:boolean,
 *   headline:(string|null), ask:(string|null),
 *   options:Array<{kind:string,label:string}>,
 *   vendorDollarsPerWeek:(number|null), confidence:string, reason:string
 * }}
 */
(function (root) {
  'use strict';

  function tt(locale, en, es) { return locale === 'es' ? es : en; }
  function pctWhole(x) { return (typeof x === 'number' && isFinite(x)) ? Math.round(x * 100) + '%' : ''; }
  function money(n) { return '$' + Math.round(n); }

  function build(input) {
    input = input || {};
    var locale = input.locale === 'es' ? 'es' : 'en';
    var d = input.decomposition || {};
    var ing = input.ingredient || tt(locale, 'this item', 'este producto');
    var vendor = input.vendor || tt(locale, 'your vendor', 'tu proveedor');
    var dish = input.itemName || tt(locale, 'this dish', 'este platillo');
    var own = (typeof input.ownDeltaPct === 'number') ? input.ownDeltaPct : null;
    var mkt = (typeof input.marketDeltaPct === 'number') ? input.marketDeltaPct
      : (typeof d.marketPoints === 'number' ? d.marketPoints : null);

    // Gated read → show nothing as a spread; the caller shows each side alone.
    if (d.gated || d.attribution === 'inconclusive') {
      return {
        tier: 'gated', show: false, headline: null, ask: null, options: [],
        vendorDollarsPerWeek: null, confidence: d.confidence || 'low', reason: d.reason || 'gated'
      };
    }

    var dpw = (typeof input.dishDollarsPerWeek === 'number' && input.dishDollarsPerWeek > 0)
      ? input.dishDollarsPerWeek : null;
    var vendorDpw = (dpw != null && typeof d.vendorShare === 'number')
      ? Math.round(dpw * Math.abs(d.vendorShare)) : null;

    var ownStr = pctWhole(own), mktStr = pctWhole(mkt);

    // The market explains it → name that honestly; no vendor ask, defer to the fork.
    if (d.attribution === 'market') {
      return {
        tier: 'market', show: true,
        headline: tt(locale,
          ing + ' is up ' + ownStr + ' — and the market moved about the same (' + mktStr + '). This one’s the market, not your vendor. ' + dish + ' is feeling it; here’s the move.',
          ing + ' subió ' + ownStr + ' — y el mercado se movió casi igual (' + mktStr + '). Este es el mercado, no tu proveedor. ' + dish + ' lo está sintiendo; aquí está la opción.'),
        ask: null,
        options: [
          { kind: 'reprice',   label: tt(locale, 'Re-price', 'Reajusta el precio') },
          { kind: 'reportion', label: tt(locale, 'Re-portion', 'Ajusta la porción') },
          { kind: 'hold',      label: tt(locale, 'Hold', 'Espera') }
        ],
        vendorDollarsPerWeek: null, confidence: d.confidence || 'medium', reason: d.reason || 'market-explains'
      };
    }

    // vendor or mixed → lead with the recoverable dollars, disclose both numbers,
    // and hand over the ask script. (mixed names the market share too.)
    var moneyClause = vendorDpw != null
      ? tt(locale, ' — roughly ' + money(vendorDpw) + '/week on ' + dish, ' — como ' + money(vendorDpw) + ' por semana en ' + dish)
      : '';
    var headline;
    if (d.attribution === 'mixed') {
      headline = tt(locale,
        ing + ' is up ' + ownStr + ' on your invoice. The market moved ' + mktStr + ' of that; the rest is your vendor' + moneyClause + '. Worth the ask before you re-price.',
        ing + ' subió ' + ownStr + ' en tu factura. El mercado movió ' + mktStr + ' de eso; lo demás es tu proveedor' + moneyClause + '. Vale la pena pedirlo antes de reajustar.');
    } else {
      headline = tt(locale,
        ing + ' is up ' + ownStr + ' on your invoice — but the market only moved ' + mktStr + '. The gap is your vendor, not the market' + moneyClause + '.',
        ing + ' subió ' + ownStr + ' en tu factura — pero el mercado solo subió ' + mktStr + '. La diferencia es tu proveedor, no el mercado' + moneyClause + '.');
    }
    var priceText = input.unitPriceText || tt(locale, 'your current price', 'tu precio actual');
    var ask = tt(locale,
      'Ask ' + vendor + ': “You’re at ' + priceText + '; the market moved ' + mktStr + ', you moved ' + ownStr + ' — can you do better?”',
      'Pídele a ' + vendor + ': “Estás en ' + priceText + '; el mercado subió ' + mktStr + ', tú subiste ' + ownStr + ' — ¿puedes mejorarlo?”');

    return {
      tier: d.attribution, show: true, headline: headline, ask: ask,
      options: [
        { kind: 'draft_ask', label: tt(locale, 'Draft the ask', 'Prepara el mensaje') },
        { kind: 'reprice',   label: tt(locale, 'Re-price anyway', 'Reajusta de todos modos') },
        { kind: 'hold',      label: tt(locale, 'Hold', 'Espera') }
      ],
      vendorDollarsPerWeek: vendorDpw, confidence: d.confidence || 'medium', reason: d.reason || d.attribution
    };
  }

  var api = { build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinVendorAsk = api;
  if (root) root.MuntinVendorAsk = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
