/**
 * Cost Index — category taxonomy (SHARED source of truth).
 *
 * This module holds the ingredient → category taxonomy in one place so the
 * page generator (scripts/build-cost-index-pages.mjs) and the Vendor Benchmark
 * ingredient-picker manifest (scripts/build-cost-index-picker.mjs) derive an
 * ingredient's `group`/`cat` from the SAME map — they can never silently
 * disagree about which category an ingredient belongs to.
 *
 * Drift guard: the values below are a faithful mirror of the CATEGORIES,
 * CATEGORY_ORDER, and ING_META (cat field) literals still inline in
 * build-cost-index-pages.mjs. scripts/check-cost-index-picker.mjs re-parses
 * those literals from that file and asserts this module equals them EXACTLY,
 * so an edit to either copy fails CI until both agree. When you change a
 * category here, mirror it there (or extract that file's literals to import
 * this module) before the gate will pass.
 *
 * Pure data + a lookup helper. No I/O, no build clock, deterministic.
 */

// The category label map (EN/ES). Seven categories exist in the taxonomy; the
// shippable browser seed (data/cost-index.js) currently populates five of them
// (beef, poultry, pork, produce, dairy-eggs) — seafood + pantry ingredients sit
// below the shippable bar today, but stay in the taxonomy so they can join the
// picker the moment they clear it, with a valid group already assigned.
export const CATEGORIES = {
  beef:       { en: 'Beef',          es: 'Res' },
  poultry:    { en: 'Poultry',       es: 'Aves' },
  pork:       { en: 'Pork',          es: 'Cerdo' },
  seafood:    { en: 'Seafood',       es: 'Pescados y mariscos' },
  produce:    { en: 'Produce',       es: 'Frutas y verduras' },
  'dairy-eggs': { en: 'Dairy & eggs', es: 'Lácteos y huevo' },
  pantry:     { en: 'Pantry',        es: 'Despensa' }
};

// Hub display order, grouped by category.
export const CATEGORY_ORDER = ['beef', 'poultry', 'pork', 'seafood', 'produce', 'dairy-eggs', 'pantry'];

// Per-ingredient category assignment (the `cat` field of ING_META in
// build-cost-index-pages.mjs). Source order preserved so a diff against the
// generator's literal reads cleanly.
export const INGREDIENT_CATEGORY = {
  'ribeye':                'beef',
  'beef-tenderloin':       'beef',
  'chicken-breast':        'poultry',
  'whole-chicken':         'poultry',
  'pork-loin':             'pork',
  'pork-shoulder':         'pork',
  'salmon-fillet':         'seafood',
  'shrimp':                'seafood',
  'romaine-lettuce':       'produce',
  'tomato':                'produce',
  'onion':                 'produce',
  'russet-potato':         'produce',
  'butter':                'dairy-eggs',
  'cheddar-cheese':        'dairy-eggs',
  'eggs':                  'dairy-eggs',
  'vegetable-oil':         'pantry',
  'ground-beef':           'beef',
  'short-rib':             'beef',
  'chicken-thigh':         'poultry',
  'whole-salmon':          'seafood',
  'tuna-loin':             'seafood',
  'bell-pepper':           'produce',
  'garlic':                'produce',
  'avocado':               'produce',
  'lemon':                 'produce',
  'button-mushroom':       'produce',
  'cucumber':              'produce',
  'broccoli':              'produce',
  'cauliflower':           'produce',
  'spinach':               'produce',
  'asparagus':             'produce',
  'carrot':                'produce',
  'corn-on-the-cob':       'produce',
  'kale':                  'produce',
  'basil':                 'produce',
  'cilantro':              'produce',
  'sweet-potato':          'produce',
  'lime':                  'produce',
  'pineapple':             'produce',
  'whole-lobster':         'seafood',
  'celery':                'produce',
  'cabbage':               'produce',
  'eggplant':              'produce',
  'zucchini':              'produce',
  'beet':                  'produce',
  'leek':                  'produce',
  'ginger':                'produce',
  'yellow-squash':         'produce',
  'jalapeno':              'produce',
  'green-onion':           'produce',
  'green-beans':           'produce',
  'parsley':               'produce',
  'brussels-sprouts':      'produce',
  'butternut-squash':      'produce',
  'iceberg-lettuce':       'produce',
  'bok-choy':              'produce',
  'artichoke':             'produce',
  'okra':                  'produce',
  'snow-peas':             'produce',
  'butter-lettuce':        'produce',
  'green-leaf-lettuce':    'produce',
  'red-leaf-lettuce':      'produce',
  'collard-greens':        'produce',
  'napa-cabbage':          'produce',
  'rutabaga':              'produce',
  'daikon':                'produce',
  'cherry-tomato':         'produce',
  'acorn-squash':          'produce',
  'serrano-pepper':        'produce',
  'poblano-pepper':        'produce',
  'habanero-pepper':       'produce',
  'mint':                  'produce',
  'rosemary':              'produce',
  'thyme':                 'produce',
  'oregano':               'produce',
  'tarragon':              'produce',
  'dill':                  'produce',
  'red-onion':             'produce',
  'red-potato':            'produce',
  'grapefruit':            'produce',
  'apple':                 'produce',
  'pear':                  'produce',
  'banana':                'produce',
  'watermelon':            'produce',
  'cantaloupe':            'produce',
  'blueberry':             'produce',
  'raspberry':             'produce',
  'whole-turkey':          'poultry',
  'whole-halibut':         'seafood',
  'whole-trout':           'seafood',
  'scallops':              'seafood',
  'whole-crab':            'seafood',
  'octopus':               'seafood',
  'salmon-skin-on-fillet': 'seafood'
};

// The category key for an ingredient, or null when it isn't in the taxonomy.
export function categoryOf(key) {
  return Object.prototype.hasOwnProperty.call(INGREDIENT_CATEGORY, key)
    ? INGREDIENT_CATEGORY[key]
    : null;
}
