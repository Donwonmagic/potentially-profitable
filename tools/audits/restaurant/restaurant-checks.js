/**
 * Restaurant Website Audit — Platform Patterns, Priority Checks & Subtype Logic
 *
 * Loaded as a classic script before the main IIFE in ./index.html. All
 * top-level `var` declarations here are available as globals to the
 * consumer script (matching the pattern used by the sibling wellness
 * audit at ../wellness/wellness-checks.js).
 *
 * Detection categories (populated in later sprints):
 *   ordering     — online ordering platforms (Toast, Square, ChowNow, …)
 *   reservations — reservation platforms (OpenTable, Resy, Tock, …)
 *   maps         — embedded maps and directions
 *   phone        — tap-to-call phone links
 *
 * Each platform pattern is a substring match against all URLs found in
 * the page's HTML. If any URL contains the pattern string, the
 * platform is detected.
 *
 * Subsequent sprints (A2–A7) move the existing inline definitions out
 * of index.html into this module without changing behavior.
 */

// ---------------------------------------------------------------------------
// Online ordering platforms
// ---------------------------------------------------------------------------
// Deliberately skewed toward small-business-friendly platforms (BentoBox,
// Popmenu, GloriaFood, Owner, Hostme, ResDiary, Flipdish) alongside the
// big US names — because Muntin's actual client base is independent
// restaurants, and a false negative ("we didn't detect your ordering
// platform") is worse than detecting one we don't recognize. Add new
// patterns here as real restaurant sites surface them in the wild.

var RESTAURANT_ORDERING_HOSTS = [
  // --- Major US POS + online ordering ---
  { pattern: 'toasttab',        name: 'Toast' },
  { pattern: 'toastpos',        name: 'Toast' },
  { pattern: 'toast.chow',      name: 'Toast' },
  { pattern: 'toastorder',      name: 'Toast' },
  { pattern: 'square.site',     name: 'Square' },
  { pattern: 'squareup',        name: 'Square' },
  { pattern: 'squarecdn',       name: 'Square' },
  { pattern: 'clover.com',      name: 'Clover' },
  { pattern: 'clovercdn',       name: 'Clover' },
  { pattern: 'chownow',         name: 'ChowNow' },
  { pattern: 'cnstatic',        name: 'ChowNow' },
  // --- Independent-restaurant-focused builders + middleware ---
  // These are the ones small restaurants actually use.
  { pattern: 'bentobox',        name: 'BentoBox' },
  { pattern: 'getbento',        name: 'BentoBox' },
  { pattern: 'popmenu',         name: 'Popmenu' },
  { pattern: 'popmenu-cdn',     name: 'Popmenu' },
  { pattern: 'lunchbox.io',     name: 'Lunchbox' },
  { pattern: 'gloriafood',      name: 'GloriaFood' },
  { pattern: 'owner.com',       name: 'Owner' },
  { pattern: 'touchbistro',     name: 'TouchBistro' },
  { pattern: 'spoton',          name: 'SpotOn' },
  { pattern: 'menufy',          name: 'Menufy' },
  { pattern: 'slicelife',       name: 'Slice' },
  { pattern: 'slicehost',       name: 'Slice' },
  { pattern: 'olo.com',         name: 'Olo' },
  { pattern: 'ololabs',         name: 'Olo' },
  { pattern: 'deliverect',      name: 'Deliverect' },
  { pattern: 'otter.com',       name: 'Otter' },
  { pattern: 'tryotter',        name: 'Otter' },
  { pattern: 'spoonity',        name: 'Spoonity' },
  { pattern: 'bikky',           name: 'Bikky' },
  { pattern: 'fishbowl',        name: 'Fishbowl' },
  { pattern: 'getslerp',        name: 'Slerp' },
  { pattern: 'slerp.com',       name: 'Slerp' },
  { pattern: 'incentivio',      name: 'Incentivio' },
  { pattern: 'checkmate.co',    name: 'Checkmate' },
  { pattern: 'itsacheckmate',   name: 'Checkmate' },
  { pattern: 'craver',          name: 'Craver' },
  { pattern: 'sauce.app',       name: 'Sauce' },
  { pattern: 'trysauce',        name: 'Sauce' },
  { pattern: 'tiqets',          name: 'Tiqets' },
  { pattern: 'goparrot',        name: 'GoParrot' },
  { pattern: 'ordrslip',        name: 'Ordrslip' },
  { pattern: 'orderease',       name: 'OrderEase' },
  { pattern: 'ordrai',          name: 'Ordr.ai' },
  // --- US marketplaces / aggregators ---
  { pattern: 'grubhub',         name: 'Grubhub' },
  { pattern: 'doordash',        name: 'DoorDash' },
  { pattern: 'ubereats',        name: 'Uber Eats' },
  { pattern: 'ubercdn',         name: 'Uber Eats' },
  { pattern: 'postmates',       name: 'Postmates' },
  { pattern: 'caviar',          name: 'Caviar' },
  { pattern: 'seamless',        name: 'Seamless' },
  { pattern: 'ezcater',         name: 'ezCater' },
  { pattern: 'catertrax',       name: 'CaterTrax' },
  { pattern: 'tripleseat',      name: 'Tripleseat' },
  // --- International marketplaces + builders ---
  { pattern: 'deliveroo',       name: 'Deliveroo' },
  { pattern: 'just-eat',        name: 'Just Eat' },
  { pattern: 'justeat',         name: 'Just Eat' },
  { pattern: 'justeattakeaway', name: 'Just Eat Takeaway' },
  { pattern: 'ifood.com',       name: 'iFood' },
  { pattern: 'rappi.com',       name: 'Rappi' },
  { pattern: 'skipthedishes',   name: 'SkipTheDishes' },
  { pattern: 'foodora',         name: 'Foodora' },
  { pattern: 'foodpanda',       name: 'Foodpanda' },
  { pattern: 'menulog',         name: 'Menulog' },
  { pattern: 'grabfood',        name: 'GrabFood' },
  { pattern: 'wolt',            name: 'Wolt' },
  { pattern: 'getir',           name: 'Getir' },
  { pattern: 'stuart.com',      name: 'Stuart' },
  { pattern: 'talabat',         name: 'Talabat' },
  { pattern: 'careem',          name: 'Careem' },
  { pattern: 'glovoapp',        name: 'Glovo' },
  { pattern: 'hungryhouse',     name: 'Hungryhouse' },
  { pattern: 'flipdish',        name: 'Flipdish' }
];

// ---------------------------------------------------------------------------
// Reservation platforms
// ---------------------------------------------------------------------------
// OpenTable dominates US fine-dining; Resy and Tock skew modern/tasting-menu;
// SevenRooms is large-group / private-dining. Keep an eye on TheFork (EU) and
// TableCheck (APAC) for international coverage.

var RESTAURANT_RESERVATION_HOSTS = [
  // --- Major US + international booking platforms ---
  { pattern: 'opentable',       name: 'OpenTable' },
  { pattern: 'otrestaurant',    name: 'OpenTable' },
  { pattern: 'opentablecdn',    name: 'OpenTable' },
  { pattern: 'resy.com',        name: 'Resy' },
  { pattern: 'resy.network',    name: 'Resy' },
  { pattern: 'exploretock',     name: 'Tock' },
  { pattern: 'tock.app',        name: 'Tock' },
  { pattern: 'sevenrooms',      name: 'SevenRooms' },
  { pattern: '7rooms',          name: 'SevenRooms' },
  // Yelp's reservation product (formerly Nowait)
  { pattern: 'yelpreservations', name: 'Yelp Reservations' },
  { pattern: 'nowait.com',      name: 'Yelp Reservations' },
  // --- US/EU smaller booking platforms ---
  { pattern: 'eatapp.co',       name: 'Eat App' },
  { pattern: 'umaiapp',         name: 'Umai' },
  { pattern: 'tablein',         name: 'TableIn' },
  { pattern: 'waitwhile',       name: 'Waitwhile' },
  { pattern: 'nextme',          name: 'NextMe' },
  { pattern: 'tablecheck',      name: 'TableCheck' },
  { pattern: 'tablelist',       name: 'Tablelist' },
  // --- Smaller + regional booking platforms ---
  { pattern: 'eveve',           name: 'Eveve' },
  { pattern: 'resdiary',        name: 'ResDiary' },
  { pattern: 'hostmeapp',       name: 'Hostme' },
  { pattern: 'wisely.io',       name: 'Wisely' },
  { pattern: 'getwisely',       name: 'Wisely' },
  { pattern: 'quandoo',         name: 'Quandoo' },
  { pattern: 'formitable',      name: 'Formitable' },
  { pattern: 'bookatable',      name: 'Bookatable' },
  { pattern: 'lafourchette',    name: 'TheFork' },
  { pattern: 'thefork',         name: 'TheFork' },
  { pattern: 'dineseed',        name: 'Dineseed' },
  { pattern: 'dinebook',        name: 'DineBook' }
];

// ---------------------------------------------------------------------------
// Maps / directions
// ---------------------------------------------------------------------------
// Matched against both network-requests and anchor hrefs so both embedded
// iframes (maps.google/gstatic) and plain "Directions" links (goo.gl/maps,
// maps.apple.com) register as a map present.

var RESTAURANT_MAP_HOSTS = [
  { pattern: 'maps.google',      name: 'Google Maps' },
  { pattern: 'maps.googleapis',  name: 'Google Maps' },
  { pattern: 'maps.gstatic',     name: 'Google Maps' },
  { pattern: 'gstatic.com/maps', name: 'Google Maps' },
  { pattern: 'google.com/maps',  name: 'Google Maps' },
  { pattern: 'goo.gl/maps',      name: 'Google Maps' },
  { pattern: 'mapbox.com',       name: 'Mapbox' },
  { pattern: 'api.mapbox',       name: 'Mapbox' },
  // Apple Maps (embedded via MapKit JS)
  { pattern: 'apple.com/maps',   name: 'Apple Maps' },
  { pattern: 'mapkit.js',        name: 'Apple Maps' },
  { pattern: 'maps.apple.com',   name: 'Apple Maps' },
  // Bing Maps (uses virtualearth.net under the hood)
  { pattern: 'bing.com/maps',    name: 'Bing Maps' },
  { pattern: 'virtualearth.net', name: 'Bing Maps' },
  // Open-source mapping
  { pattern: 'openstreetmap',    name: 'OpenStreetMap' },
  { pattern: 'maplibre',         name: 'MapLibre' },
  { pattern: 'leafletjs',        name: 'Leaflet' },
  { pattern: 'unpkg.com/leaflet',name: 'Leaflet' },
  { pattern: 'waze.com',         name: 'Waze' }
];

// Click-to-call phone. `tel:` hrefs never show up in network-requests
// (nothing is actually fetched), so this only matches against the
// combined URL list that includes anchor hrefs pulled from audit
// detail snippets.
var RESTAURANT_PHONE_HOSTS = [
  { pattern: 'tel:', name: 'Click-to-call' }
];

// ---------------------------------------------------------------------------
// Business-type / cuisine detection
// ---------------------------------------------------------------------------
// Each subtype carries three detection surfaces:
//   schemaTypes    — JSON-LD @type strings that imply the subtype outright
//   platformHints  — normalized platform keys (lowercased `name` from the
//                    hosts arrays above) with a confidence weight. E.g.
//                    tock → fine-dining (5), slice → fast-casual (4).
//   keywordPatterns — regexes run against visible page text for hedged
//                    signals ('tasting menu', 'espresso', 'taproom').
//
// IMPORTANT: platformHints keys must match the NORMALIZED platform names
// returned by detectPlatforms (lowercased, whitespace stripped), NOT the
// raw pattern strings. Toast patterns resolve to name 'Toast' → normalize
// to 'toast'; Slice patterns resolve to 'Slice' → 'slice'; etc. See the
// hosts arrays above for the authoritative name-per-pattern mapping.
//
// Phase B expands this registry to ~10 subtypes via src/lib/subtypes.js;
// the current five map 1:1 into the new taxonomy.

var RESTAURANT_BUSINESS_TYPE_DEFS = {
  'fine-dining': {
    label: 'Fine-dining restaurant',
    schemaTypes: [],
    platformHints: { resy: 4, tock: 5, sevenrooms: 4 },
    keywordPatterns: [
      /\btasting\s+menu\b/i, /\bprix\s+fixe\b/i, /\bsommelier\b/i,
      /\bchef['’]s\s+(?:counter|table)\b/i, /\bwine\s+pairing\b/i,
      /\bdegustation\b/i, /\bamuse[-\s]?bouche\b/i, /\bmichelin\b/i,
      /\bmulti[-\s]?course\b/i, /\bomakase\b/i
    ]
  },
  'casual-dining': {
    label: 'Casual / full-service restaurant',
    schemaTypes: ['Restaurant', 'FoodEstablishment'],
    platformHints: { opentable: 1, yelpreservations: 1 },
    keywordPatterns: [
      /\bdining\s+room\b/i, /\bfull\s+bar\b/i,
      /\blunch\s+and\s+dinner\b/i, /\bsignature\s+dishes?\b/i,
      /\bfamily[-\s]friendly\b/i, /\bneighborhood\s+(?:spot|restaurant|favorite)\b/i
    ]
  },
  'fast-casual': {
    label: 'Fast-casual or quick-service',
    schemaTypes: ['FastFoodRestaurant'],
    platformHints: { toast: 2, chownow: 3, square: 1, bentobox: 2, slice: 4, menufy: 3, olo: 2, lunchbox: 2, checkmate: 2, popmenu: 1 },
    keywordPatterns: [
      /\border\s+online\b/i, /\border\s+for\s+(?:pickup|delivery|takeout|take[-\s]out)\b/i,
      /\bgrab\s+(?:and|&)\s+go\b/i, /\bfast[-\s]casual\b/i,
      /\bcounter\s+service\b/i, /\bdrive[-\s]thru\b/i, /\bcurbside\s+pickup\b/i
    ]
  },
  'cafe-bakery': {
    label: 'Café or bakery',
    schemaTypes: ['CafeOrCoffeeShop', 'Bakery', 'IceCreamShop'],
    platformHints: { square: 1 },
    keywordPatterns: [
      /\b(?:espresso|cappuccino|latte|cortado|pour[-\s]over)\b/i,
      /\b(?:pastries|croissant|muffins?|scones?)\b/i,
      /\bbakery\b/i, /\bbaked\s+goods\b/i, /\bpatisserie\b/i,
      /\bcoffee\s+shop\b/i, /\bartisan\s+(?:bread|coffee)\b/i
    ]
  },
  'bar-pub': {
    label: 'Bar or pub',
    schemaTypes: ['BarOrPub', 'Brewery', 'Winery', 'Distillery'],
    platformHints: { tripleseat: 2 },
    keywordPatterns: [
      /\bcocktails?\b/i, /\bcraft\s+beer\b/i, /\bon\s+tap\b/i,
      /\b(?:draft|draught)\s+(?:beer|list)\b/i, /\bhappy\s+hour\b/i,
      /\b(?:gastro)?pub\b/i, /\btaproom\b/i, /\bwhiskey\s+(?:bar|list)\b/i,
      /\bwine\s+bar\b/i, /\bspeakeasy\b/i
    ]
  }
};

var RESTAURANT_ALLOWED_BUSINESS_TYPES = [
  // Canonical 10-subtype registry (see ./subtypes.js / src/lib/subtypes.js).
  'fine-dining',
  'casual-dining',
  'fast-casual',
  'cafe',
  'bakery',
  'bar-pub',
  'pizzeria',
  'food-truck',
  'ghost-kitchen',
  'catering-only',
  // Legacy ids kept for backward-compat with shared URLs carrying
  // ?bt=cafe-bakery or ?bt=restaurant. canonicalSubtypeId() maps
  // these to a canonical id at read time.
  'cafe-bakery',
  'restaurant'
];

// ---------------------------------------------------------------------------
// Priority checks
// ---------------------------------------------------------------------------
// The 12 restaurant-specific checks rendered above the Lighthouse
// opportunities list. Each check carries:
//   type       — 'audit' (maps to a Lighthouse audit by id), 'phone',
//                'platform' (maps to one of PLATFORM_PATTERNS keys via
//                `platforms`), 'conversions' (ordering OR reservations),
//                'menu-format' (HTML vs PDF vs image scan), 'schema'
//                (JSON-LD @type=Restaurant presence).
//   weight     — multiplier for the restaurant readiness score.
//   anchor     — in-page hash to scroll to on click.
//   effort     — 'self' | 'dev' | 'rebuild' (owner / hire a dev / full rebuild).
//   minutes    — rough time-to-fix for the effort chip.
//   impact     — why this matters, in plain English.
//   pass/fail/unverified  — top-line verdict per tier.
//   *Note      — expanded explanation beneath the verdict.
//   byType     — optional subtype overrides keyed by BUSINESS_TYPE_DEFS id.
//
// Phase D will rewrite the copy across all 10 subtypes; Phase H adds
// new entries for dietary/allergen, gift cards, catering, age-gate, etc.

var RESTAURANT_PRIORITY_CHECKS = [
  {
    type: 'audit',
    audit: 'viewport',
    weight: 2.0, // catastrophic if missing — site is unusable on phones
    anchor: '#mobile',
    effort: 'dev',       // 'self' | 'dev' | 'rebuild'
    minutes: 5,          // rough time-to-fix
    impact: 'Without a viewport tag, every phone visitor sees a broken desktop layout. Roughly 70% of restaurant traffic is mobile, which means a missing viewport is 70% of your traffic bouncing on contact.',
    pass: 'Your site fits on a phone screen',
    passNote: 'Your pages render at phone width automatically — the single most important mobile-readiness check, and you pass it.',
    fail: 'Your site is not set up for phones',
    failNote: 'Without a viewport meta tag, mobile browsers render your site at desktop width and then zoom out to fit. Everything looks tiny and the whole mobile experience breaks. This is a one-line fix for whoever maintains your site — ask them to add <code>&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code> to the &lt;head&gt;.',
    unverified: "We couldn't check if your site fits on a phone",
    unverifiedNote: "Lighthouse couldn't evaluate the viewport tag on this run. Re-audit in a few seconds and this usually resolves."
  },
  {
    type: 'audit',
    audit: 'tap-targets',
    weight: 1.0,
    anchor: '#mobile',
    effort: 'dev',
    minutes: 20,
    impact: "Every missed tap is a frustrated customer. On a restaurant site where the most-tapped button is usually Reserve or Order, small tap targets translate directly into lost bookings.",
    pass: 'Your buttons are big enough to tap',
    passNote: 'Your action buttons are big enough to hit on the first try with a thumb holding a phone in one hand.',
    fail: 'Some of your buttons are too small to tap reliably',
    failNote: 'Action buttons under 44×44 pixels cause fat-finger misses. On a restaurant site, a missed "Reserve" tap is a lost booking walking out the door. Bump button padding to 12px on every side, and give links at least 44px of vertical space around them.',
    unverified: "We couldn't check your buttons' tap-friendliness",
    unverifiedNote: "Lighthouse couldn't evaluate tap targets on this run. Re-audit in a few seconds and this usually resolves.",
    byType: {
      'fine-dining': {
        impact: 'On a fine-dining site the "Reserve" button carries almost the entire booking funnel — it\'s the one tap between "I\'m curious" and "I\'m on the books for Saturday." Small or crowded, and you lose the reservation.',
        failNote: 'Action buttons under 44×44 pixels cause fat-finger misses. The "Reserve" button is the one that matters — give it at least 48×48 px and plenty of breathing room so the Saturday-night impulse actually books.'
      },
      'fast-casual': {
        impact: 'Fast-casual traffic is almost all mobile and overwhelmingly intent-driven — someone is ordering lunch from their phone while walking to the office. "Order Online" is the most-tapped button on your site. If it\'s small, they give up and open DoorDash.',
        failNote: 'Buttons under 44×44 pixels cause misses. "Order Online" is the critical button — bump its padding to at least 12px on every side and keep it visually distinct from secondary links.'
      },
      'cafe': {
        impact: 'Most café traffic is hours-and-location intent: "is it open?" and "where is it?" The hours block and the map pin need to be tappable without zooming — a missed tap sends the customer to a competing shop around the corner.',
        failNote: 'Hours, phone number, and map links are the three tap-target priorities for a café. They don\'t need to be huge buttons — just give them enough padding (12px) that a thumb reliably hits them.'
      },
      'bar-pub': {
        impact: 'Bar traffic is often late-night and last-minute — "is happy hour still on?", "are they open?", "is there a cover?" A tappable phone and a tappable map are the two buttons that earn their space.',
        failNote: 'Buttons under 44×44 pixels cause misses. On a bar site the phone number and map links are what visitors actually tap — make sure those in particular have 12px+ padding and aren\'t crowded by other links.'
      }
    }
  },
  {
    type: 'audit',
    audit: 'color-contrast',
    weight: 1.0,
    anchor: '#trust',
    effort: 'dev',
    minutes: 15,
    impact: "Roughly 1 in 4 adults over 40 has some form of age-related vision difficulty. If your menu text fails contrast, you're leaving money on the table from the exact demographic that dines out most.",
    pass: 'Your menu text is readable for everyone',
    passNote: 'A 55-year-old standing in bright sunlight can read your menu descriptions. That is the actual bar for a mobile restaurant menu — and you meet it.',
    fail: 'Some of your text is hard to read',
    failNote: 'Light gray on cream or dark-on-dark is invisible to anyone over 40 or anyone standing outside in the sun. Most of your weekday lunch crowd is one of those people. Darken your body text or lift the background — aim for at least the WCAG AA contrast ratio (4.5:1 for normal text).',
    unverified: "We couldn't check your menu text contrast",
    unverifiedNote: "Lighthouse couldn't evaluate color contrast on this run. Re-audit in a few seconds and this usually resolves.",
    byType: {
      'fine-dining': {
        impact: 'Fine-dining menus live and die on careful description — a 55-year-old guest skimming the tasting-menu copy on their phone in a taxi needs every word to be legible. Thin serifs on cream backgrounds are a common culprit.',
        passNote: 'Your tasting-menu and wine-list copy meets contrast thresholds — readable without squinting, even for the demographic that actually fills your dining room.',
        failNote: 'Fine-dining menu aesthetics frequently use thin grey serifs on cream or dark-on-dark cards — elegant on-screen, unreadable on a phone. Darken body text to meet WCAG AA (4.5:1 ratio), especially menu descriptions and wine notes.'
      },
      'fast-casual': {
        impact: 'Fast-casual decisions happen in 20 seconds on a phone at lunchtime. Low-contrast item names or prices mean the visitor bounces to an ordering aggregator where the same menu is clearer.',
        passNote: 'Your item names and prices are readable at a glance — which is what a lunch-break ordering decision actually requires.',
        failNote: 'Menu item names and prices especially need high contrast. Thin grey text over beige backgrounds is the most common fast-casual contrast failure — darken the body text to meet WCAG AA (4.5:1 ratio).'
      },
      'cafe': {
        impact: 'Café customers read your hours, menu, and address more than anything else. Soft-palette café branding often puts those three items in light grey — elegant on a laptop, invisible on a phone in sunlight.',
        passNote: 'Hours, items, and address all meet contrast thresholds — readable at a glance, even in direct light.',
        failNote: 'Hours and address are the most-read text on a café site. Pale grey on cream looks on-brand but fails contrast — darken these two specifically to WCAG AA (4.5:1 ratio).'
      },
      'bar-pub': {
        impact: 'Bar sites are often dark-themed by default, and legibility takes a hit. Guests checking happy-hour times or the cocktail list on a phone at the curb outside shouldn\'t have to squint.',
        passNote: 'Your dark-theme copy still meets WCAG AA contrast ratios — happy-hour hours and the cocktail list are readable without zooming.',
        failNote: 'Dark-theme bar sites fail contrast most often on mid-grey text over black. Lift your body-text brightness (or shift to near-white) until it meets WCAG AA (4.5:1 ratio) — especially for hours, happy-hour times, and the cocktail list.'
      }
    }
  },
  {
    type: 'audit',
    audit: 'font-size',
    weight: 1.0,
    anchor: '#mobile',
    effort: 'dev',
    minutes: 10,
    impact: "Text below 16px forces iOS to zoom on focus and frustrates every mobile reader. Menu descriptions that look fine on a laptop are often unreadable on a phone at arm's length.",
    pass: 'Your text is legible without pinch-zooming',
    passNote: 'Your body text is above the mobile readability threshold — visitors do not have to pinch-zoom to read the menu.',
    fail: 'Your text is too small on a phone',
    failNote: 'More than 40% of your text is below the legibility threshold. Visitors give up before finding their entree. Set body font-size to at least 16px — for menu descriptions and anything a hungry customer actually has to read, 17 or 18 px is better.',
    unverified: "We couldn't check your text size",
    unverifiedNote: "Lighthouse couldn't evaluate font sizes on this run. Re-audit in a few seconds and this usually resolves.",
    byType: {
      'fine-dining': {
        impact: 'Tasting-menu descriptions, wine-list notes, and chef\'s-counter blurbs are the highest-value text on your site. Set too small, they force a pinch-zoom that breaks the whole luxe experience.',
        failNote: 'Set body font-size to at least 16px. For the tasting menu and wine list specifically, 17 or 18px is the floor — those blocks of descriptive copy are what convinces a guest to book.'
      },
      'fast-casual': {
        impact: 'Customers scan your menu on a phone mid-walk. Small item names and prices turn a 10-second decision into a 30-second squint — and they close the tab and reopen DoorDash.',
        failNote: 'Set body font-size to at least 16px. Item names and prices specifically should be 17 or 18px — the menu is your conversion page.'
      },
      'cafe': {
        impact: 'Hours and location are read more than anything else on a café site. Tiny type below 16px forces iOS to zoom on focus and makes "are they open?" a frustrating question.',
        failNote: 'Set body font-size to at least 16px. The hours block specifically should be 17 or 18px — it\'s the first thing most café visitors look for.'
      },
      'bar-pub': {
        impact: 'Cocktail lists, draft lists, and happy-hour details are the bar\'s menu. Small type on a phone in a dim Uber ride is a usability tax guests won\'t pay.',
        failNote: 'Set body font-size to at least 16px. The cocktail/draft list and happy-hour times deserve 17 or 18px — those are the conversion paragraphs for a bar site.'
      }
    }
  },
  {
    type: 'phone',
    weight: 1.5, // real conversion driver for takeout / walk-in
    anchor: '#basics',
    effort: 'self',
    minutes: 2,
    impact: "On mobile, every tap that requires copying and pasting instead of tapping costs you customers. Phone calls are still how most takeout orders and reservation questions reach independent restaurants.",
    pass: 'Visitors can tap your phone number to call',
    passNote: 'A tappable phone number is on your page — mobile visitors can call you with one tap, which matters for takeout orders, reservation questions, and "are you still open" calls.',
    passNoteText: 'We found a phone number in your page text, but it is not wrapped in a clickable <code>tel:</code> link. Mobile visitors have to copy the number into their dialer manually instead of tapping to call. Ask your developer to wrap the number in <code>&lt;a href="tel:+1..."&gt;</code>.',
    fail: "We couldn't find a phone number on your site",
    failNote: "No click-to-call link and no visible phone number in the page text. Every restaurant gets calls — about 'are you open now', about table availability, about special requests — and if your site doesn't make calling one tap, you are losing those conversations. Add a phone number to your site and wrap it in a <code>tel:</code> link.",
    unverified: "We couldn't confirm whether you have a phone number",
    unverifiedNote: "We only see the parts of your page that Lighthouse surfaces to us — sometimes phone numbers get missed. Check that yours is visible on every page and wrapped in a <code>tel:</code> link so mobile visitors can tap to call.",
    byType: {
      'fine-dining': {
        impact: 'Guests calling a fine-dining restaurant usually have a high-value question: a special-occasion menu, a large-party booking, a dietary accommodation. A missing phone number or a broken tel: link sends those calls — and reservations — to a competitor.',
        failNote: 'Special-occasion and large-party bookings almost always start with a phone call. Add a phone number and wrap it in a <code>tel:</code> link so the concierge-level conversation can actually happen.'
      },
      'fast-casual': {
        impact: 'Fast-casual traffic is mostly online ordering, but a phone number still closes the edge cases: "is there parking?", "do you cater?", "do you have gluten-free?" A tappable number keeps those from becoming a one-star review.',
        failNote: 'Even if online ordering drives most of your conversion, add a tappable phone number. Catering, dietary questions, and "is my order ready?" calls all need a one-tap path — and they convert at a much higher rate than form-fills.'
      },
      'cafe': {
        impact: 'Café and bakery customers call to check hours, to ask about custom cake orders, and to reserve whole pies or catering trays. A missing phone number is a missing revenue channel — custom-order margins especially.',
        failNote: 'Custom-order inquiries (birthday cakes, catering trays, wholesale) come in by phone. Add a tappable phone number — a <code>tel:</code> link at the top of every page is the bar for a café or bakery.'
      },
      'bar-pub': {
        impact: 'Bar calls are time-sensitive: "are you open?", "is happy hour still on?", "do I need a reservation tonight?" A missing tap-to-call number means those visitors go to a bar with an easier phone number.',
        failNote: 'Non-negotiable for bars. Guests check "is happy hour still running?" on the curb outside. Add a phone number and wrap it in a <code>tel:</code> link so the call is one tap, not a copy-paste flow.'
      }
    }
  },
  {
    type: 'platform',
    platforms: ['maps'],
    weight: 1.0,
    anchor: '#conversions',
    effort: 'dev',
    minutes: 15,
    impact: "The path from 'I might check this place out' to 'I am driving there' should be one tap. An embedded map or a Maps link cuts directions friction to zero — plain-text addresses add a whole copy-paste flow before the customer even arrives.",
    pass: 'Visitors can get directions with one tap',
    passNote: '{detected} is on your site — first-time visitors can tap once to get turn-by-turn directions to your door.',
    fail: null, // never fail this check — absence is always unverified
    failNote: null,
    unverified: "We didn't see a map on your site — is this right?",
    unverifiedNote: "We scan for Google Maps, Apple Maps, Mapbox, Bing Maps, OpenStreetMap, Waze, and Leaflet. If your site uses one of those, great — we just couldn't find it on this run. If your address is plain text only, consider wrapping it in a Google Maps link so visitors can launch directions in one tap.",
    byType: {
      'fine-dining': {
        impact: 'First-time guests heading to a fine-dining reservation want turn-by-turn directions, not a copy-paste address. A tappable map is part of the concierge experience — and it\'s expected.'
      },
      'fast-casual': {
        impact: 'Fast-casual traffic is often "food near me" intent — visitors are already on their phone deciding where to walk or drive. A one-tap map shaves 15 seconds off the decision and keeps them from comparison-shopping another block over.'
      },
      'cafe': {
        impact: 'Café and bakery traffic is overwhelmingly local and walk-in driven. A one-tap directions link (especially for the pickup address on a catering or custom order) removes the "wait, where is this place again?" moment.'
      },
      'bar-pub': {
        impact: 'Bar hopping happens on the phone. A tappable map — especially for a bar tucked down a side street or into a basement — can be the difference between a visitor finding you or ending up at whichever place Google Maps surfaces first.'
      }
    }
  },
  {
    type: 'conversions',
    // Either counts: takeout-only spots only need ordering;
    // fine-dining only needs reservations; many restaurants have both.
    platforms: ['ordering', 'reservations'],
    weight: 1.5, // the single biggest direct-conversion lever
    anchor: '#conversions',
    effort: 'dev',
    minutes: 60,
    impact: "This is the single biggest direct-conversion lever on a restaurant website. Every reservation taken on your own site (instead of OpenTable) keeps the full booking. Every order through your own Toast or Square checkout (instead of DoorDash) keeps the full margin.",
    pass: 'Visitors can order or book a table online',
    passNote: '{detected} on your site — direct online conversions keep commission-hungry marketplaces out of your margins.',
    passNoteText: "We found text that strongly suggests self-hosted ordering or reservations on your site (something like 'ORDER ONLINE' or 'RESERVE A TABLE'). We couldn't tie it to a specific platform we recognize, but the signal is there.",
    fail: null, // never fail — a restaurant might legitimately only take walk-ins
    failNote: null,
    unverified: "We couldn't detect online ordering or reservations — is this right?",
    unverifiedNote: "We scan for 100+ major ordering and reservation platforms, including Toast, Square, ChowNow, OpenTable, Resy, Tock, BentoBox, Popmenu, SevenRooms, TheFork, Deliveroo, and dozens more. If you use one of those and we missed it, tell us below and we will add it to the scanner. If you take orders or bookings over the phone only, that is a legitimate choice — just mark it so.",
    byType: {
      'fine-dining': {
        impact: 'Reservations are the entire business model for fine dining. Every booking taken on your site (via Resy, Tock, SevenRooms, or an embedded widget) keeps the relationship — and the deposit, for prix-fixe reservations — instead of sending it through OpenTable.',
        pass: 'Guests can reserve a table online',
        passNote: '{detected} on your site — guests can book directly, and you keep the relationship (and any deposit) instead of paying per-cover fees to a marketplace.',
        passNoteText: "We found text that suggests self-hosted reservations ('RESERVE A TABLE', 'Book Your Seat') but couldn't match it to a specific platform.",
        unverified: "We couldn't detect online reservations — is this right?",
        unverifiedNote: "We scan for reservation platforms including Resy, Tock, SevenRooms, OpenTable, Yelp Reservations, TheFork, and more. Fine-dining restaurants that don\'t take online reservations are leaving money on the table — every phone-only booking is a guest who might not bother."
      },
      'casual-dining': {
        impact: 'Casual dining lives in both worlds — reservations for dinner rushes, online ordering for takeout and delivery. Missing either one sends revenue to OpenTable, DoorDash, or a competitor that has both.',
        pass: 'Guests can reserve or order online',
        passNote: '{detected} on your site — guests can book a table or place a takeout order directly, which is the pattern that wins for casual-dining restaurants.'
      },
      'fast-casual': {
        impact: 'Online ordering IS the business model for fast-casual. Every order through your own Toast or ChowNow checkout keeps the 30% DoorDash commission in your pocket. A site without direct ordering is a site that hands margin to marketplaces every day.',
        pass: 'Customers can order online',
        passNote: '{detected} on your site — direct orders keep the full margin, and you own the customer data.',
        passNoteText: "We found text that suggests self-hosted ordering ('ORDER ONLINE', 'Order for Pickup') but couldn't match it to a specific platform.",
        unverified: "We couldn't detect online ordering — is this right?",
        unverifiedNote: "We scan for ordering platforms including Toast, Square, ChowNow, BentoBox, Olo, Lunchbox, Slice, Menufy, and dozens more. Fast-casual restaurants without direct online ordering are sending 20–30% of every order to DoorDash/Grubhub as commission."
      },
      'cafe': {
        impact: 'Direct online ordering matters even for small cafés — pre-orders for commuters, whole-cake orders for birthdays, catering trays for offices. Square and Toast make this table stakes; a site without ordering sends those conversions through Grubhub.',
        pass: 'Customers can order online',
        passNote: '{detected} on your site — commuter pre-orders, custom-cake inquiries, and catering tray orders all flow to you directly instead of a commissioned aggregator.',
        unverifiedNote: "We scan for café-friendly platforms like Square, Toast, ChowNow, and more. Even a simple online-order page for pre-orders, custom cakes, or catering is a meaningful revenue channel for cafés and bakeries."
      },
      'bar-pub': {
        impact: 'Bars and pubs vary — some take reservations, most take walk-ins. But even walk-in bars benefit from event bookings (private parties, tastings, brunches) and gift-card purchases. Tripleseat and similar platforms are common; a direct booking flow converts better than an email inquiry.',
        pass: 'Guests can book events or reservations online',
        passNote: '{detected} on your site — event bookings and reservations can be handled without a back-and-forth email thread, which is where most bar-inquiry revenue falls through.',
        unverifiedNote: "We scan for reservation and event-booking platforms including OpenTable, Resy, Tripleseat, and more. Not every bar needs online booking (walk-ins are legitimate) — but event and private-party inquiries almost always benefit from a direct booking flow."
      }
    }
  },
  {
    type: 'menu-format',
    weight: 1.0,
    anchor: '#basics',
    effort: 'rebuild',
    minutes: 240,
    impact: "PDF menus are the most common mobile-UX sin on restaurant sites. They don't zoom gracefully, they don't link to online ordering, and they make every menu update (new special, changed price) dependent on a developer with InDesign. Replacing a PDF menu with a real HTML menu page typically lifts mobile dwell time by 30-50%.",
    pass: 'Your menu opens as a real HTML page',
    passNote: 'Visitors can read your menu on a phone without downloading a PDF or pinching to zoom. This is table stakes for mobile restaurant UX.',
    fail: 'Your menu is a PDF or an image',
    failNote: 'PDF menus are the single most common restaurant mobile UX sin. They do not zoom gracefully on phones, they do not link to online ordering, and they make the "update a price" workflow depend on a developer. Replace it with a real HTML menu page.',
    unverified: "We couldn't find a menu link — is this right?",
    unverifiedNote: "We looked for a link containing 'menu' in its path and didn't find one. If your menu is reachable but named something else (like 'food', 'dining', 'kitchen'), the scanner missed it — tell us below and we'll improve it.",
    byType: {
      'fine-dining': {
        impact: 'Fine-dining menus are part of the marketing pitch — prospective guests decide whether to book based on how the tasting menu reads. A PDF (especially one styled for print) flattens on mobile and breaks that pitch completely.',
        pass: 'Your tasting menu opens as a real HTML page',
        passNote: 'Your tasting menu and wine list render as HTML — guests can browse on a phone while deciding whether to book, without downloading a file.',
        fail: 'Your tasting menu is a PDF or an image',
        failNote: 'PDF tasting menus look designed, but they break the Saturday-afternoon "should I book this place?" decision flow on mobile. Rebuild as an HTML page so the copy is indexable by Google, legible on phones, and updatable without a designer.'
      },
      'fast-casual': {
        impact: 'Fast-casual menus ARE the conversion page — prices, item names, and a one-tap "Order" button all need to live on the same scrollable page. A PDF kills the ordering flow and sends the customer to an aggregator.',
        pass: 'Your menu opens as a real HTML page',
        passNote: 'Your menu renders as HTML alongside your order button — which is the pattern that actually converts for fast-casual traffic.',
        fail: 'Your menu is a PDF or an image',
        failNote: 'PDF menus on a fast-casual site are a conversion killer. Your menu, prices, and "Order Online" button need to live on one scrollable HTML page — that\'s the ChowNow/Toast/Square pattern and it outperforms PDFs by wide margins.'
      },
      'cafe': {
        impact: 'Café menus change often — daily specials, seasonal drinks, weekly bakes. A PDF menu means every tweak is a developer ticket; an HTML page means the barista can update prices between the morning and afternoon rush.',
        pass: 'Your menu opens as a real HTML page',
        passNote: 'Your menu is an HTML page — which means you can update seasonal drinks, daily specials, and prices without emailing a designer.',
        fail: 'Your menu is a PDF or an image',
        failNote: 'Café menus change weekly (or daily); PDFs lock you into a once-a-month update cadence. Rebuild as HTML so seasonal items, specials, and price changes can ship the same afternoon they\'re decided.'
      },
      'bar-pub': {
        impact: 'Cocktail lists and draft lists rotate constantly — a PDF list goes stale within weeks, and nobody wants to read a PDF on a phone at the bar anyway. HTML lists are faster to update, easier to share, and readable without a download.',
        pass: 'Your drink list opens as a real HTML page',
        passNote: 'Your cocktail and draft lists render as HTML — which means visitors can scan them on a phone outside, and staff can rotate the list without a design sprint.',
        fail: 'Your drink list is a PDF or an image',
        failNote: 'PDF cocktail lists age poorly — by the time the designer ships the update, the beer\'s out of the keg. Rebuild as an HTML list (bar → pub → taproom style) so rotations happen the same day the barback swaps the tap.'
      }
    }
  },
  {
    type: 'schema',
    weight: 0.5, // bonus — nice to have, not critical
    anchor: '#findability',
    effort: 'dev',
    minutes: 20,
    impact: "Restaurant schema markup is how Google learns your hours, cuisine, and price range for local search. Restaurants with proper schema show up in the 'restaurants near me' rich results with photos and ratings — restaurants without it get a plain blue link. The difference in click-through rate is meaningful.",
    pass: 'Google knows your site is a restaurant',
    passNote: 'Your site publishes Restaurant schema markup (structured data that tells Google exactly what kind of business you are). This helps you show up in Google\'s "restaurants near me" Rich Results with hours, price range, and menu snippets.',
    fail: null,
    failNote: null,
    unverified: "Google doesn't know your site is a restaurant",
    unverifiedNote: "Your site is missing the Restaurant schema markup Google uses to show rich listings in Maps and Search. Ask your developer to add a JSON-LD block with <code>@type: \"Restaurant\"</code>, your address, opening hours, and cuisine — it's a 10-line change and meaningful for local SEO."
  }
];

// ---------------------------------------------------------------------------
// Restaurant readiness scoring
// ---------------------------------------------------------------------------
// The inline check renderer walks RESTAURANT_PRIORITY_CHECKS and assigns
// each check one of three statuses: 'pass', 'fail', 'unverified'. The
// readiness score is a weighted-pass rollup that HONESTLY excludes
// unverified checks from both the numerator and denominator — that way
// a site we can't fully scan isn't punished for gaps we can't confirm.
//
//   weight   (per check) — defaults to 1.0; see RESTAURANT_PRIORITY_CHECKS.
//   'pass'   — adds full credit, counted in denominator.
//   'fail'   — adds zero credit, counted in denominator.
//   'unverified' — ignored entirely.
//
// Phase B-H will extend the scoring to honor subtype-weight overrides
// via subtypeWeights(id, checkId); for now these helpers preserve the
// exact math the inline renderer currently runs in two places.

function createRestaurantReadinessState() {
  return {
    totalCount: 0,
    passCount: 0,
    unverifiedCount: 0,
    totalWeight: 0,
    weightedCredit: 0
  };
}

function accumulateRestaurantReadiness(state, def, status, subtypeId) {
  // Resolve the effective weight:
  //   1. If a subtypeId is provided AND subtypeWeights() returns a
  //      number for this (subtype, checkId) pair, that override wins.
  //      Returning 0 is meaningful — "irrelevant for this subtype" —
  //      and must not fall through to the default.
  //   2. Else use def.weight if it's a number.
  //   3. Else default to 1.0.
  // checkId is the id we look up in the subtype's weights map. The
  // priority-check shape uses def.audit for Lighthouse-backed checks
  // and def.type for the rest (phone, platform, conversions, menu-
  // format, schema, and the Phase H additions).
  var w;
  if (subtypeId && typeof subtypeWeights === 'function') {
    var checkId = def.audit || def.type;
    var override = subtypeWeights(subtypeId, checkId);
    if (typeof override === 'number') {
      w = override;
    }
  }
  if (typeof w !== 'number') {
    w = (typeof def.weight === 'number') ? def.weight : 1.0;
  }

  state.totalCount++;
  if (status === 'pass') {
    state.passCount++;
    state.totalWeight += w;
    state.weightedCredit += w; // credit = 1.0 on pass
  } else if (status === 'fail') {
    state.totalWeight += w;    // credit = 0 on fail
  } else {
    state.unverifiedCount++;   // excluded from the rollup
  }
}

function finalizeRestaurantReadinessScore(state) {
  return state.totalWeight > 0
    ? Math.round((state.weightedCredit / state.totalWeight) * 100)
    : 0;
}
