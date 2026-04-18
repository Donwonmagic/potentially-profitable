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
      'age-gate': 2.0,    // ONLY subtype with non-zero age-gate weight
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
