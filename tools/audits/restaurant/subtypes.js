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
  }
];
