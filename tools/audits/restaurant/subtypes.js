/**
 * Restaurant subtype registry — client mirror of src/lib/subtypes.js
 *
 * Loaded as a classic script alongside restaurant-checks.js so its
 * top-level `var`s are available to the audit IIFE in index.html as
 * globals. Canonical source is src/lib/subtypes.js (ESM) — this file
 * must stay in lockstep with it.
 *
 * Naming mirrors the server file with the same global names
 * (RESTAURANT_SUBTYPES, RESTAURANT_SUBTYPE_ALIASES, etc.) so a caller
 * writing code that shares logic across worker and client can use
 * identical references.
 *
 * See src/lib/subtypes.js for the field-by-field spec.
 */

var RESTAURANT_SUBTYPES = [
  {
    id: 'fine-dining',
    label: 'Fine-dining restaurant',
    schemaTypes: [],
    platformHints: { resy: 5, tock: 5, sevenrooms: 4, opentable: 2 },
    keywords: [
      /\btasting\s+menu\b/i, /\bprix\s+fixe\b/i, /\bsommelier\b/i,
      /\bchef['’]s\s+(?:counter|table)\b/i, /\bwine\s+pairing\b/i,
      /\bdegustation\b/i, /\bamuse[-\s]?bouche\b/i, /\bmichelin\b/i,
      /\bmulti[-\s]?course\b/i, /\bomakase\b/i
    ],
    weights: {
      conversions: 2.0,
      'menu-format': 1.5,
      'age-gate': 0,
      'food-truck-schedule': 0,
      'aggregator-only': 0
    }
  },
  {
    id: 'casual-dining',
    label: 'Casual / full-service restaurant',
    schemaTypes: ['Restaurant', 'FoodEstablishment'],
    platformHints: { opentable: 3, yelpreservations: 2, toast: 1, square: 1 },
    keywords: [
      /\bdining\s+room\b/i, /\bfull\s+bar\b/i,
      /\blunch\s+and\s+dinner\b/i, /\bsignature\s+dishes?\b/i,
      /\bfamily[-\s]friendly\b/i, /\bneighborhood\s+(?:spot|restaurant|favorite)\b/i
    ],
    weights: {
      conversions: 1.5,
      'age-gate': 0,
      'food-truck-schedule': 0,
      'aggregator-only': 0
    }
  },
  {
    id: 'fast-casual',
    label: 'Fast-casual or quick-service',
    schemaTypes: ['FastFoodRestaurant'],
    platformHints: {
      toast: 3, chownow: 4, square: 1, bentobox: 2, slice: 4,
      menufy: 3, olo: 2, lunchbox: 2, checkmate: 2, popmenu: 1,
      doordash: 1, grubhub: 1, 'uber eats': 1
    },
    keywords: [
      /\border\s+online\b/i, /\border\s+for\s+(?:pickup|delivery|takeout|take[-\s]out)\b/i,
      /\bgrab\s+(?:and|&)\s+go\b/i, /\bfast[-\s]casual\b/i,
      /\bcounter\s+service\b/i, /\bdrive[-\s]thru\b/i, /\bcurbside\s+pickup\b/i
    ],
    weights: {
      conversions: 2.0,
      'menu-format': 1.5,
      'age-gate': 0,
      'food-truck-schedule': 0,
      'aggregator-only': 0
    }
  },
  {
    id: 'cafe',
    label: 'Café or coffee shop',
    schemaTypes: ['CafeOrCoffeeShop'],
    platformHints: { square: 3, toast: 1, chownow: 1 },
    keywords: [
      /\b(?:espresso|cappuccino|latte|cortado|pour[-\s]over|americano|macchiato)\b/i,
      /\bcoffee\s+(?:shop|bar|house)\b/i, /\bcafé\b/i, /\bcafe\b/i,
      /\bartisan\s+coffee\b/i, /\broastery?\b/i, /\bsingle[-\s]origin\b/i,
      /\bcold\s+brew\b/i
    ],
    weights: {
      'menu-format': 1.0,
      conversions: 1.0,
      'wholesale-custom-orders': 1.0,
      'age-gate': 0,
      'food-truck-schedule': 0,
      'aggregator-only': 0
    }
  },
  {
    id: 'bakery',
    label: 'Bakery or pâtisserie',
    schemaTypes: ['Bakery', 'IceCreamShop'],
    platformHints: { square: 3, toast: 1 },
    keywords: [
      /\b(?:pastries|croissants?|muffins?|scones?|éclairs?|macarons?)\b/i,
      /\bbakery\b/i, /\bbaked\s+goods\b/i, /\bpâtisserie\b/i, /\bpatisserie\b/i,
      /\bartisan\s+bread\b/i, /\bsourdough\b/i, /\bcustom\s+(?:cake|cakes|order)\b/i,
      /\bwedding\s+cakes?\b/i, /\bcake\s+(?:order|orders|pickup)\b/i
    ],
    weights: {
      'wholesale-custom-orders': 2.0,
      'menu-format': 1.0,
      conversions: 1.0,
      'age-gate': 0,
      'food-truck-schedule': 0,
      'aggregator-only': 0
    }
  },
  {
    id: 'bar-pub',
    label: 'Bar, pub, or brewery',
    schemaTypes: ['BarOrPub', 'Brewery', 'Winery', 'Distillery'],
    platformHints: { tripleseat: 3, opentable: 1, resy: 1, sevenrooms: 1 },
    keywords: [
      /\bcocktails?\b/i, /\bcraft\s+beer\b/i, /\bon\s+tap\b/i,
      /\b(?:draft|draught)\s+(?:beer|list)\b/i, /\bhappy\s+hour\b/i,
      /\b(?:gastro)?pub\b/i, /\btaproom\b/i, /\bwhiskey\s+(?:bar|list)\b/i,
      /\bwine\s+bar\b/i, /\bspeakeasy\b/i, /\bbrewery\b/i
    ],
    weights: {
      conversions: 1.5,
      // age-gate is suppressed for every restaurant subtype including
      // bar-pub. Age-gates on the WEB are rarely mandated by state ABC
      // rules for bars/restaurants — they chiefly apply to packaged-
      // alcohol retailers, cannabis dispensaries, and vape/tobacco
      // stores. Flagging a bar for missing one was overreach. If a
      // future dispensary-style subtype is added, it can set this
      // weight nonzero in its own entry; the check definition stays
      // in restaurant-checks.js for that extensibility.
      'age-gate': 0,
      'menu-format': 1.5, // cocktail/draft list rotation is heavy
      'food-truck-schedule': 0,
      'aggregator-only': 0
    }
  },
  {
    id: 'pizzeria',
    label: 'Pizzeria',
    schemaTypes: ['Restaurant', 'FastFoodRestaurant'],
    platformHints: { slice: 5, toast: 2, chownow: 2, doordash: 2, grubhub: 2, square: 1 },
    keywords: [
      /\bpizza(?:s|eria)?\b/i, /\bslice(?:s)?\b/i, /\bneapolitan\b/i,
      /\bwood[-\s]fired\b/i, /\bcoal[-\s]fired\b/i, /\bsicilian\b/i,
      /\bdetroit[-\s]style\b/i, /\bpepperoni\b/i, /\bcalzone\b/i
    ],
    weights: {
      conversions: 2.0,
      'delivery-radius': 1.5,
      'menu-format': 1.5,
      'age-gate': 0,
      'food-truck-schedule': 0,
      'aggregator-only': 0
    }
  },
  {
    id: 'food-truck',
    label: 'Food truck or pop-up',
    schemaTypes: ['Restaurant', 'FastFoodRestaurant'],
    platformHints: { square: 2, toast: 1 },
    keywords: [
      /\bfood\s+truck\b/i, /\btruck\s+schedule\b/i, /\bwhere\s+(?:we|are\s+we)\b/i,
      /\btoday['’]s\s+location\b/i, /\bpop[-\s]?up\b/i, /\bcatch\s+us\b/i,
      /\bfollow\s+(?:our|us\s+on)\b/i, /\bmobile\s+(?:kitchen|restaurant)\b/i
    ],
    weights: {
      'food-truck-schedule': 2.0,
      conversions: 0.5,
      'menu-format': 1.0,
      platform: 0.5, // maps less important — trucks move
      'age-gate': 0,
      'aggregator-only': 0
    }
  },
  {
    id: 'ghost-kitchen',
    label: 'Ghost kitchen / delivery-only',
    schemaTypes: ['Restaurant', 'FastFoodRestaurant'],
    platformHints: {
      doordash: 4, 'uber eats': 4, grubhub: 4, postmates: 2,
      seamless: 2, caviar: 2, deliveroo: 3, 'just eat': 3,
      deliverect: 3, otter: 3
    },
    keywords: [
      /\bghost\s+kitchen\b/i, /\bvirtual\s+(?:kitchen|restaurant|brand)\b/i,
      /\bdelivery[-\s]only\b/i, /\bcloud\s+kitchen\b/i,
      /\bno\s+dine[-\s]in\b/i, /\bdelivery\s+&\s+pickup\s+only\b/i
    ],
    weights: {
      'aggregator-only': 2.0,
      conversions: 1.5,
      'menu-format': 1.0,
      phone: 0.5,
      platform: 0.5,
      'age-gate': 0,
      'food-truck-schedule': 0
    }
  },
  {
    id: 'catering-only',
    label: 'Catering-only / private events',
    schemaTypes: ['FoodEstablishment', 'Restaurant'],
    platformHints: { ezcater: 5, catertrax: 5, tripleseat: 3, square: 1 },
    keywords: [
      /\bcatering\s+(?:menu|services?|packages?)\b/i, /\bprivate\s+(?:events?|dining|parties)\b/i,
      /\bcorporate\s+catering\b/i, /\bwedding\s+catering\b/i,
      /\bbuffet\s+catering\b/i, /\bdrop[-\s]off\s+catering\b/i,
      /\boff[-\s]premise\b/i, /\brequest\s+a\s+quote\b/i,
      /\bevent\s+planning\b/i
    ],
    weights: {
      'catering-page': 2.5,
      conversions: 1.5,
      'menu-format': 1.5,
      phone: 2.0,
      'age-gate': 0,
      'food-truck-schedule': 0,
      'aggregator-only': 0
    }
  }
];

// Legacy → canonical id mapping. Share links and older URLs that carry
// ?bt=cafe-bakery or ?s=casual should still route to a real subtype.
var RESTAURANT_SUBTYPE_ALIASES = {
  'cafe-bakery':  'cafe',
  'casual':       'casual-dining',
  'restaurant':   'casual-dining',
  'coffee-shop':  'cafe',
  'coffeeshop':   'cafe',
  'brewery':      'bar-pub',
  'pub':          'bar-pub',
  'taproom':      'bar-pub'
};

// Flat id array for enum validation.
var RESTAURANT_SUBTYPE_IDS = RESTAURANT_SUBTYPES.map(function(s){ return s.id; });

/**
 * Resolve a caller-supplied subtype id (possibly legacy) to the
 * canonical id. Returns null for unknown ids so the caller can fall
 * back to detection rather than silently mis-routing.
 */
function canonicalSubtypeId(id) {
  if (!id || typeof id !== 'string') return null;
  if (RESTAURANT_SUBTYPE_IDS.indexOf(id) >= 0) return id;
  var aliased = RESTAURANT_SUBTYPE_ALIASES[id];
  if (aliased && RESTAURANT_SUBTYPE_IDS.indexOf(aliased) >= 0) return aliased;
  return null;
}

/**
 * Look up a subtype by id. Returns the full registry entry or null.
 * Handles legacy ids transparently via canonicalSubtypeId.
 */
function getSubtype(id) {
  var canon = canonicalSubtypeId(id);
  if (!canon) return null;
  for (var i = 0; i < RESTAURANT_SUBTYPES.length; i++) {
    if (RESTAURANT_SUBTYPES[i].id === canon) return RESTAURANT_SUBTYPES[i];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Subtype detection — mirrors src/lib/subtypes.js (see that file for the
// full field-level spec). Phase B3 covers only the schema.org @type path.
// Phase B4/B5 will layer platform-hint and keyword scoring.
//
// signals: { schemaTypes?: string[], platforms?: string[], pageText?: string }
// returns: { id: string|null, confidence: number, alternatives: [{id, score}] }
// ---------------------------------------------------------------------------

var SUBTYPE_SCHEMA_TYPE_WEIGHT = 10;

function detectSubtype(signals) {
  var types = (signals && Object.prototype.toString.call(signals.schemaTypes) === '[object Array]')
    ? signals.schemaTypes : [];
  var scores = {};
  for (var i = 0; i < RESTAURANT_SUBTYPES.length; i++) {
    scores[RESTAURANT_SUBTYPES[i].id] = 0;
  }

  for (var j = 0; j < types.length; j++) {
    var t = String(types[j] || '');
    if (!t) continue;
    for (var k = 0; k < RESTAURANT_SUBTYPES.length; k++) {
      var entry = RESTAURANT_SUBTYPES[k];
      if (entry.schemaTypes.indexOf(t) >= 0) {
        scores[entry.id] += SUBTYPE_SCHEMA_TYPE_WEIGHT;
      }
    }
  }

  // Platform-hint hits. See src/lib/subtypes.js for the rationale.
  var platforms = (signals && Object.prototype.toString.call(signals.platforms) === '[object Array]')
    ? signals.platforms : [];
  for (var p = 0; p < platforms.length; p++) {
    var pname = String(platforms[p] || '').toLowerCase().replace(/^\s+|\s+$/g, '');
    if (!pname) continue;
    for (var m = 0; m < RESTAURANT_SUBTYPES.length; m++) {
      var sub = RESTAURANT_SUBTYPES[m];
      var hint = sub.platformHints && sub.platformHints[pname];
      if (typeof hint === 'number' && hint > 0) {
        scores[sub.id] += hint;
      }
    }
  }

  // Keyword heuristics (capped). See src/lib/subtypes.js for rationale.
  var pageText = (signals && typeof signals.pageText === 'string') ? signals.pageText : '';
  if (pageText) {
    for (var q = 0; q < RESTAURANT_SUBTYPES.length; q++) {
      var kwEntry = RESTAURANT_SUBTYPES[q];
      var kwHits = 0;
      var patterns = kwEntry.keywords || [];
      for (var r = 0; r < patterns.length; r++) {
        if (patterns[r].test(pageText)) kwHits++;
      }
      scores[kwEntry.id] += Math.min(SUBTYPE_KEYWORD_CAP, kwHits * SUBTYPE_KEYWORD_WEIGHT);
    }
  }

  return rankSubtypeScores(scores);
}

var SUBTYPE_KEYWORD_WEIGHT = 1;
var SUBTYPE_KEYWORD_CAP = 5;

// Phase I5: rough median scores per subtype, used to contextualize
// a just-run audit with "typical [subtype] sites score ~X overall."
// Not a rigorous benchmark — they're tradespeople's estimates from
// auditing hundreds of restaurant sites, useful for ANCHORING an
// owner's expectation. Every subtype gets the 5-axis shape so the
// render code stays identical across subtypes. Order:
//   overall  — weighted mean of the four PSI pillars
//   mobile   — PSI mobile performance
//   a11y     — PSI accessibility
//   seo      — PSI SEO
//   readiness — restaurant-specific priority-check rollup
var RESTAURANT_SUBTYPE_BENCHMARKS = {
  'fine-dining':    { overall: 68, mobile: 60, a11y: 78, seo: 62, readiness: 55 },
  'casual-dining':  { overall: 62, mobile: 58, a11y: 74, seo: 58, readiness: 50 },
  'fast-casual':    { overall: 72, mobile: 70, a11y: 76, seo: 68, readiness: 62 },
  'cafe':           { overall: 65, mobile: 62, a11y: 72, seo: 60, readiness: 54 },
  'bakery':         { overall: 60, mobile: 55, a11y: 70, seo: 55, readiness: 45 },
  'bar-pub':        { overall: 58, mobile: 54, a11y: 68, seo: 52, readiness: 42 },
  'pizzeria':       { overall: 70, mobile: 68, a11y: 72, seo: 64, readiness: 60 },
  'food-truck':     { overall: 55, mobile: 54, a11y: 66, seo: 48, readiness: 40 },
  'ghost-kitchen':  { overall: 65, mobile: 64, a11y: 70, seo: 58, readiness: 52 },
  'catering-only':  { overall: 60, mobile: 56, a11y: 70, seo: 58, readiness: 48 }
};

function subtypeBenchmark(id) {
  var canon = canonicalSubtypeId(id);
  return (canon && RESTAURANT_SUBTYPE_BENCHMARKS[canon]) || null;
}

/**
 * Resolve a subtype-specific weight override for a given check id.
 * Returns the number (>=0) if overridden, or null to use the check's
 * default weight. 0 is meaningful — "irrelevant for this subtype."
 * See src/lib/subtypes.js for the full spec.
 */
function subtypeWeights(id, checkId) {
  var sub = getSubtype(id);
  if (!sub || !sub.weights) return null;
  var val = sub.weights[checkId];
  return (typeof val === 'number') ? val : null;
}

// Shared ranking helper. Phase B4/B5 will call this after contributing
// their own signals to the same score map.
function rankSubtypeScores(scores) {
  var entries = Object.keys(scores).map(function(id){
    return { id: id, score: scores[id] };
  }).sort(function(a, b){ return b.score - a.score; });

  var top = entries[0];
  if (!top || top.score <= 0) {
    return { id: null, confidence: 0, alternatives: [] };
  }
  var total = entries.reduce(function(sum, e){ return sum + Math.max(0, e.score); }, 0);
  var confidence = total > 0 ? top.score / total : 0;
  var alternatives = entries.slice(1, 3).filter(function(e){ return e.score > 0; });
  return { id: top.id, confidence: confidence, alternatives: alternatives };
}
