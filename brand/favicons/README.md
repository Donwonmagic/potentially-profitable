# Favicons

Google Search, modern browsers, iOS Safari, and Android Chrome all
want favicon files in different formats and sizes. We keep the
master source as an SVG at `/brand/mark/mark-square-ink.svg` and
generate a full set of raster favicons from it.

## Why this matters

Google Search prefers PNG favicons at 48×48 or larger for its
search results display. If the only favicon on the site is an
SVG (which was the state before sprint 30b), Google's search
crawler often falls back to "no favicon" — which is exactly why
the Muntin Digital search result currently shows no icon next to
the URL. Google supports SVG favicons in the browser tab, but
the search-result favicon pipeline prefers raster.

The full PNG + ICO set has now been generated (ink variant, to
match the existing SVG mark) and lives in this directory. See
"Files expected" below for the current state. All 16 pages in
the site reference a canonical 6-line favicon block, standardized
in the "canonical favicon block" commit after the files landed.

Note: the previous version of this README asked for `favicon-48x48.png`
and `favicon-96x96.png`, but the favicon.io output doesn't ship
those sizes. Google Search is happy with 32×32 as the smallest
advertised PNG provided the SVG and apple-touch-icon (180×180)
are also present. The HTML references reflect the files that
actually exist, not the wishlist.

## Generation recipe (3 minutes, no install)

1. Go to **https://favicon.io/favicon-converter/**
2. Upload `/brand/mark/mark-square-ink.svg`
3. Click **Download** — favicon.io returns a zip with every
   format Google, Apple, and Android want.
4. Unzip the package. You'll see:
   - `favicon.ico`
   - `favicon-16x16.png`
   - `favicon-32x32.png`
   - `favicon-48x48.png`  ← critical for Google Search
   - `favicon-96x96.png`
   - `android-chrome-192x192.png`
   - `android-chrome-512x512.png`
   - `apple-touch-icon.png`  (180×180)
   - `site.webmanifest`
5. Drop every file **except `favicon.ico`** into this directory
   (`/brand/favicons/`).
6. Drop `favicon.ico` at the **repo root** (`/favicon.ico`).
   This is where browsers look by default when no other favicon
   tag is set. Old browsers, email clients, feed readers, and
   some link-preview scrapers still use this path.

## Files currently in place

```
/favicon.ico                                ← ink variant, 15 KB
/brand/favicons/
  favicon.ico                               ← ink variant, 15 KB
  favicon-16x16.png
  favicon-32x32.png
  android-chrome-192x192.png
  android-chrome-512x512.png
  apple-touch-icon.png                       (180×180)
  site.webmanifest
/brand/mark/favicon_cream/                  ← alternate (cream bg)
/brand/mark/favicon_ink/                    ← alternate (ink bg) — active
/brand/mark/favicon_teal/                   ← alternate (teal bg)
```

The ink variant was chosen as the active set because it matches
`/brand/mark/mark-square-ink.svg` (the SVG favicon already used
site-wide) — a cream glyph on an ink background. The cream and
teal variants are kept in `/brand/mark/favicon_*/` as brand
reference in case a future dark-mode or seasonal swap is needed.

The HTML is already wired to reference every one of these paths
on the homepage, so no additional code change is needed after
you commit the files.

## Adjust site.webmanifest (optional but recommended)

favicon.io's default manifest is bare. Replace its contents with
this brand-aware version before committing:

```json
{
  "name": "Muntin Digital",
  "short_name": "Muntin",
  "description": "Web design, branding, and social media for small businesses — handled by one person.",
  "icons": [
    {
      "src": "/brand/favicons/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/brand/favicons/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#1F4E5B",
  "background_color": "#FAF7F2",
  "display": "standalone",
  "start_url": "/"
}
```

The `theme_color` and `background_color` are pulled from the
Muntin design tokens in `/assets/site.css` — they match the rest
of the brand system so Android's PWA install experience feels
continuous with the site.

## Commit

```sh
git add favicon.ico brand/favicons/
git commit -m "Add favicon bundle generated from brand/mark SVG"
git push
```

## After it ships

Google Search takes **1–4 weeks** (sometimes longer) to pick up
a new favicon for an existing site, especially for a young
domain. You'll know it worked when a search for `muntin digital`
shows the window-mark glyph next to the result URL in the
search listing.

To speed up discovery after the files are live:

1. Open Google Search Console (see
   `/docs/search-console-setup.md`)
2. Use the URL Inspection tool on `https://muntin.digital/`
3. Click **Request indexing**
4. Wait — Google typically re-crawls and picks up the new
   favicon within 72 hours after a manual indexing request,
   though this is not guaranteed.
