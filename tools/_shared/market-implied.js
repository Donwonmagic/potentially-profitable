/**
 * Muntin — Market-implied dish drift (insight E12: the free teaser, labeled).
 *
 * Before an operator connects a single invoice, the public Cost Index can still
 * say something true: "produce moved +9% in your area; a dish like yours would
 * feel about this much." It is the index x a recipe TEMPLATE — the one insight
 * allowed to use a template instead of the operator's own BOM, precisely BECAUSE
 * it is labeled a market estimate, never their real cost. The funnel CTA fires
 * here (an actionable move), never on a healthy/flat read.
 *
 * Honesty discipline:
 *   - ALWAYS carries "a market estimate, not your real cost." Non-negotiable.
 *   - Only speaks when the index read is confidence >= medium AND the move is
 *     material; a thin or flat read stays silent (no anxiety-bait).
 *   - Never invents the per-plate figure: no implied cents → drop that clause,
 *     keep the category move + the CTA.
 *
 * Pure, deterministic, no DOM/network/LLM. EN + ES first-class. Browser:
 * window.MuntinMarketImplied. Node: module.exports.
 *
 * PARITY CONTRACT. Source of truth for the teaser copy; the Ledger TS port is
 * behaviour-identical and market-implied.test.mjs mirrors verbatim.
 *
 * @param {{
 *   category:string, marketDeltaPct:number, marketConfidence:string,
 *   dishExample:string, impliedPerPlateCents?:number, area?:string, locale?:('en'|'es')
 * }} input
 * @returns {{
 *   tier:('teaser'|'none'), show:boolean, headline:(string|null),
 *   options:Array<{kind:string,label:string}>, marketDeltaPct:(number|null), reason:string
 * }}
 */
(function (root) {
  'use strict';

  var FLAT = 0.02; // below this the market move is not worth a teaser

  function tt(locale, en, es) { return locale === 'es' ? es : en; }
  function signedPct(x) { return (x > 0 ? '+' : '') + Math.round(x * 100) + '%'; }
  function plateUsd(cents) { return '$' + (Math.round(cents) / 100).toFixed(2); }

  function build(input) {
    input = input || {};
    var locale = input.locale === 'es' ? 'es' : 'en';
    var conf = input.marketConfidence;
    var move = input.marketDeltaPct;

    function none(reason) {
      return { tier: 'none', show: false, headline: null, options: [], marketDeltaPct: (typeof move === 'number' ? move : null), reason: reason };
    }
    if (conf !== 'high' && conf !== 'medium') return none('thin-confidence');
    if (typeof move !== 'number' || !isFinite(move) || Math.abs(move) < FLAT) return none('flat-or-immaterial');

    var cat = input.category || tt(locale, 'ingredient', 'ingrediente');
    var dish = input.dishExample || tt(locale, 'a typical dish', 'un platillo típico');
    var area = input.area ? (tt(locale, ' in your area', ' en tu zona')) : '';
    var plateClause = (typeof input.impliedPerPlateCents === 'number' && isFinite(input.impliedPerPlateCents))
      ? tt(locale, ' A ' + dish + ' like the typical one would feel about ' + plateUsd(input.impliedPerPlateCents) + '/plate —',
                   ' Un ' + dish + ' típico sentiría como ' + plateUsd(input.impliedPerPlateCents) + ' por platillo —')
      : tt(locale, ' Dishes like yours would feel it —', ' Platillos como los tuyos lo sentirían —');

    var headline = tt(locale,
      'Heads up: ' + cat + ' prices' + area + ' moved ' + signedPct(move) + ' this month.' + plateClause + ' but that’s a market estimate, not your real cost. Connect one invoice to see your number.',
      'Aviso: los precios de ' + cat + area + ' se movieron ' + signedPct(move) + ' este mes.' + plateClause + ' pero es un estimado del mercado, no tu costo real. Conecta una factura para ver tu número.');

    return {
      tier: 'teaser', show: true, headline: headline,
      options: [{ kind: 'connect_invoice', label: tt(locale, 'Connect an invoice', 'Conecta una factura') }],
      marketDeltaPct: move, reason: 'market-move'
    };
  }

  var api = { build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinMarketImplied = api;
  if (root) root.MuntinMarketImplied = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
