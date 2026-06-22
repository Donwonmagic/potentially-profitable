/**
 * Muntin — Per-dish cost-history (insight E15: the plate-cost trajectory).
 *
 * The calm transparency surface for the Plate recipe tier: show an operator how
 * ONE dish's plate cost has actually moved over time — straight from their own
 * recipe_cost_snapshots — with an honest net-change summary and the raw series
 * for a sparkline. Ambient by design: it informs, it doesn't push. A dish that
 * has held steady says so (no alarm, no CTA).
 *
 * Honesty discipline:
 *   - Needs >= 2 snapshots; with fewer it says "not enough history yet" rather
 *     than drawing a line through one point.
 *   - The % is EXACT (first vs last of the dated series); the window label is
 *     read from the real span of dates, never assumed.
 *   - Plate cost is the operator's OWN number, so the $ levels are shown as a
 *     receipt ("$5.40 to $5.89"). It is NOT the market index.
 *   - The "market" comparison is OPTIONAL and labeled as a NAMED ingredient's
 *     move ("the market for romaine moved +6%") — never a claim that the whole
 *     dish tracks the market. Omitted when no market figure is supplied.
 *
 * Pure, deterministic, no DOM/network/LLM. EN + ES first-class. The sparkline
 * SVG is rendered separately (tools/_shared/sparkline.js) from `spark`. Browser:
 * window.MuntinCostHistory. Node: module.exports.
 *
 * PARITY CONTRACT. Source of truth for the history copy; the Ledger TS port is
 * behaviour-identical and cost-history.test.mjs mirrors verbatim.
 *
 * @param {{
 *   dish:string,
 *   points:Array<{at:string, plateCostCents:number}>,
 *   marketDeltaPct?:(number|null), marketLabel?:string,
 *   locale?:('en'|'es')
 * }} input
 * @returns {{
 *   show:boolean, dish:string, spark:number[],
 *   netDeltaPct:(number|null), direction:('up'|'down'|'flat'|null),
 *   windowLabel:(string|null), firstCents:(number|null), lastCents:(number|null),
 *   headline:(string|null), options:Array<{kind:string,dish?:string,label:string}>,
 *   reason:string
 * }}
 */
(function (root) {
  'use strict';

  var FLAT_PCT = 2; // a net move within +/-2% over the window reads "held steady"

  function tt(locale, en, es) { return locale === 'es' ? es : en; }
  function money(cents) { return '$' + (cents / 100).toFixed(2); }
  function pct1(n) { return (Math.round(Math.abs(n) * 10) / 10) + '%'; }
  function signed(n) { return (n > 0 ? '+' : (n < 0 ? '−' : '')) + pct1(n); }

  function windowLabel(locale, days) {
    if (days >= 75) {
      var mo = Math.round(days / 30);
      return tt(locale, 'over the past ' + mo + (mo === 1 ? ' month' : ' months'),
                        'en ' + (mo === 1 ? 'el último mes' : 'los últimos ' + mo + ' meses'));
    }
    if (days >= 14) {
      var wk = Math.round(days / 7);
      return tt(locale, 'over the past ' + wk + (wk === 1 ? ' week' : ' weeks'),
                        'en ' + (wk === 1 ? 'la última semana' : 'las últimas ' + wk + ' semanas'));
    }
    var d = Math.max(1, Math.round(days));
    return tt(locale, 'over the past ' + d + (d === 1 ? ' day' : ' days'),
                      'en ' + (d === 1 ? 'el último día' : 'los últimos ' + d + ' días'));
  }

  function build(input) {
    input = input || {};
    var locale = input.locale === 'es' ? 'es' : 'en';
    var dish = input.dish || tt(locale, 'this dish', 'este platillo');

    var pts = (Array.isArray(input.points) ? input.points : [])
      .filter(function (p) { return p && typeof p.plateCostCents === 'number' && isFinite(p.plateCostCents) && p.plateCostCents > 0 && p.at; })
      .slice()
      .sort(function (a, b) { return a.at < b.at ? -1 : a.at > b.at ? 1 : 0; }); // oldest -> newest

    if (pts.length < 2) {
      return { show: false, dish: dish, spark: pts.map(function (p) { return p.plateCostCents; }),
               netDeltaPct: null, direction: null, windowLabel: null, firstCents: null, lastCents: null,
               headline: null, options: [], reason: 'insufficient-history' };
    }

    var first = pts[0], last = pts[pts.length - 1];
    var firstCents = first.plateCostCents, lastCents = last.plateCostCents;
    var netDeltaPct = ((lastCents - firstCents) / firstCents) * 100;
    var days = (Date.parse(last.at) - Date.parse(first.at)) / 86400000;
    var win = windowLabel(locale, isFinite(days) && days > 0 ? days : 1);
    var spark = pts.map(function (p) { return p.plateCostCents; }); // oldest->newest (sparkline wants newest-last)

    var direction = Math.abs(netDeltaPct) < FLAT_PCT ? 'flat' : (netDeltaPct > 0 ? 'up' : 'down');

    // Optional, honestly-labeled market side-by-side for a NAMED ingredient.
    var market = '';
    var mPct = input.marketDeltaPct;
    if (typeof mPct === 'number' && isFinite(mPct) && input.marketLabel) {
      market = tt(locale,
        ' Over the same stretch, the market for ' + input.marketLabel + ' moved ' + signed(mPct) + '.',
        ' En el mismo periodo, el mercado de ' + input.marketLabel + ' se movió ' + signed(mPct) + '.');
    }

    var headline;
    if (direction === 'flat') {
      headline = tt(locale,
        'Your ' + dish + "'s plate cost has held steady " + win + ' — around ' + money(lastCents) + '.' + market,
        'El costo de tu ' + dish + ' se ha mantenido estable ' + win + ' — alrededor de ' + money(lastCents) + '.' + market);
    } else if (direction === 'up') {
      headline = tt(locale,
        'Your ' + dish + "'s plate cost is up " + pct1(netDeltaPct) + ' ' + win + ' — ' + money(firstCents) + ' to ' + money(lastCents) + '.' + market,
        'El costo de tu ' + dish + ' subió ' + pct1(netDeltaPct) + ' ' + win + ' — de ' + money(firstCents) + ' a ' + money(lastCents) + '.' + market);
    } else {
      headline = tt(locale,
        'Your ' + dish + "'s plate cost is down " + pct1(netDeltaPct) + ' ' + win + ' — ' + money(firstCents) + ' to ' + money(lastCents) + '.' + market,
        'El costo de tu ' + dish + ' bajó ' + pct1(netDeltaPct) + ' ' + win + ' — de ' + money(firstCents) + ' a ' + money(lastCents) + '.' + market);
    }

    // Ambient: a steady dish needs no action (calm). A material move offers a
    // look at the dish — never an upgrade CTA.
    var options = direction === 'flat'
      ? []
      : [{ kind: 'open_dish', dish: dish, label: tt(locale, 'Open ' + dish, 'Abre ' + dish) }];

    return {
      show: true, dish: dish, spark: spark,
      netDeltaPct: Math.round(netDeltaPct * 10) / 10, direction: direction,
      windowLabel: win, firstCents: firstCents, lastCents: lastCents,
      headline: headline, options: options, reason: 'history'
    };
  }

  var api = { build: build, FLAT_PCT: FLAT_PCT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinCostHistory = api;
  if (root) root.MuntinCostHistory = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
