/**
 * Muntin — Vendor-switch card (flagship insight E2: "you already buy it cheaper").
 *
 * The operator-facing card over the existing cross-vendor engine
 * (tools/_shared/cross-vendor.js `compare` + `projectMonthlySaving`): when the
 * operator buys the same product from two-plus vendors and one has been steadily
 * cheaper on the same base unit, name the recoverable $/week and offer a one-tap
 * re-bind. Single-tenant — entirely the operator's own invoices — so no cohort,
 * no antitrust gate. The catalog ranks this the first thing to ship.
 *
 * Honesty discipline in the copy:
 *   - The number is the EXACT one cross-vendor returns: `gapPctVsCheapest` is how
 *     much MORE the current vendor runs, so we say "running about 9% more than
 *     <cheaper>" — never "<cheaper> is 9% cheaper" (that needs the inverse, and
 *     would slightly overstate). Loss-framed on the price, not the owner.
 *   - Only fires on a MATERIAL, persisted gap (cross-vendor already enforces a
 *     >= 3-sample-per-vendor bar; we add a material-gap floor). A 1% wobble is
 *     not a switch story — the calm "already your cheapest" state shows no CTA.
 *   - Never invents dollars: no `projectMonthlySaving` result → the headline
 *     drops the $/week clause rather than guessing.
 *
 * Pure, deterministic, no DOM/network/LLM. EN + ES first-class. Browser:
 * window.MuntinVendorSwitch. Node: module.exports.
 *
 * PARITY CONTRACT. Source of truth for the vendor-switch copy; the Ledger TS
 * port is behaviour-identical and vendor-switch.test.mjs mirrors verbatim.
 *
 * @param {{
 *   compareRows:(Array<{vendor:string,medianComparable:number,comparableUnit:string,observations:number,gapPctVsCheapest:number}>|null),
 *   currentVendor:string, ingredient:string,
 *   saving?:({savingPerWeek:number,targetVendor:string}|null), locale?:('en'|'es')
 * }} input
 * @returns {{
 *   tier:('switch'|'best'|'none'), show:boolean, headline:(string|null),
 *   options:Array<{kind:string,label:string}>, savingPerWeek:(number|null),
 *   gapPct:(number|null), cheaperVendor:(string|null), reason:string
 * }}
 */
(function (root) {
  'use strict';

  var MATERIAL_GAP_PCT = 3; // below this, not worth a switch — stay calm/green

  function tt(locale, en, es) { return locale === 'es' ? es : en; }
  function money(n) { return '$' + Math.round(n); }

  function build(input) {
    input = input || {};
    var locale = input.locale === 'es' ? 'es' : 'en';
    var rows = input.compareRows;
    var ing = input.ingredient || tt(locale, 'this item', 'este producto');
    var current = input.currentVendor;

    function none(reason) {
      return { tier: 'none', show: false, headline: null, options: [], savingPerWeek: null, gapPct: null, cheaperVendor: null, reason: reason };
    }
    if (!Array.isArray(rows) || rows.length < 2) return none('insufficient-vendors');

    var cheapest = rows[0]; // cross-vendor returns cheapest-first
    var mine = null;
    for (var i = 0; i < rows.length; i++) { if (rows[i].vendor === current) { mine = rows[i]; break; } }
    if (!mine) return none('current-vendor-not-found');

    var gap = Math.round(mine.gapPctVsCheapest || 0);

    // Already on the cheapest vendor, or the gap is immaterial → calm, no CTA.
    if (mine.vendor === cheapest.vendor || gap < MATERIAL_GAP_PCT) {
      return {
        tier: 'best', show: false,
        headline: tt(locale,
          'Your ' + ing + ' is already from your cheapest vendor. Nothing to do.',
          'Tu ' + ing + ' ya viene de tu proveedor más barato. Nada que hacer.'),
        options: [], savingPerWeek: null, gapPct: gap,
        cheaperVendor: cheapest.vendor, reason: mine.vendor === cheapest.vendor ? 'already-cheapest' : 'gap-immaterial'
      };
    }

    var unit = cheapest.comparableUnit || tt(locale, 'pack', 'paquete');
    var weekly = (input.saving && typeof input.saving.savingPerWeek === 'number' && input.saving.savingPerWeek > 0)
      ? Math.round(input.saving.savingPerWeek) : null;
    var saveClause = weekly != null
      ? tt(locale, ' Switching this one item saves about ' + money(weekly) + '/week.',
                   ' Cambiar este producto ahorra como ' + money(weekly) + ' por semana.')
      : tt(locale, ' Switching this one item would trim that.',
                   ' Cambiar este producto reduciría eso.');

    return {
      tier: 'switch', show: true,
      headline: tt(locale,
        'You buy ' + ing + ' from ' + rows.length + ' vendors. ' + current + ' has been running about ' + gap + '% more than ' + cheapest.vendor + ' on the same ' + unit + '.' + saveClause,
        'Compras ' + ing + ' de ' + rows.length + ' proveedores. ' + current + ' ha estado como ' + gap + '% más caro que ' + cheapest.vendor + ' en el mismo ' + unit + '.' + saveClause),
      options: [
        { kind: 'switch_vendor', label: tt(locale, 'Make ' + cheapest.vendor + ' the default', 'Pon ' + cheapest.vendor + ' de preferido') },
        { kind: 'dismiss',       label: tt(locale, 'Dismiss', 'Descartar') }
      ],
      savingPerWeek: weekly, gapPct: gap, cheaperVendor: cheapest.vendor, reason: 'cheaper-vendor-available'
    };
  }

  var api = { build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinVendorSwitch = api;
  if (root) root.MuntinVendorSwitch = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
