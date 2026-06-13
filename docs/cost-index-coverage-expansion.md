# Cost Index — coverage expansion map (breadth panel, 2026-06-13)

Output of the 5-cartographer breadth panel + what's been executed. The rule
throughout: **no ingredient ships a yield without a sourced CIA `YIELD_TABLE`
key** (or an explicit `yield_source`). Zero invented numbers.

## Shipped (waves 4a + 4b — 47 new yield pages, 71 → 118)

All read their yield straight from the cited `YIELD_TABLE`; `check-ingredient-yields.mjs`
enforces the match. Pages render the sourced yield + AP→EP math now; each one's
**market read is dormant until a price source is verified** (founder pass).

- **4a produce/herb/fruit (30):** butter/green-leaf/red-leaf lettuce, collards,
  napa, red onion, rutabaga, daikon, red potato, cherry tomato, acorn squash,
  pumpkin, serrano/poblano/habanero, oyster mushroom, mint/rosemary/thyme/
  oregano/tarragon/dill, grapefruit, apple, pear, banana, watermelon, cantaloupe,
  blueberry, raspberry.
- **4b protein/seafood (17):** short-rib, ground-beef, lamb-shoulder, pork-belly,
  ground-pork, whole-turkey, ground-turkey, whole-halibut, whole-trout, scallops,
  whole-crab, octopus, clams, salmon skin-on fillet, squid, shrimp (head-on),
  shrimp (P&D).

## Next: stage + verify PRICE sources for the 47 new pages (founder, keyed)

Best-guess source terms from the panel, to confirm with `--list-commodities` /
`--discover` then `--verify --flip` (same flow as the 57-source pass):
- **Produce/herbs** → AMS terminal vegetable fan-out (reportId 2278 series),
  `commodity` = the plural English noun; a shared/distinct BLS PPI trend leg.
  Herbs & specialty mushrooms may be on a SEPARATE report — `--discover "herbs"`,
  `--discover "mushroom"`.
- **Fruit** → AMS terminal fruit fan-out (2277 series); confirm terms (AMS spells
  it "Cantaloups").
- **Beef cuts** → LMR 2453 (LM_XB403, Choice Cuts): "Short Rib", "Ground Beef".
  **Lamb** → the lamb report (same DISCOVER as the leg-of-lamb straggler).
- **Pork** → LMR 2498 (LM_PK602 cutout): `pork_belly` column; ground via BLS.
- **Turkey** → a SEPARATE AMS turkey report (not the 3646 chicken report) — DISCOVER.
- **Seafood** → NOAA FOSS by HTS prefix + name filter. **Honesty rule (panel):**
  NOAA import unit value runs BELOW true delivered wholesale — ship `basis:index`
  (TREND-only) for low-value lines (squid, clams, shrimp, snapper, sea bass) and a
  `basis:wholesale` LEVEL only for clean lines (halibut, trout, scallops, crab,
  octopus). Branzino/sea bass/snapper share a dead/diluted HTS — may have NO free
  price.

## Yield-gaps — restaurant-common, but NO `YIELD_TABLE` key (need a USDA FBG yield first)

Do NOT invent. Source each from the USDA Food Buying Guide and add to the table
(or ship with `yield_source:"usda-fbg"`), like yellow-squash/green-beans/okra/
artichoke/snow-peas already do.
- **Veg:** tomatillo, jicama, broccolini, broccoli-rabe, kohlrabi, celeriac,
  radicchio, escarole/endive/frisée, watercress, mustard/turnip greens, the
  non-jalapeño fresh chiles (anaheim/hatch/shishito), spaghetti/kabocha/delicata
  squash, fingerling/new potato, sugar-snap/english peas, edamame, specialty
  mushrooms (enoki/maitake/king-trumpet/chanterelle/morel), chives, sage.
- **Fruit (highest-leverage = the whole stone-fruit family):** peach, plum,
  cherry, apricot, nectarine; honeydew; grapes; blackberry; mandarin/tangerine,
  clementine; papaya, passion fruit, kiwi, pomegranate, fig, coconut.
- **Meat (highest-value = skirt steak + brisket):** skirt-steak, brisket, chuck,
  flank, flat-iron, top-sirloin; rack/loin/ground lamb; spare/baby-back ribs,
  fresh ham; chicken parts (wings, drumsticks, leg quarters, tenders, ground) —
  the National Chicken Report has clean rows but NO yield keys; veal (no keys).
- **Seafood fillet gap:** halibut/snapper/sea-bass/trout have whole-fish keys but
  NO fillet keys; cod, mahi, swordfish, sole/flounder, catfish, tilapia, mackerel,
  sardine, oyster have no key at all (tilapia/catfish/cod have clean HTS price
  paths — good once a yield lands).

## Hold / keep OUT (honesty or thin-content)

- **Dairy/cheese/pantry need NEW `CATEGORIES` buckets** (dairy, cheese, eggs, fat,
  pantry) with bilingual guides that say plainly "no trim loss — a price
  reference, not a yield story." Defer until that schema lands.
- **No free wholesale LEVEL** (ship directional/retail, clearly labeled, or skip):
  all cooking/finishing oils (olive, canola — mirror the vegetable-oil caveat);
  most cheeses except cheddar-block (parmesan is the one real 0.95-yield page);
  most fluid/cultured dairy; pantry dry goods (FRED retail level only).
- **Doorway risk:** cap egg variants at ~3 (large-brown, extra-large, cage-free);
  skip salt, unsalted-butter (dup of butter), tarragon/maitake/enoki (thin AMS
  volume → permanent low-confidence).

## The honest ceiling

After the FBG yield-gaps are closed and the 47 price sources verified, the index
covers essentially the full fresh-ingredient universe an independent US
restaurant orders. The remaining frontier is paid second feeds (CME/Urner
Barry/Mintec) to lift produce/seafood from medium→high, and a count↔weight
density feed (USDA FoodData Central) so count-unit pages can show live EP cost.
