/**
 * cost-index-format.js — operator-facing honesty phrasing for the Cost Index.
 *
 * The pure (DOM-free) text helpers extracted from cost-index-ui.js so they can be
 * unit-tested in Node: the weekly "shape" sentence, the percentile-of-history COUNT
 * (never a smoothed percentile), the gap-safe week-over-week step, and the
 * buy/hold/watch verb. These render numbers an operator reads and repeats, so the
 * honesty rules (gaps stay gaps, $-anchored %, count-not-curve, thin→hedge) are
 * pinned by cost-index-format.test.mjs.
 *
 * Browser: `var F = MuntinCostFormat(es);` then `F.percentileLine(values)` etc.
 * Node:    `const make = require('./cost-index-format.js'); const F = make(false);`
 * Loaded as a global <script> before cost-index-ui.js, mirroring composite-price.js.
 */
(function (root) {
  'use strict';

  function make(es) {
    function L(en, esStr) { return es ? esStr : en; }
    function money(c) { return '$' + (Math.round(c) / 100).toFixed(2); }

    // Plain-language "shape sentence" for the audio/sr text — the spark itself is
    // aria-hidden, so without this the weekly history is invisible to non-sighted
    // and low-numeracy readers. Notes gaps honestly.
    function sparkShape(values) {
      var finite = values.filter(function (v) { return typeof v === 'number' && isFinite(v); });
      if (finite.length < 2) return '';
      var first = finite[0], last = finite[finite.length - 1];
      var chg = (last - first) / (first || 1);
      var dir = Math.abs(chg) < 0.04 ? L('held about steady', 'se mantuvo estable')
        : chg > 0 ? L('rose over the period', 'subió en el periodo')
          : L('eased over the period', 'bajó en el periodo');
      var gaps = values.some(function (v) { return !(typeof v === 'number' && isFinite(v)); })
        ? L(' (some weeks missing)', ' (faltan algunas semanas)') : '';
      return L('Weekly price ' + dir + gaps + '.', 'El precio semanal ' + dir + gaps + '.');
    }

    // Percentile-of-history, stated as an honest COUNT (never a smoothed "85th
    // percentile" — that implies a fitted distribution we don't have). Separates
    // "expensive" from "rising": today can sit inside the typical band yet at the
    // top of its OWN recent range. Needs >=8 valid weekly reads; the window is all
    // the history that exists, so we say "of its last N" — never "all-time".
    function percentileLine(values) {
      var v = values.filter(function (x) { return typeof x === 'number' && isFinite(x); });
      if (v.length < 8) return '';
      var today = v[v.length - 1];
      var prior = v.slice(0, v.length - 1);
      var below = prior.filter(function (x) { return x <= today; }).length;
      var n = prior.length;
      var bucket = below >= n * 0.75 ? L(' — near the top of its recent range.', ' — cerca del tope de su rango reciente.')
        : below <= n * 0.25 ? L(' — near the bottom of its recent range.', ' — cerca del fondo de su rango reciente.')
          : L(' — around the middle of its recent range.', ' — cerca de la mitad de su rango reciente.');
      return L('Higher than ' + below + ' of its last ' + n + ' weekly reads', 'Más alto que ' + below + ' de sus últimas ' + n + ' lecturas semanales') + bucket;
    }

    // Week-over-week — the single most recent step, the number operators repeat
    // ("eggs up a dime a dozen since last week"). Honest across cadences: finds
    // the read closest to 7 days before the latest (window 4–11 days), never an
    // index-1 guess that could span a month of gaps. Anchors the % to a dollar.
    // Skipped on index/directional reads (a $ delta would be meaningless). Returns
    // { text, srText } or null. `dates` must be 1:1 with `values`.
    function weekOverWeek(values, dates, unit) {
      if (!Array.isArray(values) || !Array.isArray(dates) || dates.length !== values.length) return null;
      var li = -1;
      for (var i = values.length - 1; i >= 0; i--) { if (typeof values[i] === 'number' && isFinite(values[i])) { li = i; break; } }
      if (li < 1) return null;
      var lastV = values[li], lastMs = Date.parse(dates[li]);
      if (!isFinite(lastMs)) return null;
      var target = lastMs - 7 * 86400000, best = -1, bestDiff = Infinity, bestMs = null;
      for (var j = 0; j < li; j++) {
        if (!(typeof values[j] === 'number' && isFinite(values[j]))) continue;
        var dj = Date.parse(dates[j]); if (!isFinite(dj)) continue;
        var ageDays = (lastMs - dj) / 86400000;
        if (ageDays < 4 || ageDays > 11) continue;             // must be ~a week back
        var diff = Math.abs(dj - target);
        if (diff < bestDiff) { bestDiff = diff; best = j; bestMs = dj; }
      }
      if (best < 0) return null;
      var prevV = values[best];
      if (!(prevV > 0)) return null;
      var deltaCents = lastV - prevV, pct = deltaCents / prevV;
      var priorDate = dates[best];
      if (Math.abs(pct) < 0.01) {
        return { text: L('About flat vs last week.', 'Casi sin cambio frente a la semana pasada.'),
          srText: L('About flat versus ' + priorDate + '.', 'Casi sin cambio frente al ' + priorDate + '.') };
      }
      var dirW = deltaCents > 0 ? L('up', 'arriba') : L('down', 'abajo');
      var pctStr = (pct > 0 ? '+' : '−') + Math.abs(pct * 100).toFixed(Math.abs(pct * 100) < 10 ? 1 : 0).replace(/\.0$/, '') + '%';
      var dollarStr = money(Math.abs(deltaCents)) + ' ' + L('a ', 'por ') + unit;
      return {
        text: L('Vs last week: ' + dirW + ' ' + pctStr + ' — about ' + dollarStr + '.',
                'Frente a la semana pasada: ' + dirW + ' ' + pctStr + ' — unos ' + dollarStr + '.'),
        srText: L('Versus ' + priorDate + ': ' + dirW + ' ' + pctStr + ', about ' + dollarStr + '.',
                  'Frente al ' + priorDate + ': ' + dirW + ' ' + pctStr + ', unos ' + dollarStr + '.')
      };
    }

    // Buy/hold/watch verb from the spike-vs-structural flag, hedged by confidence:
    // thin data never says "re-price". Returns { tone, verb, note } or null.
    function flagVerb(flag, confidence) {
      if (!flag || !flag.verdict) return null;
      var thin = confidence === 'low' || confidence === 'directional';
      var wk = flag.elevatedWeeks;
      switch (flag.verdict) {
        case 'structural':
          if (thin) return { tone: 'watch', verb: L('Watch', 'Observa'), note: L('Up and holding, but the data is thin — wait for more before a big call.', 'Sube y se mantiene, pero hay pocos datos — espera más antes de una decisión grande.') };
          return { tone: 'reprice', verb: L('Consider re-pricing', 'Considera ajustar el precio'), note: L('Up and holding' + (wk ? ' for ' + wk + ' weeks' : '') + ' — this looks like a real reset, not a blip. Many operators would re-price the dishes that use it.', 'Sube y se mantiene' + (wk ? ' por ' + wk + ' semanas' : '') + ' — parece un cambio real, no un repunte. Muchos operadores ajustarían el precio de los platillos que lo usan.') };
        case 'spike':
          return { tone: 'hold', verb: L('Hold', 'Espera'), note: L('Jumped, then pulled back — this often reverts. Re-pricing now risks chasing a number that is already falling.', 'Subió y luego bajó — suele revertir. Ajustar ahora arriesga perseguir un número que ya está cayendo.') };
        case 'easing':
          return { tone: 'hold', verb: L('Hold', 'Espera'), note: L('Easing — this can be a chance to renegotiate, not a reason to re-price.', 'Bajando — puede ser oportunidad de renegociar, no razón para reajustar.') };
        case 'emerging':
          return { tone: 'watch', verb: L('Watch', 'Observa'), note: L('A real move, but it has not held yet. Give it a couple of weeks.', 'Un movimiento real, pero aún no se sostiene. Dale un par de semanas.') };
        case 'flat':
          return { tone: 'hold', verb: L('Hold', 'Espera'), note: L('Inside its usual range — nothing to do.', 'Dentro de su rango usual — nada que hacer.') };
        default: // insufficient
          return { tone: 'watch', verb: L('Watch', 'Observa'), note: L('Too new to call — too little history so far. Treat the price as real until a pattern shows.', 'Muy nuevo para concluir — poco historial aún. Trata el precio como real hasta que se vea un patrón.') };
      }
    }

    // Vs-last-year — the figure operators actually repeat ("eggs are double last
    // year"). Same gap-safe discipline as weekOverWeek: the read closest to 365
    // days back, inside a 330–400-day window, so a thin series never fakes a
    // year-ago comparison. $-anchored; "about double/half" when the ratio is near
    // 2× / ½×. Returns { text, srText } or null — DORMANT until ~a year of history
    // exists, so it self-activates without any code change.
    function vsLastYear(values, dates, unit) {
      if (!Array.isArray(values) || !Array.isArray(dates) || dates.length !== values.length) return null;
      var li = -1;
      for (var i = values.length - 1; i >= 0; i--) { if (typeof values[i] === 'number' && isFinite(values[i])) { li = i; break; } }
      if (li < 1) return null;
      var lastV = values[li], lastMs = Date.parse(dates[li]);
      if (!isFinite(lastMs)) return null;
      var target = lastMs - 365 * 86400000, best = -1, bestDiff = Infinity;
      for (var j = 0; j < li; j++) {
        if (!(typeof values[j] === 'number' && isFinite(values[j]))) continue;
        var dj = Date.parse(dates[j]); if (!isFinite(dj)) continue;
        var ageDays = (lastMs - dj) / 86400000;
        if (ageDays < 330 || ageDays > 400) continue;          // ~a year back (±~5 weeks)
        var diff = Math.abs(dj - target);
        if (diff < bestDiff) { bestDiff = diff; best = j; }
      }
      if (best < 0) return null;
      var prevV = values[best];
      if (!(prevV > 0)) return null;
      var deltaCents = lastV - prevV, pct = deltaCents / prevV, ratio = lastV / prevV;
      var priorDate = dates[best];
      if (Math.abs(pct) < 0.03) {
        return { text: L('About the same as a year ago.', 'Casi igual que hace un año.'),
          srText: L('About the same as ' + priorDate + '.', 'Casi igual que el ' + priorDate + '.') };
      }
      var dirW = deltaCents > 0 ? L('up', 'arriba') : L('down', 'abajo');
      var mult = (ratio >= 1.8 && ratio <= 2.2) ? L(' (about double)', ' (casi el doble)')
        : (ratio >= 0.45 && ratio <= 0.55) ? L(' (about half)', ' (casi la mitad)') : '';
      var pctStr = (pct > 0 ? '+' : '−') + Math.abs(pct * 100).toFixed(Math.abs(pct * 100) < 10 ? 1 : 0).replace(/\.0$/, '') + '%';
      var dollarStr = money(Math.abs(deltaCents)) + ' ' + L('a ', 'por ') + unit;
      return {
        text: L('Vs last year: ' + dirW + ' ' + pctStr + mult + ' — about ' + dollarStr + '.',
                'Frente al año pasado: ' + dirW + ' ' + pctStr + mult + ' — unos ' + dollarStr + '.'),
        srText: L('Versus ' + priorDate + ': ' + dirW + ' ' + pctStr + mult + ', about ' + dollarStr + '.',
                  'Frente al ' + priorDate + ': ' + dirW + ' ' + pctStr + mult + ', unos ' + dollarStr + '.')
      };
    }

    // then-vs-now — the comparison an operator actually needs: their OWN delivered
    // price change vs the market's change over the SAME stretch. A carton going up
    // tells you nothing alone — this separates "the market moved" from "my vendor
    // padded the margin." Percent-based, so it is unit- AND basis-robust: cartons,
    // pounds, even a pure index series all reduce to a movement that cancels the
    // unit. Honest by construction — it names the real market dates it used, refuses
    // when the operator's date falls outside the series (the UI then points them at
    // a longer history), and demands a >=14-day window so a too-tight pair cannot
    // manufacture a verdict. Pure numeric + reason code → pinned by the test;
    // thenVsNowSay() turns it into locale prose. `dates` must be 1:1 with `values`.
    function thenVsNow(values, dates, thenCents, nowCents, thenDateStr) {
      if (!Array.isArray(values) || !Array.isArray(dates) || dates.length !== values.length) return { ok: false, reason: 'nodata' };
      if (!(thenCents > 0) || !(nowCents > 0)) return { ok: false, reason: 'price' };
      var thenMs = Date.parse(thenDateStr);
      if (!isFinite(thenMs)) return { ok: false, reason: 'date' };
      var li = -1;
      for (var i = values.length - 1; i >= 0; i--) { if (typeof values[i] === 'number' && isFinite(values[i])) { li = i; break; } }
      if (li < 1) return { ok: false, reason: 'nodata' };
      var mNowV = values[li], mNowMs = Date.parse(dates[li]);
      if (!isFinite(mNowMs)) return { ok: false, reason: 'nodata' };
      if (thenMs > mNowMs + 86400000) return { ok: false, reason: 'future' };   // "then" after the latest read
      // market read nearest the operator's earlier date
      var best = -1, bestDiff = Infinity;
      for (var j = 0; j <= li; j++) {
        if (!(typeof values[j] === 'number' && isFinite(values[j]))) continue;
        var dj = Date.parse(dates[j]); if (!isFinite(dj)) continue;
        var diff = Math.abs(dj - thenMs);
        if (diff < bestDiff) { bestDiff = diff; best = j; }
      }
      if (best < 0) return { ok: false, reason: 'nodata' };
      var matchMs = Date.parse(dates[best]);
      var matchGapDays = Math.round(Math.abs(matchMs - thenMs) / 86400000);
      // Too far from any read we hold → comparing a different window. Refuse, and
      // hand back the window we DO cover so the UI can point them at it.
      if (matchGapDays > 45) return { ok: false, reason: 'outofrange', earliest: dates[0], latest: dates[li] };
      if (best >= li) return { ok: false, reason: 'tooclose' };   // matched the latest read — no window
      var winDays = Math.round((mNowMs - matchMs) / 86400000);
      if (winDays < 14) return { ok: false, reason: 'tooshort' };
      var mThenV = values[best];
      if (!(mThenV > 0)) return { ok: false, reason: 'nodata' };
      var marketPct = (mNowV - mThenV) / mThenV;
      var ownerPct = (nowCents - thenCents) / thenCents;
      return {
        ok: true,
        ownerPct: ownerPct, marketPct: marketPct, gapPts: (ownerPct - marketPct) * 100,
        thenDate: thenDateStr, marketThenDate: dates[best], marketNowDate: dates[li],
        matchGapDays: matchGapDays, winDays: winDays
      };
    }

    // Locale prose for thenVsNow(). Returns { ok, tone, headline, detail, note,
    // srText } on a real comparison, a soft { ok:false, tone:'info', headline } when
    // the input is usable but the window is not (out of range / too close / future),
    // or null when the input is simply incomplete (so the UI stays silent).
    function pctWord(pct) {
      var a = Math.abs(pct * 100);
      var str = a.toFixed(a < 10 ? 1 : 0).replace(/\.0$/, '') + '%';
      var word = pct > 0.005 ? L('up', 'arriba') : pct < -0.005 ? L('down', 'abajo') : L('flat', 'sin cambio');
      return { word: word, str: str };
    }
    function thenVsNowSay(res) {
      if (!res || !res.ok) {
        switch (res && res.reason) {
          case 'outofrange':
            return { ok: false, tone: 'info',
              headline: L('That date is before the market history I have (' + (res.earliest || '') + ' to ' + (res.latest || '') + ').',
                          'Esa fecha es anterior al historial de mercado que tengo (' + (res.earliest || '') + ' a ' + (res.latest || '') + ').'),
              detail: L('Pick a date inside that range — or keep your own longer price history in Muntin Ledger.',
                        'Elige una fecha dentro de ese rango — o guarda tu propio historial de precios en Muntin Ledger.') };
          case 'tooshort':
          case 'tooclose':
            return { ok: false, tone: 'info',
              headline: L('Those dates are too close to compare — use an earlier delivery.',
                          'Esas fechas están muy cerca para comparar — usa una entrega anterior.'), detail: '' };
          case 'future':
            return { ok: false, tone: 'info',
              headline: L('That date is in the future — use the date on an earlier invoice.',
                          'Esa fecha es futura — usa la fecha de una factura anterior.'), detail: '' };
          default:
            return null;   // price/date/nodata → incomplete input, say nothing
        }
      }
      var o = pctWord(res.ownerPct), m = pctWord(res.marketPct);
      var gap = Math.round(Math.abs(res.gapPts));
      var window = res.marketThenDate + ' ' + L('to', 'a') + ' ' + res.marketNowDate;
      var youLine = L('Your price is ' + o.word + ' ' + o.str + ' since ' + res.thenDate + '; wholesale is ' + m.word + ' ' + m.str + ' over the same stretch (' + window + ').',
                      'Tu precio está ' + o.word + ' ' + o.str + ' desde el ' + res.thenDate + '; el mayoreo está ' + m.word + ' ' + m.str + ' en el mismo tramo (' + window + ').');
      var tone, headline, detail;
      if (res.gapPts >= 3) {
        tone = 'over';
        headline = L('Your price outpaced the market by about ' + gap + ' points.',
                     'Tu precio superó al mercado por unos ' + gap + ' puntos.');
        detail = youLine + ' ' + L('That gap is the part the market does not explain — the place a vendor conversation can actually move.',
                                   'Esa brecha es la parte que el mercado no explica — donde una conversación con el proveedor sí puede mover algo.');
      } else if (res.gapPts <= -3) {
        tone = 'under';
        headline = L('Your price held about ' + gap + ' points better than the market.',
                     'Tu precio aguantó unos ' + gap + ' puntos mejor que el mercado.');
        detail = youLine + ' ' + L('You — or your vendor — absorbed part of the move. A good spot; nothing to chase here.',
                                   'Tú — o tu proveedor — absorbieron parte del movimiento. Buen lugar; nada que perseguir aquí.');
      } else {
        tone = 'match';
        headline = L('This tracked the market.', 'Esto siguió al mercado.');
        detail = youLine + ' ' + L('The move was the market, not your vendor — little to renegotiate on price alone.',
                                   'El movimiento fue del mercado, no de tu proveedor — poco que renegociar solo por precio.');
      }
      var note = res.matchGapDays > 10
        ? L('Nearest market read to your date is ' + res.marketThenDate + ', about ' + res.matchGapDays + ' days off.',
            'La lectura de mercado más cercana a tu fecha es ' + res.marketThenDate + ', a unos ' + res.matchGapDays + ' días.')
        : '';
      return { ok: true, tone: tone, headline: headline, detail: detail, note: note,
        srText: headline + ' ' + detail + (note ? ' ' + note : '') };
    }

    // Weekly heartbeat — a calm "you last checked {when}" marker for a returning
    // operator, computed from a LOCAL last-visit timestamp (no server, no account).
    // Deliberately no streaks, badges, counts, or urgency: it only orients in time.
    // Returns null on a first visit or a same-day return (never nags). Pure so the
    // relative phrasing is testable.
    //
    // NOT WIRED into the Cost Pulse panel: persisting the last-visit timestamp needs
    // localStorage, which /security/ claim #4 forbids for that tool (enforced by
    // check-tool-no-fetch.mjs). Wiring it is a founder decision — it would mean
    // exempting cost-pulse from claim 4, a change to a public privacy promise.
    function heartbeat(lastSeenMs, nowMs) {
      if (lastSeenMs == null || !isFinite(lastSeenMs) || !isFinite(nowMs)) return null;
      var days = Math.floor((nowMs - lastSeenMs) / 86400000);
      if (days < 1) return null;                               // same day → no nag
      var rel = days === 1 ? L('yesterday', 'ayer')
        : days < 7 ? L(days + ' days ago', 'hace ' + days + ' días')
          : days < 14 ? L('about a week ago', 'hace cerca de una semana')
            : L(Math.round(days / 7) + ' weeks ago', 'hace ' + Math.round(days / 7) + ' semanas');
      return L('You last checked these prices ' + rel + '.', 'Revisaste estos precios por última vez ' + rel + '.');
    }

    return { L: L, money: money, sparkShape: sparkShape, percentileLine: percentileLine, weekOverWeek: weekOverWeek, vsLastYear: vsLastYear, thenVsNow: thenVsNow, thenVsNowSay: thenVsNowSay, heartbeat: heartbeat, flagVerb: flagVerb };
  }

  var api = make;          // MuntinCostFormat(es) → bound, locale-aware helpers
  api.make = make;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinCostFormat = api;
  if (root) root.MuntinCostFormat = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
