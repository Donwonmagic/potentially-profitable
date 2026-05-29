# Pre-baked metro map tiles

This directory holds pre-baked static map tiles for the `map-radius`
Workshop Kit widget (`tools/_shared/workshop/map-radius.js`).

## Why pre-baked tiles

The suite's "no fetch, no storage, no account" posture rules out live
tile-server requests at runtime. Pre-baking lets the widget show a
real metro for the operator's city while still preserving zero
network requests from the lesson page.

Today the widget renders an SVG street-grid placeholder seeded from a
hash of the operator's address. The placeholder works (it conveys
scale, which is the actual pedagogical signal); the real tiles upgrade
the visual without changing any widget contract.

## File contract

Each metro ships as two files at this path:

```
brand/maps/<metro-slug>.webp
brand/maps/<metro-slug>.avif
```

- **Slug:** lowercase, dashes only. Matches an entry in
  `data/metros.json` (when that ships). Examples:
  `dc-silver-spring`, `nyc-brooklyn`, `la-westside`,
  `chicago-pilsen`, `seattle-capitol-hill`.
- **Dimensions:** 400×400 px source. The widget renders into a
  280×280 viewport, so 400×400 gives some retina headroom without
  blowing the file size.
- **Center:** the rough center of the named neighborhood. Operators
  will pick the closest metro slug; the radius circle overlays from
  the center regardless.
- **Style:** muted, low-contrast — the radius circle and the address
  pin marker need to read on top. Stamen Toner Lite or a similar
  muted reference style is the target.
- **Attribution:** if the source map data carries attribution
  requirements (OpenStreetMap does), bake the credit into the tile
  itself in the bottom-right corner at 9-10pt. The widget cannot
  carry attribution separately because the SVG fallback path doesn't
  need any.

## When real tiles ship

The widget's `buildStreetGrid()` function generates the SVG fallback
today. To activate a real tile:

1. Drop the matching `<metro-slug>.webp` here.
2. Add the slug to `data/metros.json` (when that file exists) with
   the substring patterns that should match it (e.g.
   `dc-silver-spring` matches addresses containing "Silver Spring",
   "Takoma Park", or "20910").
3. Update `map-radius.js` to detect the metro from the address and
   conditionally render a `<picture>` block instead of the SVG
   placeholder. The radius circle + address pin stay as SVG overlay
   `<circle>` elements positioned absolutely over the tile.

The widget contract (`deliveryRadius` in/out, palette accent tinting,
mtn:context-change subscription) is unchanged by the tile swap.

## Why this directory ships empty today

Building the tile pipeline requires:
- Picking a tile source (Stamen / OSM raster / Mapbox static API at
  free tier / MapTiler at free tier)
- Choosing the metro list — there's a long tail of independent
  restaurants in towns that won't be in any "top 50 US metros"
  list, and the SVG fallback is honest for those
- A refresh cadence — neighborhoods change, but tile re-bakes are
  cheap; once a year is plenty
- License clearance for whichever source's data ends up in the bake

None of those are blockers for the bootcamp launch — the widget
works without them. They become worth doing when there's signal that
operators want their real neighborhood instead of "a coherent
street-grid that's consistent for my address." Until then, this
README is the contract that downstream tile-bake work targets.
