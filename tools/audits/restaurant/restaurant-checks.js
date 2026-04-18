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
