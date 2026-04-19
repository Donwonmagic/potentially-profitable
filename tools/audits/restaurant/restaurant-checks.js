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
      'bakery': {
        impact: 'Bakery traffic skews heavily toward custom-cake inquiries and morning pickup pre-orders — "Order Ahead" and "Request a Custom Cake" are the two buttons that carry $500-2000 wedding orders and $30 croissant pre-orders. A missed tap is a real lost order.',
        failNote: 'Bump the "Order Ahead" and "Custom Cake Inquiry" buttons to 48×48 with 12px+ padding — these are the two that carry almost all of your online revenue. Other links can be smaller.'
      },
      'pizzeria': {
        impact: 'On a pizzeria site "Order Delivery" and "Start a Pickup Order" are the conversion. Almost all mobile traffic is hungry-right-now intent, and a missed tap routes that order to Slice or DoorDash (where you pay 20-30% commission) within seconds.',
        failNote: '"Order Delivery" / "Pickup Order" need 48×48 tap targets and padding to separate them from secondary navigation. Every missed tap at 7pm on a Friday goes to an aggregator — you literally pay commission per miss.'
      },
      'food-truck': {
        impact: 'Food-truck traffic is all mobile and all intent-driven — "where are you today?" "what\'s on the menu right now?" The "See Today\'s Schedule" and Instagram-link buttons carry the entire discovery funnel. A missed tap sends hungry customers to whatever else Google Maps surfaces nearby.',
        failNote: 'The "Today\'s Location" and "See Our Schedule" buttons need 48×48 tap targets and healthy padding. Your Instagram-handle chip belongs in the same priority tier — it\'s where most of your actual schedule updates land.'
      },
      'ghost-kitchen': {
        impact: 'Ghost-kitchen sites are discovery pages — customers came to confirm you\'re real before placing an order on DoorDash or Uber Eats. The "Order on DoorDash / Uber Eats / Grubhub" aggregator buttons are the primary conversion. Misses turn into orders for a competing kitchen on the same platform.',
        failNote: 'Size the aggregator "Order On …" buttons first — they carry almost all your orders. 48×48 with padding, and stack them clearly so a customer on a hungry phone at 9pm can tap the one they prefer without a miss.'
      },
      'catering-only': {
        impact: 'Catering-only sites convert through two buttons: "Request a Quote" (or "Book Your Event") and a tappable phone. Everything else on the site supports those two. A missed tap on the quote form — especially on a phone from a corporate event planner with 15 caterers in tabs — is a direct loss of a $2,000-$15,000 booking.',
        failNote: '"Request a Quote" and the tappable phone are the two highest-value buttons on the site. Both need 48×48 targets and enough padding to thumb-tap cleanly. Everything else (gallery, testimonials, package links) can be smaller.'
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
      'bakery': {
        impact: 'Bakery menus carry ingredient lists, allergen notes, and custom-order details that customers read CAREFULLY — a guest ordering a wedding cake has to trust every label. Low-contrast allergen copy breaks that trust.',
        passNote: 'Your ingredient and allergen copy meets contrast thresholds — readable on a phone by the guest double-checking a custom-cake spec at 11pm the night before.',
        failNote: 'Ingredient and allergen notes are the highest-stakes copy on a bakery site. Pale grey descriptions over cream fail WCAG AA (4.5:1) and spook nervous custom-cake or dietary-restricted customers. This is a trust issue, not just usability.'
      },
      'pizzeria': {
        impact: 'Pizza sites lean on price grids and toppings lists — both of which fail contrast more than you would expect because the branding is often red-on-red or cream-on-cream. A customer can\'t confidently customize a pie if they can\'t read the pepperoni price or the crust options.',
        passNote: 'Topping prices, crust options, and combo pricing all meet contrast thresholds — customers can customize a pie on a phone without squinting.',
        failNote: 'Price grids and topping lists are the conversion surface for a pizzeria. Low-contrast cream-on-cream or red-on-red pricing fails WCAG AA (4.5:1) — darken prices and topping labels until they read cleanly on a phone outside.'
      },
      'food-truck': {
        impact: 'Food-truck sites are read OUTSIDE, in bright sun, on phones held at arm\'s length. Low-contrast copy fails instantly in that environment — and schedule + menu are the two things customers are squinting at while deciding whether to walk over.',
        passNote: 'Your schedule and menu copy meets contrast thresholds — readable at a farmers\' market in bright sun without cupping the screen.',
        failNote: 'Outdoor readability is the bar for a food-truck site. Pale brand colors that look great on Instagram fail WCAG AA (4.5:1) in direct sun — darken your schedule + menu text until they read cleanly at arm\'s length in daylight.'
      },
      'ghost-kitchen': {
        impact: 'Ghost-kitchen branding leans heavy on moody photography and low-contrast type — which photographs beautifully and converts terribly. Customers scanning delivery-hours and menu-brand details on a phone at 9pm need copy that reads without effort.',
        passNote: 'Hours, brand names, and menu descriptions all meet contrast thresholds — a hungry customer can confirm "yes this is a real restaurant" without squinting.',
        failNote: 'Ghost-kitchen moody-photography branding often fails WCAG AA (4.5:1) — pale type over dark hero images is the most common offender. Darken body text and especially the hours/brand names; these are the copy customers actually read before tapping through to a delivery app.'
      },
      'catering-only': {
        impact: 'Catering sites carry package descriptions, price-per-head tables, dietary-accommodation notes, and lead-time policies — all of which an event planner reads CAREFULLY before requesting a quote. Low-contrast pricing copy breaks trust precisely when a professional buyer is comparing three caterers side by side.',
        passNote: 'Package prices, head-count math, and dietary-accommodation copy all meet contrast thresholds — readable at-a-glance on the phone of a planner juggling several vendors.',
        failNote: 'Event planners comparing caterers don\'t squint — they bounce. Pale grey on cream for package descriptions and price tables fails WCAG AA (4.5:1). Darken body text, especially anywhere you list per-head pricing or minimum-headcount rules.'
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
      'bakery': {
        impact: 'Ingredient lists, custom-order spec fields, and pickup-date copy are the three things a bakery customer reads MOST carefully. Tiny type forces a pinch-zoom on exactly the moments that require precision.',
        failNote: 'Set body to 16px, and set ingredient lists plus custom-order copy to 17-18px. Customers placing $200+ orders for a specific date want zero ambiguity about what they\'re ordering.'
      },
      'pizzeria': {
        impact: 'Topping lists, allergen notes (gluten / dairy / dairy-free cheese), and delivery-zone details are the make-or-break copy for a pizzeria. Tiny type forces a pinch-zoom on the exact moments a customer is deciding between ordering from you or opening Slice.',
        failNote: 'Set body to 16px, and set topping lists and delivery-zone copy to 17-18px. The customer picking between "one large pepperoni" and "half-pepperoni half-mushroom" should never have to zoom.'
      },
      'food-truck': {
        impact: 'Schedule times and today\'s-location copy are the two pieces of content a food-truck customer reads MOST — usually on a phone, outdoors, while walking. Tiny type makes "are they at the brewery tonight?" a harder question than it needs to be.',
        failNote: 'Set body to 16px, and set schedule times and today\'s-location copy to 17-18px. Both belong in a block large enough to read at a glance while walking.'
      },
      'ghost-kitchen': {
        impact: 'Delivery hours, service area, and menu descriptions are the text customers actually read — and for ghost kitchens that text lives in competition with a lot of visual branding. Sub-16px type forces pinch-zooms on the exact decisions ("are they delivering now? to my zip?") that cost you the order.',
        failNote: 'Set body to 16px, and put delivery-hours + service-area copy at 17-18px. These are the two paragraphs that decide whether the customer taps over to DoorDash at all.'
      },
      'catering-only': {
        impact: 'Package descriptions, per-head pricing tables, dietary-accommodation notes, and lead-time rules are the decision-critical text on a catering site. Tiny type on a phone forces the planner — who is already rushed — to pinch-zoom through your rate card, which is a terrible first impression for a $5,000 booking.',
        failNote: 'Set body to 16px, and set package descriptions + pricing tables to 17-18px. Corporate planners often read on a phone between meetings — make the rate card scannable without zoom.'
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
      'bakery': {
        impact: 'Wedding-cake consultations, dietary-restricted special orders, and catering-tray inquiries almost always start with a phone call — these are the margin-rich orders that rarely convert through a web form. A missing tappable phone on a bakery site is a missing revenue channel, full stop.',
        failNote: 'Custom-cake and catering inquiries come in by phone. Add a tappable phone number at the top of every page — a <code>tel:</code> link beside your "Order Ahead" button is the baseline for any bakery that takes custom work.'
      },
      'pizzeria': {
        impact: 'Phone orders still account for roughly 40% of US pizzeria revenue — and every one of those orders that a customer has to manually dial is a customer who might give up and open Slice. Delivery ETA questions ("how long?") and last-minute customizations ("can you add jalapeños?") are one-tap conversations.',
        failNote: 'Phone ordering is table stakes for pizzerias. Add a tappable phone at the top of every page, and keep it visible next to the "Order Online" button — the two channels complement each other, and ~40% of your revenue still comes in by phone.'
      },
      'food-truck': {
        impact: 'Food-truck operators usually cannot answer phones during service — the person who answers is the person cooking. A tappable phone still matters for catering and private-event inquiries, which are the margin-rich bookings that keep trucks profitable between rushes.',
        failNote: 'You probably can\'t answer a phone mid-service, and that\'s fine. Still add a tappable phone for catering and private-event leads; those calls are not lunch-rush traffic — they\'re $500-$3000 bookings you want to return after service.'
      },
      'ghost-kitchen': {
        impact: 'Most ghost kitchens run lean and do not staff a phone — customer-service routes to aggregator support instead. That\'s fine as an operational choice, but customers still try. A tappable phone avoids the "they\'re not a real business" signal when a skeptical customer is deciding whether to order.',
        failNote: 'Even if you don\'t actively answer, add a tappable phone or at least a quick-response SMS number. Missing it reads as "no real operator behind this brand" to a skeptical customer — a much bigger conversion hit than whatever time you save by hiding the number.'
      },
      'catering-only': {
        impact: 'Phone is the single highest-converting channel for catering. Event planners juggle tight timelines, last-minute head-count changes, and dietary exceptions — all of which are phone conversations, not contact-form conversations. A missing tappable phone on a catering site is a missing business, effectively.',
        failNote: 'Non-negotiable for catering. A tappable phone at the top of every page — ideally beside "Request a Quote" — is the baseline. Planners booking \$2K+ events will almost always call before submitting a form; giving them a one-tap number closes bookings the form alone would not.'
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
      'bakery': {
        impact: 'Morning bakery traffic is time-critical — a commuter grabbing croissants at 7:30am does not have time to fumble with a typed address. A one-tap directions link keeps the pickup rush on schedule, and matters double for wholesale or catering customers driving to a pickup address they have never visited.'
      },
      'pizzeria': {
        impact: 'For pizzerias the primary use of a map is communicating DELIVERY ZONE, not just the storefront address. A one-tap Google Maps pin is the bare minimum; a proper delivery-radius overlay (or at least a list of served neighborhoods) saves you from the "do you deliver to me?" phone calls that your phone staff are answering instead of taking orders.'
      },
      'food-truck': {
        impact: 'Food trucks MOVE, which inverts the usual map-check logic: a static storefront pin is the wrong answer. What customers need is a one-tap map OF TODAY\'S LOCATION (usually a dynamic field on a schedule page), plus a link to your Instagram or Twitter where you post real-time changes. A stale "home address" map is worse than no map at all.'
      },
      'ghost-kitchen': {
        impact: 'Customers never visit a ghost kitchen — what they care about is the DELIVERY ZONE (ZIP codes or neighborhoods you serve). A standard Google Maps pin helps with nothing; what you need is a clear "we deliver to …" list or a delivery-radius visualization. Aggregator pages already handle address validation, but seeing the zone up front saves the bounce for out-of-range visitors.'
      },
      'catering-only': {
        impact: 'Maps on a catering site are about SERVICE AREA, not storefront. A clear service-radius map (or a written list of cities/counties served) lets an event planner self-qualify before investing in a quote request. It also handles the "do you travel to us?" question that otherwise eats the first 30 seconds of every intake call.'
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
      'bakery': {
        impact: 'Online pre-orders ARE the business model for modern bakeries — customers who cannot pre-order online end up ordering through Instagram DMs or giving up. Custom-cake inquiry forms, wedding-cake intake, and whole-pie pre-orders all belong on your site directly, where the margin stays with you.',
        pass: 'Customers can pre-order online',
        passNote: '{detected} on your site — pre-orders, custom-cake inquiries, and whole-pie bookings all flow to you directly instead of becoming DMs your staff has to answer by hand.',
        unverifiedNote: "We scan for bakery-friendly platforms (Square, Toast) plus generic order-ahead widgets. Even a simple HTML pre-order page for custom cakes or catering is a real revenue channel for bakeries and pâtisseries."
      },
      'pizzeria': {
        impact: 'Online ordering IS the business model for a pizzeria. Every order that flows through Slice, DoorDash, or Grubhub costs you 20-30% commission — on a $25 pie that is $5-7 of margin walking out the door. A direct Toast or ChowNow flow (or even a Slice "direct" storefront) can cut that commission in half, and owning the customer data is worth even more than the commission saved.',
        pass: 'Customers can order delivery / pickup online',
        passNote: '{detected} on your site — every direct order keeps 20-30% more margin than a Slice or DoorDash order AND builds a repeat-customer list you own.',
        passNoteText: "We found 'Order Online' / 'Order Delivery' / 'Start a Pickup Order' copy but could not pin it to a specific platform.",
        unverifiedNote: "We scan for pizzeria-heavy platforms including Slice, Toast, ChowNow, Square, Olo, Menufy, and the major aggregators (DoorDash, Grubhub, Uber Eats). If you only take phone orders today, every online order you add is commission-free margin."
      },
      'food-truck': {
        impact: 'Day-of ordering from a food-truck site is less common — most trucks take cash or Venmo at the window. Where online ordering DOES matter is pre-orders for group meetups, catering/private-event inquiries, and merchandise (t-shirts, hot sauces, bean subscriptions). Missing a pre-order or inquiry form sends those leads to Instagram DMs where they get buried.',
        pass: 'Customers can pre-order or inquire online',
        passNote: '{detected} on your site — group pre-orders and catering inquiries land in a form instead of a DM thread your staff has to untangle.',
        unverifiedNote: "We scan for food-truck-friendly platforms (Square, Toast) and generic inquiry forms. Day-of ordering is usually not the goal — the high-value flow is a catering/private-event inquiry form, where every submission is a \$500-\$3000 opportunity."
      },
      'ghost-kitchen': {
        impact: 'Ghost kitchens live or die on aggregator presence — DoorDash, Uber Eats, Grubhub, Caviar, Postmates. Clear links to EVERY aggregator you\'re on are the primary conversion; a direct-order flow on your own site is a nice-to-have (and keeps more margin when it converts), but the aggregator links are what customers actually use.',
        pass: 'Customers can order via aggregators / direct',
        passNote: '{detected} on your site — at minimum the aggregator you partner with is one tap from the homepage. A customer scanning your menu lands in an active order funnel, not a dead-end.',
        unverifiedNote: "We scan for every major aggregator (DoorDash, Uber Eats, Grubhub, Postmates, Caviar, Deliveroo, Just Eat, Wolt, etc.) and middleware (Deliverect, Otter). Missing links to your actual aggregators is a conversion cliff — customers assume you\'re not available on their platform."
      },
      'catering-only': {
        impact: 'The "conversion" on a catering site is a quote request, not an online order. ezCater, CaterTrax, and Tripleseat all offer structured intake; a custom RFQ form works too, provided it captures head count, event date, dietary restrictions, delivery address, and a phone number. A site without any structured intake is routing bookings through generic email — which wins you nothing and loses you many.',
        pass: 'Planners can request a quote online',
        passNote: '{detected} on your site — event planners can start a quote request with their head count, date, and dietary notes in one place, instead of writing a cold email.',
        unverifiedNote: "We scan for catering-focused platforms (ezCater, CaterTrax, Tripleseat) and generic RFQ/quote forms. A structured intake form is worth several emails of back-and-forth per booking — it\'s the single most impactful addition to a catering-only site without a booking flow."
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
      'bakery': {
        impact: 'Bakery offerings rotate aggressively — seasonal tarts, weekend-only loaves, holiday cookie lineups. A PDF menu means the baker needs a designer to update the Christmas-cookie list; an HTML page means it ships the same morning, and can link to an "Order this" button per item.',
        pass: 'Your bakery menu opens as a real HTML page',
        passNote: 'Your daily, seasonal, and custom-order menus render as HTML — which means the holiday lineup ships the morning you decide it, and each item can link to its own pre-order.',
        fail: 'Your menu is a PDF or an image',
        failNote: 'Bakery menus rotate weekly (or daily); PDFs lock you into a monthly update cadence and cannot link to a per-item "Pre-order this" button. Rebuild as HTML so seasonal and custom items ship the same day they\'re decided.'
      },
      'pizzeria': {
        impact: 'Pizzeria menus are the conversion page — a PDF menu cannot link each pie to an "Add to Cart" button, which is precisely the flow that makes Slice work and kills most independent pizzerias\' direct-ordering conversion. Every PDF-menu pizzeria is effectively handing its best customers to an aggregator.',
        pass: 'Your menu opens as a real HTML page',
        passNote: 'Your menu renders as HTML — each pie can link to its own "Order This" button, and price updates ship without a designer.',
        fail: 'Your menu is a PDF or an image',
        failNote: 'PDF menus break the pizzeria ordering flow completely — they can\'t link to per-pie order buttons or pass a pre-selected pie to your online checkout. Rebuild as an HTML page with one-tap "Order This" links per item; that\'s the pattern Slice uses and it\'s why Slice is taking your orders.'
      },
      'food-truck': {
        impact: 'Food-truck menus rotate constantly — today it\'s barbacoa tacos, tomorrow it\'s carnitas, next week the owner is testing a smashburger. PDFs lock you into whatever was true the last time a designer had time. HTML means the menu matches what\'s actually on the truck, updated from your phone while you prep.',
        pass: 'Your menu opens as a real HTML page',
        passNote: 'Your menu is an HTML page — you can update today\'s specials from your phone between prep and service.',
        fail: 'Your menu is a PDF or an image',
        failNote: 'Food-truck menus change faster than any other restaurant type. A PDF menu is often DAYS stale by the time someone reads it. Rebuild as HTML so the menu on your site matches the menu on the truck — ideally updated the morning of each service from your phone.'
      },
      'ghost-kitchen': {
        impact: 'For a ghost kitchen the menu on your site has one job: matching the menu on every aggregator you\'re listed on. PDF menus go stale the instant a single item gets pulled or repriced, and the resulting drift erodes customer trust across every platform at once. An HTML menu can be pulled from the same source of truth your POS/middleware already feeds the aggregators.',
        pass: 'Your menu opens as a real HTML page',
        passNote: 'Your menu renders as HTML — easier to keep aligned with what\'s live on DoorDash / Uber Eats / Grubhub, especially when a price or item changes mid-week.',
        fail: 'Your menu is a PDF or an image',
        failNote: 'Ghost-kitchen menus drift fast across platforms. PDF menus on your site lock you into a stale snapshot; HTML menus can be kept in sync (manually or via Deliverect / Otter / your POS) with whatever is live on your aggregators.'
      },
      'catering-only': {
        impact: 'Catering menus are the sales collateral — package breakdowns, per-head pricing, dietary accommodations, minimum orders, lead times. Unlike dine-in menus where a PDF is merely inconvenient, a catering PDF actually WORKS for one use case: emailing a rate sheet to a planner. The problem is that your site visitor and your planner-email flow have different needs — the planner wants a print-ready PDF; the site visitor wants a scannable HTML page. Offer both.',
        pass: 'Your catering menu opens as a real HTML page',
        passNote: 'Your packages and pricing render as HTML — event planners can scan them on a phone between meetings without downloading a file.',
        fail: 'Your menu is a PDF or an image',
        failNote: 'On a catering site a PDF menu is better than nothing, but it\'s still a drop-off point for mobile visitors. Ship an HTML package page for browse/discovery, and keep the PDF rate sheet as a download-to-share option for planners who need to forward it to clients — both audiences get what they need.'
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
    pass: 'Google can read your site as a restaurant',
    passNote: 'Your site publishes Restaurant schema markup — the JSON-LD block Google reads to understand your cuisine, hours, price range, and menu URL. This is what earns you rich-result placement in "restaurants near me" searches.',
    // Phase L6: when the audit CONFIDENTLY detected the subtype
    // from platforms/keywords but the site still has no schema,
    // the evaluator promotes this check from 'unverified' to 'fail'
    // and the title/note swap to the explicit 'we know what you are,
    // Google can't read it directly from your page yet' framing.
    fail: 'Your site is missing Restaurant schema markup',
    failNote: "We detected your segment from platform and keyword signals, but your site isn't publishing the JSON-LD <code>@type: \"Restaurant\"</code> block Google reads for rich-result placement. Without it Google has to infer your category rather than reading it directly — which is the difference between a rich snippet (hours, price, cuisine) and a plain blue link. It's a 10-line change for your developer.",
    unverified: "We couldn't confirm your Restaurant schema",
    unverifiedNote: "We couldn't confidently read whether your site publishes Restaurant JSON-LD. If you think it's there, re-audit in a minute — sometimes Lighthouse misses it. If it isn't, adding a JSON-LD block with <code>@type: \"Restaurant\"</code>, your address, opening hours, and cuisine is meaningful for local SEO."
  },
  {
    // Phase H1: Dietary / allergen signal presence. Evaluated by
    // evaluatePriorityCheck's 'dietary' branch, which calls
    // detectDietaryMarkers(pageText) and returns pass/unverified.
    // Never fail — a steakhouse that doesn't mark vegan items
    // shouldn't lose score; it's a bonus check.
    type: 'dietary',
    weight: 0.75,
    anchor: '#trust',
    effort: 'self',
    minutes: 30,
    impact: 'Dietary-aware guests make decisions based on whether they see themselves considered. A single "GF" mark or a "vegan" badge reliably converts more dietary-restricted customers than ten paragraphs of "we can accommodate." Even one marker signals that someone on staff has thought about cross-contamination.',
    pass: 'Your site signals dietary options',
    passNote: '{detected} visible on your site — guests with dietary restrictions can self-qualify without having to call and ask.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t spot dietary markers — is this right?',
    unverifiedNote: 'We scan for vegan, vegetarian, gluten-free, dairy-free, nut-free, halal, kosher, and allergen notes. If your menu marks dietary options with symbols or callouts we didn\'t recognize (or if the markers live on a menu page we didn\'t reach), let us know and we\'ll improve the detector.',
    byType: {
      'fine-dining': {
        impact: 'Fine-dining tasting menus live or die on accommodating dietary restrictions — half the phone calls your host fields are "do you have gluten-free or vegetarian options?" Surfacing answers on the menu page deflects those calls and lets guests book with confidence.',
        unverifiedNote: 'Tasting-menu dietary accommodations belong on your menu or reservations page in plain English. "Vegetarian tasting available on request" earns bookings; silence sends them to a restaurant that says so.'
      },
      'casual-dining': {
        impact: 'Casual-dining guests often decide between two restaurants based on whether one of them clearly marks vegetarian or gluten-free options. The market of dietary-aware eaters is bigger than most owners realize — about 1 in 3 diners avoids at least one food group.',
        unverifiedNote: 'Mark a few items with V / GF / DF symbols on the menu page (with a small legend). This is the single highest-ROI content change a casual-dining site can make.'
      },
      'bakery': {
        impact: 'For bakeries dietary markers are not marketing — they are safety. A customer ordering a custom cake for a nut-allergic child trusts whether you\'ve thought about cross-contamination, and your site is where they decide whether to trust you with a birthday.',
        unverifiedNote: 'Call out cross-contamination policy and clearly mark nut-free / gluten-free / dairy-free bakes on the menu page. For custom-order intake, add a dietary-restriction field to the form. This is a trust-earning change, not a marketing one.'
      },
      'ghost-kitchen': {
        impact: 'Ghost-kitchen customers rarely inspect the site before ordering — but the ones who DO are usually dietary-restricted and comparing brands before committing. Clear dietary markers on your brand page move those orders into your funnel instead of a competing aggregator listing.'
      }
    }
  },
  {
    // Phase H2: Gift-card presence. Evaluator branch uses
    // detectGiftCardPresence(pageText, allUrls). Never fail —
    // absence is a missed revenue lever, not a broken site.
    type: 'gift-cards',
    weight: 0.5,
    anchor: '#conversions',
    effort: 'dev',
    minutes: 30,
    impact: 'Gift cards are the highest-margin line on a restaurant site. Every \$50 gift card sold brings in \$50 of revenue AND a future customer; roughly 20-30% of gift cards go unredeemed, which is pure revenue. A visible "Gift Cards" CTA converts more than you would expect, especially around November-December.',
    pass: 'Your site sells gift cards',
    passNote: '{detected} on your site — gift-card sales are some of the highest-margin revenue a restaurant can earn, and you already have the flow.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t spot gift-card sales — is this right?',
    unverifiedNote: 'We scan for gift-card text ("Gift Card", "Gift Certificate", "e-Gift") plus major platforms (Toast Gift Cards, Square Gift Cards, Yiftee, GiftUp, Factor4). If you sell via a platform we missed, tell us and we will add it. If you do not sell gift cards today, adding a simple checkout page is a high-ROI, once-a-quarter project.',
    byType: {
      'fine-dining': {
        impact: 'Gift cards at fine-dining restaurants are the "special occasion" present par excellence — anniversaries, birthdays, holiday gifts. Redemption rates run higher than casual dining but unredeemed balances are still pure margin. Physical printed cards are a nice upsell for corporate gifts.',
        unverifiedNote: 'A gift-card page on a fine-dining site pays for itself during the holidays. Tock, Resy, and SevenRooms all integrate gift cards; Toast does too if you are on their POS.'
      },
      'bar-pub': {
        impact: 'Bars and pubs over-index on gift cards — stocking-stuffers, birthday presents, thank-you gifts from corporate accounts. Every unredeemed card is pure revenue; every redeemed one brings in a customer plus whatever they spend above the card value.',
        unverifiedNote: 'Bar gift cards especially benefit from a simple online checkout. Square and Toast both do this well; Tripleseat if you already use it for events.'
      },
      'bakery': {
        impact: 'Bakery gift cards convert well for birthday presents, corporate gifts, and the "sorry I forgot the birthday cake" save. They are also one of the easiest ways to capture a repeat customer from a one-time visitor.',
        unverifiedNote: 'A gift-card purchase page on your bakery site with $25, $50, $100 presets is the baseline. Square and Toast both handle this natively; email-delivered e-cards make same-day gift purchases possible.'
      },
      'ghost-kitchen': {
        impact: 'Gift cards matter less for ghost kitchens (customers who never visit are unlikely to gift-card-gift the experience), but digital e-cards still add revenue around holidays — and matter for corporate catering accounts.'
      }
    }
  },
  {
    // Phase H3: Loyalty / rewards presence.
    type: 'loyalty',
    weight: 0.4,
    anchor: '#conversions',
    effort: 'dev',
    minutes: 120,
    impact: 'Loyalty programs lift repeat-visit frequency by 15-30% on average — a material difference for a thin-margin business. The modern loyalty tools (Thanx, Paytronix, Square Loyalty) integrate with POS so every visit earns without a punchcard, which is the actual bar for adoption.',
    pass: 'Your site promotes a loyalty program',
    passNote: '{detected} on your site — repeat-visit frequency is where restaurant margin lives, and you have the infrastructure to compound it.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t spot a loyalty program — is this right?',
    unverifiedNote: 'We scan for loyalty text ("rewards program", "earn points", "join our rewards") and known platforms (Thanx, LevelUp, Paytronix, Como, Fivestars, Loyalzoo). If you run one we missed, tell us. If you do not have one yet, a modern POS-integrated loyalty program pays back in 90-120 days for most casual-dining and fast-casual restaurants.'
  },
  {
    // Phase H4: Email newsletter capture.
    type: 'email-capture',
    weight: 0.4,
    anchor: '#conversions',
    effort: 'dev',
    minutes: 60,
    impact: 'An email list is the only marketing channel you OWN — Instagram can ghost you, Google can change the rules, but your list keeps compounding. Restaurants with a newsletter capture typically see 3-5x higher repeat-visit rates from subscribers vs. non-subscribers.',
    pass: 'Your site captures newsletter signups',
    passNote: '{detected} on your site — you are building an owned audience, which is the single most valuable marketing asset a restaurant can accumulate.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t spot a newsletter capture — is this right?',
    unverifiedNote: 'We look for an email input paired with newsletter language (subscribe / join our list / newsletter) OR a form action pointing at Mailchimp, Klaviyo, ConvertKit, Constant Contact, or similar. If yours is elsewhere or the form is in a modal we didn\'t render, let us know.'
  },
  {
    // Phase H5: Catering / private-events page presence.
    // Evaluated from the crawl bundle: a slot='catering' or
    // slot='events' page counts as a pass. Subtype weights in
    // subtypes.js make this a 2.5x bump for catering-only and
    // boost for fine-dining / bar-pub.
    type: 'catering-page',
    weight: 0.75,
    anchor: '#conversions',
    effort: 'rebuild',
    minutes: 180,
    impact: 'A dedicated catering or private-events page is how most corporate planners and wedding organizers FIND caterers — it captures the long-tail search traffic ("catering Brooklyn", "private dining party of 30") that the homepage never ranks for.',
    pass: 'You have a catering / events page',
    passNote: 'Your site links to a dedicated catering or events page — planners searching for private dining in your area can land directly on a page that sells the offering.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t find a catering or events page — is this right?',
    unverifiedNote: 'We look for links labelled "Catering", "Private Events", "Parties", or "Weddings" in your navigation. If you do host events but the page is named differently, let us know. If you don\'t today, a catering page is one of the highest-ROI additions for any restaurant with dining-room capacity.',
    byType: {
      'fine-dining': {
        impact: 'Private-dining rooms and buyouts are the margin engine of fine-dining — a single corporate holiday party pays for a slow week. A dedicated events page with capacity, sample menus, and photo gallery is what the event planners searching "private dining [city]" actually land on.'
      },
      'catering-only': {
        impact: 'For a catering-only business the catering page IS the site. It\'s where packages, per-head pricing, dietary accommodations, minimum order sizes, service radius, lead time, and the RFQ form all live. Without it, planners comparing vendors leave for a competitor with clearer info.'
      },
      'bar-pub': {
        impact: 'Private parties (birthdays, work socials, whiskey tastings) are high-ticket bar revenue that walks in by appointment. A dedicated events page with capacity, packages, and a Tripleseat / inquiry form converts those bookings that would otherwise end up in a lost email thread.'
      }
    }
  },
  {
    // Phase H6: Age-gate presence. Only bar-pub has non-zero
    // weight in subtypes.js (2.0); every other subtype suppresses
    // the check entirely (0) so a cafe that sells no alcohol
    // doesn't lose score for not gating.
    type: 'age-gate',
    weight: 1.0, // default; bar-pub override = 2.0 via subtypes
    anchor: '#trust',
    effort: 'dev',
    minutes: 45,
    impact: 'For bars, pubs, and breweries, an age-gate on the site shows regulators you care about compliance and protects you if an underage visitor sees your promotional content. Almost every state ABC / TTB program expects it, and platforms increasingly penalize non-compliant sites in ad delivery.',
    pass: 'Your site gates underage visitors',
    passNote: 'Your site asks visitors to confirm they are of legal drinking age before seeing beverage content — this is the baseline compliance move for any bar or brewery.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t spot an age-gate — is this right?',
    unverifiedNote: 'We look for "are you 21 or older", "confirm your age", "verify your age" modals. If your age-gate is conditional on a country param or lives in a script we didn\'t render, let us know — and if you don\'t have one yet, this is a 45-minute developer task worth prioritizing.'
  },
  {
    // Phase H7: Food-truck schedule page presence. Food trucks
    // move; a schedule page IS the site's primary purpose.
    // Subtypes.js weights this 2.0 for food-truck and 0 for
    // every other subtype.
    type: 'food-truck-schedule',
    weight: 1.0,
    anchor: '#basics',
    effort: 'dev',
    minutes: 60,
    impact: 'Every food-truck customer arrives with the same question: "where are you today?" A visible weekly schedule, a today\'s-location block, or at minimum a "Find us" page with your Instagram feed is the primary job of a food-truck website.',
    pass: 'Your site shows a schedule / location',
    passNote: 'Your site answers "where are you today?" directly — customers can find you without scrolling to your Instagram.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t find a schedule / location page — is this right?',
    unverifiedNote: 'We look for "today\'s location", "this week\'s schedule", "find us at", "catch us at" copy. If your schedule lives inline on the homepage or in an Instagram embed we didn\'t render, let us know. If you don\'t publish a schedule today — publishing one is the single highest-ROI change you can make on a food-truck site.'
  },
  {
    // Phase H8: Ghost-kitchen / delivery-only explicit marker.
    // Subtypes.js weights this 2.0 for ghost-kitchen and 0
    // elsewhere. A ghost kitchen that doesn't SAY "delivery
    // only" confuses customers who arrive expecting dine-in.
    type: 'aggregator-only',
    weight: 1.0,
    anchor: '#conversions',
    effort: 'self',
    minutes: 20,
    impact: 'Ghost kitchens that don\'t explicitly mark "delivery only" or "no dine-in" get customers showing up in person to an empty storefront — worse, getting a one-star review for "I drove there and it was closed." A single visible "Delivery & Pickup Only" banner deflects that confusion.',
    pass: 'Your site marks delivery-only clearly',
    passNote: 'Your site explicitly states "delivery only" / "virtual kitchen" so customers don\'t show up expecting dine-in.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t see a delivery-only marker — is this right?',
    unverifiedNote: 'We look for "virtual kitchen", "ghost kitchen", "delivery only", "no dine-in", "delivery & pickup only" copy. If yours is phrased differently, let us know. If your site reads as a dine-in restaurant but you\'re actually ghost/delivery-only, add a banner — the 20-minute fix deflects a common one-star review.'
  },
  {
    // Phase H9: Wholesale / custom-order intake presence.
    // Subtypes.js gives bakery weight 2.0 and cafe weight 1.0;
    // other subtypes default to 1.0 (not suppressed).
    type: 'wholesale-custom-orders',
    weight: 1.0,
    anchor: '#conversions',
    effort: 'dev',
    minutes: 120,
    impact: 'For bakeries and cafes, custom orders and wholesale accounts are margin multipliers — a single wedding-cake order can match a week of walk-in revenue, and a standing wholesale account compounds month over month.',
    pass: 'Your site promotes wholesale / custom orders',
    passNote: 'Your site surfaces custom-order or wholesale intake — the margin-rich orders that don\'t happen without explicit copy and a form.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t see wholesale / custom-order copy — is this right?',
    unverifiedNote: 'We look for "custom order", "wholesale", "wedding cakes", "corporate orders", "bulk orders", "order in advance", "special orders". If yours is phrased differently, let us know. For bakeries specifically, a dedicated "Custom Orders" page with a structured intake form pays for itself fast.'
  },
  {
    // Phase H10: Delivery-radius info presence. Subtypes.js
    // gives pizzeria weight 1.5; other subtypes 1.0.
    type: 'delivery-radius',
    weight: 1.0,
    anchor: '#conversions',
    effort: 'self',
    minutes: 30,
    impact: 'Showing your delivery area saves every "do you deliver to me?" phone call. For pizzerias specifically, explicit zone info matters more than the map pin — a customer two neighborhoods over gives up if you look ambiguous.',
    pass: 'Your site shows delivery area / zone',
    passNote: 'Your site explicitly says where you deliver — customers self-qualify without tying up your phone line.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t find delivery-area info — is this right?',
    unverifiedNote: 'We look for "delivery radius", "we deliver to [list]", "delivery zone / area", "zip codes we serve", or "delivery within N miles". If yours is on an order-platform page we didn\'t reach, let us know. For pizzerias especially, a simple neighborhood / zip-code list is worth a line of copy on the homepage.'
  },
  {
    // Phase H11: Social proof (press, awards, chef bio).
    type: 'social-proof',
    weight: 0.5,
    anchor: '#trust',
    effort: 'self',
    minutes: 45,
    impact: 'Visible press quotes and awards convert skeptical new diners at measurably higher rates. "Featured in Eater" or a Michelin mention on the homepage is the single highest-credibility signal you can show a first-time visitor deciding whether to book.',
    pass: 'Your site shows press / awards / chef bio',
    passNote: 'Your site surfaces social proof (press mentions, awards, or a chef bio) — which converts skeptical first-time visitors into bookings.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t find press / awards / chef copy — is this right?',
    unverifiedNote: 'We look for "featured in", "as seen in", "accolades", "Michelin", "James Beard", "Eater", "NYT review", or chef bio copy ("meet the chef", "our chef"). If your press is on an about page we didn\'t reach, let us know. If you have press you\'re not showing — surfacing it on the homepage is free conversion.'
  },
  {
    // Phase H12: Sustainability / sourcing claims.
    type: 'sustainability',
    weight: 0.4,
    anchor: '#trust',
    effort: 'self',
    minutes: 30,
    impact: 'Sustainability claims (locally sourced, farm-to-table, organic, seasonal) signal quality and values in one line of copy. For a meaningful slice of guests this matters MORE than the menu itself — and it raises the perceived average check.',
    pass: 'Your site makes sourcing / sustainability claims',
    passNote: 'Your site explicitly surfaces sustainability or sourcing (local farms, seasonal, organic, farm-to-table, etc.) — which raises perceived quality and attracts a loyal segment of diners.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t find sourcing claims — is this right?',
    unverifiedNote: 'We look for "locally sourced", "farm-to-table", "organic", "sustainable", "seasonal menu", "single-origin", "grass-fed", and related markers. If your sourcing story lives in a photo caption or on a supplier page, let us know. If you\'re sourcing thoughtfully but not saying so, this is a one-afternoon content change.'
  },
  {
    // Phase H13: Photo coverage. Checks image count + alt-text
    // coverage. Restaurants need food photography — sparse
    // imagery kills conversion across every subtype.
    type: 'photo-coverage',
    weight: 0.5,
    anchor: '#mobile',
    effort: 'self',
    minutes: 120,
    impact: 'Food photography is how restaurants sell online — a homepage with 3 images converts worse than one with 10, and alt-text makes those images accessible and SEO-indexable. Empty-alt or broken-alt photos are invisible to Google and to screen readers.',
    pass: 'Your site has strong photo coverage',
    passNote: 'Your homepage carries enough photography AND enough alt-text to do both jobs food images are supposed to do: sell the food and rank in Google Images.',
    fail: 'Your site has sparse or unlabeled photos',
    failNote: 'Homepages need at least 5 good food photos AND at least half of them need real alt-text ("smoked brisket plate with pickled onions" not "image1.jpg"). Both matter: photography drives conversion; alt-text drives accessibility and Google Images traffic.',
    unverified: 'We couldn\'t read your image set',
    unverifiedNote: 'The crawl didn\'t return enough HTML for us to count images reliably. Retry the audit, or paste the homepage URL into our manual-audit queue so we can look by hand.'
  },
  {
    // Phase H14: Hours accuracy — sources from
    // /api/schema-check's validation.openingHours (populated by
    // Phase F2's validateRestaurantSchema). Passes when the
    // schema declares all 7 days; fails when it declares hours
    // but not completely; unverified when schema is silent.
    // Google's Rich Results for restaurants wants every day of
    // the week listed, even if a day is explicitly closed.
    type: 'hours-accuracy',
    weight: 0.6,
    anchor: '#findability',
    effort: 'dev',
    minutes: 30,
    impact: 'Google Rich Results for restaurants wants a full 7-day hours listing — partial coverage causes the "hours vary" fallback, which erodes trust with "are they open right now?" searchers. Every day needs an entry in openingHoursSpecification, even if opens/closes are null for a closed day.',
    pass: 'Your schema declares 7-day hours',
    passNote: 'Your JSON-LD schema publishes hours for every day of the week — Google can render a full hours table in Rich Results and Map snippets.',
    fail: 'Your schema hours are incomplete',
    failNote: 'Your site declares hours in schema but not for every day of the week. Google falls back to a "hours vary" hint, which hurts click-through from "restaurants open now" searches. Add an openingHoursSpecification entry for every day of the week in your JSON-LD block (closed days can have opens/closes set to null).',
    unverified: 'We couldn\'t confirm schema hours',
    unverifiedNote: 'Your schema markup didn\'t declare opening hours at all (or we couldn\'t read it). Adding a complete openingHoursSpecification block is one of the highest-impact single edits you can make for local-search click-through.'
  }
];

// ---------------------------------------------------------------------------
// Restaurant readiness scoring
// ---------------------------------------------------------------------------
// The inline check renderer walks RESTAURANT_PRIORITY_CHECKS and assigns
// each check one of three statuses: 'pass', 'fail', 'unverified'. The
// readiness score is a weighted-pass rollup.
//
//   weight   (per check) — defaults to 1.0; see RESTAURANT_PRIORITY_CHECKS.
//   'pass'   — adds full credit, full weight to the denominator.
//   'fail'   — adds zero credit, full weight to the denominator.
//   'unverified' — zero credit, HALF weight to the denominator (A1).
//
// Half-weighting unverified checks avoids the old bug where a site we
// couldn't fully scan could score higher than a clean-scanning site
// with the same number of fails. The adjustment is disclosed in the
// UI via state.unverifiedWeight so owners can see the penalty.
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
    weightedCredit: 0,
    unverifiedWeight: 0
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
    // Sprint A1: unverified checks now carry half-weight against the
    // denominator (zero credit). Previously they were excluded from
    // both sides, which inflated scores on sites we couldn't fully
    // scan. Half-weight is a calibrated compromise between "assume the
    // worst" (unfair to reachable-but-slow sites) and "ignore entirely"
    // (rewards opacity). The half-weight is also tracked separately so
    // the UI can disclose the adjustment to the owner.
    state.unverifiedCount++;
    var uw = 0.5 * w;
    state.totalWeight += uw;
    state.unverifiedWeight += uw;
  }
}

function finalizeRestaurantReadinessScore(state) {
  return state.totalWeight > 0
    ? Math.round((state.weightedCredit / state.totalWeight) * 100)
    : 0;
}

// ---------------------------------------------------------------------------
// Page-signal detectors — Phase G4/G5/G7
// ---------------------------------------------------------------------------
// Pure functions that scan raw HTML (homepage and/or follow-up crawl
// pages) for review-platform widgets, Instagram handles, and social-
// share meta tags. Each returns a structured finding that Phase H
// priority checks will consume as a new check entry.
//
// All three functions are INPUT-ONLY: they never fetch anything, so
// they're safe to call any number of times on any body of HTML.

// G4: review-widget detection. Recognizes script / iframe / anchor
// fingerprints from the major review platforms a restaurant owner
// might embed. Returns an array of { platform, badge:boolean, link:boolean }
// so the caller can differentiate 'TripAdvisor badge embedded'
// from 'link to TripAdvisor profile only'.
var REVIEW_WIDGET_PATTERNS = [
  { platform: 'Yelp',          hosts: ['yelp.com/biz',          'yelp.com/widgets',  'yelp-cdn'] },
  { platform: 'TripAdvisor',   hosts: ['tripadvisor.com',       'jscdn.tripadvisor', 'tacdn.com'] },
  { platform: 'Google Reviews',hosts: ['google.com/maps/place', 'g.co/kgs',          'goo.gl/maps', 'reviews.google'] },
  { platform: 'OpenTable',     hosts: ['opentable.com/widget',  'opentable.com/r'] },
  { platform: 'Resy',          hosts: ['resy.com/cities',       'widgets.resy'] },
  { platform: 'Facebook',      hosts: ['facebook.com/plugins',  'connect.facebook.net'] },
  { platform: 'Instagram',     hosts: ['instagram.com/embed',   'cdn.embedded.instagram'] }
];

function detectReviewWidgets(html) {
  var out = [];
  if (!html || typeof html !== 'string') return out;
  var haystack = html.toLowerCase();
  REVIEW_WIDGET_PATTERNS.forEach(function(def){
    var found = false;
    for (var i = 0; i < def.hosts.length; i++) {
      if (haystack.indexOf(def.hosts[i]) >= 0) { found = true; break; }
    }
    if (found) out.push({ platform: def.platform, present: true });
  });
  return out;
}

// G5: Instagram handle detection. Captures @handles and
// instagram.com/handle hrefs. Filters out obvious non-profiles
// ('instagram.com/p/…' for individual posts, '/embed' widgets,
// '/explore', '/reel'). Dedupes across the page.
function detectInstagramHandle(html) {
  if (!html || typeof html !== 'string') return { present: false, handles: [] };
  var handles = Object.create(null);

  // 1) href="https://instagram.com/handle" or www.instagram.com/handle
  var hrefRe = /https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.]{2,30})(?:\/)?(?=["'?#\s/])/gi;
  var m;
  while ((m = hrefRe.exec(html)) !== null) {
    var h = m[1].toLowerCase();
    if (h === 'p' || h === 'embed' || h === 'explore' || h === 'reel' || h === 'reels' || h === 'tv') continue;
    handles[h] = true;
  }
  // 2) @handle patterns in visible copy, e.g. "Follow us @thebestspot"
  //    Guard against email addresses (prefix must be whitespace or '>').
  var atRe = /(?:^|[\s>(])@([A-Za-z0-9_.]{3,30})\b/g;
  while ((m = atRe.exec(html)) !== null) {
    var h2 = m[1].toLowerCase();
    // Skip obvious non-IG tokens (email fragments, code)
    if (/^\d+$/.test(h2)) continue;
    handles[h2] = true;
  }
  var list = Object.keys(handles).sort();
  return { present: list.length > 0, handles: list };
}

// G7: Open-Graph + Twitter-Card meta presence. Restaurants share links
// constantly (Instagram story, Messenger, texts, Slack) — every shared
// link without og:image renders as a grey-box preview, which kills the
// click-through that restaurant marketing actually runs on.
// H1: Dietary / allergen signal detection. Scans visible page text
// for dietary markers customers search for (vegan, gluten-free,
// halal, kosher, nut-free, dairy-free, vegetarian, plant-based,
// nut allergy) plus schema-like markers (GF badge, V badge).
// Dedupes across a page and returns a normalized set.
//
// Rationale: dietary-aware eaters make decisions based on whether
// a menu signals that they were CONSIDERED. A single 'GF' label
// converts more dietary-restricted customers than ten generic
// 'we can accommodate' paragraphs. This check just measures
// whether any dietary signal is present and which.
var DIETARY_MARKER_PATTERNS = [
  { marker: 'vegan',           regex: /\bvegan\b|\bv(?:gn)?\s*symbol\b|\(v\)/i },
  { marker: 'vegetarian',      regex: /\bvegetarian\b|\bplant[-\s]?based\b/i },
  { marker: 'gluten-free',     regex: /\bgluten[-\s]?free\b|\bgluten\s+friendly\b|\bGF\b|\(gf\)/ },
  { marker: 'dairy-free',      regex: /\bdairy[-\s]?free\b|\blactose[-\s]?free\b/i },
  { marker: 'nut-free',        regex: /\bnut[-\s]?free\b|\bnut\s+allergy\b|\bpeanut\s+free\b/i },
  { marker: 'halal',           regex: /\bhalal\b/i },
  { marker: 'kosher',          regex: /\bkosher\b|\bkeeping\s+kosher\b/i },
  { marker: 'organic',         regex: /\borganic\b|\busda\s+organic\b/i },
  { marker: 'keto',            regex: /\bketo\b|\blow[-\s]?carb\b/i },
  { marker: 'paleo',           regex: /\bpaleo\b/i },
  { marker: 'allergen-notes',  regex: /\ballergen(?:s)?\b|\bcontains:\s+(?:nuts|dairy|soy|gluten)\b/i }
];

// H2: Gift-card presence. Detects gift-card commerce either by
// visible text ('gift card', 'gift certificate', 'e-gift') or by
// known gift-card platform links (Toast gift cards, Square gift
// cards, Yiftee, GiftUp, Factor4, etc.). Gift cards are the
// highest-margin line on a restaurant site — every $50 sale that
// doesn't convert into a redemption is pure revenue.
var GIFT_CARD_PATTERNS = {
  keywords: /\bgift\s+(?:card|cards|certificate|certificates)\b|\be[-\s]?gift\s+card\b|\bgift\s+voucher\b/i,
  hosts: ['yiftee', 'giftup', 'factor4', 'toasttab.com/gift', 'square.site/gift', 'gift.squareup', 'giftly', 'giftfly', 'rewardsnetwork']
};
function detectGiftCardPresence(pageText, allUrls) {
  var viaText = pageText ? GIFT_CARD_PATTERNS.keywords.test(pageText) : false;
  var viaHosts = false;
  if (Array.isArray(allUrls)) {
    for (var i = 0; i < allUrls.length && !viaHosts; i++) {
      var u = String(allUrls[i] || '').toLowerCase();
      for (var j = 0; j < GIFT_CARD_PATTERNS.hosts.length; j++) {
        if (u.indexOf(GIFT_CARD_PATTERNS.hosts[j]) >= 0) { viaHosts = true; break; }
      }
    }
  }
  return { present: viaText || viaHosts, viaText: viaText, viaHosts: viaHosts };
}

// H3: Loyalty / rewards detection. Text keywords plus known
// loyalty-platform hosts (Thanx, LevelUp, Paytronix, Como,
// Fivestars, Loyalzoo, Punchcard, Hang).
var LOYALTY_PATTERNS = {
  keywords: /\b(?:loyalty\s+program|rewards\s+program|earn\s+(?:points|rewards)|join\s+our\s+rewards|sign\s+up\s+for\s+rewards|loyalty\s+(?:club|members))\b/i,
  hosts: ['thanx.com', 'thelevelup', 'paytronix', 'como.com', 'fivestars', 'loyalzoo', 'punchcard', 'hang.com', 'belly', 'spendgo']
};
function detectLoyaltyProgram(pageText, allUrls) {
  var viaText = pageText ? LOYALTY_PATTERNS.keywords.test(pageText) : false;
  var viaHosts = false;
  if (Array.isArray(allUrls)) {
    for (var i = 0; i < allUrls.length && !viaHosts; i++) {
      var u = String(allUrls[i] || '').toLowerCase();
      for (var j = 0; j < LOYALTY_PATTERNS.hosts.length; j++) {
        if (u.indexOf(LOYALTY_PATTERNS.hosts[j]) >= 0) { viaHosts = true; break; }
      }
    }
  }
  return { present: viaText || viaHosts, viaText: viaText, viaHosts: viaHosts };
}

// H4: Email newsletter capture detection. Scans HTML for an
// email <input> inside a form (or a form's action attribute
// pointing at a known mailing-list platform). The check passes
// when we see BOTH an email input AND "newsletter / subscribe /
// join" language, so a contact-form-only site doesn't falsely
// flag as a newsletter capture.
var EMAIL_CAPTURE_HOSTS = [
  'list-manage.com', 'mailchimp.com', 'createsend.com', 'constantcontact.com',
  'klaviyo.com', 'convertkit.com', 'cmail19.com', 'cmail20.com', 'flodesk.com',
  'mailerlite.com', 'activehosted.com', 'drip.com', 'hubspot.com'
];
function detectEmailCapture(html, allUrls) {
  if (!html || typeof html !== 'string') return { present: false };
  var hasEmailInput = /<input[^>]*type\s*=\s*["']email["']/i.test(html) ||
                      /<input[^>]*name\s*=\s*["']email["']/i.test(html);
  var hasNewsletterCopy = /\b(?:newsletter|subscribe|join\s+our\s+(?:list|email|community)|stay\s+in\s+the\s+loop|sign\s+up\s+for\s+(?:updates|our))\b/i.test(html);
  var hasHost = false;
  if (Array.isArray(allUrls)) {
    for (var i = 0; i < allUrls.length && !hasHost; i++) {
      var u = String(allUrls[i] || '').toLowerCase();
      for (var j = 0; j < EMAIL_CAPTURE_HOSTS.length; j++) {
        if (u.indexOf(EMAIL_CAPTURE_HOSTS[j]) >= 0) { hasHost = true; break; }
      }
    }
  }
  // Pass when we have EITHER a recognized provider (hasHost) OR
  // an email input + newsletter copy pair. An email input alone
  // is usually a contact-form, which isn't a newsletter capture.
  var present = hasHost || (hasEmailInput && hasNewsletterCopy);
  return { present: present, hasEmailInput: hasEmailInput, hasNewsletterCopy: hasNewsletterCopy, hasHost: hasHost };
}

// H6: Age-gate detection. Scans for the common "are you 21 or older"
// modal/pattern. Mostly relevant for bar-pub and breweries.
var AGE_GATE_PATTERNS = [
  /\bage[-\s]?gate\b/i,
  /\b(?:are\s+you|i\s+am|must\s+be)\s+(?:21|18)\s+(?:or\s+)?older\b/i,
  /\bconfirm\s+your\s+age\b/i,
  /\bmust\s+be\s+of\s+legal\s+drinking\s+age\b/i,
  /\bverify\s+your\s+age\b/i
];
function detectAgeGate(html) {
  if (!html || typeof html !== 'string') return { present: false };
  for (var i = 0; i < AGE_GATE_PATTERNS.length; i++) {
    if (AGE_GATE_PATTERNS[i].test(html)) return { present: true };
  }
  return { present: false };
}

// H7: Food-truck schedule detection. Food-trucks MOVE, so the
// primary navigational question is "where are you today/this
// week?" A truck site without a schedule page fails its primary
// job. Detects either a schedule-named crawl slot OR visible
// text patterns on any crawled page.
var FOOD_TRUCK_SCHEDULE_PATTERNS = [
  /\btoday['’]s\s+location\b/i,
  /\bthis\s+week['’]s\s+schedule\b/i,
  /\bweekly\s+schedule\b/i,
  /\bfind\s+us\s+(?:at|this)\b/i,
  /\bcatch\s+us\s+(?:at|this)\b/i,
  /\btruck\s+schedule\b/i,
  /\blocation\s+calendar\b/i,
  /\bwhere\s+we\s+(?:are|will\s+be)\b/i
];
function detectFoodTruckSchedule(pageText) {
  if (!pageText) return { present: false };
  for (var i = 0; i < FOOD_TRUCK_SCHEDULE_PATTERNS.length; i++) {
    if (FOOD_TRUCK_SCHEDULE_PATTERNS[i].test(pageText)) return { present: true };
  }
  return { present: false };
}

// H8: Ghost-kitchen / delivery-only signal. Detects the pattern
// of a site that operates ONLY through delivery aggregators —
// explicit "virtual kitchen" / "delivery-only" / "no dine-in"
// copy, or aggregator-only link pattern (2+ aggregators present,
// no dine-in marker, no reservation platform).
function detectGhostKitchenPattern(pageText) {
  if (!pageText) return { present: false };
  var markers = [
    /\bghost\s+kitchen\b/i,
    /\bvirtual\s+(?:kitchen|restaurant|brand)\b/i,
    /\bdelivery[-\s]only\b/i,
    /\bcloud\s+kitchen\b/i,
    /\bno\s+dine[-\s]in\b/i,
    /\bdelivery\s+&?\s*pickup\s+only\b/i
  ];
  for (var i = 0; i < markers.length; i++) {
    if (markers[i].test(pageText)) return { present: true };
  }
  return { present: false };
}

// H9: Wholesale / custom-order intake detection. Bakeries and
// cafes earn significant revenue from special orders (weddings,
// corporate catering, custom cakes); the check just looks for
// explicit "custom order" / "wholesale" / "cake order" language.
var WHOLESALE_CUSTOM_PATTERNS = [
  /\bwholesale\b/i,
  /\bcustom\s+(?:cake|order|cakes|orders)\b/i,
  /\bwedding\s+cakes?\b/i,
  /\bcorporate\s+(?:orders?|gifting|gifts)\b/i,
  /\bbulk\s+orders?\b/i,
  /\border\s+in\s+advance\b/i,
  /\bspecial\s+orders?\b/i,
  /\bcustom\s+designs?\b/i
];
function detectWholesaleCustomOrders(pageText) {
  if (!pageText) return { present: false };
  for (var i = 0; i < WHOLESALE_CUSTOM_PATTERNS.length; i++) {
    if (WHOLESALE_CUSTOM_PATTERNS[i].test(pageText)) return { present: true };
  }
  return { present: false };
}

// H10: Delivery radius / zone detection. Pizzerias and ghost
// kitchens benefit from explicit "we deliver to" zone info to
// deflect the "do you deliver here?" phone calls.
var DELIVERY_RADIUS_PATTERNS = [
  /\bdelivery\s+(?:radius|zone|area|zones|areas)\b/i,
  /\bwe\s+deliver\s+to\b/i,
  /\bdelivering\s+to\b/i,
  /\bzip\s+codes?\s+(?:we\s+)?serve\b/i,
  /\bdelivery\s+within\s+\d+\s+miles?\b/i,
  /\bour\s+delivery\s+area\b/i
];
function detectDeliveryRadius(pageText) {
  if (!pageText) return { present: false };
  for (var i = 0; i < DELIVERY_RADIUS_PATTERNS.length; i++) {
    if (DELIVERY_RADIUS_PATTERNS[i].test(pageText)) return { present: true };
  }
  return { present: false };
}

// H11: Social proof detection — press quotes, awards, Michelin,
// James Beard, chef bios. Restaurants with visible press
// mentions convert skeptical new diners at meaningfully higher
// rates; the check measures whether any proof signal is on the page.
var SOCIAL_PROOF_PATTERNS = [
  /\bfeatured\s+in\b/i,
  /\bas\s+seen\s+(?:in|on)\b/i,
  /\bpress(?:\s+&?\s*accolades|\s+mentions|\s+coverage)?\b/i,
  /\baccolades\b/i,
  /\bawards?\s+(?:&|and)\s+(?:press|recognition)\b/i,
  /\bmichelin(?:\s+(?:star|starred|guide))?\b/i,
  /\bjames\s+beard\b/i,
  /\beater\s+\d{4}\b/i,
  /\b(?:nyt|new\s+york\s+times)\s+review\b/i,
  /\b(?:best\s+of|top\s+\d+)\s+(?:lists?)?\b/i,
  /\bchef\s+(?:owner|profile|bio)\b/i,
  /\bmeet\s+the\s+chef\b/i,
  /\bour\s+chef\b/i
];
function detectSocialProof(pageText) {
  if (!pageText) return { present: false };
  for (var i = 0; i < SOCIAL_PROOF_PATTERNS.length; i++) {
    if (SOCIAL_PROOF_PATTERNS[i].test(pageText)) return { present: true };
  }
  return { present: false };
}

// H12: Sustainability / sourcing claims. Relevant across all
// subtypes but heavier for fine-dining and cafes where
// provenance is part of the brand.
var SUSTAINABILITY_PATTERNS = [
  /\blocally\s+sourced\b/i,
  /\blocal\s+farms?\b/i,
  /\bfarm[-\s]to[-\s]table\b/i,
  /\bsustainabl(?:e|y)\b/i,
  /\bsustainability\b/i,
  /\borganic\b/i,
  /\bregenerative\b/i,
  /\bzero[-\s]waste\b/i,
  /\bcompostable\b/i,
  /\bcarbon[-\s]neutral\b/i,
  /\bfair[-\s]trade\b/i,
  /\bethically\s+sourced\b/i,
  /\bseasonal\s+(?:menu|ingredients)\b/i,
  /\bsingle[-\s]origin\b/i,
  /\bgrass[-\s]fed\b/i,
  /\bheirloom\b/i
];
function detectSustainability(pageText) {
  if (!pageText) return { present: false };
  for (var i = 0; i < SUSTAINABILITY_PATTERNS.length; i++) {
    if (SUSTAINABILITY_PATTERNS[i].test(pageText)) return { present: true };
  }
  return { present: false };
}

// H13: Photo coverage. Counts <img> tags and alt-text presence.
// Restaurants live on food photography — sparse imagery or
// broken alt-text both signal underinvestment. The check is
// satisfied when there are >=5 images AND >=50% of them carry
// a non-empty alt attribute (SEO + accessibility baseline).
function detectPhotoCoverage(html) {
  if (!html || typeof html !== 'string') return { imgCount: 0, altCount: 0, altCoverage: 0 };
  var imgCount = 0;
  var altCount = 0;
  var re = /<img\b([^>]*)>/gi;
  var m;
  while ((m = re.exec(html)) !== null) {
    imgCount++;
    // alt="..." — count as covered if the attribute exists with
    // non-empty content. alt="" is intentional decorative markup
    // which, per WCAG, still counts as "handled" — but for
    // restaurants we want real alt text describing food, so an
    // empty alt doesn't count toward coverage for this check.
    var altMatch = m[1].match(/alt\s*=\s*["']([^"']*)["']/i);
    if (altMatch && altMatch[1].trim().length > 0) altCount++;
  }
  return {
    imgCount:    imgCount,
    altCount:    altCount,
    altCoverage: imgCount > 0 ? altCount / imgCount : 0
  };
}

function detectDietaryMarkers(pageText) {
  if (!pageText || typeof pageText !== 'string') return { present: false, markers: [] };
  var found = Object.create(null);
  for (var i = 0; i < DIETARY_MARKER_PATTERNS.length; i++) {
    var def = DIETARY_MARKER_PATTERNS[i];
    if (def.regex.test(pageText)) found[def.marker] = true;
  }
  var markers = Object.keys(found).sort();
  return { present: markers.length > 0, markers: markers, count: markers.length };
}

function checkOgShareMeta(html) {
  if (!html || typeof html !== 'string') return {
    ogTitle: false, ogDescription: false, ogImage: false,
    twitterCard: false, twitterImage: false, score: 0
  };
  function hasMeta(propValue, contentCheck) {
    var re = new RegExp('<meta[^>]*(?:property|name)\\s*=\\s*["\']' + propValue + '["\'][^>]*content\\s*=\\s*["\']([^"\']*)["\']', 'i');
    var re2 = new RegExp('<meta[^>]*content\\s*=\\s*["\']([^"\']*)["\'][^>]*(?:property|name)\\s*=\\s*["\']' + propValue + '["\']', 'i');
    var m = html.match(re) || html.match(re2);
    if (!m) return false;
    var val = (m[1] || '').trim();
    return contentCheck ? contentCheck(val) : val.length > 0;
  }
  var nonEmpty = function(v){ return v.length > 0; };
  var out = {
    ogTitle:       hasMeta('og:title', nonEmpty),
    ogDescription: hasMeta('og:description', nonEmpty),
    ogImage:       hasMeta('og:image', function(v){ return /^https?:\/\//i.test(v); }),
    twitterCard:   hasMeta('twitter:card', nonEmpty),
    twitterImage:  hasMeta('twitter:image', function(v){ return /^https?:\/\//i.test(v); })
  };
  // Score 0-5, for quick comparison against a subtype benchmark.
  out.score = (out.ogTitle?1:0) + (out.ogDescription?1:0) + (out.ogImage?1:0) +
              (out.twitterCard?1:0) + (out.twitterImage?1:0);
  return out;
}
