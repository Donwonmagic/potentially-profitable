/**
 * Muntin — Silent-bleed leaderboard (insight E4: $/week, not %).
 *
 * The weekly-digest spine: of all the dishes a price move touched this week,
 * rank them by what they ACTUALLY cost — in dollars per week, weighted by covers
 * — not by percentage. A 2% hike on the bestseller beats a 20% hike on a dish
 * nobody orders; only the $/week join (invoices x recipes x covers) shows that.
 *
 * Honesty discipline:
 *   - $/week requires covers. A dish with no usable $/week is EXCLUDED from the
 *     ranking (never zeroed, never invented) — the count reflects only what we
 *     can stand behind.
 *   - The "fixing the top one recovers ___" phrase is computed from the real
 *     shares and rounded to an honest band ("more than half", "about 60%") — no
 *     false fraction.
 *   - Nothing bled → calm green (`show:false`), no leaderboard, no CTA.
 *
 * Pure, deterministic, no DOM/network/LLM. EN + ES first-class. Browser:
 * window.MuntinSilentBleed. Node: module.exports.
 *
 * PARITY CONTRACT. Source of truth for the leaderboard copy; the Ledger TS port
 * is behaviour-identical and silent-bleed.test.mjs mirrors verbatim.
 *
 * @param {{ impacts:Array<{dish:string,dollarsPerWeek:number}>, locale?:('en'|'es') }} input
 * @returns {{
 *   tier:('leaderboard'|'none'), show:boolean, headline:(string|null),
 *   ranked:Array<{dish:string,dollarsPerWeek:number}>, totalPerWeek:number,
 *   options:Array<{kind:string,dish?:string,label:string}>, reason:string
 * }}
 */
(function (root) {
  'use strict';

  function tt(locale, en, es) { return locale === 'es' ? es : en; }
  function money(n) { return '$' + Math.round(n); }

  function sharePhrase(locale, s) {
    if (s >= 0.72) return tt(locale, 'about three-quarters of it', 'como tres cuartas partes');
    if (s >= 0.60) return tt(locale, 'about two-thirds of it', 'como dos tercios');
    if (s >= 0.45) return tt(locale, 'more than half of it', 'más de la mitad');
    return tt(locale, 'about ' + Math.round(s * 100) + '% of it', 'como ' + Math.round(s * 100) + '%');
  }

  function build(input) {
    input = input || {};
    var locale = input.locale === 'es' ? 'es' : 'en';
    var impacts = Array.isArray(input.impacts) ? input.impacts : [];

    // Keep only real, positive weekly losses — never invent or zero a cover count.
    var ranked = impacts
      .filter(function (i) { return i && typeof i.dollarsPerWeek === 'number' && isFinite(i.dollarsPerWeek) && i.dollarsPerWeek > 0 && i.dish; })
      .map(function (i) { return { dish: i.dish, dollarsPerWeek: Math.round(i.dollarsPerWeek) }; })
      .sort(function (a, b) { return b.dollarsPerWeek - a.dollarsPerWeek; });

    if (!ranked.length) {
      return { tier: 'none', show: false, headline: null, ranked: [], totalPerWeek: 0, options: [], reason: 'nothing-bled' };
    }

    var total = ranked.reduce(function (s, r) { return s + r.dollarsPerWeek; }, 0);
    var top = ranked[0];
    var listStr = ranked.map(function (r) { return r.dish + ' -' + money(r.dollarsPerWeek); }).join(', ');
    var n = ranked.length;
    var tail = (n > 1)
      ? tt(locale, ' Start at the top — fixing ' + top.dish + ' alone recovers ' + sharePhrase(locale, top.dollarsPerWeek / total) + '.',
                   ' Empieza por arriba — arreglar ' + top.dish + ' recupera ' + sharePhrase(locale, top.dollarsPerWeek / total) + '.')
      : '';

    var headline = tt(locale,
      'This week’s price moves hit ' + n + (n === 1 ? ' dish' : ' dishes') + '. Ranked by what they cost you per week: ' + listStr + '.' + tail,
      'Los cambios de precio de esta semana tocaron ' + n + (n === 1 ? ' platillo' : ' platillos') + '. Ordenados por lo que te cuestan por semana: ' + listStr + '.' + tail);

    return {
      tier: 'leaderboard', show: true, headline: headline, ranked: ranked, totalPerWeek: total,
      options: [{ kind: 'open_dish', dish: top.dish, label: tt(locale, 'Start with ' + top.dish, 'Empieza con ' + top.dish) }],
      reason: 'dishes-bleeding'
    };
  }

  var api = { build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinSilentBleed = api;
  if (root) root.MuntinSilentBleed = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
