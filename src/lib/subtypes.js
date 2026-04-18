// ============================================================
// Restaurant subtype registry
// ============================================================
//
// Canonical list of ~10 restaurant subtypes we tailor the audit,
// the deep-report email, and the checklist PDFs to. Each entry
// carries every surface a caller might need:
//
//   id            — stable URL-safe identifier (used in `?s=` share
//                   links and in template dispatch). Do NOT rename
//                   an existing id without adding a migration —
//                   share links in the wild carry these strings.
//   label         — human-facing label shown in the selector UI.
//   schemaTypes   — JSON-LD @type values that IMPLY this subtype
//                   when detected (schema.org LocalBusiness children).
//   platformHints — normalized platform-name → weight map. Keys are
//                   the lowercased `name` from RESTAURANT_ORDERING_HOSTS
//                   / RESTAURANT_RESERVATION_HOSTS in restaurant-checks.js
//                   (toast, slice, resy, tock, opentable, tripleseat, …).
//   keywords      — regex patterns run against visible page text.
//                   Hedged signals — they add to the subtype score
//                   but rarely decide detection on their own.
//   weights       — per-check weight overrides. Keys are priority-
//                   check ids from RESTAURANT_PRIORITY_CHECKS
//                   (viewport, tap-targets, color-contrast, font-size,
//                   phone, platform, conversions, menu-format,
//                   schema, and the Phase H additions). Values replace
//                   the default weight on the check for this subtype.
//                   Use 0 to suppress a check entirely for a subtype
//                   (e.g. age-gate is 0 for everyone but bar-pub).
//
// The existing inline detection (BUSINESS_TYPE_DEFS in
// tools/audits/restaurant/index.html) covered 5 subtypes; this
// registry extends to 10 and is the single source of truth the
// audit, the deep-report templates, and the checklist PDFs all
// dispatch through starting in Phase C.
//
// Backward-compat: the three legacy ids (casual-dining, cafe-bakery,
// plus the generic 'restaurant') are kept alongside the new clean
// ids so existing share links keep working. RESTAURANT_SUBTYPE_ALIASES
// below maps legacy → canonical for any caller that wants to collapse
// them.

export const RESTAURANT_SUBTYPES = [
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
      // Reservations carry the entire funnel; menu-format (tasting
      // menu PDF) is part of the marketing pitch; age-gate irrelevant.
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
      conversions: 1.5, // events + reservations matter
      'age-gate': 2.0,  // this is the ONLY subtype with non-zero age-gate weight
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
      conversions: 2.0, // ordering IS the business
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
      'food-truck-schedule': 2.0, // this subtype's headline check
      conversions: 0.5, // most trucks take cash/Venmo at the window
      'menu-format': 1.0,
      'age-gate': 0,
      'aggregator-only': 0,
      // Maps check is less important: trucks MOVE. Schedule page > map.
      platform: 0.5
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
      'aggregator-only': 2.0, // THE headline check
      conversions: 1.5,
      'menu-format': 1.0,
      // No tap-to-call necessarily — most ghost kitchens don't take phone orders
      phone: 0.5,
      // Map is less critical; customers never visit
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
      'catering-page': 2.5, // headline check — this IS the site
      conversions: 1.5, // lead form or direct booking
      'menu-format': 1.5, // catering PDFs ARE the product here (different standard)
      phone: 2.0,
      'age-gate': 0,
      'food-truck-schedule': 0,
      'aggregator-only': 0
    }
  }
];

// Legacy → canonical id mapping. Share links and old URLs that carry
// ?bt=cafe-bakery or ?s=casual-dining should still route to a real
// subtype. The legacy ids are intentionally left ALIVE here (not in
// the main array) so any code that resolves an id via RESTAURANT_SUBTYPES
// can fall back through this table when it misses.
export const RESTAURANT_SUBTYPE_ALIASES = {
  'cafe-bakery': 'cafe',  // was a single lumped subtype; now split. Default resolve to cafe; bakery heuristics will often re-detect.
  'casual': 'casual-dining',
  'restaurant': 'casual-dining',
  'coffee-shop': 'cafe',
  'coffeeshop': 'cafe',
  'brewery': 'bar-pub',
  'pub': 'bar-pub',
  'taproom': 'bar-pub'
};

// Convenience: flat array of ids for enum validation.
export const RESTAURANT_SUBTYPE_IDS = RESTAURANT_SUBTYPES.map(function(s){ return s.id; });

/**
 * Resolve a caller-supplied subtype id (possibly legacy) to the
 * canonical id. Returns null for unknown ids so the caller can fall
 * back to detection rather than silently mis-routing.
 */
export function canonicalSubtypeId(id) {
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
export function getSubtype(id) {
  var canon = canonicalSubtypeId(id);
  if (!canon) return null;
  for (var i = 0; i < RESTAURANT_SUBTYPES.length; i++) {
    if (RESTAURANT_SUBTYPES[i].id === canon) return RESTAURANT_SUBTYPES[i];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Subtype detection
// ---------------------------------------------------------------------------
//
// detectSubtype(signals) walks the registry and returns the best-matching
// subtype. Phase B3 covers ONLY the schema.org @type path — the strongest
// and most unambiguous signal available. Phase B4 adds platform-hint
// scoring (e.g. Slice host → pizzeria); Phase B5 adds keyword heuristics
// against visible page text. Each later sprint layers on top without
// changing B3's behavior for sites that publish good schema.
//
// signals shape (all fields optional):
//   {
//     schemaTypes?: string[],   // JSON-LD @type values seen on the page
//     platforms?:   string[],   // normalized platform names detected
//     pageText?:    string      // visible page text (lowercase preferred)
//   }
//
// Return shape:
//   {
//     id:           string|null,   // canonical subtype id, or null if nothing matched
//     confidence:   number,        // 0..1 how sure we are (0 on null)
//     alternatives: { id, score }[] // next 2 contenders, highest-first
//   }

// Weight assigned to each schema.org @type hit. Kept separate so Phase B4
// platform hits can land on the same numeric scale.
var SCHEMA_TYPE_WEIGHT = 10;

export function detectSubtype(signals) {
  var types = (signals && Array.isArray(signals.schemaTypes)) ? signals.schemaTypes : [];
  var scores = {};
  for (var i = 0; i < RESTAURANT_SUBTYPES.length; i++) {
    scores[RESTAURANT_SUBTYPES[i].id] = 0;
  }

  // Schema @type hits. A schema-matched subtype is the strongest signal
  // we can possibly have — a bakery that publishes `@type: Bakery` is
  // a bakery with near-certainty.
  for (var j = 0; j < types.length; j++) {
    var t = String(types[j] || '');
    if (!t) continue;
    for (var k = 0; k < RESTAURANT_SUBTYPES.length; k++) {
      var entry = RESTAURANT_SUBTYPES[k];
      if (entry.schemaTypes.indexOf(t) >= 0) {
        scores[entry.id] += SCHEMA_TYPE_WEIGHT;
      }
    }
  }

  // Platform-hint hits. Each subtype in the registry carries a
  // platformHints map (normalized platform name → weight 1..5). A hit
  // contributes that weight to the subtype's score. Platforms are
  // routinely shared across subtypes (Toast shows up on fast-casual,
  // casual-dining, cafes, pizzerias) so this path tilts rather than
  // decides on its own.
  var platforms = (signals && Array.isArray(signals.platforms)) ? signals.platforms : [];
  for (var p = 0; p < platforms.length; p++) {
    var pname = String(platforms[p] || '').toLowerCase().trim();
    if (!pname) continue;
    for (var m = 0; m < RESTAURANT_SUBTYPES.length; m++) {
      var sub = RESTAURANT_SUBTYPES[m];
      var hint = sub.platformHints && sub.platformHints[pname];
      if (typeof hint === 'number' && hint > 0) {
        scores[sub.id] += hint;
      }
    }
  }

  // Keyword heuristics. The weakest of the three signal paths: visible
  // page text matched against each subtype's keyword regex list. A hit
  // contributes KEYWORD_WEIGHT per distinct regex that matched (not
  // per occurrence — boolean match counts). The per-subtype total is
  // capped at KEYWORD_CAP so a marketing page that reuses "happy hour"
  // sixteen times can't drown out a schema signal.
  var pageText = (signals && typeof signals.pageText === 'string') ? signals.pageText : '';
  if (pageText) {
    for (var q = 0; q < RESTAURANT_SUBTYPES.length; q++) {
      var kwEntry = RESTAURANT_SUBTYPES[q];
      var kwHits = 0;
      var patterns = kwEntry.keywords || [];
      for (var r = 0; r < patterns.length; r++) {
        if (patterns[r].test(pageText)) kwHits++;
      }
      scores[kwEntry.id] += Math.min(KEYWORD_CAP, kwHits * KEYWORD_WEIGHT);
    }
  }

  return rankSubtypeScores(scores);
}

// Keyword hits contribute less than schema or platform signals; the
// cap prevents a single keyword-heavy page (cocktail list reusing
// "whiskey") from swamping other subtypes' real signals.
var KEYWORD_WEIGHT = 1;
var KEYWORD_CAP = 5;

// Shared ranking + shaping helper. Extracted so Phase B4/B5 can call it
// after adding their own signal contributions to the score map.
function rankSubtypeScores(scores) {
  var entries = Object.keys(scores).map(function(id){
    return { id: id, score: scores[id] };
  }).sort(function(a, b){ return b.score - a.score; });

  var top = entries[0];
  if (!top || top.score <= 0) {
    return { id: null, confidence: 0, alternatives: [] };
  }
  // Confidence is the winner's share of the total non-zero score,
  // clamped to [0, 1]. A single schema hit on one subtype → 1.0;
  // two subtypes tied → 0.5 each. Later sprints will add platform
  // and keyword hits that spread the score across more candidates.
  var total = entries.reduce(function(sum, e){ return sum + Math.max(0, e.score); }, 0);
  var confidence = total > 0 ? top.score / total : 0;
  var alternatives = entries.slice(1, 3).filter(function(e){ return e.score > 0; });
  return { id: top.id, confidence: confidence, alternatives: alternatives };
}
