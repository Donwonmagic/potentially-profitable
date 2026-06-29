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

    // Strict ISO-date → UTC ms. Accepts only a YYYY-MM-DD prefix (so a full
    // timestamp like generatedAt also parses to its UTC day) and forces UTC, so an
    // operator's typed date and the series dates are NEVER on different clocks (a
    // local vs UTC mix shifts the matched read by a day near month boundaries).
    // Rejects locale formats (MM/DD/YYYY) that Date.parse would silently accept.
    function parseISODay(s) {
      if (typeof s !== 'string') return null;
      var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!m) return null;
      var ms = Date.UTC(+m[1], +m[2] - 1, +m[3]);
      return isFinite(ms) ? ms : null;
    }

    // then-vs-now — the comparison an operator actually needs: their OWN delivered
    // price change vs the market's change over the SAME stretch. A carton going up
    // tells you nothing alone — this separates "the market moved" from "my vendor
    // padded the margin." Percent-based, so it is unit- AND basis-robust: cartons,
    // pounds, even a pure index series all reduce to a movement that cancels the
    // unit.
    //
    // Honest by construction (hardened after an adversarial audit):
    //   - The market "now" endpoint is the LIVE published level + its generatedAt
    //     date (passed in), NOT the historical series tail — so the window END is a
    //     fresh read, never a stale archive point that would inflate the gap.
    //   - The series is used ONLY to find the market read nearest the operator's
    //     earlier date (the "then" endpoint). Refuses dates outside it (the UI then
    //     points to a longer history), and demands a >=14-day window.
    //   - Strict UTC date parsing; future dates rejected (strict, no slack).
    //   - Flags THIN evidence (a directional/low-confidence read, or fewer than 6
    //     market reads) so the caller can hedge instead of accusing a vendor on
    //     noise — mirroring percentileLine (>=8) and flagVerb's thin-data posture.
    //   - Rejects absurd price ratios (a fat-fingered cent value) rather than
    //     printing a runaway percentage as fact.
    //
    // opts = { thenCents, nowCents, thenDateStr, marketNowCents, marketNowDate,
    //          nowDateStr, confidence }. Pure → pinned by the test; thenVsNowSay()
    // turns it into locale prose. `dates` must be 1:1 with `values`.
    var SANE_PCT = 5;                 // |Δ| > 500% is a data-entry error, not a verdict
    var GAP_PTS = 3;                  // verdict band: <3pts divergence reads as "tracked the market".
                                      // Operational, not sourced — an illustrative threshold; the THIN
                                      // hedge below stops a noisy short window from tripping it.
    function thenVsNow(values, dates, opts) {
      opts = opts || {};
      var thenCents = opts.thenCents, nowCents = opts.nowCents;
      if (!Array.isArray(values) || !Array.isArray(dates) || dates.length !== values.length) return { ok: false, reason: 'nodata' };
      if (!(thenCents > 0) || !(nowCents > 0)) return { ok: false, reason: 'price' };
      var ownerPct = (nowCents - thenCents) / thenCents;
      if (Math.abs(ownerPct) > SANE_PCT) return { ok: false, reason: 'price' };   // runaway → check figures
      var thenMs = parseISODay(opts.thenDateStr);
      if (thenMs == null) return { ok: false, reason: 'date' };
      // Market "now" = the live level, dated by generatedAt — fresh by construction.
      var mNowV = opts.marketNowCents, mNowMs = parseISODay(opts.marketNowDate);
      if (!(mNowV > 0) || mNowMs == null) return { ok: false, reason: 'nodata' };
      if (thenMs >= mNowMs) return { ok: false, reason: 'future' };               // "then" must precede "now"
      // Market read nearest the operator's earlier date; count valid reads for the
      // thin-evidence flag.
      var best = -1, bestDiff = Infinity, reads = 0;
      for (var j = 0; j < values.length; j++) {
        if (!(typeof values[j] === 'number' && isFinite(values[j]))) continue;
        var dj = parseISODay(dates[j]); if (dj == null) continue;
        reads++;
        var diff = Math.abs(dj - thenMs);
        if (diff < bestDiff) { bestDiff = diff; best = j; }                       // ties keep the EARLIER read
      }
      if (best < 0) return { ok: false, reason: 'nodata' };
      var matchMs = parseISODay(dates[best]);
      var matchGapDays = Math.round(Math.abs(matchMs - thenMs) / 86400000);
      // Too far from any read we hold → comparing a different window. Refuse, and
      // hand back the window we DO cover so the UI can point them at it.
      if (matchGapDays > 45) return { ok: false, reason: 'outofrange', earliest: dates[0], latest: dates[dates.length - 1] };
      var winDays = Math.round((mNowMs - matchMs) / 86400000);
      if (winDays < 14) return { ok: false, reason: 'tooclose' };                 // no real window to measure
      var mThenV = values[best];
      if (!(mThenV > 0)) return { ok: false, reason: 'nodata' };
      var marketRatio = mNowV / mThenV, marketPct = marketRatio - 1;
      if (Math.abs(marketPct) > SANE_PCT) return { ok: false, reason: 'nodata' };  // archive glitch guard
      // "$ beyond the market's move": owner's then-price grown by the market's RATIO
      // (dimensionless) gives what they'd pay had they only tracked the market; the
      // shortfall is in the operator's own unit, so it is honest to state per unit.
      var impliedNowCents = thenCents * marketRatio;
      var excessCents = nowCents - impliedNowCents;
      // Staleness of the live read vs the operator's "now" (today). Normally ~0 (the
      // level refreshes daily); surfaced so a stale page self-caveats.
      var nowMs = parseISODay(opts.nowDateStr);
      var nowGapDays = (nowMs != null) ? Math.round(Math.abs(nowMs - mNowMs) / 86400000) : 0;
      var conf = opts.confidence;
      var thin = (conf === 'directional' || conf === 'low' || reads < 6);
      return {
        ok: true,
        ownerPct: ownerPct, marketPct: marketPct, gapPts: (ownerPct - marketPct) * 100,
        excessCents: excessCents, thenDate: opts.thenDateStr, marketThenDate: dates[best],
        marketNowDate: opts.marketNowDate, matchGapDays: matchGapDays, winDays: winDays,
        reads: reads, thin: thin, nowGapDays: nowGapDays
      };
    }

    // Locale prose for thenVsNow(). Returns { ok, tone, headline, detail, note,
    // srText } on a real comparison, a soft { ok:false, tone:'info', headline } when
    // the input is usable but the window is not (out of range / too close / future),
    // or null when the input is simply incomplete (so the UI stays silent). Leads
    // with plain language + a dollar-per-unit figure — never "percentage points",
    // the one number an operator can repeat to a vendor.
    function pctWord(pct) {
      var a = Math.abs(pct * 100);
      var str = a.toFixed(a < 10 ? 1 : 0).replace(/\.0$/, '') + '%';
      var word = pct > 0.005 ? L('up', 'subió') : pct < -0.005 ? L('down', 'bajó') : L('flat', 'sin cambio');
      return { word: word, str: str, flat: Math.abs(pct) <= 0.005 };
    }
    function thenVsNowSay(res, unit) {
      var per = unit || L('unit', 'unidad');
      if (!res || !res.ok) {
        switch (res && res.reason) {
          case 'outofrange':
            return { ok: false, tone: 'info',
              headline: L('That date is before the market history I have (' + (res.earliest || '') + ' to ' + (res.latest || '') + ').',
                          'Esa fecha es anterior al historial de mercado que tengo (' + (res.earliest || '') + ' a ' + (res.latest || '') + ').'),
              detail: L('Pick a date inside that range — or keep your own longer price history in Muntin Ledger.',
                        'Elige una fecha dentro de ese rango — o guarda tu propio historial de precios en Muntin Ledger.') };
          case 'tooclose':
            return { ok: false, tone: 'info',
              headline: L('Those dates are too close to compare — use an earlier delivery.',
                          'Esas fechas están muy cerca para comparar — usa una entrega anterior.'), detail: '' };
          case 'future':
            return { ok: false, tone: 'info',
              headline: L('That date is in the future — use the date on an earlier invoice.',
                          'Esa fecha es futura — usa la fecha de una factura anterior.'), detail: '' };
          default:
            return null;   // price/date/nodata → incomplete or implausible input, say nothing
        }
      }
      var o = pctWord(res.ownerPct), m = pctWord(res.marketPct);
      // "up 12%" / "down 4%" / "flat" — drop the redundant "0%" on a flat market.
      var youAmt = o.flat ? L('flat', 'sin cambio') : o.word + ' ' + o.str;
      var mktAmt = m.flat ? L('flat', 'sin cambio') : m.word + ' ' + m.str;
      var window = res.marketThenDate + ' ' + L('to', 'a') + ' ' + res.marketNowDate;
      var youLine = L('Your price is ' + youAmt + ' since ' + res.thenDate + '; wholesale is ' + mktAmt + ' over the same stretch (' + window + ').',
                      'Tu precio está ' + youAmt + ' desde el ' + res.thenDate + '; el mayoreo está ' + mktAmt + ' en el mismo tramo (' + window + ').');
      var tone, headline, detail;
      if (res.thin) {
        // Audit BLOCKER 2: a hard "your vendor padded" verdict from a thin/short
        // series is not defensible. Show the comparison, withhold the accusation.
        tone = 'watch';
        headline = L('Too little market history here to call it yet.',
                     'Aún hay poco historial de mercado para concluir.');
        detail = youLine + ' ' + L('Treat this as a watch, not a verdict — the reads behind it are thin.',
                                   'Tómalo como algo para vigilar, no una conclusión — hay pocas lecturas detrás.');
      } else if (res.gapPts >= GAP_PTS) {
        tone = 'over';
        headline = L('About ' + money(res.excessCents) + ' a ' + per + ' beyond the market’s move.',
                     'Unos ' + money(res.excessCents) + ' por ' + per + ' más allá del movimiento del mercado.');
        detail = youLine + ' ' + L('Could be a new freight or pack cost — or room to renegotiate. Worth one question to your rep.',
                                   'Puede ser un nuevo costo de flete o empaque — o margen para renegociar. Vale una pregunta a tu proveedor.');
      } else if (res.gapPts <= -GAP_PTS) {
        tone = 'under';
        headline = L('About ' + money(-res.excessCents) + ' a ' + per + ' under the market’s move — a good spot.',
                     'Unos ' + money(-res.excessCents) + ' por ' + per + ' por debajo del movimiento del mercado — buen lugar.');
        detail = youLine + ' ' + L('You — or your vendor — absorbed part of the rise. Nothing to chase here.',
                                   'Tú — o tu proveedor — absorbieron parte del alza. Nada que perseguir aquí.');
      } else {
        tone = 'match';
        headline = L('Confirmed — this move was the market, not your vendor.',
                     'Confirmado — este movimiento fue del mercado, no de tu proveedor.');
        detail = youLine + ' ' + L('You are not being padded here; little to renegotiate on price alone.',
                                   'No te están inflando aquí; poco que renegociar solo por precio.');
      }
      var notes = [];
      if (res.matchGapDays > 10) notes.push(L('Nearest market read to your date is ' + res.marketThenDate + ', about ' + res.matchGapDays + ' days off.',
                                              'La lectura de mercado más cercana a tu fecha es ' + res.marketThenDate + ', a unos ' + res.matchGapDays + ' días.'));
      if (res.nowGapDays > 14) notes.push(L('The latest market read is ' + res.marketNowDate + ', about ' + res.nowGapDays + ' days old — the market may have moved since.',
                                            'La lectura de mercado más reciente es ' + res.marketNowDate + ', de hace unos ' + res.nowGapDays + ' días — el mercado pudo moverse desde entonces.'));
      var note = notes.join(' ');
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
