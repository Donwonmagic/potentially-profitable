/**
 * Muntin Bench — price-move assessment (Layer 1).
 *
 * The honest core of the "is my price moving wrong?" tool. Given an
 * item and the unit prices an operator has paid, it answers a single
 * question they can act on: did this latest price move out of line
 * with what you've been paying — enough that it's worth asking your
 * rep why?
 *
 * WHY THIS MODULE MIRRORS THE PRODUCT
 * -----------------------------------
 * Muntin Ledger (the sister product) already classifies price hikes
 * with a deterministic rule: trailing-median baseline + dual delta
 * thresholds (a percentage AND an absolute-cents floor that must BOTH
 * clear). See apps/api/src/lib/verdict-compute.ts → computePriceHike.
 * Bench reuses that EXACT math so the two surfaces can never give an
 * operator contradictory verdicts on the same prices. Any change to
 * the thresholds or the median logic must land in both files. Numbers
 * are kept in integer cents end-to-end, same as Ledger, so rounding
 * never drifts between the surfaces.
 *
 * WHAT THIS MODULE IS NOT (yet)
 * -----------------------------
 * Two further layers are designed into the result shape but inert
 * today, on purpose — shipping them empty would be dishonest:
 *
 *   - peerBenchmark(): the cross-operator percentile ("you're in the
 *     top 10% of what peers pay"). Returns { available:false } until a
 *     real, k-anonymous pool of delivered prices exists in Ledger.
 *     That pool lives behind opt-in consent in the authenticated
 *     product, never in this no-login tool — collecting it here would
 *     break the storefront's "the Network tab stays empty" promise.
 *
 *   - marketTrend(): your rate-of-change vs. a public commodity index's
 *     rate-of-change ("the market moved 6%, your vendor moved you
 *     18%"). Returns { available:false } until a public-domain index
 *     series (BLS PPI / USDA AMS / FRED) is vendored in with full
 *     source attribution. Direction-only; never used to assert a
 *     "fair" delivered price level.
 *
 * Both are density/data-gated, not flag-gated: when the data arrives,
 * the same call starts returning a populated result and the UI lights
 * up the corresponding card. No code switch to flip.
 *
 * Pure + no I/O beyond the optional on-device history helpers (which
 * go through MuntinContext → localStorage, never the network). Safe to
 * require() in Node for tests; attaches to window.MuntinBench in the
 * browser.
 */

(function (root) {
  'use strict';

  // Must match Ledger's computePriceHike defaults exactly.
  var DEFAULT_THRESHOLD_PCT = 0.08;   // 8%
  var DEFAULT_THRESHOLD_CENTS = 500;  // $5.00
  // A positive-but-sub-threshold rise we still surface as "worth a
  // glance" rather than silent. This is a Bench-only presentation tier
  // (Ledger fires a verdict only at the co-gate); it never overrides
  // or contradicts the hike line — it sits strictly below it.
  var WATCH_PCT = 0.03;               // 3%

  /** Mirrors Python statistics.median / Ledger's median(): odd -> middle,
   *  even -> mean of the two middle values. */
  function median(values) {
    var s = values.slice().sort(function (a, b) { return a - b; });
    var n = s.length;
    if (!n) return 0;
    var mid = Math.floor(n / 2);
    return n % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  /**
   * Faithful port of Ledger computePriceHike. Returns the verdict
   * object when the latest price clears BOTH thresholds over the
   * trailing median, else null. Observations: [{ cents, ts }] — only
   * the cents are load-bearing here; ordering is by ts when present,
   * else array order (latest LAST, matching Ledger's sort).
   */
  function computePriceHike(observations, opts) {
    opts = opts || {};
    var thresholdPct = (opts.thresholdPct != null) ? opts.thresholdPct : DEFAULT_THRESHOLD_PCT;
    var thresholdCents = (opts.thresholdCents != null) ? opts.thresholdCents : DEFAULT_THRESHOLD_CENTS;
    var overrideBaselineCents = (opts.overrideBaselineCents != null) ? opts.overrideBaselineCents : null;

    if (!Array.isArray(observations) || observations.length < 2) return null;
    var sorted = observations.slice().sort(function (a, b) {
      var at = a.ts || 0, bt = b.ts || 0;
      return at < bt ? -1 : at > bt ? 1 : 0;
    });
    var latest = sorted[sorted.length - 1];
    var historical = sorted.slice(0, -1).map(function (o) { return o.cents; });
    var med = Math.trunc(median(historical));
    if (overrideBaselineCents !== null) med = Math.max(med, overrideBaselineCents);
    if (med <= 0) return null;
    var deltaCents = latest.cents - med;
    var deltaPct = deltaCents / med;
    if (deltaPct >= thresholdPct && deltaCents >= thresholdCents) {
      return {
        median_cents: med,
        latest_cents: latest.cents,
        delta_pct: deltaPct,
        delta_cents: deltaCents
      };
    }
    return null;
  }

  function dollars(cents) {
    return '$' + (Math.round(cents) / 100).toFixed(2);
  }

  function pct(p) {
    // One decimal, no trailing ".0" noise beyond that.
    return (p * 100).toFixed(1).replace(/\.0$/, '') + '%';
  }

  function unitMoney(cents, unit) {
    return dollars(cents) + (unit ? '/' + unit : '');
  }

  // ---- Unit-of-measure handling -------------------------------------
  // Determining pricing means first pinning the UoM, then converting
  // when entries disagree. We normalize NAMED mass / volume / count
  // units to a base ($/lb, $/gal, $/each) deterministically. We do NOT
  // guess the weight of an opaque "case"/"pack"/"box" — that needs the
  // pack catalog (Ledger's product_canonical.pack_weight_lb). Here we
  // differentiate it and decline rather than invent a conversion.
  var BASE_UNIT = { mass: 'lb', vol: 'gal', count: 'each' };
  // toBase = how many base units one of this unit equals.
  var UNITS = {
    oz:{dim:'mass',toBase:1/16}, ounce:{dim:'mass',toBase:1/16}, ounces:{dim:'mass',toBase:1/16},
    lb:{dim:'mass',toBase:1}, lbs:{dim:'mass',toBase:1}, pound:{dim:'mass',toBase:1}, pounds:{dim:'mass',toBase:1},
    g:{dim:'mass',toBase:1/453.59237}, gram:{dim:'mass',toBase:1/453.59237}, grams:{dim:'mass',toBase:1/453.59237},
    kg:{dim:'mass',toBase:2.2046226}, kilo:{dim:'mass',toBase:2.2046226}, kilogram:{dim:'mass',toBase:2.2046226},
    'fl oz':{dim:'vol',toBase:1/128}, floz:{dim:'vol',toBase:1/128},
    ml:{dim:'vol',toBase:1/3785.411784}, milliliter:{dim:'vol',toBase:1/3785.411784},
    l:{dim:'vol',toBase:0.26417205}, liter:{dim:'vol',toBase:0.26417205}, litre:{dim:'vol',toBase:0.26417205}, liters:{dim:'vol',toBase:0.26417205},
    pt:{dim:'vol',toBase:0.125}, pint:{dim:'vol',toBase:0.125},
    qt:{dim:'vol',toBase:0.25}, quart:{dim:'vol',toBase:0.25},
    gal:{dim:'vol',toBase:1}, gallon:{dim:'vol',toBase:1}, gallons:{dim:'vol',toBase:1},
    each:{dim:'count',toBase:1}, ea:{dim:'count',toBase:1}, ct:{dim:'count',toBase:1},
    count:{dim:'count',toBase:1}, unit:{dim:'count',toBase:1}, units:{dim:'count',toBase:1},
    dozen:{dim:'count',toBase:12}, doz:{dim:'count',toBase:12}
  };
  function unitInfo(u) {
    var k = String(u || '').trim().toLowerCase().replace(/\.$/, '');
    if (!k) return { kind: 'none' };
    if (UNITS[k]) return { kind: 'known', dim: UNITS[k].dim, toBase: UNITS[k].toBase, raw: k };
    return { kind: 'opaque', raw: k };
  }

  /**
   * Decide whether a set of observations is price-comparable, and if so
   * return a series normalized to a common base. Returns
   * { ok, base, series } on success or { ok:false, reason, message }.
   * Identical units are compared as-entered (exact Ledger parity);
   * differing units within one dimension are converted to $/base.
   */
  function comparable(observations) {
    var infos = observations.map(function (o) { return { o: o, u: unitInfo(o.unit) }; });
    var anyUnit = infos.some(function (x) { return x.u.kind !== 'none'; });
    if (!anyUnit) {
      // No units given: the operator's entries are implicitly one basis.
      return { ok: true, base: null, series: observations.map(function (o) { return { cents: o.cents, ts: o.ts }; }) };
    }
    var dims = {}, opaques = {}, raws = {};
    for (var i = 0; i < infos.length; i++) {
      var u = infos[i].u;
      if (u.kind === 'none') {
        return { ok: false, reason: 'missing-unit',
          message: 'Some prices have a unit and some don’t. Put every entry in the same unit so Bench compares like with like.' };
      }
      if (u.kind === 'known') { dims[u.dim] = true; raws[u.raw] = true; }
      else { opaques[u.raw] = true; raws[u.raw] = true; }
    }
    var dimKeys = Object.keys(dims), opKeys = Object.keys(opaques);
    if (opKeys.length && (dimKeys.length || opKeys.length > 1)) {
      return { ok: false, reason: 'opaque-pack',
        message: 'These mix a pack unit (“' + opKeys[0] + '”) with other units. Bench can’t convert a ' + opKeys[0] +
          ' to a weight without knowing its pack size — that’s what Muntin Ledger’s catalog does. Re-enter in one basis.' };
    }
    if (!dimKeys.length && opKeys.length === 1) {
      // All the same opaque unit (e.g. every entry "per case") — compare as-is.
      return { ok: true, base: opKeys[0], series: observations.map(function (o) { return { cents: o.cents, ts: o.ts }; }) };
    }
    if (dimKeys.length > 1) {
      return { ok: false, reason: 'incompatible-dimensions',
        message: 'These prices mix ' + dimKeys.join(' and ') + ' units, which don’t convert into each other. Compare within one dimension.' };
    }
    // Single known dimension. If every entry is literally the same unit,
    // compare as-entered for exact parity with Ledger; otherwise convert
    // each to $/base so e.g. $/oz and $/lb line up.
    if (Object.keys(raws).length === 1) {
      return { ok: true, base: infos[0].u.raw, series: observations.map(function (o) { return { cents: o.cents, ts: o.ts }; }) };
    }
    var base = BASE_UNIT[dimKeys[0]];
    var series = infos.map(function (x) {
      return { cents: Math.round(x.o.cents / x.u.toBase), ts: x.o.ts }; // $/base
    });
    return { ok: true, base: base, series: series };
  }

  /**
   * The operator-facing assessment. Pure function of the prices passed
   * in. `observations` is an array of { cents, ts? } with the most
   * recent price last (or carrying ts). Returns a stable shape the UI
   * renders directly; `talkingPoint` is deterministic copy built only
   * from the operator's own numbers and the tool's own threshold rule
   * — no external or invented statistics.
   */
  function assess(input) {
    input = input || {};
    var item = (input.item || '').toString().trim();
    var observations = Array.isArray(input.observations) ? input.observations : [];
    var opts = {
      thresholdPct: input.thresholdPct,
      thresholdCents: input.thresholdCents,
      overrideBaselineCents: input.overrideBaselineCents
    };

    var result = {
      item: item,
      tier: 'insufficient',     // insufficient | mixed-units | steady | watch | hike
      observationCount: observations.length,
      medianCents: null,
      latestCents: null,
      deltaCents: null,
      deltaPct: null,
      thresholdPct: (opts.thresholdPct != null) ? opts.thresholdPct : DEFAULT_THRESHOLD_PCT,
      thresholdCents: (opts.thresholdCents != null) ? opts.thresholdCents : DEFAULT_THRESHOLD_CENTS,
      talkingPoint: '',
      // Layers designed-in but data-gated (see module header).
      peer: peerBenchmark(item),
      market: marketTrend(item)
    };

    if (observations.length < 2) {
      result.talkingPoint = item
        ? 'Enter at least one earlier price you paid for ' + item + ' so Bench can compare the latest one against your own baseline.'
        : 'Enter the item plus the latest price and at least one earlier price you paid.';
      return result;
    }

    // Pin the UoM before pricing. comparable() differentiates units and
    // converts within a dimension ($/oz ↔ $/lb), or declines when a
    // conversion would require pack-catalog knowledge the free tool
    // doesn't have. This is the no-login mirror of Ledger's pack
    // normalization (product_canonical: pack_uom / pack_count /
    // pack_weight_lb).
    var comp = comparable(observations);
    if (!comp.ok) {
      result.tier = 'mixed-units';
      result.unitReason = comp.reason;
      result.talkingPoint = comp.message;
      return result;
    }
    var baseUnit = comp.base; // resolved unit string, or null when none given

    // Establish the baseline + delta the same way Ledger does, on the
    // normalized series, whether or not the co-gate trips.
    var sorted = comp.series.slice().sort(function (a, b) {
      var at = a.ts || 0, bt = b.ts || 0;
      return at < bt ? -1 : at > bt ? 1 : 0;
    });
    var latestCents = sorted[sorted.length - 1].cents;
    var medianCents = Math.trunc(median(sorted.slice(0, -1).map(function (o) { return o.cents; })));
    if (opts.overrideBaselineCents != null) medianCents = Math.max(medianCents, opts.overrideBaselineCents);

    result.baseUnit = baseUnit;
    result.medianCents = medianCents;
    result.latestCents = latestCents;

    if (medianCents <= 0) {
      result.tier = 'steady';
      result.talkingPoint = 'Bench needs a positive earlier price to compare against.';
      return result;
    }

    var deltaCents = latestCents - medianCents;
    var deltaPct = deltaCents / medianCents;
    result.deltaCents = deltaCents;
    result.deltaPct = deltaPct;

    var label = item || 'this item';
    var from = unitMoney(medianCents, baseUnit) + ' → ' + unitMoney(latestCents, baseUnit);
    var hike = computePriceHike(sorted, opts);

    if (hike) {
      result.tier = 'hike';
      result.talkingPoint =
        'Your latest price for ' + label + ' is ' + pct(deltaPct) + ' over your trailing median (' + from +
        '), a ' + unitMoney(deltaCents, baseUnit) + ' jump. That clears the 8% / $5 line Muntin Ledger flags as a ' +
        'price hike. Bring the earlier price to your rep and ask what changed.';
    } else if (deltaCents <= 0) {
      result.tier = 'steady';
      result.talkingPoint = deltaCents === 0
        ? 'Your latest price for ' + label + ' matches your trailing median (' + unitMoney(medianCents, baseUnit) + '). Holding steady.'
        : 'Your latest price for ' + label + ' is ' + pct(Math.abs(deltaPct)) + ' under your trailing median (' +
          from + '). Moving the right way.';
    } else if (deltaPct >= WATCH_PCT) {
      result.tier = 'watch';
      result.talkingPoint =
        'Your latest price for ' + label + ' is up ' + pct(deltaPct) + ' over your trailing median (' + from +
        '). Below the 8% / $5 line Bench flags as a hike, but worth a glance next invoice.';
    } else {
      result.tier = 'steady';
      result.talkingPoint =
        'Your latest price for ' + label + ' is up ' + pct(deltaPct) + ' over your trailing median (' + from +
        ') — within normal drift.';
    }

    return result;
  }

  /**
   * Cross-operator percentile. Inert until a k-anonymous pool of
   * delivered prices exists in Ledger (opt-in, authenticated). Returns
   * a stable "not available" shape so the UI can render an honest
   * placeholder rather than a fabricated percentile.
   */
  function peerBenchmark(/* item */) {
    return {
      available: false,
      reason: 'no-pool',
      message: 'Peer comparison turns on per category once enough operators have opted in through Muntin Ledger. Until then, Bench compares your price against your own history.'
    };
  }

  /**
   * Direction-only public-index comparison. Inert until a public-domain
   * index series is vendored in with source attribution. Never asserts
   * a "fair" price level — only rate-of-change once live.
   */
  function marketTrend(/* item */) {
    return {
      available: false,
      reason: 'no-index',
      message: 'Market-trend comparison turns on once Bench vendors in a public commodity index for this category.'
    };
  }

  // ---- Identity resolution (so the operator does less) ---------------
  // The operator should never have to maintain a canonical item name.
  // They enter the item as it reads on the invoice; we resolve "what it
  // actually is" on-device by reusing the storefront's existing
  // primitives: MuntinStem (description -> stem) and MuntinSkuMatch
  // (fuzzy match a stem against ones already seen). "Olive Oil 3 L" and
  // "OLIVE OIL 3L" collapse to one identity automatically; "beef
  // tenderloin" vs "beef tender" surfaces as a proposed match. This is
  // the deterministic, no-LLM, no-network mirror of the cross-vendor
  // canonicalization Ledger does in product_canonical — minus the
  // learned/cross-operator catalog, which stays in the product.

  function _mod(name) {
    if (root && root[name]) return root[name];
    if (typeof require !== 'undefined') {
      try {
        return require(name === 'MuntinStem' ? './stem.js'
          : name === 'MuntinSkuMatch' ? './sku-match.js' : null);
      } catch (_) { return null; }
    }
    return null;
  }

  // Description -> stem. Falls back to a light normalization if the
  // stem module isn't loaded, so the tool degrades rather than breaks.
  function stemFor(item) {
    var stem = _mod('MuntinStem');
    if (stem && typeof stem.extractStem === 'function') {
      var s = stem.extractStem(item);
      if (s) return s;
    }
    return String(item || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Resolve which stored identity a freshly-entered item belongs to.
   * Returns { stem, tier, matchedRaw } where tier is:
   *   'auto'    — identical stem; bind silently.
   *   'propose' — near match (operator should confirm in the UI).
   *   'new'     — no prior identity; this starts a fresh history.
   * Pure: takes the candidate stems explicitly, so it's testable
   * without storage.
   */
  function resolveStem(item, existingStems) {
    var own = stemFor(item);
    var match = _mod('MuntinSkuMatch');
    if (match && typeof match.classify === 'function' && Array.isArray(existingStems) && existingStems.length) {
      var c = match.classify(item, existingStems);
      if (c.tier === 'auto') return { stem: c.stem, tier: 'auto' };
      if (c.tier === 'propose') return { stem: c.stem, tier: 'propose', score: c.score };
    }
    // Exact-stem hit even when the matcher isn't available.
    if (Array.isArray(existingStems) && existingStems.indexOf(own) !== -1) {
      return { stem: own, tier: 'auto' };
    }
    return { stem: own, tier: 'new' };
  }

  // ---- On-device history (the personal "data machine") ---------------
  // Persists the operator's own price points, keyed by resolved stem,
  // so a repeat visit compares against history without re-typing or
  // re-naming. Goes through MuntinContext (localStorage), never the
  // network. No-ops in Node.
  var HISTORY_KEY = 'benchHistory';
  var HISTORY_CAP = 24; // per identity

  function _store() {
    var ctx = (root && root.MuntinContext) ? root.MuntinContext : null;
    if (!ctx || typeof ctx.read !== 'function') return null;
    return ctx;
  }
  function knownStems() {
    var ctx = _store();
    if (!ctx) return [];
    return Object.keys((ctx.read() || {})[HISTORY_KEY] || {});
  }

  // Returns { stem, tier, observations } — the stored series for the
  // identity this item resolves to, newest last.
  function readObservations(item) {
    var ctx = _store();
    if (!ctx) return { stem: stemFor(item), tier: 'new', observations: [] };
    var all = (ctx.read() || {})[HISTORY_KEY] || {};
    var r = resolveStem(item, Object.keys(all));
    var list = all[r.stem];
    return { stem: r.stem, tier: r.tier, observations: Array.isArray(list) ? list.slice() : [] };
  }

  function pushObservation(item, cents, ts, unit) {
    var ctx = _store();
    if (!ctx || typeof ctx.merge !== 'function') return false;
    if (typeof cents !== 'number' || !isFinite(cents) || cents <= 0) return false;
    var all = (ctx.read() || {})[HISTORY_KEY] || {};
    var r = resolveStem(item, Object.keys(all));
    var list = Array.isArray(all[r.stem]) ? all[r.stem].slice() : [];
    var entry = { cents: Math.round(cents), ts: ts || Date.now(), raw: String(item || '').trim() };
    if (unit) entry.unit = String(unit).trim().toLowerCase();
    list.push(entry);
    list.sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
    if (list.length > HISTORY_CAP) list = list.slice(list.length - HISTORY_CAP);
    all[r.stem] = list;
    var patch = {};
    patch[HISTORY_KEY] = all;
    return ctx.merge(patch);
  }

  /**
   * The one call the UI makes: given an item + the latest price (+unit),
   * resolve its identity, fold in the operator's stored history for that
   * identity, and return the assessment plus how the identity was
   * matched. `persist` (default true) appends the new price so the
   * history grows on its own — the personal data machine, on-device.
   */
  function track(input) {
    input = input || {};
    var item = input.item;
    var cents = input.cents;
    var unit = input.unit;
    var hist = readObservations(item);
    var series = hist.observations.slice();
    if (typeof cents === 'number' && isFinite(cents) && cents > 0) {
      series.push({ cents: Math.round(cents), ts: input.ts || Date.now(), unit: unit });
      if (input.persist !== false) pushObservation(item, cents, input.ts, unit);
    }
    var assessment = assess({
      item: item,
      observations: series,
      thresholdPct: input.thresholdPct,
      thresholdCents: input.thresholdCents
    });
    assessment.identity = { stem: hist.stem, matchTier: hist.tier, priorCount: hist.observations.length };
    return assessment;
  }

  var api = {
    DEFAULT_THRESHOLD_PCT: DEFAULT_THRESHOLD_PCT,
    DEFAULT_THRESHOLD_CENTS: DEFAULT_THRESHOLD_CENTS,
    WATCH_PCT: WATCH_PCT,
    median: median,
    computePriceHike: computePriceHike,
    assess: assess,
    peerBenchmark: peerBenchmark,
    marketTrend: marketTrend,
    stemFor: stemFor,
    resolveStem: resolveStem,
    knownStems: knownStems,
    readObservations: readObservations,
    pushObservation: pushObservation,
    track: track
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.MuntinBench = api;
  }
})(typeof self !== 'undefined' ? self : this);
