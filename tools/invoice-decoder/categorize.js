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
    { en: ['ajax', 'fabuloso', 'pinesol', 'pine sol', 'mr clean', 'mr. clean', 'comet', 'lysol'], es: ['ajax', 'fabuloso', 'pinesol', 'comet', 'lysol'] },
    // Wave 4.4 — restaurant-grade specialty chemicals
    { en: ['ecolab', 'diversey', 'p&g pro', 'p and g pro', 'dawn pro', 'simple green', 'spartan', '3m brand'], es: ['ecolab', 'diversey', 'p&g pro', 'simple green', 'spartan'] }
  );

  // ===================================================================
  // Wave 4.4 — Lexicon expansion across cuisines beyond US-default.
  //
  // 200+ entries spanning Asian aromatics, Mexican/Latin specialty,
  // Middle Eastern + Mediterranean, Indian + South Asian, Halal/Kosher
  // specifics, distributor SKU stems, beverage gaps, paper/cleaning
  // brand names, and modern packaging stems. Bilingual where the term
  // crosses languages; ES-only when truly culture-specific.
  // ===================================================================

  // Asian aromatics + pantry — pho/banh-mi, Korean, Japanese, Thai,
  // Chinese, Filipino kitchens.
  LEXICON.produce.push(
    { en: ['lemongrass', 'galangal', 'kaffir lime leaf', 'makrut lime leaf', 'thai basil', 'holy basil', 'shiso', 'perilla', 'curry leaf'], es: ['hierba limón', 'galanga', 'hoja de lima kaffir', 'albahaca tailandesa'] },
    { en: ['daikon', 'napa cabbage', 'napa', 'bok choy', 'gai lan', 'choy sum', 'yu choy', 'mizuna', 'tatsoi'], es: ['daikon', 'col napa', 'bok choy', 'gai lan'] },
    { en: ['nopal', 'nopales', 'tomatillo', 'tomatillos', 'jicama', 'plantain', 'plantano', 'plátano macho', 'chayote'], es: ['nopal', 'nopales', 'tomatillo', 'jícama', 'plátano macho', 'chayote'] },
    { en: ['hoja santa', 'epazote', 'huacatay', 'culantro', 'recao'], es: ['hoja santa', 'epazote', 'huacatay', 'culantro'] }
  );
  LEXICON['herbs-spices'].push(
    { en: ['gochugaru', 'gochujang', 'doubanjiang', 'sichuan peppercorn', 'szechuan peppercorn', 'five spice', '5 spice', 'star anise', 'lemongrass paste'], es: ['gochugaru', 'gochujang', 'doubanjiang', 'pimienta de sichuan', 'cinco especias', 'anís estrella'] },
    { en: ['baharat', 'dukkah', 'ras el hanout', 'sumac', 'za atar', 'zaatar', "za'atar", 'aleppo pepper', 'urfa biber', 'maras pepper'], es: ['baharat', 'dukkah', 'ras el hanout', 'zumaque', 'zaatar'] },
    { en: ['garam masala', 'tikka masala', 'tandoori masala', 'panch phoron', 'kasuri methi', 'curry powder', 'amchur', 'asafoetida', 'hing'], es: ['garam masala', 'masala', 'curry en polvo', 'asafétida'] },
    { en: ['chile de arbol', 'chile de árbol', 'chile morita', 'chile mulato', 'cascabel', 'piquin', 'piquín', 'chiltepin', 'chamoy', 'tajin', 'tajín'], es: ['chile de árbol', 'morita', 'mulato', 'cascabel', 'piquín', 'chiltepín', 'chamoy', 'tajín'] },
    { en: ['everything bagel seasoning', 'lemon pepper', 'cajun seasoning', 'creole seasoning', 'old bay', 'lawrys', "lawry's", 'adobo', 'sazon', 'sazón'], es: ['adobo', 'sazón', 'condimento cajún'] }
  );
  LEXICON['dry-goods'].push(
    // Asian pantry
    { en: ['miso', 'red miso', 'white miso', 'shiro miso', 'aka miso', 'awase miso', 'mirin', 'sake cooking', 'cooking sake'], es: ['miso', 'mirin', 'sake para cocinar'] },
    { en: ['dashi', 'kombu', 'nori', 'wakame', 'hijiki', 'bonito', 'katsuobushi', 'ajitsuke', 'furikake'], es: ['dashi', 'kombu', 'nori', 'wakame', 'bonito'] },
    { en: ['hoisin', 'hoisin sauce', 'oyster sauce', 'fish sauce', 'nuoc mam', 'nuoc cham', 'tamari', 'shoyu', 'kecap manis', 'sweet soy', 'ponzu', 'yuzu', 'yuzu kosho'], es: ['salsa hoisin', 'salsa de ostión', 'salsa de pescado', 'tamari'] },
    { en: ['chili oil', 'chile oil', 'chili crisp', 'lao gan ma', 'sesame paste', 'tahini', 'doubanjiang', 'gochujang', 'sambal oelek', 'sambal'], es: ['aceite de chile', 'tahini', 'sambal'] },
    { en: ['shaoxing wine', 'rice wine', 'rice vinegar', 'black vinegar', 'chinkiang', 'mushroom soy', 'dark soy', 'light soy'], es: ['vino de arroz', 'vinagre de arroz'] },
    { en: ['tapioca', 'tapioca starch', 'tapioca pearl', 'boba', 'sago', 'rice noodle', 'rice noodles', 'banh pho', 'pad thai noodle', 'udon', 'soba', 'somen', 'ramen noodle', 'mein', 'lo mein', 'chow mein', 'cellophane noodle', 'glass noodle', 'mung bean noodle'], es: ['tapioca', 'fideo de arroz', 'fideo'] },
    // Mexican/Latin pantry
    { en: ['masa', 'masa harina', 'maseca', 'nixtamal', 'achiote', 'achiote paste', 'recado', 'recado rojo', 'mole', 'mole poblano', 'mole negro', 'mole verde'], es: ['masa', 'masa harina', 'maseca', 'nixtamal', 'achiote', 'recado', 'mole', 'mole poblano'] },
    { en: ['adobo sauce', 'salsa verde', 'salsa roja', 'pico de gallo', 'mole sauce', 'enchilada sauce'], es: ['salsa verde', 'salsa roja', 'pico de gallo', 'salsa enchilada'] },
    { en: ['queso fundido base', 'crema de cacahuate', 'leche evaporada', 'leche condensada', 'condensed milk', 'evaporated milk'], es: ['leche evaporada', 'leche condensada'] },
    // Middle Eastern / Mediterranean
    { en: ['preserved lemon', 'pomegranate molasses', 'rose water', 'orange blossom water', 'tamarind', 'tamarind paste', 'tamarind concentrate'], es: ['limón en conserva', 'melaza de granada', 'agua de rosas', 'tamarindo'] },
    { en: ['freekeh', 'bulgur', 'couscous', 'pearl couscous', 'mograbieh', 'fregola', 'kataifi', 'phyllo', 'filo', 'halva'], es: ['freekeh', 'bulgur', 'cuscús'] },
    { en: ['harissa', 'chermoula', 'amba'], es: ['harissa'] },
    // Indian / South Asian
    { en: ['paneer', 'ghee', 'urad dal', 'toor dal', 'chana dal', 'moong dal', 'moong bean', 'mung bean', 'besan', 'gram flour', 'atta', 'chapati flour', 'naan', 'pappadam', 'papadam', 'idli rice'], es: ['paneer', 'ghee', 'lenteja urad', 'lenteja toor', 'frijol mungo', 'harina de garbanzo'] }
  );
  LEXICON.protein.push(
    { en: ['halal chicken', 'halal beef', 'halal lamb', 'zabiha', 'zabihah'], es: ['pollo halal', 'res halal', 'cordero halal'] },
    { en: ['kosher chicken', 'kosher beef', 'glatt', 'glatt kosher'], es: ['pollo kosher', 'res kosher'] },
    { en: ['cab beef', 'certified angus', 'usda prime', 'usda choice', 'usda select', 'wagyu', 'wagyu beef', 'a5 wagyu', 'kobe', 'iberico', 'jamon iberico', 'jamón ibérico', 'serrano ham', 'jamon serrano', 'jamón serrano', 'mortadella', 'salami', 'soppressata', 'capicola', 'coppa'], es: ['wagyu', 'jamón ibérico', 'jamón serrano', 'mortadela', 'salami'] },
    { en: ['oxtail', 'beef cheek', 'short rib bone-in', 'flat iron', 'tri tip', 'tri-tip', 'denver steak', 'culotte', 'picanha', 'bavette', 'machaca', 'chorizo verde'], es: ['rabo de res', 'cachete de res', 'arrachera', 'picaña', 'machaca', 'chorizo verde'] },
    { en: ['pork tenderloin', 'pork shoulder boston butt', 'boston butt', 'pork ribs', 'baby back rib', 'st louis rib', 'spare rib', 'pork jowl', 'cheek meat'], es: ['lomo de cerdo', 'paleta de cerdo', 'costilla de cerdo'] }
  );
  LEXICON.seafood.push(
    { en: ['sushi grade', 'sushi-grade', 'sashimi grade', 'sashimi-grade', 'no 1 tuna', '#1 tuna', 'otoro', 'chutoro', 'hamachi', 'yellowtail', 'kanpachi', 'masago', 'tobiko', 'ikura', 'uni', 'sea urchin'], es: ['atún sushi', 'hamachi', 'cola amarilla', 'erizo de mar'] },
    { en: ['monkfish', 'rockfish', 'pollock', 'mackerel', 'sardine', 'anchovy', 'anchovies', 'octopus tentacle', 'eel', 'unagi', 'conch', 'abalone', 'sea cucumber', 'jellyfish', 'fish cake'], es: ['rape', 'corvina', 'caballa', 'sardina', 'anchoa', 'pulpo', 'anguila', 'caracol'] },
    { en: ['imitation crab', 'surimi', 'fish roe', 'salmon roe', 'caviar', 'fish stock'], es: ['surimi', 'caviar'] }
  );
  LEXICON.dairy.push(
    { en: ['oat milk', 'soy milk', 'almond milk', 'coconut milk drink', 'macadamia milk', 'cashew milk', 'lactose free milk', 'lactose-free', 'a2 milk', 'kefir', 'labneh', 'halloumi', 'paneer', 'queso oaxaca', 'queso panela', 'queso chihuahua', 'queso asadero', 'cotija', 'requesón', 'queso de cabra', 'crema mexicana', 'crema centroamericana'], es: ['leche de avena', 'leche de soya', 'leche de almendra', 'leche de coco', 'leche sin lactosa', 'kéfir', 'queso oaxaca', 'queso panela', 'queso chihuahua', 'queso asadero', 'requesón', 'queso de cabra', 'crema mexicana'] },
    { en: ['burrata', 'stracciatella', 'taleggio', 'gouda', 'gruyere', 'gruyère', 'comte', 'comté', 'fontina', 'manchego', 'idiazabal', 'mahon', 'mahón', 'asiago', 'havarti', 'munster', 'edam', 'emmental'], es: ['burrata', 'gouda', 'manchego'] }
  );
  LEXICON.beverage.push(
    // Wave 4.4 — modern non-alcoholic + craft beverage
    { en: ['cold brew', 'cold brew concentrate', 'nitro coffee', 'nitro keg', 'cold press juice', 'kombucha', 'switchel', 'shrub', 'horchata', 'agua fresca', 'hibiscus tea', 'jamaica', 'tamarind drink', 'tamarindo'], es: ['cold brew', 'café frío', 'horchata', 'agua fresca', 'jamaica', 'tamarindo'] },
    { en: ['rtd cocktail', 'ready to drink cocktail', 'canned cocktail', 'high noon', 'on the rocks', 'cutwater'], es: ['coctel enlatado', 'coctel ready to drink'] },
    { en: ['amaro', 'aperol', 'campari', 'fernet', 'chartreuse', 'st germain', 'st-germain', 'cointreau', 'grand marnier', 'angostura', 'orange bitters', 'peychaud', 'falernum', 'orgeat', 'vermouth', 'dry vermouth', 'sweet vermouth'], es: ['vermut', 'angostura'] },
    { en: ['mead', 'cider', 'hard cider', 'sake brewing', 'soju', 'baijiu', 'shochu', 'ouzo', 'pastis', 'absinthe', 'arak', 'raki', 'jenever', 'aquavit'], es: ['sidra', 'sake', 'soju'] }
  );
  LEXICON.paper.push(
    // Wave 4.4 — takeout + delivery operations
    { en: ['parchment sheet', 'parchment quarter sheet', 'parchment half sheet', 'pan grate liner', 'sheet pan liner', 'butcher twine', 'pizza box 16in', 'pizza box 14in', 'pizza box 12in', 'pizza saver', 'pizza saver tripod'], es: ['papel pergamino', 'forro de charola'] },
    { en: ['portion bag', 'vacuum bag', 'cryovac', 'cryovac bag', 'sous vide bag', 'shopper bag', 'thank you bag', 'thank-you bag', 't-shirt bag', 'tshirt bag', 'kraft bag'], es: ['bolsa al vacío', 'bolsa kraft'] },
    { en: ['catering tray', 'half pan tray', 'full pan tray', 'aluminum pan', 'aluminum lid', 'foil lid', 'steam table pan'], es: ['charola para catering', 'charola de aluminio'] }
  );

  // ===================================================================
  // Wave 4.4 — Brand index (single name → category mapping).
  //
  // Brand-name SKUs win as Tier-1 with high confidence because the brand
  // disambiguates the category (Stella Artois → beverage:alcoholic;
  // Lay's → would be a snack but rare on restaurant invoices). 150
  // entries cover the most-common SKUs hitting independent restaurants.
  // ===================================================================
  var BRAND_INDEX = {
    // Beverage
    'stella artois': 'beverage', 'stella': 'beverage', 'budweiser': 'beverage', 'bud light': 'beverage',
    'miller lite': 'beverage', 'coors light': 'beverage', 'coors banquet': 'beverage',
    'modelo': 'beverage', 'modelo especial': 'beverage', 'modelo negra': 'beverage',
    'corona': 'beverage', 'corona extra': 'beverage', 'corona light': 'beverage',
    'heineken': 'beverage', 'guinness': 'beverage', 'pacifico': 'beverage', 'tecate': 'beverage',
    'dos equis': 'beverage', 'xx amber': 'beverage', 'xx lager': 'beverage', 'sol cerveza': 'beverage',
    'white claw': 'beverage', 'truly': 'beverage', 'high noon': 'beverage',
    'rockstar': 'beverage', 'monster': 'beverage', 'monster energy': 'beverage', 'red bull': 'beverage', 'redbull': 'beverage',
    'celsius': 'beverage', 'bang energy': 'beverage', 'reign': 'beverage', 'ghost energy': 'beverage',
    'gatorade': 'beverage', 'powerade': 'beverage', 'snapple': 'beverage', 'arizona tea': 'beverage', 'arizona': 'beverage',
    'gt kombucha': 'beverage', 'pure leaf': 'beverage', 'lipton tea': 'beverage',
    'smartwater': 'beverage', 'smart water': 'beverage', 'dasani': 'beverage', 'aquafina': 'beverage',
    'fiji water': 'beverage', 'fiji': 'beverage', 'evian': 'beverage', 'voss': 'beverage',
    'la croix': 'beverage', 'lacroix': 'beverage', 'perrier': 'beverage', 'san pellegrino': 'beverage', 'pellegrino': 'beverage',
    'topo chico': 'beverage', 'topochico': 'beverage', 'jarritos': 'beverage', 'sidral': 'beverage',
    'fanta': 'beverage', 'sprite': 'beverage', 'mountain dew': 'beverage', 'dr pepper': 'beverage', 'dr. pepper': 'beverage',
    'coca cola': 'beverage', 'coke': 'beverage', 'pepsi': 'beverage', 'diet pepsi': 'beverage',
    'red bull sugar free': 'beverage', '7up': 'beverage', '7-up': 'beverage', 'sierra mist': 'beverage',
    'lavazza': 'beverage', 'illy': 'beverage', 'starbucks coffee': 'beverage', 'peets': 'beverage', "peet's": 'beverage',
    // Spirits
    'absolut': 'beverage', 'tito': 'beverage', "tito's": 'beverage', 'grey goose': 'beverage', 'belvedere': 'beverage',
    'tanqueray': 'beverage', 'bombay sapphire': 'beverage', 'hendricks': 'beverage', "hendrick's": 'beverage',
    'bacardi': 'beverage', 'captain morgan': 'beverage', 'malibu': 'beverage',
    'jose cuervo': 'beverage', 'patron': 'beverage', 'patrón': 'beverage', 'don julio': 'beverage', 'casamigos': 'beverage', 'herradura': 'beverage',
    'jack daniels': 'beverage', "jack daniel's": 'beverage', 'makers mark': 'beverage', "maker's mark": 'beverage',
    'jameson': 'beverage', 'crown royal': 'beverage', 'johnnie walker': 'beverage', 'jim beam': 'beverage', 'wild turkey': 'beverage',
    'hennessy': 'beverage', 'remy martin': 'beverage', 'rémy martin': 'beverage', 'courvoisier': 'beverage',
    // Wines (generic varieties stay in lexicon; specific big-name producers here)
    'kendall jackson': 'beverage', 'la marca': 'beverage', 'mionetto': 'beverage', 'veuve clicquot': 'beverage', 'moet': 'beverage', 'moët': 'beverage',
    // Protein
    'tyson': 'protein', 'perdue': 'protein', 'butterball': 'protein', 'jennie o': 'protein', "jennie-o": 'protein',
    'foster farms': 'protein', 'bell evans': 'protein', "bell & evans": 'protein',
    'oscar mayer': 'protein', 'hormel': 'protein', 'jimmy dean': 'protein', 'johnsonville': 'protein', 'applegate': 'protein',
    'boars head': 'protein', "boar's head": 'protein', 'dietz watson': 'protein', 'dietz & watson': 'protein',
    // Dairy
    'kerrygold': 'dairy', 'land o lakes': 'dairy', "land o' lakes": 'dairy', 'plugra': 'dairy', 'plugrá': 'dairy',
    'philadelphia': 'dairy', 'philadelphia cream cheese': 'dairy',
    'organic valley': 'dairy', 'horizon organic': 'dairy', 'fairlife': 'dairy', 'lactaid': 'dairy',
    'silk milk': 'dairy', 'oatly': 'dairy', 'so delicious': 'dairy',
    'chobani': 'dairy', 'fage': 'dairy', 'siggis': 'dairy', "siggi's": 'dairy', 'stonyfield': 'dairy', 'yoplait': 'dairy',
    'kraft singles': 'dairy', 'tillamook': 'dairy', 'cabot': 'dairy', 'cracker barrel cheese': 'dairy',
    // Dry goods
    'heinz': 'dry-goods', 'hellmanns': 'dry-goods', "hellmann's": 'dry-goods', 'best foods': 'dry-goods',
    'french s': 'dry-goods', "french's": 'dry-goods', 'grey poupon': 'dry-goods',
    'cattlemans': 'dry-goods', "cattleman's": 'dry-goods', 'sweet baby rays': 'dry-goods', "sweet baby ray's": 'dry-goods',
    'kc masterpiece': 'dry-goods', 'stubbs': 'dry-goods', "stubb's": 'dry-goods',
    'hidden valley': 'dry-goods', 'kens': 'dry-goods', "ken's": 'dry-goods',
    'kikkoman': 'dry-goods', 'la choy': 'dry-goods', 'lee kum kee': 'dry-goods', 'huy fong': 'dry-goods', 'sriracha': 'dry-goods',
    'tabasco': 'dry-goods', 'cholula': 'dry-goods', 'el yucateco': 'dry-goods', 'valentina': 'dry-goods', 'tapatio': 'dry-goods', 'tapatío': 'dry-goods',
    'gold medal flour': 'dry-goods', 'king arthur': 'dry-goods', 'king arthur flour': 'dry-goods', 'caputo': 'dry-goods', 'caputo 00': 'dry-goods',
    'domino sugar': 'dry-goods', 'c&h sugar': 'dry-goods', 'c and h sugar': 'dry-goods',
    'mccormick': 'herbs-spices', 'frontier coop': 'herbs-spices', 'frontier': 'herbs-spices', 'simply organic': 'herbs-spices',
    'morton salt': 'herbs-spices', 'diamond crystal': 'herbs-spices', 'diamond crystal kosher': 'herbs-spices', 'maldon': 'herbs-spices',
    // Paper / packaging brands
    'solo cup': 'paper', 'solo': 'paper', 'georgia pacific': 'paper', 'gp pro': 'paper',
    'dixie': 'paper', 'reynolds': 'paper', 'reynolds wrap': 'paper', 'glad': 'paper', 'saran wrap': 'paper',
    'ziploc': 'paper', 'eco-products': 'paper', 'world centric': 'paper',
    // Cleaning brands (already partially in lexicon push — extra here)
    'dawn': 'cleaning', 'dawn pro': 'cleaning', 'dawn ultra': 'cleaning', 'palmolive': 'cleaning',
    'cascade': 'cleaning', 'finish': 'cleaning', 'jet dry': 'cleaning',
    'clorox': 'cleaning', 'clorox bleach': 'cleaning', 'pinesol': 'cleaning', 'pine-sol': 'cleaning',
    'mr clean': 'cleaning', 'lysol': 'cleaning', 'spic span': 'cleaning', 'spic and span': 'cleaning'
  };

  // ===================================================================
  // Wave 4.4 — Abbreviation expansion table.
  //
  // Distributors print "CHX BRST 10LB" not "CHICKEN BREAST"; we expand
  // before tier-1 substring search so the lexicon catches it.
  // Bilingual; keep additions conservative — false expansions are
  // worse than missed ones.
  // ===================================================================
  var ABBREV = {
    // Proteins
    'chx':       'chicken',
    'chkn':      'chicken',
    'bf':        'beef',
    'grnd':      'ground',
    'gr':        'ground',
    'brst':      'breast',
    'brsts':     'breasts',
    'thi':       'thigh',
    'thgh':      'thigh',
    'tndr':      'tender',
    'tndrloin':  'tenderloin',
    'tndrln':    'tenderloin',
    'sirl':      'sirloin',
    'rbeye':     'ribeye',
    'wgyu':      'wagyu',
    'mtbll':     'meatball',
    'mtblls':    'meatballs',
    'sasg':      'sausage',
    'ssg':       'sausage',
    'brgr':      'burger',
    'hbg':       'burger',
    'hdg':       'hot dog',
    'hd':        'hot dog',
    // Seafood
    'shrmp':     'shrimp',
    'shrm':      'shrimp',
    'p&d':       'peeled deveined',
    'iqf':       'iqf',
    // Produce
    'lett':      'lettuce',
    'rom':       'romaine',
    'tom':       'tomato',
    'cuc':       'cucumber',
    'jal':       'jalapeño',
    'asparag':   'asparagus',
    'asp':       'asparagus',
    'mush':      'mushroom',
    'mshrm':     'mushroom',
    'avo':       'avocado',
    'cilan':     'cilantro',
    'pars':      'parsley',
    // Pantry
    'flr':       'flour',
    'sgr':       'sugar',
    'butt':      'butter',
    'olv':       'olive',
    'evoo':      'extra virgin olive oil',
    // Frozen / temperature
    'frzn':      'frozen',
    'frz':       'frozen',
    'rfg':       'refrigerated',
    'amb':       'ambient',
    'fzn':       'frozen',
    // Sizes
    'lg':        'large',
    'md':        'medium',
    'sm':        'small',
    'xlg':       'extra large',
    'xtra':      'extra',
    'asst':      'assorted',
    'prem':      'premium',
    'orig':      'original',
    'ind':       'individual',
    'spc':       'special',
    // Bilingual
    'pollo':     'pollo',
    'res':       'res',
    'pasta':     'pasta',
    'cab':       'angus'
  };

  function expandTokens(s) {
    var tokens = String(s || '').split(/\s+/);
    return tokens.map(function (t) {
      // Strip punctuation when looking up abbreviations.
      var bare = t.toLowerCase().replace(/[^a-z0-9&]+/g, '');
      if (ABBREV[bare]) return ABBREV[bare];
      // Plural-stripper for -s and -es and -ies
      if (bare.length >= 5 && bare.endsWith('ies')) {
        var stem = bare.slice(0, -3) + 'y';
        if (ABBREV[stem]) return ABBREV[stem];
      }
      return t;
    }).join(' ');
  }

  // ===================================================================
  // Wave 4.7 — Orthogonal tags layer.
  //
  // Tags are additive: a row can be `protein` AND `frozen` AND
  // `allergen-major`. Drives advanced filtering (4.7) and the
  // accountant-CSV's freezer-vs-ambient column without splitting
  // the 9-bucket taxonomy.
  // ===================================================================
  var TAG_PATTERNS = {
    'frozen':         /\b(frozen|frzn|fzn|frz|iqf|deep\s+frozen|congelado|congelados)\b/i,
    'perishable':     null, // applied by category — protein/seafood/produce/dairy default
    'organic':        /\b(organic|org|organico|orgánico)\b/i,
    'local':          /\b(local|locally\s+grown|farm\s+to\s+table|farm-to-table)\b/i,
    'house-made':     /\b(house\s+made|house-made|housemade|hecho\s+en\s+casa)\b/i,
    'allergen-nuts':  /\b(peanut|tree\s*nut|almond|walnut|pecan|pistachio|cashew|hazelnut|nuez|almendra|cacahuate)\b/i,
    'allergen-dairy': /\b(milk|cream|butter|cheese|yogurt|leche|crema|mantequilla|queso)\b/i,
    'allergen-egg':   /\b(egg|huevo)\b/i,
    'allergen-wheat': /\b(wheat|flour|pasta|bread|trigo|harina|pan)\b/i,
    'allergen-soy':   /\b(soy|tofu|soya|edamame)\b/i,
    'allergen-fish':  /\b(fish|salmon|tuna|cod|halibut|tilapia|pescado|salm[oó]n|at[uú]n|bacalao)\b/i,
    'allergen-shellfish': /\b(shrimp|crab|lobster|scallop|oyster|mussel|clam|prawn|camar[oó]n|cangrejo|langosta)\b/i,
    'allergen-sesame': /\b(sesame|tahini|aj[oo]nj[oo]l[ií]|s[eé]samo)\b/i,
    'alcoholic':      /\b(beer|wine|vodka|gin|rum|tequila|whiskey|whisky|bourbon|scotch|mezcal|brandy|cognac|champagne|prosecco|cerveza|vino|ron|vodka|whisky)\b/i,
    'gluten-free':    /\b(gluten\s*free|gf|sin\s+gluten)\b/i,
    'vegan':          /\b(vegan|vegano|vegana|plant\s+based|plant-based)\b/i
  };

  // Categories that are perishable by default.
  var PERISHABLE_CATS = { protein: 1, seafood: 1, produce: 1, dairy: 1 };

  function deriveTags(row, category) {
    var raw = String((row && row.name) || '');
    if (row && row.raw) raw += ' ' + row.raw;
    var tags = [];
    if (PERISHABLE_CATS[category]) tags.push('perishable');
    Object.keys(TAG_PATTERNS).forEach(function (tag) {
      var re = TAG_PATTERNS[tag];
      if (re && re.test(raw)) tags.push(tag);
    });
    // Pack-derived tag: a `pack.unit === '#'` or 'cs' suggests bulk
    // foodservice rather than individually-packaged retail.
    if (row && row.pack && (row.pack.unit === '#' || row.pack.unit === 'cs' || row.pack.unit === 'case')) {
      tags.push('bulk');
    }
    return tags;
  }

  function normalize(s) {
    var raw = String(s || '')
      .toLowerCase()
      .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
      .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
      .replace(/[^a-z0-9 &]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // Wave 4.4 — abbreviation expansion runs at normalize time so
    // every tier sees the expanded form. "CHX BRST" → "chicken breast".
    return expandTokens(raw);
  }

  // Wave 4.4 — brand-name index Tier-1 fast path. A line containing
  // "STELLA ARTOIS" gets categorized with high confidence regardless
  // of the rest of the line shape. Substring-match (case-insensitive
  // via normalize) — the brand name being present is sufficient.
  function tier1Brand(rowName) {
    var name = normalize(rowName);
    if (!name) return null;
    var bestKey = null;
    Object.keys(BRAND_INDEX).forEach(function (k) {
      var nk = normalize(k);
      if (!nk || nk.length < 4) return;
      if (name.indexOf(nk) === -1) return;
      if (!bestKey || nk.length > normalize(bestKey).length) bestKey = k;
    });
    if (!bestKey) return null;
    return {
      category:   BRAND_INDEX[bestKey],
      confidence: 92,
      tier:       'brand',
      matched:    bestKey
    };
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
    if (!row || typeof row !== 'object') return { category: null, confidence: 0, tier: 'none', tags: [] };
    // Tier 0 — operator's own past corrections (W7-8). Wins over
    // lexicon because the operator has already told us what THIS
    // SKU means in their kitchen. Browser-only check; safe in Node.
    var hit = null;
    if (typeof root !== 'undefined' && root && root.MID_LEARNINGS &&
        typeof root.MID_LEARNINGS.lookupOverride === 'function') {
      hit = root.MID_LEARNINGS.lookupOverride(row.name);
    }
    // Tier 1 brand — wins over generic lexicon when a recognized
    // brand name is present.
    if (!hit) hit = tier1Brand(row.name);
    if (!hit) hit = tier1Exact(row.name);
    if (!hit) hit = tier2Fuzzy(row.name);
    if (!hit) hit = tier3Heuristic(row);
    if (!hit) hit = { category: null, confidence: 0, tier: 'none' };
    // Wave 4.7 — derive tags regardless of which tier won. Tags are
    // additive and never block categorization.
    hit.tags = deriveTags(row, hit.category);
    return hit;
  }

  var api = {
    classify:    classify,
    LEXICON:     LEXICON,
    BRAND_INDEX: BRAND_INDEX,
    ABBREV:      ABBREV,
    expandTokens: expandTokens,
    deriveTags:  deriveTags,
    tier1Brand:  tier1Brand
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_CATEGORIZE = api;
})(typeof window !== 'undefined' ? window : null);
