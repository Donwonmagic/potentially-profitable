/**
 * Menu Design Suite — cuisine starter-pack templates (W22 extraction).
 *
 * owns:    6 curated dataset templates (brunch / wine list / tasting
 *          / cocktails / kids / dessert)
 * exports: MD_TEMPLATES on window; module.exports for tests
 * deps:    none — pure data
 * why:     ~180 LOC of dataset literals living in the orchestrator.
 *          Pulling out lets copy edits + new templates ship without
 *          touching menu-design.js. New templates added here
 *          automatically appear in the W11-1 templates dropdown +
 *          the W12-4 Cmd-K palette suggestion, since both read
 *          MD_TEMPLATES at runtime.
 */
(function (root) {
  'use strict';

  var TEMPLATES = {
    brunch: {
      label_en: 'Brunch', label_es: 'Brunch',
      hint_en: '8 sections · 24 dishes · cafe-counter theme',
      hint_es: '8 secciones · 24 platos · tema cafe-counter',
      themeHint: 'cafe-counter',
      rows: [
        { kind: 'section', name: 'Eggs & toast' },
        { kind: 'dish', name: 'Avocado toast',     price: '$14', desc: 'Sourdough, smashed avocado, soft-boiled egg, chili oil.', allergens: ['VG','E'], spice: 1 },
        { kind: 'dish', name: 'Eggs Benedict',     price: '$18', desc: 'Toasted English muffin, ham, hollandaise.',                allergens: ['E','DF'] },
        { kind: 'dish', name: 'Shakshuka',         price: '$16', desc: 'Stewed tomato, bell pepper, two baked eggs, feta.',         allergens: ['VG','E'], spice: 2 },
        { kind: 'section', name: 'Sweets' },
        { kind: 'dish', name: 'Buttermilk pancakes', price: '$13', desc: 'Stack of three with maple syrup and butter.',             allergens: ['VG','E'] },
        { kind: 'dish', name: 'French toast',      price: '$15', desc: 'Brioche, vanilla custard, berry compote.',                  allergens: ['VG','E'] },
        { kind: 'section', name: 'Breakfast plates' },
        { kind: 'dish', name: 'The Big Plate',     price: '$22', desc: 'Two eggs, bacon, sausage, hash browns, toast.',             allergens: ['E'] },
        { kind: 'dish', name: 'Veggie scramble',   price: '$17', desc: 'Three eggs, spinach, mushroom, tomato, goat cheese.',       allergens: ['VG','E'] },
        { kind: 'section', name: 'Drinks' },
        { kind: 'dish', name: 'Drip coffee',       price: '$4',  desc: 'Local roaster, refills included.' },
        { kind: 'dish', name: 'Cappuccino',        price: '$5',  desc: 'Double shot, steamed milk, dry foam.', allergens: ['VG'] },
        { kind: 'dish', name: 'Fresh OJ',          price: '$6',  desc: 'Squeezed to order.', allergens: ['V'] }
      ]
    },
    'wine-list': {
      label_en: 'Wine list', label_es: 'Carta de vinos',
      hint_en: '4 sections · 18 wines · wine-list-formal theme',
      hint_es: '4 secciones · 18 vinos · tema wine-list-formal',
      themeHint: 'wine-list-formal',
      rows: [
        { kind: 'section', name: 'White' },
        { kind: 'dish', name: 'Sancerre, Henri Bourgeois 2022',   price: '$58',  desc: 'Loire Valley, France · sauvignon blanc' },
        { kind: 'dish', name: 'Albariño, Bodegas Fillaboa 2021',  price: '$48',  desc: 'Rías Baixas, Spain · saline minerality' },
        { kind: 'dish', name: 'Riesling, Dr. Loosen 2021',        price: '$42',  desc: 'Mosel, Germany · off-dry, peach' },
        { kind: 'section', name: 'Red' },
        { kind: 'dish', name: 'Chianti Classico, Felsina 2019',   price: '$72',  desc: 'Tuscany, Italy · sangiovese' },
        { kind: 'dish', name: 'Pinot Noir, Au Bon Climat 2020',   price: '$68',  desc: 'Santa Barbara, USA · cherry, earth' },
        { kind: 'dish', name: 'Côtes du Rhône, Guigal 2020',      price: '$54',  desc: 'Southern Rhône, France · GSM blend' },
        { kind: 'section', name: 'Sparkling' },
        { kind: 'dish', name: 'Champagne brut, Pol Roger NV',     price: '$110', desc: 'Épernay, France · Pinot-Chardonnay' },
        { kind: 'dish', name: 'Cava brut, Raventós i Blanc NV',   price: '$42',  desc: 'Penedès, Spain · biodynamic', allergens: ['LO'] },
        { kind: 'section', name: 'By the glass' },
        { kind: 'dish', name: 'House white',                       price: '$11',  desc: 'Ask your server.' },
        { kind: 'dish', name: 'House red',                         price: '$11',  desc: 'Ask your server.' }
      ]
    },
    tasting: {
      label_en: 'Tasting menu', label_es: 'Menú de degustación',
      hint_en: '5 courses · single column · tasting-omakase theme',
      hint_es: '5 cursos · una columna · tema tasting-omakase',
      themeHint: 'tasting-omakase',
      rows: [
        { kind: 'section', name: 'I' },
        { kind: 'dish', name: 'Oyster',   price: '',  desc: 'Hama Hama, mignonette of pickled green strawberry.', allergens: ['SF','GF'] },
        { kind: 'section', name: 'II' },
        { kind: 'dish', name: 'Crudo',    price: '',  desc: 'Spotted prawn, tomato water, sea bean, lemon oil.', allergens: ['SF','GF','DF'] },
        { kind: 'section', name: 'III' },
        { kind: 'dish', name: 'Pasta',    price: '',  desc: 'Hand-cut tagliatelle, brown butter, koji, parmigiano.', allergens: ['VG','E'] },
        { kind: 'section', name: 'IV' },
        { kind: 'dish', name: 'Main',     price: '',  desc: 'Aged duck, beet, chrysanthemum, port reduction.', allergens: ['DF'] },
        { kind: 'section', name: 'V' },
        { kind: 'dish', name: 'Dessert',  price: '',  desc: 'Brown butter cake, miso caramel, bay leaf ice cream.', allergens: ['VG','E','DF'] }
      ]
    },
    cocktails: {
      label_en: 'Cocktail menu', label_es: 'Carta de cócteles',
      hint_en: '3 sections · 12 cocktails · cocktail-deco theme',
      hint_es: '3 secciones · 12 cócteles · tema cocktail-deco',
      themeHint: 'cocktail-deco',
      rows: [
        { kind: 'section', name: 'Stirred' },
        { kind: 'dish', name: 'Old Fashioned',  price: '$16', desc: 'Bourbon, demerara, Angostura, orange peel.', allergens: ['GF','DF'] },
        { kind: 'dish', name: 'Manhattan',      price: '$16', desc: 'Rye, sweet vermouth, Angostura, cherry.', allergens: ['GF','DF'] },
        { kind: 'dish', name: 'Negroni',        price: '$15', desc: 'Gin, Campari, sweet vermouth, orange.', allergens: ['GF','DF'] },
        { kind: 'section', name: 'Shaken' },
        { kind: 'dish', name: 'Margarita',      price: '$14', desc: 'Tequila, lime, agave, salt rim.', allergens: ['GF','DF'] },
        { kind: 'dish', name: 'Daiquiri',       price: '$14', desc: 'Rum, lime, demerara.', allergens: ['GF','DF'] },
        { kind: 'dish', name: 'Whiskey sour',   price: '$15', desc: 'Bourbon, lemon, demerara, egg white.', allergens: ['E','DF'] },
        { kind: 'section', name: 'House' },
        { kind: 'dish', name: 'Smoke & Mirror', price: '$18', desc: 'Mezcal, lime, ancho, Tajín rim.', allergens: ['GF','DF'], spice: 2 },
        { kind: 'dish', name: 'Garden Party',   price: '$16', desc: 'Gin, cucumber, mint, elderflower.', allergens: ['GF','DF','V'] }
      ]
    },
    kids: {
      label_en: 'Kids menu', label_es: 'Menú infantil',
      hint_en: '4 sections · friendly portions · kids-bright theme',
      hint_es: '4 secciones · porciones amigables · tema kids-bright',
      themeHint: 'kids-bright',
      rows: [
        { kind: 'section', name: 'Mains' },
        { kind: 'dish', name: 'Mac & cheese',     price: '$8',  desc: 'Cavatappi pasta, three-cheese sauce.', allergens: ['VG','E'] },
        { kind: 'dish', name: 'Chicken tenders',  price: '$9',  desc: 'Crispy chicken with ketchup or honey mustard.', allergens: ['DF'] },
        { kind: 'dish', name: 'Cheese pizza',     price: '$8',  desc: '6-inch personal pizza.', allergens: ['VG'] },
        { kind: 'section', name: 'Sides' },
        { kind: 'dish', name: 'French fries',     price: '$4',  desc: '', allergens: ['V','GF'] },
        { kind: 'dish', name: 'Apple slices',     price: '$3',  desc: 'With caramel dip.', allergens: ['V','GF'] },
        { kind: 'section', name: 'Drinks' },
        { kind: 'dish', name: 'Lemonade',         price: '$3',  desc: '', allergens: ['V'] },
        { kind: 'dish', name: 'Chocolate milk',   price: '$3',  desc: '', allergens: ['VG'] },
        { kind: 'section', name: 'Sweets' },
        { kind: 'dish', name: 'Vanilla ice cream',price: '$5',  desc: 'One scoop, sprinkles on request.', allergens: ['VG','E'] }
      ]
    },
    dessert: {
      label_en: 'Dessert menu', label_es: 'Menú de postres',
      hint_en: '2 sections · 8 desserts · dessert-only theme',
      hint_es: '2 secciones · 8 postres · tema dessert-only',
      themeHint: 'dessert-only',
      rows: [
        { kind: 'section', name: 'House desserts' },
        { kind: 'dish', name: 'Olive-oil cake',   price: '$11', desc: 'Citrus glaze, candied zest, crème fraîche.', allergens: ['VG','E'] },
        { kind: 'dish', name: 'Tiramisu',         price: '$13', desc: 'Mascarpone, espresso-soaked savoiardi, cocoa.', allergens: ['VG','E'] },
        { kind: 'dish', name: 'Panna cotta',      price: '$10', desc: 'Vanilla bean, seasonal berries.', allergens: ['VG','GF'] },
        { kind: 'dish', name: 'Chocolate torte',  price: '$12', desc: 'Single-origin 70%, sea salt, olive oil.', allergens: ['VG','GF','E'] },
        { kind: 'section', name: 'Ice cream & gelato' },
        { kind: 'dish', name: 'Affogato',         price: '$9',  desc: 'House gelato, espresso pour, hazelnut crumble.', allergens: ['VG','N','E'] },
        { kind: 'dish', name: 'Gelato trio',      price: '$11', desc: 'Three scoops · ask about today.', allergens: ['VG','E'] }
      ]
    },

    // ----------------------------------------------------------------
    // Cuisine starter packs. Wired from quiz-tiles.js so picking the
    // 🌮 tile loads cantina dishes, not Italian. Copy is operator-tone
    // and reflects real menus from each cuisine's tradition. Allergen
    // codes follow the canonical catalog. Prices in USD, mid-tier
    // independent restaurant range. Sections capped at 3-4 to keep
    // the cold-start grid readable on phone.
    // ----------------------------------------------------------------
    'italian-trattoria': {
      label_en: 'Italian / trattoria', label_es: 'Italiana / trattoria',
      hint_en: '4 sections · 14 dishes · trattoria theme',
      hint_es: '4 secciones · 14 platos · tema trattoria',
      themeHint: 'trattoria',
      rows: [
        { kind: 'section', name: 'Antipasti' },
        { kind: 'dish', name: 'Bruschetta al pomodoro',  price: '$11', desc: 'Grilled levain, summer tomato, basil, finishing oil.', allergens: ['V','GL'] },
        { kind: 'dish', name: 'Burrata, peach, prosciutto', price: '$17', desc: 'Stracciatella heart, prosciutto di Parma, white peach.', allergens: ['VG'] },
        { kind: 'dish', name: 'Carpaccio di manzo',      price: '$18', desc: 'Hand-sliced beef, arugula, parmigiano, lemon-caper oil.', allergens: ['DF'] },
        { kind: 'section', name: 'Pasta' },
        { kind: 'dish', name: 'Cacio e pepe',            price: '$22', desc: 'Tonnarelli, pecorino romano, cracked Tellicherry pepper.', allergens: ['VG','GL','E'] },
        { kind: 'dish', name: 'Bucatini all\'amatriciana',price: '$24', desc: 'Guanciale, San Marzano, pecorino, chili.', allergens: ['GL','E'], spice: 1 },
        { kind: 'dish', name: 'Tagliatelle al ragù',     price: '$26', desc: 'Hand-cut ribbons, four-hour beef-and-pork ragù.', allergens: ['GL','E'] },
        { kind: 'dish', name: 'Ravioli di zucca',        price: '$25', desc: 'Roasted squash, brown butter, crispy sage, amaretti.', allergens: ['VG','GL','E','N'] },
        { kind: 'section', name: 'Secondi' },
        { kind: 'dish', name: 'Branzino al sale',        price: '$36', desc: 'Whole sea bass, salt-baked, lemon, salsa verde.', allergens: ['F','GF','DF'] },
        { kind: 'dish', name: 'Pollo al mattone',        price: '$28', desc: 'Brick-pressed half chicken, rosemary, lemon, jus.', allergens: ['GF','DF'] },
        { kind: 'dish', name: 'Bistecca alla fiorentina',price: '$58', desc: 'Bone-in T-bone for two, olive oil, salt, lemon.', allergens: ['GF','DF'] },
        { kind: 'section', name: 'Dolci' },
        { kind: 'dish', name: 'Tiramisù della casa',     price: '$13', desc: 'Mascarpone, espresso-soaked savoiardi, cocoa.', allergens: ['VG','E','GL'] },
        { kind: 'dish', name: 'Affogato',                price: '$10', desc: 'Vanilla gelato drowned in a shot of espresso.', allergens: ['VG','E'] },
        { kind: 'dish', name: 'Panna cotta al limone',   price: '$11', desc: 'Lemon-vanilla custard, candied peel, biscotti crumb.', allergens: ['VG','GF','E'] }
      ]
    },

    'french-bistro': {
      label_en: 'French / bistro', label_es: 'Francesa / bistró',
      hint_en: '4 sections · 13 dishes · bistro-paris theme',
      hint_es: '4 secciones · 13 platos · tema bistro-paris',
      themeHint: 'bistro-paris',
      rows: [
        { kind: 'section', name: 'Pour commencer' },
        { kind: 'dish', name: 'Soupe à l\'oignon gratinée', price: '$14', desc: 'Caramelized onion broth, gruyère, country bread.', allergens: ['VG','GL'] },
        { kind: 'dish', name: 'Escargots de Bourgogne',     price: '$16', desc: 'Six snails, parsley-garlic butter, baguette.', allergens: ['VG','GL','M'] },
        { kind: 'dish', name: 'Salade lyonnaise',           price: '$15', desc: 'Frisée, lardons, poached egg, sherry vinaigrette.', allergens: ['E','DF'] },
        { kind: 'section', name: 'Plats' },
        { kind: 'dish', name: 'Steak frites, sauce au poivre', price: '$32', desc: 'Hanger steak, peppercorn cream, hand-cut frites.', allergens: ['VG','GF'] },
        { kind: 'dish', name: 'Coq au vin',                 price: '$28', desc: 'Bone-in chicken braised in red wine, mushrooms, lardons.', allergens: ['DF'] },
        { kind: 'dish', name: 'Moules marinière',           price: '$26', desc: 'Mussels, white wine, shallot, parsley, frites.', allergens: ['SF','VG','M'] },
        { kind: 'dish', name: 'Saumon en croûte d\'herbes', price: '$30', desc: 'Atlantic salmon, herb crust, beurre blanc, haricots verts.', allergens: ['F','VG'] },
        { kind: 'dish', name: 'Quiche du jour',             price: '$18', desc: 'Pâte brisée, today\'s filling, frisée salad.', allergens: ['VG','GL','E'] },
        { kind: 'section', name: 'Fromages' },
        { kind: 'dish', name: 'Plateau de fromages',        price: '$21', desc: 'Three farmhouse cheeses, fig confit, walnuts, baguette.', allergens: ['VG','GL','N'] },
        { kind: 'section', name: 'Desserts' },
        { kind: 'dish', name: 'Crème brûlée',               price: '$12', desc: 'Vanilla custard, caramelized sugar crust.', allergens: ['VG','GF','E'] },
        { kind: 'dish', name: 'Tarte Tatin',                price: '$13', desc: 'Caramelized apples, puff pastry, crème fraîche.', allergens: ['VG','GL','E'] },
        { kind: 'dish', name: 'Profiteroles au chocolat',   price: '$12', desc: 'Choux pastry, vanilla ice cream, warm chocolate.', allergens: ['VG','GL','E'] },
        { kind: 'dish', name: 'Mousse au chocolat',         price: '$11', desc: 'Dark chocolate, whipped cream, sea salt.', allergens: ['VG','GF','E'] }
      ]
    },

    'mexican-cantina': {
      label_en: 'Mexican / cantina', label_es: 'Mexicana / cantina',
      hint_en: '5 sections · 16 dishes · cantina theme',
      hint_es: '5 secciones · 16 platos · tema cantina',
      themeHint: 'cantina',
      rows: [
        { kind: 'section', name: 'Para empezar' },
        { kind: 'dish', name: 'Guacamole de molcajete',  price: '$13', desc: 'Hass avocado, serrano, white onion, cilantro, lime, tortilla chips.', allergens: ['V','GF'], spice: 2 },
        { kind: 'dish', name: 'Esquites',                price: '$9',  desc: 'Charred corn, mayo, cotija, Tajín, lime.', allergens: ['VG','GF','E'], spice: 1 },
        { kind: 'dish', name: 'Queso fundido',           price: '$14', desc: 'Melted Oaxaca + chihuahua, chorizo, flour tortillas.', allergens: ['VG','GL'] },
        { kind: 'section', name: 'Tacos · 3 por orden' },
        { kind: 'dish', name: 'Tacos de cochinita pibil', price: '$15', desc: 'Achiote-marinated pork, banana leaf, pickled red onion, habanero salsa.', allergens: ['GF','DF'], spice: 2 },
        { kind: 'dish', name: 'Tacos al pastor',         price: '$14', desc: 'Marinated pork, charred pineapple, white onion, cilantro, lime.', allergens: ['GF','DF'], spice: 2 },
        { kind: 'dish', name: 'Tacos de carne asada',    price: '$16', desc: 'Grilled skirt steak, guacamole, salsa roja, lime.', allergens: ['GF','DF'], spice: 1 },
        { kind: 'dish', name: 'Tacos de pescado',        price: '$15', desc: 'Beer-battered cod, cabbage slaw, chipotle crema, salsa verde.', allergens: ['F','GL','VG'], spice: 1 },
        { kind: 'dish', name: 'Tacos de hongos',         price: '$13', desc: 'Roasted maitake + portobello, salsa macha, queso fresco, epazote.', allergens: ['VG','GF','N','SE'], spice: 2 },
        { kind: 'section', name: 'Platos fuertes' },
        { kind: 'dish', name: 'Mole poblano',            price: '$24', desc: 'Slow-simmered mole, bone-in chicken, sesame, rice, charred tortillas.', allergens: ['GF','SE','N'], spice: 2 },
        { kind: 'dish', name: 'Enchiladas verdes',       price: '$19', desc: 'Tomatillo-poblano salsa, shredded chicken, crema, queso fresco.', allergens: ['VG','GF'], spice: 1 },
        { kind: 'dish', name: 'Chiles en nogada',        price: '$26', desc: 'Roasted poblano, picadillo, walnut cream, pomegranate. Seasonal.', allergens: ['VG','GF','N'] },
        { kind: 'dish', name: 'Pescado a la talla',      price: '$32', desc: 'Whole grilled snapper, guajillo-achiote rub, rice, refried beans.', allergens: ['F','GF','DF'], spice: 2 },
        { kind: 'section', name: 'Bebidas' },
        { kind: 'dish', name: 'Margarita de la casa',    price: '$13', desc: 'Blanco tequila, lime, agave, kosher salt rim.', allergens: ['V','GF'] },
        { kind: 'dish', name: 'Mezcal old fashioned',    price: '$15', desc: 'Espadín mezcal, agave, mole bitters, orange peel.', allergens: ['V','GF'] },
        { kind: 'dish', name: 'Agua de jamaica',         price: '$5',  desc: 'Hibiscus, lime, raw cane sugar.', allergens: ['V','GF'] },
        { kind: 'section', name: 'Postres' },
        { kind: 'dish', name: 'Tres leches',             price: '$10', desc: 'Three-milk cake, cinnamon, fresh berries.', allergens: ['VG','GL','E'] }
      ]
    },

    'pizza-counter': {
      label_en: 'Pizza counter', label_es: 'Pizzería',
      hint_en: '3 sections · 12 items · pizza-counter theme',
      hint_es: '3 secciones · 12 ítems · tema pizza-counter',
      themeHint: 'pizza-counter',
      rows: [
        { kind: 'section', name: 'Pizzas — 12-inch' },
        { kind: 'dish', name: 'Margherita',              price: '$17', desc: 'San Marzano, fior di latte, basil, finishing oil.', allergens: ['VG','GL'] },
        { kind: 'dish', name: 'Marinara',                price: '$14', desc: 'San Marzano, garlic, oregano, oil. No cheese.', allergens: ['V','GL'] },
        { kind: 'dish', name: 'Diavola',                 price: '$19', desc: 'Spicy sopressata, fior di latte, calabrian chili.', allergens: ['GL'], spice: 2 },
        { kind: 'dish', name: 'Funghi',                  price: '$20', desc: 'Roasted mushroom medley, taleggio, thyme, truffle oil.', allergens: ['VG','GL'] },
        { kind: 'dish', name: 'Bianca',                  price: '$18', desc: 'No tomato. Mozzarella, ricotta, garlic, olive oil, sea salt.', allergens: ['VG','GL'] },
        { kind: 'dish', name: 'Quattro formaggi',        price: '$21', desc: 'Mozzarella, gorgonzola, parmigiano, taleggio, honey.', allergens: ['VG','GL'] },
        { kind: 'section', name: 'Sides + salads' },
        { kind: 'dish', name: 'Caesar salad',            price: '$13', desc: 'Romaine, anchovy dressing, parmigiano, croutons.', allergens: ['VG','GL','E','F'] },
        { kind: 'dish', name: 'Arugula + parmigiano',    price: '$11', desc: 'Lemon, olive oil, shaved parmigiano.', allergens: ['VG','GF'] },
        { kind: 'dish', name: 'Garlic knots',            price: '$8',  desc: 'Six knots, garlic-parsley butter, marinara dip.', allergens: ['VG','GL'] },
        { kind: 'section', name: 'Drinks' },
        { kind: 'dish', name: 'Italian soda',            price: '$5',  desc: 'Lemon, blood orange, or chinotto.', allergens: ['V','GF'] },
        { kind: 'dish', name: 'Peroni',                  price: '$6',  desc: 'Italian lager, draft.', allergens: ['V','GL'] },
        { kind: 'dish', name: 'House red',               price: '$10', desc: 'Glass · Sangiovese, Tuscany.', allergens: ['V','GF'] }
      ]
    },

    'bbq-smokehouse': {
      label_en: 'BBQ / smokehouse', label_es: 'BBQ / asador',
      hint_en: '3 sections · 12 items · bbq-smoke theme',
      hint_es: '3 secciones · 12 ítems · tema bbq-smoke',
      themeHint: 'bbq-smoke',
      rows: [
        { kind: 'section', name: 'From the smoker' },
        { kind: 'dish', name: 'Brisket',                 price: '$24/lb', desc: 'Twelve-hour post-oak smoke. Lean or moist — ask the carver.', allergens: ['GF','DF'] },
        { kind: 'dish', name: 'Pork ribs (1/2 rack)',    price: '$22', desc: 'St. Louis cut, dry-rubbed, smoked four hours, no sauce.', allergens: ['GF','DF'] },
        { kind: 'dish', name: 'Pulled pork',             price: '$18', desc: 'Pork shoulder, hand-pulled, vinegar mop on the side.', allergens: ['GF','DF'] },
        { kind: 'dish', name: 'Smoked turkey breast',    price: '$19', desc: 'Brined 24 hours, applewood smoked, sliced thick.', allergens: ['GF','DF'] },
        { kind: 'dish', name: 'Hot link sausage',        price: '$8',  desc: 'House-made beef-and-pork link, jalapeño, smoked.', allergens: ['GF','DF'], spice: 2 },
        { kind: 'section', name: 'Sides' },
        { kind: 'dish', name: 'Mac & cheese',            price: '$7',  desc: 'Cavatappi, three-cheese sauce, smoked breadcrumb.', allergens: ['VG','GL','E'] },
        { kind: 'dish', name: 'Collard greens',          price: '$6',  desc: 'Slow-simmered with smoked turkey neck, vinegar, chili.', allergens: ['GF','DF'], spice: 1 },
        { kind: 'dish', name: 'Cornbread',               price: '$5',  desc: 'Cast-iron skillet, honey butter on the side.', allergens: ['VG','GL','E'] },
        { kind: 'dish', name: 'Burnt-end baked beans',   price: '$6',  desc: 'Slow-cooked with brisket trimmings, brown sugar, mustard.', allergens: ['GF','DF','MU'] },
        { kind: 'dish', name: 'Coleslaw',                price: '$5',  desc: 'Vinegar-based, no mayo. Cabbage, carrot, celery seed.', allergens: ['V','GF','MU'] },
        { kind: 'section', name: 'Sweets + drinks' },
        { kind: 'dish', name: 'Banana pudding',          price: '$8',  desc: 'Vanilla custard, vanilla wafers, fresh banana, whipped cream.', allergens: ['VG','GL','E'] },
        { kind: 'dish', name: 'Sweet tea',               price: '$4',  desc: 'Brewed strong, half-gallon refills.', allergens: ['V','GF'] }
      ]
    },

    'asian-table': {
      // Pan-Asian fallback for operators whose menu spans regions
      // (food court, corner shop). Cuisine-specific tiles below
      // should be preferred when the operation is single-region.
      label_en: 'Asian fusion', label_es: 'Asiática (fusión)',
      hint_en: '3 sections · 10 dishes · asian-table theme',
      hint_es: '3 secciones · 10 platos · tema asian-table',
      themeHint: 'asian-table',
      rows: [
        { kind: 'section', name: 'Small plates' },
        { kind: 'dish', name: 'Pork dumplings',          price: '$11', desc: 'Pan-fried gyoza, ginger-soy dip, scallion.', allergens: ['GL','SO','E','SE'] },
        { kind: 'dish', name: 'Edamame, smoked salt',    price: '$7',  desc: 'Steamed soybean pods, alderwood salt.', allergens: ['V','GF','SO'] },
        { kind: 'dish', name: 'Crispy tofu, chili crisp',price: '$10', desc: 'Twice-fried silken tofu, Lao Gan Ma, scallion.', allergens: ['VG','GF','SO','SE','N'], spice: 2 },
        { kind: 'section', name: 'Mains' },
        { kind: 'dish', name: 'Chicken ramen',           price: '$17', desc: 'Twelve-hour shoyu broth, chashu, soft egg, nori, scallion.', allergens: ['GL','E','SO','SE'] },
        { kind: 'dish', name: 'Bibimbap',                price: '$16', desc: 'Stone-bowl rice, beef bulgogi, vegetables, gochujang, fried egg.', allergens: ['GF','SO','SE','E'], spice: 1 },
        { kind: 'dish', name: 'Pad thai',                price: '$15', desc: 'Rice noodles, shrimp, tamarind, peanut, lime, bean sprout.', allergens: ['GF','SF','E','N','SO'] },
        { kind: 'dish', name: 'Mapo tofu',               price: '$14', desc: 'Sichuan peppercorn, fermented bean, tofu, ground pork.', allergens: ['GF','SO'], spice: 3 },
        { kind: 'dish', name: 'Vegetable stir-fry',      price: '$13', desc: 'Wok-fired greens, mushroom, garlic, tamari, sesame.', allergens: ['VG','GF','SO','SE'] },
        { kind: 'section', name: 'Sweets + drinks' },
        { kind: 'dish', name: 'Mochi ice cream',         price: '$8',  desc: 'Three pieces · matcha, mango, black sesame.', allergens: ['VG','GL','SE','N'] },
        { kind: 'dish', name: 'Hot jasmine tea',         price: '$5',  desc: 'Fragrant pearl jasmine, refillable.', allergens: ['V','GF'] }
      ]
    },

    'japanese-izakaya': {
      label_en: 'Japanese / izakaya', label_es: 'Japonesa / izakaya',
      hint_en: '4 sections · 14 dishes · izakaya-lantern theme',
      hint_es: '4 secciones · 14 platos · tema izakaya-lantern',
      themeHint: 'izakaya-lantern',
      rows: [
        { kind: 'section', name: 'Otsumami · small bites' },
        { kind: 'dish', name: 'Edamame',                 price: '$7',  desc: 'Steamed soybean pods, sea salt.', allergens: ['V','GF','SO'] },
        { kind: 'dish', name: 'Agedashi tofu',           price: '$9',  desc: 'Lightly fried silken tofu, dashi broth, daikon, scallion.', allergens: ['VG','GF','SO','F','SE'] },
        { kind: 'dish', name: 'Karaage',                 price: '$11', desc: 'Marinated chicken thigh, potato starch, lemon, kewpie.', allergens: ['GL','SO','E'] },
        { kind: 'section', name: 'Yakitori · skewers (2 per order)' },
        { kind: 'dish', name: 'Negima',                  price: '$8',  desc: 'Chicken thigh + scallion, tare glaze.', allergens: ['GF','SO','SE'] },
        { kind: 'dish', name: 'Tsukune',                 price: '$8',  desc: 'Chicken meatball, raw egg yolk dip.', allergens: ['GF','SO','E','SE'] },
        { kind: 'dish', name: 'Shiitake',                price: '$7',  desc: 'Charred mushroom, yuzu kosho, sea salt.', allergens: ['VG','GF','SO'] },
        { kind: 'section', name: 'Mains · noodles + rice' },
        { kind: 'dish', name: 'Shoyu ramen',             price: '$17', desc: 'Twelve-hour pork-chicken broth, chashu, ajitama, menma, nori.', allergens: ['GL','E','SO','SE'] },
        { kind: 'dish', name: 'Tonkotsu ramen',          price: '$18', desc: 'Pork bone broth, chashu, kikurage, scallion, sesame.', allergens: ['GL','E','SO','SE'] },
        { kind: 'dish', name: 'Katsudon',                price: '$16', desc: 'Pork cutlet, egg, onion, dashi, rice.', allergens: ['GL','E','SO'] },
        { kind: 'dish', name: 'Chirashi don',            price: '$24', desc: 'Sashimi over sushi rice — tuna, salmon, hamachi, ikura.', allergens: ['F','SO','SE','GF'] },
        { kind: 'section', name: 'To drink' },
        { kind: 'dish', name: 'Asahi draft',             price: '$7',  desc: 'Japanese rice lager.', allergens: ['V','GL'] },
        { kind: 'dish', name: 'Junmai sake (carafe)',    price: '$22', desc: 'Cold or warm. Ask the bar.', allergens: ['V','GF'] },
        { kind: 'dish', name: 'Yuzu highball',           price: '$13', desc: 'Toki whisky, yuzu, soda.', allergens: ['V','GF'] },
        { kind: 'dish', name: 'Genmaicha',               price: '$5',  desc: 'Roasted brown rice + green tea, refillable.', allergens: ['V','GF'] }
      ]
    },

    'korean-bbq': {
      label_en: 'Korean / BBQ counter', label_es: 'Coreana / BBQ',
      hint_en: '4 sections · 14 dishes · korean-bbq-counter theme',
      hint_es: '4 secciones · 14 platos · tema korean-bbq-counter',
      themeHint: 'korean-bbq-counter',
      rows: [
        { kind: 'section', name: 'Banchan · always with the meal' },
        { kind: 'dish', name: 'Kimchi',                  price: '',    desc: 'Aged napa cabbage, gochugaru, fish sauce.', allergens: ['F','GF','DF'], spice: 2 },
        { kind: 'dish', name: 'Kongnamul',               price: '',    desc: 'Soybean sprout, sesame oil, garlic.', allergens: ['V','GF','SO','SE'] },
        { kind: 'dish', name: 'Oi muchim',               price: '',    desc: 'Spicy cucumber, gochugaru, garlic, sesame.', allergens: ['V','GF','SE'], spice: 1 },
        { kind: 'section', name: 'Grill · charcoal table-side' },
        { kind: 'dish', name: 'Galbi',                   price: '$32', desc: 'Marinated short rib, lettuce wraps, ssamjang.', allergens: ['GF','SO','SE','GL'] },
        { kind: 'dish', name: 'Bulgogi',                 price: '$26', desc: 'Marinated rib eye, scallion, garlic, sesame.', allergens: ['GF','SO','SE'] },
        { kind: 'dish', name: 'Samgyeopsal',             price: '$24', desc: 'Thick-cut pork belly, salted sesame oil dip.', allergens: ['GF','SO','SE','DF'] },
        { kind: 'dish', name: 'Dak galbi',               price: '$22', desc: 'Spicy gochujang chicken, cabbage, sweet potato.', allergens: ['GF','SO','SE'], spice: 2 },
        { kind: 'section', name: 'Stews + rice' },
        { kind: 'dish', name: 'Sundubu jjigae',          price: '$16', desc: 'Soft tofu stew, clam, egg, gochugaru, served boiling.', allergens: ['F','SF','SO','GF','E'], spice: 2 },
        { kind: 'dish', name: 'Bibimbap',                price: '$16', desc: 'Stone-bowl rice, beef, vegetables, gochujang, fried egg.', allergens: ['GF','SO','SE','E'], spice: 1 },
        { kind: 'dish', name: 'Naengmyeon',              price: '$15', desc: 'Cold buckwheat noodle, beef broth, cucumber, pear.', allergens: ['GL','E','SO','SE'] },
        { kind: 'section', name: 'Drinks + sweet' },
        { kind: 'dish', name: 'Soju (bottle)',           price: '$14', desc: 'Jinro green bottle, served chilled.', allergens: ['V','GF'] },
        { kind: 'dish', name: 'Hite draft',              price: '$7',  desc: 'Korean lager, draft.', allergens: ['V','GL'] },
        { kind: 'dish', name: 'Makgeolli',               price: '$11', desc: 'Unfiltered rice wine, lightly sweet, sparkling.', allergens: ['V','GF'] },
        { kind: 'dish', name: 'Patbingsu',               price: '$10', desc: 'Shaved ice, sweet red bean, condensed milk, mochi.', allergens: ['VG','GL'] }
      ]
    },

    'chinese-dimsum': {
      label_en: 'Chinese / dim sum', label_es: 'China / dim sum',
      hint_en: '4 sections · 14 dishes · dim-sum-rose theme',
      hint_es: '4 secciones · 14 platos · tema dim-sum-rose',
      themeHint: 'dim-sum-rose',
      rows: [
        { kind: 'section', name: 'Steamed' },
        { kind: 'dish', name: 'Har gow',                 price: '$9',  desc: 'Crystal shrimp dumpling, four pieces.', allergens: ['SF','GL','SE'] },
        { kind: 'dish', name: 'Siu mai',                 price: '$8',  desc: 'Pork-shrimp dumpling, roe topping.', allergens: ['SF','GL','SE','E'] },
        { kind: 'dish', name: 'Char siu bao',            price: '$8',  desc: 'BBQ pork bun, three pieces.', allergens: ['GL','SO','SE'] },
        { kind: 'dish', name: 'Lo mai gai',              price: '$10', desc: 'Sticky rice + chicken in lotus leaf.', allergens: ['SO','GL'] },
        { kind: 'section', name: 'Fried + roasted' },
        { kind: 'dish', name: 'Spring rolls',            price: '$7',  desc: 'Pork + vegetable, sweet-chili dip.', allergens: ['VG','GL','SO'] },
        { kind: 'dish', name: 'Char siu',                price: '$14', desc: 'Cantonese roast pork, hoisin glaze, scallion.', allergens: ['GF','SO','SE'] },
        { kind: 'dish', name: 'Salt + pepper squid',     price: '$13', desc: 'Wok-tossed, white pepper, scallion, garlic.', allergens: ['M','GL'], spice: 1 },
        { kind: 'section', name: 'Noodles + rice' },
        { kind: 'dish', name: 'Mapo tofu',               price: '$14', desc: 'Sichuan peppercorn, fermented bean, ground pork.', allergens: ['GF','SO'], spice: 3 },
        { kind: 'dish', name: 'Dan dan noodles',         price: '$13', desc: 'Hand-pulled noodle, chili oil, peanut, sesame, ground pork.', allergens: ['GL','N','SE','SO'], spice: 2 },
        { kind: 'dish', name: 'Yangzhou fried rice',     price: '$12', desc: 'Egg, shrimp, char siu, scallion.', allergens: ['SF','E','SO'] },
        { kind: 'dish', name: 'Beef chow fun',           price: '$15', desc: 'Wide rice noodle, beef, scallion, bean sprout.', allergens: ['GF','SO','SE'] },
        { kind: 'section', name: 'Sweets' },
        { kind: 'dish', name: 'Egg tarts',               price: '$6',  desc: 'Three pieces, flaky pastry, egg custard.', allergens: ['VG','GL','E'] },
        { kind: 'dish', name: 'Mango pudding',           price: '$7',  desc: 'Fresh mango, evaporated milk.', allergens: ['VG'] },
        { kind: 'dish', name: 'Black sesame tang yuan',  price: '$8',  desc: 'Glutinous rice ball, black sesame paste, ginger broth.', allergens: ['VG','GL','SE'] }
      ]
    },

    'vietnamese-thai': {
      label_en: 'Vietnamese / Thai', label_es: 'Vietnamita / tailandesa',
      hint_en: '4 sections · 13 dishes · asian-table theme',
      hint_es: '4 secciones · 13 platos · tema asian-table',
      themeHint: 'asian-table',
      rows: [
        { kind: 'section', name: 'Rolls + starters' },
        { kind: 'dish', name: 'Gỏi cuốn',                price: '$8',  desc: 'Fresh shrimp + pork rolls, peanut-hoisin dip.', allergens: ['SF','N','SO'] },
        { kind: 'dish', name: 'Bánh xèo',                price: '$13', desc: 'Crispy turmeric crêpe, shrimp, pork, bean sprout, herbs.', allergens: ['SF','GF','GL'] },
        { kind: 'dish', name: 'Som tum',                 price: '$11', desc: 'Green papaya salad, peanut, lime, bird chili.', allergens: ['V','GF','N','F'], spice: 3 },
        { kind: 'section', name: 'Pho + noodles' },
        { kind: 'dish', name: 'Phở bò',                  price: '$15', desc: 'Twelve-hour beef broth, rice noodle, brisket, rare steak, herbs.', allergens: ['GF','DF'] },
        { kind: 'dish', name: 'Phở gà',                  price: '$14', desc: 'Chicken broth, rice noodle, poached chicken, scallion.', allergens: ['GF','DF'] },
        { kind: 'dish', name: 'Bún chả',                 price: '$14', desc: 'Grilled pork, rice vermicelli, herbs, nuoc cham.', allergens: ['GF','F','SO'] },
        { kind: 'dish', name: 'Pad thai',                price: '$15', desc: 'Rice noodle, shrimp, tamarind, peanut, lime, bean sprout.', allergens: ['GF','SF','E','N','SO','F'] },
        { kind: 'dish', name: 'Pad see ew',              price: '$14', desc: 'Wide rice noodle, Chinese broccoli, egg, dark soy.', allergens: ['GF','E','SO'] },
        { kind: 'section', name: 'Curries + rice' },
        { kind: 'dish', name: 'Green curry chicken',     price: '$16', desc: 'Coconut curry, Thai basil, eggplant, jasmine rice.', allergens: ['GF','DF','F'], spice: 2 },
        { kind: 'dish', name: 'Massaman curry',          price: '$17', desc: 'Beef, potato, peanut, cinnamon, jasmine rice.', allergens: ['GF','DF','N','F'], spice: 1 },
        { kind: 'dish', name: 'Cơm tấm sườn',            price: '$15', desc: 'Broken rice, grilled pork chop, fried egg, scallion oil.', allergens: ['GF','E','F','SO'] },
        { kind: 'section', name: 'Drinks + sweet' },
        { kind: 'dish', name: 'Cà phê sữa đá',           price: '$5',  desc: 'Vietnamese drip coffee, sweetened condensed milk, ice.', allergens: ['VG','GF'] },
        { kind: 'dish', name: 'Mango sticky rice',       price: '$9',  desc: 'Glutinous rice, coconut cream, ripe mango.', allergens: ['V','GF'] }
      ]
    },

    'filipino-feast': {
      label_en: 'Filipino / kamayan', label_es: 'Filipina / kamayan',
      hint_en: '4 sections · 13 dishes · filipino-feast theme',
      hint_es: '4 secciones · 13 platos · tema filipino-feast',
      themeHint: 'filipino-feast',
      rows: [
        { kind: 'section', name: 'Pulutan · small bites' },
        { kind: 'dish', name: 'Lumpiang Shanghai',       price: '$9',  desc: 'Crispy pork rolls, banana ketchup.', allergens: ['GL','SO','E'] },
        { kind: 'dish', name: 'Sisig',                   price: '$15', desc: 'Pork cheek + ear, calamansi, chili, raw egg.', allergens: ['GF','E','SO'], spice: 2 },
        { kind: 'dish', name: 'Tokwa\'t baboy',          price: '$11', desc: 'Crispy tofu + pork belly, soy-vinegar.', allergens: ['SO','GF'] },
        { kind: 'section', name: 'Mains' },
        { kind: 'dish', name: 'Chicken adobo',           price: '$18', desc: 'Soy-vinegar braise, garlic, bay, peppercorn, jasmine rice.', allergens: ['GF','SO'] },
        { kind: 'dish', name: 'Lechon kawali',           price: '$22', desc: 'Crispy deep-fried pork belly, liver sauce, atchara.', allergens: ['SO','GF'] },
        { kind: 'dish', name: 'Kare-kare',               price: '$24', desc: 'Oxtail + tripe in peanut stew, eggplant, bagoong on the side.', allergens: ['N','F','SF','GF'] },
        { kind: 'dish', name: 'Sinigang na hipon',       price: '$19', desc: 'Sour tamarind broth, shrimp, kangkong, eggplant.', allergens: ['SF','GF','DF'], spice: 1 },
        { kind: 'dish', name: 'Pancit palabok',          price: '$15', desc: 'Rice noodle, shrimp sauce, hard egg, chicharron.', allergens: ['SF','GF','E'] },
        { kind: 'section', name: 'Kamayan · feast (2-4 ppl)' },
        { kind: 'dish', name: 'Boodle fight (2)',        price: '$58', desc: 'Banana-leaf spread: lechon kawali, grilled tilapia, longganisa, salted egg, atchara, rice. Eaten by hand.', allergens: ['F','E','SF','SO','GF'] },
        { kind: 'dish', name: 'Boodle fight (4)',        price: '$108',desc: 'Family-size boodle fight. Reserve 24 hr ahead.', allergens: ['F','E','SF','SO','GF'] },
        { kind: 'section', name: 'Sweets' },
        { kind: 'dish', name: 'Halo-halo',               price: '$11', desc: 'Shaved ice, sweet beans, ube, leche flan, evap milk.', allergens: ['VG','GL','E'] },
        { kind: 'dish', name: 'Bibingka',                price: '$9',  desc: 'Rice cake, salted egg, coconut, banana leaf.', allergens: ['VG','GF','E'] },
        { kind: 'dish', name: 'Turon',                   price: '$7',  desc: 'Banana + jackfruit lumpia, caramelized sugar.', allergens: ['VG','GL'] }
      ]
    },

    'indian-regional': {
      label_en: 'Indian / regional', label_es: 'India / regional',
      hint_en: '4 sections · 14 dishes · modern-indian theme',
      hint_es: '4 secciones · 14 platos · tema modern-indian',
      themeHint: 'modern-indian',
      rows: [
        { kind: 'section', name: 'Chaat + starters' },
        { kind: 'dish', name: 'Pani puri',               price: '$10', desc: 'Six crisp shells, mint-tamarind water, chickpea, potato.', allergens: ['V','GL'], spice: 1 },
        { kind: 'dish', name: 'Samosa chaat',            price: '$11', desc: 'Two samosas, yogurt, chutneys, sev, pomegranate.', allergens: ['VG','GL','MU'], spice: 1 },
        { kind: 'dish', name: 'Pakora platter',          price: '$10', desc: 'Onion + spinach + paneer fritters, mint chutney.', allergens: ['VG','GL'] },
        { kind: 'section', name: 'Tandoor' },
        { kind: 'dish', name: 'Tandoori chicken',        price: '$22', desc: 'Bone-in chicken, yogurt-spice marinade, charcoal-fired.', allergens: ['VG','GF','MU'], spice: 1 },
        { kind: 'dish', name: 'Seekh kebab',             price: '$20', desc: 'Spiced lamb skewers, mint-yogurt, onion-lime salad.', allergens: ['VG','GF','MU'], spice: 2 },
        { kind: 'dish', name: 'Paneer tikka',            price: '$18', desc: 'Marinated paneer, bell pepper, onion, charred.', allergens: ['VG','GF','MU'], spice: 1 },
        { kind: 'section', name: 'Curries + rice' },
        { kind: 'dish', name: 'Butter chicken',          price: '$21', desc: 'Tandoor chicken in tomato-cream-fenugreek sauce.', allergens: ['VG','GF','N','MU'], spice: 1 },
        { kind: 'dish', name: 'Lamb rogan josh',         price: '$24', desc: 'Kashmiri lamb curry, ginger, fennel, basmati.', allergens: ['GF','MU','N'], spice: 2 },
        { kind: 'dish', name: 'Chana masala',            price: '$16', desc: 'Chickpea curry, ginger-tomato, amchur, basmati.', allergens: ['V','GF','MU'], spice: 1 },
        { kind: 'dish', name: 'Saag paneer',             price: '$18', desc: 'Spinach-mustard-greens, fresh paneer cubes, basmati.', allergens: ['VG','GF','MU'] },
        { kind: 'dish', name: 'Hyderabadi biryani',      price: '$22', desc: 'Layered basmati, lamb or chicken, saffron, fried onion.', allergens: ['GF','MU','N'], spice: 2 },
        { kind: 'section', name: 'Breads + drinks + sweets' },
        { kind: 'dish', name: 'Garlic naan',             price: '$5',  desc: 'Tandoor-baked, garlic-cilantro butter.', allergens: ['VG','GL','E'] },
        { kind: 'dish', name: 'Mango lassi',             price: '$6',  desc: 'Yogurt, alphonso mango, cardamom.', allergens: ['VG','GF'] },
        { kind: 'dish', name: 'Gulab jamun',             price: '$7',  desc: 'Two warm milk-solid dumplings in cardamom-rose syrup.', allergens: ['VG','GL','N'] }
      ]
    },

    'levantine-mezze': {
      label_en: 'Middle Eastern / mezze', label_es: 'Medio Oriente / mezze',
      hint_en: '4 sections · 14 dishes · levantine-mezze theme',
      hint_es: '4 secciones · 14 platos · tema levantine-mezze',
      themeHint: 'levantine-mezze',
      rows: [
        { kind: 'section', name: 'Cold mezze' },
        { kind: 'dish', name: 'Hummus',                  price: '$10', desc: 'Stone-ground chickpea, tahini, lemon, olive oil, warm pita.', allergens: ['V','GL','SE'] },
        { kind: 'dish', name: 'Baba ghanouj',            price: '$11', desc: 'Charred eggplant, tahini, garlic, lemon, pomegranate.', allergens: ['V','SE','GL'] },
        { kind: 'dish', name: 'Tabbouleh',               price: '$10', desc: 'Parsley, bulgur, tomato, mint, lemon, olive oil.', allergens: ['V','GL'] },
        { kind: 'dish', name: 'Labneh',                  price: '$9',  desc: 'Strained yogurt, za\'atar, olive oil, warm pita.', allergens: ['VG','GL','SE'] },
        { kind: 'section', name: 'Hot mezze' },
        { kind: 'dish', name: 'Falafel',                 price: '$10', desc: 'Six fritters, tahini, pickled turnip, parsley.', allergens: ['V','SE','GL'] },
        { kind: 'dish', name: 'Kibbeh',                  price: '$13', desc: 'Bulgur shells, spiced lamb-pine nut filling, four pieces.', allergens: ['GL','N'], spice: 1 },
        { kind: 'dish', name: 'Halloumi',                price: '$12', desc: 'Grilled cheese, watermelon, mint, lime, sumac.', allergens: ['VG','GF'] },
        { kind: 'dish', name: 'Sambousek',               price: '$11', desc: 'Three savory pastries — beef, spinach, cheese.', allergens: ['VG','GL','E'] },
        { kind: 'section', name: 'Off the grill' },
        { kind: 'dish', name: 'Lamb shawarma',           price: '$22', desc: 'Vertically spit-roasted, garlic toum, pickles, pita.', allergens: ['GL','SE'] },
        { kind: 'dish', name: 'Chicken shish tawook',    price: '$20', desc: 'Yogurt-marinated, lemon, garlic, charcoal grill.', allergens: ['VG','GF'] },
        { kind: 'dish', name: 'Kafta kebab',             price: '$21', desc: 'Spiced lamb-beef, parsley, onion, sumac, pita.', allergens: ['GL','SE'], spice: 1 },
        { kind: 'dish', name: 'Whole branzino',          price: '$32', desc: 'Salt-baked, lemon, parsley, tahini.', allergens: ['F','GF','SE'] },
        { kind: 'section', name: 'Sweets + drinks' },
        { kind: 'dish', name: 'Baklava',                 price: '$8',  desc: 'Pistachio-walnut, rose-orange blossom syrup.', allergens: ['VG','GL','N'] },
        { kind: 'dish', name: 'Turkish coffee',          price: '$5',  desc: 'Cardamom, sugar to taste.', allergens: ['V','GF'] }
      ]
    },

    'ethiopian': {
      label_en: 'Ethiopian / Eritrean', label_es: 'Etíope / eritrea',
      hint_en: '3 sections · 12 dishes · communal-platter style',
      hint_es: '3 secciones · 12 platos · estilo plato comunal',
      themeHint: 'asian-table',
      rows: [
        { kind: 'section', name: 'Wat · stews (served on injera)' },
        { kind: 'dish', name: 'Doro wat',                price: '$22', desc: 'Slow-simmered chicken, berbere, hard-boiled egg, niter kibbeh.', allergens: ['VG','E','GF'], spice: 2 },
        { kind: 'dish', name: 'Yebeg wat',               price: '$23', desc: 'Lamb, berbere, niter kibbeh, served bubbling.', allergens: ['VG','GF'], spice: 2 },
        { kind: 'dish', name: 'Siga tibs',               price: '$21', desc: 'Sautéed beef cubes, rosemary, jalapeño, onion.', allergens: ['VG','GF'], spice: 1 },
        { kind: 'dish', name: 'Kitfo',                   price: '$24', desc: 'Hand-minced raw beef, mitmita, niter kibbeh, ayib cheese.', allergens: ['VG','GF'], spice: 2 },
        { kind: 'section', name: 'Yetsom · vegetarian' },
        { kind: 'dish', name: 'Misir wat',               price: '$13', desc: 'Red lentil, berbere, garlic-ginger.', allergens: ['V','GF'], spice: 2 },
        { kind: 'dish', name: 'Shiro',                   price: '$13', desc: 'Ground chickpea-fava stew, berbere, finishing oil.', allergens: ['V','GF'], spice: 1 },
        { kind: 'dish', name: 'Gomen',                   price: '$12', desc: 'Collard greens, garlic, ginger, jalapeño.', allergens: ['V','GF'] },
        { kind: 'dish', name: 'Atakilt',                 price: '$12', desc: 'Cabbage, carrot, potato, turmeric, ginger.', allergens: ['V','GF'] },
        { kind: 'dish', name: 'Veggie combo',            price: '$22', desc: 'Three of misir, shiro, gomen, atakilt, ater kik on injera.', allergens: ['V','GF'] },
        { kind: 'section', name: 'Drinks + finish' },
        { kind: 'dish', name: 'Coffee ceremony',         price: '$12', desc: 'Roasted-to-order beans, three rounds, popcorn.', allergens: ['V','GF'] },
        { kind: 'dish', name: 'Tej',                     price: '$8',  desc: 'Honey wine, cool, slightly sparkling.', allergens: ['V','GF'] },
        { kind: 'dish', name: 'Hibiscus tea',            price: '$5',  desc: 'Cold-steeped, lightly sweet.', allergens: ['V','GF'] }
      ]
    }
  };

  function list() { return Object.keys(TEMPLATES); }
  function get(key) { return TEMPLATES[key] || null; }

  var api = {
    TEMPLATES: TEMPLATES,
    list:      list,
    get:       get
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_TEMPLATES = api;
})(typeof window !== 'undefined' ? window : null);
