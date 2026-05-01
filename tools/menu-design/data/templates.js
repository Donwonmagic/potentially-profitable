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
