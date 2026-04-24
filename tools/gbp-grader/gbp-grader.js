/**
 * GBP Grader — scoring module.
 *
 * Loaded as a classic script in ./index.html (both EN and ES). Also
 * importable in Node for unit tests via scripts/test-gbp-scorer.mjs —
 * see the dual-export block at the bottom (same pattern as the
 * sibling audit tool's restaurant-checks.js).
 *
 * This module is pure: it does not touch the DOM, the network, or
 * localStorage. DOM rendering lives in the IIFE in ./index.html and
 * will migrate here in a later sprint.
 *
 * Public API
 *   gbpScoreCandidate(place, peerMedians, deepScanData, lang) -> result
 *   gbpResolvePeerMedian(place, peerMedians)                  -> { reviewCount, photoCount, source }
 *   gbpPickText(lang)                                         -> GBP_TEXT subtree
 *   gbpGradeBand(score, forcedF)                              -> 'good' | 'ok' | 'bad'
 *   gbpLetter(score, forcedF)                                 -> 'A' | 'B' | 'C' | 'D' | 'F'
 *
 * Rubric (see /root/.claude/plans/please-act-as-an-cryptic-dusk.md):
 *   14 weighted checks across four groups summing to 100. Fast Scan
 *   evaluates 11 (max 80); Deep Scan unlocks the remaining 3 (+20 pts)
 *   that need /api/gbp-details or /api/schema-check. businessStatus !==
 *   'OPERATIONAL' hard-forces the letter to F regardless of total.
 */

// ------------------------------------------------------------
// i18n strings
// ------------------------------------------------------------

var GBP_TEXT = {
  en: {
    groups: {
      presence:        'Presence',
      trust:           'Trust',
      engagement:      'Engagement',
      discoverability: 'Discoverability'
    },
    bands: { good: 'Strong', ok: 'Mixed', bad: 'Weak' },
    fastScanMaxNote: 'Out of {max} — Deep Scan unlocks the remaining {remaining} points.',
    closedTemporarily: {
      title: 'Temporarily closed',
      body:  'Google shows this listing as temporarily closed. Reopen it in your Business Profile dashboard before fixing anything else — while it’s flagged closed, Maps hides the listing from most searches.'
    },
    closedPermanently: {
      title: 'Permanently closed',
      body:  'Google shows this listing as permanently closed. If the business is active under a new name or owner, reclaim it in the Business Profile dashboard — a closed listing will not show up in local results.'
    }
  },
  es: {
    groups: {
      presence:        'Presencia',
      trust:           'Confianza',
      engagement:      'Interacción',
      discoverability: 'Descubrimiento'
    },
    bands: { good: 'Fuerte', ok: 'Mixto', bad: 'Débil' },
    fastScanMaxNote: 'De {max} — el Deep Scan desbloquea los {remaining} puntos restantes.',
    closedTemporarily: {
      title: 'Cerrado temporalmente',
      body:  'Google muestra esta ficha como cerrada temporalmente. Reábrela en el panel de Business Profile antes de arreglar cualquier otra cosa — mientras esté marcada como cerrada, Maps la oculta en la mayoría de las búsquedas.'
    },
    closedPermanently: {
      title: 'Cerrado permanentemente',
      body:  'Google muestra esta ficha como cerrada permanentemente. Si el negocio sigue activo con otro nombre o dueño, reclámala en el panel de Business Profile — una ficha cerrada no aparece en los resultados locales.'
    }
  }
};

function gbpPickText(lang) {
  return GBP_TEXT[lang] || GBP_TEXT.en;
}

// ------------------------------------------------------------
// Peer-median resolution
//
// Falls through: exact override -> family-via-familyMap -> _default.
// Returns the selected row plus a `source` tag useful for tests +
// future "here's how we compared you" disclosure copy.
// ------------------------------------------------------------

function gbpResolvePeerMedian(place, peerMedians) {
  var def = (peerMedians && peerMedians._default) || { reviewCount: 75, photoCount: 12 };
  var type = place && place.primaryTypeDisplayName;
  if (!type || !peerMedians) {
    return { reviewCount: def.reviewCount, photoCount: def.photoCount, source: 'default' };
  }
  var overrides = peerMedians._overrides || {};
  if (overrides[type]) {
    return {
      reviewCount: overrides[type].reviewCount,
      photoCount:  overrides[type].photoCount,
      source:      'override'
    };
  }
  var familyMap  = peerMedians._familyMap || {};
  var families   = peerMedians._families  || {};
  var familyKey  = familyMap[type];
  if (familyKey && families[familyKey]) {
    return {
      reviewCount: families[familyKey].reviewCount,
      photoCount:  families[familyKey].photoCount,
      source:      'family:' + familyKey
    };
  }
  return { reviewCount: def.reviewCount, photoCount: def.photoCount, source: 'default' };
}

// ------------------------------------------------------------
// Grade-band + letter mapping
// ------------------------------------------------------------

function gbpGradeBand(score, forcedF) {
  if (forcedF) return 'bad';
  if (score >= 70) return 'good';
  if (score >= 40) return 'ok';
  return 'bad';
}

function gbpLetter(score, forcedF) {
  if (forcedF) return 'F';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

// ------------------------------------------------------------
// Scoring helpers
// ------------------------------------------------------------

function gbpStateFromValue(value, passThresh, warnThresh) {
  if (value == null) return 'fail';
  if (value >= passThresh) return 'pass';
  if (value >= warnThresh) return 'warn';
  return 'fail';
}

// Count non-null booleans in the Places service-attribute constellation.
// Null means Google couldn't verify the attribute; false is a confident
// "no." Both are meaningful — but for "how populated is this listing?"
// only non-null counts.
var GBP_SERVICE_FIELDS = [
  'dineIn', 'takeout', 'delivery', 'reservable',
  'servesBreakfast', 'servesLunch', 'servesDinner', 'servesBrunch',
  'servesVegetarianFood',
  'servesBeer', 'servesWine', 'servesCocktails', 'servesCoffee', 'servesDessert'
];

function gbpCountServiceAttrs(place) {
  if (!place) return 0;
  var n = 0;
  for (var i = 0; i < GBP_SERVICE_FIELDS.length; i++) {
    if (place[GBP_SERVICE_FIELDS[i]] != null) n++;
  }
  return n;
}

function gbpAnyServiceAttrKnown(place) {
  return gbpCountServiceAttrs(place) > 0;
}

// Genericity heuristic for primary category. Places v1 sometimes returns
// "Establishment" / "Point of interest" / "Store" which are near-useless
// for ranking. Treat those as warn, not pass.
var GBP_GENERIC_TYPES = {
  'Establishment': true,
  'Point of interest': true,
  'Store': true,
  'Place': true,
  'Business': true
};

function gbpIsGenericType(type) {
  return !!(type && GBP_GENERIC_TYPES[type]);
}

// Pass/warn/fail -> fraction of weight awarded. `skipped` checks aren't
// counted in `max` at all — they're deferred to Deep Scan.
function gbpAward(state, weight) {
  if (state === 'pass') return weight;
  if (state === 'warn') return Math.round(weight * 0.5);
  return 0;
}

// ------------------------------------------------------------
// Check builders
// Each returns { id, weight, state, dynamic } — titles/bodies are
// rendered separately so i18n can vary the copy by state without
// duplicating scoring logic.
// ------------------------------------------------------------

function gbpCheckOperational(place) {
  var s = place && place.businessStatus;
  if (!s || s === 'OPERATIONAL') return { id: 'operational', weight: 8, state: 'pass' };
  if (s === 'CLOSED_TEMPORARILY') return { id: 'operational', weight: 8, state: 'fail', forceF: true, status: 'CLOSED_TEMPORARILY' };
  return { id: 'operational', weight: 8, state: 'fail', forceF: true, status: 'CLOSED_PERMANENTLY' };
}

function gbpCheckPrimaryCategory(place) {
  var t = place && place.primaryTypeDisplayName;
  if (!t) return { id: 'primary_category', weight: 10, state: 'fail', value: null };
  if (gbpIsGenericType(t)) return { id: 'primary_category', weight: 10, state: 'warn', value: t };
  return { id: 'primary_category', weight: 10, state: 'pass', value: t };
}

function gbpCheckHours(place) {
  return {
    id: 'hours',
    weight: 4,
    state: (place && place.hasHours) ? 'pass' : 'fail'
  };
}

function gbpCheckPhone(place) {
  return {
    id: 'phone',
    weight: 3,
    state: (place && place.nationalPhoneNumber) ? 'pass' : 'fail'
  };
}

function gbpCheckRating(place) {
  var r = place && place.rating;
  if (!r) return { id: 'rating', weight: 10, state: 'fail', value: 0 };
  if (r >= 4.5) return { id: 'rating', weight: 10, state: 'pass', value: r };
  if (r >= 4.0) return { id: 'rating', weight: 10, state: 'warn', value: r };
  return { id: 'rating', weight: 10, state: 'fail', value: r };
}

function gbpCheckReviewVolume(place, peerMedian) {
  var count = (place && place.reviewCount) || 0;
  var median = peerMedian.reviewCount;
  var ratio = median > 0 ? count / median : 0;
  var state;
  if (count >= median) state = 'pass';
  else if (ratio >= 0.5) state = 'warn';
  else state = 'fail';
  return {
    id: 'review_volume',
    weight: 10,
    state: state,
    value: count,
    peerMedian: median,
    ratio: ratio
  };
}

function gbpCheckPhotoCount(place) {
  var n = (place && place.photoCount) || 0;
  return {
    id: 'photos',
    weight: 6,
    state: gbpStateFromValue(n, 10, 3),
    value: n
  };
}

function gbpCheckEditorialSummary(place) {
  var has = !!(place && place.editorialSummary);
  // This is curated by Google — presence is a signal, absence isn't
  // fully the owner's fault. Use warn for missing instead of fail.
  return {
    id: 'editorial_summary',
    weight: 4,
    state: has ? 'pass' : 'warn'
  };
}

function gbpCheckWebsite(place) {
  var u = place && place.website;
  return {
    id: 'website',
    weight: 8,
    state: u ? 'pass' : 'fail',
    value: u || null
  };
}

function gbpCheckServiceAttrs(place) {
  var known = gbpAnyServiceAttrKnown(place);
  // Skip for businesses where Google returns zero attributes — these
  // are typically professional / service businesses that don't carry
  // dineIn/takeout/serves* signals. Skipping keeps the rubric honest
  // (a lawyer isn't penalized for not having "servesCocktails").
  if (!known) {
    return { id: 'service_attrs', weight: 10, state: 'skipped', reason: 'not_applicable' };
  }
  var n = gbpCountServiceAttrs(place);
  return {
    id: 'service_attrs',
    weight: 10,
    state: gbpStateFromValue(n, 6, 3),
    value: n,
    total: GBP_SERVICE_FIELDS.length
  };
}

function gbpCheckHoursFreshness(place) {
  // Places v1 exposes weekdayHoursText (from currentOpeningHours) and
  // hasHours (regularOpeningHours.periods). Presence of both is the
  // strongest signal we can get without Maps-side current/regular diff
  // computation. Worth 7 points.
  var hasRegular = !!(place && place.hasHours);
  var hasCurrent = !!(place && place.weekdayHoursText);
  var state;
  if (hasRegular && hasCurrent) state = 'pass';
  else if (hasRegular)           state = 'warn';
  else                           state = 'fail';
  return { id: 'hours_fresh', weight: 7, state: state };
}

function gbpCheckReviewRecency(deepScanData) {
  if (!deepScanData || !deepScanData.newestReviewAgeDays && deepScanData.newestReviewAgeDays !== 0) {
    return { id: 'review_recency', weight: 5, state: 'skipped', reason: 'deep_scan_required' };
  }
  var ageDays = deepScanData.newestReviewAgeDays;
  var state;
  if (ageDays <= 30) state = 'pass';
  else if (ageDays <= 90) state = 'warn';
  else state = 'fail';
  return { id: 'review_recency', weight: 5, state: state, value: ageDays };
}

function gbpCheckNapConsistency(deepScanData) {
  if (!deepScanData || !deepScanData.nap) {
    return { id: 'nap', weight: 5, state: 'skipped', reason: 'deep_scan_required' };
  }
  // deepScanData.nap.match: 'full' | 'partial' | 'mismatch' | 'no_schema'
  var m = deepScanData.nap.match;
  var state;
  if (m === 'full') state = 'pass';
  else if (m === 'partial') state = 'warn';
  else state = 'fail';
  return { id: 'nap', weight: 5, state: state, value: m };
}

function gbpCheckOwnerReplyRate(deepScanData) {
  if (!deepScanData || deepScanData.ownerReplyRate == null) {
    return { id: 'owner_reply', weight: 10, state: 'skipped', reason: 'deep_scan_required' };
  }
  var rate = deepScanData.ownerReplyRate;  // 0..1
  var state;
  if (rate >= 0.6) state = 'pass';
  else if (rate >= 0.2) state = 'warn';
  else state = 'fail';
  return { id: 'owner_reply', weight: 10, state: state, value: rate };
}

// ------------------------------------------------------------
// Top-level scorer
// ------------------------------------------------------------

function gbpScoreCandidate(place, peerMedians, deepScanData, lang) {
  var peer = gbpResolvePeerMedian(place, peerMedians);

  var checks = {
    operational:        gbpCheckOperational(place),
    primary_category:   gbpCheckPrimaryCategory(place),
    hours:              gbpCheckHours(place),
    phone:              gbpCheckPhone(place),
    rating:             gbpCheckRating(place),
    review_volume:      gbpCheckReviewVolume(place, peer),
    review_recency:     gbpCheckReviewRecency(deepScanData),
    nap:                gbpCheckNapConsistency(deepScanData),
    owner_reply:        gbpCheckOwnerReplyRate(deepScanData),
    photos:             gbpCheckPhotoCount(place),
    editorial_summary:  gbpCheckEditorialSummary(place),
    website:            gbpCheckWebsite(place),
    service_attrs:      gbpCheckServiceAttrs(place),
    hours_fresh:        gbpCheckHoursFreshness(place)
  };

  var groups = [
    { id: 'presence',        ids: ['operational', 'primary_category', 'hours', 'phone'] },
    { id: 'trust',           ids: ['rating', 'review_volume', 'review_recency', 'nap'] },
    { id: 'engagement',      ids: ['owner_reply', 'photos', 'editorial_summary'] },
    { id: 'discoverability', ids: ['website', 'service_attrs', 'hours_fresh'] }
  ];

  var total = 0, max = 0, forcedF = false;
  var groupsOut = [];
  var fixFirst = null;

  for (var i = 0; i < groups.length; i++) {
    var g = groups[i];
    var gChecks = [];
    var gAchieved = 0, gMax = 0;
    for (var j = 0; j < g.ids.length; j++) {
      var c = checks[g.ids[j]];
      if (c.state === 'skipped') {
        gChecks.push(c);
        continue;
      }
      gMax += c.weight;
      var awarded = gbpAward(c.state, c.weight);
      gAchieved += awarded;
      if (c.forceF) forcedF = true;
      if (c.state === 'fail' && (!fixFirst || c.weight > fixFirst.weight)) {
        fixFirst = c;
      }
      gChecks.push(c);
    }
    total += gAchieved;
    max   += gMax;
    groupsOut.push({
      id: g.id,
      label: gbpPickText(lang).groups[g.id],
      achieved: gAchieved,
      max: gMax,
      checks: gChecks
    });
  }

  // Scale to 0..100 when the evaluated `max` is less than the full
  // rubric's 100 (Fast Scan max is typically 80). The letter grade
  // and band use this scaled value so a perfect Fast Scan reads as
  // an A, not a C.
  var scaled = max > 0 ? Math.round((total / max) * 100) : 0;

  return {
    total:       total,
    max:         max,
    scaled:      scaled,
    band:        gbpGradeBand(scaled, forcedF),
    letter:      gbpLetter(scaled, forcedF),
    forcedF:     forcedF,
    deepScan:    !!(deepScanData && (deepScanData.ownerReplyRate != null || deepScanData.newestReviewAgeDays != null || deepScanData.nap)),
    peerMedian:  peer,
    groups:      groupsOut,
    fixFirst:    fixFirst
  };
}

// ------------------------------------------------------------
// Dual export (browser classic-script globals + Node require)
// ------------------------------------------------------------

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GBP_TEXT:              GBP_TEXT,
    GBP_SERVICE_FIELDS:    GBP_SERVICE_FIELDS,
    gbpPickText:           gbpPickText,
    gbpResolvePeerMedian:  gbpResolvePeerMedian,
    gbpGradeBand:          gbpGradeBand,
    gbpLetter:             gbpLetter,
    gbpCountServiceAttrs:  gbpCountServiceAttrs,
    gbpIsGenericType:      gbpIsGenericType,
    gbpScoreCandidate:     gbpScoreCandidate
  };
}
