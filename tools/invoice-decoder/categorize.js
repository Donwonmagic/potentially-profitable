/**
 * Invoice Decoder — categorize.js (Wave B4).
 *
 * Three-tier line-item classifier. Tiers ship in separate atomic
 * commits so the diff stays inspectable:
 *
 *   1. Lexicon data (9 bilingual categories)
 *   2. Tier-1 exact-substring match
 *   3. Tier-2 Levenshtein-distance fuzzy match
 *   4. Tier-3 unit + price-band heuristic
 *   5. Top-level classify() that runs all three in order
 *
 * Output shape: { category, confidence, tier } where category is
 * one of the 9 buckets (or null when nothing fires), confidence
 * is 0..100, and tier names which path won.
 */
(function (root) {
  'use strict';

  // Bilingual ingredient + paper / cleaning / beverage lexicon.
  // 9 restaurant-real categories. Each entry is { en: [...], es:
  // [...] }. Seeded from plate-cost YIELD_TABLE (~80 items already
  // EN+ES paired) plus distributor-SKU stems for paper / cleaning
  // / beverage. NEVER add brand-name SKUs — keep it generic so it
  // works across distributors. Future polish can sync this to a
  // /data/invoice-lexicon.json mirror; for now this is the
  // canonical source of truth (mirrors the plate-cost YIELD_TABLE
  // pattern: data lives next to its consumer).
  var LEXICON = {
    protein: [
      { en: ['chicken', 'chicken breast', 'chicken thigh', 'chicken wing', 'chicken leg', 'whole chicken'], es: ['pollo', 'pechuga de pollo', 'muslo de pollo', 'ala de pollo', 'pierna de pollo', 'pollo entero'] },
      { en: ['beef', 'ground beef', 'ground chuck', 'chuck', 'brisket', 'ribeye', 'tenderloin', 'filet mignon', 'strip loin', 'ny strip', 'sirloin', 'flank steak', 'skirt steak', 'hanger steak', 'short rib'], es: ['res', 'carne molida', 'molida', 'pecho', 'ribeye', 'lomo', 'filete', 'punta de res', 'falda', 'arrachera', 'costilla'] },
      { en: ['pork', 'pork loin', 'pork shoulder', 'pork belly', 'bacon', 'ham', 'sausage', 'chorizo', 'pancetta', 'prosciutto', 'guanciale'], es: ['puerco', 'cerdo', 'lomo de cerdo', 'espaldilla', 'panceta', 'tocino', 'jamón', 'salchicha', 'chorizo'] },
      { en: ['lamb', 'lamb shoulder', 'lamb shank', 'rack of lamb', 'ground lamb'], es: ['cordero', 'espaldilla de cordero', 'rack de cordero'] },
      { en: ['turkey', 'ground turkey', 'turkey breast'], es: ['pavo', 'pavo molido', 'pechuga de pavo'] },
      { en: ['duck', 'duck breast', 'duck leg', 'duck confit'], es: ['pato', 'pechuga de pato', 'muslo de pato', 'confit de pato'] },
      { en: ['veal'], es: ['ternera'] },
      { en: ['egg', 'eggs', 'whole egg', 'egg yolk', 'egg white', 'liquid egg'], es: ['huevo', 'huevos', 'yema', 'clara'] }
    ],
    seafood: [
      { en: ['salmon', 'salmon fillet', 'wild salmon', 'atlantic salmon'], es: ['salmón', 'filete de salmón'] },
      { en: ['shrimp', 'prawn', 'u-15 shrimp', 'u-21 shrimp', 'p&d shrimp'], es: ['camarón', 'camarones', 'langostino'] },
      { en: ['tuna', 'ahi tuna', 'tuna loin'], es: ['atún', 'lomo de atún'] },
      { en: ['cod', 'halibut', 'snapper', 'sea bass', 'branzino', 'tilapia', 'trout', 'mahi', 'swordfish', 'grouper', 'sole', 'flounder'], es: ['bacalao', 'halibut', 'huachinango', 'robalo', 'branzino', 'tilapia', 'trucha', 'mahi', 'pez espada', 'lenguado'] },
      { en: ['scallop', 'sea scallop', 'u-10 scallop', 'diver scallop'], es: ['callo', 'callo de hacha', 'vieira'] },
      { en: ['mussel', 'clam', 'oyster'], es: ['mejillón', 'almeja', 'ostra', 'ostión'] },
      { en: ['crab', 'lump crab', 'blue crab', 'lobster', 'lobster tail', 'crawfish'], es: ['cangrejo', 'jaiba', 'langosta', 'cola de langosta'] },
      { en: ['squid', 'calamari', 'octopus'], es: ['calamar', 'pulpo'] }
    ],
    produce: [
      { en: ['romaine', 'lettuce', 'iceberg', 'spinach', 'arugula', 'kale', 'spring mix', 'mesclun', 'little gem'], es: ['lechuga', 'espinaca', 'rúcula', 'kale', 'mezclum'] },
      { en: ['tomato', 'tomatoes', 'cherry tomato', 'roma tomato', 'heirloom tomato'], es: ['jitomate', 'tomate', 'cherry'] },
      { en: ['onion', 'onions', 'yellow onion', 'red onion', 'white onion', 'shallot', 'scallion', 'green onion', 'leek'], es: ['cebolla', 'cebolla morada', 'cebolla blanca', 'echalote', 'cebollín', 'poro'] },
      { en: ['garlic', 'garlic clove', 'minced garlic'], es: ['ajo', 'ajo molido', 'diente de ajo'] },
      { en: ['potato', 'potatoes', 'russet', 'yukon', 'fingerling', 'sweet potato', 'yam'], es: ['papa', 'papas', 'papa rojiza', 'papa cambray', 'camote', 'batata'] },
      { en: ['carrot', 'celery', 'cucumber', 'zucchini', 'squash', 'yellow squash', 'butternut squash', 'eggplant', 'bell pepper', 'jalapeño', 'jalapeno', 'serrano', 'poblano', 'habanero', 'broccoli', 'cauliflower', 'asparagus', 'green bean', 'snap pea', 'snow pea', 'okra', 'fennel', 'radish', 'beet', 'turnip', 'parsnip'], es: ['zanahoria', 'apio', 'pepino', 'calabacita', 'calabaza', 'berenjena', 'pimiento', 'chile poblano', 'chile serrano', 'habanero', 'brócoli', 'coliflor', 'espárrago', 'ejote', 'chícharo', 'okra', 'hinojo', 'rábano', 'betabel', 'nabo'] },
      { en: ['mushroom', 'cremini', 'shiitake', 'portobello', 'oyster mushroom', 'button mushroom'], es: ['champiñón', 'hongo', 'shiitake', 'portobello'] },
      { en: ['avocado', 'lime', 'lemon', 'orange', 'grapefruit'], es: ['aguacate', 'limón', 'naranja', 'toronja'] },
      { en: ['apple', 'pear', 'berry', 'berries', 'strawberry', 'blueberry', 'raspberry', 'blackberry', 'grape', 'melon', 'watermelon', 'pineapple'], es: ['manzana', 'pera', 'fresa', 'frambuesa', 'zarzamora', 'uva', 'melón', 'sandía', 'piña'] },
      { en: ['corn', 'corn cob', 'sweet corn'], es: ['elote', 'maíz', 'elote dulce'] },
      { en: ['chickpea', 'chick pea', 'garbanzo'], es: ['garbanzo'] }
    ],
    dairy: [
      { en: ['milk', 'whole milk', '2% milk', 'skim milk', 'buttermilk', 'cream', 'heavy cream', 'half and half', 'sour cream', 'creme fraiche'], es: ['leche', 'leche entera', 'buttermilk', 'crema', 'crema espesa', 'media crema', 'crema agria'] },
      { en: ['butter', 'unsalted butter', 'salted butter', 'european butter', 'ghee'], es: ['mantequilla', 'mantequilla sin sal'] },
      { en: ['cheese', 'mozzarella', 'cheddar', 'parmesan', 'parmigiano', 'pecorino', 'feta', 'goat cheese', 'blue cheese', 'gorgonzola', 'brie', 'swiss', 'provolone', 'queso fresco', 'cotija', 'ricotta', 'mascarpone', 'cream cheese', 'burrata', 'manchego'], es: ['queso', 'queso fresco', 'queso oaxaca', 'cotija', 'panela', 'manchego', 'queso crema'] },
      { en: ['yogurt', 'greek yogurt'], es: ['yogur', 'yogur griego'] }
    ],
    'dry-goods': [
      { en: ['flour', 'all purpose flour', 'ap flour', 'bread flour', '00 flour', 'cake flour', 'semolina'], es: ['harina', 'harina de trigo', 'sémola'] },
      { en: ['sugar', 'granulated sugar', 'brown sugar', 'powdered sugar', 'confectioners sugar'], es: ['azúcar', 'azúcar morena', 'azúcar glass'] },
      { en: ['rice', 'long grain rice', 'basmati', 'jasmine rice', 'arborio rice', 'brown rice', 'wild rice'], es: ['arroz', 'arroz blanco', 'arroz integral'] },
      { en: ['pasta', 'penne', 'rigatoni', 'spaghetti', 'linguine', 'fettuccine', 'tagliatelle', 'tonnarelli', 'orecchiette', 'lasagna', 'lasagne'], es: ['pasta', 'penne', 'espagueti', 'tagliatelle', 'lasaña'] },
      { en: ['bean', 'beans', 'black bean', 'pinto bean', 'kidney bean', 'lentil', 'lentils', 'split pea'], es: ['frijol', 'frijoles', 'frijol negro', 'frijol pinto', 'lenteja', 'lentejas'] },
      { en: ['bread', 'bread crumb', 'panko', 'bun', 'buns', 'tortilla', 'tortillas', 'corn tortilla', 'flour tortilla', 'pita'], es: ['pan', 'pan rallado', 'panko', 'bolillo', 'telera', 'tortilla', 'tortillas', 'tortilla de maíz', 'tortilla de harina'] },
      { en: ['oil', 'olive oil', 'extra virgin olive oil', 'evoo', 'canola oil', 'vegetable oil', 'grapeseed oil', 'sesame oil', 'coconut oil'], es: ['aceite', 'aceite de oliva', 'aceite vegetal', 'aceite de coco'] },
      { en: ['vinegar', 'balsamic', 'red wine vinegar', 'rice vinegar', 'sherry vinegar', 'apple cider vinegar'], es: ['vinagre', 'vinagre balsámico', 'vinagre de manzana'] },
      { en: ['soy sauce', 'tamari', 'fish sauce', 'worcestershire', 'hot sauce', 'sriracha', 'tabasco', 'ketchup', 'mustard', 'mayo', 'mayonnaise', 'aioli'], es: ['salsa de soya', 'salsa picante', 'cátsup', 'mostaza', 'mayonesa'] },
      { en: ['honey', 'maple syrup', 'molasses', 'agave'], es: ['miel', 'jarabe de maple', 'melaza', 'agave'] },
      { en: ['nut', 'nuts', 'almond', 'almonds', 'walnut', 'walnuts', 'pecan', 'pecans', 'pistachio', 'pistachios', 'cashew', 'cashews', 'peanut', 'peanuts', 'hazelnut', 'hazelnuts', 'pine nut', 'pine nuts'], es: ['nuez', 'almendra', 'nueces', 'pistache', 'cacahuate', 'avellana', 'piñón'] },
      { en: ['chocolate', 'cocoa', 'cocoa powder', 'vanilla', 'vanilla extract'], es: ['chocolate', 'cocoa', 'cacao', 'vainilla'] },
      { en: ['broth', 'stock', 'chicken stock', 'beef stock', 'vegetable stock', 'demi glace'], es: ['caldo', 'caldo de pollo', 'caldo de res', 'caldo de verduras'] }
    ],
    'herbs-spices': [
      { en: ['salt', 'kosher salt', 'sea salt', 'table salt', 'flaky salt', 'maldon'], es: ['sal', 'sal de mar', 'sal kosher'] },
      { en: ['pepper', 'black pepper', 'white pepper', 'peppercorn'], es: ['pimienta', 'pimienta negra', 'pimienta blanca'] },
      { en: ['basil', 'parsley', 'cilantro', 'dill', 'thyme', 'rosemary', 'oregano', 'sage', 'tarragon', 'chive', 'chives', 'mint', 'bay leaf', 'marjoram'], es: ['albahaca', 'perejil', 'cilantro', 'eneldo', 'tomillo', 'romero', 'orégano', 'salvia', 'estragón', 'cebollín', 'menta', 'hierbabuena', 'laurel'] },
      { en: ['paprika', 'smoked paprika', 'cumin', 'coriander', 'turmeric', 'cinnamon', 'nutmeg', 'clove', 'cloves', 'cardamom', 'ginger', 'fennel seed', 'mustard seed', 'sumac', 'saffron', 'star anise'], es: ['paprika', 'paprika ahumada', 'comino', 'cilantro molido', 'cúrcuma', 'canela', 'nuez moscada', 'clavo', 'cardamomo', 'jengibre', 'hinojo en semilla'] },
      { en: ['chili powder', 'ancho', 'guajillo', 'chipotle', 'pasilla', 'cayenne', 'red pepper flake', 'crushed red pepper'], es: ['chile en polvo', 'chile ancho', 'chile guajillo', 'chile chipotle', 'chile pasilla', 'cayena'] }
    ],
    paper: [
      { en: ['napkin', 'napkins', 'paper napkin', 'dinner napkin', 'cocktail napkin', 'linen napkin'], es: ['servilleta', 'servilletas', 'servilleta de papel'] },
      { en: ['towel', 'paper towel', 'paper towels', 'roll towel', 'c-fold towel', 'multifold towel'], es: ['toalla de papel', 'toalla', 'toallas'] },
      { en: ['cup', 'cups', 'paper cup', 'hot cup', 'cold cup', '12 oz cup', '16 oz cup', '20 oz cup', 'to-go cup', 'togo cup'], es: ['vaso', 'vasos', 'vaso desechable', 'vaso de papel'] },
      { en: ['lid', 'lids', 'cup lid', 'dome lid', 'flat lid', 'sip lid'], es: ['tapa', 'tapas', 'tapa de vaso'] },
      { en: ['straw', 'straws', 'paper straw'], es: ['popote', 'popotes', 'pajilla'] },
      { en: ['plate', 'paper plate', '9 inch plate', 'to-go plate'], es: ['plato', 'platos desechables', 'plato de papel'] },
      { en: ['bag', 'bags', 'paper bag', 'to-go bag', 'togo bag', 'trash bag', 'ziplock', 'zip bag'], es: ['bolsa', 'bolsas', 'bolsa de papel', 'bolsa de basura', 'ziplock'] },
      { en: ['foil', 'aluminum foil', 'deli wrap', 'wax paper', 'parchment paper', 'cling film', 'plastic wrap'], es: ['papel aluminio', 'papel encerado', 'papel pergamino', 'plástico adherente'] },
      { en: ['container', 'to-go container', 'togo container', 'deli container', 'souffle cup', 'portion cup', 'ramekin'], es: ['envase', 'envase desechable', 'porcionero'] },
      { en: ['receipt paper', 'register paper', 'thermal paper', 'guest check'], es: ['papel térmico', 'papel de caja', 'comanda'] }
    ],
    cleaning: [
      { en: ['bleach', 'chlorine', 'sanitizer', 'sani-tab', 'quat sanitizer', 'quat', 'iodine sanitizer', 'no rinse sanitizer'], es: ['cloro', 'blanqueador', 'sanitizante', 'sanitizante quaternario'] },
      { en: ['dish soap', 'dishwasher detergent', 'rinse aid', 'pot and pan', 'machine detergent'], es: ['jabón para trastes', 'detergente lavavajillas', 'abrillantador'] },
      { en: ['degreaser', 'oven cleaner', 'fryer cleaner', 'boil out', 'grill brick'], es: ['desengrasante', 'limpiador de horno', 'limpiador de freidora'] },
      { en: ['floor cleaner', 'all purpose cleaner', 'all-purpose cleaner', 'general purpose cleaner', 'glass cleaner', 'windex', 'stainless steel cleaner'], es: ['limpiador para piso', 'limpiador multiusos', 'limpiavidrios', 'limpiador de acero inoxidable'] },
      { en: ['soap', 'hand soap', 'antibacterial soap', 'foaming soap'], es: ['jabón', 'jabón de manos', 'jabón antibacterial'] },
      { en: ['mop', 'mop head', 'broom', 'dust pan', 'scrub pad', 'scrubber', 'scour pad', 'scotch brite', 'scotchbrite', 'steel wool'], es: ['trapeador', 'escoba', 'fibra', 'fibra verde', 'estropajo'] },
      { en: ['glove', 'gloves', 'nitrile glove', 'vinyl glove', 'latex glove'], es: ['guante', 'guantes', 'guantes de nitrilo', 'guantes de vinilo'] }
    ],
    beverage: [
      { en: ['coffee', 'espresso', 'decaf', 'ground coffee', 'whole bean', 'coffee bean'], es: ['café', 'café molido', 'café en grano', 'espresso'] },
      { en: ['tea', 'black tea', 'green tea', 'herbal tea', 'tea bag'], es: ['té', 'té negro', 'té verde', 'té de hierbas'] },
      { en: ['water', 'sparkling water', 'club soda', 'tonic water', 'still water', 'bottled water'], es: ['agua', 'agua mineral', 'agua tónica', 'agua embotellada'] },
      { en: ['soda', 'cola', 'lemon-lime', 'ginger ale', 'root beer', 'diet'], es: ['refresco', 'soda', 'cola', 'ginger ale'] },
      { en: ['juice', 'orange juice', 'apple juice', 'cranberry juice', 'tomato juice', 'lemonade'], es: ['jugo', 'jugo de naranja', 'jugo de manzana', 'limonada'] },
      { en: ['beer', 'draft beer', 'keg', 'case of beer', 'ipa', 'lager', 'pilsner'], es: ['cerveza', 'barril', 'caja de cerveza', 'ipa', 'lager'] },
      { en: ['wine', 'red wine', 'white wine', 'rosé', 'rose wine', 'sparkling wine', 'champagne', 'prosecco', 'bottle of wine', 'case of wine'], es: ['vino', 'vino tinto', 'vino blanco', 'rosado', 'vino espumoso', 'champaña'] },
      { en: ['spirit', 'vodka', 'gin', 'rum', 'tequila', 'whiskey', 'whisky', 'bourbon', 'scotch', 'mezcal', 'brandy', 'cognac'], es: ['vodka', 'ginebra', 'ron', 'tequila', 'whiskey', 'bourbon', 'mezcal', 'brandy'] },
      { en: ['syrup', 'simple syrup', 'grenadine', 'orgeat', 'flavor syrup'], es: ['jarabe', 'jarabe natural', 'granadina'] },
      // W7-6 — energy drinks + brand SKUs commonly on independent-restaurant invoices
      { en: ['rockstar', 'monster', 'monster energy', 'red bull', 'redbull', 'ghost energy', 'celsius', 'bang', 'reign'], es: ['rockstar', 'monster', 'red bull', 'celsius'] },
      // Bottled / canned water brands
      { en: ['smartwater', 'smart water', 'dasani', 'aquafina', 'fiji', 'evian', 'voss', 'la croix', 'lacroix', 'perrier', 'san pellegrino', 'pellegrino', 'topo chico', 'topochico'], es: ['smartwater', 'dasani', 'aquafina', 'fiji', 'evian', 'la croix', 'perrier', 'san pellegrino', 'topo chico', 'agua jarritos'] },
      // Sports + functional drinks
      { en: ['gatorade', 'powerade', 'snapple', 'arizona', 'arizona tea', 'kombucha', 'gt kombucha', 'pure leaf'], es: ['gatorade', 'powerade', 'snapple', 'kombucha'] },
      // Beer brands
      { en: ['stella artois', 'stella', 'bud light', 'budweiser', 'miller lite', 'coors light', 'modelo', 'modelo especial', 'corona', 'corona extra', 'heineken', 'guinness', 'pacifico', 'tecate', 'dos equis', 'xx amber'], es: ['stella artois', 'bud light', 'budweiser', 'miller lite', 'coors light', 'modelo', 'modelo especial', 'corona', 'corona extra', 'heineken', 'pacifico', 'tecate', 'dos equis'] },
      // Beer styles + hard seltzer
      { en: ['hard seltzer', 'white claw', 'truly', 'high noon'], es: ['hard seltzer', 'white claw', 'truly'] },
      // Mexican-cantina-typical sodas
      { en: ['jarritos', 'jarritos tamarindo', 'jarritos lima', 'jarritos mandarina', 'sidral', 'fanta', 'sprite', 'mountain dew', 'dr pepper', 'dr. pepper'], es: ['jarritos', 'sidral', 'fanta', 'sprite', 'mountain dew', 'dr pepper'] }
    ]
  };

  // W7-6 — extend paper goods with the take-out / delivery SKUs
  // that hit modern restaurant invoices weekly.
  LEXICON.paper.push(
    { en: ['clamshell', 'oyster pail', 'pizza box', 'deli sheet', 'fold-top take-out', 'food tray', 'doily'], es: ['concha', 'caja para pizza', 'charola', 'papel para deli'] },
    { en: ['portion lid', 'pan liner', 'sheet pan liner', 'butcher paper', 'kraft bag', 't-shirt bag', 'sandwich wrap'], es: ['tapa porcionera', 'forro de charola', 'papel carnicero', 'bolsa kraft', 'envoltura para sándwich'] },
    { en: ['bib', 'lobster bib', 'apron', 'disposable apron'], es: ['babero', 'mandil', 'mandil desechable'] }
  );

  // W7-6 — extend cleaning with the chemicals beyond bleach + soap
  // that show on Restaurant Depot / Sysco janitorial invoices.
  LEXICON.cleaning.push(
    { en: ['peroxide', 'hydrogen peroxide', 'oxiclean', 'ammonia', 'hood degreaser', 'drain cleaner', 'lime remover', 'scale remover'], es: ['peróxido', 'oxiclean', 'amoniaco', 'desengrasante de campana', 'destapacaños'] },
    { en: ['urinal block', 'urinal cake', 'carpet shampoo', 'enzyme cleaner', 'grill cleaner', 'salamander cleaner'], es: ['pastilla para urinal', 'shampoo para alfombra', 'limpiador enzimático'] },
    { en: ['ajax', 'fabuloso', 'pinesol', 'pine sol', 'mr clean', 'mr. clean', 'comet', 'lysol'], es: ['ajax', 'fabuloso', 'pinesol', 'comet', 'lysol'] }
  );

  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
      .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Tier 1 — exact substring match. Walks every term in every
  // category; the longest matching term wins. Returns { category,
  // confidence, tier, matched } or null when no term fires.
  // Confidence factors in match-length / line-length so "chicken"
  // matching all of "chicken" reads stronger than "chicken"
  // matching one word of "chicken stock seasoning powder".
  function tier1Exact(rowName) {
    var name = normalize(rowName);
    if (!name) return null;
    var best = null;
    for (var cat in LEXICON) {
      var entries = LEXICON[cat];
      for (var i = 0; i < entries.length; i++) {
        var terms = (entries[i].en || []).concat(entries[i].es || []);
        for (var t = 0; t < terms.length; t++) {
          var term = normalize(terms[t]);
          if (!term || term.length < 3) continue;
          if (name.indexOf(term) === -1) continue;
          if (!best || term.length > best.term.length) {
            best = { category: cat, term: term };
          }
        }
      }
    }
    if (!best) return null;
    var ratio = best.term.length / Math.max(name.length, 1);
    var confidence = Math.round(70 + Math.min(25, ratio * 30));
    return { category: best.category, confidence: confidence, tier: 'exact', matched: best.term };
  }

  // Levenshtein distance with early-exit when distance > maxDist.
  // Only computed when the lengths are within a small ratio of
  // each other; saves wasted work on obviously-different tokens.
  function levenshtein(a, b, maxDist) {
    if (a === b) return 0;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > maxDist) return maxDist + 1;
    var prev = new Array(lb + 1);
    var curr = new Array(lb + 1);
    for (var j = 0; j <= lb; j++) prev[j] = j;
    for (var i = 1; i <= la; i++) {
      curr[0] = i;
      var rowMin = i;
      for (var j2 = 1; j2 <= lb; j2++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(j2 - 1) ? 0 : 1;
        var v = Math.min(prev[j2] + 1, curr[j2 - 1] + 1, prev[j2 - 1] + cost);
        curr[j2] = v;
        if (v < rowMin) rowMin = v;
      }
      if (rowMin > maxDist) return maxDist + 1; // early exit
      var tmp = prev; prev = curr; curr = tmp;
    }
    return prev[lb];
  }

  // Tier 2 — fuzzy match on individual tokens. For each token in
  // the line, find the closest lexicon term (Hamming-style with
  // Levenshtein distance ≤2). Best match per category aggregates
  // a per-category score; the highest-scoring category wins.
  // Confidence drops to amber band (60-79) by design — fuzzy
  // matches need owner confirmation more often than exact ones.
  function tier2Fuzzy(rowName) {
    var name = normalize(rowName);
    if (!name) return null;
    var tokens = name.split(/\s+/).filter(function (t) { return t.length >= 4; });
    if (!tokens.length) return null;
    var perCat = {};
    var bestPerCat = {};
    tokens.forEach(function (tok) {
      for (var cat in LEXICON) {
        var entries = LEXICON[cat];
        for (var i = 0; i < entries.length; i++) {
          var terms = (entries[i].en || []).concat(entries[i].es || []);
          for (var t = 0; t < terms.length; t++) {
            var term = normalize(terms[t]);
            if (!term || term.length < 4) continue;
            // Only test against single-word terms (multi-word
            // matches are tier 1's job).
            if (term.indexOf(' ') !== -1) continue;
            var maxDist = term.length >= 8 ? 2 : 1;
            var d = levenshtein(tok, term, maxDist);
            if (d <= maxDist) {
              perCat[cat] = (perCat[cat] || 0) + (term.length - d);
              if (!bestPerCat[cat] || (term.length - d) > bestPerCat[cat].score) {
                bestPerCat[cat] = { term: term, score: term.length - d, dist: d };
              }
            }
          }
        }
      }
    });
    var winner = null;
    for (var cat2 in perCat) {
      if (!winner || perCat[cat2] > perCat[winner]) winner = cat2;
    }
    if (!winner) return null;
    var match = bestPerCat[winner];
    // Amber confidence band — fuzzy matches need verification.
    var confidence = Math.round(60 + Math.min(15, (match.term.length - match.dist) * 1.5));
    return { category: winner, confidence: confidence, tier: 'fuzzy', matched: match.term, dist: match.dist };
  }

  // Tier 3 — unit + price-band heuristic for lines neither tier 1
  // nor tier 2 caught. Restaurant invoices have tight unit-price
  // distributions per category; e.g. /lb at $4-25 is almost always
  // protein, /gal at $3-8 with a beverage keyword is beverage.
  // These rules are conservative: they only fire when both unit
  // and price-band agree, and confidence stays in the lower amber
  // band so the verification UX still asks the owner to confirm.
  // Unit-less lines or lines with no price get null.
  function tier3Heuristic(row) {
    if (!row) return null;
    var unit = String(row.unit || '').toLowerCase();
    var unitPrice = (typeof row.unitPrice === 'number') ? row.unitPrice : null;
    if (unitPrice == null && row.lineTotal != null && row.qty) {
      unitPrice = row.lineTotal / row.qty;
    }
    if (unit === 'lb' || unit === 'kg') {
      if (unitPrice == null) return null;
      if (unitPrice >= 4 && unitPrice <= 25) return { category: 'protein', confidence: 60, tier: 'heuristic', matched: 'lb $4-25 band' };
      if (unitPrice >= 8 && unitPrice <= 40) return { category: 'seafood', confidence: 55, tier: 'heuristic', matched: 'lb $8-40 band' };
      if (unitPrice <  4)                    return { category: 'produce', confidence: 55, tier: 'heuristic', matched: 'lb sub-$4 band' };
    }
    if (unit === 'gal' || unit === 'jug') {
      if (unitPrice == null) return null;
      if (unitPrice >= 3 && unitPrice <= 12) return { category: 'beverage', confidence: 55, tier: 'heuristic', matched: 'gal $3-12 band' };
      if (unitPrice >= 5 && unitPrice <= 30) return { category: 'cleaning', confidence: 50, tier: 'heuristic', matched: 'gal $5-30 band' };
    }
    if (unit === 'case' || unit === 'cs' || unit === 'bx' || unit === 'box' || unit === 'sleeve') {
      if (unitPrice == null) return null;
      // Case-priced items are almost always paper / dry-goods on
      // restaurant invoices when no name match fired. Bias gently
      // toward dry-goods since paper has stronger lexicon coverage.
      if (unitPrice >= 8 && unitPrice <= 80) return { category: 'dry-goods', confidence: 50, tier: 'heuristic', matched: 'case $8-80 band' };
    }
    if (unit === 'ea' || unit === 'each' || unit === 'ct' || unit === 'count') {
      if (unitPrice == null) return null;
      if (unitPrice >= 0.10 && unitPrice <= 1.50) return { category: 'produce', confidence: 50, tier: 'heuristic', matched: 'each $0.10-1.50 band' };
    }
    return null;
  }

  function classify(row) {
    if (!row || typeof row !== 'object') return { category: null, confidence: 0, tier: 'none' };
    var t1 = tier1Exact(row.name);
    if (t1) return t1;
    var t2 = tier2Fuzzy(row.name);
    if (t2) return t2;
    var t3 = tier3Heuristic(row);
    if (t3) return t3;
    return { category: null, confidence: 0, tier: 'none' };
  }

  var api = {
    classify: classify,
    LEXICON: LEXICON
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_CATEGORIZE = api;
})(typeof window !== 'undefined' ? window : null);
