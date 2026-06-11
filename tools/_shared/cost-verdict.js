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
        return {
          tone: 'reprice', verb_en: 'Consider re-pricing', verb_es: 'Considera ajustar el precio',
          note_en: 'Up and holding' + (wk ? ' for ' + wk + ' weeks' : '') + ' — this looks like a real reset, not a blip. Many operators would re-price the dishes that use it.',
          note_es: 'Sube y se mantiene' + (wk ? ' por ' + wk + ' semanas' : '') + ' — parece un cambio real, no un repunte. Muchos operadores ajustarían el precio de los platillos que lo usan.'
        };
      case 'spike':
        return {
          tone: 'hold', verb_en: 'Hold', verb_es: 'Espera',
          note_en: 'Jumped, then pulled back — this often reverts. Re-pricing now risks chasing a number that is already falling.',
          note_es: 'Subió y luego bajó — suele revertir. Ajustar ahora arriesga perseguir un número que ya está cayendo.'
        };
      case 'easing':
        return {
          tone: 'hold', verb_en: 'Hold', verb_es: 'Espera',
          note_en: 'Easing — this can be a chance to renegotiate, not a reason to re-price.',
          note_es: 'Bajando — puede ser oportunidad de renegociar, no razón para reajustar.'
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
