/**
 * Fair-Price Gap — your purchase price vs the honest market reference.
 *
 * The market×purchases fusion, Index-only and manual: type an item and what you
 * paid, and it places that price against the live Cost Index wholesale reference
 * — the gap. This is the complement of Muntin Bench (bench-lookup.js), which
 * compares a price to the operator's OWN trailing history; here the yardstick is
 * the conflict-free market, which a distributor or a rake-taking POS can't
 * honestly give you.
 *
 * THE HONESTY RULE THAT GOVERNS THE VERDICT
 * -----------------------------------------
 * The Cost Index is a WHOLESALE reference, and a delivered foodservice price
 * legitimately runs ABOVE it (freight + distributor margin). So a price sitting
 * above the reference is NOT proof of overpaying — saying so would mislead. This
 * module therefore reports the factual gap vs the reference and only raises a
 * directional "worth asking" flag at an extreme gap (default >60%), well beyond a
 * normal delivered markup. A definitive overpayment finding needs the operator's
 * true delivered price across vendors/peers — that's the +Decoder / +peer-pool
 * enhancement, not something the Index alone can claim.
 *
 * MODULE CONTRACT
 *   Minimum:  Cost Index (seed) + one typed item & price.
 *   Degraded: no firm market level, an index-basis (directional) item, or a unit
 *             that can't be reconciled to the reference unit → verdict 'unknown'
 *             with a reason. Never a fabricated gap, never an overpayment claim
 *             from wholesale alone. A fuzzy name match is returned but flagged.
 *   Enhances: +Decoder → every invoice line automatically, and your true paid
 *             price; +peer pool → percentile vs peers (bench peerBenchmark);
 *             +Ledger → switch-savings rolled into the P&L.
 *
 * Pure, deterministic. No DOM/network. Browser: window.MuntinFairPriceGap.
 * Node: module.exports (unit-testable).
 */
(function (root) {
  'use strict';

  function _lookup(opts) {
    if (opts && opts.lookup) return opts.lookup;
    if (root && root.MuntinCostIndexLookup) return root.MuntinCostIndexLookup;
    if (typeof require !== 'undefined') { try { return require('./cost-index-lookup.js'); } catch (_) { return null; } }
    return null;
  }
  function _bridge(opts) {
    if (opts && opts.bridge) return opts.bridge;
    if (root && root.MuntinPortionBridge) return root.MuntinPortionBridge;
    if (typeof require !== 'undefined') { try { return require('./portion-bridge.js'); } catch (_) { return null; } }
    return null;
  }

  function num(v) { var n = (typeof v === 'number') ? v : parseFloat(v); return isFinite(n) ? n : null; }
  function normUnit(u) { return String(u == null ? '' : u).toLowerCase().trim().replace(/\.$/, ''); }

  // Default gap (% above the wholesale reference) beyond which we raise a
  // directional "worth asking" flag — chosen generously so a normal delivered
  // markup never trips it. Directional guidance, not a sourced overpayment line.
  var DEFAULT_WORTH_ASKING_PCT = 60;
  // Below this far under the reference, the spec/pack is probably different —
  // surface it as "verify", not as a win.
  var BELOW_REFERENCE_PCT = -15;

  /**
   * assess({ item, paidCents, unit, seed, worthAskingPct }) -> result
   *
   * result = {
   *   matched, comparable, verdict, reason?,
   *   costIndexKey?, marketCents?, marketUnit?, paidPerMarketUnit?,
   *   gapPct?, gapCents?, worthAsking?, basis?, confidence?, matchTier?,
   *   wholesaleReference: true
   * }
   * verdict ∈ 'unknown' | 'at-reference' | 'above-reference' | 'far-above-reference' | 'below-reference'
   */
  function assess(opts) {
    opts = opts || {};
    var lookup = _lookup(opts);
    var bridge = _bridge(opts);
    var seed = opts.seed || (root && root.MUNTIN_COST_INDEX) || null;
    var item = opts.item;
    var paidCents = num(opts.paidCents);
    var unit = opts.unit;
    var worthAskingPct = num(opts.worthAskingPct);
    if (worthAskingPct == null || worthAskingPct <= 0) worthAskingPct = DEFAULT_WORTH_ASKING_PCT;

    var base = { matched: false, comparable: false, verdict: 'unknown', wholesaleReference: true };
    if (!lookup || !lookup.match || !bridge || !seed || !item || paidCents == null || paidCents <= 0 || !unit) {
      base.reason = 'insufficient-input';
      return base;
    }

    var ref = lookup.match(item, seed);
    if (!ref) return Object.assign(base, { reason: 'no-match' });
    base.matched = true;
    base.costIndexKey = ref.key;
    base.basis = ref.basis || null;
    base.confidence = ref.confidence || null;
    base.matchTier = ref.tier || null;
    if (ref.wholesaleCents == null) {
      // No firm $-level (index-basis / thin confidence) — we can link, not compare.
      return Object.assign(base, { reason: ref.basis === 'index' ? 'index-basis-no-level' : 'no-market-level' });
    }

    // Reconcile units. Same unit → compare directly; otherwise convert the paid
    // price into the reference's unit via the shared bridge (weight/volume/count
    // families only). Cross-family (e.g. paid per case vs reference per lb) → unknown.
    var marketCents = ref.wholesaleCents; // per ref.unit_en
    var refUnit = ref.unit_en;
    var paidPerMarketUnit;
    if (normUnit(unit) === normUnit(refUnit)) {
      paidPerMarketUnit = paidCents;
    } else {
      // how many `unit` are in one reference unit (e.g. 16 oz per lb)
      var perRefUnit = bridge.convertQuantity(1, refUnit, unit);
      if (perRefUnit == null || perRefUnit <= 0) {
        return Object.assign(base, { reason: 'unit-mismatch', marketCents: marketCents, marketUnit: refUnit });
      }
      paidPerMarketUnit = paidCents * perRefUnit;
    }

    var gapCents = paidPerMarketUnit - marketCents;
    var gapPct = (gapCents / marketCents) * 100;
    var verdict, worthAsking = false;
    if (gapPct >= worthAskingPct) { verdict = 'far-above-reference'; worthAsking = true; }
    else if (gapPct > 10) { verdict = 'above-reference'; }
    else if (gapPct < BELOW_REFERENCE_PCT) { verdict = 'below-reference'; }
    else { verdict = 'at-reference'; }

    return {
      matched: true,
      comparable: true,
      verdict: verdict,
      costIndexKey: ref.key,
      marketCents: Math.round(marketCents),
      marketUnit: refUnit,
      paidPerMarketUnit: Math.round(paidPerMarketUnit),
      gapPct: +gapPct.toFixed(1),
      gapCents: Math.round(gapCents),
      worthAsking: worthAsking,
      basis: ref.basis || null,
      confidence: ref.confidence || null,
      matchTier: ref.tier || null,
      wholesaleReference: true
    };
  }

  var api = { assess: assess, DEFAULT_WORTH_ASKING_PCT: DEFAULT_WORTH_ASKING_PCT, BELOW_REFERENCE_PCT: BELOW_REFERENCE_PCT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinFairPriceGap = api;
  if (root) root.MuntinFairPriceGap = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
