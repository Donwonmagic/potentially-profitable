/**
 * Muntin — Pressure accuracy + regime-breaker.
 *
 * The honest credibility mechanic (the Atlanta-Fed-GDPNow move): keep a public
 * record of how often the inferred Pressure arrow was RIGHT, and auto-suppress
 * an item to "under review" when the model goes through a cold streak — the lead
 * relationships can break (avian flu, a feed shock, a trade ban), and a frozen
 * rule must not keep asserting a direction it's getting wrong.
 *
 * A call is scored once the NEXT measured price prints: a 'building' call is a
 * HIT if the realized measured trend was 'up', 'easing' if 'down', 'steady' if
 * 'flat'. Nothing is forecast here — we only compare a past call to a past
 * outcome. No price ever appears.
 *
 *   realizedExpectation(direction) -> 'up'|'down'|'flat'|null
 *   scoreCalls(pairs)  -> { n, hits, hitRate, missStreak }
 *      pairs = [{ predicted:'building'|'easing'|'steady', realized:'up'|'down'|'flat' }]
 *   shouldSuppress(pairs, opts) -> boolean   (regime-breaker)
 *   summary(pairs, es)  -> plain-language track-record phrase | ''
 *
 * Pure, deterministic, no DOM/network. Node: module.exports. Browser: window.MuntinPressureAccuracy.
 */
(function (root) {
  'use strict';
  var EXPECT = { building: 'up', easing: 'down', steady: 'flat' };

  function realizedExpectation(direction) { return EXPECT[direction] || null; }

  function scoreCalls(pairs) {
    var scored = (pairs || []).filter(function (p) { return p && EXPECT[p.predicted] && p.realized; });
    var hits = 0;
    var nonSteady = 0;
    scored.forEach(function (p) {
      if (EXPECT[p.predicted] === p.realized) hits++;
      // A real directional call (building/easing) — not 'steady'. Counted so the
      // proving gate can refuse to "prove" a rule that only ever called flat: a
      // perpetual 'steady' call racks up a high hitRate (flat is the common case)
      // without the model ever sticking its neck out. The non-steady floor closes
      // that loophole — see pressureProven in the page/seed builders.
      if (p.predicted !== 'steady') nonSteady++;
    });
    // Trailing miss-streak: consecutive misses counting back from the newest.
    var streak = 0;
    for (var i = scored.length - 1; i >= 0; i--) {
      if (EXPECT[scored[i].predicted] === scored[i].realized) break;
      streak++;
    }
    return { n: scored.length, hits: hits, hitRate: scored.length ? +(hits / scored.length).toFixed(3) : null, missStreak: streak, nonSteady: nonSteady };
  }

  // Regime-breaker: enough scored calls AND a cold streak → suppress the arrow.
  function shouldSuppress(pairs, opts) {
    opts = opts || {};
    var minN = opts.minN != null ? opts.minN : 4;
    var maxStreak = opts.maxStreak != null ? opts.maxStreak : 3;
    var s = scoreCalls(pairs);
    return s.n >= minN && s.missStreak >= maxStreak;
  }

  function summary(pairs, es) {
    var s = scoreCalls(pairs);
    if (!s.n) return '';
    if (es) return 'Acertó ' + s.hits + ' de las últimas ' + s.n + ' lecturas medidas.';
    return 'Right on ' + s.hits + ' of the last ' + s.n + ' measured prints.';
  }

  var api = { realizedExpectation: realizedExpectation, scoreCalls: scoreCalls, shouldSuppress: shouldSuppress, summary: summary };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinPressureAccuracy = api;
  if (root) root.MuntinPressureAccuracy = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
