/**
 * Restaurant Website Audit — Platform Patterns, Priority Checks & Subtype Logic
 *
 * Loaded as a classic script before the main IIFE in ./index.html. All
 * top-level `var` declarations here are available as globals to the
 * consumer script (matching the pattern used by the sibling wellness
 * audit at ../wellness/wellness-checks.js).
 *
 * Detection categories:
 *   ordering     — online ordering platforms (Toast, Square, ChowNow, …)
 *   reservations — reservation platforms (OpenTable, Resy, Tock, …)
 *   maps         — embedded maps and directions
 *   phone        — tap-to-call phone links
 *
 * Each platform pattern is a substring match against all URLs found in
 * the page's HTML. If any URL contains the pattern string, the
 * platform is detected.
 *
 * ---------------------------------------------------------------------
 * Sprint 1 (M1.1–M1.18): Detector-fusion context
 * ---------------------------------------------------------------------
 *
 * `evaluatePriorityCheck(def, audits, allUrls, pageText, context)` in
 * index.html dispatches each def.type to its handler. The optional 5th
 * argument `context` bundles the richer signals that Sprint 1 added:
 *
 *   context = {
 *     places: {                        // null if no matching GBP listing
 *       ok: true,
 *       place: {                       // normalized Places v1 result
 *         nationalPhoneNumber, location {lat, lng},
 *         takeout, delivery, reservable, dineIn,
 *         servesBreakfast / Lunch / Dinner / Brunch,
 *         servesBeer / Wine / Cocktails / Coffee / Dessert,
 *         servesVegetarianFood,
 *         primaryTypeDisplayName, editorialSummary,
 *         priceLevel, businessStatus,
 *         rating, reviewCount, photoCount,
 *         weekdayHoursText                 // human-readable hours
 *       }
 *     },
 *     schema: {                        // null if /api/schema-check failed
 *       validation: {
 *         openingHours, priceRange, address,
 *         servesCuisine, acceptsReservations, hasMenu   // each with {present, valid, reason, value}
 *       },
 *       objects: []                    // raw JSON-LD array
 *     },
 *     crawl: {                         // null if /api/page-crawl failed
 *       homepage: { url, status, html, title, h1 },
 *       pages: [                       // slot-tagged follow-up fetches
 *         { slot, url, status, html, title, h1, error? },
 *         ...
 *       ],
 *       capHit                         // true if the 15s timer fired
 *     }
 *   }
 *
 * Detectors that read the context gracefully degrade when any field is
 * null — they fall back to the existing regex/keyword path. This is how
 * the Fast Scan path stays callable when Places or schema check fails.
 *
 * When adding a new detector fuse, always null-guard the chain:
 *     var place = context && context.places && context.places.place;
 *     if (place && place.takeout === true) return makeResult(def, 'pass');
 *
 * The competitor-comparison flow in index.html deliberately passes NO
 * context because the user's Places signal is not valid for a competing
 * URL — mixing them would bias cross-URL scoring.
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
    anchor: '#viewport-meta',
    effort: 'dev',       // 'self' | 'dev' | 'rebuild'
    minutes: 5,          // rough time-to-fix
    impact: 'Without a viewport tag, every phone visitor sees a broken desktop layout. Roughly 70% of restaurant traffic is mobile, which means a missing viewport is 70% of your traffic bouncing on contact.',
    impact_es: 'Sin una etiqueta viewport, cada visitante desde un teléfono ve un diseño de escritorio roto. Cerca del 70% del tráfico de restaurantes es móvil, así que un viewport ausente es 70% de tu tráfico rebotando al instante.',
    pass: 'Your site fits on a phone screen',
    pass_es: 'Tu sitio se adapta a la pantalla de un teléfono',
    passNote: 'Your pages render at phone width automatically — the single most important mobile-readiness check, and you pass it.',
    passNote_es: 'Tus páginas se adaptan automáticamente al ancho de un teléfono — la verificación más importante de preparación móvil, y la pasas.',
    fail: 'Your site is not set up for phones',
    fail_es: 'Tu sitio no está preparado para teléfonos',
    failNote: 'Without a viewport meta tag, mobile browsers render your site at desktop width and then zoom out to fit. Everything looks tiny and the whole mobile experience breaks. This is a one-line fix for whoever maintains your site — ask them to add <code>&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code> to the &lt;head&gt;.',
    failNote_es: 'Sin una meta etiqueta viewport, los navegadores móviles cargan tu sitio al ancho de escritorio y luego hacen zoom out para ajustarlo. Todo se ve minúsculo y la experiencia móvil completa se rompe. Este es un arreglo de una línea para quien mantiene tu sitio — pídele que agregue <code>&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code> en el &lt;head&gt;.',
    unverified: "We couldn't check if your site fits on a phone",
    unverified_es: 'No pudimos comprobar si tu sitio se adapta a un teléfono',
    unverifiedNote: "Lighthouse couldn't evaluate the viewport tag on this run. Re-audit in a few seconds and this usually resolves.",
    unverifiedNote_es: 'Lighthouse no pudo evaluar la etiqueta viewport en esta ejecución. Vuelve a auditar en unos segundos y normalmente se resuelve.'
  },
  {
    type: 'audit',
    audit: 'tap-targets',
    weight: 1.0,
    anchor: '#tap-targets',
    effort: 'dev',
    minutes: 20,
    impact: "Every missed tap is a frustrated customer. On a restaurant site where the most-tapped button is usually Reserve or Order, small tap targets translate directly into lost bookings.",
    impact_es: 'Cada tap fallido es un cliente frustrado. En un sitio de restaurante donde el botón más tocado suele ser Reservar u Ordenar, áreas tocables pequeñas se traducen directamente en reservas perdidas.',
    pass: 'Your buttons are big enough to tap',
    pass_es: 'Tus botones son lo bastante grandes para tocar',
    passNote: 'Your action buttons are big enough to hit on the first try with a thumb holding a phone in one hand.',
    passNote_es: 'Tus botones de acción son lo bastante grandes para acertarlos al primer intento sosteniendo el teléfono con una mano.',
    fail: 'Some of your buttons are too small to tap reliably',
    fail_es: 'Algunos botones son muy pequeños para tocarlos de forma confiable',
    failNote: 'Action buttons under 44×44 pixels cause fat-finger misses. On a restaurant site, a missed "Reserve" tap is a lost booking walking out the door. Bump button padding to 12px on every side, and give links at least 44px of vertical space around them.',
    failNote_es: 'Los botones menores a 44×44 píxeles provocan errores de tap. En un sitio de restaurante, un tap fallido en "Reservar" es una reserva que se va por la puerta. Aumenta el padding de los botones a 12 px en cada lado, y deja al menos 44 px de espacio vertical alrededor de los enlaces.',
    unverified: "We couldn't check your buttons' tap-friendliness",
    unverified_es: 'No pudimos comprobar la usabilidad táctil de tus botones',
    unverifiedNote: "Lighthouse couldn't evaluate tap targets on this run. Re-audit in a few seconds and this usually resolves.",
    unverifiedNote_es: 'Lighthouse no pudo evaluar las áreas tocables en esta ejecución. Vuelve a auditar en unos segundos y normalmente se resuelve.',
    byType: {
      'fine-dining': {
        impact: 'On a fine-dining site the "Reserve" button carries almost the entire booking funnel — it\'s the one tap between "I\'m curious" and "I\'m on the books for Saturday." Small or crowded, and you lose the reservation.',
        impact_es: 'En un sitio de fine-dining, el botón "Reservar" carga casi todo el funnel de reservas — es el único tap entre "me interesa" y "ya tengo mesa el sábado". Pequeño o apretado, pierdes la reserva.',
        failNote: 'Action buttons under 44×44 pixels cause fat-finger misses. The "Reserve" button is the one that matters — give it at least 48×48 px and plenty of breathing room so the Saturday-night impulse actually books.',
        failNote_es: 'Los botones menores a 44×44 píxeles provocan errores de tap. El botón "Reservar" es el que importa — dale al menos 48×48 px y mucho espacio alrededor para que el impulso del sábado por la noche realmente se convierta en reserva.'
      },
      'fast-casual': {
        impact: 'Fast-casual traffic is almost all mobile and overwhelmingly intent-driven — someone is ordering lunch from their phone while walking to the office. "Order Online" is the most-tapped button on your site. If it\'s small, they give up and open DoorDash.',
        impact_es: 'El tráfico fast-casual es casi todo móvil y mayoritariamente de intención — alguien ordena el almuerzo desde su teléfono mientras camina a la oficina. "Ordenar en Línea" es el botón más tocado en tu sitio. Si es pequeño, se rinden y abren DoorDash.',
        failNote: 'Buttons under 44×44 pixels cause misses. "Order Online" is the critical button — bump its padding to at least 12px on every side and keep it visually distinct from secondary links.',
        failNote_es: 'Los botones menores a 44×44 píxeles provocan fallos. "Ordenar en Línea" es el botón crítico — súbele el padding a al menos 12 px en cada lado y manténlo visualmente distinto de los enlaces secundarios.'
      },
      'cafe': {
        impact: 'Most café traffic is hours-and-location intent: "is it open?" and "where is it?" The hours block and the map pin need to be tappable without zooming — a missed tap sends the customer to a competing shop around the corner.',
        impact_es: 'La mayoría del tráfico de café es intención de horario y ubicación: "¿están abiertos?" y "¿dónde queda?" El bloque de horarios y el pin del mapa tienen que tocarse sin zoom — un tap fallido manda al cliente al café competidor a la vuelta de la esquina.',
        failNote: 'Hours, phone number, and map links are the three tap-target priorities for a café. They don\'t need to be huge buttons — just give them enough padding (12px) that a thumb reliably hits them.',
        failNote_es: 'Horarios, número de teléfono y enlaces de mapa son las tres prioridades de áreas tocables para un café. No necesitan ser botones enormes — solo dales suficiente padding (12 px) para que un pulgar los acierte de forma confiable.'
      },
      'bakery': {
        impact: 'Bakery traffic skews heavily toward custom-cake inquiries and morning pickup pre-orders — "Order Ahead" and "Request a Custom Cake" are the two buttons that carry $500-2000 wedding orders and $30 croissant pre-orders. A missed tap is a real lost order.',
        impact_es: 'El tráfico de panadería se inclina fuerte hacia consultas de pasteles personalizados y pre-pedidos para recoger en la mañana — "Ordenar con Anticipación" y "Pedir Pastel Personalizado" son los dos botones que cargan pedidos de boda de $500-2000 y pre-pedidos de croissants de $30. Un tap fallido es un pedido real perdido.',
        failNote: 'Bump the "Order Ahead" and "Custom Cake Inquiry" buttons to 48×48 with 12px+ padding — these are the two that carry almost all of your online revenue. Other links can be smaller.',
        failNote_es: 'Sube los botones "Ordenar con Anticipación" y "Pedir Pastel Personalizado" a 48×48 con 12 px+ de padding — estos son los dos que cargan casi todos tus ingresos en línea. Los demás enlaces pueden ser más pequeños.'
      },
      'pizzeria': {
        impact: 'On a pizzeria site "Order Delivery" and "Start a Pickup Order" are the conversion. Almost all mobile traffic is hungry-right-now intent, and a missed tap routes that order to Slice or DoorDash (where you pay 20-30% commission) within seconds.',
        impact_es: 'En un sitio de pizzería "Ordenar Delivery" y "Iniciar Pedido Pickup" son la conversión. Casi todo el tráfico móvil es intención de "tengo hambre ahora", y un tap fallido desvía ese pedido a Slice o DoorDash (donde pagas 20-30% de comisión) en segundos.',
        failNote: '"Order Delivery" / "Pickup Order" need 48×48 tap targets and padding to separate them from secondary navigation. Every missed tap at 7pm on a Friday goes to an aggregator — you literally pay commission per miss.',
        failNote_es: '"Ordenar Delivery" / "Pedido Pickup" necesitan áreas de 48×48 y padding para separarse de la navegación secundaria. Cada tap fallido a las 7pm un viernes se va a un agregador — literalmente pagas comisión por cada fallo.'
      },
      'food-truck': {
        impact: 'Food-truck traffic is all mobile and all intent-driven — "where are you today?" "what\'s on the menu right now?" The "See Today\'s Schedule" and Instagram-link buttons carry the entire discovery funnel. A missed tap sends hungry customers to whatever else Google Maps surfaces nearby.',
        impact_es: 'El tráfico de food truck es todo móvil y todo de intención — "¿dónde están hoy?" "¿qué hay en el menú ahora?" Los botones "Ver Horario de Hoy" y el enlace a Instagram cargan todo el funnel de descubrimiento. Un tap fallido manda a clientes hambrientos a lo que sea que Google Maps muestre cerca.',
        failNote: 'The "Today\'s Location" and "See Our Schedule" buttons need 48×48 tap targets and healthy padding. Your Instagram-handle chip belongs in the same priority tier — it\'s where most of your actual schedule updates land.',
        failNote_es: 'Los botones "Ubicación de Hoy" y "Ver Nuestro Horario" necesitan áreas de 48×48 y padding generoso. Tu chip de handle de Instagram pertenece al mismo nivel de prioridad — es donde aterrizan la mayoría de tus actualizaciones de horario reales.'
      },
      'ghost-kitchen': {
        impact: 'Ghost-kitchen sites are discovery pages — customers came to confirm you\'re real before placing an order on DoorDash or Uber Eats. The "Order on DoorDash / Uber Eats / Grubhub" aggregator buttons are the primary conversion. Misses turn into orders for a competing kitchen on the same platform.',
        impact_es: 'Los sitios de cocina fantasma son páginas de descubrimiento — los clientes vienen a confirmar que eres real antes de pedir por DoorDash o Uber Eats. Los botones "Ordenar en DoorDash / Uber Eats / Grubhub" son la conversión principal. Los fallos se convierten en pedidos para una cocina competidora en la misma plataforma.',
        failNote: 'Size the aggregator "Order On …" buttons first — they carry almost all your orders. 48×48 with padding, and stack them clearly so a customer on a hungry phone at 9pm can tap the one they prefer without a miss.',
        failNote_es: 'Dimensiona primero los botones "Ordenar en …" de los agregadores — cargan casi todos tus pedidos. 48×48 con padding, y apílalos claramente para que un cliente en un teléfono hambriento a las 9pm pueda tocar el que prefiera sin fallo.'
      },
      'catering-only': {
        impact: 'Catering-only sites convert through two buttons: "Request a Quote" (or "Book Your Event") and a tappable phone. Everything else on the site supports those two. A missed tap on the quote form — especially on a phone from a corporate event planner with 15 caterers in tabs — is a direct loss of a $2,000-$15,000 booking.',
        impact_es: 'Los sitios de catering convierten con dos botones: "Solicitar Cotización" (o "Reserva tu Evento") y un teléfono tocable. Todo lo demás apoya a esos dos. Un tap fallido en el formulario de cotización — especialmente en el teléfono de un planificador corporativo con 15 caterings en pestañas — es la pérdida directa de una reserva de $2,000-$15,000.',
        failNote: '"Request a Quote" and the tappable phone are the two highest-value buttons on the site. Both need 48×48 targets and enough padding to thumb-tap cleanly. Everything else (gallery, testimonials, package links) can be smaller.',
        failNote_es: '"Solicitar Cotización" y el teléfono tocable son los dos botones de mayor valor. Ambos necesitan áreas de 48×48 y suficiente padding para tocarse limpio con el pulgar. Todo lo demás (galería, testimonios, enlaces de paquetes) puede ser más pequeño.'
      },
      'bar-pub': {
        impact: 'Bar traffic is often late-night and last-minute — "is happy hour still on?", "are they open?", "is there a cover?" A tappable phone and a tappable map are the two buttons that earn their space.',
        impact_es: 'El tráfico de bar suele ser de última hora y de noche — "¿sigue el happy hour?", "¿están abiertos?", "¿hay cover?" Un teléfono tocable y un mapa tocable son los dos botones que ganan su espacio.',
        failNote: 'Buttons under 44×44 pixels cause misses. On a bar site the phone number and map links are what visitors actually tap — make sure those in particular have 12px+ padding and aren\'t crowded by other links.',
        failNote_es: 'Los botones menores a 44×44 píxeles provocan fallos. En un sitio de bar, el número de teléfono y los enlaces de mapa son lo que los visitantes realmente tocan — asegúrate de que esos en particular tengan 12 px+ de padding y no estén apretados por otros enlaces.'
      }
    }
  },
  {
    type: 'audit',
    audit: 'color-contrast',
    weight: 1.0,
    anchor: '#wcag-contrast',
    effort: 'dev',
    minutes: 15,
    impact: "Roughly 1 in 4 adults over 40 has some form of age-related vision difficulty. If your menu text fails contrast, you're leaving money on the table from the exact demographic that dines out most.",
    impact_es: 'Cerca de 1 de cada 4 adultos mayores de 40 años tiene algún tipo de dificultad visual. Si tu menú falla en contraste, estás dejando dinero en la mesa — justo del grupo demográfico que más sale a comer.',
    pass: 'Your menu text is readable for everyone',
    pass_es: 'El texto de tu menú es legible para todos',
    passNote: 'A 55-year-old standing in bright sunlight can read your menu descriptions. That is the actual bar for a mobile restaurant menu — and you meet it.',
    passNote_es: 'Una persona de 55 años bajo el sol puede leer las descripciones de tu menú. Esa es la verdadera vara para un menú móvil de restaurante — y la cumples.',
    fail: 'Some of your text is hard to read',
    fail_es: 'Parte de tu texto es difícil de leer',
    failNote: 'Light gray on cream or dark-on-dark is invisible to anyone over 40 or anyone standing outside in the sun. Most of your weekday lunch crowd is one of those people. Darken your body text or lift the background — aim for at least the WCAG AA contrast ratio (4.5:1 for normal text).',
    failNote_es: 'Gris claro sobre crema o oscuro sobre oscuro es invisible para cualquier persona mayor de 40 o para alguien parado al sol. La mayoría del público de almuerzo entre semana es una de esas personas. Oscurece el texto del cuerpo o aclara el fondo — apunta al menos al contraste WCAG AA (4.5:1 para texto normal).',
    unverified: "We couldn't check your menu text contrast",
    unverified_es: 'No pudimos comprobar el contraste del texto de tu menú',
    unverifiedNote: "Lighthouse couldn't evaluate color contrast on this run. Re-audit in a few seconds and this usually resolves.",
    unverifiedNote_es: 'Lighthouse no pudo evaluar el contraste de color en esta ejecución. Vuelve a auditar en unos segundos y normalmente se resuelve.',
    byType: {
      'fine-dining': {
        impact: 'Fine-dining menus live and die on careful description — a 55-year-old guest skimming the tasting-menu copy on their phone in a taxi needs every word to be legible. Thin serifs on cream backgrounds are a common culprit.',
        impact_es: 'Los menús de fine-dining viven o mueren por la descripción cuidadosa — un comensal de 55 años ojeando el texto del menú degustación en su teléfono dentro de un taxi necesita cada palabra legible. Las serifas delgadas sobre fondos crema son el culpable común.',
        passNote: 'Your tasting-menu and wine-list copy meets contrast thresholds — readable without squinting, even for the demographic that actually fills your dining room.',
        passNote_es: 'Tu texto del menú degustación y carta de vinos cumple los umbrales de contraste — legible sin entrecerrar los ojos, incluso para el grupo demográfico que realmente llena tu comedor.',
        failNote: 'Fine-dining menu aesthetics frequently use thin grey serifs on cream or dark-on-dark cards — elegant on-screen, unreadable on a phone. Darken body text to meet WCAG AA (4.5:1 ratio), especially menu descriptions and wine notes.',
        failNote_es: 'La estética de los menús de fine-dining frecuentemente usa serifas grises delgadas sobre crema o cartas oscuro-sobre-oscuro — elegante en pantalla, ilegible en un teléfono. Oscurece el texto del cuerpo a WCAG AA (4.5:1), en especial descripciones y notas de vino.'
      },
      'fast-casual': {
        impact: 'Fast-casual decisions happen in 20 seconds on a phone at lunchtime. Low-contrast item names or prices mean the visitor bounces to an ordering aggregator where the same menu is clearer.',
        impact_es: 'Las decisiones fast-casual pasan en 20 segundos en un teléfono a la hora del almuerzo. Nombres de platos o precios con bajo contraste hacen que el visitante rebote a un agregador donde el mismo menú es más claro.',
        passNote: 'Your item names and prices are readable at a glance — which is what a lunch-break ordering decision actually requires.',
        passNote_es: 'Los nombres de platos y precios se leen de un vistazo — justo lo que una decisión de almuerzo requiere.',
        failNote: 'Menu item names and prices especially need high contrast. Thin grey text over beige backgrounds is the most common fast-casual contrast failure — darken the body text to meet WCAG AA (4.5:1 ratio).',
        failNote_es: 'Los nombres de platos y precios del menú en especial requieren alto contraste. Texto gris delgado sobre beige es el fallo fast-casual más común — oscurece el texto del cuerpo a WCAG AA (4.5:1).'
      },
      'cafe': {
        impact: 'Café customers read your hours, menu, and address more than anything else. Soft-palette café branding often puts those three items in light grey — elegant on a laptop, invisible on a phone in sunlight.',
        impact_es: 'Los clientes de café leen tus horarios, menú y dirección más que cualquier otra cosa. La paleta suave de marca de café suele poner esos tres en gris claro — elegante en laptop, invisible en un teléfono al sol.',
        passNote: 'Hours, items, and address all meet contrast thresholds — readable at a glance, even in direct light.',
        passNote_es: 'Horarios, platos y dirección cumplen los umbrales de contraste — legibles de un vistazo, incluso a plena luz.',
        failNote: 'Hours and address are the most-read text on a café site. Pale grey on cream looks on-brand but fails contrast — darken these two specifically to WCAG AA (4.5:1 ratio).',
        failNote_es: 'Horarios y dirección son el texto más leído en un sitio de café. Gris pálido sobre crema se ve on-brand pero falla en contraste — oscurece estos dos específicamente a WCAG AA (4.5:1).'
      },
      'bakery': {
        impact: 'Bakery menus carry ingredient lists, allergen notes, and custom-order details that customers read CAREFULLY — a guest ordering a wedding cake has to trust every label. Low-contrast allergen copy breaks that trust.',
        impact_es: 'Los menús de panadería cargan listas de ingredientes, notas de alérgenos y detalles de pedidos personalizados que los clientes leen CON CUIDADO — quien pide un pastel de boda tiene que confiar en cada etiqueta. El texto de alérgenos con bajo contraste rompe esa confianza.',
        passNote: 'Your ingredient and allergen copy meets contrast thresholds — readable on a phone by the guest double-checking a custom-cake spec at 11pm the night before.',
        passNote_es: 'Tu texto de ingredientes y alérgenos cumple los umbrales de contraste — legible en un teléfono para el cliente que revisa las especificaciones de un pastel personalizado a las 11pm de la noche anterior.',
        failNote: 'Ingredient and allergen notes are the highest-stakes copy on a bakery site. Pale grey descriptions over cream fail WCAG AA (4.5:1) and spook nervous custom-cake or dietary-restricted customers. This is a trust issue, not just usability.',
        failNote_es: 'Las notas de ingredientes y alérgenos son el texto de más alto riesgo en un sitio de panadería. Descripciones en gris pálido sobre crema fallan WCAG AA (4.5:1) y asustan a clientes nerviosos de pasteles personalizados o con restricciones. Es un tema de confianza, no solo de usabilidad.'
      },
      'pizzeria': {
        impact: 'Pizza sites lean on price grids and toppings lists — both of which fail contrast more than you would expect because the branding is often red-on-red or cream-on-cream. A customer can\'t confidently customize a pie if they can\'t read the pepperoni price or the crust options.',
        impact_es: 'Los sitios de pizza se apoyan en tablas de precios y listas de ingredientes — ambas fallan contraste más de lo esperado porque la marca suele ser rojo-sobre-rojo o crema-sobre-crema. Un cliente no puede personalizar una pizza con confianza si no puede leer el precio del pepperoni o las opciones de masa.',
        passNote: 'Topping prices, crust options, and combo pricing all meet contrast thresholds — customers can customize a pie on a phone without squinting.',
        passNote_es: 'Precios de ingredientes, opciones de masa y precios de combos cumplen los umbrales de contraste — los clientes pueden personalizar una pizza en el teléfono sin entrecerrar los ojos.',
        failNote: 'Price grids and topping lists are the conversion surface for a pizzeria. Low-contrast cream-on-cream or red-on-red pricing fails WCAG AA (4.5:1) — darken prices and topping labels until they read cleanly on a phone outside.',
        failNote_es: 'Las tablas de precios y listas de ingredientes son la superficie de conversión de una pizzería. Precios en crema-sobre-crema o rojo-sobre-rojo fallan WCAG AA (4.5:1) — oscurece precios y etiquetas de ingredientes hasta que se lean limpio en un teléfono al aire libre.'
      },
      'food-truck': {
        impact: 'Food-truck sites are read OUTSIDE, in bright sun, on phones held at arm\'s length. Low-contrast copy fails instantly in that environment — and schedule + menu are the two things customers are squinting at while deciding whether to walk over.',
        impact_es: 'Los sitios de food truck se leen AFUERA, bajo sol brillante, en teléfonos sostenidos a distancia del brazo. El texto de bajo contraste falla al instante en ese entorno — y horario + menú son las dos cosas que los clientes están entrecerrando los ojos mientras deciden si caminar hasta allá.',
        passNote: 'Your schedule and menu copy meets contrast thresholds — readable at a farmers\' market in bright sun without cupping the screen.',
        passNote_es: 'Tu texto de horario y menú cumple los umbrales de contraste — legible en un mercado de agricultores bajo sol brillante sin tener que tapar la pantalla con la mano.',
        failNote: 'Outdoor readability is the bar for a food-truck site. Pale brand colors that look great on Instagram fail WCAG AA (4.5:1) in direct sun — darken your schedule + menu text until they read cleanly at arm\'s length in daylight.',
        failNote_es: 'La legibilidad al aire libre es la vara de un sitio de food truck. Colores de marca pálidos que se ven perfectos en Instagram fallan WCAG AA (4.5:1) al sol directo — oscurece el texto de horario + menú hasta que se lea limpio a la distancia del brazo a plena luz.'
      },
      'ghost-kitchen': {
        impact: 'Ghost-kitchen branding leans heavy on moody photography and low-contrast type — which photographs beautifully and converts terribly. Customers scanning delivery-hours and menu-brand details on a phone at 9pm need copy that reads without effort.',
        impact_es: 'La marca de cocina fantasma se apoya mucho en fotografía ambiental y tipografía de bajo contraste — que fotografía bellamente y convierte terriblemente. Los clientes revisando horarios de delivery y detalles de marca en un teléfono a las 9pm necesitan texto que se lea sin esfuerzo.',
        passNote: 'Hours, brand names, and menu descriptions all meet contrast thresholds — a hungry customer can confirm "yes this is a real restaurant" without squinting.',
        passNote_es: 'Horarios, nombres de marca y descripciones de menú cumplen los umbrales de contraste — un cliente hambriento puede confirmar "sí, es un restaurante real" sin entrecerrar los ojos.',
        failNote: 'Ghost-kitchen moody-photography branding often fails WCAG AA (4.5:1) — pale type over dark hero images is the most common offender. Darken body text and especially the hours/brand names; these are the copy customers actually read before tapping through to a delivery app.',
        failNote_es: 'La marca ambiental de cocina fantasma falla frecuentemente WCAG AA (4.5:1) — texto pálido sobre imágenes hero oscuras es el error más común. Oscurece el texto del cuerpo y sobre todo los horarios/nombres de marca; son el texto que los clientes realmente leen antes de abrir la app de delivery.'
      },
      'catering-only': {
        impact: 'Catering sites carry package descriptions, price-per-head tables, dietary-accommodation notes, and lead-time policies — all of which an event planner reads CAREFULLY before requesting a quote. Low-contrast pricing copy breaks trust precisely when a professional buyer is comparing three caterers side by side.',
        impact_es: 'Los sitios de catering cargan descripciones de paquetes, tablas de precio por persona, notas de acomodaciones dietéticas y políticas de tiempo de anticipación — todo lo que un planificador lee CON CUIDADO antes de pedir una cotización. El texto de precios con bajo contraste rompe la confianza justo cuando un comprador profesional compara tres caterings lado a lado.',
        passNote: 'Package prices, head-count math, and dietary-accommodation copy all meet contrast thresholds — readable at-a-glance on the phone of a planner juggling several vendors.',
        passNote_es: 'Precios de paquetes, cálculos por cabeza y texto de acomodaciones dietéticas cumplen los umbrales de contraste — legibles de un vistazo en el teléfono de un planificador manejando varios vendedores.',
        failNote: 'Event planners comparing caterers don\'t squint — they bounce. Pale grey on cream for package descriptions and price tables fails WCAG AA (4.5:1). Darken body text, especially anywhere you list per-head pricing or minimum-headcount rules.',
        failNote_es: 'Los planificadores comparando caterings no entrecierran los ojos — rebotan. Gris pálido sobre crema para descripciones de paquetes y tablas de precios falla WCAG AA (4.5:1). Oscurece el texto del cuerpo, en especial donde listes precios por cabeza o reglas de número mínimo de personas.'
      },
      'bar-pub': {
        impact: 'Bar sites are often dark-themed by default, and legibility takes a hit. Guests checking happy-hour times or the cocktail list on a phone at the curb outside shouldn\'t have to squint.',
        impact_es: 'Los sitios de bar son frecuentemente de tema oscuro por default, y la legibilidad sufre. Los clientes revisando horarios de happy hour o la lista de cócteles en un teléfono en la banqueta afuera no deberían tener que entrecerrar los ojos.',
        passNote: 'Your dark-theme copy still meets WCAG AA contrast ratios — happy-hour hours and the cocktail list are readable without zooming.',
        passNote_es: 'Tu texto de tema oscuro aún cumple los contrastes WCAG AA — horarios de happy hour y lista de cócteles se leen sin zoom.',
        failNote: 'Dark-theme bar sites fail contrast most often on mid-grey text over black. Lift your body-text brightness (or shift to near-white) until it meets WCAG AA (4.5:1 ratio) — especially for hours, happy-hour times, and the cocktail list.',
        failNote_es: 'Los sitios de bar de tema oscuro fallan contraste más frecuentemente en texto gris medio sobre negro. Sube el brillo del texto del cuerpo (o desplázalo a casi blanco) hasta cumplir WCAG AA (4.5:1) — sobre todo para horarios, happy hour y la lista de cócteles.'
      }
    }
  },
  {
    type: 'audit',
    audit: 'font-size',
    weight: 1.0,
    anchor: '#body-text-size',
    effort: 'dev',
    minutes: 10,
    impact: "Text below 16px forces iOS to zoom on focus and frustrates every mobile reader. Menu descriptions that look fine on a laptop are often unreadable on a phone at arm's length.",
    impact_es: 'Texto menor a 16 px obliga a iOS a hacer zoom al enfocar y frustra a cualquier lector móvil. Descripciones de menú que se ven bien en laptop suelen ser ilegibles en un teléfono a la distancia del brazo.',
    pass: 'Your text is legible without pinch-zooming',
    pass_es: 'Tu texto se lee sin hacer zoom con los dedos',
    passNote: 'Your body text is above the mobile readability threshold — visitors do not have to pinch-zoom to read the menu.',
    passNote_es: 'El texto de tu cuerpo supera el umbral de legibilidad móvil — los visitantes no tienen que hacer zoom con los dedos para leer el menú.',
    fail: 'Your text is too small on a phone',
    fail_es: 'Tu texto es muy pequeño en un teléfono',
    failNote: 'More than 40% of your text is below the legibility threshold. Visitors give up before finding their entree. Set body font-size to at least 16px — for menu descriptions and anything a hungry customer actually has to read, 17 or 18 px is better.',
    failNote_es: 'Más del 40% de tu texto está por debajo del umbral de legibilidad. Los visitantes se rinden antes de encontrar el plato principal. Configura el tamaño de fuente del cuerpo a por lo menos 16 px — para descripciones de menú y cualquier cosa que un cliente hambriento deba leer, 17 o 18 px es mejor.',
    unverified: "We couldn't check your text size",
    unverified_es: 'No pudimos comprobar el tamaño de tu texto',
    unverifiedNote: "Lighthouse couldn't evaluate font sizes on this run. Re-audit in a few seconds and this usually resolves.",
    unverifiedNote_es: 'Lighthouse no pudo evaluar los tamaños de fuente en esta ejecución. Vuelve a auditar en unos segundos y normalmente se resuelve.',
    byType: {
      'fine-dining': {
        impact: 'Tasting-menu descriptions, wine-list notes, and chef\'s-counter blurbs are the highest-value text on your site. Set too small, they force a pinch-zoom that breaks the whole luxe experience.',
        impact_es: 'Descripciones del menú degustación, notas de la carta de vinos y textos de chef\'s counter son el texto de mayor valor en tu sitio. Si los haces muy pequeños, fuerzan un zoom con los dedos que rompe toda la experiencia premium.',
        failNote: 'Set body font-size to at least 16px. For the tasting menu and wine list specifically, 17 or 18px is the floor — those blocks of descriptive copy are what convinces a guest to book.',
        failNote_es: 'Configura el tamaño de fuente del cuerpo a por lo menos 16 px. Para el menú degustación y la carta de vinos en particular, 17 o 18 px es el mínimo — esos bloques descriptivos son lo que convence al comensal de reservar.'
      },
      'fast-casual': {
        impact: 'Customers scan your menu on a phone mid-walk. Small item names and prices turn a 10-second decision into a 30-second squint — and they close the tab and reopen DoorDash.',
        impact_es: 'Los clientes ojean tu menú en el teléfono mientras caminan. Nombres y precios pequeños convierten una decisión de 10 segundos en 30 segundos entrecerrando los ojos — y cierran la pestaña y vuelven a abrir DoorDash.',
        failNote: 'Set body font-size to at least 16px. Item names and prices specifically should be 17 or 18px — the menu is your conversion page.',
        failNote_es: 'Configura el tamaño de fuente del cuerpo a por lo menos 16 px. Nombres de platos y precios en particular deberían ser 17 o 18 px — el menú es tu página de conversión.'
      },
      'cafe': {
        impact: 'Hours and location are read more than anything else on a café site. Tiny type below 16px forces iOS to zoom on focus and makes "are they open?" a frustrating question.',
        impact_es: 'Horarios y ubicación se leen más que cualquier cosa en un sitio de café. Texto diminuto bajo 16 px obliga a iOS a hacer zoom al enfocar y convierte "¿están abiertos?" en una pregunta frustrante.',
        failNote: 'Set body font-size to at least 16px. The hours block specifically should be 17 or 18px — it\'s the first thing most café visitors look for.',
        failNote_es: 'Configura el tamaño de fuente del cuerpo a por lo menos 16 px. El bloque de horarios en particular debería ser 17 o 18 px — es lo primero que busca la mayoría de los visitantes de un café.'
      },
      'bakery': {
        impact: 'Ingredient lists, custom-order spec fields, and pickup-date copy are the three things a bakery customer reads MOST carefully. Tiny type forces a pinch-zoom on exactly the moments that require precision.',
        impact_es: 'Las listas de ingredientes, campos de especificaciones de pedidos personalizados y texto de fecha de recogida son las tres cosas que un cliente de panadería lee CON MÁS cuidado. Texto diminuto fuerza un zoom con los dedos justo en los momentos que requieren precisión.',
        failNote: 'Set body to 16px, and set ingredient lists plus custom-order copy to 17-18px. Customers placing $200+ orders for a specific date want zero ambiguity about what they\'re ordering.',
        failNote_es: 'Configura el cuerpo a 16 px, y las listas de ingredientes más el texto de pedidos personalizados a 17-18 px. Los clientes haciendo pedidos de $200+ para una fecha específica quieren cero ambigüedad sobre lo que están ordenando.'
      },
      'pizzeria': {
        impact: 'Topping lists, allergen notes (gluten / dairy / dairy-free cheese), and delivery-zone details are the make-or-break copy for a pizzeria. Tiny type forces a pinch-zoom on the exact moments a customer is deciding between ordering from you or opening Slice.',
        impact_es: 'Las listas de ingredientes, notas de alérgenos (gluten / lácteos / queso sin lácteos) y detalles de zona de entrega son el texto decisivo para una pizzería. Texto diminuto obliga a hacer zoom con los dedos justo cuando un cliente decide entre pedirte a ti o abrir Slice.',
        failNote: 'Set body to 16px, and set topping lists and delivery-zone copy to 17-18px. The customer picking between "one large pepperoni" and "half-pepperoni half-mushroom" should never have to zoom.',
        failNote_es: 'Configura el cuerpo a 16 px, y las listas de ingredientes y texto de zona de entrega a 17-18 px. El cliente eligiendo entre "una grande de pepperoni" y "mitad pepperoni mitad champiñones" nunca debería tener que hacer zoom.'
      },
      'food-truck': {
        impact: 'Schedule times and today\'s-location copy are the two pieces of content a food-truck customer reads MOST — usually on a phone, outdoors, while walking. Tiny type makes "are they at the brewery tonight?" a harder question than it needs to be.',
        impact_es: 'Horarios y texto de ubicación de hoy son los dos contenidos que un cliente de food truck lee MÁS — normalmente en un teléfono, al aire libre, caminando. Texto diminuto convierte "¿están en la cervecería esta noche?" en una pregunta más difícil de lo necesario.',
        failNote: 'Set body to 16px, and set schedule times and today\'s-location copy to 17-18px. Both belong in a block large enough to read at a glance while walking.',
        failNote_es: 'Configura el cuerpo a 16 px, y los horarios y texto de ubicación del día a 17-18 px. Ambos deben ir en un bloque lo bastante grande para leerse de un vistazo mientras caminas.'
      },
      'ghost-kitchen': {
        impact: 'Delivery hours, service area, and menu descriptions are the text customers actually read — and for ghost kitchens that text lives in competition with a lot of visual branding. Sub-16px type forces pinch-zooms on the exact decisions ("are they delivering now? to my zip?") that cost you the order.',
        impact_es: 'Horarios de delivery, área de servicio y descripciones de menú son el texto que los clientes realmente leen — y para las cocinas fantasma ese texto compite con mucho branding visual. Texto bajo 16 px fuerza zoom con los dedos justo en las decisiones ("¿están entregando ahora? ¿a mi código postal?") que te cuestan el pedido.',
        failNote: 'Set body to 16px, and put delivery-hours + service-area copy at 17-18px. These are the two paragraphs that decide whether the customer taps over to DoorDash at all.',
        failNote_es: 'Configura el cuerpo a 16 px, y pon el texto de horarios de delivery + área de servicio a 17-18 px. Estos son los dos párrafos que deciden si el cliente siquiera toca para ir a DoorDash.'
      },
      'catering-only': {
        impact: 'Package descriptions, per-head pricing tables, dietary-accommodation notes, and lead-time rules are the decision-critical text on a catering site. Tiny type on a phone forces the planner — who is already rushed — to pinch-zoom through your rate card, which is a terrible first impression for a $5,000 booking.',
        impact_es: 'Descripciones de paquetes, tablas de precios por cabeza, notas de acomodaciones dietéticas y reglas de tiempo de anticipación son el texto crítico en un sitio de catering. Texto diminuto en un teléfono obliga al planificador — que ya va apurado — a hacer zoom en tu tabla de tarifas, una pésima primera impresión para una reserva de $5,000.',
        failNote: 'Set body to 16px, and set package descriptions + pricing tables to 17-18px. Corporate planners often read on a phone between meetings — make the rate card scannable without zoom.',
        failNote_es: 'Configura el cuerpo a 16 px, y las descripciones de paquetes + tablas de precios a 17-18 px. Los planificadores corporativos suelen leer en el teléfono entre juntas — haz la tabla de tarifas escaneable sin zoom.'
      },
      'bar-pub': {
        impact: 'Cocktail lists, draft lists, and happy-hour details are the bar\'s menu. Small type on a phone in a dim Uber ride is a usability tax guests won\'t pay.',
        impact_es: 'Lista de cócteles, lista de cervezas de barril y detalles de happy hour son el menú del bar. Texto pequeño en un teléfono dentro de un Uber con poca luz es un impuesto de usabilidad que los clientes no pagarán.',
        failNote: 'Set body font-size to at least 16px. The cocktail/draft list and happy-hour times deserve 17 or 18px — those are the conversion paragraphs for a bar site.',
        failNote_es: 'Configura el tamaño de fuente del cuerpo a por lo menos 16 px. La lista de cócteles/cervezas y los horarios de happy hour merecen 17 o 18 px — esos son los párrafos de conversión en un sitio de bar.'
      }
    }
  },
  {
    type: 'phone',
    weight: 1.5, // real conversion driver for takeout / walk-in
    anchor: '#click-to-call',
    effort: 'self',
    minutes: 2,
    impact: "On mobile, every tap that requires copying and pasting instead of tapping costs you customers. Phone calls are still how most takeout orders and reservation questions reach independent restaurants.",
    impact_es: 'En móvil, cada tap que requiere copiar y pegar en vez de tocar te cuesta clientes. Las llamadas siguen siendo cómo la mayoría de los pedidos para llevar y preguntas de reserva llegan a los restaurantes independientes.',
    pass: 'Visitors can tap your phone number to call',
    pass_es: 'Los visitantes pueden tocar tu número para llamar',
    passNote: 'A tappable phone number is on your page — mobile visitors can call you with one tap, which matters for takeout orders, reservation questions, and "are you still open" calls.',
    passNote_es: 'Hay un número tocable en tu página — los visitantes móviles te pueden llamar con un solo tap, lo que importa para pedidos para llevar, preguntas de reservas y llamadas de "¿aún están abiertos?".',
    passNoteText: 'We found a phone number in your page text, but it is not wrapped in a clickable <code>tel:</code> link. Mobile visitors have to copy the number into their dialer manually instead of tapping to call. Ask your developer to wrap the number in <code>&lt;a href="tel:+1..."&gt;</code>.',
    passNoteText_es: 'Encontramos un número en el texto, pero no está envuelto en un enlace <code>tel:</code> clicable. Los visitantes móviles tienen que copiar el número al marcador manualmente en vez de tocar para llamar. Pídele a tu desarrollador que envuelva el número en <code>&lt;a href="tel:+1..."&gt;</code>.',
    fail: "We couldn't find a phone number on your site",
    fail_es: 'No encontramos un número de teléfono en tu sitio',
    failNote: "No click-to-call link and no visible phone number in the page text. Every restaurant gets calls — about 'are you open now', about table availability, about special requests — and if your site doesn't make calling one tap, you are losing those conversations. Add a phone number to your site and wrap it in a <code>tel:</code> link.",
    failNote_es: 'No hay enlace para llamar con un tap ni número visible en el texto. Todo restaurante recibe llamadas — "¿están abiertos ya?", "¿hay mesa?", peticiones especiales — y si tu sitio no hace que llamar sea un solo tap, estás perdiendo esas conversaciones. Agrega un número y envuélvelo en un enlace <code>tel:</code>.',
    unverified: "We couldn't confirm whether you have a phone number",
    unverified_es: 'No pudimos confirmar si tienes un número de teléfono',
    unverifiedNote: "We only see the parts of your page that Lighthouse surfaces to us — sometimes phone numbers get missed. Check that yours is visible on every page and wrapped in a <code>tel:</code> link so mobile visitors can tap to call.",
    unverifiedNote_es: 'Solo vemos las partes de tu página que Lighthouse nos expone — a veces se pasan los números de teléfono. Verifica que el tuyo sea visible en cada página y esté envuelto en un enlace <code>tel:</code> para que los visitantes móviles toquen y llamen.',
    byType: {
      'fine-dining': {
        impact: 'Guests calling a fine-dining restaurant usually have a high-value question: a special-occasion menu, a large-party booking, a dietary accommodation. A missing phone number or a broken tel: link sends those calls — and reservations — to a competitor.',
        impact_es: 'Los comensales que llaman a un restaurante de fine-dining suelen tener una pregunta de alto valor: un menú de ocasión especial, una reserva de grupo grande, una acomodación dietética. Un número ausente o un enlace tel: roto manda esas llamadas — y reservas — a la competencia.',
        failNote: 'Special-occasion and large-party bookings almost always start with a phone call. Add a phone number and wrap it in a <code>tel:</code> link so the concierge-level conversation can actually happen.',
        failNote_es: 'Las reservas de ocasión especial y grupos grandes casi siempre empiezan con una llamada. Agrega un número y envuélvelo en un enlace <code>tel:</code> para que la conversación a nivel concierge realmente suceda.'
      },
      'fast-casual': {
        impact: 'Fast-casual traffic is mostly online ordering, but a phone number still closes the edge cases: "is there parking?", "do you cater?", "do you have gluten-free?" A tappable number keeps those from becoming a one-star review.',
        impact_es: 'El tráfico fast-casual es mayormente pedidos en línea, pero un número de teléfono aún cierra los casos borde: "¿hay estacionamiento?", "¿hacen catering?", "¿tienen opciones sin gluten?" Un número tocable evita que esos se conviertan en una reseña de una estrella.',
        failNote: 'Even if online ordering drives most of your conversion, add a tappable phone number. Catering, dietary questions, and "is my order ready?" calls all need a one-tap path — and they convert at a much higher rate than form-fills.',
        failNote_es: 'Aunque los pedidos en línea generen la mayoría de tu conversión, agrega un teléfono tocable. Catering, preguntas dietéticas y llamadas de "¿ya está mi orden?" todas necesitan un camino de un solo tap — y convierten a tasas mucho más altas que los formularios.'
      },
      'cafe': {
        impact: 'Café and bakery customers call to check hours, to ask about custom cake orders, and to reserve whole pies or catering trays. A missing phone number is a missing revenue channel — custom-order margins especially.',
        impact_es: 'Los clientes de café y panadería llaman para consultar horarios, preguntar por pasteles personalizados y reservar pays enteros o charolas de catering. Un número ausente es un canal de ingresos ausente — sobre todo márgenes de pedidos personalizados.',
        failNote: 'Custom-order inquiries (birthday cakes, catering trays, wholesale) come in by phone. Add a tappable phone number — a <code>tel:</code> link at the top of every page is the bar for a café or bakery.',
        failNote_es: 'Las consultas de pedidos personalizados (pasteles de cumpleaños, charolas de catering, mayoreo) llegan por teléfono. Agrega un número tocable — un enlace <code>tel:</code> al tope de cada página es la vara para un café o panadería.'
      },
      'bakery': {
        impact: 'Wedding-cake consultations, dietary-restricted special orders, and catering-tray inquiries almost always start with a phone call — these are the margin-rich orders that rarely convert through a web form. A missing tappable phone on a bakery site is a missing revenue channel, full stop.',
        impact_es: 'Las consultas de pasteles de boda, pedidos con restricciones dietéticas y consultas de charolas de catering casi siempre empiezan con una llamada — son los pedidos de alto margen que rara vez convierten por un formulario web. Un teléfono tocable ausente en un sitio de panadería es un canal de ingresos ausente, punto.',
        failNote: 'Custom-cake and catering inquiries come in by phone. Add a tappable phone number at the top of every page — a <code>tel:</code> link beside your "Order Ahead" button is the baseline for any bakery that takes custom work.',
        failNote_es: 'Las consultas de pasteles personalizados y catering llegan por teléfono. Agrega un número tocable al tope de cada página — un enlace <code>tel:</code> al lado de tu botón "Ordenar con Anticipación" es la base para cualquier panadería que acepte trabajo personalizado.'
      },
      'pizzeria': {
        impact: 'Phone orders still account for roughly 40% of US pizzeria revenue — and every one of those orders that a customer has to manually dial is a customer who might give up and open Slice. Delivery ETA questions ("how long?") and last-minute customizations ("can you add jalapeños?") are one-tap conversations.',
        impact_es: 'Los pedidos telefónicos aún representan cerca del 40% de los ingresos de las pizzerías en EE.UU. — y cada uno de esos pedidos que el cliente tiene que marcar manualmente es un cliente que podría rendirse y abrir Slice. Preguntas de ETA de delivery ("¿cuánto tardan?") y personalizaciones de último minuto ("¿pueden agregar jalapeños?") son conversaciones de un solo tap.',
        failNote: 'Phone ordering is table stakes for pizzerias. Add a tappable phone at the top of every page, and keep it visible next to the "Order Online" button — the two channels complement each other, and ~40% of your revenue still comes in by phone.',
        failNote_es: 'El pedido telefónico es el piso mínimo para las pizzerías. Agrega un teléfono tocable al tope de cada página, y mantenlo visible junto al botón "Ordenar en Línea" — los dos canales se complementan, y cerca del 40% de tus ingresos aún entra por teléfono.'
      },
      'food-truck': {
        impact: 'Food-truck operators usually cannot answer phones during service — the person who answers is the person cooking. A tappable phone still matters for catering and private-event inquiries, which are the margin-rich bookings that keep trucks profitable between rushes.',
        impact_es: 'Los operadores de food truck normalmente no pueden contestar teléfonos durante el servicio — quien contesta es quien cocina. Un teléfono tocable aún importa para consultas de catering y eventos privados, las reservas de alto margen que mantienen a los trucks rentables entre rushes.',
        failNote: 'You probably can\'t answer a phone mid-service, and that\'s fine. Still add a tappable phone for catering and private-event leads; those calls are not lunch-rush traffic — they\'re $500-$3000 bookings you want to return after service.',
        failNote_es: 'Probablemente no puedes contestar el teléfono a medio servicio, y está bien. Aun así, agrega un teléfono tocable para leads de catering y eventos privados; esas llamadas no son tráfico de hora pico — son reservas de $500-$3000 que quieres devolver después del servicio.'
      },
      'ghost-kitchen': {
        impact: 'Most ghost kitchens run lean and do not staff a phone — customer-service routes to aggregator support instead. That\'s fine as an operational choice, but customers still try. A tappable phone avoids the "they\'re not a real business" signal when a skeptical customer is deciding whether to order.',
        impact_es: 'La mayoría de las cocinas fantasma operan con personal reducido y no atienden teléfono — el servicio al cliente va al soporte del agregador. Está bien como elección operativa, pero los clientes aún intentan. Un teléfono tocable evita la señal de "no es un negocio real" cuando un cliente escéptico decide si ordenar.',
        failNote: 'Even if you don\'t actively answer, add a tappable phone or at least a quick-response SMS number. Missing it reads as "no real operator behind this brand" to a skeptical customer — a much bigger conversion hit than whatever time you save by hiding the number.',
        failNote_es: 'Aunque no contestes activamente, agrega un teléfono tocable o al menos un número de SMS de respuesta rápida. Su ausencia se lee como "no hay un operador real detrás de esta marca" para un cliente escéptico — un golpe a la conversión mucho más grande que el tiempo que ahorras ocultando el número.'
      },
      'catering-only': {
        impact: 'Phone is the single highest-converting channel for catering. Event planners juggle tight timelines, last-minute head-count changes, and dietary exceptions — all of which are phone conversations, not contact-form conversations. A missing tappable phone on a catering site is a missing business, effectively.',
        impact_es: 'El teléfono es el canal con mayor conversión para catering. Los planificadores de eventos manejan tiempos ajustados, cambios de último minuto en el número de personas y excepciones dietéticas — todo eso son conversaciones telefónicas, no de formulario de contacto. Un teléfono tocable ausente en un sitio de catering es, efectivamente, un negocio ausente.',
        failNote: 'Non-negotiable for catering. A tappable phone at the top of every page — ideally beside "Request a Quote" — is the baseline. Planners booking \$2K+ events will almost always call before submitting a form; giving them a one-tap number closes bookings the form alone would not.',
        failNote_es: 'No negociable para catering. Un teléfono tocable al tope de cada página — idealmente junto a "Solicitar Cotización" — es la base. Los planificadores reservando eventos de $2K+ casi siempre llaman antes de enviar un formulario; darles un número de un solo tap cierra reservas que el formulario solo no cerraría.'
      },
      'bar-pub': {
        impact: 'Bar calls are time-sensitive: "are you open?", "is happy hour still on?", "do I need a reservation tonight?" A missing tap-to-call number means those visitors go to a bar with an easier phone number.',
        impact_es: 'Las llamadas a bares son de tiempo crítico: "¿están abiertos?", "¿sigue el happy hour?", "¿necesito reserva esta noche?" Un número ausente para llamar con un tap significa que esos visitantes van a otro bar con un teléfono más fácil.',
        failNote: 'Non-negotiable for bars. Guests check "is happy hour still running?" on the curb outside. Add a phone number and wrap it in a <code>tel:</code> link so the call is one tap, not a copy-paste flow.',
        failNote_es: 'No negociable para bares. Los clientes preguntan "¿sigue el happy hour?" desde la banqueta. Agrega un número y envuélvelo en un enlace <code>tel:</code> para que la llamada sea un tap, no un flujo de copiar y pegar.'
      }
    }
  },
  {
    type: 'platform',
    platforms: ['maps'],
    weight: 1.0,
    anchor: '#click-to-directions',
    effort: 'dev',
    minutes: 15,
    impact: "The path from 'I might check this place out' to 'I am driving there' should be one tap. An embedded map or a Maps link cuts directions friction to zero — plain-text addresses add a whole copy-paste flow before the customer even arrives.",
    impact_es: 'El camino de "quizá vaya a este lugar" a "ya voy en camino" debería ser un solo tap. Un mapa embebido o un enlace a Maps reduce la fricción a cero — una dirección en texto plano agrega un flujo completo de copiar y pegar antes de que el cliente llegue.',
    pass: 'Visitors can get directions with one tap',
    pass_es: 'Los visitantes pueden obtener indicaciones con un tap',
    passNote: '{detected} is on your site — first-time visitors can tap once to get turn-by-turn directions to your door.',
    passNote_es: '{detected} está en tu sitio — los visitantes por primera vez pueden tocar una vez para obtener indicaciones paso a paso hasta tu puerta.',
    fail: null, // never fail this check — absence is always unverified
    failNote: null,
    unverified: "We didn't see a map on your site — is this right?",
    unverified_es: 'No vimos un mapa en tu sitio — ¿es correcto?',
    unverifiedNote: "We scan for Google Maps, Apple Maps, Mapbox, Bing Maps, OpenStreetMap, Waze, and Leaflet. If your site uses one of those, great — we just couldn't find it on this run. If your address is plain text only, consider wrapping it in a Google Maps link so visitors can launch directions in one tap.",
    unverifiedNote_es: 'Buscamos Google Maps, Apple Maps, Mapbox, Bing Maps, OpenStreetMap, Waze y Leaflet. Si tu sitio usa uno de esos, perfecto — simplemente no lo encontramos en esta ejecución. Si tu dirección está solo en texto plano, considera envolverla en un enlace de Google Maps para que los visitantes obtengan indicaciones con un tap.',
    byType: {
      'fine-dining': {
        impact: 'First-time guests heading to a fine-dining reservation want turn-by-turn directions, not a copy-paste address. A tappable map is part of the concierge experience — and it\'s expected.',
        impact_es: 'Los comensales que van por primera vez a una reserva de fine-dining quieren indicaciones paso a paso, no una dirección para copiar y pegar. Un mapa tocable es parte de la experiencia concierge — y se espera.'
      },
      'fast-casual': {
        impact: 'Fast-casual traffic is often "food near me" intent — visitors are already on their phone deciding where to walk or drive. A one-tap map shaves 15 seconds off the decision and keeps them from comparison-shopping another block over.',
        impact_es: 'El tráfico fast-casual suele ser intención de "comida cerca de mí" — los visitantes ya están en su teléfono decidiendo a dónde caminar o manejar. Un mapa de un solo tap recorta 15 segundos de la decisión y evita que comparen con otro lugar una cuadra más allá.'
      },
      'cafe': {
        impact: 'Café and bakery traffic is overwhelmingly local and walk-in driven. A one-tap directions link (especially for the pickup address on a catering or custom order) removes the "wait, where is this place again?" moment.',
        impact_es: 'El tráfico de café y panadería es mayormente local y basado en walk-ins. Un enlace de indicaciones de un tap (especialmente para la dirección de recogida en un pedido de catering o personalizado) elimina el momento "espera, ¿dónde quedaba este lugar?".'
      },
      'bakery': {
        impact: 'Morning bakery traffic is time-critical — a commuter grabbing croissants at 7:30am does not have time to fumble with a typed address. A one-tap directions link keeps the pickup rush on schedule, and matters double for wholesale or catering customers driving to a pickup address they have never visited.',
        impact_es: 'El tráfico matutino de panadería es de tiempo crítico — un trabajador que pasa por croissants a las 7:30am no tiene tiempo para lidiar con una dirección escrita. Un enlace de indicaciones de un tap mantiene la hora pico de recogida en tiempo, e importa el doble para clientes de mayoreo o catering manejando a una dirección de recogida que nunca han visitado.'
      },
      'pizzeria': {
        impact: 'For pizzerias the primary use of a map is communicating DELIVERY ZONE, not just the storefront address. A one-tap Google Maps pin is the bare minimum; a proper delivery-radius overlay (or at least a list of served neighborhoods) saves you from the "do you deliver to me?" phone calls that your phone staff are answering instead of taking orders.',
        impact_es: 'Para pizzerías, el uso principal de un mapa es comunicar la ZONA DE ENTREGA, no solo la dirección del local. Un pin de Google Maps de un tap es el mínimo; un overlay de radio de entrega apropiado (o al menos una lista de colonias servidas) te ahorra las llamadas de "¿entregan aquí?" que tu personal de teléfono responde en vez de tomar pedidos.'
      },
      'food-truck': {
        impact: 'Food trucks MOVE, which inverts the usual map-check logic: a static storefront pin is the wrong answer. What customers need is a one-tap map OF TODAY\'S LOCATION (usually a dynamic field on a schedule page), plus a link to your Instagram or Twitter where you post real-time changes. A stale "home address" map is worse than no map at all.',
        impact_es: 'Los food trucks se MUEVEN, lo que invierte la lógica usual: un pin estático del local es la respuesta equivocada. Lo que los clientes necesitan es un mapa de un tap de la UBICACIÓN DE HOY (normalmente un campo dinámico en una página de horario), más un enlace a tu Instagram o Twitter donde publicas cambios en tiempo real. Un mapa desactualizado de "dirección base" es peor que ningún mapa.'
      },
      'ghost-kitchen': {
        impact: 'Customers never visit a ghost kitchen — what they care about is the DELIVERY ZONE (ZIP codes or neighborhoods you serve). A standard Google Maps pin helps with nothing; what you need is a clear "we deliver to …" list or a delivery-radius visualization. Aggregator pages already handle address validation, but seeing the zone up front saves the bounce for out-of-range visitors.',
        impact_es: 'Los clientes nunca visitan una cocina fantasma — lo que les importa es la ZONA DE ENTREGA (códigos postales o colonias que atiendes). Un pin estándar de Google Maps no ayuda en nada; lo que necesitas es una lista clara de "entregamos en …" o una visualización del radio de entrega. Las páginas de los agregadores ya validan direcciones, pero ver la zona al frente te ahorra el rebote de visitantes fuera de zona.'
      },
      'catering-only': {
        impact: 'Maps on a catering site are about SERVICE AREA, not storefront. A clear service-radius map (or a written list of cities/counties served) lets an event planner self-qualify before investing in a quote request. It also handles the "do you travel to us?" question that otherwise eats the first 30 seconds of every intake call.',
        impact_es: 'Los mapas en un sitio de catering son sobre ÁREA DE SERVICIO, no local. Un mapa claro de radio de servicio (o una lista escrita de ciudades/condados servidos) permite al planificador auto-calificarse antes de invertir en una solicitud de cotización. También resuelve la pregunta "¿viajan hasta nosotros?" que de otra forma consume los primeros 30 segundos de cada llamada de intake.'
      },
      'bar-pub': {
        impact: 'Bar hopping happens on the phone. A tappable map — especially for a bar tucked down a side street or into a basement — can be the difference between a visitor finding you or ending up at whichever place Google Maps surfaces first.',
        impact_es: 'El bar hopping pasa en el teléfono. Un mapa tocable — sobre todo para un bar escondido en una calle lateral o en un sótano — puede ser la diferencia entre un visitante que te encuentra o que termina en cualquier lugar que Google Maps muestre primero.'
      }
    }
  },
  {
    type: 'conversions',
    // Either counts: takeout-only spots only need ordering;
    // fine-dining only needs reservations; many restaurants have both.
    platforms: ['ordering', 'reservations'],
    weight: 1.5, // the single biggest direct-conversion lever
    anchor: '#cta',
    effort: 'dev',
    minutes: 60,
    impact: "This is the single biggest direct-conversion lever on a restaurant website. Every reservation taken on your own site (instead of OpenTable) keeps the full booking. Every order through your own Toast or Square checkout (instead of DoorDash) keeps the full margin.",
    impact_es: 'Esta es la palanca de conversión directa más grande de un sitio de restaurante. Cada reserva tomada en tu propio sitio (en vez de OpenTable) se queda completa. Cada pedido por tu propio checkout de Toast o Square (en vez de DoorDash) mantiene el margen completo.',
    pass: 'Visitors can order or book a table online',
    pass_es: 'Los visitantes pueden ordenar o reservar mesa en línea',
    passNote: '{detected} on your site — direct online conversions keep commission-hungry marketplaces out of your margins.',
    passNote_es: '{detected} en tu sitio — las conversiones directas en línea mantienen fuera de tu margen a los marketplaces que cobran comisiones.',
    passNoteText: "We found text that strongly suggests self-hosted ordering or reservations on your site (something like 'ORDER ONLINE' or 'RESERVE A TABLE'). We couldn't tie it to a specific platform we recognize, but the signal is there.",
    passNoteText_es: 'Encontramos texto que sugiere fuertemente pedidos o reservas propias en tu sitio (algo como "ORDENA EN LÍNEA" o "RESERVA UNA MESA"). No pudimos vincularlo a una plataforma que reconozcamos, pero la señal está ahí.',
    fail: null, // never fail — a restaurant might legitimately only take walk-ins
    failNote: null,
    unverified: "We couldn't detect online ordering or reservations — is this right?",
    unverified_es: 'No pudimos detectar pedidos ni reservas en línea — ¿es correcto?',
    unverifiedNote: "We scan for 100+ major ordering and reservation platforms, including Toast, Square, ChowNow, OpenTable, Resy, Tock, BentoBox, Popmenu, SevenRooms, TheFork, Deliveroo, and dozens more. If you use one of those and we missed it, tell us below and we will add it to the scanner. If you take orders or bookings over the phone only, that is a legitimate choice — just mark it so.",
    unverifiedNote_es: 'Buscamos 100+ plataformas de pedidos y reservas, incluyendo Toast, Square, ChowNow, OpenTable, Resy, Tock, BentoBox, Popmenu, SevenRooms, TheFork, Deliveroo y docenas más. Si usas una de esas y la pasamos por alto, avísanos abajo y la agregamos al escáner. Si solo tomas pedidos o reservas por teléfono, es una elección legítima — solo márcalo así.',
    byType: {
      'fine-dining': {
        impact: 'Reservations are the entire business model for fine dining. Every booking taken on your site (via Resy, Tock, SevenRooms, or an embedded widget) keeps the relationship — and the deposit, for prix-fixe reservations — instead of sending it through OpenTable.',
        impact_es: 'Las reservas son el modelo de negocio completo del fine-dining. Cada reserva tomada en tu sitio (vía Resy, Tock, SevenRooms o un widget embebido) conserva la relación — y el depósito, para reservas de menú prix-fixe — en vez de enviarla por OpenTable.',
        pass: 'Guests can reserve a table online',
        pass_es: 'Los comensales pueden reservar mesa en línea',
        passNote: '{detected} on your site — guests can book directly, and you keep the relationship (and any deposit) instead of paying per-cover fees to a marketplace.',
        passNote_es: '{detected} en tu sitio — los comensales pueden reservar directamente, y conservas la relación (y cualquier depósito) en vez de pagar cuotas por cubierto a un marketplace.',
        passNoteText: "We found text that suggests self-hosted reservations ('RESERVE A TABLE', 'Book Your Seat') but couldn't match it to a specific platform.",
        passNoteText_es: 'Encontramos texto que sugiere reservas propias ("RESERVA UNA MESA", "Reserva tu Lugar") pero no pudimos vincularlo a una plataforma específica.',
        unverified: "We couldn't detect online reservations — is this right?",
        unverified_es: 'No pudimos detectar reservas en línea — ¿es correcto?',
        unverifiedNote: "We scan for reservation platforms including Resy, Tock, SevenRooms, OpenTable, Yelp Reservations, TheFork, and more. Fine-dining restaurants that don\'t take online reservations are leaving money on the table — every phone-only booking is a guest who might not bother.",
        unverifiedNote_es: 'Buscamos plataformas de reservas incluyendo Resy, Tock, SevenRooms, OpenTable, Yelp Reservations, TheFork y más. Los restaurantes de fine-dining que no toman reservas en línea están dejando dinero en la mesa — cada reserva solo-teléfono es un comensal que podría no molestarse.'
      },
      'casual-dining': {
        impact: 'Casual dining lives in both worlds — reservations for dinner rushes, online ordering for takeout and delivery. Missing either one sends revenue to OpenTable, DoorDash, or a competitor that has both.',
        impact_es: 'El casual dining vive en ambos mundos — reservas para las horas pico de cena, pedidos en línea para llevar y delivery. Que falte cualquiera de los dos manda ingresos a OpenTable, DoorDash o a un competidor que tenga ambos.',
        pass: 'Guests can reserve or order online',
        pass_es: 'Los comensales pueden reservar u ordenar en línea',
        passNote: '{detected} on your site — guests can book a table or place a takeout order directly, which is the pattern that wins for casual-dining restaurants.',
        passNote_es: '{detected} en tu sitio — los comensales pueden reservar mesa o hacer un pedido para llevar directamente, el patrón ganador para restaurantes casual-dining.'
      },
      'fast-casual': {
        impact: 'Online ordering IS the business model for fast-casual. Every order through your own Toast or ChowNow checkout keeps the 30% DoorDash commission in your pocket. A site without direct ordering is a site that hands margin to marketplaces every day.',
        impact_es: 'Los pedidos en línea SON el modelo de negocio del fast-casual. Cada pedido por tu propio checkout de Toast o ChowNow mantiene el 30% de comisión de DoorDash en tu bolsillo. Un sitio sin pedidos directos es un sitio que entrega margen a los marketplaces todos los días.',
        pass: 'Customers can order online',
        pass_es: 'Los clientes pueden ordenar en línea',
        passNote: '{detected} on your site — direct orders keep the full margin, and you own the customer data.',
        passNote_es: '{detected} en tu sitio — los pedidos directos mantienen el margen completo, y tú eres dueño de los datos del cliente.',
        passNoteText: "We found text that suggests self-hosted ordering ('ORDER ONLINE', 'Order for Pickup') but couldn't match it to a specific platform.",
        passNoteText_es: 'Encontramos texto que sugiere pedidos propios ("ORDENA EN LÍNEA", "Pedido para Pickup") pero no pudimos vincularlo a una plataforma específica.',
        unverified: "We couldn't detect online ordering — is this right?",
        unverified_es: 'No pudimos detectar pedidos en línea — ¿es correcto?',
        unverifiedNote: "We scan for ordering platforms including Toast, Square, ChowNow, BentoBox, Olo, Lunchbox, Slice, Menufy, and dozens more. Fast-casual restaurants without direct online ordering are sending 20–30% of every order to DoorDash/Grubhub as commission.",
        unverifiedNote_es: 'Buscamos plataformas de pedidos incluyendo Toast, Square, ChowNow, BentoBox, Olo, Lunchbox, Slice, Menufy y docenas más. Los restaurantes fast-casual sin pedidos directos en línea están mandando 20-30% de cada pedido a DoorDash/Grubhub como comisión.'
      },
      'cafe': {
        impact: 'Direct online ordering matters even for small cafés — pre-orders for commuters, whole-cake orders for birthdays, catering trays for offices. Square and Toast make this table stakes; a site without ordering sends those conversions through Grubhub.',
        impact_es: 'Los pedidos directos en línea importan incluso para cafés pequeños — pre-pedidos para trabajadores, pedidos de pasteles enteros para cumpleaños, charolas de catering para oficinas. Square y Toast hacen esto el piso mínimo; un sitio sin pedidos manda esas conversiones por Grubhub.',
        pass: 'Customers can order online',
        pass_es: 'Los clientes pueden ordenar en línea',
        passNote: '{detected} on your site — commuter pre-orders, custom-cake inquiries, and catering tray orders all flow to you directly instead of a commissioned aggregator.',
        passNote_es: '{detected} en tu sitio — pre-pedidos de trabajadores, consultas de pasteles personalizados y pedidos de charolas de catering todos fluyen a ti directamente en vez de a un agregador con comisiones.',
        unverifiedNote: "We scan for café-friendly platforms like Square, Toast, ChowNow, and more. Even a simple online-order page for pre-orders, custom cakes, or catering is a meaningful revenue channel for cafés and bakeries.",
        unverifiedNote_es: 'Buscamos plataformas amigables para cafés como Square, Toast, ChowNow y más. Incluso una página simple de pedidos en línea para pre-pedidos, pasteles personalizados o catering es un canal de ingresos significativo para cafés y panaderías.'
      },
      'bakery': {
        impact: 'Online pre-orders ARE the business model for modern bakeries — customers who cannot pre-order online end up ordering through Instagram DMs or giving up. Custom-cake inquiry forms, wedding-cake intake, and whole-pie pre-orders all belong on your site directly, where the margin stays with you.',
        impact_es: 'Los pre-pedidos en línea SON el modelo de negocio de las panaderías modernas — los clientes que no pueden pre-ordenar terminan pidiendo por DMs de Instagram o rindiéndose. Formularios de consulta de pasteles personalizados, intake de pasteles de boda y pre-pedidos de pays enteros pertenecen en tu sitio directamente, donde el margen se queda contigo.',
        pass: 'Customers can pre-order online',
        pass_es: 'Los clientes pueden pre-ordenar en línea',
        passNote: '{detected} on your site — pre-orders, custom-cake inquiries, and whole-pie bookings all flow to you directly instead of becoming DMs your staff has to answer by hand.',
        passNote_es: '{detected} en tu sitio — pre-pedidos, consultas de pasteles personalizados y reservas de pays enteros fluyen a ti directamente en vez de convertirse en DMs que tu equipo tenga que contestar a mano.',
        unverifiedNote: "We scan for bakery-friendly platforms (Square, Toast) plus generic order-ahead widgets. Even a simple HTML pre-order page for custom cakes or catering is a real revenue channel for bakeries and pâtisseries.",
        unverifiedNote_es: 'Buscamos plataformas amigables para panadería (Square, Toast) más widgets genéricos de pedidos por adelantado. Incluso una página HTML simple de pre-pedidos para pasteles personalizados o catering es un canal de ingresos real para panaderías y pâtisseries.'
      },
      'pizzeria': {
        impact: 'Online ordering IS the business model for a pizzeria. Every order that flows through Slice, DoorDash, or Grubhub costs you 20-30% commission — on a $25 pie that is $5-7 of margin walking out the door. A direct Toast or ChowNow flow (or even a Slice "direct" storefront) can cut that commission in half, and owning the customer data is worth even more than the commission saved.',
        impact_es: 'Los pedidos en línea SON el modelo de negocio de una pizzería. Cada pedido por Slice, DoorDash o Grubhub te cuesta 20-30% de comisión — en una pizza de $25 son $5-7 de margen saliendo por la puerta. Un flujo directo de Toast o ChowNow (o incluso un Slice "direct") puede recortar esa comisión a la mitad, y ser dueño de los datos del cliente vale aún más que la comisión ahorrada.',
        pass: 'Customers can order delivery / pickup online',
        pass_es: 'Los clientes pueden ordenar delivery / pickup en línea',
        passNote: '{detected} on your site — every direct order keeps 20-30% more margin than a Slice or DoorDash order AND builds a repeat-customer list you own.',
        passNote_es: '{detected} en tu sitio — cada pedido directo mantiene 20-30% más margen que un pedido por Slice o DoorDash Y construye una lista de clientes repetidos que tú posees.',
        passNoteText: "We found 'Order Online' / 'Order Delivery' / 'Start a Pickup Order' copy but could not pin it to a specific platform.",
        passNoteText_es: 'Encontramos texto "Ordenar en Línea" / "Ordenar Delivery" / "Iniciar Pedido Pickup" pero no pudimos vincularlo a una plataforma específica.',
        unverifiedNote: "We scan for pizzeria-heavy platforms including Slice, Toast, ChowNow, Square, Olo, Menufy, and the major aggregators (DoorDash, Grubhub, Uber Eats). If you only take phone orders today, every online order you add is commission-free margin.",
        unverifiedNote_es: 'Buscamos plataformas pizza-pesadas incluyendo Slice, Toast, ChowNow, Square, Olo, Menufy y los principales agregadores (DoorDash, Grubhub, Uber Eats). Si hoy solo tomas pedidos por teléfono, cada pedido en línea que agregues es margen sin comisión.'
      },
      'food-truck': {
        impact: 'Day-of ordering from a food-truck site is less common — most trucks take cash or Venmo at the window. Where online ordering DOES matter is pre-orders for group meetups, catering/private-event inquiries, and merchandise (t-shirts, hot sauces, bean subscriptions). Missing a pre-order or inquiry form sends those leads to Instagram DMs where they get buried.',
        impact_es: 'El pedido del día desde un sitio de food truck es menos común — la mayoría de los trucks toman efectivo o Venmo en la ventana. Donde los pedidos en línea SÍ importan es para pre-pedidos de reuniones grupales, consultas de catering/eventos privados y mercancía (camisetas, salsas picantes, suscripciones de granos). Que falte un formulario de pre-pedido o consulta manda esos leads a DMs de Instagram donde se entierran.',
        pass: 'Customers can pre-order or inquire online',
        pass_es: 'Los clientes pueden pre-ordenar o consultar en línea',
        passNote: '{detected} on your site — group pre-orders and catering inquiries land in a form instead of a DM thread your staff has to untangle.',
        passNote_es: '{detected} en tu sitio — los pre-pedidos grupales y consultas de catering aterrizan en un formulario en vez de un hilo de DMs que tu equipo tenga que desenredar.',
        unverifiedNote: "We scan for food-truck-friendly platforms (Square, Toast) and generic inquiry forms. Day-of ordering is usually not the goal — the high-value flow is a catering/private-event inquiry form, where every submission is a \$500-\$3000 opportunity.",
        unverifiedNote_es: 'Buscamos plataformas amigables para food trucks (Square, Toast) y formularios genéricos de consulta. El pedido del día normalmente no es el objetivo — el flujo de alto valor es un formulario de consulta de catering/eventos privados, donde cada envío es una oportunidad de $500-$3000.'
      },
      'ghost-kitchen': {
        impact: 'Ghost kitchens live or die on aggregator presence — DoorDash, Uber Eats, Grubhub, Caviar, Postmates. Clear links to EVERY aggregator you\'re on are the primary conversion; a direct-order flow on your own site is a nice-to-have (and keeps more margin when it converts), but the aggregator links are what customers actually use.',
        impact_es: 'Las cocinas fantasma viven o mueren por la presencia en agregadores — DoorDash, Uber Eats, Grubhub, Caviar, Postmates. Los enlaces claros a CADA agregador donde estés son la conversión principal; un flujo de pedido directo en tu propio sitio es un bonus (y mantiene más margen cuando convierte), pero los enlaces a los agregadores son los que los clientes realmente usan.',
        pass: 'Customers can order via aggregators / direct',
        pass_es: 'Los clientes pueden ordenar por agregadores / directo',
        passNote: '{detected} on your site — at minimum the aggregator you partner with is one tap from the homepage. A customer scanning your menu lands in an active order funnel, not a dead-end.',
        passNote_es: '{detected} en tu sitio — como mínimo el agregador con el que trabajas está a un tap de la página principal. Un cliente revisando tu menú aterriza en un funnel de pedido activo, no en un callejón sin salida.',
        unverifiedNote: "We scan for every major aggregator (DoorDash, Uber Eats, Grubhub, Postmates, Caviar, Deliveroo, Just Eat, Wolt, etc.) and middleware (Deliverect, Otter). Missing links to your actual aggregators is a conversion cliff — customers assume you\'re not available on their platform.",
        unverifiedNote_es: 'Buscamos cada agregador principal (DoorDash, Uber Eats, Grubhub, Postmates, Caviar, Deliveroo, Just Eat, Wolt, etc.) y middleware (Deliverect, Otter). Que falten enlaces a tus agregadores reales es un precipicio de conversión — los clientes asumen que no estás disponible en su plataforma.'
      },
      'catering-only': {
        impact: 'The "conversion" on a catering site is a quote request, not an online order. ezCater, CaterTrax, and Tripleseat all offer structured intake; a custom RFQ form works too, provided it captures head count, event date, dietary restrictions, delivery address, and a phone number. A site without any structured intake is routing bookings through generic email — which wins you nothing and loses you many.',
        impact_es: 'La "conversión" en un sitio de catering es una solicitud de cotización, no un pedido en línea. ezCater, CaterTrax y Tripleseat todos ofrecen intake estructurado; un formulario RFQ personalizado también funciona, siempre que capture número de personas, fecha del evento, restricciones dietéticas, dirección de entrega y un teléfono. Un sitio sin intake estructurado está enrutando reservas por correo genérico — lo que no te gana nada y te pierde muchas.',
        pass: 'Planners can request a quote online',
        pass_es: 'Los planificadores pueden solicitar cotización en línea',
        passNote: '{detected} on your site — event planners can start a quote request with their head count, date, and dietary notes in one place, instead of writing a cold email.',
        passNote_es: '{detected} en tu sitio — los planificadores de eventos pueden empezar una solicitud de cotización con su número de personas, fecha y notas dietéticas en un solo lugar, en vez de escribir un correo en frío.',
        unverifiedNote: "We scan for catering-focused platforms (ezCater, CaterTrax, Tripleseat) and generic RFQ/quote forms. A structured intake form is worth several emails of back-and-forth per booking — it\'s the single most impactful addition to a catering-only site without a booking flow.",
        unverifiedNote_es: 'Buscamos plataformas enfocadas a catering (ezCater, CaterTrax, Tripleseat) y formularios RFQ/cotización genéricos. Un formulario de intake estructurado vale varios correos de ida y vuelta por reserva — es la adición de más impacto en un sitio de catering sin flujo de reservas.'
      },
      'bar-pub': {
        impact: 'Bars and pubs vary — some take reservations, most take walk-ins. But even walk-in bars benefit from event bookings (private parties, tastings, brunches) and gift-card purchases. Tripleseat and similar platforms are common; a direct booking flow converts better than an email inquiry.',
        impact_es: 'Los bares y pubs varían — algunos toman reservas, la mayoría toma walk-ins. Pero incluso los bares de walk-in se benefician de reservas de eventos (fiestas privadas, catas, brunches) y compras de tarjetas de regalo. Tripleseat y plataformas similares son comunes; un flujo de reservas directo convierte mejor que una consulta por correo.',
        pass: 'Guests can book events or reservations online',
        pass_es: 'Los clientes pueden reservar eventos o reservas en línea',
        passNote: '{detected} on your site — event bookings and reservations can be handled without a back-and-forth email thread, which is where most bar-inquiry revenue falls through.',
        passNote_es: '{detected} en tu sitio — las reservas de eventos y mesas pueden manejarse sin un hilo de correos de ida y vuelta, que es donde se cae la mayoría de los ingresos de consultas a bares.',
        unverifiedNote: "We scan for reservation and event-booking platforms including OpenTable, Resy, Tripleseat, and more. Not every bar needs online booking (walk-ins are legitimate) — but event and private-party inquiries almost always benefit from a direct booking flow.",
        unverifiedNote_es: 'Buscamos plataformas de reservas y reservas de eventos incluyendo OpenTable, Resy, Tripleseat y más. No todos los bares necesitan reservas en línea (los walk-ins son legítimos) — pero las consultas de eventos y fiestas privadas casi siempre se benefician de un flujo de reservas directo.'
      }
    }
  },
  {
    type: 'menu-format',
    weight: 1.0,
    anchor: '#html-menu',
    effort: 'rebuild',
    minutes: 240,
    impact: "PDF menus are the most common mobile-UX sin on restaurant sites. They don't zoom gracefully, they don't link to online ordering, and they make every menu update (new special, changed price) dependent on a developer with InDesign. Replacing a PDF menu with a real HTML menu page typically lifts mobile dwell time by 30-50%.",
    impact_es: 'Los menús PDF son el pecado más común de UX móvil en sitios de restaurantes. No hacen zoom de forma agradable, no enlazan con pedidos en línea, y vuelven cada actualización (nuevo especial, cambio de precio) dependiente de un desarrollador con InDesign. Reemplazar un menú PDF por una página HTML real suele subir el tiempo de permanencia móvil entre 30-50%.',
    pass: 'Your menu opens as a real HTML page',
    pass_es: 'Tu menú abre como una página HTML real',
    passNote: 'Visitors can read your menu on a phone without downloading a PDF or pinching to zoom. This is table stakes for mobile restaurant UX.',
    passNote_es: 'Los visitantes pueden leer tu menú en un teléfono sin descargar un PDF ni hacer zoom con los dedos. Este es el piso mínimo para UX móvil de restaurante.',
    fail: 'Your menu is a PDF or an image',
    fail_es: 'Tu menú es un PDF o una imagen',
    failNote: 'PDF menus are the single most common restaurant mobile UX sin. They do not zoom gracefully on phones, they do not link to online ordering, and they make the "update a price" workflow depend on a developer. Replace it with a real HTML menu page.',
    failNote_es: 'Los menús PDF son el pecado de UX móvil más común en restaurantes. No hacen zoom bien en teléfonos, no enlazan con pedidos en línea, y vuelven el flujo de "actualizar un precio" dependiente de un desarrollador. Reemplázalo con una página HTML real.',
    unverified: "We couldn't find a menu link — is this right?",
    unverified_es: 'No encontramos un enlace de menú — ¿es correcto?',
    unverifiedNote: "We looked for a link containing 'menu' in its path and didn't find one. If your menu is reachable but named something else (like 'food', 'dining', 'kitchen'), the scanner missed it — tell us below and we'll improve it.",
    unverifiedNote_es: 'Buscamos un enlace con "menu" en su ruta y no lo encontramos. Si tu menú es accesible pero se llama de otra forma (como "food", "dining", "kitchen"), el escáner lo pasó por alto — dínoslo abajo y mejoraremos el escáner.',
    byType: {
      'fine-dining': {
        impact: 'Fine-dining menus are part of the marketing pitch — prospective guests decide whether to book based on how the tasting menu reads. A PDF (especially one styled for print) flattens on mobile and breaks that pitch completely.',
        impact_es: 'Los menús de fine-dining son parte del pitch de marketing — los comensales potenciales deciden si reservar según cómo lee el menú degustación. Un PDF (sobre todo uno con estilo para imprimir) se aplana en móvil y rompe el pitch completamente.',
        pass: 'Your tasting menu opens as a real HTML page',
        pass_es: 'Tu menú degustación abre como una página HTML real',
        passNote: 'Your tasting menu and wine list render as HTML — guests can browse on a phone while deciding whether to book, without downloading a file.',
        passNote_es: 'Tu menú degustación y carta de vinos renderean como HTML — los comensales pueden navegar en el teléfono mientras deciden si reservar, sin descargar un archivo.',
        fail: 'Your tasting menu is a PDF or an image',
        fail_es: 'Tu menú degustación es un PDF o una imagen',
        failNote: 'PDF tasting menus look designed, but they break the Saturday-afternoon "should I book this place?" decision flow on mobile. Rebuild as an HTML page so the copy is indexable by Google, legible on phones, and updatable without a designer.',
        failNote_es: 'Los menús degustación en PDF se ven diseñados, pero rompen el flujo de decisión de un sábado por la tarde "¿debería reservar aquí?" en móvil. Reconstruye como página HTML para que el texto sea indexable por Google, legible en teléfonos y actualizable sin un diseñador.'
      },
      'fast-casual': {
        impact: 'Fast-casual menus ARE the conversion page — prices, item names, and a one-tap "Order" button all need to live on the same scrollable page. A PDF kills the ordering flow and sends the customer to an aggregator.',
        impact_es: 'Los menús fast-casual SON la página de conversión — precios, nombres de platos y un botón "Ordenar" de un solo tap todos necesitan vivir en la misma página deslizable. Un PDF mata el flujo de pedido y manda al cliente a un agregador.',
        pass: 'Your menu opens as a real HTML page',
        pass_es: 'Tu menú abre como una página HTML real',
        passNote: 'Your menu renders as HTML alongside your order button — which is the pattern that actually converts for fast-casual traffic.',
        passNote_es: 'Tu menú rendereá como HTML junto a tu botón de pedido — el patrón que realmente convierte para tráfico fast-casual.',
        fail: 'Your menu is a PDF or an image',
        fail_es: 'Tu menú es un PDF o una imagen',
        failNote: 'PDF menus on a fast-casual site are a conversion killer. Your menu, prices, and "Order Online" button need to live on one scrollable HTML page — that\'s the ChowNow/Toast/Square pattern and it outperforms PDFs by wide margins.',
        failNote_es: 'Los menús PDF en un sitio fast-casual son un asesino de conversión. Tu menú, precios y botón "Ordenar en Línea" necesitan vivir en una sola página HTML deslizable — ese es el patrón ChowNow/Toast/Square y supera a los PDFs por amplios márgenes.'
      },
      'cafe': {
        impact: 'Café menus change often — daily specials, seasonal drinks, weekly bakes. A PDF menu means every tweak is a developer ticket; an HTML page means the barista can update prices between the morning and afternoon rush.',
        impact_es: 'Los menús de café cambian seguido — especiales del día, bebidas de temporada, productos horneados semanales. Un menú PDF significa que cada ajuste es un ticket para desarrollo; una página HTML significa que el barista puede actualizar precios entre la hora pico de mañana y de tarde.',
        pass: 'Your menu opens as a real HTML page',
        pass_es: 'Tu menú abre como una página HTML real',
        passNote: 'Your menu is an HTML page — which means you can update seasonal drinks, daily specials, and prices without emailing a designer.',
        passNote_es: 'Tu menú es una página HTML — lo que significa que puedes actualizar bebidas de temporada, especiales del día y precios sin escribirle a un diseñador.',
        fail: 'Your menu is a PDF or an image',
        fail_es: 'Tu menú es un PDF o una imagen',
        failNote: 'Café menus change weekly (or daily); PDFs lock you into a once-a-month update cadence. Rebuild as HTML so seasonal items, specials, and price changes can ship the same afternoon they\'re decided.',
        failNote_es: 'Los menús de café cambian semanalmente (o diariamente); los PDFs te encierran en una cadencia de actualización mensual. Reconstruye como HTML para que los platos de temporada, especiales y cambios de precio puedan publicarse la misma tarde que se deciden.'
      },
      'bakery': {
        impact: 'Bakery offerings rotate aggressively — seasonal tarts, weekend-only loaves, holiday cookie lineups. A PDF menu means the baker needs a designer to update the Christmas-cookie list; an HTML page means it ships the same morning, and can link to an "Order this" button per item.',
        impact_es: 'La oferta de panadería rota agresivamente — tartas de temporada, panes solo de fin de semana, colecciones de galletas de fiestas. Un menú PDF significa que el panadero necesita un diseñador para actualizar la lista de galletas de Navidad; una página HTML significa que se publica la misma mañana, y puede enlazar a un botón "Pedir esto" por cada ítem.',
        pass: 'Your bakery menu opens as a real HTML page',
        pass_es: 'Tu menú de panadería abre como una página HTML real',
        passNote: 'Your daily, seasonal, and custom-order menus render as HTML — which means the holiday lineup ships the morning you decide it, and each item can link to its own pre-order.',
        passNote_es: 'Tus menús diarios, de temporada y de pedidos personalizados rendereá como HTML — lo que significa que la colección de fiestas se publica la mañana que la decides, y cada ítem puede enlazar a su propio pre-pedido.',
        fail: 'Your menu is a PDF or an image',
        fail_es: 'Tu menú es un PDF o una imagen',
        failNote: 'Bakery menus rotate weekly (or daily); PDFs lock you into a monthly update cadence and cannot link to a per-item "Pre-order this" button. Rebuild as HTML so seasonal and custom items ship the same day they\'re decided.',
        failNote_es: 'Los menús de panadería rotan semanalmente (o diariamente); los PDFs te encierran en una cadencia de actualización mensual y no pueden enlazar a un botón por ítem "Pre-ordenar esto". Reconstruye como HTML para que ítems de temporada y personalizados se publiquen el mismo día que se deciden.'
      },
      'pizzeria': {
        impact: 'Pizzeria menus are the conversion page — a PDF menu cannot link each pie to an "Add to Cart" button, which is precisely the flow that makes Slice work and kills most independent pizzerias\' direct-ordering conversion. Every PDF-menu pizzeria is effectively handing its best customers to an aggregator.',
        impact_es: 'Los menús de pizzería son la página de conversión — un menú PDF no puede enlazar cada pizza a un botón "Agregar al carrito", que es justo el flujo que hace funcionar a Slice y mata la conversión de pedidos directos en la mayoría de las pizzerías independientes. Cada pizzería con menú PDF está efectivamente entregando a sus mejores clientes a un agregador.',
        pass: 'Your menu opens as a real HTML page',
        pass_es: 'Tu menú abre como una página HTML real',
        passNote: 'Your menu renders as HTML — each pie can link to its own "Order This" button, and price updates ship without a designer.',
        passNote_es: 'Tu menú rendereá como HTML — cada pizza puede enlazar a su propio botón "Ordenar esta", y las actualizaciones de precio se publican sin un diseñador.',
        fail: 'Your menu is a PDF or an image',
        fail_es: 'Tu menú es un PDF o una imagen',
        failNote: 'PDF menus break the pizzeria ordering flow completely — they can\'t link to per-pie order buttons or pass a pre-selected pie to your online checkout. Rebuild as an HTML page with one-tap "Order This" links per item; that\'s the pattern Slice uses and it\'s why Slice is taking your orders.',
        failNote_es: 'Los menús PDF rompen el flujo de pedido de pizzería por completo — no pueden enlazar a botones de pedido por pizza ni pasar una pizza preseleccionada a tu checkout en línea. Reconstruye como página HTML con enlaces "Ordenar esta" de un tap por ítem; ese es el patrón que usa Slice y por eso Slice se lleva tus pedidos.'
      },
      'food-truck': {
        impact: 'Food-truck menus rotate constantly — today it\'s barbacoa tacos, tomorrow it\'s carnitas, next week the owner is testing a smashburger. PDFs lock you into whatever was true the last time a designer had time. HTML means the menu matches what\'s actually on the truck, updated from your phone while you prep.',
        impact_es: 'Los menús de food truck rotan constantemente — hoy son tacos de barbacoa, mañana carnitas, la próxima semana el dueño está probando una smashburger. Los PDFs te encierran en lo que fue cierto la última vez que un diseñador tuvo tiempo. HTML significa que el menú coincide con lo que realmente está en el truck, actualizado desde tu teléfono mientras preparas.',
        pass: 'Your menu opens as a real HTML page',
        pass_es: 'Tu menú abre como una página HTML real',
        passNote: 'Your menu is an HTML page — you can update today\'s specials from your phone between prep and service.',
        passNote_es: 'Tu menú es una página HTML — puedes actualizar los especiales del día desde tu teléfono entre prep y servicio.',
        fail: 'Your menu is a PDF or an image',
        fail_es: 'Tu menú es un PDF o una imagen',
        failNote: 'Food-truck menus change faster than any other restaurant type. A PDF menu is often DAYS stale by the time someone reads it. Rebuild as HTML so the menu on your site matches the menu on the truck — ideally updated the morning of each service from your phone.',
        failNote_es: 'Los menús de food truck cambian más rápido que cualquier otro tipo de restaurante. Un menú PDF suele estar DÍAS desactualizado para cuando alguien lo lee. Reconstruye como HTML para que el menú en tu sitio coincida con el menú del truck — idealmente actualizado la mañana de cada servicio desde tu teléfono.'
      },
      'ghost-kitchen': {
        impact: 'For a ghost kitchen the menu on your site has one job: matching the menu on every aggregator you\'re listed on. PDF menus go stale the instant a single item gets pulled or repriced, and the resulting drift erodes customer trust across every platform at once. An HTML menu can be pulled from the same source of truth your POS/middleware already feeds the aggregators.',
        impact_es: 'Para una cocina fantasma, el menú en tu sitio tiene un trabajo: coincidir con el menú en cada agregador donde estás listado. Los menús PDF se desactualizan al instante en que un solo ítem se quita o cambia de precio, y la deriva resultante erosiona la confianza del cliente en cada plataforma a la vez. Un menú HTML puede sacarse de la misma fuente de verdad que tu POS/middleware ya alimenta a los agregadores.',
        pass: 'Your menu opens as a real HTML page',
        pass_es: 'Tu menú abre como una página HTML real',
        passNote: 'Your menu renders as HTML — easier to keep aligned with what\'s live on DoorDash / Uber Eats / Grubhub, especially when a price or item changes mid-week.',
        passNote_es: 'Tu menú rendereá como HTML — más fácil de mantener alineado con lo que está en vivo en DoorDash / Uber Eats / Grubhub, sobre todo cuando un precio o ítem cambia a media semana.',
        fail: 'Your menu is a PDF or an image',
        fail_es: 'Tu menú es un PDF o una imagen',
        failNote: 'Ghost-kitchen menus drift fast across platforms. PDF menus on your site lock you into a stale snapshot; HTML menus can be kept in sync (manually or via Deliverect / Otter / your POS) with whatever is live on your aggregators.',
        failNote_es: 'Los menús de cocina fantasma derivan rápido entre plataformas. Los menús PDF en tu sitio te encierran en una foto desactualizada; los menús HTML pueden mantenerse sincronizados (manualmente o vía Deliverect / Otter / tu POS) con lo que está en vivo en tus agregadores.'
      },
      'catering-only': {
        impact: 'Catering menus are the sales collateral — package breakdowns, per-head pricing, dietary accommodations, minimum orders, lead times. Unlike dine-in menus where a PDF is merely inconvenient, a catering PDF actually WORKS for one use case: emailing a rate sheet to a planner. The problem is that your site visitor and your planner-email flow have different needs — the planner wants a print-ready PDF; the site visitor wants a scannable HTML page. Offer both.',
        impact_es: 'Los menús de catering son material de ventas — desglose de paquetes, precios por cabeza, acomodaciones dietéticas, pedidos mínimos, tiempos de anticipación. A diferencia de los menús de dine-in donde un PDF es simplemente incómodo, un PDF de catering SÍ funciona para un caso: enviar una hoja de tarifas a un planificador. El problema es que el visitante de tu sitio y el flujo de correo del planificador tienen necesidades diferentes — el planificador quiere un PDF listo para imprimir; el visitante quiere una página HTML escaneable. Ofrece ambos.',
        pass: 'Your catering menu opens as a real HTML page',
        pass_es: 'Tu menú de catering abre como una página HTML real',
        passNote: 'Your packages and pricing render as HTML — event planners can scan them on a phone between meetings without downloading a file.',
        passNote_es: 'Tus paquetes y precios rendereá como HTML — los planificadores de eventos pueden escanearlos en el teléfono entre juntas sin descargar un archivo.',
        fail: 'Your menu is a PDF or an image',
        fail_es: 'Tu menú es un PDF o una imagen',
        failNote: 'On a catering site a PDF menu is better than nothing, but it\'s still a drop-off point for mobile visitors. Ship an HTML package page for browse/discovery, and keep the PDF rate sheet as a download-to-share option for planners who need to forward it to clients — both audiences get what they need.',
        failNote_es: 'En un sitio de catering, un menú PDF es mejor que nada, pero sigue siendo un punto de abandono para visitantes móviles. Publica una página HTML de paquetes para navegación/descubrimiento, y mantén la hoja de tarifas PDF como opción de descarga-para-compartir para planificadores que necesitan reenviarla a clientes — ambas audiencias obtienen lo que necesitan.'
      },
      'bar-pub': {
        impact: 'Cocktail lists and draft lists rotate constantly — a PDF list goes stale within weeks, and nobody wants to read a PDF on a phone at the bar anyway. HTML lists are faster to update, easier to share, and readable without a download.',
        impact_es: 'Las listas de cócteles y de cervezas de barril rotan constantemente — una lista PDF se desactualiza en semanas, y nadie quiere leer un PDF en el teléfono en el bar de todos modos. Las listas HTML son más rápidas de actualizar, más fáciles de compartir y legibles sin descarga.',
        pass: 'Your drink list opens as a real HTML page',
        pass_es: 'Tu lista de bebidas abre como una página HTML real',
        passNote: 'Your cocktail and draft lists render as HTML — which means visitors can scan them on a phone outside, and staff can rotate the list without a design sprint.',
        passNote_es: 'Tus listas de cócteles y cervezas rendereá como HTML — lo que significa que los visitantes pueden escanearlas en el teléfono afuera, y el equipo puede rotar la lista sin un sprint de diseño.',
        fail: 'Your drink list is a PDF or an image',
        fail_es: 'Tu lista de bebidas es un PDF o una imagen',
        failNote: 'PDF cocktail lists age poorly — by the time the designer ships the update, the beer\'s out of the keg. Rebuild as an HTML list (bar → pub → taproom style) so rotations happen the same day the barback swaps the tap.',
        failNote_es: 'Las listas PDF de cócteles envejecen mal — para cuando el diseñador publica la actualización, ya se acabó la cerveza del barril. Reconstruye como lista HTML (estilo bar → pub → taproom) para que las rotaciones sucedan el mismo día que el barback cambia el grifo.'
      }
    }
  },
  // Phase 3 #5: menu-depth. Evaluates the menu PAGE CONTENT — does it
  // show prices and dish photos? Complements menu-format (HTML vs PDF)
  // and dietary (GF/V markers). A menu that passes format but has
  // neither prices nor photos still underperforms on conversion;
  // delivery apps cross-check the owner's site before a shopper taps
  // "add to cart" and opaque menus cost orders. Weight 0.75 (bonus
  // tier) because a site with a broken format shouldn't be penalized
  // twice — the failNote explicitly tells owners to fix format first
  // on the unverified path.
  {
    type: 'menu-depth',
    weight: 0.75,
    anchor: '#honest-pricing',
    effort: 'self',
    minutes: 120,
    impact: 'Menus without visible prices and dish photos underperform by 30-40% on delivery apps and the owner\'s own online-ordering flow. Visitors cross-check prices before tapping "add to cart"; they scroll past items without photos. Adding both is a one-afternoon project for most HTML menus and the single highest-ROI change for ghost-kitchen and fast-casual restaurants.',
    impact_es: 'Los menús sin precios visibles y fotos de platos rinden 30-40% peor en apps de entrega y en el flujo de pedidos del propio sitio. Los visitantes verifican precios antes de tocar "agregar al carrito"; pasan de largo los ítems sin fotos. Agregar ambos es un proyecto de una tarde para la mayoría de los menús HTML y el cambio de mayor ROI para cocinas fantasma y restaurantes fast-casual.',
    pass: 'Your menu has visible prices and dish photos',
    pass_es: 'Tu menú tiene precios visibles y fotos de platos',
    passNote: 'Your menu page shows both prices and dish photos — shoppers can cross-check before ordering, which is exactly the pattern that converts on delivery apps and on your own site.',
    passNote_es: 'Tu página del menú muestra precios y fotos de platos — los compradores pueden verificar antes de pedir, que es justo el patrón que convierte en apps de entrega y en tu propio sitio.',
    fail: 'Your menu is missing conversion signals',
    fail_es: 'Tu menú le falta señales que venden',
    // failNote uses the {detected} template token (same path the
    // platform check uses) to enumerate the specific gaps — e.g.
    // "Your menu page is missing: prices and dish photos."
    failNote: 'Your menu page is missing: {detected}. These are the two signals a shopper or delivery-app user checks before tapping "add to cart." Add them to your menu page — plain text prices next to each item, and one photo per signature dish — and conversion typically lifts within a week.',
    failNote_es: 'A tu página del menú le falta: {detected}. Estas son las dos señales que un comprador o usuario de app de entrega verifica antes de tocar "agregar al carrito". Agrégalas a tu página del menú — precios en texto plano junto a cada ítem, y una foto por cada plato insignia — y la conversión suele subir en una semana.',
    unverified: "We couldn't reach your menu page to evaluate its content",
    unverified_es: 'No pudimos acceder a tu página de menú para evaluar su contenido',
    unverifiedNote: "The audit looks at the page behind your 'Menu' link for visible prices and dish photos. We couldn't reach one this pass — either the format is a PDF (see the menu-format check above) or the crawler missed it. Confirm the format first; we'll re-evaluate depth on the next run.",
    unverifiedNote_es: 'La auditoría revisa la página detrás de tu enlace "Menú" buscando precios visibles y fotos de platos. No pudimos acceder a una en este pase — o el formato es PDF (ver el chequeo de menu-format arriba) o el crawler no la encontró. Confirma primero el formato; reevaluaremos la profundidad en la próxima ejecución.',
    // Phase 3 #5c: byType specialization. Each subtype gets copy that
    // names its specific stakes — what conversion pattern the missing
    // signals are breaking, and what the remediation looks like at
    // that subtype's typical operating scale. Generic copy above
    // still applies to casual-dining and any subtype not listed here.
    // Added in sprints (fine-dining/fast-casual/cafe first) so each
    // commit is small enough to land without stream-timeout risk.
    byType: {
      'fine-dining': {
        impact: 'Fine-dining guests book based on how the tasting menu reads — the prose, the wine-pairing callouts, and the per-seat price point. Missing prices costs bookings from guests who need to know what the evening will cost (prix fixe, corkage, wine pairing add-on) before they commit. Photos matter less here than on delivery-app sites; the words do the selling.',
        impact_es: 'Los comensales de fine-dining reservan por cómo se lee el menú degustación — la prosa, las notas de maridaje y el precio por persona. Sin precios, se pierden reservas de quienes necesitan saber el costo de la noche (prix fixe, descorche, maridaje adicional) antes de decidir. Las fotos importan menos aquí que en sitios de apps de entrega; las palabras son las que venden.',
        pass: 'Your tasting menu reads with prices clearly visible',
        pass_es: 'Tu menú degustación se lee con los precios claramente visibles',
        passNote: 'Guests can scan the tasting menu, see the prix fixe price, and decide to book — all on one page, on a phone, without calling to ask.',
        passNote_es: 'Los comensales pueden recorrer el menú degustación, ver el precio del prix fixe y decidir reservar — todo en una página, en el teléfono, sin tener que llamar para preguntar.',
        fail: 'Your tasting menu is missing: {detected}',
        fail_es: 'A tu menú degustación le falta: {detected}',
        failNote: 'Fine-dining guests book on the strength of the menu — they need the tasting-menu copy AND the price (prix fixe, corkage policy, wine-pairing add-on) before committing. Add these to your menu page; the text matters more than photography for this segment, but missing either sends bookings to the competitor that shows them both.',
        failNote_es: 'Los comensales de fine-dining reservan por la fuerza del menú — necesitan la copia del menú degustación Y el precio (prix fixe, política de descorche, maridaje adicional) antes de comprometerse. Agrégalos a tu página del menú; el texto importa más que la fotografía en este segmento, pero si falta alguno, las reservas se van al competidor que muestra ambos.'
      },
      'fast-casual': {
        impact: 'Fast-casual menus ARE the conversion page. Prices next to each item + at least one photo per section lift online-ordering conversion 20-30% vs menus missing either signal. Customers who don\'t see them on your site bounce to the DoorDash / UberEats / ChowNow tile where both are standard — and the platform keeps 30% of that revenue instead of you.',
        impact_es: 'Los menús fast-casual SON la página de conversión. Precios junto a cada ítem + al menos una foto por sección suben la conversión de pedidos en línea 20-30% frente a menús sin alguna de las dos señales. Los clientes que no las ven en tu sitio rebotan al tile de DoorDash / UberEats / ChowNow donde ambas son estándar — y la plataforma se queda con 30% de ese ingreso en vez de tú.',
        pass: 'Your menu has item prices and dish photos ready for ordering',
        pass_es: 'Tu menú tiene precios de ítems y fotos de platos listos para pedir',
        passNote: 'Shoppers scan prices to budget, scroll through photos to choose, and tap "order" without leaving your site. That\'s the pattern that keeps the margin in-house instead of handing 30% to an aggregator.',
        passNote_es: 'Los compradores revisan precios para presupuestar, recorren fotos para elegir y tocan "ordenar" sin salir de tu sitio. Ese es el patrón que mantiene el margen en casa en vez de entregar 30% a un agregador.',
        fail: 'Your menu is missing: {detected}',
        fail_es: 'A tu menú le falta: {detected}',
        failNote: 'Fast-casual ordering conversion depends on both signals. Shoppers scan prices to budget, scroll through photos to choose. Add them to your menu page BEFORE the competition\'s DoorDash tile captures the order — every order that routes through the aggregator costs you 30% of the ticket.',
        failNote_es: 'La conversión de pedidos fast-casual depende de ambas señales. Los compradores revisan precios para presupuestar, recorren fotos para elegir. Agrégalas a tu página del menú ANTES que el tile de DoorDash de la competencia capture el pedido — cada pedido que pasa por el agregador te cuesta 30% del ticket.'
      },
      'cafe': {
        impact: 'Café menus carry the morning decision — "latte or cortado? $4 or $5?" — that most customers already made on their phone while walking in. Visible prices + a handful of drink/pastry photos resolve that decision BEFORE the customer reaches the counter, which is how busy mornings stay moving. Price-less menus force the mid-line "what does a cortado cost again?" that slows the queue.',
        impact_es: 'Los menús de café cargan la decisión de la mañana — "¿latte o cortado? ¿$4 o $5?" — que la mayoría de los clientes ya tomó en el teléfono mientras caminaban. Precios visibles + unas cuantas fotos de bebidas y repostería resuelven esa decisión ANTES que el cliente llegue al mostrador, que es como se mueven las mañanas ocupadas. Los menús sin precio fuerzan el "¿cuánto cuesta un cortado?" a media fila que atasca la cola.',
        pass: 'Your café menu shows prices and a few drink or pastry photos',
        pass_es: 'Tu menú de café muestra precios y algunas fotos de bebidas o repostería',
        passNote: 'Customers queue up knowing what they want — which means your baristas are making drinks instead of answering "how much is that?" Morning throughput stays smooth.',
        passNote_es: 'Los clientes hacen fila sabiendo qué quieren — lo que significa que tus baristas están haciendo bebidas en vez de responder "¿cuánto cuesta eso?". El flujo matutino se mantiene fluido.',
        fail: 'Your café menu is missing: {detected}',
        fail_es: 'A tu menú de café le falta: {detected}',
        failNote: 'Café menus carry the mid-walk "what am I getting today" decision. Both the price and a couple of drink/pastry photos belong on the page so customers queue up with a decision, not a question. If you only have time for one fix, ship the prices — even hand-typed, even updated with the seasonal board.',
        failNote_es: 'Los menús de café cargan la decisión "¿qué voy a pedir hoy?" camino al café. Tanto el precio como un par de fotos de bebidas o repostería pertenecen a la página para que los clientes hagan fila con una decisión, no con una pregunta. Si sólo tienes tiempo para un arreglo, publica los precios — aunque sean escritos a mano, aunque se actualicen con la pizarra de temporada.'
      },
      'bakery': {
        impact: 'Bakery menus are almost pure visual sales. A croissant, a danish, a cinnamon roll — customers can\'t tell what they\'re buying without a photo, and they can\'t decide whether to stop in without a price. Missing dish photography is the single biggest conversion leak a bakery site has; if you only invest in one thing, invest in product photography.',
        impact_es: 'Los menús de panadería son casi pura venta visual. Un croissant, un danés, un rollo de canela — los clientes no pueden saber qué están comprando sin una foto, y no pueden decidir si pasar sin un precio. La falta de fotografía de producto es la fuga de conversión más grande que tiene un sitio de panadería; si inviertes en una sola cosa, que sea la fotografía de producto.',
        pass: 'Your bakery menu has prices and product photography',
        pass_es: 'Tu menú de panadería tiene precios y fotografía de producto',
        passNote: 'Customers can see what they want — a glazed morning bun, a rye loaf, a croissant — and decide to stop in before they\'re on the block. That visual decision layer is exactly what bakeries compete on.',
        passNote_es: 'Los clientes pueden ver lo que quieren — un pan de mañana glaseado, un pan de centeno, un croissant — y decidir pasar antes de llegar a la cuadra. Esa capa de decisión visual es exactamente la que compite en panadería.',
        fail: 'Your bakery menu is missing: {detected}',
        fail_es: 'A tu menú de panadería le falta: {detected}',
        failNote: 'Bakery menus sell with images first, prices second. Without photos, customers can\'t identify what they want; without prices, they can\'t budget the stop. Both belong next to each item — a phone camera and good light will close most of this gap without hiring a photographer.',
        failNote_es: 'Los menús de panadería venden con imágenes primero, precios segundo. Sin fotos, los clientes no pueden identificar qué quieren; sin precios, no pueden presupuestar la visita. Ambos pertenecen junto a cada ítem — una cámara de teléfono y buena luz cerrarán la mayor parte de esta brecha sin contratar un fotógrafo.'
      },
      'pizzeria': {
        impact: 'Pizza is a category-shop — customers open three pizzeria tabs side-by-side and the one with the best-photographed, clearly-priced menu wins the order. Missing either signal hands the order to Slice (~15% commission) or to the pizzeria down the block that shows both. The per-item conversion delta on a well-photographed Margherita vs a blank-text menu runs 30-50%.',
        impact_es: 'La pizza es una categoría de compra comparada — los clientes abren tres pestañas de pizzerías lado a lado y la que tenga el menú mejor fotografiado y con precios claros se lleva el pedido. Si falta alguna de las dos señales, el pedido se va a Slice (~15% de comisión) o a la pizzería de enfrente que muestra ambas. El delta de conversión por ítem sobre una Margherita bien fotografiada frente a un menú de texto plano corre entre 30-50%.',
        pass: 'Your pizzeria menu has per-pie prices and photography',
        pass_es: 'Tu menú de pizzería tiene precios por pizza y fotografía',
        passNote: 'Your menu wins the side-by-side comparison shoppers do before ordering — pies visible, prices visible, one-tap ordering. That pattern is what keeps Slice from eating your margins.',
        passNote_es: 'Tu menú gana la comparación lado a lado que hacen los compradores antes de pedir — pizzas visibles, precios visibles, pedido de un toque. Ese patrón es el que evita que Slice se coma tus márgenes.',
        fail: 'Your pizzeria menu is missing: {detected}',
        fail_es: 'A tu menú de pizzería le falta: {detected}',
        failNote: 'Pizza ordering is a three-tab comparison — whichever pizzeria shows the pies AND the prices cleanest wins. Shoot your top six pies (phone camera + overhead light works fine), put prices right next to each, and your direct-ordering conversion will lift 30-50% against the Slice competition. This is the single highest-ROI menu project a pizzeria can do.',
        failNote_es: 'El pedido de pizza es una comparación de tres pestañas — la pizzería que muestre las pizzas Y los precios más limpios gana. Fotografía tus seis pizzas principales (cámara de teléfono + luz desde arriba funciona bien), pon los precios junto a cada una, y tu conversión de pedidos directos subirá 30-50% frente a la competencia de Slice. Este es el proyecto de menú con mayor ROI que una pizzería puede hacer.'
      },
      'bar-pub': {
        impact: 'Bar and pub menus split into two lists: drinks (cocktail prices, draft list) and food (which carries most of the margin — bar food is a higher-markup category than beer). A site that shows neither photos nor prices on the food menu is usually missing the food menu altogether, and the after-work food revenue takes the hit.',
        impact_es: 'Los menús de bar y pub se dividen en dos listas: bebidas (precios de cócteles, lista de barril) y comida (que carga la mayoría del margen — la comida de bar es una categoría de mayor margen que la cerveza). Un sitio que no muestra ni fotos ni precios en el menú de comida suele estar ocultando el menú de comida por completo, y el ingreso de comida de after-work es el que paga.',
        pass: 'Your pub menu shows prices with food photography',
        pass_es: 'Tu menú de pub muestra precios con fotografía de comida',
        passNote: 'Your food menu is visible the way the cocktail list is — prices next to items, photos of the signature plates. That makes the after-drink "should we order food?" decision a yes instead of a bar-tab.',
        passNote_es: 'Tu menú de comida es visible de la misma forma que la lista de cócteles — precios junto a los ítems, fotos de los platos insignia. Eso convierte la decisión post-bebida de "¿pedimos comida?" en un sí en vez de sólo una cuenta del bar.',
        fail: 'Your pub menu is missing: {detected}',
        fail_es: 'A tu menú de pub le falta: {detected}',
        failNote: 'Bar customers decide whether to order food AFTER they\'ve already ordered a drink — the food menu with prices AND photos is the conversion surface for that second decision. Cocktail-list prices on their own miss the bigger revenue lever: the food order. Put the food menu on equal footing with the drink list, photos and all.',
        failNote_es: 'Los clientes del bar deciden si pedir comida DESPUÉS de haber pedido una bebida — el menú de comida con precios Y fotos es la superficie de conversión para esa segunda decisión. Los precios sólo en la lista de cócteles se pierden la palanca de ingreso más grande: el pedido de comida. Pon el menú de comida en igualdad con la lista de bebidas, fotos incluidas.'
      },
      'food-truck': {
        impact: 'Food-truck menus rotate weekly. A photo of today\'s smashburger + its price is the whole pitch — customers standing across the plaza check your site BEFORE they walk over to queue. Missing either signal sends them to the truck next to you that shows both. This is a same-morning fix: the owner shoots a phone photo of the special, updates the price in the site CMS, done.',
        impact_es: 'Los menús de food truck rotan semanalmente. Una foto de la smashburger de hoy + su precio es todo el pitch — los clientes parados al otro lado de la plaza revisan tu sitio ANTES de caminar a hacer fila. Si falta alguna señal, se van al truck de al lado que muestra ambas. Este es un arreglo de la misma mañana: el dueño toma una foto con el teléfono del especial, actualiza el precio en el CMS del sitio, listo.',
        pass: 'Your truck menu shows today\'s prices and photos',
        pass_es: 'Tu menú del truck muestra los precios y fotos de hoy',
        passNote: 'Your site matches the truck — today\'s special with its price and its photo, visible before the customer walks over. That\'s the pattern that wins the walk-the-plaza decision.',
        passNote_es: 'Tu sitio coincide con el truck — el especial de hoy con su precio y su foto, visibles antes que el cliente cruce. Ese es el patrón que gana la decisión de cruzar la plaza.',
        fail: 'Your truck menu is missing: {detected}',
        fail_es: 'A tu menú del truck le falta: {detected}',
        failNote: 'Food trucks live and die on the "walk across the plaza to line up" decision. A phone photo of today\'s special + the price is the whole sales pitch — you can update both from the truck before service starts. Skip either and the customer walks to the truck that shows both.',
        failNote_es: 'Los food trucks viven o mueren por la decisión de "cruzar la plaza a hacer fila". Una foto de teléfono del especial de hoy + el precio es todo el pitch de ventas — puedes actualizar ambos desde el truck antes que empiece el servicio. Salta cualquiera y el cliente camina al truck que muestra ambos.'
      },
      'ghost-kitchen': {
        impact: 'Ghost kitchens have exactly two selling surfaces: aggregator tiles (DoorDash / UberEats / GrubHub — all three show prices and photos by default) and the owner\'s own site. A silent menu on your own site sends shoppers back to the aggregator — where 30% of every ticket goes to the platform instead of to you. Prices + photos on your direct-ordering page is the ONLY way to keep that margin in-house.',
        impact_es: 'Las cocinas fantasma tienen exactamente dos superficies de venta: los tiles de agregadores (DoorDash / UberEats / GrubHub — los tres muestran precios y fotos por defecto) y el propio sitio del dueño. Un menú silencioso en tu propio sitio manda a los compradores de vuelta al agregador — donde 30% de cada ticket va a la plataforma en vez de a ti. Precios + fotos en tu página de pedido directo es la ÚNICA forma de mantener ese margen en casa.',
        pass: 'Your ghost-kitchen menu has prices and dish photos on-site',
        pass_es: 'Tu menú de cocina fantasma tiene precios y fotos de platos en el sitio',
        passNote: 'Your own-site menu matches what DoorDash / UberEats show — which means a shopper who lands there directly can order without bouncing back to the aggregator. Every order on your own site is a 30% margin win.',
        passNote_es: 'Tu menú del sitio propio coincide con lo que muestran DoorDash / UberEats — lo que significa que un comprador que aterriza ahí directamente puede pedir sin rebotar al agregador. Cada pedido en tu propio sitio es una ganancia de 30% en margen.',
        fail: 'Your ghost-kitchen menu is missing: {detected}',
        fail_es: 'A tu menú de cocina fantasma le falta: {detected}',
        failNote: 'A ghost kitchen\'s own site has to SELL the same way DoorDash does — prices next to each item, one photo per dish. Silent menus send customers straight back to the aggregator (where you pay 30% of that revenue to them instead of keeping it). Use the same photos you uploaded to DoorDash; use the same prices. Parity is the whole game.',
        failNote_es: 'El sitio propio de una cocina fantasma tiene que VENDER de la misma forma que DoorDash — precios junto a cada ítem, una foto por plato. Los menús silenciosos mandan a los clientes directo de vuelta al agregador (donde pagas 30% de ese ingreso en vez de quedártelo). Usa las mismas fotos que subiste a DoorDash; usa los mismos precios. La paridad es todo el juego.'
      },
      'catering-only': {
        impact: 'Catering planners make a go / no-go decision within the first 10 seconds of hitting your packages page: "is the per-head price in our budget?" and "does the food look like it fits our event?". Package photos + per-head prices are the two signals that carry that decision. A package page without either sends them to a caterer that is explicit.',
        impact_es: 'Los planificadores de catering toman una decisión de sí/no en los primeros 10 segundos de llegar a tu página de paquetes: "¿el precio por persona está en nuestro presupuesto?" y "¿la comida se ve como para nuestro evento?". Fotos de paquetes + precios por persona son las dos señales que cargan esa decisión. Una página de paquetes sin alguna de las dos los manda a un caterer que sí sea explícito.',
        pass: 'Your catering packages have per-head prices and event photos',
        pass_es: 'Tus paquetes de catering tienen precios por persona y fotos del evento',
        passNote: 'Planners can scan your packages the way they scan every other caterer\'s — per-head price visible, event photos visible, decision made in the same 10 seconds they give every option.',
        passNote_es: 'Los planificadores pueden revisar tus paquetes de la misma forma que revisan los de cualquier otro caterer — precio por persona visible, fotos del evento visibles, decisión tomada en los mismos 10 segundos que dan a cada opción.',
        fail: 'Your catering packages are missing: {detected}',
        fail_es: 'A tus paquetes de catering les falta: {detected}',
        failNote: 'Catering planners make a go / no-go within 10 seconds: per-head price in range, food looks like it fits the event. Without prices, they go to a caterer who is upfront; without photos, they go to one that shows the spread. Both belong next to each package name — a single plated shot plus a starting per-head number is enough to start the conversation.',
        failNote_es: 'Los planificadores de catering toman un sí/no en 10 segundos: precio por persona en rango, comida que se ve acorde al evento. Sin precios, se van con un caterer que sí es claro; sin fotos, con uno que muestra el despliegue. Ambos pertenecen junto a cada nombre de paquete — una sola foto del plato más un precio base por persona es suficiente para empezar la conversación.'
      }
    }
  },
  {
    type: 'schema',
    weight: 0.5, // bonus — nice to have, not critical
    anchor: '#schema',
    effort: 'dev',
    minutes: 20,
    impact: "Restaurant schema markup is how Google learns your hours, cuisine, and price range for local search. Restaurants with proper schema show up in the 'restaurants near me' rich results with photos and ratings — restaurants without it get a plain blue link. The difference in click-through rate is meaningful.",
    pass: 'Google can read your site as a restaurant',
    impact_es: 'El schema Restaurant es cómo Google entiende tu cocina, horarios, rango de precios y URL del menú. Sin él, Google tiene que adivinar tu categoría en vez de leerla directamente — la diferencia entre un rich snippet con horario y precios y un enlace azul plano.',
    pass_es: 'Tu sitio publica schema de restaurante',
    passNote: 'Your site publishes Restaurant schema markup — the JSON-LD block Google reads to understand your cuisine, hours, price range, and menu URL. This is what earns you rich-result placement in "restaurants near me" searches.',
    passNote_es: 'Tu sitio publica el schema de Restaurant — el bloque JSON-LD que Google lee para entender tu cocina, horarios, rango de precios y URL del menú. Esto es lo que te gana colocación de resultados enriquecidos en búsquedas de "restaurantes cerca de mí".',
    fail_es: 'A tu sitio le falta el schema de Restaurant',
    failNote_es: 'Detectamos tu segmento por señales de plataforma y palabras clave, pero tu sitio no publica el bloque JSON-LD <code>@type: "Restaurant"</code> que Google lee para resultados enriquecidos. Sin él, Google tiene que inferir tu categoría en vez de leerla — la diferencia entre un rich snippet (horario, precio, cocina) y un enlace azul plano. Es un cambio de 10 líneas para tu desarrollador.',
    unverified_es: 'No pudimos confirmar tu schema de Restaurant',
    unverifiedNote_es: 'No pudimos leer con confianza si tu sitio publica JSON-LD de Restaurant. Si crees que está, vuelve a auditar en un minuto — a veces Lighthouse lo pasa por alto. Si no, agregar un bloque JSON-LD con <code>@type: "Restaurant"</code>, tu dirección, horarios y cocina es significativo para el SEO local.',
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
    anchor: '#dietary-markers',
    effort: 'self',
    minutes: 30,
    impact: 'Dietary-aware guests make decisions based on whether they see themselves considered. A single "GF" mark or a "vegan" badge reliably converts more dietary-restricted customers than ten paragraphs of "we can accommodate." Even one marker signals that someone on staff has thought about cross-contamination.',
    impact_es: 'Los comensales con restricciones deciden si se sienten considerados. Una sola marca "GF" o un badge "vegano" convierte más clientes con restricciones que diez párrafos de "nos adaptamos". Incluso una sola marca indica que alguien del equipo pensó en la contaminación cruzada.',
    pass: 'Your site signals dietary options',
    pass_es: 'Tu sitio señala opciones dietéticas',
    passNote: '{detected} visible on your site — guests with dietary restrictions can self-qualify without having to call and ask.',
    passNote_es: '{detected} visible en tu sitio — los comensales con restricciones pueden auto-calificar sin tener que llamar para preguntar.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t spot dietary markers — is this right?',
    unverified_es: 'No vimos marcas dietéticas — ¿es correcto?',
    unverifiedNote: 'We scan for vegan, vegetarian, gluten-free, dairy-free, nut-free, halal, kosher, and allergen notes. If your menu marks dietary options with symbols or callouts we didn\'t recognize (or if the markers live on a menu page we didn\'t reach), let us know and we\'ll improve the detector.',
    unverifiedNote_es: 'Buscamos vegano, vegetariano, sin gluten, sin lácteos, sin nueces, halal, kosher y notas de alérgenos. Si tu menú marca opciones dietéticas con símbolos o leyendas que no reconocimos (o si las marcas viven en una página de menú a la que no llegamos), avísanos y mejoraremos el detector.',
    byType: {
      'fine-dining': {
        impact: 'Fine-dining tasting menus live or die on accommodating dietary restrictions — half the phone calls your host fields are "do you have gluten-free or vegetarian options?" Surfacing answers on the menu page deflects those calls and lets guests book with confidence.',
        impact_es: 'Los menús degustación de fine-dining viven o mueren por acomodar restricciones dietéticas — la mitad de las llamadas que tu host atiende son "¿tienen opciones sin gluten o vegetarianas?" Poner las respuestas en la página del menú desvía esas llamadas y deja a los comensales reservar con confianza.',
        unverifiedNote: 'Tasting-menu dietary accommodations belong on your menu or reservations page in plain English. "Vegetarian tasting available on request" earns bookings; silence sends them to a restaurant that says so.',
        unverifiedNote_es: 'Las acomodaciones dietéticas del menú degustación pertenecen en tu página de menú o reservas en lenguaje claro. "Menú degustación vegetariano bajo pedido" gana reservas; el silencio las manda a un restaurante que sí lo dice.'
      },
      'casual-dining': {
        impact: 'Casual-dining guests often decide between two restaurants based on whether one of them clearly marks vegetarian or gluten-free options. The market of dietary-aware eaters is bigger than most owners realize — about 1 in 3 diners avoids at least one food group.',
        impact_es: 'Los comensales de casual-dining frecuentemente eligen entre dos restaurantes según cuál marca claramente opciones vegetarianas o sin gluten. El mercado de comensales con restricciones es más grande de lo que la mayoría de los dueños cree — cerca de 1 de cada 3 evita al menos un grupo de alimentos.',
        unverifiedNote: 'Mark a few items with V / GF / DF symbols on the menu page (with a small legend). This is the single highest-ROI content change a casual-dining site can make.',
        unverifiedNote_es: 'Marca algunos platos con símbolos V / SG / SL en la página del menú (con una leyenda pequeña). Es el cambio de contenido con mayor ROI que un sitio de casual-dining puede hacer.'
      },
      'bakery': {
        impact: 'For bakeries dietary markers are not marketing — they are safety. A customer ordering a custom cake for a nut-allergic child trusts whether you\'ve thought about cross-contamination, and your site is where they decide whether to trust you with a birthday.',
        impact_es: 'Para las panaderías, las marcas dietéticas no son marketing — son seguridad. Un cliente pidiendo un pastel personalizado para un niño con alergia a nueces confía en si has pensado en contaminación cruzada, y tu sitio es donde decide si confiarte un cumpleaños.',
        unverifiedNote: 'Call out cross-contamination policy and clearly mark nut-free / gluten-free / dairy-free bakes on the menu page. For custom-order intake, add a dietary-restriction field to the form. This is a trust-earning change, not a marketing one.',
        unverifiedNote_es: 'Destaca tu política de contaminación cruzada y marca claramente los horneados sin nueces / sin gluten / sin lácteos en la página del menú. Para el intake de pedidos personalizados, agrega un campo de restricciones dietéticas al formulario. Es un cambio de ganancia de confianza, no de marketing.'
      },
      'ghost-kitchen': {
        impact: 'Ghost-kitchen customers rarely inspect the site before ordering — but the ones who DO are usually dietary-restricted and comparing brands before committing. Clear dietary markers on your brand page move those orders into your funnel instead of a competing aggregator listing.',
        impact_es: 'Los clientes de cocinas fantasma rara vez inspeccionan el sitio antes de pedir — pero los que SÍ lo hacen normalmente tienen restricciones dietéticas y comparan marcas antes de comprometerse. Las marcas dietéticas claras en tu página de marca mueven esos pedidos a tu funnel en vez de a un listado de agregador competidor.'
      }
    }
  },
  {
    // Phase H2: Gift-card presence. Evaluator branch uses
    // detectGiftCardPresence(pageText, allUrls). Never fail —
    // absence is a missed revenue lever, not a broken site.
    type: 'gift-cards',
    weight: 0.5,
    anchor: '#gift-card-checkout',
    effort: 'dev',
    minutes: 30,
    impact: 'Gift cards are the highest-margin line on a restaurant site. Every \$50 gift card sold brings in \$50 of revenue AND a future customer; roughly 20-30% of gift cards go unredeemed, which is pure revenue. A visible "Gift Cards" CTA converts more than you would expect, especially around November-December.',
    impact_es: 'Las tarjetas de regalo son la línea de mayor margen en un sitio de restaurante. Cada tarjeta de $50 vendida trae $50 de ingresos Y un cliente futuro; cerca del 20-30% de las tarjetas no se canjean, puro margen. Un CTA visible de "Tarjetas de regalo" convierte más de lo esperado, especialmente entre noviembre y diciembre.',
    pass: 'Your site sells gift cards',
    pass_es: 'Tu sitio vende tarjetas de regalo',
    passNote: '{detected} on your site — gift-card sales are some of the highest-margin revenue a restaurant can earn, and you already have the flow.',
    passNote_es: '{detected} en tu sitio — las ventas de tarjetas de regalo son de los ingresos con mayor margen que un restaurante puede generar, y tú ya tienes el flujo.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t spot gift-card sales — is this right?',
    unverified_es: 'No vimos venta de tarjetas de regalo — ¿es correcto?',
    unverifiedNote: 'We scan for gift-card text ("Gift Card", "Gift Certificate", "e-Gift") plus major platforms (Toast Gift Cards, Square Gift Cards, Yiftee, GiftUp, Factor4). If you sell via a platform we missed, tell us and we will add it. If you do not sell gift cards today, adding a simple checkout page is a high-ROI, once-a-quarter project.',
    unverifiedNote_es: 'Buscamos texto de tarjetas ("Gift Card", "Gift Certificate", "e-Gift") y plataformas importantes (Toast Gift Cards, Square Gift Cards, Yiftee, GiftUp, Factor4). Si vendes por una plataforma que pasamos por alto, dínoslo y la agregamos. Si hoy no vendes tarjetas, agregar una página simple de checkout es un proyecto trimestral de alto ROI.',
    byType: {
      'fine-dining': {
        impact: 'Gift cards at fine-dining restaurants are the "special occasion" present par excellence — anniversaries, birthdays, holiday gifts. Redemption rates run higher than casual dining but unredeemed balances are still pure margin. Physical printed cards are a nice upsell for corporate gifts.',
        impact_es: 'Las tarjetas de regalo en restaurantes de fine-dining son el regalo de "ocasión especial" por excelencia — aniversarios, cumpleaños, regalos de fiestas. Las tasas de canje son más altas que en casual dining pero los saldos no canjeados siguen siendo puro margen. Las tarjetas físicas impresas son un buen upsell para regalos corporativos.',
        unverifiedNote: 'A gift-card page on a fine-dining site pays for itself during the holidays. Tock, Resy, and SevenRooms all integrate gift cards; Toast does too if you are on their POS.',
        unverifiedNote_es: 'Una página de tarjetas de regalo en un sitio de fine-dining se paga sola en las fiestas. Tock, Resy y SevenRooms todos integran tarjetas de regalo; Toast también si estás en su POS.'
      },
      'bar-pub': {
        impact: 'Bars and pubs over-index on gift cards — stocking-stuffers, birthday presents, thank-you gifts from corporate accounts. Every unredeemed card is pure revenue; every redeemed one brings in a customer plus whatever they spend above the card value.',
        impact_es: 'Los bares y pubs sobre-indexan en tarjetas de regalo — rellenos de medias navideñas, regalos de cumpleaños, regalos de agradecimiento de cuentas corporativas. Cada tarjeta no canjeada es puro ingreso; cada canjeada trae un cliente más lo que gaste por encima del valor de la tarjeta.',
        unverifiedNote: 'Bar gift cards especially benefit from a simple online checkout. Square and Toast both do this well; Tripleseat if you already use it for events.',
        unverifiedNote_es: 'Las tarjetas de regalo de bar en especial se benefician de un checkout simple en línea. Square y Toast lo hacen bien; Tripleseat si ya lo usas para eventos.'
      },
      'bakery': {
        impact: 'Bakery gift cards convert well for birthday presents, corporate gifts, and the "sorry I forgot the birthday cake" save. They are also one of the easiest ways to capture a repeat customer from a one-time visitor.',
        impact_es: 'Las tarjetas de regalo de panadería convierten bien para regalos de cumpleaños, regalos corporativos y el rescate de "perdón, olvidé el pastel de cumpleaños". También son una de las formas más fáciles de convertir un visitante único en cliente repetido.',
        unverifiedNote: 'A gift-card purchase page on your bakery site with $25, $50, $100 presets is the baseline. Square and Toast both handle this natively; email-delivered e-cards make same-day gift purchases possible.',
        unverifiedNote_es: 'Una página de compra de tarjetas de regalo en tu sitio de panadería con presets de $25, $50, $100 es la base. Square y Toast ambos lo manejan nativamente; las e-cards entregadas por correo permiten compras de regalo el mismo día.'
      },
      'ghost-kitchen': {
        impact: 'Gift cards matter less for ghost kitchens (customers who never visit are unlikely to gift-card-gift the experience), but digital e-cards still add revenue around holidays — and matter for corporate catering accounts.',
        impact_es: 'Las tarjetas de regalo importan menos para las cocinas fantasma (los clientes que nunca visitan difícilmente regalarán la experiencia), pero las e-cards digitales aún añaden ingresos en las fiestas — y importan para las cuentas de catering corporativo.'
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
    impact_es: 'Los programas de lealtad suben la frecuencia de visita repetida entre 15-30% en promedio — una diferencia material para un negocio de márgenes delgados. Las herramientas modernas (Thanx, Paytronix, Square Loyalty) se integran con el POS, así cada visita acumula sin tarjeta perforada, que es la vara real para que se adopte.',
    pass: 'Your site promotes a loyalty program',
    pass_es: 'Tu sitio promueve un programa de lealtad',
    passNote: '{detected} on your site — repeat-visit frequency is where restaurant margin lives, and you have the infrastructure to compound it.',
    passNote_es: '{detected} en tu sitio — la frecuencia de visitas repetidas es donde vive el margen de un restaurante, y ya tienes la infraestructura para acumularlo.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t spot a loyalty program — is this right?',
    unverified_es: 'No vimos un programa de lealtad — ¿es correcto?',
    unverifiedNote: 'We scan for loyalty text ("rewards program", "earn points", "join our rewards") and known platforms (Thanx, LevelUp, Paytronix, Como, Fivestars, Loyalzoo). If you run one we missed, tell us. If you do not have one yet, a modern POS-integrated loyalty program pays back in 90-120 days for most casual-dining and fast-casual restaurants.',
    unverifiedNote_es: 'Buscamos texto de lealtad ("programa de recompensas", "gana puntos", "únete a recompensas") y plataformas conocidas (Thanx, LevelUp, Paytronix, Como, Fivestars, Loyalzoo). Si corres uno que pasamos por alto, dínoslo. Si aún no tienes, un programa moderno integrado al POS se paga solo en 90-120 días para la mayoría de restaurantes casual-dining y fast-casual.'
  },
  {
    // Phase H4: Email newsletter capture.
    type: 'email-capture',
    weight: 0.4,
    anchor: '#newsletter-capture',
    effort: 'dev',
    minutes: 60,
    impact: 'An email list is the only marketing channel you OWN — Instagram can ghost you, Google can change the rules, but your list keeps compounding. Restaurants with a newsletter capture typically see 3-5x higher repeat-visit rates from subscribers vs. non-subscribers.',
    impact_es: 'Una lista de correo es el único canal de marketing que TÚ posees — Instagram puede silenciarte, Google puede cambiar las reglas, pero tu lista sigue creciendo. Los restaurantes con captura de newsletter suelen ver tasas de visita repetida 3-5× mayores de suscriptores vs no suscriptores.',
    pass: 'Your site captures newsletter signups',
    pass_es: 'Tu sitio capta suscripciones al newsletter',
    passNote: '{detected} on your site — you are building an owned audience, which is the single most valuable marketing asset a restaurant can accumulate.',
    passNote_es: '{detected} en tu sitio — estás construyendo una audiencia propia, el activo de marketing más valioso que un restaurante puede acumular.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t spot a newsletter capture — is this right?',
    unverified_es: 'No vimos captura de newsletter — ¿es correcto?',
    unverifiedNote: 'We look for an email input paired with newsletter language (subscribe / join our list / newsletter) OR a form action pointing at Mailchimp, Klaviyo, ConvertKit, Constant Contact, or similar. If yours is elsewhere or the form is in a modal we didn\'t render, let us know.',
    unverifiedNote_es: 'Buscamos una entrada de correo junto a texto de newsletter (suscríbete / únete a la lista / newsletter) O un action del formulario apuntando a Mailchimp, Klaviyo, ConvertKit, Constant Contact u otros. Si el tuyo está en otro lado o en un modal que no renderizamos, avísanos.'
  },
  {
    // Phase H5: Catering / private-events page presence.
    // Evaluated from the crawl bundle: a slot='catering' or
    // slot='events' page counts as a pass. Subtype weights in
    // subtypes.js make this a 2.5x bump for catering-only and
    // boost for fine-dining / bar-pub.
    type: 'catering-page',
    weight: 0.75,
    anchor: '#catering-page',
    effort: 'rebuild',
    minutes: 180,
    impact: 'A dedicated catering or private-events page is how most corporate planners and wedding organizers FIND caterers — it captures the long-tail search traffic ("catering Brooklyn", "private dining party of 30") that the homepage never ranks for.',
    impact_es: 'Una página dedicada de catering o eventos privados es cómo la mayoría de los planificadores corporativos y organizadores de bodas ENCUENTRAN catering — captura el tráfico long-tail ("catering Brooklyn", "cena privada grupo de 30") por el que la página principal nunca rankea.',
    pass: 'You have a catering / events page',
    pass_es: 'Tienes una página de catering / eventos',
    passNote: 'Your site links to a dedicated catering or events page — planners searching for private dining in your area can land directly on a page that sells the offering.',
    passNote_es: 'Tu sitio enlaza a una página dedicada de catering o eventos — los planificadores buscando cenas privadas en tu zona pueden aterrizar directamente en una página que vende la oferta.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t find a catering or events page — is this right?',
    unverified_es: 'No encontramos una página de catering o eventos — ¿es correcto?',
    unverifiedNote: 'We look for links labelled "Catering", "Private Events", "Parties", or "Weddings" in your navigation. If you do host events but the page is named differently, let us know. If you don\'t today, a catering page is one of the highest-ROI additions for any restaurant with dining-room capacity.',
    unverifiedNote_es: 'Buscamos enlaces etiquetados "Catering", "Eventos Privados", "Fiestas" o "Bodas" en tu navegación. Si haces eventos pero la página se llama distinto, avísanos. Si hoy no, una página de catering es una de las adiciones de más alto ROI para cualquier restaurante con capacidad de comedor.',
    byType: {
      'fine-dining': {
        impact: 'Private-dining rooms and buyouts are the margin engine of fine-dining — a single corporate holiday party pays for a slow week. A dedicated events page with capacity, sample menus, and photo gallery is what the event planners searching "private dining [city]" actually land on.',
        impact_es: 'Los salones privados y buyouts son el motor de margen del fine-dining — una sola fiesta corporativa de fiestas paga una semana lenta. Una página dedicada de eventos con capacidad, menús de muestra y galería de fotos es donde los planificadores de eventos buscando "cenas privadas [ciudad]" realmente aterrizan.'
      },
      'catering-only': {
        impact: 'For a catering-only business the catering page IS the site. It\'s where packages, per-head pricing, dietary accommodations, minimum order sizes, service radius, lead time, and the RFQ form all live. Without it, planners comparing vendors leave for a competitor with clearer info.',
        impact_es: 'Para un negocio solo de catering, la página de catering ES el sitio. Es donde viven los paquetes, precios por cabeza, acomodaciones dietéticas, tamaños mínimos de pedido, radio de servicio, tiempo de anticipación y el formulario RFQ. Sin ella, los planificadores comparando vendedores se van con un competidor que tenga info más clara.'
      },
      'bar-pub': {
        impact: 'Private parties (birthdays, work socials, whiskey tastings) are high-ticket bar revenue that walks in by appointment. A dedicated events page with capacity, packages, and a Tripleseat / inquiry form converts those bookings that would otherwise end up in a lost email thread.',
        impact_es: 'Las fiestas privadas (cumpleaños, reuniones de trabajo, catas de whiskey) son ingresos de alto valor en un bar que llegan por cita. Una página dedicada de eventos con capacidad, paquetes y un formulario Tripleseat / consulta convierte esas reservas que de otra forma terminarían en un hilo de correos perdido.'
      }
    }
  },
  {
    // Phase H6: Age-gate presence. Suppressed (weight 0) for EVERY
    // current restaurant subtype — bars and breweries included.
    // Age-gates on the web are rarely mandated by state ABC rules
    // for restaurants; they mostly apply to packaged-alcohol retail,
    // cannabis dispensaries, and vape/tobacco shops. Those are not
    // restaurant subtypes today, but if one is ever added (e.g.
    // 'liquor-store' or 'dispensary') it can set a non-zero weight
    // in its own subtypes.js entry without touching this definition.
    type: 'age-gate',
    weight: 1.0, // default unused; all subtypes override to 0
    anchor: '#subtype-bar-pub',
    effort: 'dev',
    minutes: 45,
    impact: 'For bars, pubs, and breweries, an age-gate on the site shows regulators you care about compliance and protects you if an underage visitor sees your promotional content. Almost every state ABC / TTB program expects it, and platforms increasingly penalize non-compliant sites in ad delivery.',
    impact_es: 'Para bares, pubs y cervecerías, un age-gate en el sitio le muestra a los reguladores que te importa el cumplimiento y te protege si un visitante menor ve contenido promocional. Casi todo programa estatal ABC / TTB lo espera, y las plataformas cada vez más penalizan sitios no cumplidores en la entrega de anuncios.',
    pass: 'Your site gates underage visitors',
    pass_es: 'Tu sitio bloquea visitantes menores de edad',
    passNote: 'Your site asks visitors to confirm they are of legal drinking age before seeing beverage content — this is the baseline compliance move for any bar or brewery.',
    passNote_es: 'Tu sitio pide a los visitantes confirmar que tienen edad legal antes de ver contenido de bebidas — la jugada básica de cumplimiento para cualquier bar o cervecería.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t spot an age-gate — is this right?',
    unverified_es: 'No vimos un age-gate — ¿es correcto?',
    unverifiedNote: 'We look for "are you 21 or older", "confirm your age", "verify your age" modals. If your age-gate is conditional on a country param or lives in a script we didn\'t render, let us know — and if you don\'t have one yet, this is a 45-minute developer task worth prioritizing.',
    unverifiedNote_es: 'Buscamos modales "¿tienes 21 años o más?", "confirma tu edad", "verifica tu edad". Si tu age-gate depende de un parámetro de país o vive en un script que no renderizamos, avísanos — y si aún no lo tienes, esta es una tarea de desarrollo de 45 minutos que vale la pena priorizar.'
  },
  {
    // Phase H7: Food-truck schedule page presence. Food trucks
    // move; a schedule page IS the site's primary purpose.
    // Subtypes.js weights this 2.0 for food-truck and 0 for
    // every other subtype.
    type: 'food-truck-schedule',
    weight: 1.0,
    anchor: '#subtype-food-truck',
    effort: 'dev',
    minutes: 60,
    impact: 'Every food-truck customer arrives with the same question: "where are you today?" A visible weekly schedule, a today\'s-location block, or at minimum a "Find us" page with your Instagram feed is the primary job of a food-truck website.',
    impact_es: 'Todo cliente de un food truck llega con la misma pregunta: "¿dónde están hoy?" Un horario semanal visible, un bloque de ubicación del día, o como mínimo una página "Encuéntranos" con tu feed de Instagram es el trabajo principal de un sitio de food truck.',
    pass: 'Your site shows a schedule / location',
    pass_es: 'Tu sitio muestra horario / ubicación',
    passNote: 'Your site answers "where are you today?" directly — customers can find you without scrolling to your Instagram.',
    passNote_es: 'Tu sitio responde "¿dónde están hoy?" directamente — los clientes te encuentran sin tener que bajar hasta tu Instagram.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t find a schedule / location page — is this right?',
    unverified_es: 'No encontramos una página de horario / ubicación — ¿es correcto?',
    unverifiedNote: 'We look for "today\'s location", "this week\'s schedule", "find us at", "catch us at" copy. If your schedule lives inline on the homepage or in an Instagram embed we didn\'t render, let us know. If you don\'t publish a schedule today — publishing one is the single highest-ROI change you can make on a food-truck site.',
    unverifiedNote_es: 'Buscamos texto como "ubicación de hoy", "horario de esta semana", "encuéntranos en", "nos ves en". Si tu horario vive inline en la página principal o en un embed de Instagram que no renderizamos, avísanos. Si hoy no publicas un horario — publicar uno es el cambio de mayor ROI en un sitio de food truck.'
  },
  {
    // Phase H8: Ghost-kitchen / delivery-only explicit marker.
    // Subtypes.js weights this 2.0 for ghost-kitchen and 0
    // elsewhere. A ghost kitchen that doesn't SAY "delivery
    // only" confuses customers who arrive expecting dine-in.
    type: 'aggregator-only',
    weight: 1.0,
    anchor: '#subtype-ghost-kitchen',
    effort: 'self',
    minutes: 20,
    impact: 'Ghost kitchens that don\'t explicitly mark "delivery only" or "no dine-in" get customers showing up in person to an empty storefront — worse, getting a one-star review for "I drove there and it was closed." A single visible "Delivery & Pickup Only" banner deflects that confusion.',
    impact_es: 'Las cocinas fantasma que no marcan explícitamente "solo delivery" o "sin dine-in" terminan con clientes que llegan en persona a un local vacío — peor, con una reseña de una estrella "manejé hasta allá y estaba cerrado". Un solo banner visible de "Solo delivery y pickup" desvía esa confusión.',
    pass: 'Your site marks delivery-only clearly',
    pass_es: 'Tu sitio marca claramente solo-delivery',
    passNote: 'Your site explicitly states "delivery only" / "virtual kitchen" so customers don\'t show up expecting dine-in.',
    passNote_es: 'Tu sitio dice explícitamente "solo delivery" / "cocina virtual" para que los clientes no se presenten esperando dine-in.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t see a delivery-only marker — is this right?',
    unverified_es: 'No vimos una marca de solo-delivery — ¿es correcto?',
    unverifiedNote: 'We look for "virtual kitchen", "ghost kitchen", "delivery only", "no dine-in", "delivery & pickup only" copy. If yours is phrased differently, let us know. If your site reads as a dine-in restaurant but you\'re actually ghost/delivery-only, add a banner — the 20-minute fix deflects a common one-star review.',
    unverifiedNote_es: 'Buscamos texto como "cocina virtual", "ghost kitchen", "solo delivery", "sin dine-in", "solo delivery y pickup". Si el tuyo está redactado distinto, avísanos. Si tu sitio se lee como un restaurante de dine-in pero en realidad eres ghost/solo delivery, agrega un banner — el arreglo de 20 minutos desvía una reseña de una estrella común.'
  },
  {
    // Phase H9: Wholesale / custom-order intake presence.
    // Subtypes.js gives bakery weight 2.0 and cafe weight 1.0;
    // other subtypes default to 1.0 (not suppressed).
    type: 'wholesale-custom-orders',
    weight: 1.0,
    anchor: '#subtype-bakery',
    effort: 'dev',
    minutes: 120,
    impact: 'For bakeries and cafes, custom orders and wholesale accounts are margin multipliers — a single wedding-cake order can match a week of walk-in revenue, and a standing wholesale account compounds month over month.',
    impact_es: 'Para panaderías y cafés, los pedidos personalizados y las cuentas de mayoreo multiplican el margen — un solo pedido de pastel de bodas puede igualar una semana de ingresos por walk-in, y una cuenta de mayoreo fija se acumula mes tras mes.',
    pass: 'Your site promotes wholesale / custom orders',
    pass_es: 'Tu sitio promueve pedidos de mayoreo / personalizados',
    passNote: 'Your site surfaces custom-order or wholesale intake — the margin-rich orders that don\'t happen without explicit copy and a form.',
    passNote_es: 'Tu sitio muestra la entrada de pedidos personalizados o de mayoreo — los pedidos de alto margen que no suceden sin copy explícito y un formulario.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t see wholesale / custom-order copy — is this right?',
    unverified_es: 'No vimos texto de mayoreo / pedidos personalizados — ¿es correcto?',
    unverifiedNote: 'We look for "custom order", "wholesale", "wedding cakes", "corporate orders", "bulk orders", "order in advance", "special orders". If yours is phrased differently, let us know. For bakeries specifically, a dedicated "Custom Orders" page with a structured intake form pays for itself fast.',
    unverifiedNote_es: 'Buscamos "pedido personalizado", "mayoreo", "pasteles de boda", "pedidos corporativos", "pedidos al mayoreo", "ordenar con anticipación", "pedidos especiales". Si el tuyo está redactado distinto, avísanos. Para panaderías en particular, una página dedicada de "Pedidos Personalizados" con un formulario estructurado se paga sola rápido.'
  },
  {
    // Phase H10: Delivery-radius info presence. Subtypes.js
    // gives pizzeria weight 1.5; other subtypes 1.0.
    type: 'delivery-radius',
    weight: 1.0,
    anchor: '#subtype-pizzeria',
    effort: 'self',
    minutes: 30,
    impact: 'Showing your delivery area saves every "do you deliver to me?" phone call. For pizzerias specifically, explicit zone info matters more than the map pin — a customer two neighborhoods over gives up if you look ambiguous.',
    impact_es: 'Mostrar tu zona de entrega ahorra cada llamada de "¿entregan aquí?" Para pizzerías en particular, la info explícita de zona importa más que el pin en el mapa — un cliente a dos colonias de distancia se rinde si te ves ambiguo.',
    pass: 'Your site shows delivery area / zone',
    pass_es: 'Tu sitio muestra zona / área de entrega',
    passNote: 'Your site explicitly says where you deliver — customers self-qualify without tying up your phone line.',
    passNote_es: 'Tu sitio dice explícitamente a dónde entregas — los clientes se auto-califican sin ocupar tu línea de teléfono.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t find delivery-area info — is this right?',
    unverified_es: 'No encontramos info de zona de entrega — ¿es correcto?',
    unverifiedNote: 'We look for "delivery radius", "we deliver to [list]", "delivery zone / area", "zip codes we serve", or "delivery within N miles". If yours is on an order-platform page we didn\'t reach, let us know. For pizzerias especially, a simple neighborhood / zip-code list is worth a line of copy on the homepage.',
    unverifiedNote_es: 'Buscamos "radio de entrega", "entregamos en [lista]", "zona / área de entrega", "códigos postales que servimos" o "entrega dentro de N millas". Si el tuyo está en una página de plataforma de pedidos que no alcanzamos, avísanos. Para pizzerías en especial, una lista simple de colonias / códigos postales merece una línea de copy en la página principal.'
  },
  {
    // Phase H11: Social proof (press, awards, chef bio).
    type: 'social-proof',
    weight: 0.5,
    anchor: '#social-proof',
    effort: 'self',
    minutes: 45,
    impact: 'Visible press quotes and awards convert skeptical new diners at measurably higher rates. "Featured in Eater" or a Michelin mention on the homepage is the single highest-credibility signal you can show a first-time visitor deciding whether to book.',
    impact_es: 'Las citas de prensa y premios visibles convierten a comensales nuevos escépticos a tasas medibles más altas. "Presentado en Eater" o una mención Michelin en la página principal es la señal de credibilidad más alta que puedes mostrar a un visitante por primera vez decidiendo si reservar.',
    pass: 'Your site shows press / awards / chef bio',
    pass_es: 'Tu sitio muestra prensa / premios / bio del chef',
    passNote: 'Your site surfaces social proof (press mentions, awards, or a chef bio) — which converts skeptical first-time visitors into bookings.',
    passNote_es: 'Tu sitio muestra prueba social (menciones de prensa, premios o bio del chef) — lo que convierte a visitantes escépticos por primera vez en reservas.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t find press / awards / chef copy — is this right?',
    unverified_es: 'No encontramos texto de prensa / premios / chef — ¿es correcto?',
    unverifiedNote: 'We look for "featured in", "as seen in", "accolades", "Michelin", "James Beard", "Eater", "NYT review", or chef bio copy ("meet the chef", "our chef"). If your press is on an about page we didn\'t reach, let us know. If you have press you\'re not showing — surfacing it on the homepage is free conversion.',
    unverifiedNote_es: 'Buscamos "destacados en", "como se vio en", "reconocimientos", "Michelin", "James Beard", "Eater", "reseña NYT" o bio del chef ("conoce al chef", "nuestro chef"). Si tu prensa está en una página "About" que no alcanzamos, avísanos. Si tienes prensa que no estás mostrando — sacarla en la página principal es conversión gratis.'
  },
  {
    // Phase H12: Sustainability / sourcing claims.
    type: 'sustainability',
    weight: 0.4,
    anchor: '#trust',
    effort: 'self',
    minutes: 30,
    impact: 'Sustainability claims (locally sourced, farm-to-table, organic, seasonal) signal quality and values in one line of copy. For a meaningful slice of guests this matters MORE than the menu itself — and it raises the perceived average check.',
    impact_es: 'Las declaraciones de sostenibilidad (producto local, farm-to-table, orgánico, de temporada) comunican calidad y valores en una sola línea. Para una porción significativa de los comensales esto importa MÁS que el menú mismo — y sube el cheque promedio percibido.',
    pass: 'Your site makes sourcing / sustainability claims',
    pass_es: 'Tu sitio hace declaraciones de origen / sostenibilidad',
    passNote: 'Your site explicitly surfaces sustainability or sourcing (local farms, seasonal, organic, farm-to-table, etc.) — which raises perceived quality and attracts a loyal segment of diners.',
    passNote_es: 'Tu sitio muestra explícitamente sostenibilidad o abastecimiento (granjas locales, de temporada, orgánico, farm-to-table, etc.) — lo que eleva la calidad percibida y atrae a un segmento leal de comensales.',
    fail: null,
    failNote: null,
    unverified: 'We didn\'t find sourcing claims — is this right?',
    unverified_es: 'No encontramos declaraciones de origen — ¿es correcto?',
    unverifiedNote: 'We look for "locally sourced", "farm-to-table", "organic", "sustainable", "seasonal menu", "single-origin", "grass-fed", and related markers. If your sourcing story lives in a photo caption or on a supplier page, let us know. If you\'re sourcing thoughtfully but not saying so, this is a one-afternoon content change.',
    unverifiedNote_es: 'Buscamos "producto local", "farm-to-table", "orgánico", "sostenible", "menú de temporada", "origen único", "alimentado con pasto" y marcadores similares. Si tu historia de abastecimiento vive en una leyenda de foto o una página de proveedores, avísanos. Si te abasteces con cuidado pero no lo dices, este es un cambio de contenido de una tarde.'
  },
  {
    // Phase H13: Photo coverage. Checks image count + alt-text
    // coverage. Restaurants need food photography — sparse
    // imagery kills conversion across every subtype.
    type: 'photo-coverage',
    weight: 0.5,
    anchor: '#real-photos',
    effort: 'self',
    minutes: 120,
    impact: 'Food photography is how restaurants sell online — a homepage with 3 images converts worse than one with 10, and alt-text makes those images accessible and SEO-indexable. Empty-alt or broken-alt photos are invisible to Google and to screen readers.',
    impact_es: 'La fotografía de comida es cómo los restaurantes venden en línea — una página principal con 3 imágenes convierte peor que una con 10, y el alt-text hace esas imágenes accesibles e indexables para SEO. Las fotos sin alt o con alt roto son invisibles para Google y para lectores de pantalla.',
    pass: 'Your site has strong photo coverage',
    pass_es: 'Tu sitio tiene buena cobertura fotográfica',
    passNote: 'Your homepage carries enough photography AND enough alt-text to do both jobs food images are supposed to do: sell the food and rank in Google Images.',
    passNote_es: 'Tu página principal lleva suficiente fotografía Y suficiente alt-text para hacer los dos trabajos que las imágenes de comida deben hacer: vender la comida y rankear en Google Imágenes.',
    fail: 'Your site has sparse or unlabeled photos',
    fail_es: 'Tu sitio tiene fotos escasas o sin etiquetas',
    failNote: 'Homepages need at least 5 good food photos AND at least half of them need real alt-text ("smoked brisket plate with pickled onions" not "image1.jpg"). Both matter: photography drives conversion; alt-text drives accessibility and Google Images traffic.',
    failNote_es: 'Las páginas principales necesitan al menos 5 buenas fotos de comida Y al menos la mitad necesita alt-text real ("plato de brisket ahumado con cebolla encurtida" y no "image1.jpg"). Ambas importan: la fotografía impulsa conversión; el alt-text impulsa accesibilidad y tráfico de Google Imágenes.',
    unverified: 'We couldn\'t read your image set',
    unverified_es: 'No pudimos leer tu conjunto de imágenes',
    unverifiedNote: 'The crawl didn\'t return enough HTML for us to count images reliably. Retry the audit, or paste the homepage URL into our manual-audit queue so we can look by hand.',
    unverifiedNote_es: 'El rastreo no devolvió suficiente HTML para contar imágenes de forma confiable. Vuelve a auditar, o pega la URL de la página principal en nuestra cola manual para revisarla a mano.'
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
    anchor: '#opening-hours-specification',
    effort: 'dev',
    minutes: 30,
    impact: 'Google Rich Results for restaurants wants a full 7-day hours listing — partial coverage causes the "hours vary" fallback, which erodes trust with "are they open right now?" searchers. Every day needs an entry in openingHoursSpecification, even if opens/closes are null for a closed day.',
    impact_es: 'Los Rich Results de Google para restaurantes quieren un listado completo de 7 días — la cobertura parcial provoca el fallback "los horarios varían", que erosiona la confianza de quien busca "¿están abiertos ahora?". Cada día necesita una entrada en openingHoursSpecification, incluso si opens/closes son null para un día cerrado.',
    pass: 'Your schema declares 7-day hours',
    pass_es: 'Tu schema declara los 7 días de horario',
    passNote: 'Your JSON-LD schema publishes hours for every day of the week — Google can render a full hours table in Rich Results and Map snippets.',
    passNote_es: 'Tu schema JSON-LD publica horarios para cada día de la semana — Google puede renderizar una tabla completa en Rich Results y en los snippets del mapa.',
    fail: 'Your schema hours are incomplete',
    fail_es: 'Tus horarios de schema están incompletos',
    failNote: 'Your site declares hours in schema but not for every day of the week. Google falls back to a "hours vary" hint, which hurts click-through from "restaurants open now" searches. Add an openingHoursSpecification entry for every day of the week in your JSON-LD block (closed days can have opens/closes set to null). <a href="/tools/open-hours/" style="color:var(--teal);font-weight:600;">Generate it with Open Hours →</a>',
    failNote_es: 'Tu sitio declara horarios en schema pero no para cada día de la semana. Google cae al mensaje "los horarios varían", lo que reduce el click-through en búsquedas de "restaurantes abiertos ahora". Agrega una entrada openingHoursSpecification para cada día de la semana en tu bloque JSON-LD (los días cerrados pueden tener opens/closes en null). <a href="/es/tools/open-hours/" style="color:var(--teal);font-weight:600;">Genéralo con Open Hours →</a>',
    unverified: 'We couldn\'t confirm schema hours',
    unverified_es: 'No pudimos confirmar los horarios del schema',
    unverifiedNote: 'Your schema markup didn\'t declare opening hours at all (or we couldn\'t read it). Adding a complete openingHoursSpecification block is one of the highest-impact single edits you can make for local-search click-through. <a href="/tools/open-hours/" style="color:var(--teal);font-weight:600;">Generate it with Open Hours →</a>',
    unverifiedNote_es: 'Tu schema no declaró horarios en absoluto (o no pudimos leerlo). Agregar un bloque openingHoursSpecification completo es una de las ediciones individuales de mayor impacto que puedes hacer para el click-through en búsqueda local. <a href="/es/tools/open-hours/" style="color:var(--teal);font-weight:600;">Genéralo con Open Hours →</a>'
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
// Sprint M1.11: extended hosts list catches the POS-native loyalty
// subdomains and a few newer vendors. toasttab.com + squareup.com
// host loyalty landing pages for their restaurant customers under
// /rewards or /loyalty paths; looking for those specific paths in
// the URL catches them even when the top-level host isn't in the
// list. Punchh is the largest QSR-focused loyalty SaaS not yet
// listed. fivestars-rewards is the domain most deploys use.
// Hotfix B3: keyword set widened to catch the brand-prefixed
// patterns most chains actually use ("Tacombi Rewards",
// "Chipotle Rewards", "Starbucks Rewards") plus the value-prop
// phrases that mean the same thing ("free tacos for life",
// "free coffee on your birthday", "earn a free X every N visits").
// Previously the regex required phrases like "loyalty program" or
// "rewards program" verbatim, which missed every chain that just
// brands their program by name. Tacombi reproduced this exactly:
// their landing page says "Tacombi Rewards · Free Tacos for Life"
// — neither phrase matched the old keyword set.
//
// Conservative additions: only patterns that genuinely indicate a
// loyalty program. Plain "rewards" or "points" without a
// program-context word would over-fire (every payment-processor
// page mentions "rewards"; every nutrition page mentions "points").
var LOYALTY_PATTERNS = {
  keywords: new RegExp([
    // Original program-name patterns
    '\\bloyalty\\s+program\\b',
    '\\brewards\\s+program\\b',
    '\\bearn\\s+(?:points|rewards|stars|credits)\\b',
    '\\bjoin\\s+our\\s+rewards\\b',
    '\\bsign\\s+up\\s+for\\s+rewards\\b',
    '\\bloyalty\\s+(?:club|members)\\b',
    '\\bmy\\s+rewards\\b',
    '\\bmember\\s+rewards\\b',
    // B3 additions — brand-prefixed program names
    "\\b[a-z][a-z'’]{2,20}\\s+rewards\\b(?!\\s+for)",  // "Tacombi rewards", "Starbucks rewards"
    '\\bjoin\\s+rewards\\b',
    '\\bjoin\\s+(?:the\\s+)?(?:loyalty|rewards)\\b',
    '\\bredeem\\s+(?:points|rewards|stars)\\b',
    // Value-prop phrasing (free X via repeat purchase)
    '\\bfree\\s+\\w+\\s+for\\s+life\\b',                 // "free tacos for life", "free pizza for life"
    '\\bfree\\s+\\w+\\s+on\\s+(?:your\\s+)?birthday\\b', // "free entree on your birthday"
    '\\bfree\\s+\\w+\\s+every\\s+(?:\\d+|tenth|fifth)',  // "free coffee every 10 visits"
    // Membership / app patterns
    '\\bmembership\\s+(?:program|benefits|perks)\\b',
    '\\b(?:download|get)\\s+(?:our|the)\\s+app\\s+(?:and|for)\\s+rewards\\b',
    '\\b(?:our|the)\\s+(?:loyalty|rewards)\\s+app\\b',
  ].join('|'), 'i'),
  hosts: [
    'thanx.com', 'thelevelup', 'paytronix', 'como.com', 'fivestars',
    'fivestars-rewards', 'loyalzoo', 'punchcard', 'hang.com', 'belly',
    'spendgo', 'punchh.com', 'smile.io', 'yotpo.com', 'kangaroorewards',
    'stampme', 'loopyloyalty', 'tapmango', 'toast-rewards',
    'square-loyalty', '/rewards', '/loyalty', 'toasttab.com/rewards',
    'squareup.com/app/loyalty',
    // B3: additional loyalty platforms / common page slugs
    'spotonloyalty', 'spoton.com/loyalty', 'lavu.com/loyalty',
    'cardfree', 'launchcontrol', 'olo.com/loyalty', 'incentivio',
    '/membership', '/perks', '/loyalty-program', '/rewards-program',
    'getopen.app', 'apple.com/app-store/loyalty'
  ]
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
  // Sprint M1.12: also scan <form action="..."> attributes directly.
  // Many restaurant sites have the ESP target on the form action but
  // the URL never appears elsewhere on the page (so it wouldn't be
  // in allUrls), and some ESPs use subdomain tokens our host list
  // can't anticipate. This catches the common self-hosted-signup
  // shape (site.com action=https://list-manage.com/subscribe...)
  // that detection would otherwise miss.
  var hasFormEsp = false;
  var formActionRe = /<form[^>]*action\s*=\s*["']([^"']+)["']/gi;
  var fm;
  while (!hasFormEsp && (fm = formActionRe.exec(html)) !== null) {
    var action = fm[1].toLowerCase();
    for (var hi = 0; hi < EMAIL_CAPTURE_HOSTS.length; hi++) {
      if (action.indexOf(EMAIL_CAPTURE_HOSTS[hi]) >= 0) { hasFormEsp = true; break; }
    }
  }
  // Pass when we have EITHER a recognized provider (hasHost,
  // hasFormEsp) OR an email input + newsletter copy pair. An email
  // input alone is usually a contact-form, which isn't a newsletter
  // capture.
  var present = hasHost || hasFormEsp || (hasEmailInput && hasNewsletterCopy);
  return { present: present, hasEmailInput: hasEmailInput, hasNewsletterCopy: hasNewsletterCopy, hasHost: hasHost, hasFormEsp: hasFormEsp };
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

// ---------------------------------------------------------------------------
// Sprint BB1: POWERED_BY — single source of truth for every API,
// framework, and data source the audit tool actually uses at runtime.
// Rendered in the "How this audit was built" footer, the PDF cover,
// the share-card PNG footer, and the OG / Twitter descriptions so
// there is exactly one place to update when we add or remove a data
// source. Each entry carries { name, vendor, license, role, url }.
// ---------------------------------------------------------------------------
var POWERED_BY = [
  { name: 'Lighthouse',           vendor: 'Google',             license: 'Apache-2.0', role: 'Performance / Accessibility / Best Practices / SEO scoring',
    role_es: 'Puntuación de rendimiento / accesibilidad / buenas prácticas / SEO',
    url: 'https://developer.chrome.com/docs/lighthouse/overview' },
  { name: 'PageSpeed Insights',   vendor: 'Google',             license: 'Proprietary API', role: 'Hosted Lighthouse runs + CrUX field data',
    role_es: 'Ejecuciones alojadas de Lighthouse + datos de campo CrUX',
    url: 'https://pagespeed.web.dev/' },
  { name: 'Chrome UX Report',     vendor: 'Google',             license: 'Open dataset', role: 'Real-user Core Web Vitals (LCP / CLS / INP)',
    role_es: 'Métricas Web Esenciales reales (LCP / CLS / INP)',
    url: 'https://developer.chrome.com/docs/crux' },
  { name: 'schema.org',           vendor: 'schema.org',         license: 'CC-BY-SA',   role: 'Restaurant JSON-LD vocabulary',
    role_es: 'Vocabulario JSON-LD para restaurantes',
    url: 'https://schema.org/Restaurant' },
  { name: 'Plausible Analytics',  vendor: 'Plausible',          license: 'AGPL-3.0',   role: 'Privacy-respecting audit event counters',
    role_es: 'Contadores de eventos de auditoría respetando la privacidad',
    url: 'https://plausible.io/' },
  { name: 'jsPDF',                vendor: 'parallax',           license: 'MIT',        role: 'Client-side PDF export',
    role_es: 'Exportación de PDF en el navegador',
    url: 'https://github.com/parallax/jsPDF' },
  { name: 'Fraunces',             vendor: 'Undercase Type',     license: 'OFL-1.1',    role: 'Display / heading typeface',
    role_es: 'Tipografía de títulos y display',
    url: 'https://fonts.google.com/specimen/Fraunces' },
  { name: 'Inter',                vendor: 'Rasmus Andersson',   license: 'OFL-1.1',    role: 'Body / UI typeface',
    role_es: 'Tipografía de cuerpo y UI',
    url: 'https://rsms.me/inter/' },
  { name: 'Cloudflare Workers',   vendor: 'Cloudflare',         license: 'Proprietary runtime', role: 'Edge API: PSI proxy, page crawl, schema check',
    role_es: 'API en el edge: proxy PSI, rastreo de página, verificación de schema',
    url: 'https://workers.cloudflare.com/' },
  { name: 'Resend',               vendor: 'Resend',             license: 'Proprietary API', role: 'PDF delivery email',
    role_es: 'Envío del PDF por correo',
    url: 'https://resend.com/' }
];
// Helper for the "How this audit was built" footer — returns the
// role string in the current locale with EN fallback.
function poweredByRole(entry, lang) {
  if (!entry) return '';
  var L = lang || (typeof window !== 'undefined' && window.__muntinLang) || 'en';
  if (L === 'es' && entry.role_es) return entry.role_es;
  return entry.role || '';
}

// Sprint ES9: return a shallow-merged copy of a check definition with
// the localized string fields swapped in when window.__muntinLang is
// 'es'. Pattern: any field `foo` can have an `foo_es` sibling; when
// lang is 'es' and the _es variant is a non-empty string, it wins.
// Falls back to English silently if the _es variant is missing.
//
// Applied to the TOP-LEVEL check def and to each byType[subtype]
// override before rendering, so translators can localize either tier
// independently as coverage grows.
function localizeCheckCopy(def, lang) {
  if (!def) return def;
  var L = lang || (typeof window !== 'undefined' && window.__muntinLang) || 'en';
  if (L !== 'es') return def;
  var localeKeys = [
    'title', 'pass', 'fail', 'unverified', 'impact',
    'passNote', 'passNoteText', 'failNote', 'unverifiedNote'
  ];
  var out = null;
  for (var i = 0; i < localeKeys.length; i++) {
    var k = localeKeys[i];
    var esVal = def[k + '_es'];
    if (typeof esVal === 'string' && esVal.length > 0) {
      if (!out) {
        out = {};
        for (var key in def) {
          if (Object.prototype.hasOwnProperty.call(def, key)) out[key] = def[key];
        }
      }
      out[k] = esVal;
    }
  }
  return out || def;
}
// ---------------------------------------------------------------------------
// Sprint D2: Restaurant schema richness scorecard.
//
// Google's "Restaurant rich results" docs list a dozen-odd fields
// that the Knowledge Panel + Rich Results renderer can show if
// present. Missing fields don't invalidate the schema — they just
// silently cost the site visibility in the panel. This constant
// enumerates the fields that measurably matter, with:
//   key        — the schema.org / JSON-LD property name
//   label      — the human-readable label shown in the scorecard
//   priority   — 'required' | 'recommended' | 'optional' per Google's
//                own categorization in its Rich Results docs
//   benefit    — one-line "what this field buys you" for the UI
//   example    — a ready-to-paste JSON-LD fragment the owner can drop
//                into their Restaurant block. Uses placeholders in
//                angle brackets so it's obvious what to replace.
//
// The scorecard (client-side renderSchemaRichness) walks the
// restaurant-like objects returned by /api/schema-check and marks
// each field present/missing. Copy-paste buttons are rendered for
// every missing field.
// ---------------------------------------------------------------------------
var RESTAURANT_SCHEMA_FIELDS = [
  { key: 'name',                   label: 'Restaurant name',        priority: 'required',
    benefit_en: 'The business name as Google should display it.',
    benefit_es: 'El nombre del negocio como Google debe mostrarlo.',
    example: '"name": "<Your Restaurant>"' },
  { key: 'address',                label: 'Structured address',     priority: 'required',
    benefit_en: 'Unlocks the Maps pin, directions button, and local-pack ranking.',
    benefit_es: 'Desbloquea el pin del mapa, el botón de indicaciones y el posicionamiento del local-pack.',
    example: '"address": {\n  "@type": "PostalAddress",\n  "streetAddress": "<123 Main St>",\n  "addressLocality": "<City>",\n  "addressRegion": "<ST>",\n  "postalCode": "<00000>",\n  "addressCountry": "US"\n}' },
  { key: 'telephone',              label: 'Phone number',           priority: 'required',
    benefit_en: 'Tap-to-call surface in the Knowledge Panel.',
    benefit_es: 'Superficie tap-to-call en el Knowledge Panel.',
    example: '"telephone": "<+1-555-555-5555>"' },
  { key: 'url',                    label: 'Canonical website URL',  priority: 'required',
    benefit_en: 'The link Google uses in every rich result surface.',
    benefit_es: 'El enlace que Google usa en cada superficie de resultado enriquecido.',
    example: '"url": "<https://yourrestaurant.com/>"' },
  { key: 'image',                  label: 'Hero images',            priority: 'recommended',
    benefit_en: 'Images appear in the Knowledge Panel carousel.',
    benefit_es: 'Las imágenes aparecen en el carrusel del Knowledge Panel.',
    example: '"image": [\n  "<https://yourrestaurant.com/img/exterior.jpg>",\n  "<https://yourrestaurant.com/img/dining-room.jpg>",\n  "<https://yourrestaurant.com/img/hero-dish.jpg>"\n]' },
  { key: 'priceRange',             label: 'Price range',            priority: 'recommended',
    benefit_en: 'Enables price-based filtering in Maps and Search.',
    benefit_es: 'Permite filtros por precio en Maps y Search.',
    example: '"priceRange": "$$"' },
  { key: 'servesCuisine',          label: 'Cuisine',                priority: 'recommended',
    benefit_en: 'Matches you to queries like "Thai near me" or "Neapolitan pizza".',
    benefit_es: 'Te empareja con búsquedas como "tailandés cerca de mí" o "pizza napolitana".',
    example: '"servesCuisine": ["<Italian>", "<Neapolitan Pizza>"]' },
  { key: 'openingHoursSpecification', label: '7-day opening hours', priority: 'recommended',
    benefit_en: 'Powers the "Open now" / "Closes at 10 PM" hours panel.',
    benefit_es: 'Alimenta el panel "Abierto ahora" / "Cierra a las 10 PM".',
    example: '"openingHoursSpecification": [\n  {\n    "@type": "OpeningHoursSpecification",\n    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday"],\n    "opens": "11:00",\n    "closes": "22:00"\n  },\n  {\n    "@type": "OpeningHoursSpecification",\n    "dayOfWeek": ["Friday","Saturday"],\n    "opens": "11:00",\n    "closes": "23:00"\n  },\n  {\n    "@type": "OpeningHoursSpecification",\n    "dayOfWeek": "Sunday",\n    "opens": "11:00",\n    "closes": "21:00"\n  }\n]' },
  { key: 'acceptsReservations',    label: 'Reservation flag',       priority: 'recommended',
    benefit_en: 'Unlocks the "Reserve a table" Knowledge Panel button.',
    benefit_es: 'Desbloquea el botón "Reserva una mesa" del Knowledge Panel.',
    example: '"acceptsReservations": true' },
  { key: 'hasMenu',                label: 'Menu URL',               priority: 'recommended',
    benefit_en: 'Unlocks the "See menu" link Google shows next to the business.',
    benefit_es: 'Desbloquea el enlace "Ver menú" que Google muestra junto al negocio.',
    example: '"hasMenu": "<https://yourrestaurant.com/menu/>"' },
  { key: 'geo',                    label: 'Geo coordinates',        priority: 'recommended',
    benefit_en: 'Exact lat/lng improves Maps clustering and "near me" matching.',
    benefit_es: 'Latitud/longitud exactas mejoran el clustering del mapa y "cerca de mí".',
    example: '"geo": {\n  "@type": "GeoCoordinates",\n  "latitude": <38.9929>,\n  "longitude": <-77.0268>\n}' },
  { key: 'aggregateRating',        label: 'Aggregate rating',       priority: 'optional',
    benefit_en: 'Enables the gold-star rating cluster in search snippets.',
    benefit_es: 'Activa el racimo de estrellas doradas en los snippets de búsqueda.',
    example: '"aggregateRating": {\n  "@type": "AggregateRating",\n  "ratingValue": "<4.6>",\n  "reviewCount": "<127>"\n}' },
  { key: 'sameAs',                 label: 'Social links (sameAs)',  priority: 'optional',
    benefit_en: 'Connects your schema to your Instagram, Facebook, TripAdvisor, etc.',
    benefit_es: 'Conecta tu schema con tu Instagram, Facebook, TripAdvisor, etc.',
    example: '"sameAs": [\n  "<https://instagram.com/yourrestaurant>",\n  "<https://facebook.com/yourrestaurant>"\n]' },
  { key: 'paymentAccepted',        label: 'Payment methods',        priority: 'optional',
    benefit_en: 'Some surfaces show "Accepts credit cards" / "Apple Pay accepted".',
    benefit_es: 'Algunas superficies muestran "Acepta tarjetas" / "Apple Pay aceptado".',
    example: '"paymentAccepted": "Cash, Credit Card, Apple Pay"' }
];

// ---------------------------------------------------------------------------
// Sprint D4: Open Graph / Twitter Card completeness scorecard.
//
// Every share to Facebook, LinkedIn, iMessage, WhatsApp, Slack, or
// X ends up looking bare (plain URL + no thumbnail) when these five
// meta tags are missing. For a restaurant whose primary marketing
// channel is social, that's a meaningful loss of impression quality.
//
// Fields are the minimum-viable set that all five major share
// surfaces actually render. The example snippets use angle-bracket
// placeholders for the owner to fill in.
// ---------------------------------------------------------------------------
var OG_META_FIELDS = [
  { key: 'ogTitle',       label: 'og:title',        priority: 'required',
    benefit_en: 'The headline every social share surface reads first.',
    benefit_es: 'El titular que lee primero cada superficie de compartido social.',
    example: '<meta property="og:title" content="<Your Restaurant — short punchy headline>">' },
  { key: 'ogDescription', label: 'og:description',  priority: 'required',
    benefit_en: 'The one-line pitch under the headline in share cards.',
    benefit_es: 'La línea de presentación bajo el titular en las tarjetas al compartir.',
    example: '<meta property="og:description" content="<One sentence about your restaurant and what you serve>">' },
  { key: 'ogImage',       label: 'og:image',        priority: 'required',
    benefit_en: '1200×630 hero image. Without it, share cards look empty.',
    benefit_es: 'Imagen hero 1200×630. Sin ella, las tarjetas se ven vacías.',
    example: '<meta property="og:image" content="<https://yourrestaurant.com/og/hero.jpg>">' },
  { key: 'twitterCard',   label: 'twitter:card',    priority: 'recommended',
    benefit_en: 'Tells X / Twitter how to render your card ("summary_large_image" is the standard).',
    benefit_es: 'Le dice a X / Twitter cómo renderizar tu tarjeta ("summary_large_image" es el estándar).',
    example: '<meta name="twitter:card" content="summary_large_image">' },
  { key: 'twitterImage',  label: 'twitter:image',   priority: 'recommended',
    benefit_en: 'The image X / Twitter uses when og:image isn\'t enough.',
    benefit_es: 'La imagen que X / Twitter usa cuando og:image no es suficiente.',
    example: '<meta name="twitter:image" content="<https://yourrestaurant.com/og/hero.jpg>">' }
];

// Canonical one-line description used in OG/Twitter cards, PDF cover,
// share-card footer, and the tool's meta description. Exactly one
// source of truth — if this string changes, every surface updates.
var MUNTIN_AUDIT_DESCRIPTION = 'A Muntin Digital creation — a free restaurant website audit combining Google Lighthouse, PageSpeed Insights, CrUX field data, schema.org validation, and restaurant-specific checks. No signup, no paywall, no dark patterns.';
var MUNTIN_AUDIT_DESCRIPTION_ES = 'Una creación de Muntin Digital — una auditoría gratuita del sitio web de tu restaurante que combina Google Lighthouse, PageSpeed Insights, datos reales de CrUX, validación de schema.org y verificaciones específicas para restaurantes. Sin registro, sin muros de pago, sin trucos.';

// ---------------------------------------------------------------------------
// Sprint ES1: UI_I18N — the single translation map shared by both
// tools/audits/restaurant/index.html (EN) and es/tools/audits/
// restaurant/index.html (ES). Every string that a user reads on
// either page should live here; the t(key, vars) helper picks EN or
// ES based on window.__muntinLang (set early by the language-
// detection block in each HTML file). Adding a new string means a
// one-time edit in this file, not two edits per locale.
//
// Conventions:
//   - keys are dot-namespaced: 'ui.<section>.<purpose>'
//   - template variables use {name} placeholders
//   - when a translation is missing, t() falls back to English and
//     flags it on window.__auditMissingTranslations for scripts/
//     check-locale-parity.mjs to surface
// ---------------------------------------------------------------------------
var UI_I18N = {
  'ring.label': {
    en: '{score}/100',
    es: '{score}/100'
  },
  'ring.label.unverified': {
    en: '{score}/100 · {count} check{s} unverified',
    es: '{score}/100 · {count} verificaci{on} sin confirmar'
  },
  'verdict.90': {
    en: 'Your site is in great shape. Most restaurants would be thrilled to hit this score. Small polish items may remain — check the breakdown below.',
    es: 'Tu sitio está en excelente forma. La mayoría de los restaurantes estaría feliz con esta puntuación. Quedan pulidos menores — revisa el desglose abajo.'
  },
  'verdict.70': {
    en: 'Solid foundation with room to tighten up. Focus on the red and amber items below — most are mechanical fixes that push your scores into the green (90+) zone.',
    es: 'Base sólida con margen para ajustar. Concéntrate en los elementos rojos y ámbar abajo — la mayoría son arreglos mecánicos que suben tu puntuación a la zona verde (90+).'
  },
  'verdict.50': {
    en: "The site works, but it's leaking conversions. The good news: the wins here — load speed, image alt text, meta tags, schema — take days, not months, and they're listed in priority order below.",
    es: 'El sitio funciona, pero está dejando conversiones en la mesa. La buena noticia: las ganancias aquí — velocidad de carga, texto alternativo de imágenes, meta tags, schema — toman días, no meses, y están listadas por prioridad abajo.'
  },
  'verdict.below': {
    en: "There's real work to do. Scores in this range usually track with a template site hitting its ceiling — font sizes, tap targets, page speed, and schema markup all tend to be fixable, but they add up. Start with the failing items below, in the order they're listed.",
    es: 'Hay trabajo real por hacer. Puntuaciones en este rango suelen venir de un sitio plantilla que llegó a su tope — tamaños de fuente, áreas tocables, velocidad y marcado schema todos se pueden arreglar, pero se acumulan. Empieza con los elementos fallidos abajo, en el orden listado.'
  },
  'verdict.unverifiedSuffix': {
    en: " We couldn't verify {count} checks on this pass — each one is counted at half weight. Confirming them below will sharpen the score in either direction.",
    es: ' No pudimos verificar {count} verificaciones esta vez — cada una cuenta a medio peso. Confirmarlas abajo afinará la puntuación en cualquier dirección.'
  },
  // Sprint M1.16: after detector fusion, most well-covered
  // restaurants see zero unverified checks. Celebrate the
  // confidence so owners trust the score.
  'verdict.allAutoVerified': {
    en: " All {total} restaurant checks were verified automatically — from your Google Business Profile, your site's schema, and our multi-page crawl. No guesswork in this report.",
    es: ' Las {total} verificaciones de restaurante se confirmaron automáticamente — desde tu Perfil de Empresa de Google, el schema de tu sitio y nuestro rastreo multi-página. Sin adivinar nada en este reporte.'
  },
  'verdict.highAutoVerified': {
    en: ' {confirmed} of {total} checks confirmed automatically from Google Business Profile and your site. {unverified} need a second look — answer them below to sharpen your score.',
    es: ' {confirmed} de {total} verificaciones confirmadas automáticamente desde el Perfil de Empresa de Google y tu sitio. {unverified} necesitan una segunda mirada — respóndelas abajo para afinar tu puntuación.'
  },
  'topfixes.eta.rebuild': {
    en: 'One of these is a site rebuild — plan a month, not a weekend.',
    es: 'Una de estas es reconstruir el sitio — planifica un mes, no un fin de semana.'
  },
  'topfixes.eta.afternoon': {
    en: 'About one focused afternoon across all three.',
    es: 'Una tarde de trabajo concentrado entre las tres.'
  },
  'topfixes.eta.shortSelf': {
    en: '~1 afternoon — you can handle it yourself.',
    es: '~1 tarde — lo puedes resolver tú mismo.'
  },
  'topfixes.eta.shortDev': {
    en: '~1 afternoon of dev time.',
    es: '~1 tarde de trabajo de desarrollo.'
  },
  'topfixes.eta.weekendSelf': {
    en: '~1 weekend — doable on a Saturday.',
    es: '~1 fin de semana — se hace un sábado.'
  },
  'topfixes.eta.weekendDev': {
    en: '~1 weekend of dev time.',
    es: '~1 fin de semana de trabajo de desarrollo.'
  },
  'topfixes.eta.twoWeekends': {
    en: '~2 weekends of work — break into Saturday and the next.',
    es: '~2 fines de semana de trabajo — divídelo entre un sábado y el siguiente.'
  },
  'topfixes.eta.threeFourWeekends': {
    en: '~3–4 weekends of work — scope it like a mini-project.',
    es: '~3–4 fines de semana de trabajo — trátalo como un mini-proyecto.'
  },
  'topfixes.eta.many': {
    en: "Several weekends — stage it, don't try to do it all at once.",
    es: 'Varios fines de semana — organízalo por etapas, no intentes hacerlo todo de una vez.'
  },
  'chip.revenue': {
    en: 'Est. {low}–{high}/yr at risk',
    es: 'Est. {low}–{high}/año en riesgo'
  },
  'chip.revenue.title': {
    en: 'Order-of-magnitude estimate based on typical 50 covers/day × $35 avg check. Change these inputs to recalculate.',
    es: 'Estimación de orden de magnitud basada en 50 cubiertos/día × $35 cheque promedio típicos. Cambia estos valores para recalcular.'
  },
  'btc.confirmed': {
    en: 'You confirmed',
    es: 'Tú lo confirmaste'
  },
  'btc.high': {
    en: 'High confidence · {pct}%',
    es: 'Alta confianza · {pct}%'
  },
  'btc.medium': {
    en: 'Best guess · {pct}%',
    es: 'Mejor suposición · {pct}%'
  },
  'btc.uncertain': {
    en: 'Uncertain — please pick',
    es: 'Incierto — elige uno'
  },
  'btc.sub.confirmed': {
    en: "You told us what kind of restaurant this is — we're using it to tailor the checks below to your segment.",
    es: 'Nos dijiste qué tipo de restaurante es — lo usamos para ajustar las verificaciones de abajo a tu segmento.'
  },
  'btc.sub.low': {
    en: "We're not confident on this one. Pick the closest match so the checks below apply the right weights — otherwise we'll use a neutral baseline.",
    es: 'No estamos seguros aquí. Elige la opción más cercana para que las verificaciones de abajo apliquen los pesos correctos — si no, usamos una base neutral.'
  },
  'btc.sub.medium': {
    en: "Our best guess from schema markup, platform, and page content. If we got it wrong, pick the right one — the checks below will update live.",
    es: 'Nuestra mejor suposición según el schema, la plataforma y el contenido. Si nos equivocamos, elige el correcto — las verificaciones de abajo se actualizan en vivo.'
  },
  'btc.sub.high': {
    en: "Auto-detected from schema markup, ordering/reservation platform, and page content. If we got it wrong, pick the right one — the checks below will update live.",
    es: 'Detectado automáticamente por el schema, la plataforma de pedidos/reservas y el contenido. Si nos equivocamos, elige el correcto — las verificaciones de abajo se actualizan en vivo.'
  },
  'print.manager': {
    en: 'Print for your manager',
    es: 'Imprimir para tu gerente'
  },
  'print.worksheet.notes': {
    en: 'Notes / assigned to:',
    es: 'Notas / asignado a:'
  },
  // DYM3: "Did you mean" error-card chip copy.
  'err.dym.prompt': {
    en: 'Did you mean',
    es: '¿Quisiste decir'
  },
  // Sprint S2.5-S2.7: Deep Scan strings. Every key lands EN + ES so
  // the ES stamp picks them up without manual translation later.
  'deepScan.running': {
    en: 'Gathering deeper signals — security headers, site age, field-data trends, reviews…',
    es: 'Recopilando señales más profundas — encabezados de seguridad, antigüedad del sitio, tendencias reales, reseñas…'
  },
  'deepScan.done': {
    en: 'Deep-scan signals loaded.',
    es: 'Señales del deep-scan cargadas.'
  },
  'deepScan.noSignals': {
    en: 'No additional signals were available for this site.',
    es: 'No hubo señales adicionales disponibles para este sitio.'
  },
  'deepScan.eyebrow': { en: 'Deep scan', es: 'Deep scan' },
  // Sprint AUDIT-LOAD-FIX: idle (pre-start) + progress count keys so
  // the strip in tools/audits/restaurant/index.html can show the owner
  // visible movement even before any of the six fetches resolve. The
  // previous version went silent until the first chip rendered, which
  // for most small-restaurant sites meant the strip looked dead. The
  // loaderHint string is shown beneath the main loader subhead when
  // the Deep Scan toggle is checked, so the owner knows the audit
  // will continue after the report appears (otherwise the surprise
  // "still running" strip looks broken).
  'deepScan.idle': {
    en: 'Queued — runs after your report appears',
    es: 'En cola — se ejecuta después de que aparezca tu informe'
  },
  'deepScan.progress': {
    en: '{done}/{total} signals returned',
    es: '{done}/{total} señales devueltas'
  },
  'deepScan.loaderHint': {
    en: 'Deep scan continues after the report (1–2 min): security headers, site age, real-user data, Google reviews, email-deliverability.',
    es: 'El escaneo profundo continúa después del informe (1–2 min): encabezados de seguridad, antigüedad del sitio, datos reales de usuarios, reseñas de Google, salud del email.'
  },
  // Sprint AUDIT-LOAD-FIX: shown under the score verdict when the
  // mobile PSI run timed out and the tool fell back to desktop view.
  // Owners must know the score they're reading is the more forgiving
  // desktop view — otherwise they think their site is faster than it
  // actually is on a phone, which is exactly the device most of their
  // customers use. Lives in UI_I18N as data-tr-html so the <strong>
  // markup in EN survives translation to ES.
  'psi.fallback.note': {
    en: 'Speed test ran on <strong>desktop</strong> view — the mobile test took longer than Google allows. Mobile numbers usually score 15–30 points lower, so treat this as the optimistic case and prioritize the mobile fixes in the report below.',
    es: 'El test de velocidad se ejecutó en vista de <strong>escritorio</strong> — el test móvil tardó más de lo permitido por Google. Las puntuaciones móviles suelen estar 15–30 puntos por debajo, así que considera esto como el caso optimista y prioriza las correcciones móviles en el informe siguiente.'
  },
  // Phase 2 U4: hero deep-scan toggle copy. Was referenced as a
  // data-tr attribute in index.html but had no entry here, so a
  // Spanish visitor saw English on this single line. Adding it
  // here is the canonical fix — UI_I18N is now the single source
  // of truth for translation lookups.
  'hero.deepToggle': {
    en: 'Also run a deep scan (2–3 min) — security headers, CrUX history, site age, reviews',
    es: 'También ejecutar un escaneo profundo (2–3 min): encabezados de seguridad, historial CrUX, antigüedad del sitio, reseñas'
  },
  // Phase 2 U6: freshness timestamp chip on the score card. Owners
  // returning to a saved share link weeks later need to know whether
  // they're looking at fresh data or an old run. The chip flips
  // through "just now" → "5 minutes ago" → "2 hours ago" → "3 days
  // ago" → date for older audits. The full ISO stamp is always in
  // the tooltip.
  'freshness.justNow':   { en: 'Audited just now',                       es: 'Auditado ahora mismo' },
  'freshness.minutesAgo':{ en: 'Audited {count} minute{s} ago',          es: 'Auditado hace {count} minuto{s}' },
  'freshness.hoursAgo':  { en: 'Audited {count} hour{s} ago',            es: 'Auditado hace {count} hora{s}' },
  'freshness.daysAgo':   { en: 'Audited {count} day{s} ago',             es: 'Auditado hace {count} día{s}' },
  'freshness.onDate':    { en: 'Audited {date}',                         es: 'Auditado el {date}' },
  'freshness.tooltip':   { en: 'Re-run any time — the audit is free.',   es: 'Vuelve a ejecutarlo cuando quieras — la auditoría es gratis.' },
  // Sprint H1: 'since your last audit' banner copy.
  'history.eyebrow':  { en: 'Since your last audit', es: 'Desde tu última auditoría' },
  'history.hoursAgo': {
    en: '{count} hour{s} ago',
    es: 'hace {count} hora{s}'
  },
  'history.daysAgo': {
    en: '{count} day{s} ago',
    es: 'hace {count} día{s}'
  },
  'history.weeksAgo': {
    en: '{count} week{s} ago',
    es: 'hace {count} semana{s}'
  },
  // Sprint H3: resolved-since chips lead-in label.
  'history.resolvedLabel': {
    en: 'You resolved:',
    es: 'Resolviste:'
  },
  'deep.age.liveSince': {
    en: 'Google has known about this site since {year}',
    es: 'Google conoce este sitio desde {year}'
  },
  'deep.security.grade': {
    en: 'Site security grade: {grade}',
    es: 'Calificación de seguridad del sitio: {grade}'
  },
  'deep.crux.heading': {
    en: 'What real visitors actually experience',
    es: 'Lo que los visitantes reales experimentan'
  },
  'deep.crux.sub': {
    en: 'Page load, response time, and layout stability — measured from real Chrome users on your site over the last 25 weeks. Only shown when Google has enough samples to publish a trend. (Technical: Core Web Vitals from CrUX.)',
    es: 'Carga de página, tiempo de respuesta y estabilidad del diseño — medidos desde usuarios reales de Chrome en tu sitio durante las últimas 25 semanas. Solo se muestra cuando Google tiene suficientes muestras para publicar una tendencia. (Técnico: Core Web Vitals de CrUX.)'
  },
  'deep.reviews.heading': {
    en: 'Google reviews snapshot',
    es: 'Resumen de reseñas de Google'
  },
  'deep.reviews.countLine': {
    en: '{count} Google reviews',
    es: '{count} reseñas en Google'
  },
  'deep.reviews.ratingLine': {
    en: '{rating} average rating',
    es: 'Calificación promedio {rating}'
  },
  'deep.reviews.replyLine': {
    en: '{replied} of {sampled} recent have an owner reply',
    es: '{replied} de {sampled} recientes tienen respuesta del dueño'
  },
  'deep.reviews.ownerReplied': {
    en: 'owner replied',
    es: 'respondió el dueño'
  },
  // Phase 3 #4: review-responsiveness chip + urgent-unreplied callout.
  // Surfaces the computed reply rate AND flags the specific anti-
  // pattern of low-star reviews without an owner response — the
  // cluster Google's local-pack ranking punishes most.
  'deep.reviews.respChip':   {
    en: 'Responsiveness: {score}/100',
    es: 'Capacidad de respuesta: {score}/100'
  },
  'deep.reviews.respChip.title': {
    en: 'Replies to the {sampled} most recent reviews, with extra weight on unreplied 1–2 star reviews. Higher is better.',
    es: 'Respuestas a las {sampled} reseñas más recientes, con peso extra en reseñas de 1–2 estrellas sin respuesta. Más alto es mejor.'
  },
  'deep.reviews.urgentOne': {
    en: 'One unanswered low-star review in your recent {sampled} — replying within a day signals you care.',
    es: 'Una reseña negativa sin respuesta entre las últimas {sampled} — responder en un día demuestra que te importa.'
  },
  'deep.reviews.urgentMany': {
    en: '{count} of your {sampled} most recent reviews are 1–2 stars with no owner reply — a cluster worth addressing today.',
    es: '{count} de tus {sampled} reseñas más recientes son de 1–2 estrellas sin respuesta del dueño — un grupo a atender hoy.'
  },
  'deep.reviews.urgentBadge': {
    en: 'Needs your reply',
    es: 'Necesita tu respuesta'
  },
  // Sprint T1: Places-verified facts card.
  'places.verifiedBadge': {
    en: 'Verified by Google',
    es: 'Verificado por Google'
  },
  'places.heading': {
    en: 'What Google knows about this restaurant',
    es: 'Lo que Google sabe de este restaurante'
  },
  'places.hoursLabel': {
    en: 'Google-published hours',
    es: 'Horarios publicados por Google'
  },
  'places.operational': {
    en: 'Operating',
    es: 'En operación'
  },
  'places.ratingChip': {
    en: '★ {rating} · {count} reviews',
    es: '★ {rating} · {count} reseñas'
  },
  'places.priceLevel.free': {
    en: 'Free',
    es: 'Gratis'
  },
  'places.priceLevel.tooltip': {
    en: 'Price level published by Google Business Profile',
    es: 'Nivel de precio publicado por el Perfil de Empresa de Google'
  },
  // Sprint T2: 'How this audit was built' attribution footer.
  'builtBy.summary': {
    en: 'How this audit was built',
    es: 'Cómo se construyó esta auditoría'
  },
  'builtBy.intro': {
    en: 'A Muntin Digital creation, powered by:',
    es: 'Una creación de Muntin Digital, impulsada por:'
  },
  'builtBy.license': {
    en: 'Open-source projects listed here are used under their respective licenses (MIT, Apache-2.0, BSD-3, OFL-1.1, MPL-2.0, AGPL-3.0, CC-BY-SA). Vendor names are trademarks of their owners.',
    es: 'Los proyectos de código abierto listados aquí se usan bajo sus respectivas licencias (MIT, Apache-2.0, BSD-3, OFL-1.1, MPL-2.0, AGPL-3.0, CC-BY-SA). Los nombres de los proveedores son marcas de sus titulares.'
  },
  'builtBy.andMore': {
    en: '+ {count} more',
    es: '+ {count} más'
  },
  // Sprint T4: brand dossier card.
  'dossier.badge': {
    en: 'Cited facts',
    es: 'Hechos citados'
  },
  'dossier.heading': {
    en: 'What we can verify about this restaurant',
    es: 'Lo que podemos verificar de este restaurante'
  },
  'dossier.footnote': {
    en: 'Every sentence links to the verified signal it came from. Hover any citation to see the source.',
    es: 'Cada oración se enlaza con la señal verificada de la que proviene. Pasa el cursor sobre cualquier cita para ver la fuente.'
  },
  // Phase 4 #2: methodology explainer copy. Owner-facing disclosure
  // of every calculation the audit performs. Long-form; collapsible.
  // The EN is the canonical copy; ES is a close translation kept in
  // sync. Any edit here should update both locales — the
  // test-i18n-coverage check will catch misses.
  'method.summary':          { en: 'How we calculate these numbers', es: 'Cómo calculamos estos números' },
  'method.scoreHead':        { en: 'The overall score', es: 'La puntuación general' },
  'method.scoreBody': {
    en: 'The overall score is a weighted average of five pillars. Performance is weighted 2× the others because a slow mobile site is materially worse for a restaurant than an imperfect SEO score — 53% of mobile visitors bounce from pages that take more than 3s to load. The Restaurant Readiness pillar is only included when we have enough confirmed checks to trust it; otherwise the score falls back to a simple 4-pillar average so one detected platform plus eight unverified checks doesn\'t inflate the overall number.',
    es: 'La puntuación general es un promedio ponderado de cinco pilares. El Rendimiento pesa 2× los demás porque un sitio móvil lento es significativamente peor para un restaurante que un SEO imperfecto — el 53% de los visitantes móviles abandona páginas que tardan más de 3s en cargar. El pilar de Preparación del Restaurante solo se incluye cuando tenemos suficientes verificaciones confirmadas para confiar en él; de lo contrario la puntuación vuelve a un promedio simple de 4 pilares, para que una plataforma detectada más ocho verificaciones no confirmadas no inflen el número general.'
  },
  'method.subtypeHead':      { en: 'How we detect your restaurant subtype', es: 'Cómo detectamos el subtipo de tu restaurante' },
  'method.subtypeBody': {
    en: 'Ten subtypes are recognized: fine-dining, casual-dining, fast-casual, cafe, bakery, bar-pub, pizzeria, food-truck, ghost-kitchen, and catering-only. Detection combines schema.org @type hints, the presence of subtype-specific platforms (Slice for pizzerias, Resy for fine-dining, etc.), and keyword patterns in the page text. Each signal contributes to a score; the highest-scoring subtype wins. Confidence is reported in the subtype card so you can override it if we got it wrong.',
    es: 'Reconocemos diez subtipos: fine-dining, casual-dining, fast-casual, café, panadería, bar-pub, pizzería, food-truck, ghost-kitchen y solo-catering. La detección combina señales @type de schema.org, la presencia de plataformas específicas del subtipo (Slice para pizzerías, Resy para fine-dining, etc.) y patrones de palabras clave en el texto de la página. Cada señal contribuye a una puntuación; el subtipo con mayor puntuación gana. La confianza se reporta en la tarjeta de subtipo para que puedas corregirla si nos equivocamos.'
  },
  'method.weightsHead':      { en: 'Check weights', es: 'Pesos de las verificaciones' },
  'method.weightsBody': {
    en: 'Each of the 20+ restaurant-priority checks carries a weight from 0 (not applicable to this subtype) to 2.0 (critical). Viewport is 2.0 across every subtype because a missing viewport breaks every phone visitor\'s experience. Conversions (online ordering or reservations) is 1.5 for most subtypes but 2.0 for fine-dining (reservations) and 2.0 for fast-casual (ordering). Age-gate is 0 for every restaurant subtype — bars and restaurants don\'t legally need them in most jurisdictions, unlike alcohol retailers.',
    es: 'Cada una de las 20+ verificaciones de prioridad restaurantera tiene un peso entre 0 (no aplica a este subtipo) y 2.0 (crítico). El viewport es 2.0 en todos los subtipos porque la ausencia de viewport rompe la experiencia de cada visitante móvil. Las conversiones (pedidos en línea o reservas) es 1.5 para la mayoría de los subtipos pero 2.0 para fine-dining (reservas) y 2.0 para fast-casual (pedidos). La barrera de edad es 0 para todos los subtipos restauranteros — los bares y restaurantes legalmente no la requieren en la mayoría de las jurisdicciones, a diferencia de los vendedores de alcohol.'
  },
  'method.weightsUnverified': {
    en: '"Unverified" checks (where we honestly couldn\'t tell) count at HALF weight against the denominator, zero credit toward the numerator. This prevents a site we couldn\'t fully scan from inflating its score past a clean-scanning site with the same pass count. The penalty is disclosed on the score ring as "N unverified checks."',
    es: 'Las verificaciones "no confirmadas" (donde honestamente no pudimos saber) cuentan a MEDIO peso en el denominador, cero crédito en el numerador. Esto evita que un sitio que no pudimos escanear completamente infle su puntuación sobre un sitio de escaneo limpio con el mismo conteo de aprobaciones. La penalización se divulga en el anillo de puntuación como "N verificaciones no confirmadas".'
  },
  'method.benchmarksHead':   { en: 'The "typical sites score" benchmark', es: 'El benchmark de "puntuación típica de sitios"' },
  'method.benchmarksBody': {
    en: 'Per-subtype benchmark medians are currently operator estimates from manual review of roughly 100 restaurant sites in each subtype. They\'re provisional — the refresh pipeline that replaces each subtype with a real sample size (drawn from live audits this tool runs) is future work. The benchmark chip\'s ⓘ tooltip carries the provenance on every render. Numbers are anchors for expectation-setting, not statistical claims.',
    es: 'Las medianas de benchmark por subtipo son actualmente estimaciones de operador basadas en la revisión manual de aproximadamente 100 sitios de restaurante por subtipo. Son provisionales — el pipeline de actualización que reemplaza cada subtipo con un tamaño de muestra real (de auditorías en vivo ejecutadas por esta herramienta) es trabajo futuro. El tooltip ⓘ del chip de benchmark lleva la procedencia en cada render. Los números son anclas para calibrar expectativas, no afirmaciones estadísticas.'
  },
  'method.revenueHead':      { en: 'The revenue-at-risk chip', es: 'El chip de ingresos-en-riesgo' },
  'method.revenueBody': {
    en: 'Every actionable finding carries an "Est. $X–Y/yr at risk" chip. The range is the product of three inputs:',
    es: 'Cada hallazgo accionable lleva un chip "Est. $X–Y/año en riesgo". El rango es el producto de tres insumos:'
  },
  'method.revenueInputs': {
    en: '(1) a per-check revenue-at-risk coefficient based on published funnel-dropoff research; (2) your restaurant\'s estimated annual revenue, which starts from a subtype-aware default (fine-dining ~$2M, cafe ~$860k, food-truck ~$230k) and is automatically adjusted when Google Places tells us something more: priceLevel scales the per-ticket average (0.55× for $, 2.4× for $$$$), and userRatingCount scales daily covers logarithmically (clamped to 0.40×–2.50× so viral outliers don\'t project chain volume); (3) a confidence-widening layer that stretches the range when any of the Places signals aren\'t available, so an audit with thin data produces an explicitly wider chip instead of a falsely precise one.',
    es: '(1) un coeficiente de ingresos-en-riesgo por verificación basado en investigación publicada sobre pérdidas de embudo; (2) los ingresos anuales estimados de tu restaurante, que parten de un valor predeterminado consciente del subtipo (fine-dining ~$2M, café ~$860k, food-truck ~$230k) y se ajustan automáticamente cuando Google Places nos dice algo más: priceLevel escala el ticket promedio (0.55× para $, 2.4× para $$$$), y userRatingCount escala las cubiertas diarias logarítmicamente (limitado a 0.40×–2.50× para que los casos virales no proyecten volumen de cadena); (3) una capa de ampliación por confianza que estira el rango cuando alguna señal de Places no está disponible, de modo que una auditoría con datos delgados produce un chip explícitamente más amplio en lugar de uno falsamente preciso.'
  },
  'method.revenueZeroInput': {
    en: 'Nothing in this chain asks you to type numbers. Every adjustment reads from signals the audit already fetches during the fast scan.',
    es: 'Nada en esta cadena te pide escribir números. Cada ajuste se basa en señales que la auditoría ya obtiene durante el escaneo rápido.'
  },
  'method.confidenceHead':   { en: 'What "confidence-widened" means', es: 'Qué significa "ampliado por confianza"' },
  'method.confidenceBody': {
    en: 'When Google Places didn\'t find your listing, or didn\'t publish a price level, or hasn\'t accumulated at least 50 reviews, the revenue chip\'s low and high values are stretched to reflect the genuine uncertainty. A well-resolved audit might show Est. $12k–18k/yr at risk; a nothing-resolved audit of the same check shows Est. $5k–37k/yr at risk. The range width itself is the honesty layer — we\'d rather show you a wide span we can defend than a tight one we can\'t.',
    es: 'Cuando Google Places no encontró tu listado, o no publicó un nivel de precio, o no ha acumulado al menos 50 reseñas, los valores bajo y alto del chip de ingresos se estiran para reflejar la incertidumbre genuina. Una auditoría bien resuelta podría mostrar Est. $12k–18k/año en riesgo; una sin datos de la misma verificación muestra Est. $5k–37k/año en riesgo. El ancho del rango en sí es la capa de honestidad — preferimos mostrarte un rango amplio que podemos defender, en lugar de uno estrecho que no.'
  },
  'method.limitsHead':       { en: 'What this audit does NOT do', es: 'Lo que esta auditoría NO hace' },
  'method.limitsBody': {
    en: 'It runs on one Lighthouse pass (simulated phone, default throttling) plus a follow-up crawl of up to eight internal pages. It does not test ordering flow end-to-end, place a real reservation, verify your DoorDash profile, or measure real-user traffic beyond what Google\'s CrUX report publishes. It does not scrape Yelp or TripAdvisor (their terms forbid it). It does not claim your revenue-at-risk numbers are precise — they\'re order-of-magnitude estimates, always shown as ranges with "Est." up front.',
    es: 'Ejecuta una sola pasada de Lighthouse (teléfono simulado, throttling por defecto) más un rastreo de seguimiento de hasta ocho páginas internas. No prueba el flujo de pedido de extremo a extremo, no hace una reserva real, no verifica tu perfil de DoorDash, ni mide tráfico real de usuarios más allá de lo que publica el reporte CrUX de Google. No hace scraping a Yelp ni TripAdvisor (sus términos lo prohíben). No afirma que tus números de ingresos-en-riesgo son precisos — son estimaciones de orden de magnitud, siempre mostradas como rangos con "Est." al frente.'
  },
  'method.feedbackNote': {
    en: 'Found an error in a weight, a benchmark, or the revenue math? Tell us — the whole tool is open and the explanation above is linked from every audit so the methodology travels with the score.',
    es: '¿Encontraste un error en un peso, un benchmark o las matemáticas de ingresos? Dínoslo — toda la herramienta es abierta y la explicación anterior está enlazada desde cada auditoría, así la metodología viaja junto con la puntuación.'
  },
  // Phase 4 #3: margin-health card. Synthesizes existing check
  // results into a single "how vulnerable is this restaurant to
  // leaking orders through 15-30% aggregator commission paths?"
  // readout. Owner sees the score + the specific leaks, not a
  // generic "you should be on DoorDash" nudge.
  'marginHealth.eyebrow':  { en: 'Margin health', es: 'Salud del margen' },
  'marginHealth.heading': {
    en: 'How much of your revenue stays with you?',
    es: '¿Cuánto de tus ingresos se queda contigo?'
  },
  'marginHealth.sub': {
    en: 'Every gap below forces customers through a commission-taking path instead of your own margin-preserving one. Aggregators typically take 15–30% per order; your net margin is 3–5%. Closing these leaks keeps the money with the kitchen.',
    es: 'Cada brecha de abajo empuja a los clientes por un canal con comisión en lugar del tuyo que preserva el margen. Los agregadores suelen tomar entre 15–30% por pedido; tu margen neto es de 3–5%. Cerrar estas fugas mantiene el dinero en la cocina.'
  },
  'marginHealth.scoreLabel': { en: 'Margin health score', es: 'Puntuación de salud de margen' },
  'marginHealth.emptyState': {
    en: 'No leaks detected — your site is set up to keep the margin in-house on every order.',
    es: 'No se detectaron fugas — tu sitio está configurado para mantener el margen en casa en cada pedido.'
  },
  'marginHealth.leakLeadLine': { en: 'Where orders are leaking:', es: 'Por dónde se están fugando los pedidos:' },
  'marginHealth.leakPoints':   { en: '−{points} pts', es: '−{points} pts' },
  'marginHealth.unconfirmed':  { en: 'unverified — half penalty', es: 'no confirmada — media penalización' },
  // Machine-key translations for the scorer's leak.source values.
  'marginHealth.leak.conversions': {
    en: 'No own-site ordering or reservations — every direct-intent customer lands on an aggregator',
    es: 'Sin pedido o reserva en tu propio sitio — cada cliente con intención directa termina en un agregador'
  },
  'marginHealth.leak.menuFormat': {
    en: 'Menu is a PDF — can\'t link to "Order This" per item, breaks the direct-conversion flow',
    es: 'El menú es un PDF — no puede enlazar "Ordena esto" por ítem, rompe el flujo de conversión directa'
  },
  'marginHealth.leak.menuDepth': {
    en: 'Menu missing prices or dish photos — shoppers bounce to DoorDash where those signals are standard',
    es: 'El menú no muestra precios o fotos — los compradores rebotan a DoorDash donde esas señales son estándar'
  },
  'marginHealth.leak.hoursAccuracy': {
    en: 'Hours inconsistent across Google and your schema — Google can route customers to aggregator listings when unsure',
    es: 'Horarios inconsistentes entre Google y tu schema — Google puede redirigir clientes a agregadores cuando hay duda'
  },
  'marginHealth.leak.aggregatorOnly': {
    en: 'Aggregators are the only ordering surface detected — no direct-ordering platform alongside',
    es: 'Los agregadores son la única superficie de pedido detectada — sin plataforma directa junto a ellos'
  },
  // Sprint D1: email deliverability card.
  // Phase 2 U2: heading + sub rewritten in owner-outcome language.
  // The technical term "deliverability" never appeared on any
  // restaurant operator's spreadsheet — but every operator has had a
  // guest say "I never got the confirmation email." That's what this
  // card actually tests.
  'deep.email.heading': {
    en: 'Will your reservation confirmations land in spam?',
    es: '¿Tus confirmaciones de reserva terminarán en spam?'
  },
  'deep.email.sub': {
    en: 'Gmail, Outlook, and Yahoo silently route booking confirmations and newsletters to spam unless your domain proves it can send mail. The three rows below are the proofs they look for.',
    es: 'Gmail, Outlook y Yahoo envían silenciosamente las confirmaciones de reserva y newsletters al spam a menos que tu dominio demuestre que puede enviar correos. Las tres filas siguientes son las pruebas que esperan.'
  },
  'deep.email.spf':   { en: 'SPF',   es: 'SPF' },
  'deep.email.dmarc': { en: 'DMARC', es: 'DMARC' },
  'deep.email.dkim':  { en: 'DKIM',  es: 'DKIM' },
  'deep.email.state.pass':    { en: 'Present',      es: 'Presente' },
  'deep.email.state.fail':    { en: 'Missing',      es: 'Ausente' },
  'deep.email.state.unknown': { en: 'Not detected', es: 'No detectado' },
  'deep.email.spf.multiple': {
    en: 'Multiple SPF records found — email providers treat this as no SPF. Merge them into one.',
    es: 'Se encontraron múltiples registros SPF — los proveedores de correo lo tratan como si no hubiera SPF. Únelos en uno solo.'
  },
  'deep.email.dmarc.policy': {
    en: 'Policy: p={policy}',
    es: 'Política: p={policy}'
  },
  'deep.email.dkim.selector': {
    en: 'Confirmed at selector "{selector}"',
    es: 'Confirmado en el selector "{selector}"'
  },
  'deep.email.dkim.unknown': {
    en: 'Not detected via the common selectors we probe. Your mail provider may use a custom selector we can\'t confirm without access.',
    es: 'No se detectó en los selectores comunes que revisamos. Tu proveedor de correo puede usar un selector propio que no podemos confirmar sin acceso.'
  },
  // Phase 2 U2: outcome language for the email-posture chip. The
  // "bulk mail" framing was a sysadmin concept; what an owner cares
  // about is whether the next reservation confirmation will reach
  // the guest's inbox.
  'deep.email.posture.ready':    { en: 'Confirmation emails will reach guests',     es: 'Las confirmaciones llegarán a los huéspedes' },
  'deep.email.posture.notReady': { en: 'Confirmation emails likely going to spam', es: 'Las confirmaciones probablemente terminan en spam' },
  // Sprint D2: schema richness scorecard.
  // Phase 2 U2: badge + heading rewritten in owner-outcome language.
  // "Schema" is a developer term — the underlying question for an
  // owner is whether Google's search results, voice assistants, and
  // restaurant-discovery widgets can read their menu, hours, and
  // address WITHOUT a human visiting the site. Same data, owner framing.
  'schemaRichness.badge':    { en: 'How Google reads your data', es: 'Cómo Google lee tus datos' },
  'schemaRichness.heading':  { en: 'How well can Google read your menu, hours, and address?', es: '¿Qué tan bien puede Google leer tu menú, horarios y dirección?' },
  'schemaRichness.summary':  {
    en: '{present} of {total} Google-recommended fields populated.',
    es: '{present} de {total} campos recomendados por Google completos.'
  },
  'schemaRichness.present':  { en: 'Present',  es: 'Presente'  },
  'schemaRichness.missing':  { en: 'Missing',  es: 'Faltante' },
  'schemaRichness.priority.required':    { en: 'Required',    es: 'Obligatorio' },
  'schemaRichness.priority.recommended': { en: 'Recommended', es: 'Recomendado' },
  'schemaRichness.priority.optional':    { en: 'Optional',    es: 'Opcional'    },
  'schemaRichness.copy':     { en: 'Copy snippet', es: 'Copiar fragmento' },
  'schemaRichness.copied':   { en: 'Copied!',      es: '¡Copiado!'        },
  // Sprint E1: progressive-disclosure labels shared by schema +
  // OG scorecards.
  'schemaRichness.moreMissing': {
    en: 'Show {count} more opportunities',
    es: 'Ver {count} oportunidades más'
  },
  'schemaRichness.covered': {
    en: 'See {count} fields you\'re already covering',
    es: 'Ver {count} campos que ya cubres'
  },
  'schemaRichness.summaryAllGood': {
    en: 'All {total} Google-recommended fields are populated. This site is fully set up.',
    es: 'Los {total} campos recomendados por Google están completos. Este sitio está listo.'
  },
  'og.summaryAllGood': {
    en: 'All {total} social-share meta tags are populated.',
    es: 'Los {total} meta tags de compartido social están completos.'
  },
  // Sprint D3: embeddable badge offer card.
  'badge.eyebrow':      { en: 'Embeddable badge', es: 'Badge para incrustar' },
  'badge.heading':      { en: 'Show this score on your own site', es: 'Muestra esta puntuación en tu propio sitio' },
  'badge.sub': {
    en: 'Paste this snippet into your site footer. The badge refreshes to match whatever audit you run next — no manual updating.',
    es: 'Pega este fragmento en el pie de tu sitio. El badge se actualiza con la auditoría más reciente que ejecutes — sin actualizaciones manuales.'
  },
  'badge.snippetLabel': { en: 'Copy-paste HTML', es: 'HTML para copiar y pegar' },
  'badge.copy':         { en: 'Copy snippet',    es: 'Copiar fragmento' },
  'badge.copied':       { en: 'Copied!',         es: '¡Copiado!' },
  // Sprint D4: OG / Twitter completeness scorecard.
  'og.badge':    { en: 'Social share preview', es: 'Vista previa al compartir' },
  'og.heading':  {
    en: 'How your site looks when shared on social',
    es: 'Cómo se ve tu sitio al compartirlo en redes sociales'
  },
  'og.summary':  {
    en: '{present} of {total} social-share meta tags populated.',
    es: '{present} de {total} meta tags de compartido social completos.'
  },
  // Sprint H2: Owner Action Plan card. Persistent per-URL checklist
  // split across three time horizons so owners can turn an audit into
  // a plan they actually work through. Copy is scoped to the card.
  'actionPlan.eyebrow': { en: 'Your action plan', es: 'Tu plan de acción' },
  'actionPlan.heading': {
    en: 'Turn this audit into a plan you can work through',
    es: 'Convierte esta auditoría en un plan que puedas ejecutar'
  },
  'actionPlan.sub': {
    en: 'Your highest-leverage gaps, split across three horizons. Check each off as you tackle it — your progress is saved on this device and survives re-audits.',
    es: 'Tus mayores oportunidades, divididas en tres horizontes. Marca cada una al completarla — tu progreso se guarda en este dispositivo y sobrevive a nuevas auditorías.'
  },
  'actionPlan.reset': { en: 'Reset checkboxes', es: 'Reiniciar casillas' },
  'actionPlan.col.week':    { en: 'This week',    es: 'Esta semana' },
  'actionPlan.col.month':   { en: 'This month',   es: 'Este mes' },
  'actionPlan.col.quarter': { en: 'This quarter', es: 'Este trimestre' },
  'actionPlan.empty': {
    en: 'No failing or unverified checks. Come back after a change to the site.',
    es: 'Sin verificaciones fallidas o sin verificar. Vuelve tras un cambio en el sitio.'
  },
  'actionPlan.progress': {
    en: '{done} of {total} complete',
    es: '{done} de {total} completadas'
  },
  'actionPlan.colEmpty': {
    en: 'Nothing for this horizon yet.',
    es: 'Aún no hay nada para este horizonte.'
  },
  // Effort/time meta strings reused inside the action plan column
  // items. Kept separate from the Top-3 chip text because these render
  // as plain meta labels without chip styling.
  'effort.self':    { en: 'Fix yourself',      es: 'Arreglo propio' },
  'effort.dev':     { en: 'Ask your developer', es: 'Pregunta a tu desarrollador' },
  'effort.rebuild': { en: 'Rebuild needed',    es: 'Se necesita rehacer' },
  'effort.halfday': { en: 'Half-day project',  es: 'Proyecto de medio día' },
  // Sprint N1: NAP cross-check card (Name/Address/Phone consistency
  // across Google Places, schema.org, and on-page text). Rows render
  // one per mismatched field, with sub-labels for each source.
  'nap.eyebrow': { en: 'Local listing consistency', es: 'Consistencia de ficha local' },
  'nap.heading': {
    en: "Your name, address, and phone don't line up across sources",
    es: 'Tu nombre, dirección y teléfono no coinciden entre fuentes'
  },
  'nap.sub': {
    en: "Google ranks local businesses higher when their Business Profile, website schema, and on-page text all match. Every mismatch below is a citation inconsistency search engines can see — pick the canonical value and unify.",
    es: 'Google posiciona mejor a los negocios locales cuando su Perfil de Empresa, el schema del sitio y el texto en la página coinciden. Cada desajuste de abajo es una inconsistencia de citación que los buscadores detectan — elige el valor canónico y unifícalo.'
  },
  'nap.label.phone':   { en: 'Phone number',   es: 'Teléfono' },
  'nap.label.address': { en: 'Address',        es: 'Dirección' },
  'nap.label.name':    { en: 'Business name',  es: 'Nombre del negocio' },
  // Phase 3 #1: hours-consistency row label. Renders alongside the
  // existing NAP rows in renderNapCheck when Google Places hours and
  // the on-page schema's openingHoursSpecification disagree.
  'nap.label.hours':   { en: 'Opening hours',  es: 'Horario de apertura' },
  'nap.source.places': { en: 'Google Places',  es: 'Google Places' },
  'nap.source.schema': { en: 'Your schema',    es: 'Tu schema' },
  'nap.source.page':   { en: 'Your page text', es: 'Texto en tu página' },
  // Sprint Q1: sticky in-report table of contents.
  'toc.label':         { en: 'On this page',         es: 'En esta página' },
  'toc.openSheet':     { en: 'Sections',             es: 'Secciones' },
  'toc.overall':       { en: 'Overall score',        es: 'Puntuación general' },
  'toc.topFixes':      { en: 'Top fixes',            es: 'Arreglos principales' },
  'toc.actionPlan':    { en: 'Your plan',            es: 'Tu plan' },
  'toc.categories':    { en: 'Categories',           es: 'Categorías' },
  'toc.opportunities': { en: 'Opportunities',        es: 'Oportunidades' },
  'toc.napCheck':      { en: 'Listing consistency',  es: 'Consistencia de ficha' },
  'toc.priority':      { en: 'Restaurant checks',    es: 'Verificaciones del restaurante' },
  'toc.compare':       { en: 'Compare',              es: 'Comparar' },
  // Sprint F1: dev-handoff prompt copy. Owners click "Copy for your
  // developer" next to failing/unverified checks; we format a
  // markdown prompt they can paste into email / tickets / ChatGPT.
  'devPrompt.copy':        { en: 'Copy for your developer', es: 'Copiar para tu desarrollador' },
  'devPrompt.copied':      { en: 'Copied ✓',                es: 'Copiado ✓' },
  'devPrompt.title':       { en: 'Website audit finding',   es: 'Hallazgo de auditoría del sitio' },
  'devPrompt.audited':     { en: 'Audited',                 es: 'Auditado' },
  'devPrompt.foundHeader': { en: 'What we found',           es: 'Qué encontramos' },
  'devPrompt.whyHeader':   { en: 'Why it matters',          es: 'Por qué importa' },
  'devPrompt.closing': {
    en: 'Can you help me fix this? A step-by-step plan would be perfect. Let me know if you need anything from me to diagnose.',
    es: '¿Puedes ayudarme a arreglarlo? Un plan paso a paso sería perfecto. Dime si necesitas algo de mi parte para diagnosticar.'
  },
  'devPrompt.signoff': {
    en: 'Generated by Muntin Digital Restaurant Audit · muntin.digital',
    es: 'Generado por la Auditoría de Restaurantes de Muntin Digital · muntin.digital'
  },
  // D6: developer handoff document strings. Used by buildHandoffMarkdown
  // and buildHandoffPrintableHtml in restaurant-checks.js. Voice
  // matches the audit-page verdict copy: reassuring, concrete,
  // owner-language; no jargon; framed in business cost rather than
  // Lighthouse numbers.
  'handoff.eyebrow':         { en: 'Developer handoff',                es: 'Para tu desarrollador' },
  'handoff.titlePrefix':     { en: 'Restaurant website audit',         es: 'Auditoría del sitio web del restaurante' },
  'handoff.score':           { en: 'Score {score}/100',                es: 'Puntuación {score}/100' },
  'handoff.captured':        { en: 'captured {date}',                  es: 'capturada {date}' },
  'handoff.auditedLabel':    { en: 'Audited URL:',                     es: 'URL auditada:' },
  'handoff.permalinkLabel':  { en: 'Live audit:',                      es: 'Auditoría en vivo:' },
  'handoff.actionsHeader':   { en: 'What to fix first ({n})',          es: 'Qué arreglar primero ({n})' },
  'handoff.empty': {
    en: 'Every check is passing. There is nothing in the priority list to hand off — your site is in solid shape.',
    es: 'Todas las verificaciones pasan. No hay nada en la lista de prioridades para entregar — tu sitio está en muy buena forma.'
  },
  'handoff.why':             { en: 'Why this matters:',                es: 'Por qué importa:' },
  'handoff.state.fail':      { en: 'To fix',                           es: 'Por arreglar' },
  'handoff.state.unverified':{ en: 'To confirm',                       es: 'Por confirmar' },
  'handoff.state.pass':      { en: 'Passing',                          es: 'Aprobado' },
  'handoff.effort.rebuild':  { en: 'half-day project',                 es: 'proyecto de medio día' },
  'handoff.effort.minutesShort': { en: '<5 min',                       es: '<5 min' },
  'handoff.effort.minutes':  { en: '~{n} min',                         es: '~{n} min' },
  'handoff.effort.hours':    { en: '~{n} hr',                          es: '~{n} h' },
  'handoff.effort.self':     { en: 'owner-fixable',                    es: 'lo puede hacer el propietario' },
  'handoff.effort.dev':      { en: 'developer task',                   es: 'tarea de desarrollador' },
  'handoff.scope.header':    { en: 'Scope of work',                    es: 'Alcance del trabajo' },
  'handoff.scope.body': {
    en: 'This list is sorted by priority — the lightest, highest-impact fixes are at the top. Each item carries an effort label so an agency or freelancer can sum the work into hours and quote against it. The "why this matters" line on each row explains the business cost behind the fix — useful when justifying the work to a non-technical stakeholder.',
    es: 'Esta lista está ordenada por prioridad — los arreglos más ligeros y de mayor impacto están arriba. Cada elemento lleva una etiqueta de esfuerzo para que una agencia o freelancer sume el trabajo en horas y pueda cotizarlo. La línea "por qué importa" explica el costo de negocio detrás de cada arreglo — útil al justificar el trabajo ante un stakeholder no técnico.'
  },
  'handoff.footer': {
    en: 'Generated by the Muntin restaurant website audit. Try it free at muntin.digital/tools/audits/restaurant.',
    es: 'Generada por la auditoría de sitios web de restaurantes de Muntin. Pruébala gratis en muntin.digital/tools/audits/restaurant.'
  },
  // Sprint R1: 30-day re-audit reminder card.
  'reaudit.heading': {
    en: 'Remind me to re-audit in 30 days',
    es: 'Recuérdame re-auditar en 30 días'
  },
  'reaudit.sub': {
    en: 'Audits are snapshots. A friendly reminder in 30 days helps you see which fixes actually moved the score. One email, nothing else.',
    es: 'Las auditorías son fotos en el tiempo. Un recordatorio amable en 30 días te ayuda a ver qué arreglos realmente movieron la puntuación. Un solo correo, nada más.'
  },
  'reaudit.placeholder': { en: 'you@yourrestaurant.com', es: 'tu@turestaurante.com' },
  'reaudit.submit':      { en: 'Schedule 30-day reminder', es: 'Programar recordatorio de 30 días' },
  'reaudit.sending':     { en: 'Scheduling…',               es: 'Programando…' },
  'reaudit.disclaimer': {
    en: "Your email lives only on the scheduled message. We don't store it on our end — no list, no drip, no follow-up.",
    es: 'Tu correo vive solo en el mensaje programado. No lo guardamos de nuestro lado — sin lista, sin goteo, sin seguimiento.'
  },
  'reaudit.success': {
    en: "Reminder scheduled — you'll hear from us in 30 days.",
    es: 'Recordatorio programado — sabrás de nosotros en 30 días.'
  },
  'reaudit.needAudit': {
    en: 'Run an audit first, then schedule a reminder.',
    es: 'Ejecuta una auditoría primero, luego programa un recordatorio.'
  },
  'reaudit.genericError': {
    en: "Couldn't schedule the reminder. Try again in a moment?",
    es: 'No pudimos programar el recordatorio. ¿Intenta de nuevo en un momento?'
  }
};

// Pluralization helper for ES: most nouns just take -es / -s, but
// "verificación" → "verificaciones" (accent shifts), and we need
// locale-aware plural suffixes that English doesn't. Keep this
// map small and extend only as new strings land.
var ES_PLURAL = {
  'on': function(n){ return n === 1 ? 'ón' : 'ones'; }
};

function t(key, vars, lang) {
  var L = lang || (typeof window !== 'undefined' && window.__muntinLang) || 'en';
  if (L !== 'es') L = 'en';
  var entry = UI_I18N[key];
  var str;
  if (!entry) {
    // Missing key entirely — mark for the parity checker and fall
    // back to the key itself so the bug is visible, not silent.
    if (typeof window !== 'undefined') {
      window.__auditMissingTranslations = window.__auditMissingTranslations || {};
      window.__auditMissingTranslations[key] = true;
    }
    str = key;
  } else if (entry[L]) {
    str = entry[L];
  } else {
    // Key present but this locale missing — fall back to EN and
    // flag so the translator has a punch list.
    if (typeof window !== 'undefined' && L !== 'en') {
      window.__auditMissingTranslations = window.__auditMissingTranslations || {};
      window.__auditMissingTranslations[key + '[' + L + ']'] = true;
    }
    str = entry.en || key;
  }
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, function(_m, name){
    // ES-aware pluralization: {on} renders differently based on
    // a numeric 'count' var in the same template.
    if (L === 'es' && ES_PLURAL[name] && typeof vars.count === 'number') {
      return ES_PLURAL[name](vars.count);
    }
    if (name === 's' && typeof vars.count === 'number') {
      // English "check" vs "checks" — pick suffix from count.
      return vars.count === 1 ? '' : 's';
    }
    return vars[name] != null ? String(vars[name]) : '';
  });
}

// ---------------------------------------------------------------------------
// Phase 4 #3: margin-health rollup.
// ---------------------------------------------------------------------------
// Direct answer to the user's push-back on aggregator detection as
// an "empowering" signal: detecting presence on DoorDash isn't
// empowering; showing an owner HOW MUCH OF THEIR REVENUE IS AT
// STRUCTURAL RISK of leaking to aggregators IS. Same data we
// already fetched, different — honest — frame.
//
// computeMarginHealth(signals) is a pure, testable function that
// synthesizes five existing check results into a single 0-100 score
// and a list of specific "leaks" — the gaps that force customers
// toward commission-taking platforms instead of the restaurant's
// own margin-preserving channels.
//
// Signals in (each is a check result string: 'pass' | 'fail' |
// 'unverified' | missing):
//   conversionsState    - own-site ordering / reservations
//   menuDepthState      - prices + dish photos on the menu page
//   menuFormatState     - HTML menu vs PDF
//   hoursAccuracyState  - schema hours complete + consistent w/ Places
//   hasDirectPlatform   - boolean, Toast / Square / ChowNow / etc.
//                         detected on site (owner-kept margin)
//   hasAggregatorOnly   - boolean, DoorDash / UberEats / Grubhub
//                         detected as the ONLY ordering surface
//
// Penalty values are calibrated to typical US restaurant margin
// structure (3-5% net margin; aggregator commissions 15-30%):
//
//   no own-site conversion path          -30   (biggest leak)
//   only aggregator platforms detected   -25   (structural dependency)
//   menu PDF (blocks direct conversion)  -15
//   menu depth missing (opaque menu)     -15
//   hours inconsistent (Google shows wrong info, sends to aggregator)
//                                         -10
//
// Unverified checks count half-penalty, matching the A1 convention
// used by the readiness scorer. Pass = 0 penalty. Missing signal =
// 0 penalty (we don't invent leaks we can't see).
//
// Grade bands:
//   >=75 good — healthy independent margin posture
//   50-74 ok  — mixed; identifiable leaks but recoverable
//   <50 bad   — structural dependency; every order routes through
//                a 15-30% commission path
//
// The returned `leaks` array is what the margin-health card renders
// so the owner sees the SPECIFIC things to fix, not just a number.

var MARGIN_HEALTH_PENALTIES = {
  conversions:         30,
  aggregatorOnly:      25,
  menuFormat:          15,
  menuDepth:           15,
  hoursAccuracy:       10
};

function applyPenalty(state, full, label, leaks) {
  if (state === 'fail') {
    leaks.push({ source: label, points: full, confirmed: true });
    return full;
  }
  if (state === 'unverified') {
    var half = Math.round(full / 2);
    leaks.push({ source: label, points: half, confirmed: false });
    return half;
  }
  return 0;
}

function computeMarginHealth(signals) {
  if (!signals || typeof signals !== 'object') return null;
  var leaks = [];
  var score = 100;

  // source keys are stable machine identifiers — the UI layer
  // (index.html) looks them up in UI_I18N via
  // t('marginHealth.leak.' + source) to render the human-readable
  // phrase per locale. Keeping the scorer locale-free preserves
  // Node testability and avoids fragile string equality on copy.
  score -= applyPenalty(signals.conversionsState,   MARGIN_HEALTH_PENALTIES.conversions,   'conversions',   leaks);
  score -= applyPenalty(signals.menuFormatState,    MARGIN_HEALTH_PENALTIES.menuFormat,    'menuFormat',    leaks);
  score -= applyPenalty(signals.menuDepthState,     MARGIN_HEALTH_PENALTIES.menuDepth,     'menuDepth',     leaks);
  score -= applyPenalty(signals.hoursAccuracyState, MARGIN_HEALTH_PENALTIES.hoursAccuracy, 'hoursAccuracy', leaks);

  // Aggregator-only is a derived binary — only counts as a leak when
  // we CONFIRMED aggregators are the sole ordering surface. We don't
  // dock for "you're on DoorDash" in general; we dock for "DoorDash
  // is the only ordering path we could detect." Safer against false
  // positives on restaurants that diversify properly.
  if (signals.hasAggregatorOnly === true) {
    score -= MARGIN_HEALTH_PENALTIES.aggregatorOnly;
    leaks.push({
      source: 'aggregatorOnly',
      points: MARGIN_HEALTH_PENALTIES.aggregatorOnly,
      confirmed: true
    });
  }

  if (score < 0) score = 0;
  if (score > 100) score = 100;
  var grade = score >= 75 ? 'good' : (score >= 50 ? 'ok' : 'bad');

  // Sort leaks by point value descending so the UI can render them
  // in "biggest first" order without re-sorting downstream.
  leaks.sort(function(a, b){ return b.points - a.points; });

  return {
    score: score,
    grade: grade,
    leaks: leaks,
    maxPenalty:
      MARGIN_HEALTH_PENALTIES.conversions +
      MARGIN_HEALTH_PENALTIES.aggregatorOnly +
      MARGIN_HEALTH_PENALTIES.menuFormat +
      MARGIN_HEALTH_PENALTIES.menuDepth +
      MARGIN_HEALTH_PENALTIES.hoursAccuracy
  };
}

// ---------------------------------------------------------------------------
// Phase 3 #6: DOM-aware URL extraction from crawled follow-up pages.
// ---------------------------------------------------------------------------
// The existing platform detector (detectPlatforms in index.html) is
// already boundary-aware: it parses each URL via new URL(...), matches
// patterns against host / hostPath with explicit token-boundary
// guards, and rejects path-only patterns against bare host strings.
// That gives it solid precision — /assets/square-shadows.css won't
// false-positive "Square" because the bare-host pattern doesn't match
// path segments.
//
// The real gap is RECALL, not precision. The detector feeds on URLs
// extracted from PageSpeed's audit details (network-requests +
// crawlable-anchors), which only covers the homepage Lighthouse
// visited. A restaurant whose Toast ordering is embedded on a
// dedicated /order/ page — or whose Resy widget only lives on
// /reserve/ — is invisible to the homepage trace. PSI never fetched
// those follow-up pages; the page-crawl endpoint did, and the HTML
// is sitting on window.__auditCrawl.pages ready to be mined.
//
// extractCrawlPageUrls(crawl) walks every successfully crawled page
// (homepage + follow-up slots) and pulls URLs out of the DOM
// attributes that actually identify platform embeds:
//
//   <a href=...>         — direct link to ordering / reservations
//   <iframe src=...>     — embedded booking / ordering widget
//   <script src=...>     — widget loader script
//   <form action=...>    — native checkout form pointing at a platform
//
// The union of these URLs is merged into allUrls before the priority-
// check loop runs, so the existing detectPlatforms flow picks up
// references on follow-up pages without any change to its matching
// rules. Precision is preserved (same boundary-aware matcher), recall
// goes up (more URL material to match against).
//
// Defensive on malformed HTML: regex-based extraction tolerates broken
// markup where a real DOM parser would throw. Duplicate URLs are NOT
// de-duped here because detectPlatforms handles that via its `seen`
// map; we return the raw list and let the caller concat.
var CRAWL_URL_ATTR_RE = /<(?:a|iframe|script|form)\b[^>]*\b(?:href|src|action)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi;

function extractCrawlPageUrls(crawl) {
  if (!crawl || typeof crawl !== 'object') return [];
  var pages = [];
  if (crawl.homepage && typeof crawl.homepage.html === 'string') {
    pages.push(crawl.homepage);
  }
  if (Array.isArray(crawl.pages)) {
    for (var pi = 0; pi < crawl.pages.length; pi++) {
      var p = crawl.pages[pi];
      if (p && typeof p.html === 'string' && p.html.length) {
        pages.push(p);
      }
    }
  }
  if (!pages.length) return [];
  var urls = [];
  for (var i = 0; i < pages.length; i++) {
    var html = pages[i].html;
    if (!html || typeof html !== 'string') continue;
    // Reset lastIndex every call; the /g flag carries state otherwise
    // and two pages into the loop we'd be matching mid-string.
    CRAWL_URL_ATTR_RE.lastIndex = 0;
    var m;
    while ((m = CRAWL_URL_ATTR_RE.exec(html)) !== null) {
      // Capture groups 1 (double-quoted) / 2 (single-quoted) /
      // 3 (unquoted). Exactly one of the three is defined per match.
      var val = m[1] || m[2] || m[3];
      if (val == null) continue;
      val = String(val).trim();
      if (!val) continue;
      // Skip fragment-only anchors ("#menu") and JS hrefs
      // ("javascript:void(0)") — they can't carry a platform host.
      if (val.charAt(0) === '#') continue;
      if (/^javascript:/i.test(val)) continue;
      urls.push(val);
    }
  }
  return urls;
}

// ---------------------------------------------------------------------------
// Phase 3 #5: menu intelligence (prices + dish photos on the menu page).
// ---------------------------------------------------------------------------
// The existing 'menu-format' priority check answers "is your menu an
// HTML page or a PDF?" and 'dietary' answers "do you mark gluten-free /
// vegan?". Neither tells an owner whether their HTML menu is
// actually doing the job — menus without visible prices kill ordering
// intent on delivery apps (shoppers cross-check before tapping), and
// menus without dish photos convert 30-40% worse than menus with them
// (DoorDash + UberEats internal studies, consistently replicated).
//
// extractMenuSignals(context) is a pure, testable function that reads
// the crawled menu-slot page (or falls back to the homepage HTML)
// and returns:
//
//   {
//     hasMenuPage:       boolean   — did we find a page to analyze?
//     sourceUrl:         string?   — which URL we read
//     pricesCount:       number    — distinct price-pattern matches
//     imagesCount:       number    — <img> tags on the page (raw)
//     imagesNearPrices:  number    — images within ~200 chars of a price
//     hasPriceCoverage:  boolean   — pricesCount >= PRICE_FLOOR
//     hasPhotoCoverage:  boolean   — imagesNearPrices >= PHOTO_FLOOR
//     gaps:              string[]  — 'prices' / 'photos' tokens missing
//   }
//
// Thresholds are defensible floors, not industry medians:
//   PRICE_FLOOR = 5 — a menu page with fewer than 5 price marks has
//     hidden most pricing; real menus typically show 15-40.
//   PHOTO_FLOOR = 3 — filters sites with a single hero image but no
//     dish photography; real photo menus carry 8-30 images per page.
//
// Phase 3 #5b: hasPhotoCoverage now thresholds on imagesNearPrices,
// not on the raw imagesCount. Rationale: a page with 1 hero + 1 logo +
// 1 nav icon has 3 <img> tags but zero DISH photos; the old count-all
// rule let those pages pass. A real dish photo is visually paired
// with its price (photo-name-price card pattern), so proximity to a
// price-pattern match in the HTML source is the strongest single
// signal of "this is a photographed menu." The 200-character window
// is wide enough for the common item-card layouts while staying tight
// enough to exclude header images from the count.
//
// The check consumes these thresholds to decide pass / fail and
// populates the `{gaps}` template token in the failNote so the owner
// sees exactly which signals are missing, not a generic scolding.
var MENU_INTEL_PRICE_FLOOR = 5;
var MENU_INTEL_PHOTO_FLOOR = 3;
var MENU_INTEL_PROXIMITY_WINDOW = 200;

// Match common price notations: leading symbol ($7.99, €12), or
// trailing currency suffix (7.99 USD, 12 EUR). Stays deliberately
// strict on digits so body-copy numbers like "1847 Main St" don't
// false-positive. Currency symbols include the common western set
// plus yen; can be extended if the audit goes global.
var MENU_INTEL_PRICE_RE = /(?:\$|€|£|¥)\s*\d{1,3}(?:[.,]\d{2})?\b|\b\d{1,3}(?:[.,]\d{2})?\s*(?:USD|EUR|GBP|JPY)\b/g;
var MENU_INTEL_IMG_RE = /<img\b[^>]*>/gi;

function extractMenuSignals(context) {
  var ctx = context || {};
  var pages = (ctx.crawl && Array.isArray(ctx.crawl.pages)) ? ctx.crawl.pages : [];
  // Prefer a crawled menu-slot page — if the crawler found a
  // dedicated menu URL, that's where we should measure. The homepage
  // is the fallback, since many sites inline their menu there.
  var targetPage = null;
  for (var i = 0; i < pages.length; i++) {
    var p = pages[i];
    if (p && p.slot === 'menu' && p.status === 200 && typeof p.html === 'string' && p.html.length > 2000) {
      targetPage = p;
      break;
    }
  }
  if (!targetPage && ctx.crawl && ctx.crawl.homepage && typeof ctx.crawl.homepage.html === 'string') {
    targetPage = ctx.crawl.homepage;
  }
  if (!targetPage || typeof targetPage.html !== 'string' || !targetPage.html.length) {
    return {
      hasMenuPage: false,
      sourceUrl: null,
      pricesCount: 0,
      imagesCount: 0,
      imagesNearPrices: 0,
      hasPriceCoverage: false,
      hasPhotoCoverage: false,
      gaps: ['menu-page']
    };
  }
  var html = targetPage.html;
  // Important: reset lastIndex since the module-level regexes carry
  // the /g flag and state across calls without an explicit reset.
  MENU_INTEL_PRICE_RE.lastIndex = 0;
  MENU_INTEL_IMG_RE.lastIndex = 0;
  // Collect offsets (not just counts) so we can measure proximity
  // between <img> tags and price patterns. exec() in a /g loop gives
  // us .index at each step; one pass per regex stays O(n).
  var priceOffsets = [];
  var imgOffsets = [];
  var m;
  while ((m = MENU_INTEL_PRICE_RE.exec(html)) !== null) {
    priceOffsets.push(m.index);
  }
  MENU_INTEL_IMG_RE.lastIndex = 0;
  while ((m = MENU_INTEL_IMG_RE.exec(html)) !== null) {
    imgOffsets.push(m.index);
  }
  var pricesCount = priceOffsets.length;
  var imagesCount = imgOffsets.length;
  // Count images within MENU_INTEL_PROXIMITY_WINDOW chars of ANY
  // price match. Walk both sorted arrays in one merge-style pass so
  // the worst case stays O(n+m) instead of O(n*m). priceOffsets are
  // sorted by construction (single /g pass); imgOffsets likewise.
  var imagesNearPrices = 0;
  if (priceOffsets.length > 0 && imgOffsets.length > 0) {
    var pi = 0; // moving price-offset cursor
    for (var ii = 0; ii < imgOffsets.length; ii++) {
      var imgAt = imgOffsets[ii];
      // Advance pi past any prices that are already out of range
      // (too far before this image).
      while (pi < priceOffsets.length && priceOffsets[pi] < imgAt - MENU_INTEL_PROXIMITY_WINDOW) {
        pi++;
      }
      // Nearest candidate price offset; check whether it's within
      // the window in either direction.
      if (pi < priceOffsets.length) {
        var distance = Math.abs(priceOffsets[pi] - imgAt);
        if (distance <= MENU_INTEL_PROXIMITY_WINDOW) {
          imagesNearPrices++;
          continue;
        }
      }
      // Also check the previous price in case the image is just
      // BEFORE the next price-out-of-range marker but still close
      // to the preceding one.
      if (pi > 0) {
        var prevDistance = Math.abs(priceOffsets[pi - 1] - imgAt);
        if (prevDistance <= MENU_INTEL_PROXIMITY_WINDOW) {
          imagesNearPrices++;
        }
      }
    }
  }
  var hasPriceCoverage = pricesCount >= MENU_INTEL_PRICE_FLOOR;
  var hasPhotoCoverage = imagesNearPrices >= MENU_INTEL_PHOTO_FLOOR;
  var gaps = [];
  if (!hasPriceCoverage) gaps.push('prices');
  if (!hasPhotoCoverage) gaps.push('photos');
  return {
    hasMenuPage: true,
    sourceUrl: targetPage.url || null,
    pricesCount: pricesCount,
    imagesCount: imagesCount,
    imagesNearPrices: imagesNearPrices,
    hasPriceCoverage: hasPriceCoverage,
    hasPhotoCoverage: hasPhotoCoverage,
    gaps: gaps
  };
}

// ---------------------------------------------------------------------------
// Phase 3 #4: review-responsiveness scoring.
// ---------------------------------------------------------------------------
// /api/gbp-details returns the 5 most recent Google reviews plus a
// hasOwnerReply flag per review. Previously the card just rendered
// those as a list; owners learned that reviews existed but got no
// "should I act on this" signal.
//
// computeReviewResponsiveness(reviews) is a pure function that turns
// the review array into an actionable scorecard:
//
//   {
//     score:         0..100  — blended response rate + urgency penalty
//     grade:         'good' | 'ok' | 'bad'
//     sampled:       number of reviews evaluated
//     replied:       number with owner reply
//     urgentCount:   number of low-star (<=2) reviews NOT replied to
//     urgentRatings: number[] — the star values of those low-star unreplied ones
//   }
//
// Scoring formula (kept simple; we have n=5 samples — no illusion of
// statistical precision):
//
//   base   = 100 * replied / sampled
//   penalty = 20 per unreplied 1-2 star review
//   score  = clamp(0, 100, base - penalty)
//
// Grade bands: >=80 good, 50-79 ok, <50 bad. Match the score-ring
// gradeScore() treatment so the visual language is consistent
// across the audit.
//
// Null-safe: returns null when there are no reviews to evaluate
// (review array missing or empty). Caller should hide the chip in
// that case rather than render a placeholder score.
function computeReviewResponsiveness(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) return null;
  var sampled = 0;
  var replied = 0;
  var urgentCount = 0;
  var urgentRatings = [];
  for (var i = 0; i < reviews.length; i++) {
    var r = reviews[i];
    if (!r || typeof r !== 'object') continue;
    sampled++;
    var isReplied = !!r.hasOwnerReply;
    if (isReplied) replied++;
    var rating = (typeof r.rating === 'number') ? r.rating : null;
    if (rating != null && rating <= 2 && !isReplied) {
      urgentCount++;
      urgentRatings.push(rating);
    }
  }
  if (sampled === 0) return null;
  var base = 100 * (replied / sampled);
  var score = Math.max(0, Math.min(100, Math.round(base - 20 * urgentCount)));
  var grade = score >= 80 ? 'good' : (score >= 50 ? 'ok' : 'bad');
  return {
    score: score,
    grade: grade,
    sampled: sampled,
    replied: replied,
    urgentCount: urgentCount,
    urgentRatings: urgentRatings
  };
}
// ---------------------------------------------------------------------------
// The renderNapCheck card in index.html surfaces drift between Google
// Places, the on-page schema, and the homepage H1/title for Name,
// Address, and Phone. Phase 3 extends the same pattern to opening
// hours — the single biggest "I drove there and they were closed"
// owner pain point and the most common silent suppressor of GBP
// local-pack ranking.
//
// Both source shapes have to be normalized into the SAME canonical
// representation before comparison. We use a per-day map of
// "open-close" minute tuples:
//
//   { Mo: ['0660-1320'], Tu: ['0660-1320'], ... }
//
// Each value is an ARRAY because a day can carry multiple ranges
// (e.g. lunch + dinner service). Days where the business is closed
// are simply absent from the map — schema's "opens=null, closes=null"
// and Places' missing-day both encode the same intent.
//
// Two pure parsers:
//   parsePlacesHoursText(arr)    -> day map
//   parseSchemaHoursObjects(arr) -> day map
//
// One canonical-key serializer:
//   serializeHoursDayMap(map)    -> stable string for equality compare
//
// Exported for Node tests; consumed by renderNapCheck in index.html.

var HOURS_DAY_NAMES = {
  'monday':    'Mo', 'mo': 'Mo', 'mon': 'Mo',
  'tuesday':   'Tu', 'tu': 'Tu', 'tue': 'Tu', 'tues': 'Tu',
  'wednesday': 'We', 'we': 'We', 'wed': 'We',
  'thursday':  'Th', 'th': 'Th', 'thu': 'Th', 'thur': 'Th', 'thurs': 'Th',
  'friday':    'Fr', 'fr': 'Fr', 'fri': 'Fr',
  'saturday':  'Sa', 'sa': 'Sa', 'sat': 'Sa',
  'sunday':    'Su', 'su': 'Su', 'sun': 'Su'
};
var HOURS_DAY_ORDER = ['Mo','Tu','We','Th','Fr','Sa','Su'];

// Convert "11:00 AM" / "11:00" / "11 AM" / "11pm" / "23:00" into
// minutes-from-midnight. Returns null on parse failure so the caller
// can skip a malformed row rather than fabricate a mismatch.
function parseHoursTimeToMinutes(raw) {
  if (raw == null) return null;
  var s = String(raw).trim().toLowerCase();
  if (!s) return null;
  // Strict ISO HH:MM (or HH:MM:SS) — schema.org's openingHoursSpecification
  // uses this. Place text wraps an AM/PM after the time so this strict
  // match must not greedy-eat AM/PM.
  var iso = s.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  if (iso) {
    return parseInt(iso[1], 10) * 60 + parseInt(iso[2], 10);
  }
  // 12-hour clock: "11 AM", "11:30am", "11:30 a.m.", "12 PM" (noon),
  // "12 AM" (midnight), "12:00 a.m.", etc.
  var hr = s.match(/^(\d{1,2})(?::([0-5]\d))?\s*(a\.?m\.?|p\.?m\.?)$/);
  if (hr) {
    var h = parseInt(hr[1], 10);
    var m = hr[2] ? parseInt(hr[2], 10) : 0;
    var meridiem = hr[3].replace(/\./g, '');
    if (h < 1 || h > 12) return null;
    if (meridiem === 'pm' && h !== 12) h += 12;
    if (meridiem === 'am' && h === 12) h = 0;
    return h * 60 + m;
  }
  return null;
}

// "Monday: 11:00 AM – 10:00 PM"            -> day:'Mo', ranges:[[660,1320]]
// "Saturday: 11 AM – 1 AM"                 -> day:'Sa', ranges:[[660,1500]] (overnight tracks +24h)
// "Tuesday: 11:00 AM – 2:30 PM, 5 PM – 10 PM" -> day:'Tu', ranges:[[660,870],[1020,1320]]
// "Sunday: Closed"                         -> day:'Su', ranges:[]   (explicit closed)
// "Monday: Open 24 hours"                  -> day:'Mo', ranges:[[0,1440]]
// Anything we can't parse returns null so the caller skips it.
function parsePlacesHoursLine(line) {
  if (!line || typeof line !== 'string') return null;
  // Google sometimes uses thin space (U+202F) before AM/PM; collapse
  // every kind of whitespace so the regex doesn't have to enumerate.
  var clean = line.replace(/\s+/g, ' ').trim();
  var colon = clean.indexOf(':');
  if (colon < 0) return null;
  var dayWord = clean.slice(0, colon).trim().toLowerCase();
  var dayCode = HOURS_DAY_NAMES[dayWord];
  if (!dayCode) return null;
  var rest = clean.slice(colon + 1).trim();
  if (!rest) return { day: dayCode, ranges: null }; // unparseable; skip
  // "Closed" — explicit, honor it as a real (empty) ranges array.
  if (/^closed\b/i.test(rest)) return { day: dayCode, ranges: [] };
  // "Open 24 hours" — single full-day range.
  if (/^open\s*24\s*hours?\b/i.test(rest)) return { day: dayCode, ranges: [[0, 1440]] };
  // Split by comma for multi-segment days (lunch + dinner). Each
  // segment must look like "TIME – TIME" (en-dash, em-dash, hyphen,
  // or "to" all valid separators in the wild).
  var ranges = [];
  var segments = rest.split(',');
  for (var i = 0; i < segments.length; i++) {
    var seg = segments[i].trim();
    if (!seg) continue;
    var rangeMatch = seg.match(/^(.+?)\s*[–—-]\s*(.+)$/);
    if (!rangeMatch) {
      // Couldn't parse a range; bail entirely on this line rather
      // than emit a partial day map.
      return null;
    }
    var openMin  = parseHoursTimeToMinutes(rangeMatch[1].trim());
    var closeMin = parseHoursTimeToMinutes(rangeMatch[2].trim());
    if (openMin == null || closeMin == null) return null;
    // Overnight tracks roll forward by 24h so 10 PM – 2 AM serializes
    // distinctly from 2 AM – 10 PM (different intents).
    if (closeMin <= openMin) closeMin += 1440;
    ranges.push([openMin, closeMin]);
  }
  // No ranges parsed but no "Closed" — drop rather than fabricate.
  if (!ranges.length) return null;
  return { day: dayCode, ranges: ranges };
}

function parsePlacesHoursText(arr) {
  if (!Array.isArray(arr)) return null;
  var map = {};
  var matched = 0;
  for (var i = 0; i < arr.length; i++) {
    var parsed = parsePlacesHoursLine(arr[i]);
    if (!parsed || !parsed.ranges) continue;
    map[parsed.day] = parsed.ranges;
    matched++;
  }
  // Need at least one parsed day to count as signal — guarding against
  // a Places response that's all "Hours not available" lines.
  return matched > 0 ? map : null;
}

// Walk the raw JSON-LD objects (window.__auditSchema.objects) for any
// Restaurant / FoodEstablishment-typed entries and collect their
// openingHoursSpecification. Mirrors the worker-side validateOpeningHours
// shape but returns the same per-day map shape parsePlacesHoursText
// emits, so both sources serialize through the same canonical key.
function parseSchemaHoursObjects(objects) {
  if (!Array.isArray(objects)) return null;
  var map = {};
  function addDay(dayRaw, openMin, closeMin) {
    if (dayRaw == null) return;
    var s = String(dayRaw).toLowerCase().replace(/^https?:\/\/schema\.org\//, '').trim();
    var dayCode = HOURS_DAY_NAMES[s];
    if (!dayCode) {
      var tail = s.split('/').pop();
      dayCode = HOURS_DAY_NAMES[tail];
    }
    if (!dayCode) return;
    if (openMin == null || closeMin == null) {
      // schema.org allows opens=null + closes=null to encode "closed."
      // Treat as an empty-ranges day so the absence is meaningful.
      if (!map[dayCode]) map[dayCode] = [];
      return;
    }
    if (closeMin <= openMin) closeMin += 1440;
    if (!map[dayCode]) map[dayCode] = [];
    map[dayCode].push([openMin, closeMin]);
  }
  function ingest(obj) {
    if (!obj) return;
    var spec = obj.openingHoursSpecification;
    var entries = Array.isArray(spec) ? spec : (spec && typeof spec === 'object' ? [spec] : []);
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (!entry) continue;
      var openMin  = parseHoursTimeToMinutes(entry.opens);
      var closeMin = parseHoursTimeToMinutes(entry.closes);
      var dow = entry.dayOfWeek;
      if (Array.isArray(dow)) {
        for (var j = 0; j < dow.length; j++) addDay(dow[j], openMin, closeMin);
      } else {
        addDay(dow, openMin, closeMin);
      }
    }
  }
  for (var k = 0; k < objects.length; k++) ingest(objects[k]);
  // Sort each day's ranges by open-time so [['0660-0870'],['1020-1320']]
  // and [['1020-1320'],['0660-0870']] serialize the same way.
  var hasAny = false;
  Object.keys(map).forEach(function(d){
    map[d].sort(function(a, b){ return a[0] - b[0]; });
    if (map[d].length > 0) hasAny = true;
  });
  // Return null if nothing parsed — we don't want an empty {} to look
  // like a confident "closed every day" signal.
  return hasAny || Object.keys(map).length > 0 ? map : null;
}

// Canonical serialization used as the equality key when comparing two
// hours sources. Stable order, fixed-width padded times, day codes in
// the canonical Mo→Su sequence.
//
//   serialize({ Mo:[[660,1320]] }) === 'Mo:0660-1320'
//   serialize({})                  === ''  (means "closed every day")
function serializeHoursDayMap(map) {
  if (!map || typeof map !== 'object') return null;
  var pieces = [];
  for (var i = 0; i < HOURS_DAY_ORDER.length; i++) {
    var d = HOURS_DAY_ORDER[i];
    if (!map[d]) continue;
    if (map[d].length === 0) {
      pieces.push(d + ':closed');
      continue;
    }
    var rangeStrs = map[d].map(function(r){
      return pad4(r[0]) + '-' + pad4(r[1]);
    });
    pieces.push(d + ':' + rangeStrs.join(','));
  }
  return pieces.join('|');
}
function pad4(n) {
  var s = String(Math.floor(n));
  while (s.length < 4) s = '0' + s;
  return s;
}

// ---------------------------------------------------------------------------
// Phase 2 U6: freshness-label bucket selection.
// ---------------------------------------------------------------------------
// Given an age in seconds since the audit ran, return the i18n key
// the chip should render plus any template variables. Pure function
// so the boundary cases (just-now vs minutes, days vs date) are
// testable without a DOM or a live clock. The caller resolves the
// key through t() and applies the resulting string.
//
// Buckets:
//   0..59     s  -> 'freshness.justNow'
//   60..3599  s  -> 'freshness.minutesAgo'  vars: { count: minutes }
//   3600..86399 -> 'freshness.hoursAgo'    vars: { count: hours }
//   86400..7d  -> 'freshness.daysAgo'      vars: { count: days }
//   7d..       -> 'freshness.onDate'       vars: { date: ISO date }
//
// ageSeconds is clamped at 0; negative values (clock skew, future
// timestamp) collapse to 'just now' rather than rendering nonsense.
function pickFreshnessKey(ageSeconds, nowMs) {
  // Defensive on bad input: NaN, Infinity, undefined, negative, or
  // non-numeric all collapse to the just-now bucket. The chip never
  // crashes the audit page just because a clock got skewed.
  if (typeof ageSeconds !== 'number' || !isFinite(ageSeconds)) {
    return { key: 'freshness.justNow', vars: {} };
  }
  var age = Math.max(0, Math.floor(ageSeconds));
  if (age < 60) return { key: 'freshness.justNow', vars: {} };
  if (age < 3600) return { key: 'freshness.minutesAgo', vars: { count: Math.floor(age / 60) } };
  if (age < 86400) return { key: 'freshness.hoursAgo', vars: { count: Math.floor(age / 3600) } };
  if (age < 86400 * 7) return { key: 'freshness.daysAgo', vars: { count: Math.floor(age / 86400) } };
  // Older than a week — render the absolute date. Caller passes the
  // current time so we can compute the original timestamp without
  // re-reading the clock; this is what makes the function testable.
  var origin = (typeof nowMs === 'number' ? nowMs : Date.now()) - (age * 1000);
  var iso = new Date(origin).toISOString().slice(0, 10); // YYYY-MM-DD
  return { key: 'freshness.onDate', vars: { date: iso } };
}

// ---------------------------------------------------------------------------
// Phase 2 U9: rank actionable findings by estimated $ impact.
// ---------------------------------------------------------------------------
// Shared helper used by both the Top 3 Fixes card and the Action Plan
// columns so the two "what to do first" surfaces stay in sync — an
// owner never sees contradictory prioritization between them.
//
// Contract: the `items` argument is an array of
//   { entry: {def, result}, weight: number, statusRank: number,
//     dollarImpact?: number | null }
//
// Items WITH a numeric dollarImpact always outrank items WITHOUT one —
// the owner can make a concrete decision against a dollar number, so
// weight-only items tail in after. Inside each group, sort keys run
// dollarImpact DESC → weight DESC → statusRank DESC → index ASC so
// declaration order is the stable tiebreaker.
//
// The `dollarImpactFn` argument is an adapter: a function that takes
// a priority-check def and returns its dollar midpoint, or null. It is
// an argument (not a hard-coded call to estimateRevenueAtRiskRange)
// because that helper lives in the browser IIFE and depends on
// DEFAULT_OWNER_INPUTS which the Node test harness controls directly.
// Passing the function in also keeps this module pure — no globals,
// no hidden dependencies — so the tests stay deterministic.
function rankActionablesByImpact(items, dollarImpactFn) {
  if (!Array.isArray(items)) return items;
  var impactOf = (typeof dollarImpactFn === 'function')
    ? dollarImpactFn
    : function(){ return null; };
  for (var i = 0; i < items.length; i++) {
    var x = items[i];
    if (x && typeof x.dollarImpact !== 'number') {
      var def = x.entry && x.entry.def;
      var v = impactOf(def);
      x.dollarImpact = (typeof v === 'number') ? v : null;
    }
    if (x && typeof x.__idx !== 'number') x.__idx = i;
  }
  items.sort(function(a, b){
    var aHas = (typeof a.dollarImpact === 'number');
    var bHas = (typeof b.dollarImpact === 'number');
    if (aHas !== bHas) return aHas ? -1 : 1;
    if (aHas && b.dollarImpact !== a.dollarImpact) return b.dollarImpact - a.dollarImpact;
    var aw = (typeof a.weight === 'number') ? a.weight : 0;
    var bw = (typeof b.weight === 'number') ? b.weight : 0;
    if (bw !== aw) return bw - aw;
    var ar = (typeof a.statusRank === 'number') ? a.statusRank : 0;
    var br = (typeof b.statusRank === 'number') ? b.statusRank : 0;
    if (br !== ar) return br - ar;
    return a.__idx - b.__idx;
  });
  return items;
}

// Sprint A5: Node-only export shim so a scoring regression test can
// import the readiness helpers without a browser. The `typeof module`
// guard keeps this a no-op for the classic-script load path in the
// browser. Only the scorer internals are exported; everything else
// stays a plain top-level global as before.
/* ====================================================================
   D5 — Developer-handoff document generators.

   The audit page already has a per-row "Copy for your developer" button
   that emits one prompt per check. The handoff doc is a complementary
   artifact — the WHOLE actionable list rolled into a single document
   the owner can paste into Linear/Jira/ClickUp or hand to an agency
   for scoping. Two output shapes:

     buildHandoffMarkdown(payload)        -> string
     buildHandoffPrintableHtml(payload)   -> string

   Both share the same input contract so the UI gathers data once:

     {
       auditedUrl:    string,
       host:          string         // already prettified (no protocol)
       score:         number 0..100,
       capturedAt:    number ms      // optional — defaults to "recently"
       permalinkUrl:  string|null    // ?s=<token> URL when available
       subtype:       string|null,
       verdict:       string|null,
       checks:        Array<{
         id:          string,
         title:       string,
         state:       'fail' | 'unverified' | 'pass',
         minutes:     number|null,
         effort:      'self' | 'dev' | 'rebuild' | null,
         impact:      string|null,
         note:        string|null
       }>
     }

   Pure functions: zero DOM, zero network, zero side effects. The
   sortChecksForHandoff helper is exported so callers can pre-sort
   without re-deriving the ranking heuristic.
   ==================================================================== */

function sortChecksForHandoff(checks) {
  if (!Array.isArray(checks)) return [];
  // Failures first (most actionable), then unverified (needs owner
  // confirmation), then everything else last. Within a state group,
  // shorter-effort items come first so a dev sees the quick wins on
  // top — matches the rankActionablesByImpact intent without
  // requiring the impact-fn dependency at handoff time.
  var STATE_RANK = { fail: 0, unverified: 1, pass: 2, skip: 3 };
  var EFFORT_RANK = { self: 0, dev: 1, rebuild: 2 };
  return checks.slice().sort(function(a, b) {
    var sa = STATE_RANK[a.state] != null ? STATE_RANK[a.state] : 9;
    var sb = STATE_RANK[b.state] != null ? STATE_RANK[b.state] : 9;
    if (sa !== sb) return sa - sb;
    var ea = EFFORT_RANK[a.effort] != null ? EFFORT_RANK[a.effort] : 9;
    var eb = EFFORT_RANK[b.effort] != null ? EFFORT_RANK[b.effort] : 9;
    if (ea !== eb) return ea - eb;
    var ma = typeof a.minutes === 'number' ? a.minutes : 9999;
    var mb = typeof b.minutes === 'number' ? b.minutes : 9999;
    return ma - mb;
  });
}

function _handoffActionableOnly(checks) {
  return sortChecksForHandoff(checks).filter(function(c) {
    return c.state === 'fail' || c.state === 'unverified';
  });
}

function _handoffEffortLabel(effort, minutes, lang) {
  // Same ladder the per-row chips use, expressed as a single string
  // an agency can scope from. Minutes/hours conversion matches
  // index.html's chip render. D6: routes through UI_I18N keys so
  // the labels match the audit-page voice in EN + ES.
  if (effort === 'rebuild') return t('handoff.effort.rebuild', null, lang);
  if (typeof minutes === 'number' && minutes > 0) {
    if (minutes < 5)   return t('handoff.effort.minutesShort', null, lang);
    if (minutes < 60)  return t('handoff.effort.minutes', { n: minutes }, lang);
    if (minutes < 180) return t('handoff.effort.hours', { n: Math.round(minutes / 60) }, lang);
    return t('handoff.effort.rebuild', null, lang);
  }
  if (effort === 'self') return t('handoff.effort.self', null, lang);
  if (effort === 'dev')  return t('handoff.effort.dev', null, lang);
  return null;
}

function _handoffStateLabel(state, lang) {
  if (state === 'fail')       return t('handoff.state.fail',       null, lang);
  if (state === 'unverified') return t('handoff.state.unverified', null, lang);
  if (state === 'pass')       return t('handoff.state.pass',       null, lang);
  return state || '';
}

function _handoffFormatDate(ts) {
  if (!ts) return null;
  try {
    var d = new Date(ts);
    if (isNaN(d.getTime())) return null;
    // ISO-ish: YYYY-MM-DD (no locale assumption — handoff docs go to
    // whoever; absolute dates beat relative ones outside the UI).
    var y = d.getUTCFullYear();
    var m = String(d.getUTCMonth() + 1).padStart(2, '0');
    var day = String(d.getUTCDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  } catch (_) { return null; }
}

function _handoffEscapeMd(s) {
  // Light markdown escape: backticks + pipe + leading hash so
  // titles like "200 OK status" or "section-header" don't break the
  // surrounding rendering.
  return String(s == null ? '' : s)
    .replace(/`/g, '\\`')
    .replace(/\|/g, '\\|');
}

function _handoffEscapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHandoffMarkdown(payload) {
  if (!payload || typeof payload !== 'object') return '';
  var lang = (payload.language === 'es') ? 'es' : 'en';
  var host = payload.host || payload.auditedUrl || '—';
  var score = (typeof payload.score === 'number') ? Math.round(payload.score) : null;
  var date = _handoffFormatDate(payload.capturedAt);
  var actionable = _handoffActionableOnly(payload.checks || []);

  var lines = [];
  // Header — "Restaurant website audit — host"
  lines.push('# ' + t('handoff.titlePrefix', null, lang) + ' — ' + host);
  if (score !== null || date) {
    var bits = [];
    if (score !== null) {
      // Bold the whole "Score 62/100" line so the number reads loud
      // even inside the surrounding _italic_ wrapper.
      bits.push('**' + t('handoff.score', { score: String(score) }, lang) + '**');
    }
    if (date) bits.push(t('handoff.captured', { date: date }, lang));
    lines.push('_' + bits.join(' · ') + '_');
  }
  lines.push('');
  if (payload.auditedUrl) {
    lines.push('**' + t('handoff.auditedLabel', null, lang) + '** ' + payload.auditedUrl);
  }
  if (payload.permalinkUrl) {
    lines.push('**' + t('handoff.permalinkLabel', null, lang) + '** ' + payload.permalinkUrl);
  }
  if (payload.verdict) {
    lines.push('');
    lines.push('> ' + payload.verdict);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Action list
  if (!actionable.length) {
    lines.push(t('handoff.empty', null, lang));
  } else {
    lines.push('## ' + t('handoff.actionsHeader', { n: actionable.length }, lang));
    lines.push('');
    actionable.forEach(function(c, idx) {
      var bits = [_handoffStateLabel(c.state, lang)];
      var effort = _handoffEffortLabel(c.effort, c.minutes, lang);
      if (effort) bits.push(effort);
      lines.push('### ' + (idx + 1) + '. ' + _handoffEscapeMd(c.title || c.id));
      lines.push('`' + bits.join('` · `') + '`');
      if (c.note)   { lines.push(''); lines.push(c.note); }
      if (c.impact) {
        lines.push('');
        lines.push('**' + t('handoff.why', null, lang) + '** ' + c.impact);
      }
      lines.push('');
    });

    // Scope-of-work paragraph: a short, non-prescriptive frame an
    // agency or freelancer can quote from. Only present when there's
    // actually a list to scope — printing it under an empty action
    // list would be absurd.
    lines.push('---');
    lines.push('');
    lines.push('## ' + t('handoff.scope.header', null, lang));
    lines.push('');
    lines.push(t('handoff.scope.body', null, lang));
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(t('handoff.footer', null, lang));
  return lines.join('\n');
}

function buildHandoffPrintableHtml(payload) {
  if (!payload || typeof payload !== 'object') return '';
  var lang = (payload.language === 'es') ? 'es' : 'en';
  var host = payload.host || payload.auditedUrl || '—';
  var score = (typeof payload.score === 'number') ? Math.round(payload.score) : null;
  var date = _handoffFormatDate(payload.capturedAt);
  var actionable = _handoffActionableOnly(payload.checks || []);

  var headBits = [];
  if (score !== null) {
    // Replace the {score} placeholder ourselves so we can wrap the
    // numeric portion in <strong> instead of the whole label.
    var scoreLabel = t('handoff.score', null, lang)
      .replace('{score}', '<strong>' + score + '/100</strong>');
    headBits.push(scoreLabel);
  }
  if (date) headBits.push(t('handoff.captured', { date: _handoffEscapeHtml(date) }, lang));

  var emptyHtml = '<p class="empty">' + _handoffEscapeHtml(t('handoff.empty', null, lang)) + '</p>';
  var scopeHtml = actionable.length === 0 ? '' :
    '<section class="scope">' +
      '<h2 class="section">' + _handoffEscapeHtml(t('handoff.scope.header', null, lang)) + '</h2>' +
      '<p class="scope-body">' + _handoffEscapeHtml(t('handoff.scope.body', null, lang)) + '</p>' +
    '</section>';

  var rowsHtml = actionable.length === 0
    ? emptyHtml
    : actionable.map(function(c, idx) {
        var stateClass = 'state-' + (c.state || 'unknown');
        var effort = _handoffEffortLabel(c.effort, c.minutes, lang);
        var chips = '<span class="chip ' + stateClass + '">' + _handoffEscapeHtml(_handoffStateLabel(c.state, lang)) + '</span>';
        if (effort) chips += '<span class="chip chip-effort">' + _handoffEscapeHtml(effort) + '</span>';
        var noteHtml   = c.note   ? '<p class="note">'   + _handoffEscapeHtml(c.note)   + '</p>' : '';
        var impactHtml = c.impact ? '<p class="impact"><strong>' + _handoffEscapeHtml(t('handoff.why', null, lang)) + '</strong> ' + _handoffEscapeHtml(c.impact) + '</p>' : '';
        return '<article class="action-item">' +
          '<header><span class="num">' + (idx + 1) + '</span><h2>' + _handoffEscapeHtml(c.title || c.id) + '</h2></header>' +
          '<div class="chips">' + chips + '</div>' +
          noteHtml + impactHtml +
          '</article>';
      }).join('');

  return '<!doctype html>\n<html lang="' + _handoffEscapeHtml(lang) + '"><head>' +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + _handoffEscapeHtml(t('handoff.titlePrefix', null, lang)) + ' — ' + _handoffEscapeHtml(host) + '</title>' +
    '<style>' +
      ':root{--ink:#14161A;--ink-soft:#2A2D33;--stone:#7A7F87;--cream:#FAF7F2;--cream-2:#F3EEE3;--teal:#1F4E5B;--teal-tint:rgba(31,78,91,0.06);--rust:#B8541A;--line:#E8E2D6}' +
      '*{box-sizing:border-box}' +
      'html,body{margin:0;padding:0;background:var(--cream);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;font-size:14px;line-height:1.55}' +
      '.doc{max-width:760px;margin:0 auto;padding:48px 36px}' +
      'header.doc-header{padding-bottom:24px;border-bottom:2px solid var(--ink);margin-bottom:24px}' +
      '.doc-eyebrow{font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--teal);margin:0 0 6px}' +
      '.doc h1{font-family:Georgia,"Times New Roman",serif;font-size:30px;font-weight:500;margin:0 0 8px;line-height:1.2}' +
      '.doc-meta{margin:0;color:var(--ink-soft);font-size:13.5px}' +
      '.doc-meta strong{color:var(--ink)}' +
      '.doc-links{margin:18px 0 0;font-size:13px;color:var(--ink-soft)}' +
      '.doc-links div{margin:4px 0}' +
      '.doc-links a{color:var(--teal);word-break:break-all}' +
      '.verdict{margin:16px 0 0;padding:14px 16px;background:var(--teal-tint);border-left:3px solid var(--teal);border-radius:8px;font-size:14px;color:var(--ink)}' +
      'h2.section{font-family:Georgia,serif;font-size:20px;font-weight:500;margin:32px 0 16px}' +
      '.action-item{break-inside:avoid;page-break-inside:avoid;background:#fff;border:1px solid var(--line);border-radius:10px;padding:18px 20px;margin:0 0 14px}' +
      '.action-item header{display:flex;align-items:baseline;gap:10px;margin:0 0 8px}' +
      '.action-item .num{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:var(--teal);color:#fff;font-size:12px;font-weight:700;flex:none}' +
      '.action-item h2{font-family:Georgia,serif;font-size:17px;font-weight:600;margin:0;color:var(--ink);line-height:1.3}' +
      '.chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}' +
      '.chip{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:0.04em;background:var(--cream-2);color:var(--ink-soft);border:1px solid var(--line)}' +
      '.chip.state-fail{background:rgba(184,84,26,0.08);color:var(--rust);border-color:rgba(184,84,26,0.25)}' +
      '.chip.state-unverified{background:rgba(31,78,91,0.06);color:var(--teal);border-color:rgba(31,78,91,0.18)}' +
      '.chip.chip-effort{background:#fff;color:var(--ink-soft)}' +
      '.note{margin:6px 0;color:var(--ink-soft);font-size:13.5px}' +
      '.impact{margin:6px 0 0;color:var(--ink-soft);font-size:13px}' +
      '.impact strong{color:var(--ink)}' +
      '.empty{padding:24px;text-align:center;color:var(--stone);font-style:italic;background:#fff;border:1px dashed var(--line);border-radius:10px}' +
      '.scope{margin-top:24px}' +
      '.scope-body{margin:0;padding:14px 16px;background:var(--cream-2);border:1px solid var(--line);border-radius:10px;font-size:13.5px;line-height:1.55;color:var(--ink-soft)}' +
      'footer.doc-footer{margin-top:32px;padding-top:18px;border-top:1px solid var(--line);font-size:12px;color:var(--stone)}' +
      'footer.doc-footer a{color:var(--teal)}' +
      '@media print{html,body{background:#fff}.doc{max-width:none;margin:0;padding:24px 32px}.action-item{box-shadow:none}}' +
    '</style></head><body><div class="doc">' +
    '<header class="doc-header">' +
      '<p class="doc-eyebrow">' + _handoffEscapeHtml(t('handoff.eyebrow', null, lang)) + '</p>' +
      '<h1>' + _handoffEscapeHtml(host) + '</h1>' +
      (headBits.length ? '<p class="doc-meta">' + headBits.join(' · ') + '</p>' : '') +
      '<div class="doc-links">' +
        (payload.auditedUrl ? '<div><strong>' + _handoffEscapeHtml(t('handoff.auditedLabel', null, lang)) + '</strong> <a href="' + _handoffEscapeHtml(payload.auditedUrl) + '">' + _handoffEscapeHtml(payload.auditedUrl) + '</a></div>' : '') +
        (payload.permalinkUrl ? '<div><strong>' + _handoffEscapeHtml(t('handoff.permalinkLabel', null, lang)) + '</strong> <a href="' + _handoffEscapeHtml(payload.permalinkUrl) + '">' + _handoffEscapeHtml(payload.permalinkUrl) + '</a></div>' : '') +
      '</div>' +
      (payload.verdict ? '<p class="verdict">' + _handoffEscapeHtml(payload.verdict) + '</p>' : '') +
    '</header>' +
    (actionable.length ? '<h2 class="section">' + _handoffEscapeHtml(t('handoff.actionsHeader', { n: actionable.length }, lang)) + '</h2>' : '') +
    rowsHtml +
    scopeHtml +
    '<footer class="doc-footer">' + _handoffEscapeHtml(t('handoff.footer', null, lang)) + '</footer>' +
    '</div></body></html>';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createRestaurantReadinessState: createRestaurantReadinessState,
    accumulateRestaurantReadiness: accumulateRestaurantReadiness,
    finalizeRestaurantReadinessScore: finalizeRestaurantReadinessScore,
    rankActionablesByImpact: rankActionablesByImpact,
    pickFreshnessKey: pickFreshnessKey,
    parsePlacesHoursText: parsePlacesHoursText,
    parsePlacesHoursLine: parsePlacesHoursLine,
    parseSchemaHoursObjects: parseSchemaHoursObjects,
    serializeHoursDayMap: serializeHoursDayMap,
    parseHoursTimeToMinutes: parseHoursTimeToMinutes,
    computeReviewResponsiveness: computeReviewResponsiveness,
    extractMenuSignals: extractMenuSignals,
    MENU_INTEL_PRICE_FLOOR: MENU_INTEL_PRICE_FLOOR,
    MENU_INTEL_PHOTO_FLOOR: MENU_INTEL_PHOTO_FLOOR,
    extractCrawlPageUrls: extractCrawlPageUrls,
    computeMarginHealth: computeMarginHealth,
    MARGIN_HEALTH_PENALTIES: MARGIN_HEALTH_PENALTIES,
    POWERED_BY: POWERED_BY,
    MUNTIN_AUDIT_DESCRIPTION: MUNTIN_AUDIT_DESCRIPTION,
    MUNTIN_AUDIT_DESCRIPTION_ES: MUNTIN_AUDIT_DESCRIPTION_ES,
    UI_I18N: UI_I18N,
    t: t,
    poweredByRole: poweredByRole,
    RESTAURANT_SCHEMA_FIELDS: RESTAURANT_SCHEMA_FIELDS,
    OG_META_FIELDS: OG_META_FIELDS,
    // D5: developer-handoff generators
    buildHandoffMarkdown: buildHandoffMarkdown,
    buildHandoffPrintableHtml: buildHandoffPrintableHtml,
    sortChecksForHandoff: sortChecksForHandoff
  };
}
