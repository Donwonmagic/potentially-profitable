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
