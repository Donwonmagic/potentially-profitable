/**
 * Muntin — Pack-shrink detector (insight E3: the silent hike the invoice hides).
 *
 * The classic vendor move: the case price stays the same but the pack quietly
 * shrinks (6x1gal -> 4x1gal), so the cost PER BASE UNIT jumps with nothing on
 * the invoice total to show for it. Muntin already normalizes every line to a
 * base unit (Ledger `cents_per_base` / `base_uom`, migration 0035), so this is
 * computable today: compare the same canonical's per-base cost across the pack
 * change, and — when the public index is flat — name the cause as the pack, not
 * the market.
 *
 * Honesty discipline:
 *   - The per-base % is exact (it is cents_per_base, already normalized) — never
 *     an AP/sticker comparison across pack sizes (that is the lie this catches).
 *   - It is only a "silent" hike when the case/sticker price stayed quiet; if the
 *     sticker ALSO moved, it is an ordinary price hike (the normal path owns it),
 *     not a pack trick — so we do not cry "pack shrink".
 *   - The "market has not moved" clause is added ONLY when the index read is
 *     confidence >= medium AND actually flat; never invented.
 *   - Same base unit on both sides or it fails closed ('unit-mismatch').
 *
 * Pure, deterministic, no DOM/network/LLM. EN + ES first-class. Browser:
 * window.MuntinPackShrink. Node: module.exports.
 *
 * PARITY CONTRACT. Source of truth for the pack-shrink copy; the Ledger TS port
 * is behaviour-identical and pack-shrink.test.mjs mirrors verbatim.
 *
 * @param {{
 *   ingredient:string,
 *   prior:{packLabel:string,centsPerBase:number,casePriceCents?:number,baseUnit:string},
 *   current:{packLabel:string,centsPerBase:number,casePriceCents?:number,baseUnit:string},
 *   market?:{deltaPct:number,confidence:string}, locale?:('en'|'es')
 * }} input
 * @returns {{
 *   tier:('pack-shrink'|'none'), show:boolean, headline:(string|null),
 *   options:Array<{kind:string,label:string}>, perBasePct:(number|null),
 *   packFrom:(string|null), packTo:(string|null), marketFlat:boolean, reason:string
 * }}
 */
(function (root) {
  'use strict';

  var MATERIAL_PER_BASE = 0.05; // per-base must jump >= 5% to be worth flagging
  var STICKER_QUIET = 0.02;     // case price moved < 2% → "looks the same price"
  var FLAT_MARKET = 0.02;       // index within +/-2% → "the market has not moved"

  function tt(locale, en, es) { return locale === 'es' ? es : en; }
  function num(x) { return typeof x === 'number' && isFinite(x); }

  function build(input) {
    input = input || {};
    var locale = input.locale === 'es' ? 'es' : 'en';
    var ing = input.ingredient || tt(locale, 'this item', 'este producto');
    var p = input.prior || {}, cur = input.current || {};

    function none(reason) {
      return { tier: 'none', show: false, headline: null, options: [], perBasePct: null, packFrom: null, packTo: null, marketFlat: false, reason: reason };
    }
    if (!num(p.centsPerBase) || !num(cur.centsPerBase) || p.centsPerBase <= 0) return none('bad-input');
    if (p.baseUnit !== cur.baseUnit) return none('unit-mismatch'); // never compare across base units

    var perBase = (cur.centsPerBase - p.centsPerBase) / p.centsPerBase;
    if (perBase < MATERIAL_PER_BASE) return none('immaterial');

    var packChanged = String(p.packLabel || '').trim() !== String(cur.packLabel || '').trim();
    if (!packChanged) return none('no-pack-change'); // a straight price move; the hike path owns it

    var haveSticker = num(p.casePriceCents) && num(cur.casePriceCents) && p.casePriceCents > 0;
    if (haveSticker) {
      var sticker = (cur.casePriceCents - p.casePriceCents) / p.casePriceCents;
      if (Math.abs(sticker) >= STICKER_QUIET) return none('sticker-also-moved'); // not silent → ordinary hike
    }

    var pct = Math.round(perBase * 100);
    var unit = p.baseUnit || tt(locale, 'unit', 'unidad');
    var from = p.packLabel, to = cur.packLabel;

    var marketFlat = !!(input.market && (input.market.confidence === 'high' || input.market.confidence === 'medium')
      && num(input.market.deltaPct) && Math.abs(input.market.deltaPct) < FLAT_MARKET);
    var marketClause = marketFlat
      ? tt(locale, ' And the market for ' + ing + ' has not moved — a pack change, not a price you have to eat.',
                   ' Y el mercado de ' + ing + ' no se ha movido — es un cambio de paquete, no un precio que aceptar.')
      : '';

    var headline = haveSticker
      ? tt(locale,
          'Your ' + ing + ' case looks like the same price — but the pack went from ' + from + ' to ' + to + '. You are paying about ' + pct + '% more per ' + unit + '.' + marketClause,
          'Tu caja de ' + ing + ' parece el mismo precio — pero el paquete pasó de ' + from + ' a ' + to + '. Estás pagando como ' + pct + '% más por ' + unit + '.' + marketClause)
      : tt(locale,
          'Your ' + ing + ' pack went from ' + from + ' to ' + to + ' — you are now paying about ' + pct + '% more per ' + unit + '.' + marketClause,
          'Tu paquete de ' + ing + ' pasó de ' + from + ' a ' + to + ' — ahora pagas como ' + pct + '% más por ' + unit + '.' + marketClause);

    return {
      tier: 'pack-shrink', show: true, headline: headline,
      options: [
        { kind: 'flag_requote', label: tt(locale, 'Flag for re-quote', 'Márcalo para re-cotizar') },
        { kind: 'dismiss',      label: tt(locale, 'Dismiss', 'Descartar') }
      ],
      perBasePct: pct, packFrom: from, packTo: to, marketFlat: marketFlat, reason: 'pack-shrink'
    };
  }

  var api = { build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinPackShrink = api;
  if (root) root.MuntinPackShrink = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
