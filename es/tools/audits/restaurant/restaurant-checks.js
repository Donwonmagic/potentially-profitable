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
    impact: 'Sin la etiqueta viewport, todo visitante desde el teléfono ve un layout de escritorio roto. Cerca del 70 % del tráfico de restaurantes es móvil, así que un viewport faltante es el 70 % de tu tráfico rebotando al contacto.',
    pass: 'Tu sitio entra en la pantalla del teléfono',
    passNote: 'Tus páginas se muestran automáticamente al ancho del teléfono — la revisión más importante de preparación para móvil, y la pasas.',
    fail: 'Tu sitio no está preparado para el teléfono',
    failNote: 'Sin la etiqueta meta viewport, los navegadores móviles muestran tu sitio al ancho de escritorio y después lo reducen para que entre. Todo se ve diminuto y toda la experiencia móvil se rompe. Es un arreglo de un solo renglón para quien te mantiene el sitio — pídele que agregue <code>&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code> al &lt;head&gt;.',
    unverified: 'No pudimos verificar si tu sitio entra en el teléfono',
    unverifiedNote: 'Lighthouse no pudo evaluar la etiqueta viewport en esta corrida. Vuelve a auditar en unos segundos y normalmente se resuelve.'
  },
  {
    type: 'audit',
    audit: 'tap-targets',
    weight: 1.0,
    anchor: '#mobile',
    effort: 'dev',
    minutes: 20,
    impact: 'Cada toque fallido es un cliente frustrado. En un sitio de restaurante donde el botón más tocado suele ser Reservar o Pedir, los botones pequeños se traducen directo en reservas perdidas.',
    pass: 'Tus botones son lo suficientemente grandes para tocar',
    passNote: 'Tus botones de acción son lo suficientemente grandes para pegarles a la primera con el pulgar mientras sostienes el teléfono con una sola mano.',
    fail: 'Algunos de tus botones son muy chicos para tocarlos con confianza',
    failNote: 'Los botones de acción menores a 44×44 píxeles generan toques fallidos. En un sitio de restaurante, un toque fallido en "Reservar" es una reserva que se va caminando por la puerta. Sube el relleno del botón a 12 px por cada lado, y dale a los enlaces al menos 44 px de espacio vertical alrededor.',
    unverified: 'No pudimos verificar la facilidad de toque de tus botones',
    unverifiedNote: 'Lighthouse no pudo evaluar los botones de toque en esta corrida. Vuelve a auditar en unos segundos y normalmente se resuelve.',
    byType: {
      'fine-dining': {
        impact: 'En un sitio de alta cocina, el botón "Reservar" carga casi todo el embudo de reservas — es el único toque entre "tengo curiosidad" y "estoy anotado para el sábado". Chico o apretado, y pierdes la reserva.',
        failNote: 'Los botones de acción menores a 44×44 píxeles generan toques fallidos. El botón de "Reservar" es el que importa — dale al menos 48×48 px y mucho aire alrededor para que el impulso del sábado en la noche de verdad termine en reserva.'
      },
      'fast-casual': {
        impact: 'El tráfico fast-casual es casi todo móvil y abrumadoramente con intención — alguien está pidiendo el almuerzo desde el teléfono mientras camina a la oficina. "Pedir en línea" es el botón más tocado de tu sitio. Si es chico, se rinden y abren DoorDash.',
        failNote: 'Los botones menores a 44×44 píxeles generan fallas. "Pedir en línea" es el botón crítico — sube su relleno a al menos 12 px por cada lado y mantenlo visualmente distinto de los enlaces secundarios.'
      },
      'cafe': {
        impact: 'La mayoría del tráfico de cafetería es intención de horarios-y-ubicación: "¿está abierto?" y "¿dónde queda?". El bloque de horarios y el pin del mapa tienen que ser tocables sin hacer zoom — un toque fallido manda al cliente a la cafetería de la vuelta.',
        failNote: 'Horarios, teléfono y enlaces de mapa son las tres prioridades de botones para una cafetería. No tienen que ser botones enormes — solo dales suficiente relleno (12 px) para que el pulgar los pegue con confianza.'
      },
      'bakery': {
        impact: 'El tráfico de panadería se inclina fuerte hacia consultas de pasteles personalizados y pedidos anticipados de mañana — "Pedir por adelantado" y "Solicitar un pastel personalizado" son los dos botones que cargan con pedidos de boda de USD 500 a 2,000 y pedidos anticipados de croissant de USD 30. Un toque fallido es un pedido realmente perdido.',
        failNote: 'Sube los botones de "Pedir por adelantado" y "Consulta de pastel personalizado" a 48×48 con 12 px+ de relleno — estos dos cargan con casi todo tu ingreso en línea. Los demás enlaces pueden ser más pequeños.'
      },
      'pizzeria': {
        impact: 'En un sitio de pizzería, "Pedir entrega" y "Arrancar un pedido para recoger" son la conversión. Casi todo el tráfico móvil es intención de hambre-ya, y un toque fallido rutea ese pedido a Slice o DoorDash (donde pagas 20 a 30 % de comisión) en segundos.',
        failNote: '"Pedir entrega" y "Pedido para recoger" necesitan botones de 48×48 y relleno para separarlos de la navegación secundaria. Cada toque fallido a las 7 de la tarde un viernes se va a un agregador — literalmente pagas comisión por cada falla.'
      },
      'food-truck': {
        impact: 'El tráfico de food truck es todo móvil y todo con intención — "¿dónde están hoy?", "¿qué hay en el menú ahora mismo?". Los botones de "Ver el horario de hoy" y del enlace a Instagram cargan con todo el embudo de descubrimiento. Un toque fallido manda a los clientes con hambre a lo que sea que Google Maps tenga cerca.',
        failNote: 'Los botones de "Ubicación de hoy" y "Ver nuestro horario" necesitan botones de 48×48 y buen relleno. Tu chip del handle de Instagram va en la misma prioridad — es donde terminan la mayoría de las actualizaciones reales de tu horario.'
      },
      'ghost-kitchen': {
        impact: 'Los sitios de cocina fantasma son páginas de descubrimiento — los clientes entraron a confirmar que eres real antes de hacer un pedido en DoorDash o Uber Eats. Los botones de los agregadores "Pedir en DoorDash / Uber Eats / Grubhub" son la conversión principal. Las fallas se convierten en pedidos para una cocina competidora en la misma plataforma.',
        failNote: 'Dimensiona los botones de los agregadores "Pedir en…" primero — cargan con casi todos tus pedidos. 48×48 con relleno, y ponlos apilados con claridad para que un cliente con hambre desde el teléfono a las 9 de la noche pueda tocar el que prefiere sin fallar.'
      },
      'catering-only': {
        impact: 'Los sitios de solo catering convierten a través de dos botones: "Solicitar cotización" (o "Reservar tu evento") y un teléfono tocable. Todo lo demás en el sitio sostiene esos dos. Un toque fallido en el formulario de cotización — sobre todo desde el teléfono de un planificador corporativo con 15 caterings en pestañas — es una pérdida directa de una reserva de USD 2,000 a 15,000.',
        failNote: '"Solicitar cotización" y el teléfono tocable son los dos botones de mayor valor del sitio. Ambos necesitan botones de 48×48 y suficiente relleno para tocarlos limpio con el pulgar. Todo lo demás (galería, testimonios, enlaces a paquetes) puede ser más chico.'
      },
      'bar-pub': {
        impact: 'El tráfico de bar suele ser nocturno y de último minuto — "¿sigue la hora feliz?", "¿están abiertos?", "¿hay cover?". Un teléfono tocable y un mapa tocable son los dos botones que se ganan su espacio.',
        failNote: 'Los botones menores a 44×44 píxeles generan fallas. En un sitio de bar, el número de teléfono y los enlaces al mapa son lo que los visitantes de verdad tocan — asegúrate de que esos en particular tengan 12 px+ de relleno y no estén apretados contra otros enlaces.'
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
    impact: 'Cerca de 1 de cada 4 adultos mayores de 40 años tiene alguna forma de dificultad visual relacionada con la edad. Si el texto de tu menú falla en contraste, estás dejando plata sobre la mesa justo del segmento demográfico que sale a comer más seguido.',
    pass: 'El texto de tu menú es legible para todos',
    passNote: 'Una persona de 55 años parada bajo el sol directo puede leer las descripciones de tu menú. Esa es la vara real para un menú móvil de restaurante — y la cumples.',
    fail: 'Parte de tu texto es difícil de leer',
    failNote: 'Gris claro sobre crema o oscuro sobre oscuro es invisible para cualquier persona de más de 40 años o para cualquiera parado afuera al sol. La mayoría de tu clientela de almuerzo entre semana es una de esas personas. Oscurece el texto del cuerpo o aclara el fondo — apunta al menos al ratio de contraste WCAG AA (4,5:1 para texto normal).',
    unverified: 'No pudimos verificar el contraste del texto de tu menú',
    unverifiedNote: 'Lighthouse no pudo evaluar el contraste de color en esta corrida. Vuelve a auditar en unos segundos y normalmente se resuelve.',
    byType: {
      'fine-dining': {
        impact: 'Los menús de alta cocina viven o mueren por la descripción cuidada — un comensal de 55 años ojeando el copy del menú de degustación en el teléfono en un taxi necesita que cada palabra sea legible. Los serifs delgados sobre fondos crema son un culpable frecuente.',
        passNote: 'Tu copy del menú de degustación y de la carta de vinos cumple los umbrales de contraste — legible sin entrecerrar los ojos, incluso para el segmento que de verdad llena tu comedor.',
        failNote: 'La estética de los menús de alta cocina suele usar serifs grises delgados sobre crema o tarjetas oscuro-sobre-oscuro — elegante en pantalla, ilegible en el teléfono. Oscurece el texto del cuerpo para cumplir WCAG AA (ratio 4,5:1), sobre todo las descripciones del menú y las notas de vinos.'
      },
      'fast-casual': {
        impact: 'Las decisiones fast-casual pasan en 20 segundos desde el teléfono a la hora del almuerzo. Los nombres de platos o precios con bajo contraste hacen que el visitante rebote a un agregador de pedidos donde el mismo menú se ve más claro.',
        passNote: 'Los nombres de tus platos y los precios se leen de un vistazo — que es lo que una decisión de pedir en la hora del almuerzo realmente exige.',
        failNote: 'Los nombres de los platos y los precios especialmente necesitan alto contraste. El texto gris delgado sobre fondos beige es la falla de contraste más común en fast-casual — oscurece el texto del cuerpo para cumplir WCAG AA (ratio 4,5:1).'
      },
      'cafe': {
        impact: 'Los clientes de cafetería leen tus horarios, menú y dirección más que ninguna otra cosa. La paleta suave del branding de cafeterías a menudo pone esos tres elementos en gris claro — elegante en una laptop, invisible en un teléfono bajo el sol.',
        passNote: 'Horarios, platos y dirección cumplen los umbrales de contraste — legibles de un vistazo, incluso bajo luz directa.',
        failNote: 'Horarios y dirección son el texto más leído en el sitio de una cafetería. Gris pálido sobre crema se ve a tono con la marca pero falla en contraste — oscurece específicamente esos dos hasta cumplir WCAG AA (ratio 4,5:1).'
      },
      'bakery': {
        impact: 'Los menús de panadería cargan listas de ingredientes, avisos de alérgenos y detalles de pedidos personalizados que el cliente lee CON CUIDADO — un comensal encargando un pastel de boda tiene que confiar en cada etiqueta. El copy de alérgenos con bajo contraste rompe esa confianza.',
        passNote: 'Tu copy de ingredientes y alérgenos cumple los umbrales de contraste — legible en el teléfono por el comensal que está revisando dos veces la especificación del pastel personalizado a las 11 de la noche del día anterior.',
        failNote: 'Los avisos de ingredientes y alérgenos son el copy de mayor riesgo en el sitio de una panadería. Las descripciones en gris pálido sobre crema fallan WCAG AA (4,5:1) y espantan a los clientes nerviosos con pedidos personalizados o restricciones dietarias. Esto es un tema de confianza, no solo de usabilidad.'
      },
      'pizzeria': {
        impact: 'Los sitios de pizza se apoyan en cuadros de precios y listas de ingredientes — los dos fallan en contraste más de lo que esperarías porque el branding suele ser rojo-sobre-rojo o crema-sobre-crema. Un cliente no puede personalizar una pizza con confianza si no puede leer el precio del pepperoni o las opciones de masa.',
        passNote: 'Los precios de ingredientes, las opciones de masa y los precios de combos cumplen los umbrales de contraste — los clientes pueden personalizar una pizza desde el teléfono sin entrecerrar los ojos.',
        failNote: 'Los cuadros de precios y las listas de ingredientes son la superficie de conversión para una pizzería. Los precios en crema-sobre-crema o rojo-sobre-rojo fallan WCAG AA (4,5:1) — oscurece los precios y las etiquetas de ingredientes hasta que se lean limpio en el teléfono afuera.'
      },
      'food-truck': {
        impact: 'Los sitios de food truck se leen AFUERA, bajo sol directo, con el teléfono a la distancia del brazo. El copy con bajo contraste falla al instante en ese ambiente — y horario + menú son las dos cosas que el cliente está entrecerrando los ojos mientras decide si camina hasta allá.',
        passNote: 'Tu copy de horario y menú cumple los umbrales de contraste — legible en un mercado de productores bajo sol directo sin tener que cubrir la pantalla con la mano.',
        failNote: 'La legibilidad al aire libre es la vara para el sitio de un food truck. Los colores de marca pálidos que se ven lindos en Instagram fallan WCAG AA (4,5:1) bajo sol directo — oscurece tu texto de horario + menú hasta que se lean limpio a la distancia del brazo en luz del día.'
      },
      'ghost-kitchen': {
        impact: 'El branding de cocina fantasma se apoya fuerte en fotografía con ambiente y tipografía de bajo contraste — lo que fotografía maravillosamente y convierte pésimo. Los clientes escaneando los horarios de entrega y los detalles de marca del menú en el teléfono a las 9 de la noche necesitan que el copy se lea sin esfuerzo.',
        passNote: 'Horarios, nombres de marca y descripciones del menú cumplen los umbrales de contraste — un cliente con hambre puede confirmar "sí, esto es un restaurante real" sin entrecerrar los ojos.',
        failNote: 'El branding de cocina fantasma con fotografía de ambiente suele fallar WCAG AA (4,5:1) — tipografía pálida sobre imágenes hero oscuras es la infractora más común. Oscurece el texto del cuerpo y sobre todo los horarios/nombres de marca; ese es el copy que los clientes de verdad leen antes de entrar a una app de delivery.'
      },
      'catering-only': {
        impact: 'Los sitios de catering cargan descripciones de paquetes, tablas de precio por persona, avisos de acomodo dietario y políticas de tiempo mínimo de aviso — todo lo cual un planificador de eventos lee CON CUIDADO antes de pedir una cotización. El copy de precios con bajo contraste rompe la confianza justo cuando un comprador profesional está comparando tres caterings lado a lado.',
        passNote: 'Los precios de los paquetes, las cuentas por cabeza y el copy de acomodo dietario cumplen los umbrales de contraste — legibles de un vistazo desde el teléfono de un planificador haciendo malabares con varios proveedores.',
        failNote: 'Los planificadores de eventos comparando caterings no entrecierran los ojos — rebotan. Gris pálido sobre crema para las descripciones de paquetes y las tablas de precios falla WCAG AA (4,5:1). Oscurece el texto del cuerpo, sobre todo donde listes precios por cabeza o reglas de cantidad mínima.'
      },
      'bar-pub': {
        impact: 'Los sitios de bar a menudo vienen con tema oscuro por defecto, y la legibilidad se resiente. Los invitados revisando la hora de happy hour o la carta de cocteles desde el teléfono en la acera afuera no deberían tener que entrecerrar los ojos.',
        passNote: 'Tu copy con tema oscuro cumple igual los ratios de contraste WCAG AA — los horarios de happy hour y la carta de cocteles se leen sin hacer zoom.',
        failNote: 'Los sitios de bar con tema oscuro fallan contraste más seguido con texto gris medio sobre negro. Sube el brillo del texto del cuerpo (o córrelo hacia casi blanco) hasta que cumpla WCAG AA (ratio 4,5:1) — sobre todo para horarios, horas de happy hour y la carta de cocteles.'
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
    impact: 'Un texto por debajo de 16 px fuerza a iOS a hacer zoom al enfocar y frustra a todo lector móvil. Las descripciones del menú que se ven bien en una laptop suelen ser ilegibles en un teléfono a la distancia del brazo.',
    pass: 'Tu texto es legible sin hacer pinch-zoom',
    passNote: 'El texto del cuerpo está por encima del umbral de legibilidad móvil — los visitantes no tienen que hacer pinch-zoom para leer el menú.',
    fail: 'Tu texto es muy chico en el teléfono',
    failNote: 'Más del 40 % de tu texto está por debajo del umbral de legibilidad. Los visitantes se rinden antes de encontrar su plato principal. Pon el tamaño de fuente del cuerpo en al menos 16 px — para las descripciones del menú y cualquier cosa que un cliente con hambre de verdad tenga que leer, 17 o 18 px es mejor.',
    unverified: 'No pudimos verificar el tamaño de tu texto',
    unverifiedNote: 'Lighthouse no pudo evaluar los tamaños de fuente en esta corrida. Vuelve a auditar en unos segundos y normalmente se resuelve.',
    byType: {
      'fine-dining': {
        impact: 'Las descripciones del menú de degustación, las notas de la carta de vinos y los comentarios de la barra del chef son el texto de mayor valor de tu sitio. Si están muy chicos, fuerzan un pinch-zoom que rompe toda la experiencia de lujo.',
        failNote: 'Pon el tamaño de fuente del cuerpo en al menos 16 px. Para el menú de degustación y la carta de vinos específicamente, 17 o 18 px es el piso — esos bloques de copy descriptivo son los que convencen al comensal de reservar.'
      },
      'fast-casual': {
        impact: 'Los clientes escanean tu menú en el teléfono mientras caminan. Nombres de platos y precios chicos convierten una decisión de 10 segundos en un entrecerrar los ojos de 30 segundos — y cierran la pestaña y vuelven a abrir DoorDash.',
        failNote: 'Pon el tamaño de fuente del cuerpo en al menos 16 px. Los nombres de los platos y los precios específicamente deberían ser 17 o 18 px — el menú es tu página de conversión.'
      },
      'cafe': {
        impact: 'Horarios y ubicación se leen más que nada en el sitio de una cafetería. Tipografía chiquita por debajo de 16 px fuerza a iOS a hacer zoom al enfocar y convierte el "¿están abiertos?" en una pregunta frustrante.',
        failNote: 'Pon el tamaño de fuente del cuerpo en al menos 16 px. El bloque de horarios específicamente debería ser 17 o 18 px — es lo primero que la mayoría de los visitantes de cafetería buscan.'
      },
      'bakery': {
        impact: 'Listas de ingredientes, campos de especificación de pedidos personalizados y copy de fecha de recogida son las tres cosas que un cliente de panadería lee CON MÁS cuidado. Tipografía chiquita fuerza un pinch-zoom justo en los momentos que requieren precisión.',
        failNote: 'Pon el cuerpo en 16 px, y pon las listas de ingredientes más el copy de pedidos personalizados en 17 a 18 px. Los clientes haciendo pedidos de USD 200+ para una fecha específica quieren cero ambigüedad sobre lo que están encargando.'
      },
      'pizzeria': {
        impact: 'Las listas de ingredientes, los avisos de alérgenos (gluten / lácteos / queso sin lácteos) y los detalles de la zona de entrega son el copy que decide todo para una pizzería. Tipografía chiquita fuerza un pinch-zoom justo en el momento en que el cliente está decidiendo entre pedirte a ti o abrir Slice.',
        failNote: 'Pon el cuerpo en 16 px, y pon las listas de ingredientes y el copy de zona de entrega en 17 a 18 px. El cliente eligiendo entre "una grande de pepperoni" y "mitad pepperoni mitad champiñones" nunca debería tener que hacer zoom.'
      },
      'food-truck': {
        impact: 'Los horarios del calendario y el copy de la ubicación de hoy son las dos piezas de contenido que un cliente de food truck lee MÁS — normalmente desde el teléfono, afuera, mientras camina. Tipografía chiquita convierte "¿están en la cervecería esta noche?" en una pregunta más difícil de lo que tendría que ser.',
        failNote: 'Pon el cuerpo en 16 px, y pon los horarios del calendario y el copy de ubicación de hoy en 17 a 18 px. Los dos van en un bloque lo suficientemente grande como para leerse de un vistazo mientras caminas.'
      },
      'ghost-kitchen': {
        impact: 'Los horarios de entrega, el área de servicio y las descripciones del menú son el texto que los clientes de verdad leen — y en las cocinas fantasma ese texto vive compitiendo con mucho branding visual. Tipografía por debajo de 16 px fuerza pinch-zooms justo en las decisiones ("¿están entregando ahora? ¿a mi código postal?") que te cuestan el pedido.',
        failNote: 'Pon el cuerpo en 16 px, y pon el copy de horarios de entrega + área de servicio en 17 a 18 px. Son los dos párrafos que deciden si el cliente siquiera pasa a DoorDash.'
      },
      'catering-only': {
        impact: 'Las descripciones de paquetes, las tablas de precios por persona, los avisos de acomodo dietario y las reglas de tiempo mínimo de aviso son el texto crítico de decisión en un sitio de catering. Tipografía chiquita en el teléfono fuerza al planificador — que ya va apurado — a hacer pinch-zoom por tu tabla de tarifas, lo que es una pésima primera impresión para una reserva de USD 5,000.',
        failNote: 'Pon el cuerpo en 16 px, y pon las descripciones de paquetes + las tablas de precios en 17 a 18 px. Los planificadores corporativos suelen leer desde el teléfono entre reuniones — haz que la tabla de tarifas sea escaneable sin hacer zoom.'
      },
      'bar-pub': {
        impact: 'Las cartas de cocteles, las cartas de cerveza de barril y los detalles de happy hour son el menú del bar. Tipografía chica en el teléfono desde un Uber con poca luz es un impuesto de usabilidad que el invitado no va a pagar.',
        failNote: 'Pon el tamaño de fuente del cuerpo en al menos 16 px. La carta de cocteles / cerveza de barril y los horarios de happy hour merecen 17 o 18 px — esos son los párrafos de conversión para un sitio de bar.'
      }
    }
  },
  {
    type: 'phone',
    weight: 1.5, // real conversion driver for takeout / walk-in
    anchor: '#basics',
    effort: 'self',
    minutes: 2,
    impact: 'En el teléfono, cada toque que requiere copiar y pegar en vez de tocar te cuesta clientes. Las llamadas siguen siendo cómo la mayoría de los pedidos para llevar y las preguntas de reservas llegan a los restaurantes independientes.',
    pass: 'Los visitantes pueden tocar tu teléfono para llamar',
    passNote: 'Tienes un teléfono tocable en tu página — los visitantes móviles pueden llamarte con un toque, lo que importa para pedidos para llevar, preguntas de reservas y llamadas de "¿siguen abiertos?".',
    passNoteText: 'Encontramos un número de teléfono en el texto de tu página, pero no está envuelto en un enlace <code>tel:</code> clicable. Los visitantes móviles tienen que copiar el número a su marcador a mano en vez de tocar para llamar. Pídele a tu desarrollador que envuelva el número en <code>&lt;a href="tel:+1..."&gt;</code>.',
    fail: 'No pudimos encontrar un número de teléfono en tu sitio',
    failNote: 'Sin enlace de tocar-para-llamar y sin un número de teléfono visible en el texto de la página. Todo restaurante recibe llamadas — de "¿están abiertos ahora?", de disponibilidad de mesas, de peticiones especiales — y si tu sitio no hace que llamar sea un solo toque, estás perdiendo esas conversaciones. Agrega un número de teléfono a tu sitio y envuélvelo en un enlace <code>tel:</code>.',
    unverified: 'No pudimos confirmar si tienes un número de teléfono',
    unverifiedNote: 'Solo vemos las partes de tu página que Lighthouse nos muestra — a veces los números de teléfono se escapan. Revisa que el tuyo esté visible en cada página y envuelto en un enlace <code>tel:</code> para que los visitantes móviles puedan tocar para llamar.',
    byType: {
      'fine-dining': {
        impact: 'Los invitados que llaman a un restaurante de alta cocina normalmente tienen una pregunta de alto valor: un menú para ocasión especial, una reserva de grupo grande, un acomodo dietario. Un teléfono faltante o un enlace tel: roto manda esas llamadas — y esas reservas — a la competencia.',
        failNote: 'Las reservas de ocasión especial y de grupo grande casi siempre empiezan con una llamada. Agrega un teléfono y envuélvelo en un enlace <code>tel:</code> para que la conversación nivel concierge de verdad pueda pasar.'
      },
      'fast-casual': {
        impact: 'El tráfico fast-casual es mayormente pedidos en línea, pero un teléfono sigue cerrando los casos borde: "¿hay estacionamiento?", "¿hacen catering?", "¿tienen sin gluten?". Un número tocable evita que esos se conviertan en una reseña de una estrella.',
        failNote: 'Aunque los pedidos en línea manejen la mayor parte de tu conversión, agrega un teléfono tocable. Las llamadas de catering, preguntas dietarias y "¿está listo mi pedido?" todas necesitan un camino de un toque — y convierten a una tasa mucho más alta que los formularios.'
      },
      'cafe': {
        impact: 'Los clientes de cafetería y panadería llaman para confirmar horarios, para preguntar por pedidos de pasteles personalizados, y para reservar tartas enteras o bandejas de catering. Un teléfono faltante es un canal de ingresos faltante — sobre todo por los márgenes de los pedidos personalizados.',
        failNote: 'Las consultas de pedidos personalizados (pasteles de cumpleaños, bandejas de catering, mayoreo) entran por teléfono. Agrega un teléfono tocable — un enlace <code>tel:</code> arriba en cada página es la vara para una cafetería o panadería.'
      },
      'bakery': {
        impact: 'Las consultas de pastel de boda, los pedidos especiales con restricciones dietarias y las consultas de bandejas de catering casi siempre empiezan con una llamada — son los pedidos con margen alto que rara vez convierten por un formulario web. Un teléfono tocable faltante en el sitio de una panadería es un canal de ingresos faltante, punto.',
        failNote: 'Las consultas de pasteles personalizados y de catering entran por teléfono. Agrega un teléfono tocable arriba en cada página — un enlace <code>tel:</code> al lado de tu botón de "Pedir por adelantado" es la base para cualquier panadería que haga trabajo personalizado.'
      },
      'pizzeria': {
        impact: 'Los pedidos por teléfono todavía explican cerca del 40 % de los ingresos de las pizzerías en EE. UU. — y cada uno de esos pedidos que el cliente tiene que marcar a mano es un cliente que quizá se rinde y abre Slice. Las preguntas de tiempo de entrega ("¿cuánto falta?") y las personalizaciones de último minuto ("¿le puedes poner jalapeños?") son conversaciones de un toque.',
        failNote: 'El pedido por teléfono es la base para pizzerías. Agrega un teléfono tocable arriba en cada página, y mantenlo visible al lado del botón de "Pedir en línea" — los dos canales se complementan, y ~40 % de tus ingresos sigue entrando por teléfono.'
      },
      'food-truck': {
        impact: 'Los operadores de food truck normalmente no pueden contestar el teléfono durante el servicio — la persona que contesta es la que está cocinando. Un teléfono tocable igual importa para consultas de catering y eventos privados, que son las reservas con margen alto que mantienen rentables los trucks entre las horas pico.',
        failNote: 'Probablemente no puedas contestar un teléfono en pleno servicio, y está bien. Igual agrega un teléfono tocable para leads de catering y eventos privados; esas llamadas no son tráfico de la hora pico del almuerzo — son reservas de USD 500 a 3,000 que quieres devolver después del servicio.'
      },
      'ghost-kitchen': {
        impact: 'La mayoría de las cocinas fantasma corren con equipo mínimo y no ponen a nadie al teléfono — el servicio al cliente se rutea al soporte del agregador. Está bien como decisión operativa, pero los clientes lo intentan igual. Un teléfono tocable evita la señal de "no son un negocio real" cuando un cliente escéptico está decidiendo si pedir.',
        failNote: 'Aunque no contestes activamente, agrega un teléfono tocable o al menos un número de SMS de respuesta rápida. No tenerlo se lee como "no hay operador real detrás de esta marca" para un cliente escéptico — un golpe de conversión mucho más grande que cualquier tiempo que ahorres escondiendo el número.'
      },
      'catering-only': {
        impact: 'El teléfono es el canal de mayor conversión para catering, por mucho. Los planificadores de eventos hacen malabares con calendarios apretados, cambios de último minuto en la cantidad de personas y excepciones dietarias — todas son conversaciones de teléfono, no de formulario de contacto. Un teléfono tocable faltante en un sitio de catering es un negocio faltante, en la práctica.',
        failNote: 'No negociable para catering. Un teléfono tocable arriba en cada página — idealmente al lado de "Solicitar cotización" — es la base. Los planificadores reservando eventos de USD 2,000+ casi siempre llaman antes de enviar un formulario; darles un número de un toque cierra reservas que el formulario solo no cerraría.'
      },
      'bar-pub': {
        impact: 'Las llamadas a un bar son sensibles al tiempo: "¿están abiertos?", "¿sigue la hora feliz?", "¿necesito reserva esta noche?". Un número de tocar-para-llamar faltante significa que esos visitantes se van a un bar con un teléfono más fácil.',
        failNote: 'No negociable para bares. Los invitados preguntan "¿sigue la happy hour?" en la acera afuera. Agrega un teléfono y envuélvelo en un enlace <code>tel:</code> para que la llamada sea un toque, no un flujo de copiar-pegar.'
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
    impact: 'El camino de "quizá me doy una vuelta por este lugar" a "ya voy manejando para allá" debería ser un solo toque. Un mapa incrustado o un enlace a Maps reduce la fricción de las indicaciones a cero — las direcciones en texto plano agregan todo un flujo de copiar-pegar antes de que el cliente siquiera llegue.',
    pass: 'Los visitantes pueden conseguir indicaciones con un solo toque',
    passNote: '{detected} está en tu sitio — los visitantes de primera vez pueden tocar una vez para conseguir indicaciones paso a paso hasta tu puerta.',
    fail: null, // nunca falla esta revisión — la ausencia siempre queda como no verificada
    failNote: null,
    unverified: 'No vimos un mapa en tu sitio — ¿es correcto?',
    unverifiedNote: 'Escaneamos Google Maps, Apple Maps, Mapbox, Bing Maps, OpenStreetMap, Waze y Leaflet. Si tu sitio usa uno de esos, perfecto — solo que no lo encontramos en esta corrida. Si tu dirección es solo texto plano, considera envolverla en un enlace de Google Maps para que los visitantes puedan lanzar las indicaciones en un solo toque.',
    byType: {
      'fine-dining': {
        impact: 'Los invitados de primera vez que van a una reserva de alta cocina quieren indicaciones paso a paso, no una dirección para copiar y pegar. Un mapa tocable es parte de la experiencia concierge — y se da por hecho.'
      },
      'fast-casual': {
        impact: 'El tráfico fast-casual suele ser intención de "comida cerca de mí" — los visitantes ya están en el teléfono decidiendo a dónde caminar o manejar. Un mapa de un toque le resta 15 segundos a la decisión y los mantiene a salvo de comparar con el lugar de la siguiente cuadra.'
      },
      'cafe': {
        impact: 'El tráfico de cafetería y panadería es abrumadoramente local y movido por los walk-ins. Un enlace de indicaciones de un toque (sobre todo para la dirección de recogida de un catering o un pedido personalizado) elimina el momento de "espera, ¿dónde era este lugar?".'
      },
      'bakery': {
        impact: 'El tráfico matutino de panadería es sensible al tiempo — alguien que pasa por unos croissants a las 7:30 de la mañana no tiene tiempo de batallar con una dirección escrita. Un enlace de indicaciones de un toque mantiene la hora pico de recogida en hora, e importa el doble para clientes mayoristas o de catering que manejan a una dirección de recogida que nunca han visitado.'
      },
      'pizzeria': {
        impact: 'Para las pizzerías el uso principal de un mapa es comunicar la ZONA DE ENTREGA, no solo la dirección del local. Un pin de Google Maps de un toque es el mínimo; un overlay decente de radio de entrega (o al menos una lista de los barrios atendidos) te salva de las llamadas de "¿entregan en mi zona?" que tu gente del teléfono está respondiendo en vez de tomar pedidos.'
      },
      'food-truck': {
        impact: 'Los food trucks SE MUEVEN, lo que invierte la lógica usual del mapa: un pin estático del local es la respuesta equivocada. Lo que el cliente necesita es un mapa de un toque DE LA UBICACIÓN DE HOY (normalmente un campo dinámico en una página de horario), más un enlace a tu Instagram o Twitter donde publicas los cambios en tiempo real. Un mapa de "dirección de la base" desactualizado es peor que no tener mapa.'
      },
      'ghost-kitchen': {
        impact: 'Los clientes nunca visitan una cocina fantasma — lo que les importa es la ZONA DE ENTREGA (códigos postales o barrios que atiendes). Un pin estándar de Google Maps no ayuda con nada; lo que necesitas es una lista clara de "entregamos a…" o una visualización del radio de entrega. Las páginas de los agregadores ya manejan la validación de dirección, pero ver la zona desde arriba ahorra el rebote de los visitantes fuera de rango.'
      },
      'catering-only': {
        impact: 'Los mapas en un sitio de catering son sobre el ÁREA DE SERVICIO, no sobre el local. Un mapa de radio de servicio claro (o una lista escrita de ciudades/condados atendidos) le permite al planificador de eventos autocalificarse antes de invertir en pedir una cotización. También resuelve la pregunta de "¿viajan hasta donde nosotros?" que de otra forma se come los primeros 30 segundos de cada llamada de entrada.'
      },
      'bar-pub': {
        impact: 'El bar hopping pasa en el teléfono. Un mapa tocable — sobre todo para un bar escondido en una calle lateral o en un sótano — puede ser la diferencia entre que un visitante te encuentre o termine en el primer lugar que Google Maps le muestre.'
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
