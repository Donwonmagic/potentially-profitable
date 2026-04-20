/**
 * Registro de subtipos de restaurante — espejo en español de
 * tools/audits/restaurant/subtypes.js para la versión /es/ de la
 * herramienta de diagnóstico. Cargado como script clásico junto a
 * restaurant-checks.js. La canónica sigue siendo src/lib/subtypes.js
 * (ESM); este archivo hereda los ids, tipos de schema, platform
 * hints, pesos y benchmarks del original — solo las etiquetas
 * visibles al usuario y las expresiones regulares de palabras clave
 * están traducidas para detectar sitios de restaurantes en español.
 *
 * Las regex combinan términos en español y en inglés porque los
 * sitios bilingües del DMV mezclan ambos en la misma página (p. ej.
 * "happy hour", "food truck", "brunch" permanecen sin traducir en
 * copy en español). Mantener ambos permite que la detección corra
 * contra cualquier sitio sin importar su idioma predominante.
 *
 * Ver src/lib/subtypes.js para la especificación campo por campo.
 */

var RESTAURANT_SUBTYPES = [
  {
    id: 'fine-dining',
    label: 'Restaurante de alta cocina',
    schemaTypes: [],
    platformHints: { resy: 5, tock: 5, sevenrooms: 4, opentable: 2 },
    keywords: [
      /\bmen[úu]\s+de\s+degustaci[óo]n\b/i, /\bmen[úu]\s+degustaci[óo]n\b/i,
      /\bprix\s+fixe\b/i, /\bmen[úu]\s+fijo\b/i,
      /\bsommelier\b/i,
      /\b(?:barra|mesa)\s+del\s+chef\b/i,
      /\bmaridaje(?:\s+de\s+vinos?)?\b/i,
      /\bdegustaci[óo]n\b/i, /\btasting\s+menu\b/i,
      /\bamuse[-\s]?bouche\b/i, /\bmichelin\b/i,
      /\b(?:multi[-\s]?course|varios\s+tiempos|m[úu]ltiples\s+tiempos)\b/i,
      /\bomakase\b/i,
      /\balta\s+cocina\b/i, /\bmen[úu]\s+de\s+autor\b/i
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
    label: 'Restaurante casual / de servicio completo',
    schemaTypes: ['Restaurant', 'FoodEstablishment'],
    platformHints: { opentable: 3, yelpreservations: 2, toast: 1, square: 1 },
    keywords: [
      /\b(?:comedor|sal[óo]n|sala)\b/i, /\bbarra\s+completa\b/i, /\bbar\s+completo\b/i,
      /\b(?:almuerzo|comida)\s+y\s+cena\b/i,
      /\bplatos?\s+de\s+la\s+casa\b/i, /\bespecialidad(?:es)?\s+de\s+la\s+casa\b/i,
      /\b(?:apto|ideal|perfecto)\s+para\s+(?:familias|ni[ñn]os)\b/i,
      /\bfamily[-\s]friendly\b/i,
      /\b(?:lugar|restaurante|favorito)\s+(?:de|del)\s+barrio\b/i,
      /\bbistr[óo]\b/i,
      /\bservicio\s+completo\b/i
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
    label: 'Fast-casual o servicio rápido',
    schemaTypes: ['FastFoodRestaurant'],
    platformHints: {
      toast: 3, chownow: 4, square: 1, bentobox: 2, slice: 4,
      menufy: 3, olo: 2, lunchbox: 2, checkmate: 2, popmenu: 1,
      doordash: 1, grubhub: 1, 'uber eats': 1
    },
    keywords: [
      /\bpedir\s+(?:en\s+l[íi]nea|online)\b/i, /\bpedidos?\s+(?:en\s+l[íi]nea|online)\b/i,
      /\bpedir\s+para\s+(?:recoger|llevar|entrega|domicilio)\b/i,
      /\bpara\s+llevar\b/i, /\bcomida\s+para\s+llevar\b/i,
      /\border\s+online\b/i, /\border\s+for\s+(?:pickup|delivery|takeout|take[-\s]out)\b/i,
      /\bfast[-\s]casual\b/i,
      /\bservicio\s+de\s+mostrador\b/i, /\bcounter\s+service\b/i,
      /\bdrive[-\s]?thru\b/i,
      /\brecoger\s+en\s+(?:el\s+)?auto\b/i, /\bcurbside\b/i,
      /\bgrab\s+(?:and|&)\s+go\b/i,
      /\bautoservicio\b/i
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
    label: 'Café o cafetería',
    schemaTypes: ['CafeOrCoffeeShop'],
    platformHints: { square: 3, toast: 1, chownow: 1 },
    keywords: [
      /\b(?:espresso|expreso|capuchino|cappuccino|latte|cortado|pour[-\s]over|americano|macchiato)\b/i,
      /\bcafeter[íi]a\b/i, /\bcaf[ée]\b/i, /\bcoffee\s+(?:shop|bar|house)\b/i,
      /\bcaf[ée]\s+(?:artesanal|de\s+especialidad)\b/i, /\bartisan\s+coffee\b/i,
      /\btostadur[íi]a\b/i, /\btostadora\s+de\s+caf[ée]\b/i, /\broastery?\b/i,
      /\b(?:origen\s+[úu]nico|de\s+origen)\b/i, /\bsingle[-\s]origin\b/i,
      /\bcold\s+brew\b/i, /\bcaf[ée]\s+en\s+fr[íi]o\b/i,
      /\bgrano\s+(?:[úu]nico|selecto)\b/i
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
    label: 'Panadería o pastelería',
    schemaTypes: ['Bakery', 'IceCreamShop'],
    platformHints: { square: 3, toast: 1 },
    keywords: [
      /\b(?:pasteles?|panecillos?|croissants?|muffins?|scones?|[ée]clairs?|macarons?|empanadas?)\b/i,
      /\bpanader[íi]a\b/i, /\bpasteler[íi]a\b/i, /\brepostería\b/i,
      /\bp[âa]tisserie\b/i,
      /\bpan\s+artesanal\b/i, /\bpanes?\s+artesanales?\b/i, /\bartisan\s+bread\b/i,
      /\bmasa\s+madre\b/i, /\bsourdough\b/i,
      /\b(?:pastel|torta|queque)\s+(?:personalizado|a\s+medida|por\s+encargo)\b/i,
      /\bcustom\s+(?:cake|cakes|order)\b/i,
      /\b(?:pastel|torta|queque)\s+de\s+bodas?\b/i, /\bwedding\s+cakes?\b/i,
      /\bpedido\s+de\s+(?:pastel|torta|queque)\b/i,
      /\bbakery\b/i
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
    label: 'Bar, pub o cervecería',
    schemaTypes: ['BarOrPub', 'Brewery', 'Winery', 'Distillery'],
    platformHints: { tripleseat: 3, opentable: 1, resy: 1, sevenrooms: 1 },
    keywords: [
      /\bcocteles?\b/i, /\bcocktails?\b/i,
      /\bcerveza\s+artesanal\b/i, /\bcraft\s+beer\b/i,
      /\bde\s+barril\b/i, /\bcerveza\s+de\s+barril\b/i, /\bon\s+tap\b/i,
      /\bhappy\s+hour\b/i, /\bhora\s+feliz\b/i,
      /\b(?:gastro)?pub\b/i, /\btaproom\b/i, /\bsala\s+de\s+cata\b/i,
      /\b(?:bar|carta)\s+de\s+whisk(?:y|ey)\b/i,
      /\bbar\s+de\s+vinos?\b/i, /\bvinoteca\b/i,
      /\bspeakeasy\b/i,
      /\bcervecer[íi]a\b/i, /\bbrewery\b/i,
      /\bcoctelera\b/i, /\bcoctelería\b/i
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
    label: 'Pizzería',
    schemaTypes: ['Restaurant', 'FastFoodRestaurant'],
    platformHints: { slice: 5, toast: 2, chownow: 2, doordash: 2, grubhub: 2, square: 1 },
    keywords: [
      /\bpizzas?\b/i, /\bpizzer[íi]a\b/i,
      /\brebanadas?\b/i, /\bporciones?\s+de\s+pizza\b/i, /\bslice(?:s)?\b/i,
      /\bnapolitana\b/i, /\bneapolitan\b/i,
      /\b(?:al\s+)?horno\s+de\s+le[ñn]a\b/i, /\bwood[-\s]fired\b/i,
      /\b(?:al\s+)?horno\s+de\s+carb[óo]n\b/i, /\bcoal[-\s]fired\b/i,
      /\bsiciliana\b/i, /\bsicilian\b/i,
      /\bestilo\s+detroit\b/i, /\bdetroit[-\s]style\b/i,
      /\bpepperoni\b/i, /\bpeperoni\b/i,
      /\bcalzone\b/i
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
    label: 'Food truck o pop-up',
    schemaTypes: ['Restaurant', 'FastFoodRestaurant'],
    platformHints: { square: 2, toast: 1 },
    keywords: [
      /\bfood\s+truck\b/i, /\bcami[óo]n\s+de\s+comida\b/i,
      /\bhorario\s+(?:del\s+cami[óo]n|del\s+truck)\b/i, /\btruck\s+schedule\b/i,
      /\b[¿?]d[óo]nde\s+estamos\s+hoy\??\b/i, /\bwhere\s+(?:we|are\s+we)\b/i,
      /\bubicaci[óo]n\s+de\s+hoy\b/i, /\btoday['’]s\s+location\b/i,
      /\bpop[-\s]?up\b/i,
      /\bs[íi]guenos\b/i, /\bcatch\s+us\b/i, /\bfollow\s+(?:our|us\s+on)\b/i,
      /\bcocina\s+m[óo]vil\b/i, /\bmobile\s+(?:kitchen|restaurant)\b/i,
      /\bpuesto\s+m[óo]vil\b/i
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
    label: 'Cocina fantasma / solo entrega',
    schemaTypes: ['Restaurant', 'FastFoodRestaurant'],
    platformHints: {
      doordash: 4, 'uber eats': 4, grubhub: 4, postmates: 2,
      seamless: 2, caviar: 2, deliveroo: 3, 'just eat': 3,
      deliverect: 3, otter: 3
    },
    keywords: [
      /\bcocina\s+fantasma\b/i, /\bghost\s+kitchen\b/i,
      /\bcocina\s+virtual\b/i, /\bmarca\s+virtual\b/i, /\brestaurante\s+virtual\b/i,
      /\bvirtual\s+(?:kitchen|restaurant|brand)\b/i,
      /\bsolo\s+(?:entrega|delivery)\b/i, /\bdelivery[-\s]only\b/i,
      /\bcloud\s+kitchen\b/i,
      /\bsin\s+(?:mesa|servicio\s+en\s+mesa|consumo\s+en\s+sitio)\b/i, /\bno\s+dine[-\s]in\b/i,
      /\b(?:entrega\s+y\s+recogida|delivery\s+(?:y|&)\s+pickup)\s+[úu]nicamente\b/i
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
    label: 'Solo catering / eventos privados',
    schemaTypes: ['FoodEstablishment', 'Restaurant'],
    platformHints: { ezcater: 5, catertrax: 5, tripleseat: 3, square: 1 },
    keywords: [
      /\b(?:men[úu]|servicios?|paquetes?)\s+de\s+catering\b/i,
      /\bcatering\s+(?:menu|services?|packages?)\b/i,
      /\b(?:eventos?|comedor|fiestas?|celebraciones?)\s+privados?\b/i, /\bprivate\s+(?:events?|dining|parties)\b/i,
      /\bcatering\s+(?:corporativo|empresarial)\b/i, /\bcorporate\s+catering\b/i,
      /\bcatering\s+de\s+bodas?\b/i, /\bwedding\s+catering\b/i,
      /\bcatering\s+(?:tipo\s+)?buffet\b/i, /\bbuffet\s+catering\b/i,
      /\bcatering\s+(?:drop[-\s]off|de\s+entrega)\b/i,
      /\bfuera\s+del\s+local\b/i, /\boff[-\s]premise\b/i,
      /\bsolicitar?\s+cotizaci[óo]n\b/i, /\brequest\s+a\s+quote\b/i,
      /\bplanificaci[óo]n\s+de\s+eventos?\b/i, /\borganizaci[óo]n\s+de\s+eventos?\b/i, /\bevent\s+planning\b/i,
      /\bservicio\s+de\s+catering\b/i, /\bchef\s+privado\b/i
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
