/**
 * Cost Index — Vendor Benchmark ingredient-picker manifest. GENERATED — do not edit by hand.
 *
 * Written by scripts/build-cost-index-picker.mjs from data/cost-index.js (the browser
 * seed) joined with scripts/lib/cost-index-categories.mjs (the shared category taxonomy).
 * Sets window.MUNTIN_CI_PICKER to an object:
 *   { _doc, count, dollarRefCount,
 *     groups: [{ key, label_en, label_es }]   // display order, populated groups only
 *     items:  [{ key, label_en, label_es, unit_en, unit_es, group, dollarRef }] }
 * `group` is the ingredient's Cost Index category; group LABELS come from the shared
 * taxonomy (1:1 with the category pages); `dollarRef` is true only when the reference
 * carries a firm dollar level (see tools/_shared/cost-index-lookup.js). Loaded eagerly
 * (first paint) so the ingredient picker can render before the ~1MB compute seed lazy-loads.
 * Guarded by scripts/check-cost-index-picker.mjs (length/keys/labels/group/dollarRef/groups).
 */
(function (root) {
  'use strict';
  var DATA = {
  "_doc": "Vendor Benchmark ingredient picker: the honest list of what the tool can benchmark, derived from the browser seed + the shared category taxonomy. 81 ingredient(s); 21 carry a firm dollar reference.",
  "count": 81,
  "dollarRefCount": 21,
  "groups": [
    {"key":"beef","label_en":"Beef","label_es":"Res"},
    {"key":"poultry","label_en":"Poultry","label_es":"Aves"},
    {"key":"pork","label_en":"Pork","label_es":"Cerdo"},
    {"key":"produce","label_en":"Produce","label_es":"Frutas y verduras"},
    {"key":"dairy-eggs","label_en":"Dairy & eggs","label_es":"Lácteos y huevo"}
  ],
  "items": [
    {"key":"beef-tenderloin","label_en":"Beef tenderloin","label_es":"Lomo fino de res","unit_en":"lb","unit_es":"libra","group":"beef","dollarRef":true},
    {"key":"ground-beef","label_en":"Ground beef","label_es":"Carne molida de res","unit_en":"lb","unit_es":"libra","group":"beef","dollarRef":false},
    {"key":"ribeye","label_en":"Ribeye","label_es":"Ribeye (bife ancho)","unit_en":"lb","unit_es":"libra","group":"beef","dollarRef":true},
    {"key":"short-rib","label_en":"Short rib","label_es":"Costilla corta de res","unit_en":"lb","unit_es":"libra","group":"beef","dollarRef":true},
    {"key":"chicken-breast","label_en":"Chicken breast (boneless)","label_es":"Pechuga de pollo (sin hueso)","unit_en":"lb","unit_es":"libra","group":"poultry","dollarRef":true},
    {"key":"chicken-thigh","label_en":"Chicken thigh","label_es":"Muslo de pollo","unit_en":"lb","unit_es":"libra","group":"poultry","dollarRef":true},
    {"key":"whole-chicken","label_en":"Whole chicken","label_es":"Pollo entero","unit_en":"lb","unit_es":"libra","group":"poultry","dollarRef":true},
    {"key":"whole-turkey","label_en":"Whole turkey","label_es":"Pavo entero","unit_en":"lb","unit_es":"libra","group":"poultry","dollarRef":true},
    {"key":"pork-loin","label_en":"Pork loin","label_es":"Lomo de cerdo","unit_en":"lb","unit_es":"libra","group":"pork","dollarRef":true},
    {"key":"pork-shoulder","label_en":"Pork shoulder","label_es":"Espaldilla de cerdo","unit_en":"lb","unit_es":"libra","group":"pork","dollarRef":true},
    {"key":"acorn-squash","label_en":"Acorn squash","label_es":"Calabaza bellota","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"apple","label_en":"Apples","label_es":"Manzana","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"artichoke","label_en":"Artichoke","label_es":"Alcachofa","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"asparagus","label_en":"Asparagus","label_es":"Espárragos","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"avocado","label_en":"Avocado","label_es":"Aguacate","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"banana","label_en":"Bananas","label_es":"Plátano","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"basil","label_en":"Basil","label_es":"Albahaca","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"beet","label_en":"Beet","label_es":"Remolacha","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":true},
    {"key":"bell-pepper","label_en":"Bell pepper","label_es":"Pimiento morrón","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":true},
    {"key":"blueberry","label_en":"Blueberries","label_es":"Arándano azul","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"bok-choy","label_en":"Bok choy","label_es":"Bok choy","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"broccoli","label_en":"Broccoli","label_es":"Brócoli","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"brussels-sprouts","label_en":"Brussels sprouts","label_es":"Coles de Bruselas","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"butter-lettuce","label_en":"Butter lettuce","label_es":"Lechuga mantequilla (Boston)","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"butternut-squash","label_en":"Butternut squash","label_es":"Calabaza moscada","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"button-mushroom","label_en":"Button mushroom","label_es":"Champiñón","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"cabbage","label_en":"Cabbage","label_es":"Repollo","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"cantaloupe","label_en":"Cantaloupe","label_es":"Melón cantalupo","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"carrot","label_en":"Carrot","label_es":"Zanahoria","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"cauliflower","label_en":"Cauliflower","label_es":"Coliflor","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"celery","label_en":"Celery","label_es":"Apio","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"cherry-tomato","label_en":"Cherry tomatoes","label_es":"Jitomate cherry","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":true},
    {"key":"cilantro","label_en":"Cilantro","label_es":"Cilantro","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"collard-greens","label_en":"Collard greens","label_es":"Berza (collard)","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"corn-on-the-cob","label_en":"Corn on the cob","label_es":"Elote (mazorca)","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"cucumber","label_en":"Cucumber","label_es":"Pepino","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":true},
    {"key":"daikon","label_en":"Daikon radish","label_es":"Rábano daikon","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"dill","label_en":"Dill","label_es":"Eneldo","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"eggplant","label_en":"Eggplant","label_es":"Berenjena","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":true},
    {"key":"garlic","label_en":"Garlic","label_es":"Ajo","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"ginger","label_en":"Ginger root","label_es":"Jengibre","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"grapefruit","label_en":"Grapefruit","label_es":"Toronja","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":true},
    {"key":"green-beans","label_en":"Green beans","label_es":"Ejotes","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"green-leaf-lettuce","label_en":"Green leaf lettuce","label_es":"Lechuga hoja verde","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"green-onion","label_en":"Green onion","label_es":"Cebollín","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"habanero-pepper","label_en":"Habanero pepper","label_es":"Chile habanero","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"iceberg-lettuce","label_en":"Iceberg lettuce","label_es":"Lechuga iceberg","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"jalapeno","label_en":"Jalapeño","label_es":"Chile jalapeño","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"kale","label_en":"Kale","label_es":"Col rizada (kale)","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"leek","label_en":"Leek","label_es":"Puerro","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"lemon","label_en":"Lemon","label_es":"Limón amarillo","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":true},
    {"key":"lime","label_en":"Lime","label_es":"Limón","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"mint","label_en":"Mint","label_es":"Menta","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"napa-cabbage","label_en":"Napa cabbage","label_es":"Col napa","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"okra","label_en":"Okra","label_es":"Quimbombó","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"onion","label_en":"Onions","label_es":"Cebolla","unit_en":"sack","unit_es":"saco","group":"produce","dollarRef":false},
    {"key":"oregano","label_en":"Oregano","label_es":"Orégano","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"parsley","label_en":"Parsley","label_es":"Perejil","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"pear","label_en":"Pears","label_es":"Pera","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"pineapple","label_en":"Pineapple","label_es":"Piña","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"poblano-pepper","label_en":"Poblano pepper","label_es":"Chile poblano","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"raspberry","label_en":"Raspberries","label_es":"Frambuesa","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"red-leaf-lettuce","label_en":"Red leaf lettuce","label_es":"Lechuga hoja roja","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"red-onion","label_en":"Red onion","label_es":"Cebolla roja","unit_en":"sack","unit_es":"saco","group":"produce","dollarRef":false},
    {"key":"red-potato","label_en":"Red potato","label_es":"Papa roja","unit_en":"sack","unit_es":"saco","group":"produce","dollarRef":true},
    {"key":"romaine-lettuce","label_en":"Romaine lettuce","label_es":"Lechuga romana","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"rosemary","label_en":"Rosemary","label_es":"Romero","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"russet-potato","label_en":"Russet potatoes","label_es":"Papa russet","unit_en":"sack","unit_es":"saco","group":"produce","dollarRef":true},
    {"key":"rutabaga","label_en":"Rutabaga","label_es":"Colinabo (rutabaga)","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"serrano-pepper","label_en":"Serrano pepper","label_es":"Chile serrano","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"snow-peas","label_en":"Snow peas","label_es":"Arvejas de nieve","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"spinach","label_en":"Spinach","label_es":"Espinaca","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"sweet-potato","label_en":"Sweet potato","label_es":"Camote","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"tarragon","label_en":"Tarragon","label_es":"Estragón","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"thyme","label_en":"Thyme","label_es":"Tomillo","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"tomato","label_en":"Tomatoes (round)","label_es":"Jitomate (bola)","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"yellow-squash","label_en":"Yellow squash","label_es":"Calabaza amarilla","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"zucchini","label_en":"Zucchini","label_es":"Calabacín","unit_en":"carton","unit_es":"caja","group":"produce","dollarRef":false},
    {"key":"butter","label_en":"Butter (AA, bulk)","label_es":"Mantequilla (AA, a granel)","unit_en":"lb","unit_es":"libra","group":"dairy-eggs","dollarRef":true},
    {"key":"cheddar-cheese","label_en":"Cheddar cheese","label_es":"Queso cheddar","unit_en":"lb","unit_es":"libra","group":"dairy-eggs","dollarRef":true},
    {"key":"eggs","label_en":"Eggs","label_es":"Huevo","unit_en":"dozen","unit_es":"docena","group":"dairy-eggs","dollarRef":true}
  ]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  if (typeof self !== 'undefined') self.MUNTIN_CI_PICKER = DATA;
  if (root) root.MUNTIN_CI_PICKER = DATA;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
