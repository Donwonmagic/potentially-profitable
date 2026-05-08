/**
 * Theme review-board credits (Wave C14).
 *
 * Each of the 37 themes ships with curator metadata: who reviewed it,
 * what real-world restaurant traditions inspired it, and when it
 * landed. Public theme changelog page (/library/themes/) reads this
 * data and surfaces it as the public review board.
 *
 * The contract: every theme in themes.js MUST have a matching entry
 * here, validated by scripts/check-themes-metadata.mjs as a CI gate.
 *
 * Why we ship this: Canva's themes are stock — un-credited, un-
 * reviewed, generic. Ours are curated by a named human and traceable
 * to actual restaurant traditions. The "Constrained Taste Floor"
 * pillar of the Canva-scaring strategy needs a human accountability
 * layer; this is it.
 *
 * What we don't do: name specific restaurants without permission.
 * The inspiredBy field describes a genre / tradition / cuisine
 * culture — never a specific business. If a real operator wants
 * their place credited, they email don@muntin.digital.
 *
 * exports: MD_THEME_CREDITS on window; module.exports for tests.
 */
(function (root) {
  'use strict';

  // Reviewer is a single person today: the studio's principal.
  var DON = 'Don Won Magic';

  var CREDITS = {
    // ---------- Italian / Mediterranean ----------
    'trattoria': {
      reviewedBy:  DON,
      inspiredBy:  ['Neighborhood Italian shops in the DMV — the ones with red checkered tablecloths and a specials board in chalk'],
      dateAdded:   '2024-08-12',
      story:       'The first theme. Built for the kind of family Italian place where the menu is a single page printed on cream stock, the prices are leader-dotted, and the section names are in small caps. Conservative on purpose — meant to look like it has been there for thirty years.'
    },
    'levantine-mezze': {
      reviewedBy:  DON,
      inspiredBy:  ['Lebanese / Israeli / Palestinian sharing-plate restaurants', 'Greek tavernas with extensive mezze menus', 'Turkish meze bars'],
      dateAdded:   '2026-05-03',
      story:       'Sharing-plate menus run dense — three columns of small dishes that reward dense pricing. The olive-cream paper is a nod to halloumi-and-olives, the terracotta accent to clay tagines.'
    },

    // ---------- French / Bistro ----------
    'brasserie': {
      reviewedBy:  DON,
      inspiredBy:  ['Parisian brasseries (Brasserie Lipp, Le Bouillon Chartier)', 'Old-school New York French bistros'],
      dateAdded:   '2024-08-15',
      story:       'Two columns, ornament dividers, the "old-world serif on warm white" thing. For places that specifically want to telegraph "we do steak frites and proper plats du jour."'
    },
    'bistro-paris': {
      reviewedBy:  DON,
      inspiredBy:  ['Small-plates Paris bistros', 'New-American bistros run by French-trained chefs'],
      dateAdded:   '2024-08-18',
      story:       'Lighter than brasserie. For modern bistros where the menu is shorter, the wine list is longer, and the chalkboard daily-specials section is the actual hero.'
    },

    // ---------- Casual / Quick ----------
    'diner-counter': {
      reviewedBy:  DON,
      inspiredBy:  ['American diners (the Greek-owned-classic kind)', 'Coffee-shop counters with vinyl booths'],
      dateAdded:   '2024-08-20',
      story:       'Two columns, monospaced right-aligned prices, boxed sections. The "two-page laminated diner card" without the lamination.'
    },
    'cafe-counter': {
      reviewedBy:  DON,
      inspiredBy:  ['Third-wave coffee shops', 'European cafés that double as breakfast spots'],
      dateAdded:   '2024-08-22',
      story:       'A daypart-aware theme. The same café has a different menu at 8am vs 2pm; this layout handles the breakfast/lunch split with section breaks instead of separate menus.'
    },
    'pizza-counter': {
      reviewedBy:  DON,
      inspiredBy:  ['NY-style by-the-slice shops', 'Roman pizza al taglio counters'],
      dateAdded:   '2024-08-23',
      story:       'For the pizza shop that needs the slice prices to be readable from across the room AND the whole pies legible up close. Two-column, big-headline display, two-tier pricing built in.'
    },
    'cantina': {
      reviewedBy:  DON,
      inspiredBy:  ['Mexico City taquerias', 'Tex-Mex cantinas in DC and Baltimore'],
      dateAdded:   '2024-08-25',
      story:       'Talavera-tile motif, warm sun palette. For taquerias and cantinas where the menu is 40 dishes deep and section navigation matters more than ornament.'
    },
    'food-truck': {
      reviewedBy:  DON,
      inspiredBy:  ['Food truck windows', 'Food-hall stalls', 'Pop-up kitchens'],
      dateAdded:   '2024-08-27',
      story:       'For when the menu IS the signage. Bebas Neue condensed display, deep amber accent (passes 3:1 against white), monospaced prices. Reads from across the parking lot.'
    },
    'bakery-coffee': {
      reviewedBy:  DON,
      inspiredBy:  ['Morning bakeries with espresso programs', 'French viennoiserie counters'],
      dateAdded:   '2024-08-28',
      story:       'Cocoa accent on flour-cream paper. Two columns because pastries + coffee drinks both deserve density. Hand-rule dividers because handwritten menus are bakery convention.'
    },
    'kids-bright': {
      reviewedBy:  DON,
      inspiredBy:  ['Family restaurants with separate kids menus', 'Diner kids-eat-free programs'],
      dateAdded:   '2024-08-30',
      story:       'Bright cream + warm orange. Designed to be scribbled on with a crayon — the heavy-weight paper variants in this theme list are deliberately scribble-resistant.'
    },
    'deli-counter': {
      reviewedBy:  DON,
      inspiredBy:  ['NY pastrami counters (Katz\'s, Russ & Daughters tradition)', 'Jewish + kosher delis'],
      dateAdded:   '2026-05-03',
      story:       'Gloss white + retro red, condensed signpainter caps. For the operator hand-cutting pastrami at the counter who needs the menu to read like a pastrami counter, not a generic restaurant.'
    },
    'bagel-grid': {
      reviewedBy:  DON,
      inspiredBy:  ['NY-style bagel shops with above-counter pricing cards', 'Schmear bars'],
      dateAdded:   '2026-05-03',
      story:       'Monospaced columns mean the price column lines up perfectly without leader dots — exactly what an above-counter pricing card needs. No ornament; the grid IS the typography.'
    },

    // ---------- Classic / Traditional ----------
    'steakhouse': {
      reviewedBy:  DON,
      inspiredBy:  ['Classic American steakhouses', 'Argentine asadors / parrillas', 'Brazilian churrascaria'],
      dateAdded:   '2024-09-02',
      story:       'Heavy display weight, oxblood accent on cream paper, laurel motif in the corner. Designed to read "this menu has been on this table since 1962."'
    },
    'coastal-raw-bar': {
      reviewedBy:  DON,
      inspiredBy:  ['Oyster bars', 'New England seafood houses', 'Spanish marisquerías'],
      dateAdded:   '2024-09-04',
      story:       'Cool paper with deep ocean accent. Wave motif at the top edge. The seafood-by-the-piece pricing convention is built into priceStyle.'
    },
    'gastropub-oak': {
      reviewedBy:  DON,
      inspiredBy:  ['British gastropubs', 'American craft-beer-focused restaurants'],
      dateAdded:   '2024-09-06',
      story:       'Slate ink, oak accent. For places where the beer list is half the menu and the food side needs to compete for attention without going louder.'
    },
    'tapas-rustic': {
      reviewedBy:  DON,
      inspiredBy:  ['Andalusian tapas bars', 'Basque pintxos counters'],
      dateAdded:   '2024-09-08',
      story:       'Spanish-tile motif, terracotta on bone. Three-column body for the tapas density, ornament dividers between flights.'
    },
    'persian-saffron': {
      reviewedBy:  DON,
      inspiredBy:  ['Persian / Iranian dining rooms', 'Modern Iranian-American restaurants in DC and Bethesda'],
      dateAdded:   '2026-05-03',
      story:       'Saffron-cream paper, indigo accent, eight-pointed star (girih / khatam) motif. A theme operators of high-end Persian restaurants asked for; previously they were defaulting to brasserie or modern-minimal which miss the cultural register.'
    },
    'filipino-feast': {
      reviewedBy:  DON,
      inspiredBy:  ['Filipino kamayan-style restaurants', 'Filipino diaspora restaurants in the DMV'],
      dateAdded:   '2026-05-03',
      story:       'Banana-leaf green paper, bone-cream ink. Generous one-column for the dish-rich menus Filipino kitchens run. New banana-leaf motif honors the kamayan tradition (food served on banana leaves).'
    },
    'room-service-hotel': {
      reviewedBy:  DON,
      inspiredBy:  ['Hotel F&B in-room dining menus', 'Boutique hotel breakfast cards'],
      dateAdded:   '2026-05-03',
      story:       'Cream paper with navy ink and brass accent. Generous descPt because room-service descriptions tend to be longer and more genteel. Time-window tags ("served 6–11am") rendered through the existing availability field.'
    },

    // ---------- Modern / Minimalist ----------
    'modern-minimal': {
      reviewedBy:  DON,
      inspiredBy:  ['Tasting menus that read as poetry', 'Modernist American restaurants'],
      dateAdded:   '2024-09-12',
      story:       'Whitespace dividers, sparse typography, uncolored paper. The "negative-space-as-feature" school. For places where the menu is meant to feel like a poem.'
    },
    'asian-table': {
      reviewedBy:  DON,
      inspiredBy:  ['Pan-Asian restaurants (Vietnamese, Thai, Korean fusion)', 'Modern dim sum houses'],
      dateAdded:   '2024-09-14',
      story:       'Clean grid, minimal ornament. Designed to handle multi-cuisine sections without privileging one tradition over another.'
    },
    'ramen-counter': {
      reviewedBy:  DON,
      inspiredBy:  ['Tokyo ramen counters', 'New York ramen-yas'],
      dateAdded:   '2024-09-15',
      story:       'Single-column, big bowl-name display. Add-on pricing convention (ajitama +$2, etc.) baked into the priceStyle.'
    },
    'plant-forward': {
      reviewedBy:  DON,
      inspiredBy:  ['Vegetarian-by-default restaurants', 'Vegan tasting menus', 'Farm-to-table places'],
      dateAdded:   '2024-09-17',
      story:       'Earthy palette. Uses leaf-cluster motif for the cuisine identity. Whitespace-heavy on the assumption that the dish names do the heavy lifting (Roasted Carrot doesn\'t need a 60-word description).'
    },
    'dim-sum-rose': {
      reviewedBy:  DON,
      inspiredBy:  ['Hong Kong dim sum parlors (the cart-driven kind)', 'Southern Chinese tea-house menus'],
      dateAdded:   '2024-09-19',
      story:       'Rose accent on cream. Designed for the dim-sum dish-by-piece convention — small price column right-aligned, lots of items per page.'
    },
    'modern-indian': {
      reviewedBy:  DON,
      inspiredBy:  ['Contemporary Indian dining rooms', 'Modern Indian-American restaurants'],
      dateAdded:   '2026-05-03',
      story:       'Mughal-paper warm cream, deep green accent, saffron muted, paisley motif. For the operator who wants a contemporary Indian menu that doesn\'t default to amateur Canva templates.'
    },
    'peruvian-coastal': {
      reviewedBy:  DON,
      inspiredBy:  ['Lima cevicherias', 'Nikkei (Japanese-Peruvian) restaurants', 'Pisco bars'],
      dateAdded:   '2026-05-03',
      story:       'Cool stone-grey paper, deep lime accent, Pacific blue muted. Reuses the wave motif because Peruvian coastal cuisine is Pacific-driven.'
    },

    // ---------- Specialty ----------
    'wine-list-formal': {
      reviewedBy:  DON,
      inspiredBy:  ['Formal restaurant wine lists', 'Grand cru cellar lists'],
      dateAdded:   '2024-09-22',
      story:       'Tall narrow paper variants, vintage column, region-organized sections. Grape-cluster motif. Designed to render even very large wine lists (200+ bottles) without paginating awkwardly.'
    },
    'cocktail-deco': {
      reviewedBy:  DON,
      inspiredBy:  ['1920s American cocktail bars', 'Modern speakeasy revival'],
      dateAdded:   '2024-09-24',
      story:       'Deco-fan motif, tight letterspacing, gold accent on indigo paper. For cocktail menus where the drinks are theater.'
    },
    'dessert-only': {
      reviewedBy:  DON,
      inspiredBy:  ['Patisserie counters', 'Dessert-bar specialty menus'],
      dateAdded:   '2024-09-26',
      story:       'Pink rose accent on cream. Smaller h1 because dessert menus tend to be one printed card, not a restaurant menu.'
    },
    'tasting-omakase': {
      reviewedBy:  DON,
      inspiredBy:  ['Japanese omakase counters', 'Modern American tasting menus'],
      dateAdded:   '2024-09-28',
      story:       'Whitespace-only divider, course-numbered single column, brush-stroke motif. The course flow IS the menu structure; no ornament needed.'
    },
    'bbq-smoke': {
      reviewedBy:  DON,
      inspiredBy:  ['Texas barbecue joints', 'Carolina pulled-pork spots', 'Memphis dry-rub places'],
      dateAdded:   '2024-09-30',
      story:       'Charcoal paper, Bebas Neue condensed display, wood-grain motif at the bottom edge. The "BBQ counter joint" that prices by the half-pound.'
    },
    'brewpub-slate': {
      reviewedBy:  DON,
      inspiredBy:  ['Craft brewpubs', 'Beer-hall restaurants'],
      dateAdded:   '2024-10-02',
      story:       'Slate paper, deeper caramel accent (passes contrast). For brewpubs where the beer list deserves the same typographic care as the food list.'
    },
    'izakaya-lantern': {
      reviewedBy:  DON,
      inspiredBy:  ['Tokyo izakayas', 'Late-night sake bars', 'Yakitori counters'],
      dateAdded:   '2026-05-03',
      story:       'Ink-black paper, lantern-red accent, Noto Serif JP for Japanese glyph support. Reads like the actual room: warm light, low ink, one paper lantern overhead.'
    },
    'korean-bbq-counter': {
      reviewedBy:  DON,
      inspiredBy:  ['Tabletop-grill Korean BBQ counters', 'KBBQ restaurants in DC\'s K-town and Annandale'],
      dateAdded:   '2026-05-03',
      story:       'Charcoal paper, flame accent. Two-column protein-cut grid because KBBQ menus are about the cuts, the marinades, and the per-100g pricing — not low-and-slow smoking.'
    },
    'cheese-butcher': {
      reviewedBy:  DON,
      inspiredBy:  ['Fromageries with cheese flights', 'Whole-animal butchers with charcuterie programs'],
      dateAdded:   '2026-05-03',
      story:       'Butcher-paper kraft with slab serif. Pricing-by-weight column because cheese / charcuterie operators sell by 100g, lb, oz — different number formatting than dish menus.'
    },
    'chef-counter': {
      reviewedBy:  DON,
      inspiredBy:  ['Bistro chef\'s counters', 'Small upscale dining-room prix-fixe menus'],
      dateAdded:   '2026-05-03',
      story:       'EB Garamond + Cormorant Garamond, generous white space, pairing-line typography. For chef\'s counters in bistros and upscale dining rooms running prix-fixe nightly.'
    }
  };

  var api = {
    CREDITS: CREDITS,
    get:    function (id) { return CREDITS[id] || null; },
    list:   function ()   { return Object.keys(CREDITS); },
    review: function (id) {
      // Compose a public-facing review-board entry (used by the
      // /library/themes/ page + the picker tooltip).
      var c = CREDITS[id];
      if (!c) return null;
      return {
        themeId:    id,
        reviewedBy: c.reviewedBy,
        inspiredBy: c.inspiredBy.slice(),
        dateAdded:  c.dateAdded,
        story:      c.story
      };
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_THEME_CREDITS = api;
})(typeof window !== 'undefined' ? window : null);
