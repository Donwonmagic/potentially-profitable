/**
 * Muntin — Yield-truth ("your kitchen beats the book", insight E9).
 *
 * When an operator MEASURES a yield that differs from the textbook (CIA) number,
 * their real costs should follow their kitchen, not a manual. This computes what
 * a corrected yield does to every dish that uses the ingredient: a higher
 * measured yield (you waste less than the book assumes) lowers the EP cost; a
 * lower one means the book was understating your true cost. Either way the
 * operator's numbers get more honest — this is an ACCURACY insight, not an alarm.
 *
 * The unity that makes it possible: a per-ingredient learned yield × every recipe
 * that uses it × that ingredient's costed share of each plate.
 *
 * Honesty discipline:
 *   - Yields outside [0.05, 1.05] are rejected as typos (matches the plate-cost
 *     clamp) → no card.
 *   - A move under 3 percentage points is "your kitchen matches the book" — calm,
 *     no card. No nudge to act on noise.
 *   - The math is exact: new EP cost = cost × (bookYield / learnedYield). The
 *     saving (or increase) per dish is shown from the dish's own costed share;
 *     a weekly figure appears only when covers exist (never invented).
 *   - The "under" direction is stated plainly ("your real cost is higher than the
 *     book showed") — the truth, even when it isn't the happy direction.
 *
 * Pure, deterministic, no DOM/network/LLM. EN + ES first-class. Browser:
 * window.MuntinYieldTruth. Node: module.exports.
 *
 * PARITY CONTRACT. Source of truth for the yield-truth copy; the Ledger TS port
 * is behaviour-identical and yield-truth.test.mjs mirrors verbatim.
 *
 * @param {{
 *   ingredient:string, bookYield:number, learnedYield:number,
 *   dishes:Array<{dish:string, ingredientCostCents:number, coversPerWeek?:(number|null)}>,
 *   locale?:('en'|'es')
 * }} input
 * @returns {{
 *   show:boolean, ingredient:string, bookYield:number, learnedYield:number,
 *   direction:('beats'|'under'|null),
 *   dishes:Array<{dish:string, savingCents:number, coversPerWeek:(number|null)}>,
 *   count:number, weeklyTotalCents:(number|null), headline:(string|null),
 *   options:Array<{kind:string, ingredient?:string, label:string}>, reason:string
 * }}
 */
(function (root) {
  'use strict';

  var MATERIAL = 0.03;   // < 3 percentage-point change → matches the book (calm)
  var YIELD_MIN = 0.05, YIELD_MAX = 1.05; // typo guardrails

  function tt(locale, en, es) { return locale === 'es' ? es : en; }
  function money(cents) { return '$' + (Math.abs(cents) / 100).toFixed(2); }
  function yPct(y) { return Math.round(y * 100) + '%'; }
  function validYield(y) { return typeof y === 'number' && isFinite(y) && y >= YIELD_MIN && y <= YIELD_MAX; }

  function none(ingredient, bookYield, learnedYield, reason) {
    return { show: false, ingredient: ingredient, bookYield: bookYield, learnedYield: learnedYield, direction: null, dishes: [], count: 0, weeklyTotalCents: null, headline: null, options: [], reason: reason };
  }

  function build(input) {
    input = input || {};
    var locale = input.locale === 'es' ? 'es' : 'en';
    var ing = input.ingredient || tt(locale, 'that ingredient', 'ese ingrediente');
    var book = input.bookYield, learned = input.learnedYield;

    if (!validYield(book) || !validYield(learned)) return none(ing, book, learned, 'invalid-yield');
    var diff = learned - book;
    if (Math.abs(diff) < MATERIAL) return none(ing, book, learned, 'matches-book');

    var ratio = book / learned; // new EP cost = old × ratio
    var scored = (Array.isArray(input.dishes) ? input.dishes : [])
      .filter(function (d) { return d && d.dish && typeof d.ingredientCostCents === 'number' && isFinite(d.ingredientCostCents) && d.ingredientCostCents > 0; })
      .map(function (d) {
        var covers = (typeof d.coversPerWeek === 'number' && isFinite(d.coversPerWeek) && d.coversPerWeek > 0) ? d.coversPerWeek : null;
        return { dish: d.dish, savingCents: Math.round(d.ingredientCostCents * (1 - ratio)), coversPerWeek: covers };
      })
      .filter(function (s) { return s.savingCents !== 0; })
      .sort(function (a, b) { return Math.abs(b.savingCents) - Math.abs(a.savingCents); });

    if (!scored.length) return none(ing, book, learned, 'no-dishes');

    var direction = diff > 0 ? 'beats' : 'under';
    var hasCovers = scored.some(function (s) { return s.coversPerWeek; });
    var weeklyTotalCents = hasCovers
      ? scored.reduce(function (sum, s) { return sum + (s.coversPerWeek ? s.savingCents * s.coversPerWeek : 0); }, 0)
      : null;
    var count = scored.length;
    var top = scored[0];
    var dishWord = tt(locale, count === 1 ? ' dish' : ' dishes', count === 1 ? ' platillo' : ' platillos');

    var headline;
    if (direction === 'beats') {
      headline = hasCovers
        ? tt(locale,
            'You measured it: ' + ing + ' yields ' + yPct(learned) + ' in your kitchen, not the book’s ' + yPct(book) + '. Across ' + count + dishWord + ' that trims about ' + money(weeklyTotalCents) + '/week — your costs now match your kitchen, not a manual.',
            'Lo mediste: ' + ing + ' rinde ' + yPct(learned) + ' en tu cocina, no el ' + yPct(book) + ' del libro. En ' + count + dishWord + ' eso recorta como ' + money(weeklyTotalCents) + ' por semana — tus costos ahora reflejan tu cocina, no un manual.')
        : tt(locale,
            'You measured it: ' + ing + ' yields ' + yPct(learned) + ' in your kitchen, not the book’s ' + yPct(book) + '. That lowers your cost on ' + count + dishWord + ' — ' + top.dish + ' drops ' + money(top.savingCents) + '/plate. Your costs now match your kitchen, not a manual.',
            'Lo mediste: ' + ing + ' rinde ' + yPct(learned) + ' en tu cocina, no el ' + yPct(book) + ' del libro. Eso baja tu costo en ' + count + dishWord + ' — ' + top.dish + ' baja ' + money(top.savingCents) + ' por plato. Tus costos ahora reflejan tu cocina, no un manual.');
    } else {
      headline = hasCovers
        ? tt(locale,
            'Heads up: you measured ' + ing + ' at ' + yPct(learned) + ', below the book’s ' + yPct(book) + '. Your real cost on ' + count + dishWord + ' runs about ' + money(weeklyTotalCents) + '/week higher than the book showed — better to know than to guess.',
            'Aviso: mediste ' + ing + ' en ' + yPct(learned) + ', debajo del ' + yPct(book) + ' del libro. Tu costo real en ' + count + dishWord + ' es como ' + money(weeklyTotalCents) + ' por semana más de lo que mostraba el libro — mejor saberlo que adivinarlo.')
        : tt(locale,
            'Heads up: you measured ' + ing + ' at ' + yPct(learned) + ', below the book’s ' + yPct(book) + '. Your real cost on ' + count + dishWord + ' is higher than the book showed — ' + top.dish + ' is ' + money(top.savingCents) + '/plate more. Better to know.',
            'Aviso: mediste ' + ing + ' en ' + yPct(learned) + ', debajo del ' + yPct(book) + ' del libro. Tu costo real en ' + count + dishWord + ' es mayor de lo que mostraba el libro — ' + top.dish + ' cuesta ' + money(top.savingCents) + ' por plato más. Mejor saberlo.');
    }

    return {
      show: true, ingredient: ing, bookYield: book, learnedYield: learned,
      direction: direction, dishes: scored, count: count, weeklyTotalCents: weeklyTotalCents,
      headline: headline,
      options: [{ kind: 'apply_yield', ingredient: ing, label: tt(locale, 'Apply to all', 'Aplicar a todos') }],
      reason: direction === 'beats' ? 'beats-book' : 'under-book'
    };
  }

  var api = { build: build, MATERIAL: MATERIAL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinYieldTruth = api;
  if (root) root.MuntinYieldTruth = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
