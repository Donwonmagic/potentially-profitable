/**
 * Muntin — Cost Index verdict mapping (the shared "what would you do?" voice).
 *
 * ONE source of truth for turning the build-time spike/structural `flag`
 * (tools/_shared/cost-spike.js) into a calibrated, confidence-aware
 * SUGGESTION — never a command. Consumed by:
 *   - the Cost Pulse dashboard (tools/_shared/cost-index-ui.js → flagVerb)
 *   - the static ingredient pages + hub (scripts/build-cost-index-pages.mjs)
 * so the three surfaces can never drift apart (e.g. a thin-data "structural"
 * must read "Watch", not "Re-price", everywhere).
 *
 * THE HONESTY RULE: confidence governs the call. On thin data (low /
 * directional) a "structural" verdict is downgraded to Watch — the price may
 * be holding, but we can't yet back a re-price. Leads with the low-regret
 * action; HOLD is first-class. Returns bilingual fields; each caller localizes.
 *
 * Pure, deterministic, no DOM/network. Browser: window.MuntinCostVerdict.
 * Node: module.exports.
 *
 * @param {{verdict?:string, actionBias?:string, elevatedWeeks?:number}} flag
 * @param {string} confidence  'high' | 'medium' | 'low' | 'directional'
 * @returns {{tone:string, verb_en:string, verb_es:string, note_en:string, note_es:string}|null}
 *          tone ∈ 'hold' | 'watch' | 'reprice'
 */
(function (root) {
  'use strict';

  function verdict(flag, confidence) {
    if (!flag || !flag.verdict) return null;
    var thin = confidence === 'low' || confidence === 'directional';
    var wk = flag.elevatedWeeks;
    switch (flag.verdict) {
      case 'structural':
        if (thin) return {
          tone: 'watch', verb_en: 'Watch', verb_es: 'Observa',
          note_en: 'Up and holding, but the data is thin — wait for more before a big call.',
          note_es: 'Sube y se mantiene, pero hay pocos datos — espera más antes de una decisión grande.'
        };
        // Post-audit (2026-07, C3/C6): DESCRIPTION, not an imperative. A walk-forward
        // backtest on the shipped data shows "structural" mean-reverts, so "re-price"
        // was an unearned forward call. We state only what the price has done, tagged
        // "context, not advice"; "reads" not "weeks" (the count is periods, and the
        // beef series are monthly). The 'reprice' tone key is retained internally for
        // ranking/colour but now denotes the "elevated / up-and-holding" state.
        return {
          tone: 'reprice', verb_en: 'Up and holding', verb_es: 'Sube y se mantiene',
          note_en: 'Up and holding' + (wk ? ' across the last ' + wk + ' reads' : '') + ' — that describes what the price has done, not a prediction of the next move. Context, not advice.',
          note_es: 'Sube y se mantiene' + (wk ? ' en las últimas ' + wk + ' lecturas' : '') + ' — describe lo que el precio ha hecho, no una predicción del próximo movimiento. Contexto, no consejo.'
        };
      case 'spike':
        return {
          tone: 'hold', verb_en: 'Hold', verb_es: 'Espera',
          note_en: 'Jumped, then partly pulled back — that is the recent path, not a forecast of where it goes next.',
          note_es: 'Subió y luego retrocedió en parte — ese es el recorrido reciente, no un pronóstico de lo que sigue.'
        };
      case 'easing':
        return {
          tone: 'hold', verb_en: 'Hold', verb_es: 'Espera',
          note_en: 'Currently below its recent baseline — a description of the recent path, not a call on where it goes next.',
          note_es: 'Actualmente por debajo de su base reciente — una descripción del recorrido reciente, no una decisión sobre lo que sigue.'
        };
      case 'emerging':
        return {
          tone: 'watch', verb_en: 'Watch', verb_es: 'Observa',
          note_en: 'A real move, but it has not held yet. Give it a couple of weeks.',
          note_es: 'Un movimiento real, pero aún no se sostiene. Dale un par de semanas.'
        };
      case 'flat':
        return {
          tone: 'hold', verb_en: 'Hold', verb_es: 'Espera',
          note_en: 'Inside its usual range — nothing to do.',
          note_es: 'Dentro de su rango usual — nada que hacer.'
        };
      default: // insufficient
        return {
          tone: 'watch', verb_en: 'Watch', verb_es: 'Observa',
          note_en: 'Too new to call — too little history so far. Treat the price as real until a pattern shows.',
          note_es: 'Muy nuevo para concluir — poco historial aún. Trata el precio como real hasta que se vea un patrón.'
        };
    }
  }

  var api = { verdict: verdict };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinCostVerdict = api;
  if (root) root.MuntinCostVerdict = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
